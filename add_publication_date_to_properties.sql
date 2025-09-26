-- Add a new column to store the publication date of the property.
-- This will allow us to track how long a property has been on the market.
ALTER TABLE public.properties
ADD COLUMN publication_date DATE;

-- Optional: Add a comment to the new column for clarity.
COMMENT ON COLUMN public.properties.publication_date IS 'The date when the property was first published on the source portal.';
