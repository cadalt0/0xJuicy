"use client"

import { motion } from "framer-motion"
import { Droplet, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface PayHeaderProps {
  isWalletConnected?: boolean
  walletAddress?: string
  onConnectWallet?: () => void
}

export default function PayHeader({ 
  isWalletConnected = false, 
  walletAddress = '', 
  onConnectWallet 
}: PayHeaderProps) {
  const router = useRouter()

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-shrink-0 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Juicy Logo */}
          <Link href="/" className="relative z-50">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 3 
                }}
                className="relative"
              >
                <Droplet className="text-blue-400 w-6 h-6 drop-shadow-lg" />
                <motion.div
                  className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                juicy
              </h1>
            </motion.div>
          </Link>

          {/* Payment Title */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-1">
              Send USDC Payment ⚡
            </h1>
            <p className="text-gray-300 text-xs">
            </p>
          </motion.div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-3">
            {/* Connect Wallet Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {!isWalletConnected ? (
                <motion.button
                  onClick={onConnectWallet}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Connect Wallet</span>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-900/30 border border-green-500/30 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-green-400 font-medium text-sm">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}