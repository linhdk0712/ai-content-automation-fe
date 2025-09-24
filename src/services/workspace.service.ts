import { api } from './api';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  ownerId: string;
  settings: WorkspaceSettings;
  subscription: WorkspaceSubscription;
  statistics: WorkspaceStatistics;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface WorkspaceSettings {
  workspaceName: string;
  workspaceDescription: string;
  workspaceTimezone: string;
  workspaceLanguage: string;
  visibility: 'private' | 'public' | 'internal';
  allowInvites: boolean;
  requireApproval: boolean;
  maxMembers: number;
  storageLimit: number;
  aiUsageLimit: number;
  defaultRole: MemberRole;
  allowPublicTemplates: boolean;
  contentApprovalRequired: boolean;
  brandKit: BrandKit;
  integrations: WorkspaceIntegrations;
  notifications: WorkspaceNotificationSettings;
  security: WorkspaceSecuritySettings;
}

export interface BrandKit {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  brandGuidelines?: string;
  assets: BrandAsset[];
}

export interface BrandAsset {
  id: string;
  name: string;
  type: 'logo' | 'image' | 'font' | 'template';
  url: string;
  metadata?: Record<string, any>;
}

export interface WorkspaceIntegrations {
  socialMedia: SocialMediaIntegration[];
  aiProviders: AIProviderIntegration[];
  analytics: AnalyticsIntegration[];
  storage: StorageIntegration[];
  webhooks: WebhookIntegration[];
}

export interface SocialMediaIntegration {
  platform: string;
  accountId: string;
  accountName: string;
  isConnected: boolean;
  permissions: string[];
  connectedAt: string;
  lastSync?: string;
}

export interface AIProviderIntegration {
  provider: string;
  apiKey: string;
  isActive: boolean;
  usage: AIUsageStats;
  settings: Record<string, any>;
}

export interface AIUsageStats {
  totalRequests: number;
  totalCost: number;
  monthlyLimit: number;
  currentMonthUsage: number;
  lastReset: string;
}

export interface AnalyticsIntegration {
  provider: string;
  trackingId: string;
  isActive: boolean;
  settings: Record<string, any>;
}

export interface StorageIntegration {
  provider: string;
  bucket: string;
  region: string;
  isActive: boolean;
  usage: StorageUsageStats;
}

export interface StorageUsageStats {
  totalFiles: number;
  totalSize: number;
  monthlyTransfer: number;
  storageLimit: number;
}

export interface WebhookIntegration {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  lastDelivery?: string;
  deliveryStats: WebhookDeliveryStats;
}

export interface WebhookDeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
}

export interface WorkspaceNotificationSettings {
  emailNotifications: boolean;
  slackIntegration?: SlackIntegration;
  teamsIntegration?: TeamsIntegration;
  customWebhooks: string[];
}

export interface SlackIntegration {
  workspaceId: string;
  channelId: string;
  botToken: string;
  isActive: boolean;
}

export interface TeamsIntegration {
  tenantId: string;
  channelId: string;
  webhookUrl: string;
  isActive: boolean;
}

export interface WorkspaceSecuritySettings {
  twoFactorRequired: boolean;
  ipWhitelist: string[];
  sessionTimeout: number;
  passwordPolicy: PasswordPolicy;
  auditLogging: boolean;
  dataRetention: DataRetentionPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
}

export interface DataRetentionPolicy {
  contentRetention: number; // days
  logRetention: number; // days
  analyticsRetention: number; // days
  autoDelete: boolean;
}

export interface WorkspaceSubscription {
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;
  addOns: SubscriptionAddOn[];
  paymentMethod?: PaymentMethod;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid'
}

export interface SubscriptionUsage {
  contentGenerated: number;
  storageUsed: number;
  apiCalls: number;
  teamMembers: number;
  socialAccounts: number;
}

export interface SubscriptionLimits {
  maxContentPerMonth: number;
  maxStorageGB: number;
  maxApiCallsPerMonth: number;
  maxTeamMembers: number;
  maxSocialAccounts: number;
  features: string[];
}

export interface SubscriptionAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface WorkspaceStatistics {
  totalMembers: number;
  totalContent: number;
  totalStorage: number;
  monthlyActiveUsers: number;
  contentCreatedThisMonth: number;
  engagementRate: number;
  averageContentScore: number;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: MemberRole;
  permissions: MemberPermissions;
  status: MemberStatus;
  invitedBy?: string;
  joinedAt: string;
  lastActive?: string;
  user: WorkspaceUser;
}

export interface WorkspaceUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isOnline: boolean;
}

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export interface MemberPermissions {
  canCreateContent: boolean;
  canEditContent: boolean;
  canDeleteContent: boolean;
  canPublishContent: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canManageIntegrations: boolean;
}

export enum MemberStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
  LEFT = 'left'
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  message?: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface WorkspaceActivity {
  id: string;
  workspaceId: string;
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  slug?: string;
  settings?: Partial<WorkspaceSettings>;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  settings?: Partial<WorkspaceSettings>;
}

export interface InviteMemberRequest {
  email: string;
  role: MemberRole;
  message?: string;
}

export interface UpdateMemberRequest {
  role?: MemberRole;
  permissions?: Partial<MemberPermissions>;
}

export interface WorkspaceFilter {
  status?: 'active' | 'inactive';
  role?: MemberRole;
  search?: string;
}

export interface BillingInfo {
  subscription: WorkspaceSubscription;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  amount: number;
  currency: string;
  usage: UsageDetails;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  downloadUrl: string;
  items: InvoiceItem[];
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible'
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface UsageDetails {
  current: SubscriptionUsage;
  limits: SubscriptionLimits;
  history: UsageHistory[];
  projections: UsageProjection[];
}

export interface UsageHistory {
  period: string;
  usage: SubscriptionUsage;
}

export interface UsageProjection {
  metric: string;
  currentUsage: number;
  projectedUsage: number;
  projectedOverage: number;
  confidence: number;
}

export class WorkspaceService {
  // Workspace Management
  async createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace> {
    const response = await api.post('/workspaces', request);
    return response.data;
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  }

  async updateWorkspace(id: string, request: UpdateWorkspaceRequest): Promise<Workspace> {
    const response = await api.put(`/workspaces/${id}`, request);
    return response.data;
  }

  async deleteWorkspace(id: string): Promise<void> {
    await api.delete(`/workspaces/${id}`);
  }

  async listWorkspaces(filter?: WorkspaceFilter): Promise<Workspace[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/workspaces?${params.toString()}`);
    return response.data;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace> {
    const response = await api.get(`/workspaces/slug/${slug}`);
    return response.data;
  }

  async checkSlugAvailability(slug: string): Promise<boolean> {
    const response = await api.get(`/workspaces/slug/${slug}/available`);
    return response.data.available;
  }

  // Team Management
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await api.get(`/workspaces/${workspaceId}/members`);
    return response.data;
  }

  async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    const response = await api.get(`/workspaces/${workspaceId}/members/${userId}`);
    return response.data;
  }

  async inviteMember(workspaceId: string, request: InviteMemberRequest): Promise<WorkspaceInvitation> {
    const response = await api.post(`/workspaces/${workspaceId}/invitations`, request);
    return response.data;
  }

  async updateMember(
    workspaceId: string, 
    userId: string, 
    request: UpdateMemberRequest
  ): Promise<WorkspaceMember> {
    const response = await api.put(`/workspaces/${workspaceId}/members/${userId}`, request);
    return response.data;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
  }

  async suspendMember(workspaceId: string, userId: string, reason?: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/members/${userId}/suspend`, { reason });
  }

  async reactivateMember(workspaceId: string, userId: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/members/${userId}/reactivate`);
  }

  async transferOwnership(workspaceId: string, newOwnerId: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/transfer-ownership`, { newOwnerId });
  }

  // Invitation Management
  async getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
    const response = await api.get(`/workspaces/${workspaceId}/invitations`);
    return response.data;
  }

  async cancelInvitation(workspaceId: string, invitationId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
  }

  async resendInvitation(workspaceId: string, invitationId: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/invitations/${invitationId}/resend`);
  }

  async acceptInvitation(invitationId: string): Promise<WorkspaceMember> {
    const response = await api.post(`/invitations/${invitationId}/accept`);
    return response.data;
  }

  async declineInvitation(invitationId: string): Promise<void> {
    await api.post(`/invitations/${invitationId}/decline`);
  }

  // Activity Tracking
  async getActivity(
    workspaceId: string,
    limit = 50,
    offset = 0,
    userId?: string,
    action?: string
  ): Promise<WorkspaceActivity[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    if (userId) params.append('userId', userId);
    if (action) params.append('action', action);

    const response = await api.get(`/workspaces/${workspaceId}/activity?${params.toString()}`);
    return response.data;
  }

  async trackActivity(
    workspaceId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/activity`, {
      action,
      resourceType,
      resourceId,
      details
    });
  }

  async getActivitySummary(
    workspaceId: string,
    dateRange?: { start: string; end: string }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }

    const response = await api.get(`/workspaces/${workspaceId}/activity/summary?${params.toString()}`);
    return response.data;
  }

  // Billing Integration
  async getBillingInfo(workspaceId: string): Promise<BillingInfo> {
    const response = await api.get(`/workspaces/${workspaceId}/billing`);
    return response.data;
  }

  async updateSubscription(
    workspaceId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<WorkspaceSubscription> {
    const response = await api.put(`/workspaces/${workspaceId}/subscription`, {
      planId,
      billingCycle
    });
    return response.data;
  }

  async cancelSubscription(workspaceId: string, reason?: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/subscription/cancel`, { reason });
  }

  async reactivateSubscription(workspaceId: string): Promise<WorkspaceSubscription> {
    const response = await api.post(`/workspaces/${workspaceId}/subscription/reactivate`);
    return response.data;
  }

  async addPaymentMethod(
    workspaceId: string,
    paymentMethodId: string,
    setAsDefault = false
  ): Promise<PaymentMethod> {
    const response = await api.post(`/workspaces/${workspaceId}/payment-methods`, {
      paymentMethodId,
      setAsDefault
    });
    return response.data;
  }

  async removePaymentMethod(workspaceId: string, paymentMethodId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/payment-methods/${paymentMethodId}`);
  }

  async setDefaultPaymentMethod(workspaceId: string, paymentMethodId: string): Promise<void> {
    await api.put(`/workspaces/${workspaceId}/payment-methods/${paymentMethodId}/default`);
  }

  async getInvoices(workspaceId: string): Promise<Invoice[]> {
    const response = await api.get(`/workspaces/${workspaceId}/invoices`);
    return response.data;
  }

  async downloadInvoice(workspaceId: string, invoiceId: string): Promise<Blob> {
    const response = await api.get(`/workspaces/${workspaceId}/invoices/${invoiceId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getUsageDetails(workspaceId: string): Promise<UsageDetails> {
    const response = await api.get(`/workspaces/${workspaceId}/usage`);
    return response.data;
  }

  // Settings Management
  async updateSettings(
    workspaceId: string,
    settings: Partial<WorkspaceSettings>
  ): Promise<WorkspaceSettings> {
    const response = await api.put(`/workspaces/${workspaceId}/settings`, settings);
    return response.data;
  }

  async updateBrandKit(workspaceId: string, brandKit: Partial<BrandKit>): Promise<BrandKit> {
    const response = await api.put(`/workspaces/${workspaceId}/brand-kit`, brandKit);
    return response.data;
  }

  async uploadBrandAsset(
    workspaceId: string,
    file: File,
    type: 'logo' | 'image' | 'font' | 'template',
    name?: string
  ): Promise<BrandAsset> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (name) formData.append('name', name);

    const response = await api.post(`/workspaces/${workspaceId}/brand-assets`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async deleteBrandAsset(workspaceId: string, assetId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/brand-assets/${assetId}`);
  }

  // Integration Management
  async connectSocialMedia(
    workspaceId: string,
    platform: string,
    authCode: string
  ): Promise<SocialMediaIntegration> {
    const response = await api.post(`/workspaces/${workspaceId}/integrations/social-media`, {
      platform,
      authCode
    });
    return response.data;
  }

  async disconnectSocialMedia(workspaceId: string, platform: string, accountId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/integrations/social-media/${platform}/${accountId}`);
  }

  async updateAIProvider(
    workspaceId: string,
    provider: string,
    settings: Partial<AIProviderIntegration>
  ): Promise<AIProviderIntegration> {
    const response = await api.put(`/workspaces/${workspaceId}/integrations/ai-providers/${provider}`, settings);
    return response.data;
  }

  async createWebhook(
    workspaceId: string,
    webhook: Omit<WebhookIntegration, 'id' | 'deliveryStats'>
  ): Promise<WebhookIntegration> {
    const response = await api.post(`/workspaces/${workspaceId}/integrations/webhooks`, webhook);
    return response.data;
  }

  async updateWebhook(
    workspaceId: string,
    webhookId: string,
    updates: Partial<WebhookIntegration>
  ): Promise<WebhookIntegration> {
    const response = await api.put(`/workspaces/${workspaceId}/integrations/webhooks/${webhookId}`, updates);
    return response.data;
  }

  async deleteWebhook(workspaceId: string, webhookId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/integrations/webhooks/${webhookId}`);
  }

  async testWebhook(workspaceId: string, webhookId: string): Promise<any> {
    const response = await api.post(`/workspaces/${workspaceId}/integrations/webhooks/${webhookId}/test`);
    return response.data;
  }

  // Statistics and Analytics
  async getStatistics(workspaceId: string): Promise<WorkspaceStatistics> {
    const response = await api.get(`/workspaces/${workspaceId}/statistics`);
    return response.data;
  }

  async getAnalytics(
    workspaceId: string,
    dateRange?: { start: string; end: string }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }

    const response = await api.get(`/workspaces/${workspaceId}/analytics?${params.toString()}`);
    return response.data;
  }

  async getTeamPerformance(workspaceId: string): Promise<any> {
    const response = await api.get(`/workspaces/${workspaceId}/team/performance`);
    return response.data;
  }

  async getContentMetrics(workspaceId: string): Promise<any> {
    const response = await api.get(`/workspaces/${workspaceId}/content/metrics`);
    return response.data;
  }

  // Export and Backup
  async exportWorkspaceData(
    workspaceId: string,
    format: 'json' | 'csv' = 'json',
    includeContent = true,
    includeAnalytics = false
  ): Promise<Blob> {
    const response = await api.post(`/workspaces/${workspaceId}/export`, {
      format,
      includeContent,
      includeAnalytics
    }, {
      responseType: 'blob'
    });
    return response.data;
  }

  async createBackup(workspaceId: string, description?: string): Promise<any> {
    const response = await api.post(`/workspaces/${workspaceId}/backups`, { description });
    return response.data;
  }

  async getBackups(workspaceId: string): Promise<any[]> {
    const response = await api.get(`/workspaces/${workspaceId}/backups`);
    return response.data;
  }

  async restoreBackup(workspaceId: string, backupId: string): Promise<void> {
    await api.post(`/workspaces/${workspaceId}/backups/${backupId}/restore`);
  }

  async deleteBackup(workspaceId: string, backupId: string): Promise<void> {
    await api.delete(`/workspaces/${workspaceId}/backups/${backupId}`);
  }

  // Workspace Templates
  async createFromTemplate(templateId: string, name: string, slug?: string): Promise<Workspace> {
    const response = await api.post('/workspaces/from-template', {
      templateId,
      name,
      slug
    });
    return response.data;
  }

  async saveAsTemplate(
    workspaceId: string,
    name: string,
    description?: string,
    isPublic = false
  ): Promise<any> {
    const response = await api.post(`/workspaces/${workspaceId}/save-as-template`, {
      name,
      description,
      isPublic
    });
    return response.data;
  }

  async getWorkspaceTemplates(): Promise<any[]> {
    const response = await api.get('/workspace-templates');
    return response.data;
  }
}