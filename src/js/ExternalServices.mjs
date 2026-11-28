const baseURL =
  import.meta.env.VITE_SERVER_URL ||
  "https://wdd330-backend-osp8.onrender.com/";

const CATEGORIES = ["tents", "backpacks", "sleeping-bags", "hammocks"];

function convertToJson(res) {
  if (res.ok) {
    return res.json();
  } else {
    throw new Error("Bad Response");
  }
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
    const data = await response.json();
    if (response.ok) {
      return data;
    }
    // keep the server message so the page can show it
    throw { name: "servicesError", message: data };
  }
}
