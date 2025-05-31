// lib/store.ts
import { create } from "zustand";
import { ROOM_DBIDS } from "@/lib/modelData";

interface RoomStore {
  selectedRoom: number | null;
  setSelectedRoom: (room: number | null) => void;

  // 각 방의 PPD 값을 저장하는 맵: { [roomNumber]: ppdValue }
  roomPpd: Record<number, number>;
  setRoomPpd: (room: number, ppd: number) => void;
}

// 초기값으로 모든 roomPpd를 0으로 세팅합니다.
const initialRoomPpd: Record<number, number> = {};
Object.keys(ROOM_DBIDS).forEach((r) => {
  initialRoomPpd[Number(r)] = 0;
});

export const useRoomStore = create<RoomStore>((set) => ({
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),

  roomPpd: initialRoomPpd,
  setRoomPpd: (room, ppd) =>
    set((state) => ({
      roomPpd: { ...state.roomPpd, [room]: ppd },
    })),
}));
