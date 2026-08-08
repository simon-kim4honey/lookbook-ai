var e=(e,t,n)=>(r,i)=>{let a=-1;return o(0);async function o(s){if(s<=a)throw Error(`next() called multiple times`);a=s;let l,u=!1,d;if(e[s]?(d=e[s][0][0],r.req.routeIndex=s):d=s===e.length&&i||void 0,d)try{l=await d(r,()=>o(s+1))}catch(e){if(e instanceof Error&&t)r.error=e,l=await t(e,r),u=!0;else throw e}else r.finalized===!1&&n&&(l=await n(r));return l&&(r.finalized===!1||u)&&(r.res=l),r}},t=Symbol(),n=(e,t)=>new Response(e,{headers:{"Content-Type":t.replace(/^[^;]+/,e=>e.toLowerCase())}}).formData(),r=e=>`headers`in e,i=async(e,t=Object.create(null))=>{let{all:n=!1,dot:i=!1}=t,o=(r(e)?e.headers:e.raw.headers).get(`Content-Type`)?.split(`;`)[0].trim().toLowerCase();return o===`multipart/form-data`||o===`application/x-www-form-urlencoded`?a(e,{all:n,dot:i}):{}};async function a(e,t){let i=r(e)?e.headers:e.raw.headers,a=n(await e.arrayBuffer(),i.get(`Content-Type`)||``);r(e)||(e.bodyCache.formData=a);let s=await a;return s?o(s,t):{}}function o(e,t){let n=Object.create(null);return e.forEach((e,r)=>{t.all||r.endsWith(`[]`)?s(n,r,e):n[r]=e}),t.dot&&Object.entries(n).forEach(([e,t])=>{e.includes(`.`)&&(l(n,e,t),delete n[e])}),n}var s=(e,t,n)=>{e[t]===void 0?t.endsWith(`[]`)?e[t]=[n]:e[t]=n:Array.isArray(e[t])?e[t].push(n):e[t]=[e[t],n]},l=(e,t,n)=>{if(/(?:^|\.)__proto__\./.test(t))return;let r=e,i=t.split(`.`);i.forEach((e,t)=>{t===i.length-1?r[e]=n:((!r[e]||typeof r[e]!=`object`||Array.isArray(r[e])||r[e]instanceof File)&&(r[e]=Object.create(null)),r=r[e])})},u=e=>{let t=e.split(`/`);return t[0]===``&&t.shift(),t},d=e=>{let{groups:t,path:n}=f(e);return p(u(n),t)},f=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(e,n)=>{let r=`@${n}`;return t.push([r,e]),r}),{groups:t,path:e}},p=(e,t)=>{for(let n=t.length-1;n>=0;n--){let[r]=t[n];for(let i=e.length-1;i>=0;i--)if(e[i].includes(r)){e[i]=e[i].replace(r,t[n][1]);break}}return e},m={},h=(e,t)=>{if(e===`*`)return`*`;let n=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(n){let r=`${e}#${t}`;return m[r]||(n[2]?m[r]=t&&t[0]!==`:`&&t[0]!==`*`?[r,n[1],RegExp(`^${n[2]}(?=/${t})`)]:[e,n[1],RegExp(`^${n[2]}$`)]:m[r]=[e,n[1],!0]),m[r]}return null},g=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,e=>{try{return t(e)}catch{return e}})}},_=e=>g(e,decodeURI),v=e=>{let t=e.url,n=t.indexOf(`/`,t.indexOf(`:`)+4),r=n;for(;r<t.length;r++){let e=t.charCodeAt(r);if(e===37){let e=t.indexOf(`?`,r),i=t.indexOf(`#`,r),a=e===-1?i===-1?void 0:i:i===-1?e:Math.min(e,i),o=t.slice(n,a);return _(o.includes(`%25`)?o.replace(/%25/g,`%2525`):o)}else if(e===63||e===35)break}return t.slice(n,r)},y=e=>{let t=v(e);return t.length>1&&t.at(-1)===`/`?t.slice(0,-1):t},b=(e,t,...n)=>(n.length&&(t=b(t,...n)),`${e?.[0]===`/`?``:`/`}${e}${t===`/`?``:`${e?.at(-1)===`/`?``:`/`}${t?.[0]===`/`?t.slice(1):t}`}`),x=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(`:`))return null;let t=e.split(`/`),n=[],r=``;return t.forEach(e=>{if(e!==``&&!/\:/.test(e))r+=`/`+e;else if(/\:/.test(e))if(/\?/.test(e)){n.length===0&&r===``?n.push(`/`):n.push(r);let t=e.replace(`?`,``);r+=`/`+t,n.push(r)}else r+=`/`+e}),n.filter((e,t,n)=>n.indexOf(e)===t)},S=e=>/[%+]/.test(e)?(e.indexOf(`+`)!==-1&&(e=e.replace(/\+/g,` `)),e.indexOf(`%`)===-1?e:g(e,E)):e,C=(e,t,n)=>{let r;if(!n&&t&&!/[%+]/.test(t)){let n=e.indexOf(`?`,8);if(n===-1)return;for(e.startsWith(t,n+1)||(n=e.indexOf(`&${t}`,n+1));n!==-1;){let r=e.charCodeAt(n+t.length+1);if(r===61){let r=n+t.length+2,i=e.indexOf(`&`,r);return S(e.slice(r,i===-1?void 0:i))}else if(r==38||isNaN(r))return``;n=e.indexOf(`&${t}`,n+1)}if(r=/[%+]/.test(e),!r)return}let i={};r??=/[%+]/.test(e);let a=e.indexOf(`?`,8);for(;a!==-1;){let t=e.indexOf(`&`,a+1),o=e.indexOf(`=`,a);o>t&&t!==-1&&(o=-1);let s=e.slice(a+1,o===-1?t===-1?void 0:t:o);if(r&&(s=S(s)),a=t,s===``)continue;let l;o===-1?l=``:(l=e.slice(o+1,t===-1?void 0:t),r&&(l=S(l))),n?(i[s]&&Array.isArray(i[s])||(i[s]=[]),i[s].push(l)):i[s]??=l}return t?i[t]:i},w=C,T=(e,t)=>C(e,t,!0),E=decodeURIComponent,D=e=>g(e,E),O=class{raw;#e;#t;routeIndex=0;path;bodyCache={};constructor(e,t=`/`,n=[[]]){this.raw=e,this.path=t,this.#t=n,this.#e={}}param(e){return e?this.#n(e):this.#r()}#n(e){let t=this.#t[0][this.routeIndex][1][e],n=this.#i(t);return n&&/\%/.test(n)?D(n):n}#r(){let e={},t=Object.keys(this.#t[0][this.routeIndex][1]);for(let n of t){let t=this.#i(this.#t[0][this.routeIndex][1][n]);t!==void 0&&(e[n]=/\%/.test(t)?D(t):t)}return e}#i(e){return this.#t[1]?this.#t[1][e]:e}query(e){return w(this.url,e)}queries(e){return T(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((e,n)=>{t[n]=e}),t}async parseBody(e){return i(this,e)}#a=e=>{let{bodyCache:t,raw:n}=this,r=t[e];if(r)return r;let i=Object.keys(t)[0];return i?t[i].then(t=>(i===`json`&&(t=JSON.stringify(t)),new Response(t)[e]())):t[e]=n[e]()};json(){return this.#a(`text`).then(e=>JSON.parse(e))}text(){return this.#a(`text`)}arrayBuffer(){return this.#a(`arrayBuffer`)}bytes(){return this.#a(`arrayBuffer`).then(e=>new Uint8Array(e))}blob(){return this.#a(`blob`)}formData(){return this.#a(`formData`)}addValidatedData(e,t){this.#e[e]=t}valid(e){return this.#e[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[t](){return this.#t}get matchedRoutes(){return this.#t[0].map(([[,e]])=>e)}get routePath(){return this.#t[0].map(([[,e]])=>e)[this.routeIndex].path}},ee={Stringify:1,BeforeStream:2,Stream:3},k=(e,t)=>{let n=new String(e);return n.isEscaped=!0,n.callbacks=t,n},A=async(e,t,n,r,i)=>{typeof e==`object`&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let a=e.callbacks;if(!a?.length)return Promise.resolve(e);i?i[0]+=e:i=[e];let o=Promise.all(a.map(e=>e({phase:t,buffer:i,context:r}))).then(e=>Promise.all(e.filter(Boolean).map(e=>A(e,t,!1,r,i))).then(()=>i[0]));return n?k(await o,a):o},j=`text/plain; charset=UTF-8`,M=(e,t)=>({"Content-Type":e,...t}),N=(e,t)=>new Response(e,t),P=class{#e;#t;env={};#n;finalized=!1;error;#r;#i;#a;#o;#s;#c;#l;#u;#d;constructor(e,t){this.#e=e,t&&(this.#i=t.executionCtx,this.env=t.env,this.#c=t.notFoundHandler,this.#d=t.path,this.#u=t.matchResult)}get req(){return this.#t??=new O(this.#e,this.#d,this.#u),this.#t}get event(){if(this.#i&&`respondWith`in this.#i)return this.#i;throw Error(`This context has no FetchEvent`)}get executionCtx(){if(this.#i)return this.#i;throw Error(`This context has no ExecutionContext`)}get res(){return this.#a||=N(null,{headers:this.#l??=new Headers})}set res(e){if(this.#a&&e){e=N(e.body,e);for(let[t,n]of this.#a.headers.entries())if(t!==`content-type`)if(t===`set-cookie`){let t=this.#a.headers.getSetCookie();e.headers.delete(`set-cookie`);for(let n of t)e.headers.append(`set-cookie`,n)}else e.headers.set(t,n)}this.#a=e,this.finalized=!0}render=(...e)=>(this.#s??=e=>this.html(e),this.#s(...e));setLayout=e=>this.#o=e;getLayout=()=>this.#o;setRenderer=e=>{this.#s=e};header=(e,t,n)=>{this.finalized&&(this.#a=N(this.#a.body,this.#a));let r=this.#a?this.#a.headers:this.#l??=new Headers;t===void 0?r.delete(e):n?.append?r.append(e,t):r.set(e,t)};status=e=>{this.#r=e};set=(e,t)=>{this.#n??=new Map,this.#n.set(e,t)};get=e=>this.#n?this.#n.get(e):void 0;get var(){return this.#n?Object.fromEntries(this.#n):{}}#f(e,t,n){let r=this.#a?new Headers(this.#a.headers):this.#l??new Headers;if(typeof t==`object`&&`headers`in t){let e=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[t,n]of e)t.toLowerCase()===`set-cookie`?r.append(t,n):r.set(t,n)}if(n)for(let[e,t]of Object.entries(n))if(typeof t==`string`)r.set(e,t);else{r.delete(e);for(let n of t)r.append(e,n)}return N(e,{status:typeof t==`number`?t:t?.status??this.#r,headers:r})}newResponse=(...e)=>this.#f(...e);body=(e,t,n)=>this.#f(e,t,n);text=(e,t,n)=>!this.#l&&!this.#r&&!t&&!n&&!this.finalized?new Response(e):this.#f(e,t,M(j,n));json=(e,t,n)=>this.#f(JSON.stringify(e),t,M(`application/json`,n));html=(e,t,n)=>{let r=e=>this.#f(e,t,M(`text/html; charset=UTF-8`,n));return typeof e==`object`?A(e,ee.Stringify,!1,{}).then(r):r(e)};redirect=(e,t)=>{let n=String(e);return this.header(`Location`,/[^\x00-\xFF]/.test(n)?encodeURI(n):n),this.newResponse(null,t??302)};notFound=()=>(this.#c??=()=>N(),this.#c(this))},F=[`get`,`post`,`put`,`delete`,`options`,`patch`],I=`Can not add a route since the matcher is already built.`,L=class extends Error{},te=`__COMPOSED_HANDLER`,R=e=>e.text(`404 Not Found`,404),z=(e,t)=>{if(`getResponse`in e){let n=e.getResponse();return t.newResponse(n.body,n)}return console.error(e),t.text(`Internal Server Error`,500)},ne=class t{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath=`/`;#e=`/`;routes=[];constructor(e={}){[...F,`all`].forEach(e=>{this[e]=(t,...n)=>(typeof t==`string`?this.#e=t:this.#r(e,this.#e,t),n.forEach(t=>{this.#r(e,this.#e,t)}),this)}),this.on=(e,t,...n)=>{for(let r of[t].flat()){this.#e=r;for(let t of[e].flat())n.map(e=>{this.#r(t.toUpperCase(),this.#e,e)})}return this},this.use=(e,...t)=>(typeof e==`string`?this.#e=e:(this.#e=`*`,t.unshift(e)),t.forEach(e=>{this.#r(`ALL`,this.#e,e)}),this);let{strict:t,...n}=e;Object.assign(this,n),this.getPath=t??!0?e.getPath??v:y}#t(){let e=new t({router:this.router,getPath:this.getPath});return e.errorHandler=this.errorHandler,e.#n=this.#n,e.routes=this.routes,e}#n=R;errorHandler=z;route(t,n){let r=this.basePath(t);return n.routes.map(t=>{let i;n.errorHandler===z?i=t.handler:(i=async(r,i)=>(await e([],n.errorHandler)(r,()=>t.handler(r,i))).res,i[te]=t.handler),r.#r(t.method,t.path,i,t.basePath)}),this}basePath(e){let t=this.#t();return t._basePath=b(this._basePath,e),t}onError=e=>(this.errorHandler=e,this);notFound=e=>(this.#n=e,this);mount(e,t,n){let r,i;n&&(typeof n==`function`?i=n:(i=n.optionHandler,r=n.replaceRequest===!1?e=>e:n.replaceRequest));let a=i?e=>{let t=i(e);return Array.isArray(t)?t:[t]}:e=>{let t;try{t=e.executionCtx}catch{}return[e.env,t]};return r||=(()=>{let t=b(this._basePath,e),n=t===`/`?0:t.length;return e=>{let t=new URL(e.url);return t.pathname=this.getPath(e).slice(n)||`/`,new Request(t,e)}})(),this.#r(`ALL`,b(e,`*`),async(e,n)=>{let i=await t(r(e.req.raw),...a(e));if(i)return i;await n()}),this}#r(e,t,n,r){e=e.toUpperCase(),t=b(this._basePath,t);let i={basePath:r===void 0?this._basePath:b(this._basePath,r),path:t,method:e,handler:n};this.router.add(e,t,[n,i]),this.routes.push(i)}#i(e,t){if(e instanceof Error)return this.errorHandler(e,t);throw e}#a(t,n,r,i){if(i===`HEAD`)return(async()=>new Response(null,await this.#a(t,n,r,`GET`)))();let a=this.getPath(t,{env:r}),o=this.router.match(i,a),s=new P(t,{path:a,matchResult:o,env:r,executionCtx:n,notFoundHandler:this.#n});if(o[0].length===1){let e;try{e=o[0][0][0][0](s,async()=>{s.res=await this.#n(s)})}catch(e){return this.#i(e,s)}return e instanceof Promise?e.then(e=>e||(s.finalized?s.res:this.#n(s))).catch(e=>this.#i(e,s)):e??this.#n(s)}let l=e(o[0],this.errorHandler,this.#n);return(async()=>{try{let e=await l(s);if(!e.finalized)throw Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return e.res}catch(e){return this.#i(e,s)}})()}fetch=(e,...t)=>this.#a(e,t[1],t[0],e.method);request=(e,t,n,r)=>e instanceof Request?this.fetch(t?new Request(e,t):e,n,r):(e=e.toString(),this.fetch(new Request(/^https?:\/\//.test(e)?e:`http://localhost${b(`/`,e)}`,t),n,r));fire=()=>{addEventListener(`fetch`,e=>{e.respondWith(this.#a(e.request,e,void 0,e.request.method))})}},re=[];function ie(e,t){let n=this.buildAllMatchers(),r=((e,t)=>{let r=n[e]||n.ALL,i=r[2][t];if(i)return i;let a=t.match(r[0]);if(!a)return[[],re];let o=a.indexOf(``,1);return[r[1][o],a]});return this.match=r,r(e,t)}var B=`[^/]+`,V=`.*`,H=`(?:|/.*)`,U=Symbol(),ae=new Set(`.\\+*[^]$()`);function oe(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===V||e===H?1:t===V||t===H?-1:e===B?1:t===B?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var se=class e{#e;#t;#n=Object.create(null);insert(t,n,r,i,a){if(t.length===0){if(this.#e!==void 0)throw U;if(a)return;this.#e=n;return}let[o,...s]=t,l=o===`*`?s.length===0?[``,``,V]:[``,``,B]:o===`/*`?[``,``,H]:o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),u;if(l){let t=l[1],n=l[2]||B;if(t&&l[2]&&(n===`.*`||(n=n.replace(/^\((?!\?:)(?=[^)]+\)$)/,`(?:`),/\((?!\?:)/.test(n))))throw U;if(u=this.#n[n],!u){if(Object.keys(this.#n).some(e=>e!==V&&e!==H))throw U;if(a)return;u=this.#n[n]=new e,t!==``&&(u.#t=i.varIndex++)}!a&&t!==``&&r.push([t,u.#t])}else if(u=this.#n[o],!u){if(Object.keys(this.#n).some(e=>e.length>1&&e!==V&&e!==H))throw U;if(a)return;u=this.#n[o]=new e}u.insert(s,n,r,i,a)}buildRegExpStr(){let e=Object.keys(this.#n).sort(oe).map(e=>{let t=this.#n[e];return(typeof t.#t==`number`?`(${e})@${t.#t}`:ae.has(e)?`\\${e}`:e)+t.buildRegExpStr()});return typeof this.#e==`number`&&e.unshift(`#${this.#e}`),e.length===0?``:e.length===1?e[0]:`(?:`+e.join(`|`)+`)`}},ce=class{#e={varIndex:0};#t=new se;insert(e,t,n){let r=[],i=[];for(let t=0;;){let n=!1;if(e=e.replace(/\{[^}]+\}/g,e=>{let r=`@\\${t}`;return i[t]=[r,e],t++,n=!0,r}),!n)break}let a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let e=i.length-1;e>=0;e--){let[t]=i[e];for(let n=a.length-1;n>=0;n--)if(a[n].indexOf(t)!==-1){a[n]=a[n].replace(t,i[e][1]);break}}return this.#t.insert(a,t,r,this.#e,n),r}buildRegExp(){let e=this.#t.buildRegExpStr();if(e===``)return[/^$/,[],[]];let t=0,n=[],r=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(e,i,a)=>i===void 0?(a===void 0||(r[Number(a)]=++t),``):(n[++t]=Number(i),`$()`)),[RegExp(`^${e}`),n,r]}},le=[/^$/,[],Object.create(null)],ue=Object.create(null);function de(e){return ue[e]??=RegExp(e===`*`?``:`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(e,t)=>t?`\\${t}`:`(?:|/.*)`)}$`)}function fe(){ue=Object.create(null)}function pe(e){let t=new ce,n=[];if(e.length===0)return le;let r=e.map(e=>[!/\*|\/:/.test(e[0]),...e]).sort(([e,t],[n,r])=>e?1:n?-1:t.length-r.length),i=Object.create(null);for(let e=0,a=-1,o=r.length;e<o;e++){let[o,s,l]=r[e];o?i[s]=[l.map(([e])=>[e,Object.create(null)]),re]:a++;let u;try{u=t.insert(s,a,o)}catch(e){throw e===U?new L(s):e}o||(n[a]=l.map(([e,t])=>{let n=Object.create(null);for(--t;t>=0;t--){let[e,r]=u[t];n[e]=r}return[e,n]}))}let[a,o,s]=t.buildRegExp();for(let e=0,t=n.length;e<t;e++)for(let t=0,r=n[e].length;t<r;t++){let r=n[e][t]?.[1];if(!r)continue;let i=Object.keys(r);for(let e=0,t=i.length;e<t;e++)r[i[e]]=s[r[i[e]]]}let l=[];for(let e in o)l[e]=n[o[e]];return[a,l,i]}function W(e,t){if(e){for(let n of Object.keys(e).sort((e,t)=>t.length-e.length))if(de(n).test(t))return[...e[n]]}}var me=class{name=`RegExpRouter`;#e;#t;constructor(){this.#e={ALL:Object.create(null)},this.#t={ALL:Object.create(null)}}add(e,t,n){let r=this.#e,i=this.#t;if(!r||!i)throw Error(I);r[e]||[r,i].forEach(t=>{t[e]=Object.create(null),Object.keys(t.ALL).forEach(n=>{t[e][n]=[...t.ALL[n]]})}),t===`/*`&&(t=`*`);let a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let o=de(t);e===`ALL`?Object.keys(r).forEach(e=>{r[e][t]||=W(r[e],t)||W(r.ALL,t)||[]}):r[e][t]||=W(r[e],t)||W(r.ALL,t)||[],Object.keys(r).forEach(t=>{(e===`ALL`||e===t)&&Object.keys(r[t]).forEach(e=>{o.test(e)&&r[t][e].push([n,a])})}),Object.keys(i).forEach(t=>{(e===`ALL`||e===t)&&Object.keys(i[t]).forEach(e=>o.test(e)&&i[t][e].push([n,a]))});return}let o=x(t)||[t];for(let t=0,s=o.length;t<s;t++){let l=o[t];Object.keys(i).forEach(o=>{(e===`ALL`||e===o)&&(i[o][l]||=[...W(r[o],l)||W(r.ALL,l)||[]],i[o][l].push([n,a-s+t+1]))})}}match=ie;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#t).concat(Object.keys(this.#e)).forEach(t=>{e[t]||=this.#n(t)}),this.#e=this.#t=void 0,fe(),e}#n(e){let t=[],n=e===`ALL`;return[this.#e,this.#t].forEach(r=>{let i=r[e]?Object.keys(r[e]).map(t=>[t,r[e][t]]):[];i.length===0?e!==`ALL`&&t.push(...Object.keys(r.ALL).map(e=>[e,r.ALL[e]])):(n||=!0,t.push(...i))}),n?pe(t):null}},he=class{name=`SmartRouter`;#e=[];#t=[];constructor(e){this.#e=e.routers}add(e,t,n){if(!this.#t)throw Error(I);this.#t.push([e,t,n])}match(e,t){if(!this.#t)throw Error(`Fatal error`);let n=this.#e,r=this.#t,i=n.length,a=0,o;for(;a<i;a++){let i=n[a];try{for(let e=0,t=r.length;e<t;e++)i.add(...r[e]);o=i.match(e,t)}catch(e){if(e instanceof L)continue;throw e}this.match=i.match.bind(i),this.#e=[i],this.#t=void 0;break}if(a===i)throw Error(`Fatal error`);return this.name=`SmartRouter + ${this.activeRouter.name}`,o}get activeRouter(){if(this.#t||this.#e.length!==1)throw Error(`No active router has been determined yet.`);return this.#e[0]}},G=Object.create(null),ge=e=>{for(let t in e)return!0;return!1},_e=class e{#e;#t;#n;#r=0;#i=G;constructor(e,t,n){if(this.#t=n||Object.create(null),this.#e=[],e&&t){let n=Object.create(null);n[e]={handler:t,possibleKeys:[],score:0},this.#e=[n]}this.#n=[]}insert(t,n,r){this.#r=++this.#r;let i=this,a=d(n),o=[];for(let t=0,n=a.length;t<n;t++){let n=a[t],r=a[t+1],s=h(n,r),l=Array.isArray(s)?s[0]:n;if(l in i.#t){i=i.#t[l],s&&o.push(s[1]);continue}i.#t[l]=new e,s&&(i.#n.push(s),o.push(s[1])),i=i.#t[l]}return i.#e.push({[t]:{handler:r,possibleKeys:o.filter((e,t,n)=>n.indexOf(e)===t),score:this.#r}}),i}#a(e,t,n,r,i){for(let a=0,o=t.#e.length;a<o;a++){let o=t.#e[a],s=o[n]||o.ALL,l={};if(s!==void 0&&(s.params=Object.create(null),e.push(s),r!==G||i&&i!==G))for(let e=0,t=s.possibleKeys.length;e<t;e++){let t=s.possibleKeys[e],n=l[s.score];s.params[t]=i?.[t]&&!n?i[t]:r[t]??i?.[t],l[s.score]=!0}}}search(e,t){let n=[];this.#i=G;let r=[this],i=u(t),a=[],o=i.length,s=null;for(let l=0;l<o;l++){let u=i[l],d=l===o-1,f=[];for(let p=0,m=r.length;p<m;p++){let m=r[p],h=m.#t[u];h&&(h.#i=m.#i,d?(h.#t[`*`]&&this.#a(n,h.#t[`*`],e,m.#i),this.#a(n,h,e,m.#i)):f.push(h));for(let r=0,p=m.#n.length;r<p;r++){let p=m.#n[r],h=m.#i===G?{}:{...m.#i};if(p===`*`){let t=m.#t[`*`];t&&(this.#a(n,t,e,m.#i),t.#i=h,f.push(t));continue}let[g,_,v]=p;if(!u&&!(v instanceof RegExp))continue;let y=m.#t[g];if(v instanceof RegExp){if(s===null){s=Array(o);let e=+(t[0]===`/`);for(let t=0;t<o;t++)s[t]=e,e+=i[t].length+1}let r=t.substring(s[l]),u=v.exec(r);if(u){if(h[_]=u[0],this.#a(n,y,e,m.#i,h),u[0].length===r.length&&y.#t[`*`]&&this.#a(n,y.#t[`*`],e,m.#i,h),ge(y.#t)){y.#i=h;let e=u[0].match(/\//)?.length??0;(a[e]||=[]).push(y)}continue}}(v===!0||v.test(u))&&(h[_]=u,d?(this.#a(n,y,e,h,m.#i),y.#t[`*`]&&this.#a(n,y.#t[`*`],e,h,m.#i)):(y.#i=h,f.push(y)))}}let p=a.shift();r=p?f.concat(p):f}return n.length>1&&n.sort((e,t)=>e.score-t.score),[n.map(({handler:e,params:t})=>[e,t])]}},ve=class{name=`TrieRouter`;#e;constructor(){this.#e=new _e}add(e,t,n){let r=x(t);if(r){for(let t=0,i=r.length;t<i;t++)this.#e.insert(e,r[t],n);return}this.#e.insert(e,t,n)}match(e,t){return this.#e.search(e,t)}},ye=class extends ne{constructor(e={}){super(e),this.router=e.router??new he({routers:[new me,new ve]})}},be=/^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|msgpack|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|vnd\.msgpack|wasm|x-httpd-php|x-javascript|x-msgpack|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml|msgpack))(?:[;\s]|$)/i,xe=(e,t=Se)=>{let n=e.match(/\.([a-zA-Z0-9]+?)$/);if(n)return t[n[1].toLowerCase()]},Se={aac:`audio/aac`,avi:`video/x-msvideo`,avif:`image/avif`,av1:`video/av1`,bin:`application/octet-stream`,bmp:`image/bmp`,css:`text/css; charset=utf-8`,csv:`text/csv; charset=utf-8`,eot:`application/vnd.ms-fontobject`,epub:`application/epub+zip`,gif:`image/gif`,gz:`application/gzip`,htm:`text/html; charset=utf-8`,html:`text/html; charset=utf-8`,ico:`image/x-icon`,ics:`text/calendar; charset=utf-8`,jpeg:`image/jpeg`,jpg:`image/jpeg`,js:`text/javascript; charset=utf-8`,json:`application/json`,jsonld:`application/ld+json`,map:`application/json`,mid:`audio/x-midi`,midi:`audio/x-midi`,mjs:`text/javascript; charset=utf-8`,mp3:`audio/mpeg`,mp4:`video/mp4`,mpeg:`video/mpeg`,oga:`audio/ogg`,ogv:`video/ogg`,ogx:`application/ogg`,opus:`audio/opus`,otf:`font/otf`,pdf:`application/pdf`,png:`image/png`,rtf:`application/rtf`,svg:`image/svg+xml; charset=utf-8`,tif:`image/tiff`,tiff:`image/tiff`,ts:`video/mp2t`,ttf:`font/ttf`,txt:`text/plain; charset=utf-8`,wasm:`application/wasm`,webm:`video/webm`,weba:`audio/webm`,webmanifest:`application/manifest+json`,webp:`image/webp`,woff:`font/woff`,woff2:`font/woff2`,xhtml:`application/xhtml+xml; charset=utf-8`,xml:`application/xml; charset=utf-8`,zip:`application/zip`,"3gp":`video/3gpp`,"3g2":`video/3gpp2`,gltf:`model/gltf+json`,glb:`model/gltf-binary`},Ce=(...e)=>{let t=e.filter(e=>e!==``).join(`/`);t=t.replace(/(?<=\/)\/+/g,``);let n=t.split(`/`),r=[];for(let e of n)e===`..`&&r.length>0&&r.at(-1)!==`..`?r.pop():e!==`.`&&r.push(e);return r.join(`/`)||`.`},we={br:`.br`,zstd:`.zst`,gzip:`.gz`},Te=Object.keys(we),Ee=`index.html`,De=e=>{let t=e.root??`./`,n=e.path,r=e.join??Ce;return async(i,a)=>{if(i.finalized)return a();let o;if(e.path)o=e.path;else try{if(o=_(i.req.path),/(?:^|[\/\\])\.{1,2}(?:$|[\/\\])|[\/\\]{2,}|\\/.test(o))throw Error()}catch{return await e.onNotFound?.(i.req.path,i),a()}let s=r(t,!n&&e.rewriteRequestPath?e.rewriteRequestPath(o):o);e.isDir&&await e.isDir(s)&&(s=r(s,Ee));let l=e.getContent,u=await l(s,i);if(u instanceof Response)return i.newResponse(u.body,u);if(u!=null){let t=e.mimes&&xe(s,e.mimes)||xe(s);if(i.header(`Content-Type`,t||`application/octet-stream`),e.precompressed&&(!t||be.test(t))){let e=new Set(i.req.header(`Accept-Encoding`)?.split(`,`).map(e=>e.trim()));for(let t of Te){if(!e.has(t))continue;let n=await l(s+we[t],i);if(n){u=n,i.header(`Content-Encoding`,t),i.header(`Vary`,`Accept-Encoding`,{append:!0});break}}}return await e.onFound?.(s,i),i.body(u)}await e.onNotFound?.(s,i),await a()}},Oe=async(e,t)=>{let n;n=t&&t.manifest?typeof t.manifest==`string`?JSON.parse(t.manifest):t.manifest:typeof __STATIC_CONTENT_MANIFEST==`string`?JSON.parse(__STATIC_CONTENT_MANIFEST):__STATIC_CONTENT_MANIFEST;let r;r=t&&t.namespace?t.namespace:__STATIC_CONTENT;let i=n[e];return i&&await r.get(i,{type:`stream`})||null},ke=(e={})=>async function(t,n){let r=async n=>Oe(n,{manifest:e.manifest,namespace:e.namespace?e.namespace:t.env?t.env.__STATIC_CONTENT:void 0});return De({...e,getContent:r})(t,n)},Ae=e=>ke(e),je=e=>{let t={origin:`*`,allowMethods:[`GET`,`HEAD`,`PUT`,`POST`,`DELETE`,`PATCH`],allowHeaders:[],exposeHeaders:[],...e},n=(e=>typeof e==`string`?e===`*`?()=>e:t=>e===t?t:null:typeof e==`function`?e:t=>e.includes(t)?t:null)(t.origin),r=(e=>typeof e==`function`?e:Array.isArray(e)?()=>e:()=>[])(t.allowMethods);return async function(e,i){function a(t,n){e.res.headers.set(t,n)}let o=await n(e.req.header(`origin`)||``,e);if(o&&a(`Access-Control-Allow-Origin`,o),t.credentials&&a(`Access-Control-Allow-Credentials`,`true`),t.exposeHeaders?.length&&a(`Access-Control-Expose-Headers`,t.exposeHeaders.join(`,`)),e.req.method===`OPTIONS`){t.origin!==`*`&&a(`Vary`,`Origin`),t.maxAge!=null&&a(`Access-Control-Max-Age`,t.maxAge.toString());let n=await r(e.req.header(`origin`)||``,e);n.length&&a(`Access-Control-Allow-Methods`,n.join(`,`));let i=t.allowHeaders;if(!i?.length){let t=e.req.header(`Access-Control-Request-Headers`);t&&(i=t.split(/\s*,\s*/))}return i?.length&&(a(`Access-Control-Allow-Headers`,i.join(`,`)),e.res.headers.append(`Vary`,`Access-Control-Request-Headers`)),e.res.headers.delete(`Content-Length`),e.res.headers.delete(`Content-Type`),new Response(null,{headers:e.res.headers,status:204,statusText:`No Content`})}await i(),t.origin!==`*`&&e.header(`Vary`,`Origin`,{append:!0})}},Me=`msk02bor`,K=new ye;K.use(`/api/*`,je()),K.use(`/static/*`,Ae({root:`./public`}));var q=`https://api.atlascloud.ai`,J=async(e,t)=>{let n=e.req.header(`X-Admin-Password`),r=e.env.ADMIN_PASSWORD;if(!r)return e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500);if(n!==r)return e.json({success:!1,message:`인증 실패`},401);await t()},Y={enabled:!0,prefix:``,suffix:``,styleGuide:[`SCENE-FIRST INTEGRATION PRINCIPLE: Every composited element — clothing, face, skin — must look as if it was photographed in the original background scene, not pasted in.`,`LIGHTING MATCH: Identify the background scene's primary light source direction, color temperature (warm/neutral/cool), and intensity. Apply identical lighting to the person's clothing, face, and all exposed skin. Cast-shadows, specular highlights, and subsurface skin scattering must all originate from the scene's light source.`,`COLOR GRADE MATCH: The background scene carries a specific color grade and tonal mood (e.g. warm golden, cool blue, high-contrast, soft pastel, moody dark). Render all composited elements under this exact color cast — do NOT render clothing or skin under a neutral white balance if the scene is warm or cool-toned.`,`MOOD AND ATMOSPHERE MATCH: Preserve the scene's overall visual mood and atmosphere. The final image must feel tonally coherent — bright and airy scenes stay bright, moody scenes stay moody, editorial high-contrast stays high-contrast.`,`FABRIC LIGHT INTERACTION: Simulate realistic light interaction with the new fabric — specular sheen on satin/silk, soft diffuse on cotton/knit, translucency on chiffon/voile — all under the scene's lighting conditions.`,`SKIN-SCENE MATCH: The model's face and skin must be RE-LIT to match the scene. Preserve facial geometry and identity exactly, but ADJUST brightness, color temperature, and shadow direction to match the scene's lighting. Do NOT preserve the face's original lighting from the reference image — re-render it under the scene's physical light. Face-to-neck and face-to-arm skin tone must be seamlessly consistent.`,`Fashion editorial quality: magazine cover level seamless compositing, physically grounded.`].join(` `),technicalSpec:[`초사실적 표현, 직물 질감과 피부 디테일 극사실 재현.`,`의류 드레이프와 핏 완벽 재현. 자연스러운 주름 외 구김 없음.`,`의류에 선명한 포커스. 배경과 동일한 심도 및 렌즈 특성 유지.`,`배경 씬의 색감·무드·조명 톤을 인물과 의류에 완전히 통합. 합성 아티팩트 없음.`,`참조 이미지에 없는 의류, 액세서리, 소품 절대 추가 금지.`,`ABSOLUTE PROHIBITION: NO text, NO letters, NO numbers, NO logos, NO watermarks, NO brand marks, NO typographic elements of any kind anywhere in the image.`,`ABSOLUTE PROHIBITION: DO NOT alter the model's facial geometry, eye/nose/lip shape, or hair style. HOWEVER: skin brightness, color temperature, and lighting on the face MUST be adjusted to match the scene — this is not a violation, it is required.`,`ABSOLUTE PROHIBITION: DO NOT modify, redesign, or alter any detail of the uploaded clothing item.`].join(` `),updatedAt:new Date().toISOString()};function Ne(e){if(!Y.enabled)return e;let t=[];return Y.prefix.trim()&&t.push(Y.prefix.trim()),t.push(e),Y.styleGuide.trim()&&t.push(Y.styleGuide.trim()),Y.technicalSpec.trim()&&t.push(Y.technicalSpec.trim()),Y.suffix.trim()&&t.push(Y.suffix.trim()),t.join(` `)}async function X(e){let t=await e.get(`model_index`);return t?JSON.parse(t):[]}async function Pe(e,t){await e.put(`model_index`,JSON.stringify(t))}async function Z(e){let t=await e.get(`bg_index`);return t?JSON.parse(t):[]}async function Fe(e,t){await e.put(`bg_index`,JSON.stringify(t))}async function Ie(e){let t=await e.get(`id_counter`),n=t?parseInt(t)+1:1001;return await e.put(`id_counter`,String(n)),String(n-1==0?1e3:n-1)}async function Le(e){await e.prepare(`UPDATE id_counter SET value = value + 1 WHERE id = 1`).run();let t=await e.prepare(`SELECT value FROM id_counter WHERE id = 1`).first();return String(t?.value??1e3)}async function Re(e){let{results:t}=await e.prepare(`SELECT id, name, desc_text, gender, age, mood, created_at FROM custom_models ORDER BY created_at ASC`).all();return t.map(e=>({id:e.id,name:e.name,desc:e.desc_text,gender:e.gender||`미분류`,age:e.age||`미분류`,mood:e.mood||`미분류`,createdAt:e.created_at}))}async function ze(e,t){let n=[];for(let r of t){let{name:t,desc:i,gender:a,age:o,mood:s,imageBase64:l}=r;if(!t||!l)continue;let u=await Le(e),d=new Date().toISOString();try{await e.prepare(`INSERT INTO custom_models (id, name, desc_text, gender, age, mood, image_b64, created_at) VALUES (?,?,?,?,?,?,?,?)`).bind(u,t,i||t,a||`미분류`,o||`미분류`,s||`미분류`,l,d).run()}catch{await e.prepare(`INSERT INTO custom_models (id, name, desc_text, image_b64, created_at) VALUES (?,?,?,?,?)`).bind(u,t,i||t,l,d).run()}n.push({id:u,name:t,desc:i||t,gender:a||`미분류`,age:o||`미분류`,mood:s||`미분류`,createdAt:d})}return n}async function Be(e,t){return((await e.prepare(`DELETE FROM custom_models WHERE id = ?`).bind(t).run()).meta?.changes??0)>0}async function Ve(e,t){return(await e.prepare(`SELECT image_b64 FROM custom_models WHERE id = ?`).bind(t).first())?.image_b64??null}async function He(e){let{results:t}=await e.prepare(`SELECT id, name, category, bg_desc, created_at FROM custom_bgs ORDER BY created_at ASC`).all();return t.map(e=>({id:e.id,name:e.name,bgDesc:e.bg_desc,category:e.category,createdAt:e.created_at}))}async function Ue(e,t){let n=[];for(let r of t){let{name:t,bgDesc:i,category:a,imageBase64:o}=r;if(!t||!o)continue;let s=await Le(e),l=new Date().toISOString();await e.prepare(`INSERT INTO custom_bgs (id, name, category, bg_desc, image_b64, created_at) VALUES (?,?,?,?,?,?)`).bind(s,t,a||`커스텀`,i||t,o,l).run(),n.push({id:s,name:t,bgDesc:i||t,category:a||`커스텀`,createdAt:l})}return n}async function We(e,t){return((await e.prepare(`DELETE FROM custom_bgs WHERE id = ?`).bind(t).run()).meta?.changes??0)>0}async function Ge(e,t){return(await e.prepare(`SELECT image_b64 FROM custom_bgs WHERE id = ?`).bind(t).first())?.image_b64??null}var Q=[],$=[],Ke=1e3;K.post(`/api/admin/models`,J,async e=>{try{let t=await e.req.json(),n=Array.isArray(t)?t:[t];if(n.length===0)return e.json({success:!1,message:`업로드할 항목이 없습니다.`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB,a=[];if(r){let e=await X(r);for(let t of n){let{name:n,desc:i,imageBase64:o}=t;if(!n||!o)continue;let s=await Ie(r),l={id:s,name:n,desc:i||n,createdAt:new Date().toISOString()};e.push(l),await r.put(`model_img:${s}`,o),a.push(l)}await Pe(r,e)}else if(i)a=await ze(i,n);else for(let e of n){let{name:t,desc:n,imageBase64:r}=e;if(!t||!r)continue;let i=String(Ke++),o={id:i,name:t,desc:n||t,imageBase64:r,createdAt:new Date().toISOString()};Q.push(o),a.push({id:i,name:t,desc:o.desc,createdAt:o.createdAt})}return e.json({success:!0,models:a,count:a.length})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.post(`/api/admin/auto-label`,J,async e=>{try{let{type:t,imageBase64:n}=await e.req.json();if(!n)return e.json({success:!1,message:`imageBase64 필수`},400);let r=e.env?.ATLAS_API_KEY||``;if(!r)return e.json({success:!1,message:`ATLAS_API_KEY 미설정`},500);let i=`https://api.atlascloud.ai`;if(t===`model`){let t=(await(await fetch(`${i}/api/v1/model/run`,{method:`POST`,headers:{Authorization:`Bearer ${r}`,"Content-Type":`application/json`},body:JSON.stringify({model:`gpt-4o-mini`,input:{messages:[{role:`user`,content:[{type:`image_url`,image_url:{url:n.startsWith(`data:`)?n:`data:image/jpeg;base64,${n}`}},{type:`text`,text:`You are an AI fashion model classifier. Analyze this model photo and return ONLY a JSON object with these exact fields:
{
  "gender": "여성" or "남성",
  "age": "10대" or "20대" or "30대" or "40대",
  "mood": one of ["로맨틱", "보이시", "캐주얼", "시크", "내추럴"]
}
Rules:
- gender: female face/body = "여성", male = "남성"  
- age: estimate from face
- mood: overall vibe of the person/styling
Return ONLY the JSON, no explanation.`}]}]}})})).json())?.data?.id;if(!t)return e.json({success:!1,message:`라벨링 작업 시작 실패`},500);for(let n=0;n<15;n++){await new Promise(e=>setTimeout(e,1e3));let n=await fetch(`${i}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${r}`}}).then(e=>e.json()),a=n?.data?.status;if(a===`completed`||a===`succeeded`){let t=n?.data?.outputs?.[0]||n?.data?.output||``;try{let n=t.match(/\{[\s\S]*\}/),r=JSON.parse(n?.[0]||t);return e.json({success:!0,labels:{gender:r.gender||`미분류`,age:r.age||`미분류`,mood:r.mood||`미분류`}})}catch{return e.json({success:!1,message:`응답 파싱 실패`,raw:t})}}if(a===`failed`||a===`error`)break}return e.json({success:!1,message:`라벨링 타임아웃`})}else if(t===`background`){let t=(await(await fetch(`${i}/api/v1/model/run`,{method:`POST`,headers:{Authorization:`Bearer ${r}`,"Content-Type":`application/json`},body:JSON.stringify({model:`gpt-4o-mini`,input:{messages:[{role:`user`,content:[{type:`image_url`,image_url:{url:n.startsWith(`data:`)?n:`data:image/jpeg;base64,${n}`}},{type:`text`,text:`You are a fashion photography background classifier. Analyze this background image and return ONLY a JSON object:
{
  "category": one of ["스튜디오", "야외/자연", "도심/거리", "인테리어", "컨셉/특수"],
  "mood": one of ["미니멀", "내추럴", "모던", "빈티지", "럭셔리", "스트릿"],
  "name_ko": short Korean name for this background (5-10 chars)
}
Return ONLY the JSON, no explanation.`}]}]}})})).json())?.data?.id;if(!t)return e.json({success:!1,message:`라벨링 작업 시작 실패`},500);for(let n=0;n<15;n++){await new Promise(e=>setTimeout(e,1e3));let n=await fetch(`${i}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${r}`}}).then(e=>e.json()),a=n?.data?.status;if(a===`completed`||a===`succeeded`){let t=n?.data?.outputs?.[0]||n?.data?.output||``;try{let n=t.match(/\{[\s\S]*\}/),r=JSON.parse(n?.[0]||t);return e.json({success:!0,labels:{category:r.category||`스튜디오`,mood:r.mood||`미니멀`,name_ko:r.name_ko||``}})}catch{return e.json({success:!1,message:`응답 파싱 실패`,raw:t})}}if(a===`failed`||a===`error`)break}return e.json({success:!1,message:`라벨링 타임아웃`})}return e.json({success:!1,message:`type은 model 또는 background 이어야 합니다.`},400)}catch(t){return e.json({success:!1,message:t.message},500)}}),K.patch(`/api/admin/models/:id/labels`,J,async e=>{try{let t=e.req.param(`id`),{gender:n,age:r,mood:i}=await e.req.json(),a=e.env?.LOOKBOOK_DB;return a?(await a.prepare(`UPDATE custom_models SET gender=?, age=?, mood=? WHERE id=?`).bind(n||`미분류`,r||`미분류`,i||`미분류`,t).run(),e.json({success:!0})):e.json({success:!1,message:`D1 없음`},500)}catch(t){return e.json({success:!1,message:t.message},500)}}),K.get(`/api/admin/models`,J,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB;if(t){let n=await X(t);return e.json({success:!0,models:n})}if(n){let t=await Re(n);return e.json({success:!0,models:t})}let r=Q.map(e=>({id:e.id,name:e.name,desc:e.desc,createdAt:e.createdAt}));return e.json({success:!0,models:r})}),K.delete(`/api/admin/models/:id`,J,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n){let r=await X(n),i=r.filter(e=>e.id!==t);return await Pe(n,i),await n.delete(`model_img:${t}`),e.json({success:r.length>i.length})}if(r){let n=await Be(r,t);return e.json({success:n})}let i=Q.length;return Q=Q.filter(e=>e.id!==t),e.json({success:Q.length<i})}),K.get(`/api/proxy/custom-model/:id`,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB,i=null;if(i=n?await n.get(`model_img:${t}`):r?await Ve(r,t):Q.find(e=>e.id===t)?.imageBase64||null,!i)return e.notFound();let[a,o]=i.split(`,`),s=(a.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,l=atob(o),u=new Uint8Array(l.length);for(let e=0;e<l.length;e++)u[e]=l.charCodeAt(e);return new Response(u.buffer,{headers:{"Content-Type":s,"Cache-Control":`public, max-age=3600`}})}),K.post(`/api/admin/backgrounds`,J,async e=>{try{let t=await e.req.json(),n=Array.isArray(t)?t:[t];if(n.length===0)return e.json({success:!1,message:`업로드할 항목이 없습니다.`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB,a=[];if(r){let e=await Z(r);for(let t of n){let{name:n,bgDesc:i,category:o,imageBase64:s}=t;if(!n||!s)continue;let l=await Ie(r),u={id:l,name:n,bgDesc:i||n,category:o||`커스텀`,createdAt:new Date().toISOString()};e.push(u),await r.put(`bg_img:${l}`,s),a.push(u)}await Fe(r,e)}else if(i)a=await Ue(i,n);else for(let e of n){let{name:t,bgDesc:n,category:r,imageBase64:i}=e;if(!t||!i)continue;let o=String(Ke++),s={id:o,name:t,bgDesc:n||t,category:r||`커스텀`,imageBase64:i,createdAt:new Date().toISOString()};$.push(s),a.push({id:o,name:t,bgDesc:s.bgDesc,category:s.category,createdAt:s.createdAt})}return e.json({success:!0,backgrounds:a,count:a.length})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.get(`/api/admin/backgrounds`,J,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB;if(t){let n=await Z(t);return e.json({success:!0,backgrounds:n})}if(n){let t=await He(n);return e.json({success:!0,backgrounds:t})}let r=$.map(e=>({id:e.id,name:e.name,bgDesc:e.bgDesc,category:e.category,createdAt:e.createdAt}));return e.json({success:!0,backgrounds:r})}),K.delete(`/api/admin/backgrounds/:id`,J,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n){let r=await Z(n),i=r.filter(e=>e.id!==t);return await Fe(n,i),await n.delete(`bg_img:${t}`),e.json({success:r.length>i.length})}if(r){let n=await We(r,t);return e.json({success:n})}let i=$.length;return $=$.filter(e=>e.id!==t),e.json({success:$.length<i})}),K.get(`/api/proxy/custom-bg/:id`,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB,i=null;if(i=n?await n.get(`bg_img:${t}`):r?await Ge(r,t):$.find(e=>e.id===t)?.imageBase64||null,!i)return e.notFound();let[a,o]=i.split(`,`),s=(a.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,l=atob(o),u=new Uint8Array(l.length);for(let e=0;e<l.length;e++)u[e]=l.charCodeAt(e);return new Response(u.buffer,{headers:{"Content-Type":s,"Cache-Control":`public, max-age=3600`}})});var qe=e=>({Authorization:`Bearer ${e}`,"Content-Type":`application/json`});K.get(`/api/presets/models`,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB,r;r=t?await X(t):n?await Re(n):Q.map(e=>({id:e.id,name:e.name,desc:e.desc,createdAt:e.createdAt}));let i=r.map(e=>({id:Number(e.id),name:e.name,gender:e.gender||`미분류`,age:e.age||`미분류`,mood:e.mood||`미분류`,body:`-`,skin:`-`,desc:e.desc,unsplashId:null,isCustom:!0,customId:e.id}));return e.json({models:i})}),K.get(`/api/presets/backgrounds`,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB,r;r=t?await Z(t):n?await He(n):$.map(e=>({id:e.id,name:e.name,bgDesc:e.bgDesc,category:e.category,createdAt:e.createdAt}));let i=r.map(e=>({id:Number(e.id),name:e.name,category:e.category,mood:`-`,bgDesc:e.bgDesc,unsplashId:null,isCustom:!0,customId:e.id}));return e.json({backgrounds:i})}),K.get(`/api/proxy/model-image/:id`,e=>e.notFound()),K.get(`/api/proxy/bg-image/:id`,e=>e.notFound()),K.get(`/api/proxy/gen-image`,async e=>{let t=e.req.query(`url`),n=e.req.query(`download`)===`1`;if(!t)return e.json({error:`Missing url param`},400);try{if(!new URL(t).protocol.startsWith(`https`))return e.json({error:`Only HTTPS URLs allowed`},400);let r=await fetch(t,{headers:{"User-Agent":`Mozilla/5.0 (compatible; LookbookAI/1.0)`}});if(!r.ok)return e.json({error:`Upstream error: ${r.status}`},r.status);let i=await r.arrayBuffer(),a=r.headers.get(`Content-Type`)||`image/jpeg`,o=`lookbook_ai_${Date.now()}.jpg`,s={"Content-Type":a,"Cache-Control":`public, max-age=3600`,"Access-Control-Allow-Origin":`*`};return n&&(s[`Content-Disposition`]=`attachment; filename="${o}"`),new Response(i,{headers:s})}catch(t){return console.error(`Gen image proxy error:`,t),e.json({error:t.message},500)}});var Je=[{id:`p1`,name:`2024 S/S 룩북`,status:`done`,images:8,created:`2024-03-15`,thumb_color:`#FF6B9D`},{id:`p2`,name:`캐주얼 티셔츠 컷`,status:`done`,images:4,created:`2024-03-12`,thumb_color:`#6C47FF`},{id:`p3`,name:`데님 라인 촬영`,status:`processing`,images:0,created:`2024-03-10`,thumb_color:`#3B82F6`},{id:`p4`,name:`원피스 봄 컬렉션`,status:`draft`,images:0,created:`2024-03-08`,thumb_color:`#00D4AA`}];K.get(`/api/projects`,e=>e.json({projects:Je}));function Ye(){let e=new Uint8Array(32);return crypto.getRandomValues(e),Array.from(e).map(e=>e.toString(16).padStart(2,`0`)).join(``)}function Xe(){return`u_`+Ye().substring(0,16)}async function Ze(e){let t=Ye().substring(0,16),n=new TextEncoder().encode(t+e),r=await crypto.subtle.digest(`SHA-256`,n);return`${t}:${Array.from(new Uint8Array(r)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}`}async function Qe(e,t){let[n,r]=t.split(`:`),i=new TextEncoder().encode(n+e),a=await crypto.subtle.digest(`SHA-256`,i);return Array.from(new Uint8Array(a)).map(e=>e.toString(16).padStart(2,`0`)).join(``)===r}async function $e(e,t){if(!t)return null;let n=new Date().toISOString();return await e.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.status, u.credits, u.avatar_url, u.provider
    FROM user_sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.status = 'active'
  `).bind(t,n).first()||null}async function et(e,t){let n=Ye(),r=new Date(Date.now()+720*60*60*1e3).toISOString();return await e.prepare(`DELETE FROM user_sessions WHERE user_id = ? AND token NOT IN (
    SELECT token FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 4
  )`).bind(t,t).run(),await e.prepare(`INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).bind(n,t,r).run(),n}function tt(e){return{id:e.id,name:e.name,email:e.email,role:e.role,credits:e.credits,avatar_url:e.avatar_url,provider:e.provider}}K.post(`/api/auth/signup`,async e=>{try{let t=e.env.LOOKBOOK_DB,{name:n,email:r,password:i,agreeMarketing:a}=await e.req.json();if(!n||!r||!i)return e.json({success:!1,message:`모든 항목을 입력해주세요.`},400);if(i.length<8)return e.json({success:!1,message:`비밀번호는 8자 이상이어야 합니다.`},400);if(await t.prepare(`SELECT id FROM users WHERE email = ?`).bind(r).first())return e.json({success:!1,message:`이미 가입된 이메일입니다.`},409);let o=Xe(),s=await Ze(i),l=+!!a;await t.prepare(`
      INSERT INTO users (id, email, name, password_hash, provider, status, credits, role, agree_marketing)
      VALUES (?, ?, ?, ?, 'email', 'active', 1000, 'user', ?)
    `).bind(o,r.toLowerCase(),n,s,l).run();let u=await et(t,o),d={id:o,name:n,email:r.toLowerCase(),role:`user`,credits:1e3,avatar_url:null,provider:`email`};return e.json({success:!0,user:d,token:u})}catch(t){return console.error(`signup error:`,t),e.json({success:!1,message:`서버 오류가 발생했습니다.`},500)}}),K.post(`/api/auth/login`,async e=>{try{let t=e.env.LOOKBOOK_DB,{email:n,password:r}=await e.req.json();if(!n||!r)return e.json({success:!1,message:`이메일과 비밀번호를 입력해주세요.`},400);let i=await t.prepare(`SELECT * FROM users WHERE email = ? AND provider = 'email'`).bind(n.toLowerCase()).first();if(!i)return e.json({success:!1,message:`이메일 또는 비밀번호가 올바르지 않습니다.`},401);if(i.status!==`active`)return e.json({success:!1,message:`정지된 계정입니다. 관리자에게 문의하세요.`},403);if(!i.password_hash)return e.json({success:!1,message:`소셜 계정으로 가입된 이메일입니다.`},400);if(!await Qe(r,i.password_hash))return e.json({success:!1,message:`이메일 또는 비밀번호가 올바르지 않습니다.`},401);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(i.id).run();let a=await et(t,i.id);return e.json({success:!0,user:tt(i),token:a})}catch(t){return console.error(`login error:`,t),e.json({success:!1,message:`서버 오류가 발생했습니다.`},500)}}),K.get(`/api/auth/me`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await $e(t,e.req.header(`X-Session-Token`)||e.req.query(`token`)||null);return n?e.json({success:!0,user:tt(n)}):e.json({success:!1,message:`로그인이 필요합니다.`},401)}catch{return e.json({success:!1,message:`서버 오류`},500)}}),K.post(`/api/auth/logout`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`);return n&&await t.prepare(`DELETE FROM user_sessions WHERE token = ?`).bind(n).run(),e.json({success:!0})}catch{return e.json({success:!0})}});function nt(e){let t=e.req.header(`host`)||e.req.header(`x-forwarded-host`)||``;return`${t.startsWith(`localhost`)?`http`:`https`}://${t}`}K.get(`/api/auth/kakao`,e=>{let t=nt(e),n=e.req.query(`mode`)||`popup`,r=`${t}/api/auth/kakao/callback`,i=e.env.KAKAO_CLIENT_ID||``;if(!i)return n===`redirect`?e.redirect(`/?oauth_error=kakao_no_key`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'카카오 앱 키가 설정되지 않았습니다.'},'*');window.close();<\/script>`);let a=`https://kauth.kakao.com/oauth/authorize?client_id=${i}&redirect_uri=${encodeURIComponent(r)}&response_type=code&state=${n}`;return e.redirect(a)}),K.get(`/api/auth/kakao/callback`,async e=>{let t=e.env.LOOKBOOK_DB,n=nt(e),r=e.req.query(`code`),i=e.req.query(`error`),a=e.req.query(`state`)||`popup`;function o(t){return a===`redirect`?e.redirect(`/?oauth_error=${encodeURIComponent(t)}`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'${t}'},'*');window.close();<\/script>`)}if(i||!r)return o(i||`cancelled`);try{let i=`${n}/api/auth/kakao/callback`,o=await(await fetch(`https://kauth.kakao.com/oauth/token`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:new URLSearchParams({grant_type:`authorization_code`,code:r,client_id:e.env.KAKAO_CLIENT_ID||``,client_secret:e.env.KAKAO_CLIENT_SECRET||``,redirect_uri:i})})).json();if(!o.access_token)throw Error(`카카오 토큰 발급 실패`);let s=await(await fetch(`https://kapi.kakao.com/v2/user/me`,{headers:{Authorization:`Bearer ${o.access_token}`}})).json(),l=String(s.id),u=s.kakao_account?.email||`kakao_${l}@kakao.local`,d=s.kakao_account?.profile?.nickname||`카카오 사용자`,f=s.kakao_account?.profile?.profile_image_url||null,p=await t.prepare(`SELECT * FROM users WHERE provider = 'kakao' AND provider_id = ?`).bind(l).first();if(!p)if(p=await t.prepare(`SELECT * FROM users WHERE email = ?`).bind(u).first(),p)await t.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(l,f,p.id).run();else{let e=Xe();await t.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'kakao', ?, ?, 'active', 1000, 'user')`).bind(e,u,d,l,f).run(),p=await t.prepare(`SELECT * FROM users WHERE id = ?`).bind(e).first()}if(!p||p.status!==`active`)throw Error(`계정이 정지 상태입니다.`);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(p.id).run();let m=await et(t,p.id),h=JSON.stringify(tt(p));return a===`redirect`?e.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 이동합니다...</p>
<script>
(function(){
  var payload = {type:'oauth_success',provider:'kakao',token:'${m}',user:${h}};
  try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
  var pending = {};
  try { pending = JSON.parse(localStorage.getItem('oauth_redirect_pending') || '{}'); } catch(e) {}
  var dest = (pending.returnPath && pending.returnPath !== '/') ? pending.returnPath : '/';
  window.location.replace(dest);
})();
<\/script>
</body></html>`):e.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 후 창이 닫힙니다...</p>
<script>
(function() {
  var payload = {type:'oauth_success',provider:'kakao',token:'${m}',user:${h}};
  function tryClose() { try { window.close(); } catch(e) {} }
  function sendMsg() {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, '*');
        setTimeout(tryClose, 800);
      } else {
        try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
        setTimeout(tryClose, 500);
      }
    } catch(e) {
      setTimeout(tryClose, 500);
    }
  }
  if (document.readyState === 'complete') { sendMsg(); }
  else { window.addEventListener('load', sendMsg); }
})();
<\/script>
</body></html>`)}catch(e){return console.error(`kakao callback error:`,e),o(e.message||`로그인 오류`)}}),K.get(`/api/auth/google`,e=>{let t=nt(e),n=e.req.query(`mode`)||`popup`,r=`${t}/api/auth/google/callback`,i=e.env.GOOGLE_CLIENT_ID||``;if(!i)return n===`redirect`?e.redirect(`/?oauth_error=google_no_key`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'구글 클라이언트 ID가 설정되지 않았습니다.'},'*');window.close();<\/script>`);let a=new URLSearchParams({client_id:i,redirect_uri:r,response_type:`code`,scope:`openid email profile`,access_type:`offline`,prompt:`select_account`,state:n});return e.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${a}`)}),K.get(`/api/auth/google/callback`,async e=>{let t=e.env.LOOKBOOK_DB,n=nt(e),r=e.req.query(`code`),i=e.req.query(`error`),a=e.req.query(`state`)||`popup`;function o(t){return a===`redirect`?e.redirect(`/?oauth_error=${encodeURIComponent(t)}`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'${t}'},'*');window.close();<\/script>`)}if(i||!r)return o(i||`cancelled`);try{let i=`${n}/api/auth/google/callback`,o=await(await fetch(`https://oauth2.googleapis.com/token`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:new URLSearchParams({grant_type:`authorization_code`,code:r,client_id:e.env.GOOGLE_CLIENT_ID||``,client_secret:e.env.GOOGLE_CLIENT_SECRET||``,redirect_uri:i})})).json();if(!o.access_token)throw Error(`구글 토큰 발급 실패`);let s=await(await fetch(`https://www.googleapis.com/oauth2/v2/userinfo`,{headers:{Authorization:`Bearer ${o.access_token}`}})).json(),l=s.id,u=s.email,d=s.name||`구글 사용자`,f=s.picture||null,p=await t.prepare(`SELECT * FROM users WHERE provider = 'google' AND provider_id = ?`).bind(l).first();if(!p)if(p=await t.prepare(`SELECT * FROM users WHERE email = ?`).bind(u).first(),p)await t.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(l,f,p.id).run();else{let e=Xe();await t.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'google', ?, ?, 'active', 1000, 'user')`).bind(e,u,d,l,f).run(),p=await t.prepare(`SELECT * FROM users WHERE id = ?`).bind(e).first()}if(!p||p.status!==`active`)throw Error(`계정이 정지 상태입니다.`);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(p.id).run();let m=await et(t,p.id),h=JSON.stringify(tt(p));return a===`redirect`?e.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 이동합니다...</p>
<script>
(function(){
  var payload = {type:'oauth_success',provider:'google',token:'${m}',user:${h}};
  try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
  var pending = {};
  try { pending = JSON.parse(localStorage.getItem('oauth_redirect_pending') || '{}'); } catch(e) {}
  var dest = (pending.returnPath && pending.returnPath !== '/') ? pending.returnPath : '/';
  window.location.replace(dest);
})();
<\/script>
</body></html>`):e.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title></head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 후 창이 닫힙니다...</p>
<script>
(function() {
  var payload = {type:'oauth_success',provider:'google',token:'${m}',user:${h}};
  function tryClose() { try { window.close(); } catch(e) {} }
  function sendMsg() {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, '*');
        setTimeout(tryClose, 800);
      } else {
        try { localStorage.setItem('oauth_result', JSON.stringify(payload)); } catch(e) {}
        setTimeout(tryClose, 500);
      }
    } catch(e) {
      setTimeout(tryClose, 500);
    }
  }
  if (document.readyState === 'complete') { sendMsg(); }
  else { window.addEventListener('load', sendMsg); }
})();
<\/script>
</body></html>`)}catch(e){return console.error(`google callback error:`,e),o(e.message||`로그인 오류`)}}),K.get(`/api/admin/users`,J,async e=>{try{let t=e.env.LOOKBOOK_DB,n=parseInt(e.req.query(`page`)||`1`),r=parseInt(e.req.query(`limit`)||`50`),i=e.req.query(`search`)||``,a=e.req.query(`status`)||``,o=(n-1)*r,s=`WHERE 1=1`,l=[];i&&(s+=` AND (name LIKE ? OR email LIKE ?)`,l.push(`%${i}%`,`%${i}%`)),a&&(s+=` AND status = ?`,l.push(a));let u=await t.prepare(`SELECT COUNT(*) as cnt FROM users ${s}`).bind(...l).first(),d=await t.prepare(`SELECT id, name, email, provider, status, credits, role, last_login_at, created_at FROM users ${s} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...l,r,o).all();return e.json({success:!0,users:d.results,total:u?.cnt||0,page:n,limit:r})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.get(`/api/admin/users/:id`,J,async e=>{try{let t=await e.env.LOOKBOOK_DB.prepare(`SELECT id, name, email, provider, status, credits, role, last_login_at, created_at FROM users WHERE id = ?`).bind(e.req.param(`id`)).first();return t?e.json({success:!0,user:t}):e.json({success:!1,message:`존재하지 않는 사용자입니다.`},404)}catch(t){return e.json({success:!1,message:t.message},500)}}),K.patch(`/api/admin/users/:id`,J,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await e.req.json(),r=e.req.param(`id`),i=[],a=[];if(n.status!==void 0&&(i.push(`status = ?`),a.push(n.status)),n.role!==void 0&&(i.push(`role = ?`),a.push(n.role)),n.add_credits!==void 0){let o=(await t.prepare(`SELECT credits FROM users WHERE id = ?`).bind(r).first())?.credits??0,s=parseInt(n.add_credits),l=Math.max(0,o+s);return i.push(`credits = ?`),a.push(l),i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'grant', ?, ?, 'admin_grant', ?)`).bind(r,s,l,`admin_${Date.now()}`).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0,newCredits:l})}if(n.credits!==void 0){let o=(await t.prepare(`SELECT credits FROM users WHERE id = ?`).bind(r).first())?.credits??0,s=parseInt(n.credits),l=s-o;return i.push(`credits = ?`),a.push(s),i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),l!==0&&await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
           VALUES (?, ?, ?, ?, 'admin_set', ?)`).bind(r,l>0?`grant`:`deduct`,l,s,`admin_${Date.now()}`).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0,newCredits:s})}return i.length===0?e.json({success:!1,message:`변경할 항목이 없습니다.`},400):(i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0}))}catch(t){return e.json({success:!1,message:t.message},500)}}),K.delete(`/api/admin/users/:id`,J,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.param(`id`);return await t.prepare(`UPDATE users SET status = 'deleted', updated_at = datetime('now') WHERE id = ?`).bind(n).run(),await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(n).run(),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.get(`/api/admin/stats`,J,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status != 'deleted'`).first(),r=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'active'`).first(),i=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'suspended'`).first(),a=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE date(created_at) = date('now') AND status != 'deleted'`).first(),o=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'kakao' AND status = 'active'`).first(),s=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'google' AND status = 'active'`).first(),l=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'email' AND status = 'active'`).first();return e.json({success:!0,stats:{total:n?.cnt||0,active:r?.cnt||0,suspended:i?.cnt||0,today:a?.cnt||0,by_provider:{kakao:o?.cnt||0,google:s?.cnt||0,email:l?.cnt||0}}})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.get(`/api/credits/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT type, amount, balance, reason, ref_id, created_at
       FROM credit_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`).bind(r.user_id).all();return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.get(`/api/generation/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT id, seq_no, job_id, image_count, model_name, bg_name, ratio,
              image_urls, expires_at, created_at
       FROM generation_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`).bind(r.user_id).all();return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.post(`/api/generation/save-images`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let{job_id:i,image_urls:a}=await e.req.json();if(!i||!a)return e.json({error:`job_id, image_urls 필수`},400);let o=JSON.stringify(Array.isArray(a)?a:[a]),s=new Date(Date.now()+336*60*60*1e3).toISOString().replace(`T`,` `).slice(0,19);return await t.prepare(`UPDATE generation_logs
       SET image_urls = ?, expires_at = datetime('now', '+14 days')
       WHERE job_id = ? AND user_id = ?`).bind(o,i,r.user_id).run(),e.json({success:!0,expires_at:s})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.post(`/api/credits/deduct`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);let r=await t.prepare(`SELECT s.user_id, u.credits, u.name FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`,code:`UNAUTHORIZED`},401);let i=lt;if(r.credits<i)return e.json({error:`크레딧이 부족합니다. (보유: ${r.credits}크레딧, 필요: ${i}크레딧)`,code:`INSUFFICIENT_CREDITS`,available:r.credits,required:i},402);let a=r.credits-i;return await t.prepare(`UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?`).bind(a,r.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'deduct', ?, ?, 'image_download', ?)`).bind(r.user_id,-i,a,`dl_${Date.now()}`).run(),console.log(`[Credits] Download deduct: ${r.name} ${r.credits} → ${a} (-${i})`),e.json({success:!0,creditsUsed:i,creditsRemaining:a})}catch(t){return e.json({success:!1,message:t.message},500)}});var rt={pkg_20000:{amount:2e4,credits:1e3,label:`20,000원 → 1,000크레딧`},pkg_40000:{amount:4e4,credits:2300,label:`40,000원 → 2,300크레딧`},pkg_60000:{amount:6e4,credits:4e3,label:`60,000원 → 4,000크레딧`}};K.get(`/api/payments/packages`,e=>e.json({success:!0,packages:rt})),K.post(`/api/payments/prepare`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT s.user_id, u.name, u.email FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let{packageId:i}=await e.req.json(),a=rt[i];if(!a)return e.json({error:`잘못된 패키지입니다.`},400);let o=await t.prepare(`SELECT order_id FROM payment_logs
       WHERE user_id = ? AND amount = ? AND status = 'pending'
         AND created_at > datetime('now', '-5 minutes')
       ORDER BY created_at DESC LIMIT 1`).bind(r.user_id,a.amount).first();if(o?.order_id)return e.json({success:!0,orderId:o.order_id,amount:a.amount,credits:a.credits,orderName:a.label,customerName:r.name,customerEmail:r.email});let s=`lookbook-${r.user_id.slice(0,6)}-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;return await t.prepare(`INSERT INTO payment_logs (user_id, order_id, amount, credits, status)
       VALUES (?, ?, ?, ?, 'pending')`).bind(r.user_id,s,a.amount,a.credits).run(),e.json({success:!0,orderId:s,amount:a.amount,credits:a.credits,orderName:a.label,customerName:r.name,customerEmail:r.email})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.post(`/api/payments/confirm`,async e=>{try{let t=e.env.LOOKBOOK_DB,{paymentKey:n,orderId:r,amount:i}=await e.req.json();if(!n||!r||!i)return e.json({error:`paymentKey, orderId, amount 필수`},400);let a=await t.prepare(`SELECT id, user_id, amount, credits, status FROM payment_logs
       WHERE order_id = ? AND status = 'pending'`).bind(r).first();if(!a)return e.json({error:`결제 정보를 찾을 수 없거나 이미 처리되었습니다.`},404);if(Number(i)!==Number(a.amount))return e.json({error:`결제 금액이 일치하지 않습니다.`},400);let o=e.env.TOSS_SECRET_KEY||`test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R`,s=btoa(o+`:`),l=await fetch(`https://api.tosspayments.com/v1/payments/confirm`,{method:`POST`,headers:{Authorization:`Basic ${s}`,"Content-Type":`application/json`},body:JSON.stringify({paymentKey:n,orderId:r,amount:Number(i)})}),u=await l.json();if(!l.ok)return await t.prepare(`UPDATE payment_logs
         SET status='failed', toss_raw=?, paid_at=datetime('now')
         WHERE order_id=?`).bind(JSON.stringify(u),r).run(),e.json({error:u.message||`결제 승인 실패`,code:u.code},400);await t.prepare(`UPDATE payment_logs
       SET status='paid', payment_key=?, toss_method=?, toss_raw=?, paid_at=datetime('now')
       WHERE order_id=?`).bind(u.paymentKey,u.method||``,JSON.stringify(u),r).run();let d=((await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(a.user_id).first())?.credits??0)+Number(a.credits);return await t.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(d,a.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'grant', ?, ?, 'payment', ?)`).bind(a.user_id,a.credits,d,r).run(),e.json({success:!0,credits:a.credits,creditsTotal:d,method:u.method,orderId:r})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.get(`/api/payments/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT order_id, amount, credits, status, toss_method, created_at, paid_at
       FROM payment_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`).bind(r.user_id).all();return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),K.post(`/api/uploads/image`,async e=>{try{let t=(await e.req.formData()).get(`file`);if(!t)return e.json({success:!1,message:`파일이 없습니다.`},400);let n=await t.arrayBuffer(),r=btoa(String.fromCharCode(...new Uint8Array(n))),i=`data:${t.type||`image/jpeg`};base64,${r}`;return e.json({success:!0,imageId:`img_`+Math.random().toString(36).substr(2,9),url:i,dataUrl:i})}catch(t){return e.json({success:!1,message:t.message},500)}});function it(e){return{"1:1":`1:1`,"4:5":`4:5`,"3:4":`3:4`,"9:16":`9:16`}[e]||`3:4`}function at(e){return e===`4K`?`4k`:e===`HD`?`2k`:`1k`}K.post(`/api/clothing/classify`,async e=>{try{let t=(await e.req.json()).images||[];if(t.length===0)return e.json({success:!1,message:`이미지가 없습니다.`},400);await Promise.all(t.map(async({dataUrl:t,index:n})=>{try{let r=[`Analyze this clothing item image and classify it into EXACTLY ONE of these categories:`,`TOP — shirts, t-shirts, blouses, crop tops, hoodies (without coat), sweaters, knits, vests worn as tops`,`BOTTOM — pants, trousers, jeans, skirts, shorts, leggings`,`OUTER — coats, jackets, blazers, cardigans worn as outerwear, parkas, windbreakers, leather jackets, denim jackets`,`DRESS — one-piece dresses, jumpsuits, overalls that cover both top and bottom`,`UNKNOWN — if cannot determine`,`Respond in EXACTLY this JSON format only, no other text:`,`{"category":"TOP","label":"white button-down shirt","confidence":0.95}`].join(` `),i=await(await fetch(`${q}/api/v1/model/generateImage`,{method:`POST`,headers:qe(e.env.ATLAS_API_KEY),body:JSON.stringify({model:`google/nano-banana-2/edit`,prompt:r,images:[t],aspect_ratio:`1:1`,resolution:`1k`,thinking_level:`default`,output_format:`jpeg`})})).json();if(console.log(`Classify atlas response code:`,i.code),i.code===200&&i.data?.id){let t=i.data.id;for(let n=0;n<10;n++){await new Promise(e=>setTimeout(e,1500));let n=(await fetch(`${q}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json())).data?.status;if(n===`completed`||n===`succeeded`||n===`failed`||n===`error`)break}}return{index:n,category:`UNRESOLVED`,label:``,confidence:0}}catch{return{index:n,category:`UNKNOWN`,label:``,confidence:0}}}));let n=await Promise.all(t.map(async({dataUrl:e,index:t})=>ot(e,t)));return console.log(`Classify results:`,n.map(e=>`[${e.index}]${e.category}`).join(`, `)),e.json({success:!0,items:n})}catch(t){return console.error(`Classify error:`,t),e.json({success:!1,message:t.message},500)}});async function ot(e,t){try{let n=await(await fetch(`${q}/api/v1/model/generateImage`,{method:`POST`,headers:qe(c.env.ATLAS_API_KEY),body:JSON.stringify({model:`google/nano-banana-2`,prompt:[`CLASSIFICATION TASK. Look at this clothing item.`,`Output ONLY ONE WORD: TOP or BOTTOM or OUTER or DRESS`,`TOP = shirt/tshirt/blouse/sweater/hoodie/knit/vest`,`BOTTOM = pants/jeans/skirt/shorts/leggings`,`OUTER = coat/jacket/blazer/cardigan/parka`,`DRESS = one-piece dress/jumpsuit`].join(` `),images:[e],aspect_ratio:`1:1`,resolution:`1k`,thinking_level:`low`,output_format:`jpeg`})})).json();if(n.code===200&&n.data?.id){let e=n.data.id;for(let t=0;t<8;t++){await new Promise(e=>setTimeout(e,1500));let t=await fetch(`${q}/api/v1/model/prediction/${e}`,{headers:{Authorization:`Bearer ${c.env.ATLAS_API_KEY}`}}).then(e=>e.json());if(t.data?.status===`completed`||t.data?.status===`succeeded`||t.data?.status===`failed`||t.data?.status===`error`)break}}let r=e.split(`,`)[1]||``;return Math.floor(r.length*.75),{index:t,category:`TOP`,label:`clothing item`,confidence:.5}}catch{return{index:t,category:`TOP`,label:`clothing item`,confidence:.3}}}function st(e,t){let n=[];return e.forEach((e,r)=>{let i=t+r,a={TOP:`TOP GARMENT (shirt/blouse/sweater/jacket-top)`,BOTTOM:`BOTTOM GARMENT (pants/skirt/shorts)`,OUTER:`OUTER LAYER (coat/jacket/cardigan)`,DRESS:`FULL OUTFIT (dress/jumpsuit — covers both top and bottom)`,UNKNOWN:`CLOTHING ITEM`}[e.category]||`CLOTHING ITEM`;n.push(`Image ${i} = ${a}${e.label?` — ${e.label}`:``}.`)}),n.join(` `)}function ct(e,t){let n=[],r=e.map(e=>e.category),i=r.includes(`DRESS`),a=r.includes(`TOP`),o=r.includes(`BOTTOM`),s=r.includes(`OUTER`);if(i){let r=e.findIndex(e=>e.category===`DRESS`);n.push(`Replace the ENTIRE outfit (top and bottom) with Image ${t+r}'s full dress/jumpsuit. Reproduce every design detail exactly.`)}else{if(a){let r=e.findIndex(e=>e.category===`TOP`);n.push(`Replace ONLY the TOP garment with Image ${t+r}'s item. Exact color, pattern, texture, neckline, sleeve length.`)}if(o){let r=e.findIndex(e=>e.category===`BOTTOM`);n.push(`Replace ONLY the BOTTOM garment with Image ${t+r}'s item. Exact color, pattern, waistband, length, cut.`)}if(s){let r=e.findIndex(e=>e.category===`OUTER`);n.push(`Add/replace the OUTER LAYER (coat/jacket) with Image ${t+r}'s item worn over the other clothing. Exact lapels, buttons, length.`)}}return i||(a||n.push(`Keep the original TOP garment EXACTLY unchanged — do NOT modify it.`),o||n.push(`Keep the original BOTTOM garment EXACTLY unchanged — do NOT modify it.`),s||n.push(`Remove any outer layer if present, or keep it minimal.`)),n.join(` `)}var lt=90;K.post(`/api/generation/start`,async e=>{try{let{modelId:t,modelName:n=`패션 모델`,modelDesc:r=`young Asian female fashion model, slim figure, natural look`,bgId:i,bgName:a=`스튜디오`,bgDesc:o=`clean white studio background with professional lighting`,poseType:s=`전신`,pose:l=`정면`,ratio:u=`3:4`,resolution:d=`HD`,count:f=4,clothingImageUrl:p,clothingImages:m}=await e.req.json(),h=e.env?.LOOKBOOK_DB,g=null;if(h){let t=e.req.header(`X-Session-Token`)||``;if(t){let e=await h.prepare(`SELECT s.user_id, u.name, u.credits FROM user_sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(t).first();e&&(g=e)}if(!g)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);console.log(`[Generation] ${g.name} started generation (credits: ${g.credits})`)}let _=it(u),v=at(d);console.log(`Model ID:`,t,`| BG ID:`,i),console.log(`Ratio:`,_,`| Resolution:`,v),console.log(`Clothing:`,p?p.substring(0,60)+`...`:`none`);let y={전신:`full body shot`,반신:`half body shot`,상반신:`upper body shot`},b={정면:`facing camera, natural standing pose`,측면:`3/4 angle, elegant slight turn`,워킹:`dynamic walking pose, confident stride`,정적:`elegant static pose, hands relaxed at sides`},x=y[s]||`full body shot`,S=b[l]||`natural standing pose`,C=null,w=null,T=e.env?.LOOKBOOK_KV;if(t){let e=String(t);if(T){let t=await T.get(`model_img:${e}`);t&&(C=t,console.log(`KV custom model: OK`))}else if(h){let t=await Ve(h,e);t&&(C=t,console.log(`D1 custom model: OK`))}else{let t=Q.find(t=>t.id===e);t?.imageBase64&&(C=t.imageBase64,console.log(`Mem custom model: OK`))}C||console.log(`Custom model image not found for id:`,e)}if(i){let e=String(i);if(T){let t=await T.get(`bg_img:${e}`);t&&(w=t,console.log(`KV custom bg: OK`))}else if(h){let t=await Ge(h,e);t&&(w=t,console.log(`D1 custom bg: OK`))}else{let t=$.find(t=>t.id===e);t?.imageBase64&&(w=t.imageBase64,console.log(`Mem custom bg: OK`))}w||console.log(`Custom bg image not found for id:`,e)}let E=[`ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:`,`1. DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image.`,`2. DO NOT alter the model's facial geometry, facial bone structure, eye shape, nose shape, lip shape, or hair style. NOTE: skin brightness and color temperature MAY be adjusted to match the scene's lighting — this is required for natural integration.`,`3. DO NOT change, redesign, or substitute ANY detail of the clothing: color, pattern, print, texture, collar, neckline, sleeve length, hem, buttons, zippers, pockets, or stitching must be reproduced EXACTLY as shown in the reference.`,`4. NO watermarks. NO overlaid captions. NO decorative text. NO brand insignia added by AI.`,`Ultra-photorealistic, 8K quality, professional fashion editorial, magazine cover quality.`].join(` `),D=[];Array.isArray(m)&&m.length>0?D=m.filter(e=>e?.dataUrl?.startsWith(`data:`)):p&&p.startsWith(`data:`)&&(D=[{dataUrl:p,category:`TOP`,label:`clothing item`}]),console.log(`Clothing items:`,D.map(e=>`[${e.category}]`).join(`, `)||`none`),console.log(`Model ID:`,t,`| BG ID:`,i);let O=[],ee=[`DRESS`,`TOP`,`BOTTOM`,`OUTER`,`UNKNOWN`],k=[...D].sort((e,t)=>ee.indexOf(e.category)-ee.indexOf(t.category));k.forEach(e=>O.push(e.dataUrl));let A=k.length,j=A+1,M=A+ +!!C+1;C&&O.push(C),w&&O.push(w),console.log(`images 배열: 의류${A}장 | 모델${+!!C}장 | 배경${+!!w}장 | 총${O.length}장`);let N=``,P=!!w,F=!!C,I=A>0;if(I&&F&&P){console.log(`[단일 단계] 의상+얼굴+신원 통합 합성 시작`);let e=st(k.map(e=>({...e})),1),t=ct(k,1);N=[`COMPLETE FASHION LOOKBOOK SYNTHESIS — clothing replacement + identity swap in a single pass.`,e,`Image ${j} = IDENTITY DONOR. Extract: facial geometry (jawline, eye socket, nose, lips, cheekbones), eye details (shape/iris/lash), hair (color/volume/cut/style), and full-body skin undertone (hue + warmth + texture). DO NOT use body shape, clothing, or pose from this image.`,`Image ${M} = SCENE ANCHOR. This scene defines: background environment, all objects, scene lighting direction/color-temperature/intensity, color grade, and mood. LOCKED: background, all scene objects.`,`CLOTHING REPLACEMENT:`,t,`Body pose may shift slightly so the new clothing fits naturally (minor arm/stance adjustments only).`,`IDENTITY & FACE TRANSPLANT (from Image ${j}):`,`  · Transplant the FACIAL GEOMETRY exactly: jawline, cheekbone position, eye socket shape, nose bridge/tip, lip shape, overall facial proportions.`,`  · Transplant EYE DETAILS exactly: eye shape, lid type, iris color, lash density.`,`  · Transplant HAIR exactly: color (root-to-tip gradient), volume, texture, cut, style.`,`  · Apply the skin UNDERTONE (warm/cool/neutral base hue) from Image ${j} to ALL exposed skin uniformly — face, neck, décolletage, shoulders, arms, hands — ZERO tone mismatch across the body.`,`SCENE LIGHTING INTEGRATION (from Image ${M} — critical for photorealism):`,`  Re-light ALL elements (clothing, face, skin) under Image ${M}'s physical lighting environment:`,`  · BRIGHTNESS: Match face and skin brightness to the scene's ambient light level. Bright scene → bright face; moody/dim scene → face lit accordingly.`,`  · LIGHT DIRECTION: Apply the scene's key light direction. Highlights land on the correct side of the face (forehead, cheekbone, nose bridge), shadows fall on the opposite side.`,`  · COLOR TEMPERATURE: Tint face, skin, and clothing under the scene's color temperature (warm golden-hour tint, cool blue shade, neutral studio white, etc.). Do NOT render any element under a different white balance from the scene.`,`  · SHADOW QUALITY: Hard shadows in direct sunlight; soft wrap-around shadows in diffuse/cloudy/studio light — match the scene exactly.`,`  · CATCH-LIGHTS: Eyes must reflect Image ${M}'s light source position and shape.`,`  · FABRIC RENDERING: Simulate specular highlights on shiny fabrics, soft diffuse on matte, translucency on thin materials — all under the scene's light.`,`  · SUBSURFACE SCATTERING: Realistic skin SSS under scene light (warm ears/nose in backlit; strong SSS in diffuse light).`,`  · FACE-TO-NECK SEAM: The face-to-neck boundary must be seamless — same lighting falloff, same color temperature, no hard edge or tone jump.`,`  · HAIR INTEGRATION: Hair receives the scene's ambient + key light. Rim/backlight if present in the scene. Flyaways lit naturally.`,`FINAL OUTPUT: One seamless, ultra-photorealistic fashion photograph. The new clothing is worn by Image ${j}'s identity — face, hair, and full-body skin re-lit under Image ${M}'s scene. Result looks like this person was photographed in the original scene wearing the specified outfit — zero compositing artifacts.`,`8K resolution, magazine editorial quality.`,E].join(` `)}else if(I&&F&&!P){let e=st(k.map(e=>({...e})),1),t=ct(k,1);N=[`Create a hyper-realistic professional fashion lookbook photograph.`,e,`Image ${j} = MODEL IDENTITY — preserve this exact person's face, hair, skin tone, body proportions exactly.`,t,`Show a ${x}, ${S}.`,`Background: ${o} (${a}). Create a photorealistic environment. Integrate the model naturally with correct lighting and shadows.`,E].join(` `)}else if(I&&!F&&P){let e=st(k.map(e=>({...e})),1),t=ct(k,1);N=[`You are doing a CLOTHING SWAP on a fashion background scene.`,e,`Image ${M} = SOURCE BACKGROUND SCENE containing a person. Keep the scene and person EXACTLY as-is — same face, same pose, same stance, same body position.`,t,`FINAL RESULT: Same scene, same person, same pose — only the specified clothing items are replaced. Natural lighting, seamless integration.`,E].join(` `)}else if(I&&!F&&!P){let e=st(k.map(e=>({...e})),1),t=ct(k,1);N=[`Create a hyper-realistic professional fashion lookbook photograph.`,e,`Model: ${r}. Show in a ${x}, ${S}.`,t,`Background: ${o} (${a}). Photorealistic environment with correct lighting and shadows.`,E].join(` `)}else N=[`Ultra-photorealistic professional fashion photography.`,`A ${r} fashion model, ${x}, ${S}.`,`Background: ${o} (${a}). Natural lighting, seamless scene integration.`,`8K resolution, Canon EOS R5, professional lighting, hyperrealistic skin texture, perfect fabric detail, commercial fashion editorial, magazine quality.`,E].join(` `);try{Y=await dt(e.env.LOOKBOOK_DB)}catch{}N=Ne(N),console.log(`Prompt (first 300):`,N.substring(0,300)),console.log(`images count:`,O.length,`| mode:`,O.length>=3?`FULL(clothing+model+bg)`:O.length===2?`PARTIAL`:O.length===1?`CLOTHING_ONLY`:`TEXT`);let L={model:`google/nano-banana-2/edit`,prompt:N,aspect_ratio:_,resolution:v,thinking_level:`default`,output_format:`jpeg`};O.length>0&&(L.images=O),console.log(`Final prompt (first 300):`,N.substring(0,300)),console.log(`Atlas request → model:`,L.model,`| images:`,O.length,`| aspect_ratio:`,_,`| resolution:`,v,`| jobs:`,1);let te=Array.from({length:1},()=>fetch(`${q}/api/v1/model/generateImage`,{method:`POST`,headers:qe(e.env.ATLAS_API_KEY),body:JSON.stringify(L)}).then(e=>e.json())),R=await Promise.all(te);console.log(`Atlas responses:`,R.map(e=>`${e.code}:${e.data?.id}`).join(`, `));let z=R.filter(e=>e.code===200&&e.data?.id).map(e=>e.data.id);if(z.length===0){let t=R[0];console.error(`All Atlas requests failed:`,t);let n=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:n,estimatedSeconds:5,status:`queued`,isFallback:!0,error:t?.msg||t?.message||`Atlas API error`})}let ne=z.join(`,`);if(h&&g)try{let e=((await h.prepare(`SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`).bind(g.user_id).first())?.last_seq||0)+1;await h.prepare(`INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+14 days'))`).bind(g.user_id,ne,f,n||`패션 모델`,a||`스튜디오`,u||`3:4`,e).run(),console.log(`[GenLog] seq_no=${e} 기록 완료`)}catch(e){console.warn(`[GenLog] 생성 내역 기록 실패 (무시):`,e)}return e.json({jobId:ne,estimatedSeconds:30,status:`queued`,isFallback:!1})}catch(t){console.error(`Generation start error:`,t);let n=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:n,estimatedSeconds:5,status:`queued`,isFallback:!0,error:t.message})}}),K.get(`/api/generation/:jobId/status`,async e=>{let t=e.req.param(`jobId`);if(t.startsWith(`fallback_`)){let t=ut(4);return e.json({status:`completed`,progress:100,images:t,isFallback:!0})}let n=t.split(`,`).filter(Boolean);try{let t=await Promise.all(n.map(t=>fetch(`${q}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json())));console.log(`Poll statuses:`,t.map(e=>`${e.data?.id?.substring(0,8)}:${e.data?.status}`).join(`, `));let r=new Set([`completed`,`succeeded`,`failed`,`timeout`,`canceled`,`error`]),i=t.every(e=>r.has(e.data?.status));if(t.some(e=>!r.has(e.data?.status)),!i){let n=t.filter(e=>r.has(e.data?.status)).length,i=t.length,a=Math.round(20+n/i*60);return e.json({status:`processing`,progress:a,images:[]})}let a=[];if(t.forEach((e,t)=>{let n=e.data?.status,r=e.data?.outputs??e.data?.output??e.data?.images??e.data?.result??null,i=Array.isArray(r)?r.filter(e=>typeof e==`string`&&e.startsWith(`http`)):typeof r==`string`&&r.startsWith(`http`)?[r]:[];console.log(`Job ${t} status:${n} urls:`,i),(n===`completed`||n===`succeeded`)&&i.length>0&&i.forEach((e,t)=>{a.push({id:`result_${a.length+1}`,url:e,title:`AI 피팅컷 #${a.length+1}`})})}),a.length===0){console.error(`All jobs failed:`,t.map(e=>e.data?.status).join(`, `));let n=ut(4);return e.json({status:`completed`,progress:100,images:n,isFallback:!0,error:`All jobs failed`})}return e.json({status:`completed`,progress:100,images:a,isFallback:!1})}catch(t){console.error(`Poll error:`,t);let n=ut(4);return e.json({status:`completed`,progress:100,images:n,isFallback:!0,error:t.message})}});function ut(e){let t=[[`#FF6B9D`,`#FF8C42`],[`#6C47FF`,`#00D4AA`],[`#FF6B9D`,`#6C47FF`],[`#F59E0B`,`#EF4444`]];return Array.from({length:e},(e,n)=>({id:`placeholder_${n+1}`,url:null,placeholder:!0,gradient:`linear-gradient(135deg, ${t[n%t.length][0]}, ${t[n%t.length][1]})`,title:`AI 피팅컷 #${n+1}`,width:832,height:1216}))}async function dt(e){try{let t=await e.prepare(`SELECT value FROM app_settings WHERE key = 'admin_prompt_config'`).first();if(t?.value){let e=JSON.parse(t.value);return{enabled:typeof e.enabled==`boolean`?e.enabled:Y.enabled,prefix:typeof e.prefix==`string`?e.prefix:Y.prefix,suffix:typeof e.suffix==`string`?e.suffix:Y.suffix,styleGuide:typeof e.styleGuide==`string`?e.styleGuide:Y.styleGuide,technicalSpec:typeof e.technicalSpec==`string`?e.technicalSpec:Y.technicalSpec,updatedAt:e.updatedAt||Y.updatedAt}}}catch(e){console.warn(`d1GetPromptConfig fallback to memory:`,e)}return Y}async function ft(e,t){await e.prepare(`INSERT INTO app_settings (key, value, updated_at) VALUES ('admin_prompt_config', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(JSON.stringify(t)).run()}K.get(`/api/admin/prompt`,J,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await dt(t);return e.json({success:!0,config:n})}catch{return e.json({success:!0,config:Y})}}),K.put(`/api/admin/prompt`,J,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await e.req.json(),r=await dt(t),i={enabled:typeof n.enabled==`boolean`?n.enabled:r.enabled,prefix:typeof n.prefix==`string`?n.prefix:r.prefix,suffix:typeof n.suffix==`string`?n.suffix:r.suffix,styleGuide:typeof n.styleGuide==`string`?n.styleGuide:r.styleGuide,technicalSpec:typeof n.technicalSpec==`string`?n.technicalSpec:r.technicalSpec,updatedAt:new Date().toISOString()};return await ft(t,i),Y=i,console.log(`Admin prompt config saved to D1:`,i.updatedAt),e.json({success:!0,config:i})}catch(t){return e.json({success:!1,message:t.message},400)}}),K.post(`/api/admin/auth`,async e=>{let t=await e.req.json(),n=e.env.ADMIN_PASSWORD;return n?t.password===n?e.json({success:!0}):e.json({success:!1,message:`비밀번호가 올바르지 않습니다.`},401):e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500)});var pt=(e,t)=>`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${e} | AI Fashion Lookbook Studio</title>
  <meta name="description" content="의류 이미지 하나로 AI 온모델 피팅컷과 룩북 세트를 자동 생성하세요." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="/static/style.css?v=${Me}" rel="stylesheet" />
  <!-- app.js는 head에 defer — body 인라인 script보다 항상 먼저 파싱·실행됨 -->
  <script src="/static/app.js?v=${Me}" defer><\/script>
</head>
<body>
${t}

<!-- ── 크레딧 충전 패널 (모든 페이지 공통) ── -->
<div id="chargePanel" style="display:none;position:fixed;inset:0;background:#0d0d1a;z-index:9000;overflow-y:auto;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px 80px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <button onclick="closeChargePanel()" style="width:36px;height:36px;border:none;background:#2a2a45;border-radius:50%;color:#e0e0f0;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">‹</button>
      <h2 style="font-size:18px;font-weight:700;color:#f0f0f8;margin:0;">크레딧 충전</h2>
    </div>
    <div style="background:linear-gradient(135deg,#1e1e35,#252545);border:1px solid rgba(108,71,255,0.3);border-radius:16px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:12px;color:#8b8ba0;margin-bottom:4px;">현재 보유 크레딧</div>
        <div id="chargePanelCredits" style="font-size:28px;font-weight:800;color:#a78bfa;">-</div>
      </div>
      <div style="font-size:32px;opacity:0.5;">💎</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">
      <div class="pkg-card" onclick="selectPackage('pkg_20000',this)" data-pkg="pkg_20000"
           style="background:linear-gradient(135deg,#1a1a2e,#252545);border:2px solid #3a3a60;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#f0f0f8;margin-bottom:4px;">1,000 크레딧</div>
            <div style="font-size:13px;color:#8b8ba0;">이미지 <strong style="color:#a78bfa;">11장</strong> 다운로드 가능</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#6c47ff;">20,000원</div>
          </div>
        </div>
      </div>
      <div class="pkg-card" onclick="selectPackage('pkg_40000',this)" data-pkg="pkg_40000"
           style="background:linear-gradient(135deg,#1e1435,#2a1a50);border:2px solid #6c47ff;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;position:relative;">
        <div style="position:absolute;top:0;right:20px;background:linear-gradient(135deg,#6c47ff,#a855f7);color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:0 0 8px 8px;">인기</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#f0f0f8;margin-bottom:4px;">2,300 크레딧</div>
            <div style="font-size:13px;color:#8b8ba0;">이미지 <strong style="color:#a78bfa;">25장</strong> 다운로드 가능</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:4px;">✨ 기본 대비 15% 더 받기</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#6c47ff;">40,000원</div>
          </div>
        </div>
      </div>
      <div class="pkg-card" onclick="selectPackage('pkg_60000',this)" data-pkg="pkg_60000"
           style="background:linear-gradient(135deg,#1a1a2e,#252545);border:2px solid #3a3a60;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#f0f0f8;margin-bottom:4px;">4,000 크레딧</div>
            <div style="font-size:13px;color:#8b8ba0;">이미지 <strong style="color:#a78bfa;">44장</strong> 다운로드 가능</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:4px;">🚀 기본 대비 33% 더 받기</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#6c47ff;">60,000원</div>
          </div>
        </div>
      </div>
    </div>
    <button id="chargeCta" onclick="startPayment()"
            style="width:100%;padding:16px;background:linear-gradient(135deg,#6c47ff,#a855f7);border:none;border-radius:16px;color:white;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;opacity:0.5;pointer-events:none;transition:all 0.2s;">
      <i class="fas fa-credit-card"></i>
      <span id="ctaLabel">패키지를 선택하세요</span>
    </button>

  </div>
</div>

</body>
</html>`;K.get(`/terms`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>서비스 이용약관 - LookbookAI Studio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.8; }
    h1 { font-size: 28px; border-bottom: 2px solid #eee; padding-bottom: 16px; }
    h2 { font-size: 18px; margin-top: 32px; color: #111; }
    p, li { font-size: 15px; color: #444; }
    .date { color: #888; font-size: 14px; margin-bottom: 32px; }
    a { color: #6c5ce7; }
  </style>
</head>
<body>
  <h1>서비스 이용약관</h1>
  <p class="date">시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 1일</p>

  <h2>제1조 (목적)</h2>
  <p>본 약관은 LookbookAI Studio(이하 "서비스")가 제공하는 AI 패션 룩북 생성 서비스의 이용에 관한 조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

  <h2>제2조 (정의)</h2>
  <p>① "서비스"란 LookbookAI Studio가 제공하는 AI 기반 패션 이미지 생성 플랫폼을 의미합니다.</p>
  <p>② "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</p>
  <p>③ "크레딧"이란 서비스 내 AI 이미지 생성에 사용되는 가상 화폐를 의미합니다.</p>

  <h2>제3조 (약관의 효력 및 변경)</h2>
  <p>① 본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
  <p>② 서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일 이내에 효력이 발생합니다.</p>

  <h2>제4조 (서비스 이용)</h2>
  <p>① 이용자는 본 약관에 동의함으로써 서비스를 이용할 수 있습니다.</p>
  <p>② 서비스는 AI를 활용한 패션 이미지 생성 기능을 제공합니다.</p>
  <p>③ 이용자는 서비스 이용 시 관련 법령을 준수해야 합니다.</p>

  <h2>제5조 (이용자의 의무)</h2>
  <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
  <ul>
    <li>타인의 권리를 침해하는 방식으로 서비스를 이용하는 행위</li>
    <li>불법적인 콘텐츠를 생성하거나 유포하는 행위</li>
    <li>서비스의 정상적인 운영을 방해하는 행위</li>
    <li>다른 이용자의 개인정보를 무단으로 수집·이용하는 행위</li>
  </ul>

  <h2>제6조 (서비스 변경 및 중단)</h2>
  <p>서비스는 운영상 필요한 경우 서비스 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.</p>

  <h2>제7조 (면책조항)</h2>
  <p>① 서비스는 AI가 생성한 콘텐츠의 정확성, 완전성에 대해 보증하지 않습니다.</p>
  <p>② 서비스는 이용자의 귀책사유로 인한 손해에 대해 책임을 지지 않습니다.</p>

  <h2>제8조 (분쟁 해결)</h2>
  <p>본 약관과 관련한 분쟁은 대한민국 법률을 적용하며, 관할 법원은 민사소송법에 따릅니다.</p>

  <p style="margin-top:40px; color:#888; font-size:13px;">문의: <a href="mailto:kim4honey@gmail.com">kim4honey@gmail.com</a></p>
</body>
</html>`)),K.get(`/privacy`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보처리방침 - LookbookAI Studio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.8; }
    h1 { font-size: 28px; border-bottom: 2px solid #eee; padding-bottom: 16px; }
    h2 { font-size: 18px; margin-top: 32px; color: #111; }
    p, li { font-size: 15px; color: #444; }
    .date { color: #888; font-size: 14px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; font-size: 14px; text-align: left; }
    th { background: #f5f5f5; }
    a { color: #6c5ce7; }
  </style>
</head>
<body>
  <h1>개인정보처리방침</h1>
  <p class="date">시행일: 2025년 1월 1일 | 최종 수정일: 2025년 1월 1일</p>

  <p>LookbookAI Studio(이하 "서비스")는 이용자의 개인정보를 소중히 여기며, 개인정보 보호법 등 관련 법령을 준수합니다.</p>

  <h2>1. 수집하는 개인정보 항목</h2>
  <table>
    <tr><th>수집 항목</th><th>수집 목적</th><th>보유 기간</th></tr>
    <tr><td>이메일, 닉네임, 프로필 사진</td><td>회원가입 및 서비스 이용</td><td>회원 탈퇴 시까지</td></tr>
    <tr><td>서비스 이용 기록</td><td>서비스 개선 및 분석</td><td>1년</td></tr>
  </table>

  <h2>2. 개인정보 수집 방법</h2>
  <p>카카오 로그인, Google 로그인, 이메일 직접 가입을 통해 수집합니다.</p>

  <h2>3. 개인정보 이용 목적</h2>
  <ul>
    <li>회원 식별 및 서비스 제공</li>
    <li>AI 이미지 생성 서비스 운영</li>
    <li>고객 문의 응대</li>
    <li>서비스 개선 및 신규 기능 개발</li>
  </ul>

  <h2>4. 개인정보 제3자 제공</h2>
  <p>서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 요청이 있는 경우는 예외로 합니다.</p>

  <h2>5. 개인정보 보유 및 이용 기간</h2>
  <p>회원 탈퇴 시 즉시 삭제하며, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관 후 삭제합니다.</p>

  <h2>6. 이용자의 권리</h2>
  <p>이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.</p>

  <h2>7. 개인정보 보호책임자</h2>
  <p>이메일: <a href="mailto:kim4honey@gmail.com">kim4honey@gmail.com</a></p>

  <h2>8. 개인정보 처리방침 변경</h2>
  <p>본 방침은 법령·정책 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지합니다.</p>
</body>
</html>`)),K.get(`/_home_old`,e=>e.redirect(`/generator`,302)),K.get(`/`,e=>{let t=e.req.header(`host`)||``;return t.includes(`studiob.aifashion.co.kr`)?e.redirect(`/generator`,302):t===`www.aifashion.co.kr`||t===`aifashion.co.kr`?e.redirect(`https://studiob.aifashion.co.kr`,302):e.html(pt(`홈`,`
  <!-- Toast Container -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- Navbar -->
  <nav id="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">
        <div class="logo-icon">✨</div>
        <span>LookbookAI</span>
      </a>
      <div class="navbar-nav">
        <a href="#features">기능</a>
        <a href="#how-it-works">이용방법</a>
        <a href="#pricing">요금제</a>
        <a href="/dashboard">대시보드</a>
      </div>
      <div class="navbar-actions" style="position:relative;">
        <button class="btn btn-ghost" id="navLoginBtn" onclick="openModal('loginModal')">로그인</button>
        <button class="btn btn-primary" id="navSignupBtn" onclick="switchAuthTab('signup');openModal('loginModal')">무료 시작</button>
        <!-- 로그인 후 프로필 아이콘만 표시 -->
        <div id="navUserArea" style="display:none;align-items:center;gap:0;position:relative;">
          <span id="navUserCredits" style="display:none;"></span>
          <span id="navUserName" style="display:none;"></span>
          <div id="navUserAvatar" onclick="toggleUserMenu()" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:15px;font-weight:700;cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(108,71,255,0.4);">?</div>
          <!-- 드롭다운 -->
          <div id="userDropdownMenu" style="display:none;position:absolute;top:44px;right:0;background:#1e1e35;border:1px solid #3a3a60;border-radius:16px;padding:6px;min-width:220px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:2000;">
            <div style="padding:12px 14px 10px;border-bottom:1px solid #3a3a60;margin-bottom:4px;">
              <div id="ddUserName" style="font-size:14px;font-weight:700;color:#f0f0f8;margin-bottom:2px;"></div>
              <div id="ddUserEmail" style="font-size:12px;color:#8b8ba0;margin-bottom:6px;"></div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div id="ddUserCredits" style="font-size:13px;font-weight:600;color:#6c47ff;"></div>
                <button onclick="openChargePanel();toggleUserMenu();" style="font-size:11px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;">충전</button>
              </div>
            </div>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:10px 14px;font-size:14px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''">로그아웃</button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section id="hero">
    <div class="hero-bg-grid"></div>
    <div class="hero-glow-1"></div>
    <div class="hero-glow-2"></div>
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-tag">
          <i class="fas fa-sparkles"></i>
          AI 패션 이미지 자동화 플랫폼
        </div>
        <h1 class="hero-title">
          옷 사진 한 장으로<br />
          <span class="highlight">AI 룩북 완성</span>
        </h1>
        <p class="hero-desc">
          촬영 없이도 전문 모델 피팅컷과 고품질 룩북을 즉시 제작하세요.<br />
          스튜디오 비용 제로, 결과물은 프로급.
        </p>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-num">95%</div>
            <div class="hero-stat-label">생성 성공률</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-num">30초</div>
            <div class="hero-stat-label">평균 생성 시간</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-num">50K+</div>
            <div class="hero-stat-label">생성된 이미지</div>
          </div>
        </div>
        <div class="hero-cta">
          <button class="btn btn-primary btn-lg" onclick="openModal('signupModal')">
            <i class="fas fa-bolt"></i>
            무료로 시작하기
          </button>
          <a href="#how-it-works" class="btn btn-ghost btn-lg" style="color:#A0A0C0; border: 2px solid rgba(255,255,255,0.2);">
            <i class="fas fa-play-circle"></i>
            작동 방식 보기
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-showcase">
          <div class="showcase-card">
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#FF6B9D,#FF8C42);display:flex;align-items:center;justify-content:center;font-size:72px;">👗</div>
            <div class="showcase-badge">원본 의류</div>
          </div>
          <div class="showcase-card">
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#6C47FF,#00D4AA);display:flex;align-items:center;justify-content:center;font-size:72px;">🧍‍♀️</div>
            <div class="showcase-badge">AI 생성 피팅컷</div>
          </div>
          <div class="showcase-card" style="grid-column:span 2;aspect-ratio:16/9;margin-top:0">
            <div style="width:100%;height:100%;background:linear-gradient(135deg,#1A1A3E,#6C47FF);display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;padding:20px;">
              <span style="font-size:48px;">👗</span><span style="font-size:32px;color:#A78BFF;">→</span><span style="font-size:48px;">🧍‍♀️</span><span style="font-size:32px;color:#A78BFF;">→</span><span style="font-size:48px;">📸</span>
            </div>
            <div class="showcase-badge">스타일샷 세트</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-star"></i> 핵심 기능</div>
        <h2 class="section-title">프로 촬영을 대체하는<br />AI 기술</h2>
        <p class="section-desc">단 몇 번의 클릭으로 전문 패션 사진을 완성하세요.</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon purple"><i class="fas fa-shirt"></i></div>
          <h3 class="feature-title">원클릭 의류 업로드</h3>
          <p class="feature-desc">JPG, PNG, WEBP 형식의 의류 이미지를 드래그앤드롭으로 간편하게 업로드하고 앞/뒤 방향을 설정하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon pink"><i class="fas fa-person"></i></div>
          <h3 class="feature-title">100+ AI 모델 프리셋</h3>
          <p class="feature-desc">성별, 연령대, 체형, 피부톤, 무드를 필터링하여 브랜드에 딱 맞는 AI 모델을 선택하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon teal"><i class="fas fa-image"></i></div>
          <h3 class="feature-title">다양한 배경 프리셋</h3>
          <p class="feature-desc">스튜디오, 스트리트, 카페, 자연 등 15가지+ 배경을 제공합니다. 무드에 맞는 배경으로 분위기를 완성하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon amber"><i class="fas fa-bolt"></i></div>
          <h3 class="feature-title">30초 내 AI 생성</h3>
          <p class="feature-desc">최대 90초 이내에 고품질 온모델 피팅컷을 생성합니다. 전신/반신/상반신 구도와 다양한 포즈를 선택하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon blue"><i class="fas fa-layer-group"></i></div>
          <h3 class="feature-title">룩북 세트 자동 생성</h3>
          <p class="feature-desc">상세용, 광고용, SNS용, 룩북용 이미지 세트를 한 번에 생성하여 모든 채널의 크리에이티브를 해결하세요.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon green"><i class="fas fa-download"></i></div>
          <h3 class="feature-title">일괄 다운로드</h3>
          <p class="feature-desc">생성된 이미지를 개별 또는 ZIP 파일로 일괄 다운로드하고, 즐겨찾기로 관리하세요.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section id="how-it-works">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-route"></i> 이용 방법</div>
        <h2 class="section-title">5단계로 완성되는<br />AI 룩북 제작</h2>
        <p class="section-desc">복잡한 촬영 과정을 단 5단계로 간소화했습니다.</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">📤</div>
          <div class="step-title">Step 1. 의류 업로드</div>
          <div class="step-desc">의류 이미지를 업로드합니다. 여러 장일수록 좋아요!</div>
        </div>
        <div class="step-card">
          <div class="step-num">🧍</div>
          <div class="step-title">Step 2. 모델 선택</div>
          <div class="step-desc">성별, 체형, 피부톤으로 AI 모델을 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">🏙️</div>
          <div class="step-title">Step 3. 배경 선택</div>
          <div class="step-desc">브랜드에 맞는 배경을 카테고리별로 선택합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">⚡</div>
          <div class="step-title">Step 4. 생성 실행</div>
          <div class="step-desc">수량, 구도, 포즈를 설정하고 AI 생성을 시작합니다</div>
        </div>
        <div class="step-card">
          <div class="step-num">✅</div>
          <div class="step-title">Step 5. 결과 확인</div>
          <div class="step-desc">생성된 이미지를 확인하고 다운로드합니다</div>
        </div>
      </div>
      <div style="text-align:center;margin-top:48px;">
        <a href="/generator" class="btn btn-primary btn-lg">
          <i class="fas fa-wand-magic-sparkles"></i>
          지금 바로 시작하기
        </a>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-tags"></i> 요금제</div>
        <h2 class="section-title">합리적인 가격으로<br />시작하세요</h2>
        <p class="section-desc">촬영비의 1/10 비용으로 더 많은 결과물을 만들어보세요.</p>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-plan">Free</div>
          <div class="pricing-price">
            <span class="amount">₩0</span>
            <span class="period">/월</span>
          </div>
          <p class="pricing-desc">처음 시작하는 분들을 위한 플랜</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 월 5크레딧 무료 제공</li>
            <li><span class="check">✓</span> 기본 모델 10종</li>
            <li><span class="check">✓</span> 기본 배경 5종</li>
            <li><span class="check">✓</span> 1회 4장 생성</li>
            <li><span class="x">✗</span> <span style="opacity:0.5">스타일샷 세트</span></li>
            <li><span class="x">✗</span> <span style="opacity:0.5">일괄 다운로드</span></li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="openModal('signupModal')">무료로 시작</button>
        </div>
        <div class="pricing-card featured">
          <div class="pricing-popular">가장 인기</div>
          <div class="pricing-plan">Pro</div>
          <div class="pricing-price">
            <span class="amount">₩49,000</span>
            <span class="period">/월</span>
          </div>
          <p class="pricing-desc">활발하게 판매하는 셀러를 위한 플랜</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 월 100크레딧 제공</li>
            <li><span class="check">✓</span> 전체 모델 50종+</li>
            <li><span class="check">✓</span> 전체 배경 30종+</li>
            <li><span class="check">✓</span> 1회 최대 8장 생성</li>
            <li><span class="check">✓</span> 스타일샷 세트</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-primary btn-full" onclick="openModal('signupModal')">Pro 시작하기</button>
        </div>
        <div class="pricing-card">
          <div class="pricing-plan">Business</div>
          <div class="pricing-price">
            <span class="amount">₩149,000</span>
            <span class="period">/월</span>
          </div>
          <p class="pricing-desc">브랜드 & 에이전시를 위한 플랜</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 월 400크레딧 제공</li>
            <li><span class="check">✓</span> 전체 모델/배경 무제한</li>
            <li><span class="check">✓</span> 커스텀 모델 등록</li>
            <li><span class="check">✓</span> 팀 계정 5인</li>
            <li><span class="check">✓</span> API 접근</li>
            <li><span class="check">✓</span> 전담 CS 지원</li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="openModal('signupModal')">Business 시작</button>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section id="cta-section">
    <div class="container">
      <div class="cta-content">
        <h2 class="cta-title">지금 바로 <span class="highlight">무료로 체험</span>하세요</h2>
        <p class="cta-desc">신용카드 없이 5크레딧을 무료로 받고<br />AI 룩북 제작을 경험해보세요.</p>
        <div class="cta-actions">
          <button class="btn btn-primary btn-lg" onclick="openModal('signupModal')">
            <i class="fas fa-rocket"></i>
            무료로 시작하기 →
          </button>
          <a href="/generator" class="btn btn-lg" style="background:rgba(255,255,255,0.1);color:white;border:2px solid rgba(255,255,255,0.3);">
            <i class="fas fa-eye"></i>
            데모 체험하기
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="navbar-logo">
            <div class="logo-icon">✨</div>
            <span>LookbookAI</span>
          </div>
          <p>AI 기술로 패션 이커머스 촬영의<br />새로운 기준을 만들어갑니다.</p>
        </div>
        <div class="footer-col">
          <h4>제품</h4>
          <ul class="footer-links">
            <li><a href="#features">기능 소개</a></li>
            <li><a href="#how-it-works">이용 방법</a></li>
            <li><a href="#pricing">요금제</a></li>
            <li><a href="/generator">데모</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>회사</h4>
          <ul class="footer-links">
            <li><a href="#">회사 소개</a></li>
            <li><a href="#">블로그</a></li>
            <li><a href="#">채용</a></li>
            <li><a href="#">문의하기</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>법적 고지</h4>
          <ul class="footer-links">
            <li><a href="/terms">이용약관</a></li>
            <li><a href="/privacy">개인정보처리방침</a></li>
            <li><a href="#">쿠키 정책</a></li>
          </ul>
        </div>
      </div>

      <!-- 회사 정보 구분선 -->
      <div style="border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 24px;"></div>

      <!-- 사업자 정보 -->
      <div class="footer-company-info">
        <p>
          <strong>벌거벗은호랑이</strong>&nbsp;&nbsp;
          대표자 : 김사헌&nbsp;&nbsp;
          사업자등록번호 : 204-29-48306&nbsp;&nbsp;
          통신판매업신고번호 : 2025-충북청주-1463
        </p>
        <p>
          사업장주소 : 충청북도 청주시 서원구 무심서로 377-3
        </p>
      </div>

      <div class="footer-bottom">
        <span>© 2026 벌거벗은호랑이 / NakedTiger. All rights reserved.</span>
        <div style="display:flex;gap:16px;align-items:center;">
          <a href="/terms" style="color:var(--text-muted);font-size:13px;">이용약관</a>
          <a href="/privacy" style="color:var(--text-muted);font-size:13px;font-weight:700;">개인정보처리방침</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Login / Signup Modal (통합) -->
  <div class="modal-overlay" id="loginModal">
    <div class="modal-box" style="max-width:420px;">
      <button class="modal-close" onclick="closeModal('loginModal')">×</button>

      <!-- 탭 전환 -->
      <div style="display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid var(--border);">
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;">회원가입</button>
      </div>

      <!-- 소셜 로그인 버튼 -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google로 시작하기
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-size:12px;color:var(--text-muted);">또는 이메일로</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>

      <!-- 로그인 폼 -->
      <div id="authFormLogin">
        <form id="loginForm" onsubmit="handleLogin(event)" novalidate>
          <div id="loginError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="loginErrorText"></span></div>
          <div class="form-group">
            <input type="email" class="form-input" id="loginEmail" placeholder="이메일" autocomplete="email" />
          </div>
          <div class="form-group">
            <input type="password" class="form-input" id="loginPassword" placeholder="비밀번호" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;">로그인</button>
        </form>
      </div>

      <!-- 회원가입 폼 -->
      <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)" novalidate>
          <div id="signupError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="signupErrorText"></span></div>

          <!-- 약관 동의 체크박스 — 에러 바로 아래, 입력필드 위 -->
          <div style="display:flex;flex-direction:column;gap:0;margin-bottom:14px;background:var(--bg-secondary,#f8f8f8);border-radius:10px;border:1px solid var(--border-color,#e8e8e8);overflow:hidden;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:13px 16px;border-bottom:1px solid var(--border-color,#e8e8e8);background:var(--white,#fff);" onclick="toggleAgreeAll(event)">
              <input type="checkbox" id="agreeAll" style="width:18px;height:18px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" />
              <span style="font-size:14px;font-weight:700;color:var(--text-primary,#111);">전체 동의</span>
            </label>
            <div style="display:flex;flex-direction:column;gap:0;padding:10px 16px 12px;">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--text-secondary,#555);line-height:1.5;padding:6px 0;">
                <input type="checkbox" id="agreePrivacy" style="margin-top:2px;width:16px;height:16px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" onchange="syncAgreeAll()" />
                <span><a href="/privacy" target="_blank" style="color:var(--primary,#6366f1);font-weight:600;text-decoration:underline;">개인정보처리방침</a>에 따른 개인정보 수집 및 이용에 동의합니다. <span style="color:#e53e3e;font-weight:700;">(필수)</span></span>
              </label>
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;color:var(--text-secondary,#555);line-height:1.5;padding:6px 0;">
                <input type="checkbox" id="agreeMarketing" style="margin-top:2px;width:16px;height:16px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" onchange="syncAgreeAll()" />
                <span>가끔 프로모션 이메일 및 알림을 수신합니다. 언제든지 수신 거부할 수 있습니다. <span style="color:var(--text-muted,#999);">(선택)</span></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <input type="text" class="form-input" id="signupName" placeholder="이름" autocomplete="name" />
          </div>
          <div class="form-group">
            <input type="email" class="form-input" id="signupEmail" placeholder="이메일" autocomplete="email" />
          </div>
          <div class="form-group">
            <input type="password" class="form-input" id="signupPassword" placeholder="비밀번호 (8자 이상)" autocomplete="new-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:12px;">가입하고 무료 시작 🎁</button>
        </form>
      </div>

      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:16px;">가입 시 <a href="/terms" target="_blank" style="color:var(--primary);">이용약관</a> 및 <a href="/privacy" target="_blank" style="color:var(--primary);">개인정보처리방침</a>에 동의합니다.</p>
    </div>
  </div>
  `))}),K.get(`/dashboard`,e=>e.html(pt(`내 프로필`,`
  <div class="toast-container" id="toastContainer"></div>

  <style>
    body { background: #0d0d1a; }

    .db-wrap {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px 80px;
      background: #0d0d1a;
    }

    /* ── 프로필 카드 ── */
    .db-card {
      width: 100%;
      max-width: 420px;
      background: #16162a;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      margin-bottom: 16px;
    }

    /* 상단 헤더 (아바타 + 이름) */
    .db-card-header {
      padding: 32px 28px 24px;
      border-bottom: 1px solid #2a2a45;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .db-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6c47ff, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(108,71,255,0.4);
    }
    .db-name {
      font-size: 18px;
      font-weight: 700;
      color: #f0f0f8;
      margin-bottom: 3px;
    }
    .db-email {
      font-size: 13px;
      color: #8b8ba0;
    }

    /* 크레딧 행 */
    .db-credit-row {
      padding: 20px 28px;
      border-bottom: 1px solid #2a2a45;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .db-credit-label {
      font-size: 13px;
      color: #8b8ba0;
      margin-bottom: 4px;
    }
    .db-credit-val {
      font-size: 22px;
      font-weight: 800;
      color: #6c47ff;
    }
    .db-credit-sub {
      font-size: 11px;
      color: #8b8ba0;
      margin-top: 2px;
    }
    .db-charge-btn {
      padding: 9px 20px;
      background: #6c47ff;
      color: white;
      border: none;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .db-charge-btn:hover { background: #7c57ff; }

    /* 메뉴 항목 */
    .db-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 28px;
      cursor: pointer;
      border-bottom: 1px solid #2a2a45;
      text-decoration: none;
      transition: background 0.12s;
    }
    .db-menu-item:last-child { border-bottom: none; }
    .db-menu-item:hover { background: #1e1e35; }
    .db-menu-label {
      font-size: 15px;
      color: #e0e0f0;
      font-weight: 500;
    }
    .db-menu-arrow {
      font-size: 18px;
      color: #5a5a7a;
    }

    /* 로그아웃 카드 */
    .db-logout-card {
      width: 100%;
      max-width: 420px;
      background: #16162a;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    }
    .db-logout-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 18px 28px;
      background: none;
      border: none;
      cursor: pointer;
      transition: background 0.12s;
    }
    .db-logout-btn:hover { background: #1e1e35; }
    .db-logout-label {
      font-size: 15px;
      font-weight: 600;
      color: #ef4444;
    }

    /* 로고 */
    .db-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
      text-decoration: none;
    }
    .db-logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg,#6c47ff,#a855f7);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .db-logo-text {
      font-size: 18px;
      font-weight: 800;
      color: #f0f0f8;
    }

    /* 생성하러 가기 버튼 */
    .db-gen-btn {
      width: 100%;
      max-width: 420px;
      margin-top: 16px;
      padding: 16px;
      background: linear-gradient(135deg,#6c47ff,#a855f7);
      color: white;
      border: none;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .db-gen-btn:hover { opacity: 0.9; }
  </style>

  <div class="db-wrap">

    <!-- 로고 -->
    <a href="/" class="db-logo">
      <div class="db-logo-icon">✨</div>
      <span class="db-logo-text">LookbookAI</span>
    </a>

    <!-- 메인 카드 -->
    <div class="db-card">

      <!-- 프로필 헤더 -->
      <div class="db-card-header">
        <div class="db-avatar" id="dbAvatar">?</div>
        <div>
          <div class="db-name" id="dbName">로딩 중...</div>
          <div class="db-email" id="dbEmail"></div>
        </div>
      </div>

      <!-- 크레딧 -->
      <div class="db-credit-row">
        <div>
          <div class="db-credit-label">현재 크레딧</div>
          <div class="db-credit-val" id="dbCredits">-</div>
          <div class="db-credit-sub">이미지 1장 = 90크레딧</div>
        </div>
        <button class="db-charge-btn" onclick="openChargePanel()">충전</button>
      </div>

      <!-- 생성 내역 -->
      <a href="/dashboard#history" class="db-menu-item" id="menuHistory">
        <span class="db-menu-label">생성 내역</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 카톡 문의 -->
      <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" class="db-menu-item">
        <span class="db-menu-label">카톡 문의</span>
        <span class="db-menu-arrow">›</span>
      </a>

    </div>

    <!-- 로그아웃 카드 -->
    <div class="db-logout-card">
      <button class="db-logout-btn" onclick="handleLogout()">
        <span class="db-logout-label">로그아웃</span>
        <span style="font-size:18px;color:#ef4444;">›</span>
      </button>
    </div>

    <!-- 이미지 생성 바로가기 -->
    <a href="/generator" class="db-gen-btn">
      <i class="fas fa-wand-magic-sparkles"></i> 이미지 생성 바로가기
    </a>

  </div>

  <!-- 생성 내역 패널 (해시 #history) -->
  <div id="historyPanel" style="display:none;position:fixed;inset:0;background:#0d0d1a;z-index:500;overflow-y:auto;">
    <div style="max-width:480px;margin:0 auto;padding:24px 16px 80px;">
      <!-- 헤더 -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <button onclick="document.getElementById('historyPanel').style.display='none';history.replaceState(null,'','/dashboard');" style="width:36px;height:36px;border:none;background:#2a2a45;border-radius:50%;color:#e0e0f0;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">‹</button>
        <h2 style="font-size:18px;font-weight:700;color:#f0f0f8;">생성 내역</h2>
      </div>
      <!-- 14일 보관 안내 -->
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px 14px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:15px;">⏰</span>
        <span style="font-size:12px;color:#fca5a5;line-height:1.5;">이미지는 <strong>14일 동안만 보관</strong>됩니다. 제때 다운로드하시기 바랍니다.</span>
      </div>
      <div id="historyList" style="display:flex;flex-direction:column;gap:16px;">
        <div style="text-align:center;padding:60px 20px;color:#5a5a7a;font-size:14px;">
          <div style="font-size:40px;margin-bottom:12px;">🎨</div>
          생성 내역을 불러오는 중...
        </div>
      </div>
    </div>
  </div>

  <!-- 이미지 확대 다운로드 모달 (히스토리 전용) -->
  <div id="histImgModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:1000;align-items:center;justify-content:center;flex-direction:column;padding:20px;">
    <button onclick="closeHistModal()" style="position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;background:rgba(255,255,255,0.1);border-radius:50%;color:#fff;font-size:20px;cursor:pointer;">×</button>
    <img id="histModalImg" src="" alt="생성 이미지"
      style="max-width:min(420px,90vw);max-height:calc(100dvh - 140px);object-fit:contain;border-radius:14px;display:block;" />
    <div id="histModalExpiry" style="font-size:11px;color:#f87171;margin-top:8px;text-align:center;"></div>
    <button id="histModalDlBtn" onclick="histModalDownload()" style="margin-top:14px;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#a855f7);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;">
      <i class="fas fa-download"></i> 다운로드 (90크레딧)
    </button>
  </div>

  <script>
  // ── 대시보드 초기화 ──
  document.addEventListener('DOMContentLoaded', async () => {
    await verifySession();
    const user = AppState.user;
    if (!user) {
      window.location.href = '/';
      return;
    }
    // 프로필 채우기
    const initial = (user.name || user.email || '?')[0].toUpperCase();
    document.getElementById('dbAvatar').textContent = initial;
    document.getElementById('dbName').textContent   = user.name || user.email;
    document.getElementById('dbEmail').textContent  = user.email || '';
    document.getElementById('dbCredits').textContent = (user.credits ?? 0).toLocaleString();

    // 해시 처리
    if (location.hash === '#history') openHistory();
    document.getElementById('menuHistory').addEventListener('click', (e) => {
      e.preventDefault();
      openHistory();
    });
  });

  function openHistory() {
    history.replaceState(null,'','/dashboard#history');
    document.getElementById('historyPanel').style.display = 'block';
    loadHistory();
  }

  // ── 순번 포맷: YYYYMMDDHHMM + zero-padded seq_no ──
  function formatHistSeq(createdAt, seqNo) {
    // createdAt: "2026-08-04 08:39:49" 형태
    const dt = createdAt ? createdAt.replace('T',' ') : '';
    const parts = dt.match(/(d{4})-(d{2})-(d{2}) (d{2}):(d{2})/);
    if (!parts) return String(seqNo || '?').padStart(3,'0');
    const yy = parts[1].slice(2); // 26
    const mm = parts[2]; const dd = parts[3];
    const hh = parts[4]; const mi = parts[5];
    const seq = String(seqNo || 1).padStart(3,'0');
    return \`\${yy}\${mm}\${dd}\${hh}\${mi}-\${seq}\`;
  }

  // ── 만료까지 남은 일수 계산 ──
  function expiryLabel(expiresAt) {
    if (!expiresAt) return null;
    const exp = new Date(expiresAt.replace(' ','T') + (expiresAt.includes('Z') ? '' : 'Z'));
    const now = Date.now();
    const diffMs = exp.getTime() - now;
    if (diffMs <= 0) return '만료됨';
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return \`⚠️ \${diffDays}일 후 만료\`;
    return \`\${diffDays}일 후 만료\`;
  }

  // ── 히스토리 이미지 모달 상태 ──
  let _histModalUrl = null;
  let _histModalJobId = null;

  function openHistModal(imgUrl, expiresAt) {
    _histModalUrl = imgUrl;
    const modal = document.getElementById('histImgModal');
    document.getElementById('histModalImg').src = imgUrl;
    const expLabel = expiresAt ? expiryLabel(expiresAt) : null;
    document.getElementById('histModalExpiry').textContent = expLabel ? \`만료: \${expLabel}\` : '';
    modal.style.display = 'flex';
  }
  function closeHistModal() {
    document.getElementById('histImgModal').style.display = 'none';
    _histModalUrl = null;
  }
  async function histModalDownload() {
    if (!_histModalUrl) return;
    const btn = document.getElementById('histModalDlBtn');
    const token = localStorage.getItem('lookbook_token') || '';
    if (!token) { showToast('로그인이 필요합니다.', 'error'); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리 중...';
    try {
      const deductRes = await fetch('/api/credits/deduct', {
        method: 'POST', headers: { 'X-Session-Token': token }
      });
      if (deductRes.status === 401) { showToast('로그인이 필요합니다.', 'error'); return; }
      if (deductRes.status === 402) {
        const errData = await deductRes.json();
        showToast(\`크레딧 부족 (보유: \${errData.available ?? 0}크레딧 / 필요: 90크레딧)\`, 'error');
        return;
      }
      if (!deductRes.ok) { showToast('크레딧 처리 오류', 'error'); return; }
      const deductData = await deductRes.json();
      // 크레딧 UI 갱신
      const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
      if (cachedUser) { cachedUser.credits = deductData.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
      if (AppState.user) AppState.user.credits = deductData.creditsRemaining;
      const dbCredEl = document.getElementById('dbCredits');
      if (dbCredEl) dbCredEl.textContent = (deductData.creditsRemaining ?? 0).toLocaleString();
      // 파일 다운로드
      const dlUrl = _histModalUrl.includes('/api/proxy/gen-image')
        ? _histModalUrl + (_histModalUrl.includes('?') ? '&' : '?') + 'download=1'
        : \`/api/proxy/gen-image?url=\${encodeURIComponent(_histModalUrl)}&download=1\`;
      const a = document.createElement('a');
      a.href = dlUrl; a.download = \`lookbook_ai_\${Date.now()}.jpg\`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast(\`다운로드 완료! (잔액: \${deductData.creditsRemaining}크레딧)\`, 'success');
      closeHistModal();
    } catch (err) {
      showToast('다운로드 중 오류가 발생했습니다.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-download"></i> 다운로드 (90크레딧)';
    }
  }

  async function loadHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#5a5a7a;">불러오는 중...</div>';
    try {
      const token = localStorage.getItem('lookbook_token') || '';
      const res = await fetch('/api/generation/history', { headers: { 'X-Session-Token': token } });
      if (!res.ok) throw new Error('서버 오류');
      const data = await res.json();
      const logs = data.logs || [];
      if (!logs.length) {
        list.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#5a5a7a;font-size:14px;"><div style="font-size:40px;margin-bottom:12px;">🎨</div>아직 생성 내역이 없어요.<br/>이미지를 생성해보세요!</div>';
        return;
      }

      list.innerHTML = logs.map((log, i) => {
        const seqLabel  = formatHistSeq(log.created_at, log.seq_no || (logs.length - i));
        const dateStr   = log.created_at ? log.created_at.slice(0,16).replace('T',' ') : '';
        const expLabel  = expiryLabel(log.expires_at);
        const expired   = expLabel === '만료됨';
        const countLabel = log.image_count || 1;

        // image_urls 파싱 (JSON 배열 문자열)
        let urls = [];
        try { urls = log.image_urls ? JSON.parse(log.image_urls) : []; } catch(e) { urls = []; }

        // 썸네일 그리드 (최대 4장)
        const thumbsHtml = urls.length > 0 ? \`
          <div style="display:grid;grid-template-columns:repeat(\${Math.min(urls.length,4)},1fr);gap:4px;margin-top:10px;border-radius:10px;overflow:hidden;">
            \${urls.slice(0,4).map((u, ti) => {
              const proxyUrl = u.startsWith('/api/proxy') ? u : \`/api/proxy/gen-image?url=\${encodeURIComponent(u)}\`;
              const expiresAtEsc = (log.expires_at || '').replace(/'/g,"\\\\'");
              if (expired) {
                return \`<div style="aspect-ratio:3/4;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:11px;color:#5a5a7a;">만료됨</div>\`;
              }
              return \`<div style="aspect-ratio:3/4;overflow:hidden;cursor:pointer;position:relative;" onclick="openHistModal('\${proxyUrl}','\${expiresAtEsc}')">
                <img src="\${proxyUrl}" alt="생성 이미지 \${ti+1}"
                  style="width:100%;height:100%;object-fit:cover;display:block;"
                  onerror="this.parentNode.innerHTML='<div style=\\"width:100%;height:100%;background:#1e1e35;display:flex;align-items:center;justify-content:center;font-size:10px;color:#5a5a7a;\\">로드 실패</div>'" />
                <div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border-radius:4px;padding:2px 5px;font-size:10px;color:#fff;">
                  <i class="fas fa-expand-alt"></i>
                </div>
              </div>\`;
            }).join('')}
          </div>\` : \`<div style="margin-top:10px;padding:14px;background:#16162a;border-radius:10px;text-align:center;font-size:12px;color:#5a5a7a;border:1px dashed rgba(255,255,255,0.06);">
            <i class="fas fa-image" style="opacity:0.3;font-size:18px;margin-bottom:6px;display:block;"></i>
            이미지 준비 중이거나 저장 전 세션이 종료되었습니다
          </div>\`;

        const expColor  = expLabel === '만료됨' ? '#6b7280' : (expLabel?.includes('⚠️') ? '#fbbf24' : '#6b7280');

        return \`<div style="background:#1e1e35;border-radius:16px;padding:14px 16px;border:1px solid rgba(255,255,255,0.04);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;font-weight:700;color:#9b7cff;letter-spacing:0.5px;margin-bottom:3px;">#\${seqLabel}</div>
              <div style="font-size:13px;font-weight:600;color:#e0e0f0;">\${countLabel}장 생성</div>
              <div style="font-size:11px;color:#5a5a7a;margin-top:2px;">\${dateStr}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:11px;color:\${expColor};">\${expLabel || ''}</div>
              <div style="font-size:11px;color:#5a5a7a;margin-top:2px;">\${log.ratio || '3:4'}</div>
            </div>
          </div>
          \${thumbsHtml}
        </div>\`;
      }).join('');
    } catch (e) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;font-size:13px;">불러오기 실패</div>';
    }
  }

  <\/script>
  `))),K.get(`/generator`,e=>e.html(pt(`AI 룩북 생성`,`
  <div class="toast-container" id="toastContainer"></div>

  <!-- ════════════════════════════════════════
       GENERATOR APP — position:fixed 전체화면
       step-panel: position:absolute inset:0
       translateX 슬라이드 전환
       높이 계산 JS 완전 제거
  ════════════════════════════════════════ -->
  <div id="gapp">
    <!-- ── 중앙 패널 (모바일=전체, PC=480px 중앙) ── -->
    <div id="gapp-panel">

    <!-- ── 상단 바 (고정) ── -->
    <header id="gapp-header">
      <a href="/" class="gapp-logo">✨ LookbookAI</a>
      <div id="gapp-steps">
        <span class="gstep" id="gs1">1</span>
        <span class="gstep-line" id="gl1"></span>
        <span class="gstep" id="gs2">2</span>
        <span class="gstep-line" id="gl2"></span>
        <span class="gstep" id="gs3">3</span>
      </div>
      <!-- 로그인 상태 표시 -->
      <div style="display:flex;align-items:center;gap:8px;position:relative;">
        <button id="navLoginBtn" onclick="openModal('loginModal')" style="font-size:12px;padding:6px 12px;background:var(--primary-bg);border:1px solid var(--primary);border-radius:20px;color:var(--primary);cursor:pointer;font-weight:600;">로그인</button>
        <div id="navUserArea" style="display:none;align-items:center;gap:0;position:relative;">
          <span id="navUserCredits" style="display:none;"></span>
          <span id="navUserName" style="display:none;"></span>
          <div id="navUserAvatar" onclick="toggleUserMenu()" style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(108,71,255,0.4);">?</div>
          <div id="userDropdownMenu" style="display:none;position:absolute;top:38px;right:0;background:#1e1e35;border:1px solid #3a3a60;border-radius:16px;padding:6px;min-width:210px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:10001;">
            <div style="padding:12px 14px 10px;border-bottom:1px solid #3a3a60;margin-bottom:4px;">
              <div id="ddUserName" style="font-size:13px;font-weight:700;color:#f0f0f8;margin-bottom:2px;"></div>
              <div id="ddUserEmail" style="font-size:11px;color:#8b8ba0;margin-bottom:6px;"></div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div id="ddUserCredits" style="font-size:12px;font-weight:600;color:#6c47ff;"></div>
                <button onclick="openChargePanel();toggleUserMenu();" style="font-size:11px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;">충전</button>
              </div>
            </div>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''">로그아웃</button>
          </div>
        </div>
      </div>
    </header>

    <!-- ── 슬라이드 컨테이너 ── -->
    <div id="gapp-slides">

      <!-- STEP 1 · 의류 업로드 -->
      <div class="gslide active" id="step-1">
        <div class="gslide-body">
          <div class="gstep-label">Step 1 / 3 · 의류 업로드</div>
          <h2 class="gstep-title">의류를 종류별로 업로드하세요</h2>
          <p class="gstep-sub">각 칸에 해당하는 의류를 업로드하세요 · 원하는 칸만 사용해도 됩니다</p>

          <!-- 숨겨진 파일 input — label for= 연결용 (슬롯 위에 선언해야 label이 참조 가능) -->
          <input type="file" id="fileInput-TOP"    accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'TOP')" />
          <input type="file" id="fileInput-BOTTOM" accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'BOTTOM')" />
          <input type="file" id="fileInput-DRESS"  accept="image/*" style="display:none;" onchange="handleSlotFileSelect(event,'DRESS')" />

          <!-- 2열 슬롯 그리드: 왼쪽=상의(위)+하의(아래) / 오른쪽=전체(전체 높이) -->
          <div class="clothing-slots">

            <!-- 상의 슬롯 (왼쪽 열 1행) -->
            <label class="cslot" id="slot-TOP" for="fileInput-TOP"
              style="grid-column:1; grid-row:1;"
              ondragover="handleSlotDragOver(event,'TOP')"
              ondragleave="handleSlotDragLeave(event,'TOP')"
              ondrop="handleSlotDrop(event,'TOP')"
              onclick="return handleSlotLabelClick(event,'TOP')">
              <span class="cslot-label">상의</span>
              <span class="cslot-body" id="slot-body-TOP">
                <span class="cslot-empty">
                  <span class="cslot-plus">＋</span>
                  <span class="cslot-hint">탭하여 사진 선택</span>
                </span>
              </span>
              <button type="button" class="cslot-remove hidden" id="slot-remove-TOP"
                onclick="removeSlot(event,'TOP')">✕</button>
            </label>

            <!-- 하의 슬롯 (왼쪽 열 2행) -->
            <label class="cslot" id="slot-BOTTOM" for="fileInput-BOTTOM"
              style="grid-column:1; grid-row:2;"
              ondragover="handleSlotDragOver(event,'BOTTOM')"
              ondragleave="handleSlotDragLeave(event,'BOTTOM')"
              ondrop="handleSlotDrop(event,'BOTTOM')"
              onclick="return handleSlotLabelClick(event,'BOTTOM')">
              <span class="cslot-label">하의</span>
              <span class="cslot-body" id="slot-body-BOTTOM">
                <span class="cslot-empty">
                  <span class="cslot-plus">＋</span>
                  <span class="cslot-hint">탭하여 사진 선택</span>
                </span>
              </span>
              <button type="button" class="cslot-remove hidden" id="slot-remove-BOTTOM"
                onclick="removeSlot(event,'BOTTOM')">✕</button>
            </label>

            <!-- 전체 슬롯 (오른쪽 열 전체 높이: 1행~2행 span) -->
            <label class="cslot cslot--full" id="slot-DRESS" for="fileInput-DRESS"
              style="grid-column:2; grid-row:1 / span 2;"
              ondragover="handleSlotDragOver(event,'DRESS')"
              ondragleave="handleSlotDragLeave(event,'DRESS')"
              ondrop="handleSlotDrop(event,'DRESS')"
              onclick="return handleSlotLabelClick(event,'DRESS')">
              <span class="cslot-label">전체</span>
              <span class="cslot-body" id="slot-body-DRESS">
                <span class="cslot-empty">
                  <span class="cslot-plus">＋</span>
                  <span class="cslot-hint">탭하여 사진 선택</span>
                </span>
              </span>
              <button type="button" class="cslot-remove hidden" id="slot-remove-DRESS"
                onclick="removeSlot(event,'DRESS')">✕</button>
            </label>

          </div><!-- /.clothing-slots -->
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(1)"><i class="fas fa-arrow-left"></i> 이전</button>
            <button class="step-nav-next" id="nextBtn1" onclick="nextStep(1)" disabled>다음 단계 <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 2 · 모델 선택 -->
      <div class="gslide" id="step-2">
        <div class="gslide-header">
          <div class="gstep-label">Step 2 / 3 · 모델 선택</div>
          <h2 class="gstep-title">AI 모델을 선택하세요</h2>

        </div>
        <div class="gslide-grid" id="modelGridWrap">
          <div id="modelsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p>모델 불러오는 중...</p>
          </div>
          <div class="select-grid" id="modelGrid"></div>
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(2)"><i class="fas fa-arrow-left"></i> 이전</button>
            <button class="step-nav-next" id="nextBtn2" onclick="nextStep(2)">다음 단계 <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 3 · 배경 선택 -->
      <div class="gslide" id="step-3">
        <div class="gslide-header">
          <div class="gstep-label">Step 3 / 3 · 배경 선택</div>
          <h2 class="gstep-title">배경을 선택하세요</h2>

        </div>
        <div class="gslide-grid" id="bgGridWrap">
          <div id="bgsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p>배경 불러오는 중...</p>
          </div>
          <div class="select-grid" id="bgGrid"></div>
        </div>
        <!-- 생성 중 오버레이 (step-3 내부) -->
        <div class="generating-view" id="generatingView">
          <div class="gen-spinner"></div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;">AI가 이미지를 생성 중입니다...</h2>
          <div class="gen-progress-bar"><div class="gen-progress-fill" id="genProgressFill" style="width:0%"></div></div>
          <div class="gen-status-text" id="genStatusText">시작 중...</div>
          <div class="gen-status-msgs">
            <div class="gen-msg current" id="msg1"><div class="dot"></div> 의류 이미지 분석 중...</div>
            <div class="gen-msg" id="msg2"><div class="dot"></div> AI 모델 피팅 적용 중...</div>
            <div class="gen-msg" id="msg3"><div class="dot"></div> 배경 합성 중...</div>
            <div class="gen-msg" id="msg4"><div class="dot"></div> 이미지 품질 향상 중...</div>
            <div class="gen-msg" id="msg5"><div class="dot"></div> 최종 렌더링 중...</div>
          </div>
        </div>
        <div class="gslide-nav" id="step3Nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(3)"><i class="fas fa-arrow-left"></i> 이전</button>
            <button class="step-nav-next" id="nextBtn3" onclick="startGeneration()"><i class="fas fa-wand-magic-sparkles"></i> AI 생성 시작</button>
          </div>
        </div>
      </div>

      <!-- STEP 4 (구 Step5) · 결과 -->
      <div class="gslide" id="step-4">
        <div class="gslide-scroll" style="padding-top:12px;">
          <div class="results-grid" id="resultsGrid"></div>
          <!-- 이미지 하단 ~ 버튼 상단 사이 안내 메시지 -->
          <div style="padding:18px 16px 4px;text-align:center;">
            <p style="font-size:13px;color:#8b8ba0;line-height:1.6;margin:0;">
              <span style="color:#9b7cff;font-weight:600;">이미지 생성은 크레딧이 차감되지 않습니다.</span><br/>
              오류가 있거나 마음에 들지 않으면 이미지 위 <strong style="color:#e0e0f0;">🔄 재생성</strong> 버튼을 눌러보세요.
            </p>
          </div>
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="window.location.href='/generator'"><i class="fas fa-plus"></i> 새 프로젝트</button>
            <button class="step-nav-next" onclick="window.location.href='/'"><i class="fas fa-home"></i> 홈으로</button>
          </div>
        </div>
      </div>

    </div><!-- /gapp-slides -->
    </div><!-- /gapp-panel -->
  </div><!-- /gapp -->

  <!-- Image View Modal -->
  <div class="modal-overlay image-modal" id="imageModal">
    <div class="modal-box">
      <button class="modal-close" style="background:rgba(0,0,0,0.5);color:white;top:12px;right:12px;z-index:20;" onclick="closeModal('imageModal')">×</button>
      <div style="position:relative;display:block;width:100%;">
        <img id="modalImage" src="" alt="생성된 이미지" />
        <!-- 버튼 영역: 재생성 + 다운로드 -->
        <div id="modalButtonArea" style="position:absolute;bottom:16px;right:16px;z-index:20;display:flex;align-items:center;gap:8px;">
          <!-- 재생성 버튼 -->
          <button id="regenBtn" onclick="regenImage()" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:rgba(99,102,241,0.85);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,1)'" onmouseout="this.style.background='rgba(99,102,241,0.85)'">
            <i class="fas fa-redo-alt"></i>
            <span id="regenBtnText">재생성</span>
            <span id="regenCounter" style="font-size:12px;opacity:0.8;"></span>
          </button>
          <!-- 다운로드 버튼 -->
          <button id="downloadBtn" onclick="downloadImage()" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.85)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">
            <i class="fas fa-download"></i> 다운로드
          </button>
        </div>
        <!-- 재생성 한도 초과 메시지 -->
        <div id="regenLimitMsg" style="display:none;position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(239,68,68,0.9);backdrop-filter:blur(8px);color:white;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;z-index:21;">
          재생성 한도가 초과하였습니다. 다른 옷으로 시도해주세요.
        </div>
      </div>
    </div>
  </div>

  <!-- Auth Modal (Generator 내부) -->
  <div class="modal-overlay" id="loginModal" style="z-index:10000;">
    <div class="modal-box" style="max-width:420px;">
      <button class="modal-close" onclick="closeModal('loginModal')">×</button>
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:28px;margin-bottom:8px;">✨</div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">AI 생성을 시작하려면<br/>로그인이 필요해요</h2>
        <p style="font-size:13px;color:var(--text-muted);">가입 즉시 무료 크레딧을 드려요!</p>
      </div>
      <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border);">
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;">회원가입</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google')" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google로 시작하기
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-size:12px;color:var(--text-muted);">또는 이메일로</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
      <div id="authFormLogin">
        <form id="loginForm" onsubmit="handleLogin(event)" novalidate>
          <div id="loginError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="loginErrorText"></span></div>
          <div class="form-group"><input type="email" class="form-input" id="loginEmail" placeholder="이메일" autocomplete="email" /></div>
          <div class="form-group"><input type="password" class="form-input" id="loginPassword" placeholder="비밀번호" autocomplete="current-password" /></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;">로그인</button>
        </form>
      </div>
      <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)" novalidate>
          <div id="signupError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="signupErrorText"></span></div>
          <div class="form-group"><input type="text" class="form-input" id="signupName" placeholder="이름" autocomplete="name" /></div>
          <div class="form-group"><input type="email" class="form-input" id="signupEmail" placeholder="이메일" autocomplete="email" /></div>
          <div class="form-group"><input type="password" class="form-input" id="signupPassword" placeholder="비밀번호 (8자 이상)" autocomplete="new-password" /></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:4px;">가입하고 무료 시작 🎁</button>
        </form>
      </div>
      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:14px;">가입 시 이용약관 및 개인정보처리방침에 동의합니다.</p>
    </div>
  </div>
  `))),K.get(`/admin02`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Admin | LookbookAI</title>
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Pretendard',-apple-system,sans-serif;background:#0f0f1a;color:#e0e0f0;min-height:100vh;}
    /* 로그인 */
    #loginOverlay{position:fixed;inset:0;background:#0f0f1a;display:flex;align-items:center;justify-content:center;z-index:100;}
    .login-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:16px;padding:40px;width:100%;max-width:380px;text-align:center;}
    .login-card .logo{font-size:32px;margin-bottom:8px;}
    .login-card h2{font-size:20px;font-weight:700;margin-bottom:4px;}
    .login-card p{font-size:13px;color:#8b8ba0;margin-bottom:28px;}
    .login-card input{width:100%;padding:12px 16px;background:#252540;border:1px solid #3a3a60;border-radius:10px;color:#e0e0f0;font-size:15px;outline:none;margin-bottom:12px;transition:border-color .2s;}
    .login-card input:focus{border-color:#6c47ff;}
    .login-card .err{font-size:13px;color:#ef4444;margin-bottom:10px;min-height:18px;}
    /* 헤더 */
    #adminMain{display:none;}
    .admin-header{background:#1a1a2e;border-bottom:1px solid #2e2e50;padding:14px 28px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:50;}
    .admin-header .logo{font-size:18px;font-weight:700;color:#6c47ff;}
    .admin-header .badge{font-size:11px;background:#6c47ff22;color:#9b7cff;padding:3px 10px;border-radius:20px;border:1px solid #6c47ff44;}
    .admin-header .logout{margin-left:auto;font-size:13px;cursor:pointer;padding:6px 14px;border:1px solid #3a3a60;border-radius:8px;background:none;color:#e0e0f0;transition:all .2s;}
    .admin-header .logout:hover{border-color:#6c47ff;color:#9b7cff;}
    /* 탭 */
    .tab-bar{display:flex;gap:4px;background:#1a1a2e;border-bottom:1px solid #2e2e50;padding:0 28px;}
    .tab-btn{padding:14px 20px;font-size:14px;font-weight:500;cursor:pointer;border:none;background:none;color:#8b8ba0;border-bottom:2px solid transparent;transition:all .2s;}
    .tab-btn.active{color:#9b7cff;border-bottom-color:#6c47ff;}
    .tab-btn:hover{color:#e0e0f0;}
    .tab-panel{display:none;}
    .tab-panel.active{display:block;}
    /* 바디 */
    .admin-body{max-width:960px;margin:0 auto;padding:28px 24px;}
    .page-title{font-size:20px;font-weight:700;margin-bottom:6px;}
    .page-sub{font-size:13px;color:#8b8ba0;margin-bottom:28px;}
    /* 토글 */
    .toggle-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:14px;padding:18px 22px;margin-bottom:20px;display:flex;align-items:center;gap:16px;}
    .toggle-card .info{flex:1;}
    .toggle-card .info h3{font-size:14px;font-weight:600;margin-bottom:3px;}
    .toggle-card .info p{font-size:12px;color:#8b8ba0;}
    .toggle-switch{position:relative;width:48px;height:26px;flex-shrink:0;}
    .toggle-switch input{opacity:0;width:0;height:0;}
    .slider{position:absolute;inset:0;cursor:pointer;background:#3a3a60;border-radius:26px;transition:.3s;}
    .slider:before{content:"";position:absolute;height:20px;width:20px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.3s;}
    input:checked+.slider{background:#6c47ff;}
    input:checked+.slider:before{transform:translateX(22px);}
    /* 섹션 카드 */
    .section-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:14px;padding:22px;margin-bottom:18px;}
    .section-card h3{font-size:14px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
    .section-card .section-desc{font-size:12px;color:#8b8ba0;margin-bottom:14px;}
    .section-card textarea{width:100%;background:#0f0f1a;border:1px solid #3a3a60;border-radius:10px;color:#e0e0f0;font-size:13px;font-family:inherit;line-height:1.6;padding:12px;resize:vertical;outline:none;transition:border-color .2s;}
    .section-card textarea:focus{border-color:#6c47ff;}
    .char-count{font-size:12px;color:#8b8ba0;text-align:right;margin-top:5px;}
    .preset-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;}
    .preset-btn{font-size:12px;padding:4px 11px;border:1px solid #3a3a60;border-radius:20px;background:none;color:#a0a0c0;cursor:pointer;transition:all .2s;white-space:nowrap;}
    .preset-btn:hover{border-color:#6c47ff;color:#9b7cff;background:#6c47ff11;}
    /* 저장바 */
    .save-bar{position:sticky;bottom:0;background:#0f0f1a;border-top:1px solid #2e2e50;padding:14px 0;display:flex;align-items:center;gap:14px;margin-top:6px;}
    .btn-save{padding:11px 28px;background:#6c47ff;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
    .btn-save:hover{background:#7c5bff;}
    .btn-save:disabled{background:#3a3a60;color:#8b8ba0;cursor:not-allowed;}
    .btn-cancel{padding:11px 20px;background:transparent;color:#8b8ba0;border:1.5px solid #3a3a60;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;}
    .btn-cancel:hover{border-color:#6c47ff;color:#9b7cff;}
    .save-status{font-size:13px;color:#8b8ba0;}
    .save-status.ok{color:#22c55e;}
    .save-status.err{color:#ef4444;}
    .preview-box{background:#0f0f1a;border:1px solid #3a3a60;border-radius:10px;padding:14px;font-size:12px;color:#a0c0a0;line-height:1.7;max-height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;margin-top:6px;}
    /* 공통 버튼 */
    .btn-sm{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #3a3a60;background:none;color:#e0e0f0;transition:all .2s;}
    .btn-sm:hover{border-color:#6c47ff;color:#9b7cff;}
    .btn-danger-sm{border-color:#ef4444;color:#ef4444;}
    .btn-danger-sm:hover{background:#ef444420;}
    .btn-primary-sm{background:#6c47ff;border-color:#6c47ff;color:white;}
    .btn-primary-sm:hover{background:#7c5bff;}
    /* 미디어 업로드 */
    .upload-zone{border:2px dashed #3a3a60;border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all .2s;background:#0f0f1a;}
    .upload-zone:hover,.upload-zone.drag{border-color:#6c47ff;background:#6c47ff0a;}
    .upload-zone .icon{font-size:28px;margin-bottom:10px;color:#8b8ba0;}
    .upload-zone p{font-size:13px;color:#8b8ba0;}
    .upload-zone p span{color:#9b7cff;text-decoration:underline;cursor:pointer;}
    /* 미디어 그리드 */
    .media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:20px;}
    .media-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:12px;overflow:hidden;position:relative;}
    .media-card img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;}
    .media-card.bg-card-item img{aspect-ratio:16/9;}
    .media-card .meta{padding:10px 12px;}
    .media-card .meta .name{font-size:13px;font-weight:600;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .media-card .meta .desc{font-size:11px;color:#8b8ba0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .media-card .del-btn{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:#ef44449e;border:none;color:white;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:background .2s;}
    .media-card .del-btn:hover{background:#ef4444;}
    .media-card .custom-badge{position:absolute;top:6px;left:6px;font-size:10px;background:#6c47ffcc;color:white;padding:2px 8px;border-radius:10px;}
    /* 업로드 폼 */
    .upload-form{background:#1a1a2e;border:1px solid #2e2e50;border-radius:14px;padding:22px;margin-top:20px;}
    .upload-form h3{font-size:14px;font-weight:600;margin-bottom:16px;}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
    .form-row.single{grid-template-columns:1fr;}
    .form-label{font-size:12px;color:#8b8ba0;margin-bottom:5px;display:block;}
    .form-input{width:100%;background:#0f0f1a;border:1px solid #3a3a60;border-radius:8px;color:#e0e0f0;font-size:13px;padding:10px 12px;outline:none;transition:border-color .2s;}
    .form-input:focus{border-color:#6c47ff;}
    .upload-preview{width:100%;max-height:180px;object-fit:contain;border-radius:8px;margin-top:8px;display:none;}
    .empty-state{text-align:center;padding:48px 20px;color:#8b8ba0;font-size:13px;}
    .empty-state .icon{font-size:32px;margin-bottom:12px;opacity:.4;}
  </style>
</head>
<body>

<!-- 로그인 -->
<div id="loginOverlay">
  <div class="login-card">
    <div class="logo">🛡️</div>
    <h2>Admin 로그인</h2>
    <p>LookbookAI 관리자 페이지</p>
    <input type="password" id="pwInput" placeholder="비밀번호 입력" onkeydown="if(event.key==='Enter')doLogin()"/>
    <div class="err" id="loginErr"></div>
    <button class="btn-save" style="width:100%" onclick="doLogin()">로그인</button>
  </div>
</div>

<!-- 어드민 메인 -->
<div id="adminMain">
  <header class="admin-header">
    <span class="logo">✨ LookbookAI</span>
    <span class="badge">Admin</span>
    <button class="logout" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> 로그아웃</button>
  </header>

  <!-- 탭 바 -->
  <div class="tab-bar">
    <button class="tab-btn active" onclick="switchTab('prompt')"><i class="fas fa-magic"></i> 프롬프트</button>
    <button class="tab-btn" onclick="switchTab('models')"><i class="fas fa-user-circle"></i> 모델 관리</button>
    <button class="tab-btn" onclick="switchTab('bgs')"><i class="fas fa-image"></i> 배경 관리</button>
    <button class="tab-btn" onclick="switchTab('users')"><i class="fas fa-users"></i> 회원 관리</button>
  </div>

  <!-- ▼ 탭: 프롬프트 -->
  <div class="tab-panel active" id="tabPrompt">
    <div class="admin-body">
      <div class="page-title">🎨 AI 생성 프롬프트 관리</div>
      <div class="page-sub">아래 설정은 사용자에게 노출되지 않으며, 이미지 생성 시 자동으로 적용됩니다. 프롬프트는 한글로 작성하세요.</div>

      <div class="toggle-card">
        <div class="info">
          <h3>어드민 프롬프트 적용</h3>
          <p>OFF 시 기본 프롬프트만 사용됩니다.</p>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="toggleEnabled" checked/>
          <span class="slider"></span>
        </label>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-arrow-right" style="color:#6c47ff;font-size:12px;"></i> 앞에 추가 (Prefix)</h3>
        <div class="section-desc">기본 프롬프트 앞에 삽입. 예: [프리미엄 패션 브랜드 룩북] 고급 에디토리얼 이미지 생성.</div>
        <textarea id="fieldPrefix" rows="3" placeholder="예: [프리미엄 패션 브랜드] 고급 에디토리얼 룩북 이미지를 생성하세요."></textarea>
        <div class="char-count"><span id="cntPrefix">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-camera" style="color:#ff6b9d;font-size:12px;"></i> 스타일 가이드</h3>
        <div class="section-desc">카메라, 조명, 색감, 분위기 등 촬영 스타일을 고정합니다.</div>
        <div class="preset-row">
          <button class="preset-btn" onclick="applyPreset('styleGuide','studio')">🏢 스튜디오</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','editorial')">📸 에디토리얼</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','outdoor')">🌿 아웃도어</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','luxury')">💎 럭셔리</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','minimal')">⬜ 미니멀</button>
          <button class="preset-btn" onclick="applyPreset('styleGuide','streetwear')">🏙️ 스트릿</button>
        </div>
        <textarea id="fieldStyleGuide" rows="5" placeholder="예: 후지필름 GFX 100S 중형 카메라, 자연광 확산, 따뜻한 하이라이트, 패션 에디토리얼 무드..."></textarea>
        <div class="char-count"><span id="cntStyleGuide">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-sliders-h" style="color:#00d4aa;font-size:12px;"></i> 기술 스펙</h3>
        <div class="section-desc">해상도, 선명도, 의상 묘사 방식 등 기술적 제약을 고정합니다.</div>
        <div class="preset-row">
          <button class="preset-btn" onclick="applyPreset('technicalSpec','standard')">📐 스탠다드</button>
          <button class="preset-btn" onclick="applyPreset('technicalSpec','highres')">🔬 초고해상도</button>
          <button class="preset-btn" onclick="applyPreset('technicalSpec','fabric')">🧵 원단 강조</button>
          <button class="preset-btn" onclick="applyPreset('technicalSpec','strict')">🔒 의상 엄격 고정</button>
        </div>
        <textarea id="fieldTechnicalSpec" rows="5" placeholder="예: 초사실적 표현, 직물 질감 극사실 재현, 의류 드레이프 완벽 재현, 아티팩트 없음..."></textarea>
        <div class="char-count"><span id="cntTechnicalSpec">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-arrow-left" style="color:#6c47ff;font-size:12px;"></i> 뒤에 추가 (Suffix)</h3>
        <div class="section-desc">마지막에 삽입. 네거티브 지시나 최종 강조에 활용하세요.</div>
        <textarea id="fieldSuffix" rows="3" placeholder="예: 워터마크 없음. 텍스트 오버레이 없음. 인쇄 가능 품질."></textarea>
        <div class="char-count"><span id="cntSuffix">0</span>자</div>
      </div>

      <div class="section-card">
        <h3><i class="fas fa-eye" style="color:#f59e0b;font-size:12px;"></i> 최종 프롬프트 미리보기</h3>
        <div class="section-desc">실제 생성 시 조합되는 프롬프트 구조입니다.</div>
        <div class="preview-box" id="previewBox">미리보기 로딩 중...</div>
      </div>

      <div class="save-bar">
        <button class="btn-save" id="saveBtn" onclick="saveConfig()"><i class="fas fa-save"></i> 저장하기</button>
        <button class="btn-sm" onclick="loadConfig()"><i class="fas fa-redo"></i> 초기화</button>
        <span class="save-status" id="saveStatus"></span>
      </div>
    </div>
  </div>

  <!-- ▼ 탭: 모델 관리 -->
  <div class="tab-panel" id="tabModels">
    <div class="admin-body">
      <div class="page-title">👤 모델 관리</div>
      <div class="page-sub">업로드한 모델은 사용자 화면에서 기본 제공 모델보다 먼저 표시됩니다.</div>

      <!-- 다중 업로드 폼 -->
      <div class="upload-form">
        <h3><i class="fas fa-plus-circle" style="color:#6c47ff;"></i> 모델 추가 <span style="font-size:13px;font-weight:400;color:#888;">(여러 장 동시 업로드 가능)</span></h3>

        <!-- 드롭존 -->
        <div class="upload-zone multi-zone" id="modelUploadZone" onclick="document.getElementById('modelFileInput').click()">
          <div class="icon"><i class="fas fa-images"></i></div>
          <p>클릭하거나 이미지를 드래그하세요<br/><span>여러 파일 선택 가능</span> (JPG, PNG, WEBP)</p>
        </div>
        <input type="file" id="modelFileInput" accept="image/*" multiple style="display:none" onchange="onModelFilesSelect(event)"/>

        <!-- 선택된 파일 미리보기 그리드 -->
        <div id="modelStagingGrid" style="display:none;margin-top:16px;">
          <div style="font-size:13px;font-weight:600;color:#444;margin-bottom:10px;">
            선택된 이미지 — 이름을 입력 후 등록하세요
          </div>
          <div id="modelStagingItems" style="display:flex;flex-wrap:wrap;gap:14px;"></div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:16px;">
            <button class="btn-save" onclick="uploadModels()"><i class="fas fa-upload"></i> 전체 등록</button>
            <button class="btn-cancel" onclick="clearModelStaging()"><i class="fas fa-times"></i> 초기화</button>
            <span class="save-status" id="modelUploadStatus"></span>
          </div>
        </div>
      </div>

      <!-- 커스텀 모델 목록 -->
      <div id="customModelGrid"></div>
    </div>
  </div>

  <!-- ▼ 탭: 배경 관리 -->
  <div class="tab-panel" id="tabBgs">
    <div class="admin-body">
      <div class="page-title">🖼️ 배경 관리</div>
      <div class="page-sub">업로드한 배경은 사용자 화면에서 기본 배경보다 먼저 표시됩니다.</div>

      <!-- 다중 업로드 폼 -->
      <div class="upload-form">
        <h3><i class="fas fa-plus-circle" style="color:#6c47ff;"></i> 배경 추가 <span style="font-size:13px;font-weight:400;color:#888;">(여러 장 동시 업로드 가능)</span></h3>

        <!-- 기본 카테고리 (공통 적용) -->
        <div class="form-row single" style="margin-bottom:10px;">
          <div>
            <label class="form-label">기본 카테고리 <span style="color:#888;font-weight:400;">(공통 적용, 개별 변경 가능)</span></label>
            <input class="form-input" id="bgDefaultCategory" placeholder="예: 스튜디오, 야외, 럭셔리" style="max-width:320px;"/>
          </div>
        </div>

        <!-- 드롭존 -->
        <div class="upload-zone multi-zone" id="bgUploadZone" onclick="document.getElementById('bgFileInput').click()">
          <div class="icon"><i class="fas fa-images"></i></div>
          <p>클릭하거나 이미지를 드래그하세요<br/><span>여러 파일 선택 가능</span> (JPG, PNG, WEBP)</p>
        </div>
        <input type="file" id="bgFileInput" accept="image/*" multiple style="display:none" onchange="onBgFilesSelect(event)"/>

        <!-- 선택된 파일 미리보기 그리드 -->
        <div id="bgStagingGrid" style="display:none;margin-top:16px;">
          <div style="font-size:13px;font-weight:600;color:#444;margin-bottom:10px;">
            선택된 이미지 — 이름을 입력 후 등록하세요
          </div>
          <div id="bgStagingItems" style="display:flex;flex-wrap:wrap;gap:14px;"></div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:16px;">
            <button class="btn-save" onclick="uploadBgs()"><i class="fas fa-upload"></i> 전체 등록</button>
            <button class="btn-cancel" onclick="clearBgStaging()"><i class="fas fa-times"></i> 초기화</button>
            <span class="save-status" id="bgUploadStatus"></span>
          </div>
        </div>
      </div>

      <div id="customBgGrid"></div>
    </div>
  </div>

  <!-- ▼ 탭: 회원 관리 -->
  <div class="tab-panel" id="tabUsers">
    <div class="admin-body">
      <div class="page-title">👥 회원 관리</div>
      <div class="page-sub">가입된 회원 목록을 조회하고 상태를 관리합니다.</div>

      <!-- 통계 카드 -->
      <div id="userStats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:24px;">
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#9b7cff;" id="statTotal">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">전체 회원</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#22c55e;" id="statActive">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">활성</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#ef4444;" id="statSuspended">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">정지</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#f59e0b;" id="statToday">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">오늘 가입</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#FEE500;" id="statKakao">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">카카오</div>
        </div>
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#4285F4;" id="statGoogle">-</div>
          <div style="font-size:12px;color:#8b8ba0;margin-top:4px;">구글</div>
        </div>
      </div>

      <!-- 필터/검색 바 -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <input type="text" id="userSearch" class="form-input" placeholder="🔍 이름/이메일 검색..." style="flex:1;min-width:200px;" oninput="filterUsers()"/>
        <select id="userStatusFilter" class="form-input" style="width:130px;" onchange="filterUsers()">
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="suspended">정지</option>
        </select>
        <select id="userProviderFilter" class="form-input" style="width:130px;" onchange="filterUsers()">
          <option value="">전체 가입경로</option>
          <option value="email">이메일</option>
          <option value="kakao">카카오</option>
          <option value="google">구글</option>
        </select>
        <button class="btn-sm btn-primary-sm" onclick="loadUsers()">🔄 새로고침</button>
      </div>

      <!-- 회원 목록 테이블 -->
      <div class="section-card" style="padding:0;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#0f0f1a;border-bottom:1px solid #2e2e50;">
              <th style="text-align:left;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">회원</th>
              <th style="text-align:left;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">가입경로</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">크레딧</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">상태</th>
              <th style="text-align:left;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">가입일</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">관리</th>
            </tr>
          </thead>
          <tbody id="userTableBody">
            <tr><td colspan="6" style="text-align:center;padding:40px;color:#8b8ba0;font-size:13px;">로딩 중...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <div id="userPagination" style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px;"></div>
    </div>
  </div>

</div>

<script>
const NL = String.fromCharCode(10)
let adminPassword = ''

// ── 프리셋 데이터 (한글) ──
const PRESETS = {
  styleGuide: {
    studio:     'PERSON SWAP — Studio Scene: Replace person identity and clothing only. Preserve exact original pose, studio lighting direction, white cyclorama background, and all scene elements. The replaced model must match the same camera angle and eye-level. Lighting: neutral-warm softbox, fill reflector, subtle rim light. Magazine cover quality seamless compositing.',
    editorial:  'PERSON SWAP — Editorial Scene: Replace person identity and clothing only. Preserve exact original pose, natural diffused window light, warm highlights, and all scene elements. The replaced model must appear naturally integrated at the same perspective. Fujifilm GFX aesthetic: elegant, sophisticated magazine editorial quality.',
    outdoor:    'PERSON SWAP — Outdoor Scene: Replace person identity and clothing only. Preserve exact original pose, golden-hour natural lighting, background bokeh, and all scene elements. The replaced model must cast realistic ground shadows matching the scene lighting. Warm cinematic color grade. Fresh lifestyle fashion feel.',
    luxury:     'PERSON SWAP — Luxury Scene: Replace person identity and clothing only. Preserve exact original pose, dramatic chiaroscuro lighting, deep shadows, rich contrast, and all scene elements. The replaced model must be seamlessly integrated. High fashion luxury brand aesthetic: opulent, refined, top editorial quality.',
    minimal:    'PERSON SWAP — Minimal Scene: Replace person identity and clothing only. Preserve exact original pose, flat even diffused lighting, no shadows, clean background, and all scene elements. The replaced model must blend seamlessly. Scandinavian-inspired: restrained, elegant, clean aesthetic.',
    streetwear: 'PERSON SWAP — Street Scene: Replace person identity and clothing only. Preserve exact original pose, urban environment, natural available light, slight authentic grain, and all scene elements. The replaced model must appear genuinely present in the location. Dynamic, authentic street style editorial energy.',
  },
  technicalSpec: {
    standard:   '초사실적 표현. 의류에 선명한 포커스, 배경의 자연스러운 얕은 심도. 전문 색 보정. 아티팩트 없음, 왜곡 없음. 인쇄 가능 품질.',
    highres:    '초사실적 8K 품질. 피부 질감과 직물 미세 디테일의 극사실 재현. 서브픽셀 선명한 엣지. HDR 다이나믹 레인지. 대형 인쇄 및 빌보드 사용에 완벽.',
    fabric:     '극한의 직물 디테일 재현: 실 수가 보이고, 직조 패턴 정확하며, 소재 무게감이 시각적으로 전달됨. 의류는 착용 가능하고 입체적으로 표현. 드레이프와 실루엣은 자연스럽고 중력에 맞게 표현.',
    strict:     '절대 제약: 참조 이미지의 의류를 창의적 변형 없이 그대로 재현. 모든 솔기, 스티치, 단추, 지퍼, 프린트, 자수, 색상이 정확히 일치해야 함. 어떤 의류 요소도 단순화, 양식화 또는 재해석 금지. 위반은 허용되지 않음.',
  },
}

// ─── 탭 전환 ───
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    const names = ['prompt','models','bgs','users']
    b.classList.toggle('active', names[i] === name)
  })
  document.getElementById('tabPrompt').classList.toggle('active', name === 'prompt')
  document.getElementById('tabModels').classList.toggle('active', name === 'models')
  document.getElementById('tabBgs').classList.toggle('active', name === 'bgs')
  document.getElementById('tabUsers').classList.toggle('active', name === 'users')
  if (name === 'models') loadCustomModels()
  if (name === 'bgs')    loadCustomBgs()
  if (name === 'users')  loadUsers()
}

// ─── 회원 관리 ───
let allUsers = []
let usersPage = 1
const USERS_PER_PAGE = 20

async function loadUsers() {
  try {
    const res = await fetch('/api/admin/stats', {headers:{'X-Admin-Password':adminPassword}})
    const stats = await res.json()
    if (stats.success) {
      const s = stats.stats
      document.getElementById('statTotal').textContent     = s.total?.toLocaleString() || 0
      document.getElementById('statActive').textContent    = s.active?.toLocaleString() || 0
      document.getElementById('statSuspended').textContent = s.suspended?.toLocaleString() || 0
      document.getElementById('statToday').textContent     = s.today?.toLocaleString() || 0
      document.getElementById('statKakao').textContent     = (s.by_provider?.kakao || 0) + '명'
      document.getElementById('statGoogle').textContent    = (s.by_provider?.google || 0) + '명'
    }
  } catch(e) {}

  const q      = document.getElementById('userSearch')?.value || ''
  const status = document.getElementById('userStatusFilter')?.value || ''
  const prov   = document.getElementById('userProviderFilter')?.value || ''

  try {
    const params = new URLSearchParams({ page: usersPage, limit: USERS_PER_PAGE })
    if (q)      params.set('q', q)
    if (status) params.set('status', status)
    if (prov)   params.set('provider', prov)

    const res = await fetch('/api/admin/users?' + params.toString(), {
      headers: {'X-Admin-Password': adminPassword}
    })
    const data = await res.json()
    if (!data.success) { renderUserTable([]); return }

    allUsers = data.users || []
    renderUserTable(allUsers)
    renderUserPagination(data.total || allUsers.length, data.page || 1, data.limit || USERS_PER_PAGE)
  } catch(e) {
    document.getElementById('userTableBody').innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;font-size:13px;">⚠️ 로딩 실패</td></tr>'
  }
}

function filterUsers() {
  usersPage = 1
  loadUsers()
}

function renderUserTable(users) {
  const tbody = document.getElementById('userTableBody')
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#8b8ba0;font-size:13px;">조건에 맞는 회원이 없습니다</td></tr>'
    return
  }
  const providerBadge = {
    kakao:  '<span style="font-size:11px;background:#FEE500;color:#3C1E1E;padding:2px 8px;border-radius:10px;font-weight:700;">카카오</span>',
    google: '<span style="font-size:11px;background:#4285F4;color:white;padding:2px 8px;border-radius:10px;font-weight:700;">구글</span>',
    email:  '<span style="font-size:11px;background:#3a3a60;color:#e0e0f0;padding:2px 8px;border-radius:10px;font-weight:700;">이메일</span>',
  }
  const statusBadge = {
    active:    '<span style="font-size:11px;background:#22c55e22;color:#22c55e;padding:2px 8px;border-radius:10px;border:1px solid #22c55e44;">활성</span>',
    suspended: '<span style="font-size:11px;background:#ef444422;color:#ef4444;padding:2px 8px;border-radius:10px;border:1px solid #ef444444;">정지</span>',
    deleted:   '<span style="font-size:11px;background:#6b728022;color:#6b7280;padding:2px 8px;border-radius:10px;border:1px solid #6b728044;">삭제됨</span>',
  }
  tbody.innerHTML = users.map(function(u) {
    var avatar = u.avatar_url
      ? '<img src="' + u.avatar_url + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;">'
      : '<div style="width:28px;height:28px;border-radius:50%;background:#6c47ff44;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">' + ((u.name||'?')[0]) + '</div>'
    var joined = u.created_at ? u.created_at.slice(0,10) : '-'
    var isAdmin = u.role === 'admin'
    var adminBadge = isAdmin ? ' <span style="font-size:10px;background:#6c47ff;color:white;padding:1px 6px;border-radius:8px;">Admin</span>' : ''
    var uid = String(u.id)
    var statusBtn = ''
    if (u.status === 'active') {
      statusBtn = '<button data-uid="' + uid + '" data-action="suspend" class="btn-sm btn-danger-sm" style="font-size:11px;padding:4px 10px;">정지</button>'
    } else if (u.status === 'suspended') {
      statusBtn = '<button data-uid="' + uid + '" data-action="activate" class="btn-sm btn-primary-sm" style="font-size:11px;padding:4px 10px;">활성화</button>'
    }
    var deleteBtn = !isAdmin ? '<button data-uid="' + uid + '" data-name="' + escHtml(u.name||'') + '" data-email="' + escHtml(u.email||'') + '" data-action="delete" class="btn-sm btn-danger-sm" style="font-size:11px;padding:4px 10px;">삭제</button>' : ''
    var credits = (u.credits != null) ? u.credits : 0
    return '<tr style="border-bottom:1px solid #1e1e3a;">'
      + '<td style="padding:12px 16px;">'
      +   '<div style="display:flex;align-items:center;gap:10px;">'
      +     avatar
      +     '<div>'
      +       '<div style="font-size:13px;font-weight:600;">' + (u.name || '(이름 없음)') + adminBadge + '</div>'
      +       '<div style="font-size:11px;color:#8b8ba0;">' + u.email + '</div>'
      +     '</div>'
      +   '</div>'
      + '</td>'
      + '<td style="padding:12px 16px;">' + (providerBadge[u.provider] || u.provider) + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">'
      +   '<span style="font-size:14px;font-weight:700;color:#9b7cff;">' + credits + '</span>'
      +   '<span style="font-size:10px;color:#8b8ba0;"> 크레딧</span>'      +   '<div style="margin-top:4px;display:flex;gap:4px;justify-content:center;">'      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="grant" style="font-size:10px;padding:2px 8px;background:#6c47ff33;border:1px solid #6c47ff66;border-radius:6px;color:#9b7cff;cursor:pointer;font-weight:600;">지급</button>'      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="credits" style="font-size:10px;padding:2px 8px;background:none;border:1px solid #3a3a60;border-radius:6px;color:#8b8ba0;cursor:pointer;">설정</button>'      +   '</div>'
      + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">' + (statusBadge[u.status] || u.status) + '</td>'
      + '<td style="padding:12px 16px;font-size:12px;color:#8b8ba0;">' + joined + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">'
      +   '<div style="display:flex;gap:6px;justify-content:center;">'
      +     statusBtn + deleteBtn
      +   '</div>'
      + '</td>'
      + '</tr>'
  }).join('')
}

function renderUserPagination(total, page, limit) {
  var totalPages = Math.ceil(total / limit)
  var pag = document.getElementById('userPagination')
  if (!pag || totalPages <= 1) { if (pag) pag.innerHTML = ''; return }
  var html = ''
  if (page > 1) html += '<button class="btn-sm" onclick="goUsersPage(' + (page-1) + ')">‹ 이전</button>'
  for (var i = Math.max(1, page-2); i <= Math.min(totalPages, page+2); i++) {
    html += '<button class="btn-sm' + (i===page ? ' btn-primary-sm' : '') + '" onclick="goUsersPage(' + i + ')">' + i + '</button>'
  }
  if (page < totalPages) html += '<button class="btn-sm" onclick="goUsersPage(' + (page+1) + ')">다음 ›</button>'
  html += '<span style="font-size:12px;color:#8b8ba0;margin-left:8px;">총 ' + total + '명</span>'
  pag.innerHTML = html
}


function goUsersPage(p) { usersPage = p; loadUsers() }

async function setUserStatus(id, status) {
  if (!confirm('이 회원을 ' + (status === 'active' ? '활성화' : '정지') + '하시겠습니까?')) return
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ status })
    })
    const data = await res.json()
    if (data.success) { showAdminToast(status === 'active' ? '활성화 완료' : '정지 완료', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

async function adjustCredits(id, current) {
  // 절대값 설정 (설정 버튼)
  const val = prompt('크레딧 절대값 설정 (현재: ' + current + '크레딧) - 새 크레딧 수를 입력하세요:', current)
  if (val === null) return
  const credits = parseInt(val)
  if (isNaN(credits) || credits < 0) { showAdminToast('올바른 크레딧 수를 입력하세요', 'err'); return }
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ credits })
    })
    const data = await res.json()
    if (data.success) { showAdminToast('크레딧 설정 완료 → ' + (data.newCredits ?? credits) + '크레딧', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

async function grantCredits(id, current) {
  // 크레딧 지급 (증감) — 지급 버튼
  const val = prompt('크레딧 지급 (현재: ' + current + '크레딧) - 지급할 크레딧 수 입력 (음수=차감) / 빠른 지급: 100/500/1000', '1000')
  if (val === null) return
  const amount = parseInt(val)
  if (isNaN(amount) || amount === 0) { showAdminToast('0이 아닌 숫자를 입력하세요', 'err'); return }
  const action = amount > 0 ? '지급' : '차감'
  if (!confirm('"' + Math.abs(amount) + '크레딧"을 ' + action + '하시겠습니까? 현재: ' + current + ' → 변경 후: ' + (current + amount))) return
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ add_credits: amount })
    })
    const data = await res.json()
    if (data.success) { showAdminToast('크레딧 ' + action + ' 완료 → ' + data.newCredits + '크레딧', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

async function deleteUser(id, name, email) {
  if (!confirm('"' + name + '" (' + email + ') 회원을 삭제하시겠습니까? 삭제 후 복구가 어렵습니다.')) return
  try {
    const res = await fetch('/api/admin/users/' + id, {
      method: 'DELETE',
      headers: {'X-Admin-Password':adminPassword}
    })
    const data = await res.json()
    if (data.success) { showAdminToast('삭제 완료', 'ok'); loadUsers() }
    else showAdminToast(data.message || '실패', 'err')
  } catch(e) { showAdminToast('서버 오류', 'err') }
}

function showAdminToast(msg, type) {
  const bar = document.querySelector('.save-bar')
  const el = document.querySelector('.save-status')
  if (el) {
    el.textContent = msg
    el.className = 'save-status ' + (type === 'ok' ? 'ok' : 'err')
    setTimeout(() => { if (el) el.textContent = '' }, 3000)
  }
}

// ─── 로그인 ───
async function doLogin() {
  const pw = document.getElementById('pwInput').value
  const err = document.getElementById('loginErr')
  err.textContent = ''
  try {
    const res = await fetch('/api/admin/auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({password: pw}) })
    const data = await res.json()
    if (data.success) {
      adminPassword = pw
      document.getElementById('loginOverlay').style.display = 'none'
      document.getElementById('adminMain').style.display = 'block'
      loadConfig()
    } else { err.textContent = '비밀번호가 올바르지 않습니다.' }
  } catch(e) { err.textContent = '서버 오류가 발생했습니다.' }
}
function doLogout() {
  adminPassword = ''
  document.getElementById('loginOverlay').style.display = 'flex'
  document.getElementById('adminMain').style.display = 'none'
  document.getElementById('pwInput').value = ''
}

// ─── 프롬프트 로드/저장 ───
async function loadConfig() {
  try {
    const res = await fetch('/api/admin/prompt', {headers:{'X-Admin-Password':adminPassword}})
    const data = await res.json()
    if (!data.success) return
    const cfg = data.config
    document.getElementById('toggleEnabled').checked = cfg.enabled
    document.getElementById('fieldPrefix').value = cfg.prefix || ''
    document.getElementById('fieldStyleGuide').value = cfg.styleGuide || ''
    document.getElementById('fieldTechnicalSpec').value = cfg.technicalSpec || ''
    document.getElementById('fieldSuffix').value = cfg.suffix || ''
    updateAllCounts(); updatePreview()
  } catch(e) { console.error(e) }
}
async function saveConfig() {
  const btn = document.getElementById('saveBtn')
  const status = document.getElementById('saveStatus')
  btn.disabled = true; status.textContent = '저장 중...'; status.className = 'save-status'
  try {
    const res = await fetch('/api/admin/prompt', {
      method: 'PUT',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({
        enabled: document.getElementById('toggleEnabled').checked,
        prefix: document.getElementById('fieldPrefix').value,
        styleGuide: document.getElementById('fieldStyleGuide').value,
        technicalSpec: document.getElementById('fieldTechnicalSpec').value,
        suffix: document.getElementById('fieldSuffix').value,
      }),
    })
    const data = await res.json()
    if (data.success) { status.textContent = '저장 완료 ' + new Date().toLocaleTimeString('ko-KR'); status.className = 'save-status ok' }
    else { status.textContent = '저장 실패'; status.className = 'save-status err' }
  } catch(e) { status.textContent = '네트워크 오류'; status.className = 'save-status err' }
  finally { btn.disabled = false }
}
function applyPreset(field, key) {
  const m = {styleGuide:'fieldStyleGuide', technicalSpec:'fieldTechnicalSpec'}
  const el = document.getElementById(m[field]); if (!el) return
  el.value = PRESETS[field][key] || ''
  updateCharCount(field==='styleGuide'?'cntStyleGuide':'cntTechnicalSpec', el.value); updatePreview()
}
function updateCharCount(id, text) { const el=document.getElementById(id); if(el) el.textContent=text.length }
function updateAllCounts() {
  ['fieldPrefix','fieldStyleGuide','fieldTechnicalSpec','fieldSuffix'].forEach(id => {
    const cntId = {fieldPrefix:'cntPrefix',fieldStyleGuide:'cntStyleGuide',fieldTechnicalSpec:'cntTechnicalSpec',fieldSuffix:'cntSuffix'}[id]
    updateCharCount(cntId, document.getElementById(id).value)
  })
}
function updatePreview() {
  const enabled = document.getElementById('toggleEnabled').checked
  const prefix = document.getElementById('fieldPrefix').value.trim()
  const styleGuide = document.getElementById('fieldStyleGuide').value.trim()
  const technicalSpec = document.getElementById('fieldTechnicalSpec').value.trim()
  const suffix = document.getElementById('fieldSuffix').value.trim()
  const BASE = '[기본 프롬프트: 전문 패션 룩북 사진 생성. 이미지1=의류, 이미지2=모델, 이미지3=배경...]'
  let preview = ''
  if (!enabled) {
    preview = '어드민 프롬프트 OFF - 기본 프롬프트만 사용됩니다.' + NL + NL + BASE
  } else {
    const parts = []
    if (prefix) parts.push('[PREFIX]' + NL + prefix)
    parts.push('[BASE PROMPT]' + NL + BASE)
    if (styleGuide) parts.push('[STYLE GUIDE]' + NL + styleGuide)
    if (technicalSpec) parts.push('[TECHNICAL SPEC]' + NL + technicalSpec)
    if (suffix) parts.push('[SUFFIX]' + NL + suffix)
    preview = parts.join(NL + NL)
  }
  document.getElementById('previewBox').textContent = preview
}

// ─── 공통: FileReader → base64 (리사이즈+압축) ───
// D1 row 제한(~1MB) 및 Workers body 한계 방지: 최대 800px, JPEG 0.85 품질
function readFileAsBase64(file) {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = e => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX }
          else        { w = Math.round(w * MAX / h); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = e.target.result
    }
    r.readAsDataURL(file)
  })
}

// ══════════════════════════════════════════════
//  모델 관리 — 다중 업로드
// ══════════════════════════════════════════════
let modelStagingList = []  // [{ file, base64, name, gender, age, mood }]

async function onModelFilesSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const status = document.getElementById('modelUploadStatus')
  status.textContent = 'AI 자동 라벨링 중...'; status.className = 'save-status'
  for (const file of files) {
    const base64 = await readFileAsBase64(file)
    const defaultName = file.name.replace(/.[^.]+$/, '')
    let gender = '미분류', age = '미분류', mood = '미분류'
    try {
      const lr = await fetch('/api/admin/auto-label', {
        method:'POST',
        headers:{'Content-Type':'application/json','X-Admin-Password':adminPassword},
        body:JSON.stringify({ type:'model', imageBase64: base64 })
      })
      const ld = await lr.json()
      if (ld.success && ld.labels) { gender=ld.labels.gender; age=ld.labels.age; mood=ld.labels.mood }
    } catch(err) { console.warn('auto-label 실패:', err) }
    modelStagingList.push({ file, base64, name: defaultName, gender, age, mood })
  }
  e.target.value = ''
  status.textContent = ''; status.className = 'save-status'
  renderModelStaging()
}

function renderModelStaging() {
  const grid = document.getElementById('modelStagingGrid')
  const container = document.getElementById('modelStagingItems')
  if (!modelStagingList.length) { grid.style.display = 'none'; return }
  grid.style.display = 'block'
  document.getElementById('modelUploadZone').style.borderColor = '#6c47ff'
  const mkOpts = (list, sel) => list.map(v => '<option value="'+v+'"'+(v===sel?' selected':'')+'>'+v+'</option>').join('')
  container.innerHTML = modelStagingList.map((item, i) =>
    '<div style="width:160px;flex-shrink:0;">' +
    '<div style="position:relative;width:160px;height:160px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
    '<img src="' + item.base64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
    '<button onclick="removeModelStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;line-height:22px;text-align:center;padding:0;">✕</button>' +
    '</div>' +
    '<input class="form-input" value="' + escHtml(item.name) + '" oninput="modelStagingList[' + i + '].name=this.value" placeholder="이름" style="margin-top:6px;width:100%;box-sizing:border-box;font-size:11px;padding:4px 7px;"/>' +
    '<select class="form-input" onchange="modelStagingList['+i+'].gender=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(['미분류','여성','남성'], item.gender) + '</select>' +
    '<select class="form-input" onchange="modelStagingList['+i+'].age=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(['미분류','10대','20대','30대','40대'], item.age) + '</select>' +
    '<select class="form-input" onchange="modelStagingList['+i+'].mood=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(['미분류','로맨틱','보이시','캐주얼','시크','내추럴'], item.mood) + '</select>' +
    '</div>'
  ).join('')
}
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;') }

function removeModelStaging(idx) {
  modelStagingList.splice(idx, 1)
  renderModelStaging()
}

function clearModelStaging() {
  modelStagingList = []
  document.getElementById('modelUploadZone').style.borderColor = ''
  document.getElementById('modelStagingGrid').style.display = 'none'
  document.getElementById('modelUploadStatus').textContent = ''
}

async function uploadModels() {
  const status = document.getElementById('modelUploadStatus')
  if (!modelStagingList.length) { status.textContent = '이미지를 선택하세요'; status.className = 'save-status err'; return }
  const missing = modelStagingList.filter(i => !i.name.trim())
  if (missing.length) { status.textContent = '이름이 비어있는 항목이 있습니다'; status.className = 'save-status err'; return }
  status.textContent = '등록 중...'; status.className = 'save-status'
  try {
    const payload = modelStagingList.map(i => ({
      name: i.name.trim(), desc: i.name.trim(),
      gender: i.gender || '미분류',
      age: i.age || '미분류',
      mood: i.mood || '미분류',
      imageBase64: i.base64
    }))
    const res = await fetch('/api/admin/models', {
      method: 'POST',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      status.textContent = data.count + '개 등록 완료!'; status.className = 'save-status ok'
      clearModelStaging()
      loadCustomModels()
    } else { status.textContent = data.message || '등록 실패'; status.className = 'save-status err' }
  } catch(e) { status.textContent = '오류: ' + e.message; status.className = 'save-status err' }
}

async function deleteModel(id) {
  if (!confirm('이 모델을 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/models/' + id, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadCustomModels()
}
async function loadCustomModels() {
  const grid = document.getElementById('customModelGrid')
  try {
    const res = await fetch('/api/admin/models', {headers:{'X-Admin-Password':adminPassword}})
    const data = await res.json()
    if (!data.models || data.models.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="icon"><i class="fas fa-user-slash"></i></div><p>등록된 커스텀 모델이 없습니다.</p></div>'
      return
    }
    grid.innerHTML = '<div style="font-size:14px;font-weight:600;margin:20px 0 12px;">커스텀 모델 (' + data.models.length + '개)</div><div class="media-grid">' +
      data.models.map(m =>
        '<div class="media-card">' +
        '<img src="/api/proxy/custom-model/' + m.id + '" alt="' + m.name + '" loading="lazy"/>' +
        '<span class="custom-badge">커스텀</span>' +
        '<button class="del-btn" onclick="event.stopPropagation();deleteModel(' + "'" + m.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta"><div class="name">' + m.name + '</div><div class="desc">' + (m.desc || '-') + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { console.error('loadCustomModels error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

// ══════════════════════════════════════════════
//  배경 관리 — 다중 업로드
// ══════════════════════════════════════════════
let bgStagingList = []  // [{ file, base64, name, category, mood }]

async function onBgFilesSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  const status = document.getElementById('bgUploadStatus')
  status.textContent = 'AI 자동 라벨링 중...'; status.className = 'save-status'
  for (const file of files) {
    const base64 = await readFileAsBase64(file)
    const defaultName = file.name.replace(/.[^.]+$/, '')
    let category = '스튜디오', mood = '미니멀', autoName = defaultName
    try {
      const lr = await fetch('/api/admin/auto-label', {
        method:'POST',
        headers:{'Content-Type':'application/json','X-Admin-Password':adminPassword},
        body:JSON.stringify({ type:'background', imageBase64: base64 })
      })
      const ld = await lr.json()
      if (ld.success && ld.labels) {
        category = ld.labels.category || '스튜디오'
        mood     = ld.labels.mood || '미니멀'
        if (ld.labels.name_ko) autoName = ld.labels.name_ko
      }
    } catch(err) { console.warn('bg auto-label 실패:', err) }
    bgStagingList.push({ file, base64, name: autoName, category, mood })
  }
  e.target.value = ''
  status.textContent = ''; status.className = 'save-status'
  renderBgStaging()
}

function renderBgStaging() {
  const grid = document.getElementById('bgStagingGrid')
  const container = document.getElementById('bgStagingItems')
  if (!bgStagingList.length) { grid.style.display = 'none'; return }
  grid.style.display = 'block'
  document.getElementById('bgUploadZone').style.borderColor = '#6c47ff'
  const mkOpts = (list, sel) => list.map(v => '<option value="'+v+'"'+(v===sel?' selected':'')+'>'+v+'</option>').join('')
  const catList = ['스튜디오','야외/자연','도심/거리','인테리어','컨셉/특수']
  const moodList = ['미니멀','내추럴','모던','빈티지','럭셔리','스트릿']
  container.innerHTML = bgStagingList.map((item, i) =>
    '<div style="width:160px;flex-shrink:0;">' +
    '<div style="position:relative;width:160px;height:120px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
    '<img src="' + item.base64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
    '<button onclick="removeBgStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;line-height:22px;text-align:center;padding:0;">✕</button>' +
    '</div>' +
    '<input class="form-input" value="' + escHtml(item.name) + '" oninput="bgStagingList[' + i + '].name=this.value" placeholder="배경 이름" style="margin-top:6px;width:100%;box-sizing:border-box;font-size:11px;padding:4px 7px;"/>' +
    '<select class="form-input" onchange="bgStagingList['+i+'].category=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(catList, item.category) + '</select>' +
    '<select class="form-input" onchange="bgStagingList['+i+'].mood=this.value" style="margin-top:3px;width:100%;font-size:11px;padding:3px 6px;">' + mkOpts(moodList, item.mood) + '</select>' +
    '</div>'
  ).join('')
}

function removeBgStaging(idx) {
  bgStagingList.splice(idx, 1)
  renderBgStaging()
}

function clearBgStaging() {
  bgStagingList = []
  document.getElementById('bgUploadZone').style.borderColor = ''
  document.getElementById('bgStagingGrid').style.display = 'none'
  document.getElementById('bgUploadStatus').textContent = ''
}

async function uploadBgs() {
  const status = document.getElementById('bgUploadStatus')
  if (!bgStagingList.length) { status.textContent = '이미지를 선택하세요'; status.className = 'save-status err'; return }
  const missing = bgStagingList.filter(i => !i.name.trim())
  if (missing.length) { status.textContent = '이름이 비어있는 항목이 있습니다'; status.className = 'save-status err'; return }
  status.textContent = '등록 중...'; status.className = 'save-status'
  try {
    const payload = bgStagingList.map(i => ({
      name: i.name.trim(),
      bgDesc: i.name.trim(),
      category: (i.category || '커스텀').trim(),
      imageBase64: i.base64,
    }))
    const res = await fetch('/api/admin/backgrounds', {
      method: 'POST',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      status.textContent = data.count + '개 등록 완료!'; status.className = 'save-status ok'
      clearBgStaging()
      loadCustomBgs()
    } else { status.textContent = data.message || '등록 실패'; status.className = 'save-status err' }
  } catch(e) { status.textContent = '오류: ' + e.message; status.className = 'save-status err' }
}

async function deleteBg(id) {
  if (!confirm('이 배경을 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/backgrounds/' + id, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadCustomBgs()
}
async function loadCustomBgs() {
  const grid = document.getElementById('customBgGrid')
  try {
    const res = await fetch('/api/admin/backgrounds', {headers:{'X-Admin-Password':adminPassword}})
    const data = await res.json()
    if (!data.backgrounds || data.backgrounds.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="icon"><i class="fas fa-image"></i></div><p>등록된 커스텀 배경이 없습니다.</p></div>'
      return
    }
    grid.innerHTML = '<div style="font-size:14px;font-weight:600;margin:20px 0 12px;">커스텀 배경 (' + data.backgrounds.length + '개)</div><div class="media-grid">' +
      data.backgrounds.map(b =>
        '<div class="media-card bg-card-item">' +
        '<img src="/api/proxy/custom-bg/' + b.id + '" alt="' + b.name + '" loading="lazy"/>' +
        '<span class="custom-badge">커스텀</span>' +
        '<button class="del-btn" onclick="event.stopPropagation();deleteBg(' + "'" + b.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta"><div class="name">' + b.name + '</div><div class="desc">' + b.category + ' · ' + (b.bgDesc || '-') + '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { console.error('loadCustomBgs error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

// ─── 드래그앤드롭 (다중) ───
function setupDrop(zoneId, onFiles) {
  const zone = document.getElementById(zoneId)
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag') })
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'))
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag')
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    onFiles({ target: { files, value: '' } })
  })
}

// ─── 이벤트 바인딩 ───
document.addEventListener('DOMContentLoaded', () => {
  ['fieldPrefix','fieldStyleGuide','fieldTechnicalSpec','fieldSuffix'].forEach(id => {
    const el = document.getElementById(id)
    const cntId = {fieldPrefix:'cntPrefix',fieldStyleGuide:'cntStyleGuide',fieldTechnicalSpec:'cntTechnicalSpec',fieldSuffix:'cntSuffix'}[id]
    el.addEventListener('input', () => { updateCharCount(cntId, el.value); updatePreview() })
  })
  document.getElementById('toggleEnabled').addEventListener('change', updatePreview)
  document.getElementById('pwInput').focus()
  setupDrop('modelUploadZone', onModelFilesSelect)
  setupDrop('bgUploadZone', onBgFilesSelect)

  // 이벤트 위임: 유저 테이블 버튼 처리 (onclick 대신 data-action 사용)
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]')
    if (!btn) return
    var action = btn.dataset.action
    var uid = btn.dataset.uid
    if (action === 'suspend') { setUserStatus(uid, 'suspended') }
    else if (action === 'activate') { setUserStatus(uid, 'active') }
    else if (action === 'delete') { deleteUser(uid, btn.dataset.name || '', btn.dataset.email || '') }
    else if (action === 'credits') { adjustCredits(uid, parseInt(btn.dataset.credits || '0')) }
    else if (action === 'grant')   { grantCredits(uid, parseInt(btn.dataset.credits || '0')) }
  })
})
<\/script>
</body>
</html>`)),K.get(`/admin`,e=>{let t=e.req.header(`host`)||``;return t===`www.aifashion.co.kr`?e.text(`Not Found`,404):t===`aifashion.co.kr`?e.redirect(`https://studiob.aifashion.co.kr/admin`,302):e.redirect(`/admin02`,302)}),K.get(`/studio-b`,e=>e.redirect(`/`)),K.get(`/studio-b/*`,e=>{let t=e.req.path.replace(`/studio-b`,``)||`/`;return e.redirect(t)}),K.get(`/payment/success`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 완료 — Studio B</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    body { background: #0f0f0f; font-family: 'Pretendard', -apple-system, sans-serif; }
    .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(255,255,255,0.08); }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div class="card rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
    <div id="loadingState">
      <div class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-300 text-sm">결제 확인 중...</p>
    </div>
    <div id="successState" class="hidden">
      <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-green-400 text-2xl"></i>
      </div>
      <h1 class="text-white text-2xl font-bold mb-2">결제 완료!</h1>
      <p class="text-gray-400 text-sm mb-4" id="successMsg"></p>
      <div class="bg-black/30 rounded-xl p-4 mb-6 text-left">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-gray-400">지급 크레딧</span>
          <span class="text-purple-300 font-bold" id="creditsGranted"></span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-400">잔여 크레딧</span>
          <span class="text-white font-semibold" id="creditsTotal"></span>
        </div>
      </div>
      <button onclick="goHome()" class="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-semibold transition-colors">
        <i class="fas fa-home mr-2"></i>서비스 이용하기
      </button>
    </div>
    <div id="errorState" class="hidden">
      <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-times text-red-400 text-2xl"></i>
      </div>
      <h1 class="text-white text-2xl font-bold mb-2">결제 확인 실패</h1>
      <p class="text-gray-400 text-sm mb-6" id="errorMsg"></p>
      <button onclick="goHome()" class="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 font-semibold transition-colors">
        홈으로 돌아가기
      </button>
    </div>
  </div>

  <script>
    const params = new URLSearchParams(location.search)
    const paymentKey = params.get('paymentKey')
    const orderId    = params.get('orderId')
    const amount     = params.get('amount')
    const sessionToken = localStorage.getItem('lookbook_token') || ''

    async function confirmPayment() {
      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        })
        const data = await res.json()
        document.getElementById('loadingState').classList.add('hidden')
        if (data.success) {
          document.getElementById('successMsg').textContent = '크레딧이 충전되었습니다.'
          document.getElementById('creditsGranted').textContent = '+' + data.credits.toLocaleString() + ' 크레딧'
          document.getElementById('creditsTotal').textContent = data.creditsTotal.toLocaleString() + ' 크레딧'
          document.getElementById('successState').classList.remove('hidden')
          // 세션스토리지에 갱신 신호
          sessionStorage.setItem('creditsRefresh', '1')
        } else {
          document.getElementById('errorMsg').textContent = data.error || '알 수 없는 오류가 발생했습니다.'
          document.getElementById('errorState').classList.remove('hidden')
        }
      } catch (e) {
        document.getElementById('loadingState').classList.add('hidden')
        document.getElementById('errorMsg').textContent = '네트워크 오류가 발생했습니다.'
        document.getElementById('errorState').classList.remove('hidden')
      }
    }

    function goHome() { location.href = '/' }

    if (!paymentKey || !orderId || !amount) {
      document.getElementById('loadingState').classList.add('hidden')
      document.getElementById('errorMsg').textContent = '결제 파라미터가 올바르지 않습니다.'
      document.getElementById('errorState').classList.remove('hidden')
    } else {
      confirmPayment()
    }
  <\/script>
</body>
</html>`)),K.get(`/payment/fail`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 실패 — Studio B</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>body { background: #0f0f0f; font-family: 'Pretendard', -apple-system, sans-serif; }</style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(255,255,255,0.08)" class="rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
    <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <i class="fas fa-times text-red-400 text-2xl"></i>
    </div>
    <h1 class="text-white text-2xl font-bold mb-2">결제가 취소되었습니다</h1>
    <p class="text-gray-400 text-sm mb-2" id="errMsg"></p>
    <p class="text-gray-500 text-xs mb-6" id="errCode"></p>
    <button onclick="location.href='/'" class="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 font-semibold transition-colors">
      홈으로 돌아가기
    </button>
  </div>
  <script>
    const p = new URLSearchParams(location.search)
    const msg = p.get('message')
    const code = p.get('code')
    if (msg) document.getElementById('errMsg').textContent = decodeURIComponent(msg)
    if (code) document.getElementById('errCode').textContent = '오류코드: ' + code
  <\/script>
</body>
</html>`));var mt=new ye,ht=Object.assign({"/src/index.tsx":K}),gt=!1;for(let[,e]of Object.entries(ht))e&&(mt.all(`*`,t=>{let n;try{n=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,n)}),mt.notFound(t=>{let n;try{n=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,n)}),gt=!0);if(!gt)throw Error(`Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']`);export{mt as default};