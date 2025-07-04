"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Wallet, 
  ArrowRight, 
  CheckCircle, 
  Droplet,
  User,
  DollarSign,
  Zap,
  Sparkles,
  Delete,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"
import PayHeader from "./components/PayHeader"
import NumericKeyboard from "./components/NumericKeyboard"

// Supported chains for payment
const supportedChains = [
  { 
    id: 'ethereum', 
    name: 'Ethereum', 
    logo: '⟠',
    color: 'from-blue-500 to-blue-600', 
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30'
  },
  { 
    id: 'base', 
    name: 'Base', 
    logo: '🔵',
    color: 'from-yellow-500 to-orange-500', 
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30'
  },
  { 
    id: 'arbitrum', 
    name: 'Arbitrum', 
    logo: '🔷',
    color: 'from-blue-600 to-indigo-600', 
    bgColor: 'bg-blue-600/20',
    borderColor: 'border-blue-600/30'
  },
  { 
    id: 'linea', 
    name: 'Linea', 
    logo: '🟢',
    color: 'from-green-500 to-emerald-500', 
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30'
  }
]

// Client-side only animated particles component
function AnimatedParticles() {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, targetX: number, targetY: number, duration: number}>>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Generate particles only on client side
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      targetX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      targetY: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      duration: Math.random() * 20 + 10
    }))
    setParticles(newParticles)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
          }}
          animate={{
            x: particle.targetX,
            y: particle.targetY,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  )
}

export default function PayPage() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [selectedChain, setSelectedChain] = useState("")
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [recipient] = useState({
    name: "John's Coffee Shop",
    address: "0x742d35Cc6634C0532925a3b8D4C9db98098"
  })

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setIsWalletConnected(true)
        setWalletAddress(accounts[0])
      } else {
        alert('Please install MetaMask to connect your wallet')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      setAmount(prev => prev.slice(0, -1))
    } else if (key === 'clear') {
      setAmount("")
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + key)
      }
    } else {
      // Limit to reasonable amount (max 10 digits before decimal, 6 after)
      const parts = amount.split('.')
      if (parts[0].length < 10) {
        if (parts.length === 1 || parts[1].length < 6) {
          setAmount(prev => prev + key)
        }
      }
    }
  }

  const handlePay = async () => {
    if (!amount || !selectedChain || !isWalletConnected) return
    
    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setShowSuccess(true)
      
      // Reset after success
      setTimeout(() => {
        setShowSuccess(false)
        setAmount("")
      }, 3000)
    }, 2500)
  }

  const selectedChainData = supportedChains.find(chain => chain.id === selectedChain)

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,58,237,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.1),transparent_50%)]"></div>
        
        {/* Floating Particles - Client-side only */}
        <AnimatedParticles />
      </div>

      {/* Header */}
      <PayHeader 
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
      />

      {/* Main Content - Fixed height with flex */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          {/* Success Modal */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl p-6 max-w-xs w-full shadow-2xl border border-gray-700/50 backdrop-blur-xl text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4"
                  >
                    <CheckCircle className="w-6 h-6 text-white" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold text-green-400 mb-2"
                  >
                    Payment Sent!
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-300 mb-3 text-sm"
                  >
                    Your payment of ${amount} USDC has been successfully sent to {recipient.name}.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-400" />
                      <div className="text-left">
                        <p className="font-semibold text-green-300 text-sm">Transaction Complete</p>
                        <p className="text-xs text-green-400/80">Payment processed successfully</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {/* Payment Info Card - 15% Smaller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-lg p-2.5 shadow-2xl"
            >
              <div className="text-center mb-5">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4"
                >
                  <User className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold text-white mb-3">You are paying</h2>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {recipient.name}
                </p>
                <p className="text-base text-gray-400 font-mono mt-3">
                  {recipient.address.slice(0, 10)}...{recipient.address.slice(-6)}
                </p>
              </div>

              {/* Amount Display - 15% Smaller */}
              <div className="text-center mb-3">
                <p className="text-sm text-gray-400 mb-2">Amount</p>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers and one decimal point
                      if (/^\d*\.?\d*$/.test(value)) {
                        setAmount(value);
                      }
                    }}
                    placeholder="0.00"
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-xl font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">USDC</span>
                </div>
                {amount && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-1.5 text-green-400 mt-2"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span className="text-sm font-semibold">Ready to send</span>
                  </motion.div>
                )}
              </div>

              {/* Chain Selection - 15% Smaller */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-2.5"
              >
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-yellow-400" />
                  Choose a chain to pay
                </label>
                <Select value={selectedChain} onValueChange={setSelectedChain}>
                  <SelectTrigger className="h-8 rounded-lg border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-blue-500/50 transition-all duration-200">
                    <SelectValue placeholder="Select blockchain network" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 text-white border-gray-700/50 backdrop-blur-xl">
                    {supportedChains.map((chain, index) => (
                      <SelectItem 
                        key={chain.id} 
                        value={chain.id} 
                        className="bg-gray-900/95 text-white hover:bg-gray-800/80 focus:bg-gray-800/80 rounded-lg my-1"
                      >
                        <motion.div 
                          className="flex items-center space-x-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <span className="text-sm">{chain.logo}</span>
                          <span className="font-medium text-white text-sm">{chain.name}</span>
                          <div className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-r", chain.color)}></div>
                        </motion.div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Chain Info Display - 15% Smaller */}
                {selectedChainData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn("mt-1.5 rounded-lg p-1.5 border backdrop-blur-sm", selectedChainData.bgColor, selectedChainData.borderColor)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{selectedChainData.logo}</span>
                      <div>
                        <p className="font-semibold text-white text-xs">{selectedChainData.name}</p>
                        <p className="text-xs text-gray-300">Payment will be processed on this network</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {/* Pay Button - 15% Smaller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handlePay}
                  disabled={!amount || !selectedChain || !isWalletConnected || isProcessing}
                  className="w-full h-8.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-lg text-sm transition-all duration-300 shadow-2xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden transform hover:-translate-y-0.5 active:scale-95"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: '-100%' }}
                    animate={{ x: isProcessing ? '100%' : '-100%' }}
                    transition={{ duration: 1.5, repeat: isProcessing ? Infinity : 0, ease: "linear" }}
                  />
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full mr-1.5"
                      />
                      Processing Payment...
                    </div>
                  ) : !isWalletConnected ? (
                    <>
                      <Wallet className="mr-1.5 h-3.5 w-3.5" />
                      Connect Wallet to Pay
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      Pay ${amount || "0.00"} USDC
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>

            {/* Payment Info - 15% Smaller */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-1.5 text-center"
            >
              <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-400">
                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                <span>Secure payment powered by Circle CCTP</span>
                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}