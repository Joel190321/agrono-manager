"use client"

import type React from "react"

import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload } from "lucide-react"

export default function SimpleImport() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      addLog(`Archivo seleccionado: ${e.target.files[0].name} (${formatBytes(e.target.files[0].size)})`)
    }
  }

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Reemplazar la función importData con esta versión más tolerante

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
    setLog([])
    addLog("Iniciando importación...")

    try {
      // Leer el archivo
      addLog("Leyendo archivo...")
      const text = await file.text()
      addLog(`Archivo leído correctamente (${text.length} caracteres)`)

      // Mostrar una muestra del contenido para diagnóstico
      addLog(`Muestra del contenido: "${text.substring(0, 100)}..."`)

      // Procesar líneas - más tolerante con diferentes formatos de línea
      const lines = text.split(/[\r\n]+/).filter((line) => line.trim())
      addLog(`Se encontraron ${lines.length} líneas en el archivo`)

      if (lines.length < 1) {
        throw new Error("El archivo está vacío o no contiene líneas válidas")
      }

      // Detectar delimitador - más opciones
      let delimiter = ","
      if (lines[0].includes(";")) delimiter = ";"
      else if (lines[0].includes("\t")) delimiter = "\t"
      addLog(`Usando delimitador: "${delimiter}"`)

      // Procesar encabezados - más tolerante
      let headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase())
      addLog(`Encabezados detectados (${headers.length}): ${headers.join(", ")}`)

      // Si no hay encabezados válidos, crear unos predeterminados
      if (headers.length < 2 || headers.every((h) => !h)) {
        headers = [
          "nombre",
          "apellido",
          "cedula",
          "telefono",
          "direccion",
          "sectorBarrio",
          "cantidadTareas",
          "criaAnimales",
        ]
        addLog(`Usando encabezados predeterminados: ${headers.join(", ")}`)
      }

      // Procesar registros - más tolerante
      const records = []
      let startIndex = 1

      // Si solo hay una línea, asumimos que son datos sin encabezados
      if (lines.length === 1) {
        startIndex = 0
        addLog("Solo hay una línea, tratándola como datos sin encabezados")
      }

      for (let i = startIndex; i < lines.length; i++) {
        if (!lines[i].trim()) continue

        const values = lines[i].split(delimiter).map((v) => v.trim())
        addLog(`Línea ${i + 1}: ${values.length} valores encontrados`)

        // Crear un registro incluso si hay pocos valores
        const record: Record<string, string> = {}

        // Asignar valores a campos
        for (let j = 0; j < Math.min(headers.length, values.length); j++) {
          let fieldName = headers[j]

          // Mapeo básico pero opcional
          if (fieldName.includes("nombre")) fieldName = "nombre"
          else if (fieldName.includes("apellido")) fieldName = "apellido"
          else if (fieldName.includes("cedula")) fieldName = "cedula"
          else if (fieldName.includes("telefono")) fieldName = "telefono"
          else if (fieldName.includes("direccion")) fieldName = "direccion"
          else if (fieldName.includes("sector") || fieldName.includes("barrio")) fieldName = "sectorBarrio"
          else if (fieldName.includes("tarea")) fieldName = "cantidadTareas"
          else if (fieldName.includes("animal")) fieldName = "criaAnimales"

          record[fieldName] = values[j] || ""
        }

        // Aceptar cualquier registro que tenga al menos un valor
        if (Object.values(record).some((v) => v.trim())) {
          records.push(record)
          addLog(`Registro ${records.length} creado con ${Object.keys(record).length} campos`)
        }
      }

      if (records.length === 0) {
        // Si no se encontraron registros, intentar un enfoque más agresivo
        addLog("No se encontraron registros válidos. Intentando un enfoque alternativo...")

        // Tratar cada línea como un registro independiente
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          // Dividir la línea en palabras
          const words = line.split(/\s+/)

          if (words.length >= 2) {
            const record: Record<string, string> = {
              nombre: words[0] || "",
              apellido: words[1] || "",
            }

            // Añadir otros campos si hay más palabras
            if (words.length > 2) record.cedula = words[2] || ""
            if (words.length > 3) record.telefono = words[3] || ""
            if (words.length > 4) record.direccion = words.slice(4).join(" ") || ""

            records.push(record)
            addLog(`Registro alternativo ${records.length} creado: ${JSON.stringify(record)}`)
          }
        }
      }

      addLog(`Se procesaron ${records.length} registros válidos`)

      if (records.length === 0) {
        throw new Error("No se pudieron extraer registros del archivo. Verifique el formato.")
      }

      // Mostrar una muestra de los datos
      if (records.length > 0) {
        addLog(`Ejemplo de registro: ${JSON.stringify(records[0])}`)
      }

      // Importar a Firebase
      let successCount = 0
      for (let i = 0; i < records.length; i++) {
        try {
          await addDoc(collection(db, "asociados"), records[i])
          successCount++

          // Actualizar progreso
          const newProgress = Math.round(((i + 1) / records.length) * 100)
          setProgress(newProgress)

          if ((i + 1) % 5 === 0 || i === records.length - 1) {
            addLog(`Progreso: ${successCount}/${records.length} registros importados (${newProgress}%)`)
          }
        } catch (error) {
          addLog(`Error al importar registro ${i + 1}: ${(error as Error).message}`)
        }
      }

      addLog(`Importación finalizada. ${successCount} de ${records.length} registros importados correctamente.`)

      toast({
        title: "Importación completada",
        description: `Se importaron ${successCount} de ${records.length} registros.`,
      })
    } catch (error) {
      const errorMsg = `Error: ${(error as Error).message}`
      addLog(errorMsg)
      toast({
        title: "Error en la importación",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importación Simple</CardTitle>
        <CardDescription>Versión simplificada para importar datos CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="csv-file">Archivo CSV</Label>
          <Input id="csv-file" type="file" accept=".csv,.txt" onChange={handleFileChange} disabled={loading} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Seleccione un archivo CSV con encabezados en la primera fila
          </p>
        </div>

        <Button
          onClick={importData}
          disabled={!file || loading}
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

        {log.length > 0 && (
          <div className="mt-4">
            <Label>Registro de actividad:</Label>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md border overflow-auto max-h-60 font-mono text-xs">
              {log.map((entry, i) => (
                <div key={i} className="pb-1">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

