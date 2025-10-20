import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, Vote, ArrowLeft, BarChart3 } from "lucide-react";
import { BlockchainVerification } from "../components";
import { Card, CardBody, Button } from "../ui";

export const VoteConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { poll, selectedOption, verification, email } = location.state || {};

  if (!poll || !selectedOption || !verification) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          Invalid Access
        </h2>
        <p className="text-slate-600 mb-6">
          Please vote through the poll page.
        </p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  // Debug: ตรวจสอบค่าที่ได้รับ
  console.log("VoteConfirmation - Poll Type:", poll.pollType);
  console.log("VoteConfirmation - Email:", email);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Success Card */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardBody className="text-center p-6 md:py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-emerald-500 rounded-full mb-3 md:mb-4">
            <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 mb-2 md:mb-3">
            Vote Recorded Successfully!
          </h1>
          <p className="text-emerald-700 text-base md:text-lg">
            Your vote has been securely stored on the blockchain
          </p>
        </CardBody>
      </Card>

      {/* Vote Summary */}
      <Card>
        <CardBody className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 md:mb-4">
            Vote Summary
          </h2>
          <div className="space-y-3 text-sm md:text-base">
            <div>
              <p className="text-xs md:text-sm text-slate-600 mb-1">Poll</p>
              <p className="font-semibold text-slate-900">{poll.title}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-slate-600 mb-1">
                You chose
              </p>
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <p className="font-semibold text-slate-900">
                  {selectedOption.name}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Blockchain Verification */}
      <BlockchainVerification verification={verification} />

      {/* What Happens Next */}
      <Card>
        <CardBody className="p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3">
            What Happens Next?
          </h3>
          <ul className="space-y-2 text-sm md:text-base text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>
                Your vote is now permanently recorded in the Oracle blockchain
                table
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>
                The vote cannot be modified or deleted by anyone, including
                administrators
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>
                You can verify your vote anytime using the Vote ID provided
                above
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>
                Poll results will update in real-time as more votes are cast
              </span>
            </li>
          </ul>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-3 justify-center items-center">
        <Button
          variant="blockchain"
          onClick={() => {
            // Navigate to the correct page based on poll type
            if (poll.pollType === "private") {
              // สำหรับ private poll ต้องใช้ email parameter
              if (email) {
                navigate(`/vote/${poll.id}?email=${encodeURIComponent(email)}`);
              } else {
                // ถ้าไม่มี email ให้กลับไปหน้าแรก
                alert(
                  "Session expired. Please use the invite link from your email.",
                );
                navigate("/");
              }
            } else {
              // สำหรับ public poll ไปที่ /poll/:id แทน
              navigate(`/poll/${poll.id}`);
            }
          }}
          className="w-full md:w-auto"
        >
          View Results
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/")}
          className="w-full md:w-auto"
        >
          <ArrowLeft className="w-5 h-5 inline mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};
