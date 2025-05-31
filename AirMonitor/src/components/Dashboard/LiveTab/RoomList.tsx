import { useRoomStore } from "@/lib/store";

export function RoomList({ roomsLatest }: { roomsLatest: RoomsLatest }) {
  const setSelectedRoom = useRoomStore((state) => state.setSelectedRoom);

  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="text-[#878787] font-bold text-lg ml-1">공간별 상태</div>
      {Object.entries(roomsLatest).map(([room, info]) => (
        <button
          key={room}
          onClick={() => setSelectedRoom(Number(room))}
          className="bg-white rounded-xl p-4 shadow flex flex-col items-start hover:bg-gray-50 transition"
        >
          <div className="text-[#969696] text-lg font-semibold mb-2">
            {room}호
          </div>
          <div className="flex justify-between w-full">
            <div className="flex items-end gap-1">
              <span className="text-[#222] font-medium text-base">온도</span>
              <span className="text-black font-bold text-lg ml-1">
                {info.temperature}°C
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-[#222] font-medium text-base">습도</span>
              <span className="text-black font-bold text-lg ml-1">
                {info.humidity}%
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
