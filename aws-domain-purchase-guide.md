# AWS Route 53 ドメイン購入ガイド

## 概要
AWS CLI を使用してドメインを購入する完全ガイド

## 前提条件
- AWS CLI がインストールされていること
- AWS 認証情報が設定されていること
- 適切な IAM 権限があること

## 1. AWS CLI のインストール

### Windows
```bash
# MSIダウンロード
curl -L "https://awscli.amazonaws.com/AWSCLIV2.msi" -o AWSCLIV2.msi

# インストール
start AWSCLIV2.msi
```

### バージョン確認
```bash
aws --version
```

## 2. 認証情報の設定

### 方法1: 設定ファイル作成
```bash
# ディレクトリ作成
mkdir %USERPROFILE%\.aws

# 認証情報ファイル作成
echo [default] > %USERPROFILE%\.aws\credentials
echo aws_access_key_id = YOUR_ACCESS_KEY >> %USERPROFILE%\.aws\credentials
echo aws_secret_access_key = YOUR_SECRET_KEY >> %USERPROFILE%\.aws\credentials

# 設定ファイル作成
echo [default] > %USERPROFILE%\.aws\config
echo region = us-east-1 >> %USERPROFILE%\.aws\config
```

### 方法2: 環境変数
```powershell
$env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_KEY"
$env:AWS_DEFAULT_REGION = "us-east-1"
```

## 3. ドメイン利用可能性の確認

### 単一ドメインチェック
```bash
aws route53domains check-domain-availability --domain-name example.com
```

### 複数ドメインチェック (PowerShell)
```powershell
$domains = @("example.com", "example.net", "example.org")
foreach ($domain in $domains) {
    Write-Host "Checking $domain..."
    aws route53domains check-domain-availability --domain-name $domain
}
```

### 結果例
```json
{
    "Availability": "AVAILABLE"    # 利用可能
    "Availability": "UNAVAILABLE"  # 利用不可
}
```

## 4. ドメイン料金の確認

### TLD別料金確認
```bash
# .com ドメイン
aws route53domains list-prices --tld com

# .net ドメイン
aws route53domains list-prices --tld net

# .org ドメイン
aws route53domains list-prices --tld org
```

### 料金表 (2024年現在)
| TLD | 登録料金 | 更新料金 | 移管料金 | 復旧料金 |
|-----|----------|----------|----------|----------|
| .com | $15.00 | $15.00 | $15.00 | $57.00 |
| .net | $17.00 | $17.00 | $17.00 | $57.00 |
| .org | $15.00 | $15.00 | $15.00 | $57.00 |

## 5. ドメイン購入

### 必要な連絡先情報
- 名前 (姓・名)
- メールアドレス
- 電話番号 (国際形式: +81-90-1234-5678)
- 住所 (番地・建物名・市区町村・都道府県・郵便番号・国)
- 組織名 (任意)

### 連絡先情報JSON形式
```json
{
    "FirstName": "太郎",
    "LastName": "山田",
    "ContactType": "PERSON",
    "OrganizationName": "",
    "AddressLine1": "1-1-1 新宿区",
    "City": "東京",
    "State": "東京都",
    "CountryCode": "JP",
    "ZipCode": "160-0022",
    "PhoneNumber": "+81.901234567",
    "Email": "example@example.com"
}
```

### ドメイン購入コマンド
```bash
aws route53domains register-domain \
    --domain-name example.com \
    --duration-in-years 1 \
    --auto-renew \
    --privacy-protect-admin-contact \
    --privacy-protect-registrant-contact \
    --privacy-protect-tech-contact \
    --admin-contact file://contact.json \
    --registrant-contact file://contact.json \
    --tech-contact file://contact.json
```

### PowerShell版 (インライン)
```powershell
$contactInfo = @{
    FirstName = "太郎"
    LastName = "山田"
    ContactType = "PERSON"
    OrganizationName = ""
    AddressLine1 = "1-1-1 新宿区"
    City = "東京"
    State = "東京都"
    CountryCode = "JP"
    ZipCode = "160-0022"
    PhoneNumber = "+81.901234567"
    Email = "example@example.com"
} | ConvertTo-Json

aws route53domains register-domain `
    --domain-name example.com `
    --duration-in-years 1 `
    --auto-renew `
    --privacy-protect-admin-contact `
    --privacy-protect-registrant-contact `
    --privacy-protect-tech-contact `
    --admin-contact $contactInfo `
    --registrant-contact $contactInfo `
    --tech-contact $contactInfo
```

## 6. 登録状況の確認

### ドメイン一覧表示
```bash
aws route53domains list-domains
```

### 特定ドメインの詳細
```bash
aws route53domains get-domain-detail --domain-name example.com
```

### 登録操作の状況確認
```bash
aws route53domains list-operations
```

## 7. トラブルシューティング

### よくあるエラー
1. **認証エラー**: 認証情報を再確認
2. **権限エラー**: IAM権限を確認
3. **ドメイン利用不可**: 別のドメイン名を検討
4. **連絡先情報エラー**: 必須フィールドを確認

### 確認コマンド
```bash
# 認証情報確認
aws sts get-caller-identity

# 設定確認
aws configure list

# 権限確認
aws iam get-user
```

## 8. 購入後の設定

### DNS設定
ドメイン購入後は、Route 53 でホストゾーンを作成し、DNS レコードを設定する必要があります。

```bash
# ホストゾーン作成
aws route53 create-hosted-zone --name example.com --caller-reference $(date +%s)

# Aレコード追加例
aws route53 change-resource-record-sets --hosted-zone-id ZXXXXXXXXXXXXX --change-batch file://change-batch.json
```

## 注意事項
- ドメイン購入は即座に課金されます
- 購入後のキャンセルは通常できません
- プライバシー保護は自動で有効化されます
- 自動更新を有効にすることを推奨します

## セキュリティ考慮事項
- 認証情報を安全に管理してください
- 不要になった認証情報は削除してください
- 定期的にアクセスキーをローテーションしてください