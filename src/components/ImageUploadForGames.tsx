
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFetchGames } from '@/hooks/useFetchGames';
import { Upload, Image } from 'lucide-react';

interface ImageUploadForGamesProps {
  roundId: string;
  onSuccess?: () => void;
}

const ImageUploadForGames = ({ roundId, onSuccess }: ImageUploadForGamesProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fetchGames = useFetchGames();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        title: "חסרה תמונה",
        description: "אנא בחר תמונה תחילה",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert image to base64
      const base64Image = await convertToBase64(selectedFile);
      
      // Call the fetch-games function with image data
      await fetchGames.mutateAsync({ 
        roundId, 
        imageData: base64Image 
      });
      
      toast({
        title: "המשחקים נטענו בהצלחה!",
        description: "המערכת ניתחה את התמונה וחילצה את המשחקים"
      });
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "שגיאה בניתוח התמונה",
        description: "לא הצלחנו לנתח את התמונה. אנא נסה שוב או הזן את המשחקים ידנית.",
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
          <Image className="h-5 w-5" />
          העלה צילום מסך של המשחקים
        </CardTitle>
        <p className="text-sm text-gray-600">
          העלה צילום מסך של רשימת המשחקים והמערכת תחלץ אותם אוטומטית
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          {previewUrl && (
            <div className="mt-4">
              <img 
                src={previewUrl} 
                alt="תצוגה מקדימה" 
                className="max-w-full h-auto rounded-md border"
                style={{ maxHeight: '200px' }}
              />
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
              מנתח תמונה...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              נתח וטען משחקים
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          המערכת תשתמש בבינה מלאכותית לניתוח התמונה וחילוץ רשימת המשחקים
        </p>
      </CardContent>
    </Card>
  );
};

export default ImageUploadForGames;
