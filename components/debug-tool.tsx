"use client"

import { useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Bug } from "lucide-react"

export default function DebugTool() {
  const [dbContent, setDbContent] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const checkDatabase = async () => {
    setLoading(true)
    try {
      const asociadosCollection = collection(db, "asociados")
      const asociadosSnapshot = await getDocs(asociadosCollection)

      if (asociadosSnapshot.empty) {
        setDbContent("No hay datos en la colección 'asociados'")
      } else {
        const asociadosList = asociadosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setDbContent(
          `Se encontraron ${asociadosList.length} documentos en la colección 'asociados':\n\n` +
            JSON.stringify(asociadosList.slice(0, 3), null, 2) +
            (asociadosList.length > 3 ? "\n\n... y " + (asociadosList.length - 3) + " más" : ""),
        )
      }
    } catch (error) {
      setDbContent(`Error al consultar la base de datos: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Herramienta de Diagnóstico
        </CardTitle>
        <CardDescription>Verifica el estado de la base de datos y la conexión</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkDatabase} disabled={loading} className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {loading ? "Verificando..." : "Verificar Base de Datos"}
        </Button>

        {dbContent && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto max-h-96">
            <pre className="text-xs whitespace-pre-wrap">{dbContent}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

