import { SearchIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
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
import { useRef } from 'react'
import routes from 'routes.js'
import { useAuthStore } from 'store/useAuthStore'
import NotificationMenu from './NotificationMenu'

export default function HeaderLinks({ variant, children, fixed, secondary, onOpen, ...rest }) {
  const settingsRef = useRef()
  const { isLoggedIn, logout } = useAuthStore()
  const inputBg = useColorModeValue('rgba(255, 255, 255, 0.74)', 'rgba(36, 9, 20, 0.72)')
  const inputBorder = useColorModeValue('rgba(138, 31, 67, 0.16)', 'rgba(228, 138, 165, 0.22)')
  const hoverBg = useColorModeValue('rgba(138, 31, 67, 0.08)', 'rgba(255, 255, 255, 0.08)')
  const mainTextColor = useColorModeValue('gray.700', 'gray.100')
  const navbarIconColor = useColorModeValue('gray.600', 'gray.200')
  const searchIconColor = useColorModeValue('gray.500', 'gray.400')
  const placeholder = useColorModeValue('gray.400', 'gray.500')

  const styles = {
    accent: '#8A1F43',
    inputBg,
    inputBorder,
    hoverBg,
    mainText: secondary ? 'white' : mainTextColor,
    navbarIcon: secondary ? 'white' : navbarIconColor,
    searchIcon: secondary ? 'whiteAlpha.700' : searchIconColor,
    placeholder,
  }

  return (
    <Flex pe={{ sm: '0px', md: '8px' }} w={{ sm: '100%', md: 'auto' }} align="center" gap="2">
      <InputGroup
        bg={styles.inputBg}
        borderRadius="12px"
        w={{ sm: '150px', md: '260px' }}
        me={{ sm: 'auto', md: '8px' }}
        borderWidth="1px"
        borderColor={styles.inputBorder}
        transition="all 0.2s ease"
        _focusWithin={{
          borderColor: styles.accent,
          boxShadow: '0 0 0 3px rgba(138, 31, 67, 0.12)',
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
          borderRadius="inherit"
          _placeholder={{ color: styles.placeholder }}
          border="none"
          _focus={{ border: 'none' }}
          fontWeight="500"
        />
      </InputGroup>

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
                    borderColor: 'rgba(138, 31, 67, 0.18)',
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
                      You will leave the DelExpress admin workspace.
                    </Text>
                  </Box>
                  <Flex justify="flex-end" gap="8px">
                    <Button size="sm" variant="ghost" onClick={onClose} borderRadius="10px" _hover={{ bg: styles.hoverBg }}>
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

      <SidebarResponsive logoText={rest.logoText || 'DelExpress'} secondary={secondary} routes={routes} {...rest} />

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
          borderColor: 'rgba(138, 31, 67, 0.18)',
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
