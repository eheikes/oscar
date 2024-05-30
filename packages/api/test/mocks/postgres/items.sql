CREATE TABLE items (
  id uuid NOT NULL,
  uri character varying(2048) NOT NULL,
  title character varying(256) NOT NULL,
  author character varying(256),
  summary text,
  language character varying(16),
  image_uri character varying(2048),
  length double precision,
  rating numeric(5,2) DEFAULT NULL::numeric,
  due date,
  rank numeric(3,1) DEFAULT NULL::numeric,
  expected_rank numeric(3,1) DEFAULT NULL::numeric,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  deleted_at timestamp with time zone,
  type_id character varying(16) NOT NULL
);
