import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, UserPlus, Loader2, Copy, Check, User as UserIcon, Save, Heart } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { user, profile, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile]);

  const currentUserId = user?.id || '';
  const isLinked = !!profile?.linked_user_id;

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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!linkedUserId || !uuidRegex.test(linkedUserId)) {
      toast.error('Por favor, insira um ID de usuário válido.');
      return;
    }

    if (linkedUserId === currentUserId) {
      toast.error('Você não pode vincular o seu próprio ID.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateProfile({ linked_user_id: linkedUserId });
      if (error) {
        toast.error('Erro ao vincular perfil.');
        return;
      }
      
      // A mensagem agora pode ser mais amigável
      toast.success('Vinculado com sucesso!');
    } finally {
      setLoading(false);
      setLinkedUserId('');
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

  const handleCopy = () => {
    if (currentUserId) {
      navigator.clipboard.writeText(currentUserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('ID copiado!');
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
        
        <div className="space-y-2">
          <Label className="text-muted-foreground">Seu ID (envie para o parceiro)</Label>
          <div className="flex gap-2">
            <Input 
              value={currentUserId} 
              readOnly 
              className="flex-1 bg-muted text-[10px] truncate" 
            />
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={handleCopy}
              className="h-10 w-10 shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isLinked ? (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary fill-primary/20" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Vinculado a:</p>
                <p className="text-sm font-semibold text-foreground">
                  {profile?.partnerName || 'Carregando...'}
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
            <Label htmlFor="linked-id" className="text-muted-foreground">ID do Parceiro</Label>
            <div className="flex gap-2">
              <Input
                id="linked-id"
                placeholder="Cole o ID aqui"
                value={linkedUserId}
                onChange={(e) => setLinkedUserId(e.target.value)}
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
          </div>
        )}
      </div>
    </div>
  );
}