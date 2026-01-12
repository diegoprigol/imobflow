
import React, { useState, useEffect, useRef } from 'react';
import { Task, Debt, LegalCase, TaskStatus, Priority, Sector, ChatMessage, SaleOpportunity, SaleStage, User, TaskAttachment } from '../types';
import { 
  generateCollectionMessage, 
  generateLegalSummary, 
  analyzeDocumentRisk, 
  generateQuickReply, 
  transcribeAudio, 
  generateSpeech, 
  playRawAudio, 
  chatWithBot 
} from '../services/geminiService';
import { Clock, CheckSquare, AlertTriangle, FileText, Send, Paperclip, MessageSquare, BrainCircuit, Users, ChevronRight, Gavel, ShieldCheck, UserPlus, Trash2, Calendar, DollarSign, Edit, CheckCircle, Timer, Mic, Volume2, Sparkles, MessageCircle, X, Filter, ArrowUpCircle, ArrowDownCircle, Landmark, Key, Image as ImageIcon, Settings, Plus, LayoutList, Upload, File } from 'lucide-react';

/* --- SHARED COMPONENTS --- */

const Badge = ({ children, color }: { children?: React.ReactNode; color: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{children}</span>
);

/* --- ADD TASK MODAL --- */

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  defaultSector?: Sector;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAdd, defaultSector = Sector.ADMIN }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sector: defaultSector,
    priority: Priority.MEDIUM,
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newAttachments: TaskAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const filePromise = new Promise<TaskAttachment>((resolve) => {
        reader.onload = (event) => {
          resolve({
            name: file.name,
            type: file.type,
            url: event.target?.result as string
          });
        };
      });
      
      reader.readAsDataURL(file);
      newAttachments.push(await filePromise);
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onAdd({ ...formData, attachments });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <LayoutList size={20} className="text-blue-600" /> Nova Demanda
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Título da Demanda</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Ex: Revisão de Contrato Aluguel"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Descrição Detalhada</label>
            <textarea 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
              placeholder="Descreva o que precisa ser feito..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Setor Responsável</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.sector}
                onChange={e => setFormData({...formData, sector: e.target.value as Sector})}
              >
                {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Prioridade</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
              >
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Data Limite (Prazo)</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Paperclip size={14} /> Anexos e Documentos
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              <Upload className="mx-auto text-slate-400 mb-2" size={20} />
              <p className="text-xs text-slate-500 font-medium">Clique para anexar arquivos ou arraste aqui</p>
              <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, Imagens (Máx 5MB)</p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File size={14} className="text-blue-500 shrink-0" />
                      <span className="text-xs text-slate-600 truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {isUploading && <p className="text-[10px] text-blue-500 mt-2 animate-pulse">Carregando arquivos...</p>}
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isUploading}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus size={18} /> Criar Demanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- PROFILE SETTINGS MODAL --- */

interface ProfileSettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ user, onClose, onUpdate }) => {
  const [avatar, setAvatar] = useState(user.avatar);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    const updates: Partial<User> = { avatar };
    if (password) updates.password = password;
    
    onUpdate(updates);
    alert("Perfil atualizado com sucesso!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Settings size={20} className="text-blue-600" /> Configurações de Perfil
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center mb-4">
            <img src={avatar} alt="Preview" className="w-20 h-20 rounded-full border-4 border-blue-50 shadow-md mb-3 object-cover" />
            <span className="text-xs text-slate-500">Visualização do Avatar</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={14} /> URL da Foto
            </label>
            <input 
              type="text" 
              value={avatar} 
              onChange={e => setAvatar(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-2">
              <Key size={14} /> Nova Senha
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Deixe em branco para não alterar"
            />
          </div>

          {password && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                required
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- AI CHATBOT COMPONENT --- */

export const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Olá! Sou a IA do ImobFlow. Posso ajudar com dúvidas financeiras ou sobre cobranças. Como posso ser útil?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const reply = await chatWithBot(userMsg);
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col h-96">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="font-bold text-sm">Assistente Financeiro</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-blue-100"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400 italic ml-2">Digitando...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              className="flex-1 text-xs bg-slate-100 rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Pergunte sobre dívidas..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={loading} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

/* --- FINANCIAL MODULE --- */

interface FinancialModuleProps {
  debts: Debt[];
  onSettleDebt: (debtId: string, settlement: Debt['settlement']) => void;
}

export const FinancialModule: React.FC<FinancialModuleProps> = ({ debts, onSettleDebt }) => {
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setStartDateEnd] = useState<string>('2024-12-31');
  const [settlementModal, setSettlementModal] = useState<Debt | null>(null);
  const [settlementData, setSettlementData] = useState({ value: 0, date: new Date().toISOString().split('T')[0], method: 'Pix' });

  const filteredDebts = debts.filter(debt => {
    const dateToCompare = debt.status === 'Paid' ? debt.settlement?.date : debt.dueDate;
    if (!dateToCompare) return false;
    return dateToCompare >= startDate && dateToCompare <= endDate;
  });

  const totals = filteredDebts.reduce((acc, debt) => {
    if (debt.status === 'Paid') {
      const val = debt.settlement?.value || 0;
      acc.received += val;
      if (debt.isLegalRecovery) acc.legal += val;
    } else {
      acc.pending += debt.amount;
    }
    return acc;
  }, { pending: 0, received: 0, legal: 0 });

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settlementModal) {
      onSettleDebt(settlementModal.id, { ...settlementData });
      setSettlementModal(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter size={18} />
          <span className="text-sm font-semibold">Período:</span>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400">até</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setStartDateEnd(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-orange-500 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 font-medium">Crédito a Receber</span>
            <ArrowUpCircle className="text-orange-500" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">R$ {totals.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs text-slate-400 mt-1">Soma de pendentes e atrasados no período</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 font-medium">Crédito Recebido</span>
            <ArrowDownCircle className="text-green-500" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">R$ {totals.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs text-slate-400 mt-1">Total liquidado no período</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-600 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 font-medium">Recuperação Jurídica</span>
            <Landmark className="text-blue-600" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">R$ {totals.legal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs text-slate-400 mt-1">Créditos recuperados via Jurídico</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Lançamentos Financeiros</h3>
          <span className="text-xs text-slate-500">{filteredDebts.length} registros encontrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold">Inquilino / Imóvel</th>
                <th className="px-6 py-4 font-bold">Origem</th>
                <th className="px-6 py-4 font-bold">Valor Orig.</th>
                <th className="px-6 py-4 font-bold">Valor Acerto</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.length > 0 ? filteredDebts.map(debt => (
                <tr key={debt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-600 font-mono">
                    {new Date(debt.status === 'Paid' ? debt.settlement!.date : debt.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{debt.tenantName}</div>
                    <div className="text-[11px] text-slate-400">{debt.propertyAddress}</div>
                  </td>
                  <td className="px-6 py-4">
                    {debt.isLegalRecovery ? (
                      <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <Gavel size={12} /> Jurídico
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Landmark size={12} /> ImobFlow
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    R$ {debt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {debt.status === 'Paid' 
                      ? `R$ ${debt.settlement?.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={
                      debt.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      debt.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }>
                      {debt.status === 'Paid' ? 'Recebido' : debt.status === 'Overdue' ? 'Atrasado' : 'Aguardando'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {debt.status !== 'Paid' ? (
                      <button 
                        onClick={() => { setSettlementModal(debt); setSettlementData({ ...settlementData, value: debt.amount }); }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs underline underline-offset-2"
                      >
                        Dar Baixa
                      </button>
                    ) : (
                      <button className="text-slate-400 hover:text-slate-600">
                        <FileText size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhuma movimentação encontrada para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {settlementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Baixar Cobrança</h3>
              <button onClick={() => setSettlementModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-800 font-medium">Inquilino: {settlementModal.tenantName}</p>
              <p className="text-xs text-blue-600">Dívida Original: R$ {settlementModal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Valor do Acerto Final</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={settlementData.value}
                    onChange={(e) => setSettlementData({...settlementData, value: parseFloat(e.target.value)})}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Data do Pagamento</label>
                  <input 
                    type="date" 
                    value={settlementData.date}
                    onChange={(e) => setSettlementData({...settlementData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Forma de Pagto</label>
                  <select 
                    value={settlementData.method}
                    onChange={(e) => setSettlementData({...settlementData, method: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Depósito">Depósito</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setSettlementModal(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- ADMIN MODULE --- */

interface AdminModuleProps {
  tasks: Task[];
  onUpdateStatus: (id: string, s: TaskStatus) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({ tasks, onUpdateStatus, onAddTask }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const columns = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.WAITING_DOCS, TaskStatus.DONE];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Quadro de Demandas</h2>
          <p className="text-xs text-slate-500">Gestão visual de fluxos administrativos e operacionais</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus size={18} /> Nova Demanda
        </button>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 min-w-[1000px]">
          {columns.map(status => (
            <div key={status} className="flex-1 min-w-[280px] bg-slate-100/50 rounded-xl p-3 border border-slate-200/60">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest">{status}</h3>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === status).map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">{task.sector}</span>
                      <Badge color={
                        task.priority === Priority.CRITICAL ? 'bg-red-100 text-red-700' :
                        task.priority === Priority.HIGH ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                      }>
                        {task.priority}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{task.title}</h4>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                    
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.attachments.map((at, i) => (
                          <div key={i} className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-500">
                            <Paperclip size={8} /> {at.name.slice(0, 10)}...
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={12} className="text-slate-300" /> {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        {task.attachments && task.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                            <Paperclip size={12} /> {task.attachments.length}
                          </span>
                        )}
                      </div>
                      {status !== TaskStatus.DONE ? (
                        <button 
                          onClick={() => onUpdateStatus(task.id, TaskStatus.DONE)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Concluir
                        </button>
                      ) : (
                        <CheckSquare size={14} className="text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === status).length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Sem itens</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <AddTaskModal 
          onClose={() => setModalOpen(false)} 
          onAdd={onAddTask} 
        />
      )}
    </div>
  );
};

/* --- COLLECTIONS MODULE --- */

export const CollectionsModule: React.FC<{ debts: Debt[] }> = ({ debts }) => {
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerateMessage = async (debt: Debt) => {
    setLoading(true);
    const msg = await generateCollectionMessage(debt.tenantName, debt.amount, 15);
    setAiMessage(msg);
    setLoading(false);
  };

  const handleSpeak = async () => {
    if(!aiMessage) return;
    const audioData = await generateSpeech(aiMessage);
    if(audioData) await playRawAudio(audioData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Cobranças em Aberto</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Imóvel/Inquilino</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {debts.filter(d => d.status !== 'Paid').map(debt => (
              <tr key={debt.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedDebt(debt)}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{debt.tenantName}</div>
                  <div className="text-xs text-slate-500">{debt.propertyAddress}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{new Date(debt.dueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-slate-800">R$ {debt.amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    debt.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {debt.status === 'Overdue' ? 'Atrasado' : 'Pendente'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-slate-200 rounded text-slate-500">
                    <MessageSquare size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[500px]">
        {selectedDebt ? (
          <>
            <h3 className="font-semibold text-slate-800 mb-4 border-b pb-2">Assistente de Cobrança</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
               <div className="space-y-4">
                 {selectedDebt.history.map((h, i) => (
                   <div key={i} className="flex gap-3">
                     <div className="flex flex-col items-center">
                       <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                       {i < selectedDebt.history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>}
                     </div>
                     <div>
                       <p className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString()}</p>
                       <p className="text-sm text-slate-700">{h.event}</p>
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="mt-6 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600" /> IA Gemini
                  </h4>
                  {!aiMessage ? (
                    <button 
                      onClick={() => handleGenerateMessage(selectedDebt)}
                      disabled={loading}
                      className="mt-3 w-full bg-purple-50 text-purple-700 text-sm py-2 px-3 rounded hover:bg-purple-100 transition-colors flex justify-center items-center gap-2"
                    >
                      {loading ? 'Gerando...' : 'Gerar Mensagem WhatsApp'}
                    </button>
                  ) : (
                    <div className="mt-3 bg-slate-50 p-3 rounded text-sm text-slate-600 italic border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <span>"{aiMessage}"</span>
                        <button onClick={handleSpeak} className="text-purple-600 hover:bg-purple-100 p-1 rounded"><Volume2 size={16} /></button>
                      </div>
                      <button 
                        onClick={() => {navigator.clipboard.writeText(aiMessage); alert('Copiado!');}}
                        className="block mt-2 text-xs text-purple-600 font-medium hover:underline"
                      >
                        Copiar texto
                      </button>
                    </div>
                  )}
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
            <Landmark size={48} className="mb-2 opacity-50 text-slate-300" />
            <p className="text-sm">Selecione uma cobrança para interagir com a IA</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- LEGAL MODULE --- */

interface FinalizeModalProps {
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
}

const FinalizeLegalModal: React.FC<FinalizeModalProps> = ({ onClose, onConfirm }) => {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>('Pix');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-scale-up">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-500" /> Finalizar Acordo
        </h3>
        <p className="text-xs text-slate-500 mb-4">Informe o valor total recuperado e a forma de pagamento para gerar o lançamento financeiro.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Valor Final (R$)</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Forma de Recebimento</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              <option value="Pix">Pix</option>
              <option value="Boleto">Boleto Bancário</option>
              <option value="Transferência">Transferência / TED</option>
              <option value="Espécie">Em Espécie</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-slate-600 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={() => onConfirm(amount, method)} className="flex-1 py-2 text-sm text-white font-bold bg-green-600 rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all">Confirmar e Baixar</button>
        </div>
      </div>
    </div>
  );
};

export const LegalModule: React.FC<{ 
  cases: LegalCase[], 
  tasks: Task[],
  currentUser: User,
  onUpdateCase: (updatedCase: LegalCase) => void,
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void,
  onDeleteTask: (id: string) => void,
  onUpdateTaskStatus: (id: string, s: TaskStatus) => void,
  onFinalizeTask: (id: string, amount: number, method: string) => void
}> = ({ cases, tasks, currentUser, onUpdateCase, onAddTask, onDeleteTask, onUpdateTaskStatus, onFinalizeTask }) => {
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [summary, setSummary] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isNewTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [finalizeTaskData, setFinalizeTaskData] = useState<{id: string} | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleSummarize = async (c: LegalCase) => {
    setLoadingAI(true);
    const result = await generateLegalSummary(`Processo: ${c.processNumber}, Tipo: ${c.title}, Status: ${c.status}, Descrição: ${c.description}`);
    setSummary(result);
    setLoadingAI(false);
  };

  const handleAnalyzeRisk = async () => {
    if(!selectedCase) return;
    setLoadingAI(true);
    const result = await analyzeDocumentRisk(selectedCase.description);
    setRiskAnalysis(result);
    setLoadingAI(false);
  };

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
           const blob = new Blob(chunks, { type: 'audio/webm' });
           const reader = new FileReader();
           reader.readAsDataURL(blob);
           reader.onloadend = async () => {
             const base64String = (reader.result as string).split(',')[1];
             setNewNote("Transcrevendo...");
             const text = await transcribeAudio(base64String, 'audio/webm');
             setNewNote(text);
           };
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        alert("Erro microfone");
      }
    }
  };

  const handleAddNote = () => {
    if(!newNote.trim() || !selectedCase) return;
    const note = { author: currentUser.name, role: currentUser.role, text: newNote, timestamp: new Date().toISOString() };
    const updated = { ...selectedCase, sharedNotes: [...(selectedCase.sharedNotes || []), note] };
    onUpdateCase(updated);
    setSelectedCase(updated);
    setNewNote('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header com botões de ação */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Operações Jurídicas</h2>
          <p className="text-xs text-slate-500">Gestão de processos judiciais e demandas de cobrança jurídica</p>
        </div>
        <button 
          onClick={() => setNewTaskModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Nova Demanda Jurídica
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Demandas e Tarefas */}
        <div className="xl:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><LayoutList size={18} className="text-indigo-600"/> Demandas em Fluxo</h3>
             <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status !== TaskStatus.DONE).length} Ativas</span>
          </div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {tasks.filter(t => t.status !== TaskStatus.DONE).map(task => (
              <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group relative">
                <button 
                  onClick={() => window.confirm("Excluir esta demanda jurídica?") && onDeleteTask(task.id)}
                  className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex justify-between items-start mb-2 pr-6">
                  <Badge color={task.priority === Priority.CRITICAL ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}>
                    {task.priority}
                  </Badge>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">{task.status}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{task.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                      <Paperclip size={12} /> {task.attachments.length} docs
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={12} className="text-slate-300" /> {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 border-t border-slate-50 pt-3">
                  <button 
                    onClick={() => onUpdateTaskStatus(task.id, TaskStatus.IN_PROGRESS)}
                    className="flex-1 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded border border-slate-100 transition-colors uppercase"
                  >
                    Em Andamento
                  </button>
                  <button 
                    onClick={() => setFinalizeTaskData({ id: task.id })}
                    className="flex-1 py-1 text-[10px] font-bold text-green-600 hover:bg-green-50 rounded border border-green-100 transition-colors uppercase flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={10} /> Finalizar
                  </button>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status !== TaskStatus.DONE).length === 0 && (
              <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                 <p className="text-xs text-slate-400">Nenhuma demanda ativa no setor jurídico.</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Processos Judiciais */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Gavel size={18} className="text-blue-600"/> Processos em Andamento</h3>
             <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{cases.length} Casos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-mono font-bold tracking-tighter">{c.processNumber}</span>
                  <Badge color="bg-orange-100 text-orange-700" children={c.status} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{c.title}</h3>
                <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">{c.description}</p>
                <div className="flex gap-2">
                   <button onClick={() => { setSelectedCase(c); setSummary(''); setRiskAnalysis(''); }} className="flex-1 bg-slate-50 text-slate-600 font-bold text-[10px] uppercase py-2 rounded border border-slate-200 hover:bg-slate-100 transition-colors">Detalhes</button>
                   <button onClick={() => { setSelectedCase(c); handleSummarize(c); }} className="flex-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase py-2 rounded border border-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"><BrainCircuit size={14} /> IA Resumo</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Caso (Existente) */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row h-[600px] overflow-hidden">
             <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r bg-slate-50 custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-800">Detalhes do Processo</h3>
                  <button onClick={() => setSelectedCase(null)} className="md:hidden transition-colors hover:text-red-500">✕</button>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-4">
                  <p className="text-xs text-slate-400 uppercase font-bold">Resumo do Caso</p>
                  <p className="text-sm text-slate-800 mt-2 leading-relaxed">{selectedCase.description}</p>
                </div>
                {summary && <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2 animate-fade-in"><h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-1">Resumo IA Gemini</h4><p className="text-xs text-indigo-900 leading-relaxed italic">"{summary}"</p></div>}
                {riskAnalysis && <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2 animate-fade-in"><h4 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">Análise de Risco Jurídico</h4><p className="text-xs text-red-900 leading-relaxed italic">"{riskAnalysis}"</p></div>}
                <button onClick={handleAnalyzeRisk} className="w-full mt-4 py-2 border border-red-200 text-red-600 rounded text-xs font-bold hover:bg-red-50 transition-colors uppercase tracking-widest">Analisar Riscos (Gemini Pro)</button>
             </div>
             <div className="w-full md:w-1/2 flex flex-col bg-white">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800 text-sm">Histórico e Notas Compartilhadas</h3><button onClick={() => setSelectedCase(null)} className="hidden md:block transition-colors hover:text-red-500">✕</button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white custom-scrollbar">
                  {(selectedCase.sharedNotes || []).map((n, i) => (
                    <div key={i} className={`flex flex-col ${n.role === currentUser.role ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-xl text-xs shadow-sm max-w-[85%] ${n.role === currentUser.role ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'}`}>{n.text}</div>
                      <span className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{n.author} • {n.role}</span>
                    </div>
                  ))}
                  {(selectedCase.sharedNotes || []).length === 0 && <p className="text-xs text-slate-400 italic text-center py-20">Nenhuma nota registrada neste processo.</p>}
                </div>
                <div className="p-4 border-t flex gap-2 bg-slate-50">
                  <button onClick={handleRecord} className={`p-2.5 rounded-xl transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}><Mic size={18} /></button>
                  <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} className="flex-1 bg-white border border-slate-200 px-4 py-1 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Escreva uma nota ou transcreva áudio..." />
                  <button onClick={handleAddNote} className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"><Send size={18} /></button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Modais de Gerenciamento de Tarefas */}
      {isNewTaskModalOpen && (
        <AddTaskModal 
          onClose={() => setNewTaskModalOpen(false)} 
          onAdd={onAddTask} 
          defaultSector={Sector.JURIDICO}
        />
      )}

      {finalizeTaskData && (
        <FinalizeLegalModal 
          onClose={() => setFinalizeTaskData(null)}
          onConfirm={(amount, method) => {
            onFinalizeTask(finalizeTaskData.id, amount, method);
            setFinalizeTaskData(null);
            alert("Demanda finalizada! Lançamento enviado para o financeiro.");
          }}
        />
      )}
    </div>
  );
};

/* --- USERS MODULE (Inalterado, apenas mantido conforme estrutura) --- */
export const UsersModule: React.FC<{ users: User[], currentUser: User, onAddUser: (name: string, role: Sector) => void, onDeleteUser: (id: string) => void }> = ({ users, currentUser, onAddUser, onDeleteUser }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Sector>(Sector.ADMIN);

  const handleDeleteClick = (userToDelete: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userToDelete.id === currentUser.id) {
      alert("Você não pode excluir a si mesmo!");
      return;
    }
    if (userToDelete.isMaster) {
      alert("Operação negada: não é possível excluir usuários Master.");
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userToDelete.name}"?`)) {
      onDeleteUser(userToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-blue-600" /> Cadastrar Novo Usuário
        </h3>
        <div className="flex flex-wrap gap-4">
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Nome Completo" 
            className="flex-1 min-w-[200px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
          />
          <select 
            value={role} 
            onChange={e => setRole(e.target.value as Sector)} 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            onClick={() => { onAddUser(name, role); setName(''); }} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm shadow-md"
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all">
            {currentUser.isMaster && (
              <button 
                type="button"
                onClick={(e) => handleDeleteClick(u, e)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 transition-colors z-10"
                title="Excluir Usuário"
              >
                <Trash2 size={16} />
              </button>
            )}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img src={u.avatar} className="w-16 h-16 rounded-full border-2 border-slate-100 shadow-inner mb-3 object-cover" alt={u.name} />
                {u.isMaster && <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white" title="Master Account"><ShieldCheck size={10} /></div>}
              </div>
              <strong className="text-slate-800 font-bold text-center block leading-tight">{u.name}</strong>
              <span className="text-xs text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded font-medium uppercase tracking-tight">{u.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
