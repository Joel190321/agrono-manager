"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { UserPlus, Trash, Edit, Search, Save, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
}

export default function UserManagement() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "editor", // Por defecto
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const usuariosCollection = collection(db, "usuarios")
      const usuariosSnapshot = await getDocs(usuariosCollection)
      const usuariosList = usuariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Usuario[]
      setUsuarios(usuariosList)
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario)
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "", // No mostramos la contraseña actual
      rol: usuario.rol,
    })
    setShowDialog(true)
  }

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deleteDoc(doc(db, "usuarios", deleteId))
        toast({
          title: "Éxito",
          description: "Usuario eliminado correctamente",
        })
        fetchUsuarios()
      } catch (error) {
        console.error("Error al eliminar usuario:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario",
          variant: "destructive",
        })
      }
      setShowDeleteDialog(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingUser) {
        // Actualizar usuario existente
        const userRef = doc(db, "usuarios", editingUser.id)
        const updateData = {
          nombre: formData.nombre,
          rol: formData.rol,
        }
        await updateDoc(userRef, updateData)
        toast({
          title: "Éxito",
          description: "Usuario actualizado correctamente",
        })
      } else {
        // Crear nuevo usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)

        // Guardar información adicional en Firestore
        await addDoc(collection(db, "usuarios"), {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          uid: userCredential.user.uid,
        })

        toast({
          title: "Éxito",
          description: "Usuario creado correctamente",
        })
      }

      setShowDialog(false)
      fetchUsuarios()

      // Resetear formulario
      setFormData({
        nombre: "",
        email: "",
        password: "",
        rol: "editor",
      })
      setEditingUser(null)
    } catch (error) {
      console.error("Error al guardar usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter((usuario) => {
    const searchTermLower = searchTerm.toLowerCase()
    return (
      usuario.nombre?.toLowerCase().includes(searchTermLower) ||
      usuario.email?.toLowerCase().includes(searchTermLower) ||
      usuario.rol?.toLowerCase().includes(searchTermLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/admin/importar")}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Importar Datos</span>
          </Button>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Nuevo Usuario</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Actualiza la información del usuario"
                    : "Completa el formulario para crear un nuevo usuario"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!!editingUser} // Deshabilitar si estamos editando
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!editingUser}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="rol">Rol</Label>
                  <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rol: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="admin">Administrador</option>
                    <option value="editor">Editor</option>
                    <option value="lector">Lector</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? "Guardando..." : "Guardar"}</span>
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo Electrónico</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsuarios.length > 0 ? (
              filteredUsuarios.map((usuario, index) => (
                <motion.tr
                  key={usuario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="border-b dark:border-gray-700"
                >
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        usuario.rol === "admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : usuario.rol === "editor"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {usuario.rol === "admin" ? "Administrador" : usuario.rol === "editor" ? "Editor" : "Lector"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(usuario)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmDelete(usuario.id)}
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
                <TableCell colSpan={4} className="text-center py-8">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario de la base de datos.
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
    </div>
  )
}

