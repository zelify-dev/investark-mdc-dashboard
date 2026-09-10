import { Suspense } from "react";
import { MdcScreen } from "@/modules/mdc/screens/mdc-screen";

export default function SettingsIndexPage() {
  return (
    <Suspense fallback={<div className="zelify-workspace-page" />}>
      <MdcScreen variant="config" />
    </Suspense>
  );
}
