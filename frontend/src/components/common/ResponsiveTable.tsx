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
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  hideOnMobile?: boolean;
  width?: string | number;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  onRowClick,
  loading,
  emptyMessage = 'No data available'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    // Mobile Card View
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary" textAlign="center">
                {emptyMessage}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          data.map((row, index) => (
            <Card 
              key={index} 
              sx={{ 
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': onRowClick ? { boxShadow: 3 } : {}
              }}
              onClick={() => onRowClick?.(row)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {columns
                  .filter(col => !col.hideOnMobile)
                  .map((column) => (
                    <Box key={column.key} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                        {column.label}:
                      </Typography>
                      <Typography variant="body2" sx={{ textAlign: 'right', ml: 1 }}>
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </Typography>
                    </Box>
                  ))}
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    );
  }

  // Desktop/Tablet Table View
  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: isTablet ? 600 : 750 }} size={isTablet ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell 
                key={column.key}
                sx={{ 
                  fontWeight: 'bold',
                  width: column.width,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': onRowClick ? { backgroundColor: 'action.hover' } : {},
                  '& td': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ResponsiveTable;