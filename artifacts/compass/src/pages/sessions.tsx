import { useState } from "react";
import {
  useGetSessions,
  useUpdateSession,
  getGetSessionsQueryKey,
  getGetDashboardSummaryQueryKey,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { format, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function getStatusConfig(status: string) {
  switch (status) {
    case "completed":
      return { label: "Completed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 };
    case "cancelled":
      return { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle };
    default:
      return { label: "Scheduled", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock };
  }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function SessionCard({ session }: { session: any }) {
  const [showCancel, setShowCancel] = useState(false);
  const updateSession = useUpdateSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const statusCfg = getStatusConfig(session.status);
  const StatusIcon = statusCfg.icon;

  function handleMarkComplete() {
    updateSession.mutate(
      { id: session.id, data: { status: "completed" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSessionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ title: "Session marked complete" });
        },
      }
    );
  }

  function handleCancel() {
    updateSession.mutate(
      { id: session.id, data: { status: "cancelled" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSessionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setShowCancel(false);
          toast({ title: "Session cancelled" });
        },
      }
    );
  }

  return (
    <>
      <Card data-testid={`session-card-${session.id}`} className="hover:shadow-sm transition-shadow">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
              {getInitials(session.mentorName || "?")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-medium text-sm">{session.mentorName}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs">{session.mentorMajor}</span>
              </div>
              <p className="text-sm text-foreground font-medium mb-2">{session.topic}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(session.scheduledAt), "MMM d, yyyy · h:mm a")}</span>
                </div>
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}
                  data-testid={`session-status-${session.id}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </span>
              </div>
              {session.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">{session.notes}</p>
              )}
            </div>
            {session.status === "scheduled" && (
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkComplete}
                  disabled={updateSession.isPending}
                  data-testid={`button-complete-${session.id}`}
                >
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowCancel(true)}
                  data-testid={`button-cancel-${session.id}`}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCancel} onOpenChange={(v) => !v && setShowCancel(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your session with {session.mentorName}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={updateSession.isPending}
              data-testid="button-confirm-cancel"
            >
              {updateSession.isPending ? "Cancelling..." : "Yes, Cancel"}
            </Button>
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Keep Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function SessionsPage() {
  const { data: sessions, isLoading } = useGetSessions();
  const now = new Date();

  const upcoming = sessions?.filter((s) => s.status === "scheduled" && isAfter(new Date(s.scheduledAt), now));
  const past = sessions?.filter((s) => s.status !== "scheduled" || !isAfter(new Date(s.scheduledAt), now));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-3xl font-serif font-medium text-primary mb-1">My Sessions</h1>
        <p className="text-muted-foreground">Your mentoring sessions, past and upcoming</p>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">No sessions yet</p>
          <p className="text-sm mt-1">Head to the Mentors page to book your first session</p>
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming" data-testid="tab-sessions-upcoming">
              Upcoming {upcoming && upcoming.length > 0 && `(${upcoming.length})`}
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-sessions-past">
              Past {past && past.length > 0 && `(${past.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {!upcoming || upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No upcoming sessions</p>
                </CardContent>
              </Card>
            ) : (
              upcoming.map((s) => <SessionCard key={s.id} session={s} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-4">
            {!past || past.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <p>No past sessions</p>
                </CardContent>
              </Card>
            ) : (
              past.map((s) => <SessionCard key={s.id} session={s} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
