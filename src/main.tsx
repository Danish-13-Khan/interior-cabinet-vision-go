import "./styles/tokens.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { migrateRetiredLayoutPreferences } from "./domain/desktopUx/layoutPreferenceMigration";
import { RootRouter } from "./routes/RootRouter";

migrateRetiredLayoutPreferences();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>,
);
