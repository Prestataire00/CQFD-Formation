import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MissionCalendar, type CalendarView } from "@/components/MissionCalendar";
import { useMissions } from "@/hooks/use-missions";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  const { data: missions, isLoading } = useMissions();
  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Calendrier" />
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Calendrier</h1>
            </div>
            <p className="text-muted-foreground">
              Vue d'ensemble de toutes les missions planifiees
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-[calc(100vh-220px)]">
              <MissionCalendar
                missions={missions || []}
                view={view}
                onViewChange={setView}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
