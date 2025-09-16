'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

interface PaymentCheckoutProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        id: number;
        name: string;
        price_usd: number;
        price_brl: number;
        credits_included: number;
    };
    currency: 'usd' | 'brl';
}

export function PaymentCheckout({ isOpen, onClose, plan, currency }: PaymentCheckoutProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [stripe, setStripe] = useState<any>(null);

    useEffect(() => {
        const initializeStripe = async () => {
            const stripeInstance = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
            setStripe(stripeInstance);
        };
        initializeStripe();
    }, []);

    const handlePayment = async () => {
        if (!stripe) {
            setError('Stripe não foi carregado. Tente novamente.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setPaymentStatus('processing');

        try {
            // Criar Payment Intent
            const response = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan_id: plan.id,
                    currency: currency
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Erro ao criar pagamento');
            }

            // Confirmar pagamento com Stripe
            const { error: stripeError } = await stripe.confirmPayment({
                clientSecret: data.payment_intent.client_secret,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                },
                redirect: 'if_required'
            });

            if (stripeError) {
                throw new Error(stripeError.message || 'Erro no pagamento');
            }

            setPaymentStatus('success');
            
            // Fechar modal após 3 segundos
            setTimeout(() => {
                onClose();
                setPaymentStatus('idle');
                // Recarregar a página para atualizar créditos
                window.location.reload();
            }, 3000);

        } catch (err) {
            console.error('Erro no pagamento:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            setPaymentStatus('failed');
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number, currency: 'usd' | 'brl') => {
        const symbol = currency === 'usd' ? '$' : 'R$';
        return `${symbol}${price.toFixed(2)}`;
    };

    const getStatusIcon = () => {
        switch (paymentStatus) {
            case 'processing':
                return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'failed':
                return <XCircle className="h-6 w-6 text-red-500" />;
            default:
                return <CreditCard className="h-6 w-6 text-gray-400" />;
        }
    };

    const getStatusMessage = () => {
        switch (paymentStatus) {
            case 'processing':
                return 'Processando pagamento...';
            case 'success':
                return 'Pagamento realizado com sucesso!';
            case 'failed':
                return 'Falha no pagamento';
            default:
                return 'Finalizar pagamento';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        {getStatusIcon()}
                        {getStatusMessage()}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {paymentStatus === 'idle' && 'Confirme os detalhes do seu pagamento'}
                        {paymentStatus === 'processing' && 'Aguarde enquanto processamos seu pagamento...'}
                        {paymentStatus === 'success' && 'Seus créditos foram adicionados com sucesso!'}
                        {paymentStatus === 'failed' && 'Ocorreu um erro durante o pagamento'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {paymentStatus === 'idle' && (
                        <>
                            {/* Resumo do Plano */}
                            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Plano:</span>
                                    <span className="text-white font-medium">{plan.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Créditos:</span>
                                    <span className="text-white font-medium">{plan.credits_included}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                                    <span className="text-gray-300">Total:</span>
                                    <span className="text-white font-bold text-lg">
                                        {formatPrice(currency === 'usd' ? plan.price_usd : plan.price_brl, currency)}
                                    </span>
                                </div>
                            </div>

                            {/* Informações de Segurança */}
                            <div className="text-xs text-gray-400 space-y-1">
                                <p>🔒 Pagamento seguro processado pelo Stripe</p>
                                <p>💳 Aceitamos cartões de crédito e débito</p>
                                <p>⚡ Créditos adicionados instantaneamente</p>
                            </div>
                        </>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {paymentStatus === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="text-green-500 text-4xl">✅</div>
                            <div className="space-y-2">
                                <p className="text-white font-medium">Pagamento realizado com sucesso!</p>
                                <p className="text-gray-400">
                                    {plan.credits_included} créditos foram adicionados à sua conta.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex gap-3">
                        {paymentStatus === 'idle' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handlePayment}
                                    disabled={isLoading || !stripe}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Pagar {formatPrice(currency === 'usd' ? plan.price_usd : plan.price_brl, currency)}
                                        </>
                                    )}
                                </Button>
                            </>
                        )}

                        {paymentStatus === 'success' && (
                            <Button
                                onClick={() => {
                                    onClose();
                                    setPaymentStatus('idle');
                                    window.location.reload();
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                Continuar
                            </Button>
                        )}

                        {paymentStatus === 'failed' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPaymentStatus('idle');
                                        setError(null);
                                    }}
                                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    Tentar Novamente
                                </Button>
                                <Button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                                >
                                    Fechar
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
