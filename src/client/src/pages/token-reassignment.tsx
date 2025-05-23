import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { reassignmentFormSchema } from "@shared/schema";
import type { TokenWithDetails, Booth, ReassignmentForm } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TokenBadge } from "@/components/ui/token-badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { ArrowRightLeft, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function TokenReassignment() {
  const { toast } = useToast();

  // Fetch booths
  const { data: booths = [], isLoading: isLoadingBooths } = useQuery({
    queryKey: ["/api/booths"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => (Array.isArray(data) ? data : []) as Booth[]
  });
  
  // Fetch booth statuses for capacity information
  const { data: boothStatuses = [], isLoading: isLoadingBoothStatuses } = useQuery({
    queryKey: ["/api/booths/status"],
    refetchInterval: 2000, // 2 seconds
    select: (data) => (Array.isArray(data) ? data : [])
  });

  // Fetch reassignment history
  const { data: reassignmentHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/reassignments"],
    refetchInterval: 10000, // Refresh every 10 seconds
    select: (data) => (Array.isArray(data) ? data : [])
  });
  
  // Fetch active tokens for the combobox
  const { data: activeTokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ["/api/tokens/active"],
    refetchInterval: 10000, // Refresh every 10 seconds
    select: (data) => (Array.isArray(data) ? data : [])
  });
  
  // State for combobox
  const [open, setOpen] = useState(false);

  // Form definition
  const form = useForm({
    resolver: zodResolver(reassignmentFormSchema),
    defaultValues: {
      tokenNumber: "",
      fromBoothId: 0, // Initialize as a number (0), not undefined
      toBoothId: 0, // Initialize as a number (0), not undefined
      reason: "",
    },
  });

  // Reassignment mutation
  const reassignMutation = useMutation({
    mutationFn: async (data: ReassignmentForm) => {
      console.log("Sending API request with data:", data);
      try {
        // Using a more direct approach with fetch to have better control over the response
        const response = await fetch("/api/tokens/reassign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}. ${errorText}`);
        }
        
        const jsonResult = await response.json();
        console.log("API success response:", jsonResult);
        return jsonResult;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data: TokenWithDetails) => {
      console.log("Reassignment successful:", data);
      toast({
        title: "Token reassigned successfully",
        description: `Token ${data.tokenNumber} has been reassigned to ${data.boothName}.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tokens/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reassignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/booths/status'] });
      
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Reassignment mutation error:", error);
      toast({
        title: "Reassignment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ReassignmentForm) => {
    console.log("Submitting reassignment data:", data);
    
    // Ensure booth IDs are numbers (should already be handled by the schema)
    const formattedData: ReassignmentForm = {
      ...data,
      fromBoothId: Number(data.fromBoothId),
      toBoothId: Number(data.toBoothId)
    };
    
    console.log("Formatted reassignment data:", formattedData);
    
    // Form validation should already catch these issues with the updated schema,
    // but we'll keep these checks for extra safety
    
    // Validate required fields have values
    if (!formattedData.tokenNumber || formattedData.fromBoothId === 0 || formattedData.toBoothId === 0) {
      toast({
        title: "Missing information",
        description: "Please select a token and target booth.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that we're not reassigning to the same booth
    if (formattedData.fromBoothId === formattedData.toBoothId) {
      toast({
        title: "Invalid reassignment",
        description: "Cannot reassign a token to the same booth it's already at.",
        variant: "destructive",
      });
      return;
    }
    
    reassignMutation.mutate(formattedData);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-5">Token Reassignment</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="tokenNumber"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Token ID</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? activeTokens.find(
                                (token) => token.tokenNumber === field.value
                              )?.tokenNumber || field.value
                            : "Select a token"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search token..."
                          className="h-9"
                        />
                        <CommandEmpty>No token found.</CommandEmpty>
                        <CommandGroup>
                          {isLoadingTokens ? (
                            <CommandItem disabled>
                              Loading tokens...
                            </CommandItem>
                          ) : activeTokens.length > 0 ? (
                            activeTokens.map((token) => (
                              <CommandItem
                                key={token.tokenNumber}
                                value={token.tokenNumber}
                                onSelect={() => {
                                  form.setValue("tokenNumber", token.tokenNumber);
                                  // Set fromBoothId and make sure it's a number
                                  form.setValue("fromBoothId", Number(token.boothId));
                                  setOpen(false);
                                  console.log("Selected token booth:", token.boothId, "type:", typeof token.boothId);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === token.tokenNumber
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {token.tokenNumber} - {token.participantName} ({token.boothName})
                              </CommandItem>
                            ))
                          ) : (
                            <CommandItem disabled>
                              No active tokens available
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fromBoothId"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Current Booth</FormLabel>
                  <FormControl>
                    <Input 
                      value={field.value ? booths.find(b => b.id === field.value)?.name || 'Unknown booth' : ''} 
                      readOnly
                      disabled
                      className="bg-gray-100"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Current booth is automatically selected when you choose a token
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toBoothId"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Target Booth</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target booth" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingBooths ? (
                        <SelectItem value="loading2" disabled>
                          Loading booths...
                        </SelectItem>
                      ) : (
                        booths.map((booth) => {
                          // Find the booth status to get capacity information
                          const boothStatus = boothStatuses.find(status => status.id === booth.id);
                          const staffCapacity = boothStatus?.staffCapacity || booth.staffCapacity || 1;
                          const currentCount = boothStatus?.currentlyServingCount || 0;
                          const isFullyOccupied = currentCount >= staffCapacity;
                          
                          return (
                            <SelectItem key={booth.id} value={booth.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{booth.name}</span>
                                <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                                  isFullyOccupied ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {currentCount}/{staffCapacity} staff
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Reason for Reassignment</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief explanation for why the token is being reassigned."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={reassignMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              {reassignMutation.isPending ? "Reassigning..." : "Reassign Token"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-10">
        <h3 className="text-md font-medium text-gray-700 mb-3">Recent Reassignments</h3>
        
        {isLoadingHistory ? (
          <div className="p-4 text-center text-gray-500 border rounded-lg">
            Loading reassignment history...
          </div>
        ) : reassignmentHistory.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reassignmentHistory.map((history: any) => (
                  <tr key={history.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TokenBadge tokenNumber={history.tokenNumber} className="bg-[#EA580C]" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{history.participant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {history.fromBooth.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {history.toBooth.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(history.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 border rounded-lg">
            No reassignment history available
          </div>
        )}
      </div>
    </Card>
  );
}
