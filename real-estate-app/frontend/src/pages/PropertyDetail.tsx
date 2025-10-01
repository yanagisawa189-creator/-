import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tab } from '@headlessui/react'
import { api, MediaContent } from '../services/api'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [mediaContent, setMediaContent] = useState<MediaContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const propertyId = parseInt(id || '0', 10)

  // メディアコンテンツ生成
  const generateContent = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const content = await api.generateMediaContent(propertyId)
      setMediaContent(content)
    } catch (error) {
      console.error('Error generating content:', error)
      setError('コンテンツの生成中にエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // エクスポート
  const handleExport = async (mediaType: string) => {
    setIsExporting(true)

    try {
      const blob = await api.exportContent(propertyId, mediaType)
      
      const extension = mediaType === 'suumo' || mediaType === 'homes' ? 'csv' : 'zip'
      const filename = `${mediaType}_${propertyId}.${extension}`
      
      api.downloadFile(blob, filename)
    } catch (error) {
      console.error('Error exporting:', error)
      setError('エクスポート中にエラーが発生しました')
    } finally {
      setIsExporting(false)
    }
  }

  // テキストコピー
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const mediaTypes = [
    { name: 'SUUMO', key: 'suumo' },
    { name: "HOME'S", key: 'homes' },
    { name: 'Instagram', key: 'instagram' },
    { name: '紙チラシ', key: 'flyer' }
  ]

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            ← 新しい物件を登録
          </button>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            物件ID: {propertyId} - メディアコンテンツ生成
          </h1>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 生成ボタン */}
        {!mediaContent && (
          <div className="mb-6 bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              メディアコンテンツを生成しますか？
            </h2>
            <p className="text-gray-600 mb-6">
              登録された物件情報から、各媒体向けのテキストと画像を自動生成します。
            </p>
            <button
              onClick={generateContent}
              disabled={isGenerating}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </>
              ) : (
                'メディアコンテンツを生成'
              )}
            </button>
          </div>
        )}

        {/* 生成結果 */}
        {mediaContent && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">生成結果</h2>
            </div>

            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-none bg-gray-100 p-1 mx-6 mt-6">
                {mediaTypes.map((mediaType) => (
                  <Tab
                    key={mediaType.key}
                    className={({ selected }) =>
                      classNames(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                        selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-blue-800 hover:bg-white/[0.12] hover:text-blue-900'
                      )
                    }
                  >
                    {mediaType.name}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className="p-6">
                {mediaTypes.map((mediaType) => (
                  <Tab.Panel key={mediaType.key} className="space-y-6">
                    {/* テキストコンテンツ */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {mediaType.name} 向けテキスト
                        </h3>
                        <button
                          onClick={() => {
                            const content = mediaContent.copies[mediaType.key as keyof typeof mediaContent.copies]
                            const text = typeof content === 'string' ? content : 
                                       typeof content === 'object' && content.content ? content.content : 
                                       JSON.stringify(content)
                            copyToClipboard(text)
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          コピー
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {renderTextContent(mediaContent.copies[mediaType.key as keyof typeof mediaContent.copies])}
                      </div>
                    </div>

                    {/* 画像プレビュー */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        画像プレビュー ({mediaType.name}サイズ)
                      </h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {mediaContent.images[mediaType.key as keyof typeof mediaContent.images]?.map((imagePath, index) => (
                          <div key={index} className="bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={`http://localhost:8000/${imagePath}`}
                              alt={`${mediaType.name} image ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-2 text-xs text-gray-600">
                              画像 {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* エクスポートボタン */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleExport(mediaType.key)}
                        disabled={isExporting}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                          isExporting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isExporting ? '処理中...' : 
                         mediaType.key === 'suumo' || mediaType.key === 'homes' ? 
                         'CSVダウンロード' : 'ZIPダウンロード'}
                      </button>
                    </div>
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>
          </div>
        )}
      </div>
    </div>
  )
}

// テキストコンテンツのレンダリング
function renderTextContent(content: any) {
  if (typeof content === 'string') {
    return (
      <pre className="whitespace-pre-wrap text-sm text-gray-800">
        {content}
      </pre>
    )
  }

  if (typeof content === 'object') {
    // Instagram形式
    if (content.content && content.hashtags) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">投稿文:</h4>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {content.content}
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">ハッシュタグ:</h4>
            <div className="flex flex-wrap gap-2">
              {content.hashtags.map((tag: string, index: number) => (
                <span 
                  key={index} 
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // チラシ形式
    if (content.headline && content.sub_copy && content.bullet_points) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">見出し:</h4>
            <p className="text-lg font-bold text-gray-800">{content.headline}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">サブコピー:</h4>
            <p className="text-gray-800">{content.sub_copy}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">特徴:</h4>
            <ul className="list-disc list-inside space-y-1">
              {content.bullet_points.map((point: string, index: number) => (
                <li key={index} className="text-sm text-gray-800">{point}</li>
              ))}
            </ul>
          </div>
        </div>
      )
    }
  }

  return (
    <pre className="whitespace-pre-wrap text-sm text-gray-800">
      {JSON.stringify(content, null, 2)}
    </pre>
  )
}

export default PropertyDetail