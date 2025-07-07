import { prisma } from './prisma';

export async function generateOrderNumber(): Promise<string> {
  // Găsim ultima comandă sortată după data creării în ordine descrescătoare
  const lastOrder = await prisma.order.findFirst({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      orderNumber: true
    }
  });

  if (!lastOrder?.orderNumber) {
    return 'SSA0001'; // Prima comandă
  }

  const currentNumber = lastOrder.orderNumber;
  
  // Extragem părțile din numărul curent
  const prefix = currentNumber.slice(0, -4); // SS sau SSA sau SSAA etc
  const number = parseInt(currentNumber.slice(-4));

  if (number < 9999) {
    // Incrementăm numărul și păstrăm prefixul
    return `${prefix}${(number + 1).toString().padStart(4, '0')}`;
  }

  // Dacă am ajuns la 9999, trebuie să schimbăm prefixul
  if (prefix === 'SS') {
    return 'SSA0001';
  }

  if (prefix.length === 3) { // SSA până la SSZ
    const lastChar = prefix.charAt(2);
    if (lastChar === 'Z') {
      return 'SSAA0001';
    }
    return `SS${String.fromCharCode(prefix.charCodeAt(2) + 1)}0001`;
  }

  if (prefix.length === 4) { // SSAA până la SSZZ
    const lastChar = prefix.charAt(3);
    const secondLastChar = prefix.charAt(2);

    if (lastChar === 'Z') {
      if (secondLastChar === 'Z') {
        throw new Error('Maximum order number reached (SSZZ9999)');
      }
      return `SS${String.fromCharCode(secondLastChar.charCodeAt(0) + 1)}A0001`;
    }
    return `${prefix.slice(0, -1)}${String.fromCharCode(lastChar.charCodeAt(0) + 1)}0001`;
  }

  throw new Error('Invalid order number format');
} 