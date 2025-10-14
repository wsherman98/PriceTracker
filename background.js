chrome.alarms.create("checkPrices", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "checkPrices") return;

  const { products = [] } = await chrome.storage.local.get("products");

  for (const product of products) {
    try {
      const res = await fetch(product.url);
      const html = await res.text();
      const match = html.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
      const newPrice = match ? parseFloat(match[0].replace(/[^0-9.]/g, "")) : null;

      if (newPrice && newPrice < product.price) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon128.png",
          title: "Price Drop!",
          message: `${product.title} is now $${newPrice} (was $${product.price})`
        });

        product.price = newPrice;
      }
    } catch (e) {
      console.error("Error checking price:", e);
    }
  }

  await chrome.storage.local.set({ products });
});
