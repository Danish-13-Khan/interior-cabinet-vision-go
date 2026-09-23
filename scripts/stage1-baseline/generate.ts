import { installStage1Clock } from "./clock";

installStage1Clock();

const { resetSamplesDir } = await import("./output");
const { writeEngineeringSamples } = await import("./engineeringSamples");
const { writeCommercialSamples } = await import("./commercialSamples");

resetSamplesDir();
writeEngineeringSamples();
writeCommercialSamples();
console.log("stage1 samples written");
