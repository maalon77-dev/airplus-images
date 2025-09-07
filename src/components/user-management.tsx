'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Plus, Crown, Shield, UserCheck } from 'lucide-react';
import * as React from 'react';

interface User {
    id: number;
    username: string;
    email: string;
    user_level: string;
    is_active: boolean;
    last_login: string;
    created_at: string;
}

interface UserManagementProps {
    currentUser: {
        user_level: string;
    };
}

export function UserManagement({ currentUser }: UserManagementProps) {
    const [users, setUsers] = React.useState<User[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    
    // Formulário de criação
    const [newUser, setNewUser] = React.useState({
        username: '',
        email: '',
        password: '',
        user_level: 'usuario_normal'
    });

    const isAdmin = currentUser.user_level === 'admin' || currentUser.user_level === 'admin_supremo';
    const isSuperAdmin = currentUser.user_level === 'admin_supremo';

    React.useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.users);
            } else {
                setError(data.error || 'Erro ao carregar usuários');
            }
        } catch {
            setError('Erro de conexão');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError('');

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            const data = await response.json();

            if (data.success) {
                setNewUser({ username: '', email: '', password: '', user_level: 'usuario_normal' });
                setShowCreateForm(false);
                fetchUsers();
            } else {
                setError(data.error || 'Erro ao criar usuário');
            }
        } catch {
            setError('Erro de conexão');
        } finally {
            setIsCreating(false);
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'admin_supremo': return <Crown className="h-4 w-4 text-red-400" />;
            case 'admin': return <Shield className="h-4 w-4 text-yellow-400" />;
            case 'usuario_normal': return <UserCheck className="h-4 w-4 text-green-400" />;
            default: return <Users className="h-4 w-4 text-gray-400" />;
        }
    };

    const getLevelName = (level: string) => {
        switch (level) {
            case 'admin_supremo': return 'Admin Supremo';
            case 'admin': return 'Administrador';
            case 'usuario_normal': return 'Usuário Normal';
            default: return 'Desconhecido';
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'admin_supremo': return 'text-red-400';
            case 'admin': return 'text-yellow-400';
            case 'usuario_normal': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    if (!isAdmin) {
        return (
            <Card className="border-white/10 bg-black">
                <CardHeader>
                    <CardTitle className="text-white">Gerenciamento de Usuários</CardTitle>
                    <CardDescription className="text-white/60">
                        Acesso restrito a administradores
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive" className="border-red-500/50 bg-red-900/20 text-red-300">
                        <AlertDescription>
                            Você não tem permissão para acessar esta funcionalidade.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-white/10 bg-black">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Gerenciamento de Usuários
                        </CardTitle>
                        <CardDescription className="text-white/60">
                            Gerencie usuários e permissões do sistema
                        </CardDescription>
                    </div>
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-white text-black hover:bg-white/90"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive" className="border-red-500/50 bg-red-900/20 text-red-300">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {showCreateForm && (
                    <Card className="border-white/5 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Criar Novo Usuário</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-white">Usuário</Label>
                                        <Input
                                            id="username"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            required
                                            className="border-white/20 bg-black text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-white">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            required
                                            className="border-white/20 bg-black text-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-white">Senha</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                            className="border-white/20 bg-black text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="user_level" className="text-white">Nível</Label>
                                        <Select
                                            value={newUser.user_level}
                                            onValueChange={(value) => setNewUser({ ...newUser, user_level: value })}
                                        >
                                            <SelectTrigger className="border-white/20 bg-black text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-white/20 bg-black text-white">
                                                <SelectItem value="usuario_normal">Usuário Normal</SelectItem>
                                                <SelectItem value="admin">Administrador</SelectItem>
                                                {isSuperAdmin && (
                                                    <SelectItem value="admin_supremo">Admin Supremo</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreating}
                                        className="bg-white text-black hover:bg-white/90"
                                    >
                                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isCreating ? 'Criando...' : 'Criar Usuário'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCreateForm(false)}
                                        className="border-white/20 text-white hover:bg-white/10"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5"
                            >
                                <div className="flex items-center space-x-4">
                                    {getLevelIcon(user.user_level)}
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-white">{user.username}</span>
                                            <span className={`text-xs px-2 py-1 rounded ${getLevelColor(user.user_level)} bg-white/10`}>
                                                {getLevelName(user.user_level)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-white/60">{user.email}</div>
                                        <div className="text-xs text-white/40">
                                            Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        user.is_active ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                                    }`}>
                                        {user.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
