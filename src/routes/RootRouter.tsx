import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "../App";
import { RequireAuth } from "../marketing/components/RequireAuth";
import { ThemeProvider } from "../marketing/lib/theme";
import { Landing } from "../marketing/pages/Landing";
import { Login } from "../marketing/pages/Login";
import { Register } from "../marketing/pages/Register";
import { isTauriRuntime } from "../platform/desktopFiles";

/**
 * Web: marketing at /, auth at /login|/register, real designer at /app (gated).
 * Tauri desktop: boot straight into the designer (skip marketing/auth).
 */
export function RootRouter() {
  if (isTauriRuntime()) {
    return <App />;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <App />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
