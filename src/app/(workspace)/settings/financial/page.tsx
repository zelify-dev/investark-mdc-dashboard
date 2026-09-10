import { redirect } from "next/navigation";

export default function FinancialSetupIndexPage() {
  redirect("/settings/financial/currency");
}
