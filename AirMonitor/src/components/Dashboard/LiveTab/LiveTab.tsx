// components/Dashboard/LiveTab/LiveTab.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { motion, AnimatePresence } from "framer-motion";
import { RoomList } from "./RoomList";
import { RoomDetail } from "./RoomDetail";
import { useRoomStore } from "@/lib/store";

interface StatusResponse {
  rooms: Record<number, { temperature: number; humidity: number }>;
  history: any;
}

export function LiveTab() {
  const { data } = useSWR<StatusResponse>("/api/status/rooms", fetcher, {
    refreshInterval: 60000,
  });
  const rawRooms = data?.rooms ?? {};
  const roomsLatest = Object.entries(rawRooms).reduce(
    (acc, [roomStr, info]) => {
      const roomNum = Number(roomStr);
      acc[roomNum] = {
        temperature: info.temperature,
        humidity: info.humidity,
        occupancy: 0,
      };
      return acc;
    },
    {} as RoomsLatest
  );
  const roomsHistory = data?.history ?? {};
  const [localSelectedRoom, setLocalSelectedRoom] = useState<number | null>(
    null
  );
  const selectedRoom = useRoomStore((state) => state.selectedRoom);
  const setSelectedRoom = useRoomStore((state) => state.setSelectedRoom);

  useEffect(() => {
    setLocalSelectedRoom(selectedRoom);
  }, [selectedRoom]);

  return (
    <AnimatePresence mode="wait">
      {localSelectedRoom == null ? (
        <motion.div
          key="room-list"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          <RoomList roomsLatest={roomsLatest} />
        </motion.div>
      ) : (
        <motion.div
          key={`room-detail-${localSelectedRoom}`}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          <RoomDetail
            room={localSelectedRoom}
            roomsLatest={roomsLatest}
            roomsHistory={roomsHistory}
            onBack={() => setSelectedRoom(null)}
            onSelectRoom={(roomNum) => setSelectedRoom(roomNum)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
