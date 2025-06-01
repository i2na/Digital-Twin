import { useState } from "react";
import RemotePanel from "@/components/Remote/Remote";
import { MdSettingsRemote } from "react-icons/md";

export default function RemoteToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto">
      <button
        onClick={() => setOpen(true)}
        className="fixed right-[16px] bottom-[16px] z-30 w-[48px] h-[48px] 
             bg-gradient-to-t from-[#74c4fa] to-[#24A7FF] 
             shadow-lg shadow-black-300/50
             rounded-xl flex items-center justify-center 
             transition hover:scale-105 active:scale-95"
      >
        <MdSettingsRemote className="w-7 h-7 text-white" />
      </button>
      {open && <RemotePanel onClose={() => setOpen(false)} />}
    </div>
  );
}
