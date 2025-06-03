// src/components/ForgeViewer/RoomHeatmapExtension.tsx

import * as THREE from "three";

// 전역 Autodesk 선언
declare const Autodesk: any;

/**
 * RoomHeatmapExtension
 * - Revit에서 붙여둔 Instance Parameter "Rooms"에 따라 방별 dbId를 조회
 * - /api/status/rooms로부터 방호수→온도 데이터를 가져와
 *   viewer.setThemingColor(dbId, color)로 히트맵을 적용
 */
export default class RoomHeatmapExtension extends Autodesk.Viewing.Extension {
  private _viewer: any;
  private _PARAM_NAME: string = "Rooms";
  private _ROOM_DATA_API: string = "/api/status/rooms";
  private _MIN_TEMP: number = 20.0;
  private _MAX_TEMP: number = 30.0;

  constructor(viewer: any, options: any) {
    super(viewer, options);
    this._viewer = viewer;
    // onGeometryLoaded 메서드 바인딩
    this.onGeometryLoaded = this.onGeometryLoaded.bind(this);
  }

  /**
   * Extension이 로드될 때 실행되는 메서드
   */
  public load(): boolean {
    console.log("RoomHeatmapExtension loaded");

    // 모델 geometry가 모두 로드된 후 onGeometryLoaded 호출
    this._viewer.addEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      this.onGeometryLoaded
    );

    return true;
  }

  /**
   * Extension이 언로드될 때 실행되는 메서드
   */
  public unload(): boolean {
    console.log("RoomHeatmapExtension unloaded");

    // 이벤트 리스너 제거
    this._viewer.removeEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      this.onGeometryLoaded
    );

    // 적용된 테마 색상 초기화
    this._viewer.clearThemingColors();
    this._viewer.impl.invalidate(true, false, false);

    return true;
  }

  /**
   * 모델의 Geometry가 완전히 로드된 후 호출되는 콜백
   */
  private onGeometryLoaded(): void {
    // 1) 실시간 방 데이터(fetch)
    fetch(this._ROOM_DATA_API)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Room data API error: ${res.statusText}`);
        }
        return res.json() as Promise<Record<string, number>>;
      })
      .then((roomTemps) => {
        // roomTemps 예시: { "101": 22.5, "102": 24.3, ... }
        this.applyHeatmap(roomTemps);
      })
      .catch((err) => {
        console.error("Room data fetch error:", err);
      });
  }

  /**
   * 방별 온도 데이터를 받아와 히트맵 적용
   * @param roomTemps Revit 방호수 → 실시간 온도 맵
   */
  private applyHeatmap(roomTemps: Record<string, number>): void {
    // 2) viewer.search로 SVF 내 "Rooms" 속성값을 가진 dbId 배열 얻기
    const searchFn =
      typeof this._viewer.search === "function"
        ? this._viewer.search.bind(this._viewer)
        : typeof this._viewer.model.search === "function"
        ? this._viewer.model.search.bind(this._viewer.model)
        : null;

    if (!searchFn) {
      console.error("viewer.search 기능 없음");
      return;
    }

    searchFn(
      this._PARAM_NAME,
      (dbIds: number[]) => {
        console.log("Found Rooms dbIds:", dbIds);
        if (dbIds.length === 0) {
          console.warn("모델에 'Rooms' 속성 값이 없습니다.");
          return;
        }

        // 3) getBulkProperties로 dbId별 방 번호(roomNumber) 얻기
        const bulkFn =
          typeof this._viewer.getBulkProperties === "function"
            ? this._viewer.getBulkProperties.bind(this._viewer)
            : typeof this._viewer.model.getBulkProperties === "function"
            ? this._viewer.model.getBulkProperties.bind(this._viewer.model)
            : null;

        if (!bulkFn) {
          console.error("getBulkProperties 기능 없음");
          return;
        }

        bulkFn(
          dbIds,
          [this._PARAM_NAME],
          (
            elements: Array<{
              dbId: number;
              properties: Array<{ displayName: string; displayValue: string }>;
            }>
          ) => {
            // elements: [{ dbId:120, properties:[{displayName:"Rooms", displayValue:"101"}]}, ...]

            // 4) roomNumber -> dbId 매핑 테이블 생성
            const roomToDb: Record<string, number> = {};
            elements.forEach((elem) => {
              const info = elem.properties.find(
                (p) => p.displayName === this._PARAM_NAME
              );
              if (info && info.displayValue) {
                roomToDb[info.displayValue] = elem.dbId;
              }
            });

            // 5) 실제 방별 데이터를 바탕으로 SetThemingColor 적용
            Object.keys(roomToDb).forEach((roomNum) => {
              const dbId = roomToDb[roomNum];
              const temp = roomTemps[roomNum];
              if (temp === undefined || temp === null) {
                // 데이터가 없으면 스킵
                return;
              }

              // 온도값을 0~1 범위 ratio로 정규화
              const clamped = Math.max(
                this._MIN_TEMP,
                Math.min(this._MAX_TEMP, temp)
              );
              const ratio =
                (clamped - this._MIN_TEMP) / (this._MAX_TEMP - this._MIN_TEMP);

              // Blue→Red 그라디언트 (r=ratio, g=0, b=1-ratio)
              const r = ratio;
              const g = 0.0;
              const b = 1.0 - ratio;
              const a = 0.5; // 반투명 정도

              const colorVec = new THREE.Vector4(r, g, b, a);

              // 6) dbId별 테마 컬러 적용
              this._viewer.setThemingColor(dbId, colorVec);
            });

            // 7) 화면 갱신
            this._viewer.impl.invalidate(true, false, false);
          },
          (err: any) => {
            console.error("getBulkProperties 실패:", err);
          }
        );
      },
      (err: any) => {
        console.error("viewer.search 실패:", err);
      },
      ["propName"]
    );
  }
}

// Extension 등록
Autodesk.Viewing.theExtensionManager.registerExtension(
  "RoomHeatmapExtension",
  RoomHeatmapExtension
);
