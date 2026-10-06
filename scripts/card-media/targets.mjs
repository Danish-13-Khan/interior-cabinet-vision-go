export const APARTMENT_TARGETS = [
  { id: "template:apartment:studio:v1", slug: "studio", testId: "template:apartment:studio:v1" },
  { id: "template:apartment:1bhk:v1", slug: "1bhk", testId: "template:apartment:1bhk:v1" },
  {
    id: "template:apartment:2bhk:v1",
    slug: "2bhk",
    testId: "template:apartment:2bhk:v1",
    // Walnut walls and floors read near-black under evening light (subject luma 23),
    // so this plan is shot in daylight; walnut in daylight reads cast 0.97 and looks right.
    planMood: "day",
    planExposure: { castRatio: [0, 1] },
    // The clip opens on that plan, so the whole clip is daylight too: an evening
    // opening would be near-black and would not match the plan image.
    clipMood: "day",
  },
  { id: "template:apartment:3bhk:v1", slug: "3bhk", testId: "template:apartment:3bhk:v1" },
];

export const CATALOG_TARGETS = [
  { id: "template:core:living-room:v1", slug: "living-room" },
  { id: "template:core:empty-room:v1", slug: "empty-room" },
  { id: "template:core:straight-kitchen:v1", slug: "straight-kitchen" },
  { id: "template:core:l-kitchen:v1", slug: "l-kitchen" },
  { id: "template:core:bedroom:v1", slug: "bedroom" },
  { id: "template:core:bathroom:v1", slug: "bathroom" },
];
