import { Shield, Hash, Clock, CheckCircle2, Database } from 'lucide-react'
import { Card, CardHeader, CardBody, Badge } from '../ui'

export const BlockchainVerification = ({ verification }) => {
  if (!verification) return null

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="border-blue-200 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base md:text-lg font-semibold text-blue-900">
            Blockchain Verification
          </h3>
          <Badge variant="success" size="sm" className="text-xs">
            <CheckCircle2 className="w-3 h-3 inline mr-1" />
            Verified
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 text-sm">
          {/* Chain ID & Sequence Number */}
          <div className="flex items-start gap-3">
            <Database className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-blue-900">Chain ID & Sequence Number</p>
              <p className="text-xs md:text-sm text-blue-700 font-mono">
                Chain #{verification.chainId} | Seq #{verification.seqNum}
              </p>
            </div>
          </div>

          {/* Creation Timestamp */}
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-blue-900">Creation Time (ORABCTAB_CREATION_TIME$)</p>
              <p className="text-xs md:text-sm text-blue-700">
                {new Date(verification.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Block Hash */}
          <div className="flex items-start gap-3">
            <Hash className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-blue-900">Block Hash (ORABCTAB_HASH$)</p>
              <p className="text-xs md:text-sm text-blue-700 font-mono break-all">
                {verification.hash}
              </p>
            </div>
          </div>

          {/* Previous Hash */}
          <div className="flex items-start gap-3">
            <Hash className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-blue-900">Previous Block Hash</p>
              <p className="text-xs md:text-sm text-blue-700 font-mono break-all">
                {verification.previousHash}
              </p>
            </div>
          </div>
        </div>

        {/* Immutability Notice */}
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-800">
            <Shield className="w-4 h-4 inline mr-1" />
            This vote is permanently recorded in the Oracle blockchain table and cannot be modified or deleted.
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
