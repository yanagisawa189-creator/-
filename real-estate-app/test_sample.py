#!/usr/bin/env python3
"""
不動産媒体自動化ツールの動作確認スクリプト

使用方法:
1. Backend起動後に実行
2. テスト画像を用意して実行

python test_sample.py
"""

import requests
import json
from pathlib import Path

# APIベースURL
API_BASE_URL = "http://localhost:8000/api"

def test_property_creation():
    """物件登録のテスト"""
    print("🏠 物件登録テスト開始...")
    
    # サンプルデータ
    property_data = {
        "address": "京都府城陽市寺田水度坂",
        "price": "32800000",
        "area_sqm": "92.3",
        "built_year": "2001",
        "layout": "3LDK",
        "station": "奈良線 城陽",
        "walk_min": "12",
        "pr": "南向き・日当たり良好／小中学校が徒歩圏／買物施設充実"
    }
    
    # ダミー画像ファイル作成（テスト用）
    test_image_data = b"dummy image data for testing"
    files = [
        ("images", ("test1.jpg", test_image_data, "image/jpeg")),
        ("images", ("test2.jpg", test_image_data, "image/jpeg"))
    ]
    
    try:
        response = requests.post(f"{API_BASE_URL}/properties", data=property_data, files=files)
        
        if response.status_code == 200:
            result = response.json()
            property_id = result["id"]
            print(f"✅ 物件登録成功 - ID: {property_id}")
            return property_id
        else:
            print(f"❌ 物件登録失敗 - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ サーバーに接続できません。Backendが起動していることを確認してください。")
        return None
    except Exception as e:
        print(f"❌ エラー: {e}")
        return None

def test_content_generation(property_id):
    """コンテンツ生成のテスト"""
    print(f"\n📝 メディアコンテンツ生成テスト開始... (物件ID: {property_id})")
    
    try:
        response = requests.post(f"{API_BASE_URL}/properties/{property_id}/generate")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ コンテンツ生成成功")
            
            # 各媒体のコンテンツを確認
            for media_type, content in result["copies"].items():
                print(f"\n📋 {media_type.upper()}:")
                if isinstance(content, dict):
                    print(json.dumps(content, ensure_ascii=False, indent=2)[:200] + "...")
                else:
                    print(str(content)[:200] + "...")
            
            return True
        else:
            print(f"❌ コンテンツ生成失敗 - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def test_export(property_id):
    """エクスポート機能のテスト"""
    print(f"\n📊 エクスポート機能テスト開始... (物件ID: {property_id})")
    
    media_types = ["suumo", "homes", "instagram", "flyer"]
    
    for media_type in media_types:
        try:
            response = requests.get(f"{API_BASE_URL}/properties/{property_id}/export", 
                                  params={"media": media_type})
            
            if response.status_code == 200:
                extension = "csv" if media_type in ["suumo", "homes"] else "zip"
                print(f"✅ {media_type} エクスポート成功 ({extension}形式)")
                
                # ファイルサイズ確認
                content_length = len(response.content)
                print(f"   ファイルサイズ: {content_length} bytes")
                
            else:
                print(f"❌ {media_type} エクスポート失敗 - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {media_type} エクスポートエラー: {e}")

def main():
    print("🚀 不動産媒体自動化ツール 動作確認開始")
    print("=" * 50)
    
    # 1. 物件登録テスト
    property_id = test_property_creation()
    if not property_id:
        print("\n❌ 物件登録に失敗したため、テストを中止します。")
        return
    
    # 2. コンテンツ生成テスト
    if not test_content_generation(property_id):
        print("\n❌ コンテンツ生成に失敗しました。")
        return
    
    # 3. エクスポート機能テスト
    test_export(property_id)
    
    print("\n" + "=" * 50)
    print("🎉 全ての動作確認が完了しました！")
    print(f"📝 生成結果は http://localhost:5173/properties/{property_id} で確認できます")

if __name__ == "__main__":
    main()