import { Router } from "express";
import { storage } from "./storage";
import type { Client, Mission, CompanySettings } from "@shared/schema";

const router = Router();

// Helper function to format currency
function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

// Helper function to format date
function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Generate invoice content using AI-like templates
function generateInvoiceContent(
  client: Client,
  company: CompanySettings | undefined,
  amount: number,
  description: string,
  missionTitle?: string
): { title: string; description: string; lineItems: any[] } {
  const lineItems = [
    {
      description: missionTitle || description || 'Prestation de services',
      quantity: 1,
      unitPrice: amount,
      total: amount
    }
  ];

  return {
    title: `Facture - ${client.name}`,
    description: `Facture pour ${client.name}${missionTitle ? ` - ${missionTitle}` : ''}`,
    lineItems
  };
}

// Generate contract content using AI-like templates
function generateContractContent(
  client: Client,
  company: CompanySettings | undefined,
  amount: number,
  description: string,
  startDate?: Date,
  endDate?: Date
): string {
  const companyName = company?.companyName || 'Votre Entreprise';
  const companyAddress = company?.address ? `${company.address}, ${company.postalCode} ${company.city}` : '';
  const companySiret = company?.siret || '';

  const clientAddress = client.address ? `${client.address}, ${client.postalCode} ${client.city}` : '';

  return `
CONTRAT DE PRESTATION DE SERVICES

Entre les soussignés :

${companyName}
${companyAddress}
SIRET : ${companySiret}
${company?.email ? `Email : ${company.email}` : ''}
${company?.phone ? `Téléphone : ${company.phone}` : ''}

Ci-après dénommé "Le Prestataire"

ET

${client.name}
${clientAddress}
${client.siret ? `SIRET : ${client.siret}` : ''}
${client.email ? `Email : ${client.email}` : ''}
${client.phone ? `Téléphone : ${client.phone}` : ''}
${client.contactName ? `Représenté par : ${client.contactName}` : ''}

Ci-après dénommé "Le Client"

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 - OBJET DU CONTRAT

Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire s'engage à fournir au Client les services suivants :

${description || 'Prestation de formation professionnelle'}

ARTICLE 2 - DURÉE DU CONTRAT

Le présent contrat prend effet à compter du ${startDate ? formatDate(startDate) : '[DATE DE DÉBUT]'} et se terminera le ${endDate ? formatDate(endDate) : '[DATE DE FIN]'}.

ARTICLE 3 - PRIX ET MODALITÉS DE PAIEMENT

Le prix total de la prestation s'élève à ${formatCurrency(amount)} HT.
${company?.tvaNumber ? `TVA applicable au taux de 20% soit ${formatCurrency(amount * 0.2)}` : 'TVA non applicable, article 293B du CGI'}
Total TTC : ${formatCurrency(amount * 1.2)}

Le paiement sera effectué selon les modalités suivantes :
- 30% à la signature du présent contrat
- 70% à la fin de la prestation

ARTICLE 4 - OBLIGATIONS DU PRESTATAIRE

Le Prestataire s'engage à :
- Exécuter la prestation conformément aux règles de l'art
- Respecter les délais convenus
- Informer le Client de toute difficulté dans l'exécution de la prestation

ARTICLE 5 - OBLIGATIONS DU CLIENT

Le Client s'engage à :
- Fournir au Prestataire toutes les informations nécessaires à l'exécution de la prestation
- Régler les factures dans les délais convenus
- Collaborer activement à la bonne exécution de la prestation

ARTICLE 6 - CONFIDENTIALITÉ

Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.

ARTICLE 7 - LOI APPLICABLE ET JURIDICTION

Le présent contrat est soumis au droit français. En cas de litige, les tribunaux compétents seront ceux du lieu du siège social du Prestataire.

Fait à ______________, le ______________

En deux exemplaires originaux.

Pour le Prestataire :                    Pour le Client :
${companyName}                           ${client.name}


_____________________                    _____________________
Signature                                Signature
`;
}

// ==================== COMPANY SETTINGS ROUTES ====================
router.get("/company-settings", async (req, res) => {
  try {
    const settings = await storage.getCompanySettings();
    res.json(settings || {});
  } catch (error) {
    console.error("Error fetching company settings:", error);
    res.status(500).json({ error: "Failed to fetch company settings" });
  }
});

router.put("/company-settings", async (req, res) => {
  try {
    const settings = await storage.updateCompanySettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error("Error updating company settings:", error);
    res.status(500).json({ error: "Failed to update company settings" });
  }
});

// ==================== CLIENT CONTRACTS ROUTES ====================
router.get("/contracts", async (req, res) => {
  try {
    const contracts = await storage.getClientContracts();
    res.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ error: "Failed to fetch contracts" });
  }
});

router.get("/contracts/client/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const contracts = await storage.getClientContractsByClient(clientId);
    res.json(contracts);
  } catch (error) {
    console.error("Error fetching client contracts:", error);
    res.status(500).json({ error: "Failed to fetch client contracts" });
  }
});

router.get("/contracts/:id", async (req, res) => {
  try {
    const contract = await storage.getClientContract(parseInt(req.params.id));
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    res.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ error: "Failed to fetch contract" });
  }
});

router.post("/contracts", async (req, res) => {
  try {
    const contractNumber = await storage.getNextContractNumber();
    const contract = await storage.createClientContract({
      ...req.body,
      contractNumber
    });
    res.status(201).json(contract);
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ error: "Failed to create contract" });
  }
});

router.put("/contracts/:id", async (req, res) => {
  try {
    const contract = await storage.updateClientContract(parseInt(req.params.id), req.body);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }
    res.json(contract);
  } catch (error) {
    console.error("Error updating contract:", error);
    res.status(500).json({ error: "Failed to update contract" });
  }
});

router.delete("/contracts/:id", async (req, res) => {
  try {
    await storage.deleteClientContract(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ error: "Failed to delete contract" });
  }
});

// Generate contract content for a client
router.post("/contracts/generate/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const { amount, description, startDate, endDate } = req.body;

    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const company = await storage.getCompanySettings();
    const contractNumber = await storage.getNextContractNumber();

    const content = generateContractContent(
      client,
      company,
      amount || client.contractAmount || 0,
      description || client.demand || '',
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Calculate amounts
    const amountHT = amount || client.contractAmount || 0;
    const vatRate = 20;
    const vatAmount = Math.round(amountHT * vatRate / 100);
    const totalAmount = amountHT + vatAmount;

    // Create the contract
    const contract = await storage.createClientContract({
      contractNumber,
      clientId,
      title: `Contrat - ${client.name}`,
      description: description || client.demand || '',
      content,
      amount: amountHT,
      vatRate,
      vatAmount,
      totalAmount,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'draft'
    });

    res.status(201).json(contract);
  } catch (error) {
    console.error("Error generating contract:", error);
    res.status(500).json({ error: "Failed to generate contract" });
  }
});

// ==================== CLIENT INVOICES ROUTES ====================
router.get("/client-invoices", async (req, res) => {
  try {
    const invoicesList = await storage.getClientInvoices();
    res.json(invoicesList);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.get("/client-invoices/client/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const invoicesList = await storage.getClientInvoicesByClient(clientId);
    res.json(invoicesList);
  } catch (error) {
    console.error("Error fetching client invoices:", error);
    res.status(500).json({ error: "Failed to fetch client invoices" });
  }
});

router.get("/client-invoices/:id", async (req, res) => {
  try {
    const invoice = await storage.getClientInvoice(parseInt(req.params.id));
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

router.post("/client-invoices", async (req, res) => {
  try {
    const invoiceNumber = await storage.getNextInvoiceNumber();
    const invoice = await storage.createClientInvoice({
      ...req.body,
      invoiceNumber
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.put("/client-invoices/:id", async (req, res) => {
  try {
    const invoice = await storage.updateClientInvoice(parseInt(req.params.id), req.body);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

router.delete("/client-invoices/:id", async (req, res) => {
  try {
    await storage.deleteClientInvoice(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

// Generate invoice content for a client
router.post("/client-invoices/generate/:clientId", async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const { amount, description, missionId, dueDate } = req.body;

    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const company = await storage.getCompanySettings();
    const invoiceNumber = await storage.getNextInvoiceNumber();

    let missionTitle: string | undefined;
    if (missionId) {
      const mission = await storage.getMission(missionId);
      missionTitle = mission?.title;
    }

    const generated = generateInvoiceContent(
      client,
      company,
      amount || client.contractAmount || 0,
      description || '',
      missionTitle
    );

    // Calculate amounts
    const subtotal = amount || client.contractAmount || 0;
    const vatRate = 20;
    const vatAmount = Math.round(subtotal * vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    // Default due date is 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);

    // Create the invoice
    const invoice = await storage.createClientInvoice({
      invoiceNumber,
      clientId,
      contractId: null,
      missionId: missionId || null,
      title: generated.title,
      description: generated.description,
      lineItems: generated.lineItems,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      invoiceDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : defaultDueDate,
      status: 'draft',
      notes: null
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

export default router;
