# Migrarea Câmpurilor Commune și LocationType

## Descriere

Această migrare adaugă suport pentru distingerea între orașe și sate în sistemul de comandă, permițând utilizatorilor să specifice comuna când selectează un sat.

## Modificări Implementate

### 1. Schema Prisma
- Adăugat câmpul `commune` (String?) pentru a stoca comuna pentru sate
- Adăugat câmpul `locationType` (String?) pentru a distinge între "city" și "village"

### 2. Formular de Comandă (OrderDetailsForm.tsx)
- Adăugat selector radio pentru a alege între "Oraș" și "Sat"
- Câmpul pentru comună apare doar când se selectează "Sat"
- Validare pentru a asigura că comuna este completată când se selectează sat

### 3. API-uri Actualizate
- `order-details/route.ts` - Include noile câmpuri în crearea detaliilor comenzii
- `create-checkout-session/route.ts` - Include noile câmpuri în metadata
- `webhook/route.ts` - Actualizat interfața OrderDetails
- `create-order/route.ts` - Include noile câmpuri în procesarea comenzii

### 4. Logica DPD Îmbunătățită
- Implementat sistem de bypass pentru străzi care nu sunt găsite în baza de date DPD
- Când o stradă nu este găsită, sistemul încearcă străzi alternative:
  1. "PRINCIPALĂ"
  2. "CENTRALĂ" 
  3. "1 DECEMBRIE"
  4. "REPUBLICII"
- Dacă niciuna nu este găsită, comanda continuă fără expediere DPD

### 5. Componente Actualizate
- `OrdersContent.tsx` - Afișează comuna în detaliile comenzii
- `AdminOrderList.tsx` - Afișează comuna în panoul de administrare
- `email.tsx` - Include comuna în emailurile de confirmare

### 6. Tipuri TypeScript
- Actualizate toate interfețele OrderDetails pentru a include noile câmpuri

## Rularea Migrării

### Opțiunea 1: Script de Migrare
```bash
cd compecom-main
node scripts/migrate-commune.js
```

### Opțiunea 2: Migrare Manuală
1. Rulare Prisma generate:
```bash
npx prisma generate
```

2. Pentru MongoDB, câmpurile vor fi create automat când se vor adăuga primele înregistrări cu noile câmpuri.

## Funcționalități Noi

### Selectarea Oraș/Sat
- Utilizatorii pot alege între "Oraș" și "Sat"
- Când se selectează "Sat", apare un câmp obligatoriu pentru comună
- Când se selectează "Oraș", câmpul pentru comună dispare

### Bypass DPD
- Sistemul nu mai eșuează când o stradă nu este găsită în baza de date DPD
- Încearcă străzi alternative comune în România
- Comanda continuă să funcționeze chiar dacă expedierea DPD nu poate fi creată

### Afișarea Adreselor
- În toate locurile unde se afișează adresa, comuna este inclusă când este relevantă
- Format: "Oraș, Comuna, Județ" pentru sate
- Format: "Oraș, Județ" pentru orașe

## Compatibilitate

- Toate comenzile existente vor avea `locationType: 'city'` și `commune: null` ca valori default
- Sistemul este complet compatibil cu comenzile existente
- Nu sunt necesare modificări pentru comenzile anterioare

## Testare

1. Testează crearea unei comenzi cu oraș
2. Testează crearea unei comenzi cu sat și comună
3. Testează că comenzile cu străzi inexistente în DPD continuă să funcționeze
4. Verifică că emailurile afișează corect adresa cu comuna

## Note Importante

- Câmpul `commune` este opțional și apare doar pentru sate
- Câmpul `locationType` are valoarea default "city"
- Logica DPD de bypass nu afectează comenzile cu străzi valide
- Toate componentele existente continuă să funcționeze normal 