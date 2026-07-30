-- =============================================================
--  Migracion 003 — Personalizacion, perfil y ajustes
--
--  Solo hace falta si YA tienes datos en classroom_db y no quieres
--  perderlos. Si puedes reiniciar, usa `npm run db:reset` (001 + 002
--  ya incluyen estos cambios).
--
--  Es idempotente: se puede ejecutar varias veces sin error.
-- =============================================================

USE classroom_db;

-- -------------------------------------------------------------
-- Helper: anade una columna solo si no existe todavia.
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS add_column_if_missing;

DELIMITER //
CREATE PROCEDURE add_column_if_missing(
  IN p_table  VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- 1. Perfil de usuario
-- -------------------------------------------------------------
CALL add_column_if_missing('users', 'bio',   'VARCHAR(280) NULL AFTER avatar_url');
CALL add_column_if_missing('users', 'phone', 'VARCHAR(30) NULL AFTER bio');

-- -------------------------------------------------------------
-- 2. Personalizacion del encabezado de la clase
-- -------------------------------------------------------------
CALL add_column_if_missing(
  'courses',
  'banner_kind',
  "ENUM('color','gallery','upload') NOT NULL DEFAULT 'color' AFTER theme_color"
);

DROP PROCEDURE add_column_if_missing;

-- -------------------------------------------------------------
-- 3. Ajustes por usuario
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id            INT UNSIGNED NOT NULL,
  density            ENUM('comfortable','compact') NOT NULL DEFAULT 'comfortable',
  language           ENUM('es','en') NOT NULL DEFAULT 'es',
  notify_coursework  TINYINT(1) NOT NULL DEFAULT 1,
  notify_announcements TINYINT(1) NOT NULL DEFAULT 1,
  notify_grades      TINYINT(1) NOT NULL DEFAULT 1,
  show_archived      TINYINT(1) NOT NULL DEFAULT 0,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- Crea la fila de ajustes de los usuarios que aun no la tengan.
INSERT INTO user_settings (user_id)
SELECT u.id FROM users u
LEFT JOIN user_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;

-- -------------------------------------------------------------
-- Verificacion
-- -------------------------------------------------------------
SELECT 'users.bio'          AS columna, COUNT(*) AS existe FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'bio'
UNION ALL SELECT 'users.phone', COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'phone'
UNION ALL SELECT 'courses.banner_kind', COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'courses' AND column_name = 'banner_kind'
UNION ALL SELECT 'user_settings', COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'user_settings';
