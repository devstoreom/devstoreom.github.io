/* ======== المتغيرات العامة ======== */
const storePhone = '96894390492';
const storageKey = 'dev_cart_v2';
const lang = { current: 'ar' };

/* ======== دوال مساعدة ======== */
function qs(q, c = document) { return c.querySelector(q) }
function qsa(q, c = document) { return [...c.querySelectorAll(q)] }

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
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(storageKey, JSON.stringify(cart));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function renderCartCount() {
  const badge = qs('#cartCount');
  if (badge) badge.textContent = cartCount() || '';
}

/* ======== الصفحة الرئيسية ======== */
async function renderIndex() {
  const list = qs('#productList');
  if (!list) return;

  const data = await loadJSON('products.json');
  list.innerHTML = '';

  data.forEach(product => {
    list.insertAdjacentHTML('beforeend', `
      <div class="product">
        <img src="${product.image}" alt="${product.name[lang.current]}" onclick="openProduct('${product.id}')">
        <h3>${product.name[lang.current]}</h3>
        <p class="price">${product.price.toFixed(3)} ريال عماني</p>
        <button class="btn add" onclick="addToCart('${product.id}', 1)">
          ${lang.current === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
        </button>
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
    qs('main').inner
