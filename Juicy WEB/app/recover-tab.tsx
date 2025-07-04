"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Search, Shield, AlertTriangle, CheckCircle, Zap, Sparkles, Clock, ArrowRight, Copy, ExternalLink, Wallet, FileText, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppKitAccount } from '@reown/appkit/react'
import { recoverUSDC } from '@/lib/cctpBridge'

// Enhanced chain data with logos and colors
const chains = [
  { 
    id: "ethereum", 
    name: "Ethereum", 
    symbol: "ETH", 
    logo: "⟠",
    color: "from-blue-500 to-blue-600", 
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30"
  },
  { 
    id: "arbitrum", 
    name: "Arbitrum", 
    symbol: "ARB", 
    logo: "🔷",
    color: "from-blue-600 to-indigo-600", 
    bgColor: "bg-blue-600/20",
    borderColor: "border-blue-600/30"
  },
  { 
    id: "base", 
    name: "Base", 
    symbol: "BASE", 
    logo: "🔵",
    color: "from-blue-400 to-cyan-500", 
    bgColor: "bg-blue-400/20",
    borderColor: "border-blue-400/30"
  },
  { 
    id: "avalanche", 
    name: "Avalanche", 
    symbol: "AVAX", 
    logo: "🔺",
    color: "from-red-600 to-pink-600", 
    bgColor: "bg-red-600/20",
    borderColor: "border-red-600/30"
  },
  {
    id: 'linea',
    name: 'Linea Sepolia',
    symbol: 'LINEA',
    logo: '🟢',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-400/20',
    borderColor: 'border-green-400/30'
  },
]

const recoverySteps = [
  { id: "validate", label: "Validating Signature", icon: "🔍", description: "Verifying transaction signature" },
  { id: "locate", label: "Locating Funds", icon: "📍", description: "Finding stuck funds on blockchain" },
  { id: "prepare", label: "Preparing Recovery", icon: "⚙️", description: "Setting up recovery transaction" },
  { id: "execute", label: "Executing Recovery", icon: "🚀", description: "Processing fund recovery" },
  { id: "complete", label: "Recovery Complete", icon: "✅", description: "Funds successfully recovered" },
]

const explorerUrls: Record<string, string> = {
  ethereum: 'https://sepolia.etherscan.io/tx/',
  arbitrum: 'https://sepolia.arbiscan.io/tx/',
  base: 'https://sepolia.basescan.org/tx/',
  avalanche: 'https://testnet.snowtrace.io/tx/',
}

export default function RecoverTab() {
  const { address, isConnected } = useAppKitAccount()
  const [burnedSignature, setBurnedSignature] = useState("")
  const [sourceChain, setSourceChain] = useState("")
  const [destinedWallet, setDestinedWallet] = useState("")
  const [destinationChain, setDestinationChain] = useState("")
  const [isRecovering, setIsRecovering] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isRecoveryComplete, setIsRecoveryComplete] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [copiedText, setCopiedText] = useState("")
  const [recoveryTxHash, setRecoveryTxHash] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const selectedSourceChain = chains.find(chain => chain.id === sourceChain)
  const selectedDestChain = chains.find(chain => chain.id === destinationChain)

  const handleRecover = async () => {
    if (!burnedSignature || !sourceChain || !destinedWallet || !destinationChain || !address || !isConnected) return
    
    setIsRecovering(true)
    setShowRecoveryModal(true)
    setCurrentStep(0)
    setIsRecoveryComplete(false)
    setErrorMessage("")

    try {
      const recoveryTx = await recoverUSDC({
        burnTxHash: burnedSignature,
        sourceChain: sourceChain,
        destinationChain: destinationChain,
        destinationWallet: destinedWallet,
        provider: window.ethereum,
        userAddress: address as `0x${string}`,
        onStep: (step) => {
          const stepIndex = recoverySteps.findIndex(s => s.id === step)
          if (stepIndex >= 0) setCurrentStep(stepIndex)
        },
      })
      
      setRecoveryTxHash(recoveryTx)
      setIsRecoveryComplete(true)
    } catch (error) {
      console.error('Recovery failed:', error)
      setErrorMessage((error as Error).message || 'Recovery failed')
    } finally {
      setIsRecovering(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(""), 2000)
  }

  const closeRecoveryModal = () => {
    setShowRecoveryModal(false)
    setCurrentStep(0)
    setIsRecoveryComplete(false)
    setIsRecovering(false)
    setErrorMessage("")
    // Reset form
    setBurnedSignature("")
    setSourceChain("")
    setDestinedWallet("")
    setDestinationChain("")
  }

  return (
    <div
      className="animate-in fade-in-0 slide-in-from-bottom-4 duration-600"
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
            <div
              className="animate-spin"
            >
              <RefreshCw className="w-5 h-5 text-orange-400" />
            </div>
            Recover Funds
          </CardTitle>
          <p 
            className="text-sm text-gray-300 animate-in fade-in-0 delay-200"
          >
            Recover stuck or failed cross-chain transfers safely using Circle's CCTP protocol
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Banner */}
          <div
            className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-500/30 rounded-xl p-4 backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-4 delay-100"
          >
            <div className="flex items-center gap-3">
              <div
                className="animate-pulse"
              >
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-300 font-semibold text-sm">Recovery Process</p>
                <p className="text-orange-400/80 text-xs mt-1">
                  Only use this feature if your cross-chain transfer is genuinely stuck. Recovery may take time.
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div
              className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-4"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-300 font-semibold text-sm">Wallet Not Connected</p>
                  <p className="text-red-400/80 text-xs mt-1">
                    Please connect your wallet to initiate recovery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Source Chain and Destination Chain - Same Line */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-left-4 delay-200"
          >
            {/* Source Chain (Where funds are stuck) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                Source Chain
              </Label>
              <div
                className="hover:scale-[1.01] transition-transform duration-300"
              >
                <Select
                  value={sourceChain}
                  onValueChange={(value) => setSourceChain(value)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-red-500/50 focus:border-red-500 transition-all duration-200 font-mono">
                    <SelectValue placeholder="Where funds are stuck" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div 
                className="text-xs text-gray-400 italic mt-1 flex items-center gap-1 animate-pulse"
              >
                <span>⚠️</span>
                Where your USDC was burned
              </div>
            </div>

            {/* Destination Chain */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Destination Chain
              </Label>
              <div
                className="hover:scale-[1.01] transition-transform duration-300"
              >
                <Select
                  value={destinationChain}
                  onValueChange={(value) => setDestinationChain(value)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-purple-500/50 focus:border-purple-500 transition-all duration-200 font-mono">
                    <SelectValue placeholder="Where to receive funds" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div 
                className="text-xs text-gray-400 italic mt-1 flex items-center gap-1 animate-pulse"
              >
                <span>🎯</span>
                Where to receive USDC
              </div>
            </div>
          </div>

          {/* Burned Signature */}
          <div 
            className="space-y-2 animate-in fade-in-0 slide-in-from-left-4 delay-300"
          >
            <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Burned Transaction Signature
            </Label>
            <div
              className="hover:scale-[1.01] transition-transform duration-300"
            >
              <Textarea
                placeholder="Enter the burned transaction signature (0x...)"
                value={burnedSignature}
                onChange={(e) => setBurnedSignature(e.target.value)}
                className="min-h-[120px] rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-blue-500/50 focus:border-blue-500 transition-all duration-200 font-mono text-sm resize-none"
              />
            </div>
            <div 
              className="text-xs text-gray-400 italic mt-1 flex items-center gap-1 animate-pulse"
            >
              <span>💡</span>
              This is the transaction hash where your USDC was burned on the source chain
            </div>
          </div>

          {/* Destination Wallet */}
          <div 
            className="space-y-2 animate-in fade-in-0 slide-in-from-left-4 delay-400"
          >
            <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Destination Wallet Address
            </Label>
            <div
              className="hover:scale-[1.01] transition-transform duration-300"
            >
              <Input
                placeholder="0x... (wallet address to recover funds to)"
                value={destinedWallet}
                onChange={(e) => setDestinedWallet(e.target.value)}
                className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-green-500/50 focus:border-green-500 transition-all duration-200 font-mono"
              />
            </div>
            <div 
              className="text-xs text-gray-400 italic mt-1 flex items-center gap-1 animate-pulse"
            >
              <span>🎯</span>
              Recovered funds will be sent to this address
            </div>
          </div>

          {/* Recovery Progress Indicator */}
          <AnimatePresence>
            {(burnedSignature || sourceChain || destinedWallet || destinationChain) && (
              <div
                className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Recovery Readiness</span>
                    <span className="text-xs text-gray-400">
                      {[burnedSignature, sourceChain, destinedWallet, destinationChain].filter(Boolean).length}/4 Complete
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Source Chain", value: sourceChain, icon: FileText, color: "text-red-400" },
                      { label: "Transaction Signature", value: burnedSignature, icon: FileText, color: "text-blue-400" },
                      { label: "Destination Wallet", value: destinedWallet, icon: Wallet, color: "text-green-400" },
                      { label: "Destination Chain", value: destinationChain, icon: Target, color: "text-purple-400" }
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 animate-in fade-in-0 slide-in-from-left-4"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div
                          className={item.value ? "scale-110 transition-transform duration-500" : ""}
                        >
                          {item.value ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                          )}
                        </div>
                        <span className={cn("text-sm", item.value ? "text-green-300" : "text-gray-400")}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Recover Button */}
          <div
            className="animate-in fade-in-0 slide-in-from-bottom-4 delay-600"
          >
            <div
              className="hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
            >
              <Button
                onClick={handleRecover}
                disabled={!burnedSignature || !sourceChain || !destinedWallet || !destinationChain || isRecovering || !isConnected}
                className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-lg relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  style={{
                    transform: isRecovering ? 'translateX(100%)' : 'translateX(-100%)',
                    transition: 'transform 1.5s linear',
                    animation: isRecovering ? 'shimmer 1.5s infinite linear' : 'none'
                  }}
                />
                {isRecovering ? (
                  <div className="flex items-center justify-center">
                    <div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3 animate-spin"
                    />
                    Recovering Funds...
                  </div>
                ) : (
                  <>
                    <Shield className="mr-3 h-5 w-5" />
                    Initiate Recovery Process
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div
              className="mt-4 p-3 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-500/30 rounded-xl backdrop-blur-sm animate-in fade-in-0 delay-700"
            >
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Shield className="w-4 h-4" />
                <span className="font-semibold">Secure Recovery Process</span>
              </div>
              <p className="text-blue-400/80 text-xs mt-1">
                Your recovery is processed through Circle's CCTP protocol with full cryptographic verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Process Modal */}
      <AnimatePresence>
        {showRecoveryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in-0"
          >
            <div
              className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl animate-in fade-in-0 slide-in-from-bottom-4"
            >
              {/* Close Button */}
              <button
                onClick={closeRecoveryModal}
                disabled={isRecovering}
                className="absolute top-6 right-6 h-10 w-10 p-0 rounded-full text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-90"
              >
                <RefreshCw className="h-5 w-5 mx-auto" />
              </button>

              <div className="text-center space-y-8">
                <h3 
                  className="text-3xl font-bold text-white animate-in fade-in-0 slide-in-from-top-4 delay-200"
                >
                  Fund Recovery in Progress
                </h3>

                {/* Error Message */}
                {errorMessage && (
                  <div
                    className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/30 rounded-xl p-4 animate-in fade-in-0 scale-in-95"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-red-300 font-semibold text-sm">Recovery Failed</p>
                        <p className="text-red-400/80 text-xs mt-1">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recovery Steps - Show only current step */}
                <div className="space-y-6">
                  {recoverySteps.slice(currentStep, currentStep + 1).map((step, index) => (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center space-x-4 p-6 rounded-2xl transition-all duration-500 border animate-in fade-in-0 slide-in-from-left-4",
                        "bg-gradient-to-r from-orange-900/50 to-red-900/50 border-orange-500/50 shadow-lg shadow-orange-500/25"
                      )}
                    >
                      <div
                        className="text-3xl animate-bounce"
                      >
                        {step.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-lg text-orange-300">
                          {step.label}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {isRecoveryComplete && (
                  <div
                    className="space-y-6 animate-in fade-in-0 scale-in-95 delay-300"
                  >
                    <div 
                      className="text-green-400 text-6xl animate-pulse"
                    >
                      ✅
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-300 mb-2">Recovery Successful!</p>
                      <p className="text-gray-400">Your funds have been successfully recovered and sent to your destination wallet.</p>
                    </div>

                    {/* Transaction Hash */}
                    <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Recovery Transaction:</p>
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-700 rounded-lg p-2 flex-1 text-xs font-mono text-center text-white">
                            {recoveryTxHash.slice(0, 20)}...{recoveryTxHash.slice(-16)}
                          </div>
                          <button
                            onClick={() => copyToClipboard(recoveryTxHash, 'Transaction Hash')}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors hover:scale-110 active:scale-90"
                          >
                            <Copy className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => window.open(`${explorerUrls.ethereum}${recoveryTxHash}`, '_blank')}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors hover:scale-110 active:scale-90"
                          >
                            <ExternalLink className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Copy Notification */}
      <AnimatePresence>
        {copiedText && (
          <div
            className="fixed top-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-green-500/30 animate-in fade-in-0 slide-in-from-top-4"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">{copiedText} Copied!</span>
            </div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}