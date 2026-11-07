import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{A as t,J as n,S as r,a as i,c as a,l as o,o as s,s as c,t as l,z as u}from"./Typography-huQiXw8K.js";import{P as d,_ as f,t as p}from"./SlidingSnackbar-BmLU2SjR.js";import{D as m,O as h,c as g,h as _,m as v,o as y,s as b,u as x}from"./index-BdMU6XSj.js";import{t as S}from"./CustomSubmitButton-BV5ShC_A.js";import{n as C,r as w}from"./user-CgifiSzy.js";var T=e(n(),1),E=u(),D,O=(e,t)=>{let{ownerState:n}=e;return[t.root,t[`position${s(n.position)}`],n.disablePointerEvents===!0&&t.disablePointerEvents,t[n.variant]]},k=e=>{let{classes:t,disablePointerEvents:n,hiddenLabel:i,position:a,size:o,variant:c}=e,l={root:[`root`,n&&`disablePointerEvents`,a&&`position${s(a)}`,c,i&&`hiddenLabel`,o&&`size${s(o)}`]};return r(l,v,t)},A=o(`div`,{name:`MuiInputAdornment`,slot:`Root`,overridesResolver:O})(a(({theme:e})=>({display:`flex`,maxHeight:`2em`,alignItems:`center`,whiteSpace:`nowrap`,color:(e.vars||e).palette.action.active,variants:[{props:{variant:`filled`},style:{[`&.${_.positionStart}&:not(.${_.hiddenLabel})`]:{marginTop:16}}},{props:{position:`start`},style:{marginRight:8}},{props:{position:`end`},style:{marginLeft:8}},{props:{disablePointerEvents:!0},style:{pointerEvents:`none`}}]}))),j=T.forwardRef(function(e,n){let r=c({props:e,name:`MuiInputAdornment`}),{children:i,className:a,component:o=`div`,disablePointerEvents:s=!1,disableTypography:u=!1,position:d,variant:f,...p}=r,g=m()||{},_=f;f&&g.variant,g&&!_&&(_=g.variant);let v={...r,hiddenLabel:g.hiddenLabel,size:g.size,disablePointerEvents:s,position:d,variant:_},y=k(v);return(0,E.jsx)(h.Provider,{value:null,children:(0,E.jsx)(A,{as:o,ownerState:v,className:t(y.root,a),ref:n,...p,children:typeof i==`string`&&!u?(0,E.jsx)(l,{color:`textSecondary`,children:i}):(0,E.jsxs)(T.Fragment,{children:[d===`start`?D||=(0,E.jsx)(`span`,{className:`notranslate`,"aria-hidden":!0,children:`​`}):null,i]})})})}),M=d((0,E.jsx)(`path`,{d:`M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6z`}),`AttachFile`),N=[`B`,`kB`,`MB`,`GB`,`TB`,`PB`,`EB`,`ZB`,`YB`],P=[`B`,`KiB`,`MiB`,`GiB`,`TiB`,`PiB`,`EiB`,`ZiB`,`YiB`],F=[`b`,`kbit`,`Mbit`,`Gbit`,`Tbit`,`Pbit`,`Ebit`,`Zbit`,`Ybit`],I=[`b`,`kibit`,`Mibit`,`Gibit`,`Tibit`,`Pibit`,`Eibit`,`Zibit`,`Yibit`],L=(e,t,n)=>{let r=e;return typeof t==`string`||Array.isArray(t)?r=e.toLocaleString(t,n):(t===!0||n!==void 0)&&(r=e.toLocaleString(void 0,n)),r};function R(e,t){if(!Number.isFinite(e))throw TypeError(`Expected a finite number, got ${typeof e}: ${e}`);t={bits:!1,binary:!1,space:!0,...t};let n=t.bits?t.binary?I:F:t.binary?P:N,r=t.space?` `:``;if(t.signed&&e===0)return` 0${r}${n[0]}`;let i=e<0,a=i?`-`:t.signed?`+`:``;i&&(e=-e);let o;if(t.minimumFractionDigits!==void 0&&(o={minimumFractionDigits:t.minimumFractionDigits}),t.maximumFractionDigits!==void 0&&(o={maximumFractionDigits:t.maximumFractionDigits,...o}),e<1)return a+L(e,t.locale,o)+r+n[0];let s=Math.min(Math.floor(t.binary?Math.log(e)/Math.log(1024):Math.log10(e)/3),n.length-1);e/=(t.binary?1024:1e3)**s,o||(e=e.toPrecision(3));let c=L(Number(e),t.locale,o),l=n[s];return a+c+r+l}var z={Label:o(`label`)`
  position: relative;
  flex-grow: 1;

  input {
    opacity: 0 !important;
  }

  & > span {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    align-items: center;
  }

  span.MuiFileInput-placeholder {
    color: gray;
  }
`,Filename:o(`div`)`
  display: flex;
  width: 100%;

  & > span {
    display: block;
  }

  & > span:first-of-type {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  & > span:last-of-type {
    flex-shrink: 0;
    display: block;
  }
`},B=({text:e,isPlaceholder:t,placeholder:n,ref:r,...i})=>(0,E.jsxs)(z.Label,{children:[(0,E.jsx)(`input`,{...i,ref:r}),e?(0,E.jsx)(`span`,{"aria-placeholder":n,className:t?`MuiFileInput-placeholder`:``,children:typeof e==`string`?e:(0,E.jsxs)(z.Filename,{children:[(0,E.jsx)(`span`,{children:e.filename}),(0,E.jsxs)(`span`,{children:[`.`,e.extension]})]})}):null]});function V(e){return e.length>0}function H(e){return e.reduce((e,t)=>e+t.size,0)}function U(e){return typeof window<`u`&&e instanceof File}function W(e){let t=U(e)?e.name:e[0]?.name??``,n=t.lastIndexOf(`.`),r=n>=0?t.slice(n+1):``;return{filename:n>=0?t.slice(0,n):t,extension:r}}var G={},K=typeof window<`u`?T.useLayoutEffect:T.useEffect,q=e=>{let{value:t,onChange:n,disabled:r,getInputText:i,getSizeText:a,placeholder:o,hideSizeText:s,ref:c,slotProps:u,multiple:d,className:p,clearIconButtonProps:m=G,...h}=e,{className:g=``,..._}=m,v=T.useRef(null),y=u?.input,b=y?.startAdornment,{startAdornment:S,inputComponent:C,...w}=y??G,D=u?.htmlInput,{multiple:O,...k}=D??G,A=d||!!D?.multiple,M=()=>{v.current&&(v.current.value=``)},N=e=>{let t=e.target.files,r=t?Array.from(t):[];d?(n?.(r),r.length===0&&M()):(n?.(r[0]||null),r[0]||M())},P=e=>{e.preventDefault(),!r&&(d?n?.([]):n?.(null))},F=Array.isArray(t)?V(t):U(t);K(()=>{let e=v.current;e&&!F&&(e.value=``)},[F]);let I=()=>t===null||Array.isArray(t)&&t.length===0?o||``:typeof i==`function`&&t!==void 0?i(t):t&&F?Array.isArray(t)&&t.length>1?`${t.length} files`:W(t):``;return(0,E.jsx)(x,{ref:c,type:`file`,disabled:r,onChange:N,className:`MuiFileInput-TextField ${p||``}`,slotProps:{input:{startAdornment:b?(0,E.jsx)(j,{position:`start`,children:b}):void 0,endAdornment:(0,E.jsxs)(j,{position:`end`,style:{visibility:F?`visible`:`hidden`},children:[s?null:(0,E.jsx)(l,{variant:`caption`,sx:{mr:`2px`,lineHeight:1},className:`MuiFileInput-Typography-size-text`,children:(()=>{if(typeof a==`function`&&t!==void 0)return a(t);if(F){if(Array.isArray(t))return R(H(t));if(U(t))return R(t.size)}return``})()}),(0,E.jsx)(f,{"aria-label":`Clear`,title:`Clear`,size:`small`,disabled:r,className:`${g} MuiFileInput-ClearIconButton`,onClick:P,..._})]}),...w,inputComponent:B},htmlInput:{text:I(),multiple:A,ref:v,isPlaceholder:!F,placeholder:o,...k}},...h})};function J(){let e=b(),[t,n]=(0,T.useState)(e.user?.username||``),[r,a]=(0,T.useState)(null),[o,s]=(0,T.useState)(!1),[c,u]=(0,T.useState)(null);return(0,E.jsxs)(E.Fragment,{children:[(0,E.jsx)(g,{}),(0,E.jsxs)(l,{variant:`h4`,component:`h1`,children:[(0,E.jsx)(w,{fontSize:`medium`}),` Update Profile`]}),(0,E.jsxs)(i,{component:`form`,onSubmit:async n=>{n.preventDefault(),s(!0),u(null);try{if(!e.accessToken)throw Error(`You are not authenticated.`);let n=await C(e.accessToken,{username:t,profile_image:r??void 0});e.updateUser(n),u({message:`Profile updated successfully.`,severity:`success`})}catch(e){u({message:e instanceof Error?e.message:`An unknown error occurred`,severity:`danger`})}finally{s(!1)}},sx:{display:`flex`,flexDirection:`column`,gap:2,maxWidth:400,mx:`auto`,mt:3},children:[(0,E.jsx)(x,{id:`username`,label:`Username`,name:`username`,variant:`outlined`,value:t,onChange:e=>n(e.target.value)}),(0,E.jsx)(q,{value:r,onChange:e=>{a(e)},slotProps:{htmlInput:{accept:`image/*`},input:{startAdornment:(0,E.jsx)(M,{})}},clearIconButtonProps:{title:`Remove`,children:(0,E.jsx)(y,{fontSize:`small`})},sx:{"& .MuiInputBase-root *":{color:`#fff !important`,opacity:.9}},placeholder:`Choose a profile picture`}),(0,E.jsx)(S,{isLoading:o,children:`Submit`})]}),(0,E.jsx)(p,{open:c!==null,message:c?.message,severity:c?.severity??`info`,onClose:()=>u(null)})]})}export{J as default};