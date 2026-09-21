export type WallContextMenuMaterial = {
  id: string;
  name: string;
};

export type WallContextMenuEntry = {
  id: string;
  label: string;
  separator?: boolean;
  disabled?: boolean;
  materialId?: string;
  children?: WallContextMenuEntry[];
};

/** Spec for the 3D wall right-click menu: hide, apply a project finish, or clear. */
export function wallContextMenuEntries(
  materials: readonly WallContextMenuMaterial[],
): WallContextMenuEntry[] {
  return [
    { id: "hide-wall", label: "Hide Wall" },
    { id: "sep-materials", label: "", separator: true },
    {
      id: "apply-material",
      label: "Apply Material to Selected Object",
      disabled: materials.length === 0,
      children: materials.map((material) => ({
        id: `apply-material:${material.id}`,
        label: material.name,
        materialId: material.id,
      })),
    },
    { id: "clear-wall-material", label: "Clear wall material" },
  ];
}
