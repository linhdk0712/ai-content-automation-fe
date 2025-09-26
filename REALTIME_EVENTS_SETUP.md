# Realtime Events Setup Guide

## 1. Database Setup

Trong Supabase SQL Editor, chạy các commands sau:

### Tạo bảng realtime_events (nếu chưa có)
```sql
CREATE TABLE IF NOT EXISTS public.realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  task_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enable Row Level Security
```sql
ALTER TABLE public.realtime_events ENABLE ROW LEVEL SECURITY;

-- Policy để cho phép authenticated users đọc và tạo events
CREATE POLICY "Allow authenticated users to read events" ON public.realtime_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert events" ON public.realtime_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Enable Realtime
Trong Supabase Dashboard:
1. Đi tới **Database** > **Replication**
2. Tìm table `realtime_events`
3. Enable realtime cho table này

### Tạo index để tối ưu performance
```sql
CREATE INDEX IF NOT EXISTS idx_realtime_events_tenant_id ON public.realtime_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_type ON public.realtime_events(type);
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON public.realtime_events(created_at DESC);
```

## 2. Test Setup

### Truy cập Test Page
1. Start frontend application: `npm run dev`
2. Login vào ứng dụng
3. Truy cập: `http://localhost:5173/realtime-test`

### Test Realtime Functionality

#### Bước 1: Kiểm tra Connection
- Trang sẽ hiển thị status "Connected" nếu realtime subscription thành công
- Nếu "Disconnected", kiểm tra:
  - User đã login chưa
  - Supabase credentials trong `.env`
  - Realtime đã enable cho table chưa

#### Bước 2: Request Notification Permission
- Click "🔔 Request Notification Permission"
- Allow browser notifications để nhận popup alerts

#### Bước 3: Create Test Event
- Nhập Tenant ID (mặc định: `test-tenant`)
- Nhập Event Type (ví dụ: `task_completed`, `user_action`)
- Nhập Custom Payload (JSON format)
- Click "🚀 Create Test Event"

#### Bước 4: Verify Realtime Updates
Khi tạo event thành công, bạn sẽ thấy:
1. **Console logs**: Chi tiết event trong browser console
2. **Browser notification**: Popup notification (nếu đã allow)
3. **UI update**: Event xuất hiện trong danh sách real-time
4. **Latest Event section**: Hiển thị event mới nhất

## 3. Manual Testing

### Tạo event trực tiếp trong Supabase
```sql
INSERT INTO public.realtime_events (tenant_id, type, task_id, payload)
VALUES (
  'test-tenant',
  'manual_test',
  'task-123',
  '{"message": "Manual test from SQL", "priority": "high"}'::jsonb
);
```

### Tạo nhiều events để test
```sql
INSERT INTO public.realtime_events (tenant_id, type, task_id, payload)
VALUES 
  ('tenant-1', 'task_started', 'task-001', '{"status": "started", "user": "john"}'::jsonb),
  ('tenant-1', 'task_progress', 'task-001', '{"status": "progress", "percent": 50}'::jsonb),
  ('tenant-1', 'task_completed', 'task-001', '{"status": "completed", "result": "success"}'::jsonb),
  ('tenant-2', 'user_login', null, '{"user": "jane", "ip": "192.168.1.1"}'::jsonb);
```

## 4. Expected Behavior

### ✅ Success Indicators
- Connection status shows "Connected"
- Console logs show: `🔥 Realtime Event Received:`
- Browser notifications appear (if permission granted)
- Events appear in UI immediately
- Latest Event section updates

### ❌ Troubleshooting

#### Connection Issues
```
Problem: Status shows "Disconnected"
Solutions:
- Check user authentication
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Ensure realtime is enabled for realtime_events table
```

#### No Events Received
```
Problem: Events created but not received in real-time
Solutions:
- Check RLS policies
- Verify table name matches exactly: 'realtime_events'
- Check browser console for errors
- Try refreshing the page
```

#### Permission Errors
```
Problem: Cannot insert events
Solutions:
- Check RLS policies
- Ensure user is authenticated
- Verify INSERT policy exists
```

## 5. Integration Examples

### Listen to specific tenant events
```typescript
const { events } = useRealtimeEvents({
  tenantId: 'my-tenant',
  autoSubscribe: true
});
```

### Custom event handler
```typescript
const { subscribeToEvents } = useRealtimeEvents({
  autoSubscribe: false
});

// Custom subscription with callback
subscribeToEvents('my-tenant', (event) => {
  if (event.type === 'urgent_alert') {
    // Handle urgent alerts
    showUrgentNotification(event);
  }
});
```

### Create events programmatically
```typescript
const { createTestEvent } = useRealtimeEvents();

// Create custom event
await createTestEvent('user_action', {
  action: 'file_uploaded',
  filename: 'document.pdf',
  size: 1024000
});
```

## 6. Production Considerations

### Security
- Implement proper RLS policies based on your tenant model
- Consider rate limiting for event creation
- Validate payload structure

### Performance
- Add appropriate indexes
- Consider event retention policies
- Monitor realtime connection counts

### Monitoring
- Set up alerts for failed events
- Monitor realtime subscription health
- Track event processing latency

## 7. Next Steps

1. **Custom Event Types**: Define specific event types for your application
2. **Event Processing**: Add server-side event processing logic
3. **UI Integration**: Integrate realtime events into your main application
4. **Notifications**: Implement proper notification system (toast, modal, etc.)
5. **Analytics**: Track event patterns and user engagement