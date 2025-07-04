/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('providers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true, unique: true },
    api_base_url: { type: 'varchar(255)', notNull: true },
    list_models_endpoint: { type: 'varchar(255)' }, // e.g., /v1/models
    get_model_endpoint: { type: 'varchar(255)' }, // e.g., /v1/models/{model_id}
    auth_type: { type: 'auth_type_enum' }, // Assumes auth_type_enum is created
    auth_header_name: { type: 'varchar(255)' }, // e.g., 'Authorization' or 'x-api-key'
    api_key_env_var: { type: 'varchar(255)' }, // e.g., 'OPENAI_API_KEY'
    docs_url: { type: 'varchar(255)' },
    notes: { type: 'text' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Seed data
  pgm.sql(`
    INSERT INTO providers (name, api_base_url, list_models_endpoint, auth_type, auth_header_name, api_key_env_var, docs_url) VALUES
    ('OpenAI', 'https://api.openai.com/v1', '/models', 'bearer', 'Authorization', 'OPENAI_API_KEY', 'https://platform.openai.com/docs/api-reference/models'),
    ('Anthropic', 'https://api.anthropic.com/v1', '/models', 'x-api-key', 'x-api-key', 'ANTHROPIC_API_KEY', 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api');
    -- ('Google Gemini', 'https://generativelanguage.googleapis.com/v1beta', '/models', 'custom', 'Authorization,x-goog-api-key', 'GOOGLE_API_KEY', 'https://ai.google.dev/docs/gemini_api_overview'),
    -- ('Mistral AI', 'https://api.mistral.ai/v1', '/models', 'bearer', 'Authorization', 'MISTRAL_API_KEY', 'https://docs.mistral.ai/platform/api/'),
    -- ('Groq', 'https://api.groq.com/openai/v1', '/models', 'bearer', 'Authorization', 'GROQ_API_KEY', 'https://console.groq.com/docs/api-reference#ListModels')
    -- Add other providers as needed
  `);

  // Trigger to update 'updated_at' column
  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_timestamp_providers
    BEFORE UPDATE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // pgm.sql('DROP TRIGGER IF EXISTS set_timestamp_providers ON providers;'); // Trigger depends on table
  // pgm.sql('DROP FUNCTION IF EXISTS trigger_set_timestamp CASCADE;'); // Function might be shared
  // It's safer to drop table first, then specific trigger if not auto-dropped, then function if exclusively used.

  pgm.dropTable('providers', { ifExists: true, cascade: true }); // cascade will drop dependent objects like triggers on this table

  // The trigger function might be used by other tables, so only drop if not.
  // For simplicity here, we assume it's mainly for providers or other new tables with this pattern.
  // If it's truly generic, it might live in its own migration or be managed separately.
  // pgm.sql('DROP FUNCTION IF EXISTS trigger_set_timestamp();'); // CASCADE was too broad if shared

  // Explicitly remove from pgmigrations if node-pg-migrate doesn't handle errors well
  // However, this is typically handled by node-pg-migrate itself upon successful down execution.
  // Adding it here can be a failsafe if transactions aren't managed as expected during errors.
  // pgm.sql(`DELETE FROM "public"."pgmigrations" WHERE name='1747600405113_create-providers-table';`);

  // Simpler down: let node-pg-migrate manage the pgmigrations table record upon successful completion of this block.
  // If dropTable fails, node-pg-migrate should ideally not remove the record.
};
