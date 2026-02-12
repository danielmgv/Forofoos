-- Script para inicializar la base de datos y tabla `users` con verificación por email
CREATE DATABASE IF NOT EXISTS `node_auth_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `node_auth_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verification_token` VARCHAR(128) DEFAULT NULL,
  `verification_expires` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;