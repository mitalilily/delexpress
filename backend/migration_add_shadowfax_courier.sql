DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "couriers"
    WHERE LOWER("serviceProvider") = 'shadowfax'
  ) THEN
    INSERT INTO "couriers" (
      "id",
      "name",
      "serviceProvider",
      "isEnabled",
      "business_type",
      "created_at",
      "updated_at"
    )
    VALUES (
      COALESCE((SELECT MAX("id") FROM "couriers"), 0) + 1,
      'Shadowfax',
      'shadowfax',
      TRUE,
      '["b2c","b2b"]'::jsonb,
      NOW(),
      NOW()
    );
  END IF;
END
$$;
