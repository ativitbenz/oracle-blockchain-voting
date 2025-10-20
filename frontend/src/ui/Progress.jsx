export const Progress = ({
  value = 0,
  max = 100,
  variant = 'default',
  showLabel = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const variants = {
    default: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${variants[variant]} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-slate-600 text-right">
          {value} / {max} ({percentage.toFixed(0)}%)
        </div>
      )}
    </div>
  )
}
