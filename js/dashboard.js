// ==========================================
// EduCoin - Dashboard Navigation Logic
// ==========================================

class Dashboard {
  constructor() {
    this.currentPage = 'dashboard';
    this.sidebarCollapsed = false;
    this.mobileMenuOpen = false;
    this.user = null;
    this.init();
  }

  async init() {
    // Wait for EduCoin to be available
    if (typeof EduCoin === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    await EduCoin.init();
    this.user = EduCoin.getCurrentUser();
    
    if (!this.user) {
      window.location.href = 'login.html';
      return;
    }

    this.setupEventListeners();
    this.updateUserInfo();
    this.setupRoleBasedNavigation();
    this.loadPageContent(this.currentPage);
  }

  setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }
    
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        if (page) {
          this.navigateToPage(page);
        }
      });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Notification bell
    const notificationBell = document.querySelector('.notification-bell');
    if (notificationBell) {
      notificationBell.addEventListener('click', () => {
        this.showNotifications();
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.mobileMenuOpen && 
          !sidebar.contains(e.target) && 
          !mobileMenuToggle?.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  updateUserInfo() {
    if (!this.user) return;

    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');

    if (userNameEl) {
      userNameEl.textContent = this.user.name || this.user.username || 'Foydalanuvchi';
    }

    if (userRoleEl) {
      const roleLabels = {
        admin: 'Administrator',
        director: 'Direktor',
        teacher: 'O\'qituvchi',
        student: 'O\'quvchi',
        manager: 'Menejer'
      };
      userRoleEl.textContent = roleLabels[this.user.role] || this.user.role || 'Foydalanuvchi';
    }
  }

  setupRoleBasedNavigation() {
    if (!this.user) return;

    // Show role-specific menus
    const adminMenu = document.getElementById('adminMenu');
    const directorMenu = document.getElementById('directorMenu');
    const teacherMenu = document.getElementById('teacherMenu');

    // Hide all role menus first
    if (adminMenu) adminMenu.style.display = 'none';
    if (directorMenu) directorMenu.style.display = 'none';
    if (teacherMenu) teacherMenu.style.display = 'none';

    // Show appropriate menu based on role
    switch (this.user.role) {
      case 'admin':
        if (adminMenu) adminMenu.style.display = 'block';
        break;
      case 'director':
        if (directorMenu) directorMenu.style.display = 'block';
        break;
      case 'teacher':
        if (teacherMenu) teacherMenu.style.display = 'block';
        break;
    }

    // Update active link based on current page
    this.updateActiveNavLink();
  }

  navigateToPage(page) {
    // Update active navigation
    this.updateActiveNavLink(page);
    
    // Load page content
    this.loadPageContent(page);
    
    // Close mobile menu
    this.closeMobileMenu();
  }

  updateActiveNavLink(page = this.currentPage) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      const linkPage = link.getAttribute('data-page');
      if (linkPage === page) {
        link.classList.add('active');
      }
    });
  }

  loadPageContent(page) {
    const pageContent = document.getElementById('pageContent');
    const pageTitle = document.getElementById('pageTitle');
    
    if (!pageContent) return;

    this.currentPage = page;

    // Update page title
    const titles = {
      'dashboard': 'Bosh sahifa',
      'coins': 'Tangalar',
      'shop': 'Do\'kon',
      'rating': 'Reyting',
      'profile': 'Profil',
      'users': 'Foydalanuvchilar',
      'database': 'Ma\'lumotlar bazasi',
      'reports': 'Hisobotlar',
      'add-coin': 'Tanga qo\'shish',
      'add-user': 'Foydalanuvchi qo\'shish',
      'groups': 'Guruhlar',
      'income': 'Daromadlar'
    };
    
    if (pageTitle) {
      pageTitle.textContent = titles[page] || 'Sahifa';
    }

    // Load page content based on role and page
    this.renderPageContent(page, titles[page] || 'Sahifa');
  }

  renderPageContent(page, title) {
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    // For now, show placeholder content for most pages
    // In a real application, this would load actual page content
    const placeholderContent = `
      <div class="page-placeholder">
        <div class="placeholder-icon">
          <i class="fas fa-cog fa-spin"></i>
        </div>
        <h2>${title}</h2>
        <p>Bu sahifa hozircha tayyor emas. Tez orada qo'shiladi.</p>
        <div style="margin-top: 20px;">
          <button class="action-btn" onclick="window.dashboard.navigateToPage('dashboard')">
            <i class="fas fa-arrow-left"></i>
            <span>Bosh sahifaga qaytish</span>
          </button>
        </div>
      </div>
    `;

    // Special handling for dashboard page
    if (page === 'dashboard') {
      this.loadDashboardContent();
    } else {
      pageContent.innerHTML = placeholderContent;
    }
  }

  loadDashboardContent() {
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    // Dashboard content with stats and activity
    const dashboardContent = `
      <!-- Dashboard Stats -->
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="totalCoins">0</div>
            <div class="stat-label">Jami tangalar</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="totalUsers">0</div>
            <div class="stat-label">Foydalanuvchilar</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="weeklyGrowth">0%</div>
            <div class="stat-label">Haftalik o'sish</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="totalTransactions">0</div>
            <div class="stat-label">Tranzaksiyalar</div>
          </div>
        </div>
      </div>

      <div class="dashboard-content">
        <div class="content-section">
          <h2>So'nggi faoliyat</h2>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">
                <i class="fas fa-coins"></i>
              </div>
              <div class="activity-details">
                <div class="activity-title">Tanga qo'shildi</div>
                <div class="activity-desc">Aliyevga 50 ta tanga berildi</div>
                <div class="activity-time">5 daqiqa oldin</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <i class="fas fa-shopping-cart"></i>
              </div>
              <div class="activity-details">
                <div class="activity-title">Xarid qilindi</div>
                <div class="activity-desc">Karim qalam sotib oldi</div>
                <div class="activity-time">15 daqiqa oldin</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <i class="fas fa-user-plus"></i>
              </div>
              <div class="activity-details">
                <div class="activity-title">Yangi foydalanuvchi</div>
                <div class="activity-desc">Sardor ro'yxatdan o'tdi</div>
                <div class="activity-time">1 soat oldin</div>
              </div>
            </div>
          </div>
        </div>

        <div class="content-section">
          <h2>Tezkor amallar</h2>
          <div class="quick-actions">
            <button class="action-btn" onclick="window.dashboard.navigateToPage('add-coin')">
              <i class="fas fa-plus-circle"></i>
              <span>Tanga qo'shish</span>
            </button>
            <button class="action-btn" onclick="window.dashboard.navigateToPage('add-user')">
              <i class="fas fa-user-plus"></i>
              <span>Foydalanuvchi qo'shish</span>
            </button>
            <button class="action-btn" onclick="window.dashboard.navigateToPage('shop')">
              <i class="fas fa-shopping-bag"></i>
              <span>Do'kon</span>
            </button>
            <button class="action-btn" onclick="window.dashboard.navigateToPage('reports')">
              <i class="fas fa-chart-bar"></i>
              <span>Hisobotlar</span>
            </button>
          </div>
        </div>
      </div>
    `;

    pageContent.innerHTML = dashboardContent;
    
    // Load dashboard data
    this.loadDashboardStats();
  }

  loadDashboardStats() {
    // Simulate loading stats from EduCoin data
    if (typeof EduCoin !== 'undefined') {
      const users = EduCoin.getUsers() || [];
      const transactions = EduCoin.getTransactions() || [];
      
      setTimeout(() => {
        const totalCoinsEl = document.getElementById('totalCoins');
        const totalUsersEl = document.getElementById('totalUsers');
        const weeklyGrowthEl = document.getElementById('weeklyGrowth');
        const totalTransactionsEl = document.getElementById('totalTransactions');
        
        if (totalCoinsEl) {
          const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
          totalCoinsEl.textContent = totalCoins.toLocaleString();
        }
        
        if (totalUsersEl) {
          totalUsersEl.textContent = users.length.toLocaleString();
        }
        
        if (weeklyGrowthEl) {
          weeklyGrowthEl.textContent = '+15%';
        }
        
        if (totalTransactionsEl) {
          totalTransactionsEl.textContent = transactions.length.toLocaleString();
        }
      }, 500);
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      this.sidebarCollapsed = sidebar.classList.contains('collapsed');
    }
  }

  toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
      this.mobileMenuOpen = sidebar.classList.contains('mobile-open');
    }
  }

  closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && this.mobileMenuOpen) {
      sidebar.classList.remove('mobile-open');
      this.mobileMenuOpen = false;
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
      }
    }
  }

  handleSearch(query) {
    console.log('Searching for:', query);
    // Implement search functionality
    // This could filter content, show search results, etc.
  }

  showNotifications() {
    console.log('Showing notifications');
    // Implement notifications dropdown/modal
    // This could show recent notifications, alerts, etc.
  }

  logout() {
    if (typeof EduCoin !== 'undefined') {
      EduCoin.logout();
    }
    window.location.href = 'login.html';
  }

  handleResize() {
    // Handle responsive behavior
    if (window.innerWidth > 768) {
      this.closeMobileMenu();
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}
