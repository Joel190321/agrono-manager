"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { User, Phone, Mail, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { MiembroDirectiva } from "@/types/directiva"

const cargosMap: Record<string, string> = {
  presidente: "Presidente",
  vicepresidente: "Vice Presidente",
  "secretario-general": "Secretario General",
  "secretario-acta": "Secretario de Acta",
  "secretario-finanzas": "Secretario de Finanzas",
  "secretario-organizacion": "Secretario de Organizacion",
  "primer-vocal": "Primer Vocal",
  "informatica": "Informatica",
  "prensa-propaganda": "Secretario de Prensa y Propaganda",
  "secretario-deporte": "Secretario de Deporte",
  medioambiente: "Secretario de Medioambiente",
  "relaciones-publicas": "Secretario de Relaciones Públicas",
  disciplina: "Secretario de Disciplina",
  "secretario-salud": "Secretario de Salud",
}

export default function DirectivaCargoPage() {
  const params = useParams()
  const cargo = params.cargo as string
  const [miembro, setMiembro] = useState<MiembroDirectiva | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const cargoTitulo = cargosMap[cargo] || "Miembro de Directiva"

  useEffect(() => {
    const fetchMiembro = async () => {
      try {
        setLoading(true)
        setError("")

        // Buscar en la colección "directiva" por cargo
        const directivaRef = collection(db, "directiva")
        const q = query(directivaRef, where("cargo", "==", cargoTitulo), where("activo", "==", true))
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          setMiembro(null)
          setError(`No se encontró información del ${cargoTitulo}`)
          return
        }

        // Tomar el primer documento (debería ser único)
        const doc = querySnapshot.docs[0]
        setMiembro({
          id: doc.id,
          ...doc.data(),
        } as MiembroDirectiva)
      } catch (error) {
        console.error(`Error al obtener información del ${cargoTitulo}:`, error)
        setError(`Error al cargar la información del ${cargoTitulo}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMiembro()
  }, [cargo, cargoTitulo])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold">{cargoTitulo}</h1>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No hay información registrada para este cargo en la directiva actual.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : miembro ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              {miembro.nombre} {miembro.apellido}
            </CardTitle>
            <CardDescription>{cargoTitulo}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={miembro.foto} alt={`${miembro.nombre} ${miembro.apellido}`} />
                  <AvatarFallback className="text-3xl">
                    {miembro.nombre.charAt(0)}
                    {miembro.apellido.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Cédula:</span>
                    <span>{miembro.cedula}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Teléfono:</span>
                    <span>{miembro.telefono}</span>
                  </div>

                  {miembro.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Email:</span>
                      <span>{miembro.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Fecha de inicio:</span>
                    <span>{miembro.fechaInicio}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-2">Información del cargo</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Miembro activo de la directiva desde {miembro.fechaInicio}.
                    {miembro.fechaFin && ` Hasta ${miembro.fechaFin}.`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </motion.div>
  )
}

