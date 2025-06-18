
import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateRound, useTotoRounds } from '@/hooks/useTotoRounds';
import { useFetchGames } from '@/hooks/useFetchGames';
import { Upload, Image, X, Check } from 'lucide-react';

interface NewRoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewRoundDialog = ({ open, onOpenChange }: NewRoundDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentRoundId, setCurrentRoundId] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'confirm'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createRound = useCreateRound();
  const fetchGames = useFetchGames();
  const { data: existingRounds } = useTotoRounds();

  const resetDialog = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewUrl('');
    setCurrentRoundId('');
    setIsDragOver(false);
  };

  // Calculate next round number (starting from 1)
  const getNextRoundNumber = () => {
    if (!existingRounds || existingRounds.length === 0) {
      return 1;
    }
    const maxRoundNumber = Math.max(...existingRounds.map(round => round.round_number));
    return maxRoundNumber + 1;
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
    if (!selectedFile) {
      toast({
        title: "חסרה תמונה",
        description: "אנא בחר תמונה תחילה",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create round with auto-generated number and deadline (7 days from now)
      const nextRoundNumber = getNextRoundNumber();
      const roundResult = await createRound.mutateAsync({
        round_number: nextRoundNumber,
        start_date: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      setCurrentRoundId(roundResult.id);
      
      // Try to analyze image and fetch games
      const base64Image = await convertToBase64(selectedFile);
      
      try {
        await fetchGames.mutateAsync({ 
          roundId: roundResult.id, 
          imageData: base64Image 
        });
        
        setStep('confirm');
        
        toast({
          title: "מחזור נוצר והמשחקים נטענו!",
          description: `מחזור ${nextRoundNumber} מוכן להפעלה`
        });
        
      } catch (fetchError: any) {
        // If AI analysis fails, still proceed to confirmation step
        console.log('AI analysis failed, proceeding with empty round:', fetchError);
        
        setStep('confirm');
        toast({
          title: "מחזור נוצר",
          description: `מחזור ${nextRoundNumber} נוצר. תוכל להוסיף משחקים ידנית מעמוד הניהול`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error creating round and analyzing image:', error);
      toast({
        title: "שגיאה ביצירת המחזור",
        description: "לא הצלחנו ליצור את המחזור. נסה שוב מאוחר יותר.",
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

  const nextRoundNumber = getNextRoundNumber();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>פתיחת מחזור חדש - מחזור {nextRoundNumber}</DialogTitle>
        </DialogHeader>

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

              <input
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
                disabled={!selectedFile || createRound.isPending || fetchGames.isPending}
                className="w-full"
              >
                {createRound.isPending || fetchGames.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    יוצר מחזור ומנתח תמונה...
                  </>
                ) : (
                  'צור מחזור ונתח משחקים'
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
                <p className="text-green-800 font-medium">המחזור נוצר בהצלחה!</p>
                <p className="text-green-700 text-sm mt-1">
                  מחזור {nextRoundNumber} מוכן להפעלה. לחיצה על "הפעל מחזור" תפעיל את המחזור החדש.
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-yellow-800 font-medium">שים לב!</p>
                <p className="text-yellow-700 text-sm mt-1">
                  פעולה זו תתחיל מחזור חדש עבור כל המשתמשים.
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
