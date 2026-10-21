# TODO - Próximos Passos (Tela do Cliente)

## 1. Background da Home
- [ ] Usar a imagem salva nas configurações (`settings.backgroundImage`)
- [ ] Ocupar 100% da tela: `width: 100vw; height: 100vh; object-fit: cover`
- [ ] Fallback se não houver imagem configurada

## 2. Lista de Serviços como Cards
- [ ] Mudar layout de coluna única → **grid responsivo de cards**
- [ ] Cada card: nome, preço, duração, **foto opcional**
- [ ] Admin: adicionar campo `imageUrl` no model `Service` + upload no cadastro/edição
- [ ] Prisma: migration para adicionar `imageUrl` (nullable)

## 3. Calendário de Agendamento - Correção de Dia da Semana
- [ ] Bug: dia 1 (quinta) aparece como domingo → horários errados
- [ ] Causa provável: `Date`/`getDay()` sem fuso fixo `America/Fortaleza`
- [ ] Corrigir no **frontend** (date-fns-tz / TZDate com `America/Fortaleza`)
- [ ] Verificar se backend/gateway também precisa de ajuste (já usa fuso fixo no seed)

---

> **Nota**: Este arquivo é local (não commitado). Use como checklist pessoal.