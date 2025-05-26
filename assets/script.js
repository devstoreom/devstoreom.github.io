document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("product-list");
  const productDetail = document.getElementById("product-detail");

  fetch("products.json")
    .then(response => response.json())
    .then(products => {
      if (productList) {
        products.forEach(product => {
          const div = document.createElement("div");
          div.innerHTML = `
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <img src="${product.image}" alt="${product.name}" width="200">
            <p>Price: $${product.price}</p>
            <a href="product.html?id=${product.id}">View</a>
          `;
          productList.appendChild(div);
        });
      }

      if (productDetail) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("id");
        const product = products.find(p => p.id == id);

        if (product) {
          productDetail.innerHTML = `
            <h2>${product.name}</h2>
            <img src="${product.image}" alt="${product.name}" width="300">
            <p>${product.description}</p>
            <p>Price: $${product.price}</p>
          `;
        } else {
          productDetail.innerHTML = "<p>Product not found.</p>";
        }
      }
    })
    .catch(error => {
      console.error("Error loading products:", error);
      if (productList) productList.innerHTML = "<p>Failed to load products.</p>";
      if (productDetail) productDetail.innerHTML = "<p>Failed to load product details.</p>";
    });
});
