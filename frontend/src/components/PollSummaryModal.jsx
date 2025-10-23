import { useState, useEffect } from "react";
import {
  BarChart3,
  AlertCircle,
  FileText,
  Crown,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button, Badge, Spinner, Modal } from "../ui";
import { usePolls } from "../hooks/usePolls";
import * as api from "../services/api";

export const PollSummaryModal = ({ pollId, isOpen, onClose }) => {
  const { getPollById, resendPin } = usePolls();
  const [poll, setPoll] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(null);

  useEffect(() => {
    if (!isOpen || !pollId) return;

    const loadPoll = async () => {
      try {
        setLoading(true);
        const foundPoll = await getPollById(pollId);
        setPoll(foundPoll);

        // Load recipients if private poll
        if (foundPoll?.pollType === "private") {
          const recipientsList = await api.getPollRecipients(pollId);
          setRecipients(recipientsList);
        }
      } catch (error) {
        console.error("Error loading poll:", error);
        setPoll(null);
      } finally {
        setLoading(false);
      }
    };
    loadPoll();
  }, [isOpen, pollId]);

  const handleResendPin = async (email) => {
    try {
      setResendingEmail(email);
      await resendPin(pollId, email);
      alert("PIN resent successfully!");
    } catch (error) {
      console.error("Error resending PIN:", error);
      alert("Failed to resend PIN: " + error.message);
    } finally {
      setResendingEmail(null);
    }
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return ((votes / total) * 100).toFixed(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "closed":
        return "error";
      default:
        return "warning";
    }
  };

  const getWinner = () => {
    if (!poll?.options || poll.options.length === 0) return null;

    // Find the maximum votes
    const maxVotes = Math.max(...poll.options.map((opt) => opt.votes || 0));

    // If no votes at all, no winner
    if (maxVotes === 0) return null;

    // Find all options with the maximum votes
    const winners = poll.options.filter((opt) => (opt.votes || 0) === maxVotes);

    // If there's a tie (more than one winner), return null
    if (winners.length > 1) return null;

    // Return the single winner
    return winners[0];
  };

  const modalTitle = poll ? (
    <div className="flex items-center justify-between w-full gap-3">
      <span className="flex-1">Poll Summary Results</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {(() => {
          const winner = getWinner();
          return (
            winner && (
              <Badge variant="success" size="sm" className="text-xs">
                <Crown className="w-3 h-3 inline mr-1" />
                <span className="max-w-[100px] sm:max-w-[150px] truncate inline-block align-middle">
                  Winner: {winner.name}
                </span>
              </Badge>
            )
          );
        })()}
        <Badge
          variant={getStatusColor(poll.status)}
          size="sm"
          className="text-xs"
        >
          {poll.status || "Unknown"}
        </Badge>
      </div>
    </div>
  ) : (
    "Poll Summary Results"
  );

  const modalFooter = (
    <Button
      variant="secondary"
      onClick={onClose}
      className="text-xs md:text-sm px-3 md:px-4"
    >
      Close
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={modalFooter}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <Spinner size="lg sm:xl" />
        </div>
      ) : !poll ? (
        <div className="text-center py-8 sm:py-12">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
            Poll Not Found
          </h3>
          <p className="text-sm sm:text-base text-slate-600">
            The poll you're looking for doesn't exist.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Vote Distribution */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base"></h4>
            <div className="space-y-2 sm:space-y-3">
              {poll.options?.map((option) => {
                const votes = option.votes || 0;
                const percentage = calculatePercentage(
                  votes,
                  poll.totalVotes || 0,
                );
                const isWinner = getWinner()?.id === option.id;

                return (
                  <div
                    key={option.id}
                    className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-xs sm:text-sm">
                          {option.name}
                        </span>
                        {isWinner && (
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <span className="font-semibold text-slate-900">
                          {votes.toLocaleString()} votes
                        </span>
                        <span className="text-slate-600">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          isWinner ? "bg-emerald-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Poll Information */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-sm sm:text-base">Poll Information</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Poll Title
                </label>
                <div className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="w-full bg-transparent text-xs sm:text-sm text-slate-900">
                    {poll.title || "No title"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <div className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="w-full bg-transparent text-xs sm:text-sm text-slate-900 min-h-[40px] sm:min-h-[60px]">
                    {poll.description || "No description"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Poll Statistics */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span className="text-sm sm:text-base">Statistics</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <span className="text-xs font-medium">Total Votes</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  {poll.totalVotes?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <span className="text-xs font-medium">Options</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  {poll.options?.length || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <span className="text-xs font-medium">Created</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {poll.createdAt || "N/A"}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <span className="text-xs font-medium">Type</span>
                </div>
                <Badge
                  variant={poll.pollType === "private" ? "warning" : "info"}
                  size="sm"
                  className="text-xs"
                >
                  {poll.pollType || "public"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Recipients Section (for private polls only) */}
          {poll.pollType === "private" && recipients.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <span className="text-sm sm:text-base">Recipients Status</span>
                <Badge variant="info" size="sm" className="ml-2">
                  {recipients.filter((r) => r.hasVoted).length} /{" "}
                  {recipients.length} voted
                </Badge>
              </h4>
              <div className="space-y-2">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {recipient.hasVoted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm text-slate-900 truncate">
                          {recipient.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={recipient.hasVoted ? "success" : "warning"}
                          size="sm"
                          className="text-xs"
                        >
                          {recipient.hasVoted ? "Voted" : "Pending"}
                        </Badge>
                        {!recipient.hasVoted && (
                          <div className="relative group">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleResendPin(recipient.email)}
                              disabled={
                                resendingEmail === recipient.email ||
                                poll.status === "closed"
                              }
                              className="text-xs px-2 py-1 flex items-center"
                            >
                              {resendingEmail === recipient.email ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Sending...
                                </>
                              ) : poll.status === "closed" ? (
                                "Poll Closed"
                              ) : (
                                "Resend"
                              )}
                            </Button>
                            {resendingEmail !== recipient.email && (
                              <div className="absolute hidden group-hover:block bg-slate-900 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-20">
                                {poll.status === "closed"
                                  ? "Cannot resend - Poll is closed"
                                  : "Resend PIN to email"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
