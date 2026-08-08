export async function svgToPngDataUrl(svg: string): Promise<string> {
  const encoded = window.btoa(
    encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    ),
  );
  const svgDataUrl = `data:image/svg+xml;base64,${encoded}`;

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
