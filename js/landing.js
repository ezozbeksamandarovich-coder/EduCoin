function formatDownloadSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) {
    return '';
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
}

function formatDownloadDate(value) {
  if (!value) {
    return '';
  }
  try {
    return new Date(value).toLocaleString('uz-Latn-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function applyDownloadState(id, item) {
  const statusEl = document.getElementById(`${id}Status`);
  const metaEl = document.getElementById(`${id}Meta`);
  const buttonEl = document.getElementById(id === 'windows' ? 'downloadExeBtn' : 'downloadApkBtn');

  if (!statusEl || !metaEl || !buttonEl) {
    return;
  }

  if (item?.exists) {
    statusEl.textContent = 'Tayyor';
    statusEl.classList.remove('unavailable');
    metaEl.textContent = [formatDownloadSize(item.size), formatDownloadDate(item.updatedAt)].filter(Boolean).join(' • ');
    buttonEl.classList.remove('is-disabled');
    buttonEl.removeAttribute('aria-disabled');
    buttonEl.setAttribute('href', item.href);
    buttonEl.setAttribute('download', '');
    buttonEl.textContent = id === 'windows' ? 'EXE yuklab olish' : 'APK yuklab olish';
    return;
  }

  statusEl.textContent = 'Hali build qilinmagan';
  statusEl.classList.add('unavailable');
  metaEl.textContent = 'Repo ichida fayl yo‘q. `DOWNLOADS.md` dagi script bilan chiqariladi.';
  buttonEl.classList.add('is-disabled');
  buttonEl.setAttribute('aria-disabled', 'true');
  buttonEl.removeAttribute('href');
  buttonEl.removeAttribute('download');
  buttonEl.textContent = id === 'windows' ? 'EXE hali tayyor emas' : 'APK hali tayyor emas';
}

document.addEventListener('DOMContentLoaded', async () => {
  const noteEl = document.getElementById('downloadStatusNote');

  try {
    const response = await fetch('/api/downloads/status', { method: 'GET' });
    if (!response.ok) {
      throw new Error('Status request failed');
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));

    applyDownloadState('windows', byId.windows);
    applyDownloadState('android', byId.android);

    const missingCount = items.filter((item) => !item.exists).length;
    if (noteEl) {
      noteEl.textContent = missingCount
        ? "Ba'zi build fayllari hali tayyor emas. `DOWNLOADS.md` dagi script bilan `.exe` va `.apk` ni generatsiya qiling."
        : "Windows va Android build fayllari tayyor. Shu bo‘limdan to‘g‘ridan-to‘g‘ri yuklab olishingiz mumkin.";
    }
  } catch {
    applyDownloadState('windows', null);
    applyDownloadState('android', null);
    if (noteEl) {
      noteEl.textContent = "Download holatini tekshirib bo‘lmadi. Serverni ishga tushiring yoki `DOWNLOADS.md` dagi scriptdan foydalaning.";
    }
  }
});
