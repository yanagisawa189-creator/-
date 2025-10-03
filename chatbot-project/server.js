const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.pdf', '.txt'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('PDFまたはテキストファイルのみアップロード可能です'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB制限
    }
});

let fileContents = new Map();

async function extractTextFromFile(filePath, originalName) {
    const fileExt = path.extname(originalName).toLowerCase();
    
    try {
        if (fileExt === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } else if (fileExt === '.txt') {
            return fs.readFileSync(filePath, 'utf8');
        }
        return null;
    } catch (error) {
        console.error('File processing error:', error);
        throw new Error('ファイルの処理中にエラーが発生しました');
    }
}

app.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.json({ success: false, message: 'ファイルが選択されていません' });
        }

        const processedFiles = [];

        for (const file of req.files) {
            try {
                const text = await extractTextFromFile(file.path, file.originalname);
                if (text && text.trim().length > 0) {
                    fileContents.set(file.filename, text);
                    processedFiles.push({
                        filename: file.filename,
                        originalName: file.originalname,
                        type: path.extname(file.originalname).toLowerCase()
                    });
                } else {
                    fs.unlinkSync(file.path);
                    console.log(`Empty file removed: ${file.originalname}`);
                }
            } catch (error) {
                fs.unlinkSync(file.path);
                console.error(`Error processing ${file.originalname}:`, error);
            }
        }

        if (processedFiles.length === 0) {
            return res.json({ success: false, message: '有効なファイルがありませんでした' });
        }

        res.json({ 
            success: true, 
            message: `${processedFiles.length}個のファイルが正常にアップロードされました`,
            files: processedFiles
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.json({ success: false, message: 'アップロード中にエラーが発生しました' });
    }
});

app.post('/chat', async (req, res) => {
    try {
        const { message, files } = req.body;

        if (!message || !files || files.length === 0) {
            return res.json({ success: false, message: '質問またはファイルが不正です' });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.json({ success: false, message: 'OpenAI APIキーが設定されていません' });
        }

        let combinedContent = '';
        for (const filename of files) {
            if (fileContents.has(filename)) {
                combinedContent += `\n\n=== ファイル: ${filename} ===\n`;
                combinedContent += fileContents.get(filename);
            }
        }

        if (combinedContent.trim().length === 0) {
            return res.json({ success: false, message: 'ファイルの内容が見つかりません' });
        }

        // 文字数制限対応：10000文字を超える場合は前半部分を使用
        const maxContentLength = 10000;
        if (combinedContent.length > maxContentLength) {
            combinedContent = combinedContent.substring(0, maxContentLength) + '\n\n[注意: ファイルが大きいため、前半部分のみを表示しています]';
        }

        const systemPrompt = `あなたは提供されたドキュメントの内容に基づいて質問に答えるアシスタントです。

以下のルールに従ってください：
1. 提供されたドキュメントの内容のみを使用して回答してください
2. ドキュメントに情報がない場合は、「提供されたドキュメントには該当する情報がありません」と回答してください
3. 日本語で自然で分かりやすい回答を心がけてください
4. 具体的な根拠がある場合は、それを示してください

ドキュメント内容:
${combinedContent}`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 1000,
            temperature: 0.7
        });

        const botResponse = response.choices[0].message.content;

        res.json({ success: true, response: botResponse });

    } catch (error) {
        console.error('Chat error:', error);
        
        if (error.code === 'insufficient_quota') {
            res.json({ success: false, message: 'OpenAI APIの利用制限に達しました。しばらく待ってから再度お試しください。' });
        } else if (error.code === 'invalid_api_key') {
            res.json({ success: false, message: 'OpenAI APIキーが無効です。設定を確認してください。' });
        } else if (error.code === 'context_length_exceeded') {
            res.json({ success: false, message: 'ファイルが大きすぎます。より小さなファイルをお試しください。' });
        } else {
            res.json({ success: false, message: 'AIからの応答取得中にエラーが発生しました' });
        }
    }
});

app.get('/files', (req, res) => {
    const uploadedFiles = Array.from(fileContents.keys()).map(filename => {
        const filePath = path.join('uploads', filename);
        let originalName = 'unknown';
        try {
            const stats = fs.statSync(filePath);
            originalName = filename;
        } catch (error) {
            console.log('File not found:', filename);
        }
        return {
            filename,
            originalName,
            hasContent: fileContents.has(filename)
        };
    });
    
    res.json({ files: uploadedFiles });
});

app.delete('/files/:filename', (req, res) => {
    const { filename } = req.params;
    try {
        const filePath = path.join('uploads', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        fileContents.delete(filename);
        res.json({ success: true, message: 'ファイルが削除されました' });
    } catch (error) {
        console.error('Delete error:', error);
        res.json({ success: false, message: 'ファイル削除中にエラーが発生しました' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 PDFチャットボットサーバーが起動しました`);
    console.log(`📱 ブラウザで http://localhost:${PORT} を開いてください`);
    console.log(`🔑 OpenAI APIキー設定: ${process.env.OPENAI_API_KEY ? '✅ 設定済み' : '❌ 未設定'}`);
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('\n⚠️  重要: .envファイルにOPENAI_API_KEYを設定してください');
    }
});