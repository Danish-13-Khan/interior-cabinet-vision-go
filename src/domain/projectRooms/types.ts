import type { CabinetInstance } from "../cabinetDimensions";
import type { RoomConfig } from "../roomModel";

export type ProjectRoom = {
  id: string;
  name: string;
  config: RoomConfig;
  cabinets: CabinetInstance[];
};

export type RoomSummary = {
  roomId: string;
  roomName: string;
  itemCount: number;
  cabinetCount: number;
  sizeLabel: string;
  totalCost: number;
  partLineCount: number;
  runCount: number;
};

export type WholeProjectScheduleRow = {
  mark: string;
  roomId: string;
  roomName: string;
  cabinetId: string;
  cabinetName: string;
  typeLabel: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  totalCost: number;
};

export type WholeProjectReport = {
  roomCount: number;
  roomSummaries: RoomSummary[];
  schedule: WholeProjectScheduleRow[];
  totalItemCount: number;
  totalCabinetCount: number;
  totalPartLineCount: number;
  totalCost: number;
  totalSell: number;
};
