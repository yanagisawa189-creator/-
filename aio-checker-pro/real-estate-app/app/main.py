from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlmodel import SQLModel, create_engine, Session, select
from typing import Optional, List
import os
import uvicorn
import json

from models import Property, MediaCopy, Asset, PropertyCreate, PropertyResponse
from services.copy_generator import CopyGenerator
from services.image_service import ImageService
from services.export_service import ExportService

DATABASE_URL = "sqlite:///./properties.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI(title="Real Estate Media Generator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create backend directory if it doesn't exist
os.makedirs("backend/static", exist_ok=True)

def get_session():
    with Session(engine) as session:
        yield session

async def save_pdf_file(pdf: UploadFile, property_id: int) -> str:
    """Save PDF file and return the file path"""
    # Create uploads directory if it doesn't exist
    pdf_dir = f"backend/static/pdfs/{property_id}"
    os.makedirs(pdf_dir, exist_ok=True)
    
    # Save PDF file
    pdf_path = f"{pdf_dir}/{pdf.filename}"
    with open(pdf_path, "wb") as buffer:
        content = await pdf.read()
        buffer.write(content)
    
    return pdf_path

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.post("/api/properties", response_model=PropertyResponse)
async def create_property(
    address: str = Form(...),
    price: int = Form(...),
    area_sqm: float = Form(...),
    built_year: int = Form(...),
    layout: str = Form(...),
    station: str = Form(...),
    walk_min: int = Form(...),
    pr: str = Form(...),
    images: List[UploadFile] = File(...),
    pdf: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    # Create property
    property_data = PropertyCreate(
        address=address,
        price=price,
        area_sqm=area_sqm,
        built_year=built_year,
        layout=layout,
        station=station,
        walk_min=walk_min,
        pr=pr
    )
    
    db_property = Property.model_validate(property_data)
    session.add(db_property)
    session.commit()
    session.refresh(db_property)
    
    # Save uploaded images
    image_service = ImageService()
    for image in images:
        if image.filename:
            asset_path = await image_service.save_original_image(image, db_property.id)
            asset = Asset(
                property_id=db_property.id,
                filename=image.filename,
                path=asset_path,
                media_type="original"
            )
            session.add(asset)
    
    # Save PDF if uploaded
    if pdf and pdf.filename:
        pdf_path = await save_pdf_file(pdf, db_property.id)
        pdf_asset = Asset(
            property_id=db_property.id,
            filename=pdf.filename,
            path=pdf_path,
            media_type="pdf"
        )
        session.add(pdf_asset)
    
    session.commit()
    
    return PropertyResponse(
        id=db_property.id,
        created_at=db_property.created_at
    )

@app.post("/api/properties/pdf", response_model=PropertyResponse)
async def create_property_from_pdf(
    pdf: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    # Create property with minimal data (PDF only)
    property_data = PropertyCreate(
        address="PDFから登録",
        price=0,
        area_sqm=0.0,
        built_year=2000,
        layout="未設定",
        station="未設定",
        walk_min=0,
        pr="PDFファイルから登録された物件です。"
    )
    
    db_property = Property.model_validate(property_data)
    session.add(db_property)
    session.commit()
    session.refresh(db_property)
    
    # Save PDF file
    if pdf.filename:
        pdf_path = await save_pdf_file(pdf, db_property.id)
        pdf_asset = Asset(
            property_id=db_property.id,
            filename=pdf.filename,
            path=pdf_path,
            media_type="pdf"
        )
        session.add(pdf_asset)
    
    session.commit()
    
    return PropertyResponse(
        id=db_property.id,
        created_at=db_property.created_at
    )

@app.post("/api/properties/{property_id}/generate")
async def generate_media_content(
    property_id: int,
    session: Session = Depends(get_session)
):
    # Get property
    property_obj = session.get(Property, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Generate copy for all media types
    copy_generator = CopyGenerator()
    image_service = ImageService()
    
    copies = {}
    images = {}
    
    # Generate text content
    for media_type in ["suumo", "homes", "instagram", "flyer"]:
        copy_content = copy_generator.generate_copy(property_obj, media_type)
        
        # Save to database (convert dict to JSON string)
        content_str = json.dumps(copy_content, ensure_ascii=False) if isinstance(copy_content, dict) else copy_content
        media_copy = MediaCopy(
            property_id=property_id,
            media_type=media_type,
            content=content_str
        )
        session.add(media_copy)
        copies[media_type] = copy_content
    
    # Process images for each media type
    original_assets = session.exec(select(Asset).where(
        Asset.property_id == property_id,
        Asset.media_type == "original"
    )).all()
    
    for asset in original_assets:
        for media_type in ["suumo", "homes", "instagram", "flyer"]:
            resized_path = await image_service.resize_for_media(asset.path, media_type, property_id)
            
            # Save resized image asset
            resized_asset = Asset(
                property_id=property_id,
                filename=f"{media_type}_{asset.filename}",
                path=resized_path,
                media_type=media_type
            )
            session.add(resized_asset)
            
            if media_type not in images:
                images[media_type] = []
            images[media_type].append(resized_path)
    
    session.commit()
    
    return {
        "status": "ok",
        "copies": copies,
        "images": images
    }

@app.get("/api/properties/{property_id}/export")
async def export_media_content(
    property_id: int,
    media: str,
    session: Session = Depends(get_session)
):
    property_obj = session.get(Property, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    export_service = ExportService()
    
    if media in ["suumo", "homes"]:
        # Export as CSV
        csv_content = export_service.export_csv(property_obj, media, session)
        
        return StreamingResponse(
            csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={media}_{property_id}.csv"}
        )
    
    elif media in ["instagram", "flyer"]:
        # Export as ZIP
        zip_buffer = export_service.export_zip(property_obj, media, session)
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={media}_{property_id}.zip"}
        )
    
    else:
        raise HTTPException(status_code=400, detail="Invalid media type")

@app.get("/api")
async def api_root():
    return {"message": "Real Estate Media Generator API"}

# Static files for images - mount after API routes
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Serve frontend static files for production - mount last
if os.path.exists("../static"):
    app.mount("/", StaticFiles(directory="../static", html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)