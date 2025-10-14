function getProductData() {
  const url = window.location.href;
  const host = window.location.hostname;

  let title = document.querySelector("h1")?.innerText || document.title || "Unknown product";
  let price = null;

  if (host.includes("amazon.com")) {
    price = document.querySelector(".a-price .a-offscreen")?.innerText;
  } else if (host.includes("walmart.com")) {
    price = document.querySelector("[data-testid='price'] span")?.innerText;
  } else if (host.includes("target.com")) {
    price = document.querySelector("[data-test='product-price']")?.innerText;
  } else {
    const priceText = document.body.innerText.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
    price = priceText ? priceText[0] : null;
  }

  if (price) price = parseFloat(price.replace(/[^0-9.]/g, ""));
  return { title, price, url, host };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getProductData") {
    sendResponse(getProductData());
  }
});
