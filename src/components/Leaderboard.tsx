import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoundScores } from "@/hooks/useRoundScores";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardProps {
  roundId: string;
}

const Leaderboard = ({ roundId }: LeaderboardProps) => {
  const { data: scores, isLoading, error } = useRoundScores(roundId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            לוח התוצאות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">טוען תוצאות...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            לוח התוצאות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-destructive">שגיאה בטעינת התוצאות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            לוח התוצאות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">אין תוצאות זמינות עדיין</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-amber-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-400" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          לוח התוצאות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {scores.map((score) => (
            <div
              key={score.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                score.rank === 1 ? 'bg-amber-400/10 border-amber-400/30' :
                score.rank === 2 ? 'bg-slate-400/10 border-slate-400/25' :
                score.rank === 3 ? 'bg-orange-500/10 border-orange-500/25' :
                'bg-background border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(score.rank || 0)}
                <div>
                  <p className="font-medium">{score.user_name || 'משתמש לא ידוע'}</p>
                  <p className="text-sm text-muted-foreground">{score.hits} פגיעות</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {score.is_payer && (
                  <Badge variant="destructive" className="text-xs">
                    💸 משלם
                  </Badge>
                )}
                <Badge variant={getRankBadgeVariant(score.rank || 0)}>
                  מקום {score.rank}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;