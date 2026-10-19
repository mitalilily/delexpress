import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useCouriers } from '../../hooks/useCouriers'
import { usePlans } from '../../hooks/usePlans'
import { b2bAdminService } from '../../services/b2bAdmin.service'
import Card from '../Card/Card'
import CardBody from '../Card/CardBody'
import CardHeader from '../Card/CardHeader'

const B2BQuoteCalculator = ({ planId }) => {
  const toast = useToast()
  const [formData, setFormData] = useState({
    originPincode: '',
    destinationPincode: '',
    weightKg: '',
    length: '',
    width: '',
    height: '',
    invoiceValue: '',
    paymentMode: 'PREPAID',
    courierId: '',
    serviceProvider: '',
  })
  const [quoteResult, setQuoteResult] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(planId || '')

  const { data: couriers = [] } = useCouriers({ businessType: 'b2b' })
  const { data: plansResponse, isLoading: plansLoading } = usePlans()
  const plans = Array.isArray(plansResponse) ? plansResponse : plansResponse?.data || []
  const providers = useMemo(() => {
    const values = couriers
      .map((courier) => courier.service_provider || courier.serviceProvider)
      .filter(Boolean)
      .map((provider) => String(provider).trim().toLowerCase())
    return [...new Set(values)].sort()
  }, [couriers])
  const availableCouriers = useMemo(() => {
    if (!formData.serviceProvider) return couriers
    return couriers.filter(
      (courier) =>
        String(courier.service_provider || courier.serviceProvider || '').toLowerCase() ===
        formData.serviceProvider,
    )
  }, [couriers, formData.serviceProvider])

  const handleCalculate = async () => {
    const originPincode = String(formData.originPincode).trim()
    const destinationPincode = String(formData.destinationPincode).trim()
    const weightKg = Number(formData.weightKg)
    if (!/^\d{6}$/.test(originPincode) || !/^\d{6}$/.test(destinationPincode)) {
      toast({
        title: 'Invalid pincodes',
        description: 'Origin and destination must each be exactly 6 digits',
        status: 'error',
        duration: 3000,
      })
      return
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      toast({ title: 'Invalid weight', description: 'Weight must be greater than 0 kg', status: 'error', duration: 3000 })
      return
    }
    const dimensions = [formData.length, formData.width, formData.height]
    if (dimensions.some(Boolean) && dimensions.some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
      toast({ title: 'Invalid dimensions', description: 'Enter all three dimensions as positive numbers, or leave all blank', status: 'error', duration: 3000 })
      return
    }
    if (!selectedPlanId) {
      toast({ title: 'Select a plan', description: 'B2B additional charges are configured per plan', status: 'error', duration: 3000 })
      return
    }

    setIsCalculating(true)
    try {
      const result = await b2bAdminService.calculateRate({
        originPincode,
        destinationPincode,
        weightKg,
        length: formData.length ? Number(formData.length) : undefined,
        width: formData.width ? Number(formData.width) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        invoiceValue: formData.invoiceValue ? Number(formData.invoiceValue) : undefined,
        paymentMode: formData.paymentMode,
        courier_id: formData.courierId || undefined,
        service_provider: formData.serviceProvider || undefined,
        plan_id: selectedPlanId,
      })
      setQuoteResult(result)
    } catch (error) {
      toast({
        title: 'Calculation failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('blue.50', 'blue.900')

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
      <Card bg={bgColor}>
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">
            Quote Calculator
          </Text>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={2} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Origin Pincode</FormLabel>
                <Input
                  value={formData.originPincode}
                  onChange={(e) => setFormData({ ...formData, originPincode: e.target.value })}
                  placeholder="110001"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Destination Pincode</FormLabel>
                <Input
                  value={formData.destinationPincode}
                  onChange={(e) => setFormData({ ...formData, destinationPincode: e.target.value })}
                  placeholder="400001"
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={2} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Weight (kg)</FormLabel>
                <NumberInput
                  value={formData.weightKg}
                  onChange={(_, value) => setFormData({ ...formData, weightKg: value })}
                  min={0.01}
                  precision={3}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Payment Mode</FormLabel>
                <Select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                >
                  <option value="PREPAID">Prepaid</option>
                  <option value="COD">COD</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <Text fontSize="sm" fontWeight="semibold" color="gray.600">
              Dimensions (optional, for volumetric weight)
            </Text>
            <SimpleGrid columns={3} spacing={4}>
              <FormControl>
                <FormLabel>Length (cm)</FormLabel>
                <NumberInput
                  value={formData.length}
                  onChange={(_, value) => setFormData({ ...formData, length: value })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Width (cm)</FormLabel>
                <NumberInput
                  value={formData.width}
                  onChange={(_, value) => setFormData({ ...formData, width: value })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Height (cm)</FormLabel>
                <NumberInput
                  value={formData.height}
                  onChange={(_, value) => setFormData({ ...formData, height: value })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel>Invoice Value (₹)</FormLabel>
                <NumberInput
                  value={formData.invoiceValue}
                  onChange={(_, value) => setFormData({ ...formData, invoiceValue: value })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Courier</FormLabel>
                <Select
                  placeholder="All Couriers"
                  value={formData.courierId}
                  onChange={(e) => setFormData({ ...formData, courierId: e.target.value })}
                >
                  {availableCouriers.map((c) => (
                    <option key={`${c.id}-${c.service_provider || c.serviceProvider || ''}`} value={c.id}>
                      {c.name || c.courier_name || `Courier ${c.id}`}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Service Provider</FormLabel>
              <Select
                placeholder="Select Service Provider"
                value={formData.serviceProvider}
                onChange={(e) =>
                  setFormData({ ...formData, serviceProvider: e.target.value, courierId: '' })
                }
              >
                {providers.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </Select>
            </FormControl>

            {!planId && (
              <FormControl isRequired>
                <FormLabel>Plan</FormLabel>
                <Select
                  placeholder={plansLoading ? 'Loading plans...' : 'Select a plan'}
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  isDisabled={plansLoading}
                >
                  {plans
                    .filter((plan) => plan.is_active !== false)
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                </Select>
              </FormControl>
            )}

            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleCalculate}
              isLoading={isCalculating}
            >
              Calculate Quote
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {quoteResult && (
        <Card bg={cardBg}>
          <CardHeader>
            <Text fontSize="lg" fontWeight="bold">
              Quote Breakdown
            </Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Route
                </Text>
                <Text fontWeight="semibold">
                  {quoteResult.origin?.zoneCode} ({quoteResult.origin?.zoneName}) →{' '}
                  {quoteResult.destination?.zoneCode} ({quoteResult.destination?.zoneName})
                </Text>
              </Box>

              {quoteResult.calculation && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Weight Calculation
                  </Text>
                  <SimpleGrid columns={2} spacing={2} fontSize="sm">
                    <Text>Actual Weight: {quoteResult.calculation.actualWeight} kg</Text>
                    <Text>
                      Volumetric Weight: {Number(quoteResult.calculation.volumetricWeight || 0).toFixed(2)} kg
                    </Text>
                    <Text>
                      Billable Weight: {Number(quoteResult.calculation.billableWeight || 0).toFixed(2)} kg
                    </Text>
                    <Text>
                      {quoteResult.calculation.usedVolumetric
                        ? '✓ Using volumetric'
                        : 'Using actual'}
                    </Text>
                  </SimpleGrid>
                </Box>
              )}

              <Divider />

              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Charges Breakdown
                </Text>
                <Table size="sm" variant="simple">
                  <Tbody>
                    <Tr>
                      <Td fontWeight="semibold">Base Freight</Td>
                      <Td isNumeric>₹{Number(quoteResult.charges?.baseFreight || 0).toFixed(2)}</Td>
                    </Tr>
                    {(quoteResult.charges?.overheads || []).map((overhead) => (
                      <Tr key={overhead.id}>
                        <Td>{overhead.name}</Td>
                        <Td isNumeric>₹{Number(overhead.amount || 0).toFixed(2)}</Td>
                      </Tr>
                    ))}
                    <Tr borderTop="2px solid" borderColor="gray.300">
                      <Td fontWeight="bold">Total</Td>
                      <Td isNumeric fontWeight="bold">
                        ₹{Number(quoteResult.charges?.total || 0).toFixed(2)}
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      )}
    </SimpleGrid>
  )
}

export default B2BQuoteCalculator
