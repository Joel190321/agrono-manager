import type React from "react"
import AdminRoute from "@/components/admin-route"
import MainLayout from "@/components/layout/main-layout"
import Formulario from './page'

export default function DirectivaAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    
    <Formulario/>
  )
}

