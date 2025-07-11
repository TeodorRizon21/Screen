// Configurația pentru Oblio API
const OblioApi = require('@obliosoftware/oblioapi').default;
const { AccessTokenHandlerFileStorage } = require('@obliosoftware/oblioapi');

// Funcție pentru a obține instanța Oblio API cu variabilele de mediu curente
function getOblioApi() {
  const email = process.env.OBLIO_EMAIL;
  const apiSecret = process.env.OBLIO_API_SECRET;
  
  console.log('=== DEBUG VARIABILE DE MEDIU OBLIO ===');
  console.log('OBLIO_EMAIL:', email ? `"${email}"` : 'UNDEFINED');
  console.log('OBLIO_API_SECRET:', apiSecret ? `"${apiSecret.substring(0, 4)}..."` : 'UNDEFINED');
  console.log('Toate variabilele de mediu:', Object.keys(process.env).filter(key => key.includes('OBLIO')));
  console.log('=== SFÂRȘIT DEBUG ===');
  
  if (!email || !apiSecret) {
    throw new Error(`Variabilele de mediu Oblio nu sunt setate corect. Email: ${email ? 'SET' : 'NOT SET'}, API Secret: ${apiSecret ? 'SET' : 'NOT SET'}`);
  }
  
  console.log('Configurația pentru OblioApi constructor:', {
    email: email,
    apiSecret: apiSecret ? `${apiSecret.substring(0, 4)}...` : 'UNDEFINED'
  });
  
  // Constructorul așteaptă: email, apiSecret, accessTokenHandler
  const accessTokenHandler = new AccessTokenHandlerFileStorage();
  return new OblioApi(email, apiSecret, accessTokenHandler);
}

export interface OblioInvoiceData {
  cif: string;
  nume: string;
  email: string;
  telefon: string;
  adresa: string;
  oras: string;
  judet: string;
  codPostal: string;
  tara: string;
  items: {
    nume: string;
    pret: number;
    cantitate: number;
    um: string;
  }[];
  total: number;
  orderNumber: string | null;
  orderDate: string;
  note?: string;
}

export interface OblioCompanyData {
  cif: string;
  nume: string;
  email: string;
  telefon: string;
  adresa: string;
  oras: string;
  judet: string;
  codPostal: string;
  tara: string;
}

// Datele companiei tale (ScreenShield)
export const COMPANY_DATA: OblioCompanyData = {
  cif: process.env.COMPANY_CIF || 'RO12345678',
  nume: 'ScreenShield SRL',
  email: 'contact@screenshield.ro',
  telefon: '+40 123 456 789',
  adresa: 'Bulevardul Timișoara 161',
  oras: 'București',
  judet: 'Sector 6',
  codPostal: '061344',
  tara: 'România'
};

/**
 * Generează o factură în Oblio
 */
export async function generateOblioInvoice(invoiceData: OblioInvoiceData & { isCompany?: boolean }) {
  try {
    console.log('=== ÎNCEPERE GENERARE FACTURĂ OBLIO ===');
    console.log('Configurația Oblio API:', {
      email: process.env.OBLIO_EMAIL ? 'SET' : 'NOT SET',
      apiSecret: process.env.OBLIO_API_SECRET ? 'SET' : 'NOT SET',
      companyCif: process.env.COMPANY_CIF ? 'SET' : 'NOT SET',
    });
    
    // Obținem instanța Oblio API și generăm token de acces
    console.log('Obținem instanța Oblio API...');
    const oblioApi = getOblioApi();
    console.log('Generăm token de acces pentru Oblio API...');
    await oblioApi.getAccessToken();
    console.log('Token de acces generat cu succes');

    // Construim payloadul complet conform Oblio
    const isCompany = invoiceData.isCompany || false;
    const clientCif = isCompany && invoiceData.cif && invoiceData.cif !== 'RO00000000' ? invoiceData.cif : '';
    const clientName = invoiceData.nume;
    const clientAddress = invoiceData.adresa;
    const clientCity = invoiceData.oras;
    const clientCounty = invoiceData.judet;
    const clientCountry = invoiceData.tara;
    const clientEmail = invoiceData.email;
    const clientPhone = invoiceData.telefon;

    const seriesName = process.env.OBLIO_SERIES_NAME || 'SS';
    const data: any = {
      cif: process.env.COMPANY_CIF, // CIF-ul firmei tale (emitent)
      client: {
        cif: clientCif,
        name: clientName,
        address: clientAddress,
        city: clientCity,
        state: clientCounty,
        country: clientCountry,
        email: clientEmail,
        phone: clientPhone,
      },
      issueDate: invoiceData.orderDate,
      dueDate: '',
      deliveryDate: '',
      collectDate: '',
      seriesName, // seria facturii din env
      collect: {},
      referenceDocument: {},
      language: 'RO',
      precision: 2,
      currency: 'RON',
      products: invoiceData.items.map(item => ({
        name: item.nume,
        price: item.pret,
        measuringUnit: item.um,
        currency: 'RON',
        vatName: 'Normala',
        vatPercentage: 19,
        vatIncluded: true,
        quantity: item.cantitate,
        productType: 'Serviciu',
      })),
      issuerName: '',
      issuerId: '',
      noticeNumber: '',
      internalNote: '',
      deputyName: '',
      deputyIdentityCard: '',
      deputyAuto: '',
      selesAgent: '',
      mentions: invoiceData.note || '',
      value: invoiceData.total,
      workStation: 'Sediu',
      useStock: 0,
    };

    console.log('Payload pentru factură (Oblio oficial):', JSON.stringify(data, null, 2));

    // Creăm factura folosind metoda corectă
    console.log('Apelăm Oblio API pentru crearea facturii...');
    const response = await oblioApi.createInvoice(data);
    
    console.log('Răspunsul de la Oblio API:', JSON.stringify(response, null, 2));
    
    if (response.status === 200 && response.data) {
      // Extragem ID-ul din URL-ul link-ului dacă nu există în răspuns
      let invoiceId = response.data.id || response.data._id;
      if (!invoiceId && response.data.link) {
        const urlMatch = response.data.link.match(/id=(\d+)/);
        if (urlMatch) {
          invoiceId = urlMatch[1];
        }
      }
      
      const result = {
        success: true,
        invoiceId: invoiceId,
        invoiceNumber: response.data.number || response.data.numar,
        pdfUrl: response.data.link || response.data.pdf || response.data.pdfUrl,
        xmlUrl: response.data.einvoice || response.data.xml || response.data.xmlUrl
      };
      console.log('Factură generată cu succes:', result);
      console.log('=== FINALIZARE GENERARE FACTURĂ OBLIO ===');
      return result;
    } else {
      throw new Error(`Oblio API error: ${response.message || response.statusMessage}`);
    }

  } catch (error) {
    console.error('=== EROARE LA GENERAREA FACTURII OBLIO ===');
    console.error('Error generating Oblio invoice:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== SFÂRȘIT EROARE ===');
    throw error;
  }
}

/**
 * Descarcă factura în format PDF
 */
export async function downloadOblioInvoice(invoiceId: string) {
  try {
    console.log('=== ÎNCEPERE DESCĂRCARE FACTURĂ OBLIO ===');
    const oblioApi = getOblioApi();
    
    // Generăm token-ul de acces
    console.log('Generăm token de acces pentru Oblio API...');
    await oblioApi.getAccessToken();
    console.log('Token de acces generat cu succes');
    
    console.log(`Descărcăm factura cu ID: ${invoiceId}`);
    const response = await oblioApi.getInvoice({
      id: invoiceId
    });

    console.log('Răspuns de la Oblio:', JSON.stringify(response, null, 2));

    if (response.status === 200 || response.status === 'success') {
      console.log('Factură descărcată cu succes');
      console.log('=== FINALIZARE DESCĂRCARE FACTURĂ OBLIO ===');
      return {
        success: true,
        pdfUrl: response.data.link || response.data.pdf || response.data.pdfUrl,
        xmlUrl: response.data.einvoice || response.data.xml || response.data.xmlUrl
      };
    } else {
      throw new Error(`Failed to get invoice: ${response.message || response.statusMessage}`);
    }

  } catch (error) {
    console.error('=== EROARE LA DESCĂRCAREA FACTURII OBLIO ===');
    console.error('Error downloading Oblio invoice:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=== SFÂRȘIT EROARE ===');
    throw error;
  }
}

/**
 * Obține lista de facturi
 */
export async function getOblioInvoices(page = 1, limit = 50) {
  try {
    const oblioApi = getOblioApi();
    const response = await oblioApi.getInvoices({
      page,
      limit
    });

    if (response.status === 'success') {
      return {
        success: true,
        invoices: response.data,
        total: response.data.length // Corectat pentru a folosi length în loc de total
      };
    } else {
      throw new Error(`Failed to get invoices: ${response.message}`);
    }

  } catch (error) {
    console.error('Error getting Oblio invoices:', error);
    throw error;
  }
}

/**
 * Anulează o factură
 */
export async function cancelOblioInvoice(invoiceId: string) {
  try {
    const oblioApi = getOblioApi();
    const response = await oblioApi.cancelInvoice({
      id: invoiceId
    });

    if (response.status === 'success') {
      return {
        success: true,
        message: 'Invoice cancelled successfully'
      };
    } else {
      throw new Error(`Failed to cancel invoice: ${response.message}`);
    }

  } catch (error) {
    console.error('Error cancelling Oblio invoice:', error);
    throw error;
  }
} 