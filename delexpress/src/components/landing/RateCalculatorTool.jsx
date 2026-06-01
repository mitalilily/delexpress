import { useEffect, useRef, useState } from 'react'
import CalculatorSection from './CalculatorSection'
import PincodeServiceabilitySection from './PincodeServiceabilitySection'
import {
  calculateWeightBreakdown,
  fetchGuestRateEstimate,
  fetchPincodeLocation,
} from '../../utils/rateCalculatorApi'

const initialShippingForm = {
  packageWeight: '',
  pickupPincode: '',
  deliveryPincode: '',
  orderAmount: '',
  paymentType: 'prepaid',
  length: '10',
  breadth: '10',
  height: '10',
}

function resolveCourierRate(courier) {
  return Number(courier?.rate ?? courier?.courier_cost_estimate ?? Number.POSITIVE_INFINITY)
}

export default function RateCalculatorTool() {
  const [shippingForm, setShippingForm] = useState(initialShippingForm)
  const [rateOptions, setRateOptions] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [hasCheckedRates, setHasCheckedRates] = useState(false)
  const [pincodeLookup, setPincodeLookup] = useState({
    pickup: { isLoading: false, location: null, error: '' },
    delivery: { isLoading: false, location: null, error: '' },
  })
  const abortRef = useRef(null)
  const pincodeAbortRefs = useRef({ pickup: null, delivery: null })
  const { pickupPincode, deliveryPincode } = shippingForm

  const handleFieldChange = (key) => (event) => {
    const value = event.target.value

    setShippingForm((current) => ({
      ...current,
      [key]: value,
    }))

    if (key === 'pickupPincode' || key === 'deliveryPincode') {
      setRateOptions([])
      setErrorMessage('')
      setHasCheckedRates(false)
    }
  }

  useEffect(() => {
    const lookupConfig = [
      { pincodeValue: pickupPincode, key: 'pickup' },
      { pincodeValue: deliveryPincode, key: 'delivery' },
    ]

    const cleanups = lookupConfig.map(({ pincodeValue, key }) => {
      const pincode = String(pincodeValue || '').trim()

      if (pincodeAbortRefs.current[key]) {
        pincodeAbortRefs.current[key].abort()
        pincodeAbortRefs.current[key] = null
      }

      if (!pincode) {
        setPincodeLookup((current) => ({
          ...current,
          [key]: { isLoading: false, location: null, error: '' },
        }))
        return () => {}
      }

      if (!/^\d{6}$/.test(pincode)) {
        setPincodeLookup((current) => ({
          ...current,
          [key]: { isLoading: false, location: null, error: 'Enter a valid 6-digit pincode.' },
        }))
        return () => {}
      }

      setPincodeLookup((current) => ({
        ...current,
        [key]: { ...current[key], isLoading: true, error: '', location: null },
      }))

      const controller = new AbortController()
      pincodeAbortRefs.current[key] = controller

      const timeoutId = window.setTimeout(async () => {
        try {
          const location = await fetchPincodeLocation(pincode, controller.signal)

          setPincodeLookup((current) => ({
            ...current,
            [key]: location
              ? { isLoading: false, location, error: '' }
              : {
                  isLoading: false,
                  location: null,
                  error: 'Pincode not found in our serviceability locations.',
                },
          }))
        } catch (error) {
          if (error?.name === 'AbortError') return

          setPincodeLookup((current) => ({
            ...current,
            [key]: {
              isLoading: false,
              location: null,
              error: error?.message || 'Unable to verify this pincode right now.',
            },
          }))
        } finally {
          if (pincodeAbortRefs.current[key] === controller) {
            pincodeAbortRefs.current[key] = null
          }
        }
      }, 250)

      return () => {
        window.clearTimeout(timeoutId)
        controller.abort()
      }
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [deliveryPincode, pickupPincode])

  const handleCalculateRates = async () => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    setIsLoadingRates(true)
    setErrorMessage('')
    setHasCheckedRates(true)

    try {
      const results = await fetchGuestRateEstimate(shippingForm, controller.signal)
      const sorted = [...results].sort(
        (left, right) => resolveCourierRate(left) - resolveCourierRate(right),
      )
      setRateOptions(sorted)
    } catch (error) {
      if (error?.name === 'AbortError') return
      setRateOptions([])
      setErrorMessage(error?.message || 'Unable to fetch shipping rates right now.')
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setIsLoadingRates(false)
    }
  }

  const bestRateOption = rateOptions[0]
  const weightBreakdown = calculateWeightBreakdown(shippingForm)
  const hasValidPincodes =
    Boolean(pincodeLookup.pickup.location) && Boolean(pincodeLookup.delivery.location)
  const rateSummary = {
    bestRate: Number(bestRateOption?.rate ?? bestRateOption?.courier_cost_estimate ?? 0),
    totalOptions: rateOptions.length,
    zoneName: bestRateOption?.approxZone?.name || '',
  }

  return (
    <>
      <PincodeServiceabilitySection
        onFieldChange={handleFieldChange}
        pincodeLookup={pincodeLookup}
        shippingForm={shippingForm}
      />
      <CalculatorSection
        errorMessage={errorMessage}
        hasCheckedRates={hasCheckedRates}
        isLoading={isLoadingRates}
        onCalculate={handleCalculateRates}
        pincodeLookup={pincodeLookup}
        rateOptions={rateOptions}
        rateSummary={rateSummary}
        shippingForm={shippingForm}
        weightBreakdown={weightBreakdown}
        onFieldChange={handleFieldChange}
        hasValidPincodes={hasValidPincodes}
      />
    </>
  )
}
