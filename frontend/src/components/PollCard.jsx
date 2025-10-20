import { useState, useEffect } from "react";
import { Vote, Clock, Users, Lock, Globe } from "lucide-react";
import { Card, CardBody, CardFooter, Badge, Button } from "../ui";

export const PollCard = ({ poll, onVoteClick }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [hasVotedLocally, setHasVotedLocally] = useState(false);

  // Check if user has voted in localStorage (for public polls)
  useEffect(() => {
    if (poll.pollType === "public") {
      try {
        const votedKey = `voted_poll_${poll.id}`;
        const hasVoted = localStorage.getItem(votedKey) === "true";
        setHasVotedLocally(hasVoted);
      } catch (error) {
        console.error("Error checking localStorage:", error);
        setHasVotedLocally(false);
      }
    }
  }, [poll.id, poll.pollType]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Check if poll is closed
      if (poll.status === "closed") {
        setTimeLeft("Voting closed");
        setTimeLeftMs(0);
        return;
      }

      // Check if poll is upcoming (hasn't started yet)
      if (poll.startTime) {
        const start = new Date(poll.startTime);
        const end = new Date(poll.endTime);

        // If poll hasn't started yet
        if (now < start) {
          const diff = start - now;
          setTimeLeftMs(diff);

          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          if (days > 0) {
            setTimeLeft(`Starts in ${days}d ${hours}h ${minutes}m ${seconds}s`);
          } else if (hours > 0) {
            setTimeLeft(`Starts in ${hours}h ${minutes}m ${seconds}s`);
          } else if (minutes > 0) {
            setTimeLeft(`Starts in ${minutes}m ${seconds}s`);
          } else {
            setTimeLeft(`Starts in ${seconds}s`);
          }
          return;
        }

        // If poll is active (between start and end time)
        if (now >= start && now <= end) {
          const diff = end - now;

          if (diff <= 0) {
            setTimeLeft("Voting closed");
            setTimeLeftMs(0);
            return;
          }

          setTimeLeftMs(diff);

          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s remaining`);
          } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
          } else if (minutes > 0) {
            setTimeLeft(`${minutes}m ${seconds}s remaining`);
          } else {
            setTimeLeft(`${seconds}s remaining`);
          }
          return;
        }

        // If poll has ended
        if (now > end) {
          setTimeLeft("Voting closed");
          setTimeLeftMs(0);
          return;
        }
      }

      // Fallback for polls without proper time data
      if (!poll.endTime) {
        setTimeLeft("Time not set");
        setTimeLeftMs(0);
        return;
      }

      const end = new Date(poll.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Voting closed");
        setTimeLeftMs(0);
        return;
      }

      setTimeLeftMs(diff);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeLeft(`${seconds}s remaining`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [poll.endTime, poll.startTime, poll.status]);

  // Check if time is critical (less than 2 hours)
  const isCritical = timeLeftMs > 0 && timeLeftMs <= 2 * 60 * 60 * 1000;

  // Check if poll is upcoming (shows "Starts in")
  const isUpcoming = timeLeft.startsWith("Starts in");

  const getTimeStyle = () => {
    if (isUpcoming) {
      return "text-green-600 font-semibold";
    }
    if (!isCritical) {
      return "text-slate-500";
    }
    return "text-red-600 font-semibold animate-pulse";
  };

  const getStatusBadge = () => {
    if (poll.status === "active") {
      return (
        <Badge variant="success" size="sm">
          Active
        </Badge>
      );
    }
    if (poll.status === "closed") {
      return (
        <Badge variant="error" size="sm">
          Closed
        </Badge>
      );
    }
    return (
      <Badge variant="warning" size="sm">
        Upcoming
      </Badge>
    );
  };

  const isPrivatePoll = poll.pollType === "private";
  const hasVoted =
    poll.hasVoted || (poll.pollType === "public" && hasVotedLocally);

  return (
    <div className="group h-full flex flex-col relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300">
      {/* Background decoration for private polls */}
      {isPrivatePoll && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lock className="w-32 h-32 md:w-40 md:h-40 text-slate-200 opacity-80" />
        </div>
      )}

      <div className="flex-1 p-4 md:p-6 relative z-10">
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="text-base md:text-lg font-bold text-slate-900 line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
            {poll.title}
          </h3>
          <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-slate-600 mb-4 md:mb-6 line-clamp-2 leading-relaxed">
          {poll.description}
        </p>

        {/* Stats */}
        <div className="flex flex-col gap-2.5 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-600" />
            </div>
            <span className="font-medium">
              {poll.totalVotes?.toLocaleString() || 0} votes
            </span>
          </div>
          <div className={`flex items-center gap-2 ${getTimeStyle()}`}>
            <div
              className={`p-1.5 rounded-lg ${isUpcoming ? "bg-green-100" : isCritical ? "bg-red-100" : "bg-slate-100"}`}
            >
              <Clock
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isUpcoming ? "text-green-600" : isCritical ? "text-red-600" : "text-slate-600"}`}
              />
            </div>
            <span className="font-mono text-xs md:text-sm font-medium">
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 md:p-6 pt-0 relative z-10">
        <button
          className={`w-full px-4 py-2.5 md:py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
            ${
              isPrivatePoll || poll.status !== "active"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            }`}
          disabled={isPrivatePoll || poll.status !== "active"}
          onClick={() => onVoteClick(poll)}
        >
          <Vote className="w-4 h-4 md:w-5 md:h-5" />
          {hasVoted ? "View Results" : "Vote Now"}
        </button>
      </div>
    </div>
  );
};
