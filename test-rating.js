// Quick test of the rating generator
const { generateRandomRating, generateRatingForSong } = require('./src/lib/ratingGenerator.ts');

console.log('Testing rating generator...');

// Test random ratings
console.log('\n5 Random ratings:');
for (let i = 0; i < 5; i++) {
  const rating = generateRandomRating();
  console.log(`${rating.grade} (${rating.score}/100) - ${rating.message}`);
}

// Test song-based ratings
console.log('\n5 Song-based ratings (short song):');
for (let i = 0; i < 5; i++) {
  const rating = generateRatingForSong(180); // 3 minutes
  console.log(`${rating.grade} (${rating.score}/100) - ${rating.message}`);
}

console.log('\n5 Song-based ratings (long song):');
for (let i = 0; i < 5; i++) {
  const rating = generateRatingForSong(300); // 5 minutes
  console.log(`${rating.grade} (${rating.score}/100) - ${rating.message}`);
}
