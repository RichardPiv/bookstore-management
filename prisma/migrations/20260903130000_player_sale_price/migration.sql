-- Player-specific sale price on inventory; catalog books keep purchase_price only.

ALTER TABLE `book_inventory`
  ADD COLUMN `sale_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

UPDATE `book_inventory` AS bi
INNER JOIN `books` AS b ON b.`id` = bi.`book_id`
SET bi.`sale_price` = b.`sale_price`;

ALTER TABLE `books`
  DROP COLUMN `sale_price`;
