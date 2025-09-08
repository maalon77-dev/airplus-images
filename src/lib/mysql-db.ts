import mysql from 'mysql2/promise';
import { mysqlConfig } from './mysql-config';

// Pool de conexões para melhor performance
export const pool = mysql.createPool({
    ...mysqlConfig,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: mysqlConfig.ssl === true ? { rejectUnauthorized: false } : undefined
});

export interface User {
    id: number;
    username: string;
    password_hash: string;
    user_level: 'ADMIN_SUPREMO' | 'USUARIO';
    created_at: Date;
    updated_at: Date;
}

export interface ImageRecord {
    id: number;
    filename: string;
    image_data: Buffer;
    mime_type: string;
    file_size: number;
    user_id: number | null;
    created_at: Date;
    updated_at: Date;
}

export interface GenerationHistory {
    id: number;
    timestamp: number;
    prompt: string;
    mode: 'generate' | 'edit';
    quality: 'low' | 'medium' | 'high' | 'auto';
    background: 'transparent' | 'opaque' | 'auto';
    moderation: 'low' | 'auto';
    output_format: 'png' | 'jpeg' | 'webp';
    size: string;
    n_images: number;
    duration_ms: number;
    cost_usd: number;
    cost_brl: number;
    text_input_tokens: number;
    image_input_tokens: number;
    image_output_tokens: number;
    user_id: number | null;
    created_at: Date;
}

export interface HistoryImage {
    id: number;
    history_id: number;
    image_id: number;
    created_at: Date;
}

export class MySQLDatabase {
    // Autenticar usuário
    static async authenticateUser(username: string, passwordHash: string): Promise<User | null> {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM users WHERE username = ? AND password_hash = ?',
                [username, passwordHash]
            );
            const users = rows as User[];
            return users.length > 0 ? users[0] : null;
        } finally {
            connection.release();
        }
    }

    // Buscar usuário por ID
    static async getUserById(userId: number): Promise<User | null> {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            const users = rows as User[];
            return users.length > 0 ? users[0] : null;
        } finally {
            connection.release();
        }
    }

    // Criar novo usuário
    static async createUser(username: string, passwordHash: string, userLevel: 'ADMIN_SUPREMO' | 'USUARIO' = 'USUARIO'): Promise<number> {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'INSERT INTO users (username, password_hash, user_level) VALUES (?, ?, ?)',
                [username, passwordHash, userLevel]
            );
            return (result as mysql.ResultSetHeader).insertId;
        } finally {
            connection.release();
        }
    }

    // Salvar imagem no banco
    static async saveImage(filename: string, imageData: Buffer, mimeType: string, userId?: number): Promise<number> {
        const connection = await pool.getConnection();
        try {
        const [result] = await connection.execute(
            'INSERT INTO images (filename, image_data, mime_type, file_size, user_id) VALUES (?, ?, ?, ?, ?)',
            [filename, imageData, mimeType, imageData.length, userId || null]
        );
        return (result as mysql.ResultSetHeader).insertId;
        } finally {
            connection.release();
        }
    }

    // Recuperar imagem do banco
    static async getImage(filename: string): Promise<ImageRecord | null> {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM images WHERE filename = ?',
                [filename]
            );
            const images = rows as ImageRecord[];
            return images.length > 0 ? images[0] : null;
        } finally {
            connection.release();
        }
    }

    // Salvar histórico de geração
    static async saveGenerationHistory(history: Omit<GenerationHistory, 'id' | 'created_at'>, userId?: number): Promise<number> {
        const connection = await pool.getConnection();
        try {
        const [result] = await connection.execute(
            `INSERT INTO generation_history 
            (timestamp, prompt, mode, quality, background, moderation, output_format, size, n_images, 
             duration_ms, cost_usd, cost_brl, text_input_tokens, image_input_tokens, image_output_tokens, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                history.timestamp, history.prompt, history.mode, history.quality, history.background,
                history.moderation, history.output_format, history.size, history.n_images,
                history.duration_ms, history.cost_usd, history.cost_brl,
                history.text_input_tokens, history.image_input_tokens, history.image_output_tokens, userId || null
            ]
        );
        return (result as mysql.ResultSetHeader).insertId;
        } finally {
            connection.release();
        }
    }

    // Relacionar imagem com histórico
    static async linkImageToHistory(historyId: number, imageId: number): Promise<void> {
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO history_images (history_id, image_id) VALUES (?, ?)',
                [historyId, imageId]
            );
        } finally {
            connection.release();
        }
    }

    // Recuperar histórico completo (apenas para ADMIN_SUPREMO)
    static async getGenerationHistory(limit: number = 50): Promise<GenerationHistory[]> {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM generation_history ORDER BY timestamp DESC LIMIT ?',
                [limit]
            );
            return rows as GenerationHistory[];
        } finally {
            connection.release();
        }
    }

    // Recuperar histórico por usuário
    static async getGenerationHistoryByUser(userId: number, limit: number = 50): Promise<GenerationHistory[]> {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM generation_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
                [userId, limit]
            );
            return rows as GenerationHistory[];
        } finally {
            connection.release();
        }
    }

    // Recuperar imagens de um histórico específico
    static async getHistoryImages(historyId: number): Promise<ImageRecord[]> {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT i.* FROM images i 
                 INNER JOIN history_images hi ON i.id = hi.image_id 
                 WHERE hi.history_id = ?`,
                [historyId]
            );
            return rows as ImageRecord[];
        } finally {
            connection.release();
        }
    }

    // Deletar histórico e imagens relacionadas
    static async deleteHistory(historyId: number): Promise<void> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // Deletar relacionamentos
            await connection.execute('DELETE FROM history_images WHERE history_id = ?', [historyId]);
            
            // Deletar histórico
            await connection.execute('DELETE FROM generation_history WHERE id = ?', [historyId]);
            
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Deletar imagem específica
    static async deleteImage(filename: string): Promise<void> {
        const connection = await pool.getConnection();
        try {
            await connection.execute('DELETE FROM images WHERE filename = ?', [filename]);
        } finally {
            connection.release();
        }
    }

    // Limpar histórico antigo (manter apenas os últimos N registros)
    static async cleanupOldHistory(keepCount: number = 100): Promise<void> {
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `DELETE FROM generation_history 
                 WHERE id NOT IN (
                     SELECT id FROM (
                         SELECT id FROM generation_history 
                         ORDER BY timestamp DESC 
                         LIMIT ?
                     ) AS keep_ids
                 )`,
                [keepCount]
            );
        } finally {
            connection.release();
        }
    }

    // Testar conexão
    static async testConnection(): Promise<boolean> {
        try {
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            return true;
        } catch (error) {
            console.error('Erro na conexão MySQL:', error);
            return false;
        }
    }
}

export default MySQLDatabase;
