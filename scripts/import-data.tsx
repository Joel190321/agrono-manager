"use client"

import type React from "react"

import { useState } from "react"
import { collection, addDoc, deleteDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { Upload, FileText, CheckCircle, AlertCircle, Trash, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    total: number
    success: number
    errors: number
    errorMessages: string[]
  }>({ total: 0, success: 0, errors: 0, errorMessages: [] })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Generar una vista previa de los datos
      try {
        const text = await selectedFile.text()
        const records = processCSV(text)
        setPreviewData(records.slice(0, 3)) // Mostrar solo los primeros 3 registros
      } catch (error) {
        console.error("Error al generar vista previa:", error)
      }
    }
  }

  // Reemplazar la función processCSV con esta versión simplificada
  const processCSV = (text: string) => {
    console.log("Iniciando procesamiento de CSV...")

    // Detectar el delimitador (coma o punto y coma)
    const delimiter = text.includes(";") ? ";" : ","
    console.log(`Delimitador detectado: "${delimiter}"`)

    // Dividir por líneas y limpiar
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    console.log(`Se encontraron ${lines.length} líneas en el archivo`)

    if (lines.length === 0) {
      throw new Error("El archivo está vacío o no contiene líneas válidas")
    }

    // Extraer encabezados
    const headers = lines[0].split(delimiter).map((header) =>
      header
        .trim()
        .replace(/^["'](.*)["']$/, "$1") // Eliminar comillas
        .toLowerCase(),
    )

    console.log(`Encabezados detectados (${headers.length}):`, headers)

    if (headers.length === 0) {
      throw new Error("No se pudieron detectar encabezados en el archivo")
    }

    // Crear array de registros
    const records = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue // Saltar líneas vacías

      // Dividir la línea en valores
      const values = lines[i].split(delimiter).map(
        (value) => value.trim().replace(/^["'](.*)["']$/, "$1"), // Eliminar comillas
      )

      // Si la línea no tiene suficientes valores, saltarla
      if (values.length < 3) {
        console.warn(`Línea ${i + 1} ignorada: no tiene suficientes valores (${values.length})`)
        continue
      }

      // Crear objeto de registro
      const record: Record<string, string> = {}

      // Asignar valores a campos
      headers.forEach((header, index) => {
        if (index < values.length) {
          // Mapeo simplificado de campos
          let fieldName = header

          // Mapeo básico para campos comunes
          if (header.includes("nombre")) fieldName = "nombre"
          else if (header.includes("apellido")) fieldName = "apellido"
          else if (header.includes("cedula")) fieldName = "cedula"
          else if (header.includes("telefono")) fieldName = "telefono"
          else if (header.includes("direccion")) fieldName = "direccion"
          else if (header.includes("sector") || header.includes("barrio")) fieldName = "sectorBarrio"
          else if (header.includes("tarea")) fieldName = "cantidadTareas"
          else if (header.includes("animal")) fieldName = "criaAnimales"

          record[fieldName] = values[index] || ""
        }
      })

      // Verificar que tenga al menos un campo importante
      if (record.nombre || record.apellido || record.cedula) {
        records.push(record)
      } else {
        console.warn(`Registro en línea ${i + 1} ignorado: no tiene campos importantes`)
      }
    }

    console.log(`Procesamiento completado. Se crearon ${records.length} registros válidos`)
    return records
  }

  // Reemplazar la función importData con esta versión mejorada con mejor manejo de errores
  const importData = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor seleccione un archivo CSV",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setProgress(0)
    setResults({ total: 0, success: 0, errors: 0, errorMessages: [] })

    try {
      // Paso 1: Leer el archivo
      console.log("Leyendo archivo...")
      toast({
        title: "Procesando",
        description: "Leyendo el archivo...",
      })

      let text
      try {
        text = await file.text()
        console.log("Archivo leído correctamente. Primeros 100 caracteres:", text.substring(0, 100))
      } catch (error) {
        console.error("Error al leer el archivo:", error)
        throw new Error(`Error al leer el archivo: ${(error as Error).message}`)
      }

      // Paso 2: Procesar el CSV
      console.log("Procesando CSV...")
      toast({
        title: "Procesando",
        description: "Analizando datos CSV...",
      })

      let records
      try {
        records = processCSV(text)
        console.log(`CSV procesado. Se encontraron ${records.length} registros.`)
        console.log(
          "Muestra del primer registro:",
          records.length > 0 ? JSON.stringify(records[0]) : "No hay registros",
        )
      } catch (error) {
        console.error("Error al procesar el CSV:", error)
        throw new Error(`Error al procesar el CSV: ${(error as Error).message}`)
      }

      if (records.length === 0) {
        throw new Error("No se encontraron registros válidos en el archivo CSV")
      }

      setResults((prev) => ({ ...prev, total: records.length }))

      // Paso 3: Importar registros a Firebase
      console.log("Comenzando importación a Firebase...")
      toast({
        title: "Procesando",
        description: `Importando ${records.length} registros...`,
      })

      let successCount = 0
      let errorCount = 0
      const errorMessages: string[] = []

      for (let i = 0; i < records.length; i++) {
        try {
          // Mostrar progreso cada 5 registros
          if (i % 5 === 0) {
            const newProgress = Math.round((i / records.length) * 100)
            setProgress(newProgress)
            console.log(`Progreso: ${newProgress}% (${i}/${records.length})`)
          }

          // Limpiar los datos antes de guardarlos
          const cleanRecord: Record<string, string> = {}
          for (const key in records[i]) {
            let value = records[i][key]
            if (value) {
              value = String(value).trim()
            }
            cleanRecord[key] = value || ""
          }

          // Verificar que tenga al menos un campo importante
          if (!cleanRecord.nombre && !cleanRecord.apellido && !cleanRecord.cedula) {
            throw new Error("Registro sin datos importantes (nombre, apellido o cédula)")
          }

          // Guardar en Firebase
          await addDoc(collection(db, "asociados"), cleanRecord)
          successCount++

          // Actualizar resultados cada 5 registros
          if (i % 5 === 0) {
            setResults({
              total: records.length,
              success: successCount,
              errors: errorCount,
              errorMessages,
            })
          }
        } catch (error) {
          console.error(`Error en registro ${i + 1}:`, error)
          errorCount++
          errorMessages.push(`Error en registro ${i + 1}: ${(error as Error).message}`)
        }
      }

      // Actualización final de resultados
      setProgress(100)
      setResults({
        total: records.length,
        success: successCount,
        errors: errorCount,
        errorMessages,
      })

      console.log(`Importación finalizada. Éxitos: ${successCount}, Errores: ${errorCount}`)

      if (successCount > 0) {
        toast({
          title: "Importación completada",
          description: `Se importaron ${successCount} de ${records.length} registros.`,
          variant: successCount === records.length ? "default" : "destructive",
        })
      } else {
        toast({
          title: "Error en la importación",
          description: "No se pudo importar ningún registro. Revise el formato del archivo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error general en la importación:", error)
      toast({
        title: "Error",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAllData = async () => {
    setLoading(true)
    try {
      const asociadosCollection = collection(db, "asociados")
      const asociadosSnapshot = await getDocs(asociadosCollection)

      let deletedCount = 0
      for (const doc of asociadosSnapshot.docs) {
        await deleteDoc(doc.ref)
        deletedCount++
      }

      toast({
        title: "Datos eliminados",
        description: `Se eliminaron ${deletedCount} registros de la base de datos.`,
      })

      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error al eliminar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron eliminar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Importar Datos</CardTitle>
          <CardDescription>Importe datos de asociados desde un archivo CSV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Archivo CSV</Label>
            <Input id="csv-file" type="file" accept=".csv,.txt" onChange={handleFileChange} disabled={loading} />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              El archivo debe ser un CSV con encabezados que incluyan: Nombre, Apellido, Cédula, etc.
            </p>
          </div>

          {previewData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Vista previa de datos:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="px-2 py-1 text-xs text-left text-gray-500 dark:text-gray-400">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.map((item, index) => (
                      <tr key={index}>
                        {Object.values(item).map((value: any, i) => (
                          <td key={i} className="px-2 py-1 text-xs">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={importData}
              disabled={!file || loading}
              className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>{loading ? "Importando..." : "Importar Datos"}</span>
            </Button>

            <Button
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
              variant="destructive"
              className="flex items-center justify-center gap-2"
            >
              <Trash className="h-4 w-4" />
              <span>Limpiar BD</span>
            </Button>
          </div>

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

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Instrucciones para corregir problemas de codificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Si los datos aparecen con caracteres extraños:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Abre tu archivo en Excel o un editor de texto</li>
              <li>Guárdalo como CSV (UTF-8) para preservar los caracteres especiales</li>
              <li>Antes de importar, usa el botón "Limpiar BD" para eliminar los datos corruptos</li>
              <li>Importa el nuevo archivo CSV</li>
            </ol>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Nota:</strong> Si continúas teniendo problemas, intenta abrir el archivo en un editor de texto
              como Notepad++, selecciona todo el contenido, cópialo y pégalo en un nuevo archivo. Luego guárdalo con
              codificación UTF-8.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará TODOS los datos de asociados de la base de datos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllData} className="bg-red-600 hover:bg-red-700">
              Eliminar Todos los Datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

