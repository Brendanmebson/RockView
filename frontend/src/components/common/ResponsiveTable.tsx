// frontend/src/components/common/ResponsiveTable.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function ResponsiveTable<T extends { _id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available'
}: ResponsiveTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="textSecondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  if (isMobile) {
    // Mobile card layout
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((row) => (
          <Card 
            key={row._id} 
            sx={{ 
              cursor: onRowClick ? 'pointer' : 'default',
              '&:hover': onRowClick ? {
                boxShadow: 2,
                transform: 'translateY(-1px)',
              } : {}
            }}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent>
              {columns
                .filter(col => !col.hideOnMobile)
                .map((column) => {
                  const value = typeof column.key === 'string' && column.key in row 
                    ? (row as any)[column.key] 
                    : undefined;
                  const displayValue = column.render 
                    ? column.render(value, row)
                    : value;
                  
                  return (
                    <Box key={String(column.key)} sx={{ mb: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        {column.label}:
                      </Typography>
                      <Typography variant="body2">
                        {displayValue || '—'}
                      </Typography>
                    </Box>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Desktop table layout
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow 
              key={row._id}
              hover={!!onRowClick}
              sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const value = typeof column.key === 'string' && column.key in row 
                  ? (row as any)[column.key] 
                  : undefined;
                const displayValue = column.render 
                  ? column.render(value, row)
                  : value;
                
                return (
                  <TableCell key={String(column.key)}>
                    {displayValue || '—'}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ResponsiveTable;