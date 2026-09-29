import "./styles/tokens.css";
import "./styles/app-error-boundary.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { migrateRetiredLayoutPreferences } from "./domain/desktopUx/layoutPreferenceMigration";
import { RootRouter } from "./routes/RootRouter";

migrateRetiredLayoutPreferences();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <RootRouter />
    </AppErrorBoundary>
  </React.StrictMode>,
);
