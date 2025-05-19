import React from 'react';
import { Grid, GridProps } from '@mui/material';

interface GridItemProps extends GridProps {
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

const GridItem: React.FC<GridItemProps> = ({ children, ...props }) => {
  return <Grid {...props as any}>{children}</Grid>;
};

export default GridItem;