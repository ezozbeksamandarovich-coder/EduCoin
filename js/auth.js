const EDUCOIN_STORAGE_PREFIX = 'educoin_';
const EDUCOIN_DEFAULT_UI = { blur: 'on', colorTheme: 'green' };
const EDUCOIN_CLEAN_BOOT_KEY = 'clean_boot_v1';

const EduCoin = {
  _sessionListenerAttached: false,

  getData(key) {
    try {
      return JSON.parse(localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}${key}`));
    } catch {
      return null;
    }
  },

  setData(key, value) {
    try {
      localStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('localStorage setData:', key, e);
      return false;
    }
  },

  /** shop.json dan kelgan mahsulotni o'chirish uchun (qayta yuklanganda qaytmasin) */
  addShopRemovedId(id) {
    if (!id) return;
    const list = this.getData('shopRemovedIds') || [];
    if (!list.includes(id)) {
      list.push(id);
      this.setData('shopRemovedIds', list);
    }
  },

  removeData(key) {
    localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}${key}`);
  },

  async init() {
    const bundled = await this.loadBundledData();
    let users = this.normalizeUsers(this.mergeById(this.getData('users') || [], bundled.users));
    let groups = this.normalizeGroups(this.mergeById(this.getData('groups') || [], bundled.groups));
    let shop = this.normalizeShopItems(this.mergeById(this.getData('shop') || [], bundled.shop));
    const shopRemovedIds = new Set(this.getData('shopRemovedIds') || []);
    shop = shop.filter((item) => item && item.id && !shopRemovedIds.has(item.id));
    let coins = this.normalizeTransactions(this.mergeById(this.getData('coins') || [], bundled.coins));
    let purchases = this.normalizePurchases(
      this.mergeById(this.getData('purchases') || [], this.buildPurchasesFromTransactions(coins, shop))
    );
    let reports = this.normalizeReports(this.mergeById(this.getData('reports') || [], bundled.reports));

    ({ users, groups, shop, coins, purchases, reports } = this.applyCleanBoot({
      users,
      groups,
      shop,
      coins,
      purchases,
      reports,
    }));

    this.setData('users', users);
    this.setData('groups', groups);
    this.setData('shop', shop);
    this.setData('coins', coins);
    this.setData('purchases', purchases);
    this.setData('reports', reports);
    this.setData('initialized', true);

    if (!this.getData('uiSettings')) {
      this.setData('uiSettings', EDUCOIN_DEFAULT_UI);
    }

    if (this.isSessionExpired()) {
      this.clearSessionData({ preserveRememberedUser: true });
    }
  },

  applyCleanBoot(snapshot) {
    if (this.getData(EDUCOIN_CLEAN_BOOT_KEY)) {
      return snapshot;
    }

    const adminIds = new Set(
      (Array.isArray(snapshot.users) ? snapshot.users : [])
        .filter((user) => user.role === 'admin' && user.active !== false)
        .map((user) => user.id)
    );

    const users = (Array.isArray(snapshot.users) ? snapshot.users : []).filter((user) => adminIds.has(user.id));
    const cleaned = {
      users,
      groups: [],
      shop: [],
      coins: [],
      purchases: [],
      reports: [],
    };

    this.clearSessionData();
    localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}remember_me`);
    localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}remembered_user`);
    this.setData(EDUCOIN_CLEAN_BOOT_KEY, true);

    return cleaned;
  },

  async loadBundledData() {
    const files = await Promise.all([
      this.fetchJson('users.json'),
      this.fetchJson('groups.json'),
      this.fetchJson('shop.json'),
      this.fetchJson('coins.json'),
      this.fetchJson('reports.json'),
    ]);

    return {
      users: files[0],
      groups: files[1],
      shop: files[2],
      coins: files[3],
      reports: files[4],
    };
  },

  async fetchJson(filename) {
    const candidates = [`../../data/${filename}`, `../data/${filename}`, `data/${filename}`];

    for (const path of candidates) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          return await response.json();
        }
      } catch {
        // try next path
      }
    }

    return [];
  },

  mergeById(existing, bundled) {
    const records = new Map();

    (Array.isArray(bundled) ? bundled : []).forEach((item) => {
      if (item && item.id) {
        records.set(item.id, { ...item });
      }
    });

    (Array.isArray(existing) ? existing : []).forEach((item) => {
      if (item && item.id) {
        records.set(item.id, { ...(records.get(item.id) || {}), ...item });
      }
    });

    return Array.from(records.values());
  },

  normalizeUsers(users) {
    return (Array.isArray(users) ? users : []).map((user, index) => {
      const name = user.name || user.fullName || user.username || `User ${index + 1}`;
      return {
        ...user,
        id: user.id || `u${String(index + 1).padStart(3, '0')}`,
        username: user.username || `user${index + 1}`,
        password: user.password || 'password123',
        role: user.role || 'student',
        name,
        fullName: name,
        email: user.email || '',
        code: user.code || user.username || '',
        avatar: user.avatar || null,
        coins: Number(user.coins || 0),
        active: user.active !== false,
        createdAt: user.createdAt || new Date().toISOString(),
      };
    });
  },

  normalizeGroups(groups) {
    return (Array.isArray(groups) ? groups : []).map((group, index) => ({
      ...group,
      id: group.id || `g${String(index + 1).padStart(3, '0')}`,
      name: group.name || `Guruh ${index + 1}`,
      teacherId: group.teacherId || null,
      studentIds: Array.from(new Set(Array.isArray(group.studentIds) ? group.studentIds : [])),
      schedule: group.schedule || '',
      level: group.level || '',
      createdAt: group.createdAt || new Date().toISOString(),
    }));
  },

  normalizeShopItems(items) {
    return (Array.isArray(items) ? items : []).map((item, index) => ({
      ...item,
      id: item.id || `s${String(index + 1).padStart(3, '0')}`,
      name: item.name || `Mahsulot ${index + 1}`,
      description: item.description || '',
      image: item.image || item.icon || 'Item',
      category: item.category || 'Umumiy',
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
      active: item.active !== false,
      createdAt: item.createdAt || new Date().toISOString(),
    }));
  },

  normalizeTransactions(transactions) {
    return (Array.isArray(transactions) ? transactions : []).map((tx, index) => {
      const fromId = tx.fromId || tx.from || null;
      const toId = tx.toId || tx.to || (tx.type === 'purchase' ? 'system' : null);
      return {
        ...tx,
        id: tx.id || `t${String(index + 1).padStart(3, '0')}`,
        type: tx.type || 'award',
        fromId,
        toId,
        from: fromId,
        to: toId,
        amount: Number(tx.amount || 0),
        itemId: tx.itemId || null,
        reason: tx.reason || '',
        createdAt: tx.createdAt || new Date().toISOString(),
      };
    });
  },

  normalizePurchases(purchases) {
    return (Array.isArray(purchases) ? purchases : []).map((purchase, index) => ({
      ...purchase,
      id: purchase.id || `p${String(index + 1).padStart(3, '0')}`,
      userId: purchase.userId || purchase.fromId || null,
      itemId: purchase.itemId || null,
      itemName: purchase.itemName || purchase.name || 'Mahsulot',
      price: Number(purchase.price || 0),
      purchasedAt: purchase.purchasedAt || purchase.createdAt || new Date().toISOString(),
    }));
  },

  normalizeReports(reports) {
    return (Array.isArray(reports) ? reports : []).map((report, index) => ({
      ...report,
      id: report.id || `r${String(index + 1).padStart(3, '0')}`,
      type: report.type || 'manual',
      title: report.title || `Hisobot ${index + 1}`,
      period: report.period || '',
      totalCoinsAwarded: Number(report.totalCoinsAwarded || 0),
      totalPurchases: Number(report.totalPurchases || 0),
      totalTransfers: Number(report.totalTransfers || 0),
      activeStudents: Number(report.activeStudents || 0),
      activeTeachers: Number(report.activeTeachers || 0),
      createdBy: report.createdBy || null,
      createdAt: report.createdAt || new Date().toISOString(),
    }));
  },

  buildPurchasesFromTransactions(transactions, items) {
    const itemMap = new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
    return (Array.isArray(transactions) ? transactions : [])
      .filter((tx) => tx.type === 'purchase')
      .map((tx, index) => ({
        id: `seed_purchase_${index + 1}_${tx.id}`,
        userId: tx.fromId,
        itemId: tx.itemId || null,
        itemName: itemMap.get(tx.itemId)?.name || 'Mahsulot',
        price: Math.abs(Number(tx.amount || itemMap.get(tx.itemId)?.price || 0)),
        purchasedAt: tx.createdAt,
      }));
  },

  login(username, password) {
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '');
    if (!normalizedUsername || normalizedPassword.length < 6) {
      return null;
    }

    const user = this.getUsers().find(
      (candidate) =>
        candidate.username === normalizedUsername &&
        candidate.password === normalizedPassword &&
        candidate.active
    );
    if (!user) {
      return null;
    }

    const rememberMe = localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}remember_me`) === 'true';
    const session = {
      id: user.id,
      role: user.role,
      name: user.name,
      username: user.username,
      rememberMe,
      loginTime: new Date().toISOString(),
      sessionId: this.generateSessionId(),
    };

    sessionStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}session`, JSON.stringify(session));
    if (rememberMe) {
      localStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}session`, JSON.stringify(session));
      localStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}session_expiry`, String(Date.now() + 86400000));
      localStorage.setItem(
        `${EDUCOIN_STORAGE_PREFIX}remembered_user`,
        JSON.stringify({ username: normalizedUsername })
      );
    } else {
      localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}session`);
      localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}session_expiry`);
      localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}remembered_user`);
    }

    this.broadcastSessionChange('login', session);
    return user;
  },

  autoLogin() {
    const user = this.getCurrentUser();
    return user && user.rememberMe ? user : null;
  },

  getRememberedUsername() {
    try {
      return JSON.parse(localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}remembered_user`))?.username || '';
    } catch {
      return '';
    }
  },

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  },

  broadcastSessionChange(action, sessionData) {
    localStorage.setItem(
      `${EDUCOIN_STORAGE_PREFIX}session_event`,
      JSON.stringify({ action, sessionData, timestamp: Date.now() })
    );
  },

  listenForSessionChanges() {
    if (this._sessionListenerAttached) {
      return;
    }
    this._sessionListenerAttached = true;

    window.addEventListener('storage', (event) => {
      if (event.key !== `${EDUCOIN_STORAGE_PREFIX}session_event` || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue);
        if (payload.action === 'login' && payload.sessionData) {
          sessionStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}session`, JSON.stringify(payload.sessionData));
          if (payload.sessionData.rememberMe) {
            localStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}session`, JSON.stringify(payload.sessionData));
            localStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}session_expiry`, String(Date.now() + 86400000));
          }
        }

        if (payload.action === 'logout') {
          this.clearSessionData({ preserveRememberedUser: true });
          window.location.href = this.getIndexPath();
        }
      } catch {
        // ignore malformed event
      }
    });
  },

  isSessionExpired() {
    const expiry = localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}session_expiry`);
    return Boolean(expiry && Date.now() > Number(expiry));
  },

  clearSessionData({ preserveRememberedUser = false } = {}) {
    sessionStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}session`);
    localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}session`);
    localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}session_expiry`);
    if (!preserveRememberedUser) {
      localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}remembered_user`);
    }
  },

  logout({ silent = false } = {}) {
    const rememberMe = localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}remember_me`) === 'true';
    if (!silent) {
      this.broadcastSessionChange('logout', null);
    }
    this.clearSessionData({ preserveRememberedUser: rememberMe });
    if (!rememberMe) {
      localStorage.removeItem(`${EDUCOIN_STORAGE_PREFIX}remembered_user`);
    }
    if (!silent) {
      window.location.href = this.getIndexPath();
    }
  },

  getCurrentUser() {
    if (this.isSessionExpired()) {
      this.clearSessionData({ preserveRememberedUser: true });
      return null;
    }

    let rawSession = sessionStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}session`);
    if (!rawSession) {
      rawSession = localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}session`);
      if (rawSession) {
        sessionStorage.setItem(`${EDUCOIN_STORAGE_PREFIX}session`, rawSession);
      }
    }
    if (!rawSession) {
      return null;
    }

    try {
      const session = JSON.parse(rawSession);
      const user = this.getUsers().find((candidate) => candidate.id === session.id && candidate.active);
      return user ? { ...user, sessionId: session.sessionId, loginTime: session.loginTime, rememberMe: Boolean(session.rememberMe) } : null;
    } catch {
      this.clearSessionData({ preserveRememberedUser: true });
      return null;
    }
  },

  requireAuth(allowedRoles = []) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = this.getIndexPath();
      return null;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      window.location.href = this.getRoleHome(user.role);
      return null;
    }
    return user;
  },

  getIndexPath() {
    return window.location.pathname.includes('/pages/') ? '../../index.html' : 'index.html';
  },

  getRoleHome(role) {
    const base = window.location.pathname.includes('/pages/') ? '../../' : '';
    const map = {
      student: `${base}pages/student/dashboard.html`,
      teacher: `${base}pages/teacher/dashboard.html`,
      manager: `${base}pages/manager/dashboard.html`,
      director: `${base}pages/director/dashboard.html`,
      admin: `${base}pages/admin/dashboard.html`,
    };
    return map[role] || this.getIndexPath();
  },

  getUsers() {
    return this.normalizeUsers(this.getData('users') || []);
  },

  getUserById(id) {
    return this.getUsers().find((user) => user.id === id) || null;
  },

  getUsersByRole(role) {
    return this.getUsers().filter((user) => user.role === role);
  },

  addUser(userData) {
    const users = this.getUsers();
    const next = this.normalizeUsers([{ id: `u${Date.now()}`, coins: 0, active: true, createdAt: new Date().toISOString(), ...userData }])[0];
    users.push(next);
    this.setData('users', users);
    return next;
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) {
      return null;
    }
    users[index] = this.normalizeUsers([{ ...users[index], ...updates }])[0];
    this.setData('users', users);
    return users[index];
  },

  getTransactions() {
    return this.normalizeTransactions(this.getData('coins') || []);
  },

  getRecentTransactions(limit = 5) {
    return [...this.getTransactions()]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, limit);
  },

  getUserTransactions(userId) {
    return this.getRecentTransactions(1000).filter((tx) => tx.fromId === userId || tx.toId === userId);
  },

  addTransaction(data) {
    const transactions = this.getTransactions();
    const next = this.normalizeTransactions([{ id: `t${Date.now()}`, createdAt: new Date().toISOString(), ...data }])[0];
    transactions.push(next);
    this.setData('coins', transactions);
    return next;
  },

  awardCoins(fromId, toId, amount, reason) {
    const numericAmount = Number(amount);
    if (!toId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return { success: false, msg: "Coin miqdori noto'g'ri" };
    }
    if (fromId === toId) {
      return { success: false, msg: "O'zingizga coin bera olmaysiz" };
    }
    const users = this.getUsers();
    const toIndex = users.findIndex((user) => user.id === toId && user.active);
    if (toIndex === -1) {
      return { success: false, msg: 'Foydalanuvchi topilmadi' };
    }
    users[toIndex].coins = Number(users[toIndex].coins || 0) + numericAmount;
    this.setData('users', users);
    this.addTransaction({ type: 'award', fromId, toId, amount: numericAmount, reason: reason || 'Mukofot' });
    return { success: true };
  },

  transferCoins(fromId, toId, amount, reason) {
    const numericAmount = Number(amount);
    if (!toId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return { success: false, msg: "Coin miqdori noto'g'ri" };
    }
    if (fromId === toId) {
      return { success: false, msg: "O'zingizga coin yubora olmaysiz" };
    }
    const users = this.getUsers();
    const fromIndex = users.findIndex((user) => user.id === fromId && user.active);
    const toIndex = users.findIndex((user) => user.id === toId && user.active);
    if (fromIndex === -1 || toIndex === -1) {
      return { success: false, msg: 'Foydalanuvchi topilmadi' };
    }
    if (Number(users[fromIndex].coins || 0) < numericAmount) {
      return { success: false, msg: "Yetarli coin yo'q" };
    }
    users[fromIndex].coins -= numericAmount;
    users[toIndex].coins += numericAmount;
    this.setData('users', users);
    this.addTransaction({ type: 'transfer', fromId, toId, amount: numericAmount, reason: reason || "Coin o'tkazmasi" });
    return { success: true };
  },

  getShopItems() {
    return this.normalizeShopItems(this.getData('shop') || []);
  },

  getActiveShopItems() {
    return this.getShopItems().filter((item) => item.active && item.stock > 0);
  },

  addShopItem(item) {
    const items = this.getShopItems();
    const row = this.normalizeShopItems([
      { id: `s${Date.now()}`, active: true, createdAt: new Date().toISOString(), ...item },
    ])[0];
    items.push(row);
    if (!this.setData('shop', items)) {
      items.pop();
      return null;
    }
    return row;
  },

  purchaseItem(userId, itemId) {
    const users = this.getUsers();
    const items = this.getShopItems();
    const userIndex = users.findIndex((user) => user.id === userId && user.active);
    const itemIndex = items.findIndex((item) => item.id === itemId && item.active);
    if (userIndex === -1 || itemIndex === -1) {
      return { success: false, msg: 'Topilmadi' };
    }
    if (Number(users[userIndex].coins || 0) < Number(items[itemIndex].price || 0)) {
      return { success: false, msg: "Yetarli coin yo'q" };
    }
    if (Number(items[itemIndex].stock || 0) <= 0) {
      return { success: false, msg: "Stokda yo'q" };
    }
    users[userIndex].coins -= Number(items[itemIndex].price || 0);
    items[itemIndex].stock -= 1;
    this.setData('users', users);
    this.setData('shop', items);
    this.addTransaction({ type: 'purchase', fromId: userId, toId: 'system', amount: -Math.abs(Number(items[itemIndex].price || 0)), itemId, reason: `${items[itemIndex].name} sotib olindi` });
    const purchases = this.normalizePurchases(this.getData('purchases') || []);
    purchases.push({ id: `p${Date.now()}`, userId, itemId, itemName: items[itemIndex].name, price: Number(items[itemIndex].price || 0), purchasedAt: new Date().toISOString() });
    this.setData('purchases', purchases);
    return { success: true };
  },

  getGroups() {
    return this.normalizeGroups(this.getData('groups') || []);
  },

  getTeacherGroups(teacherId) {
    return this.getGroups().filter((group) => group.teacherId === teacherId);
  },

  getStudentGroup(studentId) {
    return this.getGroups().find((group) => group.studentIds.includes(studentId)) || null;
  },

  addGroup(data) {
    const groups = this.getGroups();
    groups.push(this.normalizeGroups([{ id: `g${Date.now()}`, studentIds: [], createdAt: new Date().toISOString(), ...data }])[0]);
    this.setData('groups', groups);
    return groups[groups.length - 1];
  },

  getLeaderboard() {
    return [...this.getUsersByRole('student')].sort((left, right) => (right.coins || 0) - (left.coins || 0));
  },

  getWeeklySeries(days = 7) {
    const labels = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const transactions = this.getTransactions();
    const series = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
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
        count: dayTransactions.length,
        amount: dayTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0),
      });
    }
    return series;
  },

  getReports() {
    return this.normalizeReports(this.getData('reports') || []);
  },

  generateReport() {
    const now = new Date();
    const transactions = this.getTransactions();
    const report = this.normalizeReports([{
      id: `r${Date.now()}`,
      type: 'manual',
      title: `${now.toLocaleString('uz-Latn-UZ', { month: 'long' })} ${now.getFullYear()} Hisoboti`,
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      totalCoinsAwarded: transactions.filter((tx) => tx.type === 'award').reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0),
      totalPurchases: transactions.filter((tx) => tx.type === 'purchase').reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0),
      totalTransfers: transactions.filter((tx) => tx.type === 'transfer').reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0),
      activeStudents: this.getUsersByRole('student').filter((user) => user.active).length,
      activeTeachers: this.getUsersByRole('teacher').filter((user) => user.active).length,
      createdBy: this.getCurrentUser()?.id || null,
      createdAt: now.toISOString(),
    }])[0];
    const reports = this.getReports();
    reports.push(report);
    this.setData('reports', reports);
    return report;
  },

  formatCoins(amount) {
    return `${Number(amount || 0).toLocaleString()} coin`;
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString('uz-Latn-UZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  txnTypeLabel(type) {
    return { award: 'Mukofot', transfer: "O'tkazma", purchase: 'Xarid' }[type] || type;
  },

  roleLabel(role) {
    return { student: "O'quvchi", teacher: "O'qituvchi", manager: 'Menejer', director: 'Direktor', admin: 'Admin' }[role] || role;
  },

  roleBadgeColor(role) {
    return { student: '#4CAF50', teacher: '#2196F3', manager: '#FF9800', director: '#9C27B0', admin: '#F44336' }[role] || '#888';
  },
};

function applyUISettings(blurValue, colorTheme) {
  const body = document.body;
  if (!body) return;

  body.classList.remove('blur-on', 'blur-off', 'blur-heavy', 'white-bg', 'black-bg');
  if (blurValue === 'heavy' || blurValue === 'onlyblur') body.classList.add('blur-heavy');
  else if (blurValue === 'off' || blurValue === 'false') body.classList.add('blur-off');
  else if (blurValue === 'black') body.classList.add('black-bg');
  else if (blurValue === 'white') body.classList.add('white-bg');
  else body.classList.add('blur-on');

  const themes = {
    green: { primary: '#00FF88', dark: '#00CC66', light: '#00FFAA', glow: 'rgba(0,255,136,0.4)' },
    blue: { primary: '#2196F3', dark: '#1976D2', light: '#64B5F6', glow: 'rgba(33,150,243,0.4)' },
    purple: { primary: '#9C27B0', dark: '#7B1FA2', light: '#CE93D8', glow: 'rgba(156,39,176,0.4)' },
    red: { primary: '#F44336', dark: '#D32F2F', light: '#EF9A9A', glow: 'rgba(244,67,54,0.4)' },
    orange: { primary: '#FF9800', dark: '#F57C00', light: '#FFCC80', glow: 'rgba(255,152,0,0.4)' },
  };
  const selected = themes[colorTheme] || themes.green;
  body.style.setProperty('--primary', selected.primary);
  body.style.setProperty('--primary-color', selected.primary);
  body.style.setProperty('--primary-dark', selected.dark);
  body.style.setProperty('--primary-light', selected.light);
  body.style.setProperty('--secondary', selected.dark);
  body.style.setProperty('--secondary-color', selected.dark);
  body.style.setProperty('--accent', selected.light);
  body.style.setProperty('--accent-color', selected.light);
  body.style.setProperty('--glow', `0 0 20px ${selected.glow}`);
  body.style.setProperty('--glow-lg', `0 0 40px ${selected.glow}`);
}

(function applySavedUISettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}uiSettings`)) || {};
    const blur = settings.blur || EDUCOIN_DEFAULT_UI.blur;
    const theme = settings.colorTheme || EDUCOIN_DEFAULT_UI.colorTheme;
    if (document.body) applyUISettings(blur, theme);
    else document.addEventListener('DOMContentLoaded', () => applyUISettings(blur, theme));
  } catch {
    // ignore invalid ui settings
  }
})();

document.addEventListener('DOMContentLoaded', async () => {
  await EduCoin.init();
  try {
    const settings = JSON.parse(localStorage.getItem(`${EDUCOIN_STORAGE_PREFIX}uiSettings`)) || {};
    applyUISettings(settings.blur || EDUCOIN_DEFAULT_UI.blur, settings.colorTheme || EDUCOIN_DEFAULT_UI.colorTheme);
  } catch {
    applyUISettings(EDUCOIN_DEFAULT_UI.blur, EDUCOIN_DEFAULT_UI.colorTheme);
  }
  EduCoin.listenForSessionChanges();
});
