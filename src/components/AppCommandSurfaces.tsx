import { LibraryManagerPanel } from "./LibraryManagerPanel";
import { CommandPalette, type CommandItem } from "./CommandPalette";
import { ShortcutSheet } from "./ShortcutSheet";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import type {
  ShortcutActionId,
  ShortcutBinding,
  ShortcutMap,
} from "../domain/desktopUx";
import type { WorkshopLibraryPack } from "../domain/workshopLibrary";
import type { ProjectStandards } from "../domain/projectStandards";
import { clampProjectStandards } from "../domain/projectStandards";
import type { CabinetConfig } from "../domain/cabinetDimensions";

type AppCommandSurfacesProps = {
  libraryManagerOpen: boolean;
  workshopLibrary: WorkshopLibraryPack;
  projectStandards: ProjectStandards;
  selectedConfig: CabinetConfig | null;
  onLibraryChange: (library: WorkshopLibraryPack) => void;
  onApplyStandardsPack: (standards: ProjectStandards) => void;
  onCloseLibraryManager: () => void;
  isCommandBarOpen: boolean;
  commandQuery: string;
  commandItems: CommandItem[];
  recentCommandIds: string[];
  onQueryChange: (query: string) => void;
  onCloseCommandSurfaces: () => void;
  onRunCommand: (commandId: string) => void;
  isShortcutSheetOpen: boolean;
  shortcutMap: ShortcutMap;
  onChangeBinding: (actionId: ShortcutActionId, binding: ShortcutBinding) => void;
  onResetShortcuts: () => void;
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null;
  onCloseContextMenu: () => void;
};

export function AppCommandSurfaces({
  libraryManagerOpen,
  workshopLibrary,
  projectStandards,
  selectedConfig,
  onLibraryChange,
  onApplyStandardsPack,
  onCloseLibraryManager,
  isCommandBarOpen,
  commandQuery,
  commandItems,
  recentCommandIds,
  onQueryChange,
  onCloseCommandSurfaces,
  onRunCommand,
  isShortcutSheetOpen,
  shortcutMap,
  onChangeBinding,
  onResetShortcuts,
  contextMenu,
  onCloseContextMenu,
}: AppCommandSurfacesProps) {
  return (
    <>
      {libraryManagerOpen ? (
        <div className="command-bar-backdrop" onClick={onCloseLibraryManager}>
          <div
            className="library-manager-shell"
            onClick={(event) => event.stopPropagation()}
          >
            <LibraryManagerPanel
              library={workshopLibrary}
              projectStandards={projectStandards}
              selectedConfig={selectedConfig}
              onLibraryChange={onLibraryChange}
              onApplyStandardsPack={(standards) => {
                onApplyStandardsPack(clampProjectStandards(standards));
              }}
              onClose={onCloseLibraryManager}
            />
          </div>
        </div>
      ) : null}

      {isCommandBarOpen ? (
        <CommandPalette
          query={commandQuery}
          items={commandItems}
          recentCommandIds={recentCommandIds}
          onQueryChange={onQueryChange}
          onClose={onCloseCommandSurfaces}
          onRunCommand={onRunCommand}
        />
      ) : null}
      {isShortcutSheetOpen ? (
        <ShortcutSheet
          shortcutMap={shortcutMap}
          onClose={onCloseCommandSurfaces}
          onChangeBinding={onChangeBinding}
          onReset={onResetShortcuts}
        />
      ) : null}
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={onCloseContextMenu}
        />
      ) : null}
    </>
  );
}
