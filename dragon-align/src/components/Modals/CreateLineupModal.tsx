import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { SavedLineup, Folder } from '../../types';

interface CreateLineupModalProps {
  onClose: () => void;
  onSave: (lineup: Omit<SavedLineup, 'id' | 'createdAt' | 'updatedAt' | 'data'>) => void;
  folders: Folder[];
}

const CreateLineupModal: React.FC<CreateLineupModalProps> = ({ onClose, onSave, folders }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState<'Practice' | 'Race' | 'Other'>('Practice');
  const [folder, setFolder] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      tag,
      folder: folder || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Save Current Lineup</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lineup Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value as 'Practice' | 'Race' | 'Other')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Practice">Practice</option>
              <option value="Race">Race</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {folders.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">No Folder</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Lineup
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLineupModal;