"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type TimeRange = "24h" | "7d" | "60d" | "1y" | "all";

type StatisticsData = {
  timeline: {
    timestamp: string;
    sales: number;
    revenue: number;
  }[];
  products: {
    id: string;
    name: string;
    totalSales: number;
    totalRevenue: number;
  }[];
  totalSales: number;
  totalRevenue: number;
};

export default function StatisticsContent() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [completedOnly, setCompletedOnly] = useState(false);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const generateTimePoints = (range: TimeRange) => {
    const points: { timestamp: string; sales: number; revenue: number }[] = [];
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case "24h":
        startDate.setHours(now.getHours() - 24);
        for (
          let d = new Date(startDate);
          d <= now;
          d.setHours(d.getHours() + 1)
        ) {
          points.push({
            timestamp: new Date(d).toISOString(),
            sales: 0,
            revenue: 0,
          });
        }
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        for (
          let d = new Date(startDate);
          d <= now;
          d.setDate(d.getDate() + 1)
        ) {
          points.push({
            timestamp: new Date(d).toISOString(),
            sales: 0,
            revenue: 0,
          });
        }
        break;
      case "60d":
        startDate.setDate(now.getDate() - 60);
        for (
          let d = new Date(startDate);
          d <= now;
          d.setDate(d.getDate() + 1)
        ) {
          points.push({
            timestamp: new Date(d).toISOString(),
            sales: 0,
            revenue: 0,
          });
        }
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        for (
          let d = new Date(startDate);
          d <= now;
          d.setMonth(d.getMonth() + 1)
        ) {
          points.push({
            timestamp: new Date(d).toISOString(),
            sales: 0,
            revenue: 0,
          });
        }
        break;
      case "all":
        startDate = new Date(2020, 0, 1); // Presupunem că avem date din 2020
        for (
          let d = new Date(startDate);
          d <= now;
          d.setFullYear(d.getFullYear() + 1)
        ) {
          points.push({
            timestamp: new Date(d).toISOString(),
            sales: 0,
            revenue: 0,
          });
        }
        break;
    }
    return points;
  };

  const formatXAxisDate = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case "24h":
        return date.toLocaleTimeString("ro-RO", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "7d":
        return date.toLocaleDateString("ro-RO", { weekday: "short" });
      case "60d":
        return date.toLocaleDateString("ro-RO", {
          day: "2-digit",
          month: "short",
        });
      case "1y":
        return date.toLocaleDateString("ro-RO", {
          month: "short",
          year: "2-digit",
        });
      case "all":
        return date.toLocaleDateString("ro-RO", { year: "numeric" });
      default:
        return date.toLocaleString();
    }
  };

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/statistics?timeRange=${timeRange}&completedOnly=${completedOnly}`
      );
      if (!response.ok) throw new Error("Failed to fetch statistics");
      const data = await response.json();

      // Generăm toate punctele de timp pentru intervalul selectat
      const timePoints = generateTimePoints(timeRange);

      // Combinăm datele reale cu punctele de timp generate
      const combinedData = timePoints.map((point) => {
        const matchingData = data.timeline.find((t: any) => {
          const pointDate = new Date(point.timestamp);
          const dataDate = new Date(t.timestamp);

          switch (timeRange) {
            case "24h":
              return (
                pointDate.getHours() === dataDate.getHours() &&
                pointDate.getDate() === dataDate.getDate()
              );
            case "7d":
            case "60d":
              return (
                pointDate.getDate() === dataDate.getDate() &&
                pointDate.getMonth() === dataDate.getMonth() &&
                pointDate.getFullYear() === dataDate.getFullYear()
              );
            case "1y":
              return (
                pointDate.getMonth() === dataDate.getMonth() &&
                pointDate.getFullYear() === dataDate.getFullYear()
              );
            case "all":
              return pointDate.getFullYear() === dataDate.getFullYear();
            default:
              return false;
          }
        });

        return matchingData || point;
      });

      setData({
        ...data,
        timeline: combinedData,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch statistics. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, completedOnly]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (isLoading) {
    return <div>Loading statistics...</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="60d">Last 60 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="completedOnly"
              checked={completedOnly}
              onCheckedChange={(checked) =>
                setCompletedOnly(checked as boolean)
              }
            />
            <Label htmlFor="completedOnly">Show only completed payments</Label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Products Ordered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.products.reduce(
                (acc, product) => acc + product.totalSales,
                0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalRevenue.toFixed(2)} RON
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatXAxisDate}
                  interval="preserveStartEnd"
                />
                <YAxis
                  label={{
                    value: "Revenue (RON)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                  tickFormatter={(value) => `${value.toFixed(0)} RON`}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString("ro-RO")
                  }
                  formatter={(value: number) => [
                    `${value.toFixed(2)} RON`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {data.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {product.totalSales} sales
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {product.totalRevenue.toFixed(2)} RON
                  </p>
                  <p className="text-sm text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
