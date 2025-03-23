"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Edit, Trash, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Asociado } from "@/types/asociado"
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

interface AsociadosTableProps {
  asociados: Asociado[]
  loading: boolean
  onDelete: (id: string) => void
  onEdit: (asociado: Asociado) => void
}

export default function AsociadosTable({ asociados, loading, onDelete, onEdit }: AsociadosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Pagination
  const totalPages = Math.ceil(asociados.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = asociados.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Sector o Barrio</TableHead>
              <TableHead className="text-right">Cantidad de Tareas</TableHead>
              <TableHead className="text-right">Cría de Animales</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {currentItems.length > 0 ? (
                currentItems.map((asociado, index) => (
                  <motion.tr
                    key={asociado.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border-b dark:border-gray-700"
                  >
                    <TableCell>{asociado.nombre}</TableCell>
                    <TableCell>{asociado.apellido}</TableCell>
                    <TableCell>{asociado.cedula}</TableCell>
                    <TableCell>{asociado.telefono}</TableCell>
                    <TableCell>{asociado.direccion}</TableCell>
                    <TableCell>{asociado.sectorBarrio}</TableCell>
                    <TableCell className="text-right">{asociado.cantidadTareas}</TableCell>
                    <TableCell className="text-right">{asociado.criaAnimales || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon" onClick={() => onEdit(asociado)} className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => confirmDelete(asociado.id)}
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
                  <TableCell colSpan={9} className="text-center py-8">
                    No se encontraron asociados
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, asociados.length)} de {asociados.length}{" "}
            asociados
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => Math.abs(page - currentPage) < 3 || page === 1 || page === totalPages)
              .map((page, index, array) => {
                // Add ellipsis
                if (index > 0 && array[index - 1] !== page - 1) {
                  return (
                    <span key={`ellipsis-${page}`} className="px-2 flex items-center">
                      ...
                    </span>
                  )
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                    className="h-8 w-8"
                  >
                    {page}
                  </Button>
                )
              })}
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al asociado de la base de datos.
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
    </>
  )
}

