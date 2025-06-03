import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Plus,
  Car,
  Users,
  TrendingUp,
  Wrench,
  Percent,
  BarChart3,
  Mail,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

async function getDashboardStats() {
  // Get product count
  const productsCount = await prisma.product.count();

  // Get orders count
  const ordersCount = await prisma.order.count();

  // Calculate total revenue
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "COMPLETED",
    },
    select: {
      total: true,
    },
  });

  const totalRevenue = orders.reduce((acc: number, order: { total: number }) => acc + order.total, 0);

  // Get customer count
  const userIds = await prisma.order.findMany({
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });

  const customersCount = userIds.length;

  // Calculate monthly growth rates
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Products growth
  const lastMonthProducts = await prisma.product.count({
    where: {
      createdAt: {
        gte: oneMonthAgo,
      },
    },
  });

  const previousMonthProducts = await prisma.product.count({
    where: {
      createdAt: {
        gte: twoMonthsAgo,
        lt: oneMonthAgo,
      },
    },
  });

  const productsGrowth =
    previousMonthProducts === 0
      ? 100
      : Math.round(
          ((lastMonthProducts - previousMonthProducts) /
            previousMonthProducts) *
            100
        );

  // Orders growth
  const lastMonthOrders = await prisma.order.count({
    where: {
      createdAt: {
        gte: oneMonthAgo,
      },
    },
  });

  const previousMonthOrders = await prisma.order.count({
    where: {
      createdAt: {
        gte: twoMonthsAgo,
        lt: oneMonthAgo,
      },
    },
  });

  const ordersGrowth =
    previousMonthOrders === 0
      ? 100
      : Math.round(
          ((lastMonthOrders - previousMonthOrders) / previousMonthOrders) * 100
        );

  // Revenue growth
  const lastMonthRevenue = await prisma.order.findMany({
    where: {
      paymentStatus: "COMPLETED",
      createdAt: {
        gte: oneMonthAgo,
      },
    },
    select: {
      total: true,
    },
  });

  const lastMonthTotalRevenue = lastMonthRevenue.reduce(
    (acc: number, order: { total: number }) => acc + order.total,
    0
  );

  const previousMonthRevenue = await prisma.order.findMany({
    where: {
      paymentStatus: "COMPLETED",
      createdAt: {
        gte: twoMonthsAgo,
        lt: oneMonthAgo,
      },
    },
    select: {
      total: true,
    },
  });

  const previousMonthTotalRevenue = previousMonthRevenue.reduce(
    (acc: number, order: { total: number }) => acc + order.total,
    0
  );

  const revenueGrowth =
    previousMonthTotalRevenue === 0
      ? 100
      : Math.round(
          ((lastMonthTotalRevenue - previousMonthTotalRevenue) /
            previousMonthTotalRevenue) *
            100
        );

  // Customers growth - folosim orderele distincte după userId ca aproximare
  const lastMonthCustomers = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: oneMonthAgo,
      },
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });

  const previousMonthCustomers = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: twoMonthsAgo,
        lt: oneMonthAgo,
      },
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });

  const customersGrowth =
    previousMonthCustomers.length === 0
      ? 100
      : Math.round(
          ((lastMonthCustomers.length - previousMonthCustomers.length) /
            previousMonthCustomers.length) *
            100
        );

  return {
    productsCount,
    ordersCount,
    totalRevenue,
    customersCount,
    productsGrowth,
    ordersGrowth,
    revenueGrowth,
    customersGrowth,
  };
}

export default async function AdminPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">
            Gestionează produsele, comenzile și clienții
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produse</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.productsCount}
                </h3>
                <p
                  className={`text-sm font-medium ${
                    stats.productsGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stats.productsGrowth >= 0 ? "+" : ""}
                  {stats.productsGrowth}%
                </p>
              </div>
              <div className="bg-[#e8f7f2] p-3 rounded-full">
                <Wrench className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comenzi</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.ordersCount}
                </h3>
                <p
                  className={`text-sm font-medium ${
                    stats.ordersGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stats.ordersGrowth >= 0 ? "+" : ""}
                  {stats.ordersGrowth}%
                </p>
              </div>
              <div className="bg-[#e8f7f2] p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Venituri</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {formatPrice(stats.totalRevenue)}
                </h3>
                <p
                  className={`text-sm font-medium ${
                    stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stats.revenueGrowth >= 0 ? "+" : ""}
                  {stats.revenueGrowth}%
                </p>
              </div>
              <div className="bg-[#e8f7f2] p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clienți</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.customersCount}
                </h3>
                <p
                  className={`text-sm font-medium ${
                    stats.customersGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stats.customersGrowth >= 0 ? "+" : ""}
                  {stats.customersGrowth}%
                </p>
              </div>
              <div className="bg-[#e8f7f2] p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Produse</h3>
                <p className="text-sm text-gray-600">
                  Gestionează catalogul de produse
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/products"
                className="block hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center text-gray-700">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Vezi Toate Produsele
                </div>
              </Link>
              <Link
                href="/admin/products/new"
                className="block hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center text-gray-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Adaugă Produs Nou
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Mașini</h3>
                <p className="text-sm text-gray-600">
                  Gestionează mărci, modele și generații
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/cars"
                className="block hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center text-gray-700">
                  <Car className="h-5 w-5 mr-2" />
                  Administrare Mașini
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Comenzi & Marketing</h3>
                <p className="text-sm text-gray-600">
                  Gestionează comenzi și marketing
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/orders"
                className="block hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center text-gray-700">
                  <Package className="h-5 w-5 mr-2" />
                  Vezi Comenzile
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analiză & Promoții</h3>
                <p className="text-sm text-gray-600">
                  Statistici și gestionare reduceri
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/statistics"
                className="block hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center text-gray-700">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Statistici Site
                </div>
              </Link>
              <Link
                href="/admin/discount"
                className="block hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center text-gray-700">
                  <Percent className="h-5 w-5 mr-2" />
                  Gestionează Reducerile
                </div>
              </Link>
              <Link
                href="/admin/email-management"
                className="block hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 mr-2" />
                  Gestionare Email-uri
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
