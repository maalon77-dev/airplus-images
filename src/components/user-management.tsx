'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Eye, EyeOff, Plus, Trash2, Users, Crown, User } from 'lucide-react';

interface User {
    id: number;
    username: string;
    userLevel: string;
    createdAt: string;
}

interface UserManagementProps {
    currentUser: {
        id: number;
        username: string;
        userLevel: string;
    };
}

export function UserManagement({ currentUser }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Form states
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newUserLevel, setNewUserLevel] = useState<'ADMIN_SUPREMO' | 'USUARIO'>('USUARIO');
    const [showPassword, setShowPassword] = useState(false);

    // Carregar lista de usuários
    const loadUsers = async () => {
        try {
            const response = await fetch('/api/users/list');
            if (!response.ok) {
                throw new Error('Erro ao carregar usuários');
            }
            const data = await response.json();
            setUsers(data.users);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Criar novo usuário
    const handleCreateUser = async () => {
        if (!newUsername.trim() || !newPassword.trim()) {
            setError('Username e senha são obrigatórios');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    userLevel: newUserLevel
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar usuário');
            }

            // Limpar formulário e recarregar lista
            setNewUsername('');
            setNewPassword('');
            setNewUserLevel('USUARIO');
            setIsCreateDialogOpen(false);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
        } finally {
            setIsLoading(false);
        }
    };

    // Deletar usuário
    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Tem certeza de que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
            return;
        }

        setIsDeleting(userId);
        setError(null);

        try {
            const response = await fetch('/api/users/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao deletar usuário');
            }

            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao deletar usuário');
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <Card className="border-white/10 bg-neutral-900">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-white">Gerenciamento de Usuários</CardTitle>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Criar Usuário
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="border-neutral-700 bg-neutral-900 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-white">Criar Novo Usuário</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-white">Username</Label>
                                    <Input
                                        id="username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Digite o username"
                                        className="bg-neutral-800 border-white/20 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-white">Senha</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Digite a senha"
                                            className="bg-neutral-800 border-white/20 text-white pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-neutral-400" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-neutral-400" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="userLevel" className="text-white">Nível de Usuário</Label>
                                    <Select value={newUserLevel} onValueChange={(value: 'ADMIN_SUPREMO' | 'USUARIO') => setNewUserLevel(value)}>
                                        <SelectTrigger className="bg-neutral-800 border-white/20 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-800 border-neutral-700">
                                            <SelectItem value="USUARIO" className="text-white hover:bg-neutral-700">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-500" />
                                                    Usuário
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="ADMIN_SUPREMO" className="text-white hover:bg-neutral-700">
                                                <div className="flex items-center gap-2">
                                                    <Crown className="h-4 w-4 text-yellow-500" />
                                                    Admin Supremo
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateUser}
                                    disabled={isLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isLoading ? 'Criando...' : 'Criar Usuário'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-900/20 text-red-300">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <div className="space-y-3">
                    {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-neutral-800">
                            <div className="flex items-center gap-3">
                                {user.userLevel === 'ADMIN_SUPREMO' ? (
                                    <Crown className="h-5 w-5 text-yellow-500" />
                                ) : (
                                    <User className="h-5 w-5 text-blue-500" />
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{user.username}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            user.userLevel === 'ADMIN_SUPREMO' 
                                                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                                                : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                                        }`}>
                                            {user.userLevel === 'ADMIN_SUPREMO' ? 'ADMIN SUPREMO' : 'USUÁRIO'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400">
                                        Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            {user.id !== currentUser.id && (
                                <Button
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={isDeleting === user.id}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
