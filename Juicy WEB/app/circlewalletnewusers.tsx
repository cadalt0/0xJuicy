"use client"

import { useState } from "react"
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID, handleGoogleLogin } from '@/lib/googleAuth'

async function checkIfEmailExists(email: string): Promise<boolean> {
  const res = await fetch(`http://localhost:3001/api/records/${encodeURIComponent(email)}`)
  console.log("API response status for", email, ":", res.status)
  if (res.status === 200) return true
  if (res.status === 404) return false
  throw new Error('Error checking email')
}

export default function CircleWalletNewUsers() {
  const [userEmail, setUserEmail] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)
  const [error, setError] = useState("")
  const [googleResult, setGoogleResult] = useState<any>(null)

  const handleGoogleSuccess = async (credential: string) => {
    setError("")
    const result = await handleGoogleLogin(credential)
    setGoogleResult(result)
    console.log("Google login result:", result)
    if (result.success && result.user) {
      setUserEmail(result.user.email)
      try {
        const exists = await checkIfEmailExists(result.user.email)
        console.log("API check for", result.user.email, "exists?", exists)
        setIsNewUser(!exists)
        console.log("isNewUser set to:", !exists)
      } catch (e) {
        setError("Error checking user in database.")
        setIsNewUser(false)
        console.error("DB check error:", e)
      }
    } else {
      setError("Google login failed.")
      console.error("Google login failed:", result)
    }
  }

  const handleGoogleError = () => {
    setError("Google login failed.")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-4">
      <div className="bg-zinc-900 rounded-xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Circle Wallet New Users</h1>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                handleGoogleSuccess(credentialResponse.credential)
              }
            }}
            onError={handleGoogleError}
            useOneTap
            theme="filled_black"
            text="signin_with"
            shape="rectangular"
            locale="en"
          />
        </GoogleOAuthProvider>
        {userEmail && (
          <div className="mt-6 text-lg text-zinc-200">
            {userEmail}{isNewUser ? <span className="text-yellow-400">*</span> : null}
          </div>
        )}
        {error && <div className="mt-4 text-red-400">{error}</div>}
        {/* Debug Panel */}
        <div className="mt-8 w-full bg-zinc-800 rounded-lg p-4 text-xs text-zinc-300">
          <div className="mb-2 font-bold text-blue-300">Debug Info</div>
          <div><b>userEmail:</b> {userEmail || 'N/A'}</div>
          <div><b>isNewUser:</b> {String(isNewUser)}</div>
          <div><b>error:</b> {error || 'N/A'}</div>
          <div><b>googleResult:</b> <pre className="whitespace-pre-wrap">{JSON.stringify(googleResult, null, 2)}</pre></div>
        </div>
      </div>
    </div>
  )
} 