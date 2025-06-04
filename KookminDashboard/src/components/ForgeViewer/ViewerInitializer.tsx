"use client";

import React, { useEffect, useRef } from "react";

interface ViewerInitializerProps {
  urn: string;
  onViewerReady: (viewerInstance: Autodesk.Viewing.GuiViewer3D) => void;
  onModelLoaded: () => void;
}

export default function ViewerInitializer({
  urn,
  onViewerReady,
  onModelLoaded,
}: ViewerInitializerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!urn || !containerRef.current) return;

    let viewer: Autodesk.Viewing.GuiViewer3D | null = null;

    const viewerOptions = {
      env: "AutodeskProduction",
      extensions: [],
      useConsolidation: true,
    };

    // 1) Forge Viewer 초기화
    window.Autodesk!.Viewing.Initializer(
      {
        env: viewerOptions.env,
        getAccessToken: async (cb) => {
          const { access_token, expires_in } = await fetch(
            "/api/auth/twolegged"
          )
            .then((r) => r.json())
            .catch((err) => {
              console.error("토큰 요청 실패:", err);
            });
          if (access_token) cb(access_token, expires_in);
        },
      },
      () => {
        // 2) GuiViewer3D 인스턴스 생성
        viewer = new window.Autodesk!.Viewing.GuiViewer3D(
          containerRef.current!,
          viewerOptions
        );
        window.forgeViewer = viewer;

        // 3) 품질 및 렌더링 최적화
        viewer.setQualityLevel("low");
        if ((viewer as any).setProgressiveRendering) {
          // @ts-ignore
          viewer.setProgressiveRendering(true);
        }

        // 4) 뷰어 실행
        viewer.start();

        // 5) 최적화 옵션 해제 (ambientShadows, antialiasing 등)
        try {
          viewer.prefs.set("ambientShadows", false);
          viewer.prefs.set("antialiasing", false);
          viewer.prefs.set("groundShadow", false);
          viewer.prefs.set("groundReflection", false);
        } catch {
          /** ignore */
        }

        // 6) lightPreset 설정
        try {
          viewer.prefs.set("lightPreset", 17);
        } catch {
          /** ignore */
        }

        // 7) 모델 로드
        window.Autodesk!.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            const root = doc.getRoot();
            const geom = root.getDefaultGeometry();
            viewer!
              .loadDocumentNode(doc, geom)
              .then(() => {
                // 7-1) GEOMETRY_LOADED_EVENT 이후에만 setThemingColor 호출
                viewer!.addEventListener(
                  Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                  function onGeomLoaded() {
                    // 한 번만 실행되도록 리스너 해제
                    viewer!.removeEventListener(
                      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                      onGeomLoaded
                    );

                    onModelLoaded();
                  }
                );
              })
              .catch((err) => {
                console.error("loadDocumentNode 중 오류:", err);
              });
          },
          (code, msg) => {
            console.error("Document.load 실패:", code, msg);
          }
        );

        // 8) 부모 컴포넌트에 Viewer 인스턴스 전달
        onViewerReady(viewer);
      }
    );

    return () => {
      if (viewer) {
        window.forgeViewer = undefined;
      }
    };
  }, [urn]);

  return (
    <div
      ref={containerRef}
      id="forgeViewer"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
