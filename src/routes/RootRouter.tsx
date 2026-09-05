import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "../App";
import {
  GeminiFloorplanLabPage,
  isGeminiFloorplanLabEnabled,
} from "../experiments/gemini-floorplan";
import { RequireAuth } from "../marketing/components/RequireAuth";
import { ThemeProvider } from "../marketing/lib/theme";
import { Landing } from "../marketing/pages/Landing";
import { Login } from "../marketing/pages/Login";
import { Register } from "../marketing/pages/Register";
import { isTauriRuntime } from "../platform/desktopFiles";

/**
 * Web: marketing at /, auth at /login|/register, real designer at /app (gated).
 * Lab: /lab/gemini-floorplan when DEV or VITE_ENABLE_GEMINI_LAB=true.
 * Tauri desktop: boot straight into the designer (skip marketing/auth).
 */
export function RootRouter() {
  if (isTauriRuntime()) {
    return <App />;
  }

  const labOn = isGeminiFloorplanLabEnabled();

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
          {labOn ? (
            <Route path="/lab/gemini-floorplan" element={<GeminiFloorplanLabPage />} />
          ) : null}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
