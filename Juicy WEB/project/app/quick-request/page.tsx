'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Wallet, 
  QrCode, 
  CheckCircle, 
  RefreshCw, 
  Copy,
  AlertCircle,
  Download,
  ArrowRight,
  Check,
  ExternalLink,
  X,
  Zap
} from 'lucide-react';

interface Chain {
  id: string;
  name: string;
  symbol: string;
  color: string;
  rpcUrl: string;
  logo: string;
  explorerUrl: string;
}

const chains: Chain[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', rpcUrl: 'https://mainnet.infura.io', logo: '⟠', explorerUrl: 'https://etherscan.io/tx/' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5', rpcUrl: 'https://polygon-rpc.com', logo: '⬟', explorerUrl: 'https://polygonscan.com/tx/' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF', rpcUrl: 'https://api.mainnet-beta.solana.com', logo: '◎', explorerUrl: 'https://solscan.io/tx/' },
  { id: 'base', name: 'Base', symbol: 'BASE', color: '#0052FF', rpcUrl: 'https://mainnet.base.org', logo: '🔵', explorerUrl: 'https://basescan.org/tx/' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', rpcUrl: 'https://arb1.arbitrum.io/rpc', logo: '🔷', explorerUrl: 'https://arbiscan.io/tx/' },
];

type PaymentStatus = 'pending' | 'checking' | 'completed' | 'failed';

export default function QuickRequestPage() {
  const [selectedChain, setSelectedChain] = useState<Chain>(chains[0]);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const requestAmount = 32.000731;
  const orderId = 'ORDX8134';
  const recipientAddress = '0xabc1234567890def1234567890abcdef12345678';
  const transactionId = '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab';

  // Auto-check payment status
  useEffect(() => {
    if (paymentStatus === 'pending') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus]);

  // Show success modal when payment is completed
  useEffect(() => {
    if (paymentStatus === 'completed') {
      setShowSuccessModal(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [paymentStatus]);

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsWalletConnected(true);
        setWalletAddress(accounts[0]);
      } else {
        alert('Please install MetaMask to connect your wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const checkPaymentStatus = () => {
    if (isCheckingPayment) return;
    
    setIsCheckingPayment(true);
    setPaymentStatus('checking');
    
    setTimeout(() => {
      const isPaymentFound = Math.random() > 0.7;
      if (isPaymentFound) {
        setPaymentStatus('completed');
      } else {
        setPaymentStatus('pending');
      }
      setIsCheckingPayment(false);
    }, 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleChainChange = (chain: Chain) => {
    setSelectedChain(chain);
    setIsChainDropdownOpen(false);
  };

  const openExplorer = () => {
    window.open(`${selectedChain.explorerUrl}${transactionId}`, '_blank');
  };

  const downloadReceipt = () => {
    // Mock receipt download
    const receiptData = `
Payment Receipt
===============
Order ID: ${orderId}
Amount: ${requestAmount} USDC
Network: ${selectedChain.name}
Transaction: ${transactionId}
Date: ${new Date().toLocaleString()}
    `;
    
    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,58,237,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      </div>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40"
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                initial={{
                  x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
                  y: -10,
                  rotate: 0,
                }}
                animate={{
                  y: typeof window !== 'undefined' ? window.innerHeight + 10 : 800,
                  rotate: 360,
                  x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
                }}
                transition={{
                  duration: 3,
                  delay: Math.random() * 2,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Scan QR Code</h3>
                <motion.button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedChain.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <motion.div 
                    className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-center">
                      <QrCode className="w-24 h-24 text-gray-800 mx-auto mb-2" />
                      <div className="text-sm text-gray-600 font-medium">{selectedChain.name}</div>
                      <div className="text-xs text-gray-500">{requestAmount} USDC</div>
                    </div>
                  </motion.div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Wallet Address:</p>
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-700 rounded-lg p-2 flex-1 text-xs font-mono text-center">
                          {recipientAddress.slice(0, 12)}...{recipientAddress.slice(-8)}
                        </div>
                        <motion.button
                          onClick={() => copyToClipboard(recipientAddress, 'Address')}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Copy className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">{requestAmount} USDC</div>
                        <div className="text-xs text-gray-400">Amount to Pay</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-green-400 mb-2"
                >
                  Payment Confirmed!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-300"
                >
                  Your payment of {requestAmount} USDC has been successfully processed.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 mb-6"
              >
                <motion.button
                  onClick={openExplorer}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>View on Explorer</span>
                </motion.button>

                <motion.button
                  onClick={() => copyToClipboard(transactionId, 'Transaction ID')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy Transaction ID</span>
                </motion.button>

                <motion.button
                  onClick={downloadReceipt}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-5 h-5" />
                  <span>Download Receipt</span>
                </motion.button>
              </motion.div>

              <motion.button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 container mx-auto px-4 py-4 max-w-md h-screen flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Send USDC Payment
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Pay securely via wallet or QR
          </p>
        </motion.div>

        <div className="flex-1 space-y-4">
          {/* Payment Details Box */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Amount to Pay:</span>
                <span className="text-xl font-bold text-green-400">{requestAmount} USDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Order ID:</span>
                <span className="font-mono text-blue-400 text-sm">#{orderId}</span>
              </div>
            </div>
          </motion.div>

          {/* Chain Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Network:
            </label>
            <div className="relative">
              <motion.button
                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 flex items-center justify-between hover:border-blue-500 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="text-xl"
                    animate={{ rotate: isChainDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {selectedChain.logo}
                  </motion.div>
                  <span className="font-medium text-sm">{selectedChain.name}</span>
                </div>
                <motion.div
                  animate={{ rotate: isChainDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {isChainDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden z-20"
                  >
                    {chains.map((chain, index) => (
                      <motion.button
                        key={chain.id}
                        onClick={() => handleChainChange(chain)}
                        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-700/50 transition-colors text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 5 }}
                      >
                        <span className="text-xl">{chain.logo}</span>
                        <span className="font-medium">{chain.name}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* QR Code Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.button
              onClick={() => setShowQRModal(true)}
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-blue-500 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-gray-800" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Scan QR Code</div>
                    <div className="text-xs text-gray-400">Pay with any wallet</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </motion.button>
          </motion.div>

          {/* Wallet Connection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {!isWalletConnected ? (
                <motion.button
                  key="connect"
                  onClick={connectWallet}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Wallet className="w-5 h-5" />
                  </motion.div>
                  <span>Connect Wallet</span>
                </motion.button>
              ) : (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </motion.div>
                      <span className="text-green-400 font-medium text-sm">Wallet Connected</span>
                    </div>
                    <div className="text-xs text-gray-300 font-mono">
                      {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                    </div>
                  </div>
                  
                  <motion.button
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span>Pay {requestAmount} USDC</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Payment Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">Payment Status</span>
              <motion.button
                onClick={checkPaymentStatus}
                disabled={isCheckingPayment}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 disabled:text-gray-500 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: isCheckingPayment ? 360 : 0 }}
                  transition={{ duration: 1, repeat: isCheckingPayment ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                <span className="text-sm">Check</span>
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={paymentStatus}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
              >
                {paymentStatus === 'pending' && (
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-3 h-3 bg-yellow-500 rounded-full"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-yellow-400 text-sm">Waiting for Payment...</span>
                  </div>
                )}
                
                {paymentStatus === 'checking' && (
                  <div className="flex items-center space-x-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4 text-blue-400" />
                    </motion.div>
                    <span className="text-blue-400 text-sm">Checking payment status...</span>
                  </div>
                )}
                
                {paymentStatus === 'completed' && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center space-x-3"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </motion.div>
                    <span className="text-green-400 font-medium text-sm">Payment Received!</span>
                  </motion.div>
                )}
                
                {paymentStatus === 'failed' && (
                  <motion.div
                    animate={{ x: [-5, 5, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center space-x-3"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">Payment Not Found</span>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer - Powered by Juicy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-4 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
            <span>Powered by</span>
            <motion.div
              className="flex items-center space-x-1 text-orange-400"
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
              >
                <Zap className="w-4 h-4" />
              </motion.div>
              <span className="font-semibold">Juicy</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Copy Notification */}
        <AnimatePresence>
          {copiedText && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
            >
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span className="text-sm">{copiedText} Copied!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}