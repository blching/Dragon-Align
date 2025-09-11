import { useState, useEffect, useMemo } from 'react';
import type { TeamMember, Boat, Roster, SavedLineup, Folder } from '../types';
import { initializeBoat, calculateStats } from '../utils/lineupCalculations';

export const useTeamManagement = () => {
  // Load initial data from localStorage
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  // State management
  const [teamRoster, setTeamRoster] = useState<TeamMember[]>(loadFromStorage<TeamMember[]>('teamRoster', []));
  const [currentLineup, setCurrentLineup] = useState<TeamMember[]>(loadFromStorage<TeamMember[]>('currentLineup', []));
  const [lineup, setLineup] = useState<Boat | null>(loadFromStorage<Boat | null>('lineup', null));
  const [lockedPositions, setLockedPositions] = useState<Record<string, TeamMember>>(loadFromStorage<Record<string, TeamMember>>('lockedPositions', {}));
  const [alternativePaddlers, setAlternativePaddlers] = useState<TeamMember[]>(loadFromStorage<TeamMember[]>('alternativePaddlers', []));
  const [rosters, setRosters] = useState<Roster[]>(loadFromStorage<Roster[]>('rosters', []));
  const [currentRosterId, setCurrentRosterId] = useState<string>(loadFromStorage<string>('currentRosterId', 'master'));
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>(loadFromStorage<SavedLineup[]>('savedLineups', []));
  const [folders, setFolders] = useState<Folder[]>(loadFromStorage<Folder[]>('folders', []));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterSide, setFilterSide] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({
    name: '',
    weight: '',
    preferredSide: 'left-pref',
    roles: ['paddler'],
    gender: 'male'
  });
  const [editingMember, setEditingMember] = useState<TeamMember & { originalId: number } | null>(null);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const saveToStorage = (key: string, value: unknown) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    };

    saveToStorage('teamRoster', teamRoster);
    saveToStorage('currentLineup', currentLineup);
    saveToStorage('lineup', lineup);
    saveToStorage('lockedPositions', lockedPositions);
    saveToStorage('alternativePaddlers', alternativePaddlers);
    saveToStorage('rosters', rosters);
    saveToStorage('currentRosterId', currentRosterId);
    saveToStorage('savedLineups', savedLineups);
    saveToStorage('folders', folders);
  }, [teamRoster, currentLineup, lineup, lockedPositions, alternativePaddlers, rosters, currentRosterId, savedLineups, folders]);

  // Filter members based on search and filters
  const getFilteredMembers = useMemo(() => {
    return teamRoster.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || member.roles.includes(filterRole as any);
      const matchesGender = filterGender === 'all' || member.gender === filterGender;
      const matchesSide = filterSide === 'all' || member.preferredSide === filterSide;
      
      return matchesSearch && matchesRole && matchesGender && matchesSide;
    });
  }, [teamRoster, searchQuery, filterRole, filterGender, filterSide]);

  // Check if a paddler is in the boat
  const isPaddlerInBoat = (member: TeamMember) => {
    if (!lineup) return false;
    
    // Check drummer and steerer
    if (lineup.drummer?.id === member.id || lineup.steerer?.id === member.id) {
      return true;
    }
    
    // Check all rows
    for (const row of lineup.rows) {
      if (row.left?.id === member.id || row.right?.id === member.id) {
        return true;
      }
    }
    
    return false;
  };

  // Add a new team member
  const addMember = () => {
    if (!newMember.name.trim() || !newMember.weight) {
      alert('Please provide both name and weight');
      return;
    }

    const weight = parseFloat(newMember.weight);
    if (weight < 70 || weight > 330 || isNaN(weight)) {
      alert('Weight must be between 70 and 330 lbs');
      return;
    }

    if (newMember.roles.length === 0) {
      alert('Please select at least one role');
      return;
    }

    const member: TeamMember = {
      id: Date.now() + Math.random(),
      name: newMember.name.trim(),
      weight: weight,
      preferredSide: newMember.preferredSide as any,
      roles: newMember.roles as any,
      gender: newMember.gender as any
    };

    setTeamRoster(prev => [...prev, member]);
    setNewMember({ name: '', weight: '', preferredSide: 'left-pref', roles: ['paddler'], gender: 'male' });
  };

  // Remove a team member
  const removeMember = (id: number, fromRoster = true) => {
    if (fromRoster) {
      setTeamRoster(prev => prev.filter(member => member.id !== id));
      setCurrentLineup(prev => prev.filter(member => member.id !== id));
      setSelectedMembers(prev => prev.filter(member => member.id !== id));
      setAlternativePaddlers(prev => prev.filter(member => member.id !== id));
      
      // Remove from lineup if exists
      if (lineup) {
        const newLineup = { ...lineup };
        let found = false;
        
        // Remove from boat positions
        newLineup.rows.forEach(row => {
          if (row.left && row.left.id === id) {
            row.left = null;
            found = true;
          }
          if (row.right && row.right.id === id) {
            row.right = null;
            found = true;
          }
        });
        
        if (newLineup.drummer && newLineup.drummer.id === id) {
          newLineup.drummer = null;
          found = true;
        }
        
        if (newLineup.steerer && newLineup.steerer.id === id) {
          newLineup.steerer = null;
          found = true;
        }
        
        if (found) {
          // Recalculate stats
          newLineup.stats = calculateStats(newLineup);
          setLineup(newLineup);
          
          // Remove from locked positions
          setLockedPositions(prev => {
            const newLocked = { ...prev };
            Object.keys(newLocked).forEach(key => {
              if (newLocked[key] && newLocked[key].id === id) {
                delete newLocked[key];
              }
            });
            return newLocked;
          });
        }
      }
    } else {
      setCurrentLineup(prev => prev.filter(member => member.id !== id));
    }
  };

  // Edit a team member
  const editMember = (member: TeamMember) => {
    setEditingMember({
      ...member,
      originalId: member.id
    });
  };

  // Save edited member
  const saveEditedMember = () => {
    if (!editingMember) return;
    
    if (!editingMember.name.trim() || !editingMember.weight) {
      alert('Please provide both name and weight');
      return;
    }

    const weight = parseFloat(editingMember.weight.toString());
    if (weight < 70 || weight > 330 || isNaN(weight)) {
      alert('Weight must be between 70 and 330 lbs');
      return;
    }

    if (editingMember.roles.length === 0) {
      alert('Please select at least one role');
      return;
    }

    const updatedMember: TeamMember = {
      ...editingMember,
      weight: weight,
      name: editingMember.name.trim()
    };

    // Update in team roster
    setTeamRoster(prev => prev.map(member => 
      member.id === editingMember.originalId ? updatedMember : member
    ));

    // Update in current lineup if exists
    setCurrentLineup(prev => prev.map(member => 
      member.id === editingMember.originalId ? updatedMember : member
    ));

    // Update in alternatives if exists
    setAlternativePaddlers(prev => prev.map(member => 
      member.id === editingMember.originalId ? updatedMember : member
    ));

    // Update in lineup visualization if exists
    if (lineup) {
      const newLineup = { ...lineup };
      let updated = false;

      newLineup.rows.forEach(row => {
        if (row.left && row.left.id === editingMember.originalId) {
          row.left = updatedMember;
          updated = true;
        }
        if (row.right && row.right.id === editingMember.originalId) {
          row.right = updatedMember;
          updated = true;
        }
      });

      if (newLineup.drummer && newLineup.drummer.id === editingMember.originalId) {
        newLineup.drummer = updatedMember;
        updated = true;
      }

      if (newLineup.steerer && newLineup.steerer.id === editingMember.originalId) {
        newLineup.steerer = updatedMember;
        updated = true;
      }

      if (updated) {
        newLineup.stats = calculateStats(newLineup);
        setLineup(newLineup);
      }

      // Update locked positions
      setLockedPositions(prev => {
        const newLocked = { ...prev };
        Object.keys(newLocked).forEach(key => {
          if (newLocked[key] && newLocked[key].id === editingMember.originalId) {
            newLocked[key] = updatedMember;
          }
        });
        return newLocked;
      });
    }

    setEditingMember(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingMember(null);
  };

  // Add to lineup
  const addToLineup = (member: TeamMember) => {
    // Check if member is already in current lineup or alternatives
    const totalInLineup = currentLineup.length + alternativePaddlers.length;
    
    if (totalInLineup >= 30) { // 22 active + up to 8 alternatives
      alert('Maximum 30 members allowed (22 active + 8 alternatives)');
      return;
    }
    
    const alreadyInActive = currentLineup.find(m => m.id === member.id);
    const alreadyInAlternatives = alternativePaddlers.find(m => m.id === member.id);
    
    if (alreadyInActive || alreadyInAlternatives) {
      return; // Already in lineup
    }
    
    // Add to active lineup if space, otherwise to alternatives
    if (currentLineup.length < 22) {
      setCurrentLineup(prev => [...prev, member]);
    } else {
      setAlternativePaddlers(prev => [...prev, member]);
    }
  };

  // Move to alternatives
  const moveToAlternatives = (member: TeamMember) => {
    if (alternativePaddlers.length >= 8) {
      alert('Maximum 8 alternative paddlers allowed');
      return;
    }
    
    // Remove from current lineup
    const newCurrentLineup = currentLineup.filter(m => m.id !== member.id);
    setCurrentLineup(newCurrentLineup);
    
    // Add to alternatives if not already there
    if (!alternativePaddlers.find(m => m.id === member.id)) {
      setAlternativePaddlers(prev => [...prev, member]);
    }
    
    // Remove from boat positions if in lineup
    if (lineup) {
      const newLineup = { ...lineup };
      let updated = false;
      
      newLineup.rows.forEach(row => {
        if (row.left?.id === member.id) {
          row.left = null;
          updated = true;
        }
        if (row.right?.id === member.id) {
          row.right = null;
          updated = true;
        }
      });
      
      if (newLineup.drummer?.id === member.id) {
        newLineup.drummer = null;
        updated = true;
      }
      
      if (newLineup.steerer?.id === member.id) {
        newLineup.steerer = null;
        updated = true;
      }
      
      if (updated) {
        newLineup.stats = calculateStats(newLineup);
        setLineup(newLineup);
      }
    }
  };

  // Move to active
  const moveToActive = (member: TeamMember) => {
    if (currentLineup.length >= 22) {
      alert('Maximum 22 members allowed in active lineup');
      return;
    }
    
    // Remove from alternatives
    setAlternativePaddlers(prev => prev.filter(m => m.id !== member.id));
    
    // Add to active lineup
    setCurrentLineup(prev => [...prev, member]);
  };

  // Remove from alternatives
  const removeFromAlternatives = (id: number) => {
    setAlternativePaddlers(prev => prev.filter(member => member.id !== id));
  };

  // Toggle member selection
  const toggleMemberSelection = (member: TeamMember) => {
    setSelectedMembers(prev => {
      const isSelected = prev.find(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  // Add selected to lineup
  const addSelectedToLineup = () => {
    const membersToAdd = selectedMembers.filter(member => 
      !currentLineup.find(m => m.id === member.id) && !alternativePaddlers.find(m => m.id === member.id)
    );
    
    const totalInLineup = currentLineup.length + alternativePaddlers.length;
    
    if (totalInLineup + membersToAdd.length > 30) {
      alert(`Cannot add ${membersToAdd.length} members. Maximum 30 members allowed in total.`);
      return;
    }
    
    // Add to active lineup first, then alternatives
    let addedToActive = 0;
    let addedToAlternatives = 0;
    
    membersToAdd.forEach(member => {
      if (currentLineup.length + addedToActive < 22) {
        setCurrentLineup(prev => [...prev, member]);
        addedToActive++;
      } else if (alternativePaddlers.length + addedToAlternatives < 8) {
        setAlternativePaddlers(prev => [...prev, member]);
        addedToAlternatives++;
      }
    });
    
    setSelectedMembers([]);
  };

  // Select all
  const selectAll = () => {
    const newSelections = getFilteredMembers.filter(member => 
      !selectedMembers.find(m => m.id === member.id) && 
      !currentLineup.find(m => m.id === member.id) &&
      !alternativePaddlers.find(m => m.id === member.id)
    );
    setSelectedMembers(prev => [...prev, ...newSelections]);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedMembers([]);
  };

  // Generate optimal lineup
  const generateOptimalLineup = () => {
    if (currentLineup.length === 0) {
      alert('Please add members to the current lineup first!');
      return;
    }

    const paddlers = currentLineup.filter(m => m.roles.includes('paddler'));
    const drummers = currentLineup.filter(m => m.roles.includes('drummer'));
    const steerers = currentLineup.filter(m => m.roles.includes('steerer'));

    // Check if we have a steerer (required)
    if (steerers.length === 0) {
      alert('A steerer is required to generate a lineup!');
      return;
    }

    if (paddlers.length > 20) {
      alert('Too many paddlers! Maximum 20 allowed.');
      return;
    }

    if (paddlers.length === 0) {
      alert('At least one paddler is required to generate a lineup.');
      return;
    }

    const boat = initializeBoat();

    // Place locked positions first
    Object.entries(lockedPositions).forEach(([position, member]) => {
      if (position === 'drummer') {
        boat.drummer = member;
      } else if (position === 'steerer') {
        boat.steerer = member;
      } else {
        const [rowStr, side] = position.split('-');
        const rowNum = parseInt(rowStr);
        const row = boat.rows.find(r => r.row === rowNum);
        if (row) {
          row[side as 'left' | 'right'] = member;
        }
      }
    });

    // Get available members (not locked)
    const availablePaddlers = paddlers.filter(p => 
      !Object.values(lockedPositions).some(locked => locked && locked.id === p.id)
    );
    const availableDrummers = drummers.filter(d => 
      !Object.values(lockedPositions).some(locked => locked && locked.id === d.id)
    );
    const availableSteerers = steerers.filter(s => 
      !Object.values(lockedPositions).some(locked => locked && locked.id === s.id)
    );

    // Assign specialized roles if not locked
    if (!boat.drummer && availableDrummers.length > 0) {
      // Prioritize members who are only drummers
      const dedicatedDrummer = availableDrummers.find(d => d.roles.length === 1);
      boat.drummer = dedicatedDrummer || availableDrummers[0];
    }
    
    // Steerer is required, use the first available one
    if (!boat.steerer && availableSteerers.length > 0) {
      // Prioritize members who are only steerers
      const dedicatedSteerer = availableSteerers.find(s => s.roles.length === 1);
      boat.steerer = dedicatedSteerer || availableSteerers[0];
    }

    // Enhanced placement algorithm with left-right balance as top priority
    const malePaddlers = availablePaddlers.filter(p => p.gender === 'male').sort((a, b) => b.weight - a.weight);
    const femalePaddlers = availablePaddlers.filter(p => p.gender === 'female').sort((a, b) => b.weight - a.weight);
    const neutralPaddlers = availablePaddlers.filter(p => p.gender === 'neutral').sort((a, b) => b.weight - a.weight);

    let leftWeight = 0;
    let rightWeight = 0;
    let frontWeight = 0;
    let backWeight = 0;
    let placedPaddlers = 0;

    // Calculate initial weights from locked positions
    boat.rows.forEach(row => {
      if (row.left) {
        leftWeight += row.left.weight;
        frontWeight += row.row <= 5 ? row.left.weight : 0;
        backWeight += row.row > 5 ? row.left.weight : 0;
        placedPaddlers++;
      }
      if (row.right) {
        rightWeight += row.right.weight;
        frontWeight += row.row <= 5 ? row.right.weight : 0;
        backWeight += row.row > 5 ? row.right.weight : 0;
        placedPaddlers++;
      }
    });

    const getAvailablePositions = () => {
      const positions: {row: number, side: 'left' | 'right', position: 'front' | 'back', rowObj: any}[] = [];
      boat.rows.forEach(row => {
        if (row.left === null) {
          positions.push({
            row: row.row,
            side: 'left',
            position: row.row <= 5 ? 'front' : 'back',
            rowObj: row
          });
        }
        if (row.right === null) {
          positions.push({
            row: row.row,
            side: 'right',
            position: row.row <= 5 ? 'front' : 'back',
            rowObj: row
          });
        }
      });
      return positions;
    };

    const placePaddler = (paddler: TeamMember, preferredRows: number[] | null = null) => {
      if (placedPaddlers >= 20) return false;

      const availablePositions = getAvailablePositions();
      if (availablePositions.length === 0) return false;

      let candidatePositions = preferredRows 
        ? availablePositions.filter(pos => preferredRows.includes(pos.row))
        : availablePositions;

      if (candidatePositions.length === 0) {
        candidatePositions = availablePositions;
      }

      // Find the best position using a simple loop instead of reduce
      let bestScore = -Infinity;
      let bestPosition = null;

      for (const current of candidatePositions) {
        let score = 0;
        
        // Prefer paddler's preferred side
        if (paddler.preferredSide === current.side) score += 10;
        else if (paddler.preferredSide === 'both') score += 5;

        // Balance left/right weight
        const currentSideWeight = current.side === 'left' ? leftWeight : rightWeight;
        const otherSideWeight = current.side === 'left' ? rightWeight : leftWeight;
        if (currentSideWeight <= otherSideWeight) score += 3;

        // Balance front/back weight
        const currentPosWeight = current.position === 'front' ? frontWeight : backWeight;
        const otherPosWeight = current.position === 'front' ? backWeight : frontWeight;
        if (currentPosWeight <= otherPosWeight) score += 2;

        // Prefer center rows for heavier paddlers
        if (paddler.weight > 160 && [4, 5, 6, 7].includes(current.row)) score += 1;
        
        // Prefer front/back for lighter paddlers
        if (paddler.weight < 140 && ([1, 2, 3, 8, 9, 10].includes(current.row))) score += 1;

        if (score > bestScore) {
          bestScore = score;
          bestPosition = current;
        }
      }

      if (bestPosition) {
        if (bestPosition.side === 'left') {
          bestPosition.rowObj.left = paddler;
        } else {
          bestPosition.rowObj.right = paddler;
        }

        leftWeight += bestPosition.side === 'left' ? paddler.weight : 0;
        rightWeight += bestPosition.side === 'right' ? paddler.weight : 0;
        frontWeight += bestPosition.position === 'front' ? paddler.weight : 0;
        backWeight += bestPosition.position === 'back' ? paddler.weight : 0;
        placedPaddlers++;

        return true;
      }
      
      return false;
    };

    // Phase 1: Place stronger/heavier males in center (rows 4-7)
    malePaddlers.slice(0, 8).forEach(paddler => {
      const centerRows = [4, 5, 6, 7];
      placePaddler(paddler, centerRows);
    });

    // Phase 2: Place females strategically (distribute front/back)
    femalePaddlers.forEach(paddler => {
      placePaddler(paddler);
    });

    // Phase 3: Place remaining males
    malePaddlers.filter(p => !boat.rows.some((row: { left: TeamMember; right: TeamMember; }) => row.left === p || row.right === p)).forEach(paddler => {
      placePaddler(paddler);
    });

    // Phase 4: Place neutral gender paddlers
    neutralPaddlers.forEach(paddler => {
      placePaddler(paddler);
    });

    // Calculate final stats
    const stats = calculateStats(boat);

    setLineup({
      ...boat,
      stats
    });
  };

  // Clear lineup
  const clearLineup = () => {
    setLineup(null);
    setLockedPositions({});
  };

  // Toggle lock position
  const toggleLockPosition = (position: string) => {
    if (!lineup) return;

    setLockedPositions(prev => {
      const newLocked = { ...prev };
      
      if (newLocked[position]) {
        // Unlock position
        delete newLocked[position];
      } else {
        // Lock position - get current member in that position
        let member: TeamMember | null = null;
        
        if (position === 'drummer') {
          member = lineup.drummer;
        } else if (position === 'steerer') {
          member = lineup.steerer;
        } else {
          const [rowStr, side] = position.split('-');
          const rowNum = parseInt(rowStr);
          const row = lineup.rows.find(r => r.row === rowNum);
          if (row) {
            member = row[side as 'left' | 'right'];
          }
        }
        
        if (member) {
          newLocked[position] = member;
        }
      }
      
      return newLocked;
    });
  };

  // Export data
  const exportData = () => {
    const data = {
      teamRoster,
      currentLineup,
      alternativePaddlers,
      lineup,
      lockedPositions,
      rosters,
      currentRosterId,
      savedLineups,
      folders
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dragonboat-lineup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.teamRoster) setTeamRoster(data.teamRoster);
        if (data.currentLineup) setCurrentLineup(data.currentLineup);
        if (data.alternativePaddlers) setAlternativePaddlers(data.alternativePaddlers);
        if (data.lineup) setLineup(data.lineup);
        if (data.lockedPositions) setLockedPositions(data.lockedPositions);
        if (data.rosters) setRosters(data.rosters);
        if (data.currentRosterId) setCurrentRosterId(data.currentRosterId);
        if (data.savedLineups) setSavedLineups(data.savedLineups);
        if (data.folders) setFolders(data.folders);
        
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Clear the input
    event.target.value = '';
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      setTeamRoster([]);
      setCurrentLineup([]);
      setAlternativePaddlers([]);
      setLineup(null);
      setLockedPositions({});
      setRosters([]);
      setCurrentRosterId('master');
      setSavedLineups([]);
      setFolders([]);
      setSelectedMembers([]);
    }
  };

  return {
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
    editingMember,
    setTeamRoster,
    setCurrentLineup,
    setLineup,
    setLockedPositions,
    setAlternativePaddlers,
    setRosters,
    setCurrentRosterId,
    setSavedLineups,
    setFolders,
    setSearchQuery,
    setFilterRole,
    setFilterGender,
    setFilterSide,
    setSelectedMembers,
    setNewMember,
    setEditingMember,
    addMember,
    removeMember,
    editMember,
    saveEditedMember,
    cancelEdit,
    addToLineup,
    moveToAlternatives,
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
  };
};