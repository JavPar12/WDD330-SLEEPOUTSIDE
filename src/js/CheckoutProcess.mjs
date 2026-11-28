import {
  getLocalStorage,
  setLocalStorage,
  alertMessage,
  removeAllAlerts,
} from "./utils.mjs";
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

// the server sends the details of what went wrong in the body of the response;
// this turns them into a simple list of texts (whatever shape they come in)
function errorMessages(err) {
  const body = err && err.message;
  if (typeof body === "string") return [body];
  if (body && typeof body === "object") {
    const texts = Object.values(body).flatMap((value) =>
      value && typeof value === "object"
        ? Object.values(value).map(String)
        : [String(value)]
    );
    if (texts.length > 0) return texts;
  }
  return ["Something went wrong. Please try again."];
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
  // returns true when the order was accepted, false when something went wrong
  async checkout(form) {
    this.calculateOrderTotal();

    const order = formDataToJSON(form);
    order.orderDate = new Date().toISOString();
    order.orderTotal = this.orderTotal.toFixed(2);
    order.tax = this.tax.toFixed(2);
    order.shipping = this.shipping;
    order.items = packageItems(this.list);

    try {
      await services.checkout(order);
    } catch (err) {
      // stay on the form (the user keeps what was typed) and explain what happened
      removeAllAlerts();
      // each alert goes on top of the previous one, so we add them in reverse order
      errorMessages(err).reverse().forEach((message) => alertMessage(message));
      return false;
    }

    // the order went through: empty the cart and go to the success page
    setLocalStorage(this.key, []);
    window.location.assign("/checkout/success.html");
    return true;
  }
}
