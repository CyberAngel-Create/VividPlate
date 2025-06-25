import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";

// Enhanced PWA install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

// Listen for successful app installation
window.addEventListener('appinstalled', (e) => {
  console.log('VividPlate PWA was installed successfully');
  deferredPrompt = null;
  (window as any).deferredPrompt = null;
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
    <App />
  </ThemeProvider>
);
