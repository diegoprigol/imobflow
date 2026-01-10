
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line } from 'recharts';
import { Task, Debt, LegalCase, TaskStatus, Sector, Priority } from '../types';
import { 
  AlertCircle, 
  Scale, 
  DollarSign, 
  CheckCircle, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Clock, 
  Filter, 
  LayoutDashboard,
  Activity
} from 'lucide-react';

interface DashboardProps {
  userRole: Sector;
  tasks: Task[];
  debts: Debt[];
  cases: LegalCase[];
}

const SECTOR_COLORS: Record<string, string> = {
  [Sector.ADMIN]: '#3b82f6', // Blue
  [Sector.JURIDICO]: '#6366f1', // Indigo
  [Sector.COBRANCA]: '#f59e0b', // Amber
  [Sector.VENDAS]: '#10b981', // Emerald
};

const STATUS_COLORS = ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981'];

export const Dashboard: React.FC<DashboardProps> = ({ tasks, debts, cases }) => {
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });

  // 1. Filtering Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const sectorMatch = filterSector === 'all' || t.sector === filterSector;
      const priorityMatch = filterPriority === 'all' || t.priority === filterPriority;
      const dateMatch = t.createdAt >= dateRange.start && t.createdAt <= dateRange.end;
      return sectorMatch && priorityMatch && dateMatch;
    });
  }, [tasks, filterSector, filterPriority, dateRange]);

  const filteredDebts = useMemo(() => {
    return debts.filter(d => d.dueDate >= dateRange.start && d.dueDate <= dateRange.end);
  }, [debts, dateRange]);

  // 2. Calculation of Metrics
  const metrics = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === TaskStatus.DONE).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueDebts = filteredDebts.filter(d => d.status === 'Overdue').reduce((acc, d) => acc + d.amount, 0);
    const activeCases = cases.filter(c => c.status !== 'Encerrado').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return { totalTasks, completedTasks, pendingTasks, overdueDebts, activeCases, completionRate };
  }, [filteredTasks, filteredDebts, cases]);

  // 3. Chart Data Generation
  const tasksBySectorData = useMemo(() => {
    return Object.values(Sector).map(sector => ({
      name: sector,
      value: tasks.filter(t => t.sector === sector).length,
      color: SECTOR_COLORS[sector]
    })).filter(d => d.value > 0);
  }, [tasks]);

  const productivityData = useMemo(() => {
    return Object.values(Sector).map(sector => {
      const sectorTasks = tasks.filter(t => t.sector === sector);
      return {
        name: sector,
        concluido: sectorTasks.filter(t => t.status === TaskStatus.DONE).length,
        pendente: sectorTasks.filter(t => t.status !== TaskStatus.DONE).length,
      };
    });
  }, [tasks]);

  const caseStatusData = useMemo(() => {
    const statuses = ['Protocolado', 'Distribuído', 'Audiência', 'Sentenciado'];
    return statuses.map(status => ({
      status,
      count: cases.filter(c => c.status === status).length
    }));
  }, [cases]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <Filter size={20} className="text-blue-600" />
          <h2 className="font-bold text-sm">Painel de Controle Unificado</h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
          >
            <option value="all">Todos os Setores</option>
            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">Todas Prioridades</option>
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent text-[10px] font-bold py-1 outline-none" 
            />
            <span className="text-slate-300 text-xs">/</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent text-[10px] font-bold py-1 outline-none" 
            />
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Demandas Ativas</p>
            <h3 className="text-2xl font-black text-slate-800">{metrics.pendingTasks}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cobrança Atrasada</p>
            <h3 className="text-2xl font-black text-slate-800">R$ {metrics.overdueDebts.toLocaleString('pt-BR')}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Scale size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ações Judiciais</p>
            <h3 className="text-2xl font-black text-slate-800">{metrics.activeCases}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taxa de SLA</p>
            <h3 className="text-2xl font-black text-slate-800">{metrics.completionRate.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" /> Produtividade por Setor
            </h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div> CONCLUÍDO
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-200"></div> PENDENTE
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="concluido" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="pendente" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demands Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" /> Volume de Demandas
          </h4>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksBySectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tasksBySectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{metrics.totalTasks}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {tasksBySectorData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-600">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  {item.name}
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legal Status Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Scale size={18} className="text-indigo-600" /> Status Processual Jurídico
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caseStatusData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="status" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts / Deadlines */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-red-500" /> Prazos e Alertas Críticos
          </h4>
          <div className="space-y-3">
            {filteredTasks.filter(t => t.priority === Priority.CRITICAL || t.priority === Priority.HIGH).slice(0, 4).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-red-600 shadow-sm">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-none mb-1">{task.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{task.sector} • Prazo: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">{task.priority}</span>
              </div>
            ))}
            {filteredTasks.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Nenhum alerta crítico encontrado.</p>}
          </div>
          <button className="w-full mt-4 py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-colors rounded-lg">Ver Todas as Pendências</button>
        </div>
      </div>
    </div>
  );
};
