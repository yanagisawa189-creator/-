export interface KeywordConfig {
  keyword: string;
  lang: string;
  location_type: 'country' | 'state' | 'city' | 'zip';
  location_value: string;
  device: 'desktop' | 'mobile';
  target_domains: string[];
  priority: 'H' | 'M' | 'L';
  owner?: string;
  schedule?: 'daily' | 'weekly';
  notes?: string;
}

export interface RunParams {
  keyword: string;
  lang: string;
  location?: {
    type: string;
    value: string;
  };
  device: 'desktop' | 'mobile';
}

export interface AioSource {
  url: string;
  domain: string;
}

export interface AioResult {
  present: boolean;
  sources: AioSource[];
  text_length?: number;
  heading_count?: number;
  has_followup_questions?: boolean;
}

export interface SerpItem {
  rank: number;
  domain: string;
  url: string;
  title?: string;
}

export interface SerpResult {
  engine: 'google' | 'yahoo';
  aio: AioResult | null;
  organic: SerpItem[];
  own_rank?: number;
}

export interface ScreenshotData {
  desktop_path?: string;
  mobile_path?: string;
  aio_desktop_path?: string;
  aio_mobile_path?: string;
  timestamp: string;
}

export interface DailyResult {
  run_at: string;
  engine: 'google' | 'yahoo';
  device: 'desktop' | 'mobile';
  lang: string;
  location: {
    type: string;
    value: string;
  };
  keyword: string;
  aio_present: boolean;
  aio_sources: string[];
  own_cited: boolean;
  own_cited_urls: string[];
  serp_rank?: number;
  serp_top100: SerpItem[];
  screenshot_url?: string;
  screenshot_path?: string;
  screenshot_data?: ScreenshotData;
  html_snapshot_url?: string;
  job_status: 'ok' | 'partial' | 'fail';
  error_message?: string;
  llm_engine?: 'claude' | 'gemini' | 'chatgpt';
  llm_answer_present?: boolean;
  llm_citations?: string[];
  llm_own_cited?: boolean;
  llm_excerpt?: string;
}

export interface LlmCitationResult {
  llm_engine: 'claude' | 'gemini' | 'chatgpt';
  citations: string[];
  own_cited: boolean;
  excerpt: string;
  answer_present: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}