/**
 * Clara Assistant API Service
 *
 * Main orchestrator service that coordinates between specialized services
 * for provider management, tools, agents, chat, and attachments.
 */

import type { ChatMessage } from "../utils/APIClient";
import {
  ClaraMessage,
  ClaraFileAttachment,
  ClaraProvider,
  ClaraModel,
  ClaraAIConfig,
} from "../types/clara_assistant_types";
import {
  addCompletionNotification,
  addInfoNotification,
} from "./notificationService";
import { TokenLimitRecoveryService } from "./tokenLimitRecoveryService";

// Import specialized services
import { claraProviderService } from "./claraProviderService";
import { claraToolService } from "./claraToolService";
import { claraAgentService } from "./claraAgentService";
import { claraChatService } from "./claraChatService";
import { claraModelService } from "./claraModelService";
import { claraAttachmentService } from "./claraAttachmentService";

export class ClaraApiService {
  private recoveryService: TokenLimitRecoveryService;
  private stopExecution: boolean = false;

  // ── n8n endpoint par défaut (router switch-case) ─────────────────────────
  // L'endpoint effectif est résolu dynamiquement dans getN8nEndpoint()
  private readonly n8nDefaultEndpoint =
    "https://j17rkv4c.rpcld.cc/webhook/template";

  // Sentinelles internes retournées par le router pour les cas sans appel HTTP
  private readonly SENTINEL_DATABASE = "__INTERNAL__DATABASE__";
  private readonly SENTINEL_NOTIFICATION = "__INTERNAL__NOTIFICATION__";

  /**
   * Router n8n – Switch-case JavaScript
   *
   * Retourne l'URL de l'endpoint n8n à appeler, ou une sentinelle interne
   * quand la réponse doit être construite localement (Case 5 & Case 8).
   *
   * Priorité des cas (ordre d'évaluation) :
   *   Case 9  – contient "Document"
   *   Case 10 – contient "Database"  (endpoint database dédié)
   *   Case 2  – contient "[Integration]"
   *   Case 3  – contient "n8n_doc"
   *   Case 4  – contient "Htlm_processor"
   *   Case 5  – contient "Database"  (table locale — pris avant Case 6)
   *   Case 6  – contient "Algorithme"
   *   Case 7  – contient "Visualisation"
   *   Case 8  – ne contient pas "Command", "command" ou "/" → notification
   *   Case 1  – défaut ("Standard" ou aucune autre condition)
   */
  private getN8nEndpoint(userMessage: string): string {
    // Dériver un token normalisé pour les comparaisons
    const msg = userMessage;

    // Détermine la clé pour le switch :
    // les cas sont évalués dans l'ordre via un helper séquentiel
    let routeKey: string;

    if (msg.includes("Document")) {
      routeKey = "document";
    } else if (msg.includes("Database")) {
      // Case 10 (endpoint) a priorité sur Case 5 (table locale)
      routeKey = "database_endpoint";
    } else if (msg.includes("CIA") || msg.includes("cia") || msg.includes("Cia")) {
      if (msg.includes("Cours") || msg.includes("COURS") || msg.includes("cours")) {
        // Case 11 (CIA Cours)
        routeKey = "cia_cours";
      } else if (msg.includes("Qcm") || msg.includes("QCM") || msg.includes("Question")) {
        // Case 12 (CIA Qcm)
        routeKey = "cia_qcm";
      } else if (msg.includes("Synthèse") || msg.includes("Synth")) {
        // Case 14 (CIA Synthèse)
        routeKey = "cia_synthese";
      } else {
        // CIA Générique (Fallback ou autre usage)
        routeKey = "cia";
      }
    } else if (msg.includes("Methodologie") || msg.includes("Methodo") || msg.includes("Méthodologie")) {
      // Case 13 (Méthodologie)
      routeKey = "methodo";
    } else if (msg.includes("Guide") || msg.includes("guide") || msg.includes("GUIDE")) {
      // Case 15 (Guide)
      routeKey = "guide";
    } else if (msg.includes("[Integration]")) {
      routeKey = "integration";
    } else if (msg.includes("n8n_doc")) {
      routeKey = "n8n_doc";
    } else if (msg.includes("Htlm_processor")) {
      routeKey = "htlm_processor";
    } else if (msg.includes("Algorithme")) {
      routeKey = "algorithme";
    } else if (msg.includes("Visualisation")) {
      routeKey = "visualisation";
    } else if (
      !msg.includes("Command") &&
      !msg.includes("command") &&
      !msg.includes("/")
    ) {
      routeKey = "notification";
    } else {
      routeKey = "default";
    }

    switch (routeKey) {
      // ── Case 2 : [Integration] ──────────────────────────────────────────
      case "integration":
        console.log("🔀 Router → Case 2 : integration_windows");
        return "https://j17rkv4c.rpcld.cc/webhook/integration_windows";

      // ── Case 3 : n8n_doc ────────────────────────────────────────────────
      case "n8n_doc":
        console.log("🔀 Router → Case 3 : n8n_doc");
        return "https://fpb7ab9h.rpcl.app/webhook/n8n_doc";

      // ── Case 4 : Htlm_processor ─────────────────────────────────────────
      case "htlm_processor":
        console.log("🔀 Router → Case 4 : htlm_processor");
        return "https://j17rkv4c.rpcld.cc/webhook/htlm_processor";

      // ── Case 5 / Case 10 : Database ─────────────────────────────────────
      // ── Case 10 : Database ─────────────────────────────────────
      // Case 10 => endpoint HTTP dédié
      case "database_endpoint":
        console.log("🔀 Router → Case 10 : integration_database");
        return "https://j17rkv4c.rpcld.cc/webhook/integration_database";

      // ── Case 11 : CIA Cours ───────────────────────────────────────────────────
      case "cia_cours":
        console.log("🔀 Router → Case 11 : cia_cours_gemini");
        return "http://localhost:5678/webhook/cia_cours_gemini";

      // ── Case 12 : CIA QCM ─────────────────────────────────────────────────────
      case "cia_qcm":
        console.log("🔀 Router → Case 12 : qcm_cia_gemini");
        return "http://localhost:5678/webhook/qcm_cia_gemini";

      // ── Ancien Case 11 / CIA Générique ─────────────────────────────────────────
      case "cia":
        console.log("🔀 Router → Case CIA : integration_cia");
        return "https://j17rkv4c.rpcld.cc/webhook/integration_cia";

      // ── Case 13 : Méthodologie ────────────────────────────────────────────────
      case "methodo":
        console.log("🔀 Router → Case 13 : cia_methodo_gemini");
        return "http://localhost:5678/webhook/cia_methodo_gemini";

      // ── Case 14 : CIA Synthèse ───────────────────────────────────────────────
      case "cia_synthese":
        console.log("🔀 Router → Case 14 : synthese_cia_gemini");
        return "http://localhost:5678/webhook/synthese_cia_gemini";

      // ── Case 15 : Guide ──────────────────────────────────────────────────────
      case "guide":
        console.log("🔀 Router → Case 15 : guide_gemini");
        return "http://localhost:5678/webhook/guide_gemini";

      // ── Case 6 : Algorithme ─────────────────────────────────────────────
      case "algorithme":
        console.log("🔀 Router → Case 6 : algorithme");
        return "https://j17rkv4c.rpcld.cc/webhook/algorithme";

      // ── Case 7 : Visualisation ──────────────────────────────────────────
      case "visualisation":
        console.log("🔀 Router → Case 7 : visualisation");
        return "https://j17rkv4c.rpcld.cc/webhook/visualisation";

      // ── Case 8 : Notification locale ────────────────────────────────────
      case "notification":
        console.log("🔀 Router → Case 8 : notification locale (pas d'appel HTTP)");
        return this.SENTINEL_NOTIFICATION;

      // ── Case 9 : Document ───────────────────────────────────────────────
      case "document":
        console.log("🔀 Router → Case 9 : integration_document");
        return "https://j17rkv4c.rpcld.cc/webhook/integration_document";

      // ── Case 1 : défaut / Standard ──────────────────────────────────────
      case "default":
      default:
        console.log("🔀 Router → Case 1 : template (défaut)");
        return this.n8nDefaultEndpoint;
    }
  }



  // Timeout configurable (en millisecondes)
  private n8nTimeout = 10 * 60 * 1000; // 10 minutes par défaut pour les workflows LLM

  constructor() {
    // Initialize the recovery service
    this.recoveryService = TokenLimitRecoveryService.getInstance();

    // Log pour confirmer l'initialisation
    console.log(
      "✅ ClaraApiService initialisé avec endpoint par défaut:",
      this.n8nDefaultEndpoint,
    );
    console.log("⏱️ Timeout configuré:", this.n8nTimeout / 1000, "secondes");
  }

  /**
   * Configure le timeout pour les requêtes n8n
   */
  public setN8nTimeout(timeoutMs: number): void {
    this.n8nTimeout = timeoutMs;
    console.log("⏱️ Nouveau timeout n8n:", timeoutMs / 1000, "secondes");
  }

  /**
   * Récupère le timeout actuel
   */
  public getN8nTimeout(): number {
    return this.n8nTimeout;
  }

  /**
   * Test de connexion à l'endpoint n8n
   */
  public async testN8nConnection(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log("🧪 Test de connexion à n8n...");

      // Utiliser un timeout plus court pour le test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes pour le test

      const response = await fetch(this.n8nDefaultEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ question: "Test de connexion" }),
        mode: "cors",
        credentials: "omit",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log("✅ Connexion réussie, données reçues:", data);

      return {
        success: true,
        message: "Connexion réussie",
        data,
      };
    } catch (error) {
      const err = error as Error;
      console.error("❌ Erreur de test:", err);
      return {
        success: false,
        message: err.message,
      };
    }
  }

  /**
   * Détecte automatiquement le type de table basé sur son contenu
   */
  private detectTableType(
    tableKey: string,
    tableData: any,
  ): "header" | "data_array" | "download" | "unknown" {
    const lowerKey = tableKey.toLowerCase();

    // Type 1: En-tête (petit objet avec 2-5 propriétés simples)
    if (typeof tableData === "object" && !Array.isArray(tableData)) {
      const keys = Object.keys(tableData);
      const hasSimpleValues = keys.every(
        (k) => typeof tableData[k] !== "object",
      );

      // Détection par mots-clés courants d'en-tête
      const headerKeywords = [
        "etape",
        "reference",
        "ref",
        "titre",
        "title",
        "date",
        "version",
      ];
      const hasHeaderKeywords = keys.some((k) =>
        headerKeywords.some((kw) => k.toLowerCase().includes(kw)),
      );

      if (keys.length <= 5 && hasSimpleValues && hasHeaderKeywords) {
        return "header";
      }

      // Type 3: Téléchargement (contient des URLs ou le mot "télécharger")
      const hasDownloadKeywords =
        lowerKey.includes("telecharger") ||
        lowerKey.includes("download") ||
        keys.some((k) => k.toLowerCase().includes("telecharger"));
      const hasUrls = keys.some(
        (k) =>
          typeof tableData[k] === "string" &&
          (tableData[k].startsWith("http://") ||
            tableData[k].startsWith("https://")),
      );

      if (hasDownloadKeywords || hasUrls) {
        return "download";
      }
    }

    // Type 2: Tableau de données (array d'objets)
    if (Array.isArray(tableData) && tableData.length > 0) {
      return "data_array";
    }

    return "unknown";
  }

  /**
   * Génère un titre approprié pour une table de données
   * @param includeTitle - Si false, ne génère pas de titre
   */
  private generateTableTitle(
    tableKey: string,
    tableData: any[],
    includeTitle: boolean = false,
  ): string {
    if (!includeTitle) {
      return ""; // Pas de titre
    }

    const lowerKey = tableKey.toLowerCase();

    // Analyse du contenu pour deviner le type de données
    if (tableData.length > 0) {
      const firstItem = tableData[0];
      const columns = Object.keys(firstItem);

      // Détection de type "Contrôles Audit"
      const auditKeywords = [
        "controle",
        "audit",
        "risque",
        "point",
        "objectif",
      ];
      const hasAuditColumns = columns.some((col) =>
        auditKeywords.some((kw) => col.toLowerCase().includes(kw)),
      );

      if (hasAuditColumns) {
        return "📑 Programme de Travail - Contrôles Audit";
      }

      // Détection de type "Opérations/Processus"
      const processKeywords = [
        "operation",
        "acteur",
        "principale",
        "processus",
        "tache",
      ];
      const hasProcessColumns = columns.some((col) =>
        processKeywords.some((kw) => col.toLowerCase().includes(kw)),
      );

      if (hasProcessColumns) {
        return "📊 Principales Opérations";
      }

      // Détection de type "Recommandations"
      if (lowerKey.includes("reco") || lowerKey.includes("recommandation")) {
        return "💡 Recommandations";
      }

      // Détection de type "Template"
      if (lowerKey.includes("template") || lowerKey.includes("modele")) {
        return "📋 Modèle";
      }
    }

    // Fallback: utiliser le nom de la clé en le nettoyant
    return (
      "📄 " +
      tableKey
        .replace(/_/g, " ")
        .replace(/table\s*/gi, "")
        .trim()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  }

  /**
   * Convertit les données structurées du nouveau format n8n en Markdown
   */
  private convertStructuredDataToMarkdown(data: any): string {
    let markdown = "";

    try {
      // Parcourir la structure "Etape mission - Programme" ou toute clé similaire
      const etapeMissionKey =
        Object.keys(data).find(
          (key) =>
            key.toLowerCase().includes("etape") ||
            key.toLowerCase().includes("mission") ||
            key.toLowerCase().includes("programme"),
        ) || Object.keys(data)[0]; // Fallback sur la première clé

      console.log(`🔍 Clé principale détectée: "${etapeMissionKey}"`);

      const etapeMission = data[etapeMissionKey];
      if (!Array.isArray(etapeMission)) {
        console.warn("⚠️ Structure non-tableau trouvée, conversion générique");
        return this.convertGenericStructureToMarkdown(data);
      }

      console.log(`📊 Nombre de tables trouvées: ${etapeMission.length}`);

      // Traiter chaque table
      etapeMission.forEach((tableObj: any, index: number) => {
        const tableKey = Object.keys(tableObj)[0];
        const tableData = tableObj[tableKey];
        const tableType = this.detectTableType(tableKey, tableData);

        console.log(
          `📋 Table ${index + 1}/${etapeMission.length}: "${tableKey}" (type: ${tableType})`,
        );

        switch (tableType) {
          case "header":
            markdown += this.convertHeaderTableToMarkdown(tableData);
            break;

          case "data_array":
            const title = this.generateTableTitle(tableKey, tableData);
            markdown += this.convertArrayTableToMarkdown(title, tableData);
            break;

          case "download":
            markdown += this.convertDownloadTableToMarkdown(tableData);
            break;

          default:
            console.warn(`⚠️ Type de table non reconnu: ${tableKey}`);
            markdown += this.convertGenericStructureToMarkdown({
              [tableKey]: tableData,
            });
        }

        // Pas de séparateur après la dernière table
        // Pas de séparateur entre les tables sauf si explicitement demandé
        // Les tables sont suffisamment espacées par leurs propres marges
      });
    } catch (error) {
      console.error("❌ Erreur lors de la conversion en Markdown:", error);
      markdown = `**Erreur de conversion**\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    }

    return markdown;
  }

  /**
   * Convertit une table d'en-tête en Markdown (sans titre de section)
   */
  private convertHeaderTableToMarkdown(data: any): string {
    let md = "| Rubrique | Description |\n";
    md += "|----------|-------------|\n";

    Object.entries(data).forEach(([key, value]) => {
      // Capitaliser la clé proprement
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
      md += `| **${formattedKey}** | ${value} |\n`;
    });

    return md + "\n\n";
  }

  /**
   * Convertit un tableau de données en Markdown
   */
  private convertArrayTableToMarkdown(tableName: string, data: any[]): string {
    if (!data || data.length === 0) {
      return `### ${tableName}\n\n*Aucune donnée disponible*\n\n`;
    }

    console.log(`🔄 Conversion de ${tableName} avec ${data.length} lignes`);

    // Titre de la section avec emoji approprié
    let md = `### ${tableName}\n\n`;

    // Extraire les colonnes du premier élément
    const firstItem = data[0];
    const columns = Object.keys(firstItem);

    console.log(
      `📋 Colonnes détectées (${columns.length}):`,
      columns.join(", "),
    );

    // Préparer les en-têtes avec première lettre en majuscule
    const headers = columns.map((col) => {
      // Capitaliser proprement les en-têtes
      return col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " ");
    });

    // En-tête du tableau
    md += "| " + headers.join(" | ") + " |\n";
    md += "|" + columns.map(() => "---").join("|") + "|\n";

    // Lignes de données
    data.forEach((row, rowIndex) => {
      const cells = columns.map((col) => {
        const value = row[col];
        if (value === null || value === undefined) {
          return "-";
        }
        // Échapper les pipes et nettoyer les valeurs
        let cleanValue = String(value)
          .replace(/\|/g, "\\|")
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        // Limiter la longueur pour une meilleure lisibilité
        if (cleanValue.length > 200) {
          cleanValue = cleanValue.substring(0, 197) + "...";
        }

        return cleanValue || "-";
      });

      md += "| " + cells.join(" | ") + " |\n";

      // Log de progression tous les 5 items
      if ((rowIndex + 1) % 5 === 0) {
        console.log(`  ✓ ${rowIndex + 1}/${data.length} lignes traitées`);
      }
    });

    console.log(`✅ Tableau ${tableName} converti avec succès`);
    return md + "\n";
  }

  /**
   * Convertit une table de téléchargement en Markdown
   */
  private convertDownloadTableToMarkdown(data: any): string {
    let md = "## 📥 Ressources et Téléchargements\n\n";

    if (typeof data === "object") {
      Object.entries(data).forEach(([key, value]) => {
        const formattedKey =
          key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

        if (
          typeof value === "string" &&
          (value.startsWith("http://") || value.startsWith("https://"))
        ) {
          md += `🔗 **[${formattedKey}](${value})**\n\n`;
        } else {
          md += `**${formattedKey}**: ${value}\n\n`;
        }
      });
    } else {
      md += `${data}\n\n`;
    }

    return md;
  }

  /**
   * Conversion générique de structure en Markdown
   */
  private convertGenericStructureToMarkdown(
    data: any,
    depth: number = 0,
  ): string {
    let md = "";
    const indent = "  ".repeat(depth);

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        md += `${indent}- **Item ${index + 1}**:\n`;
        md += this.convertGenericStructureToMarkdown(item, depth + 1);
      });
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "object") {
          md += `${indent}**${key}**:\n`;
          md += this.convertGenericStructureToMarkdown(value, depth + 1);
        } else {
          md += `${indent}**${key}**: ${value}\n`;
        }
      });
    } else {
      md += `${indent}${data}\n`;
    }

    return md;
  }

  /**
   * Détecte et normalise le format de réponse n8n.
   * Cette fonction est conçue pour être robuste et supporter plusieurs formats de réponse.
   */
  private normalizeN8nResponse(result: any, endpoint?: string): {
    content: string;
    metadata: any;
  } {
    let contentToDisplay = "";
    let metadata: any = {};

    console.log("🔍 === DEBUT ANALYSE REPONSE N8N ===");

    if (!result) {
      console.error("❌ Réponse n8n vide ou null");
      return {
        content: "",
        metadata: { error: "Empty response from n8n", format: "error" },
      };
    }

    // ========================================================================
    // FORMAT METHODO: CIA Methodo Accordion
    // ========================================================================
    if (
      endpoint && endpoint.includes("methodo") &&
      Array.isArray(result) &&
      result.length > 0 &&
      result[0] &&
      typeof result[0] === "object" &&
      "Sous-section" in result[0]
    ) {
      console.log('✅ FORMAT METHODO DETECTE: Réponse CIA Methodo (Etape mission - Methodo)');
      const content = `__CIA_METHODO_ACCORDION__${JSON.stringify(result)}`;
      console.log("🔍 === FIN ANALYSE (FORMAT METHODO) ===");
      return {
        content,
        metadata: {
          format: "cia_methodo_accordion",
          timestamp: new Date().toISOString(),
          totalSections: result.length,
        },
      };
    }

    // ========================================================================
    // FORMAT 6: CIA QCM — Array with "Etape mission - CIA" containing tables
    // ========================================================================
    if (
      Array.isArray(result) &&
      result.length > 0 &&
      result[0] &&
      typeof result[0] === "object" &&
      "Etape mission - CIA" in result[0]
    ) {
      console.log('✅ FORMAT 6 DETECTE: Réponse CIA QCM (Etape mission - CIA)');
      const content = `__CIA_QCM_ACCORDION__${JSON.stringify(result)}`;
      console.log("🔍 === FIN ANALYSE (FORMAT 6 - CIA QCM Accordion) ===");
      return {
        content,
        metadata: {
          format: "cia_qcm_accordion",
          timestamp: new Date().toISOString(),
          qcmGroupsCount: result[0]["Etape mission - CIA"].length,
        },
      };
    }

    // ========================================================================
    // FORMAT 5: CIA — Array with "Sous-section" / "Sub-items" structure
    // ========================================================================
    if (
      Array.isArray(result) &&
      result.length > 0 &&
      result[0] &&
      typeof result[0] === "object" &&
      "Sous-section" in result[0]
    ) {
      console.log(
        '✅ FORMAT 5 DETECTE: Réponse CIA avec "Sous-section" / "Sub-items"',
      );
      const content = `__CIA_ACCORDION__${JSON.stringify(result)}`;
      console.log("🔍 === FIN ANALYSE (FORMAT 5 - CIA Accordion) ===");
      return {
        content,
        metadata: {
          format: "cia_accordion",
          timestamp: new Date().toISOString(),
          totalSections: result.length,
        },
      };
    }

    // ========================================================================
    // FORMAT 4: NOUVEAU FORMAT "Programme de travail" avec structure "data"
    // ========================================================================
    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];

      console.log("🔍 Analyse du premier élément:", {
        isObject: typeof firstItem === "object",
        hasData: firstItem && "data" in firstItem,
        hasOutput: firstItem && "output" in firstItem,
        keys: firstItem ? Object.keys(firstItem) : [],
      });

      // Vérifier si c'est le nouveau format avec "data"
      if (firstItem && typeof firstItem === "object" && "data" in firstItem) {
        console.log(
          '✅ FORMAT 4 DETECTE: Nouveau format "Programme de travail" avec structure data',
        );

        const dataContent = firstItem.data;
        console.log("📊 Contenu de data:", {
          type: typeof dataContent,
          keys: Object.keys(dataContent),
          firstKey: Object.keys(dataContent)[0],
        });

        // Convertir les données structurées en Markdown
        console.log("🔄 Début de la conversion en Markdown...");
        contentToDisplay = this.convertStructuredDataToMarkdown(dataContent);
        console.log(
          `✅ Conversion terminée: ${contentToDisplay.length} caractères générés`,
        );

        metadata = {
          format: "programme_travail_data",
          timestamp: new Date().toISOString(),
          totalItems: result.length,
          dataStructure: Object.keys(dataContent)[0] || "unknown",
          contentLength: contentToDisplay.length,
        };

        console.log("🔍 === FIN ANALYSE (FORMAT 4 - Programme de travail) ===");
        console.log(
          "📝 Aperçu du contenu généré:",
          contentToDisplay.substring(0, 300),
        );
        return { content: contentToDisplay, metadata };
      }

      // FORMAT 1: Réponse standardisée (Array avec un objet contenant 'output')
      if (firstItem && typeof firstItem === "object" && "output" in firstItem) {
        console.log('✅ FORMAT 1 DETECTE: Array avec objet contenant "output"');
        contentToDisplay = String(firstItem.output || "");
        metadata = {
          stats: firstItem.stats || {},
          debugInfo: firstItem.debugInfo || [],
          consolidationSuccess: firstItem.consolidationSuccess,
          format: "array_output",
          timestamp: firstItem.stats?.timestamp || new Date().toISOString(),
          totalItems: result.length,
        };
        console.log("🔍 === FIN ANALYSE (FORMAT 1) ===");
        return { content: contentToDisplay, metadata };
      }
    }

    // Format 2: Ancien format avec un objet 'tables'
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      result.tables &&
      Array.isArray(result.tables)
    ) {
      console.log('✅ FORMAT 2 DETECTE: Objet avec "tables"');
      contentToDisplay = result.tables
        .map((table: any) => table?.markdown || "")
        .filter((content: string) => content.trim() !== "")
        .join("\n\n---\n\n");
      metadata = {
        status: result.status,
        tables_found: result.tables_found || result.tables.length,
        format: "tables_array",
        ...result,
      };
      delete metadata.tables;
      console.log("🔍 === FIN ANALYSE (FORMAT 2) ===");
      return { content: contentToDisplay, metadata };
    }

    // Format 3: Réponse directe avec une clé 'output' à la racine
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      result.output &&
      typeof result.output === "string"
    ) {
      console.log('✅ FORMAT 3 DETECTE: Objet avec "output" direct');
      contentToDisplay = result.output;
      metadata = { ...result, format: "direct_output" };
      delete metadata.output;
      console.log("🔍 === FIN ANALYSE (FORMAT 3) ===");
      return { content: contentToDisplay, metadata };
    }

    // Cas par défaut: Format non reconnu
    console.warn(
      "⚠️ Format de réponse n8n non reconnu. Tentative de fallback.",
    );
    contentToDisplay = `I apologize, but I received an unexpected response format from the server.\n\n**Raw Data:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
    metadata = {
      rawResponse: result,
      format: "unknown_fallback",
      warning: "Unrecognized response format",
    };
    return { content: contentToDisplay, metadata };
  }

  /**
   * Send a chat message
   */
  public async sendChatMessage(
    message: string,
    _config: ClaraAIConfig,
    attachments?: ClaraFileAttachment[],
    _systemPrompt?: string,
    _conversationHistory?: ClaraMessage[],
    _onContentChunk?: (content: string) => void,
  ): Promise<ClaraMessage> {
    // ── Router switch-case : résolution de l'endpoint ──────────────────────
    // Déclaré hors du try pour rester accessible dans le catch
    const resolvedEndpoint = this.getN8nEndpoint(message);

    try {

      // ── Case 5 : Database – table locale avec lien cliquable ─────────────
      // Note : Case 10 (database_endpoint) a priorité sur Case 5 dans le
      // router, donc ce bloc ne peut être atteint que si on force la
      // sentinelle SENTINEL_DATABASE manuellement (réservé à usage futur).
      if (resolvedEndpoint === this.SENTINEL_DATABASE) {
        const content =
          "| Database |\n" +
          "|----------|\n" +
          "| [Ouvrir le formulaire Database](https://j17rkv4c.rpcld.cc/webhook/database) |";
        return {
          id: `${Date.now()}-database`,
          role: "assistant",
          content,
          timestamp: new Date(),
          metadata: { model: "local" },
        };
      }

      // ── Case 8 : Notification locale ─────────────────────────────────────
      if (resolvedEndpoint === this.SENTINEL_NOTIFICATION) {
        const content =
          "| Notification |\n" +
          "|--------------|\n" +
          '| Merci d\u2019ex\u00e9cuter les commandes pr\u00e9vues dans le \u00ab\u00a0Bouton d\u00e9marrer\u00a0\u00bb ou le Guide utilisateur. Le cas \u00e9ch\u00e9ant, se r\u00e9f\u00e9rer \u00e0 l\u2019\u00e9diteur de la suite E-audit. |';
        return {
          id: `${Date.now()}-notification`,
          role: "assistant",
          content,
          timestamp: new Date(),
          metadata: { model: "local" },
        };
      }

      // ── Appel HTTP vers n8n ───────────────────────────────────────────────
      console.log(
        "🚀 Envoi de la requête vers n8n endpoint:",
        resolvedEndpoint,
      );
      console.log("📝 Message original:", message);
      console.log("📎 Attachments:", attachments?.length || 0);
      console.log("⏱️ Timeout configuré:", this.n8nTimeout / 1000, "secondes");

      // Build structured payload for n8n
      let requestBody: any;

      if (attachments && attachments.length > 0) {
        // Use the new structured format when attachments are present
        const structuredData = claraAttachmentService.formatDataForN8nStructured(message, attachments);
        requestBody = { data: structuredData };
        console.log("📦 Structured payload for n8n:", JSON.stringify(requestBody, null, 2));
      } else {
        // Simple message without attachments - keep backward compatibility
        requestBody = { question: message };
      }

      // Configuration étendue pour gérer CORS et timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(
          `⏱️ Timeout atteint (${this.n8nTimeout / 1000}s), annulation de la requête...`,
        );
        controller.abort();
      }, this.n8nTimeout);

      const startTime = Date.now();

      const response = await fetch(resolvedEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Headers CORS si nécessaire
          Origin: window.location.origin,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        mode: "cors", // Explicitement demander CORS
        credentials: "omit", // Ne pas envoyer de credentials
      });

      clearTimeout(timeoutId);

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        "📡 Statut de la réponse:",
        response.status,
        response.statusText,
      );
      console.log("⏱️ Temps de réponse:", elapsedTime, "secondes");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur HTTP:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `n8n API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
        );
      }

      const result = await response.json();
      console.log("📦 === REPONSE BRUTE N8N ===");
      console.log(JSON.stringify(result, null, 2));
      console.log("📦 === FIN REPONSE BRUTE ===");

      // Normaliser la réponse selon son format
      console.log("🔄 Appel de normalizeN8nResponse...");
      const { content, metadata } = this.normalizeN8nResponse(result, resolvedEndpoint);

      console.log(`📊 === RESULTAT NORMALISATION ===`);
      console.log(`  Contenu extrait: ${content.length} caractères`);
      console.log(`  Format détecté: ${metadata.format}`);
      console.log(`📊 === FIN RESULTAT NORMALISATION ===`);

      if (!content || content.trim() === "") {
        console.error(
          "❌❌❌ PROBLEME: Aucun contenu exploitable extrait de la réponse n8n.",
        );
      } else {
        console.log(
          "✅✅✅ Contenu extrait avec succès et prêt à être retourné via la Promise.",
        );
      }

      // Formater la réponse en tant que ClaraMessage
      const claraMessage: ClaraMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: content.trim()
          ? content
          : "I apologize, but I was unable to get a response from n8n.",
        timestamp: new Date(),
        metadata: {
          model: "n8n",
          ...metadata,
        },
      };

      console.log(
        "💬 === MESSAGE CLARA FINAL (sera retourné par la Promise) ===",
      );
      console.log("  ID:", claraMessage.id);
      console.log("  Content length:", claraMessage.content.length);
      console.log("  Content preview:", claraMessage.content.substring(0, 200));
      console.log("💬 === FIN MESSAGE CLARA ===");

      return claraMessage;
    } catch (error) {
      console.error("❌ n8n chat execution failed:", error);
      const err = error as Error;
      console.error("📊 Détails de l'erreur:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });

      // Analyser le type d'erreur
      let errorMessage =
        "I apologize, but I encountered an error while processing your request with n8n.";
      let troubleshootingTips = "";

      if (err.name === "AbortError") {
        const timeoutMinutes = Math.floor(this.n8nTimeout / 60000);
        const timeoutSeconds = Math.floor((this.n8nTimeout % 60000) / 1000);
        const timeoutDisplay =
          timeoutMinutes > 0
            ? `${timeoutMinutes} minute${timeoutMinutes > 1 ? "s" : ""}${timeoutSeconds > 0 ? ` ${timeoutSeconds}s` : ""}`
            : `${timeoutSeconds} secondes`;

        errorMessage = `⏱️ **Request timeout**: The n8n workflow took too long to respond (>${timeoutDisplay}).`;
        troubleshootingTips = `\n\n**This is normal for complex LLM workflows.**\n\n**Solutions:**\n\n1. **Increase timeout** (recommended for LLM tasks):\n   \`\`\`javascript\n   // In browser console:\n   claraApiService.setN8nTimeout(15 * 60 * 1000); // 15 minutes\n   \`\`\`\n\n2. **Simplify your request**:\n   - Reduce the number of items to generate\n   - Break complex tasks into smaller requests\n   - Example: Ask for 10 items instead of 25\n\n3. **Optimize n8n workflow**:\n   - Check if the LLM model is responding slowly\n   - Review workflow execution logs in n8n\n   - Consider using a faster model\n   - Add intermediate "Respond to Webhook" for progress updates\n\n**Current timeout**: ${timeoutDisplay}\n**Recommended for LLM**: 10-15 minutes`;
      } else if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        errorMessage = "🌐 Network error: Unable to connect to n8n endpoint.";
        troubleshootingTips = `\n\n**Troubleshooting:**\n1. **CORS Issue**: Ensure n8n webhook has CORS enabled\n2. **Endpoint URL**: Verify endpoint is accessible: \`${resolvedEndpoint}\`\n3. **Network**: Check your internet connection\n4. **n8n Status**: Verify n8n workflow is active\n\n**Technical Details:**\n- Endpoint: \`${resolvedEndpoint}\`\n- Error: \`${err.message}\`\n\n**To Fix CORS in n8n:**\n- In your webhook node, set "Respond" > "Options" > "Response Headers"\n- Add header: \`Access-Control-Allow-Origin\` = \`*\` (or your domain)\n- Add header: \`Access-Control-Allow-Methods\` = \`POST, OPTIONS\`\n- Add header: \`Access-Control-Allow-Headers\` = \`Content-Type\``;
      } else if (err.message.includes("404")) {
        errorMessage =
          "🔍 Endpoint not found: The n8n webhook URL may be incorrect.";
        troubleshootingTips = `\n\n**Check:**\n- Workflow is activated in n8n\n- Webhook path is correct: \`${resolvedEndpoint}\``;
      } else if (
        err.message.includes("500") ||
        err.message.includes("502") ||
        err.message.includes("503")
      ) {
        errorMessage =
          "⚠️ Server error: The n8n workflow encountered an internal error.";
        troubleshootingTips =
          "\n\n**Check n8n workflow:**\n- Review workflow execution logs\n- Verify all nodes are properly configured\n- Check for error messages in n8n";
      }

      return {
        id: `${Date.now()}-error`,
        role: "assistant",
        content: `${errorMessage}${troubleshootingTips}\n\nPlease try again or contact support if the issue persists.`,
        timestamp: new Date(),
        metadata: {
          error: `${err.message} (endpoint: ${resolvedEndpoint})`,
          errorType: err.name,
        },
      };
    }
  }

  // Delegate provider-related methods to claraProviderService
  public async getProviders(): Promise<ClaraProvider[]> {
    return claraProviderService.getProviders();
  }

  public async getModels(providerId?: string): Promise<ClaraModel[]> {
    return claraProviderService.getModels(providerId);
  }

  public async getCurrentProviderModels(): Promise<ClaraModel[]> {
    return claraProviderService.getCurrentProviderModels();
  }

  public async getPrimaryProvider(): Promise<ClaraProvider | null> {
    return claraProviderService.getPrimaryProvider();
  }

  public async setPrimaryProvider(providerId: string): Promise<void> {
    return claraProviderService.setPrimaryProvider(providerId);
  }

  public updateProvider(provider: ClaraProvider): void {
    return claraProviderService.updateProvider(provider);
  }

  public async healthCheck(): Promise<boolean> {
    return claraProviderService.healthCheck();
  }

  public async testProvider(provider: ClaraProvider): Promise<boolean> {
    return claraProviderService.testProvider(provider);
  }

  public getCurrentClient() {
    return claraProviderService.getCurrentClient();
  }

  public getCurrentProvider(): ClaraProvider | null {
    return claraProviderService.getCurrentProvider();
  }

  /**
   * Stop the current chat generation
   */
  public stop(): void {
    this.stopExecution = true;
    claraAgentService.stop();
    const client = claraProviderService.getCurrentClient() as any;
    if (client && typeof client.abortStream === "function") {
      client.abortStream();
      console.log("Stream aborted successfully");
    }
  }

  /**
   * Preload/warm up a model
   */
  public async preloadModel(
    config: ClaraAIConfig,
    conversationHistory?: ClaraMessage[],
  ): Promise<void> {
    const client = claraProviderService.getCurrentClient();
    if (!client || !config.models.text) return;

    const currentProvider = claraProviderService.getCurrentProvider();
    const isLocalProvider = claraModelService.isLocalProvider(
      config,
      currentProvider?.baseUrl,
    );
    if (!isLocalProvider) return;

    let modelId = claraModelService.selectAppropriateModel(
      config,
      "",
      [],
      conversationHistory,
    );
    modelId = claraModelService.extractModelId(modelId);

    await claraChatService.preloadModel(
      client,
      modelId,
      config,
      isLocalProvider,
    );
  }

  /**
   * Record a successful tool execution
   */
  public recordToolSuccess(
    toolName: string,
    toolDescription: string,
    toolCallId?: string,
  ): void {
    const currentProvider = claraProviderService.getCurrentProvider();
    claraToolService.recordToolSuccess(
      toolName,
      toolDescription,
      currentProvider?.id || "unknown",
      toolCallId,
    );
  }

  /**
   * Clear incorrectly blacklisted tools
   */
  public clearBlacklistedTools(): void {
    const currentProvider = claraProviderService.getCurrentProvider();
    const client = claraProviderService.getCurrentClient();
    if (currentProvider && client) {
      claraToolService.clearBlacklistedTools(currentProvider.id, client);
      addInfoNotification(
        "Tools Reset",
        `Cleared incorrectly blacklisted tools for ${currentProvider.name}.`,
        8000,
      );
    }
  }
}

// Export singleton instance
export const claraApiService = new ClaraApiService();
