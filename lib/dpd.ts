import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DPDPhone {
  number: string;
}

interface DPDAddress {
  countryId: number;
  siteId: number;
  streetId: number;
  streetNo: string;
  blockNo?: string;
  entranceNo?: string;
  floorNo?: string;
  apartmentNo?: string;
}

interface DPDSender {
  phone1: DPDPhone;
  contactName: string;
  email: string;
  clientId?: number;
  dropoffOfficeId?: number;
}

interface DPDRecipient {
  phone1: DPDPhone;
  clientName: string;
  email: string;
  privatePerson: boolean;
  address?: DPDAddress;
  pickupOfficeId?: number;
}

interface DPDCashOnDelivery {
  amount: number;
  processingType: 'CASH' | 'POSTAL_MONEY_TRANSFER';
}

interface DPDOptionsBeforePayment {
  option: 'OPEN';
  returnShipmentServiceId: number;
  returnShipmentPayer: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY';
}

interface DPDDeclaredValue {
  amount: number;
  fragile: boolean;
  ignoreIfNotApplicable?: boolean;
}

interface DPDAdditionalServices {
  cod?: DPDCashOnDelivery;
  obpd?: DPDOptionsBeforePayment;
  declaredValue?: DPDDeclaredValue;
}

interface DPDService {
  serviceId: number;
  additionalServices?: DPDAdditionalServices;
  pickupDate?: string;
  autoAdjustPickupDate?: boolean;
  saturdayDelivery?: boolean;
}

interface DPDContent {
  parcelsCount: number;
  totalWeight: number;
  contents: string;
  package: string;
}

interface DPDPayment {
  courierServicePayer: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY';
  declaredValuePayer?: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY';
}

interface DPDShipmentRequest {
  userName: string;
  password: string;
  language: string;
  sender: DPDSender;
  recipient: DPDRecipient;
  service: DPDService;
  content: DPDContent;
  payment: DPDPayment;
  ref1?: string;
}

interface DPDParcelResponse {
  id: string;
  seqNo: number;
}

interface DPDShipmentResponse {
  id: string;
  parcels: DPDParcelResponse[];
  pickupDate: string;
  price: {
    amount: number;
    vat: number;
    total: number;
    currency: string;
    details: any;
    amountLocal: number;
    vatLocal: number;
    totalLocal: number;
    currencyLocal: string;
    detailsLocal: any;
    currencyExchangeRateUnit: number;
    currencyExchangeRate: number;
  };
  deliveryDeadline: string;
  labelUrl?: string;
  error?: {
    code: number;
    message: string;
  };
}

interface DPDCancelShipmentRequest {
  shipmentId: string;
  comment: string;
}

interface DPDCancelShipmentResponse {
  success?: boolean;
  error?: {
    code: number;
    message: string;
  };
}

interface DPDCalculationRequest {
  sender?: {
    clientId?: number;
    dropoffOfficeId?: number;
  };
  recipient: {
    privatePerson: boolean;
    addressLocation?: {
      siteId: number;
    };
    pickupOfficeId?: number;
  };
  service: {
    autoAdjustPickupDate: boolean;
    serviceIds: number[];
    additionalServices?: {
      cod?: {
        amount: number;
        processingType: 'CASH' | 'POSTAL_MONEY_TRANSFER';
      };
      obpd?: {
        option: 'OPEN';
        returnShipmentServiceId: number;
        returnShipmentPayer: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY';
      };
      declaredValue?: {
        amount: number;
        fragile: boolean;
        ignoreIfNotApplicable?: boolean;
      };
    };
  };
  content: {
    parcelsCount: number;
    totalWeight: number;
  };
  payment: {
    courierServicePayer: 'SENDER' | 'RECIPIENT' | 'THIRD_PARTY';
  };
}

interface DPDCalculationResponse {
  calculations: Array<{
    serviceId: number;
    price: {
      amount: number;
      currency: string;
      vat: number;
    };
    pickupDate: string;
    deliveryDeadline: string;
    deliveryDeadlineWorkDayType: string;
  }>;
}

interface DPDTrackingParcel {
  id: string;
}

interface DPDTrackingRequest {
  userName: string;
  password: string;
  language: string;
  parcels: DPDTrackingParcel[];
  lastOperationOnly?: boolean;
}

interface DPDTrackingOperation {
  date: string;
  status: string;
  operationCode: string;
  description: string;
  terminal: string;
  terminalId: number;
}

interface DPDTrackingParcelResponse {
  id: string;
  operations: DPDTrackingOperation[];
}

interface DPDTrackingResponse {
  parcels: DPDTrackingParcelResponse[];
}

class DPDClient {
  private config: {
    username: string;
    password: string;
    baseUrl: string;
  };

  constructor(config: { username: string; password: string; baseUrl: string }) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    console.log(`🌐 Making DPD API request to ${endpoint}`, {
      requestData: data,
      username: this.config.username ? 'Set' : 'Not set',
      baseUrl: this.config.baseUrl
    });

    try {
      const response = await axios.post<T>(`${this.config.baseUrl}${endpoint}`, {
        ...data,
        userName: this.config.username,
        password: this.config.password,
        language: 'RO'
      });

      console.log(`✅ DPD API response from ${endpoint}:`, response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as any;
      console.error(`❌ DPD API error for ${endpoint}:`, {
        error: axiosError.response?.data || axiosError.message,
        status: axiosError.response?.status
      });
      if (axiosError.isAxiosError) {
        throw new Error(`DPD API Error: ${axiosError.response?.data?.message || axiosError.message}`);
      }
      throw error;
    }
  }

  async createShipment(data: Omit<DPDShipmentRequest, 'userName' | 'password' | 'language'>): Promise<DPDShipmentResponse> {
    return this.makeRequest<DPDShipmentResponse>('/shipment/', data);
  }

  async findCountry(name: string): Promise<number> {
    console.log('🔍 Finding country:', name);
    const response = await this.makeRequest<any>('/location/country', { name });
    console.log('📍 Country search result:', response);
    return response.countries[0]?.id;
  }

  async findSite(countryId: number, name: string): Promise<number> {
    console.log('🔍 Finding site:', { countryId, name });
    const response = await this.makeRequest<any>('/location/site', { countryId, name });
    console.log('📍 Site search result:', response);
    return response.sites[0]?.id;
  }

  async findStreet(siteId: number, name: string): Promise<number> {
    const response = await this.makeRequest<any>('/location/street', { siteId, name });
    return response.streets[0]?.id;
  }

  async findOffice(countryId: number, siteId: number): Promise<number> {
    const response = await this.makeRequest<any>('/location/office', { countryId, siteId });
    return response.offices[0]?.id;
  }

  async cancelShipment(shipmentId: string, comment: string): Promise<DPDCancelShipmentResponse> {
    return this.makeRequest<DPDCancelShipmentResponse>('/shipment/cancel', {
      shipmentId,
      comment
    });
  }

  async calculatePrice(data: Omit<DPDShipmentRequest, 'userName' | 'password' | 'language'>): Promise<{
    total: number;
    currency: string;
    vat: number;
  }> {
    console.log('💰 Starting price calculation with data:', JSON.stringify(data, null, 2));
    
    const response = await this.makeRequest<DPDCalculationResponse>('/calculate/', data);
    console.log('💰 Raw calculation response:', JSON.stringify(response, null, 2));

    if (!response.calculations?.[0]?.price) {
      console.error('❌ Invalid price calculation response:', response);
      throw new Error('Invalid price calculation response from DPD');
    }

    const calculation = response.calculations[0];
    const result = {
      total: calculation.price.amount,
      currency: calculation.price.currency,
      vat: calculation.price.vat
    };
    
    console.log('✅ Final price calculation result:', result);
    return result;
  }

  async trackParcels(parcelIds: string[], lastOperationOnly: boolean = false): Promise<DPDTrackingResponse> {
    const parcels = parcelIds.map(id => ({ id }));
    const trackingRequest: DPDTrackingRequest = {
      userName: this.config.username,
      password: this.config.password,
      language: 'RO',
      parcels,
      lastOperationOnly
    };
    return this.makeRequest<DPDTrackingResponse>('/track/', trackingRequest);
  }
}

export const dpdClient = new DPDClient({
  username: process.env.DPD_USERNAME || '',
  password: process.env.DPD_PASSWORD || '',
  baseUrl: process.env.DPD_API_URL || ''
});

// Helper function to cancel DPD shipment
export async function cancelDPDShipment(orderId: string): Promise<boolean> {
  try {
    console.log('Începem procesul de anulare DPD pentru comanda:', orderId);
    
    // Verificăm dacă comanda are expediere DPD
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        courier: true,
        awb: true,
        dpdShipmentId: true,
      },
    });

    console.log('Detalii comandă găsite:', order);

    if (!order || order.courier !== 'DPD' || !order.dpdShipmentId) {
      console.log('Comanda nu are expediere DPD sau nu există:', {
        exists: !!order,
        courier: order?.courier,
        hasDpdId: !!order?.dpdShipmentId
      });
      return false;
    }

    console.log('Trimitem cererea de anulare către DPD pentru shipmentId:', order.dpdShipmentId);
    
    // Anulăm expedierea în DPD folosind ID-ul lor
    const response = await dpdClient.cancelShipment(
      order.dpdShipmentId,
      'Anulare automată - comandă anulată'
    );

    console.log('Răspuns de la DPD:', response);

    if (response.error) {
      console.error(`DPD Error when canceling shipment: ${response.error.message}`);
      return false;
    }

    console.log('Actualizăm comanda în baza de date...');

    // Actualizăm comanda în baza de date
    await prisma.order.update({
      where: { id: orderId },
      data: {
        courier: null,
        awb: null,
        dpdShipmentId: null,
      },
    });

    console.log('Anulare finalizată cu succes');
    return true;
  } catch (error) {
    console.error('Error canceling DPD shipment:', error);
    return false;
  }
}

export async function createDPDShipmentForOrder(order: any, orderDetails: any) {
  try {
    console.log('=== Starting DPD shipment creation ===');
    console.log('Order details:', {
      id: order.id,
      items: order.items.length,
      recipient: orderDetails.fullName,
      city: orderDetails.city,
      street: orderDetails.street
    });

    console.log('Checking DPD configuration:', {
      username: process.env.DPD_USERNAME ? 'Set' : 'Not set',
      password: process.env.DPD_PASSWORD ? 'Set' : 'Not set',
      apiUrl: process.env.DPD_API_URL,
      companyName: process.env.COMPANY_NAME,
      companyPhone: process.env.COMPANY_PHONE ? 'Set' : 'Not set',
      companyEmail: process.env.COMPANY_EMAIL ? 'Set' : 'Not set'
    });
    
    // Folosim ID-ul confirmat pentru România
    const countryId = 642;
    console.log('Căutăm ID-ul pentru orașul:', orderDetails.city);
    const siteId = await dpdClient.findSite(countryId, orderDetails.city.toUpperCase());
    
    if (!siteId) {
      throw new Error(`Nu am putut găsi orașul ${orderDetails.city} în sistemul DPD`);
    }
    console.log('Site ID găsit:', siteId);
    
    // Folosim numele străzii direct din câmpul street
    const streetName = orderDetails.street.trim().toUpperCase();
    console.log('Căutăm ID-ul pentru strada:', streetName);
    const streetId = await dpdClient.findStreet(siteId, streetName);
    
    if (!streetId) {
      throw new Error(`Nu am putut găsi strada ${streetName} în sistemul DPD`);
    }
    console.log('Street ID găsit:', streetId);

    // Folosim numărul străzii din câmpul streetNumber sau extragem din street
    let streetNo = orderDetails.streetNumber || '1';
    if (!orderDetails.streetNumber && orderDetails.street) {
      const streetMatch = orderDetails.street.match(/\d+/);
      streetNo = streetMatch ? streetMatch[0] : '1';
    }
    console.log('Număr stradă extras:', streetNo);

    // Calculăm greutatea totală a comenzii
    const totalWeight = order.items.reduce((total: number, item: any) => {
      const itemWeight = (item.product.weight || 0) * item.quantity;
      console.log(`Greutate pentru ${item.product.name}: ${itemWeight}kg (${item.product.weight}kg x ${item.quantity})`);
      return total + itemWeight;
    }, 0);

    console.log('Greutate totală calculată:', totalWeight);

    const shipmentData = {
      sender: {
        phone1: {
          number: process.env.COMPANY_PHONE || '',
        },
        contactName: process.env.COMPANY_NAME || '',
        email: process.env.COMPANY_EMAIL || '',
      },
      recipient: {
        phone1: {
          number: orderDetails.phoneNumber.replace(/\s+/g, ''),
        },
        clientName: orderDetails.fullName,
        email: orderDetails.email,
        privatePerson: true,
        address: {
          countryId,
          siteId,
          streetId,
          streetNo,
        },
      },
      service: {
        serviceId: 2505, // CLASSIC service
        autoAdjustPickupDate: true,
      },
      content: {
        parcelsCount: 1,
        totalWeight: Math.max(1, totalWeight), // Minimum 1kg
        contents: order.items.map((item: any) => item.product.name).join(', '),
        package: 'BOX',
      },
      payment: {
        courierServicePayer: 'SENDER' as const,
      },
      ref1: order.id,
      shipmentId: order.id,
    };

    console.log('Datele pentru expedierea DPD:', JSON.stringify(shipmentData, null, 2));
    console.log('Trimitem cererea către DPD...');
    
    const dpdResponse = await dpdClient.createShipment(shipmentData);
    console.log('Răspuns primit de la DPD:', JSON.stringify(dpdResponse, null, 2));

    if (dpdResponse.error) {
      throw new Error(`DPD Error: ${dpdResponse.error.message}`);
    }

    console.log('Expediere creată cu succes în DPD. Actualizăm comanda cu AWB:', dpdResponse.parcels[0].id);

    // Actualizăm comanda cu AWB-ul primit
    let updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        courier: 'DPD',
        awb: dpdResponse.parcels[0].id,
        dpdShipmentId: dpdResponse.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                weight: true
              }
            }
          }
        },
        details: true,
        discountCodes: {
          include: {
            discountCode: true
          }
        }
      }
    });

    // Facem tracking imediat pentru a obține statusul inițial
    try {
      console.log('Obținem statusul inițial de la DPD pentru AWB:', dpdResponse.parcels[0].id);
      const trackingResponse = await dpdClient.trackParcels([dpdResponse.parcels[0].id], false);
      
      if (trackingResponse.parcels?.[0]?.operations?.length > 0) {
        const lastOperation = trackingResponse.parcels[0].operations[trackingResponse.parcels[0].operations.length - 1];
        if (lastOperation?.status) {
          console.log('Status inițial primit de la DPD:', lastOperation.status);
          updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { 
              orderStatus: lastOperation.status,
              dpdOperationCode: lastOperation.operationCode
            },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      images: true,
                      weight: true
                    }
                  }
                }
              },
              details: true,
              discountCodes: {
                include: {
                  discountCode: true
                }
              }
            }
          });
          console.log(`✅ Status actualizat pentru comanda ${order.id}: ${lastOperation.status} (${lastOperation.operationCode})`);
        }
      }
    } catch (trackingError) {
      console.error('Eroare la obținerea statusului inițial DPD:', trackingError);
      // Nu aruncăm eroarea mai departe, deoarece expedierea a fost creată cu succes
    }

    console.log('Comanda actualizată cu succes');
    return updatedOrder;
  } catch (error: any) {
    console.error('=== Eroare la crearea expedierii DPD ===');
    console.error('Detalii eroare:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.type,
      raw: error.raw
    });
    throw error;
  }
} 