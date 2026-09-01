// KHALED ZONE - Interactive UI Logic & State Management

document.addEventListener('DOMContentLoaded', () => {
  // State
  let cart = [];
  const cartBadge = document.getElementById('cart-badge');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalEl = document.getElementById('cart-total');
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const productModal = document.getElementById('product-modal');

  // Sample Products Data
  const products = [
    {
      id: 'gta5-account',
      title: 'GTA 5 Account',
      subTitle: 'GTAH ECCIDA COME V / GTA 5 Argaent',
      price: 120,
      badge: 'الأكثر مبيعاً 🔥',
      image: 'assets/gta5_cover.svg',
      category: 'accounts',
      rating: '4.9 ★',
      features: ['تفعيل فوري ⚡', 'ضمان مدى الحياة 🛡️', 'حساب كامل الملكية 👑', 'لعبة GTA V + GTA Online']
    },
    {
      id: 'fivem-account',
      title: 'FiveM Account',
      subTitle: 'FiveM Fliccount / FiveM حساب',
      price: 100,
      badge: 'جديد ⚡',
      image: 'assets/fivem_cover.svg',
      category: 'fivem',
      rating: '4.8 ★',
      features: ['جاهز للرول بلاي 🎭', 'تخطي حظر السيرفرات 🔓', 'تسليم آلي 🤖', 'دعم سيرفرات عربية']
    },
    {
      id: 'rdr2-account',
      title: 'RDR2 Account',
      subTitle: 'Red Dead Redemption 2',
      price: 150,
      badge: 'مميز ⭐',
      image: 'assets/rdr2_cover.svg',
      category: 'accounts',
      rating: '5.0 ★',
      features: ['نموذج القصة كامل 🤠', 'Red Dead Online 🐎', 'بيانات تغيير كاملة 🔑', 'تسليم آلي ⚡']
    },
    {
      id: 'fortnite-account',
      title: 'Fortnite Account',
      subTitle: 'Fortnite Skin Account',
      price: 90,
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
      badge: 'عروض 💥',
      image: 'assets/minecraft_cover.svg',
      category: 'accounts',
      rating: '4.9 ★',
      features: ['Java & Bedrock Edition 🧱', 'تغيير السكن والاسم 👤', 'دخول سيرفر Hypixel 🏰', 'ضمان الذهبي 🏅']
    }
  ];

  // Global Functions Attached to Window for HTML Handlers
  window.addToCart = function (productId) {
    const item = products.find(p => p.id === productId);
    if (!item) return;

    const existingIndex = cart.findIndex(ci => ci.id === productId);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    updateCartUI();
    showToast(`تمت إضافة "${item.title}" إلى السلة بنجاح! 🛒`);
  };

  window.removeFromCart = function (productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    showToast('تم إزالة المنتج من السلة');
  };

  window.toggleCart = function () {
    if (cartDrawer.classList.contains('translate-x-full')) {
      cartDrawer.classList.remove('translate-x-full');
      cartOverlay.classList.remove('hidden');
    } else {
      cartDrawer.classList.add('translate-x-full');
      cartOverlay.classList.add('hidden');
    }
  };

  window.toggleSearchModal = function () {
    if (searchModal.classList.contains('hidden')) {
      searchModal.classList.remove('hidden');
      searchInput.focus();
    } else {
      searchModal.classList.add('hidden');
    }
  };

  window.openProductModal = function (productId) {
    const item = products.find(p => p.id === productId);
    if (!item) return;

    document.getElementById('modal-title').textContent = item.title;
    document.getElementById('modal-subtitle').textContent = item.subTitle;
    document.getElementById('modal-price').textContent = `${item.price} جنيه`;
    document.getElementById('modal-badge').textContent = item.badge;
    document.getElementById('modal-img').src = item.image;
    
    const featuresList = document.getElementById('modal-features');
    featuresList.innerHTML = item.features.map(f => `<li class="flex items-center gap-2"><span class="text-cyan-400">✓</span> ${f}</li>`).join('');

    const buyBtn = document.getElementById('modal-buy-btn');
    buyBtn.onclick = () => {
      window.addToCart(item.id);
      window.closeProductModal();
    };

    productModal.classList.remove('hidden');
  };

  window.closeProductModal = function () {
    productModal.classList.add('hidden');
  };

  window.checkout = function () {
    if (cart.length === 0) {
      showToast('السلة فارغة حالياً!');
      return;
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    alert(`🎉 شكراً لطلبك من KHALED ZONE!\n\nإجمالي الطلب: ${total} جنيه\nسيتم توجيهك الآن للواتساب لتأكيد الاستلام الفوري.`);
    cart = [];
    updateCartUI();
    window.toggleCart();
  };

  // Helper Functions
  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;

    if (totalCount > 0) {
      cartBadge.classList.add('bg-orange-500', 'badge-pulse');
      cartBadge.classList.remove('bg-gray-700');
    } else {
      cartBadge.classList.remove('bg-orange-500', 'badge-pulse');
      cartBadge.classList.add('bg-gray-700');
    }

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <div class="text-5xl mb-3">🛒</div>
          <p class="text-lg">السلة فارغة حالياً</p>
          <p class="text-sm text-gray-500 mt-1">تصفح المنتجات وأضف ما يعجبك!</p>
        </div>
      `;
      cartTotalEl.textContent = '0 جنيه';
      return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.quantity;
      html += `
        <div class="flex items-center justify-between p-3 bg-navy-900/60 rounded-xl border border-cyan-500/20">
          <div class="flex items-center gap-3">
            <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-cover rounded-lg border border-cyan-400/30">
            <div>
              <h4 class="font-bold text-white text-sm">${item.title}</h4>
              <p class="text-xs text-cyan-400">${item.price} جنيه × ${item.quantity}</p>
            </div>
          </div>
          <button onclick="removeFromCart('${item.id}')" class="text-red-400 hover:text-red-300 text-sm p-1">
            ✕
          </button>
        </div>
      `;
    });

    cartItemsContainer.innerHTML = html;
    cartTotalEl.textContent = `${total} جنيه`;
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 left-6 z-50 bg-cyan-900/90 border border-cyan-400 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md transition-all transform translate-y-4 opacity-0 flex items-center gap-3 font-semibold text-sm';
    toast.innerHTML = `<span>⚡</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Live Search Handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        searchResults.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">اكتب اسم اللعبة أو الخدمة للبحث...</p>';
        return;
      }
      const filtered = products.filter(p => p.title.toLowerCase().includes(query) || p.subTitle.toLowerCase().includes(query));
      if (filtered.length === 0) {
        searchResults.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">لم يتم العثور على نتائج</p>';
      } else {
        searchResults.innerHTML = filtered.map(p => `
          <div onclick="openProductModal('${p.id}'); toggleSearchModal();" class="flex items-center justify-between p-3 hover:bg-cyan-950/60 rounded-xl cursor-pointer border border-transparent hover:border-cyan-500/30 transition">
            <div class="flex items-center gap-3">
              <img src="${p.image}" class="w-10 h-10 rounded-lg object-cover">
              <div>
                <div class="font-bold text-white text-sm">${p.title}</div>
                <div class="text-xs text-gray-400">${p.subTitle}</div>
              </div>
            </div>
            <div class="text-cyan-400 font-bold text-sm">${p.price} جنيه</div>
          </div>
        `).join('');
      }
    });
  }
});
