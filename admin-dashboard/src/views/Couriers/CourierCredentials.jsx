import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import {
  useCourierCredentials,
  useUpdateDelhiveryCredentials,
  useUpdateExpressflyCredentials,
  useUpdateEkartCredentials,
  useUpdateShadowfaxCredentials,
  useUpdateXpressbeesCredentials,
} from 'hooks/useCouriers'

const CourierCredentials = () => {
  const toast = useToast()
  const { data, isLoading, error } = useCourierCredentials()
  const updateDelhivery = useUpdateDelhiveryCredentials()
  const updateExpressfly = useUpdateExpressflyCredentials()
  const updateEkart = useUpdateEkartCredentials()
  const updateShadowfax = useUpdateShadowfaxCredentials()
  const updateXpressbees = useUpdateXpressbeesCredentials()

  const [form, setForm] = useState({
    apiBase: '',
    clientName: '',
    apiKey: '',
  })
  const [ekartForm, setEkartForm] = useState({
    apiBase: '',
    clientId: '',
    username: '',
    password: '',
    webhookSecret: '',
  })
  const [expressflyForm, setExpressflyForm] = useState({
    apiKey: '',
    apiUserId: '',
  })
  const [shadowfaxForm, setShadowfaxForm] = useState({
    apiBase: '',
    apiKey: '',
  })
  const [xpressbeesForm, setXpressbeesForm] = useState({
    apiBase: '',
    username: '',
    secretKey: '',
    xbKey: '',
    password: '',
    apiKey: '',
    webhookSecret: '',
  })

  useEffect(() => {
    if (data?.delhivery) {
      setForm({
        apiBase: data.delhivery.apiBase || '',
        clientName: data.delhivery.clientName || '',
        apiKey: '',
      })
    }
    if (data?.ekart) {
      setEkartForm({
        apiBase: data.ekart.apiBase || '',
        clientId: data.ekart.clientId || '',
        username: data.ekart.username || '',
        password: '',
        webhookSecret: '',
      })
    }
    if (data?.expressfly) {
      setExpressflyForm({
        apiKey: '',
        apiUserId: data.expressfly.apiUserId || '',
      })
    }
    if (data?.shadowfax) {
      setShadowfaxForm({
        apiBase: data.shadowfax.apiBase || '',
        apiKey: '',
      })
    }
    if (data?.xpressbees) {
      setXpressbeesForm({
        apiBase: data.xpressbees.apiBase || '',
        username: data.xpressbees.username || '',
        secretKey: '',
        xbKey: '',
        password: '',
        apiKey: '',
        webhookSecret: '',
      })
    }
  }, [data])

  const handleSaveExpressfly = () => {
    updateExpressfly.mutate(
      {
        ...(expressflyForm.apiKey ? { apiKey: expressflyForm.apiKey } : {}),
        ...(expressflyForm.apiUserId ? { apiUserId: expressflyForm.apiUserId } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Expressfly credentials updated', status: 'success' })
          setExpressflyForm((prev) => ({ ...prev, apiKey: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Expressfly credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveShadowfax = () => {
    updateShadowfax.mutate(
      {
        ...(shadowfaxForm.apiBase ? { apiBase: shadowfaxForm.apiBase } : {}),
        ...(shadowfaxForm.apiKey ? { apiKey: shadowfaxForm.apiKey } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Shadowfax credentials updated', status: 'success' })
          setShadowfaxForm((prev) => ({ ...prev, apiKey: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Shadowfax credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveDelhivery = () => {
    updateDelhivery.mutate(
      {
        apiBase: form.apiBase,
        clientName: form.clientName,
        ...(form.apiKey ? { apiKey: form.apiKey } : {}),
      },
      {
        onSuccess: () => {
          toast({
            title: 'Delhivery credentials updated',
            status: 'success',
          })
          setForm((prev) => ({ ...prev, apiKey: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveEkart = () => {
    updateEkart.mutate(
      {
        apiBase: ekartForm.apiBase,
        clientId: ekartForm.clientId,
        username: ekartForm.username,
        ...(ekartForm.password ? { password: ekartForm.password } : {}),
        ...(ekartForm.webhookSecret ? { webhookSecret: ekartForm.webhookSecret } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Ekart credentials updated', status: 'success' })
          setEkartForm((prev) => ({ ...prev, password: '', webhookSecret: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Ekart credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveXpressbees = () => {
    updateXpressbees.mutate(
      {
        apiBase: xpressbeesForm.apiBase,
        username: xpressbeesForm.username,
        ...(xpressbeesForm.secretKey ? { secretKey: xpressbeesForm.secretKey } : {}),
        ...(xpressbeesForm.xbKey ? { xbKey: xpressbeesForm.xbKey } : {}),
        ...(xpressbeesForm.password ? { password: xpressbeesForm.password } : {}),
        ...(xpressbeesForm.apiKey ? { apiKey: xpressbeesForm.apiKey } : {}),
        ...(xpressbeesForm.webhookSecret
          ? { webhookSecret: xpressbeesForm.webhookSecret }
          : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Xpressbees credentials updated', status: 'success' })
          setXpressbeesForm((prev) => ({
            ...prev,
            secretKey: '',
            xbKey: '',
            password: '',
            apiKey: '',
            webhookSecret: '',
          }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Xpressbees credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  if (isLoading) return <Spinner size="md" />
  if (error) return <Text color="red.500">Failed to load courier credentials</Text>

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <Text fontSize="xl" fontWeight="bold">
        Courier Credentials
      </Text>

      <Flex gap={4} flexWrap="wrap">
        <Box
          borderWidth="1px"
          borderRadius="lg"
          p={5}
          minW="320px"
          flex="1"
          maxW="520px"
          mb={{ base: 4, md: 0 }}
        >
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Delhivery</Text>
              <Badge colorScheme={data?.delhivery?.hasApiKey ? 'green' : 'orange'}>
                {data?.delhivery?.hasApiKey ? 'Configured' : 'Missing API Key'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={form.apiBase}
                onChange={(e) => setForm((prev) => ({ ...prev, apiBase: e.target.value }))}
                placeholder="https://track.delhivery.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Client Name</FormLabel>
              <Input
                value={form.clientName}
                onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))}
                placeholder="Your Delhivery client name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>API Key</FormLabel>
              <Input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={data?.delhivery?.apiKeyMasked || 'Enter Delhivery API key'}
              />
              {!!data?.delhivery?.apiKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current key: {data.delhivery.apiKeyMasked}
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Standard Delhivery credentials. Leave the API key blank to keep the existing secret.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveDelhivery}
              isLoading={updateDelhivery.isPending}
              alignSelf="flex-start"
            >
              Save Delhivery Credentials
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Expressfly Logistics</Text>
              <Badge
                colorScheme={
                  data?.expressfly?.hasApiKey && data?.expressfly?.hasApiUserId
                    ? 'green'
                    : 'orange'
                }
              >
                {data?.expressfly?.hasApiKey && data?.expressfly?.hasApiUserId
                  ? 'Configured'
                  : 'Missing credentials'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Key</FormLabel>
              <Input
                type="password"
                value={expressflyForm.apiKey}
                onChange={(e) =>
                  setExpressflyForm((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder={data?.expressfly?.apiKeyMasked || 'Enter Expressfly API key'}
              />
              {!!data?.expressfly?.apiKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current API key: {data.expressfly.apiKeyMasked}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>API User ID</FormLabel>
              <Input
                value={expressflyForm.apiUserId}
                onChange={(e) =>
                  setExpressflyForm((prev) => ({ ...prev, apiUserId: e.target.value }))
                }
                placeholder={data?.expressfly?.apiUserIdMasked || 'Enter Expressfly API user ID'}
              />
              {!!data?.expressfly?.apiUserIdMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current API user ID: {data.expressfly.apiUserIdMasked}
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Leave either field blank to keep the saved value.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveExpressfly}
              isLoading={updateExpressfly.isPending}
              alignSelf="flex-start"
            >
              Save Expressfly Credentials
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Shadowfax</Text>
              <Badge colorScheme={data?.shadowfax?.hasApiKey ? 'green' : 'orange'}>
                {data?.shadowfax?.hasApiKey ? 'API key set' : 'Missing API key'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={shadowfaxForm.apiBase}
                onChange={(e) =>
                  setShadowfaxForm((prev) => ({ ...prev, apiBase: e.target.value }))
                }
                placeholder="Enter Shadowfax API base URL"
              />
              {!!data?.shadowfax?.apiBase && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current API base: {data.shadowfax.apiBase}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>API Key</FormLabel>
              <Input
                type="password"
                value={shadowfaxForm.apiKey}
                onChange={(e) =>
                  setShadowfaxForm((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder={data?.shadowfax?.apiKeyMasked || 'Enter Shadowfax API key'}
              />
              {!!data?.shadowfax?.apiKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current API key: {data.shadowfax.apiKeyMasked}
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Leave the API key blank to keep the saved secret.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveShadowfax}
              isLoading={updateShadowfax.isPending}
              alignSelf="flex-start"
            >
              Save Shadowfax Credentials
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Ekart Logistics</Text>
              <Badge colorScheme={data?.ekart?.hasPassword ? 'green' : 'orange'}>
                {data?.ekart?.hasPassword ? 'Credentials set' : 'Missing password'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>API Base URL</FormLabel>
              <Input
                value={ekartForm.apiBase}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, apiBase: e.target.value }))}
                placeholder="https://api.ekartlogistics.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Client ID</FormLabel>
              <Input
                value={ekartForm.clientId}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, clientId: e.target.value }))}
                placeholder="Your Ekart client ID"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input
                value={ekartForm.username}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Ekart username"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={ekartForm.password}
                onChange={(e) => setEkartForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter Ekart password (saved securely)"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Webhook Secret</FormLabel>
              <Input
                type="password"
                value={ekartForm.webhookSecret}
                onChange={(e) =>
                  setEkartForm((prev) => ({ ...prev, webhookSecret: e.target.value }))
                }
                placeholder="Leave blank to keep existing webhook secret"
              />
              {data?.ekart?.hasWebhookSecret && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Webhook secret already configured on Ekart.
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Ekart requires client ID + username/password for token generation. Leave password blank to keep the saved secret.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveEkart}
              isLoading={updateEkart.isPending}
              alignSelf="flex-start"
            >
              Save Ekart Credentials
            </Button>
          </VStack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={5} minW="320px" flex="1" maxW="520px">
          <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold">Xpressbees</Text>
              <Badge colorScheme={data?.xpressbees?.hasApiKey ? 'green' : 'orange'}>
                {data?.xpressbees?.hasApiKey ? 'API key set' : 'Missing API key'}
              </Badge>
            </Flex>

            <FormControl>
              <FormLabel>Forward Manifest URL</FormLabel>
              <Input
                value={xpressbeesForm.apiBase}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, apiBase: e.target.value }))
                }
                placeholder="https://apishipmentmanifestation.xbees.in/shipmentmanifestation/forward"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Username / Email</FormLabel>
              <Input
                value={xpressbeesForm.username}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Xpressbees username or email"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Secret Key</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.secretKey}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, secretKey: e.target.value }))
                }
                placeholder={data?.xpressbees?.secretKeyMasked || 'Leave blank to keep existing secret key'}
              />
              {!!data?.xpressbees?.secretKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current secret key: {data.xpressbees.secretKeyMasked}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>XB Key</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.xbKey}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, xbKey: e.target.value }))
                }
                placeholder={data?.xpressbees?.xbKeyMasked || 'Leave blank to keep existing XB key'}
              />
              {!!data?.xpressbees?.xbKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current XB key: {data.xpressbees.xbKeyMasked}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.password}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Leave blank to keep existing password"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Generated Bearer Token</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.apiKey}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder={
                  data?.xpressbees?.apiKeyMasked ||
                  'Optional. Leave blank to generate from username/password'
                }
              />
              {!!data?.xpressbees?.apiKeyMasked && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Current bearer token: {data.xpressbees.apiKeyMasked}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Webhook Secret</FormLabel>
              <Input
                type="password"
                value={xpressbeesForm.webhookSecret}
                onChange={(e) =>
                  setXpressbeesForm((prev) => ({ ...prev, webhookSecret: e.target.value }))
                }
                placeholder="Leave blank to keep existing webhook secret"
              />
              {data?.xpressbees?.hasWebhookSecret && (
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Webhook secret already configured on Xpressbees.
                </Text>
              )}
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Leave password, bearer token, secret key, XB key, or webhook secret blank to keep the saved value.
            </Text>

            <Button
              colorScheme="blue"
              onClick={handleSaveXpressbees}
              isLoading={updateXpressbees.isPending}
              alignSelf="flex-start"
            >
              Save Xpressbees Credentials
            </Button>
          </VStack>
        </Box>
      </Flex>
    </Flex>
  )
}

export default CourierCredentials
