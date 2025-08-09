import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { uploadImageToStorage } from '@/hooks/useFixtureImage';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadForFixturesProps {
  onImageUploaded: (imageUrl: string) => void;
  isLoading?: boolean;
}

export function ImageUploadForFixtures({ onImageUploaded, isLoading }: ImageUploadForFixturesProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "שגיאה",
          description: "אנא בחר קובץ תמונה בלבד",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "שגיאה", 
          description: "הקובץ גדול מדי. מקסימום 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadImageToStorage(selectedFile);
      toast({
        title: "הועלה בהצלחה",
        description: "התמונה הועלתה ומוכנה לעיבוד",
      });
      onImageUploaded(imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "שגיאה בהעלאה",
        description: "לא הצלחנו להעלות את התמונה. נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          העלאת תמונת לוח זמנים
        </CardTitle>
        <CardDescription>
          העלה צילום מסך של לוח הזמנים לעיבוד אוטומטי של המשחקים
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fixture-image">בחר תמונה</Label>
          <Input
            id="fixture-image"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading || isLoading}
          />
        </div>

        {previewUrl && (
          <div className="space-y-2">
            <Label>תצוגה מקדימה</Label>
            <div className="border rounded-lg p-2">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full h-auto max-h-64 mx-auto rounded"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isLoading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'מעלה...' : 'העלה וערוך'}
        </Button>

        <p className="text-sm text-muted-foreground">
          התמונה תעובד באמצעות AI כדי לחלץ את פרטי המשחקים. לאחר העיבוד תוכל לערוך ולאשר את הנתונים.
        </p>
      </CardContent>
    </Card>
  );
}