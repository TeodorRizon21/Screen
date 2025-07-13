# Configurarea Oblio API pentru ScreenShield

## Pași pentru configurare:

### 1. Cont Oblio
- Creează un cont pe [Oblio.eu](https://www.oblio.eu)
- Activează API-ul din setările contului
- Obține email-ul și API Secret-ul

### 2. Variabile de mediu
Adaugă următoarele variabile în fișierul `.env`:

```env
# Oblio API
OBLIO_EMAIL=your_oblio_email
OBLIO_API_SECRET=your_oblio_api_secret

# Company Information for Oblio
COMPANY_CIF=RO12345678
```

### 3. Configurarea companiei
Editează datele companiei în `lib/oblio.ts`:

```typescript
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
```

### 4. Seria facturilor
În `lib/oblio.ts`, modifică seria facturilor:

```typescript
serie: 'SS', // Schimbă cu seria ta de facturi
```

### 5. Actualizarea bazei de date
Rulează migrarea pentru a adăuga câmpurile Oblio:

```bash
npx prisma db push
```

## Funcționalități implementate:

### Generarea automată de facturi
- **Facturile se generează automat la fiecare comandă**
- Facturile sunt create cu status "draft" (poți schimba în "emisa")
- Clientii sunt creați automat în Oblio dacă nu există
- Nu mai este necesar butonul manual de generare

### Descărcarea facturilor
- API pentru descărcarea facturilor în format PDF și XML
- Integrare cu sistemul existent de facturi
- Badge-uri în panoul de administrare pentru a vedea statusul facturilor

### Gestionarea clienților
- Căutarea automată a clienților după CIF
- Crearea automată a clienților noi în Oblio

## Note importante:

1. **CIF-ul clientului**: Dacă clientul nu are CIF, se folosește "00000000"
2. **TVA**: Setat la 19% (standard în România)
3. **Valuta**: RON
4. **Status factură**: Implicit "draft" - poți schimba în "emisa" pentru emitere automată

## Testare:

1. Creează o comandă de test din frontend
2. Factura Oblio va fi generată automat la crearea comenzii
3. Mergi în panoul de administrare la secțiunea "Comenzi"
4. Verifică că comanda are badge-ul "Factură: [număr]" în loc de "Fără factură"
5. Testează descărcarea facturii cu butonul de download
6. Verifică în contul Oblio că factura a fost creată

## Suport:

Pentru probleme cu Oblio API, consultă:
- [Documentația oficială](https://www.oblio.eu/api)
- [Exemplul de implementare](https://github.com/OblioSoftware/OblioApiJs) 