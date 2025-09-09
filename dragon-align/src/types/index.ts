export interface TeamMember {
  id: number;
  name: string;
  weight: number;
  preferredSide: 'left' | 'left-pref' | 'both' | 'right-pref' | 'right';
  roles: ('paddler' | 'drummer' | 'steerer')[];
  gender: 'male' | 'female' | 'neutral';
}

export interface BoatRow {
  row: number;
  left: TeamMember | null;
  right: TeamMember | null;
}

export interface Boat {
  rows: BoatRow[];
  drummer: TeamMember | null;
  steerer: TeamMember | null;
  stats?: BoatStats;
}

export interface BoatStats {
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

export interface Roster {
  id: string;
  name: string;
  description?: string;
  type: 'master' | 'practice' | 'event' | 'other';
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedLineup {
  id: string;
  name: string;
  tag: 'Practice' | 'Race' | 'Other';
  folder?: string;
  description?: string;
  data: {
    currentLineup: TeamMember[];
    alternativePaddlers: TeamMember[];
    lineup: Boat | null;
    lockedPositions: Record<string, TeamMember>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  type: 'lineup' | 'roster';
  parentId?: string;
}