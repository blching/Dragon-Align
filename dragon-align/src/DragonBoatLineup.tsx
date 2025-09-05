import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Users, Scale, Target, RotateCcw, Download, Upload, Lock, Unlock, Edit3, Search, Filter, Save, Trash2 } from 'lucide-react';

// Define TypeScript interfaces for our data structures
interface TeamMember {
  id: number;
  name: string;
  weight: number;
  preferredSide: 'left' | 'right' | 'none';
  role: 'paddler' | 'drummer' | 'steerer';
  gender: 'male' | 'female' | 'neutral';
}

interface BoatRow {
  row: number;
  left: TeamMember | null;
  right: TeamMember | null;
}

interface Boat {
  rows: BoatRow[];
  drummer: TeamMember | null;
  steerer: TeamMember | null;
  stats?: BoatStats;
}

interface BoatStats {
  totalPaddlers: number;
  leftWeight: number;
  rightWeight: number;
  weightDifference: number;
  preferencesSatisfied: number;
  genderDistribution: {
    male: number;
    female: number;
    neutral: number;
  };
  frontBackWeight: {
    frontWeight: number;
    backWeight: number;
  };
}

const DragonBoatLineup: React.FC = () => {
  // Load initial data from localStorage if available
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const [teamRoster, setTeamRoster] = useState<TeamMember[]>(loadFromStorage<TeamMember[]>('teamRoster', [
    // Sample team roster (weights in lbs)
    { id: 1, name: 'Alex Chen', weight: 165, preferredSide: 'left', role: 'paddler', gender: 'male' },
    { id: 2, name: 'Sarah Wilson', weight: 137, preferredSide: 'right', role: 'paddler', gender: 'female' },
    { id: 3, name: 'Mike Rodriguez', weight: 181, preferredSide: 'left', role: 'paddler', gender: 'male' },
    { id: 4, name: 'Emma Thompson', weight: 128, preferredSide: 'right', role: 'paddler', gender: 'female' },
    { id: 5, name: 'David Kim', weight: 172, preferredSide: 'left', role: 'paddler', gender: 'male' },
    { id: 6, name: 'Lisa Zhang', weight: 143, preferredSide: 'right', role: 'paddler', gender: 'female' },
    { id: 7, name: 'Tom Anderson', weight: 187, preferredSide: 'none', role: 'paddler', gender: 'male' },
    { id: 8, name: 'Jessica Lee', weight: 132, preferredSide: 'left', role: 'paddler', gender: 'female' },
    { id: 9, name: 'Chris Johnson', weight: 176, preferredSide: 'right', role: 'paddler', gender: 'male' },
    { id: 10, name: 'Amy Davis', weight: 121, preferredSide: 'left', role: 'paddler', gender: 'female' },
    { id: 11, name: 'Jordan Smith', weight: 154, preferredSide: 'none', role: 'paddler', gender: 'neutral' },
    { id: 12, name: 'Rachel Brown', weight: 139, preferredSide: 'right', role: 'paddler', gender: 'female' },
    { id: 13, name: 'Kevin Wong', weight: 170, preferredSide: 'left', role: 'paddler', gender: 'male' },
    { id: 14, name: 'Sophie Martin', weight: 130, preferredSide: 'right', role: 'paddler', gender: 'female' },
    { id: 15, name: 'Ryan Taylor', weight: 183, preferredSide: 'left', role: 'paddler', gender: 'male' },
    { id: 16, name: 'Maya Patel', weight: 134, preferredSide: 'none', role: 'paddler', gender: 'female' },
    { id: 17, name: 'Jake Miller', weight: 174, preferredSide: 'right', role: 'paddler', gender: 'male' },
    { id: 18, name: 'Nicole Garcia', weight: 126, preferredSide: 'left', role: 'paddler', gender: 'female' },
    { id: 19, name: 'Sam Rivera', weight: 159, preferredSide: 'none', role: 'paddler', gender: 'neutral' },
    { id: 20, name: 'Olivia White', weight: 141, preferredSide: 'right', role: 'paddler', gender: 'female' },
    { id: 21, name: 'Marcus Johnson', weight: 194, preferredSide: 'none', role: 'drummer', gender: 'male' },
    { id: 22, name: 'Taylor Green', weight: 161, preferredSide: 'none', role: 'steerer', gender: 'neutral' },
    { id: 23, name: 'Ben Carter', weight: 178, preferredSide: 'left', role: 'paddler', gender: 'male' },
    { id: 24, name: 'Anna Lee', weight: 135, preferredSide: 'right', role: 'paddler', gender: 'female' },
    { id: 25, name: 'Carlos Diaz', weight: 169, preferredSide: 'none', role: 'paddler', gender: 'male' }
  ]));
  
  const [currentLineup, setCurrentLineup] = useState<TeamMember[]>(loadFromStorage<TeamMember[]>('currentLineup', []));
  const [lineup, setLineup] = useState<Boat | null>(loadFromStorage<Boat | null>('lineup', null));
  const [lockedPositions, setLockedPositions] = useState<Record<string, TeamMember>>(loadFromStorage<Record<string, TeamMember>>('lockedPositions', {}));
  const [draggedMember, setDraggedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState('roster');
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterSide, setFilterSide] = useState('all');
  const [alternativePaddlers, setAlternativePaddlers] = useState<TeamMember[]>(loadFromStorage<TeamMember[]>('alternativePaddlers', []));
  const [editingMember, setEditingMember] = useState<TeamMember & { originalId: number } | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    weight: '',
    preferredSide: 'left',
    role: 'paddler',
    gender: 'male'
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState<string | null>(null);

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
  }, [teamRoster, currentLineup, lineup, lockedPositions, alternativePaddlers]);

  // Initialize boat structure: 10 rows + drummer + steerer
  const initializeBoat = (): Boat => {
    const boat: Boat = {
      rows: [],
      drummer: null,
      steerer: null
    };
    
    for (let i = 0; i < 10; i++) {
      boat.rows.push({
        row: i + 1,
        left: null,
        right: null
      });
    }
    return boat;
  };

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

    const member: TeamMember = {
      id: Date.now() + Math.random(), // More unique ID
      name: newMember.name.trim(),
      weight: weight,
      preferredSide: newMember.preferredSide as 'left' | 'right' | 'none',
      role: newMember.role as 'paddler' | 'drummer' | 'steerer',
      gender: newMember.gender as 'male' | 'female' | 'neutral'
    };

    setTeamRoster(prev => [...prev, member]);
    setNewMember({ name: '', weight: '', preferredSide: 'left', role: 'paddler', gender: 'male' });
  };

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

  const addToAlternatives = (member: TeamMember) => {
    if (alternativePaddlers.length >= 8) {
      alert('Maximum 8 alternative paddlers allowed');
      return;
    }
    if (!alternativePaddlers.find(m => m.id === member.id) && !currentLineup.find(m => m.id === member.id)) {
      setAlternativePaddlers(prev => [...prev, member]);
    }
  };

  const removeFromAlternatives = (id: number) => {
    setAlternativePaddlers(prev => prev.filter(member => member.id !== id));
  };

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

  const getFilteredMembers = useMemo(() => {
    return teamRoster.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      const matchesGender = filterGender === 'all' || member.gender === filterGender;
      const matchesSide = filterSide === 'all' || member.preferredSide === filterSide;
      
      return matchesSearch && matchesRole && matchesGender && matchesSide;
    });
  }, [teamRoster, searchQuery, filterRole, filterGender, filterSide]);

  const selectAll = () => {
    const newSelections = getFilteredMembers.filter(member => 
      !selectedMembers.find(m => m.id === member.id) && 
      !currentLineup.find(m => m.id === member.id) &&
      !alternativePaddlers.find(m => m.id === member.id)
    );
    setSelectedMembers(prev => [...prev, ...newSelections]);
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  const editMember = (member: TeamMember) => {
    setEditingMember({
      ...member,
      originalId: member.id
    });
  };

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

  const cancelEdit = () => {
    setEditingMember(null);
  };

  const calculateStats = (boat: Boat): BoatStats => {
    let leftWeight = 0, rightWeight = 0, frontWeight = 0, backWeight = 0, totalPaddlers = 0;
    
    boat.rows.forEach(row => {
      if (row.left) {
        leftWeight += row.left.weight;
        frontWeight += row.row <= 5 ? row.left.weight : 0;
        backWeight += row.row > 5 ? row.left.weight : 0;
        totalPaddlers++;
      }
      if (row.right) {
        rightWeight += row.right.weight;
        frontWeight += row.row <= 5 ? row.right.weight : 0;
        backWeight += row.row > 5 ? row.right.weight : 0;
        totalPaddlers++;
      }
    });

    return {
      totalPaddlers,
      leftWeight,
      rightWeight,
      weightDifference: Math.abs(leftWeight - rightWeight),
      preferencesSatisfied: calculatePreferencesSatisfied(boat),
      genderDistribution: calculateGenderDistribution(boat),
      frontBackWeight: { frontWeight, backWeight }
    };
  };

  const generateOptimalLineup = () => {
    if (currentLineup.length === 0) {
      alert('Please add members to the current lineup first!');
      return;
    }

    const paddlers = currentLineup.filter(m => m.role === 'paddler');
    const drummers = currentLineup.filter(m => m.role === 'drummer');
    const steerers = currentLineup.filter(m => m.role === 'steerer');

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
      boat.drummer = availableDrummers[0];
    }
    if (!boat.steerer && availableSteerers.length > 0) {
      boat.steerer = availableSteerers[0];
    }

    // Enhanced placement algorithm
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
      const positions: {row: number, side: 'left' | 'right', position: 'front' | 'back', rowObj: BoatRow}[] = [];
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

      const bestPosition = candidatePositions.reduce((best, current) => {
        let score = 0;
        
        // Prefer paddler's preferred side
        if (paddler.preferredSide === current.side) score += 10;
        else if (paddler.preferredSide === 'none') score += 5;

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

        return score > (best.score || 0) ? { ...current, score } : best;
      }, {} as {row: number, side: 'left' | 'right', position: 'front' | 'back', rowObj: BoatRow, score: number});

      if (bestPosition.rowObj) {
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
    malePaddlers.filter(p => !boat.rows.some(row => row.left === p || row.right === p)).forEach(paddler => {
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

  const calculatePreferencesSatisfied = (boat: Boat): number => {
    let satisfied = 0;
    let total = 0;

    boat.rows.forEach(row => {
      if (row.left) {
        total++;
        if (row.left.preferredSide === 'left' || row.left.preferredSide === 'none') {
          satisfied++;
        }
      }
      if (row.right) {
        total++;
        if (row.right.preferredSide === 'right' || row.right.preferredSide === 'none') {
          satisfied++;
        }
      }
    });

    return total > 0 ? Math.round((satisfied / total) * 100) : 0;
  };

  const calculateGenderDistribution = (boat: Boat): {male: number, female: number, neutral: number} => {
    const distribution = { male: 0, female: 0, neutral: 0 };

    boat.rows.forEach(row => {
      if (row.left) {
        distribution[row.left.gender]++;
      }
      if (row.right) {
        distribution[row.right.gender]++;
      }
    });

    return distribution;
  };

  const handleDragStart = (e: React.DragEvent, member: TeamMember) => {
    setDraggedMember(member);
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', member.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, position: string | null = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (position) {
      setDragOverPosition(position);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, position: string) => {
    e.preventDefault();
    setIsDragging(false);
    setDragOverPosition(null);
    
    if (!draggedMember || !lineup) return;

    // Handle dropping to alternatives
    if (position === 'alternatives') {
      if (alternativePaddlers.length >= 8) {
        alert('Maximum 8 alternative paddlers allowed');
        setDraggedMember(null);
        return;
      }
      
      // Remove from current positions
      const newLineup = { ...lineup };
      let found = false;
      
      newLineup.rows.forEach(row => {
        if (row.left === draggedMember) {
          row.left = null;
          found = true;
        }
        if (row.right === draggedMember) {
          row.right = null;
          found = true;
        }
      });
      
      if (newLineup.drummer === draggedMember) {
        newLineup.drummer = null;
        found = true;
      }
      
      if (newLineup.steerer === draggedMember) {
        newLineup.steerer = null;
        found = true;
      }
      
      if (found) {
        // Remove from active lineup and add to alternatives
        setCurrentLineup(prev => prev.filter(m => m.id !== draggedMember.id));
        setAlternativePaddlers(prev => {
          if (!prev.find(m => m.id === draggedMember.id)) {
            return [...prev, draggedMember];
          }
          return prev;
        });
        
        // Update lineup and remove from locked positions
        newLineup.stats = calculateStats(newLineup);
        setLineup(newLineup);
        
        setLockedPositions(prev => {
          const newLocked = { ...prev };
          Object.keys(newLocked).forEach(key => {
            if (newLocked[key] && newLocked[key].id === draggedMember.id) {
              delete newLocked[key];
            }
          });
          return newLocked;
        });
      } else {
        // Just moving from current lineup to alternatives
        setCurrentLineup(prev => prev.filter(m => m.id !== draggedMember.id));
        setAlternativePaddlers(prev => {
          if (!prev.find(m => m.id === draggedMember.id)) {
            return [...prev, draggedMember];
          }
          return prev;
        });
      }
      
      setDraggedMember(null);
      return;
    }

    // Check if position is locked
    if (lockedPositions[position]) {
      setDraggedMember(null);
      return;
    }

    // Create new lineup with the dropped member
    const newLineup = { ...lineup };
    
    // Remove member from current position
    newLineup.rows.forEach(row => {
      if (row.left === draggedMember) row.left = null;
      if (row.right === draggedMember) row.right = null;
    });
    if (newLineup.drummer === draggedMember) newLineup.drummer = null;
    if (newLineup.steerer === draggedMember) newLineup.steerer = null;

    // Add member to new position
    if (position === 'drummer') {
      newLineup.drummer = draggedMember;
    } else if (position === 'steerer') {
      newLineup.steerer = draggedMember;
    } else {
      const [rowStr, side] = position.split('-');
      const rowNum = parseInt(rowStr);
      const row = newLineup.rows.find(r => r.row === rowNum);
      if (row) {
        // If position is occupied, swap members
        const currentMember = row[side as 'left' | 'right'];
        row[side as 'left' | 'right'] = draggedMember;
        
        if (currentMember && !lockedPositions[position]) {
          // Find a place for the displaced member or move to alternatives
          let placed = false;
          
          // Try to place in their preferred side first
          if (currentMember.preferredSide !== 'none') {
            for (let r of newLineup.rows) {
              if (!r[currentMember.preferredSide as 'left' | 'right']) {
                r[currentMember.preferredSide as 'left' | 'right'] = currentMember;
                placed = true;
                break;
              }
            }
          }
          
          // If not placed, try any available position
          if (!placed) {
            for (let r of newLineup.rows) {
              if (!r.left) {
                r.left = currentMember;
                placed = true;
                break;
              } else if (!r.right) {
                r.right = currentMember;
                placed = true;
                break;
              }
            }
          }
          
          // If still not placed, move to alternatives
          if (!placed && alternativePaddlers.length < 8) {
            setAlternativePaddlers(prev => {
              if (!prev.find(m => m.id === currentMember.id)) {
                return [...prev, currentMember];
              }
              return prev;
            });
            setCurrentLineup(prev => prev.filter(m => m.id !== currentMember.id));
          }
        }
      }
    }

    // Ensure draggedMember is in currentLineup if not already
    if (!currentLineup.find(m => m.id === draggedMember.id)) {
      if (currentLineup.length < 22) {
        setCurrentLineup(prev => [...prev, draggedMember]);
      }
    }

    // Remove from alternatives if it was there
    setAlternativePaddlers(prev => prev.filter(m => m.id !== draggedMember.id));

    // Recalculate stats
    newLineup.stats = calculateStats(newLineup);
    setLineup(newLineup);
    setDraggedMember(null);
  };

  const handlePositionDrop = (draggedMember: TeamMember, targetPosition: string) => {
    if (!lineup) return;
    
    const newLineup = { ...lineup };
    const [rowStr, side] = targetPosition.split('-');
    const rowNum = parseInt(rowStr);
    
    // Find the target row
    const targetRow = newLineup.rows.find(r => r.row === rowNum);
    if (!targetRow) return;
    
    // Check if position is locked
    if (lockedPositions[targetPosition]) return;
    
    // Remove member from current position
    newLineup.rows.forEach(row => {
      if (row.left?.id === draggedMember.id) row.left = null;
      if (row.right?.id === draggedMember.id) row.right = null;
    });
    
    // Handle special positions
    if (targetPosition === 'drummer') {
      newLineup.drummer = draggedMember;
    } else if (targetPosition === 'steerer') {
      newLineup.steerer = draggedMember;
    } else if (targetRow) {
      // Place in the appropriate side
      targetRow[side as 'left' | 'right'] = draggedMember;
    }
    
    // Update lineup
    newLineup.stats = calculateStats(newLineup);
    setLineup(newLineup);
  };

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

  const clearLineup = () => {
    setLineup(null);
    setLockedPositions({});
  };

  const exportData = () => {
    const data = {
      teamRoster,
      currentLineup,
      alternativePaddlers,
      lineup,
      lockedPositions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dragonboat-lineup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

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
        
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Clear the input
    event.target.value = '';
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      setTeamRoster([]);
      setCurrentLineup([]);
      setAlternativePaddlers([]);
      setLineup(null);
      setLockedPositions({});
      setSelectedMembers([]);
    }
  };

  const MemberCard = ({ member, onEdit, onRemove, onAdd, isSelected, onToggleSelect, showAdd = true, showRemove = true, draggable = false, className = '' }: {
    member: TeamMember;
    onEdit?: (member: TeamMember) => void;
    onRemove?: (id: number) => void;
    onAdd?: (member: TeamMember) => void;
    isSelected?: boolean;
    onToggleSelect?: (member: TeamMember) => void;
    showAdd?: boolean;
    showRemove?: boolean;
    draggable?: boolean;
    className?: string;
  }) => (
    <div 
      className={`p-3 border rounded-lg transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${className} ${
        draggable ? 'cursor-move hover:shadow-md' : ''
      }`}
      draggable={draggable}
      onDragStart={draggable ? (e) => handleDragStart(e, member) : undefined}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(member)}
                className="rounded"
              />
            )}
            <div>
              <h4 className="font-medium text-sm truncate">{member.name}</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Weight: {member.weight} lbs</div>
                <div>Role: {member.role}</div>
                <div>Gender: {member.gender}</div>
                <div>Prefers: {member.preferredSide === 'none' ? 'No preference' : member.preferredSide}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          {onEdit && (
            <button
              onClick={() => onEdit(member)}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit member"
            >
              <Edit3 size={14} />
            </button>
          )}
          {showAdd && onAdd && (
            <button
              onClick={() => onAdd(member)}
              className="p-1 text-gray-500 hover:text-green-600 transition-colors"
              title="Add to lineup"
            >
              <Plus size={14} />
            </button>
          )}
          {showRemove && onRemove && (
            <button
              onClick={() => onRemove(member.id)}
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
              title="Remove"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const BoatPosition = ({ position, member, locked }: {position: string, member: TeamMember | null, locked: boolean}) => (
    <div
      className={`w-20 h-16 border-2 rounded-lg flex flex-col items-center justify-center text-xs relative transition-all ${
        member ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      } ${locked ? 'ring-2 ring-yellow-400' : ''} ${
        dragOverPosition === position ? 'scale-105 bg-blue-100 border-blue-700' : ''
      }`}
      onDragOver={(e) => handleDragOver(e, position)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, position)}
    >
      {member && (
        <>
          <div className="font-medium truncate w-full text-center px-1">{member.name}</div>
          <div className="text-gray-600">{member.weight}lb</div>
          <div 
            className={`absolute top-0 right-0 w-3 h-3 rounded-full ${
              member.gender === 'male' ? 'bg-blue-400' : 
              member.gender === 'female' ? 'bg-pink-400' : 'bg-gray-400'
            }`}
            title={member.gender}
          />
        </>
      )}
      <button
        onClick={() => toggleLockPosition(position)}
        className={`absolute bottom-0 right-0 p-0.5 rounded ${
          locked ? 'text-yellow-600' : 'text-gray-400'
        } hover:bg-white transition-colors`}
        title={locked ? 'Unlock position' : 'Lock position'}
      >
        {locked ? <Lock size={10} /> : <Unlock size={10} />}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dragon Boat Lineup Creator</h1>
          <p className="text-gray-600">Manage your team roster and create optimal boat lineups</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors"
            title="Export all data"
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
            title="Clear all data"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'roster', label: 'Team Roster', icon: Users },
            { id: 'lineup', label: 'Lineup & Boat', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Add New Member */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Add New Team Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input
                type="text"
                placeholder="Name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="number"
                placeholder="Weight (lbs)"
                value={newMember.weight}
                onChange={(e) => setNewMember({ ...newMember, weight: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
                min="70"
                max="330"
              />
              <select
                value={newMember.preferredSide}
                onChange={(e) => setNewMember({ ...newMember, preferredSide: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="none">No Preference</option>
              </select>
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="paddler">Paddler</option>
                <option value="drummer">Drummer</option>
                <option value="steerer">Steerer</option>
              </select>
              <select
                value={newMember.gender}
                onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Other</option>
              </select>
              <button
                onClick={addMember}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Edit Member Modal */}
          {editingMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="font-semibold mb-4">Edit Member</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="number"
                    placeholder="Weight (lbs)"
                    value={editingMember.weight}
                    onChange={(e) => setEditingMember({ ...editingMember, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="70"
                    max="330"
                  />
                  <select
                    value={editingMember.preferredSide}
                    onChange={(e) => setEditingMember({ ...editingMember, preferredSide: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="none">No Preference</option>
                  </select>
                  <select
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="paddler">Paddler</option>
                    <option value="drummer">Drummer</option>
                    <option value="steerer">Steerer</option>
                  </select>
                  <select
                    value={editingMember.gender}
                    onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="neutral">Other</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={saveEditedMember}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
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
              onChange={(e) => setFilterRole(e.target.value)}
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
              <option value="right">Right</option>
              <option value="none">No Preference</option>
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
                <Users size={32} className="mx-auto mb-2 text-gray-400" />
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
                <RotateCcw size={16} />
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
                  <Users size={18} />
                  Active Lineup ({currentLineup.length}/22)
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto p-1">
                  {currentLineup.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onRemove={() => removeMember(member.id, false)}
                      showAdd={false}
                      draggable={true}
                      className="cursor-move hover:shadow-md transition-shadow"
                    />
                  ))}
                  {currentLineup.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <Users size={32} className="mx-auto mb-2 text-gray-400" />
                      <p>No members in active lineup</p>
                      <p className="text-sm">Add members from the roster</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative Paddlers */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Scale size={18} />
                  Alternative Paddlers ({alternativePaddlers.length}/8)
                </h3>
                <div 
                  className="min-h-32 border-2 border-dashed border-yellow-300 bg-yellow-50 rounded-lg p-3 transition-colors"
                  onDragOver={(e) => handleDragOver(e, 'alternatives')}
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
                          className="bg-yellow-100 border-yellow-300 hover:shadow-md transition-shadow"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-yellow-700">
                      <Scale size={24} className="mx-auto mb-2" />
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
                  <Scale size={48} className="mx-auto text-gray-400 mb-4" />
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
                    
                    {/* Steerer */}
                    <div className="flex justify-center mb-4">
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1 text-gray-700">Steerer</div>
                        <BoatPosition 
                          position="steerer" 
                          member={lineup.steerer} 
                          locked={!!lockedPositions.steerer}
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
                          />
                          <div className="text-sm font-medium text-gray-600 w-12 text-center bg-white rounded px-2 py-1">
                            R{row.row}
                          </div>
                          <BoatPosition 
                            position={`${row.row}-right`} 
                            member={row.right} 
                            locked={!!lockedPositions[`${row.row}-right`]}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Drummer */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <div className="text-sm font-medium mb-1 text-gray-700">Drummer</div>
                        <BoatPosition 
                          position="drummer" 
                          member={lineup.drummer} 
                          locked={!!lockedPositions.drummer}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  {lineup.stats && (
                    <><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <Scale size={16} />
                      Weight Balance
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>Left: <span className="font-medium">{lineup.stats.leftWeight} lbs</span></div>
                      <div>Right: <span className='font-medium'>{lineup.stats.rightWeight} lbs</span></div>
                    <div className={`font-medium ${lineup.stats.weightDifference <= 20 ? 'text-green-600' : 'text-red-600'}`}>
                      Diff: {lineup.stats.weightDifference} lbs
                      {lineup.stats.weightDifference <= 20 && <span className="ml-1">✓</span>}
                    </div>
                  </div>
                </div><div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                      <Target size={16} />
                      Front/Back
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div>Front: <span className="font-medium">{lineup.stats.frontBackWeight.frontWeight} lbs</span></div>
                      <div>Back: <span className="font-medium">{lineup.stats.frontBackWeight.backWeight} lbs</span></div>
                      <div className="font-medium text-blue-600">
                        Diff: {Math.abs(lineup.stats.frontBackWeight.frontWeight - lineup.stats.frontBackWeight.backWeight)} lbs
                      </div>
                    </div>
                  </div><div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2">Preferences</h4>
                    <div className="space-y-1 text-sm">
                      <div>Satisfied: <span className="font-medium">{lineup.stats.preferencesSatisfied}%</span></div>
                      <div>Paddlers: <span className="font-medium">{lineup.stats.totalPaddlers}/20</span></div>
                      <div className={`font-medium ${lineup.stats.preferencesSatisfied >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                        {lineup.stats.preferencesSatisfied >= 80 ? 'Excellent ✓' : 'Can improve'}
                      </div>
                    </div>
                  </div><div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2">Team Mix</h4>
                    <div className="space-y-1 text-sm">
                      <div>♂ Male: <span className="font-medium">{lineup.stats.genderDistribution.male}</span></div>
                      <div>♀ Female: <span className="font-medium">{lineup.stats.genderDistribution.female}</span></div>
                      <div>⚬ Other: <span className="font-medium">{lineup.stats.genderDistribution.neutral}</span></div>
                    </div>
                  </div>
                    </div>
                  

                  {/* Instructions & Locked Positions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">💡 How to Use</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Drag paddlers from left panel to boat positions</li>
                        <li>• Click 🔒/🔓 to lock positions during regeneration</li>
                        <li>• Drag to alternatives area to bench paddlers</li>
                        <li>• Aim for weight difference &lt;20 lbs (left/right)</li>
                      </ul>
                    </div>

                    {/* Locked Positions */}
                    {Object.keys(lockedPositions).length > 0 ? (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-900 mb-2">🔒 Locked Positions ({Object.keys(lockedPositions).length})</h4>
                        <div className="text-sm space-y-1">
                          {Object.entries(lockedPositions).slice(0, 4).map(([position, member]) => (
                            <div key={position} className="text-yellow-800">
                              <span className="font-medium">
                                {position === 'drummer' ? 'Drummer' : 
                                 position === 'steerer' ? 'Steerer' : 
                                 `R${position.split('-')[0]}${position.split('-')[1][0].toUpperCase()}`}:
                              </span> {member.name}
                            </div>
                          ))}
                          {Object.keys(lockedPositions).length > 4 && (
                            <div className="text-yellow-700 text-xs">
                              ... and {Object.keys(lockedPositions).length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">🔓 No Locked Positions</h4>
                        <p className="text-sm text-gray-600">
                          Lock positions to keep specific paddlers in place when regenerating the lineup.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragonBoatLineup;