'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Check, Zap } from 'lucide-react';

interface PaymentPlan {
    id: number;
    name: string;
    description: string;
    price_usd: number;
    price_brl: number;
    credits_included: number;
}

interface PaymentPlansProps {
    onSelectPlan: (plan: PaymentPlan, currency: 'usd' | 'brl') => void;
    isLoading?: boolean;
}

export function PaymentPlans({ onSelectPlan, isLoading = false }: PaymentPlansProps) {
    const [plans, setPlans] = useState<PaymentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCurrency, setSelectedCurrency] = useState<'usd' | 'brl'>('brl');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/payments/plans');
            const data = await response.json();
            
            if (data.success) {
                setPlans(data.plans);
            } else {
                setError('Erro ao carregar planos de pagamento');
            }
        } catch (err) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number, currency: 'usd' | 'brl') => {
        const symbol = currency === 'usd' ? '$' : 'R$';
        return `${symbol}${price.toFixed(2)}`;
    };

    const getPlanIcon = (planName: string) => {
        if (planName.includes('Básico')) return '🟢';
        if (planName.includes('Profissional')) return '🔵';
        if (planName.includes('Empresarial')) return '🟣';
        if (planName.includes('Créditos')) return '⚡';
        return '💎';
    };

    const getPlanBadge = (planName: string) => {
        if (planName.includes('Empresarial')) return { text: 'Mais Popular', variant: 'default' as const };
        if (planName.includes('Profissional')) return { text: 'Recomendado', variant: 'secondary' as const };
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-2">Carregando planos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Seletor de Moeda */}
            <div className="flex justify-center">
                <div className="bg-gray-800 rounded-lg p-1 flex">
                    <button
                        onClick={() => setSelectedCurrency('brl')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedCurrency === 'brl'
                                ? 'bg-white text-black'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        🇧🇷 BRL
                    </button>
                    <button
                        onClick={() => setSelectedCurrency('usd')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedCurrency === 'usd'
                                ? 'bg-white text-black'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        🇺🇸 USD
                    </button>
                </div>
            </div>

            {/* Grid de Planos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const badge = getPlanBadge(plan.name);
                    const price = selectedCurrency === 'usd' ? plan.price_usd : plan.price_brl;
                    
                    return (
                        <Card key={plan.id} className="relative bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
                            {badge && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <Badge variant={badge.variant} className="text-xs">
                                        {badge.text}
                                    </Badge>
                                </div>
                            )}
                            
                            <CardHeader className="text-center pb-4">
                                <div className="text-4xl mb-2">{getPlanIcon(plan.name)}</div>
                                <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="text-center space-y-4">
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold text-white">
                                        {formatPrice(price, selectedCurrency)}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {plan.credits_included} créditos incluídos
                                    </div>
                                </div>
                                
                                <div className="space-y-2 text-sm text-gray-300">
                                    <div className="flex items-center justify-center">
                                        <Check className="h-4 w-4 text-green-500 mr-2" />
                                        <span>Geração de imagens</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <Check className="h-4 w-4 text-green-500 mr-2" />
                                        <span>Edição de imagens</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <Check className="h-4 w-4 text-green-500 mr-2" />
                                        <span>Histórico ilimitado</span>
                                    </div>
                                    {plan.name.includes('Profissional') && (
                                        <div className="flex items-center justify-center">
                                            <Zap className="h-4 w-4 text-yellow-500 mr-2" />
                                            <span>Prioridade na fila</span>
                                        </div>
                                    )}
                                    {plan.name.includes('Empresarial') && (
                                        <div className="flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-blue-500 mr-2" />
                                            <span>Suporte prioritário</span>
                                        </div>
                                    )}
                                </div>
                                
                                <Button
                                    onClick={() => onSelectPlan(plan, selectedCurrency)}
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isLoading ? 'Processando...' : 'Selecionar Plano'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Informações Adicionais */}
            <div className="text-center text-sm text-gray-400 space-y-2">
                <p>💳 Pagamentos seguros processados pelo Stripe</p>
                <p>🔄 Créditos são adicionados instantaneamente após o pagamento</p>
                <p>📧 Receba confirmação por email</p>
            </div>
        </div>
    );
}
