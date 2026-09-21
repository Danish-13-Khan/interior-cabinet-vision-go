export function isCadUnderlayFile(file: File): boolean {
  return /\.(dwg|dxf)$/i.test(file.name || "");
}

export function isAsciiDxfName(name: string): boolean {
  return /\.dxf$/i.test(name || "");
}
