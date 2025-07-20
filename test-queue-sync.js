// Test script to check queue synchronization
const fetch = require("node-fetch");

async function testQueueSync() {
  console.log("=== QUEUE SYNCHRONIZATION TEST ===\n");

  try {
    // Test 1: Check WebSocket server state
    console.log("1. WebSocket Server State:");
    const wsResponse = await fetch(
      "http://localhost:3000/debug/websocket-state",
    );
    const wsData = await wsResponse.json();
    console.log("   Session exists:", !!wsData.currentSession);
    console.log("   Queue length:", wsData.currentSession?.queueLength || 0);
    console.log("   Connected users:", wsData.connectedUsersCount);

    if (wsData.currentSession?.queue) {
      console.log("   Queue items:");
      wsData.currentSession.queue.forEach((item, i) => {
        console.log(
          `     ${i + 1}. "${item.title}" by ${item.artist} (${item.status}) - added by ${item.addedBy}`,
        );
      });
    }

    console.log("\n2. API Session Manager State:");
    // Test 2: Check API session manager state
    const apiResponse = await fetch("http://localhost:3000/api/queue");
    const apiData = await apiResponse.json();

    if (apiData.success) {
      console.log("   Session exists:", !!apiData.data.session);
      console.log("   Queue length:", apiData.data.queue?.length || 0);
      console.log(
        "   Current song:",
        apiData.data.currentSong?.mediaItem?.title || "None",
      );

      if (apiData.data.queue?.length > 0) {
        console.log("   Queue items:");
        apiData.data.queue.forEach((item, i) => {
          console.log(
            `     ${i + 1}. "${item.mediaItem.title}" by ${item.mediaItem.artist} (${item.status}) - added by ${item.addedBy}`,
          );
        });
      }
    } else {
      console.log("   Error:", apiData.error.message);
    }

    console.log("\n3. Analysis:");
    const wsQueueLength = wsData.currentSession?.queueLength || 0;
    const apiQueueLength = apiData.success
      ? apiData.data.queue?.length || 0
      : 0;

    if (wsQueueLength > 0 && apiQueueLength === 0) {
      console.log(
        "   ❌ ISSUE CONFIRMED: WebSocket has queue items but API session manager is empty",
      );
      console.log("   This explains why Host Controls shows no songs");
    } else if (wsQueueLength === apiQueueLength) {
      console.log("   ✅ Queues are synchronized");
    } else {
      console.log("   ⚠️  Queue lengths differ - possible sync issue");
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Run the test
testQueueSync();
