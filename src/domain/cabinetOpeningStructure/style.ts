import type { OpeningContentType, OpeningStyle } from "./types";

export function contentTypeToOpeningStyle(contentType: OpeningContentType): OpeningStyle {
  switch (contentType) {
    case "door":
      return "door";
    case "drawer-stack":
      return "drawer";
    case "open-shelf":
    case "empty":
      return "open";
    case "divider":
      return "mixed";
    default:
      return "open";
  }
}
