import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MCPFolder } from '@/types';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: MCPFolder[];
}

export const CreateServerModal = ({ isOpen, onClose, folders }: CreateServerModalProps) => {
  const [serverData, setServerData] = useState({
    name: '',
    description: '',
    type: 'custom',
    folderId: '',
    command: '',
    port: '',
    env: {} as Record<string, string>
  });

  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Transform env vars array to object
    const envObject = envVars.reduce((acc, { key, value }) => {
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    try {
      // Submit server data
      // await apiClient.createServer({
      //   ...serverData,
      //   env: envObject,
      //   port: serverData.port ? parseInt(serverData.port) : undefined
      // });
      
      onClose();
    } catch (error) {
      console.error('Failed to create server:', error);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-auto shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              Add New Server
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Server Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={serverData.name}
                  onChange={(e) => setServerData({ ...serverData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  value={serverData.description}
                  onChange={(e) => setServerData({ ...serverData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Server Type
                </label>
                <select
                  id="type"
                  value={serverData.type}
                  onChange={(e) => setServerData({ ...serverData, type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="custom">Custom</option>
                  <option value="filesystem">Filesystem</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="brave-search">Brave Search</option>
                  <option value="sqlite">SQLite</option>
                  <option value="git">Git</option>
                  <option value="time">Time</option>
                </select>
              </div>

              <div>
                <label htmlFor="folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Folder
                </label>
                <select
                  id="folder"
                  value={serverData.folderId}
                  onChange={(e) => setServerData({ ...serverData, folderId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Server Configuration */}
            <div className="space-y-4">
              <div>
                <label htmlFor="command" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Command
                </label>
                <input
                  type="text"
                  id="command"
                  value={serverData.command}
                  onChange={(e) => setServerData({ ...serverData, command: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Port
                </label>
                <input
                  type="number"
                  id="port"
                  value={serverData.port}
                  onChange={(e) => setServerData({ ...serverData, port: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Environment Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Environment Variables
                </label>
                <div className="space-y-2">
                  {envVars.map((envVar, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={envVar.key}
                        onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={envVar.value}
                        onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeEnvVar(index)}
                          className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEnvVar}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Add Variable
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Server
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}; 