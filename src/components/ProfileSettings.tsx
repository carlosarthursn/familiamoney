"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2, User as UserIcon, Save, Heart, Camera, Moon, Sun, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { SuccessOverlay } from './SuccessOverlay';

export function ProfileSettings() {
  const { user, profile, updateProfile, linkPartner, unlinkPartner, registerPasskey } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isBiometrySupported, setIsBiometrySupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    
    // Verifica se o navegador suporta WebAuthn (Biometria)
    setIsBiometrySupported(!!window.PublicKeyCredential);
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

  const handleRegisterPasskey = async () => {
    setLoading(true);
    try {
      const { error } = await registerPasskey();
      if (error) throw error;
      setSuccessMessage('Biometria cadastrada!');
      setShowSuccess(true);
    } catch (err: any) {
      toast.error('Erro ao cadastrar biometria. Verifique se o recurso está ativo no seu celular.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      if (!user) return;
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await updateProfile({ avatar_url: publicUrl });
      setSuccessMessage('Foto salva!');
      setShowSuccess(true);
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
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
              {profile?.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover" /> : <UserIcon className="h-10 w-10 text-muted-foreground" />}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background"><Camera className="h-4 w-4" /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          <div className="w-full space-y-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading} className="w-full h-11 rounded-xl gradient-primary">Salvar Nome</Button>
        </div>
      </div>

      {isBiometrySupported && (
        <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /> Segurança</h3>
          <p className="text-xs text-muted-foreground">Acesse o app usando o FaceID ou digital do seu celular sem precisar digitar senha.</p>
          <Button variant="outline" onClick={handleRegisterPasskey} disabled={loading} className="w-full h-11 rounded-xl border-primary/20 text-primary hover:bg-primary/5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Fingerprint className="h-4 w-4 mr-2" />}
            Ativar Login por Biometria
          </Button>
        </div>
      )}

      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Família</h3>
        {profile?.linked_user_id ? (
          <Button variant="destructive" onClick={handleUnlink} disabled={loading} className="w-full h-11 rounded-xl">Remover Vínculo</Button>
        ) : (
          <div className="flex gap-2">
            <Input type="email" placeholder="Email do parceiro" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} className="h-11 rounded-xl" />
            <Button onClick={handleLink} disabled={loading} className="h-11 px-4 rounded-xl"><UserPlus className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}