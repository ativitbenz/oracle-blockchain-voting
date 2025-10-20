import { Copy, Check, Hash } from "lucide-react";
import { Badge } from "../ui";
import { useState } from "react";

export const BlockchainCard = ({ block, onClick }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(block.blockchain.blockHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 cursor-pointer hover:shadow-lg hover:border-slate-200 transition-all duration-300 hover:scale-[1.01]"
    >
      {/* Header with Badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
            Chain #{block.blockchain.chainId}
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
            Seq #{block.blockchain.sequenceNumber}
          </div>
          {block.chainInfo.isFirstBlock && (
            <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Genesis
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500 hidden sm:block whitespace-nowrap">
          {new Date(block.blockchain.creationTime).toLocaleString()}
        </div>
      </div>

      {/* Block Hash with Copy */}
      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-slate-100 transition-colors">
        <div className="font-mono text-xs md:text-sm text-slate-700 break-all flex-1">
          {block.blockchain.blockHash}
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-sm"
          title="Copy hash"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
};
