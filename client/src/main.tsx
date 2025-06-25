import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";
// Import PWA debug utilities (temporarily disabled)
// import "./utils/pwa-debug";

// PWA installation event handling
console.log('Setting up PWA installation listeners');

// Enhanced beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎉 BROWSER PWA INSTALL PROMPT DETECTED!');
  console.log('📍 Install icon (⊞) should now be visible in Chrome address bar');
  console.log('📍 Click it to install VividPlate as a desktop app');
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

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✓ Service Worker registered successfully');
      console.log('✓ PWA requirements met - install icon should appear in address bar');
      
      // Force update if needed
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      registration.addEventListener('updatefound', () => {
        console.log('✓ Service Worker update detected');
      });
    } catch (error) {
      console.error('✗ Service Worker registration failed:', error);
    }
  });
} else {
  console.warn('✗ Service Worker not supported in this browser');
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
    <App />
  </ThemeProvider>
);
