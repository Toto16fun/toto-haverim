
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, History, BarChart3, Clock } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">⚽ קבוצת טוטו</h1>
          <p className="text-lg text-gray-600">אפליקציית הימורים חברית לקבוצה</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <CardTitle className="text-xl">הגשת טור</CardTitle>
              <CardDescription>מלא את הטור שלך למחזור הנוכחי</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/submit-bet">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  מלא טור חדש
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-xl">מחזור נוכחי</CardTitle>
              <CardDescription>צפה בטורים שהוגשו במחזור הנוכחי</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/current-round">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  מחזור נוכחי
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <History className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-xl">היסטוריית שליחות</CardTitle>
              <CardDescription>צפה בטורים של כל המחזורים</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/history">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  צפה בהיסטוריה
                </Button>
              </Link>
            </CardContent>
          </Card>

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
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>עלות טור: 24 ₪ (3 כפולים לכל אחד) | מי שמסיים אחרון משלם בסיבוב הבא</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
