"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Plus, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import AsociadoForm from "@/components/asociado-form"
import AsociadosTable from "@/components/asociados-table"
import type { Asociado } from "@/types/asociado"

export default function AsociadosPage() {
  const [asociados, setAsociados] = useState<Asociado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingAsociado, setEditingAsociado] = useState<Asociado | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAsociados()
  }, [])

  const fetchAsociados = async () => {
    try {
      setLoading(true)
      const asociadosCollection = collection(db, "asociados")
      const asociadosSnapshot = await getDocs(asociadosCollection)

      if (asociadosSnapshot.empty) {
        console.log("No hay asociados en la colección")
        setAsociados([])
        return
      }

      const asociadosList = asociadosSnapshot.docs.map((doc) => {
        const data = doc.data()
        // Asegurar que todos los campos existan
        return {
          id: doc.id,
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          cedula: data.cedula || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          sectorBarrio: data.sectorBarrio || "",
          cantidadTareas: data.cantidadTareas || "",
          criaAnimales: data.criaAnimales || "",
        } as Asociado
      })

      console.log(`Se encontraron ${asociadosList.length} asociados`)

      // Ordenar por apellido y nombre
      const sortedList = asociadosList.sort((a, b) => {
        if (a.apellido !== b.apellido) {
          return a.apellido.localeCompare(b.apellido)
        }
        return a.nombre.localeCompare(b.nombre)
      })

      setAsociados(sortedList)
    } catch (error) {
      console.error("Error al obtener asociados:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los asociados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "asociados", id))
      toast({
        title: "Éxito",
        description: "Asociado eliminado correctamente",
      })
      fetchAsociados()
    } catch (error) {
      console.error("Error al eliminar asociado:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el asociado",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (asociado: Asociado) => {
    setEditingAsociado(asociado)
    setShowForm(true)
  }

  const filteredAsociados = asociados.filter((asociado) => {
    const searchTermLower = searchTerm.toLowerCase()
    return (
      asociado.nombre?.toLowerCase().includes(searchTermLower) ||
      asociado.apellido?.toLowerCase().includes(searchTermLower) ||
      asociado.cedula?.toLowerCase().includes(searchTermLower) ||
      asociado.sectorBarrio?.toLowerCase().includes(searchTermLower)
    )
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
    >
      <h1 className="text-2xl font-bold mb-6">Registro de Asociados</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar asociados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingAsociado(null)
              setShowForm(!showForm)
            }}
            className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          >
            {showForm ? (
              "Cancelar"
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Nuevo Asociado</span>
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchAsociados} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Recargar</span>
          </Button>
        </div>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8"
        >
          <AsociadoForm
            onSuccess={() => {
              setShowForm(false)
              fetchAsociados()
            }}
            asociado={editingAsociado}
          />
        </motion.div>
      )}

      <AsociadosTable asociados={filteredAsociados} loading={loading} onDelete={handleDelete} onEdit={handleEdit} />
    </motion.div>
  )
}

