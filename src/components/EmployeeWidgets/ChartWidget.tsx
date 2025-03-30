import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, LineChart, PieChart } from '@/components/ui/chart';
import { Employee } from '@/types/employee';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChartWidgetProps {
  employees: Employee[];
  selectedData?: { row: string; col: string; value: any; employeeName?: string };
  visibleData?: {
    employees: Employee[];
    fields: string[];
  };
}

type ChartType = 'bar' | 'line' | 'pie';

export const ChartWidget: React.FC<ChartWidgetProps> = ({ employees, selectedData, visibleData }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedField, setSelectedField] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

  // Get all unique field names that contain numeric values from visible fields
  const numericFields = React.useMemo(() => {
    if (!visibleData?.employees || !visibleData?.fields) return [];
    
    return visibleData.fields.filter(field => 
      visibleData.employees.some(emp => 
        typeof emp.fields[field] === 'number'
      )
    ).sort();
  }, [visibleData]);

  // Set initial field selection if none selected
  useEffect(() => {
    if (numericFields.length > 0 && !selectedField) {
      setSelectedField(numericFields[0]);
    }
  }, [numericFields, selectedField]);

  // Update chart data when field or visible data changes
  useEffect(() => {
    if (!selectedField || !visibleData?.employees) return;

    // Filter out any employees that don't have the selected field
    // or where the field value isn't a number
    const validEmployees = visibleData.employees.filter(emp => 
      emp.fields.hasOwnProperty(selectedField) && 
      typeof emp.fields[selectedField] === 'number'
    );

    // Create chart data from valid employees
    const data = validEmployees.map(emp => ({
      name: emp.name,
      value: Number(emp.fields[selectedField]) || 0
    }));

    // Sort data by value for better visualization
    data.sort((a, b) => b.value - a.value);
    
    setChartData(data);
  }, [selectedField, visibleData]);

  // Update selected field when data is selected in Excel widget
  useEffect(() => {
    if (selectedData?.col && numericFields.includes(selectedData.col)) {
      setSelectedField(selectedData.col);
    }
  }, [selectedData, numericFields]);

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No numeric data available for the selected field
        </div>
      );
    }

    const config = {
      data: chartData,
      index: 'name',
      categories: ['value'],
      colors: ['#2563eb', '#3b82f6', '#60a5fa'],
      valueFormatter: (value: number) => value.toLocaleString(),
    };

    switch (chartType) {
      case 'bar':
        return <BarChart {...config} className="w-full h-[300px]" />;
      case 'line':
        return <LineChart {...config} className="w-full h-[300px]" />;
      case 'pie':
        return <PieChart {...config} className="w-full h-[300px]" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex gap-4 mb-4">
        <div className="space-y-2">
          <Label>Chart Type</Label>
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Field</Label>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {numericFields.map(field => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="min-w-[600px] h-full">
          {renderChart()}
        </div>
      </ScrollArea>
    </div>
  );
};