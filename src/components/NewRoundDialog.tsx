import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateRound, useTotoRounds } from '@/hooks/useTotoRounds';
import { useFetchGames } from '@/hooks/useFetchGames';
import { Upload, Image, X, Check, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

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
  const [fileType, setFileType] = useState<'image' | 'excel' | null>(null);
  
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
    setFileType(null);
  };

  // Calculate next round number (starting from 1)
  const getNextRoundNumber = () => {
    if (!existingRounds || existingRounds.length === 0) {
      return 1;
    }
    const maxRoundNumber = Math.max(...existingRounds.map(round => round.round_number));
    return maxRoundNumber + 1;
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          console.log('Excel data parsed:', jsonData);
          console.log('Total rows:', jsonData.length);
          
          // Process the data according to the new structure
          const games = [];
          for (let i = 1; i < jsonData.length && games.length < 16; i++) {
            const row = jsonData[i] as any[];
            console.log(`Processing row ${i}:`, row);
            
            if (row && row.length >= 2) {
              const leagueValue = row[0];
              const teamsValue = row[1];
              
              console.log('League:', leagueValue, 'Teams:', teamsValue);
              
              if (teamsValue && typeof teamsValue === 'string') {
                // Try different separators for teams
                const separators = [' - ', ' VS ', ' נגד ', ' ضد ', '-', 'VS', 'נגד'];
                let teamsParts = null;
                
                for (const separator of separators) {
                  if (teamsValue.includes(separator)) {
                    teamsParts = teamsValue.split(separator);
                    break;
                  }
                }
                
                if (teamsParts && teamsParts.length >= 2) {
                  const homeTeam = teamsParts[0].trim();
                  const awayTeam = teamsParts[1].trim();
                  
                  if (homeTeam && awayTeam) {
                    console.log(`Adding game: ${homeTeam} vs ${awayTeam}`);
                  games.push({
                    league: leagueValue ? String(leagueValue).trim() : null,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam
                  });
                  }
                } else {
                  console.log('Could not parse teams from:', teamsValue);
                }
              } else {
                console.log('Teams value is invalid:', teamsValue);
              }
            } else {
              console.log(`Row ${i} has insufficient columns:`, row);
            }
          }
          
          console.log('Final games array:', games);
          resolve(games);
        } catch (error) {
          console.error('Error parsing Excel:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
      reader.readAsArrayBuffer(file);
    });
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
    const isImage = file.type.startsWith('image/');
    const isExcel = file.type.includes('sheet') || 
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls') ||
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel';

    if (isImage || isExcel) {
      setSelectedFile(file);
      setFileType(isImage ? 'image' : 'excel');
      
      if (isImage) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl('');
      }
    } else {
      toast({
        title: "קובץ לא תקין",
        description: "אנא בחר קובץ תמונה או אקסל בלבד",
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
        title: "חסר קובץ",
        description: "אנא בחר קובץ תחילה",
        variant: "destructive"
      });
      return;
    }

    try {
      // Lock the previous round if it exists
      if (existingRounds && existingRounds.length > 0) {
        const currentRound = existingRounds[0];
        if (currentRound.status === 'active') {
          try {
            await supabase.functions.invoke('lockRound', {
              body: { roundId: currentRound.id }
            });
            console.log('Previous round locked successfully');
          } catch (lockError) {
            console.error('Failed to lock previous round:', lockError);
            // Continue with round creation even if lock fails
          }
        }
      }

      // Calculate next Saturday at 13:00 Israel time as deadline
      const nextRoundNumber = getNextRoundNumber();
      const getNextSaturdayDeadline = () => {
        const now = new Date();
        const daysUntilSaturday = (6 - now.getDay()) % 7 || 7; // 0=Sunday, 6=Saturday
        const nextSaturday = new Date(now);
        nextSaturday.setDate(now.getDate() + daysUntilSaturday);
        nextSaturday.setHours(10, 0, 0, 0); // 13:00 Israel time = 10:00 UTC (winter time)
        return nextSaturday;
      };

      const roundResult = await createRound.mutateAsync({
        round_number: nextRoundNumber,
        start_date: new Date().toISOString().split('T')[0],
        deadline: getNextSaturdayDeadline().toISOString(),
        status: 'draft'
      });
      
      setCurrentRoundId(roundResult.id);
      
      try {
        if (fileType === 'excel') {
          // Parse Excel file
          console.log('Starting Excel parsing...');
          const games = await parseExcelFile(selectedFile);
          console.log('Excel parsing complete, games found:', games.length);
          
          if (games.length === 0) {
            toast({
              title: "לא נמצאו משחקים",
              description: "וודא שקובץ האקסל מכיל נתונים בעמודות A, B, C כפי שמתואר",
              variant: "destructive"
            });
            return;
          }
          
          // Call fetch-games with parsed Excel data
          await fetchGames.mutateAsync({ 
            roundId: roundResult.id, 
            excelData: games 
          });
          
        } else {
          // Handle image file
          const base64Image = await convertToBase64(selectedFile);
          await fetchGames.mutateAsync({ 
            roundId: roundResult.id, 
            imageData: base64Image 
          });
        }
        
        setStep('confirm');
        
        toast({
          title: "מחזור נוצר והמשחקים נטענו!",
          description: `מחזור ${nextRoundNumber} מוכן להפעלה`
        });
        
      } catch (fetchError: any) {
        // If analysis fails, still proceed to confirmation step
        console.log('File analysis failed, proceeding with empty round:', fetchError);
        
        setStep('confirm');
        toast({
          title: "שגיאה בעיבוד הקובץ",
          description: `מחזור ${nextRoundNumber} נוצר אבל לא הצלחנו לעבד את הקובץ. תוכל להוסיף משחקים ידנית`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error creating round and analyzing file:', error);
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
                <FileSpreadsheet className="h-5 w-5" />
                העלה קובץ אקסל או תמונה של המשחקים
              </CardTitle>
              <p className="text-sm text-gray-600">
                גרור קובץ אקסל (*.xlsx) או תמונה, הדבק מהלוח או לחץ לבחירת קובץ
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <strong>מבנה קובץ האקסל:</strong><br/>
                עמודה A: ליגה<br/>
                עמודה B: קבוצות (קבוצת בית - קבוצת חוץ)<br/>
                עמודות נוספות: סימונים (1, X, 2)<br/>
                <br/>
                <strong>דוגמאות לפורמט הקבוצות:</strong><br/>
                "ברצלונה - ריאל מדריד" או "ברצלונה VS ריאל מדריד"
              </div>
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
                {selectedFile ? (
                  <div className="space-y-4">
                    {fileType === 'image' && previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="תצוגה מקדימה" 
                        className="max-w-full h-auto rounded-md mx-auto"
                        style={{ maxHeight: '300px' }}
                      />
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                        <span className="text-lg font-medium">{selectedFile.name}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                        setFileType(null);
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      הסר קובץ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <FileSpreadsheet className="h-12 w-12 text-green-400" />
                      <Image className="h-12 w-12 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">גרור קובץ אקסל או תמונה לכאן</p>
                      <p className="text-sm text-gray-500">או הדבק תמונה עם Ctrl+V</p>
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
                accept="image/*,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
                    יוצר מחזור ומעבד קובץ...
                  </>
                ) : (
                  'צור מחזור ועבד משחקים'
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
