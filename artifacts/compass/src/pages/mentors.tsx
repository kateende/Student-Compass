import { useState } from "react";
import {
  useGetMentors,
  useCreateSession,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Star, BookOpen, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

const sessionSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  scheduledAt: z.string().min(1, "Date/time is required"),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function BookSessionDialog({
  mentor,
  open,
  onClose,
}: {
  mentor: { id: number; name: string; major: string };
  open: boolean;
  onClose: () => void;
}) {
  const createSession = useCreateSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const defaultDate = format(addDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm");

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      topic: "",
      scheduledAt: defaultDate,
    },
  });

  function onSubmit(values: SessionFormValues) {
    createSession.mutate(
      {
        data: {
          mentorId: mentor.id,
          topic: values.topic,
          scheduledAt: new Date(values.scheduledAt).toISOString(),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSessionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ title: "Session booked!", description: `Scheduled with ${mentor.name}` });
          form.reset({ topic: "", scheduledAt: defaultDate });
          onClose();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to book session.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Session</DialogTitle>
          <DialogDescription>Schedule time with {mentor.name} ({mentor.major})</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you want to discuss?</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-session-topic"
                      placeholder="e.g., Career pivot advice, study strategies..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date and Time</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-session-date"
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createSession.isPending}
                data-testid="button-book-session"
              >
                {createSession.isPending ? "Booking..." : "Book Session"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function MentorsPage() {
  const [search, setSearch] = useState("");
  const [bookingMentor, setBookingMentor] = useState<{
    id: number;
    name: string;
    major: string;
  } | null>(null);

  const { data: mentors, isLoading } = useGetMentors();

  const filtered = mentors?.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.major.toLowerCase().includes(search.toLowerCase()) ||
      m.year.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section>
        <h1 className="text-3xl font-serif font-medium text-primary mb-1">Mentors</h1>
        <p className="text-muted-foreground">
          Connect with near-peer mentors who have walked your path
        </p>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-mentors"
          placeholder="Search by name, major, or year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No mentors found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((mentor) => (
            <Card
              key={mentor.id}
              className={`transition-shadow hover:shadow-md ${!mentor.isAvailable ? "opacity-70" : ""}`}
              data-testid={`mentor-card-${mentor.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {getInitials(mentor.name)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{mentor.name}</CardTitle>
                      <CardDescription>
                        {mentor.major} · {mentor.year}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={mentor.isAvailable ? "default" : "secondary"} className="shrink-0">
                    {mentor.isAvailable ? "Available" : "Busy"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio}</p>

                <div className="flex flex-wrap gap-1.5">
                  {mentor.strengths.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary-foreground text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {mentor.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {mentor.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {mentor.sessionCount} session{mentor.sessionCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={!mentor.isAvailable}
                    onClick={() =>
                      setBookingMentor({ id: mentor.id, name: mentor.name, major: mentor.major })
                    }
                    data-testid={`button-book-${mentor.id}`}
                  >
                    Book Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {bookingMentor && (
        <BookSessionDialog
          mentor={bookingMentor}
          open={!!bookingMentor}
          onClose={() => setBookingMentor(null)}
        />
      )}
    </div>
  );
}
