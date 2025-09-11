import type { Boat, TeamMember, BoatStats } from '../types';

export const initializeBoat = (): Boat => {
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

export const calculateStats = (boat: Boat): BoatStats => {
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

const calculatePreferencesSatisfied = (boat: Boat): number => {
  let satisfied = 0;
  let total = 0;

  boat.rows.forEach(row => {
    if (row.left) {
      total++;
      if (row.left.preferredSide === 'left' || row.left.preferredSide === 'left-pref' || 
          row.left.preferredSide === 'both' || row.left.preferredSide === 'right-pref') {
        satisfied++;
      }
    }
    if (row.right) {
      total++;
      if (row.right.preferredSide === 'right' || row.right.preferredSide === 'right-pref' || 
          row.right.preferredSide === 'both' || row.right.preferredSide === 'left-pref') {
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