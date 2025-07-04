"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Crown, Banknote, Eye, MoreHorizontal } from "lucide-react"

// Mock team members data
const mockTeamMembers = [
  { id: "1", name: "John Doe", email: "john@company.com", role: "admin", avatar: "👨‍💼", status: "active" },
  { id: "2", name: "Sarah Smith", email: "sarah@company.com", role: "finance", avatar: "👩‍💼", status: "active" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com", role: "viewer", avatar: "👨‍💻", status: "pending" }
]

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return <Crown className="w-4 h-4 text-yellow-400" />
    case 'finance': return <Banknote className="w-4 h-4 text-green-400" />
    case 'viewer': return <Eye className="w-4 h-4 text-blue-400" />
    default: return <Users className="w-4 h-4 text-gray-400" />
  }
}

export default function TeamPanel() {
  return (
    <motion.div
      key="team"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Team & Roles Management
            </CardTitle>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTeamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className="text-sm font-semibold text-white capitalize">{member.role}</span>
                  </div>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}