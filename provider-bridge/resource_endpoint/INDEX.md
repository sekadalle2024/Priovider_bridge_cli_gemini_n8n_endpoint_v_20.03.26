# 📚 Provider Bridge — Index de Documentation

Guide de navigation pour toute la documentation du projet Provider Bridge.

---

## 🚀 Démarrage

| Document | Description | Pour qui ? |
|----------|-------------|------------|
| [REPONSE_RAPIDE.md](./REPONSE_RAPIDE.md) | ⚡ Réponses aux questions fréquentes | Tous (START HERE!) |
| [COMMENT_LANCER.md](./COMMENT_LANCER.md) | Guide complet de lancement | Débutants |
| [QUICK_START.md](./QUICK_START.md) | Guide de démarrage en 5 minutes | Débutants |
| [README.md](./README.md) | Documentation complète du projet | Tous |
| [TASK_8_COMPLETE.md](./TASK_8_COMPLETE.md) | Résumé de la Task 8 | Équipe projet |

---

## 🔗 Endpoints & API

| Document | Description | Pour qui ? |
|----------|-------------|------------|
| [N8N_BASE_URLS.md](./N8N_BASE_URLS.md) | ⚡ URLs base pour n8n | Utilisateurs n8n |
| [ENDPOINTS_SUMMARY.md](./ENDPOINTS_SUMMARY.md) | Résumé de tous les endpoints | Développeurs |
| [Integration micro service n8n](./Integration%20micro%20service%20n8n/README.md) | 🚀 Guide complet d'intégration n8n | Micro-services / Frontend |
| [Swagger UI](http://localhost:25809/docs) | Documentation interactive | Tous |

---

## 🛠️ Configuration

| Fichier | Description |
|---------|-------------|
| [.env](./.env) | Variables d'environnement (13 clés API configurées) |
| [.env.example](./.env.example) | Template de configuration |
| [package.json](./package.json) | Dépendances et scripts npm |
| [START.bat](./START.bat) | Script de lancement Windows (dev) |
| [START-PROD.bat](./START-PROD.bat) | Script de lancement Windows (prod) |
| [TEST.bat](./TEST.bat) | Script de test Windows |

---

## 📂 Structure du projet

```
provider-bridge/
├── src/
│   ├── server.ts              # Point d'entrée Express
│   ├── routes/
│   │   ├── cli-openai.routes.ts    # Endpoints Gemini CLI OAuth
│   │   ├── provider.routes.ts      # Endpoints providers
│   │   ├── auth.routes.ts          # Authentification
│   │   └── admin.routes.ts         # Administration
│   ├── services/
│   │   ├── gemini-cli.service.ts   # Service Gemini CLI
│   │   ├── api-key-rotation.service.ts  # Rotation des clés API
│   │   └── stats.service.ts        # Statistiques
│   ├── database/               # SQLite (better-sqlite3)
│   ├── auth/                   # JWT + Google OAuth
│   └── swagger/                # OpenAPI 3.0 spec
├── public/                     # Frontend SPA
├── scripts/
│   ├── start.sh                # Script de démarrage (Linux/Mac)
│   ├── test-gemini-cli-openai.js   # Tests automatisés
│   └── test-all.js             # Suite de tests complète
├── netlify/                    # Netlify Functions
├── dist/                       # Build TypeScript
└── docs/                       # Documentation
```

---

## 🤖 Providers disponibles

### 1. Gemini CLI OAuth

**Base URL** : `http://localhost:25809/cli`

**Endpoints** :
- `GET /cli/models`
- `POST /cli/chat/completions`
- `GET /cli/v1/models`
- `POST /cli/v1/chat/completions`

**Documentation** : [GEMINI_CLI_OPENAI_ENDPOINTS.md](./GEMINI_CLI_OPENAI_ENDPOINTS.md)

**Avantages** :
- ✅ Gratuit (OAuth Google)
- ✅ Quota généreux
- ✅ Aucune clé API consommée

---

### 2. Gemini API Key Rotative

**Base URL** : `http://localhost:25809`

**Endpoints** :
- `GET /v1/models`
- `POST /v1/chat/completions`
- `GET /api/providers/gemini_api_key_rotative/stats`

**Configuration** : 13 clés dans `.env`

**Avantages** :
- ✅ 195 req/min (13 × 15)
- ✅ Rotation automatique
- ✅ Production ready

---

### 3. Kiro CLI

**Endpoints** :
- `POST /api/providers/kiro_cli/chat`

---

### 4. N8N Processor (Advanced)

**Endpoints** :
- `POST /api/providers/n8n/processor`

**Avantages** :
- ✅ 15 scénarios de routage (CIA, Document, etc.)
- ✅ Traitement automatique des réponses
- ✅ Support des marqueurs d'accordéon (Frontend)

**Documentation** : [Integration micro service n8n](./Integration%20micro%20service%20n8n/README.md)

---

## 🧪 Tests

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm run build` | Build TypeScript |
| `npm start` | Démarrer en production |
| `npm test` | Tests automatisés |
| `node scripts/test-gemini-cli-openai.js` | Tester Gemini CLI endpoints |

---

## 🔧 Intégration n8n

### Configuration rapide

1. **Créer credentials OpenAI** dans n8n
2. **Choisir une base URL** :
   - Gemini CLI : `http://localhost:25809/cli`
   - API Key Rotative : `http://localhost:25809`
3. **API Key** : `dummy` (requis mais non utilisé)
4. **Utiliser le nœud** : OpenAI Chat Model

### Exemples de workflows

Consultez le dossier `examples/` pour des workflows n8n prêts à l'emploi.

---

## 📊 Monitoring

### Dashboard Admin

**URL** : http://localhost:25809  
**Login** : admin / admin123

**Fonctionnalités** :
- Statistiques d'utilisation
- Gestion des utilisateurs
- Logs en temps réel

### Health Check

```bash
curl http://localhost:25809/health
```

### Statistiques API Key Rotative

```bash
curl http://localhost:25809/api/providers/gemini_api_key_rotative/stats
```

### Status Gemini CLI

```bash
curl http://localhost:25809/api/providers/gemini_cli/status
```

---

## 🐛 Dépannage

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Port 25809 occupé | `lsof -ti:25809 \| xargs kill -9` (Mac/Linux)<br>`taskkill /F /PID <PID>` (Windows) |
| Gemini CLI not found | `npm install -g @google/gemini-cli` |
| OAuth credentials not found | `gemini auth login` |
| API key rate limited | Attendez 1 minute (rotation automatique) |

### Logs

```bash
# Logs en temps réel
tail -f provider-bridge/server.log

# Logs du processus
npm run dev
```

---

## ☁️ Déploiement

### Netlify

```bash
npm run build
npx netlify deploy --prod
```

### Vercel

```bash
npx vercel --prod
```

**Configuration** : Voir [netlify.toml](./netlify.toml) et [vercel.json](./vercel.json)

---

## 📖 Ressources externes

| Ressource | URL |
|-----------|-----|
| **Gemini CLI Official** | https://github.com/google/generative-ai-cli |
| **OpenAI API Docs** | https://platform.openai.com/docs/api-reference |
| **n8n Documentation** | https://docs.n8n.io |
| **Express.js** | https://expressjs.com |
| **TypeScript** | https://www.typescriptlang.org |

---

## 🔗 Liens rapides

| Ressource | URL |
|-----------|-----|
| **Serveur local** | http://localhost:25809 |
| **Swagger UI** | http://localhost:25809/docs |
| **OpenAPI JSON** | http://localhost:25809/openapi.json |
| **Dashboard Admin** | http://localhost:25809 |
| **Health Check** | http://localhost:25809/health |

---

## 📝 Changelog

### Version 1.0.0 (Mars 2026)

✅ **Ajouté** :
- Endpoints OpenAI-compatibles pour Gemini CLI (`/cli/chat/completions`)
- Endpoints `/v1/models` et `/v1/chat/completions` pour Gemini CLI
- Documentation complète (GEMINI_CLI_OPENAI_ENDPOINTS.md)
- Script de test automatisé (test-gemini-cli-openai.js)
- Guide de démarrage rapide (QUICK_START.md)
- Résumé des endpoints (ENDPOINTS_SUMMARY.md)

✅ **Amélioré** :
- README.md avec sections Gemini CLI
- Support hot-reload en développement
- Gestion des erreurs améliorée

---

## 💡 Conseils

- **Développement** : Utilisez Gemini CLI OAuth (gratuit)
- **Production** : Utilisez Gemini API Key Rotative (195 req/min)
- **Monitoring** : Consultez `/api/providers/gemini_api_key_rotative/stats`
- **Sécurité** : Changez le mot de passe admin dans `.env`

---

## 🤝 Support

- **Issues** : Ouvrez une issue sur GitHub
- **Documentation** : Consultez les fichiers .md dans ce dossier
- **Swagger UI** : http://localhost:25809/docs

---

**Dernière mise à jour** : Mars 2026  
**Version** : 1.0.0  
**Status** : ✅ Production Ready
