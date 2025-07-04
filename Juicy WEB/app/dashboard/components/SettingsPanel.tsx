"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Globe, Wallet, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

const getChainLogo = (chain: string) => {
  const logos: Record<string, string> = {
    'Base': '🔵',
    'Arbitrum': '🔷', 
    'Ethereum': '⟠',
    'Linea': '🟢'
  }
  return logos[chain] || '🔗'
}

export default function SettingsPanel() {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chain Settings */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Chain Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-200">Default Destination Chain</Label>
              <Select defaultValue="base">
                <SelectTrigger className="mt-2 bg-gray-800/50 border-gray-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                  <SelectItem value="base" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">🔵 Base</SelectItem>
                  <SelectItem value="arbitrum" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">🔷 Arbitrum</SelectItem>
                  <SelectItem value="ethereum" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">⟠ Ethereum</SelectItem>
                  <SelectItem value="linea" className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80">🟢 Linea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-200">Supported Chains</Label>
              {['Base', 'Arbitrum', 'Ethereum', 'Linea'].map((chain) => (
                <div key={chain} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getChainLogo(chain)}</span>
                    <span className="font-semibold text-white">{chain}</span>
                  </div>
                  <motion.div
                    className="w-12 h-6 bg-green-600 rounded-full p-1 cursor-pointer"
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full"
                      animate={{ x: 20 }}
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Settings */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-400" />
              Receiving Wallets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['Base', 'Arbitrum', 'Ethereum', 'Linea'].map((chain) => (
              <div key={chain} className="space-y-2">
                <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <span>{getChainLogo(chain)}</span>
                  {chain} Wallet
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="0x..."
                    defaultValue="0x742d35Cc6634C0532925a3b8D4C9db..."
                    className="bg-gray-800/50 border-gray-600/50 text-white font-mono text-sm"
                  />
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-700">
              <Label className="text-sm font-semibold text-gray-200">Recovery Wallet</Label>
              <Input
                placeholder="Fallback wallet for failed transactions"
                className="mt-2 bg-gray-800/50 border-gray-600/50 text-white font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}