declare module '@obliosoftware/oblioapi' {
  export interface OblioConfig {
    email: string;
    apiSecret: string;
  }

  export interface OblioResponse<T = any> {
    status: 'success' | 'error';
    message?: string;
    data: T;
  }

  export interface OblioInvoicePayload {
    cif: string;
    nume: string;
    email: string;
    telefon: string;
    adresa: string;
    oras: string;
    judet: string;
    codPostal: string;
    tara: string;
    serie: string;
    numar?: string;
    data: string;
    scadenta?: string;
    valuta: string;
    valoare: number;
    tva: number;
    items: {
      nume: string;
      pret: number;
      cantitate: number;
      um: string;
      tva: number;
    }[];
    note?: string;
    status?: 'draft' | 'emisa';
  }

  export interface OblioInvoice {
    id?: string;
    number?: string;
    numar?: string;
    seriesName?: string;
    link?: string;
    einvoice?: string;
    pdf?: string;
    xml?: string;
    total?: string;
  }

  export interface OblioCompany {
    id: string;
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

  export interface OblioCompanyPayload {
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

  export interface OblioNomenclator {
    createInvoice(payload: OblioInvoicePayload): Promise<OblioResponse<OblioInvoice>>;
    getInvoice(params: { id: string }): Promise<OblioResponse<OblioInvoice>>;
    getInvoices(params: { page?: number; limit?: number }): Promise<OblioResponse<OblioInvoice[]>>;
    cancelInvoice(params: { id: string }): Promise<OblioResponse<any>>;
    getCompanies(params: { cif?: string }): Promise<OblioResponse<OblioCompany[]>>;
    createCompany(payload: OblioCompanyPayload): Promise<OblioResponse<OblioCompany>>;
  }

  export class OblioApi {
    constructor(config: OblioConfig);
    nomenclator: OblioNomenclator;
  }
} 