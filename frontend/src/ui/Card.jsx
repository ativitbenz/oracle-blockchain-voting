export const Card = ({
  children,
  className = "",
  hover = false,
  onClick,
  ...props
}) => {
  const baseStyles = "bg-white rounded-2xl shadow-sm border border-slate-100";
  const hoverStyles = hover
    ? "hover:shadow-lg hover:border-slate-200 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
    : "";

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => {
  return (
    <div
      className={`p-5 md:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white ${className}`}
    >
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = "" }) => {
  return <div className={`p-5 md:p-6 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = "" }) => {
  return (
    <div
      className={`p-5 md:p-6 border-t border-slate-100 bg-gradient-to-r from-white to-slate-50 ${className}`}
    >
      {children}
    </div>
  );
};
