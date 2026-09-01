import { Link } from 'react-router-dom';
import { Trophy, Users, History, BarChart3, Clock, LogIn, LogOut, Lock, ImageIcon, Settings, Shield, UserPlus, Plus, ChevronLeft, Activity, Target, List, CalendarDays } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useCanEditResults, useUserRoles } from "@/hooks/useUserRoles";
import { useIsLeagueAdmin, useUserLeague } from "@/hooks/useLeagues";
import { useCurrentRound, useGamesInRound } from "@/hooks/useTotoRounds";
import { useRoundScores } from "@/hooks/useRoundScores";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { canEdit } = useCanEditResults();
  const { data: roles } = useUserRoles();
  const { data: userLeague } = useUserLeague(user?.id);
  const { data: isLeagueAdmin } = useIsLeagueAdmin(user?.id, userLeague?.id);
  const { data: currentRound, isLoading: currentRoundLoading } = useCurrentRound();
  const { data: games } = useGamesInRound(currentRound?.id);
  const { data: roundScores } = useRoundScores(currentRound?.id);

  const finishedGames = games?.filter(g => g.result).length || 0;
  const totalGames = games?.length || 0;
  const topScorer = roundScores?.[0];

  if (loading || currentRoundLoading) {
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
  const baseCardClass = "rounded-[2rem] bg-slate-900/50 border border-white/5 p-5 transition-colors hover:bg-slate-800/50";
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
            className={`col-span-2 row-span-2 group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 p-6 shadow-2xl shadow-blue-900/30 transition-all ${user ? 'cursor-pointer hover:brightness-110' : 'opacity-80 cursor-not-allowed'}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <Activity className="h-5 w-5 text-blue-100" />
                  </div>
                  <span className="text-blue-100/70 text-xs font-bold tracking-widest uppercase">מחזור נוכחי</span>
                </div>
                {user ? (
                  <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-sky-200 border border-sky-400/20">
                    <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse"></span>
                    תוצאות בלייב
                  </span>
                ) : (
                  <Lock className="h-5 w-5 text-white/60" />
                )}
              </div>

              <div className="mt-4">
                {currentRound ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-white text-5xl font-black tracking-tight leading-none">מחזור {currentRound.round_number}</h2>
                    </div>
                    <p className="text-blue-100/70 text-sm font-medium mt-2">
                      {new Date(currentRound.deadline) > new Date() ? "המחזור פתוח להגשות" : "המחזור נעול — תוצאות מתעדכנות"}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-white text-3xl font-extrabold tracking-tight leading-tight">אין מחזור פעיל</h2>
                    <p className="text-blue-100/70 text-sm font-medium mt-2">עדיין לא נפתח מחזור חדש</p>
                  </>
                )}
              </div>

              {currentRound && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 text-blue-200/70 text-[10px] font-semibold uppercase tracking-wider mb-1">
                      <List className="h-3 w-3" />
                      משחקי המחזור
                    </div>
                    <p className="text-white text-xl font-bold">{totalGames}<span className="text-white/40 text-sm font-medium">/16</span></p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 text-sky-200/70 text-[10px] font-semibold uppercase tracking-wider mb-1">
                      <Target className="h-3 w-3" />
                      תוצאות בלייב
                    </div>
                    <p className="text-white text-xl font-bold">{finishedGames}<span className="text-white/40 text-sm font-medium">/{totalGames || 16}</span></p>
                  </div>
                  {topScorer && (
                    <div className="col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-200/70 text-[10px] font-semibold uppercase tracking-wider">
                        <Trophy className="h-3 w-3" />
                        מוביל כרגע
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-bold leading-none">{topScorer.user_name}</p>
                        <p className="text-emerald-300 text-xs font-medium">{topScorer.points} נקודות</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {!user && (
              <div className="absolute top-4 left-4 z-20">
                <Lock className="h-5 w-5 text-white/70" />
              </div>
            )}
            <div className="absolute -left-4 -bottom-4 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl"></div>
          </Link>

          {/* Submit Bet */}
          <Link
            to={user ? "/submit-bet" : "#"}
            className={`col-span-2 group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-900 p-5 shadow-xl shadow-blue-900/20 transition-all ${user ? 'cursor-pointer hover:brightness-110' : 'opacity-80 cursor-not-allowed'}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="relative z-10 flex items-center justify-between h-full min-h-[90px]">
              <div>
                <span className="text-blue-100/60 text-xs font-semibold tracking-widest uppercase">טוטו בנטו</span>
                <h2 className="text-white text-2xl font-extrabold mt-1 tracking-tight">הגשת טור חדש</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white">
                  {user ? "הצטרף למשחק" : "נדרשת התחברות"}
                </span>
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform">
                  <Plus className="w-5 h-5 text-indigo-900" />
                </div>
              </div>
            </div>
            {!user && (
              <div className="absolute top-4 left-4 z-20">
                <Lock className="h-5 w-5 text-white/70" />
              </div>
            )}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
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