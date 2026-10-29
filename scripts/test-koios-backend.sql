-- Smoke-test the PostgreSQL functions used by the Koios proxy backend.
-- Run with psql against the Koios/cardano-db-sync database, for example:
--   psql -X -v ON_ERROR_STOP=1 "$POSTGRES_URL" -f scripts/test-koios-backend.sql
--
-- The transaction is read-only and is always rolled back. A FAIL line identifies
-- the PostgreSQL function and includes its SQLSTATE and database error.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

DO $koios_test$
DECLARE
  sample_address text;
  sample_stake_address text;
  sample_pool_id text;
  sample_policy_id text;
  sample_asset_name text;
  sample_tx_hash text;
  sample_drep_id text;
  sample_proposal_id text;
  sample_epoch numeric;
  test jsonb;
  test_sql text;
  row_count bigint;
  started_at timestamptz;
  elapsed_ms numeric;
  required_function text;
  tests jsonb := '[]'::jsonb;
BEGIN
  RAISE NOTICE 'Koios backend PostgreSQL smoke test';
  RAISE NOTICE 'Database: %, server: %, grest schema: %',
    current_database(), version(),
    CASE WHEN to_regnamespace('grest') IS NULL THEN 'MISSING' ELSE 'present' END;

  IF to_regnamespace('grest') IS NULL THEN
    RAISE EXCEPTION 'Schema grest is missing; Koios SQL artifacts are not installed in this database';
  END IF;

  FOREACH required_function IN ARRAY ARRAY[
    'address_list', 'address_info', 'address_txs', 'account_info',
    'account_update_history', 'account_addresses', 'pool_list', 'pool_info',
    'pool_delegators', 'pool_history', 'pool_delegators_history', 'asset_info',
    'policy_asset_addresses', 'tx_metadata', 'tx_info', 'totals',
    'proposal_list', 'proposal_voting_summary', 'proposal_votes',
    'committee_info', 'drep_list', 'drep_updates', 'drep_metadata',
    'drep_info', 'drep_delegators', 'drep_votes', 'vote_list'
  ]::text[]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS proc
      JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = proc.pronamespace
      WHERE namespace.nspname = 'grest'
        AND proc.proname = required_function
    ) THEN
      RAISE NOTICE 'MISSING | grest.%()', required_function;
    END IF;
  END LOOP;

  -- Samples come from the same database so no private wallet data is required.
  SELECT address
    INTO sample_address
    FROM public.address
    ORDER BY id DESC
    LIMIT 1;

  SELECT view
    INTO sample_stake_address
    FROM public.stake_address
    WHERE view IS NOT NULL
    ORDER BY id DESC
    LIMIT 1;

  SELECT encode(policy, 'hex'), encode(name, 'hex')
    INTO sample_policy_id, sample_asset_name
    FROM public.multi_asset
    ORDER BY id DESC
    LIMIT 1;

  SELECT encode(hash, 'hex')
    INTO sample_tx_hash
    FROM public.tx
    ORDER BY id DESC
    LIMIT 1;

  SELECT max(epoch_no)::numeric
    INTO sample_epoch
    FROM public.block;

  -- These identifiers need Koios conversion helpers. Failure is isolated so the
  -- rest of the suite still reports useful migration errors.
  BEGIN
    SELECT pool_id_bech32
      INTO sample_pool_id
      FROM grest.pool_list()
      WHERE pool_status IN ('registered', 'retiring', 'retired')
      LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SAMPLE | pool unavailable | SQLSTATE % | %', SQLSTATE, SQLERRM;
  END;

  BEGIN
    SELECT drep_id
      INTO sample_drep_id
      FROM grest.drep_list()
      LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SAMPLE | DRep unavailable | SQLSTATE % | %', SQLSTATE, SQLERRM;
  END;

  BEGIN
    SELECT proposal_id
      INTO sample_proposal_id
      FROM grest.proposal_list()
      LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SAMPLE | proposal unavailable | SQLSTATE % | %', SQLSTATE, SQLERRM;
  END;

  RAISE NOTICE 'Samples: address=%, stake=%, pool=%, asset=%.%, tx=%, drep=%, proposal=%, epoch=%',
    coalesce(left(sample_address, 24) || '...', 'NONE'),
    coalesce(left(sample_stake_address, 24) || '...', 'NONE'),
    coalesce(left(sample_pool_id, 24) || '...', 'NONE'),
    coalesce(left(sample_policy_id, 12) || '...', 'NONE'),
    coalesce(left(sample_asset_name, 12) || '...', 'NONE'),
    coalesce(left(sample_tx_hash, 12) || '...', 'NONE'),
    coalesce(left(sample_drep_id, 24) || '...', 'NONE'),
    coalesce(left(sample_proposal_id, 24) || '...', 'NONE'),
    coalesce(sample_epoch::text, 'NONE');

  tests := jsonb_build_array(
    jsonb_build_object('name', 'GET /address_list', 'sql',
      'SELECT * FROM grest.address_list() LIMIT 100'),
    jsonb_build_object('name', 'POST /address_info', 'sql',
      CASE WHEN sample_address IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.address_info(ARRAY[%L]::text[])', sample_address) END),
    jsonb_build_object('name', 'POST /address_txs', 'sql',
      CASE WHEN sample_address IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.address_txs(ARRAY[%L]::text[]) LIMIT 100', sample_address) END),
    jsonb_build_object('name', 'POST /account_info', 'sql',
      CASE WHEN sample_stake_address IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.account_info(ARRAY[%L]::text[])', sample_stake_address) END),
    jsonb_build_object('name', 'POST /account_update_history', 'sql',
      CASE WHEN sample_stake_address IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.account_update_history(ARRAY[%L]::text[]) LIMIT 100', sample_stake_address) END),
    jsonb_build_object('name', 'POST /account_addresses', 'sql',
      CASE WHEN sample_stake_address IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.account_addresses(ARRAY[%L]::text[], false, false) LIMIT 100', sample_stake_address) END),
    jsonb_build_object('name', 'GET /pool_list', 'sql',
      'SELECT * FROM grest.pool_list() LIMIT 100'),
    jsonb_build_object('name', 'POST /pool_info', 'sql',
      CASE WHEN sample_pool_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.pool_info(ARRAY[%L]::text[])', sample_pool_id) END),
    jsonb_build_object('name', 'GET /pool_delegators', 'sql',
      CASE WHEN sample_pool_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.pool_delegators(%L) LIMIT 100', sample_pool_id) END),
    jsonb_build_object('name', 'GET /pool_history', 'sql',
      CASE WHEN sample_pool_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.pool_history(%L) LIMIT 1', sample_pool_id) END),
    jsonb_build_object('name', 'GET /pool_delegators_history', 'sql',
      CASE WHEN sample_pool_id IS NULL OR sample_epoch IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.pool_delegators_history(%L, %s) LIMIT 100', sample_pool_id, sample_epoch) END),
    jsonb_build_object('name', 'POST /asset_info', 'sql',
      CASE WHEN sample_policy_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.asset_info(ARRAY[ARRAY[%L, %L]]::text[][])', sample_policy_id, sample_asset_name) END),
    jsonb_build_object('name', 'GET /policy_asset_addresses (legacy)', 'sql',
      CASE WHEN sample_policy_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.policy_asset_addresses(%L) LIMIT 100', sample_policy_id) END),
    jsonb_build_object('name', 'POST /tx_metadata', 'sql',
      CASE WHEN sample_tx_hash IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.tx_metadata(ARRAY[%L]::text[])', sample_tx_hash) END),
    jsonb_build_object('name', 'POST /tx_info', 'sql',
      CASE WHEN sample_tx_hash IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.tx_info(ARRAY[%L]::text[], true, false, false, false, false, false, false, false)', sample_tx_hash) END),
    jsonb_build_object('name', 'GET /totals', 'sql',
      'SELECT * FROM grest.totals() LIMIT 200'),
    jsonb_build_object('name', 'GET /proposal_list', 'sql',
      'SELECT * FROM grest.proposal_list() LIMIT 100'),
    jsonb_build_object('name', 'GET /proposal_voting_summary', 'sql',
      CASE WHEN sample_proposal_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.proposal_voting_summary(%L)', sample_proposal_id) END),
    jsonb_build_object('name', 'GET /proposal_votes', 'sql',
      CASE WHEN sample_proposal_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.proposal_votes(%L) LIMIT 100', sample_proposal_id) END),
    jsonb_build_object('name', 'GET /committee_info', 'sql',
      'SELECT * FROM grest.committee_info()'),
    jsonb_build_object('name', 'GET /drep_list', 'sql',
      'SELECT * FROM grest.drep_list() LIMIT 100'),
    jsonb_build_object('name', 'GET /drep_updates', 'sql',
      'SELECT * FROM grest.drep_updates() LIMIT 100'),
    jsonb_build_object('name', 'POST /drep_metadata', 'sql',
      CASE WHEN sample_drep_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.drep_metadata(ARRAY[%L]::text[])', sample_drep_id) END),
    jsonb_build_object('name', 'POST /drep_info', 'sql',
      CASE WHEN sample_drep_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.drep_info(ARRAY[%L]::text[])', sample_drep_id) END),
    jsonb_build_object('name', 'POST /drep_delegators', 'sql',
      CASE WHEN sample_drep_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.drep_delegators(%L) LIMIT 100', sample_drep_id) END),
    jsonb_build_object('name', 'GET /drep_votes (legacy)', 'sql',
      CASE WHEN sample_drep_id IS NULL THEN NULL ELSE format(
        'SELECT * FROM grest.drep_votes(%L) LIMIT 100', sample_drep_id) END),
    jsonb_build_object('name', 'GET /vote_list (drep_votes replacement)', 'sql',
      'SELECT * FROM grest.vote_list() LIMIT 100')
  );

  FOR test IN SELECT value FROM jsonb_array_elements(tests)
  LOOP
    test_sql := test ->> 'sql';
    IF test_sql IS NULL THEN
      RAISE NOTICE 'SKIP | % | no suitable sample row exists', test ->> 'name';
      CONTINUE;
    END IF;

    started_at := clock_timestamp();
    BEGIN
      EXECUTE 'SELECT count(*) FROM (' || test_sql || ') AS tested_query'
        INTO row_count;
      elapsed_ms := round(extract(epoch FROM clock_timestamp() - started_at)::numeric * 1000, 1);
      RAISE NOTICE 'OK   | % | rows=% | % ms', test ->> 'name', row_count, elapsed_ms;
    EXCEPTION WHEN OTHERS THEN
      elapsed_ms := round(extract(epoch FROM clock_timestamp() - started_at)::numeric * 1000, 1);
      RAISE NOTICE 'FAIL | % | % ms | SQLSTATE % | %',
        test ->> 'name', elapsed_ms, SQLSTATE, SQLERRM;
    END;
  END LOOP;
END
$koios_test$;

ROLLBACK;
