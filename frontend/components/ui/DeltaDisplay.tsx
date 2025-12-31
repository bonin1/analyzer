interface DeltaDisplayProps {
  value: number | null;
  percentage: number | null;
  label: string;
  format?: 'currency' | 'number' | 'percentage';
}

export default function DeltaDisplay({ 
  value, 
  percentage, 
  label,
  format = 'currency'
}: DeltaDisplayProps) {
  // Handle null values (no prior year data)
  if (value === null || percentage === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{label}:</span>
        <span className="text-sm text-gray-400">N/A</span>
      </div>
    );
  }
  
  const isPositive = percentage > 0;
  const isNeutral = percentage === 0;
  
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    } else if (format === 'number') {
      return new Intl.NumberFormat('en-US').format(val);
    } else {
      return `${val.toFixed(2)}%`;
    }
  };

  const getColorClass = () => {
    if (isNeutral) return 'text-gray-600';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getIcon = () => {
    if (isNeutral) return '→';
    return isPositive ? '↑' : '↓';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <span className={`text-sm font-semibold ${getColorClass()}`}>
        {getIcon()} {formatValue(Math.abs(value))} ({Math.abs(percentage).toFixed(1)}%)
      </span>
    </div>
  );
}
