import { Suspense } from "react";
import { MdcApplicationDetailScreen } from "@/modules/mdc/screens/mdc-application-detail-screen";

export default function MdcApplicationDetailPage() {
  return (
    <Suspense fallback={<div className="zelify-workspace-page" />}>
      <MdcApplicationDetailScreen />
    </Suspense>
  );
}
