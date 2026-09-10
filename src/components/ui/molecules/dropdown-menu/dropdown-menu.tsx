import Link from "next/link";

export type DropdownMenuItem =
  | string
  | {
      label: string;
      href?: string;
      onClick?: () => void;
    };

type DropdownMenuProps = {
  items: DropdownMenuItem[];
  className?: string;
};

export function DropdownMenu({ items, className }: DropdownMenuProps) {
  const classes = ["zelify-dropdown-menu", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="menu">
      {items.map((item, index) => {
        const entry = typeof item === "string" ? { label: item } : item;
        const key = `${entry.label}-${index}`;

        if (entry.href) {
          return (
            <Link key={key} href={entry.href} role="menuitem" className="zelify-dropdown-menu__item">
              {entry.label}
            </Link>
          );
        }

        return (
          <button key={key} type="button" role="menuitem" className="zelify-dropdown-menu__item" onClick={entry.onClick}>
            {entry.label}
          </button>
        );
      })}
    </div>
  );
}
