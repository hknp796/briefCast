-- ─────────────────────────────────────────────
-- BriefCast delivery schedule — pg_cron calls the deliver-briefs Edge Function
-- every minute via pg_net. Run ONCE in the Supabase SQL editor, after deploying
-- the function and setting DELIVER_CRON_SECRET (see CLAUDE.md → Deployment).
--
-- Replace the two placeholders below before running:
--   <project-ref>          your Supabase project ref
--   <DELIVER_CRON_SECRET>  the SAME value you set with `supabase secrets set`
-- Both are stored in Vault, so the secret never appears in cron.job.
-- ─────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://jhfhejsuslibxpvlupns.supabase.co', 'project_url');

select vault.create_secret('<DELIVER_CRON_SECRET>', 'deliver_cron_secret');

-- Re-running is safe: unschedule any previous copy first.
select cron.unschedule('deliver-briefs')
where exists (select 1 from cron.job where jobname = 'deliver-briefs');

select cron.schedule(
  'deliver-briefs',
  '* * * * *',          -- every minute
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/deliver-briefs',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'deliver_cron_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Useful checks:
--   select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'deliver-briefs') order by start_time desc limit 10;
--   select id, status_code, content from net._http_response order by created desc limit 10;
-- To stop:  select cron.unschedule('deliver-briefs');
