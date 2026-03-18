import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import React from 'react'

function SignUp() {
  const pageBg = useColorModeValue('#F7F2ED', '#161219')
  const shellBg = useColorModeValue('rgba(255,250,244,0.9)', 'rgba(36, 9, 20, 0.82)')
  const shellBorder = useColorModeValue('rgba(155,49,80,0.12)', 'rgba(231, 146, 174, 0.2)')
  const heroBg = useColorModeValue(
    'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(245,230,234,0.9) 100%)',
    'linear-gradient(180deg, rgba(91,28,49,0.92) 0%, rgba(61,17,34,0.94) 100%)',
  )
  const textPrimary = useColorModeValue('#161219', 'whiteAlpha.900')
  const textSecondary = useColorModeValue('#6A616A', 'whiteAlpha.700')
  const inputBg = useColorModeValue('rgba(255,255,255,0.82)', 'rgba(24, 19, 24, 0.76)')
  const inputBorder = useColorModeValue('rgba(155,49,80,0.18)', 'rgba(231, 146, 174, 0.2)')
  const brand = useColorModeValue('#8A1F43', '#E48AA5')

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
        boxShadow={useColorModeValue('0 28px 72px rgba(24,19,24,0.12)', '0 28px 72px rgba(0,0,0,0.38)')}
        overflow="hidden"
        direction={{ base: 'column', lg: 'row' }}
        backdropFilter="blur(16px)"
        zIndex="1"
      >
        <Flex
          w={{ base: '100%', lg: '44%' }}
          bg={heroBg}
          color={textPrimary}
          p={{ base: 6, md: 8 }}
          direction="column"
          justify="space-between"
          minH={{ base: '240px', lg: 'unset' }}
          position="relative"
          overflow="hidden"
          borderRight={{ base: 'none', lg: '1px solid rgba(155,49,80,0.08)' }}
        >
          <VStack align="flex-start" spacing={5} position="relative" zIndex="1">
            <Box as="img" src="/delexpress-logo.svg" alt="DelExpress" h="52px" w="180px" objectFit="contain" />
            <Heading
              fontFamily="'Plus Jakarta Sans', 'Poppins', sans-serif"
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="800"
              lineHeight="0.98"
              letterSpacing="-0.04em"
            >
              Launch shipping
              <Text as="span" display="block" color={brand}>
                workflows with ease.
              </Text>
            </Heading>
            <Text color={textSecondary} fontSize="sm" maxW="360px" lineHeight="1.8">
              Create a DelExpress workspace for operations teams that need courier control,
              billing visibility, and a cleaner daily panel.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} pt={{ base: 5, lg: 0 }}>
            {[
              { value: 'B2C', label: 'shipments ready' },
              { value: 'B2B', label: 'lanes supported' },
              { value: 'Live', label: 'branding system' },
            ].map((item) => (
              <Box
                key={item.label}
                px={4}
                py={3}
                borderRadius="20px"
                bg={useColorModeValue('rgba(255,255,255,0.68)', 'rgba(255,255,255,0.06)')}
                border={`1px solid ${useColorModeValue('rgba(155,49,80,0.14)', 'rgba(255,255,255,0.14)')}`}
              >
                <Text fontSize="lg" fontWeight="800" color={brand} lineHeight="1">
                  {item.value}
                </Text>
                <Text mt={1} fontSize="xs" color={textSecondary}>
                  {item.label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Flex>

        <Flex w={{ base: '100%', lg: '56%' }} align="center" justify="center" px={{ base: 5, md: 8 }} py={{ base: 7, md: 9 }}>
          <Box w="100%" maxW="460px">
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontSize="xs" fontWeight="800" letterSpacing="0.7px" color={brand} mb={2}>
                  DELIVER FASTER
                </Text>
                <Heading
                  fontFamily="'Plus Jakarta Sans', 'Poppins', sans-serif"
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color={textPrimary}
                  lineHeight="1.02"
                  letterSpacing="-0.04em"
                >
                  Create your admin workspace
                </Heading>
                <Text mt={2} color={textSecondary} fontSize="sm" lineHeight="1.8">
                  Use this setup form to onboard your DelExpress operations team.
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="700" color={textPrimary}>
                    Full Name
                  </FormLabel>
                  <Input
                    placeholder="Operations manager"
                    h="52px"
                    borderRadius="18px"
                    bg={inputBg}
                    borderColor={inputBorder}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 4px rgba(155,49,80,0.12)' }}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="700" color={textPrimary}>
                    Company
                  </FormLabel>
                  <Input
                    placeholder="DelExpress partner"
                    h="52px"
                    borderRadius="18px"
                    bg={inputBg}
                    borderColor={inputBorder}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 4px rgba(155,49,80,0.12)' }}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700" color={textPrimary}>
                  Work Email
                </FormLabel>
                <Input
                  type="email"
                  placeholder="team@delexpress.in"
                  h="52px"
                  borderRadius="18px"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 4px rgba(155,49,80,0.12)' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="700" color={textPrimary}>
                  Password
                </FormLabel>
                <Input
                  type="password"
                  placeholder="Create a secure password"
                  h="52px"
                  borderRadius="18px"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 4px rgba(155,49,80,0.12)' }}
                />
              </FormControl>

              <Checkbox colorScheme="green" defaultChecked>
                <Text fontSize="sm" color={textSecondary}>
                  Keep me signed in on this device
                </Text>
              </Checkbox>

              <Button
                h="52px"
                borderRadius="999px"
                bg="brand.500"
                color="white"
                fontWeight="700"
                _hover={{ bg: 'brand.600' }}
                _active={{ bg: 'brand.700' }}
              >
                Start with DelExpress
              </Button>

              <Text color={textSecondary} fontWeight="medium" textAlign="center">
                Already have access?
                <Link color={brand} ms="5px" href={`${process.env.PUBLIC_URL}/#/auth/signin`} fontWeight="bold">
                  Sign in
                </Link>
              </Text>
            </VStack>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default SignUp
