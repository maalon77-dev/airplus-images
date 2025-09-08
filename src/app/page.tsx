'use client';

import { EditingForm, type EditingFormData } from '@/components/editing-form';
import { GenerationForm, type GenerationFormData } from '@/components/generation-form';
import { HistoryPanel } from '@/components/history-panel';
import { ImageOutput } from '@/components/image-output';
import { PasswordDialog } from '@/components/password-dialog';
import { LoginForm } from '@/components/login-form';
import { UserHeader } from '@/components/user-header';
import { UserManagement } from '@/components/user-management';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { calculateApiCost, type CostDetails } from '@/lib/cost-utils';
import { db, type ImageRecord } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as React from 'react';

type HistoryImage = {
    filename: string;
};

export type HistoryMetadata = {
    timestamp: number;
    images: HistoryImage[];
    storageModeUsed?: 'fs' | 'indexeddb' | 'mysql' | 'ftp';
    durationMs: number;
    quality: GenerationFormData['quality'];
    background: GenerationFormData['background'];
    moderation: GenerationFormData['moderation'];
    prompt: string;
    mode: 'generate' | 'edit';
    costDetails: CostDetails | null;
    output_format?: GenerationFormData['output_format'];
    user?: {
        id: number;
        username: string;
        user_level: string;
    };
};

type DrawnPoint = {
    x: number;
    y: number;
    size: number;
};

const MAX_EDIT_IMAGES = 10;

const explicitModeClient = process.env.NEXT_PUBLIC_IMAGE_STORAGE_MODE;

const vercelEnvClient = process.env.NEXT_PUBLIC_VERCEL_ENV;
const isOnVercelClient = vercelEnvClient === 'production' || vercelEnvClient === 'preview';

// Função para determinar o storage mode efetivo
const getEffectiveStorageMode = (): 'fs' | 'indexeddb' | 'mysql' | 'ftp' => {
    if (explicitModeClient === 'mysql') {
        return 'mysql';
    } else if (explicitModeClient === 'fs') {
        return 'fs';
    } else if (explicitModeClient === 'indexeddb') {
        return 'indexeddb';
    } else if (explicitModeClient === 'ftp') {
        return 'ftp';
    } else if (isOnVercelClient) {
        return 'indexeddb';
    } else {
        // Forçar FS no desenvolvimento local (mais simples e funcional)
        return 'fs';
    }
};

const effectiveStorageModeClient = getEffectiveStorageMode();
console.log(
    `Client Effective Storage Mode: ${effectiveStorageModeClient} (Explicit: ${explicitModeClient || 'unset'}, Vercel Env: ${vercelEnvClient || 'N/A'})`
);
console.log('🔍 DEBUG Storage Mode:', {
    explicitModeClient,
    vercelEnvClient,
    isOnVercelClient,
    effectiveStorageModeClient
});

type ApiImageResponseItem = {
    filename: string;
    b64_json?: string;
    output_format: string;
    path?: string;
};

export default function HomePage() {
    const [user, setUser] = React.useState<{ id: number; username: string; userLevel: string } | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
    const [mode, setMode] = React.useState<'generate' | 'edit'>('edit');
    const [isPasswordRequiredByBackend, setIsPasswordRequiredByBackend] = React.useState<boolean | null>(null);
    const [clientPasswordHash, setClientPasswordHash] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSendingToEdit, setIsSendingToEdit] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [latestImageBatch, setLatestImageBatch] = React.useState<{ path: string; filename: string }[] | null>(null);
    const [imageOutputView, setImageOutputView] = React.useState<'grid' | number>('grid');
    const [history, setHistory] = React.useState<HistoryMetadata[]>([]);
    
    // Log para monitorar mudanças no estado do histórico
    React.useEffect(() => {
        if (history.length > 0) {
            console.log('📊 Estado do histórico mudou:', history.length, 'itens');
            console.log('👤 Usuário atual:', user?.username, 'Nível:', user?.userLevel);
            console.log('✅ Histórico carregado com sucesso');
        }
    }, [history.length, user?.username, user?.userLevel]);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [blobUrlCache, setBlobUrlCache] = React.useState<Record<string, string>>({});
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
    const [passwordDialogContext, setPasswordDialogContext] = React.useState<'initial' | 'retry'>('initial');
    const [lastApiCallArgs, setLastApiCallArgs] = React.useState<[GenerationFormData | EditingFormData] | null>(null);
    const [skipDeleteConfirmation, setSkipDeleteConfirmation] = React.useState<boolean>(false);
    const [itemToDeleteConfirm, setItemToDeleteConfirm] = React.useState<HistoryMetadata | null>(null);
    const [dialogCheckboxStateSkipConfirm, setDialogCheckboxStateSkipConfirm] = React.useState<boolean>(false);

    const allDbImages = useLiveQuery<ImageRecord[] | undefined>(() => db.images.toArray(), []);

    const [editImageFiles, setEditImageFiles] = React.useState<File[]>([]);
    const [editSourceImagePreviewUrls, setEditSourceImagePreviewUrls] = React.useState<string[]>([]);
    const [editPrompt, setEditPrompt] = React.useState('');
    const [editN, setEditN] = React.useState([1]);
    const [editSize, setEditSize] = React.useState<EditingFormData['size']>('auto');
    const [editQuality, setEditQuality] = React.useState<EditingFormData['quality']>('high');
    const [editBrushSize, setEditBrushSize] = React.useState([20]);
    const [editShowMaskEditor, setEditShowMaskEditor] = React.useState(false);
    const [editGeneratedMaskFile, setEditGeneratedMaskFile] = React.useState<File | null>(null);
    const [editIsMaskSaved, setEditIsMaskSaved] = React.useState(false);
    const [editOriginalImageSize, setEditOriginalImageSize] = React.useState<{ width: number; height: number } | null>(
        null
    );
    const [editDrawnPoints, setEditDrawnPoints] = React.useState<DrawnPoint[]>([]);
    const [editMaskPreviewUrl, setEditMaskPreviewUrl] = React.useState<string | null>(null);

    const [genPrompt, setGenPrompt] = React.useState('');
    const [genN, setGenN] = React.useState([1]);
    const [genSize, setGenSize] = React.useState<GenerationFormData['size']>('auto');
    const [genQuality, setGenQuality] = React.useState<GenerationFormData['quality']>('auto');
    const [genOutputFormat, setGenOutputFormat] = React.useState<GenerationFormData['output_format']>('png');
    const [genCompression, setGenCompression] = React.useState([100]);
    const [genBackground, setGenBackground] = React.useState<GenerationFormData['background']>('auto');
    const [genModeration, setGenModeration] = React.useState<GenerationFormData['moderation']>('auto');

    const getImageSrc = React.useCallback(
        (filename: string): string | undefined => {
            if (blobUrlCache[filename]) {
                return blobUrlCache[filename];
            }

            if (effectiveStorageModeClient === 'mysql') {
                return `/api/mysql-images?filename=${encodeURIComponent(filename)}`;
            }

            if (effectiveStorageModeClient === 'ftp') {
                // Para FTP, as imagens são servidas diretamente do servidor FTP
                // A URL será construída baseada na configuração FTP_BASE_URL
                return `/api/mysql-images?filename=${encodeURIComponent(filename)}`;
            }

            const record = allDbImages?.find((img) => img.filename === filename);
            if (record?.blob) {
                const url = URL.createObjectURL(record.blob);
                return url;
            }

            return undefined;
        },
        [allDbImages, blobUrlCache]
    );

    React.useEffect(() => {
        return () => {
            console.log('Revoking blob URLs:', Object.keys(blobUrlCache).length);
            Object.values(blobUrlCache).forEach((url) => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [blobUrlCache]);

    React.useEffect(() => {
        return () => {
            editSourceImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [editSourceImagePreviewUrls]);

    // Função para carregar histórico do MySQL
    const loadMySQLHistory = React.useCallback(async () => {
        if (!user) {
            console.log('❌ loadMySQLHistory: Nenhum usuário logado');
            return;
        }
        
        try {
            console.log('🔄 Carregando histórico do MySQL para usuário:', user.username, 'ID:', user.id);
            const response = await fetch('/api/mysql-history', {
                credentials: 'include' // Garantir que cookies sejam enviados
            });
            console.log('📡 Response status:', response.status, response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Dados recebidos da API:', data);
                console.log('📊 data.success:', data.success);
                console.log('📊 data.history length:', data.history?.length);
                
                if (data.success && data.history) {
                    // Converter o formato do MySQL para o formato esperado pelo frontend
                    const convertedHistory: HistoryMetadata[] = data.history.map((item: {
                        timestamp: number;
                        images: { filename: string }[];
                        duration_ms: number;
                        quality: string;
                        background: string;
                        moderation: string;
                        prompt: string;
                        mode: string;
                        cost_usd: number;
                        cost_brl: number;
                        text_input_tokens: number;
                        image_input_tokens: number;
                        image_output_tokens: number;
                        output_format: string;
                        user?: {
                            id: number;
                            username: string;
                            user_level: string;
                        };
                    }) => ({
                        timestamp: item.timestamp,
                        images: item.images || [],
                        storageModeUsed: 'mysql' as const,
                        durationMs: item.duration_ms || 0,
                        quality: item.quality || 'auto',
                        background: item.background || 'auto',
                        moderation: item.moderation || 'auto',
                        prompt: item.prompt || '',
                        mode: item.mode || 'generate',
                        costDetails: item.cost_usd && item.cost_brl ? {
                            text_input_tokens: item.text_input_tokens || 0,
                            image_input_tokens: item.image_input_tokens || 0,
                            image_output_tokens: item.image_output_tokens || 0,
                            estimated_cost_usd: item.cost_usd,
                            estimated_cost_brl: item.cost_brl
                        } : null,
                        output_format: item.output_format || 'png',
                        user: item.user
                    }));
                    console.log('✅ Histórico convertido:', convertedHistory.length, 'itens');
                    console.log('📋 Detalhes do histórico:', convertedHistory);
                    
                    // FORÇAR ATUALIZAÇÃO DO ESTADO - SEM DELAY
                    console.log('🎯 Definindo histórico DIRETAMENTE:', convertedHistory.length, 'itens');
                    setHistory(convertedHistory);
                    console.log('✅ Histórico definido com sucesso!');
                } else {
                    console.log('❌ Nenhum histórico encontrado no MySQL');
                    setHistory([]);
                }
            } else {
                console.error('❌ Erro ao carregar histórico do MySQL:', response.statusText);
                setHistory([]);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar histórico do MySQL:', error);
            setHistory([]);
        }
    }, [user]);

    // Função para salvar histórico no MySQL
    const saveMySQLHistory = React.useCallback(async (historyEntry: HistoryMetadata) => {
        if (!user) return;
        
        try {
            const response = await fetch('/api/mysql-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: historyEntry.timestamp,
                    prompt: historyEntry.prompt,
                    mode: historyEntry.mode,
                    quality: historyEntry.quality,
                    background: historyEntry.background,
                    moderation: historyEntry.moderation,
                    output_format: historyEntry.output_format,
                    size: 'auto',
                    n_images: historyEntry.images.length,
                    duration_ms: historyEntry.durationMs,
                    cost_usd: historyEntry.costDetails?.estimated_cost_usd || 0,
                    cost_brl: historyEntry.costDetails?.estimated_cost_brl || 0,
                    text_input_tokens: historyEntry.costDetails?.text_input_tokens || 0,
                    image_input_tokens: historyEntry.costDetails?.image_input_tokens || 0,
                    image_output_tokens: historyEntry.costDetails?.image_output_tokens || 0,
                    image_filenames: historyEntry.images.map(img => img.filename)
                })
            });
            
            if (response.ok) {
                console.log('Histórico salvo no MySQL com sucesso');
            } else {
                console.error('Erro ao salvar histórico no MySQL:', response.statusText);
            }
        } catch (error) {
            console.error('Erro ao salvar histórico no MySQL:', error);
        }
    }, [user]);

    React.useEffect(() => {
        const loadHistory = async () => {
            console.log('🔄 useEffect loadHistory executado');
            console.log('👤 user:', user);
            
            if (user) {
                console.log('✅ Usuário logado - Carregando APENAS do MySQL para usuário:', user.username);
                // SEMPRE carregar do MySQL quando o usuário estiver logado
                await loadMySQLHistory();
            } else {
                console.log('❌ Nenhum usuário logado - Limpando histórico');
                // Limpar histórico quando não há usuário logado
                setHistory([]);
            }
            setIsInitialLoad(false);
        };
        
        // Evitar loops infinitos
        if (!isInitialLoad || user) {
            loadHistory();
        }
    }, [user?.id, isInitialLoad, loadMySQLHistory]); // Incluir todas as dependências necessárias

    // REMOVIDO: useEffect duplicado que causava conflito

    React.useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('🔐 Verificando autenticação...');
                const response = await fetch('/api/auth/me', {
                    credentials: 'include' // Garantir que cookies sejam enviados
                });
                console.log('🔐 Response auth status:', response.status, response.ok);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('🔐 Dados de autenticação:', data);
                    setUser(data.user);
                    console.log('🔐 Usuário definido:', data.user);
                } else {
                    console.log('🔐 Usuário não autenticado');
                    setUser(null);
                }
            } catch (error) {
                console.error('❌ Erro ao verificar autenticação:', error);
                setUser(null);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        const fetchAuthStatus = async () => {
            try {
                const response = await fetch('/api/auth-status');
                if (!response.ok) {
                    throw new Error('Failed to fetch auth status');
                }
                const data = await response.json();
                setIsPasswordRequiredByBackend(data.passwordRequired);
            } catch (error) {
                console.error('Error fetching auth status:', error);
                setIsPasswordRequiredByBackend(false);
            }
        };

        checkAuth();
        fetchAuthStatus();
        const storedHash = localStorage.getItem('clientPasswordHash');
        if (storedHash) {
            setClientPasswordHash(storedHash);
        }
    }, []);

    // Recarregar histórico quando o usuário mudar (login/logout)
    React.useEffect(() => {
        if (user && effectiveStorageModeClient === 'mysql') {
            loadMySQLHistory();
        } else if (!user && effectiveStorageModeClient === 'mysql') {
            setHistory([]);
        }
    }, [user, loadMySQLHistory]);

    React.useEffect(() => {
        if (!isInitialLoad) {
            try {
                localStorage.setItem('openaiImageHistory', JSON.stringify(history));
            } catch (e) {
                console.error('Failed to save history to localStorage:', e);
            }
        }
    }, [history, isInitialLoad]);

    React.useEffect(() => {
        return () => {
            editSourceImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [editSourceImagePreviewUrls]);

    React.useEffect(() => {
        const storedPref = localStorage.getItem('imageGenSkipDeleteConfirm');
        if (storedPref === 'true') {
            setSkipDeleteConfirmation(true);
        } else if (storedPref === 'false') {
            setSkipDeleteConfirmation(false);
        }
    }, []);

    React.useEffect(() => {
        localStorage.setItem('imageGenSkipDeleteConfirm', String(skipDeleteConfirmation));
    }, [skipDeleteConfirmation]);

    React.useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            if (mode !== 'edit' || !event.clipboardData) {
                return;
            }

            if (editImageFiles.length >= MAX_EDIT_IMAGES) {
                alert(`Não é possível colar: Máximo de ${MAX_EDIT_IMAGES} imagens atingido.`);
                return;
            }

            const items = event.clipboardData.items;
            let imageFound = false;
            let pastedCount = 0;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file && pastedCount < (MAX_EDIT_IMAGES - editImageFiles.length)) {
                        event.preventDefault();
                        imageFound = true;
                        pastedCount++;

                        const previewUrl = URL.createObjectURL(file);

                        setEditImageFiles((prevFiles) => [...prevFiles, file]);
                        setEditSourceImagePreviewUrls((prevUrls) => [...prevUrls, previewUrl]);

                        console.log('Pasted image added:', file.name);
                    }
                }
            }
            
            if (imageFound) {
                console.log(`Imagem(ns) colada(s) com sucesso via Ctrl+V: ${pastedCount}`);
            } else {
                console.log('O evento de colar não continha um arquivo de imagem reconhecido.');
            }
        };

        // Adiciona o listener tanto na window quanto no document para melhor compatibilidade
        window.addEventListener('paste', handlePaste);
        document.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('paste', handlePaste);
            document.removeEventListener('paste', handlePaste);
        };
    }, [mode, editImageFiles.length]);

    async function sha256Client(text: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    const handleSavePassword = async (password: string) => {
        if (!password.trim()) {
            setError('A senha não pode estar vazia.');
            return;
        }
        try {
            const hash = await sha256Client(password);
            localStorage.setItem('clientPasswordHash', hash);
            setClientPasswordHash(hash);
            setError(null);
            setIsPasswordDialogOpen(false);
            if (passwordDialogContext === 'retry' && lastApiCallArgs) {
                console.log('Retrying API call after password save...');
                await handleApiCall(...lastApiCallArgs);
            }
        } catch (e) {
            console.error('Error hashing password:', e);
            setError('Falha ao salvar senha devido a um erro de hash.');
        }
    };

    const handleOpenPasswordDialog = () => {
        setPasswordDialogContext('initial');
        setIsPasswordDialogOpen(true);
    };

    const getMimeTypeFromFormat = (format: string): string => {
        if (format === 'jpeg') return 'image/jpeg';
        if (format === 'webp') return 'image/webp';

        return 'image/png';
    };

    const handleApiCall = async (formData: GenerationFormData | EditingFormData) => {
        const startTime = Date.now();
        let durationMs = 0;

        setIsLoading(true);
        setError(null);
        setLatestImageBatch(null);
        setImageOutputView('grid');

        const apiFormData = new FormData();
        if (isPasswordRequiredByBackend && clientPasswordHash) {
            apiFormData.append('passwordHash', clientPasswordHash);
        } else if (isPasswordRequiredByBackend && !clientPasswordHash) {
            setError('Senha é obrigatória. Por favor, configure a senha clicando no ícone de cadeado.');
            setPasswordDialogContext('initial');
            setIsPasswordDialogOpen(true);
            setIsLoading(false);
            return;
        }
        apiFormData.append('mode', mode);

        if (mode === 'generate') {
            const genData = formData as GenerationFormData;
            apiFormData.append('prompt', genPrompt);
            apiFormData.append('n', genN[0].toString());
            apiFormData.append('size', genSize);
            apiFormData.append('quality', genQuality);
            apiFormData.append('output_format', genOutputFormat);
            if (
                (genOutputFormat === 'jpeg' || genOutputFormat === 'webp') &&
                genData.output_compression !== undefined
            ) {
                apiFormData.append('output_compression', genData.output_compression.toString());
            }
            apiFormData.append('background', genBackground);
            apiFormData.append('moderation', genModeration);
        } else {
            apiFormData.append('prompt', editPrompt);
            apiFormData.append('n', editN[0].toString());
            apiFormData.append('size', editSize);
            apiFormData.append('quality', editQuality);

            editImageFiles.forEach((file, index) => {
                apiFormData.append(`image_${index}`, file, file.name);
            });
            if (editGeneratedMaskFile) {
                apiFormData.append('mask', editGeneratedMaskFile, editGeneratedMaskFile.name);
            }
        }

        console.log('Sending request to /api/images with mode:', mode);

        try {
            const response = await fetch('/api/images', {
                method: 'POST',
                body: apiFormData
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401 && isPasswordRequiredByBackend) {
                    setError('Não autorizado: Senha inválida ou ausente. Por favor, tente novamente.');
                    setPasswordDialogContext('retry');
                    setLastApiCallArgs([formData]);
                    setIsPasswordDialogOpen(true);

                    return;
                }
                throw new Error(result.error || `API request failed with status ${response.status}`);
            }

            console.log('API Response:', result);

            if (result.images && result.images.length > 0) {
                durationMs = Date.now() - startTime;
                console.log(`API call successful. Duration: ${durationMs}ms`);

                let historyQuality: GenerationFormData['quality'] = 'auto';
                let historyBackground: GenerationFormData['background'] = 'auto';
                let historyModeration: GenerationFormData['moderation'] = 'auto';
                let historyOutputFormat: GenerationFormData['output_format'] = 'png';
                let historyPrompt: string = '';

                if (mode === 'generate') {
                    historyQuality = genQuality;
                    historyBackground = genBackground;
                    historyModeration = genModeration;
                    historyOutputFormat = genOutputFormat;
                    historyPrompt = genPrompt;
                } else {
                    historyQuality = editQuality;
                    historyBackground = 'auto';
                    historyModeration = 'auto';
                    historyOutputFormat = 'png';
                    historyPrompt = editPrompt;
                }

                const costDetails = calculateApiCost(result.usage);

                const batchTimestamp = Date.now();
                const newHistoryEntry: HistoryMetadata = {
                    timestamp: batchTimestamp,
                    images: result.images.map((img: { filename: string }) => ({ filename: img.filename })),
                    storageModeUsed: effectiveStorageModeClient,
                    durationMs: durationMs,
                    quality: historyQuality,
                    background: historyBackground,
                    moderation: historyModeration,
                    output_format: historyOutputFormat,
                    prompt: historyPrompt,
                    mode: mode,
                    costDetails: costDetails
                };

                // SEMPRE salvar histórico no MySQL quando usuário estiver logado
                if (user) {
                    console.log('💾 Salvando histórico no MySQL para usuário:', user.username);
                    await saveMySQLHistory(newHistoryEntry);
                }

                let newImageBatchPromises: Promise<{ path: string; filename: string } | null>[] = [];
                if (effectiveStorageModeClient === 'mysql') {
                    console.log('Processando imagens para armazenamento MySQL...');
                    newImageBatchPromises = result.images.map(async (img: ApiImageResponseItem) => {
                        if (img.b64_json) {
                            try {
                                const byteCharacters = atob(img.b64_json);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);

                                const actualMimeType = getMimeTypeFromFormat(img.output_format);
                                const blob = new Blob([byteArray], { type: actualMimeType });

                                // Salvar no MySQL via API
                                const formData = new FormData();
                                formData.append('image', blob, img.filename);
                                formData.append('filename', img.filename);

                                const response = await fetch('/api/mysql-images', {
                                    method: 'POST',
                                    body: formData
                                });

                                if (!response.ok) {
                                    throw new Error('Falha ao salvar imagem no MySQL');
                                }

                                console.log(`Salvou ${img.filename} no MySQL.`);

                                return { filename: img.filename, path: `/api/mysql-images?filename=${encodeURIComponent(img.filename)}` };
                            } catch (dbError) {
                                console.error(`Erro ao salvar ${img.filename} no MySQL:`, dbError);
                                setError(`Falha ao salvar imagem ${img.filename} no MySQL.`);
                                return null;
                            }
                        } else {
                            console.warn(`Imagem ${img.filename} sem b64_json no modo MySQL.`);
                            return null;
                        }
                    });
                } else if (effectiveStorageModeClient === 'indexeddb') {
                    console.log('Processing images for IndexedDB storage...');
                    newImageBatchPromises = result.images.map(async (img: ApiImageResponseItem) => {
                        if (img.b64_json) {
                            try {
                                const byteCharacters = atob(img.b64_json);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);

                                const actualMimeType = getMimeTypeFromFormat(img.output_format);
                                const blob = new Blob([byteArray], { type: actualMimeType });

                                await db.images.put({ filename: img.filename, blob });
                                console.log(`Saved ${img.filename} to IndexedDB with type ${actualMimeType}.`);

                                const blobUrl = URL.createObjectURL(blob);
                                setBlobUrlCache((prev) => ({ ...prev, [img.filename]: blobUrl }));

                                return { filename: img.filename, path: blobUrl };
                            } catch (dbError) {
                                console.error(`Error saving blob ${img.filename} to IndexedDB:`, dbError);
                                setError(`Failed to save image ${img.filename} to local database.`);
                                return null;
                            }
                        } else {
                            console.warn(`Image ${img.filename} missing b64_json in indexeddb mode.`);
                            return null;
                        }
                    });
                } else {
                    newImageBatchPromises = result.images
                        .filter((img: ApiImageResponseItem) => !!img.path)
                        .map((img: ApiImageResponseItem) =>
                            Promise.resolve({
                                path: img.path!,
                                filename: img.filename
                            })
                        );
                }

                const processedImages = (await Promise.all(newImageBatchPromises)).filter(Boolean) as {
                    path: string;
                    filename: string;
                }[];

                setLatestImageBatch(processedImages);
                setImageOutputView(processedImages.length > 1 ? 'grid' : 0);

                setHistory((prevHistory) => [newHistoryEntry, ...prevHistory]);
            } else {
                setLatestImageBatch(null);
                throw new Error('API response did not contain valid image data or filenames.');
            }
        } catch (err: unknown) {
            durationMs = Date.now() - startTime;
            console.error(`API Call Error after ${durationMs}ms:`, err);
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(errorMessage);
            setLatestImageBatch(null);
        } finally {
            if (durationMs === 0) durationMs = Date.now() - startTime;
            setIsLoading(false);
        }
    };

    const handleHistorySelect = (item: HistoryMetadata) => {
        console.log(
            `Selecting history item from ${new Date(item.timestamp).toISOString()}, stored via: ${item.storageModeUsed}`
        );
        console.log('🔍 Item details:', item);
        console.log('🔍 Current effectiveStorageModeClient:', effectiveStorageModeClient);
        
        const originalStorageMode = item.storageModeUsed || 'fs';
        console.log('🔍 Using storage mode:', originalStorageMode);

        const selectedBatchPromises = item.images.map(async (imgInfo) => {
            let path: string | undefined;
            
            // Se o item é do MySQL mas estamos usando FS local, tentar FS primeiro
            if (originalStorageMode === 'mysql' && effectiveStorageModeClient === 'fs') {
                path = `/api/image/${imgInfo.filename}`;
                console.log('🔄 Tentando FS para item MySQL:', path);
            } else if (originalStorageMode === 'mysql') {
                path = `/api/mysql-images?filename=${encodeURIComponent(imgInfo.filename)}`;
            } else if (originalStorageMode === 'indexeddb') {
                path = getImageSrc(imgInfo.filename);
            } else {
                path = `/api/image/${imgInfo.filename}`;
            }

            if (path) {
                return { path, filename: imgInfo.filename };
            } else {
                console.warn(
                    `Could not get image source for history item: ${imgInfo.filename} (mode: ${originalStorageMode})`
                );
                setError(`Image ${imgInfo.filename} could not be loaded.`);
                return null;
            }
        });

        Promise.all(selectedBatchPromises).then((resolvedBatch) => {
            const validImages = resolvedBatch.filter(Boolean) as { path: string; filename: string }[];
            
            console.log('🔍 Resolved batch:', resolvedBatch);
            console.log('🔍 Valid images:', validImages);
            console.log('🔍 Setting latestImageBatch to:', validImages.length > 0 ? validImages : null);

            if (validImages.length !== item.images.length && !error) {
                setError(
                    'Some images from this history entry could not be loaded (they might have been cleared or are missing).'
                );
            } else if (validImages.length === item.images.length) {
                setError(null);
            }

            setLatestImageBatch(validImages.length > 0 ? validImages : null);
            setImageOutputView(validImages.length > 1 ? 'grid' : 0);
        });
    };

    const handleClearHistory = async () => {
        if (!user) {
            console.log('❌ Nenhum usuário logado - não é possível limpar histórico');
            return;
        }

        const confirmationMessage = 'Tem certeza de que deseja limpar todo o histórico de imagens? No modo MySQL, isso também excluirá permanentemente todas as imagens armazenadas. Isso não pode ser desfeito.';

        if (window.confirm(confirmationMessage)) {
            setHistory([]);
            setLatestImageBatch(null);
            setImageOutputView('grid');
            setError(null);

            try {
                console.log('🗑️ Limpando histórico do MySQL para usuário:', user.username);
                // Para MySQL, recarregar o histórico vazio do servidor
                await loadMySQLHistory();
                console.log('✅ Histórico limpo do MySQL.');
            } catch (e) {
                console.error('❌ Erro ao limpar histórico:', e);
                setError(`Failed to clear history: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
    };

    const handleSendToEdit = async (filename: string) => {
        if (isSendingToEdit) return;
        setIsSendingToEdit(true);
        setError(null);

        const alreadyExists = editImageFiles.some((file) => file.name === filename);
        if (mode === 'edit' && alreadyExists) {
            console.log(`Image ${filename} already in edit list.`);
            setIsSendingToEdit(false);
            return;
        }

        if (mode === 'edit' && editImageFiles.length >= MAX_EDIT_IMAGES) {
            setError(`Não é possível adicionar mais de ${MAX_EDIT_IMAGES} imagens ao formulário de edição.`);
            setIsSendingToEdit(false);
            return;
        }

        console.log(`Sending image ${filename} to edit...`);

        try {
            let blob: Blob | undefined;
            let mimeType: string = 'image/png';

            if (effectiveStorageModeClient === 'mysql') {
                console.log(`Buscando imagem ${filename} do MySQL...`);
                const response = await fetch(`/api/mysql-images?filename=${encodeURIComponent(filename)}`);
                if (!response.ok) {
                    throw new Error(`Falha ao buscar imagem: ${response.statusText}`);
                }
                blob = await response.blob();
                mimeType = response.headers.get('Content-Type') || mimeType;
                console.log(`Buscou imagem ${filename} do MySQL.`);
            } else if (effectiveStorageModeClient === 'indexeddb') {
                console.log(`Fetching blob ${filename} from IndexedDB...`);

                const record = allDbImages?.find((img) => img.filename === filename);
                if (record?.blob) {
                    blob = record.blob;
                    mimeType = blob.type || mimeType;
                    console.log(`Found blob ${filename} in IndexedDB.`);
                } else {
                    throw new Error(`Image ${filename} not found in local database.`);
                }
            } else {
                console.log(`Fetching image ${filename} from API...`);
                const response = await fetch(`/api/image/${filename}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }
                blob = await response.blob();
                mimeType = response.headers.get('Content-Type') || mimeType;
                console.log(`Fetched image ${filename} from API.`);
            }

            if (!blob) {
                throw new Error(`Could not retrieve image data for ${filename}.`);
            }

            const newFile = new File([blob], filename, { type: mimeType });
            const newPreviewUrl = URL.createObjectURL(blob);

            editSourceImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));

            setEditImageFiles([newFile]);
            setEditSourceImagePreviewUrls([newPreviewUrl]);

            if (mode === 'generate') {
                setMode('edit');
            }

            console.log(`Successfully set ${filename} in edit form.`);
        } catch (err: unknown) {
            console.error('Error sending image to edit:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to send image to edit form.';
            setError(errorMessage);
        } finally {
            setIsSendingToEdit(false);
        }
    };

    const executeDeleteItem = async (item: HistoryMetadata) => {
        if (!item) return;
        console.log(`Executing delete for history item timestamp: ${item.timestamp}`);
        setError(null); // Clear previous errors

        const { images: imagesInEntry, storageModeUsed, timestamp } = item;
        const filenamesToDelete = imagesInEntry.map((img) => img.filename);

        try {
            if (storageModeUsed === 'mysql') {
                console.log('Deletando do MySQL:', filenamesToDelete);
                for (const filename of filenamesToDelete) {
                    const response = await fetch(`/api/mysql-images?filename=${encodeURIComponent(filename)}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) {
                        console.warn(`Falha ao deletar ${filename} do MySQL`);
                    }
                }
                console.log('Deletou com sucesso do MySQL.');
            } else if (storageModeUsed === 'indexeddb') {
                console.log('Deleting from IndexedDB:', filenamesToDelete);
                await db.images.where('filename').anyOf(filenamesToDelete).delete();
                setBlobUrlCache((prevCache) => {
                    const newCache = { ...prevCache };
                    filenamesToDelete.forEach((fn) => delete newCache[fn]);
                    return newCache;
                });
                console.log('Successfully deleted from IndexedDB and cleared blob cache.');
            } else if (storageModeUsed === 'fs') {
                console.log('Requesting deletion from filesystem via API:', filenamesToDelete);
                const apiPayload: { filenames: string[]; passwordHash?: string } = { filenames: filenamesToDelete };
                if (isPasswordRequiredByBackend && clientPasswordHash) {
                    apiPayload.passwordHash = clientPasswordHash;
                }

                const response = await fetch('/api/image-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apiPayload)
                });

                const result = await response.json();
                if (!response.ok) {
                    console.error('API deletion error:', result);
                    throw new Error(result.error || `API deletion failed with status ${response.status}`);
                }
                console.log('API deletion successful:', result);
            }

            setHistory((prevHistory) => prevHistory.filter((h) => h.timestamp !== timestamp));
            if (latestImageBatch && latestImageBatch.some((img) => filenamesToDelete.includes(img.filename))) {
                setLatestImageBatch(null); // Clear current view if it contained deleted images
            }
        } catch (e: unknown) {
            console.error('Error during item deletion:', e);
            setError(e instanceof Error ? e.message : 'An unexpected error occurred during deletion.');
        } finally {
            setItemToDeleteConfirm(null); // Always close dialog
        }
    };

    const handleRequestDeleteItem = (item: HistoryMetadata) => {
        if (!skipDeleteConfirmation) {
            setDialogCheckboxStateSkipConfirm(skipDeleteConfirmation);
            setItemToDeleteConfirm(item);
        } else {
            executeDeleteItem(item);
        }
    };

    const handleConfirmDeletion = () => {
        if (itemToDeleteConfirm) {
            executeDeleteItem(itemToDeleteConfirm);
            setSkipDeleteConfirmation(dialogCheckboxStateSkipConfirm);
        }
    };

    const handleCancelDeletion = () => {
        setItemToDeleteConfirm(null);
    };

    const handleLoginSuccess = (userData: { id: number; username: string; userLevel: string }) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
        setHistory([]);
        setLatestImageBatch(null);
        setError(null);
    };

    // Mostrar tela de carregamento enquanto verifica autenticação
    if (isCheckingAuth) {
        return (
            <main className='flex min-h-screen flex-col items-center justify-center bg-black text-white'>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Verificando autenticação...</p>
                </div>
            </main>
        );
    }

    // Mostrar tela de login se não estiver autenticado
    if (!user) {
        return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <main className='flex min-h-screen flex-col items-center bg-black p-4 text-white md:p-8 lg:p-12'>
            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
                onSave={handleSavePassword}
                title={passwordDialogContext === 'retry' ? 'Senha Obrigatória' : 'Configurar Senha'}
                description={
                    passwordDialogContext === 'retry'
                        ? 'O servidor requer uma senha, ou a anterior estava incorreta. Por favor, digite-a para continuar.'
                        : 'Defina uma senha para usar nas requisições da API.'
                }
            />
            <div className='w-full max-w-7xl space-y-6'>
                <UserHeader user={user} onLogout={handleLogout} />
                
                {/* Gerenciamento de Usuários - Apenas para ADMIN SUPREMO */}
                {user.userLevel === 'ADMIN_SUPREMO' && (
                    <UserManagement currentUser={user} />
                )}
                
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                    <div className='relative flex h-[70vh] min-h-[600px] flex-col lg:col-span-1'>
                        <div className={mode === 'generate' ? 'block h-full w-full' : 'hidden'}>
                            <GenerationForm
                                onSubmit={handleApiCall}
                                isLoading={isLoading}
                                currentMode={mode}
                                onModeChange={setMode}
                                isPasswordRequiredByBackend={isPasswordRequiredByBackend}
                                clientPasswordHash={clientPasswordHash}
                                onOpenPasswordDialog={handleOpenPasswordDialog}
                                prompt={genPrompt}
                                setPrompt={setGenPrompt}
                                n={genN}
                                setN={setGenN}
                                size={genSize}
                                setSize={setGenSize}
                                quality={genQuality}
                                setQuality={setGenQuality}
                                outputFormat={genOutputFormat}
                                setOutputFormat={setGenOutputFormat}
                                compression={genCompression}
                                setCompression={setGenCompression}
                                background={genBackground}
                                setBackground={setGenBackground}
                                moderation={genModeration}
                                setModeration={setGenModeration}
                            />
                        </div>
                        <div className={mode === 'edit' ? 'block h-full w-full' : 'hidden'}>
                            <EditingForm
                                onSubmit={handleApiCall}
                                isLoading={isLoading || isSendingToEdit}
                                currentMode={mode}
                                onModeChange={setMode}
                                isPasswordRequiredByBackend={isPasswordRequiredByBackend}
                                clientPasswordHash={clientPasswordHash}
                                onOpenPasswordDialog={handleOpenPasswordDialog}
                                imageFiles={editImageFiles}
                                sourceImagePreviewUrls={editSourceImagePreviewUrls}
                                setImageFiles={setEditImageFiles}
                                setSourceImagePreviewUrls={setEditSourceImagePreviewUrls}
                                maxImages={MAX_EDIT_IMAGES}
                                editPrompt={editPrompt}
                                setEditPrompt={setEditPrompt}
                                editN={editN}
                                setEditN={setEditN}
                                editSize={editSize}
                                setEditSize={setEditSize}
                                editQuality={editQuality}
                                setEditQuality={setEditQuality}
                                editBrushSize={editBrushSize}
                                setEditBrushSize={setEditBrushSize}
                                editShowMaskEditor={editShowMaskEditor}
                                setEditShowMaskEditor={setEditShowMaskEditor}
                                editGeneratedMaskFile={editGeneratedMaskFile}
                                setEditGeneratedMaskFile={setEditGeneratedMaskFile}
                                editIsMaskSaved={editIsMaskSaved}
                                setEditIsMaskSaved={setEditIsMaskSaved}
                                editOriginalImageSize={editOriginalImageSize}
                                setEditOriginalImageSize={setEditOriginalImageSize}
                                editDrawnPoints={editDrawnPoints}
                                setEditDrawnPoints={setEditDrawnPoints}
                                editMaskPreviewUrl={editMaskPreviewUrl}
                                setEditMaskPreviewUrl={setEditMaskPreviewUrl}
                                userLevel={user?.userLevel || 'USUARIO'}
                            />
                        </div>
                    </div>
                    <div className='flex h-[70vh] min-h-[600px] flex-col lg:col-span-1'>
                        {error && (
                            <Alert variant='destructive' className='mb-4 border-red-500/50 bg-red-900/20 text-red-300'>
                                <AlertTitle className='text-red-200'>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <ImageOutput
                            imageBatch={latestImageBatch}
                            viewMode={imageOutputView}
                            onViewChange={setImageOutputView}
                            altText='Generated image output'
                            isLoading={isLoading || isSendingToEdit}
                            onSendToEdit={handleSendToEdit}
                            currentMode={mode}
                            baseImagePreviewUrl={editSourceImagePreviewUrls[0] || null}
                        />
                    </div>
                </div>

            <div className='min-h-[450px]'>
                <HistoryPanel
                    history={history}
                    onSelectImage={handleHistorySelect}
                    onClearHistory={handleClearHistory}
                    getImageSrc={getImageSrc}
                    onDeleteItemRequest={handleRequestDeleteItem}
                    itemPendingDeleteConfirmation={itemToDeleteConfirm}
                    onConfirmDeletion={handleConfirmDeletion}
                    onCancelDeletion={handleCancelDeletion}
                    deletePreferenceDialogValue={dialogCheckboxStateSkipConfirm}
                    onDeletePreferenceDialogChange={setDialogCheckboxStateSkipConfirm}
                    userLevel={user.userLevel}
                />
            </div>
            </div>
        </main>
    );
}
