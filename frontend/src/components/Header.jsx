import { Vote, LayoutDashboard, Database } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2">
              <img
                src="/assets/firstlogic-logo.svg"
                alt="First Logic"
                className="w-7 h-7 md:w-10 md:h-10"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Blockchain Voting
              </h1>
              <p className="text-xs text-slate-500">
                Powered by Oracle Blockchain
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              to="/"
              className={`group flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                isActive("/")
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Vote
                className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isActive("/") ? "" : "group-hover:scale-110"}`}
              />
              <span className="hidden sm:inline text-sm md:text-base">
                Polls
              </span>
            </Link>

            <Link
              to="/blockchain"
              className={`group flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                isActive("/blockchain")
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Database
                className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isActive("/blockchain") ? "" : "group-hover:scale-110"}`}
              />
              <span className="hidden sm:inline text-sm md:text-base">
                Blockchain
              </span>
            </Link>

            <Link
              to="/admin"
              className={`group flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                isActive("/admin")
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard
                className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isActive("/admin") ? "" : "group-hover:scale-110"}`}
              />
              <span className="hidden sm:inline text-sm md:text-base">
                Admin
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
