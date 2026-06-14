const grades = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "F",
];

const weights = [5, 15, 20, 25, 20, 10, 3, 1, 0.5, 0.3, 0.1, 0.1];

const messages = {
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

const gradeToScore = {
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

function generateRandomRating() {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  let selectedGrade = "B";

  for (let i = 0; i < grades.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedGrade = grades[i];
      break;
    }
  }

  const [minScore, maxScore] = gradeToScore[selectedGrade];
  const score =
    Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
  const gradeMessages = messages[selectedGrade];
  const message =
    gradeMessages[Math.floor(Math.random() * gradeMessages.length)];

  return { grade: selectedGrade, score, message };
}

module.exports = { generateRandomRating };
