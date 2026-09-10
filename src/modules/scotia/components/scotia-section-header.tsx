export function ScotiaSectionHeader({
  badge,
  title,
  subtitle,
  metric,
  metricLabel,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  metric?: string;
  metricLabel?: string;
}) {
  return (
    <header className="scotia-section-header">
      <div>
        <span className="scotia-section-header__badge">{badge}</span>
        <h2 className="scotia-section-header__title">{title}</h2>
        {subtitle && <p className="scotia-section-header__subtitle">{subtitle}</p>}
      </div>
      {metric && (
        <div className="scotia-section-header__metric">
          <span>{metricLabel}</span>
          <strong>{metric}</strong>
        </div>
      )}
    </header>
  );
}

export function displayClientId(id: string): string {
  return id.replace("-DEMO", "");
}
