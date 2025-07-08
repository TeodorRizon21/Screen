import { Shield, Zap, Star, CheckCircle, Award, Users, Clock, Sparkles, Smartphone, Layers, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DespreFoliePage() {
  return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 sm:space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                <Smartphone className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Folie PPF pentru Display Auto
            </h1>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
              Protecție Premium și Claritate Maximă
            </p>
          </div>
        </div>

        {/* Descriere principală */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl"></div>
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 shadow-xl border border-white/20">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Protecție Premium pentru Display-ul Mașinii Tale
                </h2>
              </div>
              
              <div className="max-w-5xl mx-auto">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100">
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-medium">
                    Protejează display-ul mașinii tale cu o folie PPF de înaltă calitate, creată special pentru a oferi durabilitate, estetică și funcționalitate. Cu o grosime de peste 200 de microni, această folie reprezintă bariera ideală împotriva zgârieturilor, urmelor de utilizare și a impurităților accidentale.
                  </p>
                </div>
              </div>
            </div>
        </div>

        {/* Caracteristici principale */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Caracteristici Principale
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center font-bold text-gray-800">Efect de auto-regenerare</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-700 text-center text-lg leading-relaxed">
                  Zgârieturile fine dispar datorită tehnologiei inteligente din compoziția foliei.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <Star className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center font-bold text-gray-800">Textură fină la atingere</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-700 text-center text-lg leading-relaxed">
                  Ideală pentru o utilizare confortabilă și naturală.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Variante disponibile */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-3xl"></div>
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 shadow-xl border border-white/20">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Disponibilă în două variante
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
                <CardHeader>
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-4 rounded-2xl shadow-lg">
                      <Eye className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-center font-bold text-gray-800">Lucioasă</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-center text-lg leading-relaxed">
                    Pentru a păstra aspectul original al ecranului.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:scale-105 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-gray-50 overflow-hidden">
                <CardHeader>
                  <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-r from-slate-500 to-gray-600 p-4 rounded-2xl shadow-lg">
                      <Layers className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-center font-bold text-gray-800">Satinată</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-center text-lg leading-relaxed">
                    Ideală împotriva amprentelor, fără reflexii deranjante.
                  </p>
                </CardContent>
              </Card>
            </div>

                          <div className="text-center">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100 max-w-4xl mx-auto">
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium leading-relaxed">
                    Nu afectează claritatea sau vizibilitatea ecranului – imaginea rămâne perfectă, exact cum a fost proiectată de producător.
                  </p>
                </div>
              </div>
          </div>
        </div>

        {/* Instrucțiuni de montaj */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Instrucțiuni de montaj
            </h2>
            <p className="text-xl text-gray-600 mb-8 font-medium">
              Necesar kitul dedicat
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-blue-600 mx-auto rounded-full"></div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl border border-blue-100">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-10 text-center text-gray-800">
              Folia se aplică doar folosind kitul de montaj, care conține:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="flex items-center gap-4 sm:gap-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-white/20">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg sm:text-xl text-gray-800 mb-2">Racletă profesională</h4>
                  <p className="text-gray-600 text-sm sm:text-base">Instrument de calitate pentru aplicare perfectă</p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-white/20">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg sm:text-xl text-gray-800 mb-2">Soluție specială de aplicare</h4>
                  <p className="text-gray-600 text-sm sm:text-base">Cu pulverizator pentru distribuție uniformă</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-2xl font-bold text-center mb-10 text-gray-800">
                Pași pentru aplicare corectă:
              </h4>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-500">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-lg text-gray-800 mb-2">Curăță ecranul</h5>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">Cu o lavetă moale, pentru a elimina toate impuritățile.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-500">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-lg text-gray-800 mb-2">Indeparteaza folia de liner</h5>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">Elimină protecția de pe partea cu adeziv.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-500">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-lg text-gray-800 mb-2">Pulverizează soluția</h5>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">Atât pe display, cât și pe ambele fețe ale foliei (cu accent pe partea cu adeziv).</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-500">
                    4
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-lg text-gray-800 mb-2">Poziționează folia</h5>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">Pe display, încadreaz-o corect.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-500">
                    5
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-lg text-gray-800 mb-2">Elimină lichidul</h5>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">Folosește racleta pentru a elimina lichidul de sub folie, obținând o aderență perfectă și fără bule.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specificații tehnice */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Specificații tehnice
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:scale-110 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-5xl font-black text-green-600 mb-4 group-hover:scale-110 transition-transform duration-500">200+</div>
                <p className="text-gray-700 text-lg font-semibold">Microni grosime</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-110 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-5xl font-black text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-500">2</div>
                <p className="text-gray-700 text-lg font-semibold">Variante disponibile</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-110 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-5xl font-black text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-500">Auto</div>
                <p className="text-gray-700 text-lg font-semibold">Regenerare</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-110 transition-all duration-500 border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-5xl font-black text-orange-600 mb-4 group-hover:scale-110 transition-transform duration-500">Kit</div>
                <p className="text-gray-700 text-lg font-semibold">Dedicat montaj</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
          <div className="absolute inset-0 opacity-50" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="relative rounded-3xl p-12 md:p-16 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Alege protecția perfectă pentru display!
            </h2>
            <p className="text-2xl mb-10 opacity-90 font-medium max-w-3xl mx-auto leading-relaxed">
              Folia PPF pentru display-ul mașinii tale este investiția ideală în durabilitate și estetică
            </p>
            <div className="flex justify-center">
              <Link href="/collection/allproducts">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
                  Vezi toate produsele
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 