"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/lending-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lending-tabs"
import { Coins, DollarSign, RefreshCw } from "lucide-react"
import DepositCollateral from "./DepositCollateral"
import ClaimCollateral from "./ClaimCollateral"

export default function LendingInterface() {
  // Deposit states
  const [ethAmount, setEthAmount] = useState("")
  const [ethChain, setEthChain] = useState("")
  const [usdcChain, setUsdcChain] = useState("")
  const [usdcAddress, setUsdcAddress] = useState("")
  const [estimatedUsdc, setEstimatedUsdc] = useState("0.00")
  const [metaMaskBonus, setMetaMaskBonus] = useState(false)
  const [highSpenderBonus, setHighSpenderBonus] = useState(false)
  const [monthlyEthSpent] = useState("2.5")
  const [isLending, setIsLending] = useState(false)

  // Claim states
  const [claimUsdcAmount, setClaimUsdcAmount] = useState("")
  const [claimFromChain, setClaimFromChain] = useState("")
  const [claimToChain, setClaimToChain] = useState("")
  const [claimToAddress, setClaimToAddress] = useState("")
  const [estimatedEth, setEstimatedEth] = useState("0.00")
  const [isClaiming, setIsClaiming] = useState(false)

  // Calculate estimated USDC based on ETH amount
  useEffect(() => {
    if (ethAmount) {
      const ethValue = parseFloat(ethAmount)
      let usdcValue = ethValue * 2500 // Mock ETH price
      
      // Apply bonuses
      if (metaMaskBonus) usdcValue *= 1.05
      if (highSpenderBonus) usdcValue *= 1.03
      
      setEstimatedUsdc(usdcValue.toFixed(2))
    } else {
      setEstimatedUsdc("0.00")
    }
  }, [ethAmount, metaMaskBonus, highSpenderBonus])

  // Calculate estimated ETH based on USDC amount
  useEffect(() => {
    if (claimUsdcAmount) {
      const usdcValue = parseFloat(claimUsdcAmount)
      const ethValue = usdcValue / 2500 // Mock ETH price
      setEstimatedEth(ethValue.toFixed(6))
    } else {
      setEstimatedEth("0.00")
    }
  }, [claimUsdcAmount])

  const handleLendEth = async () => {
    if (!ethAmount || !ethChain || !usdcChain || !usdcAddress) return
    setIsLending(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert(`Lending ${ethAmount} ETH from ${ethChain} to receive ${estimatedUsdc} USDC on ${usdcChain}`)
    setIsLending(false)
  }

  const handleClaimCollateral = async () => {
    if (!claimUsdcAmount || !claimFromChain || !claimToChain || !claimToAddress) return
    setIsClaiming(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert(`Claiming ${claimUsdcAmount} USDC from ${claimFromChain} to receive ${estimatedEth} ETH on ${claimToChain}`)
    setIsClaiming(false)
  }

  return (
    <Tabs defaultValue="deposit" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
        <TabsTrigger 
          value="deposit" 
          className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-gray-300 text-sm"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Deposit Collateral
        </TabsTrigger>
        <TabsTrigger 
          value="claim" 
          className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-yellow-600 data-[state=active]:text-white text-gray-300 text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Claim Collateral
        </TabsTrigger>
      </TabsList>

      <TabsContent value="deposit" className="mt-0">
        <DepositCollateral
          ethAmount={ethAmount}
          setEthAmount={setEthAmount}
          ethChain={ethChain}
          setEthChain={setEthChain}
          usdcChain={usdcChain}
          setUsdcChain={setUsdcChain}
          usdcAddress={usdcAddress}
          setUsdcAddress={setUsdcAddress}
          estimatedUsdc={estimatedUsdc}
          metaMaskBonus={metaMaskBonus}
          setMetaMaskBonus={setMetaMaskBonus}
          highSpenderBonus={highSpenderBonus}
          setHighSpenderBonus={setHighSpenderBonus}
          monthlyEthSpent={monthlyEthSpent}
          isLending={isLending}
          handleLendEth={handleLendEth}
        />
      </TabsContent>

      <TabsContent value="claim" className="mt-0">
        <ClaimCollateral
          claimUsdcAmount={claimUsdcAmount}
          setClaimUsdcAmount={setClaimUsdcAmount}
          claimFromChain={claimFromChain}
          setClaimFromChain={setClaimFromChain}
          claimToChain={claimToChain}
          setClaimToChain={setClaimToChain}
          claimToAddress={claimToAddress}
          setClaimToAddress={setClaimToAddress}
          estimatedEth={estimatedEth}
          isClaiming={isClaiming}
          handleClaimCollateral={handleClaimCollateral}
        />
      </TabsContent>
    </Tabs>
  )
}