import { createWalletClient, encodeFunctionData, custom } from 'viem'
import { sepolia, baseSepolia } from 'viem/chains'

const USDC: Record<string, `0x${string}`> = {
  ethereum: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',      // Sepolia
  base:     '0x036CbD53842c5426634e7929541eC2318f3dCF7e',      // Base Sepolia
  arbitrum: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',      // Arbitrum Sepolia
  avalanche: '0x5425890298aed601595a70AB815c96711a31Bc65',     // Avalanche Fuji
  linea:    '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7',      // Linea Sepolia
}

const TOKEN_MESSENGER: Record<string, `0x${string}`> = {
  ethereum: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  base:     '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  arbitrum: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  avalanche: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  linea:    '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
}

const MESSAGE_TRANSMITTER: Record<string, `0x${string}`> = {
  ethereum: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
  base:     '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
  arbitrum: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
  avalanche: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
  linea:    '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
}

const DOMAIN: Record<string, number> = {
  ethereum: 0,   // Sepolia
  base: 6,       // Base Sepolia
  arbitrum: 3,   // Arbitrum Sepolia
  avalanche: 1,  // Avalanche Fuji
  linea: 11,     // Linea Sepolia
}

const CHAIN_IDS: Record<string, number> = {
  ethereum: 11155111, // Sepolia
  base: 84532,        // Base Sepolia
  arbitrum: 421614,   // Arbitrum Sepolia
  avalanche: 43113,   // Avalanche Fuji
  linea: 59141,       // Linea Sepolia
}

const CHAIN_OBJECTS: Record<string, any> = {
  ethereum: sepolia,
  base: baseSepolia,
  arbitrum: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    network: 'arbitrum-sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://arb-sepolia.g.alchemy.com/v2/'] },
      public: { http: ['https://arb-sepolia.g.alchemy.com/v2/'] },
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
    },
    contracts: {},
  },
  avalanche: {
    id: 43113,
    name: 'Avalanche Fuji',
    network: 'avalanche-fuji',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
      public: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
    },
    blockExplorers: {
      default: { name: 'Snowtrace', url: 'https://testnet.snowtrace.io' },
    },
    contracts: {},
  },
  linea: {
    id: 59141,
    name: 'Linea Sepolia',
    network: 'linea-sepolia',
    nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
      public: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
    },
    blockExplorers: {
      default: { name: 'LineaScan', url: 'https://sepolia.lineascan.build' },
    },
    contracts: {},
  },
}

const USDC_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

const TOKEN_MESSENGER_ABI = [
  {
    type: 'function',
    name: 'depositForBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
    ],
    outputs: [],
  },
] as const

const MESSAGE_TRANSMITTER_ABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [],
  },
] as const

function toBytes32(address: string): `0x${string}` {
  return `0x${address.replace(/^0x/, '').padStart(64, '0')}` as `0x${string}`
}

export async function bridgeUSDC({
  amount,
  recipient,
  provider,
  userAddress,
  source,
  destination,
  onStep,
}: {
  amount: bigint
  recipient: string
  provider: any
  userAddress: `0x${string}`
  source: string
  destination: string
  onStep?: (step: string) => void
}) {
  try {
    // Validate addresses and chain configs
    if (!USDC[source]) throw new Error(`Invalid source chain: ${source}`)
    if (!USDC[destination]) throw new Error(`Invalid destination chain: ${destination}`)
    if (!TOKEN_MESSENGER[source]) throw new Error(`TokenMessenger not found for source chain: ${source}`)
    if (!MESSAGE_TRANSMITTER[destination]) throw new Error(`MessageTransmitter not found for destination chain: ${destination}`)
    if (DOMAIN[source] === undefined) throw new Error(`Domain not found for source chain: ${source}`)
    if (DOMAIN[destination] === undefined) throw new Error(`Domain not found for destination chain: ${destination}`)
    
    // Validate recipient address
    if (!recipient || !recipient.startsWith('0x') || recipient.length !== 42) {
      throw new Error('Invalid recipient address')
    }

    // Switch to the correct source chain before burning
    const sourceChainId = CHAIN_IDS[source];
    if (!sourceChainId) throw new Error('Unsupported source chain');
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + sourceChainId.toString(16) }],
      });
    } catch (switchError) {
      console.error('Error switching to source chain:', switchError);
      throw switchError;
    }

    // 1. Approve USDC
    onStep?.('approve')
    const walletClient = createWalletClient({
      chain: CHAIN_OBJECTS[source],
      transport: custom(provider),
      account: userAddress,
    })

    const sourceUSDC = USDC[source]
    const sourceTokenMessenger = TOKEN_MESSENGER[source]
    
    if (!sourceUSDC || !sourceTokenMessenger) {
      throw new Error('Missing contract addresses for source chain')
    }

    await walletClient.sendTransaction({
      chain: null,
      to: sourceUSDC,
      data: encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'approve',
        args: [sourceTokenMessenger, BigInt(10000000000)],
      }),
    })

    // 2. Burn USDC (depositForBurn)
    onStep?.('burn')
    const mintRecipient = toBytes32(recipient)
    const destinationCaller = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
    const destDomain = DOMAIN[destination]
    const burnArgs = [
      amount,
      destDomain,
      mintRecipient,
      sourceUSDC,
      destinationCaller,
      BigInt(500), // maxFee
      1000, // minFinalityThreshold
    ] as const

    const burnTxHash = await walletClient.sendTransaction({
      chain: null,
      to: sourceTokenMessenger,
      data: encodeFunctionData({
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: burnArgs,
      }),
    })

    // 3. Poll for attestation (use correct source domain for polling)
    onStep?.('attestation')
    let attestation: any = null
    const sourceDomain = DOMAIN[source]
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${burnTxHash}`
    while (!attestation) {
      try {
        const response = await fetch(url)
        const data = await response.json()
        if (data?.messages?.[0]?.status === 'complete') {
          attestation = data.messages[0]
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } catch (err) {
        console.error('Attestation Polling Error:', err)
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }

    // 4. Switch to destination chain and mint USDC (use correct MessageTransmitter)
    onStep?.('mint')
    const destChainId = CHAIN_IDS[destination]
    if (!destChainId) throw new Error('Unsupported destination chain')
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + destChainId.toString(16) }],
      });
    } catch (switchError) {
      console.error('Error switching to destination chain:', switchError);
      throw switchError;
    }

    // Use the correct chain object for the wallet client
    let chainObj
    if (destination === 'ethereum') chainObj = sepolia
    else if (destination === 'base') chainObj = baseSepolia
    else if (destination === 'arbitrum') chainObj = {
      id: 421614,
      name: 'Arbitrum Sepolia',
      network: 'arbitrum-sepolia',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://arb-sepolia.g.alchemy.com/v2/'] },
        public: { http: ['https://arb-sepolia.g.alchemy.com/v2/'] },
      },
      blockExplorers: {
        default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
      },
      contracts: {},
    }
    else if (destination === 'avalanche') chainObj = {
      id: 43113,
      name: 'Avalanche Fuji',
      network: 'avalanche-fuji',
      nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
        public: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
      },
      blockExplorers: {
        default: { name: 'Snowtrace', url: 'https://testnet.snowtrace.io' },
      },
      contracts: {},
    }
    else if (destination === 'linea') chainObj = {
      id: 59141,
      name: 'Linea Sepolia',
      network: 'linea-sepolia',
      nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
        public: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
      },
      blockExplorers: {
        default: { name: 'LineaScan', url: 'https://sepolia.lineascan.build' },
      },
      contracts: {},
    }
    else throw new Error('Unsupported destination chain for minting')

    const walletClientDest = createWalletClient({
      chain: chainObj,
      transport: custom(provider),
      account: userAddress,
    })

    const destMessageTransmitter = MESSAGE_TRANSMITTER[destination]
    if (!destMessageTransmitter) {
      throw new Error('Missing MessageTransmitter address for destination chain')
    }

    if (!attestation?.message || !attestation?.attestation) {
      throw new Error('Invalid attestation data')
    }

    const mintTx = await walletClientDest.sendTransaction({
      to: destMessageTransmitter,
      data: encodeFunctionData({
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [attestation.message as `0x${string}`, attestation.attestation as `0x${string}`],
      }),
    })
    onStep?.('done')
    return mintTx
  } catch (error) {
    console.error('CCTP Bridge Error:', error)
    throw error
  }
}

export async function recoverUSDC({
  burnTxHash,
  sourceChain,
  destinationChain,
  destinationWallet,
  provider,
  userAddress,
  onStep,
}: {
  burnTxHash: string
  sourceChain: string
  destinationChain: string
  destinationWallet: string
  provider: any
  userAddress: `0x${string}`
  onStep?: (step: string) => void
}) {
  try {
    // Validate inputs
    if (!burnTxHash || !burnTxHash.startsWith('0x')) {
      throw new Error('Invalid burn transaction hash')
    }
    if (!destinationWallet || !destinationWallet.startsWith('0x') || destinationWallet.length !== 42) {
      throw new Error('Invalid destination wallet address')
    }
    if (!USDC[sourceChain]) throw new Error(`Invalid source chain: ${sourceChain}`)
    if (!USDC[destinationChain]) throw new Error(`Invalid destination chain: ${destinationChain}`)
    if (!TOKEN_MESSENGER[sourceChain]) throw new Error(`TokenMessenger not found for source chain: ${sourceChain}`)
    if (DOMAIN[sourceChain] === undefined) throw new Error(`Domain not found for source chain: ${sourceChain}`)
    if (DOMAIN[destinationChain] === undefined) throw new Error(`Domain not found for destination chain: ${destinationChain}`)

    // 1. Validate signature and locate funds
    onStep?.('validate')
    const sourceDomain = DOMAIN[sourceChain]
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${burnTxHash}`
    
    let messageData: any = null
    try {
      const response = await fetch(url)
      const data = await response.json()
      if (data?.messages?.[0]) {
        messageData = data.messages[0]
      } else {
        throw new Error('No message found for this transaction hash')
      }
    } catch (err) {
      console.error('Error fetching message data:', err)
      throw new Error('Failed to validate burn transaction. Please check the transaction hash.')
    }

    // 2. Locate funds
    onStep?.('locate')
    if (!messageData?.message || !messageData?.attestation) {
      throw new Error('Incomplete message data found. Recovery may not be possible.')
    }

    // Validate that message and attestation are valid hex strings
    const isValidHex = (str: string) => {
      return typeof str === 'string' && str.startsWith('0x') && /^0x[0-9a-fA-F]+$/.test(str)
    }

    if (!isValidHex(messageData.message)) {
      console.error('Invalid message format:', messageData.message)
      throw new Error('Invalid message format received from Circle API. The message may still be pending or failed.')
    }

    if (!isValidHex(messageData.attestation)) {
      console.error('Invalid attestation format:', messageData.attestation)
      throw new Error('Invalid attestation format received from Circle API. The attestation may still be pending or failed.')
    }

    // Check message status
    console.log('Message status:', messageData.status)
    console.log('Message data:', messageData)

    // Only allow recovery for messages that are in a recoverable state
    if (messageData.status === 'pending') {
      throw new Error('Message is still pending. Please wait for the attestation to be generated before attempting recovery.')
    }

    if (messageData.status === 'failed') {
      throw new Error('Message has failed. Recovery may not be possible for this transaction.')
    }

    // 3. Prepare recovery
    onStep?.('prepare')
    
    // Switch to the destination chain (where the mint should happen)
    const destChainId = CHAIN_IDS[destinationChain]
    if (!destChainId) throw new Error('Unsupported destination chain')
    
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + destChainId.toString(16) }],
      })
    } catch (switchError) {
      console.error('Error switching to destination chain:', switchError)
      throw switchError
    }

    // Use the correct chain object for the wallet client
    let chainObj
    if (destinationChain === 'ethereum') chainObj = sepolia
    else if (destinationChain === 'base') chainObj = baseSepolia
    else if (destinationChain === 'arbitrum') chainObj = {
      id: 421614,
      name: 'Arbitrum Sepolia',
      network: 'arbitrum-sepolia',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://arb-sepolia.g.alchemy.com/v2/'] },
        public: { http: ['https://arb-sepolia.g.alchemy.com/v2/'] },
      },
      blockExplorers: {
        default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
      },
      contracts: {},
    }
    else if (destinationChain === 'avalanche') chainObj = {
      id: 43113,
      name: 'Avalanche Fuji',
      network: 'avalanche-fuji',
      nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
        public: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
      },
      blockExplorers: {
        default: { name: 'Snowtrace', url: 'https://testnet.snowtrace.io' },
      },
      contracts: {},
    }
    else if (destinationChain === 'linea') chainObj = {
      id: 59141,
      name: 'Linea Sepolia',
      network: 'linea-sepolia',
      nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
        public: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
      },
      blockExplorers: {
        default: { name: 'LineaScan', url: 'https://sepolia.lineascan.build' },
      },
      contracts: {},
    }
    else throw new Error('Unsupported destination chain for recovery')

    const walletClient = createWalletClient({
      chain: chainObj,
      transport: custom(provider),
      account: userAddress,
    })

    // 4. Execute recovery
    onStep?.('execute')
    
    // Use the MessageTransmitter to receive the message on the destination chain
    // This will mint the USDC to the destination wallet
    const destMessageTransmitter = MESSAGE_TRANSMITTER[destinationChain]
    if (!destMessageTransmitter) {
      throw new Error('Missing MessageTransmitter address for destination chain')
    }

    // Ensure message and attestation are properly formatted as hex strings
    const message = messageData.message as `0x${string}`
    const attestation = messageData.attestation as `0x${string}`

    console.log('Sending recovery transaction with:')
    console.log('Message length:', message.length)
    console.log('Attestation length:', attestation.length)

    const recoveryTx = await walletClient.sendTransaction({
      to: destMessageTransmitter,
      data: encodeFunctionData({
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [message, attestation],
      }),
    })

    onStep?.('complete')
    return recoveryTx
  } catch (error) {
    console.error('CCTP Recovery Error:', error)
    throw error
  }
}