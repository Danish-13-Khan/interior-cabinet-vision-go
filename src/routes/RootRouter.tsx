import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
const App = lazy(() => import("../App"));
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
    return <Suspense fallback={<p role="status">Opening Cabinet Studio…</p>}><App /></Suspense>;
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
                <Suspense fallback={<p role="status">Opening Cabinet Studio…</p>}><App /></Suspense>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
