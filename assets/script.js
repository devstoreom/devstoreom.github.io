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
/* ======== صفحة المنتج ======== */
async function renderProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    qs('main').innerHTML = '<h2 style="text-align:center">المنتج غير موجود</h2>';
    return;
  }

  const products = await loadJSON('products.json');
  const product = products.find(p => p.id === productId);

  if (!product) {
    qs('main').innerHTML = '<h2 style="text-align:center">المنتج غير موجود</h2>';
    return;
  }

  // عرض بيانات المنتج
  qs('#prodImg').src = product.image;
  qs('#prodName').textContent = product.name[lang.current];
  qs('#prodPrice').textContent = `${product.price.toFixed(3)} ريال عماني`;

  // أحداث الكمية
  qs('.quantity-btn.minus').onclick = () => {
    const qtyInput = qs('#qty');
    if (qtyInput.value > 1) qtyInput.value--;
  };
  
  qs('.quantity-btn.plus').onclick = () => {
    const qtyInput = qs('#qty');
    qtyInput.value++;
  };

  // أحداث الأزرار
  qs('#addBtn').onclick = () => {
    const quantity = parseInt(qs('#qty').value) || 1;
    addToCart(product.id, quantity);
    showNotification('تمت الإضافة إلى السلة');
    renderCartCount();
  };
  
  qs('#buyBtn').onclick = () => {
    const quantity = parseInt(qs('#qty').value) || 1;
    addToCart(product.id, quantity);
    window.location.href = 'checkout.html';
  };

  renderCartCount();
}

/* ======== إشعارات ======== */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/* ======== تهيئة الصفحة عند التحميل ======== */
document.addEventListener('DOMContentLoaded', () => {
  renderCartCount();
  
  if (window.location.pathname.includes('product.html')) {
    renderProductPage();
  } else if (window.location.pathname.includes('checkout.html')) {
    renderCheckout();
  }
  
  // إضافة تأثيرات للكمية
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.target.style.transform = 'scale(0.9)';
    });
    
    btn.addEventListener('mouseup', (e) => {
      e.target.style.transform = 'scale(1)';
    });
    
    btn.addEventListener('mouseleave', (e) => {
      e.target.style.transform = 'scale(1)';
    });
  });
});
