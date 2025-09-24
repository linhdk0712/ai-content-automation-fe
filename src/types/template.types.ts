// Comprehensive Template Management Types

// Comprehensive Template Management Types - Updated to match backend DTOs

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  ECOMMERCE = 'ECOMMERCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  TECHNOLOGY = 'TECHNOLOGY',
  FINANCE = 'FINANCE',
  TRAVEL = 'TRAVEL',
  FOOD = 'FOOD',
  FASHION = 'FASHION',
  REAL_ESTATE = 'REAL_ESTATE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  BLOG_POST = 'BLOG_POST',
  EMAIL = 'EMAIL',
  ADVERTISEMENT = 'ADVERTISEMENT',
  PRODUCT_DESCRIPTION = 'PRODUCT_DESCRIPTION',
  NEWS_ARTICLE = 'NEWS_ARTICLE',
  CREATIVE_WRITING = 'CREATIVE_WRITING',
  BUSINESS = 'BUSINESS',
  GENERAL = 'GENERAL'
}

export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED'
}

export enum TemplateType {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
  WORKFLOW = 'WORKFLOW',
  AI_GENERATED = 'AI_GENERATED',
  CUSTOM = 'CUSTOM'
}

export enum TemplateLanguage {
  ENGLISH = 'ENGLISH',
  SPANISH = 'SPANISH',
  FRENCH = 'FRENCH',
  GERMAN = 'GERMAN',
  ITALIAN = 'ITALIAN',
  PORTUGUESE = 'PORTUGUESE',
  CHINESE = 'CHINESE',
  JAPANESE = 'JAPANESE',
  KOREAN = 'KOREAN',
  ARABIC = 'ARABIC',
  RUSSIAN = 'RUSSIAN',
  OTHER = 'OTHER'
}

export enum TemplateIndustry {
  TECHNOLOGY = 'TECHNOLOGY',
  HEALTHCARE = 'HEALTHCARE',
  FINANCE = 'FINANCE',
  EDUCATION = 'EDUCATION',
  RETAIL = 'RETAIL',
  MANUFACTURING = 'MANUFACTURING',
  REAL_ESTATE = 'REAL_ESTATE',
  TRAVEL = 'TRAVEL',
  FOOD_BEVERAGE = 'FOOD_BEVERAGE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  NON_PROFIT = 'NON_PROFIT',
  GOVERNMENT = 'GOVERNMENT',
  CONSULTING = 'CONSULTING',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
}

export interface TemplateVariable {
  id: string
  name: string
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT'
  label: string
  description?: string
  required: boolean
  defaultValue?: string | number | boolean | string[]
  options?: string[] // For SELECT and MULTI_SELECT types
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
    customMessage?: string
  }
  placeholder?: string
  order: number
}

export interface TemplateSection {
  id: string
  name: string
  type: 'HEADER' | 'CONTENT' | 'FOOTER' | 'SIDEBAR' | 'CUSTOM'
  content: string
  variables: TemplateVariable[]
  order: number
  isRequired: boolean
  isRepeatable: boolean
  maxRepeats?: number
  conditions?: TemplateCondition[]
}

export interface TemplateCondition {
  id: string
  variableId: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IS_EMPTY' | 'IS_NOT_EMPTY'
  value: string | number | boolean
  action: 'SHOW' | 'HIDE' | 'REQUIRE' | 'OPTIONAL'
}

export interface TemplateWorkflow {
  id: string
  name: string
  description: string
  steps: TemplateWorkflowStep[]
  triggers: TemplateTrigger[]
  conditions: TemplateCondition[]
  isActive: boolean
  version: number
}

export interface TemplateWorkflowStep {
  id: string
  name: string
  type: 'APPROVAL' | 'REVIEW' | 'NOTIFICATION' | 'ASSIGNMENT' | 'CONDITION' | 'ACTION'
  order: number
  assignee?: {
    userId: number
    role: string
    type: 'USER' | 'ROLE' | 'TEAM'
  }
  conditions?: TemplateCondition[]
  actions?: TemplateAction[]
  timeout?: number
  isRequired: boolean
  parallelExecution: boolean
}

export interface TemplateTrigger {
  id: string
  type: 'MANUAL' | 'SCHEDULED' | 'EVENT' | 'WEBHOOK'
  name: string
  conditions?: TemplateCondition[]
  schedule?: {
    frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
    time?: string
    days?: string[]
    date?: string
  }
  event?: {
    eventType: string
    source: string
    filters?: Record<string, unknown>
  }
}

export interface TemplateAction {
  id: string
  type: 'EMAIL' | 'NOTIFICATION' | 'WEBHOOK' | 'INTEGRATION' | 'SCRIPT'
  name: string
  configuration: Record<string, unknown>
  conditions?: TemplateCondition[]
}

export interface TemplateMetadata {
  version: number
  lastModified: string
  modifiedBy: {
    id: number
    name: string
    email: string
  }
  tags: string[]
  keywords: string[]
  seoTitle?: string
  seoDescription?: string
  thumbnail?: string
  preview?: string
  estimatedTime?: number
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  rating?: number
  usageCount: number
  favoriteCount: number
  shareCount: number
  downloadCount: number
  viewCount: number
  lastUsed?: string
  performance?: TemplatePerformance
}

export interface TemplatePerformance {
  averageCompletionTime: number
  successRate: number
  userSatisfaction: number
  errorRate: number
  usageTrends: {
    daily: number[]
    weekly: number[]
    monthly: number[]
  }
  popularFeatures: string[]
  commonIssues: string[]
  recommendations: string[]
}

export interface TemplateAccess {
  isPublic: boolean
  isShared: boolean
  permissions: {
    view: string[]
    edit: string[]
    delete: string[]
    share: string[]
  }
  sharedWith: {
    userId: number
    email: string
    permission: 'VIEW' | 'EDIT' | 'ADMIN'
    expiresAt?: string
  }[]
  shareToken?: string
  shareExpiresAt?: string
  password?: string
}

export interface TemplateAnalytics {
  id: string
  templateId: number
  period: string
  metrics: {
    views: number
    uses: number
    completions: number
    abandons: number
    averageTime: number
    satisfaction: number
    errors: number
  }
  demographics: {
    ageGroups: Record<string, number>
    industries: Record<string, number>
    roles: Record<string, number>
    locations: Record<string, number>
  }
  trends: {
    daily: TemplateAnalyticsData[]
    weekly: TemplateAnalyticsData[]
    monthly: TemplateAnalyticsData[]
  }
  insights: TemplateInsight[]
}

export interface TemplateAnalyticsData {
  date: string
  views: number
  uses: number
  completions: number
  abandons: number
  averageTime: number
  satisfaction: number
  errors: number
}

export interface TemplateInsight {
  type: 'PERFORMANCE' | 'USAGE' | 'SATISFACTION' | 'ERROR' | 'TREND'
  title: string
  description: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation?: string
  data?: Record<string, unknown>
}

// Main Template Interface - Updated to match backend TemplateResponse
export interface Template {
  id: number
  name: string
  description?: string
  promptTemplate: string
  category: TemplateCategory
  industry?: string
  tags: string[]
  language: string
  targetAudience?: string
  tone?: string
  expectedWordCount?: number
  isPublic: boolean
  isFeatured: boolean
  isVerified: boolean
  version: number
  usageCount: number
  downloadCount: number
  forkCount: number
  successRate: number
  averageQualityScore: number
  averageProcessingTimeMs: number
  totalCost: number
  marketplaceVisibility: 'PRIVATE' | 'PUBLIC' | 'FEATURED'
  price: number
  licenseType: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  parentTemplateId?: number
  createdBy: number
  createdAt: string
  updatedAt: string
}

// Request/Response DTOs - Updated to match backend DTOs
export interface CreateTemplateRequest {
  name: string
  description?: string
  promptTemplate: string
  category: TemplateCategory
  industry?: string
  tags?: string[]
  language?: string
  targetAudience?: string
  tone?: string
  expectedWordCount?: number
  parameters?: string
  isPublic?: boolean
  price?: number
  licenseType?: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  marketplaceVisibility?: 'PRIVATE' | 'PUBLIC' | 'FEATURED'
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  promptTemplate?: string
  category?: TemplateCategory
  industry?: string
  tags?: string[]
  language?: string
  targetAudience?: string
  tone?: string
  expectedWordCount?: number
  parameters?: string
  isPublic?: boolean
  price?: number
  licenseType?: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  marketplaceVisibility?: 'PRIVATE' | 'PUBLIC' | 'FEATURED'
}

export interface TemplateSearchRequest {
  query?: string
  category?: TemplateCategory
  industry?: string
  language?: string
  licenseType?: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  marketplaceVisibility?: 'PRIVATE' | 'PUBLIC' | 'FEATURED'
  minRating?: number
  maxPrice?: number
  tags?: string[]
  createdBy?: number
  verifiedOnly?: boolean
  featuredOnly?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface TemplateSearchResponse {
  templates: Template[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  facets: {
    categories: Record<string, number>
    types: Record<string, number>
    industries: Record<string, number>
    languages: Record<string, number>
    difficulties: Record<string, number>
    tags: Record<string, number>
  }
  suggestions: string[]
  relatedTemplates: Template[]
}

export interface TemplateProcessRequest {
  templateId: number
  variables: Record<string, string | number | boolean | string[]>
  context?: {
    userId: number
    workspaceId?: number
    projectId?: number
    campaignId?: number
  }
  options?: {
    includeMetadata?: boolean
    includeAnalytics?: boolean
    validateVariables?: boolean
    generatePreview?: boolean
  }
}

export interface TemplateProcessResponse {
  processedContent: string
  metadata: {
    processingTime: number
    variablesUsed: string[]
    variablesMissing: string[]
    warnings: string[]
    errors: string[]
  }
  preview?: string
  analytics?: {
    templateId: number
    processedAt: string
    userId: number
    processingTime: number
  }
}

export interface TemplateValidationRequest {
  content: string
  variables?: TemplateVariable[]
  sections?: TemplateSection[]
  workflow?: TemplateWorkflow
}

export interface TemplateValidationResponse {
  isValid: boolean
  errors: TemplateValidationError[]
  warnings: TemplateValidationWarning[]
  suggestions: TemplateValidationSuggestion[]
  metrics: {
    complexityScore: number
    readabilityScore: number
    completenessScore: number
    consistencyScore: number
  }
}

export interface TemplateValidationError {
  type: 'SYNTAX' | 'VARIABLE' | 'WORKFLOW' | 'ACCESS' | 'CONTENT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  location?: {
    section?: string
    line?: number
    column?: number
    variable?: string
  }
  suggestion?: string
}

export interface TemplateValidationWarning {
  type: 'PERFORMANCE' | 'USABILITY' | 'ACCESSIBILITY' | 'SEO' | 'BEST_PRACTICE'
  message: string
  location?: {
    section?: string
    line?: number
    column?: number
  }
  suggestion?: string
}

export interface TemplateValidationSuggestion {
  type: 'IMPROVEMENT' | 'OPTIMIZATION' | 'ENHANCEMENT' | 'BEST_PRACTICE'
  message: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  suggestion: string
  location?: {
    section?: string
    line?: number
    column?: number
  }
}

// Bulk Operations
export interface BulkTemplateOperationRequest {
  templateIds: number[]
  operation: 'DELETE' | 'ARCHIVE' | 'PUBLISH' | 'UNPUBLISH' | 'SHARE' | 'EXPORT' | 'DUPLICATE'
  parameters?: Record<string, unknown>
}

export interface BulkTemplateOperationResponse {
  operationId: string
  totalItems: number
  successCount: number
  failureCount: number
  results: BulkTemplateOperationResult[]
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  startedAt: string
  completedAt?: string
}

export interface BulkTemplateOperationResult {
  templateId: number
  status: 'SUCCESS' | 'FAILED'
  error?: string
  result?: unknown
}

// Template Library
export interface TemplateLibrary {
  id: number
  name: string
  description: string
  templates: Template[]
  categories: TemplateCategory[]
  isPublic: boolean
  createdBy: {
    id: number
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  subscriberCount: number
  rating: number
}

// Template Import/Export
export interface TemplateExportRequest {
  templateIds: number[]
  format: 'JSON' | 'ZIP' | 'PDF' | 'DOCX' | 'HTML'
  includeAssets?: boolean
  includeAnalytics?: boolean
  includeVersions?: boolean
}

export interface TemplateImportRequest {
  file: File
  format: 'JSON' | 'ZIP' | 'PDF' | 'DOCX' | 'HTML'
  options?: {
    overwriteExisting?: boolean
    createNewVersions?: boolean
    preserveMetadata?: boolean
    validateContent?: boolean
  }
}

export interface TemplateImportResponse {
  importId: string
  totalTemplates: number
  successCount: number
  failureCount: number
  results: TemplateImportResult[]
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  startedAt: string
  completedAt?: string
}

export interface TemplateImportResult {
  templateName: string
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  templateId?: number
  error?: string
  warnings?: string[]
}
