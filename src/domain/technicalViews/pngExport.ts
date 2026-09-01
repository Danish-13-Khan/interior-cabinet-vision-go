function binaryToBase64(binary: string) {
  if (typeof btoa === "function") return btoa(binary);
  const nodeBuffer = (globalThis as {
    Buffer?: { from(data: string, encoding: string): { toString(enc: string): string } };
  }).Buffer;
  if (!nodeBuffer) throw new Error("Unable to encode SVG as base64.");
  return nodeBuffer.from(binary, "binary").toString("base64");
}

function svgToBase64(svg: string) {
  const binary = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  return binaryToBase64(binary);
}

async function browserSvgToPng(svg: string): Promise<string> {
  const svgDataUrl = `data:image/svg+xml;base64,${svgToBase64(svg)}`;
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Unable to render technical view image."));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png", 1));
    };
    image.onerror = () => reject(new Error("Unable to load technical view image."));
    image.src = svgDataUrl;
  });
}

function renderError(detail: string): Error {
  return new Error(
    `Unable to render technical view SVG in Node (${detail}). Packet verification cannot use a placeholder image.`,
  );
}

async function nodeSvgToPng(svg: string): Promise<string> {
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");
    const image = await loadImage(`data:image/svg+xml;base64,${svgToBase64(svg)}`);
    const width = image.width;
    const height = image.height;
    if (!width || !height) {
      throw renderError(`empty size ${width}×${height}`);
    }
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unable to render technical view")) {
      throw error;
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw renderError(detail);
  }
}

export async function svgToPngDataUrl(svg: string): Promise<string> {
  if (typeof document !== "undefined" && typeof Image !== "undefined") {
    return browserSvgToPng(svg);
  }
  return nodeSvgToPng(svg);
}
