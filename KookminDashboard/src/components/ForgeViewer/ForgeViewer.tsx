"use client";

import React, { useState, useCallback } from "react";
import ViewerInitializer from "./ViewerInitializer";
import RoomSelection from "./RoomSelection";
import SelectionLogger from "./SelectionLogger";
import TimeBar from "@/components/TimeBar";
import Dashboard from "@/components/Dashboard/Dashboard";
import RemoteToggle from "@/components/Remote/RemoteToggle";
import "@/styles/forge-overrides.css";

export default function ForgeViewer({ urn }: { urn: string }) {
  const [viewer, setViewer] = useState<Autodesk.Viewing.GuiViewer3D | null>(
    null
  );
  const [modelLoaded, setModelLoaded] = useState(false);

  const handleViewerReady = useCallback(
    (inst: Autodesk.Viewing.GuiViewer3D) => {
      setViewer(inst);
    },
    []
  );

  const handleModelLoaded = useCallback(() => {
    setModelLoaded(true);
  }, []);

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

      {viewer && modelLoaded && (
        <>
          <div className="absolute inset-0 pointer-events-none z-10">
            <TimeBar />
            <Dashboard />
            <RemoteToggle />
          </div>
          <RoomSelection viewer={viewer} modelLoaded={modelLoaded} />
          <SelectionLogger viewer={viewer} />
        </>
      )}
    </div>
  );
}
