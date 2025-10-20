import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Vote,
  Users,
  Clock,
  AlertCircle,
  Loader2,
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

export const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPollById, submitVote } = usePolls();
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        setPoll(foundPoll);

        // Check if already voted in localStorage (for public polls)
        if (foundPoll?.pollType === "public") {
          const votedLocally = checkLocalVoteStatus(id);
          setHasVotedLocally(votedLocally);
        }
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

    // Check if this is a private poll
    if (poll.pollType === "private") {
      alert(
        "This is a private poll. Please use the invite link sent to your email.",
      );
      return;
    }

    // Prevent duplicate vote for public polls (check localStorage)
    if (poll.pollType === "public" && hasVotedLocally) {
      alert("You have already voted in this poll.");
      return;
    }

    setSubmitting(true);
    try {
      // Submit vote using shared state (no email for public polls)
      const result = await submitVote(parseInt(id), selectedOption, null);

      // Mark as voted in localStorage for public polls
      if (poll.pollType === "public") {
        markAsVotedLocally(id);
      }

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
    poll.status === "closed" ||
    poll.hasVoted ||
    (poll.pollType === "public" && hasVotedLocally);

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
          <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-slate-900 mb-2">
                {poll.title}
              </h1>
              <p className="text-sm text-slate-600">{poll.description}</p>
            </div>
            <Badge
              variant={poll.status === "active" ? "success" : "error"}
              className="mt-1 md:mt-0 text-xs"
            >
              {poll.status === "active" ? "Active" : "Closed"}
            </Badge>
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

      {/* Vote Options */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-xl font-semibold text-slate-900">
              {showResults ? "Results" : "Cast Your Vote"}
            </h2>
            {poll.pollType === "public" && hasVotedLocally && (
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
                onSelect={setSelectedOption}
                showResults={showResults}
                totalVotes={poll.totalVotes}
                disabled={poll.status !== "active"}
              />
            ))}
          </div>
        </CardBody>

        {poll.status === "active" &&
          !poll.hasVoted &&
          !(poll.pollType === "public" && hasVotedLocally) && (
            <CardFooter className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {selectedOption
                  ? "Ready to submit your vote"
                  : "Select an option to vote"}
              </p>
              <Button
                variant="blockchain"
                disabled={!selectedOption || submitting}
                onClick={handleSubmitVote}
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

      {/* Blockchain Info for closed polls */}
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
