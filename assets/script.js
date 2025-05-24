/* ======== المتغيرات العامة ======== */
const storePhone = '96894390492';
const storageKey = 'dev_cart_v4';
const lang = { current: 'ar' };

/* ======== دوال مساعدة ======== */
function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

async function loadJSON(path) {
  try {
    const response = await fetch(path);
    return await response.json();
  } catch (error) {
    console.error('Error loading JSON:', error);
    showNotification('حدث خطأ في تحميل البيانات', 'error');
    return [];
  }
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch (error) {
    console.error('Error parsing cart:', error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(storageKey, JSON.stringify(cart));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function renderCartCount() {
  const badges = qsa('#cartCount');
  const count = cartCount();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ======== الصفحة الرئيسية ======== */
async function renderIndex() {
  const list = qs('#productList');
  if (!list) return;

  try {
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

    // إضافة تأثيرات hover للصور
    document.querySelectorAll('.product-image-container img').forEach(img => {
      img.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.05)';
      });
      img.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
      });
    });

    renderCartCount();
  } catch (error) {
    console.error('Error rendering index:', error);
    list.innerHTML = '<p class="error-message">حدث خطأ في تحميل المنتجات</p>';
  }
}

/* ======== صفحة المنتج ======== */
async function renderProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    qs('main').innerHTML = '<p class="error-message">المنتج غير موجود</p>';
    return;
  }

  try {
    const products = await loadJSON('products.json');
    const product = products.find(p => p.id === productId);

    if (!product) {
      qs('main').innerHTML = '<p class="error-message">المنتج غير موجود</p>';
      return;
    }

    // عرض بيانات المنتج
    qs('#prodImg').src = product.image;
    qs('#prodName').textContent = product.name[lang.current];
    qs('#prodPrice').textContent = `${product.price.toFixed(3)} ريال عماني`;
    
    if (product.description) {
      qs('#prodDescription').textContent = product.description[lang.current] || product.description['en'] || '';
    }

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
      showNotification('تمت الإضافة إلى السلة', 'success');
      renderCartCount();
    };
    
    qs('#buyBtn').onclick = () => {
      const quantity = parseInt(qs('#qty').value) || 1;
      addToCart(product.id, quantity);
      window.location.href = 'checkout.html';
    };

    renderCartCount();
  } catch (error) {
    console.error('Error rendering product:', error);
    qs('main').innerHTML = '<p class="error-message">حدث خطأ في تحميل المنتج</p>';
  }
}

/* ======== صفحة الدفع ======== */
async function renderCheckout() {
  const tableBody = qs('#orderTable');
  if (!tableBody) return;

  try {
    const cart = getCart();
    if (cart.length === 0) {
      tableBody.innerHTML = `
        <div class="empty-cart">
          <p>سلة التسوق فارغة</p>
          <a href="index.html" class="btn primary-btn">تصفح المنتجات</a>
        </div>
      `;
      qs('#payBtn').style.display = 'none';
      return;
    }

    const products = await loadJSON('products.json');
    let subtotal = 0;

    tableBody.innerHTML = '';
    cart.forEach((item, index) => {
      const product = products.find(p => p.id === item.id);
      if (!product) return;

      const itemTotal = product.price * item.qty;
      subtotal += itemTotal;

      tableBody.insertAdjacentHTML('beforeend', `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${product.image}" alt="${product.name[lang.current]}">
          </div>
          <div class="cart-item-details">
            <div class="cart-item-title">${product.name[lang.current]}</div>
            <div class="cart-item-price">${product.price.toFixed(3)} ريال</div>
          </div>
          <div class="cart-item-actions">
            <span class="cart-item-qty">${item.qty}x</span>
          </div>
        </div>
      `);
    });

    qs('#subtotalRial').textContent = subtotal.toFixed(3);
    qs('#totalRial').textContent = subtotal.toFixed(3);
    qs('#totalCredit').textContent = (subtotal / 0.8).toFixed(3);

    qs('#payBtn').onclick = finishOrder;
    renderCartCount();
  } catch (error) {
    console.error('Error rendering checkout:', error);
    tableBody.innerHTML = '<p class="error-message">حدث خطأ في تحميل سلة التسوق</p>';
  }
}

/* ======== إتمام الطلب ======== */
async function finishOrder() {
  const name = qs('#custName').value.trim();
  const phone = qs('#custPhone').value.trim();
  const paymentMethod = qs('input[name="pay"]:checked').value;
  const cart = getCart();

  // التحقق من البيانات
  if (!name || !phone) {
    showNotification('الرجاء إدخال الاسم ورقم الهاتف', 'error');
    return;
  }

  if (!/^[0-9]{8,}$/.test(phone)) {
    showNotification('رقم الهاتف غير صحيح', 'error');
    return;
  }

  try {
    const products = await loadJSON('products.json');
    let message = `*فاتورة متجر ديف*\n\n`;
    let total = 0;

    message += `*معلومات العميل*\n`;
    message += `الاسم: ${name}\n`;
    message += `الهاتف: ${phone}\n\n`;
    
    message += `*تفاصيل الطلب*\n`;
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return;

      const itemTotal = product.price * item.qty;
      total += itemTotal;

      message += `- ${product.name[lang.current]}\n`;
      message += `  الكمية: ${item.qty}\n`;
      message += `  السعر: ${product.price.toFixed(3)} ر.ع.\n`;
      message += `  الإجمالي: ${itemTotal.toFixed(3)} ر.ع.\n\n`;
    });

    message += `*المجموع الكلي*\n`;
    message += `${total.toFixed(3)} ريال عماني\n\n`;
    message += `*طريقة الدفع*\n`;
    message += `${paymentMethod === 'bank' ? 'تحويل بنكي' : 'رصيد أوريدو'}\n\n`;
    message += `شكراً لثقتكم بمتجر ديف ❤️`;

    // إرسال الرسالة
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${storePhone}?text=${encodedMessage}`, '_blank');

    // تفريغ السلة
    localStorage.removeItem(storageKey);
    setTimeout(() => window.location.href = 'index.html', 1000);
  } catch (error) {
    console.error('Error finishing order:', error);
    showNotification('حدث خطأ في إتمام الطلب', 'error');
  }
}

/* ======== إدارة السلة ======== */
function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.qty += quantity;
  } else {
    cart.push({ id: productId, qty: quantity });
  }

  saveCart(cart);
}

/* ======== الإشعارات ======== */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="icon">${type === 'success' ? '✓' : '✗'}</span>
    <span>${message}</span>
  `;
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

/* ======== تبديل اللغة ======== */
function toggleLanguage() {
  lang.current = lang.current === 'ar' ? 'en' : 'ar';
  qs('#langToggle').textContent = lang.current === 'ar' ? 'English' : 'عربي';
  qs('#storeTitle').textContent = lang.current === 'ar' ? 'متجر ديف 🛍️' : 'Dev Store 🛍️';
  
  // إعادة تحميل المحتوى حسب اللغة
  if (window.location.pathname.includes('index.html')) {
    renderIndex();
  } else if (window.location.pathname.includes('product.html')) {
    renderProductPage();
  } else if (window.location.pathname.includes('checkout.html')) {
    renderCheckout();
  }
}

/* ======== التنقل بين الصفحات ======== */
function openProduct(productId) {
  window.location.href = `product.html?id=${productId}`;
}

/* ======== تهيئة الصفحة عند التحميل ======== */
document.addEventListener('DOMContentLoaded', () => {
  renderCartCount();
  
  if (window.location.pathname.includes('index.html')) {
    renderIndex();
  } else if (window.location.pathname.includes('product.html')) {
    renderProductPage();
  } else if (window.location.pathname.includes('checkout.html')) {
    renderCheckout();
  }
  
  // إضافة تأثيرات للأزرار
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'scale(0.98)';
    });
    btn.addEventListener('mouseup', () => {
      btn.style.transform = '';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
});
