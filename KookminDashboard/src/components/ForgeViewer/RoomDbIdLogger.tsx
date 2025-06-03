// src/components/ForgeViewer/RoomDbIdLogger.tsx

"use client";

import { useEffect } from "react";

interface RoomDbIdLoggerProps {
  viewer: Autodesk.Viewing.GuiViewer3D;
  modelLoaded: boolean;
}

export default function RoomDbIdLogger({
  viewer,
  modelLoaded,
}: RoomDbIdLoggerProps) {
  useEffect(() => {
    if (!modelLoaded) return;

    // 1) Revit Instance Parameter 이름(영문 대소문자 그대로 일치해야 함)
    const PARAM_NAME = "Rooms";

    // 2) viewer.search 또는 model.search 함수 참조 (Viewer 환경마다 search가 달리 붙을 수 있음)
    const searchFn =
      typeof viewer.search === "function"
        ? viewer.search.bind(viewer)
        : typeof (viewer.model as any).search === "function"
        ? (viewer.model as any).search.bind(viewer.model)
        : null;

    if (!searchFn) {
      console.error("viewer.search 기능이 정의되어 있지 않습니다.");
      return;
    }

    // 3) "propName" 모드로 검색: displayName === "Rooms" 인 모든 요소의 dbId 목록 가져오기
    searchFn(
      PARAM_NAME, // 검색할 파라미터 이름
      (dbIds: number[]) => {
        console.log(
          `🔍 '${PARAM_NAME}' 속성을 가진 요소들의 dbId 목록:`,
          dbIds
        );

        if (dbIds.length === 0) {
          console.warn(`⚠️ 모델 내에 '${PARAM_NAME}'라는 파라미터가 없습니다.`);
          return;
        }

        // 4) getBulkProperties로, 찾은 dbId 목록에서 실제 “Rooms” 값(예: "101", "102")을 가져오기
        const bulkFn =
          typeof viewer.getBulkProperties === "function"
            ? viewer.getBulkProperties.bind(viewer)
            : typeof (viewer.model as any).getBulkProperties === "function"
            ? (viewer.model as any).getBulkProperties.bind(viewer.model)
            : null;

        if (!bulkFn) {
          console.error("❌ getBulkProperties 기능이 정의되어 있지 않습니다.");
          return;
        }

        bulkFn(
          dbIds,
          [PARAM_NAME], // 가져올 파라미터 이름 배열
          (
            elements: Array<{
              dbId: number;
              properties: Array<{
                displayName: string;
                displayValue: string;
              }>;
            }>
          ) => {
            console.log(`🏷️ '${PARAM_NAME}' 파라미터 값 가져오기 결과:`);
            elements.forEach((elem) => {
              const propInfo = elem.properties.find(
                (p) => p.displayName === PARAM_NAME
              );
              console.log(
                `   dbId=${elem.dbId}   |   ${PARAM_NAME} = ${propInfo?.displayValue}`
              );
            });
          },
          (error: any) => {
            console.error("❌ getBulkProperties 실패:", error);
          }
        );
      },
      (error: any) => {
        console.error("❌ viewer.search 실패:", error);
      },
      ["propName"] // 검색 모드: propName(파라미터 이름)으로만 검색
    );
  }, [viewer, modelLoaded]);

  return null;
}
