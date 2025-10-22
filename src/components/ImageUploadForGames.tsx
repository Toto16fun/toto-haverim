
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFetchGames } from '@/hooks/useFetchGames';
import { Upload, Image, FileSpreadsheet } from 'lucide-react';
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
          העלה צילום מסך של רשימת המשחקים או קובץ אקסל והמערכת תחלץ אותם אוטומטית
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          {previewUrl && fileType === 'image' && (
            <div className="mt-4">
              <img 
                src={previewUrl} 
                alt="תצוגה מקדימה" 
                className="max-w-full h-auto rounded-md border"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
          {selectedFile && fileType === 'excel' && (
            <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
            </div>
          )}
        </div>
        
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
