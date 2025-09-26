import { supabaseService } from './supabase.service';
import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: CursorPosition;
  selection?: TextSelection;
  isActive: boolean;
  lastActivity: number;
}

export interface CursorPosition {
  line: number;
  column: number;
  contentId: string;
}

export interface TextSelection {
  start: CursorPosition;
  end: CursorPosition;
  text: string;
}

export interface CollaborationEvent {
  type: 'cursor_move' | 'text_change' | 'selection_change' | 'user_join' | 'user_leave';
  userId: string;
  contentId: string;
  data: any;
  timestamp: number;
}

export interface TextOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export class CollaborationService extends BrowserEventEmitter {
  private activeUsers = new Map<string, CollaborationUser>();
  private currentContentId: string | null = null;
  private operationQueue: TextOperation[] = [];
  private isProcessingOperations = false;

  constructor() {
    super();
    this.setupSupabaseListeners();
  }

  private setupSupabaseListeners(): void {
    supabaseService.on('authStateChanged', ({ user }) => {
      if (user && this.currentContentId) {
        this.joinContent(this.currentContentId);
      }
    });
  }

  joinContent(contentId: string): void {
    if (this.currentContentId && this.currentContentId !== contentId) {
      this.leaveContent();
    }

    this.currentContentId = contentId;
    
    // Subscribe to content changes
    supabaseService.subscribeToTable('content', (payload) => {
      if (payload.new?.id === contentId) {
        this.handleCollaborationEvent({
          type: 'text_change',
          userId: payload.new.user_id,
          contentId: contentId,
          data: { content: payload.new.content },
          timestamp: new Date(payload.new.updated_at).getTime()
        });
      }
    }, `id=eq.${contentId}`);

    // Subscribe to user presence for this content
    supabaseService.subscribeToTable('user_presence', (payload) => {
      if (payload.new?.metadata?.location?.contentId === contentId) {
        const user: CollaborationUser = {
          id: payload.new.user_id,
          name: payload.new.username || 'Unknown',
          avatar: payload.new.avatar_url,
          isActive: payload.new.status === 'online',
          lastActivity: new Date(payload.new.last_seen).getTime(),
          cursor: payload.new.metadata?.cursor,
          selection: payload.new.metadata?.selection
        };
        
        this.activeUsers.set(user.id, user);
        this.emit('userJoined', user);
      }
    }, `metadata->location->>contentId=eq.${contentId}`);

    this.emit('contentJoined', contentId);
  }

  leaveContent(): void {
    if (this.currentContentId) {
      // Unsubscribe from all channels (this would need channel tracking)
      this.activeUsers.clear();
      this.currentContentId = null;
      this.emit('contentLeft');
    }
  }

  async updateCursor(position: CursorPosition): Promise<void> {
    if (!this.currentContentId || !supabaseService.user) return;

    try {
      await supabaseService.update('user_presence', supabaseService.user.id, {
        metadata: {
          location: { contentId: this.currentContentId },
          cursor: position
        },
        last_seen: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }

  async updateSelection(selection: TextSelection): Promise<void> {
    if (!this.currentContentId || !supabaseService.user) return;

    try {
      await supabaseService.update('user_presence', supabaseService.user.id, {
        metadata: {
          location: { contentId: this.currentContentId },
          selection: selection
        },
        last_seen: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update selection:', error);
    }
  }

  async applyTextOperation(operation: TextOperation): Promise<void> {
    if (!this.currentContentId || !supabaseService.user) return;

    try {
      // Get current content
      const content = await supabaseService.select('content', {
        filter: { id: this.currentContentId },
        limit: 1
      });

      if (content && content.length > 0) {
        let newContent = content[0].content;
        
        // Apply operation (simplified)
        switch (operation.type) {
          case 'insert':
            newContent = newContent.slice(0, operation.position) + 
                        (operation.content || '') + 
                        newContent.slice(operation.position);
            break;
          case 'delete':
            newContent = newContent.slice(0, operation.position) + 
                        newContent.slice(operation.position + (operation.length || 0));
            break;
        }

        // Update content in database
        await supabaseService.update('content', this.currentContentId, {
          content: newContent,
          updated_at: new Date().toISOString()
        });

        // Add to operation queue for local processing
        this.operationQueue.push(operation);
        this.processOperationQueue();
      }
    } catch (error) {
      console.error('Failed to apply text operation:', error);
    }
  }

  private handleCollaborationEvent(event: CollaborationEvent): void {
    switch (event.type) {
      case 'user_join':
        this.handleUserJoin(event);
        break;
      case 'user_leave':
        this.handleUserLeave(event);
        break;
      case 'cursor_move':
        this.handleCursorMove(event);
        break;
      case 'text_change':
        this.handleTextChange(event);
        break;
      case 'selection_change':
        this.handleSelectionChange(event);
        break;
    }
  }

  private handleUserJoin(event: CollaborationEvent): void {
    const user: CollaborationUser = {
      id: event.userId,
      name: event.data.name,
      avatar: event.data.avatar,
      isActive: true,
      lastActivity: event.timestamp
    };

    this.activeUsers.set(event.userId, user);
    this.emit('userJoined', user);
  }

  private handleUserLeave(event: CollaborationEvent): void {
    const user = this.activeUsers.get(event.userId);
    if (user) {
      this.activeUsers.delete(event.userId);
      this.emit('userLeft', user);
    }
  }

  private handleCursorMove(event: CollaborationEvent): void {
    const user = this.activeUsers.get(event.userId);
    if (user) {
      user.cursor = event.data.position;
      user.lastActivity = event.timestamp;
      this.emit('cursorMoved', { user, position: event.data.position });
    }
  }

  private handleTextChange(event: CollaborationEvent): void {
    const operation: TextOperation = event.data.operation;
    
    // Transform operation if needed (Operational Transform)
    const transformedOperation = this.transformOperation(operation);
    
    this.emit('textChanged', transformedOperation);
  }

  private handleSelectionChange(event: CollaborationEvent): void {
    const user = this.activeUsers.get(event.userId);
    if (user) {
      user.selection = event.data.selection;
      user.lastActivity = event.timestamp;
      this.emit('selectionChanged', { user, selection: event.data.selection });
    }
  }

  private transformOperation(operation: TextOperation): TextOperation {
    // Simple Operational Transform implementation
    // In a production system, you'd want a more sophisticated OT algorithm
    
    let transformedOperation = { ...operation };
    
    // Transform against queued operations
    for (const queuedOp of this.operationQueue) {
      if (queuedOp.timestamp < operation.timestamp) {
        transformedOperation = this.transformAgainstOperation(transformedOperation, queuedOp);
      }
    }
    
    return transformedOperation;
  }

  private transformAgainstOperation(op1: TextOperation, op2: TextOperation): TextOperation {
    // Basic transformation logic
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0)
        };
      }
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0)
        };
      }
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      if (op2.position < op1.position) {
        return {
          ...op1,
          position: Math.max(op1.position - (op2.length || 0), op2.position)
        };
      }
    }
    
    return op1;
  }

  private processOperationQueue(): void {
    if (this.isProcessingOperations) return;
    
    this.isProcessingOperations = true;
    
    // Sort operations by timestamp
    this.operationQueue.sort((a, b) => a.timestamp - b.timestamp);
    
    // Process operations
    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift();
      if (operation) {
        this.emit('operationProcessed', operation);
      }
    }
    
    this.isProcessingOperations = false;
  }

  getActiveUsers(): CollaborationUser[] {
    return Array.from(this.activeUsers.values());
  }

  getCurrentContentId(): string | null {
    return this.currentContentId;
  }

  isUserActive(userId: string): boolean {
    const user = this.activeUsers.get(userId);
    if (!user) return false;
    
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    
    return (now - user.lastActivity) < inactiveThreshold;
  }
}

export const collaborationService = new CollaborationService();