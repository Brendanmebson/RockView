// frontend/src/components/common/GridItem.tsx
import React from 'react';
import { Grid, GridProps } from '@mui/material';

interface GridItemProps extends GridProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

const GridItem: React.FC<GridItemProps> = ({ children, ...props }) => {
  return (
    <Grid item {...props}>
      {children}
    </Grid>
  );
};

export default GridItem;