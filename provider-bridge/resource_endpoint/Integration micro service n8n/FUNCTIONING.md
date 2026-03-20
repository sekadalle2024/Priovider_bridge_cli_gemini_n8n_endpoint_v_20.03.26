# ⚙️ Fonctionnement Détaillé (Routage & Cas)

Le N8N Processor utilise une logique de routage basée sur des mots-clés pour aiguiller les requêtes vers le bon workflow.

## 🧠 Logique de Routage (Case Logic)

Le service analyse le message utilisateur (`message`) et applique les règles suivantes :

| Cas | Mot-clé détecté | Destination (Webhook) |
|-----|----------------|-----------------------|
| 1 | `Document` | `/integration_document` |
| 2 | `Database` | `/integration_database` |
| 3 | `CIA Cours` | `/cia_cours_gemini` |
| 4 | `CIA Qcm` | `/qcm_cia_gemini` |
| 5 | `CIA Synthèse` | `/synthese_cia_gemini` |
| 6 | `CIA` (Général) | `/integration_cia` |
| 7 | `Methodologie` | `/cia_methodo_gemini` |
| 8 | `Guide` | `/guide_gemini` |
| 9 | `[Integration]` | `/integration_v1` |
| 10 | `n8n_doc` | `/n8n_doc` |
| 11 | `Htlm_processor` | `/htlm_processor` |
| 12 | `Algorithme` | `/algorithme` |
| 13 | `Visualisation` | `/visualisation` |
| 14 | (Pas de cmd / /) | `__INTERNAL__NOTIFICATION__` |
| 15 | **Défaut** | `/template` |

## 🏷️ Marqueurs de Réponse (Accordéons)

Le bridge injecte des marqueurs spéciaux dans le texte de réponse pour permettre au Frontend d'afficher des composants interactifs :

-   `__CIA_ACCORDION__` : Déclenche un affichage en accordéon pour les contenus CIA.
-   `__CIA_METHODO_ACCORDION__` : Spécifique aux méthodologies.
-   `__CIA_QCM_ACCORDION__` : Prépare l'affichage interactif d'un QCM.

## 📊 Formats de Sortie Supportés

Le normaliseur gère intelligemment les formats retournés par n8n :
1.  **Texte brut** : Renvoyé tel quel.
2.  **Tableaux (JSON)** : Convertis automatiquement en tableaux Markdown pour un rendu parfait.
3.  **Données structurées** (`programme_travail_data`) : Formatées en sections lisibles.
4.  **Listes d'objets** : Converties en listes à puces Markdown.
