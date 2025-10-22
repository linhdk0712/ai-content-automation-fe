# Realtime Server Configuration

## Overview

The AI Content Automation platform includes a dedicated realtime server for handling WebSocket connections, live collaboration features, and real-time notifications. This server operates independently from the main authentication service to provide optimal performance for real-time features.

## Server Configuration

### Port Configuration
- **Local Development**: `localhost:3001`
- **Remote Server**: `180.93.138.113:3001`
- **Docker Environment**: Configured via environment variables

### Environment Variables

```env
# Realtime Server Configuration
VITE_REALTIME_SERVER_URL=http://180.93.138.113:3001
REALTIME_SERVER_PORT=3001

# For local development
VITE_REALTIME_SERVER_URL=http://localhost:3001
```

## Vite Proxy Configuration

The Vite development server includes automatic proxy configuration for the realtime server:

```typescript
// vite.config.ts
const CONFIG = {
  realtime: {
    remoteTarget: 'http://180.93.138.113:3001',
    localTarget: 'http://localhost:3001'
  }
}
```

### Environment Detection
- **Local Development**: Uses `localhost:3001` when realtime server is running locally
- **Remote Development**: Uses `180.93.138.113:3001` for shared development environment
- **Docker**: Configured via container networking

## Real-time Features

### Supported Features
- **Live Collaboration**: Multi-user content editing with cursor tracking
- **Real-time Notifications**: Instant push notifications for user actions
- **Presence Indicators**: Show online users and their current activities
- **Live Comments**: Real-time commenting system for content review
- **Workflow Updates**: Live status updates for content workflows
- **Team Activity**: Real-time activity feed for team collaboration

### WebSocket Connections
The realtime server handles WebSocket connections for:
- User presence tracking
- Live document editing
- Notification broadcasting
- Team collaboration events
- Workflow status updates

## Development Setup

### Local Realtime Server
To run the realtime server locally:

```bash
# Ensure realtime server is running on port 3001
# Update environment to use local server
VITE_REALTIME_SERVER_URL=http://localhost:3001
```

### Remote Development
For shared development environment:

```bash
# Use remote realtime server
VITE_REALTIME_SERVER_URL=http://180.93.138.113:3001
```

## Service Integration

### Frontend Integration
The frontend connects to the realtime server through:

```typescript
// services/realtime.manager.ts
import { io } from 'socket.io-client';

const realtimeUrl = import.meta.env.VITE_REALTIME_SERVER_URL;
const socket = io(realtimeUrl);
```

### Authentication
Realtime connections are authenticated using:
- JWT tokens from the main authentication service
- User session validation
- Role-based access control for real-time features

## Deployment Considerations

### Production Deployment
- Ensure realtime server is accessible on port 3001
- Configure proper CORS settings for WebSocket connections
- Set up SSL/TLS for secure WebSocket connections (WSS)
- Configure load balancing for multiple realtime server instances

### Security
- WebSocket connections use secure protocols (WSS) in production
- Authentication tokens are validated for each connection
- Rate limiting applied to prevent abuse
- CORS configured for allowed origins

### Monitoring
- Connection health monitoring
- WebSocket connection metrics
- Real-time feature usage analytics
- Error tracking for connection issues

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify realtime server is running on port 3001
   - Check firewall rules allow port 3001
   - Ensure WebSocket upgrade headers are properly configured

2. **Authentication Failures**
   - Verify JWT tokens are valid and not expired
   - Check CORS configuration allows WebSocket connections
   - Ensure authentication service is accessible

3. **Performance Issues**
   - Monitor WebSocket connection count
   - Check for memory leaks in real-time event handlers
   - Optimize event broadcasting for large user groups

### Debug Commands

```bash
# Check realtime server status
curl http://localhost:3001/health

# Test WebSocket connection
wscat -c ws://localhost:3001

# Monitor WebSocket traffic
# Use browser developer tools Network tab
```

## API Endpoints

### Health Check
- **GET** `/health` - Server health status
- **GET** `/metrics` - Connection and performance metrics

### WebSocket Events
- `connection` - User connects to realtime server
- `disconnect` - User disconnects from realtime server
- `join_room` - User joins a collaboration room
- `leave_room` - User leaves a collaboration room
- `presence_update` - User presence status changes
- `notification` - Real-time notification broadcast

## Related Documentation

- [Real-time Collaboration Features](./realtime-collaboration.md)
- [WebSocket API Reference](./websocket-api.md)
- [Deployment Guide](../DEPLOYMENT_README.md)
- [API Configuration Update](./api-configuration-update.md)

## Notes

- The realtime server operates independently from the main API server
- WebSocket connections are persistent and require proper cleanup
- Real-time features gracefully degrade when server is unavailable
- Connection retry logic handles temporary network issues

---

**Last Updated**: October 19, 2025  
**Configuration Type**: Realtime Server Setup  
**Impact Level**: Medium (affects real-time features)