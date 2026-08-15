var e=(e,t,n)=>(r,i)=>{let a=-1;return o(0);async function o(s){if(s<=a)throw Error(`next() called multiple times`);a=s;let l,u=!1,d;if(e[s]?(d=e[s][0][0],r.req.routeIndex=s):d=s===e.length&&i||void 0,d)try{l=await d(r,()=>o(s+1))}catch(e){if(e instanceof Error&&t)r.error=e,l=await t(e,r),u=!0;else throw e}else r.finalized===!1&&n&&(l=await n(r));return l&&(r.finalized===!1||u)&&(r.res=l),r}},t=Symbol(),n=(e,t)=>new Response(e,{headers:{"Content-Type":t.replace(/^[^;]+/,e=>e.toLowerCase())}}).formData(),r=e=>`headers`in e,i=async(e,t=Object.create(null))=>{let{all:n=!1,dot:i=!1}=t,o=(r(e)?e.headers:e.raw.headers).get(`Content-Type`)?.split(`;`)[0].trim().toLowerCase();return o===`multipart/form-data`||o===`application/x-www-form-urlencoded`?a(e,{all:n,dot:i}):{}};async function a(e,t){let i=r(e)?e.headers:e.raw.headers,a=n(await e.arrayBuffer(),i.get(`Content-Type`)||``);r(e)||(e.bodyCache.formData=a);let s=await a;return s?o(s,t):{}}function o(e,t){let n=Object.create(null);return e.forEach((e,r)=>{t.all||r.endsWith(`[]`)?s(n,r,e):n[r]=e}),t.dot&&Object.entries(n).forEach(([e,t])=>{e.includes(`.`)&&(l(n,e,t),delete n[e])}),n}var s=(e,t,n)=>{e[t]===void 0?t.endsWith(`[]`)?e[t]=[n]:e[t]=n:Array.isArray(e[t])?e[t].push(n):e[t]=[e[t],n]},l=(e,t,n)=>{if(/(?:^|\.)__proto__\./.test(t))return;let r=e,i=t.split(`.`);i.forEach((e,t)=>{t===i.length-1?r[e]=n:((!r[e]||typeof r[e]!=`object`||Array.isArray(r[e])||r[e]instanceof File)&&(r[e]=Object.create(null)),r=r[e])})},u=e=>{let t=e.split(`/`);return t[0]===``&&t.shift(),t},d=e=>{let{groups:t,path:n}=f(e);return p(u(n),t)},f=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(e,n)=>{let r=`@${n}`;return t.push([r,e]),r}),{groups:t,path:e}},p=(e,t)=>{for(let n=t.length-1;n>=0;n--){let[r]=t[n];for(let i=e.length-1;i>=0;i--)if(e[i].includes(r)){e[i]=e[i].replace(r,t[n][1]);break}}return e},m={},h=(e,t)=>{if(e===`*`)return`*`;let n=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(n){let r=`${e}#${t}`;return m[r]||(n[2]?m[r]=t&&t[0]!==`:`&&t[0]!==`*`?[r,n[1],RegExp(`^${n[2]}(?=/${t})`)]:[e,n[1],RegExp(`^${n[2]}$`)]:m[r]=[e,n[1],!0]),m[r]}return null},g=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,e=>{try{return t(e)}catch{return e}})}},_=e=>g(e,decodeURI),v=e=>{let t=e.url,n=t.indexOf(`/`,t.indexOf(`:`)+4),r=n;for(;r<t.length;r++){let e=t.charCodeAt(r);if(e===37){let e=t.indexOf(`?`,r),i=t.indexOf(`#`,r),a=e===-1?i===-1?void 0:i:i===-1?e:Math.min(e,i),o=t.slice(n,a);return _(o.includes(`%25`)?o.replace(/%25/g,`%2525`):o)}else if(e===63||e===35)break}return t.slice(n,r)},y=e=>{let t=v(e);return t.length>1&&t.at(-1)===`/`?t.slice(0,-1):t},b=(e,t,...n)=>(n.length&&(t=b(t,...n)),`${e?.[0]===`/`?``:`/`}${e}${t===`/`?``:`${e?.at(-1)===`/`?``:`/`}${t?.[0]===`/`?t.slice(1):t}`}`),x=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(`:`))return null;let t=e.split(`/`),n=[],r=``;return t.forEach(e=>{if(e!==``&&!/\:/.test(e))r+=`/`+e;else if(/\:/.test(e))if(/\?/.test(e)){n.length===0&&r===``?n.push(`/`):n.push(r);let t=e.replace(`?`,``);r+=`/`+t,n.push(r)}else r+=`/`+e}),n.filter((e,t,n)=>n.indexOf(e)===t)},S=e=>/[%+]/.test(e)?(e.indexOf(`+`)!==-1&&(e=e.replace(/\+/g,` `)),e.indexOf(`%`)===-1?e:g(e,E)):e,C=(e,t,n)=>{let r;if(!n&&t&&!/[%+]/.test(t)){let n=e.indexOf(`?`,8);if(n===-1)return;for(e.startsWith(t,n+1)||(n=e.indexOf(`&${t}`,n+1));n!==-1;){let r=e.charCodeAt(n+t.length+1);if(r===61){let r=n+t.length+2,i=e.indexOf(`&`,r);return S(e.slice(r,i===-1?void 0:i))}else if(r==38||isNaN(r))return``;n=e.indexOf(`&${t}`,n+1)}if(r=/[%+]/.test(e),!r)return}let i={};r??=/[%+]/.test(e);let a=e.indexOf(`?`,8);for(;a!==-1;){let t=e.indexOf(`&`,a+1),o=e.indexOf(`=`,a);o>t&&t!==-1&&(o=-1);let s=e.slice(a+1,o===-1?t===-1?void 0:t:o);if(r&&(s=S(s)),a=t,s===``)continue;let l;o===-1?l=``:(l=e.slice(o+1,t===-1?void 0:t),r&&(l=S(l))),n?(i[s]&&Array.isArray(i[s])||(i[s]=[]),i[s].push(l)):i[s]??=l}return t?i[t]:i},w=C,T=(e,t)=>C(e,t,!0),E=decodeURIComponent,ee=e=>g(e,E),D=class{raw;#e;#t;routeIndex=0;path;bodyCache={};constructor(e,t=`/`,n=[[]]){this.raw=e,this.path=t,this.#t=n,this.#e={}}param(e){return e?this.#n(e):this.#r()}#n(e){let t=this.#t[0][this.routeIndex][1][e],n=this.#i(t);return n&&/\%/.test(n)?ee(n):n}#r(){let e={},t=Object.keys(this.#t[0][this.routeIndex][1]);for(let n of t){let t=this.#i(this.#t[0][this.routeIndex][1][n]);t!==void 0&&(e[n]=/\%/.test(t)?ee(t):t)}return e}#i(e){return this.#t[1]?this.#t[1][e]:e}query(e){return w(this.url,e)}queries(e){return T(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((e,n)=>{t[n]=e}),t}async parseBody(e){return i(this,e)}#a=e=>{let{bodyCache:t,raw:n}=this,r=t[e];if(r)return r;let i=Object.keys(t)[0];return i?t[i].then(t=>(i===`json`&&(t=JSON.stringify(t)),new Response(t)[e]())):t[e]=n[e]()};json(){return this.#a(`text`).then(e=>JSON.parse(e))}text(){return this.#a(`text`)}arrayBuffer(){return this.#a(`arrayBuffer`)}bytes(){return this.#a(`arrayBuffer`).then(e=>new Uint8Array(e))}blob(){return this.#a(`blob`)}formData(){return this.#a(`formData`)}addValidatedData(e,t){this.#e[e]=t}valid(e){return this.#e[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[t](){return this.#t}get matchedRoutes(){return this.#t[0].map(([[,e]])=>e)}get routePath(){return this.#t[0].map(([[,e]])=>e)[this.routeIndex].path}},O={Stringify:1,BeforeStream:2,Stream:3},k=(e,t)=>{let n=new String(e);return n.isEscaped=!0,n.callbacks=t,n},te=async(e,t,n,r,i)=>{typeof e==`object`&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let a=e.callbacks;if(!a?.length)return Promise.resolve(e);i?i[0]+=e:i=[e];let o=Promise.all(a.map(e=>e({phase:t,buffer:i,context:r}))).then(e=>Promise.all(e.filter(Boolean).map(e=>te(e,t,!1,r,i))).then(()=>i[0]));return n?k(await o,a):o},A=`text/plain; charset=UTF-8`,j=(e,t)=>({"Content-Type":e,...t}),M=(e,t)=>new Response(e,t),N=class{#e;#t;env={};#n;finalized=!1;error;#r;#i;#a;#o;#s;#c;#l;#u;#d;constructor(e,t){this.#e=e,t&&(this.#i=t.executionCtx,this.env=t.env,this.#c=t.notFoundHandler,this.#d=t.path,this.#u=t.matchResult)}get req(){return this.#t??=new D(this.#e,this.#d,this.#u),this.#t}get event(){if(this.#i&&`respondWith`in this.#i)return this.#i;throw Error(`This context has no FetchEvent`)}get executionCtx(){if(this.#i)return this.#i;throw Error(`This context has no ExecutionContext`)}get res(){return this.#a||=M(null,{headers:this.#l??=new Headers})}set res(e){if(this.#a&&e){e=M(e.body,e);for(let[t,n]of this.#a.headers.entries())if(t!==`content-type`)if(t===`set-cookie`){let t=this.#a.headers.getSetCookie();e.headers.delete(`set-cookie`);for(let n of t)e.headers.append(`set-cookie`,n)}else e.headers.set(t,n)}this.#a=e,this.finalized=!0}render=(...e)=>(this.#s??=e=>this.html(e),this.#s(...e));setLayout=e=>this.#o=e;getLayout=()=>this.#o;setRenderer=e=>{this.#s=e};header=(e,t,n)=>{this.finalized&&(this.#a=M(this.#a.body,this.#a));let r=this.#a?this.#a.headers:this.#l??=new Headers;t===void 0?r.delete(e):n?.append?r.append(e,t):r.set(e,t)};status=e=>{this.#r=e};set=(e,t)=>{this.#n??=new Map,this.#n.set(e,t)};get=e=>this.#n?this.#n.get(e):void 0;get var(){return this.#n?Object.fromEntries(this.#n):{}}#f(e,t,n){let r=this.#a?new Headers(this.#a.headers):this.#l??new Headers;if(typeof t==`object`&&`headers`in t){let e=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[t,n]of e)t.toLowerCase()===`set-cookie`?r.append(t,n):r.set(t,n)}if(n)for(let[e,t]of Object.entries(n))if(typeof t==`string`)r.set(e,t);else{r.delete(e);for(let n of t)r.append(e,n)}return M(e,{status:typeof t==`number`?t:t?.status??this.#r,headers:r})}newResponse=(...e)=>this.#f(...e);body=(e,t,n)=>this.#f(e,t,n);text=(e,t,n)=>!this.#l&&!this.#r&&!t&&!n&&!this.finalized?new Response(e):this.#f(e,t,j(A,n));json=(e,t,n)=>this.#f(JSON.stringify(e),t,j(`application/json`,n));html=(e,t,n)=>{let r=e=>this.#f(e,t,j(`text/html; charset=UTF-8`,n));return typeof e==`object`?te(e,O.Stringify,!1,{}).then(r):r(e)};redirect=(e,t)=>{let n=String(e);return this.header(`Location`,/[^\x00-\xFF]/.test(n)?encodeURI(n):n),this.newResponse(null,t??302)};notFound=()=>(this.#c??=()=>M(),this.#c(this))},P=[`get`,`post`,`put`,`delete`,`options`,`patch`],F=`Can not add a route since the matcher is already built.`,I=class extends Error{},L=`__COMPOSED_HANDLER`,ne=e=>e.text(`404 Not Found`,404),re=(e,t)=>{if(`getResponse`in e){let n=e.getResponse();return t.newResponse(n.body,n)}return console.error(e),t.text(`Internal Server Error`,500)},ie=class t{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath=`/`;#e=`/`;routes=[];constructor(e={}){[...P,`all`].forEach(e=>{this[e]=(t,...n)=>(typeof t==`string`?this.#e=t:this.#r(e,this.#e,t),n.forEach(t=>{this.#r(e,this.#e,t)}),this)}),this.on=(e,t,...n)=>{for(let r of[t].flat()){this.#e=r;for(let t of[e].flat())n.map(e=>{this.#r(t.toUpperCase(),this.#e,e)})}return this},this.use=(e,...t)=>(typeof e==`string`?this.#e=e:(this.#e=`*`,t.unshift(e)),t.forEach(e=>{this.#r(`ALL`,this.#e,e)}),this);let{strict:t,...n}=e;Object.assign(this,n),this.getPath=t??!0?e.getPath??v:y}#t(){let e=new t({router:this.router,getPath:this.getPath});return e.errorHandler=this.errorHandler,e.#n=this.#n,e.routes=this.routes,e}#n=ne;errorHandler=re;route(t,n){let r=this.basePath(t);return n.routes.map(t=>{let i;n.errorHandler===re?i=t.handler:(i=async(r,i)=>(await e([],n.errorHandler)(r,()=>t.handler(r,i))).res,i[L]=t.handler),r.#r(t.method,t.path,i,t.basePath)}),this}basePath(e){let t=this.#t();return t._basePath=b(this._basePath,e),t}onError=e=>(this.errorHandler=e,this);notFound=e=>(this.#n=e,this);mount(e,t,n){let r,i;n&&(typeof n==`function`?i=n:(i=n.optionHandler,r=n.replaceRequest===!1?e=>e:n.replaceRequest));let a=i?e=>{let t=i(e);return Array.isArray(t)?t:[t]}:e=>{let t;try{t=e.executionCtx}catch{}return[e.env,t]};return r||=(()=>{let t=b(this._basePath,e),n=t===`/`?0:t.length;return e=>{let t=new URL(e.url);return t.pathname=this.getPath(e).slice(n)||`/`,new Request(t,e)}})(),this.#r(`ALL`,b(e,`*`),async(e,n)=>{let i=await t(r(e.req.raw),...a(e));if(i)return i;await n()}),this}#r(e,t,n,r){e=e.toUpperCase(),t=b(this._basePath,t);let i={basePath:r===void 0?this._basePath:b(this._basePath,r),path:t,method:e,handler:n};this.router.add(e,t,[n,i]),this.routes.push(i)}#i(e,t){if(e instanceof Error)return this.errorHandler(e,t);throw e}#a(t,n,r,i){if(i===`HEAD`)return(async()=>new Response(null,await this.#a(t,n,r,`GET`)))();let a=this.getPath(t,{env:r}),o=this.router.match(i,a),s=new N(t,{path:a,matchResult:o,env:r,executionCtx:n,notFoundHandler:this.#n});if(o[0].length===1){let e;try{e=o[0][0][0][0](s,async()=>{s.res=await this.#n(s)})}catch(e){return this.#i(e,s)}return e instanceof Promise?e.then(e=>e||(s.finalized?s.res:this.#n(s))).catch(e=>this.#i(e,s)):e??this.#n(s)}let l=e(o[0],this.errorHandler,this.#n);return(async()=>{try{let e=await l(s);if(!e.finalized)throw Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return e.res}catch(e){return this.#i(e,s)}})()}fetch=(e,...t)=>this.#a(e,t[1],t[0],e.method);request=(e,t,n,r)=>e instanceof Request?this.fetch(t?new Request(e,t):e,n,r):(e=e.toString(),this.fetch(new Request(/^https?:\/\//.test(e)?e:`http://localhost${b(`/`,e)}`,t),n,r));fire=()=>{addEventListener(`fetch`,e=>{e.respondWith(this.#a(e.request,e,void 0,e.request.method))})}},ae=[];function oe(e,t){let n=this.buildAllMatchers(),r=((e,t)=>{let r=n[e]||n.ALL,i=r[2][t];if(i)return i;let a=t.match(r[0]);if(!a)return[[],ae];let o=a.indexOf(``,1);return[r[1][o],a]});return this.match=r,r(e,t)}var se=`[^/]+`,R=`.*`,z=`(?:|/.*)`,B=Symbol(),ce=new Set(`.\\+*[^]$()`);function le(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===R||e===z?1:t===R||t===z?-1:e===se?1:t===se?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var ue=class e{#e;#t;#n=Object.create(null);insert(t,n,r,i,a){if(t.length===0){if(this.#e!==void 0)throw B;if(a)return;this.#e=n;return}let[o,...s]=t,l=o===`*`?s.length===0?[``,``,R]:[``,``,se]:o===`/*`?[``,``,z]:o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),u;if(l){let t=l[1],n=l[2]||se;if(t&&l[2]&&(n===`.*`||(n=n.replace(/^\((?!\?:)(?=[^)]+\)$)/,`(?:`),/\((?!\?:)/.test(n))))throw B;if(u=this.#n[n],!u){if(Object.keys(this.#n).some(e=>e!==R&&e!==z))throw B;if(a)return;u=this.#n[n]=new e,t!==``&&(u.#t=i.varIndex++)}!a&&t!==``&&r.push([t,u.#t])}else if(u=this.#n[o],!u){if(Object.keys(this.#n).some(e=>e.length>1&&e!==R&&e!==z))throw B;if(a)return;u=this.#n[o]=new e}u.insert(s,n,r,i,a)}buildRegExpStr(){let e=Object.keys(this.#n).sort(le).map(e=>{let t=this.#n[e];return(typeof t.#t==`number`?`(${e})@${t.#t}`:ce.has(e)?`\\${e}`:e)+t.buildRegExpStr()});return typeof this.#e==`number`&&e.unshift(`#${this.#e}`),e.length===0?``:e.length===1?e[0]:`(?:`+e.join(`|`)+`)`}},de=class{#e={varIndex:0};#t=new ue;insert(e,t,n){let r=[],i=[];for(let t=0;;){let n=!1;if(e=e.replace(/\{[^}]+\}/g,e=>{let r=`@\\${t}`;return i[t]=[r,e],t++,n=!0,r}),!n)break}let a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let e=i.length-1;e>=0;e--){let[t]=i[e];for(let n=a.length-1;n>=0;n--)if(a[n].indexOf(t)!==-1){a[n]=a[n].replace(t,i[e][1]);break}}return this.#t.insert(a,t,r,this.#e,n),r}buildRegExp(){let e=this.#t.buildRegExpStr();if(e===``)return[/^$/,[],[]];let t=0,n=[],r=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(e,i,a)=>i===void 0?(a===void 0||(r[Number(a)]=++t),``):(n[++t]=Number(i),`$()`)),[RegExp(`^${e}`),n,r]}},fe=[/^$/,[],Object.create(null)],pe=Object.create(null);function me(e){return pe[e]??=RegExp(e===`*`?``:`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(e,t)=>t?`\\${t}`:`(?:|/.*)`)}$`)}function he(){pe=Object.create(null)}function ge(e){let t=new de,n=[];if(e.length===0)return fe;let r=e.map(e=>[!/\*|\/:/.test(e[0]),...e]).sort(([e,t],[n,r])=>e?1:n?-1:t.length-r.length),i=Object.create(null);for(let e=0,a=-1,o=r.length;e<o;e++){let[o,s,l]=r[e];o?i[s]=[l.map(([e])=>[e,Object.create(null)]),ae]:a++;let u;try{u=t.insert(s,a,o)}catch(e){throw e===B?new I(s):e}o||(n[a]=l.map(([e,t])=>{let n=Object.create(null);for(--t;t>=0;t--){let[e,r]=u[t];n[e]=r}return[e,n]}))}let[a,o,s]=t.buildRegExp();for(let e=0,t=n.length;e<t;e++)for(let t=0,r=n[e].length;t<r;t++){let r=n[e][t]?.[1];if(!r)continue;let i=Object.keys(r);for(let e=0,t=i.length;e<t;e++)r[i[e]]=s[r[i[e]]]}let l=[];for(let e in o)l[e]=n[o[e]];return[a,l,i]}function V(e,t){if(e){for(let n of Object.keys(e).sort((e,t)=>t.length-e.length))if(me(n).test(t))return[...e[n]]}}var _e=class{name=`RegExpRouter`;#e;#t;constructor(){this.#e={ALL:Object.create(null)},this.#t={ALL:Object.create(null)}}add(e,t,n){let r=this.#e,i=this.#t;if(!r||!i)throw Error(F);r[e]||[r,i].forEach(t=>{t[e]=Object.create(null),Object.keys(t.ALL).forEach(n=>{t[e][n]=[...t.ALL[n]]})}),t===`/*`&&(t=`*`);let a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let o=me(t);e===`ALL`?Object.keys(r).forEach(e=>{r[e][t]||=V(r[e],t)||V(r.ALL,t)||[]}):r[e][t]||=V(r[e],t)||V(r.ALL,t)||[],Object.keys(r).forEach(t=>{(e===`ALL`||e===t)&&Object.keys(r[t]).forEach(e=>{o.test(e)&&r[t][e].push([n,a])})}),Object.keys(i).forEach(t=>{(e===`ALL`||e===t)&&Object.keys(i[t]).forEach(e=>o.test(e)&&i[t][e].push([n,a]))});return}let o=x(t)||[t];for(let t=0,s=o.length;t<s;t++){let l=o[t];Object.keys(i).forEach(o=>{(e===`ALL`||e===o)&&(i[o][l]||=[...V(r[o],l)||V(r.ALL,l)||[]],i[o][l].push([n,a-s+t+1]))})}}match=oe;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#t).concat(Object.keys(this.#e)).forEach(t=>{e[t]||=this.#n(t)}),this.#e=this.#t=void 0,he(),e}#n(e){let t=[],n=e===`ALL`;return[this.#e,this.#t].forEach(r=>{let i=r[e]?Object.keys(r[e]).map(t=>[t,r[e][t]]):[];i.length===0?e!==`ALL`&&t.push(...Object.keys(r.ALL).map(e=>[e,r.ALL[e]])):(n||=!0,t.push(...i))}),n?ge(t):null}},ve=class{name=`SmartRouter`;#e=[];#t=[];constructor(e){this.#e=e.routers}add(e,t,n){if(!this.#t)throw Error(F);this.#t.push([e,t,n])}match(e,t){if(!this.#t)throw Error(`Fatal error`);let n=this.#e,r=this.#t,i=n.length,a=0,o;for(;a<i;a++){let i=n[a];try{for(let e=0,t=r.length;e<t;e++)i.add(...r[e]);o=i.match(e,t)}catch(e){if(e instanceof I)continue;throw e}this.match=i.match.bind(i),this.#e=[i],this.#t=void 0;break}if(a===i)throw Error(`Fatal error`);return this.name=`SmartRouter + ${this.activeRouter.name}`,o}get activeRouter(){if(this.#t||this.#e.length!==1)throw Error(`No active router has been determined yet.`);return this.#e[0]}},H=Object.create(null),ye=e=>{for(let t in e)return!0;return!1},be=class e{#e;#t;#n;#r=0;#i=H;constructor(e,t,n){if(this.#t=n||Object.create(null),this.#e=[],e&&t){let n=Object.create(null);n[e]={handler:t,possibleKeys:[],score:0},this.#e=[n]}this.#n=[]}insert(t,n,r){this.#r=++this.#r;let i=this,a=d(n),o=[];for(let t=0,n=a.length;t<n;t++){let n=a[t],r=a[t+1],s=h(n,r),l=Array.isArray(s)?s[0]:n;if(l in i.#t){i=i.#t[l],s&&o.push(s[1]);continue}i.#t[l]=new e,s&&(i.#n.push(s),o.push(s[1])),i=i.#t[l]}return i.#e.push({[t]:{handler:r,possibleKeys:o.filter((e,t,n)=>n.indexOf(e)===t),score:this.#r}}),i}#a(e,t,n,r,i){for(let a=0,o=t.#e.length;a<o;a++){let o=t.#e[a],s=o[n]||o.ALL,l={};if(s!==void 0&&(s.params=Object.create(null),e.push(s),r!==H||i&&i!==H))for(let e=0,t=s.possibleKeys.length;e<t;e++){let t=s.possibleKeys[e],n=l[s.score];s.params[t]=i?.[t]&&!n?i[t]:r[t]??i?.[t],l[s.score]=!0}}}search(e,t){let n=[];this.#i=H;let r=[this],i=u(t),a=[],o=i.length,s=null;for(let l=0;l<o;l++){let u=i[l],d=l===o-1,f=[];for(let p=0,m=r.length;p<m;p++){let m=r[p],h=m.#t[u];h&&(h.#i=m.#i,d?(h.#t[`*`]&&this.#a(n,h.#t[`*`],e,m.#i),this.#a(n,h,e,m.#i)):f.push(h));for(let r=0,p=m.#n.length;r<p;r++){let p=m.#n[r],h=m.#i===H?{}:{...m.#i};if(p===`*`){let t=m.#t[`*`];t&&(this.#a(n,t,e,m.#i),t.#i=h,f.push(t));continue}let[g,_,v]=p;if(!u&&!(v instanceof RegExp))continue;let y=m.#t[g];if(v instanceof RegExp){if(s===null){s=Array(o);let e=+(t[0]===`/`);for(let t=0;t<o;t++)s[t]=e,e+=i[t].length+1}let r=t.substring(s[l]),u=v.exec(r);if(u){if(h[_]=u[0],this.#a(n,y,e,m.#i,h),u[0].length===r.length&&y.#t[`*`]&&this.#a(n,y.#t[`*`],e,m.#i,h),ye(y.#t)){y.#i=h;let e=u[0].match(/\//)?.length??0;(a[e]||=[]).push(y)}continue}}(v===!0||v.test(u))&&(h[_]=u,d?(this.#a(n,y,e,h,m.#i),y.#t[`*`]&&this.#a(n,y.#t[`*`],e,h,m.#i)):(y.#i=h,f.push(y)))}}let p=a.shift();r=p?f.concat(p):f}return n.length>1&&n.sort((e,t)=>e.score-t.score),[n.map(({handler:e,params:t})=>[e,t])]}},xe=class{name=`TrieRouter`;#e;constructor(){this.#e=new be}add(e,t,n){let r=x(t);if(r){for(let t=0,i=r.length;t<i;t++)this.#e.insert(e,r[t],n);return}this.#e.insert(e,t,n)}match(e,t){return this.#e.search(e,t)}},Se=class extends ie{constructor(e={}){super(e),this.router=e.router??new ve({routers:[new _e,new xe]})}},Ce=/^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|msgpack|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|vnd\.msgpack|wasm|x-httpd-php|x-javascript|x-msgpack|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml|msgpack))(?:[;\s]|$)/i,we=(e,t=Te)=>{let n=e.match(/\.([a-zA-Z0-9]+?)$/);if(n)return t[n[1].toLowerCase()]},Te={aac:`audio/aac`,avi:`video/x-msvideo`,avif:`image/avif`,av1:`video/av1`,bin:`application/octet-stream`,bmp:`image/bmp`,css:`text/css; charset=utf-8`,csv:`text/csv; charset=utf-8`,eot:`application/vnd.ms-fontobject`,epub:`application/epub+zip`,gif:`image/gif`,gz:`application/gzip`,htm:`text/html; charset=utf-8`,html:`text/html; charset=utf-8`,ico:`image/x-icon`,ics:`text/calendar; charset=utf-8`,jpeg:`image/jpeg`,jpg:`image/jpeg`,js:`text/javascript; charset=utf-8`,json:`application/json`,jsonld:`application/ld+json`,map:`application/json`,mid:`audio/x-midi`,midi:`audio/x-midi`,mjs:`text/javascript; charset=utf-8`,mp3:`audio/mpeg`,mp4:`video/mp4`,mpeg:`video/mpeg`,oga:`audio/ogg`,ogv:`video/ogg`,ogx:`application/ogg`,opus:`audio/opus`,otf:`font/otf`,pdf:`application/pdf`,png:`image/png`,rtf:`application/rtf`,svg:`image/svg+xml; charset=utf-8`,tif:`image/tiff`,tiff:`image/tiff`,ts:`video/mp2t`,ttf:`font/ttf`,txt:`text/plain; charset=utf-8`,wasm:`application/wasm`,webm:`video/webm`,weba:`audio/webm`,webmanifest:`application/manifest+json`,webp:`image/webp`,woff:`font/woff`,woff2:`font/woff2`,xhtml:`application/xhtml+xml; charset=utf-8`,xml:`application/xml; charset=utf-8`,zip:`application/zip`,"3gp":`video/3gpp`,"3g2":`video/3gpp2`,gltf:`model/gltf+json`,glb:`model/gltf-binary`},Ee=(...e)=>{let t=e.filter(e=>e!==``).join(`/`);t=t.replace(/(?<=\/)\/+/g,``);let n=t.split(`/`),r=[];for(let e of n)e===`..`&&r.length>0&&r.at(-1)!==`..`?r.pop():e!==`.`&&r.push(e);return r.join(`/`)||`.`},De={br:`.br`,zstd:`.zst`,gzip:`.gz`},Oe=Object.keys(De),ke=`index.html`,Ae=e=>{let t=e.root??`./`,n=e.path,r=e.join??Ee;return async(i,a)=>{if(i.finalized)return a();let o;if(e.path)o=e.path;else try{if(o=_(i.req.path),/(?:^|[\/\\])\.{1,2}(?:$|[\/\\])|[\/\\]{2,}|\\/.test(o))throw Error()}catch{return await e.onNotFound?.(i.req.path,i),a()}let s=r(t,!n&&e.rewriteRequestPath?e.rewriteRequestPath(o):o);e.isDir&&await e.isDir(s)&&(s=r(s,ke));let l=e.getContent,u=await l(s,i);if(u instanceof Response)return i.newResponse(u.body,u);if(u!=null){let t=e.mimes&&we(s,e.mimes)||we(s);if(i.header(`Content-Type`,t||`application/octet-stream`),e.precompressed&&(!t||Ce.test(t))){let e=new Set(i.req.header(`Accept-Encoding`)?.split(`,`).map(e=>e.trim()));for(let t of Oe){if(!e.has(t))continue;let n=await l(s+De[t],i);if(n){u=n,i.header(`Content-Encoding`,t),i.header(`Vary`,`Accept-Encoding`,{append:!0});break}}}return await e.onFound?.(s,i),i.body(u)}await e.onNotFound?.(s,i),await a()}},je=async(e,t)=>{let n;n=t&&t.manifest?typeof t.manifest==`string`?JSON.parse(t.manifest):t.manifest:typeof __STATIC_CONTENT_MANIFEST==`string`?JSON.parse(__STATIC_CONTENT_MANIFEST):__STATIC_CONTENT_MANIFEST;let r;r=t&&t.namespace?t.namespace:__STATIC_CONTENT;let i=n[e];return i&&await r.get(i,{type:`stream`})||null},Me=(e={})=>async function(t,n){let r=async n=>je(n,{manifest:e.manifest,namespace:e.namespace?e.namespace:t.env?t.env.__STATIC_CONTENT:void 0});return Ae({...e,getContent:r})(t,n)},Ne=e=>Me(e),Pe=e=>{let t={origin:`*`,allowMethods:[`GET`,`HEAD`,`PUT`,`POST`,`DELETE`,`PATCH`],allowHeaders:[],exposeHeaders:[],...e},n=(e=>typeof e==`string`?e===`*`?()=>e:t=>e===t?t:null:typeof e==`function`?e:t=>e.includes(t)?t:null)(t.origin),r=(e=>typeof e==`function`?e:Array.isArray(e)?()=>e:()=>[])(t.allowMethods);return async function(e,i){function a(t,n){e.res.headers.set(t,n)}let o=await n(e.req.header(`origin`)||``,e);if(o&&a(`Access-Control-Allow-Origin`,o),t.credentials&&a(`Access-Control-Allow-Credentials`,`true`),t.exposeHeaders?.length&&a(`Access-Control-Expose-Headers`,t.exposeHeaders.join(`,`)),e.req.method===`OPTIONS`){t.origin!==`*`&&a(`Vary`,`Origin`),t.maxAge!=null&&a(`Access-Control-Max-Age`,t.maxAge.toString());let n=await r(e.req.header(`origin`)||``,e);n.length&&a(`Access-Control-Allow-Methods`,n.join(`,`));let i=t.allowHeaders;if(!i?.length){let t=e.req.header(`Access-Control-Request-Headers`);t&&(i=t.split(/\s*,\s*/))}return i?.length&&(a(`Access-Control-Allow-Headers`,i.join(`,`)),e.res.headers.append(`Vary`,`Access-Control-Request-Headers`)),e.res.headers.delete(`Content-Length`),e.res.headers.delete(`Content-Type`),new Response(null,{headers:e.res.headers,status:204,statusText:`No Content`})}await i(),t.origin!==`*`&&e.header(`Vary`,`Origin`,{append:!0})}},Fe=`msujof5n`,U=new Se;U.use(`/api/*`,Pe()),U.use(`/static/*`,Ne({root:`./public`})),U.use(`*`,async(e,t)=>{if((e.req.header(`host`)||``).includes(`studiob.aifashion.co.kr`)&&!e.req.path.startsWith(`/api/`)){let t=new URL(e.req.url);return e.redirect(`https://www.aifashion.co.kr${t.pathname}${t.search}`,302)}await t()});var W=`https://api.atlascloud.ai`,G=`https://www.aifashion.co.kr`,K=async(e,t)=>{let n=e.req.header(`X-Admin-Password`),r=e.env.ADMIN_PASSWORD;if(!r)return e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500);if(n!==r)return e.json({success:!1,message:`인증 실패`},401);await t()},q={enabled:!0,prefix:``,suffix:``,styleGuide:[`SCENE-FIRST INTEGRATION PRINCIPLE: Every composited element — clothing, face, skin — must look as if it was photographed in the original background scene, not pasted in.`,`LIGHTING MATCH: Identify the background scene's primary light source direction, color temperature (warm/neutral/cool), and intensity. Apply identical lighting to the person's clothing, face, and all exposed skin. Cast-shadows, specular highlights, and subsurface skin scattering must all originate from the scene's light source.`,`COLOR GRADE MATCH: The background scene carries a specific color grade and tonal mood (e.g. warm golden, cool blue, high-contrast, soft pastel, moody dark). Render all composited elements under this exact color cast — do NOT render clothing or skin under a neutral white balance if the scene is warm or cool-toned.`,`MOOD AND ATMOSPHERE MATCH: Preserve the scene's overall visual mood and atmosphere. The final image must feel tonally coherent — bright and airy scenes stay bright, moody scenes stay moody, editorial high-contrast stays high-contrast.`,`FABRIC LIGHT INTERACTION: Simulate realistic light interaction with the new fabric — specular sheen on satin/silk, soft diffuse on cotton/knit, translucency on chiffon/voile — all under the scene's lighting conditions.`,`Fashion editorial quality: magazine cover level seamless compositing, physically grounded.`].join(` `),technicalSpec:[`초사실적 표현, 직물 질감과 피부 디테일 극사실 재현.`,`의류 드레이프와 핏 완벽 재현. 자연스러운 주름 외 구김 없음.`,`의류에 선명한 포커스. 배경과 동일한 심도 및 렌즈 특성 유지.`,`배경 씬의 색감·무드·조명 톤을 인물과 의류에 완전히 통합. 합성 아티팩트 없음.`,`참조 이미지에 없는 의류, 액세서리, 소품 절대 추가 금지.`,`ABSOLUTE PROHIBITION: DO NOT modify, redesign, or alter any detail of the uploaded clothing item.`].join(` `),updatedAt:new Date().toISOString()};function Ie(e){if(!q.enabled)return e;let t=[];return q.prefix.trim()&&t.push(q.prefix.trim()),t.push(e),q.styleGuide.trim()&&t.push(q.styleGuide.trim()),q.technicalSpec.trim()&&t.push(q.technicalSpec.trim()),q.suffix.trim()&&t.push(q.suffix.trim()),t.join(` `)}async function J(e){let t=await e.get(`model_index`);return t?JSON.parse(t):[]}async function Le(e,t){await e.put(`model_index`,JSON.stringify(t))}async function Y(e){let t=await e.get(`bg_index`);return t?JSON.parse(t):[]}async function Re(e,t){await e.put(`bg_index`,JSON.stringify(t))}async function ze(e){let t=await e.get(`id_counter`),n=t?parseInt(t)+1:1001;return await e.put(`id_counter`,String(n)),String(n-1==0?1e3:n-1)}async function Be(e){await e.prepare(`UPDATE id_counter SET value = value + 1 WHERE id = 1`).run();let t=await e.prepare(`SELECT value FROM id_counter WHERE id = 1`).first();return String(t?.value??1e3)}async function Ve(e){let{results:t}=await e.prepare(`SELECT id, name, desc_text, gender, age, mood, created_at FROM custom_models ORDER BY created_at ASC`).all();return t.map(e=>({id:e.id,name:e.name,desc:e.desc_text,gender:e.gender||`미분류`,age:e.age||`미분류`,mood:e.mood||`미분류`,createdAt:e.created_at}))}async function He(e,t){let n=[];for(let r of t){let{name:t,desc:i,gender:a,age:o,mood:s,imageBase64:l}=r;if(!t||!l)continue;let u=await Be(e),d=new Date().toISOString();try{await e.prepare(`INSERT INTO custom_models (id, name, desc_text, gender, age, mood, image_b64, created_at) VALUES (?,?,?,?,?,?,?,?)`).bind(u,t,i||t,a||`미분류`,o||`미분류`,s||`미분류`,l,d).run()}catch{await e.prepare(`INSERT INTO custom_models (id, name, desc_text, image_b64, created_at) VALUES (?,?,?,?,?)`).bind(u,t,i||t,l,d).run()}n.push({id:u,name:t,desc:i||t,gender:a||`미분류`,age:o||`미분류`,mood:s||`미분류`,createdAt:d})}return n}async function Ue(e,t){return((await e.prepare(`DELETE FROM custom_models WHERE id = ?`).bind(t).run()).meta?.changes??0)>0}async function We(e,t){return(await e.prepare(`SELECT image_b64 FROM custom_models WHERE id = ?`).bind(t).first())?.image_b64??null}async function Ge(e){let{results:t}=await e.prepare(`SELECT id, name, category, bg_desc, created_at, CASE WHEN gen_image_b64 IS NOT NULL AND gen_image_b64 != '' THEN 1 ELSE 0 END AS has_gen_image FROM custom_bgs ORDER BY created_at ASC`).all();return t.map(e=>({id:e.id,name:e.name,bgDesc:e.bg_desc,category:e.category,createdAt:e.created_at,hasGenImage:!!e.has_gen_image}))}async function Ke(e,t){let n=[];for(let r of t){let{name:t,bgDesc:i,category:a,imageBase64:o}=r;if(!t||!o)continue;let s=await Be(e),l=new Date().toISOString();await e.prepare(`INSERT INTO custom_bgs (id, name, category, bg_desc, image_b64, created_at) VALUES (?,?,?,?,?,?)`).bind(s,t,a||`커스텀`,i||t,o,l).run(),n.push({id:s,name:t,bgDesc:i||t,category:a||`커스텀`,createdAt:l})}return n}async function qe(e,t){return((await e.prepare(`DELETE FROM custom_bgs WHERE id = ?`).bind(t).run()).meta?.changes??0)>0}async function Je(e,t){return(await e.prepare(`SELECT image_b64 FROM custom_bgs WHERE id = ?`).bind(t).first())?.image_b64??null}async function Ye(e,t,n){return((await e.prepare(`UPDATE custom_bgs SET gen_image_b64 = ? WHERE id = ?`).bind(n,t).run()).meta?.changes??0)>0}var X=[],Z=[],Xe=1e3;U.post(`/api/admin/models`,K,async e=>{try{let t=await e.req.json(),n=Array.isArray(t)?t:[t];if(n.length===0)return e.json({success:!1,message:`업로드할 항목이 없습니다.`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB,a=[];if(r){let e=await J(r);for(let t of n){let{name:n,desc:i,imageBase64:o}=t;if(!n||!o)continue;let s=await ze(r),l={id:s,name:n,desc:i||n,createdAt:new Date().toISOString()};e.push(l),await r.put(`model_img:${s}`,o),a.push(l)}await Le(r,e)}else if(i)a=await He(i,n);else for(let e of n){let{name:t,desc:n,imageBase64:r}=e;if(!t||!r)continue;let i=String(Xe++),o={id:i,name:t,desc:n||t,imageBase64:r,createdAt:new Date().toISOString()};X.push(o),a.push({id:i,name:t,desc:o.desc,createdAt:o.createdAt})}return e.json({success:!0,models:a,count:a.length})}catch(t){return e.json({success:!1,message:t.message},500)}});var Ze={TOP:`You are an image classifier for a fashion shopping app upload slot labeled "상의" (TOP). Does this image show a TOP garment (shirt, blouse, t-shirt, jacket, coat, sweater, hoodie, etc.) as its clearly identifiable main subject — whether laid flat, on a hanger, or worn by a person?
Answer NO if: the image has no clothing at all; the main garment shown is a BOTTOM only (pants, skirt, shorts) with no top visible; or it's a full-outfit/full-body shot where a top AND a bottom are BOTH clearly staged/visible together as a complete look (that belongs in the "전체" slot, not here).
Respond with ONLY one word: YES or NO.`,BOTTOM:`You are an image classifier for a fashion shopping app upload slot labeled "하의" (BOTTOM). Does this image show a BOTTOM garment (pants, jeans, skirt, shorts, etc.) as its clearly identifiable main subject — whether laid flat, on a hanger, or worn by a person?
Answer NO if: the image has no clothing at all; the main garment shown is a TOP only (shirt, jacket, sweater) with no bottom visible; or it's a full-outfit/full-body shot where a top AND a bottom are BOTH clearly staged/visible together as a complete look (that belongs in the "전체" slot, not here).
Respond with ONLY one word: YES or NO.`,DRESS:`You are an image classifier for a fashion shopping app upload slot labeled "전체" (FULL OUTFIT). Does this image show a FULL OUTFIT as its clearly identifiable main subject — either (a) a one-piece garment (dress, jumpsuit, overalls), or (b) a photo where a TOP and a BOTTOM are BOTH clearly visible/identifiable together as a complete styled look?
Answer NO if: the image has no clothing at all; or it shows only a single separate garment piece (just a top with no bottom visible, or just a bottom with no top visible).
Respond with ONLY one word: YES or NO.`};U.post(`/api/validate/clothing`,async e=>{try{let t=await e.req.json(),n=t?.imageBase64||``,r=t?.cat||``;if(!n)return e.json({success:!1,message:`imageBase64 필수`},400);let i=e.env?.OPENAI_API_KEY||``;if(!i)return e.json({success:!0,isClothing:!0});let a=await et(i,n,Ze[r]||Ze.DRESS);return a===null?e.json({success:!0,isClothing:!0}):e.json({success:!0,isClothing:a.trim().toUpperCase().startsWith(`YES`)})}catch(t){return console.error(`validate/clothing error:`,t),e.json({success:!0,isClothing:!0})}}),U.post(`/api/admin/auto-label`,K,async e=>{try{let{type:t,imageBase64:n}=await e.req.json();if(!n)return e.json({success:!1,message:`imageBase64 필수`},400);let r=e.env?.OPENAI_API_KEY||``;if(!r)return e.json({success:!1,message:`OPENAI_API_KEY 미설정`},500);let i=e=>{let t=e.match(/\{[\s\S]*\}/);return JSON.parse(t?.[0]||e)};if(t===`model`){let t=await et(r,n,`You are an AI fashion model classifier. Analyze this model photo and return ONLY a JSON object with these exact fields:
{
  "gender": "여성" or "남성",
  "age": "10대" or "20대" or "30대" or "40대",
  "mood": one of ["로맨틱", "보이시", "캐주얼", "시크", "내추럴"]
}
Rules:
- gender: female face/body = "여성", male = "남성"
- age: estimate from face
- mood: overall vibe of the person/styling
Return ONLY the JSON, no explanation.`);if(t===null)return e.json({success:!1,message:`라벨링 요청 실패`},500);try{let n=i(t);return e.json({success:!0,labels:{gender:n.gender||`미분류`,age:n.age||`미분류`,mood:n.mood||`미분류`}})}catch{return e.json({success:!1,message:`응답 파싱 실패`,raw:t})}}else if(t===`background`){let t=await et(r,n,`You are a fashion photography background classifier. Analyze this background image and return ONLY a JSON object:
{
  "category": one of ["스튜디오", "야외/자연", "도심/거리", "인테리어", "컨셉/특수"],
  "mood": one of ["미니멀", "내추럴", "모던", "빈티지", "럭셔리", "스트릿"],
  "name_ko": short Korean name for this background (5-10 chars)
}
Return ONLY the JSON, no explanation.`);if(t===null)return e.json({success:!1,message:`라벨링 요청 실패`},500);try{let n=i(t);return e.json({success:!0,labels:{category:n.category||`스튜디오`,mood:n.mood||`미니멀`,name_ko:n.name_ko||``}})}catch{return e.json({success:!1,message:`응답 파싱 실패`,raw:t})}}return e.json({success:!1,message:`type은 model 또는 background 이어야 합니다.`},400)}catch(t){return e.json({success:!1,message:t.message},500)}}),U.patch(`/api/admin/models/:id/labels`,K,async e=>{try{let t=e.req.param(`id`),{gender:n,age:r,mood:i}=await e.req.json(),a=e.env?.LOOKBOOK_KV,o=e.env?.LOOKBOOK_DB;if(a){let o=await J(a),s=o.findIndex(e=>e.id===t);return s===-1?e.json({success:!1,message:`모델을 찾을 수 없습니다.`},404):(o[s]={...o[s],gender:n||`미분류`,age:r||`미분류`,mood:i||`미분류`},await Le(a,o),e.json({success:!0}))}return o?(await o.prepare(`UPDATE custom_models SET gender=?, age=?, mood=? WHERE id=?`).bind(n||`미분류`,r||`미분류`,i||`미분류`,t).run(),e.json({success:!0})):e.json({success:!1,message:`D1/KV 없음`},500)}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/admin/models`,K,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB;if(t){let n=await J(t);return e.json({success:!0,models:n})}if(n){let t=await Ve(n);return e.json({success:!0,models:t})}let r=X.map(e=>({id:e.id,name:e.name,desc:e.desc,createdAt:e.createdAt}));return e.json({success:!0,models:r})}),U.delete(`/api/admin/models/:id`,K,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n){let r=await J(n),i=r.filter(e=>e.id!==t);return await Le(n,i),await n.delete(`model_img:${t}`),e.json({success:r.length>i.length})}if(r){let n=await Ue(r,t);return e.json({success:n})}let i=X.length;return X=X.filter(e=>e.id!==t),e.json({success:X.length<i})}),U.get(`/api/proxy/custom-model/:id`,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB,i=null;if(i=n?await n.get(`model_img:${t}`):r?await We(r,t):X.find(e=>e.id===t)?.imageBase64||null,!i)return e.notFound();let[a,o]=i.split(`,`),s=(a.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,l=atob(o),u=new Uint8Array(l.length);for(let e=0;e<l.length;e++)u[e]=l.charCodeAt(e);return new Response(u.buffer,{headers:{"Content-Type":s,"Cache-Control":`public, max-age=3600`}})}),U.post(`/api/admin/backgrounds`,K,async e=>{try{let t=await e.req.json(),n=Array.isArray(t)?t:[t];if(n.length===0)return e.json({success:!1,message:`업로드할 항목이 없습니다.`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB,a=[];if(r){let e=await Y(r);for(let t of n){let{name:n,bgDesc:i,category:o,imageBase64:s}=t;if(!n||!s)continue;let l=await ze(r),u={id:l,name:n,bgDesc:i||n,category:o||`커스텀`,createdAt:new Date().toISOString()};e.push(u),await r.put(`bg_img:${l}`,s),a.push(u)}await Re(r,e)}else if(i)a=await Ke(i,n);else for(let e of n){let{name:t,bgDesc:n,category:r,imageBase64:i}=e;if(!t||!i)continue;let o=String(Xe++),s={id:o,name:t,bgDesc:n||t,category:r||`커스텀`,imageBase64:i,createdAt:new Date().toISOString()};Z.push(s),a.push({id:o,name:t,bgDesc:s.bgDesc,category:s.category,createdAt:s.createdAt})}return e.json({success:!0,backgrounds:a,count:a.length})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/admin/backgrounds`,K,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB;if(t){let n=await Y(t);return e.json({success:!0,backgrounds:n})}if(n){let t=await Ge(n);return e.json({success:!0,backgrounds:t})}let r=Z.map(e=>({id:e.id,name:e.name,bgDesc:e.bgDesc,category:e.category,createdAt:e.createdAt,hasGenImage:!!e.genImageBase64}));return e.json({success:!0,backgrounds:r})}),U.delete(`/api/admin/backgrounds/:id`,K,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n){let r=await Y(n),i=r.filter(e=>e.id!==t);return await Re(n,i),await n.delete(`bg_img:${t}`),await n.delete(`bg_gen_img:${t}`),e.json({success:r.length>i.length})}if(r){let n=await qe(r,t);return e.json({success:n})}let i=Z.length;return Z=Z.filter(e=>e.id!==t),e.json({success:Z.length<i})}),U.put(`/api/admin/backgrounds/:id/gen-image`,K,async e=>{let t=e.req.param(`id`);try{let n=(await e.req.json())?.imageBase64||``;if(!n)return e.json({success:!1,message:`imageBase64 필수`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB;if(r){let i=await Y(r),a=i.find(e=>e.id===t);return a?(await r.put(`bg_gen_img:${t}`,n),a.hasGenImage=!0,await Re(r,i),e.json({success:!0})):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404)}if(i)return await Ye(i,t,n)?e.json({success:!0}):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404);let a=Z.find(e=>e.id===t);return a?(a.genImageBase64=n,e.json({success:!0})):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404)}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/proxy/custom-bg/:id`,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB,i=null;if(i=n?await n.get(`bg_img:${t}`):r?await Je(r,t):Z.find(e=>e.id===t)?.imageBase64||null,!i)return e.notFound();let[a,o]=i.split(`,`),s=(a.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,l=atob(o),u=new Uint8Array(l.length);for(let e=0;e<l.length;e++)u[e]=l.charCodeAt(e);return new Response(u.buffer,{headers:{"Content-Type":s,"Cache-Control":`public, max-age=3600`}})}),U.get(`/api/proxy/clothing/:jobId/:idx`,async e=>{let t=e.req.param(`jobId`),n=parseInt(e.req.param(`idx`)||`0`,10),r=e.env?.LOOKBOOK_KV;if(!r)return e.notFound();let i=await r.get(`clothing_img:${t}`);if(!i)return e.notFound();let a=[];try{a=JSON.parse(i)}catch{}let o=a[n];if(!o)return e.notFound();let[s,l]=o.split(`,`),u=(s.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,d=atob(l),f=new Uint8Array(d.length);for(let e=0;e<d.length;e++)f[e]=d.charCodeAt(e);return new Response(f.buffer,{headers:{"Content-Type":u,"Cache-Control":`public, max-age=3600`}})});var Qe=e=>({Authorization:`Bearer ${e}`,"Content-Type":`application/json`}),$e=`https://api.openai.com`;async function et(e,t,n){let r=`${$e}/v1/chat/completions`;try{let i=await fetch(r,{method:`POST`,headers:{Authorization:`Bearer ${e}`,"Content-Type":`application/json`},body:JSON.stringify({model:`gpt-4o-mini`,messages:[{role:`user`,content:[{type:`image_url`,image_url:{url:t.startsWith(`data:`)?t:`data:image/jpeg;base64,${t}`}},{type:`text`,text:n}]}]})}),a=await i.text();if(console.log(`openaiChatVision: POST ${r} → HTTP ${i.status} | body(첫 500자): ${a.slice(0,500)}`),!i.ok)return console.error(`openaiChatVision: 요청 실패 (HTTP ${i.status})`),null;let o;try{o=JSON.parse(a)}catch{return console.error(`openaiChatVision: JSON 파싱 실패, 원문:`,a.slice(0,300)),null}let s=o?.choices?.[0]?.message?.content;return typeof s==`string`?s:(console.warn(`openaiChatVision: 예상치 못한 응답 형식:`,JSON.stringify(o).slice(0,300)),null)}catch(e){return console.error(`openaiChatVision error:`,e?.message||e),null}}U.get(`/api/presets/models`,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB,r;r=t?await J(t):n?await Ve(n):X.map(e=>({id:e.id,name:e.name,desc:e.desc,createdAt:e.createdAt}));let i=r.map(e=>({id:Number(e.id),name:e.name,gender:e.gender||`미분류`,age:e.age||`미분류`,mood:e.mood||`미분류`,body:`-`,skin:`-`,desc:e.desc,unsplashId:null,isCustom:!0,customId:e.id}));return e.json({models:i})}),U.get(`/api/presets/backgrounds`,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB,r;r=t?await Y(t):n?await Ge(n):Z.map(e=>({id:e.id,name:e.name,bgDesc:e.bgDesc,category:e.category,createdAt:e.createdAt}));let i=r.map(e=>({id:Number(e.id),name:e.name,category:e.category,mood:`-`,bgDesc:e.bgDesc,unsplashId:null,isCustom:!0,customId:e.id}));return e.json({backgrounds:i})});var tt=`home_showcase_images`,nt=[1,2,3,4,5,6];async function rt(e){let t=await e.get(tt);if(!t)return[];try{return JSON.parse(t)}catch{return[]}}async function it(e,t){await e.put(tt,JSON.stringify(t))}U.get(`/api/home/showcase`,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({images:[]});let n=await rt(t);return e.json({images:n.map(e=>({id:e.id,imageBase64:e.imageBase64}))})}),U.get(`/api/admin/home-showcase`,K,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=await rt(t);return e.json({success:!0,images:n})}),U.post(`/api/admin/home-showcase`,K,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);try{let n=await e.req.json(),r=Array.isArray(n?.images)?n.images:[];if(!r.length)return e.json({success:!1,message:`이미지가 필요합니다.`},400);let i=await rt(t),a=r.map(e=>({id:crypto.randomUUID(),imageBase64:e,createdAt:new Date().toISOString()})),o=[...i,...a];return await it(t,o),e.json({success:!0,count:a.length,images:o})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.delete(`/api/admin/home-showcase/:id`,K,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=e.req.param(`id`);return await it(t,(await rt(t)).filter(e=>e.id!==n)),e.json({success:!0})});async function at(e,t){return await e.get(`home_feature_bg_${t}`)}U.get(`/api/home/feature-bgs`,async e=>{let t=e.env?.LOOKBOOK_KV,n={};if(t)for(let e of nt)n[e]=await at(t,e);else nt.forEach(e=>{n[e]=null});return e.json({backgrounds:n})}),U.put(`/api/admin/home-feature-bg/:slot`,K,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));if(!nt.includes(n))return e.json({success:!1,message:`잘못된 슬롯`},400);try{let r=(await e.req.json())?.imageBase64||``;return r?(await t.put(`home_feature_bg_${n}`,r),e.json({success:!0})):e.json({success:!1,message:`imageBase64 필수`},400)}catch(t){return e.json({success:!1,message:t.message},500)}}),U.delete(`/api/admin/home-feature-bg/:slot`,K,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));return nt.includes(n)?(await t.delete(`home_feature_bg_${n}`),e.json({success:!0})):e.json({success:!1,message:`잘못된 슬롯`},400)});var Q=[1],ot=22*1024*1024;U.get(`/api/home/howto-videos`,async e=>{let t=e.env?.LOOKBOOK_KV,n={};if(t)for(let e of Q)n[e]=(await t.getWithMetadata(`home_howto_video_${e}`)).value==null?null:`/api/home/howto-video/${e}`;else Q.forEach(e=>{n[e]=null});return e.json({videos:n})}),U.get(`/api/home/howto-video/:slot`,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.notFound();let n=Number(e.req.param(`slot`));if(!Q.includes(n))return e.notFound();let{value:r,metadata:i}=await t.getWithMetadata(`home_howto_video_${n}`,`arrayBuffer`);if(!r)return e.notFound();let a=r,o=i?.contentType||`video/mp4`,s=a.byteLength,l=e.req.header(`range`);if(l){let e=l.match(/bytes=(\d*)-(\d*)/);if(e){let t=e[1]?parseInt(e[1],10):0,n=e[2]?parseInt(e[2],10):s-1,r=Math.max(0,Math.min(t,s-1)),i=Math.max(r,Math.min(n,s-1)),l=a.slice(r,i+1);return new Response(l,{status:206,headers:{"Content-Type":o,"Content-Range":`bytes ${r}-${i}/${s}`,"Accept-Ranges":`bytes`,"Content-Length":String(l.byteLength),"Cache-Control":`public, max-age=3600`}})}}return new Response(a,{headers:{"Content-Type":o,"Accept-Ranges":`bytes`,"Cache-Control":`public, max-age=3600`,"Content-Length":String(s)}})}),U.put(`/api/admin/home-howto-video/:slot`,K,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));if(!Q.includes(n))return e.json({success:!1,message:`잘못된 슬롯`},400);try{let r=await e.req.arrayBuffer();if(!r||r.byteLength===0)return e.json({success:!1,message:`영상 파일이 필요합니다.`},400);if(r.byteLength>ot)return e.json({success:!1,message:`영상 용량은 ${Math.floor(ot/1024/1024)}MB 이하만 가능합니다.`},400);let i=e.req.header(`content-type`)||`video/mp4`;return await t.put(`home_howto_video_${n}`,r,{metadata:{contentType:i}}),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.delete(`/api/admin/home-howto-video/:slot`,K,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));return Q.includes(n)?(await t.delete(`home_howto_video_${n}`),e.json({success:!0})):e.json({success:!1,message:`잘못된 슬롯`},400)});var st=`fashion_news_cache_v1`,ct=1200*1e3;function lt(e){let t=e.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);return(t?t[1]:e).replace(/&amp;/g,`&`).replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&#39;/g,`'`).replace(/&quot;/g,`"`).trim()}function ut(e){let t=[],n=e.match(/<item>[\s\S]*?<\/item>/g)||[];for(let e of n){let n=e.match(/<title>([\s\S]*?)<\/title>/),r=e.match(/<link>([\s\S]*?)<\/link>/),i=e.match(/<source[^>]*>([\s\S]*?)<\/source>/),a=e.match(/<pubDate>([\s\S]*?)<\/pubDate>/);!n||!r||t.push({title:lt(n[1]),link:lt(r[1]),source:i?lt(i[1]):``,pubDate:a?lt(a[1]):``})}return t.slice(0,12)}U.get(`/api/fashion-news`,async e=>{let t=e.env?.LOOKBOOK_KV;async function n(){if(!t)return null;let e=await t.get(st);if(!e)return null;try{return JSON.parse(e).news||null}catch{return null}}try{if(t){let n=await t.get(st);if(n){let t=JSON.parse(n);if(Date.now()-t.fetchedAt<ct)return e.json({news:t.news})}}let r=await fetch(`https://news.google.com/rss/search?q=%ED%8C%A8%EC%85%98&hl=ko&gl=KR&ceid=KR:ko`,{headers:{"User-Agent":`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36`,Accept:`application/rss+xml, application/xml, text/xml, */*`,"Accept-Language":`ko-KR,ko;q=0.9`}});if(!r.ok)throw Error(`RSS fetch failed: ${r.status}`);let i=ut(await r.text());if(i.length===0){let t=await n();return t&&t.length>0?e.json({news:t}):(console.warn(`fashion-news: RSS 응답에서 기사 파싱 실패 (item 0개)`),e.json({news:[]}))}return t&&await t.put(st,JSON.stringify({fetchedAt:Date.now(),news:i})),e.json({news:i})}catch(t){console.warn(`fashion-news fetch error:`,t.message);let r=await n();return e.json({news:r||[]})}}),U.get(`/api/proxy/model-image/:id`,e=>e.notFound()),U.get(`/api/proxy/bg-image/:id`,e=>e.notFound()),U.get(`/api/proxy/gen-image`,async e=>{let t=e.req.query(`url`),n=e.req.query(`download`)===`1`;if(!t)return e.json({error:`Missing url param`},400);try{if(!new URL(t).protocol.startsWith(`https`))return e.json({error:`Only HTTPS URLs allowed`},400);let r=e.req.header(`Range`),i={"User-Agent":`Mozilla/5.0 (compatible; LookbookAI/1.0)`};r&&(i.Range=r);let a=await fetch(t,{headers:i});if(!a.ok&&a.status!==206)return e.json({error:`Upstream error: ${a.status}`},a.status);let o=a.headers.get(`Content-Type`)||`image/jpeg`,s=o.includes(`video`)?`mp4`:`jpg`,l=`lookbook_ai_${Date.now()}.${s}`,u={"Content-Type":o,"Cache-Control":`public, max-age=3600`,"Access-Control-Allow-Origin":`*`,"Accept-Ranges":`bytes`},d=a.headers.get(`Content-Range`);d&&(u[`Content-Range`]=d);let f=a.headers.get(`Content-Length`);return f&&(u[`Content-Length`]=f),n&&(u[`Content-Disposition`]=`attachment; filename="${l}"`),new Response(a.body,{status:a.status,headers:u})}catch(t){return console.error(`Gen image proxy error:`,t),e.json({error:t.message},500)}});var dt=[{id:`p1`,name:`2024 S/S 룩북`,status:`done`,images:8,created:`2024-03-15`,thumb_color:`#FF6B9D`},{id:`p2`,name:`캐주얼 티셔츠 컷`,status:`done`,images:4,created:`2024-03-12`,thumb_color:`#6C47FF`},{id:`p3`,name:`데님 라인 촬영`,status:`processing`,images:0,created:`2024-03-10`,thumb_color:`#3B82F6`},{id:`p4`,name:`원피스 봄 컬렉션`,status:`draft`,images:0,created:`2024-03-08`,thumb_color:`#00D4AA`}];U.get(`/api/projects`,e=>e.json({projects:dt})),U.get(`/api/locale`,e=>{let t=(e.req.header(`CF-IPCountry`)??e.req.header(`cf-ipcountry`)??e.req.raw.cf?.country??``).toUpperCase(),n=`en`;return t===`KR`?n=`ko`:t===`JP`&&(n=`ja`),e.json({locale:n,country:t})}),U.get(`/api/config/kakao-js-key`,e=>e.json({key:e.env.KAKAO_JS_KEY||``}));function ft(){let e=new Uint8Array(32);return crypto.getRandomValues(e),Array.from(e).map(e=>e.toString(16).padStart(2,`0`)).join(``)}function pt(){return`u_`+ft().substring(0,16)}async function mt(e){let t=ft().substring(0,16),n=new TextEncoder().encode(t+e),r=await crypto.subtle.digest(`SHA-256`,n);return`${t}:${Array.from(new Uint8Array(r)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}`}async function ht(e,t){let[n,r]=t.split(`:`),i=new TextEncoder().encode(n+e),a=await crypto.subtle.digest(`SHA-256`,i);return Array.from(new Uint8Array(a)).map(e=>e.toString(16).padStart(2,`0`)).join(``)===r}async function gt(e,t){if(!t)return null;let n=new Date().toISOString();return await e.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.status, u.credits, u.avatar_url, u.provider
    FROM user_sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.status = 'active'
  `).bind(t,n).first()||null}async function _t(e,t){let n=ft(),r=new Date(Date.now()+720*60*60*1e3).toISOString();return await e.prepare(`DELETE FROM user_sessions WHERE user_id = ? AND token NOT IN (
    SELECT token FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 4
  )`).bind(t,t).run(),await e.prepare(`INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).bind(n,t,r).run(),n}function vt(e){return{id:e.id,name:e.name,email:e.email,role:e.role,credits:e.credits,avatar_url:e.avatar_url,provider:e.provider}}U.post(`/api/auth/signup`,async e=>{try{let t=e.env.LOOKBOOK_DB,{name:n,email:r,password:i,agreeMarketing:a}=await e.req.json();if(!n||!r||!i)return e.json({success:!1,message:`모든 항목을 입력해주세요.`},400);if(i.length<8)return e.json({success:!1,message:`비밀번호는 8자 이상이어야 합니다.`},400);if(await t.prepare(`SELECT id FROM users WHERE email = ?`).bind(r).first())return e.json({success:!1,message:`이미 가입된 이메일입니다.`},409);let o=pt(),s=await mt(i),l=+!!a;await t.prepare(`
      INSERT INTO users (id, email, name, password_hash, provider, status, credits, role, agree_marketing)
      VALUES (?, ?, ?, ?, 'email', 'active', 200, 'user', ?)
    `).bind(o,r.toLowerCase(),n,s,l).run();let u=await _t(t,o),d={id:o,name:n,email:r.toLowerCase(),role:`user`,credits:200,avatar_url:null,provider:`email`};return e.json({success:!0,user:d,token:u})}catch(t){return console.error(`signup error:`,t),e.json({success:!1,message:`서버 오류가 발생했습니다.`},500)}}),U.post(`/api/auth/login`,async e=>{try{let t=e.env.LOOKBOOK_DB,{email:n,password:r}=await e.req.json();if(!n||!r)return e.json({success:!1,message:`이메일과 비밀번호를 입력해주세요.`},400);let i=await t.prepare(`SELECT * FROM users WHERE email = ? AND provider = 'email'`).bind(n.toLowerCase()).first();if(!i)return e.json({success:!1,message:`이메일 또는 비밀번호가 올바르지 않습니다.`},401);if(i.status!==`active`)return e.json({success:!1,message:`정지된 계정입니다. 관리자에게 문의하세요.`},403);if(!i.password_hash)return e.json({success:!1,message:`소셜 계정으로 가입된 이메일입니다.`},400);if(!await ht(r,i.password_hash))return e.json({success:!1,message:`이메일 또는 비밀번호가 올바르지 않습니다.`},401);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(i.id).run();let a=await _t(t,i.id);return e.json({success:!0,user:vt(i),token:a})}catch(t){return console.error(`login error:`,t),e.json({success:!1,message:`서버 오류가 발생했습니다.`},500)}}),U.get(`/api/auth/me`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await gt(t,e.req.header(`X-Session-Token`)||e.req.query(`token`)||null);return n?e.json({success:!0,user:vt(n)}):e.json({success:!1,message:`로그인이 필요합니다.`},401)}catch{return e.json({success:!1,message:`서버 오류`},500)}}),U.post(`/api/auth/logout`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`);return n&&await t.prepare(`DELETE FROM user_sessions WHERE token = ?`).bind(n).run(),e.json({success:!0})}catch{return e.json({success:!0})}});function $(e){let t=e.req.header(`host`)||e.req.header(`x-forwarded-host`)||``;return`${t.startsWith(`localhost`)?`http`:`https`}://${t}`}U.get(`/api/auth/kakao`,e=>{let t=$(e),n=e.req.query(`mode`)||`popup`,r=`${t}/api/auth/kakao/callback`,i=e.env.KAKAO_CLIENT_ID||``;if(!i)return n===`redirect`?e.redirect(`/?oauth_error=kakao_no_key`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'카카오 앱 키가 설정되지 않았습니다.'},'*');window.close();<\/script>`);let a=`https://kauth.kakao.com/oauth/authorize?client_id=${i}&redirect_uri=${encodeURIComponent(r)}&response_type=code&state=${n}`;return e.redirect(a)}),U.get(`/api/auth/kakao/callback`,async e=>{let t=e.env.LOOKBOOK_DB,n=$(e),r=e.req.query(`code`),i=e.req.query(`error`),a=e.req.query(`state`)||`popup`;function o(t){return a===`redirect`?e.redirect(`/?oauth_error=${encodeURIComponent(t)}`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'${t}'},'*');window.close();<\/script>`)}if(i||!r)return o(i||`cancelled`);try{let i=`${n}/api/auth/kakao/callback`,o=await(await fetch(`https://kauth.kakao.com/oauth/token`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:new URLSearchParams({grant_type:`authorization_code`,code:r,client_id:e.env.KAKAO_CLIENT_ID||``,client_secret:e.env.KAKAO_CLIENT_SECRET||``,redirect_uri:i})})).json();if(!o.access_token)throw Error(`카카오 토큰 발급 실패`);let s=await(await fetch(`https://kapi.kakao.com/v2/user/me`,{headers:{Authorization:`Bearer ${o.access_token}`}})).json(),l=String(s.id),u=s.kakao_account?.email||`kakao_${l}@kakao.local`,d=s.kakao_account?.profile?.nickname||`카카오 사용자`,f=s.kakao_account?.profile?.profile_image_url||null,p=await t.prepare(`SELECT * FROM users WHERE provider = 'kakao' AND provider_id = ?`).bind(l).first();if(!p)if(p=await t.prepare(`SELECT * FROM users WHERE email = ?`).bind(u).first(),p)await t.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(l,f,p.id).run();else{let e=pt();await t.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'kakao', ?, ?, 'active', 200, 'user')`).bind(e,u,d,l,f).run(),p=await t.prepare(`SELECT * FROM users WHERE id = ?`).bind(e).first()}if(!p||p.status!==`active`)throw Error(`계정이 정지 상태입니다.`);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(p.id).run();let m=await _t(t,p.id),h=JSON.stringify(vt(p));return a===`redirect`?e.html(`<!DOCTYPE html>
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
</body></html>`)}catch(e){return console.error(`kakao callback error:`,e),o(e.message||`로그인 오류`)}}),U.get(`/api/auth/google`,e=>{let t=$(e),n=e.req.query(`mode`)||`popup`,r=`${t}/api/auth/google/callback`,i=e.env.GOOGLE_CLIENT_ID||``;if(!i)return n===`redirect`?e.redirect(`/?oauth_error=google_no_key`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'구글 클라이언트 ID가 설정되지 않았습니다.'},'*');window.close();<\/script>`);let a=new URLSearchParams({client_id:i,redirect_uri:r,response_type:`code`,scope:`openid email profile`,access_type:`offline`,prompt:`select_account`,state:n});return e.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${a}`)}),U.get(`/api/auth/google/callback`,async e=>{let t=e.env.LOOKBOOK_DB,n=$(e),r=e.req.query(`code`),i=e.req.query(`error`),a=e.req.query(`state`)||`popup`;function o(t){return a===`redirect`?e.redirect(`/?oauth_error=${encodeURIComponent(t)}`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'${t}'},'*');window.close();<\/script>`)}if(i||!r)return o(i||`cancelled`);try{let i=`${n}/api/auth/google/callback`,o=await(await fetch(`https://oauth2.googleapis.com/token`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:new URLSearchParams({grant_type:`authorization_code`,code:r,client_id:e.env.GOOGLE_CLIENT_ID||``,client_secret:e.env.GOOGLE_CLIENT_SECRET||``,redirect_uri:i})})).json();if(!o.access_token)throw Error(`구글 토큰 발급 실패`);let s=await(await fetch(`https://www.googleapis.com/oauth2/v2/userinfo`,{headers:{Authorization:`Bearer ${o.access_token}`}})).json(),l=s.id,u=s.email,d=s.name||`구글 사용자`,f=s.picture||null,p=await t.prepare(`SELECT * FROM users WHERE provider = 'google' AND provider_id = ?`).bind(l).first();if(!p)if(p=await t.prepare(`SELECT * FROM users WHERE email = ?`).bind(u).first(),p)await t.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(l,f,p.id).run();else{let e=pt();await t.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'google', ?, ?, 'active', 200, 'user')`).bind(e,u,d,l,f).run(),p=await t.prepare(`SELECT * FROM users WHERE id = ?`).bind(e).first()}if(!p||p.status!==`active`)throw Error(`계정이 정지 상태입니다.`);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(p.id).run();let m=await _t(t,p.id),h=JSON.stringify(vt(p));return a===`redirect`?e.html(`<!DOCTYPE html>
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
</body></html>`)}catch(e){return console.error(`google callback error:`,e),o(e.message||`로그인 오류`)}}),U.get(`/api/admin/users`,K,async e=>{try{let t=e.env.LOOKBOOK_DB,n=parseInt(e.req.query(`page`)||`1`),r=parseInt(e.req.query(`limit`)||`50`),i=e.req.query(`search`)||``,a=e.req.query(`status`)||``,o=(n-1)*r,s=`WHERE 1=1`,l=[];i&&(s+=` AND (name LIKE ? OR email LIKE ?)`,l.push(`%${i}%`,`%${i}%`)),a&&(s+=` AND status = ?`,l.push(a));let u=await t.prepare(`SELECT COUNT(*) as cnt FROM users ${s}`).bind(...l).first(),d=await t.prepare(`SELECT id, name, email, provider, status, credits, role, last_login_at, created_at FROM users ${s} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...l,r,o).all();return e.json({success:!0,users:d.results,total:u?.cnt||0,page:n,limit:r})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/admin/users/:id`,K,async e=>{try{let t=await e.env.LOOKBOOK_DB.prepare(`SELECT id, name, email, provider, status, credits, role, last_login_at, created_at FROM users WHERE id = ?`).bind(e.req.param(`id`)).first();return t?e.json({success:!0,user:t}):e.json({success:!1,message:`존재하지 않는 사용자입니다.`},404)}catch(t){return e.json({success:!1,message:t.message},500)}}),U.patch(`/api/admin/users/:id`,K,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await e.req.json(),r=e.req.param(`id`),i=[],a=[];if(n.status!==void 0&&(i.push(`status = ?`),a.push(n.status)),n.role!==void 0&&(i.push(`role = ?`),a.push(n.role)),n.add_credits!==void 0){let o=(await t.prepare(`SELECT credits FROM users WHERE id = ?`).bind(r).first())?.credits??0,s=parseInt(n.add_credits),l=Math.max(0,o+s);return i.push(`credits = ?`),a.push(l),i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'grant', ?, ?, 'admin_grant', ?)`).bind(r,s,l,`admin_${Date.now()}`).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0,newCredits:l})}if(n.credits!==void 0){let o=(await t.prepare(`SELECT credits FROM users WHERE id = ?`).bind(r).first())?.credits??0,s=parseInt(n.credits),l=s-o;return i.push(`credits = ?`),a.push(s),i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),l!==0&&await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
           VALUES (?, ?, ?, ?, 'admin_set', ?)`).bind(r,l>0?`grant`:`deduct`,l,s,`admin_${Date.now()}`).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0,newCredits:s})}return i.length===0?e.json({success:!1,message:`변경할 항목이 없습니다.`},400):(i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0}))}catch(t){return e.json({success:!1,message:t.message},500)}}),U.delete(`/api/admin/users/:id`,K,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.param(`id`);return await t.prepare(`UPDATE users SET status = 'deleted', updated_at = datetime('now') WHERE id = ?`).bind(n).run(),await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(n).run(),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/admin/stats`,K,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status != 'deleted'`).first(),r=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'active'`).first(),i=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'suspended'`).first(),a=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE date(created_at) = date('now') AND status != 'deleted'`).first(),o=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'kakao' AND status = 'active'`).first(),s=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'google' AND status = 'active'`).first(),l=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'email' AND status = 'active'`).first();return e.json({success:!0,stats:{total:n?.cnt||0,active:r?.cnt||0,suspended:i?.cnt||0,today:a?.cnt||0,by_provider:{kakao:o?.cnt||0,google:s?.cnt||0,email:l?.cnt||0}}})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/credits/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT type, amount, balance, reason, ref_id, created_at
       FROM credit_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`).bind(r.user_id).all();return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/generation/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT id, seq_no, job_id, image_count, model_name, bg_name, ratio,
              image_urls, expires_at, created_at, downloaded_indices, kind, video_url
       FROM generation_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`).bind(r.user_id).all();return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.post(`/api/generation/save-images`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let{job_id:i,image_urls:a}=await e.req.json();if(!i||!a)return e.json({error:`job_id, image_urls 필수`},400);let o=JSON.stringify(Array.isArray(a)?a:[a]),s=new Date(Date.now()+336*60*60*1e3).toISOString().replace(`T`,` `).slice(0,19);return await t.prepare(`UPDATE generation_logs
       SET image_urls = ?, expires_at = datetime('now', '+14 days')
       WHERE job_id = ? AND user_id = ?`).bind(o,i,r.user_id).run(),e.json({success:!0,expires_at:s})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.post(`/api/credits/deduct`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);let r=await t.prepare(`SELECT s.user_id, u.credits, u.name FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`,code:`UNAUTHORIZED`},401);let i=await e.req.json().catch(()=>({})),a=i?.job_id,o=Number.isInteger(i?.idx)?i.idx:void 0,s=null,l=[];if(a){if(s=await t.prepare(`SELECT id, downloaded_indices FROM generation_logs WHERE job_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`).bind(a,r.user_id).first(),s?.downloaded_indices)try{l=JSON.parse(s.downloaded_indices)}catch{}if(s&&o!==void 0&&l.includes(o))return e.json({success:!0,creditsUsed:0,creditsRemaining:r.credits,alreadyDownloaded:!0})}let u=Et;if(r.credits<u)return e.json({error:`크레딧이 부족합니다. (보유: ${r.credits}크레딧, 필요: ${u}크레딧)`,code:`INSUFFICIENT_CREDITS`,available:r.credits,required:u},402);let d=r.credits-u;return await t.prepare(`UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?`).bind(d,r.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'deduct', ?, ?, 'image_download', ?)`).bind(r.user_id,-u,d,`dl_${Date.now()}`).run(),s&&o!==void 0&&(l.push(o),await t.prepare(`UPDATE generation_logs SET downloaded_indices = ? WHERE id = ?`).bind(JSON.stringify(l),s.id).run()),console.log(`[Credits] Download deduct: ${r.name} ${r.credits} → ${d} (-${u})`),e.json({success:!0,creditsUsed:u,creditsRemaining:d,alreadyDownloaded:!1})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.delete(`/api/generation/history/:id`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=e.req.param(`id`);return await t.prepare(`DELETE FROM generation_logs WHERE id = ? AND user_id = ?`).bind(i,r.user_id).run(),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}});var yt={pkg_20000:{amount:2e4,credits:1e3,label:`20,000원 → 1,000크레딧`},pkg_40000:{amount:4e4,credits:2300,label:`40,000원 → 2,300크레딧`},pkg_60000:{amount:6e4,credits:4e3,label:`60,000원 → 4,000크레딧`}};U.get(`/api/payments/packages`,e=>e.json({success:!0,packages:yt})),U.post(`/api/payments/prepare`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT s.user_id, u.name, u.email FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let{packageId:i}=await e.req.json(),a=yt[i];if(!a)return e.json({error:`잘못된 패키지입니다.`},400);let o=await t.prepare(`SELECT order_id FROM payment_logs
       WHERE user_id = ? AND amount = ? AND status = 'pending'
         AND created_at > datetime('now', '-5 minutes')
       ORDER BY created_at DESC LIMIT 1`).bind(r.user_id,a.amount).first();if(o?.order_id)return e.json({success:!0,orderId:o.order_id,amount:a.amount,credits:a.credits,orderName:a.label,customerName:r.name,customerEmail:r.email,clientId:e.env.NICEPAY_CLIENT_ID||``});let s=`lookbook-${r.user_id.slice(0,6)}-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;return await t.prepare(`INSERT INTO payment_logs (user_id, order_id, amount, credits, status)
       VALUES (?, ?, ?, ?, 'pending')`).bind(r.user_id,s,a.amount,a.credits).run(),e.json({success:!0,orderId:s,amount:a.amount,credits:a.credits,orderName:a.label,customerName:r.name,customerEmail:r.email,clientId:e.env.NICEPAY_CLIENT_ID||``})}catch(t){return e.json({success:!1,message:t.message},500)}});async function bt(e){let t=new TextEncoder().encode(e),n=await crypto.subtle.digest(`SHA-256`,t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}U.post(`/payment/return`,async e=>{let t=e.env.LOOKBOOK_DB;try{let n=await e.req.parseBody(),r=String(n.authResultCode||``),i=String(n.authResultMsg||``),a=String(n.tid||``),o=String(n.clientId||``),s=String(n.orderId||``),l=String(n.amount||``),u=String(n.authToken||``),d=String(n.signature||``);if(r!==`0000`)return e.redirect(`/payment/fail?message=${encodeURIComponent(i||`결제 인증에 실패했습니다.`)}&code=${encodeURIComponent(r)}`,302);let f=e.env.NICEPAY_SECRET_KEY||``;if(await bt(u+o+l+f)!==d)return console.error(`나이스페이먼츠 서명 불일치 — 위변조 의심:`,s),e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EA%B2%80%EC%A6%9D%EC%97%90%20%EC%8B%A4%ED%8C%A8%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302);let p=await t.prepare(`SELECT id, user_id, amount, credits, status FROM payment_logs
       WHERE order_id = ? AND status = 'pending'`).bind(s).first();if(!p)return e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EC%A0%95%EB%B3%B4%EB%A5%BC%20%EC%B0%BE%EC%9D%84%20%EC%88%98%20%EC%97%86%EA%B1%B0%EB%82%98%20%EC%9D%B4%EB%AF%B8%20%EC%B2%98%EB%A6%AC%EB%90%98%EC%97%88%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302);if(Number(l)!==Number(p.amount))return e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EA%B8%88%EC%95%A1%EC%9D%B4%20%EC%9D%BC%EC%B9%98%ED%95%98%EC%A7%80%20%EC%95%8A%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302);let m=e.env.NICEPAY_API_BASE||`https://sandbox-api.nicepay.co.kr`,h=new Date().toISOString(),g=await bt(a+l+h+f),_=`Basic `+btoa(`${o}:${f}`),v=await fetch(`${m}/v1/payments/${a}`,{method:`POST`,headers:{Authorization:_,"Content-Type":`application/json`},body:JSON.stringify({amount:Number(l),ediDate:h,signData:g})}),y=await v.json();if(!v.ok||y.resultCode!==`0000`)return await t.prepare(`UPDATE payment_logs
         SET status='failed', pg_raw=?, paid_at=datetime('now')
         WHERE order_id=?`).bind(JSON.stringify(y),s).run(),e.redirect(`/payment/fail?message=${encodeURIComponent(y.resultMsg||`결제 승인 실패`)}&code=${encodeURIComponent(y.resultCode||``)}`,302);await t.prepare(`UPDATE payment_logs
       SET status='paid', payment_key=?, pg_method=?, pg_raw=?, paid_at=datetime('now')
       WHERE order_id=?`).bind(y.tid,y.payMethod||``,JSON.stringify(y),s).run();let b=((await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(p.user_id).first())?.credits??0)+Number(p.credits);return await t.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(b,p.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'grant', ?, ?, 'payment', ?)`).bind(p.user_id,p.credits,b,s).run(),e.redirect(`/payment/success?orderId=${encodeURIComponent(s)}`,302)}catch(t){return console.error(`payment/return error:`,t),e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EC%B2%98%EB%A6%AC%20%EC%A4%91%20%EC%98%A4%EB%A5%98%EA%B0%80%20%EB%B0%9C%EC%83%9D%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302)}}),U.post(`/payment/webhook`,async e=>{let t=e.env.LOOKBOOK_DB,n=()=>e.text(`OK`,200,{"Content-Type":`text/html;charset=utf-8`});try{let r=await e.req.text(),i={};try{i=JSON.parse(r)}catch{i=Object.fromEntries(new URLSearchParams(r))}let a=String(i.tid||``),o=String(i.orderId||``),s=String(i.amount||``),l=String(i.ediDate||``),u=String(i.signature||``),d=String(i.status||``),f=String(i.resultCode||``),p=e.env.NICEPAY_SECRET_KEY||``,m=await bt(a+s+l+p);if(!a||m!==u)return console.error(`나이스페이 웹훅 서명 불일치 — 위변조 의심:`,o,a),n();if(!([`canceled`,`cancelled`,`partialCancelled`,`PARTIAL_CANCELED`].includes(d)||f===`2001`))return n();let h=await t.prepare(`SELECT id, user_id, credits, status FROM payment_logs WHERE order_id = ? OR payment_key = ?`).bind(o,a).first();if(!h)return console.error(`나이스페이 웹훅: 결제 내역을 찾을 수 없음:`,o,a),n();if(h.status===`canceled`)return n();let g=(await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(h.user_id).first())?.credits??0,_=Number(h.credits)||0,v=Math.min(_,g),y=Math.max(0,g-v);return v>0&&(await t.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(y,h.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'revoke', ?, ?, 'payment_cancel', ?)`).bind(h.user_id,-v,y,o).run()),await t.prepare(`UPDATE payment_logs SET status='canceled' WHERE id=?`).bind(h.id).run(),console.log(`나이스페이 웹훅: 결제취소 처리 완료 — orderId=${o}, 회수 크레딧=${v}`),n()}catch(e){return console.error(`payment/webhook error:`,e),n()}}),U.get(`/api/payments/status`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=e.req.query(`orderId`)||``;if(!i)return e.json({error:`orderId 필수`},400);let a=await t.prepare(`SELECT status, credits FROM payment_logs WHERE order_id = ? AND user_id = ?`).bind(i,r.user_id).first();if(!a)return e.json({error:`결제 정보를 찾을 수 없습니다.`},404);if(a.status!==`paid`)return e.json({error:`결제가 완료되지 않았습니다.`,status:a.status},400);let o=await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(r.user_id).first();return e.json({success:!0,credits:a.credits,creditsTotal:o?.credits??0})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.get(`/api/payments/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT order_id, amount, credits, status, pg_method, created_at, paid_at
       FROM payment_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`).bind(r.user_id).all();return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),U.post(`/api/uploads/image`,async e=>{try{let t=(await e.req.formData()).get(`file`);if(!t)return e.json({success:!1,message:`파일이 없습니다.`},400);let n=await t.arrayBuffer(),r=btoa(String.fromCharCode(...new Uint8Array(n))),i=`data:${t.type||`image/jpeg`};base64,${r}`;return e.json({success:!0,imageId:`img_`+Math.random().toString(36).substr(2,9),url:i,dataUrl:i})}catch(t){return e.json({success:!1,message:t.message},500)}});function xt(e){return{"1:1":`1:1`,"4:5":`4:5`,"3:4":`3:4`,"9:16":`9:16`}[e]||`3:4`}function St(e){return e===`4K`?`4k`:e===`HD`?`2k`:`1k`}U.post(`/api/clothing/classify`,async e=>{try{let t=(await e.req.json()).images||[];if(t.length===0)return e.json({success:!1,message:`이미지가 없습니다.`},400);await Promise.all(t.map(async({dataUrl:t,index:n})=>{try{let r=[`Analyze this clothing item image and classify it into EXACTLY ONE of these categories:`,`TOP — shirts, t-shirts, blouses, crop tops, hoodies (without coat), sweaters, knits, vests worn as tops`,`BOTTOM — pants, trousers, jeans, skirts, shorts, leggings`,`OUTER — coats, jackets, blazers, cardigans worn as outerwear, parkas, windbreakers, leather jackets, denim jackets`,`DRESS — one-piece dresses, jumpsuits, overalls that cover both top and bottom`,`UNKNOWN — if cannot determine`,`Respond in EXACTLY this JSON format only, no other text:`,`{"category":"TOP","label":"white button-down shirt","confidence":0.95}`].join(` `),i=await(await fetch(`${W}/api/v1/model/generateImage`,{method:`POST`,headers:Qe(e.env.ATLAS_API_KEY),body:JSON.stringify({model:`google/nano-banana-2/edit`,prompt:r,images:[t],aspect_ratio:`1:1`,resolution:`1k`,thinking_level:`default`,output_format:`jpeg`})})).json();if(console.log(`Classify atlas response code:`,i.code),i.code===200&&i.data?.id){let t=i.data.id;for(let n=0;n<10;n++){await new Promise(e=>setTimeout(e,1500));let n=(await fetch(`${W}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json())).data?.status;if(n===`completed`||n===`succeeded`||n===`failed`||n===`error`)break}}return{index:n,category:`UNRESOLVED`,label:``,confidence:0}}catch{return{index:n,category:`UNKNOWN`,label:``,confidence:0}}}));let n=await Promise.all(t.map(async({dataUrl:e,index:t})=>Ct(e,t)));return console.log(`Classify results:`,n.map(e=>`[${e.index}]${e.category}`).join(`, `)),e.json({success:!0,items:n})}catch(t){return console.error(`Classify error:`,t),e.json({success:!1,message:t.message},500)}});async function Ct(e,t){try{let n=await(await fetch(`${W}/api/v1/model/generateImage`,{method:`POST`,headers:Qe(c.env.ATLAS_API_KEY),body:JSON.stringify({model:`google/nano-banana-2`,prompt:[`CLASSIFICATION TASK. Look at this clothing item.`,`Output ONLY ONE WORD: TOP or BOTTOM or OUTER or DRESS`,`TOP = shirt/tshirt/blouse/sweater/hoodie/knit/vest`,`BOTTOM = pants/jeans/skirt/shorts/leggings`,`OUTER = coat/jacket/blazer/cardigan/parka`,`DRESS = one-piece dress/jumpsuit`].join(` `),images:[e],aspect_ratio:`1:1`,resolution:`1k`,thinking_level:`low`,output_format:`jpeg`})})).json();if(n.code===200&&n.data?.id){let e=n.data.id;for(let t=0;t<8;t++){await new Promise(e=>setTimeout(e,1500));let t=await fetch(`${W}/api/v1/model/prediction/${e}`,{headers:{Authorization:`Bearer ${c.env.ATLAS_API_KEY}`}}).then(e=>e.json());if(t.data?.status===`completed`||t.data?.status===`succeeded`||t.data?.status===`failed`||t.data?.status===`error`)break}}let r=e.split(`,`)[1]||``;return Math.floor(r.length*.75),{index:t,category:`TOP`,label:`clothing item`,confidence:.5}}catch{return{index:t,category:`TOP`,label:`clothing item`,confidence:.3}}}function wt(e,t){let n=[];return e.forEach((e,r)=>{let i=t+r,a={TOP:`TOP GARMENT (shirt/blouse/sweater/jacket-top)`,BOTTOM:`BOTTOM GARMENT (pants/skirt/shorts)`,OUTER:`OUTER LAYER (coat/jacket/cardigan)`,DRESS:`FULL OUTFIT (dress/jumpsuit — covers both top and bottom)`,UNKNOWN:`CLOTHING ITEM`}[e.category]||`CLOTHING ITEM`;n.push(`Image ${i} = ${a}${e.label?` — ${e.label}`:``}.`)}),n.push(`Clothing reference images may show the garment worn by a person (a lifestyle/model photo), on a hanger, or laid flat, possibly with a full outfit (top+bottom) visible together even if only one piece is being used. Whatever the source, extract ONLY the specified garment piece itself (fabric, color, pattern, cut, texture, design details). COMPLETELY IGNORE AND DISCARD everything else from every clothing image: its background/room/street/setting, AND if a person is wearing it, that person's face, body shape, pose, stance, and any other garment they have on. None of that — background, person, face, pose — may appear in or influence the final output in any way. Clothing images are a texture/design source ONLY, never a pose or scene reference.`),n.join(` `)}function Tt(e,t){let n=[],r=e.map(e=>e.category),i=r.includes(`DRESS`),a=r.includes(`TOP`),o=r.includes(`BOTTOM`),s=r.includes(`OUTER`);if(i){let r=e.findIndex(e=>e.category===`DRESS`);n.push(`Replace the ENTIRE outfit (top and bottom) with Image ${t+r}'s full dress/jumpsuit. Reproduce every design detail exactly.`)}else{if(a){let r=e.findIndex(e=>e.category===`TOP`);n.push(`Replace ONLY the TOP garment with Image ${t+r}'s item. Exact color, pattern, texture, neckline, sleeve length.`)}if(o){let r=e.findIndex(e=>e.category===`BOTTOM`);n.push(`Replace ONLY the BOTTOM garment with Image ${t+r}'s item. Exact color, pattern, waistband, length, cut.`)}if(s){let r=e.findIndex(e=>e.category===`OUTER`);n.push(`Add/replace the OUTER LAYER (coat/jacket) with Image ${t+r}'s item worn over the other clothing. Exact lapels, buttons, length.`)}}return i||(a||n.push(`Keep the original TOP garment EXACTLY unchanged — do NOT modify it.`),o||n.push(`Keep the original BOTTOM garment EXACTLY unchanged — do NOT modify it.`),s||n.push(`Remove any outer layer if present, or keep it minimal.`)),n.join(` `)}var Et=90,Dt=600;U.post(`/api/generation/start`,async e=>{try{let{modelId:t,modelName:n=`패션 모델`,modelDesc:r=`young Asian female fashion model, slim figure, natural look`,bgId:i,bgName:a=`스튜디오`,bgDesc:o=`clean white studio background with professional lighting`,poseType:s=`전신`,pose:l=`정면`,ratio:u=`3:4`,resolution:d=`HD`,count:f=4,clothingImageUrl:p,clothingImages:m}=await e.req.json(),h=e.env?.LOOKBOOK_DB,g=null;if(h){let t=e.req.header(`X-Session-Token`)||``;if(t){let e=await h.prepare(`SELECT s.user_id, u.name, u.credits FROM user_sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(t).first();e&&(g=e)}if(!g)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);console.log(`[Generation] ${g.name} started generation (credits: ${g.credits})`)}let _=xt(u),v=St(d);console.log(`Model ID:`,t,`| BG ID:`,i),console.log(`Ratio:`,_,`| Resolution:`,v),console.log(`Clothing:`,p?p.substring(0,60)+`...`:`none`);let y={전신:`full body shot`,반신:`half body shot`,상반신:`upper body shot`},b={정면:`facing camera, natural standing pose`,측면:`3/4 angle, elegant slight turn`,워킹:`dynamic walking pose, confident stride`,정적:`elegant static pose, hands relaxed at sides`},x=y[s]||`full body shot`,S=b[l]||`natural standing pose`,C=null,w=null,T=e.env?.LOOKBOOK_KV,E=null;if(t){let e=String(t);if(T){let t=await T.get(`model_img:${e}`);t&&(C=t,console.log(`KV custom model: OK`)),E=(await J(T)).find(t=>t.id===e)?.gender||null}else if(h){let t=await We(h,e);t&&(C=t,console.log(`D1 custom model: OK`)),E=(await h.prepare(`SELECT gender FROM custom_models WHERE id = ?`).bind(e).first())?.gender||null}else{let t=X.find(t=>t.id===e);t?.imageBase64&&(C=t.imageBase64,console.log(`Mem custom model: OK`)),E=t?.gender||null}C||console.log(`Custom model image not found for id:`,e)}let ee=E===`남성`?`MALE BODY TYPE: Render the body/physique as a MALE body type — broader shoulders, flatter chest, straighter waist-to-hip line, masculine posture and build. The clothing must fit and drape as menswear on a male body, not a female body shape.`:``;if(i){let e=String(i);if(T){let t=await T.get(`bg_gen_img:${e}`),n=t||await T.get(`bg_img:${e}`);n&&(w=n,console.log(`KV custom bg: OK | bgId=${e} | source=${t?`GEN(masked)`:`ORIGINAL(fallback, no gen image registered)`}`))}else if(h){let t=await h.prepare(`SELECT image_b64, gen_image_b64 FROM custom_bgs WHERE id = ?`).bind(e).first();if(t){let n=!!(t.gen_image_b64&&String(t.gen_image_b64).trim());w=n?t.gen_image_b64:t.image_b64,console.log(`D1 custom bg: OK | bgId=${e} | source=${n?`GEN(masked)`:`ORIGINAL(fallback, no gen image registered)`}`)}}else{let t=Z.find(t=>t.id===e);(t?.genImageBase64||t?.imageBase64)&&(w=t.genImageBase64||t.imageBase64,console.log(`Mem custom bg: OK | bgId=${e} | source=${t?.genImageBase64?`GEN(masked)`:`ORIGINAL(fallback, no gen image registered)`}`))}w||console.log(`Custom bg image not found for id:`,e)}let D=[`ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:`,`1. DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image.`,`2. Facial identity is non-negotiable: the output face must be the SAME PERSON as the identity reference image (bone structure, eye/nose/lip shape, proportions unchanged) — never a different-looking substitute. See the IDENTITY instructions above for what may change (angle, lighting) vs. what may not (identity).`,`3. DO NOT change, redesign, or substitute ANY detail of the clothing: color, pattern, print, texture, collar, neckline, sleeve length, hem, buttons, zippers, pockets, or stitching must be reproduced EXACTLY as shown in the reference.`,`4. NO watermarks. NO overlaid captions. NO decorative text. NO brand insignia added by AI.`,`Ultra-photorealistic, 8K quality, professional fashion editorial, magazine cover quality.`].join(` `),O=[];Array.isArray(m)&&m.length>0?O=m.filter(e=>e?.dataUrl?.startsWith(`data:`)):p&&p.startsWith(`data:`)&&(O=[{dataUrl:p,category:`TOP`,label:`clothing item`}]),console.log(`Clothing items:`,O.map(e=>`[${e.category}]`).join(`, `)||`none`),console.log(`Model ID:`,t,`| BG ID:`,i);let k=[],te=[`DRESS`,`TOP`,`BOTTOM`,`OUTER`,`UNKNOWN`],A=[...O].sort((e,t)=>te.indexOf(e.category)-te.indexOf(t.category));A.forEach(e=>k.push(e.dataUrl));let j=A.length,M=j+1,N=j+ +!!C+1;C&&k.push(C),w&&k.push(w),console.log(`images 배열: 의류${j}장 | 모델${+!!C}장 | 배경${+!!w}장 | 총${k.length}장`);let P=``,F=!!w,I=!!C,L=j>0;if(L&&I&&F){console.log(`[단일 단계] 의상+얼굴+신원 통합 합성 시작`);let e=wt(A.map(e=>({...e})),1),t=Tt(A,1);P=[`COMPLETE FASHION LOOKBOOK SYNTHESIS — clothing replacement + identity swap in a single pass.`,e,`Image ${N} = SCENE ANCHOR. This scene defines: background environment, scene lighting direction/color-temperature/intensity/saturation, color grade, and mood. LOCKED: background. The output background must come EXCLUSIVELY from Image ${N} — never from any clothing reference image's own background.`,`CLOTHING REPLACEMENT:`,t,`POSE: Show a ${x}, ${S}. Body pose and stance should follow this direction, adjusting naturally to fit the new clothing and scene. The pose must NEVER be copied from a clothing reference image, even if that image shows a person modeling the garment — clothing images are a garment/texture source only, not a pose reference.`,`IDENTITY (from Image ${M}) — READ THIS ONCE, IT IS THE ONLY IDENTITY RULE:`,`This is Image ${M}'s exact face, physically rotated to a new head angle and relit under Image ${N}'s scene — the SAME face asset transformed, never a newly generated or substitute face. KEEP UNCHANGED: bone structure, eye shape/spacing, iris color, nose shape, lip shape, jawline, cheekbones, face width, and skin undertone — these must be pixel-consistent with Image ${M} when mentally rotated back to its original angle. Hair may adjust naturally (style, volume, flow) to suit the pose and scene — it does not need to be locked to Image ${M}'s exact hairstyle. Head/face size relative to the body must stay in natural human proportion, matching Image ${M}'s scale — do not enlarge or shrink it. CHANGE ONLY what a camera and lighting change: head angle, tilt, gaze direction, expression, perspective, brightness, shadows, color temperature, saturation. Do NOT copy Image ${M}'s original angle, expression, or lighting — they must update to match Image ${N}'s scene. Do NOT use body shape, clothing, or pose from Image ${M}.`,`If Image ${N} already shows a person, their pose, stance, and hair may be used as a natural reference and can vary freely to fit the scene — but their FACE is IRRELEVANT and must NEVER appear in the output. The output face must be Image ${M}'s identity, not the person already in Image ${N}.`,ee,`SCENE LIGHTING INTEGRATION (from Image ${N} — critical for photorealism):`,`  Re-light ALL elements (clothing, face, skin, hair) under Image ${N}'s physical lighting environment:`,`  · BRIGHTNESS: Match face and skin brightness to the scene's ambient light level. Bright scene → bright face; moody/dim scene → face lit accordingly.`,`  · LIGHT DIRECTION: Apply the scene's key light direction. Highlights land on the correct side of the face (forehead, cheekbone, nose bridge), shadows fall on the opposite side.`,`  · COLOR TEMPERATURE & SATURATION: Tint face, skin, and clothing under the scene's color temperature AND saturation level — face and body must share identical hue/saturation/brightness at every point, with zero visible tone or saturation boundary anywhere on exposed skin.`,`  · SHADOW QUALITY: Hard shadows in direct sunlight; soft wrap-around shadows in diffuse/cloudy/studio light — match the scene exactly.`,`  · CATCH-LIGHTS: Eyes must reflect Image ${N}'s light source position and shape.`,`  · FABRIC RENDERING: Simulate specular highlights on shiny fabrics, soft diffuse on matte, translucency on thin materials — all under the scene's light.`,`  · SUBSURFACE SCATTERING: Realistic skin SSS under scene light (warm ears/nose in backlit; strong SSS in diffuse light).`,`  · GROUNDING: The model must cast a soft contact shadow onto the ground/floor matching Image ${N}'s light direction and shadow softness. Depth-of-field, grain, and sharpness falloff on the model must match the background photo's camera characteristics.`,`  · SEAMLESS INTEGRATION: The face-to-neck-to-body transition must be completely seamless — same lighting falloff, same color temperature, no hard edge or tone jump, identical skin micro-texture/sharpness/grain between face and body. This must read as ONE continuous photograph of ONE real person, never a cutout, collage, sticker, or composite.`,`  · HAIR INTEGRATION: Hair receives the scene's ambient + key light. Rim/backlight if present in the scene. Flyaways lit naturally.`,`FINAL OUTPUT: One seamless, ultra-photorealistic fashion photograph — Image ${M}'s exact identity, re-angled and re-lit to fit Image ${N}'s scene, wearing the new clothing. This must look like an actual photograph taken with a real camera — NOT an AI-generated, CGI, 3D-rendered, or illustrated image. Natural skin texture with visible pores, fine hairs, subtle imperfections. Natural film grain and lens characteristics. Avoid overly smooth/plastic/airbrushed skin, avoid uncanny-valley symmetry, avoid the glossy "AI look." Shot on a professional camera, candid editorial photography style.`,`8K resolution, magazine editorial quality.`,D].join(` `)}else if(L&&I&&!F){let e=wt(A.map(e=>({...e})),1),t=Tt(A,1);P=[`Create a hyper-realistic professional fashion lookbook photograph.`,e,`Image ${M} = MODEL IDENTITY — preserve this exact person's face, hair, skin tone, body proportions exactly.`,ee,t,`Show a ${x}, ${S}.`,`Background: ${o} (${a}). Create a photorealistic environment. Integrate the model naturally with correct lighting and shadows.`,D].join(` `)}else if(L&&!I&&F){let e=wt(A.map(e=>({...e})),1),t=Tt(A,1);P=[`You are doing a CLOTHING SWAP on a fashion background scene.`,e,`Image ${N} = SOURCE BACKGROUND SCENE containing a person. Keep the scene and person EXACTLY as-is — same face, same pose, same stance, same body position.`,t,`FINAL RESULT: Same scene, same person, same pose — only the specified clothing items are replaced. Natural lighting, seamless integration.`,D].join(` `)}else if(L&&!I&&!F){let e=wt(A.map(e=>({...e})),1),t=Tt(A,1);P=[`Create a hyper-realistic professional fashion lookbook photograph.`,e,`Model: ${r}. Show in a ${x}, ${S}.`,t,`Background: ${o} (${a}). Photorealistic environment with correct lighting and shadows.`,D].join(` `)}else P=[`Ultra-photorealistic professional fashion photography.`,`A ${r} fashion model, ${x}, ${S}.`,`Background: ${o} (${a}). Natural lighting, seamless scene integration.`,`8K resolution, Canon EOS R5, professional lighting, hyperrealistic skin texture, perfect fabric detail, commercial fashion editorial, magazine quality.`,D].join(` `);try{q=await kt(e.env.LOOKBOOK_DB)}catch{}P=Ie(P),console.log(`Prompt (first 300):`,P.substring(0,300)),console.log(`images count:`,k.length,`| mode:`,k.length>=3?`FULL(clothing+model+bg)`:k.length===2?`PARTIAL`:k.length===1?`CLOTHING_ONLY`:`TEXT`);let ne={model:`google/nano-banana-2/edit`,prompt:P,aspect_ratio:_,resolution:v,thinking_level:`high`,output_format:`jpeg`};k.length>0&&(ne.images=k),console.log(`Final prompt (first 300):`,P.substring(0,300)),console.log(`Atlas request → model:`,ne.model,`| images:`,k.length,`| aspect_ratio:`,_,`| resolution:`,v,`| jobs:`,1);let re=Array.from({length:1},()=>fetch(`${W}/api/v1/model/generateImage`,{method:`POST`,headers:Qe(e.env.ATLAS_API_KEY),body:JSON.stringify(ne)}).then(e=>e.json())),ie=await Promise.all(re);console.log(`Atlas responses:`,ie.map(e=>`${e.code}:${e.data?.id}`).join(`, `));let ae=ie.filter(e=>e.code===200&&e.data?.id).map(e=>e.data.id);if(ae.length===0){let t=ie[0];console.error(`All Atlas requests failed:`,t);let n=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:n,estimatedSeconds:5,status:`queued`,isFallback:!0,error:t?.msg||t?.message||`Atlas API error`})}let oe=ae.join(`,`);if(h&&g)try{let e=((await h.prepare(`SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`).bind(g.user_id).first())?.last_seq||0)+1;await h.prepare(`INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, model_id, bg_id, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+14 days'))`).bind(g.user_id,oe,f,n||`패션 모델`,a||`스튜디오`,u||`3:4`,e,t?String(t):null,i?String(i):null).run(),console.log(`[GenLog] seq_no=${e} 기록 완료`)}catch(e){console.warn(`[GenLog] 생성 내역 기록 실패 (무시):`,e)}if(T&&A.length>0)try{await T.put(`clothing_img:${oe}`,JSON.stringify(A.map(e=>e.dataUrl)),{expirationTtl:336*60*60})}catch(e){console.warn(`[GenLog] 의상 이미지 KV 저장 실패 (무시):`,e)}return e.json({jobId:oe,estimatedSeconds:30,status:`queued`,isFallback:!1})}catch(t){console.error(`Generation start error:`,t);let n=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:n,estimatedSeconds:5,status:`queued`,isFallback:!0,error:t.message})}}),U.get(`/api/generation/:jobId/status`,async e=>{let t=e.req.param(`jobId`);if(t.startsWith(`fallback_`)){let t=Ot(1);return e.json({status:`completed`,progress:100,images:t,isFallback:!0})}let n=t.split(`,`).filter(Boolean);try{let t=await Promise.all(n.map(t=>fetch(`${W}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json())));console.log(`Poll statuses:`,t.map(e=>`${e.data?.id?.substring(0,8)}:${e.data?.status}`).join(`, `));let r=new Set([`completed`,`succeeded`,`failed`,`timeout`,`canceled`,`error`]),i=t.every(e=>r.has(e.data?.status));if(t.some(e=>!r.has(e.data?.status)),!i){let n=t.filter(e=>r.has(e.data?.status)).length,i=t.length,a=Math.round(20+n/i*60);return e.json({status:`processing`,progress:a,images:[]})}let a=[];if(t.forEach((e,t)=>{let n=e.data?.status,r=e.data?.outputs??e.data?.output??e.data?.images??e.data?.result??null,i=Array.isArray(r)?r.filter(e=>typeof e==`string`&&e.startsWith(`http`)):typeof r==`string`&&r.startsWith(`http`)?[r]:[];console.log(`Job ${t} status:${n} urls:`,i),(n===`completed`||n===`succeeded`)&&i.length>0&&i.forEach((e,t)=>{a.push({id:`result_${a.length+1}`,url:e,title:`AI 피팅컷 #${a.length+1}`})})}),a.length===0){console.error(`All jobs failed:`,t.map(e=>e.data?.status).join(`, `));let n=Ot(1);return e.json({status:`completed`,progress:100,images:n,isFallback:!0,error:`All jobs failed`})}return e.json({status:`completed`,progress:100,images:a,isFallback:!1})}catch(t){console.error(`Poll error:`,t);let n=Ot(1);return e.json({status:`completed`,progress:100,images:n,isFallback:!0,error:t.message})}});function Ot(e){let t=[[`#FF6B9D`,`#FF8C42`],[`#6C47FF`,`#00D4AA`],[`#FF6B9D`,`#6C47FF`],[`#F59E0B`,`#EF4444`]];return Array.from({length:e},(e,n)=>({id:`placeholder_${n+1}`,url:null,placeholder:!0,gradient:`linear-gradient(135deg, ${t[n%t.length][0]}, ${t[n%t.length][1]})`,title:`AI 피팅컷 #${n+1}`,width:832,height:1216}))}U.post(`/api/video/start`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);let r=await t.prepare(`SELECT s.user_id, u.credits, u.name FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`,code:`UNAUTHORIZED`},401);let{imageUrl:i,modelName:a,bgName:o}=await e.req.json();if(!i)return e.json({error:`imageUrl 필수`},400);let s=Dt;if(r.credits<s)return e.json({error:`크레딧이 부족합니다. (보유: ${r.credits}크레딧, 필요: ${s}크레딧)`,code:`INSUFFICIENT_CREDITS`,available:r.credits,required:s},402);let l=await fetch(`${W}/api/v1/model/generateVideo`,{method:`POST`,headers:Qe(e.env.ATLAS_API_KEY),body:JSON.stringify({model:`bytedance/seedance-2.5/image-to-video`,prompt:`The person begins exactly as shown in the image and performs natural, subtle fashion-model posing movements: gentle weight shifts, a slow turn, relaxed hand and hair movement, as if in a live fashion shoot. Smooth, realistic motion. Keep the face, outfit, and background unchanged throughout the video. Add soft, tasteful ambient background music suited for a fashion runway/showcase — no vocals, no jarring sound effects.`,image:i,duration:5,resolution:`1080p-esr`,ratio:`adaptive`,output_format:`mp4`,generate_audio:!0,watermark:!1})}),u=await l.json(),d=u?.data?.id||u?.id||null;if(!l.ok||!d)return console.error(`video/start Atlas 요청 실패:`,u),e.json({success:!1,message:u?.msg||u?.message||`영상 생성 요청 실패`},502);let f=r.credits-s;await t.prepare(`UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?`).bind(f,r.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'deduct', ?, ?, 'video_generation', ?)`).bind(r.user_id,-600,f,d).run();let p=((await t.prepare(`SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`).bind(r.user_id).first())?.last_seq||0)+1;return await t.prepare(`INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, kind, expires_at, image_urls)
       VALUES (?, ?, 1, ?, ?, '9:16', ?, 'video', datetime('now', '+14 days'), ?)`).bind(r.user_id,d,a||`패션 모델`,o||`스튜디오`,p,JSON.stringify([i])).run(),e.json({success:!0,jobId:d,creditsRemaining:f})}catch(t){return console.error(`video/start error:`,t),e.json({success:!1,message:t.message},500)}}),U.get(`/api/video/:jobId/status`,async e=>{let t=e.req.param(`jobId`);try{let n=await fetch(`${W}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json()),r=n.data?.status??n.status;if(!new Set([`completed`,`succeeded`,`failed`,`timeout`,`canceled`,`error`]).has(r))return e.json({status:`processing`,progress:50});if(r!==`completed`&&r!==`succeeded`)return console.error(`video status 실패:`,r,n),e.json({status:`failed`,progress:100,error:`영상 생성에 실패했습니다.`});let i=n.data?.outputs??n.data?.output??n.data?.video??n.data?.videos??n.output??null,a=Array.isArray(i)?i.find(e=>typeof e==`string`&&e.startsWith(`http`))||null:typeof i==`string`&&i.startsWith(`http`)?i:null;return a?(await e.env.LOOKBOOK_DB.prepare(`UPDATE generation_logs SET video_url = ? WHERE job_id = ?`).bind(a,t).run(),e.json({status:`completed`,progress:100,videoUrl:a})):(console.error(`video 완료했지만 URL 없음:`,n),e.json({status:`failed`,progress:100,error:`영상 URL을 찾을 수 없습니다.`}))}catch(t){return console.error(`video status poll error:`,t),e.json({status:`failed`,progress:100,error:t.message})}});async function kt(e){try{let t=await e.prepare(`SELECT value FROM app_settings WHERE key = 'admin_prompt_config'`).first();if(t?.value){let e=JSON.parse(t.value);return{enabled:typeof e.enabled==`boolean`?e.enabled:q.enabled,prefix:typeof e.prefix==`string`?e.prefix:q.prefix,suffix:typeof e.suffix==`string`?e.suffix:q.suffix,styleGuide:typeof e.styleGuide==`string`?e.styleGuide:q.styleGuide,technicalSpec:typeof e.technicalSpec==`string`?e.technicalSpec:q.technicalSpec,updatedAt:e.updatedAt||q.updatedAt}}}catch(e){console.warn(`d1GetPromptConfig fallback to memory:`,e)}return q}async function At(e,t){await e.prepare(`INSERT INTO app_settings (key, value, updated_at) VALUES ('admin_prompt_config', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(JSON.stringify(t)).run()}U.get(`/api/admin/prompt`,K,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await kt(t);return e.json({success:!0,config:n})}catch{return e.json({success:!0,config:q})}}),U.put(`/api/admin/prompt`,K,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await e.req.json(),r=await kt(t),i={enabled:typeof n.enabled==`boolean`?n.enabled:r.enabled,prefix:typeof n.prefix==`string`?n.prefix:r.prefix,suffix:typeof n.suffix==`string`?n.suffix:r.suffix,styleGuide:typeof n.styleGuide==`string`?n.styleGuide:r.styleGuide,technicalSpec:typeof n.technicalSpec==`string`?n.technicalSpec:r.technicalSpec,updatedAt:new Date().toISOString()};return await At(t,i),q=i,console.log(`Admin prompt config saved to D1:`,i.updatedAt),e.json({success:!0,config:i})}catch(t){return e.json({success:!1,message:t.message},400)}}),U.post(`/api/admin/auth`,async e=>{let t=await e.req.json(),n=e.env.ADMIN_PASSWORD;return n?t.password===n?e.json({success:!0}):e.json({success:!1,message:`비밀번호가 올바르지 않습니다.`},401):e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500)});var jt=`의류 이미지 하나로 AI 온모델 피팅컷과 룩북 세트를 자동 생성하세요.`,Mt=(e,t,n=``,r=jt)=>`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${e} | EZlook</title>
  <meta name="description" content="${r}" />
  <meta property="og:site_name" content="EZlook" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${e} | EZlook" />
  <meta property="og:description" content="${r}" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:image" content="${G}/static/og-image.jpg" />
  <meta property="og:image:width" content="928" />
  <meta property="og:image:height" content="1232" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${G}/static/og-image.jpg" />
  <meta name="naver-site-verification" content="fda79db143bdb87618cabb15ab207023cff2f5da" />
  <meta name="google-site-verification" content="W4DGx5Ts0G07ZjGwcRMDUo1e-zAocUD1UNo2KOjyRz0" />
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg?v=${Fe}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="/static/style.css?v=${Fe}" rel="stylesheet" />
  <!-- app.js는 head에 defer — body 인라인 script보다 항상 먼저 파싱·실행됨 -->
  <script src="/static/app.js?v=${Fe}" defer><\/script>
  ${n}
</head>
<body>
${t}

<!-- ── 크레딧 충전 패널 (모든 페이지 공통) ── -->
<div id="chargePanel" style="display:none;position:fixed;inset:0;background:#0d0d1a;z-index:9000;overflow-y:auto;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px 80px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <button onclick="closeChargePanel()" style="width:36px;height:36px;border:none;background:#2a2a45;border-radius:50%;color:#e0e0f0;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">‹</button>
      <h2 style="font-size:18px;font-weight:700;color:#f0f0f8;margin:0;" data-i18n="charge-title">크레딧 충전</h2>
    </div>
    <div style="background:linear-gradient(135deg,#1e1e35,#252545);border:1px solid rgba(108,71,255,0.3);border-radius:16px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:12px;color:#8b8ba0;margin-bottom:4px;" data-i18n="charge-current">현재 보유 크레딧</div>
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
            <div style="font-size:13px;color:#8b8ba0;" data-i18n="pkg-11">이미지 <strong style="color:#a78bfa;">11장</strong> 다운로드 가능</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:#6c47ff;">20,000원</div>
          </div>
        </div>
      </div>
      <div class="pkg-card" onclick="selectPackage('pkg_40000',this)" data-pkg="pkg_40000"
           style="background:linear-gradient(135deg,#1e1435,#2a1a50);border:2px solid #6c47ff;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;position:relative;">
        <div style="position:absolute;top:0;right:20px;background:linear-gradient(135deg,#6c47ff,#a855f7);color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:0 0 8px 8px;" data-i18n="pkg-popular">인기</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:800;color:#f0f0f8;margin-bottom:4px;">2,300 크레딧</div>
            <div style="font-size:13px;color:#8b8ba0;" data-i18n="pkg-25">이미지 <strong style="color:#a78bfa;">25장</strong> 다운로드 가능</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:4px;" data-i18n="pkg-bonus15">✨ 기본 대비 15% 더 받기</div>
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
            <div style="font-size:13px;color:#8b8ba0;" data-i18n="pkg-44">이미지 <strong style="color:#a78bfa;">44장</strong> 다운로드 가능</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:4px;" data-i18n="pkg-bonus33">🚀 기본 대비 33% 더 받기</div>
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
      <span id="ctaLabel" data-i18n="pkg-btn">패키지를 선택하세요</span>
    </button>

  </div>
</div>

</body>
</html>`;U.get(`/share/:jobId/:idx`,async e=>{let t=e.env.LOOKBOOK_DB,n=e.req.param(`jobId`),r=parseInt(e.req.param(`idx`)||`0`,10),i=t=>{let i=`${$(e)}/share/${n}/${r}`,a=``;if(t.state===`ok`){let e=t.sourceTabs||[];a=`
        <div class="share-card">
          ${e.length>0?`
          <div class="share-tabs">
            ${e.map(e=>`<button class="share-tab" data-url="${e.url}" onclick="_switchShareTab(this)">${e.label}</button>`).join(``)}
          </div>`:``}
          ${t.resultTab&&e.length>0?`
          <div class="share-tabs share-tabs-bottom">
            <button class="share-tab active" data-url="${t.resultTab.url}" onclick="_switchShareTab(this)">${t.resultTab.label}</button>
          </div>`:``}
          <div class="share-img-wrap">
            ${t.isVideo?`<video id="shareMainImg" src="${t.imageUrl}" class="share-img" autoplay loop muted playsinline controls controlsList="nodownload" disablePictureInPicture oncontextmenu="return false"></video>`:`<img id="shareMainImg" src="${t.imageUrl}" alt="EZlook 생성 이미지" class="share-img" draggable="false" oncontextmenu="return false" />`}
          </div>
          <div class="share-info">
            <p class="share-title">상품 이미지로 모델컷 만들기</p>
            <p class="share-desc">클릭4번으로 AI모델컷이 무료로 만들어 진다고?</p>
            <a href="/generator" class="share-cta"><i class="fas fa-wand-magic-sparkles"></i> 나도 해보기</a>
          </div>
        </div>
        <script>
          function _switchShareTab(btn) {
            document.querySelectorAll('.share-tab').forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
            var el = document.getElementById('shareMainImg');
            if (el.tagName === 'VIDEO') { el.pause(); el.removeAttribute('src'); el.load(); }
            else { el.src = btn.getAttribute('data-url'); }
          }
        <\/script>`}else a=t.state===`expired`?`
        <div class="share-card share-message">
          <span class="share-emoji">⏰</span>
          <p class="share-msg-text">다운로드 기간 14일이 만료되어 파일을 불러올 수 없어요.</p>
          <a href="/generator" class="share-cta"><i class="fas fa-wand-magic-sparkles"></i> 나도 만들어보기</a>
        </div>`:`
        <div class="share-card share-message">
          <span class="share-emoji">🔍</span>
          <p class="share-msg-text">이미지를 찾을 수 없어요.</p>
          <a href="/generator" class="share-cta"><i class="fas fa-wand-magic-sparkles"></i> 나도 만들어보기</a>
        </div>`;return`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>EZlook - 공유된 피팅컷</title>
  <meta property="og:title" content="상품 이미지로 모델컷 만들기" />
  <meta property="og:description" content="클릭4번으로 AI모델컷이 무료로 만들어 진다고?" />
  ${t.state===`ok`?t.isVideo?`<meta property="og:video" content="${t.imageUrl}" /><meta property="og:type" content="video.other" />`:`<meta property="og:image" content="${t.imageUrl}" />`:``}
  <meta property="og:url" content="${i}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body { margin: 0; height: 100dvh; background: #0d0d1a; font-family: 'Pretendard', -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; padding: 12px; overflow: hidden; }
    .share-card { width: 100%; max-width: 420px; height: 100%; max-height: 760px; background: #17172b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.4); display: flex; flex-direction: column; }
    .share-tabs { flex: 0 0 auto; display: flex; gap: 6px; padding: 10px 10px 0; flex-wrap: wrap; }
    .share-tabs-bottom { padding: 8px 10px 0; }
    .share-tab { flex: 1; min-width: 60px; background: #23233d; color: #a0a0c0; border: none; border-radius: 10px; padding: 8px 4px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s, color 0.15s; }
    .share-tab.active { background: linear-gradient(135deg,#6c47ff,#a855f7); color: #fff; }
    .share-img-wrap { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-top: 8px; background: #000; }
    .share-img {
      max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block;
      -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; user-select: none;
      -webkit-user-drag: none; user-drag: none; pointer-events: auto;
    }
    .share-info { flex: 0 0 auto; padding: 12px 18px 16px; text-align: center; }
    .share-title { color: #fff; font-size: 14px; font-weight: 800; margin: 0 0 4px; }
    .share-desc { color: #a0a0c0; font-size: 12px; font-weight: 600; margin: 0 0 10px; }
    .share-cta { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#6c47ff,#a855f7); color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 12px; }
    .share-message { padding: 48px 28px; text-align: center; }
    .share-emoji { font-size: 40px; display: block; margin-bottom: 16px; }
    .share-msg-text { color: #e0e0f0; font-size: 15px; font-weight: 600; line-height: 1.6; margin: 0 0 24px; }
  </style>
</head>
<body>
  ${a}
</body>
</html>`};if(!n||isNaN(r))return e.html(i({state:`notfound`}),404);try{let a=await t.prepare(`SELECT image_urls, expires_at, model_id, bg_id, kind, video_url FROM generation_logs WHERE job_id = ? ORDER BY id DESC LIMIT 1`).bind(n).first(),o=a?.kind===`video`;if(!a||(o?!a.video_url:!a.image_urls))return e.html(i({state:`notfound`}),404);if(a.expires_at&&new Date(String(a.expires_at).replace(` `,`T`)+`Z`).getTime()<=Date.now())return e.html(i({state:`expired`}));let s;if(o)s=a.video_url;else{let e=[];try{e=JSON.parse(a.image_urls)}catch{}s=e[r]}if(!s)return e.html(i({state:`notfound`}),404);let l=$(e),u=`${l}/api/proxy/gen-image?url=${encodeURIComponent(s)}`,d=[],f=e.env?.LOOKBOOK_KV;if(f){let e=await f.get(`clothing_img:${n}`);if(e)try{let t=JSON.parse(e);t.forEach((e,r)=>{d.push({label:t.length>1?`의상${r+1}`:`의상`,url:`${l}/api/proxy/clothing/${n}/${r}`})})}catch{}}return a.model_id&&d.push({label:`모델`,url:`${l}/api/proxy/custom-model/${a.model_id}`}),a.bg_id&&d.push({label:`배경`,url:`${l}/api/proxy/custom-bg/${a.bg_id}`}),e.html(i({state:`ok`,imageUrl:u,isVideo:o,sourceTabs:d,resultTab:{label:o?`생성결과 영상`:`생성결과`,url:u}}))}catch(t){return console.error(`Share page error:`,t),e.html(i({state:`notfound`}),500)}}),U.get(`/terms`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>서비스 이용약관 - EZlook</title>
  <meta name="description" content="EZlook AI 룩북 생성 서비스의 이용약관, 결제 및 환불 정책을 안내합니다." />
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
  <p>본 약관은 EZlook(이하 "서비스")이 제공하는 AI 패션 룩북 생성 서비스의 이용에 관한 조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>

  <h2>제2조 (정의)</h2>
  <p>① "서비스"란 EZlook이 제공하는 AI 기반 패션 이미지 생성 플랫폼을 의미합니다.</p>
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

  <h2 id="refund">제8조 (청약철회 및 환불)</h2>
  <p>① 이용자는 크레딧 결제일로부터 7일 이내에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조에 따라 청약철회를 요청할 수 있습니다. 단, 해당 크레딧을 일부라도 사용(이미지 생성)한 경우에는 사용분을 제외한 잔여 크레딧에 한해 환불이 가능합니다.</p>
  <p>② 크레딧을 전부 사용한 경우, 또는 결제일로부터 7일이 경과한 경우에는 원칙적으로 청약철회 및 환불이 제한됩니다.</p>
  <p>③ 서비스 오류(AI 생성 실패, 결제 중복 등) 등 회사의 귀책사유로 정상적인 서비스 제공이 불가능한 경우, 이용자는 사용 여부와 관계없이 전액 환불을 요청할 수 있습니다.</p>
  <p>④ 환불 신청은 아래 문의처로 결제 정보(주문번호, 결제일시, 결제수단)와 함께 요청해 주시기 바랍니다. 환불은 신청 접수 후 3영업일 이내에 결제 수단과 동일한 방법으로 처리됩니다.</p>
  <p>⑤ 이용자의 단순 변심에 의한 환불 시, 이미 사용한 크레딧에 해당하는 금액은 환불 대상에서 제외됩니다.</p>

  <h2>제9조 (분쟁 해결)</h2>
  <p>본 약관과 관련한 분쟁은 대한민국 법률을 적용하며, 관할 법원은 민사소송법에 따릅니다.</p>

  <p style="margin-top:40px; color:#888; font-size:13px;">문의: <a href="mailto:kim4honey@gmail.com">kim4honey@gmail.com</a></p>
</body>
</html>`)),U.get(`/privacy`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보처리방침 - EZlook</title>
  <meta name="description" content="EZlook이 수집하는 개인정보 항목과 이용 목적, 보관 기간을 안내합니다." />
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

  <p>EZlook(이하 "서비스")은 이용자의 개인정보를 소중히 여기며, 개인정보 보호법 등 관련 법령을 준수합니다.</p>

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
</html>`)),U.get(`/_home_old`,e=>e.redirect(`/generator`,302)),U.get(`/robots.txt`,e=>e.text([`User-agent: *`,`Allow: /`,`Disallow: /dashboard`,`Disallow: /api/`,`Disallow: /admin`,`Sitemap: ${G}/sitemap.xml`].join(`
`),200,{"Content-Type":`text/plain; charset=utf-8`})),U.get(`/sitemap.xml`,e=>{let t=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[{path:`/`,priority:`1.0`,changefreq:`weekly`},{path:`/generator`,priority:`0.9`,changefreq:`weekly`},{path:`/terms`,priority:`0.3`,changefreq:`yearly`},{path:`/privacy`,priority:`0.3`,changefreq:`yearly`}].map(e=>`  <url><loc>${G}${e.path}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join(`
`)}\n</urlset>`;return e.text(t,200,{"Content-Type":`application/xml; charset=utf-8`})}),U.get(`/llms.txt`,e=>{let t=`# EZlook

> AI 패션 이미지 생성 플랫폼 — 의류 이미지 한 장으로 온모델 피팅컷과 룩북 세트, 홍보 영상을 자동 생성합니다.

## 서비스 소개
EZlook은 의류 이미지를 업로드하면 AI가 그 옷을 입은 모델의 사진(온모델 피팅컷)을 자동으로 생성해주는 서비스입니다. 촬영 스튜디오나 모델 섭외 없이 몇 번의 클릭만으로 전문적인 패션 이미지를 만들 수 있습니다.

## 주요 기능
- 의류 이미지 업로드 (상의/하의/전체 슬롯별 지정)
- 100종 이상의 AI 모델 프리셋 (성별/연령/체형/피부톤/무드 선택)
- 15종 이상의 배경 프리셋
- 평균 30초 내 이미지 생성
- 생성된 이미지 기반 5초 홍보 영상 생성 (음악 포함, 9:16 세로형)
- 룩북 세트 일괄 생성 및 다운로드

## 요금
- 이미지 생성 자체는 무료. 다운로드 시에만 장당 90크레딧 차감
- 크레딧 충전: 스타터(₩20,000 · 1,000크레딧) ~ 베스트 밸류(₩60,000 · 4,000크레딧)
- 회원가입 시 무료 크레딧 지급, 신용카드 등록 불필요

## 링크
- 홈페이지: ${G}/
- 서비스 이용(생성기): ${G}/generator
- 이용약관: ${G}/terms
- 개인정보처리방침: ${G}/privacy
`;return e.text(t,200,{"Content-Type":`text/markdown; charset=utf-8`})});var Nt=[{q:`EZlook은 어떤 서비스인가요?`,a:`의류 이미지 한 장을 업로드하면 AI가 온모델 피팅컷과 룩북 세트를 자동으로 생성해주는 AI 패션 이미지 생성 플랫폼입니다. 촬영 스튜디오나 모델 섭외 없이 몇 번의 클릭만으로 전문적인 착용샷을 만들 수 있습니다.`},{q:`이미지 생성에 비용이 드나요?`,a:`이미지 생성 자체는 무료입니다. 마음에 드는 결과물을 실제 파일로 다운로드할 때만 장당 90크레딧이 차감됩니다.`},{q:`무료로 체험할 수 있나요?`,a:`네, 신용카드 등록 없이 회원가입만 하면 무료 크레딧이 바로 지급되어 AI 룩북 제작을 체험해볼 수 있습니다.`},{q:`영상도 만들 수 있나요?`,a:`네, 생성된 피팅컷 이미지를 기반으로 모델이 자연스럽게 포즈를 취하는 5초 분량의 세로형(9:16) 영상을 만들 수 있습니다.`},{q:`결과물은 얼마나 빨리 나오나요?`,a:`평균 30초, 최대 90초 이내에 고품질 온모델 피팅컷 이미지가 생성됩니다.`},{q:`크레딧은 어떻게 충전하나요?`,a:`월 정액 없이 필요한 만큼만 충전하는 방식입니다. 스타터(₩20,000 · 1,000크레딧)부터 베스트 밸류(₩60,000 · 4,000크레딧)까지 선택할 수 있습니다.`}],Pt=()=>{let e={"@type":`Organization`,name:`EZlook`,alternateName:`벌거벗은호랑이`,url:G,logo:`${G}/static/favicon.svg`,telephone:`070-4581-8166`,address:{"@type":`PostalAddress`,streetAddress:`무심서로 377-3`,addressLocality:`청주시 서원구`,addressRegion:`충청북도`,addressCountry:`KR`}};return[{"@context":`https://schema.org`,"@type":`WebSite`,name:`EZlook`,url:G,publisher:e},{"@context":`https://schema.org`,"@type":`Service`,name:`EZlook AI 패션 룩북 생성 서비스`,serviceType:`AI 패션 이미지/영상 생성`,description:`옷 사진 한 장을 업로드하면 AI 모델이 착용한 온모델 피팅컷과 룩북 세트, 홍보 영상을 자동으로 생성하는 서비스`,provider:e,areaServed:`KR`,offers:[{"@type":`Offer`,name:`스타터`,price:`20000`,priceCurrency:`KRW`,description:`1,000 크레딧 · 이미지 최대 11장`},{"@type":`Offer`,name:`인기 충전권`,price:`40000`,priceCurrency:`KRW`,description:`2,300 크레딧 · 이미지 최대 25장`},{"@type":`Offer`,name:`베스트 밸류`,price:`60000`,priceCurrency:`KRW`,description:`4,000 크레딧 · 이미지 최대 44장`}]},{"@context":`https://schema.org`,"@type":`FAQPage`,mainEntity:Nt.map(e=>({"@type":`Question`,name:e.q,acceptedAnswer:{"@type":`Answer`,text:e.a}}))}].map(e=>`<script type="application/ld+json">${JSON.stringify(e)}<\/script>`).join(`
  `)};U.get(`/`,e=>{let t=`<link rel="canonical" href="${G}/" />\n  <meta property="og:url" content="${G}/" />\n  ${Pt()}`;return e.html(Mt(`AI 온모델 피팅컷 자동 생성`,`
  <!-- Toast Container -->
  <div class="toast-container" id="toastContainer"></div>

  <!-- ════════════════════════════════════════
       홈페이지 전용 흑백(Black & White) 테마 오버라이드
       — 이 페이지(/)에서만 적용됨. 생성화면/대시보드 등
       다른 페이지의 공통 style.css 색상에는 영향 없음.
  ════════════════════════════════════════ -->
  <style>
    #navbar .btn-primary,
    #hero .btn-primary,
    #how-it-works .btn-primary,
    #pricing .btn-primary,
    #cta-section .btn-primary {
      background: #000 !important;
      box-shadow: none !important;
    }
    #navbar .btn-primary:hover,
    #hero .btn-primary:hover,
    #how-it-works .btn-primary:hover,
    #pricing .btn-primary:hover,
    #cta-section .btn-primary:hover { background: #222 !important; }
    #pricing .btn-secondary { color: #000 !important; border-color: #000 !important; }
    #pricing .btn-secondary:hover { background: #f0f0f0 !important; }

    #navUserAvatar { background: #000 !important; box-shadow: none !important; }
    /* 드롭다운 자체는 어두운 배경(#1e1e35)이라 크레딧 텍스트는 밝은 색 유지 — 검정으로 바꾸면 안 보임 */
    #ddUserCredits { color: #a78bfa !important; }
    #userDropdownMenu button[onclick*="openChargePanel"] { background: #000 !important; }

    /* Hero */
    #hero { background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%) !important; }
    #hero .hero-bg-grid {
      background-image:
        linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px) !important;
    }
    #hero .hero-glow-1 { background: radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%) !important; }
    #hero .hero-glow-2 { background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%) !important; }
    #hero .hero-tag { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.3) !important; color: #fff !important; }
    #hero .hero-title .highlight { background: none !important; -webkit-text-fill-color: #fff !important; color: #fff !important; }
    #hero .hero-stat-num { background: none !important; -webkit-text-fill-color: #fff !important; color: #fff !important; }
    #hero .hero-showcase-single { filter: grayscale(1); }

    /* Features */
    #features .section-tag { background: #f0f0f0 !important; color: #000 !important; }
    #features .feature-card:hover { border-color: #000 !important; }

    /* How it works */
    #how-it-works .steps-grid { grid-template-columns: repeat(3, 1fr) !important; max-width: 720px; margin: 0; }
    #how-it-works .steps-grid::before { background: #ddd !important; }
    #how-it-works .section-header--left { text-align: left; margin: 0 0 32px; }
    #how-it-works .section-header--left .section-desc { margin-left: 0; }
    #how-it-works .step-card:hover .step-num { background: #f0f0f0 !important; border-color: #000 !important; }
    #how-it-works .step-num i { color: #000 !important; }
    @media (max-width: 560px) {
      #how-it-works .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }

    /* Pricing */
    #pricing .pricing-plan { color: #000 !important; }
    #pricing .pricing-card.featured { border-color: #000 !important; }
    #pricing .pricing-popular { background: #000 !important; color: #fff !important; }
    #pricing .pricing-features li .check { color: #000 !important; }

    /* CTA */
    #cta-section { background: linear-gradient(135deg, #000 0%, #111 100%) !important; }
    #cta-section::before { background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%) !important; }
    #cta-section .cta-title .highlight { background: none !important; -webkit-text-fill-color: #fff !important; color: #fff !important; }
  </style>

  <!-- Navbar -->
  <nav id="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">
        <span>EZlook</span>
      </a>
      <div class="navbar-nav" id="navbarNav">
        <a href="#features" onclick="closeMobileNav()">기능</a>
        <a href="#how-it-works" onclick="closeMobileNav()">이용방법</a>
        <a href="#pricing" onclick="closeMobileNav()">요금제</a>
        <a href="/dashboard" onclick="closeMobileNav()">대시보드</a>
      </div>
      <div class="navbar-actions" style="position:relative;">
        <button class="btn btn-ghost" id="navLoginBtn" onclick="openModal('loginModal')" data-i18n="nav-login">로그인</button>
        <button class="btn btn-primary" id="navSignupBtn" onclick="switchAuthTab('signup');openModal('loginModal')" data-i18n="nav-signup">무료 시작</button>
        <button class="navbar-toggle" id="navbarToggle" onclick="toggleMobileNav()" aria-label="메뉴 열기" aria-expanded="false">
          <i class="fas fa-bars"></i>
        </button>
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
                <button onclick="openChargePanel();toggleUserMenu();" style="font-size:11px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;" data-i18n="nav-charge">충전</button>
              </div>
            </div>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''" data-i18n="nav-history">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <a href="https://www.aifashion.co.kr/#siteFooter" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">서비스소개</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:10px 14px;font-size:14px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''" data-i18n="nav-logout">로그아웃</button>
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
          국내 최소 클릭 · AI 패션 이미지 자동화 플랫폼
        </div>
        <h1 class="hero-title">
          옷 사진 한 장으로<br />
          <span class="highlight">AI 룩북 완성</span>
        </h1>
        <p class="hero-desc">
          촬영 없이도 전문 모델 피팅컷과 고품질 룩북을 즉시 제작하세요.<br />
          누구나 최소한의 클릭으로 쉽게 쓸 수 있도록 만들었습니다.
        </p>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-num">3번</div>
            <div class="hero-stat-label">클릭으로 모델컷 완성</div>
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
          <button class="btn btn-primary btn-lg" onclick="location.href='/generator'">
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
        <div class="hero-showcase-single" id="heroShowcase">
          <img id="heroShowcaseImg" alt="AI 생성 룩북" style="display:none;" />
          <div id="heroShowcasePlaceholder" style="width:100%;height:100%;background:linear-gradient(135deg,#1A1A3E,#6C47FF);display:flex;align-items:center;justify-content:center;font-size:72px;">✨</div>
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
        <p class="section-desc">패션 디렉터, 디자이너, AI 전문가가 함께 만들어 결과물의 완성도가 다릅니다.</p>
      </div>
      <div class="features-grid">
        <div class="feature-card" data-feature-slot="1">
          <h3 class="feature-title">클릭 3번에 모델컷 완성</h3>
          <p class="feature-desc">의류 이미지 업로드, AI 모델 선택, 배경 선택 — 딱 3번의 클릭이면 전문 모델 피팅컷이 완성됩니다.</p>
        </div>
        <div class="feature-card" data-feature-slot="2">
          <h3 class="feature-title">1000+ AI 모델 프리셋</h3>
          <p class="feature-desc">성별, 연령대, 체형, 피부톤, 무드를 필터링하여 브랜드에 딱 맞는 AI 모델을 선택하세요.</p>
        </div>
        <div class="feature-card" data-feature-slot="3">
          <h3 class="feature-title">다양한 배경 프리셋</h3>
          <p class="feature-desc">스튜디오, 스트리트, 카페, 자연 등 15가지+ 배경을 제공합니다. 무드에 맞는 배경으로 분위기를 완성하세요.</p>
        </div>
        <div class="feature-card" data-feature-slot="4">
          <h3 class="feature-title">30초 내 AI 생성</h3>
          <p class="feature-desc">최대 90초 이내에 고품질 온모델 피팅컷을 생성합니다. 전신/반신/상반신 구도와 다양한 포즈를 선택하세요.</p>
        </div>
        <div class="feature-card" data-feature-slot="5">
          <h3 class="feature-title">룩북 세트 자동 생성</h3>
          <p class="feature-desc">상세용, 광고용, SNS용, 룩북용 이미지 세트를 한 번에 생성하여 모든 채널의 크리에이티브를 해결하세요.</p>
        </div>
        <div class="feature-card" data-feature-slot="6">
          <h3 class="feature-title">원클릭으로 영상 파일 생성</h3>
          <p class="feature-desc">생성된 피팅컷을 기반으로 모델이 자연스럽게 포즈를 취하는 5초 세로형 영상을 버튼 한 번으로 만드세요.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section id="how-it-works">
    <div class="container">
      <div class="howto-layout">
        <div class="howto-content">
          <div class="section-header section-header--left">
            <div class="section-tag"><i class="fas fa-route"></i> 이용 방법</div>
            <h2 class="section-title">3단계로 완성되는<br />AI 룩북 제작</h2>
            <p class="section-desc">국내에서 가장 적은 클릭으로 상품 이미지를 모델컷으로 바꿔드립니다.</p>
          </div>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-num"><i class="fas fa-shirt"></i></div>
              <div class="step-title">Step 1. 옷 사진 업로드</div>
              <div class="step-desc">가지고 있는 상품 이미지 한 장만 올리면 끝</div>
            </div>
            <div class="step-card">
              <div class="step-num"><i class="fas fa-person"></i></div>
              <div class="step-title">Step 2. AI 모델 선택</div>
              <div class="step-desc">성별, 체형, 무드에 맞는 모델을 선택합니다</div>
            </div>
            <div class="step-card">
              <div class="step-num"><i class="fas fa-wand-magic-sparkles"></i></div>
              <div class="step-title">Step 3. 배경 선택 → 자동 생성</div>
              <div class="step-desc">배경만 고르면 AI가 알아서 완성해드려요</div>
            </div>
          </div>
          <div style="text-align:left;margin-top:48px;">
            <a href="/generator" class="btn btn-primary btn-lg">
              <i class="fas fa-wand-magic-sparkles"></i>
              지금 바로 시작하기
            </a>
          </div>
        </div>
        <div class="howto-videos">
          <div class="howto-video-box" data-howto-video-slot="1">
            <video muted loop playsinline autoplay preload="metadata"></video>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-tags"></i> 요금제</div>
        <h2 class="section-title">쓴 만큼만 내는<br />크레딧 충전제</h2>
        <p class="section-desc">월정액 없이, 필요한 만큼만 충전해서 쓰세요. 가입 즉시 무료 크레딧이 지급됩니다.<br />이미지 1장 다운로드 시 90크레딧이 차감됩니다.</p>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-plan">스타터</div>
          <div class="pricing-price">
            <span class="amount">₩20,000</span>
            <span class="period">1회 충전</span>
          </div>
          <p class="pricing-desc">1,000 크레딧 · 이미지 최대 11장</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 전체 AI 모델 1000종+</li>
            <li><span class="check">✓</span> 전체 배경 15종+</li>
            <li><span class="check">✓</span> 스타일샷 세트 생성</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="location.href='/generator'">충전하고 시작하기</button>
        </div>
        <div class="pricing-card featured">
          <div class="pricing-popular">가장 인기</div>
          <div class="pricing-plan">인기 충전권</div>
          <div class="pricing-price">
            <span class="amount">₩40,000</span>
            <span class="period">1회 충전</span>
          </div>
          <p class="pricing-desc">2,300 크레딧 · 이미지 최대 25장<br />✨ 기본 대비 15% 더 받기</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 전체 AI 모델 1000종+</li>
            <li><span class="check">✓</span> 전체 배경 15종+</li>
            <li><span class="check">✓</span> 스타일샷 세트 생성</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-primary btn-full" onclick="location.href='/generator'">지금 시작하기</button>
        </div>
        <div class="pricing-card">
          <div class="pricing-plan">베스트 밸류</div>
          <div class="pricing-price">
            <span class="amount">₩60,000</span>
            <span class="period">1회 충전</span>
          </div>
          <p class="pricing-desc">4,000 크레딧 · 이미지 최대 44장<br />🚀 기본 대비 33% 더 받기</p>
          <hr class="pricing-divider" />
          <ul class="pricing-features">
            <li><span class="check">✓</span> 전체 AI 모델 1000종+</li>
            <li><span class="check">✓</span> 전체 배경 15종+</li>
            <li><span class="check">✓</span> 스타일샷 세트 생성</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-secondary btn-full" onclick="location.href='/generator'">충전하고 시작하기</button>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq">
    <div class="container">
      <div class="section-header">
        <div class="section-tag"><i class="fas fa-circle-question"></i> 자주 묻는 질문</div>
        <h2 class="section-title">궁금한 점이<br />있으신가요?</h2>
      </div>
      <div class="faq-list">
        ${Nt.map(e=>`
        <details class="faq-item">
          <summary class="faq-question">${e.q}</summary>
          <p class="faq-answer">${e.a}</p>
        </details>`).join(``)}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section id="cta-section">
    <div class="container">
      <div class="cta-content">
        <h2 class="cta-title">지금 바로 <span class="highlight">무료로 체험</span>하세요</h2>
        <p class="cta-desc">신용카드 없이 200크레딧을 무료로 받고<br />AI 룩북 제작을 경험해보세요.</p>
        <div class="cta-actions">
          <button class="btn btn-primary btn-lg" onclick="location.href='/generator'">
            <i class="fas fa-rocket"></i>
            무료로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer id="siteFooter">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="navbar-logo">
            <span>EZlook</span>
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
            <li><a href="/terms#refund">환불정책</a></li>
            <li><a href="/privacy">개인정보처리방침</a></li>
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
          사업장주소 : 충청북도 청주시 서원구 무심서로 377-3&nbsp;&nbsp;
          전화번호 : 070-4581-8166
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
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;" data-i18n="nav-login">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;" data-i18n="nav-signup2">회원가입</button>
      </div>

      <!-- 소셜 로그인 버튼 -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
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
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;" data-i18n="nav-login">로그인</button>
        </form>
      </div>

      <!-- 회원가입 폼 -->
      <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)" novalidate>
          <div id="signupError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="signupErrorText"></span></div>

          <!-- 약관 동의 체크박스 — 에러 바로 아래, 입력필드 위 -->
          <div style="display:flex;flex-direction:column;gap:0;margin-bottom:14px;background:var(--bg-secondary,#f8f8f8);border-radius:10px;border:1px solid var(--border-color,#e8e8e8);overflow:hidden;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:13px 16px;border-bottom:1px solid var(--border-color,#e8e8e8);background:var(--white,#fff);" onclick="toggleAgreeAll(event)">
              <input type="checkbox" id="agreeAll" data-i18n-next="agree-all" style="width:18px;height:18px;cursor:pointer;accent-color:var(--primary,#6366f1);flex-shrink:0;" />
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

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:12px;" data-i18n="signupBtn">가입하고 무료 시작 🎁</button>
        </form>
      </div>

      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:16px;">가입 시 <a href="/terms" target="_blank" style="color:var(--primary);">이용약관</a> 및 <a href="/privacy" target="_blank" style="color:var(--primary);">개인정보처리방침</a>에 동의합니다.</p>
    </div>
  </div>
  `,t,`옷 사진 한 장으로 AI 온모델 피팅컷과 룩북 세트를 무료로 자동 생성하세요. 촬영 스튜디오나 모델 섭외 없이 평균 30초 만에 완성됩니다.`))}),U.get(`/dashboard`,e=>e.html(Mt(`내 프로필`,`
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
      <span class="db-logo-text">EZlook</span>
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
        <button class="db-charge-btn" onclick="openChargePanel()" data-i18n="nav-charge">충전</button>
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

      <!-- 서비스소개 -->
      <a href="https://www.aifashion.co.kr/#siteFooter" class="db-menu-item">
        <span class="db-menu-label">서비스소개</span>
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
        <span style="font-size:12px;color:#fca5a5;line-height:1.5;">이미지는 <strong>14일 동안만 보관</strong>됩니다. 제때 다운로드하시기 바랍니다.<br/>재다운로드시 크레딧은 차감되지 않습니다.</span>
      </div>
      <div id="historyList" style="display:flex;flex-direction:column;gap:16px;">
        <div style="text-align:center;padding:60px 20px;color:#5a5a7a;font-size:14px;">
          <div style="font-size:40px;margin-bottom:12px;">🎨</div>
          생성 내역을 불러오는 중...
        </div>
      </div>
    </div>
  </div>

  <!-- 이미지 확대 보기 모달 (히스토리 전용 — 다시보기) -->
  <div id="histImgModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:1000;align-items:center;justify-content:center;flex-direction:column;padding:20px;">
    <button onclick="closeHistModal()" style="position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;background:rgba(255,255,255,0.1);border-radius:50%;color:#fff;font-size:20px;cursor:pointer;">×</button>
    <img id="histModalImg" src="" alt="생성 이미지" draggable="false"
      style="max-width:min(420px,90vw);max-height:calc(100dvh - 140px);object-fit:contain;border-radius:14px;display:block;" />
    <video id="histModalVideo" src="" autoplay loop muted playsinline controls controlsList="nodownload" disablePictureInPicture
      style="max-width:min(420px,90vw);max-height:calc(100dvh - 140px);object-fit:contain;border-radius:14px;display:none;"></video>
    <div id="histModalExpiry" style="font-size:11px;color:#f87171;margin-top:8px;text-align:center;"></div>
  </div>

  <!-- Action Progress Modal (다운로드 진행 중 + 완료 팝업 — generator 페이지와 동일 구조 공유) -->
  <div class="modal-overlay" id="actionProgressModal" style="z-index:10500;">
    <div class="action-progress-box">
      <div id="actionProgressSpinner" class="action-progress-spinner"></div>
      <div id="actionProgressCheck" class="action-progress-check" style="display:none;"><i class="fas fa-check"></i></div>
      <div id="actionProgressText" class="action-progress-text">처리 중...</div>
      <div id="actionProgressShare" class="action-progress-share" style="display:none;">
        <button class="action-progress-share-btn link" onclick="copyShareLink()">
          <i class="fas fa-link"></i> 링크복사
        </button>
        <button id="actionProgressKakaoBtn" class="action-progress-share-btn kakao" onclick="shareToKakao()" style="display:none;">
          <i class="fas fa-comment"></i> 카카오톡 공유
        </button>
      </div>
      <div class="gen-news" id="actionProgressNews" style="display:none;"></div>
      <button id="actionProgressCloseBtn" class="action-progress-close" onclick="closeActionProgress()" style="display:none;">닫기</button>
    </div>
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

  function openHistModal(imgUrl, expiresAt, isVideo) {
    _histModalUrl = imgUrl;
    const modal = document.getElementById('histImgModal');
    const imgEl = document.getElementById('histModalImg');
    const vidEl = document.getElementById('histModalVideo');
    if (isVideo) {
      imgEl.style.display = 'none';
      vidEl.style.display = 'block';
      vidEl.src = imgUrl;
    } else {
      vidEl.pause();
      vidEl.removeAttribute('src');
      vidEl.load();
      vidEl.style.display = 'none';
      imgEl.style.display = 'block';
      imgEl.src = imgUrl;
    }
    const expLabel = expiresAt ? expiryLabel(expiresAt) : null;
    document.getElementById('histModalExpiry').textContent = expLabel ? \`만료: \${expLabel}\` : '';
    modal.style.display = 'flex';
  }
  function closeHistModal() {
    document.getElementById('histImgModal').style.display = 'none';
    const vidEl = document.getElementById('histModalVideo');
    vidEl.pause();
    vidEl.removeAttribute('src');
    vidEl.load();
    _histModalUrl = null;
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

      const rows = [];
      logs.forEach((log, i) => {
        const seqLabel  = formatHistSeq(log.created_at, log.seq_no || (logs.length - i));
        const dateStr   = log.created_at ? log.created_at.slice(0,16).replace('T',' ') : '';
        const expLabel  = expiryLabel(log.expires_at);
        const expired   = expLabel === '만료됨';
        const expEsc    = (log.expires_at || '').replace(/'/g,"\\\\'");

        // ── 영상 생성 내역 ──
        if (log.kind === 'video') {
          if (expired) {
            rows.push(\`<div class="hist-row hist-row--expired">
              <div class="hist-thumb hist-thumb--empty"><i class="fas fa-clock"></i></div>
              <div class="hist-body">
                <div class="hist-meta">#\${seqLabel} · \${dateStr} · 만료됨</div>
                <div class="hist-actions">
                  <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
                </div>
              </div>
            </div>\`);
            return;
          }
          if (!log.video_url) {
            rows.push(\`<div class="hist-row">
              <div class="hist-thumb hist-thumb--empty"><i class="fas fa-film"></i></div>
              <div class="hist-body">
                <div class="hist-meta">#\${seqLabel} · \${dateStr} · 영상</div>
                <div class="hist-meta-sub">영상을 생성하는 중입니다...</div>
                <div class="hist-actions">
                  <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
                </div>
              </div>
            </div>\`);
            return;
          }
          const vProxyUrl = \`/api/proxy/gen-image?url=\${encodeURIComponent(log.video_url)}\`;
          const vUrlEsc = vProxyUrl.replace(/'/g,"\\\\'");
          const vJobIdEsc = (log.job_id || '').replace(/'/g,"\\\\'");
          // 카카오톡 공유 카드 썸네일용 — 영상의 소스(첫 프레임) 정지 이미지
          let vThumbUrls = [];
          try { vThumbUrls = log.image_urls ? JSON.parse(log.image_urls) : []; } catch(e) { vThumbUrls = []; }
          const vThumbProxy = vThumbUrls[0] ? \`/api/proxy/gen-image?url=\${encodeURIComponent(vThumbUrls[0])}\` : vProxyUrl;
          const vThumbEsc = vThumbProxy.replace(/'/g,"\\\\'");
          rows.push(\`<div class="hist-row">
            <div class="hist-thumb hist-thumb--video" onclick="openHistModal('\${vUrlEsc}','\${expEsc}',true)">
              <video src="\${vProxyUrl}" muted preload="metadata" onerror="this.parentNode.innerHTML='<i class=\\"fas fa-film\\"></i>'"></video>
              <i class="fas fa-play hist-thumb-play"></i>
            </div>
            <div class="hist-body">
              <div class="hist-meta">#\${seqLabel} · \${dateStr} · \${expLabel || ''} · 영상</div>
              <div class="hist-actions">
                <button class="hist-action-btn" onclick="openHistModal('\${vUrlEsc}','\${expEsc}',true)"><i class="fas fa-eye"></i> 다시보기</button>
                <button class="hist-action-btn primary" onclick="downloadHistVideo('\${vUrlEsc}','\${vJobIdEsc}',this,'\${vThumbEsc}')"><i class="fas fa-download"></i> 다운로드</button>
                <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
              </div>
            </div>
          </div>\`);
          return;
        }

        // image_urls 파싱 (JSON 배열 문자열)
        let urls = [];
        try { urls = log.image_urls ? JSON.parse(log.image_urls) : []; } catch(e) { urls = []; }
        // 이미지 인덱스별 다운로드 이력 (JSON 배열, 예: [0,2])
        let downloadedIdx = [];
        try { downloadedIdx = log.downloaded_indices ? JSON.parse(log.downloaded_indices) : []; } catch(e) { downloadedIdx = []; }

        if (urls.length === 0) {
          rows.push(\`<div class="hist-row">
            <div class="hist-thumb hist-thumb--empty"><i class="fas fa-image"></i></div>
            <div class="hist-body">
              <div class="hist-meta">#\${seqLabel} · \${dateStr}</div>
              <div class="hist-meta-sub">이미지 준비 중이거나 저장 전 세션이 종료되었습니다</div>
              <div class="hist-actions">
                <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
              </div>
            </div>
          </div>\`);
          return;
        }

        urls.forEach((u, ui) => {
          const rowSeq = urls.length > 1 ? \`\${seqLabel}-\${ui+1}\` : seqLabel;
          const proxyUrl = u.startsWith('/api/proxy') ? u : \`/api/proxy/gen-image?url=\${encodeURIComponent(u)}\`;
          const urlEsc = proxyUrl.replace(/'/g,"\\\\'");
          const origEsc = u.replace(/'/g,"\\\\'");
          const jobIdEsc = (log.job_id || '').replace(/'/g,"\\\\'");

          if (expired) {
            rows.push(\`<div class="hist-row hist-row--expired">
              <div class="hist-thumb hist-thumb--empty"><i class="fas fa-clock"></i></div>
              <div class="hist-body">
                <div class="hist-meta">#\${rowSeq} · \${dateStr} · 만료됨</div>
                <div class="hist-actions">
                  <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
                </div>
              </div>
            </div>\`);
            return;
          }

          const dlLabel = downloadedIdx.includes(ui) ? '재다운로드' : '다운로드';

          rows.push(\`<div class="hist-row">
            <div class="hist-thumb" onclick="openHistModal('\${urlEsc}','\${expEsc}')">
              <img src="\${proxyUrl}" alt="생성 이미지" onerror="this.parentNode.innerHTML='<i class=\\"fas fa-image\\"></i>'" />
            </div>
            <div class="hist-body">
              <div class="hist-meta">#\${rowSeq} · \${dateStr} · \${expLabel || ''}</div>
              <div class="hist-actions">
                <button class="hist-action-btn" onclick="openHistModal('\${urlEsc}','\${expEsc}')"><i class="fas fa-eye"></i> 다시보기</button>
                <button class="hist-action-btn primary" id="histDlBtn-\${log.id}-\${ui}" onclick="histRowDownload('\${jobIdEsc}','\${origEsc}',\${ui},this)"><i class="fas fa-download"></i> \${dlLabel}</button>
                <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
              </div>
            </div>
          </div>\`);
        });
      });

      list.innerHTML = rows.join('');
    } catch (e) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;font-size:13px;">불러오기 실패</div>';
    }
  }

  async function histRowDownload(jobId, originalUrl, imgIdx, btn) {
    const token = localStorage.getItem('lookbook_token') || '';
    if (!token) { showToast('로그인이 필요합니다.', 'error'); return; }

    openActionProgress('다운로드 중...');
    try {
      const deductRes = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'X-Session-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, idx: imgIdx }),
      });
      if (deductRes.status === 401) { closeActionProgress(); showToast('로그인이 필요합니다.', 'error'); return; }
      if (deductRes.status === 402) {
        closeActionProgress();
        const errData = await deductRes.json();
        showToast(\`크레딧 부족 (보유: \${errData.available ?? 0}크레딧 / 필요: 90크레딧)\`, 'error');
        return;
      }
      if (!deductRes.ok) { closeActionProgress(); showToast('크레딧 처리 오류', 'error'); return; }

      const deductData = await deductRes.json();
      const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
      if (cachedUser) { cachedUser.credits = deductData.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
      if (AppState.user) AppState.user.credits = deductData.creditsRemaining;
      const dbCredEl = document.getElementById('dbCredits');
      if (dbCredEl) dbCredEl.textContent = (deductData.creditsRemaining ?? 0).toLocaleString();

      // 파일 다운로드
      const dlUrl = originalUrl.includes('/api/proxy/gen-image')
        ? originalUrl + (originalUrl.includes('?') ? '&' : '?') + 'download=1'
        : \`/api/proxy/gen-image?url=\${encodeURIComponent(originalUrl)}&download=1\`;
      const a = document.createElement('a');
      a.href = dlUrl; a.download = \`lookbook_ai_\${Date.now()}.jpg\`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);

      const completeMsg = deductData.alreadyDownloaded
        ? '재다운로드 완료! (크레딧 차감 없음)'
        : \`다운로드 완료! (잔액: \${deductData.creditsRemaining}크레딧)\`;
      setActionComplete(completeMsg, { showShare: true, jobId: jobId, idx: imgIdx, imageUrl: originalUrl });

      if (btn) btn.innerHTML = '<i class="fas fa-download"></i> 재다운로드';
    } catch (err) {
      closeActionProgress();
      showToast('다운로드 중 오류가 발생했습니다.', 'error');
    }
  }

  function downloadHistVideo(videoUrl, jobId, btn, thumbUrl) {
    const dlUrl = videoUrl.includes('/api/proxy/gen-image')
      ? videoUrl + (videoUrl.includes('?') ? '&' : '?') + 'download=1'
      : \`/api/proxy/gen-image?url=\${encodeURIComponent(videoUrl)}&download=1\`;
    const a = document.createElement('a');
    a.href = dlUrl; a.download = \`lookbook_ai_video_\${Date.now()}.mp4\`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('영상 다운로드를 시작합니다.', 'success');

    // 이미지 다운로드와 동일하게 공유(링크복사/카카오톡) 팝업 노출
    // 카카오톡 카드는 영상을 미리보기로 못 그리므로 정지 이미지(첫 프레임)를 사용
    if (jobId) {
      openModal('actionProgressModal');
      setActionComplete('영상 다운로드가 시작되었습니다.', { showShare: true, jobId: jobId, idx: 0, imageUrl: thumbUrl || videoUrl });
    }

    if (btn) btn.innerHTML = '<i class="fas fa-download"></i> 재다운로드';
  }

  async function deleteHistItem(logId) {
    if (!confirm('이 생성 내역을 삭제할까요? 삭제하면 복구할 수 없어요.')) return;
    const token = localStorage.getItem('lookbook_token') || '';
    try {
      const res = await fetch(\`/api/generation/history/\${logId}\`, {
        method: 'DELETE',
        headers: { 'X-Session-Token': token },
      });
      if (!res.ok) { showToast('삭제에 실패했습니다.', 'error'); return; }
      showToast('삭제되었습니다.', 'success');
      loadHistory();
    } catch (err) {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  <\/script>
  `))),U.get(`/generator`,e=>e.html(Mt(`무료 AI 룩북 생성기`,`
  <div class="toast-container" id="toastContainer"></div>
  <h1 class="sr-only">AI 룩북 생성기 — 옷 사진 한 장으로 온모델 피팅컷 무료 제작</h1>

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
      <a href="/" class="gapp-logo"><span class="gapp-logo-ez">EZ</span><span class="gapp-logo-look">look</span></a>
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
                <button onclick="openChargePanel();toggleUserMenu();" style="font-size:11px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;" data-i18n="nav-charge">충전</button>
              </div>
            </div>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''" data-i18n="nav-history">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <a href="https://www.aifashion.co.kr/#siteFooter" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">서비스소개</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:9px 12px;font-size:13px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''" data-i18n="nav-logout">로그아웃</button>
          </div>
        </div>
      </div>
    </header>

    <!-- ── 슬라이드 컨테이너 ── -->
    <div id="gapp-slides">

      <!-- STEP 1 · 의류 업로드 -->
      <div class="gslide active" id="step-1">
        <div class="gslide-body">
          <div class="gstep-nav">
            <span class="gstep-item active"><span class="gstep-circle">1</span><span class="gstep-text" data-i18n="stepnav-1">상품 업로드</span></span>
            <span class="gstep-sep">›</span>
            <span class="gstep-item"><span class="gstep-circle">2</span><span class="gstep-text" data-i18n="stepnav-2">모델 선택</span></span>
            <span class="gstep-sep">›</span>
            <span class="gstep-item"><span class="gstep-circle">3</span><span class="gstep-text" data-i18n="stepnav-3">배경선택</span></span>
          </div>
          <h2 class="gstep-title" data-i18n="step1-title">의류를 종류별로 업로드하세요</h2>
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
            <button class="step-nav-back" onclick="prevStep(1)"><i class="fas fa-arrow-left"></i> <span data-i18n="btn-prev">이전</span></button>
            <button class="step-nav-next" id="nextBtn1" onclick="nextStep(1)" disabled><span data-i18n="btn-next">다음 단계</span> <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 2 · 모델 선택 -->
      <div class="gslide" id="step-2">
        <div class="gslide-header">
          <div class="gstep-nav">
            <span class="gstep-item"><span class="gstep-circle">1</span><span class="gstep-text" data-i18n="stepnav-1">상품 업로드</span></span>
            <span class="gstep-sep">›</span>
            <span class="gstep-item active"><span class="gstep-circle">2</span><span class="gstep-text" data-i18n="stepnav-2">모델 선택</span></span>
            <span class="gstep-sep">›</span>
            <span class="gstep-item"><span class="gstep-circle">3</span><span class="gstep-text" data-i18n="stepnav-3">배경선택</span></span>
          </div>
          <h2 class="gstep-title" data-i18n="step2-title">AI 모델을 선택하세요</h2>

        </div>
        <div class="gfilter-bar" id="modelFilters" style="display:flex;gap:8px;margin:0 0 16px;flex-wrap:wrap;">
          <button class="filter-tag active" onclick="filterModels('gender','all',this)">전체</button>
          <button class="filter-tag" onclick="filterModels('gender','여성',this)">여성</button>
          <button class="filter-tag" onclick="filterModels('gender','남성',this)">남성</button>
        </div>
        <div class="gslide-grid" id="modelGridWrap">
          <div id="modelsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p data-i18n="gen-loading">모델 불러오는 중...</p>
          </div>
          <div class="select-grid" id="modelGrid"></div>
        </div>
        <div class="gslide-nav">
          <div class="gslide-nav-inner">
            <button class="step-nav-back" onclick="prevStep(2)"><i class="fas fa-arrow-left"></i> <span data-i18n="btn-prev">이전</span></button>
            <button class="step-nav-next" id="nextBtn2" onclick="nextStep(2)"><span data-i18n="btn-next">다음 단계</span> <i class="fas fa-arrow-right"></i></button>
          </div>
        </div>
      </div>

      <!-- STEP 3 · 배경 선택 -->
      <div class="gslide" id="step-3">
        <div class="gslide-header">
          <div class="gstep-nav">
            <span class="gstep-item"><span class="gstep-circle">1</span><span class="gstep-text" data-i18n="stepnav-1">상품 업로드</span></span>
            <span class="gstep-sep">›</span>
            <span class="gstep-item"><span class="gstep-circle">2</span><span class="gstep-text" data-i18n="stepnav-2">모델 선택</span></span>
            <span class="gstep-sep">›</span>
            <span class="gstep-item active"><span class="gstep-circle">3</span><span class="gstep-text" data-i18n="stepnav-3">배경선택</span></span>
          </div>
          <h2 class="gstep-title" data-i18n="step3-title">배경을 선택하세요</h2>

        </div>
        <div class="gslide-grid" id="bgGridWrap">
          <div id="bgsLoading" class="grid-loading">
            <div style="font-size:32px;">⏳</div><p data-i18n="bg-loading">배경 불러오는 중...</p>
          </div>
          <div class="select-grid" id="bgGrid"></div>
        </div>
        <!-- 생성 중 오버레이 (step-3 내부) -->
        <div class="generating-view" id="generatingView">
          <div class="gen-news" id="genViewNews" style="display:none;"></div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;color:#fff;">AI가 이미지를 생성 중입니다...</h2>
          <div class="gen-progress-bar"><div class="gen-progress-fill" id="genProgressFill" style="width:0%"></div></div>
          <div class="gen-status-text" id="genStatusText" data-i18n="gen-status-init">시작 중...</div>
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
            <button class="step-nav-back" onclick="prevStep(3)"><i class="fas fa-arrow-left"></i> <span data-i18n="btn-prev">이전</span></button>
            <button class="step-nav-next" id="nextBtn3" onclick="startGeneration()"><i class="fas fa-wand-magic-sparkles"></i> <span data-i18n="btn-gen">AI 생성 시작</span></button>
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
              오류가 있거나 마음에 들지 않으면 아래 <strong style="color:#e0e0f0;">🔄 재생성</strong> 버튼을 눌러보세요.
            </p>
          </div>
        </div>
        <div class="gslide-nav">
          <div class="result-nav-grid">
            <button class="result-nav-btn primary" onclick="downloadWithCreditCheck(0)">
              <span class="rnb-main"><i class="fas fa-download"></i> 이미지 다운</span>
              <span class="rnb-sub"><i class="fas fa-coins"></i> 90</span>
            </button>
            <button class="result-nav-btn primary" id="videoActionBtn" onclick="startVideoGeneration()">
              <span class="rnb-badge">50%↓</span>
              <span class="rnb-main"><i class="fas fa-film"></i> 영상 생성</span>
              <span class="rnb-sub" id="videoActionSub">5초 · <s class="rnb-strike">1200</s> <i class="fas fa-coins"></i> 600</span>
            </button>
            <button class="result-nav-btn" onclick="window.location.href='/generator'">
              <span class="rnb-main"><i class="fas fa-plus"></i> 새 프로젝트</span>
            </button>
            <button class="result-nav-btn" onclick="regenFromCard(0)">
              <span class="rnb-main"><i class="fas fa-rotate-right"></i> 재생성</span>
            </button>
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
        <img id="modalImage" src="" alt="생성된 이미지" draggable="false" />
        <!-- 버튼 영역: 재생성 + 다운로드 -->
        <div id="modalButtonArea" style="position:absolute;bottom:16px;right:16px;z-index:20;display:flex;align-items:center;gap:8px;">
          <!-- 재생성 버튼 -->
          <button id="regenBtn" onclick="regenImage()" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.85)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">
            <i class="fas fa-redo-alt"></i>
            <span id="regenBtnText">재생성</span>
            <span id="regenCounter" style="font-size:12px;opacity:0.8;"></span>
          </button>
          <!-- 다운로드 버튼 -->
          <button id="downloadBtn" onclick="downloadImage()" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(99,102,241,0.85);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,1)'" onmouseout="this.style.background='rgba(99,102,241,0.85)'">
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

  <!-- Action Progress Modal (다운로드/재생성 진행 중 + 완료 팝업) -->
  <div class="modal-overlay" id="actionProgressModal" style="z-index:10500;">
    <div class="action-progress-box">
      <div id="actionProgressSpinner" class="action-progress-spinner"></div>
      <div id="actionProgressCheck" class="action-progress-check" style="display:none;"><i class="fas fa-check"></i></div>
      <div id="actionProgressText" class="action-progress-text">처리 중...</div>
      <div id="actionProgressShare" class="action-progress-share" style="display:none;">
        <button class="action-progress-share-btn link" onclick="copyShareLink()">
          <i class="fas fa-link"></i> 링크복사
        </button>
        <button id="actionProgressKakaoBtn" class="action-progress-share-btn kakao" onclick="shareToKakao()" style="display:none;">
          <i class="fas fa-comment"></i> 카카오톡 공유
        </button>
      </div>
      <div class="gen-news" id="actionProgressNews" style="display:none;"></div>
      <button id="actionProgressCloseBtn" class="action-progress-close" onclick="closeActionProgress()" style="display:none;">닫기</button>
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
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;" data-i18n="nav-login">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:15px;font-weight:600;color:var(--text-muted);cursor:pointer;" data-i18n="nav-signup2">회원가입</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:15px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:15px;font-weight:600;color:#3c4043;cursor:pointer;">
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
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn" style="margin-top:4px;" data-i18n="nav-login">로그인</button>
        </form>
      </div>
            <div id="authFormSignup" style="display:none;">
        <form id="signupForm" onsubmit="handleSignup(event)" novalidate>
          <div id="signupError" class="auth-message error" role="alert" style="display:none;"><span class="auth-msg-icon">❌</span><span id="signupErrorText"></span></div>

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

          <div class="form-group"><input type="text" class="form-input" id="signupName" placeholder="이름" autocomplete="name" /></div>
          <div class="form-group"><input type="email" class="form-input" id="signupEmail" placeholder="이메일" autocomplete="email" /></div>
          <div class="form-group"><input type="password" class="form-input" id="signupPassword" placeholder="비밀번호 (8자 이상)" autocomplete="new-password" /></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:4px;" data-i18n="signupBtn">가입하고 무료 시작 🎁</button>
        </form>
      </div>
      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:14px;">가입 시 이용약관 및 개인정보처리방침에 동의합니다.</p>
    </div>
  </div>
  `,``,`옷 사진을 업로드하고 AI 모델과 배경을 선택하면 평균 30초 만에 온모델 피팅컷이 완성됩니다. 신용카드 없이 무료로 체험해보세요.`))),U.get(`/admin02`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Admin | EZlook</title>
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
    <p>EZlook 관리자 페이지</p>
    <input type="password" id="pwInput" placeholder="비밀번호 입력" onkeydown="if(event.key==='Enter')doLogin()"/>
    <div class="err" id="loginErr"></div>
    <button class="btn-save" style="width:100%" onclick="doLogin()">로그인</button>
  </div>
</div>

<!-- 어드민 메인 -->
<div id="adminMain">
  <header class="admin-header">
    <span class="logo">✨ EZlook</span>
    <span class="badge">Admin</span>
    <button class="logout" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> 로그아웃</button>
  </header>

  <!-- 탭 바 -->
  <div class="tab-bar">
    <button class="tab-btn active" onclick="switchTab('prompt')"><i class="fas fa-magic"></i> 프롬프트</button>
    <button class="tab-btn" onclick="switchTab('models')"><i class="fas fa-user-circle"></i> 모델 관리</button>
    <button class="tab-btn" onclick="switchTab('bgs')"><i class="fas fa-image"></i> 배경 관리</button>
    <button class="tab-btn" onclick="switchTab('home')"><i class="fas fa-home"></i> 홈페이지 관리</button>
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

  <!-- ▼ 탭: 홈페이지 관리 -->
  <div class="tab-panel" id="tabHome">
    <div class="admin-body">
      <div class="page-title">🏠 홈페이지 관리</div>
      <div class="page-sub">홈페이지(www.aifashion.co.kr)에 노출되는 이미지를 관리합니다.</div>

      <!-- 히어로 쇼케이스 캐러셀 -->
      <div class="upload-form">
        <h3><i class="fas fa-images" style="color:#6c47ff;"></i> 히어로 쇼케이스 이미지 <span style="font-size:13px;font-weight:400;color:#888;">(홈 상단 박스에서 자동으로 롤링됩니다 · 여러 장 등록 가능)</span></h3>

        <div class="upload-zone multi-zone" id="showcaseUploadZone" onclick="document.getElementById('showcaseFileInput').click()">
          <div class="icon"><i class="fas fa-images"></i></div>
          <p>클릭하거나 이미지를 드래그하세요<br/><span>여러 파일 선택 가능</span> (JPG, PNG, WEBP)</p>
        </div>
        <input type="file" id="showcaseFileInput" accept="image/*" multiple style="display:none" onchange="onShowcaseFilesSelect(event)"/>

        <div id="showcaseStagingGrid" style="display:none;margin-top:16px;">
          <div id="showcaseStagingItems" style="display:flex;flex-wrap:wrap;gap:14px;"></div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:16px;">
            <button class="btn-save" onclick="uploadShowcaseImages()"><i class="fas fa-upload"></i> 전체 등록</button>
            <button class="btn-cancel" onclick="clearShowcaseStaging()"><i class="fas fa-times"></i> 초기화</button>
            <span class="save-status" id="showcaseUploadStatus"></span>
          </div>
        </div>

        <div id="showcaseGrid" style="margin-top:16px;"></div>
      </div>

      <!-- 기능 박스 배경 이미지 -->
      <div class="upload-form">
        <h3><i class="fas fa-th-large" style="color:#00d4aa;"></i> 기능 소개 박스 배경 이미지 <span style="font-size:13px;font-weight:400;color:#888;">(박스별 1장, 미등록 시 기본 배경 유지)</span></h3>
        <div id="featureBgGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:12px;"></div>
      </div>

      <!-- 이용방법 섹션 9:16 소개 영상 -->
      <div class="upload-form">
        <h3><i class="fas fa-film" style="color:#ff6b6b;"></i> 이용방법 소개 영상 <span style="font-size:13px;font-weight:400;color:#888;">(9:16 세로 영상 1개, 20MB 이하, 미등록 시 빈 박스 유지)</span></h3>
        <div id="howtoVideoGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:12px;"></div>
      </div>
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
    const names = ['prompt','models','bgs','home','users']
    b.classList.toggle('active', names[i] === name)
  })
  document.getElementById('tabPrompt').classList.toggle('active', name === 'prompt')
  document.getElementById('tabModels').classList.toggle('active', name === 'models')
  document.getElementById('tabBgs').classList.toggle('active', name === 'bgs')
  document.getElementById('tabHome').classList.toggle('active', name === 'home')
  document.getElementById('tabUsers').classList.toggle('active', name === 'users')
  if (name === 'models') loadCustomModels()
  if (name === 'bgs')    loadCustomBgs()
  if (name === 'home')   { loadShowcaseImages(); loadFeatureBgs(); loadHowtoVideos() }
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
      +   '<span style="font-size:10px;color:#8b8ba0;"> 크레딧</span>'
      +   '<div style="margin-top:4px;display:flex;gap:4px;justify-content:center;">'
      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="grant" style="font-size:10px;padding:2px 8px;background:#6c47ff33;border:1px solid #6c47ff66;border-radius:6px;color:#9b7cff;cursor:pointer;font-weight:600;">지급</button>'
      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="credits" style="font-size:10px;padding:2px 8px;background:none;border:1px solid #3a3a60;border-radius:6px;color:#8b8ba0;cursor:pointer;">설정</button>'
      +   '</div>'
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
      data.models.map(m => {
        const g = m.gender || '미분류'
        return (
        '<div class="media-card">' +
        '<img src="/api/proxy/custom-model/' + m.id + '" alt="' + m.name + '" loading="lazy"/>' +
        '<span class="custom-badge">커스텀</span>' +
        '<button class="del-btn" onclick="event.stopPropagation();deleteModel(' + "'" + m.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta">' +
          '<div class="name">' + m.name + '</div>' +
          '<div class="desc">' + (m.desc || '-') + '</div>' +
          '<div style="display:flex;gap:6px;margin-top:6px;">' +
            '<button onclick="event.stopPropagation();setModelGender(\\'' + m.id + '\\',\\'여성\\')" style="flex:1;padding:5px;border-radius:6px;border:1px solid ' + (g==='여성'?'#6366f1':'#444') + ';background:' + (g==='여성'?'#6366f1':'transparent') + ';color:#fff;font-size:12px;cursor:pointer;">여성</button>' +
            '<button onclick="event.stopPropagation();setModelGender(\\'' + m.id + '\\',\\'남성\\')" style="flex:1;padding:5px;border-radius:6px;border:1px solid ' + (g==='남성'?'#6366f1':'#444') + ';background:' + (g==='남성'?'#6366f1':'transparent') + ';color:#fff;font-size:12px;cursor:pointer;">남성</button>' +
          '</div>' +
        '</div>' +
        '</div>'
        )
      }).join('') + '</div>'
  } catch(e) { console.error('loadCustomModels error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

async function setModelGender(id, gender) {
  try {
    const res = await fetch('/api/admin/models/' + id + '/labels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
      body: JSON.stringify({ gender, age: '미분류', mood: '미분류' })
    })
    const data = await res.json()
    if (!data.success) { alert('저장 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadCustomModels()
  } catch (e) { alert('오류: ' + e.message) }
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
        '<div class="meta"><div class="name">' + b.name + '</div><div class="desc">' + b.category + ' · ' + (b.bgDesc || '-') + '</div>' +
        '<div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
        (b.hasGenImage
          ? '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#dcfce7;color:#15803d;font-weight:600;">생성용 이미지 등록됨</span>'
          : '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#fef3c7;color:#92400e;font-weight:600;">생성용 미등록 (원본 사용)</span>') +
        '<button onclick="event.stopPropagation();pickBgGenImage(' + "'" + b.id + "'" + ')" style="font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid #ccc;background:#fff;cursor:pointer;">' +
        (b.hasGenImage ? '생성용 이미지 교체' : '생성용 이미지 등록') + '</button>' +
        '</div></div>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { console.error('loadCustomBgs error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

// ══════════════════════════════════════════════
//  홈페이지 관리 — 히어로 쇼케이스 캐러셀
// ══════════════════════════════════════════════
let showcaseStagingList = []  // [{ file, base64 }]

async function onShowcaseFilesSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  for (const file of files) {
    const base64 = await readFileAsBase64(file)
    showcaseStagingList.push({ file, base64 })
  }
  e.target.value = ''
  renderShowcaseStaging()
}

function renderShowcaseStaging() {
  const grid = document.getElementById('showcaseStagingGrid')
  const container = document.getElementById('showcaseStagingItems')
  if (!showcaseStagingList.length) { grid.style.display = 'none'; return }
  grid.style.display = 'block'
  container.innerHTML = showcaseStagingList.map((item, i) =>
    '<div style="position:relative;width:140px;height:140px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
    '<img src="' + item.base64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
    '<button onclick="removeShowcaseStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;line-height:22px;text-align:center;padding:0;">✕</button>' +
    '</div>'
  ).join('')
}

function removeShowcaseStaging(idx) {
  showcaseStagingList.splice(idx, 1)
  renderShowcaseStaging()
}

function clearShowcaseStaging() {
  showcaseStagingList = []
  document.getElementById('showcaseStagingGrid').style.display = 'none'
  document.getElementById('showcaseUploadStatus').textContent = ''
}

async function uploadShowcaseImages() {
  const status = document.getElementById('showcaseUploadStatus')
  if (!showcaseStagingList.length) { status.textContent = '이미지를 선택하세요'; status.className = 'save-status err'; return }
  status.textContent = '등록 중...'; status.className = 'save-status'
  try {
    const res = await fetch('/api/admin/home-showcase', {
      method: 'POST',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ images: showcaseStagingList.map(i => i.base64) }),
    })
    const data = await res.json()
    if (data.success) {
      status.textContent = data.count + '개 등록 완료!'; status.className = 'save-status ok'
      clearShowcaseStaging()
      loadShowcaseImages()
    } else { status.textContent = data.message || '등록 실패'; status.className = 'save-status err' }
  } catch(e) { status.textContent = '오류: ' + e.message; status.className = 'save-status err' }
}

async function deleteShowcaseImage(id) {
  if (!confirm('이 이미지를 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/home-showcase/' + id, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadShowcaseImages()
}

async function loadShowcaseImages() {
  const grid = document.getElementById('showcaseGrid')
  try {
    const res = await fetch('/api/admin/home-showcase', {headers:{'X-Admin-Password':adminPassword}})
    const data = await res.json()
    if (!data.images || data.images.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>등록된 쇼케이스 이미지가 없습니다.</p></div>'
      return
    }
    grid.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:14px;">' +
      data.images.map(img =>
        '<div style="position:relative;width:140px;height:140px;border-radius:10px;overflow:hidden;border:1.5px solid #e0e0e0;">' +
        '<img src="' + img.imageBase64 + '" style="width:100%;height:100%;object-fit:cover;"/>' +
        '<button class="del-btn" onclick="deleteShowcaseImage(' + "'" + img.id + "'" + ')" style="position:absolute;top:4px;right:4px;"><i class="fas fa-times"></i></button>' +
        '</div>'
      ).join('') + '</div>'
  } catch(e) { console.error('loadShowcaseImages error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

// ══════════════════════════════════════════════
//  홈페이지 관리 — 기능 소개 박스 배경 (고정 6슬롯)
// ══════════════════════════════════════════════
const FEATURE_BG_LABELS = {
  1: '클릭 3번에 모델컷 완성', 2: '1000+ AI 모델 프리셋', 3: '다양한 배경 프리셋',
  4: '30초 내 AI 생성', 5: '룩북 세트 자동 생성', 6: '원클릭으로 영상 파일 생성',
}

async function loadFeatureBgs() {
  const grid = document.getElementById('featureBgGrid')
  try {
    const res = await fetch('/api/home/feature-bgs')
    const data = await res.json()
    const bgs = data.backgrounds || {}
    grid.innerHTML = Object.keys(FEATURE_BG_LABELS).map(slot => {
      const img = bgs[slot]
      return '<div style="border:1.5px solid #e0e0e0;border-radius:10px;overflow:hidden;">' +
        '<div style="position:relative;width:100%;aspect-ratio:16/10;background:' + (img ? 'url(' + img + ') center/cover' : '#f2f2f5') + ';display:flex;align-items:center;justify-content:center;">' +
        (img ? '' : '<i class="fas fa-image" style="color:#ccc;font-size:24px;"></i>') +
        '</div>' +
        '<div style="padding:8px;">' +
        '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">' + FEATURE_BG_LABELS[slot] + '</div>' +
        '<div style="display:flex;gap:6px;">' +
        '<button onclick="pickFeatureBg(' + slot + ')" style="flex:1;font-size:11px;padding:5px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;">' + (img ? '교체' : '업로드') + '</button>' +
        (img ? '<button onclick="deleteFeatureBg(' + slot + ')" style="font-size:11px;padding:5px 8px;border-radius:6px;border:1px solid #f3c;color:#e11d48;background:#fff;cursor:pointer;">삭제</button>' : '') +
        '</div></div></div>'
    }).join('')
  } catch(e) { console.error('loadFeatureBgs error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

let _pendingFeatureBgSlot = null
function pickFeatureBg(slot) {
  _pendingFeatureBgSlot = slot
  let input = document.getElementById('featureBgInput')
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.id = 'featureBgInput'
    input.style.display = 'none'
    input.addEventListener('change', onFeatureBgSelect)
    document.body.appendChild(input)
  }
  input.value = ''
  input.click()
}

async function onFeatureBgSelect(e) {
  const file = e.target.files?.[0]
  if (!file || !_pendingFeatureBgSlot) return
  const base64 = await readFileAsBase64(file)
  try {
    const res = await fetch('/api/admin/home-feature-bg/' + _pendingFeatureBgSlot, {
      method: 'PUT',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ imageBase64: base64 }),
    })
    const data = await res.json()
    if (!data.success) { alert('업로드 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadFeatureBgs()
  } catch(err) { alert('오류: ' + err.message) }
}

async function deleteFeatureBg(slot) {
  if (!confirm('이 박스의 배경 이미지를 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/home-feature-bg/' + slot, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadFeatureBgs()
}

// ══════════════════════════════════════════════
//  홈페이지 관리 — 이용방법 섹션 9:16 소개 영상 (고정 2슬롯)
// ══════════════════════════════════════════════
const HOWTO_VIDEO_LABELS = { 1: '영상 박스' }

async function loadHowtoVideos() {
  const grid = document.getElementById('howtoVideoGrid')
  try {
    const res = await fetch('/api/home/howto-videos')
    const data = await res.json()
    const videos = data.videos || {}
    grid.innerHTML = Object.keys(HOWTO_VIDEO_LABELS).map(slot => {
      const src = videos[slot]
      return '<div style="border:1.5px solid #e0e0e0;border-radius:10px;overflow:hidden;">' +
        '<div style="position:relative;width:100%;aspect-ratio:9/16;background:#f2f2f5;display:flex;align-items:center;justify-content:center;">' +
        (src ? '<video src="' + src + '" muted loop playsinline autoplay style="width:100%;height:100%;object-fit:cover;"></video>' : '<i class="fas fa-video" style="color:#ccc;font-size:24px;"></i>') +
        '</div>' +
        '<div style="padding:8px;">' +
        '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">' + HOWTO_VIDEO_LABELS[slot] + '</div>' +
        '<div style="display:flex;gap:6px;">' +
        '<button onclick="pickHowtoVideo(' + slot + ')" style="flex:1;font-size:11px;padding:5px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;">' + (src ? '교체' : '업로드') + '</button>' +
        (src ? '<button onclick="deleteHowtoVideo(' + slot + ')" style="font-size:11px;padding:5px 8px;border-radius:6px;border:1px solid #f3c;color:#e11d48;background:#fff;cursor:pointer;">삭제</button>' : '') +
        '</div></div></div>'
    }).join('')
  } catch(e) { console.error('loadHowtoVideos error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

let _pendingHowtoVideoSlot = null
function pickHowtoVideo(slot) {
  _pendingHowtoVideoSlot = slot
  let input = document.getElementById('howtoVideoInput')
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.id = 'howtoVideoInput'
    input.style.display = 'none'
    input.addEventListener('change', onHowtoVideoSelect)
    document.body.appendChild(input)
  }
  input.value = ''
  input.click()
}

async function onHowtoVideoSelect(e) {
  const file = e.target.files?.[0]
  if (!file || !_pendingHowtoVideoSlot) return
  if (file.size > 20 * 1024 * 1024) { alert('영상 용량이 너무 큽니다. 20MB 이하 파일을 사용해주세요.'); return }
  try {
    const res = await fetch('/api/admin/home-howto-video/' + _pendingHowtoVideoSlot, {
      method: 'PUT',
      headers: {'Content-Type': file.type || 'video/mp4', 'X-Admin-Password':adminPassword},
      body: file,
    })
    const data = await res.json()
    if (!data.success) { alert('업로드 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadHowtoVideos()
  } catch(err) { alert('오류: ' + err.message) }
}

async function deleteHowtoVideo(slot) {
  if (!confirm('이 박스의 영상을 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/home-howto-video/' + slot, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadHowtoVideos()
}

// ─── 배경 "생성용"(얼굴 마스킹) 이미지 등록/교체 ───
let _pendingGenImageBgId = null
function pickBgGenImage(id) {
  _pendingGenImageBgId = id
  let input = document.getElementById('bgGenImageInput')
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.id = 'bgGenImageInput'
    input.style.display = 'none'
    input.addEventListener('change', onBgGenImageSelect)
    document.body.appendChild(input)
  }
  input.value = ''
  input.click()
}
async function onBgGenImageSelect(e) {
  const file = (e.target.files || [])[0]
  const id = _pendingGenImageBgId
  if (!file || !id) return
  try {
    const base64 = await readFileAsBase64(file)
    const res = await fetch('/api/admin/backgrounds/' + id + '/gen-image', {
      method: 'PUT',
      headers: {'Content-Type':'application/json','X-Admin-Password':adminPassword},
      body: JSON.stringify({ imageBase64: base64 }),
    })
    const data = await res.json()
    if (!data.success) { alert('등록 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadCustomBgs()
  } catch(err) { alert('오류: ' + err.message) }
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
</html>`)),U.get(`/admin`,e=>e.redirect(`/admin02`,302)),U.get(`/studio-b`,e=>e.redirect(`/`)),U.get(`/studio-b/*`,e=>{let t=e.req.path.replace(`/studio-b`,``)||`/`;return e.redirect(t)}),U.get(`/payment/success`,e=>e.html(`<!DOCTYPE html>
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
    const orderId = params.get('orderId')
    const sessionToken = localStorage.getItem('lookbook_token') || ''

    async function loadPaymentStatus() {
      try {
        const res = await fetch('/api/payments/status?orderId=' + encodeURIComponent(orderId), {
          headers: { 'X-Session-Token': sessionToken },
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

    if (!orderId) {
      document.getElementById('loadingState').classList.add('hidden')
      document.getElementById('errorMsg').textContent = '결제 파라미터가 올바르지 않습니다.'
      document.getElementById('errorState').classList.remove('hidden')
    } else {
      loadPaymentStatus()
    }
  <\/script>
</body>
</html>`)),U.get(`/payment/fail`,e=>e.html(`<!DOCTYPE html>
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
</html>`));var Ft=new Se,It=Object.assign({"/src/index.tsx":U}),Lt=!1;for(let[,e]of Object.entries(It))e&&(Ft.all(`*`,t=>{let n;try{n=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,n)}),Ft.notFound(t=>{let n;try{n=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,n)}),Lt=!0);if(!Lt)throw Error(`Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']`);export{Ft as default};