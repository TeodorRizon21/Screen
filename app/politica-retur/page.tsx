import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PoliticaReturPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politica de returnare</h1>
        <p className="text-gray-600">
          Informații complete despre procesul de returnare a produselor ScreenShield
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Politica de returnare ScreenShield</CardTitle>
          <CardDescription>
            Conform legislației în vigoare OUG 34/2014
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none space-y-6">
          <div>
            <p className="text-gray-700 leading-relaxed">
              Conform legislației în vigoare <strong>OUG 34/2014</strong>, clienții au dreptul de a returna 
              produsele achiziționdate online, fără a invoca un motiv, în termen de <strong>14 zile calendaristice</strong> de 
              la data primirii produsului, completând formularul disponibil pe site.
            </p>

            <p className="text-gray-700 leading-relaxed mt-4">
              In cazul in care ati comandat un produs pentru care pe site sunt specificate marca, modelul, anii de fabricație și/sau dimensiunile, iar acesta nu corespunde acestor detalii, vă vom returna integral contravaloarea, chiar dacă produsul (folia) prezintă urme de folosire și nu mai este în starea inițială. 
              In cazul in care produsul a fost comandat incorect, deși pe site sunt oferite toate informațiile necesare privind marca, modelul, anii de fabricație și dimensiunile, iar folia prezintă urme de folosire sau a fost desfăcută, returul nu va fi acceptat. Responsabilitatea alegerii corecte aparține cumpărătorului, care are obligația de a verifica și măsura în prealabil compatibilitatea produsului cu vehiculul său.



            </p>

            <p className="text-gray-700 leading-relaxed mt-4">
              Pentru informații adiționale contactați-ne la adresa de email din secțiunea contact.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Pentru informații adiționale contactați-ne la adresa de email din secțiunea contact.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Condiții pentru returnare:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span>Produsul trebuie să fie în aceeași stare în care a fost livrat: nefolosit, fără urme de uzură, cu toate accesoriile aferente.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span>Returnarea se face pe cheltuiala clientului, adresa de retur fiind <strong>Bulevardul Timișoara 161, Sector 6, București, cod poștal 061327</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span>Rambursarea sumei achitate se face în cel mult 14 zile calendaristice de la primirea returului, în contul bancar specificat de client.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span>Nu se acceptă returul produselor care prezintă urme de utilizare, deteriorări sau care nu pot fi repuse în vânzare ca produse noi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span>Nu se acceptă returul produselor care au fost personalizate.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">•</span>
                <span>Un produs nu se poate returna în cazul în care clientul nu a reușit să îl instaleze conform, deși acesta era într-o stare bună, iar instrucțiunile de aplicare au fost oferite pe site.</span>
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Formular de retur</h3>
            <p className="text-gray-700 mb-4">
              Pentru a returna un produs, vă rugăm să completați formularul nostru online cu următoarele informații:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 mb-4">
              <li>• Nume, Prenume</li>
              <li>• Email, Telefon</li>
              <li>• Produs returnat</li>
              <li>• Motiv retur</li>
              <li>• Nume titular cont</li>
              <li>• Bancă, Cont IBAN</li>
            </ul>
            <Link 
              href="/return-form"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Completează formularul de retur
            </Link>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600">
              <strong>Notă:</strong> Această politică de returnare este în conformitate cu legislația română 
              și europeană privind protecția consumatorilor și se aplică tuturor produselor comercializate 
              prin intermediul site-ului ScreenShield.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 