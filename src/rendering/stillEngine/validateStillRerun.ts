import { validateDeterministicRerun } from "../../domain/livingRoom/stillJob/validateStillOutput";
import { stillImagePixelData } from "../export/stillImagePixels";

export async function validateStillEngineRerun(firstDataUrl: string, secondDataUrl: string) {
  const [first, second] = await Promise.all([
    stillImagePixelData(firstDataUrl),
    stillImagePixelData(secondDataUrl),
  ]);
  return validateDeterministicRerun(first, second);
}
