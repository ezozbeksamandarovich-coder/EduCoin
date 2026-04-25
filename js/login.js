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
  const capsWarning = document.getElementById('capsWarning');
  const strengthWrap = document.getElementById('passwordStrength');
  const strengthBar = strengthWrap ? strengthWrap.querySelector('.strength-bar span') : null;
  const strengthText = strengthWrap ? strengthWrap.querySelector('small b') : null;

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
      if (creatureBody) {
        creatureBody.style.animationDuration = `${3 - alertness * 1.5}s`;
      }
      
      // Make creatures lean in when password is being typed
      if (value.length > 0) {
        creature.style.transform = `translateX(${index % 2 === 0 ? '10px' : '-10px'}) scale(${1 + alertness * 0.1})`;
      } else {
        creature.style.transform = '';
      }
    });

    const strength = calculatePasswordStrength(value);
    if (strengthBar && strengthText) {
      strengthBar.style.width = `${strength.percent}%`;
      strengthBar.style.backgroundColor = strength.color;
      strengthText.textContent = strength.label;
      strengthText.style.color = strength.color;
    }
  });

  passwordInput.addEventListener('keyup', (e) => {
    if (!capsWarning) return;
    const capsOn = e.getModifierState && e.getModifierState('CapsLock');
    capsWarning.classList.toggle('show', !!capsOn);
  });

  passwordInput.addEventListener('blur', () => {
    if (capsWarning) capsWarning.classList.remove('show');
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

    const user = await EduCoin.login(username, password);

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
        if (creatureBody) {
          creatureBody.style.transform = 'scale(0.8) translateY(10px)';
          creatureBody.style.opacity = '0.5';
        }
        
        // Eyes look down (sad)
        eyes.forEach(eye => {
          eye.style.transform = 'translateY(2px)';
          eye.style.opacity = '0.7';
        });
        
        // Reset after 2 seconds
        setTimeout(() => {
          if (creatureBody) {
            creatureBody.style.transform = '';
            creatureBody.style.opacity = '';
          }
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

});

function calculatePasswordStrength(value) {
  if (!value) {
    return { percent: 0, label: '—', color: '#5A9A5A' };
  }

  let score = 0;
  if (value.length >= 6) score += 20;
  if (value.length >= 10) score += 20;
  if (/[A-Z]/.test(value)) score += 20;
  if (/[0-9]/.test(value)) score += 20;
  if (/[^A-Za-z0-9]/.test(value)) score += 20;

  if (score <= 20) return { percent: 20, label: 'Juda past', color: '#FF5252' };
  if (score <= 40) return { percent: 40, label: 'Past', color: '#FF8A65' };
  if (score <= 60) return { percent: 60, label: 'O‘rtacha', color: '#FFB347' };
  if (score <= 80) return { percent: 80, label: 'Yaxshi', color: '#8BC34A' };
  return { percent: 100, label: 'Kuchli', color: '#00FF88' };
}

