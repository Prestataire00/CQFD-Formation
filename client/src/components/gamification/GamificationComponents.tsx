import { useState } from "react";
import { Zap, Trophy, Star, ChevronRight, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function GamificationWidget({ user }: { user: any }) {
  const level = user.level || 1;
  const xp = user.xp || 0;
  const nextLevelXp = level * 1000;
  const progress = (xp / nextLevelXp) * 100;

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Niveau {level}</span>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{xp} XP</span>
            <span>{nextLevelXp} XP</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="pt-2 flex flex-wrap gap-1">
            {user.badges?.slice(0, 3).map((badge: any, i: number) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1 capitalize">
                {badge.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AchievementUnlockedModal({ badge, isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <Card className="w-80 animate-in zoom-in duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Star className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <CardTitle>Badge Débloqué !</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="font-bold text-lg">{badge?.name}</p>
          <p className="text-sm text-muted-foreground mt-2">{badge?.description}</p>
          <button 
            onClick={onClose}
            className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Génial !
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

export function XPPopup({ xp, action }: { xp: number; action: string }) {
  return (
    <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right-full duration-500">
      <div className="bg-white/20 p-2 rounded-full">
        <Zap className="h-5 w-5 fill-white" />
      </div>
      <div>
        <p className="font-bold">+{xp} XP</p>
        <p className="text-xs opacity-90">{action}</p>
      </div>
    </div>
  );
}

export function useXPPopup() {
  const [popup, setPopup] = useState<{ xp: number; action: string } | null>(null);
  return {
    show: (xp: number, action: string) => {
      setPopup({ xp, action });
      setTimeout(() => setPopup(null), 3000);
    },
    popup
  };
}

export function LevelUpModal({ level, isOpen, onClose }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card p-8 rounded-2xl shadow-2xl text-center max-w-sm animate-in zoom-in duration-300">
        <div className="relative inline-block mb-6">
          <Trophy className="h-20 w-20 text-yellow-500 animate-bounce" />
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl border-4 border-card">
            {level}
          </div>
        </div>
        <h2 className="text-3xl font-black mb-2 italic">NIVEAU SUPÉRIEUR !</h2>
        <p className="text-muted-foreground mb-8">Vous avez atteint le niveau {level}. Continuez comme ça !</p>
        <button 
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
        >
          CONTINUER L'AVENTURE
        </button>
      </div>
    </div>
  );
}

export function LevelBadge({ level }: { level: number }) {
  return (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold gap-1">
      <Star className="h-3 w-3 fill-primary" />
      Niv. {level}
    </Badge>
  );
}

export function triggerConfetti() {
  // Simple implementation or use a library if available
  console.log("Confetti triggered!");
}
