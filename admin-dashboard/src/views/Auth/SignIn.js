import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { loginAdmin } from '../../services/auth.service'
import { useAuthStore } from '../../store/useAuthStore'

function isTokenValid(token) {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp > Date.now() / 1000
  } catch {
    return false
  }
}

function SignIn() {
  const pageBg = useColorModeValue('#F7F2ED', '#161219')
  const shellBg = useColorModeValue('rgba(255,250,244,0.9)', 'rgba(36, 9, 20, 0.82)')
  const shellBorder = useColorModeValue('rgba(155,49,80,0.12)', 'rgba(231, 146, 174, 0.2)')
  const sideBg = useColorModeValue(
    'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(245,230,234,0.9) 100%)',
    'linear-gradient(180deg, rgba(91,28,49,0.92) 0%, rgba(61,17,34,0.94) 100%)',
  )
  const textPrimary = useColorModeValue('#161219', 'whiteAlpha.900')
  const textSecondary = useColorModeValue('#6A616A', 'whiteAlpha.700')
  const inputBg = useColorModeValue('rgba(255,255,255,0.82)', 'rgba(24, 19, 24, 0.76)')
  const inputBorder = useColorModeValue('rgba(155,49,80,0.18)', 'rgba(231, 146, 174, 0.2)')
  const iconHoverBg = useColorModeValue('rgba(155,49,80,0.08)', 'rgba(231, 146, 174, 0.12)')
  const chipBg = useColorModeValue('rgba(155,49,80,0.08)', 'rgba(255,255,255,0.08)')
  const chipBorder = useColorModeValue('rgba(155,49,80,0.14)', 'rgba(255,255,255,0.14)')
  const brand = useColorModeValue('#8A1F43', '#E48AA5')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const history = useHistory()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await loginAdmin(email, password)

      login(data.token, data?.user?.id, data.refreshToken)

      toast({
        title: 'Login successful',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })

      history.push('/admin/dashboard')
    } catch (err) {
      toast({
        title: 'Login failed',
        description: err.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (accessToken && refreshToken && isTokenValid(refreshToken)) {
      history.replace('/admin/dashboard')
    }
  }, [history])

  return (
    <Flex
      minH="100vh"
      bg={pageBg}
      align="center"
      justify="center"
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 8 }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="0"
        bgImage={useColorModeValue(
          'radial-gradient(circle at 10% 8%, rgba(155,49,80,0.14) 0%, transparent 38%), radial-gradient(circle at 94% 2%, rgba(86,192,165,0.12) 0%, transparent 28%)',
          'radial-gradient(circle at 10% 8%, rgba(231,146,174,0.18) 0%, transparent 38%), radial-gradient(circle at 94% 2%, rgba(86,192,165,0.12) 0%, transparent 28%)',
        )}
      />

      <Flex
        w="100%"
        maxW="1120px"
        bg={shellBg}
        border="1px solid"
        borderColor={shellBorder}
        borderRadius={{ base: '24px', lg: '30px' }}
        boxShadow={useColorModeValue(
          '0 28px 72px rgba(24,19,24,0.12)',
          '0 28px 72px rgba(0,0,0,0.38)',
        )}
        overflow="hidden"
        direction={{ base: 'column', lg: 'row' }}
        backdropFilter="blur(16px)"
        zIndex="1"
      >
        <Flex
          w={{ base: '100%', lg: '46%' }}
          bg={sideBg}
          color={textPrimary}
          p={{ base: 6, md: 8 }}
          direction="column"
          justify="space-between"
          minH={{ base: '240px', lg: 'unset' }}
          position="relative"
          overflow="hidden"
          borderRight={{ base: 'none', lg: '1px solid rgba(155,49,80,0.08)' }}
        >
          <Box
            position="absolute"
            right="-60px"
            top="-90px"
            w="240px"
            h="240px"
            borderRadius="full"
            bg={useColorModeValue('rgba(155,49,80,0.08)', 'rgba(255,255,255,0.06)')}
          />
          <Box
            position="absolute"
            left="-110px"
            bottom="-120px"
            w="260px"
            h="260px"
            borderRadius="full"
            bg={useColorModeValue('rgba(86,192,165,0.12)', 'rgba(86,192,165,0.08)')}
          />

          <VStack align="flex-start" spacing={5} position="relative" zIndex="1">
            <HStack spacing={2.5} flexWrap="wrap">
              {['Operations', 'Billing', 'Analytics'].map((tag) => (
                <Box key={tag} px={3} py={1.5} borderRadius="999px" bg={chipBg} border={`1px solid ${chipBorder}`}>
                  <Text fontSize="xs" fontWeight="700" color={textSecondary}>
                    {tag}
                  </Text>
                </Box>
              ))}
            </HStack>

            <HStack spacing={3}>
              <Box as="img" src="/delexpress-logo.svg" alt="DelExpress" h="52px" w="180px" objectFit="contain" />
              <Text fontSize="sm" fontWeight="800" letterSpacing="0.6px" color={textSecondary}>
                DELEXPRESS
              </Text>
            </HStack>

            <Heading
              fontFamily="'Plus Jakarta Sans', 'Poppins', sans-serif"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="800"
              lineHeight="0.98"
              letterSpacing="-0.04em"
            >
              Shipping control for
              <Text as="span" display="block" color={brand}>
                every order lane.
              </Text>
            </Heading>

            <Text color={textSecondary} fontSize="sm" maxW="360px" lineHeight="1.8">
              Review orders, compare courier movement, and manage finance operations from one calm,
              DelExpress admin panel.
            </Text>
          </VStack>

          <HStack spacing={3} position="relative" zIndex="1" flexWrap="wrap" pt={{ base: 5, lg: 0 }}>
            {[
              { value: '24/7', label: 'ops visibility' },
              { value: '1', label: 'admin workspace' },
              { value: 'Live', label: 'panel ready' },
            ].map((item) => (
              <Box
                key={item.label}
                px={4}
                py={3}
                borderRadius="20px"
                bg={useColorModeValue('rgba(255,255,255,0.68)', 'rgba(255,255,255,0.06)')}
                border={`1px solid ${chipBorder}`}
                minW="112px"
              >
                <Text fontSize="lg" fontWeight="800" color={brand} lineHeight="1">
                  {item.value}
                </Text>
                <Text mt={1} fontSize="xs" color={textSecondary}>
                  {item.label}
                </Text>
              </Box>
            ))}
          </HStack>
        </Flex>

        <Flex w={{ base: '100%', lg: '54%' }} align="center" justify="center" px={{ base: 5, md: 8 }} py={{ base: 7, md: 9 }}>
          <Box as="form" onSubmit={handleSubmit} w="100%" maxW="450px">
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontSize="xs" fontWeight="800" letterSpacing="0.7px" color={brand} mb={2}>
                  SECURE ACCESS
                </Text>
                <Heading
                  fontFamily="'Plus Jakarta Sans', 'Poppins', sans-serif"
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color={textPrimary}
                  lineHeight="1.02"
                  letterSpacing="-0.04em"
                >
                  Welcome back
                </Heading>
                <Text mt={2} color={textSecondary} fontSize="sm" lineHeight="1.8">
                  Sign in with your administrator credentials.
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700" color={textPrimary} mb={2}>
                  Email
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@delexpress.in"
                  h="52px"
                  borderRadius="18px"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _hover={{ borderColor: 'brand.400' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 4px rgba(155,49,80,0.12)',
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700" color={textPrimary} mb={2}>
                  Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    h="52px"
                    borderRadius="18px"
                    bg={inputBg}
                    borderColor={inputBorder}
                    pr="48px"
                    _hover={{ borderColor: 'brand.400' }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 4px rgba(155,49,80,0.12)',
                    }}
                  />
                  <InputRightElement h="52px" pr="10px">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      size="sm"
                      color={textSecondary}
                      onClick={() => setShowPassword(!showPassword)}
                      _hover={{ bg: iconHoverBg, color: brand }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                h="52px"
                borderRadius="999px"
                bg="brand.500"
                color="white"
                fontWeight="700"
                isLoading={loading}
                loadingText="Signing in"
                _hover={{ bg: 'brand.600' }}
                _active={{ bg: 'brand.700' }}
              >
                Sign In
              </Button>
            </VStack>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default SignIn
