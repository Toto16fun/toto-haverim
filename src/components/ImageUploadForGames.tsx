
import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFetchGames } from '@/hooks/useFetchGames';
import { Upload, Image, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImageUploadForGamesProps {
  roundId: string;
  onSuccess?: () => void;
}

const ImageUploadForGames = ({ roundId, onSuccess }: ImageUploadForGamesProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'image' | 'excel' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const fetchGames = useFetchGames();

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
          
          const games = [];
          for (let i = 1; i < jsonData.length && games.length < 16; i++) {
            const row = jsonData[i] as any[];
            
            if (row && row.length >= 2) {
              const leagueValue = row[0];
              const teamsValue = row[1];
              
              if (teamsValue && typeof teamsValue === 'string') {
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
                    games.push({
                      league: leagueValue ? String(leagueValue).trim() : null,
                      homeTeam: homeTeam,
                      awayTeam: awayTeam
                    });
                  }
                }
              }
            }
          }
          
          resolve(games);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isExcel = file.type.includes('sheet') || 
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls');

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

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "חסר קובץ",
        description: "אנא בחר קובץ תחילה",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      if (fileType === 'excel') {
        const games = await parseExcelFile(selectedFile);
        
        if (games.length === 0) {
          toast({
            title: "לא נמצאו משחקים",
            description: "וודא שקובץ האקסל מכיל נתונים תקינים",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }
        
        await fetchGames.mutateAsync({ 
          roundId, 
          excelData: games 
        });
      } else {
        const base64Image = await convertToBase64(selectedFile);
        await fetchGames.mutateAsync({ 
          roundId, 
          imageData: base64Image 
        });
      }
      
      toast({
        title: "המשחקים עודכנו בהצלחה!",
        description: "רשימת המשחקים התעדכנה"
      });
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({
        title: "שגיאה בעדכון המשחקים",
        description: "לא הצלחנו לעדכן את המשחקים. אנא נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {fileType === 'excel' ? (
            <FileSpreadsheet className="h-5 w-5" />
          ) : (
            <Image className="h-5 w-5" />
          )}
          העלה צילום מסך או קובץ אקסל
        </CardTitle>
        <p className="text-sm text-gray-600">
          גרור קובץ, הדבק תמונה עם Ctrl+V או לחץ לבחירת קובץ
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                  style={{ maxHeight: '200px' }}
                />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
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
              <div className="flex justify-center gap-4">
                <Image className="h-10 w-10 text-blue-400" />
                <FileSpreadsheet className="h-10 w-10 text-green-400" />
              </div>
              <div>
                <p className="text-base font-medium">גרור קובץ לכאן</p>
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
          onClick={handleUploadAndAnalyze}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              מעדכן משחקים...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              עדכן משחקים
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          המערכת תשתמש בבינה מלאכותית לניתוח הקובץ וחילוץ רשימת המשחקים
        </p>
      </CardContent>
    </Card>
  );
};

export default ImageUploadForGames;
