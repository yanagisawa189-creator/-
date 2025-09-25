#!/usr/bin/env python3
"""
営業リスト自動生成エージェント - Webアプリケーション
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from threading import Thread
import logging

from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash, session
from flask_socketio import SocketIO, emit
import eventlet

# 親ディレクトリのsrcをパスに追加
current_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
src_dir = os.path.join(parent_dir, 'src')
config_dir = os.path.join(parent_dir, 'config')

sys.path.insert(0, src_dir)
sys.path.insert(0, parent_dir)

from main import SalesLeadGenerator
from models import SearchQuery, BusinessSize
from config.config import config

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flaskアプリ初期化
app = Flask(__name__)
app.secret_key = 'sales-lead-generator-secret-key'  # 本番環境では変更してください
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# グローバル変数
current_job = None
job_results = {}

class WebJobManager:
    """ウェブジョブの管理クラス"""

    def __init__(self):
        self.current_job_id = None
        self.job_status = {}
        self.job_results = {}

    def start_job(self, job_id, search_params):
        """ジョブを開始"""
        self.current_job_id = job_id
        self.job_status[job_id] = {
            'status': 'running',
            'progress': 0,
            'message': '検索を開始しています...',
            'start_time': datetime.now(),
            'search_params': search_params
        }

        # バックグラウンドでジョブを実行
        eventlet.spawn(self._run_job_async, job_id, search_params)

    def _run_job_async(self, job_id, search_params):
        """非同期でジョブを実行"""
        try:
            # ジョブの進行状況を更新しながら実行
            self._emit_progress(job_id, 10, "検索エンジンを初期化しています...")

            generator = SalesLeadGenerator()

            self._emit_progress(job_id, 20, "検索を実行中...")

            # 検索パラメータを取得
            industry = search_params.get('industry', '')
            location = search_params.get('location', '')
            keywords = search_params.get('keywords', [])
            max_results = search_params.get('max_results', 20)

            # 非同期で実行
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            result = loop.run_until_complete(
                generator.generate_leads(
                    industry=industry,
                    location=location,
                    additional_keywords=keywords,
                    max_results=max_results,
                    export_formats=['csv'],
                    sync_to_crm=False
                )
            )

            loop.close()

            if result.get('success'):
                self.job_status[job_id].update({
                    'status': 'completed',
                    'progress': 100,
                    'message': f'完了！{result.get("leads_count", 0)}件のリードを取得しました。',
                    'end_time': datetime.now()
                })
                self.job_results[job_id] = result

                self._emit_progress(job_id, 100, "完了！結果を表示しています...")
                socketio.emit('job_completed', {
                    'job_id': job_id,
                    'result': result
                })
            else:
                self.job_status[job_id].update({
                    'status': 'error',
                    'progress': 0,
                    'message': f'エラー: {result.get("error", "不明なエラー")}',
                    'end_time': datetime.now()
                })

                socketio.emit('job_error', {
                    'job_id': job_id,
                    'error': result.get('error', '不明なエラー')
                })

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}", exc_info=True)
            self.job_status[job_id].update({
                'status': 'error',
                'progress': 0,
                'message': f'システムエラー: {str(e)}',
                'end_time': datetime.now()
            })

            socketio.emit('job_error', {
                'job_id': job_id,
                'error': str(e)
            })

    def _emit_progress(self, job_id, progress, message):
        """進行状況をWebSocketで送信"""
        self.job_status[job_id].update({
            'progress': progress,
            'message': message
        })

        socketio.emit('job_progress', {
            'job_id': job_id,
            'progress': progress,
            'message': message
        })

    def get_job_status(self, job_id):
        """ジョブの状態を取得"""
        return self.job_status.get(job_id)

    def get_job_result(self, job_id):
        """ジョブの結果を取得"""
        return self.job_results.get(job_id)

# ジョブマネージャーのインスタンス
job_manager = WebJobManager()

@app.route('/')
def index():
    """メインページ"""
    return render_template('index.html')

@app.route('/search')
def search():
    """検索ページ"""
    return render_template('search.html')

@app.route('/api/search', methods=['POST'])
def api_search():
    """検索API"""
    try:
        data = request.get_json()

        # バリデーション
        if not data.get('industry') or not data.get('location'):
            return jsonify({'error': '業種と地域は必須です'}), 400

        # ジョブIDを生成
        job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # 検索パラメータを準備
        search_params = {
            'industry': data.get('industry'),
            'location': data.get('location'),
            'keywords': data.get('keywords', []),
            'max_results': min(data.get('max_results', 20), 100)  # 最大100件に制限
        }

        # ジョブを開始
        job_manager.start_job(job_id, search_params)

        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': '検索を開始しました'
        })

    except Exception as e:
        logger.error(f"Search API error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/job/<job_id>/status')
def api_job_status(job_id):
    """ジョブ状態取得API"""
    status = job_manager.get_job_status(job_id)
    if not status:
        return jsonify({'error': 'ジョブが見つかりません'}), 404

    return jsonify(status)

@app.route('/api/job/<job_id>/result')
def api_job_result(job_id):
    """ジョブ結果取得API"""
    result = job_manager.get_job_result(job_id)
    if not result:
        return jsonify({'error': '結果が見つかりません'}), 404

    return jsonify(result)

@app.route('/results/<job_id>')
def results(job_id):
    """結果表示ページ"""
    result = job_manager.get_job_result(job_id)
    if not result:
        flash('結果が見つかりませんでした')
        return redirect(url_for('index'))

    return render_template('results.html', result=result, job_id=job_id)

@app.route('/api/download/<job_id>/<format>')
def api_download(job_id, format):
    """ダウンロードAPI"""
    try:
        result = job_manager.get_job_result(job_id)
        if not result or not result.get('success'):
            return jsonify({'error': '結果が見つかりません'}), 404

        export_files = result.get('export_results', {})

        if format == 'csv' and 'csv' in export_files:
            file_path = export_files['csv']
            if os.path.exists(file_path):
                return send_file(
                    file_path,
                    as_attachment=True,
                    download_name=f'sales_leads_{job_id}.csv',
                    mimetype='text/csv'
                )

        return jsonify({'error': '指定された形式のファイルが見つかりません'}), 404

    except Exception as e:
        logger.error(f"Download error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/settings')
def settings():
    """設定ページ"""
    # API キーの状態をチェック
    api_status = {
        'claude': bool(config.claude.api_key),
        'google': bool(config.search.google_api_key),
        'serpapi': bool(config.search.serpapi_key),
    }

    return render_template('settings.html', api_status=api_status)

@app.route('/demo')
def demo():
    """デモページ（モックデータ使用）"""
    return render_template('demo.html')

@app.route('/api/demo', methods=['POST'])
def api_demo():
    """デモAPI（モックデータ）"""
    import time
    from models import CompanyInfo, ScoredLead
    from scorer import LeadScorer, ScoreAnalyzer

    try:
        # モックデータでデモを実行
        time.sleep(1)  # 処理時間をシミュレート

        # モック企業データ
        companies = [
            CompanyInfo(
                company_name="株式会社テクノロジーソリューションズ",
                url="https://techno-solutions.co.jp",
                location="東京都新宿区西新宿1-1-1",
                contact_email="info@techno-solutions.co.jp",
                phone="03-1234-5678",
                description="システム開発・WEB制作・AI開発を手がける技術企業",
                industry="システム開発・IT",
                business_size=BusinessSize.MEDIUM,
                additional_emails=["contact@techno-solutions.co.jp"],
                social_media={"twitter": "@techno_solutions"}
            ),
            CompanyInfo(
                company_name="株式会社デジタルマーケティング",
                url="https://digital-marketing.com",
                location="東京都渋谷区渋谷2-2-2",
                contact_email="inquiry@digital-marketing.com",
                phone="03-2345-6789",
                description="デジタルマーケティング・WEB広告運用専門",
                industry="マーケティング・広告",
                business_size=BusinessSize.SMALL,
                additional_emails=["support@digital-marketing.com"],
                social_media={"facebook": "digitalmarketing"}
            ),
            CompanyInfo(
                company_name="ITコンサルティング株式会社",
                url="https://it-consulting.co.jp",
                location="東京都港区赤坂3-3-3",
                contact_email="contact@it-consulting.co.jp",
                phone="03-3456-7890",
                description="ITコンサルティング・DX推進・システム導入支援",
                industry="ITコンサルティング",
                business_size=BusinessSize.LARGE,
                additional_emails=["business@it-consulting.co.jp"],
                social_media={"linkedin": "it-consulting"}
            )
        ]

        # スコアリング
        scorer = LeadScorer()
        search_query = SearchQuery(
            industry="IT",
            location="東京都",
            additional_keywords=["システム開発"]
        )

        scored_leads = scorer.score_leads(companies, search_query)
        stats = ScoreAnalyzer.analyze_score_distribution(scored_leads)

        # 結果を構築
        result = {
            'success': True,
            'leads_count': len(scored_leads),
            'statistics': stats,
            'top_leads': [lead.to_dict() for lead in scored_leads],
            'search_info': {
                'industry': 'IT',
                'location': '東京都',
                'additional_keywords': ['システム開発']
            },
            'timestamp': datetime.now().isoformat()
        }

        return jsonify(result)

    except Exception as e:
        logger.error(f"Demo API error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# WebSocket イベント
@socketio.on('connect')
def handle_connect():
    """WebSocket接続時"""
    logger.info(f'Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """WebSocket切断時"""
    logger.info(f'Client disconnected')

if __name__ == '__main__':
    # 出力ディレクトリを確保
    os.makedirs('../output', exist_ok=True)

    print("営業リスト自動生成エージェント - Webアプリケーション")
    print("http://localhost:5000 でアクセスしてください")

    socketio.run(app, host='0.0.0.0', port=5000, debug=True)