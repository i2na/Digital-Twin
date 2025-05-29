"use client";

import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/TopBar";
import ControlPanel from "@/components/ControlPanel";
import RemotePanelToggle from "@/components/RemotePanelToggle";

declare global {
  interface Window {
    Autodesk?: typeof Autodesk;
    forgeViewer?: Autodesk.Viewing.GuiViewer3D;
  }
  namespace Autodesk {
    namespace Viewing {
      function Initializer(
        options: {
          env: string;
          getAccessToken?: (cb: (t: string, e: number) => void) => void;
        },
        callback: () => void
      ): void;
      class Document {
        static load(
          urn: string,
          onSuccess: (doc: Document) => void,
          onError?: (code: number, message: string) => void
        ): void;
        getRoot(): { getDefaultGeometry(): object };
      }
      class GuiViewer3D {
        constructor(container: HTMLDivElement, options?: any);
        start(): boolean;
        loadDocumentNode(document: Document, geometry: any): Promise<void>;
        setTheme?(theme: string): void;
        finish?(): void;
      }
    }
  }
}

export default function ModelViewer({ urn }: { urn: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      if (window.Autodesk?.Viewing) {
        clearInterval(iv);
        setReady(true);
      }
    }, 200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!ready || !urn || !container.current) return;

    let viewer: any;

    const options = {
      env: "AutodeskProduction",
      theme: "dark-theme",
      extensions: [],
    };

    window.Autodesk!.Viewing.Initializer(
      {
        env: options.env,
        getAccessToken: async (cb: (t: string, e: number) => void) => {
          const res = await fetch("/api/auth/twolegged");
          const data = await res.json();
          cb(data.access_token, data.expires_in);
        },
      },
      () => {
        viewer = new window.Autodesk!.Viewing.GuiViewer3D(
          container.current!,
          options
        );
        window.forgeViewer = viewer;
        viewer.start();

        window.Autodesk!.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            const geom = doc.getRoot().getDefaultGeometry();
            viewer.loadDocumentNode(doc, geom).then(() => {
              setTimeout(() => {
                const cube = container.current!.querySelector(
                  ".viewcubeWrapper"
                ) as HTMLElement;
                if (cube) {
                  cube.style.top = "80px";
                  cube.style.right = "24px";
                }
              }, 1200);
            });
          },
          (code, msg) => console.error("Model load failed", code, msg)
        );
      }
    );

    return () => {
      if (viewer && viewer.finish) viewer.finish();
    };
  }, [ready, urn]);

  return (
    <div
      ref={container}
      id="forgeViewer"
      className="relative w-screen h-screen"
    >
      <div className="absolute inset-0 pointer-events-none z-10">
        <TopBar />
        <ControlPanel />
        <RemotePanelToggle />
      </div>
    </div>
  );
}
