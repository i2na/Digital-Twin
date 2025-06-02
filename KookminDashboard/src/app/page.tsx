"use client";

import { useEffect, useState } from "react";
import DotLoader from "react-spinners/DotLoader";
import dynamic from "next/dynamic";

const ForgeViewer = dynamic(
  () => import("@/components/ForgeViewer/ForgeViewer"),
  {
    ssr: false,
  }
);

export default function Page() {
  const [urn, setUrn] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const savedUrn = localStorage.getItem("model_urn");
        if (savedUrn) {
          setUrn(savedUrn);
        } else {
          const res = await fetch("/api/model/init");
          const data = await res.json();
          if (!res.ok) throw new Error("초기화 실패");

          localStorage.setItem("model_urn", data.urn);
          setUrn(data.urn);
        }
      } catch (err) {
        console.error(err);
        alert("모델 초기화에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50">
        <DotLoader size={80} color="#3b82f6" />
        <p className="mt-10 text-lg text-gray-600 animate-pulse">
          모델을 불러오는 중입니다
        </p>
      </div>
    );
  }

  return <ForgeViewer urn={urn} />;
}
