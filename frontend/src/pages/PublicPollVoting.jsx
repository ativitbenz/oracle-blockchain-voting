import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Vote,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  Globe,
  Calendar,
} from "lucide-react";
import { VoteOption } from "../components";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Badge,
  Spinner,
} from "../ui";
import { usePolls } from "../hooks/usePolls";

/**
 * PublicPollVoting - หน้าโหวตสำหรับ Public Poll (ไม่ต้อง verify PIN)
 * URL: /poll/:id
 * Features:
 * - ไม่ต้องใส่ email หรือ PIN
 * - โหวตแบบ anonymous
 * - เหมาะสำหรับ community poll, survey
 */
export const PublicPollVoting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPollById, submitVote } = usePolls();

  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [hasVotedLocally, setHasVotedLocally] = useState(false);

  // Check if user has voted in localStorage
  const checkLocalVoteStatus = (pollId) => {
    try {
      const votedKey = `voted_poll_${pollId}`;
      const hasVoted = localStorage.getItem(votedKey) === "true";
      return hasVoted;
    } catch (error) {
      console.error("Error checking localStorage:", error);
      return false;
    }
  };

  // Mark poll as voted in localStorage
  const markAsVotedLocally = (pollId) => {
    try {
      const votedKey = `voted_poll_${pollId}`;
      localStorage.setItem(votedKey, "true");
      setHasVotedLocally(true);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  useEffect(() => {
    const loadPoll = async () => {
      try {
        setLoading(true);
        const foundPoll = await getPollById(id);

        if (foundPoll.pollType === "private") {
          alert(
            "This is a private poll. Please use the invite link sent to your email.",
          );
          navigate("/");
          return;
        }

        setPoll(foundPoll);

        // Check if already voted in localStorage
        const votedLocally = checkLocalVoteStatus(id);
        setHasVotedLocally(votedLocally);
      } catch (error) {
        console.error("Error loading poll:", error);
        setPoll(null);
      } finally {
        setLoading(false);
      }
    };
    loadPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmitVote = async () => {
    if (!selectedOption) return;

    // ป้องกันไม่ให้โหวต Private Poll ผ่านหน้านี้
    if (poll.pollType === "private") {
      alert(
        "This is a private poll. Please use the invite link sent to your email.",
      );
      return;
    }

    // ป้องกันการ vote ซ้ำ (check localStorage)
    if (hasVotedLocally) {
      alert("You have already voted in this poll.");
      return;
    }

    setSubmitting(true);
    setVoteSubmitted(true);

    try {
      // Submit vote without email (public poll)
      const result = await submitVote(parseInt(id), selectedOption, null);

      // Mark as voted in localStorage
      markAsVotedLocally(id);

      navigate(`/poll/${id}/confirmation`, {
        state: {
          poll: result.poll,
          selectedOption: result.option,
          verification: result.verification,
        },
      });
    } catch (error) {
      console.error("Vote submission error:", error);
      alert(error.message || "Failed to submit vote");
      setSubmitting(false);
      setVoteSubmitted(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Poll Not Found
        </h2>
        <p className="text-slate-600 mb-6">
          The poll you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  const showResults =
    poll.status === "closed" || poll.hasVoted || hasVotedLocally;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Polls
      </button>

      {/* Poll Information Card */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="space-y-3">
            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info" className="text-xs">
                Public
              </Badge>
              <Badge
                variant={
                  poll.status === "active"
                    ? "success"
                    : poll.status === "upcoming"
                      ? "warning"
                      : "error"
                }
                className="text-xs"
              >
                {poll.status === "active"
                  ? "Active"
                  : poll.status === "upcoming"
                    ? "Upcoming"
                    : "Closed"}
              </Badge>
            </div>

            {/* Title and Description */}
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-2">
                {poll.title}
              </h1>
              <p className="text-sm text-slate-600">{poll.description}</p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="border-t border-slate-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-slate-900">
                {poll.totalVotes.toLocaleString()}
              </span>
              <span>total votes</span>
            </div>
            {poll.timeRemaining && (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>
                  {poll.status === "active"
                    ? `Ends in ${poll.timeRemaining}`
                    : "Voting closed"}
                </span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Upcoming Poll Card - Show if poll hasn't started yet */}
      {poll.status === "upcoming" && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 md:p-6 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 rounded-full">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  Poll Not Started Yet
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  This poll will open for voting soon
                </p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-4 md:p-6">
            <div className="space-y-4">
              {/* Poll Schedule */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Voting Schedule
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-blue-800 min-w-[80px]">
                      Starts:
                    </span>
                    <span className="text-blue-900">
                      {new Date(poll.startTime).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-blue-800 min-w-[80px]">
                      Ends:
                    </span>
                    <span className="text-blue-900">
                      {new Date(poll.endTime).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  What to do next:
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-1">•</span>
                    <span>Come back when voting opens to cast your vote</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-1">•</span>
                    <span>
                      This is a public poll - no authentication required
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-1">•</span>
                    <span>Bookmark this page to return when voting starts</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Vote Options */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-xl font-semibold text-slate-900">
              {showResults ? "Results" : "Cast Your Vote"}
            </h2>
            {hasVotedLocally && (
              <Badge variant="success" className="text-xs">
                You have voted
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardBody>
          <div className="space-y-3">
            {poll.options.map((option) => (
              <VoteOption
                key={option.id}
                option={option}
                isSelected={selectedOption === option.id}
                onSelect={voteSubmitted ? () => {} : setSelectedOption}
                showResults={showResults}
                totalVotes={poll.totalVotes}
                disabled={poll.status !== "active" || voteSubmitted}
              />
            ))}
          </div>
        </CardBody>

        {poll.status === "active" && !poll.hasVoted && !hasVotedLocally && (
          <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex-1">
              {selectedOption ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Ready to submit your vote
                  </p>
                  <p className="text-xs text-slate-600">
                    Your vote will be permanently recorded on the blockchain
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Select an option to vote
                </p>
              )}
            </div>
            <Button
              variant="blockchain"
              disabled={!selectedOption || submitting || voteSubmitted}
              onClick={handleSubmitVote}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Vote className="w-5 h-5 inline mr-2" />
                  Submit Vote
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Blockchain Info */}
      {showResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            All votes are permanently stored in Oracle's blockchain table. View
            individual vote verification in the confirmation page.
          </p>
        </div>
      )}
    </div>
  );
};
