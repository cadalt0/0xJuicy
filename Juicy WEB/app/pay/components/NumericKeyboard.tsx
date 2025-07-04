"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Delete, RotateCcw } from "lucide-react"

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void
}

export default function NumericKeyboard({ onKeyPress }: NumericKeyboardProps) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'delete']
  ]

  const getKeyContent = (key: string) => {
    switch (key) {
      case 'delete':
        return <Delete className="w-3 h-3" />
      case 'clear':
        return <RotateCcw className="w-3 h-3" />
      default:
        return key
    }
  }

  const getKeyStyle = (key: string) => {
    switch (key) {
      case 'delete':
        return "bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-700/80 hover:to-red-800/80 text-white border-red-500/30"
      case 'clear':
        return "bg-gradient-to-r from-orange-600/80 to-orange-700/80 hover:from-orange-700/80 hover:to-orange-800/80 text-white border-orange-500/30"
      case '.':
        return "bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-700/80 hover:to-blue-800/80 text-white border-blue-500/30"
      default:
        return "bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/80 hover:to-gray-600/80 text-white border-gray-600/30"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-lg p-3 shadow-2xl"
    >
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((key, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
          >
            <Button
              onClick={() => onKeyPress(key)}
              className={`w-full h-10 text-base font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border backdrop-blur-sm ${getKeyStyle(key)}`}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              {getKeyContent(key)}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Clear All Button - 20% Smaller */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-2"
      >
        <Button
          onClick={() => onKeyPress('clear')}
          className="w-full h-8 bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-700/80 hover:to-red-700/80 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-orange-500/30 backdrop-blur-sm text-sm"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Clear All
        </Button>
      </motion.div>

      {/* Keyboard Info - 20% Smaller */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-2 text-center"
      >
        <p className="text-xs text-gray-400">
          Use the numeric keyboard to enter payment amount
        </p>
      </motion.div>
    </motion.div>
  )
}