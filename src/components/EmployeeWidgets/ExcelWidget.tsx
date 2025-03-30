import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { Employee } from '@/types/employee';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllEmployees } from '@/lib/firebase';

interface ExcelWidgetProps {
  employees: Employee[];
  onDataChange?: (data: any) => void;
  onVisibleDataChange?: (data: { employees: Employee[]; fields: string[] }) => void;
}

export const ExcelWidget: React.FC<ExcelWidgetProps> = ({ 
  employees: initialEmployees, 
  onDataChange,
  onVisibleDataChange 
}) => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [hiddenRows, setHiddenRows] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{row: string, col: string}[]>([]);

  // Update local state when props change
  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  // Get all unique field names from employees
  const allFields = Array.from(
    new Set(
      employees.flatMap(emp => Object.keys(emp.fields))
    )
  ).sort();

  const toggleColumn = (field: string) => {
    setHiddenColumns(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const toggleRow = (employeeId: string) => {
    setHiddenRows(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleCellSelection = (row: string, col: string) => {
    setSelectedCells(prev => {
      const isSelected = prev.some(cell => cell.row === row && cell.col === col);
      if (isSelected) {
        return prev.filter(cell => !(cell.row === row && cell.col === col));
      } else {
        return [...prev, { row, col }];
      }
    });

    if (onDataChange) {
      const selectedEmployee = employees.find(emp => emp.id === row);
      if (selectedEmployee) {
        onDataChange({ 
          row, 
          col, 
          value: selectedEmployee.fields[col],
          employeeName: selectedEmployee.name
        });
      }
    }
  };

  const visibleFields = allFields.filter(field => !hiddenColumns.includes(field));
  const visibleEmployees = employees.filter(emp => !hiddenRows.includes(emp.id));

  // Update visible data whenever visible rows or columns change
  useEffect(() => {
    if (onVisibleDataChange) {
      onVisibleDataChange({
        employees: visibleEmployees,
        fields: visibleFields
      });
    }
  }, [visibleEmployees, visibleFields, onVisibleDataChange]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between p-2 bg-muted/50">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setHiddenColumns([])}>
            <Eye className="h-4 w-4 mr-1" />
            Show All Columns
          </Button>
          <Button variant="outline" size="sm" onClick={() => setHiddenRows([])}>
            <Eye className="h-4 w-4 mr-1" />
            Show All Rows
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] sticky left-0 bg-background z-20"></TableHead>
                <TableHead className="sticky left-[50px] bg-background z-20">Employee</TableHead>
                {visibleFields.map(field => (
                  <TableHead key={field} className="min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <span>{field}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleColumn(field)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEmployees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell className="sticky left-0 bg-background">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleRow(employee.id)}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium sticky left-[50px] bg-background">
                    {employee.name}
                  </TableCell>
                  {visibleFields.map(field => (
                    <TableCell 
                      key={`${employee.id}-${field}`}
                      className={`cursor-pointer ${
                        selectedCells.some(cell => cell.row === employee.id && cell.col === field)
                          ? 'bg-blue-100'
                          : ''
                      }`}
                      onClick={() => toggleCellSelection(employee.id, field)}
                    >
                      {employee.fields[field]?.toString() || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};