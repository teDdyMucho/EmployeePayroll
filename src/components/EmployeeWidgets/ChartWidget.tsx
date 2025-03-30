import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, LineChart, PieChart } from '@/components/ui/chart';
import { Employee } from '@/types/employee';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showAllFields, setShowAllFields] = useState<boolean>(true);

  // Get all unique field names that contain numeric values from visible fields
  const numericFields = React.useMemo(() => {
    if (!visibleData?.employees || !visibleData?.fields) return [];
    
    return visibleData.fields.filter(field => 
      visibleData.employees.some(emp => {
        const value = emp.fields[field];
        // Check if the value is a number or can be converted to a number
        return typeof value === 'number' || 
               (typeof value === 'string' && !isNaN(Number(value)));
      })
    ).sort();
  }, [visibleData]);

  // Set initial field selection if none selected
  useEffect(() => {
    if (numericFields.length > 0 && selectedFields.length === 0) {
      setSelectedFields(numericFields);
    }
  }, [numericFields, selectedFields]);

  // Update chart data when fields or visible data changes
  useEffect(() => {
    if (selectedFields.length === 0 || !visibleData?.employees || visibleData.employees.length === 0) return;

    // Create chart data for all employees with all selected fields
    const data = visibleData.employees.map(emp => {
      const employeeData: any = {
        name: emp.name,
      };
      
      // Add each selected field as a property
      selectedFields.forEach(field => {
        const value = emp.fields[field];
        if (value !== undefined) {
          // Convert to number if possible
          if (typeof value === 'number') {
            employeeData[field] = value;
          } else if (typeof value === 'string' && !isNaN(Number(value))) {
            employeeData[field] = Number(value);
          } else {
            employeeData[field] = 0;
          }
        } else {
          employeeData[field] = 0;
        }
      });
      
      return employeeData;
    });
    
    // Log the data to help with debugging
    console.log('Chart data:', data);
    
    setChartData(data);
  }, [selectedFields, visibleData]);

  // Toggle field selection
  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  // Toggle all fields
  const toggleAllFields = () => {
    if (showAllFields) {
      setSelectedFields([]);
    } else {
      setSelectedFields([...numericFields]);
    }
    setShowAllFields(!showAllFields);
  };

  // Update selected fields when data is selected in Excel widget
  useEffect(() => {
    if (selectedData?.col && numericFields.includes(selectedData.col) && !selectedFields.includes(selectedData.col)) {
      setSelectedFields(prev => [...prev, selectedData.col]);
    }
  }, [selectedData, numericFields, selectedFields]);

  const renderChart = () => {
    if (!chartData.length || selectedFields.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No numeric data available for the selected fields
        </div>
      );
    }

    // Log the final chart configuration to help with debugging
    console.log('Chart config:', {
      data: chartData,
      fields: selectedFields
    });

    const config = {
      data: chartData,
      index: 'name',
      categories: selectedFields,
      colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', 
               '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed',
               '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4'],
      valueFormatter: (value: number) => value.toLocaleString(),
    };

    switch (chartType) {
      case 'bar':
        return <BarChart {...config} className="w-full h-[300px]" />;
      case 'line':
        return <LineChart {...config} className="w-full h-[300px]" />;
      case 'pie':
        // For pie charts, we need to restructure the data to show all employees for a single field
        if (selectedFields.length > 0) {
          const firstField = selectedFields[0];
          const pieData = visibleData?.employees.map(emp => {
            const value = emp.fields[firstField];
            let numericValue = 0;
            
            if (typeof value === 'number') {
              numericValue = value;
            } else if (typeof value === 'string' && !isNaN(Number(value))) {
              numericValue = Number(value);
            }
            
            return {
              name: emp.name,
              value: numericValue
            };
          }) || [];
          
          // Log the pie data to help with debugging
          console.log('Pie chart data:', pieData);
          
          const pieConfig = {
            data: pieData,
            index: 'name',
            categories: ['value'],
            colors: config.colors,
            valueFormatter: config.valueFormatter,
          };
          return <PieChart {...pieConfig} className="w-full h-[300px]" />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex gap-4">
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
            {chartType === 'pie' && selectedFields.length > 1 && (
              <div className="text-xs text-amber-600 mt-1">
                Note: Pie chart shows only the first selected field
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showAllFields" 
                checked={showAllFields} 
                onCheckedChange={toggleAllFields} 
              />
              <Label htmlFor="showAllFields">Show All Numeric Fields</Label>
            </div>
          </div>
        </div>

        {!showAllFields && (
          <div className="space-y-2">
            <Label>Selected Fields</Label>
            <div className="flex flex-wrap gap-2">
              {numericFields.map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`field-${field}`} 
                    checked={selectedFields.includes(field)} 
                    onCheckedChange={() => toggleField(field)} 
                  />
                  <Label htmlFor={`field-${field}`}>{field}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="min-w-[600px] h-full">
          {renderChart()}
        </div>
      </ScrollArea>
    </div>
  );
};