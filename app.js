(function () {
  'use strict';

  // ── Storage Keys ──
  const STORAGE_KEY  = 'khaled_zone_cart';
  const PRODUCTS_KEY = 'khaled_zone_products';
  const ORDERS_KEY   = 'khaled_zone_orders';
  const SETTINGS_KEY = 'khaled_zone_settings';
  const COUPONS_KEY  = 'khaled_zone_coupons';

  // ── Active Coupon State ──
  let activeCoupon = null;

  // ── Seed Default Coupons ──
  const DEFAULT_COUPONS = [
    { id: 'cpn-1', code: 'KHALED10', type: 'percent', value: 10, minOrder: 0,   maxUses: 100, usedCount: 0, expiresAt: '2026-12-31', active: true, createdAt: '2026-09-01' },
    { id: 'cpn-2', code: 'SAVE30',   type: 'fixed',   value: 30, minOrder: 100, maxUses: 50,  usedCount: 0, expiresAt: '2026-11-30', active: true, createdAt: '2026-09-01' },
    { id: 'cpn-3', code: 'VIP50',    type: 'percent', value: 50, minOrder: 200, maxUses: 10,  usedCount: 0, expiresAt: '2026-10-01', active: true, createdAt: '2026-09-01' },
  ];

  // ── Product Catalog ──
  const DefaultProducts = [
    { id: 'gta5-account',     title: 'GTA 5 Account',     subTitle: 'GTA V Premium + Online',    price: 120, oldPrice: 160, badge: 'الأكثر مبيعاً 🔥', image: 'assets/gta5_cover.svg',     category: 'accounts', rating: '4.9 ★', features: ['تفعيل فوري ⚡', 'ضمان مدى الحياة 🛡️', 'حساب كامل الملكية 👑', 'لعبة GTA V + GTA Online', 'تغيير جميع البيانات 🔑'] },
    { id: 'fivem-account',    title: 'FiveM Account',     subTitle: 'FiveM Roleplay Ready',      price: 100, oldPrice: 140, badge: 'جديد ⚡',             image: 'assets/fivem_cover.svg',    category: 'fivem',    rating: '4.8 ★', features: ['جاهز للرول بلاي 🎭', 'تخطي الحظر 🔓', 'تسليم آلي 🤖', 'سيرفرات عربية وغربية'] },
    { id: 'rdr2-account',     title: 'RDR2 Account',      subTitle: 'Red Dead Redemption 2',     price: 150, oldPrice: 200, badge: 'مميز ⭐',             image: 'assets/rdr2_cover.svg',     category: 'accounts', rating: '5.0 ★', features: ['طور القصة كامل 🤠', 'Red Dead Online 🐎', 'بيانات تغيير كاملة 🔑', 'تسليم آلي ⚡'] },
    { id: 'fortnite-account', title: 'Fortnite Account',  subTitle: 'Rare Skin Collection',      price: 90,  oldPrice: 120, badge: 'خصم 25% 🏷️',         image: 'assets/fortnite_cover.svg', category: 'accounts', rating: '4.7 ★', features: ['سكنات حصرية 👕', 'فأس نادر ⛏️', 'جميع المنصات 🎮', 'أمان 100% 🔒'] },
    { id: 'minecraft-account', title: 'Minecraft Account', subTitle: 'Java & Bedrock Edition',   price: 70,  oldPrice: 100, badge: 'عروض 💥',             image: 'assets/minecraft_cover.svg',category: 'accounts', rating: '4.9 ★', features: ['Java & Bedrock 🧱', 'تغيير الاسم والسكن 👤', 'دخول Hypixel 🏰', 'ضمان ذهبي 🏅'] }
  ];

  function loadProducts() {
    try {
      const s = localStorage.getItem(PRODUCTS_KEY);
      if (s) return JSON.parse(s);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DefaultProducts));
      return DefaultProducts;
    } catch { return DefaultProducts; }
  }

  function loadSettings() {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      return s ? JSON.parse(s) : { phone: '201000000000', vfCash: '01000000000', instapay: 'khaledzone@instapay', storeStatus: 'active' };
    } catch { return { phone: '201000000000', vfCash: '01000000000', instapay: 'khaledzone@instapay', storeStatus: 'active' }; }
  }

  const CatalogRepository = loadProducts();
  const StoreSettings = loadSettings();
  window.products = CatalogRepository;

  // ══════════════════════════════════════════
  //  COUPON ENGINE
  // ══════════════════════════════════════════
  function loadCoupons() {
    try {
      const s = localStorage.getItem(COUPONS_KEY);
      if (s) return JSON.parse(s);
      localStorage.setItem(COUPONS_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    } catch { return DEFAULT_COUPONS; }
  }

  function saveCoupons(arr) {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(arr));
  }

  function validateCoupon(code, cartTotal) {
    const coupons = loadCoupons();
    const c = coupons.find(x => x.code.toUpperCase() === code.toUpperCase().trim());

    if (!c)            return { valid: false, error: 'كود الخصم غير صحيح ❌' };
    if (!c.active)     return { valid: false, error: 'هذا الكود غير مفعّل حالياً ⛔' };

    const today = new Date().toISOString().split('T')[0];
    if (c.expiresAt && today > c.expiresAt)
                       return { valid: false, error: 'انتهت صلاحية هذا الكود 📅' };
    if (c.maxUses !== null && c.usedCount >= c.maxUses)
                       return { valid: false, error: 'تم استنفاد الحد الأقصى لاستخدام هذا الكود ⚠️' };
    if (cartTotal < c.minOrder)
                       return { valid: false, error: `الحد الأدنى لاستخدام الكود ${c.minOrder} جنيه 🛒` };

    return { valid: true, coupon: c };
  }

  function calcDiscount(coupon, subtotal) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return Math.round((subtotal * coupon.value) / 100);
    return Math.min(coupon.value, subtotal);
  }

  function consumeCoupon(code) {
    const coupons = loadCoupons();
    const c = coupons.find(x => x.code.toUpperCase() === code.toUpperCase().trim());
    if (c) { c.usedCount = (c.usedCount || 0) + 1; saveCoupons(coupons); }
  }

  // ══════════════════════════════════════════
  //  CART MANAGER
  // ══════════════════════════════════════════
  class CartManager {
    constructor() { this.items = this.load(); }

    load() {
      try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; }
      catch { return []; }
    }

    save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); }
      catch (e) { console.error('Cart save error:', e); }
    }

    addItem(productId) {
      const product = CatalogRepository.find(p => p.id === productId);
      if (!product) return null;
      const existing = this.items.find(i => i.id === productId);
      if (existing) existing.quantity += 1;
      else this.items.push({ ...product, quantity: 1 });
      this.save();
      return product;
    }

    removeItem(productId) {
      this.items = this.items.filter(i => i.id !== productId);
      this.save();
    }

    clear() { this.items = []; this.save(); }

    getTotalCount() { return this.items.reduce((s, i) => s + i.quantity, 0); }
    getSubtotal()   { return this.items.reduce((s, i) => s + i.price * i.quantity, 0); }
  }

  const cartService = new CartManager();

  // ══════════════════════════════════════════
  //  TOAST / NOTIFICATIONS
  // ══════════════════════════════════════════
  function notifyUser(message, icon = '⚡') {
    const existingIcon = document.getElementById('toast-icon');
    const existingText = document.getElementById('toast-text') || document.getElementById('toast-msg');
    const existingEl   = document.getElementById('toast');

    if (existingEl && existingIcon && existingText) {
      existingIcon.textContent = icon;
      existingText.textContent = message;
      existingEl.classList.add('flex', 'show');
      existingEl.classList.remove('hidden');
      clearTimeout(existingEl._t);
      existingEl._t = setTimeout(() => {
        existingEl.classList.remove('flex', 'show');
        existingEl.classList.add('hidden');
      }, 3200);
      return;
    }

    const t = document.createElement('div');
    t.className = 'fixed bottom-6 left-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm text-white shadow-2xl transition-all';
    t.style.cssText = 'background:rgba(15,28,55,0.95);border:1px solid rgba(56,189,248,0.3);backdrop-filter:blur(20px)';
    t.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ══════════════════════════════════════════
  //  CART UI SYNC
  // ══════════════════════════════════════════
  function syncCartUI() {
    const badge     = document.getElementById('cart-badge');
    const container = document.getElementById('cart-items-container');
    const totalEl   = document.getElementById('cart-total');
    const countText = document.getElementById('cart-count-text');

    if (badge) {
      const count = cartService.getTotalCount();
      badge.textContent = count;
      if (count > 0) { badge.classList.remove('hidden'); badge.classList.add('flex'); }
      else { badge.classList.add('hidden'); badge.classList.remove('flex'); }
    }

    if (!container || !totalEl) return;

    const subtotal   = cartService.getSubtotal();
    const discount   = calcDiscount(activeCoupon, subtotal);
    const finalTotal = subtotal - discount;

    if (countText) countText.textContent = `${cartService.getTotalCount()} منتجات`;

    if (cartService.items.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
          <div class="text-5xl">🛒</div>
          <p class="font-bold text-slate-400">السلة فارغة حالياً</p>
          <p class="text-xs text-slate-600">تصفح المتجر وأضف حساباتك المفضلة!</p>
        </div>`;
      totalEl.textContent = '0 جنيه';
      renderCouponBox(subtotal);
      return;
    }

    container.innerHTML = cartService.items.map(item => `
      <div class="flex items-center gap-3 p-3.5 rounded-xl transition-all" style="background:rgba(10,20,40,0.6);border:1px solid rgba(255,255,255,0.06)">
        <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-cover rounded-xl border border-white/10 flex-shrink-0">
        <div class="flex-1 min-w-0">
          <div class="font-bold text-white text-sm truncate">${item.title}</div>
          <div class="text-xs text-cyan-400 font-semibold mt-0.5">${item.price} جنيه × ${item.quantity}</div>
        </div>
        <div class="flex flex-col items-end gap-1.5">
          <span class="font-black text-amber-400 text-sm">${item.price * item.quantity} جنيه</span>
          <button onclick="removeFromCart('${item.id}')" class="text-slate-600 hover:text-rose-400 transition-colors text-xs font-bold">إزالة ✕</button>
        </div>
      </div>
    `).join('');

    renderCouponBox(subtotal);

    totalEl.textContent = `${finalTotal} جنيه`;
  }

  function renderCouponBox(subtotal) {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    let cSec = document.getElementById('coupon-section');
    if (cSec) cSec.remove();

    if (cartService.items.length === 0) return;

    cSec = document.createElement('div');
    cSec.id = 'coupon-section';
    cSec.className = 'mt-4';

    if (activeCoupon) {
      const discount = calcDiscount(activeCoupon, subtotal);
      cSec.innerHTML = `
        <div class="p-3.5 rounded-xl flex items-center justify-between gap-3" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25)">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🏷️</span>
            <div>
              <div class="font-black text-emerald-400 text-xs tracking-wider">${activeCoupon.code}</div>
              <div class="text-[11px] text-slate-400 font-semibold mt-0.5">
                ${activeCoupon.type === 'percent' ? `خصم ${activeCoupon.value}%` : `خصم ثابت ${activeCoupon.value} جنيه`}
                — وفّرت <strong class="text-emerald-400 font-bold">${discount} جنيه</strong>
              </div>
            </div>
          </div>
          <button onclick="removeCoupon()" class="text-xs text-slate-400 hover:text-rose-400 font-bold px-2 py-1 transition-colors">إلغاء ✕</button>
        </div>`;
    } else {
      cSec.innerHTML = `
        <div class="p-3.5 rounded-xl border border-white/6 space-y-2.5" style="background:rgba(10,20,40,0.4)">
          <div class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            🏷️ <span>لديك كوبون خصم؟</span>
          </div>
          <div class="flex gap-2">
            <input id="coupon-input" type="text" placeholder="أدخل كود الخصم (مثل KHALED10)"
              class="flex-1 bg-[#060d1a] border border-[#1a3050] rounded-xl px-3 py-2 text-white text-xs font-bold outline-none uppercase transition-colors focus:border-cyan-400"
              oninput="this.value=this.value.toUpperCase()"
              onkeydown="if(event.key==='Enter')applyCoupon()">
            <button onclick="applyCoupon()" class="btn-primary px-4 py-2 text-xs font-black rounded-xl">
              تفعيل
            </button>
          </div>
          <div id="coupon-msg" class="text-xs font-bold hidden"></div>
        </div>`;
    }

    container.appendChild(cSec);
  }

  // ══════════════════════════════════════════
  //  COUPON HANDLERS
  // ══════════════════════════════════════════
  window.applyCoupon = function () {
    const input = document.getElementById('coupon-input');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (!code) { showCouponMsg('يرجى كتابة كود الخصم أولاً', false); return; }

    const subtotal = cartService.getSubtotal();
    const result = validateCoupon(code, subtotal);

    if (!result.valid) {
      showCouponMsg(result.error, false);
      input.style.borderColor = '#f87171';
      return;
    }

    activeCoupon = result.coupon;
    syncCartUI();
    notifyUser(`تم تطبيق الكوبون بنجاح: "${code}" 🎉`, '🏷️');
  };

  window.removeCoupon = function () {
    activeCoupon = null;
    syncCartUI();
    notifyUser('تم إزالة كود الخصم', '✖️');
  };

  function showCouponMsg(text, success) {
    const msg = document.getElementById('coupon-msg');
    if (!msg) return;
    msg.textContent = text;
    msg.style.display = 'block';
    msg.className = `text-xs font-bold ${success ? 'text-emerald-400' : 'text-rose-400'}`;
  }

  // ══════════════════════════════════════════
  //  CART ACTIONS
  // ══════════════════════════════════════════
  window.addToCart = function (productId) {
    const product = cartService.addItem(productId);
    if (product) {
      syncCartUI();
      notifyUser(`تمت إضافة "${product.title}" للسلة 🛒`, '⚡');
    }
  };

  window.removeFromCart = function (productId) {
    cartService.removeItem(productId);
    if (activeCoupon) {
      const check = validateCoupon(activeCoupon.code, cartService.getTotalAmount ? cartService.getSubtotal() : 0);
      if (!check.valid) { activeCoupon = null; notifyUser('تم إلغاء الكوبون — الإجمالي أصبح أقل من الحد الأدنى', '⚠️'); }
    }
    syncCartUI();
    notifyUser('تم إزالة المنتج من السلة', '🗑️');
  };

  window.toggleCart = function () {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer || !overlay) return;
    const isOpen = drawer.classList.contains('open');
    if (isOpen) { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }
    else        { drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  };

  window.toggleSearchModal = function () {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    if (!modal) return;
    const hidden = modal.classList.contains('hidden');
    modal.classList.toggle('hidden', !hidden);
    modal.classList.toggle('flex', hidden);
    if (hidden && input) input.focus();
  };

  // ══════════════════════════════════════════
  //  NATIVE ON-SITE CHECKOUT & INVOICE MODAL
  // ══════════════════════════════════════════
  window.checkout = function () {
    if (cartService.items.length === 0) { notifyUser('السلة فارغة حالياً!', '⚠️'); return; }
    closeCartDrawer();
    openCheckoutModal();
  };

  function closeCartDrawer() {
    const drawer  = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openCheckoutModal() {
    let modal = document.getElementById('native-checkout-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'native-checkout-modal';
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto';
      document.body.appendChild(modal);
    }

    const subtotal   = cartService.getSubtotal();
    const discount   = calcDiscount(activeCoupon, subtotal);
    const finalTotal = subtotal - discount;

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/75 backdrop-blur-md" onclick="closeCheckoutModal()"></div>
      <div class="relative w-full max-w-xl glass rounded-3xl overflow-hidden shadow-2xl z-10 border border-white/10 my-8">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0b1628]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">🛒</div>
            <div>
              <h3 class="font-black text-white text-lg">إتمام الطلب المباشر</h3>
              <p class="text-xs text-slate-400">أدخل بياناتك لاستلام إيصال الحساب فورا</p>
            </div>
          </div>
          <button onclick="closeCheckoutModal()" class="w-8 h-8 rounded-lg bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-all">✕</button>
        </div>

        <!-- Body -->
        <form onsubmit="submitNativeOrder(event)" class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          <!-- Order summary card -->
          <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
            <div class="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">ملخص المنتجات</div>
            ${cartService.items.map(i => `
              <div class="flex justify-between text-xs font-bold text-slate-300">
                <span>${i.title} × ${i.quantity}</span>
                <span>${i.price * i.quantity} جنيه</span>
              </div>
            `).join('')}
            <div class="border-t border-white/10 pt-2 mt-2 space-y-1">
              <div class="flex justify-between text-xs text-slate-400">
                <span>المجموع الفرعي:</span>
                <span>${subtotal} جنيه</span>
              </div>
              ${discount > 0 ? `
                <div class="flex justify-between text-xs text-emerald-400 font-bold">
                  <span>خصم الكوبون (${activeCoupon.code}):</span>
                  <span>- ${discount} جنيه</span>
                </div>
              ` : ''}
              <div class="flex justify-between text-base font-black text-amber-400 pt-1">
                <span>الإجمالي النهائي:</span>
                <span>${finalTotal} جنيه</span>
              </div>
            </div>
          </div>

          <!-- Customer details -->
          <div class="space-y-4">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">1. بيانات المشترين</div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">الاسم بالكامل *</label>
                <input type="text" id="chk-name" required placeholder="أحمد محمد" class="w-full bg-[#060d1a] border border-[#1a3050] rounded-xl px-3.5 py-2.5 text-white text-xs font-bold outline-none focus:border-cyan-400">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف / الواتساب *</label>
                <input type="tel" id="chk-phone" required placeholder="01012345678" class="w-full bg-[#060d1a] border border-[#1a3050] rounded-xl px-3.5 py-2.5 text-white text-xs font-bold outline-none focus:border-cyan-400">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">ملاحظات / معرف الحساب (اختياري)</label>
              <input type="text" id="chk-notes" placeholder="ملاحظات التسليم أو معرف اللعبة" class="w-full bg-[#060d1a] border border-[#1a3050] rounded-xl px-3.5 py-2.5 text-white text-xs font-bold outline-none focus:border-cyan-400">
            </div>
          </div>

          <!-- Payment methods -->
          <div class="space-y-3 pt-2">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">2. اختر طريقة الدفع المفضلة</div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="relative flex flex-col p-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 cursor-pointer select-none">
                <input type="radio" name="pay-method" value="Vodafone Cash" checked class="hidden" onchange="highlightPayMethod(this)">
                <span class="text-sm font-black text-white mb-1">📱 فودافون كاش</span>
                <span class="text-[10px] text-cyan-300">تحويل فوري كاش</span>
              </label>

              <label class="relative flex flex-col p-3 rounded-xl border border-white/10 bg-slate-900 cursor-pointer select-none">
                <input type="radio" name="pay-method" value="InstaPay" class="hidden" onchange="highlightPayMethod(this)">
                <span class="text-sm font-black text-white mb-1">⚡ انستاباي</span>
                <span class="text-[10px] text-slate-400">تحويل لحظي بنكي</span>
              </label>

              <label class="relative flex flex-col p-3 rounded-xl border border-white/10 bg-slate-900 cursor-pointer select-none">
                <input type="radio" name="pay-method" value="Credit Card" class="hidden" onchange="highlightPayMethod(this)">
                <span class="text-sm font-black text-white mb-1">💳 بطاقة ائتمان</span>
                <span class="text-[10px] text-slate-400">فيزا / ماستركارد</span>
              </label>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-primary w-full py-4 text-base font-black rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01]">
            تأكيد واستلام الطلب 🚀
          </button>
        </form>
      </div>
    `;

    document.body.style.overflow = 'hidden';
  }

  window.closeCheckoutModal = function () {
    const modal = document.getElementById('native-checkout-modal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
  };

  window.highlightPayMethod = function (radio) {
    const labels = radio.closest('form').querySelectorAll('label');
    labels.forEach(l => {
      l.className = 'relative flex flex-col p-3 rounded-xl border border-white/10 bg-slate-900 cursor-pointer select-none';
    });
    radio.parentElement.className = 'relative flex flex-col p-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 cursor-pointer select-none';
  };

  window.submitNativeOrder = function (e) {
    e.preventDefault();
    const name    = document.getElementById('chk-name').value.trim();
    const phone   = document.getElementById('chk-phone').value.trim();
    const notes   = document.getElementById('chk-notes').value.trim();
    const method  = document.querySelector('input[name="pay-method"]:checked').value;

    const subtotal   = cartService.getSubtotal();
    const discount   = calcDiscount(activeCoupon, subtotal);
    const finalTotal = subtotal - discount;
    const orderId    = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr    = new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const orderRecord = {
      id: orderId,
      date: dateStr,
      customerName: name,
      customerPhone: phone,
      paymentMethod: method,
      notes: notes,
      items: [...cartService.items],
      subtotal: subtotal,
      discount: discount,
      couponCode: activeCoupon ? activeCoupon.code : null,
      total: finalTotal,
      status: 'قيد الانتظار'
    };

    // Store in Orders DB
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      orders.unshift(orderRecord);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (err) { console.error('Save order failed', err); }

    // Consume coupon
    if (activeCoupon) {
      consumeCoupon(activeCoupon.code);
      activeCoupon = null;
    }

    // Clear cart
    cartService.clear();
    syncCartUI();

    // Close checkout & Open Invoice Modal
    closeCheckoutModal();
    openInvoiceModal(orderRecord);
  };

  function openInvoiceModal(order) {
    let modal = document.getElementById('invoice-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'invoice-modal';
      modal.className = 'fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto';
      document.body.appendChild(modal);
    }

    const vfNumber = StoreSettings.vfCash || '01000000000';
    const instaId  = StoreSettings.instapay || 'khaledzone@instapay';

    let payInstruction = '';
    if (order.paymentMethod === 'Vodafone Cash') {
      payInstruction = `حول المبلغ إلى حساب فودافون كاش: <strong class="text-amber-400 font-mono text-sm">${vfNumber}</strong>`;
    } else if (order.paymentMethod === 'InstaPay') {
      payInstruction = `حول المبلغ عبر انستاباي لمعرف: <strong class="text-cyan-400 font-mono text-sm">${instaId}</strong>`;
    } else {
      payInstruction = `تم تسجيل الدفع بالبطاقة بنجاح وجارٍ مراجعة العملية تلقائياً.`;
    }

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md"></div>
      <div class="relative w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl z-10 border border-emerald-500/30 p-6 space-y-5 my-8 text-right">
        
        <div class="text-center space-y-2">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-3xl mx-auto animate-bounce-slow">✅</div>
          <h2 class="font-black text-white text-2xl">تم تأكيد طلبك بنجاح!</h2>
          <p class="text-xs text-slate-400">فاتورة الطلب متزامنة مع نظام المتجر</p>
        </div>

        <!-- Invoice Box -->
        <div class="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <div class="text-[10px] text-slate-500 font-bold uppercase">رقم الطلب</div>
              <div class="font-black text-cyan-400 font-mono text-base">${order.id}</div>
            </div>
            <div class="text-left">
              <div class="text-[10px] text-slate-500 font-bold uppercase">الحالة</div>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">⏳ قيد الانتظار</span>
            </div>
          </div>

          <div class="space-y-1.5 text-xs text-slate-300">
            <div><strong>اسم العميل:</strong> ${order.customerName}</div>
            <div><strong>الهاتف:</strong> ${order.customerPhone}</div>
            <div><strong>طريقة الدفع:</strong> ${order.paymentMethod}</div>
            ${order.couponCode ? `<div class="text-emerald-400"><strong>الكوبون المستخدم:</strong> ${order.couponCode} (- ${order.discount} جنيه)</div>` : ''}
          </div>

          <div class="border-t border-white/10 pt-3">
            <div class="text-xs font-bold text-slate-400 mb-1">المنتجات المطلوب تسليمها:</div>
            ${order.items.map(i => `<div class="text-xs text-white font-bold flex justify-between"><span>• ${i.title} (×${i.quantity})</span><span>${i.price * i.quantity} جنيه</span></div>`).join('')}
            <div class="flex justify-between font-black text-amber-400 text-lg pt-2 border-t border-white/10 mt-2">
              <span>الإجمالي الكلي:</span>
              <span>${order.total} جنيه</span>
            </div>
          </div>
        </div>

        <!-- Payment Instructions Box -->
        <div class="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-slate-300 space-y-2">
          <div class="font-bold text-cyan-400 flex items-center gap-1.5">
            <span>💡 تعليمات إتمام التسليم:</span>
          </div>
          <div>${payInstruction}</div>
          <div class="text-[11px] text-slate-400">احتفظ برقم الطلب <strong class="text-white">${order.id}</strong> — ستقوم الإدارة بالتسليم في أقرب وقت.</div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 pt-2">
          <button onclick="closeInvoiceModal()" class="btn-primary flex-1 py-3 text-sm font-black rounded-xl">
            متابعة التسوق 🛍️
          </button>
          <a href="https://wa.me/${StoreSettings.phone||'201000000000'}?text=${encodeURIComponent(`تأكيد طلب [${order.id}]\nالاسم: ${order.customerName}\nالإجمالي: ${order.total} جنيه`)}" target="_blank" class="btn-orange flex-1 py-3 text-sm font-black rounded-xl flex items-center justify-center gap-1.5">
            واتساب (إختياري)
          </a>
        </div>

      </div>
    `;

    document.body.style.overflow = 'hidden';
  }

  window.closeInvoiceModal = function () {
    const modal = document.getElementById('invoice-modal');
    if (modal) modal.remove();
    document.body.style.overflow = '';
  };

  // ══════════════════════════════════════════
  //  SEARCH
  // ══════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    syncCartUI();

    const searchInput   = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) { searchResults.innerHTML = '<p class="text-slate-400 text-sm text-center py-4 font-semibold">اكتب للبحث في المتجر...</p>'; return; }
        const matches = CatalogRepository.filter(p => p.title.toLowerCase().includes(q) || p.subTitle.toLowerCase().includes(q));
        if (!matches.length) { searchResults.innerHTML = '<p class="text-slate-400 text-sm text-center py-4 font-semibold">لم يتم العثور على نتائج</p>'; return; }
        searchResults.innerHTML = matches.map(p => `
          <a href="/product?id=${p.id}" class="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group">
            <div class="flex items-center gap-3">
              <img src="${p.image}" class="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0">
              <div>
                <div class="font-bold text-white text-sm">${p.title}</div>
                <div class="text-xs text-slate-500">${p.subTitle}</div>
              </div>
            </div>
            <span class="font-black text-amber-400 text-sm">${p.price} جنيه</span>
          </a>
        `).join('');
      });
    }
  });

})();
