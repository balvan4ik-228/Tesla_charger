-- Водители. Водитель 1 — текущий пользователь приложения (CURRENT_DRIVER_ID)
INSERT INTO drivers (id, login, full_name, is_moderator) VALUES
  (1, 'ivan_petrov',      'Иван Петров',               false),
  (2, 'maria_sokolova',   'Мария Соколова',            false),
  (3, 'service_engineer', 'Инженер сервисного центра', true);

-- Параметры потребления: три опубликованных, черновик, удалённый.
-- Сила тока рассчитана как мощность, делённая на напряжение батареи (400 В).
-- Черновик принадлежит водителю 2, поэтому у текущего водителя его нет:
-- страница «Добавление» откроется с выбором файлов и кнопкой «Далее».
INSERT INTO tesla_parameters
  (id, parameter_name, short_description, status, image_key, video_key,
   current_a, power_w, created_at, formed_at, creator_id)
VALUES
  (1, 'Движение по шоссе 120 км/ч',
   'Равномерное движение по автомагистрали. Аэродинамическое сопротивление растёт квадратично скорости, поэтому тяговый инвертор потребляет наибольший ток среди всех режимов.',
   'опубликован', 'highway_cruise.jpg', 'highway_cruise.mp4',
   55.0, 22000, now() - interval '10 days', now() - interval '9 days', 1),
  (2, 'Городской цикл с рекуперацией',
   'Частые разгоны и торможения на скорости до 60 км/ч. При торможении мотор работает генератором и возвращает часть энергии в батарею, поэтому средний ток вдвое ниже шоссейного.',
   'опубликован', 'city_regen.jpg', 'city_regen.mp4',
   22.5, 9000, now() - interval '8 days', now() - interval '7 days', 1),
  (3, 'Обогрев салона при минус 15',
   'Тепловой насос прогревает салон и батарею. Потребление не зависит от скорости, поэтому в коротких зимних поездках его доля в общем расходе особенно заметна.',
   'опубликован', 'cabin_heating.jpg', 'cabin_heating.mp4',
   10.0, 4000, now() - interval '6 days', now() - interval '5 days', 1),
  (4, 'Подогрев сидений и руля',
   NULL,
   'черновик', 'seat_heating.jpg', 'seat_heating.mp4',
   NULL, NULL, now() - interval '1 day', NULL, 2),
  (5, 'Кондиционер при плюс 35',
   'Охлаждение салона и батареи в жару.',
   'удален', 'air_conditioning.jpg', 'air_conditioning.mp4',
   6.3, 2500, now() - interval '12 days', now() - interval '11 days', 1);

-- Лайки (м-м)
INSERT INTO tesla_parameter_likes (driver_id, tesla_parameter_id) VALUES
  (1, 1), (2, 1), (3, 1),
  (2, 2), (3, 2),
  (1, 3),
  (2, 5);

-- После вставки с явными id сдвигаем счётчики, иначе новые записи упадут на дубле ключа
SELECT setval(pg_get_serial_sequence('drivers', 'id'),               (SELECT MAX(id) FROM drivers));
SELECT setval(pg_get_serial_sequence('tesla_parameters', 'id'),      (SELECT MAX(id) FROM tesla_parameters));
SELECT setval(pg_get_serial_sequence('tesla_parameter_likes', 'id'), (SELECT MAX(id) FROM tesla_parameter_likes));
