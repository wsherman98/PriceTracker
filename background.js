chrome.alarms.create("checkPrices", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "checkPrices") return;

  const { products = [] } = await chrome.storage.local.get("products");

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    try {
      // Open hidden tab to access DOM for dynamic prices
      chrome.tabs.create({ url: product.url, active: false }, (tab) => {
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ["content.js"] },
          async (results) => {
            if (results && results[0] && results[0].result) {
              const newPrice = results[0].result.price;

              if (newPrice && newPrice < product.price) {
                chrome.notifications.create({
                  type: "basic",
                  iconUrl: "icon128.png",
                  title: "Price Drop!",
                  message: `${product.title} is now $${newPrice} (was $${product.price})`
                });

                product.price = newPrice;
                await chrome.storage.local.set({ products });
              }
            }
            chrome.tabs.remove(tab.id);
          }
        );
      });
    } catch (e) {
      console.error("Error checking price:", e);
    }
  }
});
