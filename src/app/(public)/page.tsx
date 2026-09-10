"use client";

import dynamic from "next/dynamic";

const HomeScreen = dynamic(() => import("@/components/home-screen"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "100vh" }} />,
});

export default function PublicHomePage() {
  return <HomeScreen />;
}
