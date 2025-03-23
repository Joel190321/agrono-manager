"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Lock, Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Paso 1: Autenticar con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Paso 2: Verificar si el usuario existe en la colección "usuarios"
      const usuariosRef = collection(db, "usuarios")
      const q = query(usuariosRef, where("email", "==", user.email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // El usuario no está en la colección "usuarios"
        await auth.signOut() // Cerrar sesión de Firebase Auth
        setError("Usuario no autorizado. Contacte al administrador.")
        setLoading(false)
        return
      }

      // Usuario autenticado y autorizado
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema de gestión",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      setError("Credenciales inválidas. Por favor, intente de nuevo.")
      toast({
        title: "Error al iniciar sesión",
        description: "Credenciales inválidas. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      onSubmit={handleLogin}
      className="space-y-6"
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>
    </motion.form>
  )
}

