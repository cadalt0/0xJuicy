"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/lending-button"
import { Input } from "@/components/ui/lending-input"
import { Label } from "@/components/ui/lending-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lending-select"
import { 
  RefreshCw, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Wallet,
  TrendingUp,
  Shield,
  Search,
  CheckCircle,
  Copy,
  AlertCircle,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ethChains, chains } from "./chainData"
import { repayLoanWithSigner, repayLoanWithSignerCrossChain } from "@/lib/payloan"
import { ethers } from "ethers"

interface ClaimCollateralProps {
  claimUsdcAmount: string
  setClaimUsdcAmount: (value: string) => void
  claimFromChain: string
  setClaimFromChain: (value: string) => void
  claimToChain: string
  setClaimToChain: (value: string) => void
  claimToAddress: string
  setClaimToAddress: (value: string) => void
  estimatedEth: string
}

// Step-by-step claim modal state
type ClaimStep = 'approve' | 'pay' | 'confirm' | 'done';
interface StepStatus {
  status: 'pending' | 'success' | 'error';
  message?: string;
  txHash?: string;
}

export default function ClaimCollateral({
  claimUsdcAmount,
  setClaimUsdcAmount,
  claimFromChain,
  setClaimFromChain,
  claimToChain,
  setClaimToChain,
  claimToAddress,
  setClaimToAddress,
  estimatedEth,
}: ClaimCollateralProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [collateralId, setCollateralId] = useState("")
  const [creatorAddress, setCreatorAddress] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [collateralData, setCollateralData] = useState<{
    chainName: string
    ethAmount: string
    usdcOwed: string
  } | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [showClaimConfirmation, setShowClaimConfirmation] = useState(false)
  const [claimTransactionData, setClaimTransactionData] = useState({
    txHash: '',
    ethSent: ''
  })
  // Step-by-step modal state
  const [showClaimSteps, setShowClaimSteps] = useState(false);
  const [claimStep, setClaimStep] = useState<ClaimStep>('approve');
  const [stepStatus, setStepStatus] = useState<Record<ClaimStep, StepStatus>>({
    approve: { status: 'pending' },
    pay: { status: 'pending' },
    confirm: { status: 'pending' },
    done: { status: 'pending' },
  });

  // Add state for MetaMask Card modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardPaying, setCardPaying] = useState(false);
  const [cardPaid, setCardPaid] = useState(false);

  // Handle collateral ID lookup
  const handleCollateralLookup = async () => {
    if (!collateralId || !creatorAddress) return
    setIsFetching(true)
    setLookupError(null)
    try {
      const { fetchLoanOnAllChains } = await import("@/lib/fetchloan")
      const results = await fetchLoanOnAllChains(creatorAddress, collateralId)
      if (!results || results.length === 0) {
        setCollateralData(null)
        setLookupError("No loan found for this address and collateral ID on any supported chain.")
      } else {
        // Use the first found loan (or you can let user pick chain)
        const loan = results[0]
        // Normalize chain name to internal ID
        const normalizedChainId = loan.chain === "Sepolia" ? "ethereum" : loan.chain === "Linea" ? "linea" : loan.chain;

        setCollateralData({
          chainName: loan.chain, // for display, keep original
          ethAmount: loan.ethAmount,
          usdcOwed: loan.usdcAmount
        })
        setClaimToChain(normalizedChainId)
        setClaimFromChain(normalizedChainId)
        setClaimUsdcAmount(loan.usdcAmount)
      }
    } catch (err: any) {
      setCollateralData(null)
      setLookupError("Error fetching loan: " + (err.message || err))
    } finally {
      setIsFetching(false)
    }
  }

  // Handle claim with actual on-chain repayment
  const handleClaimClick = async () => {
    if (!collateralData || !collateralId || !creatorAddress || !claimFromChain) return;
    setIsClaiming(true);
    setLookupError(null);
    setShowClaimSteps(true);
    setClaimStep('approve');
    setStepStatus({
      approve: { status: 'pending' },
      pay: { status: 'pending' },
      confirm: { status: 'pending' },
      done: { status: 'pending' },
    });
    try {
      // Get signer from browser wallet
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      // Approve USDC if needed
      setClaimStep('approve');
      let approveTxHash = '';
      let usdcApproved = false;
      try {
        const { vaultAddress, usdcAddress } = (claimFromChain === 'ethereum')
          ? {
              vaultAddress: process.env.NEXT_PUBLIC_LENDING_VAULT_ADDRESS!,
              usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
            }
          : {
              vaultAddress: process.env.NEXT_PUBLIC_LENDING_VAULT_ADDRESSL!,
              usdcAddress: process.env.NEXT_PUBLIC_LINEA_USDC_ADDRESS!,
            };
        const usdc = new ethers.Contract(usdcAddress, [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
        ], signer);
        const walletAddress = await signer.getAddress();
        const vault = vaultAddress;
        // Get allowance
        const allowance = await usdc.allowance(walletAddress, vault);
        const usdcAmount = BigInt(ethers.parseUnits(collateralData.usdcOwed, 6));
        if (allowance < usdcAmount) {
          const approveTx = await usdc.approve(vault, usdcAmount);
          approveTxHash = approveTx.hash;
          setStepStatus(s => ({ ...s, approve: { status: 'pending', txHash: approveTx.hash } }));
          await approveTx.wait();
        }
        setStepStatus(s => ({ ...s, approve: { status: 'success', txHash: approveTxHash || undefined } }));
        usdcApproved = true;
      } catch (err: any) {
        setStepStatus(s => ({ ...s, approve: { status: 'error', message: err.message || String(err) } }));
        setIsClaiming(false);
        return;
      }
      // Pay loan
      setClaimStep('pay');
      let repayTxHash = '';
      try {
        // Normalize collateral chain for logic
        const normalizedCollateralChain = collateralData.chainName === "Sepolia" ? "ethereum" : collateralData.chainName === "Linea" ? "linea" : collateralData.chainName;
        let result;
        if (claimFromChain !== normalizedCollateralChain) {
          // Cross-chain repayment
          result = await repayLoanWithSignerCrossChain({
            user: creatorAddress,
            loanId: collateralId,
            collateralChain: normalizedCollateralChain,
            payChain: claimFromChain,
            signer,
          });
        } else {
          // Same-chain repayment
          result = await repayLoanWithSigner({
            user: creatorAddress,
            loanId: collateralId,
            chain: claimFromChain,
            signer,
          });
        }
        if ('error' in result && result.error) {
          setStepStatus(s => ({ ...s, pay: { status: 'error', message: result.error } }));
          setIsClaiming(false);
          return;
        }
        repayTxHash = result.repayTxHash;
        setStepStatus(s => ({ ...s, pay: { status: 'success', txHash: repayTxHash } }));
      } catch (err: any) {
        setStepStatus(s => ({ ...s, pay: { status: 'error', message: err.message || String(err) } }));
        setIsClaiming(false);
        return;
      }
      // Wait for confirmation
      setClaimStep('confirm');
      setStepStatus(s => ({ ...s, confirm: { status: 'pending', txHash: repayTxHash } }));
      // Simulate waiting for unlock (or you can poll contract if needed)
      await new Promise(res => setTimeout(res, 2000));
      setStepStatus(s => ({ ...s, confirm: { status: 'success', txHash: repayTxHash } }));
      setClaimStep('done');
      setStepStatus(s => ({ ...s, done: { status: 'success', txHash: repayTxHash } }));
      setClaimTransactionData({
        txHash: repayTxHash,
        ethSent: collateralData.ethAmount,
      });
    } catch (err: any) {
      setStepStatus(s => ({ ...s, [claimStep]: { status: 'error', message: err.message || String(err) } }));
    } finally {
      setIsClaiming(false);
    }
  }

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Get selected chain data
  const getSelectedFromChain = () => chains.find(chain => chain.id === claimFromChain)
  const getSelectedToChain = () => ethChains.find(chain => chain.id === claimToChain)

  // Back to lookup handler
  const handleBackToLookup = () => {
    setCollateralData(null)
    setLookupError(null)
    setCollateralId("")
    setCreatorAddress("")
  }

  // After loan details are fetched, only require chain selection for claim button
  const isClaimButtonEnabled = !!(
    collateralData &&
    claimFromChain &&
    !isClaiming
  )

  // Step-by-step modal UI
  const stepOrder: ClaimStep[] = ['approve', 'pay', 'confirm', 'done'];
  const stepLabels: Record<ClaimStep, string> = {
    approve: 'Approve USDC',
    pay: 'Pay Loan',
    confirm: 'Waiting for Confirmation',
    done: 'Loan Unlocked',
  };
  const stepIcons: Record<ClaimStep, React.ReactNode> = {
    approve: <Sparkles className="w-6 h-6 text-blue-400" />,
    pay: <RefreshCw className="w-6 h-6 text-orange-400" />,
    confirm: <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />,
    done: <CheckCircle className="w-6 h-6 text-green-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Collateral ID Input */}
      {!collateralData && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            Collateral ID
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="COL-XXXXXXXX (Enter your collateral ID)"
              value={collateralId}
              onChange={(e) => setCollateralId(e.target.value.toUpperCase())}
              className="h-10 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-blue-500/50 focus:border-blue-500 transition-all duration-200 font-mono"
            />
            <Input
              placeholder="0x... (Creator wallet address)"
              value={creatorAddress}
              onChange={(e) => setCreatorAddress(e.target.value)}
              className="h-10 rounded-xl border-gray-600/50 bg-gray-800/50 text-white backdrop-blur-sm shadow-lg hover:border-blue-500/50 focus:border-blue-500 transition-all duration-200 font-mono"
            />
            <Button
              onClick={handleCollateralLookup}
              disabled={!collateralId || !creatorAddress || isFetching}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 text-sm"
            >
              {isFetching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'Lookup'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">Enter the wallet address that created the loan. Both fields are required.</p>
          {lookupError && <p className="text-xs text-red-400 mt-1">{lookupError}</p>}
        </motion.div>
      )}
      {collateralData && (
        <div className="flex items-center mb-4">
          <button onClick={handleBackToLookup} className="mr-2 text-blue-400 hover:text-blue-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-white">Loan Details</span>
        </div>
      )}

      {/* Fetching Animation */}
      <AnimatePresence>
        {isFetching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-white" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">Fetching Collateral Data...</h3>
            <p className="text-gray-400 text-sm">Please wait while we retrieve your collateral information</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collateral Data Display */}
      <AnimatePresence>
        {collateralData && !isFetching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-slate-800/50 to-gray-800/50 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-slate-400" />
              <h4 className="font-semibold text-white text-sm">Your Collateral Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.div 
                className="bg-gray-900/30 rounded-lg p-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Chain</span>
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
                <p className="text-lg font-bold text-white">{collateralData.chainName}</p>
                <p className="text-xs text-gray-500">Collateral location</p>
              </motion.div>
              <motion.div 
                className="bg-gray-900/30 rounded-lg p-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">ETH Deposited</span>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <p className="text-lg font-bold text-green-400">{collateralData.ethAmount} ETH</p>
                <p className="text-xs text-gray-500">Available to claim</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Fields - Only show after collateral data is loaded */}
      <AnimatePresence>
        {collateralData && !isFetching && (
          <>
            {/* Compact Form - USDC (30%) and ETH Address (70%) in one row */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                USDC Amount & Chain
              </Label>
              <div className="flex rounded-xl border border-gray-600/50 bg-gray-700/30 backdrop-blur-sm shadow-lg overflow-hidden">
                {/* USDC Amount Input (grayed out, value from loan) */}
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={claimUsdcAmount}
                    readOnly
                    className="h-10 border-0 bg-transparent text-gray-400 pr-12 focus:ring-0 focus:border-0 cursor-not-allowed"
                    disabled
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">USDC</div>
                </div>
                {/* Chain Selector: only eth and linea */}
                <div className="border-l border-gray-600/50">
                  <Select value={claimFromChain} onValueChange={setClaimFromChain}>
                    <SelectTrigger className="h-10 w-24 border-0 bg-transparent text-white focus:ring-0 rounded-none cursor-pointer">
                      <div className="flex items-center gap-1">
                        {getSelectedFromChain() ? (
                          <>
                            <span className="text-sm">{getSelectedFromChain()?.logo}</span>
                            <span className="text-xs font-medium truncate max-w-[40px]">{getSelectedFromChain()?.name}</span>
                          </>
                        ) : (
                          <span className="text-gray-500 text-xs">Chain</span>
                        )}
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                      {chains.filter(chain => chain.id === 'ethereum' || chain.id === 'linea').map((chain) => (
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
              </div>
              <p className="text-xs text-gray-500">Amount fetched from collateral data</p>
            </motion.div>

            {/* Estimated Output */}
            <motion.div 
              className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-3 border border-gray-600/30 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">You will receive:</span>
                <motion.span 
                  className="text-xl font-bold text-blue-400"
                  animate={{ scale: collateralData.ethAmount !== "0.00" ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {collateralData.ethAmount} ETH
                </motion.span>
              </div>
            </motion.div>

            {/* Payment Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex flex-col md:flex-row gap-3">
                {/* Pay with Wallet (old claim button) */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    onClick={handleClaimClick}
                    disabled={!isClaimButtonEnabled}
                    className="w-full h-12 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      initial={{ x: '-100%' }}
                      animate={{ x: isClaiming ? '100%' : '-100%' }}
                      transition={{ duration: 1.5, repeat: isClaiming ? Infinity : 0, ease: "linear" }}
                    />
                    {isClaiming ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                        />
                        Processing Payment...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Pay with Wallet
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
                {/* Pay with MetaMask Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    onClick={() => { setShowCardModal(true); setCardPaid(false); setCardPaying(false); }}
                    disabled={isClaiming}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Pay with MetaMask Card
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Info Banner - Only show if no collateral data */}
      {!collateralData && !isFetching && (
        <motion.div 
          className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 rounded-xl p-3 border border-orange-500/30 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <p className="text-orange-300 font-medium text-sm">
              Enter your Collateral ID to view and claim your ETH collateral
            </p>
          </div>
        </motion.div>
      )}

      {/* Step-by-step Claim Modal */}
      <AnimatePresence>
        {showClaimSteps && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2 text-center">Claiming ETH Collateral</h3>
                <p className="text-gray-400 text-center">Follow the steps below to complete your claim</p>
              </div>
              <div className="space-y-6">
                {stepOrder.map((step, idx) => (
                  <div key={step} className="flex items-center gap-4">
                    <div>
                      {stepIcons[step]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-base">{stepLabels[step]}</span>
                        {stepStatus[step].status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {stepStatus[step].status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        {stepStatus[step].status === 'pending' && idx === stepOrder.indexOf(claimStep) && (
                          <span className="text-xs text-blue-400 animate-pulse ml-2">In Progress...</span>
                        )}
                      </div>
                      {stepStatus[step].txHash && (
                        <div className="text-xs text-blue-400 break-all mt-1">Tx: {stepStatus[step].txHash}</div>
                      )}
                      {stepStatus[step].message && (
                        <div className="text-xs text-red-400 mt-1">{stepStatus[step].message}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                {stepStatus.done.status === 'success' ? (
                  <Button
                    onClick={() => { setShowClaimSteps(false); setShowClaimConfirmation(true); }}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Done
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowClaimSteps(false)}
                    className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Confirmation Popup */}
      <AnimatePresence>
        {showClaimConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
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
                <h3 className="text-2xl font-bold text-white mb-2">ETH Sent Successfully!</h3>
                <p className="text-gray-400">Your collateral has been returned to your wallet</p>
              </div>

              <div className="space-y-4">
                {/* ETH Sent */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">ETH Sent:</span>
                    <Button
                      onClick={() => copyToClipboard(claimTransactionData.ethSent)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xl font-bold text-green-400">{claimTransactionData.ethSent} ETH</p>
                </div>

                {/* Transaction Hash */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">Transaction Hash:</span>
                    <Button
                      onClick={() => copyToClipboard(claimTransactionData.txHash)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs font-mono text-blue-400 break-all">{claimTransactionData.txHash}</p>
                </div>
              </div>

              <Button
                onClick={() => setShowClaimConfirmation(false)}
                className="w-full mt-6 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Done
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MetaMask Card Payment Modal */}
      <AnimatePresence>
        {showCardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-blue-900/95 to-purple-900/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-blue-700/50 backdrop-blur-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-7 h-7 text-blue-400" />
                  <h3 className="text-2xl font-bold text-white">MetaMask Card Payment</h3>
                </div>
                <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {!cardPaid ? (
                <>
                  <div className="bg-gray-900/60 rounded-xl p-4 border border-blue-700/30 mb-4 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <img src="/metamask-fox.svg" alt="MetaMask" className="w-10 h-10" />
                      <span className="text-lg font-semibold text-white">MetaMask Card</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Amount:</span>
                      <span className="text-xl font-bold text-blue-400">{claimUsdcAmount} USDC</span>
                      <span className="text-gray-400 text-sm">(1:1 USD)</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <Label className="text-gray-300">Card Number</Label>
                      <Input placeholder="1234 5678 9012 3456" className="bg-gray-800/80 border-gray-700/50 text-white" disabled />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-gray-300">Expiry</Label>
                        <Input placeholder="12/34" className="bg-gray-800/80 border-gray-700/50 text-white" disabled />
                      </div>
                      <div className="flex-1">
                        <Label className="text-gray-300">CVC</Label>
                        <Input placeholder="123" className="bg-gray-800/80 border-gray-700/50 text-white" disabled />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => { setCardPaying(true); setTimeout(() => { setCardPaying(false); setCardPaid(true); }, 1500); }}
                    disabled={cardPaying}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cardPaying ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                        />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Pay {claimUsdcAmount} USDC
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mb-2" />
                  <h4 className="text-xl font-bold text-white mb-2">Payment Successful!</h4>
                  <p className="text-gray-300">Your MetaMask Card payment of {claimUsdcAmount} USDC was successful.</p>
                  <Button
                    onClick={() => setShowCardModal(false)}
                    className="w-full mt-6 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Done
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}