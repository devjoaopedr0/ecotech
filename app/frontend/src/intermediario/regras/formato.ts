/** Número com uma casa decimal e vírgula (pt-BR); inteiros saem sem casa decimal. */
export const formatarNumero = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
