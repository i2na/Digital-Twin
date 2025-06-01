"use client";

import React, { useState } from "react";
import ViewerInitializer from "./ViewerInitializer";
import CeilingHider from "./CeilingHider";
import RoomSelection from "./RoomSelection";
import SelectionLogger from "./SelectionLogger";
import TimeBar from "@/components/TimeBar";
import Dashboard from "@/components/Dashboard/Dashboard";
import RemoteToggle from "@/components/Remote/RemoteToggle";
import "@/styles/forge_overrides.css";

export default function ForgeViewer({ urn }: { urn: string }) {
  const [viewer, setViewer] = useState<Autodesk.Viewing.GuiViewer3D | null>(
    null
  );
  const [modelLoaded, setModelLoaded] = useState(false);

  return (
    <div className="relative w-screen h-screen">
      <div
        id="forgeViewer"
        className="w-full h-full bg-gray-100"
        style={{ position: "relative" }}
      >
        <ViewerInitializer
          urn={urn}
          onViewerReady={(inst) => setViewer(inst)}
          onModelLoaded={() => setModelLoaded(true)}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none z-10">
        <TimeBar />
        <Dashboard />
        <RemoteToggle />
      </div>

      {viewer && modelLoaded && (
        <>
          <CeilingHider viewer={viewer} />
          <RoomSelection viewer={viewer} modelLoaded={modelLoaded} />
          <SelectionLogger viewer={viewer} />
        </>
      )}
    </div>
  );
}
