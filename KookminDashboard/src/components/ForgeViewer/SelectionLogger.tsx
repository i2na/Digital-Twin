import { useEffect } from "react";

interface SelectionLoggerProps {
  viewer: Autodesk.Viewing.GuiViewer3D;
}

export default function SelectionLogger({ viewer }: SelectionLoggerProps) {
  useEffect(() => {
    const onSelectionChanged = (eventData: any) => {
      const dbIds: number[] = eventData.dbIdArray || [];
      if (dbIds.length > 0) {
        console.log("선택된 dbId:", dbIds);
      } else {
        console.log("선택 해제됨 or 빈 영역 클릭");
      }
    };

    viewer.addEventListener(
      Autodesk.Viewing.SELECTION_CHANGED_EVENT,
      onSelectionChanged
    );

    return () => {};
  }, [viewer]);

  return null;
}
