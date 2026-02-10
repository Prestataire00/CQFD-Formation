import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { useParticipants, useMissions } from "@/hooks/use-missions";

export default function Participants() {
  const { data: participants, isLoading } = useParticipants();
  const { data: missions } = useMissions();
  const [searchTerm, setSearchTerm] = useState("");

  // Build a map of missionId -> mission for quick lookup
  const missionMap = useMemo(() => {
    const map = new Map<number, any>();
    missions?.forEach((m: any) => map.set(m.id, m));
    return map;
  }, [missions]);

  // Filter participants based on search term
  const filteredParticipants = useMemo(() => {
    return participants?.filter((p: any) => {
      const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.phone?.toLowerCase().includes(searchLower) ||
        p.company?.toLowerCase().includes(searchLower) ||
        p.address?.toLowerCase().includes(searchLower)
      );
    }) || [];
  }, [participants, searchTerm]);

  // Group participants by mission
  const participantsByMission = useMemo(() => {
    const groups = new Map<number, { mission: any; participants: any[] }>();
    const noMission: any[] = [];

    for (const p of filteredParticipants) {
      if (p.missions && p.missions.length > 0) {
        for (const mp of p.missions) {
          const mission = missionMap.get(mp.missionId);
          if (mission) {
            if (!groups.has(mission.id)) {
              groups.set(mission.id, { mission, participants: [] });
            }
            groups.get(mission.id)!.participants.push(p);
          }
        }
      } else {
        noMission.push(p);
      }
    }

    // Sort missions by title
    const sorted = Array.from(groups.values()).sort((a, b) =>
      (a.mission.title || "").localeCompare(b.mission.title || "")
    );

    return { grouped: sorted, noMission };
  }, [filteredParticipants, missionMap]);

  const renderParticipantRow = (p: any) => {
    const initials = p.firstName && p.lastName
      ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase()
      : p.email?.substring(0, 2).toUpperCase() || "P";

    return (
      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {p.firstName} {p.lastName}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {p.email && (
              <a href={`mailto:${p.email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{p.email}</span>
              </a>
            )}
            {p.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3 flex-shrink-0" />
                {p.phone}
              </span>
            )}
            {p.address && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{p.address}</span>
              </span>
            )}
          </div>
        </div>
        {p.company && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
            <Building2 className="w-3 h-3" />
            {p.company}
          </span>
        )}
        {p.function && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
            <Briefcase className="w-3 h-3" />
            {p.function}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Participants" />

        <div className="flex-1 p-6 space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un participant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="self-start">
              {filteredParticipants.length} participant(s)
            </Badge>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucun participant trouve</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Essayez avec un autre terme de recherche." : "Aucun participant enregistre."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {participantsByMission.grouped.map(({ mission, participants: missionParticipants }) => (
                <Card key={mission.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <Link href={`/missions/${mission.id}`} className="hover:underline flex items-center gap-1.5">
                        {mission.title}
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                      <Badge variant="secondary" className="ml-auto">
                        {missionParticipants.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {missionParticipants.map((p: any) => renderParticipantRow(p))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {participantsByMission.noMission.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Sans mission
                      <Badge variant="secondary" className="ml-auto">
                        {participantsByMission.noMission.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {participantsByMission.noMission.map((p: any) => renderParticipantRow(p))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
