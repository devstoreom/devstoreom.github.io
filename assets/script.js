async function renderIndex() {
  const list = qs('#productList');
  if (!list) return;

  const products = await loadJSON('products.json');
  list.innerHTML = '';

  products.forEach(product => {
    list.insertAdjacentHTML('beforeend', `
      <div class="product" onclick="openProduct('${product.id}')">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name[lang.current]}" loading="lazy">
        </div>
        <div class="product-info">
          <h3>${product.name[lang.current]}</h3>
          <p class="price">${product.price.toFixed(3)} ريال عماني</p>
        </div>
      </div>
    `);
  });

  renderCartCount();
}
