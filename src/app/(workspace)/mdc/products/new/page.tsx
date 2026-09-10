import { Suspense } from "react";
import { MdcProductFormScreen } from "@/modules/mdc/screens/mdc-product-form-screen";

export default function NewMdcProductPage() {
  return (
    <Suspense fallback={<div className="zelify-workspace-page" />}>
      <MdcProductFormScreen />
    </Suspense>
  );
}
