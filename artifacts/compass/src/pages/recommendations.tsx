import { useGetMajorRecommendations } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Briefcase, BookOpen, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Recommendations() {
  const { data: recommendations, isLoading } = useGetMajorRecommendations();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-serif font-medium text-primary mb-2">Your Path Recommendations</h1>
        <p className="text-muted-foreground">
          Based on your energy patterns and task history, we've identified paths that align with your natural strengths.
        </p>
      </section>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <div className="space-y-6">
          {recommendations.map((rec, index) => (
            <Card key={rec.id} className={`overflow-hidden ${index === 0 ? 'border-primary/50 shadow-md' : ''}`}>
              {index === 0 && (
                <div className="bg-primary px-4 py-1.5 text-primary-foreground text-xs font-medium flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Top Match
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-serif text-primary">{rec.majorName}</CardTitle>
                    <CardDescription className="mt-2 text-base max-w-3xl">
                      {rec.reasoning}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-3xl font-bold text-primary">{rec.matchScore}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Alignment</div>
                  </div>
                </div>
                <Progress value={rec.matchScore} className="h-2 mt-4" />
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Target className="h-4 w-4 text-secondary" />
                    Aligned Categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rec.topCategories.map(cat => (
                      <span key={cat} className="px-2.5 py-1 rounded-md bg-secondary/10 text-secondary-foreground text-xs font-medium border border-secondary/20">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Potential Career Paths
                  </div>
                  <ul className="space-y-2">
                    {rec.careerPaths.map(path => (
                      <li key={path} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                        {path}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">Keep Logging Your Energy</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We need a bit more data about what gives you energy and what drains it before we can make confident recommendations. Try logging your tasks for a few more days.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}