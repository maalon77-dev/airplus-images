'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

interface LoginFormProps {
    onLoginSuccess: (user: {id: number; username: string; email: string; user_level: string; last_login: string}) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                onLoginSuccess(data.user);
            } else {
                setError(data.error || 'Erro no login');
            }
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setIsLoading(false);
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

    const getLevelName = (level: string) => {
        switch (level) {
            case 'admin_supremo': return 'ADMIN SUPREMO';
            case 'admin': return 'ADMIN';
            case 'usuario_normal': return 'USUÁRIO NORMAL';
            default: return 'DESCONHECIDO';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Card className="w-full max-w-md border border-white/10 bg-black">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">
                        Sistema de Geração de Imagens
                    </CardTitle>
                    <CardDescription className="text-white/60">
                        Faça login para acessar o sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-white">
                                Usuário
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Digite seu usuário"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pl-10 border-white/20 bg-black text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white">
                                Senha
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Digite sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pl-10 pr-10 border-white/20 bg-black text-white placeholder:text-white/40 focus:border-white/50 focus:ring-white/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-white/40 hover:text-white/60"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="border-red-500/50 bg-red-900/20 text-red-300">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || !username || !password}
                            className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/40"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>

                    <div className="mt-6 space-y-3">
                        <div className="text-center text-sm text-white/60">
                            Usuários de teste disponíveis:
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center p-2 rounded bg-white/5">
                                <span className="text-white/80">admin_supremo</span>
                                <span className={getLevelColor('admin_supremo')}>
                                    {getLevelName('admin_supremo')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-white/5">
                                <span className="text-white/80">admin</span>
                                <span className={getLevelColor('admin')}>
                                    {getLevelName('admin')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-white/5">
                                <span className="text-white/80">usuario_teste</span>
                                <span className={getLevelColor('usuario_normal')}>
                                    {getLevelName('usuario_normal')}
                                </span>
                            </div>
                        </div>
                        <div className="text-center text-xs text-white/40">
                            Senhas: admin123, admin456, user789
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
