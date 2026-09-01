(function () {
  'use strict';

  const STORAGE_KEY = 'khaled_zone_cart';
  const PRODUCTS_STORAGE_KEY = 'khaled_zone_products';
  const ORDERS_STORAGE_KEY = 'khaled_zone_orders';
  const SETTINGS_STORAGE_KEY = 'khaled_zone_settings';

  const DefaultProducts = [
    {
      id: 'gta5-account',
      title: 'GTA 5 Account',
      subTitle: 'GTAH ECCIDA COME V / GTA 5 Argaent',
      price: 120,
      oldPrice: 160,
      badge: 'الأكثر مبيعاً 🔥',
      image: 'assets/gta5_cover.svg',
      category: 'accounts',
      rating: '4.9 ★',
      features: ['تفعيل فوري ⚡', 'ضمان مدى الحياة 🛡️', 'حساب كامل الملكية 👑', 'لعبة GTA V + GTA Online', 'إمكانية تغيير جميع البيانات 🔑']
    },
    {
      id: 'fivem-account',
      title: 'FiveM Account',
      subTitle: 'FiveM Fliccount / FiveM حساب',
      price: 100,
      oldPrice: 140,
      badge: 'جديد ⚡',
      image: 'assets/fivem_cover.svg',
      category: 'fivem',
      rating: '4.8 ★',
      features: ['جاهز للرول بلاي 🎭', 'تخطي حظر السيرفرات 🔓', 'تسليم آلي 🤖', 'دعم سيرفرات عربية وغربية']
    },
    {
      id: 'rdr2-account',
      title: 'RDR2 Account',
      subTitle: 'Red Dead Redemption 2',
      price: 150,
      oldPrice: 200,
      badge: 'مميز ⭐',
      image: 'assets/rdr2_cover.svg',
      category: 'accounts',
      rating: '5.0 ★',
      features: ['طور القصة كامل 🤠', 'Red Dead Online 🐎', 'بيانات تغيير كاملة 🔑', 'تسليم آلي ⚡']
    },
    {
      id: 'fortnite-account',
      title: 'Fortnite Account',
      subTitle: 'Fortnite Skin Account',
      price: 90,
      oldPrice: 120,
      badge: 'خصم 20% 🏷️',
      image: 'assets/fortnite_cover.svg',
      category: 'accounts',
      rating: '4.7 ★',
      features: ['سكنات حصرية 👕', 'رقصات وفأس نادر ⛏️', 'شغال على جميع المنصات 🎮', 'أمان 100% 🔒']
    },
    {
      id: 'minecraft-account',
      title: 'Minecraft Account',
      subTitle: 'Minecraft Java & Bedrock',
      price: 70,
      oldPrice: 100,
      badge: 'عروض 💥',
      image: 'assets/minecraft_cover.svg',
      category: 'accounts',
      rating: '4.9 ★',
      features: ['Java & Bedrock Edition 🧱', 'تغيير السكن والاسم 👤', 'دخول سيرفر Hypixel 🏰', 'ضمان الذهبي 🏅']
    }
  ];

  function loadProducts() {
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(DefaultProducts));
      return DefaultProducts;
    } catch (e) {
      return DefaultProducts;
    }
  }

  function loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { phone: '201000000000', storeStatus: 'active' };
    } catch (e) {
      return { phone: '201000000000', storeStatus: 'active' };
    }
  }

  const CatalogRepository = loadProducts();
  const StoreSettings = loadSettings();
  window.products = CatalogRepository;

  class CartManager {
    constructor() {
      this.items = this.loadState();
    }

    loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        return [];
      }
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch (err) {
        console.error('Cart state save exception:', err);
      }
    }

    addItem(productId) {
      const product = CatalogRepository.find((p) => p.id === productId);
      if (!product) return null;

      const existing = this.items.find((i) => i.id === productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.items.push({ ...product, quantity: 1 });
      }

      this.saveState();
      return product;
    }

    removeItem(productId) {
      this.items = this.items.filter((i) => i.id !== productId);
      this.saveState();
    }

    clear() {
      this.items = [];
      this.saveState();
    }

    getTotalCount() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotalAmount() {
      return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
  }

  const cartService = new CartManager();

  function notifyUser(message) {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-6 left-6 z-50 bg-cyan-900/90 border border-cyan-400 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md transition-all transform translate-y-4 opacity-0 flex items-center gap-3 font-semibold text-sm';
    toast.innerHTML = `<span>⚡</span><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function syncCartUI() {
    const badge = document.getElementById('cart-badge');
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');

    if (badge) {
      const count = cartService.getTotalCount();
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add('bg-orange-500', 'badge-pulse');
        badge.classList.remove('bg-gray-700');
      } else {
        badge.classList.remove('bg-orange-500', 'badge-pulse');
        badge.classList.add('bg-gray-700');
      }
    }

    if (!container || !totalEl) return;

    if (cartService.items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <div class="text-5xl mb-3">🛒</div>
          <p class="text-lg">السلة فارغة حالياً</p>
          <p class="text-sm text-gray-500 mt-1">تصفح المنتجات وأضف ما يعجبك!</p>
        </div>
      `;
      totalEl.textContent = '0 جنيه';
      return;
    }

    container.innerHTML = cartService.items
      .map(
        (item) => `
        <div class="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
          <div class="flex items-center gap-3">
            <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-cover rounded-lg border border-slate-700">
            <div>
              <h4 class="font-bold text-white text-sm">${item.title}</h4>
              <p class="text-xs text-cyan-400">${item.price} جنيه × ${item.quantity}</p>
            </div>
          </div>
          <button onclick="removeFromCart('${item.id}')" class="text-red-400 hover:text-red-300 text-sm p-1">
            ✕
          </button>
        </div>
      `
      )
      .join('');

    totalEl.textContent = `${cartService.getTotalAmount()} جنيه`;
  }

  window.addToCart = function (productId) {
    const product = cartService.addItem(productId);
    if (product) {
      syncCartUI();
      notifyUser(`تمت إضافة "${product.title}" إلى السلة بنجاح! 🛒`);
    }
  };

  window.removeFromCart = function (productId) {
    cartService.removeItem(productId);
    syncCartUI();
    notifyUser('تم إزالة المنتج من السلة');
  };

  window.toggleCart = function () {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer || !overlay) return;

    const isHidden = drawer.classList.contains('translate-x-full');
    drawer.classList.toggle('translate-x-full', !isHidden);
    overlay.classList.toggle('hidden', !isHidden);
  };

  window.toggleSearchModal = function () {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    if (!modal) return;

    const isHidden = modal.classList.contains('hidden');
    modal.classList.toggle('hidden', !isHidden);
    if (isHidden && input) input.focus();
  };

  window.openProductModal = function (productId) {
    window.location.href = `/product?id=${productId}`;
  };

  window.checkout = function () {
    if (cartService.items.length === 0) {
      notifyUser('السلة فارغة حالياً!');
      return;
    }

    const total = cartService.getTotalAmount();
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const summary = cartService.items.map((i) => `• ${i.title} (${i.quantity}x) - ${i.price * i.quantity} جنيه`).join('%0A');
    
    // Record Order in LocalStorage for Admin Dashboard
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
      orders.unshift({
        id: orderId,
        date: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        items: cartService.items,
        total: total,
        status: 'قيد الانتظار'
      });
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {}

    const message = `مرحباً KLIX ! أريد إتمام طلب رقم [${orderId}] من KHALED ZONE:%0A${summary}%0A%0Aالإجمالي: ${total} جنيه`;
    const phone = StoreSettings.phone || '201000000000';
    const targetUrl = `https://wa.me/${phone}?text=${message}`;

    alert(`🎉 شكراً لطلبك من KHALED ZONE!\n\nرقم الطلب: ${orderId}\nإجمالي المبلغ: ${total} جنيه\nسيتم توجيهك الآن للواتساب لتأكيد الاستلام الفوري.`);
    cartService.clear();
    syncCartUI();
    window.open(targetUrl, '_blank');
  };

  document.addEventListener('DOMContentLoaded', () => {
    syncCartUI();

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
          searchResults.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">اكتب اسم اللعبة أو الخدمة للبحث...</p>';
          return;
        }

        const matches = CatalogRepository.filter(
          (p) => p.title.toLowerCase().includes(query) || p.subTitle.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
          searchResults.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">لم يتم العثور على نتائج</p>';
        } else {
          searchResults.innerHTML = matches
            .map(
              (p) => `
            <a href="/product?id=${p.id}" class="flex items-center justify-between p-3 hover:bg-slate-900 rounded-xl cursor-pointer border border-transparent hover:border-slate-800 transition-all">
              <div class="flex items-center gap-3">
                <img src="${p.image}" class="w-10 h-10 rounded-lg object-cover">
                <div>
                  <div class="font-bold text-white text-sm">${p.title}</div>
                  <div class="text-xs text-slate-400">${p.subTitle}</div>
                </div>
              </div>
              <div class="text-cyan-400 font-bold text-sm">${p.price} جنيه</div>
            </a>
          `
            )
            .join('');
        }
      });
    }
  });
})();
