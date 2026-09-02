import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, History, BarChart3, LogIn, LogOut, Lock, ImageIcon, Settings, Shield, UserPlus, Plus, Activity, Target, Clock } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useCanEditResults, useUserRoles } from "@/hooks/useUserRoles";
import { useIsLeagueAdmin, useUserLeague, useLeagueMembers } from "@/hooks/useLeagues";
import { useCurrentRound, useGamesInRound } from "@/hooks/useTotoRounds";
import { useRoundScores } from "@/hooks/useRoundScores";
import { useUserBets } from "@/hooks/useUserBets";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const useCountdown = (targetDate?: string | null) => {
  const calculateTimeLeft = (): TimeLeft => {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
      <span className="text-xl md:text-2xl font-bold text-foreground tabular-nums">{String(value).padStart(2, '0')}</span>
    </div>
    <span className="text-[10px] text-muted-foreground mt-1.5">{label}</span>
  </div>
);

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { canEdit } = useCanEditResults();
  const { data: roles } = useUserRoles();
  const { data: userLeague } = useUserLeague(user?.id);
  const { data: isLeagueAdmin } = useIsLeagueAdmin(user?.id, userLeague?.id);
  const { data: currentRound, isLoading: currentRoundLoading } = useCurrentRound();
  const { data: games } = useGamesInRound(currentRound?.id);
  const { data: roundScores } = useRoundScores(currentRound?.id);
  const { data: leagueMembers } = useLeagueMembers(userLeague?.id);
  const { data: roundBets } = useUserBets(currentRound?.id);
  const timeLeft = useCountdown(currentRound?.deadline);

  const finishedGames = games?.filter(g => g.result).length || 0;
  const totalGames = games?.length || 0;
  const topScorer = roundScores?.[0];
  const submittedBets = roundBets?.length || 0;
  const memberCount = 7; // קבוצה קבועה של 7 חברים
  const isDeadlineActive = currentRound && new Date(currentRound.deadline) > new Date();

  if (loading) {
    return (
      <div className="theme-elite-dark min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-body">טוען...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = roles?.includes('admin');

  const disabledCardClass = "opacity-60 cursor-not-allowed";
  const baseCardClass = "rounded-[2rem] bg-card/60 border border-border p-5 transition-all hover:bg-card hover:shadow-lg hover:shadow-black/5";
  const squareCardClass = `${baseCardClass} flex flex-col justify-between aspect-square`;
  const horizontalCardClass = `${baseCardClass} flex items-center justify-between`;

  return (
    <div className="theme-elite-dark min-h-screen bg-background p-4 md:p-6 font-body" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-2xl flex items-center justify-center text-white text-xl font-display tracking-widest shadow-lg shadow-blue-900/20">
              ⚽
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground leading-none">קבוצת טוטו</h1>
              <p className="text-muted-foreground text-sm font-medium">אפליקציית הימורים חברית לקבוצה</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 font-semibold text-foreground hover:bg-white/5 transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                יציאה
              </button>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-indigo-900 font-bold hover:bg-blue-50 transition-colors text-sm"
              >
                <LogIn className="h-4 w-4" />
                כניסה
              </Link>
            )}
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Primary Feature: Current Round */}
          <Link
            to={user ? "/current-round" : "#"}
            className={`col-span-2 row-span-2 group relative overflow-hidden rounded-[2rem] bg-card border border-border p-6 transition-all ${user ? 'cursor-pointer hover:bg-card/80 hover:shadow-xl hover:shadow-black/10' : 'opacity-80 cursor-not-allowed'}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-60"></div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">מחזור נוכחי</span>
                </div>
                {user ? (
                  <span className="bg-primary/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-primary border border-primary/20">
                    <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
                    תוצאות בלייב
                  </span>
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="mt-4">
                {currentRoundLoading ? (
                  <div className="space-y-3">
                    <div className="h-12 w-40 bg-muted rounded-xl animate-pulse"></div>
                    <div className="h-4 w-32 bg-muted rounded-lg animate-pulse"></div>
                  </div>
                ) : currentRound ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-foreground text-5xl font-black tracking-tight leading-none">מחזור {currentRound.round_number}</h2>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mt-2">
                      {isDeadlineActive ? "המחזור פתוח להגשות" : "המחזור נעול — תוצאות מתעדכנות"}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-foreground text-3xl font-extrabold tracking-tight leading-tight">אין מחזור פעיל</h2>
                    <p className="text-muted-foreground text-sm font-medium mt-2">עדיין לא נפתח מחזור חדש</p>
                  </>
                )}
              </div>

              {currentRoundLoading ? (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-muted rounded-2xl p-3 h-16 animate-pulse"></div>
                  <div className="bg-muted rounded-2xl p-3 h-16 animate-pulse"></div>
                </div>
              ) : currentRound && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-secondary/50 border border-border rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mb-1">
                      <Users className="h-3 w-3" />
                      טורים הוגשו
                    </div>
                    <p className="text-foreground text-xl font-bold">{submittedBets}<span className="text-muted-foreground text-sm font-medium">/{memberCount || '—'}</span></p>
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mb-1">
                      <Target className="h-3 w-3" />
                      תוצאות בלייב
                    </div>
                    <p className="text-foreground text-xl font-bold">{finishedGames}<span className="text-muted-foreground text-sm font-medium">/{totalGames || 16}</span></p>
                  </div>
                  {topScorer && (
                    <div className="col-span-2 bg-secondary/50 border border-border rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                        <Trophy className="h-3 w-3" />
                        מוביל כרגע
                      </div>
                      <div className="text-right">
                        <p className="text-foreground text-sm font-bold leading-none">{topScorer.user_name}</p>
                        <p className="text-primary text-xs font-medium">{topScorer.hits} פגיעות</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!user && (
              <div className="absolute top-4 left-4 z-20">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </Link>

          {/* Submit Bet */}
          <Link
            to={user ? "/submit-bet" : "#"}
            className={`col-span-2 row-span-2 group relative overflow-hidden rounded-[2rem] bg-card border border-border p-6 transition-all ${user ? 'cursor-pointer hover:bg-card/80 hover:shadow-xl hover:shadow-black/10' : 'opacity-80 cursor-not-allowed'}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-transparent to-transparent opacity-60"></div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-xs font-bold tracking-widest uppercase">טוטו בנטו</span>
                </div>
                <span className="bg-primary/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                  {user ? "פתוח" : "נדרשת התחברות"}
                </span>
              </div>

              <div className="mt-4">
                <h2 className="text-foreground text-4xl font-black tracking-tight leading-tight">הגשת טור<br/>חדש</h2>
                <p className="text-muted-foreground text-sm font-medium mt-2">
                  לחץ כאן כדי למלא את הטור שלך למחזור הנוכחי.
                </p>
              </div>

              <div className="mt-4">
                {currentRoundLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-muted rounded-xl w-12 h-12 md:w-14 md:h-14 animate-pulse"></div>
                    ))}
                  </div>
                ) : currentRound && isDeadlineActive ? (
                  <div className="space-y-3">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      זמן נותר לסגירה
                    </p>
                    <div className="flex gap-2">
                      <CountdownUnit value={timeLeft.days} label="ימים" />
                      <span className="text-2xl font-bold self-start mt-3 text-muted-foreground/30">:</span>
                      <CountdownUnit value={timeLeft.hours} label="שעות" />
                      <span className="text-2xl font-bold self-start mt-3 text-muted-foreground/30">:</span>
                      <CountdownUnit value={timeLeft.minutes} label="דקות" />
                      <span className="text-2xl font-bold self-start mt-3 text-muted-foreground/30">:</span>
                      <CountdownUnit value={timeLeft.seconds} label="שניות" />
                    </div>
                  </div>
                ) : currentRound ? (
                  <div className="bg-secondary/50 border border-border rounded-2xl p-4">
                    <p className="text-foreground/80 text-sm font-medium">המחזור נעול — לא ניתן להגיש טורים</p>
                  </div>
                ) : (
                  <div className="bg-secondary/50 border border-border rounded-2xl p-4">
                    <p className="text-foreground/80 text-sm font-medium">אין מחזור פעיל כרגע</p>
                  </div>
                )}
              </div>
            </div>
            {!user && (
              <div className="absolute top-4 left-4 z-20">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </Link>

          {/* Stats */}
          <Link
            to="/statistics"
            className={`${squareCardClass} cursor-pointer`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">סטטיסטיקה</p>
              <p className="text-xl font-bold text-foreground mt-0.5 underline decoration-emerald-500/30 underline-offset-4">ביצועים</p>
            </div>
          </Link>

          {/* History */}
          <Link
            to={user ? "/history" : "#"}
            className={`${squareCardClass} ${user ? 'cursor-pointer' : disabledCardClass}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <History className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">עבר</p>
              <p className="text-xl font-bold text-foreground mt-0.5">היסטוריה</p>
            </div>
          </Link>

          {/* Join League - users without a league */}
          {user && !userLeague && (
            <Link
              to="/league/join"
              className={`${horizontalCardClass} cursor-pointer`}
            >
              <div className="flex flex-col">
                <p className="text-muted-foreground text-xs font-medium">חברות</p>
                <p className="text-lg font-bold text-foreground">הצטרף לליגה</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-amber-400" />
              </div>
            </Link>
          )}

          {/* League Admin */}
          {isLeagueAdmin && (
            <Link
              to="/league/admin"
              className={`${horizontalCardClass} cursor-pointer`}
            >
              <div className="flex flex-col">
                <p className="text-muted-foreground text-xs font-medium">ניהול</p>
                <p className="text-lg font-bold text-foreground">הגדרות ליגה</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-teal-400" />
              </div>
            </Link>
          )}

          {/* Admin Results */}
          {canEdit && (
            <Link
              to="/admin/results"
              className={`${horizontalCardClass} cursor-pointer`}
            >
              <div className="flex flex-col">
                <p className="text-muted-foreground text-xs font-medium">מנהל</p>
                <p className="text-lg font-bold text-foreground">עריכת תוצאות</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Settings className="h-4 w-4 text-red-400" />
              </div>
            </Link>
          )}

          {/* Super Admin Cards */}
          {isSuperAdmin && (
            <>
              <Link
                to="/users"
                className={`${horizontalCardClass} cursor-pointer`}
              >
                <div className="flex flex-col">
                  <p className="text-muted-foreground text-xs font-medium">סופר מנהל</p>
                  <p className="text-lg font-bold text-foreground">ניהול משתמשים</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-orange-400" />
                </div>
              </Link>

              <Link
                to="/admin/fixture-image"
                className={`${horizontalCardClass} cursor-pointer`}
              >
                <div className="flex flex-col">
                  <p className="text-muted-foreground text-xs font-medium">סופר מנהל</p>
                  <p className="text-lg font-bold text-foreground">עריכת משחקים</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-indigo-400" />
                </div>
              </Link>

              <Link
                to="/admin/leagues"
                className={`${horizontalCardClass} cursor-pointer`}
              >
                <div className="flex flex-col">
                  <p className="text-muted-foreground text-xs font-medium">סופר מנהל</p>
                  <p className="text-lg font-bold text-foreground">ניהול ליגות</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-pink-400" />
                </div>
              </Link>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground font-medium">
          <p>עלות טור: 24 ₪ (3 כפולים לכל אחד) | מי שמסיים אחרון משלם בסיבוב הבא</p>
        </div>
      </div>
    </div>
  );
};

export default Index;