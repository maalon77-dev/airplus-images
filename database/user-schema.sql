-- Schema para sistema de usuários e autenticação
-- Execute este script no seu banco MySQL

USE criargptimgs;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_level ENUM('admin_supremo', 'admin', 'usuario_normal') NOT NULL DEFAULT 'usuario_normal',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_user_level (user_level),
    INDEX idx_is_active (is_active)
);

-- Tabela de sessões de usuário
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('login', 'logout', 'image_generated', 'image_deleted', 'history_cleared', 'user_created', 'user_updated', 'user_deleted') NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
);

-- Inserir usuário ADMIN SUPREMO padrão
INSERT INTO users (username, email, password_hash, user_level, is_active) VALUES 
('admin_supremo', 'admin@criargptimgs.com', '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', 'admin_supremo', TRUE),
('admin', 'admin2@criargptimgs.com', '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', 'admin', TRUE),
('usuario_teste', 'usuario@criargptimgs.com', '$2b$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', 'usuario_normal', TRUE)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    user_level = VALUES(user_level),
    is_active = VALUES(is_active);

-- Atualizar configurações do sistema
INSERT INTO system_config (config_key, config_value) VALUES 
('default_user_level', 'usuario_normal'),
('session_timeout_hours', '24'),
('max_login_attempts', '5'),
('password_min_length', '8')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
