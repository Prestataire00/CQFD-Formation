import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Missions from "@/pages/Missions";
import Clients from "@/pages/Clients";
import Participants from "@/pages/Participants";
import Invoices from "@/pages/Invoices";
import { Sidebar } from "@/components/Sidebar";

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

function Router() {
  return (
    <Switch>
      {/* Main pages */}
      <Route path="/" component={Dashboard} />
      <Route path="/missions" component={Missions} />
      <Route path="/missions/:id" component={() => <PlaceholderPage title="Detail Mission" />} />
      <Route path="/clients" component={Clients} />
      <Route path="/participants" component={Participants} />
      <Route path="/invoices" component={Invoices} />

      {/* Placeholder pages */}
      <Route path="/programs" component={() => <PlaceholderPage title="Catalogue Formations" />} />
      <Route path="/trainers" component={() => <PlaceholderPage title="Formateurs" />} />
      <Route path="/attendance" component={() => <PlaceholderPage title="Emargements" />} />
      <Route path="/documents" component={() => <PlaceholderPage title="Documents" />} />
      <Route path="/reports" component={() => <PlaceholderPage title="Rapports" />} />
      <Route path="/settings" component={() => <PlaceholderPage title="Parametres" />} />
      <Route path="/help" component={() => <PlaceholderPage title="Aide" />} />

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
