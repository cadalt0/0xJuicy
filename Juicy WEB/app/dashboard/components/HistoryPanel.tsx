"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  Download, 
  Search, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle 
} from "lucide-react"

// Mock transaction data
const mockTransactions = [
  {
    id: "1",
    date: "2024-01-15 14:32:15",
    payer: "0x742d35Cc6634C0532925a3b8D4C9db",
    amount: 234.56,
    sourceChain: "Base",
    destChain: "Arbitrum",
    status: "confirmed",
    burnTx: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    mintTx: "0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba09",
    requestId: "REQ123456"
  },
  {
    id: "2", 
    date: "2024-01-15 13:45:22",
    payer: "0x8ba1f109551bD432803012645Hac189",
    amount: 156.78,
    sourceChain: "Ethereum",
    destChain: "Base",
    status: "pending",
    burnTx: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abc1",
    mintTx: null,
    requestId: "REQ123457"
  },
  {
    id: "3",
    date: "2024-01-15 12:18:45", 
    payer: "0x1f9840a85d5aF5bf1D1762F925BDAd",
    amount: 89.34,
    sourceChain: "Arbitrum",
    destChain: "Linea",
    status: "failed",
    burnTx: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcd12",
    mintTx: null,
    requestId: "REQ123458"
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-400" />
    case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
    case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
    case 'recoverable': return <RefreshCw className="w-4 h-4 text-orange-400" />
    default: return <AlertTriangle className="w-4 h-4 text-gray-400" />
  }
}

const getChainLogo = (chain: string) => {
  const logos: Record<string, string> = {
    'Base': '🔵',
    'Arbitrum': '🔷', 
    'Ethereum': '⟠',
    'Linea': '🟢'
  }
  return logos[chain] || '🔗'
}

export default function HistoryPanel() {
  const [dateFilter, setDateFilter] = useState("7d")
  const [chainFilter, setChainFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Payment History
            </CardTitle>
            <div className="flex items-center gap-3">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                  <SelectItem value="7d" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Last 7 days</SelectItem>
                  <SelectItem value="30d" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Last 30 days</SelectItem>
                  <SelectItem value="90d" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by wallet or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-gray-800/50 border-gray-600/50 text-white"
              />
            </div>
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600/50 text-white">
                <SelectValue placeholder="All Chains" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                <SelectItem value="all" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">All Chains</SelectItem>
                <SelectItem value="base" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Base</SelectItem>
                <SelectItem value="arbitrum" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Arbitrum</SelectItem>
                <SelectItem value="ethereum" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Ethereum</SelectItem>
                <SelectItem value="linea" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Linea</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600/50 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                <SelectItem value="all" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">All Status</SelectItem>
                <SelectItem value="confirmed" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Confirmed</SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Pending</SelectItem>
                <SelectItem value="failed" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Date & Time</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Payer Wallet</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Route</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-4 px-4">
                      <div className="text-white font-mono text-sm">{tx.date}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-400">{tx.payer.slice(0, 12)}...</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-green-400">${tx.amount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getChainLogo(tx.sourceChain)}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm">{getChainLogo(tx.destChain)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <span className="text-sm capitalize text-white">{tx.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        {tx.status === 'failed' && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-orange-400">
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}