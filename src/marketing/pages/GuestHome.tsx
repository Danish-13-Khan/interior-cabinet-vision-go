import { Navigate } from "react-router-dom";
import { openJobWorkbench } from "../../domain/desktopUx";
import { isLoggedIn } from "../lib/auth";

/** Public site is the planner — skip the old Cabinet Studio marketing landing. */
export function GuestHome() {
  if (isLoggedIn()) {
    openJobWorkbench();
    return <Navigate to="/app" replace />;
  }
  return <Navigate to="/login" replace />;
}
