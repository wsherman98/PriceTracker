// Helper to wrap sendMessage with a Promise
function sendMessageAsync(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      resolve(response);
    });
  });
}

async function showProduct() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const product = await sendMessageAsync(tab.id, { action: "getProductData" });
    const div = document.getElementById("product");

    if (product && product.price) {
      div.textContent = `${product.title} - $${product.price}`;
    } else {
      div.textContent = "No price detected on this page.";
    }
  } catch (e) {
    console.error(e);
    document.getElementById("product").textContent = "Unable to read price from this page.";
  }
}

document.getElementById("trackBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const product = await sendMessageAsync(tab.id, { action: "getProductData" });
    if (product && product.price) {
      const stored = (await chrome.storage.local.get("products")).products || [];
      stored.push(product);
      await chrome.storage.local.set({ products: stored });
      alert(`Tracking: ${product.title} at $${product.price}`);
    } else {
      alert("Could not find a price on this page.");
    }
  } catch (e) {
    console.error(e);
    alert("Error communicating with content script.");
  }
});

// Optional: check all products now
document.getElementById("checkNowBtn").addEventListener("click", async () => {
  chrome.runtime.sendMessage({ action: "checkAllProducts" });
});

showProduct();
