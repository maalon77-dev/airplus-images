'use client';

import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Crown, Shield, UserCheck } from 'lucide-react';
import * as React from 'react';

interface UserHeaderProps {
    user: {
        id: number;
        username: string;
        email: string;
        user_level: string;
        last_login: string;
    };
    onLogout: () => void;
}

export function UserHeader({ user, onLogout }: UserHeaderProps) {
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            onLogout();
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'admin_supremo': return <Crown className="h-4 w-4 text-red-400" />;
            case 'admin': return <Shield className="h-4 w-4 text-yellow-400" />;
            case 'usuario_normal': return <UserCheck className="h-4 w-4 text-green-400" />;
            default: return <User className="h-4 w-4 text-gray-400" />;
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

    return (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-white">
                    Sistema de Geração de Imagens
                </h1>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        className="flex items-center space-x-2 text-white hover:bg-white/10"
                    >
                        {getLevelIcon(user.user_level)}
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{user.username}</span>
                            <span className={`text-xs ${getLevelColor(user.user_level)}`}>
                                {getLevelName(user.user_level)}
                            </span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 border-white/20 bg-black text-white">
                    <DropdownMenuLabel className="text-white">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">{user.username}</p>
                            <p className="text-xs text-white/60">{user.email}</p>
                            <p className={`text-xs ${getLevelColor(user.user_level)}`}>
                                {getLevelName(user.user_level)}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isLoggingOut ? 'Saindo...' : 'Sair'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
