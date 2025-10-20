import {
  Hash,
  Clock,
  Vote,
  Shield,
  Link2,
  Database,
  User,
  Info,
} from "lucide-react";
import { Card, CardBody, Badge, Button, Modal } from "../ui";
import { useState } from "react";

export const BlockchainDetailModal = ({ block, onClose }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const tooltips = {
    chainId:
      "Unique identifier for the blockchain chain. Oracle automatically assigns chain IDs to organize blocks into separate chains.",
    seqNum:
      "Sequential number of the block within its chain. Starts at 1 for genesis block and increments with each new block.",
    instanceId:
      "Oracle Database instance ID that created this block. Useful in multi-instance environments.",
    userNumber:
      "Database user number who inserted this record. Oracle internal identifier for the user.",
    creationTime:
      "Timestamp when Oracle Database created this block. Automatically generated and immutable.",
    blockHash:
      "SHA2-512 cryptographic hash of the block content. Oracle automatically generates this hash to ensure data integrity.",
    previousHash:
      "Hash of the previous block in the chain. Links blocks together to form the blockchain.",
  };

  const InfoTooltip = ({ id, children }) => (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
        onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
        className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
      >
        <Info className="w-3.5 h-3.5 text-slate-500" />
      </button>
      {activeTooltip === id && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg z-20">
          {children}
          <div className="absolute top-0 left-2 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
        </div>
      )}
    </div>
  );

  const modalTitle = block ? (
    <div className="flex items-center justify-between w-full gap-3">
      <span className="flex-1">Blockchain Block Details</span>
      <Badge
        variant={block.chainInfo.isFirstBlock ? "warning" : "success"}
        size="sm"
        className="text-xs flex-shrink-0"
      >
        {block.chainInfo.isFirstBlock
          ? "Genesis Block"
          : "Block #" + block.chainInfo.position}
      </Badge>
    </div>
  ) : (
    "Blockchain Block Details"
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
      isOpen={!!block}
      onClose={onClose}
      title={modalTitle}
      footer={modalFooter}
      size="lg"
    >
      {block && (
        <div className="space-y-4 md:space-y-6">
          {/* Info Banner */}
          <Card className="bg-blue-50 border-blue-200">
            <CardBody className="p-3 md:p-4">
              <h4 className="font-semibold text-blue-900 text-sm md:text-base flex items-center gap-2">
                Oracle Blockchain Table Block
                <InfoTooltip id="blockchainInfo">
                  This block is permanently stored in Oracle Blockchain Table
                  and cannot be modified or deleted. All metadata is
                  automatically generated and maintained by Oracle Database.
                </InfoTooltip>
              </h4>
            </CardBody>
          </Card>

          {/* Vote Information */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
              <Vote className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Vote Information
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                    Poll
                  </label>
                  <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs md:text-sm text-slate-900">
                      {block.pollTitle}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                    Selected Option
                  </label>
                  <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs md:text-sm text-slate-900">
                      {block.optionName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Metadata */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
              <Database className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              Oracle-Generated Blockchain Metadata
              <Badge variant="success" size="sm" className="text-xs">
                Read-Only
              </Badge>
            </h4>
            <div className="space-y-3">
              {/* Chain & Sequence Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs md:text-sm font-medium text-slate-700 mb-1">
                    <Link2 className="w-3.5 h-3.5 md:w-4 md:h-4 inline" />
                    Chain ID
                    <InfoTooltip id="chainId">{tooltips.chainId}</InfoTooltip>
                  </label>
                  <div className="p-2 md:p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs md:text-sm text-slate-900 font-mono">
                      <code className="bg-purple-100 px-2 py-0.5 rounded">
                        ORABCTAB_CHAIN_ID$
                      </code>
                    </p>
                    <p className="text-base md:text-lg font-bold text-purple-600 mt-1">
                      {block.blockchain.chainId}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs md:text-sm font-medium text-slate-700 mb-1">
                    <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 inline" />
                    Sequence Number
                    <InfoTooltip id="seqNum">{tooltips.seqNum}</InfoTooltip>
                  </label>
                  <div className="p-2 md:p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs md:text-sm text-slate-900 font-mono">
                      <code className="bg-purple-100 px-2 py-0.5 rounded">
                        ORABCTAB_SEQ_NUM$
                      </code>
                    </p>
                    <p className="text-base md:text-lg font-bold text-purple-600 mt-1">
                      {block.blockchain.sequenceNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instance & User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs md:text-sm font-medium text-slate-700 mb-1">
                    <Database className="w-3.5 h-3.5 md:w-4 md:h-4 inline" />
                    Instance ID
                    <InfoTooltip id="instanceId">
                      {tooltips.instanceId}
                    </InfoTooltip>
                  </label>
                  <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs md:text-sm text-slate-900 font-mono">
                      <code className="bg-slate-100 px-2 py-0.5 rounded">
                        ORABCTAB_INST_ID$
                      </code>
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-900 mt-1">
                      {block.blockchain.instanceId}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs md:text-sm font-medium text-slate-700 mb-1">
                    <User className="w-3.5 h-3.5 md:w-4 md:h-4 inline" />
                    User Number
                    <InfoTooltip id="userNumber">
                      {tooltips.userNumber}
                    </InfoTooltip>
                  </label>
                  <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs md:text-sm text-slate-900 font-mono">
                      <code className="bg-slate-100 px-2 py-0.5 rounded">
                        ORABCTAB_USER_NUMBER$
                      </code>
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-900 mt-1">
                      {block.blockchain.userNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Creation Time */}
              <div>
                <label className="flex items-center gap-1 text-xs md:text-sm font-medium text-slate-700 mb-1">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 inline" />
                  Block Creation Time
                  <InfoTooltip id="creationTime">
                    {tooltips.creationTime}
                  </InfoTooltip>
                </label>
                <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs md:text-sm text-slate-900 font-mono">
                    <code className="bg-slate-100 px-2 py-0.5 rounded">
                      ORABCTAB_CREATION_TIME$
                    </code>
                  </p>
                  <p className="text-xs md:text-sm text-slate-900 mt-1">
                    {new Date(block.blockchain.creationTime).toLocaleString(
                      "en-US",
                      {
                        dateStyle: "full",
                        timeStyle: "long",
                      },
                    )}
                  </p>
                </div>
              </div>

              {/* Block Hash */}
              <div>
                <label className="flex items-center gap-1 text-xs md:text-sm font-medium text-slate-700 mb-1">
                  <Hash className="w-3.5 h-3.5 md:w-4 md:h-4 inline" />
                  Block Hash (SHA2_512)
                  <InfoTooltip id="blockHash">{tooltips.blockHash}</InfoTooltip>
                </label>
                <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs md:text-sm text-slate-900 font-mono mb-1">
                    <code className="bg-slate-100 px-2 py-0.5 rounded">
                      ORABCTAB_HASH$
                    </code>
                  </p>
                  <p className="font-mono text-xs text-slate-900 break-all bg-white p-2 rounded border">
                    {block.blockchain.blockHash}
                  </p>
                </div>
              </div>

              {/* Previous Hash */}
              <div>
                <label className="flex items-center gap-1 text-xs md:text-sm font-medium text-slate-700 mb-1">
                  <Link2 className="w-3.5 h-3.5 md:w-4 md:h-4 inline" />
                  Previous Block Hash
                  <InfoTooltip id="previousHash">
                    {tooltips.previousHash}
                  </InfoTooltip>
                </label>
                <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs md:text-sm text-slate-900 font-mono mb-1">
                    Links to previous block in chain
                  </p>
                  <p className="font-mono text-xs text-slate-900 break-all bg-white p-2 rounded border">
                    {block.blockchain.previousHash}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
