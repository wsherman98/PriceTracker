// ============================
// background.js
// Manages WebSocket connection + notifications
// Compatible with add/update Lambda endpoints
// ============================

let ws;
let userId = "";

// Initialize WebSocket connection
async function initWebSocket() {
  userId = await getOrCreateUserId();
  connectWebSocket();
}

// Retrieve or create userId (persistent)
function getOrCreateUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["userId"], (result) => {
      if (result.userId) resolve(result.userId);
      else {
        const newUserId = crypto.randomUUID();
        chrome.storage.local.set({ userId: newUserId }, () => resolve(newUserId));
      }
    });
  });
}

// Reconnect WebSocket if userId changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.userId) {
    userId = changes.userId.newValue;
    connectWebSocket();
  }
});

// Connect WebSocket
function connectWebSocket() {
  if (!userId) return;

  // Clean up any existing socket
  if (ws) {
    ws.onclose = null;
    ws.close();
  }

  // ✅ Use your deployed WebSocket endpoint
  const WS_URL = `wss://07aq8oq6zj.execute-api.us-east-1.amazonaws.com/production?userId=${userId}`;
  ws = new WebSocket(WS_URL);

  ws.onopen = () => console.log("✅ WebSocket connected");

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      console.error("❌ Invalid WebSocket message:", event.data);
      return;
    }

    // ✅ Notification logic
    if (msg.type === "notify" && msg.url) {
      const notificationOptions = {
        type: "basic",
        title: "Product Update",
        message: msg.message || "Your tracked product has changed.",
        iconUrl: "icons/icon128.png",
      };

      chrome.notifications.create("", notificationOptions, (notificationId) => {
        const handleClick = (clickedId) => {
          if (clickedId === notificationId) {
            chrome.tabs.create({ url: msg.url });
            chrome.notifications.clear(notificationId);
          }
        };

        // Remove any previous listeners to avoid duplicates
        chrome.notifications.onClicked.removeListener(handleClick);
        chrome.notifications.onClicked.addListener(handleClick);
      });
    }
  };

  ws.onclose = () => {
    console.warn("⚠️ WebSocket closed, retrying in 3s...");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
    ws.close();
  };
}

// Start everything
initWebSocket();
