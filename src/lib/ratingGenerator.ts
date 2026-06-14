import { SongRating } from "@/types";
import { gradeWeights, gradeMessages, gradeToScore } from "./ratingData";

/**
 * Generates a weighted random grade based on realistic distribution
 */
function generateWeightedGrade(): string {
  const totalWeight = Object.values(gradeWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  let random = Math.random() * totalWeight;

  for (const [grade, weight] of Object.entries(gradeWeights)) {
    random -= weight;
    if (random <= 0) {
      return grade;
    }
  }

  return "B"; // Fallback
}

/**
 * Generates a random score within the grade range
 */
function generateScoreForGrade(grade: string): number {
  const [min, max] = gradeToScore[grade] || [70, 79];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets a random message for the given grade
 */
function getRandomMessage(grade: string): string {
  const messages = gradeMessages[grade] || gradeMessages["B"];
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
    message,
  };
}

/**
 * Generates a rating with a bias towards higher grades (for special occasions)
 */
export function generatePositiveRating(): SongRating {
  const positiveGrades = ["A+", "A", "A-", "B+", "B"];
  const grade =
    positiveGrades[Math.floor(Math.random() * positiveGrades.length)];
  const score = generateScoreForGrade(grade);
  const message = getRandomMessage(grade);

  return {
    grade,
    score,
    message,
  };
}

/**
 * Generates a rating based on song duration (longer songs might get slight bonus)
 */
export function generateRatingForSong(durationSeconds: number): SongRating {
  let rating = generateRandomRating();

  // Slight bonus for longer songs (more effort)
  if (durationSeconds > 240) {
    // 4+ minutes
    const bonusChance = Math.random();
    if (bonusChance < 0.2) {
      // 20% chance to bump up grade
      const currentGrades = Object.keys(gradeWeights);
      const currentIndex = currentGrades.indexOf(rating.grade);
      if (currentIndex > 0) {
        const betterGrade = currentGrades[currentIndex - 1];
        rating = {
          grade: betterGrade,
          score: generateScoreForGrade(betterGrade),
          message: getRandomMessage(betterGrade),
        };
      }
    }
  }

  return rating;
}
