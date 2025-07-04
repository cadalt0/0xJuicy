"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Wallet, 
  DollarSign, 
  Zap, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Copy,
  ExternalLink,
  Building2,
  CreditCard,
  Smartphone,
  Bolt,
  Info,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data
const mockBalance = {
  available: 15234.67,
  quickRequest: 5234.67,
  merchant: 10000.00
}

// Mock Quick-Request Payment data with column format
const mockQuickRequestPayments = [
  {
    id: "1",
    amount: 1.00,
    destinedAddress: "0x742d35Cc6634C0532925a3b8D4C9db98098",
    chain: "Base",
    chainLogo: "🔵",
    status: "available",
    requestId: "REQ123456",
    date: "2024-01-15"
  },
  {
    id: "2",
    amount: 1.00,
    destinedAddress: "0x8ba1f109551bD432803012645Hac189",
    chain: "Arbitrum",
    chainLogo: "🔷",
    status: "available",
    requestId: "REQ123457",
    date: "2024-01-14"
  },
  {
    id: "3",
    amount: 1.00,
    destinedAddress: "0x1f9840a85d5aF5bf1D1762F925BDAd",
    chain: "Ethereum",
    chainLogo: "⟠",
    status: "available",
    requestId: "REQ123458",
    date: "2024-01-13"
  },
  {
    id: "4",
    amount: 1.00,
    destinedAddress: "0x514910771AF9Ca656af840dff83E80",
    chain: "Linea",
    chainLogo: "🟢",
    status: "available",
    requestId: "REQ123459",
    date: "2024-01-12"
  }
]

const mockWithdrawHistory = [
  { id: "1", amount: 1000.00, fee: 1.00, method: "one-click", type: "quick-request", status: "completed", date: "2024-01-15", txHash: "0x1a2b3c..." },
  { id: "2", amount: 2500.00, fee: 0.00, method: "manual", type: "merchant", status: "pending", date: "2024-01-14", txHash: "0x2b3c4d..." },
  { id: "3", amount: 750.00, fee: 1.00, method: "one-click", type: "quick-request", status: "completed", date: "2024-01-13", txHash: "0x3c4d5e..." }
]

export default function WithdrawPanel() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [activeSection, setActiveSection] = useState<'quick-request' | 'merchant'>('quick-request')
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [showOneClickModal, setShowOneClickModal] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)

  const handleConnectWallet = () => {
    setIsWalletConnected(true)
  }

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawMethod) return
    
    setIsProcessing(true)
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      setShowSuccess(true)
      setWithdrawAmount("")
      setWithdrawMethod("")
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000)
    }, 2000)
  }

  const handleQuickWithdraw = (paymentId: string, method: 'one-click' | 'manual') => {
    setIsProcessing(true)
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      setShowSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000)
    }, 2000)
  }

  const getMethodFee = (method: string) => {
    return method === 'one-click' ? 1 : 0
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatAddress = (address: string) => {
    // Format address as 0x742d...98098 and make it grayed
    return `${address.slice(0, 6)}...${address.slice(-5)}`
  }

  return (
    <motion.div
      key="withdraw"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-green-500/30"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Withdrawal Successful!</p>
                <p className="text-sm opacity-90">Your funds are being processed</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* One-Click Withdraw Info Modal */}
      <AnimatePresence>
        {showOneClickModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
            onClick={() => setShowOneClickModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                onClick={() => setShowOneClickModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-6"
                >
                  <Zap className="w-8 h-8 text-white" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-4"
                >
                  One-Click Withdraw
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white space-y-4"
                >
                  <p className="text-lg leading-relaxed">
                    Directly get $ into your destined wallet with no gas fee. Connected destined wallet required.
                  </p>
                  
                  <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <div className="text-left">
                        <p className="font-semibold text-yellow-300">Express Processing</p>
                        <p className="text-sm text-yellow-400/80">Instant withdrawal with $1.00 fee</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6"
                >
                  <Button
                    onClick={() => setShowOneClickModal(false)}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 rounded-xl"
                  >
                    Got it!
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Withdraw Info Modal */}
      <AnimatePresence>
        {showManualModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
            onClick={() => setShowManualModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                onClick={() => setShowManualModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6"
                >
                  <Clock className="w-8 h-8 text-white" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-4"
                >
                  Manual Withdraw
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white space-y-4"
                >
                  <p className="text-lg leading-relaxed">
                    Free but need to connect wallet to claim funds to destined wallet.
                  </p>
                  
                  <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div className="text-left">
                        <p className="font-semibold text-green-300">Standard Processing</p>
                        <p className="text-sm text-green-400/80">Free withdrawal, requires wallet connection</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6"
                >
                  <Button
                    onClick={() => setShowManualModal(false)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl"
                  >
                    Got it!
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Available Balance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Available to Withdraw</p>
                  <motion.p 
                    className="text-3xl font-bold text-white mt-1"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ${mockBalance.available.toLocaleString()}
                  </motion.p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">+3.1%</span>
                  </div>
                </div>
                <motion.div
                  className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Wallet className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Request Funds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Quick Request Funds</p>
                  <motion.p 
                    className="text-3xl font-bold text-white mt-1"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ${mockBalance.quickRequest.toLocaleString()}
                  </motion.p>
                  <div className="flex items-center gap-1 mt-2">
                    <Bolt className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-yellow-400">Instant Withdraw</span>
                  </div>
                </div>
                <motion.div
                  className="p-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Bolt className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Merchant Funds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Merchant Funds</p>
                  <motion.p 
                    className="text-3xl font-bold text-white mt-1"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ${mockBalance.merchant.toLocaleString()}
                  </motion.p>
                  <div className="flex items-center gap-1 mt-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-400">Business Account</span>
                  </div>
                </div>
                <motion.div
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Building2 className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Section Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2"
      >
        {[
          { id: 'quick-request', label: 'Quick-Request Payment Withdrawal', icon: Bolt },
          { id: 'merchant', label: 'Merchant Withdrawal', icon: Building2 }
        ].map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 border backdrop-blur-sm",
              activeSection === tab.id
                ? "bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white border-blue-500/50 shadow-lg shadow-blue-500/25"
                : "bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50 hover:text-blue-300 hover:border-blue-600/50"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'quick-request' ? (
          <motion.div
            key="quick-request"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Bolt className="w-5 h-5 text-purple-400" />
                  Quick-Request Payment Withdrawal
                </CardTitle>
                <p className="text-sm text-gray-300">
                  Withdraw funds from quick payment requests with instant or manual processing
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isWalletConnected ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="mb-4">
                      <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
                      <p className="text-gray-400">Connect your wallet to withdraw quick-request payments</p>
                    </div>
                    <Button
                      onClick={handleConnectWallet}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-xl"
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect Wallet
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Quick-Request Payments Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-300 font-semibold">Amount</th>
                            <th className="text-left py-3 px-4 text-gray-300 font-semibold">Destined Address</th>
                            <th className="text-left py-3 px-4 text-gray-300 font-semibold">Chain</th>
                            <th className="text-left py-3 px-4 text-gray-300 font-semibold">
                              <div className="flex items-center gap-2">
                                One-Click Withdraw
                                <motion.button
                                  onClick={() => setShowOneClickModal(true)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Info className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </th>
                            <th className="text-left py-3 px-4 text-gray-300 font-semibold">
                              <div className="flex items-center gap-2">
                                Manual Withdraw
                                <motion.button
                                  onClick={() => setShowManualModal(true)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Info className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockQuickRequestPayments.map((payment, index) => (
                            <motion.tr
                              key={payment.id}
                              className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              {/* Amount */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  <span className="font-bold text-green-400">${payment.amount.toFixed(2)}</span>
                                </div>
                              </td>

                              {/* Destined Address - Updated format */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-gray-400">
                                    {formatAddress(payment.destinedAddress)}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(payment.destinedAddress)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>

                              {/* Chain - Removed emoji */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white text-sm">{payment.chain}</span>
                                </div>
                              </td>

                              {/* One-Click Withdraw */}
                              <td className="py-4 px-4">
                                <motion.button
                                  onClick={() => handleQuickWithdraw(payment.id, 'one-click')}
                                  disabled={isProcessing}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Zap className="w-4 h-4" />
                                  <span className="text-sm">$1 Fee</span>
                                </motion.button>
                              </td>

                              {/* Manual Withdraw */}
                              <td className="py-4 px-4">
                                <motion.button
                                  onClick={() => handleQuickWithdraw(payment.id, 'manual')}
                                  disabled={isProcessing}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm">Free</span>
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bulk Actions - Coming Soon */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">Bulk Withdrawal</h4>
                          <p className="text-sm text-gray-400">Withdraw all available quick-request payments at once</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            className="bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-semibold cursor-not-allowed"
                            disabled={true}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Coming Soon
                          </Button>
                          <Button
                            className="bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-semibold cursor-not-allowed"
                            disabled={true}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Coming Soon
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="merchant"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-400" />
                  Merchant Withdrawal
                </CardTitle>
                <p className="text-sm text-gray-300">
                  Withdraw funds from merchant transactions and business payments
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isWalletConnected ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="mb-4">
                      <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Connect Your Business Wallet</h3>
                      <p className="text-gray-400">Connect your wallet to withdraw merchant payments</p>
                    </div>
                    <Button
                      onClick={handleConnectWallet}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl"
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Connect Business Wallet
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Merchant Info */}
                    <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-green-400" />
                        <div>
                          <p className="font-semibold text-green-300">Business Account</p>
                          <p className="text-sm text-green-400/80">Verified merchant status</p>
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-200">Withdrawal Amount</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white text-lg pr-16"
                          max={mockBalance.available}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">USDC</div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Available: ${mockBalance.available.toLocaleString()} USDC
                      </p>
                    </div>

                    {/* Withdrawal Method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-200">Withdrawal Method</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            id: 'one-click',
                            title: 'Express Withdrawal',
                            description: 'Priority processing with $1 fee',
                            fee: '$1.00',
                            icon: Zap,
                            color: 'from-yellow-500 to-orange-500'
                          },
                          {
                            id: 'manual',
                            title: 'Standard Withdrawal',
                            description: 'Regular processing, no fees',
                            fee: 'Free',
                            icon: Clock,
                            color: 'from-green-500 to-emerald-500'
                          }
                        ].map((method) => (
                          <motion.div
                            key={method.id}
                            className={cn(
                              "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                              withdrawMethod === method.id
                                ? "border-green-500 bg-green-900/30"
                                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                            )}
                            onClick={() => setWithdrawMethod(method.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg bg-gradient-to-r", method.color)}>
                                <method.icon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-white">{method.title}</p>
                                <p className="text-sm text-gray-400">{method.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-white">{method.fee}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Fee Summary */}
                    {withdrawAmount && withdrawMethod && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Withdrawal Amount:</span>
                            <span className="text-white">${parseFloat(withdrawAmount).toFixed(2)} USDC</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Processing Fee:</span>
                            <span className="text-white">${getMethodFee(withdrawMethod).toFixed(2)} USDC</span>
                          </div>
                          <div className="border-t border-gray-700 pt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-white">You'll Receive:</span>
                              <span className="text-green-400">
                                ${(parseFloat(withdrawAmount) - getMethodFee(withdrawMethod)).toFixed(2)} USDC
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Withdraw Button */}
                    <Button
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || !withdrawMethod || isProcessing}
                      className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl text-lg"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                          />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Building2 className="mr-3 h-5 w-5" />
                          Withdraw Merchant Funds
                          <ArrowRight className="ml-3 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal History */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Withdrawal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockWithdrawHistory.map((withdrawal, index) => (
              <motion.div
                key={withdrawal.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="font-semibold text-white">${withdrawal.amount.toFixed(2)} USDC</p>
                      <p className="text-sm text-gray-400">
                        {withdrawal.type === 'quick-request' ? 'Quick-Request' : 'Merchant'} • 
                        {withdrawal.method === 'one-click' ? ' Express' : ' Standard'} • {withdrawal.date}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Fee: ${withdrawal.fee.toFixed(2)}</p>
                    <p className="text-sm font-mono text-blue-400">{withdrawal.txHash}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}