-- ---------------------------------------------------------------------------
-- Seed: demo admin user, ~40 realistic listings (mostly València, some elsewhere in Spain)
-- Reproducible via `supabase db reset`.
-- ---------------------------------------------------------------------------

-- Demo admin (password: globalsh4pers!). DEMO ONLY: never seed a production
-- database with it; rotate the password or delete this user before going live.
-- The profile is created by trigger.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@mylloguer.com', crypt('globalsh4pers!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Lloguer"}', now(), now(), '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@mylloguer.com"}', 'email', now(), now(), now());

-- GoTrue scans these columns as non-nullable strings/ints
update auth.users set
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  email_change = '',
  phone_change = '',
  phone_change_token = '',
  reauthentication_token = '',
  email_change_confirm_status = 0;

update profiles set is_admin = true where id = '00000000-0000-0000-0000-000000000001';

-- ~40 listings across seeded neighborhoods
with places(neighborhood, municipality, lat, lng) as (
  values
    ('Ciutat Vella', 'Valencia', 39.4785, -0.379),
    ('El Mercat', 'Valencia', 39.474, -0.3785),
    ('Ruzafa', 'Valencia', 39.463, -0.3735),
    ('El Pla del Remei', 'Valencia', 39.4685, -0.37),
    ('Gran Vía', 'Valencia', 39.466, -0.377),
    ('Benimaclet', 'Valencia', 39.485, -0.362),
    ('La Saïdia', 'Valencia', 39.482, -0.383),
    ('Benicalap', 'Valencia', 39.493, -0.39),
    ('Patraix', 'Valencia', 39.458, -0.39),
    ('Jesús', 'Valencia', 39.4585, -0.3845),
    ('Extramurs', 'Valencia', 39.466, -0.386),
    ('Campanar', 'Valencia', 39.479, -0.397),
    ('L''Olivereta', 'Valencia', 39.464, -0.398),
    ('Algirós', 'Valencia', 39.472, -0.353),
    ('Camins al Grau', 'Valencia', 39.47, -0.36),
    ('Malilla', 'Valencia', 39.455, -0.375),
    ('El Cabanyal', 'Valencia', 39.466, -0.33),
    ('Pla del Real', 'Valencia', 39.477, -0.367),
    (null, 'Mislata', 39.475, -0.418),
    (null, 'Burjassot', 39.508, -0.414),
    (null, 'Paterna', 39.502, -0.441),
    (null, 'Torrent', 39.437, -0.465),
    (null, 'Alboraya', 39.5, -0.35),
    (null, 'Manises', 39.492, -0.4587),
    ('Malasaña', 'Madrid', 40.4256, -3.704),
    ('Chamberí', 'Madrid', 40.4346, -3.7038),
    ('Lavapiés', 'Madrid', 40.4087, -3.7006),
    ('Salamanca', 'Madrid', 40.431, -3.68),
    ('Gràcia', 'Barcelona', 41.4036, 2.157),
    ('Eixample', 'Barcelona', 41.39, 2.162),
    ('Poblenou', 'Barcelona', 41.402, 2.2),
    ('Sants', 'Barcelona', 41.375, 2.135),
    ('Triana', 'Sevilla', 37.382, -6.003),
    ('Nervión', 'Sevilla', 37.383, -5.97),
    ('Centro', 'Málaga', 36.7213, -4.4214),
    ('Teatinos', 'Málaga', 36.716, -4.472),
    ('Deusto', 'Bilbao', 43.271, -2.946),
    ('Santa Catalina', 'Palma', 39.57, 2.63),
    ('Delicias', 'Zaragoza', 41.655, -0.905),
    ('Albaicín', 'Granada', 37.181, -3.593)
),
n as (
  select
    neighborhood,
    municipality,
    lat,
    lng,
    row_number() over () as rn,
    count(*) over () as total
  from places
)
insert into listings (
  type, status, price, neighborhood, municipality, location, public_lat, public_lng,
  flatmates, preferred_gender, description, available_from, bills_included, deposit,
  room_type, pets, smokers, tenant_pref, contact_external, contact_whatsapp,
  bathrooms, bedrooms, views_count, photos, approved_at, expires_at, created_at,
  contact_email, internal_email
)
select
  case when i % 3 = 0 then 'full_flat'::listing_type else 'room'::listing_type end,
  case
    when i % 10 = 8 then 'pending'::listing_status
    when i % 10 = 9 then 'rejected'::listing_status
    when i % 10 = 7 then 'expired'::listing_status
    else 'approved'::listing_status
  end,
  280 + (i * 37) % 720,
  n.neighborhood,
  n.municipality,
  st_setsrid(st_makepoint(n.lng + ((i % 5) - 2) * 0.004, n.lat + ((i % 7) - 3) * 0.003), 4326)::geography,
  round((n.lat + ((i % 7) - 3) * 0.003)::numeric, 3),
  round((n.lng + ((i % 5) - 2) * 0.004)::numeric, 3),
  case when i % 3 <> 0 then (i % 3) end,
  case when i % 4 = 1 then 'female'::gender_pref when i % 4 = 2 then 'any'::gender_pref else 'any'::gender_pref end,
  case
    when i % 3 = 0 then 'Piso completo luminoso y amueblado, a 10 minutos del centro. ' || coalesce(n.neighborhood, n.municipality) || '.'
    else 'Habitación en piso compartido en ' || coalesce(n.neighborhood, n.municipality) || ', ambiente tranquilo y buena comunicación.'
  end,
  current_date + (i % 45),
  (i % 2 = 0),
  case when i % 5 = 0 then 300 + (i * 37) % 720 end,
  case when i % 3 <> 0 then (case when i % 2 = 0 then 'double'::room_type else 'single'::room_type end) end,
  (i % 4 = 0),
  (i % 6 = 0),
  case when i % 3 = 1 then 'students'::tenant_pref when i % 3 = 2 then 'workers'::tenant_pref else 'any'::tenant_pref end,
  case when i % 6 = 0 then 'https://example.com/anunci/' || i end,
  '+346' || lpad((10000000 + i * 137913)::text, 8, '0'),
  1 + (i % 2),
  case when i % 3 = 0 then 2 + (i % 3) end,
  (i * 13) % 240,
  '{}',
  case when i % 10 not in (7, 8, 9) then now() - ((i % 20) || ' days')::interval end,
  case
    when i % 10 = 7 then now() - '2 days'::interval
    when i % 10 not in (8, 9) then now() + ((10 - i % 10) || ' days')::interval
  end,
  now() - ((i % 60) || ' days')::interval,
  case when i % 4 = 0 then 'anuncio' || i || '@example.com' end,
  'privado' || i || '@example.com'
from generate_series(1, 40) as g(i)
join n on n.rn = (g.i % n.total) + 1;

-- Moderation history for the rejected sample listings
insert into moderation_events (listing_id, actor_id, action, comment)
select id, '00000000-0000-0000-0000-000000000001', 'rejected',
       'Falta al menos una foto y concretar la disponibilidad.'
from listings where status = 'rejected';

insert into moderation_events (listing_id, actor_id, action)
select id, null, 'submitted'
from listings where status in ('pending', 'rejected');
