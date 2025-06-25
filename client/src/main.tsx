import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";
// PWA debug utilities (disabled to prevent crashes)
// import "./utils/pwa-debug";

// Simple service worker registration for Chrome compatibility
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
    <App />
  </ThemeProvider>
);
