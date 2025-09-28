// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    outDir: "dist",
  },
});
