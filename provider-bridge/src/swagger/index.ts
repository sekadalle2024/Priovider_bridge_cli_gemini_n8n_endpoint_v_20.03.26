/**
 * Provider Bridge — Swagger/OpenAPI Specification
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Provider Bridge Endpoint',
    version: '1.0.0',
    description: `
# Provider Bridge API

Centralized API gateway for **Gemini CLI**, **Gemini API Key Rotative**, and **Kiro CLI**.

## Providers

| Provider | Description | Auth |
|----------|-------------|------|
| \`gemini_cli\` | Google Gemini via CLI | Google OAuth |
| \`gemini_api_key_rotative\` | Gemini API with key rotation | API Keys in .env |
| \`kiro_cli\` | Amazon Kiro via CLI | CLI auth |
| \`n8n_processor\` | Advanced N8N router | Internal / Optional Auth |

## OpenAI-Compatible — API Key Rotation

Base URL n8n : \`http://127.0.0.1:25809/v1\`

| Endpoint | Description |
|----------|-------------|
| \`GET  /v1/models\` | Liste des modèles disponibles |
| \`POST /v1/chat/completions\` | Chat via API Key Rotation (13 clés, 195 req/min) |

## OpenAI-Compatible — Gemini CLI (OAuth)

Base URL n8n : \`http://127.0.0.1:25809/cli\`

| Endpoint | Description |
|----------|-------------|
| \`GET  /cli/models\` | Liste des modèles disponibles |
| \`POST /cli/chat/completions\` | Chat via Gemini CLI OAuth (aucune clé API consommée) |

## Modèles disponibles

\`gemini-3-flash\` · \`gemini-3-pro\` · \`gemini-2.5-flash\` · \`gemini-2.5-pro\` · \`gemini-2.5-flash-lite\` · \`gemini-2.0-flash\` · \`gemini-1.5-flash\` · \`gemini-1.5-pro\` · \`gemini-exp-1206\`
    `,
    contact: {
      name: 'AionUi',
      url: 'https://github.com/iOfficeAI/AionUi',
    },
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Admin', description: 'Admin dashboard endpoints' },
    { name: 'Gemini CLI', description: 'Gemini CLI provider' },
    { name: 'Gemini API Key', description: 'Gemini API Key Rotative' },
    { name: 'Kiro CLI', description: 'Kiro CLI provider' },
    { name: 'N8N Processor', description: 'Advanced N8N router with 15 processing cases' },
    { name: 'OpenAI Compatible — API Key', description: 'OpenAI-compatible endpoints → Gemini API Key Rotation (base URL: http://127.0.0.1:25809/v1)' },
    { name: 'OpenAI Compatible — CLI', description: 'OpenAI-compatible endpoints → Gemini CLI OAuth, no API key consumed (base URL: http://127.0.0.1:25809/cli)' },
    { name: 'Common', description: 'Common endpoints' },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful, returns JWT token' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/google': {
      get: {
        tags: ['Auth'],
        summary: 'Initiate Google OAuth login',
        description: 'Redirects to Google OAuth consent page',
        responses: { '302': { description: 'Redirect to Google' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user info',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'User info' } },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Users list with stats' } },
      },
    },
    '/api/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'User deleted' } },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Aggregated usage statistics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Stats overview' } },
      },
    },
    '/api/providers/gemini_cli/chat': {
      post: {
        tags: ['Gemini CLI'],
        summary: 'Chat with Gemini CLI',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatRequest' },
            },
          },
        },
        responses: { '200': { description: 'Chat response' } },
      },
    },
    '/api/providers/gemini_api_key_rotative/chat': {
      post: {
        tags: ['Gemini API Key'],
        summary: 'Chat with Gemini (API Key Rotation)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatRequest' },
            },
          },
        },
        responses: { '200': { description: 'Chat response with key info' } },
      },
    },
    '/api/providers/gemini_api_key_rotative/stats': {
      get: {
        tags: ['Gemini API Key'],
        summary: 'API key rotation statistics',
        responses: { '200': { description: 'Key usage stats' } },
      },
    },
    '/api/providers/kiro_cli/chat': {
      post: {
        tags: ['Kiro CLI'],
        summary: 'Chat with Kiro CLI',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatRequest' },
            },
          },
        },
        responses: { '200': { description: 'Chat response' } },
      },
    },
    '/api/providers/n8n/processor': {
      post: {
        tags: ['N8N Processor'],
        summary: 'Process message via n8n router (15 cases)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: "- [Command] = Programme de travail\n- [Processus] = inventaire de caisse\n- [Nb de lignes] = 25" },
                  options: {
                    type: 'object',
                    properties: {
                      timeout: { type: 'integer', example: 660000 }
                    }
                  }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Processed response with markers' } }
      }
    },
    '/v1/models': {
      get: {
        tags: ['OpenAI Compatible — API Key'],
        summary: 'List available models — API Key Rotation',
        description: 'Returns the list of Gemini models available via API Key Rotation.\n\n**n8n base URL:** `http://127.0.0.1:25809/v1`',
        responses: {
          '200': {
            description: 'OpenAI-format model list',
            content: {
              'application/json': {
                example: {
                  object: 'list',
                  data: [
                    { id: 'gemini-2.5-flash', object: 'model', created: 1677610602, owned_by: 'google' },
                    { id: 'gemini-2.5-pro', object: 'model', created: 1677610602, owned_by: 'google' },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/v1/chat/completions': {
      post: {
        tags: ['OpenAI Compatible — API Key'],
        summary: 'Chat completions — API Key Rotation',
        description: 'OpenAI-compatible chat endpoint routing to **Gemini API Key Rotation** (13 keys, 195 req/min).\n\nUse with n8n base URL `http://127.0.0.1:25809/v1`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OpenAIChatRequest' },
              example: {
                model: 'gemini-2.5-flash',
                messages: [{ role: 'user', content: 'Bonjour!' }],
                temperature: 0.7,
                max_tokens: 1024,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OpenAI-format chat completion',
            content: {
              'application/json': {
                example: {
                  id: 'chatcmpl-1234567890',
                  object: 'chat.completion',
                  created: 1677610602,
                  model: 'gemini-2.5-flash',
                  choices: [{ index: 0, message: { role: 'assistant', content: 'Bonjour! Comment puis-je vous aider?' }, finish_reason: 'stop' }],
                  usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                },
              },
            },
          },
          '400': { description: 'Missing or invalid messages' },
          '500': { description: 'API error' },
        },
      },
    },
    '/cli/models': {
      get: {
        tags: ['OpenAI Compatible — CLI'],
        summary: 'List available models — Gemini CLI (OAuth)',
        description: 'Returns the list of Gemini models available via Gemini CLI OAuth.\n\n**n8n base URL:** `http://127.0.0.1:25809/cli`\n\nAucune clé API consommée — utilise votre compte Google OAuth.',
        responses: {
          '200': {
            description: 'OpenAI-format model list',
            content: {
              'application/json': {
                example: {
                  object: 'list',
                  data: [
                    { id: 'gemini-2.5-pro', object: 'model', created: 1677610602, owned_by: 'google', description: 'Gemini 2.5 Pro — Gemini CLI OAuth (no API key consumed)' },
                    { id: 'gemini-2.5-flash', object: 'model', created: 1677610602, owned_by: 'google', description: 'Gemini 2.5 Flash — Gemini CLI OAuth (no API key consumed)' },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/cli/chat/completions': {
      post: {
        tags: ['OpenAI Compatible — CLI'],
        summary: 'Chat completions — Gemini CLI (OAuth)',
        description: "OpenAI-compatible chat endpoint routing to **Gemini CLI (OAuth)**.\n\n- Aucune clé API consommée\n- Utilise votre compte Google OAuth\n- Délai plus long que l'API Key (~30–90s)\n\nUse with n8n base URL `http://127.0.0.1:25809/cli`.",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OpenAIChatRequest' },
              example: {
                model: 'gemini-2.5-pro',
                messages: [{ role: 'user', content: 'Bonjour!' }],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OpenAI-format chat completion',
            content: {
              'application/json': {
                example: {
                  id: 'chatcmpl-cli-1234567890',
                  object: 'chat.completion',
                  created: 1677610602,
                  model: 'gemini-2.5-pro',
                  choices: [{ index: 0, message: { role: 'assistant', content: 'Bonjour! Comment puis-je vous aider?' }, finish_reason: 'stop' }],
                  usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                },
              },
            },
          },
          '400': { description: 'Missing or invalid messages' },
          '500': { description: 'Gemini CLI error (check OAuth credentials)' },
        },
      },
    },
    '/api/providers': {
      get: {
        tags: ['Common'],
        summary: 'List all providers and their status',
        responses: { '200': { description: 'Providers with availability' } },
      },
    },
    '/api/version': {
      get: {
        tags: ['Common'],
        summary: 'API version info',
        responses: { '200': { description: 'Version info' } },
      },
    },
    '/health': {
      get: {
        tags: ['Common'],
        summary: 'Health check',
        responses: { '200': { description: 'Server is healthy' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ChatRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            description: 'Conversation history',
            items: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: { type: 'string', enum: ['user', 'assistant', 'system'], example: 'user' },
                content: { type: 'string', example: 'Bonjour!' },
              },
            },
            example: [{ role: 'user', content: 'Bonjour!' }],
          },
          model: {
            type: 'string',
            example: 'gemini-2.5-flash',
            default: 'gemini-2.5-flash',
            enum: ['gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-exp-1206'],
          },
          options: {
            type: 'object',
            description: 'Optional generation parameters',
            properties: {
              temperature: {
                type: 'number',
                minimum: 0,
                maximum: 2,
                default: 0.7,
                example: 0.7,
                description: 'Sampling temperature (0 = deterministic, 2 = very creative)',
              },
              max_tokens: {
                type: 'integer',
                minimum: 1,
                maximum: 8192,
                default: 1024,
                example: 1024,
                description: 'Maximum number of tokens to generate (must be >= 1)',
              },
            },
            example: { temperature: 0.7, max_tokens: 1024 },
          },
        },
      },
      OpenAIChatRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            description: 'Conversation history',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                content: { type: 'string' },
              },
            },
            example: [{ role: 'user', content: 'Bonjour!' }],
          },
          model: {
            type: 'string',
            default: 'gemini-2.5-flash',
            example: 'gemini-2.5-flash',
            enum: ['gemini-3-flash', 'gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-exp-1206'],
          },
          temperature: {
            type: 'number',
            minimum: 0,
            maximum: 2,
            default: 0.7,
            example: 0.7,
            description: 'Sampling temperature (0 = deterministic, 2 = very creative)',
          },
          max_tokens: {
            type: 'integer',
            minimum: 1,
            maximum: 8192,
            default: 1024,
            example: 1024,
            description: 'Maximum number of tokens to generate (must be >= 1)',
          },
        },
        example: {
          model: 'gemini-2.5-flash',
          messages: [{ role: 'user', content: 'Bonjour!' }],
          temperature: 0.7,
          max_tokens: 1024,
        },
      },
    },
  },
};

/**
 * Generate Swagger UI HTML page
 */
export function getSwaggerHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Provider Bridge — API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    body { margin: 0; background: #1a1a2e; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
    });
  </script>
</body>
</html>`;
}
