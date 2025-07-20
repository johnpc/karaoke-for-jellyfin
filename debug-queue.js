// Debug script to check queue state
const fetch = require('node-fetch');

async function debugQueue() {
  try {
    console.log('=== QUEUE DEBUG ===');
    
    // Check the API queue endpoint
    const response = await fetch('http://localhost:3000/api/queue');
    const data = await response.json();
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      const { queue, currentSong, session } = data.data;
      
      console.log('\n=== SESSION INFO ===');
      console.log('Session ID:', session?.id);
      console.log('Connected Users:', session?.connectedUsers?.length || 0);
      
      console.log('\n=== CURRENT SONG ===');
      if (currentSong) {
        console.log('Title:', currentSong.mediaItem.title);
        console.log('Artist:', currentSong.mediaItem.artist);
        console.log('Status:', currentSong.status);
        console.log('Added By:', currentSong.addedBy);
      } else {
        console.log('No current song');
      }
      
      console.log('\n=== QUEUE ===');
      console.log('Total items:', queue.length);
      
      const pendingItems = queue.filter(item => item.status === 'pending');
      const playingItems = queue.filter(item => item.status === 'playing');
      const completedItems = queue.filter(item => item.status === 'completed');
      const skippedItems = queue.filter(item => item.status === 'skipped');
      
      console.log('Pending:', pendingItems.length);
      console.log('Playing:', playingItems.length);
      console.log('Completed:', completedItems.length);
      console.log('Skipped:', skippedItems.length);
      
      console.log('\n=== PENDING SONGS ===');
      pendingItems.forEach((item, index) => {
        console.log(`${index + 1}. "${item.mediaItem.title}" by ${item.mediaItem.artist}`);
        console.log(`   Added by: ${item.addedBy}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Position: ${item.position}`);
        console.log('');
      });
      
      if (pendingItems.length === 0) {
        console.log('No pending songs found!');
        console.log('\n=== ALL QUEUE ITEMS ===');
        queue.forEach((item, index) => {
          console.log(`${index + 1}. "${item.mediaItem.title}" by ${item.mediaItem.artist}`);
          console.log(`   Added by: ${item.addedBy}`);
          console.log(`   Status: ${item.status}`);
          console.log(`   Position: ${item.position}`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugQueue();
