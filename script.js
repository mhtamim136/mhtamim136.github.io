// ===== Theme Toggle =====
const themeBtn = document.getElementById('themeBtn');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeBtn.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  themeBtn.innerHTML = theme === 'dark'
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ===== Share Button =====
const shareBtn = document.getElementById('shareBtn');

shareBtn.addEventListener('click', async () => {
  const shareData = {
    title: 'Mhtamim - Profile',
    text: 'Check out my profile!',
    url: 'https://mhtamim136.github.io/'
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // user cancelled
    }
  } else {
    // Fallback: copy link to clipboard
    navigator.clipboard.writeText(shareData.url).then(() => {
      alert('Link copied to clipboard!');
    });
  }
});