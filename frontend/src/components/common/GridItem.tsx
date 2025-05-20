import React from 'react';
import { Grid } from '@mui/material';

interface GridItemProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

const GridItem: React.FC<GridItemProps> = ({ children, ...props }) => {
  return <Grid {...props}>{children}</Grid>;
};

export default GridItem;