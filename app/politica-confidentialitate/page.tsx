import { ArrowLeft, Shield, User, Database, Eye } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PoliticaConfidentialitatePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politica de confidențialitate</h1>
        <p className="text-gray-600">
          Informații despre modul în care colectăm, utilizăm și protejăm datele dumneavoastră personale
        </p>
      </div>

      <div className="space-y-6">
        {/* GDPR Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Regulamentul GDPR
            </CardTitle>
            <CardDescription>
              Începând cu data de 25 mai 2018
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Începând cu data de 25 mai 2018, <strong>Regulamentul 2016/679/UE</strong> privind protecția 
              persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și privind 
              libera circulație a acestor date va fi aplicat de toate statele Uniunii Europene.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Prin intermediul acestui Regulament se dorește crearea unui cadru legislativ unitar și 
              uniform pe teritoriul Uniunii Europene care să nu mai necesite măsuri naționale de implementare.
            </p>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Operator de date
            </CardTitle>
            <CardDescription>
              Informații despre compania responsabilă
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Este responsabil pentru operarea paginii web <strong>www.screenshield.ro</strong> și are 
              calitatea de operator <strong>HRZ CUSTOM SERVICE S.R.L</strong> cu sediul în București, 
              Aleea Potaisa, Nr. 3, camera 2, bl. X2, scara A, ap. 3, având CIF RO 48935811, prin 
              reprezentant legal Tudor Alexandru.
            </p>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800 font-medium">
                ⚠️ Această pagină web se adresează exclusiv utilizatorilor cu vârsta peste 18 ani.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Colectarea datelor cu caracter personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Politica de confidențialitate descrie motivul pentru care screenshield.ro colectează 
              și utilizează datele cu caracter personal ale clienților.
            </p>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Ce date colectăm:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span>Nume și prenume</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span>Adresa de livrare</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span>Număr de telefon</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span>Adresa de email</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Când colectăm datele:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span>La momentul plasării unei comenzi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">•</span>
                  <span>În momentul creării unui cont pe site</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Purpose of Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Scopul colectării datelor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Datele sunt colectate în scopul furnizării comenzii plasate și pentru a fi împărtășite și 
              partenerilor care îndeplinesc acest obiectiv:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-1">•</span>
                <span>Firma de curierat alături de care avem încheiat un contract de colaborare</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-1">•</span>
                <span>Procesatorii serviciului de plăți online</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-1">•</span>
                <span>Furnizorul de stocare a datelor pe server</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Definitions */}
        <Card>
          <CardHeader>
            <CardTitle>Definiții importante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">„Date cu caracter personal"</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Orice informații privind o persoană fizică identificată sau identificabilă („persoana vizată"); 
                o persoană fizică identificabilă este o persoană care poate fi identificată, direct sau indirect, 
                în special prin referire la un element de identificare, cum ar fi un nume, un număr de identificare, 
                date de localizare, un identificator online, sau la unul sau mai multe elemente specifice, 
                proprii identității sale fizice, fiziologice, genetice, psihice, economice, culturale sau sociale.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">„Prelucrare"</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Înseamnă orice operațiune sau set de operațiuni efectuate asupra datelor cu caracter personal 
                sau asupra seturilor de date cu caracter personal, cu sau fără utilizarea de mijloace automatizate, 
                cum ar fi colectarea, înregistrarea, organizarea, structurarea, stocarea, adaptarea sau modificarea, 
                extragerea, consultarea, utilizarea, divulgarea prin transmitere, diseminarea sau punerea la 
                dispoziție în orice alt mod, alinierea sau combinarea, restricționarea, ștergerea sau distrugerea.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">„Operator"</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Înseamnă persoana fizică sau juridică, autoritatea publică, agenția sau alt organism care, 
                singur sau împreună cu altele, stabilește scopurile și mijloacele de prelucrare a datelor cu 
                caracter personal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Assurance */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Angajamentul nostru</h3>
                <p className="text-blue-800 leading-relaxed">
                  Vă asigurăm că datele dvs. cu caracter personal sunt prelucrate în mod legal, echitabil 
                  și transparent, doar pentru îndeplinirea scopurilor explicite care v-au fost aduse la cunoștință.
                </p>
                <p className="text-blue-800 leading-relaxed mt-2">
                  HRZ CUSTOM SERVICE S.R.L., în calitate de operator, prelucrează datele într-un mod care 
                  asigură securitatea adecvată a datelor cu caracter personal, inclusiv protecția împotriva 
                  prelucrării neautorizate sau ilegale și împotriva pierderii, a distrugerii sau a deteriorării 
                  accidentale, prin luarea de măsuri tehnice sau organizatorice corespunzătoare.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 