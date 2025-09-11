import React from 'react';
import { Plus, Search, Filter, Clock, Folder, Trash2 } from 'lucide-react';
import type { SavedLineup, Folder as FolderType } from '../types';

interface LineupManagerProps {
  lineups: SavedLineup[];
  folders: FolderType[];
  onLoadLineup: (lineup: SavedLineup) => void;
  onCreateLineup: () => void;
  onCreateFolder: () => void;
  onDeleteLineup: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

const LineupManager: React.FC<LineupManagerProps> = ({
  lineups,
  folders,
  onLoadLineup,
  onCreateLineup,
  onCreateFolder,
  onDeleteLineup,
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange
}) => {
  const filteredLineups = lineups.filter(lineup => {
    const matchesSearch = lineup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lineup.description && lineup.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = filter === 'all' || lineup.tag === filter;
    
    return matchesSearch && matchesTag;
  });

  const getFolderName = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : 'Unknown Folder';
  };

  return (
    <div>
      <div className="flex gap-4 mb-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search lineups..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-md w-full"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Tags</option>
          <option value="Practice">Practice</option>
          <option value="Race">Race</option>
          <option value="Other">Other</option>
        </select>
        <button
          onClick={onCreateLineup}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={16} />
          New Lineup
        </button>
        <button
          onClick={onCreateFolder}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Folder size={16} />
          New Folder
        </button>
      </div>

      <div className="grid gap-4">
        {filteredLineups.map(lineup => (
          <div key={lineup.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold">{lineup.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{lineup.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full ${
                    lineup.tag === 'Practice' ? 'bg-blue-100 text-blue-800' :
                    lineup.tag === 'Race' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lineup.tag}
                  </span>
                  {lineup.folder && (
                    <span className="flex items-center gap-1">
                      <Folder size={14} />
                      {getFolderName(lineup.folder)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(lineup.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onLoadLineup(lineup)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                >
                  Load
                </button>
                <button
                  onClick={() => onDeleteLineup(lineup.id)}
                  className="p-1 text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredLineups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock size={32} className="mx-auto mb-2 text-gray-400" />
            <p>No lineups found</p>
            <p className="text-sm">Save your first lineup to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineupManager;