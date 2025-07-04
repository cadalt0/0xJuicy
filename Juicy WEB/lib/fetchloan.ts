import { ethers } from "ethers"

const LENDING_VAULT_ABI = [
  "function getLoan(address user, string loanId) view returns (uint256 ethAmount, uint256 usdcAmount, bool repaid, bool active)"
]

interface LoanResult {
  chain: string
  ethAmount: string
  usdcAmount: string
  repaid: boolean
  active: boolean
}

export async function fetchLoanOnAllChains(user: string, loanId: string): Promise<LoanResult[]> {
  const results: LoanResult[] = []
  const chains = [
    {
      label: "Sepolia",
      rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
      vaultAddress: process.env.NEXT_PUBLIC_LENDING_VAULT_ADDRESS
    },
    {
      label: "Linea",
      rpcUrl: process.env.NEXT_PUBLIC_LINEA_RPC_URL,
      vaultAddress: process.env.NEXT_PUBLIC_LENDING_VAULT_ADDRESSL
    }
  ]

  for (const chain of chains) {
    if (!chain.rpcUrl || !chain.vaultAddress) continue
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl)
    const vault = new ethers.Contract(chain.vaultAddress, LENDING_VAULT_ABI, provider)
    try {
      const loan = await vault.getLoan(user, loanId)
      // ethers v6: returns [ethAmount, usdcAmount, repaid, active] as array or object
      const ethAmount = loan.ethAmount ?? loan[0]
      const usdcAmount = loan.usdcAmount ?? loan[1]
      const repaid = loan.repaid ?? loan[2]
      const active = loan.active ?? loan[3]
      if ((ethAmount === 0n || ethAmount === "0") && (usdcAmount === 0n || usdcAmount === "0")) {
        continue // not found
      }
      results.push({
        chain: chain.label,
        ethAmount: ethers.formatEther(ethAmount),
        usdcAmount: ethers.formatUnits(usdcAmount, 6),
        repaid,
        active
      })
    } catch (err) {
      // skip errors for missing loans
      continue
    }
  }
  return results
}
