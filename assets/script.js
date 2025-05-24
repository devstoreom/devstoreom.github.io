/* دالة renderProductPage معدلة */
async function renderProductPage() {
  const url = new URL(location.href);
  const id = url.searchParams.get('id');
  const data = await loadJSON('products.json');
  const p = data.find(x => x.id === id);

  if (!p) {
    document.body.innerHTML = '<h1 style="text-align:center">المنتج غير موجود</h1>';
    return;
  }

  // تعيين محتوى الصفحة
  qs('#prodImg').src = p.image;
  qs('#prodImg').onerror = () => { 
    qs('#prodImg').src = 'images/placeholder.jpg'; // صورة افتراضية عند الخطأ
  };
  
  qs('#prodName').textContent = p.name['ar'] || p.name['en'];
  qs('#prodPrice').textContent = `${p.price.toFixed(3)} ريال عماني`;

  // أحداث الأزرار
  qs('#addBtn').onclick = () => {
    addToCart(p.id, Number(qs('#qty').value));
    alert('تمت الإضافة إلى السلة بنجاح');
  };
  
  qs('#buyBtn').onclick = () => {
    addToCart(p.id, Number(qs('#qty').value));
    location.href = 'checkout.html';
  };
}

/* إضافة دالة للتحقق من الصورة */
function checkImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
