import { Landing } from "./Landing";

/** Keep the public showroom available, including when a local session exists. */
export function GuestHome() {
  return <Landing />;
}
