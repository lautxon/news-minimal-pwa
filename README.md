# News Minimal PWA 🗞️

Lector minimalista de noticias con soporte offline, diseñado para GitHub Pages + Cloudflare Workers.

## 🚀 Despliegue en GitHub Pages

1. Crear repositorio `news-minimal-pwa` en tu cuenta GitHub
2. Subir todos los archivos de este proyecto
3. Ir a **Settings > Pages**
4. En **Source**, seleccionar branch `main` y carpeta `/ (root)`
5. Guardar. Tu app estará en: `https://lautxon.github.io/news-minimal-pwa/`

> ⚠️ **Importante**: El `scope` del manifest y las rutas en `index.html` usan `/news-minimal-pwa/` como base. Si cambiás el nombre del repo, actualizá esas rutas.

## 🔧 Integración con Cloudflare Worker

El archivo `app.js` incluye comentarios para reemplazar `fetchMockNews()` por llamadas reales a tu Worker:

```javascript
// En app.js, reemplazar el bloque try de fetchNews():
const response = await fetch('https://news-minimal-pwa.el-laucha-web.workers.dev/api/news', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ category: state.category, source: state.source })
});
const data = await response.json();
state.articles = data.articles; // Espera { articles: [...] }
