do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'audit_logs_event_type_check'
  ) then
    alter table public.audit_logs drop constraint audit_logs_event_type_check;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'audit_logs_event_type_check'
  ) then
    alter table public.audit_logs
      add constraint audit_logs_event_type_check
      check (
        event_type in (
          'scan_started',
          'scan_completed',
          'validation_completed',
          'sync_queued',
          'sync_started',
          'sync_completed',
          'sync_failed',
          'sync_retry_scheduled',
          'submitted',
          'synced',
          'rejected'
        )
      );
  end if;
end $$;
