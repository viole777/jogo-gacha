/**
 * Utilitário de formatação de números exorbitantes
 * Converte números grandes em abreviações legíveis
 *
 * Exemplos:
 * 1500 → 1.5k
 * 2300000 → 2.3m
 * 4700000000 → 4.7b
 * 8900000000000 → 8.9t
 * 1200000000000000 → 1.2qd
 * 3400000000000000000 → 3.4sx
 */

const SUFFIXES = [
  { value: 1e18, suffix: 'sx' },   // Sextilhão
  { value: 1e15, suffix: 'qd' },   // Quadrilhão
  { value: 1e12, suffix: 't' },    // Trilhão
  { value: 1e9, suffix: 'b' },     // Bilhão
  { value: 1e6, suffix: 'm' },     // Milhão
  { value: 1e3, suffix: 'k' },     // Mil
];

/**
 * Formata um número para abreviação
 * @param {number} num - Número a ser formatado
 * @returns {string} Número formatado (ex: "1.5k", "2.3m")
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  // Números negativos
  const sign = num < 0 ? '-' : '';
  num = Math.abs(num);

  // Números menores que 1000
  if (num < 1000) {
    return sign + Math.floor(num).toString();
  }

  for (const { value, suffix } of SUFFIXES) {
    if (num >= value) {
      const formatted = (num / value).toFixed(1);
      // Remove o .0 desnecessário (ex: 2.0k → 2k)
      const clean = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
      return sign + clean + suffix;
    }
  }

  return sign + Math.floor(num).toString();
}

/**
 * Formata um número com separadores de milhar
 * @param {number} num - Número a ser formatado
 * @returns {string} Número formatado (ex: "1.500.000")
 */
function formatFull(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('pt-BR');
}

module.exports = { formatNumber, formatFull };