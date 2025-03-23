"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserManagement from "@/components/admin/user-management"

export default function AdminPage() {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
        >
          <Tabs defaultValue="usuarios">
            <TabsList className="mb-6">
              <TabsTrigger value="usuarios">Gestión de Usuarios</TabsTrigger>
              <TabsTrigger value="configuracion">Configuración</TabsTrigger>
            </TabsList>
            <TabsContent value="usuarios">
              <UserManagement />
            </TabsContent>
            <TabsContent value="configuracion">
              <div className="p-4 text-center text-gray-500">Configuración del sistema (en desarrollo)</div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}

