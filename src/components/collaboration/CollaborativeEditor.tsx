import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Box, Avatar, Chip, Typography, Tooltip, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';

interface Cursor {
  userId: string;
  userName: string;
  userAvatar: string;
  position: { line: number; column: number };
  color: string;
  lastActivity: number;
}

interface PresenceUser {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'idle' | 'away';
  lastSeen: number;
  cursor?: Cursor;
}

interface CollaborativeEditorProps {
  contentId: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

const EditorContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const PresenceBar = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const CursorOverlay = styled(Box)({
  position: 'absolute',
  pointerEvents: 'none',
  zIndex: 1000,
});

const CursorIndicator = styled(Box)<{ color: string }>(({ color }) => ({
  position: 'absolute',
  width: 2,
  height: 20,
  backgroundColor: color,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -4,
    left: -2,
    width: 6,
    height: 6,
    backgroundColor: color,
    borderRadius: '50%',
  },
}));

const UserCursorLabel = styled(Box)<{ color: string }>(({ color, theme }) => ({
  position: 'absolute',
  top: -25,
  left: 0,
  backgroundColor: color,
  color: 'white',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '100%',
    left: 8,
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderTop: `4px solid ${color}`,
  },
}));

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  contentId,
  initialContent = '',
  onContentChange,
  readOnly = false,
}) => {
  const { user } = useAuth();
  const editorRef = useRef<any>(null);
  const [content, setContent] = useState(initialContent);
  const [presenceUsers, setPresenceUsers] = useState<Map<string, PresenceUser>>(new Map());
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const lastChangeRef = useRef<number>(0);

  const { isConnected, send, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'user_joined':
        handleUserJoined(message.data);
        break;
      case 'user_left':
        handleUserLeft(message.data);
        break;
      case 'cursor_update':
        handleCursorUpdate(message.data);
        break;
      case 'content_change':
        handleRemoteContentChange(message.data);
        break;
      case 'presence_update':
        handlePresenceUpdate(message.data);
        break;
    }
  }

  const handleUserJoined = useCallback((userData: PresenceUser) => {
    setPresenceUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.set(userData.id, {
        ...userData,
        status: 'active',
        lastSeen: Date.now(),
      });
      return newUsers;
    });
  }, []);

  const handleUserLeft = useCallback((userId: string) => {
    setPresenceUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.delete(userId);
      return newUsers;
    });
    setCursors(prev => {
      const newCursors = new Map(prev);
      newCursors.delete(userId);
      return newCursors;
    });
  }, []);

  const handleCursorUpdate = useCallback((cursorData: Cursor) => {
    if (cursorData.userId !== String(user?.id)) {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(cursorData.userId, cursorData);
        return newCursors;
      });
    }
  }, [user?.id]);

  const handleRemoteContentChange = useCallback((changeData: any) => {
    if (changeData.userId !== user?.id && editorRef.current) {
      const editor = editorRef.current;
      const currentContent = editor.getContent();
      
      // Apply operational transform
      const transformedContent = applyOperationalTransform(
        currentContent,
        changeData.operations
      );
      
      editor.setContent(transformedContent);
      setContent(transformedContent);
    }
  }, [user?.id]);

  const handlePresenceUpdate = useCallback((presenceData: any) => {
    setPresenceUsers(prev => {
      const newUsers = new Map(prev);
      const existingUser = newUsers.get(presenceData.userId);
      if (existingUser) {
        newUsers.set(presenceData.userId, {
          ...existingUser,
          status: presenceData.status,
          lastSeen: Date.now(),
        });
      }
      return newUsers;
    });
  }, []);

  const handleEditorChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
    
    const now = Date.now();
    lastChangeRef.current = now;
    
    // Debounce content changes
    setTimeout(() => {
      if (lastChangeRef.current === now && isConnected) {
        const operations = generateOperations(content, newContent);
        send({
          type: 'content_change',
          data: {
            contentId,
            operations,
            userId: user?.id,
            timestamp: now,
          },
        });
      }
    }, 300);
    
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  }, [content, contentId, user?.id, isConnected, send, onContentChange]);

  const handleCursorPositionChange = useCallback((editor: any) => {
    if (!isConnected || !user) return;
    
    const selection = editor.selection;
    const range = selection.getRng();
    const position = getCursorPosition(editor, range);
    
    const cursorData: Cursor = {
      userId: String(user.id),
      userName: user.username,
      userAvatar: user.profilePictureUrl || '',
      position,
      color: getUserColor(String(user.id)),
      lastActivity: Date.now(),
    };
    
    send({
      type: 'cursor_update',
      data: cursorData,
    });
  }, [isConnected, user, send]);

  const getUserColor = (userId: string): string => {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
  };

  const getCursorPosition = (editor: any, range: Range) => {
    // Simplified cursor position calculation
    const offset = range.startOffset;
    
    // This would need more sophisticated implementation for accurate positioning
    return { line: 0, column: offset };
  };

  const generateOperations = (oldContent: string, newContent: string) => {
    // Simplified diff algorithm - in production, use a proper OT library
    return [{
      type: 'replace',
      oldContent,
      newContent,
      timestamp: Date.now(),
    }];
  };

  const applyOperationalTransform = (content: string, operations: any[]) => {
    // Simplified OT application - in production, use a proper OT library
    return operations.reduce((acc, op) => {
      if (op.type === 'replace') {
        return op.newContent;
      }
      return acc;
    }, content);
  };

  const getPresenceStatus = (user: PresenceUser): 'active' | 'idle' | 'away' => {
    const timeSinceLastSeen = Date.now() - user.lastSeen;
    if (timeSinceLastSeen < 30000) return 'active'; // 30 seconds
    if (timeSinceLastSeen < 300000) return 'idle'; // 5 minutes
    return 'away';
  };

  useEffect(() => {
    if (isConnected && user) {
      send({
        type: 'join_collaboration',
        data: {
          contentId,
          user: {
            id: user.id,
            name: user.username,
            avatar: user.profilePictureUrl,
          },
        },
      });
    }
  }, [isConnected, user, contentId, send]);

  return (
    <EditorContainer>
      <PresenceBar elevation={0}>
        <Typography variant="body2" color="textSecondary">
          {presenceUsers.size > 0 ? `${presenceUsers.size} collaborator(s)` : 'No collaborators'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          {Array.from(presenceUsers.values()).map((presenceUser) => (
            <Tooltip
              key={presenceUser.id}
              title={`${presenceUser.name} (${getPresenceStatus(presenceUser)})`}
            >
              <Avatar
                src={presenceUser.avatar}
                sx={{
                  width: 32,
                  height: 32,
                  border: `2px solid ${getUserColor(presenceUser.id)}`,
                  opacity: getPresenceStatus(presenceUser) === 'active' ? 1 : 0.6,
                }}
              >
                {presenceUser.name.charAt(0)}
              </Avatar>
            </Tooltip>
          ))}
        </Box>
        
        {isTyping && (
          <Chip
            label="Someone is typing..."
            size="small"
            color="primary"
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        )}
      </PresenceBar>

      <Box sx={{ position: 'relative' }}>
        <Editor
          onInit={(_evt: unknown, editor: any) => {
            editorRef.current = editor;
          }}
          initialValue={content}
          init={{
            height: 500,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            setup: (editor: any) => {
              editor.on('input', () => {
                handleEditorChange(editor.getContent());
              });
              
              editor.on('selectionchange', () => {
                handleCursorPositionChange(editor as any);
              });
            },
          }}
          disabled={readOnly}
        />
        
        <CursorOverlay>
          {Array.from(cursors.values()).map((cursor) => (
            <CursorIndicator
              key={cursor.userId}
              color={cursor.color}
              sx={{
                left: cursor.position.column * 8, // Approximate character width
                top: cursor.position.line * 20, // Approximate line height
              }}
            >
              <UserCursorLabel color={cursor.color}>
                {cursor.userName}
              </UserCursorLabel>
            </CursorIndicator>
          ))}
        </CursorOverlay>
      </Box>
    </EditorContainer>
  );
};

export default CollaborativeEditor;