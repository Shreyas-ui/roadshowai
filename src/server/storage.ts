import { 
  User, InsertUser, 
  Booth, InsertBooth, 
  Participant, InsertParticipant, 
  Token, InsertToken, 
  Reassignment, InsertReassignment,
  TokenStatus,
  TokenWithDetails,
  BoothStatus,
  DashboardStats
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booth operations
  getBooth(id: number): Promise<Booth | undefined>;
  getBoothByName(name: string): Promise<Booth | undefined>;
  getBooths(): Promise<Booth[]>;
  createBooth(booth: InsertBooth): Promise<Booth>;
  updateBooth(id: number, booth: Partial<Booth>): Promise<Booth | undefined>;
  
  // Participant operations
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipants(): Promise<Participant[]>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  
  // Token operations
  getToken(id: number): Promise<Token | undefined>;
  getTokenByNumber(tokenNumber: string): Promise<Token | undefined>;
  getTokens(): Promise<Token[]>;
  getTokensByBooth(boothId: number): Promise<Token[]>;
  getTokensByStatus(status: TokenStatus): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: number, token: Partial<Token>): Promise<Token | undefined>;
  
  // Reassignment operations
  getReassignment(id: number): Promise<Reassignment | undefined>;
  getReassignments(): Promise<Reassignment[]>;
  getReassignmentsByToken(tokenId: number): Promise<Reassignment[]>;
  createReassignment(reassignment: InsertReassignment): Promise<Reassignment>;
  
  // Combined operations
  getTokenWithDetails(tokenId: number): Promise<TokenWithDetails | undefined>;
  getTokenWithDetailsByNumber(tokenNumber: string): Promise<TokenWithDetails | undefined>;
  getTokensWithDetails(): Promise<TokenWithDetails[]>;
  getTokensWithDetailsByBooth(boothId: number): Promise<TokenWithDetails[]>;
  getBoothStatuses(): Promise<BoothStatus[]>;
  getBoothStatus(boothId: number): Promise<BoothStatus | undefined>;
  getDashboardStats(): Promise<DashboardStats>;
  
  // Configuration operations
  reloadBoothConfig(): Promise<Booth[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private booths: Map<number, Booth>;
  private participants: Map<number, Participant>;
  private tokens: Map<number, Token>;
  private reassignments: Map<number, Reassignment>;
  
  private userIdCounter: number;
  private boothIdCounter: number;
  private participantIdCounter: number;
  private tokenIdCounter: number;
  private reassignmentIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.booths = new Map();
    this.participants = new Map();
    this.tokens = new Map();
    this.reassignments = new Map();
    
    this.userIdCounter = 1;
    this.boothIdCounter = 1;
    this.participantIdCounter = 1;
    this.tokenIdCounter = 1;
    this.reassignmentIdCounter = 1;
    
    // Initialize with default booths
    this.initializeDefaultBooths();
  }
  
  private initializeDefaultBooths() {
    const defaultBooths = [
      { name: "Everyday AI", description: "AI solutions for everyday business challenges", staffCapacity: 3 },
      { name: "Power Automate & Copilot Studio", description: "Business process automation with AI assistance", staffCapacity: 3 },
      { name: "Data", description: "Data platforms and analytics solutions", staffCapacity: 2 },
      { name: "AI Engg & Solution Design", description: "Custom AI engineering and architecture", staffCapacity: 2 }
    ];
    
    defaultBooths.forEach(booth => {
      this.createBooth({
        name: booth.name,
        description: booth.description,
        staffCapacity: booth.staffCapacity,
        isActive: true
      });
    });
  }
  
  // Configuration operations
  async reloadBoothConfig(): Promise<Booth[]> {
    try {
      // Clear existing booths
      this.booths.clear();
      this.boothIdCounter = 1;
      
      // Reinitialize with default booths
      this.initializeDefaultBooths();
      
      return this.getBooths();
    } catch (error) {
      console.error('Error reloading booth configuration:', error);
      return [];
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Booth operations
  async getBooth(id: number): Promise<Booth | undefined> {
    return this.booths.get(id);
  }
  
  async getBoothByName(name: string): Promise<Booth | undefined> {
    return Array.from(this.booths.values()).find(booth => booth.name === name);
  }
  
  async getBooths(): Promise<Booth[]> {
    return Array.from(this.booths.values());
  }
  
  async createBooth(booth: InsertBooth): Promise<Booth> {
    const id = this.boothIdCounter++;
    const newBooth = { ...booth, id };
    this.booths.set(id, newBooth);
    return newBooth;
  }
  
  async updateBooth(id: number, boothUpdate: Partial<Booth>): Promise<Booth | undefined> {
    const booth = await this.getBooth(id);
    if (!booth) return undefined;
    
    const updatedBooth = { ...booth, ...boothUpdate };
    this.booths.set(id, updatedBooth);
    return updatedBooth;
  }
  
  // Participant operations
  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }
  
  async getParticipants(): Promise<Participant[]> {
    return Array.from(this.participants.values());
  }
  
  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = this.participantIdCounter++;
    const now = new Date();
    const newParticipant = { ...participant, id, createdAt: now };
    this.participants.set(id, newParticipant);
    return newParticipant;
  }
  
  // Token operations
  async getToken(id: number): Promise<Token | undefined> {
    return this.tokens.get(id);
  }
  
  async getTokenByNumber(tokenNumber: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(token => token.tokenNumber === tokenNumber);
  }
  
  async getTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }
  
  async getTokensByBooth(boothId: number): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(token => token.boothId === boothId);
  }
  
  async getTokensByStatus(status: TokenStatus): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(token => token.status === status);
  }
  
  async createToken(token: InsertToken): Promise<Token> {
    const id = this.tokenIdCounter++;
    const now = new Date();
    const newToken = { ...token, id, createdAt: now, statusUpdatedAt: now };
    this.tokens.set(id, newToken);
    return newToken;
  }
  
  async updateToken(id: number, tokenUpdate: Partial<Token>): Promise<Token | undefined> {
    const token = await this.getToken(id);
    if (!token) return undefined;
    
    const now = new Date();
    const updatedToken = { 
      ...token, 
      ...tokenUpdate,
      statusUpdatedAt: tokenUpdate.status ? now : token.statusUpdatedAt 
    };
    this.tokens.set(id, updatedToken);
    return updatedToken;
  }
  
  // Reassignment operations
  async getReassignment(id: number): Promise<Reassignment | undefined> {
    return this.reassignments.get(id);
  }
  
  async getReassignments(): Promise<Reassignment[]> {
    return Array.from(this.reassignments.values());
  }
  
  async getReassignmentsByToken(tokenId: number): Promise<Reassignment[]> {
    return Array.from(this.reassignments.values()).filter(reassignment => reassignment.tokenId === tokenId);
  }
  
  async createReassignment(reassignment: InsertReassignment): Promise<Reassignment> {
    const id = this.reassignmentIdCounter++;
    const now = new Date();
    const newReassignment = { ...reassignment, id, createdAt: now };
    this.reassignments.set(id, newReassignment);
    return newReassignment;
  }
  
  // Combined operations
  async getTokenWithDetails(tokenId: number): Promise<TokenWithDetails | undefined> {
    const token = await this.getToken(tokenId);
    if (!token) return undefined;
    
    return this.expandTokenWithDetails(token);
  }
  
  async getTokenWithDetailsByNumber(tokenNumber: string): Promise<TokenWithDetails | undefined> {
    const token = await this.getTokenByNumber(tokenNumber);
    if (!token) return undefined;
    
    return this.expandTokenWithDetails(token);
  }
  
  async getTokensWithDetails(): Promise<TokenWithDetails[]> {
    const tokens = await this.getTokens();
    const tokensWithDetails: TokenWithDetails[] = [];
    
    for (const token of tokens) {
      const tokenWithDetails = await this.expandTokenWithDetails(token);
      if (tokenWithDetails) {
        tokensWithDetails.push(tokenWithDetails);
      }
    }
    
    return tokensWithDetails;
  }
  
  async getTokensWithDetailsByBooth(boothId: number): Promise<TokenWithDetails[]> {
    const tokens = await this.getTokensByBooth(boothId);
    const tokensWithDetails: TokenWithDetails[] = [];
    
    for (const token of tokens) {
      const tokenWithDetails = await this.expandTokenWithDetails(token);
      if (tokenWithDetails) {
        tokensWithDetails.push(tokenWithDetails);
      }
    }
    
    return tokensWithDetails.sort((a, b) => {
      // First by status (ATTENDING > WAITING > SERVED)
      if (a.status !== b.status) {
        if (a.status === TokenStatus.ATTENDING) return -1;
        if (b.status === TokenStatus.ATTENDING) return 1;
        if (a.status === TokenStatus.WAITING) return -1;
        if (b.status === TokenStatus.WAITING) return 1;
      }
      
      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
  
  async getBoothStatuses(): Promise<BoothStatus[]> {
    const booths = await this.getBooths();
    const boothStatuses: BoothStatus[] = [];
    
    for (const booth of booths) {
      const boothStatus = await this.getBoothStatus(booth.id);
      if (boothStatus) {
        boothStatuses.push(boothStatus);
      }
    }
    
    return boothStatuses;
  }
  
  async getBoothStatus(boothId: number): Promise<BoothStatus | undefined> {
    const booth = await this.getBooth(boothId);
    if (!booth) return undefined;
    
    const tokensWithDetails = await this.getTokensWithDetailsByBooth(boothId);
    
    // Find currently serving tokens
    const currentlyServingTokens = tokensWithDetails
      .filter(token => token.status === TokenStatus.ATTENDING)
      .sort((a, b) => a.statusUpdatedAt.getTime() - b.statusUpdatedAt.getTime());
    
    const currentlyServingCount = currentlyServingTokens.length;
    
    // Get waiting tokens (sorted by creation time)
    const waitingTokens = tokensWithDetails
      .filter(token => token.status === TokenStatus.WAITING)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Get staffCapacity from booth with a default of 1 if missing
    const staffCapacity = booth.staffCapacity || 1;
    
    // Calculate queue positions for waiting tokens
    waitingTokens.forEach((token, index) => {
      // Calculate how many staff members will be available
      const availableStaff = Math.max(staffCapacity - currentlyServingCount, 1);
      // Calculate which staff member this token will be assigned to
      const staffPosition = Math.floor(index / availableStaff);
      
      token.queuePosition = index + 1;
      // Estimate wait time based on position and available staff
      token.estimatedWaitTime = `~${(staffPosition + 1) * 5} minutes`;
    });
    
    // Calculate average wait time (mock value for now)
    const averageWaitTime = `~${Math.max(5, waitingTokens.length * 5)} minutes`;
    
    return {
      id: booth.id,
      name: booth.name,
      isActive: booth.isActive,
      staffCapacity: booth.staffCapacity || 1,
      currentlyServingCount,
      currentlyServing: currentlyServingTokens.length > 0 ? currentlyServingTokens : null,
      waitingTokens,
      averageWaitTime
    };
  }
  
  async getDashboardStats(): Promise<DashboardStats> {
    const tokens = await this.getTokens();
    
    return {
      totalTokens: tokens.length,
      waiting: tokens.filter(token => token.status === TokenStatus.WAITING).length,
      attending: tokens.filter(token => token.status === TokenStatus.ATTENDING).length,
      served: tokens.filter(token => token.status === TokenStatus.SERVED).length
    };
  }
  
  // Helper functions
  private async expandTokenWithDetails(token: Token): Promise<TokenWithDetails | undefined> {
    const participant = await this.getParticipant(token.participantId);
    const booth = await this.getBooth(token.boothId);
    
    if (!participant || !booth) return undefined;
    
    return {
      id: token.id,
      tokenNumber: token.tokenNumber,
      status: token.status,
      boothId: booth.id,
      boothName: booth.name,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        useCaseId: participant.useCaseId
      },
      createdAt: token.createdAt,
      statusUpdatedAt: token.statusUpdatedAt
    };
  }
}

export const storage = new MemStorage();
