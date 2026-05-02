'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Eye, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DocImage {
  url: string;
  file: File;
}

interface DocumentationUploaderProps {
  images: DocImage[];
  setImages: React.Dispatch<React.SetStateAction<DocImage[]>>;
}

export function DocumentationUploader({ images, setImages }: DocumentationUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 1200;
          if (width > height && width > max) { height *= max / width; width = max; }
          else if (height > max) { width *= max / height; height = max; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: DocImage[] = [];
    for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        newImages.push({ url: URL.createObjectURL(compressed), file: compressed });
    }
    setImages(prev => [...prev, ...newImages]);
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-blue-400" /> Foto Dokumentasi
        </label>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <ImageIcon className="w-4 h-4" /> Pilih Galeri
          </button>
          <button 
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-3.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <Camera className="w-4 h-4" /> Buka Kamera
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 w-full">
        <AnimatePresence>
          {images.map((img, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key={img.url} 
              className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group shadow-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Doc ${idx}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setPreviewImage(img.url)}
                    className="p-3 bg-blue-600 text-white rounded-xl shadow-xl hover:scale-110 active:scale-90 transition-all font-black uppercase tracking-widest"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-3 bg-red-600 text-white rounded-xl shadow-xl hover:scale-110 active:scale-90 transition-all font-black uppercase tracking-widest"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
        
      {images.length === 0 && (
        <div className="col-span-full py-16 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-500 gap-4 bg-white/2 w-full mt-4">
          <div className="p-4 bg-white/2 rounded-full">
              <Camera className="w-12 h-12 opacity-10" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Belum ada foto dokumentasi</p>
        </div>
      )}

      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" 
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-6 h-6"/>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="Preview Dokumentasi" className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
