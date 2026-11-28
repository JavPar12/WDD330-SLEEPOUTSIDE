import { loadHeaderFooter } from "./utils.mjs";
import CheckoutProcess from "./CheckoutProcess.mjs";

loadHeaderFooter();

const order = new CheckoutProcess("so-cart", ".order-summary");
order.init();

const form = document.forms["checkout"];
const submitButton = form.querySelector("button[type=submit]");
const message = document.querySelector("#checkout-message");
const expiration = form.elements["expiration"];

// no items -> nothing to buy
if (order.list.length === 0) {
  submitButton.disabled = true;
  message.textContent =
    "Your cart is empty. Add some products before checking out.";
}

// the card must not be expired (MM/YY is valid until the end of that month)
function checkExpiration() {
  const match = /^(0?[1-9]|1[0-2])\/(\d{2})$/.exec(expiration.value.trim());
  if (!match) {
    expiration.setCustomValidity("");
    return; // the pattern attribute reports the wrong format
  }
  const endOfMonth = new Date(
    2000 + Number(match[2]),
    Number(match[1]),
    0,
    23,
    59,
    59,
  );
  expiration.setCustomValidity(
    endOfMonth < new Date() ? "This card has expired." : "",
  );
}
expiration.addEventListener("input", checkExpiration);

// tax, shipping and order total once the zip code is filled in
form.elements["zip"].addEventListener("blur", () =>
  order.calculateOrderTotal(),
);

// the browser fires "submit" only when every field is valid,
// but we check again in case that did not happen
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  checkExpiration();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  submitButton.disabled = true; // avoid sending the order twice
  message.textContent = "Sending your order...";
  const accepted = await order.checkout(form);
  if (!accepted) {
    submitButton.disabled = false;
    message.textContent = "";
  }
});
