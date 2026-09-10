import { ModuleChecklistPage } from "@/modules/kyb/components/module-checklist-page";
import { commercialInfoChecklistSections } from "@/modules/kyb/lib/onboarding-config";

export default function CommercialInfoPage() {
  return (
    <ModuleChecklistPage
      title="Información Comercial"
      moduleKey="businessPlan"
      description="Indique el perfil comercial de su empresa: productos, mercado, modelo de ingresos, competencia y volumetría operativa estimada."
      sections={commercialInfoChecklistSections}
    />
  );
}
