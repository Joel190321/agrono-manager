export interface MiembroDirectiva {
  id: string
  nombre: string
  apellido: string
  cedula: string
  telefono: string
  email?: string
  foto?: string
  cargo: string
  fechaInicio: string
  fechaFin?: string
  activo: boolean
  biografia?: string
}

