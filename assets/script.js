/* ======== تعديل دالة renderProductPage ======== */
async function renderProductPage() {
  const prodEl = qs('#prodDetails');
  if (!prodEl) return;
  
  const url = new URL(location.href);
  const id = url.searchParams.get('id');
  const data = await loadJSON('products.json');
  const p = data.find(x => x.id === id);

  if (!p) {
    prodEl.textContent = 'Product not found';
    return;
  }

  // التعديل الرئيسي هنا: استخدام مسار مطلق للصورة
  const baseUrl = window.location.origin;
  const imagePath = `${baseUrl}/${p.image}`;
  qs('#prodImg').src = imagePath;
  
  qs('#prodName').textContent = p.name[lang.current];
  qs('#prodPrice').textContent = `${p.price} ريال عماني`;

  qs('#addBtn').onclick = () => addToCart(p.id, Number(qs('#qty').value));
  qs('#buyBtn').onclick = () => {
    addToCart(p.id, Number(qs('#qty').value));
    location.href = 'checkout.html';
  };

  // للتصحيح: طباعة مسار الصورة في الكونسول
  console.log('مسار الصورة:', imagePath);
}

/* ======== باقي الكود يبقى كما هو ======== */
// ... [بقية الدوال الموجودة في ملف script.js الأصلية] ...
