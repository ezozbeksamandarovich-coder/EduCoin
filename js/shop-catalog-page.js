(function () {
  const state = {
    config: null,
    currentUser: null,
    allItems: [],
    filteredItems: [],
    selectedItem: null,
  };

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => (
      {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[char]
    ));
  }

  function normalizeText(value) {
    return String(value || '').trim().normalize('NFKC').toLowerCase();
  }

  function svgIcon(name) {
    const icons = {
      coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.5 9.5c.5-1 2-1.5 3.5-.5s1.5 2.5.5 3.5-2.5 1-3.5.5"></path><path d="M12 8v8"></path></svg>',
      shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="20" y1="20" x2="16.65" y2="16.65"></line></svg>',
      eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
      cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"></circle><circle cx="19" cy="20" r="1"></circle><path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L22 7H7"></path></svg>',
      badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m7 11 5-9 5 9"></path><path d="M4.5 11h15L18 22l-6-4-6 4z"></path></svg>',
      stack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"></path><path d="m3 12 9 4.5 9-4.5"></path><path d="m3 16.5 9 4.5 9-4.5"></path></svg>',
      spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z"></path><path d="m19 14 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"></path></svg>',
      empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M9 11h6"></path></svg>',
    };
    return icons[name] || icons.shop;
  }

  function getProductPath(itemId) {
    return `../../products/index.html?id=${encodeURIComponent(itemId)}`;
  }

  function itemVisualMarkup(item) {
    const visual = item.image || item.icon || 'Item';
    if (typeof visual === 'string' && (visual.startsWith('data:') || /^https?:/i.test(visual))) {
      return `<img src="${visual}" alt="${escapeHtml(item.name)}">`;
    }
    return `<span class="market-card__emoji">${escapeHtml(visual)}</span>`;
  }

  function statCard(iconName, value, label, meta) {
    return `
      <div class="market-stat">
        <div class="market-stat__icon">${svgIcon(iconName)}</div>
        <div>
          <div class="market-stat__value">${escapeHtml(value)}</div>
          <div class="market-stat__label">${escapeHtml(label)}</div>
          <div class="market-stat__meta">${escapeHtml(meta)}</div>
        </div>
      </div>
    `;
  }

  function refreshCurrentUser() {
    state.currentUser = EduCoin.getUserById(state.currentUser.id) || state.currentUser;
  }

  function syncUserPanels() {
    const coinText = EduCoin.formatCoins(state.currentUser.coins || 0);
    const topCoinDisplay = document.getElementById('topCoinDisplay');
    const heroCoinBalance = document.getElementById('heroCoinBalance');
    const pageTopbarSubtitle = document.getElementById('pageTopbarSubtitle');

    if (topCoinDisplay) {
      topCoinDisplay.innerHTML = `${svgIcon('coin')}<span>${escapeHtml(coinText)}</span>`;
    }
    if (heroCoinBalance) {
      heroCoinBalance.textContent = coinText;
    }
    if (pageTopbarSubtitle) {
      pageTopbarSubtitle.textContent = `${EduCoin.roleLabel(state.currentUser.role)} uchun ochiq marketplace`;
    }
  }

  function syncTexts() {
    const title = state.config.heroTitle || "EduCoin do'koni";
    const subtitle = state.config.heroSubtitle || "Coinlaringizni foydali mahsulotlarga almashtiring.";
    const topbarTitle = document.getElementById('pageTopbarTitle');
    const heroTitle = document.getElementById('marketHeroTitle');
    const heroSubtitle = document.getElementById('marketHeroSubtitle');

    if (topbarTitle) {
      topbarTitle.textContent = state.config.topbarTitle || "Do'kon";
    }
    if (heroTitle) {
      heroTitle.textContent = title;
    }
    if (heroSubtitle) {
      heroSubtitle.textContent = subtitle;
    }
  }

  function loadItems() {
    state.allItems = EduCoin.getActiveShopItems().map((item) => ({
      ...item,
      category: item.category || 'Umumiy',
      description: item.description || 'Tavsif kiritilmagan.',
      stock: Number(item.stock || 0),
      price: Number(item.price || 0),
    }));
  }

  function getCategories() {
    return Array.from(new Set(state.allItems.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  function populateCategoryOptions() {
    const select = document.getElementById('shopCategoryFilter');
    if (!select) {
      return;
    }
    const currentValue = select.value;
    const categories = getCategories();
    select.innerHTML = ['<option value="">Barcha kategoriyalar</option>']
      .concat(categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
      .join('');
    select.value = categories.includes(currentValue) ? currentValue : '';
  }

  function getFilters() {
    return {
      queryRaw: document.getElementById('shopSearchInput')?.value || '',
      query: normalizeText(document.getElementById('shopSearchInput')?.value || ''),
      category: document.getElementById('shopCategoryFilter')?.value || '',
      availability: document.getElementById('shopAvailabilityFilter')?.value || '',
      sort: document.getElementById('shopSortFilter')?.value || 'recommended',
    };
  }

  function getFilteredItems() {
    const filters = getFilters();
    let items = [...state.allItems];

    if (filters.query) {
      items = items.filter((item) => (
        normalizeText(item.name).includes(filters.query) ||
        normalizeText(item.description).includes(filters.query) ||
        normalizeText(item.category).includes(filters.query)
      ));
    }

    if (filters.category) {
      items = items.filter((item) => item.category === filters.category);
    }

    if (filters.availability === 'affordable') {
      items = items.filter((item) => Number(state.currentUser.coins || 0) >= Number(item.price || 0));
    }

    if (filters.availability === 'low-stock') {
      items = items.filter((item) => Number(item.stock || 0) <= 3);
    }

    if (filters.availability === 'premium') {
      items = items.filter((item) => Number(item.price || 0) >= 500);
    }

    items.sort((left, right) => {
      switch (filters.sort) {
        case 'price-asc':
          return left.price - right.price;
        case 'price-desc':
          return right.price - left.price;
        case 'stock-desc':
          return right.stock - left.stock;
        case 'name-asc':
          return left.name.localeCompare(right.name, 'uz-Latn-UZ');
        case 'recommended':
        default: {
          const leftAffordable = Number(state.currentUser.coins || 0) >= left.price ? 1 : 0;
          const rightAffordable = Number(state.currentUser.coins || 0) >= right.price ? 1 : 0;
          if (leftAffordable !== rightAffordable) {
            return rightAffordable - leftAffordable;
          }
          return left.price - right.price;
        }
      }
    });

    return items;
  }

  function renderStats() {
    const totalItems = state.allItems.length;
    const affordableItems = state.allItems.filter((item) => Number(state.currentUser.coins || 0) >= item.price).length;
    const lowStockItems = state.allItems.filter((item) => Number(item.stock || 0) <= 3).length;
    const totalStock = state.allItems.reduce((sum, item) => sum + Number(item.stock || 0), 0);

    document.getElementById('marketStats').innerHTML = [
      statCard('shop', totalItems.toLocaleString(), 'Mavjud mahsulotlar', 'Faol do\'kon katalogi'),
      statCard('coin', affordableItems.toLocaleString(), 'Sotib olsa bo\'ladiganlari', 'Balansingizga mos mahsulotlar'),
      statCard('stack', totalStock.toLocaleString(), 'Jami stock', 'Hozir omborda qolgan birliklar'),
      statCard('spark', lowStockItems.toLocaleString(), 'Tez tugayotganlar', '3 ta yoki undan kam qolgan'),
    ].join('');
  }

  function renderMeta() {
    const filters = getFilters();
    const parts = [];

    if (filters.queryRaw.trim()) {
      parts.push(`Qidiruv: "${filters.queryRaw.trim()}"`);
    }
    if (filters.category) {
      parts.push(`Kategoriya: ${filters.category}`);
    }
    if (filters.availability === 'affordable') {
      parts.push('Faqat mos keladiganlar');
    }
    if (filters.availability === 'low-stock') {
      parts.push('Kam qolganlar');
    }
    if (filters.availability === 'premium') {
      parts.push('Premium narxdagilar');
    }

    const hint = parts.length
      ? `${parts.join(' | ')} | Saralash: ${getSortLabel(filters.sort)}`
      : `Barcha mahsulotlar ko'rsatilmoqda | Saralash: ${getSortLabel(filters.sort)}`;

    document.getElementById('marketFilterHint').textContent = hint;
    document.getElementById('marketResultCount').textContent = `${state.filteredItems.length} ta natija`;
  }

  function getSortLabel(value) {
    return {
      recommended: 'Tavsiya etilgan',
      'price-asc': 'Narxi arzonidan',
      'price-desc': 'Narxi qimmatidan',
      'stock-desc': 'Stock bo\'yicha',
      'name-asc': 'Nom bo\'yicha A-Z',
    }[value] || 'Tavsiya etilgan';
  }

  function cardBadges(item, canAfford) {
    const badges = [
      `<span class="market-chip market-chip--primary">${escapeHtml(item.category || 'Umumiy')}</span>`,
      `<span class="market-chip ${canAfford ? 'market-chip--info' : 'market-chip--danger'}">${canAfford ? 'Mos keladi' : 'Balans yetmaydi'}</span>`,
    ];

    if (Number(item.stock || 0) <= 3) {
      badges.push('<span class="market-chip market-chip--warning">Kam qoldi</span>');
    }

    return badges.join('');
  }

  function renderGrid() {
    const host = document.getElementById('shopGrid');

    if (!state.filteredItems.length) {
      host.innerHTML = `
        <div class="market-empty">
          <div class="icon">${svgIcon('empty')}</div>
          <p>Bu filter bo'yicha mahsulot topilmadi.</p>
          <div class="market-summary-note">Qidiruv yoki kategoriyani o'zgartirib qayta tekshiring.</div>
        </div>
      `;
      return;
    }

    host.innerHTML = state.filteredItems.map((item) => {
      const canAfford = Number(state.currentUser.coins || 0) >= Number(item.price || 0);
      return `
        <article class="market-card">
          <div class="market-card__visual">${itemVisualMarkup(item)}</div>
          <div class="market-card__badges">${cardBadges(item, canAfford)}</div>
          <div class="market-card__title">${escapeHtml(item.name)}</div>
          <div class="market-card__desc">${escapeHtml(item.description)}</div>
          <div class="market-card__footer">
            <div>
              <div class="market-card__price">${escapeHtml(EduCoin.formatCoins(item.price))}</div>
              <div class="market-card__stock">Qoldiq: ${escapeHtml(String(item.stock))} ta</div>
            </div>
          </div>
          <div class="market-card__actions">
            <button class="btn btn-secondary btn-sm" type="button" data-preview-id="${item.id}">
              <span class="btn-icon">${svgIcon('eye')}</span>
              <span>Ko'rish</span>
            </button>
            <button class="btn ${canAfford ? 'btn-primary' : 'btn-secondary'} btn-sm" type="button" data-buy-id="${item.id}" ${canAfford ? '' : 'disabled'}>
              <span class="btn-icon">${svgIcon('cart')}</span>
              <span>${canAfford ? 'Sotib olish' : 'Yetarli coin yo\'q'}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderPage() {
    state.filteredItems = getFilteredItems();
    renderStats();
    renderMeta();
    renderGrid();
  }

  function fillBuyModal(item) {
    const modalVisual = document.getElementById('buyItemVisual');
    const modalName = document.getElementById('buyItemName');
    const modalDesc = document.getElementById('buyItemDesc');
    const modalPrice = document.getElementById('buyItemPrice');
    const modalBalance = document.getElementById('buyUserBalance');
    const modalAfter = document.getElementById('buyAfterBalance');
    const modalCategory = document.getElementById('buyItemCategory');
    const modalStock = document.getElementById('buyItemStock');
    const confirmButton = document.getElementById('confirmBuyBtn');
    const afterBalance = Number(state.currentUser.coins || 0) - Number(item.price || 0);

    modalVisual.innerHTML = itemVisualMarkup(item);
    modalName.textContent = item.name;
    modalDesc.textContent = item.description;
    modalPrice.textContent = EduCoin.formatCoins(item.price);
    modalBalance.textContent = EduCoin.formatCoins(state.currentUser.coins || 0);
    modalCategory.textContent = item.category || 'Umumiy';
    modalStock.textContent = `${item.stock} ta`;
    modalAfter.textContent = afterBalance >= 0
      ? `Xariddan keyin: ${EduCoin.formatCoins(afterBalance)}`
      : 'Balans bu mahsulot uchun yetarli emas.';
    modalAfter.style.color = afterBalance >= 0 ? 'var(--text-secondary)' : 'var(--danger)';
    confirmButton.disabled = afterBalance < 0 || Number(item.stock || 0) <= 0;
  }

  function openBuy(itemId) {
    refreshCurrentUser();
    const item = EduCoin.getActiveShopItems().find((current) => current.id === itemId);
    if (!item) {
      showToast('Mahsulot topilmadi.', 'error');
      return;
    }
    state.selectedItem = item;
    fillBuyModal(item);
    openModal('buyModal');
  }

  function confirmBuy() {
    if (!state.selectedItem) {
      return;
    }

    const result = EduCoin.purchaseItem(state.currentUser.id, state.selectedItem.id);
    if (!result.success) {
      showToast(result.msg || 'Xarid amalga oshmadi.', 'error');
      return;
    }

    closeModal('buyModal');
    refreshCurrentUser();
    syncUserPanels();
    loadItems();
    populateCategoryOptions();
    renderPage();
    showToast(`${state.selectedItem.name} muvaffaqiyatli sotib olindi.`, 'success');
  }

  function handleGridClick(event) {
    const previewButton = event.target.closest('[data-preview-id]');
    const buyButton = event.target.closest('[data-buy-id]');

    if (previewButton) {
      window.open(getProductPath(previewButton.dataset.previewId), '_blank');
      return;
    }

    if (buyButton) {
      openBuy(buyButton.dataset.buyId);
    }
  }

  function attachEvents() {
    document.getElementById('shopSearchInput')?.addEventListener('input', renderPage);
    document.getElementById('shopCategoryFilter')?.addEventListener('change', renderPage);
    document.getElementById('shopAvailabilityFilter')?.addEventListener('change', renderPage);
    document.getElementById('shopSortFilter')?.addEventListener('change', renderPage);
    document.getElementById('shopGrid')?.addEventListener('click', handleGridClick);
    document.getElementById('confirmBuyBtn')?.addEventListener('click', confirmBuy);
    document.getElementById('buyModal')?.addEventListener('click', (event) => {
      if (event.target.id === 'buyModal') {
        closeModal('buyModal');
      }
    });
  }

  window.initShopCatalogPage = async function initShopCatalogPage(config = {}) {
    state.config = {
      allowedRoles: ['student', 'teacher'],
      ...config,
    };

    syncTexts();
    attachEvents();

    await EduCoin.init();
    state.currentUser = EduCoin.requireAuth(state.config.allowedRoles);
    if (!state.currentUser) {
      return;
    }

    const sidebarHost = document.getElementById('sidebar-container');
    if (sidebarHost) {
      sidebarHost.innerHTML = buildSidebar(state.currentUser.role, state.currentUser);
      initSidebar();
      highlightNav();
    }

    syncTexts();
    syncUserPanels();
    loadItems();
    populateCategoryOptions();
    renderPage();
  };
})();
