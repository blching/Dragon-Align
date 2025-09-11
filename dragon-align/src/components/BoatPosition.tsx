import React from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import type { TeamMember, BoatRow } from '../types';

interface BoatPositionProps {
  position: string;
  member: TeamMember | null;
  locked: boolean;
  isDragOver: boolean;
  isHovered: boolean;
  onDragOver: (e: React.DragEvent, position: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, position: string) => void;
  onDragStart: (e: React.DragEvent, member: TeamMember, source: string, position: string) => void;
  onToggleLock: (position: string) => void;
  onRemove: (position: string, member: TeamMember) => void;
  onHover: (position: string | null) => void;
}

const BoatPosition: React.FC<BoatPositionProps> = ({
  position,
  member,
  locked,
  isDragOver,
  isHovered,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onToggleLock,
  onRemove,
  onHover
}) => {
  // Determine if this is a left or right position for side preference indicator
  const isLeftPosition = position.includes('left');
  const isRightPosition = position.includes('right');
  const isSidePosition = isLeftPosition || isRightPosition;
  
  // Check if member's preference matches the position
  let indicatorColor = '';
  let sideLetter = '';
  
  if (member && isSidePosition) {
    // Determine side letter based on preference
    if (member.preferredSide === 'left' || member.preferredSide === 'left-pref') {
      sideLetter = 'L';
    } else if (member.preferredSide === 'right' || member.preferredSide === 'right-pref') {
      sideLetter = 'R';
    } else if (member.preferredSide === 'both') {
      sideLetter = 'B';
    }
    
    // Determine color based on preference and position match
    if (member.preferredSide === 'both') {
      // Both sides - always green
      indicatorColor = 'bg-green-200 text-green-800';
    } else if (
      (isLeftPosition && (member.preferredSide === 'left' || member.preferredSide === 'left-pref')) ||
      (isRightPosition && (member.preferredSide === 'right' || member.preferredSide === 'right-pref'))
    ) {
      // On preferred side - green
      indicatorColor = 'bg-green-200 text-green-800';
    } else if (
      (isLeftPosition && (member.preferredSide === 'right' || member.preferredSide === 'right-pref')) ||
      (isRightPosition && (member.preferredSide === 'left' || member.preferredSide === 'left-pref'))
    ) {
      // On opposite side - orange
      indicatorColor = 'bg-orange-200 text-orange-800';
    }
  }
  
  return (
    <div
      className={`w-20 h-16 border-2 rounded-lg flex flex-col items-center justify-center text-xs relative transition-all ${
        member ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      } ${locked ? 'ring-2 ring-yellow-400' : ''} ${
        isDragOver ? 'scale-105 bg-blue-100 border-blue-700 ring-2 ring-blue-400' : ''
      }`}
      onDragOver={(e) => onDragOver(e, position)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, position)}
      draggable={!!member}
      onDragStart={member ? (e) => onDragStart(e, member, 'boat', position) : undefined}
      onMouseEnter={() => onHover(position)}
      onMouseLeave={() => onHover(null)}
    >
      {member ? (
        <>
          <div className="font-medium truncate w-full text-center px-1">
            {member.name}
          </div>
          <div className="text-gray-600">{member.weight}lb</div>
          <div 
            className={`absolute top-0 right-0 w-3 h-3 rounded-full ${
              member.gender === 'male' ? 'bg-blue-400' : 
              member.gender === 'female' ? 'bg-pink-400' : 'bg-gray-400'
            }`}
            title={member.gender}
          />
          
          {/* Side preference indicator */}
          {isSidePosition && (
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-tl-lg flex items-center justify-center text-xs font-bold ${indicatorColor}`}>
              {sideLetter}
            </div>
          )}
          
          <div className="absolute top-0 left-0 flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(position);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`p-0.5 rounded ${
                locked ? 'text-yellow-600' : 'text-gray-400'
              } hover:bg-white transition-colors`}
              title={locked ? 'Unlock position' : 'Lock position'}
            >
              {locked ? <Lock size={10} /> : <Unlock size={10} />}
            </button>
          </div>
          
          {/* Remove button - only show on hover */}
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(position, member);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-opacity"
              title="Remove from boat"
            >
              <X size={12} />
            </button>
          )}
        </>
      ) : (
        <>
          <div className="text-gray-400 text-xs">Empty</div>
          <div className="absolute bottom-0 right-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(position);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`p-0.5 rounded ${
                locked ? 'text-yellow-600' : 'text-gray-400'
              } hover:bg-white transition-colors`}
              title={locked ? 'Unlock position' : 'Lock position'}
            >
              {locked ? <Lock size={10} /> : <Unlock size={10} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BoatPosition;