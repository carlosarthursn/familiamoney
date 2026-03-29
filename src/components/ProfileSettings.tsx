"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, Loader2, User as UserIcon, Heart, Camera, Moon, Sun, Fingerprint, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { SuccessOverlay } from './SuccessOverlay';
import { cn } from '@/lib/utils';
import Cropper from 'react-easy-crop';
import getCroppedImg, { PixelCrop } from '@/lib/cropImage';

export function ProfileSettings() {
  const { user, profile, updateProfile, linkPartner, unlinkPartner, registerPasskey, signOut } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isBiometrySupported, setIsBiometrySupported] = useState(false);
  
  // Crop states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    
    const checkBiometry = async () => {
      const supported = !!window.PublicKeyCredential && 
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsBiometrySupported(supported);
    };
    checkBiometry();
  }, [profile]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', newTheme);
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) return toast.error('O nome não pode estar vazio.');
    setLoading(true);
    const { error } = await updateProfile({ name });
    setLoading(false);
    if (error) toast.error('Erro ao atualizar perfil.');
    else {
      setSuccessMessage('Perfil atualizado!');
      setShowSuccess(true);
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string), false);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      e.target.value = ''; // Reset input para permitir selecionar a mesma foto de novo
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleUploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;
    
    setUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error('Erro ao processar o corte da imagem');

      const filePath = `${user.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedImageBlob, { 
          upsert: true,
          contentType: 'image/jpeg' 
        });

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('O bucket "avatars" não foi encontrado. Crie-o no painel do Supabase.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      
      const { error: updateError } = await updateProfile({ avatar_url: finalUrl });
      if (updateError) throw updateError;

      setSuccessMessage('Foto salva!');
      setShowSuccess(true);
      setImageSrc(null); // Fecha o modal de corte
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.message || 'Erro ao carregar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setLoading(true);
    try {
      const { error } = await registerPasskey();
      if (error) throw error;
      setSuccessMessage('Biometria cadastrada!');
      setShowSuccess(true);
    } catch (err: any) {
      toast.error('Erro ao cadastrar biometria.');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    const cleanEmail = partnerEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return toast.error('Insira um email válido.');
    setLoading(true);
    const { data: partner } = await supabase.from('profiles').select('user_id').eq('email', cleanEmail).maybeSingle();
    if (!partner) {
      setLoading(false);
      return toast.error('Usuário não encontrado.');
    }
    const { error } = await linkPartner(partner.user_id);
    setLoading(false);
    if (error) toast.error('Erro ao realizar vínculo.');
    else {
      setSuccessMessage('Contas vinculadas!');
      setShowSuccess(true);
      setPartnerEmail('');
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Deseja realmente desvincular?')) return;
    setLoading(true);
    const { error } = await unlinkPartner();
    setLoading(false);
    if (error) toast.error('Erro ao desvincular.');
    else {
      setSuccessMessage('Vínculo removido!');
      setShowSuccess(true);
    }
  };

  return (
    <div className="space-y-6">
      {showSuccess && <SuccessOverlay message={successMessage} onFinished={() => setShowSuccess(false)} />}

      <div className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            {theme === 'light' ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-primary" />}
          </div>
          <div><p className="text-sm font-semibold">Tema do App</p></div>
        </div>
        <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-full">Alternar</Button>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary" /> Perfil</h3>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-muted overflow-hidden flex items-center justify-center border-4 border-background shadow-md">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  key={profile.avatar_url}
                  className="h-full w-full object-cover" 
                  alt="Perfil"
                />
              ) : (
                <UserIcon className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background shadow-lg active:scale-90 transition-transform"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="w-full space-y-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading} className="w-full h-11 rounded-xl gradient-primary">Salvar Nome</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /> Segurança</h3>
        <p className="text-xs text-muted-foreground">Acesse o app usando o FaceID ou digital do seu celular.</p>
        <Button 
          variant="outline" 
          onClick={handleRegisterPasskey} 
          disabled={loading} 
          className={cn(
            "w-full h-11 rounded-xl border-primary/20 text-primary hover:bg-primary/5",
            !isBiometrySupported && "opacity-50 cursor-not-allowed"
          )}
        >
          <Fingerprint className="h-4 w-4 mr-2" />
          {isBiometrySupported ? "Ativar Login por Biometria" : "Biometria não disponível"}
        </Button>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Família</h3>
        {profile?.linked_user_id ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Você está conectado com {profile.partnerName}.</p>
            <Button variant="destructive" onClick={handleUnlink} disabled={loading} className="w-full h-11 rounded-xl">Remover Vínculo</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Convide seu parceiro para verem os gastos juntos.</p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Email do parceiro" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} className="h-11 rounded-xl" />
              <Button onClick={handleLink} disabled={loading} className="h-11 px-4 rounded-xl"><UserPlus className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button 
          variant="ghost" 
          onClick={() => signOut()} 
          className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sair da Conta
        </Button>
      </div>

      {/* Modal de Crop de Imagem */}
      <Dialog open={!!imageSrc} onOpenChange={(open) => !open && setImageSrc(null)}>
        <DialogContent className="sm:max-w-md w-[90%] rounded-2xl bg-background border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0 z-10 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent">
            <DialogTitle className="text-white text-lg font-bold">Ajustar Foto</DialogTitle>
          </DialogHeader>
          
          <div className="relative w-full h-[60vh] bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          
          <div className="p-4 bg-background z-10 space-y-4">
            <div className="px-2">
              <Label className="text-xs text-muted-foreground mb-2 block">Ajuste o zoom</Label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setImageSrc(null)}
                className="w-full h-12 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUploadCroppedImage} 
                disabled={uploading} 
                className="w-full h-12 rounded-xl gradient-primary font-bold"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {uploading ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}