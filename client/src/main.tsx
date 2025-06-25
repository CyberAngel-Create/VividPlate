import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";

// PWA installation event handling
console.log('Setting up PWA installation listeners');

// Enhanced beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✓ PWA install prompt detected - install icon should appear in address bar');
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-installable', { detail: { prompt: e } }));
});

// App installation success
window.addEventListener('appinstalled', (e) => {
  console.log('✓ VividPlate installed successfully');
  (window as any).deferredPrompt = null;
});

// Check if already installed
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
if (isStandalone) {
  console.log('✓ PWA already installed and running in standalone mode');
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
    <App />
  </ThemeProvider>
);
