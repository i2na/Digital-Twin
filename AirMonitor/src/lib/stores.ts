import { create } from "zustand";

interface RoomInfo {
  temperature: number;
  humidity: number;
  occupancy: number;
}

interface RoomStore {
  roomsLatest: Record<number, RoomInfo>;
  selectedRoom: number | null;
  setRoomsLatest: (rooms: Record<number, RoomInfo>) => void;
  setSelectedRoom: (room: number | null) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomsLatest: {},
  selectedRoom: null,
  setRoomsLatest: (rooms) =>
    set(() => ({
      roomsLatest: rooms,
    })),
  setSelectedRoom: (room) =>
    set(() => ({
      selectedRoom: room,
    })),
}));
