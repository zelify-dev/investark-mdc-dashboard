import { Suspense } from "react";
import { MdcRuleFormScreen } from "@/modules/mdc/screens/mdc-rule-form-screen";

export default function MdcRuleFormPage() {
  return (
    <Suspense fallback={<div className="zelify-workspace-page" />}>
      <MdcRuleFormScreen />
    </Suspense>
  );
}
