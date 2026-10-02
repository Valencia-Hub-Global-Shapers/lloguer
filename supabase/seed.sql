-- ---------------------------------------------------------------------------
-- Seed: neighborhoods, demo admin user, ~40 realistic listings
-- Reproducible via `supabase db reset`.
-- ---------------------------------------------------------------------------

-- Neighborhoods: Valencia districts + ~20km metro towns
insert into neighborhoods (name_es, name_ca, name_en, slug, center, municipality) values
  ('El Carmen', 'El Carme', 'El Carmen', 'el-carme', st_setsrid(st_makepoint(-0.3790, 39.4785), 4326), 'València'),
  ('El Mercat', 'El Mercat', 'El Mercat', 'el-mercat', st_setsrid(st_makepoint(-0.3785, 39.4740), 4326), 'València'),
  ('Russafa', 'Russafa', 'Ruzafa', 'russafa', st_setsrid(st_makepoint(-0.3735, 39.4630), 4326), 'València'),
  ('El Pla del Remei', 'El Pla del Remei', 'El Pla del Remei', 'pla-del-remei', st_setsrid(st_makepoint(-0.3700, 39.4685), 4326), 'València'),
  ('Gran Vía', 'Gran Via', 'Gran Via', 'gran-via', st_setsrid(st_makepoint(-0.3770, 39.4660), 4326), 'València'),
  ('Benimaclet', 'Benimaclet', 'Benimaclet', 'benimaclet', st_setsrid(st_makepoint(-0.3620, 39.4850), 4326), 'València'),
  ('La Saïdia', 'La Saïdia', 'La Saidia', 'la-saidia', st_setsrid(st_makepoint(-0.3830, 39.4820), 4326), 'València'),
  ('Benicalap', 'Benicalap', 'Benicalap', 'benicalap', st_setsrid(st_makepoint(-0.3900, 39.4930), 4326), 'València'),
  ('Patraix', 'Patraix', 'Patraix', 'patraix', st_setsrid(st_makepoint(-0.3900, 39.4580), 4326), 'València'),
  ('Jesús', 'Jesús', 'Jesus', 'jesus', st_setsrid(st_makepoint(-0.3845, 39.4585), 4326), 'València'),
  ('Extramurs', 'Extramurs', 'Extramurs', 'extramurs', st_setsrid(st_makepoint(-0.3860, 39.4660), 4326), 'València'),
  ('Campanar', 'Campanar', 'Campanar', 'campanar', st_setsrid(st_makepoint(-0.3970, 39.4790), 4326), 'València'),
  ('La Olivereta', 'L''Olivereta', 'La Olivereta', 'lolivereta', st_setsrid(st_makepoint(-0.3980, 39.4640), 4326), 'València'),
  ('Algirós', 'Algirós', 'Algiros', 'algiros', st_setsrid(st_makepoint(-0.3530, 39.4720), 4326), 'València'),
  ('Camins al Grau', 'Camins al Grau', 'Camins al Grau', 'camins-al-grau', st_setsrid(st_makepoint(-0.3600, 39.4700), 4326), 'València'),
  ('Malilla', 'Malilla', 'Malilla', 'malilla', st_setsrid(st_makepoint(-0.3750, 39.4550), 4326), 'València'),
  ('El Cabanyal', 'El Cabanyal', 'El Cabanyal', 'el-cabanyal', st_setsrid(st_makepoint(-0.3300, 39.4660), 4326), 'València'),
  ('Pla del Real', 'Pla del Real', 'Pla del Real', 'pla-del-real', st_setsrid(st_makepoint(-0.3670, 39.4770), 4326), 'València'),
  ('Mislata', 'Mislata', 'Mislata', 'mislata', st_setsrid(st_makepoint(-0.4180, 39.4750), 4326), 'Mislata'),
  ('Burjassot', 'Burjassot', 'Burjassot', 'burjassot', st_setsrid(st_makepoint(-0.4140, 39.5080), 4326), 'Burjassot'),
  ('Godella', 'Godella', 'Godella', 'godella', st_setsrid(st_makepoint(-0.4150, 39.5200), 4326), 'Godella'),
  ('Alboraya', 'Alboraia', 'Alboraya', 'alboraia', st_setsrid(st_makepoint(-0.3500, 39.5000), 4326), 'Alboraia'),
  ('Paterna', 'Paterna', 'Paterna', 'paterna', st_setsrid(st_makepoint(-0.4410, 39.5020), 4326), 'Paterna'),
  ('Torrent', 'Torrent', 'Torrent', 'torrent', st_setsrid(st_makepoint(-0.4650, 39.4370), 4326), 'Torrent'),
  ('Quart de Poblet', 'Quart de Poblet', 'Quart de Poblet', 'quart-de-poblet', st_setsrid(st_makepoint(-0.4400, 39.4810), 4326), 'Quart de Poblet'),
  ('Xirivella', 'Xirivella', 'Xirivella', 'xirivella', st_setsrid(st_makepoint(-0.4270, 39.4660), 4326), 'Xirivella'),
  ('Aldaia', 'Aldaia', 'Aldaia', 'aldaia', st_setsrid(st_makepoint(-0.4608, 39.4647), 4326), 'Aldaia'),
  ('Manises', 'Manises', 'Manises', 'manises', st_setsrid(st_makepoint(-0.4587, 39.4920), 4326), 'Manises'),
  ('Alaquàs', 'Alaquàs', 'Alaquas', 'alaquas', st_setsrid(st_makepoint(-0.4610, 39.4571), 4326), 'Alaquàs');

-- Demo users (password: password123). Profiles are created by trigger.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@mylloguer.com', crypt('globalsh4pers!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Admin MyLloguer"}', now(), now(), '', '', '');

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
with n as (
  select
    name_ca,
    municipality,
    st_y(center::geometry) as lat,
    st_x(center::geometry) as lng,
    row_number() over () as rn,
    count(*) over () as total
  from neighborhoods
)
insert into listings (
  type, status, price, neighborhood, municipality, location, public_lat, public_lng,
  flatmates, preferred_gender, description, available_from, bills_included, deposit,
  room_type, pets, smokers, tenant_pref, contact_external, contact_whatsapp,
  bathrooms, bedrooms, views_count, photos, approved_at, expires_at, created_at
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
  n.name_ca,
  n.municipality,
  st_setsrid(st_makepoint(n.lng + ((i % 5) - 2) * 0.004, n.lat + ((i % 7) - 3) * 0.003), 4326)::geography,
  round((n.lat + ((i % 7) - 3) * 0.003)::numeric, 3),
  round((n.lng + ((i % 5) - 2) * 0.004)::numeric, 3),
  case when i % 3 <> 0 then (i % 3) end,
  case when i % 4 = 1 then 'female'::gender_pref when i % 4 = 2 then 'any'::gender_pref else 'any'::gender_pref end,
  case
    when i % 3 = 0 then 'Pis complet lluminós i moblat, a 10 minuts del centre. ' || n.name_ca || '.'
    else 'Habitació en pis compartit a ' || n.name_ca || ', ambient tranquil i bona comunicació.'
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
  now() - ((i % 60) || ' days')::interval
from generate_series(1, 40) as g(i)
join n on n.rn = (g.i % n.total) + 1;

-- Moderation history for the rejected sample listings
insert into moderation_events (listing_id, actor_id, action, comment)
select id, '00000000-0000-0000-0000-000000000001', 'rejected',
       'Cal afegir almenys una foto i concretar la disponibilitat.'
from listings where status = 'rejected';

insert into moderation_events (listing_id, actor_id, action)
select id, null, 'submitted'
from listings where status in ('pending', 'rejected');
