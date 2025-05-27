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
  return (
    <div>
      <h4 style={{ marginBottom: '10px' }}>{title}</h4>
      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// CITH Centre Level Charts (Basic)
export const SimpleAttendanceChart = ({ data }: { data: any[] }) => {
  return (
    <ChartContainer title="Attendance Trends">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total" name="Total Attendance" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ChartContainer>
  );
};

export const SimpleOfferingChart = ({ data }: { data: any[] }) => {
  return (
    <ChartContainer title="Offering History">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" name="Offering Amount" fill="#82ca9d" />
      </BarChart>
    </ChartContainer>
  );
};

export const SimpleDemographicsChart = ({ data }: { data: any[] }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <ChartContainer title="Attendance Demographics">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ChartContainer>
  );
};

// Area Supervisor Level Charts (Intermediate)
export const DetailedAttendanceChart = ({ data }: { data: any[] }) => {
  return (
    <ChartContainer title="Detailed Attendance Breakdown">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="male" name="Male" stroke="#8884d8" />
        <Line type="monotone" dataKey="female" name="Female" stroke="#82ca9d" />
        <Line type="monotone" dataKey="children" name="Children" stroke="#ffc658" />
        <Line type="monotone" dataKey="total" name="Total" stroke="#ff7300" strokeWidth={2} />
      </LineChart>
    </ChartContainer>
  );
};

export const CentreComparisonChart = ({ data }: { data: any[] }) => {
  return (
    <ChartContainer title="Centre Performance Comparison">
      <RadarChart outerRadius={90} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
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
  return (
    <ChartContainer title="First Timer Conversion Funnel">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis />
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
  return (
    <ChartContainer title="Area Performance Comparison">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
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
  return (
    <ChartContainer title="District Growth Metrics">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
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
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];
  
  return (
    <ChartContainer title="Conversion Rate Analysis">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" />
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
  return (
    <ChartContainer title="Centre Performance Analysis" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="attendance" name="Attendance" unit=" people" />
        <YAxis type="number" dataKey="offerings" name="Offerings" unit=" ₦" />
        <ZAxis type="number" dataKey="firstTimers" range={[40, 160]} name="First Timers" />
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
  return (
    <ChartContainer title="District Performance Comparison" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
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
        {depth === 1 && width > 50 && height > 20 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 7}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
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