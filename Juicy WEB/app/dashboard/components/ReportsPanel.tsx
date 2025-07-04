"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Calendar, Mail, ExternalLink } from "lucide-react"

export default function ReportsPanel() {
  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Options */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-green-400" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { format: 'CSV', description: 'Comma-separated values for Excel', icon: '📊' },
              { format: 'XLSX', description: 'Excel spreadsheet format', icon: '📈' },
              { format: 'JSON', description: 'Raw data for developers', icon: '💻' },
              { format: 'PDF', description: 'Formatted report document', icon: '📄' }
            ].map((option, index) => (
              <motion.div
                key={option.format}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{option.format}</p>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Reports */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Monthly Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-200">Auto-email Reports</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="finance@company.com"
                  className="bg-gray-800/50 border-gray-600/50 text-white"
                />
                <Button variant="ghost" size="sm">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-200">Recent Reports</Label>
              {['January 2024', 'December 2023', 'November 2023'].map((month, index) => (
                <motion.div
                  key={month}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-white">{month}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}