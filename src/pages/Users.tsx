import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users as UsersIcon, Loader2, Calendar, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  name: string;
  created_at: string;
}

const Users = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { data: roles } = useUserRoles();
  const { toast } = useToast();
  
  const isAdmin = roles?.includes('admin');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast({
        title: "המשתמש נמחק",
        description: `${userToDelete.name} הוסר מהמערכת`,
      });

      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את המשתמש",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">טוען משתמשים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">חברי הקבוצה</h1>
          <p className="text-gray-600">רשימת כל המשתמשים הרשומים בטוטו</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              משתמשים רשומים ({users.length})
            </CardTitle>
            <CardDescription>כל המשתמשים שנרשמו למערכת הטוטו</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                אין משתמשים רשומים במערכת
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-lg">{user.name}</span>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        נרשם ב: {formatDate(user.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-400 font-mono">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המשתמש {userToDelete?.name} לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'מוחק...' : 'מחק'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;