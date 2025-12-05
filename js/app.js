/* إعدادات عامة */
const DATA_DIR = "data";
const ASSETS_DIR = "assets";

/* ---------------- CSV Loader (يدعم فقرات متعددة) ---------------- */

async function loadCSV(path) {
  const res = await fetch(path);
  const text = await res.text();

  // نقسم الملف لأسطر حقيقية، مع مراعاة الأسطر داخل ""
  const lines = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"') {
      inQuotes = !inQuotes;
      currentLine += c;
      continue;
    }

    if (c === "\n" && !inQuotes) {
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

/* ---------------- كاتيجوري + منتجات ---------------- */

async function loadCategories() {
  return await loadCSV(`${DATA_DIR}/categories.csv`);
}

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

/* --------- الأوبشن: قراءة options من الـ CSV --------- */

function parseOptions(product) {
  const raw = product.options || "";
  if (!raw.trim()) return [];

  return raw.split("|").map(part => {
    const [labelPart, pricePart] = part.split(":");
    const label = (labelPart || "").trim();
    const price = parseFloat((pricePart || "").trim());
    if (!label || isNaN(price)) return null;
    return { label, price };
  }).filter(Boolean);
}

/* ---------------- السلة: تخزين محلي ---------------- */

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

/* ---------------- الترجمة (AR / EN) ---------------- */

function applyLanguage(lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll(".lang-toggle").forEach(btn => {
    const bLang = btn.getAttribute("data-lang");
    if (bLang === lang) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  document.querySelectorAll("[data-i18n-ar]").forEach(el => {
    const ar = el.getAttribute("data-i18n-ar") || "";
    const en = el.getAttribute("data-i18n-en") || ar;
    el.textContent = lang === "ar" ? ar : en;
  });

  localStorage.setItem("devstore_lang", lang);
}

/* ---------------- الصفحة الرئيسية: الكاتيجوري ---------------- */

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

/* ---------------- أدوات عامة ---------------- */

function getParam(name) {
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

/* ---------------- صفحة الكاتيجوري ---------------- */

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
    const options = parseOptions(p);

    const card = document.createElement("div");
    card.className = "product-card";

    card.addEventListener("click", e => {
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

    let mainPrice;
    let showOldPrice = false;
    let oldPriceValue = null;

    if (options.length) {
      // عندنا أوبشن → نستخدم أول خيار كعرض في القائمة
      mainPrice = options[0].price;
    } else {
      const useDiscount =
        p.discount_price_omr && p.discount_price_omr.trim() !== "";
      mainPrice = useDiscount
        ? parseFloat(p.discount_price_omr)
        : parseFloat(p.price_omr);
      if (useDiscount) {
        showOldPrice = true;
        oldPriceValue = parseFloat(p.price_omr);
      }
    }

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = `${mainPrice.toFixed(3)} ر.ع`;
    priceRow.appendChild(price);

    if (showOldPrice && oldPriceValue != null) {
      const old = document.createElement("span");
      old.className = "product-old-price";
      old.textContent = `${oldPriceValue.toFixed(3)} ر.ع`;
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
      // لو فيه أوبشن نستخدم الأول افتراضياً
      const chosenOption = options.length ? options[0] : null;
      buyNow(p, 1, categoryKey, chosenOption);
    });

    const cartBtn = document.createElement("button");
    cartBtn.className = "btn-secondary";
    cartBtn.textContent = "إضافة للسلة";
    cartBtn.addEventListener("click", e => {
      e.stopPropagation();
      const chosenOption = options.length ? options[0] : null;
      addToCart(p, 1, categoryKey, chosenOption);
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

  const options = parseOptions(product);

  // ----- جزء الصور -----
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

  // ----- جزء التفاصيل -----
  const details = document.createElement("div");
  details.className = "product-details";

  const title = document.createElement("h1");
  title.className = "product-details-title";
  title.textContent = product.name_ar;

  const priceRow = document.createElement("div");
  priceRow.className = "product-details-price-row";

  let mainPrice;
  let useDiscount = false;
  let currentOption = null;

  if (options.length) {
    currentOption = options[0];
    mainPrice = currentOption.price;
  } else {
    useDiscount =
      product.discount_price_omr && product.discount_price_omr.trim() !== "";
    mainPrice = useDiscount
      ? parseFloat(product.discount_price_omr)
      : parseFloat(product.price_omr);
  }

  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = `${mainPrice.toFixed(3)} ر.ع`;
  priceRow.appendChild(price);

  if (!options.length && useDiscount) {
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

  // ✅ بلوك الأوبشن — تحت اسم المنتج مباشرة
  if (options.length) {
    const optsBlock = document.createElement("div");
    optsBlock.className = "product-options-block";

    const optsTitle = document.createElement("div");
    optsTitle.className = "product-options-title";
    optsTitle.textContent = "اختر النسخة أو الخطة:";
    optsBlock.appendChild(optsTitle);

    if (options.length <= 5) {
      // A) Radio buttons
      options.forEach((opt, idx) => {
        const wrapper = document.createElement("label");
        wrapper.className = "product-option-radio";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "product-option";
        input.value = opt.label;
        if (idx === 0) input.checked = true;

        input.addEventListener("change", () => {
          currentOption = opt;
          mainPrice = opt.price;
          price.textContent = `${mainPrice.toFixed(3)} ر.ع`;
        });

        const textWrap = document.createElement("span");
        textWrap.className = "product-option-text";

        const labelSpan = document.createElement("span");
        labelSpan.className = "product-option-label";
        labelSpan.textContent = opt.label;

        const priceSpan = document.createElement("span");
        priceSpan.className = "product-option-price";
        priceSpan.textContent = `${opt.price.toFixed(3)} ر.ع`;

        textWrap.appendChild(labelSpan);
        textWrap.appendChild(priceSpan);

        wrapper.appendChild(input);
        wrapper.appendChild(textWrap);
        optsBlock.appendChild(wrapper);

      });
    } else {
      // B) Dropdown
      const select = document.createElement("select");
      select.className = "product-options-select";

      options.forEach((opt, idx) => {
        const optionEl = document.createElement("option");
        optionEl.value = opt.label;
        optionEl.textContent = `${opt.label} — ${opt.price.toFixed(3)} ر.ع`;
        if (idx === 0) optionEl.selected = true;
        select.appendChild(optionEl);
      });

      select.addEventListener("change", e => {
        const opt = options.find(o => o.label === e.target.value);
        if (!opt) return;
        currentOption = opt;
        mainPrice = opt.price;
        price.textContent = `${mainPrice.toFixed(3)} ر.ع`;
      });

      optsBlock.appendChild(select);
    }

    // ترتيب العناصر: اسم المنتج → الأوبشن → السعر
    details.appendChild(title);
    details.appendChild(optsBlock);
  } else {
    // ما فيه أوبشن → بس اسم المنتج وبعدين السعر
    details.appendChild(title);
  }

  details.appendChild(priceRow);
  details.appendChild(shortDesc);
  details.appendChild(longDesc);
  details.appendChild(readMore);

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
    addToCart(product, qty, categoryKey, currentOption);
    alert("تمت إضافة المنتج للسلة");
  });

  const buyBtn = document.createElement("button");
  buyBtn.className = "btn-primary";
  buyBtn.textContent = "شراء الآن عبر واتساب";
  buyBtn.addEventListener("click", () => {
    const qty = parseInt(qtyInput.value) || 1;
    buyNow(product, qty, categoryKey, currentOption);
  });

  if (product.status === "soldout") {
    addBtn.disabled = true;
    buyBtn.disabled = true;
    qtyInput.disabled = true;
  }

  actions.appendChild(qtyInput);
  actions.appendChild(addBtn);
  actions.appendChild(buyBtn);

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

/* ---------------- السلة + واتساب ---------------- */

function addToCart(product, qty, categoryKey, chosenOption) {
  const cart = loadCart();
  const images = getProductImages(product);
  const img = images[0] || "";

  const options = parseOptions(product);

  let optionLabel = null;
  let unitPrice;
  let isOption = false;

  if (options.length) {
    const opt = chosenOption || options[0];
    optionLabel = opt.label;
    unitPrice = opt.price;
    isOption = true;
  } else {
    const useDiscount =
      product.discount_price_omr && product.discount_price_omr.trim() !== "";
    unitPrice = useDiscount
      ? parseFloat(product.discount_price_omr)
      : parseFloat(product.price_omr);
  }

  const existing = cart.find(
    i =>
      i.id === product.id &&
      i.cat === categoryKey &&
      i.option === optionLabel
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      cat: categoryKey,
      name: product.name_ar,
      price: unitPrice,
      discount: null, // الأوبشن يتجاهل الخصم القديم
      qty,
      image: img,
      option: optionLabel
    });
  }

  saveCart(cart);
}

function buyNow(product, qty, categoryKey, chosenOption) {
  const options = parseOptions(product);

  let optionLabel = null;
  let unitPrice;

  if (options.length) {
    const opt = chosenOption || options[0];
    optionLabel = opt.label;
    unitPrice = opt.price;
  } else {
    const useDiscount =
      product.discount_price_omr && product.discount_price_omr.trim() !== "";
    unitPrice = useDiscount
      ? parseFloat(product.discount_price_omr)
      : parseFloat(product.price_omr);
  }

  const total = (qty * unitPrice).toFixed(3);

  let lineName = product.name_ar;
  if (optionLabel) lineName += ` (${optionLabel})`;

  const msg =
    `السلام عليكم\n` +
    `أرغب في شراء المنتج التالي:\n\n` +
    `المنتج: ${lineName}\n` +
    `القسم: ${categoryKey}\n` +
    `الكمية: ${qty}\n` +
    `سعر الوحدة: ${unitPrice.toFixed(3)} ر.ع\n` +
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

    let titleText = item.name;
    if (item.option) titleText += ` (${item.option})`;

    const title = document.createElement("div");
    title.className = "cart-item-title";
    title.textContent = titleText;

    const pricePer = item.price;
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
    const pricePer = item.price;
    const lineTotal = pricePer * item.qty;

    msg += `• ${item.name}`;
    if (item.option) msg += ` (${item.option})`;
    msg += `\n`;
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

  const savedLang = localStorage.getItem("devstore_lang") || "ar";
  applyLanguage(savedLang);

  document.querySelectorAll(".lang-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang") || "ar";
      applyLanguage(lang);
    });
  });

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
