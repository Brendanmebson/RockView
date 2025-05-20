import React from 'react';
import { Grid } from '@mui/material';
import { GridProps } from '@mui/material/Grid';

// Create a custom GridItem component that works with the new Grid API
const GridItem: React.FC<GridProps> = (props) => {
  return <Grid {...props} />;
};

export default GridItem;