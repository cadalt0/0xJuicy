"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, QrCode, Share, Clock, Sparkles, Zap, CheckCircle, X, ArrowRight, Timer, Link, Wallet, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RequestTabProps {
  walletAddress: string;
  isGoogleLoggedIn: boolean;
  userEmail?: string;
  userName?: string;
}

// Enhanced chain data with logos and colors
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
    id: 'avalanche', 
    name: 'Avalanche', 
    logo: '❄️',
    color: 'from-red-500 to-orange-500', 
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30'
  },
]

export default function RequestTab({ walletAddress, isGoogleLoggedIn, userEmail = '', userName = '' }: RequestTabProps) {
  const [requestChain, setRequestChain] = useState("")
  const [requestAmount, setRequestAmount] = useState("")
  const [requestLink, setRequestLink] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [requestCode, setRequestCode] = useState("")
  const [copiedText, setCopiedText] = useState("")

  // Helper to generate random 10-digit code
  function generateRandomCode() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }
  
  // Helper to generate random 3-digit decimal
  function randomThreeDigits() {
    return Math.floor(100 + Math.random() * 900).toString();
  }

  // Helper to mathematically add random 3 digits to last 3 decimals, never exceeding 6 decimals
  function addRandomToLast3Decimals(amount: string, random: string): string {
    let [intPart, decPart = ''] = amount.toString().split('.')
    decPart = decPart.padEnd(6, '0').slice(0, 6) // always 6 decimals
    const before = decPart.slice(0, 3)
    const last3 = decPart.slice(3)
    let sum = (parseInt(last3, 10) + parseInt(random, 10)).toString().padStart(3, '0')
    let carry = 0
    let newLast3 = sum
    if (sum.length > 3) {
      carry = parseInt(sum.slice(0, sum.length - 3), 10)
      newLast3 = sum.slice(-3)
    }
    let newBefore = (parseInt(before, 10) + carry).toString().padStart(3, '0')
    let newDec = (newBefore + newLast3).slice(0, 6)
    // Remove trailing zeros after the 6th decimal
    newDec = newDec.replace(/0+$/, '') || '0'
    return intPart + '.' + newDec
  }

  const createRequest = async () => {
    if (!requestChain || !requestAmount || !isGoogleLoggedIn) return;
    setIsCreating(true);
    
    // 1. Generate random 10-digit code
    const code = generateRandomCode();
    setRequestCode(code);
    
    // 2. Get logged in email, name, amount, chain, wallet address
    const baseAmount = requestAmount.toString();
    const random = randomThreeDigits();
    const finalAmount = addRandomToLast3Decimals(baseAmount, random);
    const apiBase = process.env.NEXT_PUBLIC_WALLET_API_BASE;
    
    // Handle Avalanche as Ethereum in backend
    const backendChain = requestChain === 'avalanche' ? 'ethereum' : requestChain;
    
    const payload = {
      request_id: code,
      mail_address: userEmail,
      amount: finalAmount,
      chain: backendChain,
      wallet_address: walletAddress,
      name: userName,
    };
    
    try {
      const res = await fetch(`${apiBase}/api/quick-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setRequestLink(`${window.location.origin}/quick-request/${code}`);
      } else {
        setRequestLink("");
        setRequestCode("");
        alert('Failed to create request');
      }
    } catch (e) {
      setRequestLink("");
      setRequestCode("");
      alert('Failed to create request');
    }
    setIsCreating(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(""), 2000)
  }

  const cancelRequest = () => {
    setRequestLink("");
    setRequestCode("");
  }

  const selectedChain = supportedChains.find(chain => chain.id === requestChain)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <QrCode className="w-5 h-5 text-purple-400" />
            </motion.div>
            Create Payment Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {requestLink ? (
              /* Request Created View */
              <motion.div
                key="created"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-6"
              >
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  className="flex justify-center mb-4"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25"
                    >
                      <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-green-400 mb-2"
                >
                  Request Created Successfully!
                </motion.h3>

                {/* Request Code */}
                <div
                  className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50"
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1">Request Code</p>
                    <p className="text-2xl font-bold text-white font-mono tracking-wider">
                      {requestCode}
                    </p>
                  </div>
                </div>

                {/* Share Link */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Link className="w-4 h-4 text-blue-400" />
                    Share this link:
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={requestLink}
                      readOnly
                      className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white text-sm font-mono backdrop-blur-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(requestLink, "Link")}
                      className="h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      className="h-12 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Cancel Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    onClick={cancelRequest}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-700/80 hover:to-red-800/80 text-white border border-red-500/30 transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Request
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              /* Create Request Form */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Chain Selection */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Select Chain
                  </Label>
                  <Select value={requestChain} onValueChange={setRequestChain}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-purple-500/50 transition-all duration-200">
                      <SelectValue placeholder="Choose blockchain network" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 text-white border-gray-700/50 backdrop-blur-xl">
                      {supportedChains.map((chain) => (
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

                {/* Amount Input */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Amount (USDC)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-yellow-500/50 focus:border-yellow-500 transition-all duration-200 pr-16 text-lg"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">USDC</div>
                  </div>
                </motion.div>

                {/* Receiving Address */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-400" />
                    Receiving Address
                  </Label>
                  <Input
                    value={walletAddress ? walletAddress : "Wallet not connected"}
                    readOnly
                    className="h-12 rounded-xl border-gray-600/50 bg-gray-800/50 text-gray-300 cursor-not-allowed backdrop-blur-sm font-mono"
                  />
                  <motion.div 
                    className="text-xs text-gray-400 italic mt-1 flex items-center gap-1"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span>💡</span>
                    Please connect the wallet for your chosen chain to receive payments.
                  </motion.div>
                </motion.div>

                {/* Create Request Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={createRequest}
                      disabled={!requestChain || !requestAmount || !isGoogleLoggedIn || isCreating}
                      className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-lg relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        initial={{ x: '-100%' }}
                        animate={{ x: isCreating ? '100%' : '-100%' }}
                        transition={{ duration: 1.5, repeat: isCreating ? Infinity : 0, ease: "linear" }}
                      />
                      {isCreating ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                          />
                          Creating Request...
                        </div>
                      ) : (
                        <>
                          <QrCode className="mr-3 h-5 w-5" />
                          Create Payment Request
                          <ArrowRight className="ml-3 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Progress Bar */}
                  <AnimatePresence>
                    {isCreating && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2"
                      >
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                          />
                        </div>
                        <motion.p 
                          className="text-center text-sm text-gray-400"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Generating secure payment request...
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Warning */}
                  <AnimatePresence>
                    {!isGoogleLoggedIn && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-4 p-4 bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30 rounded-xl backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <span className="text-2xl">⚠️</span>
                          </motion.div>
                          <div>
                            <p className="text-red-300 font-semibold text-sm">Google Login Required</p>
                            <p className="text-red-400/80 text-xs mt-1">
                              You must be logged in with Google to create payment requests.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Copy Notification */}
      <AnimatePresence>
        {copiedText && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 border border-green-500/30"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">{copiedText} Copied!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}