(function () {
  const state = {
    config: null,
    currentUser: null,
    allItems: [],
    filteredItems: [],
    editingId: null,
    uploadedVisual: '',
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
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="20" y1="20" x2="16.65" y2="16.65"></line></svg>',
      eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
      edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"></path></svg>',
      toggle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="5"></rect><circle cx="17" cy="12" r="3"></circle></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
      stack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"></path><path d="m3 12 9 4.5 9-4.5"></path><path d="m3 16.5 9 4.5 9-4.5"></path></svg>',
      spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z"></path><path d="m19 14 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"></path></svg>',
      empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M9 11h6"></path></svg>',
    };
    return icons[name] || icons.shop;
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

  function currentProductPath(itemId) {
    return `../../products/index.html?id=${encodeURIComponent(itemId)}`;
  }

  function getVisualMarkup(item) {
    const visual = item.image || item.icon || 'Item';
    if (typeof visual === 'string' && (visual.startsWith('data:') || /^https?:/i.test(visual))) {
      return `<img src="${visual}" alt="${escapeHtml(item.name)}">`;
    }
    return `<span class="market-card__emoji">${escapeHtml(visual)}</span>`;
  }

  function syncHeader() {
    const topCoinDisplay = document.getElementById('topCoinDisplay');
    const heroCoinBalance = document.getElementById('heroCoinBalance');
    const pageTopbarSubtitle = document.getElementById('pageTopbarSubtitle');
    const roleText = EduCoin.roleLabel(state.currentUser.role);
    const coinText = EduCoin.formatCoins(state.currentUser.coins || 0);

    if (topCoinDisplay) {
      topCoinDisplay.innerHTML = `${svgIcon('coin')}<span>${escapeHtml(coinText)}</span>`;
    }
    if (heroCoinBalance) {
      heroCoinBalance.textContent = coinText;
    }
    if (pageTopbarSubtitle) {
      pageTopbarSubtitle.textContent = `${roleText} uchun shop boshqaruvi`;
    }
  }

  function syncTexts() {
    const topbarTitle = document.getElementById('pageTopbarTitle');
    const heroTitle = document.getElementById('marketHeroTitle');
    const heroSubtitle = document.getElementById('marketHeroSubtitle');

    if (topbarTitle) {
      topbarTitle.textContent = state.config.topbarTitle || "Do'kon boshqaruvi";
    }
    if (heroTitle) {
      heroTitle.textContent = state.config.heroTitle || "Do'konni boshqarish";
    }
    if (heroSubtitle) {
      heroSubtitle.textContent = state.config.heroSubtitle || 'Mahsulotlar, stock va ko\'rinishni bir joyda boshqaring.';
    }
  }

  function loadItems() {
    state.allItems = EduCoin.getShopItems().map((item) => ({
      ...item,
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
      category: item.category || 'Umumiy',
      description: item.description || 'Tavsif kiritilmagan.',
    }));
  }

  function getCategories() {
    return Array.from(new Set(state.allItems.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  function populateCategoryOptions() {
    const select = document.getElementById('shopCategoryFilter');
    const formSelect = document.getElementById('itemCategoryInput');
    const categories = getCategories();
    const defaultOptions = ['Umumiy', 'Akademik', "Ta'lim", 'Sovg\'a', 'Premium', 'Boshqa'];
    const merged = Array.from(new Set(defaultOptions.concat(categories)));

    if (select) {
      const currentValue = select.value;
      select.innerHTML = ['<option value="">Barcha kategoriyalar</option>']
        .concat(merged.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
        .join('');
      select.value = merged.includes(currentValue) ? currentValue : '';
    }

    if (formSelect) {
      const currentValue = formSelect.value;
      formSelect.innerHTML = merged.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
      formSelect.value = merged.includes(currentValue) ? currentValue : 'Umumiy';
    }
  }

  function getFilters() {
    return {
      queryRaw: document.getElementById('shopSearchInput')?.value || '',
      query: normalizeText(document.getElementById('shopSearchInput')?.value || ''),
      category: document.getElementById('shopCategoryFilter')?.value || '',
      status: document.getElementById('shopStatusFilter')?.value || '',
      sort: document.getElementById('shopSortFilter')?.value || 'newest',
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

    if (filters.status === 'active') {
      items = items.filter((item) => item.active !== false);
    }

    if (filters.status === 'inactive') {
      items = items.filter((item) => item.active === false);
    }

    if (filters.status === 'low-stock') {
      items = items.filter((item) => Number(item.stock || 0) <= 3);
    }

    items.sort((left, right) => {
      switch (filters.sort) {
        case 'price-asc':
          return left.price - right.price;
        case 'price-desc':
          return right.price - left.price;
        case 'stock-asc':
          return left.stock - right.stock;
        case 'stock-desc':
          return right.stock - left.stock;
        case 'name-asc':
          return left.name.localeCompare(right.name, 'uz-Latn-UZ');
        case 'newest':
        default:
          return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      }
    });

    return items;
  }

  function renderStats() {
    const totalItems = state.allItems.length;
    const activeItems = state.allItems.filter((item) => item.active !== false).length;
    const lowStockItems = state.allItems.filter((item) => Number(item.stock || 0) <= 3).length;
    const totalValue = state.allItems.reduce((sum, item) => sum + (Number(item.stock || 0) * Number(item.price || 0)), 0);

    document.getElementById('marketStats').innerHTML = [
      statCard('shop', totalItems.toLocaleString(), 'Jami mahsulot', 'Faol va nofaol birga'),
      statCard('stack', activeItems.toLocaleString(), 'Faol katalog', 'Mijoz ko\'radigan mahsulotlar'),
      statCard('spark', lowStockItems.toLocaleString(), 'Kam qolganlar', '3 ta yoki undan kam stock'),
      statCard('coin', EduCoin.formatCoins(totalValue), 'Jami inventar qiymati', 'Price x stock hisobida'),
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
    if (filters.status === 'active') {
      parts.push('Faqat faol');
    }
    if (filters.status === 'inactive') {
      parts.push('Faqat nofaol');
    }
    if (filters.status === 'low-stock') {
      parts.push('Kam stock');
    }

    document.getElementById('marketFilterHint').textContent = parts.length
      ? `${parts.join(' | ')} | Saralash: ${getSortLabel(filters.sort)}`
      : `Barcha mahsulotlar ko'rsatilmoqda | Saralash: ${getSortLabel(filters.sort)}`;
    document.getElementById('marketResultCount').textContent = `${state.filteredItems.length} ta natija`;
  }

  function getSortLabel(value) {
    return {
      newest: 'Eng yangi',
      'price-asc': 'Narxi arzonidan',
      'price-desc': 'Narxi qimmatidan',
      'stock-asc': 'Stock kamidan',
      'stock-desc': 'Stock ko\'pidan',
      'name-asc': 'Nom bo\'yicha A-Z',
    }[value] || 'Eng yangi';
  }

  function badgeMarkup(item) {
    const badges = [
      `<span class="market-chip market-chip--primary">${escapeHtml(item.category || 'Umumiy')}</span>`,
      `<span class="market-chip ${item.active !== false ? 'market-chip--info' : 'market-chip--danger'}">${item.active !== false ? 'Faol' : 'Nofaol'}</span>`,
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
          <p>Hozircha mahsulot topilmadi.</p>
          <div class="market-summary-note">Yangi mahsulot qo'shing yoki filterlarni o'zgartiring.</div>
        </div>
      `;
      return;
    }

    host.innerHTML = state.filteredItems.map((item) => `
      <article class="market-card">
        <div class="market-card__visual">${getVisualMarkup(item)}</div>
        <div class="market-card__badges">${badgeMarkup(item)}</div>
        <div class="market-card__title">${escapeHtml(item.name)}</div>
        <div class="market-card__desc">${escapeHtml(item.description)}</div>
        <div class="market-card__footer">
          <div>
            <div class="market-card__price">${escapeHtml(EduCoin.formatCoins(item.price))}</div>
            <div class="market-card__stock">Stock: ${escapeHtml(String(item.stock))} ta</div>
          </div>
        </div>
        <div class="market-card__actions">
          <button class="btn btn-secondary btn-sm" type="button" data-preview-id="${item.id}">
            <span class="btn-icon">${svgIcon('eye')}</span>
            <span>Ko'rish</span>
          </button>
          <button class="btn btn-warning btn-sm" type="button" data-edit-id="${item.id}">
            <span class="btn-icon">${svgIcon('edit')}</span>
            <span>Tahrirlash</span>
          </button>
        </div>
        <div class="market-card__actions">
          <button class="btn ${item.active !== false ? 'btn-secondary' : 'btn-success'} btn-sm" type="button" data-toggle-id="${item.id}">
            <span class="btn-icon">${svgIcon('toggle')}</span>
            <span>${item.active !== false ? 'Nofaol qilish' : 'Faollashtirish'}</span>
          </button>
          <button class="btn btn-danger btn-sm" type="button" data-delete-id="${item.id}">
            <span class="btn-icon">${svgIcon('trash')}</span>
            <span>O'chirish</span>
          </button>
        </div>
      </article>
    `).join('');
  }

  function renderPage() {
    state.filteredItems = getFilteredItems();
    renderStats();
    renderMeta();
    renderGrid();
  }

  function showFormAlert(type, message) {
    const host = document.getElementById('itemModalAlert');
    if (!host) {
      return;
    }
    host.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  }

  function clearFormAlert() {
    const host = document.getElementById('itemModalAlert');
    if (host) {
      host.innerHTML = '';
    }
  }

  function updatePreview() {
    const preview = document.getElementById('itemPreview');
    const previewMedia = document.getElementById('itemPreviewMedia');
    const visualText = document.getElementById('itemVisualInput').value.trim();
    const visual = state.uploadedVisual || visualText;

    if (!preview || !previewMedia) {
      return;
    }

    if (!visual) {
      preview.hidden = true;
      previewMedia.innerHTML = '';
      return;
    }

    preview.hidden = false;
    if (visual.startsWith('data:') || /^https?:/i.test(visual)) {
      previewMedia.innerHTML = `<img src="${visual}" alt="Preview">`;
      return;
    }

    previewMedia.innerHTML = `<span>${escapeHtml(visual)}</span>`;
  }

  function resetItemForm() {
    state.editingId = null;
    state.uploadedVisual = '';
    clearFormAlert();
    document.getElementById('itemForm').reset();
    document.getElementById('itemCategoryInput').value = 'Umumiy';
    document.getElementById('itemActiveInput').checked = true;
    document.getElementById('itemModalTitle').textContent = 'Yangi mahsulot';
    document.getElementById('itemSubmitBtn').textContent = 'Saqlash';
    document.getElementById('itemImageInput').value = '';
    updatePreview();
  }

  function openItemModal(mode, itemId = null) {
    resetItemForm();

    if (mode === 'edit') {
      const item = state.allItems.find((current) => current.id === itemId);
      if (!item) {
        showToast('Mahsulot topilmadi.', 'error');
        return;
      }
      state.editingId = item.id;
      document.getElementById('itemModalTitle').textContent = 'Mahsulotni tahrirlash';
      document.getElementById('itemSubmitBtn').textContent = 'Yangilash';
      document.getElementById('itemNameInput').value = item.name || '';
      document.getElementById('itemVisualInput').value = item.image && item.image.startsWith('data:') ? '' : (item.image || item.icon || '');
      document.getElementById('itemPriceInput').value = Number(item.price || 0);
      document.getElementById('itemStockInput').value = Number(item.stock || 0);
      document.getElementById('itemCategoryInput').value = item.category || 'Umumiy';
      document.getElementById('itemDescriptionInput').value = item.description || '';
      document.getElementById('itemActiveInput').checked = item.active !== false;
      if (item.image && item.image.startsWith('data:')) {
        state.uploadedVisual = item.image;
      }
      updatePreview();
    }

    openModal('itemModal');
  }

  function getFormVisual() {
    return state.uploadedVisual || document.getElementById('itemVisualInput').value.trim() || 'Item';
  }

  function closeItemModal() {
    clearFormAlert();
    closeModal('itemModal');
  }

  function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function compressImageDataUrl(dataUrl, maxWidth = 720, quality = 0.82) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        let width = image.naturalWidth;
        let height = image.naturalHeight;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const raw = await readImageAsDataUrl(file);
    state.uploadedVisual = await compressImageDataUrl(raw);
    document.getElementById('itemVisualInput').value = '';
    updatePreview();
  }

  function removeUploadedImage() {
    state.uploadedVisual = '';
    document.getElementById('itemImageInput').value = '';
    updatePreview();
  }

  function submitItemForm(event) {
    event.preventDefault();
    clearFormAlert();

    const name = document.getElementById('itemNameInput').value.trim();
    const visual = getFormVisual();
    const price = Math.round(Number(document.getElementById('itemPriceInput').value || 0));
    const stock = Math.round(Number(document.getElementById('itemStockInput').value || 0));
    const category = document.getElementById('itemCategoryInput').value || 'Umumiy';
    const description = document.getElementById('itemDescriptionInput').value.trim();
    const active = document.getElementById('itemActiveInput').checked;

    if (name.length < 2) {
      showFormAlert('danger', 'Mahsulot nomi kamida 2 ta belgidan iborat bo\'lishi kerak.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showFormAlert('danger', 'Narx 0 dan katta bo\'lishi kerak.');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      showFormAlert('danger', 'Stock manfiy bo\'lishi mumkin emas.');
      return;
    }

    if (!state.editingId) {
      const created = EduCoin.addShopItem({
        name,
        description,
        category,
        price,
        stock,
        active,
        image: visual,
        icon: visual,
        createdBy: state.currentUser.id,
      });
      if (!created) {
        showFormAlert('danger', 'Mahsulotni saqlab bo\'lmadi. Rasm juda katta bo\'lishi mumkin.');
        return;
      }
      loadItems();
      populateCategoryOptions();
      renderPage();
      closeItemModal();
      showToast(`${name} qo'shildi.`, 'success');
      return;
    }

    const items = EduCoin.getShopItems();
    const index = items.findIndex((item) => item.id === state.editingId);
    if (index === -1) {
      showFormAlert('danger', 'Mahsulot topilmadi.');
      return;
    }

    items[index] = {
      ...items[index],
      name,
      description,
      category,
      price,
      stock,
      active,
      image: visual,
      icon: visual,
    };

    if (!EduCoin.setData('shop', items)) {
      showFormAlert('danger', 'Yangilashni saqlab bo\'lmadi.');
      return;
    }

    loadItems();
    populateCategoryOptions();
    renderPage();
    closeItemModal();
    showToast(`${name} yangilandi.`, 'success');
  }

  function toggleItem(id) {
    const items = EduCoin.getShopItems();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      showToast('Mahsulot topilmadi.', 'error');
      return;
    }
    items[index].active = !(items[index].active !== false);
    EduCoin.setData('shop', items);
    loadItems();
    renderPage();
    showToast(items[index].active ? 'Mahsulot faollashtirildi.' : 'Mahsulot nofaol qilindi.', 'success');
  }

  function deleteItem(id) {
    const item = state.allItems.find((current) => current.id === id);
    if (!item) {
      showToast('Mahsulot topilmadi.', 'error');
      return;
    }

    if (!confirm(`${item.name} mahsulotini butunlay o'chirishni tasdiqlaysizmi?`)) {
      return;
    }

    const filtered = EduCoin.getShopItems().filter((current) => current.id !== id);
    EduCoin.addShopRemovedId(id);
    EduCoin.setData('shop', filtered);
    loadItems();
    populateCategoryOptions();
    renderPage();
    showToast('Mahsulot o\'chirildi.', 'success');
  }

  function handleGridClick(event) {
    const previewButton = event.target.closest('[data-preview-id]');
    const editButton = event.target.closest('[data-edit-id]');
    const toggleButton = event.target.closest('[data-toggle-id]');
    const deleteButton = event.target.closest('[data-delete-id]');

    if (previewButton) {
      window.open(currentProductPath(previewButton.dataset.previewId), '_blank');
      return;
    }
    if (editButton) {
      openItemModal('edit', editButton.dataset.editId);
      return;
    }
    if (toggleButton) {
      toggleItem(toggleButton.dataset.toggleId);
      return;
    }
    if (deleteButton) {
      deleteItem(deleteButton.dataset.deleteId);
    }
  }

  function attachEvents() {
    document.getElementById('openItemModalBtn')?.addEventListener('click', () => openItemModal('add'));
    document.getElementById('shopSearchInput')?.addEventListener('input', renderPage);
    document.getElementById('shopCategoryFilter')?.addEventListener('change', renderPage);
    document.getElementById('shopStatusFilter')?.addEventListener('change', renderPage);
    document.getElementById('shopSortFilter')?.addEventListener('change', renderPage);
    document.getElementById('shopGrid')?.addEventListener('click', handleGridClick);
    document.getElementById('itemForm')?.addEventListener('submit', submitItemForm);
    document.getElementById('itemImageInput')?.addEventListener('change', handleImageChange);
    document.getElementById('itemVisualInput')?.addEventListener('input', updatePreview);
    document.getElementById('removeItemImageBtn')?.addEventListener('click', removeUploadedImage);
    document.getElementById('itemModal')?.addEventListener('click', (event) => {
      if (event.target.id === 'itemModal') {
        closeItemModal();
      }
    });
    document.getElementById('closeItemModalBtn')?.addEventListener('click', closeItemModal);
    document.getElementById('cancelItemModalBtn')?.addEventListener('click', closeItemModal);
  }

  window.initShopManagementPage = async function initShopManagementPage(config = {}) {
    state.config = {
      allowedRoles: ['admin', 'manager', 'director'],
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
    syncHeader();
    loadItems();
    populateCategoryOptions();
    renderPage();
  };
})();
