import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip} from '@mui/material';
import {
  Send as SendIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  ThumbUp as LikeIcon,
  ThumbDown as DislikeIcon,
  Notifications as NotificationIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replies: Comment[];
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike';
  isEdited: boolean;
  mentions: string[];
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

interface CommentSystemProps {
  contentId: string;
  contentType: 'content' | 'template' | 'media';
  allowReplies?: boolean;
  allowReactions?: boolean;
  allowMentions?: boolean;
  maxDepth?: number;
}

const CommentSystem: React.FC<CommentSystemProps> = ({
  contentId,
  contentType,
  allowReplies = true,
  allowReactions = true,
  allowMentions = true,
  maxDepth = 3
}) => {
  const { user } = useAuth();
  const { 
    comments, 
    addComment, 
    updateComment, 
    deleteComment, 
    reactToComment,
    loading 
  } = useComments(contentId, contentType);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{id: string, name: string}>>([]);
  const [showMentions, setShowMentions] = useState(false);

  const textFieldRef = useRef<HTMLInputElement>(null);

  const handleSubmitComment = async (parentId?: string) => {
    const content = parentId ? newComment : newComment;
    if (!content.trim()) return;

    try {
      await addComment({
        content: content.trim(),
        parentId,
        mentions: extractMentions(content)
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment(commentId, {
        content: editContent.trim(),
        mentions: extractMentions(editContent)
      });
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
    setMenuAnchorEl(null);
  };

  const handleReaction = async (commentId: string, reaction: 'like' | 'dislike') => {
    try {
      await reactToComment(commentId, reaction);
    } catch (error) {
      console.error('Failed to react to comment:', error);
    }
  };

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const handleMentionInput = (value: string) => {
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      // In a real app, you'd fetch team members here
      setMentionSuggestions([
        { id: '1', name: 'john_doe' },
        { id: '2', name: 'jane_smith' },
        { id: '3', name: 'admin' }
      ]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (username: string) => {
    const currentValue = replyingTo ? newComment : newComment;
    const lastAtIndex = currentValue.lastIndexOf('@');
    const newValue = currentValue.substring(0, lastAtIndex) + `@${username} `;
    setNewComment(newValue);
    setShowMentions(false);
    textFieldRef.current?.focus();
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return commentTime.toLocaleDateString();
  };

  const renderComment = (comment: Comment, depth: number = 0) => (
    <Box key={comment.id} sx={{ ml: depth * 2 }}>
      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
        <ListItemAvatar>
          <Avatar src={comment.author.avatar}>
            {comment.author.name[0]}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2">{comment.author.name}</Typography>
              <Chip label={comment.author.role} size="small" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(comment.createdAt)}
                {comment.isEdited && ' (edited)'}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ mt: 1 }}>
              {editingComment === comment.id ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    multiline
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => handleEditComment(comment.id)}
                    >
                      Save
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Typography>
                  
                  {comment.attachments.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {comment.attachments.map(attachment => (
                        <Chip
                          key={attachment.id}
                          label={attachment.name}
                          size="small"
                          icon={<AttachFileIcon />}
                          onClick={() => window.open(attachment.url, '_blank')}
                          clickable
                        />
                      ))}
                    </Box>
                  )}

                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {allowReactions && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleReaction(comment.id, 'like')}
                          color={comment.userReaction === 'like' ? 'primary' : 'default'}
                        >
                          <LikeIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption">{comment.likes}</Typography>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleReaction(comment.id, 'dislike')}
                          color={comment.userReaction === 'dislike' ? 'error' : 'default'}
                        >
                          <DislikeIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption">{comment.dislikes}</Typography>
                      </>
                    )}

                    {allowReplies && depth < maxDepth && (
                      <Button
                        size="small"
                        startIcon={<ReplyIcon />}
                        onClick={() => setReplyingTo(comment.id)}
                      >
                        Reply
                      </Button>
                    )}

                    {user && String(user.id) === String(comment.author.id) && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchorEl(e.currentTarget);
                          setSelectedComment(comment.id);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </>
              )}
            </Box>
          }
        />
      </ListItem>

      {replyingTo === comment.id && (
        <Box sx={{ ml: 4, mb: 2 }}>
          <TextField
            multiline
            rows={2}
            placeholder={`Reply to ${comment.author.name}...`}
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              if (allowMentions) {
                handleMentionInput(e.target.value);
              }
            }}
            fullWidth
            size="small"
            inputRef={textFieldRef}
          />
          
          {showMentions && mentionSuggestions.length > 0 && (
            <Card sx={{ mt: 1, maxWidth: 200 }}>
              <List dense>
                {mentionSuggestions.map(suggestion => (
                  <ListItem
                    key={suggestion.id}
                    button
                    onClick={() => insertMention(suggestion.name)}
                  >
                    <ListItemText primary={`@${suggestion.name}`} />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}

          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => handleSubmitComment(comment.id)}
              disabled={!newComment.trim()}
            >
              Reply
            </Button>
            <Button
              size="small"
              onClick={() => {
                setReplyingTo(null);
                setNewComment('');
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ ml: 2 }}>
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </Box>
      )}

      <Divider sx={{ my: 1 }} />
    </Box>
  );

  const topLevelComments = comments?.filter(c => !c.parentId) || [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Comments ({comments?.length || 0})
        </Typography>

        {/* New Comment Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            multiline
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              if (allowMentions) {
                handleMentionInput(e.target.value);
              }
            }}
            fullWidth
            inputRef={textFieldRef}
          />
          
          {showMentions && mentionSuggestions.length > 0 && (
            <Card sx={{ mt: 1, maxWidth: 200 }}>
              <List dense>
                {mentionSuggestions.map(suggestion => (
                  <ListItem
                    key={suggestion.id}
                    button
                    onClick={() => insertMention(suggestion.name)}
                  >
                    <ListItemText primary={`@${suggestion.name}`} />
                  </ListItem>
                ))}
              </List>
            </Card>
          )}

          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small">
                <AttachFileIcon />
              </IconButton>
              {allowMentions && (
                <IconButton size="small">
                  <NotificationIcon />
                </IconButton>
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => handleSubmitComment()}
              disabled={!newComment.trim() || loading}
            >
              Comment
            </Button>
          </Box>
        </Box>

        {/* Comments List */}
        <List>
          {topLevelComments.map(comment => renderComment(comment))}
          
          {topLevelComments.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No comments yet"
                secondary="Be the first to comment!"
                sx={{ textAlign: 'center' }}
              />
            </ListItem>
          )}
        </List>

        {/* Comment Actions Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              const comment = comments?.find(c => c.id === selectedComment);
              if (comment) {
                setEditingComment(comment.id);
                setEditContent(comment.content);
              }
              setMenuAnchorEl(null);
            }}
          >
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => selectedComment && handleDeleteComment(selectedComment)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Delete
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setMenuAnchorEl(null)}>
            <FlagIcon sx={{ mr: 1 }} />
            Report
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default CommentSystem;