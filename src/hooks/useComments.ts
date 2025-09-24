import { useState, useEffect } from 'react';
import { commentService } from '../services/comment.service';

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

interface AddCommentRequest {
  content: string;
  parentId?: string;
  mentions?: string[];
  attachments?: File[];
}

interface UpdateCommentRequest {
  content: string;
  mentions?: string[];
}

interface UseCommentsReturn {
  comments: Comment[] | null;
  loading: boolean;
  error: string | null;
  addComment: (request: AddCommentRequest) => Promise<void>;
  updateComment: (commentId: string, request: UpdateCommentRequest) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  reactToComment: (commentId: string, reaction: 'like' | 'dislike') => Promise<void>;
  refreshComments: () => Promise<void>;
}

export const useComments = (
  contentId: string, 
  contentType: 'content' | 'template' | 'media'
): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commentService.getComments(contentId, contentType);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (request: AddCommentRequest) => {
    try {
      setLoading(true);
      const newComment = await commentService.addComment(contentId, contentType, request);
      
      // Add comment to local state
      if (request.parentId) {
        // Add as reply
        setComments(prev => 
          prev?.map(comment => 
            comment.id === request.parentId
              ? { ...comment, replies: [...comment.replies, newComment] }
              : comment
          ) || null
        );
      } else {
        // Add as top-level comment
        setComments(prev => [newComment, ...(prev || [])]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComment = async (commentId: string, request: UpdateCommentRequest) => {
    try {
      setLoading(true);
      const updatedComment = await commentService.updateComment(commentId, request);
      
      // Update comment in local state
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return updatedComment;
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateCommentInTree(comment.replies) };
          }
          return comment;
        });
      };
      
      setComments(prev => prev ? updateCommentInTree(prev) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      setLoading(true);
      await commentService.deleteComment(commentId);
      
      // Remove comment from local state
      const removeCommentFromTree = (comments: Comment[]): Comment[] => {
        return comments
          .filter(comment => comment.id !== commentId)
          .map(comment => ({
            ...comment,
            replies: removeCommentFromTree(comment.replies)
          }));
      };
      
      setComments(prev => prev ? removeCommentFromTree(prev) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reactToComment = async (commentId: string, reaction: 'like' | 'dislike') => {
    try {
      const updatedComment = await commentService.reactToComment(commentId, reaction);
      
      // Update comment reaction in local state
      const updateReactionInTree = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return updatedComment;
          }
          if (comment.replies.length > 0) {
            return { ...comment, replies: updateReactionInTree(comment.replies) };
          }
          return comment;
        });
      };
      
      setComments(prev => prev ? updateReactionInTree(prev) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to react to comment');
      throw err;
    }
  };

  const refreshComments = async () => {
    await fetchComments();
  };

  useEffect(() => {
    if (contentId && contentType) {
      fetchComments();
    }
  }, [contentId, contentType]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    reactToComment,
    refreshComments
  };
};