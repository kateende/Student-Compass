import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Compass, Zap, Users, Sparkles } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-semibold text-primary">Compass</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/sign-in")}>
            Sign in
          </Button>
          <Button onClick={() => navigate("/sign-up")}>
            Get started
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Your student lifecycle platform
          </div>

          <h1 className="text-5xl md:text-6xl font-serif font-medium text-primary leading-tight">
            Find your path,<br />track your energy
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Compass helps you log energy levels, discover mentors, and get AI-driven guidance on which major fits your natural strengths.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" onClick={() => navigate("/sign-up")} className="px-8">
              Start for free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/sign-in")}>
              Sign in
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-20 text-left">
          {[
            {
              icon: Zap,
              title: "Energy Tracker",
              desc: "Log tasks with 1–10 energy ratings. Discover which work drains you and which makes you thrive.",
            },
            {
              icon: Users,
              title: "Near-Peer Mentors",
              desc: "Connect with students one or two years ahead of you. Book sessions with people who've walked your path.",
            },
            {
              icon: Sparkles,
              title: "Major Recommendations",
              desc: "AI analyzes your energy patterns and recommends majors aligned with your natural engagement.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} Compass — Student Lifecycle Platform
      </footer>
    </div>
  );
}
