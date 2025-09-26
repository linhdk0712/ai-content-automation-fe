# Advanced Realtime Events Features

## Enhanced Supabase Service Configuration

### New Methods in `supabaseService`

#### 1. Enhanced `subscribeToRealtimeEvents()`
```typescript
supabaseService.subscribeToRealtimeEvents({
  tenantId?: string;
  eventTypes?: string[];
  taskId?: string;
  callback?: (event) => void;
})
```

**Features:**
- ✅ Advanced filtering by tenant, event types, and task ID
- ✅ Smart notification formatting
- ✅ High-priority event detection
- ✅ Multiple event emission patterns
- ✅ Support for both INSERT and UPDATE events

#### 2. Specialized Subscription Methods
```typescript
// Subscribe to specific event type
supabaseService.subscribeToEventType('task_completed', callback);

// Subscribe to tenant events
supabaseService.subscribeToTenantEvents('tenant-123', callback);

// Subscribe to task events
supabaseService.subscribeToTaskEvents('task-456', callback);
```

### Smart Notification Features

#### High Priority Detection
Events containing these keywords are marked as high priority:
- `error`, `failure`, `alert`, `critical`, `urgent`
- `security_alert`, `payment_failed`, `system_down`

High priority notifications use `requireInteraction: true`

#### Smart Body Formatting
Notifications automatically extract meaningful info from payload:
- `payload.message` → Direct message
- `payload.status` → Status updates
- `payload.progress` → Progress percentage

## Enhanced Hook: `useRealtimeEvents`

### New Options
```typescript
const { ... } = useRealtimeEvents({
  tenantId?: string;
  eventTypes?: string[];     // NEW: Filter by event types
  taskId?: string;          // NEW: Filter by task ID
  autoSubscribe?: boolean;
  showBrowserNotifications?: boolean;
});
```

### New Methods
```typescript
const {
  // Existing methods
  subscribeToEvents,
  unsubscribeFromEvents,
  loadRecentEvents,
  createTestEvent,
  
  // NEW: Advanced subscription methods
  subscribeToEventType,
  subscribeToTenantEvents,
  subscribeToTaskEvents
} = useRealtimeEvents(options);
```

## Usage Examples

### 1. Basic Subscription
```typescript
const { events, lastEvent } = useRealtimeEvents({
  tenantId: 'my-tenant',
  autoSubscribe: true
});
```

### 2. Filter by Event Types
```typescript
const { events } = useRealtimeEvents({
  tenantId: 'my-tenant',
  eventTypes: ['task_completed', 'task_failed', 'user_action'],
  autoSubscribe: true
});
```

### 3. Task-Specific Events
```typescript
const { events } = useRealtimeEvents({
  taskId: 'task-123',
  autoSubscribe: true
});
```

### 4. Manual Subscriptions
```typescript
const { subscribeToEventType, subscribeToTenantEvents } = useRealtimeEvents({
  autoSubscribe: false
});

// Subscribe to specific event type
const channelName1 = subscribeToEventType('payment_received');

// Subscribe to tenant events
const channelName2 = subscribeToTenantEvents('tenant-456');
```

### 5. Listen to Service Events
```typescript
// Listen to all realtime events
supabaseService.on('realtimeEvent', (event) => {
  console.log('New event:', event);
});

// Listen to specific event type
supabaseService.on('realtimeEvent:task_completed', (event) => {
  console.log('Task completed:', event);
});

// Listen to tenant events
supabaseService.on('realtimeEvent:tenant:my-tenant', (event) => {
  console.log('Tenant event:', event);
});

// Listen to event updates
supabaseService.on('realtimeEventUpdated', (event) => {
  console.log('Event updated:', event);
});
```

## Database Setup

### Enable Realtime for realtime_events Table
```sql
-- In Supabase Dashboard: Database > Replication
-- Enable realtime for 'realtime_events' table
```

### Row Level Security Policies
```sql
-- Allow authenticated users to read events
CREATE POLICY "Allow authenticated users to read events" 
ON public.realtime_events
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert events
CREATE POLICY "Allow authenticated users to insert events" 
ON public.realtime_events
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Optional: Tenant-based access control
CREATE POLICY "Users can only see their tenant events" 
ON public.realtime_events
FOR SELECT USING (
  tenant_id = current_setting('app.current_tenant', true)
);
```

### Indexes for Performance
```sql
-- Optimize filtering by tenant_id
CREATE INDEX idx_realtime_events_tenant_id 
ON public.realtime_events(tenant_id);

-- Optimize filtering by type
CREATE INDEX idx_realtime_events_type 
ON public.realtime_events(type);

-- Optimize filtering by task_id
CREATE INDEX idx_realtime_events_task_id 
ON public.realtime_events(task_id);

-- Optimize ordering by created_at
CREATE INDEX idx_realtime_events_created_at 
ON public.realtime_events(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_realtime_events_tenant_type_created 
ON public.realtime_events(tenant_id, type, created_at DESC);
```

## Testing

### Test Component Features
Visit `/realtime-test` to test:

1. **Basic Events** - Create and receive events
2. **Event Type Filtering** - Subscribe to specific types
3. **Tenant Filtering** - Subscribe to tenant events
4. **Task Filtering** - Subscribe to task events
5. **Browser Notifications** - Test notification permissions
6. **Real-time Updates** - Verify immediate updates

### Manual Database Testing
```sql
-- Test basic event
INSERT INTO public.realtime_events (tenant_id, type, task_id, payload)
VALUES (
  'test-tenant',
  'task_completed',
  'task-123',
  '{"status": "success", "progress": 100, "message": "Task completed successfully"}'::jsonb
);

-- Test high priority event
INSERT INTO public.realtime_events (tenant_id, type, payload)
VALUES (
  'test-tenant',
  'critical_error',
  '{"message": "System critical error detected", "severity": "high"}'::jsonb
);

-- Test event with progress
INSERT INTO public.realtime_events (tenant_id, type, task_id, payload)
VALUES (
  'test-tenant',
  'task_progress',
  'task-456',
  '{"progress": 75, "status": "processing", "eta": "2 minutes"}'::jsonb
);
```

## Performance Considerations

### Connection Management
- Each subscription creates a separate Supabase channel
- Channels are automatically cleaned up on component unmount
- Use `unsubscribe()` to manually clean up channels

### Event Filtering
- Server-side filtering is more efficient than client-side
- Use specific filters to reduce network traffic
- Consider pagination for large event histories

### Notification Limits
- Browser notifications have rate limits
- High-priority events bypass auto-close timers
- Consider using toast notifications for better UX

## Best Practices

### 1. Use Specific Subscriptions
```typescript
// ✅ Good - specific filtering
subscribeToEventType('payment_received');

// ❌ Avoid - too broad
subscribeToRealtimeEvents(); // No filters
```

### 2. Handle Cleanup
```typescript
useEffect(() => {
  const channelName = subscribeToEventType('user_action');
  
  return () => {
    if (channelName) {
      supabaseService.unsubscribe(channelName);
    }
  };
}, []);
```

### 3. Error Handling
```typescript
try {
  const channelName = subscribeToTenantEvents('my-tenant');
  if (!channelName) {
    console.error('Failed to subscribe to tenant events');
  }
} catch (error) {
  console.error('Subscription error:', error);
}
```

### 4. Event Payload Structure
```typescript
// Recommended payload structure
const payload = {
  message: 'Human readable message',
  status: 'success|error|processing',
  progress: 0-100, // For progress events
  metadata: {
    // Additional context
  }
};
```

## Migration from WebSocket

### Before (WebSocket)
```typescript
webSocketService.subscribe('events:tenant:123');
webSocketService.on('event', callback);
```

### After (Supabase)
```typescript
supabaseService.subscribeToTenantEvents('123', callback);
// or
useRealtimeEvents({ tenantId: '123' });
```

### Benefits
- ✅ Better reliability and auto-reconnection
- ✅ Server-side filtering reduces bandwidth
- ✅ Built-in authentication and authorization
- ✅ Automatic scaling and load balancing
- ✅ Real-time presence and collaboration features
- ✅ Comprehensive logging and monitoring