-- =============================================================
--  Classroom React — Datos de prueba
--  Ejecutar DESPUES de 001_schema.sql
--  Contrasena de TODOS los usuarios demo: 123456
-- =============================================================

USE classroom_db;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE guardian_students;
TRUNCATE TABLE user_settings;
TRUNCATE TABLE notifications;
TRUNCATE TABLE comments;
TRUNCATE TABLE attachments;
TRUNCATE TABLE announcements;
TRUNCATE TABLE submissions;
TRUNCATE TABLE coursework;
TRUNCATE TABLE topics;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- Roles
-- -------------------------------------------------------------
INSERT INTO roles (id, slug, name, description) VALUES
  (1, 'admin',    'Administrador', 'Gestiona usuarios, cursos y reportes globales'),
  (2, 'teacher',  'Docente',       'Crea cursos, publica trabajo y califica'),
  (3, 'student',  'Estudiante',    'Se inscribe a cursos y entrega trabajo'),
  (4, 'guardian', 'Acudiente',     'Consulta el progreso de un estudiante');

-- -------------------------------------------------------------
-- Usuarios  (hash = 123456)
-- -------------------------------------------------------------
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash) VALUES
  (1, 1, 'Ana',     'Admin',    'admin@classroom.test',   '$2b$10$WXUrnM/7N40vJC9KQg5cE.ZL5viSp/2vtg9MXGautf1MLf5uxHisy'),
  (2, 2, 'Gersson', 'Rubio',    'gersson@classroom.test', '$2b$10$WXUrnM/7N40vJC9KQg5cE.ZL5viSp/2vtg9MXGautf1MLf5uxHisy'),
  (3, 2, 'Carlos',  'Ardila',   'carlos@classroom.test',  '$2b$10$WXUrnM/7N40vJC9KQg5cE.ZL5viSp/2vtg9MXGautf1MLf5uxHisy'),
  (4, 3, 'Jostin',  'Gomez',    'jostin@classroom.test',  '$2b$10$WXUrnM/7N40vJC9KQg5cE.ZL5viSp/2vtg9MXGautf1MLf5uxHisy'),
  (5, 3, 'Laura',   'Pineda',   'laura@classroom.test',   '$2b$10$WXUrnM/7N40vJC9KQg5cE.ZL5viSp/2vtg9MXGautf1MLf5uxHisy'),
  (6, 3, 'Mateo',   'Suarez',   'mateo@classroom.test',   '$2b$10$WXUrnM/7N40vJC9KQg5cE.ZL5viSp/2vtg9MXGautf1MLf5uxHisy'),
  (7, 4, 'Rosa',    'Gomez',    'rosa@classroom.test',    '$2b$10$WXUrnM/7N40vJC9KQg5cE.ZL5viSp/2vtg9MXGautf1MLf5uxHisy');

-- -------------------------------------------------------------
-- Cursos
-- -------------------------------------------------------------
INSERT INTO courses (id, name, section, subject, room, owner_id, class_code, theme_color, banner_kind, banner_url) VALUES
  (1, '2026_Tecnica Programacion de Software', 'Martes y Jueves', 'Programacion', 'Sala 3', 2, '6gmc6sgt', '#4C5B8A', 'gallery', '/banners/code.svg'),
  (2, 'Tecnologia e Informatica 1103',         '1103',            'Tecnologia',   'Sala 1', 3, 'k2p9xq1a', '#3F6B63', 'gallery', '/banners/books.svg'),
  (3, 'Tecnologia 10-05',                      'Informatica 10-05','Tecnologia',  'Sala 2', 3, 'a7d3mn5v', '#7A5C4B', 'color',   NULL);

-- -------------------------------------------------------------
-- Inscripciones
-- -------------------------------------------------------------
INSERT INTO enrollments (course_id, user_id, course_role) VALUES
  (1, 2, 'teacher'), (1, 4, 'student'), (1, 5, 'student'), (1, 6, 'student'),
  (2, 3, 'teacher'), (2, 4, 'student'), (2, 5, 'student'),
  (3, 3, 'teacher'), (3, 6, 'student');

-- -------------------------------------------------------------
-- Temas
-- -------------------------------------------------------------
INSERT INTO topics (id, course_id, title, position) VALUES
  (1, 1, 'Bases de datos',       1),
  (2, 1, 'Backend con Node.js',  2),
  (3, 2, 'Hardware y software',  1);

-- -------------------------------------------------------------
-- Trabajo en clase
-- -------------------------------------------------------------
INSERT INTO coursework (id, course_id, topic_id, author_id, type, title, instructions, max_points, due_at, status, published_at) VALUES
  (1, 1, 1, 2, 'assignment', 'Actividad 3 CRUD',
   'Construir un CRUD completo sobre MySQL y documentar cada endpoint.', 100.00,
   DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 23 HOUR, 'published', NOW()),
  (2, 1, 1, 2, 'material', 'Guia de normalizacion',
   'Material de apoyo para las tres primeras formas normales.', NULL, NULL, 'published', NOW()),
  (3, 1, 2, 2, 'quiz', 'Quiz: Express y middlewares',
   'Cuestionario de 10 preguntas sobre el ciclo de peticion en Express.', 50.00,
   DATE_ADD(CURDATE(), INTERVAL 7 DAY) + INTERVAL 23 HOUR, 'published', NOW()),
  (4, 2, 3, 3, 'question', 'Que diferencia hay entre RAM y ROM?',
   'Responde en maximo 5 lineas con tus propias palabras.', 20.00,
   DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 23 HOUR, 'published', NOW()),
  (5, 2, NULL, 3, 'assignment', 'Infografia de redes',
   'Disena una infografia sobre topologias de red.', 100.00, NULL, 'draft', NULL);

-- -------------------------------------------------------------
-- Entregas
-- -------------------------------------------------------------
INSERT INTO submissions (coursework_id, student_id, state, answer_text, submitted_at, grade, is_late) VALUES
  (1, 4, 'turned_in', NULL, NOW(), NULL, 0),
  (1, 5, 'returned',  NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 92.00, 0),
  (1, 6, 'assigned',  NULL, NULL, NULL, 0),
  (4, 4, 'returned',  'La RAM es volatil y la ROM conserva los datos sin energia.', DATE_SUB(NOW(), INTERVAL 1 DAY), 18.00, 0);

-- -------------------------------------------------------------
-- Anuncios
-- -------------------------------------------------------------
INSERT INTO announcements (id, course_id, author_id, body) VALUES
  (1, 1, 2, 'Recuerden que la Actividad 3 CRUD se revisa en clase. Traigan el proyecto corriendo en local.'),
  (2, 1, 2, 'Ya subi la guia de normalizacion al tema Bases de datos.'),
  (3, 2, 3, 'Manana trabajamos en la sala de computo. Lleguen puntuales.');

-- -------------------------------------------------------------
-- Adjuntos
-- -------------------------------------------------------------
INSERT INTO attachments (owner_type, owner_id, kind, title, url) VALUES
  ('coursework',   2, 'link',    'Normalizacion de bases de datos', 'https://es.wikipedia.org/wiki/Normalizacion_de_bases_de_datos'),
  ('coursework',   1, 'drive',   'Plantilla_CRUD.docx',             'https://drive.google.com/file/d/demo-crud'),
  ('coursework',   3, 'youtube', 'Express en 10 minutos',           'https://www.youtube.com/watch?v=demo'),
  ('announcement', 1, 'link',    'Repositorio de ejemplo',          'https://github.com/expressjs/express');

-- -------------------------------------------------------------
-- Comentarios
-- -------------------------------------------------------------
INSERT INTO comments (target_type, target_id, author_id, body, visibility) VALUES
  ('announcement', 1, 4, 'Profe, se puede entregar en pareja?', 'class'),
  ('announcement', 1, 2, 'Si, maximo dos personas por entrega.', 'class'),
  ('submission',   1, 2, 'Falta documentar el endpoint DELETE.', 'private');

-- -------------------------------------------------------------
-- Notificaciones
-- -------------------------------------------------------------
INSERT INTO notifications (user_id, course_id, type, title, body, link) VALUES
  (4, 1, 'coursework',   'Nueva tarea: Actividad 3 CRUD', 'Vence manana',            '/courses/1/work/1'),
  (4, 2, 'grade',        'Calificacion publicada',        'RAM y ROM: 18/20',        '/courses/2/work/4'),
  (4, 1, 'announcement', 'Nuevo anuncio en Programacion', 'Guia de normalizacion',   '/courses/1'),
  (5, 1, 'grade',        'Calificacion publicada',        'Actividad 3 CRUD: 92/100','/courses/1/work/1');

-- -------------------------------------------------------------
-- Acudiente: Rosa Gomez (7) es acudiente de Jostin (4)
-- -------------------------------------------------------------
INSERT INTO guardian_students (guardian_id, student_id, relation) VALUES
  (7, 4, 'Madre');

-- -------------------------------------------------------------
-- Ajustes por defecto de cada usuario
-- -------------------------------------------------------------
INSERT INTO user_settings (user_id) SELECT id FROM users;

-- -------------------------------------------------------------
-- Verificacion
-- -------------------------------------------------------------
SELECT 'roles' AS tabla, COUNT(*) AS filas FROM roles
UNION ALL SELECT 'users',         COUNT(*) FROM users
UNION ALL SELECT 'courses',       COUNT(*) FROM courses
UNION ALL SELECT 'enrollments',   COUNT(*) FROM enrollments
UNION ALL SELECT 'topics',        COUNT(*) FROM topics
UNION ALL SELECT 'coursework',    COUNT(*) FROM coursework
UNION ALL SELECT 'submissions',   COUNT(*) FROM submissions
UNION ALL SELECT 'announcements', COUNT(*) FROM announcements
UNION ALL SELECT 'attachments',   COUNT(*) FROM attachments
UNION ALL SELECT 'comments',      COUNT(*) FROM comments
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'guardian_students', COUNT(*) FROM guardian_students;
