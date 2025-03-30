import React, { useState, useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ExcelWidget } from './ExcelWidget';
import { ChartWidget } from './ChartWidget';
import { Employee } from '@/types/employee';
import { Card } from '@/components/ui/card';
import { employeesRef } from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';

export const EmployeeWidgets: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedData, setSelectedData] = useState<{ row: string; col: string; value: any }>();
  const [visibleData, setVisibleData] = useState<{ employees: Employee[]; fields: string[] }>();
  const [isLoading, setIsLoading] = useState(true);

  // Set up real-time sync with Firestore for employees
  useEffect(() => {
    const unsubscribe = onSnapshot(employeesRef, (snapshot) => {
      try {
        const employeesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Employee[];
        setEmployees(employeesData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading employees:', error);
        toast({
          title: "Error loading employees",
          description: "Failed to load employee data.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-12rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] w-full">
      <ResizablePanelGroup 
        direction="vertical" 
        className="min-h-[500px] rounded-lg border bg-background"
      >
        <ResizablePanel defaultSize={60} minSize={30}>
          <Card className="rounded-none border-0 h-full">
            <ExcelWidget 
              employees={employees} 
              onDataChange={setSelectedData}
              onVisibleDataChange={setVisibleData}
            />
          </Card>
        </ResizablePanel>
        <ResizablePanel defaultSize={40} minSize={20}>
          <Card className="rounded-none border-0 h-full">
            <ChartWidget 
              employees={employees} 
              selectedData={selectedData}
              visibleData={visibleData}
            />
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};