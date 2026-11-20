import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// Si le dépôt est renommé "guillaumelathuile.github.io", supprimer la ligne "base".
export default defineConfig({
  site: 'https://guillaumelathuile.github.io',
  base: '/lathuile-website',
  integrations: [sitemap()],
});