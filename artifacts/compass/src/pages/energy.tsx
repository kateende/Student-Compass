import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  useGetEnergyLogs,
  useCreateEnergyLog,
  useDeleteEnergyLog,
  useGetCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useGetEnergyByCategory,
  getGetEnergyLogsQueryKey,
  getGetCategoriesQueryKey,
  getGetEnergyByCategoryQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Zap, PlusCircle, Folder, BarChart3, MoreVertical, Pencil, Trash2, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TABS = ["new-log", "history", "categories", "dashboard"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  "new-log": "New Log",
  history: "History",
  categories: "Categories",
  dashboard: "Dashboard",
};

const TAB_ICONS: Record<Tab, typeof Zap> = {
  "new-log": PlusCircle,
  history: Zap,
  categories: Folder,
  dashboard: BarChart3,
};

const logFormSchema = z.object({
  taskName: z.string().min(1, "Task name is required"),
  energyLevel: z.number().min(1).max(10),
  categoryId: z.string().optional(),
});

type LogFormValues = z.infer<typeof logFormSchema>;

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

function getEnergyColor(level: number) {
  if (level >= 7) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (level <= 4) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
}

function getStatusLabel(status: string) {
  if (status === "thriving") return { label: "Thriving!", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200" };
  if (status === "needs-attention") return { label: "Needs Attention", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200" };
  return { label: "Doing Okay", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200" };
}

function NewLogTab() {
  const queryClient = useQueryClient();
  const { data: categories } = useGetCategories();
  const createLog = useCreateEnergyLog();
  const { toast } = useToast();

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      taskName: "",
      energyLevel: 5,
      categoryId: undefined,
    },
  });

  async function onSubmit(values: LogFormValues) {
    createLog.mutate(
      {
        data: {
          taskName: values.taskName,
          energyLevel: values.energyLevel,
          categoryId: values.categoryId ? parseInt(values.categoryId) : undefined,
        },
      },
      {
        onSuccess: () => {
          form.reset({ taskName: "", energyLevel: 5, categoryId: undefined });
          queryClient.invalidateQueries({ queryKey: getGetEnergyLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEnergyByCategoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
          toast({ title: "Energy logged", description: `"${values.taskName}" saved.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save log.", variant: "destructive" });
        },
      }
    );
  }

  const energyLevel = form.watch("energyLevel");

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Log Your Energy</CardTitle>
        <CardDescription>How energized did this task make you feel?</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="taskName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-task-name"
                      placeholder="e.g., Algorithm homework"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="energyLevel"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Energy Level</FormLabel>
                    <span className="text-lg font-semibold text-primary">{field.value}</span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        data-testid="slider-energy-level"
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 - Low</span>
                        <span>5 - Neutral</span>
                        <span>10 - High</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)} data-testid={`category-option-${cat.id}`}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createLog.isPending}
                data-testid="button-save-log"
              >
                {createLog.isPending ? "Saving..." : "Save Log"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset({ taskName: "", energyLevel: 5, categoryId: undefined })}
                data-testid="button-cancel-log"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function HistoryTab() {
  const { data: logs, isLoading } = useGetEnergyLogs();
  const deleteLog = useDeleteEnergyLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function handleDelete(id: number, name: string) {
    deleteLog.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEnergyLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEnergyByCategoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
          toast({ title: "Log deleted", description: `"${name}" removed.` });
        },
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Log History</CardTitle>
        <CardDescription>All your tracked tasks, most recent first</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No logs yet</p>
            <p className="text-sm mt-1">Start tracking your energy by creating a New Log</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                data-testid={`log-item-${log.id}`}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.taskName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEnergyColor(log.energyLevel)}`}>
                      Energy: {log.energyLevel}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {log.categoryName && (
                      <>
                        <Folder className="h-3 w-3" />
                        <span>{log.categoryName}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{format(new Date(log.loggedAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid={`log-menu-${log.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(log.id, log.taskName)}
                      data-testid={`log-delete-${log.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoriesTab() {
  const { data: categories, isLoading } = useGetCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const form = useForm<{ name: string }>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "" },
  });

  function handleCreate(values: { name: string }) {
    createCategory.mutate(
      { data: { name: values.name } },
      {
        onSuccess: () => {
          form.reset({ name: "" });
          queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
          toast({ title: "Category created" });
        },
      }
    );
  }

  function handleUpdate(id: number) {
    if (!editName.trim()) return;
    updateCategory.mutate(
      { id, data: { name: editName } },
      {
        onSuccess: () => {
          setEditingId(null);
          queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
          toast({ title: "Category updated" });
        },
      }
    );
  }

  function handleDelete(id: number, name: string) {
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEnergyLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEnergyByCategoryQueryKey() });
          toast({ title: "Category deleted", description: `"${name}" removed.` });
        },
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Manager</CardTitle>
        <CardDescription>Manage your subject categories for energy logging</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-2 block">Add New Category</Label>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="flex gap-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        data-testid="input-new-category"
                        placeholder="e.g., Data Structures"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createCategory.isPending} data-testid="button-add-category">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </form>
          </Form>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No categories yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0" data-testid={`category-item-${cat.id}`}>
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      data-testid={`input-edit-category-${cat.id}`}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(cat.id); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleUpdate(cat.id)} data-testid={`button-save-category-${cat.id}`}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.logCount} log{cat.logCount !== 1 ? "s" : ""}</p>
                  </div>
                )}
                {editingId !== cat.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      data-testid={`button-edit-category-${cat.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      data-testid={`button-delete-category-${cat.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardTab() {
  const { data: categories, isLoading } = useGetEnergyByCategory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Energy Dashboard</CardTitle>
        <CardDescription>Discover which courses energize you and which might lead to burnout</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Low energy (&lt; 4) - Watch for burnout</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Moderate (4–7)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> High energy (&gt; 7) - Great fit!</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No data yet</p>
            <p className="text-sm mt-1">Log energy for categorized tasks to see your dashboard</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="text-left py-2 pb-3 font-medium">Category</th>
                  <th className="text-left py-2 pb-3 font-medium">Avg Energy</th>
                  <th className="text-left py-2 pb-3 font-medium">Status</th>
                  <th className="text-left py-2 pb-3 font-medium">Sample Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat) => {
                  const { label, color } = getStatusLabel(cat.status);
                  return (
                    <tr key={cat.categoryId} data-testid={`dashboard-row-${cat.categoryId}`}>
                      <td className="py-4 font-medium">{cat.categoryName}</td>
                      <td className="py-4">
                        <span className="text-lg font-semibold">{cat.avgEnergy.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">/10</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
                          {label}
                        </span>
                      </td>
                      <td className="py-4 text-muted-foreground">{cat.logCount} log{cat.logCount !== 1 ? "s" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EnergyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("new-log");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-3xl font-serif font-medium text-primary mb-1">Energy Tracker</h1>
        <p className="text-muted-foreground">Understand your energy patterns and find courses that align with you</p>
      </section>

      <div className="border-b border-border">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab}`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "new-log" && <NewLogTab />}
      {activeTab === "history" && <HistoryTab />}
      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "dashboard" && <DashboardTab />}
    </div>
  );
}
