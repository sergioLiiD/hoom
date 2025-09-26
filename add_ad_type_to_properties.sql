-- First, create a new ENUM type to define the possible values for the ad type.
CREATE TYPE public.ad_type_enum AS ENUM ('super destacado', 'destacado', 'normal');

-- Then, add the new column to the properties table using the new ENUM type.
ALTER TABLE public.properties
ADD COLUMN ad_type public.ad_type_enum;

-- Optional: Add a comment to the new column for clarity.
COMMENT ON COLUMN public.properties.ad_type IS 'The type of advertisement for the property (e.g., super destacado, destacado, normal).';
