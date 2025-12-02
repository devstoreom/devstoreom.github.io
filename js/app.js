/* إعدادات عامة */
const DATA_DIR = "data";
const ASSETS_DIR = "assets";

/* ---------------- CSV Loader ---------------- */

async function loadCSV(path) {
    const res = await fetch(path);
    const text = await res.text();
  
    // نقسم الملف لأسطر لكن نراعي الأسطر اللي داخل "" ما تنحسب كسطر جديد
    const lines = [];
    let currentLine = "";
    let inQuotes = false;
  
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
  
      if (c === '"') {
        // نقلب حالة inQuotes (مو مهم هنا نهتم بالـ "" المكررة، نتركها لـ parseCSVLine)
        inQuotes = !inQuotes;
        currentLine += c;
        continue;
      }
  
      if (c === "\n" && !inQuotes) {
        // نهاية سجل حقيقي
        const trimmed = currentLine.replace(/\r$/, "");
        if (trimmed.length > 0) {
          lines.push(trimmed);
        }
        currentLine = "";
      } else if (c !== "\r") {
        currentLine += c;
      }
    }
  
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }
  
    if (!lines.length) return [];
  
    // أول سطر عناوين
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const rows = [];
  
    for (let i = 1; i < lines.length; i++) {
      const rowArr = parseCSVLine(lines[i]);
      if (!rowArr.length || rowArr.every(col => !col || col.trim() === "")) continue;
  
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = rowArr[idx] || "";
      });
      rows.push(obj);
    }
  
    return rows;
 }
  

/*ووووووووووووووووووووووووووووووووووووووووووووووووووووو
async function loadCSV(path) {
  const res = await fetch(path);
  const text = await res.text();

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (!row.length) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || "";
    });
    rows.push(obj);
  }

  return rows;
}
/*ووووووووووووووووووووووووووووووووووووووووووووووووووووووووووووو
/* يدعم "field","fi,eld" */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"' && inQuotes && line[i + 1] === '"') {
      current += '"';
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += c;
  }

  result.push(current);
  return result;
}

/* ---------------- صور: ملف أو رابط ---------------- */

function resolveImagePath(path) {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("//")
  ) {
    return trimmed;
  }
  return `${ASSETS_DIR}/${trimmed}`;
}

/* ---------------- كاتيجوري ---------------- */

async function loadCategories() {
  return await loadCSV(`${DATA_DIR}/categories.csv`);
}

/* ---------------- منتجات كاتيجوري ---------------- */

async function loadCategoryProducts(fileName) {
  return await loadCSV(`${DATA_DIR}/${fileName}`);
}

function getProductImages(product) {
  const raw = product.images || "";
  return raw
    .split("|")
    .map(s => resolveImagePath(s))
    .filter(Boolean);
}

/* ---------------- الهيدر: عداد السلة ---------------- */

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const cart = loadCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  el.textContent = totalQty;
}

/* ---------------- الصفحة الرئيسية ---------------- */

function renderCategoriesGrid(categories) {
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  grid.innerHTML = "";

  categories
    .filter(c => c.active !== "0")
    .forEach(cat => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.onclick = () => {
        location.href = `category.html?key=${encodeURIComponent(cat.key)}`;
      };

      const bannerWrapper = document.createElement("div");
      bannerWrapper.className = "category-banner-wrapper";

      const banner = document.createElement("img");
      banner.className = "category-banner";
      banner.src = resolveImagePath(cat.banner_image);
      banner.alt = cat.name_ar;

      bannerWrapper.appendChild(banner);

      const body = document.createElement("div");
      body.className = "category-card-body";

      const title = document.createElement("div");
      title.className = "category-card-title";
      title.textContent = cat.name_ar;

      const subtitle = document.createElement("div");
      subtitle.className = "category-card-subtitle";
      subtitle.textContent = cat.name_en || "";

      body.appendChild(title);
      body.appendChild(subtitle);

      card.appendChild(bannerWrapper);
      card.appendChild(body);

      grid.appendChild(card);
    });
}

/* ---------------- صفحة الكاتيجوري ---------------- */

function getParam(name) {
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

function renderProductsGrid(products, categoryKey) {
  const grid = document.getElementById("products-grid");
  const empty = document.getElementById("no-products");
  if (!grid) return;

  grid.innerHTML = "";

  const activeProducts = products.filter(p => p.active !== "0");

  if (!activeProducts.length) {
    if (empty) empty.style.display = "block";
    return;
  } else if (empty) {
    empty.style.display = "none";
  }

  activeProducts.forEach(p => {
    p.category = categoryKey;

    const card = document.createElement("div");
    card.className = "product-card";

    card.addEventListener("click", e => {
      // منع الأزرار من فتح صفحة المنتج
      if ((e.target.tagName || "").toLowerCase() === "button") return;
      location.href = `product.html?cat=${encodeURIComponent(
        categoryKey
      )}&id=${encodeURIComponent(p.id)}`;
    });

    const imgWrap = document.createElement("div");
    imgWrap.className = "product-image-wrapper";

    const img = document.createElement("img");
    const imgs = getProductImages(p);
    img.src = imgs[0] || "";
    img.alt = p.name_ar;
    imgWrap.appendChild(img);

    if (p.status) {
      const badge = document.createElement("div");
      badge.className = "product-status-badge";
      if (p.status === "sale") badge.classList.add("product-status-sale");
      if (p.status === "soldout")
        badge.classList.add("product-status-soldout");
      badge.textContent =
        p.status === "new"
          ? "جديد"
          : p.status === "sale"
          ? "عرض"
          : p.status === "soldout"
          ? "منتهي"
          : "";
      imgWrap.appendChild(badge);
    }

    const body = document.createElement("div");
    body.className = "product-card-body";

    const nameEl = document.createElement("div");
    nameEl.className = "product-name";
    nameEl.textContent = p.name_ar;

    const priceRow = document.createElement("div");
    priceRow.className = "product-price-row";

    const useDiscount =
      p.discount_price_omr && p.discount_price_omr.trim() !== "";

    const price = document.createElement("span");
    price.className = "product-price";
    const mainPrice = useDiscount
      ? parseFloat(p.discount_price_omr)
      : parseFloat(p.price_omr);
    price.textContent = `${mainPrice.toFixed(3)} ر.ع`;
    priceRow.appendChild(price);

    if (useDiscount) {
      const old = document.createElement("span");
      old.className = "product-old-price";
      old.textContent = `${parseFloat(p.price_omr).toFixed(3)} ر.ع`;
      priceRow.appendChild(old);
    }

    const shortDesc = document.createElement("div");
    shortDesc.className = "product-short-desc";
    shortDesc.textContent = p.short_desc_ar || "";

    const actions = document.createElement("div");
    actions.className = "product-card-actions";

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn-primary";
    buyBtn.textContent = "شراء الآن";
    buyBtn.addEventListener("click", e => {
      e.stopPropagation();
      buyNow(p, 1, categoryKey);
    });

    const cartBtn = document.createElement("button");
    cartBtn.className = "btn-secondary";
    cartBtn.textContent = "إضافة للسلة";
    cartBtn.addEventListener("click", e => {
      e.stopPropagation();
      addToCart(p, 1, categoryKey);
    });

    if (p.status === "soldout") {
      buyBtn.disabled = true;
      cartBtn.disabled = true;
    }

    actions.appendChild(buyBtn);
    actions.appendChild(cartBtn);

    body.appendChild(nameEl);
    body.appendChild(priceRow);
    body.appendChild(shortDesc);
    body.appendChild(actions);

    card.appendChild(imgWrap);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

async function initCategoryPage() {
  const key = getParam("key");
  if (!key) return;

  const categories = await loadCategories();
  const category = categories.find(c => c.key === key);
  if (!category) return;

  const titleEl = document.getElementById("category-title");
  const bannerEl = document.getElementById("category-banner");

  if (titleEl) titleEl.textContent = category.name_ar;
  if (bannerEl) {
    bannerEl.src = resolveImagePath(category.banner_image);
    bannerEl.alt = category.name_ar;
  }

  const products = await loadCategoryProducts(category.file);
  renderProductsGrid(products, key);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const term = e.target.value.trim();
      if (!term) {
        renderProductsGrid(products, key);
      } else {
        const filtered = products.filter(p =>
          (p.name_ar || "").includes(term)
        );
        renderProductsGrid(filtered, key);
      }
    });
  }
}

/* ---------------- صفحة المنتج الواحد ---------------- */

function renderSingleProduct(product, categoryKey) {
    const section = document.getElementById("product-section");
    if (!section) return;
  
    section.innerHTML = "";
  
    const gallery = document.createElement("div");
    gallery.className = "product-gallery-main";
  
    const mainWrap = document.createElement("div");
    mainWrap.className = "product-image-wrapper";
  
    const mainImg = document.createElement("img");
    const imgs = getProductImages(product);
    mainImg.src = imgs[0] || "";
    mainImg.alt = product.name_ar;
    mainWrap.appendChild(mainImg);
  
    const thumbs = document.createElement("div");
    thumbs.className = "product-thumbs";
  
    imgs.forEach((src, idx) => {
      const t = document.createElement("img");
      t.src = src;
      if (idx === 0) t.classList.add("active-thumb");
      t.addEventListener("click", () => {
        mainImg.src = src;
        document
          .querySelectorAll(".product-thumbs img")
          .forEach(img => img.classList.remove("active-thumb"));
        t.classList.add("active-thumb");
      });
      thumbs.appendChild(t);
    });
  
    gallery.appendChild(mainWrap);
    gallery.appendChild(thumbs);
  
    const details = document.createElement("div");
    details.className = "product-details";
  
    const title = document.createElement("h1");
    title.className = "product-details-title";
    title.textContent = product.name_ar;
  
    const priceRow = document.createElement("div");
    priceRow.className = "product-details-price-row";
  
    const useDiscount =
      product.discount_price_omr && product.discount_price_omr.trim() !== "";
    const mainPrice = useDiscount
      ? parseFloat(product.discount_price_omr)
      : parseFloat(product.price_omr);
  
    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = `${mainPrice.toFixed(3)} ر.ع`;
    priceRow.appendChild(price);
  
    if (useDiscount) {
      const old = document.createElement("span");
      old.className = "product-old-price";
      old.textContent = `${parseFloat(product.price_omr).toFixed(3)} ر.ع`;
      priceRow.appendChild(old);
    }
  
    const shortDesc = document.createElement("p");
    shortDesc.className = "product-details-short";
    shortDesc.textContent = product.short_desc_ar || "";
  
    const longDesc = document.createElement("p");
    longDesc.className = "product-details-long collapsed";
  
    // ✅ نحافظ على الفقرات والأسطر
    const longText = product.long_desc_ar || "";
    const longHtml = longText.replace(/\r?\n/g, "<br>");
    longDesc.innerHTML = longHtml;
  
    const readMore = document.createElement("button");
    readMore.className = "read-more-btn";
    readMore.textContent = "إظهار المزيد";
    readMore.addEventListener("click", () => {
      const collapsed = longDesc.classList.toggle("collapsed");
      readMore.textContent = collapsed ? "إظهار المزيد" : "إظهار أقل";
    });
  
    const actions = document.createElement("div");
    actions.className = "product-details-actions";
  
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.value = "1";
    qtyInput.className = "qty-input";
  
    const addBtn = document.createElement("button");
    addBtn.className = "btn-secondary";
    addBtn.textContent = "إضافة للسلة";
    addBtn.addEventListener("click", () => {
      const qty = parseInt(qtyInput.value) || 1;
      addToCart(product, qty, categoryKey);
      alert("تمت إضافة المنتج للسلة");
    });
  
    const buyBtn = document.createElement("button");
    buyBtn.className = "btn-primary";
    buyBtn.textContent = "شراء الآن عبر واتساب";
    buyBtn.addEventListener("click", () => {
      const qty = parseInt(qtyInput.value) || 1;
      buyNow(product, qty, categoryKey);
    });
  
    if (product.status === "soldout") {
      addBtn.disabled = true;
      buyBtn.disabled = true;
      qtyInput.disabled = true;
    }
  
    actions.appendChild(qtyInput);
    actions.appendChild(addBtn);
    actions.appendChild(buyBtn);
  
    details.appendChild(title);
    details.appendChild(priceRow);
    details.appendChild(shortDesc);
    details.appendChild(longDesc);
    details.appendChild(readMore);
    details.appendChild(actions);
  
    section.appendChild(gallery);
    section.appendChild(details);
  }
  

async function initProductPage() {
  const catKey = getParam("cat");
  const id = getParam("id");
  if (!catKey || !id) return;

  const categories = await loadCategories();
  const category = categories.find(c => c.key === catKey);
  if (!category) return;

  const products = await loadCategoryProducts(category.file);
  const product = products.find(p => p.id === id);
  if (!product) return;

  renderSingleProduct(product, catKey);
}

/* ---------------- السلة ---------------- */

function addToCart(product, qty, categoryKey) {
  const cart = loadCart();
  const images = getProductImages(product);
  const img = images[0] || "";

  const existing = cart.find(
    i => i.id === product.id && i.cat === categoryKey
  );

  const useDiscount =
    product.discount_price_omr && product.discount_price_omr.trim() !== "";
  const mainPrice = useDiscount
    ? parseFloat(product.discount_price_omr)
    : parseFloat(product.price_omr);

  const discountValue = useDiscount
    ? parseFloat(product.discount_price_omr)
    : null;

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      cat: categoryKey,
      name: product.name_ar,
      price: parseFloat(product.price_omr),
      discount: discountValue,
      qty,
      image: img
    });
  }

  saveCart(cart);
}

function buyNow(product, qty, categoryKey) {
  const useDiscount =
    product.discount_price_omr && product.discount_price_omr.trim() !== "";
  const mainPrice = useDiscount
    ? parseFloat(product.discount_price_omr)
    : parseFloat(product.price_omr);

  const total = (qty * mainPrice).toFixed(3);

  const msg =
    `السلام عليكم\n` +
    `أرغب في شراء المنتج التالي:\n\n` +
    `المنتج: ${product.name_ar}\n` +
    `القسم: ${categoryKey}\n` +
    `الكمية: ${qty}\n` +
    `سعر الوحدة: ${mainPrice.toFixed(3)} ر.ع\n` +
    `الإجمالي: ${total} ر.ع\n\n` +
    `من موقع متجر dev`;

  const url = `https://wa.me/96894390492?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

/* صفحة السلة */

function renderCartPage() {
  const itemsContainer = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const summaryEl = document.getElementById("cart-summary");
  const totalEl = document.getElementById("cart-total");
  if (!itemsContainer) return;

  const cart = loadCart();

  if (!cart.length) {
    if (emptyEl) emptyEl.style.display = "block";
    if (summaryEl) summaryEl.style.display = "none";
    return;
  } else {
    if (emptyEl) emptyEl.style.display = "none";
    if (summaryEl) summaryEl.style.display = "block";
  }

  itemsContainer.innerHTML = "";
  let total = 0;

  cart.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const imgWrap = document.createElement("div");
    imgWrap.className = "cart-item-img-wrapper";
    const img = document.createElement("img");
    img.src = item.image || "";
    imgWrap.appendChild(img);

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const title = document.createElement("div");
    title.className = "cart-item-title";
    title.textContent = item.name;

    const pricePer =
      item.discount != null ? item.discount : item.price;
    const lineTotal = pricePer * item.qty;
    total += lineTotal;

    const meta = document.createElement("div");
    meta.className = "cart-item-meta";
    meta.textContent = `سعر الوحدة: ${pricePer.toFixed(
      3
    )} ر.ع × ${item.qty} = ${lineTotal.toFixed(3)} ر.ع`;

    info.appendChild(title);
    info.appendChild(meta);

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";

    const qtyRow = document.createElement("div");
    qtyRow.className = "cart-qty-row";

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.value = item.qty;
    qtyInput.addEventListener("change", e => {
      const newQty = parseInt(e.target.value) || 1;
      item.qty = newQty;
      saveCart(cart);
      renderCartPage();
    });

    qtyRow.appendChild(qtyInput);

    const removeBtn = document.createElement("button");
    removeBtn.className = "cart-remove-btn";
    removeBtn.textContent = "حذف";
    removeBtn.addEventListener("click", () => {
      cart.splice(idx, 1);
      saveCart(cart);
      renderCartPage();
    });

    controls.appendChild(qtyRow);
    controls.appendChild(removeBtn);

    row.appendChild(imgWrap);
    row.appendChild(info);
    row.appendChild(controls);

    itemsContainer.appendChild(row);
  });

  if (totalEl) totalEl.textContent = `${total.toFixed(3)} ر.ع`;

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      checkoutWhatsApp(cart, total);
    };
  }
}

function checkoutWhatsApp(cart, total) {
  if (!cart.length) return;

  let msg = "السلام عليكم\nأرغب في إتمام الطلب التالي:\n\n";

  cart.forEach(item => {
    const pricePer =
      item.discount != null ? item.discount : item.price;
    const lineTotal = pricePer * item.qty;

    msg += `• ${item.name}\n`;
    msg += `  الكمية: ${item.qty}\n`;
    msg += `  سعر الوحدة: ${pricePer.toFixed(3)} ر.ع\n`;
    msg += `  الإجمالي: ${lineTotal.toFixed(3)} ر.ع\n\n`;
  });

  msg += `الإجمالي النهائي: ${total.toFixed(3)} ر.ع\n\n`;
  msg += "من موقع متجر dev";

  const url = `https://wa.me/96894390492?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

/* ---------------- تهيئة الصفحات ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  updateCartCount();

  const path = location.pathname;

  if (path.endsWith("index.html") || path === "/" || path === "") {
    const categories = await loadCategories();
    renderCategoriesGrid(categories);
  } else if (path.endsWith("category.html")) {
    await initCategoryPage();
  } else if (path.endsWith("product.html")) {
    await initProductPage();
  } else if (path.endsWith("cart.html")) {
    renderCartPage();
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
