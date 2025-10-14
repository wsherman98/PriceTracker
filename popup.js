async function showProduct() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const product = await chrome.tabs.sendMessage(tab.id, { action: "getProductData" });
  const div = document.getElementById("product");

  if (product.price) {
    div.textContent = `${product.title} - $${product.price}`;
  } else {
    div.textContent = "No price detected on this page.";
  }
}

document.getElementById("trackBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const product = await chrome.tabs.sendMessage(tab.id, { action: "getProductData" });

  if (product.price) {
    const stored = (await chrome.storage.local.get("products")).products || [];
    stored.push(product);
    await chrome.storage.local.set({ products: stored });
    alert(`Tracking: ${product.title} at $${product.price}`);
  } else {
    alert("Could not find a price on this page.");
  }
});

showProduct();
