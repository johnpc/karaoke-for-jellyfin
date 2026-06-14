// Grade distribution weights (higher = more likely)
export const gradeWeights: Record<string, number> = {
  "A+": 5, // Rare perfect score
  A: 15, // Excellent
  "A-": 20, // Very good
  "B+": 25, // Good
  B: 20, // Above average
  "B-": 10, // Average
  "C+": 3, // Below average
  C: 1, // Poor
  "C-": 0.5, // Very poor
  "D+": 0.3, // Bad
  D: 0.1, // Very bad
  F: 0.1, // Terrible (very rare)
};

export const gradeMessages: Record<string, string[]> = {
  "A+": [
    "Absolutely phenomenal!",
    "Perfect performance!",
    "Outstanding!",
    "Flawless execution!",
    "Simply amazing!",
  ],
  A: [
    "Fantastic job!",
    "Excellent performance!",
    "Superb singing!",
    "Really impressive!",
    "Great work!",
  ],
  "A-": [
    "Very well done!",
    "Nice performance!",
    "Really good!",
    "Well executed!",
    "Solid performance!",
  ],
  "B+": [
    "Good job!",
    "Nice work!",
    "Well done!",
    "Pretty good!",
    "Good effort!",
  ],
  B: [
    "Not bad!",
    "Decent performance!",
    "Good try!",
    "Nice attempt!",
    "Keep it up!",
  ],
  "B-": [
    "Good effort!",
    "Nice try!",
    "Keep practicing!",
    "Getting there!",
    "Room for improvement!",
  ],
  "C+": [
    "Keep trying!",
    "Practice makes perfect!",
    "You'll get it!",
    "Don't give up!",
    "Keep working at it!",
  ],
  C: [
    "Keep practicing!",
    "You're learning!",
    "Don't stop trying!",
    "Every performance counts!",
    "Keep going!",
  ],
  "C-": [
    "Practice more!",
    "You can do better!",
    "Keep at it!",
    "Don't give up!",
    "Try again!",
  ],
  "D+": [
    "Keep trying!",
    "Practice helps!",
    "Don't quit!",
    "You'll improve!",
    "Keep going!",
  ],
  D: [
    "Keep practicing!",
    "Don't give up!",
    "Try again!",
    "You can improve!",
    "Keep at it!",
  ],
  F: [
    "Keep trying!",
    "Practice makes perfect!",
    "Don't give up!",
    "You'll get better!",
    "Keep singing!",
  ],
};

export const gradeToScore: Record<string, [number, number]> = {
  "A+": [95, 100],
  A: [90, 94],
  "A-": [85, 89],
  "B+": [80, 84],
  B: [75, 79],
  "B-": [70, 74],
  "C+": [65, 69],
  C: [60, 64],
  "C-": [55, 59],
  "D+": [50, 54],
  D: [45, 49],
  F: [0, 44],
};
