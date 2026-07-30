-- =============================================================
--  Migracion 005 — Rol acudiente
--
--  Vincula un acudiente con los estudiantes que puede consultar.
--  Solo hace falta si YA tienes datos; 001 actualizado ya lo incluye.
--  Es idempotente.
-- =============================================================

USE classroom_db;

CREATE TABLE IF NOT EXISTS guardian_students (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  guardian_id INT UNSIGNED NOT NULL,
  student_id  INT UNSIGNED NOT NULL,
  -- Parentesco, solo informativo.
  relation    VARCHAR(40)  NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guardian_student (guardian_id, student_id),
  KEY idx_guardian (guardian_id),
  KEY idx_student (student_id),
  CONSTRAINT fk_gs_guardian FOREIGN KEY (guardian_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_gs_student FOREIGN KEY (student_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- Indices que faltaban (mejora 4.7)
-- -------------------------------------------------------------
DROP PROCEDURE IF EXISTS add_index_if_missing;

DELIMITER //
CREATE PROCEDURE add_index_if_missing(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns VARCHAR(200)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index
  ) THEN
    SET @sql = CONCAT('CREATE INDEX `', p_index, '` ON `', p_table, '` (', p_columns, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- La libreta filtra por estado y la pantalla "por revisar" por fecha de entrega.
CALL add_index_if_missing('submissions', 'idx_sub_state_date', 'state, submitted_at');
-- El calendario busca por rango de fechas dentro de un curso.
CALL add_index_if_missing('coursework', 'idx_cw_course_due', 'course_id, due_at');
-- Los comentarios se piden siempre por objetivo y visibilidad.
CALL add_index_if_missing('comments', 'idx_com_visibility', 'target_type, target_id, visibility');

DROP PROCEDURE add_index_if_missing;

-- -------------------------------------------------------------
-- Verificacion
-- -------------------------------------------------------------
SELECT 'guardian_students' AS objeto, COUNT(*) AS existe
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'guardian_students'
UNION ALL SELECT 'idx_sub_state_date', COUNT(DISTINCT index_name) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'submissions' AND index_name = 'idx_sub_state_date'
UNION ALL SELECT 'idx_cw_course_due', COUNT(DISTINCT index_name) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'coursework' AND index_name = 'idx_cw_course_due'
UNION ALL SELECT 'idx_com_visibility', COUNT(DISTINCT index_name) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'comments' AND index_name = 'idx_com_visibility';
