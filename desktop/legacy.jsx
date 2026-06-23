import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Shield, KeyRound, Search, Lock, Plus, FolderOpen, Trash2, User, Code2,
    Database, StickyNote, Copy, CheckCircle, X, Download
} from 'lucide-react';

const MASTER_VAULT_PASSWORD = 'chave_mestra';
const STORAGE_KEY = 'passvault_pro_data_v2';

const ENTRY_TYPES = {
    LOGIN: 'Login',
    API_KEY: 'Chave_Api',
    CONN_STRING: 'Connection String',
    NOTE: 'Anotação'
};

const Icon = ({ IconCmp, size = 18, className = '' }) => (
    <IconCmp size={size} className={className} strokeWidth={2} />
);

const typeIcon = (type) => {
    if (type === ENTRY_TYPES.LOGIN) return User;
    if (type === ENTRY_TYPES.API_KEY) return Code2;
    if (type === ENTRY_TYPES.CONN_STRING) return Database;
    return StickyNote;
};

const App = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [passwordAttempt, setPasswordAttempt] = useState('');
    const [notification, setNotification] = useState(null);
    const [formType, setFormType] = useState(ENTRY_TYPES.LOGIN);
    const [formData, setFormData] = useState({
        service: '', username: '', password: '', key: '', connectionString: '', title: '', content: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setItems(JSON.parse(saved)); } catch (e) { console.error('Erro ao carregar dados', e); }
        }
    }, []);

    useEffect(() => {
        if (!isLocked) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items, isLocked]);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2500);
    };

    const copy = (text, label) => {
        navigator.clipboard?.writeText(text).catch(() => {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        });
        showNotification(`${label} copiado!`);
    };

    const handleUnlock = (e) => {
        e.preventDefault();
        if (passwordAttempt === MASTER_VAULT_PASSWORD) {
            setIsLocked(false);
            setPasswordAttempt('');
        } else {
            showNotification('Senha mestra incorreta.');
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setItems([{
            ...formData,
            id: Date.now(),
            type: formType,
            date: new Date().toLocaleDateString('pt-PT')
        }, ...items]);
        setIsModalOpen(false);
        setFormData({ service: '', username: '', password: '', key: '', connectionString: '', title: '', content: '' });
        showNotification('Registo guardado com sucesso!');
    };

    const deleteItem = (id) => {
        if (confirm('Tem a certeza que deseja eliminar este registo permanentemente?')) {
            setItems(items.filter(i => i.id !== id));
            showNotification('Registo removido.');
        }
    };

    const exportJson = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            source: 'passvault-desktop',
            items
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `passvault-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification(`${items.length} registos exportados! Use Importar no app web.`);
    };

    const filteredItems = useMemo(() => items.filter(i =>
        (i.service || i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, searchTerm]);

    if (isLocked) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                        <Icon IconCmp={Shield} size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">PassVault Pro</h1>
                    <p className="text-slate-500 text-sm mb-2">Versão Desktop — Cofre Local</p>
                    <p className="text-slate-400 text-xs mb-8">Senha mestra: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">chave_mestra</code></p>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input type="password" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                            placeholder="••••••••••••" value={passwordAttempt} onChange={e => setPasswordAttempt(e.target.value)} autoFocus />
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg">Desbloquear Cofre</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white"><Icon IconCmp={KeyRound} size={20} /></div>
                    <span className="font-bold text-lg hidden sm:block">PassVault Pro (Local)</span>
                </div>
                <div className="flex-1 max-w-md mx-6 relative">
                    <Icon IconCmp={Search} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Procurar..." className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={exportJson} className="px-3 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl flex items-center gap-1.5" title="Exportar para o app web">
                        <Icon IconCmp={Download} size={16} /> <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button onClick={() => setIsLocked(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" title="Bloquear"><Icon IconCmp={Lock} /></button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Icon IconCmp={Plus} size={18} /> <span className="hidden sm:inline">Adicionar</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                            <Icon IconCmp={FolderOpen} size={32} className="opacity-20" />
                        </div>
                        <h3 className="font-semibold text-slate-600 dark:text-slate-300">Cofre Vazio</h3>
                        <p className="text-sm">Não foram encontrados registos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => {
                            const TypeIcon = typeIcon(item.type);
                            return (
                                <div key={item.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative">
                                    <button onClick={() => deleteItem(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1">
                                        <Icon IconCmp={Trash2} size={16} />
                                    </button>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600"><Icon IconCmp={TypeIcon} /></div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-bold truncate pr-6">{item.service || item.title}</h3>
                                            <span className="text-[10px] font-bold uppercase opacity-40">{item.type}</span>
                                        </div>
                                    </div>
                                    {item.type === ENTRY_TYPES.LOGIN && (
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between"><span className="text-slate-400">Utilizador</span><button onClick={() => copy(item.username, 'Utilizador')} className="text-indigo-600 flex items-center gap-1"><Icon IconCmp={Copy} size={12}/> Copiar</button></div>
                                            <p className="font-medium truncate">{item.username}</p>
                                            <div className="flex justify-between"><span className="text-slate-400">Senha</span><button onClick={() => copy(item.password, 'Senha')} className="text-indigo-600 flex items-center gap-1"><Icon IconCmp={Copy} size={12}/> Copiar</button></div>
                                            <p className="font-mono tracking-widest">••••••••••••</p>
                                        </div>
                                    )}
                                    {item.type === ENTRY_TYPES.API_KEY && (
                                        <button onClick={() => copy(item.key, 'Chave API')} className="text-indigo-600 text-sm flex items-center gap-1"><Icon IconCmp={Copy} size={12}/> Copiar chave</button>
                                    )}
                                    {item.type === ENTRY_TYPES.CONN_STRING && (
                                        <button onClick={() => copy(item.connectionString, 'String')} className="text-indigo-600 text-sm flex items-center gap-1"><Icon IconCmp={Copy} size={12}/> Copiar string</button>
                                    )}
                                    {item.type === ENTRY_TYPES.NOTE && (
                                        <button onClick={() => copy(item.content, 'Anotação')} className="text-indigo-600 text-sm flex items-center gap-1"><Icon IconCmp={Copy} size={12}/> Copiar nota</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Criar Novo Registo</h3>
                            <button onClick={() => setIsModalOpen(false)}><Icon IconCmp={X} size={24} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(ENTRY_TYPES).map(type => (
                                    <button key={type} type="button" onClick={() => setFormType(type)}
                                        className={`py-2 text-[10px] font-bold rounded-xl border ${formType === type ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-500'}`}>
                                        {type.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            {formType !== ENTRY_TYPES.NOTE && (
                                <input required placeholder="Serviço / Site / App" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900"
                                    value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })} />
                            )}
                            {formType === ENTRY_TYPES.LOGIN && (
                                <>
                                    <input required placeholder="Utilizador / E-mail" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900"
                                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                    <input required placeholder="Senha" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </>
                            )}
                            {formType === ENTRY_TYPES.API_KEY && (
                                <textarea required rows="3" placeholder="Chave API" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono text-xs"
                                    value={formData.key} onChange={e => setFormData({ ...formData, key: e.target.value })} />
                            )}
                            {formType === ENTRY_TYPES.CONN_STRING && (
                                <textarea required rows="4" placeholder="Connection String" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono text-xs"
                                    value={formData.connectionString} onChange={e => setFormData({ ...formData, connectionString: e.target.value })} />
                            )}
                            {formType === ENTRY_TYPES.NOTE && (
                                <>
                                    <input required placeholder="Título" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    <textarea required rows="6" placeholder="Conteúdo" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-sm"
                                        value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                                </>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-2xl font-bold">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {notification && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white px-8 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <Icon IconCmp={CheckCircle} size={16} className="text-emerald-400" /> {notification}
                </div>
            )}

            <footer className="p-4 text-center text-slate-400 text-[10px] uppercase tracking-widest">
                Desktop Local — Exporte os dados e importe no app web Railway
            </footer>
        </div>
    );
};

createRoot(document.getElementById('root')).render(<App />);
