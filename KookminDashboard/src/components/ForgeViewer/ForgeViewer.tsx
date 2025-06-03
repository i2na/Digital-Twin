// src/components/ForgeViewer/ForgeViewer.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import ViewerInitializer from "./ViewerInitializer";
import RoomSelection from "./RoomSelection";
import SelectionLogger from "./SelectionLogger";
import RoomDbIdLogger from "./RoomDbIdLogger";
import TimeBar from "@/components/TimeBar";
import Dashboard from "@/components/Dashboard/Dashboard";
import RemoteToggle from "@/components/Remote/RemoteToggle";
import "@/styles/forge-overrides.css";

export default function ForgeViewer({ urn }: { urn: string }) {
  const [viewer, setViewer] = useState<Autodesk.Viewing.GuiViewer3D | null>(
    null
  );
  const [modelLoaded, setModelLoaded] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────────
  // onViewerReady 와 onModelLoaded 콜백을 useCallback 으로 감싸서, ViewerInitializer 에
  // props로 전달될 때 매번 새로운 함수 객체가 생성되지 않게 만듭니다.
  // (이렇게 해야 ViewerInitializer 의 useEffect 의존성 배열이 바뀌지 않아서
  //  viewer 재초기화가 반복적으로 발생하지 않습니다.)
  // ──────────────────────────────────────────────────────────────────────────────
  const handleViewerReady = useCallback(
    (inst: Autodesk.Viewing.GuiViewer3D) => {
      setViewer(inst);
    },
    []
  );

  const handleModelLoaded = useCallback(() => {
    setModelLoaded(true);
  }, []);
  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-screen h-screen">
      <div
        id="forgeViewer"
        className="w-full h-full bg-gray-100"
        style={{ position: "relative" }}
      >
        <ViewerInitializer
          urn={urn}
          onViewerReady={handleViewerReady}
          onModelLoaded={handleModelLoaded}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none z-10">
        <TimeBar />
        <Dashboard />
        <RemoteToggle />
      </div>

      {viewer && modelLoaded && (
        <>
          <RoomSelection viewer={viewer} modelLoaded={modelLoaded} />
          <SelectionLogger viewer={viewer} />
          {/* <RoomDbIdLogger viewer={viewer} modelLoaded={modelLoaded} /> */}
        </>
      )}
    </div>
  );
}
