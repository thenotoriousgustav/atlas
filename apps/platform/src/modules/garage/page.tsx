'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useVehiclesControllerFindAll,
  useVehiclesControllerCreate,
  useVehiclesControllerUpdate,
  useVehiclesControllerRemove,
  useMaintenanceControllerFindAll,
  useMaintenanceControllerCreate,
  useMaintenanceControllerRemove,
  useFuelControllerFindAll,
  useFuelControllerCreate,
  useFuelControllerRemove,
  useExpensesControllerFindAll,
  useExpensesControllerCreate,
  useExpensesControllerRemove,
  useRemindersControllerFindAll,
  useRemindersControllerCreate,
  useRemindersControllerUpdate,
  useRemindersControllerRemove,
  useDocumentsControllerFindAll,
  useDocumentsControllerCreate,
  useDocumentsControllerRemove,
} from '@atlas/api-client';
import { useAuthStore } from '../../store/useAuthStore';
import { WorkspaceHeader } from './components/workspace-header';
import { Badge } from '@atlas/ui/components/badge';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
import { Input } from '@atlas/ui/components/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@atlas/ui/components/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import {
  Plus,
  Trash,
  PencilSimple,
  Clock,
  GasPump,
  Wrench,
  Coins,
  FileText,
  CalendarBlank,
  Heart,
  Gauge,
  Info,
  Note,
  User,
  PlusCircle,
  X,
} from '@phosphor-icons/react';

export const dynamic = 'force-dynamic';

const EXPENSE_CATEGORIES = [
  'Maintenance',
  'Fuel',
  'Parking',
  'Toll',
  'Insurance',
  'Tax',
  'Accessories',
  'Modifications',
  'Washing',
  'Emergency',
];

const REMINDER_TYPES = [
  'Engine Oil',
  'Gear Oil',
  'Air Filter',
  'Spark Plug',
  'Brake Pad',
  'CVT Roller',
  'CVT Belt',
  'Battery',
  'Tax Renewal',
  'Insurance Expiry',
  'Warranty Expiry',
];

export function GarageDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Selected vehicle ID
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<any | null>(null);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  // Active sub-logs tab
  const [activeTab, setActiveTab] = useState<'service' | 'fuel' | 'expenses' | 'documents'>('service');

  // Sync mount status
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Current User Profile
  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  });

  // Sync session
  useEffect(() => {
    if (!isMeLoading) {
      if ((meData as any)?.success && (meData as any)?.data) {
        setUser((meData as any).data);
      } else {
        setUser(null);
        router.push('/login');
      }
      setIsLoading(false);
    }
  }, [meData, isMeLoading, setUser, router]);

  // Fetch Vehicles
  const { data: vehiclesData, isLoading: isVehiclesLoading } = useVehiclesControllerFindAll({
    query: { enabled: !!user },
  });

  const vehicles = (vehiclesData as any)?.data || [];

  // Set default selected vehicle if none selected
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  // Selected vehicle details query
  const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId);

  // Fetch Sub-logs for selected vehicle
  const { data: maintenanceData } = useMaintenanceControllerFindAll(
    { vehicleId: selectedVehicleId || undefined },
    { query: { enabled: !!selectedVehicleId } }
  );

  const { data: fuelData } = useFuelControllerFindAll(
    { vehicleId: selectedVehicleId || undefined },
    { query: { enabled: !!selectedVehicleId } }
  );

  const { data: expensesData } = useExpensesControllerFindAll(
    { vehicleId: selectedVehicleId || undefined },
    { query: { enabled: !!selectedVehicleId } }
  );

  const { data: remindersData } = useRemindersControllerFindAll(
    { vehicleId: selectedVehicleId || undefined },
    { query: { enabled: !!selectedVehicleId } }
  );

  const { data: documentsData } = useDocumentsControllerFindAll(
    { vehicleId: selectedVehicleId || undefined },
    { query: { enabled: !!selectedVehicleId } }
  );

  const maintenances = (maintenanceData as any)?.data || [];
  const fuelLogs = (fuelData as any)?.data || [];
  const expenses = (expensesData as any)?.data || [];
  const reminders = (remindersData as any)?.data || [];
  const documents = (documentsData as any)?.data || [];

  // Mutations
  const createVehicleMutation = useVehiclesControllerCreate();
  const updateVehicleMutation = useVehiclesControllerUpdate();
  const removeVehicleMutation = useVehiclesControllerRemove();

  const createMaintenanceMutation = useMaintenanceControllerCreate();
  const removeMaintenanceMutation = useMaintenanceControllerRemove();

  const createFuelMutation = useFuelControllerCreate();
  const removeFuelMutation = useFuelControllerRemove();

  const createExpenseMutation = useExpensesControllerCreate();
  const removeExpenseMutation = useExpensesControllerRemove();

  const createReminderMutation = useRemindersControllerCreate();
  const updateReminderMutation = useRemindersControllerUpdate();
  const removeReminderMutation = useRemindersControllerRemove();

  const createDocumentMutation = useDocumentsControllerCreate();
  const removeDocumentMutation = useDocumentsControllerRemove();

  const logoutMutation = useAuthControllerLogout();

  // Forms
  const vehicleForm = useForm({
    defaultValues: {
      brand: '',
      model: '',
      variant: '',
      year: new Date().getFullYear(),
      plateNumber: '',
      vin: '',
      engineNumber: '',
      chassisNumber: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      odometer: 0,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          brand: value.brand,
          model: value.model,
          variant: value.variant || undefined,
          year: Number(value.year),
          plateNumber: value.plateNumber,
          vin: value.vin || undefined,
          engineNumber: value.engineNumber || undefined,
          chassisNumber: value.chassisNumber || undefined,
          purchasePrice: value.purchasePrice ? parseFloat(value.purchasePrice) : undefined,
          purchaseDate: value.purchaseDate ? new Date(value.purchaseDate).toISOString() : undefined,
          odometer: Number(value.odometer),
        };

        if (vehicleToEdit) {
          await updateVehicleMutation.mutateAsync({
            id: vehicleToEdit.id,
            data: payload,
          });
        } else {
          const res = await createVehicleMutation.mutateAsync({
            data: payload,
          });
          if ((res as any)?.success && (res as any)?.data?.id) {
            setSelectedVehicleId((res as any).data.id);
          }
        }

        queryClient.invalidateQueries({ queryKey: ['/v1/vehicles'] });
        setIsVehicleModalOpen(false);
        resetVehicleForm();
      } catch {
        alert('Failed to save vehicle');
      }
    },
  });

  const maintenanceForm = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      odometer: '',
      workshop: '',
      notes: '',
      totalCost: '',
      items: [] as { type: string; cost: number }[],
    },
    onSubmit: async ({ value }) => {
      if (!selectedVehicleId) return;
      try {
        const costNum = parseFloat(value.totalCost);
        const odometerNum = parseInt(value.odometer);
        if (isNaN(costNum) || isNaN(odometerNum)) {
          alert('Please input valid numeric fields');
          return;
        }

        await createMaintenanceMutation.mutateAsync({
          data: {
            vehicleId: selectedVehicleId,
            date: new Date(value.date as string).toISOString(),
            odometer: odometerNum,
            workshop: value.workshop || undefined,
            notes: value.notes || undefined,
            totalCost: costNum,
            items: value.items.length > 0 ? value.items : undefined,
          },
        });

        // Invalidate queries to refresh view
        queryClient.invalidateQueries({ queryKey: ['/v1/maintenance'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/expenses'] });
        setIsMaintenanceModalOpen(false);
        maintenanceForm.reset();
      } catch {
        alert('Failed to log service history');
      }
    },
  });

  const fuelForm = useForm({
    defaultValues: {
      liters: '',
      price: '',
      odometer: '',
    },
    onSubmit: async ({ value }) => {
      if (!selectedVehicleId) return;
      try {
        const litersNum = parseFloat(value.liters);
        const priceNum = parseFloat(value.price);
        const odometerNum = parseInt(value.odometer);

        if (isNaN(litersNum) || isNaN(priceNum) || isNaN(odometerNum)) {
          alert('Please enter valid numeric fields');
          return;
        }

        await createFuelMutation.mutateAsync({
          data: {
            vehicleId: selectedVehicleId,
            liters: litersNum,
            price: priceNum,
            odometer: odometerNum,
          },
        });

        queryClient.invalidateQueries({ queryKey: ['/v1/fuel'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/expenses'] });
        setIsFuelModalOpen(false);
        fuelForm.reset();
      } catch {
        alert('Failed to log fuel');
      }
    },
  });

  const expenseForm = useForm({
    defaultValues: {
      category: 'Parking',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    },
    onSubmit: async ({ value }) => {
      if (!selectedVehicleId) return;
      try {
        const amountNum = parseFloat(value.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          alert('Please enter a valid amount');
          return;
        }

        await createExpenseMutation.mutateAsync({
          data: {
            vehicleId: selectedVehicleId,
            category: value.category,
            amount: amountNum,
            date: new Date(value.date as string).toISOString(),
          },
        });

        queryClient.invalidateQueries({ queryKey: ['/v1/expenses'] });
        setIsExpenseModalOpen(false);
        expenseForm.reset();
      } catch {
        alert('Failed to log expense');
      }
    },
  });

  const reminderForm = useForm({
    defaultValues: {
      type: 'Engine Oil',
      dueDate: '',
      dueMileage: '',
    },
    onSubmit: async ({ value }) => {
      if (!selectedVehicleId) return;
      try {
        await createReminderMutation.mutateAsync({
          data: {
            vehicleId: selectedVehicleId,
            type: value.type,
            dueDate: value.dueDate ? new Date(value.dueDate).toISOString() : undefined,
            dueMileage: value.dueMileage ? parseInt(value.dueMileage) : undefined,
            status: 'ACTIVE',
          },
        });

        queryClient.invalidateQueries({ queryKey: ['/v1/reminders'] });
        setIsReminderModalOpen(false);
        reminderForm.reset();
      } catch {
        alert('Failed to create reminder');
      }
    },
  });

  const documentForm = useForm({
    defaultValues: {
      documentType: 'STNK',
      documentNumber: '',
      expirationDate: '',
      notes: '',
    },
    onSubmit: async ({ value }) => {
      if (!selectedVehicleId) return;
      try {
        await createDocumentMutation.mutateAsync({
          data: {
            vehicleId: selectedVehicleId,
            documentType: value.documentType,
            documentNumber: value.documentNumber,
            expirationDate: value.expirationDate ? new Date(value.expirationDate).toISOString() : undefined,
            notes: value.notes || undefined,
          },
        });

        queryClient.invalidateQueries({ queryKey: ['/v1/documents'] });
        setIsDocumentModalOpen(false);
        documentForm.reset();
      } catch {
        alert('Failed to log document details');
      }
    },
  });

  const resetVehicleForm = () => {
    setVehicleToEdit(null);
    vehicleForm.reset();
  };

  const handleEditVehicle = (v: any) => {
    setVehicleToEdit(v);
    vehicleForm.setFieldValue('brand', v.brand);
    vehicleForm.setFieldValue('model', v.model);
    vehicleForm.setFieldValue('variant', v.variant || '');
    vehicleForm.setFieldValue('year', v.year);
    vehicleForm.setFieldValue('plateNumber', v.plateNumber);
    vehicleForm.setFieldValue('vin', v.vin || '');
    vehicleForm.setFieldValue('engineNumber', v.engineNumber || '');
    vehicleForm.setFieldValue('chassisNumber', v.chassisNumber || '');
    vehicleForm.setFieldValue('purchasePrice', v.purchasePrice ? v.purchasePrice.toString() : '');
    vehicleForm.setFieldValue('purchaseDate', v.purchaseDate ? new Date(v.purchaseDate).toISOString().split('T')[0] : '');
    vehicleForm.setFieldValue('odometer', v.odometer);
    setIsVehicleModalOpen(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Are you sure you want to remove this vehicle and all its logs?')) {
      try {
        await removeVehicleMutation.mutateAsync({ id });
        setSelectedVehicleId(null);
        queryClient.invalidateQueries({ queryKey: ['/v1/vehicles'] });
      } catch {
        alert('Failed to delete vehicle');
      }
    }
  };

  const handleRemoveMaintenance = async (id: string) => {
    if (confirm('Delete this service record?')) {
      try {
        await removeMaintenanceMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/maintenance'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/expenses'] });
      } catch {
        alert('Failed to delete record');
      }
    }
  };

  const handleRemoveFuel = async (id: string) => {
    if (confirm('Delete this refueling log?')) {
      try {
        await removeFuelMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/fuel'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/expenses'] });
      } catch {
        alert('Failed to delete log');
      }
    }
  };

  const handleRemoveExpense = async (id: string) => {
    if (confirm('Delete this expense log?')) {
      try {
        await removeExpenseMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/expenses'] });
      } catch {
        alert('Failed to delete expense');
      }
    }
  };

  const handleRemoveDocument = async (id: string) => {
    if (confirm('Delete this document configuration?')) {
      try {
        await removeDocumentMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/documents'] });
      } catch {
        alert('Failed to delete document');
      }
    }
  };

  const handleToggleReminderStatus = async (reminder: any) => {
    try {
      const nextStatus = reminder.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
      await updateReminderMutation.mutateAsync({
        id: reminder.id,
        data: { status: nextStatus },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/reminders'] });
    } catch {
      alert('Failed to update status');
    }
  };

  const handleRemoveReminder = async (id: string) => {
    if (confirm('Remove this reminder?')) {
      try {
        await removeReminderMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/reminders'] });
      } catch {
        alert('Failed to delete reminder');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      router.push('/login');
    } catch {
      logout();
      router.push('/login');
    }
  };

  // Dynamic calculations for selected vehicle
  const calculateVehicleHealth = () => {
    if (!selectedVehicle) return 100;
    let score = 100;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter active reminders
    const activeReminders = reminders.filter((r: any) => r.status === 'ACTIVE');

    activeReminders.forEach((r: any) => {
      // Date based overdue
      if (r.dueDate) {
        const due = new Date(r.dueDate);
        if (due < today) {
          score -= 15;
        }
      }
      // Mileage based overdue
      if (r.dueMileage && selectedVehicle.odometer) {
        if (selectedVehicle.odometer > r.dueMileage) {
          score -= 15;
        }
      }
    });

    return Math.max(0, score);
  };

  const healthScore = calculateVehicleHealth();

  const calculateFuelKpl = () => {
    if (fuelLogs.length < 2) return null;
    const sorted = [...fuelLogs].sort((a: any, b: any) => b.odometer - a.odometer);
    const latest = sorted[0];
    const oldest = sorted[sorted.length - 1];

    const distance = latest.odometer - oldest.odometer;
    const totalLiters = fuelLogs.reduce((sum: number, log: any) => sum + log.liters, 0) - oldest.liters;

    if (totalLiters <= 0 || distance <= 0) return null;
    return distance / totalLiters;
  };

  const kpl = calculateFuelKpl();

  const totalVehicleExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading || isMeLoading || !user) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center font-mono text-xs text-brand-muted space-y-4 select-none">
        <Clock className="w-6 h-6 animate-spin text-brand-charcoal" />
        <span>Syncing Garage session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-canvas py-8 px-4 md:px-12 select-none font-mono text-xs">
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Workspace Header */}
        <WorkspaceHeader user={user} onLogout={handleLogout} />

        {/* Top selectors & general state */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-4">
          <div className="flex items-center gap-3">
            <Select
              value={selectedVehicleId || ''}
              onValueChange={(val) => setSelectedVehicleId(val || null)}
            >
              <SelectTrigger className="h-9 border-brand-border bg-white text-xs text-brand-charcoal font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none min-w-48">
                <SelectValue placeholder="Select Vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plateNumber})
                  </SelectItem>
                ))}
                {vehicles.length === 0 && <SelectItem value="">No vehicles registered</SelectItem>}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => {
                resetVehicleForm();
                setIsVehicleModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-9 rounded-none border-brand-border text-[10px] uppercase font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Vehicle
            </Button>
          </div>

          {selectedVehicle && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleEditVehicle(selectedVehicle)}
                variant="ghost"
                size="sm"
                className="h-8 text-[10px] uppercase font-semibold text-brand-muted"
              >
                <PencilSimple className="w-3.5 h-3.5 mr-1" /> Edit Profile
              </Button>
              <Button
                onClick={() => handleDeleteVehicle(selectedVehicle.id)}
                variant="ghost"
                size="sm"
                className="h-8 text-[10px] uppercase font-semibold hover:bg-brand-red-bg hover:text-brand-red-text"
              >
                <Trash className="w-3.5 h-3.5 mr-1" /> Delete Vehicle
              </Button>
            </div>
          )}
        </div>

        {/* Selected Vehicle stats bar */}
        {selectedVehicle ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Health Score */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
              <span className="text-[10px] text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                <Heart className={`w-3.5 h-3.5 ${healthScore > 75 ? 'text-[#1e4620]' : 'text-[#b3261e]'}`} />
                Health Condition
              </span>
              <div className="font-serif text-3xl font-semibold tracking-tight text-brand-charcoal flex items-baseline gap-1.5">
                {healthScore}%
                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 ${
                  healthScore > 75 ? 'bg-[#edf7ed] text-[#1e4620]' : 'bg-[#fdeded] text-[#5f2120]'
                }`}>
                  {healthScore > 75 ? 'Excellent' : 'Needs Servicing'}
                </span>
              </div>
            </Card>

            {/* Odometer */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
              <span className="text-[10px] text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-brand-charcoal" />
                Odometer Mileage
              </span>
              <div className="font-serif text-3xl font-semibold tracking-tight text-brand-charcoal">
                {selectedVehicle.odometer?.toLocaleString()}
                <span className="text-[10px] font-mono text-brand-muted font-normal"> km</span>
              </div>
            </Card>

            {/* Total Expenses */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
              <span className="text-[10px] text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-brand-charcoal" />
                Total Cost of Ownership
              </span>
              <div className="font-serif text-3xl font-semibold tracking-tight text-brand-charcoal">
                {formatCurrency(totalVehicleExpenses)}
              </div>
            </Card>

            {/* Fuel economy */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
              <span className="text-[10px] text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                <GasPump className="w-3.5 h-3.5 text-brand-charcoal" />
                Fuel Economy
              </span>
              <div className="font-serif text-3xl font-semibold tracking-tight text-brand-charcoal">
                {kpl ? `${kpl.toFixed(1)}` : '--'}
                {kpl && <span className="text-[10px] font-mono text-brand-muted font-normal"> km/l</span>}
              </div>
            </Card>
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-brand-border text-brand-muted font-mono bg-white">
            Register your first vehicle to start tracking health and expenses
          </div>
        )}

        {/* Main Bento split layout */}
        {selectedVehicle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col (5 cols): Actions & Reminder planner */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Quick log buttons */}
              <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
                <h2 className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                  Log Operations
                </h2>
                <div className="grid grid-cols-2 gap-3 font-mono text-[9px] uppercase tracking-tight font-bold">
                  <Button
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className="rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 flex items-center justify-center gap-1.5 h-10"
                  >
                    <Wrench className="w-4 h-4" /> Log Service
                  </Button>
                  <Button
                    onClick={() => setIsFuelModalOpen(true)}
                    variant="outline"
                    className="rounded-none border-brand-border hover:border-brand-charcoal/30 flex items-center justify-center gap-1.5 h-10"
                  >
                    <GasPump className="w-4 h-4" /> Log Refuel
                  </Button>
                  <Button
                    onClick={() => setIsExpenseModalOpen(true)}
                    variant="outline"
                    className="rounded-none border-brand-border hover:border-brand-charcoal/30 flex items-center justify-center gap-1.5 h-10"
                  >
                    <Coins className="w-4 h-4" /> Log Expense
                  </Button>
                  <Button
                    onClick={() => setIsDocumentModalOpen(true)}
                    variant="outline"
                    className="rounded-none border-brand-border hover:border-brand-charcoal/30 flex items-center justify-center gap-1.5 h-10"
                  >
                    <FileText className="w-4 h-4" /> Log Document
                  </Button>
                </div>
              </Card>

              {/* Maintenance & Tax Reminders Planner */}
              <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                    Due & Upcoming Reminders
                  </h2>
                  <Button
                    onClick={() => setIsReminderModalOpen(true)}
                    variant="ghost"
                    size="xs"
                    className="text-[9px] font-bold uppercase tracking-tight text-brand-charcoal hover:underline"
                  >
                    + Add Reminder
                  </Button>
                </div>

                {reminders.length === 0 ? (
                  <div className="py-6 text-center text-brand-muted bg-brand-canvas/30 border border-dashed border-brand-border">
                    No active reminders configured
                  </div>
                ) : (
                  <div className="border border-brand-border divide-y divide-brand-border font-mono text-[11px] bg-white">
                    {reminders.map((rem: any) => {
                      const isOverdue =
                        (rem.dueDate && new Date(rem.dueDate) < new Date()) ||
                        (rem.dueMileage && selectedVehicle.odometer > rem.dueMileage);
                      return (
                        <div
                          key={rem.id}
                          className={`p-3 flex items-center justify-between transition-colors ${
                            rem.status !== 'ACTIVE' ? 'opacity-50 bg-brand-charcoal/3' : 'hover:bg-brand-charcoal/2'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-brand-charcoal">{rem.type}</span>
                              <Badge
                                variant="outline"
                                className={`text-[8px] px-1.5 py-0 uppercase font-mono ${
                                  rem.status !== 'ACTIVE'
                                    ? 'bg-brand-charcoal/10 text-brand-muted border-none'
                                    : isOverdue
                                    ? 'bg-brand-red-bg text-brand-red-text border-[#b3261e]/20'
                                    : 'bg-[#edf7ed] text-[#1e4620] border-[#1e4620]/20'
                                }`}
                              >
                                {rem.status !== 'ACTIVE' ? 'completed' : isOverdue ? 'overdue' : 'active'}
                              </Badge>
                            </div>

                            <div className="text-[10px] text-brand-muted flex items-center gap-2">
                              {rem.dueDate && (
                                <span className="flex items-center gap-0.5">
                                  <CalendarBlank className="w-3.5 h-3.5" />
                                  Due: {new Date(rem.dueDate).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              )}
                              {rem.dueMileage && (
                                <span className="flex items-center gap-0.5">
                                  <Gauge className="w-3.5 h-3.5" />
                                  Due: {rem.dueMileage.toLocaleString()} km
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4 shrink-0">
                            {rem.status === 'ACTIVE' && (
                              <Tooltip>
                                <TooltipTrigger render={
                                  <Button
                                    onClick={() => handleToggleReminderStatus(rem)}
                                    variant="ghost"
                                    size="icon-xs"
                                    className="size-7 hover:bg-[#edf7ed] hover:text-[#1e4620]"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </Button>
                                } />
                                <TooltipContent>Complete</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger render={
                                <Button
                                  onClick={() => handleRemoveReminder(rem.id)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              } />
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Col (7 cols): Data Tabs & Log lists */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 border-b border-brand-border pb-2.5 font-bold uppercase tracking-tight text-[10px]">
                <span
                  onClick={() => setActiveTab('service')}
                  className={`px-3 py-1.5 border cursor-pointer hover:border-brand-charcoal/30 ${
                    activeTab === 'service'
                      ? 'border-brand-charcoal bg-brand-charcoal text-white'
                      : 'border-brand-border bg-white text-brand-muted'
                  }`}
                >
                  Service Logs
                </span>
                <span
                  onClick={() => setActiveTab('fuel')}
                  className={`px-3 py-1.5 border cursor-pointer hover:border-brand-charcoal/30 ${
                    activeTab === 'fuel'
                      ? 'border-brand-charcoal bg-brand-charcoal text-white'
                      : 'border-brand-border bg-white text-brand-muted'
                  }`}
                >
                  Refuelings
                </span>
                <span
                  onClick={() => setActiveTab('expenses')}
                  className={`px-3 py-1.5 border cursor-pointer hover:border-brand-charcoal/30 ${
                    activeTab === 'expenses'
                      ? 'border-brand-charcoal bg-brand-charcoal text-white'
                      : 'border-brand-border bg-white text-brand-muted'
                  }`}
                >
                  Expenses
                </span>
                <span
                  onClick={() => setActiveTab('documents')}
                  className={`px-3 py-1.5 border cursor-pointer hover:border-brand-charcoal/30 ${
                    activeTab === 'documents'
                      ? 'border-brand-charcoal bg-brand-charcoal text-white'
                      : 'border-brand-border bg-white text-brand-muted'
                  }`}
                >
                  Documents
                </span>
              </div>

              {/* Tab Content 1: Service Logs */}
              {activeTab === 'service' && (
                <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
                  {maintenances.length === 0 ? (
                    <div className="py-12 text-center text-brand-muted bg-brand-canvas/30 border border-dashed border-brand-border">
                      No service records logged for this vehicle
                    </div>
                  ) : (
                    <div className="border border-brand-border divide-y divide-brand-border">
                      {maintenances.map((m: any) => (
                        <div key={m.id} className="p-4 hover:bg-brand-charcoal/2 transition-colors flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-brand-charcoal">
                                {m.workshop || 'General Maintenance'}
                              </span>
                              <Badge variant="outline" className="text-[8px] font-mono px-2 py-0">
                                {m.odometer.toLocaleString()} km
                              </Badge>
                            </div>

                            <p className="text-[11px] text-brand-muted">
                              {m.notes || 'Regular service inspection.'}
                            </p>

                            {m.items && m.items.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap pt-1">
                                {m.items.map((item: any) => (
                                  <span key={item.id} className="text-[9px] px-1.5 py-0.5 border border-brand-border bg-brand-canvas">
                                    {item.type}: {formatCurrency(item.cost)}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="text-[10px] text-brand-muted/70 flex items-center gap-1.5">
                              <CalendarBlank className="w-3.5 h-3.5" />
                              {new Date(m.date).toLocaleDateString(undefined, {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <span className="font-semibold text-brand-charcoal text-sm">
                              {formatCurrency(m.totalCost)}
                            </span>
                            <Button
                              onClick={() => handleRemoveMaintenance(m.id)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Tab Content 2: Refuelings */}
              {activeTab === 'fuel' && (
                <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
                  {fuelLogs.length === 0 ? (
                    <div className="py-12 text-center text-brand-muted bg-brand-canvas/30 border border-dashed border-brand-border">
                      No refueling logs logged for this vehicle
                    </div>
                  ) : (
                    <div className="border border-brand-border divide-y divide-brand-border">
                      {fuelLogs.map((log: any) => (
                        <div key={log.id} className="p-3 hover:bg-brand-charcoal/2 transition-colors flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold text-brand-charcoal flex items-center gap-2">
                              <span>Fuel Filled</span>
                              <span className="text-[10px] font-normal text-brand-muted">
                                ({log.liters.toFixed(2)} liters @ {formatCurrency(log.price)}/l)
                              </span>
                            </div>
                            <div className="text-[10px] text-brand-muted flex items-center gap-2">
                              <span className="flex items-center gap-0.5">
                                <Gauge className="w-3.5 h-3.5" />
                                {log.odometer.toLocaleString()} km
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <CalendarBlank className="w-3.5 h-3.5" />
                                {new Date(log.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <span className="font-semibold text-brand-charcoal">
                              {formatCurrency(log.liters * log.price)}
                            </span>
                            <Button
                              onClick={() => handleRemoveFuel(log.id)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Tab Content 3: Expenses */}
              {activeTab === 'expenses' && (
                <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
                  {expenses.length === 0 ? (
                    <div className="py-12 text-center text-brand-muted bg-brand-canvas/30 border border-dashed border-brand-border">
                      No expense logs for this vehicle
                    </div>
                  ) : (
                    <div className="border border-brand-border divide-y divide-brand-border">
                      {expenses.map((exp: any) => (
                        <div key={exp.id} className="p-3 hover:bg-brand-charcoal/2 transition-colors flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold text-brand-charcoal flex items-center gap-2">
                              <span>{exp.category}</span>
                              <Badge variant="outline" className="text-[8px] font-mono px-2 py-0">
                                {exp.category.toLowerCase()}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-brand-muted flex items-center gap-1.5">
                              <CalendarBlank className="w-3.5 h-3.5" />
                              {new Date(exp.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <span className="font-semibold text-brand-charcoal">
                              {formatCurrency(exp.amount)}
                            </span>
                            <Button
                              onClick={() => handleRemoveExpense(exp.id)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Tab Content 4: Documents */}
              {activeTab === 'documents' && (
                <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
                  {documents.length === 0 ? (
                    <div className="py-12 text-center text-brand-muted bg-brand-canvas/30 border border-dashed border-brand-border">
                      No document records logged for this vehicle
                    </div>
                  ) : (
                    <div className="border border-brand-border divide-y divide-brand-border">
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="p-3 hover:bg-brand-charcoal/2 transition-colors flex items-center justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-brand-charcoal">{doc.documentType}</span>
                              <span className="text-brand-muted font-mono text-[10px]">({doc.documentNumber})</span>
                            </div>
                            {doc.notes && (
                              <p className="text-[10px] text-brand-muted">{doc.notes}</p>
                            )}
                            {doc.expirationDate && (
                              <div className="text-[10px] text-[#b3261e] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Expiry Date: {new Date(doc.expirationDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 ml-4 shrink-0">
                            <Button
                              onClick={() => handleRemoveDocument(doc.id)}
                              variant="ghost"
                              size="icon-xs"
                              className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Form Dialog */}
      <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-brand-charcoal">
              {vehicleToEdit ? 'Edit Vehicle Profile' : 'Register Vehicle'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-brand-muted mt-1">
              Add core identification information of your motorcycle or car.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              vehicleForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Brand</label>
                <vehicleForm.Field
                  name="brand"
                  children={(field) => (
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Honda, Toyota"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Model</label>
                <vehicleForm.Field
                  name="model"
                  children={(field) => (
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Vario, Corolla"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Variant (Optional)</label>
                <vehicleForm.Field
                  name="variant"
                  children={(field) => (
                    <Input
                      type="text"
                      placeholder="e.g. CBS-ISS, Altis"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Year</label>
                <vehicleForm.Field
                  name="year"
                  children={(field) => (
                    <Input
                      type="number"
                      required
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseInt(e.target.value))}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Plate Number</label>
                <vehicleForm.Field
                  name="plateNumber"
                  children={(field) => (
                    <Input
                      type="text"
                      required
                      placeholder="e.g. B 1234 ABC"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Initial Odometer</label>
                <vehicleForm.Field
                  name="odometer"
                  children={(field) => (
                    <Input
                      type="number"
                      required
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      disabled={!!vehicleToEdit}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono disabled:opacity-50"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">VIN (Optional)</label>
                <vehicleForm.Field
                  name="vin"
                  children={(field) => (
                    <Input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Engine No (Optional)</label>
                <vehicleForm.Field
                  name="engineNumber"
                  children={(field) => (
                    <Input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>
            </div>

            {/* Price & Purchase date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Purchase Cost (Optional)</label>
                <vehicleForm.Field
                  name="purchasePrice"
                  children={(field) => (
                    <Input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Purchase Date</label>
                <vehicleForm.Field
                  name="purchaseDate"
                  children={(field) => (
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono rounded-none"
                    />
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-brand-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVehicleModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Service Dialog */}
      <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-brand-charcoal">Log Maintenance</DialogTitle>
            <DialogDescription className="text-xs font-mono text-brand-muted mt-1">
              Add details of maintenance performed.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              maintenanceForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Service Date</label>
                <maintenanceForm.Field
                  name="date"
                  children={(field) => (
                    <Input
                      type="date"
                      required
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono rounded-none"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Odometer (km)</label>
                <maintenanceForm.Field
                  name="odometer"
                  children={(field) => (
                    <Input
                      type="number"
                      required
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Workshop / Mechanic</label>
                <maintenanceForm.Field
                  name="workshop"
                  children={(field) => (
                    <Input
                      type="text"
                      placeholder="e.g. AHASS"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Total Cost (IDR)</label>
                <maintenanceForm.Field
                  name="totalCost"
                  children={(field) => (
                    <Input
                      type="number"
                      required
                      placeholder="0"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-brand-muted">Notes / Details</label>
              <maintenanceForm.Field
                name="notes"
                children={(field) => (
                  <textarea
                    rows={2}
                    placeholder="Describe maintenance or replaced spare parts..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full p-2.5 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono rounded-none resize-none"
                  />
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-brand-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                Log Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Fuel Dialog */}
      <Dialog open={isFuelModalOpen} onOpenChange={setIsFuelModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-brand-charcoal">Log Refueling</DialogTitle>
            <DialogDescription className="text-xs font-mono text-brand-muted mt-1">
              Add details of fuel purchased.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fuelForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Liters</label>
                <fuelForm.Field
                  name="liters"
                  children={(field) => (
                    <Input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Price per Liter (IDR)</label>
                <fuelForm.Field
                  name="price"
                  children={(field) => (
                    <Input
                      type="number"
                      required
                      placeholder="e.g. 13500"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-brand-muted">Odometer at Refuel (km)</label>
              <fuelForm.Field
                name="odometer"
                children={(field) => (
                  <Input
                    type="number"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                  />
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-brand-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFuelModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                Log Refuel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Expense Dialog */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-brand-charcoal">Log Vehicle Expense</DialogTitle>
            <DialogDescription className="text-xs font-mono text-brand-muted mt-1">
              Add non-maintenance expenses (toll, parking, accessories).
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              expenseForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Category</label>
                <expenseForm.Field
                  name="category"
                  children={(field) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val || '')}
                    >
                      <SelectTrigger className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none font-mono text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Date</label>
                <expenseForm.Field
                  name="date"
                  children={(field) => (
                    <Input
                      type="date"
                      required
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono rounded-none"
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-brand-muted">Amount (IDR)</label>
              <expenseForm.Field
                name="amount"
                children={(field) => (
                  <Input
                    type="number"
                    required
                    placeholder="0"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                  />
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-brand-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpenseModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                Log Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-brand-charcoal">Create Reminder</DialogTitle>
            <DialogDescription className="text-xs font-mono text-brand-muted mt-1">
              Add reminder thresholds by mileage (km) or date.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              reminderForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-brand-muted">Reminder Type / Part</label>
              <reminderForm.Field
                name="type"
                children={(field) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val || '')}
                    >
                      <SelectTrigger className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none font-mono text-xs">
                        <SelectValue placeholder="Reminder Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Due Date (Optional)</label>
                <reminderForm.Field
                  name="dueDate"
                  children={(field) => (
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono rounded-none"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Due Odometer (Optional)</label>
                <reminderForm.Field
                  name="dueMileage"
                  children={(field) => (
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                    />
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-brand-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReminderModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                Create Reminder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Document Dialog */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 font-mono text-xs">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-brand-charcoal">Log Vehicle Document</DialogTitle>
            <DialogDescription className="text-xs font-mono text-brand-muted mt-1">
              Add identification info for papers (STNK, Insurance).
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              documentForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Document Type</label>
                <documentForm.Field
                  name="documentType"
                  children={(field) => (
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val || '')}
                    >
                      <SelectTrigger className="w-full h-9 border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none font-mono text-xs">
                        <SelectValue placeholder="Document Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STNK">STNK</SelectItem>
                        <SelectItem value="Insurance Policy">Insurance Policy</SelectItem>
                        <SelectItem value="Warranty Certificate">Warranty Certificate</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-brand-muted">Expiration Date (Optional)</label>
                <documentForm.Field
                  name="expirationDate"
                  children={(field) => (
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono rounded-none"
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-brand-muted">Document / Policy Number</label>
              <documentForm.Field
                name="documentNumber"
                children={(field) => (
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 1234567/A"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-brand-muted">Notes (Optional)</label>
              <documentForm.Field
                name="notes"
                children={(field) => (
                  <Input
                    type="text"
                    placeholder="Add description notes..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-mono"
                  />
                )}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-brand-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDocumentModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-brand-charcoal text-white hover:bg-brand-charcoal/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                Log Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
