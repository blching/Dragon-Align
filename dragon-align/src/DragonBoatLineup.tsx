import React, { useState } from 'react';
import { Users, Target, Folder, Download, Upload, Trash2 } from 'lucide-react';

// Import hooks
import { useTeamManagement } from './hooks/useTeamManagement';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useLocalStorage } from './hooks/useLocalStorage';


// Import components
import MemberCard from './components/MemberCard';
import BoatPosition from './components/BoatPosition';
import AddMemberModal from './components/Modals/AddMemberModal';
import EditMemberModal from './components/Modals/EditMemberModal';
import CreateFolderModal from './components/Modals/CreateFolderModal';
import CreateLineupModal from './components/Modals/CreateLineupModal';
import CreateRosterModal from './components/Modals/CreateRosterModal';
import RosterManager from './components/RosterManager';
import LineupManager from './components/LineupManager';



// Import utilities
import { calculateStats } from './utils/lineupCalculations';

// Import types
import type { TeamMember, Roster } from './types';

const DragonBoatLineup: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'roster' | 'lineup' | 'management'>('roster');
  const [managementView, setManagementView] = useState<'rosters' | 'lineups'>('rosters');
  const [managementSearch, setManagementSearch] = useState('');
  const [managementFilter, setManagementFilter] = useState<string>('all');
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember & { originalId: number } | null>(null);

  // Use custom hooks
  const {
    teamRoster,
    currentLineup,
    lineup,
    lockedPositions,
    alternativePaddlers,
    rosters,
    currentRosterId,
    savedLineups,
    folders,
    searchQuery,
    filterRole,
    filterGender,
    filterSide,
    selectedMembers,
    newMember,
    setCurrentLineup,
    setLineup,
    setLockedPositions,
    setAlternativePaddlers,
    setCurrentRosterId,
    setSearchQuery,
    setFilterRole,
    setFilterGender,
    setFilterSide,
    setSelectedMembers,
    setNewMember,
    addMember,
    removeMember,
    editMember,
    saveEditedMember,
    cancelEdit,
    addToLineup,
    moveToActive,
    removeFromAlternatives,
    toggleMemberSelection,
    addSelectedToLineup,
    selectAll,
    clearSelection,
    generateOptimalLineup,
    clearLineup,
    toggleLockPosition,
    exportData,
    importData,
    clearAllData,
    isPaddlerInBoat,
    getFilteredMembers
  } = useTeamManagement();

  const {
    dragOverPosition,
    dragOverSection,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop(
    teamRoster,
    currentLineup,
    alternativePaddlers,
    lineup,
    setLineup,
    setCurrentLineup,
    setAlternativePaddlers,
    calculateStats
  );

  const currentRoster = rosters.find(r => r.id === currentRosterId) || {
    id: 'master',
    name: 'Master Roster',
    type: 'master',
    members: teamRoster,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dragon Boat Lineup Creator</h1>
          <p className="text-gray-600">Manage your team roster and create optimal boat lineups</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 cursor-pointer transition-colors">
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={16} />
            Team Roster
          </button>
          <button
            onClick={() => setActiveTab('lineup')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'lineup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target size={16} />
            Lineup & Boat
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'management'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Folder size={16} />
            Manage
          </button>
        </nav>
      </div>

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Add New Member */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
            >
              + Add New Team Member
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Roles</option>
              <option value="paddler">Paddlers</option>
              <option value="drummer">Drummers</option>
              <option value="steerer">Steerers</option>
            </select>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Other</option>
            </select>
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Sides</option>
              <option value="left">Left</option>
              <option value="left-pref">Left (preferred)</option>
              <option value="both">Both</option>
              <option value="right-pref">Right (preferred)</option>
              <option value="right">Right</option>
            </select>
          </div>

          {/* Selection Actions */}
          {getFilteredMembers.length > 0 && (
            <div className="flex gap-3 items-center">
              <button
                onClick={selectAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Select All ({getFilteredMembers.filter(m =>
                  !selectedMembers.find(s => s.id === m.id) &&
                  !currentLineup.find(c => c.id === m.id) &&
                  !alternativePaddlers.find(a => a.id === m.id)
                ).length})
              </button>
              {selectedMembers.length > 0 && (
                <>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={addSelectedToLineup}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Selected to Lineup ({selectedMembers.length})
                  </button>
                </>
              )}
            </div>
          )}

          {/* Team Roster Grid */}
          <div>
            <h3 className="font-semibold mb-3">Team Roster ({getFilteredMembers.length} members)</h3>
            {getFilteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>No members found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {getFilteredMembers.map((member) => {
                  const isInLineup = currentLineup.find(m => m.id === member.id) || alternativePaddlers.find(m => m.id === member.id);
                  const isSelected = selectedMembers.find(m => m.id === member.id);

                  return (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onEdit={editMember}
                      onRemove={() => removeMember(member.id, true)}
                      onAdd={!isInLineup ? addToLineup : undefined}
                      isSelected={!!isSelected}
                      onToggleSelect={!isInLineup ? toggleMemberSelection : undefined}
                      showAdd={!isInLineup}
                      className={isInLineup ? 'opacity-50' : ''}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lineup Tab */}
      {activeTab === 'lineup' && (
        <div className="space-y-6">
          {/* Lineup Actions */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={generateOptimalLineup}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
              disabled={currentLineup.length === 0}
            >
              <Target size={16} />
              Generate Optimal Lineup
            </button>
            {lineup && (
              <button
                onClick={clearLineup}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 transition-colors"
              >
                Clear Lineup
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Active Lineup & Alternatives */}
            <div className="xl:col-span-1 space-y-6">
              {/* Current Active Lineup */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Active Lineup ({currentLineup.filter(m => !isPaddlerInBoat(m)).length}/22)
                </h3>
                <div
                  className={`space-y-2 max-h-80 overflow-y-auto p-1 border-2 rounded-lg min-h-32 transition-all ${
                    dragOverSection === 'active'
                      ? 'border-blue-500 bg-blue-100 scale-105'
                      : 'border-gray-300 border-dashed'
                  }`}
                  onDragOver={(e) => handleDragOver(e, null, 'active')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'active')}
                >
                  {currentLineup.filter(member => !isPaddlerInBoat(member)).map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onRemove={() => removeMember(member.id, false)}
                      showAdd={false}
                      draggable={true}
                      className="cursor-move hover:shadow-md transition-shadow"
                      source="active"
                    />
                  ))}
                  {currentLineup.filter(m => !isPaddlerInBoat(m)).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No members in active lineup</p>
                      <p className="text-sm">Add members from the roster</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative Paddlers */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Alternative Paddlers ({alternativePaddlers.length}/8)
                </h3>
                <div
                  className={`min-h-32 border-2 rounded-lg p-3 transition-all ${
                    dragOverSection === 'alternatives'
                      ? 'border-yellow-500 bg-yellow-100 scale-105'
                      : 'border-yellow-300 border-dashed bg-yellow-50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, null, 'alternatives')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'alternatives')}
                >
                  {alternativePaddlers.length > 0 ? (
                    <div className="space-y-2">
                      {alternativePaddlers.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          onRemove={() => removeFromAlternatives(member.id)}
                          onAdd={() => moveToActive(member)}
                          showAdd={currentLineup.length < 22}
                          showRemove={true}
                          draggable={true}
                          className="bg-yellow-100 border-yellow-300 hover:shadow-md transition-shadow"
                          source="alternatives"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-6 transition-colors ${
                      dragOverSection === 'alternatives' ? 'text-yellow-800' : 'text-yellow-700'
                    }`}>
                      <p className="text-sm">Drop paddlers here for alternatives</p>
                      <p className="text-xs">or drag from boat positions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Boat Visualization */}
            <div className="xl:col-span-2">
              {!lineup ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Lineup Generated</h3>
                  <p className="text-gray-600 mb-4">Create a lineup to see the boat visualization</p>
                  {currentLineup.length > 0 ? (
                    <button
                      onClick={generateOptimalLineup}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Generate Lineup
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('roster')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add Members First
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Boat Visualization */}
                  <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-6 rounded-lg border">
                    <h3 className="font-semibold mb-4 text-center text-gray-800">Dragon Boat Lineup</h3>

                    {/* Drummer */}
                    <div className="flex justify-center mb-4">
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1 text-gray-700">Drummer</div>
                        <BoatPosition
                          position="drummer"
                          member={lineup.drummer}
                          locked={!!lockedPositions.drummer}
                          isDragOver={dragOverPosition === 'drummer'}
                          isHovered={hoveredPosition === 'drummer'}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onDragStart={handleDragStart}
                          onToggleLock={toggleLockPosition}
                          onRemove={(pos, member) => removeMember(member.id, false)}
                          onHover={setHoveredPosition}
                        />
                      </div>
                    </div>

                    {/* Paddler Rows */}
                    <div className="space-y-2 mb-4">
                      {lineup.rows.map((row) => (
                        <div key={row.row} className="flex justify-center items-center gap-4">
                          <BoatPosition
                            position={`${row.row}-left`}
                            member={row.left}
                            locked={!!lockedPositions[`${row.row}-left`]}
                            isDragOver={dragOverPosition === `${row.row}-left`}
                            isHovered={hoveredPosition === `${row.row}-left`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onDragStart={handleDragStart}
                            onToggleLock={toggleLockPosition}
                            onRemove={(pos, member) => removeMember(member.id, false)}
                            onHover={setHoveredPosition}
                          />
                          <div className="text-sm font-medium text-gray-600 w-12 text-center bg-white rounded px-2 py-1">
                            R{row.row}
                          </div>
                          <BoatPosition
                            position={`${row.row}-right`}
                            member={row.right}
                            locked={!!lockedPositions[`${row.row}-right`]}
                            isDragOver={dragOverPosition === `${row.row}-right`}
                            isHovered={hoveredPosition === `${row.row}-right`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onDragStart={handleDragStart}
                            onToggleLock={toggleLockPosition}
                            onRemove={(pos, member) => removeMember(member.id, false)}
                            onHover={setHoveredPosition}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Steerer */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1 text-gray-700">Steerer</div>
                        <BoatPosition
                          position="steerer"
                          member={lineup.steerer}
                          locked={!!lockedPositions.steerer}
                          isDragOver={dragOverPosition === 'steerer'}
                          isHovered={hoveredPosition === 'steerer'}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onDragStart={handleDragStart}
                          onToggleLock={toggleLockPosition}
                          onRemove={(pos, member) => removeMember(member.id, false)}
                          onHover={setHoveredPosition}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  {lineup.stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h4 className="font-medium text-gray-900 mb-2">Weight Balance</h4>
                        <div className="space-y-1 text-sm">
                          <div>Left: <span className="font-medium">{lineup.stats.leftWeight} lbs</span></div>
                          <div>Right: <span className="font-medium">{lineup.stats.rightWeight} lbs</span></div>
                          <div className={`font-medium ${lineup.stats.weightDifference <= 20 ? 'text-green-600' : 'text-red-600'}`}>
                            Diff: {lineup.stats.weightDifference} lbs
                            {lineup.stats.weightDifference <= 20 && <span className="ml-1">✓</span>}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h4 className="font-medium text-gray-900 mb-2">Front/Back</h4>
                        <div className="space-y-1 text-sm">
                          <div>Front: <span className="font-medium">{lineup.stats.frontBackWeight.frontWeight} lbs</span></div>
                          <div>Back: <span className="font-medium">{lineup.stats.frontBackWeight.backWeight} lbs</span></div>
                          <div className="font-medium text-blue-600">
                            Diff: {Math.abs(lineup.stats.frontBackWeight.frontWeight - lineup.stats.frontBackWeight.backWeight)} lbs
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h4 className="font-medium text-gray-900 mb-2">Preferences</h4>
                        <div className="space-y-1 text-sm">
                          <div>Satisfied: <span className="font-medium">{lineup.stats.preferencesSatisfied}%</span></div>
                          <div>Paddlers: <span className="font-medium">{lineup.stats.totalPaddlers}/20</span></div>
                          <div className={`font-medium ${lineup.stats.preferencesSatisfied >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                            {lineup.stats.preferencesSatisfied >= 80 ? 'Excellent ✓' : 'Can improve'}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <h4 className="font-medium text-gray-900 mb-2">Team Mix</h4>
                        <div className="space-y-1 text-sm">
                          <div>♂ Male: <span className="font-medium">{lineup.stats.genderDistribution.male}</span></div>
                          <div>♀ Female: <span className="font-medium">{lineup.stats.genderDistribution.female}</span></div>
                          <div>⚬ Other: <span className="font-medium">{lineup.stats.genderDistribution.neutral}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Management Tab */}
      {activeTab === 'management' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setManagementView('rosters')}
              className={`px-4 py-2 rounded-md ${
                managementView === 'rosters'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Rosters
            </button>
            <button
              onClick={() => setManagementView('lineups')}
              className={`px-4 py-2 rounded-md ${
                managementView === 'lineups'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Lineups
            </button>
          </div>

          {managementView === 'rosters' ? (
            <RosterManager
              rosters={rosters}
              currentRosterId={currentRosterId}
              onSelectRoster={setCurrentRosterId}
              searchTerm={managementSearch}
              onSearchChange={setManagementSearch}
              filter={managementFilter}
              onFilterChange={setManagementFilter}
              onCreateRoster={() => {}}
              onEditRoster={(roster: Roster) => {}}
              onDeleteRoster={(id: string) => {}}
            />
          ) : (
            <LineupManager
              lineups={savedLineups}
              folders={folders}
              onLoadLineup={(lineup) => {
                setCurrentLineup(lineup.data.currentLineup);
                setAlternativePaddlers(lineup.data.alternativePaddlers);
                setLineup(lineup.data.lineup);
                setLockedPositions(lineup.data.lockedPositions);
                setActiveTab('lineup');
              }}
              searchTerm={managementSearch}
              onSearchChange={setManagementSearch}
              filter={managementFilter}
              onFilterChange={setManagementFilter}
              onCreateLineup={() => {}}
              onCreateFolder={() => {}}
              onDeleteLineup={(id: string) => {}}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showAddMemberModal && (
        <AddMemberModal
          onClose={() => setShowAddMemberModal(false)}
          onSave={addMember}
          newMember={newMember}
          setNewMember={setNewMember}
        />
      )}

      {editingMember && (
        <EditMemberModal
          onClose={cancelEdit}
          onSave={saveEditedMember}
          editingMember={editingMember}
          setEditingMember={setEditingMember}
        />
      )}
    </div>
  );
};

export default DragonBoatLineup;
