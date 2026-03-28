"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, UserPlus, Loader2, User as UserIcon, Save, Heart, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { SuccessOverlay } from './SuccessOverlay';

export function ProfileSettings() {
  const { user, profile, updateProfile, linkPartner, unlinkPartner } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const currentUserEmail = user?.email || '';
  const isLinked = !!profile?.linked_user_id;
  const partnerDisplayName = profile?.partnerName || 'Parceiro';

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('O nome não pode estar vazio.');
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({ name });
    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar perfil.');
    } else {
      setSuccessMessage('Perfil atualizado!');
      setShowSuccess(true);
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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      
      if (updateError) throw updateError;

      setSuccessMessage('Foto de perfil salva!');
      setShowSuccess(true);
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLink = async () => {
    const cleanEmail = partnerEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Insira um email válido.');
      return;
    }
    if (cleanEmail === currentUserEmail.toLowerCase()) {
      toast.error('Você não pode se auto-vincular.');
      return;
    }

    setLoading(true);
    try {
      const { data: partner, error: searchError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (searchError || !partner) {
        toast.error('Usuário não encontrado.');
        return;
      }

      const { error } = await linkPartner(partner.user_id);
      if (error) throw error;
      
      setSuccessMessage('Contas vinculadas!');
      setShowSuccess(true);
      setPartnerEmail('');
    } catch (err) {
      toast.error('Erro ao realizar vínculo.');
    } finally {
      setLoading(false);
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
      {showSuccess && (
        <SuccessOverlay 
          message={successMessage} 
          onFinished={() => setShowSuccess(false)} 
        />
      )}

      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          Dados Pessoais
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-muted border-4 border-background shadow-md overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-muted-foreground" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background active:scale-90 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Toque na câmera para mudar a foto</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-name" className="text-muted-foreground text-xs font-bold uppercase">Seu Nome</Label>
            <Input
              id="user-name"
              placeholder="Ex: Carlos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <Button 
            onClick={handleUpdateProfile} 
            disabled={loading}
            className="w-full h-11 rounded-xl gradient-primary"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Nome
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          Compartilhar Conta
        </h3>

        {isLinked ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary fill-primary/20" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Vinculado a:</p>
                <p className="text-sm font-semibold text-foreground">
                  {partnerDisplayName}
                </p>
              </div>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={handleUnlink} 
              disabled={loading}
              className="w-full h-11 rounded-xl"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remover Vínculo'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="partner-email" className="text-muted-foreground text-xs font-bold uppercase">Email do Parceiro</Label>
            <div className="flex gap-2">
              <Input
                id="partner-email"
                type="email"
                placeholder="email@do.parceiro.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="flex-1 h-11 rounded-xl"
              />
              <Button 
                onClick={handleLink} 
                disabled={loading}
                className="h-11 px-4 shrink-0 rounded-xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {!loading && 'Vincular'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}