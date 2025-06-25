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

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker registered'))
      .catch(() => console.log('Service Worker registration failed'));
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

const root = document.getElementById("root");
if (root) {
  // Clear loading content
  root.innerHTML = '';
  
  createRoot(root).render(
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
} else {
  console.error('Failed to find root element for VividPlate');
}
