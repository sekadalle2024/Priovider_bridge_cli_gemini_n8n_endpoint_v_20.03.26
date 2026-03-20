# 💻 Guide d'Intégration Front-end

Ce document explique comment intégrer le **N8N Processor** dans vos applications front-end (React, Vue, JS natif).

## 🔌 Appel à l'API

L'endpoint principal est `/api/providers/n8n/processor`.

### URLs Base

| Environnement | URL |
|---------------|-----|
| **Local** | `http://localhost:25809/api/providers/n8n/processor` |
| **Production (Netlify)** | `https://providerbridge.netlify.app/api/providers/n8n/processor` |

### Exemple avec `fetch` (JavaScript)

```javascript
const response = await fetch('http://localhost:25809/api/providers/n8n/processor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN' // Facultatif selon config
  },
  body: JSON.stringify({
    message: "Générer un CIA Cours sur l'audit interne",
    options: {
      timeout: 660000 // 11 min (optionnel)
    }
  })
});

const data = await response.json();
console.log(data.message.content); // Le texte Markdown + Marqueurs
```

## 🎨 Rendu des Composants Spéciaux

Le serveur renvoie des **marqueurs** dans le texte Markdown. Votre frontend doit les intercepter.

| Marqueur | Composant attendu | Action |
|----------|-------------------|--------|
| `__CIA_ACCORDION__` | Accordéon CIA | Afficher le contenu en chapitres |
| `__CIA_METHODO_ACCORDION__` | Accordéon Méthodo | Afficher les étapes de mission |
| `__CIA_QCM_ACCORDION__` | Quiz / QCM | Afficher les questions avec interface de correction |

### Exemple de logique de rendu (React)

```javascript
function MessageRenderer({ content }) {
  if (content.includes('__CIA_ACCORDION__')) {
    return <CiaAccordion content={content} />;
  }
  if (content.includes('__CIA_QCM_ACCORDION__')) {
    return <CiaQcmAccordion content={content} />;
  }
  return <MarkdownRenderer>{content}</MarkdownRenderer>;
}
```

## 📊 Gestion des Tables Markdown

Le service convertit les sorties JSON d'n8n en tables Markdown standard. Assurez-vous que votre parseur Markdown (ex: `react-markdown` avec `remark-gfm`) supporte les tables :

```javascript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatMessage({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {text}
    </ReactMarkdown>
  );
}
```

---

## 💡 Conseils d'UX

-   **Indicateur de chargement** : Comme les appels n8n peuvent être longs (~30s à 2min+), affichez toujours un état `IsLoading`.
-   **Streaming** : Notez que cet endpoint ne supporte pas le streaming pour le moment (réponse complète à la fin).
-   **Gestion d'erreur** : Prévoyez un fallback en cas de timeout (ex: "Le traitement est long, veuillez patienter...").
