import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { api, PropertyData } from '../services/api'

interface FormData {
  address: string
  price: number
  area_sqm: number
  built_year: number
  layout: string
  station: string
  walk_min: number
  pr: string
}

function PropertyForm() {
  const navigate = useNavigate()
  const [registrationType, setRegistrationType] = useState<'detailed' | 'pdf'>(() => {
    return (sessionStorage.getItem('registrationType') as 'detailed' | 'pdf') || 'detailed'
  })
  const [images, setImages] = useState<File[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>()

  useEffect(() => {
    sessionStorage.setItem('registrationType', registrationType)
  }, [registrationType])

  // ドラッグ&ドロップ設定（画像用）
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setImages(prev => [...prev, ...acceptedFiles].slice(0, 5))
    }
  })

  // PDFドラッグ&ドロップ設定
  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setPdfFile(acceptedFiles[0])
      }
    }
  })

  // 画像削除
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // PDF削除
  const removePdf = () => {
    setPdfFile(null)
  }

  // 詳細入力フォーム送信
  const onSubmitDetailed = async (data: FormData) => {
    if (images.length === 0) {
      setSubmitError('最低1枚の画像をアップロードしてください')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const propertyData: PropertyData = {
        ...data,
        images
      }

      const response = await api.createProperty(propertyData)
      
      // 成功時は詳細ページに遷移
      navigate(`/properties/${response.id}`)
    } catch (error) {
      console.error('Error creating property:', error)
      setSubmitError('物件の登録中にエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // PDFのみ登録送信
  const onSubmitPdfOnly = async () => {
    if (!pdfFile) {
      setSubmitError('物件のPDFファイルをアップロードしてください')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const propertyData = {
        pdf: pdfFile
      }

      const response = await api.createPropertyFromPdf(propertyData)
      
      // 成功時は詳細ページに遷移
      navigate(`/properties/${response.id}`)
    } catch (error) {
      console.error('Error creating property:', error)
      setSubmitError('物件の登録中にエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* ページヘッダー */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">物件登録</h2>
                <p className="text-gray-600">新しい物件情報を登録して、各種媒体向けコンテンツを自動生成します</p>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>SUUMO対応</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>HOME'S対応</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span>SNS対応</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 登録方法選択タブ */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <nav className="flex">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setRegistrationType('detailed')
                }}
                className={`flex-1 py-4 px-6 font-medium text-sm transition-all duration-200 ${
                  registrationType === 'detailed'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>詳細入力 + 画像登録</span>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setRegistrationType('pdf')
                }}
                className={`flex-1 py-4 px-6 font-medium text-sm transition-all duration-200 ${
                  registrationType === 'pdf'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>PDFアップロード登録</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* 詳細入力フォーム */}
        {registrationType === 'detailed' && (
          <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">物件情報入力</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    物件の基本情報と画像をアップロードして、プロフェッショナルな媒体コンテンツを生成
                  </p>
                </div>
              </div>
            </div>

          <form onSubmit={handleSubmit(onSubmitDetailed)} className="px-8 py-8 space-y-8">
            {/* 基本情報セクション */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
              </div>
              
              {/* 所在地 */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>所在地 *</span>
                </label>
                <input
                  type="text"
                  {...register('address', { required: '所在地は必須です' })}
                  className="block w-full px-4 py-3 rounded-lg border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200 text-sm"
                  placeholder="例: 京都府城陽市寺田水度坂15-23"
                />
                {errors.address && (
                  <p className="flex items-center space-x-1 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.address.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 価格・面積・築年 */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
                <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">物件詳細</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>価格 (円) *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      {...register('price', { 
                        required: '価格は必須です',
                        min: { value: 1000000, message: '価格は100万円以上で入力してください' }
                      })}
                      className="block w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 transition-all duration-200 text-sm"
                      placeholder="32800000"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-400 text-sm">円</span>
                    </div>
                  </div>
                  {errors.price && (
                    <p className="flex items-center space-x-1 text-sm text-red-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.price.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>面積 (㎡) *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      {...register('area_sqm', { 
                        required: '面積は必須です',
                        min: { value: 10, message: '面積は10㎡以上で入力してください' }
                      })}
                      className="block w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 transition-all duration-200 text-sm"
                      placeholder="92.3"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-400 text-sm">㎡</span>
                    </div>
                  </div>
                  {errors.area_sqm && (
                    <p className="flex items-center space-x-1 text-sm text-red-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.area_sqm.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>築年 *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      {...register('built_year', { 
                        required: '築年は必須です',
                        min: { value: 1950, message: '1950年以降で入力してください' },
                        max: { value: new Date().getFullYear(), message: '未来の年は入力できません' }
                      })}
                      className="block w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 transition-all duration-200 text-sm"
                      placeholder="2001"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-400 text-sm">年</span>
                    </div>
                  </div>
                  {errors.built_year && (
                    <p className="flex items-center space-x-1 text-sm text-red-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.built_year.message}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 間取り・駅・徒歩分数 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  間取り *
                </label>
                <input
                  type="text"
                  {...register('layout', { required: '間取りは必須です' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="3LDK"
                />
                {errors.layout && (
                  <p className="mt-1 text-sm text-red-600">{errors.layout.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  最寄り駅 *
                </label>
                <input
                  type="text"
                  {...register('station', { required: '最寄り駅は必須です' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="奈良線 城陽"
                />
                {errors.station && (
                  <p className="mt-1 text-sm text-red-600">{errors.station.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  徒歩分数 *
                </label>
                <input
                  type="number"
                  {...register('walk_min', { 
                    required: '徒歩分数は必須です',
                    min: { value: 1, message: '1分以上で入力してください' },
                    max: { value: 99, message: '99分以下で入力してください' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="12"
                />
                {errors.walk_min && (
                  <p className="mt-1 text-sm text-red-600">{errors.walk_min.message}</p>
                )}
              </div>
            </div>

            {/* PRポイント */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                PRポイント *
              </label>
              <textarea
                rows={3}
                {...register('pr', { required: 'PRポイントは必須です' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="南向き・日当たり良好／小中学校が徒歩圏／買物施設充実"
              />
              {errors.pr && (
                <p className="mt-1 text-sm text-red-600">{errors.pr.message}</p>
              )}
            </div>

            {/* 画像アップロード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                物件画像 * (最大5枚)
              </label>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive
                    ? 'ファイルをドロップしてください'
                    : 'クリックまたはドラッグ&ドロップで画像をアップロード'}
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF形式対応</p>
              </div>

              {/* アップロード済み画像一覧 */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    アップロード済み画像 ({images.length}/5)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`upload-${index}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {image.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* エラーメッセージ */}
            {submitError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{submitError}</div>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                * 必須項目をすべて入力してください
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setImages([])
                    setSubmitError(null)
                  }}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  リセット
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-8 py-3 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      登録処理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      物件を登録
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        )}

        {/* PDFアップロード登録フォーム */}
        {registrationType === 'pdf' && (
          <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">PDFアップロード登録</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    物件PDFから素早く登録して、各媒体向けコンテンツを自動生成
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* PDFアップロード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物件PDF * (図面、パンフレット等)
                </label>
                
                <div
                  {...getPdfRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isPdfDragActive
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getPdfInputProps()} />
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m6 0h6m-6 6v6m0 0v6m0-6h6m-6 0H9"
                    />
                  </svg>
                  <p className="mt-4 text-lg text-gray-600">
                    {isPdfDragActive
                      ? 'PDFファイルをドロップしてください'
                      : 'クリックまたはドラッグ&ドロップでPDFをアップロード'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">PDF形式のみ対応・1ファイルまで</p>
                </div>

                {/* アップロード済みPDF */}
                {pdfFile && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      アップロード済みPDF
                    </h4>
                    <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <svg
                        className="h-10 w-10 text-red-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-4 flex-1">
                        <p className="text-base font-medium text-gray-900 truncate">
                          {pdfFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removePdf}
                        className="ml-3 h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* エラーメッセージ */}
              {submitError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{submitError}</div>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  * PDFファイルをアップロードしてください
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null)
                      setSubmitError(null)
                    }}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    リセット
                  </button>
                  <button
                    type="button"
                    onClick={onSubmitPdfOnly}
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-8 py-3 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                      isSubmitting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 transform hover:scale-105'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        登録処理中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDFで物件を登録
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertyForm