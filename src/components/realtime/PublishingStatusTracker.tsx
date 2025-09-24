import React, { useState } from 'react';
import { usePublishingStatus } from '../../hooks/usePublishingStatus';
import { PublishingJob } from '../../services/publishingStatus.service';

interface PublishingStatusTrackerProps {
  contentId?: string;
  className?: string;
  showQueue?: boolean;
}

export const PublishingStatusTracker: React.FC<PublishingStatusTrackerProps> = ({
  contentId,
  className = '',
  showQueue = true
}) => {
  const {
    jobs,
    activeJobs,
    queueStatus,
    isLoading,
    error,
    cancelPublishing,
    retryPublishing,
    getLatestProgress
  } = usePublishingStatus({ contentId, autoSubscribe: true });

  const [selectedJob, setSelectedJob] = useState<PublishingJob | null>(null);

  const getStatusColor = (status: PublishingJob['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'queued':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return '📘';
      case 'twitter':
        return '🐦';
      case 'instagram':
        return '📷';
      case 'linkedin':
        return '💼';
      case 'tiktok':
        return '🎵';
      case 'youtube':
        return '📺';
      default:
        return '🌐';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const renderJobCard = (job: PublishingJob) => {
    const latestProgress = getLatestProgress(job.id);
    const duration = job.startedAt && job.completedAt 
      ? job.completedAt - job.startedAt 
      : job.startedAt 
        ? Date.now() - job.startedAt 
        : 0;

    return (
      <div
        key={job.id}
        className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedJob(job)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
              {job.status.toUpperCase()}
            </span>
            {job.status === 'processing' && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            )}
          </div>
          
          <div className="flex space-x-1">
            {job.platforms.map(platform => (
              <span key={platform} title={platform} className="text-lg">
                {getPlatformIcon(platform)}
              </span>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {job.status === 'processing' && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{latestProgress?.stage || 'Processing'}</span>
              <span>{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Platform Results */}
        <div className="space-y-2 mb-3">
          {job.results.map((result, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span>{getPlatformIcon(result.platform)}</span>
                <span className="font-medium">{result.platform}</span>
              </div>
              <div className="flex items-center space-x-2">
                {result.status === 'success' && result.postUrl && (
                  <a
                    href={result.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Post
                  </a>
                )}
                <span className={`px-2 py-1 rounded text-xs ${
                  result.status === 'success' ? 'bg-green-100 text-green-800' :
                  result.status === 'failed' ? 'bg-red-100 text-red-800' :
                  result.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {result.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Job Info */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'Not started'}
          </span>
          {duration > 0 && (
            <span>Duration: {formatDuration(duration)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-3">
          {job.status === 'processing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelPublishing(job.id);
              }}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
          )}
          {job.status === 'failed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                retryPublishing(job.id);
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Publishing Status</h3>
          <p className="text-sm text-gray-600">
            Track your content publishing across platforms
          </p>
        </div>
        
        {activeJobs.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span>{activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Queue Status */}
      {showQueue && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Queue Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{queueStatus.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStatus.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{queueStatus.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          {queueStatus.estimatedWaitTime > 0 && (
            <div className="mt-3 text-sm text-gray-600 text-center">
              Estimated wait time: {formatDuration(queueStatus.estimatedWaitTime)}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">
              Failed to load publishing status: {error.message}
            </span>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading publishing jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Publishing Jobs</h3>
            <p className="text-gray-600">
              Publishing jobs will appear here when you start publishing content.
            </p>
          </div>
        ) : (
          jobs.map(renderJobCard)
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Publishing Job Details
                </h3>
                <button
                  title="Close"
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Job ID:</label>
                  <p className="text-sm text-gray-900">{selectedJob.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Content ID:</label>
                  <p className="text-sm text-gray-900">{selectedJob.contentId}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Progress:</label>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${selectedJob.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{selectedJob.progress}%</p>
                  </div>
                </div>
                
                {selectedJob.error && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Error:</label>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1">
                      {selectedJob.error}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Platform Results:</label>
                  <div className="mt-2 space-y-2">
                    {selectedJob.results.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.platform}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.status === 'success' ? 'bg-green-100 text-green-800' :
                            result.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        {result.postUrl && (
                          <a
                            href={result.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Post →
                          </a>
                        )}
                        {result.error && (
                          <p className="text-red-600 text-sm mt-1">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};