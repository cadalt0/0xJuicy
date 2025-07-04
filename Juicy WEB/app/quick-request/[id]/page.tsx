'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Droplet
} from 'lucide-react';
import { useAppKitAccount, useAppKit, useDisconnect, useAppKitNetwork } from '@reown/appkit/react'
import { useParams } from 'next/navigation';
import { createWalletClient, encodeFunctionData, custom } from 'viem';
import QRModal from './qr';
import ConfimUSDC from './confimusdc';

interface Chain {
  id: string;
  name: string;
  symbol: string;
  color: string;
  rpcUrl: string;
  logo: string;
  explorerUrl: string;
}

interface MailAddressData {
  cdata: {
    eth: string;
    base: string;
    arb: string;
    avalanche: string;
  };
}

const chains: Chain[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', rpcUrl: 'https://mainnet.infura.io', logo: '⟠', explorerUrl: 'https://sepolia.etherscan.io/tx/' },
  { id: 'base', name: 'Base', symbol: 'BASE', color: '#0052FF', rpcUrl: 'https://mainnet.base.org', logo: '🔵', explorerUrl: 'https://sepolia.basescan.org/tx/' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', rpcUrl: 'https://arb1.arbitrum.io/rpc', logo: '🔷', explorerUrl: 'https://sepolia.arbiscan.io/tx/' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', color: '#E84142', rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc', logo: '❄️', explorerUrl: 'https://testnet.snowtrace.io/tx/' },
];

type PaymentStatus = 'pending' | 'checking' | 'completed' | 'failed';

const USDC_ADDRESSES: Record<string, string> = {
  ethereum: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  base: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  arbitrum: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
  avalanche: '0x5425890298aed601595a70AB815c96711a31Bc65', // Avalanche Fuji
};

const USDC_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Sepolia testnet chain IDs
const SEPOLIA_CHAIN_HEX: Record<string, string> = {
  ethereum: '0xaa36a7', // 11155111
  base: '0x14a34',     // 84532
  arbitrum: '0x670d6', // 421614
  avalanche: '0xa869', // 43113
};

// Add mapping for chain id to rdata blockchain name
const CHAIN_TO_BLOCKCHAIN: Record<string, string> = {
  ethereum: 'ETH-SEPOLIA',
  base: 'BASE-SEPOLIA',
  arbitrum: 'ARB-SEPOLIA',
  avalanche: 'AVAX-FUJI',
};

export default function QuickRequestPage() {
  const { address, isConnected } = useAppKitAccount()
  const { open } = useAppKit()
  const { disconnect } = useDisconnect()
  const { chainId } = useAppKitNetwork()
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
  const [walletAddresses, setWalletAddresses] = useState<MailAddressData['cdata']>({
    eth: '',
    base: '',
    arb: '',
    avalanche: ''
  });
  const [loading, setLoading] = useState(true);
  const [confirmedTx, setConfirmedTx] = useState<string | null>(null);
  const [confimStatus, setConfimStatus] = useState<'pending' | 'confirmed' | 'error'>('pending');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  const params = useParams();
  let requestId = params?.id || params?.request_id || null;
  if (Array.isArray(requestId)) requestId = requestId[0];
  const [dynamicOrderId, setDynamicOrderId] = useState<string | null>(null);
  const [dynamicAmount, setDynamicAmount] = useState<number | null>(null);
  const [fullAmount, setFullAmount] = useState<string | null>(null);

  const requestAmount = dynamicAmount !== null ? dynamicAmount : 32;
  // Helper to truncate to 1 decimal (no rounding)
  const truncateTo1Decimal = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return Math.floor(n * 10) / 10;
  };
  const displayAmount = fullAmount ? truncateTo1Decimal(fullAmount).toFixed(1) : truncateTo1Decimal(requestAmount).toFixed(1);
  const orderId = dynamicOrderId || 'ORDX8134';
  
  // Add state for manual checking
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Add state for spinner error
  const [spinnerError, setSpinnerError] = useState(false);

  // Add state for rdata wallets
  const [walletsRData, setWalletsRData] = useState<any[]>([]);
  const [rdataLoaded, setRdataLoaded] = useState(false);

  // Fetch amount and wallet addresses
  useEffect(() => {
    if (requestId) {
      setDynamicOrderId(requestId);
      setLoading(true);
      // Fetch amount and mail_address
      fetch(`/api/quick-request/${requestId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.amount) {
            setFullAmount(data.amount.toString());
            if (typeof data.amount === 'number') {
              setDynamicAmount(Math.floor(data.amount * 10) / 10);
            } else if (typeof data.amount === 'string') {
              setDynamicAmount(Math.floor(parseFloat(data.amount) * 10) / 10);
            }
          }
          if (data && data.mail_address) {
            fetch(`/api/records/${encodeURIComponent(data.mail_address)}`)
              .then(res => res.json())
              .then((mailData: any) => {
                if (mailData && mailData.cdata) {
                  const cdataStr: string = mailData.cdata as string;
                  if (typeof cdataStr === 'string') {
                    const lines = cdataStr.split('\n');
                    const eth = lines.find((line: string) => line.includes('ETH-SEPOLIA')) || '';
                    const base = lines.find((line: string) => line.includes('BASE-SEPOLIA')) || '';
                    const arb = lines.find((line: string) => line.includes('ARB-SEPOLIA')) || '';
                    const avalanche = lines.find((line: string) => line.includes('AVAX-FUJI')) || '';
                    setWalletAddresses({
                      eth: eth.trim(),
                      base: base.trim(),
                      arb: arb.trim(),
                      avalanche: avalanche.trim(),
                    });
                  } else {
                    setWalletAddresses({ eth: '', base: '', arb: '', avalanche: '' });
                  }
                }
                // Extract the JSON array from the rdata string
                if (mailData && mailData.rdata) {
                  const match = mailData.rdata.match(/Wallets Created: \[(.*?)]/s);
                  let walletsArr = [];
                  if (match && match[1]) {
                    try {
                      walletsArr = JSON.parse('[' + match[1] + ']');
                    } catch (e) {
                      console.error('Failed to parse Wallets Created array from rdata:', e, match[1]);
                    }
                  }
                  setWalletsRData(walletsArr);
                  setRdataLoaded(true);
                } else {
                  setWalletsRData([]);
                  setRdataLoaded(false);
                }
                setLoading(false);
              })
              .catch(() => {
                setWalletAddresses({ eth: '', base: '', arb: '', avalanche: '' });
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          setDynamicAmount(null);
          setLoading(false);
        });
    }
  }, [requestId]);

  // Auto-check payment status (disable after confirmation)
  useEffect(() => {
    if (isPaymentConfirmed) return;
    if (paymentStatus === 'pending') {
      const interval = setInterval(() => {
        if (isPaymentConfirmed) return;
        checkPaymentStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus, isPaymentConfirmed]);

  // Show success modal when payment is completed
  useEffect(() => {
    if (paymentStatus === 'completed') {
      setShowSuccessModal(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (isConnected && address) {
      setIsWalletConnected(true);
      setWalletAddress(address);
    } else {
      setIsWalletConnected(false);
      setWalletAddress('');
    }
  }, [isConnected, address]);

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
Amount: ${displayAmount} USDC
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

  const handlePay = async () => {
    if (!isWalletConnected || !address) return;
    setIsCheckingPayment(true);
    setPaymentStatus('checking');
    try {
      // Check if wallet is on the correct chain
      const expectedChainHex = SEPOLIA_CHAIN_HEX[selectedChain.id];
      if (window.ethereum && window.ethereum.request) {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== expectedChainHex) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: expectedChainHex }],
            });
          } catch (switchError) {
            setIsCheckingPayment(false);
            setPaymentStatus('pending');
            alert('Please switch to the correct network to pay.');
            return;
          }
        }
      }
      // Get the address for the selected chain
      const usdcAddress = USDC_ADDRESSES[selectedChain.id] as `0x${string}`;
      if (!usdcAddress) throw new Error('Unsupported chain');
      // Get the recipient address (strip network name)
      const fullRecipient = walletAddresses.eth && walletAddresses.eth.includes('ETH-SEPOLIA') ? walletAddresses.eth : 'Not available';
      const recipient = fullRecipient.split(/\s|\(/)[0] as `0x${string}`;
      if (!recipient || !recipient.startsWith('0x')) throw new Error('Invalid recipient address');
      // Convert amount to 6 decimals using the full amount
      const amount = BigInt(Math.floor(parseFloat(fullAmount || '0') * 1e6));
      console.log('[DEBUG] handlePay: usdcAddress:', usdcAddress, 'recipient:', recipient, 'amount (6 decimals):', amount.toString());
      // Create wallet client
      const walletClient = createWalletClient({
        chain: undefined,
        transport: custom(window.ethereum),
        account: address as `0x${string}`,
      });
      // Send USDC transfer
      await walletClient.sendTransaction({
        chain: null,
        to: usdcAddress,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [recipient, amount],
        }),
      });
      // Wait for 5 seconds before starting payment status check
      setTimeout(() => {
        setIsManualChecking(true);
      }, 5000);
      setPaymentStatus('completed');
    } catch (err) {
      setPaymentStatus('failed');
      alert('Payment failed: ' + (err as Error).message);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const transactionId = '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab';

  // Helper to get recipient address for selected chain
  const getRecipientAddress = (chainId: string) => {
    switch (chainId) {
      case 'ethereum':
        return walletAddresses.eth && walletAddresses.eth.includes('ETH-SEPOLIA') ? walletAddresses.eth.split(/\s|\(/)[0] : '';
      case 'base':
        return walletAddresses.base && walletAddresses.base.includes('BASE-SEPOLIA') ? walletAddresses.base.split(/\s|\(/)[0] : '';
      case 'arbitrum':
        return walletAddresses.arb && walletAddresses.arb.includes('ARB-SEPOLIA') ? walletAddresses.arb.split(/\s|\(/)[0] : '';
      case 'avalanche':
        return walletAddresses.avalanche && walletAddresses.avalanche.includes('AVAX-FUJI') ? walletAddresses.avalanche.split(/\s|\(/)[0] : '';
      default:
        return '';
    }
  };

  // Helper to get expected USDC amount in 6 decimals (string)
  const getExpectedAmount = () => {
    if (!fullAmount) return '0';
    // Use the full amount as sent (all decimals)
    const val = BigInt(Math.floor(parseFloat(fullAmount) * 1e6)).toString();
    return val;
  };

  // When ConfimUSDC confirms, set paymentStatus to completed and store tx hash
  const handleConfirmed = async (txHash: string, foundChainName?: string) => {
    if (isPaymentConfirmed) return; // Prevent double-confirm
    try {
      // Update payment status to completed (PATCH)
      const statusResponse = await fetch(`/api/quick-request/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => null);
        console.error('Status update failed:', {
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to update payment status: ${statusResponse.statusText}`);
      }
      // Find the wallet ID for the chain where payment was found
      let chainName = foundChainName;
      if (!chainName) {
        // fallback: use selectedChain
        chainName = CHAIN_TO_BLOCKCHAIN[selectedChain.id];
      } else {
        // If foundChainName is a chain id, map it
        chainName = CHAIN_TO_BLOCKCHAIN[foundChainName] || foundChainName;
      }
      let walletId = '';
      if (walletsRData && walletsRData.length > 0) {
        const foundWallet = walletsRData.find((w: any) => w.blockchain === chainName);
        if (foundWallet) {
          walletId = foundWallet.id;
        }
      }
      if (walletId) {
        // Update wallet information with just the wallet ID (PATCH)
        console.log('Patching wallet with wallet_id:', walletId, 'for chain:', chainName);
        const walletResponse = await fetch(`/api/quick-request/${requestId}/wallet`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_id: walletId }),
        });
        if (!walletResponse.ok) {
          const errorData = await walletResponse.json().catch(() => null);
          console.error('Wallet update failed:', {
            status: walletResponse.status,
            statusText: walletResponse.statusText,
            error: errorData
          });
          throw new Error(`Failed to update wallet information: ${walletResponse.statusText}`);
        }
      } else {
        console.warn('No walletId found for chain', chainName, 'wallet PATCH not sent.');
      }
      setIsPaymentConfirmed(true);
      setPaymentStatus('completed');
      setConfirmedTx(txHash);
      setShowSuccessModal(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setPaymentStatus('failed');
      alert(`Payment confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // When a check starts, reset spinnerError
  useEffect(() => {
    if (isChecking) setSpinnerError(false);
  }, [isChecking]);

  // When a check finishes, if payment not confirmed, set spinnerError after 5s
  useEffect(() => {
    if (!isChecking && confimStatus === 'pending') {
      const timeout = setTimeout(() => {
        setSpinnerError(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isChecking, confimStatus]);

  // When payment is confirmed, reset spinnerError
  useEffect(() => {
    if (confimStatus === 'confirmed') setSpinnerError(false);
  }, [confimStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Juicy Logo */}
          <motion.div 
            className="flex items-center space-x-2"
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
              className="text-blue-400"
            >
              <Droplet className="w-6 h-6" />
            </motion.div>
            <span className="text-xl font-bold text-white">juicy</span>
          </motion.div>

          {/* Connect Wallet Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {!isWalletConnected ? (
              <motion.button
                onClick={() => open()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3"
              >
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium text-sm">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <motion.button
                  onClick={() => disconnect()}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-red-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Disconnect</span>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
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
      <QRModal
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        chains={chains}
        selectedChain={selectedChain}
        walletAddresses={walletAddresses}
        fullAmount={fullAmount}
        displayAmount={displayAmount}
        copyToClipboard={copyToClipboard}
      />

      {/* Payment Status (real-time) */}
      {!isPaymentConfirmed && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <ConfimUSDC
            chain={selectedChain.id as 'ethereum' | 'arbitrum' | 'base' | 'avalanche'}
            recipient={getRecipientAddress(selectedChain.id)}
            expectedAmount={getExpectedAmount()}
            onConfirmed={handleConfirmed}
            setStatus={setConfimStatus}
            isChecking={isChecking}
            setIsChecking={setIsChecking}
            triggerManualCheck={isManualChecking}
            setTriggerManualCheck={setIsManualChecking}
          />
        </motion.div>
      )}

      {/* Success Modal (real confirmation) */}
      <AnimatePresence>
        {showSuccessModal && confimStatus === 'confirmed' && (
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
                  Your payment of {displayAmount} USDC has been successfully processed.<br />
                  {confirmedTx && (
                    <span className="block mt-2 text-xs text-blue-400"></span>
                  )}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 mb-6"
              >
                <motion.button
                  onClick={() => {
                    if (confirmedTx) {
                      window.open(`${selectedChain.explorerUrl}${confirmedTx}`, '_blank');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>View on Explorer</span>
                </motion.button>

                <motion.button
                  onClick={() => { if (confirmedTx) copyToClipboard(confirmedTx, 'Transaction ID'); }}
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
      
      {/* Loading Modal */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-xs w-full flex flex-col items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <RefreshCw className="w-10 h-10 text-blue-400" />
              </motion.div>
              <div className="text-lg font-semibold text-white mb-1">Loading request</div>
              <div className="text-sm text-gray-400">Please wait while we load your payment details...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 py-4 max-w-md h-screen flex flex-col overflow-hidden">
        {/* Page Title */}
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
                <span className="text-xl font-bold text-green-400" title={fullAmount || ''}>{displayAmount} USDC</span>
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

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Wallet Connection */}
            {!isWalletConnected ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.button
                  onClick={() => open()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Wallet className="w-5 h-5" />
                  </motion.div>
                  <span>Connect Wallet</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
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
                    {walletAddress}
                  </div>
                </div>
                <motion.button
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePay}
                  disabled={!isWalletConnected || isCheckingPayment}
                >
                  <span>Pay {displayAmount} USDC</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}

            {/* Payment Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">Payment Status</span>
                {isChecking && (
                  <button onClick={() => { if (!isChecking) setIsManualChecking(true); }} className="ml-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  </button>
                )}
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 min-h-[52px] flex items-center">
                <AnimatePresence mode="wait">
                  {confimStatus === 'pending' && (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-between items-center w-full min-h-[32px]"
                    >
                      <span className="text-yellow-400 text-sm">Waiting for Payment...</span>
                      <button
                        onClick={() => { if (!isChecking) setIsManualChecking(true); }}
                        className="focus:outline-none mr-1"
                        title="Check payment status"
                        type="button"
                        disabled={isChecking}
                      >
                        <RefreshCw className={
                          `w-4 h-4 ${isChecking ? 'animate-spin' : ''} ` +
                          (spinnerError ? 'text-red-400' : 'text-blue-400')
                        } />
                      </button>
                    </motion.div>
                  )}
                  {confimStatus === 'confirmed' && (
                    <motion.div
                      key="confirmed"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
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
                  {confimStatus === 'error' && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-3"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Error checking payment</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="text-xs text-gray-400 mt-1">If paying through QR, click this.</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer - Powered by Juicy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="fixed bottom-0 left-0 right-0 py-4 text-center bg-transparent backdrop-blur-sm"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-500/80 text-sm">
            <span>Powered by</span>
            <motion.div
              className="flex items-center space-x-1 text-blue-400"
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
                <Droplet className="w-4 h-4" />
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