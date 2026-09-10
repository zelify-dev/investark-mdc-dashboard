"use client";

import { Suspense } from "react";
import { MdcScreen } from "@/modules/mdc/screens/mdc-screen";

export default function HomeScreen() {
  return (
    <Suspense fallback={<div className="zelify-workspace-page" />}>
      <MdcScreen variant="panel" />
    </Suspense>
  );
}
