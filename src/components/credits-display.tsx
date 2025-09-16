'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, Plus, History, CreditCard } from 'lucide-react';

interface CreditsData {
    credits_balance: number;
    total_credits_earned: number;
    total_credits_used: number;
}

interface CreditsDisplayProps {
    onShowPaymentPlans: () => void;
}

export function CreditsDisplay({ onShowPaymentPlans }: CreditsDisplayProps) {
    const [credits, setCredits] = useState<CreditsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCredits();
    }, []);

    const fetchCredits = async () => {
        try {
            const response = await fetch('/api/payments/status', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                setCredits(data.credits);
            } else {
                setError('Erro ao carregar créditos');
            }
        } catch {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const getCreditsStatus = (balance: number) => {
        if (balance === 0) return { text: 'Sem créditos', variant: 'destructive' as const };
        if (balance < 10) return { text: 'Créditos baixos', variant: 'secondary' as const };
        if (balance < 50) return { text: 'Créditos médios', variant: 'default' as const };
        return { text: 'Créditos suficientes', variant: 'default' as const };
    };

    if (loading) {
        return (
            <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span className="ml-2 text-gray-300">Carregando créditos...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!credits) {
        return (
            <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-6 text-center">
                    <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">Nenhum crédito encontrado</p>
                    <Button onClick={onShowPaymentPlans} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Créditos
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const status = getCreditsStatus(credits.credits_balance);

    return (
        <div className="space-y-4">
            {/* Card Principal de Créditos */}
            <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Coins className="h-5 w-5 text-yellow-500" />
                            Meus Créditos
                        </CardTitle>
                        <Badge variant={status.variant}>
                            {status.text}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-2">
                            {credits.credits_balance}
                        </div>
                        <div className="text-sm text-gray-400">
                            créditos disponíveis
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-green-400">
                                {credits.total_credits_earned}
                            </div>
                            <div className="text-gray-400">Total ganhos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-orange-400">
                                {credits.total_credits_used}
                            </div>
                            <div className="text-gray-400">Total usados</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            onClick={onShowPaymentPlans} 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Créditos
                        </Button>
                        <Button 
                            variant="outline" 
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            onClick={fetchCredits}
                        >
                            <History className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Informações sobre Créditos */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                    <div className="text-sm text-gray-300 space-y-2">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-400" />
                            <span>1 crédito = 1 geração de imagem</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-yellow-400" />
                            <span>Créditos não expiram</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-green-400" />
                            <span>Histórico de uso disponível</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Aviso se créditos estão baixos */}
            {credits.credits_balance < 10 && (
                <Alert variant="destructive">
                    <AlertDescription>
                        ⚠️ Seus créditos estão baixos! Adicione mais créditos para continuar gerando imagens.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
