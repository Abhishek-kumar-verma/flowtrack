import{g as a,j as e,m as p}from"./index-Bv0ptagj.js";import{T as x}from"./trending-up-CEDhmeBT.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=a("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=a("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=a("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]),o={primary:{wrap:"from-primary-500/20 to-primary-600/10 border-primary-500/20",icon:"text-primary-400",value:"text-primary-400"},accent:{wrap:"from-accent-500/20 to-accent-600/10 border-accent-500/20",icon:"text-accent-400",value:"text-accent-400"},emerald:{wrap:"from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",icon:"text-emerald-400",value:"text-emerald-400"},amber:{wrap:"from-amber-500/20 to-amber-600/10 border-amber-500/20",icon:"text-amber-400",value:"text-amber-400"},cyan:{wrap:"from-cyan-500/20 to-cyan-600/10 border-cyan-500/20",icon:"text-cyan-400",value:"text-cyan-400"},rose:{wrap:"from-rose-500/20 to-rose-600/10 border-rose-500/20",icon:"text-rose-400",value:"text-rose-400"}};function j({icon:i,label:c,value:m,trend:t,color:l="primary",suffix:n=""}){const r=o[l]||o.primary,s=t==null?null:t>0?x:t<0?u:y,d=t==null?"":t>0?"text-emerald-400":t<0?"text-red-400":"text-slate-500";return e.jsxs(p.div,{initial:{opacity:0,y:12},animate:{opacity:1,y:0},transition:{type:"spring",damping:20,stiffness:220},className:"stat-card",children:[e.jsx("div",{className:`w-10 h-10 rounded-xl bg-gradient-to-br ${r.wrap} border flex items-center justify-center flex-shrink-0 ${r.icon}`,children:i}),e.jsxs("p",{className:`text-2xl font-bold leading-none mt-1 ${r.value}`,children:[m??"—",n&&e.jsx("span",{className:"ml-1 text-sm font-medium text-slate-400",children:n})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("p",{className:"text-xs font-medium text-slate-500",children:c}),s&&e.jsxs("span",{className:`flex items-center gap-0.5 text-xs font-semibold ${d}`,children:[e.jsx(s,{size:12}),Math.abs(t),"%"]})]})]})}export{h as C,j as S};
