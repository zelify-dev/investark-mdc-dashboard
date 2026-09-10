type AppAvatarProps = {
  initials: string;
  className?: string;
  /** Si es URL http(s), se muestra la imagen; si no, iniciales. */
  src?: string | null;
  alt?: string;
};

export function AppAvatar({ initials, className, src, alt }: AppAvatarProps) {
  const classes = ["zelify-avatar", className ?? ""].filter(Boolean).join(" ");

  if (src) {
    return (
      <span className={classes} style={{ overflow: "hidden", padding: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || initials}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </span>
    );
  }

  return <span className={classes}>{initials}</span>;
}
