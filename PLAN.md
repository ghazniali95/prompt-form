# Prompt Form — Shopify App Build Plan

## Overview

An AI-powered form builder Shopify app where merchants create interactive forms, multi-step flows, validations, and styling entirely through natural language prompts. Forms can be embedded in the Shopify Admin and displayed on the storefront via Theme App Extensions.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend | Laravel 11 | API server, Shopify OAuth, AI pipeline |
| Admin Frontend | React + Shopify Polaris | Required for Built for Shopify (BfS) |
| SPA Frontend | React + Inertia.js + Ant Design | For future WooCommerce / general use |
| Storefront Widget | React (lightweight bundle) | Rendered via Theme App Extension |
| Database | MySQL 8+ | JSON columns for schema storage |
| Queue | Laravel Horizon + Redis | Async AI prompt processing |
| AI | OpenAI GPT-4o (structured outputs) | Prompt → JSON schema |
| Dev Tooling | Shopify CLI | Local tunnel, extension deployment |

---

## GitHub Repo Structure

**Single monorepo — recommended.**

Shopify CLI expects extensions to live alongside the app code. Splitting into multiple repos adds sync overhead with no real benefit at this stage.

```
prompt-form/                        # Single GitHub repo
├── app/                            # Laravel application code
├── bootstrap/
├── config/
├── database/
│   └── migrations/
├── routes/
│   ├── api.php                     # Shopify admin API + public storefront API
│   └── web.php                     # Inertia SPA routes
├── resources/
│   └── js/
│       ├── shopify/                # React + Polaris (Shopify Admin app)
│       └── inertia/                # React + Inertia + Ant Design (SPA)
├── extensions/
│   └── form-block/                 # Theme App Extension (storefront widget)
│       ├── blocks/
│       │   └── form.liquid
│       ├── assets/
│       │   └── form-widget.js      # Lightweight React renderer bundle
│       └── shopify.extension.toml
├── shopify.app.toml                # Shopify CLI app config
├── vite.config.js
├── package.json
└── composer.json
```

---

## Key Laravel Packages

| Package | Purpose |
|---|---|
| `osiset/laravel-shopify` | Shopify OAuth, webhooks, billing, API wrapper |
| `openai-php/laravel` | OpenAI API integration |
| `spatie/laravel-data` | Typed DTOs for form schema validation and casting |
| `laravel/sanctum` | API auth for Inertia SPA |
| `laravel/horizon` | Queue monitoring dashboard |
| `laravel/telescope` | Dev debugging (dev only) |
| `spatie/laravel-activitylog` | Audit trail for form edits and AI generations |
| `spatie/laravel-permission` | Roles/permissions (future multi-user) |

## Key Frontend Packages

### Shopify Admin (React + Polaris)
| Package | Purpose |
|---|---|
| `@shopify/polaris` | UI components (BfS required) |
| `@shopify/app-bridge-react` | Embeds app in Shopify Admin, handles session tokens |
| `@shopify/polaris-icons` | Icon set |
| `@dnd-kit/core` | Drag to reorder form fields |
| `react-hook-form` | Form builder internal state |
| `zustand` | Global state for schema being built |
| `axios` | API calls to Laravel |

### Inertia SPA (React + Inertia + Ant Design)
| Package | Purpose |
|---|---|
| `@inertiajs/react` | Inertia client |
| `antd` | UI component library |
| `react-hook-form` | Shared with Shopify app |

---

## Database Schema

### `shops`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| shopify_domain | varchar | e.g. mystore.myshopify.com |
| access_token | varchar (encrypted) | Shopify OAuth token |
| plan | varchar | free / pro / enterprise |
| plan_charge_id | varchar | Shopify Billing API charge ID |
| is_active | boolean | |
| installed_at | timestamp | |
| created_at / updated_at | timestamps | |

### `forms`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| shop_id | FK → shops | |
| ulid | varchar | Public-facing ID (safe for storefront API) |
| title | varchar | Merchant-given name |
| schema | json | Full form field definitions |
| styles | json | Colors, fonts, layout |
| steps | json | Multi-step config |
| settings | json | Submit button text, success message, redirect URL |
| is_published | boolean | |
| created_at / updated_at | timestamps | |

### `form_responses`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| form_id | FK → forms | |
| shop_id | FK → shops | |
| data | json | Submitted field values |
| metadata | json | IP (hashed), user agent, referrer URL |
| submitted_at | timestamp | |

### `ai_generations`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| shop_id | FK → shops | |
| form_id | FK → forms (nullable) | |
| prompt | text | User's original prompt |
| generated_schema | json | What the AI returned |
| model | varchar | e.g. gpt-4o |
| tokens_used | int | For usage tracking |
| status | enum | pending / success / failed |
| created_at | timestamp | |

### `form_versions`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| form_id | FK → forms | |
| schema | json | Snapshot at time of save |
| styles | json | |
| steps | json | |
| created_at | timestamp | Version history |

---

## API Routes

### Shopify Admin API (authenticated via session token)
```
POST   /api/shopify/forms                    # Create form
GET    /api/shopify/forms                    # List forms
GET    /api/shopify/forms/{id}               # Get single form
PUT    /api/shopify/forms/{id}               # Update form
DELETE /api/shopify/forms/{id}               # Delete form
POST   /api/shopify/forms/{id}/publish       # Publish form
GET    /api/shopify/forms/{id}/responses     # Get responses
POST   /api/shopify/ai/generate              # Send prompt, get schema back
POST   /api/shopify/ai/refine                # Refine existing schema with new prompt
```

### Public Storefront API (no auth, rate limited)
```
GET    /api/public/forms/{ulid}              # Fetch form schema for storefront widget
POST   /api/public/forms/{ulid}/submit       # Submit form response
```

---

## AI Prompt Pipeline

```
User types prompt
      │
      ▼
Laravel queues AI job (async)
      │
      ▼
AIFormService sends to OpenAI
  - System prompt: defines schema format + constraints
  - User prompt: merchant's input
  - Structured outputs: enforces valid JSON
      │
      ▼
Response validated via spatie/laravel-data DTO
      │
      ▼
Schema returned to frontend
      │
      ▼
User sees live preview, can refine via follow-up prompts
      │
      ▼
User saves → stored in forms.schema
```

### Form Schema Format (JSON)
```json
{
  "fields": [
    {
      "id": "field_1",
      "type": "text",
      "label": "Full Name",
      "placeholder": "Enter your name",
      "required": true,
      "validations": { "minLength": 2, "maxLength": 100 }
    },
    {
      "id": "field_2",
      "type": "email",
      "label": "Email Address",
      "required": true
    },
    {
      "id": "field_3",
      "type": "select",
      "label": "Topic",
      "options": ["General", "Support", "Sales"]
    }
  ],
  "steps": [
    { "title": "Contact Info", "fields": ["field_1", "field_2"] },
    { "title": "Your Message", "fields": ["field_3"] }
  ],
  "styles": {
    "primaryColor": "#5C6AC4",
    "borderRadius": "8px",
    "fontFamily": "sans-serif"
  },
  "settings": {
    "submitButtonText": "Send Message",
    "successMessage": "Thank you! We'll be in touch soon.",
    "redirectUrl": null
  }
}
```

---

## Storefront Integration (Theme App Extension)

### How it works
1. Merchant enables your app block in Shopify Theme Editor
2. Shopify injects `form.liquid` into the theme page
3. The liquid block loads `form-widget.js` from your extension assets
4. `form-widget.js` reads `data-form-id` attribute, fetches schema from public API
5. Renders the form as a React widget on the storefront

### form.liquid
```liquid
<div
  id="prompt-form-{{ block.id }}"
  data-form-id="{{ block.settings.form_id }}"
  data-api-base="{{ block.settings.api_base_url }}">
</div>
<script src="{{ 'form-widget.js' | asset_url }}" defer></script>

{% schema %}
{
  "name": "Prompt Form",
  "target": "section",
  "settings": [
    { "type": "text", "id": "form_id", "label": "Form ID" },
    { "type": "text", "id": "api_base_url", "label": "API Base URL" }
  ]
}
{% endschema %}
```

### CORS (Laravel)
```php
// config/cors.php
'allowed_origins' => ['*.myshopify.com', '*.shopify.com'],
'allowed_methods' => ['GET', 'POST'],
```

---

## Build Phases

### Phase 1 — Foundation
- [ ] Laravel project setup
- [ ] MySQL database, migrations for all tables
- [ ] `osiset/laravel-shopify` setup — OAuth, webhooks, GDPR webhooks
- [ ] Shopify CLI setup + `shopify.app.toml`
- [ ] React + Polaris basic shell (App Bridge, routing)
- [ ] Vite config for dual frontend build (shopify + inertia)

### Phase 2 — AI Form Builder Core
- [ ] `openai-php/laravel` setup
- [ ] Define form JSON schema spec
- [ ] `AIFormService` — prompt → structured JSON schema
- [ ] `spatie/laravel-data` DTO for schema validation
- [ ] Queue + Horizon setup for async AI jobs
- [ ] Prompt input UI in Polaris
- [ ] Live form preview renderer (React component, shared)
- [ ] Refine prompt (follow-up prompt updates schema)

### Phase 3 — Form Management
- [ ] Form CRUD (create, list, edit, delete, publish)
- [ ] Form version history
- [ ] Form settings UI (submit text, success message, redirect)
- [ ] Style editor UI in Polaris

### Phase 4 — Storefront Widget
- [ ] Theme App Extension setup (Shopify CLI)
- [ ] `form.liquid` block with settings
- [ ] `form-widget.js` — lightweight React renderer bundle
- [ ] Public API endpoints with rate limiting + CORS
- [ ] Form submission storage

### Phase 5 — Responses & Analytics
- [ ] Response list view per form in Polaris
- [ ] CSV export of responses
- [ ] Basic analytics (views, submissions, completion rate)

### Phase 6 — BfS Compliance & Billing
- [ ] Shopify Billing API — subscription plans
- [ ] AI prompt usage limits per plan tier
- [ ] Mandatory GDPR webhooks (already scaffolded by osiset)
- [ ] Performance review
- [ ] Shopify app review submission

---

## Environment Variables Needed

```env
# Shopify
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=prompt_form
DB_USERNAME=
DB_PASSWORD=

# Redis (Queues)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## Notes

- Use `ulid` (not `id`) for public-facing form identifiers in storefront API — prevents enumeration
- AI generation is always async via queue — never block the HTTP request
- Shared React `FormRenderer` component used in both Polaris admin preview and storefront widget — build it once
- Form versions saved automatically on every publish — not on every edit
- For now: Shopify only. WooCommerce uses same Laravel API + Inertia SPA frontend (Phase 7+)
