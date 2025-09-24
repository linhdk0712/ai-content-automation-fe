import { WebSocketService } from './websocket.service';

export interface SystemStatus {
  overall: HealthStatus;
  services: ServiceStatus[];
  lastUpdated: number;
  uptime: number;
  version: string;
  environment: string;
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  MAINTENANCE = 'maintenance'
}

export interface ServiceStatus {
  name: string;
  status: HealthStatus;
  responseTime: number;
  uptime: number;
  lastCheck: number;
  dependencies: ServiceDependency[];
  metrics: ServiceMetrics;
  incidents: Incident[];
}

export interface ServiceDependency {
  name: string;
  status: HealthStatus;
  required: boolean;
}

export interface ServiceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  requests: number;
  errors: number;
  latency: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: string[];
  startedAt: number;
  resolvedAt?: number;
  updates: IncidentUpdate[];
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  INVESTIGATING = 'investigating',
  IDENTIFIED = 'identified',
  MONITORING = 'monitoring',
  RESOLVED = 'resolved'
}

export interface IncidentUpdate {
  id: string;
  message: string;
  timestamp: number;
  author: string;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: number;
  scheduledEnd: number;
  actualStart?: number;
  actualEnd?: number;
  status: MaintenanceStatus;
  affectedServices: string[];
  impact: MaintenanceImpact;
  notifications: MaintenanceNotification[];
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum MaintenanceImpact {
  NO_IMPACT = 'no_impact',
  MINOR = 'minor',
  MAJOR = 'major',
  FULL_OUTAGE = 'full_outage'
}

export interface MaintenanceNotification {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'warning' | 'update';
}

export interface StatusSubscription {
  services?: string[];
  includeMetrics: boolean;
  includeIncidents: boolean;
  includeMaintenance: boolean;
  interval: number;
}

export interface StatusPageConfig {
  title: string;
  description: string;
  logo?: string;
  theme: 'light' | 'dark' | 'auto';
  showMetrics: boolean;
  showIncidents: boolean;
  showMaintenance: boolean;
  refreshInterval: number;
}

export class SystemStatusService {
  private wsService: WebSocketService;
  private systemStatus: SystemStatus | null = null;
  private incidents: Map<string, Incident> = new Map();
  private maintenanceWindows: Map<string, MaintenanceWindow> = new Map();
  private statusCallbacks: ((status: SystemStatus) => void)[] = [];
  private incidentCallbacks: ((incident: Incident) => void)[] = [];
  private maintenanceCallbacks: ((maintenance: MaintenanceWindow) => void)[] = [];
  private statusPageConfig: StatusPageConfig;

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    this.statusPageConfig = this.getDefaultConfig();
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    this.wsService.subscribe('system_status_update');
    this.wsService.subscribe('service_status_update');
    this.wsService.subscribe('incident_created');
    this.wsService.subscribe('incident_updated');
    this.wsService.subscribe('incident_resolved');
    this.wsService.subscribe('maintenance_scheduled');
    this.wsService.subscribe('maintenance_started');
    this.wsService.subscribe('maintenance_completed');
    this.wsService.subscribe('maintenance_notification');
    this.wsService.subscribe('health_check_failed');
    this.wsService.subscribe('performance_alert');
  }

  // Status Monitoring
  subscribeToStatus(subscription: StatusSubscription): void {
    
    this.wsService.send({ type: 'subscribe_system_status', payload: subscription });
    this.wsService.send({ type: 'subscribe_service_status', payload: {} });
    this.wsService.send({ type: 'subscribe_incident', payload: {} });
    this.wsService.send({ type: 'subscribe_maintenance', payload: {} });
    this.wsService.send({ type: 'subscribe_health_check', payload: {} });
    this.wsService.send({ type: 'subscribe_performance_alert', payload: {} });
  }

  unsubscribeFromStatus(): void {
    
    this.wsService.send({ type: 'unsubscribe_system_status', payload: {} });
    this.wsService.send({ type: 'unsubscribe_service_status', payload: {} });
    this.wsService.send({ type: 'unsubscribe_incident', payload: {} });
    this.wsService.send({ type: 'unsubscribe_maintenance', payload: {} });
    this.wsService.send({ type: 'unsubscribe_health_check', payload: {} });
    this.wsService.send({ type: 'unsubscribe_performance_alert', payload: {} });
  }

  getSystemStatus(): SystemStatus | null {
    return this.systemStatus;
  }

  refreshStatus(): void {
    this.wsService.send({ type: 'refresh_system_status', payload: {} });
  }



  // Incident Management
  getIncidents(): Incident[] {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  getActiveIncidents(): Incident[] {
    return this.getIncidents().filter(incident => 
      incident.status !== IncidentStatus.RESOLVED
    );
  }

  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }




  // Maintenance Management
  getMaintenanceWindows(): MaintenanceWindow[] {
    return Array.from(this.maintenanceWindows.values())
      .sort((a, b) => b.scheduledStart - a.scheduledStart);
  }

  getUpcomingMaintenance(): MaintenanceWindow[] {
    const now = Date.now();
    return this.getMaintenanceWindows().filter(maintenance => 
      maintenance.scheduledStart > now && 
      maintenance.status === MaintenanceStatus.SCHEDULED
    );
  }

  getCurrentMaintenance(): MaintenanceWindow[] {
    return this.getMaintenanceWindows().filter(maintenance => 
      maintenance.status === MaintenanceStatus.IN_PROGRESS
    );
  }








  // Status Page Configuration
  updateStatusPageConfig(config: Partial<StatusPageConfig>): void {
    this.statusPageConfig = { ...this.statusPageConfig, ...config };
    
    this.wsService.send({ type: 'update_status_page_config', payload:  {
      config: this.statusPageConfig,
      timestamp: Date.now()
    } });

    // Store config locally
    localStorage.setItem('status_page_config', JSON.stringify(this.statusPageConfig));
  }

  getStatusPageConfig(): StatusPageConfig {
    return { ...this.statusPageConfig };
  }

  // Event Listeners
  onStatusChange(callback: (status: SystemStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  onIncident(callback: (incident: Incident) => void): () => void {
    this.incidentCallbacks.push(callback);
    return () => {
      const index = this.incidentCallbacks.indexOf(callback);
      if (index > -1) {
        this.incidentCallbacks.splice(index, 1);
      }
    };
  }

  onMaintenance(callback: (maintenance: MaintenanceWindow) => void): () => void {
    this.maintenanceCallbacks.push(callback);
    return () => {
      const index = this.maintenanceCallbacks.indexOf(callback);
      if (index > -1) {
        this.maintenanceCallbacks.splice(index, 1);
      }
    };
  }

  // Utility Methods
  isSystemHealthy(): boolean {
    return this.systemStatus?.overall === HealthStatus.HEALTHY;
  }

  isServiceHealthy(serviceName: string): boolean {
    if (!this.systemStatus) return false;
    
    const service = this.systemStatus.services.find(s => s.name === serviceName);
    return service?.status === HealthStatus.HEALTHY;
  }

  getServiceUptime(serviceName: string): number {
    if (!this.systemStatus) return 0;
    
    const service = this.systemStatus.services.find(s => s.name === serviceName);
    return service?.uptime || 0;
  }

  getOverallUptime(): number {
    return this.systemStatus?.uptime || 0;
  }




  private getDefaultConfig(): StatusPageConfig {
    const stored = localStorage.getItem('status_page_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored status page config:', error);
      }
    }

    return {
      title: 'System Status',
      description: 'Real-time system health and performance monitoring',
      theme: 'auto',
      showMetrics: true,
      showIncidents: true,
      showMaintenance: true,
      refreshInterval: 30000
    };
  }

}