"use client";

import { MdSettingsRemote } from "react-icons/md";
import { useAutoControl } from "@/utils/useAutoControl";
import Remote from "@/components/Remote/Remote";

export default function RemoteToggle() {
  const {
    open: autoOpen,
    openPanel,
    closePanel,
    active: autoOn,
    rest,
    stopAuto,
  } = useAutoControl();

  return (
    <div className="pointer-events-auto">
      <button
        onClick={() => openPanel()}
        className="fixed right-[16px] bottom-[16px] z-30 w-[48px] h-[48px] 
             bg-gradient-to-t from-[#74c4fa] to-[#24A7FF] 
             shadow-lg shadow-black-300/50
             rounded-xl flex items-center justify-center 
             transition hover:scale-105 active:scale-95"
      >
        <MdSettingsRemote className="w-7 h-7 text-white" />
      </button>

      {(autoOpen || autoOn) && (
        <Remote
          onClose={() => closePanel()}
          autoOn={autoOn}
          rest={rest}
          stop={stopAuto}
        />
      )}
    </div>
  );
}
