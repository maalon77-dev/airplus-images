'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, User, Crown, Users } from 'lucide-react';

interface UserHeaderProps {
    user: {
        id: number;
        username: string;
        userLevel: string;
    };
    onLogout: () => void;
}

export function UserHeader({ user, onLogout }: UserHeaderProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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

    const isAdmin = user.userLevel === 'ADMIN_SUPREMO';

    return (
        <Card className="mb-6 border-white/10 bg-neutral-900">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {isAdmin ? (
                                <Crown className="h-5 w-5 text-yellow-500" />
                            ) : (
                                <User className="h-5 w-5 text-blue-500" />
                            )}
                            <span className="text-white font-medium">
                                {user.username}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {isAdmin ? (
                                <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-600/30">
                                    ADMIN SUPREMO
                                </span>
                            ) : (
                                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full border border-blue-600/30">
                                    USUÁRIO
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isLoggingOut ? 'Saindo...' : 'Sair'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
