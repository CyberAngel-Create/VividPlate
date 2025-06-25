import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
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

// Enhanced browser compatibility and initialization
const initApp = () => {
  console.log('Initializing VividPlate...');

  try {
    const root = document.getElementById("root");
    if (!root) {
      throw new Error('Root element not found');
    }

    // Create React app and render immediately
    const reactRoot = createRoot(root);
    
    // Hide loader first for immediate feedback
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.display = 'none';
    }
    
    // Render app
    reactRoot.render(
      <ErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
          <App />
        </ThemeProvider>
      </ErrorBoundary>
    );
    
    console.log('VividPlate loaded');

  } catch (error) {
    console.error('VividPlate initialization error:', error);
    showFallbackUI();
  }
};

const showFallbackUI = () => {
  const fallbackHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; background: #ffffff;">
      <div style="max-width: 400px; padding: 32px;">
        <h1 style="color: #f59e0b; margin: 0 0 16px 0; font-size: 28px; font-weight: bold;">VividPlate</h1>
        <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px;">Unable to load the application</p>
        <button onclick="window.location.reload()" style="background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          Reload Application
        </button>
        <p style="color: #9ca3af; margin: 24px 0 0 0; font-size: 12px;">If the problem persists, please clear your browser cache</p>
      </div>
    </div>
  `;

  document.body.innerHTML = fallbackHTML;
};

// Immediate initialization for faster loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}