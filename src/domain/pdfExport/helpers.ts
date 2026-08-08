import { jsPDF } from "jspdf";

export type PdfLayout = {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  rowHeight: number;
};

export async function optimizeSceneImage(dataUrl: string | null): Promise<string | null> {
  if (!dataUrl) {
    return null;
  }

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const maxWidth = 1400;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.fillStyle = "#f7f8fa";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export function drawLabeledValue(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
) {
  doc.setFillColor(247, 249, 252);
  doc.roundedRect(x, y, width, 15, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(111, 121, 136);
  doc.text(label, x + 3, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(37, 48, 64);
  doc.text(value, x + 3, y + 11.5);
}

export function ensurePageSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  pageHeight: number,
  margin: number,
) {
  if (y + needed <= pageHeight - margin) {
    return y;
  }

  doc.addPage();
  return margin;
}
