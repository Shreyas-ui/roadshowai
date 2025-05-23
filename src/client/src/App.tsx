import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Registration from "@/pages/registration";
import QueueManagement from "@/pages/queue-management";
import TokenReassignment from "@/pages/token-reassignment";
import Dashboard from "@/pages/dashboard";
import Header from "@/components/header";
import NavigationTabs from "@/components/navigation-tabs";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/registration" component={Registration} />
      <Route path="/queue-management" component={QueueManagement} />
      <Route path="/token-reassignment" component={TokenReassignment} />
      <Route path="/tv" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isTvMode = location === "/tv";
  
  return (
    <TooltipProvider>
      <div className={`flex flex-col h-screen ${isTvMode ? 'bg-gray-100' : ''}`}>
        {!isTvMode && <Header />}
        {!isTvMode && <NavigationTabs />}
        <main className={`flex-1 overflow-y-auto ${isTvMode ? '' : 'bg-gray-100'}`}>
          {isTvMode ? (
            <Router />
          ) : (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Router />
            </div>
          )}
        </main>
        <Toaster />
        {isTvMode && (
          <div className="fixed bottom-0 right-0 m-4 p-2 bg-black bg-opacity-50 text-white text-xs rounded">
            AI Roadshow Status Board - {new Date().toLocaleDateString()}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default App;
