"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-black p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6 bg-gradient-to-br from-blue-800/80 to-purple-800/80 rounded-3xl shadow-2xl p-10 border border-blue-500/20"
      >
        <motion.h1
          className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          404
        </motion.h1>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Sparkles className="w-7 h-7 text-yellow-400 animate-pulse" />
          <span className="text-2xl font-semibold text-white">Page Not Found</span>
        </motion.div>
        <motion.p
          className="text-lg text-gray-300 text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to safety.
        </motion.p>
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all text-lg border border-blue-500/30"
          >
            Go Home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )
} 