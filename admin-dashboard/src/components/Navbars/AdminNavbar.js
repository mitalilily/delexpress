import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Link,
  useColorModeValue,
} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import AdminNavbarLinks from './AdminNavbarLinks'

export default function AdminNavbar(props) {
  const [scrolled, setScrolled] = useState(false)
  const { variant, children, fixed, secondary, brandText, onOpen, sidebarWidth = 275, ...rest } = props

  let mainText = useColorModeValue('gray.800', 'gray.100')
  let secondaryText = useColorModeValue('gray.500', 'gray.400')
  let navbarPosition = 'absolute'
  let navbarShadow = 'none'
  let navbarBg = 'none'
  let navbarBorder = 'transparent'
  let secondaryMargin = '0px'
  let paddingX = '18px'

  const fixedNavbarShadow = useColorModeValue(
    '0 14px 34px rgba(36, 9, 20, 0.12)',
    '0 14px 36px rgba(0, 0, 0, 0.42)',
  )
  const fixedNavbarBg = useColorModeValue(
    'linear-gradient(110deg, rgba(255,253,249,0.94) 0%, rgba(247,242,237,0.92) 100%)',
    'linear-gradient(110deg, rgba(36,9,20,0.94) 0%, rgba(61,17,34,0.92) 100%)',
  )
  const fixedNavbarBorder = useColorModeValue('1px solid rgba(138, 31, 67, 0.14)', '1px solid rgba(228, 138, 165, 0.22)')

  if (fixed === true && scrolled === true) {
    navbarPosition = 'fixed'
    navbarShadow = fixedNavbarShadow
    navbarBg = fixedNavbarBg
    navbarBorder = fixedNavbarBorder
  }

  if (secondary) {
    navbarPosition = 'absolute'
    mainText = 'white'
    secondaryText = 'whiteAlpha.700'
    secondaryMargin = '22px'
    paddingX = '30px'
  }

  useEffect(() => {
    const changeNavbar = () => {
      setScrolled(window.scrollY > 4)
    }
    window.addEventListener('scroll', changeNavbar)
    return () => {
      window.removeEventListener('scroll', changeNavbar)
    }
  }, [])

  return (
    <Flex
      position={navbarPosition}
      boxShadow={navbarShadow}
      bg={navbarBg}
      borderColor={navbarBorder}
      backdropFilter={navbarBg === 'none' ? 'none' : 'blur(14px)'}
      borderWidth="1px"
      borderStyle="solid"
      transition="all 0.3s ease"
      alignItems={{ xl: 'center' }}
      borderRadius="18px"
      display="flex"
      minH="76px"
      justifyContent={{ xl: 'center' }}
      mx="auto"
      mt={secondaryMargin}
      left={document.documentElement.dir === 'rtl' ? '20px' : ''}
      right={document.documentElement.dir === 'rtl' ? '' : '20px'}
      px={{ sm: paddingX, md: '26px' }}
      pt="12px"
      pb="12px"
      top="18px"
      w={{
        sm: 'calc(100vw - 20px)',
        xl: `calc(100vw - ${sidebarWidth + 56}px)`,
      }}
    >
      <Flex w="100%" flexDirection={{ sm: 'column', md: 'row' }} alignItems={{ xl: 'center' }} gap={{ sm: 2, md: 0 }}>
        <Box mb={{ sm: '4px', md: '0px' }} display="flex" alignItems="center" gap="14px">
          <Box
            as="img"
            src="/delexpress-logo.svg"
            alt="DelExpress"
            h="34px"
            w="134px"
            objectFit="contain"
            display={{ base: 'none', md: 'block' }}
            borderRadius="10px"
            p="4px"
            bg={useColorModeValue('rgba(138, 31, 67, 0.06)', 'rgba(228, 138, 165, 0.16)')}
          />

          <Box>
            <Breadcrumb separator="/" spacing="8px" mb="3px">
              <BreadcrumbItem>
                <BreadcrumbLink href="#" color={secondaryText} fontSize="xs" fontWeight="600" _hover={{ color: 'secondary.500', textDecoration: 'none' }}>
                  DelExpress
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" color={mainText} fontSize="xs" fontWeight="700" _hover={{ color: 'secondary.500', textDecoration: 'none' }}>
                  {brandText}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Link
              color={mainText}
              href="#"
              bg="inherit"
              borderRadius="inherit"
              fontWeight="800"
              fontSize={{ base: 'lg', md: 'xl' }}
              letterSpacing="-0.01em"
              _hover={{ color: 'secondary.500', textDecoration: 'none' }}
              _active={{ bg: 'inherit', transform: 'none', borderColor: 'transparent' }}
              _focus={{ boxShadow: 'none' }}
            >
              {brandText}
            </Link>
          </Box>
        </Box>

        <Box ms="auto" w={{ sm: '100%', md: 'unset' }}>
          <AdminNavbarLinks onOpen={onOpen} logoText={props.logoText} secondary={secondary} fixed={fixed} />
        </Box>
      </Flex>
    </Flex>
  )
}

AdminNavbar.propTypes = {
  brandText: PropTypes.string,
  variant: PropTypes.string,
  secondary: PropTypes.bool,
  fixed: PropTypes.bool,
  onOpen: PropTypes.func,
  sidebarWidth: PropTypes.number,
}
