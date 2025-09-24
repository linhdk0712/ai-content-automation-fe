import { api } from './api';

export interface CollaborationSession {
  id: string;
  contentId: string;
  participants: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    joinedAt: Date;
    lastActivity: Date;
    cursor?: {
      line: number;
      column: number;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: number;
}

export interface ContentChange {
  operations: Operation[];
  version: number;
  userId: string;
  timestamp: number;
}

class CollaborativeEditingService {
  private baseUrl = '/api/v1/collaboration';

  async createSession(contentId: string): Promise<CollaborationSession> {
    const response = await api.post(`${this.baseUrl}/sessions`, { contentId });
    return response.data;
  }

  async joinSession(sessionId: string): Promise<CollaborationSession> {
    const response = await api.post(`${this.baseUrl}/sessions/${sessionId}/join`);
    return response.data;
  }

  async leaveSession(sessionId: string): Promise<void> {
    await api.post(`${this.baseUrl}/sessions/${sessionId}/leave`);
  }

  async getSession(sessionId: string): Promise<CollaborationSession> {
    const response = await api.get(`${this.baseUrl}/sessions/${sessionId}`);
    return response.data;
  }

  async applyOperations(
    sessionId: string,
    operations: Operation[],
    version: number
  ): Promise<{ success: boolean; newVersion: number; transformedOperations?: Operation[] }> {
    const response = await api.post(`${this.baseUrl}/sessions/${sessionId}/operations`, {
      operations,
      version,
    });
    return response.data;
  }

  async getOperationHistory(
    sessionId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<ContentChange[]> {
    const params = new URLSearchParams();
    if (fromVersion !== undefined) params.append('fromVersion', fromVersion.toString());
    if (toVersion !== undefined) params.append('toVersion', toVersion.toString());

    const response = await api.get(`${this.baseUrl}/sessions/${sessionId}/history?${params}`);
    return response.data;
  }

  async updateCursor(
    sessionId: string,
    cursor: { line: number; column: number }
  ): Promise<void> {
    await api.post(`${this.baseUrl}/sessions/${sessionId}/cursor`, cursor);
  }

  // Operational Transform utilities
  transformOperations(
    clientOps: Operation[],
    serverOps: Operation[]
  ): Operation[] {
    // Simplified OT implementation
    // In production, use a proper OT library like ShareJS or Yjs
    let transformedOps = [...clientOps];
    
    for (const serverOp of serverOps) {
      transformedOps = transformedOps.map(clientOp => 
        this.transformOperation(clientOp, serverOp)
      );
    }
    
    return transformedOps;
  }

  private transformOperation(op1: Operation, op2: Operation): Operation {
    // Simplified transformation logic
    // This is a basic implementation and should be replaced with a proper OT algorithm
    
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0),
        };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: op1.position + (op2.content?.length || 0),
        };
      }
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: Math.max(op1.position - (op2.length || 0), op2.position),
        };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return op1;
      } else {
        return {
          ...op1,
          position: Math.max(op1.position - (op2.length || 0), op2.position),
        };
      }
    }
    
    return op1;
  }

  // Convert text changes to operations
  generateOperations(oldText: string, newText: string, userId: string): Operation[] {
    // Simple diff algorithm - in production, use a proper diff library
    const operations: Operation[] = [];
    
    if (oldText === newText) {
      return operations;
    }
    
    // Find common prefix
    let prefixLength = 0;
    while (
      prefixLength < oldText.length &&
      prefixLength < newText.length &&
      oldText[prefixLength] === newText[prefixLength]
    ) {
      prefixLength++;
    }
    
    // Find common suffix
    let suffixLength = 0;
    while (
      suffixLength < oldText.length - prefixLength &&
      suffixLength < newText.length - prefixLength &&
      oldText[oldText.length - 1 - suffixLength] === newText[newText.length - 1 - suffixLength]
    ) {
      suffixLength++;
    }
    
    const oldMiddle = oldText.slice(prefixLength, oldText.length - suffixLength);
    const newMiddle = newText.slice(prefixLength, newText.length - suffixLength);
    
    // Retain prefix
    if (prefixLength > 0) {
      operations.push({
        type: 'retain',
        position: 0,
        length: prefixLength,
        userId,
        timestamp: Date.now(),
      });
    }
    
    // Delete old middle
    if (oldMiddle.length > 0) {
      operations.push({
        type: 'delete',
        position: prefixLength,
        length: oldMiddle.length,
        userId,
        timestamp: Date.now(),
      });
    }
    
    // Insert new middle
    if (newMiddle.length > 0) {
      operations.push({
        type: 'insert',
        position: prefixLength,
        content: newMiddle,
        userId,
        timestamp: Date.now(),
      });
    }
    
    return operations;
  }

  // Apply operations to text
  applyOperationsToText(text: string, operations: Operation[]): string {
    let result = text;
    let offset = 0;
    
    for (const op of operations) {
      switch (op.type) {
        case 'insert':
          if (op.content) {
            const position = op.position + offset;
            result = result.slice(0, position) + op.content + result.slice(position);
            offset += op.content.length;
          }
          break;
          
        case 'delete':
          if (op.length) {
            const position = op.position + offset;
            result = result.slice(0, position) + result.slice(position + op.length);
            offset -= op.length;
          }
          break;
          
        case 'retain':
          // No change needed for retain operations
          break;
      }
    }
    
    return result;
  }
}

export const collaborativeEditingService = new CollaborativeEditingService();