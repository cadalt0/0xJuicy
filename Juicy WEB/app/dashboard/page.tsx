"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart3,
  Clock, 
  Settings, 
  Bell, 
  Users, 
  Download,
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import header component from dashboard components
import DashboardHeader from "./components/DashboardHeader"

// Import all panel components
import OverviewPanel from "./components/OverviewPanel"
import HistoryPanel from "./components/HistoryPanel"
import SettingsPanel from "./components/SettingsPanel"
import NotificationsPanel from "./components/NotificationsPanel"
import TeamPanel from "./components/TeamPanel"
import ReportsPanel from "./components/ReportsPanel"
import WithdrawPanel from "./components/WithdrawPanel"
import ChainDetailsModal from "./components/ChainDetailsModal"

// Client-side only animated particles component
function AnimatedParticles() {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, targetX: number, targetY: number, duration: number}>>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Generate particles only on client side
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      targetX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      targetY: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      duration: Math.random() * 20 + 10
    }))
    setParticles(newParticles)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
          }}
          animate={{
            x: particle.targetX,
            y: particle.targetY,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </>
  )
}

export default function DashboardPage() {
  const [activePanel, setActivePanel] = useState<'overview' | 'history' | 'settings' | 'notifications' | 'team' | 'reports' | 'withdraw'>('overview')
  const [selectedChain, setSelectedChain] = useState<any>(null)
  const [showChainModal, setShowChainModal] = useState(false)

  const handleChainClick = (chainData: any) => {
    setSelectedChain(chainData)
    setShowChainModal(true)
  }

  const handleNotificationClick = () => {
    setActivePanel('notifications')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,58,237,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.1),transparent_50%)]"></div>
        
        {/* Floating Particles - Client-side only */}
        <AnimatedParticles />
      </div>

      <div className="relative z-10">
        {/* Sticky Header */}
        <DashboardHeader onNotificationClick={handleNotificationClick} />

        <div className="px-6 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Navigation Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'history', label: 'Payment History', icon: Clock },
                  { id: 'withdraw', label: 'Withdraw', icon: Wallet },
                  { id: 'settings', label: 'Chain & Wallet Settings', icon: Settings },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'team', label: 'Team & Roles', icon: Users },
                  { id: 'reports', label: 'Export & Reports', icon: Download }
                ].map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActivePanel(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 border backdrop-blur-sm",
                      activePanel === tab.id
                        ? "bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white border-blue-500/50 shadow-lg shadow-blue-500/25"
                        : "bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50 hover:text-blue-300 hover:border-blue-600/50"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Panel Content */}
            <AnimatePresence mode="wait">
              {activePanel === 'overview' && <OverviewPanel onChainClick={handleChainClick} />}
              {activePanel === 'history' && <HistoryPanel />}
              {activePanel === 'withdraw' && <WithdrawPanel />}
              {activePanel === 'settings' && <SettingsPanel />}
              {activePanel === 'notifications' && <NotificationsPanel />}
              {activePanel === 'team' && <TeamPanel />}
              {activePanel === 'reports' && <ReportsPanel />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Chain Details Modal */}
      <ChainDetailsModal
        isOpen={showChainModal}
        onClose={() => setShowChainModal(false)}
        chainData={selectedChain}
      />
    </div>
  )
}