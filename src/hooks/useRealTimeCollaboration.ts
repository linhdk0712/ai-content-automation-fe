import { useCallback, useEffect, useRef, useState } from 'react';
import { collaborationService, CollaborationUser, CursorPosition, TextOperation, TextSelection } from '../services/collaboration.service';

export interface UseRealTimeCollaborationOptions {
  contentId: string;
  autoJoin?: boolean;
}

export interface CollaborationState {
  activeUsers: CollaborationUser[];
  isJoined: boolean;
  currentContentId: string | null;
}

export function useRealTimeCollaboration(options: UseRealTimeCollaborationOptions) {
  const { contentId, autoJoin = true } = options;
  
  const [state, setState] = useState<CollaborationState>({
    activeUsers: [],
    isJoined: false,
    currentContentId: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const joinContent = useCallback((id: string = contentId) => {
    collaborationService.joinContent(id);
  }, [contentId]);

  const leaveContent = useCallback(() => {
    collaborationService.leaveContent();
  }, []);

  const updateCursor = useCallback((position: CursorPosition) => {
    collaborationService.updateCursor(position);
  }, []);

  const updateSelection = useCallback((selection: TextSelection) => {
    collaborationService.updateSelection(selection);
  }, []);

  const applyTextOperation = useCallback((operation: TextOperation) => {
    collaborationService.applyTextOperation(operation);
  }, []);

  const getTypingUsers = useCallback(() => {
    return stateRef.current.activeUsers.filter(user => user.isActive && user.cursor);
  }, []);

  useEffect(() => {
    const handleContentJoined = (joinedContentId: unknown) => {
      const contentId = joinedContentId as string;
      setState(prev => ({
        ...prev,
        isJoined: true,
        currentContentId: contentId
      }));
    };

    const handleContentLeft = () => {
      setState(prev => ({
        ...prev,
        isJoined: false,
        currentContentId: null,
        activeUsers: []
      }));
    };

    const handleUserJoined = (user: unknown) => {
      const collaborationUser = user as CollaborationUser;
      setState(prev => ({
        ...prev,
        activeUsers: [...prev.activeUsers.filter(u => u.id !== collaborationUser.id), collaborationUser]
      }));
    };

    const handleUserLeft = (user: unknown) => {
      const collaborationUser = user as CollaborationUser;
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.filter(u => u.id !== collaborationUser.id)
      }));
    };

    const handleCursorMoved = (data: unknown) => {
      const { user, position } = data as { user: CollaborationUser; position: CursorPosition };
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.map(u => 
          u.id === user.id ? { ...u, cursor: position, lastActivity: Date.now() } : u
        )
      }));
    };

    const handleSelectionChanged = (data: unknown) => {
      const { user, selection } = data as { user: CollaborationUser; selection: TextSelection };
      setState(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.map(u => 
          u.id === user.id ? { ...u, selection, lastActivity: Date.now() } : u
        )
      }));
    };

    collaborationService.on('contentJoined', handleContentJoined);
    collaborationService.on('contentLeft', handleContentLeft);
    collaborationService.on('userJoined', handleUserJoined);
    collaborationService.on('userLeft', handleUserLeft);
    collaborationService.on('cursorMoved', handleCursorMoved);
    collaborationService.on('selectionChanged', handleSelectionChanged);

    // Auto-join if enabled
    if (autoJoin && contentId) {
      joinContent(contentId);
    }

    return () => {
      collaborationService.off('contentJoined', handleContentJoined);
      collaborationService.off('contentLeft', handleContentLeft);
      collaborationService.off('userJoined', handleUserJoined);
      collaborationService.off('userLeft', handleUserLeft);
      collaborationService.off('cursorMoved', handleCursorMoved);
      collaborationService.off('selectionChanged', handleSelectionChanged);
      
      // Leave content on unmount
      if (stateRef.current.isJoined) {
        leaveContent();
      }
    };
  }, [autoJoin, contentId, joinContent, leaveContent]);

  // Update content when contentId changes
  useEffect(() => {
    if (contentId && contentId !== state.currentContentId && autoJoin) {
      joinContent(contentId);
    }
  }, [contentId, state.currentContentId, autoJoin, joinContent]);

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