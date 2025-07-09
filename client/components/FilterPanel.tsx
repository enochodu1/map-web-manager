import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/solid';

interface FilterPanelProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const FilterPanel = ({ selectedStatus, onStatusChange }: FilterPanelProps) => {
  const statuses = [
    { id: 'all', label: 'All', icon: null },
    { id: 'active', label: 'Active', icon: CheckCircleIcon, color: 'text-green-500' },
    { id: 'inactive', label: 'Inactive', icon: MinusCircleIcon, color: 'text-gray-500' },
    { id: 'error', label: 'Error', icon: XCircleIcon, color: 'text-red-500' },
    { id: 'warning', label: 'Warning', icon: ExclamationTriangleIcon, color: 'text-yellow-500' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
        Filter by Status
      </h3>
      
      <div className="space-y-2">
        {statuses.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onStatusChange(id)}
            className={`flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors
              ${selectedStatus === id
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            {Icon && (
              <Icon className={`h-5 w-5 mr-2 ${color}`} />
            )}
            <span>{label}</span>
            
            {selectedStatus === id && (
              <span className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400">
                Selected
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 