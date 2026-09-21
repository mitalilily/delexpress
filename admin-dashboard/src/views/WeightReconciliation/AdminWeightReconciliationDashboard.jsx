import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Textarea,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import CardHeader from 'components/Card/CardHeader'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAllWeightDiscrepancies,
  useApproveWeightDiscrepancy,
  useCreateCsvWeightDiscrepancies,
  useCreateManualWeightDiscrepancy,
  useWeightReconciliationStats,
} from 'hooks/useWeightReconciliation'
import { useState } from 'react'
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi'
import { RiScales3Line } from 'react-icons/ri'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const filterOptions = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Pending', value: 'pending' },
      { label: 'Accepted', value: 'accepted' },
      { label: 'Disputed', value: 'disputed' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Rejected', value: 'rejected' },
    ],
  },
  {
    key: 'hasDispute',
    label: 'Has Dispute',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  },
  {
    key: 'fromDate',
    label: 'From Date',
    type: 'date',
  },
  {
    key: 'toDate',
    label: 'To Date',
    type: 'date',
  },
]

const getStatusType = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'accepted':
    case 'resolved':
      return 'success'
    case 'disputed':
      return 'info'
    case 'rejected':
      return 'error'
    default:
      return 'neutral'
  }
}

export default function AdminWeightReconciliationDashboard() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [filters, setFilters] = useState({})
  const [manualForm, setManualForm] = useState({
    orderId: '',
    awbNumber: '',
    sellerWeightKg: '',
    freightPaid: '',
    courierWeightKg: '',
    notes: '',
  })
  const [csvText, setCsvText] = useState('')

  // Use hooks
  const { data: stats, isLoading: statsLoading } = useWeightReconciliationStats({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  })

  const { data: discrepanciesData, isLoading: discrepanciesLoading } = useAllWeightDiscrepancies({
    ...filters,
    page,
    limit: perPage,
  })
  const createManual = useCreateManualWeightDiscrepancy()
  const createCsv = useCreateCsvWeightDiscrepancies()
  const approveDiscrepancy = useApproveWeightDiscrepancy()

  // Debug logging
  console.log('🔍 Admin Dashboard Debug:')
  console.log('1. Loading state:', discrepanciesLoading)
  console.log('2. Raw API response:', discrepanciesData)
  console.log('3. Discrepancies array:', discrepanciesData?.discrepancies)
  console.log('4. Array length:', discrepanciesData?.discrepancies?.length)
  console.log('5. First raw item:', discrepanciesData?.discrepancies?.[0])

  // TEMP: Use data directly without filter for debugging
  const discrepancies = discrepanciesData?.discrepancies || []
  const totalCount = discrepanciesData?.pagination?.total || 0

  console.log('6. Filtered discrepancies:', discrepancies)
  console.log('7. Filtered length:', discrepancies.length)
  console.log('8. First filtered item:', discrepancies[0])

  // If we have data but it's being filtered out, log why
  if ((discrepanciesData?.discrepancies?.length || 0) > 0 && discrepancies.length === 0) {
    console.warn('⚠️ Data is being filtered out!')
    console.log('Checking first item structure:')
    const firstItem = discrepanciesData.discrepancies[0]
    console.log('- Has item:', !!firstItem)
    console.log('- Has discrepancy:', !!firstItem?.discrepancy)
    console.log('- Item keys:', firstItem ? Object.keys(firstItem) : 'N/A')
  }

  const tableColumns = [
    'Order #',
    'User',
    'Courier',
    'Declared (kg)',
    'Charged (kg)',
    'Difference',
    'Extra Charge',
    'Status',
    'Dispute',
    'Action',
    'Date',
  ]

  const columnKeys = [
    'order_number',
    'user',
    'courier',
    'declared_weight',
    'charged_weight',
    'weight_difference',
    'additional_charge',
    'status',
    'has_dispute',
    'action',
    'created_at',
  ]

  const renderers = {
    order_number: (value, row) => row?.discrepancy?.order_number || 'N/A',
    user: (value, row) => (
      <Text fontSize="sm">{row?.user?.email || row?.user?.phone || 'N/A'}</Text>
    ),
    courier: (value, row) => (
      <Text fontSize="sm">{row?.discrepancy?.courier_partner || 'N/A'}</Text>
    ),
    declared_weight: (value, row) =>
      (Number(row?.discrepancy?.declared_weight || 0) / 1000).toFixed(3),
    charged_weight: (value, row) =>
      (Number(row?.discrepancy?.charged_weight || 0) / 1000).toFixed(3),
    weight_difference: (value, row) => {
      const diff = Number(row?.discrepancy?.weight_difference || 0) / 1000
      return (
        <Text color={diff > 0 ? 'red.500' : 'green.500'} fontWeight="600">
          {diff > 0 ? '+' : ''}
          {diff.toFixed(3)}
        </Text>
      )
    },
    additional_charge: (value, row) => (
      <Text fontWeight="600">₹{Number(row?.discrepancy?.additional_charge || 0).toFixed(2)}</Text>
    ),
    status: (value, row) => (
      <StatusBadge
        status={row?.discrepancy?.status || 'unknown'}
        type={getStatusType(row?.discrepancy?.status)}
      />
    ),
    has_dispute: (value, row) => (
      <Text color={row?.discrepancy?.has_dispute ? 'red.500' : 'gray.500'}>
        {row?.discrepancy?.has_dispute ? 'Yes' : 'No'}
      </Text>
    ),
    action: (value, row) =>
      row?.discrepancy?.status === 'pending' ? (
        <Button
          size="sm"
          colorScheme="green"
          isLoading={approveDiscrepancy.isPending}
          onClick={() =>
            approveDiscrepancy.mutate({
              discrepancyId: row.discrepancy.id,
              data: { notes: 'Approved from admin dashboard' },
            })
          }
        >
          Approve
        </Button>
      ) : (
        <Text fontSize="sm" color="gray.500">
          -
        </Text>
      ),
    created_at: (value, row) => (
      <Text fontSize="xs" color="gray.500">
        {row?.discrepancy?.created_at
          ? new Date(row.discrepancy.created_at).toLocaleDateString()
          : 'N/A'}
      </Text>
    ),
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Header */}
      <Flex align="center" gap={3} mb={6}>
        <RiScales3Line size={32} color="#7696AC" />
        <Heading size="lg" color="#7696AC">
          Weight Reconciliation
        </Heading>
      </Flex>

      {/* Summary Stats */}
      {stats && stats.statusStats && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={5} mb={6}>
          {stats.statusStats.map((stat) => (
            <Card key={stat.status}>
              <CardBody>
                <Stat>
                  <StatLabel textTransform="capitalize">{stat.status} Discrepancies</StatLabel>
                  <StatNumber fontSize="2xl">{stat.count}</StatNumber>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    ₹{Number(stat.totalAdditionalCharge || 0).toFixed(2)} total charges
                  </Text>
                </Stat>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} mb={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Add Manual Discrepancy</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>Order ID / Order Number</FormLabel>
                  <Input
                    value={manualForm.orderId}
                    onChange={(event) =>
                      setManualForm({ ...manualForm, orderId: event.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>AWB</FormLabel>
                  <Input
                    value={manualForm.awbNumber}
                    onChange={(event) =>
                      setManualForm({ ...manualForm, awbNumber: event.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Seller Weight (kg)</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={manualForm.sellerWeightKg}
                    onChange={(event) =>
                      setManualForm({ ...manualForm, sellerWeightKg: event.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Freight Paid</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualForm.freightPaid}
                    onChange={(event) =>
                      setManualForm({ ...manualForm, freightPaid: event.target.value })
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Courier Weight (kg)</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={manualForm.courierWeightKg}
                    onChange={(event) =>
                      setManualForm({ ...manualForm, courierWeightKg: event.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Input
                    value={manualForm.notes}
                    onChange={(event) =>
                      setManualForm({ ...manualForm, notes: event.target.value })
                    }
                  />
                </FormControl>
              </SimpleGrid>
              <Button
                alignSelf="flex-start"
                colorScheme="blue"
                isLoading={createManual.isPending}
                onClick={() => createManual.mutate(manualForm)}
              >
                Create Discrepancy
              </Button>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">CSV Import</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Header: order_id, awb, seller_weight_kg, freight_paid, courier_weight_kg, notes
              </Text>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setCsvText(String(reader.result || ''))
                  reader.readAsText(file)
                }}
              />
              <Textarea
                minH="140px"
                value={csvText}
                onChange={(event) => setCsvText(event.target.value)}
                placeholder="Paste CSV rows here"
              />
              <Button
                alignSelf="flex-start"
                colorScheme="blue"
                isLoading={createCsv.isPending}
                onClick={() => createCsv.mutate(csvText)}
              >
                Import CSV
              </Button>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Top Couriers with Discrepancies */}
      {stats?.courierStats && stats.courierStats.length > 0 && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Top Couriers with Discrepancies</Heading>
          </CardHeader>
          <CardBody>
            <Box overflowX="auto">
              {stats.courierStats.slice(0, 5).map((courier, idx) => (
                <Flex
                  key={idx}
                  justify="space-between"
                  align="center"
                  py={3}
                  borderBottomWidth="1px"
                >
                  <Text fontWeight="600">{courier.courier || 'Unknown'}</Text>
                  <Flex gap={4} align="center">
                    <Text fontSize="sm" color="gray.600">
                      {courier.count} discrepancies
                    </Text>
                    <Flex align="center" gap={1}>
                      {Number(courier.avgWeightDifference) > 0 ? (
                        <FiTrendingUp color="red" />
                      ) : (
                        <FiTrendingDown color="green" />
                      )}
                      <Text fontWeight="600">
                        {Math.abs(Number(courier.avgWeightDifference || 0)).toFixed(3)} kg
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              ))}
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <TableFilters filters={filterOptions} values={filters} onApply={setFilters} />

      {/* Discrepancies Table */}
      {console.log('📋 Passing to GenericTable:', {
        dataLength: discrepancies.length,
        totalCount,
        loading: discrepanciesLoading || statsLoading,
        firstItem: discrepancies[0],
      })}
      <GenericTable
        title="Recent Discrepancies"
        data={discrepancies}
        captions={tableColumns}
        columnKeys={columnKeys}
        renderers={renderers}
        loading={discrepanciesLoading || statsLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        paginated={true}
      />
    </Box>
  )
}
