import { ExternalLinkIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Heading,
  Input,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  SimpleGrid,
  Spinner,
  StackDivider,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import Card from 'components/Card/Card'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import {
  useApproveDocument,
  useApproveKyc,
  useRevokeKyc,
  useRejectDocument,
  useRejectKyc,
  useUserKyc,
} from 'hooks/useUser'
import { useMemo, useState } from 'react'

// StatusChip to map status to badge color
const StatusChip = ({ status }) => {
  let colorScheme = 'gray'
  if (status === 'verified') colorScheme = 'success'
  else if (status === 'pending' || status === 'verification_in_progress') colorScheme = 'warning'
  else if (status === 'rejected') colorScheme = 'error'
  return <StatusBadge status={status} type={colorScheme} />
}

const firstNonEmpty = (...values) => values.find((value) => String(value || '').trim()) || ''

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Card for each document
const DocCard = ({ label, presignedUrl, status, onApprove, onReject, kycStatus }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const hoverBg = useColorModeValue('gray.100', 'gray.600')
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleReject = () => {
    onReject(reason)
    setReason('')
    setIsOpen(false)
  }

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      shadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-4px)', shadow: 'md', bg: hoverBg }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="600">{label}</Text>
        <StatusChip status={status} />
      </Flex>

      {presignedUrl ? (
        <Link href={presignedUrl} isExternal color="blue.500" fontWeight="bold">
          View Document <ExternalLinkIcon mx="2px" />
        </Link>
      ) : (
        <Text color="gray.500">Not uploaded</Text>
      )}

      <Flex mt={2} gap={2}>
        <Button
          size="sm"
          colorScheme="green"
          zIndex={2}
          onClick={onApprove}
          isDisabled={status === 'verified'}
        >
          Approve
        </Button>

        <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="auto-end" isLazy>
          <PopoverTrigger>
            <Button
              disabled={kycStatus === 'verified'}
              zIndex={2}
              size="sm"
              colorScheme="red"
              onClick={() => setIsOpen(true)}
            >
              Reject
            </Button>
          </PopoverTrigger>
          <PopoverContent zIndex={2000} portal>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Rejection Reason</PopoverHeader>
            <PopoverBody>
              <Input
                placeholder="Enter reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </PopoverBody>
            <PopoverFooter display="flex" justifyContent="flex-end">
              <Button size="sm" colorScheme="red" onClick={handleReject} isDisabled={!reason}>
                Submit
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </Flex>
    </Box>
  )
}

const UserKycPage = ({ userId, user = {} }) => {
  const { data: kycData, isLoading, isError, refetch } = useUserKyc(userId)
  const kyc = kycData?.kyc ?? null
  const hasKyc = !!kyc && Object.keys(kyc).length > 0
  const companyInfo = user?.companyInfo || {}
  const displayName = firstNonEmpty(
    companyInfo.contactPerson,
    companyInfo.businessName,
    companyInfo.brandName,
    user?.email,
    user?.phone,
    'Merchant',
  )
  const displayEmail = firstNonEmpty(user?.email, companyInfo.contactEmail, companyInfo.companyEmail)
  const displayPhone = firstNonEmpty(
    user?.phone,
    companyInfo.contactNumber,
    companyInfo.companyContactNumber,
  )
  const [rejectingReason, setRejectingReason] = useState('')
  const [revokingReason, setRevokingReason] = useState('')

  const { mutate: approveKycMutate, isLoading: approving } = useApproveKyc()
  const { mutate: rejectKycMutate } = useRejectKyc()
  const { mutate: revokeKycMutate, isLoading: revoking } = useRevokeKyc()
  const approveDocumentMutation = useApproveDocument(userId)
  const rejectDocumentMutation = useRejectDocument(userId)

  // Document keys
  const docKeys = useMemo(() => {
    if (!hasKyc) return []
    return Object.entries(kyc)
      .filter(([key, value]) => key.toLowerCase().includes('url') && value)
      .map(([_, value]) => value)
  }, [hasKyc, kyc])

  const { data: presignedUrlsData, isLoading: urlsLoading } = usePresignedDownloadUrls({
    keys: docKeys,
  })

  const presignedUrlMap = useMemo(() => {
    if (!presignedUrlsData) return {}
    const map = {}
    docKeys.forEach((key, index) => {
      map[key] = presignedUrlsData[index]
    })
    return map
  }, [presignedUrlsData, docKeys])

  const handleApproveKyc = () => approveKycMutate(userId, { onSuccess: () => refetch() })
  const handleRejectKyc = (reason) =>
    rejectKycMutate({ userId, reason }, { onSuccess: () => refetch() })
  const handleRevokeKyc = (reason) =>
    revokeKycMutate({ userId, reason }, { onSuccess: () => refetch() })

  const handleApproveDoc = (key) =>
    approveDocumentMutation.mutate(key, { onSuccess: () => refetch() })
  const handleRejectDoc = ({ key, reason }) =>
    rejectDocumentMutation.mutate({ key, reason }, { onSuccess: () => refetch() })

  // All hooks must be called before any conditional returns
  const dividerBorderColor = useColorModeValue('gray.200', 'gray.600')
  const summaryBgColor = useColorModeValue('gray.50', 'gray.700')

  if (isLoading || urlsLoading)
    return (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    )

  if (isError)
    return (
      <Center minH="400px">
        <Text color="red.500">Failed to load KYC details.</Text>
      </Center>
    )

  if (!hasKyc)
    return (
      <Center minH="400px">
        <VStack spacing={3}>
          <Text fontWeight="700">{displayName}</Text>
          {(displayEmail || displayPhone) && (
            <Text color="gray.500">
              {[displayEmail, displayPhone].filter(Boolean).join(' | ')}
            </Text>
          )}
          <Text>No KYC data available.</Text>
        </VStack>
      </Center>
    )

  const textFields = [
    { label: 'Merchant', value: displayName },
    { label: 'Email', value: displayEmail },
    { label: 'Phone', value: displayPhone },
    { label: 'Business Structure', value: kyc.structure },
    { label: 'Company Type', value: kyc.companyType },
    { label: 'GSTIN', value: kyc.gstin },
    { label: 'CIN', value: kyc.cin },
    { label: 'KYC Status', value: kyc.status },
    { label: 'Submitted At', value: formatDateTime(kyc.createdAt) },
    { label: 'Last Updated', value: formatDateTime(kyc.updatedAt) },
  ].filter((f) => f.value)

  const docFields = [
    { label: 'Aadhaar', key: 'aadhaarUrl', status: kyc.aadhaarStatus },
    { label: 'Board Resolution', key: 'boardResolutionUrl', status: kyc.boardResolutionStatus },
    { label: 'Business PAN', key: 'businessPanUrl', status: kyc.businessPanStatus },
    { label: 'Cancelled Cheque', key: 'cancelledChequeUrl', status: kyc.cancelledChequeStatus },
    {
      label: 'Company Address Proof',
      key: 'companyAddressProofUrl',
      status: kyc.companyAddressProofStatus,
    },
    { label: 'GST Certificate', key: 'gstCertificateUrl', status: kyc.gstCertificateStatus },
    { label: 'LLP Agreement', key: 'llpAgreementUrl', status: kyc.llpAgreementStatus },
    { label: 'PAN Card', key: 'panCardUrl', status: kyc.panCardStatus },
    { label: 'Partnership Deed', key: 'partnershipDeedUrl', status: kyc.partnershipDeedStatus },
    { label: 'Selfie', key: 'selfieUrl', status: kyc.selfieStatus },
  ].filter((f) => kyc[f?.key])

  return (
    <Card p={6} borderRadius="xl" boxShadow="md">
      <Heading size="lg" mb={6} textAlign="center">
        User KYC Details
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Box p={4} borderRadius="lg" bg={summaryBgColor}>
          <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Merchant
          </Text>
          <Text fontWeight="700">{displayName}</Text>
        </Box>
        <Box p={4} borderRadius="lg" bg={summaryBgColor}>
          <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Email
          </Text>
          <Text fontWeight="600">{displayEmail || 'Not available'}</Text>
        </Box>
        <Box p={4} borderRadius="lg" bg={summaryBgColor}>
          <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
            Phone
          </Text>
          <Text fontWeight="600">{displayPhone || 'Not available'}</Text>
        </Box>
      </SimpleGrid>

      {/* Approve / Reject KYC */}
      {['verification_in_progress', 'rejected'].includes(kyc.status) && (
        <Flex justify="flex-end" gap={2} mb={4}>
          <Button colorScheme="green" onClick={handleApproveKyc} isLoading={approving}>
            Approve KYC
          </Button>
          <Popover placement="bottom" isLazy>
            <PopoverTrigger>
              <Button colorScheme="red">Reject KYC</Button>
            </PopoverTrigger>
            <PopoverContent zIndex={2000} portal>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>Rejection Reason</PopoverHeader>
              <PopoverBody>
                <Input
                  placeholder="Enter reason"
                  value={rejectingReason}
                  onChange={(e) => setRejectingReason(e.target.value)}
                />
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleRejectKyc(rejectingReason)}
                  isDisabled={!rejectingReason}
                >
                  Submit
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </Flex>
      )}

      {/* Revoke KYC */}
      {kyc.status === 'verified' && (
        <Flex justify="flex-end" gap={2} mb={4}>
          <Popover placement="bottom" isLazy>
            <PopoverTrigger>
              <Button colorScheme="orange" isLoading={revoking}>
                Revoke KYC
              </Button>
            </PopoverTrigger>
            <PopoverContent zIndex={2000} portal>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>Revocation Reason</PopoverHeader>
              <PopoverBody>
                <Input
                  placeholder="Enter reason for re-verification"
                  value={revokingReason}
                  onChange={(e) => setRevokingReason(e.target.value)}
                />
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <Button
                  size="sm"
                  colorScheme="orange"
                  onClick={() => handleRevokeKyc(revokingReason)}
                  isDisabled={!revokingReason}
                >
                  Confirm Revoke
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </Flex>
      )}

      {/* Text fields */}
      <VStack
        spacing={4}
        align="stretch"
        mb={6}
        divider={<StackDivider borderColor={dividerBorderColor} />}
      >
        {textFields.map((field) => (
          <Box key={field.label}>
            <Text fontWeight="600">{field.label}</Text>
            <Text>{field.value}</Text>
          </Box>
        ))}
      </VStack>

      {/* Document fields */}
      <Grid templateColumns={['1fr', '1fr 1fr']} gap={4}>
        {docFields.map((doc) => (
          <DocCard
            key={doc.key}
            label={doc.label}
            presignedUrl={presignedUrlMap[kyc[doc.key]]}
            status={doc.status}
            onApprove={() => handleApproveDoc(doc.key)}
            onReject={(reason) => handleRejectDoc({ key: doc.key, reason })}
            kycStatus={kyc?.status}
          />
        ))}
      </Grid>
      {!docFields.length && (
        <Text mt={4} color="gray.500" textAlign="center">
          No KYC documents uploaded yet.
        </Text>
      )}
    </Card>
  )
}

export default UserKycPage
