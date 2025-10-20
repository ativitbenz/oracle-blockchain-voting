export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed',
    secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed',
    blockchain: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 focus:ring-emerald-500 disabled:bg-emerald-300 disabled:cursor-not-allowed',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
