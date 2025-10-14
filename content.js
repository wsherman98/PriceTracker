function getProductData() {
  const title = document.querySelector("h1")?.innerText || document.title || "Unknown product";
  const priceText = document.body.innerText.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
  const price = priceText ? parseFloat(priceText[0].replace(/[^0-9.]/g, "")) : null;
  return { title, price, url: window.location.href };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getProductData") {
    sendResponse(getProductData());
  }
});
