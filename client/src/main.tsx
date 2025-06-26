import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import TestComponent from "./TestComponent";
import "./index.css";
// Import i18n configuration
import "./i18n";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
    <TestComponent />
  </ThemeProvider>
);
