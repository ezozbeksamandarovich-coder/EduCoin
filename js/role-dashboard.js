const RoleDashboard = {
  role: null,
  user: null,

  async init(role) {
    this.role = role;
    await EduCoin.init();

    const config = this.getConfig(role);
    const user = EduCoin.requireAuth(config.allowedRoles);
    if (!user) {
      return;
    }

    this.user = user;
    const sidebarHost = document.getElementById('sidebar-container');
    if (sidebarHost && typeof buildSidebar === 'function') {
      sidebarHost.innerHTML = buildSidebar(user.role, user);
    }

    const topCoin = document.getElementById('topCoinDisplay');
    if (topCoin) {
      const coinSpan = topCoin.querySelector('span');
      if (coinSpan) {
        coinSpan.textContent = EduCoin.formatCoins(user.coins || 0);
      } else {
        topCoin.textContent = EduCoin.formatCoins(user.coins || 0);
      }
    }

    const title = document.getElementById('topbarTitle');
    if (title) {
      title.textContent = config.title;
    }

    const subtitle = document.getElementById('topbarSubtitle');
    if (subtitle) {
      subtitle.textContent = config.subtitle;
    }

    const mount = document.getElementById('dashboard-root');
    if (mount) {
      mount.innerHTML = this.render();
    }

    const hamburger = document.getElementById('dashboardHamburger');
    if (hamburger) {
      hamburger.onclick = () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.toggle('open');
        }
      };
    }
  },

  getConfig(role) {
    const configs = {
      student: { allowedRoles: ['student'], title: "O'quvchi paneli", subtitle: 'Natija va imkoniyatlar' },
      teacher: { allowedRoles: ['teacher'], title: "O'qituvchi paneli", subtitle: "Guruhlar va mukofotlar" },
      manager: { allowedRoles: ['manager'], title: 'Menejer paneli', subtitle: 'Jarayonlar nazorati' },
      director: { allowedRoles: ['director'], title: 'Direktor paneli', subtitle: 'Tizim boshqaruvi' },
      admin: { allowedRoles: ['admin'], title: 'Admin paneli', subtitle: "To'liq nazorat va statistika" },
    };
    return configs[role];
  },

  getContext() {
    const user = EduCoin.getCurrentUser();
    const users = EduCoin.getUsers().filter((item) => item.active);
    const students = users.filter((item) => item.role === 'student');
    const teachers = users.filter((item) => item.role === 'teacher');
    const groups = EduCoin.getGroups();
    const shopItems = EduCoin.getActiveShopItems();
    const transactions = EduCoin.getRecentTransactions(50);
    const purchases = EduCoin.getData('purchases') || [];
    const leaderboard = EduCoin.getLeaderboard();
    const weekly = EduCoin.getWeeklySeries(7);
    const userTransactions = EduCoin.getUserTransactions(user.id);
    const teacherGroups = user.role === 'teacher' ? EduCoin.getTeacherGroups(user.id) : [];
    const studentGroup = user.role === 'student' ? EduCoin.getStudentGroup(user.id) : null;
    const teacherStudentIds = Array.from(new Set(teacherGroups.flatMap((group) => group.studentIds || [])));
    const teacherStudents = students.filter((item) => teacherStudentIds.includes(item.id));

    return {
      user,
      users,
      students,
      teachers,
      groups,
      shopItems,
      transactions,
      purchases,
      leaderboard,
      weekly,
      userTransactions,
      teacherGroups,
      teacherStudents,
      studentGroup,
    };
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  statCard(stat) {
    const iconSvg = typeof getUiIcon === 'function' ? getUiIcon(stat.icon, 'stat-svg') : `<span>${this.escapeHtml(stat.icon)}</span>`;
    return `
      <div class="stat-card">
        <div class="stat-icon" style="background:${stat.background};color:${stat.color};">${iconSvg}</div>
        <div class="stat-info">
          <div class="label">${this.escapeHtml(stat.label)}</div>
          <div class="value">${this.escapeHtml(stat.value)}</div>
          <div class="change">${this.escapeHtml(stat.note || '')}</div>
        </div>
      </div>
    `;
  },

  panel(title, body, actionHtml = '') {
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">
          <h3>${this.escapeHtml(title)}</h3>
          ${actionHtml}
        </div>
        ${body}
      </div>
    `;
  },

  emptyState(message) {
    const iconSvg = typeof getUiIcon === 'function' ? getUiIcon('empty', 'empty-svg') : '<span>-</span>';
    return `<div class="empty-state"><div class="icon">${iconSvg}</div><p>${this.escapeHtml(message)}</p></div>`;
  },

  renderTransactionList(transactions, currentUserId = null) {
    if (!transactions.length) {
      return this.emptyState("Harakatlar topilmadi");
    }

    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${transactions.map((tx) => {
          const fromUser = EduCoin.getUserById(tx.fromId);
          const toUser = EduCoin.getUserById(tx.toId);
          const isIncoming = currentUserId ? tx.toId === currentUserId && tx.type !== 'purchase' : tx.type !== 'purchase';
          const amountLabel = `${isIncoming ? '+' : tx.type === 'purchase' ? '-' : ''}${Math.abs(Number(tx.amount || 0)).toLocaleString()} coin`;
          const sideLabel = tx.type === 'purchase'
            ? (fromUser ? fromUser.name : 'Foydalanuvchi')
            : `${fromUser ? fromUser.name : "Noma'lum"} -> ${toUser ? toUser.name : 'Tizim'}`;
          return `
            <div style="display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">
              <div style="flex:1;">
                <div style="font-weight:700;">${this.escapeHtml(tx.reason || EduCoin.txnTypeLabel(tx.type))}</div>
                <div style="font-size:13px;color:var(--text3);">${this.escapeHtml(sideLabel)}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;color:${isIncoming ? 'var(--success)' : 'var(--warning)'};">${this.escapeHtml(amountLabel)}</div>
                <div style="font-size:12px;color:var(--text3);">${this.escapeHtml(EduCoin.formatDate(tx.createdAt))}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderLeaderboard(list, groups) {
    if (!list.length) {
      return this.emptyState("O'quvchilar topilmadi");
    }

    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${list.map((student, index) => {
          const group = groups.find((item) => item.studentIds.includes(student.id));
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);">
              <div style="display:flex;align-items:center;gap:12px;flex:1;">
                <div style="min-width:28px;font-weight:800;color:var(--text3);">#${index + 1}</div>
                <div class="user-avatar">${this.escapeHtml(getInitials(student.name))}</div>
                <div>
                  <div style="font-weight:700;">${this.escapeHtml(student.name)}</div>
                  <div style="font-size:13px;color:var(--text3);">${this.escapeHtml(group ? group.name : "Guruhsiz")}</div>
                </div>
              </div>
              <div style="font-weight:800;color:var(--coin);">${this.escapeHtml(EduCoin.formatCoins(student.coins || 0))}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderGroups(groups) {
    if (!groups.length) {
      return this.emptyState('Guruhlar mavjud emas');
    }

    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${groups.map((group) => `
          <div class="card card-sm">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
              <div>
                <div style="font-weight:700;">${this.escapeHtml(group.name)}</div>
                <div style="font-size:13px;color:var(--text3);">${this.escapeHtml(group.schedule || 'Jadval kiritilmagan')}</div>
              </div>
              <span class="badge badge-primary">${this.escapeHtml(`${(group.studentIds || []).length} o'quvchi`)}</span>
            </div>
            <div style="margin-top:10px;font-size:13px;color:var(--text2);">${this.escapeHtml(group.level || 'Daraja kiritilmagan')}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderShop(items) {
    if (!items.length) {
      return this.emptyState("Do'kon bo'sh");
    }

    const giftIcon = typeof getUiIcon === 'function' ? getUiIcon('gift') : '🎁';
    return `
      <div class="quick-actions">
        ${items.map((item) => `
          <div class="quick-action-card" onclick="window.location.href='shop.html'">
            <span class="quick-action-icon">${item.image ? this.escapeHtml(item.image) : giftIcon}</span>
            <div>${this.escapeHtml(item.name)}</div>
            <div style="font-size:13px;color:var(--text2);margin-top:6px;">${this.escapeHtml(EduCoin.formatCoins(item.price || 0))}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderQuickActions(actions) {
    return `
      <div class="quick-actions" style="margin-bottom:24px;">
        ${actions.map((action) => {
          const iconSvg = typeof getUiIcon === 'function' ? getUiIcon(action.icon) : `<span>${this.escapeHtml(action.icon)}</span>`;
          return `
          <div class="quick-action-card" onclick="window.location.href='${this.escapeHtml(action.href)}'">
            <span class="quick-action-icon">${iconSvg}</span>
            <div>${this.escapeHtml(action.label)}</div>
            <div style="font-size:13px;color:var(--text2);margin-top:6px;">${this.escapeHtml(action.note)}</div>
          </div>
        `}).join('')}
      </div>
    `;
  },

  renderWeeklyBars(series) {
    const maxAmount = Math.max(...series.map((item) => item.amount), 1);
    return `
      <div style="display:grid;grid-template-columns:repeat(${series.length}, minmax(0, 1fr));gap:12px;align-items:end;height:220px;padding-top:12px;">
        ${series.map((item) => `
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="font-size:12px;color:var(--text3);">${this.escapeHtml(item.amount.toLocaleString())}</div>
            <div style="width:100%;height:${Math.max(18, Math.round((item.amount / maxAmount) * 150))}px;background:linear-gradient(180deg, var(--primary), var(--primary-dark));border-radius:12px 12px 6px 6px;"></div>
            <div style="font-size:12px;color:var(--text2);">${this.escapeHtml(item.label)}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderRoleBreakdown(users) {
    const roles = ['student', 'teacher', 'manager', 'director', 'admin'];
    return `
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${roles.map((role) => {
          const count = users.filter((user) => user.role === role).length;
          const percent = users.length ? Math.round((count / users.length) * 100) : 0;
          return `
            <div>
              <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:6px;">
                <span>${this.escapeHtml(EduCoin.roleLabel(role))}</span>
                <strong>${count}</strong>
              </div>
              <div style="height:10px;background:var(--bg3);border-radius:999px;overflow:hidden;">
                <div style="height:100%;width:${percent}%;background:${EduCoin.roleBadgeColor(role)};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  getAwardTargets(ctx) {
    if (this.role === 'teacher') {
      return ctx.teacherStudents;
    }
    if (this.role === 'manager' || this.role === 'director' || this.role === 'admin') {
      return ctx.users.filter((user) => user.id !== ctx.user.id && user.role !== 'admin');
    }
    return [];
  },

  getModel(ctx) {
    const firstName = (ctx.user.name || ctx.user.username || '').split(' ')[0] || 'Foydalanuvchi';
    const topStudents = ctx.leaderboard.slice(0, 5);
    const awardTargets = this.getAwardTargets(ctx);
    const awardIcon = typeof getUiIcon === 'function' ? getUiIcon('plus') : '+';
    const commonAwardAction = awardTargets.length
      ? `<button class="btn btn-primary" onclick="openDashboardAward()"><span class="btn-icon">${awardIcon}</span>Coin berish</button>`
      : '';

    switch (this.role) {
      case 'student':
        return {
          heroTitle: `Salom, ${firstName}`,
          heroText: ctx.studentGroup ? `${ctx.studentGroup.name} guruhida faoliyat davom etmoqda.` : "Siz uchun tayyorlangan imkoniyatlarni ko'ring.",
          heroAction: `<a class="btn btn-primary" href="transfer.html"><span class="btn-icon">${typeof getUiIcon === 'function' ? getUiIcon('send') : ''}</span>Coin yuborish</a>`,
          stats: [
            { icon: 'balance', label: 'Balans', value: EduCoin.formatCoins(ctx.user.coins || 0), note: 'Joriy holat', background: 'rgba(255,215,0,0.12)', color: 'var(--coin)' },
            { icon: 'plus', label: 'Bugun olindi', value: `${ctx.userTransactions.filter((tx) => tx.toId === ctx.user.id).reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)}`, note: 'coin', background: 'rgba(0,255,136,0.12)', color: 'var(--success)' },
            { icon: 'hash', label: 'Reyting', value: `#${Math.max(1, ctx.leaderboard.findIndex((item) => item.id === ctx.user.id) + 1)}`, note: 'Top ro\'yxat', background: 'rgba(33,150,243,0.12)', color: '#2196F3' },
            { icon: 'shopping', label: 'Xaridlar', value: `${ctx.purchases.filter((item) => item.userId === ctx.user.id).length}`, note: "Do'kon", background: 'rgba(255,152,0,0.12)', color: '#FF9800' },
          ],
          quickActions: [
            { icon: 'shop', label: "Do'kon", note: 'Mahsulotlarni ko\'ring', href: 'shop.html' },
            { icon: 'rating', label: 'Reyting', note: 'Top o\'quvchilar', href: 'rating.html' },
            { icon: 'transfer', label: 'Transfer', note: 'Coin yuborish', href: 'transfer.html' },
            { icon: 'coins', label: 'Tangalar', note: 'Tarix va statistika', href: 'coins.html' },
          ],
          panels: [
            this.panel("So'nggi harakatlar", this.renderTransactionList(ctx.userTransactions.slice(0, 5), ctx.user.id), `<a class="btn btn-sm btn-secondary" href="coins.html">Barchasi</a>`),
            this.panel("Top o'quvchilar", this.renderLeaderboard(topStudents, ctx.groups), `<a class="btn btn-sm btn-secondary" href="rating.html">Barchasi</a>`),
            this.panel("Do'kon takliflari", this.renderShop(ctx.shopItems.slice(0, 4)), `<a class="btn btn-sm btn-secondary" href="shop.html">Barchasi</a>`),
            this.panel('Haftalik oqim', this.renderWeeklyBars(ctx.weekly)),
          ],
          awardTargets: [],
        };
      case 'teacher':
        return {
          heroTitle: `Salom, ${firstName}`,
          heroText: `${ctx.teacherGroups.length} ta guruh va ${ctx.teacherStudents.length} nafar o'quvchi kuzatuvda.`,
          heroAction: commonAwardAction,
          stats: [
            { icon: 'balance', label: 'Balans', value: EduCoin.formatCoins(ctx.user.coins || 0), note: 'Joriy holat', background: 'rgba(255,215,0,0.12)', color: 'var(--coin)' },
            { icon: 'groups', label: 'Guruhlar', value: `${ctx.teacherGroups.length}`, note: 'Faol guruh', background: 'rgba(156,39,176,0.12)', color: '#9C27B0' },
            { icon: 'users', label: "O'quvchilar", value: `${ctx.teacherStudents.length}`, note: 'Biriktirilgan', background: 'rgba(33,150,243,0.12)', color: '#2196F3' },
            { icon: 'plus', label: 'Berilgan coin', value: `${ctx.transactions.filter((tx) => tx.fromId === ctx.user.id && tx.type === 'award').reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0)}`, note: 'Jami', background: 'rgba(0,255,136,0.12)', color: 'var(--success)' },
          ],
          quickActions: [
            { icon: 'groups', label: 'Guruhlar', note: 'Ro\'yxat va tarkib', href: 'groups.html' },
            { icon: 'rating', label: 'Reyting', note: 'Top o\'quvchilar', href: 'rating.html' },
            { icon: 'coins', label: 'Tangalar', note: 'Mukofotlar tarixi', href: 'coins.html' },
            { icon: 'shop', label: "Do'kon", note: 'Mahsulotlar', href: 'shop.html' },
          ],
          panels: [
            this.panel('Guruhlarim', this.renderGroups(ctx.teacherGroups), `<a class="btn btn-sm btn-secondary" href="groups.html">Barchasi</a>`),
            this.panel("Mening top o'quvchilarim", this.renderLeaderboard([...ctx.teacherStudents].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 5), ctx.groups), `<a class="btn btn-sm btn-secondary" href="rating.html">Barchasi</a>`),
            this.panel("So'nggi mukofotlar", this.renderTransactionList(ctx.transactions.filter((tx) => tx.fromId === ctx.user.id).slice(0, 5))),
            this.panel('Haftalik oqim', this.renderWeeklyBars(ctx.weekly)),
          ],
          awardTargets,
        };
      case 'manager':
      case 'director':
        return {
          heroTitle: `Salom, ${firstName}`,
          heroText: `${ctx.students.length} o'quvchi, ${ctx.teachers.length} o'qituvchi va ${ctx.groups.length} ta guruh boshqaruv ostida.`,
          heroAction: commonAwardAction,
          stats: [
            { icon: 'users', label: "O'quvchilar", value: `${ctx.students.length}`, note: 'Faol', background: 'rgba(0,255,136,0.12)', color: 'var(--success)' },
            { icon: 'groups', label: "O'qituvchilar", value: `${ctx.teachers.length}`, note: 'Faol', background: 'rgba(33,150,243,0.12)', color: '#2196F3' },
            { icon: 'chart', label: 'Guruhlar', value: `${ctx.groups.length}`, note: 'Jami', background: 'rgba(156,39,176,0.12)', color: '#9C27B0' },
            { icon: 'shopping', label: "Do'kon", value: `${ctx.shopItems.length}`, note: 'Faol mahsulot', background: 'rgba(255,152,0,0.12)', color: '#FF9800' },
          ],
          quickActions: [
            { icon: 'addUser', label: 'Foydalanuvchi', note: "Yangi user qo'shish", href: 'add-user.html' },
            { icon: 'addCoin', label: 'Coin sahifasi', note: 'Mukofot va tarix', href: 'add-coin.html' },
            { icon: 'groups', label: 'Guruhlar', note: 'Tarkib nazorati', href: 'groups.html' },
            { icon: 'reports', label: 'Hisobotlar', note: 'Tahlil oynasi', href: 'reports.html' },
          ],
          panels: [
            this.panel("Top o'quvchilar", this.renderLeaderboard(topStudents, ctx.groups), `<a class="btn btn-sm btn-secondary" href="rating.html">Barchasi</a>`),
            this.panel("So'nggi tranzaksiyalar", this.renderTransactionList(ctx.transactions.slice(0, 6))),
            this.panel('Haftalik oqim', this.renderWeeklyBars(ctx.weekly)),
            this.panel("Do'kon takliflari", this.renderShop(ctx.shopItems.slice(0, 4)), `<a class="btn btn-sm btn-secondary" href="shop.html">Barchasi</a>`),
          ],
          awardTargets,
        };
      default:
        return {
          heroTitle: `Salom, ${firstName}`,
          heroText: `${ctx.users.length} faol foydalanuvchi va ${ctx.transactions.length} ta tranzaksiya nazorat ostida.`,
          heroAction: commonAwardAction,
          stats: [
            { icon: 'users', label: 'Foydalanuvchilar', value: `${ctx.users.length}`, note: 'Faol', background: 'rgba(244,67,54,0.12)', color: '#F44336' },
            { icon: 'coin', label: 'Muomaladagi coin', value: `${ctx.users.reduce((sum, user) => sum + Number(user.coins || 0), 0).toLocaleString()}`, note: 'Jami', background: 'rgba(255,215,0,0.12)', color: 'var(--coin)' },
            { icon: 'trending', label: 'Tranzaksiyalar', value: `${ctx.transactions.length}`, note: 'So\'nggi 50', background: 'rgba(33,150,243,0.12)', color: '#2196F3' },
            { icon: 'shopping', label: 'Xaridlar', value: `${ctx.purchases.length}`, note: "Do'kon", background: 'rgba(255,152,0,0.12)', color: '#FF9800' },
          ],
          quickActions: [
            { icon: 'users', label: 'Users', note: 'Boshqaruv sahifasi', href: 'users.html' },
            { icon: 'database', label: 'Database', note: 'Ma\'lumotlar ombori', href: 'database.html' },
            { icon: 'shop', label: "Do'kon", note: 'Mahsulotlar', href: 'shop.html' },
            { icon: 'settings', label: 'Sozlamalar', note: 'Tizim parametrlari', href: 'settings.html' },
          ],
          panels: [
            this.panel('Rollar taqsimoti', this.renderRoleBreakdown(ctx.users)),
            this.panel("So'nggi tranzaksiyalar", this.renderTransactionList(ctx.transactions.slice(0, 6))),
            this.panel('Haftalik oqim', this.renderWeeklyBars(ctx.weekly)),
            this.panel('Eng faol foydalanuvchilar', this.renderLeaderboard([...ctx.users].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 5), ctx.groups)),
          ],
          awardTargets,
        };
    }
  },

  renderAwardModal(targets) {
    if (!targets.length) {
      return '';
    }

    return `
      <div class="modal-overlay" id="dashboardAwardModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Coin berish</div>
            <button class="modal-close" onclick="closeModal('dashboardAwardModal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Qabul qiluvchi</label>
              <select class="form-control" id="dashboardAwardTarget">
                <option value="">Tanlang</option>
                ${targets.map((target) => `<option value="${this.escapeHtml(target.id)}">${this.escapeHtml(target.name)} (${this.escapeHtml(EduCoin.roleLabel(target.role))})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Miqdor</label>
              <input class="form-control" id="dashboardAwardAmount" type="number" min="1" placeholder="Masalan 50">
            </div>
            <div class="form-group">
              <label class="form-label">Sabab</label>
              <input class="form-control" id="dashboardAwardReason" type="text" placeholder="Sababni kiriting">
            </div>
            <div id="dashboardAwardAlert"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('dashboardAwardModal')">Bekor qilish</button>
            <button class="btn btn-primary" onclick="submitDashboardAward()">Saqlash</button>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    const ctx = this.getContext();
    const model = this.getModel(ctx);
    return `
      <div class="page-header">
        <div>
          <h1>${this.escapeHtml(model.heroTitle)}</h1>
          <p>${this.escapeHtml(model.heroText)}</p>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">${model.heroAction}</div>
      </div>
      ${this.renderQuickActions(model.quickActions)}
      <div class="grid grid-4" style="margin-bottom:24px;">${model.stats.map((stat) => this.statCard(stat)).join('')}</div>
      <div class="grid grid-2" style="margin-bottom:24px;">${model.panels.slice(0, 2).join('')}</div>
      <div class="grid grid-2">${model.panels.slice(2).join('')}</div>
      ${this.renderAwardModal(model.awardTargets)}
    `;
  },

  submitAward() {
    const target = document.getElementById('dashboardAwardTarget')?.value;
    const amount = Number(document.getElementById('dashboardAwardAmount')?.value || 0);
    const reason = document.getElementById('dashboardAwardReason')?.value?.trim() || 'Mukofot';
    const alertHost = document.getElementById('dashboardAwardAlert');

    if (!target || amount <= 0) {
      if (alertHost) {
        alertHost.innerHTML = `<div class="alert alert-danger">Foydalanuvchi va miqdorni to'g'ri kiriting.</div>`;
      }
      return;
    }

    const result = EduCoin.awardCoins(this.user.id, target, amount, reason);
    if (!result.success) {
      if (alertHost) {
        alertHost.innerHTML = `<div class="alert alert-danger">${this.escapeHtml(result.msg || 'Xatolik')}</div>`;
      }
      return;
    }

    closeModal('dashboardAwardModal');
    if (typeof showToast === 'function') {
      showToast('Coin muvaffaqiyatli berildi.', 'success');
    }
    this.init(this.role);
  },
};

function initRoleDashboard(role) {
  RoleDashboard.init(role);
}

function openDashboardAward() {
  openModal('dashboardAwardModal');
}

function submitDashboardAward() {
  RoleDashboard.submitAward();
}
