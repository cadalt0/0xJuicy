"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Activity, Clock, TrendingUp, TrendingDown, Wifi, WifiOff, AlertTriangle, CheckCircle, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"

interface NetworkData {
  id: string
  name: string
  logo: string
  gasPrice: number
  gasTrend: 'up' | 'down' | 'stable'
  speed: 'fast' | 'medium' | 'slow'
  congestion: number // 0-100
  status: 'healthy' | 'degraded' | 'down'
  avgBlockTime: number
  color: string
}

// Mock network data with VERY LOW congestion (3-15% max) - Only ETH, AVAX, BASE, LINEA
const mockNetworkData: NetworkData[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    logo: '⟠',
    gasPrice: 18.2,
    gasTrend: 'down',
    speed: 'fast',
    congestion: 15, // Very low
    status: 'healthy',
    avgBlockTime: 12.1,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'linea',
    name: 'Linea',
    logo: '🟢',
    gasPrice: 0.4,
    gasTrend: 'stable',
    speed: 'fast',
    congestion: 6, // Very low
    status: 'healthy',
    avgBlockTime: 1.8,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'base',
    name: 'Base',
    logo: '🔵',
    gasPrice: 0.9,
    gasTrend: 'down',
    speed: 'fast',
    congestion: 12, // Very low
    status: 'healthy',
    avgBlockTime: 2.0,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    logo: '🔺',
    gasPrice: 0.8,
    gasTrend: 'stable',
    speed: 'fast',
    congestion: 10, // Very low
    status: 'healthy',
    avgBlockTime: 2.5,
    color: 'from-red-600 to-pink-600'
  }
]

// Client-side only time component to avoid hydration mismatch
function ClientTime() {
  const [time, setTime] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(new Date().toLocaleTimeString())
    
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <span>Loading...</span>
  }

  return <span>{time}</span>
}

export default function NetworkStatusWidget() {
  const [networks, setNetworks] = useState<NetworkData[]>(mockNetworkData)
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum')

  // Simulate real-time updates but keep congestion VERY LOW
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworks(prev => prev.map(network => ({
        ...network,
        gasPrice: Math.max(0.01, network.gasPrice + (Math.random() - 0.5) * 1.5),
        // Keep congestion between 3-15% maximum
        congestion: Math.max(3, Math.min(15, network.congestion + (Math.random() - 0.5) * 2)),
        gasTrend: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'up' : 'down') : network.gasTrend,
        avgBlockTime: Math.max(0.1, network.avgBlockTime + (Math.random() - 0.5) * 0.5)
      })))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const selectedNetworkData = networks.find(n => n.id === selectedNetwork) || networks[0]

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'slow': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'down': return <WifiOff className="w-4 h-4 text-red-400" />
      default: return <Wifi className="w-4 h-4 text-gray-400" />
    }
  }

  const getCongestionColor = (congestion: number) => {
    if (congestion < 10) return 'from-green-500 to-emerald-500'
    if (congestion < 20) return 'from-green-400 to-yellow-400'
    if (congestion < 40) return 'from-yellow-500 to-orange-500'
    return 'from-orange-500 to-red-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="w-80"
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Activity className="w-5 h-5 text-green-400" />
            </motion.div>
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Network Selector */}
          <div className="grid grid-cols-2 gap-2">
            {networks.map((network, index) => (
              <motion.button
                key={network.id}
                onClick={() => setSelectedNetwork(network.id)}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 backdrop-blur-sm",
                  selectedNetwork === network.id
                    ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500/50 shadow-lg shadow-blue-500/25"
                    : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50"
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{network.logo}</span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">{network.name}</p>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(network.status)}
                      <span className={cn("text-xs", getSpeedColor(network.speed))}>
                        {network.speed}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Selected Network Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNetwork}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Gas Price */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-200">Gas Price</span>
                  </div>
                  <motion.div
                    animate={selectedNetworkData.gasTrend === 'up' ? { y: [-2, 2, -2] } : selectedNetworkData.gasTrend === 'down' ? { y: [2, -2, 2] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {selectedNetworkData.gasTrend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-red-400" />
                    ) : selectedNetworkData.gasTrend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 bg-gray-400 rounded-full" />
                    )}
                  </motion.div>
                </div>
                <div className="flex items-baseline gap-2">
                  <motion.span 
                    className="text-2xl font-bold text-white"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {selectedNetworkData.gasPrice.toFixed(selectedNetworkData.gasPrice < 1 ? 2 : 1)}
                  </motion.span>
                  <span className="text-sm text-gray-400">
                    {selectedNetworkData.id === 'ethereum' ? 'gwei' : 
                     selectedNetworkData.id === 'avalanche' ? 'nAVAX' :
                     selectedNetworkData.id === 'base' ? 'gwei' :
                     selectedNetworkData.id === 'linea' ? 'gwei' : 'gwei'}
                  </span>
                </div>
              </div>

              {/* Network Congestion */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-gray-200">Network Congestion</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {selectedNetworkData.congestion.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className={cn("h-full bg-gradient-to-r rounded-full", getCongestionColor(selectedNetworkData.congestion))}
                    initial={{ width: "0%" }}
                    animate={{ width: `${selectedNetworkData.congestion}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Block Time */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-gray-200">Avg Block Time</span>
                  </div>
                  <div className="text-right">
                    <motion.span 
                      className="text-lg font-bold text-white"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {selectedNetworkData.avgBlockTime.toFixed(1)}s
                    </motion.span>
                  </div>
                </div>
              </div>

              {/* Speed Indicator */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-4 border border-gray-600/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-gray-200">Network Speed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-green-400"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-sm font-semibold text-green-400 capitalize">
                      {selectedNetworkData.speed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <motion.div 
                className="text-center text-xs text-gray-500"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Last updated: <ClientTime />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}