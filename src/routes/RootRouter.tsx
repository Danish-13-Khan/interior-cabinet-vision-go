import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
const App = lazy(() => import("../App"));
import { RequireAuth } from "../marketing/components/RequireAuth";
import { ThemeProvider } from "../marketing/lib/theme";
import { GuestHome } from "../marketing/pages/GuestHome";
import { Login } from "../marketing/pages/Login";
import { Register } from "../marketing/pages/Register";
import { isTauriRuntime } from "../platform/desktopFiles";

/**
 * Web: `/` shows the animated showroom; registration/login opens gated `/app`.
 * After login, App opens Interiors jobs/templates home.
 * Tauri desktop: boot straight into the designer.
 */
export function RootRouter() {
  if (isTauriRuntime()) {
    return <Suspense fallback={<p role="status">Opening Cabinet Planner…</p>}><App /></Suspense>;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<GuestHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Suspense fallback={<p role="status">Opening Cabinet Planner…</p>}><App /></Suspense>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
