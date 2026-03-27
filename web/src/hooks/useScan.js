import { useState, useCallback } from 'react'
import { api } from '../api/client'

export function useScan() {
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)

  const scan = useCallback(async (path) => {
    setScanning(true)
    setError(null)
    try {
      const result = await api.scan(path)
      setScanResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }, [])

  return { scanResult, scanning, error, scan }
}
