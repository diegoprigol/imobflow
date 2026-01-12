
export enum Sector {
  ADMIN = 'Administrativo',
  JURIDICO = 'Jurídico',
  COBRANCA = 'Cobranças',
  VENDAS = 'Vendas'
}

export enum TaskStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em andamento',
  WAITING_DOCS = 'Aguardando Documentos',
  DONE = 'Concluído'
}

export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export interface User {
  id: string;
  name: string;
  role: Sector;
  avatar: string;
  password?: string;
  isMaster?: boolean;
}

export interface TaskAttachment {
  name: string;
  type: string;
  url: string; // Base64 or local URL for simulation
}

export interface Task {
  id: string;
  title: string;
  description: string;
  sector: Sector;
  assignedTo?: string; // User ID
  priority: Priority;
  status: TaskStatus;
  relatedPropertyId?: string;
  createdAt: string;
  dueDate: string;
  attachments?: TaskAttachment[];
}

export interface Property {
  id: string;
  address: string;
  owner: string;
  tenantId?: string;
  status: 'Occupied' | 'Vacant' | 'Maintenance';
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Debt {
  id: string;
  tenantName: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  isLegalRecovery: boolean;
  settlement?: {
    value: number;
    date: string;
    method: string;
  };
  history: { date: string; event: string }[];
}

export interface Note {
  author: string;
  role: Sector;
  text: string;
  timestamp: string;
}

export type DeadlineStatus = 'none' | 'waiting_acceptance' | 'processing' | 'completed';

export interface LegalCase {
  id: string;
  processNumber: string;
  title: string;
  status: 'Protocolado' | 'Distribuído' | 'Audiência' | 'Sentenciado' | 'Encerrado';
  lawyerId: string;
  description: string;
  nextHearing?: string;
  sharedNotes: Note[];
  deadlineStatus: DeadlineStatus;
  deadlineTarget?: string;
}

export interface ChatMessage {
  id: string;
  contextId: string;
  userId: string;
  text: string;
  timestamp: string;
}

export enum SaleStage {
  LEAD = 'Lead',
  VISIT = 'Visita',
  PROPOSAL = 'Proposta',
  CONTRACT = 'Contrato',
  CLOSED = 'Concluído'
}

export interface SaleOpportunity {
  id: string;
  propertyId: string;
  clientName: string;
  clientEmail: string;
  value: number;
  stage: SaleStage;
  documents: string[];
  lastContact: string;
}
