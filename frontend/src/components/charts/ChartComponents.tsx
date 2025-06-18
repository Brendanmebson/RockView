// frontend/src/components/charts/ChartComponents.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { Box, useTheme, useMediaQuery } from '@mui/material';

interface ChartContainerProps {
  title: string;
  height?: number;
  children: React.ReactElement;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  height = 300, 
  children 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const responsiveHeight = isMobile ? Math.max(250, height * 0.8) : isTablet ? Math.max(280, height * 0.9) : height;
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box component="h4" sx={{ 
        marginBottom: { xs: 1, sm: 2 }, 
        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
        fontWeight: 500,
        color: 'text.primary',
        m: 0,
        mb: { xs: 1, sm: 2 }
      }}>
        {title}
      </Box>
      <Box sx={{ 
        width: '100%', 
        height: responsiveHeight,
        minHeight: { xs: 250, sm: 280, md: responsiveHeight },
        '& .recharts-wrapper': {
          width: '100% !important',
          height: '100% !important'
        }
      }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

// CITH Centre Level Charts (Basic)
export const SimpleAttendanceChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="Attendance Trends">
      <LineChart data={data} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="week" 
          fontSize={isMobile ? 10 : 12}
          interval={isMobile ? 'preserveStartEnd' : 0}
        />
        <YAxis fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total" name="Total Attendance" stroke="#8884d8" activeDot={{ r: isMobile ? 4 : 8 }} />
      </LineChart>
    </ChartContainer>
  );
};

export const SimpleOfferingChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="Offering History">
      <BarChart data={data} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="week" 
          fontSize={isMobile ? 10 : 12}
          interval={isMobile ? 'preserveStartEnd' : 0}
        />
        <YAxis fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" name="Offering Amount" fill="#82ca9d" />
      </BarChart>
    </ChartContainer>
  );
};

export const SimpleDemographicsChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <ChartContainer title="Attendance Demographics">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={isMobile ? false : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={isMobile ? 60 : 80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        {!isMobile && <Legend />}
      </PieChart>
    </ChartContainer>
  );
};

// Area Supervisor Level Charts (Intermediate)
export const DetailedAttendanceChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="Detailed Attendance Breakdown">
      <LineChart data={data} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="week" 
          fontSize={isMobile ? 10 : 12}
          interval={isMobile ? 'preserveStartEnd' : 0}
        />
        <YAxis fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="male" name="Male" stroke="#8884d8" strokeWidth={isMobile ? 1 : 2} />
        <Line type="monotone" dataKey="female" name="Female" stroke="#82ca9d" strokeWidth={isMobile ? 1 : 2} />
        <Line type="monotone" dataKey="children" name="Children" stroke="#ffc658" strokeWidth={isMobile ? 1 : 2} />
        <Line type="monotone" dataKey="total" name="Total" stroke="#ff7300" strokeWidth={isMobile ? 2 : 3} />
      </LineChart>
    </ChartContainer>
  );
};

export const CentreComparisonChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="Centre Performance Comparison">
      <RadarChart outerRadius={isMobile ? 60 : 90} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
        <PolarRadiusAxis angle={30} domain={[0, 'auto']} fontSize={isMobile ? 8 : 10} />
        <Radar name="Attendance" dataKey="attendance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        <Radar name="Offerings" dataKey="offerings" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
        <Radar name="First Timers" dataKey="firstTimers" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ChartContainer>
  );
};

export const FirstTimerFunnelChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="First Timer Conversion Funnel">
      <AreaChart data={data} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="week" 
          fontSize={isMobile ? 10 : 12}
          interval={isMobile ? 'preserveStartEnd' : 0}
        />
        <YAxis fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="firstTimers" name="First Timers" stackId="1" fill="#8884d8" stroke="#8884d8" />
        <Area type="monotone" dataKey="followedUp" name="Followed Up" stackId="2" fill="#82ca9d" stroke="#82ca9d" />
        <Area type="monotone" dataKey="converted" name="Converted" stackId="3" fill="#ffc658" stroke="#ffc658" />
      </AreaChart>
    </ChartContainer>
  );
};

// District Pastor Level Charts (Advanced)
export const AreaPerformanceChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="Area Performance Comparison">
      <BarChart data={data} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          fontSize={isMobile ? 10 : 12}
          interval={0}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 60 : 30}
        />
        <YAxis fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="attendance" name="Attendance" fill="#8884d8" />
        <Bar dataKey="offerings" name="Offerings" fill="#82ca9d" />
        <Bar dataKey="firstTimers" name="First Timers" fill="#ffc658" />
        <Bar dataKey="centres" name="Centres" fill="#ff7300" />
      </BarChart>
    </ChartContainer>
  );
};

export const DistrictGrowthChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="District Growth Metrics">
      <ComposedChart data={data} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="week" 
          fontSize={isMobile ? 10 : 12}
          interval={isMobile ? 'preserveStartEnd' : 0}
        />
        <YAxis yAxisId="left" fontSize={isMobile ? 10 : 12} />
        <YAxis yAxisId="right" orientation="right" fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="total" name="Total Attendance" fill="#8884d8" />
        <Line yAxisId="right" type="monotone" dataKey="offerings" name="Offerings" stroke="#82ca9d" />
        <Area yAxisId="left" type="monotone" dataKey="firstTimers" name="First Timers" fill="#ffc658" stroke="#ffc658" />
      </ComposedChart>
    </ChartContainer>
  );
};

export const ConversionFunnelChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  
  return (
    <ChartContainer title="Conversion Rate Analysis">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" fontSize={isMobile ? 10 : 12} />
        <YAxis type="category" dataKey="name" fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
};

// Admin Level Charts (Most Complex)
export const CentrePerformanceScatterChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="Centre Performance Analysis" height={400}>
      <ScatterChart margin={{ top: 20, right: isMobile ? 10 : 20, bottom: 20, left: isMobile ? 10 : 20 }}>
        <CartesianGrid />
        <XAxis 
          type="number" 
          dataKey="attendance" 
          name="Attendance" 
          unit=" people" 
          fontSize={isMobile ? 10 : 12}
        />
        <YAxis 
          type="number" 
          dataKey="offerings" 
          name="Offerings" 
          unit=" ₦" 
          fontSize={isMobile ? 10 : 12}
        />
        <ZAxis type="number" dataKey="firstTimers" range={[isMobile ? 20 : 40, isMobile ? 80 : 160]} name="First Timers" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name="Festac District" data={data.filter(d => d.district === 'Festac')} fill="#8884d8" />
        <Scatter name="Ikeja District" data={data.filter(d => d.district === 'Ikeja')} fill="#82ca9d" />
        <Scatter name="Lekki District" data={data.filter(d => d.district === 'Lekki')} fill="#ffc658" />
        <Scatter name="Surulere District" data={data.filter(d => d.district === 'Surulere')} fill="#ff7300" />
      </ScatterChart>
    </ChartContainer>
  );
};

export const DistrictComparisonChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ChartContainer title="District Performance Comparison" height={350}>
      <BarChart data={data} margin={{ top: 5, right: isMobile ? 5 : 30, left: isMobile ? 5 : 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          fontSize={isMobile ? 10 : 12}
          interval={0}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 60 : 30}
        />
        <YAxis fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="attendance" fill="#8884d8" name="Attendance" />
        <Bar dataKey="offerings" fill="#82ca9d" name="Offerings" />
        <Bar dataKey="centres" fill="#ffc658" name="Centres" />
      </BarChart>
    </ChartContainer>
  );
};

export const OrganizationTreemapChart = ({ data }: { data: any[] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const COLORS = ['#8889DD', '#9597E4', '#8DC77B', '#A5D297', '#E2CF45', '#F8C12D'];

  // Custom content function for Treemap
  const renderCustomTreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name } = props;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: depth < 2 
              ? COLORS[Math.floor((index / (root?.children?.length || 1)) * COLORS.length) % COLORS.length]
              : 'rgba(255,255,255,0.3)',
            stroke: '#fff',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {depth === 1 && width > (isMobile ? 30 : 50) && height > (isMobile ? 15 : 20) && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 7}
            textAnchor="middle"
            fill="#fff"
            fontSize={isMobile ? 10 : 12}
          >
            {name}
          </text>
        )}
      </g>
    );
  };

  return (
    <ChartContainer title="Organization Structure Analysis" height={400}>
      <Treemap
        data={data}
        dataKey="size"
        stroke="#fff"
        fill="#8884d8"
        content={renderCustomTreemapContent as any}
      />
    </ChartContainer>
  );
};