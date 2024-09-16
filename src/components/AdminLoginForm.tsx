"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Alert, AlertDescription } from "@/components/ui/alert"

const MAX_PASSWORD_LENGTH = 40

export default function AdminLoginForm() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const checkAdminSession = async () => {
      const adminSession = sessionStorage.getItem('admin_session');
      if (adminSession === 'true') {
        const redirectUrl = searchParams?.get('redirect') || '/upscaler';
        router.push(redirectUrl);
      }
    };

    checkAdminSession();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!password.trim()) {
      setError("Please enter a password")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        sessionStorage.setItem('admin_session', 'true');
        const redirectUrl = searchParams?.get('redirect') || '/upscaler'
        router.push(redirectUrl)
        toast({
          title: "Login Successful",
          description: "Welcome back, admin!",
          variant: "default",
        })
      } else {
        setError(data.message || "Incorrect admin password")
        toast({
          title: "Login Failed",
          description: data.message || "Incorrect admin password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      setError("An error occurred during login")
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value.slice(0, MAX_PASSWORD_LENGTH)
    setPassword(newPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md p-8 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h2>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter admin password"
          className="w-full bg-gray-700 text-white border border-purple-500 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          required
          maxLength={MAX_PASSWORD_LENGTH}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
        >
          {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
        disabled={isLoading}
      >
        {isLoading ? (
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="mr-2">Logging in</span>
            <motion.div
              className="h-2 w-2 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </motion.div>
        ) : (
          'Login'
        )}
      </Button>
    </form>
  )
}