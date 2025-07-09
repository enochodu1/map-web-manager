'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  ServerIcon, 
  FolderIcon, 
  PlusIcon, 
  PlayIcon, 
  StopIcon,
  CogIcon,
  SearchIcon,
  FilterIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

import { ServerCard } from '@/components/ServerCard';
import { FolderTree } from '@/components/FolderTree';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { CreateServerModal } from '@/components/CreateServerModal';
import { SettingsModal } from '@/components/SettingsModal';
import { useServerStore } from '@/store/serverStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiClient } from '@/lib/api';
import { MCPServer, MCPFolder } from '@/types';

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { servers, folders, updateServer, addServer, removeServer } = useServerStore();
  
  // WebSocket connection for real-time updates
  useWebSocket({
    onServerStatusUpdate: (status) => {
      updateServer(status.serverId, { status: status.status });
    },
    onServerLog: (log) => {
      // Handle server logs
      console.log('Server log:', log);
    }
  });

  // Fetch servers and folders
  const { data: serversData, isLoading: serversLoading } = useQuery(
    'servers',
    () => apiClient.getServers(),
    {
      onSuccess: (data) => {
        // Update store with fetched servers
        data.forEach(server => addServer(server));
      }
    }
  );

  const { data: foldersData, isLoading: foldersLoading } = useQuery(
    'folders',
    () => apiClient.getFolders()
  );

  // Filter servers based on search and selection
  const filteredServers = servers.filter(server => {
    const matchesSearch = searchQuery === '' || 
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFolder = selectedFolder === null || server.folderId === selectedFolder;
    
    const matchesStatus = selectedStatus === 'all' || server.status === selectedStatus;
    
    return matchesSearch && matchesFolder && matchesStatus;
  });

  // Get server counts by status
  const serverCounts = {
    total: servers.length,
    active: servers.filter(s => s.status === 'active').length,
    inactive: servers.filter(s => s.status === 'inactive').length,
    error: servers.filter(s => s.status === 'error').length,
  };

  const handleServerToggle = async (serverId: string) => {
    try {
      await apiClient.toggleServer(serverId);
    } catch (error) {
      console.error('Failed to toggle server:', error);
    }
  };

  const handleServerDelete = async (serverId: string) => {
    try {
      await apiClient.deleteServer(serverId);
      removeServer(serverId);
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  };

  if (serversLoading || foldersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ServerIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                MCP Web Manager
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search servers..."
              />
              
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <FilterIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Server</span>
              </button>
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <CogIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {serverCounts.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 mr-1" />
                {serverCounts.active}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                {serverCounts.inactive}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Inactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
                <XCircleIcon className="h-6 w-6 mr-1" />
                {serverCounts.error}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Error</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FolderIcon className="h-5 w-5 mr-2" />
                Folders
              </h2>
              <FolderTree
                folders={foldersData || []}
                selectedFolder={selectedFolder}
                onFolderSelect={setSelectedFolder}
              />
            </div>
            
            {showFilterPanel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6"
              >
                <FilterPanel
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                />
              </motion.div>
            )}
          </div>

          {/* Server Grid */}
          <div className="lg:col-span-3">
            {filteredServers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No servers found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchQuery || selectedFolder 
                    ? 'No servers match your current filters.' 
                    : 'Get started by adding your first MCP server.'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center space-x-2 mx-auto transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Your First Server</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onToggle={handleServerToggle}
                    onDelete={handleServerDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateServerModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          folders={foldersData || []}
        />
      )}
      
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
