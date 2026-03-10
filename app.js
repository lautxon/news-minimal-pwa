/**
 * app.js - News Minimal PWA
 * Lógica principal: filtrado, renderizado, estado offline
 * 
 * NOTA PARA INTEGRACIÓN REAL:
 * - Reemplazar `fetchMockNews()` por llamadas a tu Cloudflare Worker
 * - Worker URL: https://news-minimal-pwa.el-laucha-web.workers.dev/api/news
 * - El Worker debería agregar RSS de BBC, El País, etc. y devolver JSON estandarizado
 */

// ===== ESTADO DE LA APP =====
const state = {
  category: 'all',
  source: 'all',
  articles: [],
  loading: false,
  offline: !navigator.onLine
};

// ===== SELECTORES DOM =====
const DOM = {
  container: document.getElementById('news-container'),
  loading: document.getElementById('loading-msg'),
  sourceSelect: document.getElementById('source-select'),
  installBtn: document.getElementById('install-btn'),
  offlineStatus: document.getElementById('offline-status'),
  tabs: document.querySelectorAll('[role="tab"]')
};

// ===== MOCK DATA (para desarrollo sin API real) =====
// Estructura esperada de cada artículo:
// { id, title, excerpt, url, source, category, publishedAt, image? }

const mockArticles = [
  {
    id: '1',
    title: 'Avances en energía renovable marcan un hito global',
    excerpt: 'Nuevos paneles solares orgánicos prometen reducir costos en un 40%...',
    url: '#',
    source: 'sciencedaily',
    category: 'ciencia',
    publishedAt: '2026-03-09T10:30:00Z',
    image: null
  },
  {
    id: '2',
    title: 'Debate presupuestario: claves de la discusión en el Congreso',
    excerpt: 'Los bloques parlamentarios presentan sus propuestas ante la reforma...',
    url: '#',
    source: 'pagina12',
    category: 'politica',
    publishedAt: '2026-03-09T09:15:00Z'
  },
  {
    id: '3',
    title: 'IA generativa: ¿herramienta creativa o riesgo laboral?',
    excerpt: 'Expertos debaten el impacto de los modelos de lenguaje en industrias culturales...',
    url: '#',
    source: 'wired',
    category: 'tecnologia',
    publishedAt: '2026-03-08T18:45:00Z'
  },
  {
    id: '4',
    title: 'Estreno destacado: nueva película argentina en festivales internacionales',
    excerpt: 'El filme explora memoria histórica con un lenguaje visual innovador...',
    url: '#',
    source: 'clarin',
    category: 'cine',
    publishedAt: '2026-03-08T14:20:00Z'
  },
  {
    id: '5',
    title: 'Mercados: volatilidad por decisiones de bancos centrales',
    excerpt: 'Analistas recomiendan cautela ante el escenario macroeconómico global...',
    url: '#',
    source: 'elpais',
    category: 'economia',
    publishedAt: '2026-03-08T11:00:00Z'
  },
  {
    id: '6',
    title: 'Festival de cine independiente anuncia su programación 2026',
    excerpt: 'Más de 200 películas de 40 países competirán en la próxima edición...',
    url: '#',
    source: 'bbc',
    category: 'cultura',
    publishedAt: '2026-03-07T16:30:00Z'
  }
];

// ===== FUNCIONES PRINCIPALES =====

// Simular fetch a API (reemplazar con llamada real al Worker)
async function fetchNews({ category = 'all', source = 'all' } = {}) {
  state.loading = true;
  renderLoading();
  
  try {
    // 🔁 PARA PRODUCCIÓN: reemplazar con:
    // const response = await fetch('https://news-minimal-pwa.el-laucha-web.workers.dev/api/news', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ category, source })
    // });
    // const data = await response.json();
    
    // Simulamos delay de red
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Filtramos mock data
    let filtered = [...mockArticles];
    if (category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }
    if (source !== 'all') {
      filtered = filtered.filter(a => a.source === source);
    }
    
    state.articles = filtered;
    state.loading = false;
    renderArticles();
    
  } catch (error) {
    console.error('Error fetching news:', error);
    state.loading = false;
    renderError('No se pudieron cargar las noticias. Verificá tu conexión.');
  }
}

// Renderizar estado de carga
function renderLoading() {
  DOM.container.innerHTML = '<p class="loading" aria-busy="true">Cargando noticias…</p>';
}

// Renderizar error
function renderError(message) {
  DOM.container.innerHTML = `<p class="empty-state" role="alert">⚠️ ${message}</p>`;
}

// Renderizar lista de artículos
function renderArticles() {
  if (state.articles.length === 0) {
    DOM.container.innerHTML = '<p class="empty-state">No hay noticias para los filtros seleccionados.</p>';
    return;
  }
  
  DOM.container.innerHTML = state.articles.map(article => `
    <article class="news-card" itemscope itemtype="https://schema.org/NewsArticle">
      <p class="news-card__source">${formatSource(article.source)}</p>
      <h2 class="news-card__title">
        <a href="${article.url}" 
   target="_blank" 
   rel="noopener noreferrer external"
   onclick="event.stopPropagation()"
   data-external="true">
          <span itemprop="headline">${escapeHtml(article.title)}</span>
        </a>
      </h2>
      <p class="news-card__excerpt" itemprop="description">${escapeHtml(article.excerpt)}</p>
      <div class="news-card__meta">
        <time datetime="${article.publishedAt}" itemprop="datePublished">
          ${formatDate(article.publishedAt)}
        </time>
        <span class="news-card__category">${formatCategory(article.category)}</span>
      </div>
    </article>
  `).join('');
}

// ===== UTILIDADES =====

function formatSource(key) {
  const sources = {
    bbc: 'BBC Mundo',
    elpais: 'El País',
    sciencedaily: 'Science Daily',
    pagina12: 'Página/12',
    clarin: 'Clarín',
    nytimes: 'The New York Times',
    wired: 'Wired'
  };
  return sources[key] || key;
}

function formatCategory(key) {
  const cats = {
    politica: 'Política',
    economia: 'Economía',
    ciencia: 'Ciencia',
    tecnologia: 'Tecnología',
    cultura: 'Cultura',
    cine: 'Cine'
  };
  return cats[key] || key;
}

function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== EVENT LISTENERS =====

// Cambio de categoría (tabs)
DOM.tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    // Actualizar aria-selected
    DOM.tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
    e.currentTarget.setAttribute('aria-selected', 'true');
    
    // Actualizar estado y fetch
    state.category = e.currentTarget.dataset.category;
    fetchNews({ category: state.category, source: state.source });
  });
  
  // Accesibilidad: navegación por teclado
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tab.click();
    }
  });
});

// Cambio de fuente
DOM.sourceSelect.addEventListener('change', (e) => {
  state.source = e.target.value;
  fetchNews({ category: state.category, source: state.source });
});

// Estado de conexión
window.addEventListener('online', () => {
  state.offline = false;
  DOM.offlineStatus.textContent = '🟢 Conectado';
  DOM.offlineStatus.style.color = '#00d1b2';
  fetchNews({ category: state.category, source: state.source });
});
window.addEventListener('offline', () => {
  state.offline = true;
  DOM.offlineStatus.textContent = '🔴 Offline';
  DOM.offlineStatus.style.color = '#ff6b6b';
  renderArticles(); // Mostrar lo que haya en caché
});

// Instalación de PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  DOM.installBtn.hidden = false;
});

DOM.installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Instalación: ${outcome}`);
    deferredPrompt = null;
    DOM.installBtn.hidden = true;
  }
});

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  // Cargar noticias iniciales
  fetchNews();
  
  // Anunciar estado inicial de conexión
  DOM.offlineStatus.textContent = state.offline ? '🔴 Offline' : '🟢 Conectado';
  DOM.offlineStatus.style.color = state.offline ? '#ff6b6b' : '#00d1b2';
});
