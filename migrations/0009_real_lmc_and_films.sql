-- Migration: Replace placeholder Lincoln Manufacturing entries with real uploaded videos
-- Also replace placeholder film entry with 20 Liters (real uploaded content)
--
-- R2 bucket: outerfields-videos
-- CDN base: https://pub-cbac02584c2c4411aa214a7070ccd208.r2.dev
-- All asset_paths are relative to CDN base (prepended by ContentCategories.svelte)

-- ============================================================
-- 1. Remove old placeholder Lincoln Manufacturing entries
-- ============================================================
DELETE FROM videos WHERE category = 'lincoln-manufacturing';

-- ============================================================
-- 2. Insert real LMC company profile videos (12 companies + 1 main spot = 13 total)
--    All videos uploaded to R2 as /videos/lmc-*.mp4
--    Durations extracted via ffprobe from actual files
-- ============================================================
INSERT INTO videos (id, title, category, episode_number, tier, duration, asset_path, thumbnail_path, description, created_at, updated_at) VALUES
  ('vid_lmc_main_spot', 'Lincoln Manufacturing Council - Main Spot', 'lincoln-manufacturing', NULL, 'free', 82, '/videos/lmc-main-spot-recolor.mov', '/thumbnails/lincoln/main-spot.jpg', 'Lincoln Manufacturing Council official promotional video', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_continental', 'Continental ContiTech', 'lincoln-manufacturing', 1, 'free', 111, '/videos/lmc-continental-contitech.mp4', '/thumbnails/lincoln/continental-contitech.jpg', 'Continental ContiTech company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_firespring', 'Firespring', 'lincoln-manufacturing', 2, 'free', 104, '/videos/lmc-firespring.mp4', '/thumbnails/lincoln/firespring.jpg', 'Firespring company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_garner', 'Garner Industries', 'lincoln-manufacturing', 3, 'free', 105, '/videos/lmc-garner-industries.mp4', '/thumbnails/lincoln/garner-industries.jpg', 'Garner Industries company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_hexagon', 'Hexagon Agility', 'lincoln-manufacturing', 4, 'free', 124, '/videos/lmc-hexagon-agility.mp4', '/thumbnails/lincoln/hexagon-agility.jpg', 'Hexagon Agility company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_instinct', 'Instinct Pet Food', 'lincoln-manufacturing', 5, 'free', 97, '/videos/lmc-instinct-pet-food.mp4', '/thumbnails/lincoln/instinct-pet-food.jpg', 'Instinct Pet Food company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_kawasaki', 'Kawasaki Motors', 'lincoln-manufacturing', 6, 'free', 107, '/videos/lmc-kawasaki-motors.mp4', '/thumbnails/lincoln/kawasaki-motors.jpg', 'Kawasaki Motors company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_licor', 'LI-COR Biosciences', 'lincoln-manufacturing', 7, 'free', 124, '/videos/lmc-li-cor.mp4', '/thumbnails/lincoln/li-cor.jpg', 'LI-COR Biosciences company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_lincoln_ind', 'Lincoln Industries', 'lincoln-manufacturing', 8, 'free', 112, '/videos/lmc-lincoln-industries.mp4', '/thumbnails/lincoln/lincoln-industries.jpg', 'Lincoln Industries company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_molex', 'Molex', 'lincoln-manufacturing', 9, 'free', 82, '/videos/lmc-molex.mp4', '/thumbnails/lincoln/molex.jpg', 'Molex company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_morio', 'Morio USA', 'lincoln-manufacturing', 10, 'free', 103, '/videos/lmc-morio-usa.mp4', '/thumbnails/lincoln/morio-usa.jpg', 'Morio USA company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_teledyne', 'Teledyne ISCO', 'lincoln-manufacturing', 11, 'free', 124, '/videos/lmc-teledyne-isco.mp4', '/thumbnails/lincoln/teledyne-isco.jpg', 'Teledyne ISCO company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_lmc_tmco', 'TMCO', 'lincoln-manufacturing', 12, 'free', 107, '/videos/lmc-tmco.mp4', '/thumbnails/lincoln/tmco.jpg', 'TMCO company profile - Lincoln Manufacturing Council', strftime('%s', 'now'), strftime('%s', 'now'));

-- ============================================================
-- 3. Remove old placeholder film entry and add 20 Liters
-- ============================================================
DELETE FROM videos WHERE category = 'films';

INSERT INTO videos (id, title, category, episode_number, tier, duration, asset_path, thumbnail_path, description, created_at, updated_at) VALUES
  ('vid_20_liters', '20 Liters', 'films', NULL, 'free', 863, '/videos/20-liters-full.mp4', '/thumbnails/films/20-liters.jpg', '20 Liters - A feature film by Outerfields', strftime('%s', 'now'), strftime('%s', 'now')),
  ('vid_20_liters_teaser', '20 Liters - Teaser', 'films', NULL, 'free', 167, '/videos/20-liters-teaser.mp4', '/thumbnails/films/20-liters-teaser.jpg', '20 Liters teaser trailer', strftime('%s', 'now'), strftime('%s', 'now'));
