"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Leaf, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import DebugTool from "@/components/debug-tool"

export default function DebugPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          router.push("/")
          return
        }

        // Verificar si el usuario es administrador
        try {
          const usuariosRef = collection(db, "usuarios")
          const q = query(usuariosRef, where("email", "==", user.email), where("rol", "==", "admin"))
          const querySnapshot = await getDocs(q)

          if (querySnapshot.empty) {
            // No es administrador, redirigir al dashboard
            router.push("/dashboard")
            return
          }

          setIsAdmin(true)
        } catch (error) {
          console.error("Error al verificar rol de administrador:", error)
          router.push("/dashboard")
        } finally {
          setLoading(false)
        }
      })

      return () => unsubscribe()
    }

    checkAdminAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // No renderizar nada mientras redirige
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <Leaf className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Herramientas de Diagnóstico</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Asociación Frente Agrícola del Municipio de PUÑAL R.D.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" onClick={() => router.push("/admin")} className="mb-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Panel de Administración</span>
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <DebugTool />
        </motion.div>
      </main>
    </div>
  )
}

