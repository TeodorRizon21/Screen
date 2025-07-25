import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export default function Footer() {
  return (
    <div className="bg-white pt-12 pb-8 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coloana 1 - Logo și Descriere */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-xl mb-4">ScreenShield</h3>
            <p className="text-sm text-gray-700 mb-4">
              Protecție premium pentru sistemele infotainment auto. Oferim cele
              mai bune soluții pentru toate mărcile și modelele.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-700 hover:text-black">
                <Facebook size={20} />
              </Link>
              <Link href="#" className="text-gray-700 hover:text-black">
                <Instagram size={20} />
              </Link>
              <Link href="#" className="text-gray-700 hover:text-black">
                <Twitter size={20} />
              </Link>
            </div>
          </div>

          {/* Coloana 2 - Informații legale */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg mb-4">Informații legale</h3>
            <ul className="space-y-2 mb-6">
              <li>
                <Link
                  href="/politica-retur"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Politica de retur
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-confidentialitate"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Politica de confidențialitate
                </Link>
              </li>
              <li>
                <Link
                  href="/termeni-conditii"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Termeni și condiții
                </Link>
              </li>
              <li>
                <Link
                  href="https://anpc.ro/"
                  className="text-gray-700 hover:text-black text-sm">
                  A.N.P.C.
                </Link>
              </li>
              <li>
                <Link
                  href="https://reclamatiisal.anpc.ro/"
                  className="block mt-3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/anpc.png"
                    alt="ANPC - Autoritatea Națională pentru Protecția Consumatorilor"
                    className="h-12 w-auto hover:opacity-80 transition-opacity"
                  />
                </Link>
              </li>
            </ul>
          </div>

          {/* Coloana 3 - Contact */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-gray-700 mt-0.5" />
                <span className="text-sm text-gray-700">
                Bulevardul Timișoara 161, Sector 6, București
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-gray-700" />
                <a
                  href="https://wa.me/40758232399"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-700 hover:text-black transition-colors"
                >
                  +40 758 232 399
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-gray-700" />
                <a
                  href="mailto:contact.screenshield@gmail.com"
                  className="text-sm text-gray-700 hover:text-black transition-colors"
                >
                  contact.screenshield@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Coloana 4 - Meniu Rapid */}
          <div className="md:col-span-1">
            <h3 className="font-bold text-lg mb-4">Meniu Rapid</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Acasă
                </Link>
              </li>
              <li>
                <Link
                  href="/collection/allproducts"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Produse
                </Link>
              </li>
              <li>
                <Link
                  href="/despre-folie"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Despre Folie
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/cart"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Coș de cumpărături
                </Link>
              </li> */}
              <li>
                <Link
                  href="/return-form"
                  className="text-gray-700 hover:text-black text-sm"
                >
                  Formular de retur
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-700">
          <p>
            © {new Date().getFullYear()} ScreenShield. Toate drepturile
            rezervate.
          </p>
        </div>
      </div>
    </div>
  );
}
