# AIO表示チェックツール（自社開発）要件定義ドラフト v0.1

## 0. 背景・目的

* 検索結果における **AI Overviews（AIO）表示の有無**、および **自社ドメインがAIOの参照（引用・出典）に含まれているか** を、キーワード単位で継続監視する。
* 既存の順位計測（10〜100位）と合わせ、**トラフィック影響の大きいAIOの占有状況**をダッシュボード化し、**検知→通知→施策検証**までを素早く回す。

---

## 1. MVP範囲（最小実装）

**対象**

* エンジン：Google（日本/英語、PC・スマホ）＋ Yahoo! JAPAN（PC・スマホ）
* AIO検出はGoogleのみ／Yahoo!は順位のみ

**監視項目（1キーワード×1ロケーション×1デバイス）**

1. AIOの表示有無（Boolean）
2. AIOの「参照ソース」リスト（URL/ドメイン）
3. **自社ドメインの参照有無**（Boolean）
4. 参照に使われた **自社URL（複数可）**
5. 付随要素：AIO内テキスト長/見出し数/フォローアップ質問の有無（任意）
6. 通常SERPの **自社順位（上位10位〜100位）**（Google/Yahoo）
7. スクリーンショット（PNG）と取得HTML（Raw or DOM Snapshot）

**出力**

* 日次ジョブで上記メトリクスを保存（時系列）
* ダッシュボード：

  * AIO表示率（%）
  * 自社AIO参照率（%）
  * 変動アラート（AIO表示→非表示、参照追加/消失、順位変動）
* エクスポート：CSV/Googleスプレッドシート同期
* 通知：メール/Slack（閾値：AIO表示切替・自社参照の増減・順位±5）

---

## 2. データ入力（Googleスプレッドシート仕様）

**想定タブ**：`config_keywords`（監視設定）

**推奨カラム**

* `keyword`：検索クエリ
* `lang`：`ja` / `en` 等
* `location_type`：`country`/`state`/`city`/`zip`
* `location_value`：`Japan`/`Tokyo`/`Minato City`/`105-0023` など
* `device`：`desktop` / `mobile`
* `target_domains`：カンマ区切り（自社/重要ドメイン）
* `priority`：`H/M/L`
* `owner`：担当者
* `schedule`：`daily` `weekly` など
* `notes`：備考

**稼働中タブ（結果書き戻し）**：`daily_results`

* `run_at`（ISO8601）
* `keyword` / `lang` / `location` / `device`
* `aio_present`（true/false）
* `aio_sources`（`["https://siteA.com", ...]`）
* `own_cited`（true/false）
* `own_cited_urls`（`["https://own.com/page"]`）
* `serp_rank_top10`（任意 JSON）
* `screenshot_url`（ストレージの署名URL）
* `html_snapshot_url`（任意）
* `job_status`（`ok`/`partial`/`fail`）
* `error_message`（任意）

> ※実シートに既存カラムがある場合はマッピング表で吸収（後述）。

---

## 3. 検知ロジック（高レベル）

1. 取得API/モードの選択（ベンダー：SerpAPI/DataForSEO/Bright Data/Apify等）
2. レスポンスにおける **AIOセクション構造** の抽出
3. AIOが返す **参照URLリスト** の正規化（`https://`,`http://`,`www.` の統一）
4. `target_domains` と照合して **自社参照フラグ** 算出
5. 取得失敗時の再試行/バックオフ
6. 結果をデータストアへ保存、スクショも同時保存

**補助ロジック**

* AIOのバリエーション（オーバービュー/ナレッジグラフ内/People Also Ask内）識別
* 「AIOが載る条件の偏り」（疑問文、YMYL、取扱トピック）を別途指標に格納（任意）

---

## 4. システム構成案

### 4.1 ベンダーAPI利用（推奨MVP：Google/Yahoo）

* 取得：SerpAPI / DataForSEO / Bright Data / Apify（AIO対応とYahoo対応を比較選定）
* バックエンド：Cloud Run / AWS Lambda / Vercel Cron など
* ジョブ：Cloud Scheduler / EventBridge / Vercel Cron
* データ：BigQuery / PostgreSQL
* ファイル：Cloud Storage / S3
* 連携：Google Sheets API
* 監視：Cloud Logging + Slack

### 4.2 LLM回答可視化（拡張モジュール / 任意）

**目的**：ChatGPT / Gemini / Claude が**ウェブに根拠づけた回答**を返す際の**引用URL**に、自社ドメインが含まれるかを確認・時系列化する。

**対応方針**

* **Gemini**：**Grounding with Google Search** をAPIで有効化し、レスポンスの**引用（citations）**を解析 → 自社ドメイン照合。
* **Claude**：**Web Search API** を有効化し、返却される**ソース/引用メタ**を解析 → 自社ドメイン照合。
* **ChatGPT（OpenAI）**：製品としては**Web検索に対応**。ただし**公的に安定提供される検索APIの可用性は限定的/変動**。

  * 選択肢A：Responses APIの**web searchツール（提供アカウント限定/プレビュー）**が利用可能な場合はそれを使用し、**annotations（URL）**を抽出。
  * 選択肢B：UI自動化は**ToS/安定性の観点で非推奨**。代替として Bing/Brave/Perplexity等の**検索API**で"近似指標"を取得（※ChatGPT固有の表示ではない点を明記）。

**出力スキーマ（例）**

* `llm_engine`: `gemini` / `claude` / `chatgpt`
* `llm_answer_present`: true/false
* `llm_citations`: `["https://...", ...]`
* `llm_own_cited`: true/false
* `llm_excerpt`: 回答先頭200字
* `llm_run_meta`: モデル名/パラメータ/ツール有効化有無

**注意**：各社API/利用規約に準拠（UIスクレイピング・多量アクセスは不可）。

---

## 5. ダッシュボード（UX要件）

* **キーワード一覧**：エンジン/デバイス（Google/Yahoo × PC/スマホ）でフィルタ、AIO表示（●/–）、自社参照（★/–）、直近N回のスパークライン
* **キーワード詳細**：

  * タイムライン（AIO presence / own cited の2系列）
  * 参照ドメインのランキング（頻度順）
  * スクリーンショット/HTMLスニペット
* **アラートセンター**：AIO表示の新規発生/消失、自社参照の新規獲得/喪失

---

## 6. データモデル（ER簡易）

* `Keyword`（id, keyword, lang, default_location, default_device, priority, owner）
* `Location`（id, type, value, country_code）
* `Run`（id, run_at, engine, device, location_id）
* `Result`（id, run_id, keyword_id, aio_present, own_cited, meta_json, screenshot_path, html_path, status, error）
* `AioSource`（id, result_id, domain, url）

---

## 7. スプレッドシート ⇄ DB マッピング（例）

| Sheet列         | DBフィールド                         | 変換               |
| -------------- | ------------------------------- | ---------------- |
| keyword        | Keyword.keyword                 | そのまま             |
| lang           | Keyword.lang                    | ISO              |
| location_type  | Location.type                   | 正規化              |
| location_value | Location.value                  | 正規化              |
| device         | Run.device                      | `desktop/mobile` |
| target_domains | Result.meta_json.target_domains | 配列化              |
| priority       | Keyword.priority                | `H/M/L`          |
| owner          | Keyword.owner                   | そのまま             |

---

## 8. 運用・SLO

* 可用性：日次バッチ成功率 ≥ 99%
* 再試行：HTTP 5xx は指数バックオフ最大3回
* タイムアウト：取得1件あたり ≤ 20秒
* 正確性：AIO参照URLの抽出再現率 ≥ 98%（サンプル監査）

---

## 9. コスト試算（概略）

* ベンダーAPI：`単価 × 取得回数（KW×ロケ×デバイス×頻度）`
* ストレージ：スクショPNG（150–300KB/枚）× 日次 × 保持30–90日
* ダッシュボード：既存BI（Looker Studio/Metabase）か内製

---

## 10. リスクと対応

* **仕様変動**：AIO DOMや提供範囲が変わる → ベンダーAPIを優先、抽象化レイヤで吸収
* **地域/言語によるAIO供給差**：日本語/特定地域での露出率差 → 観測値を別指標として保存
* **法務/ToS**：自前取得時は必ずレビュー。スロットリング・robots・法令順守を徹底

---

## 11. 次アクション

1. 監視対象を **シート`config_keywords`** に集約（列は本ドラフト準拠 or マッピング表作成）
2. ベンダーAPIの選定（試用アカウント取得）
3. 10〜20KWでPoC（2週間）→ 精度/コスト/運用手当を評価
4. ダッシュボード雛形の共有 → フィードバック反映

---

## 付録A：結果JSONスキーマ例

```json
{
  "run_at": "2025-09-26T00:15:00+09:00",
  "engine": "google",
  "device": "mobile",
  "lang": "ja",
  "location": {"type": "city", "value": "Minato City"},
  "keyword": "エクサージュ海岸 小顔エステ",
  "aio": {
    "present": true,
    "sources": [
      {"url": "https://example.com/post1", "domain": "example.com"},
      {"url": "https://another.jp/a", "domain": "another.jp"}
    ],
    "own_cited": true,
    "own_urls": ["https://own.jp/blog/aio"]
  },
  "serp": {
    "rank": 3,
    "top100": [
      {"rank": 1, "domain": "own.jp", "url": "https://own.jp/"},
      {"rank": 2, "domain": "competitor.jp", "url": "https://competitor.jp/x"},
      {"rank": 3, "domain": "own.jp", "url": "https://own.jp/blog/aio"}
    ]
  },
  "assets": {"screenshot": "gs://bucket/2025-09-26/xxx.png", "html": null},
  "status": "ok",
  "error": null
}
```

※Yahoo! JAPAN の場合は `engine` を `yahoo` にし、`aio` を `null`（または省略）として保存します。

## 付録B：アラート条件例

* `aio.present` が **false→true** に変化
* `aio.own_cited` が **true→false** に変化
* `aio.sources` に **新規ドメインが追加**（監視リストに合致）

---

> v0.1（初版）：実シートの列構成を確認後、マッピング表と画面モックを追記予定。