import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function LogoMark(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 12.75C7 9.57 9.57 7 12.75 7H40.5L26.78 20.72H18.5V29h-8.28L24 15.22H12.75A2.25 2.25 0 0 0 10.5 17.5V21H7v-8.25Z"
        className="fill-slate-900"
      />
      <path
        d="M29 22h8.25A3.75 3.75 0 0 1 41 25.75v8.5A6.75 6.75 0 0 1 34.25 41H15v-3.5h19.25a3.25 3.25 0 0 0 3.25-3.25V29H29v-7Z"
        className="fill-brand-700"
      />
    </svg>
  );
}

export function FileStackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M8 3.75h6.5L19.25 8.5V19A1.75 1.75 0 0 1 17.5 20.75h-9A1.75 1.75 0 0 1 6.75 19v-13A2.25 2.25 0 0 1 9 3.75Z" />
      <path d="M14 3.75V9h5.25" />
      <path d="M9 12.25h6" />
      <path d="M9 15.75h6" />
    </svg>
  );
}

export function DocumentCodeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7.75 3.75h7L19.25 8.25V19A1.75 1.75 0 0 1 17.5 20.75h-9A1.75 1.75 0 0 1 6.75 19v-13A2.25 2.25 0 0 1 9 3.75Z" />
      <path d="m10.25 10.75-2 2 2 2" />
      <path d="m13.75 10.75 2 2-2 2" />
    </svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M8.25 7.25V6A2.25 2.25 0 0 1 10.5 3.75h3A2.25 2.25 0 0 1 15.75 6v1.25" />
      <path d="M4.75 8.25h14.5A1.75 1.75 0 0 1 21 10v7.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.5V10a1.75 1.75 0 0 1 1.75-1.75Z" />
      <path d="M3.5 12.25c2.5 1 5.33 1.5 8.5 1.5 3.17 0 6-.5 8.5-1.5" />
    </svg>
  );
}

export function UserShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 12.25A3.25 3.25 0 1 0 12 5.75a3.25 3.25 0 0 0 0 6.5Z" />
      <path d="M6.75 18.5a5.25 5.25 0 0 1 10.5 0" />
      <path d="M18.25 10.25 20.5 11v3.25c0 2.12-1.24 4.04-3.17 4.92l-.58.27-.58-.27A5.43 5.43 0 0 1 13 14.25V11l2.25-.75 1-.25 1 .25Z" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M9.25 11a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" />
      <path d="M15.75 9.75a2.25 2.25 0 1 0 0-4.5" />
      <path d="M4.75 18a4.5 4.5 0 0 1 9 0" />
      <path d="M14.75 18a3.75 3.75 0 0 1 5.5-3.32" />
    </svg>
  );
}

export function LegalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6.75 20.25h10.5" />
      <path d="M8.5 20.25V9.75" />
      <path d="M15.5 20.25V9.75" />
      <path d="M5 9.75h14L12 4 5 9.75Z" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5Zm0 4.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Zm1.1 9.5h-2.2v-5.5h2.2v5.5Z" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 16V7.25" />
      <path d="m8.75 10.5 3.25-3.25 3.25 3.25" />
      <path d="M5.75 18.25h12.5" />
      <path d="M6 20.25h12" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m14.5 6.5-5 5.5 5 5.5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
