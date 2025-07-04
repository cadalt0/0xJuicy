"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, ArrowUpDown, ExternalLink, X, Droplet, Repeat, ArrowDownLeft, Mail, Copy, QrCode, Share, Clock, RefreshCw, ChevronDown, Sparkles, Zap, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppKitAccount, useAppKit, useDisconnect, useAppKitNetwork } from '@reown/appkit/react'
import { bridgeUSDC } from '@/lib/cctpBridge'

// USDC ABI for balanceOf function
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
]

// Enhanced chain data with logos and colors
const chainLogos = {
  ethereum: "⟠",
  arbitrum: "🔷", 
  base: "🔵",
  polygon: "⬟",
  optimism: "��",
  avalanche: "❄️",
  linea: "🟢"
}

const animationSteps = [
  { id: "approve", label: "Approve USDC", icon: "🪙", description: "Authorizing token transfer" },
  { id: "burn", label: "Burning USDC", icon: "🔥", description: "Removing tokens from source chain" },
  { id: "attestation", label: "Waiting for Attestation", icon: "⏳", description: "Cross-chain verification in progress" },
  { id: "mint", label: "Minting on Destination", icon: "✨", description: "Creating tokens on target chain" },
  { id: "done", label: "Complete", icon: "✅", description: "Transfer successfully completed" },
]

const explorerUrls: Record<string, string> = {
  ethereum: 'https://sepolia.etherscan.io/tx/',
  arbitrum: 'https://sepolia.arbiscan.io/tx/',
  base: 'https://sepolia.basescan.org/tx/',
  avalanche: 'https://testnet.snowtrace.io/tx/',
  linea: 'https://sepolia.lineascan.build/tx/'
}

export default function CrossChainTransfer() {
  const { address, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const [sourceChain, setSourceChain] = useState("")
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [usdcBalance, setUsdcBalance] = useState("0")
  const [showAnimation, setShowAnimation] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const [mintTxHash, setMintTxHash] = useState<string | null>(null)

  // Define supported networks with enhanced styling
  const supportedNetworks = [
    { 
      id: 'ethereum', 
      name: 'Ethereum', 
      symbol: 'ETH', 
      color: 'from-blue-500 to-blue-600', 
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      logo: chainLogos.ethereum,
      mainnet: true, 
      testnet: true 
    },
    { 
      id: 'arbitrum', 
      name: 'Arbitrum', 
      symbol: 'ARB', 
      color: 'from-blue-600 to-indigo-600', 
      bgColor: 'bg-blue-600/20',
      borderColor: 'border-blue-600/30',
      logo: chainLogos.arbitrum,
      mainnet: true, 
      testnet: true 
    },
    { 
      id: 'base', 
      name: 'Base', 
      symbol: 'BASE', 
      color: 'from-yellow-500 to-orange-500', 
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      logo: chainLogos.base,
      mainnet: true, 
      testnet: true 
    },
    { 
      id: 'avalanche', 
      name: 'Avalanche', 
      symbol: 'AVAX', 
      color: 'from-red-500 to-orange-500', 
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      logo: chainLogos.avalanche,
      mainnet: true, 
      testnet: true 
    },
    {
      id: 'linea',
      name: 'Linea Sepolia',
      symbol: 'LINEA',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-400/20',
      borderColor: 'border-green-400/30',
      logo: chainLogos.linea,
      mainnet: false,
      testnet: true
    },
  ]

  // USDC contract addresses and RPC URLs for testnets (from Circle docs)
  const chainConfig: Record<string, { chainId: number, rpcUrl: string, usdc: string }> = {
    ethereum: {
      chainId: 11155111,
      rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_API_KEY || ''}`,
      usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    },
    arbitrum: {
      chainId: 421614,
      rpcUrl: `https://arb-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_API_KEY || ''}`,
      usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    },
    base: {
      chainId: 84532,
      rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_API_KEY || ''}`,
      usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
    avalanche: {
      chainId: 43113,
      rpcUrl: `https://api.avax-test.network/ext/bc/C/rpc`,
      usdc: '0x5425890298aed601595a70AB815c96711a31Bc65',
    },
    linea: {
      chainId: 59141,
      rpcUrl: `https://linea-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_API_KEY || ''}`,
      usdc: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',
    },
  }

  // Update USDC balance when chain or address changes
  useEffect(() => {
    const fetchUSDCBalance = async () => {
      if (!isConnected || !address || !sourceChain) {
        setUsdcBalance("0")
        return
      }

      try {
        const config = chainConfig[sourceChain]
        if (!config) {
          setUsdcBalance("0")
          return
        }

        setUsdcBalance("updating...")
        
        // Direct RPC call to get USDC balance
        const response = await fetch(config.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              {
                to: config.usdc,
                data: `0x70a08231000000000000000000000000${address.slice(2)}`,
              },
              'latest',
            ],
          }),
        })
        
        const data = await response.json()
        const balance = data.result ? parseInt(data.result, 16) / 1e6 : 0 // USDC has 6 decimals
        setUsdcBalance(balance.toString())
      } catch (error) {
        console.error("Error fetching USDC balance:", error)
        setUsdcBalance("0")
      }
    }

    fetchUSDCBalance()
  }, [isConnected, address, sourceChain])

  const handleSend = async () => {
    if (!amount || !recipientAddress || !sourceChain || !destinationChain || !address) return

    setShowAnimation(true)
    setCurrentStep(0)
    setIsAnimationComplete(false)

    try {
      const mintTx = await bridgeUSDC({
        amount: BigInt(Math.floor(Number(amount) * 1e6)),
        recipient: recipientAddress,
        provider: window.ethereum,
        userAddress: address as `0x${string}`,
        source: sourceChain as string,
        destination: destinationChain as string,
        onStep: (step) => {
          const stepIndex = animationSteps.findIndex(s => s.id === step)
          if (stepIndex >= 0) setCurrentStep(stepIndex)
        },
      })
      setMintTxHash(mintTx)
      setIsAnimationComplete(true)
    } catch (e) {
      alert('Bridge failed: ' + (e as Error).message)
      setShowAnimation(false)
    }
  }

  const closeAnimation = () => {
    setShowAnimation(false)
    setCurrentStep(0)
    setIsAnimationComplete(false)
    // Reset form
    setAmount("")
    setRecipientAddress("")
  }

  return (
    <>
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <ArrowUpDown className="w-5 h-5 text-blue-400" />
            </motion.div>
            Move USDC Between Chains
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-6", !isConnected && "opacity-50 pointer-events-none")}>
          {/* Bridge Form */}
          <div className="space-y-6">
            {/* Chain Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  From Chain
                </Label>
                <Select value={sourceChain} onValueChange={setSourceChain} disabled={!isConnected}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-blue-500/50 transition-all duration-200">
                    <SelectValue placeholder="Select source chain" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 text-white border-gray-700/50 backdrop-blur-xl">
                    {supportedNetworks.map((chain) => (
                      <SelectItem 
                        key={chain.id} 
                        value={chain.id} 
                        className="bg-gray-900/95 text-white hover:bg-gray-800/80 focus:bg-gray-800/80 rounded-xl my-1"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{chain.logo}</span>
                          <span className="font-medium">{chain.name}</span>
                          <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", chain.color)}></div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  To Chain
                </Label>
                <Select value={destinationChain} onValueChange={setDestinationChain} disabled={!isConnected || !sourceChain}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-purple-500/50 transition-all duration-200">
                    <SelectValue placeholder="Select destination chain" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 text-white border-gray-700/50 backdrop-blur-xl">
                    {supportedNetworks.map((chain) => (
                      <SelectItem 
                        key={chain.id} 
                        value={chain.id} 
                        className="bg-gray-900/95 text-white hover:bg-gray-800/80 focus:bg-gray-800/80 rounded-xl my-1"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{chain.logo}</span>
                          <span className="font-medium">{chain.name}</span>
                          <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", chain.color)}></div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            </div>

            {/* Balance Display */}
            {sourceChain && (
              <motion.div 
                className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50 backdrop-blur-sm shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-400" />
                    USDC Balance
                  </span>
                  <motion.span 
                    className="font-bold text-lg text-white"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {usdcBalance} USDC
                  </motion.span>
                </div>
              </motion.div>
            )}

            {/* Amount Input */}
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Label className="text-sm font-semibold text-gray-200">Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 rounded-xl border-gray-600/50 pr-16 text-lg bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-blue-500/50 focus:border-blue-500 transition-all duration-200"
                  disabled={!isConnected}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">USDC</div>
              </div>
            </motion.div>

            {/* Recipient Address */}
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Label className="text-sm font-semibold text-gray-200">Recipient Address</Label>
              <Input
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-purple-500/50 focus:border-purple-500 transition-all duration-200 font-mono"
                disabled={!isConnected}
              />
            </motion.div>

            {/* Send Button */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSend}
                disabled={!isConnected || !amount || !recipientAddress || !sourceChain || !destinationChain}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-lg relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <ArrowUpDown className="mr-3 h-5 w-5" />
                Send USDC
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Animation Modal */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl"
            >
              {/* Close Button */}
              <motion.button
                onClick={closeAnimation}
                disabled={!isAnimationComplete}
                className="absolute top-6 right-6 h-10 w-10 p-0 rounded-full text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all duration-200 disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5 mx-auto" />
              </motion.button>

              <div className="text-center space-y-8">
                <motion.h3 
                  className="text-3xl font-bold text-white"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Processing Transaction
                </motion.h3>

                {/* Stepper: Only show if not complete */}
                {!isAnimationComplete && (
                  <>
                    {/* Circular Progress Indicator */}
                    <motion.div
                      className="flex justify-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="relative">
                        {/* Background Circle */}
                        <div className="w-24 h-24 rounded-full border-4 border-gray-700 flex items-center justify-center">
                          <div className="text-2xl font-bold text-white">
                            {currentStep + 1}/4
                          </div>
                        </div>
                        {/* Progress Circle */}
                        <svg className="absolute inset-0 w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="4"
                            strokeDasharray={`${((currentStep + 1) / 4) * 283} 283`}
                            className="transition-all duration-1000 ease-out"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#3B82F6" />
                              <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </motion.div>

                    {/* Current Step Display */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
                        className="space-y-4"
                      >
                        {/* Step Icon */}
                        <motion.div
                          className="text-6xl mb-4"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        >
                          {animationSteps[currentStep]?.icon}
                        </motion.div>

                        {/* Step Label */}
                        <motion.h4
                          className="text-xl font-bold text-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          {animationSteps[currentStep]?.label}
                        </motion.h4>

                        {/* Step Description */}
                        <motion.p
                          className="text-gray-400 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          {animationSteps[currentStep]?.description}
                        </motion.p>

                        {/* Loading Animation */}
                        <motion.div
                          className="flex justify-center mt-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <motion.div
                            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  </>
                )}

                {/* Completion State: Only show if complete */}
                {isAnimationComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                    className="space-y-6"
                  >
                    <motion.div 
                      className="text-green-400 text-6xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      ✅
                    </motion.div>
                    <div className="text-2xl font-bold text-green-300">Transaction Complete!</div>
                    <div className="text-gray-400">Your USDC has been successfully bridged.</div>
                    {/* Explorer Link Button (if mintTxHash is available) */}
                    {typeof mintTxHash === 'string' && mintTxHash && (
                      <button
                        className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-lg shadow-lg"
                        onClick={() => window.open(`${explorerUrls[destinationChain] || explorerUrls.avalanche}${mintTxHash}`, '_blank')}
                      >
                        View on Explorer
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 