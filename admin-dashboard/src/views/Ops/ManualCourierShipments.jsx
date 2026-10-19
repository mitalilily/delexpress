import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  bookManualShipmentWithProvider,
  getManualShipmentProviderOptions,
  getManualShipments,
  replaceManualAwb,
  updateManualShipment,
} from 'services/manualCourier.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const statusOptions = [
  'manual_booked',
  'pickup_initiated',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'ndr',
  'rto',
  'rto_delivered',
  'cancelled',
]

const providerKey = (row) =>
  `${row?.id ?? ''}__${row?.integration_type || row?.serviceProvider || ''}`

export default function ManualCourierShipments() {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const [status, setStatus] = useState('in_transit')
  const [remarks, setRemarks] = useState('')
  const [location, setLocation] = useState('')
  const [awb, setAwb] = useState('')
  const [providerOptions, setProviderOptions] = useState([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [saving, setSaving] = useState(false)
  const modal = useDisclosure()
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try {
      setRows(await getManualShipments({ search }))
    } catch (error) {
      toast({ title: error.response?.data?.message || 'Failed to load shipments', status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openShipment = async (row) => {
    setActive(row)
    setStatus(row.order_status || 'in_transit')
    setRemarks('')
    setLocation('')
    setAwb(row.manual_awb_number || row.awb_number || '')
    setProviderOptions([])
    setSelectedProvider('')
    modal.onOpen()

    if (row.order_type === 'b2c' && String(row.integration_type || '').toLowerCase() === 'manual') {
      setLoadingProviders(true)
      try {
        const options = await getManualShipmentProviderOptions(row.id, { orderType: row.order_type })
        setProviderOptions(Array.isArray(options) ? options : [])
      } catch (error) {
        toast({ title: error.response?.data?.message || 'Failed to load provider options', status: 'error' })
      } finally {
        setLoadingProviders(false)
      }
    }
  }

  const saveTracking = async () => {
    if (!active || saving) return
    setSaving(true)
    try {
      const currentAwb = active.manual_awb_number || active.awb_number || ''
      if (awb.trim() && awb.trim() !== currentAwb) {
        await replaceManualAwb(active.id, { orderType: active.order_type, awbNumber: awb.trim(), remarks })
      }
      await updateManualShipment(active.id, { orderType: active.order_type, status, remarks, location })
      toast({ title: 'Tracking update saved', status: 'success' })
      modal.onClose()
      await load()
    } catch (error) {
      toast({ title: error.response?.data?.message || error.message || 'Failed to save update', status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const bookWithProvider = async () => {
    if (!active || !selectedProvider || saving) return
    const option = providerOptions.find((item) => providerKey(item) === selectedProvider)
    if (!option) return
    setSaving(true)
    try {
      await bookManualShipmentWithProvider(active.id, {
        orderType: active.order_type,
        courierId: option.id,
        courierName: option.name,
        integrationType: option.integration_type || option.serviceProvider,
        selectedMaxSlabWeight: option.selected_max_slab_weight || option.max_slab_weight || undefined,
      })
      toast({ title: 'Shipment booked with integrated provider', status: 'success' })
      modal.onClose()
      await load()
    } catch (error) {
      toast({ title: error.response?.data?.message || error.message || 'Integrated booking failed', status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const keys = ['order_number', 'manual_courier_name', 'manual_awb_number', 'buyer_name', 'pincode', 'weight', 'freight_charges', 'order_status', 'created_at']
  const captions = ['Order', 'Manual courier', 'Local AWB', 'Seller customer', 'Pincode', 'Weight', 'Freight', 'Status', 'Created']
  const renderers = {
    created_at: (value) => (value ? new Date(value).toLocaleString('en-IN') : ''),
    weight: (value) => `${value || 0} kg`,
    freight_charges: (value) => `₹${Number(value || 0).toFixed(2)}`,
    order_status: (value) => <Badge>{String(value || '').replace(/_/g, ' ')}</Badge>,
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <Flex justify="space-between" align="center" gap={4} wrap="wrap">
        <Text fontSize="2xl" fontWeight="bold">Shipment Operations</Text>
        <Input maxW="360px" placeholder="Search order, AWB or customer" value={search} onChange={(event) => setSearch(event.target.value)} />
      </Flex>
      {loading ? <Spinner /> : <GenericTable columnKeys={keys} captions={captions} data={rows} renderers={renderers} onRowClick={openShipment} />}

      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Shipment operations</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {active && (
              <VStack spacing={4} align="stretch">
                <Box borderWidth="1px" borderRadius="md" p={4}>
                  <Text fontWeight="bold">{active.manual_awb_number || active.awb_number || 'No AWB'}</Text>
                  <Text color="gray.600">{active.order_number} / {active.manual_courier_name}</Text>
                  <Text fontSize="sm" mt={2}>Merchant customer: {active.buyer_name} / {active.pincode}</Text>
                  <Text fontSize="sm">Current status: {String(active.order_status || '').replace(/_/g, ' ')}</Text>
                </Box>
                <Tabs variant="enclosed-colored">
                  <TabList><Tab>Overview</Tab><Tab>Update tracking</Tab><Tab>Integrated booking</Tab></TabList>
                  <TabPanels>
                    <TabPanel px={1}>
                      <Text fontSize="sm">The local AWB remains available for manual operations until an integrated provider booking succeeds.</Text>
                      <Text fontSize="sm" mt={2}>Wallet debits are protected by an idempotent order reference.</Text>
                    </TabPanel>
                    <TabPanel px={1}>
                      <VStack spacing={3} align="stretch">
                        <FormControl><FormLabel>Status</FormLabel><Select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}</Select></FormControl>
                        <FormControl><FormLabel>Event time</FormLabel><Input value={new Date().toLocaleString('en-IN')} isReadOnly /></FormControl>
                        <FormControl><FormLabel>Local AWB</FormLabel><Input value={awb} onChange={(event) => setAwb(event.target.value)} /></FormControl>
                        <FormControl><FormLabel>Location</FormLabel><Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Optional scan location" /></FormControl>
                        <FormControl><FormLabel>Remarks</FormLabel><Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Customer-facing tracking message" /></FormControl>
                        <Button colorScheme="blue" onClick={saveTracking} isLoading={saving}>Save tracking update</Button>
                      </VStack>
                    </TabPanel>
                    <TabPanel px={1}>
                      {active.order_type !== 'b2c' ? <Alert status="info"><AlertIcon />Integrated provider booking is currently available for B2C manual shipments only.</Alert> : <VStack spacing={3} align="stretch">
                        <Alert status="info"><AlertIcon />A successful booking replaces the active AWB with the provider AWB and preserves the local AWB in the audit trail.</Alert>
                        <FormControl><FormLabel>Integrated courier</FormLabel>{loadingProviders ? <Spinner /> : <Select placeholder="Select courier" value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)}>{providerOptions.map((option) => <option key={providerKey(option)} value={providerKey(option)}>{option.name} ({option.integration_type || option.serviceProvider}){option.rate != null ? ` - ₹${Number(option.rate).toFixed(2)}` : ''}</option>)}</Select>}</FormControl>
                        {!loadingProviders && !providerOptions.length && <Alert status="warning"><AlertIcon />No serviceable integrated courier with a configured rate was returned.</Alert>}
                        <Button colorScheme="purple" onClick={bookWithProvider} isDisabled={!selectedProvider} isLoading={saving}>Book with integrated provider</Button>
                      </VStack>}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter><Button onClick={modal.onClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
