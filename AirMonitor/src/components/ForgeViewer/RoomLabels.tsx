import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ROOM_DBIDS } from "@/lib/modelData";

interface RoomLabelsProps {
  viewer: Autodesk.Viewing.GuiViewer3D;
  modelLoaded: boolean;
}

export default function RoomLabels({ viewer, modelLoaded }: RoomLabelsProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const labelsRef = useRef<
    Record<number, { worldPos: THREE.Vector3; div: HTMLDivElement }>
  >({});

  useEffect(() => {
    const root = document.getElementById("forgeViewer");
    if (!root) return;

    const overlay = document.createElement("div");
    overlay.id = "roomLabelOverlay";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "1";
    root.appendChild(overlay);
    overlayRef.current = overlay;

    return () => {
      overlay.remove();
    };
  }, []);

  useEffect(() => {
    if (!modelLoaded) return;
    if (!overlayRef.current) return;

    Object.values(labelsRef.current).forEach(({ div }) => div.remove());
    labelsRef.current = {};

    viewer.getObjectTree((instanceTree: any) => {
      const fragList = viewer.model.getFragmentList();

      Object.entries(ROOM_DBIDS).forEach(([roomKey, dbIds]) => {
        const roomNum = parseInt(roomKey, 10);

        const fragIds: number[] = [];
        dbIds.forEach((dbId: number) => {
          instanceTree.enumNodeFragments(
            dbId,
            (fragId: number) => {
              fragIds.push(fragId);
            },
            true
          );
        });
        if (fragIds.length === 0) {
          return;
        }

        const bboxMin = new THREE.Vector3(Infinity, Infinity, Infinity);
        const bboxMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        fragIds.forEach((fragId) => {
          const fragProxy = viewer.impl.getFragmentProxy(viewer.model, fragId);
          fragProxy.getAnimTransform();
          fragProxy.updateAnimTransform();

          const matrixWorld: THREE.Matrix4 = fragProxy.worldMatrix;
          const geom = fragList.getGeometry(fragId);
          if (!geom) return;
          if (!geom.boundingBox) {
            geom.computeBoundingBox();
          }
          const localMin = geom.boundingBox.min.clone();
          const localMax = geom.boundingBox.max.clone();
          localMin.applyMatrix4(matrixWorld);
          localMax.applyMatrix4(matrixWorld);
          bboxMin.min(localMin);
          bboxMax.max(localMax);
        });

        const centerWorld = new THREE.Vector3();
        bboxMin.add(bboxMax).multiplyScalar(0.5);

        const height = bboxMax.y - bboxMin.y;
        const elevatedCenter = centerWorld.clone();
        elevatedCenter.y = bboxMax.y + height * 0.2 + 200;

        const div = document.createElement("div");
        div.className = "room-label-tag";
        div.textContent = `${roomNum}호 | ${getRoomName(roomNum)}`;
        div.style.position = "absolute";
        div.style.padding = "4px 10px";
        div.style.background = "rgba(0, 0, 0, 0.4)";
        div.style.color = "#ffffff";
        div.style.fontSize = "13px";
        div.style.fontWeight = "500";
        div.style.border = "1px solid rgba(255,255,255,0.3)";
        div.style.borderRadius = "8px";
        div.style.whiteSpace = "nowrap";
        div.style.pointerEvents = "none";
        div.style.visibility = "hidden";
        overlayRef.current!.appendChild(div);

        labelsRef.current[roomNum] = {
          worldPos: elevatedCenter,
          div,
        };
      });

      updateAllLabelsPosition();
    });
  }, [modelLoaded, viewer]);

  useEffect(() => {
    if (!modelLoaded) return;
    const onCameraChange = () => updateAllLabelsPosition();
    viewer.addEventListener(
      Autodesk.Viewing.CAMERA_CHANGE_EVENT,
      onCameraChange
    );
    return () => {
      viewer.removeEventListener(
        Autodesk.Viewing.CAMERA_CHANGE_EVENT,
        onCameraChange
      );
    };
  }, [modelLoaded, viewer]);

  function updateAllLabelsPosition() {
    if (!viewer || !overlayRef.current) return;
    const canvasRect = viewer.canvas.getBoundingClientRect();

    Object.values(labelsRef.current).forEach(({ worldPos, div }) => {
      let screenPt: THREE.Vector3;
      if (typeof viewer.worldToClient === "function") {
        screenPt = viewer.worldToClient(worldPos.clone());
      } else {
        screenPt = new THREE.Vector3();
        (viewer.navigation as any).worldToClient(worldPos.clone(), screenPt);
      }
      const x = screenPt.x + canvasRect.left;
      const y = screenPt.y + canvasRect.top;
      div.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
      div.style.visibility = "visible";
    });
  }

  function getRoomName(roomNum: number) {
    const mapping: Record<number, string> = {
      509: "AI 스타트업 랩",
      510: "VR/AR 스튜디오",
      511: "로봇 연구실",
      512: "4F 라운지",
      513: "드론 스튜디오",
      516: "호라이즌 스튜디오",
      525: "IoT/IoE 스튜디오",
      526: "IoT/IoE 스튜디오",
    };
    return mapping[roomNum] || "";
  }

  return null;
}
