"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { motion, AnimatePresence } from "framer-motion";
import { RoomList } from "./RoomList";
import { RoomDetail } from "./RoomDetail";

interface StatusResponse {
  rooms: RoomsLatest;
  history: RoomsHistory;
}

export function LiveTab() {
  // 캐시 즉시 사용, 60초마다 재요청
  const { data } = useSWR<StatusResponse>("/api/status/rooms", fetcher, {
    refreshInterval: 60000,
  });

  const roomsLatest = data?.rooms ?? {};
  const roomsHistory = data?.history ?? {};
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  useEffect(() => () => setSelectedRoom(null), []);

  return (
    <AnimatePresence mode="wait">
      {selectedRoom == null ? (
        <motion.div
          key="room-list"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          <RoomList roomsLatest={roomsLatest} onSelect={setSelectedRoom} />
        </motion.div>
      ) : (
        <motion.div
          key={`room-detail-${selectedRoom}`}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          <RoomDetail
            room={selectedRoom}
            roomsLatest={roomsLatest}
            roomsHistory={roomsHistory}
            onBack={() => setSelectedRoom(null)}
            onSelectRoom={setSelectedRoom}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
