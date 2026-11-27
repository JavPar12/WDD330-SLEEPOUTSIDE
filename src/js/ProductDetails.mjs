import { setLocalStorage, getLocalStorage, updateCartCount } from "./utils.mjs";

export default class ProductDetails {
  constructor(productId, dataSource) {
    this.productId = productId;
    this.product = {};
    this.dataSource = dataSource;
  }

  async init() {
    // the product details are needed before rendering the HTML
    try {
      this.product = await this.dataSource.findProductById(this.productId);
    } catch (error) {
      this.product = null;
    }

    if (!this.product) {
      this.renderNotFound();
      return;
    }

    this.renderProductDetails();
    document.title = `Sleep Outside | ${this.product.Name}`;

    // the button only exists after the HTML is rendered
    document
      .getElementById("addToCart")
      .addEventListener("click", this.addProductToCart.bind(this));
  }

  addProductToCart() {
    const rawCart = getLocalStorage("so-cart");
    const cartItems = (Array.isArray(rawCart) ? rawCart : []).filter(Boolean);

    // same product again -> just increase its quantity
    const existing = cartItems.find((item) => item.Id === this.product.Id);
    if (existing) {
      existing.Quantity = (Number(existing.Quantity) || 1) + 1;
    } else {
      cartItems.push({ ...this.product, Quantity: 1 });
    }

    setLocalStorage("so-cart", cartItems);
    updateCartCount();
  }

  renderProductDetails() {
    const detail = document.querySelector(".product-detail");
    const p = this.product;
    const image = p.Images?.PrimaryLarge || p.Image;
    detail.innerHTML = `
      <h3>${p.Brand?.Name ?? ""}</h3>
      <h2 class="divider">${p.NameWithoutBrand ?? p.Name}</h2>
      <img class="divider" src="${image}" alt="${p.Name}" />
      <p class="product-card__price">$${p.FinalPrice}</p>
      <p class="product__color">${p.Colors?.[0]?.ColorName ?? ""}</p>
      <p class="product__description">${p.DescriptionHtmlSimple ?? ""}</p>
      <div class="product-detail__add">
        <button id="addToCart" data-id="${p.Id}">Add to Cart</button>
      </div>`;
  }

  renderNotFound() {
    const detail = document.querySelector(".product-detail");
    if (detail) {
      detail.innerHTML = `<h2>Product not found</h2>
        <p>We could not find a product with id "${this.productId}".
        <a href="/index.html">Back to home</a></p>`;
    }
  }
}
