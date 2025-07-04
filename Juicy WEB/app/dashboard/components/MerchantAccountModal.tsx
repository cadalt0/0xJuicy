"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Building2,
  CheckCircle,
  X,
  AlertTriangle,
  Mail,
  UserCheck,
  Globe,
  User,
  Wallet
} from "lucide-react"

// Supported chains for merchant account
const supportedChains = [
  { id: 'ethereum', name: 'Ethereum', logo: '⟠' },
  { id: 'base', name: 'Base', logo: '🔵' },
  { id: 'arbitrum', name: 'Arbitrum', logo: '🔷' },
  { id: 'linea', name: 'Linea', logo: '🟢' }
]

interface MerchantAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userEmail: string
  connectedWallet: string
}

export default function MerchantAccountModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userEmail, 
  connectedWallet 
}: MerchantAccountModalProps) {
  const [isCreatingMerchant, setIsCreatingMerchant] = useState(false)
  const [isMerchantCreated, setIsMerchantCreated] = useState(false)
  const [merchantForm, setMerchantForm] = useState({
    username: '',
    fullName: '',
    destinedChain: ''
  })

  const handleCreateMerchant = async () => {
    if (!merchantForm.username || !merchantForm.fullName || !merchantForm.destinedChain) return
    
    setIsCreatingMerchant(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsCreatingMerchant(false)
      setIsMerchantCreated(true)
      
      // Close modal after 2 seconds and notify parent
      setTimeout(() => {
        onSuccess()
        onClose()
        // Reset form for next time
        setMerchantForm({ username: '', fullName: '', destinedChain: '' })
        setIsMerchantCreated(false)
      }, 2000)
    }, 2000)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleClose = () => {
    if (!isCreatingMerchant && !isMerchantCreated) {
      onClose()
      // Reset form
      setMerchantForm({ username: '', fullName: '', destinedChain: '' })
      setIsMerchantCreated(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          style={{ 
            zIndex: 99999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-3xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-gray-700/50 backdrop-blur-xl relative"
            style={{
              zIndex: 99999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            {!isCreatingMerchant && !isMerchantCreated && (
              <motion.button
                onClick={handleClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}

            <AnimatePresence mode="wait">
              {isMerchantCreated ? (
                /* Success State */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold text-white mb-3"
                  >
                    Merchant Account Created!
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-300 mb-4 text-sm"
                  >
                    Your merchant account has been successfully set up. You can now accept business payments.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-green-400" />
                      <div className="text-left">
                        <p className="font-semibold text-green-300 text-sm">Account Active</p>
                        <p className="text-xs text-green-400/80">Ready to accept payments</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : isCreatingMerchant ? (
                /* Loading State */
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4"
                  >
                    <Building2 className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-white mb-3">Creating Account...</h3>
                  <p className="text-gray-300 mb-4 text-sm">Setting up your merchant account. This will take a moment.</p>

                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              ) : (
                /* Form State - All fields visible at once */
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-3"
                    >
                      <Building2 className="w-6 h-6 text-white" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      Setup Merchant Account
                    </h3>

                    <p className="text-gray-300 text-sm">
                      Create your business account to accept payments
                    </p>
                  </div>

                  {/* Logged in Google Email - Grayed */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <Mail className="w-3 h-3 text-blue-400" />
                      Email Address
                    </Label>
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-2">
                      <span className="text-gray-400 font-mono text-sm">{userEmail}</span>
                    </div>
                  </div>

                  {/* Username Option */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <UserCheck className="w-3 h-3 text-purple-400" />
                      Username
                    </Label>
                    <Input
                      placeholder="Enter your username"
                      value={merchantForm.username}
                      onChange={(e) => setMerchantForm(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-gray-800/50 border-gray-600/50 text-white h-9"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <User className="w-3 h-3 text-green-400" />
                      Full Name
                    </Label>
                    <Input
                      placeholder="Enter your full name"
                      value={merchantForm.fullName}
                      onChange={(e) => setMerchantForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="bg-gray-800/50 border-gray-600/50 text-white h-9"
                    />
                  </div>

                  {/* Connected Wallet Box - Grayed */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <Wallet className="w-3 h-3 text-yellow-400" />
                      Connected Wallet
                    </Label>
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-2">
                      <span className="text-gray-400 font-mono text-sm">{formatAddress(connectedWallet)}</span>
                    </div>
                  </div>

                  {/* Warning about merchant wallet cost */}
                  <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <div>
                        <p className="font-semibold text-orange-300 text-sm">Setup Fee</p>
                        <p className="text-xs text-orange-400/80">Merchant wallet costs $2 after creating once</p>
                      </div>
                    </div>
                  </div>

                  {/* Destined Chain Dropdown - Now Grayed Like Wallet */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <Globe className="w-3 h-3 text-blue-400" />
                      Destined Chain
                    </Label>
                    <div className="bg-gray-800/50 border border-gray-600/50 rounded-xl p-2">
                      <Select value={merchantForm.destinedChain} onValueChange={(value) => setMerchantForm(prev => ({ ...prev, destinedChain: value }))}>
                        <SelectTrigger className="bg-transparent border-none text-gray-400 p-0 h-auto focus:ring-0">
                          <SelectValue placeholder="Select destination chain" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-xl">
                          {supportedChains.map((chain) => (
                            <SelectItem 
                              key={chain.id} 
                              value={chain.id} 
                              className="text-white hover:bg-gray-800/80 focus:bg-gray-800/80"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{chain.logo}</span>
                                <span className="font-medium text-white">{chain.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateMerchant}
                    disabled={!merchantForm.username || !merchantForm.fullName || !merchantForm.destinedChain}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Merchant Account
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}