'use client';

import React, { useEffect, useRef } from 'react';

const ALCHEMY_HTTP_URLS = {
  ethereum: 'https://eth-sepolia.g.alchemy.com/v2/',
  arbitrum: 'https://arb-sepolia.g.alchemy.com/v2/',
  base: 'https://base-sepolia.g.alchemy.com/v2/',
  avalanche: 'https://api.avax-test.network/ext/bc/C/rpc',
};

const USDC_ADDRESSES = {
  ethereum: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  arbitrum: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  base: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  avalanche: '0x5425890298aed601595a70AB815c96711a31Bc65',
};

interface Props {
  chain: 'ethereum' | 'arbitrum' | 'base' | 'avalanche';
  recipient: string;
  expectedAmount: string;
  onConfirmed: (txHash: string) => void;
  setStatus: (status: 'pending' | 'confirmed' | 'error') => void;
  isChecking: boolean;
  setIsChecking: (v: boolean) => void;
  triggerManualCheck: boolean;
  setTriggerManualCheck: (v: boolean) => void;
}

const ConfimUSDC: React.FC<Props> = ({
  chain,
  recipient,
  expectedAmount,
  onConfirmed,
  setStatus,
  isChecking,
  setIsChecking,
  triggerManualCheck,
  setTriggerManualCheck
}) => {
  const foundRef = useRef(false);
  const checkingRef = useRef(false);
  const processedTxsRef = useRef<Set<string>>(new Set());
  const visitTimeRef = useRef<number>(Date.now() / 1000); // seconds since epoch
  const autoCheckTriggeredRef = useRef(false);

  // Always record visit time on mount
  useEffect(() => {
    visitTimeRef.current = Date.now() / 1000;
  }, []);

  // Trigger check when payment is confirmed from wallet (auto) or manually
  useEffect(() => {
    if (!recipient || !expectedAmount) return;
    if (foundRef.current) return;
    // Trigger auto check after wallet payment confirmation (set triggerManualCheck to true externally)
    if (!triggerManualCheck && !autoCheckTriggeredRef.current) return;
    if (checkingRef.current) return;
    checkingRef.current = true;
    setIsChecking(true);
    setStatus('pending');
    processedTxsRef.current.clear();

    const chainsToCheck: ('ethereum' | 'arbitrum' | 'base' | 'avalanche')[] = ['ethereum', 'arbitrum', 'base', 'avalanche'];
    const handlePaymentFound = async (txHash: string) => {
      try {
        foundRef.current = true;
        setStatus('confirmed');
        console.log('Payment found, calling onConfirmed with txHash:', txHash);
        await onConfirmed(txHash);
      } catch (error) {
        console.error('Error in handlePaymentFound:', {
          error,
          txHash,
          chain,
          recipient,
          expectedAmount
        });
        setStatus('error');
        // Reset foundRef to allow retrying
        foundRef.current = false;
      }
    };
    const fetchTransfers = async (targetChain: 'ethereum' | 'arbitrum' | 'base' | 'avalanche') => {
      if (foundRef.current) return false;
      try {
        // Handle Avalanche differently since it doesn't use Alchemy API
        if (targetChain === 'avalanche') {
          // For Avalanche, we'll use a different approach since it doesn't have Alchemy's getAssetTransfers
          // For now, we'll skip Avalanche in the automatic checking
          return false;
        }
        
        const res = await fetch(ALCHEMY_HTTP_URLS[targetChain], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x0',
              toBlock: 'latest',
              contractAddresses: [USDC_ADDRESSES[targetChain]],
              toAddress: recipient,
              category: ['erc20'],
              withMetadata: true,
              excludeZeroValue: true,
            }],
          }),
        });
        const data = await res.json();
        if (!data?.result?.transfers?.length) return false;
        // Only check the latest 10 hashes
        const transfers = data.result.transfers.slice(-10);
        for (const tx of transfers) {
          if (processedTxsRef.current.has(tx.hash)) continue;
          processedTxsRef.current.add(tx.hash);
          // Only consider txs after visit time
          if (tx.metadata?.blockTimestamp) {
            const txTime = Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000);
            if (txTime < visitTimeRef.current) continue;
          }
          // Check if hash is already used
          const usedRes = await fetch(`/api/used-hash/${tx.hash}`);
          if (usedRes.ok) {
            const usedData = await usedRes.json();
            if (usedData?.exists) continue;
          }
          const txValue = BigInt(tx.rawContract.value).toString();
          if (
            txValue === expectedAmount &&
            tx.to?.toLowerCase() === recipient.toLowerCase()
          ) {
            await handlePaymentFound(tx.hash);
            return true;
          }
        }
        return false;
      } catch (error) {
        setStatus('error');
        return false;
      }
    };
    const checkAllChains = async () => {
      for (const ch of chainsToCheck) {
        if (foundRef.current) return true;
        const found = await fetchTransfers(ch);
        if (found) return true;
      }
      return false;
    };
    (async () => {
      await checkAllChains();
      checkingRef.current = false;
      setIsChecking(false);
      setTriggerManualCheck(false);
      autoCheckTriggeredRef.current = true;
    })();
    return () => {
      checkingRef.current = false;
      setIsChecking(false);
      setTriggerManualCheck(false);
    };
  }, [chain, recipient, expectedAmount, triggerManualCheck, onConfirmed, setStatus, setIsChecking, setTriggerManualCheck]);

  return null;
};

export default ConfimUSDC;
