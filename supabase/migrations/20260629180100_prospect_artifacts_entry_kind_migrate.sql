update public.prospect_artifacts
set kind = 'entry'
where kind::text in ('image', 'link', 'note');
