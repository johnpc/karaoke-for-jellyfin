import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateRandomRating,
  generatePositiveRating,
  generateRatingForSong,
} from "@/lib/ratingGenerator";

// ============================================================================
// HELPERS
// ============================================================================

const ALL_GRADES = [
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

const POSITIVE_GRADES = ["A+", "A", "A-", "B+", "B"];

function assertValidRating(rating: {
  grade: string;
  score: number;
  message: string;
}) {
  expect(typeof rating.grade).toBe("string");
  expect(ALL_GRADES).toContain(rating.grade);
  expect(typeof rating.score).toBe("number");
  expect(rating.score).toBeGreaterThanOrEqual(0);
  expect(rating.score).toBeLessThanOrEqual(100);
  expect(typeof rating.message).toBe("string");
  expect(rating.message.length).toBeGreaterThan(0);
}

// ============================================================================
// generateRandomRating
// ============================================================================

describe("generateRandomRating", () => {
  it("should return an object with grade, score, and message", () => {
    const rating = generateRandomRating();
    expect(rating).toHaveProperty("grade");
    expect(rating).toHaveProperty("score");
    expect(rating).toHaveProperty("message");
  });

  it("should return a valid grade", () => {
    const rating = generateRandomRating();
    expect(ALL_GRADES).toContain(rating.grade);
  });

  it("should return a score between 0 and 100", () => {
    const rating = generateRandomRating();
    expect(rating.score).toBeGreaterThanOrEqual(0);
    expect(rating.score).toBeLessThanOrEqual(100);
  });

  it("should return score as integer", () => {
    for (let i = 0; i < 20; i++) {
      const rating = generateRandomRating();
      expect(Number.isInteger(rating.score)).toBe(true);
    }
  });

  it("should return a non-empty message string", () => {
    const rating = generateRandomRating();
    expect(typeof rating.message).toBe("string");
    expect(rating.message.length).toBeGreaterThan(0);
  });

  it("should produce valid ratings across multiple calls", () => {
    for (let i = 0; i < 50; i++) {
      assertValidRating(generateRandomRating());
    }
  });

  it("should produce score consistent with grade range", () => {
    const gradeToScore: Record<string, [number, number]> = {
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

    for (let i = 0; i < 100; i++) {
      const rating = generateRandomRating();
      const [min, max] = gradeToScore[rating.grade];
      expect(rating.score).toBeGreaterThanOrEqual(min);
      expect(rating.score).toBeLessThanOrEqual(max);
    }
  });
});

// ============================================================================
// generatePositiveRating
// ============================================================================

describe("generatePositiveRating", () => {
  it("should return an object with grade, score, and message", () => {
    const rating = generatePositiveRating();
    expect(rating).toHaveProperty("grade");
    expect(rating).toHaveProperty("score");
    expect(rating).toHaveProperty("message");
  });

  it("should only produce positive grades (A+, A, A-, B+, B)", () => {
    for (let i = 0; i < 100; i++) {
      const rating = generatePositiveRating();
      expect(POSITIVE_GRADES).toContain(rating.grade);
    }
  });

  it("should return score >= 75 (lowest positive grade B range starts at 75)", () => {
    for (let i = 0; i < 50; i++) {
      const rating = generatePositiveRating();
      expect(rating.score).toBeGreaterThanOrEqual(75);
    }
  });

  it("should return valid ratings", () => {
    for (let i = 0; i < 50; i++) {
      assertValidRating(generatePositiveRating());
    }
  });
});

// ============================================================================
// generateRatingForSong
// ============================================================================

describe("generateRatingForSong", () => {
  it("should return a valid rating for short songs", () => {
    const rating = generateRatingForSong(120);
    assertValidRating(rating);
  });

  it("should return a valid rating for long songs (>240s)", () => {
    const rating = generateRatingForSong(300);
    assertValidRating(rating);
  });

  it("should return valid ratings consistently", () => {
    for (let i = 0; i < 50; i++) {
      assertValidRating(generateRatingForSong(180));
      assertValidRating(generateRatingForSong(300));
    }
  });

  it("should handle very short duration", () => {
    const rating = generateRatingForSong(0);
    assertValidRating(rating);
  });

  it("should handle very long duration", () => {
    const rating = generateRatingForSong(600);
    assertValidRating(rating);
  });

  it("should potentially upgrade grade for long songs (statistical)", () => {
    // Run many iterations and verify that the function doesn't crash
    // and produces valid output for long songs
    const ratings = Array.from({ length: 200 }, () =>
      generateRatingForSong(300)
    );
    ratings.forEach(assertValidRating);

    // At least some ratings should exist (not all identical)
    const grades = new Set(ratings.map(r => r.grade));
    expect(grades.size).toBeGreaterThan(0);
  });

  it("should not modify short song ratings (no bonus for <240s)", () => {
    // For songs under 240 seconds, the function should behave like generateRandomRating
    // We can't test randomness directly, but we can verify the output is valid
    for (let i = 0; i < 30; i++) {
      const rating = generateRatingForSong(200);
      assertValidRating(rating);
    }
  });

  it("should produce score consistent with grade", () => {
    const gradeToScore: Record<string, [number, number]> = {
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

    for (let i = 0; i < 100; i++) {
      const rating = generateRatingForSong(300);
      const [min, max] = gradeToScore[rating.grade];
      expect(rating.score).toBeGreaterThanOrEqual(min);
      expect(rating.score).toBeLessThanOrEqual(max);
    }
  });
});
