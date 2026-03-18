import { ChevronDownIcon } from '@chakra-ui/icons'
import { Box, Button, Collapse, Flex, Stack, Text, useColorModeValue } from '@chakra-ui/react'
import React, { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const BRAND_PRIMARY = '#8A1F43'
const BRAND_SECONDARY = '#56C0A5'

const SidebarContent = ({ logoText, routes, sidebarWidth }) => {
  const location = useLocation()
  const [state, setState] = React.useState({})

  const sidebarBg = useColorModeValue('rgba(255, 253, 249, 0.96)', 'rgba(36, 9, 20, 0.94)')
  const sidebarBorder = useColorModeValue('rgba(138, 31, 67, 0.14)', 'rgba(228, 138, 165, 0.24)')
  const sidebarShadow = useColorModeValue('10px 0 32px rgba(36, 9, 20, 0.1)', '10px 0 32px rgba(0, 0, 0, 0.38)')
  const activeBg = useColorModeValue('rgba(138, 31, 67, 0.1)', 'rgba(228, 138, 165, 0.16)')
  const hoverBg = useColorModeValue('rgba(138, 31, 67, 0.06)', 'rgba(255, 255, 255, 0.08)')
  const activeBorder = useColorModeValue('rgba(138, 31, 67, 0.22)', 'rgba(228, 138, 165, 0.28)')
  const hoverBorder = useColorModeValue('rgba(138, 31, 67, 0.14)', 'rgba(228, 138, 165, 0.18)')
  const iconBg = useColorModeValue('rgba(138, 31, 67, 0.06)', 'rgba(255, 255, 255, 0.08)')
  const iconActiveBg = useColorModeValue('rgba(138, 31, 67, 0.14)', 'rgba(228, 138, 165, 0.2)')
  const textColor = useColorModeValue('gray.700', 'gray.100')
  const iconColor = useColorModeValue('gray.500', 'gray.300')
  const dividerColor = useColorModeValue('rgba(138, 31, 67, 0.12)', 'rgba(228, 138, 165, 0.18)')
  const thumbColor = useColorModeValue('rgba(138,31,67,0.3)', 'rgba(228,138,165,0.34)')
  const brandCardBg = useColorModeValue(
    'linear-gradient(120deg, rgba(138, 31, 67, 0.12) 0%, rgba(86, 192, 165, 0.12) 100%)',
    'linear-gradient(120deg, rgba(228, 138, 165, 0.18) 0%, rgba(86, 192, 165, 0.12) 100%)',
  )
  const brandCardBorder = useColorModeValue('rgba(138, 31, 67, 0.16)', 'rgba(228, 138, 165, 0.28)')
  const brandText = useColorModeValue('gray.800', 'gray.100')
  const collapsedLogoBg = useColorModeValue('rgba(138, 31, 67, 0.08)', 'rgba(228, 138, 165, 0.18)')

  const activeRoute = (routeName) => location.pathname.startsWith(routeName)

  const toggleCollapse = (key) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    routes.forEach((route) => {
      if (route.category && route.views) {
        const isChildActive = route.views.some((view) =>
          location.pathname.startsWith(view.layout + view.path.split('/:')[0]),
        )
        if (isChildActive) {
          setState((prev) => ({ ...prev, [route.state]: true }))
        }
      }
    })
  }, [location.pathname, routes])

  const collapsed = sidebarWidth <= 160
  const compact = sidebarWidth > 160 && sidebarWidth < 220
  const textSize = compact ? 'sm' : 'sm'
  const showText = !collapsed

  const renderLinkButton = (prop, isActive) => (
    <Button
      justifyContent={collapsed ? 'center' : 'flex-start'}
      w="100%"
      bg={isActive ? activeBg : 'transparent'}
      borderRadius="12px"
      mb="1"
      px={collapsed ? '2' : '3'}
      py="10px"
      h="auto"
      border="1px solid"
      borderColor={isActive ? activeBorder : 'transparent'}
      _hover={{
        bg: hoverBg,
        transform: 'translateX(2px)',
        borderColor: hoverBorder,
      }}
      _active={{ transform: 'scale(0.98)' }}
      transition="all 0.2s ease"
    >
      <Flex align="center" gap="10px" w="100%">
        {prop.icon && (
          <Box
            p="6px"
            borderRadius="10px"
            bg={isActive ? iconActiveBg : iconBg}
            color={isActive ? BRAND_PRIMARY : iconColor}
            fontSize={collapsed ? '20px' : '18px'}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {prop.icon}
          </Box>
        )}
        {showText && (
          <Text color={isActive ? BRAND_PRIMARY : textColor} fontWeight={isActive ? '700' : '600'} fontSize={textSize}>
            {prop.name}
          </Text>
        )}
      </Flex>
    </Button>
  )

  const renderLinks = (items) =>
    items
      .filter((prop) => prop.show !== false)
      .map((prop) => {
        if (prop.redirect) return null

        if (prop.category) {
          const isChildActive = prop.views.some((view) =>
            location.pathname.startsWith(view.layout + view.path.split('/:')[0]),
          )

          return (
            <Box key={prop.name} mb="1">
              <Button
                onClick={() => toggleCollapse(prop.state)}
                justifyContent={collapsed ? 'center' : 'space-between'}
                w="100%"
                bg={isChildActive ? activeBg : 'transparent'}
                borderRadius="12px"
                mb="1"
                px={collapsed ? '2' : '3'}
                py="10px"
                h="auto"
                border="1px solid"
                borderColor={isChildActive ? activeBorder : 'transparent'}
                _hover={{
                  bg: hoverBg,
                  transform: 'translateX(2px)',
                }}
                transition="all 0.2s ease"
              >
                <Flex align="center" gap="10px" w="100%">
                  <Box
                    p="6px"
                    borderRadius="10px"
                    bg={isChildActive ? iconActiveBg : iconBg}
                    color={isChildActive ? BRAND_PRIMARY : iconColor}
                    fontSize={collapsed ? '20px' : '18px'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {prop.icon}
                  </Box>
                  {showText && (
                    <Text
                      color={isChildActive ? BRAND_PRIMARY : textColor}
                      fontWeight={isChildActive ? '700' : '600'}
                      fontSize={textSize}
                      textAlign="left"
                      flex="1"
                    >
                      {prop.name}
                    </Text>
                  )}
                </Flex>
                {showText && (
                  <Box
                    transition="transform 0.2s"
                    transform={state[prop.state] ? 'rotate(180deg)' : 'rotate(0deg)'}
                    color={isChildActive ? BRAND_PRIMARY : iconColor}
                  >
                    <ChevronDownIcon />
                  </Box>
                )}
              </Button>
              <Collapse in={state[prop.state]} animateOpacity>
                <Box pl={showText ? '12px' : '0'} pr={showText ? '8px' : '0'} mt="1">
                  <Stack spacing="1">{renderLinks(prop.views)}</Stack>
                </Box>
              </Collapse>
            </Box>
          )
        }

        const isActive = activeRoute(prop.layout + prop.path)
        return (
          <NavLink to={prop.layout + prop.path} key={prop.name}>
            {renderLinkButton(prop, isActive)}
          </NavLink>
        )
      })

  return (
    <Box
      pt="20px"
      pb="20px"
      h="100vh"
      w={`${sidebarWidth}px`}
      bg={sidebarBg}
      borderRight="1px solid"
      borderColor={sidebarBorder}
      boxShadow={sidebarShadow}
      position="fixed"
      left="0"
      top="0"
      transition="width 0.25s ease"
      overflowY="auto"
      overflowX="hidden"
      pr="2"
      css={{
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': {
          background: thumbColor,
          borderRadius: '4px',
        },
      }}
    >
      <Box mb="20px" px="14px" textAlign="center" transition="all 0.3s ease">
        {showText ? (
          <Flex
            align="center"
            justify="center"
            gap="10px"
            px="12px"
            py="10px"
            borderRadius="14px"
            bg={brandCardBg}
            border="1px solid"
            borderColor={brandCardBorder}
          >
            <Box as="img" src="/delexpress-logo.svg" alt="DelExpress" h="34px" w="132px" objectFit="contain" />
            <Box textAlign="left">
              <Text fontWeight="800" fontSize="15px" color={brandText}>
                {logoText}
              </Text>
              <Text fontSize="10px" fontWeight="700" letterSpacing="1px" textTransform="uppercase" color={BRAND_SECONDARY}>
                Shipping control
              </Text>
            </Box>
          </Flex>
        ) : (
          <Box
            as="img"
            src="/delexpress-logo.svg"
            alt="DelExpress"
            h="32px"
            w="48px"
            mx="auto"
            objectFit="contain"
            p="6px"
            borderRadius="10px"
            bg={collapsedLogoBg}
          />
        )}
      </Box>

      <Box h="1px" bg={dividerColor} mx="14px" mb="14px" />

      <Stack direction="column" spacing="0.5" px="10px">
        {renderLinks(routes)}
      </Stack>
    </Box>
  )
}

export default SidebarContent
