const baseURL =
  import.meta.env.VITE_SERVER_URL ||
  "https://wdd330-backend-osp8.onrender.com/";

const CATEGORIES = ["tents", "backpacks", "sleeping-bags", "hammocks"];

// reads the body of the response first: when the server answers with an error
// (400, 500...) the body has the details, so we send them on in the error
async function convertToJson(res) {
  let jsonResponse;
  try {
    jsonResponse = await res.json();
  } catch (error) {
    jsonResponse = { message: res.statusText || "Bad Response" };
  }
  if (res.ok) {
    return jsonResponse;
  }
  throw { name: "servicesError", message: jsonResponse };
}

export default class ExternalServices {
  async getData(category) {
    const response = await fetch(`${baseURL}products/search/${category}`);
    const data = await convertToJson(response);
    return data.Result;
  }

  async findProductById(id) {
    const response = await fetch(`${baseURL}product/${id}`);
    const data = await convertToJson(response);
    return data.Result;
  }

  // looks for a word in the name, brand and color of the products of every category
  async searchProducts(term) {
    const query = (term || "").trim().toLowerCase();
    if (!query) return [];

    const settled = await Promise.allSettled(
      CATEGORIES.map(async (category) => {
        const list = await this.getData(category);
        return list.map((product) => ({ ...product, _category: category }));
      })
    );

    const seen = new Set();
    return settled
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value)
      .filter((product) => {
        const text = [
          product.Name,
          product.NameWithoutBrand,
          product.Brand?.Name,
          ...(product.Colors || []).map((color) => color.ColorName),
        ]
          .join(" ")
          .toLowerCase();
        if (!text.includes(query) || seen.has(product.Id)) return false;
        seen.add(product.Id);
        return true;
      });
  }

  // sends the order to the server (POST) and returns the server response
  async checkout(payload) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };
    const response = await fetch(`${baseURL}checkout`, options);
    return await convertToJson(response);
  }
}
