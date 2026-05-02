-- =====================================================================
-- v15 — HD Image Updates for Discovery Spots (Relative Paths)
-- =====================================================================

UPDATE spots SET image_url = '/spots/akyaka.png' WHERE title = 'Akyaka Orman Kampı';
UPDATE spots SET image_url = '/spots/cappadocia.png' WHERE title = 'Kapadokya Panorama';
UPDATE spots SET image_url = '/spots/kas.png' WHERE title = 'Kaş Camping';
UPDATE spots SET image_url = '/spots/borcka.png' WHERE title = 'Borçka Karagöl';
UPDATE spots SET image_url = '/spots/salda.png' WHERE title = 'Salda Gölü Kamp';
UPDATE spots SET image_url = '/spots/usta.png' WHERE title = 'Karavan Usta İstanbul';

NOTIFY pgrst, 'reload schema';
