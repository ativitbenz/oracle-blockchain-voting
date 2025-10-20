import { Check } from "lucide-react";
import { Card, CardBody, Progress } from "../ui";

export const VoteOption = ({
  option,
  isSelected,
  onSelect,
  showResults = false,
  totalVotes = 0,
  disabled = false,
}) => {
  const percentage =
    totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0;

  return (
    <Card
      hover={!disabled && !showResults}
      onClick={() => !disabled && !showResults && onSelect(option.id)}
      className={`transition-all ${
        isSelected ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50" : ""
      } ${
        disabled && !showResults
          ? "opacity-60 cursor-not-allowed bg-slate-50"
          : disabled || showResults
            ? "cursor-default"
            : "cursor-pointer"
      }`}
    >
      <CardBody className="p-3 md:p-4">
        <div className="flex items-start gap-2 md:gap-3">
          {/* Radio button */}
          {!showResults && (
            <div
              className={`flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
              } ${disabled ? "opacity-50" : ""}`}
            >
              {isSelected && (
                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm md:text-base text-slate-900 mb-1 md:mb-2">
              {option.name}
            </h4>

            {option.description && (
              <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-3">
                {option.description}
              </p>
            )}

            {showResults && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="text-slate-600">
                    {option.votes?.toLocaleString() || 0} votes
                  </span>
                  <span className="font-semibold text-slate-900">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={option.votes || 0}
                  max={totalVotes}
                  variant="default"
                />
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
