"use client";

import { useEffect, useRef, useState } from "react";
import TimeBar from "@/components/TimeBar";
import Dashboard from "@/components/Dashboard/Dashboard";
import RemoteToggle from "@/components/Remote/RemoteToggle";
import "@/styles/forge_overrides.css";

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
        finish?(): void;
      }
    }
  }
}

export default function ModelViewer({ urn }: { urn: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Autodesk Viewer 스크립트 로드 대기
  useEffect(() => {
    const iv = setInterval(() => {
      if (window.Autodesk?.Viewing) {
        clearInterval(iv);
        setReady(true);
      }
    }, 200);
    return () => clearInterval(iv);
  }, []);

  // 뷰어 초기화
  useEffect(() => {
    if (!ready || !urn || !container.current) return;

    let viewer: Autodesk.Viewing.GuiViewer3D | undefined;

    const viewerOptions = {
      env: "AutodeskProduction",
      theme: "dark-theme",
      extensions: [], // 필요하면 추가
    };

    window.Autodesk!.Viewing.Initializer(
      {
        env: viewerOptions.env,
        getAccessToken: async (cb) => {
          const { access_token, expires_in } = await fetch(
            "/api/auth/twolegged"
          ).then((r) => r.json());
          cb(access_token, expires_in);
        },
      },
      () => {
        viewer = new window.Autodesk!.Viewing.GuiViewer3D(
          container.current!,
          viewerOptions
        );
        window.forgeViewer = viewer;
        viewer.start();

        window.Autodesk!.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            const geom = doc.getRoot().getDefaultGeometry();
            viewer!.loadDocumentNode(doc, geom);
          },
          (code, msg) => console.error("Model load failed", code, msg)
        );
      }
    );

    return () => viewer?.finish?.();
  }, [ready, urn]);

  return (
    <div
      ref={container}
      id="forgeViewer"
      className="relative w-screen h-screen"
    >
      <div className="absolute inset-0 pointer-events-none z-10">
        <TimeBar />
        <Dashboard />
        <RemoteToggle />
      </div>
    </div>
  );
}
