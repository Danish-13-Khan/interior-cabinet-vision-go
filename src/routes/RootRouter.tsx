import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
const App = lazy(() => import("../App"));
const CatalogThumbnailPage = lazy(() => import("../components/catalogThumbnail/CatalogThumbnailPage"));
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
  const thumbItem = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("catalog-thumb")
    : null;
  if (thumbItem !== null) {
    return <Suspense fallback={null}><CatalogThumbnailPage itemId={thumbItem} /></Suspense>;
  }
  if (isTauriRuntime()) {
    return <Suspense fallback={<p role="status">Opening Cabinet Studio…</p>}><App /></Suspense>;
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
