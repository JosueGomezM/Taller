import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "h-24 w-auto" }: LogoProps) {
  const [error, setError] = useState(false);
  const [logoUrl] = useState('https://vlvdykzznjdnfcsutloc.supabase.co/storage/v1/object/sign/Imagenes/LOGO%20SIN%20RELLENO.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZW5lcy9MT0dPIFNJTiBSRUxMRU5PLnBuZyIsImlhdCI6MTczNjcyNjE3NywiZXhwIjoxNzY4MjYyMTc3fQ.LjJRGsZLRt5JMWU4dkMvfzkfGMo35ikw0ksDcYlVNnE&t=2025-01-12T23%3A55%3A37.904Z');

  useEffect(() => {
    // Precargar la imagen
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoUrl;
    
    img.onload = () => setError(false);
    img.onerror = () => setError(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [logoUrl]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <Wrench className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center`}>
      <img
        src={logoUrl}
        alt="Logo"
        className="h-full w-auto object-contain"
        onError={() => setError(true)}
        loading="eager"
        crossOrigin="anonymous"
      />
    </div>
  );
}