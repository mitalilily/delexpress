import type { JSX } from '@emotion/react/jsx-runtime'
import {
  alpha,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useEffect, useRef } from 'react'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'
import CustomCheckbox from '../inputs/CustomCheckbox'

const BRAND_NAVY = '#0D3B8E'
const BRAND_ORANGE = '#FF7A00'
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_ORANGE} 100%)`

export interface Column<T> {
  id: keyof T
  label_desc?: string
  label: JSX.Element | string
  align?: 'right' | 'left' | 'center'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode
  minWidth?: number
  hiddenOnMobile?: boolean
  truncate?: boolean
  sticky?: 'left' | 'right'
  stickyOffset?: number
  backgroundColor?: string
}

export interface DataTableProps<T extends { id: string | number }> {
  rows: T[]
  columns: Column<T>[]
  title?: string
  subTitle?: string
  maxHeight?: number
  pagination?: boolean
  selectable?: boolean
  onSelectRows?: (ids: Array<T['id']>) => void
  selectedRowIds?: Array<T['id']>
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
  bgOverlayImg?: string
  renderExpandedRow?: (row: T) => React.ReactNode
  expandable?: boolean

  currentPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  totalCount?: number
  onRowClick?: (row: T) => void
  selectionResetToken?: number | string
}

export default function DataTable<T extends { id: string | number }>(props: DataTableProps<T>) {
  const {
    rows,
    columns,
    title,
    subTitle,
    maxHeight = 500,
    pagination = false,
    selectable = false,
    onSelectRows,
    selectedRowIds,
    rowsPerPageOptions = [5, 10, 25],
    defaultRowsPerPage = 10,
    bgOverlayImg,
    renderExpandedRow,
    expandable,
    currentPage,
    onPageChange,
    onRowsPerPageChange,
    totalCount,
    onRowClick,
    selectionResetToken,
  } = props

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [localPage, setLocalPage] = React.useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = React.useState(defaultRowsPerPage)

  const [selectedIds, setSelectedIds] = React.useState<Array<T['id']>>([])
  const [expandedRowId, setExpandedRowId] = React.useState<T['id'] | null>(null)

  const expandedRef = useRef<HTMLDivElement | null>(null)

  const page = currentPage ?? localPage
  const rowsPerPage = localRowsPerPage
  const paginationPage = currentPage !== undefined ? Math.max(page - 1, 0) : page

  const handleChangePage = (_: unknown, newPage: number) => {
    if (onPageChange) onPageChange(newPage + 1)
    else setLocalPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = +event.target.value
    if (onRowsPerPageChange) onRowsPerPageChange(newRowsPerPage)
    else {
      setLocalRowsPerPage(newRowsPerPage)
      setLocalPage(0)
    }
  }

  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))

  const handleSelect = (id: T['id']) => {
    const selected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id]
    setSelectedIds(selected)
    onSelectRows?.(selected)
  }

  const handleSelectAll = (checked: boolean) => {
    const allIds = checked ? rows.map((r) => r.id) : []
    setSelectedIds(allIds)
    onSelectRows?.(allIds)
  }

  useEffect(() => {
    if (!selectedRowIds) return
    setSelectedIds(selectedRowIds)
  }, [selectedRowIds])

  useEffect(() => {
    setSelectedIds((currentSelectedIds) => {
      const visibleIds = new Set(rows.map((row) => row.id))
      const nextSelectedIds = currentSelectedIds.filter((id) => visibleIds.has(id))

      const isSameSelection =
        nextSelectedIds.length === currentSelectedIds.length &&
        nextSelectedIds.every((id, index) => id === currentSelectedIds[index])

      if (!isSameSelection) {
        onSelectRows?.(nextSelectedIds)
        return nextSelectedIds
      }

      return currentSelectedIds
    })
  }, [rows])

  useEffect(() => {
    if (selectionResetToken === undefined) return
    setSelectedIds([])
    onSelectRows?.([])
  }, [selectionResetToken])

  const toggleExpand = (id: T['id']) => {
    const isExpanding = id !== expandedRowId
    setExpandedRowId(isExpanding ? id : null)
    if (isExpanding && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 160)
    }
  }

  return (
    <CardContent
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        background: `
          radial-gradient(560px 180px at 0% 0%, ${alpha(BRAND_ORANGE, 0.07)} 0%, transparent 75%),
          radial-gradient(560px 180px at 100% 0%, ${alpha(BRAND_NAVY, 0.09)} 0%, transparent 75%),
          #ffffff
        `,
        border: `1px solid ${alpha(BRAND_NAVY, 0.16)}`,
        borderRadius: 3,
        boxShadow: '0 8px 20px rgba(13, 59, 142, 0.08)',
      }}
    >
      {bgOverlayImg && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgOverlayImg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.08,
            zIndex: 1,
          }}
        />
      )}

      <Box sx={{ position: 'relative', zIndex: 2, p: { xs: 1.5, sm: 2 } }}>
        {(title || subTitle || pagination) && (
          <Stack
            mb={2}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              {title && (
                <Typography
                  fontWeight={800}
                  fontSize={{ xs: '17px', sm: '19px' }}
                  sx={{
                    background: BRAND_GRADIENT,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {title}
                </Typography>
              )}
              {subTitle && (
                <Typography fontSize="13px" sx={{ color: '#5f769b', mt: 0.5 }}>
                  {subTitle}
                </Typography>
              )}
            </Box>

            {pagination && totalCount !== undefined && (
              <TablePagination
                component="div"
                count={totalCount}
                page={paginationPage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  color: BRAND_NAVY,
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '13px',
                    color: '#6b82a8',
                  },
                  '& .MuiTablePagination-select': {
                    color: BRAND_NAVY,
                  },
                  '& .MuiTablePagination-actions button': {
                    color: BRAND_NAVY,
                    '&:hover': {
                      backgroundColor: alpha(BRAND_NAVY, 0.08),
                    },
                  },
                }}
              />
            )}
          </Stack>
        )}

        {rows.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 280, py: 4 }}>
            <Box
              component="img"
              src="/images/empty-files.png"
              alt="No data"
              sx={{ width: 260, opacity: 0.75 }}
            />
            <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600, color: '#5f769b' }}>
              No records to display
            </Typography>
          </Stack>
        ) : isMobile ? (
          <Stack spacing={1.6}>
            {selectable && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 0.5,
                  py: 0.25,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CustomCheckbox
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Typography fontSize="12px" fontWeight={700} sx={{ color: BRAND_NAVY }}>
                    Select all on this page
                  </Typography>
                </Stack>
                <Typography fontSize="12px" sx={{ color: '#5f769b' }}>
                  {selectedIds.length} selected
                </Typography>
              </Stack>
            )}
            {rows.map((row) => {
              const isExpanded = expandedRowId === row.id
              return (
                <Card
                  key={row.id}
                  variant="outlined"
                  sx={{
                    background: '#FFFFFF',
                    border: `1px solid ${alpha(BRAND_NAVY, 0.14)}`,
                    borderRadius: 2.5,
                    px: 1.6,
                    py: 1.1,
                    boxShadow: `0 2px 8px ${alpha(BRAND_NAVY, 0.06)}`,
                  }}
                >
                  <CardContent sx={{ px: 0, py: 0.5 }}>
                    <Stack spacing={1.35}>
                      {selectable && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CustomCheckbox
                              checked={selectedIds.includes(row.id)}
                              onChange={() => handleSelect(row.id)}
                            />
                            <Typography fontSize="12px" fontWeight={700} sx={{ color: BRAND_NAVY }}>
                              Select order
                            </Typography>
                          </Stack>
                        </Stack>
                      )}
                      {columns.map((col) => {
                        if (col.hiddenOnMobile) return null

                        const value = col.render ? col.render(row[col.id], row) : row[col.id]
                        return (
                          <Box key={col.id as string}>
                            <Typography fontSize="11px" fontWeight={700} sx={{ color: BRAND_NAVY }}>
                              {col.label}
                            </Typography>
                            {col?.label_desc ? (
                              <Typography fontSize="9px" fontWeight={500} sx={{ color: '#6b82a8' }}>
                                {col.label_desc}
                              </Typography>
                            ) : null}
                            <Typography fontSize="13px" sx={{ color: '#1f3559', mt: 0.4 }}>
                              {React.isValidElement(value)
                                ? value
                                : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                            </Typography>
                            <Divider sx={{ mt: 1, borderColor: alpha(BRAND_NAVY, 0.1) }} />
                          </Box>
                        )
                      })}
                    </Stack>

                    {renderExpandedRow && (
                      <IconButton
                        size="small"
                        onClick={() => toggleExpand(row.id)}
                        sx={{ mt: 1, color: BRAND_NAVY, '&:hover': { backgroundColor: alpha(BRAND_NAVY, 0.08) } }}
                      >
                        {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                      </IconButton>
                    )}

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box ref={expandedRef} mt={1}>
                        {renderExpandedRow?.(row)}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto', borderRadius: '14px' }}>
            <TableContainer
              component={Paper}
              sx={{
                background: '#FFFFFF',
                border: `1px solid ${alpha(BRAND_NAVY, 0.14)}`,
                minWidth: '100%',
                maxHeight,
                boxShadow: `0 2px 12px ${alpha(BRAND_NAVY, 0.06)}`,
                borderRadius: 2.6,
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {selectable && (
                      <TableCell
                        padding="checkbox"
                        sx={{
                          position: 'sticky',
                          top: 0,
                          backgroundColor: '#f8fbff',
                          borderBottom: `1.5px solid ${alpha(BRAND_NAVY, 0.2)}`,
                          zIndex: theme.zIndex.appBar + 1,
                        }}
                      >
                        <CustomCheckbox
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          color="primary"
                        />
                      </TableCell>
                    )}

                    {columns.map((col) =>
                      col.hiddenOnMobile && isMobile ? null : (
                        <TableCell
                          key={col.id as string}
                          align={col.align ?? 'left'}
                          sx={{
                            position: col.sticky ? 'sticky' : 'sticky',
                            top: 0,
                            backgroundColor: col.backgroundColor || '#f8fbff',
                            color: BRAND_NAVY,
                            minWidth: col.minWidth || 100,
                            fontWeight: 800,
                            fontSize: '12px',
                            zIndex: col.sticky ? theme.zIndex.appBar + 3 : theme.zIndex.appBar + 1,
                            borderBottom: `1.5px solid ${alpha(BRAND_NAVY, 0.2)}`,
                            ...(col.sticky === 'right'
                              ? {
                                  right: col.stickyOffset ?? 0,
                                  boxShadow:
                                    col.stickyOffset === 0
                                      ? `-6px 0 10px ${alpha(BRAND_NAVY, 0.08)}`
                                      : undefined,
                                }
                              : {}),
                            ...(col.sticky === 'left'
                              ? {
                                  left: col.stickyOffset ?? 0,
                                  boxShadow: `6px 0 10px ${alpha(BRAND_NAVY, 0.08)}`,
                                }
                              : {}),
                          }}
                        >
                          {col.label}
                          {col?.label_desc ? (
                            <Typography fontSize="10px" fontWeight={600} sx={{ color: '#6b82a8' }}>
                              {col.label_desc}
                            </Typography>
                          ) : null}
                        </TableCell>
                      ),
                    )}

                    {expandable && renderExpandedRow && (
                      <TableCell
                        sx={{
                          position: 'sticky',
                          top: 0,
                          backgroundColor: '#f8fbff',
                          borderBottom: `1.5px solid ${alpha(BRAND_NAVY, 0.2)}`,
                          width: 40,
                          zIndex: theme.zIndex.appBar + 1,
                        }}
                      />
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row) => {
                    const isExpanded = expandedRowId === row.id
                    return (
                      <React.Fragment key={row.id}>
                        <TableRow
                          hover={!!onRowClick}
                          onClick={onRowClick ? () => onRowClick(row) : undefined}
                          sx={{
                            backgroundColor: '#FFFFFF',
                            borderBottom: `1px solid ${alpha(BRAND_NAVY, 0.08)}`,
                            transition: 'background-color .18s ease',
                            '&:hover': onRowClick
                              ? {
                                  backgroundColor: alpha(BRAND_NAVY, 0.05),
                                  cursor: 'pointer',
                                }
                              : undefined,
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          {selectable && (
                            <TableCell padding="checkbox">
                              <CustomCheckbox
                                checked={selectedIds.includes(row.id)}
                                onChange={() => handleSelect(row.id)}
                                sx={{ color: BRAND_NAVY }}
                              />
                            </TableCell>
                          )}

                          {columns.map((col) => {
                            if (col.hiddenOnMobile && isMobile) return null
                            const value = row[col.id]
                            const cellContent = col.render ? col.render(value, row) : (value as React.ReactNode)
                            const shouldTruncate = col.truncate !== false

                            let tooltipTitle: string | undefined
                            if (shouldTruncate && !React.isValidElement(cellContent)) {
                              if (value !== null && value !== undefined && typeof value !== 'object') {
                                tooltipTitle = String(value)
                              }
                            }

                            return (
                              <TableCell
                                key={col.id as string}
                                align={col.align ?? 'left'}
                                sx={{
                                  position: col.sticky ? 'sticky' : 'static',
                                  color: '#1f3559',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  whiteSpace: shouldTruncate ? 'nowrap' : 'normal',
                                  overflow: shouldTruncate ? 'hidden' : 'visible',
                                  textOverflow: shouldTruncate ? 'ellipsis' : 'clip',
                                  maxWidth: shouldTruncate ? 220 : 'none',
                                  py: 1.45,
                                  px: 2,
                                  backgroundColor: col.sticky ? '#FFFFFF' : undefined,
                                  zIndex: col.sticky ? 2 : 1,
                                  ...(col.sticky === 'right'
                                    ? {
                                        right: col.stickyOffset ?? 0,
                                        boxShadow:
                                          col.stickyOffset === 0
                                            ? `-6px 0 10px ${alpha(BRAND_NAVY, 0.08)}`
                                            : undefined,
                                      }
                                    : {}),
                                  ...(col.sticky === 'left'
                                    ? {
                                        left: col.stickyOffset ?? 0,
                                        boxShadow: `6px 0 10px ${alpha(BRAND_NAVY, 0.08)}`,
                                      }
                                    : {}),
                                }}
                              >
                                {tooltipTitle ? (
                                  <Tooltip title={tooltipTitle} arrow disableInteractive>
                                    <Box component="span">{cellContent}</Box>
                                  </Tooltip>
                                ) : (
                                  <Box component="span">{cellContent}</Box>
                                )}
                              </TableCell>
                            )
                          })}

                          {expandable && renderExpandedRow && (
                            <TableCell sx={{ py: 1.5, px: 2 }}>
                              <IconButton
                                size="small"
                                onClick={() => toggleExpand(row.id)}
                                sx={{ color: BRAND_NAVY, '&:hover': { backgroundColor: alpha(BRAND_NAVY, 0.1) } }}
                              >
                                {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>

                        {expandable && renderExpandedRow && (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length + (selectable ? 2 : 1)}
                              sx={{
                                p: 0,
                                backgroundColor: alpha(BRAND_NAVY, 0.03),
                                borderTop: `1px solid ${alpha(BRAND_NAVY, 0.12)}`,
                              }}
                            >
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box ref={expandedRef} p={2.6} sx={{ backgroundColor: '#FFFFFF' }}>
                                  {renderExpandedRow(row)}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </CardContent>
  )
}
