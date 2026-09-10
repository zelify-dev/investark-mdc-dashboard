import { cn } from "@/lib/utils";
import { type HTMLInputTypeAttribute, useId } from "react";

type InputGroupProps = {
  className?: string;
  label: string;
  placeholder: string;
  type: HTMLInputTypeAttribute;
  /** Campos más simples: borde fino, sin asterisco rojo, tipografía compacta (p. ej. login). */
  variant?: "default" | "minimal";
  fileStyleVariant?: "style1" | "style2";
  required?: boolean;
  disabled?: boolean;
  active?: boolean;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  endAdornment?: React.ReactNode;
  height?: "sm" | "default";
  defaultValue?: string;
  customInputClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const InputGroup: React.FC<InputGroupProps> = ({
  className,
  label,
  type,
  placeholder,
  variant = "default",
  required,
  disabled,
  active,
  handleChange,
  icon,
  iconPosition,
  endAdornment,
  height,
  fileStyleVariant,
  customInputClassName,
  ...restProps
}) => {
  const id = useId();
  const minimal = variant === "minimal";
  const iconOnLeft = iconPosition === "left";
  const iconOnRight = Boolean(icon) && !iconOnLeft;
  const hasEnd = Boolean(endAdornment);

  return (
    <div className={cn(minimal && "space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          minimal
            ? "block text-xs font-medium text-dark-6 dark:text-slate-400"
            : "text-body-sm font-medium text-dark dark:text-white",
        )}
      >
        {label}
        {required && !minimal && <span className="ml-1 select-none text-red">*</span>}
      </label>

      <div className={cn("relative", !minimal && "mt-3")}>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          onChange={handleChange}
          className={cn(
            minimal &&
              type !== "file" &&
              "w-full rounded-lg border-[0.5px] border-slate-300/50 bg-white/25 px-3.5 py-2.5 text-sm text-dark shadow-none outline-none ring-0 transition placeholder:text-dark-6/55 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white dark:placeholder:text-slate-500/75 dark:focus:border-primary/50 dark:focus:ring-primary/15",
            !minimal &&
              "w-full rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition focus:border-primary disabled:cursor-default disabled:bg-gray-2 data-[active=true]:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary dark:disabled:bg-dark dark:data-[active=true]:border-primary",
            type === "file"
              ? getFileStyles(fileStyleVariant!)
              : !minimal && "px-5.5 py-3 text-dark placeholder:text-dark-6 dark:text-white",
            type !== "file" && !minimal && iconOnLeft && "pl-12.5",
            type !== "file" && !minimal && iconOnRight && !hasEnd && "pr-12.5",
            type !== "file" && !minimal && iconOnRight && hasEnd && "pr-[4.25rem]",
            type !== "file" && !minimal && iconOnLeft && hasEnd && "pr-11",
            type !== "file" && !minimal && !icon && hasEnd && "pr-11",
            type !== "file" && minimal && hasEnd && "pr-11",
            height === "sm" && !minimal && "py-2.5",
            customInputClassName
          )}
          required={required}
          disabled={disabled}
          data-active={active}
          {...restProps}
        />

        {icon && (
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-dark-5",
              iconOnLeft ? "left-4.5" : "right-4.5"
            )}
          >
            {icon}
          </span>
        )}
        {endAdornment && (
          <span className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-dark-5">{endAdornment}</span>
        )}
      </div>
    </div>
  );
};

export default InputGroup;

function getFileStyles(variant: "style1" | "style2") {
  switch (variant) {
    case "style1":
      return `file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-[#E2E8F0] file:px-6.5 file:py-[13px] file:text-body-sm file:font-medium file:text-dark-5 file:hover:bg-primary file:hover:bg-opacity-10 dark:file:border-dark-3 dark:file:bg-white/30 dark:file:text-white`;
    default:
      return `file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-stroke file:px-2.5 file:py-1 file:text-body-xs file:font-medium file:text-dark-5 file:focus:border-primary dark:file:border-dark-3 dark:file:bg-white/30 dark:file:text-white px-3 py-[9px]`;
  }
}
