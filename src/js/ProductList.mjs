import {
  renderListWithTemplate,
  getDiscount,
  responsiveImage,
  escapeHtml,
} from "./utils.mjs";

function productCardTemplate(product, category) {
  const { percent, original } = getDiscount(product);
  const discountHtml =
    percent > 0
      ? `<p class="product-card__discount">${percent}% off</p>
      <p class="product-card__original">Was $${original.toFixed(2)}</p>`
      : "";

  // the category travels in the link so the product page can show its breadcrumb
  const productCategory = product._category || category;
  const categoryParam = productCategory ? `&category=${productCategory}` : "";

  // smaller image on small screens, medium image everywhere else
  const image = responsiveImage(product, {
    defaultKey: "PrimaryMedium",
    sources: [{ media: "(max-width: 480px)", key: "PrimarySmall" }],
  });

  return `<li class="product-card">
    <a href="/product_pages/?product=${product.Id}${categoryParam}">
      ${image}
      <h3 class="card__brand">${escapeHtml(product.Brand?.Name ?? "")}</h3>
      <h2 class="card__name">${escapeHtml(product.NameWithoutBrand ?? product.Name)}</h2>
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
    this.products = [];
  }

  // products can be passed in (search results); otherwise they come from the category
  async init(products) {
    this.products = products ?? (await this.dataSource.getData(this.category));
    this.renderList(this.products);
    return this.products;
  }

  sort(sortBy) {
    const list = [...this.products];
    const byName = (a, b) => (a.Name || "").localeCompare(b.Name || "");
    const byPrice = (a, b) => Number(a.FinalPrice) - Number(b.FinalPrice);

    if (sortBy === "name-asc") list.sort(byName);
    if (sortBy === "name-desc") list.sort((a, b) => byName(b, a));
    if (sortBy === "price-asc") list.sort(byPrice);
    if (sortBy === "price-desc") list.sort((a, b) => byPrice(b, a));

    this.renderList(list);
  }

  renderList(list) {
    if (list.length === 0) {
      this.listElement.innerHTML =
        '<li class="no-results">No products found.</li>';
      return;
    }
    renderListWithTemplate(
      (product) => productCardTemplate(product, this.category),
      this.listElement,
      list,
      "afterbegin",
      true
    );
  }
}
