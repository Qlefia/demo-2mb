-- Allow sales to read enrichment_jobs rows linked to prospects they can already see (RLS on prospects applies inside EXISTS).
drop policy if exists "enrichment_jobs_sales_select" on public.enrichment_jobs;
create policy "enrichment_jobs_sales_select" on public.enrichment_jobs
  for select to authenticated
  using (
    public.is_sales()
    and exists (
      select 1 from public.prospects p
      where p.id = enrichment_jobs.prospect_id
    )
  );
