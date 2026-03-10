// ============================================
// News Minimal PWA - Application Logic
// ============================================

// RSS Feed Sources by Category
const NEWS_SOURCES = {
  politics: [
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/internacional/rss.xml', country: 'international' },
    { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada/politica/rss', country: 'international' },
    { name: 'Página 12', url: 'https://www.pagina12.com.ar/rss/politica.xml', country: 'argentina' },
    { name: 'Clarín', url: 'https://www.clarin.com/rss/politica/', country: 'argentina' }
  ],
  economy: [
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/economia/rss.xml', country: 'international' },
    { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada/economia/rss', country: 'international' },
    { name: 'Página 12', url: 'https://www.pagina12.com.ar/rss/economia.xml', country: 'argentina' },
    { name: 'Clarín', url: 'https://www.clarin.com/rss/economia/', country: 'argentina' }
  ],
  science: [
    { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', country: 'international' },
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/ciencia/rss.xml', country: 'international' },
    { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada/ciencia/rss', country: 'international' }
  ],
  technology: [
    { name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/computers_math.xml', country: 'international' },
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/tecnologia/rss.xml', country: 'international' },
    { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada/tecnologia/rss', country: 'international' }
  ],
  culture: [
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/cultura/rss.xml', country: 'international' },
    { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada/cultura/rss', country: 'international' },
    { name: 'Página 12', url: 'https://www.pagina12.com.ar/rss/cultura.xml', country: 'argentina' }
  ],
  cinema: [
    { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/entretenimiento/rss.xml', country: 'international' },
    { name: 'El País', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada/cultura/cine/rss', country: 'international' },
    { name: 'Clarín', url: 'https://www.clarin.com/rss/espectaculos/cine/', country: 'argentina' }
  ]
};

// State
let currentCategory = 'all';
let allNews = [];
let deferredPrompt = null;

// DOM Elements
const newsGrid = document.getElementById('newsGrid');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const lastUpdate = document.getElementById('lastUpdate');
const offlineIndicator = document.getElementById('offlineIndicator');
const installBtn = document.getElementById('installBtn');
const refreshBtn = document.getElementById('refreshBtn');
const retryBtn = document.getElementById('retryBtn');
const categoryButtons = document.querySelectorAll('.cat-btn');

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  loadNews(currentCategory);
  setupEventListeners();
  updateLastUpdateTime();
});

// ============================================
// PWA Functions
// ============================================
function initPWA() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Error registrando Service Worker:', error);
      });
  }

  // Listen for online/offline status
  window.addEventListener('online', () => updateOnlineStatus(true));
  window.addEventListener('offline', () => updateOnlineStatus(false));
  
  // Check initial status
  updateOnlineStatus(navigator.onLine);

  // Install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  // App installed
  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    deferredPrompt = null;
    console.log('🎉 PWA instalada');
  });
}

function updateOnlineStatus(isOnline) {
  offlineIndicator.hidden = isOnline;
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  // Category buttons
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      loadNews(currentCategory);
    });
  });

  // Install button
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`📥 Usuario ${outcome} la instalación`);
    deferredPrompt = null;
  });

  // Refresh buttons
  refreshBtn.addEventListener('click', () => loadNews(currentCategory));
  retryBtn.addEventListener('click', () => loadNews(currentCategory));

  // Pull to refresh (mobile)
  let touchStartY = 0;
  let touchEndY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    if (touchEndY - touchStartY > 100 && window.scrollY === 0) {
      loadNews(currentCategory);
    }
  }, { passive: true });
}

// ============================================
// News Loading Functions
// ============================================
async function loadNews(category) {
  showLoading();
  
  try {
    if (category === 'all') {
      // Load from all categories
      const allPromises = Object.keys(NEWS_SOURCES).map(cat => 
        fetchCategoryNews(cat)
      );
      const results = await Promise.all(allPromises);
      allNews = results.flat().sort((a, b) => b.pubDate - a.pubDate);
    } else {
      allNews = await fetchCategoryNews(category);
    }

    if (allNews.length === 0) {
      showEmptyState();
    } else {
      renderNews(allNews);
      updateLastUpdateTime();
    }
  } catch (error) {
    console.error('❌ Error cargando noticias:', error);
    showErrorState();
  }
}

async function fetchCategoryNews(category) {
  const sources = NEWS_SOURCES[category];
  const newsItems = [];

  // Use RSS to JSON proxy (rss2json.com - free tier)
  // NOTE: For production, consider self-hosting a proxy or using a paid service
  const proxyUrl = 'https://api.rss2json.com/api.json?rss_url=';

  for (const source of sources) {
    try {
      const response = await fetch(`${proxyUrl}${encodeURIComponent(source.url)}`);
      const data = await response.json();

      if (data.status === 'ok') {
        const items = data.items.slice(0, 5).map(item => ({
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate),
          source: source.name,
          country: source.country,
          category: category,
          image: item.enclosure?.link || item.thumbnail || generatePlaceholderImage(category)
        }));
        newsItems.push(...items);
      }
    } catch (error) {
      console.warn(`⚠️ Error cargando ${source.name}:`, error);
      // Continue with other sources
    }
  }

  return newsItems;
}

function generatePlaceholderImage(category) {
  const colors = {
    politics: 'e94560',
    economy: 'fbbf24',
    science: '4ade80',
    technology: '60a5fa',
    culture: 'a78bfa',
    cinema: 'f472b6'
  };
  const color = colors[category] || '1a1a2e';
  return `https://via.placeholder.com/400x200/${color}/ffffff?text=${encodeURIComponent(category)}`;
}

// ============================================
// Rendering Functions
// ============================================
function renderNews(news) {
  newsGrid.innerHTML = '';

  news.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.style.animationDelay = `${index * 50}ms`;

    const formattedDate = item.pubDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    card.innerHTML = `
      <img 
        src="${item.image}" 
        alt="" 
        class="news-card-image"
        loading="lazy"
        onerror="this.src='${generatePlaceholderImage(item.category)}'"
      >
      <div class="news-card-content">
        <span class="news-card-source">${item.source}</span>
        <h2 class="news-card-title">
          <a href="${item.link}" target="_blank" rel="noopener noreferrer">
            ${item.title}
          </a>
        </h2>
        <div class="news-card-meta">
          <time datetime="${item.pubDate.toISOString()}">${formattedDate}</time>
          <span class="news-card-category">${translateCategory(item.category)}</span>
        </div>
      </div>
    `;

    newsGrid.appendChild(card);
  });
}

function translateCategory(category) {
  const translations = {
    politics: 'Política',
    economy: 'Economía',
    science: 'Ciencia',
    technology: 'Tecnología',
    culture: 'Cultura',
    cinema: 'Cine'
  };
  return translations[category] || category;
}

// ============================================
// UI State Functions
// ============================================
function showLoading() {
  loading.hidden = false;
  newsGrid.hidden = true;
  emptyState.hidden = true;
  errorState.hidden = true;
}

function showEmptyState() {
  loading.hidden = true;
  newsGrid.hidden = true;
  emptyState.hidden = false;
  errorState.hidden = true;
}

function showErrorState() {
  loading.hidden = true;
  newsGrid.hidden = true;
  emptyState.hidden = true;
  errorState.hidden = false;
}

function updateLastUpdateTime() {
  const now = new Date();
  lastUpdate.textContent = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================
// Utility Functions
// ============================================
// Request notification permission (optional)
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

// Background sync registration (if supported)
async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-news');
  }
}