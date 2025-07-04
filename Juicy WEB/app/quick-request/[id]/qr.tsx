'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, RefreshCw, X } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';

interface Chain {
  id: string;
  name: string;
  symbol: string;
  color: string;
  rpcUrl: string;
  logo: string;
  explorerUrl: string;
}

interface QRModalProps {
  showQRModal: boolean;
  setShowQRModal: (show: boolean) => void;
  chains: Chain[];
  selectedChain: Chain;
  walletAddresses: {
    eth: string;
    base: string;
    arb: string;
  };
  fullAmount: string | null;
  displayAmount: string;
  copyToClipboard: (text: string, label: string) => void;
}

export default function QRModal({
  showQRModal,
  setShowQRModal,
  chains,
  selectedChain,
  walletAddresses,
  fullAmount,
  displayAmount,
  copyToClipboard,
}: QRModalProps) {
  const [qrSelectedChain, setQrSelectedChain] = useState<Chain>(selectedChain);
  const [isQrChainDropdownOpen, setIsQrChainDropdownOpen] = useState(false);
  const [qrZoomed, setQrZoomed] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<any>(null);

  // Helper to get QR MetaMask link
  const getQrMetaMaskLink = () => {
    const tokenAddress = USDC_ADDRESSES[qrSelectedChain.id];
    const chainId = SEPOLIA_CHAIN_IDS[qrSelectedChain.id];
    const recipient = getRecipientAddress(qrSelectedChain.id).split(/[\s(]/)[0];
    const amount = fullAmount ? (BigInt(Math.floor(parseFloat(fullAmount) * 1e6)).toString()) : '0';
    return `https://metamask.app.link/send/${tokenAddress}@${chainId}/transfer?address=${recipient}&uint256=${amount}`;
  };

  // Get the full wallet address string for the selected testnet chain
  const getRecipientAddress = (chainId: string) => {
    switch (chainId) {
      case 'ethereum':
        return walletAddresses.eth && walletAddresses.eth.includes('ETH-SEPOLIA') ? walletAddresses.eth : 'Not available';
      case 'base':
        return walletAddresses.base && walletAddresses.base.includes('BASE-SEPOLIA') ? walletAddresses.base : 'Not available';
      case 'arbitrum':
        return walletAddresses.arb && walletAddresses.arb.includes('ARB-SEPOLIA') ? walletAddresses.arb : 'Not available';
      default:
        return 'Not available';
    }
  };

  const qrRecipientAddress = getRecipientAddress(qrSelectedChain.id);

  const handleQrChainChange = (chain: Chain) => {
    setQrSelectedChain(chain);
    setIsQrChainDropdownOpen(false);
    // Close and reopen the modal for animation
    setShowQRModal(false);
    setTimeout(() => setShowQRModal(true), 120); // 120ms for exit animation
  };

  // Update QR code only when modal is open and chain is changed in QR modal
  useEffect(() => {
    if (!showQRModal) return;
    if (!qrSelectedChain || !walletAddresses || !fullAmount) return; // Wait for all data

    // Always use black dots and white background for contrast
    const qrOptions = {
      width: 192,
      height: 192,
      type: 'svg' as const,
      data: getQrMetaMaskLink(),
      dotsOptions: {
        color: '#000000',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: '#000000',
      },
      cornersDotOptions: {
        type: 'dot',
        color: '#000000',
      },
    };

    if (!qrCodeInstance.current) {
      qrCodeInstance.current = new QRCodeStyling(qrOptions);
    } else {
      qrCodeInstance.current.update(qrOptions);
    }
    if (qrRef.current) qrRef.current.innerHTML = '';
    if (qrRef.current) qrCodeInstance.current.append(qrRef.current);
  }, [showQRModal, qrSelectedChain, walletAddresses, fullAmount]);

  return (
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

            {/* Network Selection for QR */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Network:
              </label>
              <div className="relative">
                <motion.button
                  onClick={() => setIsQrChainDropdownOpen(!isQrChainDropdownOpen)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl p-3 flex items-center justify-between hover:border-blue-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{qrSelectedChain.logo}</span>
                    <span className="font-medium text-sm">{qrSelectedChain.name}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isQrChainDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isQrChainDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-gray-700/95 backdrop-blur-sm border border-gray-600 rounded-xl overflow-hidden z-20"
                    >
                      {chains.map((chain, index) => (
                        <motion.button
                          key={chain.id}
                          onClick={() => handleQrChainChange(chain)}
                          className="w-full p-3 flex items-center space-x-3 hover:bg-gray-600/50 transition-colors text-sm"
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
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={qrSelectedChain.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div 
                  className={`mx-auto bg-gray-200 border border-gray-400 rounded-xl flex items-center justify-center mb-4 cursor-pointer transition-all duration-300 ${qrZoomed ? 'w-64 h-64' : 'w-48 h-48'}`}
                  onClick={() => setQrZoomed(!qrZoomed)}
                  whileHover={{ scale: qrZoomed ? 1 : 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Loading spinner if data not ready */}
                  {(!walletAddresses || !fullAmount) ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                    </div>
                  ) : (
                    <div ref={qrRef} className="flex items-center justify-center w-full h-full" />
                  )}
                  <div className="absolute left-0 right-0 bottom-2 text-center pointer-events-none">
                    <div className="text-gray-600 font-medium transition-all duration-300 ${qrZoomed ? 'text-base' : 'text-sm'}">{qrSelectedChain.name}</div>
                    <div className="text-gray-500 transition-all duration-300 ${qrZoomed ? 'text-sm' : 'text-xs'}">{displayAmount} USDC</div>
                  </div>
                </motion.div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Wallet Address:</p>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-700 rounded-lg p-2 flex-1 text-xs font-mono text-center">
                        {qrRecipientAddress}
                      </div>
                      <motion.button
                        onClick={() => {
                          const addressOnly = qrRecipientAddress.split(/[\s(]/)[0];
                          copyToClipboard(addressOnly, 'Address');
                        }}
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
                      <div className="text-lg font-bold text-blue-400" title={fullAmount || ''}>{displayAmount} USDC</div>
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
  );
}

// Constants
const USDC_ADDRESSES: Record<string, string> = {
  ethereum: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  base: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  arbitrum: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
};

const SEPOLIA_CHAIN_IDS: Record<string, string> = {
  ethereum: '11155111',
  base: '84532',
  arbitrum: '421614',
};
