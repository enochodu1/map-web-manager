import { useState } from 'react';
import { 
  FolderIcon, 
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { MCPFolder } from '@/types';

interface FolderTreeProps {
  folders: MCPFolder[];
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export const FolderTree = ({ folders, selectedFolder, onFolderSelect }: FolderTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: MCPFolder, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;
    const isEditing = editingFolder === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id} style={{ marginLeft: `${depth * 12}px` }}>
        <div
          className={`flex items-center p-2 rounded-md cursor-pointer group
            ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
          `}
          onClick={() => onFolderSelect(folder.id)}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md mr-1"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}

          {/* Folder Icon */}
          {isExpanded ? (
            <FolderOpenIcon className="h-5 w-5 text-blue-500 mr-2" />
          ) : (
            <FolderIcon className="h-5 w-5 text-blue-500 mr-2" />
          )}

          {/* Folder Name */}
          {isEditing ? (
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => {
                // Handle rename
                setEditingFolder(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Handle rename
                  setEditingFolder(null);
                }
              }}
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
              {folder.name}
            </span>
          )}

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingFolder(folder.id);
                setNewFolderName(folder.name);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle delete
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
            >
              <TrashIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {folder.children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* All Servers Option */}
      <div
        className={`flex items-center p-2 rounded-md cursor-pointer
          ${selectedFolder === null ? 'bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
        `}
        onClick={() => onFolderSelect(null)}
      >
        <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
          All Servers
        </span>
      </div>

      {/* Folder Tree */}
      {folders.map((folder) => renderFolder(folder))}

      {/* Add Folder Button */}
      <button
        className="flex items-center p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md w-full mt-2"
        onClick={() => {
          // Handle add folder
        }}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Folder
      </button>
    </div>
  );
}; 