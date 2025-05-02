"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { motion } from "framer-motion"
import {
  Users,
  User,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Award,
  UserCheck,
  BookOpen,
  ClipboardList,
  DollarSign,
  MessageSquare,
  Leaf,
  Globe,
  Shield,
  Heart,
  UserCog,
  Laptop
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
  submenu?: NavItem[]
  requiredRole?: string[]
}

export default function SidebarNavigation() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    directiva: true, // Abierto por defecto
    admin: false,
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserRole = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          setUserRole(null)
          setLoading(false)
          return
        }

        try {
          const usuariosRef = collection(db, "usuarios")
          const q = query(usuariosRef, where("email", "==", user.email))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data()
            setUserRole(userData.rol || null)
          } else {
            setUserRole(null)
          }
        } catch (error) {
          console.error("Error al obtener rol de usuario:", error)
          setUserRole(null)
        } finally {
          setLoading(false)
        }
      })

      return () => unsubscribe()
    }

    getUserRole()
  }, [])

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Asociados",
      href: "/asociados",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Directiva",
      href: "#",
      icon: <Award className="h-5 w-5" />,
      submenu: [
        {
          title: "Presidente",
          href: "/directiva/presidente",
          icon: <User className="h-4 w-4" />,
        },
        {
          title: "Vice Presidente",
          href: "/directiva/vicepresidente",
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          title: "Secretario de Organizacion",
          href: "/directiva/secretario-organizacion",
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          title: "Secretario de Deporte",
          href: "/directiva/secretario-deporte",
          icon: <UserCheck className="h-4 w-4" />
        }
        {
          title: "Secretario General",
          href: "/directiva/secretario-general",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          title: "Secretario de Acta",
          href: "/directiva/secretario-acta",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          title: "Secretario de Finanzas",
          href: "/directiva/secretario-finanzas",
          icon: <DollarSign className="h-4 w-4" />,
        },
        {
          title: "Primer Vocal",
          href: "/directiva/primer-vocal",
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          title: "Segundo Vocal",
          href: "/directiva/segundo-vocal",
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          title: "Prensa y Propaganda",
          href: "/directiva/prensa-propaganda",
          icon: <Globe className="h-4 w-4" />,
        },
        {
          title: "Medioambiente",
          href: "/directiva/medioambiente",
          icon: <Leaf className="h-4 w-4" />,
        },
        {
          title: "Relaciones Públicas",
          href: "/directiva/relaciones-publicas",
          icon: <Globe className="h-4 w-4" />,
        },
        {
          title: "Informatica",
          href: "/directiva/informatica",
          icon: <Laptop className="h-4 w-4" />,
        },
        {
          title: "Disciplina",
          href: "/directiva/disciplina",
          icon: <Shield className="h-4 w-4" />,
        },
        {
          title: "Secretario de Salud",
          href: "/directiva/secretario-salud",
          icon: <Heart className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Administración",
      href: "#",
      icon: <Settings className="h-5 w-5" />,
      requiredRole: ["admin"],
      submenu: [
        {
          title: "Gestión de Usuarios",
          href: "/admin",
          icon: <User className="h-4 w-4" />,
        },
        {
          title: "Gestión de Directiva",
          href: "/admin/directiva",
          icon: <UserCog className="h-4 w-4" />,
        },
        {
          title: "Importar Datos",
          href: "/admin/importar",
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },
  ]

  const renderNavItem = (item: NavItem, index: number) => {
    // Verificar si el usuario tiene el rol requerido para ver este ítem
    if (item.requiredRole && (!userRole || !item.requiredRole.includes(userRole))) {
      return null
    }

    const isActive = pathname === item.href
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isSubmenuOpen = openMenus[item.title.toLowerCase()]

    return (
      <div key={index} className="mb-1">
        <Link
          href={hasSubmenu ? "#" : item.href}
          onClick={hasSubmenu ? () => toggleMenu(item.title.toLowerCase()) : undefined}
          className={cn(
            "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
            isActive
              ? "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
            hasSubmenu && "justify-between",
          )}
        >
          <span className="flex items-center">
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.title}
          </span>
          {hasSubmenu && (
            <span>{isSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
          )}
        </Link>

        {hasSubmenu && isSubmenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 pl-2 border-l border-gray-200 dark:border-gray-700 mt-1"
          >
            {item.submenu?.map((subItem, subIndex) => {
              // Verificar si el usuario tiene el rol requerido para ver este subítem
              if (subItem.requiredRole && (!userRole || !subItem.requiredRole.includes(userRole))) {
                return null
              }

              const isSubActive = pathname === subItem.href
              return (
                <Link
                  key={subIndex}
                  href={subItem.href}
                  className={cn(
                    "flex items-center py-2 px-3 rounded-md text-sm transition-colors",
                    isSubActive
                      ? "bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-100"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                  )}
                >
                  {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                  {subItem.title}
                </Link>
              )
            })}
          </motion.div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-6">
          <Award className="h-6 w-6 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Asociación Agrícola</h2>
        </div>
        <nav className="space-y-1">{navItems.map(renderNavItem)}</nav>
      </div>
    </div>
  )
}

