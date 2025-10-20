import { useState, useRef } from "react";
import {
  Plus,
  Vote,
  Users,
  BarChart3,
  Shield,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { PollCreationForm, PollSummaryModal } from "../components";
import { Badge, Button, Modal } from "../ui";
import { usePolls } from "../hooks/usePolls";

export const AdminDashboard = () => {
  const { polls, loading, createPoll } = usePolls();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const formRef = useRef(null);
  const [formState, setFormState] = useState({
    isComplete: false,
    hasErrors: false,
    isSubmitting: false,
  });

  // Calculate statistics
  const totalPolls = polls.length;
  const activePolls = polls.filter((p) => p.status === "active").length;
  const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
  const totalVoters = totalVotes;

  const handleCreatePoll = async (pollData) => {
    try {
      await createPoll(pollData);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating poll:", error);
      alert("Failed to create poll: " + error.message);
    }
  };

  const handleViewSummary = (pollId) => {
    setSelectedPollId(pollId);
    setShowSummaryModal(true);
  };

  const handleCreatePollSubmit = async () => {
    if (formRef.current) {
      if (!formRef.current.isValid()) {
        return;
      }

      try {
        await formRef.current.submitForm();
        setShowCreateModal(false);
      } catch (error) {
        console.error("Error creating poll:", error);
        alert("Failed to create poll: " + error.message);
      }
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
  };

  const handleFormStateChange = (newFormState) => {
    setFormState(newFormState);
  };

  // Filter and sort polls
  const filteredAndSortedPolls = (() => {
    let result = [...polls];

    if (searchQuery.trim()) {
      result = result.filter(
        (poll) =>
          poll.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          poll.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  })();

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 rounded-3xl shadow-lg border border-slate-100 p-8 md:p-12">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full opacity-20 blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base hover:from-blue-700 hover:to-blue-600 hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Create New Poll</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total Polls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <p className="text-xs md:text-sm text-slate-600 mb-2 font-medium">
              Total Polls
            </p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {totalPolls}
            </p>
          </div>
        </div>

        {/* Active Polls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <p className="text-xs md:text-sm text-slate-600 mb-2 font-medium">
              Active Polls
            </p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {activePolls}
            </p>
          </div>
        </div>

        {/* Total Votes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <p className="text-xs md:text-sm text-slate-600 mb-2 font-medium">
              Total Votes
            </p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {totalVotes}
            </p>
          </div>
        </div>

        {/* Unique Voters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <p className="text-xs md:text-sm text-slate-600 mb-2 font-medium">
              Unique Voters
            </p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {totalVoters}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-2 md:pr-4 py-2.5 md:py-3 border border-slate-200 rounded-xl text-xs md:text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder("desc")}
              className={`px-3 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                sortOrder === "desc"
                  ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortOrder("asc")}
              className={`px-3 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                sortOrder === "asc"
                  ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Oldest
            </button>
          </div>
        </div>
      </div>

      {/* Polls Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-600">Loading polls...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Poll
                  </th>
                  <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                    Votes
                  </th>
                  <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    Created
                  </th>
                  <th className="px-3 md:px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                    Time Remaining
                  </th>
                  <th className="px-3 md:px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredAndSortedPolls.length > 0 ? (
                  filteredAndSortedPolls.map((poll) => (
                    <tr
                      key={poll.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-3 md:px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm md:text-base">
                            {poll.title}
                          </div>
                          <div className="text-xs md:text-sm text-slate-500">
                            {poll.options?.length || 0} options
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <Badge
                          variant={
                            poll.pollType === "private" ? "warning" : "info"
                          }
                          size="sm"
                        >
                          {poll.pollType === "private" ? "Private" : "Public"}
                        </Badge>
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <Badge
                          variant={
                            poll.status === "active"
                              ? "success"
                              : poll.status === "closed"
                                ? "error"
                                : "warning"
                          }
                          size="sm"
                        >
                          {poll.status}
                        </Badge>
                      </td>
                      <td className="px-3 md:px-6 py-4 text-slate-900 text-sm font-medium hidden sm:table-cell">
                        {poll.totalVotes.toLocaleString()}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-slate-600 text-xs md:text-sm hidden md:table-cell">
                        {poll.createdAt}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-slate-600 text-xs md:text-sm hidden lg:table-cell">
                        {poll.timeRemaining || "-"}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewSummary(poll.id)}
                          className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 hover:shadow-md"
                        >
                          View Result
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 md:px-6 py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                        <Vote className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        {searchQuery.trim()
                          ? "No polls found matching your search."
                          : "No polls created yet."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Poll Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCancelCreate}
        title="Create New Poll"
        size="lg"
        footer={
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <div className="text-xs text-slate-500">
              {formState.hasErrors && (
                <span className="text-red-500">
                  Please fix validation errors
                </span>
              )}
              {!formState.isComplete && !formState.hasErrors && (
                <span className="text-amber-600">
                  Please fill in all required fields
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="secondary"
                onClick={handleCancelCreate}
                className="text-xs md:text-sm px-3 md:px-4"
                disabled={formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="blockchain"
                onClick={handleCreatePollSubmit}
                className="text-xs md:text-sm px-3 md:px-4"
                disabled={!formState.isComplete || formState.isSubmitting}
                title={
                  !formState.isComplete
                    ? "Please fill in all required fields and fix any errors"
                    : "Create new poll with current settings"
                }
              >
                {formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Poll</>
                )}
              </Button>
            </div>
          </div>
        }
      >
        <PollCreationForm
          ref={formRef}
          onSubmit={handleCreatePoll}
          existingPolls={polls}
          onFormStateChange={handleFormStateChange}
        />
      </Modal>

      {/* Poll Summary Modal */}
      <PollSummaryModal
        pollId={selectedPollId}
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
      />
    </div>
  );
};
