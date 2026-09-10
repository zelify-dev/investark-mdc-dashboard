import { ModuleChecklistPage } from "@/modules/kyb/components/module-checklist-page";
import { companyInfoChecklistSections } from "@/modules/kyb/lib/onboarding-config";

export default function CompanyInfoPage() {
  return (
    <ModuleChecklistPage
      title="De la Empresa"
      moduleKey="companyInfo"
      description="Declare y suba la información complementaria solicitada sobre extranjería, contexto laboral, relación con funcionarios públicos y actividad económica en México."
      sections={companyInfoChecklistSections}
    />
  );
}
