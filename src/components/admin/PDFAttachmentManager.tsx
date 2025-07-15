import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubsectionAttachment } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  Loader2,
  Plus,
  X
} from 'lucide-react';

interface PDFAttachmentManagerProps {
  subsectionId: string;
  attachments: SubsectionAttachment[];
  onAttachmentsChange: (attachments: SubsectionAttachment[]) => void;
}

export const PDFAttachmentManager = ({ 
  subsectionId, 
  attachments, 
  onAttachmentsChange 
}: PDFAttachmentManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${subsectionId}/${Date.now()}_${file.name}`;
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('subsection-pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('subsection-pdfs')
        .getPublicUrl(fileName);

      // Create attachment record
      const { data: attachmentData, error: dbError } = await supabase
        .from('subsection_attachments')
        .insert([{
          subsection_id: subsectionId,
          file_name: fileName,
          file_url: publicUrl,
          file_size: file.size,
          display_name: file.name
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Update local state
      onAttachmentsChange([...attachments, attachmentData]);
      
      toast({
        title: 'PDF Uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAttachment = async (attachment: SubsectionAttachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('subsection-pdfs')
        .remove([attachment.file_name]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('subsection_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      // Update local state
      onAttachmentsChange(attachments.filter(a => a.id !== attachment.id));
      
      toast({
        title: 'PDF Deleted',
        description: `${attachment.display_name} has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="pdf-upload"
            disabled={uploading}
          />
          <Label htmlFor="pdf-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Click to upload PDF files'}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF files only, up to 10MB each
              </p>
            </div>
          </Label>
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Attached Files:</h4>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">{attachment.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(attachment)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {attachments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No PDF attachments yet. Upload some files to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
};