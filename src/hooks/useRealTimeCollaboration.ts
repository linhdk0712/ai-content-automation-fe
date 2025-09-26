import { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseService } from '../services/supabase.service';
import { useSupabase } from '../contexts/RealTimeContext';

export interface CollaborationUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
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
  contentId: string;
}

export interface TextOperation {
  type: 'insert' | 'delete' | 'replace';
  position: CursorPosition;
  content: string;
  contentId: string;
  userId: string;
  timestamp: number;
}

export interface UseRealTimeCollaborationOptions {
  contentId: string;
  workspaceId: string;
  autoJoin?: boolean;
}

export interface CollaborationState {
  activeUsers: CollaborationUser[];
  isJoined: boolean;
  currentContentId: string | null;
  presenceChannelName: string | null;
  contentChannelName: string | null;
}

export function useRealTimeCollaboration(options: UseRealTimeCollaborationOptions) {
  const { contentId, workspaceId, autoJoin = true } = options;
  const { user, isAuthenticated } = useSupabase();
  
  const [state, setState] = useState<CollaborationState>({
    activeUsers: [],
    isJoined: false,
    currentContentId: null,
    presenceChannelName: null,
    contentChannelName: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const joinContent = useCallback(async (id: string = contentId) => {
    if (!isAuthenticated || !user) {
      console.warn('User not authenticated, cannot join collaboration');
      return;
    }

    try {
      // Subscribe to presence for this workspace
      const presenceChannelName = supabaseService.subscribeToPresence(
        workspaceId,
        (payload) => {
          if (payload.event === 'sync') {
            const users = Object.values(payload.state).flat().map((presence: any) => ({
              id: presence.user_id,
              email: presence.email,
              isActive: true,
              lastActivity: Date.now()
            }));
            setState(prev => ({ ...prev, activeUsers: users }));
          } else if (payload.event === 'join') {
            const newUsers = payload.newPresences.map((presence: any) => ({
              id: presence.user_id,
              email: presence.email,
              isActive: true,
              lastActivity: Date.now()
            }));
            setState(prev => ({
              ...prev,
              activeUsers: [...prev.activeUsers.filter(u => !newUsers.find(nu => nu.id === u.id)), ...newUsers]
            }));
          } else if (payload.event === 'leave') {
            const leftUserIds = payload.leftPresences.map((p: any) => p.user_id);
            setState(prev => ({
              ...prev,
              activeUsers: prev.activeUsers.filter(u => !leftUserIds.includes(u.id))
            }));
          }
        }
      );

      // Subscribe to content changes
      const contentChannelName = supabaseService.subscribeToTable(
        'content',
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new.id === id) {
            // Handle content updates
            console.log('Content updated:', payload.new);
          }
        },
        `id=eq.${id}`
      );

      setState(prev => ({
        ...prev,
        isJoined: true,
        currentContentId: id,
        presenceChannelName,
        contentChannelName
      }));

    } catch (error) {
      console.error('Failed to join collaboration:', error);
    }
  }, [contentId, workspaceId, isAuthenticated, user]);

  const leaveContent = useCallback(() => {
    if (state.presenceChannelName) {
      supabaseService.unsubscribe(state.presenceChannelName);
    }
    if (state.contentChannelName) {
      supabaseService.unsubscribe(state.contentChannelName);
    }

    setState(prev => ({
      ...prev,
      isJoined: false,
      currentContentId: null,
      activeUsers: [],
      presenceChannelName: null,
      contentChannelName: null
    }));
  }, [state.presenceChannelName, state.contentChannelName]);

  const updateCursor = useCallback(async (position: CursorPosition) => {
    if (!isAuthenticated || !user) return;

    try {
      // Update user presence with cursor position
      await supabaseService.update('user_presence', user.id, {
        metadata: { cursor: position },
        last_seen: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }, [isAuthenticated, user]);

  const updateSelection = useCallback(async (selection: TextSelection) => {
    if (!isAuthenticated || !user) return;

    try {
      // Update user presence with selection
      await supabaseService.update('user_presence', user.id, {
        metadata: { selection },
        last_seen: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update selection:', error);
    }
  }, [isAuthenticated, user]);

  const applyTextOperation = useCallback(async (operation: TextOperation) => {
    if (!isAuthenticated || !user) return;

    try {
      // Update content in database
      const currentContent = await supabaseService.select('content', {
        filter: { id: operation.contentId },
        limit: 1
      });

      if (currentContent && currentContent.length > 0) {
        let newContent = currentContent[0].content;
        
        // Apply operation based on type
        switch (operation.type) {
          case 'insert':
            // Simple insert at position (this would need more sophisticated logic for real collaboration)
            newContent = newContent.slice(0, operation.position.column) + 
                        operation.content + 
                        newContent.slice(operation.position.column);
            break;
          case 'delete':
            // Simple delete (this would need more sophisticated logic)
            newContent = newContent.slice(0, operation.position.column) + 
                        newContent.slice(operation.position.column + operation.content.length);
            break;
          case 'replace':
            // Simple replace (this would need more sophisticated logic)
            newContent = newContent.slice(0, operation.position.column) + 
                        operation.content + 
                        newContent.slice(operation.position.column + operation.content.length);
            break;
        }

        await supabaseService.update('content', operation.contentId, {
          content: newContent,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to apply text operation:', error);
    }
  }, [isAuthenticated, user]);

  const getTypingUsers = useCallback(() => {
    return stateRef.current.activeUsers.filter(user => user.isActive && user.cursor);
  }, []);

  // Auto-join if enabled
  useEffect(() => {
    if (autoJoin && contentId && isAuthenticated) {
      joinContent(contentId);
    }
  }, [autoJoin, contentId, isAuthenticated, joinContent]);

  // Update content when contentId changes
  useEffect(() => {
    if (contentId && contentId !== state.currentContentId && autoJoin && isAuthenticated) {
      joinContent(contentId);
    }
  }, [contentId, state.currentContentId, autoJoin, isAuthenticated, joinContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stateRef.current.isJoined) {
        leaveContent();
      }
    };
  }, [leaveContent]);

  return {
    ...state,
    joinContent,
    leaveContent,
    updateCursor,
    updateSelection,
    applyTextOperation,
    getTypingUsers
  };
}