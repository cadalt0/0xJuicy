"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  ChevronDown,
  User,
  LogOut,
  Wallet,
  Droplet,
  Building2,
  CheckCircle
} from "lucide-react"
import MerchantAccountModal from "./MerchantAccountModal"

// Mock notifications for header dropdown
const mockHeaderNotifications = [
  { id: "1", message: "Payment of 234.56 USDC received", time: "2 min ago", type: "payment" },
  { id: "2", message: "New team member added", time: "1 hour ago", type: "team" },
  { id: "3", message: "Weekly report generated", time: "2 hours ago", type: "report" }
]

interface DashboardHeaderProps {
  onNotificationClick: () => void
}

export default function DashboardHeader({ onNotificationClick }: DashboardHeaderProps) {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showMerchantModal, setShowMerchantModal] = useState(false)
  const [isMerchantCreated, setIsMerchantCreated] = useState(false)
  const [userData, setUserData] = useState<{
    email: string;
    name: string;
    picture: string;
  } | null>(null)
  
  const accountDropdownRef = useRef<HTMLDivElement>(null)
  const notificationDropdownRef = useRef<HTMLDivElement>(null)

  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedLogin = localStorage.getItem('googleLogin')
    if (savedLogin) {
      setUserData(JSON.parse(savedLogin))
    }
  }, [])

  // Mock connected wallet
  const connectedWallet = "0x742d35Cc6634C0532925a3b8D4C9db98098"

  const handleLogout = () => {
    // Clear localStorage and state
    localStorage.removeItem('googleLogin')
    setUserData(null)
    setShowAccountDropdown(false)
    // Redirect to home page
    window.location.href = '/'
  }

  const handleMerchantSuccess = () => {
    setIsMerchantCreated(true)
  }

  if (!userData) {
    return null // Don't render if no user data
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl mb-8"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
                className="relative"
              >
                <Droplet className="text-blue-400 w-8 h-8 drop-shadow-lg" />
                <motion.div
                  className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Juicy Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Setup Merchant Account Button */}
              <motion.button
                onClick={() => setShowMerchantModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25 border border-green-500/30"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMerchantCreated ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Merchant Account</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>Setup Merchant Account</span>
                  </>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationDropdownRef}>
                <motion.button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-200 border border-gray-700/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="w-5 h-5" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>

                <AnimatePresence>
                  {showNotificationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-50"
                    >
                      <div className="p-4 border-b border-gray-700/50">
                        <h3 className="font-semibold text-white">Recent Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {mockHeaderNotifications.map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            className="p-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 last:border-b-0"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <p className="text-sm text-white">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div className="p-4 border-t border-gray-700/50">
                        <Button
                          onClick={() => {
                            onNotificationClick()
                            setShowNotificationDropdown(false)
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View All Notifications
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Google Account Dropdown */}
              <div className="relative" ref={accountDropdownRef}>
                <motion.button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {userData.picture ? (
                    <img 
                      src={userData.picture} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border border-gray-700"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {userData.name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{userData.name}</p>
                    <p className="text-xs text-gray-400">{userData.email}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: showAccountDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {showAccountDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-50"
                    >
                      <div className="p-4 border-b border-gray-700/50">
                        <div className="flex items-center gap-3">
                          {userData.picture ? (
                            <img 
                              src={userData.picture} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full border border-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg">
                              {userData.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white">{userData.name}</p>
                            <p className="text-sm text-gray-400">{userData.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <motion.button
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors text-left"
                          whileHover={{ x: 5 }}
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-white">Profile Settings</span>
                        </motion.button>
                        <motion.button
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors text-left"
                          whileHover={{ x: 5 }}
                        >
                          <Wallet className="w-4 h-4 text-gray-400" />
                          <span className="text-white">Wallet Settings</span>
                        </motion.button>
                        <motion.button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-900/50 transition-colors text-left"
                          whileHover={{ x: 5 }}
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Logout</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <p className="text-gray-300 mt-2">Monitor your USDC payment flows and system performance</p>
        </div>
      </motion.div>

      {/* Merchant Account Modal - Separate Component */}
      <MerchantAccountModal
        isOpen={showMerchantModal}
        onClose={() => setShowMerchantModal(false)}
        onSuccess={handleMerchantSuccess}
        userEmail={userData.email}
        connectedWallet={connectedWallet}
      />
    </>
  )
}