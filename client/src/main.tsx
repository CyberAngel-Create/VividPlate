import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
        });
      })
      .catch((registrationError) => {
        console.error('❌ Service Worker registration failed:', registrationError);
      });
  });
}

// Listen for beforeinstallprompt event early
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🚀 beforeinstallprompt event fired');
  e.preventDefault();
  deferredPrompt = e;
  // Trigger a custom event to notify our hook
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
    <App />
  </ThemeProvider>
);
