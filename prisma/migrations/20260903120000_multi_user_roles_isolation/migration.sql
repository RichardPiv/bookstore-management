-- Multi-user game: roles + per-user isolation (inventory, alerts, treasury, simulation).
-- WARNING: operational rows without a tenant are cleared (alerts, inventory, treasury, simulation).
-- Catalogue (books, authors, …) is preserved. Orders history is preserved.

-- ── users.role + username unique ─────────────────────────────────────────────
SET @role_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'role'
);

SET @sql := IF(
  @role_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `role` VARCHAR(16) NOT NULL DEFAULT ''user''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Promote the oldest account to admin (legacy single-admin installs).
UPDATE `users`
SET `role` = 'admin'
WHERE `id` = (SELECT min_id FROM (SELECT MIN(id) AS min_id FROM `users`) AS t)
  AND NOT EXISTS (SELECT 1 FROM (SELECT id FROM `users` WHERE `role` = 'admin' LIMIT 1) AS a);

SET @username_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'username'
);

SET @sql := IF(
  @username_idx = 0,
  'CREATE UNIQUE INDEX `username` ON `users`(`username`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── book_inventory: rebuild with user_id ─────────────────────────────────────
DROP TABLE IF EXISTS `book_inventory`;

CREATE TABLE `book_inventory` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER UNSIGNED NOT NULL,
  `book_id` INTEGER NOT NULL,
  `qty_reserve` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `qty_shelf` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `alert_threshold` INTEGER UNSIGNED NOT NULL DEFAULT 2,
  `first_received_at` DATETIME(0) NOT NULL,
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_book_inventory`(`user_id`, `book_id`),
  INDEX `book_inventory_user_id`(`user_id`),
  INDEX `book_inventory_book_id`(`book_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── alerts: add user_id (clear legacy global alerts) ─────────────────────────
DELETE FROM `alerts`;

SET @alerts_user := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'alerts'
    AND COLUMN_NAME = 'user_id'
);

SET @sql := IF(
  @alerts_user = 0,
  'ALTER TABLE `alerts` ADD COLUMN `user_id` INTEGER UNSIGNED NOT NULL, ADD INDEX `alerts_user_id`(`user_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── simulation_runs: add user_id ─────────────────────────────────────────────
DELETE FROM `simulation_events`;
DELETE FROM `simulation_runs`;

SET @sim_user := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'simulation_runs'
    AND COLUMN_NAME = 'user_id'
);

SET @sql := IF(
  @sim_user = 0,
  'ALTER TABLE `simulation_runs` ADD COLUMN `user_id` INTEGER UNSIGNED NOT NULL, ADD INDEX `simulation_runs_user_id`(`user_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── treasury: one account per user ───────────────────────────────────────────
DELETE FROM `treasury_movements`;
DELETE FROM `treasury_account`;

SET @treas_user := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'treasury_account'
    AND COLUMN_NAME = 'user_id'
);

SET @sql := IF(
  @treas_user = 0,
  'ALTER TABLE `treasury_account` ADD COLUMN `user_id` INTEGER UNSIGNED NOT NULL, ADD UNIQUE INDEX `treasury_account_user_id`(`user_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @mov_user := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'treasury_movements'
    AND COLUMN_NAME = 'user_id'
);

SET @sql := IF(
  @mov_user = 0,
  'ALTER TABLE `treasury_movements` ADD COLUMN `user_id` INTEGER UNSIGNED NOT NULL, ADD INDEX `treasury_movements_user_id`(`user_id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create treasury for every existing role=user (admins have no caisse).
INSERT INTO `treasury_account` (`user_id`, `balance`, `low_threshold`, `updated_at`)
SELECT u.`id`, 10000.00, 1000.00, NOW()
FROM `users` u
WHERE u.`role` = 'user'
  AND NOT EXISTS (
    SELECT 1 FROM `treasury_account` t WHERE t.`user_id` = u.`id`
  );
