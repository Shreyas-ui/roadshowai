import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-json";
import { 
  registrationFormSchema, 
  reassignmentFormSchema, 
  TokenStatus, 
  WebSocketMessage,
  type TokenWithDetails,
  type Token
} from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";
import { sendRegistrationEmail, sendReassignmentEmail, sendStatusUpdateEmail } from "./email";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Function kept for reference - token generation is now handled by storage
// This function was previously used to generate token numbers
// but is no longer necessary as the storage implementation handles it directly
// function generateTokenNumber(boothId: number): string {
//   return "";
// }

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial data to the client
    sendInitialData(ws);
    
    ws.on('error', console.error);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Helper function to broadcast messages to all connected clients
  const broadcastMessage = (message: WebSocketMessage) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };
  
  // Send initial data to newly connected clients
  const sendInitialData = async (ws: WebSocket) => {
    try {
      // Get all booths
      const booths = await storage.getBooths();
      
      // Get all booth statuses
      const boothStatuses = await storage.getBoothStatuses();
      
      // Get dashboard stats
      const dashboardStats = await storage.getDashboardStats();
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'INITIAL_DATA',
        payload: {
          booths,
          boothStatuses,
          dashboardStats
        }
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  };
  
  // API routes
  
  // Get all booths
  app.get('/api/booths', async (req: Request, res: Response) => {
    try {
      const booths = await storage.getBooths();
      res.json(booths);
    } catch (error) {
      console.error('Error fetching booths:', error);
      res.status(500).json({ message: 'Failed to fetch booths' });
    }
  });
  
  // Register a new participant and generate a token
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validationResult = registrationFormSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const formData = validationResult.data;
      
      // Check if the booth exists
      const booth = await storage.getBooth(formData.boothId);
      if (!booth) {
        return res.status(404).json({ message: 'Booth not found' });
      }
      
      // Create the participant
      const participant = await storage.createParticipant({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        useCaseId: formData.useCaseId
      });
      
      // Create the token (token number will be auto-generated in the storage implementation)
      const token = await storage.createToken({
        tokenNumber: "", // This will be overridden by the storage implementation
        participantId: participant.id,
        boothId: booth.id,
        status: TokenStatus.WAITING
      });
      
      // Get the token with details
      const tokenWithDetails = await storage.getTokenWithDetails(token.id);
      
      if (!tokenWithDetails) {
        return res.status(500).json({ message: 'Failed to create token' });
      }
      
      // Calculate queue position and estimated wait time
      const boothTokens = await storage.getTokensWithDetailsByBooth(booth.id);
      const waitingTokens = boothTokens.filter(t => t.status === TokenStatus.WAITING);
      const queuePosition = waitingTokens.findIndex(t => t.id === token.id) + 1;
      const estimatedWaitTime = `~${queuePosition * 5} minutes`;
      
      tokenWithDetails.queuePosition = queuePosition;
      tokenWithDetails.estimatedWaitTime = estimatedWaitTime;
      
      // Send email notification
      sendRegistrationEmail(tokenWithDetails);
      
      // Broadcast token creation to all clients
      broadcastMessage({
        type: 'TOKEN_CREATED',
        payload: tokenWithDetails
      });
      
      // Return the token
      res.status(201).json(tokenWithDetails);
    } catch (error) {
      console.error('Error registering participant:', error);
      res.status(500).json({ message: 'Failed to register participant' });
    }
  });
  
  // Get all tokens for a booth
  app.get('/api/booths/:boothId/tokens', async (req: Request, res: Response) => {
    try {
      const boothId = parseInt(req.params.boothId, 10);
      
      if (isNaN(boothId)) {
        return res.status(400).json({ message: 'Invalid booth ID' });
      }
      
      // Check if the booth exists
      const booth = await storage.getBooth(boothId);
      if (!booth) {
        return res.status(404).json({ message: 'Booth not found' });
      }
      
      // Get all tokens for the booth
      const tokens = await storage.getTokensWithDetailsByBooth(boothId);
      
      res.json(tokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ message: 'Failed to fetch tokens' });
    }
  });
  
  // Get booth status
  app.get('/api/booths/:boothId/status', async (req: Request, res: Response) => {
    try {
      const boothId = parseInt(req.params.boothId, 10);
      
      if (isNaN(boothId)) {
        return res.status(400).json({ message: 'Invalid booth ID' });
      }
      
      // Get booth status
      const boothStatus = await storage.getBoothStatus(boothId);
      
      if (!boothStatus) {
        return res.status(404).json({ message: 'Booth not found' });
      }
      
      res.json(boothStatus);
    } catch (error) {
      console.error('Error fetching booth status:', error);
      res.status(500).json({ message: 'Failed to fetch booth status' });
    }
  });
  
  // Get all booth statuses
  app.get('/api/booths/status', async (req: Request, res: Response) => {
    try {
      const boothStatuses = await storage.getBoothStatuses();
      res.json(boothStatuses);
    } catch (error) {
      console.error('Error fetching booth statuses:', error);
      res.status(500).json({ message: 'Failed to fetch booth statuses' });
    }
  });
  
  // Update token status
  app.patch('/api/tokens/:tokenNumber/status', async (req: Request, res: Response) => {
    try {
      const { tokenNumber } = req.params;
      const statusSchema = z.object({
        status: z.enum([TokenStatus.WAITING, TokenStatus.ATTENDING, TokenStatus.SERVED])
      });
      
      // Validate the request body
      const validationResult = statusSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const { status } = validationResult.data;
      
      // Get the token
      const token = await storage.getTokenByNumber(tokenNumber);
      
      if (!token) {
        return res.status(404).json({ message: 'Token not found' });
      }
      
      // If moving to ATTENDING, check if the booth has capacity
      if (status === TokenStatus.ATTENDING) {
        const booth = await storage.getBooth(token.boothId);
        const boothTokens = await storage.getTokensByBooth(token.boothId);
        const attendingTokens = boothTokens.filter(t => t.status === TokenStatus.ATTENDING);
        
        // Get staff capacity with a default of 1
        const staffCapacity = booth?.staffCapacity || 1;
        
        // Check if we've reached capacity (should be prevented on the frontend, but double-checking here)
        if (attendingTokens.length >= staffCapacity) {
          console.log(`Booth ${token.boothId} has reached staff capacity (${staffCapacity}). Cannot attend to more tokens.`);
          // We'll still allow this to proceed as the UI should prevent this situation
        }
      }
      
      // Update the token status
      const updatedToken = await storage.updateToken(token.id, { status });
      
      if (!updatedToken) {
        return res.status(500).json({ message: 'Failed to update token status' });
      }
      
      // Get the updated token with details
      const tokenWithDetails = await storage.getTokenWithDetails(updatedToken.id);
      
      if (!tokenWithDetails) {
        return res.status(500).json({ message: 'Failed to get token details' });
      }
      
      // Send email notification about status change
      sendStatusUpdateEmail(tokenWithDetails);
      
      // Broadcast token update to all clients
      broadcastMessage({
        type: 'TOKEN_UPDATED',
        payload: tokenWithDetails
      });
      
      // Update booth statuses
      const boothStatuses = await storage.getBoothStatuses();
      broadcastMessage({
        type: 'BOOTH_UPDATED',
        payload: boothStatuses
      });
      
      // Get updated dashboard stats
      const dashboardStats = await storage.getDashboardStats();
      broadcastMessage({
        type: 'DASHBOARD_UPDATED',
        payload: dashboardStats
      });
      
      res.json(tokenWithDetails);
    } catch (error) {
      console.error('Error updating token status:', error);
      res.status(500).json({ message: 'Failed to update token status' });
    }
  });
  
  // Reassign a token to a different booth
  app.post('/api/tokens/reassign', async (req: Request, res: Response) => {
    try {
      console.log('Received token reassignment request:', req.body);
      
      // Validate the request body
      const validationResult = reassignmentFormSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        console.error('Validation error:', errorMessage);
        return res.status(400).json({ message: errorMessage });
      }
      
      const { tokenNumber, fromBoothId, toBoothId, reason } = validationResult.data;
      console.log('Parsed data:', { tokenNumber, fromBoothId, toBoothId, reason });
      
      // Get the token
      const token = await storage.getTokenByNumber(tokenNumber);
      
      if (!token) {
        return res.status(404).json({ message: 'Token not found' });
      }
      
      // Check if the token is assigned to the from booth
      if (token.boothId !== fromBoothId) {
        return res.status(400).json({ message: 'Token is not assigned to the specified booth' });
      }
      
      // Check if the target booth exists
      const targetBooth = await storage.getBooth(toBoothId);
      if (!targetBooth) {
        return res.status(404).json({ message: 'Target booth not found' });
      }
      
      // Get the source booth name for email
      const sourceBooth = await storage.getBooth(fromBoothId);
      if (!sourceBooth) {
        return res.status(404).json({ message: 'Source booth not found' });
      }
      
      // Update the token's booth and timestamp to ensure it goes to the end of the queue
      console.log('Reassigning token:', token.id, 'from booth', fromBoothId, 'to booth', toBoothId);
      
      // Create an explicit token update object to avoid type issues
      const tokenUpdate: Partial<Token> = { 
        boothId: toBoothId,
        status: TokenStatus.WAITING, // Reset to waiting when reassigned
        statusUpdatedAt: new Date(), // Update status timestamp
        // The createdAt will be used for FIFO queue ordering, so we set it to current time
        // to ensure this token goes to the end of the queue in the new booth
        createdAt: new Date() 
      };
      
      console.log('Token update object:', tokenUpdate);
      const updatedToken = await storage.updateToken(token.id, tokenUpdate);
      console.log('Updated token result:', updatedToken);
      
      if (!updatedToken) {
        return res.status(500).json({ message: 'Failed to reassign token' });
      }
      
      // Create a reassignment record
      console.log('Creating reassignment record for token ID:', token.id);
      const reassignment = await storage.createReassignment({
        tokenId: token.id,
        fromBoothId,
        toBoothId,
        reason
      });
      console.log('Created reassignment record:', reassignment);
      
      // Get the updated token with details
      const tokenWithDetails = await storage.getTokenWithDetails(updatedToken.id);
      
      if (!tokenWithDetails) {
        return res.status(500).json({ message: 'Failed to get token details' });
      }
      
      // Calculate queue position and estimated wait time
      const boothTokens = await storage.getTokensWithDetailsByBooth(toBoothId);
      const waitingTokens = boothTokens.filter(t => t.status === TokenStatus.WAITING);
      console.log('Waiting tokens in target booth:', waitingTokens.map(t => ({ id: t.id, number: t.tokenNumber })));
      console.log('Looking for token ID:', updatedToken.id);
      const queuePosition = waitingTokens.findIndex(t => t.id === updatedToken.id) + 1;
      console.log('Calculated queue position:', queuePosition);
      const estimatedWaitTime = `~${queuePosition * 5} minutes`;
      
      tokenWithDetails.queuePosition = queuePosition;
      tokenWithDetails.estimatedWaitTime = estimatedWaitTime;
      
      // Send email notification about reassignment
      sendReassignmentEmail(tokenWithDetails, sourceBooth.name, reason);
      
      // Broadcast token reassignment to all clients
      broadcastMessage({
        type: 'TOKEN_REASSIGNED',
        payload: {
          token: tokenWithDetails,
          fromBoothId,
          fromBoothName: sourceBooth.name
        }
      });
      
      // Update booth statuses
      const boothStatuses = await storage.getBoothStatuses();
      broadcastMessage({
        type: 'BOOTH_UPDATED',
        payload: boothStatuses
      });
      
      res.json(tokenWithDetails);
    } catch (error) {
      console.error('Error reassigning token:', error);
      res.status(500).json({ message: 'Failed to reassign token' });
    }
  });
  
  // Get reassignment history
  app.get('/api/reassignments', async (req: Request, res: Response) => {
    try {
      // Get all reassignments
      const reassignments = await storage.getReassignments();
      
      // Create an array to hold the detailed reassignment history
      const reassignmentHistory = [];
      
      for (const reassignment of reassignments) {
        const token = await storage.getToken(reassignment.tokenId);
        const fromBooth = await storage.getBooth(reassignment.fromBoothId);
        const toBooth = await storage.getBooth(reassignment.toBoothId);
        const participant = token ? await storage.getParticipant(token.participantId) : null;
        
        if (token && fromBooth && toBooth && participant) {
          reassignmentHistory.push({
            id: reassignment.id,
            tokenNumber: token.tokenNumber,
            participant: {
              id: participant.id,
              name: participant.name
            },
            fromBooth: {
              id: fromBooth.id,
              name: fromBooth.name
            },
            toBooth: {
              id: toBooth.id,
              name: toBooth.name
            },
            reason: reassignment.reason,
            createdAt: reassignment.createdAt
          });
        }
      }
      
      // Sort by creation time (newest first)
      reassignmentHistory.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      res.json(reassignmentHistory);
    } catch (error) {
      console.error('Error fetching reassignment history:', error);
      res.status(500).json({ message: 'Failed to fetch reassignment history' });
    }
  });
  
  // Get all active tokens (for token selection dropdowns)
  app.get('/api/tokens/active', async (req: Request, res: Response) => {
    try {
      // Get all tokens
      const tokens = await storage.getTokensWithDetails();
      
      // Filter out served tokens and sort by creation time (newest first)
      const activeTokens = tokens
        .filter(token => token.status !== TokenStatus.SERVED)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(token => ({
          tokenNumber: token.tokenNumber,
          boothId: token.boothId,
          boothName: token.boothName,
          participantName: token.participant.name,
          status: token.status
        }));
      
      res.json(activeTokens);
    } catch (error) {
      console.error('Error fetching active tokens:', error);
      res.status(500).json({ message: 'Failed to fetch active tokens' });
    }
  });

  // Get dashboard stats
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });
  
  // Reload booth configuration
  app.post('/api/config/reload', async (req: Request, res: Response) => {
    try {
      const booths = await storage.reloadBoothConfig();
      
      // Get updated booth statuses
      const boothStatuses = await storage.getBoothStatuses();
      
      // Broadcast configuration update to all clients
      broadcastMessage({
        type: 'BOOTH_UPDATED',
        payload: boothStatuses
      });
      
      res.json({ success: true, booths });
    } catch (error) {
      console.error('Error reloading booth configuration:', error);
      res.status(500).json({ message: 'Failed to reload booth configuration' });
    }
  });

  // Add this new endpoint or modify the existing one
  app.get('/api/dashboard/served-tokens', async (req: Request, res: Response) => {
    try {
      // Get all tokens with SERVED status, sorted by most recent
      const servedTokens = await storage.getTokensByStatus(TokenStatus.SERVED);

      // Get details for each token
      const servedTokensWithDetails = await Promise.all(
          servedTokens.map(token => storage.getTokenWithDetails(token.id))
      );

      // Sort by most recently updated and limit to 10
      const recentlyServed = servedTokensWithDetails
          .filter(Boolean)
          .sort((a, b) =>
              new Date(b!.statusUpdatedAt).getTime() - new Date(a!.statusUpdatedAt).getTime()
          )
          .slice(0, 10);

      res.json(recentlyServed);
    } catch (error) {
      console.error('Error getting recently served tokens:', error);
      res.status(500).json({ error: "Failed to get recently served tokens" });
    }
  });
  
  
  return httpServer;
}
