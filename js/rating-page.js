(function () {
  const state = {
    config: null,
    currentUser: null,
    records: [],
    filteredRecords: [],
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
      ranking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.6L12 15.8 7 18.3l1-5.6-4-3.9 5.5-.8L12 3z"></path></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.9"></path><path d="M16 3.1a4 4 0 0 1 0 7.8"></path></svg>',
      trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"></path><path d="M17 5h3v3a3 3 0 0 1-3 3"></path><path d="M7 5H4v3a3 3 0 0 0 3 3"></path></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="20" y1="20" x2="16.65" y2="16.65"></line></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
      crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18l-2-10-5 4-4-7-4 7-5-4-2 10z"></path></svg>',
      empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-6"></path></svg>',
    };
    return icons[name] || icons.ranking;
  }

  function summaryCard(iconName, value, label, meta) {
    return `
      <div class="rating-summary-card">
        <div class="rating-summary-card__icon">${svgIcon(iconName)}</div>
        <div>
          <div class="rating-summary-card__value">${escapeHtml(value)}</div>
          <div class="rating-summary-card__label">${escapeHtml(label)}</div>
          <div class="rating-summary-card__meta">${escapeHtml(meta)}</div>
        </div>
      </div>
    `;
  }

  function medalLabel(rank) {
    if (rank === 1) return 'Top 1';
    if (rank === 2) return 'Top 2';
    if (rank === 3) return 'Top 3';
    return `#${rank}`;
  }

  function syncTexts() {
    document.getElementById('pageTopbarTitle').textContent = state.config.topbarTitle || 'Reyting';
    document.getElementById('ratingHeroTitle').textContent = state.config.heroTitle || 'EduCoin reytingi';
    document.getElementById('ratingHeroSubtitle').textContent = state.config.heroSubtitle || 'O\'quvchilarni coin natijalari bo\'yicha kuzating.';
    document.getElementById('ratingHighlightTitle').textContent = state.config.highlightTitle || 'Joriy holat';
  }

  function syncHeader() {
    const topCoinDisplay = document.getElementById('topCoinDisplay');
    const pageTopbarSubtitle = document.getElementById('pageTopbarSubtitle');
    const coinText = EduCoin.formatCoins(state.currentUser.coins || 0);

    if (topCoinDisplay) {
      topCoinDisplay.innerHTML = `${svgIcon('coin')}<span>${escapeHtml(coinText)}</span>`;
    }
    if (pageTopbarSubtitle) {
      pageTopbarSubtitle.textContent = `${EduCoin.roleLabel(state.currentUser.role)} paneli uchun reyting ko'rinishi`;
    }
  }

  function buildRecords() {
    const groups = EduCoin.getGroups();
    const leaderboard = EduCoin.getLeaderboard();
    state.records = leaderboard.map((user, index) => {
      const group = groups.find((current) => (current.studentIds || []).includes(user.id));
      return {
        ...user,
        rank: index + 1,
        coins: Number(user.coins || 0),
        groupName: group?.name || 'Guruhsiz',
        deltaToAbove: index === 0 ? 0 : Math.max(0, Number(leaderboard[index - 1].coins || 0) - Number(user.coins || 0)),
        isMe: user.id === state.currentUser.id,
      };
    });
  }

  function populateGroupOptions() {
    const select = document.getElementById('ratingGroupFilter');
    if (!select) {
      return;
    }
    const currentValue = select.value;
    const groups = Array.from(new Set(state.records.map((record) => record.groupName))).sort((a, b) => a.localeCompare(b));
    select.innerHTML = ['<option value="">Barcha guruhlar</option>']
      .concat(groups.map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`))
      .join('');
    select.value = groups.includes(currentValue) ? currentValue : '';
  }

  function getFilters() {
    return {
      queryRaw: document.getElementById('ratingSearchInput')?.value || '',
      query: normalizeText(document.getElementById('ratingSearchInput')?.value || ''),
      group: document.getElementById('ratingGroupFilter')?.value || '',
      limit: document.getElementById('ratingLimitFilter')?.value || '20',
    };
  }

  function getFilteredRecords() {
    const filters = getFilters();
    let records = [...state.records];

    if (filters.query) {
      records = records.filter((record) => (
        normalizeText(record.name).includes(filters.query) ||
        normalizeText(record.username).includes(filters.query) ||
        normalizeText(record.groupName).includes(filters.query)
      ));
    }

    if (filters.group) {
      records = records.filter((record) => record.groupName === filters.group);
    }

    if (filters.limit !== 'all') {
      records = records.slice(0, Number(filters.limit));
    }

    return records;
  }

  function renderSummary() {
    const totalStudents = state.records.length;
    const topCoins = state.records[0]?.coins || 0;
    const averageCoins = totalStudents
      ? Math.round(state.records.reduce((sum, record) => sum + record.coins, 0) / totalStudents)
      : 0;
    const groupCount = Array.from(new Set(state.records.map((record) => record.groupName))).length;

    document.getElementById('ratingSummaryGrid').innerHTML = [
      summaryCard('users', totalStudents.toLocaleString(), "O'quvchilar", 'Reytingdagi jami talabalar'),
      summaryCard('coin', topCoins.toLocaleString(), 'Eng yuqori coin', 'Hozirgi lider natijasi'),
      summaryCard('chart', averageCoins.toLocaleString(), "O'rtacha coin", 'Jami studentlar bo\'yicha'),
      summaryCard('ranking', groupCount.toLocaleString(), 'Guruhlar', 'Reytingda ko\'rinayotgan guruhlar'),
    ].join('');
  }

  function renderPodium() {
    const host = document.getElementById('ratingPodium');
    const podium = state.records.slice(0, 3);

    if (!podium.length) {
      host.innerHTML = `
        <div class="rating-empty">
          <div class="icon">${svgIcon('empty')}</div>
          <p>Reyting uchun ma'lumot topilmadi.</p>
        </div>
      `;
      return;
    }

    host.innerHTML = podium.map((record) => `
      <div class="rating-podium-card rating-podium-card--${record.rank}">
        <div class="rating-podium-rank">${escapeHtml(medalLabel(record.rank))}</div>
        <div class="rating-row__avatar" style="margin:0 auto 12px;">${escapeHtml(getInitials(record.name))}</div>
        <div class="rating-podium-name">${escapeHtml(record.name)}</div>
        <div class="rating-podium-group">${escapeHtml(record.groupName)}</div>
        <div class="rating-podium-coins">${escapeHtml(EduCoin.formatCoins(record.coins))}</div>
      </div>
    `).join('');
  }

  function renderHighlight() {
    const host = document.getElementById('ratingHighlight');
    const me = state.records.find((record) => record.isMe);
    const leader = state.records[0];

    if (state.config.mode === 'student') {
      if (!me) {
        host.innerHTML = '<div class="rating-highlight__meta">Siz hali reytingga kirmagansiz.</div>';
        return;
      }
      const gapToLeader = Math.max(0, Number(leader?.coins || 0) - me.coins);
      const nextRecord = state.records.find((record) => record.rank === me.rank - 1);
      host.innerHTML = `
        <div class="rating-highlight__value">#${me.rank}</div>
        <div class="rating-highlight__meta">Sizning joriy o'rningiz va shaxsiy progress holati.</div>
        <div class="rating-highlight__chips">
          <span class="market-chip market-chip--primary">${escapeHtml(me.groupName)}</span>
          <span class="market-chip market-chip--info">${escapeHtml(EduCoin.formatCoins(me.coins))}</span>
          <span class="market-chip market-chip--warning">${nextRecord ? `Keyingi o'ringacha ${EduCoin.formatCoins(nextRecord.coins - me.coins)}` : 'Siz lider'} </span>
        </div>
        <div class="rating-highlight__meta">${gapToLeader ? `Lidergacha farq: ${EduCoin.formatCoins(gapToLeader)}` : 'Siz reyting yetakchisisiz.'}</div>
      `;
      return;
    }

    host.innerHTML = leader
      ? `
        <div class="rating-highlight__value">${escapeHtml(leader.name)}</div>
        <div class="rating-highlight__meta">Hozirgi yetakchi va umumiy ko'rinish.</div>
        <div class="rating-highlight__chips">
          <span class="market-chip market-chip--primary">${escapeHtml(leader.groupName)}</span>
          <span class="market-chip market-chip--info">${escapeHtml(EduCoin.formatCoins(leader.coins))}</span>
          <span class="market-chip market-chip--warning">${state.records.length} ta student</span>
        </div>
        <div class="rating-highlight__meta">Sizning balansingiz: ${escapeHtml(EduCoin.formatCoins(state.currentUser.coins || 0))}</div>
      `
      : '<div class="rating-highlight__meta">Reyting uchun hozircha studentlar yo\'q.</div>';
  }

  function renderMeta() {
    const filters = getFilters();
    const parts = [];

    if (filters.queryRaw.trim()) {
      parts.push(`Qidiruv: "${filters.queryRaw.trim()}"`);
    }
    if (filters.group) {
      parts.push(`Guruh: ${filters.group}`);
    }
    if (filters.limit !== 'all') {
      parts.push(`Top ${filters.limit}`);
    }

    document.getElementById('ratingFilterHint').textContent = parts.length
      ? parts.join(' | ')
      : "Barcha o'quvchilar ko'rsatilmoqda";
    document.getElementById('ratingResultCount').textContent = `${state.filteredRecords.length} ta`;
  }

  function renderList() {
    const host = document.getElementById('leaderboardList');

    if (!state.filteredRecords.length) {
      host.innerHTML = `
        <div class="rating-empty">
          <div class="icon">${svgIcon('empty')}</div>
          <p>Bu filter bo'yicha o'quvchi topilmadi.</p>
        </div>
      `;
      return;
    }

    host.innerHTML = state.filteredRecords.map((record) => `
      <div class="rating-row ${record.isMe ? 'rating-row--me' : ''}">
        <div class="rating-row__rank">${escapeHtml(medalLabel(record.rank))}</div>
        <div class="rating-row__avatar">${escapeHtml(getInitials(record.name))}</div>
        <div class="rating-row__user">
          <div class="rating-row__name">${escapeHtml(record.name)} ${record.isMe ? '<span class="badge badge-primary">Siz</span>' : ''}</div>
          <div class="rating-row__meta">
            <span>${escapeHtml(record.groupName)}</span>
            <span>@${escapeHtml(record.username)}</span>
          </div>
        </div>
        <div class="rating-row__coins">${escapeHtml(EduCoin.formatCoins(record.coins))}</div>
        <div class="rating-row__delta">${record.rank === 1 ? 'Lider' : `${escapeHtml(EduCoin.formatCoins(record.deltaToAbove))} farq`}</div>
      </div>
    `).join('');
  }

  function renderPage() {
    state.filteredRecords = getFilteredRecords();
    renderSummary();
    renderPodium();
    renderHighlight();
    renderMeta();
    renderList();
  }

  function attachEvents() {
    document.getElementById('ratingSearchInput')?.addEventListener('input', renderPage);
    document.getElementById('ratingGroupFilter')?.addEventListener('change', renderPage);
    document.getElementById('ratingLimitFilter')?.addEventListener('change', renderPage);
  }

  window.initRatingPage = async function initRatingPage(config = {}) {
    state.config = {
      allowedRoles: ['student'],
      mode: 'student',
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
    buildRecords();
    populateGroupOptions();
    renderPage();
  };
})();
