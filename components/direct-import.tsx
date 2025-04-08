"use client"

import type React from "react"

import { useState } from "react"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, CheckCircle } from "lucide-react"

export default function DirectImport() {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [cedula, setCedula] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [sectorBarrio, setSectorBarrio] = useState("")
  const [cantidadTareas, setCantidadTareas] = useState("")
  const [criaAnimales, setCriaAnimales] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  // Función para verificar si el asociado ya existe
  const checkIfAsociadoExists = async () => {
    // Si no hay cédula, no podemos verificar duplicados por ese campo
    if (!cedula) return false

    const asociadosRef = collection(db, "asociados")

    // Buscar por cédula, que debería ser un identificador único
    const q = query(asociadosRef, where("cedula", "==", cedula))
    const querySnapshot = await getDocs(q)

    return !querySnapshot.empty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre || !apellido) {
      toast({
        title: "Error",
        description: "Nombre y apellido son campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setSuccess(false)

    try {
      // Verificar si el asociado ya existe (si tiene cédula)
      if (cedula) {
        const exists = await checkIfAsociadoExists()
        if (exists) {
          toast({
            title: "Duplicado",
            description: "Ya existe un asociado con esta cédula",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      // Crear objeto con los datos
      const asociado = {
        nombre,
        apellido,
        cedula,
        telefono,
        direccion,
        sectorBarrio,
        cantidadTareas,
        criaAnimales,
        createdAt: new Date(),
      }

      // Guardar en Firebase
      await addDoc(collection(db, "asociados"), asociado)

      toast({
        title: "Éxito",
        description: "Asociado agregado correctamente",
      })

      // Limpiar formulario
      setNombre("")
      setApellido("")
      setCedula("")
      setTelefono("")
      setDireccion("")
      setSectorBarrio("")
      setCantidadTareas("")
      setCriaAnimales("")

      setSuccess(true)
    } catch (error) {
      console.error("Error al guardar asociado:", error)
      toast({
        title: "Error",
        description: `No se pudo guardar el asociado: ${(error as Error).message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agregar Asociado Directamente</CardTitle>
        <CardDescription>Ingrese los datos del asociado manualmente</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula</Label>
              <Input id="cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectorBarrio">Sector o Barrio</Label>
              <Input id="sectorBarrio" value={sectorBarrio} onChange={(e) => setSectorBarrio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidadTareas">Cantidad de Tareas</Label>
              <Input
                id="cantidadTareas"
                type="number"
                value={cantidadTareas}
                onChange={(e) => setCantidadTareas(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criaAnimales">Cría de Animales</Label>
              <Input
                id="criaAnimales"
                type="number"
                value={criaAnimales}
                onChange={(e) => setCriaAnimales(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
          >
            {success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Asociado Agregado</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{loading ? "Guardando..." : "Guardar Asociado"}</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
