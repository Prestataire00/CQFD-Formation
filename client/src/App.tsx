import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Tasks from "@/pages/Tasks";

// Placeholder components for pages not yet fully implemented but required for navigation
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-background flex">
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl hidden lg:block" />
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
      <Route path="/" component={Dashboard} />
      <Route path="/home" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/documents" component={() => <PlaceholderPage title="Documents" />} />
      <Route path="/messages" component={() => <PlaceholderPage title="Messagerie" />} />
      <Route path="/invoices" component={() => <PlaceholderPage title="Factures" />} />
      <Route path="/ai-assistant" component={() => <PlaceholderPage title="Assistant IA" />} />
      <Route path="/settings" component={() => <PlaceholderPage title="Paramètres" />} />
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
