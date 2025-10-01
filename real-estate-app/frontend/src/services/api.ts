import axios from 'axios'

export interface PropertyData {
  address: string
  price: number
  area_sqm: number
  built_year: number
  layout: string
  station: string
  walk_min: number
  pr: string
  images: File[]
  pdf?: File
}

export interface PropertyResponse {
  id: number
  created_at: string
}

export interface MediaContent {
  status: string
  copies: {
    suumo: string
    homes: string
    instagram: {
      content: string
      hashtags: string[]
    }
    flyer: {
      headline: string
      sub_copy: string
      bullet_points: string[]
      content: string
    }
  }
  images: {
    suumo: string[]
    homes: string[]
    instagram: string[]
    flyer: string[]
  }
}

const API_BASE_URL = '/api'

export const api = {
  // 詳細入力での物件登録
  async createProperty(data: PropertyData): Promise<PropertyResponse> {
    const formData = new FormData()
    
    // テキストフィールド
    formData.append('address', data.address)
    formData.append('price', data.price.toString())
    formData.append('area_sqm', data.area_sqm.toString())
    formData.append('built_year', data.built_year.toString())
    formData.append('layout', data.layout)
    formData.append('station', data.station)
    formData.append('walk_min', data.walk_min.toString())
    formData.append('pr', data.pr)
    
    // 画像ファイル
    data.images.forEach((image) => {
      formData.append('images', image)
    })
    
    // PDFファイル
    if (data.pdf) {
      formData.append('pdf', data.pdf)
    }
    
    const response = await axios.post(`${API_BASE_URL}/properties`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  },

  // PDFのみでの物件登録
  async createPropertyFromPdf(data: { pdf: File }): Promise<PropertyResponse> {
    const formData = new FormData()
    formData.append('pdf', data.pdf)
    
    const response = await axios.post(`${API_BASE_URL}/properties/pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  },

  // メディアコンテンツ生成
  async generateMediaContent(propertyId: number): Promise<MediaContent> {
    const response = await axios.post(`${API_BASE_URL}/properties/${propertyId}/generate`)
    return response.data
  },

  // エクスポート（CSVまたはZip）
  async exportContent(propertyId: number, mediaType: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/properties/${propertyId}/export`, {
      params: { media: mediaType },
      responseType: 'blob'
    })
    
    return response.data
  },

  // ファイルダウンロード
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}