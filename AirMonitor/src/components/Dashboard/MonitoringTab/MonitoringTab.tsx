"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { motion, AnimatePresence } from "framer-motion";
import { RoomList } from "./RoomList";
import { RoomDetail } from "./RoomDetail";
import { useRoomStore } from "@/utils/stores";

interface StatusResponse {
  rooms: Record<number, { temperature: number; humidity: number }>;
  history: any;
}

export function MonitoringTab() {
  const { data } = useSWR<StatusResponse>("/api/status/rooms", fetcher, {
    refreshInterval: 60000,
  });
  const rawRooms = data?.rooms ?? {};
  const computedRoomsLatest = Object.entries(rawRooms).reduce(
    (acc, [roomStr, info]) => {
      const roomNum = Number(roomStr);
      acc[roomNum] = {
        temperature: info.temperature,
        humidity: info.humidity,
        occupancy: 0,
      };
      return acc;
    },
    {} as Record<
      number,
      { temperature: number; humidity: number; occupancy: number }
    >
  );
  const roomsHistory = data?.history ?? {};
  const localSelectedRoom = useRoomStore((state) => state.selectedRoom);
  const setSelectedRoom = useRoomStore((state) => state.setSelectedRoom);
  const setRoomsLatest = useRoomStore((state) => state.setRoomsLatest);

  useEffect(() => {
    setRoomsLatest(computedRoomsLatest);
  }, [data]);

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
          <RoomList />
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
            roomsHistory={roomsHistory}
            onBack={() => setSelectedRoom(null)}
            onSelectRoom={(roomNum) => setSelectedRoom(roomNum)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
