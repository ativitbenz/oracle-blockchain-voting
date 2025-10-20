import { useState, useEffect } from "react";
import {
  Database,
  Link2,
  Hash,
  CheckCircle,
  AlertTriangle,
  Search,
  Info,
} from "lucide-react";
import { BlockchainCard, BlockchainDetailModal } from "../components";
import { Badge, Loader } from "../ui";
import { API_BASE_URL } from "../config/api";

export const BlockchainAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [stats, setStats] = useState(null);
  const [verification, setVerification] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchHash, setSearchHash] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = newest first, 'asc' = oldest first
  const [activeTooltip, setActiveTooltip] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [analysisRes, statsRes, verifyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions/analysis`),
        fetch(`${API_BASE_URL}/transactions/stats`),
        fetch(`${API_BASE_URL}/transactions/verify`),
      ]);

      const analysisData = await analysisRes.json();
      const statsData = await statsRes.json();
      const verifyData = await verifyRes.json();

      setAnalysis(analysisData.data);
      setStats(statsData.data);
      setVerification(verifyData.data);
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort blocks
  const filteredAndSortedBlocks = (() => {
    let blocks = analysis?.blocks || [];

    // Filter by hash search
    if (searchHash.trim()) {
      blocks = blocks.filter((block) =>
        block.blockchain.blockHash
          ?.toLowerCase()
          .includes(searchHash.toLowerCase()),
      );
    }

    // Sort by creation time
    blocks = [...blocks].sort((a, b) => {
      const timeA = new Date(a.blockchain.creationTime).getTime();
      const timeB = new Date(b.blockchain.creationTime).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return blocks;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50 rounded-3xl shadow-lg border border-slate-100 p-8 md:p-12 text-center">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full opacity-20 blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
            Blockchain Transactions
          </h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Total Blocks */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <p className="text-xs md:text-sm text-slate-600 font-medium">
                Total Blocks
              </p>
              <div className="relative inline-block">
                <button
                  onMouseEnter={() => setActiveTooltip("totalBlocks")}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() =>
                    setActiveTooltip(
                      activeTooltip === "totalBlocks" ? null : "totalBlocks",
                    )
                  }
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Info className="w-3 h-3 text-slate-400" />
                </button>
                {activeTooltip === "totalBlocks" && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-48 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg z-20">
                    Total number of blockchain blocks stored in the Oracle
                    blockchain table.
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {stats?.blockchainStats?.totalBlocks || 0}
            </p>
          </div>
        </div>

        {/* Total Chains */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <p className="text-xs md:text-sm text-slate-600 font-medium">
                Total Chains
              </p>
              <div className="relative inline-block">
                <button
                  onMouseEnter={() => setActiveTooltip("totalChains")}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() =>
                    setActiveTooltip(
                      activeTooltip === "totalChains" ? null : "totalChains",
                    )
                  }
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Info className="w-3 h-3 text-slate-400" />
                </button>
                {activeTooltip === "totalChains" && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-48 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg z-20">
                    Number of distinct blockchain chains. Each chain represents
                    a separate sequence of linked blocks.
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {stats?.blockchainStats?.totalChains || 0}
            </p>
          </div>
        </div>

        {/* Max Sequence */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <p className="text-xs md:text-sm text-slate-600 font-medium">
                Max Sequence
              </p>
              <div className="relative inline-block">
                <button
                  onMouseEnter={() => setActiveTooltip("maxSequence")}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() =>
                    setActiveTooltip(
                      activeTooltip === "maxSequence" ? null : "maxSequence",
                    )
                  }
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Info className="w-3 h-3 text-slate-400" />
                </button>
                {activeTooltip === "maxSequence" && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-48 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg z-20">
                    Highest sequence number among all blocks. Indicates the
                    length of the longest chain.
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900">
              {stats?.blockchainStats?.maxSequence || 0}
            </p>
          </div>
        </div>

        {/* Chain Integrity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <p className="text-xs md:text-sm text-slate-600 font-medium">
                Chain Integrity
              </p>
              <div className="relative inline-block">
                <button
                  onMouseEnter={() => setActiveTooltip("chainIntegrity")}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() =>
                    setActiveTooltip(
                      activeTooltip === "chainIntegrity"
                        ? null
                        : "chainIntegrity",
                    )
                  }
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Info className="w-3 h-3 text-slate-400" />
                </button>
                {activeTooltip === "chainIntegrity" && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-48 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg z-20">
                    Verification status of blockchain integrity. Checks if all
                    block hashes are correctly linked.
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                  </div>
                )}
              </div>
            </div>
            <Badge variant={verification?.isValid ? "success" : "error"}>
              {verification?.isValid ? "Valid" : "Invalid"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
        <div className="flex gap-2">
          {/* Search by Hash */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by block hash..."
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
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

      {/* Block List */}
      <div className="space-y-3 md:space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredAndSortedBlocks.length > 0 ? (
          filteredAndSortedBlocks.map((block, index) => (
            <BlockchainCard
              key={index}
              block={block}
              onClick={() => setSelectedBlock(block)}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm md:text-base">
              {searchHash.trim()
                ? "No blocks found matching your search."
                : "No blockchain blocks yet."}
            </p>
          </div>
        )}
      </div>

      {/* Block Detail Modal */}
      {selectedBlock && (
        <BlockchainDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
};
