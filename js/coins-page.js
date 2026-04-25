(function () {
  const state = {
    config: null,
    currentUser: null,
    transactions: [],
    filteredTransactions: [],
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
      wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"></path><path d="M16 7V5a2 2 0 0 0-2-2H6"></path><path d="M18 12h.01"></path></svg>',
      receive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"></path><path d="m5 12 7 7 7-7"></path></svg>',
      send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="m19 12-7-7-7 7"></path></svg>',
      award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><path d="M8.2 13.9 7 22l5-3 5 3-1.2-8.1"></path></svg>',
      shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="20" y1="20" x2="16.65" y2="16.65"></line></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="18" y1="20" x2="18" y2="13"></line></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.9"></path><path d="M16 3.1a4 4 0 0 1 0 7.8"></path></svg>',
      star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.2 5.7.8-4.1 4 1 5.8L12 15.9 6.8 18.8l1-5.8-4.1-4 5.7-.8L12 3z"></path></svg>',
      empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-6"></path></svg>',
      pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 8-6-16-3 8H2"></path></svg>',
    };
    return icons[name] || icons.coin;
  }

  function statCard(iconName, value, label, meta) {
    return `
      <div class="coin-summary-card">
        <div class="coin-summary-card__icon">${svgIcon(iconName)}</div>
        <div>
          <div class="coin-summary-card__value">${escapeHtml(value)}</div>
          <div class="coin-summary-card__label">${escapeHtml(label)}</div>
          <div class="coin-summary-card__meta">${escapeHtml(meta)}</div>
        </div>
      </div>
    `;
  }

  function buildUserWeeklySeries(userId) {
    const labels = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const transactions = EduCoin.getUserTransactions(userId);
    const series = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - offset);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const dayTransactions = transactions.filter((tx) => {
        const createdAt = new Date(tx.createdAt);
        return createdAt >= start && createdAt < end;
      });

      series.push({
        label: labels[start.getDay()],
        amount: dayTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0),
      });
    }

    return series;
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) {
      node.textContent = value;
    }
  }

  function refreshCurrentUser() {
    state.currentUser = EduCoin.getUserById(state.currentUser.id) || state.currentUser;
  }

  function syncShell() {
    const roleBadge = document.getElementById('coinRoleBadge');
    const topCoinDisplay = document.getElementById('topCoinDisplay');

    setText('pageTopbarTitle', state.config.topbarTitle || 'EduCoinlar');
    setText('pageTopbarSubtitle', state.config.topbarSubtitle || `${EduCoin.roleLabel(state.currentUser.role)} uchun coin nazorati`);
    setText('coinHeroTitle', state.config.heroTitle || 'EduCoin harakati');
    setText('coinHeroSubtitle', state.config.heroSubtitle || 'Balans, tranzaksiyalar va statistikani kuzating.');
    setText('coinHeroBalance', EduCoin.formatCoins(state.currentUser.coins || 0));

    if (topCoinDisplay) {
      topCoinDisplay.innerHTML = `${svgIcon('coin')}<span>${escapeHtml(EduCoin.formatCoins(state.currentUser.coins || 0))}</span>`;
    }

    if (roleBadge) {
      if (state.config.roleBadgeLabel) {
        roleBadge.hidden = false;
        roleBadge.textContent = state.config.roleBadgeLabel;
        roleBadge.className = `badge ${state.config.roleBadgeClass || 'badge-primary'}`;
      } else {
        roleBadge.hidden = true;
      }
    }
  }

  function renderHeroActions() {
    const host = document.getElementById('coinHeroActions');
    if (!host) {
      return;
    }

    const actions = Array.isArray(state.config.actions) ? state.config.actions : [];
    host.innerHTML = actions.map((action) => {
      const className = action.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-primary';
      if (action.type === 'link') {
        return `<a class="${className}" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`;
      }
      return `<button class="${className}" type="button" data-coin-action="${escapeHtml(action.action || '')}">${escapeHtml(action.label)}</button>`;
    }).join('');
  }

  function mapTransaction(tx) {
    const fromUser = EduCoin.getUserById(tx.fromId);
    const toUser = EduCoin.getUserById(tx.toId);
    const amount = Number(tx.amount || 0);
    const absAmount = Math.abs(amount);
    const isAdminMode = state.config.mode === 'admin';
    const isIncoming = tx.toId === state.currentUser.id && tx.type !== 'purchase';
    const isOutgoing = tx.fromId === state.currentUser.id || tx.type === 'purchase';
    const displayAmount = isAdminMode
      ? `${amount > 0 ? '+' : ''}${amount.toLocaleString()} coin`
      : `${isIncoming ? '+' : isOutgoing ? '-' : ''}${absAmount.toLocaleString()} coin`;
    const directionLabel = tx.type === 'purchase'
      ? `${fromUser?.name || 'Foydalanuvchi'} -> Tizim`
      : `${fromUser?.name || "Noma'lum"} -> ${toUser?.name || 'Tizim'}`;
    const otherUser = tx.type === 'purchase'
      ? null
      : tx.toId === state.currentUser.id
        ? fromUser
        : toUser;

    return {
      ...tx,
      fromUser,
      toUser,
      typeLabel: EduCoin.txnTypeLabel(tx.type),
      absAmount,
      displayAmount,
      directionLabel,
      amountTone: isAdminMode ? (amount >= 0 ? 'positive' : 'negative') : (isIncoming ? 'positive' : 'negative'),
      counterpartLabel: otherUser?.name || (tx.type === 'purchase' ? "Do'kon xaridi" : 'Tizim'),
      roleKeys: [fromUser?.role, toUser?.role].filter(Boolean),
      searchText: normalizeText([
        tx.reason,
        tx.type,
        tx.itemId,
        fromUser?.name,
        fromUser?.username,
        toUser?.name,
        toUser?.username,
        directionLabel,
      ].filter(Boolean).join(' ')),
    };
  }

  function collectTransactions() {
    const source = state.config.mode === 'admin'
      ? EduCoin.getRecentTransactions(1000)
      : EduCoin.getUserTransactions(state.currentUser.id);

    state.transactions = source.map(mapTransaction);
  }

  function getFilters() {
    return {
      queryRaw: document.getElementById('coinSearchInput')?.value || '',
      query: normalizeText(document.getElementById('coinSearchInput')?.value || ''),
      type: document.getElementById('coinTypeFilter')?.value || '',
      role: document.getElementById('coinRoleFilter')?.value || '',
      sort: document.getElementById('coinSortFilter')?.value || 'newest',
    };
  }

  function getFilteredTransactions() {
    const filters = getFilters();
    let records = [...state.transactions];

    if (filters.query) {
      records = records.filter((record) => record.searchText.includes(filters.query));
    }

    if (filters.type) {
      records = records.filter((record) => record.type === filters.type);
    }

    if (filters.role) {
      records = records.filter((record) => record.roleKeys.includes(filters.role));
    }

    records.sort((left, right) => {
      switch (filters.sort) {
        case 'oldest':
          return new Date(left.createdAt) - new Date(right.createdAt);
        case 'amount-desc':
          return right.absAmount - left.absAmount;
        case 'amount-asc':
          return left.absAmount - right.absAmount;
        case 'newest':
        default:
          return new Date(right.createdAt) - new Date(left.createdAt);
      }
    });

    return records;
  }

  function renderSummary() {
    const purchases = EduCoin.getData('purchases') || [];
    const summaryHost = document.getElementById('coinSummaryGrid');

    if (state.config.mode === 'admin') {
      const users = EduCoin.getUsers().filter((user) => user.active);
      const transactions = EduCoin.getRecentTransactions(1000);
      const totalAwarded = transactions.filter((tx) => tx.type === 'award').reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
      const totalTransferred = transactions.filter((tx) => tx.type === 'transfer').reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
      const totalPurchased = transactions.filter((tx) => tx.type === 'purchase').reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
      const circulation = users.reduce((sum, user) => sum + Number(user.coins || 0), 0);

      summaryHost.innerHTML = [
        statCard('wallet', circulation.toLocaleString(), 'Muomaladagi coin', 'Tizimdagi aktiv balans'),
        statCard('award', totalAwarded.toLocaleString(), 'Mukofotlar', 'Jami berilgan coinlar'),
        statCard('send', totalTransferred.toLocaleString(), "O'tkazmalar", 'Userlar orasidagi oqim'),
        statCard('shop', totalPurchased.toLocaleString(), 'Xaridlar', "Do'kon uchun sarflangan"),
        statCard('users', users.length.toLocaleString(), 'Faol foydalanuvchi', 'Nazorat ostidagi akkauntlar'),
        statCard('pulse', transactions.length.toLocaleString(), 'Tranzaksiyalar', 'Barcha tarix bo\'yicha'),
      ].join('');
      return;
    }

    const transactions = EduCoin.getUserTransactions(state.currentUser.id);
    const totalReceived = transactions
      .filter((tx) => tx.toId === state.currentUser.id && tx.type !== 'purchase')
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
    const totalSpent = transactions
      .filter((tx) => tx.fromId === state.currentUser.id || tx.type === 'purchase')
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
    const awardCount = transactions.filter((tx) => tx.type === 'award' && tx.toId === state.currentUser.id).length;
    const purchaseCount = purchases.filter((item) => item.userId === state.currentUser.id).length;

    summaryHost.innerHTML = [
      statCard('wallet', Number(state.currentUser.coins || 0).toLocaleString(), 'Joriy balans', 'Hozirgi coin holati'),
      statCard('receive', totalReceived.toLocaleString(), 'Jami olindi', 'Mukofot va transferlar'),
      statCard('send', totalSpent.toLocaleString(), 'Jami sarflandi', "Xarid va chiqimlar"),
      statCard('award', awardCount.toLocaleString(), 'Mukofotlar', 'Olingan award tranzaksiyalar'),
      statCard('shop', purchaseCount.toLocaleString(), 'Xaridlar', "Do'kondan olingan mahsulotlar"),
      statCard('pulse', transactions.length.toLocaleString(), 'Tranzaksiyalar', 'Shaxsiy coin tarixi'),
    ].join('');
  }

  function renderInsight() {
    const host = document.getElementById('coinInsight');

    if (state.config.mode === 'admin') {
      const users = EduCoin.getUsers().filter((user) => user.active);
      const topHolder = [...users].sort((left, right) => Number(right.coins || 0) - Number(left.coins || 0))[0];
      const latestReport = [...EduCoin.getReports()].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0];
      const groupCount = EduCoin.getGroups().length;

      host.innerHTML = `
        <div class="coin-highlight__value">${escapeHtml(topHolder?.name || 'Ma\'lumot yo\'q')}</div>
        <div class="coin-highlight__meta">Hozirgi eng katta balansga ega foydalanuvchi.</div>
        <div class="coin-highlight__chips">
          <span class="market-chip market-chip--primary">${escapeHtml(topHolder ? EduCoin.roleLabel(topHolder.role) : 'Foydalanuvchi yo\'q')}</span>
          <span class="market-chip market-chip--info">${escapeHtml(topHolder ? EduCoin.formatCoins(topHolder.coins) : '0 coin')}</span>
          <span class="market-chip market-chip--warning">${escapeHtml(`${groupCount} ta guruh`)}</span>
        </div>
        <div class="coin-highlight__meta">${escapeHtml(latestReport ? `So'nggi hisobot: ${latestReport.title}` : 'Hisobotlar hali yaratilmagan.')}</div>
      `;
      return;
    }

    const leaderboard = EduCoin.getLeaderboard();
    const myRank = leaderboard.findIndex((user) => user.id === state.currentUser.id) + 1;
    const group = EduCoin.getStudentGroup(state.currentUser.id);
    const lastPurchase = [...(EduCoin.getData('purchases') || [])]
      .filter((item) => item.userId === state.currentUser.id)
      .sort((left, right) => new Date(right.purchasedAt) - new Date(left.purchasedAt))[0];

    host.innerHTML = `
      <div class="coin-highlight__value">${escapeHtml(EduCoin.roleLabel(state.currentUser.role))}</div>
      <div class="coin-highlight__meta">Shaxsiy coin profilingiz uchun eng kerakli holat.</div>
      <div class="coin-highlight__chips">
        <span class="market-chip market-chip--primary">${escapeHtml(group?.name || 'Guruh ko\'rsatilmagan')}</span>
        <span class="market-chip market-chip--info">${escapeHtml(myRank > 0 ? `Reyting #${myRank}` : 'Reyting mavjud emas')}</span>
        <span class="market-chip market-chip--warning">${escapeHtml(lastPurchase ? lastPurchase.itemName : 'Xarid yo\'q')}</span>
      </div>
      <div class="coin-highlight__meta">${escapeHtml(lastPurchase ? `Oxirgi xarid: ${lastPurchase.itemName}` : 'Hali do\'kondan mahsulot olinmagan.')}</div>
    `;
  }

  function renderFlow() {
    const host = document.getElementById('coinFlow');
    const series = state.config.mode === 'admin'
      ? EduCoin.getWeeklySeries(7)
      : buildUserWeeklySeries(state.currentUser.id);
    const maxAmount = Math.max(...series.map((item) => Number(item.amount || 0)), 1);

    host.innerHTML = `
      <div class="coin-flow">
        ${series.map((item) => `
          <div class="coin-flow__item">
            <div class="coin-flow__amount">${escapeHtml(Number(item.amount || 0).toLocaleString())}</div>
            <div class="coin-flow__bar-wrap">
              <div class="coin-flow__bar" style="height:${Math.max(18, Math.round((Number(item.amount || 0) / maxAmount) * 140))}px;"></div>
            </div>
            <div class="coin-flow__label">${escapeHtml(item.label)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMeta() {
    const filters = getFilters();
    const parts = [];

    if (filters.queryRaw.trim()) {
      parts.push(`Qidiruv: "${filters.queryRaw.trim()}"`);
    }
    if (filters.type) {
      parts.push(`Turi: ${EduCoin.txnTypeLabel(filters.type)}`);
    }
    if (filters.role) {
      parts.push(`Rol: ${EduCoin.roleLabel(filters.role)}`);
    }

    document.getElementById('coinFilterHint').textContent = parts.length
      ? `${parts.join(' | ')} | Saralash: ${getSortLabel(filters.sort)}`
      : `Barcha tranzaksiyalar ko'rsatilmoqda | Saralash: ${getSortLabel(filters.sort)}`;
    document.getElementById('coinResultCount').textContent = `${state.filteredTransactions.length} ta`;
  }

  function getSortLabel(value) {
    return {
      newest: 'Eng yangi',
      oldest: 'Eng eski',
      'amount-desc': 'Miqdori katta',
      'amount-asc': 'Miqdori kichik',
    }[value] || 'Eng yangi';
  }

  function renderTransactions() {
    const host = document.getElementById('coinTransactionList');

    if (!state.filteredTransactions.length) {
      host.innerHTML = `
        <div class="coin-empty">
          <div class="icon">${svgIcon('empty')}</div>
          <p>Bu filter bo'yicha tranzaksiya topilmadi.</p>
        </div>
      `;
      return;
    }

    host.innerHTML = state.filteredTransactions.map((record) => `
      <div class="coin-transaction">
        <div class="coin-transaction__icon coin-transaction__icon--${escapeHtml(record.amountTone)}">${svgIcon(record.type === 'purchase' ? 'shop' : record.type === 'award' ? 'award' : 'coin')}</div>
        <div class="coin-transaction__body">
          <div class="coin-transaction__title">${escapeHtml(record.reason || record.typeLabel)}</div>
          <div class="coin-transaction__meta">
            <span>${escapeHtml(state.config.mode === 'admin' ? record.directionLabel : record.counterpartLabel)}</span>
            <span class="badge ${record.type === 'award' ? 'badge-success' : record.type === 'purchase' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(record.typeLabel)}</span>
          </div>
          ${state.config.mode === 'admin'
            ? `<div class="coin-transaction__meta"><span>${escapeHtml(record.roleKeys.map((role) => EduCoin.roleLabel(role)).join(' • ') || 'Tizim')}</span></div>`
            : ''}
        </div>
        <div class="coin-transaction__side">
          <div class="coin-transaction__amount coin-transaction__amount--${escapeHtml(record.amountTone)}">${escapeHtml(record.displayAmount)}</div>
          <div class="coin-transaction__date">${escapeHtml(EduCoin.formatDate(record.createdAt))}</div>
        </div>
      </div>
    `).join('');
  }

  function renderSidePanel() {
    const host = document.getElementById('coinSidePanel');

    if (state.config.mode === 'admin') {
      const users = EduCoin.getUsers()
        .filter((user) => user.active)
        .sort((left, right) => Number(right.coins || 0) - Number(left.coins || 0))
        .slice(0, 5);
      const lowStock = EduCoin.getShopItems()
        .filter((item) => item.active)
        .sort((left, right) => Number(left.stock || 0) - Number(right.stock || 0))
        .slice(0, 4);

      host.innerHTML = `
        <div class="coin-side-section">
          <div class="coin-side-section__title">Top balanslar</div>
          <div class="coin-side-list">
            ${users.map((user, index) => `
              <div class="coin-side-row">
                <div class="coin-side-row__main">
                  <div class="coin-side-row__avatar">${escapeHtml(getInitials(user.name))}</div>
                  <div>
                    <div class="coin-side-row__title">#${index + 1} ${escapeHtml(user.name)}</div>
                    <div class="coin-side-row__meta">${escapeHtml(EduCoin.roleLabel(user.role))}</div>
                  </div>
                </div>
                <div class="coin-side-row__value">${escapeHtml(EduCoin.formatCoins(user.coins || 0))}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="coin-side-section">
          <div class="coin-side-section__title">Kam qolgan mahsulotlar</div>
          <div class="coin-side-list">
            ${lowStock.length ? lowStock.map((item) => `
              <div class="coin-side-row">
                <div>
                  <div class="coin-side-row__title">${escapeHtml(item.name)}</div>
                  <div class="coin-side-row__meta">${escapeHtml(item.category || 'Umumiy')}</div>
                </div>
                <div class="coin-side-row__value">${escapeHtml(`${item.stock} ta`)}</div>
              </div>
            `).join('') : '<div class="coin-side-row__meta">Kam qolgan mahsulot yo\'q.</div>'}
          </div>
        </div>
      `;
      return;
    }

    const purchases = [...(EduCoin.getData('purchases') || [])]
      .filter((item) => item.userId === state.currentUser.id)
      .sort((left, right) => new Date(right.purchasedAt) - new Date(left.purchasedAt))
      .slice(0, 4);

    host.innerHTML = `
      <div class="coin-side-section">
        <div class="coin-side-section__title">So'nggi xaridlar</div>
        <div class="coin-side-list">
          ${purchases.length ? purchases.map((purchase) => `
            <div class="coin-side-row">
              <div>
                <div class="coin-side-row__title">${escapeHtml(purchase.itemName)}</div>
                <div class="coin-side-row__meta">${escapeHtml(EduCoin.formatDate(purchase.purchasedAt))}</div>
              </div>
              <div class="coin-side-row__value">${escapeHtml(EduCoin.formatCoins(purchase.price || 0))}</div>
            </div>
          `).join('') : '<div class="coin-side-row__meta">Xarid tarixi mavjud emas.</div>'}
        </div>
      </div>
      <div class="coin-side-section">
        <div class="coin-side-section__title">Tezkor o'tishlar</div>
        <div class="quick-actions quick-actions-compact" style="margin-bottom:0;">
          <div class="quick-action-card" onclick="window.location.href='shop.html'">
            <span class="quick-action-icon">${svgIcon('shop')}</span>
            <div>Do'kon</div>
            <div style="font-size:13px;color:var(--text2);margin-top:6px;">Mahsulotlarni ko'rish</div>
          </div>
          <div class="quick-action-card" onclick="window.location.href='rating.html'">
            <span class="quick-action-icon">${svgIcon('star')}</span>
            <div>Reyting</div>
            <div style="font-size:13px;color:var(--text2);margin-top:6px;">Natijalarni solishtirish</div>
          </div>
          <div class="quick-action-card" onclick="window.location.href='profile.html'">
            <span class="quick-action-icon">${svgIcon('users')}</span>
            <div>Profil</div>
            <div style="font-size:13px;color:var(--text2);margin-top:6px;">Akkauntni boshqarish</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAwardTargets() {
    const select = document.getElementById('coinAwardTargetInput');
    if (!select) {
      return;
    }

    const users = EduCoin.getUsers()
      .filter((user) => user.active && user.id !== state.currentUser.id && user.role !== 'admin')
      .sort((left, right) => left.name.localeCompare(right.name, 'uz-Latn-UZ'));

    select.innerHTML = ['<option value="">Foydalanuvchini tanlang</option>']
      .concat(users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(EduCoin.roleLabel(user.role))})</option>`))
      .join('');
  }

  function populateRoleFilter() {
    const wrapper = document.getElementById('coinRoleFilterWrap');
    const select = document.getElementById('coinRoleFilter');

    if (!wrapper || !select) {
      return;
    }

    if (state.config.mode !== 'admin') {
      wrapper.hidden = true;
      return;
    }

    wrapper.hidden = false;
    select.innerHTML = `
      <option value="">Barcha rollar</option>
      <option value="student">O'quvchilar</option>
      <option value="teacher">O'qituvchilar</option>
      <option value="manager">Menejerlar</option>
      <option value="director">Direktorlar</option>
    `;
  }

  function renderPage() {
    refreshCurrentUser();
    syncShell();
    collectTransactions();
    state.filteredTransactions = getFilteredTransactions();
    renderSummary();
    renderInsight();
    renderFlow();
    renderMeta();
    renderTransactions();
    renderSidePanel();
    renderAwardTargets();
  }

  function openAwardModal() {
    const modal = document.getElementById('coinAwardModal');
    if (modal) {
      openModal('coinAwardModal');
    }
  }

  function closeAwardModal() {
    const modal = document.getElementById('coinAwardModal');
    if (modal) {
      closeModal('coinAwardModal');
    }
  }

  function submitAward() {
    const targetId = document.getElementById('coinAwardTargetInput')?.value || '';
    const amount = Number(document.getElementById('coinAwardAmountInput')?.value || 0);
    const reason = document.getElementById('coinAwardReasonInput')?.value?.trim() || 'Admin mukofoti';
    const alertHost = document.getElementById('coinAwardAlert');

    if (!targetId || amount <= 0) {
      if (alertHost) {
        alertHost.innerHTML = '<div class="alert alert-danger">Foydalanuvchi va coin miqdorini to\'g\'ri kiriting.</div>';
      }
      return;
    }

    const result = EduCoin.awardCoins(state.currentUser.id, targetId, amount, reason);
    if (!result.success) {
      if (alertHost) {
        alertHost.innerHTML = `<div class="alert alert-danger">${escapeHtml(result.msg || 'Xatolik yuz berdi')}</div>`;
      }
      return;
    }

    if (alertHost) {
      alertHost.innerHTML = '';
    }

    document.getElementById('coinAwardTargetInput').value = '';
    document.getElementById('coinAwardAmountInput').value = '';
    document.getElementById('coinAwardReasonInput').value = '';
    closeAwardModal();
    if (typeof showToast === 'function') {
      showToast('Coin muvaffaqiyatli berildi.', 'success');
    }
    renderPage();
  }

  function attachEvents() {
    document.querySelector('.hamburger')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    ['coinSearchInput', 'coinTypeFilter', 'coinRoleFilter', 'coinSortFilter'].forEach((id) => {
      document.getElementById(id)?.addEventListener(id === 'coinSearchInput' ? 'input' : 'change', renderPage);
    });

    document.getElementById('coinHeroActions')?.addEventListener('click', (event) => {
      const action = event.target.closest('[data-coin-action]')?.getAttribute('data-coin-action');
      if (action === 'open-award') {
        openAwardModal();
      }
    });

    document.getElementById('coinAwardSubmitBtn')?.addEventListener('click', submitAward);
    document.getElementById('coinAwardCloseBtn')?.addEventListener('click', closeAwardModal);
    document.getElementById('coinAwardCancelBtn')?.addEventListener('click', closeAwardModal);
  }

  async function initCoinsPage(config) {
    state.config = {
      mode: 'self',
      actions: [],
      roleBadgeLabel: '',
      roleBadgeClass: 'badge-primary',
      ...config,
    };

    await EduCoin.init();
    const user = EduCoin.requireAuth(state.config.allowedRoles);
    if (!user) {
      return;
    }

    state.currentUser = user;
    const sidebarHost = document.getElementById('sidebar-container');
    if (sidebarHost && typeof buildSidebar === 'function') {
      sidebarHost.innerHTML = buildSidebar(user.role, user);
    }

    renderHeroActions();
    populateRoleFilter();
    renderPage();
    attachEvents();
  }

  window.initCoinsPage = initCoinsPage;
})();
