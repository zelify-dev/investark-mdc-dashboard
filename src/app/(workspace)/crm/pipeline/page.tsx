import { redirect } from "next/navigation";

export default function CrmPipelineRedirectPage() {
  redirect("/mdc?tab=applications");
}
