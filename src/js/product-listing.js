import ExternalServices from "./ExternalServices.mjs";
import ProductList from "./ProductList.mjs";
import {
  loadHeaderFooter,
  getParam,
  formatCategory,
  escapeHtml,
  setBreadcrumb,
  qs,
} from "./utils.mjs";

const searchTerm = getParam("search");
const category = getParam("category") || "tents";

// keep the searched word in the search box after the header is loaded
loadHeaderFooter().then(() => {
  const input = qs("#search-input");
  if (input && searchTerm) input.value = searchTerm;
});

const dataSource = new ExternalServices();
const listElement = document.querySelector(".product-list");
const myList = new ProductList(category, dataSource, listElement);

async function showProducts() {
  const title = document.querySelector(".title");
  let products;
  let label;

  try {
    if (searchTerm) {
      label = `Search results: "${searchTerm}"`;
      products = await myList.init(await dataSource.searchProducts(searchTerm));
    } else {
      label = formatCategory(category);
      products = await myList.init();
    }
  } catch (error) {
    listElement.innerHTML =
      '<li class="no-results">We could not load the products.</li>';
    return;
  }

  if (title) {
    title.textContent = searchTerm ? label : `Top Products: ${label}`;
  }
  document.title = `Sleep Outside | ${label}`;

  // breadcrumb: "Tents -> (24 items)"
  setBreadcrumb(`${escapeHtml(label)} &rarr; (${products.length} items)`);
}

showProducts();

// sort by name or price
const sortSelect = qs("#sort");
if (sortSelect) {
  sortSelect.addEventListener("change", () => myList.sort(sortSelect.value));
}
