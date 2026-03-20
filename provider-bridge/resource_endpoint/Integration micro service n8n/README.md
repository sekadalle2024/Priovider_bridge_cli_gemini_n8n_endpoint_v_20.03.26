# 🚀 Guide d'Intégration Micro-service n8n

Ce dossier contient la documentation détaillée du micro-service **N8N Processor**, intégré au Provider Bridge. Ce service agit comme un "Smart Router" entre vos applications front-end et vos workflows n8n.

## 📁 Sommaire

1.  **[Architecture](./ARCHITECTURE.md)** : Conception technique et flux de données.
2.  **[Fonctionnement](./FUNCTIONING.md)** : Détail des 15 scénarios de routage et des marqueurs.
3.  **[Guide d'Intégration Front-end](./FRONTEND_GUIDE.md)** : Comment consommer l'API depuis vos applications.
4.  **[Gestion des Réponses](./RESPONSE_MAPPING.md)** : Guide sur les formats de données (Tableaux, Accordéons).

---

## 🎯 Objectif du Service

Le N8N Processor permet d'exposer vos workflows n8n complexes sous une API simple et unifiée. Il gère :
-   **Le routage intelligent** basé sur des mots-clés dans le message utilisateur.
-   **La normalisation des données** pour un affichage propre dans vos interfaces (Markdown, Tableaux).
-   **L'injection de marqueurs spécifiques** pour des rendus riches (Accordéons CIA, QCM, etc.).

---

## ⚙️ Configuration Rapide

Pour utiliser ce service, assurez-vous que :
1.  Le serveur Provider Bridge est lancé (`npm run dev`).
2.  L'endpoint n8n par défaut est configuré dans le fichier `.env` (`N8N_ENDPOINT`).
3.  Vos nœuds n8n sont configurés pour recevoir des requêtes `POST` avec un JSON contenant une clé `"question"`.

## ☁️ Déploiement Netlify

Pour mettre à jour le micro-service en production :

1.  **Utilisez le script dédié** :
    -   Windows : `scripts\deploy-netlify.bat`
    -   Linux/Mac : `scripts/deploy-netlify.sh` (n'oubliez pas `chmod +x`)
2.  **Configuration requise** :
    -   Avoir le **Netlify CLI** installé (`npm install -g netlify-cli`).
    -   Être connecté (`npx netlify login`).
    -   Le projet doit être lié (`npx netlify link`).

Le script lancera automatiquement le build TypeScript et le déploiement en production.

---

**Dernière mise à jour** : Mars 2026
