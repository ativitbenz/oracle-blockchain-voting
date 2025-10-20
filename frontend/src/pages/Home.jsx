import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { PollCard } from "../components";
import { Card, CardBody, Badge } from "../ui";
import { usePolls } from "../hooks/usePolls";

export const Home = () => {
  const { polls, loading } = usePolls();
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Expand/collapse state for each section
  const [expandedSections, setExpandedSections] = useState({
    active: true,
    upcoming: true,
    closed: false,
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVoteClick = (poll) => {
    navigate(`/poll/${poll.id}`);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filter polls by status
  const now = new Date();
  const activePolls = polls.filter((p) => {
    const start = new Date(p.startTime);
    const end = new Date(p.endTime);
    return now >= start && now <= end && p.status === "active";
  });

  const upcomingPolls = polls.filter((p) => {
    const start = new Date(p.startTime);
    return now < start && p.status !== "closed";
  });

  const closedPolls = polls.filter((p) => {
    const end = new Date(p.endTime);
    return p.status === "closed" || now > end;
  });

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section with Real-time Clock */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl shadow-lg border border-slate-100 p-8 md:p-16 text-center">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100 rounded-full opacity-20 blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Time Display - Large */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-3">
              <div className="p-3 bg-white rounded-2xl shadow-md">
                <img
                  src="/assets/blockchain.gif"
                  alt="Blockchain"
                  className="w-10 h-10 md:w-14 md:h-14"
                />
              </div>
              <span className="text-4xl md:text-6xl lg:text-7xl font-bold font-mono bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                {formatTime(currentTime)}
              </span>
            </div>
            <p className="text-sm md:text-lg text-slate-600 font-medium">
              {formatDate(currentTime)}
            </p>
          </div>

          {/* Title and Description */}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Secure, Transparent Voting
          </h2>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Every vote is recorded immutably on Oracle's blockchain table,
            ensuring complete transparency and tamper-proof results.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-slate-600">Loading polls...</p>
        </div>
      ) : (
        <>
          {/* Active Polls Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <button
              onClick={() => toggleSection("active")}
              className="w-full p-5 md:p-7 flex items-center justify-between hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Clock className="w-6 h-6 md:w-7 md:h-7 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-0.5">
                    Active Polls
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500">
                    Polls currently open for voting
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                  {activePolls.length}
                </div>
                {expandedSections.active ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
              </div>
            </button>

            {expandedSections.active && (
              <div className="px-5 pb-5 md:px-7 md:pb-7 pt-0">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5"></div>
                {activePolls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {activePolls.map((poll) => (
                      <PollCard
                        key={poll.id}
                        poll={poll}
                        onVoteClick={handleVoteClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Clock className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm md:text-base">
                      No active polls at the moment.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Polls Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <button
              onClick={() => toggleSection("upcoming")}
              className="w-full p-5 md:p-7 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Calendar className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-0.5">
                    Upcoming Polls
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500">
                    Polls scheduled to start soon
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                  {upcomingPolls.length}
                </div>
                {expandedSections.upcoming ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
              </div>
            </button>

            {expandedSections.upcoming && (
              <div className="px-5 pb-5 md:px-7 md:pb-7 pt-0">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5"></div>
                {upcomingPolls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {upcomingPolls.map((poll) => (
                      <PollCard
                        key={poll.id}
                        poll={poll}
                        onVoteClick={handleVoteClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm md:text-base">
                      No upcoming polls scheduled.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Closed Polls Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <button
              onClick={() => toggleSection("closed")}
              className="w-full p-5 md:p-7 flex items-center justify-between hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-transparent transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                  <CheckCircle className="w-6 h-6 md:w-7 md:h-7 text-slate-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-0.5">
                    Closed Polls
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500">
                    Polls that have ended
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full font-bold text-sm">
                  {closedPolls.length}
                </div>
                {expandedSections.closed ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
              </div>
            </button>

            {expandedSections.closed && (
              <div className="px-5 pb-5 md:px-7 md:pb-7 pt-0">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5"></div>
                {closedPolls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {closedPolls.map((poll) => (
                      <PollCard
                        key={poll.id}
                        poll={poll}
                        onVoteClick={handleVoteClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm md:text-base">
                      No closed polls yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
