import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const ENTRY_TYPES = {
    LOGIN: 'Login',
    API_KEY: 'Chave_Api',
    CONN_STRING: 'Connection String',
    NOTE: 'Anotação'
};

const VISIBILITY = {
    PUBLIC: 'public',
    PERSONAL: 'personal'
};

const FILTERS = {
    ALL: 'all',
    MINE: 'mine',
    PUBLIC: 'public',
    SHARED: 'shared'
};

const api = {
    token: localStorage.getItem('passvault_token'),

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('passvault_token', token);
        else localStorage.removeItem('passvault_token');
    },

    async request(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this.token) headers.Authorization = `Bearer ${this.token}`;

        const res = await fetch(`/api${path}`, { ...options, headers });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.error || 'Erro na requisição.');
        return data;
    },

    register(body) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(body) }); },
    login(body) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(body) }); },
    me() { return this.request('/auth/me'); },
    getEntries(filter) { return this.request(`/entries?filter=${filter || 'all'}`); },
    createEntry(body) { return this.request('/entries', { method: 'POST', body: JSON.stringify(body) }); },
    deleteEntry(id) { return this.request(`/entries/${id}`, { method: 'DELETE' }); },
    getPermissions(id) { return this.request(`/entries/${id}/permissions`); },
    grantPermission(id, username) { return this.request(`/entries/${id}/permissions`, { method: 'POST', body: JSON.stringify({ username }) }); },
    revokePermission(id, userId) { return this.request(`/entries/${id}/permissions/${userId}`, { method: 'DELETE' }); },
    searchUsers(q) { return this.request(`/users/search?q=${encodeURIComponent(q)}`); },
};

const Icon = ({ name, size = 18, className = "" }) => {
    useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [name]);
    return <i data-lucide={name} style={{ width: size, height: size }} className={className}></i>;
};

const AuthScreen = ({ onAuth }) => {
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '', login: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            let data;
            if (mode === 'login') {
                data = await api.login({ login: form.login, password: form.password });
            } else {
                data = await api.register({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    displayName: form.displayName
                });
            }
            api.setToken(data.token);
            onAuth(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                        <Icon name="shield" size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">PassVault Pro</h1>
                    <p className="text-slate-500 text-sm">
                        {mode === 'login' ? 'Entre na sua conta para aceder ao cofre.' : 'Crie uma conta para começar.'}
                    </p>
                </div>

                <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button type="button" onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'}`}>
                        Entrar
                    </button>
                    <button type="button" onClick={() => { setMode('register'); setError(''); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'}`}>
                        Registar
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'login' ? (
                        <>
                            <input required type="text" placeholder="Utilizador ou e-mail"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} />
                            <input required type="password" placeholder="Senha"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        </>
                    ) : (
                        <>
                            <input required type="text" placeholder="Nome de utilizador"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                            <input required type="email" placeholder="E-mail"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            <input type="text" placeholder="Nome a exibir (opcional)"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
                            <input required type="password" placeholder="Senha (mín. 6 caracteres)"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        </>
                    )}
                    <button type="submit" disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">
                        {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const PermissionsModal = ({ entry, onClose, showNotification }) => {
    const [permissions, setPermissions] = useState([]);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            setPermissions(await api.getPermissions(entry.id));
        } catch (err) {
            showNotification(err.message);
        } finally {
            setLoading(false);
        }
    }, [entry.id, showNotification]);

    useEffect(() => { load(); }, [load]);

    const handleGrant = async (e) => {
        e.preventDefault();
        try {
            const granted = await api.grantPermission(entry.id, username);
            setPermissions(prev => [...prev.filter(p => p.userId !== granted.userId), {
                userId: granted.userId,
                username: granted.username,
                displayName: granted.displayName,
                email: granted.email
            }]);
            setUsername('');
            showNotification(`Permissão concedida a ${granted.username}`);
        } catch (err) {
            showNotification(err.message);
        }
    };

    const handleRevoke = async (userId, uname) => {
        try {
            await api.revokePermission(entry.id, userId);
            setPermissions(prev => prev.filter(p => p.userId !== userId));
            showNotification(`Permissão revogada de ${uname}`);
        } catch (err) {
            showNotification(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Gerir Permissões</h3>
                        <p className="text-xs text-slate-500">{entry.service || entry.title}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <form onSubmit={handleGrant} className="flex gap-2">
                        <input required placeholder="Nome de utilizador"
                            className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={username} onChange={e => setUsername(e.target.value)} />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">
                            Conceder
                        </button>
                    </form>

                    {loading ? (
                        <p className="text-sm text-slate-400 text-center py-4">A carregar...</p>
                    ) : permissions.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhum utilizador com acesso extra.</p>
                    ) : (
                        <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {permissions.map(p => (
                                <li key={p.userId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium">{p.displayName || p.username}</p>
                                        <p className="text-xs text-slate-400">@{p.username}</p>
                                    </div>
                                    <button onClick={() => handleRevoke(p.userId, p.username)}
                                        className="text-red-500 hover:text-red-600 p-1" title="Revogar">
                                        <Icon name="user-x" size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState(FILTERS.ALL);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [permissionsEntry, setPermissionsEntry] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formType, setFormType] = useState(ENTRY_TYPES.LOGIN);
    const [formVisibility, setFormVisibility] = useState(VISIBILITY.PERSONAL);
    const [formData, setFormData] = useState({
        service: '', username: '', password: '', key: '', connectionString: '', title: '', content: ''
    });

    const showNotification = useCallback((message) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 2500);
    }, []);

    const loadEntries = useCallback(async (f) => {
        setItemsLoading(true);
        try {
            setItems(await api.getEntries(f));
        } catch (err) {
            showNotification(err.message);
            if (err.message.includes('autenticado') || err.message.includes('Sessão')) {
                api.setToken(null);
                setUser(null);
            }
        } finally {
            setItemsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        if (!api.token) { setAuthLoading(false); return; }
        api.me()
            .then(({ user: u }) => { setUser(u); return loadEntries(FILTERS.ALL); })
            .catch(() => { api.setToken(null); })
            .finally(() => setAuthLoading(false));
    }, [loadEntries]);

    useEffect(() => {
        if (user) loadEntries(filter);
    }, [filter, user, loadEntries]);

    const copy = (text, label) => {
        navigator.clipboard.writeText(text).then(() => showNotification(`${label} copiado!`));
    };

    const handleLogout = () => {
        api.setToken(null);
        setUser(null);
        setItems([]);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const entry = await api.createEntry({
                type: formType,
                visibility: formVisibility,
                service: formData.service,
                username: formData.username,
                password: formData.password,
                key: formData.key,
                connectionString: formData.connectionString,
                title: formData.title,
                content: formData.content
            });
            setItems(prev => [entry, ...prev]);
            setIsModalOpen(false);
            setFormData({ service: '', username: '', password: '', key: '', connectionString: '', title: '', content: '' });
            setFormVisibility(VISIBILITY.PERSONAL);
            showNotification("Registo guardado com sucesso!");
        } catch (err) {
            showNotification(err.message);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm("Tem a certeza que deseja eliminar este registo permanentemente?")) return;
        try {
            await api.deleteEntry(id);
            setItems(prev => prev.filter(i => i.id !== id));
            showNotification("Registo removido.");
        } catch (err) {
            showNotification(err.message);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(i =>
            (i.service || i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.ownerUsername || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-400">A carregar...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen onAuth={(u) => { setUser(u); loadEntries(FILTERS.ALL); }} />;
    }

    const filterTabs = [
        { id: FILTERS.ALL, label: 'Todos', icon: 'layers' },
        { id: FILTERS.MINE, label: 'Meus', icon: 'user' },
        { id: FILTERS.PUBLIC, label: 'Públicos', icon: 'globe' },
        { id: FILTERS.SHARED, label: 'Partilhados', icon: 'users' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                        <Icon name="key-round" size={20} />
                    </div>
                    <div className="hidden sm:block">
                        <span className="font-bold text-lg">PassVault Pro</span>
                        <p className="text-[10px] text-slate-400">@{user.username}</p>
                    </div>
                </div>

                <div className="flex-1 max-w-md mx-6 relative">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Procurar..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleLogout} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Sair">
                        <Icon name="log-out" />
                    </button>
                    <button onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20">
                        <Icon name="plus" size={18} /> <span className="hidden sm:inline">Adicionar</span>
                    </button>
                </div>
            </header>

            <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6">
                <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2">
                    {filterTabs.map(tab => (
                        <button key={tab.id} onClick={() => setFilter(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                filter === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}>
                            <Icon name={tab.icon} size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {itemsLoading ? (
                    <div className="flex justify-center py-32">
                        <p className="text-slate-400">A carregar registos...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                            <Icon name="folder-open" size={32} className="opacity-20" />
                        </div>
                        <h3 className="font-semibold text-slate-600 dark:text-slate-300">Nenhum registo</h3>
                        <p className="text-sm">Crie um novo registo ou altere o filtro.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative group">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.isOwner && item.visibility === VISIBILITY.PERSONAL && (
                                        <button onClick={() => setPermissionsEntry(item)} className="text-slate-300 hover:text-indigo-500 p-1" title="Gerir permissões">
                                            <Icon name="users" size={16} />
                                        </button>
                                    )}
                                    {item.isOwner && (
                                        <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 p-1" title="Eliminar">
                                            <Icon name="trash-2" size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-xl ${
                                        item.type === ENTRY_TYPES.LOGIN ? 'bg-blue-100 text-blue-600' :
                                        item.type === ENTRY_TYPES.API_KEY ? 'bg-amber-100 text-amber-600' :
                                        item.type === ENTRY_TYPES.CONN_STRING ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                                    }`}>
                                        <Icon name={
                                            item.type === ENTRY_TYPES.LOGIN ? 'user' :
                                            item.type === ENTRY_TYPES.API_KEY ? 'code-2' :
                                            item.type === ENTRY_TYPES.CONN_STRING ? 'database' : 'sticky-note'
                                        } />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <h3 className="font-bold leading-tight truncate pr-8">{item.service || item.title}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{item.type}</span>
                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                                item.visibility === VISIBILITY.PUBLIC
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {item.visibility === VISIBILITY.PUBLIC ? 'Público' : 'Pessoal'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!item.isOwner && (
                                    <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
                                        <Icon name="user-circle" size={12} />
                                        <span>{item.ownerDisplayName || item.ownerUsername}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {item.type === ENTRY_TYPES.LOGIN && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <div className="overflow-hidden">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Utilizador</p>
                                                    <p className="text-sm font-medium truncate">{item.username}</p>
                                                </div>
                                                <button onClick={() => copy(item.username, 'Utilizador')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                                                    <Icon name="copy" size={14}/>
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Senha</p>
                                                    <p className="text-sm font-mono tracking-widest">••••••••••••</p>
                                                </div>
                                                <button onClick={() => copy(item.password, 'Senha')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                                                    <Icon name="copy" size={14}/>
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {item.type === ENTRY_TYPES.API_KEY && (
                                        <div className="flex justify-between items-center">
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">API Key</p>
                                                <p className="text-sm font-mono truncate bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded">{item.key?.substring(0, 10)}...</p>
                                            </div>
                                            <button onClick={() => copy(item.key, 'Chave API')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400">
                                                <Icon name="copy" size={14}/>
                                            </button>
                                        </div>
                                    )}

                                    {item.type === ENTRY_TYPES.CONN_STRING && (
                                        <div className="flex justify-between items-center">
                                            <div className="overflow-hidden pr-2">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Connection String</p>
                                                <p className="text-[11px] font-mono leading-relaxed break-all line-clamp-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">{item.connectionString}</p>
                                            </div>
                                            <button onClick={() => copy(item.connectionString, 'String')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 shrink-0">
                                                <Icon name="copy" size={14}/>
                                            </button>
                                        </div>
                                    )}

                                    {item.type === ENTRY_TYPES.NOTE && (
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Conteúdo</p>
                                            <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                                                {item.content}
                                            </div>
                                            <button onClick={() => copy(item.content, 'Anotação')} className="mt-3 w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600">
                                                <Icon name="copy" size={12}/> Copiar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800">
                            <h3 className="font-bold text-lg">Criar Novo Registo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <Icon name="x" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block tracking-widest">Visibilidade</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setFormVisibility(VISIBILITY.PERSONAL)}
                                        className={`py-3 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1 ${
                                            formVisibility === VISIBILITY.PERSONAL
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'
                                        }`}>
                                        <Icon name="lock" size={16} />
                                        Pessoal
                                        <span className="text-[9px] font-normal opacity-70">Só você + permissões</span>
                                    </button>
                                    <button type="button" onClick={() => setFormVisibility(VISIBILITY.PUBLIC)}
                                        className={`py-3 px-3 text-xs font-bold rounded-xl border transition-all flex flex-col items-center gap-1 ${
                                            formVisibility === VISIBILITY.PUBLIC
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'
                                        }`}>
                                        <Icon name="globe" size={16} />
                                        Público
                                        <span className="text-[9px] font-normal opacity-70">Visível a todos</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block tracking-widest">Tipo</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {Object.values(ENTRY_TYPES).map(type => (
                                        <button key={type} type="button" onClick={() => setFormType(type)}
                                            className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all ${
                                                formType === type
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'
                                            }`}>
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formType !== ENTRY_TYPES.NOTE && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Serviço / Site / App</label>
                                    <input required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="ex: Amazon, MySQL, GitHub" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} />
                                </div>
                            )}

                            {formType === ENTRY_TYPES.LOGIN && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Utilizador / E-mail</label>
                                        <input required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Senha</label>
                                        <input required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                    </div>
                                </>
                            )}

                            {formType === ENTRY_TYPES.API_KEY && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Chave API</label>
                                    <textarea required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs" rows="3"
                                        value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})}></textarea>
                                </div>
                            )}

                            {formType === ENTRY_TYPES.CONN_STRING && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">String de Conexão</label>
                                    <textarea required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs" rows="4"
                                        value={formData.connectionString} onChange={e => setFormData({...formData, connectionString: e.target.value})}></textarea>
                                </div>
                            )}

                            {formType === ENTRY_TYPES.NOTE && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Título</label>
                                        <input required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Conteúdo</label>
                                        <textarea required className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" rows="6"
                                            value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {permissionsEntry && (
                <PermissionsModal entry={permissionsEntry} onClose={() => setPermissionsEntry(null)} showNotification={showNotification} />
            )}

            {notification && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white px-8 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700">
                    <Icon name="check-circle" size={16} className="text-emerald-400" />
                    {notification}
                </div>
            )}

            <footer className="p-6 text-center text-slate-400 text-[10px] font-medium tracking-widest uppercase">
                PassVault Pro &copy; 2024 — Cofre Multiutilizador
            </footer>
        </div>
    );
};


const root = createRoot(document.getElementById('root'));
root.render(<App />);
