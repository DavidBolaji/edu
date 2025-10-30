interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export const EmptyState = ({ title, subtitle }: EmptyStateProps) => (
  <div className="text-center text-gray-400">
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="text-sm">{subtitle}</p>
  </div>
);
