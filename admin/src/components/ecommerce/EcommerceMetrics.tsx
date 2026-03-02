import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";
import { DashboardData } from "@/types/dashboard";

interface EcommerceMetricsProps {
  data: DashboardData | null;
  loading: boolean;
}

export const EcommerceMetrics = ({ data, loading }: EcommerceMetricsProps) => {
  const formatNumber = (n: number) =>
    n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toString();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? (
                <span className="inline-block w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                formatNumber(data?.customers.total ?? 0)
              )}
            </h4>
          </div>
          {loading ? (
            <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          ) : data?.customers.isGrowing ? (
            <Badge color="success">
              <ArrowUpIcon />
              {Math.abs(data.customers.growth)}%
            </Badge>
          ) : (
            <Badge color="error">
              <ArrowDownIcon className="text-error-500" />
              {Math.abs(data?.customers.growth ?? 0)}%
            </Badge>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Orders
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? (
                <span className="inline-block w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                formatNumber(data?.orders.total ?? 0)
              )}
            </h4>
          </div>
          {loading ? (
            <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          ) : data?.orders.isGrowing ? (
            <Badge color="success">
              <ArrowUpIcon />
              {Math.abs(data.orders.growth)}%
            </Badge>
          ) : (
            <Badge color="error">
              <ArrowDownIcon className="text-error-500" />
              {Math.abs(data?.orders.growth ?? 0)}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
