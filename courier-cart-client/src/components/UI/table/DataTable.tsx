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

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'
const BRAND_GRADIENT = `linear-gradient(135deg, ${DE_BLUE} 0%, ${DE_AMBER} 100%)`

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

  const handleChangePage = (_: unknown, newPage: number) => {
    if (onPageChange) onPageChange(newPage)
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
          radial-gradient(560px 180px at 0% 0%, ${alpha(DE_AMBER, 0.07)} 0%, transparent 75%),
          radial-gradient(560px 180px at 100% 0%, ${alpha(DE_BLUE, 0.09)} 0%, transparent 75%),
          #ffffff
        `,
        border: `1px solid ${alpha(DE_BLUE, 0.16)}`,
        borderRadius: 1,
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
                page={page - 1}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  color: DE_BLUE,
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '13px',
                    color: '#6b82a8',
                  },
                  '& .MuiTablePagination-select': {
                    color: DE_BLUE,
                  },
                  '& .MuiTablePagination-actions button': {
                    color: DE_BLUE,
                    '&:hover': {
                      backgroundColor: alpha(DE_BLUE, 0.08),
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
                  <Typography fontSize="12px" fontWeight={700} sx={{ color: DE_BLUE }}>
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
                    border: `1px solid ${alpha(DE_BLUE, 0.14)}`,
                    borderRadius: 1,
                    px: 1.6,
                    py: 1.1,
                    boxShadow: `0 2px 8px ${alpha(DE_BLUE, 0.06)}`,
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
                            <Typography fontSize="12px" fontWeight={700} sx={{ color: DE_BLUE }}>
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
                            <Typography fontSize="11px" fontWeight={700} sx={{ color: DE_BLUE }}>
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
                            <Divider sx={{ mt: 1, borderColor: alpha(DE_BLUE, 0.1) }} />
                          </Box>
                        )
                      })}
                    </Stack>

                    {renderExpandedRow && (
                      <IconButton
                        size="small"
                        onClick={() => toggleExpand(row.id)}
                        sx={{ mt: 1, color: DE_BLUE, '&:hover': { backgroundColor: alpha(DE_BLUE, 0.08) } }}
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
                border: `1px solid ${alpha(DE_BLUE, 0.14)}`,
                minWidth: '100%',
                maxHeight,
                boxShadow: `0 2px 12px ${alpha(DE_BLUE, 0.06)}`,
                borderRadius: 1,
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
                          borderBottom: `1.5px solid ${alpha(DE_BLUE, 0.2)}`,
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
                            position: 'sticky',
                            top: 0,
                            backgroundColor: '#f8fbff',
                            color: DE_BLUE,
                            minWidth: col.minWidth || 100,
                            fontWeight: 800,
                            fontSize: '12px',
                            zIndex: theme.zIndex.appBar + 1,
                            borderBottom: `1.5px solid ${alpha(DE_BLUE, 0.2)}`,
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
                          borderBottom: `1.5px solid ${alpha(DE_BLUE, 0.2)}`,
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
                            borderBottom: `1px solid ${alpha(DE_BLUE, 0.08)}`,
                            transition: 'background-color .18s ease',
                            '&:hover': onRowClick
                              ? {
                                  backgroundColor: alpha(DE_BLUE, 0.05),
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
                                sx={{ color: DE_BLUE }}
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
                                  color: '#1f3559',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  whiteSpace: shouldTruncate ? 'nowrap' : 'normal',
                                  overflow: shouldTruncate ? 'hidden' : 'visible',
                                  textOverflow: shouldTruncate ? 'ellipsis' : 'clip',
                                  maxWidth: shouldTruncate ? 220 : 'none',
                                  py: 1.45,
                                  px: 2,
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
                                sx={{ color: DE_BLUE, '&:hover': { backgroundColor: alpha(DE_BLUE, 0.1) } }}
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
                                backgroundColor: alpha(DE_BLUE, 0.03),
                                borderTop: `1px solid ${alpha(DE_BLUE, 0.12)}`,
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
