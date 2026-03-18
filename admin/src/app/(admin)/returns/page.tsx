"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Eye, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";

interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "PICKED_UP" | "REFUNDED";
  created_at: string;
  order?: {
    order_number: string;
    total_amount: number;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_pincode?: string;
  };
  user?: {
    full_name: string;
    email: string;
  };
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "view">("view");

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const res = await fetch("/api/returns");
      const data = await res.json();
      setReturns(data.data || []);
    } catch (error) {
      console.error("Failed to fetch returns:", error);
      toast.error("Failed to load return requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (!res.ok) throw new Error("Failed to approve return");

      toast.success("Return request approved");
      fetchReturns();
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to approve return request");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (!res.ok) throw new Error("Failed to reject return");

      toast.success("Return request rejected");
      fetchReturns();
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to reject return request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PICKED_UP":
        return "bg-blue-100 text-blue-800";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Return Requests</h1>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow">
          <RotateCcw className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No return requests yet.</p>
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
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {ret.order?.order_number || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      ₹{ret.order?.total_amount.toFixed(0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ret.user?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">{ret.user?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {ret.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        ret.status
                      )}`}
                    >
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ret.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedReturn(ret);
                        setActionType("view");
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="h-4 w-4 inline" /> View
                    </button>
                    {ret.status === "REQUESTED" && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setActionType("approve");
                            setShowModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          <CheckCircle className="h-4 w-4 inline" /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setActionType("reject");
                            setShowModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="h-4 w-4 inline" /> Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for View/Approve/Reject */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {actionType === "view" && "Return Details"}
              {actionType === "approve" && "Approve Return"}
              {actionType === "reject" && "Reject Return"}
            </h2>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Order Number</label>
                <p className="text-gray-900">{selectedReturn.order?.order_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer</label>
                <p className="text-gray-900">{selectedReturn.user?.full_name}</p>
                <p className="text-sm text-gray-500">{selectedReturn.user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <p className="text-gray-900">{selectedReturn.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{selectedReturn.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Shipping Address</label>
                <p className="text-gray-900">{selectedReturn.order?.shipping_address}</p>
                <p className="text-gray-900">
                  {selectedReturn.order?.shipping_city}, {selectedReturn.order?.shipping_state}{" "}
                  {selectedReturn.order?.shipping_pincode}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {actionType === "approve" && (
                <button
                  onClick={() => handleApprove(selectedReturn.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve Return
                </button>
              )}
              {actionType === "reject" && (
                <button
                  onClick={() => handleReject(selectedReturn.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject Return
                </button>
              )}
              {actionType === "view" && (
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
