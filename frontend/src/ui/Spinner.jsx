export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  }

  return (
    <div className={`inline-block ${sizes[size]} border-slate-200 border-t-slate-900 rounded-full animate-spin ${className}`} />
  )
}

export const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Spinner size="xl" />
      <p className="mt-4 text-slate-600">{message}</p>
    </div>
  )
}
