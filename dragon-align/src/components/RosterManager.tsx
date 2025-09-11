import React from 'react';
import { Plus, Search, Filter, Edit, Trash2, Users } from 'lucide-react';
import type { Roster } from '../types';

interface RosterManagerProps {
  rosters: Roster[];
  currentRosterId: string;
  onSelectRoster: (id: string) => void;
  onCreateRoster: () => void;
  onEditRoster: (roster: Roster) => void;
  onDeleteRoster: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

const RosterManager: React.FC<RosterManagerProps> = ({
  rosters,
  currentRosterId,
  onSelectRoster,
  onCreateRoster,
  onEditRoster,
  onDeleteRoster,
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange
}) => {
  const filteredRosters = rosters.filter(roster => {
    const matchesSearch = roster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (roster.description && roster.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' || roster.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex gap-4 mb-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search rosters..."
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
          <option value="all">All Types</option>
          <option value="master">Master</option>
          <option value="practice">Practice</option>
          <option value="event">Event</option>
          <option value="other">Other</option>
        </select>
        <button
          onClick={onCreateRoster}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={16} />
          New Roster
        </button>
      </div>

      <div className="grid gap-4">
        {filteredRosters.map(roster => (
          <div key={roster.id} className={`p-4 border rounded-lg ${currentRosterId === roster.id ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold flex items-center gap-2">
                  {roster.name}
                  {roster.type === 'master' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Master</span>
                  )}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{roster.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {roster.members.length} members
                  </span>
                  <span>Created: {new Date(roster.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectRoster(roster.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                >
                  {currentRosterId === roster.id ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => onEditRoster(roster)}
                  className="p-1 text-gray-500 hover:text-blue-600"
                >
                  <Edit size={16} />
                </button>
                {roster.type !== 'master' && (
                  <button
                    onClick={() => onDeleteRoster(roster.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredRosters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users size={32} className="mx-auto mb-2 text-gray-400" />
            <p>No rosters found</p>
            <p className="text-sm">Create your first roster to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterManager;