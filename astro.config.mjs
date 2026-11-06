// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { repo } from './scripts/repo.mjs';

// GitHub Pages project site: https://<owner>.github.io/<repo>/
const { site, base } = repo();

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [mdx()],
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
});
