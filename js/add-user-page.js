let addUserPageCurrentUser = null;

const CREATE_ROLE_MATRIX = {
  manager: ['student', 'teacher'],
  director: ['student', 'teacher', 'manager'],
  admin: ['student', 'teacher', 'manager', 'director', 'admin'],
};

function getCreatableRoles(actorRole) {
  return CREATE_ROLE_MATRIX[actorRole] || ['student'];
}

function fillRoleOptions() {
  const roleSelect = document.getElementById('role');
  if (!roleSelect || !addUserPageCurrentUser) {
    return;
  }

  const roles = getCreatableRoles(addUserPageCurrentUser.role);
  roleSelect.innerHTML = roles
    .map((role) => `<option value="${role}">${EduCoin.roleLabel(role)}</option>`)
    .join('');
}

function fillGroupOptions() {
  const groupSelect = document.getElementById('groupId');
  if (!groupSelect) {
    return;
  }

  const groups = EduCoin.getGroups();
  groupSelect.innerHTML = ['<option value="">Guruh tanlang</option>']
    .concat(groups.map((group) => `<option value="${group.id}">${group.name}</option>`))
    .join('');
}

function toggleGroupField() {
  const role = document.getElementById('role')?.value;
  const groupField = document.getElementById('groupField');
  if (!groupField) {
    return;
  }
  groupField.style.display = role === 'student' ? 'block' : 'none';
}

function renderAddUserSummary() {
  const users = EduCoin.getUsers();
  const creatableRoles = getCreatableRoles(addUserPageCurrentUser?.role || '');
  const today = new Date().toISOString().slice(0, 10);

  const summary = {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.active).length,
    todayUsers: users.filter((user) => String(user.createdAt || '').slice(0, 10) === today).length,
    creatableRoles: creatableRoles.length,
  };

  Object.entries(summary).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = String(value);
    }
  });
}

function renderRecentUsers() {
  const host = document.getElementById('recentUsers');
  if (!host) {
    return;
  }

  const users = EduCoin.getUsers().slice(-8).reverse();
  if (!users.length) {
    host.innerHTML = '<div class="empty-state"><div class="icon">?</div><p>Hali foydalanuvchilar yo\'q.</p></div>';
    return;
  }

  host.innerHTML = users
    .map(
      (user) => `
        <div class="user-card" style="margin-bottom:12px;">
          <div class="user-card-avatar">${getInitials(user.name)}</div>
          <div class="user-card-info">
            <div class="user-card-name">${user.name}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
              <span class="badge role-badge" data-role="${user.role}">${EduCoin.roleLabel(user.role)}</span>
              <span style="font-size:12px;color:var(--text3);">${user.username}</span>
            </div>
          </div>
          <div class="user-card-coins">${(user.coins || 0).toLocaleString()} coin</div>
        </div>
      `
    )
    .join('');
}

function showAddUserAlert(type, message) {
  const host = document.getElementById('formAlert');
  if (!host) {
    return;
  }
  host.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAddUserAlert() {
  const host = document.getElementById('formAlert');
  if (host) {
    host.innerHTML = '';
  }
}

function resetAddUserForm() {
  const form = document.getElementById('addUserForm');
  if (form) {
    form.reset();
  }
  fillRoleOptions();
  fillGroupOptions();
  toggleGroupField();
}

function attachStudentToGroup(studentId, groupId) {
  if (!studentId || !groupId) {
    return;
  }

  const groups = EduCoin.getGroups();
  const groupIndex = groups.findIndex((group) => group.id === groupId);
  if (groupIndex === -1) {
    return;
  }

  groups[groupIndex].studentIds = Array.from(new Set([...(groups[groupIndex].studentIds || []), studentId]));
  EduCoin.setData('groups', groups);
}

function updateCredentialsPreview(user, password) {
  const host = document.getElementById('lastCreatedUser');
  if (!host || !user) {
    return;
  }

  host.innerHTML = `
    <div class="alert alert-success">
      <strong>Yangi login tayyor:</strong><br>
      Ism: ${user.name}<br>
      Username: ${user.username}<br>
      Parol: ${password}<br>
      Rol: ${EduCoin.roleLabel(user.role)}
    </div>
  `;
}

function submitAddUser(event) {
  event.preventDefault();
  clearAddUserAlert();

  const name = document.getElementById('fullName')?.value.trim() || '';
  const username = document.getElementById('username')?.value.trim() || '';
  const password = document.getElementById('password')?.value || '';
  const email = document.getElementById('email')?.value.trim() || '';
  const role = document.getElementById('role')?.value || 'student';
  const groupId = document.getElementById('groupId')?.value || '';
  const initialCoins = Number(document.getElementById('initialCoins')?.value || 0);

  if (name.length < 3) {
    showAddUserAlert('danger', 'Ism kamida 3 ta belgidan iborat bo\'lishi kerak.');
    return;
  }

  if (username.length < 3) {
    showAddUserAlert('danger', 'Username kamida 3 ta belgidan iborat bo\'lishi kerak.');
    return;
  }

  if (password.length < 6) {
    showAddUserAlert('danger', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.');
    return;
  }

  if (EduCoin.isUsernameTaken(username)) {
    showAddUserAlert('danger', 'Bu username band. Boshqasini kiriting.');
    return;
  }

  if (role === 'student' && !groupId) {
    showAddUserAlert('warning', 'O\'quvchi uchun guruh tanlang.');
    return;
  }

  const user = EduCoin.addUser({
    name,
    fullName: name,
    username,
    password,
    email,
    role,
    groupId: role === 'student' ? groupId : '',
  });

  if (!user) {
    showAddUserAlert('danger', 'Foydalanuvchini saqlab bo\'lmadi. Username yoki ma\'lumotlarni tekshiring.');
    return;
  }

  if (role === 'student' && groupId) {
    attachStudentToGroup(user.id, groupId);
  }

  if (Number.isFinite(initialCoins) && initialCoins > 0) {
    EduCoin.awardCoins(addUserPageCurrentUser.id, user.id, initialCoins, 'Boshlang\'ich coin');
  }

  renderAddUserSummary();
  renderRecentUsers();
  updateCredentialsPreview(user, password);
  resetAddUserForm();
  showAddUserAlert('success', `${user.name} muvaffaqiyatli qo\'shildi.`);
  if (typeof showToast === 'function') {
    showToast(`${user.name} tizimga qo'shildi`, 'success');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await EduCoin.init();
  addUserPageCurrentUser = EduCoin.requireAuth(['manager', 'director', 'admin']);
  if (!addUserPageCurrentUser) {
    return;
  }

  const sidebar = document.getElementById('sidebar-container');
  if (sidebar) {
    sidebar.innerHTML = buildSidebar(addUserPageCurrentUser.role, addUserPageCurrentUser);
  }

  const topCoinDisplay = document.getElementById('topCoinDisplay');
  if (topCoinDisplay) {
    topCoinDisplay.textContent = EduCoin.formatCoins(addUserPageCurrentUser.coins || 0);
  }

  const pageTitle = document.getElementById('pageTitle');
  const pageDescription = document.getElementById('pageDescription');
  const actorBadge = document.getElementById('actorBadge');

  if (pageTitle) {
    pageTitle.textContent = `${EduCoin.roleLabel(addUserPageCurrentUser.role)} panelidan foydalanuvchi qo'shish`;
  }
  if (pageDescription) {
    pageDescription.textContent = 'Username, parol va rol bir joyda boshqariladi. Yaratilgan user darhol login qila oladi.';
  }
  if (actorBadge) {
    actorBadge.textContent = `${EduCoin.roleLabel(addUserPageCurrentUser.role)} rejimi`;
    actorBadge.dataset.role = addUserPageCurrentUser.role;
  }

  fillRoleOptions();
  fillGroupOptions();
  toggleGroupField();
  renderAddUserSummary();
  renderRecentUsers();

  document.getElementById('role')?.addEventListener('change', toggleGroupField);
  document.getElementById('addUserForm')?.addEventListener('submit', submitAddUser);
});
