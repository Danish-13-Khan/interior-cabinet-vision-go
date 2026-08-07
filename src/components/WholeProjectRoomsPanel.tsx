import { formatQuoteMoney } from "../domain/quoteSettings";
import type { WholeProjectReport } from "../domain/projectRooms";

type WholeProjectRoomsPanelProps = {
  wholeProject: WholeProjectReport;
};

export function WholeProjectRoomsPanel({ wholeProject }: WholeProjectRoomsPanelProps) {
  return (
    <div className="report-doc">
      <header className="report-doc-header">
        <div>
          <strong>Whole-Project Rooms</strong>
          <span>
            {wholeProject.roomCount} rooms · {wholeProject.totalItemCount} items · cost{" "}
            {formatQuoteMoney(wholeProject.totalCost)}
          </span>
        </div>
      </header>

      <div className="report-summary-grid">
        <div className="report-card">
          <span className="report-card-label">Rooms</span>
          <strong>{wholeProject.roomCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Cabinets</span>
          <strong>{wholeProject.totalCabinetCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Part lines</span>
          <strong>{wholeProject.totalPartLineCount}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Project cost</span>
          <strong>{formatQuoteMoney(wholeProject.totalCost)}</strong>
        </div>
        <div className="report-card">
          <span className="report-card-label">Sell total</span>
          <strong>{formatQuoteMoney(wholeProject.totalSell)}</strong>
        </div>
      </div>

      <section className="report-subsection">
        <h3>Room Summaries</h3>
        <div className="shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Size</th>
                <th>Items</th>
                <th>Cabinets</th>
                <th>Runs</th>
                <th>Parts</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {wholeProject.roomSummaries.map((room) => (
                <tr key={room.roomId}>
                  <td>
                    <strong>{room.roomName}</strong>
                  </td>
                  <td>{room.sizeLabel}</td>
                  <td>{room.itemCount}</td>
                  <td>{room.cabinetCount}</td>
                  <td>{room.runCount}</td>
                  <td>{room.partLineCount}</td>
                  <td>{formatQuoteMoney(room.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-subsection">
        <h3>Whole-Project Schedule</h3>
        <div className="shop-table-wrap">
          <table className="shop-table">
            <thead>
              <tr>
                <th>Mark</th>
                <th>Room</th>
                <th>Cabinet</th>
                <th>Type</th>
                <th>Size</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {wholeProject.schedule.length === 0 ? (
                <tr>
                  <td colSpan={6}>No cabinets in the project yet.</td>
                </tr>
              ) : (
                wholeProject.schedule.map((row) => (
                  <tr key={`${row.roomId}-${row.cabinetId}`}>
                    <td>{row.mark}</td>
                    <td>{row.roomName}</td>
                    <td>{row.cabinetName}</td>
                    <td>{row.typeLabel}</td>
                    <td>
                      {row.widthMm}×{row.heightMm}×{row.depthMm}
                    </td>
                    <td>{formatQuoteMoney(row.totalCost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
