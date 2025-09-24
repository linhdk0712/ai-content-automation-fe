// Enhanced API Types matching backend DTOs

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp?: string
  path?: string
}

export interface ApiError {
  message: string
  status: number
  code?: string
  details?: Record<string, unknown>
  timestamp: string
  path: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

// Content Types
export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE', 
  VIDEO = 'VIDEO',
  MIXED = 'MIXED'
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// Content DTOs matching backend
export interface CreateContentRequest {
  title: string
  textContent?: string
  contentType: ContentType
  userId?: string // Set by backend from authentication
  workspaceId?: string
  templateId?: string
  
  // Content metadata
  industry?: string
  targetAudience?: string
  tone?: string
  language?: string
  
  // SEO fields
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  hashtags?: string[]
  tags?: string[]
  
  // Media
  mediaUrls?: string[]
  thumbnailUrl?: string
  
  // Scheduling
  scheduledPublishTime?: string
  
  // Additional metadata
  metadata?: Record<string, unknown>
  
  // AI generation context
  fromAiGeneration?: boolean
  aiProvider?: string
  aiModel?: string
  originalPrompt?: string
}

export interface UpdateContentRequest {
  contentId?: number // Set by URL parameter
  userId?: string // Set by backend from authentication
  title?: string
  textContent?: string
  status?: ContentStatus
  workspaceId?: string
  
  // Content metadata
  industry?: string
  targetAudience?: string
  tone?: string
  language?: string
  
  // SEO fields
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  hashtags?: string[]
  tags?: string[]
  
  // Media
  mediaUrls?: string[]
  thumbnailUrl?: string
  
  // Scheduling
  scheduledPublishTime?: string
  
  // Additional metadata
  metadata?: Record<string, unknown>
  
  // Version control
  changeDescription?: string
  createNewVersion?: boolean
}

export interface ContentResponse {
  id: number
  title: string
  textContent?: string
  contentType: ContentType
  status: ContentStatus
  userId: number
  userEmail?: string
  userName?: string
  workspaceId?: number
  workspaceName?: string
  currentVersion: number
  totalVersions?: number
  
  // AI metadata
  aiGenerated?: boolean
  aiProvider?: string
  aiModel?: string
  generationCost?: number
  tokensUsed?: number
  
  // Quality metrics
  qualityScore?: number
  readabilityScore?: number
  sentimentScore?: number
  performanceScore?: number
  engagementRate?: number
  
  // Content metadata
  industry?: string
  targetAudience?: string
  tone?: string
  language?: string
  wordCount?: number
  characterCount?: number
  
  // Template info
  templateId?: number
  templateName?: string
  
  // Publishing info
  scheduledPublishTime?: string
  publishedAt?: string
  isPublished?: boolean
  
  // Media
  mediaUrls?: string[]
  thumbnailUrl?: string
  
  // SEO
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  hashtags?: string[]
  
  // Additional data
  metadata?: Record<string, unknown>
  tags?: string[]
  
  // Collaboration
  collaborators?: CollaboratorInfo[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
  createdBy?: string
  lastModifiedBy?: string
}

export interface CollaboratorInfo {
  userId: number
  email: string
  firstName: string
  lastName?: string
  role: string
}

// AI Generation DTOs
export interface AIGenerationRequest {
  prompt: string
  aiProvider: string
  aiModel?: string
  contentType: ContentType
  userId?: string // Set by backend
  workspaceId?: string
  
  // Generation parameters
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  
  // Content context
  industry?: string
  targetAudience?: string
  tone?: string
  language?: string
  
  // Additional parameters
  parameters?: Record<string, unknown>
}

export interface AIGenerationResponse {
  id: string
  contentId?: number
  content: string
  title?: string
  provider: string
  model: string
  cost: number
  tokensUsed: number
  processingTime: number
  qualityScore?: number
  
  // Generation metadata
  prompt: string
  parameters: Record<string, unknown>
  
  // Timestamps
  generatedAt: string
  
  // Status
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  error?: string
}

export interface RegenerateContentRequest {
  contentId?: number // Set by URL parameter
  userId?: string // Set by backend
  prompt?: string
  aiProvider?: string
  aiModel?: string
  parameters?: Record<string, unknown>
  preserveStructure?: boolean
}

// Content Analysis DTOs
export interface ContentAnalysisRequest {
  contentId?: number // Set by URL parameter
  userId?: string // Set by backend
  textContent?: string // For analyzing text without saving
  analysisTypes?: AnalysisType[]
  targetPlatforms?: string[]
}

export enum AnalysisType {
  READABILITY = 'READABILITY',
  SENTIMENT = 'SENTIMENT',
  SEO = 'SEO',
  ENGAGEMENT = 'ENGAGEMENT',
  GRAMMAR = 'GRAMMAR',
  TONE = 'TONE'
}

export interface ContentAnalysisResponse {
  contentId?: number
  analysisId: string
  
  // Overall scores
  overallScore: number
  readabilityScore: number
  sentimentScore: number
  seoScore: number
  engagementScore: number
  grammarScore: number
  
  // Detailed analysis
  readabilityAnalysis: ReadabilityAnalysis
  sentimentAnalysis: SentimentAnalysis
  seoAnalysis: SEOAnalysis
  engagementAnalysis: EngagementAnalysis
  grammarAnalysis: GrammarAnalysis
  toneAnalysis: ToneAnalysis
  
  // Suggestions
  suggestions: AnalysisSuggestion[]
  
  // Statistics
  statistics: ContentStatistics
  
  // Timestamps
  analyzedAt: string
}

export interface ReadabilityAnalysis {
  fleschKincaidGrade: number
  fleschReadingEase: number
  gunningFogIndex: number
  smogIndex: number
  averageWordsPerSentence: number
  averageSyllablesPerWord: number
  complexWords: number
  longSentences: number
}

export interface SentimentAnalysis {
  overallSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  positiveScore: number
  negativeScore: number
  neutralScore: number
  confidence: number
  emotions: EmotionScore[]
}

export interface EmotionScore {
  emotion: string
  score: number
}

export interface SEOAnalysis {
  titleScore: number
  descriptionScore: number
  keywordDensity: Record<string, number>
  headingStructure: HeadingAnalysis[]
  metaTagsScore: number
  readabilityForSEO: number
  keywordOptimization: KeywordOptimization[]
}

export interface HeadingAnalysis {
  level: number
  text: string
  keywordPresence: boolean
}

export interface KeywordOptimization {
  keyword: string
  density: number
  prominence: number
  recommendations: string[]
}

export interface EngagementAnalysis {
  predictedEngagementRate: number
  viralityScore: number
  shareabilityScore: number
  emotionalImpact: number
  callToActionStrength: number
  platformOptimization: PlatformEngagement[]
}

export interface PlatformEngagement {
  platform: string
  engagementScore: number
  recommendations: string[]
}

export interface GrammarAnalysis {
  grammarErrors: GrammarError[]
  spellingErrors: SpellingError[]
  styleIssues: StyleIssue[]
  overallGrammarScore: number
}

export interface GrammarError {
  type: string
  message: string
  position: TextPosition
  suggestions: string[]
}

export interface SpellingError {
  word: string
  position: TextPosition
  suggestions: string[]
}

export interface StyleIssue {
  type: string
  message: string
  position: TextPosition
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface TextPosition {
  start: number
  end: number
  line?: number
  column?: number
}

export interface ToneAnalysis {
  overallTone: string
  toneScores: ToneScore[]
  consistency: number
  appropriateness: number
  brandAlignment: number
}

export interface ToneScore {
  tone: string
  score: number
  confidence: number
}

export interface AnalysisSuggestion {
  type: AnalysisType
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
  suggestion: string
  position?: TextPosition
  impact: number
}

export interface ContentStatistics {
  wordCount: number
  characterCount: number
  characterCountNoSpaces: number
  paragraphCount: number
  sentenceCount: number
  averageWordsPerSentence: number
  averageCharactersPerWord: number
  readingTime: number
  speakingTime: number
}

// Content Preview DTOs
export interface ContentPreviewRequest {
  contentId?: number // Set by URL parameter
  userId?: string // Set by backend
  textContent?: string // For previewing without saving
  platforms: string[]
  customizations?: Record<string, unknown>
}

export interface ContentPreviewResponse {
  contentId?: number
  previewId: string
  platforms: PlatformPreview[]
  generatedAt: string
}

export interface PlatformPreview {
  platform: string
  formattedContent: string
  characterCount: number
  characterLimit: number
  hashtags: string[]
  mediaUrls: string[]
  thumbnailUrl?: string
  estimatedReach: number
  engagementPrediction: number
  platformSpecificData: Record<string, unknown>
  warnings: string[]
  recommendations: string[]
}

// Publishing DTOs
export interface PublishContentRequest {
  contentId?: number // Set by URL parameter
  userId?: string // Set by backend
  workspaceId?: string
  platforms: string[]
  publishImmediately?: boolean
  scheduledTime?: string
  customizations?: Record<string, PlatformCustomization>
}

export interface PlatformCustomization {
  title?: string
  description?: string
  hashtags?: string[]
  mediaUrls?: string[]
  thumbnailUrl?: string
  platformSpecificSettings?: Record<string, unknown>
}

export interface PublishResponse {
  publishJobId: string
  contentId: number
  platforms: PlatformPublishResult[]
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  scheduledTime?: string
  estimatedCompletionTime?: string
}

export interface PlatformPublishResult {
  platform: string
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'SCHEDULED'
  publishedUrl?: string
  platformPostId?: string
  error?: string
  publishedAt?: string
  metrics?: PublishMetrics
}

export interface PublishMetrics {
  reach?: number
  impressions?: number
  engagement?: number
  clicks?: number
  shares?: number
  comments?: number
  likes?: number
  saves?: number
  conversions?: number
  revenue?: number
}

// Scheduling DTOs
export interface ScheduleContentRequest {
  contentId?: number // Set by URL parameter
  userId?: string // Set by backend
  scheduledTime: string
  platforms: string[]
  timezone?: string
  recurring?: RecurringSchedule
  customizations?: Record<string, PlatformCustomization>
}

export interface RecurringSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  interval: number
  daysOfWeek?: number[]
  endDate?: string
  maxOccurrences?: number
}

export interface ScheduleResponse {
  scheduleId: string
  contentId: number
  scheduledTime: string
  platforms: string[]
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'
  recurring?: RecurringSchedule
  nextExecution?: string
}

// Bulk Operations DTOs
export interface BulkOperationRequest {
  contentIds: number[]
  userId?: string // Set by backend
  workspaceId?: string
}

export interface BulkDeleteRequest extends BulkOperationRequest {}

export interface BulkPublishRequest extends BulkOperationRequest {
  platforms: string[]
  publishImmediately?: boolean
  scheduledTime?: string
}

export interface BulkScheduleRequest extends BulkOperationRequest {
  scheduledTime: string
  platforms: string[]
  timezone?: string
}

export interface BulkOperationResponse {
  operationId: string
  totalItems: number
  successCount: number
  failureCount: number
  results: BulkOperationResult[]
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  startedAt: string
  completedAt?: string
}

export interface BulkOperationResult {
  contentId: number
  status: 'SUCCESS' | 'FAILED'
  error?: string
  result?: unknown
}

// Performance and Analytics DTOs
export interface ContentPerformanceResponse {
  contentId: number
  timeRange: string
  platforms: PlatformPerformance[]
  overallMetrics: PerformanceMetrics
  trends: PerformanceTrend[]
  insights: PerformanceInsight[]
}

export interface PlatformPerformance {
  platform: string
  metrics: PerformanceMetrics
  trends: PerformanceTrend[]
  topPosts: TopPost[]
}

export interface PerformanceMetrics {
  reach: number
  impressions: number
  engagement: number
  engagementRate: number
  clicks: number
  shares: number
  comments: number
  likes: number
  saves: number
  conversions: number
  revenue?: number
}

export interface PerformanceTrend {
  date: string
  metrics: PerformanceMetrics
}

export interface TopPost {
  postId: string
  platform: string
  content: string
  metrics: PerformanceMetrics
  publishedAt: string
}

export interface PerformanceInsight {
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  title: string
  description: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation?: string
  data?: Record<string, unknown>
}

export interface EngagementMetricsResponse {
  contentId: number
  platform?: string
  timeRange: string
  engagementBreakdown: EngagementBreakdown
  audienceInsights: AudienceInsights
  contentInsights: ContentInsights
  recommendations: EngagementRecommendation[]
}

export interface EngagementBreakdown {
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  reactions: ReactionBreakdown[]
}

export interface ReactionBreakdown {
  type: string
  count: number
  percentage: number
}

export interface AudienceInsights {
  demographics: Demographics
  interests: Interest[]
  behavior: BehaviorInsights
  engagement: AudienceEngagement
}

export interface Demographics {
  ageGroups: AgeGroup[]
  genders: GenderBreakdown[]
  locations: LocationBreakdown[]
  languages: LanguageBreakdown[]
}

export interface AgeGroup {
  range: string
  percentage: number
  engagement: number
}

export interface GenderBreakdown {
  gender: string
  percentage: number
  engagement: number
}

export interface LocationBreakdown {
  country: string
  city?: string
  percentage: number
  engagement: number
}

export interface LanguageBreakdown {
  language: string
  percentage: number
  engagement: number
}

export interface Interest {
  category: string
  subcategories: string[]
  affinity: number
}

export interface BehaviorInsights {
  activeHours: HourlyActivity[]
  activeDays: DailyActivity[]
  deviceUsage: DeviceUsage[]
  contentPreferences: ContentPreference[]
}

export interface HourlyActivity {
  hour: number
  activity: number
  engagement: number
}

export interface DailyActivity {
  day: string
  activity: number
  engagement: number
}

export interface DeviceUsage {
  device: string
  percentage: number
  engagement: number
}

export interface ContentPreference {
  contentType: string
  preference: number
  engagement: number
}

export interface AudienceEngagement {
  averageEngagementRate: number
  loyaltyScore: number
  growthRate: number
  churnRate: number
}

export interface ContentInsights {
  bestPerformingElements: ContentElement[]
  contentOptimization: ContentOptimizationInsight[]
  hashtagPerformance: HashtagPerformance[]
  postingTimeOptimization: TimeOptimization
}

export interface ContentElement {
  element: string
  type: 'HASHTAG' | 'MENTION' | 'KEYWORD' | 'MEDIA' | 'CTA'
  performance: number
  frequency: number
}

export interface ContentOptimizationInsight {
  aspect: string
  currentScore: number
  potentialScore: number
  recommendation: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface HashtagPerformance {
  hashtag: string
  reach: number
  engagement: number
  frequency: number
  trending: boolean
}

export interface TimeOptimization {
  bestHours: number[]
  bestDays: string[]
  timezone: string
  confidence: number
}

export interface EngagementRecommendation {
  type: 'CONTENT' | 'TIMING' | 'AUDIENCE' | 'PLATFORM'
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  expectedImpact: number
  implementation: string
}

// Duplicate Content DTO
export interface DuplicateContentRequest {
  sourceContentId?: number // Set by URL parameter
  userId?: string // Set by backend
  title?: string
  workspaceId?: string
  preserveScheduling?: boolean
  preserveMedia?: boolean
}

// Content Library Types
export interface ContentLibraryRequest {
  userId?: number
  workspaceId?: number
  status?: ContentStatus[]
  contentType?: ContentType[]
  tags?: string[]
  startDate?: string
  endDate?: string
  aiGenerated?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export interface ContentSearchRequest {
  userId?: number
  query?: string
  status?: ContentStatus[]
  contentType?: ContentType[]
  tags?: string[]
  startDate?: string
  endDate?: string
  aiGenerated?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export interface ContentExportRequest {
  userId?: number
  workspaceId?: number
  status?: ContentStatus[]
  contentType?: ContentType[]
  tags?: string[]
  format?: 'PDF' | 'DOCX' | 'HTML' | 'MARKDOWN'
}

export interface ContentExportResponse {
  exportUrl: string
  totalItems: number
  format: string
  generatedAt: string
}

export interface ContentLibraryStatsResponse {
  totalContent: number
  draftCount: number
  publishedCount: number
  archivedCount: number
  favoritesCount: number
  recentActivityCount: number
  contentByType: Record<ContentType, number>
}

export interface ContentTagResponse {
  name: string
  count: number
}