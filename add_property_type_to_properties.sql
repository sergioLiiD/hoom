-- Add property_type column to distinguish between houses and land
-- Step 1: Create ENUM type for property types
CREATE TYPE public.property_type_enum AS ENUM ('casa', 'terreno');

-- Step 2: Add the property_type column to the properties table
ALTER TABLE public.properties
ADD COLUMN property_type public.property_type_enum DEFAULT 'casa';

-- Step 3: Update all existing properties to be 'casa' (houses)
UPDATE public.properties
SET property_type = 'casa'
WHERE property_type IS NULL;

-- Step 4: Make the column NOT NULL to ensure data integrity
ALTER TABLE public.properties
ALTER COLUMN property_type SET NOT NULL;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN public.properties.property_type IS 'Type of property: casa (house) or terreno (land)';
