import React from 'react';
import { useUserPresence } from '../../hooks/useUserPresence';
import { UserPresence } from '../../services/userPresence.service';

interface UserPresenceIndicatorProps {
  workspaceId?: string;
  contentId?: string;
  className?: string;
  showTypingIndicator?: boolean;
  maxVisibleUsers?: number;
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  workspaceId,
  contentId,
  className = '',
  showTypingIndicator = true,
  maxVisibleUsers = 5
}) => {
  const {
    currentUser,
    onlineUsers,
    usersInLocation,
    typingUsers,
    updateStatus, 
    getLastSeenText
  } = useUserPresence({ workspaceId, contentId, autoInitialize: true });

  const getStatusColor = (status: UserPresence['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: UserPresence['status']) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  const renderUserAvatar = (user: UserPresence, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };

    return (
      <div className="relative">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className={`${sizeClasses[size]} rounded-full object-cover`}
          />
        ) : (
          <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center`}>
            <span className="text-gray-600 font-medium text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Status Indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
        
        {/* Typing Indicator */}
        {user.isTyping && showTypingIndicator && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  const renderUserTooltip = (user: UserPresence) => (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap">
      <div className="font-medium">{user.username}</div>
      <div className="text-gray-300">{getStatusText(user.status)}</div>
      {user.customStatus && (
        <div className="text-gray-300 italic">{user.customStatus}</div>
      )}
      <div className="text-gray-400 text-xs">
        Last seen: {getLastSeenText(user.userId)}
      </div>
      
      {/* Tooltip Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
    </div>
  );

  const displayUsers = usersInLocation.length > 0 ? usersInLocation : onlineUsers;
  const visibleUsers = displayUsers.slice(0, maxVisibleUsers);
  const hiddenCount = Math.max(0, displayUsers.length - maxVisibleUsers);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Current User Status */}
      {currentUser && (
        <div className="flex items-center space-x-2 mr-4">
          <div className="relative group">
            {renderUserAvatar(currentUser)}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {renderUserTooltip(currentUser)}
            </div>
          </div>
          
          <select
            value={currentUser.status}
            onChange={(e) => updateStatus(e.target.value as UserPresence['status'])}
            title="Change status"
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="busy">Busy</option>
          </select>
        </div>
      )}

      {/* Other Users */}
      {visibleUsers.length > 0 && (
        <>
          <div className="flex -space-x-2">
            {visibleUsers
              .filter(user => user.userId !== currentUser?.userId)
              .map(user => (
                <div key={user.userId} className="relative group">
                  {renderUserAvatar(user)}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {renderUserTooltip(user)}
                  </div>
                </div>
              ))}
          </div>

          {hiddenCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              +{hiddenCount}
            </div>
          )}
        </>
      )}

      {/* Typing Indicator */}
      {showTypingIndicator && typingUsers.length > 0 && (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>
            {typingUsers.length === 1 
              ? `${typingUsers[0].username} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </span>
        </div>
      )}

      {/* Online Count */}
      {onlineUsers.length > 0 && (
        <div className="text-sm text-gray-600">
          {onlineUsers.length} online
        </div>
      )}
    </div>
  );
};