import { defineConfig } from "vite";

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/,
// so every built asset URL needs that repo-name prefix. Vite only applies
// `base` in production builds — `npm run dev` still runs at "/" locally.
export default defineConfig({
  base: "/interactive-brain-atlas/",
});
