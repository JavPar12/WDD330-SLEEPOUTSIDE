import {
  setLocalStorage,
  getLocalStorage,
  updateCartCount,
  getParam,
  getDiscount,
  responsiveImage,
  formatCategory,
  escapeHtml,
  setBreadcrumb,
  alertMessage,
  removeAllAlerts,
} from "./utils.mjs";

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
    this.renderBreadcrumb();
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

    // feedback for the user
    removeAllAlerts();
    alertMessage(
      `${this.product.NameWithoutBrand ?? this.product.Name} was added to your cart.`,
      true,
      "success"
    );
  }

  renderProductDetails() {
    const detail = document.querySelector(".product-detail");
    const p = this.product;
    const { percent, amount } = getDiscount(p);

    // the image changes with the screen width
    const image = responsiveImage(p, {
      defaultKey: "PrimaryMedium",
      sources: [
        { media: "(min-width: 1000px)", key: "PrimaryExtraLarge" },
        { media: "(min-width: 500px)", key: "PrimaryLarge" },
      ],
    });

    const discountFlag =
      percent > 0
        ? `<p class="product-detail__discount">Save $${amount.toFixed(2)} (${percent}% off)</p>`
        : "";

    detail.innerHTML = `
      <h3>${p.Brand?.Name ?? ""}</h3>
      <h2 class="divider">${p.NameWithoutBrand ?? p.Name}</h2>
      ${image}
      <p class="product-card__price">$${p.FinalPrice}</p>
      ${discountFlag}
      <p class="product__color">${p.Colors?.[0]?.ColorName ?? ""}</p>
      <p class="product__description">${p.DescriptionHtmlSimple ?? ""}</p>
      <div class="product-detail__add">
        <button id="addToCart" data-id="${p.Id}">Add to Cart</button>
      </div>`;
  }

  // "Tents" (link back to the list) when we know the category of the product
  renderBreadcrumb() {
    const category = getParam("category");
    if (!category) {
      setBreadcrumb("");
      return;
    }
    setBreadcrumb(
      `<a href="/product_listing/index.html?category=${encodeURIComponent(category)}">${escapeHtml(formatCategory(category))}</a>`
    );
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
