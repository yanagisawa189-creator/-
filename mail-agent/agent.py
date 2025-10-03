import os, re, base64
from email.utils import parseaddr
from dotenv import load_dotenv
from anthropic import Anthropic
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

load_dotenv()
FILTERS = os.getenv("FILTER_KEYWORDS", "注文,納期").split(",")
SIGN = os.getenv("REPLY_SIGNATURE", "")
CLAUDE_PROMPT = os.getenv("CLAUDE_PROMPT", "")

def get_gmail_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json","w") as f: f.write(creds.to_json())
    return build("gmail","v1", credentials=creds)

def search_threads(service):
    # 直近未読×キーワード（必要に応じて調整）
    query = 'is:unread newer_than:7d'
    results = service.users().threads().list(userId="me", q=query, maxResults=10).execute()
    return results.get("threads", [])

def fetch_last_message(service, thread_id):
    th = service.users().threads().get(userId="me", id=thread_id, format="full").execute()
    msg = th["messages"][-1]
    headers = {h["name"].lower(): h["value"] for h in msg["payload"]["headers"]}
    subject = headers.get("subject","(no subject)")
    sender = headers.get("from","")
    # プレーン本文抽出（簡易）
    parts = msg["payload"].get("parts") or []
    body_data = msg["payload"].get("body", {}).get("data")
    if not body_data and parts:
        for p in parts:
            if p.get("mimeType") == "text/plain" and p["body"].get("data"):
                body_data = p["body"]["data"]; break
    text = base64.urlsafe_b64decode((body_data or "").encode()).decode("utf-8", errors="ignore")
    return subject, sender, text

def contains_keywords(text):
    t = text.lower()
    return any(k.lower() in t for k in FILTERS)

def build_reply_with_claude(subject, sender, body):
    # テスト用固定返信文（Claude APIキーがない場合）
    test_reply = f"""お世話になっております。

{subject}の件について承知いたしました。

商品の詳細や納期につきまして、担当者より別途ご連絡させていただきます。
ご不明な点がございましたら、お気軽にお申し付けください。

何かご質問等ございましたら、遠慮なくお申し付けください。

{SIGN}

【テスト用自動返信】"""

    print(f"Generated test reply for: {subject}")
    return test_reply

def create_gmail_draft(service, to_addr, subject, body):
    from email.mime.text import MIMEText
    mime = MIMEText(body, "plain", "utf-8")
    mime["to"] = parseaddr(to_addr)[1]
    mime["subject"] = f"Re: {subject}"
    raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()
    service.users().drafts().create(userId="me", body={"message":{"raw":raw}}).execute()

def main():
    svc = get_gmail_service()
    threads = search_threads(svc)
    print(f"Found {len(threads)} unread threads")

    for th in threads:
        subject, sender, body = fetch_last_message(svc, th["id"])
        print(f"Checking: {subject[:50]}...")
        print(f"Sender: {sender}")
        print(f"Subject: {subject}")
        print(f"Body preview: {body[:200]}...")
        print(f"Keywords found: {contains_keywords(subject + ' ' + body)}")
        print("---")

        if not contains_keywords(subject + " " + body):
            continue

        print(f"Processing: {subject}")
        reply = build_reply_with_claude(subject, sender, body)
        create_gmail_draft(svc, sender, subject, reply)
        # 既読化＋ラベル等は任意
        svc.users().threads().modify(userId="me", id=th["id"], body={"removeLabelIds":["UNREAD"]}).execute()
        print(f"Draft created for: {subject}")

if __name__ == "__main__":
    main()