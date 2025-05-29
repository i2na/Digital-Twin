import { useState } from "react";
import RemotePanel from "@/components/RemotePanel";
import { MdSettingsRemote } from "react-icons/md";

export default function RemotePanelToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto">
      <button
        onClick={() => setOpen(true)}
        className="fixed right-[16px] bottom-[16px] z-30 w-12 h-12 
             bg-gradient-to-t from-[#FFB200] to-[#FF9D26] 
             shadow-lg shadow-orange-300/50
             rounded-xl flex items-center justify-center 
             transition hover:scale-105 active:scale-95"
      >
        <MdSettingsRemote className="w-7 h-7 text-white" />
      </button>
      {open && <RemotePanel onClose={() => setOpen(false)} />}
    </div>
  );
}
