"use client"

import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"

export default function ManualImport() {
  const [jsonData, setJsonData] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    total: number
    success: number
    errors: number
    errorMessages: string[]
  }>({ total: 0, success: 0, errors: 0, errorMessages: [] })
  const { toast } = useToast()

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese datos en formato JSON",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setProgress(0)
    setResults({ total: 0, success: 0, errors: 0, errorMessages: [] })

    try {
      // Parsear los datos JSON
      const records = JSON.parse(jsonData)
      const dataArray = Array.isArray(records) ? records : [records]

      setResults((prev) => ({ ...prev, total: dataArray.length }))

      let successCount = 0
      let errorCount = 0
      const errorMessages: string[] = []

      for (let i = 0; i < dataArray.length; i++) {
        try {
          // Limpiar los datos antes de guardarlos
          const cleanRecord: Record<string, string> = {}
          for (const key in dataArray[i]) {
            // Asegurarse de que los valores sean strings y estén limpios
            let value = dataArray[i][key]
            if (value) {
              // Convertir a string si no lo es
              value = String(value)
              // Limpiar caracteres no deseados
              value = value.replace(/[^\w\s.,;:áéíóúÁÉÍÓÚñÑüÜ-]/g, "")
            }
            cleanRecord[key] = value || ""
          }

          await addDoc(collection(db, "asociados"), cleanRecord)
          successCount++
        } catch (error) {
          errorCount++
          errorMessages.push(`Error en registro ${i + 1}: ${(error as Error).message}`)
        }

        // Actualizar progreso
        const newProgress = Math.round(((i + 1) / dataArray.length) * 100)
        setProgress(newProgress)
        setResults({
          total: dataArray.length,
          success: successCount,
          errors: errorCount,
          errorMessages,
        })
      }

      if (successCount > 0) {
        toast({
          title: "Importación completada",
          description: `Se importaron ${successCount} de ${dataArray.length} registros.`,
          variant: successCount === dataArray.length ? "default" : "destructive",
        })
      } else {
        toast({
          title: "Error en la importación",
          description: "No se pudo importar ningún registro. Revise el formato de los datos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al procesar los datos JSON:", error)
      toast({
        title: "Error",
        description: "Error al procesar los datos JSON. Verifique el formato.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importación Manual</CardTitle>
        <CardDescription>Importe datos de asociados en formato JSON</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="json-data">Datos JSON</Label>
          <Textarea
            id="json-data"
            placeholder='[{"nombre": "Juan", "apellido": "Pérez", "cedula": "001-1234567-8", "telefono": "809-123-4567", "direccion": "Calle Principal", "sectorBarrio": "Los Indios", "cantidadTareas": "10", "criaAnimales": "5"}]'
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ingrese los datos en formato JSON. Puede ser un objeto individual o un array de objetos.
          </p>
        </div>

        <Button
          onClick={handleImport}
          disabled={!jsonData.trim() || loading}
          className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          <span>{loading ? "Importando..." : "Importar Datos"}</span>
        </Button>

        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {results.total > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Total de registros: {results.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Registros importados: {results.success}</span>
            </div>
            {results.errors > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span>Errores: {results.errors}</span>
                </div>
                <div className="max-h-40 overflow-y-auto text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  {results.errorMessages.map((msg, i) => (
                    <p key={i} className="text-red-500">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

