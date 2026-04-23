import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260422034620 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "agent_config" ("id" text not null, "name" text not null default 'Byteshop Assistant', "tone" text not null default 'friendly and helpful', "system_prompt" text null, "restrictions" jsonb null, "one_click_require_confirm" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "agent_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_agent_config_deleted_at" ON "agent_config" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "agent_faq" ("id" text not null, "question" text not null, "answer" text not null, "order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "agent_faq_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_agent_faq_deleted_at" ON "agent_faq" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "agent_knowledge_entry" ("id" text not null, "title" text not null, "content" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "agent_knowledge_entry_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_agent_knowledge_entry_deleted_at" ON "agent_knowledge_entry" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "agent_product_note" ("id" text not null, "product_id" text not null, "note" text null, "recommend_enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "agent_product_note_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_agent_product_note_deleted_at" ON "agent_product_note" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "agent_visual_category" ("id" text not null, "category_handle" text not null, "upload_type" text not null, "upload_prompt" text not null, "prompt_hint" text null, "seedream_model" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "agent_visual_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_agent_visual_category_deleted_at" ON "agent_visual_category" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "agent_config" cascade;`);

    this.addSql(`drop table if exists "agent_faq" cascade;`);

    this.addSql(`drop table if exists "agent_knowledge_entry" cascade;`);

    this.addSql(`drop table if exists "agent_product_note" cascade;`);

    this.addSql(`drop table if exists "agent_visual_category" cascade;`);
  }

}
