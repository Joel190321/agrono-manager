"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { Leaf, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import SidebarNavigation from "@/components/sidebar-navigation"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Modificar la función checkAuth para verificar el rol del usuario
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          router.push("/")
          return
        }

        try {
          // Verificar si el usuario existe en la colección "usuarios"
          const usuariosRef = collection(db, "usuarios")
          const q = query(usuariosRef, where("email", "==", user.email))
          const querySnapshot = await getDocs(q)

          if (querySnapshot.empty) {
            // El usuario no está en la colección "usuarios"
            await auth.signOut() // Cerrar sesión de Firebase Auth
            router.push("/")
            return
          }

          // Usuario encontrado, continuar
          setLoading(false)
        } catch (error) {
          console.error("Error al verificar usuario:", error)
          router.push("/")
        }
      })

      return () => unsubscribe()
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <img src="/logoFinal.png" alt="logo" className="w-25 h-25" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Federacion Frente Agrícola del Municipio de PUÑAL R.D.
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sistema de Gestión</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for mobile */}
        <div
          className={`fixed inset-0 z-20 transition-opacity ${
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          } md:hidden`}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 max-w-xs w-full">
            <SidebarNavigation />
          </div>
        </div>

        {/* Sidebar for desktop */}
        <div className="hidden md:block flex-shrink-0">
          <SidebarNavigation />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

