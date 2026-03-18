/* eslint-disable */
import { Flex, Link, Text, useColorModeValue } from '@chakra-ui/react'

export default function Footer() {
  const textColor = useColorModeValue('gray.500', 'gray.400')
  const linkColor = useColorModeValue('brand.500', 'brand.300')

  return (
    <Flex
      flexDirection={{ base: 'column', xl: 'row' }}
      alignItems={{ base: 'center', xl: 'start' }}
      justifyContent="space-between"
      px="30px"
      py="20px"
      w="100%"
    >
      <Text
        color={textColor}
        textAlign={{ base: 'center', xl: 'start' }}
        mb={{ base: '20px', xl: '0px' }}
        fontSize="sm"
      >
        &copy; {new Date().getFullYear()} All rights reserved -
        <Link
          color={linkColor}
          href="https://resonant-piroshki-dcb9ff.netlify.app/"
          target="_blank"
          fontWeight="semibold"
          ms="6px"
        >
          DelExpress shipping operations platform
        </Link>
      </Text>
    </Flex>
  )
}
