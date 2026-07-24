import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function LabsManager({ supabase }: { supabase: any }) {
    const [labs, setLabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLab, setEditingLab] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState<any>({});

    const fetchLabs = async () => {
        setLoading(true);
        const { data } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
        setLabs(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchLabs();
    }, []);

    const handleEdit = (lab: any) => {
        setFormData({ ...lab, tags: lab.tags?.join(', ') || '' });
        setEditingLab(lab);
        setIsCreating(false);
    };

    const handleCreate = () => {
        setFormData({
            title: '', description: '', category: 'web', difficulty: 'easy', 
            points: 100, estimated_time: 30, status: 'draft', 
            scenario: '', learning_objectives: '', tags: '', docker_image: ''
        });
        setEditingLab(null);
        setIsCreating(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
            points: parseInt(formData.points),
            estimated_time: parseInt(formData.estimated_time)
        };

        if (isCreating) {
            await supabase.from('challenges').insert(payload);
        } else {
            await supabase.from('challenges').update(payload).eq('id', editingLab.id);
        }
        
        setIsCreating(false);
        setEditingLab(null);
        fetchLabs();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lab?')) return;
        await supabase.from('challenges').delete().eq('id', id);
        fetchLabs();
    };

    if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-cyan-400" /></div>;

    if (isCreating || editingLab) {
        return (
            <div className="glass-panel border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">{isCreating ? 'Create New Lab' : 'Edit Lab'}</h2>
                <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Title</label>
                            <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Category</label>
                            <input required type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Difficulty</label>
                            <select value={formData.difficulty || 'easy'} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                                <option value="insane">Insane</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Status</label>
                            <select value={formData.status || 'draft'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white">
                                <option value="draft">Draft</option>
                                <option value="active">Active (Published)</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Points</label>
                            <input required type="number" value={formData.points || 100} onChange={e => setFormData({...formData, points: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Est. Time (mins)</label>
                            <input required type="number" value={formData.estimated_time || 30} onChange={e => setFormData({...formData, estimated_time: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-500 mb-1 uppercase tracking-widest">Description</label>
                        <textarea required rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white"></textarea>
                    </div>

                    <div>
                        <label className="block text-gray-500 mb-1 uppercase tracking-widest">Realistic Scenario</label>
                        <textarea rows={2} value={formData.scenario || ''} onChange={e => setFormData({...formData, scenario: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white"></textarea>
                    </div>

                    <div>
                        <label className="block text-gray-500 mb-1 uppercase tracking-widest">Learning Objectives</label>
                        <textarea rows={2} value={formData.learning_objectives || ''} onChange={e => setFormData({...formData, learning_objectives: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Tags (comma separated)</label>
                            <input type="text" value={formData.tags || ''} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white" placeholder="web, sqli, bypass" />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1 uppercase tracking-widest">Docker Image Tag</label>
                            <input type="text" value={formData.docker_image || ''} onChange={e => setFormData({...formData, docker_image: e.target.value})} className="w-full bg-[#0d1221] border border-gray-800 rounded p-2 text-white" placeholder="nerdsctf/web-sqli-01" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => { setIsCreating(false); setEditingLab(null); }} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded text-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 cyber-btn-cyan rounded text-white font-bold">Save Lab Data</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="glass-panel border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Labs Database</h2>
                <button onClick={handleCreate} className="cyber-btn-cyan px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Lab
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                        <tr className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase tracking-widest font-bold">
                            <th className="p-4">Title</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Difficulty</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850 text-gray-300">
                        {labs.map((lab) => (
                            <tr key={lab.id} className="hover:bg-cyan-950/5">
                                <td className="p-4 font-bold text-white">{lab.title}</td>
                                <td className="p-4 uppercase">{lab.category}</td>
                                <td className="p-4 uppercase">{lab.difficulty}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                        lab.status === 'active' ? 'text-emerald-400 border-emerald-900 bg-emerald-950/20' :
                                        lab.status === 'draft' ? 'text-yellow-400 border-yellow-900 bg-yellow-950/20' :
                                        'text-gray-500 border-gray-900 bg-gray-950'
                                    }`}>
                                        {lab.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right pr-6 flex justify-end gap-2.5">
                                    <button onClick={() => handleEdit(lab)} className="border border-cyan-800/40 bg-cyan-950/10 hover:bg-cyan-950/30 text-cyan-400 px-2 py-1 rounded text-[10px] uppercase font-bold flex items-center gap-1">
                                        <Edit className="h-3 w-3" /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(lab.id)} className="border border-red-900/40 bg-red-950/10 hover:bg-red-950/30 text-red-400 px-2 py-1 rounded text-[10px] uppercase font-bold flex items-center gap-1">
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
