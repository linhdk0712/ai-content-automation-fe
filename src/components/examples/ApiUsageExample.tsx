import React, { useState } from 'react'
import { apiOperations, errorHandlers } from '../../utils/api-helpers'
import { useNotifications } from '../../hooks/useNotifications'
import { ContentResponse, CreateContentRequest, ContentType } from '../../types/api.types'

/**
 * Example component showing how to use the new ResponseBase API handling
 */
const ApiUsageExample: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<ContentResponse | null>(null)
  const { showSuccess, showError } = useNotifications()

  // Example 1: Create content with automatic notifications
  const handleCreateContent = async () => {
    try {
      setLoading(true)
      
      const request: CreateContentRequest = {
        title: 'Test Content',
        textContent: 'This is a test content',
        contentType: ContentType.ARTICLE
      }

      // This will automatically show loading, success, and error notifications
      const newContent = await apiOperations.create<ContentResponse>(
        '/content', 
        request, 
        'Content'
      )
      
      setContent(newContent)
    } catch (error) {
      // Error notification is handled automatically
      console.error('Failed to create content:', error)
    } finally {
      setLoading(false)
    }
  }

  // Example 2: Fetch content with custom error handling
  const handleFetchContent = async (id: number) => {
    try {
      setLoading(true)
      
      const fetchedContent = await apiOperations.fetch<ContentResponse>(
        `/content/${id}`,
        true, // show loading
        'content'
      )
      
      setContent(fetchedContent)
      showSuccess('Content loaded successfully')
    } catch (error) {
      // Custom error handling
      errorHandlers.handleNotFoundError(error as any, 'Content')
      errorHandlers.handlePermissionError(error as any)
    } finally {
      setLoading(false)
    }
  }

  // Example 3: Update content
  const handleUpdateContent = async () => {
    if (!content) return

    try {
      setLoading(true)
      
      const updatedContent = await apiOperations.update<ContentResponse>(
        `/content/${content.id}`,
        {
          title: 'Updated Content Title',
          textContent: content.textContent
        },
        'Content'
      )
      
      setContent(updatedContent)
    } catch (error) {
      errorHandlers.handleError(error, 'Failed to update content')
    } finally {
      setLoading(false)
    }
  }

  // Example 4: Delete content
  const handleDeleteContent = async () => {
    if (!content) return

    try {
      setLoading(true)
      
      await apiOperations.delete(`/content/${content.id}`, 'Content')
      
      setContent(null)
    } catch (error) {
      errorHandlers.handleError(error, 'Failed to delete content')
    } finally {
      setLoading(false)
    }
  }

  // Example 5: Publish content
  const handlePublishContent = async () => {
    if (!content) return

    try {
      setLoading(true)
      
      await apiOperations.publish(`/content/${content.id}/publish`, {
        platforms: ['facebook', 'twitter'],
        publishImmediately: true
      })
      
    } catch (error) {
      errorHandlers.handleError(error, 'Failed to publish content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">API Usage Examples</h2>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Content Operations</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleCreateContent}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Create Content
            </button>
            
            <button
              onClick={() => handleFetchContent(1)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Fetch Content
            </button>
            
            <button
              onClick={handleUpdateContent}
              disabled={loading || !content}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Update Content
            </button>
            
            <button
              onClick={handlePublishContent}
              disabled={loading || !content}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Publish Content
            </button>
            
            <button
              onClick={handleDeleteContent}
              disabled={loading || !content}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Delete Content
            </button>
          </div>
          
          {loading && (
            <div className="text-blue-600 font-medium">
              Processing...
            </div>
          )}
          
          {content && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-medium">Current Content:</h4>
              <p><strong>ID:</strong> {content.id}</p>
              <p><strong>Title:</strong> {content.title}</p>
              <p><strong>Status:</strong> {content.status}</p>
              <p><strong>Type:</strong> {content.contentType}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Notification Features</h3>
          <p className="text-gray-600 mb-4">
            All API operations automatically show appropriate notifications:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li><strong>Success:</strong> Green notifications for successful operations</li>
            <li><strong>Error:</strong> Red notifications with error codes and messages</li>
            <li><strong>Loading:</strong> Blue notifications for long-running operations</li>
            <li><strong>Validation:</strong> Yellow notifications for validation errors</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">ResponseBase Format</h3>
          <p className="text-gray-600 mb-2">
            All API responses now follow the ResponseBase format:
          </p>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "errorCode": null | string,
  "errorMessage": null | string,
  "data": T | null
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default ApiUsageExample