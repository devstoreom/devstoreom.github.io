/* ======== المتغيرات العامة ======== */
const storePhone = '96894390492';
const storageKey = 'dev_cart_v3';
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
    return [];
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem(storageKey) || [];
}

function saveCart(cart) {
  localStorage.setItem(storageKey, JSON.stringify(cart));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function renderCartCount() {
  const badges = qsa('#cartCount');
  badges.forEach(badge => {
    badge.textContent = cartCount() || '';
    badge.style.display = cartCount() > 0 ? 'flex' : 'none';
  });
}

/* ======== الصفحة الرئيسية ======== */
async function renderIndex() {
  const list = qs('#productList');
  if (!list) return;

  const products = await loadJSON('products.json');
  list.innerHTML = '';

  products.forEach(product => {
    list.insertAdjacentHTML('beforeend', `
      <div class="product" onclick="openProduct('${product.id}')">
        <img src="${product.image}" alt="${product.name[lang.current]}">
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

  // أحداث الأزرار
  qs('#addBtn').onclick = () => {
    const quantity = parseInt(qs('#qty').value) || 1;
    addToCart(product.id, quantity);
    alert(lang.current === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart');
    renderCartCount();
  };

  qs('#buyBtn').onclick = () => {
    const quantity = parseInt(qs('#qty').value) || 1;
    addToCart(product.id, quantity);
    window.location.href = 'checkout.html';
  };

  renderCartCount();
}

/* ======== صفحة الدفع ======== */
async function renderCheckout() {
  const tableBody = qs('#orderTable');
  if (!tableBody) return;

  const cart = getCart();
  if (cart.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">السلة فارغة</td></tr>';
    return;
  }

  const products = await loadJSON('products.json');
  let total = 0;

  tableBody.innerHTML = '';
  cart.forEach((item, index) => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const subtotal = product.price * item.qty;
    total += subtotal;

    tableBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${index + 1}</td>
        <td>${product.name[lang.current]}</td>
        <td>${item.qty}</td>
        <td>${product.price.toFixed(3)}</td>
        <td>${subtotal.toFixed(3)}</td>
      </tr>
    `);
  });

  qs('#totalRial').textContent = total.toFixed(3);
  qs('#totalCredit').textContent = (total / 0.8).toFixed(3);

  qs('#payBtn').onclick = finishOrder;
  renderCartCount();
}

/* ======== إتمام الطلب ======== */
async function finishOrder() {
  const name = qs('#custName').value.trim();
  const phone = qs('#custPhone').value.trim();
  const paymentMethod = qs('input[name="pay"]:checked').value;
  const cart = getCart();

  // التحقق من البيانات
  if (!name || !phone) {
    alert(lang.current === 'ar' ? 'الرجاء إدخال الاسم ورقم الهاتف' : 'Please enter name and phone');
    return;
  }

  if (!/^[0-9]{8,}$/.test(phone)) {
    alert(lang.current === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number');
    return;
  }

  // تحضير رسالة الواتساب
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

    const subtotal = product.price * item.qty;
    total += subtotal;

    message += `- ${product.name[lang.current]}\n`;
    message += `  الكمية: ${item.qty}\n`;
    message += `  السعر: ${product.price.toFixed(3)} ر.ع.\n`;
    message += `  الإجمالي: ${subtotal.toFixed(3)} ر.ع.\n\n`;
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
  renderCartCount();
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
});
