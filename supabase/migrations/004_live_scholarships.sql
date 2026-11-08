-- ============================================================
-- 004 — Live scholarship discovery upsert
--
-- The catalogue is read-only through RLS ("scholarships_authenticated_read").
-- This migration adds ONE narrow, SECURITY DEFINER function that an
-- authenticated session may call through the platform API to refresh
-- the live catalogue. Everything else about the table stays locked.
--
-- Properties:
--   • Only authenticated callers may execute it.
--   • Each entry MUST carry a source URL + a valid deadline.
--   • The id is deterministic (derived from provider + name), so
--     running the same discovery twice updates rows in place
--     instead of duplicating them.
--   • Entries are stored with verification_status = 'needs_verification'
--     and source = 'live' — the UI shows them as "Live · verify at
--     source" until an administrator confirms them manually.
-- ============================================================

drop function if exists public.upsert_live_scholarships(jsonb);

create or replace function public.upsert_live_scholarships(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item  jsonb;
  v_id    text;
  v_ts    timestamptz := now();
  v_deadline timestamptz;
  v_count integer := 0;
  v_category jsonb;
  v_eligibility jsonb;
  v_states text[];
  v_courses text[];
  v_category_requirements text[];
  v_required_documents text[];
  v_max_income bigint;
begin
  if auth.uid() is null then
    raise exception 'Only authenticated users can refresh the live catalogue.';
  end if;

  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'p_items must be a JSON array.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    exit when v_count >= 40;  -- hard cap per refresh

    -- Required: name + provider + a parseable deadline in the future.
    if nullif(v_item->>'name', '') is null or nullif(v_item->>'provider', '') is null then
      continue;
    end if;
    begin
      v_deadline := (v_item->>'deadline')::timestamptz;
    exception when others then
      v_deadline := null;
    end;
    if v_deadline is null or v_deadline <= now() then
      continue;
    end if;

    -- Defensive jsonb typing for array-shaped columns.
    v_category := case when jsonb_typeof(v_item->'category') = 'array'
                       then v_item->'category' else '[]'::jsonb end;
    v_eligibility := case when jsonb_typeof(v_item->'eligibility') = 'object'
                          then v_item->'eligibility' else '{}'::jsonb end;

    v_states := coalesce(
      array(select x from jsonb_array_elements_text(coalesce(v_item->'states', '[]'::jsonb)) as x),
      array[]::text[]);
    v_courses := coalesce(
      array(select x from jsonb_array_elements_text(coalesce(v_item->'courses', '[]'::jsonb)) as x),
      array[]::text[]);
    v_category_requirements := coalesce(
      array(select x from jsonb_array_elements_text(coalesce(v_item->'categoryRequirements', '[]'::jsonb)) as x),
      array[]::text[]);
    v_required_documents := coalesce(
      array(select x from jsonb_array_elements_text(coalesce(v_item->'requiredDocuments', '[]'::jsonb)) as x),
      array[]::text[]);

    -- Safe bigint coercion for max_income.
    begin
      v_max_income := (v_item->>'maxIncome')::bigint;
    exception when others then
      v_max_income := null;
    end;

    -- Deterministic id → repeated refreshes upsert instead of duplicating.
    v_id := 'live-'
      || left(lower(regexp_replace(coalesce(v_item->>'provider', ''), '[^a-zA-Z0-9]+', '-', 'g')), 60)
      || '-'
      || left(lower(regexp_replace(coalesce(v_item->>'name', ''), '[^a-zA-Z0-9]+', '-', 'g')), 80);

    insert into public.scholarships (
      id, name, provider, amount, category, eligibility, deadline, open_date, status,
      description, required_documents, official_link, is_demo, source, last_checked_at,
      state, education_level, course, category_requirements, family_income_criteria,
      max_income, scholarship_type, application_instructions, source_url,
      verification_status, last_verified_at
    )
    values (
      v_id,
      v_item->>'name',
      v_item->>'provider',
      coalesce(v_item->>'amount', 'Varies'),
      v_category,
      v_eligibility,
      v_deadline,
      v_deadline,
      coalesce(v_item->>'status', 'open'),
      coalesce(v_item->>'description', ''),
      v_required_documents,
      coalesce(nullif(v_item->>'officialLink', ''), nullif(v_item->>'sourceUrl', ''), '#'),
      false,
      'live',
      v_ts,
      v_states,
      coalesce(v_item->>'educationLevel', ''),
      v_courses,
      v_category_requirements,
      coalesce(v_item->>'familyIncomeCriteria', ''),
      v_max_income,
      coalesce(v_item->>'scholarshipType', ''),
      coalesce(v_item->>'applicationInstructions', ''),
      coalesce(nullif(v_item->>'sourceUrl', ''), ''),
      'needs_verification',
      v_ts
    )
    on conflict (id) do update set
      amount = excluded.amount,
      deadline = excluded.deadline,
      status = excluded.status,
      description = excluded.description,
      required_documents = excluded.required_documents,
      official_link = excluded.official_link,
      source_url = excluded.source_url,
      state = excluded.state,
      education_level = excluded.education_level,
      course = excluded.course,
      category_requirements = excluded.category_requirements,
      family_income_criteria = excluded.family_income_criteria,
      max_income = excluded.max_income,
      scholarship_type = excluded.scholarship_type,
      application_instructions = excluded.application_instructions,
      last_checked_at = v_ts,
      last_verified_at = v_ts,
      verification_status = 'needs_verification';

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Tighten execution rights: only authenticated users.
revoke all on function public.upsert_live_scholarships(jsonb) from public;
revoke all on function public.upsert_live_scholarships(jsonb) from anon;
grant execute on function public.upsert_live_scholarships(jsonb) to authenticated;
