import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TokenBadge } from "@/components/ui/token-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TokenStatus, TokenWithDetails } from "@shared/schema";
import { formatTime, formatDateTime } from "@/lib/utils";
import { CheckCheck } from "lucide-react";

export default function QueueManagement() {
  const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch booths
  const { data: booths, isLoading: isLoadingBooths } = useQuery({
    queryKey: ["/api/booths"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch booth status
  const { 
    data: boothStatus,
    isLoading: isLoadingBoothStatus
  } = useQuery({
    queryKey: [`/api/booths/${selectedBoothId}/status`],
    enabled: !!selectedBoothId,
    refetchInterval: 2000, // Refresh every 2 seconds for more responsive updates
  });

  // Fetch tokens for selected booth
  const { 
    data: tokens,
    isLoading: isLoadingTokens
  } = useQuery({
    queryKey: [`/api/booths/${selectedBoothId}/tokens`],
    enabled: !!selectedBoothId,
    refetchInterval: 2000, // Refresh every 2 seconds for more responsive updates
  });

  // Mutation to update token status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ tokenNumber, status }: { tokenNumber: string; status: TokenStatus }) => {
      const response = await apiRequest("PATCH", `/api/tokens/${tokenNumber}/status`, { status });
      return await response.json();
    },
    onSuccess: (data: TokenWithDetails) => {
      toast({
        title: "Status updated",
        description: `Token ${data.tokenNumber} is now ${data.status}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Call next participant
  const handleCallNext = (token: TokenWithDetails) => {
    updateStatusMutation.mutate({
      tokenNumber: token.tokenNumber,
      status: TokenStatus.ATTENDING
    });
  };

  // Mark current token as served
  const handleMarkAsServed = (token: TokenWithDetails) => {
    updateStatusMutation.mutate({
      tokenNumber: token.tokenNumber,
      status: TokenStatus.SERVED
    });
  };

  // Get waiting tokens
  const waitingTokens = tokens?.filter(token => token.status === TokenStatus.WAITING) || [];
  
  // Get served tokens (most recent first)
  const servedTokens = tokens
    ?.filter(token => token.status === TokenStatus.SERVED)
    .sort((a, b) => new Date(b.statusUpdatedAt).getTime() - new Date(a.statusUpdatedAt).getTime())
    .slice(0, 5) || [];

  // Currently attending tokens
  const currentlyAttendingTokens = tokens
    ?.filter(token => token.status === TokenStatus.ATTENDING)
    .sort((a, b) => new Date(a.statusUpdatedAt).getTime() - new Date(b.statusUpdatedAt).getTime()) || [];
  
  // Get booth capacity
  const selectedBooth = booths?.find(booth => booth.id === selectedBoothId);
  const staffCapacity = selectedBooth?.staffCapacity || 1;
  const availableStaffCount = staffCapacity - currentlyAttendingTokens.length;

  return (
    <Card className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-gray-900">Queue Management</h2>
        
        <div className="mt-3 sm:mt-0">
          <div className="inline-flex rounded-md">
            <Select
              onValueChange={(value) => setSelectedBoothId(parseInt(value, 10))}
              value={selectedBoothId?.toString()}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a booth" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingBooths ? (
                  <SelectItem value="" disabled>
                    Loading booths...
                  </SelectItem>
                ) : (
                  booths?.map((booth) => (
                    <SelectItem key={booth.id} value={booth.id.toString()}>
                      {booth.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {selectedBoothId ? (
        <>
          {/* Currently Serving Section */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium text-gray-700">Currently Serving</h3>
              <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Staff: {currentlyAttendingTokens.length} / {staffCapacity}
              </div>
            </div>
            
            {isLoadingBoothStatus ? (
              <div className="mt-3 p-4 text-center text-gray-500">Loading...</div>
            ) : currentlyAttendingTokens.length > 0 ? (
              <div className="mt-3 space-y-3">
                {currentlyAttendingTokens.map(token => (
                  <div key={token.id} className="p-4 rounded-lg border-2 border-[#3B82F6] bg-blue-50 flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="bg-[#3B82F6] text-white p-3 rounded-md">
                        <span className="text-xl font-bold">{token.tokenNumber}</span>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{token.participant.name}</h4>
                        <p className="text-sm text-gray-500">Use Case: {token.participant.useCaseId}</p>
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={token.status} />
                      <div className="mt-2 text-xs text-gray-500">
                        Started: {formatTime(token.statusUpdatedAt)}
                      </div>
                      <Button
                        onClick={() => handleMarkAsServed(token)}
                        disabled={updateStatusMutation.isPending}
                        className="mt-2 h-8 bg-[#10B981] hover:bg-[#0D9488]"
                        size="sm"
                      >
                        <CheckCheck className="mr-2 h-3 w-3" />
                        Mark as Served
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 p-4 rounded-lg border border-gray-200 bg-white text-center text-gray-500">
                No participant is currently being attended
              </div>
            )}
          </div>
          
          {/* Queue Management Table */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-700">Queue (Waiting Tokens)</h3>
              {staffCapacity > 0 && (
                <div className={`text-sm px-3 py-1 rounded-full ${
                  availableStaffCount > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {availableStaffCount > 0 
                    ? `${availableStaffCount} of ${staffCapacity} staff available` 
                    : 'All staff busy'}
                </div>
              )}
            </div>
            
            {isLoadingTokens ? (
              <div className="p-4 text-center text-gray-500">Loading tokens...</div>
            ) : waitingTokens.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Use Case</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wait Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {waitingTokens.map((token) => (
                      <tr key={token.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TokenBadge tokenNumber={token.tokenNumber} status={token.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{token.participant.name}</div>
                          <div className="text-sm text-gray-500">{token.participant.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {token.participant.useCaseId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Math.floor((new Date().getTime() - new Date(token.createdAt).getTime()) / 60000)} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={token.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="ghost"
                            className="text-primary hover:text-primary/90"
                            onClick={() => handleCallNext(token)}
                            disabled={updateStatusMutation.isPending || availableStaffCount <= 0}
                            title={availableStaffCount <= 0 ? "All staff are busy" : "Call next participant"}
                          >
                            {availableStaffCount <= 0 ? "Staff Busy" : "Call Next"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 border rounded-lg">
                No waiting tokens for this booth
              </div>
            )}
          </div>
          
          {/* Recently Served Tokens */}
          <div className="mt-8">
            <h3 className="text-md font-medium text-gray-700 mb-3">Recently Served</h3>
            
            {isLoadingTokens ? (
              <div className="p-4 text-center text-gray-500">Loading tokens...</div>
            ) : servedTokens.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Use Case</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {servedTokens.map((token) => (
                      <tr key={token.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TokenBadge tokenNumber={token.tokenNumber} status="served" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{token.participant.name}</div>
                          <div className="text-sm text-gray-500">{token.participant.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {token.participant.useCaseId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(token.statusUpdatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={token.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 border rounded-lg">
                No served tokens for this booth
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-6 p-8 text-center text-gray-500 border rounded-lg">
          Please select a booth to view its queue
        </div>
      )}
    </Card>
  );
}
