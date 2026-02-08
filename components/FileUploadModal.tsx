
import React, { useState, useRef } from 'react';
import { storage, db, auth } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    const user = auth.currentUser;
    if (!user || !file) return;

    setUploading(true);
    setError(null);

    const fileId = `${Date.now()}-${file.name}`;
    const storagePath = `user_uploads/${user.uid}/${fileId}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(pct);
      },
      (err) => {
        setError("Upload failed: " + err.message);
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, `users/${user.uid}/files`), {
            name: file.name,
            storagePath: storagePath,
            downloadURL: downloadURL,
            size: file.size,
            type: file.type,
            createdAt: serverTimestamp()
          });
          setUploading(false);
          setFile(null);
          onClose();
        } catch (err: any) {
          setError("Metadata save failed: " + err.message);
          setUploading(false);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Upload File</h2>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-8">Personal Cloud Storage</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-4 border-dashed rounded-[32px] p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : 'border-indigo-50 hover:bg-indigo-50/50 hover:border-indigo-100'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <div className="bg-indigo-100 text-indigo-600 p-4 rounded-2xl mb-4">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
          <p className="text-sm font-black text-gray-800 uppercase tracking-widest text-center">
            {file ? file.name : "Click to choose a file"}
          </p>
          {file && <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{(file.size / 1024).toFixed(1)} KB</p>}
        </div>

        {uploading && (
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-600">
              <span>Uploading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-10">
          <button 
            onClick={onClose}
            disabled={uploading}
            className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30"
          >
            {uploading ? 'Uploading...' : 'Start Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
