import type React from "react"
import AdminRoute from "@/components/admin-route"
import MainLayout from "@/components/layout/main-layout"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      <AdminRoute>{children}</AdminRoute>
    </MainLayout>
  )
}

