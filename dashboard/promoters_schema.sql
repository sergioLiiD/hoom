-- Create the promoters table
CREATE TABLE promoters (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT
);

-- Add a foreign key to the properties table
ALTER TABLE properties
ADD COLUMN promoter_id INTEGER REFERENCES promoters(id);
