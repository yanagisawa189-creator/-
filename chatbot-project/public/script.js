class ChatBot {
    constructor() {
        this.uploadedFiles = [];
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadStatus = document.getElementById('uploadStatus');
        this.fileList = document.getElementById('fileList');
        this.chatHistory = document.getElementById('chatHistory');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
    }

    setupEventListeners() {
        this.uploadBtn.addEventListener('click', () => this.uploadFiles());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.fileInput.addEventListener('change', () => this.updateFileDisplay());
    }

    updateFileDisplay() {
        const files = Array.from(this.fileInput.files);
        if (files.length > 0) {
            this.uploadStatus.textContent = `${files.length}個のファイルが選択されました`;
            this.uploadStatus.className = 'status-message';
        }
    }

    async uploadFiles() {
        const files = this.fileInput.files;
        if (files.length === 0) {
            this.showStatus('ファイルを選択してください', 'error');
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            this.uploadBtn.disabled = true;
            this.uploadBtn.innerHTML = '<div class="loading"></div> アップロード中...';

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.uploadedFiles = [...this.uploadedFiles, ...result.files];
                this.showStatus(`${result.files.length}個のファイルがアップロードされました`, 'success');
                this.updateFileList();
                this.enableChat();
                this.fileInput.value = '';
            } else {
                this.showStatus(`エラー: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus('アップロード中にエラーが発生しました', 'error');
        } finally {
            this.uploadBtn.disabled = false;
            this.uploadBtn.innerHTML = 'アップロード';
        }
    }

    updateFileList() {
        this.fileList.innerHTML = '';
        this.uploadedFiles.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            fileDiv.textContent = `📄 ${file.originalName} (${file.type})`;
            this.fileList.appendChild(fileDiv);
        });
    }

    enableChat() {
        this.messageInput.disabled = false;
        this.sendBtn.disabled = false;
        this.messageInput.placeholder = 'アップロードしたファイルについて質問してください...';
        this.messageInput.focus();
    }

    showStatus(message, type) {
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = `status-message ${type}`;
    }

    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        this.chatHistory.appendChild(messageDiv);
        
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        if (this.uploadedFiles.length === 0) {
            this.addMessage('まずファイルをアップロードしてください。');
            return;
        }

        this.addMessage(message, true);
        this.messageInput.value = '';
        this.sendBtn.disabled = true;
        this.sendBtn.innerHTML = '<div class="loading"></div> 考え中...';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    files: this.uploadedFiles.map(f => f.filename)
                })
            });

            const result = await response.json();

            if (result.success) {
                this.addMessage(result.response);
            } else {
                this.addMessage(`エラー: ${result.message}`);
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('申し訳ありません。エラーが発生しました。しばらく待ってから再度お試しください。');
        } finally {
            this.sendBtn.disabled = false;
            this.sendBtn.innerHTML = '送信';
            this.messageInput.focus();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});