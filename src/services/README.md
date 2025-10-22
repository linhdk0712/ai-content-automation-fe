# Services Layer Documentation

## Overview

The services layer provides a centralized API interface for the AI Content Automation platform. All services follow consistent patterns for error handling, authentication, and data transformation.

## Architecture

### Service Organization
```
src/services/
├── api.ts                    # Base API configuration and utilities
├── auth.service.ts           # Authentication and user management
├── content.service.ts        # Content creation and management
├── realtime.manager.ts       # Real-time features coordination
├── socket.service.ts         # WebSocket/Socket.IO client
├── liveAnalytics.service.ts  # Real-time analytics
├── publishingStatus.service.ts # Publishing job status tracking
└── [feature].service.ts      # Feature-specific services
```

### Base Configuration

#### API Service (`api.ts`)
Central configuration for all HTTP requests:
- Base URL: `/api/v1` (proxied through Vite)
- Authentication: JWT token handling
- Error handling: Centralized error processing
- Request/Response interceptors

```typescript
import { apiRequest } from '@/services/api';

// GET request
const data = await apiRequest<ResponseType>('/endpoint');

// POST request with data
const result = await apiRequest<ResponseType>('/endpoint', {
  method: 'POST',
  body: requestData
});
```

## Real-time Services

### Socket Service (`socket.service.ts`)
Manages WebSocket connections for real-time features:

**Configuration:**
- Server URL: `VITE_REALTIME_SERVER_URL` (default: `http://localhost:3001`)
- Transport: WebSocket with polling fallback
- Auto-reconnection: Up to 5 attempts with exponential backoff

**Key Features:**
- Dynamic Socket.IO client loading
- Room-based event handling
- Connection state management
- Error handling with fallbacks

```typescript
import { socketService } from '@/services/socket.service';

// Connect with event handlers
await socketService.connect({
  userId: currentUser.id,
  onConnection: () => console.log('Connected'),
  onWorkflowUpdate: (data) => handleWorkflowUpdate(data),
  onError: (error) => handleError(error)
});

// Join specific rooms
socketService.joinExecutionRoom(executionId);
socketService.joinContentRoom(contentId);
```

### Real-time Manager (`realtime.manager.ts`)
Orchestrates all real-time services:

**Responsibilities:**
- Initialize Socket.IO connections
- Coordinate real-time services
- Handle connection failures
- Manage subscriptions

```typescript
import { realTimeManager } from '@/services/realtime.manager';

// Initialize real-time features
await realTimeManager.initialize(userId);

// Subscribe to content updates
realTimeManager.subscribeToContent(contentId);

// Subscribe to execution updates
realTimeManager.subscribeToExecution(executionId);

// Check connection status
const status = realTimeManager.getConnectionStatus();
```

### Live Analytics Service (`liveAnalytics.service.ts`)
Real-time analytics data processing:

**Features:**
- Socket.IO event processing
- Metrics buffering and batching
- Real-time dashboard updates
- Performance monitoring

```typescript
import { liveAnalyticsService } from '@/services/liveAnalytics.service';

// Subscribe to analytics updates
liveAnalyticsService.on('metrics_update', (metrics) => {
  updateDashboard(metrics);
});

// Get current metrics
const currentMetrics = liveAnalyticsService.getCurrentMetrics();
```

### Publishing Status Service (`publishingStatus.service.ts`)
Tracks content publishing job status:

**Features:**
- Job status tracking
- Real-time progress updates
- Error handling for failed jobs
- Completion notifications

```typescript
import { publishingStatusService } from '@/services/publishingStatus.service';

// Subscribe to job updates
publishingStatusService.subscribeToJob(jobId);

// Listen for status changes
publishingStatusService.on('job_update', (job) => {
  updateJobStatus(job);
});
```

## Core Services

### Authentication Service (`auth.service.ts`)
Handles user authentication and session management:

**Features:**
- JWT token management
- User login/logout
- Session validation
- Role-based access control

```typescript
import { authService } from '@/services/auth.service';

// Login user
const user = await authService.login(credentials);

// Get current user
const currentUser = await authService.getCurrentUser();

// Logout
await authService.logout();
```

### Content Service (`content.service.ts`)
Manages content creation, editing, and publishing:

**Features:**
- AI content generation
- Content CRUD operations
- Version control
- Publishing workflows

```typescript
import { contentService } from '@/services/content.service';

// Generate content
const content = await contentService.generateContent({
  prompt: 'Create a blog post about AI',
  provider: 'openai',
  template: 'blog-post'
});

// Save content
const savedContent = await contentService.saveContent(content);

// Publish content
await contentService.publishContent(contentId, platforms);
```

## Service Patterns

### Error Handling
All services implement consistent error handling:

```typescript
try {
  const result = await serviceMethod();
  return result;
} catch (error) {
  console.error('Service error:', error);
  throw new ServiceError('Operation failed', error);
}
```

### Authentication
Services automatically include authentication headers:

```typescript
// Automatically includes JWT token
const response = await apiRequest('/protected-endpoint');
```

### Caching
Services implement appropriate caching strategies:

```typescript
// Cache user data for 5 minutes
const userData = await cacheService.get('user', () => 
  authService.getCurrentUser(), 
  { ttl: 300000 }
);
```

## Environment Configuration

### Development
```env
# API Configuration
VITE_API_BASE_URL=/api/v1

# Realtime Server
VITE_REALTIME_SERVER_URL=http://localhost:3001

# Service Ports
AUTH_SERVICE_PORT=8082
REALTIME_SERVER_PORT=3001
```

### Production
```env
# API Configuration
VITE_API_BASE_URL=/api/v1

# Realtime Server (production)
VITE_REALTIME_SERVER_URL=https://realtime.yourdomain.com

# Service Configuration
AUTH_SERVICE_PORT=8082
REALTIME_SERVER_PORT=3001
```

## Testing Services

### Unit Testing
```typescript
import { vi } from 'vitest';
import { contentService } from '@/services/content.service';

// Mock API calls
vi.mock('@/services/api', () => ({
  apiRequest: vi.fn()
}));

describe('ContentService', () => {
  it('should generate content', async () => {
    const mockContent = { id: 1, title: 'Test' };
    apiRequest.mockResolvedValue(mockContent);
    
    const result = await contentService.generateContent(prompt);
    expect(result).toEqual(mockContent);
  });
});
```

### Integration Testing
```typescript
import { socketService } from '@/services/socket.service';

describe('Socket Service Integration', () => {
  it('should connect to realtime server', async () => {
    const connected = await socketService.connect({
      onConnection: () => console.log('Connected')
    });
    
    expect(socketService.isConnected()).toBe(true);
  });
});
```

## Performance Considerations

### Connection Management
- Socket connections are reused across components
- Automatic reconnection with exponential backoff
- Connection pooling for HTTP requests

### Data Optimization
- Request/response compression
- Efficient data serialization
- Minimal payload sizes

### Caching Strategy
- Service-level caching for frequently accessed data
- Cache invalidation on data updates
- Memory-efficient cache implementation

## Security

### Authentication
- JWT tokens with automatic refresh
- Secure token storage
- Role-based access control

### Data Protection
- Request/response encryption
- Input validation and sanitization
- CORS configuration

### WebSocket Security
- Authentication for WebSocket connections
- Rate limiting for real-time events
- Secure WebSocket protocols (WSS)

## Monitoring and Debugging

### Logging
All services include comprehensive logging:
- Connection status
- API request/response logging
- Error tracking
- Performance metrics

### Debug Mode
Enable debug mode for detailed logging:
```typescript
// Enable debug logging
localStorage.setItem('debug', 'services:*');
```

### Health Checks
Services provide health check endpoints:
```typescript
// Check service health
const health = await serviceHealth.checkAll();
console.log('Service status:', health);
```

## Migration Guide

### From Legacy Services
When migrating from older service implementations:

1. **Update imports**: Change to new service paths
2. **Update method calls**: Use new async/await patterns
3. **Update error handling**: Use new error types
4. **Update configuration**: Use new environment variables

### Breaking Changes
- Socket.IO client now uses dynamic imports
- Real-time server URL configuration changed
- Authentication token handling updated

## Related Documentation

- [API Configuration Update](../docs/api-configuration-update.md)
- [Realtime Server Configuration](../docs/realtime-server-configuration.md)
- [Authentication Guide](./auth/README.md)
- [WebSocket API Reference](../docs/websocket-api.md)

---

**Last Updated**: October 19, 2025  
**Service Layer Version**: 2.0  
**Real-time Features**: Enabled