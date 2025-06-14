import { ArrowLeft, FileText, Building2, CreditCard, Truck, AlertTriangle, Scale } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermeniConditiiPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la magazin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termeni și condiții</h1>
        <p className="text-gray-600">
          Termenii și condițiile de utilizare a site-ului ScreenShield
        </p>
      </div>

      <div className="space-y-6">
        {/* General Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              1. Termeni și condiții generale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Folosirea site-ului <strong>www.screenshield.ro</strong> presupune acceptarea prezentelor 
              Termeni și Condiții de către utilizator.
            </p>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              2. Compania
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900">HRZ CUSTOM SERVICE S.R.L</p>
              <p className="text-gray-700">București, Aleea Potaisa, Nr. 3, camera 2, bl. X2, scara A, ap. 3</p>
              <p className="text-gray-700">CIF: RO 48935811</p>
              <p className="text-gray-700">Reprezentant legal: Tudor Alexandru</p>
              <p className="text-gray-700">IBAN: RO96BACX0000002573308000</p>
            </div>
          </CardContent>
        </Card>

        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle>3. Informații generale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Imaginile publicate pe site sunt conforme cu realitatea. Clienții www.screenshield.ro vor fi 
              întotdeauna informați dacă un produs este sau nu este în stoc, dacă se poate produce la comandă, 
              în cât timp se va prelucra și în cât timp va ajunge la ei.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Aceste informații vor fi transmise prin e-mail sau telefon. Imaginile cu produsele, ofertele, 
              prețurile și concursurile pot fi schimbate în prealabil, fără o notificare specifică.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium">
                📧 Factura fiscală va fi trimisă pe email-ul clientului.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Copyright */}
        <Card>
          <CardHeader>
            <CardTitle>4. Drepturi de autor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Accesarea și utilizarea site-ului www.screenshield.ro (inclusiv navigarea, comandarea produselor 
              sau folosirea altor funcționalități) presupun acceptarea termenilor și condițiilor de utilizare, 
              constituind un acord legal între utilizator și HRZ CUSTOM SERVICE S.R.L.
            </p>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Restricții importante:</h4>
              <ul className="space-y-1 text-red-800 text-sm">
                <li>• Este strict interzisă utilizarea oricărui element fără acordul prealabil scris</li>
                <li>• Marca ScreenShield este înregistrată și protejată legal</li>
                <li>• Orice reproducere neautorizată va fi sancționată conform legii</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Product Info and Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              6. Informații produse și prețuri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Toate prețurile afișate pe site-ul www.screenshield.ro sunt exprimate în <strong>lei (RON)</strong> și 
              includ toate taxele aplicabile, cu excepția cazurilor în care se specifică altfel.
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 font-medium">
                💰 Prețurile pot fi modificate oricând fără notificare prealabilă
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Informațiile privind modul de folosire/aplicare a produselor precum și condițiile sunt pe site, 
              unde se explică concis, iar clientul nu poate cere despăgubiri sau returnări în cazul în care 
              în timpul folosirii/aplicării produsului nu a respectat etapele explicate.
            </p>
          </CardContent>
        </Card>

        {/* Order Process */}
        <Card>
          <CardHeader>
            <CardTitle>8. Plasarea și confirmarea comenzii</CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold text-gray-900 mb-3">Plasarea comenzii se realizează prin parcurgerea următorilor pași:</h4>
            <ol className="space-y-2 text-gray-700">
              <li className="flex gap-3">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span>Selectați produsele dorite și adăugați-le în Coșul de cumpărături</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span>Faceți click pe butonul „Finalizează comanda"</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span>Furnizați datele de facturare</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span>Furnizați adresa de livrare</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                <span>Alegeți metoda de plată</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">6</span>
                <span>Bifați câmpul „de acord cu Termenii și condițiile"</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">7</span>
                <span>Plasați comanda prin click pe butonul „Plasează comanda"</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Delivery Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              10. Politica de livrare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Transportul este asigurat de către firma de curierat alături de care avem încheiat un contract de colaborare.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Livrarea este gratuită</strong> pentru comenzile ce depășesc 200 RON</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Expedierea produselor se efectuează în termen de <strong>24–48 de ore</strong> de la confirmarea comenzii</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Termenul estimativ de livrare este de <strong>2–4 zile lucrătoare</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>În situații excepționale, termenul poate fi extins fără a depăși <strong>20 de zile lucrătoare</strong></span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Complaints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              11. Sesizări și reclamații
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Pentru orice nelămurire sau nemulțumire legată de accesarea, utilizarea sau înregistrarea pe 
              site-ul www.screenshield.ro, vă rugăm să ne contactați direct prin email sau telefonic.
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">
                ⏱️ Veți primi un răspuns oficial în termen de maximum 3 zile lucrătoare
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Liability Limitation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-600" />
              13. Limitarea răspunderii contractuale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              HRZ CUSTOM SERVICE S.R.L. nu poate fi considerată responsabilă pentru nicio formă de prejudiciu 
              rezultat din utilizarea produselor în mod eronat, necorespunzător sau contrar instrucțiunilor.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-purple-800 font-medium">
                🛡️ Răspunderea companiei este limitată la valoarea efectiv încasată pentru produsul în cauză
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Force Majeure */}
        <Card>
          <CardHeader>
            <CardTitle>15. Forța majoră</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Niciuna dintre părțile contractante nu răspunde de neexecutarea la termen și/sau de executarea 
              în mod necorespunzător a oricărei obligații care îi revine în baza prezentului contract, dacă 
              neexecutarea a fost cauzată de forța majoră.
            </p>
          </CardContent>
        </Card>

        {/* Applicable Law */}
        <Card>
          <CardHeader>
            <CardTitle>16. Legea aplicabilă și jurisdicția</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Prezentul contract este guvernat și interpretat în conformitate cu <strong>legislația din România</strong>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Orice divergență va fi soluționată în primă fază pe cale amiabilă. În caz contrar, litigiul 
              va fi înaintat spre soluționare instanțelor judecătorești competente din <strong>municipiul București</strong>.
            </p>
          </CardContent>
        </Card>

        {/* Final Note */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">Acceptarea termenilor</h3>
              <p className="text-orange-800 leading-relaxed">
                Prin utilizarea site-ului, crearea unui cont sau plasarea unei comenzi, 
                acceptați în mod expres și neechivoc acești Termeni și Condiții.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 