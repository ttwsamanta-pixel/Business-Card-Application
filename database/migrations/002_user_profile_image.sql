SET @profile_image_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'profile_image_url'
);

SET @profile_image_sql := IF(
  @profile_image_exists = 0,
  'ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER status',
  'SELECT 1'
);

PREPARE profile_image_stmt FROM @profile_image_sql;
EXECUTE profile_image_stmt;
DEALLOCATE PREPARE profile_image_stmt;
