(function () {
  const AdminProfilePage = {
    currentUser: null,

    async init() {
      await EduCoin.init();
      const user = EduCoin.requireAuth(['admin']);
      if (!user) {
        return;
      }

      this.currentUser = user;
      const sidebarHost = document.getElementById('sidebar-container');
      if (sidebarHost && typeof buildSidebar === 'function') {
        sidebarHost.innerHTML = buildSidebar(user.role, user);
      }

      document.querySelector('.hamburger')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
      });

      this.attachEvents();
      this.render();
    },

    getContext() {
      const users = EduCoin.getUsers().filter((user) => user.active);
      const groups = EduCoin.getGroups();
      const reports = EduCoin.getReports();
      const shopItems = EduCoin.getShopItems().filter((item) => item.active);
      const transactions = EduCoin.getRecentTransactions(100);
      return {
        users,
        groups,
        reports,
        shopItems,
        transactions,
        students: users.filter((user) => user.role === 'student'),
        teachers: users.filter((user) => user.role === 'teacher'),
      };
    },

    syncTopbar() {
      const topCoinDisplay = document.getElementById('topCoinDisplay');
      if (topCoinDisplay) {
        topCoinDisplay.innerHTML = `${typeof getUiIcon === 'function' ? getUiIcon('coin') : ''}<span>${this.escapeHtml(EduCoin.formatCoins(this.currentUser.coins || 0))}</span>`;
      }
    },

    escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, (char) => (
        {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[char]
      ));
    },

    avatarMarkup(user = this.currentUser) {
      if (user.avatar) {
        return `<img src="${user.avatar}" alt="${this.escapeHtml(user.name)}">`;
      }
      return `<span>${this.escapeHtml(getInitials(user.name))}</span>`;
    },

    renderHero(ctx) {
      const loginMeta = this.currentUser.loginTime
        ? `Oxirgi sessiya: ${EduCoin.formatDate(this.currentUser.loginTime)}`
        : `Ro'yxatdan o'tgan: ${EduCoin.formatDate(this.currentUser.createdAt)}`;

      document.getElementById('profileHero').innerHTML = `
        <div class="profile-hero">
          <div class="profile-hero__main">
            <div class="profile-hero__avatar">${this.avatarMarkup()}</div>
            <div class="profile-hero__content">
              <div class="market-kicker">Admin Account</div>
              <h1>${this.escapeHtml(this.currentUser.name)}</h1>
              <p>Admin akkaunt boshqaruvi, xavfsizlik va tizimga tezkor kirish bitta oynada jamlandi.</p>
              <div class="profile-hero__chips">
                <span class="market-chip market-chip--primary">${this.escapeHtml(this.currentUser.username)}</span>
                <span class="market-chip market-chip--info">${this.escapeHtml(this.currentUser.email || 'Email kiritilmagan')}</span>
                <span class="market-chip market-chip--warning">${this.escapeHtml(loginMeta)}</span>
              </div>
            </div>
          </div>
          <div class="profile-hero__side">
            <div class="profile-balance-card">
              <span class="label">Admin balans</span>
              <strong>${this.escapeHtml(EduCoin.formatCoins(this.currentUser.coins || 0))}</strong>
              <div class="profile-balance-card__meta">${this.escapeHtml(`${ctx.users.length} ta faol akkaunt nazoratda`)}</div>
            </div>
            <div class="page-actions">
              <a class="btn btn-primary" href="dashboard.html">Dashboard</a>
              <a class="btn btn-secondary" href="coins.html">EduCoinlar</a>
            </div>
          </div>
        </div>
      `;
    },

    renderStats(ctx) {
      document.getElementById('profileStatsGrid').innerHTML = [
        this.statCard(ctx.users.length, 'Faol foydalanuvchi', "Tizimdagi aktiv akkauntlar"),
        this.statCard(ctx.groups.length, 'Guruhlar', 'Nazorat qilinayotgan guruhlar'),
        this.statCard(ctx.shopItems.length, "Do'kon", 'Faol mahsulotlar'),
        this.statCard(ctx.reports.length, 'Hisobotlar', 'Saqlangan snapshotlar'),
      ].join('');
    },

    statCard(value, label, meta) {
      return `
        <div class="profile-mini-stat">
          <div class="profile-mini-stat__value">${this.escapeHtml(String(value))}</div>
          <div class="profile-mini-stat__label">${this.escapeHtml(label)}</div>
          <div class="profile-mini-stat__meta">${this.escapeHtml(meta)}</div>
        </div>
      `;
    },

    renderSnapshot(ctx) {
      const topStudent = EduCoin.getLeaderboard()[0];
      const lastTransaction = ctx.transactions[0];
      document.getElementById('profileSnapshot').innerHTML = `
        <div class="profile-field-list">
          ${this.fieldRow('Rol', EduCoin.roleLabel(this.currentUser.role))}
          ${this.fieldRow('Code', this.currentUser.code || 'Mavjud emas')}
          ${this.fieldRow('Studentlar', `${ctx.students.length} ta`)}
          ${this.fieldRow("O'qituvchilar", `${ctx.teachers.length} ta`)}
          ${this.fieldRow('Top student', topStudent ? `${topStudent.name} (${EduCoin.formatCoins(topStudent.coins || 0)})` : 'Ma\'lumot yo\'q')}
          ${this.fieldRow('So\'nggi tranzaksiya', lastTransaction ? `${lastTransaction.reason || EduCoin.txnTypeLabel(lastTransaction.type)} - ${EduCoin.formatDate(lastTransaction.createdAt)}` : 'Tranzaksiya yo\'q')}
        </div>
      `;
    },

    fieldRow(label, value) {
      return `
        <div class="profile-field">
          <div class="profile-field__label">${this.escapeHtml(label)}</div>
          <div class="profile-field__value">${this.escapeHtml(value)}</div>
        </div>
      `;
    },

    renderQuickActions() {
      document.getElementById('profileQuickActions').innerHTML = `
        <div class="quick-actions">
          ${[
            { href: 'dashboard.html', icon: 'home', label: 'Dashboard', note: 'Barcha markaziy bloklar' },
            { href: 'coins.html', icon: 'coins', label: 'EduCoinlar', note: 'Coin nazorat markazi' },
            { href: 'rating.html', icon: 'rating', label: 'Reyting', note: 'Top studentlar' },
            { href: 'shop.html', icon: 'shop', label: "Do'kon", note: 'Mahsulot boshqaruvi' },
            { href: 'users.html', icon: 'users', label: 'Userlar', note: 'Foydalanuvchi boshqaruvi' },
            { href: 'reports.html', icon: 'reports', label: 'Hisobotlar', note: 'Analitika snapshotlari' },
            { href: 'database.html', icon: 'database', label: 'Database', note: "Ma'lumotlar ombori" },
            { href: 'settings.html', icon: 'settings', label: 'Sozlamalar', note: 'Admin konfiguratsiyasi' },
          ].map((item) => `
            <div class="quick-action-card" onclick="window.location.href='${this.escapeHtml(item.href)}'">
              <span class="quick-action-icon">${typeof getUiIcon === 'function' ? getUiIcon(item.icon) : ''}</span>
              <div>${this.escapeHtml(item.label)}</div>
              <div style="font-size:13px;color:var(--text2);margin-top:6px;">${this.escapeHtml(item.note)}</div>
            </div>
          `).join('')}
        </div>
      `;
    },

    fillForms() {
      document.getElementById('profileNameInput').value = this.currentUser.name || '';
      document.getElementById('profileEmailInput').value = this.currentUser.email || '';
      document.getElementById('profileUsernameInput').value = this.currentUser.username || '';
      document.getElementById('profileCodeInput').value = this.currentUser.code || '';
      document.getElementById('avatarPreview').innerHTML = this.avatarMarkup();
    },

    render() {
      this.currentUser = EduCoin.getCurrentUser() || this.currentUser;
      const ctx = this.getContext();
      this.syncTopbar();
      this.renderHero(ctx);
      this.renderStats(ctx);
      this.renderSnapshot(ctx);
      this.renderQuickActions();
      this.fillForms();
    },

    attachEvents() {
      document.getElementById('profileForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveProfile();
      });

      document.getElementById('passwordForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.changePassword();
      });

      document.getElementById('avatarInput')?.addEventListener('change', (event) => this.uploadAvatar(event));
      document.getElementById('removeAvatarBtn')?.addEventListener('click', () => this.removeAvatar());
    },

    saveProfile() {
      const name = document.getElementById('profileNameInput')?.value.trim() || '';
      const email = document.getElementById('profileEmailInput')?.value.trim() || '';
      const username = document.getElementById('profileUsernameInput')?.value.trim() || '';
      const code = document.getElementById('profileCodeInput')?.value.trim() || '';
      const alertHost = document.getElementById('profileAlert');

      if (!name || !username) {
        alertHost.innerHTML = '<div class="alert alert-danger">Ism va username to\'ldirilishi kerak.</div>';
        return;
      }

      const updated = EduCoin.updateUser(this.currentUser.id, {
        name,
        fullName: name,
        email,
        username,
        code,
      });

      if (!updated) {
        alertHost.innerHTML = '<div class="alert alert-danger">Bu username band yoki ma\'lumot saqlanmadi.</div>';
        return;
      }

      this.currentUser = EduCoin.getCurrentUser() || updated;
      alertHost.innerHTML = '<div class="alert alert-success">Profil ma\'lumotlari yangilandi.</div>';
      if (typeof showToast === 'function') {
        showToast('Profil yangilandi.', 'success');
      }

      const sidebarHost = document.getElementById('sidebar-container');
      if (sidebarHost && typeof buildSidebar === 'function') {
        sidebarHost.innerHTML = buildSidebar(this.currentUser.role, this.currentUser);
      }
      this.render();
    },

    changePassword() {
      const currentPassword = document.getElementById('currentPasswordInput')?.value || '';
      const newPassword = document.getElementById('newPasswordInput')?.value || '';
      const confirmPassword = document.getElementById('confirmPasswordInput')?.value || '';
      const alertHost = document.getElementById('passwordAlert');
      const freshUser = EduCoin.getCurrentUser();

      if (!freshUser || currentPassword !== freshUser.password) {
        alertHost.innerHTML = '<div class="alert alert-danger">Joriy parol noto\'g\'ri.</div>';
        return;
      }
      if (newPassword.length < 6) {
        alertHost.innerHTML = '<div class="alert alert-danger">Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak.</div>';
        return;
      }
      if (newPassword !== confirmPassword) {
        alertHost.innerHTML = '<div class="alert alert-danger">Yangi parollar mos emas.</div>';
        return;
      }

      EduCoin.updateUser(this.currentUser.id, { password: newPassword });
      alertHost.innerHTML = '<div class="alert alert-success">Parol muvaffaqiyatli yangilandi.</div>';
      document.getElementById('currentPasswordInput').value = '';
      document.getElementById('newPasswordInput').value = '';
      document.getElementById('confirmPasswordInput').value = '';
      if (typeof showToast === 'function') {
        showToast('Parol yangilandi.', 'success');
      }
    },

    uploadAvatar(event) {
      const file = event.target.files?.[0];
      const alertHost = document.getElementById('avatarAlert');
      if (!file) {
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alertHost.innerHTML = '<div class="alert alert-danger">Rasm hajmi 5MB dan oshmasligi kerak.</div>';
        return;
      }

      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        alertHost.innerHTML = '<div class="alert alert-danger">Faqat JPG, PNG, GIF yoki WEBP formatlari qabul qilinadi.</div>';
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        EduCoin.updateUser(this.currentUser.id, { avatar: loadEvent.target.result });
        this.currentUser = EduCoin.getCurrentUser() || this.currentUser;
        alertHost.innerHTML = '<div class="alert alert-success">Avatar yangilandi.</div>';
        if (typeof showToast === 'function') {
          showToast('Avatar yangilandi.', 'success');
        }
        this.render();
      };
      reader.onerror = () => {
        alertHost.innerHTML = '<div class="alert alert-danger">Rasmni yuklashda xatolik yuz berdi.</div>';
      };
      reader.readAsDataURL(file);
    },

    removeAvatar() {
      const alertHost = document.getElementById('avatarAlert');
      EduCoin.updateUser(this.currentUser.id, { avatar: null });
      this.currentUser = EduCoin.getCurrentUser() || this.currentUser;
      alertHost.innerHTML = '<div class="alert alert-success">Avatar olib tashlandi.</div>';
      if (typeof showToast === 'function') {
        showToast('Avatar olib tashlandi.', 'success');
      }
      this.render();
    },
  };

  window.initAdminProfilePage = function initAdminProfilePage() {
    AdminProfilePage.init();
  };
})();
