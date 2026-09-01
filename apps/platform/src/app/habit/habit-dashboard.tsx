"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@atlas/ui/components/button"
import { Badge } from "@atlas/ui/components/badge"
import { habitApi, HabitTracker } from "@atlas/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CreateHabitDialog } from "./components/create-habit-dialog"
import { QuickCheckinDialog } from "./components/quick-checkin-dialog"
import { HabitDetailSheet } from "./components/habit-detail-sheet"
import { HabitHeatmap } from "./components/habit-heatmap"
import { HabitCommandPalette } from "./components/habit-command-palette"
import { StandardWorkspaceHeader } from "@/components/workspace-header"
import { ModuleContainer } from "@/components/module-container"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Plus,
  Flame,
  Check,
  Command,
  CalendarCheck,
  Lightning,
  Sparkle,
  BellRinging,
  SlidersHorizontal,
  FolderSimple,
  ChartPie,
  SquaresFour,
} from "@phosphor-icons/react"
import {
  HabitCategoryPieChart,
  HabitCategoryRadarChart,
  WeeklyTrendChart,
} from "./components/habit-charts"
import { HabitSidebarFilters } from "./components/habit-sidebar-filters"

export function HabitDashboard() {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [activeView, setActiveView] = useState<"trackers" | "analytics">(
    "trackers"
  )

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isQuickCheckinOpen, setIsQuickCheckinOpen] = useState(false)
  const [activeCheckinHabitId, setActiveCheckinHabitId] = useState<
    string | undefined
  >(undefined)
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)

  // TanStack Query for fetching dashboard summary
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["habit-dashboard"],
    queryFn: () => habitApi.getDashboardSummary(),
  })

  // 1-Tap Toggle Boolean / Quick Add Stepper Mutation
  const logMutation = useMutation({
    mutationFn: (variables: {
      trackerId: string
      date: string
      value: number
    }) =>
      habitApi.logEntry(variables.trackerId, {
        date: variables.date,
        value: variables.value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["habits"] })
      toast.success("Habit entry updated!")
    },
    onError: () => {
      toast.error("Failed to log habit entry")
    },
  })

  // Global Keyboard listener for Cmd+K / Ctrl+K Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleQuickCheckinSingle = (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveCheckinHabitId(habitId)
    setIsQuickCheckinOpen(true)
  }

  const handle1TapToggleBoolean = (
    tracker: HabitTracker,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    const todayStr = new Date().toISOString().split("T")[0] || ""
    const isCompleted = tracker.isCompletedToday
    const newValue = isCompleted ? 0 : 1

    logMutation.mutate({
      trackerId: tracker.id,
      date: todayStr,
      value: newValue,
    })
  }

  const handleQuickAddValue = (
    tracker: HabitTracker,
    step: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    const todayStr = new Date().toISOString().split("T")[0] || ""
    const currentValue = tracker.todayEntry?.value || 0
    const newValue = currentValue + step

    logMutation.mutate({
      trackerId: tracker.id,
      date: todayStr,
      value: newValue,
    })
  }

  const filteredTrackers = (dashboardData?.trackers || []).filter((t) => {
    if (selectedCategory === "ALL") return true
    return t.category.toUpperCase() === selectedCategory.toUpperCase()
  })

  const categories = [
    "ALL",
    "Health",
    "Learning",
    "Productivity",
    "Lifestyle",
    "Finance",
  ]

  // ponytail: direct layout structure, no middleman GlobalModuleLayout wrapper
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-brand-canvas">
      {/* Pinned Top Workspace Nav Header */}
      <div className="z-30 shrink-0 bg-brand-canvas pt-6">
        <ModuleContainer>
          <StandardWorkspaceHeader
            moduleName="Habit"
            moduleInitial="H"
            moduleSubtitle="Gustam Platform · Workspace"
          />
        </ModuleContainer>
      </div>

      {/* Main Body Layout Container */}
      <div className="flex-1 overflow-hidden py-6">
        <ModuleContainer className="h-full">
          <div className="grid h-full grid-cols-1 items-start gap-8 md:grid-cols-4">
            {/* Left Pinned Sidebar (1 col) */}
            <aside className="h-full overflow-y-auto pr-2 md:col-span-1">
              <HabitSidebarFilters
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onOpenCreate={() => setIsCreateOpen(true)}
                dashboardData={dashboardData}
              />
            </aside>

            {/* Main Independent Scrollable Content Area (3 cols) */}
            <section className="h-full space-y-6 overflow-y-auto pr-2 md:col-span-3">
              {/* Cabinet Style Page Header Card */}
              <div className="space-y-4 border border-brand-border bg-white p-6 dark:bg-card">
                <div className="flex flex-col justify-between gap-4 border-b border-brand-border pb-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-serif text-2xl font-medium tracking-tight text-brand-charcoal">
                      Habit Workspace Overview
                    </h2>
                    <p className="mt-1 max-w-xl font-sans text-xs text-brand-muted">
                      Track custom habits, daily behaviors, workouts, reading
                      goals, and limit trackers with full year heatmaps and
                      &lt;5s fast check-ins.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-brand-border bg-muted/40 p-0.5">
                      <Button
                        type="button"
                        variant={
                          activeView === "trackers" ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setActiveView("trackers")}
                        className="h-7 gap-1.5 rounded-none px-2.5 font-mono text-xs"
                      >
                        <SquaresFour className="size-3.5" /> Trackers
                      </Button>
                      <Button
                        type="button"
                        variant={
                          activeView === "analytics" ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setActiveView("analytics")}
                        className="h-7 gap-1.5 rounded-none px-2.5 font-mono text-xs"
                      >
                        <ChartPie className="size-3.5" /> Analytics
                      </Button>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-none border-brand-border px-2.5 py-1 font-mono text-xs uppercase"
                    >
                      <Sparkle className="mr-1 size-3.5 text-emerald-500" />{" "}
                      Fast Engine Active
                    </Badge>
                  </div>
                </div>

                {/* 3 Bento Stats Grid */}
                <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-3">
                  <div className="space-y-1 border border-brand-border bg-brand-canvas/50 p-4">
                    <span className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
                      Today&apos;s Progress
                    </span>
                    <div className="font-serif text-2xl font-semibold text-brand-charcoal">
                      {dashboardData
                        ? `${Math.round(dashboardData.todayProgressRate)}%`
                        : "0%"}
                    </div>
                    <p className="font-mono text-[11px] text-brand-muted">
                      {dashboardData?.completedTodayCount || 0} of{" "}
                      {dashboardData?.totalTrackers || 0} completed
                    </p>
                  </div>

                  <div className="space-y-1 border border-brand-border bg-brand-canvas/50 p-4">
                    <span className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
                      Active Trackers
                    </span>
                    <div className="font-serif text-2xl font-semibold text-brand-charcoal">
                      {dashboardData?.totalTrackers || 0}
                    </div>
                    <p className="font-mono text-[11px] text-brand-muted">
                      Configured across {categories.length - 1} categories
                    </p>
                  </div>

                  <div className="space-y-1 border border-brand-border bg-brand-canvas/50 p-4">
                    <span className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
                      Consistency Score
                    </span>
                    <div className="font-serif text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      High
                    </div>
                    <p className="font-mono text-[11px] text-brand-muted">
                      TanStack Query &amp; Form Engine
                    </p>
                  </div>
                </div>
              </div>

              {/* 365-Day Aggregated Contribution Heatmap */}
              {dashboardData && (
                <HabitHeatmap
                  data={dashboardData.aggregatedHeatmap}
                  title="Atlas Habit — Full Year Aggregated Heatmap"
                />
              )}

              {/* Analytics Overview Section when activeView === 'analytics' */}
              {activeView === "analytics" && dashboardData && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <div className="flex items-center gap-2">
                      <ChartPie className="size-4 text-brand-charcoal" />
                      <h3 className="font-serif text-lg font-medium text-brand-charcoal">
                        Dashboard Overview Analytics (Section 7 Charts)
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3 border border-brand-border bg-white p-5 dark:bg-card">
                      <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                        Category Distribution (Pie Chart)
                      </h4>
                      <HabitCategoryPieChart
                        data={dashboardData.categoryDistribution || []}
                      />
                    </div>

                    <div className="space-y-3 border border-brand-border bg-white p-5 dark:bg-card">
                      <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                        Category Balance (Radar Chart)
                      </h4>
                      <HabitCategoryRadarChart
                        data={dashboardData.categoryDistribution || []}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border border-brand-border bg-white p-5 dark:bg-card">
                    <h4 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                      Overall 14-Day Completion Trend (Bar Chart)
                    </h4>
                    <WeeklyTrendChart data={dashboardData.weeklyTrend || []} />
                  </div>
                </div>
              )}

              {activeView === "trackers" && (
                <>
                  {/* Section Title & Filter Indicator */}
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="size-4 text-brand-charcoal" />
                      <h3 className="font-serif text-lg font-medium text-brand-charcoal">
                        {selectedCategory === "ALL"
                          ? "All Habit Trackers"
                          : `${selectedCategory} Trackers`}
                      </h3>
                    </div>

                    <span className="font-mono text-xs text-brand-muted">
                      Showing {filteredTrackers.length} Trackers
                    </span>
                  </div>
                </>
              )}

              {/* Trackers Grid (Cabinet Card Style) */}
              {isLoading ? (
                <div className="animate-pulse border border-brand-border bg-white py-20 text-center font-mono text-xs text-brand-muted dark:bg-card">
                  Loading custom habit trackers...
                </div>
              ) : filteredTrackers.length === 0 ? (
                <div className="space-y-3 border border-dashed border-brand-border bg-white p-12 text-center dark:bg-card">
                  <CalendarCheck className="mx-auto size-10 text-brand-muted" />
                  <h3 className="font-serif text-base font-medium">
                    No habit trackers found
                  </h3>
                  <p className="mx-auto max-w-sm font-mono text-xs text-brand-muted">
                    Create your custom habit tracker — track smoking, workouts,
                    reading, water intake, or any custom habit!
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-2 gap-1.5 rounded-none bg-brand-charcoal font-mono text-xs text-brand-canvas"
                  >
                    <Plus className="size-4" /> Create Custom Tracker
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTrackers.map((tracker) => {
                    const isCompleted = tracker.isCompletedToday
                    const todayVal = tracker.todayEntry?.value || 0
                    const steppers = tracker.quickSteppers || [1, 5]

                    return (
                      <div
                        key={tracker.id}
                        onClick={() => setSelectedHabitId(tracker.id)}
                        className="group flex cursor-pointer flex-col justify-between space-y-4 rounded-none border border-brand-border bg-white p-4 transition-all hover:border-brand-charcoal dark:bg-card"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">
                                {tracker.icon || "📌"}
                              </span>
                              <span className="font-sans text-sm font-semibold text-brand-charcoal group-hover:underline">
                                {tracker.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="rounded-none border-brand-border px-1.5 py-0 font-mono text-[9px] uppercase"
                              >
                                {tracker.category}
                              </Badge>
                              <span className="font-mono text-[11px] text-brand-muted">
                                Target:{" "}
                                {tracker.goalDirection === "DECREASING"
                                  ? "≤"
                                  : "≥"}{" "}
                                {tracker.goalValue} {tracker.goalUnit || "unit"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={isCompleted ? "default" : "secondary"}
                              className={cn(
                                "gap-1 rounded-none font-mono text-[10px]",
                                isCompleted
                                  ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : "border border-brand-border"
                              )}
                            >
                              {isCompleted ? (
                                <Check className="size-3" />
                              ) : null}
                              {isCompleted ? "Completed" : "Pending"}
                            </Badge>
                            {tracker.todayEntry && (
                              <span className="font-mono text-[10px] font-bold text-brand-muted">
                                Logged: {todayVal} {tracker.goalUnit || ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {tracker.reminderTime && (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                            <BellRinging className="size-3" /> Daily Reminder at{" "}
                            {tracker.reminderTime}
                          </div>
                        )}

                        {/* Actions & Quick Steppers Input Bar */}
                        <div className="flex items-center justify-between gap-2 border-t border-brand-border pt-3">
                          <span className="flex items-center gap-1 font-mono text-[11px] text-brand-muted">
                            <Flame className="size-3.5 text-amber-500" />
                            Streak: {tracker.todayEntry ? "Active" : "0 d"}
                          </span>

                          {tracker.type === "BOOLEAN" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant={isCompleted ? "outline" : "default"}
                              onClick={(e) =>
                                handle1TapToggleBoolean(tracker, e)
                              }
                              disabled={logMutation.isPending}
                              className="h-8 gap-1.5 rounded-none font-mono text-xs"
                            >
                              <Check className="size-3.5" />
                              {isCompleted ? "Done" : "1-Tap Log"}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1">
                              {steppers.map((step) => (
                                <Button
                                  key={step}
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) =>
                                    handleQuickAddValue(tracker, step, e)
                                  }
                                  disabled={logMutation.isPending}
                                  className="h-7 rounded-none border border-brand-border px-2 font-mono text-[11px] font-semibold"
                                >
                                  +{step}
                                </Button>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) =>
                                  handleQuickCheckinSingle(tracker.id, e)
                                }
                                className="h-7 rounded-none border-brand-border px-2 font-mono text-[11px]"
                              >
                                Log &gt;
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </ModuleContainer>
      </div>

      {/* Modals & Command Palette */}
      <HabitCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        trackers={dashboardData?.trackers || []}
        onSelectHabitCheckin={(habitId) => {
          setActiveCheckinHabitId(habitId)
          setIsQuickCheckinOpen(true)
        }}
        onOpenCreateDialog={() => setIsCreateOpen(true)}
        onFilterCategory={(cat) => setSelectedCategory(cat)}
      />

      <CreateHabitDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <QuickCheckinDialog
        open={isQuickCheckinOpen}
        onOpenChange={setIsQuickCheckinOpen}
        trackers={dashboardData?.trackers || []}
        selectedTrackerId={activeCheckinHabitId || undefined}
      />

      <HabitDetailSheet
        open={!!selectedHabitId}
        onOpenChange={(open) => !open && setSelectedHabitId(null)}
        habitId={selectedHabitId}
      />
    </div>
  )
}
