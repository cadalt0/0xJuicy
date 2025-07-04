"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Settings, ArrowLeft, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock notifications data
const mockNotifications = [
  { id: "1", type: "payment", message: "Payment of 234.56 USDC received", time: "2 min ago", severity: "success" },
  { id: "2", type: "failed", message: "Mint failed for transaction REQ123458", time: "15 min ago", severity: "error" },
  { id: "3", type: "recovery", message: "Manual recovery required for 89.34 USDC", time: "1 hour ago", severity: "warning" },
  { id: "4", type: "system", message: "Admin changed recovery wallet", time: "2 hours ago", severity: "info" }
]

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'success': return 'text-green-400 bg-green-900/30 border-green-500/30'
    case 'error': return 'text-red-400 bg-red-900/30 border-red-500/30'
    case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30'
    case 'info': return 'text-blue-400 bg-blue-900/30 border-blue-500/30'
    default: return 'text-gray-400 bg-gray-900/30 border-gray-500/30'
  }
}

export default function NotificationsPanel() {
  const [showSettings, setShowSettings] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    telegram: true,
    email: true,
    sms: false,
    realtime: true
  })

  const toggleSetting = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <motion.div
      key="notifications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              {showSettings ? 'Notification Settings' : 'Notifications & System Logs'}
            </CardTitle>
            <div className="flex items-center gap-2">
              {showSettings ? (
                <motion.button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {showSettings ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {[
                    { 
                      key: 'telegram' as const, 
                      label: 'Telegram Notifications', 
                      description: 'Receive instant notifications via Telegram bot',
                      icon: '📱',
                      color: 'from-blue-500 to-blue-600'
                    },
                    { 
                      key: 'email' as const, 
                      label: 'Email Notifications', 
                      description: 'Get detailed reports and alerts via email',
                      icon: '📧',
                      color: 'from-green-500 to-green-600'
                    },
                    { 
                      key: 'sms' as const, 
                      label: 'SMS Notifications', 
                      description: 'Critical alerts sent to your phone number',
                      icon: '💬',
                      color: 'from-purple-500 to-purple-600'
                    },
                    { 
                      key: 'realtime' as const, 
                      label: 'Real-time Notifications', 
                      description: 'Live updates in the dashboard interface',
                      icon: '⚡',
                      color: 'from-yellow-500 to-yellow-600'
                    }
                  ].map((setting, index) => (
                    <motion.div
                      key={setting.key}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{setting.icon}</span>
                        <div>
                          <p className="font-semibold text-white">{setting.label}</p>
                          <p className="text-sm text-gray-400">{setting.description}</p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => toggleSetting(setting.key)}
                        className={cn(
                          "relative w-14 h-7 rounded-full transition-all duration-300 border-2",
                          notificationSettings[setting.key]
                            ? `bg-gradient-to-r ${setting.color} border-transparent shadow-lg`
                            : "bg-gray-700 border-gray-600"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className={cn(
                            "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300",
                            notificationSettings[setting.key]
                              ? "bg-white right-0.5 shadow-lg"
                              : "bg-gray-400 left-0.5"
                          )}
                          animate={{
                            x: notificationSettings[setting.key] ? 0 : 0
                          }}
                        />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-4 border-t border-gray-700"
                >
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                    Save Settings
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {mockNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    className={cn("p-4 rounded-xl border", getSeverityColor(notification.severity))}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-current" />
                        <div>
                          <p className="font-semibold">{notification.message}</p>
                          <p className="text-sm opacity-80">{notification.time}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}