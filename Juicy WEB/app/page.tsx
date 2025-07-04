"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, ArrowUpDown, ExternalLink, X, Droplet, Repeat, ArrowDownLeft, Mail, Copy, QrCode, Share, Clock, RefreshCw, ChevronDown, Sparkles, Zap, TrendingUp, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppKitAccount, useAppKit, useDisconnect, useAppKitNetwork } from '@reown/appkit/react'
import { bridgeUSDC } from '@/lib/cctpBridge'
import RequestTab from './request-tab'
import RecoverTab from './recover-tab'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID, handleGoogleLogin } from '@/lib/googleAuth'
import { createWallet } from '@/lib/wallet'
import NetworkStatusWidget from './NetworkStatusWidget'
import { useRouter } from 'next/navigation'
import CrossChainTransfer from './components/CrossChainTransfer'
import LendingInterface from '@/components/lending/LendingInterface'


const animationSteps = [
  { id: "approve", label: "Approve USDC", icon: "🪙", description: "Authorizing token transfer" },
  { id: "burn", label: "Burning USDC", icon: "🔥", description: "Removing tokens from source chain" },
  { id: "attestation", label: "Waiting for Attestation", icon: "⏳", description: "Cross-chain verification in progress" },
  { id: "mint", label: "Minting on Destination", icon: "✨", description: "Creating tokens on target chain" },
  { id: "done", label: "Complete", icon: "✅", description: "Transfer successfully completed" },
]



// Enhanced chain data with logos and colors
const chainLogos = {
  ethereum: "⟠",
  arbitrum: "🔷", 
  base: "🔵",
  polygon: "⬟",
  optimism: "��",
  linea: "🟢"
}

declare global {
  interface Window {
    appkit?: { disconnect?: () => void }
  }
}

export default function Web3Bridge() {
  const { address, isConnected } = useAppKitAccount()
  const { open } = useAppKit()
  const { disconnect } = useDisconnect()
  const { chainId } = useAppKitNetwork()
  const [mounted, setMounted] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [sourceChain, setSourceChain] = useState("")
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [usdcBalance, setUsdcBalance] = useState("0")
  const [showAnimation, setShowAnimation] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const [activeTab, setActiveTab] = useState<'transfer' | 'request' | 'recover' | 'lending'>('transfer')
  const [requestCreated, setRequestCreated] = useState(false)
  const [requestChain, setRequestChain] = useState("")
  const [requestAmount, setRequestAmount] = useState("")
  const [requestLink, setRequestLink] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [showGoogleLogout, setShowGoogleLogout] = useState(false)
  const userBoxRef = useRef<HTMLDivElement>(null)
  const [showAccountSetup, setShowAccountSetup] = useState(false)
  const [accountSetupEmail, setAccountSetupEmail] = useState("")
  const [accountSetupError, setAccountSetupError] = useState("")
  const [userName, setUserName] = useState("")
  const [userPicture, setUserPicture] = useState("")
  const router = useRouter()
  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTx, setLoadingTx] = useState(false)

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

  // Determine if current network is testnet or mainnet
  const isTestnet = chainId === 11155111 // Sepolia testnet chainId
  const filteredChains = supportedNetworks.filter(n => isTestnet ? n.testnet : n.mainnet)
  const availableDestinationChains = filteredChains.filter((chain) => chain.id !== sourceChain)

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
    linea: {
      chainId: 59141,
      rpcUrl: `https://linea-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_API_KEY || ''}`,
      usdc: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',
    },
  }

  // Check for existing Google login on page load
  useEffect(() => {
    const savedLogin = localStorage.getItem('googleLogin')
    if (savedLogin) {
      const { email, name, picture } = JSON.parse(savedLogin)
      setIsGoogleLoggedIn(true)
      setUserEmail(email)
      setUserName(name)
      setUserPicture(picture)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isConnected || !address || !sourceChain) return
    const config = chainConfig[sourceChain]
    if (!config) {
      setUsdcBalance('0')
      return
    }
    setUsdcBalance('updating ...')
    const fetchBalance = async () => {
      try {
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
        setUsdcBalance('0')
  }
    }
    fetchBalance()
  }, [isConnected, address, sourceChain])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const fetchTransactions = async () => {
      if (!address || !sourceChain) {
        setTransactions([]);
        return;
      }
      setLoadingTx(true);
      if (sourceChain === "ethereum") {
        const alchemyKey = "";
        const url = `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
        const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
        try {
          // Fetch sent txs
          const sentRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: 1,
              jsonrpc: "2.0",
              method: "alchemy_getAssetTransfers",
              params: [
                {
                  category: ["erc20"],
                  contractAddresses: [usdcAddress],
                  maxCount: "0x14",
                  order: "desc",
                  fromAddress: address
                }
              ]
            })
          });
          const sentData = await sentRes.json();
          // Fetch received txs
          const recvRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: 2,
              jsonrpc: "2.0",
              method: "alchemy_getAssetTransfers",
              params: [
                {
                  category: ["erc20"],
                  contractAddresses: [usdcAddress],
                  maxCount: "0x14",
                  order: "desc",
                  toAddress: address
                }
              ]
            })
          });
          const recvData = await recvRes.json();
          // Combine, deduplicate by hash+uniqueId, sort by blockNum desc
          let allTxs = [
            ...(sentData.result?.transfers || []),
            ...(recvData.result?.transfers || [])
          ];
          const seen = new Set();
          allTxs = allTxs.filter((tx: any) => {
            const key = (tx.hash || "") + (tx.uniqueId || "");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          allTxs.sort((a: any, b: any) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16));
          setTransactions(allTxs.slice(0, 2));
        } catch (e) {
          console.error("Alchemy fetch error:", e);
          setTransactions([]);
        }
      } else {
        setTransactions([]); // Only Sepolia for now
      }
      setLoadingTx(false);
    };
    if (address && sourceChain) {
      timeoutId = setTimeout(fetchTransactions, 3000);
    } else {
      setTransactions([]);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [address, sourceChain]);

  // Auto-set sourceChain based on chainId when wallet is connected
  useEffect(() => {
    if (!address || !chainId) return;
    // Map chainId to supported chain key
    if (chainId === 11155111) setSourceChain("ethereum");
    else if (chainId === 421614) setSourceChain("arbitrum");
    else if (chainId === 84532) setSourceChain("base");
    else if (chainId === 59141) setSourceChain("linea");
    // Add more mappings as needed
  }, [address, chainId]);

  const handleSend = async () => {
    if (!amount || !recipientAddress || !sourceChain || !destinationChain || !address) return

    setShowAnimation(true)
    setCurrentStep(0)
    setIsAnimationComplete(false)

    try {
      await bridgeUSDC({
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

  const createRequest = () => {
    // Implement the logic to create a payment request
    setRequestCreated(true)
    setRequestLink(generateRandomLink())
    setTimeLeft(calculateTimeLeft())
  }

  const cancelRequest = () => {
    // Implement the logic to cancel a payment request
    setRequestCreated(false)
  }

  const copyToClipboard = (text: string) => {
    // Implement the logic to copy text to clipboard
  }

  const generateRandomLink = () => {
    // Implement the logic to generate a random link
    return "https://example.com/payment-request"
  }

  const calculateTimeLeft = () => {
    // Implement the logic to calculate time left
    return 300 // seconds
  }

  const formatTime = (seconds: number) => {
    // Implement the logic to format time
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleGoogleSuccess = async (credential: string) => {
    const result = await handleGoogleLogin(credential)
    if (result.success && result.user) {
      // Check if user exists in DB
      try {
        const res = await fetch(`/api/records/${encodeURIComponent(result.user.email)}`)
        if (res.status === 404) {
          // User not found, show animation and create wallet
          setAccountSetupEmail(result.user.email)
          setAccountSetupError("")
          setShowAccountSetup(true)
          try {
            const ok = await createWallet(result.user.email);
            if (ok) {
              setShowAccountSetup(false);
            } else {
              setAccountSetupError('Failed to create wallet');
              console.error('Failed to create wallet for', result.user.email);
            }
          } catch (e) {
            setAccountSetupError('Error creating wallet: ' + (e instanceof Error ? e.message : e));
          }
        } else if (res.status === 200) {
          // User exists, do nothing
        }
      } catch (e) {
        console.error('Error checking user in DB:', e)
      }
      setIsGoogleLoggedIn(true)
      setUserEmail(result.user.email)
      setUserName(result.user.name || "")
      setUserPicture(result.user.picture || "")
      
      // Save login state to localStorage
      localStorage.setItem('googleLogin', JSON.stringify({
        email: result.user.email,
        name: result.user.name || "",
        picture: result.user.picture || ""
      }))
    }
  }

  const handleGoogleError = () => {
    console.error('Google login failed')
  }

  const handleGoogleLogout = () => {
    setIsGoogleLoggedIn(false)
    setUserEmail("")
    setUserName("")
    setUserPicture("")
    // Remove login state from localStorage
    localStorage.removeItem('googleLogin')
  }

  const handleDashboardClick = () => {
    if (!isGoogleLoggedIn) {
      setMessageText("Google login is required to access merchant dashboard")
      setShowMessage(true)
      setActiveTab('request')
      // Scroll to Google login
      const requestTab = document.getElementById('request-tab')
      if (requestTab) {
        requestTab.scrollIntoView({ behavior: 'smooth' })
      }
      // Hide message after 3 seconds
      setTimeout(() => {
        setShowMessage(false)
      }, 3000)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Message Overlay */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-900/80 backdrop-blur-xl px-6 py-3 rounded-xl border border-red-500/30 shadow-2xl"
            >
              <p className="text-red-400 text-base font-medium flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                {messageText}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,58,237,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.1),transparent_50%)]"></div>
        
        {/* Floating Particles - Only render on client */}
        {mounted && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Top Header Bar */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-20 flex items-center justify-between bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 shadow-2xl"
      >
        <motion.div 
          className="flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatDelay: 2 
            }}
            className="relative"
          >
            <Droplet className="text-blue-400 w-8 h-8 drop-shadow-lg" />
            <motion.div
              className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            juicy
          </h1>
        </motion.div>
        
        <div className="flex items-center space-x-4">
          {/* Merchant Dashboard Button */}
          <motion.button
            onClick={handleDashboardClick}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-700/80 hover:to-blue-700/80 text-white font-medium border border-purple-500/30 shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
          >
            <Store className="w-4 h-4" />
            <span>Merchant Dashboard</span>
          </motion.button>

          {isConnected ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-xl border border-gray-600/50"
            >
              <motion.div 
                className="w-3 h-3 bg-green-400 rounded-full shadow-lg"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div>
                <p className="font-semibold text-white text-sm">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                </p>
                <p className="text-xs text-gray-300">Connected</p>
              </div>
              <motion.button
                onClick={() => disconnect()}
                className="rounded-xl ml-2 px-4 py-2 border text-sm bg-gray-800/80 hover:bg-gray-700/80 transition-all duration-200 text-gray-200 border-gray-600/50 hover:border-gray-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Disconnect
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <appkit-button />
            </motion.div>
          )}
          
          {activeTab === 'request' && !isGoogleLoggedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      handleGoogleSuccess(credentialResponse.credential)
                    }
                  }}
                  onError={handleGoogleError}
                  useOneTap
                  theme="filled_black"
                  text="signin_with"
                  shape="rectangular"
                  locale="en"
                />
              </GoogleOAuthProvider>
            </motion.div>
          )}
          
          {activeTab === 'request' && isGoogleLoggedIn && (
            <motion.div
              ref={userBoxRef}
              className="relative group cursor-pointer"
              onMouseEnter={() => setShowGoogleLogout(true)}
              onMouseLeave={() => setShowGoogleLogout(false)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-white font-medium border border-gray-600/50 backdrop-blur-sm shadow-xl flex items-center gap-3">
                {userPicture && (
                  <img src={userPicture} alt="Google profile" className="w-7 h-7 rounded-full border border-zinc-700" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100 text-sm">{userName}</span>
                  <span className="text-xs text-zinc-400" style={{ fontSize: '80%' }}>{userEmail}</span>
                </div>
              </div>
              <AnimatePresence>
                {showGoogleLogout && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute left-0 right-0 top-full mt-2 z-30"
                  >
                    <button
                      onClick={handleGoogleLogout}
                      className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-red-900/90 to-red-800/90 text-red-300 font-semibold border border-red-700/50 shadow-xl hover:from-red-800/90 hover:to-red-700/90 transition-all duration-200 backdrop-blur-sm"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.header>

      <div className="relative z-10 p-6">
        <div className="flex gap-6">
          {/* Centered main content */}
          <div className="flex-1 flex justify-center">
            <div className="flex gap-6 max-w-4xl w-full">
              {/* Sidebar */}
              <motion.div 
                className="flex flex-col gap-3 w-48 flex-shrink-0 mt-16"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {[
                  { id: 'transfer', label: 'Transfer', icon: Repeat },
                  { id: 'request', label: 'Request', icon: ArrowDownLeft },
                  { id: 'recover', label: 'Recover', icon: RefreshCw },
                  { id: 'lending', label: 'Lending', icon: TrendingUp }
                ].map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    className={`flex items-center px-4 py-3 text-base font-semibold transition-all duration-300 focus:outline-none rounded-xl border gap-3 shadow-lg backdrop-blur-sm ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white border-blue-500/50 shadow-blue-500/25' 
                        : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50 hover:text-blue-300 hover:border-blue-600/50 hover:shadow-blue-500/10'
                    }`}
                    onClick={() => setActiveTab(tab.id as any)}
                    type="button"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </motion.button>
                ))}
              </motion.div>

              {/* Main Content - Constrained width */}
              <div className="flex-1 max-w-2xl space-y-6">
                {/* Subtitle */}
                <motion.div 
                  className="text-center space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <motion.p 
                    className="text-lg text-gray-300 font-medium"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Pure Juice. No BRIDGES. Native USDC
                  </motion.p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Powered by Circle's CCTP Protocol</span>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </div>
                </motion.div>

                {/* Tab Content */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <AnimatePresence mode="wait">
                    {activeTab === 'transfer' ? (
                      <motion.div
                        key="transfer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CrossChainTransfer />
                      </motion.div>
                    ) : activeTab === 'request' ? (
                      <motion.div
                        key="request"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RequestTab walletAddress={address || ''} isGoogleLoggedIn={isGoogleLoggedIn} userEmail={userEmail} userName={userName} />
                      </motion.div>
                    ) : activeTab === 'recover' ? (
                      <motion.div
                        key="recover"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RecoverTab />
                      </motion.div>
                    ) : activeTab === 'lending' ? (
                      <motion.div
                        key="lending"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                              >
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                              </motion.div>
                              ETH Collateral Management
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <LendingInterface />
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="w-5 h-5 text-green-400" />
                        </motion.div>
                        Recent Transactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingTx ? (
                        <div>Loading...</div>
                      ) : transactions.length === 0 ? (
                        <div>No recent transactions found.</div>
                      ) : (
                        transactions.map((tx, index) => (
                          <motion.div
                            key={tx.hash || tx.uniqueId || index}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl backdrop-blur-sm border border-gray-600/30 shadow-lg hover:shadow-xl transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.01, y: -1 }}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-3 text-sm">
                                <span className="font-semibold text-white">{tx.from.toLowerCase() === address?.toLowerCase() ? "Sent" : "Received"}</span>
                                <ArrowUpDown className="h-3 w-3 text-blue-400" />
                                <span className="font-semibold text-white">{tx.to}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-white">{Number(tx.value).toFixed(6)} USDC</span>
                                <p className="text-xs text-gray-400">{tx.metadata && tx.metadata.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toLocaleString() : ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-green-900/50 text-green-300 border border-green-500/30`}>
                                completed
                              </span>
                              <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="h-8 w-8 p-0 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors border border-gray-600/50 flex items-center justify-center">
                                <ExternalLink className="h-3 w-3 text-gray-300 mx-auto" />
                              </a>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
          {/* Widget */}
          <div className="min-w-[320px] max-w-xs">
            <NetworkStatusWidget />
          </div>
        </div>
      </div>

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

              {/* Animation Steps */}
              <div className="space-y-6">
                {animationSteps.map((step, index) => (
                    <motion.div
                    key={step.id}
                      className={cn(
                        "flex items-center space-x-4 p-6 rounded-2xl transition-all duration-500 border",
                        index === currentStep
                          ? "bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/50 shadow-lg shadow-blue-500/25"
                          : index < currentStep
                          ? "bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/50 shadow-lg shadow-green-500/25"
                          : "bg-gray-800/50 border-gray-700/50",
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <motion.div
                        className={cn(
                          "text-3xl transition-all duration-500",
                          index === currentStep ? "animate-bounce" : "",
                        )}
                        animate={index === currentStep ? { 
                          scale: [1, 1.2, 1],
                          rotate: step.id === "burn" ? [0, 10, -10, 0] : 0
                        } : {}}
                        transition={{ duration: 1, repeat: index === currentStep ? Infinity : 0 }}
                    >
                      {step.icon}
                      </motion.div>
                    <div className="flex-1 text-left">
                      <p
                        className={cn(
                            "font-semibold text-lg transition-colors",
                          index === currentStep
                              ? "text-blue-300"
                            : index < currentStep
                              ? "text-green-300"
                              : "text-gray-400",
                        )}
                      >
                        {step.label}
                      </p>
                        <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                    </div>
                      {index < currentStep && (
                        <motion.div 
                          className="text-green-400 text-2xl"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.div>
                ))}
              </div>

              {isAnimationComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                    className="space-y-4"
                  >
                    <motion.div 
                      className="text-green-400 text-6xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      ✅
                    </motion.div>
                    <p className="text-2xl font-bold text-green-300">Transaction Complete!</p>
                    <p className="text-gray-400">Your USDC has been successfully bridged.</p>
                  </motion.div>
                )}
                </div>
            </motion.div>
          </motion.div>
              )}
      </AnimatePresence>

      {/* Account Setup Modal */}
      <AnimatePresence>
        {showAccountSetup && (
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
              className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl flex flex-col items-center"
            >
              <motion.div 
                className="text-blue-400 text-6xl mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.div>
              <div className="text-2xl font-bold text-white mb-3">Setting up account...</div>
              <div className="text-gray-300 text-lg text-center">{accountSetupEmail}</div>
              {accountSetupError && (
                <motion.div 
                  className="text-red-400 mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {accountSetupError}
                </motion.div>
      )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}