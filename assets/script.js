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
async function addToCart(id,qty, chosenOptions={}){const data=await loadJSON('products.json');const prod=data.find(p=>p.id===id);if(!prod)return; const cart=getCart();const existing=cart.find(i=>i.id===id && JSON.stringify(i.opt
