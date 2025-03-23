"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Plus, Search, RefreshCw, Edit, Trash, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import DirectivaForm from "@/components/directiva-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import type { MiembroDirectiva } from "@/types/directiva"

export default function GestionDirectivaPage() {
  const [miembros, setMiembros] = useState<MiembroDirectiva[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingMiembro, setEditingMiembro] = useState<MiembroDirectiva | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchMiembros()
  }, [])

  const fetchMiembros = async () => {
    try {
      setLoading(true)
      const miembrosCollection = collection(db, "directiva")
      const miembrosSnapshot = await getDocs(miembrosCollection)

      if (miembrosSnapshot.empty) {
        console.log("No hay miembros en la directiva")
        setMiembros([])
        return
      }

      const miembrosList = miembrosSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          cedula: data.cedula || "",
          telefono: data.telefono || "",
          email: data.email || "",
          foto: data.foto || "",
          cargo: data.cargo || "",
          fechaInicio: data.fechaInicio || "",
          fechaFin: data.fechaFin || "",
          activo: data.activo !== undefined ? data.activo : true,
          biografia: data.biografia || "",
        } as MiembroDirectiva
      })

      console.log(`Se encontraron ${miembrosList.length} miembros de directiva`)

      // Ordenar por cargo
      const sortedList = miembrosList.sort((a, b) => {
        return a.cargo.localeCompare(b.cargo)
      })

      setMiembros(sortedList)
    } catch (error) {
      console.error("Error al obtener miembros de directiva:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros de la directiva",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "directiva", id))
      toast({
        title: "Éxito",
        description: "Miembro de directiva eliminado correctamente",
      })
      fetchMiembros()
    } catch (error) {
      console.error("Error al eliminar miembro de directiva:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro de directiva",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (miembro: MiembroDirectiva) => {
    setEditingMiembro(miembro)
    setShowForm(true)
  }

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteId) {
      handleDelete(deleteId)
      setShowDeleteDialog(false)
    }
  }

  const filteredMiembros = miembros.filter((miembro) => {
    const searchTermLower = searchTerm.toLowerCase()
    return (
      miembro.nombre?.toLowerCase().includes(searchTermLower) ||
      miembro.apellido?.toLowerCase().includes(searchTermLower) ||
      miembro.cargo?.toLowerCase().includes(searchTermLower) ||
      miembro.cedula?.toLowerCase().includes(searchTermLower)
    )
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Directiva</h1>
        <Button
          onClick={() => {
            setEditingMiembro(null)
            setShowForm(!showForm)
          }}
          className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
        >
          {showForm ? (
            "Cancelar"
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Nuevo Miembro</span>
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8"
        >
          <DirectivaForm
            onSuccess={() => {
              setShowForm(false)
              fetchMiembros()
            }}
            miembro={editingMiembro}
          />
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar miembros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchMiembros} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Recargar</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMiembros.length > 0 ? (
                filteredMiembros.map((miembro, index) => (
                  <motion.tr
                    key={miembro.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border-b dark:border-gray-700"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        {miembro.foto ? (
                          <img
                            src={miembro.foto || "/placeholder.svg"}
                            alt={miembro.nombre}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Award className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <span>
                          {miembro.nombre} {miembro.apellido}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{miembro.cargo}</TableCell>
                    <TableCell>{miembro.cedula}</TableCell>
                    <TableCell>{miembro.telefono}</TableCell>
                    <TableCell>{miembro.fechaInicio}</TableCell>
                    <TableCell>
                      {miembro.activo ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(miembro)} className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => confirmDelete(miembro.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No se encontraron miembros de directiva
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al miembro de la directiva de la base de
              datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

