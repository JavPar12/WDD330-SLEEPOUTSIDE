import { loadHeaderFooter } from "./utils.mjs";
import CheckoutProcess from "./CheckoutProcess.mjs";

loadHeaderFooter();

const order = new CheckoutProcess("so-cart", ".order-summary");
order.init();

const form = document.forms["checkout"];
const message = document.querySelector("#checkout-message");

// no items -> nothing to buy
if (order.list.length === 0) {
  form.querySelector("button[type=submit]").disabled = true;
  message.textContent =
    "Your cart is empty. Add some products before checking out.";
}

// tax, shipping and order total once the zip code is filled in
form.elements["zip"].addEventListener("blur", () =>
  order.calculateOrderTotal(),
);

// the browser only fires "submit" when every required field is valid
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "Sending your order...";
  try {
    await order.checkout(form);
    message.textContent = "Order received by the server.";
  } catch {
    message.textContent =
      "The server could not process the order. Check your data and try again.";
  }
});
