export const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  REAGENDADO: 'Reagendado',
};

export const STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_CONFIRMACAO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMADO: 'bg-green-100 text-green-800 border-green-300',
  CANCELADO: 'bg-red-100 text-red-800 border-red-300',
  REAGENDADO: 'bg-blue-100 text-blue-800 border-blue-300',
};

export const STATUS_DOT: Record<string, string> = {
  AGUARDANDO_CONFIRMACAO: 'bg-yellow-500',
  CONFIRMADO: 'bg-green-500',
  CANCELADO: 'bg-red-500',
  REAGENDADO: 'bg-blue-500',
};
