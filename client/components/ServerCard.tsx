import { useState } from 'react';
import { 
  ServerIcon, 
  PlayIcon, 
  StopIcon, 
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { MCPServer } from '@/types';

interface ServerCardProps {
  server: MCPServer;
  onToggle: (serverId: string) => void;
  onDelete: (serverId: string) => void;
}

export const ServerCard = ({ server, onToggle, onDelete }: ServerCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'starting':
      case 'stopping':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <ServerIcon className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {server.name}
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
            {server.status}
          </span>
        </div>
        
        {server.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {server.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => onToggle(server.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${server.status === 'active'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                }`}
            >
              {server.status === 'active' ? (
                <StopIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={() => onDelete(server.id)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showDetails ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Port
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {server.port || 'N/A'}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {server.type || 'Custom'}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(server.createdAt).toLocaleDateString()}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(server.updatedAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}; 