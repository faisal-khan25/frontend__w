export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <Icon size={22} className="text-primary-400" />
        </div>
      )}
      <p className="font-display font-bold text-ink text-base">{title}</p>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
