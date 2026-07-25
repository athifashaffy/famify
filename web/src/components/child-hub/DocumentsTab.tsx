import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ChildDocument } from '../../lib/types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Upload, FileText, Image, Trash2, Download, File } from 'lucide-react';

interface Props {
  childId: string;
  familyId: string;
}

export function DocumentsTab({ childId, familyId }: Props) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ChildDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [childId]);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('child_documents').select('*').eq('child_id', childId).order('created_at', { ascending: false });
    if (data) setDocuments(data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Max 10MB.');
      return;
    }

    setUploading(true);
    const filePath = `${familyId}/${childId}/${Date.now()}_${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from('child-documents')
      .upload(filePath, file);

    if (uploadErr) {
      alert('Upload failed: ' + uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('child-documents').getPublicUrl(filePath);

    const { error: insertErr } = await supabase.from('child_documents').insert({
      child_id: childId,
      family_id: familyId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      uploaded_by: user.id,
    });
    if (insertErr) {
      alert('Upload failed: ' + insertErr.message);
      await supabase.storage.from('child-documents').remove([filePath]);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    fetchDocuments();
  };

  const handleDelete = async (doc: ChildDocument) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    const { error } = await supabase.from('child_documents').delete().eq('id', doc.id);
    if (error) {
      alert('Could not delete document. Please try again.');
      return;
    }
    // Remove the file from storage too so it doesn't orphan
    const marker = '/child-documents/';
    const idx = doc.file_url?.indexOf(marker) ?? -1;
    if (idx >= 0) {
      const path = decodeURIComponent(doc.file_url.slice(idx + marker.length));
      await supabase.storage.from('child-documents').remove([path]);
    }
    fetchDocuments();
  };

  const getFileIcon = (type: string | null) => {
    if (!type) return <File size={20} className="text-slate-400" />;
    if (type.startsWith('image/')) return <Image size={20} className="text-sky-500" />;
    if (type.includes('pdf')) return <FileText size={20} className="text-rose-500" />;
    return <File size={20} className="text-slate-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Documents</h3>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="bg-emerald-500 hover:bg-emerald-600 text-sm"
            >
              <Upload size={14} className="mr-1" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-4">PDF, Images, Word docs. Max 10MB.</p>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                {getFileIcon(doc.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-[11px] text-slate-400">{format(new Date(doc.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-emerald-600">
                    <Download size={14} />
                  </a>
                  <button onClick={() => handleDelete(doc)} className="p-1.5 text-slate-400 hover:text-rose-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
