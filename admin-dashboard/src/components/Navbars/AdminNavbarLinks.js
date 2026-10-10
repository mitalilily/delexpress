import { SearchIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { IconLogout } from '@tabler/icons-react'
import { SettingsIcon } from 'components/Icons/Icons'
import SidebarResponsive from 'components/Sidebar/SidebarResponsive'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import routes from 'routes.js'
import { useAuthStore } from 'store/useAuthStore'
import NotificationMenu from './NotificationMenu'
import api from 'services/axios'

export default function HeaderLinks({ variant, children, fixed, secondary, onOpen, ...rest }) {
  const settingsRef = useRef()
  const history = useHistory()
  const searchRef = useRef()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isLoggedIn, logout } = useAuthStore()
  const inputBg = useColorModeValue('rgba(255, 255, 255, 0.74)', 'rgba(36, 9, 20, 0.72)')
  const inputBorder = useColorModeValue('rgba(118, 150, 172, 0.16)', 'rgba(167, 200, 210, 0.22)')
  const hoverBg = useColorModeValue('rgba(118, 150, 172, 0.08)', 'rgba(255, 255, 255, 0.08)')
  const mainTextColor = useColorModeValue('gray.700', 'gray.100')
  const navbarIconColor = useColorModeValue('gray.600', 'gray.200')
  const searchIconColor = useColorModeValue('gray.500', 'gray.400')
  const placeholder = useColorModeValue('gray.400', 'gray.500')

  const styles = {
    accent: '#7696AC',
    inputBg,
    inputBorder,
    hoverBg,
    mainText: secondary ? 'white' : mainTextColor,
    navbarIcon: secondary ? 'white' : navbarIconColor,
    searchIcon: secondary ? 'whiteAlpha.700' : searchIconColor,
    placeholder,
  }

  useEffect(() => {
    const query = search.trim()
    if (query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return undefined
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await api.get('/search/admin-search', { params: { q: query, limit: 20 } })
        if (active) setSearchResults(response.data?.results || [])
      } catch (error) {
        if (active) setSearchResults([])
      } finally {
        if (active) setIsSearching(false)
      }
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [search])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const resultLabel = (result) => {
    const labels = {
      seller: 'Seller',
      order: result.metadata?.type === 'b2b' ? 'B2B Shipment' : 'B2C Shipment',
      invoice: 'Invoice',
      ndr: 'NDR',
      rto: 'RTO',
      weight_discrepancy: 'Weight discrepancy',
    }
    return labels[result.type] || 'Result'
  }

  return (
    <Flex pe={{ sm: '0px', md: '8px' }} w={{ sm: '100%', md: 'auto' }} align="center" gap="2">
      <Box ref={searchRef} position="relative" w={{ sm: '150px', md: '260px' }} me={{ sm: 'auto', md: '8px' }}>
      <InputGroup
        bg={styles.inputBg}
        borderRadius="12px"
        w="100%"
        borderWidth="1px"
        borderColor={styles.inputBorder}
        transition="all 0.2s ease"
        _focusWithin={{
          borderColor: styles.accent,
          boxShadow: '0 0 0 3px rgba(118, 150, 172, 0.12)',
        }}
      >
        <InputLeftElement pointerEvents="none" pl="14px">
          <SearchIcon color={styles.searchIcon} w="16px" h="16px" />
        </InputLeftElement>
        <Input
          fontSize="sm"
          py="10px"
          pl="42px"
          pr="14px"
          color={styles.mainText}
          placeholder="Search shipments, sellers, AWB"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setIsSearchOpen(true)
          }}
          onFocus={() => setIsSearchOpen(true)}
          borderRadius="inherit"
          _placeholder={{ color: styles.placeholder }}
          border="none"
          _focus={{ border: 'none' }}
          fontWeight="500"
        />
      </InputGroup>
      {isSearchOpen && search.trim().length >= 2 && (
        <Box
          position="absolute"
          top="calc(100% + 8px)"
          right={0}
          w={{ base: 'min(360px, calc(100vw - 32px))', md: '420px' }}
          maxH="420px"
          overflowY="auto"
          bg={inputBg}
          border="1px solid"
          borderColor={inputBorder}
          borderRadius="12px"
          boxShadow="0 18px 42px rgba(15, 46, 102, 0.18)"
          zIndex={20}
        >
          {isSearching ? (
            <Text px="14px" py="12px" fontSize="sm" color={searchIconColor}>Searching...</Text>
          ) : searchResults.length ? (
            <List spacing={0}>
              {searchResults.map((result) => (
                <ListItem
                  key={`${result.type}-${result.id}`}
                  px="14px"
                  py="11px"
                  cursor="pointer"
                  borderBottom="1px solid"
                  borderColor={inputBorder}
                  _hover={{ bg: hoverBg }}
                  onClick={() => {
                    setSearch('')
                    setIsSearchOpen(false)
                    history.push(result.link)
                  }}
                >
                  <Text fontSize="xs" color={styles.accent} fontWeight="700" textTransform="uppercase">
                    {resultLabel(result)}
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color={styles.mainText} noOfLines={1}>
                    {result.title}
                  </Text>
                  {result.subtitle && (
                    <Text fontSize="xs" color={searchIconColor} noOfLines={2}>
                      {result.subtitle}
                    </Text>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Text px="14px" py="12px" fontSize="sm" color={searchIconColor}>No matching records</Text>
          )}
        </Box>
      )}
      </Box>

      {isLoggedIn ? (
        <Popover placement="bottom-end" closeOnBlur>
          {({ onClose }) => (
            <>
              <PopoverTrigger>
                <Button
                  px="14px"
                  py="10px"
                  me={{ sm: '2px', md: '8px' }}
                  color={styles.navbarIcon}
                  variant="ghost"
                  leftIcon={<IconLogout size={16} />}
                  borderRadius="12px"
                  borderWidth="1px"
                  borderColor="transparent"
                  fontWeight="600"
                  fontSize="sm"
                  _hover={{
                    bg: styles.hoverBg,
                    color: styles.accent,
                    borderColor: 'rgba(118, 150, 172, 0.18)',
                  }}
                >
                  <Text display={{ sm: 'none', md: 'flex' }}>Logout</Text>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                w="300px"
                p="0"
                borderRadius="14px"
                boxShadow="0 20px 36px rgba(15, 46, 102, 0.2)"
                borderWidth="1px"
                borderColor={styles.inputBorder}
                overflow="hidden"
                bg={styles.inputBg}
              >
                <PopoverArrow />
                <PopoverBody p="16px">
                  <Box mb="14px">
                    <Text fontSize="md" fontWeight="700" color={styles.mainText} mb="2px">
                      Confirm Logout
                    </Text>
                    <Text fontSize="sm" color={styles.searchIcon}>
                      You will leave the ExpressoPro admin workspace.
                    </Text>
                  </Box>
                  <Flex justify="flex-end" gap="8px">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClose}
                      borderRadius="10px"
                      _hover={{ bg: styles.hoverBg }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      bg="red.500"
                      color="white"
                      borderRadius="10px"
                      fontWeight="600"
                      _hover={{ bg: 'red.600' }}
                      onClick={() => {
                        logout()
                        onClose()
                      }}
                    >
                      Logout
                    </Button>
                  </Flex>
                </PopoverBody>
              </PopoverContent>
            </>
          )}
        </Popover>
      ) : null}

      <SidebarResponsive
        logoText={rest.logoText || 'ExpressoPro'}
        secondary={secondary}
        routes={routes}
        {...rest}
      />

      <IconButton
        aria-label="Settings"
        icon={<SettingsIcon w="18px" h="18px" />}
        variant="ghost"
        ms={{ base: '6px', xl: '0px' }}
        me="6px"
        ref={settingsRef}
        onClick={onOpen}
        color={styles.navbarIcon}
        borderRadius="12px"
        w="38px"
        h="38px"
        borderWidth="1px"
        borderColor="transparent"
        _hover={{
          bg: styles.hoverBg,
          color: styles.accent,
          borderColor: 'rgba(118, 150, 172, 0.18)',
        }}
      />

      <NotificationMenu themeStyles={styles} />
    </Flex>
  )
}

HeaderLinks.propTypes = {
  variant: PropTypes.string,
  fixed: PropTypes.bool,
  secondary: PropTypes.bool,
  onOpen: PropTypes.func,
  logoText: PropTypes.string,
}
