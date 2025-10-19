const API_BASE = "https://z4ptnk59cf.execute-api.us-east-1.amazonaws.com/prod";

// ============================
// Helpers
// ============================

// Get current active tab URL
async function getCurrentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url;
}

// Get or create userId
async function getOrCreateUserId() {
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

// Generic API helper
async function callApi(path, body = {}, method = "POST") {
  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.error || `API ${path} failed`);
    return data;
  } catch (err) {
    console.error(`API call failed: ${path}`, err);
    throw err;
  }
}

// ============================
// Button functions
// ============================

async function trackProduct() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Adding product tracking...";

  try {
    const userId = await getOrCreateUserId();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    // Get current price and stock from content script
    const { price: currentPrice, inStock: currentStockStatus } = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: "getProductInfo" }, resolve);
    });

    const trackStock = true;

    const data = await callApi("add", {
      userId,
      url,
      trackStock,
      currentPrice,
      currentStockStatus,
    });

    statusEl.textContent = data.message || "Product tracking added!";
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message || "Failed to track product.";
  }
}

async function updateProduct() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Updating product tracking...";

  try {
    const userId = await getOrCreateUserId();
    const url = await getCurrentTabUrl();
    const currentPrice = null;
    const currentStockStatus = null;

    const data = await callApi("update", { userId, url, currentPrice, currentStockStatus });
    statusEl.textContent = data.message || "Product updated!";
  } catch (err) {
    statusEl.textContent = err.message || "Failed to update product.";
  }
}

async function untrackProduct() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Removing product...";

  try {
    const userId = await getOrCreateUserId();
    const url = await getCurrentTabUrl();
    const data = await callApi("remove", { userId, url });
    statusEl.textContent = data.message || "Product untracked!";
  } catch (err) {
    statusEl.textContent = err.message || "Failed to untrack product.";
  }
}

async function listProducts() {
  const listEl = document.getElementById("product-list");
  const statusEl = document.getElementById("status");
  listEl.style.display = "block";
  listEl.innerHTML = "<li>Loading...</li>";

  try {
    const userId = await getOrCreateUserId();
    const { items } = await callApi(`list?userId=${userId}`, {}, "GET");

    listEl.innerHTML = "";
    if (!items || items.length === 0) listEl.innerHTML = "<li>No tracked products</li>";
    else items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.url;
      listEl.appendChild(li);
    });

    statusEl.textContent = "Tracked products loaded.";
  } catch (err) {
    statusEl.textContent = "Failed to list products.";
  }
}

// ============================
// Event listeners
// ============================

document.getElementById("track-btn").addEventListener("click", trackProduct);
document.getElementById("update-btn").addEventListener("click", updateProduct);
document.getElementById("untrack-btn").addEventListener("click", untrackProduct);
document.getElementById("list-btn").addEventListener("click", listProducts);
