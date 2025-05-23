import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { registrationFormSchema } from "@shared/schema";
import type { TokenWithDetails } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TokenBadge } from "@/components/ui/token-badge";
import {
  Form,
  FormControl,
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
import { Card } from "@/components/ui/card";
import { Printer, UserPlus } from "lucide-react";

export default function Registration() {
  const [generatedToken, setGeneratedToken] = useState<TokenWithDetails | null>(null);
  const { toast } = useToast();

  // Fetch booths
  const { data: booths, isLoading: isLoadingBooths } = useQuery({
    queryKey: ["/api/booths"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Form definition
  const form = useForm({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      useCaseId: "",
      boothId: undefined,
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: ReturnType<typeof form.getValues>) => {
      const response = await apiRequest("POST", "/api/register", data);
      return await response.json();
    },
    onSuccess: (data: TokenWithDetails) => {
      toast({
        title: "Registration successful!",
        description: `Token ${data.tokenNumber} has been generated.`,
      });
      setGeneratedToken(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: any) => {
    registerMutation.mutate(data);
  };

  // Handle new registration button
  const handleNewRegistration = () => {
    form.reset();
    setGeneratedToken(null);
  };

  // Handle print token button
  const handlePrintToken = () => {
    if (!generatedToken) return;

    // Create a printable version of the token
    const printContent = `
      <html>
        <head>
          <title>AI Roadshow Token</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .token-card { border: 1px solid #ccc; padding: 20px; max-width: 400px; margin: 0 auto; }
            .token-number { background-color: #4F46E5; color: white; padding: 10px 20px; font-size: 24px; font-weight: bold; display: inline-block; border-radius: 4px; margin-bottom: 10px; }
            .info-row { margin-bottom: 5px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="token-card">
            <h2>AI Roadshow Token</h2>
            <div class="token-number">${generatedToken.tokenNumber}</div>
            <div class="info-row"><span class="label">Name:</span> ${generatedToken.participant.name}</div>
            <div class="info-row"><span class="label">Booth:</span> ${generatedToken.boothName}</div>
            <div class="info-row"><span class="label">Queue Position:</span> ${generatedToken.queuePosition || 'N/A'}</div>
            <div class="info-row"><span class="label">Estimated Wait Time:</span> ${generatedToken.estimatedWaitTime || 'N/A'}</div>
            <div class="info-row"><span class="label">Date:</span> ${new Date().toLocaleDateString()}</div>
            <p style="margin-top: 20px; font-size: 12px;">Please keep this token for reference.</p>
          </div>
        </body>
      </html>
    `;

    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast({
        title: "Print failed",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-5">Participant Registration</h2>

      {!generatedToken ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="useCaseId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Use Case ID</FormLabel>
                    <FormControl>
                      <Input placeholder="AI-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="boothId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Booth</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a booth" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingBooths ? (
                          <SelectItem value="loading" disabled>
                            Loading booths...
                          </SelectItem>
                        ) : (
                          Array.isArray(booths) && booths.map((booth) => (
                            <SelectItem key={booth.id} value={booth.id.toString()}>
                              {booth.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={registerMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {registerMutation.isPending ? "Generating..." : "Generate Token"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="mt-8">
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Registration successful!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Token has been generated and an email has been sent to the participant.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="inline-block bg-primary text-white px-6 py-4 rounded-md mb-4">
              <span className="block text-3xl font-bold">{generatedToken.tokenNumber}</span>
              <span className="text-sm opacity-80">Your Token</span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {generatedToken.participant.name}
              </p>
              <p>
                <span className="font-medium">Booth:</span> {generatedToken.boothName}
              </p>
              <p>
                <span className="font-medium">Queue Position:</span>{" "}
                {generatedToken.queuePosition || "N/A"}
              </p>
              <p>
                <span className="font-medium">Estimated Wait Time:</span>{" "}
                {generatedToken.estimatedWaitTime || "N/A"}
              </p>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={handlePrintToken}
                className="mr-3"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Token
              </Button>
              <Button
                variant="outline"
                onClick={handleNewRegistration}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                New Registration
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
