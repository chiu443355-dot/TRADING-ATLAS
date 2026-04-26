import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://wikwiz.vercel.app',
  integrations: [react(), tailwind(), mdx()],
  output: 'static'
});
