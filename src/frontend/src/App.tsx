import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import AdminPage from "./pages/AdminPage";
import CheckInPage from "./pages/CheckInPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000 },
  },
});

export type AppView = "checkin" | "admin";

export default function App() {
  const [view, setView] = useState<AppView>("checkin");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        {view === "checkin" ? (
          <CheckInPage onNavigateAdmin={() => setView("admin")} />
        ) : (
          <AdminPage onNavigateBack={() => setView("checkin")} />
        )}
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
