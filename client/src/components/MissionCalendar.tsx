import { useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Mission, MissionSession, MissionStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

export type CalendarView = "day" | "week" | "month";

interface MissionCalendarProps {
  missions: Mission[];
  sessions?: MissionSession[];
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

// Status colors matching the existing design in Missions.tsx
const statusColors: Record<MissionStatus, string> = {
  draft: "bg-slate-200 text-slate-700 border-slate-300",
  confirmed: "bg-blue-200 text-blue-800 border-blue-300",
  in_progress: "bg-violet-200 text-violet-800 border-violet-300",
  completed: "bg-green-200 text-green-800 border-green-300",
  cancelled: "bg-red-200 text-red-700 border-red-300",
};

const statusLabels: Record<MissionStatus, string> = {
  draft: "Brouillon",
  confirmed: "Confirmee",
  in_progress: "En cours",
  completed: "Terminee",
  cancelled: "Annulee",
};

function getMissionsForDate(missions: Mission[], date: Date, sessionsByMission?: Record<number, MissionSession[]>): Mission[] {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return missions.filter((mission) => {
    // If we have session data, match on individual session dates
    if (sessionsByMission && sessionsByMission[mission.id]?.length > 0) {
      return sessionsByMission[mission.id].some((session) => {
        const sessionDate = new Date(session.sessionDate);
        const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
        return dateOnly.getTime() === sessionDateOnly.getTime();
      });
    }

    // Fallback: use startDate/endDate range
    const missionDate = mission.endDate ? new Date(mission.endDate) : mission.startDate ? new Date(mission.startDate) : null;
    if (!missionDate) return false;
    const missionDateOnly = new Date(missionDate.getFullYear(), missionDate.getMonth(), missionDate.getDate());
    return dateOnly.getTime() === missionDateOnly.getTime();
  });
}

function MissionItem({ mission, compact = false }: { mission: Mission; compact?: boolean }) {
  const [, setLocation] = useLocation();
  const status = mission.status as MissionStatus;

  const handleClick = () => {
    setLocation(`/missions/${mission.id}`);
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity border",
          statusColors[status] || statusColors.draft
        )}
        title={mission.title}
      >
        {mission.title}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-3 rounded-lg cursor-pointer hover:shadow-md transition-all border",
        statusColors[status] || statusColors.draft
      )}
    >
      <div className="font-medium text-sm">{mission.title}</div>
      {mission.reference && (
        <div className="text-xs opacity-75 mt-0.5">{mission.reference}</div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="text-xs">
          {statusLabels[status] || "Brouillon"}
        </Badge>
        {mission.startDate && (
          <span className="text-xs opacity-75">
            {format(new Date(mission.startDate), "HH:mm", { locale: fr })}
          </span>
        )}
      </div>
    </div>
  );
}

// Month View Component
function MonthView({
  missions,
  sessionsByMission,
  selectedDate,
  onDateChange,
}: {
  missions: Mission[];
  sessionsByMission?: Record<number, MissionSession[]>;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dayMissions = getMissionsForDate(missions, day, sessionsByMission);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-b border-r border-border p-1 min-h-[100px] overflow-hidden",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5 overflow-y-auto max-h-[80px]">
                {dayMissions.slice(0, 3).map((mission) => (
                  <MissionItem key={mission.id} mission={mission} compact />
                ))}
                {dayMissions.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayMissions.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({
  missions,
  sessionsByMission,
  selectedDate,
}: {
  missions: Mission[];
  sessionsByMission?: Record<number, MissionSession[]>;
  selectedDate: Date;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "py-3 text-center border-r border-border last:border-r-0",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-sm text-muted-foreground">
                {format(day, "EEE", { locale: fr })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day columns with missions */}
      <div className="flex-1 grid grid-cols-7 overflow-y-auto">
        {days.map((day) => {
          const dayMissions = getMissionsForDate(missions, day, sessionsByMission);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-border last:border-r-0 p-2 space-y-2 min-h-[400px]",
                isToday && "bg-primary/5"
              )}
            >
              {dayMissions.map((mission) => (
                <MissionItem key={mission.id} mission={mission} />
              ))}
              {dayMissions.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Aucune mission
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day View Component
function DayView({
  missions,
  sessionsByMission,
  selectedDate,
}: {
  missions: Mission[];
  sessionsByMission?: Record<number, MissionSession[]>;
  selectedDate: Date;
}) {
  const dayMissions = getMissionsForDate(missions, selectedDate, sessionsByMission);
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="flex flex-col h-full p-4">
      {/* Day header */}
      <div className={cn("mb-6 pb-4 border-b border-border", isToday && "bg-primary/5 -mx-4 px-4 -mt-4 pt-4 rounded-t-lg")}>
        <div className="text-muted-foreground text-sm">
          {format(selectedDate, "EEEE", { locale: fr })}
        </div>
        <div className="text-3xl font-bold">
          {format(selectedDate, "d MMMM yyyy", { locale: fr })}
        </div>
        {isToday && (
          <Badge className="mt-2 bg-primary">Aujourd'hui</Badge>
        )}
      </div>

      {/* Missions list */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {dayMissions.length > 0 ? (
          dayMissions.map((mission) => (
            <MissionItem key={mission.id} mission={mission} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">Aucune mission ce jour</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MissionCalendar({
  missions,
  sessions,
  view,
  onViewChange,
  selectedDate,
  onDateChange,
}: MissionCalendarProps) {
  // Build sessionsByMission map
  const sessionsByMission = useMemo(() => {
    if (!sessions || sessions.length === 0) return undefined;
    const map: Record<number, MissionSession[]> = {};
    for (const s of sessions) {
      if (!map[s.missionId]) map[s.missionId] = [];
      map[s.missionId].push(s);
    }
    return map;
  }, [sessions]);

  // Navigation handlers
  const navigatePrevious = () => {
    switch (view) {
      case "month":
        onDateChange(subMonths(selectedDate, 1));
        break;
      case "week":
        onDateChange(subWeeks(selectedDate, 1));
        break;
      case "day":
        onDateChange(subDays(selectedDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case "month":
        onDateChange(addMonths(selectedDate, 1));
        break;
      case "week":
        onDateChange(addWeeks(selectedDate, 1));
        break;
      case "day":
        onDateChange(addDays(selectedDate, 1));
        break;
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  // Format period display based on view
  const getPeriodLabel = () => {
    switch (view) {
      case "month":
        return format(selectedDate, "MMMM yyyy", { locale: fr });
      case "week": {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, "d")} - ${format(weekEnd, "d MMMM yyyy", { locale: fr })}`;
        }
        return `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;
      }
      case "day":
        return format(selectedDate, "EEEE d MMMM yyyy", { locale: fr });
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-lg font-semibold capitalize ml-2">
            {getPeriodLabel()}
          </span>
        </div>

        <Select value={view} onValueChange={(v) => onViewChange(v as CalendarView)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-violet-100 border-violet-300">
            <SelectItem value="day" className="focus:bg-violet-200">Jour</SelectItem>
            <SelectItem value="week" className="focus:bg-violet-200">Semaine</SelectItem>
            <SelectItem value="month" className="focus:bg-violet-200">Mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        {view === "month" && (
          <MonthView
            missions={missions}
            sessionsByMission={sessionsByMission}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        )}
        {view === "week" && (
          <WeekView missions={missions} sessionsByMission={sessionsByMission} selectedDate={selectedDate} />
        )}
        {view === "day" && (
          <DayView missions={missions} sessionsByMission={sessionsByMission} selectedDate={selectedDate} />
        )}
      </div>
    </div>
  );
}
