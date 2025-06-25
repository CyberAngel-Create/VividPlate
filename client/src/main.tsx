import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App-ultra-minimal";
import "./index-minimal.css";
import "./i18n";
import { ErrorBoundary } from "./components/ErrorBoundary";

// PWA installation handling for desktop
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('PWA install prompt ready');
});

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✓ Service Worker registered successfully');

      // Check for updates
      registration.addEventListener('updatefound', () => {
        console.log('✓ Service Worker update detected');
      });

      // Handle controller change (when a new SW takes control)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('✗ Service Worker registration failed:', error);
    }
  });
}

// Make install prompt available globally
(window as any).installPWA = () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
    });
  }
};

const initApp = () => {
  const root = document.getElementById("root");
  if (!root) return;
  
  const reactRoot = createRoot(root);
  reactRoot.render(
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
};



// Ultra-fast initialization
initApp();