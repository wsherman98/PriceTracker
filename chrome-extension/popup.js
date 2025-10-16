const API_BASE = "https://z4ptnk59cf.execute-api.us-east-1.amazonaws.com/prod"; // your API Gateway base URL

// Get current tab URL
async function getCurrentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url;
}

// Ensure userId exists
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

// Helper to call API
async function callApi(path, body = {}, method = "POST") {
  const response = await fetch(`${API_BASE}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API ${path} failed`);
  return response.json();
}

// Track current product
async function trackProduct() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Tracking product...";

  try {
    const userId = await getOrCreateUserId();
    const productUrl = await getCurrentTabUrl();
    const trackStock = productUrl.includes("out-of-stock"); // simple heuristic

    await callApi("add-update", { userId, productUrl, trackStock });
    statusEl.textContent = "Product tracked!";
  } catch (err) {
    console.error(err);
    document.getElementById("status").textContent = "Failed to track product.";
  }
}

// Untrack current product
async function untrackProduct() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Removing product...";

  try {
    const userId = await getOrCreateUserId();
    const productUrl = await getCurrentTabUrl();

    await callApi("remove", { userId, productUrl });
    statusEl.textContent = "Product untracked!";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to untrack product.";
  }
}

// List all tracked products
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
    else items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.SK;
      listEl.appendChild(li);
    });

    statusEl.textContent = "Tracked products loaded.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to list products.";
  }
}

// Update tracking for current product
async function updateTracking() {
  const statusEl = document.getElementById("status");
  statusEl.textContent = "Updating tracking...";

  try {
    const userId = await getOrCreateUserId();
    const productUrl = await getCurrentTabUrl();
    const trackStock = productUrl.includes("out-of-stock");

    await callApi("add-update", { userId, productUrl, trackStock });
    statusEl.textContent = "Tracking updated!";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to update tracking.";
  }
}

// Event listeners
document.getElementById("track-btn").addEventListener("click", trackProduct);
document.getElementById("untrack-btn").addEventListener("click", untrackProduct);
document.getElementById("list-btn").addEventListener("click", listProducts);
document.getElementById("update-btn").addEventListener("click", updateTracking);
