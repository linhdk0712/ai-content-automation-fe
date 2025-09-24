import { useState, useCallback } from 'react';
import { securityService } from '../services/security.service';

interface SecurityMetrics {
  securityScore: number;
  riskLevel: string;
  threatEvents: number;
  auditEvents: number;
  dlpViolations: number;
  complianceViolations: number;
  activeKeys: number;
  lastUpdated: string;
}

interface ThreatEvent {
  id: string;
  type: string;
  level: string;
  description: string;
  detectedAt: string;
  status: string;
}

interface ThreatEventsQuery {
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const useSecurityDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSecurityMetrics = useCallback(async (workspaceId?: string): Promise<SecurityMetrics> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.getSecurityMetrics(workspaceId);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch security metrics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getThreatEvents = useCallback(async (query: ThreatEventsQuery = {}): Promise<ThreatEvent[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.getThreatEvents(query);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch threat events';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveThreateEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await securityService.resolveThreatEvent(eventId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resolve threat event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAuditEvents = useCallback(async (query: any = {}): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.getAuditEvents(query);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch audit events';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyAuditLogIntegrity = useCallback(async (eventId: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.verifyAuditLogIntegrity(eventId);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify audit log integrity';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const scanContentForDLP = useCallback(async (contentId: string, content: string, workspaceId: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.scanContentForDLP(contentId, content, workspaceId);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to scan content for DLP violations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDLPViolations = useCallback(async (workspaceId: string, startDate?: string, endDate?: string): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.getDLPViolations(workspaceId, startDate, endDate);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch DLP violations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateComplianceReport = useCallback(async (reportType: string, workspaceId: string, startDate: string, endDate: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.generateComplianceReport(reportType, workspaceId, startDate, endDate);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate compliance report';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const configureSSOForWorkspace = useCallback(async (workspaceId: string, config: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.configureSSOForWorkspace(workspaceId, config);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to configure SSO';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const testSSOConfiguration = useCallback(async (workspaceId: string, provider: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.testSSOConfiguration(workspaceId, provider);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to test SSO configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const encryptData = useCallback(async (data: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.encryptData(data);
      return response.data.encryptedData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to encrypt data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const decryptData = useCallback(async (encryptedData: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await securityService.decryptData(encryptedData);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to decrypt data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getSecurityMetrics,
    getThreatEvents,
    resolveThreateEvent,
    getAuditEvents,
    verifyAuditLogIntegrity,
    scanContentForDLP,
    getDLPViolations,
    generateComplianceReport,
    configureSSOForWorkspace,
    testSSOConfiguration,
    encryptData,
    decryptData
  };
};