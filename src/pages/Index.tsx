
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, History, BarChart3, Clock, LogIn, LogOut, Lock, ImageIcon, Settings } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useCanEditResults } from "@/hooks/useUserRoles";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { canEdit } = useCanEditResults();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  const handleRestrictedAction = () => {
    // Do nothing - button is disabled
  };

  const isAdmin = user?.email === 'tomercohen1995@gmail.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 pt-safe-area-inset-top sm:pt-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-green-800 mb-2">⚽ קבוצת טוטו</h1>
            <p className="text-lg text-gray-600">אפליקציית הימורים חברית לקבוצה</p>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  שלום, {user.user_metadata?.name || user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  יציאה
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  כניסה
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Submit Bet Card - Only active for authenticated users */}
          <Card className={`transition-shadow cursor-pointer ${user ? 'hover:shadow-lg' : 'opacity-60'}`}>
            <CardHeader className="text-center">
              <div className="relative">
                <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                {!user && <Lock className="h-4 w-4 text-gray-400 absolute -top-1 -right-1" />}
              </div>
              <CardTitle className="text-xl">הגשת טור</CardTitle>
              <CardDescription>
                {user ? "מלא את הטור שלך למחזור הנוכחי" : "נדרשת התחברות להגשת טור"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <Link to="/submit-bet">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    מלא טור חדש
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="w-full bg-gray-400 cursor-not-allowed" 
                  disabled
                  onClick={handleRestrictedAction}
                >
                  נדרשת התחברות
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Current Round Card - Only active for authenticated users */}
          <Card className={`transition-shadow cursor-pointer ${user ? 'hover:shadow-lg' : 'opacity-60'}`}>
            <CardHeader className="text-center">
              <div className="relative">
                <Clock className="h-12 w-12 text-green-600 mx-auto mb-2" />
                {!user && <Lock className="h-4 w-4 text-gray-400 absolute -top-1 -right-1" />}
              </div>
              <CardTitle className="text-xl">מחזור נוכחי</CardTitle>
              <CardDescription>
                {user ? "צפה בטורים שהוגשו במחזור הנוכחי" : "נדרשת התחברות לצפייה במחזור"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <Link to="/current-round">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    מחזור נוכחי
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="w-full bg-gray-400 cursor-not-allowed" 
                  disabled
                  onClick={handleRestrictedAction}
                >
                  נדרשת התחברות
                </Button>
              )}
            </CardContent>
          </Card>

          {/* History Card - Only active for authenticated users */}
          <Card className={`transition-shadow cursor-pointer ${user ? 'hover:shadow-lg' : 'opacity-60'}`}>
            <CardHeader className="text-center">
              <div className="relative">
                <History className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                {!user && <Lock className="h-4 w-4 text-gray-400 absolute -top-1 -right-1" />}
              </div>
              <CardTitle className="text-xl">היסטוריית שליחות</CardTitle>
              <CardDescription>
                {user ? "צפה בטורים של כל המחזורים" : "נדרשת התחברות לצפייה בהיסטוריה"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <Link to="/history">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    צפה בהיסטוריה
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="w-full bg-gray-400 cursor-not-allowed" 
                  disabled
                  onClick={handleRestrictedAction}
                >
                  נדרשת התחברות
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Admin Cards - Only visible for admin user */}
          {isAdmin && (
            <>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                  <CardTitle className="text-xl">ניהול משתמשים</CardTitle>
                  <CardDescription>הרשמה וניהול חברי הקבוצה</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/users">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      ניהול חברים
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <ImageIcon className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                  <CardTitle className="text-xl">עריכת משחקים</CardTitle>
                  <CardDescription>העלאת תמונת לוח זמנים ועריכת משחקים</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin/fixture-image">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      עריכת משחקים
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}

          {/* Admin Results Card - Only visible for users who can edit results */}
          {canEdit && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Settings className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <CardTitle className="text-xl">עריכת תוצאות</CardTitle>
                <CardDescription>הזנת תוצאות משחקים וחישוב ניקוד</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin/results">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    עריכת תוצאות
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Statistics Card - Always accessible */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-xl">סטטיסטיקות עונה</CardTitle>
              <CardDescription>סיכום ביצועים ונתונים מצטברים</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/statistics">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  צפה בסטטיסטיקות
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Login Card - Only shown to non-authenticated users */}
          {!user && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <LogIn className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-xl">התחבר לחשבון</CardTitle>
                <CardDescription>הירשם או התחבר כדי להגיש טורים</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/auth">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    כניסה לחשבון
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>עלות טור: 24 ₪ (3 כפולים לכל אחד) | מי שמסיים אחרון משלם בסיבוב הבא</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
