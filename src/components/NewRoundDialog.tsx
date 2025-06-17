
import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateRound } from '@/hooks/useTotoRounds';
import { useFetchGames } from '@/hooks/useFetchGames';
import { Upload, Image, X, Check } from 'lucide-react';

interface NewRoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewRoundDialog = ({ open, onOpenChange }: NewRoundDialogProps) => {
  const [roundNumber, setRoundNumber] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentRoundId, setCurrentRoundId] = useState<string>('');
  const [step, setStep] = useState<'create' | 'upload' | 'confirm'>('create');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createRound = useCreateRound();
  const fetchGames = useFetchGames();

  const resetDialog = () => {
    setStep('create');
    setRoundNumber('');
    setDeadline('');
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentRoundId('');
    setIsDragOver(false);
  };

  const handleCreateRound = async () => {
    if (!roundNumber || !deadline) {
      toast({
        title: "שדות חסרים",
        description: "אנא מלא את כל השדות",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await createRound.mutateAsync({
        round_number: parseInt(roundNumber),
        deadline: new Date(deadline).toISOString(),
        start_date: new Date().toISOString().split('T')[0]
      });
      
      setCurrentRoundId(result.id);
      setStep('upload');
      
      toast({
        title: "מחזור נוצר בהצלחה!",
        description: `מחזור ${result.round_number} נוצר - עכשיו העלה צילום מסך של המשחקים`
      });
    } catch (error) {
      console.error('Error creating round:', error);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      toast({
        title: "קובץ לא תקין",
        description: "אנא בחר קובץ תמונה בלבד",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileSelect(file);
        }
      }
    }
  }, []);

  const handleAnalyzeAndConfirm = async () => {
    if (!selectedFile || !currentRoundId) {
      toast({
        title: "חסרה תמונה",
        description: "אנא בחר תמונה תחילה",
        variant: "destructive"
      });
      return;
    }

    try {
      const base64Image = await convertToBase64(selectedFile);
      
      await fetchGames.mutateAsync({ 
        roundId: currentRoundId, 
        imageData: base64Image 
      });
      
      setStep('confirm');
      
      toast({
        title: "המשחקים נטענו בהצלחה!",
        description: "המערכת ניתחה את התמונה וחילצה את המשחקים"
      });
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "שגיאה בניתוח התמונה",
        description: "לא הצלחנו לנתח את התמונה. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const handleFinalConfirm = () => {
    toast({
      title: "מחזור חדש הופעל!",
      description: "המחזור החדש זמין עכשיו לכל המשתמשים"
    });
    
    resetDialog();
    onOpenChange(false);
    
    // Refresh the page to show the new round
    window.location.reload();
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>פתיחת מחזור חדש</DialogTitle>
        </DialogHeader>

        {step === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>יצירת מחזור חדש</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roundNumber">מספר מחזור</Label>
                  <Input
                    id="roundNumber"
                    type="number"
                    placeholder="הזן מספר מחזור"
                    value={roundNumber}
                    onChange={(e) => setRoundNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">דדליין</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateRound}
                disabled={createRound.isPending}
                className="w-full"
              >
                {createRound.isPending ? 'יוצר מחזור...' : 'צור מחזור חדש'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                העלה צילום מסך של המשחקים
              </CardTitle>
              <p className="text-sm text-gray-600">
                גרור קובץ, הדבק מהלוח או לחץ לבחירת קובץ
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                tabIndex={0}
                style={{ outline: 'none' }}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="תצוגה מקדימה" 
                      className="max-w-full h-auto rounded-md mx-auto"
                      style={{ maxHeight: '300px' }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      הסר תמונה
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">גרור תמונה לכאן</p>
                      <p className="text-sm text-gray-500">או הדבק עם Ctrl+V</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      בחר קובץ
                    </Button>
                  </div>
                )}
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />

              <Button
                onClick={handleAnalyzeAndConfirm}
                disabled={!selectedFile || fetchGames.isPending}
                className="w-full"
              >
                {fetchGames.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    מנתח תמונה...
                  </>
                ) : (
                  'נתח וטען משחקים'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                אישור והפעלת המחזור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-800 font-medium">המשחקים נטענו בהצלחה!</p>
                <p className="text-green-700 text-sm mt-1">
                  המחזור מוכן להפעלה. לחיצה על "הפעל מחזור" תאפס את המחזור הקודם ותפעיל את החדש.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-yellow-800 font-medium">שים לב!</p>
                <p className="text-yellow-700 text-sm mt-1">
                  פעולה זו תמחק את כל הטורים הקיימים במחזור הנוכחי ותתחיל מחזור חדש.
                </p>
              </div>

              <Button
                onClick={handleFinalConfirm}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                הפעל מחזור חדש
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewRoundDialog;
