import { renderListWithTemplate } from "./utils.mjs";

// percentage saved compared with the suggested retail price (0 if no discount)
function getDiscountPercent(product) {
  const original = Number(product.SuggestedRetailPrice);
  const final = Number(product.FinalPrice);
  if (!original || !final || final >= original) return 0;
  return Math.round((1 - final / original) * 100);
}

function productCardTemplate(product) {
  const discount = getDiscountPercent(product);
  const discountHtml =
    discount > 0
      ? `<p class="product-card__discount">${discount}% off</p>
      <p class="product-card__original">Was $${Number(product.SuggestedRetailPrice).toFixed(2)}</p>`
      : "";

  return `<li class="product-card">
    <a href="/product_pages/?product=${product.Id}">
      <img src="${product.Images?.PrimaryMedium || product.Image}" alt="${product.Name}" />
      <h3 class="card__brand">${product.Brand.Name}</h3>
      <h2 class="card__name">${product.NameWithoutBrand}</h2>
      ${discountHtml}
      <p class="product-card__price">$${product.FinalPrice}</p>
    </a>
  </li>`;
}

export default class ProductList {
  constructor(category, dataSource, listElement) {
    this.category = category;
    this.dataSource = dataSource;
    this.listElement = listElement;
  }

  async init() {
    // getData() returns a promise, so we wait for the list before rendering
    const list = await this.dataSource.getData(this.category);
    this.renderList(list);
  }

  renderList(list) {
    renderListWithTemplate(productCardTemplate, this.listElement, list);
  }
}
