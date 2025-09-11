import React from 'react';
import { X } from 'lucide-react';

interface AddMemberModalProps {
  onClose: () => void;
  onSave: () => void;
  newMember: {
    name: string;
    weight: string;
    preferredSide: string;
    roles: string[];
    gender: string;
  };
  setNewMember: (member: any) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  onClose,
  onSave,
  newMember,
  setNewMember
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add New Team Member</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              placeholder="Name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
            <input
              type="number"
              placeholder="Weight (lbs)"
              value={newMember.weight}
              onChange={(e) => setNewMember({ ...newMember, weight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="70"
              max="330"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Side Preference</label>
            <select
              value={newMember.preferredSide}
              onChange={(e) => setNewMember({ ...newMember, preferredSide: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="left">Left only</option>
              <option value="left-pref">Left (preferred)</option>
              <option value="both">Both sides</option>
              <option value="right-pref">Right (preferred)</option>
              <option value="right">Right only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
            <div className="space-y-2">
              {['paddler', 'drummer', 'steerer'].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newMember.roles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewMember({
                          ...newMember,
                          roles: [...newMember.roles, role]
                        });
                      } else {
                        setNewMember({
                          ...newMember,
                          roles: newMember.roles.filter(r => r !== role)
                        });
                      }
                    }}
                    className="rounded mr-2"
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={newMember.gender}
              onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Other</option>
            </select>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Member
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

export default AddMemberModal;