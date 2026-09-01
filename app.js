(function () {
  'use strict';

  // ── Storage Keys ──
  const STORAGE_KEY      = 'khaled_zone_cart';
  const PRODUCTS_KEY     = 'khaled_zone_products';
  const ORDERS_KEY       = 'khaled_zone_orders';
  const SETTINGS_KEY     = 'khaled_zone_settings';
  const COUPONS_KEY      = 'khaled_zone_coupons';

  // ── Active coupon state ──
  let activeCoupon = null;

  // ── Default coupons (seeded once) ──
  const DEFAULT_COUPONS = [
    { id: 'cpn-1', code: 'KHALED10', type: 'percent', value: 10, minOrder: 0,  maxUses: 100, usedCount: 0, expiresAt: '2026-12-31', active: true, createdAt: '2026-09-01' },
    { id: 'cpn-2', code: 'SAVE30',   type: 'fixed',   value: 30, minOrder: 100, maxUses: 50,  usedCount: 0, expiresAt: '2026-11-30', active: true, createdAt: '2026-09-01' },
    { id: 'cpn-3', code: 'VIP50',    type: 'percent', value: 50, minOrder: 200, maxUses: 10,  usedCount: 0, expiresAt: '2026-10-01', active: true, createdAt: '2026-09-01' },
  ];

  // ── Product catalog ──
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
      return s ? JSON.parse(s) : { phone: '201000000000', storeStatus: 'active' };
    } catch { return { phone: '201000000000', storeStatus: 'active' }; }
  }

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

  /**
   * Validate a coupon code against the current cart total.
   * Returns { valid, coupon, error } 
   */
  function validateCoupon(code, cartTotal) {
    const coupons = loadCoupons();
    const c = coupons.find(x => x.code.toUpperCase() === code.toUpperCase().trim());

    if (!c)            return { valid: false, error: 'كود الخصم غير صحيح ❌' };
    if (!c.active)     return { valid: false, error: 'هذا الكود غير مفعّل ⛔' };

    const today = new Date().toISOString().split('T')[0];
    if (c.expiresAt && today > c.expiresAt)
                       return { valid: false, error: 'انتهت صلاحية الكود 📅' };
    if (c.maxUses !== null && c.usedCount >= c.maxUses)
                       return { valid: false, error: 'تم استنفاد هذا الكود ⚠️' };
    if (cartTotal < c.minOrder)
                       return { valid: false, error: `الحد الأدنى للطلب ${c.minOrder} جنيه 🛒` };

    return { valid: true, coupon: c };
  }

  /**
   * Calculate discount amount from a coupon and subtotal.
   */
  function calcDiscount(coupon, subtotal) {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return Math.round((subtotal * coupon.value) / 100);
    return Math.min(coupon.value, subtotal); // fixed — never exceed total
  }

  /**
   * Mark coupon as used (+1 usedCount). Called on checkout.
   */
  function consumeCoupon(code) {
    const coupons = loadCoupons();
    const c = coupons.find(x => x.code.toUpperCase() === code.toUpperCase());
    if (c) { c.usedCount += 1; saveCoupons(coupons); }
  }

  // ══════════════════════════════════════════
  //  CART MANAGER
  // ══════════════════════════════════════════
  const CatalogRepository = loadProducts();
  const StoreSettings = loadSettings();
  window.products = CatalogRepository;

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
  //  UI SYNC
  // ══════════════════════════════════════════
  function notifyUser(message, icon = '⚡') {
    // Use page toast if available, else create one
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
      }, 3000);
      return;
    }
    // Fallback: inject a toast
    const t = document.createElement('div');
    t.className = 'fixed bottom-6 left-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm text-white shadow-2xl transition-all';
    t.style.cssText = 'background:rgba(15,28,55,0.95);border:1px solid rgba(56,189,248,0.3);backdrop-filter:blur(20px)';
    t.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function syncCartUI() {
    const badge      = document.getElementById('cart-badge');
    const container  = document.getElementById('cart-items-container');
    const totalEl    = document.getElementById('cart-total');
    const countText  = document.getElementById('cart-count-text');

    // Badge
    if (badge) {
      const count = cartService.getTotalCount();
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
        badge.classList.add('flex');
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
      }
    }

    if (!container || !totalEl) return;

    const subtotal = cartService.getSubtotal();
    const discount = calcDiscount(activeCoupon, subtotal);
    const finalTotal = subtotal - discount;

    if (countText) countText.textContent = `${cartService.getTotalCount()} منتجات`;

    if (cartService.items.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
          <div class="text-5xl">🛒</div>
          <p class="font-bold text-slate-400">السلة فارغة</p>
          <p class="text-xs text-slate-600">تصفح المنتجات وأضف ما يعجبك!</p>
        </div>`;
      totalEl.textContent = '0 جنيه';
      renderCouponSection(subtotal);
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

    // Coupon UI
    renderCouponSection(subtotal);

    // Totals
    let totalsHTML = `
      <div class="flex justify-between text-sm text-slate-400 font-semibold">
        <span>المجموع الفرعي</span><span>${subtotal} جنيه</span>
      </div>`;
    if (discount > 0) {
      totalsHTML += `
      <div class="flex justify-between text-sm font-bold text-emerald-400">
        <span>خصم الكوبون (${activeCoupon.code})</span><span>- ${discount} جنيه</span>
      </div>`;
    }
    totalEl.textContent = `${finalTotal} جنيه`;
  }

  function renderCouponSection(subtotal) {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    // Remove old coupon section if exists
    const old = document.getElementById('coupon-section');
    if (old) old.remove();

    if (cartService.items.length === 0) return;

    const section = document.createElement('div');
    section.id = 'coupon-section';

    if (activeCoupon) {
      const discount = calcDiscount(activeCoupon, subtotal);
      section.innerHTML = `
        <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:14px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">🏷️</span>
            <div>
              <div style="font-weight:900;color:#34d399;font-size:13px">${activeCoupon.code}</div>
              <div style="font-size:11px;color:#475569;margin-top:2px">
                ${activeCoupon.type === 'percent' ? `خصم ${activeCoupon.value}%` : `خصم ثابت ${activeCoupon.value} جنيه`}
                — وفّرت <strong style="color:#34d399">${discount} جنيه</strong>
              </div>
            </div>
          </div>
          <button onclick="removeCoupon()" style="font-size:11px;font-weight:700;color:#64748b;cursor:pointer;background:none;border:none;padding:4px 8px;border-radius:6px;hover:color:#f87171">إلغاء ✕</button>
        </div>`;
    } else {
      section.innerHTML = `
        <div style="border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px 16px">
          <div style="font-size:11.5px;font-weight:700;color:#475569;margin-bottom:10px;display:flex;align-items:center;gap:6px">
            🏷️ <span>لديك كوبون خصم؟</span>
          </div>
          <div style="display:flex;gap:8px">
            <input id="coupon-input" type="text" placeholder="أدخل كود الخصم"
              style="flex:1;background:#060d1a;border:1px solid #1a3050;border-radius:10px;padding:9px 12px;color:#f1f5f9;font-size:13px;outline:none;font-family:Cairo,sans-serif;text-transform:uppercase"
              oninput="this.value=this.value.toUpperCase()"
              onkeydown="if(event.key==='Enter')applyCoupon()">
            <button onclick="applyCoupon()" 
              style="padding:9px 16px;background:linear-gradient(135deg,#0ea5e9,#0369a1);border:none;border-radius:10px;color:white;font-weight:900;font-size:12.5px;cursor:pointer;font-family:Cairo,sans-serif;transition:all 0.2s;white-space:nowrap">
              تفعيل
            </button>
          </div>
          <div id="coupon-msg" style="margin-top:8px;font-size:12px;font-weight:700;display:none"></div>
        </div>`;
    }

    container.appendChild(section);
  }

  // ══════════════════════════════════════════
  //  COUPON PUBLIC API
  // ══════════════════════════════════════════
  window.applyCoupon = function () {
    const input = document.getElementById('coupon-input');
    const msg   = document.getElementById('coupon-msg');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (!code) { showCouponMsg('أدخل كود الخصم أولاً', false); return; }

    const subtotal = cartService.getSubtotal();
    const result = validateCoupon(code, subtotal);

    if (!result.valid) {
      showCouponMsg(result.error, false);
      input.style.borderColor = '#f87171';
      return;
    }

    activeCoupon = result.coupon;
    syncCartUI();
    notifyUser(`تم تفعيل كوبون الخصم "${code}" 🎉`, '🏷️');
  };

  window.removeCoupon = function () {
    activeCoupon = null;
    syncCartUI();
    notifyUser('تم إلغاء كوبون الخصم', '✖️');
  };

  function showCouponMsg(text, success) {
    const msg = document.getElementById('coupon-msg');
    if (!msg) return;
    msg.textContent = text;
    msg.style.display = 'block';
    msg.style.color = success ? '#34d399' : '#f87171';
  }

  // ══════════════════════════════════════════
  //  GLOBAL CART ACTIONS
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
    // Re-validate coupon against new total
    if (activeCoupon) {
      const check = validateCoupon(activeCoupon.code, cartService.getSubtotal());
      if (!check.valid) { activeCoupon = null; notifyUser('تم إلغاء الكوبون تلقائياً — الإجمالي أصبح أقل من الحد الأدنى', '⚠️'); }
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

  window.openProductModal = function (productId) {
    window.location.href = `/product?id=${productId}`;
  };

  window.checkout = function () {
    if (cartService.items.length === 0) { notifyUser('السلة فارغة!', '⚠️'); return; }

    const subtotal = cartService.getSubtotal();
    const discount = calcDiscount(activeCoupon, subtotal);
    const finalTotal = subtotal - discount;
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const itemsSummary = cartService.items.map(i => `• ${i.title} (${i.quantity}x) — ${i.price * i.quantity} جنيه`).join('%0A');
    const couponLine   = activeCoupon ? `%0Aكوبون الخصم: ${activeCoupon.code} (- ${discount} جنيه)` : '';
    const message      = `مرحباً، أريد إتمام طلب رقم [${orderId}] من KHALED ZONE:%0A${itemsSummary}${couponLine}%0A%0Aالإجمالي بعد الخصم: ${finalTotal} جنيه`;

    // Record order
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      orders.unshift({
        id: orderId,
        date: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        items: cartService.items,
        subtotal,
        discount,
        total: finalTotal,
        coupon: activeCoupon ? activeCoupon.code : null,
        status: 'قيد الانتظار'
      });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch {}

    // Consume coupon
    if (activeCoupon) { consumeCoupon(activeCoupon.code); activeCoupon = null; }

    const phone = StoreSettings.phone || '201000000000';
    alert(`🎉 شكراً لطلبك!\n\nرقم الطلب: ${orderId}\nالمبلغ الكلي: ${finalTotal} جنيه${discount > 0 ? `\n✅ وفّرت ${discount} جنيه بالكوبون` : ''}\n\nسيتم توجيهك للواتساب لتأكيد الطلب.`);
    cartService.clear();
    syncCartUI();
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
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
