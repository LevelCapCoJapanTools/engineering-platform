import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "./lib/router";
import { screens } from "./screens/registry";
import { StateSwitcher, ThemeProvider, ToastProvider } from "./ui";
import "./design/tokens.css";
import "./design/ui.css";
import "./styles.css";

function NotFoundFallback() {
  const z01 = screens.find((s) => s.id === "Z-01");
  return z01 ? <>{z01.render({})}</> : <p style={{ padding: 24 }}>画面が見つかりません</p>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <Router screens={screens} fallback={<NotFoundFallback />}>
          <StateSwitcher />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
