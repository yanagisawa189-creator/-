// 営業リスト自動生成エージェント - JavaScript

// 共通の初期化処理
document.addEventListener('DOMContentLoaded', function() {
    // Bootstrap tooltips の初期化
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // アラートの自動消去
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert-dismissible');
        alerts.forEach(function(alert) {
            const closeBtn = alert.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.click();
            }
        });
    }, 5000);

    // ページアニメーションの初期化
    initPageAnimations();
});

// ページアニメーション
function initPageAnimations() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// 共通ユーティリティ関数
const Utils = {
    // 数値のフォーマット
    formatNumber: function(num, decimals = 1) {
        return parseFloat(num).toFixed(decimals);
    },

    // 日付のフォーマット
    formatDateTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP');
    },

    // エラーメッセージの表示
    showError: function(message, container = 'body') {
        const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>エラー：</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        if (container === 'body') {
            document.body.insertAdjacentHTML('afterbegin', alertHtml);
        } else {
            const element = document.querySelector(container);
            if (element) {
                element.insertAdjacentHTML('afterbegin', alertHtml);
            }
        }

        // 5秒後に自動削除
        setTimeout(() => {
            const alert = document.querySelector('.alert-danger');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    },

    // 成功メッセージの表示
    showSuccess: function(message, container = 'body') {
        const alertHtml = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle"></i>
                <strong>成功：</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        if (container === 'body') {
            document.body.insertAdjacentHTML('afterbegin', alertHtml);
        } else {
            const element = document.querySelector(container);
            if (element) {
                element.insertAdjacentHTML('afterbegin', alertHtml);
            }
        }

        // 3秒後に自動削除
        setTimeout(() => {
            const alert = document.querySelector('.alert-success');
            if (alert) {
                alert.remove();
            }
        }, 3000);
    },

    // ローディング状態の管理
    setLoading: function(element, loading = true) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return;

        if (loading) {
            element.disabled = true;
            const originalText = element.textContent;
            element.dataset.originalText = originalText;
            element.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                処理中...
            `;
        } else {
            element.disabled = false;
            element.textContent = element.dataset.originalText || 'Submit';
        }
    },

    // 優先度に基づくバッジクラスの取得
    getPriorityBadgeClass: function(score) {
        if (score >= 8) return 'bg-success';
        if (score >= 5) return 'bg-warning';
        return 'bg-secondary';
    },

    // 優先度に基づくテキストの取得
    getPriorityText: function(score) {
        if (score >= 8) return '高';
        if (score >= 5) return '中';
        return '低';
    },

    // 電話番号のフォーマット
    formatPhoneNumber: function(phone) {
        if (!phone) return '';
        // 日本の電話番号フォーマットに対応
        return phone.replace(/(\d{2,4})-?(\d{2,4})-?(\d{4})/, '$1-$2-$3');
    },

    // URLの検証
    isValidUrl: function(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // メールアドレスの検証
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // CSVダウンロード用のデータ変換
    convertToCSV: function(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // 値にカンマや改行が含まれる場合はクォートで囲む
                    if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    },

    // ファイルダウンロード
    downloadFile: function(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};

// WebSocket管理クラス
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    connect() {
        if (typeof io !== 'undefined') {
            this.socket = io();

            this.socket.on('connect', () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            });

            this.socket.on('disconnect', () => {
                console.log('WebSocket disconnected');
                this.attemptReconnect();
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.attemptReconnect();
            });
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// グローバルWebSocketインスタンス
const wsManager = new WebSocketManager();

// API管理クラス
class APIManager {
    constructor() {
        this.baseURL = '';
    }

    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return response;
            }

        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// グローバルAPIマネージャー
const apiManager = new APIManager();

// フォーム検証ヘルパー
const FormValidator = {
    validateRequired: function(value, fieldName) {
        if (!value || value.trim() === '') {
            return `${fieldName}は必須項目です`;
        }
        return null;
    },

    validateEmail: function(email) {
        if (!Utils.isValidEmail(email)) {
            return '有効なメールアドレスを入力してください';
        }
        return null;
    },

    validateUrl: function(url) {
        if (!Utils.isValidUrl(url)) {
            return '有効なURLを入力してください';
        }
        return null;
    },

    validateForm: function(formData, rules) {
        const errors = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = formData.get ? formData.get(field) : formData[field];

            if (rule.required) {
                const error = this.validateRequired(value, rule.name || field);
                if (error) {
                    errors[field] = error;
                    continue;
                }
            }

            if (rule.type === 'email' && value) {
                const error = this.validateEmail(value);
                if (error) errors[field] = error;
            }

            if (rule.type === 'url' && value) {
                const error = this.validateUrl(value);
                if (error) errors[field] = error;
            }

            if (rule.minLength && value && value.length < rule.minLength) {
                errors[field] = `${rule.name || field}は${rule.minLength}文字以上で入力してください`;
            }

            if (rule.maxLength && value && value.length > rule.maxLength) {
                errors[field] = `${rule.name || field}は${rule.maxLength}文字以内で入力してください`;
            }
        }

        return errors;
    },

    showValidationErrors: function(errors, formElement) {
        // 既存のエラーメッセージをクリア
        const existingErrors = formElement.querySelectorAll('.invalid-feedback');
        existingErrors.forEach(error => error.remove());

        const invalidInputs = formElement.querySelectorAll('.is-invalid');
        invalidInputs.forEach(input => input.classList.remove('is-invalid'));

        // 新しいエラーメッセージを表示
        for (const [field, message] of Object.entries(errors)) {
            const input = formElement.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('is-invalid');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = message;
                input.parentNode.appendChild(errorDiv);
            }
        }
    }
};

// 検索履歴管理
const SearchHistory = {
    key: 'salesLeadSearchHistory',
    maxHistoryItems: 10,

    save: function(searchData) {
        let history = this.get();

        // 重複を避けるため、同じ検索条件があれば削除
        history = history.filter(item =>
            !(item.industry === searchData.industry &&
              item.location === searchData.location &&
              JSON.stringify(item.keywords) === JSON.stringify(searchData.keywords))
        );

        // 新しい検索を先頭に追加
        history.unshift({
            ...searchData,
            timestamp: new Date().toISOString()
        });

        // 履歴の上限を適用
        if (history.length > this.maxHistoryItems) {
            history = history.slice(0, this.maxHistoryItems);
        }

        localStorage.setItem(this.key, JSON.stringify(history));
    },

    get: function() {
        const history = localStorage.getItem(this.key);
        return history ? JSON.parse(history) : [];
    },

    clear: function() {
        localStorage.removeItem(this.key);
    }
};

// パフォーマンス監視
const PerformanceMonitor = {
    timers: {},

    start: function(name) {
        this.timers[name] = performance.now();
    },

    end: function(name) {
        if (this.timers[name]) {
            const duration = performance.now() - this.timers[name];
            console.log(`${name}: ${duration.toFixed(2)}ms`);
            delete this.timers[name];
            return duration;
        }
        return null;
    }
};

// エクスポート（モジュールとして使用する場合）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        WebSocketManager,
        APIManager,
        FormValidator,
        SearchHistory,
        PerformanceMonitor
    };
}