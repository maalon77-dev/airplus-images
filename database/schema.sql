-- Schema do banco de dados MySQL para o sistema de geração de imagens
-- Execute este script no seu banco MySQL

CREATE DATABASE IF NOT EXISTS criargptimgs;
USE criargptimgs;

-- Tabela para usuários do sistema
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_level ENUM('ADMIN_SUPREMO', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_user_level (user_level)
);

-- Tabela para armazenar as imagens geradas
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    image_data LONGBLOB NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/png',
    file_size INT NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_filename (filename),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela para armazenar o histórico de gerações
CREATE TABLE IF NOT EXISTS generation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    prompt TEXT NOT NULL,
    mode ENUM('generate', 'edit') NOT NULL,
    quality ENUM('low', 'medium', 'high', 'auto') NOT NULL,
    background ENUM('transparent', 'opaque', 'auto') NOT NULL,
    moderation ENUM('low', 'auto') NOT NULL,
    output_format ENUM('png', 'jpeg', 'webp') NOT NULL DEFAULT 'png',
    size VARCHAR(20) NOT NULL,
    n_images INT NOT NULL DEFAULT 1,
    duration_ms INT NOT NULL,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    cost_brl DECIMAL(10, 2) NOT NULL DEFAULT 0,
    text_input_tokens INT NOT NULL DEFAULT 0,
    image_input_tokens INT NOT NULL DEFAULT 0,
    image_output_tokens INT NOT NULL DEFAULT 0,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_mode (mode),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela para relacionar imagens com o histórico
CREATE TABLE IF NOT EXISTS history_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    history_id INT NOT NULL,
    image_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (history_id) REFERENCES generation_history(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    UNIQUE KEY unique_history_image (history_id, image_id)
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO users (username, password_hash, user_level) VALUES 
('admin', '$2b$10$LfxVsDfAl52t2c..oVxmR.wSSRuCVKFDspG0LY0LfXLBIknqJboOC', 'ADMIN_SUPREMO')
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- Inserir configurações padrão
INSERT INTO system_config (config_key, config_value) VALUES 
('usd_to_brl_rate', '5.20'),
('max_images_per_user', '100'),
('max_file_size_mb', '10')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
