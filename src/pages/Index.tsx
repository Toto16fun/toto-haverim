
import { Link } from 'react-router-dom';
import { Trophy, Users, History, BarChart3, Clock, LogIn, LogOut, Lock, ImageIcon, Settings, Shield, UserPlus } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useCanEditResults, useUserRoles } from "@/hooks/useUserRoles";
import { useIsLeagueAdmin, useUserLeague } from "@/hooks/useLeagues";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { canEdit } = useCanEditResults();
  const { data: roles } = useUserRoles();
  const { data: userLeague } = useUserLeague(user?.id);
  const { data: isLeagueAdmin } = useIsLeagueAdmin(user?.id, userLeague?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-slate-600 font-body">טוען...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = roles?.includes('admin');

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-body" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-800 rounded-xl flex items-center justify-center text-white text-xl font-display tracking-widest">
              ⚽
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-900 leading-none">קבוצת טוטו</h1>
              <p className="text-slate-500 text-sm font-medium">אפליקציית הימורים חברית לקבוצה</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-slate-600 hidden sm:inline">
                  שלום, {user.user_metadata?.name || user.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  יציאה
                </button>
              </>
            ) : null}
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

          {/* Primary Action: Submit Bet */}
          <Link
            to={user ? "/submit-bet" : "#"}
            className={`md:col-span-4 md:row-span-2 group relative overflow-hidden bg-blue-700 rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-blue-900/10 transition-all ${user ? 'cursor-pointer hover:bg-blue-600' : 'opacity-70 cursor-not-allowed'}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Trophy className="w-32 h-32 text-white" />
            </div>
            {!user && (
              <div className="absolute top-4 left-4 z-20">
                <Lock className="h-5 w-5 text-white/70" />
              </div>
            )}
            <div className="relative z-10">
              <h2 className="text-white text-5xl font-black tracking-tight mb-2">הגשת טור</h2>
              <p className="text-blue-50/80 text-lg max-w-xs font-medium">
                {user ? "מלא את הטור שלך למחזור הנוכחי והצטרף למאבק על המקום הראשון" : "נדרשת התחברות להגשת טור"}
              </p>
            </div>
            <div className="relative z-10 mt-8">
              <span className="bg-white text-blue-700 px-6 py-2 rounded-full font-bold text-sm tracking-wide shadow-lg">
                {user ? "מלא טור חדש" : "נדרשת התחברות"}
              </span>
            </div>
          </Link>

          {/* Current Round - dark LIVE card */}
          <Link
            to={user ? "/current-round" : "#"}
            className={`md:col-span-2 md:row-span-2 bg-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all ${user ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50' : 'opacity-70 cursor-not-allowed'}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-sky-400" />
              </div>
              {user && (
                <span className="text-sky-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse"></span>
                  LIVE
                </span>
              )}
              {!user && <Lock className="h-4 w-4 text-slate-500" />}
            </div>
            <div>
              <h3 className="text-white text-3xl font-black mb-1">מחזור נוכחי</h3>
              <p className="text-slate-400 text-sm">
                {user ? "צפה בטורים שהוגשו במחזור הנוכחי" : "נדרשת התחברות לצפייה במחזור"}
              </p>
            </div>
          </Link>

          {/* History */}
          <Link
            to={user ? "/history" : "#"}
            className={`md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 transition-all ${user ? 'cursor-pointer hover:shadow-md' : 'opacity-60 cursor-not-allowed'}`}
            onClick={!user ? (e) => e.preventDefault() : undefined}
          >
            <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <History className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="text-slate-900 text-2xl font-black">היסטוריית שליחות</h3>
            <p className="text-slate-500 text-xs mt-1">
              {user ? "צפייה בטורים קודמים וביצועים" : "נדרשת התחברות לצפייה בהיסטוריה"}
            </p>
          </Link>

          {/* Stats */}
          <Link
            to="/statistics"
            className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="text-slate-900 text-2xl font-black">סטטיסטיקות עונה</h3>
            <p className="text-slate-500 text-xs mt-1">סיכום ביצועים ונתונים מצטברים</p>
          </Link>

          {/* Login / Account */}
          {!user && (
            <Link
              to="/auth"
              className="md:col-span-2 bg-slate-200/50 rounded-3xl p-6 flex items-center justify-between border border-transparent cursor-pointer transition-all hover:bg-slate-200"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                  <LogIn className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-sm leading-tight">התחבר לחשבון</h4>
                  <p className="text-slate-500 text-xs">הירשם או התחבר כדי להגיש טורים</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {/* Join League - users without a league */}
          {user && !userLeague && (
            <Link
              to="/league/join"
              className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-slate-900 text-2xl font-black">הצטרף לליגה</h3>
              <p className="text-slate-500 text-xs mt-1">הזן קוד הצטרפות כדי להצטרף לליגה</p>
            </Link>
          )}

          {/* League Admin */}
          {isLeagueAdmin && (
            <Link
              to="/league/admin"
              className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="h-12 w-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-slate-900 text-2xl font-black">ניהול ליגה</h3>
              <p className="text-slate-500 text-xs mt-1">ניהול המשתמשים והגדרות הליגה שלך</p>
            </Link>
          )}

          {/* Admin Results */}
          {canEdit && (
            <Link
              to="/admin/results"
              className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 cursor-pointer transition-all hover:shadow-md"
            >
              <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-slate-900 text-2xl font-black">עריכת תוצאות</h3>
              <p className="text-slate-500 text-xs mt-1">הזנת תוצאות משחקים וחישוב ניקוד</p>
            </Link>
          )}

          {/* Super Admin Cards */}
          {isSuperAdmin && (
            <>
              <Link
                to="/users"
                className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-slate-900 text-2xl font-black">ניהול משתמשים</h3>
                <p className="text-slate-500 text-xs mt-1">הרשמה וניהול חברי הקבוצה</p>
              </Link>

              <Link
                to="/admin/fixture-image"
                className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <ImageIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-slate-900 text-2xl font-black">עריכת משחקים</h3>
                <p className="text-slate-500 text-xs mt-1">העלאת תמונת לוח זמנים ועריכת משחקים</p>
              </Link>

              <Link
                to="/admin/leagues"
                className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="h-12 w-12 bg-pink-50 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-slate-900 text-2xl font-black">ניהול ליגות</h3>
                <p className="text-slate-500 text-xs mt-1">יצירה וניהול ליגות במערכת</p>
              </Link>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-slate-400 font-medium">
          <p>עלות טור: 24 ₪ (3 כפולים לכל אחד) | מי שמסיים אחרון משלם בסיבוב הבא</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
