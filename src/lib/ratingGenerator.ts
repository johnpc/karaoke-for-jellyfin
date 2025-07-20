import { SongRating } from "@/types";

// Grade distribution weights (higher = more likely)
const gradeWeights = {
  'A+': 5,   // Rare perfect score
  'A': 15,   // Excellent
  'A-': 20,  // Very good
  'B+': 25,  // Good
  'B': 20,   // Above average
  'B-': 10,  // Average
  'C+': 3,   // Below average
  'C': 1,    // Poor
  'C-': 0.5, // Very poor
  'D+': 0.3, // Bad
  'D': 0.1,  // Very bad
  'F': 0.1   // Terrible (very rare)
};

const gradeMessages = {
  'A+': [
    'Absolutely phenomenal!',
    'Perfect performance!',
    'Outstanding!',
    'Flawless execution!',
    'Simply amazing!'
  ],
  'A': [
    'Fantastic job!',
    'Excellent performance!',
    'Superb singing!',
    'Really impressive!',
    'Great work!'
  ],
  'A-': [
    'Very well done!',
    'Nice performance!',
    'Really good!',
    'Well executed!',
    'Solid performance!'
  ],
  'B+': [
    'Good job!',
    'Nice work!',
    'Well done!',
    'Pretty good!',
    'Good effort!'
  ],
  'B': [
    'Not bad!',
    'Decent performance!',
    'Good try!',
    'Nice attempt!',
    'Keep it up!'
  ],
  'B-': [
    'Good effort!',
    'Nice try!',
    'Keep practicing!',
    'Getting there!',
    'Room for improvement!'
  ],
  'C+': [
    'Keep trying!',
    'Practice makes perfect!',
    'You\'ll get it!',
    'Don\'t give up!',
    'Keep working at it!'
  ],
  'C': [
    'Keep practicing!',
    'You\'re learning!',
    'Don\'t stop trying!',
    'Every performance counts!',
    'Keep going!'
  ],
  'C-': [
    'Practice more!',
    'You can do better!',
    'Keep at it!',
    'Don\'t give up!',
    'Try again!'
  ],
  'D+': [
    'Keep trying!',
    'Practice helps!',
    'Don\'t quit!',
    'You\'ll improve!',
    'Keep going!'
  ],
  'D': [
    'Keep practicing!',
    'Don\'t give up!',
    'Try again!',
    'You can improve!',
    'Keep at it!'
  ],
  'F': [
    'Keep trying!',
    'Practice makes perfect!',
    'Don\'t give up!',
    'You\'ll get better!',
    'Keep singing!'
  ]
};

const gradeToScore = {
  'A+': [95, 100],
  'A': [90, 94],
  'A-': [85, 89],
  'B+': [80, 84],
  'B': [75, 79],
  'B-': [70, 74],
  'C+': [65, 69],
  'C': [60, 64],
  'C-': [55, 59],
  'D+': [50, 54],
  'D': [45, 49],
  'F': [0, 44]
};

/**
 * Generates a weighted random grade based on realistic distribution
 */
function generateWeightedGrade(): string {
  const totalWeight = Object.values(gradeWeights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [grade, weight] of Object.entries(gradeWeights)) {
    random -= weight;
    if (random <= 0) {
      return grade;
    }
  }
  
  return 'B'; // Fallback
}

/**
 * Generates a random score within the grade range
 */
function generateScoreForGrade(grade: string): number {
  const [min, max] = gradeToScore[grade as keyof typeof gradeToScore] || [70, 79];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets a random message for the given grade
 */
function getRandomMessage(grade: string): string {
  const messages = gradeMessages[grade as keyof typeof gradeMessages] || gradeMessages['B'];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Generates a random song rating with grade, score, and message
 */
export function generateRandomRating(): SongRating {
  const grade = generateWeightedGrade();
  const score = generateScoreForGrade(grade);
  const message = getRandomMessage(grade);
  
  return {
    grade,
    score,
    message
  };
}

/**
 * Generates a rating with a bias towards higher grades (for special occasions)
 */
export function generatePositiveRating(): SongRating {
  const positiveGrades = ['A+', 'A', 'A-', 'B+', 'B'];
  const grade = positiveGrades[Math.floor(Math.random() * positiveGrades.length)];
  const score = generateScoreForGrade(grade);
  const message = getRandomMessage(grade);
  
  return {
    grade,
    score,
    message
  };
}

/**
 * Generates a rating based on song duration (longer songs might get slight bonus)
 */
export function generateRatingForSong(durationSeconds: number): SongRating {
  let rating = generateRandomRating();
  
  // Slight bonus for longer songs (more effort)
  if (durationSeconds > 240) { // 4+ minutes
    const bonusChance = Math.random();
    if (bonusChance < 0.2) { // 20% chance to bump up grade
      const currentGrades = Object.keys(gradeWeights);
      const currentIndex = currentGrades.indexOf(rating.grade);
      if (currentIndex > 0) {
        const betterGrade = currentGrades[currentIndex - 1];
        rating = {
          grade: betterGrade,
          score: generateScoreForGrade(betterGrade),
          message: getRandomMessage(betterGrade)
        };
      }
    }
  }
  
  return rating;
}
