import csv
import json
import zipfile
import yaml
from io import StringIO, BytesIO
from typing import Dict, Any
from sqlmodel import Session
from models import Property, MediaCopy, Asset
import os

class ExportService:
    def __init__(self):
        # 媒体別CSVカラムマッピング
        self.csv_mappings = self._load_csv_mappings()
    
    def _load_csv_mappings(self) -> Dict[str, Dict]:
        """CSVマッピングファイルを読み込み（または初期値を返す）"""
        
        # デフォルトマッピング
        default_mappings = {
            "suumo": {
                "columns": [
                    {"csv_column": "物件名", "property_field": "address"},
                    {"csv_column": "価格", "property_field": "price", "format": "万円"},
                    {"csv_column": "面積", "property_field": "area_sqm", "format": "㎡"},
                    {"csv_column": "間取り", "property_field": "layout"},
                    {"csv_column": "築年", "property_field": "built_year", "format": "築{value}年"},
                    {"csv_column": "最寄駅", "property_field": "station"},
                    {"csv_column": "徒歩分数", "property_field": "walk_min", "format": "徒歩{value}分"},
                    {"csv_column": "PR文", "property_field": "copy_content"},
                    {"csv_column": "画像パス1", "property_field": "image_path_1"},
                    {"csv_column": "画像パス2", "property_field": "image_path_2"},
                    {"csv_column": "画像パス3", "property_field": "image_path_3"}
                ]
            },
            "homes": {
                "columns": [
                    {"csv_column": "タイトル", "property_field": "address"},
                    {"csv_column": "販売価格", "property_field": "price"},
                    {"csv_column": "専有面積", "property_field": "area_sqm"},
                    {"csv_column": "間取詳細", "property_field": "layout"},
                    {"csv_column": "築年数", "property_field": "built_year"},
                    {"csv_column": "交通1", "property_field": "station"},
                    {"csv_column": "交通1徒歩", "property_field": "walk_min"},
                    {"csv_column": "物件PR", "property_field": "copy_content"},
                    {"csv_column": "写真1", "property_field": "image_path_1"},
                    {"csv_column": "写真2", "property_field": "image_path_2"},
                    {"csv_column": "写真3", "property_field": "image_path_3"}
                ]
            }
        }
        
        # mapping.yamlファイルが存在すれば読み込み
        mapping_file = "app/services/mapping.yaml"
        if os.path.exists(mapping_file):
            try:
                with open(mapping_file, 'r', encoding='utf-8') as f:
                    return yaml.safe_load(f)
            except Exception:
                pass
        
        # デフォルトを保存
        self._save_csv_mappings(default_mappings)
        return default_mappings
    
    def _save_csv_mappings(self, mappings: Dict[str, Dict]):
        """CSVマッピングをYAMLファイルに保存"""
        os.makedirs("app/services", exist_ok=True)
        
        with open("app/services/mapping.yaml", 'w', encoding='utf-8') as f:
            yaml.safe_dump(mappings, f, default_flow_style=False, allow_unicode=True)
    
    def export_csv(self, property_obj: Property, media_type: str, session: Session) -> StringIO:
        """CSV形式でエクスポート"""
        
        if media_type not in self.csv_mappings:
            raise ValueError(f"Unsupported media type for CSV: {media_type}")
        
        mapping = self.csv_mappings[media_type]
        
        # データを準備
        data = self._prepare_export_data(property_obj, media_type, session)
        
        # CSVを生成
        output = StringIO()
        writer = csv.writer(output)
        
        # ヘッダー行
        headers = [col["csv_column"] for col in mapping["columns"]]
        writer.writerow(headers)
        
        # データ行
        row_data = []
        for col_info in mapping["columns"]:
            field_name = col_info["property_field"]
            format_str = col_info.get("format")
            
            if field_name in data:
                value = data[field_name]
                
                # フォーマット適用
                if format_str and "{value}" in format_str:
                    if field_name == "price" and format_str == "万円":
                        value = f"{int(value / 10000)}万円"
                    else:
                        value = format_str.format(value=value)
                
                row_data.append(str(value))
            else:
                row_data.append("")
        
        writer.writerow(row_data)
        
        output.seek(0)
        return output
    
    def export_zip(self, property_obj: Property, media_type: str, session: Session) -> BytesIO:
        """ZIP形式でエクスポート（Instagram/チラシ用）"""
        
        data = self._prepare_export_data(property_obj, media_type, session)
        
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            if media_type == "instagram":
                # Instagram用のファイル構成
                self._add_instagram_files(zip_file, data)
            elif media_type == "flyer":
                # チラシ用のファイル構成
                self._add_flyer_files(zip_file, data)
        
        zip_buffer.seek(0)
        return zip_buffer
    
    def _add_instagram_files(self, zip_file: zipfile.ZipFile, data: Dict[str, Any]):
        """Instagram用のファイルをZIPに追加"""
        
        # post.txt（メイン投稿文）
        if "copy_content" in data and isinstance(data["copy_content"], dict):
            post_content = data["copy_content"].get("content", "")
        else:
            post_content = str(data.get("copy_content", ""))
        
        zip_file.writestr("post.txt", post_content)
        
        # hashtags.txt（ハッシュタグ）
        hashtags = []
        if "copy_content" in data and isinstance(data["copy_content"], dict):
            hashtags = data["copy_content"].get("hashtags", [])
        
        hashtags_text = "\n".join(hashtags)
        zip_file.writestr("hashtags.txt", hashtags_text)
        
        # 画像ファイル
        self._add_images_to_zip(zip_file, data, "instagram")
    
    def _add_flyer_files(self, zip_file: zipfile.ZipFile, data: Dict[str, Any]):
        """チラシ用のファイルをZIPに追加"""
        
        # copy.txt（コピー文）
        copy_content = data.get("copy_content", "")
        if isinstance(copy_content, dict):
            copy_text = f"【見出し】\n{copy_content.get('headline', '')}\n\n"
            copy_text += f"【サブコピー】\n{copy_content.get('sub_copy', '')}\n\n"
            copy_text += f"【特徴】\n"
            for point in copy_content.get("bullet_points", []):
                copy_text += f"• {point}\n"
        else:
            copy_text = str(copy_content)
        
        zip_file.writestr("copy.txt", copy_text)
        
        # 画像ファイル
        self._add_images_to_zip(zip_file, data, "flyer")
    
    def _add_images_to_zip(self, zip_file: zipfile.ZipFile, data: Dict[str, Any], media_type: str):
        """画像ファイルをZIPに追加"""
        
        img_dir = "img/"
        
        for i in range(1, 6):  # 最大5枚まで
            image_key = f"image_path_{i}"
            if image_key in data and data[image_key]:
                image_path = data[image_key]
                
                if os.path.exists(image_path):
                    # ファイル名を生成
                    filename = f"image_{i}{os.path.splitext(image_path)[1]}"
                    
                    # ZIPに追加
                    with open(image_path, 'rb') as img_file:
                        zip_file.writestr(img_dir + filename, img_file.read())
    
    def _prepare_export_data(self, property_obj: Property, media_type: str, session: Session) -> Dict[str, Any]:
        """エクスポート用データを準備"""
        
        # 基本物件データ
        data = {
            "address": property_obj.address,
            "price": property_obj.price,
            "area_sqm": property_obj.area_sqm,
            "built_year": property_obj.built_year,
            "layout": property_obj.layout,
            "station": property_obj.station,
            "walk_min": property_obj.walk_min,
            "pr": property_obj.pr
        }
        
        # コピー文を取得
        media_copy = session.query(MediaCopy).filter(
            MediaCopy.property_id == property_obj.id,
            MediaCopy.media_type == media_type
        ).first()
        
        if media_copy:
            try:
                # JSONとして解析を試行
                data["copy_content"] = json.loads(media_copy.content)
            except json.JSONDecodeError:
                # 文字列として扱う
                data["copy_content"] = media_copy.content
        
        # 画像パスを取得
        assets = session.query(Asset).filter(
            Asset.property_id == property_obj.id,
            Asset.media_type == media_type
        ).all()
        
        for i, asset in enumerate(assets[:5], 1):  # 最大5枚
            data[f"image_path_{i}"] = asset.path
        
        return data
    
    def export_json(self, property_obj: Property, media_type: str, session: Session) -> str:
        """JSON形式でエクスポート"""
        
        data = self._prepare_export_data(property_obj, media_type, session)
        
        # メタデータを追加
        export_data = {
            "property_id": property_obj.id,
            "media_type": media_type,
            "exported_at": property_obj.created_at.isoformat(),
            "data": data
        }
        
        return json.dumps(export_data, ensure_ascii=False, indent=2)