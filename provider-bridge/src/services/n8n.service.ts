import dotenv from 'dotenv';
dotenv.config();

export interface N8nChatOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    endpoint?: string;
}

export class N8nService {
    private static instance: N8nService | null = null;
    private n8nEndpoint: string;
    private defaultTimeout: number = 11 * 60 * 1000; // 11 minutes par défaut

    private constructor() {
        this.n8nEndpoint = process.env.N8N_ENDPOINT || "https://j17rkv4c.rpcld.cc/webhook/template";
    }

    public static getInstance(): N8nService {
        if (!N8nService.instance) {
            N8nService.instance = new N8nService();
        }
        return N8nService.instance;
    }

    public getStatus() {
        return {
            available: true,
            endpoint: this.n8nEndpoint,
        };
    }

    public async chat(messages: any[], options: N8nChatOptions = {}) {
        const timeoutMs = options.timeout || this.defaultTimeout;

        // Extract the latest user message
        const lastMessage = messages[messages.length - 1];
        const messageText = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);

        // Form the payload
        const requestBody = { question: messageText };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(this.n8nEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
                mode: "cors",
                credentials: "omit",
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`n8n API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`);
            }

            const result = await response.json();
            
            // If it's a "processor" request, we might want to use dynamic endpoint or different normalization
            const { content, metadata } = this.normalizeN8nResponse(result, options.endpoint);

            return {
                text: content || "I apologize, but I was unable to get a response from n8n.",
                model: "n8n-workflow",
                metadata
            };

        } catch (error: any) {
            clearTimeout(timeoutId);
            throw new Error(`n8n computation failed: ${error.message}`);
        }
    }

    /**
     * Router n8n – Switch-case based on user message.
     * Returns the appropriate n8n webhook URL.
     */
    public getN8nEndpoint(userMessage: string): string {
        const msg = userMessage;
        let routeKey: string;

        if (msg.includes("Document")) {
            routeKey = "document";
        } else if (msg.includes("Database")) {
            routeKey = "database_endpoint";
        } else if (msg.includes("CIA") || msg.includes("cia") || msg.includes("Cia")) {
            if (msg.includes("Cours") || msg.includes("COURS") || msg.includes("cours")) {
                routeKey = "cia_cours";
            } else if (msg.includes("Qcm") || msg.includes("QCM") || msg.includes("Question")) {
                routeKey = "cia_qcm";
            } else if (msg.includes("Synthèse") || msg.includes("Synth")) {
                routeKey = "cia_synthese";
            } else {
                routeKey = "cia";
            }
        } else if (msg.includes("Methodologie") || msg.includes("Methodo") || msg.includes("Méthodologie")) {
            routeKey = "methodo";
        } else if (msg.includes("Guide") || msg.includes("guide") || msg.includes("GUIDE")) {
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
            case "integration":
                return "https://j17rkv4c.rpcld.cc/webhook/integration_windows";
            case "n8n_doc":
                return "https://fpb7ab9h.rpcl.app/webhook/n8n_doc";
            case "htlm_processor":
                return "https://j17rkv4c.rpcld.cc/webhook/htlm_processor";
            case "database_endpoint":
                return "https://j17rkv4c.rpcld.cc/webhook/integration_database";
            case "cia_cours":
                return "http://localhost:5678/webhook/cia_cours_gemini";
            case "cia_qcm":
                return "http://localhost:5678/webhook/qcm_cia_gemini";
            case "cia":
                return "https://j17rkv4c.rpcld.cc/webhook/integration_cia";
            case "methodo":
                return "http://localhost:5678/webhook/cia_methodo_gemini";
            case "cia_synthese":
                return "http://localhost:5678/webhook/synthese_cia_gemini";
            case "guide":
                return "http://localhost:5678/webhook/guide_gemini";
            case "algorithme":
                return "https://j17rkv4c.rpcld.cc/webhook/algorithme";
            case "visualisation":
                return "https://j17rkv4c.rpcld.cc/webhook/visualisation";
            case "document":
                return "https://j17rkv4c.rpcld.cc/webhook/integration_document";
            case "notification":
                return "__INTERNAL__NOTIFICATION__";
            case "default":
            default:
                return this.n8nEndpoint;
        }
    }

    /**
     * Process message through the n8n_processor workflow
     */
    public async process(message: string, options: N8nChatOptions = {}) {
        const endpoint = this.getN8nEndpoint(message);
        
        if (endpoint === "__INTERNAL__NOTIFICATION__") {
            return {
                text: "Notification context detected. No external call required.",
                model: "n8n-processor",
                metadata: { format: "notification" }
            };
        }

        const timeoutMs = options.timeout || this.defaultTimeout;
        const requestBody = { question: message };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`n8n API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`);
            }

            const result = await response.json();
            const { content, metadata } = this.normalizeN8nResponse(result, endpoint);

            return {
                text: content || "No response received from n8n.",
                model: "n8n-processor",
                metadata
            };

        } catch (error: any) {
            clearTimeout(timeoutId);
            throw new Error(`n8n processing failed: ${error.message}`);
        }
    }

    private normalizeN8nResponse(result: any, endpoint?: string): { content: string; metadata: any; } {
        let contentToDisplay = "";
        let metadata: any = {};

        if (!result) {
            return {
                content: "",
                metadata: { error: "Empty response from n8n", format: "error" },
            };
        }

        // FORMAT METHODO: CIA Methodo Accordion
        if (
            endpoint && endpoint.includes("methodo") &&
            Array.isArray(result) &&
            result.length > 0 &&
            result[0] &&
            typeof result[0] === "object" &&
            "Sous-section" in result[0]
        ) {
            const content = `__CIA_METHODO_ACCORDION__${JSON.stringify(result)}`;
            return {
                content,
                metadata: {
                    format: "cia_methodo_accordion",
                    timestamp: new Date().toISOString(),
                    totalSections: result.length,
                },
            };
        }

        // FORMAT 6: CIA QCM — Array with "Etape mission - CIA" containing tables
        if (
            Array.isArray(result) &&
            result.length > 0 &&
            result[0] &&
            typeof result[0] === "object" &&
            "Etape mission - CIA" in result[0]
        ) {
            const content = `__CIA_QCM_ACCORDION__${JSON.stringify(result)}`;
            return {
                content,
                metadata: {
                    format: "cia_qcm_accordion",
                    timestamp: new Date().toISOString(),
                    qcmGroupsCount: result[0]["Etape mission - CIA"].length,
                },
            };
        }

        // FORMAT 5: CIA — Array with "Sous-section" / "Sub-items" structure
        if (
            Array.isArray(result) &&
            result.length > 0 &&
            result[0] &&
            typeof result[0] === "object" &&
            "Sous-section" in result[0]
        ) {
            const content = `__CIA_ACCORDION__${JSON.stringify(result)}`;
            return {
                content,
                metadata: {
                    format: "cia_accordion",
                    timestamp: new Date().toISOString(),
                    totalSections: result.length,
                },
            };
        }

        if (Array.isArray(result) && result.length > 0) {
            const firstItem = result[0];

            if (firstItem && typeof firstItem === "object" && "data" in firstItem) {
                const dataContent = firstItem.data;
                contentToDisplay = this.convertStructuredDataToMarkdown(dataContent);
                metadata = { format: "programme_travail_data" };
                return { content: contentToDisplay, metadata };
            }

            if (firstItem && typeof firstItem === "object" && "output" in firstItem) {
                contentToDisplay = String(firstItem.output || "");
                metadata = { format: "array_output" };
                return { content: contentToDisplay, metadata };
            }
        }

        if (result && typeof result === "object" && !Array.isArray(result) && result.tables && Array.isArray(result.tables)) {
            contentToDisplay = result.tables
                .map((table: any) => table?.markdown || "")
                .filter((content: string) => content.trim() !== "")
                .join("\n\n---\n\n");
            metadata = { format: "tables_array" };
            return { content: contentToDisplay, metadata };
        }

        if (result && typeof result === "object" && !Array.isArray(result) && result.output && typeof result.output === "string") {
            contentToDisplay = result.output;
            metadata = { format: "direct_output" };
            return { content: contentToDisplay, metadata };
        }

        contentToDisplay = `Unrecognized response format from server.\n\n**Raw Data:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
        metadata = { format: "unknown_fallback" };
        return { content: contentToDisplay, metadata };
    }

    private convertStructuredDataToMarkdown(data: any): string {
        let markdown = "";
        try {
            const etapeMissionKey = Object.keys(data).find(key =>
                key.toLowerCase().includes("etape") ||
                key.toLowerCase().includes("mission") ||
                key.toLowerCase().includes("programme")
            ) || Object.keys(data)[0];

            const etapeMission = data[etapeMissionKey];
            if (!Array.isArray(etapeMission)) {
                return this.convertGenericStructureToMarkdown(data);
            }

            etapeMission.forEach((tableObj: any) => {
                const tableKey = Object.keys(tableObj)[0];
                const tableData = tableObj[tableKey];
                const tableType = this.detectTableType(tableKey, tableData);

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
                        markdown += this.convertGenericStructureToMarkdown({ [tableKey]: tableData });
                }
            });
        } catch (error) {
            markdown = `**Erreur de conversion**\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        }

        return markdown;
    }

    private detectTableType(tableKey: string, tableData: any): "header" | "data_array" | "download" | "unknown" {
        const lowerKey = tableKey.toLowerCase();

        if (typeof tableData === "object" && !Array.isArray(tableData)) {
            const keys = Object.keys(tableData);
            const hasSimpleValues = keys.every(k => typeof tableData[k] !== "object");
            const headerKeywords = ["etape", "reference", "ref", "titre", "title", "date", "version"];
            const hasHeaderKeywords = keys.some(k => headerKeywords.some(kw => k.toLowerCase().includes(kw)));

            if (keys.length <= 5 && hasSimpleValues && hasHeaderKeywords) return "header";

            const hasDownloadKeywords = lowerKey.includes("telecharger") || lowerKey.includes("download") || keys.some(k => k.toLowerCase().includes("telecharger"));
            const hasUrls = keys.some(k => typeof tableData[k] === "string" && (tableData[k].startsWith("http://") || tableData[k].startsWith("https://")));

            if (hasDownloadKeywords || hasUrls) return "download";
        }

        if (Array.isArray(tableData) && tableData.length > 0) return "data_array";
        return "unknown";
    }

    private generateTableTitle(tableKey: string, tableData: any[], includeTitle: boolean = false): string {
        if (!includeTitle) return "";

        const lowerKey = tableKey.toLowerCase();
        if (tableData.length > 0) {
            const columns = Object.keys(tableData[0]);
            if (columns.some(col => ["controle", "audit", "risque", "point", "objectif"].some(kw => col.toLowerCase().includes(kw)))) {
                return "📑 Programme de Travail - Contrôles Audit";
            }
            if (columns.some(col => ["operation", "acteur", "principale", "processus", "tache"].some(kw => col.toLowerCase().includes(kw)))) {
                return "📊 Principales Opérations";
            }
            if (lowerKey.includes("reco") || lowerKey.includes("recommandation")) return "💡 Recommandations";
            if (lowerKey.includes("template") || lowerKey.includes("modele")) return "📋 Modèle";
        }

        return "📄 " + tableKey.replace(/_/g, " ").replace(/table\s*/gi, "").trim().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }

    private convertHeaderTableToMarkdown(data: any): string {
        let md = "| Rubrique | Description |\n|----------|-------------|\n";
        Object.entries(data).forEach(([key, value]) => {
            md += `| **${key.charAt(0).toUpperCase() + key.slice(1)}** | ${value} |\n`;
        });
        return md + "\n\n";
    }

    private convertArrayTableToMarkdown(tableName: string, data: any[]): string {
        if (!data || data.length === 0) return `### ${tableName}\n\n*Aucune donnée disponible*\n\n`;

        let md = `### ${tableName}\n\n`;
        const columns = Object.keys(data[0]);
        const headers = columns.map(col => col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " "));

        md += "| " + headers.join(" | ") + " |\n|" + columns.map(() => "---").join("|") + "|\n";

        data.forEach(row => {
            const cells = columns.map(col => {
                const value = row[col];
                if (value == null) return "-";
                let cleanValue = String(value).replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
                return cleanValue.length > 200 ? cleanValue.substring(0, 197) + "..." : (cleanValue || "-");
            });
            md += "| " + cells.join(" | ") + " |\n";
        });

        return md + "\n";
    }

    private convertDownloadTableToMarkdown(data: any): string {
        let md = "## 📥 Ressources et Téléchargements\n\n";
        if (typeof data === "object") {
            Object.entries(data).forEach(([key, value]) => {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
                if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
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

    private convertGenericStructureToMarkdown(data: any, depth: number = 0): string {
        let md = "";
        const indent = "  ".repeat(depth);

        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                md += `${indent}- **Item ${index + 1}**:\n` + this.convertGenericStructureToMarkdown(item, depth + 1);
            });
        } else if (typeof data === "object" && data !== null) {
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === "object") {
                    md += `${indent}**${key}**:\n` + this.convertGenericStructureToMarkdown(value, depth + 1);
                } else {
                    md += `${indent}**${key}**: ${value}\n`;
                }
            });
        } else {
            md += `${indent}${data}\n`;
        }
        return md;
    }
}

export const getN8nService = () => N8nService.getInstance();
