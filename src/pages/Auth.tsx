import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Mail, Lock, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (error) {
      toast({
        title: "שגיאה בהרשמה",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "נרשמת בהצלחה!",
        description: "ברוך הבא לקבוצת הטוטו",
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "התחברת בהצלחה!",
        description: "ברוך הבא לקבוצת הטוטו",
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">⚽ קבוצת טוטו</h1>
          <p className="text-gray-600">הירשם או התחבר כדי להצטרף לקבוצה</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">כניסה לחשבון</CardTitle>
            <CardDescription className="text-center">
              הירשם או התחבר כדי להגיש טורים
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">התחברות</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">כתובת אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="הכנס את כתובת האימייל שלך"
                      className="pr-10 text-right"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">סיסמה</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="הכנס את הסיסמה שלך"
                      className="pr-10 text-right"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSignIn} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "מתחבר..." : "התחבר"}
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">שם מלא</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="הכנס את השם המלא שלך"
                      className="pr-10 text-right"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">כתובת אימייל</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="הכנס את כתובת האימייל שלך"
                      className="pr-10 text-right"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">סיסמה</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="בחר סיסמה חזקה"
                      className="pr-10 text-right"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSignUp} 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "נרשם..." : "הירשם"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
