const variants = [
  ["rayon", "A Rayon rail"],
  ["floor", "B Floorplanner"],
  ["bar", "C Bottom bar"],
  ["overlay", "D Overlay"],
];
const steps = [
  ["start", "01 Start"],
  ["draw", "02 Draw"],
  ["place", "03 Place"],
  ["present", "04 Present"],
];

const rails = {
  draw: ["Select", "Room", "Wall", "Door", "Window"],
  place: ["Select", "Cabinet", "Run", "Filler", "Top"],
  present: ["Select", "Orbit"],
};

const props = {
  draw: ["WALL", "Back wall", "Length 6000 mm", "Thickness 120 mm"],
  place: ["CABINET", "Base 800", "800 × 720 × 560", "Walnut · slab"],
  present: ["PRESENT", "₹16,859", "GCR-001 · Rev A", "Freeze · Proposal · Send"],
};

const app = document.getElementById("app");
const variantNav = document.getElementById("variants");
const stepNav = document.getElementById("steps");

function buttons(host, items, key) {
  host.innerHTML = "";
  items.forEach(([id, label], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = app.dataset[key] === id || (!app.dataset[key] && index === 0) ? "is-on" : "";
    button.addEventListener("click", () => {
      app.dataset[key] = id;
      render();
    });
    host.append(button);
  });
}

function fill(id, lines, on) {
  const node = document.getElementById(id);
  node.innerHTML = "";
  lines.forEach((line, index) => {
    if (id === "rail") {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = line;
      button.className = index === on ? "is-on" : "";
      node.append(button);
      return;
    }
    const item = document.createElement(index === 0 || index === on ? "strong" : "p");
    item.textContent = line;
    node.append(item);
  });
}

function render() {
  const step = app.dataset.step;
  const variant = app.dataset.variant;
  buttons(variantNav, variants, "variant");
  buttons(stepNav, steps, "step");
  if (step === "start") return;
  const placeWide = variant === "floor" && step === "place";
  fill("rail", placeWide ? ["Base 900", "Drawer", "Wall 900", "Tall", "Filler"] : rails[step], 1);
  if (step !== "present" || variant !== "bar") fill("props", props[step], 1);
  const presentBtn = document.querySelector(".present-btn");
  presentBtn.classList.toggle("primary", step === "present");
}

render();
