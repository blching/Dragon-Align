import { useState, useCallback } from 'react';
import type { TeamMember, Boat } from '../types';
import { calculateStats } from '../utils/lineupCalculations';

export const useDragAndDrop = (
  teamRoster: TeamMember[],
  currentLineup: TeamMember[],
  alternativePaddlers: TeamMember[],
  lineup: Boat | null,
  setLineup: (lineup: Boat | null) => void,
  setCurrentLineup: (lineup: TeamMember[]) => void,
  setAlternativePaddlers: (paddlers: TeamMember[]) => void,
  calculateStats: (boat: Boat) => any
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, member: TeamMember, source: string, position?: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: member.id,
      source,
      position
    }));
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, position: string | null = null, section: string | null = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (position) {
      setDragOverPosition(position);
    }
    if (section) {
      setDragOverSection(section);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPosition(null);
    setDragOverSection(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetPosition: string) => {
    e.preventDefault();
    setIsDragging(false);
    setDragOverPosition(null);
    setDragOverSection(null);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { id, source, position: sourcePosition } = dragData;
      
      if (!id) return;
      
      const draggedMember = teamRoster.find(m => m.id === id) || 
                           currentLineup.find(m => m.id === id) || 
                           alternativePaddlers.find(m => m.id === id);
      
      if (!draggedMember) return;
      
      // Handle drop to alternatives
      if (targetPosition === 'alternatives') {
        // Implementation for alternatives drop
      }
      
      // Handle drop to active lineup
      if (targetPosition === 'active') {
        // Implementation for active lineup drop
      }
      
      // Handle drop to boat position
      if (targetPosition === 'drummer' || targetPosition === 'steerer' || targetPosition.includes('-')) {
        // Implementation for boat position drop
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [teamRoster, currentLineup, alternativePaddlers, lineup, setLineup, setCurrentLineup, setAlternativePaddlers, calculateStats]);

  return {
    isDragging,
    dragOverPosition,
    dragOverSection,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};