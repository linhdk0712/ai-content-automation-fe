import { api } from './api';

export interface SecurityMetrics {
  securityScore: number;
  riskLevel: string;
  threatEvents: number;
  auditEvents: number;
  dlpViolations: number;
  complianceViolations: number;
  activeKeys: number;
  lastUpdated: string;
}

export interface ThreatEvent {
  id: string;
  type: string;
  level: string;
  description: string;
  detectedAt: string;
  status: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  userId: string;
  action: string;
  timestamp: string;
  result: string;
}

export interface DLPViolation {
  id: string;
  contentId: string;
  violationType: string;
  severity: string;
  detectedAt: string;
  status: string;
}

export interface SSOConfiguration {
  provider: string;
  entityId?: string;
  metadataUrl?: string;
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  active: boolean;
}

class SecurityService {
  // Security Dashboard
  async getSecurityMetrics(workspaceId?: string) {
    const params = workspaceId ? { workspaceId } : {};
    return api.get<SecurityMetrics>('/security/dashboard/metrics', { params });
  }

  async getSecurityDashboard(workspaceId?: string) {
    const params = workspaceId ? { workspaceId } : {};
    return api.get('/security/dashboard/summary', { params });
  }

  // Threat Detection
  async getThreatEvents(query: any = {}) {
    return api.get<ThreatEvent[]>('/security/threats/events', { params: query });
  }

  async analyzeThreat(userId: string, sessionId: string, activityData: any) {
    return api.post('/security/threats/analyze', activityData, {
      params: { userId, sessionId }
    });
  }

  async resolveThreatEvent(eventId: string) {
    return api.patch(`/security/threats/events/${eventId}/resolve`);
  }

  // Audit Management
  async getAuditEvents(query: any = {}) {
    return api.get<AuditEvent[]>('/security/audit/events', { params: query });
  }

  async verifyAuditLogIntegrity(eventId: string) {
    return api.get(`/security/audit/verify/${eventId}`);
  }

  // Data Loss Prevention
  async scanContentForDLP(contentId: string, content: string, workspaceId: string) {
    return api.post('/security/dlp/scan', content, {
      params: { contentId, workspaceId },
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  async createDLPPolicy(workspaceId: string, policy: any) {
    return api.post('/security/dlp/policies', policy, {
      params: { workspaceId }
    });
  }

  async getDLPViolations(workspaceId: string, startDate?: string, endDate?: string) {
    const params: any = { workspaceId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return api.get<DLPViolation[]>('/security/dlp/violations', { params });
  }

  // SSO Management
  async configureSSOForWorkspace(workspaceId: string, config: SSOConfiguration) {
    return api.post('/security/sso/configure', config, {
      params: { workspaceId }
    });
  }

  async testSSOConfiguration(workspaceId: string, provider: string) {
    return api.get('/security/sso/test', {
      params: { workspaceId, provider }
    });
  }

  // Encryption
  async encryptData(data: string) {
    return api.post('/security/encryption/encrypt', { data });
  }

  async decryptData(encryptedData: string) {
    return api.post('/security/encryption/decrypt', { encryptedData });
  }

  async generateEncryptionKey(keyType: string, workspaceId?: string) {
    const params: any = { keyType };
    if (workspaceId) params.workspaceId = workspaceId;
    
    return api.post('/security/encryption/keys/generate', null, { params });
  }

  async rotateEncryptionKey(keyId: string) {
    return api.post(`/security/encryption/keys/${keyId}/rotate`);
  }

  // Compliance
  async generateComplianceReport(reportType: string, workspaceId: string, startDate: string, endDate: string) {
    return api.get(`/security/compliance/reports/${reportType}`, {
      params: { workspaceId, startDate, endDate }
    });
  }

  async getComplianceViolations(workspaceId?: string, ruleType?: string, severity?: string) {
    const params: any = {};
    if (workspaceId) params.workspaceId = workspaceId;
    if (ruleType) params.ruleType = ruleType;
    if (severity) params.severity = severity;
    
    return api.get('/security/compliance/violations', { params });
  }

  async createComplianceRule(rule: any) {
    return api.post('/security/compliance/rules', rule);
  }
}

export const securityService = new SecurityService();