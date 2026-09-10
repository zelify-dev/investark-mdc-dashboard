type BreadcrumbProps = {
  title: string;
};

export function Breadcrumb({ title }: BreadcrumbProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Onboarding empresarial
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
      </div>
      <div className="hidden text-sm text-slate-500 md:block">
        Onboarding / <span className="font-semibold text-slate-900">{title}</span>
      </div>
    </div>
  );
}
