/* Standardized short LaTeX previews for Library summaries. */
const symbols = {
  "∂ / ∂t": "\\frac{\\partial}{\\partial t}",
  "ρ": "\\rho",
  "ρv": "\\rho\\boldsymbol{v}",
  "∇": "\\nabla",
  "∇·": "\\nabla\\cdot",
  "∇×": "\\nabla\\times",
  "d / dt": "\\frac{\\mathrm{d}}{\\mathrm{d}t}",
  "E": "E",
  "κ": "\\kappa",
  "e": "e",
  "s": "s",
  "Cₗ ≈ 2πα": "C_l\\simeq 2\\pi\\alpha",
  "V = V∞ + V′": "\\boldsymbol{V}=\\boldsymbol{V}_{\\infty}+\\boldsymbol{V}'",
  "Re": "\\mathrm{Re}",
  "Ma": "\\mathrm{Ma}",
  "Eu": "\\mathrm{Eu}",
  "C_f": "C_f",
  "Pr": "\\mathrm{Pr}",
  "Pe": "\\mathrm{Pe}",
  "Nu": "\\mathrm{Nu}",
  "Gr": "\\mathrm{Gr}",
  "St": "\\mathrm{St}",
  "Fr": "\\mathrm{Fr}",
  "We": "\\mathrm{We}",
  "Bi": "\\mathrm{Bi}",
  "Fo": "\\mathrm{Fo}"
};
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const mathSymbol = value => {
  const tex=symbols[value];
  if(!tex) return escape(value);
  return '<span class="math-inline" data-tex="'+escape(tex)+'">'+escape(value)+'</span>';
};
export const mathSymbols = symbols;
