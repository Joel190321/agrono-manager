"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { MiembroDirectiva } from "@/types/directiva"

interface DirectivaFormProps {
  onSuccess: () => void
  miembro?: MiembroDirectiva | null
}

// Lista de cargos disponibles en la directiva
const cargosDirectiva = [
  { id: "presidente", nombre: "Presidente" },
  { id: "vicepresidente", nombre: "Vice Presidente" },
  { id: "secretario-general", nombre: "Secretario General" },
  { id: "secretario-acta", nombre: "Secretario de Acta" },
  { id: "secretario-finanzas", nombre: "Secretario de Finanzas" },
  { id: "primer-vocal", nombre: "Primer Vocal" },
  { id: "segundo-vocal", nombre: "Segundo Vocal" },
  { id: "prensa-propaganda", nombre: "Secretario de Prensa y Propaganda" },
  { id: "medioambiente", nombre: "Secretario de Medioambiente" },
  { id: "relaciones-publicas", nombre: "Secretario de Relaciones Públicas" },
  { id: "disciplina", nombre: "Secretario de Disciplina" },
  { id: "secretario-salud", nombre: "Secretario de Salud" },
]

export default function DirectivaForm({ onSuccess, miembro }: DirectivaFormProps) {
  const [formData, setFormData] = useState<Omit<MiembroDirectiva, "id">>({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    email: "",
    foto: "",
    cargo: "",
    fechaInicio: new Date().toISOString().split("T")[0], // Fecha actual en formato YYYY-MM-DD
    fechaFin: "",
    activo: true,
    biografia: "",
  })
  const [loading, setLoading] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string>("")
  const { toast } = useToast()

  // Cargar datos del miembro si se está editando
  useEffect(() => {
    if (miembro) {
      setFormData({
        nombre: miembro.nombre || "",
        apellido: miembro.apellido || "",
        cedula: miembro.cedula || "",
        telefono: miembro.telefono || "",
        email: miembro.email || "",
        foto: miembro.foto || "",
        cargo: miembro.cargo || "",
        fechaInicio: miembro.fechaInicio || new Date().toISOString().split("T")[0],
        fechaFin: miembro.fechaFin || "",
        activo: miembro.activo !== undefined ? miembro.activo : true,
        biografia: miembro.biografia || "",
      })

      if (miembro.foto) {
        setFotoPreview(miembro.foto)
      }
    }
  }, [miembro])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFotoFile(file)

      // Crear una URL para previsualizar la imagen
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setFotoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos requeridos
      if (!formData.nombre || !formData.apellido || !formData.cedula || !formData.cargo) {
        throw new Error("Los campos Nombre, Apellido, Cédula y Cargo son obligatorios")
      }

      // Aquí se podría implementar la subida de la foto a Firebase Storage
      // Por ahora, usaremos la URL de la foto si existe o una URL de placeholder
      let fotoUrl = formData.foto
      if (fotoFile) {
        // Simulamos una URL para la foto (en una implementación real, se subiría a Firebase Storage)
        fotoUrl = fotoPreview
      }

      const miembroData = {
        ...formData,
        foto: fotoUrl,
      }

      if (miembro?.id) {
        // Actualizar miembro existente
        const miembroRef = doc(db, "directiva", miembro.id)
        await updateDoc(miembroRef, miembroData)
        toast({
          title: "Éxito",
          description: "Miembro de directiva actualizado correctamente",
        })
      } else {
        // Verificar si ya existe un miembro activo con el mismo cargo
        const directivaRef = collection(db, "directiva")
        const cargoActual = cargosDirectiva.find((c) => c.id === formData.cargo)?.nombre || formData.cargo

        // Agregar nuevo miembro
        await addDoc(collection(db, "directiva"), {
          ...miembroData,
          cargo: cargoActual, // Guardar el nombre completo del cargo
        })
        toast({
          title: "Éxito",
          description: "Miembro de directiva agregado correctamente",
        })
      }

      onSuccess()
    } catch (error) {
      console.error("Error al guardar miembro de directiva:", error)
      toast({
        title: "Error",
        description: (error as Error).message || "No se pudo guardar el miembro de directiva",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <h2 className="text-xl font-bold mb-6">
        {miembro ? "Editar Miembro de Directiva" : "Nuevo Miembro de Directiva"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="space-y-2 md:col-span-2">
          <h3 className="font-medium text-lg">Información Personal</h3>
          <div className="h-px bg-gray-200 dark:bg-gray-700 w-full"></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cedula">Cédula *</Label>
          <Input id="cedula" name="cedula" value={formData.cedula} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="foto">Fotografía</Label>
          <div className="flex items-center gap-4">
            {fotoPreview && (
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={fotoPreview || "/placeholder.svg"}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Input id="foto" name="foto" type="file" accept="image/*" onChange={handleFotoChange} className="flex-1" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sube una fotografía del miembro de la directiva (opcional)
          </p>
        </div>

        {/* Información del Cargo */}
        <div className="space-y-2 md:col-span-2 mt-4">
          <h3 className="font-medium text-lg">Información del Cargo</h3>
          <div className="h-px bg-gray-200 dark:bg-gray-700 w-full"></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo en la Directiva *</Label>
          <Select value={formData.cargo} onValueChange={(value) => handleSelectChange("cargo", value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cargo" />
            </SelectTrigger>
            <SelectContent>
              {cargosDirectiva.map((cargo) => (
                <SelectItem key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
          <Input
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            value={formData.fechaInicio}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaFin">Fecha de Fin</Label>
          <Input id="fechaFin" name="fechaFin" type="date" value={formData.fechaFin || ""} onChange={handleChange} />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dejar en blanco si el miembro sigue activo en el cargo
          </p>
        </div>

        <div className="space-y-2 flex items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => handleCheckboxChange("activo", checked === true)}
            />
            <Label htmlFor="activo" className="cursor-pointer">
              Miembro activo en la directiva
            </Label>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="biografia">Biografía</Label>
          <Textarea
            id="biografia"
            name="biografia"
            value={formData.biografia || ""}
            onChange={handleChange}
            className="min-h-[100px]"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Breve descripción o biografía del miembro de la directiva (opcional)
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Guardar</span>
            </>
          )}
        </Button>
      </div>
    </motion.form>
  )
}

