import { useEffect, useRef } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import EnergyPage from "@/pages/energy";
import MentorsPage from "@/pages/mentors";
import SessionsPage from "@/pages/sessions";
import Recommendations from "@/pages/recommendations";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const demoEmail = import.meta.env.VITE_CLERK_USER_EMAIL;
const demoPassword = import.meta.env.VITE_CLERK_USER_PASSWORD;

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(145, 35%, 25%)",
    colorForeground: "hsl(210, 20%, 20%)",
    colorMutedForeground: "hsl(210, 10%, 45%)",
    colorDanger: "hsl(0, 60%, 50%)",
    colorBackground: "hsl(40, 40%, 98%)",
    colorInput: "hsl(40, 33%, 96%)",
    colorInputForeground: "hsl(210, 20%, 20%)",
    colorNeutral: "hsl(40, 20%, 85%)",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(40,40%,98%)] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-[hsl(40,20%,88%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-[hsl(145,35%,25%)] text-2xl",
    headerSubtitle: "text-[hsl(210,10%,45%)]",
    socialButtonsBlockButtonText: "text-[hsl(210,20%,20%)] font-medium",
    formFieldLabel: "text-[hsl(210,20%,20%)] font-medium",
    footerActionLink: "text-[hsl(145,35%,25%)] font-medium hover:text-[hsl(145,35%,18%)]",
    footerActionText: "text-[hsl(210,10%,45%)]",
    dividerText: "text-[hsl(210,10%,45%)]",
    identityPreviewEditButton: "text-[hsl(145,35%,25%)]",
    formFieldSuccessText: "text-[hsl(145,35%,25%)]",
    alertText: "text-[hsl(210,20%,20%)]",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-[hsl(40,20%,85%)] bg-[hsl(40,33%,96%)] hover:bg-[hsl(40,20%,92%)]",
    formButtonPrimary: "bg-[hsl(145,35%,25%)] hover:bg-[hsl(145,35%,20%)] text-[hsl(40,33%,96%)] font-semibold",
    formFieldInput: "bg-[hsl(40,33%,96%)] border-[hsl(40,20%,85%)] text-[hsl(210,20%,20%)]",
    footerAction: "border-t border-[hsl(40,20%,88%)]",
    dividerLine: "bg-[hsl(40,20%,85%)]",
    alert: "border border-[hsl(40,20%,88%)]",
    otpCodeFieldInput: "border-[hsl(40,20%,85%)] bg-[hsl(40,33%,96%)]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px] space-y-3">
        {demoEmail && demoPassword && (
          <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground">
            Demo login: <span className="font-medium text-foreground">{demoEmail}</span> / <span className="font-medium text-foreground">{demoPassword}</span>
          </div>
        )}
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          fallbackRedirectUrl={`${basePath}/dashboard`}
          appearance={clerkAppearance}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/energy">
        <ProtectedRoute component={EnergyPage} />
      </Route>
      <Route path="/mentors">
        <ProtectedRoute component={MentorsPage} />
      </Route>
      <Route path="/sessions">
        <ProtectedRoute component={SessionsPage} />
      </Route>
      <Route path="/recommendations">
        <ProtectedRoute component={Recommendations} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/dashboard`}
      signUpFallbackRedirectUrl={`${basePath}/dashboard`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue your journey",
          },
        },
        signUp: {
          start: {
            title: "Join Compass",
            subtitle: "Start tracking your energy and finding your path",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
