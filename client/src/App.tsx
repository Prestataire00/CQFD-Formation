import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Missions from "@/pages/Missions";
import MissionDetail from "@/pages/MissionDetail";
import Clients from "@/pages/Clients";
import Participants from "@/pages/Participants";
import Feedback from "@/pages/Feedback";
import QuestionnaireResponse from "@/pages/QuestionnaireResponse";
import Users from "@/pages/Users";
import DocumentTemplates from "@/pages/DocumentTemplates";
import Calendar from "@/pages/Calendar";
import TrainerSpace from "@/pages/TrainerSpace";
import Settings from "@/pages/Settings";
import MyNotes from "@/pages/MyNotes";
import Exports from "@/pages/exports";
import { Sidebar } from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

// Placeholder components for pages not yet fully implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-background flex">
    <Sidebar />
    <main className="flex-1 lg:ml-64 flex flex-col min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <div className="p-12 border-2 border-dashed border-border rounded-xl text-center text-muted-foreground">
        Page en cours de construction
      </div>
    </main>
  </div>
);

// Protected route wrapper
function ProtectedRoute({
  component: Component,
  adminOnly = false,
  trainerOnly = false,
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
  trainerOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, isAdmin, user } = useAuth();
  const isTrainerOrPrestataire = user?.role === "formateur" || user?.role === "prestataire";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Redirect to="/" />;
  }

  if (trainerOnly && !isTrainerOrPrestataire) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/forgot-password">
        {isAuthenticated ? <Redirect to="/" /> : <ForgotPassword />}
      </Route>
      <Route path="/reset-password">
        {isAuthenticated ? <Redirect to="/" /> : <ResetPassword />}
      </Route>
      <Route path="/questionnaire/:token">
        <QuestionnaireResponse />
      </Route>

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/missions">
        <ProtectedRoute component={Missions} />
      </Route>
      <Route path="/missions/:id">
        <ProtectedRoute component={MissionDetail} />
      </Route>
      <Route path="/clients">
        <ProtectedRoute component={Clients} />
      </Route>
      <Route path="/participants">
        <ProtectedRoute component={Participants} />
      </Route>
      <Route path="/feedback">
        <ProtectedRoute component={Feedback} adminOnly />
      </Route>
      {/* Admin only routes */}
      <Route path="/users">
        <ProtectedRoute component={Users} adminOnly />
      </Route>
      <Route path="/document-templates">
        <ProtectedRoute component={DocumentTemplates} adminOnly />
      </Route>
      <Route path="/calendar">
        <ProtectedRoute component={Calendar} adminOnly />
      </Route>

      {/* Trainer/Prestataire only routes */}
      <Route path="/my-space">
        <ProtectedRoute component={TrainerSpace} trainerOnly />
      </Route>

      {/* Personal notes - accessible to all authenticated users */}
      <Route path="/my-notes">
        <ProtectedRoute component={MyNotes} />
      </Route>

      {/* Placeholder pages */}
      <Route path="/programs">
        <ProtectedRoute component={() => <PlaceholderPage title="Catalogue Formations" />} />
      </Route>
      <Route path="/trainers">
        <ProtectedRoute component={() => <PlaceholderPage title="Formateurs" />} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={() => <PlaceholderPage title="Emargements" />} />
      </Route>
      <Route path="/documents">
        <ProtectedRoute component={() => <PlaceholderPage title="Documents" />} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={() => <PlaceholderPage title="Rapports" />} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} adminOnly />
      </Route>
      <Route path="/exports">
        <ProtectedRoute component={Exports} adminOnly />
      </Route>
      <Route path="/help">
        <ProtectedRoute component={() => <PlaceholderPage title="Aide" />} />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
