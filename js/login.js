// ==========================================
// EduCoin - Login Logic
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  await EduCoin.init();

  // Load language settings
  const langSettings = EduCoin.getData('langSettings') || {};
  const currentLang = langSettings.language || 'uz';
  
  // Apply translations
  applyTranslations(currentLang);

  // Check for auto-login first, then check if already logged in
  const autoLoginResult = EduCoin.autoLogin();
  if (autoLoginResult) {
    console.log('Auto-login successful');
    window.location.href = EduCoin.getRoleHome(autoLoginResult.role);
    return;
  }

  // If already logged in, redirect
  const user = EduCoin.getCurrentUser();
  if (user) {
    window.location.href = EduCoin.getRoleHome(user.role);
    return;
  }

  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('errorMsg');
  const loginBtn = document.getElementById('loginBtn');
  const pwdInput = document.getElementById('password');
  const eyeBtn = document.getElementById('eyeBtn');
  const rememberedUsername = EduCoin.getRememberedUsername ? EduCoin.getRememberedUsername() : '';
  const rememberCheckbox = document.getElementById('rememberMe');

  if (rememberCheckbox) {
    rememberCheckbox.checked = localStorage.getItem('educoin_remember_me') === 'true';
  }

  if (rememberedUsername) {
    document.getElementById('username').value = rememberedUsername;
  }

  // Password visibility toggle with animation
  eyeBtn.addEventListener('click', () => {
    const isText = pwdInput.type === 'text';
    
    // Add watching animation
    eyeBtn.classList.add('watching');
    
    // Toggle password visibility
    pwdInput.type = isText ? 'password' : 'text';
    
    // Change icon based on state
    if (isText) {
      // Show password - eyes looking forward
      eyeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    } else {
      // Hide password - eyes looking backward (crossed out)
      eyeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    }
    
    // Remove animation class after animation completes
    setTimeout(() => {
      eyeBtn.classList.remove('watching');
    }, 500);
    
    // Make creatures react to password visibility change
    const creatures = document.querySelectorAll('.creature');
    creatures.forEach((creature, index) => {
      setTimeout(() => {
        creature.style.animation = 'none';
        setTimeout(() => {
          creature.style.animation = '';
        }, 50);
      }, index * 100);
    });
  });

  // Enhanced input interactions with creature reactions
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  // Username input reactions
  usernameInput.addEventListener('input', (e) => {
    const value = e.target.value;
    const creatures = document.querySelectorAll('.creature');
    
    // Creatures get excited when typing
    creatures.forEach((creature, index) => {
      const eyes = creature.querySelectorAll('.eye::before');
      const intensity = Math.min(value.length / 10, 1);
      
      // Make eyes move faster and more erratically when typing
      creature.style.setProperty('--pupil-speed', `${0.5 + intensity * 1.5}s`);
      
      // Occasional blink when typing
      if (Math.random() < 0.1) {
        const creatureEyes = creature.querySelectorAll('.eye');
        creatureEyes.forEach(eye => {
          eye.style.animation = 'none';
          setTimeout(() => {
            eye.style.animation = '';
          }, 100);
        });
      }
    });
  });
  
  // Password input reactions
  passwordInput.addEventListener('input', (e) => {
    const value = e.target.value;
    const creatures = document.querySelectorAll('.creature');
    
    // Creatures become more alert when password is being typed
    creatures.forEach((creature, index) => {
      const alertness = Math.min(value.length / 8, 1);
      
      // Increase pulse rate with password length
      const creatureBody = creature.querySelector('.creature-body');
      creatureBody.style.animationDuration = `${3 - alertness * 1.5}s`;
      
      // Make creatures lean in when password is being typed
      if (value.length > 0) {
        creature.style.transform = `translateX(${index % 2 === 0 ? '10px' : '-10px'}) scale(${1 + alertness * 0.1})`;
      } else {
        creature.style.transform = '';
      }
    });
  });
  
  // Focus effects
  usernameInput.addEventListener('focus', () => {
    document.querySelectorAll('.creature').forEach((creature, index) => {
      setTimeout(() => {
        creature.style.filter = 'brightness(1.2)';
      }, index * 50);
    });
  });
  
  usernameInput.addEventListener('blur', () => {
    document.querySelectorAll('.creature').forEach(creature => {
      creature.style.filter = '';
    });
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError(t('login.errorEmpty', currentLang));
      return;
    }

    // Additional validation
    if (username.length < 3) {
      showError('Username kamida 3 ta belgidan iborat bo\'lishi kerak!');
      return;
    }
    
    if (password.length < 6) {
      showError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak!');
      return;
    }

    loginBtn.classList.add('loading');
    loginBtn.innerHTML = `
      <span class="spinner-sm"></span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
        <polyline points="10 17 15 12 10 7"></polyline>
        <line x1="15" y1="12" x2="3" y2="12"></line>
      </svg>
      ${t('login.checking', currentLang)}
    `;

    // Simulate small delay for UX
    await new Promise(r => setTimeout(r, 600));

    const user = EduCoin.login(username, password);

    if (user) {
      loginBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        ${t('login.success', currentLang)}
      `;
      
      // Success celebration - creatures dance!
      const creatures = document.querySelectorAll('.creature');
      creatures.forEach((creature, index) => {
        creature.style.animation = 'none';
        setTimeout(() => {
          creature.style.animation = `creatureDance 1s ease-in-out ${index * 0.1}s`;
        }, 50);
      });
      
      await new Promise(r => setTimeout(r, 500));
      window.location.href = EduCoin.getRoleHome(user.role);
    } else {
      loginBtn.classList.remove('loading');
      loginBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        ${t('login.loginButton', currentLang)}
      `;
      showError(t('login.errorInvalid', currentLang));
      
      // Error reaction - creatures look sad/disappointed
      const creatures = document.querySelectorAll('.creature');
      creatures.forEach((creature, index) => {
        const creatureBody = creature.querySelector('.creature-body');
        const eyes = creature.querySelectorAll('.eye');
        
        // Make creatures droop
        creatureBody.style.transform = 'scale(0.8) translateY(10px)';
        creatureBody.style.opacity = '0.5';
        
        // Eyes look down (sad)
        eyes.forEach(eye => {
          eye.style.transform = 'translateY(2px)';
          eye.style.opacity = '0.7';
        });
        
        // Reset after 2 seconds
        setTimeout(() => {
          creatureBody.style.transform = '';
          creatureBody.style.opacity = '';
          eyes.forEach(eye => {
            eye.style.transform = '';
            eye.style.opacity = '';
          });
        }, 2000);
      });
    }
  });

  function showError(msg) {
    const span = errorEl.querySelector('span');
    if (span) {
      span.textContent = msg;
    } else {
      errorEl.textContent = msg;
    }
    errorEl.style.display = 'flex';
    errorEl.classList.add('show');
    setTimeout(() => {
      errorEl.classList.remove('show');
      errorEl.style.display = 'none';
    }, 3000);
  }

  // Password file upload functionality
  document.getElementById('passwordFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (Array.isArray(data)) {
          // Update users with new passwords
          const users = EduCoin.getUsers();
          let updatedCount = 0;
          
          data.forEach(userUpdate => {
            const userIndex = users.findIndex(u => u.username === userUpdate.username);
            if (userIndex !== -1) {
              users[userIndex].password = userUpdate.password;
              updatedCount++;
            }
          });
          
          if (updatedCount > 0) {
            EduCoin.setData('users', users);
            document.getElementById('uploadStatus').innerHTML = `<div class="alert alert-success">✅ ${updatedCount} ta foydalanuvchi paroli muvaffaqiyatli yangilandi!</div>`;
            showToast(`${updatedCount} ta parol yangilandi!`, 'success');
          } else {
            document.getElementById('uploadStatus').innerHTML = `<div class="alert alert-warning">⚠️ Hech qanday foydalanuvchi topilmadi!</div>`;
          }
        } else {
          document.getElementById('uploadStatus').innerHTML = `<div class="alert alert-danger">⚠️ Noto'g'ri JSON format!</div>`;
        }
      } catch (error) {
        document.getElementById('uploadStatus').innerHTML = `<div class="alert alert-danger">⚠️ Faylni o'qib bo'lishda xatolik yuz berdi!</div>`;
      }
    };
    
    reader.readAsText(file);
  });
});

// Demo account quick-fill
function fillDemo(username, password) {
  document.getElementById('username').value = username;
  document.getElementById('password').value = password;
  const form = document.getElementById('loginForm');
  if (form.requestSubmit) {
    form.requestSubmit();
  } else {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
}
