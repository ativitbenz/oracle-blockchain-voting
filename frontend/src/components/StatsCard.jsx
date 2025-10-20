import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardBody } from '../ui'

export const StatsCard = ({ title, value, trend, icon: Icon }) => {
  const isPositive = trend && trend > 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-slate-900">
              {value}
            </p>
            {trend !== undefined && trend !== null && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(trend)}%</span>
                <span className="text-slate-500 ml-1">from yesterday</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-slate-100 rounded-lg">
              <Icon className="w-6 h-6 text-slate-600" />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
