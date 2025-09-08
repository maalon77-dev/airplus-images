import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';

export interface FTPConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
    remotePath: string;
    baseUrl: string;
}

export class FTPUploadService {
    private config: FTPConfig;

    constructor(config: FTPConfig) {
        this.config = config;
    }

    async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
        const client = new Client();
        
        try {
            // Conectar ao servidor FTP
            await client.access({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                secure: this.config.secure,
            });

            // Criar diretório se não existir
            await client.ensureDir(this.config.remotePath);

            // Upload do arquivo
            await client.uploadFrom(imageBuffer, path.join(this.config.remotePath, filename));

            // Retornar URL pública da imagem
            const publicUrl = `${this.config.baseUrl}/${filename}`;
            console.log(`✅ Imagem enviada para FTP: ${publicUrl}`);
            
            return publicUrl;

        } catch (error) {
            console.error('❌ Erro ao fazer upload para FTP:', error);
            throw new Error(`Falha no upload FTP: ${error}`);
        } finally {
            client.close();
        }
    }

    async deleteImage(filename: string): Promise<boolean> {
        const client = new Client();
        
        try {
            // Conectar ao servidor FTP
            await client.access({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                secure: this.config.secure,
            });

            // Deletar arquivo
            await client.remove(path.join(this.config.remotePath, filename));
            console.log(`✅ Imagem deletada do FTP: ${filename}`);
            
            return true;

        } catch (error) {
            console.error('❌ Erro ao deletar do FTP:', error);
            return false;
        } finally {
            client.close();
        }
    }

    async testConnection(): Promise<boolean> {
        const client = new Client();
        
        try {
            await client.access({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                secure: this.config.secure,
            });

            console.log('✅ Conexão FTP testada com sucesso');
            return true;

        } catch (error) {
            console.error('❌ Erro ao testar conexão FTP:', error);
            return false;
        } finally {
            client.close();
        }
    }
}

// Função para criar instância do serviço FTP
export function createFTPUploadService(): FTPUploadService | null {
    const config: FTPConfig = {
        host: process.env.FTP_HOST || '',
        port: parseInt(process.env.FTP_PORT || '21'),
        user: process.env.FTP_USER || '',
        password: process.env.FTP_PASSWORD || '',
        secure: process.env.FTP_SECURE === 'true',
        remotePath: process.env.FTP_REMOTE_PATH || '/images',
        baseUrl: process.env.FTP_BASE_URL || '',
    };

    // Verificar se todas as configurações estão presentes
    if (!config.host || !config.user || !config.password || !config.baseUrl) {
        console.log('⚠️ Configurações FTP não encontradas, usando armazenamento local');
        return null;
    }

    return new FTPUploadService(config);
}
