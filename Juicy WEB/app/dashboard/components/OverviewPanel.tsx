"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign, 
  Activity, 
  Target,
  Globe,
  Wallet,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data
const mockStats = {
  totalReceived: 125847.32,
  weeklyReceived: 8234.56,
  monthlyReceived: 34567.89,
  totalPayments: 1247,
  weeklyPayments: 89,
  avgPayment: 101.23,
  weeklyAvg: 92.54,
  monthlyAvg: 108.76
}

const mockTopChains = [
  { name: "Base", logo: "🔵", amount: 45234.67, percentage: 36, transactions: 456 },
  { name: "Avalanche", logo: "🔷", amount: 32145.89, percentage: 26, transactions: 321 },
  { name: "Ethereum", logo: "⟠", amount: 28456.12, percentage: 23, transactions: 234 },
  { name: "Linea", logo: "🟢", amount: 20010.64, percentage: 15, transactions: 236 }
]

const mockTopWallets = [
  { address: "0x742d35Cc6634C0532925a3b8D4C9db", amount: 5234.67, payments: 23, label: "Frequent Customer" },
  { address: "0x8ba1f109551bD432803012645Hac189", amount: 4156.89, payments: 18, label: "VIP Client" },
  { address: "0x1f9840a85d5aF5bf1D1762F925BDAd", amount: 3789.45, payments: 15, label: "Regular User" },
  { address: "0x514910771AF9Ca656af840dff83E80", amount: 2945.23, payments: 12, label: "New Customer" }
]

const getChainLogo = (chain: string) => {
  const logos: Record<string, string> = {
    'Base': '🔵',
    'Avalanche': '🔷', 
    'Ethereum': '⟠',
    'Linea': '🟢'
  }
  return logos[chain] || '🔗'
}

interface OverviewPanelProps {
  onChainClick: (chain: any) => void
}

export default function OverviewPanel({ onChainClick }: OverviewPanelProps) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total USDC Received",
            value: `$${mockStats.totalReceived.toLocaleString()}`,
            change: "+12.5%",
            trend: "up",
            icon: DollarSign,
            color: "from-green-500 to-emerald-500"
          },
          {
            title: "Weekly Received", 
            value: `$${mockStats.weeklyReceived.toLocaleString()}`,
            change: "+8.2%",
            trend: "up",
            icon: TrendingUp,
            color: "from-blue-500 to-cyan-500"
          },
          {
            title: "Total Payments",
            value: mockStats.totalPayments.toLocaleString(),
            change: "+15.3%",
            trend: "up", 
            icon: Activity,
            color: "from-purple-500 to-pink-500"
          },
          {
            title: "Avg Payment",
            value: `$${mockStats.avgPayment}`,
            change: "-2.1%",
            trend: "down",
            icon: Target,
            color: "from-orange-500 to-red-500"
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                    <motion.p 
                      className="text-2xl font-bold text-white mt-1"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {stat.value}
                    </motion.p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <span className={cn("text-sm font-semibold", stat.trend === 'up' ? 'text-green-400' : 'text-red-400')}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    className={cn("p-3 rounded-xl bg-gradient-to-r", stat.color)}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Chains */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Top Source Chains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockTopChains.map((chain, index) => (
              <motion.div
                key={chain.name}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-700/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onChainClick(chain)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{chain.logo}</span>
                  <div>
                    <p className="font-semibold text-white">{chain.name}</p>
                    <p className="text-sm text-gray-400">{chain.transactions} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">${chain.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">{chain.percentage}%</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Top Wallets */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Top Sending Wallets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockTopWallets.map((wallet, index) => (
              <motion.div
                key={wallet.address}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white">{wallet.address.slice(0, 12)}...</p>
                    <p className="text-xs text-gray-400">{wallet.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">${wallet.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">{wallet.payments} payments</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Network Status */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Base', 'Avalanche', 'Ethereum', 'Linea'].map((network, index) => (
              <motion.div
                key={network}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getChainLogo(network)}</span>
                  <span className="font-semibold text-white text-sm">{network}</span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}