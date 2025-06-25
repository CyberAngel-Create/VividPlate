import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";

// Listen for beforeinstallprompt event early
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired');
  e.preventDefault();
  deferredPrompt = e;
  // Store globally for access
  (window as any).deferredPrompt = e;
  // Trigger a custom event to notify our hook
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
    <App />
  </ThemeProvider>
);
