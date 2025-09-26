import { createClient, SupabaseClient, RealtimeChannel, User, Session } from '@supabase/supabase-js';
import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

// Database types
export interface Database {
  public: {
    Tables: {
      realtime_events: {
        Row: {
          id: string;
          tenant_id: string;
          type: string;
          task_id: string | null;
          payload: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          type: string;
          task_id?: string | null;
          payload?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          type?: string;
          task_id?: string | null;
          payload?: Record<string, any> | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      content: {
        Row: {
          id: string;
          title: string;
          content: string;
          status: string;
          user_id: string;
          workspace_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          status?: string;
          user_id: string;
          workspace_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          status?: string;
          updated_at?: string;
        };
      };
      user_presence: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string;
          status: 'online' | 'offline' | 'away';
          last_seen: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          status?: 'online' | 'offline' | 'away';
          last_seen?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          status?: 'online' | 'offline' | 'away';
          last_seen?: string;
          metadata?: Record<string, any> | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_read?: boolean;
          metadata?: Record<string, any> | null;
        };
      };
    };
  };
}

export class SupabaseService extends BrowserEventEmitter {
  private client: SupabaseClient<Database>;
  private channels: Map<string, RealtimeChannel> = new Map();
  private currentUser: User | null = null;
  private currentSession: Session | null = null;

  constructor() {
    super();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Debug logging
    console.log('🔧 Supabase Environment Check:', {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
      supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
      allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables:', {
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing'
      });

      // Fallback values for development (replace with your actual values)
      const fallbackUrl = 'https://jhhljaryqsmfiabnqqxp.supabase.co';
      const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaGxqYXJ5cXNtZmlhYm5xcXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDg3NTIsImV4cCI6MjA3NDQyNDc1Mn0.8mIdeDwpKmND6j_bRSwwzbMO06ewkWnDexrZyc-ttdY';

      console.warn('⚠️ Using fallback Supabase credentials');
      this.client = createClient<Database>(fallbackUrl, fallbackKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
    } else {
      this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
    }

    this.initializeAuth();
  }

  private async initializeAuth() {
    // Get initial session
    const { data: { session }, error } = await this.client.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
    } else {
      this.currentSession = session;
      this.currentUser = session?.user || null;
      this.emit('authStateChanged', { user: this.currentUser, session: this.currentSession });
    }

    // Listen for auth changes
    this.client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      this.currentSession = session;
      this.currentUser = session?.user || null;

      this.emit('authStateChanged', { user: this.currentUser, session: this.currentSession });

      if (event === 'SIGNED_IN') {
        this.emit('signedIn', { user: this.currentUser, session: this.currentSession });
      } else if (event === 'SIGNED_OUT') {
        this.emit('signedOut');
        this.cleanupChannels();
      }
    });
  }

  // Auth methods
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  // Realtime methods
  subscribeToTable<T extends keyof Database['public']['Tables']>(
    table: T,
    callback: (payload: any) => void,
    filter?: string
  ): string {
    const channelName = `${table}_${Date.now()}_${Math.random()}`;

    let channel = this.client.channel(channelName);

    if (filter) {
      channel = channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table as string,
        filter
      }, callback);
    } else {
      channel = channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table as string
      }, callback);
    }

    channel.subscribe((status) => {
      console.log(`Subscription to ${table} status:`, status);
      if (status === 'SUBSCRIBED') {
        this.emit('subscribed', { table, channelName });
      }
    });

    this.channels.set(channelName, channel);
    return channelName;
  }

  subscribeToPresence(
    workspaceId: string,
    callback: (payload: any) => void
  ): string {
    const channelName = `presence_${workspaceId}`;

    const channel = this.client.channel(channelName, {
      config: {
        presence: {
          key: this.currentUser?.id || 'anonymous'
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        callback({ event: 'sync', state });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        callback({ event: 'join', key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        callback({ event: 'leave', key, leftPresences });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentUser) {
          await channel.track({
            user_id: this.currentUser.id,
            email: this.currentUser.email,
            online_at: new Date().toISOString()
          });
        }
      });

    this.channels.set(channelName, channel);
    return channelName;
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  private cleanupChannels() {
    this.channels.forEach((channel, name) => {
      this.client.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Database operations - Generic methods with proper typing
  async insert(table: string, data: any): Promise<any> {
    const { data: result, error } = await (this.client as any)
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(table: string, id: string, data: any): Promise<any> {
    const { data: result, error } = await (this.client as any)
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(table: string, id: string): Promise<void> {
    const { error } = await (this.client as any)
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async select(table: string, options?: {
    select?: string;
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }): Promise<any[]> {
    let query = (this.client as any).from(table).select(options?.select || '*');

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Type-safe helper methods for specific tables
  async insertContent(data: Database['public']['Tables']['content']['Insert']): Promise<Database['public']['Tables']['content']['Row']> {
    return this.insert('content', data);
  }

  async updateContent(id: string, data: Database['public']['Tables']['content']['Update']): Promise<Database['public']['Tables']['content']['Row']> {
    return this.update('content', id, data);
  }

  async selectContent(options?: {
    select?: string;
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }): Promise<Database['public']['Tables']['content']['Row'][]> {
    return this.select('content', options);
  }

  async insertNotification(data: Database['public']['Tables']['notifications']['Insert']): Promise<Database['public']['Tables']['notifications']['Row']> {
    return this.insert('notifications', data);
  }

  async updateNotification(id: string, data: Database['public']['Tables']['notifications']['Update']): Promise<Database['public']['Tables']['notifications']['Row']> {
    return this.update('notifications', id, data);
  }

  async selectNotifications(options?: {
    select?: string;
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }): Promise<Database['public']['Tables']['notifications']['Row'][]> {
    return this.select('notifications', options);
  }

  async insertUserPresence(data: Database['public']['Tables']['user_presence']['Insert']): Promise<Database['public']['Tables']['user_presence']['Row']> {
    return this.insert('user_presence', data);
  }

  async updateUserPresence(id: string, data: Database['public']['Tables']['user_presence']['Update']): Promise<Database['public']['Tables']['user_presence']['Row']> {
    return this.update('user_presence', id, data);
  }

  async selectUserPresence(options?: {
    select?: string;
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }): Promise<Database['public']['Tables']['user_presence']['Row'][]> {
    return this.select('user_presence', options);
  }

  async insertRealtimeEvent(data: Database['public']['Tables']['realtime_events']['Insert']): Promise<Database['public']['Tables']['realtime_events']['Row']> {
    return this.insert('realtime_events', data);
  }

  async selectRealtimeEvents(options?: {
    select?: string;
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }): Promise<Database['public']['Tables']['realtime_events']['Row'][]> {
    return this.select('realtime_events', options);
  }

  // Enhanced method để subscribe realtime events với advanced filtering
  subscribeToRealtimeEvents(options?: {
    tenantId?: string;
    eventTypes?: string[];
    taskId?: string;
    callback?: (event: Database['public']['Tables']['realtime_events']['Row']) => void;
  }): string {
    const { tenantId, eventTypes, taskId, callback } = options || {};

    // Build filter string
    let filter = '';
    const filters: string[] = [];

    if (tenantId) {
      filters.push(`tenant_id=eq.${tenantId}`);
    }

    if (eventTypes && eventTypes.length > 0) {
      filters.push(`type=in.(${eventTypes.join(',')})`);
    }

    if (taskId) {
      filters.push(`task_id=eq.${taskId}`);
    }

    filter = filters.join(',');

    return this.subscribeToTable('realtime_events', (payload) => {
      console.log('🔥 Realtime Event Received:', payload);

      if (payload.eventType === 'INSERT') {
        const newEvent = payload.new as Database['public']['Tables']['realtime_events']['Row'];

        // Console log chi tiết
        console.log('📋 Event Details:', {
          id: newEvent.id,
          tenant_id: newEvent.tenant_id,
          type: newEvent.type,
          task_id: newEvent.task_id,
          payload: newEvent.payload,
          created_at: newEvent.created_at
        });

        // Hiển thị browser notification nếu có permission
        if ('Notification' in window && Notification.permission === 'granted') {
          const title = `${newEvent.type.replace(/_/g, ' ').toUpperCase()} Event`;
          const body = this.formatNotificationBody(newEvent);

          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: newEvent.id,
            requireInteraction: this.isHighPriorityEvent(newEvent.type)
          });
        }

        // Emit event để components khác có thể listen
        this.emit('realtimeEvent', newEvent);
        this.emit(`realtimeEvent:${newEvent.type}`, newEvent);
        this.emit(`realtimeEvent:tenant:${newEvent.tenant_id}`, newEvent);

        // Call custom callback nếu có
        if (callback) {
          callback(newEvent);
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedEvent = payload.new as Database['public']['Tables']['realtime_events']['Row'];
        console.log('📝 Event Updated:', updatedEvent);
        this.emit('realtimeEventUpdated', updatedEvent);

        if (callback) {
          callback(updatedEvent);
        }
      }
    }, filter || undefined);
  }

  // Helper method để format notification body
  private formatNotificationBody(event: Database['public']['Tables']['realtime_events']['Row']): string {
    let body = `Tenant: ${event.tenant_id}`;

    if (event.task_id) {
      body += ` | Task: ${event.task_id}`;
    }

    if (event.payload) {
      // Extract meaningful info from payload
      if (event.payload.message) {
        body += ` | ${event.payload.message}`;
      } else if (event.payload.status) {
        body += ` | Status: ${event.payload.status}`;
      } else if (event.payload.progress) {
        body += ` | Progress: ${event.payload.progress}%`;
      }
    }

    return body;
  }

  // Helper method để determine high priority events
  private isHighPriorityEvent(eventType: string): boolean {
    const highPriorityTypes = [
      'error',
      'failure',
      'alert',
      'critical',
      'urgent',
      'security_alert',
      'payment_failed',
      'system_down'
    ];

    return highPriorityTypes.some(type =>
      eventType.toLowerCase().includes(type)
    );
  }

  // Method để subscribe specific event types
  subscribeToEventType(eventType: string, callback: (event: Database['public']['Tables']['realtime_events']['Row']) => void): string {
    return this.subscribeToRealtimeEvents({
      eventTypes: [eventType],
      callback
    });
  }

  // Method để subscribe events của một tenant cụ thể
  subscribeToTenantEvents(tenantId: string, callback: (event: Database['public']['Tables']['realtime_events']['Row']) => void): string {
    return this.subscribeToRealtimeEvents({
      tenantId,
      callback
    });
  }

  // Method để subscribe events của một task cụ thể
  subscribeToTaskEvents(taskId: string, callback: (event: Database['public']['Tables']['realtime_events']['Row']) => void): string {
    return this.subscribeToRealtimeEvents({
      taskId,
      callback
    });
  }

  // Getters
  get user() {
    return this.currentUser;
  }

  get session() {
    return this.currentSession;
  }

  get isAuthenticated() {
    return !!this.currentUser;
  }

  // Direct client access for advanced operations
  get supabaseClient() {
    return this.client;
  }
}

// Singleton instance
export const supabaseService = new SupabaseService();
