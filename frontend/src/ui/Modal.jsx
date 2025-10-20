export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-3xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 border border-slate-100`}
        >
          {/* Header */}
          {title && (
            <div className="relative overflow-hidden flex items-center p-5 md:p-7 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-slate-50 to-white rounded-t-3xl">
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {title}
              </h3>
            </div>
          )}

          {/* Body */}
          <div className="p-5 md:p-7 overflow-y-auto custom-scrollbar">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-5 md:p-7 border-t border-slate-100 flex-shrink-0 bg-gradient-to-r from-white to-slate-50 rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
