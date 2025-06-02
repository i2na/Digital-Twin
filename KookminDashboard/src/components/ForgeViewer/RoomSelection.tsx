import { useEffect, useRef, useState } from "react";
import { Color } from "three";
import { useRoomStore } from "@/utils/useRoomStore";
import { ROOM_DBIDS } from "@/lib/modelData";

interface RoomSelectionProps {
  viewer: Autodesk.Viewing.GuiViewer3D;
  modelLoaded: boolean;
}

export default function RoomSelection({
  viewer,
  modelLoaded,
}: RoomSelectionProps) {
  const selectedRoom = useRoomStore((state) => state.selectedRoom);
  const [lastSelectedRoom, setLastSelectedRoom] = useState<number | null>(null);
  const ceilingIdsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!modelLoaded) return;

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
        ceilingIdsRef.current = idsToHide;
        if (idsToHide.length > 0) {
          viewer.hide(idsToHide);
        }
      }

      viewer.fitToView([]);
      viewer.impl.invalidate();
    });
  }, [modelLoaded, viewer]);

  useEffect(() => {
    if (!modelLoaded) return;

    const ceilingIds = ceilingIdsRef.current;

    if (selectedRoom === lastSelectedRoom) return;
    setLastSelectedRoom(selectedRoom);

    if (selectedRoom == null) {
      viewer.clearThemingColors();
      if ((viewer as any).autocam?.shotParams) {
        (viewer as any).autocam.shotParams.destinationPercent = 1.2;
        (viewer as any).autocam.shotParams.duration = 2.5;
      }
      viewer.isolate([]);
      if (ceilingIds.length > 0) {
        viewer.hide(ceilingIds);
      }
      viewer.fitToView([]);
      viewer.impl.invalidate();
      return;
    }

    viewer.clearThemingColors();
    if ((viewer as any).autocam?.shotParams) {
      (viewer as any).autocam.shotParams.destinationPercent = 1.2;
      (viewer as any).autocam.shotParams.duration = 2.5;
    }
    viewer.isolate([]);
    if (ceilingIds.length > 0) {
      viewer.hide(ceilingIds);
    }

    const dbIds = ROOM_DBIDS[selectedRoom] || [];
    if (dbIds.length > 0) {
      viewer.fitToView(dbIds);
      const highlightColor = new Color(1, 1, 0.3);
      dbIds.forEach((dbId) => viewer.setThemingColor(dbId, highlightColor));
    } else {
      console.warn(`매핑된 dbId가 없습니다: ${selectedRoom}호`);
    }

    viewer.impl.invalidate();
  }, [selectedRoom, modelLoaded, viewer, lastSelectedRoom]);

  return null;
}
