"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Leaf, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImportData from "@/scripts/import-data"
import ManualImport from "@/scripts/manual-import"
import SimpleImport from "@/components/simple-import"
import DirectImport from "@/components/direct-import"

export default function ImportPage() {
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
      

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Tabs defaultValue="direct">
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="direct" className="flex-1">
                Entrada Directa
              </TabsTrigger>
              <TabsTrigger value="simple" className="flex-1">
                Importación Simple
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex-1">
                Importación CSV
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Importación JSON
              </TabsTrigger>
            </TabsList>
            <TabsContent value="direct">
              <DirectImport />
            </TabsContent>
            <TabsContent value="simple">
              <SimpleImport />
            </TabsContent>
            <TabsContent value="csv">
              <ImportData />
            </TabsContent>
            <TabsContent value="manual">
              <ManualImport />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}

