from typing import Dict, Any
from datetime import datetime
import re

class CopyGenerator:
    def __init__(self):
        # プロンプトテンプレート（将来LLM統合用）
        self.prompts = {
            "suumo": """
物件情報を基に、SUUMO向けの物件紹介文を生成してください。
条件：
- 250〜300字
- 駅徒歩・生活利便・教育環境・担当コメントの順で記載
- 禁止語句チェック済み
            """,
            "homes": """
物件情報を基に、HOME'S向けの物件紹介文を生成してください。
条件：
- 箇条書き先行
- 上限200字×3ブロック構成
            """,
            "instagram": """
物件情報を基に、Instagram投稿用の文章を生成してください。
条件：
- 280〜350字
- ハッシュタグ10件自動生成（駅・エリア・価格帯・間取り由来）
            """,
            "flyer": """
物件情報を基に、紙チラシ向けのコピーを生成してください。
条件：
- 見出し20字以内
- サブコピー40字以内
- 箇条書き5点
            """
        }
    
    def generate_copy(self, property_obj, media_type: str) -> Dict[str, Any]:
        """媒体別のコピー生成"""
        
        if media_type == "suumo":
            return self._generate_suumo_copy(property_obj)
        elif media_type == "homes":
            return self._generate_homes_copy(property_obj)
        elif media_type == "instagram":
            return self._generate_instagram_copy(property_obj)
        elif media_type == "flyer":
            return self._generate_flyer_copy(property_obj)
        else:
            raise ValueError(f"Unsupported media type: {media_type}")
    
    def _generate_suumo_copy(self, property_obj) -> str:
        """SUUMO向けコピー生成（250-300字）"""
        
        # 築年数計算
        current_year = datetime.now().year
        age = current_year - property_obj.built_year
        
        # 価格を万円表示
        price_man = property_obj.price // 10000
        
        copy_text = f"""【{property_obj.layout}・{property_obj.area_sqm}㎡】{price_man}万円

{property_obj.station}駅徒歩{property_obj.walk_min}分の好立地！築{age}年の魅力的な物件です。

■駅徒歩・アクセス
{property_obj.station}駅まで徒歩{property_obj.walk_min}分と通勤・通学に便利な立地です。

■生活利便性
周辺にはコンビニ、スーパー、銀行などの生活に必要な施設が充実しており、日々の暮らしをサポートします。

■教育環境
小中学校が徒歩圏内にあり、子育て世代にも安心の住環境です。

■担当コメント
{property_obj.pr}。内見のご予約はお気軽にお問い合わせください。"""
        
        return self._trim_to_length(copy_text, 250, 300)
    
    def _generate_homes_copy(self, property_obj) -> str:
        """HOME'S向けコピー生成（箇条書き・200字×3ブロック）"""
        
        price_man = property_obj.price // 10000
        current_year = datetime.now().year
        age = current_year - property_obj.built_year
        
        # ブロック1: 基本情報
        block1 = f"""■物件概要
・間取り：{property_obj.layout}
・専有面積：{property_obj.area_sqm}㎡
・築年数：築{age}年
・価格：{price_man}万円"""
        
        # ブロック2: 立地・アクセス
        block2 = f"""■立地・アクセス
・最寄駅：{property_obj.station}
・駅徒歩：徒歩{property_obj.walk_min}分
・所在地：{property_obj.address}
・交通利便性抜群"""
        
        # ブロック3: 特徴・PR
        block3 = f"""■物件特徴
・{property_obj.pr}
・周辺環境良好
・即入居可能
・内見随時受付中"""
        
        # 各ブロックを200字以内に調整
        block1 = self._trim_to_length(block1, 0, 200)
        block2 = self._trim_to_length(block2, 0, 200)  
        block3 = self._trim_to_length(block3, 0, 200)
        
        return f"{block1}\n\n{block2}\n\n{block3}"
    
    def _generate_instagram_copy(self, property_obj) -> Dict[str, Any]:
        """Instagram向けコピー生成（280-350字 + ハッシュタグ）"""
        
        price_man = property_obj.price // 10000
        current_year = datetime.now().year
        age = current_year - property_obj.built_year
        
        # メインテキスト
        main_text = f"""🏠新着物件のご紹介🏠

📍{property_obj.address}
🚃{property_obj.station}駅 徒歩{property_obj.walk_min}分
💰{price_man}万円
📐{property_obj.layout} / {property_obj.area_sqm}㎡
🏗️築{age}年

✨物件のポイント✨
{property_obj.pr}

駅近で利便性抜群！生活施設も充実しており、快適な住環境をお約束します。

気になる方はDMまたはお電話でお気軽にお問い合わせください📞

#内見予約受付中 #即入居可能"""
        
        # ハッシュタグ生成
        hashtags = self._generate_hashtags(property_obj)
        
        # 文字数調整
        main_text = self._trim_to_length(main_text, 280, 350)
        
        return {
            "content": main_text,
            "hashtags": hashtags
        }
    
    def _generate_flyer_copy(self, property_obj) -> Dict[str, Any]:
        """紙チラシ向けコピー生成"""
        
        price_man = property_obj.price // 10000
        current_year = datetime.now().year
        age = current_year - property_obj.built_year
        
        # 見出し（20字以内）
        headline = f"{property_obj.layout}・{price_man}万円・駅近"
        headline = self._trim_to_length(headline, 0, 20)
        
        # サブコピー（40字以内）
        sub_copy = f"{property_obj.station}駅徒歩{property_obj.walk_min}分！築{age}年の魅力物件"
        sub_copy = self._trim_to_length(sub_copy, 0, 40)
        
        # 箇条書き5点
        bullet_points = [
            f"🏠 {property_obj.layout} / {property_obj.area_sqm}㎡",
            f"🚃 {property_obj.station}駅 徒歩{property_obj.walk_min}分",
            f"💰 価格：{price_man}万円",
            f"📅 築{age}年",
            f"✨ {property_obj.pr[:30]}..."  # PRポイントは30字で切る
        ]
        
        return {
            "headline": headline,
            "sub_copy": sub_copy,
            "bullet_points": bullet_points,
            "content": f"{headline}\n{sub_copy}\n\n" + "\n".join(bullet_points)
        }
    
    def _generate_hashtags(self, property_obj) -> list:
        """Instagram用ハッシュタグ生成"""
        
        hashtags = []
        
        # 駅名から
        station_clean = property_obj.station.replace('駅', '').replace('線', '')
        hashtags.append(f"#{station_clean}")
        hashtags.append(f"#{station_clean}駅")
        
        # エリア（住所から）
        if '市' in property_obj.address:
            city = property_obj.address.split('市')[0] + '市'
            hashtags.append(f"#{city.replace('府', '').replace('県', '')}")
        
        # 価格帯
        price_man = property_obj.price // 10000
        if price_man < 3000:
            hashtags.append("#2000万円台")
        elif price_man < 4000:
            hashtags.append("#3000万円台")
        else:
            hashtags.append(f"#{price_man//1000}000万円台")
        
        # 間取り
        hashtags.append(f"#{property_obj.layout}")
        
        # その他の固定タグ
        hashtags.extend([
            "#不動産",
            "#マイホーム", 
            "#新築",
            "#中古物件",
            "#住まい探し"
        ])
        
        return hashtags[:10]  # 最大10個
    
    def _trim_to_length(self, text: str, min_length: int, max_length: int) -> str:
        """指定文字数にテキストを調整"""
        
        if len(text) > max_length:
            # 改行や句読点で区切って調整
            lines = text.split('\n')
            result = ""
            for line in lines:
                if len(result + line) <= max_length:
                    result += line + '\n'
                else:
                    break
            text = result.rstrip()
        
        # 最小文字数に満たない場合は補完（実際のLLMでは不要）
        if min_length > 0 and len(text) < min_length:
            padding = "。" * (min_length - len(text))
            text += padding
        
        return text
    
    def _check_prohibited_words(self, text: str) -> bool:
        """禁止語句チェック（SUUMO用）"""
        prohibited = [
            "絶対", "完璧", "100%", "確実", "必ず",
            "最高", "最安", "最大", "業界一"
        ]
        
        for word in prohibited:
            if word in text:
                return False
        return True