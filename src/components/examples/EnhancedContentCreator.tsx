// Example component demonstrating the enhanced API integration with real-time features

import React, { useState, useCallback, useEffect } from 'react'
import { useApi, usePaginatedApi, useSearchApi, useFileUpload } from '../../hooks/useApi'
import { useLoadingState } from '../../utils/loading-manager.tsx'
import { useErrorHandler } from '../../utils/error-handler'
import { contentService } from '../../services/content.service'
import { enhancedContentService } from '../../services/api-service'
import { useRealTimeCollaboration } from '../../hooks/useRealTimeCollaboration'
import { useUserPresence } from '../../hooks/useUserPresence'
import { usePublishingStatus } from '../../hooks/usePublishingStatus'
import { UserPresenceIndicator } from '../realtime/UserPresenceIndicator'
import { RealTimeNotificationCenter } from '../realtime/RealTimeNotificationCenter'
import { PublishingStatusTracker } from '../realtime/PublishingStatusTracker'
import { 
  CreateContentRequest, 
  UpdateContentRequest, 
  ContentResponse, 
  ContentType, 
  AIGenerationRequest
} from '../../types/api.types'

interface EnhancedContentCreatorProps {
  workspaceId?: number
}

export const EnhancedContentCreator: React.FC<EnhancedContentCreatorProps> = ({ workspaceId }) => {
  const [selectedContent, setSelectedContent] = useState<ContentResponse | null>(null as any)
  const [contentForm, setContentForm] = useState<Partial<CreateContentRequest>>({
    title: '',
    textContent: '',
    contentType: ContentType.TEXT
  })
  const [isTyping, setIsTyping] = useState(false)

  // Real-time collaboration
  const {
    activeUsers,
    isJoined,
    joinContent,
    leaveContent,
    updateCursor,
    updateSelection,
    applyTextOperation
  } = useRealTimeCollaboration({
    contentId: selectedContent?.id?.toString() || '',
    workspaceId: selectedContent?.workspaceId?.toString() || '1',
    autoJoin: !!selectedContent
  })

  // User presence
  const {
    currentUser,
    onlineUsers,
    trackActivity,
    setTyping
  } = useUserPresence({
    workspaceId: workspaceId?.toString(),
    contentId: selectedContent?.id?.toString(),
    autoInitialize: true
  })

  // Publishing status
  const {
    jobs: publishingJobs,
    startPublishing
  } = usePublishingStatus({
    contentId: selectedContent?.id?.toString(),
    autoSubscribe: true
  })

  // Error handler
  const { handleError, showUserError } = useErrorHandler()

  // Content creation with loading states and error handling
  const {
    data: createdContent,
    error: createError,
    loading: creating,
    execute: createContent
  } = useApi(enhancedContentService.createContent, {
    onSuccess: (content: any) => {
      console.log('Content created successfully:', content)
      setSelectedContent(content)
      // Reset form
      setContentForm({
        title: '',
        textContent: '',
        contentType: ContentType.TEXT
      })
    },
    onError: (error) => {
      showUserError(error)
    }
  })

  // Content update with optimistic updates
  const {
    data: updatedContent,
    error: updateError,
    loading: updating,
    execute: updateContent
  } = useApi(enhancedContentService.updateContent, {
    onSuccess: (content: any) => {
      console.log('Content updated successfully:', content)
      setSelectedContent(content)
    },
    onError: (error) => {
      showUserError(error)
    }
  })

  // AI content generation with progress tracking
  const {
    data: aiContent,
    error: aiError,
    loading: generating,
    execute: generateWithAI
  } = useApi(enhancedContentService.generateWithAI, {
    loadingKey: 'ai-generation',
    onSuccess: (response: any) => {
      console.log('AI content generated:', response)
      // Auto-create content from AI response
      if (response.content) {
        createContent({
          title: response.title || 'AI Generated Content',
          textContent: response.content,
          contentType: ContentType.TEXT,
          workspaceId: workspaceId?.toString(),
          fromAiGeneration: true,
          aiProvider: response.provider,
          aiModel: response.model
        })
      }
    },
    onError: (error) => {
      showUserError(error)
    }
  })

  // Paginated content list
  const {
    data: contentList,
    loading: loadingList,
    error: listError,
    hasMore,
    loadMore,
    refresh: refreshList
  } = usePaginatedApi(
    (page, size, filters) => enhancedContentService.listContent({ page, size, filters }),
    {
      immediate: true,
      pageSize: 10,
      onError: (error: any) => {
        showUserError(error)
      }
    }
  )

  // Content search with debouncing
  const {
    data: searchResults,
    loading: searching,
    error: searchError,
    query,
    search: searchContent,
    clearSearch
  } = useSearchApi(
    (query, filters) => enhancedContentService.searchContent(query, { filters }),
    {
      debounceMs: 500,
      minQueryLength: 3,
      onError: (error: any) => {
        showUserError(error)
      }
    }
  )

  // File upload with progress
  const {
    data: uploadedFile,
    loading: uploading,
    progress: uploadProgress,
    error: uploadError,
    upload: uploadFile
  } = useFileUpload(enhancedContentService.uploadFile, {
    onSuccess: (result: any) => {
      console.log('File uploaded:', result)
      // Add uploaded file URL to content form
      setContentForm(prev => ({
        ...prev,
        mediaUrls: [...(prev.mediaUrls || []), result.url]
      }))
    },
    onError: (error: any) => {
      showUserError(error)
    }
  })

  // Global loading state for AI generation
  const { isLoading: aiGenerationLoading, loadingState: aiLoadingState } = useLoadingState('ai-generation')

  // Event handlers
  const handleCreateContent = useCallback(async () => {
    if (!contentForm.title || !contentForm.textContent) {
      showUserError({
        type: 'VALIDATION' as any,
        message: 'Title and content are required',
        userMessage: 'Please fill in both title and content fields',
        retryable: false,
        timestamp: new Date().toISOString()
      })
      return
    }

    await createContent({
      ...contentForm,
      workspaceId: workspaceId?.toString()
    } as CreateContentRequest)
  }, [contentForm, workspaceId, createContent, showUserError])

  const handleUpdateContent = useCallback(async () => {
    if (!selectedContent) return

    await updateContent(selectedContent.id, {
      title: contentForm.title,
      textContent: contentForm.textContent,
      workspaceId: workspaceId?.toString()
    } as UpdateContentRequest)
  }, [selectedContent, contentForm, workspaceId, updateContent])

  const handleGenerateAI = useCallback(async () => {
    if (!contentForm.textContent) {
      showUserError({
        type: 'VALIDATION' as any,
        message: 'Prompt is required for AI generation',
        userMessage: 'Please enter a prompt for AI content generation',
        retryable: false,
        timestamp: new Date().toISOString()
      })
      return
    }

    await generateWithAI({
      prompt: contentForm.textContent,
      aiProvider: 'openai',
      aiModel: 'gpt-4',
      contentType: ContentType.TEXT,
      workspaceId: workspaceId?.toString()
    } as AIGenerationRequest)
  }, [contentForm.textContent, workspaceId, generateWithAI, showUserError])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }, [uploadFile])

  const handleContentSelect = useCallback((content: ContentResponse) => {
    setSelectedContent(content)
    setContentForm({
      title: content.title,
      textContent: content.textContent || '',
      contentType: content.contentType
    })
    
    // Track activity
    if (currentUser) {
      trackActivity('view', 'content', content.id.toString())
    }
  }, [currentUser, trackActivity])

  const handleTextChange = useCallback((value: string) => {
    setContentForm(prev => ({ ...prev, textContent: value }))
    
    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true)
      setTyping(true, { 
        contentId: selectedContent?.id?.toString(),
        workspaceId: workspaceId?.toString()
      })
    }
    
    // Clear typing after 3 seconds of inactivity
    const timeoutId = setTimeout(() => {
      setIsTyping(false)
      setTyping(false, { 
        contentId: selectedContent?.id?.toString(),
        workspaceId: workspaceId?.toString()
      })
    }, 3000)
    
    return () => clearTimeout(timeoutId)
  }, [isTyping, setTyping, selectedContent, workspaceId])

  const handlePublishContent = useCallback(async () => {
    if (!selectedContent) return
    
    try {
      const jobId = await startPublishing(
        selectedContent.id.toString(),
        ['facebook', 'twitter', 'instagram'],
        { priority: 'normal' }
      )
      console.log('Publishing started:', jobId)
      
      // Track activity
      if (currentUser) {
        trackActivity('publish', 'content', selectedContent.id.toString())
      }
    } catch (error) {
      console.error('Failed to start publishing:', error)
    }
  }, [selectedContent, startPublishing, currentUser, trackActivity])

  // Effect to handle real-time collaboration events
  useEffect(() => {
    if (selectedContent && isJoined) {
      // Handle text changes from other users
      const handleTextChanged = (operation: unknown) => {
        // Apply operational transform
        console.log('Text changed by collaborator:', operation)
      }
      
      // Set up event listeners for collaboration
      // This would be handled by the collaboration service
    }
  }, [selectedContent, isJoined])

  return (
    <div className="enhanced-content-creator">
      {/* Header with real-time features */}
      <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Enhanced Content Creator</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <UserPresenceIndicator 
            workspaceId={workspaceId?.toString()}
            contentId={selectedContent?.id?.toString()}
            showTypingIndicator={true}
          />
          <RealTimeNotificationCenter />
        </div>
      </div>

      {/* Collaboration Status */}
      {selectedContent && (
        <div className="collaboration-status" style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Editing: {selectedContent.title}</strong>
              {isJoined && (
                <span style={{ marginLeft: '10px', color: '#28a745' }}>
                  ✓ Connected ({activeUsers.length} collaborator{activeUsers.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            <button 
              onClick={handlePublishContent}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '5px 15px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Publish to Social Media
            </button>
          </div>
        </div>
      )}

      {/* Content Form */}
      <div className="content-form">
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={contentForm.title || ''}
            onChange={(e) => setContentForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter content title"
            disabled={creating || updating || generating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content:</label>
          <textarea
            id="content"
            value={contentForm.textContent || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter content or AI prompt"
            rows={6}
            disabled={creating || updating || generating}
            style={{
              border: isJoined ? '2px solid #007bff' : '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px'
            }}
          />
          {isTyping && (
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              You are typing...
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="type">Content Type:</label>
          <select
            id="type"
            value={contentForm.contentType}
            onChange={(e) => setContentForm(prev => ({ ...prev, contentType: e.target.value as ContentType }))}
            disabled={creating || updating || generating}
          >
            <option value={ContentType.TEXT}>Text</option>
            <option value={ContentType.IMAGE}>Image</option>
            <option value={ContentType.VIDEO}>Video</option>
            <option value={ContentType.MIXED}>Mixed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="file">Upload File:</label>
          <input
            id="file"
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span>{uploadProgress}%</span>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            onClick={handleCreateContent} 
            disabled={creating || updating || generating}
          >
            {creating ? 'Creating...' : 'Create Content'}
          </button>

          {selectedContent && (
            <button 
              onClick={handleUpdateContent} 
              disabled={creating || updating || generating}
            >
              {updating ? 'Updating...' : 'Update Content'}
            </button>
          )}

          <button 
            onClick={handleGenerateAI} 
            disabled={creating || updating || generating}
          >
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>

        {/* AI Generation Progress */}
        {aiGenerationLoading && aiLoadingState && (
          <div className="ai-progress">
            <div className="loading-indicator">
              <div className="spinner" />
              <div className="message">
                {aiLoadingState.message || 'Generating content with AI...'}
              </div>
              {aiLoadingState.progress !== undefined && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${aiLoadingState.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="content-search">
        <h3>Search Content</h3>
        <input
          type="text"
          value={query}
          onChange={(e) => searchContent(e.target.value)}
          placeholder="Search content..."
        />
        {query && (
          <button onClick={clearSearch}>Clear</button>
        )}
        
        {searching && <div>Searching...</div>}
        
        {searchResults && (
          <div className="search-results">
            <h4>Search Results ({searchResults.totalElements})</h4>
            {searchResults.content.map((content: ContentResponse) => (
              <div 
                key={content.id} 
                className="content-item"
                onClick={() => handleContentSelect(content)}
              >
                <h5>{content.title}</h5>
                <p>{content.textContent?.substring(0, 100)}...</p>
                <small>Status: {content.status}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content List */}
      <div className="content-list">
        <h3>Your Content</h3>
        <button onClick={refreshList} disabled={loadingList}>
          {loadingList ? 'Loading...' : 'Refresh'}
        </button>

        {contentList.map((content: ContentResponse) => (
          <div 
            key={content.id} 
            className={`content-item ${selectedContent?.id === content.id ? 'selected' : ''}`}
            onClick={() => handleContentSelect(content)}
          >
            <h4>{content.title}</h4>
            <p>{content.textContent?.substring(0, 150)}...</p>
            <div className="content-meta">
              <span>Type: {content.contentType}</span>
              <span>Status: {content.status}</span>
              <span>Created: {new Date(content.createdAt).toLocaleDateString()}</span>
              {content.aiGenerated && (
                <span className="ai-badge">AI Generated</span>
              )}
            </div>
          </div>
        ))}

        {hasMore && (
          <button onClick={loadMore} disabled={loadingList}>
            {loadingList ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>

      {/* Publishing Status */}
      {selectedContent && publishingJobs.length > 0 && (
        <div className="publishing-section">
          <PublishingStatusTracker 
            contentId={selectedContent.id.toString()}
            showQueue={true}
          />
        </div>
      )}

      {/* Error Display */}
      {(createError || updateError || aiError || listError || searchError || uploadError) && (
        <div className="error-display">
          <h4>Error</h4>
          <p>
            {createError?.userMessage || 
             updateError?.userMessage || 
             aiError?.userMessage || 
             listError?.userMessage || 
             searchError?.userMessage || 
             uploadError?.userMessage}
          </p>
        </div>
      )}
    </div>
  )
}

export default EnhancedContentCreator