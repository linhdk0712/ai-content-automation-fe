
import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';
import { socketService, SocketEventData } from './socket.service';
import { apiRequest } from './api';

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
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Connect to Socket.IO for real-time collaboration
    socketService.connect({
      onConnection: () => {
        console.log('Collaboration service connected to Socket.IO');
        if (this.currentContentId) {
          this.joinContent(this.currentContentId);
        }
      },
      onContentUpdate: (data: SocketEventData) => {
        this.handleContentCollaboration(data);
      },
      onError: (error: Error) => {
        console.error('Collaboration Socket.IO error:', error);
      },
      onDisconnect: () => {
        console.warn('Collaboration Socket.IO disconnected');
        this.activeUsers.clear();
      }
    });
  }

  joinContent(contentId: string): void {
    if (this.currentContentId && this.currentContentId !== contentId) {
      this.leaveContent();
    }

    this.currentContentId = contentId;
    
    // Subscribe to content updates via Socket.IO
    if (socketService.isConnected()) {
      socketService.joinContentRoom(contentId);
    }

    this.emit('contentJoined', contentId);
  }

  private handleContentCollaboration(data: SocketEventData): void {
    // Handle real-time collaboration updates from Socket.IO
    if (data.contentId && data.contentId.toString() === this.currentContentId) {
      // Parse collaboration data from workflow result
      if (data.result && typeof data.result === 'object') {
        const collaborationData = data.result as any;
        
        if (collaborationData.type === 'cursor_update') {
          this.handleCollaborationEvent({
            type: 'cursor_update',
            userId: collaborationData.userId || 'unknown',
            contentId: this.currentContentId,
            data: collaborationData.data,
            timestamp: new Date(data.timestamp).getTime()
          });
        } else if (collaborationData.type === 'selection_update') {
          this.handleCollaborationEvent({
            type: 'selection_update',
            userId: collaborationData.userId || 'unknown',
            contentId: this.currentContentId,
            data: collaborationData.data,
            timestamp: new Date(data.timestamp).getTime()
          });
        } else if (collaborationData.type === 'text_change') {
          this.handleCollaborationEvent({
            type: 'text_change',
            userId: collaborationData.userId || 'unknown',
            contentId: this.currentContentId,
            data: collaborationData.data,
            timestamp: new Date(data.timestamp).getTime()
          });
        } else if (collaborationData.type === 'user_presence') {
          // Handle user presence updates
          const user: CollaborationUser = {
            id: collaborationData.userId || 'unknown',
            name: collaborationData.userName || 'Unknown User',
            avatar: collaborationData.userAvatar,
            isActive: collaborationData.isActive || true,
            lastActivity: new Date(data.timestamp).getTime(),
            cursor: collaborationData.cursor,
            selection: collaborationData.selection
          };
          
          this.activeUsers.set(user.id, user);
          this.emit('userJoined', user);
        }
      }
    }
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
    if (!this.currentContentId) return;

    try {
      // Send cursor update to backend via API
      await apiRequest.patch('/collaboration/cursor', {
        contentId: this.currentContentId,
        position
      });

      // Emit local event for immediate UI update
      this.handleCollaborationEvent({
        type: 'cursor_update',
        userId: 'current_user', // TODO: Get from auth context
        contentId: this.currentContentId,
        data: { cursor: position },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }

  async updateSelection(selection: TextSelection): Promise<void> {
    if (!this.currentContentId) return;

    try {
      // Send selection update to backend via API
      await apiRequest.patch('/collaboration/selection', {
        contentId: this.currentContentId,
        selection
      });

      // Emit local event for immediate UI update
      this.handleCollaborationEvent({
        type: 'selection_update',
        userId: 'current_user', // TODO: Get from auth context
        contentId: this.currentContentId,
        data: { selection },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to update selection:', error);
    }
  }

  async applyTextOperation(operation: TextOperation): Promise<void> {
    if (!this.currentContentId) return;

    try {
      // Send text operation to backend via API
      const response = await apiRequest.patch(`/collaboration/content/${this.currentContentId}`, {
        operation
      });

      // Add to operation queue for local processing
      this.operationQueue.push(operation);

      // Emit local event for immediate UI update
      this.handleCollaborationEvent({
        type: 'text_change',
        userId: 'current_user', // TODO: Get from auth context
        contentId: this.currentContentId,
        data: { operation, result: response },
        timestamp: Date.now()
      });

      // Process operation queue
      this.processOperationQueue();
    } catch (error) {
      console.error('Failed to apply text operation:', error);
    }
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