/* ======== helpers ======== */
const storePhone = '96894390492';
const storageKey = 'dev_cart_v1';
const lang = { current: 'en' };

function qs(q,   c=document){return c.querySelector(q)}
function qsa(q,  c=document){return [...c.querySelectorAll(q)]}

function loadJSON(path){return fetch(path).then(r=>r.json())}
function getCart(){return JSON.parse(localStorage.getItem(storageKey) || '[]')}
function saveCart(cart){localStorage.setItem(storageKey, JSON.stringify(cart))}
function cartCount(){return getCart().reduce((s,i)=>s+i.qty,0)}
function renderCartCount(){const badge=qs('#cartCount');if(badge)badge.textContent=cartCount()||''}

/* ======== product list (index.html) ======== */
async function renderIndex(){const list=qs('#productList');if(!list)return;const data=await loadJSON('products.json');list.innerHTML='';data.forEach(p=>{list.insertAdjacentHTML('beforeend',`
  <div class="product">
    <img src="${p.image}" alt="${p.name[lang.current]}" onclick="openProduct('${p.id}')"/>
    <h3>${p.name[lang.current]}</h3>
    <p>${p.price} ريال عماني</p>
    <button class="btn add" onclick="addToCart('${p.id}',1)">${lang.current==='ar'?'أضف إلى السلة':'Add to Cart'} <span class="cart-count"></span></button>
  </div>
`)});renderCartCount()}

/* ======== open product page ======== */
function openProduct(id){location.href=`product.html?id=${id}`}

/* ======== add to cart ======== */
async function addToCart(id,qty, chosenOptions={}){const data=await loadJSON('products.json');const prod=data.find(p=>p.id===id);if(!prod)return; const cart=getCart();const existing=cart.find(i=>i.id===id && JSON.stringify(i.opt)===JSON.stringify(chosenOptions));if(existing){existing.qty+=qty}else{cart.push({id,qty,opt:chosenOptions})}saveCart(cart);alert(lang.current==='ar'?'تمت الإضافة للسلة':'Added to cart');renderCartCount()}

/* ======== product.html ======== */
async function renderProductPage(){const prodEl=qs('#prodDetails');if(!prodEl)return;const url=new URL(location.href);const id=url.searchParams.get('id');const data=await loadJSON('products.json');const p=data.find(x=>x.id===id);if(!p){prodEl.textContent='Product not found';return}
qs('#prodImg').src=p.image;qs('#prodName').textContent=p.name[lang.current];qs('#prodPrice').textContent=`${p.price} ريال عماني`;
qs('#addBtn').onclick=()=>addToCart(p.id,Number(qs('#qty').value));
qs('#buyBtn').onclick=()=>{addToCart(p.id,Number(qs('#qty').value));location.href='checkout.html'};
}

/* ======== checkout.html ======== */
async function renderCheckout(){const tableBody=qs('#orderTable');if(!tableBody)return;const cart=getCart();if(!cart.length){tableBody.innerHTML='<tr><td colspan="5">السلة فارغة</td></tr>';return}
const data=await loadJSON('products.json');let total=0;tableBody.innerHTML='';cart.forEach((item,i)=>{const p=data.find(x=>x.id===item.id);const subtotal=p.price*item.qty;total+=subtotal;tableBody.insertAdjacentHTML('beforeend',`
<tr>
 <td>${i+1}</td>
 <td>${p.name[lang.current]}</td>
 <td>${item.qty}</td>
 <td>${p.price.toFixed(3)}</td>
 <td>${subtotal.toFixed(3)}</td>
</tr>`)});
qs('#totalRial').textContent=total.toFixed(3);
qs('#totalCredit').textContent=(total/0.8).toFixed(3);
qs('#payBtn').onclick=()=>finishOrder(total,data);
}

function finishOrder(total,data){const name=qs('#custName').value.trim();const phone=qs('#custPhone').value.trim();const method=qs('input[name=pay]:checked').value;const cart=getCart();if(!name||!phone){alert('اكتب الاسم ورقم الهاتف');return}
let msg=`فاتوه متجر DEV\n\n`;
cart.forEach((item)=>{const p=data.find(x=>x.id===item.id);msg+=`اسم المنتج: ${p.name[lang.current]}\nالتعديلات/الخيارات: لا يوجد\nالكمية: ${item.qty}\nالسعر: ${p.price.toFixed(3)}\n---\n`;});
msg+=`المبلغ الإجمالي: ${total.toFixed(3)} ريال عماني\nطريقة الدفع: ${method==='bank'?'بنك':'رصيد أوريدو'}\n`;
if(method==='credit'){msg+=`إجمالي بالرصيد: ${(total/0.8).toFixed(3)} ريال رصيد أوريدو`}
const url=`https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`;window.open(url,'_blank');localStorage.removeItem(storageKey);}

/* ======== language toggle (index only) ======== */
function toggleLanguage(){lang.current=lang.current==='ar'?'en':'ar';qs('#langToggle').textContent=lang.current==='ar'?'English':'عربي';qs('#storeTitle').textContent=lang.current==='ar'?'متجر ديف':'Dev Store 🛍️';renderIndex();}

/* ======== bootstrap ======== */
document.addEventListener('DOMContentLoaded',()=>{
  renderCartCount();
  renderIndex();
  renderProductPage();
  renderCheckout();
});