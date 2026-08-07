import type { HardwareItem, HardwareKind } from "../../domain/hardwareSystem";
import {
  createHardwareEntry,
  type WorkshopLibraryPack,
} from "../../domain/workshopLibrary";

type LibraryHardwareTabProps = {
  library: WorkshopLibraryPack;
  hardware: HardwareItem[];
  onPersist: (next: WorkshopLibraryPack, note: string) => void;
};

export function LibraryHardwareTab({
  library,
  hardware,
  onPersist,
}: LibraryHardwareTabProps) {
  return (
    <section className="report-subsection">
      <div className="library-section-actions">
        <button
          type="button"
          className="tb-btn"
          onClick={() => {
            const label = window.prompt("Hardware name:", "Custom soft hinge");
            if (!label?.trim()) return;
            const kind = (window.prompt(
              "Kind (hinge/slide/handle/accessory):",
              "hinge",
            ) || "hinge") as HardwareKind;
            const cost = Number(window.prompt("Unit cost ₹:", "100") || 100);
            const entry = createHardwareEntry(label.trim(), kind, cost);
            onPersist(
              { ...library, hardware: [...library.hardware, entry] },
              `Added hardware ${entry.label}.`,
            );
          }}
        >
          Add hardware SKU
        </button>
      </div>
      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Hardware</th>
              <th>Kind</th>
              <th>Cost</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {hardware.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.label}</strong>
                </td>
                <td>{item.kind}</td>
                <td>₹{item.costPerUnit}</td>
                <td>{"userDefined" in item && item.userDefined ? "User" : "Built-in"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
