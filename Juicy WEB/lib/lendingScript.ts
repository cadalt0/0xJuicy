import { ethers } from "ethers"


const LENDING_VAULT_ABI = [
  "function originateLoan(string loanId, uint256 usdcAmount, string usdcChain, address usdcAddress) payable",
  "function addLoanFromOtherChain(address user, string loanId, uint256 ethAmount, uint256 usdcAmount)",
  "event LoanOriginated(address indexed user, string loanId, uint256 ethAmount, uint256 usdcAmount, string usdcChain, address usdcAddress)"
]

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
]

interface OriginateLoanParams {
  ethAmount: string // in ETH (e.g. "0.01")
  usdcAmount: string // in USDC (e.g. "10")
  ethChain: "eth" | "linea" // vault selection
  usdcChain: "eth" | "linea" // USDC transfer
  usdcAddress: string
  signer: ethers.Signer // Add signer for connected wallet
  setStep?: (step: 'creating' | 'sending' | 'done') => void // optional callback for UI step
}

function getVaultAddress(chain: "eth" | "linea") {
  if (chain === "eth") {
    return "0x17e2F1adf135088D7Af12B464641c2fa4e907E6e"
  }
  if (chain === "linea") {
    return "0xABb830eD6A9258173e0244850A85bda280405062"
  }
  throw new Error("Unsupported chain: " + chain)
}

function getRpcUrl(chain: "eth" | "linea") {
  if (chain === "eth") {
    if (!process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) throw new Error("Missing NEXT_PUBLIC_SEPOLIA_RPC_URL in env")
    return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
  }
  if (chain === "linea") {
    if (!process.env.NEXT_PUBLIC_LINEA_RPC_URL) throw new Error("Missing NEXT_PUBLIC_LINEA_RPC_URL in env")
    return process.env.NEXT_PUBLIC_LINEA_RPC_URL
  }
  throw new Error("Unsupported chain: " + chain)
}

function getUsdcAddress(chain: "eth" | "linea") {
  if (chain === "eth") {
    if (!process.env.NEXT_PUBLIC_USDC_ADDRESS) throw new Error("Missing NEXT_PUBLIC_USDC_ADDRESS in env")
    return process.env.NEXT_PUBLIC_USDC_ADDRESS
  }
  if (chain === "linea") {
    if (!process.env.NEXT_PUBLIC_USDC_ADDRESS_LINEA) throw new Error("Missing NEXT_PUBLIC_USDC_ADDRESS_LINEA in env")
    return process.env.NEXT_PUBLIC_USDC_ADDRESS_LINEA
  }
  throw new Error("Unsupported chain: " + chain)
}

async function sendUSDCOnChain(chain: "eth" | "linea", to: string, amount: ethers.BigNumberish) {
  const rpcUrl = getRpcUrl(chain)
  const usdcAddress = getUsdcAddress(chain)
  const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY4 as string
  if (!privateKey) throw new Error("Missing NEXT_PUBLIC_PRIVATE_KEY4 in env")
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, wallet)

  const balance = await usdc.balanceOf(wallet.address)
  if (balance < amount) {
    throw new Error(`Insufficient USDC balance. Have: ${ethers.formatUnits(balance, 6)}, need: ${ethers.formatUnits(amount, 6)}`)
  }

  const tx = await usdc.transfer(to, amount)
  await tx.wait()
  return tx.hash
}

export async function originateLoan({ ethAmount, usdcAmount, ethChain, usdcChain, usdcAddress, signer, setStep }: OriginateLoanParams) {
  if (setStep) setStep('creating')
  const vaultAddress = getVaultAddress(ethChain) // Use ethChain for vault selection
  const vault = new ethers.Contract(vaultAddress, LENDING_VAULT_ABI, signer)

  const usdcAmountBN = ethers.parseUnits(usdcAmount, 6)
  const ethAmountBN = ethers.parseEther(ethAmount)
  const loanId = `${Date.now()}`

  const tx = await vault.originateLoan(loanId, usdcAmountBN, usdcChain, usdcAddress, { value: ethAmountBN })
  const receipt = await tx.wait()

  // Find LoanOriginated event
  const iface = new ethers.Interface(LENDING_VAULT_ABI)
  const event = receipt.logs
    .map((log: any) => {
      try { return iface.parseLog(log) } catch { return null }
    })
    .find((parsed: any) => parsed && parsed.name === "LoanOriginated")

  if (event) {
    if (setStep) setStep('sending')
    // Clone loan to the other chain before sending USDC
    const { user, loanId: eventLoanId, ethAmount, usdcAmount: eventUsdcAmount, usdcChain: eventUsdcChain } = event.args
    // Determine the origin chain for the clone suffix
    let originSuffix = ""
    if (ethChain === "eth") {
      originSuffix = "-(eth)"
    } else if (ethChain === "linea") {
      originSuffix = "-(linea)"
    }
    const clonedLoanId = `${eventLoanId}${originSuffix}`
    // Clone to the other chain
    const otherChain = ethChain === "eth" ? "linea" : "eth"
    const otherVaultAddress = getVaultAddress(otherChain)
    const otherRpcUrl = getRpcUrl(otherChain)
    const crossChainAdderKey = process.env.NEXT_PUBLIC_PRIVATE_KEY3 as string
    if (!crossChainAdderKey) throw new Error("Missing NEXT_PUBLIC_PRIVATE_KEY3 in env")
    const otherProvider = new ethers.JsonRpcProvider(otherRpcUrl)
    const crossChainAdder = new ethers.Wallet(crossChainAdderKey, otherProvider)
    const otherVault = new ethers.Contract(otherVaultAddress, LENDING_VAULT_ABI, crossChainAdder)
    await otherVault.addLoanFromOtherChain(user, clonedLoanId, ethAmount, eventUsdcAmount)
    // Send USDC on the selected chain (backend wallet)
    const usdcTxHash = await sendUSDCOnChain(usdcChain, usdcAddress, usdcAmountBN)
    if (setStep) setStep('done')
    return {
      loanId,
      usdcTxHash
    }
  } else {
    throw new Error("No LoanOriginated event found in transaction receipt.")
  }
} 