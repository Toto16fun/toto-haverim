
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Users as UsersIcon, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const Users = () => {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState<string[]>([
    'תומר', 'דניאל', 'עילאי', 'אורי'
  ]);
  const { toast } = useToast();

  const handleAddUser = () => {
    if (username.trim() && !users.includes(username.trim())) {
      setUsers([...users, username.trim()]);
      setUsername('');
      toast({
        title: "המשתמש נוסף בהצלחה!",
        description: `${username.trim()} נוסף לקבוצת הטוטו`,
      });
    } else if (users.includes(username.trim())) {
      toast({
        title: "שגיאה",
        description: "המשתמש כבר קיים בקבוצה",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = (userToRemove: string) => {
    setUsers(users.filter(user => user !== userToRemove));
    toast({
      title: "המשתמש הוסר",
      description: `${userToRemove} הוסר מהקבוצה`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">ניהול חברי הקבוצה</h1>
          <p className="text-gray-600">הוסף או הסר חברים מקבוצת הטוטו</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                הוסף חבר חדש
              </CardTitle>
              <CardDescription>הכנס שם של חבר חדש לקבוצה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">שם המשתמש</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="הכנס שם משתמש..."
                  className="text-right"
                />
              </div>
              <Button onClick={handleAddUser} className="w-full">
                הוסף לקבוצה
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-2" />
                חברי הקבוצה ({users.length})
              </CardTitle>
              <CardDescription>רשימת כל חברי קבוצת הטוטו</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{user}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveUser(user)}
                      className="text-red-600 hover:text-red-800"
                    >
                      הסר
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Users;
