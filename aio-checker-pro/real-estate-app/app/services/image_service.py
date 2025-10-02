from PIL import Image, ImageOps
from fastapi import UploadFile
import os
import uuid
import aiofiles
from typing import Tuple

class ImageService:
    def __init__(self):
        # 媒体別の画像サイズ設定
        self.media_sizes = {
            "suumo": (760, 570),
            "homes": (720, 540), 
            "instagram": (1080, 1080),
            "flyer": (2480, 3508)  # A4 300dpi approximation
        }
        
        # 保存ディレクトリの基準パス
        self.base_path = "backend/static/images"
        
        # ディレクトリが存在しない場合は作成
        for media_type in ["original"] + list(self.media_sizes.keys()):
            dir_path = os.path.join(self.base_path, media_type)
            os.makedirs(dir_path, exist_ok=True)
    
    async def save_original_image(self, upload_file: UploadFile, property_id: int) -> str:
        """オリジナル画像を保存"""
        
        # ファイル名生成（UUID + 拡張子）
        file_extension = os.path.splitext(upload_file.filename)[1]
        filename = f"{property_id}_{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(self.base_path, "original", filename)
        
        # ファイル保存
        async with aiofiles.open(file_path, 'wb') as f:
            content = await upload_file.read()
            await f.write(content)
        
        return file_path
    
    async def resize_for_media(self, original_path: str, media_type: str, property_id: int) -> str:
        """媒体別にリサイズした画像を生成"""
        
        if media_type not in self.media_sizes:
            raise ValueError(f"Unsupported media type: {media_type}")
        
        target_size = self.media_sizes[media_type]
        
        # オリジナル画像を開く
        with Image.open(original_path) as img:
            # EXIF情報に基づいて回転
            img = ImageOps.exif_transpose(img)
            
            # RGBモードに変換（JPEGで保存するため）
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # リサイズ処理
            resized_img = self._resize_image(img, target_size, media_type)
            
            # ファイル名生成
            original_filename = os.path.basename(original_path)
            name, ext = os.path.splitext(original_filename)
            filename = f"{media_type}_{name}.jpg"
            
            output_path = os.path.join(self.base_path, media_type, filename)
            
            # 保存
            resized_img.save(output_path, "JPEG", quality=85)
        
        return output_path
    
    def _resize_image(self, img: Image.Image, target_size: Tuple[int, int], media_type: str) -> Image.Image:
        """画像のリサイズ処理"""
        
        target_width, target_height = target_size
        original_width, original_height = img.size
        
        if media_type == "instagram":
            # Instagramは正方形にクロップ
            return self._crop_to_square(img, target_size[0])
        
        elif media_type == "flyer":
            # チラシは長辺を基準にリサイズ（アスペクト比維持）
            return self._resize_keeping_aspect(img, max(target_width, target_height))
        
        else:
            # SUUMO, HOME'Sは指定サイズに合わせてリサイズ（アスペクト比維持）
            return self._resize_to_fit(img, target_size)
    
    def _crop_to_square(self, img: Image.Image, size: int) -> Image.Image:
        """正方形にクロップ"""
        width, height = img.size
        
        # 短辺を基準にクロップ
        min_dimension = min(width, height)
        
        # 中央からクロップ
        left = (width - min_dimension) // 2
        top = (height - min_dimension) // 2
        right = left + min_dimension
        bottom = top + min_dimension
        
        cropped = img.crop((left, top, right, bottom))
        
        # 指定サイズにリサイズ
        return cropped.resize((size, size), Image.Resampling.LANCZOS)
    
    def _resize_keeping_aspect(self, img: Image.Image, max_size: int) -> Image.Image:
        """アスペクト比を保持してリサイズ（長辺基準）"""
        width, height = img.size
        
        if width > height:
            new_width = max_size
            new_height = int(height * max_size / width)
        else:
            new_height = max_size
            new_width = int(width * max_size / height)
        
        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    def _resize_to_fit(self, img: Image.Image, target_size: Tuple[int, int]) -> Image.Image:
        """指定サイズに合わせてリサイズ（アスペクト比維持、余白追加）"""
        
        # アスペクト比を保持してリサイズ
        img_resized = img.copy()
        img_resized.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # 余白を追加して指定サイズに合わせる
        new_img = Image.new('RGB', target_size, (255, 255, 255))  # 白い背景
        
        # 中央配置
        paste_x = (target_size[0] - img_resized.width) // 2
        paste_y = (target_size[1] - img_resized.height) // 2
        
        new_img.paste(img_resized, (paste_x, paste_y))
        
        return new_img
    
    def get_image_info(self, image_path: str) -> dict:
        """画像の情報を取得"""
        try:
            with Image.open(image_path) as img:
                return {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format,
                    "mode": img.mode,
                    "size_bytes": os.path.getsize(image_path)
                }
        except Exception as e:
            return {"error": str(e)}