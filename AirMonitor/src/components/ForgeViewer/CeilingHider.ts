import { useEffect } from "react";

interface CeilingHiderProps {
  viewer: Autodesk.Viewing.GuiViewer3D;
}

export default function CeilingHider({ viewer }: CeilingHiderProps) {
  useEffect(() => {
    viewer.getObjectTree((instanceTree: any) => {
      let ceilingNodeId: number | null = null;

      instanceTree.enumNodeChildren(
        instanceTree.getRootId(),
        (dbId: number) => {
          if (instanceTree.getNodeName(dbId) === "천장") {
            ceilingNodeId = dbId;
          }
        },
        true
      );

      if (ceilingNodeId !== null) {
        const idsToHide: number[] = [];
        instanceTree.enumNodeChildren(
          ceilingNodeId,
          (childId: number) => {
            idsToHide.push(childId);
          },
          true
        );
        if (idsToHide.length > 0) {
          viewer.hide(idsToHide);
        }
      }

      viewer.impl.invalidate();
    });
  }, [viewer]);

  return null;
}
