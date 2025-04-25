"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, addDoc, doc, updateDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Asociado } from "@/types/asociado"

interface AsociadoFormProps {
  onSuccess: () => void
  asociado?: Asociado | null
}

export default function AsociadoForm({ onSuccess, asociado }: AsociadoFormProps) {
  const [formData, setFormData] = useState<Omit<Asociado, "id">>({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    direccion: "",
    sectorBarrio: "",
    cantidadTareas: "",
    criaAnimales: "",
  })

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (asociado) {
      setFormData({
        nombre: asociado.nombre || "",
        apellido: asociado.apellido || "",
        cedula: asociado.cedula || "",
        telefono: asociado.telefono || "",
        direccion: asociado.direccion || "",
        sectorBarrio: asociado.sectorBarrio || "",
        cantidadTareas: asociado.cantidadTareas || "",
        criaAnimales: asociado.criaAnimales || "",
      })
    }
  }, [asociado])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Si es un nuevo asociado (no tiene ID)
      if (!asociado?.id) {
        // Verificar si ya existe una cédula registrada
        const q = query(collection(db, "asociados"), where("cedula", "==", formData.cedula))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          toast({
            title: "Duplicado",
            description: "Ya existe un asociado con esta cédula",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        // Crear nuevo asociado
        await addDoc(collection(db, "asociados"), formData)
        toast({
          title: "Éxito",
          description: "Asociado agregado correctamente",
        })

      } else {
        // Actualizar un asociado existente
        const asociadoRef = doc(db, "asociados", asociado.id)
        await updateDoc(asociadoRef, formData)
        toast({
          title: "Éxito",
          description: "Asociado actualizado correctamente",
        })
      }

      onSuccess()
    } catch (error) {
      console.error("Error al guardar asociado:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el asociado",
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
      <h2 className="text-xl font-bold mb-6">{asociado ? "Editar Asociado" : "Nuevo Asociado"}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cedula">Cédula</Label>
          <Input id="cedula" name="cedula" value={formData.cedula} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sectorBarrio">Sector o Barrio</Label>
          <Input id="sectorBarrio" name="sectorBarrio" value={formData.sectorBarrio} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cantidadTareas">Cantidad de Tareas</Label>
          <Input
            id="cantidadTareas"
            name="cantidadTareas"
            type="number"
            value={formData.cantidadTareas}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criaAnimales">Cría de Animales</Label>
          <Input
            id="criaAnimales"
            name="criaAnimales"
            type="number"
            value={formData.criaAnimales}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          disabled={loading}
        >
          <Save className="h-4 w-4" />
          <span>{loading ? "Guardando..." : "Guardar"}</span>
        </Button>
      </div>
    </motion.form>
  )
}
