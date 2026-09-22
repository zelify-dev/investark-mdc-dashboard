import { Suspense } from "react";
import { PldAmlScreen } from "@/modules/pld-aml/screens/pld-aml-screen";

export default function PldAmlPage() {
  return (
    <Suspense fallback={<div className="zelify-workspace-page" />}>
      <PldAmlScreen />
    </Suspense>
  );
}
