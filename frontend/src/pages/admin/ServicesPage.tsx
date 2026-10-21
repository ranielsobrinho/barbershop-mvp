import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, Service } from '../../services/adminApi';
import { formatMoney } from '../../utils/money';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { Modal } from '../../components/ui/Modal';

export function ServicesPage() {
  const qc = useQueryClient();
  const { data: services = [], isLoading, error } = useQuery({ queryKey: ['services'], queryFn: adminApi.listServices });
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [slotMin, setSlotMin] = useState('30');
  const [active, setActive] = useState(true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        priceCents: Math.round(parseFloat(price.replace(',', '.')) * 100),
        slotMin: parseInt(slotMin, 10),
        active,
      };
      if (editing) return adminApi.updateService(editing.id, payload);
      return adminApi.createService(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); closeForm(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Erro ao salvar'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminApi.updateService(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteService(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setDeleteTarget(null); },
    onError: (err: any) => { setFormError(err.response?.data?.message || 'Erro ao excluir'); setDeleteTarget(null); },
  });

  const openCreate = () => {
    setEditing(null); setCreating(true); setName(''); setDescription(''); setPrice(''); setSlotMin('30'); setActive(true); setFormError(null);
  };
  const openEdit = (s: Service) => {
    setEditing(s); setCreating(true); setName(s.name); setDescription(s.description || '');
    setPrice((s.priceCents / 100).toFixed(2).replace('.', ',')); setSlotMin(String(s.slotMin)); setActive(s.active); setFormError(null);
  };
  const closeForm = () => { setCreating(false); setEditing(null); setFormError(null); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFormError('Nome é obrigatório'); return; }
    if (!price || isNaN(parseFloat(price.replace(',', '.')))) { setFormError('Preço inválido'); return; }
    if (!slotMin || parseInt(slotMin) <= 0) { setFormError('Duração inválida'); return; }
    saveMutation.mutate();
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-sm text-gray-500">{services.length} serviço(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-2.5 px-5 text-sm">+ Novo serviço</button>
      </div>

      <ErrorAlert message={error ? 'Erro ao carregar serviços' : null} />

      <div className="space-y-3">
        {services.map((s) => (
          <div key={s.id} className={`card flex flex-col sm:flex-row sm:items-center gap-3 ${!s.active ? 'opacity-60' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                {!s.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativo</span>}
              </div>
              {s.description && <p className="text-sm text-gray-500 truncate">{s.description}</p>}
              <p className="text-sm text-gray-400">{s.slotMin} min · {formatMoney(s.priceCents)}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => toggleMutation.mutate({ id: s.id, active: !s.active })}
                className="btn-secondary py-2 px-3 text-xs" disabled={toggleMutation.isPending}>
                {s.active ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => openEdit(s)} className="btn-secondary py-2 px-3 text-xs">Editar</button>
              <button onClick={() => setDeleteTarget(s)} className="btn-secondary py-2 px-3 text-xs text-red-600 hover:bg-red-50">Excluir</button>
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="text-gray-500 text-center py-8">Nenhum serviço cadastrado ainda.</p>}
      </div>

      {/* Modal criar/editar */}
      <Modal open={creating} onClose={closeForm} title={editing ? 'Editar serviço' : 'Novo serviço'}>
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorAlert message={formError} />
          <div>
            <label htmlFor="svc-name" className="label">Nome *</label>
            <input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Corte + Barba" maxLength={100} />
          </div>
          <div>
            <label htmlFor="svc-desc" className="label">Descrição</label>
            <input id="svc-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Descrição curta (opcional)" maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="svc-price" className="label">Preço (R$) *</label>
              <input id="svc-price" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="45,00" inputMode="decimal" />
            </div>
            <div>
              <label htmlFor="svc-slot" className="label">Duração (min) *</label>
              <input id="svc-slot" type="number" value={slotMin} onChange={(e) => setSlotMin(e.target.value)} className="input-field" min={5} step={5} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded" />
            Ativo (aparece no site)
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal excluir */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir serviço">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Essa ação não pode ser desfeita.
        </p>
        <ErrorAlert message={formError} />
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50">
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
