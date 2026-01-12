
import { Sector, TaskStatus, Priority, User, Property, Tenant, Task, Debt, LegalCase, ChatMessage, SaleOpportunity, SaleStage } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u0', name: 'Diretor Geral', role: Sector.ADMIN, avatar: 'https://picsum.photos/id/91/100/100', isMaster: true, password: 'admin' },
  { id: 'u1', name: 'Ana Silva', role: Sector.ADMIN, avatar: 'https://picsum.photos/id/64/100/100', password: '123' },
  { id: 'u2', name: 'Dr. Carlos Souza', role: Sector.JURIDICO, avatar: 'https://picsum.photos/id/65/100/100', password: '123' },
  { id: 'u3', name: 'Mariana Costa', role: Sector.COBRANCA, avatar: 'https://picsum.photos/id/66/100/100', password: '123' },
  { id: 'u4', name: 'Pedro Santos', role: Sector.VENDAS, avatar: 'https://picsum.photos/id/67/100/100', password: '123' },
];

export const MOCK_PROPERTIES: Property[] = [
  { id: 'p1', address: 'Rua das Flores, 123, Centro', owner: 'João Miller', tenantId: 't1', status: 'Occupied' },
  { id: 'p2', address: 'Av. Paulista, 900, Apt 45', owner: 'Empresa X', tenantId: 't2', status: 'Occupied' },
  { id: 'p3', address: 'Rua Augusta, 500, Loja 1', owner: 'Maria Ferreira', status: 'Vacant' },
];

export const MOCK_TENANTS: Tenant[] = [
  { id: 't1', name: 'Roberto Alencar', email: 'roberto@email.com', phone: '(11) 99999-9999' },
  { id: 't2', name: 'Lucia Mendes', email: 'lucia@email.com', phone: '(11) 98888-8888' },
];

export const MOCK_TASKS: Task[] = [
  { 
    id: 'tsk1', 
    title: 'Análise de Contrato - Rua das Flores', 
    description: 'Verificar cláusulas de rescisão antes da renovação.',
    sector: Sector.JURIDICO,
    assignedTo: 'u2',
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    relatedPropertyId: 'p1',
    createdAt: '2023-10-01',
    dueDate: '2023-10-15'
  },
];

export const MOCK_DEBTS: Debt[] = [
  {
    id: 'd1',
    tenantName: 'Roberto Alencar',
    propertyAddress: 'Rua das Flores, 123',
    amount: 2500.00,
    dueDate: '2024-02-10',
    status: 'Paid',
    isLegalRecovery: true,
    settlement: {
      value: 2350.00,
      date: '2024-02-15',
      method: 'Pix'
    },
    history: [{ date: '2024-02-10', event: 'Vencimento' }, { date: '2024-02-15', event: 'Acerto via Jurídico' }]
  },
  {
    id: 'd2',
    tenantName: 'Lucia Mendes',
    propertyAddress: 'Av. Paulista, 900',
    amount: 3200.00,
    dueDate: '2024-03-05',
    status: 'Overdue',
    isLegalRecovery: false,
    history: [{ date: '2024-03-05', event: 'Vencimento' }]
  }
];

export const MOCK_CASES: LegalCase[] = [
  {
    id: 'c1',
    processNumber: '0012345-88.2023.8.26.0100',
    title: 'Despejo por Falta de Pagamento - Roberto Alencar',
    status: 'Protocolado',
    lawyerId: 'u2',
    description: 'Ação de despejo cumulada com cobrança de aluguéis.',
    nextHearing: '2023-11-20',
    sharedNotes: [],
    deadlineStatus: 'none'
  }
];

export const MOCK_MESSAGES: ChatMessage[] = [];
export const MOCK_SALES: SaleOpportunity[] = [];
