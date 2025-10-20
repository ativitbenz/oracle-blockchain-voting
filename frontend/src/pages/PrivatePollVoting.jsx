import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Vote,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  Shield,
  Mail,
  Calendar,
} from "lucide-react";
import { VoteOption } from "../components";
import { Card, CardHeader, CardBody, CardFooter, Button, Badge } from "../ui";
import { usePolls } from "../hooks/usePolls";

/**
 * PrivatePollVoting - หน้าสำหรับการโหวตในโพลส์ส่วนตัว (Private Poll)
 *
 * คุณสมบัติ:
 * - ต้องมี email parameter จาก URL (มาจาก invite link)
 * - ต้องยืนยัน PIN 6 หลักก่อนโหวต
 * - สามารถส่ง PIN ใหม่ได้หากไม่ได้รับ
 * - ตรวจสอบว่าโหวตไปแล้วหรือยัง (ป้องกันการโหวตซ้ำ)
 * - แสดงผลการโหวตหลังจากโหวตหรือโพลส์ปิดแล้ว
 */
export const PrivatePollVoting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const { getPollById, verifyPin, submitVote } = usePolls();

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // PIN verification state
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Voting state
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  useEffect(() => {
    if (!email) {
      alert(
        "Email is required for private poll voting. Please use the invite link sent to your email.",
      );
      navigate("/");
      return;
    }

    const loadPoll = async () => {
      try {
        setLoading(true);
        // Pass email to check if user has already voted
        const foundPoll = await getPollById(id, email);

        // Verify this is a private poll
        if (foundPoll.pollType !== "private") {
          alert("This page is for private polls only.");
          navigate(`/poll/${id}`);
          return;
        }

        setPoll(foundPoll);
      } catch (error) {
        console.error("Error loading poll:", error);
        setPoll(null);
      } finally {
        setLoading(false);
      }
    };
    loadPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, email]);

  const handlePinChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");

    // Only allow 6-digit numbers
    const digitsOnly = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digitsOnly.length > 0) {
      const newPin = ["", "", "", "", "", ""];

      // Fill the PIN array with pasted digits
      for (let i = 0; i < digitsOnly.length; i++) {
        newPin[i] = digitsOnly[i];
      }

      setPin(newPin);

      // Focus on the next empty input or the last one
      const nextIndex = Math.min(digitsOnly.length, 5);
      const nextInput = document.getElementById(`pin-${nextIndex}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyPin = async () => {
    const pinCode = pin.join("");
    if (pinCode.length !== 6) {
      setVerifyError("Please enter a 6-digit PIN");
      return;
    }

    setVerifying(true);
    setVerifyError("");

    try {
      await verifyPin(id, email, pinCode);
      setIsVerified(true);
    } catch (error) {
      setVerifyError(error.message || "Invalid PIN. Please try again.");
      setPin(["", "", "", "", "", ""]);
      document.getElementById("pin-0")?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOption || voteSubmitted) return;

    setSubmitting(true);
    setVoteSubmitted(true);

    try {
      // Submit vote with email (for private polls)
      const result = await submitVote(parseInt(id), selectedOption, email);

      navigate(`/poll/${id}/confirmation`, {
        state: {
          poll: result.poll,
          selectedOption: result.option,
          verification: result.verification,
          email: email, // ส่ง email ไปด้วยเพื่อให้สามารถกลับมาดู result ได้ถูกต้อง
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-600 ml-3">Loading poll...</p>
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

  const showResults = poll.status === "closed" || poll.hasVoted;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </button>

      {/* Poll Information Card */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="space-y-3">
            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info" className="text-xs">
                Private
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
              {/* Email Display */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">Your Email:</span>
                  <span className="text-slate-900">{email}</span>
                </div>
              </div>

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
            </div>
          </CardBody>
        </Card>
      )}

      {/* PIN Verification Card - Show only if not verified */}
      {!isVerified && poll.status === "active" && !poll.hasVoted && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  Verify Your Identity
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Enter the 6-digit PIN sent to your email
                </p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-4 md:p-6">
            {/* Email Display */}
            <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="font-medium">Email:</span>
                <span className="text-slate-900">{email}</span>
              </div>
            </div>

            {/* PIN Input */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                PIN Code (6 digits)
              </label>
              <div className="flex gap-2 justify-center mb-4">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    id={`pin-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    onPaste={(e) => handlePinPaste(e)}
                    className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    disabled={verifying}
                  />
                ))}
              </div>

              {/* Error Message */}
              {verifyError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {verifyError}
                  </p>
                </div>
              )}
            </div>
          </CardBody>

          <CardFooter className="flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              variant="blockchain"
              onClick={handleVerifyPin}
              disabled={pin.join("").length !== 6 || verifying}
              className="w-full md:w-auto"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>Verify PIN</>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Vote Options - Show only after verification */}
      {isVerified && poll.status === "active" && !poll.hasVoted && (
        <>
          {/* Success Banner */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Verified Successfully!</span>
              You can now cast your vote.
            </p>
          </div>

          <Card>
            <CardHeader className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold text-slate-900">
                Cast Your Vote
              </h2>
            </CardHeader>

            <CardBody>
              <div className="space-y-3">
                {poll.options.map((option) => (
                  <VoteOption
                    key={option.id}
                    option={option}
                    isSelected={selectedOption === option.id}
                    onSelect={voteSubmitted ? () => {} : setSelectedOption}
                    showResults={false}
                    totalVotes={poll.totalVotes}
                    disabled={voteSubmitted}
                  />
                ))}
              </div>
            </CardBody>

            <CardFooter className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {voteSubmitted
                  ? "Your vote is being processed..."
                  : selectedOption
                    ? "Ready to submit your vote"
                    : "Select an option to vote"}
              </p>
              <Button
                variant="blockchain"
                disabled={!selectedOption || submitting || voteSubmitted}
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
          </Card>
        </>
      )}

      {/* Show Results if already voted or poll closed */}
      {showResults && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-xl font-semibold text-slate-900">
                Results
              </h2>
              {poll.hasVoted && (
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
                  isSelected={false}
                  onSelect={() => {}}
                  showResults={true}
                  totalVotes={poll.totalVotes}
                  disabled={true}
                />
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Blockchain Info */}
      {(showResults || isVerified) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            All votes are permanently stored in Oracle's blockchain table and
            cannot be modified or deleted. Your identity is verified and tracked
            to prevent duplicate voting.
          </p>
        </div>
      )}
    </div>
  );
};
