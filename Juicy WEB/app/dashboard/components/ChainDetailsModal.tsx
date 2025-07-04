"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ExternalLink, Copy, Wallet, Calendar, TrendingUp } from "lucide-react"

interface ChainDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  chainData: any
}

// Mock detailed transaction data
const mockTransactions = [
  {
    id: "1",
    wallet: "0x742d35Cc6634C0532925a3b8D4C9db",
    amount: 1234.56,
    date: "2024-01-15 14:32:15",
    txHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab"
  },
  {
    id: "2",
    wallet: "0x8ba1f109551bD432803012645Hac189",
    amount: 856.78,
    date: "2024-01-15 13:45:22",
    txHash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abc1"
  },
  {
    id: "3",
    wallet: "0x1f9840a85d5aF5bf1D1762F925BDAd",
    amount: 2345.67,
    date: "2024-01-15 12:18:45",
    txHash: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd12"
  }
]

export default function ChainDetailsModal({ isOpen, onClose, chainData }: ChainDetailsModalProps) {
  if (!chainData) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-6 max-w-4xl w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="absolute top-6 right-6 h-10 w-10 p-0 rounded-full text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-5 w-5 mx-auto" />
            </motion.button>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{chainData.logo}</span>
                <div>
                  <h2 className="text-3xl font-bold text-white">{chainData.name}</h2>
                  <p className="text-gray-300">Chain Details & Transactions</p>
                </div>
              </div>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
            >
              <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Amount</p>
                      <p className="text-xl font-bold text-white">${chainData.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Transactions</p>
                      <p className="text-xl font-bold text-white">{chainData.transactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Percentage</p>
                      <p className="text-xl font-bold text-white">{chainData.percentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Transactions Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm border border-gray-600/50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Wallet</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Date</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTransactions.map((tx, index) => (
                          <motion.tr
                            key={tx.id}
                            className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-blue-400">
                                  {tx.wallet.slice(0, 12)}...
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(tx.wallet)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-green-400">${tx.amount.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-white font-mono text-sm">{tx.date}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(tx.txHash)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}