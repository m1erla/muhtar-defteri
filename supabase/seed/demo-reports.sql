-- Mahalle Defteri — demo reports for the competition walkthrough.
-- OPTIONAL and owner-run (SQL editor). These are illustrative community
-- reports so the map/list/home aren't empty during a demo; they are NOT real
-- civic reports. Remove them before any real launch (see the bottom of this file).
--
-- Backdated via now() - interval so the report-detail "X gün önce" line shows a
-- realistic urgency gradient (fresh → past the 15 iş günü response benchmark).
-- Coordinates are rounded to ~110 m like the app does.

insert into reports (category, description, latitude, longitude, neighborhood, status, session_id, created_at) values
  ('parking',        'Kaldırıma park eden araçlar yayaların geçişini tamamen engelliyor, çocuklar yola iniyor.', 37.055, 35.315, 'Çukurova',  'open',     'seed-demo', now() - interval '2 days'),
  ('cleanliness',    'Konteyner günlerdir boşaltılmadı, çöpler etrafa yayıldı ve koku var.',                     36.991, 35.331, 'Kurtuluş',  'open',     'seed-demo', now() - interval '20 days'),
  ('infrastructure', 'Kaldırım çökmüş, tekerlekli sandalye ve bebek arabası geçemiyor.',                        36.965, 35.360, 'Sinanpaşa', 'open',     'seed-demo', now() - interval '45 days'),
  ('school_safety',  'Okul önündeki yaya geçidi silinmişti; bildirimlerden sonra yeniden çizildi.',             37.070, 35.400, 'Bağlar',    'resolved', 'seed-demo', now() - interval '30 days'),
  -- Two more at the exact Çukurova spot + category, so it clusters to 3 reports
  -- and the map pin / ledger "⟳" density badge have something to show (PRD §8).
  ('parking',        'Aynı noktada araçlar yine kaldırıma çıkmış, geçiş kapalı.',                                37.055, 35.315, 'Çukurova',  'open',     'seed-demo', now() - interval '9 days'),
  ('parking',        'Bu köşede sürekli hatalı park oluyor, çocuklar yola iniyor.',                              37.055, 35.315, 'Çukurova',  'open',     'seed-demo', now() - interval '25 days');

-- A few confirmations so the ledger shows non-zero "X kişi doğruladı" counts.
insert into confirmations (report_id, type, session_id)
select r.id, 'still_open', s.sess
from reports r
cross join (values ('demo-c1'), ('demo-c2'), ('demo-c3')) as s(sess)
where r.session_id = 'seed-demo' and r.neighborhood = 'Sinanpaşa';

insert into confirmations (report_id, type, session_id)
select r.id, 'still_open', s.sess
from reports r
cross join (values ('demo-c1'), ('demo-c2')) as s(sess)
where r.session_id = 'seed-demo' and r.neighborhood = 'Çukurova';

-- ── Remove all demo/test data (run before a real launch) ─────────────────────
-- delete from confirmations where session_id like 'seed-%' or session_id like 'demo-%' or session_id = 'rls-verify-0001';
-- delete from reports       where session_id in ('seed-demo', 'rls-verify-0001');
