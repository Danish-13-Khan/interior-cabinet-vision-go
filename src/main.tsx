import React from "react";
import ReactDOM from "react-dom/client";
import { RootRouter } from "./routes/RootRouter";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>,
);
