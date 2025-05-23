import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { TokenBadge } from "@/components/ui/token-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Ticket,
  Clock,
  UserCheck,
  CheckCheck
} from "lucide-react";
import { formatTime } from "@/lib/utils";

import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Fetch booth statuses
  const { data: boothStatuses, isLoading: isLoadingBooths } = useQuery({
    queryKey: ["/api/booths/status"],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const { data: recentlyServed, isLoading: recentlyServedLoading } = useQuery({
    queryKey: ['/api/dashboard/served-tokens'],
    refetchInterval: 2000,
  });

  // Placeholder for chart data
  const chartData = {
    // This would be a data structure for the chart in a real implementation
    // For now, we'll just render a placeholder
  };

  return (
      <div>
        {/* Overview Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white overflow-hidden shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary rounded-md p-3">
                  <Ticket className="h-5 w-5 text-white"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tokens</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {isLoadingStats ? "..." : stats?.totalTokens || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white overflow-hidden shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#F59E0B] rounded-md p-3">
                  <Clock className="h-5 w-5 text-white"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Waiting</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {isLoadingStats ? "..." : stats?.waiting || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white overflow-hidden shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#3B82F6] rounded-md p-3">
                  <UserCheck className="h-5 w-5 text-white"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Attending</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {isLoadingStats ? "..." : stats?.attending || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white overflow-hidden shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#10B981] rounded-md p-3">
                  <CheckCheck className="h-5 w-5 text-white"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Served</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {isLoadingStats ? "..." : stats?.served || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Booth Status Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isLoadingBooths ? (
              <div className="col-span-full p-4 text-center text-gray-500">
                Loading booth statuses...
              </div>
          ) : (
              boothStatuses?.map((booth) => (
                  <Card key={booth.id} className="bg-white overflow-hidden shadow divide-y divide-gray-200">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">{booth.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booth.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                  {booth.isActive ? "Active" : "Inactive"}
                </span>
                    </div>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500">Currently Serving:</div>
                        <div className="text-xs font-medium bg-gray-100 text-gray-800 rounded-full px-2 py-1">
                          Staff: {booth.currentlyServingCount} / {booth.staffCapacity}
                        </div>
                      </div>

                      {booth.currentlyServing && booth.currentlyServing.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {booth.currentlyServing.map((token) => (
                                <div key={token.id}
                                     className="p-3 bg-blue-50 rounded-md border border-blue-200 flex items-center justify-between">
                                  <div className="flex items-center">
                                    <TokenBadge
                                        tokenNumber={token.tokenNumber}
                                        status="attending"
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium">
                            {token.participant.name}
                          </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                          Started: {formatTime(token.statusUpdatedAt)}
                        </span>
                                </div>
                            ))}
                          </div>
                      ) : (
                          <div
                              className="p-3 bg-gray-50 rounded-md border border-gray-200 text-center text-sm text-gray-500 mb-3">
                            No one currently being served
                          </div>
                      )}

                      <div className="text-sm text-gray-500 mb-2">Next in Queue:</div>
                      {booth.waitingTokens && booth.waitingTokens.length > 0 ? (
                          <ul className="space-y-2 mb-3">
                            {booth.waitingTokens.slice(0, 3).map((token) => (
                                <li key={token.id} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <TokenBadge
                                        tokenNumber={token.tokenNumber}
                                        status="waiting"
                                        className="mr-2"
                                    />
                                    <span className="text-sm">{token.participant.name}</span>
                                  </div>
                                  <StatusBadge status={token.status}/>
                                </li>
                            ))}
                          </ul>
                      ) : (
                          <div className="p-2 bg-gray-50 rounded-md text-center text-sm text-gray-500 mb-3">
                            No waiting tokens
                          </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                        <span>Average wait time:</span>
                        <span className="font-medium">{booth.averageWaitTime}</span>
                      </div>
                    </div>
                  </Card>
              ))
          )}
        </div>

        {/* Recently Served Tokens */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Recently Served Tokens</h2>
          {(recentlyServedLoading || recentlyServed?.length === 0) ? (
              <div className="text-center p-4 bg-muted/50 rounded-md">
                {recentlyServedLoading ? "Loading..." : "No tokens have been served yet."}
              </div>
          ) : (
              <div className="min-w-full divide-y divide-gray-200">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                  <tr>
                    <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token
                    </th>
                    <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant
                    </th>
                    <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Use Case
                    </th>
                    <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booth
                    </th>
                    <th scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed
                      At
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {recentlyServed?.map((token) => (
                      <tr key={token.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TokenBadge tokenNumber={token.tokenNumber} status="served"/>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{token.participant.name}</div>
                          <div className="text-sm text-gray-500">{token.participant.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {token.participant.useCaseId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {token.boothName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(token.statusUpdatedAt)}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>


        {/* Token Distribution Chart */}
        {/*<Card className="mt-8 bg-white shadow overflow-hidden">*/}
        {/*  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">*/}
        {/*    <h3 className="text-lg font-medium text-gray-900">Token Distribution by Hour</h3>*/}
        {/*  </div>*/}
        {/*  <div className="px-4 py-5 sm:p-6">*/}
        {/*    <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center justify-center">*/}
        {/*      <p className="text-gray-500 text-sm">*/}
        {/*        Graph visualization would be displayed here in a production environment.*/}
        {/*      </p>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</Card>*/}
      </div>
  );
}
