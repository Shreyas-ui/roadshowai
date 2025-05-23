import fs from 'fs';
import path from 'path';
import { 
  Booth, InsertBooth,
  Participant, InsertParticipant,
  Token, InsertToken, TokenStatus,
  Reassignment, InsertReassignment,
  User, InsertUser,
  TokenWithDetails,
  BoothStatus,
  DashboardStats
} from '@shared/schema';
import { IStorage } from './storage';

// Define paths for the different JSON files in the data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOTHS_FILE_PATH = path.join(DATA_DIR, 'booths.json');
const BOOTH_CONFIG_FILE_PATH = path.join(DATA_DIR, 'booth-config.json');
const TOKENS_FILE_PATH = path.join(DATA_DIR, 'tokens.json');
const PARTICIPANTS_FILE_PATH = path.join(DATA_DIR, 'participants.json');
const REASSIGNMENTS_FILE_PATH = path.join(DATA_DIR, 'reassignments.json');
const COUNTER_FILE_PATH = path.join(DATA_DIR, 'counter.json');

// Helper functions to read from JSON files
function readBooths(): Booth[] {
  // First try to read from booth-config.json
  try {
    if (fs.existsSync(BOOTH_CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(BOOTH_CONFIG_FILE_PATH, 'utf8');
      console.log('Read booths from booth-config.json');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading booth-config.json file:', error);
  }
  
  // If booth-config.json isn't available, try booths.json
  try {
    if (fs.existsSync(BOOTHS_FILE_PATH)) {
      const data = fs.readFileSync(BOOTHS_FILE_PATH, 'utf8');
      console.log('Read booths from booths.json');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading booths.json file:', error);
  }
  
  // Default booths if no file is available
  console.log('Using default booths');
  return [
    {
      id: 1,
      name: "Everyday AI",
      description: "AI solutions for everyday business challenges",
      staffCapacity: 3,
      isActive: true
    },
    {
      id: 2,
      name: "Power Automate & Copilot Studio",
      description: "Business process automation with AI assistance",
      staffCapacity: 3,
      isActive: true
    },
    {
      id: 3,
      name: "Data",
      description: "Data platforms and analytics solutions",
      staffCapacity: 2,
      isActive: true
    },
    {
      id: 4,
      name: "AI Engg & Solution Design",
      description: "Custom AI engineering and architecture",
      staffCapacity: 2,
      isActive: true
    }
  ];
}

function readTokens(): Token[] {
  try {
    const data = fs.readFileSync(TOKENS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tokens file:', error);
    return [];
  }
}

function readParticipants(): Participant[] {
  try {
    const data = fs.readFileSync(PARTICIPANTS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading participants file:', error);
    return [];
  }
}

function readReassignments(): Reassignment[] {
  try {
    // Check if file exists first
    if (!fs.existsSync(REASSIGNMENTS_FILE_PATH)) {
      console.log('Reassignments file does not exist yet, returning empty array');
      return [];
    }
    
    const data = fs.readFileSync(REASSIGNMENTS_FILE_PATH, 'utf8');
    
    // Handle empty file case - if the file contains just [] or is empty
    if (!data || data.trim() === '' || data.trim() === '[]') {
      console.log('Reassignments file is empty, returning empty array');
      return [];
    }
    
    // Parse the data
    try {
      const parsedData = JSON.parse(data);
      console.log(`Read ${parsedData.length} reassignments from file`);
      return parsedData;
    } catch (parseError) {
      console.error('Error parsing reassignments JSON:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error reading reassignments file:', error);
    return [];
  }
}

function readCounter(): { lastTokenNumber: number } {
  try {
    const data = fs.readFileSync(COUNTER_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading counter file:', error);
    return { lastTokenNumber: 0 };
  }
}

// Helper functions to write to JSON files
function writeBooths(booths: Booth[]) {
  try {
    fs.writeFileSync(BOOTHS_FILE_PATH, JSON.stringify(booths, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to booths file:', error);
  }
}

function writeTokens(tokens: Token[]) {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    console.log(`Writing ${tokens.length} tokens to file:`, TOKENS_FILE_PATH);
    console.log('Tokens to write:', tokens.map(t => ({
      id: t.id,
      tokenNumber: t.tokenNumber, 
      boothId: t.boothId, 
      status: t.status
    })));
    
    fs.writeFileSync(TOKENS_FILE_PATH, JSON.stringify(tokens, null, 2), 'utf8');
    console.log('Tokens written successfully');
  } catch (error) {
    console.error('Error writing to tokens file:', error);
  }
}

function writeParticipants(participants: Participant[]) {
  try {
    fs.writeFileSync(PARTICIPANTS_FILE_PATH, JSON.stringify(participants, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to participants file:', error);
  }
}

function writeReassignments(reassignments: Reassignment[]) {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    console.log(`Writing ${reassignments.length} reassignments to file:`, REASSIGNMENTS_FILE_PATH);
    console.log('Reassignments to write:', reassignments.map(r => ({
      id: r.id,
      tokenId: r.tokenId,
      fromBoothId: r.fromBoothId,
      toBoothId: r.toBoothId
    })));
    
    fs.writeFileSync(REASSIGNMENTS_FILE_PATH, JSON.stringify(reassignments, null, 2), 'utf8');
    console.log('Reassignments written successfully');
  } catch (error) {
    console.error('Error writing to reassignments file:', error);
  }
}

function writeCounter(counter: { lastTokenNumber: number }) {
  try {
    fs.writeFileSync(COUNTER_FILE_PATH, JSON.stringify(counter, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to counter file:', error);
  }
}

// Generate token number in format AI01, AI02, etc.
function generateTokenNumber(lastNumber: number): string {
  const nextNumber = lastNumber + 1;
  return `AI${nextNumber.toString().padStart(2, '0')}`;
}

export class JsonStorage implements IStorage {
  private users: Map<number, User>;
  private userIdCounter: number;

  constructor() {
    // Initialize users - they're not stored in JSON for simplicity
    this.users = new Map();
    this.userIdCounter = 1;
  }
  
  // Configuration operations
  async reloadBoothConfig(): Promise<Booth[]> {
    try {
      const booths = readBooths();
      
      // Update the booths.json file with the config data
      writeBooths(booths);
      
      console.log('Booth configuration reloaded successfully');
      return booths;
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
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.userIdCounter++,
      ...user,
      createdAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // Booth operations
  async getBooth(id: number): Promise<Booth | undefined> {
    const booths = readBooths();
    return booths.find((booth: Booth) => booth.id === id);
  }

  async getBoothByName(name: string): Promise<Booth | undefined> {
    const booths = readBooths();
    return booths.find((booth: Booth) => booth.name === name);
  }

  async getBooths(): Promise<Booth[]> {
    return readBooths();
  }

  async createBooth(booth: InsertBooth): Promise<Booth> {
    const booths = readBooths();
    const newBooth: Booth = {
      id: Math.max(0, ...booths.map((b: Booth) => b.id)) + 1,
      ...booth,
      isActive: true,
    };
    booths.push(newBooth);
    writeBooths(booths);
    return newBooth;
  }

  async updateBooth(id: number, boothUpdate: Partial<Booth>): Promise<Booth | undefined> {
    const booths = readBooths();
    const index = booths.findIndex((booth: Booth) => booth.id === id);
    if (index === -1) return undefined;
    
    booths[index] = { ...booths[index], ...boothUpdate };
    writeBooths(booths);
    return booths[index];
  }

  // Participant operations
  async getParticipant(id: number): Promise<Participant | undefined> {
    const participants = readParticipants();
    return participants.find((p: Participant) => p.id === id);
  }

  async getParticipants(): Promise<Participant[]> {
    return readParticipants();
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const participants = readParticipants();
    const newParticipant: Participant = {
      id: participants.length > 0 ? 
        Math.max(...participants.map((p: Participant) => p.id)) + 1 : 1,
      ...participant,
      createdAt: new Date()
    };
    participants.push(newParticipant);
    writeParticipants(participants);
    return newParticipant;
  }

  // Token operations
  async getToken(id: number): Promise<Token | undefined> {
    const tokens = readTokens();
    return tokens.find((t: Token) => t.id === id);
  }

  async getTokenByNumber(tokenNumber: string): Promise<Token | undefined> {
    const tokens = readTokens();
    return tokens.find((t: Token) => t.tokenNumber === tokenNumber);
  }

  async getTokens(): Promise<Token[]> {
    return readTokens();
  }

  async getTokensByBooth(boothId: number): Promise<Token[]> {
    const tokens = readTokens();
    return tokens.filter((t: Token) => t.boothId === boothId);
  }

  async getTokensByStatus(status: TokenStatus): Promise<Token[]> {
    const tokens = readTokens();
    return tokens.filter((t: Token) => t.status === status);
  }

  async createToken(token: InsertToken): Promise<Token> {
    const tokens = readTokens();
    const counter = readCounter();
    
    // Generate token number and update lastTokenNumber
    const tokenNumber = generateTokenNumber(counter.lastTokenNumber);
    counter.lastTokenNumber += 1;
    writeCounter(counter);
    
    const newToken: Token = {
      id: tokens.length > 0 ? 
        Math.max(...tokens.map((t: Token) => t.id)) + 1 : 1,
      tokenNumber: tokenNumber, // Set token number explicitly
      participantId: token.participantId,
      boothId: token.boothId,
      status: TokenStatus.WAITING,
      createdAt: new Date(),
      statusUpdatedAt: new Date()
    };
    
    tokens.push(newToken);
    writeTokens(tokens);
    return newToken;
  }

  async updateToken(id: number, tokenUpdate: Partial<Token>): Promise<Token | undefined> {
    const tokens = readTokens();
    const index = tokens.findIndex((token: Token) => token.id === id);
    if (index === -1) return undefined;
    
    console.log('Updating token:', id, 'with data:', tokenUpdate);
    console.log('Original token:', tokens[index]);
    
    // If status is changing, update statusUpdatedAt
    if (tokenUpdate.status && tokenUpdate.status !== tokens[index].status) {
      tokenUpdate.statusUpdatedAt = new Date();
    }
    
    // Create a new token object with updates
    tokens[index] = { ...tokens[index], ...tokenUpdate };
    console.log('Updated token object:', tokens[index]);
    
    // Write the updated tokens to disk
    writeTokens(tokens);
    return tokens[index];
  }

  // Reassignment operations
  async getReassignment(id: number): Promise<Reassignment | undefined> {
    const reassignments = readReassignments();
    return reassignments.find((r: Reassignment) => r.id === id);
  }

  async getReassignments(): Promise<Reassignment[]> {
    return readReassignments();
  }

  async getReassignmentsByToken(tokenId: number): Promise<Reassignment[]> {
    const reassignments = readReassignments();
    return reassignments.filter((r: Reassignment) => r.tokenId === tokenId);
  }

  async createReassignment(reassignment: InsertReassignment): Promise<Reassignment> {
    console.log('Creating reassignment with data:', reassignment);
    const reassignments = readReassignments();
    
    // Ensure reason is not undefined (JSON schema requires it to be string | null)
    const sanitizedReason = reassignment.reason === undefined ? null : reassignment.reason;
    
    // Create the new reassignment with proper ID generation
    const newReassignment: Reassignment = {
      id: reassignments.length > 0 ? 
        Math.max(...reassignments.map((r: Reassignment) => r.id)) + 1 : 1,
      tokenId: reassignment.tokenId,
      fromBoothId: reassignment.fromBoothId,
      toBoothId: reassignment.toBoothId,
      reason: sanitizedReason,
      createdAt: new Date()
    };
    
    console.log('New reassignment object created:', newReassignment);
    
    // Add to array and write to file
    reassignments.push(newReassignment);
    writeReassignments(reassignments);
    
    console.log('Reassignment created and saved successfully');
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
    const detailedTokens: TokenWithDetails[] = [];
    
    for (const token of tokens) {
      const detailedToken = await this.expandTokenWithDetails(token);
      if (detailedToken) detailedTokens.push(detailedToken);
    }
    
    return detailedTokens;
  }

  async getTokensWithDetailsByBooth(boothId: number): Promise<TokenWithDetails[]> {
    const tokens = await this.getTokensByBooth(boothId);
    const detailedTokens: TokenWithDetails[] = [];
    
    for (const token of tokens) {
      const detailedToken = await this.expandTokenWithDetails(token);
      if (detailedToken) detailedTokens.push(detailedToken);
    }
    
    // Sort tokens by creation time (oldest first for proper queuing)
    detailedTokens.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime; // Ascending order (FIFO principle)
    });
    
    console.log(`Booth ${boothId} sorted tokens:`, 
      detailedTokens.map(t => ({
        id: t.id,
        token: t.tokenNumber,
        status: t.status,
        created: t.createdAt
      }))
    );
    
    return detailedTokens;
  }

  async getBoothStatuses(): Promise<BoothStatus[]> {
    const booths = await this.getBooths();
    const boothStatuses: BoothStatus[] = [];
    
    for (const booth of booths) {
      const status = await this.getBoothStatus(booth.id);
      if (status) boothStatuses.push(status);
    }
    
    return boothStatuses;
  }

  async getBoothStatus(boothId: number): Promise<BoothStatus | undefined> {
    const booth = await this.getBooth(boothId);
    if (!booth) return undefined;
    
    const tokens = await this.getTokensWithDetailsByBooth(boothId);
    
    // Find currently serving tokens
    const currentlyServingTokens = tokens
      .filter(t => t.status === TokenStatus.ATTENDING)
      .sort((a, b) => new Date(a.statusUpdatedAt).getTime() - new Date(b.statusUpdatedAt).getTime());
    
    const currentlyServingCount = currentlyServingTokens.length;
    
    // Find waiting tokens and sort by creation time
    const waitingTokens = tokens
      .filter(t => t.status === TokenStatus.WAITING)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Get staffCapacity from booth with a default of 1 if missing
    const staffCapacity = booth.staffCapacity || 1;
    
    // Add queue position and estimated wait time to waiting tokens
    for (let i = 0; i < waitingTokens.length; i++) {
      // Calculate how many staff members will be available
      const availableStaff = Math.max(staffCapacity - currentlyServingCount, 1);
      // Calculate which staff member this token will be assigned to
      const staffPosition = Math.floor(i / availableStaff);
      
      waitingTokens[i].queuePosition = i + 1;
      // Estimate wait time based on position and available staff
      waitingTokens[i].estimatedWaitTime = `~${(staffPosition + 1) * 5} minutes`;
    }
    
    // Calculate average wait time
    const servedTokens = tokens.filter(t => t.status === TokenStatus.SERVED);
    let averageWaitTime = 'N/A';
    
    if (servedTokens.length > 0) {
      const totalWaitTimes = servedTokens.reduce((sum, token) => {
        const createdAt = new Date(token.createdAt).getTime();
        const statusUpdatedAt = new Date(token.statusUpdatedAt).getTime();
        return sum + (statusUpdatedAt - createdAt);
      }, 0);
      
      const avgWaitTimeMinutes = Math.floor(totalWaitTimes / servedTokens.length / 60000);
      averageWaitTime = `${avgWaitTimeMinutes} mins`;
    }
    
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
    
    const waiting = tokens.filter(t => t.status === TokenStatus.WAITING).length;
    const attending = tokens.filter(t => t.status === TokenStatus.ATTENDING).length;
    const served = tokens.filter(t => t.status === TokenStatus.SERVED).length;
    
    return {
      totalTokens: tokens.length,
      waiting,
      attending,
      served
    };
  }

  private async expandTokenWithDetails(token: Token): Promise<TokenWithDetails | undefined> {
    const booth = await this.getBooth(token.boothId);
    const participant = await this.getParticipant(token.participantId);
    
    if (!booth || !participant) return undefined;
    
    // Calculate queue position and estimated wait time
    let queuePosition: number | undefined;
    let estimatedWaitTime: string | undefined;
    
    if (token.status === TokenStatus.WAITING) {
      const boothTokens = await this.getTokensByBooth(token.boothId);
      const waitingTokensAhead = boothTokens
        .filter(t => t.status === TokenStatus.WAITING && 
                  new Date(t.createdAt).getTime() < new Date(token.createdAt).getTime())
        .length;
      
      queuePosition = waitingTokensAhead + 1;
      estimatedWaitTime = `${waitingTokensAhead * 15 + 5} mins`;
    }
    
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
      statusUpdatedAt: token.statusUpdatedAt,
      queuePosition,
      estimatedWaitTime
    };
  }
}

// Create and export the storage instance
export const storage = new JsonStorage();
