import { Shield, Zap, Star, CheckCircle, Award, Users, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DespreFoliePage() {
  return (
    <div className="container mx-auto px-6 py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-full">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Despre Folia de Protecție
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Descoperă tehnologia avansată din spatele foliei de protecție ScreenShield, 
          soluția premium pentru protejarea vopselei mașinii tale.
        </p>
      </div>

      {/* Caracteristici principale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Auto-regenerare</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Folia noastră se repară automat la temperaturi ridicate, 
              eliminând zgârieturile minore și păstrând aspectul impecabil.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Protecție maximă</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Protejează vopseaua de zgârieturi, pietre, insecte și alte 
              elemente care pot deteriora aspectul mașinii.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Calitate premium</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Materiale de cea mai înaltă calitate, testate și aprobate 
              pentru durabilitate și performanță excepțională.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Beneficii detaliate */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            De ce să alegi ScreenShield?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Folia noastră oferă protecție completă și durabilă pentru mașina ta
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded-full mt-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">5 ani de garanție</h3>
                <p className="text-gray-600">
                  Îți oferim garanția extinsă de 5 ani, demonstrând încrederea 
                  noastră în calitatea produsului.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full mt-1">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Durabilitate extinsă</h3>
                <p className="text-gray-600">
                  Folia rezistă la condiții extreme de vreme, UV și 
                  temperaturi variate fără să-și piardă proprietățile.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-2 rounded-full mt-1">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Aspect impecabil</h3>
                <p className="text-gray-600">
                  Păstrează strălucirea și aspectul original al vopselei, 
                  fiind aproape invizibilă după aplicare.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-2 rounded-full mt-1">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Certificări internaționale</h3>
                <p className="text-gray-600">
                  Produsul nostru este certificat conform standardelor 
                  internaționale de calitate și siguranță.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full mt-1">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Suport tehnic</h3>
                <p className="text-gray-600">
                  Echipa noastră de specialiști este disponibilă pentru 
                  asistență și sfaturi de aplicare.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 p-2 rounded-full mt-1">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Protecție completă</h3>
                <p className="text-gray-600">
                  Acoperă toate zonele vulnerabile ale mașinii, oferind 
                  protecție 360° împotriva deteriorărilor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specificații tehnice */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Specificații tehnice
          </h2>
          <p className="text-lg text-gray-600">
            Detalii despre materiale și performanță
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-2">200</div>
              <p className="text-gray-600">Microni grosime</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <p className="text-gray-600">Transparență</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">-40°C</div>
              <p className="text-gray-600">Temperatură minimă</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">+80°C</div>
              <p className="text-gray-600">Temperatură maximă</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8 md:p-12 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Protejează mașina ta acum!
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Descoperă gama completă de produse ScreenShield și alege protecția perfectă
        </p>
        <div className="flex justify-center">
          <Link href="/collection/allproducts">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Vezi toate produsele
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 