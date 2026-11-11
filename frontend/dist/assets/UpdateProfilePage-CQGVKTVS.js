import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{J as t,a as n,l as r,t as i,z as a}from"./Typography-huQiXw8K.js";import{F as o,_ as s,t as c}from"./SlidingSnackbar-DoL_jWNC.js";import{t as l}from"./TextField-BxK5gMeW.js";import{c as u,g as d,l as f,o as p,u as m}from"./index-DvYXLKnz.js";import{t as h}from"./CustomSubmitButton-BQWmjlOs.js";import{t as g}from"./Badge-BbOLtYiV.js";var _=a(),v=o((0,_.jsx)(`path`,{d:`M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6z`}),`AttachFile`),y=e(t(),1),b=[`B`,`kB`,`MB`,`GB`,`TB`,`PB`,`EB`,`ZB`,`YB`],x=[`B`,`KiB`,`MiB`,`GiB`,`TiB`,`PiB`,`EiB`,`ZiB`,`YiB`],S=[`b`,`kbit`,`Mbit`,`Gbit`,`Tbit`,`Pbit`,`Ebit`,`Zbit`,`Ybit`],C=[`b`,`kibit`,`Mibit`,`Gibit`,`Tibit`,`Pibit`,`Eibit`,`Zibit`,`Yibit`],w=(e,t,n)=>{let r=e;return typeof t==`string`||Array.isArray(t)?r=e.toLocaleString(t,n):(t===!0||n!==void 0)&&(r=e.toLocaleString(void 0,n)),r};function T(e,t){if(!Number.isFinite(e))throw TypeError(`Expected a finite number, got ${typeof e}: ${e}`);t={bits:!1,binary:!1,space:!0,...t};let n=t.bits?t.binary?C:S:t.binary?x:b,r=t.space?` `:``;if(t.signed&&e===0)return` 0${r}${n[0]}`;let i=e<0,a=i?`-`:t.signed?`+`:``;i&&(e=-e);let o;if(t.minimumFractionDigits!==void 0&&(o={minimumFractionDigits:t.minimumFractionDigits}),t.maximumFractionDigits!==void 0&&(o={maximumFractionDigits:t.maximumFractionDigits,...o}),e<1)return a+w(e,t.locale,o)+r+n[0];let s=Math.min(Math.floor(t.binary?Math.log(e)/Math.log(1024):Math.log10(e)/3),n.length-1);e/=(t.binary?1024:1e3)**s,o||(e=e.toPrecision(3));let c=w(Number(e),t.locale,o),l=n[s];return a+c+r+l}var E={Label:r(`label`)`
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
`,Filename:r(`div`)`
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
`},D=({text:e,isPlaceholder:t,placeholder:n,ref:r,...i})=>(0,_.jsxs)(E.Label,{children:[(0,_.jsx)(`input`,{...i,ref:r}),e?(0,_.jsx)(`span`,{"aria-placeholder":n,className:t?`MuiFileInput-placeholder`:``,children:typeof e==`string`?e:(0,_.jsxs)(E.Filename,{children:[(0,_.jsx)(`span`,{children:e.filename}),(0,_.jsxs)(`span`,{children:[`.`,e.extension]})]})}):null]});function O(e){return e.length>0}function k(e){return e.reduce((e,t)=>e+t.size,0)}function A(e){return typeof window<`u`&&e instanceof File}function j(e){let t=A(e)?e.name:e[0]?.name??``,n=t.lastIndexOf(`.`),r=n>=0?t.slice(n+1):``;return{filename:n>=0?t.slice(0,n):t,extension:r}}var M={},N=typeof window<`u`?y.useLayoutEffect:y.useEffect,P=e=>{let{value:t,onChange:n,disabled:r,getInputText:a,getSizeText:o,placeholder:c,hideSizeText:u,ref:f,slotProps:p,multiple:m,className:h,clearIconButtonProps:g=M,...v}=e,{className:b=``,...x}=g,S=y.useRef(null),C=p?.input,w=C?.startAdornment,{startAdornment:E,inputComponent:P,...F}=C??M,I=p?.htmlInput,{multiple:L,...R}=I??M,z=m||!!I?.multiple,B=()=>{S.current&&(S.current.value=``)},V=e=>{let t=e.target.files,r=t?Array.from(t):[];m?(n?.(r),r.length===0&&B()):(n?.(r[0]||null),r[0]||B())},H=e=>{e.preventDefault(),!r&&(m?n?.([]):n?.(null))},U=Array.isArray(t)?O(t):A(t);N(()=>{let e=S.current;e&&!U&&(e.value=``)},[U]);let W=()=>t===null||Array.isArray(t)&&t.length===0?c||``:typeof a==`function`&&t!==void 0?a(t):t&&U?Array.isArray(t)&&t.length>1?`${t.length} files`:j(t):``;return(0,_.jsx)(l,{ref:f,type:`file`,disabled:r,onChange:V,className:`MuiFileInput-TextField ${h||``}`,slotProps:{input:{startAdornment:w?(0,_.jsx)(d,{position:`start`,children:w}):void 0,endAdornment:(0,_.jsxs)(d,{position:`end`,style:{visibility:U?`visible`:`hidden`},children:[u?null:(0,_.jsx)(i,{variant:`caption`,sx:{mr:`2px`,lineHeight:1},className:`MuiFileInput-Typography-size-text`,children:(()=>{if(typeof o==`function`&&t!==void 0)return o(t);if(U){if(Array.isArray(t))return T(k(t));if(A(t))return T(t.size)}return``})()}),(0,_.jsx)(s,{"aria-label":`Clear`,title:`Clear`,size:`small`,disabled:r,className:`${b} MuiFileInput-ClearIconButton`,onClick:H,...x})]}),...F,inputComponent:D},htmlInput:{text:W(),multiple:z,ref:S,isPlaceholder:!U,placeholder:c,...R}},...v})};function F(){let e=f(),[t,r]=(0,y.useState)(e.user?.username||``),[a,o]=(0,y.useState)(null),[s,d]=(0,y.useState)(!1),[b,x]=(0,y.useState)(null);return(0,_.jsxs)(_.Fragment,{children:[(0,_.jsx)(m,{}),(0,_.jsxs)(i,{variant:`h4`,component:`h1`,children:[(0,_.jsx)(g,{fontSize:`medium`}),` Update Profile`]}),(0,_.jsxs)(n,{component:`form`,onSubmit:async n=>{n.preventDefault(),d(!0),x(null);try{if(!e.accessToken)throw Error(`You are not authenticated.`);let n=await u(e.accessToken,{username:t,profile_image:a??void 0});e.updateUser(n),x({message:`Profile updated successfully.`,severity:`success`})}catch(e){x({message:e instanceof Error?e.message:`An unknown error occurred`,severity:`danger`})}finally{d(!1)}},sx:{display:`flex`,flexDirection:`column`,gap:2,maxWidth:400,mx:`auto`,mt:3},children:[(0,_.jsx)(l,{id:`username`,label:`Username`,name:`username`,variant:`outlined`,value:t,onChange:e=>r(e.target.value)}),(0,_.jsx)(P,{value:a,onChange:e=>{o(e)},slotProps:{htmlInput:{accept:`image/*`},input:{startAdornment:(0,_.jsx)(v,{})}},clearIconButtonProps:{title:`Remove`,children:(0,_.jsx)(p,{fontSize:`small`})},sx:{"& .MuiInputBase-root *":{color:`#fff !important`,opacity:.9}},placeholder:`Choose a profile picture`}),(0,_.jsx)(h,{isLoading:s,children:`Submit`})]}),(0,_.jsx)(c,{open:b!==null,message:b?.message,severity:b?.severity??`info`,onClose:()=>x(null)})]})}export{F as default};