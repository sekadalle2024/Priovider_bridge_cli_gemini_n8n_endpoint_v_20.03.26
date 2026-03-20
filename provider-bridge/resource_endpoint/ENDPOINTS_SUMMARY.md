# 📡 Provider Bridge — Résumé des Endpoints

Ce document liste tous les endpoints disponibles dans le serveur Provider Bridge.

---

## 🌐 Serveur

**URL de base** : 
- Local : `http://localhost:25809`
- Production : `https://providerbridge.netlify.app`

**Status** : ✅ En cours d'exécution

---

## 🔗 Endpoints OpenAI-Compatible

### 1️⃣ Gemini API Key Rotative (13 clés actives)

**Base URL pour n8n/LangChain** : `http://localhost:25809`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/v1/models` | Liste des modèles disponibles |
| POST | `/v1/chat/completions` | Chat avec rotation automatique des clés API |
| GET | `/api/providers/gemini_api_key_rotative/stats` | Statistiques d'utilisation des clés |

**Capacité** : 195 req/min (13 clés × 15 req/min)

**Exemple curl** :
```bash
curl -X POST http://localhost:25809/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Bonjour!"}]
  }'
```

---

### 2️⃣ Gemini CLI OAuth (Nouveau !)

**Base URL pour n8n/LangChain** : `http://localhost:25809/cli`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/cli/models` | Liste des modèles Gemini CLI |
| POST | `/cli/chat/completions` | Chat via Gemini CLI OAuth |
| GET | `/cli/v1/models` | Alias OpenAI standard |
| POST | `/cli/v1/chat/completions` | Alias OpenAI standard |

**Avantages** :
- ✅ Gratuit (utilise OAuth Google)
- ✅ Aucune clé API consommée
- ✅ Quota OAuth généreux
- ✅ Accès aux derniers modèles Gemini

**Exemple curl** :
```bash
curl -X POST http://localhost:25809/cli/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-pro",
    "messages": [{"role": "user", "content": "Bonjour!"}]
  }'
```

**Prérequis** :
```bash
# Installer Gemini CLI
npm install -g @google/gemini-cli

# S'authentifier avec Google
gemini auth login
```

---

### 3️⃣ Kiro CLI

**Base URL** : `http://localhost:25809/api/providers/kiro_cli`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/providers/kiro_cli/chat` | Chat via Kiro CLI |

---

### 4️⃣ N8N Processor (Advanced Router)

**Base URL** : `http://localhost:25809/api/providers/n8n/processor`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/providers/n8n/processor` | Routage intelligent vers n8n (15 cas) |

**Fonctionnement** :
- Le serveur analyse le message pour déterminer le webhook n8n approprié.
- Les réponses sont formatées avec des marqueurs pour le frontend (`__CIA_ACCORDION__`, etc.).

**Exemple curl** :
```bash
curl -X POST http://localhost:25809/api/providers/n8n/processor \
  -H "Content-Type: application/json" \
  -d '{"message": "CIA Cours on auditing"}'
```

---

## 🎛️ Endpoints Admin

### Dashboard

**URL** : `http://localhost:25809`

**Login par défaut** :
- Username : `admin`
- Password : `admin123`

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion avec email/password |
| GET | `/api/auth/google` | Connexion OAuth Google |
| POST | `/api/auth/logout` | Déconnexion |

### Administration

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/users` | Liste des utilisateurs |
| GET | `/api/admin/stats` | Statistiques globales |
| DELETE | `/api/admin/users/:id` | Supprimer un utilisateur |

---

## 📚 Documentation

| URL | Description |
|-----|-------------|
| `http://localhost:25809/docs` | Interface Swagger UI interactive |
| `http://localhost:25809/openapi.json` | Spécification OpenAPI 3.0 |
| `http://localhost:25809/health` | Health check du serveur |

---

## 🧪 Tests

### Tester tous les endpoints

```bash
cd provider-bridge
node scripts/test-gemini-cli-openai.js
```

### Tester un endpoint spécifique

```bash
# Health check
curl http://localhost:25809/health

# Liste des modèles (API Key Rotative)
curl http://localhost:25809/v1/models

# Liste des modèles (Gemini CLI)
curl http://localhost:25809/cli/models

# Status Gemini CLI
curl http://localhost:25809/api/providers/gemini_cli/status

# Stats API Key Rotative
curl http://localhost:25809/api/providers/gemini_api_key_rotative/stats
```

---

## 🔧 Configuration n8n

### Option 1 : Gemini API Key Rotative (Recommandé pour production)

1. Dans n8n, créez des credentials **OpenAI**
2. Configurez :
   - **API Key** : `dummy` (non utilisé)
   - **Base URL** : `http://localhost:25809`
3. Utilisez le nœud **OpenAI Chat Model**

**Avantages** :
- 195 req/min de capacité
- Rotation automatique des clés
- Pas besoin d'authentification OAuth

### Option 2 : Gemini CLI OAuth (Gratuit, quota généreux)

1. Dans n8n, créez des credentials **OpenAI**
2. Configurez :
   - **API Key** : `dummy` (non utilisé)
   - **Base URL** : `http://localhost:25809/cli`
3. Utilisez le nœud **OpenAI Chat Model**

**Avantages** :
- Complètement gratuit
- Aucune clé API consommée
- Quota OAuth plus élevé

---

## 📊 Comparaison des Providers

| Provider | Authentification | Coût | Quota | Modèles |
|----------|------------------|------|-------|---------|
| **Gemini API Key Rotative** | 13 clés API | Gratuit (tier free) | 195 req/min | Tous Gemini |
| **Gemini CLI OAuth** | Google OAuth | Gratuit | Quota OAuth | Tous Gemini |
| **Kiro CLI** | Kiro credentials | Variable | Variable | Kiro models |

---

## 🚀 Commandes utiles

```bash
# Démarrer le serveur (dev mode avec hot-reload)
cd provider-bridge
npm run dev

# Démarrer en production
npm run build
npm start

# Démarrer avec accès remote
npm start -- --remote

# Tester les endpoints
node scripts/test-gemini-cli-openai.js

# Vérifier les logs
tail -f provider-bridge/server.log
```

---

## 📖 Documentation détaillée

- [README Provider Bridge](./README.md)
- [Gemini CLI OpenAI Endpoints](./GEMINI_CLI_OPENAI_ENDPOINTS.md)
- [Swagger UI](http://localhost:25809/docs)

---

**Dernière mise à jour** : Mars 2026  
**Version** : 1.0.0  
**Status** : ✅ Production Ready
