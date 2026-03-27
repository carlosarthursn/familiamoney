import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, UserPlus, Loader2, User as UserIcon, Save, Heart, Camera } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { user, profile, updateProfile, linkPartner, unlinkPartner } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
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
    const { error } = await updateProfile({ name, avatar_url: avatarUrl || null });
    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar perfil.');
    } else {
      toast.success('Perfil atualizado!');
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
      
      toast.success('Vínculo realizado em ambas as contas!');
      setPartnerEmail('');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao realizar vínculo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Deseja realmente desvincular as contas? O histórico de ambos deixará de ser compartilhado.')) return;
    
    setLoading(true);
    const { error } = await unlinkPartner();
    setLoading(false);

    if (error) {
      toast.error('Erro ao desvincular.');
    } else {
      toast.success('Contas desvinculadas com sucesso.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          Dados Pessoais
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name" className="text-muted-foreground text-xs font-bold uppercase">Seu Nome</Label>
            <Input
              id="user-name"
              placeholder="Ex: Carlos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-url" className="text-muted-foreground text-xs font-bold uppercase">URL da Foto de Perfil</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="avatar-url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleUpdateProfile} 
            disabled={loading}
            className="w-full h-11 gradient-primary"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          Compartilhar Conta
        </h3>

        {isLinked ? (
          <div className="space-y-4 animate-fade-in">
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
              className="w-full h-11"
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
                className="flex-1 h-11"
              />
              <Button 
                onClick={handleLink} 
                disabled={loading}
                className="h-11 px-4 shrink-0"
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