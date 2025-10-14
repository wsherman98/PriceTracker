chrome.alarms.create("checkPrices", { periodInMinutes: 1 }); // fast testing

async function checkProducts() {
  const { products = [] } = await chrome.storage.local.get("products");
  const tabs = await chrome.tabs.query({});

  for (let product of products) {
    const tab = tabs.find(t => t.url === product.url);
    if (!tab) continue;

    try {
      const result = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "getProductData" }, (res) => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
          resolve(res);
        });
      });

      if (result && result.price && result.price < product.price) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon128.png",
          title: "Price Drop!",
          message: `${product.title} is now $${result.price} (was $${product.price})`
        });

        product.price = result.price;
        await chrome.storage.local.set({ products });
      }
    } catch (e) {
      console.error("Error checking product:", e);
    }
  }
}

// Alarm-based check
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "checkPrices") checkProducts();
});

// Manual “Check Now” message from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "checkAllProducts") {
    checkProducts();
  }
});
