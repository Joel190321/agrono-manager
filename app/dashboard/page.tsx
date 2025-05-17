"use client"

import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Users, Award, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Dashboard() {
  const [asociadosCount, setAsociadosCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Contar asociados
        const asociadosCollection = collection(db, "asociados")
        const asociadosSnapshot = await getDocs(asociadosCollection)
        setAsociadosCount(asociadosSnapshot.size)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de Control</h1>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/asociados">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5 text-blue-500" />
                    Asociados
                  </CardTitle>
                  <CardDescription>Miembros registrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{asociadosCount}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/directiva/presidente">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Award className="mr-2 h-5 w-5 text-purple-500" />
                    Directiva
                  </CardTitle>
                  <CardDescription>Estructura organizativa</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">12</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/documentos">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="mr-2 h-5 w-5 text-green-500" />
                    Documentos
                  </CardTitle>
                  <CardDescription>Archivos y registros</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">0</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bienvenido al Sistema de Gestión</CardTitle>
              <CardDescription>Federacion Frente Agrícola del Municipio de PUÑAL R.D.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Utilice el menú lateral para navegar entre las diferentes secciones del sistema. Puede gestionar los
                asociados, ver la estructura de la directiva y administrar documentos.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

