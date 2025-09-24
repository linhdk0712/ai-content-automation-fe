import { webSocketService } from './websocket.service';
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
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    webSocketService.on('collaborationEvent', (event: CollaborationEvent) => {
      this.handleCollaborationEvent(event);
    });

    webSocketService.on('connected', () => {
      if (this.currentContentId) {
        this.joinContent(this.currentContentId);
      }
    });
  }

  joinContent(contentId: string): void {
    if (this.currentContentId && this.currentContentId !== contentId) {
      this.leaveContent();
    }

    this.currentContentId = contentId;
    webSocketService.subscribe(`content:${contentId}`);
    
    webSocketService.send({
      type: 'collaboration_join',
      payload: {
        contentId,
        timestamp: Date.now()
      }
    });

    this.emit('contentJoined', contentId);
  }

  leaveContent(): void {
    if (this.currentContentId) {
      webSocketService.unsubscribe(`content:${this.currentContentId}`);
      
      webSocketService.send({
        type: 'collaboration_leave',
        payload: {
          contentId: this.currentContentId,
          timestamp: Date.now()
        }
      });

      this.activeUsers.clear();
      this.currentContentId = null;
      this.emit('contentLeft');
    }
  }

  updateCursor(position: CursorPosition): void {
    if (!this.currentContentId) return;

    webSocketService.send({
      type: 'collaboration_cursor',
      payload: {
        contentId: this.currentContentId,
        position,
        timestamp: Date.now()
      }
    });
  }

  updateSelection(selection: TextSelection): void {
    if (!this.currentContentId) return;

    webSocketService.send({
      type: 'collaboration_selection',
      payload: {
        contentId: this.currentContentId,
        selection,
        timestamp: Date.now()
      }
    });
  }

  applyTextOperation(operation: TextOperation): void {
    if (!this.currentContentId) return;

    // Add to operation queue
    this.operationQueue.push(operation);

    // Send to other collaborators
    webSocketService.send({
      type: 'collaboration_operation',
      payload: {
        contentId: this.currentContentId,
        operation,
        timestamp: Date.now()
      }
    });

    // Process operations
    this.processOperationQueue();
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