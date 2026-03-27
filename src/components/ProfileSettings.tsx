import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, UserPlus, Loader2, User as UserIcon, Save, Heart } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { user, profile, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile]);

  const currentUserEmail = user?.email || '';
  const isLinked = !!profile?.linked_user_id;
  
  // Determina o nome a ser exibido para o parceiro
  const partnerDisplayName = profile?.partnerName || 'Parceiro';

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error('O nome não pode estar vazio.');
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({ name });
    setLoading(false);

    if (error) {
      toast.error('Erro ao atualizar nome.');
    } else {
      toast.success('Nome atualizado com sucesso!');
    }
  };

  const handleLink = async () => {
    const cleanEmail = partnerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      toast.error('Por favor, insira um email válido.');
      return;
    }

    if (cleanEmail === currentUserEmail.toLowerCase()) {
      toast.error('Você não pode vincular seu próprio email.');
      return;
    }

    setLoading(true);
    try {
      // Buscar o user_id pelo email na tabela profiles
      // Agora a RLS permite que usuários logados façam essa busca
      const { data: partnerProfile, error: searchError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (searchError) {
        console.error("Erro na busca:", searchError);
        toast.error('Erro ao buscar parceiro.');
        return;
      }

      if (!partnerProfile) {
        toast.error('Nenhum usuário encontrado com esse email.');
        return;
      }

      const { error } = await updateProfile({ linked_user_id: partnerProfile.user_id });
      if (error) {
        toast.error('Erro ao vincular perfil.');
        return;
      }
      
      toast.success('Vinculado com sucesso!');
      setPartnerEmail('');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    const { error } = await updateProfile({ linked_user_id: null });
    setLoading(false);

    if (error) {
      toast.error('Erro ao desvincular perfil.');
    } else {
      toast.success('Perfil desvinculado.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Name Edit Section */}
      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          Dados Pessoais
        </h3>
        <div className="space-y-2">
          <Label htmlFor="user-name" className="text-muted-foreground">Seu Nome</Label>
          <div className="flex gap-2">
            <Input
              id="user-name"
              placeholder="Como você quer ser chamado?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 h-10 touch-target"
            />
            <Button 
              onClick={handleUpdateName} 
              disabled={loading}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Linking Section */}
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
              className="w-full h-10 rounded-lg touch-target"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desvincular'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="partner-email" className="text-muted-foreground">Email do Parceiro</Label>
            <div className="flex gap-2">
              <Input
                id="partner-email"
                type="email"
                placeholder="email@exemplo.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="flex-1 h-10 touch-target"
              />
              <Button 
                onClick={handleLink} 
                disabled={loading}
                className="h-10 rounded-lg touch-target shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Digite o email da pessoa com quem deseja compartilhar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}