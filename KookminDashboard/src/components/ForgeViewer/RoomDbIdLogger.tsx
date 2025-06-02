// src/components/ForgeViewer/RoomDbIdLogger.tsx
"use client";

import { useEffect } from "react";

interface RoomDbIdLoggerProps {
  viewer: Autodesk.Viewing.GuiViewer3D;
  modelLoaded: boolean;
}

/**
 * 모델 로드가 완료된 뒤,
 * 'Rooms'라는 속성(property name)을 가진 요소들의 dbId를 콘솔에 출력합니다.
 */
export default function RoomDbIdLogger({
  viewer,
  modelLoaded,
}: RoomDbIdLoggerProps) {
  useEffect(() => {
    if (!modelLoaded) return;

    // ▶ "Rooms"라는 property name을 검색하려면 네 번째 인자로 ["propName"]을 넘겨야 합니다.
    viewer.model.search(
      "Rooms",
      (dbIds: number[]) => {
        console.log("🔍 'Rooms' 속성을 가진 요소들의 dbId 목록:", dbIds);
      },
      (err: any) => {
        console.error("❌ viewer.model.search 수행 중 에러:", err);
      },
      // ★ 검색 유형을 명시: propName → 모델의 'property name'을 대상으로 검색
      ["propName"]
    );
  }, [viewer, modelLoaded]);

  return null;
}
