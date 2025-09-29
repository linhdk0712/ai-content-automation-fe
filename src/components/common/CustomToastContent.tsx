import React from 'react'

export interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

export interface CustomToastContentProps {
  title?: string
  message: string
  actions?: ToastAction[]
}

const CustomToastContent: React.FC<CustomToastContentProps> = ({ title, message, actions }) => (
  <div className="custom-toast-content">
    {title && <div className="toast-title font-semibold mb-1">{title}</div>}
    <div className="toast-message">{message}</div>
    {actions && actions.length > 0 && (
      <div className="toast-actions mt-2 flex gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`px-3 py-1 text-sm rounded ${
              action.style === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : action.style === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
)

export default CustomToastContent