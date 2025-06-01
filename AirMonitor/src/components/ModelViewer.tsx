"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomStore } from "@/lib/stores";
import TimeBar from "@/components/TimeBar";
import RemoteToggle from "@/components/Remote/RemoteToggle";
import Dashboard from "@/components/Dashboard/Dashboard";
import { ROOM_DBIDS } from "@/lib/modelData";
import "@/styles/forge_overrides.css";
import { Color } from "three";

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
        addEventListener(
          event: string,
          callback: (eventData: any) => void
        ): void;
        isolate(dbIds: number[]): void;
        fitToView(dbIds: number[]): void;
        hide(dbIds: number[] | number): void;
        setThemingColor(dbId: number, color: any): void;
        clearThemingColors(): void;
        getObjectTree(onLoaded: (instanceTree: any) => void): void;
        setQualityLevel(level: "default" | "low" | "medium" | "high"): void;
        impl: {
          sceneUpdated: () => void;
          invalidate: (force?: boolean) => void;
        };
        autocam?: {
          shotParams: {
            destinationPercent: number;
            duration: number;
          };
        };
      }
      const SELECTION_CHANGED_EVENT: string;
    }
  }
}

export default function ModelViewer({
  urn,
}: {
  urn: string;
  roomsLatest: Record<
    number,
    { temperature: number; humidity: number; occupancy: number }
  >;
}) {
  const container = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Autodesk.Viewing.GuiViewer3D | null>(null);
  const ceilingDbIdsRef = useRef<number[]>([]);
  const [ready, setReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [lastSelectedRoom, setLastSelectedRoom] = useState<number | null>(null);

  const selectedRoom = useRoomStore((state) => state.selectedRoom);

  // (1) Forge Viewer 로드 대기
  useEffect(() => {
    const iv = setInterval(() => {
      if (window.Autodesk?.Viewing) {
        clearInterval(iv);
        setReady(true);
      }
    }, 200);
    return () => clearInterval(iv);
  }, []);

  // (2) 뷰어 초기화 및 모델 로드
  useEffect(() => {
    if (!ready || !urn || !container.current) return;

    let viewer: Autodesk.Viewing.GuiViewer3D | null = null;

    // viewerOptions에 useConsolidation을 켜서 성능을 개선
    const viewerOptions = {
      env: "AutodeskProduction",
      theme: "dark-theme",
      extensions: [],
      useConsolidation: true,
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
        viewerRef.current = viewer;

        // 품질을 낮추고 progressive rendering을 켜서 버퍼링 없이 부드럽게
        viewer.setQualityLevel("low");
        if ((viewer as any).setProgressiveRendering) {
          // @ts-ignore
          viewer.setProgressiveRendering(true);
        }

        viewer.start();

        window.Autodesk!.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            const geom = doc.getRoot().getDefaultGeometry();
            viewer!.loadDocumentNode(doc, geom).then(() => {
              console.log("Model loaded.");
              setModelLoaded(true);

              // Object Tree를 한 번만 가져와서 '천장' 아래 자식 노드를 숨김
              viewer!.getObjectTree((instanceTree: any) => {
                let ceilingNodeId: number | null = null;
                instanceTree.enumNodeChildren(
                  instanceTree.getRootId(),
                  (dbId: number) => {
                    const nodeName = instanceTree.getNodeName(dbId);
                    if (nodeName === "천장") {
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
                  ceilingDbIdsRef.current = idsToHide;
                  if (idsToHide.length > 0) {
                    viewer!.hide(idsToHide);
                    console.log("숨긴 '천장' 하위 dbIds:", idsToHide);
                  }
                } else {
                  console.warn("'천장' 노드를 찾지 못했습니다.");
                }

                // 초기 카메라 위치 조정(전체 모델)
                viewer!.fitToView([]);
                console.log("초기 카메라 위치 조정 완료.");
              });

              // 선택 변경 이벤트 리스너: 선택 시 dbId 로깅
              viewer!.addEventListener(
                window.Autodesk!.Viewing.SELECTION_CHANGED_EVENT,
                (eventData: any) => {
                  const dbIds: number[] = eventData.dbIdArray || [];
                  if (dbIds.length > 0) {
                    console.log("선택된 dbId:", dbIds);
                  } else {
                    console.log("선택 해제됨 or 빈 영역 클릭");
                  }
                }
              );
            });
          },
          (code, msg) => console.error("Model load failed", code, msg)
        );
      }
    );

    // Cleanup: 컴포넌트 언마운트 시 viewer 레퍼런스 정리
    return () => {
      if (viewer) {
        viewerRef.current = null;
        window.forgeViewer = undefined;
      }
    };
  }, [ready, urn]);

  // (3) selectedRoom 변경 시 Zoom & Highlight or Reset
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !modelLoaded) return;

    const ceilingIds = ceilingDbIdsRef.current;

    // 이전과 같은 방 선택이면 아무 작업도 하지 않음
    if (selectedRoom === lastSelectedRoom) {
      return;
    }
    setLastSelectedRoom(selectedRoom);

    // 방 해제(전체 모델 복원) 로직
    if (selectedRoom == null) {
      // 모든 테마 컬러 초기화
      viewer.clearThemingColors();

      // 카메라 자동 이동 파라미터 설정
      if ((viewer as any).autocam?.shotParams) {
        (viewer as any).autocam.shotParams.destinationPercent = 1.2;
        (viewer as any).autocam.shotParams.duration = 2.5;
      }

      // 전체 모델 표시 후 천장만 다시 숨김
      viewer.isolate([]); // 모든 요소 표시
      if (ceilingIds.length > 0) {
        viewer.hide(ceilingIds);
      }

      viewer.fitToView([]);

      // 씬 업데이트 요청
      viewer.impl.invalidate();
      console.log("전체 모델 복원 (방 선택 해제).");
      return;
    }

    // 특정 방 선택 시 로직
    viewer.clearThemingColors();

    if ((viewer as any).autocam?.shotParams) {
      (viewer as any).autocam.shotParams.destinationPercent = 1.2;
      (viewer as any).autocam.shotParams.duration = 2.5;
    }

    // 모든 요소 표시→천장 숨김→선택 방으로 카메라 이동→하이라이트 순서로 최소한의 호출만 수행
    viewer.isolate([]); // 모든 요소 표시
    if (ceilingIds.length > 0) {
      viewer.hide(ceilingIds);
    }

    const dbIds = ROOM_DBIDS[selectedRoom] || [];
    if (dbIds.length === 0) {
      console.warn(`매핑된 dbId가 없습니다: ${selectedRoom}호`);
      return;
    }

    // 선택한 방으로 카메라 이동
    viewer.fitToView(dbIds);

    // 선택한 방 요소들에 하이라이트 컬러 적용
    const highlightColor = new Color(1, 1, 0.3);
    dbIds.forEach((dbId) => viewer.setThemingColor(dbId, highlightColor));

    // 씬 업데이트 요청
    viewer.impl.invalidate();
    console.log(`방 ${selectedRoom} zoom & highlight → dbIds:`, dbIds);
  }, [selectedRoom, modelLoaded, lastSelectedRoom]);

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
