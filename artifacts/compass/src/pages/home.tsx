import { useGetDashboardSummary, useGetRecentActivity, useGetMajorRecommendations } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Battery, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { data: recommendations, isLoading: isLoadingRecommendations } = useGetMajorRecommendations();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section>
        <h1 className="text-3xl font-serif font-medium text-primary mb-2">Welcome to Compass</h1>
        <p className="text-muted-foreground">Your guide to finding alignment between your energy and your path.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalLogs || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total tasks logged</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Energy</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.avgEnergyOverall?.toFixed(1) || "-"}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Out of 10</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.streak || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Days in a row</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.upcomingSessions || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Scheduled mentorships</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Top Recommendation</CardTitle>
            <CardDescription>Based on your recent energy patterns</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoadingRecommendations ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium">{recommendations[0].majorName}</h3>
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {recommendations[0].matchScore}% Match
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{recommendations[0].reasoning}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {recommendations[0].topCategories.map(cat => (
                    <span key={cat} className="px-2 py-1 rounded-md bg-secondary/10 text-secondary-foreground text-xs font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No recommendations yet</p>
                  <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mt-1">
                    Log more tasks in the Energy Tracker to unlock AI-powered major recommendations.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest tracked tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{log.taskName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {log.categoryName && (
                          <span className="text-xs text-muted-foreground">{log.categoryName}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(log.loggedAt), 'MMM d')}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                      log.energyLevel >= 7 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      log.energyLevel <= 4 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      Level {log.energyLevel}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No recent activity found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}