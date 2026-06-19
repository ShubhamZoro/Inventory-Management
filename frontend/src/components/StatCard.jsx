export default function StatCard({ value, label, icon: Icon, color = '#6366f1', gradient }) {
  return (
    <div
      className="stat-card"
      style={{ '--card-gradient': gradient || `linear-gradient(90deg, ${color}, ${color}88)` }}
    >
      <div
        className="stat-icon-wrap"
        style={{ background: `${color}22`, color }}
      >
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
