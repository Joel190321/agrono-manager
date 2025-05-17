"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { motion } from "framer-motion"
import { Leaf } from "lucide-react"
import LoginForm from "@/components/login-form"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/dashboard")
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <div className="flex flex-col items-center space-y-2">
          {/* <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-full"
          >
            <Leaf className="w-8 h-8 text-white" />
          </motion.div> */}
          <img src="/logoFinal.png" alt="logo" className="w-20 h-20" />
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Federacion Frente Agrícola del Municipio de PUÑAL R.D.
          </h1>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">Regional Norte Zona Sur</p>
          <p className="text-xs text-center text-gray-500 dark:text-gray-500">Fundado (12/02/2021)</p>
        </div>
        <LoginForm />
      </motion.div>
    </div>
  )
}

