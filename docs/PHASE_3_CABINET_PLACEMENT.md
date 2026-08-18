# Phase 3 — Cabinet placement

**Status:** Complete

The first cabinet template is a **Wardrobe Wall**. In the Cabinet Library, choose the target wall in Build mode, then place the template. The cabinet is centered against the room-facing wall surface and carries a persistent wall attachment reference.

The cabinet authoring flow includes catalog placement, plan selection, drag movement, exact size and rotation controls, duplication and deletion. Cabinets dragged close to a wall snap to it. Select two or more cabinets and choose **Run** to create a centered wall run. The right-side inspector exposes cabinet size, material slots, door style, and door count.

The compact placement resolver is intentionally under 200 lines and is shared by the 2D plan, model, and project data. It handles straight rectangular room walls; collision resolution, multi-cabinet runs, fillers, and elevation authoring remain later work.
