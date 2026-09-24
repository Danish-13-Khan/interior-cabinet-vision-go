import type { BoqGroup, BoqLine } from "../../domain/boq";

export function StudioBoqGroups(props: {
  groups: BoqGroup[];
  baseLines: BoqLine[];
  money: (amount: number) => string;
  onQuantity: (key: string, base: number, raw: string) => void;
}) {
  return (
    <table className="studio-table studio-boq-table">
      <thead>
        <tr><th>Item / specification</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr>
      </thead>
      {props.groups.map((group) => (
        <tbody key={group.key}>
          <tr className="studio-boq-group">
            <th colSpan={3}>{group.title}</th>
            <th>{props.money(group.sellPrice)}</th>
          </tr>
          {group.lines.map((line) => {
            const base = props.baseLines.find((item) => item.key === line.key)?.quantity ?? line.quantity;
            const rate = line.quantity > 0 ? line.sellPrice / line.quantity : line.sellPrice;
            return (
              <tr key={line.key}>
                <td>
                  <strong>{line.partLabel}</strong>
                  <small>{line.material}{line.finish ? ` · ${line.finish}` : ""}</small>
                </td>
                <td>
                  <input
                    aria-label={`Quantity for ${line.partLabel}`}
                    type="number"
                    min={0}
                    max={9999}
                    value={line.quantity}
                    onChange={(event) => props.onQuantity(line.key, base, event.target.value)}
                  />
                </td>
                <td>{props.money(Math.round(rate))}</td>
                <td>{props.money(line.sellPrice)}</td>
              </tr>
            );
          })}
        </tbody>
      ))}
    </table>
  );
}
