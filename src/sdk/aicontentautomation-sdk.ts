/**
 * AI Content Automation JavaScript SDK
 * 
 * A comprehensive SDK for interacting with the AI Content Automation API
 * 
 * @example
 * ```typescript
 * import { AIContentClient } from '@aicontentautomation/sdk';
 * 
 * const client = new AIContentClient({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.aicontentautomation.com/v1'
 * });
 * 
 * // Generate content
 * const content = await client.content.generate({
 *   prompt: 'Write a blog post about AI',
 *   aiProvider: 'GPT4',
 *   industry: 'TECHNOLOGY'
 * });
 * ```
 */

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: number;
  email: string;
  name: string;
  subscription: 'BASIC' | 'PRO' | 'ENTERPRISE';
  avatar?: string;
}

export interface ContentGenerationRequest {
  prompt: string;
  aiProvider: 'GPT4' | 'GPT35' | 'GEMINI_PRO' | 'CLAUDE3';
  industry?: 'TECHNOLOGY' | 'HEALTHCARE' | 'FINANCE' | 'EDUCATION' | 'MARKETING' | 'ECOMMERCE' | 'GENERAL';
  tone?: 'PROFESSIONAL' | 'CASUAL' | 'FRIENDLY' | 'AUTHORITATIVE' | 'CREATIVE';
  length?: 'SHORT' | 'MEDIUM' | 'LONG';
  targetAudience?: 'GENERAL' | 'BUSINESS_PROFESSIONALS' | 'STUDENTS' | 'CONSUMERS';
  includeImages?: boolean;
  platforms?: Platform[];
}

export interface ContentGenerationResponse {
  id: number;
  title: string;
  content: string;
  aiProvider: string;
  generationCost: number;
  qualityScore: number;
  estimatedEngagement: number;
  images?: GeneratedImage[];
  createdAt: string;
}

export interface GeneratedImage {
  id: number;
  url: string;
  altText: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export type Platform = 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'TIKTOK' | 'YOUTUBE';

export interface PublishRequest {
  platforms: Platform[];
  scheduledTime?: string;
  customizations?: Record<Platform, PlatformCustomization>;
}

export interface PlatformCustomization {
  title?: string;
  description?: string;
  hashtags?: string[];
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
}

export interface PublishResponse {
  publishId: string;
  status: 'SCHEDULED' | 'PUBLISHING' | 'COMPLETED' | 'FAILED';
  platforms: PlatformPublishResult[];
  scheduledTime?: string;
}

export interface PlatformPublishResult {
  platform: Platform;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  postUrl?: string;
  error?: string;
}

export interface APIError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  timestamp: string;
}

export class AIContentAutomationError extends Error {
  constructor(
    public readonly error: APIError,
    public readonly response?: Response
  ) {
    super(error.detail);
    this.name = 'AIContentAutomationError';
  }
}

export class RateLimitError extends AIContentAutomationError {
  constructor(
    error: APIError,
    response: Response,
    public readonly retryAfter: number
  ) {
    super(error, response);
    this.name = 'RateLimitError';
  }
}

class BaseService {
  constructor(protected client: AIContentClient) {}

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.client.request<T>(endpoint, options);
  }
}

export class AuthService extends BaseService {
  async login(email: string, password: string, rememberMe = false): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe })
    });
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  }

  async logout(): Promise<void> {
    await this.request<void>('/auth/logout', {
      method: 'POST'
    });
  }

  async resetPassword(email: string): Promise<void> {
    await this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
}

export class ContentService extends BaseService {
  async generate(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    return this.request<ContentGenerationResponse>('/content/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async get(id: number): Promise<ContentGenerationResponse> {
    return this.request<ContentGenerationResponse>(`/content/${id}`);
  }

  async list(params?: {
    page?: number;
    size?: number;
    sort?: string;
    filter?: string;
  }): Promise<{
    content: ContentGenerationResponse[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.size) searchParams.set('size', params.size.toString());
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.filter) searchParams.set('filter', params.filter);

    const query = searchParams.toString();
    return this.request(`/content${query ? `?${query}` : ''}`);
  }

  async update(id: number, updates: Partial<ContentGenerationRequest>): Promise<ContentGenerationResponse> {
    return this.request<ContentGenerationResponse>(`/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async delete(id: number): Promise<void> {
    await this.request<void>(`/content/${id}`, {
      method: 'DELETE'
    });
  }

  async publish(id: number, request: PublishRequest): Promise<PublishResponse> {
    return this.request<PublishResponse>(`/content/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async getPublishStatus(publishId: string): Promise<PublishResponse> {
    return this.request<PublishResponse>(`/content/publish/${publishId}/status`);
  }

  async regenerate(id: number, options?: {
    aiProvider?: ContentGenerationRequest['aiProvider'];
    tone?: ContentGenerationRequest['tone'];
  }): Promise<ContentGenerationResponse> {
    return this.request<ContentGenerationResponse>(`/content/${id}/regenerate`, {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }
}

export class AnalyticsService extends BaseService {
  async getContentPerformance(contentId: number): Promise<{
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
    platforms: Record<Platform, {
      views: number;
      engagement: number;
      clicks: number;
    }>;
  }> {
    return this.request(`/analytics/content/${contentId}/performance`);
  }

  async getDashboardMetrics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<{
    totalContent: number;
    totalViews: number;
    totalEngagement: number;
    averageEngagementRate: number;
    topPerformingContent: ContentGenerationResponse[];
    platformBreakdown: Record<Platform, number>;
  }> {
    return this.request(`/analytics/dashboard?timeRange=${timeRange}`);
  }

  async getROIReport(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<{
    totalSpent: number;
    totalRevenue: number;
    roi: number;
    costPerEngagement: number;
    conversionRate: number;
  }> {
    return this.request(`/analytics/roi?timeRange=${timeRange}`);
  }
}

export class TemplateService extends BaseService {
  async list(category?: string): Promise<{
    id: number;
    name: string;
    description: string;
    category: string;
    prompt: string;
    usageCount: number;
    rating: number;
  }[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/templates${query}`);
  }

  async get(id: number): Promise<{
    id: number;
    name: string;
    description: string;
    category: string;
    prompt: string;
    variables: string[];
    examples: string[];
  }> {
    return this.request(`/templates/${id}`);
  }

  async create(template: {
    name: string;
    description: string;
    category: string;
    prompt: string;
    isPublic?: boolean;
  }): Promise<{ id: number }> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(template)
    });
  }
}

export class AIContentClient {
  private config: Required<ClientConfig>;
  private accessToken?: string;

  public readonly auth: AuthService;
  public readonly content: ContentService;
  public readonly analytics: AnalyticsService;
  public readonly templates: TemplateService;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: 'https://api.aicontentautomation.com/v1',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.auth = new AuthService(this);
    this.content = new ContentService(this);
    this.analytics = new AnalyticsService(this);
    this.templates = new TemplateService(this);
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      (headers as any).Authorization = `Bearer ${this.accessToken}`;
    } else if (this.config.apiKey) {
      (headers as any)['X-API-Key'] = this.config.apiKey;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            throw new RateLimitError(errorData, response, retryAfter);
          }
          
          throw new AIContentAutomationError(errorData, response);
        }

        // Handle empty responses
        if (response.status === 204 || response.headers.get('content-length') === '0') {
          return undefined as T;
        }

        return await response.json();
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors or rate limits
        if (error instanceof AIContentAutomationError && error.error.status < 500) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.config.retryAttempts) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
        );
      }
    }
    
    throw lastError!;
  }

  // Convenience methods for common operations
  async quickGenerate(prompt: string, options?: {
    aiProvider?: ContentGenerationRequest['aiProvider'];
    industry?: ContentGenerationRequest['industry'];
  }): Promise<ContentGenerationResponse> {
    return this.content.generate({
      prompt,
      aiProvider: options?.aiProvider || 'GPT4',
      industry: options?.industry || 'GENERAL',
      tone: 'PROFESSIONAL',
      length: 'MEDIUM'
    });
  }

  async publishToAllPlatforms(contentId: number, scheduledTime?: string): Promise<PublishResponse> {
    return this.content.publish(contentId, {
      platforms: ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN'],
      scheduledTime
    });
  }

  // Batch operations
  async batchGenerate(requests: ContentGenerationRequest[]): Promise<ContentGenerationResponse[]> {
    const promises = requests.map(request => this.content.generate(request));
    return Promise.all(promises);
  }

  // Utility methods
  isRateLimited(error: unknown): error is RateLimitError {
    return error instanceof RateLimitError;
  }

  async waitForRateLimit(error: RateLimitError): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
  }
}

// Export default instance for convenience
export default AIContentClient;

// Browser global for CDN usage
if (typeof window !== 'undefined') {
  (window as any).AIContentClient = AIContentClient;
}