"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
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

        try {
          // Verificar si el usuario es administrador
          const usuariosRef = collection(db, "usuarios")
          const q = query(usuariosRef, where("email", "==", user.email), where("rol", "==", "admin"))
          const querySnapshot = await getDocs(q)

          if (querySnapshot.empty) {
            // No es administrador, redirigir al dashboard
            console.log("Usuario no tiene permisos de administrador")
            router.push("/dashboard")
            return
          }

          // Es administrador, permitir acceso
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

  return <>{children}</>
}

