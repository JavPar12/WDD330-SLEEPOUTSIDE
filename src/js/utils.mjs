// wrapper for querySelector...returns matching element
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

// retrieve data from localstorage
export function getLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

// save data to local storage
export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// set a listener for both touchend and click
export function setClick(selector, callback) {
  qs(selector).addEventListener("touchend", (event) => {
    event.preventDefault();
    callback();
  });
  qs(selector).addEventListener("click", callback);
}

// get URL parameter
export function getParam(param) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(param);
}

// render a list of items with a template function
export function renderListWithTemplate(
  templateFn,
  parentElement,
  list,
  position = "afterbegin",
  clear = false
) {
  if (!parentElement) return;
  if (clear) {
    parentElement.innerHTML = "";
  }
  const htmlStrings = list.map(templateFn);
  parentElement.insertAdjacentHTML(position, htmlStrings.join(""));
}

// update cart item count badge if present
export function updateCartCount() {
  const cartItems = getLocalStorage("so-cart") || [];
  const list = (Array.isArray(cartItems) ? cartItems : [cartItems]).filter(Boolean);
  const totalCount = list.reduce(
    (sum, item) => sum + (Number(item?.Quantity) || 1),
    0
  );
  const badge = document.querySelector(".cart-count");
  if (badge) {
    badge.textContent = totalCount;
  }
}

// render ONE template into a parent element (callback is optional)
export function renderWithTemplate(template, parentElement, data, callback) {
  if (!parentElement) return;
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }
}

// fetch an html file (partial) and return its content as a string
export async function loadTemplate(path) {
  const response = await fetch(path);
  const template = await response.text();
  return template;
}

// load the shared header and footer into every page
export async function loadHeaderFooter() {
  const headerTemplate = await loadTemplate("/partials/header.html");
  const footerTemplate = await loadTemplate("/partials/footer.html");

  const headerElement = qs("#main-header");
  const footerElement = qs("#main-footer");

  // the callback keeps the cart counter working after the header is rendered
  renderWithTemplate(headerTemplate, headerElement, null, updateCartCount);
  renderWithTemplate(footerTemplate, footerElement);
}

// "sleeping-bags" -> "Sleeping Bags"
export function formatCategory(category = "") {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// how much a product is discounted compared with its suggested retail price
export function getDiscount(product) {
  const original = Number(product.SuggestedRetailPrice);
  const final = Number(product.FinalPrice);
  if (!original || !final || final >= original) {
    return { percent: 0, amount: 0, original: 0 };
  }
  return {
    percent: Math.round((1 - final / original) * 100),
    amount: original - final,
    original,
  };
}

// <picture> that shows a different image size depending on the screen width.
// sources: [{ media: "(min-width: 1000px)", key: "PrimaryExtraLarge" }, ...]
// (the first matching source wins, so list the widest first)
export function responsiveImage(product, { defaultKey, sources = [] }, alt) {
  const images = product.Images || {};
  const fallback =
    images[defaultKey] ||
    images.PrimaryMedium ||
    images.PrimaryLarge ||
    product.Image ||
    "";
  const sourceTags = sources
    .filter(({ key }) => images[key])
    .map(({ media, key }) => `<source media="${media}" srcset="${images[key]}" />`)
    .join("");
  return `<picture>${sourceTags}<img src="${fallback}" alt="${escapeHtml(alt ?? product.Name)}" /></picture>`;
}

// shows (or hides, when html is empty) the breadcrumb under the header
export function setBreadcrumb(html = "") {
  const nav = qs("#breadcrumb");
  if (!nav) return;
  nav.innerHTML = html;
  nav.hidden = !html;
}
