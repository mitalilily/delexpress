import { useEffect, useState } from 'react'
import type { UseFormClearErrors, UseFormSetError, UseFormSetValue } from 'react-hook-form'
import { lookupPincodeLocation } from '../../api/locations'

export function usePincodeLookup(
  pincode: string,
  type: 'pickup' | 'delivery',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: UseFormSetError<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearErrors: UseFormClearErrors<any>,
) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const normalizedPincode = String(pincode || '')
      .replace(/\D/g, '')
      .slice(0, 6)
    const pincodeField = `${type}Pincode`
    const cityField = `${type}City`
    const stateField = `${type}State`

    const controller = new AbortController()

    async function fetchLocation() {
      if (!normalizedPincode || normalizedPincode.length !== 6) {
        clearErrors(pincodeField)
        setValue(cityField, '')
        setValue(stateField, '')
        return
      }

      setLoading(true)
      try {
        const loc = await lookupPincodeLocation(normalizedPincode, controller.signal)
        if (controller.signal.aborted) return

        const city = loc?.city || ''
        const state = loc?.state || ''

        if (!city || !state) {
          setError(pincodeField, {
            type: 'manual',
            message: `Invalid ${type} pincode`,
          })
          setValue(cityField, '')
          setValue(stateField, '')
          return
        }

        clearErrors(pincodeField)
        setValue(cityField, city, { shouldValidate: true })
        setValue(stateField, state, { shouldValidate: true })
      } catch (error: any) {
        if (
          error?.name === 'CanceledError' ||
          error?.name === 'AbortError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          return
        }
        setError(pincodeField, {
          type: 'manual',
          message:
            error?.response?.data?.message || error?.message || `Failed to fetch ${type} location`,
        })
        setValue(cityField, '')
        setValue(stateField, '')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchLocation()
    return () => controller.abort()
  }, [clearErrors, pincode, setError, setValue, type])

  return loading
}
