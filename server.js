const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Schakel caching uit
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Middleware om statische bestanden te serveren vanuit de public map
app.use(express.static(path.join(__dirname, 'public')));

// **Zoekopdrachten via Ecosia**
app.get('/search', (req, res) => {
  const query = req.query.q;
  if (query) {
    res.redirect(`https://www.ecosia.org/search?q=${encodeURIComponent(query)}`);
  } else {
    res.status(400).send('Bad Request: No search query provided');
  }
});

// **Proxy voor ALLE URL's**
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Bad Request: No URL provided');
  }

  try {
    // Valideer en parse de URL
    const parsedUrl = new URL(targetUrl);

    // Voer de proxy correct uit
    createProxyMiddleware({
      target: parsedUrl.origin, // Gebruik de volledige host
      changeOrigin: true,
      pathRewrite: { '^/proxy': '' }, // Zorgt ervoor dat het pad niet wordt aangepast
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(500).send('Proxy error: ' + err.message);
      }
    })(req, res, next);
  } catch (err) {
    console.error('Invalid URL:', err.message);
    res.status(400).send('Bad Request: Invalid URL');
  }
});

// Route om de hoofdpagina te serveren
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Aangepaste foutpagina
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// Start de server
app.listen(process.env.PORT || 3000, () => {
  console.log('Proxy server is running on port 3000');
});
