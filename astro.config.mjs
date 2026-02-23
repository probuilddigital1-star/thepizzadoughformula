// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://thepizzadoughformula.com',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Customize priority for specific pages
      serialize(item) {
        if (item.url === 'https://thepizzadoughformula.com/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        if (item.url.includes('/pizza-styles') || item.url.includes('/bakers-percentages') || item.url.includes('/faqs')) {
          item.priority = 0.9;
        }
        return item;
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'static',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});
