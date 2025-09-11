import React, { useState } from 'react';
import { X } from 'lucide-react';
import { type Roster } from '../types';

interface MembercardProps {
    
}

const MemberCard = ({ member, onEdit, onRemove, onAdd, isSelected, onToggleSelect, showAdd = true, showRemove = true, draggable = false, className = '', source = 'roster' }: {
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
      source?: string;
    }) => (
      <div 
        className={`p-3 border rounded-lg transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${className} ${
          draggable ? 'cursor-grab hover:shadow-md active:cursor-grabbing' : ''
        }`}
        draggable={draggable}
        onDragStart={draggable ? (e) => handleDragStart(e, member, source) : undefined}
        onDragEnd={() => {
          setIsDragging(false);
          setDragOverSection(null);
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {onToggleSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect && onToggleSelect(member)}
                  className="rounded"
                />
              )}
              <div className="flex items-center gap-1">
                <GripVertical size={14} className="text-gray-400" />
                <div>
                  <h4 className="font-medium text-sm truncate">{member.name}</h4>
                  <div className="text-xs text-gray-600 space-y-1 ">
                    <div>Weight: {member.weight} lbs</div>
                    <div> {member.roles?.join(', ') || 'No roles specified'}</div>
                    <div>Gender: {member.gender}</div>
                    <div>
                      {
                        member.preferredSide === 'left' ? 'Left only' :
                        member.preferredSide === 'left-pref' ? 'Left (preferred)' :
                        member.preferredSide === 'both' ? 'Both sides' :
                        member.preferredSide === 'right-pref' ? 'Right (preferred)' :
                        'Right only'
                      }
                    </div>
                  </div>
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