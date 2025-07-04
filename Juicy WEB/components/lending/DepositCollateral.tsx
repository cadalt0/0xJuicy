"use client"


import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/lending-button"
import { Input } from "@/components/ui/lending-input"
import { Label } from "@/components/ui/lending-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lending-select"
import { Switch } from "@/components/ui/lending-switch"
import { Badge } from "@/components/ui/lending-badge"
import { 
  DollarSign, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Wallet,
  TrendingUp,
  Gift,
  CreditCard,
  CheckCircle,
  X,
  Brain,
  TrendingDown,
  Copy,
  AlertTriangle,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ethChains, chains } from "./chainData"
import { useWalletClient } from 'wagmi'
import { ethers } from 'ethers'

interface DepositCollateralProps {
  ethAmount: string
  setEthAmount: (value: string) => void
  ethChain: string
  setEthChain: (value: string) => void
  usdcChain: string
  setUsdcChain: (value: string) => void
  usdcAddress: string
  setUsdcAddress: (value: string) => void
  estimatedUsdc: string
  metaMaskBonus: boolean
  setMetaMaskBonus: (value: boolean) => void
  highSpenderBonus: boolean
  setHighSpenderBonus: (value: boolean) => void
  monthlyEthSpent: string
  isLending: boolean
  handleLendEth: () => void
}

export default function DepositCollateral({
  ethAmount,
  setEthAmount,
  ethChain,
  setEthChain,
  usdcChain,
  setUsdcChain,
  usdcAddress,
  setUsdcAddress,
  estimatedUsdc,
  metaMaskBonus,
  setMetaMaskBonus,
  highSpenderBonus,
  setHighSpenderBonus,
  monthlyEthSpent,
  isLending,
  handleLendEth
}: DepositCollateralProps) {
  const [customUsdcAmount, setCustomUsdcAmount] = useState("")
  const [usdcSliderValue, setUsdcSliderValue] = useState([80])
  const [isUsingCustomAmount, setIsUsingCustomAmount] = useState(false)
  const [cardVerificationStatus, setCardVerificationStatus] = useState<'idle' | 'verifying' | 'accepted' | 'rejected'>('idle')
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const [rejectionCount, setRejectionCount] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [transactionData, setTransactionData] = useState({
    usdcTxHash: '',
    collateralId: ''
  })
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [isLendingTx, setIsLendingTx] = useState(false)
  const [lendingError, setLendingError] = useState<string | null>(null)
  const { data: walletClient } = useWalletClient()
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [lendingStep, setLendingStep] = useState<'idle' | 'creating' | 'sending' | 'done'>('idle')

  useEffect(() => {
    if (walletClient) {
      const provider = new ethers.BrowserProvider(walletClient)
      provider.getSigner().then(setSigner)
    } else {
      setSigner(null)
    }
  }, [walletClient])

  // Calculate ETH value in USD and max USDC (80% of ETH value)
  const ethValue = ethAmount ? parseFloat(ethAmount) * 2500 : 0
  const maxUsdc = ethValue * 0.8
  
  // Calculate current USDC amount based on whether using custom input or slider
  const currentUsdcAmount = isUsingCustomAmount && customUsdcAmount ? 
    Math.min(parseFloat(customUsdcAmount) || 0, maxUsdc) : 
    (ethValue * (usdcSliderValue[0] / 100))
  
  const usdcPercentage = ethValue > 0 ? (currentUsdcAmount / ethValue) * 100 : 0

  // Calculate final USDC amount with bonuses for display
  const calculateFinalUsdcAmount = () => {
    let finalAmount = currentUsdcAmount
    
    // Apply bonuses
    if (metaMaskBonus) finalAmount *= 1.1 // 10% bonus
    if (highSpenderBonus) finalAmount *= 1.05
    
    return finalAmount
  }

  // Handle progress bar click with precise positioning - LIMIT TO 80%
  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = Math.min(Math.max((clickX / rect.width) * 100, 0), 80) // LIMIT TO 80%
    
    setUsdcSliderValue([percentage])
    setIsUsingCustomAmount(false)
    const newAmount = (ethValue * (percentage / 100)).toFixed(2)
    setCustomUsdcAmount(newAmount)
  }

  // Handle slider drag - LIMIT TO 80%
  const handleSliderDrag = (event: MouseEvent | TouchEvent) => {
    if (!progressBarRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const dragX = clientX - rect.left
    const percentage = Math.min(Math.max((dragX / rect.width) * 100, 0), 80) // LIMIT TO 80%
    
    setUsdcSliderValue([percentage])
    setIsUsingCustomAmount(false)
    const newAmount = (ethValue * (percentage / 100)).toFixed(2)
    setCustomUsdcAmount(newAmount)
  }

  // Mouse/Touch event handlers for dragging
  const handleSliderMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleSliderTouchStart = (event: React.TouchEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  // Global mouse/touch move and up handlers
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        handleSliderDrag(event)
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging) {
        event.preventDefault()
        handleSliderDrag(event)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging])

  // Handle custom input change
  const handleCustomAmountChange = (value: string) => {
    setCustomUsdcAmount(value)
    setIsUsingCustomAmount(true)
    
    // Update slider position based on custom amount
    if (value && ethValue > 0) {
      const percentage = Math.min((parseFloat(value) / ethValue) * 100, 80)
      setUsdcSliderValue([percentage])
    }
  }

  // Reset when ETH amount changes
  useEffect(() => {
    if (!isUsingCustomAmount) {
      const newAmount = (ethValue * (usdcSliderValue[0] / 100)).toFixed(2)
      setCustomUsdcAmount(newAmount)
    }
  }, [ethValue, usdcSliderValue, isUsingCustomAmount])

  // Handle Crypto Card verification (tick button click) - DOES BOTH ACTIONS
  const handleMetaMaskCardVerification = async () => {
    if (!usdcAddress) return
    
    // First: Set address to Linea
    setUsdcChain('linea')
    
    // Second: Start verification
    setCardVerificationStatus('verifying')
    
    // Simulate verification with 50/50 chance, but reject first time, accept second time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (rejectionCount === 0) {
      setCardVerificationStatus('rejected')
      setRejectionCount(1)
      setTimeout(() => {
        setCardVerificationStatus('idle')
      }, 3000)
    } else {
      setCardVerificationStatus('accepted')
      setShowAiAnalysis(true)
      
      // Show AI analysis popup
      setTimeout(() => {
        setShowAiAnalysis(false)
        setMetaMaskBonus(true)
        setHighSpenderBonus(true)
      }, 4000)
    }
  }

  // Handle lending with confirmation popup
  const handleLendingClick = async () => {
    if (!ethAmount || !ethChain || !usdcChain || !usdcAddress) return
    if (!signer) {
      setLendingError('Please connect your wallet.')
      return
    }
    setIsLendingTx(true)
    setLendingStep('creating')
    setLendingError(null)
    try {
      const { originateLoan } = await import("@/lib/lendingScript")
      const usdcAmount = customUsdcAmount && parseFloat(customUsdcAmount) > 0
        ? customUsdcAmount
        : (currentUsdcAmount > 0 ? currentUsdcAmount.toString() : "0")
      const chainMap: Record<string, "eth" | "linea"> = { ethereum: "eth", linea: "linea" }
      const ethChainParam = chainMap[ethChain] || "eth"
      const usdcChainParam = chainMap[usdcChain] || "eth"
      let result = null
      try {
        result = await originateLoan({
          ethAmount,
          usdcAmount,
          ethChain: ethChainParam,
          usdcChain: usdcChainParam,
          usdcAddress,
          signer,
          setStep: setLendingStep
        })
      } catch (err: any) {
        setLendingError(err.message || "Lending failed")
        setLendingStep('idle')
        setIsLendingTx(false)
        return
      }
      setTransactionData({
        usdcTxHash: result.usdcTxHash,
        collateralId: result.loanId
      })
      setShowConfirmation(true)
      setLendingStep('done')
      handleLendEth()
    } catch (err: any) {
      setLendingError(err.message || "Lending failed")
      setLendingStep('idle')
    } finally {
      setIsLendingTx(false)
    }
  }

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Get selected chain data
  const getSelectedEthChain = () => ethChains.find(chain => chain.id === ethChain)
  const getSelectedUsdcChain = () => chains.find(chain => chain.id === usdcChain)

  // Filtered chain options for dropdowns
  const filteredEthChains = ethChains.filter(chain => chain.id === 'ethereum' || chain.id === 'linea')
  const filteredUsdcChains = chains.filter(chain => chain.id === 'ethereum' || chain.id === 'linea')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ETH Amount & Chain - SEPARATE LINE */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          ETH Amount & Chain
        </Label>
        <div className="flex rounded-xl border border-gray-600/50 bg-gray-800/50 backdrop-blur-sm shadow-lg hover:border-purple-500/50 transition-all duration-200 overflow-hidden">
          {/* Chain Selector FIRST - LEFT SIDE */}
          <div className="border-r border-gray-600/50">
            <Select value={ethChain} onValueChange={setEthChain}>
              <SelectTrigger className="h-10 w-28 border-0 bg-transparent text-white focus:ring-0 rounded-none [&>svg]:hidden">
                <div className="flex items-center gap-1">
                  {getSelectedEthChain() ? (
                    <>
                      <span className="text-sm font-medium text-white">{getSelectedEthChain()?.name}</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 text-sm">Chain</span>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                {filteredEthChains.map((chain) => (
                  <SelectItem 
                    key={chain.id} 
                    value={chain.id}
                    className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80 focus:text-white rounded-xl my-1"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{chain.logo}</span>
                      <span className="font-medium text-white">{chain.name}</span>
                      <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", chain.color)}></div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* ETH Amount Input SECOND - RIGHT SIDE */}
          <div className="flex-1 relative">
            <Input
              type="number"
              placeholder="0.00"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="h-10 border-0 bg-transparent text-white pr-12 focus:ring-0 focus:border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">ETH</div>
          </div>
        </div>
      </motion.div>

      {/* USDC Address & Chain - SEPARATE LINE */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-green-400" />
          USDC Address & Chain
        </Label>
        <div className="space-y-2">
          {/* Main USDC Input */}
          <div className="flex rounded-xl border border-gray-600/50 bg-gray-800/50 backdrop-blur-sm shadow-lg hover:border-green-500/50 transition-all duration-200 overflow-hidden">
            {/* Chain Selector FIRST - LEFT SIDE */}
            <div className="border-r border-gray-600/50">
              <Select value={usdcChain} onValueChange={setUsdcChain}>
                <SelectTrigger className="h-10 w-28 border-0 bg-transparent text-white focus:ring-0 rounded-none [&>svg]:hidden">
                  <div className="flex items-center gap-1">
                    {getSelectedUsdcChain() ? (
                      <>
                        <span className="text-sm font-medium text-white">{getSelectedUsdcChain()?.name}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400 text-sm">Chain</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                  {filteredUsdcChains.map((chain) => (
                    <SelectItem 
                      key={chain.id} 
                      value={chain.id}
                      className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80 focus:text-white rounded-xl my-1"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{chain.logo}</span>
                        <span className="font-medium text-white">{chain.name}</span>
                        <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", chain.color)}></div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* USDC Address Input SECOND - RIGHT SIDE */}
            <div className="flex-1">
              <Input
                placeholder="0x... (USDC address)"
                value={usdcAddress}
                onChange={(e) => setUsdcAddress(e.target.value)}
                className="h-10 border-0 bg-transparent text-white font-mono text-sm focus:ring-0 focus:border-0"
              />
            </div>
          </div>

          {/* Crypto Card - NO TOGGLE, JUST TICK BUTTON */}
          <div className="flex items-center justify-between bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-white font-medium text-sm">Crypto Card</span>
                <p className="text-xs text-purple-300">
                  {cardVerificationStatus === 'accepted' 
                    ? "✓ Verified - 10% discount applied" 
                    : "Receive up to 10% extra in MetaMask wallet"
                  }
                </p>
              </div>
            </div>
            
            {/* Tick Button - DOES BOTH: Set to Linea + Verify */}
            <Button
              onClick={handleMetaMaskCardVerification}
              disabled={!usdcAddress || cardVerificationStatus === 'verifying'}
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all duration-200",
                cardVerificationStatus === 'accepted' 
                  ? "bg-green-600 hover:bg-green-700" 
                  : cardVerificationStatus === 'rejected'
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {cardVerificationStatus === 'verifying' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : cardVerificationStatus === 'accepted' ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : cardVerificationStatus === 'rejected' ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <span className="text-white text-xs font-bold">✓</span>
              )}
            </Button>
          </div>

          {/* Verification Status - ONLY SHOW REJECTION */}
          <AnimatePresence>
            {cardVerificationStatus === 'rejected' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-900/50 border border-red-500/30 rounded-lg p-2 flex items-center gap-2"
              >
                <X className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-red-300 font-medium text-xs">Verification Failed</p>
                  <p className="text-red-400/80 text-xs">Please try again with a valid Crypto Card address</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Interactive Progress Bar with Circle Slider - 0-100% SCALE BUT 80% LIMIT */}
      <motion.div 
        className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-4 border border-gray-600/30 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="space-y-3">
          {/* Interactive Progress Bar with Draggable Circle */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Loan-to-Value Ratio (Drag circle or click to adjust)</span>
              <span className="text-white font-semibold">{usdcPercentage.toFixed(1)}%</span>
            </div>
            <div 
              ref={progressBarRef}
              className="relative w-full bg-gray-700 rounded-full h-4 overflow-visible cursor-pointer hover:bg-gray-600 transition-colors duration-200"
              onClick={handleProgressBarClick}
            >
              <motion.div
                className={cn(
                  "h-full transition-all duration-300 relative rounded-full",
                  usdcPercentage <= 40 ? "bg-gradient-to-r from-green-500 to-green-600" :
                  usdcPercentage <= 60 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                  usdcPercentage <= 80 ? "bg-gradient-to-r from-orange-500 to-red-500" :
                  "bg-gradient-to-r from-red-500 to-red-600"
                )}
                style={{ width: `${usdcPercentage}%` }} // SHOW ACTUAL PERCENTAGE
                animate={{ 
                  boxShadow: usdcPercentage > 0 ? [
                    "0 0 0px rgba(34, 197, 94, 0.5)",
                    "0 0 15px rgba(34, 197, 94, 0.8)",
                    "0 0 0px rgba(34, 197, 94, 0.5)"
                  ] : "none"
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Percentage markers - 0% to 100% */}
              <div className="absolute top-0 h-full w-0.5 bg-white/20" style={{ left: '20%' }}></div>
              <div className="absolute top-0 h-full w-0.5 bg-white/20" style={{ left: '40%' }}></div>
              <div className="absolute top-0 h-full w-0.5 bg-white/20" style={{ left: '60%' }}></div>
              <div className="absolute top-0 h-full w-0.5 bg-white/40" style={{ left: '80%' }}></div>
              <div className="absolute top-0 h-full w-0.5 bg-white/10" style={{ left: '100%' }}></div>
              
              {/* 80% Limit Line - Visual indicator */}
              <div className="absolute top-0 h-full w-1 bg-red-500/60 rounded-full" style={{ left: '80%', marginLeft: '-2px' }}></div>
              
              {/* Draggable Circle Slider */}
              <motion.div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing transition-all duration-200",
                  isDragging ? "scale-110 shadow-xl" : "hover:scale-105",
                  usdcPercentage <= 40 ? "bg-green-500" :
                  usdcPercentage <= 60 ? "bg-yellow-500" :
                  usdcPercentage <= 80 ? "bg-orange-500" :
                  "bg-red-500"
                )}
                style={{ 
                  left: `${usdcPercentage}%`, // POSITION BASED ON ACTUAL PERCENTAGE
                  marginLeft: '-12px' // Half of circle width to center it
                }}
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleSliderTouchStart}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 1.15 }}
                animate={{
                  boxShadow: isDragging ? [
                    "0 0 0px rgba(255, 255, 255, 0.5)",
                    "0 0 20px rgba(255, 255, 255, 0.8)",
                    "0 0 0px rgba(255, 255, 255, 0.5)"
                  ] : "0 4px 8px rgba(0, 0, 0, 0.3)"
                }}
                transition={{ duration: isDragging ? 0.5 : 0.2, repeat: isDragging ? Infinity : 0 }}
              >
                {/* Inner circle for better visual */}
                <div className="absolute inset-1 bg-white rounded-full opacity-80"></div>
              </motion.div>
              
              {/* Click indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <span className="text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded">Drag circle or click to adjust (Max 80%)</span>
              </div>
            </div>
            
            {/* Scale labels - 0% to 100% */}
            <div className="flex justify-between text-xs text-gray-400 px-2">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span className="text-red-400 font-semibold">80%</span>
              <span className="text-gray-600">100%</span>
            </div>
          </div>

          {/* Custom USDC Amount Input */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-200">
              Or Enter Custom USDC Amount
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder={`Max: $${maxUsdc.toLocaleString()}`}
                value={customUsdcAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="h-10 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-green-500/50 focus:border-green-500 transition-all duration-200 pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">USDC</div>
            </div>
            {customUsdcAmount && parseFloat(customUsdcAmount) > maxUsdc && (
              <motion.p 
                className="text-red-400 text-xs flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <TrendingDown className="w-3 h-3" />
                Amount exceeds 80% of collateral value
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Estimated Output */}
      <motion.div 
        className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-3 border border-gray-600/30 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Base Amount:</span>
            <span className="text-lg font-bold text-white">
              ${currentUsdcAmount.toFixed(2)} USDC
            </span>
          </div>
          
          {(metaMaskBonus || highSpenderBonus) && (
            <div className="space-y-1 pt-2 border-t border-gray-600/30">
              {metaMaskBonus && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-300 text-xs">Crypto Card Bonus (+10%):</span>
                  <span className="text-purple-400 font-semibold text-xs">
                    +${(currentUsdcAmount * 0.1).toFixed(2)}
                  </span>
                </div>
              )}
              {highSpenderBonus && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-300 text-xs">High Spender Bonus (+5%):</span>
                  <span className="text-green-400 font-semibold text-xs">
                    +${(currentUsdcAmount * (metaMaskBonus ? 1.1 : 1) * 0.05).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
            <span className="text-gray-300 font-semibold text-sm">You will receive:</span>
            <motion.span 
              className="text-xl font-bold text-green-400"
              animate={{ scale: currentUsdcAmount > 0 ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              ${calculateFinalUsdcAmount().toFixed(2)} USDC
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Lend Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleLendingClick}
            disabled={!ethAmount || !ethChain || !usdcChain || !usdcAddress || isLending || isLendingTx}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
              initial={{ x: '-100%' }}
              animate={{ x: isLending || isLendingTx ? '100%' : '-100%' }}
              transition={{ duration: 1.5, repeat: isLending || isLendingTx ? Infinity : 0, ease: "linear" }}
            />
            {isLending || isLendingTx ? (
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                />
                Processing Loan...
              </div>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Lend ETH for USDC
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
        {lendingError && (
          <div className="text-red-400 text-sm mt-2">{lendingError}</div>
        )}
      </motion.div>

      {/* AI Analysis Popup */}
      <AnimatePresence>
        {showAiAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-gray-900/70 to-blue-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-white mb-2"
              >
                AI Analyzing...
              </motion.h3>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 text-left"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="flex items-center gap-2 text-green-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Found good transaction history</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center gap-2 text-purple-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Crypto Card address bonus +10%</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2 }}
                  className="flex items-center gap-2 text-green-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">High spender bonus +5%</span>
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="text-gray-400 text-xs mt-4"
              >
                Applying bonuses to your loan...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Popup */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-gray-900/70 to-blue-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">Transaction Confirmed!</h3>
                <p className="text-gray-400">Your ETH has been successfully deposited as collateral</p>
              </div>

              <div className="space-y-4">
                {/* USDC Sent Tx Hash */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">USDC Sent Tx Hash:</span>
                    <Button
                      onClick={() => copyToClipboard(transactionData.usdcTxHash)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs font-mono text-blue-400 break-all">{transactionData.usdcTxHash}</p>
                </div>

                {/* Collateral ID */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">Collateral ID:</span>
                    <Button
                      onClick={() => copyToClipboard(transactionData.collateralId)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-lg font-bold text-green-400">{transactionData.collateralId}</p>
                </div>

                {/* Warning */}
                <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-orange-300 font-medium text-sm mb-1">Important!</p>
                    <p className="text-orange-400/80 text-xs">
                      Keep your Collateral ID safe. You'll need it to claim your ETH collateral back.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowConfirmation(false)}
                className="w-full mt-6 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Got it!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lending Step Modal */}
      <AnimatePresence>
        {(isLendingTx && lendingStep !== 'idle' && lendingStep !== 'done') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-gray-900/70 to-blue-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">
                {lendingStep === 'creating' && 'Creating Loan...'}
                {lendingStep === 'sending' && 'Sending USDC...'}
              </h3>
              <p className="text-gray-400 text-sm">
                {lendingStep === 'creating' && 'Waiting for your wallet to confirm and for the transaction to be mined.'}
                {lendingStep === 'sending' && 'Sending USDC to the provided address on the selected chain.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}