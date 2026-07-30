-- =============================================================
--  Migracion 004 — Modo oscuro
--
--  Solo hace falta si YA tienes datos en classroom_db.
--  Si puedes reiniciar, `npm run db:reset` ya lo incluye (001 actualizado).
--
--  Es idempotente: se puede ejecutar varias veces sin error.
-- =============================================================

USE classroom_db;

DROP PROCEDURE IF EXISTS add_theme_column;

DELIMITER //
CREATE PROCEDURE add_theme_column()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_settings'
      AND column_name = 'theme'
  ) THEN
    ALTER TABLE user_settings
      ADD COLUMN theme ENUM('light','dark','system') NOT NULL DEFAULT 'system' AFTER user_id;
  END IF;
END //
DELIMITER ;

CALL add_theme_column();
DROP PROCEDURE add_theme_column;

-- -------------------------------------------------------------
-- Verificacion
-- -------------------------------------------------------------
SELECT 'user_settings.theme' AS columna, COUNT(*) AS existe
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name = 'user_settings'
  AND column_name = 'theme';
