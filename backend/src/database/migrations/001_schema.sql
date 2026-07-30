-- =============================================================
--  Classroom React — Esquema de base de datos
--  Motor: MySQL / MariaDB (XAMPP)
--  Uso:  mysql -u root < 001_schema.sql
--        (o pegar completo en MySQL Workbench y ejecutar)
-- =============================================================

DROP DATABASE IF EXISTS classroom_db;
CREATE DATABASE classroom_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE classroom_db;

-- -------------------------------------------------------------
-- 1. Roles globales del sistema
-- -------------------------------------------------------------
CREATE TABLE roles (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(20)      NOT NULL,
  name        VARCHAR(50)      NOT NULL,
  description VARCHAR(160)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_slug (slug)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 2. Usuarios
-- -------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  role_id       TINYINT UNSIGNED NOT NULL,
  first_name    VARCHAR(60)      NOT NULL,
  last_name     VARCHAR(60)      NOT NULL,
  email         VARCHAR(120)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  avatar_url    VARCHAR(255)     NULL,           -- /api/uploads/... o NULL para iniciales
  bio           VARCHAR(280)     NULL,
  phone         VARCHAR(30)      NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 3. Cursos (clases)
-- -------------------------------------------------------------
CREATE TABLE courses (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120) NOT NULL,
  section     VARCHAR(80)  NULL,
  subject     VARCHAR(80)  NULL,
  room        VARCHAR(60)  NULL,
  description TEXT         NULL,
  owner_id    INT UNSIGNED NOT NULL,           -- docente propietario
  class_code  CHAR(8)      NOT NULL,           -- codigo para unirse
  theme_color VARCHAR(9)   NOT NULL DEFAULT '#5B6472',
  -- Como se pinta el encabezado de la clase:
  --   color   -> solo theme_color
  --   gallery -> banner_url apunta a /banners/*.svg (servido por el frontend)
  --   upload  -> banner_url apunta a /api/uploads/*  (imagen subida por el docente)
  banner_kind ENUM('color','gallery','upload') NOT NULL DEFAULT 'color',
  banner_url  VARCHAR(255) NULL,
  status      ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_code (class_code),
  KEY idx_courses_owner (owner_id),
  KEY idx_courses_status (status),
  CONSTRAINT fk_courses_owner FOREIGN KEY (owner_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 4. Inscripciones (usuario <-> curso, con rol dentro del curso)
-- -------------------------------------------------------------
CREATE TABLE enrollments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id   INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  course_role ENUM('teacher','student') NOT NULL DEFAULT 'student',
  joined_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enroll_course_user (course_id, user_id),
  KEY idx_enroll_user (user_id),
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_enroll_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 5. Temas / unidades dentro del "Trabajo en clase"
-- -------------------------------------------------------------
CREATE TABLE topics (
  id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  course_id  INT UNSIGNED    NOT NULL,
  title      VARCHAR(120)    NOT NULL,
  position   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_topics_course_title (course_id, title),
  CONSTRAINT fk_topics_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 6. Trabajo en clase: tareas, material, preguntas, cuestionarios
-- -------------------------------------------------------------
CREATE TABLE coursework (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id    INT UNSIGNED NOT NULL,
  topic_id     INT UNSIGNED NULL,
  author_id    INT UNSIGNED NOT NULL,
  type         ENUM('assignment','material','question','quiz') NOT NULL DEFAULT 'assignment',
  title        VARCHAR(160) NOT NULL,
  instructions TEXT         NULL,
  max_points   DECIMAL(6,2) NULL,               -- NULL = sin calificacion
  due_at       DATETIME     NULL,               -- NULL = sin fecha de entrega
  status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
  published_at DATETIME     NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cw_course (course_id, status),
  KEY idx_cw_topic (topic_id),
  KEY idx_cw_due (due_at),
  CONSTRAINT fk_cw_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cw_topic FOREIGN KEY (topic_id) REFERENCES topics (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_cw_author FOREIGN KEY (author_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 7. Entregas del estudiante
-- -------------------------------------------------------------
CREATE TABLE submissions (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  coursework_id INT UNSIGNED NOT NULL,
  student_id    INT UNSIGNED NOT NULL,
  state         ENUM('assigned','turned_in','returned','reclaimed') NOT NULL DEFAULT 'assigned',
  answer_text   TEXT         NULL,              -- respuesta corta / pregunta
  submitted_at  DATETIME     NULL,
  returned_at   DATETIME     NULL,
  grade         DECIMAL(6,2) NULL,              -- nota devuelta al estudiante
  draft_grade   DECIMAL(6,2) NULL,              -- borrador visible solo al docente
  is_late       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sub_cw_student (coursework_id, student_id),
  KEY idx_sub_student (student_id, state),
  CONSTRAINT fk_sub_cw FOREIGN KEY (coursework_id) REFERENCES coursework (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 8. Anuncios del tablon (Novedades)
-- -------------------------------------------------------------
CREATE TABLE announcements (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id  INT UNSIGNED NOT NULL,
  author_id  INT UNSIGNED NOT NULL,
  body       TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ann_course (course_id, created_at),
  CONSTRAINT fk_ann_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ann_author FOREIGN KEY (author_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 9. Adjuntos (polimorficos: tarea, entrega o anuncio)
-- -------------------------------------------------------------
CREATE TABLE attachments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_type ENUM('coursework','submission','announcement') NOT NULL,
  owner_id   INT UNSIGNED NOT NULL,
  kind       ENUM('link','file','drive','youtube') NOT NULL DEFAULT 'link',
  title      VARCHAR(180) NOT NULL,
  url        VARCHAR(500) NOT NULL,
  mime_type  VARCHAR(100) NULL,
  size_bytes INT UNSIGNED NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_att_owner (owner_type, owner_id)
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 10. Comentarios (de clase o privados sobre una entrega)
-- -------------------------------------------------------------
CREATE TABLE comments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  target_type ENUM('announcement','coursework','submission') NOT NULL,
  target_id   INT UNSIGNED NOT NULL,
  author_id   INT UNSIGNED NOT NULL,
  body        TEXT         NOT NULL,
  visibility  ENUM('class','private') NOT NULL DEFAULT 'class',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_com_target (target_type, target_id, created_at),
  CONSTRAINT fk_com_author FOREIGN KEY (author_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 11. Notificaciones
-- -------------------------------------------------------------
CREATE TABLE notifications (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  course_id  INT UNSIGNED NULL,
  type       ENUM('coursework','announcement','grade','comment','enrollment') NOT NULL,
  title      VARCHAR(160) NOT NULL,
  body       VARCHAR(255) NULL,
  link       VARCHAR(255) NULL,
  read_at    DATETIME     NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id, read_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notif_course FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- -------------------------------------------------------------
-- 12. Ajustes por usuario (modulo Ajustes)
-- -------------------------------------------------------------
CREATE TABLE user_settings (
  user_id            INT UNSIGNED NOT NULL,
  -- 'system' sigue la preferencia del sistema operativo del navegador.
  theme              ENUM('light','dark','system') NOT NULL DEFAULT 'system',
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

-- -------------------------------------------------------------
-- 13. Acudiente <-> estudiante (rol guardian)
-- -------------------------------------------------------------
CREATE TABLE guardian_students (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  guardian_id INT UNSIGNED NOT NULL,
  student_id  INT UNSIGNED NOT NULL,
  relation    VARCHAR(40)  NULL,           -- parentesco, informativo
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
-- Indices de apoyo para las consultas mas frecuentes
-- -------------------------------------------------------------
CREATE INDEX idx_sub_state_date  ON submissions (state, submitted_at);
CREATE INDEX idx_cw_course_due   ON coursework (course_id, due_at);
CREATE INDEX idx_com_visibility  ON comments (target_type, target_id, visibility);

-- =============================================================
--  Vistas de apoyo
-- =============================================================

-- Libreta de calificaciones: una fila por estudiante/tarea
CREATE OR REPLACE VIEW v_gradebook AS
SELECT
  c.id            AS course_id,
  c.name          AS course_name,
  cw.id           AS coursework_id,
  cw.title        AS coursework_title,
  cw.max_points   AS max_points,
  cw.due_at       AS due_at,
  u.id            AS student_id,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  COALESCE(s.state, 'assigned') AS state,
  s.grade         AS grade,
  s.is_late       AS is_late
FROM courses c
JOIN coursework  cw ON cw.course_id = c.id AND cw.status = 'published'
                    AND cw.max_points IS NOT NULL
JOIN enrollments e  ON e.course_id  = c.id AND e.course_role = 'student'
JOIN users       u  ON u.id = e.user_id
LEFT JOIN submissions s ON s.coursework_id = cw.id AND s.student_id = u.id;

-- Trabajo pendiente por estudiante (alimenta "Pronto se entregara")
CREATE OR REPLACE VIEW v_pending_work AS
SELECT
  u.id          AS student_id,
  c.id          AS course_id,
  c.name        AS course_name,
  cw.id         AS coursework_id,
  cw.title      AS coursework_title,
  cw.due_at     AS due_at
FROM users u
JOIN enrollments e  ON e.user_id   = u.id AND e.course_role = 'student'
JOIN courses     c  ON c.id        = e.course_id AND c.status = 'active'
JOIN coursework  cw ON cw.course_id = c.id AND cw.status = 'published'
                    AND cw.type IN ('assignment','question','quiz')
LEFT JOIN submissions s ON s.coursework_id = cw.id AND s.student_id = u.id
WHERE s.id IS NULL OR s.state IN ('assigned','reclaimed');
