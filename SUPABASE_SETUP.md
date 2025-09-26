# Supabase Setup Guide

Hướng dẫn này sẽ giúp bạn thiết lập Supabase để thay thế WebSocket trong ứng dụng.

## 1. Tạo Project Supabase

1. Truy cập [supabase.com](https://supabase.com)
2. Tạo tài khoản và project mới
3. Lấy URL và anon key từ Settings > API

## 2. Cấu hình Environment Variables

Cập nhật file `.env` với thông tin Supabase:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 3. Tạo Database Schema

Chạy các SQL commands sau trong Supabase SQL Editor:

### Users Table (mở rộng auth.users)
```sql
-- Tạo profile table để mở rộng auth.users
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy cho user profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Content Table
```sql
CREATE TABLE public.content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  workspace_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own content" ON public.content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create content" ON public.content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content" ON public.content
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content" ON public.content
  FOR DELETE USING (auth.uid() = user_id);
```

### User Presence Table
```sql
CREATE TABLE public.user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  workspace_id UUID,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view presence in same workspace" ON public.user_presence
  FOR SELECT USING (true); -- Allow all authenticated users to see presence

CREATE POLICY "Users can update own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);
```

### Notifications Table
```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
```

### User Activities Table
```sql
CREATE TABLE public.user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Publishing Jobs Table
```sql
CREATE TABLE public.publishing_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.content(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own publishing jobs" ON public.publishing_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create publishing jobs" ON public.publishing_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own publishing jobs" ON public.publishing_jobs
  FOR UPDATE USING (auth.uid() = user_id);
```

### Analytics Metrics Table
```sql
CREATE TABLE public.analytics_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change NUMERIC,
  change_percent NUMERIC,
  unit TEXT,
  category TEXT CHECK (category IN ('engagement', 'performance', 'revenue', 'usage', 'system')),
  workspace_id UUID,
  content_id UUID REFERENCES public.content(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view metrics in their workspace" ON public.analytics_metrics
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
```

## 4. Enable Realtime

Trong Supabase Dashboard, đi tới Database > Replication và enable realtime cho các tables:

- `content`
- `user_presence`
- `notifications`
- `user_activities`
- `publishing_jobs`
- `analytics_metrics`

## 5. Cấu hình Authentication

1. Trong Authentication > Settings, cấu hình:
   - Site URL: `http://localhost:5173` (development)
   - Redirect URLs: `http://localhost:5173/**`

2. Enable email authentication hoặc OAuth providers theo nhu cầu

## 6. Functions (Optional)

Tạo Edge Functions để xử lý logic phức tạp:

```sql
-- Function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger cho content table
CREATE TRIGGER update_content_updated_at 
    BEFORE UPDATE ON public.content 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho publishing_jobs table
CREATE TRIGGER update_publishing_jobs_updated_at 
    BEFORE UPDATE ON public.publishing_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## 7. Testing

Sau khi setup xong, test các tính năng:

1. Authentication (đăng nhập/đăng ký)
2. Real-time updates (tạo/sửa content)
3. Presence (user online/offline)
4. Notifications
5. Publishing jobs

## 8. Production Setup

Khi deploy production:

1. Cập nhật environment variables với production URLs
2. Cấu hình CORS và authentication redirects
3. Setup database backups
4. Monitor performance và usage

## Troubleshooting

### Common Issues:

1. **RLS Policies**: Đảm bảo Row Level Security policies được cấu hình đúng
2. **Realtime**: Kiểm tra tables đã enable realtime
3. **Environment Variables**: Đảm bảo VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY đúng
4. **CORS**: Cấu hình Site URL và Redirect URLs trong Authentication settings

### Debug Commands:

```sql
-- Kiểm tra RLS policies
SELECT * FROM pg_policies WHERE tablename = 'content';

-- Kiểm tra realtime publications
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Test authentication
SELECT auth.uid(), auth.email();
```