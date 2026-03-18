"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  cod_status?: string | null;
  cod_amount?: number | null;
  cod_remitted_date?: string | null;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  payment?: {
    payment_method: string;
  } | null;
}

export default function CODRemittancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    fetchCODOrders();
  }, [filter]);

  const fetchCODOrders = async () => {
    try {
      const res = await fetch(`/api/orders?status=PLACED&paymentMethod=COD`);
      const data = await res.json();
      const codOrders = (data.data || []).filter((o: Order) => 
        o.payment?.payment_method === "COD" || o.payment_status === "PENDING"
      );
      setOrders(codOrders);
    } catch (error) {
      console.error("Failed to fetch COD orders:", error);
      toast.error("Failed to load COD orders");
    } finally {
      setLoading(false);
    }
  };

  const updateCODStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cod_status: status,
          ...(status === "REMITTED" ? { cod_remitted_date: new Date().toISOString() } : {}),
        }),
      });

      if (!res.ok) throw new Error("Failed to update COD status");

      toast.success(`COD status updated to ${status}`);
      fetchCODOrders();
    } catch (error) {
      toast.error("Failed to update COD status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "COLLECTED":
        return "bg-blue-100 text-blue-800";
      case "REMITTED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 inline mr-1" />;
      case "COLLECTED":
        return <DollarSign className="h-4 w-4 inline mr-1" />;
      case "REMITTED":
        return <CheckCircle className="h-4 w-4 inline mr-1" />;
      case "FAILED":
        return <AlertCircle className="h-4 w-4 inline mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          COD Remittance Management
        </h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="PENDING">Pending</option>
            <option value="COLLECTED">Collected</option>
            <option value="REMITTED">Remitted</option>
            <option value="FAILED">Failed</option>
            <option value="ALL">All</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-sm text-gray-500">Pending Collection</div>
          <div className="text-2xl font-bold">
            {orders.filter(o => o.cod_status === "PENDING").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-500">Collected</div>
          <div className="text-2xl font-bold">
            {orders.filter(o => o.cod_status === "COLLECTED").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-500">Remitted to Bank</div>
          <div className="text-2xl font-bold">
            {orders.filter(o => o.cod_status === "REMITTED").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-sm text-gray-500">Failed/Issues</div>
          <div className="text-2xl font-bold">
            {orders.filter(o => o.cod_status === "FAILED").length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow">
          <DollarSign className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No COD orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COD Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.order_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.user?.full_name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{order.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{order.total_amount.toFixed(0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        order.cod_status || "PENDING"
                      )}`}
                    >
                      {getStatusIcon(order.cod_status || "PENDING")}
                      {order.cod_status || "PENDING"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {order.cod_status === "PENDING" && (
                      <button
                        onClick={() => updateCODStatus(order.id, "COLLECTED")}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Mark Collected
                      </button>
                    )}
                    {order.cod_status === "COLLECTED" && (
                      <button
                        onClick={() => updateCODStatus(order.id, "REMITTED")}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        Mark Remitted
                      </button>
                    )}
                    {order.cod_status !== "REMITTED" && (
                      <button
                        onClick={() => updateCODStatus(order.id, "FAILED")}
                        className="text-red-600 hover:text-red-900"
                      >
                        Mark Issue
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
