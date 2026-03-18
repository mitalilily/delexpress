import { Box, Button, Flex, HStack, Link, Text, useColorModeValue } from '@chakra-ui/react'
import { DocumentIcon, HomeIcon, PersonIcon, RocketIcon } from 'components/Icons/Icons'
import SidebarResponsive from 'components/Sidebar/SidebarResponsive'
import PropTypes from 'prop-types'
import React from 'react'
import { NavLink } from 'react-router-dom'
import routes from 'routes.js'

export default function AuthNavbar(props) {
  const { logoText, secondary, ...rest } = props

  const navbarIcon = secondary ? 'white' : useColorModeValue('gray.700', 'gray.200')
  const mainText = secondary ? 'white' : useColorModeValue('gray.800', 'gray.100')
  const navbarBg = secondary
    ? 'none'
    : useColorModeValue(
        'linear-gradient(110deg, rgba(255, 253, 249, 0.94) 0%, rgba(247, 242, 237, 0.92) 100%)',
        'linear-gradient(110deg, rgba(36, 9, 20, 0.94) 0%, rgba(61, 17, 34, 0.92) 100%)',
      )
  const navbarBorder = secondary
    ? 'none'
    : useColorModeValue('1px solid rgba(138, 31, 67, 0.14)', '1px solid rgba(228, 138, 165, 0.22)')
  const navbarShadow = secondary
    ? 'none'
    : useColorModeValue('0 14px 36px rgba(36, 9, 20, 0.12)', '0 14px 36px rgba(0, 0, 0, 0.42)')

  const brand = (
    <Link href={`${process.env.PUBLIC_URL}/#/`} display="flex" lineHeight="100%" fontWeight="700" justifyContent="center" alignItems="center" color={mainText}>
      <Box as="img" src="/delexpress-logo.svg" alt="DelExpress" h="34px" w="140px" objectFit="contain" me="12px" />
      <Text fontSize="xs" mt="1px" letterSpacing="0.12em" textTransform="uppercase" color={secondary ? 'whiteAlpha.700' : 'gray.500'}>
        Shipping platform
      </Text>
    </Link>
  )

  const linksAuth = (
    <HStack display={{ sm: 'none', lg: 'flex' }}>
      <NavLink to="/admin/dashboard">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<HomeIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Control Center</Text>
        </Button>
      </NavLink>
      <NavLink to="/admin/profile">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<PersonIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Team Profile</Text>
        </Button>
      </NavLink>
      <NavLink to="/auth/signup">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<RocketIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Start Setup</Text>
        </Button>
      </NavLink>
      <NavLink to="/auth/signin">
        <Button fontSize="sm" px="0px" me={{ sm: '2px', md: '14px' }} color={navbarIcon} variant="transparent-with-icon" leftIcon={<DocumentIcon color={navbarIcon} w="12px" h="12px" me="0px" />}>
          <Text>Admin Access</Text>
        </Button>
      </NavLink>
    </HStack>
  )

  return (
    <Flex
      position={secondary ? 'absolute' : 'fixed'}
      top="16px"
      left="50%"
      transform="translate(-50%, 0px)"
      background={navbarBg}
      border={navbarBorder}
      boxShadow={navbarShadow}
      backdropFilter={secondary ? 'none' : 'blur(12px)'}
      borderRadius="16px"
      px="16px"
      py="16px"
      mx="auto"
      width="1100px"
      maxW="92%"
      alignItems="center"
    >
      <Flex w="100%" justifyContent={{ sm: 'start', lg: 'space-between' }}>
        {brand}
        <Box ms={{ base: 'auto', lg: '0px' }} display={{ base: 'flex', lg: 'none' }}>
          <SidebarResponsive logoText={logoText || 'DelExpress'} secondary={secondary} routes={routes} {...rest} />
        </Box>
        {linksAuth}
        <Link href="/auth/signin">
          <Button
            bg="brand.500"
            color="white"
            fontSize="xs"
            borderRadius="999px"
            px="18px"
            display={{ sm: 'none', lg: 'flex' }}
            _hover={{ bg: 'brand.600' }}
          >
            Admin Access
          </Button>
        </Link>
      </Flex>
    </Flex>
  )
}

AuthNavbar.propTypes = {
  color: PropTypes.oneOf(['primary', 'info', 'success', 'warning', 'danger']),
  brandText: PropTypes.string,
}
