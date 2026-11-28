import { getLocalStorage } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

const services = new ExternalServices();

const TAX_RATE = 0.06; // 6% sales tax
const FIRST_ITEM_SHIPPING = 10; // $10 for the first item
const EXTRA_ITEM_SHIPPING = 2; // $2 for each additional item

// takes the items stored in the cart (localStorage) and returns them in the simplified form the server expects
function packageItems(items) {
  return items.map((item) => ({
    id: item.Id,
    name: item.Name,
    price: item.FinalPrice,
    quantity: Number(item.Quantity) || 1,
  }));
}

// turns the data of a form into a plain object (keys = the "name" of each input)
function formDataToJSON(formElement) {
  const formData = new FormData(formElement);
  const convertedJSON = {};
  formData.forEach((value, key) => {
    convertedJSON[key] = value;
  });
  return convertedJSON;
}

export default class CheckoutProcess {
  constructor(key, outputSelector) {
    this.key = key;
    this.outputSelector = outputSelector;
    this.list = [];
    this.itemCount = 0;
    this.itemTotal = 0;
    this.shipping = 0;
    this.tax = 0;
    this.orderTotal = 0;
  }

  init() {
    const stored = getLocalStorage(this.key);
    this.list = (Array.isArray(stored) ? stored : []).filter(Boolean);
    this.calculateItemSubTotal();
  }

  // number of items and subtotal of the cart (called when the page loads)
  calculateItemSubTotal() {
    this.itemCount = this.list.reduce(
      (count, item) => count + (Number(item.Quantity) || 1),
      0
    );
    this.itemTotal = this.list.reduce(
      (sum, item) =>
        sum + Number(item.FinalPrice) * (Number(item.Quantity) || 1),
      0
    );

    const summary = document.querySelector(`${this.outputSelector} #cartTotal`);
    const count = document.querySelector(`${this.outputSelector} #num-items`);
    if (summary) summary.textContent = `$${this.itemTotal.toFixed(2)}`;
    if (count) count.textContent = this.itemCount;
  }

  // tax, shipping and order total (called after the user fills in the zip code)
  calculateOrderTotal() {
    this.tax = this.itemTotal * TAX_RATE;
    this.shipping =
      this.itemCount > 0
        ? FIRST_ITEM_SHIPPING + (this.itemCount - 1) * EXTRA_ITEM_SHIPPING
        : 0;
    this.orderTotal = this.itemTotal + this.tax + this.shipping;
    this.displayOrderTotals();
  }

  displayOrderTotals() {
    const tax = document.querySelector(`${this.outputSelector} #tax`);
    const shipping = document.querySelector(`${this.outputSelector} #shipping`);
    const orderTotal = document.querySelector(
      `${this.outputSelector} #orderTotal`
    );
    if (tax) tax.textContent = `$${this.tax.toFixed(2)}`;
    if (shipping) shipping.textContent = `$${this.shipping.toFixed(2)}`;
    if (orderTotal) orderTotal.textContent = `$${this.orderTotal.toFixed(2)}`;
  }

  // builds the order object and sends it to the server
  async checkout(form) {
    this.calculateOrderTotal();

    const order = formDataToJSON(form);
    order.orderDate = new Date().toISOString();
    order.orderTotal = this.orderTotal.toFixed(2);
    order.tax = this.tax.toFixed(2);
    order.shipping = this.shipping;
    order.items = packageItems(this.list);

    return await services.checkout(order);
  }
}
