// Este script es solo para referencia y debe ejecutarse localmente, no en la aplicación web

import fs from "fs"
import mammoth from "mammoth"
import { stringify } from "csv-stringify/sync"

// Función para convertir un documento Word a CSV
async function convertWordToCSV(wordFilePath, csvFilePath) {
  try {
    // Extraer el HTML del documento Word
    const result = await mammoth.extractRawText({ path: wordFilePath })
    const text = result.value

    // Dividir el texto en líneas
    const lines = text.split("\n").filter((line) => line.trim())

    // Buscar las líneas que contienen los encabezados de la tabla
    let headerIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("Nombre") && lines[i].includes("Apellido") && lines[i].includes("Cédula")) {
        headerIndex = i
        break
      }
    }

    if (headerIndex === -1) {
      throw new Error("No se encontraron los encabezados de la tabla")
    }

    // Extraer los encabezados
    const headers = lines[headerIndex]
      .split(/\s{2,}/)
      .map((h) => h.trim())
      .filter((h) => h)

    // Extraer los datos
    const data = []
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim()) {
        const values = line
          .split(/\s{2,}/)
          .map((v) => v.trim())
          .filter((v) => v)
        if (values.length >= headers.length - 2) {
          // Permitir algunas columnas vacías
          data.push(values)
        }
      }
    }

    // Crear el CSV
    const csvData = [headers, ...data]
    const csvContent = stringify(csvData)

    // Guardar el archivo CSV
    fs.writeFileSync(csvFilePath, csvContent)

    console.log(`Archivo CSV creado exitosamente: ${csvFilePath}`)
    return csvFilePath
  } catch (error) {
    console.error("Error al convertir Word a CSV:", error)
    throw error
  }
}

// Ejemplo de uso
const wordFilePath = "./registro_asociados.docx"
const csvFilePath = "./registro_asociados.csv"

convertWordToCSV(wordFilePath, csvFilePath)
  .then(() => console.log("Conversión completada"))
  .catch((err) => console.error("Error en la conversión:", err))

