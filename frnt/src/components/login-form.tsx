"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("Please enter both email and password!")
      return
    }

    console.log("Attempting login with email:", email)

    try {
      setLoading(true)

      // User Login Attempt
      const userResponse = await fetch("http://localhost:8000/api/v1/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const userData = await userResponse.json()

      if (userResponse.ok) {
        console.log("User Login Successful:", userData)

        localStorage.setItem("authToken", userData.token)
        localStorage.setItem("userId", userData.userId)
        localStorage.setItem("userEmail", userData.email)

        toast.success("User login successful!")
        router.push("/dashboard")
        return
      }

      // Admin Login Attempt (Only if user login fails)
      const adminResponse = await fetch("http://localhost:8000/api/v1/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const adminData = await adminResponse.json()

      if (adminResponse.ok) {
        console.log("Admin Login Successful:", adminData)

        localStorage.setItem("authToken", adminData.token)
        localStorage.setItem("adminId", adminData.adminId)
        localStorage.setItem("adminEmail", adminData.email)

        toast.success("Admin login successful!")
        router.push("/admin")
        return
      }

      // If both login attempts fail
      toast.error(userData.message || adminData.message || "Invalid credentials!")

    } catch (error) {
      console.error("Login error:", error)
      toast.error("Something went wrong, please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1.5 relative">
            <Label htmlFor="password">Password</Label>
            <Input
              type={passwordVisible ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div
              className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? <AiOutlineEyeInvisible size={24} /> : <AiOutlineEye size={24} />}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </CardFooter>
      <CardFooter className="flex justify-center">
        <Link href="/register">
          <span className="text-blue-600 hover:text-blue-800">Don't have an account? Register here.</span>
        </Link>
      </CardFooter>
    </Card>
  )
}
