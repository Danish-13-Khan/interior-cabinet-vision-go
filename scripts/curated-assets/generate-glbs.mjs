/**
 * Build curated soft-goods GLBs with normalized scale/origin/slot names.
 * Run: node scripts/curated-assets/generate-glbs.mjs
 */
import { writeCoffeeTable } from "./coffeeTable.mjs";
import { writeFloorLamp } from "./floorLamp.mjs";
import { writeLoungeChair } from "./loungeChair.mjs";
import { writePlant } from "./plant.mjs";
import { writeSideTable } from "./sideTable.mjs";
import { writeSofa } from "./sofa.mjs";
import { softGoodsDir } from "./threeExport.mjs";

await writeSofa();
await writeLoungeChair();
await writeCoffeeTable();
await writeSideTable();
await writeFloorLamp();
await writePlant();

console.log(`Wrote curated soft-goods GLBs to ${softGoodsDir}`);
