"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { useRoomStore } from "@/utils/useRoomStore";
import { calculateDiscomfortIndex } from "@/utils/AnalysisReportTab/calculations";
import { ROOM_DBIDS, DEFAULT_DBIDS } from "@/lib/modelData";
import { DICard } from "@/components/Dashboard/AnalysisReportTab/DICard";

export function HeatmapTab() {
  const roomsLatest = useRoomStore((state) => state.roomsLatest);
  const modelLoadedRef = useRef<boolean>(false);

  const getViewer = (): Autodesk.Viewing.GuiViewer3D | null => {
    if (typeof window === "undefined") return null;
    return (window as any).forgeViewer as Autodesk.Viewing.GuiViewer3D;
  };

  const applyHeatmapWithTheming = () => {
    const viewer = getViewer();
    if (!viewer) return;
    const THREE_INTERNAL = (window as any).THREE;
    viewer.setBackgroundColor(0, 0, 0, 0, 0, 0);
    viewer.clearThemingColors(viewer.model);

    Object.keys(ROOM_DBIDS).forEach((key) => {
      const roomNum = Number(key);
      const roomInfo = roomsLatest[roomNum];
      let colorHex = "#00F0FF";
      if (roomInfo) {
        const di = calculateDiscomfortIndex(
          roomInfo.temperature,
          roomInfo.humidity
        );
        if (di < 65) colorHex = "#00F0FF";
        else if (di < 70) colorHex = "#00FFA3";
        else if (di < 75) colorHex = "#FFD700";
        else if (di < 80) colorHex = "#FF6F61";
        else colorHex = "#FF3D00";
      }
      const hex = colorHex.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const a = 0.8;
      const colorVec = new THREE_INTERNAL.Vector4(r, g, b, a);

      ROOM_DBIDS[roomNum].forEach((dbId) => {
        viewer.impl.visibilityManager.show(dbId, viewer.model);
        viewer.setThemingColor(dbId, colorVec, viewer.model, true);
      });
    });

    if (DEFAULT_DBIDS.length) {
      const baseColor = new THREE_INTERNAL.Color(0xf0f3ff);
      const baseVec = new THREE_INTERNAL.Vector4(
        baseColor.r,
        baseColor.g,
        baseColor.b,
        0.8
      );
      DEFAULT_DBIDS.forEach((dbId) => {
        viewer.impl.visibilityManager.show(dbId, viewer.model);
        viewer.setThemingColor(dbId, baseVec, viewer.model, true);
      });
    }

    viewer.impl.invalidate(true);
  };

  useEffect(() => {
    const viewer = getViewer();
    if (!viewer) return;
    const onGeomLoaded = () => {
      modelLoadedRef.current = true;
      applyHeatmapWithTheming();
    };
    viewer.clearThemingColors(viewer.model);
    viewer.fitToView();
    viewer.setBackgroundColor(0, 0, 0, 0, 0, 0);
    viewer.addEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      onGeomLoaded
    );
    const instTree = (viewer.model as any)?.getData?.()?.instanceTree;
    if (instTree) onGeomLoaded();
    return () => {
      const v = getViewer();
      if (v) {
        v.clearThemingColors(v.model);
        v.setBackgroundColor(255, 255, 255, 255, 255, 255);
      }
      viewer.removeEventListener(
        Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
        onGeomLoaded
      );
    };
  }, []);

  useEffect(() => {
    if (!modelLoadedRef.current) return;
    applyHeatmapWithTheming();
  }, [roomsLatest]);

  const diList = useMemo(() => {
    return Object.entries(roomsLatest).map(([roomStr, info]) => ({
      room: Number(roomStr),
      di: calculateDiscomfortIndex(info.temperature, info.humidity),
    }));
  }, [roomsLatest]);

  const handleSelectRoom = useCallback((roomNum: number) => {
    const viewer = getViewer();
    if (!viewer) return;
    const dbIds = ROOM_DBIDS[roomNum] || [];
    viewer.clearSelection();
    viewer.select(dbIds, viewer.model, Autodesk.Viewing.SelectionType.REGULAR);
    viewer.impl.invalidate(true);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "8px",
      }}
    >
      {diList.map(({ room, di }) => (
        <div
          key={room}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            cursor: "pointer",
          }}
          onClick={() => handleSelectRoom(room)}
        >
          <span style={{ fontSize: "18px", fontWeight: 900 }}>{room}호</span>
          <DICard di={di} loading={false} />
        </div>
      ))}
    </div>
  );
}
