import type { ReactNode } from "react";

import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";

type ProfileTriggerProps = {
  name: string;
  initials: string;
  trailingIcon?: ReactNode;
};

export function ProfileTrigger({
  name,
  initials,
  trailingIcon,
}: ProfileTriggerProps) {
  return (
    <button type="button" className="zelify-profile-trigger">
      <AppAvatar initials={initials} className="zelify-profile-trigger__avatar" />
      <span className="zelify-profile-trigger__meta">
        <strong>{name}</strong>
      </span>
      {trailingIcon}
    </button>
  );
}
