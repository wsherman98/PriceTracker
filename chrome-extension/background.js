// ============================
// background.js
// ============================

let ws;
let userId = "";

// Get or create userId and connect WebSocket
async function initWebSocket() {
  userId = await getOrCreateUserId();
  connectWebSocket();
}

// Generate or retrieve userId
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

// Listen for changes to userId (from popup)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.userId) {
    userId = changes.userId.newValue;
    connectWebSocket(); // reconnect with new userId
  }
});

// Connect to WebSocket API
function connectWebSocket() {
  if (!userId) return;

  // Close existing WS safely
  if (ws) {
    ws.onclose = null;
    ws.close();
  }

  // Replace with your deployed WebSocket API
  const WS_URL = `wss://07aq8oq6zj.execute-api.us-east-1.amazonaws.com/production?userId=${userId}`;
  ws = new WebSocket(WS_URL);

  ws.onopen = () => console.log("WebSocket connected");

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      console.error("Invalid JSON from WebSocket:", event.data);
      return;
    }

    if (msg.type === "notify" && msg.productUrl) {
      const notificationOptions = {
        type: "basic",
        title: "Product Update",
        message: msg.message,
        iconUrl: "icons/icon128.png"
      };

      chrome.notifications.create("", notificationOptions, (notificationId) => {
        function handleClick(clickedId) {
          if (clickedId === notificationId) {
            chrome.tabs.create({ url: msg.productUrl });
            chrome.notifications.clear(notificationId);
          }
        }

        // Remove previous listeners to prevent duplicates
        chrome.notifications.onClicked.removeListener(handleClick);
        chrome.notifications.onClicked.addListener(handleClick);
      });
    }
  };

  ws.onclose = () => {
    console.log("WebSocket closed, reconnecting in 3s...");
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    ws.close();
  };
}

// Initialize on background start
initWebSocket();
