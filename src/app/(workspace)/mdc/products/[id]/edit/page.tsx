import { Suspense } from "react";
import { MdcProductEditScreen } from "@/modules/mdc/screens/mdc-product-edit-screen";

export default function EditMdcProductPage() {
  return (
    <Suspense fallback={<div className="zelify-workspace-page" />}>
      <MdcProductEditScreen />
    </Suspense>
  );
}
