CREATE TABLE users (
    id text NOT NULL,
    nickname text NOT NULL,
    name text NOT NULL,
    email text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);
