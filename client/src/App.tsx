import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import WeightLossQuestionnaire from "@/components/WeightLossQuestionnaire";
import PaymentTest from "@/pages/payment-test";
import Credentials from "@/pages/credentials";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={WeightLossQuestionnaire} />
      <Route path="/payment-test" component={PaymentTest} />
      <Route path="/credentials" component={Credentials} />
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
