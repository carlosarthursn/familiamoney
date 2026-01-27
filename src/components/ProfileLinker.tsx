import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, UserPlus, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileLinker() {
  const { user, profile, refreshProfile } = useAuth();
  const [linkedUserId, setLinkedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUserId = user?.id || '';
  const isLinked = !!profile?.linked_user_id;

  const handleLink = async () => {
    if (!linkedUserId || linkedUserId === currentUserId) {
      toast.error('ID inválido ou é o seu próprio ID.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verificar se o ID existe (opcional, mas bom)
      const { data: targetProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', linkedUserId)
        .single();

      if (fetchError || !targetProfile) {
        toast.error('ID de usuário não encontrado.');
        setLoading(false);
        return;
      }

      // 2. Atualizar o perfil do usuário logado com o ID vinculado
      const { error } = await supabase
        .from('profiles')
        .update({ linked_user_id: linkedUserId })
        .eq('user_id', currentUserId);

      if (error) {
        toast.error('Erro ao vincular perfil: ' + error.message);
        return;
      }

      toast.success('Perfil vinculado com sucesso! As transações serão compartilhadas.');
      await refreshProfile();
    } finally {
      setLoading(false);
      setLinkedUserId('');
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ linked_user_id: null })
        .eq('user_id', currentUserId);

      if (error) {
        toast.error('Erro ao desvincular perfil.');
        return;
      }

      toast.success('Perfil desvinculado.');
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (currentUserId) {
      navigator.clipboard.writeText(currentUserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Seu ID copiado!');
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Link className="h-5 w-5 text-primary" />
        Vincular Perfil
      </h3>
      
      {/* Display Current User ID */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Seu ID de Usuário (para compartilhar)</Label>
        <div className="flex gap-2">
          <Input 
            value={currentUserId} 
            readOnly 
            className="flex-1 bg-muted text-xs truncate" 
          />
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={handleCopy}
            className="touch-target"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isLinked ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Atualmente vinculado ao ID: <span className="font-mono text-xs text-foreground truncate">{profile?.linked_user_id}</span>
          </p>
          <Button 
            variant="destructive" 
            onClick={handleUnlink} 
            disabled={loading}
            className="w-full h-10 rounded-lg touch-target"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desvincular Perfil'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="linked-id" className="text-muted-foreground">ID do Perfil para Vincular</Label>
          <div className="flex gap-2">
            <Input
              id="linked-id"
              placeholder="Cole o ID do outro usuário aqui"
              value={linkedUserId}
              onChange={(e) => setLinkedUserId(e.target.value)}
              className="flex-1 h-10 touch-target"
            />
            <Button 
              onClick={handleLink} 
              disabled={loading}
              className="h-10 rounded-lg touch-target"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}