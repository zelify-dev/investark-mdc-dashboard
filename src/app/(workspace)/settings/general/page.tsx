import { redirect } from "next/navigation";

export default function GeneralSetupIndexPage() {
  redirect("/settings/general/organization-details");
}
