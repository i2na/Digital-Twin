// src/components/Dashboard/HeatmapTab/HeatmapTab.tsx
"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useRoomStore } from "@/utils/useRoomStore";
import { calculateDiscomfortIndex } from "@/utils/AnalysisReportTab/calculations";
import { ROOM_DBIDS } from "@/lib/modelData";

export function HeatmapTab() {
  // 1) Zustand 등에서 관리된 방별 최신 데이터
  const roomsLatest = useRoomStore((state) => state.roomsLatest);
  // 2) 모델이 완전히 로드된 상태인지 체크하기 위한 ref
  const modelLoadedRef = useRef<boolean>(false);

  // 3) Forge Viewer 인스턴스 getter 헬퍼
  const getViewer = () => {
    if (typeof window === "undefined") return null;
    return (window as any).forgeViewer as Autodesk.Viewing.GuiViewer3D;
  };

  // 4) 실제로 DI 계산 후 Them­ing 적용하는 함수
  const applyHeatmap = () => {
    const viewer = getViewer();
    if (!viewer) {
      console.warn("[HeatmapTab] applyHeatmap 호출 시 viewer가 null");
      return;
    }

    // 4-1) 최신 방 데이터가 비어 있으면 종료
    const roomNumbers = Object.keys(roomsLatest).map((k) => Number(k));
    if (roomNumbers.length === 0) {
      console.warn("[HeatmapTab] roomsLatest가 비어 있음");
      return;
    }

    console.log("[HeatmapTab] applyHeatmap 시작 → roomsLatest =", roomsLatest);

    roomNumbers.forEach((roomNum) => {
      const roomInfo = roomsLatest[roomNum];
      console.log("[HeatmapTab] 방", roomNum, "roomInfo:", roomInfo);
      if (!roomInfo) return;

      // 4-2) 온도·습도 → DI 계산
      const { temperature: ta, humidity: rh } = roomInfo;
      const di = calculateDiscomfortIndex(ta, rh);
      console.log(`[HeatmapTab] 방 ${roomNum} DI 계산 결과:`, di.toFixed(2));

      // 4-3) DI 단계별 색상 결정
      let colorHex = "#3BB8F9"; // < 68 → 파랑
      if (di >= 72) {
        colorHex = "#FF3D3D"; // ≥ 72 → 빨강
      } else if (di >= 68) {
        colorHex = "#FFEA00"; // 68 ≤ di < 72 → 노랑
      }
      console.log(`[HeatmapTab] 방 ${roomNum} 색 결정:`, colorHex);

      // 4-4) HEX → THREE.Vector4(r,g,b,a=1.0) [완전 불투명]
      const hex = colorHex.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const a = 1.0;
      const colorVec = new THREE.Vector4(r, g, b, a);

      // 4-5) 외벽 DbId 목록 꺼내기
      const dbIds = ROOM_DBIDS[roomNum] || [];
      console.log(`[HeatmapTab] 방 ${roomNum} DbIds:`, dbIds);
      if (dbIds.length === 0) {
        console.warn(`[HeatmapTab] 방 ${roomNum}에 대한 DbId 미정의`);
        return;
      }

      // 4-6) viewer.model.setThemingColor 호출
      dbIds.forEach((dbId) => {
        (viewer.model as any).setThemingColor(dbId, colorVec);
      });
    });

    // 4-7) 한 번만 invalidate(true) 호출해서 UI 갱신
    viewer.impl.invalidate(true);
    console.log("[HeatmapTab] applyHeatmap 완료 → invalidate 완료");
  };

  // 5a) “모델이 완전히 로드된 직후” 한 번만 적용하기 위한 useEffect
  useEffect(() => {
    const viewer = getViewer();
    if (!viewer) {
      console.warn("[HeatmapTab] useEffect(모델 로드) → viewer가 아직 null");
      return;
    }

    // (1) GEOMETRY_LOADED_EVENT 핸들러
    const onGeomLoaded = () => {
      console.log("[HeatmapTab] GEOMETRY_LOADED_EVENT 발생!");
      modelLoadedRef.current = true;
      applyHeatmap();
    };

    // (2) 모델 로드 직전에 Them­ing 초기화 + 전체 뷰 맞추기
    viewer.clearThemingColors();
    viewer.fitToView();
    console.log("[HeatmapTab] viewer.clearThemingColors(), fitToView 호출");

    // (3) 이벤트 리스너 등록 (모델 로드가 완료되면 그 즉시 applyHeatmap)
    viewer.addEventListener(
      window.Autodesk!.Viewing.GEOMETRY_LOADED_EVENT,
      onGeomLoaded
    );
    console.log("[HeatmapTab] GEOMETRY_LOADED_EVENT 리스너 등록");

    // (4) 이미 모델이 로드된 상태라면(이전에 loadDocumentNode가 끝난 경우) 즉시 applyHeatmap
    const instTree = (viewer.model as any)?.getData?.()?.instanceTree;
    if (instTree) {
      console.log("[HeatmapTab] 이미 모델 로드 완료, 바로 applyHeatmap() 호출");
      onGeomLoaded();
    }

    // (5) Cleanup: 컴포넌트 언마운트 시 반드시 이벤트 해제
    return () => {
      viewer.removeEventListener(
        window.Autodesk!.Viewing.GEOMETRY_LOADED_EVENT,
        onGeomLoaded
      );
      console.log("[HeatmapTab] 이벤트 핸들러 해제");
    };
  }, []); // 빈 배열 → 마운트/언마운트 시에만 실행

  // 5b) “roomsLatest 값이 바뀔 때마다” 다시 Them­ing 적용
  useEffect(() => {
    if (!modelLoadedRef.current) {
      console.log("[HeatmapTab] 모델 로드 전이라 applyHeatmap 스킵");
      return;
    }
    console.log("[HeatmapTab] roomsLatest 변경 감지 → applyHeatmap()");
    applyHeatmap();
  }, [roomsLatest]);

  // 6) 화면에 아무 UI도 렌더하지 않고, useEffect만 실행
  return null;
}
