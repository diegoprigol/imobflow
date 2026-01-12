
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Gavel, 
  DollarSign, 
  Users, 
  Settings, 
  Bell, 
  Search,
  Menu,
  X,
  Plus,
  UserPlus,
  LogOut,
  Landmark
} from 'lucide-react';
import { MOCK_TASKS, MOCK_DEBTS, MOCK_CASES, MOCK_USERS } from './constants';
import { Dashboard } from './components/Dashboard';
import { AdminModule, CollectionsModule, LegalModule, FinancialModule, UsersModule, AIChatBot, ProfileSettingsModal } from './components/Modules';
import { TaskStatus, Sector, User, LegalCase, Debt, Task } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin' | 'juridico' | 'cobrancas' | 'financeiro' | 'users'>('dashboard');
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [debts, setDebts] = useState<Debt[]>(MOCK_DEBTS);
  const [cases, setCases] = useState(MOCK_CASES);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    setCurrentView('dashboard');
  }, [currentUser]);

  const handleTaskStatusUpdate = (id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: `tsk${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: TaskStatus.PENDING
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleFinalizeLegalTask = (id: string, amount: number, paymentMethod: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // 1. Marcar tarefa como concluída
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: TaskStatus.DONE } : t));

    // 2. Gerar lançamento financeiro automático
    const newDebt: Debt = {
      id: `d_legal_${Date.now()}`,
      tenantName: task.title.split('-')[1]?.trim() || 'Recuperação Jurídica',
      propertyAddress: task.description.slice(0, 30) + '...',
      amount: amount,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Paid',
      isLegalRecovery: true,
      settlement: {
        value: amount,
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod
      },
      history: [
        { date: new Date().toISOString().split('T')[0], event: `Finalização de Demanda Jurídica: ${task.title}` },
        { date: new Date().toISOString().split('T')[0], event: `Pagamento recebido via ${paymentMethod}` }
      ]
    };
    setDebts(prev => [newDebt, ...prev]);
  };

  const handleUpdateCase = (updatedCase: LegalCase) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  const handleSettleDebt = (debtId: string, settlement: Debt['settlement']) => {
    setDebts(prev => prev.map(d => d.id === debtId ? { 
      ...d, 
      status: 'Paid', 
      settlement, 
      history: [...d.history, { date: settlement!.date, event: `Acerto baixado via ${settlement!.method}` }] 
    } : d));
  };

  const handleAddUser = (name: string, role: Sector) => {
    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      role,
      password: '123',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
    setAllUsers([...allUsers, newUser]);
  };

  const handleDeleteUser = (id: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const getNavItems = (user: User) => {
    const allItems = [
      { id: 'dashboard', label: 'Dashboard Geral', icon: <LayoutDashboard size={20} /> },
      { id: 'admin', label: 'Demandas/Admin', icon: <Briefcase size={20} /> },
      { id: 'juridico', label: 'Jurídico', icon: <Gavel size={20} /> },
      { id: 'cobrancas', label: 'Cobranças', icon: <DollarSign size={20} /> },
      { id: 'financeiro', label: 'Financeiro', icon: <Landmark size={20} /> },
    ];

    if (user.isMaster) return allItems;
    if (user.role === Sector.JURIDICO) return allItems.filter(i => ['dashboard', 'juridico', 'admin'].includes(i.id));
    if (user.role === Sector.COBRANCA) return allItems.filter(i => ['dashboard', 'cobrancas', 'admin'].includes(i.id));
    return allItems;
  };

  const currentNavItems = getNavItems(currentUser);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard userRole={currentUser.role} tasks={tasks} debts={debts} cases={cases} />;
      case 'admin':
        return <AdminModule tasks={tasks} onUpdateStatus={handleTaskStatusUpdate} onAddTask={handleAddTask} />;
      case 'juridico':
        return (
          <LegalModule 
            cases={cases} 
            tasks={tasks.filter(t => t.sector === Sector.JURIDICO)}
            currentUser={currentUser} 
            onUpdateCase={handleUpdateCase} 
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTaskStatus={handleTaskStatusUpdate}
            onFinalizeTask={handleFinalizeLegalTask}
          />
        );
      case 'cobrancas':
        return <CollectionsModule debts={debts} />;
      case 'financeiro':
        return <FinancialModule debts={debts} onSettleDebt={handleSettleDebt} />;
      case 'users':
        return <UsersModule users={allUsers} currentUser={currentUser} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />;
      default:
        return <div className="p-4">Página não encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-inter">
      <AIChatBot />
      {isProfileModalOpen && (
        <ProfileSettingsModal 
          user={currentUser} 
          onClose={() => setProfileModalOpen(false)} 
          onUpdate={handleUpdateProfile} 
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shadow-xl flex flex-col shrink-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs">IF</div>
            ImobFlow
          </span>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {currentNavItems.map(item => (
            <button key={item.id} onClick={() => { setCurrentView(item.id as any); if(window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {item.icon} <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
          {(currentUser.role === Sector.ADMIN || currentUser.isMaster) && (
            <button onClick={() => setCurrentView('users')} className={`w-full mt-8 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Users size={20} /> <span className="font-medium text-sm">Gestão de Equipe</span>
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 relative group bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <div className="relative shrink-0">
              <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover" />
              <button 
                onClick={() => setProfileModalOpen(true)}
                className="absolute -top-1 -right-1 bg-blue-600 p-1 rounded-full border border-slate-900 hover:bg-blue-500 transition-colors shadow-lg"
                title="Configurações de Perfil"
              >
                <Settings size={10} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-bold">{currentUser.isMaster ? 'Master' : currentUser.role}</p>
            </div>
            <div className="relative group shrink-0">
              <LogOut size={16} className="text-slate-500 group-hover:text-white cursor-pointer transition-colors" />
              <select 
                className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer" 
                onChange={(e) => {
                  const u = allUsers.find(u => u.id === e.target.value);
                  if(u) setCurrentUser(u);
                }} 
                value={currentUser.id}
              >
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
            <div className="flex flex-col">
               <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">
                {currentView === 'dashboard' ? 'Overview Geral' : currentNavItems.find(i => i.id === currentView)?.label || 'Sistema'}
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ImobFlow v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative">
              <input type="text" placeholder="Pesquisar no sistema..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full relative">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-[#f8fafc] custom-scrollbar">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}

export default App;
