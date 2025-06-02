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
    if (!urn || !containerRef.current) {
      console.warn(
        "[ViewerInitializer] urn 또는 containerRef가 유효하지 않습니다."
      );
      return;
    }

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
          try {
            const { access_token, expires_in } = await fetch(
              "/api/auth/twolegged"
            ).then((r) => r.json());
            console.log("[ViewerInitializer] AccessToken 취득 성공");
            cb(access_token, expires_in);
          } catch (err) {
            console.error("[ViewerInitializer] AccessToken 취득 중 오류:", err);
          }
        },
      },
      () => {
        // 2) GuiViewer3D 인스턴스 생성
        viewer = new window.Autodesk!.Viewing.GuiViewer3D(
          containerRef.current!,
          viewerOptions
        );
        window.forgeViewer = viewer;
        console.log("[ViewerInitializer] GuiViewer3D 인스턴스 생성됨.");

        // 3) 품질 및 렌더링 최적화
        viewer.setQualityLevel("low"); // 렌더링 품질을 낮춰서 성능 높임
        if ((viewer as any).setProgressiveRendering) {
          // 프로그레시브 렌더링 활성화 (메모리 부하 줄이면서 로드)
          // @ts-ignore
          viewer.setProgressiveRendering(true);
        }

        // 4) 뷰어 실행
        viewer.start();
        console.log("[ViewerInitializer] viewer.start() 호출됨.");

        // 5) 필수 최적화 옵션: 불필요한 섀도우·반사·안티앨리어싱 해제
        try {
          viewer.prefs.set("ambientShadows", false);
          viewer.prefs.set("antialiasing", false);
          viewer.prefs.set("groundShadow", false);
          viewer.prefs.set("groundReflection", false);
        } catch (er) {
          console.warn(
            "[ViewerInitializer] 최적화 prefs 중 일부 설정 실패:",
            er
          );
        }

        // 6) 환경(Environment) 설정
        try {
          viewer.prefs.set("lightPreset", 17);
        } catch (er) {
          console.warn("[ViewerInitializer] lightPreset 설정 실패:", er);
        }

        // 7) 모델 로드
        window.Autodesk!.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            console.log("[ViewerInitializer] Document.load 성공:", urn);
            const root = doc.getRoot();
            const geom = root.getDefaultGeometry();
            viewer!.loadDocumentNode(doc, geom).then(() => {
              console.log(
                "[ViewerInitializer] 모델 로드 후 loadDocumentNode 완료."
              );
              onModelLoaded();
            });
          },
          (code, msg) => {
            console.error(
              "[ViewerInitializer] Document.load 실패 코드:",
              code,
              "메시지:",
              msg
            );
          }
        );

        // 8) 부모 컴포넌트에 Viewer 인스턴스 전달
        onViewerReady(viewer);
      }
    );

    // Cleanup: 컴포넌트 언마운트 시 Viewer 인스턴스 해제
    return () => {
      if (viewer) {
        window.forgeViewer = undefined;
        console.log("[ViewerInitializer] cleanup: viewer 인스턴스 해제됨.");
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
