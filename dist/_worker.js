var e=(e,t,n)=>(r,i)=>{let a=-1;return o(0);async function o(s){if(s<=a)throw Error(`next() called multiple times`);a=s;let l,u=!1,d;if(e[s]?(d=e[s][0][0],r.req.routeIndex=s):d=s===e.length&&i||void 0,d)try{l=await d(r,()=>o(s+1))}catch(e){if(e instanceof Error&&t)r.error=e,l=await t(e,r),u=!0;else throw e}else r.finalized===!1&&n&&(l=await n(r));return l&&(r.finalized===!1||u)&&(r.res=l),r}},t=Symbol(),n=(e,t)=>new Response(e,{headers:{"Content-Type":t.replace(/^[^;]+/,e=>e.toLowerCase())}}).formData(),r=e=>`headers`in e,i=async(e,t=Object.create(null))=>{let{all:n=!1,dot:i=!1}=t,o=(r(e)?e.headers:e.raw.headers).get(`Content-Type`)?.split(`;`)[0].trim().toLowerCase();return o===`multipart/form-data`||o===`application/x-www-form-urlencoded`?a(e,{all:n,dot:i}):{}};async function a(e,t){let i=r(e)?e.headers:e.raw.headers,a=n(await e.arrayBuffer(),i.get(`Content-Type`)||``);r(e)||(e.bodyCache.formData=a);let s=await a;return s?o(s,t):{}}function o(e,t){let n=Object.create(null);return e.forEach((e,r)=>{t.all||r.endsWith(`[]`)?s(n,r,e):n[r]=e}),t.dot&&Object.entries(n).forEach(([e,t])=>{e.includes(`.`)&&(l(n,e,t),delete n[e])}),n}var s=(e,t,n)=>{e[t]===void 0?t.endsWith(`[]`)?e[t]=[n]:e[t]=n:Array.isArray(e[t])?e[t].push(n):e[t]=[e[t],n]},l=(e,t,n)=>{if(/(?:^|\.)__proto__\./.test(t))return;let r=e,i=t.split(`.`);i.forEach((e,t)=>{t===i.length-1?r[e]=n:((!r[e]||typeof r[e]!=`object`||Array.isArray(r[e])||r[e]instanceof File)&&(r[e]=Object.create(null)),r=r[e])})},u=e=>{let t=e.split(`/`);return t[0]===``&&t.shift(),t},d=e=>{let{groups:t,path:n}=f(e);return p(u(n),t)},f=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(e,n)=>{let r=`@${n}`;return t.push([r,e]),r}),{groups:t,path:e}},p=(e,t)=>{for(let n=t.length-1;n>=0;n--){let[r]=t[n];for(let i=e.length-1;i>=0;i--)if(e[i].includes(r)){e[i]=e[i].replace(r,t[n][1]);break}}return e},m={},h=(e,t)=>{if(e===`*`)return`*`;let n=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(n){let r=`${e}#${t}`;return m[r]||(n[2]?m[r]=t&&t[0]!==`:`&&t[0]!==`*`?[r,n[1],RegExp(`^${n[2]}(?=/${t})`)]:[e,n[1],RegExp(`^${n[2]}$`)]:m[r]=[e,n[1],!0]),m[r]}return null},g=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,e=>{try{return t(e)}catch{return e}})}},_=e=>g(e,decodeURI),v=e=>{let t=e.url,n=t.indexOf(`/`,t.indexOf(`:`)+4),r=n;for(;r<t.length;r++){let e=t.charCodeAt(r);if(e===37){let e=t.indexOf(`?`,r),i=t.indexOf(`#`,r),a=e===-1?i===-1?void 0:i:i===-1?e:Math.min(e,i),o=t.slice(n,a);return _(o.includes(`%25`)?o.replace(/%25/g,`%2525`):o)}else if(e===63||e===35)break}return t.slice(n,r)},y=e=>{let t=v(e);return t.length>1&&t.at(-1)===`/`?t.slice(0,-1):t},b=(e,t,...n)=>(n.length&&(t=b(t,...n)),`${e?.[0]===`/`?``:`/`}${e}${t===`/`?``:`${e?.at(-1)===`/`?``:`/`}${t?.[0]===`/`?t.slice(1):t}`}`),x=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(`:`))return null;let t=e.split(`/`),n=[],r=``;return t.forEach(e=>{if(e!==``&&!/\:/.test(e))r+=`/`+e;else if(/\:/.test(e))if(/\?/.test(e)){n.length===0&&r===``?n.push(`/`):n.push(r);let t=e.replace(`?`,``);r+=`/`+t,n.push(r)}else r+=`/`+e}),n.filter((e,t,n)=>n.indexOf(e)===t)},S=e=>/[%+]/.test(e)?(e.indexOf(`+`)!==-1&&(e=e.replace(/\+/g,` `)),e.indexOf(`%`)===-1?e:g(e,E)):e,C=(e,t,n)=>{let r;if(!n&&t&&!/[%+]/.test(t)){let n=e.indexOf(`?`,8);if(n===-1)return;for(e.startsWith(t,n+1)||(n=e.indexOf(`&${t}`,n+1));n!==-1;){let r=e.charCodeAt(n+t.length+1);if(r===61){let r=n+t.length+2,i=e.indexOf(`&`,r);return S(e.slice(r,i===-1?void 0:i))}else if(r==38||isNaN(r))return``;n=e.indexOf(`&${t}`,n+1)}if(r=/[%+]/.test(e),!r)return}let i={};r??=/[%+]/.test(e);let a=e.indexOf(`?`,8);for(;a!==-1;){let t=e.indexOf(`&`,a+1),o=e.indexOf(`=`,a);o>t&&t!==-1&&(o=-1);let s=e.slice(a+1,o===-1?t===-1?void 0:t:o);if(r&&(s=S(s)),a=t,s===``)continue;let l;o===-1?l=``:(l=e.slice(o+1,t===-1?void 0:t),r&&(l=S(l))),n?(i[s]&&Array.isArray(i[s])||(i[s]=[]),i[s].push(l)):i[s]??=l}return t?i[t]:i},w=C,T=(e,t)=>C(e,t,!0),E=decodeURIComponent,ee=e=>g(e,E),D=class{raw;#e;#t;routeIndex=0;path;bodyCache={};constructor(e,t=`/`,n=[[]]){this.raw=e,this.path=t,this.#t=n,this.#e={}}param(e){return e?this.#n(e):this.#r()}#n(e){let t=this.#t[0][this.routeIndex][1][e],n=this.#i(t);return n&&/\%/.test(n)?ee(n):n}#r(){let e={},t=Object.keys(this.#t[0][this.routeIndex][1]);for(let n of t){let t=this.#i(this.#t[0][this.routeIndex][1][n]);t!==void 0&&(e[n]=/\%/.test(t)?ee(t):t)}return e}#i(e){return this.#t[1]?this.#t[1][e]:e}query(e){return w(this.url,e)}queries(e){return T(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((e,n)=>{t[n]=e}),t}async parseBody(e){return i(this,e)}#a=e=>{let{bodyCache:t,raw:n}=this,r=t[e];if(r)return r;let i=Object.keys(t)[0];return i?t[i].then(t=>(i===`json`&&(t=JSON.stringify(t)),new Response(t)[e]())):t[e]=n[e]()};json(){return this.#a(`text`).then(e=>JSON.parse(e))}text(){return this.#a(`text`)}arrayBuffer(){return this.#a(`arrayBuffer`)}bytes(){return this.#a(`arrayBuffer`).then(e=>new Uint8Array(e))}blob(){return this.#a(`blob`)}formData(){return this.#a(`formData`)}addValidatedData(e,t){this.#e[e]=t}valid(e){return this.#e[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[t](){return this.#t}get matchedRoutes(){return this.#t[0].map(([[,e]])=>e)}get routePath(){return this.#t[0].map(([[,e]])=>e)[this.routeIndex].path}},te={Stringify:1,BeforeStream:2,Stream:3},O=(e,t)=>{let n=new String(e);return n.isEscaped=!0,n.callbacks=t,n},ne=async(e,t,n,r,i)=>{typeof e==`object`&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let a=e.callbacks;if(!a?.length)return Promise.resolve(e);i?i[0]+=e:i=[e];let o=Promise.all(a.map(e=>e({phase:t,buffer:i,context:r}))).then(e=>Promise.all(e.filter(Boolean).map(e=>ne(e,t,!1,r,i))).then(()=>i[0]));return n?O(await o,a):o},k=`text/plain; charset=UTF-8`,A=(e,t)=>({"Content-Type":e,...t}),j=(e,t)=>new Response(e,t),M=class{#e;#t;env={};#n;finalized=!1;error;#r;#i;#a;#o;#s;#c;#l;#u;#d;constructor(e,t){this.#e=e,t&&(this.#i=t.executionCtx,this.env=t.env,this.#c=t.notFoundHandler,this.#d=t.path,this.#u=t.matchResult)}get req(){return this.#t??=new D(this.#e,this.#d,this.#u),this.#t}get event(){if(this.#i&&`respondWith`in this.#i)return this.#i;throw Error(`This context has no FetchEvent`)}get executionCtx(){if(this.#i)return this.#i;throw Error(`This context has no ExecutionContext`)}get res(){return this.#a||=j(null,{headers:this.#l??=new Headers})}set res(e){if(this.#a&&e){e=j(e.body,e);for(let[t,n]of this.#a.headers.entries())if(t!==`content-type`)if(t===`set-cookie`){let t=this.#a.headers.getSetCookie();e.headers.delete(`set-cookie`);for(let n of t)e.headers.append(`set-cookie`,n)}else e.headers.set(t,n)}this.#a=e,this.finalized=!0}render=(...e)=>(this.#s??=e=>this.html(e),this.#s(...e));setLayout=e=>this.#o=e;getLayout=()=>this.#o;setRenderer=e=>{this.#s=e};header=(e,t,n)=>{this.finalized&&(this.#a=j(this.#a.body,this.#a));let r=this.#a?this.#a.headers:this.#l??=new Headers;t===void 0?r.delete(e):n?.append?r.append(e,t):r.set(e,t)};status=e=>{this.#r=e};set=(e,t)=>{this.#n??=new Map,this.#n.set(e,t)};get=e=>this.#n?this.#n.get(e):void 0;get var(){return this.#n?Object.fromEntries(this.#n):{}}#f(e,t,n){let r=this.#a?new Headers(this.#a.headers):this.#l??new Headers;if(typeof t==`object`&&`headers`in t){let e=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[t,n]of e)t.toLowerCase()===`set-cookie`?r.append(t,n):r.set(t,n)}if(n)for(let[e,t]of Object.entries(n))if(typeof t==`string`)r.set(e,t);else{r.delete(e);for(let n of t)r.append(e,n)}return j(e,{status:typeof t==`number`?t:t?.status??this.#r,headers:r})}newResponse=(...e)=>this.#f(...e);body=(e,t,n)=>this.#f(e,t,n);text=(e,t,n)=>!this.#l&&!this.#r&&!t&&!n&&!this.finalized?new Response(e):this.#f(e,t,A(k,n));json=(e,t,n)=>this.#f(JSON.stringify(e),t,A(`application/json`,n));html=(e,t,n)=>{let r=e=>this.#f(e,t,A(`text/html; charset=UTF-8`,n));return typeof e==`object`?ne(e,te.Stringify,!1,{}).then(r):r(e)};redirect=(e,t)=>{let n=String(e);return this.header(`Location`,/[^\x00-\xFF]/.test(n)?encodeURI(n):n),this.newResponse(null,t??302)};notFound=()=>(this.#c??=()=>j(),this.#c(this))},N=[`get`,`post`,`put`,`delete`,`options`,`patch`],P=`Can not add a route since the matcher is already built.`,F=class extends Error{},re=`__COMPOSED_HANDLER`,ie=e=>e.text(`404 Not Found`,404),ae=(e,t)=>{if(`getResponse`in e){let n=e.getResponse();return t.newResponse(n.body,n)}return console.error(e),t.text(`Internal Server Error`,500)},oe=class t{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath=`/`;#e=`/`;routes=[];constructor(e={}){[...N,`all`].forEach(e=>{this[e]=(t,...n)=>(typeof t==`string`?this.#e=t:this.#r(e,this.#e,t),n.forEach(t=>{this.#r(e,this.#e,t)}),this)}),this.on=(e,t,...n)=>{for(let r of[t].flat()){this.#e=r;for(let t of[e].flat())n.map(e=>{this.#r(t.toUpperCase(),this.#e,e)})}return this},this.use=(e,...t)=>(typeof e==`string`?this.#e=e:(this.#e=`*`,t.unshift(e)),t.forEach(e=>{this.#r(`ALL`,this.#e,e)}),this);let{strict:t,...n}=e;Object.assign(this,n),this.getPath=t??!0?e.getPath??v:y}#t(){let e=new t({router:this.router,getPath:this.getPath});return e.errorHandler=this.errorHandler,e.#n=this.#n,e.routes=this.routes,e}#n=ie;errorHandler=ae;route(t,n){let r=this.basePath(t);return n.routes.map(t=>{let i;n.errorHandler===ae?i=t.handler:(i=async(r,i)=>(await e([],n.errorHandler)(r,()=>t.handler(r,i))).res,i[re]=t.handler),r.#r(t.method,t.path,i,t.basePath)}),this}basePath(e){let t=this.#t();return t._basePath=b(this._basePath,e),t}onError=e=>(this.errorHandler=e,this);notFound=e=>(this.#n=e,this);mount(e,t,n){let r,i;n&&(typeof n==`function`?i=n:(i=n.optionHandler,r=n.replaceRequest===!1?e=>e:n.replaceRequest));let a=i?e=>{let t=i(e);return Array.isArray(t)?t:[t]}:e=>{let t;try{t=e.executionCtx}catch{}return[e.env,t]};return r||=(()=>{let t=b(this._basePath,e),n=t===`/`?0:t.length;return e=>{let t=new URL(e.url);return t.pathname=this.getPath(e).slice(n)||`/`,new Request(t,e)}})(),this.#r(`ALL`,b(e,`*`),async(e,n)=>{let i=await t(r(e.req.raw),...a(e));if(i)return i;await n()}),this}#r(e,t,n,r){e=e.toUpperCase(),t=b(this._basePath,t);let i={basePath:r===void 0?this._basePath:b(this._basePath,r),path:t,method:e,handler:n};this.router.add(e,t,[n,i]),this.routes.push(i)}#i(e,t){if(e instanceof Error)return this.errorHandler(e,t);throw e}#a(t,n,r,i){if(i===`HEAD`)return(async()=>new Response(null,await this.#a(t,n,r,`GET`)))();let a=this.getPath(t,{env:r}),o=this.router.match(i,a),s=new M(t,{path:a,matchResult:o,env:r,executionCtx:n,notFoundHandler:this.#n});if(o[0].length===1){let e;try{e=o[0][0][0][0](s,async()=>{s.res=await this.#n(s)})}catch(e){return this.#i(e,s)}return e instanceof Promise?e.then(e=>e||(s.finalized?s.res:this.#n(s))).catch(e=>this.#i(e,s)):e??this.#n(s)}let l=e(o[0],this.errorHandler,this.#n);return(async()=>{try{let e=await l(s);if(!e.finalized)throw Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return e.res}catch(e){return this.#i(e,s)}})()}fetch=(e,...t)=>this.#a(e,t[1],t[0],e.method);request=(e,t,n,r)=>e instanceof Request?this.fetch(t?new Request(e,t):e,n,r):(e=e.toString(),this.fetch(new Request(/^https?:\/\//.test(e)?e:`http://localhost${b(`/`,e)}`,t),n,r));fire=()=>{addEventListener(`fetch`,e=>{e.respondWith(this.#a(e.request,e,void 0,e.request.method))})}},se=[];function ce(e,t){let n=this.buildAllMatchers(),r=((e,t)=>{let r=n[e]||n.ALL,i=r[2][t];if(i)return i;let a=t.match(r[0]);if(!a)return[[],se];let o=a.indexOf(``,1);return[r[1][o],a]});return this.match=r,r(e,t)}var le=`[^/]+`,ue=`.*`,de=`(?:|/.*)`,fe=Symbol(),pe=new Set(`.\\+*[^]$()`);function me(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===ue||e===de?1:t===ue||t===de?-1:e===le?1:t===le?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var he=class e{#e;#t;#n=Object.create(null);insert(t,n,r,i,a){if(t.length===0){if(this.#e!==void 0)throw fe;if(a)return;this.#e=n;return}let[o,...s]=t,l=o===`*`?s.length===0?[``,``,ue]:[``,``,le]:o===`/*`?[``,``,de]:o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),u;if(l){let t=l[1],n=l[2]||le;if(t&&l[2]&&(n===`.*`||(n=n.replace(/^\((?!\?:)(?=[^)]+\)$)/,`(?:`),/\((?!\?:)/.test(n))))throw fe;if(u=this.#n[n],!u){if(Object.keys(this.#n).some(e=>e!==ue&&e!==de))throw fe;if(a)return;u=this.#n[n]=new e,t!==``&&(u.#t=i.varIndex++)}!a&&t!==``&&r.push([t,u.#t])}else if(u=this.#n[o],!u){if(Object.keys(this.#n).some(e=>e.length>1&&e!==ue&&e!==de))throw fe;if(a)return;u=this.#n[o]=new e}u.insert(s,n,r,i,a)}buildRegExpStr(){let e=Object.keys(this.#n).sort(me).map(e=>{let t=this.#n[e];return(typeof t.#t==`number`?`(${e})@${t.#t}`:pe.has(e)?`\\${e}`:e)+t.buildRegExpStr()});return typeof this.#e==`number`&&e.unshift(`#${this.#e}`),e.length===0?``:e.length===1?e[0]:`(?:`+e.join(`|`)+`)`}},ge=class{#e={varIndex:0};#t=new he;insert(e,t,n){let r=[],i=[];for(let t=0;;){let n=!1;if(e=e.replace(/\{[^}]+\}/g,e=>{let r=`@\\${t}`;return i[t]=[r,e],t++,n=!0,r}),!n)break}let a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let e=i.length-1;e>=0;e--){let[t]=i[e];for(let n=a.length-1;n>=0;n--)if(a[n].indexOf(t)!==-1){a[n]=a[n].replace(t,i[e][1]);break}}return this.#t.insert(a,t,r,this.#e,n),r}buildRegExp(){let e=this.#t.buildRegExpStr();if(e===``)return[/^$/,[],[]];let t=0,n=[],r=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(e,i,a)=>i===void 0?(a===void 0||(r[Number(a)]=++t),``):(n[++t]=Number(i),`$()`)),[RegExp(`^${e}`),n,r]}},_e=[/^$/,[],Object.create(null)],ve=Object.create(null);function ye(e){return ve[e]??=RegExp(e===`*`?``:`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(e,t)=>t?`\\${t}`:`(?:|/.*)`)}$`)}function be(){ve=Object.create(null)}function xe(e){let t=new ge,n=[];if(e.length===0)return _e;let r=e.map(e=>[!/\*|\/:/.test(e[0]),...e]).sort(([e,t],[n,r])=>e?1:n?-1:t.length-r.length),i=Object.create(null);for(let e=0,a=-1,o=r.length;e<o;e++){let[o,s,l]=r[e];o?i[s]=[l.map(([e])=>[e,Object.create(null)]),se]:a++;let u;try{u=t.insert(s,a,o)}catch(e){throw e===fe?new F(s):e}o||(n[a]=l.map(([e,t])=>{let n=Object.create(null);for(--t;t>=0;t--){let[e,r]=u[t];n[e]=r}return[e,n]}))}let[a,o,s]=t.buildRegExp();for(let e=0,t=n.length;e<t;e++)for(let t=0,r=n[e].length;t<r;t++){let r=n[e][t]?.[1];if(!r)continue;let i=Object.keys(r);for(let e=0,t=i.length;e<t;e++)r[i[e]]=s[r[i[e]]]}let l=[];for(let e in o)l[e]=n[o[e]];return[a,l,i]}function I(e,t){if(e){for(let n of Object.keys(e).sort((e,t)=>t.length-e.length))if(ye(n).test(t))return[...e[n]]}}var Se=class{name=`RegExpRouter`;#e;#t;constructor(){this.#e={ALL:Object.create(null)},this.#t={ALL:Object.create(null)}}add(e,t,n){let r=this.#e,i=this.#t;if(!r||!i)throw Error(P);r[e]||[r,i].forEach(t=>{t[e]=Object.create(null),Object.keys(t.ALL).forEach(n=>{t[e][n]=[...t.ALL[n]]})}),t===`/*`&&(t=`*`);let a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let o=ye(t);e===`ALL`?Object.keys(r).forEach(e=>{r[e][t]||=I(r[e],t)||I(r.ALL,t)||[]}):r[e][t]||=I(r[e],t)||I(r.ALL,t)||[],Object.keys(r).forEach(t=>{(e===`ALL`||e===t)&&Object.keys(r[t]).forEach(e=>{o.test(e)&&r[t][e].push([n,a])})}),Object.keys(i).forEach(t=>{(e===`ALL`||e===t)&&Object.keys(i[t]).forEach(e=>o.test(e)&&i[t][e].push([n,a]))});return}let o=x(t)||[t];for(let t=0,s=o.length;t<s;t++){let l=o[t];Object.keys(i).forEach(o=>{(e===`ALL`||e===o)&&(i[o][l]||=[...I(r[o],l)||I(r.ALL,l)||[]],i[o][l].push([n,a-s+t+1]))})}}match=ce;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#t).concat(Object.keys(this.#e)).forEach(t=>{e[t]||=this.#n(t)}),this.#e=this.#t=void 0,be(),e}#n(e){let t=[],n=e===`ALL`;return[this.#e,this.#t].forEach(r=>{let i=r[e]?Object.keys(r[e]).map(t=>[t,r[e][t]]):[];i.length===0?e!==`ALL`&&t.push(...Object.keys(r.ALL).map(e=>[e,r.ALL[e]])):(n||=!0,t.push(...i))}),n?xe(t):null}},Ce=class{name=`SmartRouter`;#e=[];#t=[];constructor(e){this.#e=e.routers}add(e,t,n){if(!this.#t)throw Error(P);this.#t.push([e,t,n])}match(e,t){if(!this.#t)throw Error(`Fatal error`);let n=this.#e,r=this.#t,i=n.length,a=0,o;for(;a<i;a++){let i=n[a];try{for(let e=0,t=r.length;e<t;e++)i.add(...r[e]);o=i.match(e,t)}catch(e){if(e instanceof F)continue;throw e}this.match=i.match.bind(i),this.#e=[i],this.#t=void 0;break}if(a===i)throw Error(`Fatal error`);return this.name=`SmartRouter + ${this.activeRouter.name}`,o}get activeRouter(){if(this.#t||this.#e.length!==1)throw Error(`No active router has been determined yet.`);return this.#e[0]}},we=Object.create(null),Te=e=>{for(let t in e)return!0;return!1},Ee=class e{#e;#t;#n;#r=0;#i=we;constructor(e,t,n){if(this.#t=n||Object.create(null),this.#e=[],e&&t){let n=Object.create(null);n[e]={handler:t,possibleKeys:[],score:0},this.#e=[n]}this.#n=[]}insert(t,n,r){this.#r=++this.#r;let i=this,a=d(n),o=[];for(let t=0,n=a.length;t<n;t++){let n=a[t],r=a[t+1],s=h(n,r),l=Array.isArray(s)?s[0]:n;if(l in i.#t){i=i.#t[l],s&&o.push(s[1]);continue}i.#t[l]=new e,s&&(i.#n.push(s),o.push(s[1])),i=i.#t[l]}return i.#e.push({[t]:{handler:r,possibleKeys:o.filter((e,t,n)=>n.indexOf(e)===t),score:this.#r}}),i}#a(e,t,n,r,i){for(let a=0,o=t.#e.length;a<o;a++){let o=t.#e[a],s=o[n]||o.ALL,l={};if(s!==void 0&&(s.params=Object.create(null),e.push(s),r!==we||i&&i!==we))for(let e=0,t=s.possibleKeys.length;e<t;e++){let t=s.possibleKeys[e],n=l[s.score];s.params[t]=i?.[t]&&!n?i[t]:r[t]??i?.[t],l[s.score]=!0}}}search(e,t){let n=[];this.#i=we;let r=[this],i=u(t),a=[],o=i.length,s=null;for(let l=0;l<o;l++){let u=i[l],d=l===o-1,f=[];for(let p=0,m=r.length;p<m;p++){let m=r[p],h=m.#t[u];h&&(h.#i=m.#i,d?(h.#t[`*`]&&this.#a(n,h.#t[`*`],e,m.#i),this.#a(n,h,e,m.#i)):f.push(h));for(let r=0,p=m.#n.length;r<p;r++){let p=m.#n[r],h=m.#i===we?{}:{...m.#i};if(p===`*`){let t=m.#t[`*`];t&&(this.#a(n,t,e,m.#i),t.#i=h,f.push(t));continue}let[g,_,v]=p;if(!u&&!(v instanceof RegExp))continue;let y=m.#t[g];if(v instanceof RegExp){if(s===null){s=Array(o);let e=+(t[0]===`/`);for(let t=0;t<o;t++)s[t]=e,e+=i[t].length+1}let r=t.substring(s[l]),u=v.exec(r);if(u){if(h[_]=u[0],this.#a(n,y,e,m.#i,h),u[0].length===r.length&&y.#t[`*`]&&this.#a(n,y.#t[`*`],e,m.#i,h),Te(y.#t)){y.#i=h;let e=u[0].match(/\//)?.length??0;(a[e]||=[]).push(y)}continue}}(v===!0||v.test(u))&&(h[_]=u,d?(this.#a(n,y,e,h,m.#i),y.#t[`*`]&&this.#a(n,y.#t[`*`],e,h,m.#i)):(y.#i=h,f.push(y)))}}let p=a.shift();r=p?f.concat(p):f}return n.length>1&&n.sort((e,t)=>e.score-t.score),[n.map(({handler:e,params:t})=>[e,t])]}},De=class{name=`TrieRouter`;#e;constructor(){this.#e=new Ee}add(e,t,n){let r=x(t);if(r){for(let t=0,i=r.length;t<i;t++)this.#e.insert(e,r[t],n);return}this.#e.insert(e,t,n)}match(e,t){return this.#e.search(e,t)}},Oe=class extends oe{constructor(e={}){super(e),this.router=e.router??new Ce({routers:[new Se,new De]})}},ke=/^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|msgpack|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|vnd\.msgpack|wasm|x-httpd-php|x-javascript|x-msgpack|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml|msgpack))(?:[;\s]|$)/i,Ae=(e,t=je)=>{let n=e.match(/\.([a-zA-Z0-9]+?)$/);if(n)return t[n[1].toLowerCase()]},je={aac:`audio/aac`,avi:`video/x-msvideo`,avif:`image/avif`,av1:`video/av1`,bin:`application/octet-stream`,bmp:`image/bmp`,css:`text/css; charset=utf-8`,csv:`text/csv; charset=utf-8`,eot:`application/vnd.ms-fontobject`,epub:`application/epub+zip`,gif:`image/gif`,gz:`application/gzip`,htm:`text/html; charset=utf-8`,html:`text/html; charset=utf-8`,ico:`image/x-icon`,ics:`text/calendar; charset=utf-8`,jpeg:`image/jpeg`,jpg:`image/jpeg`,js:`text/javascript; charset=utf-8`,json:`application/json`,jsonld:`application/ld+json`,map:`application/json`,mid:`audio/x-midi`,midi:`audio/x-midi`,mjs:`text/javascript; charset=utf-8`,mp3:`audio/mpeg`,mp4:`video/mp4`,mpeg:`video/mpeg`,oga:`audio/ogg`,ogv:`video/ogg`,ogx:`application/ogg`,opus:`audio/opus`,otf:`font/otf`,pdf:`application/pdf`,png:`image/png`,rtf:`application/rtf`,svg:`image/svg+xml; charset=utf-8`,tif:`image/tiff`,tiff:`image/tiff`,ts:`video/mp2t`,ttf:`font/ttf`,txt:`text/plain; charset=utf-8`,wasm:`application/wasm`,webm:`video/webm`,weba:`audio/webm`,webmanifest:`application/manifest+json`,webp:`image/webp`,woff:`font/woff`,woff2:`font/woff2`,xhtml:`application/xhtml+xml; charset=utf-8`,xml:`application/xml; charset=utf-8`,zip:`application/zip`,"3gp":`video/3gpp`,"3g2":`video/3gpp2`,gltf:`model/gltf+json`,glb:`model/gltf-binary`},Me=(...e)=>{let t=e.filter(e=>e!==``).join(`/`);t=t.replace(/(?<=\/)\/+/g,``);let n=t.split(`/`),r=[];for(let e of n)e===`..`&&r.length>0&&r.at(-1)!==`..`?r.pop():e!==`.`&&r.push(e);return r.join(`/`)||`.`},Ne={br:`.br`,zstd:`.zst`,gzip:`.gz`},Pe=Object.keys(Ne),Fe=`index.html`,Ie=e=>{let t=e.root??`./`,n=e.path,r=e.join??Me;return async(i,a)=>{if(i.finalized)return a();let o;if(e.path)o=e.path;else try{if(o=_(i.req.path),/(?:^|[\/\\])\.{1,2}(?:$|[\/\\])|[\/\\]{2,}|\\/.test(o))throw Error()}catch{return await e.onNotFound?.(i.req.path,i),a()}let s=r(t,!n&&e.rewriteRequestPath?e.rewriteRequestPath(o):o);e.isDir&&await e.isDir(s)&&(s=r(s,Fe));let l=e.getContent,u=await l(s,i);if(u instanceof Response)return i.newResponse(u.body,u);if(u!=null){let t=e.mimes&&Ae(s,e.mimes)||Ae(s);if(i.header(`Content-Type`,t||`application/octet-stream`),e.precompressed&&(!t||ke.test(t))){let e=new Set(i.req.header(`Accept-Encoding`)?.split(`,`).map(e=>e.trim()));for(let t of Pe){if(!e.has(t))continue;let n=await l(s+Ne[t],i);if(n){u=n,i.header(`Content-Encoding`,t),i.header(`Vary`,`Accept-Encoding`,{append:!0});break}}}return await e.onFound?.(s,i),i.body(u)}await e.onNotFound?.(s,i),await a()}},Le=async(e,t)=>{let n;n=t&&t.manifest?typeof t.manifest==`string`?JSON.parse(t.manifest):t.manifest:typeof __STATIC_CONTENT_MANIFEST==`string`?JSON.parse(__STATIC_CONTENT_MANIFEST):__STATIC_CONTENT_MANIFEST;let r;r=t&&t.namespace?t.namespace:__STATIC_CONTENT;let i=n[e];return i&&await r.get(i,{type:`stream`})||null},Re=(e={})=>async function(t,n){let r=async n=>Le(n,{manifest:e.manifest,namespace:e.namespace?e.namespace:t.env?t.env.__STATIC_CONTENT:void 0});return Ie({...e,getContent:r})(t,n)},ze=e=>Re(e),Be=e=>{let t={origin:`*`,allowMethods:[`GET`,`HEAD`,`PUT`,`POST`,`DELETE`,`PATCH`],allowHeaders:[],exposeHeaders:[],...e},n=(e=>typeof e==`string`?e===`*`?()=>e:t=>e===t?t:null:typeof e==`function`?e:t=>e.includes(t)?t:null)(t.origin),r=(e=>typeof e==`function`?e:Array.isArray(e)?()=>e:()=>[])(t.allowMethods);return async function(e,i){function a(t,n){e.res.headers.set(t,n)}let o=await n(e.req.header(`origin`)||``,e);if(o&&a(`Access-Control-Allow-Origin`,o),t.credentials&&a(`Access-Control-Allow-Credentials`,`true`),t.exposeHeaders?.length&&a(`Access-Control-Expose-Headers`,t.exposeHeaders.join(`,`)),e.req.method===`OPTIONS`){t.origin!==`*`&&a(`Vary`,`Origin`),t.maxAge!=null&&a(`Access-Control-Max-Age`,t.maxAge.toString());let n=await r(e.req.header(`origin`)||``,e);n.length&&a(`Access-Control-Allow-Methods`,n.join(`,`));let i=t.allowHeaders;if(!i?.length){let t=e.req.header(`Access-Control-Request-Headers`);t&&(i=t.split(/\s*,\s*/))}return i?.length&&(a(`Access-Control-Allow-Headers`,i.join(`,`)),e.res.headers.append(`Vary`,`Access-Control-Request-Headers`)),e.res.headers.delete(`Content-Length`),e.res.headers.delete(`Content-Type`),new Response(null,{headers:e.res.headers,status:204,statusText:`No Content`})}await i(),t.origin!==`*`&&e.header(`Vary`,`Origin`,{append:!0})}},L=new Oe;L.use(`/*`,async(e,t)=>{let n=e.req.header(`X-Admin-Password`),r=e.env.ADMIN_PASSWORD;if(!r)return e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500);if(n!==r)return e.json({success:!1,message:`인증 실패`},401);await t()}),L.get(`/platforms`,async e=>{let{results:t}=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM lead_platforms ORDER BY country, name`).all();return e.json({success:!0,platforms:t})}),L.post(`/platforms`,async e=>{let t=await e.req.json();return!t.code||!t.country||!t.name?e.json({success:!1,message:`code, country, name은 필수입니다.`},400):(await e.env.LOOKBOOK_DB.prepare(`INSERT INTO lead_platforms (country, code, name, directory_url, list_selector, name_selector, link_selector, category_selector, is_scrapable, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(code) DO UPDATE SET
       country=excluded.country, name=excluded.name, directory_url=excluded.directory_url,
       list_selector=excluded.list_selector, name_selector=excluded.name_selector,
       link_selector=excluded.link_selector, category_selector=excluded.category_selector,
       is_scrapable=excluded.is_scrapable, notes=excluded.notes`).bind(t.country,t.code,t.name,t.directory_url||null,t.list_selector||null,t.name_selector||null,t.link_selector||null,t.category_selector||null,+!!t.is_scrapable,t.notes||null).run(),e.json({success:!0}))}),L.post(`/collect/csv`,async e=>{let{platformCode:t,rows:n}=await e.req.json();if(!t||!Array.isArray(n)||n.length===0)return e.json({success:!1,message:`platformCode와 rows(배열)가 필요합니다.`},400);let r=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM lead_platforms WHERE code = ?`).bind(t).first();if(!r)return e.json({success:!1,message:`등록되지 않은 플랫폼 코드입니다.`},404);let i=(await e.env.LOOKBOOK_DB.prepare(`INSERT INTO collection_jobs (platform_id, method, status) VALUES (?, 'csv', 'running')`).bind(r.id).run()).meta.last_row_id,a=0;try{for(let t of n.slice(0,2e3))!t.name||!t.name.trim()||(await e.env.LOOKBOOK_DB.prepare(`INSERT OR IGNORE INTO brands (platform_id, country, name, category, brand_url, contact_email, source, status)
         VALUES (?,?,?,?,?,?, 'manual_csv', 'new')`).bind(r.id,r.country,t.name.trim(),t.category||null,t.brand_url||null,t.contact_email||null).run()).meta.changes>0&&a++;await e.env.LOOKBOOK_DB.prepare(`UPDATE collection_jobs SET status='success', collected_count=?, finished_at=datetime('now') WHERE id=?`).bind(a,i).run()}catch(t){return await e.env.LOOKBOOK_DB.prepare(`UPDATE collection_jobs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?`).bind(String(t?.message||t),i).run(),e.json({success:!1,message:`수집 중 오류: `+String(t?.message||t)},500)}return e.json({success:!0,inserted:a,jobId:i})});async function Ve(e){try{let t=new URL(e),n=`${t.origin}/robots.txt`,r=await fetch(n,{headers:{"User-Agent":`LookbookAI-LeadBot/1.0`}});if(!r.ok)return!0;let i=await r.text(),a=t.pathname||`/`,o=!1,s=!1;for(let e of i.split(`
`)){let t=e.trim();if(!t||t.startsWith(`#`))continue;let[n,...r]=t.split(`:`),i=n.trim().toLowerCase(),l=r.join(`:`).trim();i===`user-agent`?o=l===`*`:o&&i===`disallow`&&l&&a.startsWith(l)&&(s=!0)}return!s}catch{return!0}}L.post(`/collect/scrape`,async e=>{let{platformId:t}=await e.req.json(),n=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM lead_platforms WHERE id = ?`).bind(t).first();if(!n)return e.json({success:!1,message:`플랫폼을 찾을 수 없습니다.`},404);if(!n.is_scrapable)return e.json({success:!1,message:`이 플랫폼은 is_scrapable=0 입니다. 이용약관/robots.txt를 확인하고 셀렉터를 검증한 뒤 관리자가 직접 활성화해야 합니다.`},400);if(!n.directory_url||!n.list_selector)return e.json({success:!1,message:`directory_url과 list_selector를 먼저 등록하세요.`},400);if(!await Ve(n.directory_url))return e.json({success:!1,message:`robots.txt에 의해 해당 경로 크롤링이 금지되어 있습니다. 수집을 중단합니다.`},403);let r=(await e.env.LOOKBOOK_DB.prepare(`INSERT INTO collection_jobs (platform_id, method, status) VALUES (?, 'scrape', 'running')`).bind(n.id).run()).meta.last_row_id;try{let t=await fetch(n.directory_url,{headers:{"User-Agent":`LookbookAI-LeadBot/1.0 (+brand outreach lead collection; contact: admin of lookbook-ai)`}});if(!t.ok)throw Error(`대상 페이지 응답 오류: HTTP ${t.status}`);let i=await t.text(),a=[];await new HTMLRewriter().on(n.list_selector,{element(e){a.push({name:``,href:e.getAttribute(`href`)||``}),e._captureIndex=a.length-1},text(e){a.length>0&&(a[a.length-1].name+=e.text)}}).transform(new Response(i)).text();let o=[];if(n.category_selector){let e=``;await new HTMLRewriter().on(`${n.list_selector} ${n.category_selector}`,{text(t){e+=t.text,t.lastInTextNode&&(o.push(e.trim()),e=``)}}).transform(new Response(i)).text()}let s=new URL(n.directory_url),l=0;for(let t=0;t<Math.min(a.length,300);t++){let r=a[t].name.trim();if(!r)continue;let i=a[t].href;try{i=new URL(i,s).toString()}catch{}let u=o[t]||null;(await e.env.LOOKBOOK_DB.prepare(`INSERT OR IGNORE INTO brands (platform_id, country, name, category, brand_url, source, status)
         VALUES (?,?,?,?,?, 'scrape', 'new')`).bind(n.id,n.country,r,u,i).run()).meta.changes>0&&l++}return await e.env.LOOKBOOK_DB.prepare(`UPDATE collection_jobs SET status='success', collected_count=?, finished_at=datetime('now') WHERE id=?`).bind(l,r).run(),e.json({success:!0,inserted:l,totalParsed:a.length,jobId:r})}catch(t){return await e.env.LOOKBOOK_DB.prepare(`UPDATE collection_jobs SET status='failed', error=?, finished_at=datetime('now') WHERE id=?`).bind(String(t?.message||t),r).run(),e.json({success:!1,message:`수집 중 오류: `+String(t?.message||t)},500)}}),L.get(`/jobs`,async e=>{let{results:t}=await e.env.LOOKBOOK_DB.prepare(`SELECT j.*, p.name AS platform_name, p.code AS platform_code
     FROM collection_jobs j LEFT JOIN lead_platforms p ON p.id = j.platform_id
     ORDER BY j.started_at DESC LIMIT 50`).all();return e.json({success:!0,jobs:t})}),L.get(`/brands`,async e=>{let t=e.req.query(`country`),n=e.req.query(`platformId`),r=e.req.query(`status`),i=e.req.query(`search`),a=Math.min(Number(e.req.query(`limit`)||100),500),o=Number(e.req.query(`offset`)||0),s=`
    SELECT b.*, p.name AS platform_name, p.code AS platform_code,
           a.style_tags, a.target_customer, a.price_tier, a.lookbook_need_score, a.priority_score, a.ai_summary,
           (SELECT COUNT(*) FROM outreach_drafts d WHERE d.brand_id = b.id) AS draft_count
    FROM brands b
    LEFT JOIN lead_platforms p ON p.id = b.platform_id
    LEFT JOIN brand_analysis a ON a.id = (SELECT id FROM brand_analysis WHERE brand_id = b.id ORDER BY analyzed_at DESC LIMIT 1)
    WHERE 1=1
  `,l=[];t&&(s+=` AND b.country = ?`,l.push(t)),n&&(s+=` AND b.platform_id = ?`,l.push(n)),r&&(s+=` AND b.status = ?`,l.push(r)),i&&(s+=` AND b.name LIKE ?`,l.push(`%${i}%`)),s+=` ORDER BY COALESCE(a.priority_score, -1) DESC, b.collected_at DESC LIMIT ? OFFSET ?`,l.push(a,o);let{results:u}=await e.env.LOOKBOOK_DB.prepare(s).bind(...l).all();return e.json({success:!0,brands:u})}),L.get(`/brands/:id`,async e=>{let t=e.req.param(`id`),n=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM brands WHERE id = ?`).bind(t).first();if(!n)return e.json({success:!1,message:`브랜드를 찾을 수 없습니다.`},404);let{results:r}=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM brand_analysis WHERE brand_id = ? ORDER BY analyzed_at DESC`).bind(t).all(),{results:i}=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM outreach_drafts WHERE brand_id = ? ORDER BY created_at DESC`).bind(t).all();return e.json({success:!0,brand:n,analyses:r,drafts:i})}),L.patch(`/brands/:id`,async e=>{let t=e.req.param(`id`),n=await e.req.json(),r=[],i=[];for(let e of[`status`,`category`,`brand_url`,`contact_email`])n[e]!==void 0&&(r.push(`${e} = ?`),i.push(n[e]));return r.length===0?e.json({success:!1,message:`변경할 필드가 없습니다.`},400):(i.push(t),await e.env.LOOKBOOK_DB.prepare(`UPDATE brands SET ${r.join(`, `)} WHERE id = ?`).bind(...i).run(),e.json({success:!0}))});var He={street:[`스트릿`,`스트리트`,`street`,`ストリート`],casual:[`캐주얼`,`casual`,`カジュアル`],minimal:[`미니멀`,`minimal`,`ミニマル`,`contemporary`,`컨템포러리`],luxury:[`럭셔리`,`luxury`,`디자이너`,`designer`,`ラグジュアリー`],golf:[`골프`,`golf`,`ゴルフ`],outdoor:[`아웃도어`,`outdoor`,`アウトドア`],formal:[`포멀`,`수트`,`suit`,`formal`,`オフィス`,`フォーマル`],vintage:[`빈티지`,`vintage`,`ヴィンテージ`,`古着`],kids:[`키즈`,`아동`,`kids`,`baby`,`キッズ`],lingerie:[`언더웨어`,`속옷`,`lingerie`,`ランジェリー`],shoes:[`슈즈`,`신발`,`shoes`,`靴`],bag:[`가방`,`bag`,`バッグ`]},Ue={luxury:[`럭셔리`,`luxury`,`디자이너`,`designer`,`ラグジュアリー`],premium:[`프리미엄`,`premium`,`컨템포러리`,`contemporary`],budget:[`보세`,`균일가`,`budget`,`저가`,`プチプラ`]};function We(e,t){let n=`${e} ${t||``}`.toLowerCase(),r=[];for(let[e,t]of Object.entries(He))t.some(e=>n.includes(e.toLowerCase()))&&r.push(e);let i=`mid`;for(let[e,t]of Object.entries(Ue))if(t.some(e=>n.includes(e.toLowerCase()))){i=e;break}let a=55;(r.includes(`street`)||r.includes(`casual`)||r.includes(`minimal`))&&(a+=15),(r.includes(`shoes`)||r.includes(`bag`))&&(a-=10),a=Math.max(0,Math.min(100,a));let o=Math.round(a*.7+({budget:40,mid:60,premium:80,luxury:70}[i]||60)*.3),s=`${e}은(는) ${t||`패션`} 카테고리${r.length?` (${r.join(`, `)} 스타일)`:``}로 추정되며, 가격대는 ${i} 수준으로 분류됩니다. 시즌 룩북 갱신 빈도가 높을 가능성이 있어 AI 룩북 자동 생성 제안 대상으로 적합합니다.`;return{style_tags:r,target_customer:r.includes(`kids`)?`키즈/부모`:`20~30대 일반 소비자(추정)`,price_tier:i,lookbook_need_score:a,priority_score:Math.max(0,Math.min(100,o)),ai_summary:s,analysis_method:`heuristic`}}async function Ge(e,t,n,r){let i=`You are a B2B market analyst for an AI fashion lookbook generation SaaS. Given a fashion brand name and category, return ONLY strict JSON (no markdown fences) with this shape:
{"style_tags": string[], "target_customer": string, "price_tier": "budget"|"mid"|"premium"|"luxury", "lookbook_need_score": number(0-100), "priority_score": number(0-100), "ai_summary": string}
The ai_summary must be written in ${r===`US`?`English`:r===`JP`?`日本語`:`한국어`}, 2-3 sentences, explaining why this brand may need frequent AI-generated lookbook imagery.
Brand name: ${t}
Category: ${n||`unknown`}
Country: ${r}`,a=await fetch(`https://api.anthropic.com/v1/messages`,{method:`POST`,headers:{"Content-Type":`application/json`,"x-api-key":e.ANTHROPIC_API_KEY,"anthropic-version":`2023-06-01`},body:JSON.stringify({model:`claude-sonnet-5`,max_tokens:500,messages:[{role:`user`,content:i}]})});if(!a.ok)throw Error(`Claude API 오류: HTTP ${a.status}`);let o=((await a.json())?.content?.[0]?.text||`{}`).replace(/^```json\s*|```$/g,``).trim(),s=JSON.parse(o);return{style_tags:s.style_tags||[],target_customer:s.target_customer||``,price_tier:s.price_tier||`mid`,lookbook_need_score:Math.max(0,Math.min(100,Number(s.lookbook_need_score)||0)),priority_score:Math.max(0,Math.min(100,Number(s.priority_score)||0)),ai_summary:s.ai_summary||``,analysis_method:`claude`}}L.post(`/analyze`,async e=>{let{brandIds:t,platformId:n,onlyUnanalyzed:r}=await e.req.json(),i=[];if(t&&t.length)i=t;else if(n){let t=`SELECT id FROM brands WHERE platform_id = ?`;r&&(t+=` AND status = 'new'`);let{results:a}=await e.env.LOOKBOOK_DB.prepare(t).bind(n).all();i=a.map(e=>e.id)}else return e.json({success:!1,message:`brandIds 또는 platformId가 필요합니다.`},400);i=i.slice(0,100);let a=!!e.env.ANTHROPIC_API_KEY,o=0,s=[];for(let t of i){let n=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM brands WHERE id = ?`).bind(t).first();if(!n)continue;let r;try{r=a?await Ge(e.env,n.name,n.category,n.country):We(n.name,n.category)}catch(e){r=We(n.name,n.category),s.push(`brand ${t}: ${String(e?.message||e)}`)}await e.env.LOOKBOOK_DB.prepare(`INSERT INTO brand_analysis (brand_id, style_tags, target_customer, price_tier, lookbook_need_score, priority_score, ai_summary, analysis_method)
       VALUES (?,?,?,?,?,?,?,?)`).bind(t,JSON.stringify(r.style_tags),r.target_customer,r.price_tier,r.lookbook_need_score,r.priority_score,r.ai_summary,r.analysis_method).run(),await e.env.LOOKBOOK_DB.prepare(`UPDATE brands SET status = 'analyzed' WHERE id = ? AND status = 'new'`).bind(t).run(),o++}return e.json({success:!0,analyzed:o,method:a?`claude`:`heuristic`,errors:s.slice(0,10)})});var Ke={ko:{valueProps:[`촬영 스튜디오·모델 섭외 없이 몇 분 만에 시즌 룩북 이미지를 생성`,`다양한 AI 모델·배경 프리셋으로 여러 컨셉을 동시에 테스트`,`크레딧제 과금으로 소량 생산도 부담 없이 시작 가능`]},en:{valueProps:[`Generate seasonal lookbook imagery in minutes — no studio or model booking required`,`Test multiple concepts at once with a range of AI model & background presets`,`Pay-as-you-go credits, so even small runs are affordable`]},ja:{valueProps:[`スタジオ撮影やモデル手配なしで、数分でシーズンルックブック画像を生成`,`多彩なAIモデル・背景プリセットで複数のコンセプトを同時にテスト`,`クレジット制課金で少量からでも気軽に開始可能`]}};function qe(e,t,n,r){let i=Ke[e];return e===`ko`?{subject:`[제안] ${t}님을 위한 AI 룩북 자동 생성 서비스 소개`,body:`안녕하세요, ${t} 담당자님.\n\n저희는 AI로 패션 룩북 이미지를 자동 생성하는 서비스를 운영하고 있습니다. 공개된 브랜드 정보를 바탕으로 ${t}님과 잘 맞을 것 같아 연락드립니다.\n\n- ${i.valueProps.join(`
- `)}\n\n${n.length?`${n.join(`/`)} 스타일`:`시즌 컬렉션`} 룩북 제작에 활용해보실 의향이 있으시면, 샘플 이미지를 먼저 보내드리고 싶습니다.\n\n관심 없으시면 회신으로 말씀해 주세요. 더 이상 연락드리지 않겠습니다.\n\n감사합니다.\n[초안 — 검토 후 발신자 정보/연락처를 채워 넣고 발송하세요]`}:e===`ja`?{subject:`【ご提案】${t}様向けAIルックブック自動生成サービスのご紹介`,body:`${t}ご担当者様\n\nはじめまして。AIでファッションルックブック画像を自動生成するサービスを運営しております。公開されているブランド情報を拝見し、${t}様に合うのではと思いご連絡いたしました。\n\n- ${i.valueProps.join(`
- `)}\n\n${n.length?`${n.join(`/`)}系`:`シーズンコレクション`}のルックブック制作にご活用いただけそうでしたら、サンプル画像をお送りいたします。\n\nご不要な場合は返信にてお知らせください。以後のご連絡は控えさせていただきます。\n\nよろしくお願いいたします。\n[下書き — 送信前に差出人情報を追記してください]`}:{subject:`Quick idea for ${t}'s next lookbook`,body:`Hi ${t} team,\n\nWe run an AI-powered fashion lookbook generation service, and based on your brand's public profile we thought this could be a good fit.\n\n- ${i.valueProps.join(`
- `)}\n\nIf you're open to it, we'd love to send over a few sample images${n.length?` in a ${n.join(`/`)} style`:``} for your next collection.\n\nNot interested? Just reply and we won't follow up again.\n\nBest,\n[Draft — add sender contact info before sending]`}}async function Je(e,t,n,r,i,a){let o=`Write a short, professional B2B cold-outreach email (under 150 words) in ${t===`ko`?`Korean`:t===`ja`?`Japanese`:`English`} from an AI fashion lookbook generation SaaS to a fashion brand called "${n}" (category: ${r||`unknown`}, style: ${i.join(`, `)||`unknown`}, target customer: ${a||`unknown`}). Tone: friendly, non-spammy, no exaggerated claims, easy opt-out line included. Return ONLY strict JSON: {"subject": string, "body": string}`,s=await fetch(`https://api.anthropic.com/v1/messages`,{method:`POST`,headers:{"Content-Type":`application/json`,"x-api-key":e.ANTHROPIC_API_KEY,"anthropic-version":`2023-06-01`},body:JSON.stringify({model:`claude-sonnet-5`,max_tokens:600,messages:[{role:`user`,content:o}]})});if(!s.ok)throw Error(`Claude API 오류: HTTP ${s.status}`);let l=((await s.json())?.content?.[0]?.text||`{}`).replace(/^```json\s*|```$/g,``).trim();return JSON.parse(l)}L.post(`/drafts/generate`,async e=>{let{brandIds:t,language:n}=await e.req.json();if(!Array.isArray(t)||t.length===0)return e.json({success:!1,message:`brandIds가 필요합니다.`},400);let r=!!e.env.ANTHROPIC_API_KEY,i=0,a=[];for(let o of t.slice(0,50)){let t=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM brands WHERE id = ?`).bind(o).first();if(!t)continue;let s=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM brand_analysis WHERE brand_id = ? ORDER BY analyzed_at DESC LIMIT 1`).bind(o).first(),l=n||(t.country===`US`?`en`:t.country===`JP`?`ja`:`ko`),u=s?.style_tags?JSON.parse(s.style_tags):[],d=s?.price_tier||`mid`,f,p=`template`;try{r?(f=await Je(e.env,l,t.name,t.category,u,s?.target_customer||``),p=`claude`):f=qe(l,t.name,u,d)}catch(e){f=qe(l,t.name,u,d),a.push(`brand ${o}: ${String(e?.message||e)}`)}await e.env.LOOKBOOK_DB.prepare(`INSERT INTO outreach_drafts (brand_id, language, channel, subject, body, generation_method, status)
       VALUES (?,?, 'email', ?, ?, ?, 'draft')`).bind(o,l,f.subject,f.body,p).run(),await e.env.LOOKBOOK_DB.prepare(`UPDATE brands SET status = 'drafted' WHERE id = ?`).bind(o).run(),i++}return e.json({success:!0,created:i,method:r?`claude`:`template`,errors:a.slice(0,10)})}),L.get(`/drafts`,async e=>{let t=e.req.query(`status`),n=e.req.query(`language`),r=`SELECT d.*, b.name AS brand_name, b.country, b.brand_url FROM outreach_drafts d JOIN brands b ON b.id = d.brand_id WHERE 1=1`,i=[];t&&(r+=` AND d.status = ?`,i.push(t)),n&&(r+=` AND d.language = ?`,i.push(n)),r+=` ORDER BY d.created_at DESC LIMIT 200`;let{results:a}=await e.env.LOOKBOOK_DB.prepare(r).bind(...i).all();return e.json({success:!0,drafts:a})}),L.patch(`/drafts/:id`,async e=>{let t=e.req.param(`id`),n=await e.req.json(),r=[],i=[];return n.subject!==void 0&&(r.push(`subject = ?`),i.push(n.subject)),n.body!==void 0&&(r.push(`body = ?`),i.push(n.body)),n.status!==void 0&&(r.push(`status = ?`),i.push(n.status),n.status===`reviewed`&&r.push(`reviewed_at = datetime('now')`),n.status===`sent`&&r.push(`sent_at = datetime('now')`)),r.length===0?e.json({success:!1,message:`변경할 필드가 없습니다.`},400):(i.push(t),await e.env.LOOKBOOK_DB.prepare(`UPDATE outreach_drafts SET ${r.join(`, `)} WHERE id = ?`).bind(...i).run(),e.json({success:!0}))}),L.get(`/stats`,async e=>{let{results:t}=await e.env.LOOKBOOK_DB.prepare(`SELECT country, COUNT(*) AS total, SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) AS new_count,
            SUM(CASE WHEN status='analyzed' THEN 1 ELSE 0 END) AS analyzed_count,
            SUM(CASE WHEN status='drafted' THEN 1 ELSE 0 END) AS drafted_count,
            SUM(CASE WHEN status='contacted' THEN 1 ELSE 0 END) AS contacted_count
     FROM brands GROUP BY country`).all(),{results:n}=await e.env.LOOKBOOK_DB.prepare(`SELECT status, COUNT(*) AS total FROM outreach_drafts GROUP BY status`).all();return e.json({success:!0,byCountry:t,draftsByStatus:n})}),L.get(`/export.csv`,async e=>{let{results:t}=await e.env.LOOKBOOK_DB.prepare(`SELECT b.id, b.country, p.name AS platform, b.name AS brand, b.category, b.brand_url, b.contact_email, b.status,
            a.price_tier, a.priority_score, d.language, d.subject, d.body AS draft_body, d.status AS draft_status
     FROM brands b
     LEFT JOIN lead_platforms p ON p.id = b.platform_id
     LEFT JOIN brand_analysis a ON a.id = (SELECT id FROM brand_analysis WHERE brand_id=b.id ORDER BY analyzed_at DESC LIMIT 1)
     LEFT JOIN outreach_drafts d ON d.id = (SELECT id FROM outreach_drafts WHERE brand_id=b.id ORDER BY created_at DESC LIMIT 1)
     ORDER BY a.priority_score DESC`).all(),n=e=>`"${String(e??``).replace(/"/g,`""`)}"`,r=[`id`,`country`,`platform`,`brand`,`category`,`brand_url`,`contact_email`,`status`,`price_tier`,`priority_score`,`language`,`subject`,`draft_body`,`draft_status`],i=[r.join(`,`)];for(let e of t)i.push(r.map(t=>n(e[t])).join(`,`));return e.text(i.join(`
`),200,{"Content-Type":`text/csv; charset=utf-8`,"Content-Disposition":`attachment; filename="brand_leads_export.csv"`})});var Ye=(()=>{let e=new Uint32Array(256);for(let t=0;t<256;t++){let n=t;for(let e=0;e<8;e++)n=n&1?3988292384^n>>>1:n>>>1;e[t]=n>>>0}return e})();function Xe(e){let t=4294967295;for(let n=0;n<e.length;n++)t=Ye[(t^e[n])&255]^t>>>8;return(t^4294967295)>>>0}function Ze(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&apos;`)}var Qe=0,$e=33;function R(e){let t=new Uint8Array(2);return t[0]=e&255,t[1]=e>>8&255,t}function z(e){let t=new Uint8Array(4);return t[0]=e&255,t[1]=e>>8&255,t[2]=e>>16&255,t[3]=e>>>24&255,t}function et(...e){let t=e.reduce((e,t)=>e+t.length,0),n=new Uint8Array(t),r=0;for(let t of e)n.set(t,r),r+=t.length;return n}function tt(e){let t=new TextEncoder,n=[],r=[],i=0;for(let a of e){let e=t.encode(a.name),o=t.encode(a.content),s=Xe(o),l=et(z(67324752),R(20),R(0),R(0),R(Qe),R($e),z(s),z(o.length),z(o.length),R(e.length),R(0),e);n.push(l,o);let u=et(z(33639248),R(20),R(20),R(0),R(0),R(Qe),R($e),z(s),z(o.length),z(o.length),R(e.length),R(0),R(0),R(0),R(0),z(0),z(i),e);r.push(u),i+=l.length+o.length}let a=i,o=et(...r),s=et(z(101010256),R(0),R(0),R(e.length),R(e.length),z(o.length),z(a),R(0));return et(...n,o,s)}var nt=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,rt=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,it=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,at=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,ot=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`;function st(e){let t=``;for(e+=1;e>0;){let n=(e-1)%26;t=String.fromCharCode(65+n)+t,e=Math.floor((e-1)/26)}return t}function ct(e,t,n){return`<c r="${st(t)+e}" t="inlineStr"><is><t xml:space="preserve">${Ze(n)}</t></is></c>`}function lt(e){let t=[];t.push(`<row r="1">${ct(1,0,`이름`)}${ct(1,1,`이메일`)}</row>`),e.forEach((e,n)=>{let r=n+2;t.push(`<row r="${r}">${ct(r,0,e.name)}${ct(r,1,e.email)}</row>`)});let n=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:B${e.length+1}"/><sheetData>${t.join(``)}</sheetData></worksheet>`;return tt([{name:`[Content_Types].xml`,content:nt},{name:`_rels/.rels`,content:rt},{name:`xl/workbook.xml`,content:at},{name:`xl/_rels/workbook.xml.rels`,content:it},{name:`xl/styles.xml`,content:ot},{name:`xl/worksheets/sheet1.xml`,content:n}])}var B=new Oe;B.use(`/*`,async(e,t)=>{let n=e.req.header(`X-Admin-Password`),r=e.env.ADMIN_PASSWORD;if(!r)return e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500);if(n!==r)return e.json({success:!1,message:`인증 실패`},401);await t()});function ut(e){if(!e)return``;let t=e.replace(/[^0-9]/g,``);if(t.length<7)return e;if(t.startsWith(`02`)){if(t.length===9)return t.replace(/(\d{2})(\d{3})(\d{4})/,`$1-$2-$3`);if(t.length===10)return t.replace(/(\d{2})(\d{4})(\d{4})/,`$1-$2-$3`)}else if(t.startsWith(`0`)){if(t.length===9)return t.replace(/(\d{3})(\d{2})(\d{4})/,`$1-$2-$3`);if(t.length===10)return t.replace(/(\d{3})(\d{3})(\d{4})/,`$1-$2-$3`);if(t.length===11)return t.replace(/(\d{3})(\d{4})(\d{4})/,`$1-$2-$3`)}if(!t.startsWith(`0`)&&t.length>=7){let e=`0`+t;if(e.startsWith(`02`)){if(e.length===9)return e.replace(/(\d{2})(\d{3})(\d{4})/,`$1-$2-$3`);if(e.length===10)return e.replace(/(\d{2})(\d{4})(\d{4})/,`$1-$2-$3`)}else if(e.length===10)return e.replace(/(\d{3})(\d{3})(\d{4})/,`$1-$2-$3`);else if(e.length===11)return e.replace(/(\d{3})(\d{4})(\d{4})/,`$1-$2-$3`)}return e}function dt(e){if(!e)return``;let t=e.replace(/[^0-9]/g,``);return t.length===10?`${t.slice(0,3)}-${t.slice(3,5)}-${t.slice(5)}`:e}B.get(`/stats`,async e=>{let t=e.env.LOOKBOOK_DB,n=(await t.prepare(`SELECT COUNT(*) AS n FROM biz_leads`).first())?.n||0,{results:r}=await t.prepare(`SELECT region, COUNT(*) AS n FROM biz_leads WHERE region != 'N/A' AND region IS NOT NULL GROUP BY region ORDER BY n DESC`).all(),i=await t.prepare(`
    SELECT
      SUM(CASE WHEN is_valid=1  THEN 1 ELSE 0 END) AS valid,
      SUM(CASE WHEN is_valid=0  THEN 1 ELSE 0 END) AS invalid,
      SUM(CASE WHEN is_valid=-1 THEN 1 ELSE 0 END) AS pending
    FROM biz_leads
  `).first(),a=await t.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN email LIKE '%@%' AND email NOT LIKE '%**%' THEN 1 ELSE 0 END) AS email_full,
      SUM(CASE WHEN email LIKE '%**%' THEN 1 ELSE 0 END) AS email_masked,
      SUM(CASE WHEN tel NOT LIKE '%개인정보%' AND tel != 'N/A' AND tel != '' AND tel IS NOT NULL THEN 1 ELSE 0 END) AS tel_full,
      SUM(CASE WHEN tel LIKE '%개인정보%' THEN 1 ELSE 0 END) AS tel_masked,
      SUM(CASE WHEN addr != 'N/A' AND addr != '' AND addr IS NOT NULL THEN 1 ELSE 0 END) AS addr_ok,
      SUM(CASE WHEN (email LIKE '%@%' AND email NOT LIKE '%**%')
               OR (crawled_email IS NOT NULL AND crawled_email != '') THEN 1 ELSE 0 END) AS email_any,
      SUM(CASE WHEN (tel NOT LIKE '%개인정보%' AND tel != 'N/A' AND tel != '' AND tel IS NOT NULL)
               OR (crawled_tel IS NOT NULL AND crawled_tel != '') THEN 1 ELSE 0 END) AS tel_any
    FROM biz_leads WHERE is_valid = 1
  `).first(),o=await t.prepare(`
    SELECT
      SUM(CASE WHEN crawl_status IS NOT NULL THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN crawl_status = 'ok' THEN 1 ELSE 0 END) AS crawl_ok,
      SUM(CASE WHEN crawled_email IS NOT NULL AND crawled_email != '' THEN 1 ELSE 0 END) AS crawl_email,
      SUM(CASE WHEN crawled_tel   IS NOT NULL AND crawled_tel   != '' THEN 1 ELSE 0 END) AS crawl_tel,
      SUM(CASE WHEN crawled_kakao IS NOT NULL AND crawled_kakao != '' THEN 1 ELSE 0 END) AS crawl_kakao,
      SUM(CASE WHEN crawled_insta IS NOT NULL AND crawled_insta != '' THEN 1 ELSE 0 END) AS crawl_insta,
      SUM(CASE WHEN crawl_status IS NULL THEN 1 ELSE 0 END) AS crawl_pending
    FROM biz_leads WHERE is_valid = 1
  `).first();return e.json({success:!0,total:n,regions:r,validStats:i,contactStats:a,crawlStats:o})});function ft(e){let t=e.req.query(`q`)||``,n=e.req.query(`region`)||``,r=e.req.query(`status`)||``,i=e.req.query(`validOnly`)||``,a=e.req.query(`emailOnly`)||``,o=e.req.query(`telOnly`)||``,s=[],l=[];if(t){s.push(`(bzmnNm LIKE ? OR domain_clean LIKE ? OR domain LIKE ? OR addr LIKE ? OR ceo LIKE ? OR brno LIKE ? OR email LIKE ? OR crawled_email LIKE ?)`);let e=`%${t}%`;l.push(e,e,e,e,e,e,e,e)}return n&&(s.push(`region = ?`),l.push(n)),r&&(s.push(`status = ?`),l.push(r)),i===`1`&&s.push(`is_valid = 1`),a===`1`&&s.push(`email LIKE '%@%' AND email NOT LIKE '%**%'`),o===`1`&&s.push(`tel NOT LIKE '%개인정보%' AND tel != 'N/A' AND tel != '' AND tel IS NOT NULL`),{where:s.length?`WHERE `+s.join(` AND `):``,params:l}}B.get(`/list`,async e=>{let t=e.env.LOOKBOOK_DB,n=Math.max(1,parseInt(e.req.query(`page`)||`1`)),r=Math.min(200,parseInt(e.req.query(`limit`)||`100`)),i=(n-1)*r,{where:a,params:o}=ft(e),s=(await t.prepare(`SELECT COUNT(*) AS n FROM biz_leads ${a}`).bind(...o).first())?.n||0,{results:l}=await t.prepare(`
    SELECT id, bzmnNm, codeName, status, inst, region, ceo, brno, declDate,
           method, domain, domain_clean, is_valid,
           addr, tel, email, server,
           crawled_email, crawled_tel, crawled_kakao, crawled_insta, crawl_status
    FROM biz_leads ${a} ORDER BY id LIMIT ? OFFSET ?
  `).bind(...o,r,i).all();return e.json({success:!0,total:s,page:n,limit:r,rows:l})}),B.get(`/detail/:id`,async e=>{let t=e.req.param(`id`),n=await e.env.LOOKBOOK_DB.prepare(`SELECT * FROM biz_leads WHERE id = ?`).bind(t).first();return n?e.json({success:!0,...n}):e.json({success:!1,message:`찾을 수 없습니다.`},404)}),B.get(`/download.csv`,async e=>{let t=e.env.LOOKBOOK_DB,{where:n,params:r}=ft(e),{results:i}=await t.prepare(`
    SELECT id, bzmnNm, codeName, status, region, ceo, brno, declDate,
           domain_clean, is_valid, email, tel, addr, server,
           crawled_email, crawled_tel, crawled_kakao, crawled_insta
    FROM biz_leads ${n} ORDER BY id
  `).bind(...r).all(),a={1:`유효`,0:`불가`,"-1":`미검증`},o=`﻿번호,상호명,취급품목,영업상태,지역,대표자,사업자번호,신고일자,도메인,도메인유효,이메일(원본),전화번호(원본),크롤링이메일,크롤링전화,카카오채널,인스타그램,주소,서버소재지\r
`+i.map(e=>{let t=(e.email||``).includes(`**`)||!(e.email||``).includes(`@`),n=(e.tel||``).includes(`개인정보`);return[e.id,e.bzmnNm,e.codeName,e.status,e.region,e.ceo,dt(e.brno||``),e.declDate,e.domain_clean,a[String(e.is_valid)]??`미검증`,t?`[마스킹]`:e.email||``,n?`[마스킹]`:ut(e.tel||``),e.crawled_email||``,e.crawled_tel||``,e.crawled_kakao||``,e.crawled_insta||``,e.addr,e.server].map(e=>`"${String(e??``).replace(/"/g,`""`)}"`).join(`,`)}).join(`\r
`);return e.text(o,200,{"Content-Type":`text/csv; charset=utf-8`,"Content-Disposition":`attachment; filename="fashion_biz_leads.csv"`})}),B.get(`/export/kakao.csv`,async e=>{let{results:t}=await e.env.LOOKBOOK_DB.prepare(`
    SELECT id, bzmnNm, domain_clean, crawled_kakao FROM biz_leads
    WHERE crawled_kakao IS NOT NULL AND crawled_kakao != '' ORDER BY id
  `).all(),n=`﻿번호,상호명,도메인,카카오채널\r
`+t.map(e=>[e.id,e.bzmnNm,e.domain_clean,e.crawled_kakao].map(e=>`"${String(e??``).replace(/"/g,`""`)}"`).join(`,`)).join(`\r
`);return e.text(n,200,{"Content-Type":`text/csv; charset=utf-8`,"Content-Disposition":`attachment; filename="fashion_biz_kakao.csv"`})}),B.get(`/export/insta.csv`,async e=>{let{results:t}=await e.env.LOOKBOOK_DB.prepare(`
    SELECT id, bzmnNm, domain_clean, crawled_insta FROM biz_leads
    WHERE crawled_insta IS NOT NULL AND crawled_insta != '' ORDER BY id
  `).all(),n=`﻿번호,상호명,도메인,인스타그램\r
`+t.map(e=>[e.id,e.bzmnNm,e.domain_clean,e.crawled_insta].map(e=>`"${String(e??``).replace(/"/g,`""`)}"`).join(`,`)).join(`\r
`);return e.text(n,200,{"Content-Type":`text/csv; charset=utf-8`,"Content-Disposition":`attachment; filename="fashion_biz_instagram.csv"`})});var pt=`
  is_valid = 1
  AND mail_sent_at IS NULL
  AND (
    (email LIKE '%@%' AND email NOT LIKE '%**%')
    OR (crawled_email IS NOT NULL AND crawled_email LIKE '%@%')
  )
`,mt=`CASE WHEN email LIKE '%@%' AND email NOT LIKE '%**%' THEN email ELSE crawled_email END`,ht=`COALESCE(NULLIF(bzmnNm, ''), NULLIF(domain_clean, ''), '거래처')`;B.get(`/mail-batch/status`,async e=>{let t=e.env.LOOKBOOK_DB,n=(await t.prepare(`SELECT COUNT(*) AS n FROM biz_leads WHERE ${pt}`).first())?.n||0,r=await t.prepare(`
    SELECT mail_batch, COUNT(*) AS n, MAX(mail_sent_at) AS sent_at
    FROM biz_leads WHERE mail_batch IS NOT NULL
    GROUP BY mail_batch ORDER BY mail_batch DESC LIMIT 1
  `).first(),i=(await t.prepare(`SELECT COUNT(*) AS n FROM biz_leads WHERE mail_sent_at IS NOT NULL`).first())?.n||0;return e.json({success:!0,remaining:n,totalSent:i,lastBatch:r||null})}),B.post(`/mail-batch/next`,async e=>{let t=e.env.LOOKBOOK_DB,n=Math.min(200,Math.max(1,parseInt(e.req.query(`size`)||`200`))),{results:r}=await t.prepare(`
    SELECT id, ${ht} AS name, ${mt} AS email
    FROM biz_leads
    WHERE ${pt}
    ORDER BY CASE WHEN email LIKE '%@%' AND email NOT LIKE '%**%' THEN 0 ELSE 1 END, id
    LIMIT ?
  `).bind(n).all();if(!r.length)return e.json({success:!1,message:`더 이상 뽑을 수 있는 리드가 없습니다 (조건에 맞는 리드가 모두 소진됨).`},404);let i=(await t.prepare(`SELECT COALESCE(MAX(mail_batch), 0) + 1 AS n FROM biz_leads`).first())?.n||1,a=new Date().toISOString(),o=r.map(e=>e.id),s=[];for(let e=0;e<o.length;e+=90){let n=o.slice(e,e+90),r=n.map(()=>`?`).join(`,`);s.push(t.prepare(`UPDATE biz_leads SET mail_sent_at = ?, mail_batch = ? WHERE id IN (${r})`).bind(a,i,...n))}await t.batch(s);let l=lt(r.map(e=>({name:e.name,email:e.email})));return new Response(l,{status:200,headers:{"Content-Type":`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,"Content-Disposition":`attachment; filename="bizleads_mail_batch_${i}.xlsx"`,"X-Batch-Id":String(i),"X-Batch-Count":String(r.length)}})}),B.get(`/mail-batch/:batchId`,async e=>{let t=parseInt(e.req.param(`batchId`));if(!t)return e.json({success:!1,message:`잘못된 배치 번호`},400);let{results:n}=await e.env.LOOKBOOK_DB.prepare(`
    SELECT id, ${ht} AS name, ${mt} AS email
    FROM biz_leads WHERE mail_batch = ? ORDER BY id
  `).bind(t).all();if(!n.length)return e.json({success:!1,message:`해당 배치를 찾을 수 없습니다.`},404);let r=lt(n.map(e=>({name:e.name,email:e.email})));return new Response(r,{status:200,headers:{"Content-Type":`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,"Content-Disposition":`attachment; filename="bizleads_mail_batch_${t}.xlsx"`,"X-Batch-Id":String(t),"X-Batch-Count":String(n.length)}})});var gt=`mt9eieaj`,_t=e=>e?`
  <script async src="https://www.googletagmanager.com/gtag/js?id=${e}"><\/script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${e}');
  <\/script>`:``,V=new Oe;V.use(`/api/*`,Be()),V.use(`/static/*`,ze({root:`./public`})),V.use(`*`,async(e,t)=>{if((e.req.header(`host`)||``).includes(`studiob.aifashion.co.kr`)&&!e.req.path.startsWith(`/api/`)&&!e.req.path.startsWith(`/payment/`)){let t=new URL(e.req.url);return e.redirect(`https://www.aifashion.co.kr${t.pathname}${t.search}`,302)}await t()}),V.route(`/api/admin/leads`,L),V.route(`/api/admin/bizleads`,B);var H=`https://api.atlascloud.ai`,U=`https://www.aifashion.co.kr`,W=async(e,t)=>{let n=e.req.header(`X-Admin-Password`),r=e.env.ADMIN_PASSWORD;if(!r)return e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500);if(n!==r)return e.json({success:!1,message:`인증 실패`},401);await t()},G={enabled:!0,prefix:``,suffix:``,styleGuide:[`SCENE-FIRST INTEGRATION PRINCIPLE: Every composited element — clothing, face, skin — must look as if it was photographed in the original background scene, not pasted in.`,`LIGHTING MATCH: Identify the background scene's primary light source direction, color temperature (warm/neutral/cool), and intensity. Apply identical lighting to the person's clothing, face, and all exposed skin. Cast-shadows, specular highlights, and subsurface skin scattering must all originate from the scene's light source.`,`COLOR GRADE MATCH: The background scene carries a specific color grade and tonal mood (e.g. warm golden, cool blue, high-contrast, soft pastel, moody dark). Render all composited elements under this exact color cast — do NOT render clothing or skin under a neutral white balance if the scene is warm or cool-toned.`,`MOOD AND ATMOSPHERE MATCH: Preserve the scene's overall visual mood and atmosphere. The final image must feel tonally coherent — bright and airy scenes stay bright, moody scenes stay moody, editorial high-contrast stays high-contrast.`,`FABRIC LIGHT INTERACTION: Simulate realistic light interaction with the new fabric — specular sheen on satin/silk, soft diffuse on cotton/knit, translucency on chiffon/voile — all under the scene's lighting conditions.`,`Fashion editorial quality: magazine cover level seamless compositing, physically grounded.`].join(` `),technicalSpec:[`초사실적 표현, 직물 질감과 피부 디테일 극사실 재현.`,`의류 드레이프와 핏 완벽 재현. 자연스러운 주름 외 구김 없음.`,`의류에 선명한 포커스. 배경과 동일한 심도 및 렌즈 특성 유지.`,`배경 씬의 색감·무드·조명 톤을 인물과 의류에 완전히 통합. 합성 아티팩트 없음.`,`참조 이미지에 없는 의류, 액세서리, 소품 절대 추가 금지.`,`ABSOLUTE PROHIBITION: DO NOT modify, redesign, or alter any detail of the uploaded clothing item.`].join(` `),updatedAt:new Date().toISOString()};function vt(e){if(!G.enabled)return e;let t=[];return G.prefix.trim()&&t.push(G.prefix.trim()),t.push(e),G.styleGuide.trim()&&t.push(G.styleGuide.trim()),G.technicalSpec.trim()&&t.push(G.technicalSpec.trim()),G.suffix.trim()&&t.push(G.suffix.trim()),t.join(` `)}async function K(e){let t=await e.get(`model_index`);return t?JSON.parse(t):[]}async function yt(e,t){await e.put(`model_index`,JSON.stringify(t))}async function q(e){let t=await e.get(`bg_index`);return t?JSON.parse(t):[]}async function bt(e,t){await e.put(`bg_index`,JSON.stringify(t))}async function xt(e,t){let n=await q(e),r=n.find(e=>e.id===t);if(!r)return{ok:!1,isDefault:!1};let i=!r.isDefault;return n.forEach(e=>{e.isDefault=i&&e.id===t}),await bt(e,n),{ok:!0,isDefault:i}}async function St(e){let t=await e.get(`id_counter`),n=t?parseInt(t)+1:1001;return await e.put(`id_counter`,String(n)),String(n-1==0?1e3:n-1)}async function Ct(e){await e.prepare(`UPDATE id_counter SET value = value + 1 WHERE id = 1`).run();let t=await e.prepare(`SELECT value FROM id_counter WHERE id = 1`).first();return String(t?.value??1e3)}async function wt(e){let{results:t}=await e.prepare(`SELECT id, name, desc_text, gender, age, mood, created_at FROM custom_models ORDER BY created_at ASC`).all();return t.map(e=>({id:e.id,name:e.name,desc:e.desc_text,gender:e.gender||`미분류`,age:e.age||`미분류`,mood:e.mood||`미분류`,createdAt:e.created_at}))}async function Tt(e,t){let n=[];for(let r of t){let{name:t,desc:i,gender:a,age:o,mood:s,imageBase64:l}=r;if(!t||!l)continue;let u=await Ct(e),d=new Date().toISOString();try{await e.prepare(`INSERT INTO custom_models (id, name, desc_text, gender, age, mood, image_b64, created_at) VALUES (?,?,?,?,?,?,?,?)`).bind(u,t,i||t,a||`미분류`,o||`미분류`,s||`미분류`,l,d).run()}catch{await e.prepare(`INSERT INTO custom_models (id, name, desc_text, image_b64, created_at) VALUES (?,?,?,?,?)`).bind(u,t,i||t,l,d).run()}n.push({id:u,name:t,desc:i||t,gender:a||`미분류`,age:o||`미분류`,mood:s||`미분류`,createdAt:d})}return n}async function Et(e,t){return((await e.prepare(`DELETE FROM custom_models WHERE id = ?`).bind(t).run()).meta?.changes??0)>0}async function Dt(e,t){return(await e.prepare(`SELECT image_b64 FROM custom_models WHERE id = ?`).bind(t).first())?.image_b64??null}async function Ot(e){try{let{results:t}=await e.prepare(`SELECT id, name, category, bg_desc, created_at, is_default, CASE WHEN gen_image_b64 IS NOT NULL AND gen_image_b64 != '' THEN 1 ELSE 0 END AS has_gen_image FROM custom_bgs ORDER BY created_at ASC`).all();return t.map(e=>({id:e.id,name:e.name,bgDesc:e.bg_desc,category:e.category,createdAt:e.created_at,hasGenImage:!!e.has_gen_image,isDefault:!!e.is_default}))}catch{let{results:t}=await e.prepare(`SELECT id, name, category, bg_desc, created_at, CASE WHEN gen_image_b64 IS NOT NULL AND gen_image_b64 != '' THEN 1 ELSE 0 END AS has_gen_image FROM custom_bgs ORDER BY created_at ASC`).all();return t.map(e=>({id:e.id,name:e.name,bgDesc:e.bg_desc,category:e.category,createdAt:e.created_at,hasGenImage:!!e.has_gen_image,isDefault:!1}))}}async function kt(e,t){let n=await e.prepare(`SELECT is_default FROM custom_bgs WHERE id = ?`).bind(t).first();if(!n)return{ok:!1,isDefault:!1};let r=!n.is_default;return await e.prepare(`UPDATE custom_bgs SET is_default = 0`).run(),r&&await e.prepare(`UPDATE custom_bgs SET is_default = 1 WHERE id = ?`).bind(t).run(),{ok:!0,isDefault:r}}async function At(e,t){let n=[];for(let r of t){let{name:t,bgDesc:i,category:a,imageBase64:o}=r;if(!t||!o)continue;let s=await Ct(e),l=new Date().toISOString();await e.prepare(`INSERT INTO custom_bgs (id, name, category, bg_desc, image_b64, created_at) VALUES (?,?,?,?,?,?)`).bind(s,t,a||`커스텀`,i||t,o,l).run(),n.push({id:s,name:t,bgDesc:i||t,category:a||`커스텀`,createdAt:l})}return n}async function jt(e,t){return((await e.prepare(`DELETE FROM custom_bgs WHERE id = ?`).bind(t).run()).meta?.changes??0)>0}async function Mt(e,t){return(await e.prepare(`SELECT image_b64 FROM custom_bgs WHERE id = ?`).bind(t).first())?.image_b64??null}async function Nt(e,t,n){return((await e.prepare(`UPDATE custom_bgs SET gen_image_b64 = ? WHERE id = ?`).bind(n,t).run()).meta?.changes??0)>0}var J=[],Y=[],Pt=1e3,X=[{code:`TOP`,group:`상의`,label:`상의`},{code:`BOTTOM`,group:`하의`,label:`하의`},{code:`OUTER`,group:`아우터`,label:`아우터`},{code:`DRESS`,group:`원피스`,label:`원피스`},{code:`JUMPSUIT`,group:`점프수트`,label:`점프수트`},{code:`SET`,group:`세트`,label:`세트`}],Ft=new Set(X.map(e=>e.code));async function It(e,t){return await e.get(`ghostcut_img:${t}`)}async function Lt(e,t,n){await e.put(`ghostcut_img:${t}`,n)}async function Rt(e,t){await e.delete(`ghostcut_img:${t}`)}async function zt(e){let t=await Promise.all(X.map(async t=>[t.code,!!await e.get(`ghostcut_img:${t.code}`)]));return Object.fromEntries(t)}async function Bt(e,t){return(await e.prepare(`SELECT image_b64 FROM ghost_cut_samples WHERE category = ?`).bind(t).first())?.image_b64??null}async function Vt(e,t,n,r,i){await e.prepare(`INSERT INTO ghost_cut_samples (category, group_name, label_ko, image_b64, updated_at) VALUES (?,?,?,?,datetime('now'))
     ON CONFLICT(category) DO UPDATE SET image_b64 = excluded.image_b64, updated_at = excluded.updated_at`).bind(t,n,r,i).run()}async function Ht(e,t){return((await e.prepare(`DELETE FROM ghost_cut_samples WHERE category = ?`).bind(t).run()).meta?.changes??0)>0}async function Ut(e){let{results:t}=await e.prepare(`SELECT category FROM ghost_cut_samples WHERE image_b64 IS NOT NULL AND image_b64 != ''`).all(),n=new Set(t.map(e=>e.category)),r={};return X.forEach(e=>{r[e.code]=n.has(e.code)}),r}var Z={};V.post(`/api/admin/models`,W,async e=>{try{let t=await e.req.json(),n=Array.isArray(t)?t:[t];if(n.length===0)return e.json({success:!1,message:`업로드할 항목이 없습니다.`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB,a=[];if(r){let e=await K(r);for(let t of n){let{name:n,desc:i,imageBase64:o}=t;if(!n||!o)continue;let s=await St(r),l={id:s,name:n,desc:i||n,createdAt:new Date().toISOString()};e.push(l),await r.put(`model_img:${s}`,o),a.push(l)}await yt(r,e)}else if(i)a=await Tt(i,n);else for(let e of n){let{name:t,desc:n,imageBase64:r}=e;if(!t||!r)continue;let i=String(Pt++),o={id:i,name:t,desc:n||t,imageBase64:r,createdAt:new Date().toISOString()};J.push(o),a.push({id:i,name:t,desc:o.desc,createdAt:o.createdAt})}return e.json({success:!0,models:a,count:a.length})}catch(t){return e.json({success:!1,message:t.message},500)}});var Wt={TOP:`You are an image classifier for a fashion shopping app upload slot labeled "상의" (TOP). Does this image contain a TOP garment (shirt, blouse, t-shirt, jacket, coat, sweater, hoodie, etc.) that is clearly identifiable somewhere in the image — whether laid flat, on a hanger, worn alone, or worn together with a bottom in a full-outfit/styled photo? A full-outfit shot showing both a top and a bottom together is fine as long as a top is present — the app will extract only the top from it.
Answer NO only if: the image has no clothing at all; or the ONLY garment visible is a BOTTOM (pants, skirt, shorts) with no top anywhere in the frame.
Respond with ONLY one word: YES or NO.`,BOTTOM:`You are an image classifier for a fashion shopping app upload slot labeled "하의" (BOTTOM). Does this image contain a BOTTOM garment (pants, jeans, skirt, shorts, etc.) that is clearly identifiable somewhere in the image — whether laid flat, on a hanger, worn alone, or worn together with a top in a full-outfit/styled photo? A full-outfit shot showing both a top and a bottom together is fine as long as a bottom is present — the app will extract only the bottom from it.
Answer NO only if: the image has no clothing at all; or the ONLY garment visible is a TOP (shirt, jacket, sweater) with no bottom anywhere in the frame.
Respond with ONLY one word: YES or NO.`,DRESS:`You are an image classifier for a fashion shopping app upload slot labeled "전체" (FULL OUTFIT). Does this image show a FULL OUTFIT as its clearly identifiable main subject — either (a) a one-piece garment (dress, jumpsuit, overalls), or (b) a photo where a TOP and a BOTTOM are BOTH clearly visible/identifiable together as a complete styled look?
Answer NO if: the image has no clothing at all; or it shows only a single separate garment piece (just a top with no bottom visible, or just a bottom with no top visible).
Respond with ONLY one word: YES or NO.`};V.post(`/api/validate/clothing`,async e=>{try{let t=await e.req.json(),n=t?.imageBase64||``,r=t?.cat||``;if(!n)return e.json({success:!1,message:`imageBase64 필수`},400);let i=e.env?.OPENAI_API_KEY||``;if(!i)return e.json({success:!0,isClothing:!0});let a=await qt(i,n,Wt[r]||Wt.DRESS);return a===null?e.json({success:!0,isClothing:!0}):e.json({success:!0,isClothing:a.trim().toUpperCase().startsWith(`YES`)})}catch(t){return console.error(`validate/clothing error:`,t),e.json({success:!0,isClothing:!0})}});var Gt=[`You are a clothing product classifier for a "ghost mannequin" e-commerce photography app.`,`Look at the uploaded image. First decide: is this clearly a photo of a SINGLE clothing/fashion product (worn, laid flat, on a hanger, or on a mannequin)? It does not need to be a professional product shot.`,`If it is NOT a clothing product at all (e.g. a person's portrait unrelated to showing a garment, an animal, food, scenery, a random object, or an image with no identifiable single garment), respond with exactly: NOT_CLOTHING`,`If it IS a clothing product, respond with EXACTLY ONE of these category codes (the single best match, nothing else):`,X.map(e=>`${e.code} (${e.group} - ${e.label})`).join(`, `),`Respond with ONLY the code (e.g. "TOP") or "NOT_CLOTHING" — no explanation, no punctuation, no extra words.`].join(`
`);V.post(`/api/ghostcut/classify`,async e=>{try{let t=(await e.req.json())?.imageBase64||``;if(!t)return e.json({success:!1,message:`imageBase64 필수`},400);let n=e.env?.OPENAI_API_KEY||``;if(!n)return e.json({success:!1,message:`서버 설정 오류: OPENAI_API_KEY 미설정`},500);let r=await qt(n,t,Gt);if(r===null)return e.json({success:!1,message:`이미지 분석에 실패했습니다. 잠시 후 다시 시도해주세요.`});let i=r.trim().toUpperCase().replace(/[^A-Z_]/g,``);if(i===`NOT_CLOTHING`)return e.json({success:!0,isClothing:!1});let a=X.find(e=>e.code===i);if(!a)return console.warn(`ghostcut/classify: 알 수 없는 분류 응답:`,r),e.json({success:!1,message:`이미지 분류에 실패했습니다. 다른 사진으로 다시 시도해주세요.`});let o=e.env?.LOOKBOOK_KV,s=e.env?.LOOKBOOK_DB,l=!1;return l=o?!!await It(o,i):s?!!await Bt(s,i):!!Z[i],e.json({success:!0,isClothing:!0,category:i,group:a.group,label:a.label,displayLabel:a.label,sampleReady:l})}catch(t){return console.error(`ghostcut/classify error:`,t),e.json({success:!1,message:`이미지 분석 중 오류가 발생했습니다.`})}}),V.post(`/api/admin/auto-label`,W,async e=>{try{let{type:t,imageBase64:n}=await e.req.json();if(!n)return e.json({success:!1,message:`imageBase64 필수`},400);let r=e.env?.OPENAI_API_KEY||``;if(!r)return e.json({success:!1,message:`OPENAI_API_KEY 미설정`},500);let i=e=>{let t=e.match(/\{[\s\S]*\}/);return JSON.parse(t?.[0]||e)};if(t===`model`){let t=await qt(r,n,`You are an AI fashion model classifier. Analyze this model photo and return ONLY a JSON object with these exact fields:
{
  "gender": "여성" or "남성",
  "age": "10대" or "20대" or "30대" or "40대",
  "mood": one of ["로맨틱", "보이시", "캐주얼", "시크", "내추럴"]
}
Rules:
- gender: female face/body = "여성", male = "남성"
- age: estimate from face
- mood: overall vibe of the person/styling
Return ONLY the JSON, no explanation.`);if(t===null)return e.json({success:!1,message:`라벨링 요청 실패`},500);try{let n=i(t);return e.json({success:!0,labels:{gender:n.gender||`미분류`,age:n.age||`미분류`,mood:n.mood||`미분류`}})}catch{return e.json({success:!1,message:`응답 파싱 실패`,raw:t})}}else if(t===`background`){let t=await qt(r,n,`You are a fashion photography background classifier. Analyze this background image and return ONLY a JSON object:
{
  "category": one of ["스튜디오", "야외/자연", "도심/거리", "인테리어", "컨셉/특수"],
  "mood": one of ["미니멀", "내추럴", "모던", "빈티지", "럭셔리", "스트릿"],
  "name_ko": short Korean name for this background (5-10 chars)
}
Return ONLY the JSON, no explanation.`);if(t===null)return e.json({success:!1,message:`라벨링 요청 실패`},500);try{let n=i(t);return e.json({success:!0,labels:{category:n.category||`스튜디오`,mood:n.mood||`미니멀`,name_ko:n.name_ko||``}})}catch{return e.json({success:!1,message:`응답 파싱 실패`,raw:t})}}return e.json({success:!1,message:`type은 model 또는 background 이어야 합니다.`},400)}catch(t){return e.json({success:!1,message:t.message},500)}}),V.patch(`/api/admin/models/:id/labels`,W,async e=>{try{let t=e.req.param(`id`),{gender:n,age:r,mood:i}=await e.req.json(),a=e.env?.LOOKBOOK_KV,o=e.env?.LOOKBOOK_DB;if(a){let o=await K(a),s=o.findIndex(e=>e.id===t);return s===-1?e.json({success:!1,message:`모델을 찾을 수 없습니다.`},404):(o[s]={...o[s],gender:n||`미분류`,age:r||`미분류`,mood:i||`미분류`},await yt(a,o),e.json({success:!0}))}return o?(await o.prepare(`UPDATE custom_models SET gender=?, age=?, mood=? WHERE id=?`).bind(n||`미분류`,r||`미분류`,i||`미분류`,t).run(),e.json({success:!0})):e.json({success:!1,message:`D1/KV 없음`},500)}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/admin/models`,W,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB;if(t){let n=await K(t);return e.json({success:!0,models:n})}if(n){let t=await wt(n);return e.json({success:!0,models:t})}let r=J.map(e=>({id:e.id,name:e.name,desc:e.desc,createdAt:e.createdAt}));return e.json({success:!0,models:r})}),V.delete(`/api/admin/models/:id`,W,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n){let r=await K(n),i=r.filter(e=>e.id!==t);return await yt(n,i),await n.delete(`model_img:${t}`),e.json({success:r.length>i.length})}if(r){let n=await Et(r,t);return e.json({success:n})}let i=J.length;return J=J.filter(e=>e.id!==t),e.json({success:J.length<i})}),V.get(`/api/proxy/custom-model/:id`,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB,i=null;if(i=n?await n.get(`model_img:${t}`):r?await Dt(r,t):J.find(e=>e.id===t)?.imageBase64||null,!i)return e.notFound();let[a,o]=i.split(`,`),s=(a.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,l=atob(o),u=new Uint8Array(l.length);for(let e=0;e<l.length;e++)u[e]=l.charCodeAt(e);return new Response(u.buffer,{headers:{"Content-Type":s,"Cache-Control":`public, max-age=3600`}})}),V.post(`/api/admin/backgrounds`,W,async e=>{try{let t=await e.req.json(),n=Array.isArray(t)?t:[t];if(n.length===0)return e.json({success:!1,message:`업로드할 항목이 없습니다.`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB,a=[];if(r){let e=await q(r);for(let t of n){let{name:n,bgDesc:i,category:o,imageBase64:s}=t;if(!n||!s)continue;let l=await St(r),u={id:l,name:n,bgDesc:i||n,category:o||`커스텀`,createdAt:new Date().toISOString()};e.push(u),await r.put(`bg_img:${l}`,s),a.push(u)}await bt(r,e)}else if(i)a=await At(i,n);else for(let e of n){let{name:t,bgDesc:n,category:r,imageBase64:i}=e;if(!t||!i)continue;let o=String(Pt++),s={id:o,name:t,bgDesc:n||t,category:r||`커스텀`,imageBase64:i,createdAt:new Date().toISOString()};Y.push(s),a.push({id:o,name:t,bgDesc:s.bgDesc,category:s.category,createdAt:s.createdAt})}return e.json({success:!0,backgrounds:a,count:a.length})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/admin/backgrounds`,W,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB;if(t){let n=await q(t);return e.json({success:!0,backgrounds:n})}if(n){let t=await Ot(n);return e.json({success:!0,backgrounds:t})}let r=Y.map(e=>({id:e.id,name:e.name,bgDesc:e.bgDesc,category:e.category,createdAt:e.createdAt,hasGenImage:!!e.genImageBase64,isDefault:!!e.isDefault}));return e.json({success:!0,backgrounds:r})}),V.delete(`/api/admin/backgrounds/:id`,W,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n){let r=await q(n),i=r.filter(e=>e.id!==t);return await bt(n,i),await n.delete(`bg_img:${t}`),await n.delete(`bg_gen_img:${t}`),e.json({success:r.length>i.length})}if(r){let n=await jt(r,t);return e.json({success:n})}let i=Y.length;return Y=Y.filter(e=>e.id!==t),e.json({success:Y.length<i})}),V.put(`/api/admin/backgrounds/:id/gen-image`,W,async e=>{let t=e.req.param(`id`);try{let n=(await e.req.json())?.imageBase64||``;if(!n)return e.json({success:!1,message:`imageBase64 필수`},400);let r=e.env?.LOOKBOOK_KV,i=e.env?.LOOKBOOK_DB;if(r){let i=await q(r),a=i.find(e=>e.id===t);return a?(await r.put(`bg_gen_img:${t}`,n),a.hasGenImage=!0,await bt(r,i),e.json({success:!0})):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404)}if(i)return await Nt(i,t,n)?e.json({success:!0}):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404);let a=Y.find(e=>e.id===t);return a?(a.genImageBase64=n,e.json({success:!0})):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404)}catch(t){return e.json({success:!1,message:t.message},500)}}),V.put(`/api/admin/backgrounds/:id/default`,W,async e=>{let t=e.req.param(`id`);try{let n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n){let r=await xt(n,t);return r.ok?e.json({success:!0,isDefault:r.isDefault}):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404)}if(r){let n=await kt(r,t);return n.ok?e.json({success:!0,isDefault:n.isDefault}):e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404)}let i=Y.find(e=>e.id===t);if(!i)return e.json({success:!1,message:`배경을 찾을 수 없습니다.`},404);let a=!i.isDefault;return Y.forEach(e=>{e.isDefault=!1}),i.isDefault=a,e.json({success:!0,isDefault:a})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/proxy/custom-bg/:id`,async e=>{let t=e.req.param(`id`),n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB,i=null;if(i=n?await n.get(`bg_img:${t}`):r?await Mt(r,t):Y.find(e=>e.id===t)?.imageBase64||null,!i)return e.notFound();let[a,o]=i.split(`,`),s=(a.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,l=atob(o),u=new Uint8Array(l.length);for(let e=0;e<l.length;e++)u[e]=l.charCodeAt(e);return new Response(u.buffer,{headers:{"Content-Type":s,"Cache-Control":`public, max-age=3600`}})}),V.get(`/api/admin/ghostcut-samples`,W,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB,r={};t?r=await zt(t):n?r=await Ut(n):X.forEach(e=>{r[e.code]=!!Z[e.code]});let i=X.map(e=>({...e,hasSample:!!r[e.code]}));return e.json({success:!0,categories:i})}),V.get(`/api/admin/ghostcut-samples/:category/image`,W,async e=>{let t=e.req.param(`category`);if(!Ft.has(t))return e.json({success:!1,message:`알 수 없는 카테고리`},400);let n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB,i=null;return i=n?await It(n,t):r?await Bt(r,t):Z[t]||null,e.json({success:!0,imageBase64:i})}),V.post(`/api/admin/ghostcut-samples/:category`,W,async e=>{let t=e.req.param(`category`),n=X.find(e=>e.code===t);if(!n)return e.json({success:!1,message:`알 수 없는 카테고리`},400);try{let r=(await e.req.json())?.imageBase64||``;if(!r)return e.json({success:!1,message:`imageBase64 필수`},400);let i=e.env?.LOOKBOOK_KV,a=e.env?.LOOKBOOK_DB;return i?await Lt(i,t,r):a?await Vt(a,t,n.group,n.label,r):Z[t]=r,e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/admin/ghostcut-samples/:category`,W,async e=>{let t=e.req.param(`category`);if(!Ft.has(t))return e.json({success:!1,message:`알 수 없는 카테고리`},400);let n=e.env?.LOOKBOOK_KV,r=e.env?.LOOKBOOK_DB;if(n)return await Rt(n,t),e.json({success:!0});if(r){let n=await Ht(r,t);return e.json({success:n})}let i=!!Z[t];return delete Z[t],e.json({success:i})}),V.get(`/api/proxy/clothing/:jobId/:idx`,async e=>{let t=e.req.param(`jobId`),n=parseInt(e.req.param(`idx`)||`0`,10),r=e.env?.LOOKBOOK_KV;if(!r)return e.notFound();let i=await r.get(`clothing_img:${t}`);if(!i)return e.notFound();let a=[];try{a=JSON.parse(i)}catch{}let o=a[n];if(!o)return e.notFound();let[s,l]=o.split(`,`),u=(s.match(/data:([^;]+)/)||[])[1]||`image/jpeg`,d=atob(l),f=new Uint8Array(d.length);for(let e=0;e<d.length;e++)f[e]=d.charCodeAt(e);return new Response(f.buffer,{headers:{"Content-Type":u,"Cache-Control":`public, max-age=3600`}})});var Q=e=>({Authorization:`Bearer ${e}`,"Content-Type":`application/json`}),Kt=`https://api.openai.com`;async function qt(e,t,n){let r=`${Kt}/v1/chat/completions`;try{let i=await fetch(r,{method:`POST`,headers:{Authorization:`Bearer ${e}`,"Content-Type":`application/json`},body:JSON.stringify({model:`gpt-4o-mini`,messages:[{role:`user`,content:[{type:`image_url`,image_url:{url:t.startsWith(`data:`)?t:`data:image/jpeg;base64,${t}`}},{type:`text`,text:n}]}]})}),a=await i.text();if(console.log(`openaiChatVision: POST ${r} → HTTP ${i.status} | body(첫 500자): ${a.slice(0,500)}`),!i.ok)return console.error(`openaiChatVision: 요청 실패 (HTTP ${i.status})`),null;let o;try{o=JSON.parse(a)}catch{return console.error(`openaiChatVision: JSON 파싱 실패, 원문:`,a.slice(0,300)),null}let s=o?.choices?.[0]?.message?.content;return typeof s==`string`?s:(console.warn(`openaiChatVision: 예상치 못한 응답 형식:`,JSON.stringify(o).slice(0,300)),null)}catch(e){return console.error(`openaiChatVision error:`,e?.message||e),null}}V.get(`/api/presets/models`,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB,r;r=t?await K(t):n?await wt(n):J.map(e=>({id:e.id,name:e.name,desc:e.desc,createdAt:e.createdAt}));let i=r.map(e=>({id:Number(e.id),name:e.name,gender:e.gender||`미분류`,age:e.age||`미분류`,mood:e.mood||`미분류`,body:`-`,skin:`-`,desc:e.desc,unsplashId:null,isCustom:!0,customId:e.id}));return e.json({models:i})}),V.get(`/api/presets/backgrounds`,async e=>{let t=e.env?.LOOKBOOK_KV,n=e.env?.LOOKBOOK_DB,r;r=t?await q(t):n?await Ot(n):Y.map(e=>({id:e.id,name:e.name,bgDesc:e.bgDesc,category:e.category,createdAt:e.createdAt,isDefault:!!e.isDefault}));let i=r.map(e=>({id:Number(e.id),name:e.name,category:e.category,mood:`-`,bgDesc:e.bgDesc,unsplashId:null,isCustom:!0,customId:e.id,isDefault:!!e.isDefault}));return e.json({backgrounds:i})});var Jt=`home_showcase_images`,Yt=[1,2,3,4,5,6];async function Xt(e){let t=await e.get(Jt);if(!t)return[];try{return JSON.parse(t)}catch{return[]}}async function Zt(e,t){await e.put(Jt,JSON.stringify(t))}V.get(`/api/home/showcase`,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({images:[]});let n=await Xt(t);return e.json({images:n.map(e=>({id:e.id,imageBase64:e.imageBase64}))})}),V.get(`/api/admin/home-showcase`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=await Xt(t);return e.json({success:!0,images:n})}),V.post(`/api/admin/home-showcase`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);try{let n=await e.req.json(),r=Array.isArray(n?.images)?n.images:[];if(!r.length)return e.json({success:!1,message:`이미지가 필요합니다.`},400);let i=await Xt(t),a=r.map(e=>({id:crypto.randomUUID(),imageBase64:e,createdAt:new Date().toISOString()})),o=[...i,...a];return await Zt(t,o),e.json({success:!0,count:a.length,images:o})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/admin/home-showcase/:id`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=e.req.param(`id`);return await Zt(t,(await Xt(t)).filter(e=>e.id!==n)),e.json({success:!0})});async function Qt(e,t){return await e.get(`home_feature_bg_${t}`)}V.get(`/api/home/feature-bgs`,async e=>{let t=e.env?.LOOKBOOK_KV,n={};if(t)for(let e of Yt)n[e]=await Qt(t,e);else Yt.forEach(e=>{n[e]=null});return e.json({backgrounds:n})}),V.put(`/api/admin/home-feature-bg/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));if(!Yt.includes(n))return e.json({success:!1,message:`잘못된 슬롯`},400);try{let r=(await e.req.json())?.imageBase64||``;return r?(await t.put(`home_feature_bg_${n}`,r),e.json({success:!0})):e.json({success:!1,message:`imageBase64 필수`},400)}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/admin/home-feature-bg/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));return Yt.includes(n)?(await t.delete(`home_feature_bg_${n}`),e.json({success:!0})):e.json({success:!1,message:`잘못된 슬롯`},400)});var $t=[1],en=22*1024*1024;V.get(`/api/home/howto-videos`,async e=>{let t=e.env?.LOOKBOOK_KV,n={};if(t)for(let e of $t)n[e]=(await t.getWithMetadata(`home_howto_video_${e}`)).value==null?null:`/api/home/howto-video/${e}`;else $t.forEach(e=>{n[e]=null});return e.json({videos:n})}),V.get(`/api/home/howto-video/:slot`,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.notFound();let n=Number(e.req.param(`slot`));if(!$t.includes(n))return e.notFound();let{value:r,metadata:i}=await t.getWithMetadata(`home_howto_video_${n}`,`arrayBuffer`);if(!r)return e.notFound();let a=r,o=i?.contentType||`video/mp4`,s=a.byteLength,l=e.req.header(`range`);if(l){let e=l.match(/bytes=(\d*)-(\d*)/);if(e){let t=e[1]?parseInt(e[1],10):0,n=e[2]?parseInt(e[2],10):s-1,r=Math.max(0,Math.min(t,s-1)),i=Math.max(r,Math.min(n,s-1)),l=a.slice(r,i+1);return new Response(l,{status:206,headers:{"Content-Type":o,"Content-Range":`bytes ${r}-${i}/${s}`,"Accept-Ranges":`bytes`,"Content-Length":String(l.byteLength),"Cache-Control":`public, max-age=3600`}})}}return new Response(a,{headers:{"Content-Type":o,"Accept-Ranges":`bytes`,"Cache-Control":`public, max-age=3600`,"Content-Length":String(s)}})}),V.put(`/api/admin/home-howto-video/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));if(!$t.includes(n))return e.json({success:!1,message:`잘못된 슬롯`},400);try{let r=await e.req.arrayBuffer();if(!r||r.byteLength===0)return e.json({success:!1,message:`영상 파일이 필요합니다.`},400);if(r.byteLength>en)return e.json({success:!1,message:`영상 용량은 ${Math.floor(en/1024/1024)}MB 이하만 가능합니다.`},400);let i=e.req.header(`content-type`)||`video/mp4`;return await t.put(`home_howto_video_${n}`,r,{metadata:{contentType:i}}),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/admin/home-howto-video/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));return $t.includes(n)?(await t.delete(`home_howto_video_${n}`),e.json({success:!0})):e.json({success:!1,message:`잘못된 슬롯`},400)});var tn=[1,2,3,4,5],nn=22*1024*1024;V.get(`/api/gen-loading-videos`,async e=>{let t=e.env?.LOOKBOOK_KV,n={};if(t)for(let e of tn)n[e]=(await t.getWithMetadata(`gen_loading_video_${e}`)).value==null?null:`/api/gen-loading-video/${e}`;else tn.forEach(e=>{n[e]=null});return e.json({videos:n})}),V.get(`/api/gen-loading-video/:slot`,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.notFound();let n=Number(e.req.param(`slot`));if(!tn.includes(n))return e.notFound();let{value:r,metadata:i}=await t.getWithMetadata(`gen_loading_video_${n}`,`arrayBuffer`);if(!r)return e.notFound();let a=r,o=i?.contentType||`video/mp4`,s=a.byteLength,l=e.req.header(`range`);if(l){let e=l.match(/bytes=(\d*)-(\d*)/);if(e){let t=e[1]?parseInt(e[1],10):0,n=e[2]?parseInt(e[2],10):s-1,r=Math.max(0,Math.min(t,s-1)),i=Math.max(r,Math.min(n,s-1)),l=a.slice(r,i+1);return new Response(l,{status:206,headers:{"Content-Type":o,"Content-Range":`bytes ${r}-${i}/${s}`,"Accept-Ranges":`bytes`,"Content-Length":String(l.byteLength),"Cache-Control":`public, max-age=3600`}})}}return new Response(a,{headers:{"Content-Type":o,"Accept-Ranges":`bytes`,"Cache-Control":`public, max-age=3600`,"Content-Length":String(s)}})}),V.put(`/api/admin/gen-loading-video/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));if(!tn.includes(n))return e.json({success:!1,message:`잘못된 슬롯`},400);try{let r=await e.req.arrayBuffer();if(!r||r.byteLength===0)return e.json({success:!1,message:`영상 파일이 필요합니다.`},400);if(r.byteLength>nn)return e.json({success:!1,message:`영상 용량은 ${Math.floor(nn/1024/1024)}MB 이하만 가능합니다.`},400);let i=e.req.header(`content-type`)||`video/mp4`;return await t.put(`gen_loading_video_${n}`,r,{metadata:{contentType:i}}),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/admin/gen-loading-video/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));return tn.includes(n)?(await t.delete(`gen_loading_video_${n}`),e.json({success:!0})):e.json({success:!1,message:`잘못된 슬롯`},400)});var rn=[1,2,3,4,5],an=8*1024*1024;V.get(`/api/gc-loading-images`,async e=>{let t=e.env?.LOOKBOOK_KV,n={};if(t)for(let e of rn)n[e]=(await t.getWithMetadata(`gc_loading_image_${e}`)).value==null?null:`/api/gc-loading-image/${e}`;else rn.forEach(e=>{n[e]=null});return e.json({images:n})}),V.get(`/api/gc-loading-image/:slot`,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.notFound();let n=Number(e.req.param(`slot`));if(!rn.includes(n))return e.notFound();let{value:r,metadata:i}=await t.getWithMetadata(`gc_loading_image_${n}`,`arrayBuffer`);if(!r)return e.notFound();let a=r,o=i?.contentType||`image/jpeg`;return new Response(a,{headers:{"Content-Type":o,"Cache-Control":`public, max-age=3600`,"Content-Length":String(a.byteLength)}})}),V.put(`/api/admin/gc-loading-image/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));if(!rn.includes(n))return e.json({success:!1,message:`잘못된 슬롯`},400);try{let r=await e.req.arrayBuffer();if(!r||r.byteLength===0)return e.json({success:!1,message:`이미지 파일이 필요합니다.`},400);if(r.byteLength>an)return e.json({success:!1,message:`이미지 용량은 ${Math.floor(an/1024/1024)}MB 이하만 가능합니다.`},400);let i=e.req.header(`content-type`)||`image/jpeg`;return await t.put(`gc_loading_image_${n}`,r,{metadata:{contentType:i}}),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/admin/gc-loading-image/:slot`,W,async e=>{let t=e.env?.LOOKBOOK_KV;if(!t)return e.json({success:!1,message:`KV 미설정`},500);let n=Number(e.req.param(`slot`));return rn.includes(n)?(await t.delete(`gc_loading_image_${n}`),e.json({success:!0})):e.json({success:!1,message:`잘못된 슬롯`},400)});var on=`fashion_news_cache_v1`,sn=1200*1e3;function cn(e){let t=e.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);return(t?t[1]:e).replace(/&amp;/g,`&`).replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&#39;/g,`'`).replace(/&quot;/g,`"`).trim()}function ln(e){let t=[],n=e.match(/<item>[\s\S]*?<\/item>/g)||[];for(let e of n){let n=e.match(/<title>([\s\S]*?)<\/title>/),r=e.match(/<link>([\s\S]*?)<\/link>/),i=e.match(/<source[^>]*>([\s\S]*?)<\/source>/),a=e.match(/<pubDate>([\s\S]*?)<\/pubDate>/);if(!n||!r)continue;let o=cn(n[1]),s=i?cn(i[1]):``;if(s){let e=` - `+s;o.endsWith(e)&&(o=o.slice(0,-e.length).trim())}t.push({title:o,link:cn(r[1]),source:s,pubDate:a?cn(a[1]):``})}return t.slice(0,12)}V.get(`/api/fashion-news`,async e=>{let t=e.env?.LOOKBOOK_KV;async function n(){if(!t)return null;let e=await t.get(on);if(!e)return null;try{return JSON.parse(e).news||null}catch{return null}}try{if(t){let n=await t.get(on);if(n){let t=JSON.parse(n);if(Date.now()-t.fetchedAt<sn)return e.json({news:t.news})}}let r=await fetch(`https://news.google.com/rss/search?q=%ED%8C%A8%EC%85%98&hl=ko&gl=KR&ceid=KR:ko`,{headers:{"User-Agent":`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36`,Accept:`application/rss+xml, application/xml, text/xml, */*`,"Accept-Language":`ko-KR,ko;q=0.9`}});if(!r.ok)throw Error(`RSS fetch failed: ${r.status}`);let i=await r.text(),a=ln(i);if(a.length===0){let t=await n();return t&&t.length>0?e.json({news:t}):(console.warn(`fashion-news: RSS 응답에서 기사 파싱 실패 (item 0개)`),e.json({news:[],_debug:{httpStatus:r.status,xmlLength:i.length,hasItemTag:i.includes(`<item>`),hasRssTag:i.includes(`<rss`),preview:i.slice(0,500)}}))}return t&&await t.put(on,JSON.stringify({fetchedAt:Date.now(),news:a})),e.json({news:a})}catch(t){console.warn(`fashion-news fetch error:`,t.message);let r=await n();return r&&r.length>0?e.json({news:r}):e.json({news:[],_debug:{error:t.message}})}}),V.get(`/api/proxy/model-image/:id`,e=>e.notFound()),V.get(`/api/proxy/bg-image/:id`,e=>e.notFound()),V.get(`/api/proxy/gen-image`,async e=>{let t=e.req.query(`url`),n=e.req.query(`download`)===`1`;if(!t)return e.json({error:`Missing url param`},400);try{if(!new URL(t).protocol.startsWith(`https`))return e.json({error:`Only HTTPS URLs allowed`},400);let r=e.req.header(`Range`),i={"User-Agent":`Mozilla/5.0 (compatible; LookbookAI/1.0)`};r&&(i.Range=r);let a=await fetch(t,{headers:i});if(!a.ok&&a.status!==206)return e.json({error:`Upstream error: ${a.status}`},a.status);let o=a.headers.get(`Content-Type`)||`image/jpeg`,s=o.includes(`video`)?`mp4`:`jpg`,l=`lookbook_ai_${Date.now()}.${s}`,u={"Content-Type":o,"Cache-Control":`public, max-age=3600`,"Access-Control-Allow-Origin":`*`,"Accept-Ranges":`bytes`},d=a.headers.get(`Content-Range`);d&&(u[`Content-Range`]=d);let f=a.headers.get(`Content-Length`);return f&&(u[`Content-Length`]=f),n&&(u[`Content-Disposition`]=`attachment; filename="${l}"`),new Response(a.body,{status:a.status,headers:u})}catch(t){return console.error(`Gen image proxy error:`,t),e.json({error:t.message},500)}});var un=[{id:`p1`,name:`2024 S/S 룩북`,status:`done`,images:8,created:`2024-03-15`,thumb_color:`#FF6B9D`},{id:`p2`,name:`캐주얼 티셔츠 컷`,status:`done`,images:4,created:`2024-03-12`,thumb_color:`#6C47FF`},{id:`p3`,name:`데님 라인 촬영`,status:`processing`,images:0,created:`2024-03-10`,thumb_color:`#3B82F6`},{id:`p4`,name:`원피스 봄 컬렉션`,status:`draft`,images:0,created:`2024-03-08`,thumb_color:`#00D4AA`}];V.get(`/api/projects`,e=>e.json({projects:un}));function dn(e){let t=(e||``).toUpperCase();return t===`KR`||!t?{locale:`ko`,currency:`KRW`,pg:`nicepay`,messenger:`kakao`}:t===`JP`?{locale:`ja`,currency:`JPY`,pg:`stripe`,messenger:`line`}:{locale:`en`,currency:`USD`,pg:`stripe`,messenger:`web-share`}}V.get(`/api/locale`,async e=>{let t=(e.req.header(`CF-IPCountry`)??e.req.header(`cf-ipcountry`)??e.req.raw.cf?.country??``).toUpperCase(),n=e.req.header(`X-Session-Token`)||``;if(n){let r=await e.env.LOOKBOOK_DB.prepare(`SELECT u.locale, u.country, u.currency FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(r?.locale)return e.json({country:r.country||t,locale:r.locale,currency:r.currency||`USD`,pg:r.locale===`ko`?`nicepay`:`stripe`,messenger:r.locale===`ko`?`kakao`:r.locale===`ja`?`line`:`web-share`})}let r=dn(t);return e.json({country:t,...r})}),V.put(`/api/user/locale`,async e=>{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({success:!1,message:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({success:!1,message:`세션이 만료되었습니다.`},401);let i=await e.req.json(),a=[`ko`,`en`,`ja`].includes(i?.locale)?i.locale:null;if(!a)return e.json({success:!1,message:`지원하지 않는 언어입니다.`},400);let o=typeof i?.country==`string`?i.country.slice(0,8):null,s=typeof i?.currency==`string`?i.currency.slice(0,8):null;return await t.prepare(`UPDATE users SET locale = ?, country = ?, currency = ?, updated_at = datetime('now') WHERE id = ?`).bind(a,o,s,r.user_id).run(),e.json({success:!0})}),V.get(`/api/config/kakao-js-key`,e=>e.json({key:e.env.KAKAO_JS_KEY||``}));function fn(){let e=new Uint8Array(32);return crypto.getRandomValues(e),Array.from(e).map(e=>e.toString(16).padStart(2,`0`)).join(``)}function pn(){return`u_`+fn().substring(0,16)}async function mn(e){let t=fn().substring(0,16),n=new TextEncoder().encode(t+e),r=await crypto.subtle.digest(`SHA-256`,n);return`${t}:${Array.from(new Uint8Array(r)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}`}async function hn(e,t){let[n,r]=t.split(`:`),i=new TextEncoder().encode(n+e),a=await crypto.subtle.digest(`SHA-256`,i);return Array.from(new Uint8Array(a)).map(e=>e.toString(16).padStart(2,`0`)).join(``)===r}async function gn(e,t){if(!t)return null;let n=new Date().toISOString();return await e.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.status, u.credits, u.avatar_url, u.provider, u.referrer
    FROM user_sessions s JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.status = 'active'
  `).bind(t,n).first()||null}async function _n(e,t){let n=fn(),r=new Date(Date.now()+720*60*60*1e3).toISOString();return await e.prepare(`DELETE FROM user_sessions WHERE user_id = ? AND token NOT IN (
    SELECT token FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 4
  )`).bind(t,t).run(),await e.prepare(`INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).bind(n,t,r).run(),n}function vn(e){return{id:e.id,name:e.name,email:e.email,role:e.role,credits:e.credits,avatar_url:e.avatar_url,provider:e.provider,referrer:e.referrer??null}}var yn=[`BFM회원`,`코오롱 FnC`,`한섬`],bn=500,xn={BFM회원:.2};V.post(`/api/auth/signup`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await e.req.json(),{name:r,email:i,password:a,agreeMarketing:o}=n,s=yn.includes(n?.referrer)?n.referrer:null;if(!r||!i||!a)return e.json({success:!1,message:`모든 항목을 입력해주세요.`},400);if(a.length<8)return e.json({success:!1,message:`비밀번호는 8자 이상이어야 합니다.`},400);if(await t.prepare(`SELECT id FROM users WHERE email = ?`).bind(i).first())return e.json({success:!1,message:`이미 가입된 이메일입니다.`},409);let l=pn(),u=await mn(a),d=+!!o,f=s===`BFM회원`?bn:200;await t.prepare(`
      INSERT INTO users (id, email, name, password_hash, provider, status, credits, role, agree_marketing, referrer)
      VALUES (?, ?, ?, ?, 'email', 'active', ?, 'user', ?, ?)
    `).bind(l,i.toLowerCase(),r,u,f,d,s).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'grant', ?, ?, 'signup_bonus', ?)`).bind(l,f,f,`signup_${l}`).run();let p=await _n(t,l),m={id:l,name:r,email:i.toLowerCase(),role:`user`,credits:f,avatar_url:null,provider:`email`,referrer:s};return e.json({success:!0,user:m,token:p})}catch(t){return console.error(`signup error:`,t),e.json({success:!1,message:`서버 오류가 발생했습니다.`},500)}}),V.post(`/api/auth/login`,async e=>{try{let t=e.env.LOOKBOOK_DB,{email:n,password:r}=await e.req.json();if(!n||!r)return e.json({success:!1,message:`이메일과 비밀번호를 입력해주세요.`},400);let i=await t.prepare(`SELECT * FROM users WHERE email = ? AND provider = 'email'`).bind(n.toLowerCase()).first();if(!i)return e.json({success:!1,message:`이메일 또는 비밀번호가 올바르지 않습니다.`},401);if(i.status!==`active`)return e.json({success:!1,message:`정지된 계정입니다. 관리자에게 문의하세요.`},403);if(!i.password_hash)return e.json({success:!1,message:`소셜 계정으로 가입된 이메일입니다.`},400);if(!await hn(r,i.password_hash))return e.json({success:!1,message:`이메일 또는 비밀번호가 올바르지 않습니다.`},401);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(i.id).run();let a=await _n(t,i.id);return e.json({success:!0,user:vn(i),token:a})}catch(t){return console.error(`login error:`,t),e.json({success:!1,message:`서버 오류가 발생했습니다.`},500)}}),V.get(`/api/auth/me`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await gn(t,e.req.header(`X-Session-Token`)||e.req.query(`token`)||null);return n?e.json({success:!0,user:vn(n)}):e.json({success:!1,message:`로그인이 필요합니다.`},401)}catch{return e.json({success:!1,message:`서버 오류`},500)}}),V.post(`/api/auth/logout`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`);return n&&await t.prepare(`DELETE FROM user_sessions WHERE token = ?`).bind(n).run(),e.json({success:!0})}catch{return e.json({success:!0})}});function $(e){let t=e.req.header(`host`)||e.req.header(`x-forwarded-host`)||``;return`${t.startsWith(`localhost`)?`http`:`https`}://${t}`}V.get(`/api/auth/kakao`,e=>{let t=$(e),n=e.req.query(`mode`)||`popup`,r=`${t}/api/auth/kakao/callback`,i=e.env.KAKAO_CLIENT_ID||``;if(!i)return n===`redirect`?e.redirect(`/?oauth_error=kakao_no_key`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'카카오 앱 키가 설정되지 않았습니다.'},'*');window.close();<\/script>`);let a=`https://kauth.kakao.com/oauth/authorize?client_id=${i}&redirect_uri=${encodeURIComponent(r)}&response_type=code&state=${n}&scope=phone_number`;return e.redirect(a)}),V.get(`/api/auth/kakao/callback`,async e=>{let t=e.env.LOOKBOOK_DB,n=$(e),r=e.req.query(`code`),i=e.req.query(`error`),a=e.req.query(`state`)||`popup`;function o(t){return a===`redirect`?e.redirect(`/?oauth_error=${encodeURIComponent(t)}`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'kakao',error:'${t}'},'*');window.close();<\/script>`)}if(i||!r)return o(i||`cancelled`);try{let i=`${n}/api/auth/kakao/callback`,o=await(await fetch(`https://kauth.kakao.com/oauth/token`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:new URLSearchParams({grant_type:`authorization_code`,code:r,client_id:e.env.KAKAO_CLIENT_ID||``,client_secret:e.env.KAKAO_CLIENT_SECRET||``,redirect_uri:i})})).json();if(!o.access_token)throw Error(`카카오 토큰 발급 실패`);let s=await(await fetch(`https://kapi.kakao.com/v2/user/me`,{headers:{Authorization:`Bearer ${o.access_token}`}})).json(),l=String(s.id),u=s.kakao_account?.email||`kakao_${l}@kakao.local`,d=s.kakao_account?.profile?.nickname||`카카오 사용자`,f=s.kakao_account?.profile?.profile_image_url||null,p=s.kakao_account?.phone_number||null,m=!1,h=await t.prepare(`SELECT * FROM users WHERE provider = 'kakao' AND provider_id = ?`).bind(l).first();if(h)p&&h.phone_number!==p&&(await t.prepare(`UPDATE users SET phone_number = ? WHERE id = ?`).bind(p,h.id).run(),h.phone_number=p);else if(h=await t.prepare(`SELECT * FROM users WHERE email = ?`).bind(u).first(),h)await t.prepare(`UPDATE users SET provider_id = ?, avatar_url = ?, phone_number = COALESCE(?, phone_number) WHERE id = ?`).bind(l,f,p,h.id).run();else{let e=pn();await t.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, phone_number, status, credits, role) VALUES (?, ?, ?, 'kakao', ?, ?, ?, 'active', 200, 'user')`).bind(e,u,d,l,f,p).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
           VALUES (?, 'grant', 200, 200, 'signup_bonus', ?)`).bind(e,`signup_${e}`).run(),h=await t.prepare(`SELECT * FROM users WHERE id = ?`).bind(e).first(),m=!0}if(!h||h.status!==`active`)throw Error(`계정이 정지 상태입니다.`);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(h.id).run();let g=await _n(t,h.id),_=JSON.stringify(vn(h));return a===`redirect`?e.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 이동합니다...</p>
<script>
(function(){
  var payload = {type:'oauth_success',provider:'kakao',token:'${g}',user:${_},isNewUser:${m}};
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
  var payload = {type:'oauth_success',provider:'kakao',token:'${g}',user:${_},isNewUser:${m}};
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
</body></html>`)}catch(e){return console.error(`kakao callback error:`,e),o(e.message||`로그인 오류`)}}),V.get(`/api/auth/google`,e=>{let t=$(e),n=e.req.query(`mode`)||`popup`,r=`${t}/api/auth/google/callback`,i=e.env.GOOGLE_CLIENT_ID||``;if(!i)return n===`redirect`?e.redirect(`/?oauth_error=google_no_key`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'구글 클라이언트 ID가 설정되지 않았습니다.'},'*');window.close();<\/script>`);let a=new URLSearchParams({client_id:i,redirect_uri:r,response_type:`code`,scope:`openid email profile`,access_type:`offline`,prompt:`select_account`,state:n});return e.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${a}`)}),V.get(`/api/auth/google/callback`,async e=>{let t=e.env.LOOKBOOK_DB,n=$(e),r=e.req.query(`code`),i=e.req.query(`error`),a=e.req.query(`state`)||`popup`;function o(t){return a===`redirect`?e.redirect(`/?oauth_error=${encodeURIComponent(t)}`):e.html(`<script>window.opener?.postMessage({type:'oauth_error',provider:'google',error:'${t}'},'*');window.close();<\/script>`)}if(i||!r)return o(i||`cancelled`);try{let i=`${n}/api/auth/google/callback`,o=await(await fetch(`https://oauth2.googleapis.com/token`,{method:`POST`,headers:{"Content-Type":`application/x-www-form-urlencoded`},body:new URLSearchParams({grant_type:`authorization_code`,code:r,client_id:e.env.GOOGLE_CLIENT_ID||``,client_secret:e.env.GOOGLE_CLIENT_SECRET||``,redirect_uri:i})})).json();if(!o.access_token)throw Error(`구글 토큰 발급 실패`);let s=await(await fetch(`https://www.googleapis.com/oauth2/v2/userinfo`,{headers:{Authorization:`Bearer ${o.access_token}`}})).json(),l=s.id,u=s.email,d=s.name||`구글 사용자`,f=s.picture||null,p=!1,m=await t.prepare(`SELECT * FROM users WHERE provider = 'google' AND provider_id = ?`).bind(l).first();if(!m)if(m=await t.prepare(`SELECT * FROM users WHERE email = ?`).bind(u).first(),m)await t.prepare(`UPDATE users SET provider_id = ?, avatar_url = ? WHERE id = ?`).bind(l,f,m.id).run();else{let e=pn();await t.prepare(`INSERT INTO users (id, email, name, provider, provider_id, avatar_url, status, credits, role) VALUES (?, ?, ?, 'google', ?, ?, 'active', 200, 'user')`).bind(e,u,d,l,f).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
           VALUES (?, 'grant', 200, 200, 'signup_bonus', ?)`).bind(e,`signup_${e}`).run(),m=await t.prepare(`SELECT * FROM users WHERE id = ?`).bind(e).first(),p=!0}if(!m||m.status!==`active`)throw Error(`계정이 정지 상태입니다.`);await t.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).bind(m.id).run();let h=await _n(t,m.id),g=JSON.stringify(vn(m));return a===`redirect`?e.html(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>로그인 성공</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body>
<p style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">✅ 로그인 성공! 잠시 이동합니다...</p>
<script>
(function(){
  var payload = {type:'oauth_success',provider:'google',token:'${h}',user:${g},isNewUser:${p}};
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
  var payload = {type:'oauth_success',provider:'google',token:'${h}',user:${g},isNewUser:${p}};
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
</body></html>`)}catch(e){return console.error(`google callback error:`,e),o(e.message||`로그인 오류`)}}),V.get(`/api/admin/users`,W,async e=>{try{let t=e.env.LOOKBOOK_DB,n=parseInt(e.req.query(`page`)||`1`),r=parseInt(e.req.query(`limit`)||`50`),i=e.req.query(`search`)||``,a=e.req.query(`status`)||``,o=(n-1)*r,s=`WHERE 1=1`,l=[];i&&(s+=` AND (name LIKE ? OR email LIKE ?)`,l.push(`%${i}%`,`%${i}%`)),a&&(s+=` AND status = ?`,l.push(a));let u=await t.prepare(`SELECT COUNT(*) as cnt FROM users ${s}`).bind(...l).first(),d=await t.prepare(`SELECT id, name, email, provider, provider_id, avatar_url, phone_number, status, credits, role, referrer, last_login_at, created_at FROM users ${s} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...l,r,o).all();return e.json({success:!0,users:d.results,total:u?.cnt||0,page:n,limit:r})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/admin/users/:id`,W,async e=>{try{let t=await e.env.LOOKBOOK_DB.prepare(`SELECT id, name, email, provider, provider_id, avatar_url, phone_number, status, credits, role, referrer, last_login_at, created_at FROM users WHERE id = ?`).bind(e.req.param(`id`)).first();return t?e.json({success:!0,user:t}):e.json({success:!1,message:`존재하지 않는 사용자입니다.`},404)}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/admin/users/:id/payments`,W,async e=>{try{let t=await e.env.LOOKBOOK_DB.prepare(`SELECT order_id, amount, credits, status, pg_provider, currency, pg_method, created_at, paid_at
       FROM payment_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`).bind(e.req.param(`id`)).all();return e.json({success:!0,payments:t.results})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/admin/users/:id/generations`,W,async e=>{try{let t=await e.env.LOOKBOOK_DB.prepare(`SELECT id, job_id, image_count, model_name, bg_name, kind, video_url, created_at
       FROM generation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`).bind(e.req.param(`id`)).all();return e.json({success:!0,generations:t.results})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.patch(`/api/admin/users/:id`,W,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await e.req.json(),r=e.req.param(`id`),i=[],a=[];if(n.status!==void 0&&(i.push(`status = ?`),a.push(n.status)),n.role!==void 0&&(i.push(`role = ?`),a.push(n.role)),n.add_credits!==void 0){let o=(await t.prepare(`SELECT credits FROM users WHERE id = ?`).bind(r).first())?.credits??0,s=parseInt(n.add_credits),l=Math.max(0,o+s);return i.push(`credits = ?`),a.push(l),i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'grant', ?, ?, 'admin_grant', ?)`).bind(r,s,l,`admin_${Date.now()}`).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0,newCredits:l})}if(n.credits!==void 0){let o=(await t.prepare(`SELECT credits FROM users WHERE id = ?`).bind(r).first())?.credits??0,s=parseInt(n.credits),l=s-o;return i.push(`credits = ?`),a.push(s),i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),l!==0&&await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
           VALUES (?, ?, ?, ?, 'admin_set', ?)`).bind(r,l>0?`grant`:`deduct`,l,s,`admin_${Date.now()}`).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0,newCredits:s})}return i.length===0?e.json({success:!1,message:`변경할 항목이 없습니다.`},400):(i.push(`updated_at = datetime('now')`),await t.prepare(`UPDATE users SET ${i.join(`, `)} WHERE id = ?`).bind(...a,r).run(),n.status===`suspended`&&await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(r).run(),e.json({success:!0}))}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/admin/users/:id`,W,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.param(`id`);return await t.prepare(`UPDATE users SET status = 'deleted', updated_at = datetime('now') WHERE id = ?`).bind(n).run(),await t.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).bind(n).run(),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/admin/stats`,W,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status != 'deleted'`).first(),r=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'active'`).first(),i=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE status = 'suspended'`).first(),a=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE date(created_at) = date('now') AND status != 'deleted'`).first(),o=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'kakao' AND status = 'active'`).first(),s=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'google' AND status = 'active'`).first(),l=await t.prepare(`SELECT COUNT(*) as cnt FROM users WHERE provider = 'email' AND status = 'active'`).first();return e.json({success:!0,stats:{total:n?.cnt||0,active:r?.cnt||0,suspended:i?.cnt||0,today:a?.cnt||0,by_provider:{kakao:o?.cnt||0,google:s?.cnt||0,email:l?.cnt||0}}})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/credits/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT s.user_id, u.credits FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT cl.type, cl.amount, cl.balance, cl.reason, cl.ref_id, cl.created_at,
              p.amount AS krw_amount, p.currency AS pg_currency
       FROM credit_logs cl
       LEFT JOIN payment_logs p ON cl.reason = 'payment' AND cl.ref_id = p.order_id
       WHERE cl.user_id = ?
       ORDER BY cl.created_at DESC, cl.id DESC
       LIMIT 200`).bind(r.user_id).all();return e.json({success:!0,credits:r.credits,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/generation/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i;try{i=await t.prepare(`SELECT id, seq_no, job_id, image_count, model_name, bg_name, ratio,
                image_urls, expires_at, created_at, downloaded_indices, kind, video_url, status
         FROM generation_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 100`).bind(r.user_id).all()}catch{i=await t.prepare(`SELECT id, seq_no, job_id, image_count, model_name, bg_name, ratio,
                image_urls, expires_at, created_at, downloaded_indices, kind, video_url
         FROM generation_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 100`).bind(r.user_id).all()}return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.post(`/api/generation/save-images`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let{job_id:i,image_urls:a}=await e.req.json();if(!i||!a)return e.json({error:`job_id, image_urls 필수`},400);let o=JSON.stringify(Array.isArray(a)?a:[a]),s=new Date(Date.now()+336*60*60*1e3).toISOString().replace(`T`,` `).slice(0,19);return await t.prepare(`UPDATE generation_logs
       SET image_urls = ?, expires_at = datetime('now', '+14 days')
       WHERE job_id = ? AND user_id = ?`).bind(o,i,r.user_id).run(),e.json({success:!0,expires_at:s})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.post(`/api/credits/deduct`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);let r=await t.prepare(`SELECT s.user_id, u.credits, u.name FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`,code:`UNAUTHORIZED`},401);let i=await e.req.json().catch(()=>({})),a=i?.job_id,o=Number.isInteger(i?.idx)?i.idx:void 0,s=null,l=[];if(a){if(s=await t.prepare(`SELECT id, downloaded_indices, model_name FROM generation_logs WHERE job_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`).bind(a,r.user_id).first(),s?.downloaded_indices)try{l=JSON.parse(s.downloaded_indices)}catch{}if(s&&o!==void 0&&l.includes(o))return e.json({success:!0,creditsUsed:0,creditsRemaining:r.credits,alreadyDownloaded:!0})}let u=!!(s?.model_name&&String(s.model_name).startsWith(`고스트컷디테일·`)),d=!!(s?.model_name&&String(s.model_name).startsWith(`고스트컷·`)),f=u?Nn:d?jn:An;if(r.credits<f)return e.json({error:`크레딧이 부족합니다. (보유: ${r.credits}크레딧, 필요: ${f}크레딧)`,code:`INSUFFICIENT_CREDITS`,available:r.credits,required:f},402);let p=r.credits-f;return f>0&&(await t.prepare(`UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?`).bind(p,r.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'deduct', ?, ?, 'image_download', ?)`).bind(r.user_id,-f,p,`dl_${Date.now()}`).run()),s&&o!==void 0&&(l.push(o),await t.prepare(`UPDATE generation_logs SET downloaded_indices = ? WHERE id = ?`).bind(JSON.stringify(l),s.id).run()),console.log(`[Credits] Download deduct: ${r.name} ${r.credits} → ${p} (-${f})`),e.json({success:!0,creditsUsed:f,creditsRemaining:p,alreadyDownloaded:!1})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.delete(`/api/generation/history/:id`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=e.req.param(`id`);return await t.prepare(`DELETE FROM generation_logs WHERE id = ? AND user_id = ?`).bind(i,r.user_id).run(),e.json({success:!0})}catch(t){return e.json({success:!1,message:t.message},500)}});var Sn={pkg_20000:{amount:2e4,credits:1e3,label:`20,000원 → 1,000크레딧`,usdCents:1999,jpyAmount:2980},pkg_40000:{amount:4e4,credits:2300,label:`40,000원 → 2,300크레딧`,usdCents:3499,jpyAmount:4980},pkg_60000:{amount:6e4,credits:4e3,label:`60,000원 → 4,000크레딧`,usdCents:4999,jpyAmount:7980}};V.get(`/api/payments/packages`,e=>e.json({success:!0,packages:Sn})),V.post(`/api/payments/prepare`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT s.user_id, u.name, u.email, u.referrer FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let{packageId:i}=await e.req.json(),a=Sn[i];if(!a)return e.json({error:`잘못된 패키지입니다.`},400);let o=xn[r.referrer]||0,s=o>0?Math.round(a.amount*(1-o)):a.amount,l=await t.prepare(`SELECT order_id FROM payment_logs
       WHERE user_id = ? AND amount = ? AND status = 'pending'
         AND created_at > datetime('now', '-5 minutes')
       ORDER BY created_at DESC LIMIT 1`).bind(r.user_id,s).first();if(l?.order_id)return e.json({success:!0,orderId:l.order_id,amount:s,credits:a.credits,orderName:a.label,customerName:r.name,customerEmail:r.email,clientId:e.env.NICEPAY_CLIENT_ID||``});let u=`lookbook-${r.user_id.slice(0,6)}-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;return await t.prepare(`INSERT INTO payment_logs (user_id, order_id, amount, credits, status)
       VALUES (?, ?, ?, ?, 'pending')`).bind(r.user_id,u,s,a.credits).run(),e.json({success:!0,orderId:u,amount:s,credits:a.credits,orderName:a.label,customerName:r.name,customerEmail:r.email,clientId:e.env.NICEPAY_CLIENT_ID||``})}catch(t){return e.json({success:!1,message:t.message},500)}});async function Cn(e){let t=new TextEncoder().encode(e),n=await crypto.subtle.digest(`SHA-256`,t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function wn(e,t){let n=await crypto.subtle.importKey(`raw`,new TextEncoder().encode(e),{name:`HMAC`,hash:`SHA-256`},!1,[`sign`]),r=await crypto.subtle.sign(`HMAC`,n,new TextEncoder().encode(t));return Array.from(new Uint8Array(r)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}V.post(`/api/stripe/checkout`,async e=>{let t=e.env.STRIPE_SECRET_KEY;if(!t)return e.json({success:!1,message:`서버 설정 오류: STRIPE_SECRET_KEY 미설정`},500);let n=e.env.LOOKBOOK_DB,r=e.req.header(`X-Session-Token`)||``;if(!r)return e.json({error:`로그인이 필요합니다.`},401);let i=await n.prepare(`SELECT s.user_id, u.email, u.referrer FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(r).first();if(!i)return e.json({error:`세션이 만료되었습니다.`},401);try{let{packageId:r,currency:a}=await e.req.json(),o=Sn[r];if(!o)return e.json({error:`잘못된 패키지입니다.`},400);let s=String(a||`USD`).toUpperCase();if(s!==`USD`&&s!==`JPY`)return e.json({error:`지원하지 않는 통화입니다.`},400);let l=s===`USD`?o.usdCents:o.jpyAmount,u=xn[i.referrer]||0,d=u>0?Math.round(l*(1-u)):l,f=`lookbook-${i.user_id.slice(0,6)}-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;await n.prepare(`INSERT INTO payment_logs (user_id, order_id, amount, credits, status, pg_provider, currency)
       VALUES (?, ?, ?, ?, 'pending', 'stripe', ?)`).bind(i.user_id,f,d,o.credits,s).run();let p=new URL(e.req.url).origin,m=new URLSearchParams;m.set(`mode`,`payment`),m.set(`success_url`,`${p}/payment/stripe/return?order_id=${f}`),m.set(`cancel_url`,`${p}/payment/fail`),m.set(`client_reference_id`,f),i.email&&!String(i.email).endsWith(`@kakao.local`)&&m.set(`customer_email`,i.email),m.set(`line_items[0][price_data][currency]`,s.toLowerCase()),m.set(`line_items[0][price_data][product_data][name]`,`${o.label.split(` → `)[1]||o.label} (${o.credits.toLocaleString()} credits)`),m.set(`line_items[0][price_data][product_data][tax_code]`,`txcd_10000000`),m.set(`line_items[0][price_data][unit_amount]`,String(d)),m.set(`line_items[0][quantity]`,`1`),m.set(`metadata[order_id]`,f),m.set(`managed_payments[enabled]`,`false`);let h=await fetch(`https://api.stripe.com/v1/checkout/sessions`,{method:`POST`,headers:{Authorization:`Bearer ${t}`,"Content-Type":`application/x-www-form-urlencoded`},body:m.toString()}),g=await h.json();return h.ok?e.json({success:!0,url:g.url}):(console.error(`Stripe checkout session error:`,g),e.json({success:!1,message:g?.error?.message||`Stripe 결제 세션 생성 실패`},500))}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/payment/stripe/return`,async e=>{let t=e.req.query(`order_id`)||``;return e.redirect(`/payment/success?orderId=${encodeURIComponent(t)}`,302)}),V.post(`/payment/stripe/webhook`,async e=>{let t=e.env.STRIPE_WEBHOOK_SECRET,n=e.env.LOOKBOOK_DB;try{if(!t)throw Error(`STRIPE_WEBHOOK_SECRET 미설정`);let r=e.req.header(`stripe-signature`)||``,i=await e.req.text(),a=Object.fromEntries(r.split(`,`).map(e=>e.split(`=`))),o=a.t,s=a.v1;if(!o||!s)throw Error(`서명 헤더 형식 오류`);if(await wn(t,`${o}.${i}`)!==s)throw Error(`서명 불일치`);let l=JSON.parse(i);if(l.type===`checkout.session.completed`){let e=l.data.object,t=e.client_reference_id||e.metadata?.order_id;if(t){let r=await n.prepare(`SELECT id, user_id, credits, status FROM payment_logs WHERE order_id = ? AND pg_provider = 'stripe'`).bind(t).first();if(r&&r.status===`pending`){await n.prepare(`UPDATE payment_logs SET status='paid', payment_key=?, pg_raw=?, paid_at=datetime('now') WHERE id=?`).bind(e.payment_intent||e.id,JSON.stringify(e),r.id).run();let i=((await n.prepare(`SELECT credits FROM users WHERE id=?`).bind(r.user_id).first())?.credits??0)+r.credits;await n.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(i,r.user_id).run(),await n.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id) VALUES (?, 'grant', ?, ?, 'payment', ?)`).bind(r.user_id,r.credits,i,t).run(),console.log(`[Stripe] Payment completed: ${t} → +${r.credits} credits (user ${r.user_id})`)}}}else if(l.type===`charge.refunded`||l.type===`payment_intent.canceled`){let e=l.data.object,t=e.payment_intent||e.id,r=await n.prepare(`SELECT id, user_id, credits, status FROM payment_logs WHERE payment_key = ? AND pg_provider = 'stripe'`).bind(t).first();if(r&&r.status===`paid`){let e=(await n.prepare(`SELECT credits FROM users WHERE id=?`).bind(r.user_id).first())?.credits??0,i=Math.min(r.credits,e),a=e-i;await n.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(a,r.user_id).run(),await n.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id) VALUES (?, 'deduct', ?, ?, 'payment_refund', ?)`).bind(r.user_id,-i,a,t).run(),await n.prepare(`UPDATE payment_logs SET status='canceled' WHERE id=?`).bind(r.id).run(),console.log(`[Stripe] Refund clawback: ${t} → -${i} credits (user ${r.user_id})`)}}return e.text(`OK`,200)}catch(t){return console.error(`Stripe webhook error:`,t.message),e.text(`Bad Request`,400)}}),V.post(`/payment/return`,async e=>{let t=e.env.LOOKBOOK_DB;try{let n=await e.req.parseBody(),r=String(n.authResultCode||``),i=String(n.authResultMsg||``),a=String(n.tid||``),o=String(n.clientId||``),s=String(n.orderId||``),l=String(n.amount||``),u=String(n.authToken||``),d=String(n.signature||``);if(r!==`0000`)return e.redirect(`/payment/fail?message=${encodeURIComponent(i||`결제 인증에 실패했습니다.`)}&code=${encodeURIComponent(r)}`,302);let f=e.env.NICEPAY_SECRET_KEY||``;if(await Cn(u+o+l+f)!==d)return console.error(`나이스페이먼츠 서명 불일치 — 위변조 의심:`,s),e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EA%B2%80%EC%A6%9D%EC%97%90%20%EC%8B%A4%ED%8C%A8%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302);let p=await t.prepare(`SELECT id, user_id, amount, credits, status FROM payment_logs
       WHERE order_id = ? AND status = 'pending'`).bind(s).first();if(!p)return e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EC%A0%95%EB%B3%B4%EB%A5%BC%20%EC%B0%BE%EC%9D%84%20%EC%88%98%20%EC%97%86%EA%B1%B0%EB%82%98%20%EC%9D%B4%EB%AF%B8%20%EC%B2%98%EB%A6%AC%EB%90%98%EC%97%88%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302);if(Number(l)!==Number(p.amount))return e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EA%B8%88%EC%95%A1%EC%9D%B4%20%EC%9D%BC%EC%B9%98%ED%95%98%EC%A7%80%20%EC%95%8A%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302);let m=e.env.NICEPAY_API_BASE||`https://sandbox-api.nicepay.co.kr`,h=new Date().toISOString(),g=await Cn(a+l+h+f),_=`Basic `+btoa(`${o}:${f}`),v=await fetch(`${m}/v1/payments/${a}`,{method:`POST`,headers:{Authorization:_,"Content-Type":`application/json`},body:JSON.stringify({amount:Number(l),ediDate:h,signData:g})}),y=await v.json();if(!v.ok||y.resultCode!==`0000`)return await t.prepare(`UPDATE payment_logs
         SET status='failed', pg_raw=?, paid_at=datetime('now')
         WHERE order_id=?`).bind(JSON.stringify(y),s).run(),e.redirect(`/payment/fail?message=${encodeURIComponent(y.resultMsg||`결제 승인 실패`)}&code=${encodeURIComponent(y.resultCode||``)}`,302);await t.prepare(`UPDATE payment_logs
       SET status='paid', payment_key=?, pg_method=?, pg_raw=?, paid_at=datetime('now')
       WHERE order_id=?`).bind(y.tid,y.payMethod||``,JSON.stringify(y),s).run();let b=((await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(p.user_id).first())?.credits??0)+Number(p.credits);return await t.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(b,p.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'grant', ?, ?, 'payment', ?)`).bind(p.user_id,p.credits,b,s).run(),e.redirect(`/payment/success?orderId=${encodeURIComponent(s)}`,302)}catch(t){return console.error(`payment/return error:`,t),e.redirect(`/payment/fail?message=%EA%B2%B0%EC%A0%9C%20%EC%B2%98%EB%A6%AC%20%EC%A4%91%20%EC%98%A4%EB%A5%98%EA%B0%80%20%EB%B0%9C%EC%83%9D%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4.`,302)}}),V.post(`/payment/webhook`,async e=>{let t=e.env.LOOKBOOK_DB,n=()=>e.text(`OK`,200,{"Content-Type":`text/html;charset=utf-8`});try{let r=await e.req.text(),i={};try{i=JSON.parse(r)}catch{i=Object.fromEntries(new URLSearchParams(r))}let a=String(i.tid||``),o=String(i.orderId||``),s=String(i.amount||``),l=String(i.ediDate||``),u=String(i.signature||``),d=String(i.status||``),f=String(i.resultCode||``),p=e.env.NICEPAY_SECRET_KEY||``,m=await Cn(a+s+l+p);if(!a||m!==u)return console.error(`나이스페이 웹훅 서명 불일치 — 위변조 의심:`,o,a),n();if(!([`canceled`,`cancelled`,`partialCancelled`,`PARTIAL_CANCELED`].includes(d)||f===`2001`))return n();let h=await t.prepare(`SELECT id, user_id, credits, status FROM payment_logs WHERE order_id = ? OR payment_key = ?`).bind(o,a).first();if(!h)return console.error(`나이스페이 웹훅: 결제 내역을 찾을 수 없음:`,o,a),n();if(h.status===`canceled`)return n();let g=(await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(h.user_id).first())?.credits??0,_=Number(h.credits)||0,v=Math.min(_,g),y=Math.max(0,g-v);return v>0&&(await t.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(y,h.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'revoke', ?, ?, 'payment_cancel', ?)`).bind(h.user_id,-v,y,o).run()),await t.prepare(`UPDATE payment_logs SET status='canceled' WHERE id=?`).bind(h.id).run(),console.log(`나이스페이 웹훅: 결제취소 처리 완료 — orderId=${o}, 회수 크레딧=${v}`),n()}catch(e){return console.error(`payment/webhook error:`,e),n()}}),V.get(`/api/admin/debug/recent-payments`,W,async e=>{let t=e.env.LOOKBOOK_DB;try{let n=await t.prepare(`SELECT p.order_id, p.user_id, u.email, u.name, p.amount, p.credits, p.status,
              p.pg_provider, p.currency, p.created_at, p.paid_at
       FROM payment_logs p
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 30`).all();return e.json({success:!0,payments:n.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.post(`/api/admin/payments/:orderId/force-cancel`,W,async e=>{let t=e.env.LOOKBOOK_DB,n=e.req.param(`orderId`);try{let r=await t.prepare(`SELECT id, user_id, credits, status FROM payment_logs WHERE order_id = ?`).bind(n).first();if(!r)return e.json({success:!1,message:`해당 order_id의 결제 내역을 찾을 수 없습니다.`},404);if(r.status===`canceled`)return e.json({success:!0,message:`이미 취소 처리된 건입니다.`,revokeAmount:0});let i=(await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(r.user_id).first())?.credits??0,a=Number(r.credits)||0,o=Math.min(a,i),s=Math.max(0,i-o);return o>0&&(await t.prepare(`UPDATE users SET credits=?, updated_at=datetime('now') WHERE id=?`).bind(s,r.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
         VALUES (?, 'revoke', ?, ?, 'payment_cancel_manual', ?)`).bind(r.user_id,-o,s,n).run()),await t.prepare(`UPDATE payment_logs SET status='canceled' WHERE id=?`).bind(r.id).run(),console.log(`관리자 수동 결제취소 처리 완료 — orderId=${n}, 회수 크레딧=${o}`),e.json({success:!0,revokeAmount:o,newBalance:s})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/payments/status`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=e.req.query(`orderId`)||``;if(!i)return e.json({error:`orderId 필수`},400);let a=await t.prepare(`SELECT status, credits FROM payment_logs WHERE order_id = ? AND user_id = ?`).bind(i,r.user_id).first();if(!a)return e.json({error:`결제 정보를 찾을 수 없습니다.`},404);if(a.status!==`paid`)return e.json({error:`결제가 완료되지 않았습니다.`,status:a.status},400);let o=await t.prepare(`SELECT credits FROM users WHERE id=?`).bind(r.user_id).first();return e.json({success:!0,credits:a.credits,creditsTotal:o?.credits??0})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/payments/history`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`},401);let r=await t.prepare(`SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`},401);let i=await t.prepare(`SELECT order_id, amount, credits, status, pg_method, created_at, paid_at
       FROM payment_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`).bind(r.user_id).all();return e.json({success:!0,logs:i.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.post(`/api/uploads/image`,async e=>{try{let t=(await e.req.formData()).get(`file`);if(!t)return e.json({success:!1,message:`파일이 없습니다.`},400);let n=await t.arrayBuffer(),r=btoa(String.fromCharCode(...new Uint8Array(n))),i=`data:${t.type||`image/jpeg`};base64,${r}`;return e.json({success:!0,imageId:`img_`+Math.random().toString(36).substr(2,9),url:i,dataUrl:i})}catch(t){return e.json({success:!1,message:t.message},500)}});function Tn(e){return{"1:1":`1:1`,"4:5":`4:5`,"3:4":`3:4`,"9:16":`9:16`}[e]||`9:16`}function En(e){return e===`4K`?`4k`:e===`HD`?`2k`:`1k`}V.post(`/api/clothing/classify`,async e=>{try{let t=(await e.req.json()).images||[];if(t.length===0)return e.json({success:!1,message:`이미지가 없습니다.`},400);await Promise.all(t.map(async({dataUrl:t,index:n})=>{try{let r=[`Analyze this clothing item image and classify it into EXACTLY ONE of these categories:`,`TOP — shirts, t-shirts, blouses, crop tops, hoodies (without coat), sweaters, knits, vests worn as tops`,`BOTTOM — pants, trousers, jeans, skirts, shorts, leggings`,`OUTER — coats, jackets, blazers, cardigans worn as outerwear, parkas, windbreakers, leather jackets, denim jackets`,`DRESS — one-piece dresses, jumpsuits, overalls that cover both top and bottom`,`UNKNOWN — if cannot determine`,`Respond in EXACTLY this JSON format only, no other text:`,`{"category":"TOP","label":"white button-down shirt","confidence":0.95}`].join(` `),i=await(await fetch(`${H}/api/v1/model/generateImage`,{method:`POST`,headers:Q(e.env.ATLAS_API_KEY),body:JSON.stringify({model:`google/nano-banana-2/edit`,prompt:r,images:[t],aspect_ratio:`1:1`,resolution:`1k`,thinking_level:`default`,output_format:`jpeg`})})).json();if(console.log(`Classify atlas response code:`,i.code),i.code===200&&i.data?.id){let t=i.data.id;for(let n=0;n<10;n++){await new Promise(e=>setTimeout(e,1500));let n=(await fetch(`${H}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json())).data?.status;if(n===`completed`||n===`succeeded`||n===`failed`||n===`error`)break}}return{index:n,category:`UNRESOLVED`,label:``,confidence:0}}catch{return{index:n,category:`UNKNOWN`,label:``,confidence:0}}}));let n=await Promise.all(t.map(async({dataUrl:e,index:t})=>Dn(e,t)));return console.log(`Classify results:`,n.map(e=>`[${e.index}]${e.category}`).join(`, `)),e.json({success:!0,items:n})}catch(t){return console.error(`Classify error:`,t),e.json({success:!1,message:t.message},500)}});async function Dn(e,t){try{let n=await(await fetch(`${H}/api/v1/model/generateImage`,{method:`POST`,headers:Q(c.env.ATLAS_API_KEY),body:JSON.stringify({model:`google/nano-banana-2`,prompt:[`CLASSIFICATION TASK. Look at this clothing item.`,`Output ONLY ONE WORD: TOP or BOTTOM or OUTER or DRESS`,`TOP = shirt/tshirt/blouse/sweater/hoodie/knit/vest`,`BOTTOM = pants/jeans/skirt/shorts/leggings`,`OUTER = coat/jacket/blazer/cardigan/parka`,`DRESS = one-piece dress/jumpsuit`].join(` `),images:[e],aspect_ratio:`1:1`,resolution:`1k`,thinking_level:`low`,output_format:`jpeg`})})).json();if(n.code===200&&n.data?.id){let e=n.data.id;for(let t=0;t<8;t++){await new Promise(e=>setTimeout(e,1500));let t=await fetch(`${H}/api/v1/model/prediction/${e}`,{headers:{Authorization:`Bearer ${c.env.ATLAS_API_KEY}`}}).then(e=>e.json());if(t.data?.status===`completed`||t.data?.status===`succeeded`||t.data?.status===`failed`||t.data?.status===`error`)break}}let r=e.split(`,`)[1]||``;return Math.floor(r.length*.75),{index:t,category:`TOP`,label:`clothing item`,confidence:.5}}catch{return{index:t,category:`TOP`,label:`clothing item`,confidence:.3}}}function On(e,t){let n=[];return e.forEach((e,r)=>{let i=t+r,a={TOP:`TOP GARMENT (shirt/blouse/sweater/jacket-top)`,BOTTOM:`BOTTOM GARMENT (pants/skirt/shorts)`,OUTER:`OUTER LAYER (coat/jacket/cardigan)`,DRESS:`FULL OUTFIT (dress/jumpsuit — covers both top and bottom)`,UNKNOWN:`CLOTHING ITEM`}[e.category]||`CLOTHING ITEM`;n.push(`Image ${i} = ${a}${e.label?` — ${e.label}`:``}.`)}),n.push(`Clothing reference images may show the garment worn by a person (a lifestyle/model photo), on a hanger, or laid flat, possibly with a full outfit (top+bottom) visible together even if only one piece is being used. Whatever the source, extract ONLY the specified garment piece itself (fabric, color, pattern, cut, texture, design details). COMPLETELY IGNORE AND DISCARD everything else from every clothing image: its background/room/street/setting, AND if a person is wearing it, that person's face, body shape, pose, stance, and any other garment they have on. None of that — background, person, face, pose — may appear in or influence the final output in any way. Clothing images are a texture/design source ONLY, never a pose or scene reference.`),n.join(` `)}function kn(e,t){let n=[],r=e.map(e=>e.category),i=r.includes(`DRESS`),a=r.includes(`TOP`),o=r.includes(`BOTTOM`),s=r.includes(`OUTER`);if(i){let r=e.findIndex(e=>e.category===`DRESS`);n.push(`Replace the ENTIRE outfit (top and bottom) with Image ${t+r}'s full dress/jumpsuit. Reproduce every design detail exactly.`)}else{if(a){let r=e.findIndex(e=>e.category===`TOP`);n.push(`Replace ONLY the TOP garment with Image ${t+r}'s item. Exact color, pattern, texture, neckline, sleeve length.`)}if(o){let r=e.findIndex(e=>e.category===`BOTTOM`);n.push(`Replace ONLY the BOTTOM garment with Image ${t+r}'s item. Exact color, pattern, waistband, length, cut.`)}if(s){let r=e.findIndex(e=>e.category===`OUTER`);n.push(`Add/replace the OUTER LAYER (coat/jacket) with Image ${t+r}'s item worn over the other clothing. Exact lapels, buttons, length.`)}}return i||(a||n.push(`Keep the original TOP garment EXACTLY unchanged — do NOT modify it.`),o||n.push(`Keep the original BOTTOM garment EXACTLY unchanged — do NOT modify it.`),s||n.push(`Remove any outer layer if present, or keep it minimal.`)),n.join(` `)}var An=90,jn=70,Mn=600,Nn=60;async function Pn(e,t){let n;try{n=await e.prepare(`SELECT user_id, status FROM generation_logs WHERE job_id = ?`).bind(t).first()}catch{return{}}if(!n||n.status!==`processing`||((await e.prepare(`UPDATE generation_logs SET status = 'failed' WHERE job_id = ? AND status = 'processing'`).bind(t).run()).meta?.changes??0)===0)return{};let r=await e.prepare(`SELECT amount FROM credit_logs WHERE ref_id = ? AND reason = 'video_generation' ORDER BY id DESC LIMIT 1`).bind(t).first(),i=r?.amount?Math.abs(r.amount):Mn;await e.prepare(`UPDATE users SET credits = credits + ?, updated_at = datetime('now') WHERE id = ?`).bind(i,n.user_id).run();let a=(await e.prepare(`SELECT credits FROM users WHERE id = ?`).bind(n.user_id).first())?.credits??null;return await e.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id) VALUES (?, 'refund', ?, ?, 'video_generation_failed', ?)`).bind(n.user_id,i,a,t).run(),{creditsRemaining:a??void 0}}V.post(`/api/generation/start`,async e=>{try{let{modelId:t,modelName:n=`패션 모델`,modelDesc:r=`young Asian female fashion model, slim figure, natural look`,bgId:i,bgName:a=`스튜디오`,bgDesc:o=`clean white studio background with professional lighting`,poseType:s=`전신`,pose:l=`정면`,ratio:u=`9:16`,resolution:d=`HD`,count:f=4,clothingImageUrl:p,clothingImages:m}=await e.req.json(),h=e.env?.LOOKBOOK_DB,g=null;if(h){let t=e.req.header(`X-Session-Token`)||``;if(t){let e=await h.prepare(`SELECT s.user_id, u.name, u.credits FROM user_sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(t).first();e&&(g=e)}if(!g)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);console.log(`[Generation] ${g.name} started generation (credits: ${g.credits})`)}let _=Tn(u),v=En(d);console.log(`Model ID:`,t,`| BG ID:`,i),console.log(`Ratio:`,_,`| Resolution:`,v),console.log(`Clothing:`,p?p.substring(0,60)+`...`:`none`);let y={전신:`full body shot`,반신:`half body shot`,상반신:`upper body shot`},b={정면:`facing camera, natural standing pose`,측면:`3/4 angle, elegant slight turn`,워킹:`dynamic walking pose, confident stride`,정적:`elegant static pose, hands relaxed at sides`},x=y[s]||`full body shot`,S=b[l]||`natural standing pose`,C=null,w=null,T=e.env?.LOOKBOOK_KV,E=null;if(t){let e=String(t);if(T){let t=await T.get(`model_img:${e}`);t&&(C=t,console.log(`KV custom model: OK`)),E=(await K(T)).find(t=>t.id===e)?.gender||null}else if(h){let t=await Dt(h,e);t&&(C=t,console.log(`D1 custom model: OK`)),E=(await h.prepare(`SELECT gender FROM custom_models WHERE id = ?`).bind(e).first())?.gender||null}else{let t=J.find(t=>t.id===e);t?.imageBase64&&(C=t.imageBase64,console.log(`Mem custom model: OK`)),E=t?.gender||null}C||console.log(`Custom model image not found for id:`,e)}let ee=E===`남성`?`MALE BODY TYPE: Render the body/physique as a MALE body type — broader shoulders, flatter chest, straighter waist-to-hip line, masculine posture and build. The clothing must fit and drape as menswear on a male body, not a female body shape.`:``;if(i){let e=String(i);if(T){let t=await T.get(`bg_gen_img:${e}`),n=t||await T.get(`bg_img:${e}`);n&&(w=n,console.log(`KV custom bg: OK | bgId=${e} | source=${t?`GEN(masked)`:`ORIGINAL(fallback, no gen image registered)`}`))}else if(h){let t=await h.prepare(`SELECT image_b64, gen_image_b64 FROM custom_bgs WHERE id = ?`).bind(e).first();if(t){let n=!!(t.gen_image_b64&&String(t.gen_image_b64).trim());w=n?t.gen_image_b64:t.image_b64,console.log(`D1 custom bg: OK | bgId=${e} | source=${n?`GEN(masked)`:`ORIGINAL(fallback, no gen image registered)`}`)}}else{let t=Y.find(t=>t.id===e);(t?.genImageBase64||t?.imageBase64)&&(w=t.genImageBase64||t.imageBase64,console.log(`Mem custom bg: OK | bgId=${e} | source=${t?.genImageBase64?`GEN(masked)`:`ORIGINAL(fallback, no gen image registered)`}`))}w||console.log(`Custom bg image not found for id:`,e)}let D=[`ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:`,`1. DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image.`,`2. Facial identity is non-negotiable: the output face must be the SAME PERSON as the identity reference image (bone structure, eye/nose/lip shape, proportions unchanged) — never a different-looking substitute. See the IDENTITY instructions above for what may change (angle, lighting) vs. what may not (identity).`,`3. DO NOT change, redesign, or substitute ANY detail of the clothing: color, pattern, print, texture, collar, neckline, sleeve length, hem, buttons, zippers, pockets, or stitching must be reproduced EXACTLY as shown in the reference.`,`4. NO watermarks. NO overlaid captions. NO decorative text. NO brand insignia added by AI.`,`Ultra-photorealistic, 8K quality, professional fashion editorial, magazine cover quality.`].join(` `),te=[];Array.isArray(m)&&m.length>0?te=m.filter(e=>e?.dataUrl?.startsWith(`data:`)):p&&p.startsWith(`data:`)&&(te=[{dataUrl:p,category:`TOP`,label:`clothing item`}]),console.log(`Clothing items:`,te.map(e=>`[${e.category}]`).join(`, `)||`none`),console.log(`Model ID:`,t,`| BG ID:`,i);let O=[],ne=[`DRESS`,`TOP`,`BOTTOM`,`OUTER`,`UNKNOWN`],k=[...te].sort((e,t)=>ne.indexOf(e.category)-ne.indexOf(t.category));k.forEach(e=>O.push(e.dataUrl));let A=k.length,j=A+1,M=A+ +!!C+1;C&&O.push(C),w&&O.push(w),console.log(`images 배열: 의류${A}장 | 모델${+!!C}장 | 배경${+!!w}장 | 총${O.length}장`);let N=``,P=!!w,F=!!C,re=A>0;if(re&&F&&P){console.log(`[단일 단계] 의상+얼굴+신원 통합 합성 시작`);let e=On(k.map(e=>({...e})),1),t=kn(k,1);N=[`COMPLETE FASHION LOOKBOOK SYNTHESIS — clothing replacement + identity swap in a single pass.`,e,`Image ${M} = SCENE ANCHOR. This scene defines: background environment, scene lighting direction/color-temperature/intensity/saturation, color grade, and mood. LOCKED: background. The output background must come EXCLUSIVELY from Image ${M} — never from any clothing reference image's own background.`,`CLOTHING REPLACEMENT:`,t,`POSE: If Image ${M} already shows a person, that person's pose, stance, and body position are the PRIMARY pose reference — the output pose should naturally emerge from theirs, adjusting only as needed to fit the new clothing (do not rigidly lock every joint, but do not replace it with an unrelated generic pose either). Only if Image ${M} has no person to reference, fall back to a ${x}, ${S}. The pose must NEVER be copied from a clothing reference image, even if that image shows a person modeling the garment — clothing images are a garment/texture source only, not a pose reference.`,`IDENTITY (from Image ${j}) — READ THIS ONCE, IT IS THE ONLY IDENTITY RULE:`,`This is Image ${j}'s exact face, physically rotated to a new head angle and relit under Image ${M}'s scene — the SAME face asset transformed, never a newly generated or substitute face. KEEP UNCHANGED: bone structure, eye shape/spacing, iris color, nose shape, lip shape, jawline, cheekbones, face width, and skin undertone — these must be pixel-consistent with Image ${j} when mentally rotated back to its original angle. Hair may adjust naturally (style, volume, flow) to suit the pose and scene — it does not need to be locked to Image ${j}'s exact hairstyle. Head/face size relative to the body must stay in natural human proportion, matching Image ${j}'s scale — do not enlarge or shrink it. CHANGE ONLY what a camera and lighting change: head angle, tilt, gaze direction, expression, perspective, brightness, shadows, color temperature, saturation. Do NOT copy Image ${j}'s original angle, expression, or lighting — they must update to match Image ${M}'s scene. Do NOT use body shape, clothing, or pose from Image ${j}.`,`If Image ${M} already shows a person, their pose, stance, and hair may be used as a natural reference and can vary freely to fit the scene — but their FACE is IRRELEVANT and must NEVER appear in the output. The output face must be Image ${j}'s identity, not the person already in Image ${M}.`,ee,`SCENE LIGHTING INTEGRATION (from Image ${M} — critical for photorealism):`,`  Re-light ALL elements (clothing, face, skin, hair) under Image ${M}'s physical lighting environment:`,`  · BRIGHTNESS: Match face and skin brightness to the scene's ambient light level. Bright scene → bright face; moody/dim scene → face lit accordingly.`,`  · LIGHT DIRECTION: Apply the scene's key light direction. Highlights land on the correct side of the face (forehead, cheekbone, nose bridge), shadows fall on the opposite side.`,`  · COLOR TEMPERATURE & SATURATION: Tint face, skin, and clothing under the scene's color temperature AND saturation level — face and body must share identical hue/saturation/brightness at every point, with zero visible tone or saturation boundary anywhere on exposed skin.`,`  · SHADOW QUALITY: Hard shadows in direct sunlight; soft wrap-around shadows in diffuse/cloudy/studio light — match the scene exactly.`,`  · CATCH-LIGHTS: Eyes must reflect Image ${M}'s light source position and shape.`,`  · FABRIC RENDERING: Simulate specular highlights on shiny fabrics, soft diffuse on matte, translucency on thin materials — all under the scene's light.`,`  · SUBSURFACE SCATTERING: Realistic skin SSS under scene light (warm ears/nose in backlit; strong SSS in diffuse light).`,`  · GROUNDING: The model must cast a soft contact shadow onto the ground/floor matching Image ${M}'s light direction and shadow softness. Depth-of-field, grain, and sharpness falloff on the model must match the background photo's camera characteristics.`,`  · SEAMLESS INTEGRATION: The face-to-neck-to-body transition must be completely seamless — same lighting falloff, same color temperature, no hard edge or tone jump, identical skin micro-texture/sharpness/grain between face and body. This must read as ONE continuous photograph of ONE real person, never a cutout, collage, sticker, or composite.`,`  · HAIR INTEGRATION: Hair receives the scene's ambient + key light. Rim/backlight if present in the scene. Flyaways lit naturally.`,`FINAL OUTPUT: One seamless, ultra-photorealistic fashion photograph — Image ${j}'s exact identity, re-angled and re-lit to fit Image ${M}'s scene, wearing the new clothing. This must look like an actual photograph taken with a real camera — NOT an AI-generated, CGI, 3D-rendered, or illustrated image. Natural skin texture with visible pores, fine hairs, subtle imperfections. Natural film grain and lens characteristics. Avoid overly smooth/plastic/airbrushed skin, avoid uncanny-valley symmetry, avoid the glossy "AI look." Shot on a professional camera, candid editorial photography style.`,`8K resolution, magazine editorial quality.`,D].join(` `)}else if(re&&F&&!P){let e=On(k.map(e=>({...e})),1),t=kn(k,1);N=[`Create a hyper-realistic professional fashion lookbook photograph.`,e,`Image ${j} = MODEL IDENTITY — preserve this exact person's face, hair, skin tone, body proportions exactly.`,ee,t,`Show a ${x}, ${S}.`,`Background: ${o} (${a}). Create a photorealistic environment. Integrate the model naturally with correct lighting and shadows.`,D].join(` `)}else if(re&&!F&&P){let e=On(k.map(e=>({...e})),1),t=kn(k,1);N=[`You are doing a CLOTHING SWAP on a fashion background scene.`,e,`Image ${M} = SOURCE BACKGROUND SCENE containing a person. Keep the scene and person EXACTLY as-is — same face, same pose, same stance, same body position.`,t,`FINAL RESULT: Same scene, same person, same pose — only the specified clothing items are replaced. Natural lighting, seamless integration.`,D].join(` `)}else if(re&&!F&&!P){let e=On(k.map(e=>({...e})),1),t=kn(k,1);N=[`Create a hyper-realistic professional fashion lookbook photograph.`,e,`Model: ${r}. Show in a ${x}, ${S}.`,t,`Background: ${o} (${a}). Photorealistic environment with correct lighting and shadows.`,D].join(` `)}else N=[`Ultra-photorealistic professional fashion photography.`,`A ${r} fashion model, ${x}, ${S}.`,`Background: ${o} (${a}). Natural lighting, seamless scene integration.`,`8K resolution, Canon EOS R5, professional lighting, hyperrealistic skin texture, perfect fabric detail, commercial fashion editorial, magazine quality.`,D].join(` `);try{G=await Ln(e.env.LOOKBOOK_DB)}catch{}N=vt(N),console.log(`Prompt (first 300):`,N.substring(0,300)),console.log(`images count:`,O.length,`| mode:`,O.length>=3?`FULL(clothing+model+bg)`:O.length===2?`PARTIAL`:O.length===1?`CLOTHING_ONLY`:`TEXT`);let ie={model:`google/nano-banana-2/edit`,prompt:N,aspect_ratio:_,resolution:v,thinking_level:`high`,output_format:`jpeg`};O.length>0&&(ie.images=O),console.log(`Final prompt (first 300):`,N.substring(0,300)),console.log(`Atlas request → model:`,ie.model,`| images:`,O.length,`| aspect_ratio:`,_,`| resolution:`,v,`| jobs:`,1);let ae=Array.from({length:1},()=>fetch(`${H}/api/v1/model/generateImage`,{method:`POST`,headers:Q(e.env.ATLAS_API_KEY),body:JSON.stringify(ie)}).then(e=>e.json())),oe=await Promise.all(ae);console.log(`Atlas responses:`,oe.map(e=>`${e.code}:${e.data?.id}`).join(`, `));let se=oe.filter(e=>e.code===200&&e.data?.id).map(e=>e.data.id);if(se.length===0){let t=oe[0];console.error(`All Atlas requests failed:`,t);let n=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:n,estimatedSeconds:5,status:`queued`,isFallback:!0,error:t?.msg||t?.message||`Atlas API error`})}let ce=se.join(`,`);if(h&&g)try{let e=((await h.prepare(`SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`).bind(g.user_id).first())?.last_seq||0)+1;await h.prepare(`INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, model_id, bg_id, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+14 days'))`).bind(g.user_id,ce,f,n||`패션 모델`,a||`스튜디오`,u||`9:16`,e,t?String(t):null,i?String(i):null).run(),console.log(`[GenLog] seq_no=${e} 기록 완료`)}catch(e){console.warn(`[GenLog] 생성 내역 기록 실패 (무시):`,e)}if(T&&k.length>0)try{await T.put(`clothing_img:${ce}`,JSON.stringify(k.map(e=>e.dataUrl)),{expirationTtl:336*60*60})}catch(e){console.warn(`[GenLog] 의상 이미지 KV 저장 실패 (무시):`,e)}return e.json({jobId:ce,estimatedSeconds:30,status:`queued`,isFallback:!1})}catch(t){console.error(`Generation start error:`,t);let n=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:n,estimatedSeconds:5,status:`queued`,isFallback:!0,error:t.message})}}),V.get(`/api/generation/:jobId/status`,async e=>{let t=e.req.param(`jobId`);if(t.startsWith(`fallback_`)){let t=Fn(1);return e.json({status:`completed`,progress:100,images:t,isFallback:!0})}let n=t.split(`,`).filter(Boolean);try{let t=await Promise.all(n.map(t=>fetch(`${H}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json())));console.log(`Poll statuses:`,t.map(e=>`${e.data?.id?.substring(0,8)}:${e.data?.status}`).join(`, `));let r=new Set([`completed`,`succeeded`,`failed`,`timeout`,`canceled`,`error`]),i=t.every(e=>r.has(e.data?.status));if(t.some(e=>!r.has(e.data?.status)),!i){let n=t.filter(e=>r.has(e.data?.status)).length,i=t.length,a=Math.round(20+n/i*60);return e.json({status:`processing`,progress:a,images:[]})}let a=[];if(t.forEach((e,t)=>{let n=e.data?.status,r=e.data?.outputs??e.data?.output??e.data?.images??e.data?.result??null,i=Array.isArray(r)?r.filter(e=>typeof e==`string`&&e.startsWith(`http`)):typeof r==`string`&&r.startsWith(`http`)?[r]:[];console.log(`Job ${t} status:${n} urls:`,i),(n===`completed`||n===`succeeded`)&&i.length>0&&i.forEach((e,t)=>{a.push({id:`result_${a.length+1}`,url:e,title:`AI 피팅컷 #${a.length+1}`})})}),a.length===0){console.error(`All jobs failed:`,t.map(e=>e.data?.status).join(`, `));let n=Fn(1);return e.json({status:`completed`,progress:100,images:n,isFallback:!0,error:`All jobs failed`})}return e.json({status:`completed`,progress:100,images:a,isFallback:!1})}catch(t){console.error(`Poll error:`,t);let n=Fn(1);return e.json({status:`completed`,progress:100,images:n,isFallback:!0,error:t.message})}}),V.post(`/api/ghostcut/generate`,async e=>{try{let{productImageUrl:t,category:n}=await e.req.json();if(!t||!String(t).startsWith(`data:`))return e.json({error:`상품 이미지가 필요합니다.`,code:`MISSING_IMAGE`},400);let r=X.find(e=>e.code===n);if(!r)return e.json({error:`알 수 없는 카테고리입니다.`,code:`INVALID_CATEGORY`},400);let i=e.env?.LOOKBOOK_DB,a=null;if(i){let t=e.req.header(`X-Session-Token`)||``;if(t){let e=await i.prepare(`SELECT s.user_id, u.name, u.credits FROM user_sessions s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(t).first();e&&(a=e)}if(!a)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401)}let o=e.env?.LOOKBOOK_KV,s=null;if(s=o?await It(o,n):i?await Bt(i,n):Z[n]||null,!s)return e.json({error:`"${r.label}" 카테고리는 아직 준비되지 않았습니다.`,code:`SAMPLE_NOT_READY`},400);let l=[`GHOST MANNEQUIN PRODUCT PHOTOGRAPHY — combine an actual garment photo with a rendering-style reference from a DIFFERENT, UNRELATED product photo.`,`Image 1 and Image 2 show TWO COMPLETELY DIFFERENT GARMENTS from two different products. They are NOT the same item and must NEVER be blended, merged, mixed, or averaged together.`,`Image 1 = THE PRODUCT BEING SOLD — the ONLY source of what the garment looks like AND its exact shape. Every visual detail (color, pattern, print, texture, fabric weave, stitching, buttons, zippers, collar, cuffs, hem, logo placement, print scale) AND every structural detail (overall length, cut, silhouette, fit, proportions — e.g. a cropped jacket stays cropped, it must NOT become a long coat) must be reproduced EXACTLY as shown in Image 1, with zero alteration.`,`Image 2 = an UNRELATED product photo used SOLELY for the RENDERING TECHNIQUE and camera framing — NEVER for shape. Take from Image 2 ONLY: how a garment is rendered with the invisible-mannequin (ghost) effect (naturally filled/worn by an invisible body, realistic volumetric fill and fabric drape — no visible mannequin, no visible model, no human body or hands, no headless-torso form) and the camera framing/crop/angle. Do NOT take Image 2's garment length, cut, silhouette, proportions, design, color, pattern, print, fabric, background, or lighting — none of that belongs to this product and must have ZERO influence on the output. Image 1's garment keeps its own exact length and shape unchanged; only the rendering method is borrowed from Image 2.`,`BACKGROUND & LIGHTING — MANDATORY, OVERRIDES Image 2 entirely: Pure solid white (#FFFFFF) seamless studio background, completely flat and even, no gradient, no vignette, no visible floor line or horizon. Even, shadowless studio lighting on the garment — DO NOT render any drop shadow, contact shadow, cast shadow, or reflection anywhere on or around the garment. The garment must appear to float cleanly on pure white with ZERO shadow, regardless of what background or lighting Image 2 shows.`,`REMINDER before finalizing: the garment's appearance AND shape (length, cut, silhouette, proportions) in your output must both come from Image 1 unchanged — resize nothing, reshape nothing, only render it using the invisible-mannequin technique and framing shown in Image 2. If your output's garment is longer, shorter, or differently proportioned than Image 1, or resembles Image 2's garment in any way, that is WRONG.`,`FINAL OUTPUT: A single professional e-commerce ghost-mannequin product photograph on a pure white, completely shadowless background — Image 1's exact garment (color, pattern, fabric, design, length, cut, silhouette, all unchanged), rendered using Image 2's invisible-mannequin technique and camera framing only. The garment must look naturally filled with realistic fabric drape and natural wrinkles at shoulders/sleeves/hem, as if worn by an invisible body — NOT flat-lay, NOT laid on a table, NOT on a visible mannequin or hanger.`,[`ABSOLUTE RULES — NEVER VIOLATE UNDER ANY CIRCUMSTANCES:`,`1. DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image.`,`2. DO NOT change, redesign, or substitute ANY detail of the garment from Image 1: color, pattern, print, texture, collar, neckline, sleeve length, hem, buttons, zippers, pockets, stitching, OVERALL LENGTH, CUT, and SILHOUETTE must be reproduced EXACTLY as shown in Image 1.`,`3. NO visible human body, face, hands, mannequin form, hanger, or flat-lay surface anywhere in the output — only the invisible-mannequin (ghost) effect.`,`4. NO watermarks. NO overlaid captions. NO decorative text. NO brand insignia added by AI.`,`5. Background MUST be pure solid white (#FFFFFF), completely flat and shadowless — NO drop shadow, NO contact shadow, NO reflection, NO gradient, NO vignette anywhere in the frame.`,`6. The output garment's color, pattern, print, fabric, and overall design MUST come exclusively from Image 1. Image 1 and Image 2 show two different, unrelated products — if the output resembles Image 2's garment instead of Image 1's, this is a CRITICAL FAILURE.`,`7. Image 1's garment LENGTH and SILHOUETTE (e.g., a cropped/short jacket must stay cropped/short, a long coat must stay long) must be preserved EXACTLY — do NOT lengthen, shorten, widen, or otherwise reshape it to match Image 2's proportions. Image 2 contributes ONLY the rendering technique and camera framing, never the garment's shape.`,`8. Image 1's garment FABRIC MATERIAL and COLOR must be reproduced with ZERO deviation — do NOT change the material type (e.g. turning cotton into leather, knit into woven, matte into shiny, thin into padded/quilted), fabric weight or thickness, weave/knit pattern, sheen, or the exact color/shade/hue of the garment from Image 1. These are the most critical visual properties of the product and must never be altered under any circumstances.`,`Ultra-photorealistic, 8K quality, professional e-commerce product photography.`].join(` `)].join(` `);console.log(`[GhostCut] category:`,n,`| prompt(first 200):`,l.substring(0,200));let u={model:`google/nano-banana-2/edit`,prompt:l,aspect_ratio:`1:1`,resolution:`2k`,thinking_level:`high`,output_format:`jpeg`,images:[t,s]},d=await fetch(`${H}/api/v1/model/generateImage`,{method:`POST`,headers:Q(e.env.ATLAS_API_KEY),body:JSON.stringify(u)}).then(e=>e.json());if(d.code!==200||!d.data?.id){console.error(`[GhostCut] Atlas request failed:`,d);let t=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:t,estimatedSeconds:5,status:`queued`,isFallback:!0,error:d?.msg||d?.message||`Atlas API error`})}let f=d.data.id;if(i&&a)try{let e=((await i.prepare(`SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`).bind(a.user_id).first())?.last_seq||0)+1;await i.prepare(`INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, model_id, bg_id, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, datetime('now', '+14 days'))`).bind(a.user_id,f,1,`고스트컷·${r.label}`,r.group,`1:1`,e).run()}catch(e){console.warn(`[GhostCut] 생성 내역 기록 실패 (무시):`,e)}return e.json({jobId:f,estimatedSeconds:30,status:`queued`,isFallback:!1})}catch(t){console.error(`GhostCut generate error:`,t);let n=`fallback_`+Math.random().toString(36).substr(2,9);return e.json({jobId:n,estimatedSeconds:5,status:`queued`,isFallback:!0,error:t.message})}});function Fn(e){let t=[[`#FF6B9D`,`#FF8C42`],[`#6C47FF`,`#00D4AA`],[`#FF6B9D`,`#6C47FF`],[`#F59E0B`,`#EF4444`]];return Array.from({length:e},(e,n)=>({id:`placeholder_${n+1}`,url:null,placeholder:!0,gradient:`linear-gradient(135deg, ${t[n%t.length][0]}, ${t[n%t.length][1]})`,title:`AI 피팅컷 #${n+1}`,width:832,height:1216}))}V.post(`/api/video/start`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);let r=await t.prepare(`SELECT s.user_id, u.credits, u.name FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`,code:`UNAUTHORIZED`},401);let{imageUrl:i,modelName:a,bgName:o}=await e.req.json();if(!i)return e.json({error:`imageUrl 필수`},400);let s=Mn;if(r.credits<s)return e.json({error:`크레딧이 부족합니다. (보유: ${r.credits}크레딧, 필요: ${s}크레딧)`,code:`INSUFFICIENT_CREDITS`,available:r.credits,required:s},402);let l=await fetch(`${H}/api/v1/model/generateVideo`,{method:`POST`,headers:Q(e.env.ATLAS_API_KEY),body:JSON.stringify({model:`bytedance/seedance-2.5/image-to-video`,prompt:`The person begins exactly as shown in the image and performs natural, subtle fashion-model posing movements at normal real-time speed: gentle weight shifts, a natural turn, relaxed hand and hair movement, as if in a live fashion shoot. The camera is NOT completely static — apply only a very subtle, gentle pan or slight orbital drift around the subject at a steady, normal pace, the way a real videographer would shoot a fashion editorial, adding a touch of depth beyond the model's own movement. Do NOT zoom in or out and do NOT push in or dolly toward the subject — keep the framing distance essentially constant throughout, only a gentle pan or slight orbital drift is allowed. Smooth, realistic motion at regular playback speed — absolutely no slow motion, no slow-mo effect, no frame-rate ramping. Keep the person's identity, outfit, and scene/background setting unchanged throughout the video — only the camera framing and the model's pose may shift naturally. Add soft, tasteful ambient background music suited for a fashion runway/showcase — no vocals, no jarring sound effects.`,image:i,duration:7,resolution:`1080p-esr`,ratio:`adaptive`,output_format:`mp4`,generate_audio:!0,watermark:!1})}),u=await l.json(),d=u?.data?.id||u?.id||null;if(!l.ok||!d)return console.error(`video/start Atlas 요청 실패:`,u),e.json({success:!1,message:u?.msg||u?.message||`영상 생성 요청 실패`},502);let f=r.credits-s;await t.prepare(`UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?`).bind(f,r.user_id).run(),await t.prepare(`INSERT INTO credit_logs (user_id, type, amount, balance, reason, ref_id)
       VALUES (?, 'deduct', ?, ?, 'video_generation', ?)`).bind(r.user_id,-600,f,d).run();let p=((await t.prepare(`SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`).bind(r.user_id).first())?.last_seq||0)+1;return await t.prepare(`INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, kind, expires_at, image_urls)
       VALUES (?, ?, 1, ?, ?, '9:16', ?, 'video', datetime('now', '+14 days'), ?)`).bind(r.user_id,d,a||`패션 모델`,o||`스튜디오`,p,JSON.stringify([i])).run(),e.json({success:!0,jobId:d,creditsRemaining:f})}catch(t){return console.error(`video/start error:`,t),e.json({success:!1,message:t.message},500)}});var In=[`Choose the MOST visually distinctive design detail area of the garment for this close-up — such as a button, zipper, collar, pocket, stitching pattern, fabric texture, trim, or hardware — whichever best showcases the product's craftsmanship and quality.`,`Choose a DIFFERENT design detail area than a typical front-view close-up — such as a cuff, hem, seam, side panel, or secondary hardware/trim — to show another distinctive feature of the garment not obvious from the main product photo.`,`Choose YET ANOTHER distinctive design detail area, different from the two most obvious focal points — such as a back panel, shoulder seam, fabric weave close-up, or a unique construction detail — to give a third unique perspective on the product's quality.`,`Choose a FOURTH distinctive design detail area, different from the three focal points above — such as the waistband, closure/placket, inner lining edge, or another unique construction detail — to give a fourth unique perspective on the product's quality.`];V.post(`/api/ghostcut/detail/start`,async e=>{try{let t=e.env.LOOKBOOK_DB,n=e.req.header(`X-Session-Token`)||``;if(!n)return e.json({error:`로그인이 필요합니다.`,code:`UNAUTHORIZED`},401);let r=await t.prepare(`SELECT s.user_id, u.credits, u.name FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(n).first();if(!r)return e.json({error:`세션이 만료되었습니다.`,code:`UNAUTHORIZED`},401);let i=await e.req.json(),{imageUrl:a,categoryLabel:o,jobId:s}=i,l=Math.max(1,Math.min(4,parseInt(i.count,10)||1));if(!a)return e.json({error:`imageUrl 필수`},400);if(!s)return e.json({error:`jobId 필수`,code:`MISSING_JOB_ID`},400);let u=await t.prepare(`SELECT downloaded_indices FROM generation_logs WHERE job_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`).bind(s,r.user_id).first(),d=[];if(u?.downloaded_indices)try{d=JSON.parse(u.downloaded_indices)}catch{}if(d.length===0)return e.json({error:`먼저 누끼컷 이미지를 다운로드한 후 디테일컷을 생성할 수 있습니다.`,code:`DOWNLOAD_REQUIRED`},403);let f=e=>[`IMAGE CROP TASK — this is NOT a new photograph and NOT a creative reinterpretation. Take the EXACT SAME photograph shown in the source image and output a cropped, zoomed-in region of it — as if you digitally selected a rectangular region of the original photo file and enlarged it. Every pixel of color, texture, pattern, shading, stitching, and surface detail in your output must be identical to what already exists in that region of the source image.`,`Source image = the ONLY reference for the garment's design, color, pattern, print, texture, fabric, stitching, and every visual detail. Do NOT redesign, alter, invent, or change ANY detail of the garment — this is a crop/zoom of the exact same real garment, not a new interpretation.`,`ABSOLUTE PROHIBITION ON CREATIVE CHANGES: Do NOT add, remove, invent, embellish, restyle, or reinterpret ANYTHING. No new textures, no new wrinkles or creases beyond what the source already shows, no new stitching patterns, no changed proportions, no artistic enhancement, no different fabric sheen or lighting mood, no camera/lens look different from the source. If you are unsure whether a fine detail is present in the source, do NOT invent it — leave that area exactly as plain/ambiguous as the source shows it. Act as a lossless digital zoom, not as a photographer or illustrator creating a new image.`,`CRITICAL — DO NOT ADD ANY WEAR, AGING, OR DISTRESSING THAT IS NOT ALREADY IN THE SOURCE IMAGE: if an edge, hem, seam, or surface is clean and smooth in the source image, it MUST remain exactly that clean and smooth in this close-up — do NOT add fraying, raw-edge unraveling, rips, tears, whiskering, faded/worn patches, scuffs, or any "distressed"/"vintage"/"aged" look that is not already present in the source. If the source already shows some existing wear or distressing, reproduce it EXACTLY as-is — do not add MORE fraying or tears beyond what the source shows, and do not invent new damage.`,e,`Output framing: crop tightly so the chosen detail area fills most of the frame. This is purely a crop/zoom operation on the source photo — not a new photoshoot, not a restyled product shot.`,`Background MUST remain pure solid white (#FFFFFF), completely flat and shadowless — NO drop shadow, NO contact shadow, NO reflection, NO gradient, NO vignette anywhere in the frame, exactly like the source image's background.`,`ABSOLUTE RULES: DO NOT insert, overlay, embed, or render ANY text, letters, numbers, words, logos, watermarks, brand marks, or typographic elements ANYWHERE in the image (unless an existing brand logo/print is already part of the garment's real design in the source image — reproduce that exactly, do not add new ones). NO visible human body, face, hands, mannequin form, or hanger anywhere in the output. DO NOT change the garment's color, pattern, print, texture, fabric, or any design element from the source image — this must look like a real macro photograph of the exact same product.`,`REMINDER before finalizing: if your output looks like a new photograph rather than a cropped/zoomed region of the EXACT source image — different texture, different wear, different stitching, different proportions, any detail added, removed, or reinterpreted — that is WRONG. This must be pixel-faithful to the source image, only cropped and enlarged.`,`Ultra-high-resolution, 8K, sharp macro focus — the same photographic characteristics as the source image, with zero artistic reinterpretation.`].join(` `),p=Array.from({length:l},(t,n)=>fetch(`${H}/api/v1/model/generateImage`,{method:`POST`,headers:Q(e.env.ATLAS_API_KEY),body:JSON.stringify({model:`google/nano-banana-2/edit`,prompt:f(In[n%In.length]),aspect_ratio:`1:1`,resolution:`2k`,thinking_level:`high`,output_format:`jpeg`,images:[a]})}).then(e=>e.json())),m=await Promise.all(p),h=m.filter(e=>e.code===200&&e.data?.id).map(e=>e.data.id);if(h.length===0){let t=m[0];return console.error(`[GhostCut Detail] Atlas 요청 전체 실패:`,t),e.json({success:!1,message:t?.msg||t?.message||`디테일컷 생성 요청 실패`},502)}let g=h.length,_=h.join(`,`),v=((await t.prepare(`SELECT COALESCE(MAX(seq_no), 0) AS last_seq FROM generation_logs WHERE user_id = ?`).bind(r.user_id).first())?.last_seq||0)+1;return await t.prepare(`INSERT INTO generation_logs (user_id, job_id, image_count, model_name, bg_name, ratio, seq_no, expires_at)
       VALUES (?, ?, ?, ?, ?, '1:1', ?, datetime('now', '+14 days'))`).bind(r.user_id,_,g,`고스트컷디테일·${o||``}`,`화이트 배경`,v).run(),e.json({success:!0,jobId:_,imageCount:g})}catch(t){return console.error(`ghostcut/detail/start error:`,t),e.json({success:!1,message:t.message},500)}}),V.get(`/api/video/:jobId/status`,async e=>{let t=e.req.param(`jobId`),n=e.env.LOOKBOOK_DB;try{let r=null;try{r=await n.prepare(`SELECT status, video_url, created_at FROM generation_logs WHERE job_id = ?`).bind(t).first()}catch{r=null}if(r?.status===`completed`&&r.video_url)return e.json({status:`completed`,progress:100,videoUrl:r.video_url});if(r?.status===`failed`)return e.json({status:`failed`,progress:100,error:`영상 생성에 실패했습니다. (크레딧은 차감되지 않았습니다)`});let i=r?.created_at?Date.now()-new Date(r.created_at.replace(` `,`T`)+`Z`).getTime()>900*1e3:!1,a=async(r,a)=>{if(i){let r=await Pn(n,t);return e.json({status:`failed`,progress:100,error:a,...r})}return e.json({status:`processing`,progress:r})},o;try{o=await fetch(`${H}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}).then(e=>e.json())}catch(e){return console.error(`Atlas 상태 조회 일시 실패:`,e),await a(50,`영상 생성 응답 시간이 초과되었습니다. (크레딧은 차감되지 않았습니다)`)}let s=String(o.data?.status??o.status??``).toLowerCase();if(!new Set([`completed`,`succeeded`,`success`,`failed`,`failure`,`timeout`,`canceled`,`cancelled`,`error`]).has(s))return await a(50,`영상 생성 응답 시간이 초과되었습니다. (크레딧은 차감되지 않았습니다)`);if(s!==`completed`&&s!==`succeeded`&&s!==`success`){console.error(`video status 실패:`,s,o);let r=await Pn(n,t);return e.json({status:`failed`,progress:100,error:`영상 생성에 실패했습니다. (크레딧은 차감되지 않았습니다)`,...r})}let l=o.data?.outputs??o.data?.output??o.data?.video??o.data?.videos??o.output??null,u=Array.isArray(l)?l.find(e=>typeof e==`string`&&e.startsWith(`http`))||null:typeof l==`string`&&l.startsWith(`http`)?l:null;return u?(await n.prepare(`UPDATE generation_logs SET video_url = ?, status = 'completed' WHERE job_id = ?`).bind(u,t).run(),e.json({status:`completed`,progress:100,videoUrl:u})):(console.error(`video 완료 응답이지만 URL 파싱 실패:`,JSON.stringify(o).slice(0,500)),await a(90,`영상 URL을 찾을 수 없습니다. (크레딧은 차감되지 않았습니다)`))}catch(t){return console.error(`video status poll error (재시도 예정):`,t),e.json({status:`processing`,progress:50})}}),V.get(`/api/admin/debug/stuck-videos`,W,async e=>{let t=e.env.LOOKBOOK_DB;try{let n=await t.prepare(`SELECT id, user_id, job_id, status, video_url, created_at,
              CAST((julianday('now') - julianday(created_at)) * 24 * 60 AS INTEGER) AS minutes_elapsed
       FROM generation_logs
       WHERE kind = 'video' AND (status = 'processing' OR status IS NULL)
       ORDER BY created_at ASC
       LIMIT 50`).all();return e.json({success:!0,jobs:n.results||[]})}catch(t){return e.json({success:!1,message:t.message},500)}}),V.get(`/api/admin/debug/atlas-job/:jobId`,W,async e=>{let t=e.req.param(`jobId`),n=e.env.LOOKBOOK_DB;try{let r=await n.prepare(`SELECT id, job_id, kind, status, video_url, created_at FROM generation_logs WHERE job_id = ?`).bind(t).first(),i=await fetch(`${H}/api/v1/model/prediction/${t}`,{headers:{Authorization:`Bearer ${e.env.ATLAS_API_KEY}`}}),a=await i.text(),o=null;try{o=JSON.parse(a)}catch{}return e.json({dbRow:r,atlasHttpStatus:i.status,atlasRaw:o??a})}catch(t){return e.json({success:!1,message:t.message},500)}});async function Ln(e){try{let t=await e.prepare(`SELECT value FROM app_settings WHERE key = 'admin_prompt_config'`).first();if(t?.value){let e=JSON.parse(t.value);return{enabled:typeof e.enabled==`boolean`?e.enabled:G.enabled,prefix:typeof e.prefix==`string`?e.prefix:G.prefix,suffix:typeof e.suffix==`string`?e.suffix:G.suffix,styleGuide:typeof e.styleGuide==`string`?e.styleGuide:G.styleGuide,technicalSpec:typeof e.technicalSpec==`string`?e.technicalSpec:G.technicalSpec,updatedAt:e.updatedAt||G.updatedAt}}}catch(e){console.warn(`d1GetPromptConfig fallback to memory:`,e)}return G}async function Rn(e,t){await e.prepare(`INSERT INTO app_settings (key, value, updated_at) VALUES ('admin_prompt_config', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(JSON.stringify(t)).run()}V.get(`/api/admin/prompt`,W,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await Ln(t);return e.json({success:!0,config:n})}catch{return e.json({success:!0,config:G})}}),V.put(`/api/admin/prompt`,W,async e=>{try{let t=e.env.LOOKBOOK_DB,n=await e.req.json(),r=await Ln(t),i={enabled:typeof n.enabled==`boolean`?n.enabled:r.enabled,prefix:typeof n.prefix==`string`?n.prefix:r.prefix,suffix:typeof n.suffix==`string`?n.suffix:r.suffix,styleGuide:typeof n.styleGuide==`string`?n.styleGuide:r.styleGuide,technicalSpec:typeof n.technicalSpec==`string`?n.technicalSpec:r.technicalSpec,updatedAt:new Date().toISOString()};return await Rn(t,i),G=i,console.log(`Admin prompt config saved to D1:`,i.updatedAt),e.json({success:!0,config:i})}catch(t){return e.json({success:!1,message:t.message},400)}}),V.post(`/api/admin/auth`,async e=>{let t=await e.req.json(),n=e.env.ADMIN_PASSWORD;return n?t.password===n?e.json({success:!0}):e.json({success:!1,message:`비밀번호가 올바르지 않습니다.`},401):e.json({success:!1,message:`서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.`},500)});var zn=`의류 이미지 하나로 AI 온모델 피팅컷과 룩북 세트를 자동 생성하세요.`,Bn=(e,t,n=``,r=zn,i)=>`<!DOCTYPE html>

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
  <meta property="og:image" content="${U}/static/og-image.jpg" />
  <meta property="og:image:width" content="928" />
  <meta property="og:image:height" content="1232" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${U}/static/og-image.jpg" />
  <meta name="naver-site-verification" content="fda79db143bdb87618cabb15ab207023cff2f5da" />
  <meta name="google-site-verification" content="W4DGx5Ts0G07ZjGwcRMDUo1e-zAocUD1UNo2KOjyRz0" />
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg?v=${gt}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <link href="/static/style.css?v=${gt}" rel="stylesheet" />
  ${_t(i)}
  <!-- app.js는 head에 defer — body 인라인 script보다 항상 먼저 파싱·실행됨 -->
  <script src="/static/app.js?v=${gt}" defer><\/script>
  ${n}
</head>
<body>
${t}

<!-- ── 크레딧 충전 패널 (모든 페이지 공통) ── -->
<div id="chargePanel" style="display:none;position:fixed;inset:0;background:#0d0d1a;z-index:9000;overflow-y:auto;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px 80px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <button onclick="closeChargePanel()" style="width:36px;height:36px;border:none;background:#2a2a45;border-radius:50%;color:#e0e0f0;font-size:27px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">‹</button>
      <h2 style="font-size:18px;font-weight:700;color:#f0f0f8;margin:0;" data-i18n="charge-title">크레딧 충전</h2>
    </div>
    <div style="background:linear-gradient(135deg,#1e1e35,#252545);border:1px solid rgba(108,71,255,0.3);border-radius:16px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:12px;color:#8b8ba0;margin-bottom:4px;" data-i18n="charge-current">현재 보유 크레딧</div>
        <div id="chargePanelCredits" style="font-size:28px;font-weight:800;color:#a78bfa;">-</div>
      </div>
      <div style="font-size:32px;opacity:0.5;">💎</div>
    </div>
    <div id="bfmDiscountBadge" style="display:none;align-items:center;gap:8px;background:linear-gradient(135deg,#fff7e0,#ffe9b3);border:1px solid #f5c542;border-radius:12px;padding:10px 16px;margin-bottom:16px;">
      <span style="font-size:18px;">🎁</span>
      <span style="font-size:13px;font-weight:700;color:#7a5b00;">BFM회원사 할인 20% 적용</span>
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
            <div id="pkgPriceOriginal_pkg_20000" style="display:none;font-size:12px;color:#8b8ba0;text-decoration:line-through;"></div>
            <div id="pkgPrice_pkg_20000" style="font-size:22px;font-weight:800;color:#6c47ff;">20,000원</div>
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
            <div id="pkgPriceOriginal_pkg_40000" style="display:none;font-size:12px;color:#8b8ba0;text-decoration:line-through;"></div>
            <div id="pkgPrice_pkg_40000" style="font-size:22px;font-weight:800;color:#6c47ff;">40,000원</div>
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
            <div id="pkgPriceOriginal_pkg_60000" style="display:none;font-size:12px;color:#8b8ba0;text-decoration:line-through;"></div>
            <div id="pkgPrice_pkg_60000" style="font-size:22px;font-weight:800;color:#6c47ff;">60,000원</div>
          </div>
        </div>
      </div>
    </div>
    <button id="chargeCta" onclick="startPayment()"
            style="width:100%;padding:16px;background:linear-gradient(135deg,#6c47ff,#a855f7);border:none;border-radius:16px;color:white;font-size:24px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;opacity:0.5;pointer-events:none;transition:all 0.2s;">
      <i class="fas fa-credit-card"></i>
      <span id="ctaLabel" data-i18n="pkg-btn">패키지를 선택하세요</span>
    </button>

    <p style="margin-top:14px;font-size:11px;line-height:1.6;color:#8b8ba0;text-align:center;">
      충전한 크레딧의 사용 기한은 결제일로부터 1년이며, 기한 내 미사용한 크레딧은 소멸됩니다.<br />
      환불은 결제에 사용된 결제수단(카드)으로만 처리됩니다. 자세한 내용은 <a href="/terms#refund" target="_blank" style="color:#a78bfa;">환불정책</a>을 확인해주세요.
    </p>

  </div>
</div>

</body>
</html>`;V.get(`/share/:jobId/:idx`,async e=>{let t=e.env.LOOKBOOK_DB,n=e.req.param(`jobId`),r=parseInt(e.req.param(`idx`)||`0`,10),i=t=>{let i=`${$(e)}/share/${n}/${r}`,a=t.isGhostCut?`상품 이미지로 누끼컷 만들기`:`상품 이미지로 모델컷 만들기`,o=t.isGhostCut?`클릭1번으로 AI누끼컷이 무료로 만들어 진다고?`:`클릭4번으로 AI모델컷이 무료로 만들어 진다고?`,s=t.isGhostCut?`/ghostcut`:`/generator`,l=``;if(t.state===`ok`){let e=t.sourceTabs||[];l=`
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
            <p class="share-title">${a}</p>
            <p class="share-desc">${o}</p>
            <a href="${s}" class="share-cta"><i class="fas fa-wand-magic-sparkles"></i> 나도 해보기</a>
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
        <\/script>`}else l=t.state===`expired`?`
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
  <meta property="og:title" content="${a}" />
  <meta property="og:description" content="${o}" />
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
    .share-tab { flex: 1; min-width: 60px; background: #23233d; color: #a0a0c0; border: none; border-radius: 10px; padding: 8px 4px; font-size: 16.5px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s, color 0.15s; }
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
  ${l}
</body>
</html>`};if(!n||isNaN(r))return e.html(i({state:`notfound`}),404);try{let a=await t.prepare(`SELECT image_urls, expires_at, model_id, bg_id, kind, video_url, model_name FROM generation_logs WHERE job_id = ? ORDER BY id DESC LIMIT 1`).bind(n).first(),o=a?.kind===`video`,s=!!(a?.model_name&&String(a.model_name).startsWith(`고스트컷·`));if(!a||(o?!a.video_url:!a.image_urls))return e.html(i({state:`notfound`}),404);if(a.expires_at&&new Date(String(a.expires_at).replace(` `,`T`)+`Z`).getTime()<=Date.now())return e.html(i({state:`expired`}));let l;if(o)l=a.video_url;else{let e=[];try{e=JSON.parse(a.image_urls)}catch{}l=e[r]}if(!l)return e.html(i({state:`notfound`}),404);let u=$(e),d=`${u}/api/proxy/gen-image?url=${encodeURIComponent(l)}`,f=[],p=e.env?.LOOKBOOK_KV;if(p){let e=await p.get(`clothing_img:${n}`);if(e)try{let t=JSON.parse(e);t.forEach((e,r)=>{f.push({label:t.length>1?`의상${r+1}`:`의상`,url:`${u}/api/proxy/clothing/${n}/${r}`})})}catch{}}return a.model_id&&f.push({label:`모델`,url:`${u}/api/proxy/custom-model/${a.model_id}`}),a.bg_id&&f.push({label:`배경`,url:`${u}/api/proxy/custom-bg/${a.bg_id}`}),e.html(i({state:`ok`,imageUrl:d,isVideo:o,sourceTabs:f,resultTab:{label:o?`생성결과 영상`:`생성결과`,url:d},isGhostCut:s}))}catch(t){return console.error(`Share page error:`,t),e.html(i({state:`notfound`}),500)}}),V.get(`/terms`,e=>e.html(`<!DOCTYPE html>
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
  <p>③ 이용자가 서비스를 통해 생성한 이미지·영상 등 결과물을 상업적 용도(온라인/오프라인 판매, 광고, 마케팅 등)로 사용함에 따라 발생하는 저작권·상표권·초상권 등 제3자 권리 침해, 표시·광고 관련 법령 위반, 소비자 분쟁, 그 밖의 일체의 법적 책임 및 손해는 전적으로 이를 상업적으로 활용한 이용자 본인에게 있으며, 회사(벌거벗은호랑이)는 이에 대해 어떠한 법적 책임도 지지 않습니다.</p>
  <p>④ 이용자는 결과물을 상업적으로 활용하기 전, 원본 이미지에 대한 정당한 권리(저작권, 상표권, 촬영 대상자의 초상권 동의 등)를 보유하고 있는지 스스로 확인할 책임이 있습니다.</p>

  <h2 id="refund">제8조 (청약철회 및 환불)</h2>
  <p>① 이용자는 크레딧 결제일로부터 7일 이내에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조에 따라 청약철회를 요청할 수 있습니다. 단, 해당 크레딧을 일부라도 사용(이미지 생성)한 경우에는 사용분을 제외한 잔여 크레딧에 한해 환불이 가능합니다.</p>
  <p>② 크레딧을 전부 사용한 경우, 또는 결제일로부터 7일이 경과한 경우에는 원칙적으로 청약철회 및 환불이 제한됩니다.</p>
  <p>③ 서비스 오류(AI 생성 실패, 결제 중복 등) 등 회사의 귀책사유로 정상적인 서비스 제공이 불가능한 경우, 이용자는 사용 여부와 관계없이 전액 환불을 요청할 수 있습니다.</p>
  <p>④ 환불 신청은 아래 문의처로 결제 정보(주문번호, 결제일시, 결제수단)와 함께 요청해 주시기 바랍니다. 환불은 신청 접수 후 3영업일 이내에 결제 수단과 동일한 방법으로 처리됩니다.</p>
  <p>⑤ 이용자의 단순 변심에 의한 환불 시, 이미 사용한 크레딧에 해당하는 금액은 환불 대상에서 제외됩니다.</p>
  <p>⑥ 환불은 결제에 사용된 결제수단(카드) 승인 취소 방식으로만 처리되며, 현금 지급이나 계좌이체를 통한 환불은 불가합니다.</p>
  <p>⑦ 충전된 크레딧의 사용 기한은 결제일로부터 1년이며, 기한 내 사용하지 않은 크레딧은 별도 안내 없이 소멸됩니다.</p>

  <h2>제9조 (분쟁 해결)</h2>
  <p>본 약관과 관련한 분쟁은 대한민국 법률을 적용하며, 관할 법원은 민사소송법에 따릅니다.</p>

  <p style="margin-top:40px; color:#888; font-size:13px;">문의: <a href="mailto:kim4honey@gmail.com">kim4honey@gmail.com</a></p>
</body>
</html>`)),V.get(`/privacy`,e=>e.html(`<!DOCTYPE html>
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
</html>`)),V.get(`/_home_old`,e=>e.redirect(`/generator`,302)),V.get(`/robots.txt`,e=>e.text([`User-agent: *`,`Allow: /`,`Disallow: /dashboard`,`Disallow: /api/`,`Disallow: /admin`,`Sitemap: ${U}/sitemap.xml`].join(`
`),200,{"Content-Type":`text/plain; charset=utf-8`})),V.get(`/sitemap.xml`,e=>{let t=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[{path:`/`,priority:`1.0`,changefreq:`weekly`},{path:`/generator`,priority:`0.9`,changefreq:`weekly`},{path:`/terms`,priority:`0.3`,changefreq:`yearly`},{path:`/privacy`,priority:`0.3`,changefreq:`yearly`}].map(e=>`  <url><loc>${U}${e.path}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`).join(`
`)}\n</urlset>`;return e.text(t,200,{"Content-Type":`application/xml; charset=utf-8`})}),V.get(`/llms.txt`,e=>{let t=`# EZlook

> AI 패션 이미지 생성 플랫폼 — 의류 이미지 한 장으로 온모델 피팅컷과 룩북 세트, 홍보 영상을 자동 생성합니다.

## 서비스 소개
EZlook은 의류 이미지를 업로드하면 AI가 그 옷을 입은 모델의 사진(온모델 피팅컷)을 자동으로 생성해주는 서비스입니다. 촬영 스튜디오나 모델 섭외 없이 몇 번의 클릭만으로 전문적인 패션 이미지를 만들 수 있습니다.

## 주요 기능
- 의류 이미지 업로드 (상의/하의/전체 슬롯별 지정)
- 100종 이상의 AI 모델 프리셋 (성별/연령/체형/피부톤/무드 선택)
- 2,000종 이상의 배경 프리셋
- 평균 30초 내 이미지 생성
- 생성된 이미지 기반 7초 홍보 영상 생성 (음악 포함, 9:16 세로형)
- 룩북 세트 일괄 생성 및 다운로드

## 요금
- 이미지 생성 자체는 무료. 다운로드 시에만 장당 90크레딧 차감
- 크레딧 충전: 스타터(₩20,000 · 1,000크레딧) ~ 베스트 밸류(₩60,000 · 4,000크레딧)
- 회원가입 시 무료 크레딧 지급, 신용카드 등록 불필요

## 링크
- 홈페이지: ${U}/
- 서비스 이용(생성기): ${U}/generator
- 이용약관: ${U}/terms
- 개인정보처리방침: ${U}/privacy
`;return e.text(t,200,{"Content-Type":`text/markdown; charset=utf-8`})});var Vn=[{q:`EZlook은 어떤 서비스인가요?`,a:`의류 이미지 한 장을 업로드하면 AI가 온모델 피팅컷과 룩북 세트를 자동으로 생성해주는 AI 패션 이미지 생성 플랫폼입니다. 촬영 스튜디오나 모델 섭외 없이 몇 번의 클릭만으로 전문적인 착용샷을 만들 수 있습니다.`},{q:`이미지 생성에 비용이 드나요?`,a:`이미지 생성 자체는 무료입니다. 마음에 드는 결과물을 실제 파일로 다운로드할 때만 장당 90크레딧이 차감됩니다.`},{q:`무료로 체험할 수 있나요?`,a:`네, 신용카드 등록 없이 회원가입만 하면 무료 크레딧이 바로 지급되어 AI 룩북 제작을 체험해볼 수 있습니다.`},{q:`영상도 만들 수 있나요?`,a:`네, 생성된 피팅컷 이미지를 기반으로 모델이 자연스럽게 포즈를 취하는 7초 분량의 세로형(9:16) 영상을 만들 수 있습니다.`},{q:`결과물은 얼마나 빨리 나오나요?`,a:`평균 30초, 최대 90초 이내에 고품질 온모델 피팅컷 이미지가 생성됩니다.`},{q:`크레딧은 어떻게 충전하나요?`,a:`월 정액 없이 필요한 만큼만 충전하는 방식입니다. 스타터(₩20,000 · 1,000크레딧)부터 베스트 밸류(₩60,000 · 4,000크레딧)까지 선택할 수 있습니다.`}],Hn=()=>{let e={"@type":`Organization`,name:`EZlook`,alternateName:`벌거벗은호랑이`,url:U,logo:`${U}/static/favicon.svg`,telephone:`070-4581-8166`,address:{"@type":`PostalAddress`,streetAddress:`무심서로 377-3`,addressLocality:`청주시 서원구`,addressRegion:`충청북도`,addressCountry:`KR`}};return[{"@context":`https://schema.org`,"@type":`WebSite`,name:`EZlook`,url:U,publisher:e},{"@context":`https://schema.org`,"@type":`Service`,name:`EZlook AI 패션 룩북 생성 서비스`,serviceType:`AI 패션 이미지/영상 생성`,description:`옷 사진 한 장을 업로드하면 AI 모델이 착용한 온모델 피팅컷과 룩북 세트, 홍보 영상을 자동으로 생성하는 서비스`,provider:e,areaServed:`KR`,offers:[{"@type":`Offer`,name:`스타터`,price:`20000`,priceCurrency:`KRW`,description:`1,000 크레딧 · 이미지 최대 11장`},{"@type":`Offer`,name:`인기 충전권`,price:`40000`,priceCurrency:`KRW`,description:`2,300 크레딧 · 이미지 최대 25장`},{"@type":`Offer`,name:`베스트 밸류`,price:`60000`,priceCurrency:`KRW`,description:`4,000 크레딧 · 이미지 최대 44장`}]},{"@context":`https://schema.org`,"@type":`FAQPage`,mainEntity:Vn.map(e=>({"@type":`Question`,name:e.q,acceptedAnswer:{"@type":`Answer`,text:e.a}}))}].map(e=>`<script type="application/ld+json">${JSON.stringify(e)}<\/script>`).join(`
  `)};V.get(`/`,e=>{let t=`<link rel="canonical" href="${U}/" />\n  <meta property="og:url" content="${U}/" />\n  ${Hn()}`;return e.html(Bn(`AI 온모델 피팅컷 자동 생성`,`
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
    #pricing .pricing-single-card { border-color: #000 !important; }
    #pricing .pricing-select-item.selected { background: #f0f0f0 !important; }
    #pricing .pricing-select-item-tag { background: #000 !important; color: #fff !important; }
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
      </div>
      <div class="navbar-actions" style="position:relative;">
        <div class="locale-switcher" id="localeSwitcher">
          <button type="button" class="locale-switcher-trigger" onclick="toggleLocaleSwitcher()" id="localeSwitcherTrigger" aria-label="언어 선택">
            <i class="fas fa-globe"></i>
            <span id="localeSwitcherLabel">한국어</span>
          </button>
          <div class="locale-switcher-menu" id="localeSwitcherMenu">
            <div class="locale-item" data-locale="ko" onclick="setLocaleOverride('ko')">한국어</div>
            <div class="locale-item" data-locale="en" onclick="setLocaleOverride('en')">English</div>
            <div class="locale-item" data-locale="ja" onclick="setLocaleOverride('ja')">日本語</div>
          </div>
        </div>
        <button class="btn btn-ghost" id="navLoginBtn" onclick="openModal('loginModal')" data-i18n="nav-login">로그인</button>
        <button class="btn btn-primary" id="navSignupBtn" onclick="location.href='/generator'" data-i18n="nav-signup">무료 시작</button>
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
            <a href="/dashboard" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:12px 14px 10px;border-bottom:1px solid #3a3a60;margin-bottom:4px;text-decoration:none;cursor:pointer;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">
              <div id="ddUserName" style="font-size:14px;font-weight:700;color:#f0f0f8;margin-bottom:2px;"></div>
              <div id="ddUserEmail" style="font-size:12px;color:#8b8ba0;margin-bottom:6px;"></div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div id="ddUserCredits" style="font-size:13px;font-weight:600;color:#6c47ff;"></div>
                <button onclick="event.preventDefault();event.stopPropagation();openChargePanel();toggleUserMenu();" style="font-size:16.5px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;" data-i18n="nav-charge">충전</button>
              </div>
            </a>
            <a href="/generator" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">모델컷 만들기</a>
            <a href="/ghostcut" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">누끼컷 만들기</a>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''" data-i18n="nav-history">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="gaEvent('kakao_channel_add_click', Object.assign({source:'user_menu'}, getStoredUtm())); document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <a href="https://www.aifashion.co.kr/" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:10px 14px;font-size:14px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">서비스소개</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:10px 14px;font-size:21px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''" data-i18n="nav-logout">로그아웃</button>
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
          <p class="feature-desc">스튜디오, 스트리트, 카페, 자연 등 2,000가지+ 배경을 제공합니다. 무드에 맞는 배경으로 분위기를 완성하세요.</p>
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
          <p class="feature-desc">생성된 피팅컷을 기반으로 모델이 자연스럽게 포즈를 취하는 7초 세로형 영상을 버튼 한 번으로 만드세요.</p>
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
      <div class="pricing-single-wrap">
        <div class="pricing-single-card">
          <div class="pricing-plan">크레딧 충전</div>
          <div class="pricing-price">
            <span class="amount" id="pricingAmount">₩20,000</span>
            <span class="period">1회 충전</span>
          </div>
          <p class="pricing-desc" id="pricingDesc">1,000 크레딧 · 이미지 최대 11장</p>

          <div class="pricing-select" id="pricingSelect">
            <button type="button" class="pricing-select-trigger" onclick="togglePricingSelect()" id="pricingSelectTrigger" aria-expanded="false">
              <span id="pricingSelectTriggerLabel">20,000원 · 1,000 크레딧</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="pricing-select-menu" id="pricingSelectMenu">
              <div class="pricing-select-item selected" data-amount="20000" data-credits="1000" data-images="11" data-bonus="" onclick="selectPricingTier(this)">
                <div>
                  <div class="pricing-select-item-title">20,000원</div>
                  <div class="pricing-select-item-sub">1,000 크레딧</div>
                </div>
                <i class="fas fa-check"></i>
              </div>
              <div class="pricing-select-item" data-amount="40000" data-credits="2300" data-images="25" data-bonus="✨ 기본 대비 15% 더 받기" onclick="selectPricingTier(this)">
                <div>
                  <div class="pricing-select-item-title">40,000원 <span class="pricing-select-item-tag">인기</span></div>
                  <div class="pricing-select-item-sub">2,300 크레딧</div>
                </div>
                <i class="fas fa-check" style="visibility:hidden;"></i>
              </div>
              <div class="pricing-select-item" data-amount="60000" data-credits="4000" data-images="44" data-bonus="🚀 기본 대비 33% 더 받기" onclick="selectPricingTier(this)">
                <div>
                  <div class="pricing-select-item-title">60,000원</div>
                  <div class="pricing-select-item-sub">4,000 크레딧</div>
                </div>
                <i class="fas fa-check" style="visibility:hidden;"></i>
              </div>
            </div>
          </div>

          <hr class="pricing-divider" />
          <div class="pricing-included-label">제공 내역</div>
          <ul class="pricing-features">
            <li><span class="check">✓</span> 전체 AI 모델 1000종+</li>
            <li><span class="check">✓</span> 전체 배경 2,000종+</li>
            <li><span class="check">✓</span> 스타일샷 세트 생성</li>
            <li><span class="check">✓</span> 일괄 다운로드</li>
          </ul>
          <button class="btn btn-primary btn-full" onclick="location.href='/generator'">충전하고 시작하기</button>
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
        ${Vn.map(e=>`
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
        <p>
          모든 거래에 대한 책임과 환불, 민원 등은 벌거벗은호랑이에서 진행합니다.&nbsp;&nbsp;
          민원 담당자 : 박민호&nbsp;&nbsp;
          담당자 연락처 : 070-4581-8166
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
    <div class="modal-box" style="max-width:630px;">
      <button class="modal-close" onclick="closeModal('loginModal')">×</button>

      <!-- 탭 전환 -->
      <div style="display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid var(--border);">
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:22.5px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;" data-i18n="nav-login">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:22.5px;font-weight:600;color:var(--text-muted);cursor:pointer;" data-i18n="nav-signup2">회원가입</button>
      </div>

      <!-- 소셜 로그인 버튼 -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:22.5px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:22.5px;font-weight:600;color:#3c4043;cursor:pointer;">
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
          <div class="form-group">
            <select class="form-input" id="signupReferrer">
              <option value="">추천인 선택 (선택 사항)</option>
              <option value="BFM회원">BFM회원</option>
              <option value="코오롱 FnC">코오롱 FnC</option>
              <option value="한섬">한섬</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:12px;" data-i18n="signupBtn">가입하고 무료 시작 🎁</button>
        </form>
      </div>

      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:16px;">가입 시 <a href="/terms" target="_blank" style="color:var(--primary);">이용약관</a> 및 <a href="/privacy" target="_blank" style="color:var(--primary);">개인정보처리방침</a>에 동의합니다.</p>
    </div>
  </div>
  `,t,`옷 사진 한 장으로 AI 온모델 피팅컷과 룩북 세트를 무료로 자동 생성하세요. 촬영 스튜디오나 모델 섭외 없이 평균 30초 만에 완성됩니다.`,e.env.GA4_MEASUREMENT_ID))}),V.get(`/dashboard`,e=>e.html(Bn(`내 프로필`,`
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
      font-size: 19.5px;
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
      font-size: 22.5px;
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
    <a href="/generator" class="db-logo">
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

      <!-- 모델컷 만들기 -->
      <a href="/generator" class="db-menu-item">
        <span class="db-menu-label">모델컷 만들기</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 누끼컷 만들기 -->
      <a href="/ghostcut" class="db-menu-item">
        <span class="db-menu-label">누끼컷 만들기</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 생성 내역 -->
      <a href="/dashboard#history" class="db-menu-item" id="menuHistory">
        <span class="db-menu-label">생성 내역</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 크레딧 상세 -->
      <a href="/credits" class="db-menu-item">
        <span class="db-menu-label">크레딧 상세</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 카톡 문의 -->
      <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" class="db-menu-item" onclick="gaEvent('kakao_channel_add_click', Object.assign({source:'user_menu'}, getStoredUtm()))">
        <span class="db-menu-label">카톡 문의</span>
        <span class="db-menu-arrow">›</span>
      </a>

      <!-- 서비스소개 -->
      <a href="https://www.aifashion.co.kr/" class="db-menu-item">
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
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <button onclick="document.getElementById('historyPanel').style.display='none';history.replaceState(null,'','/dashboard');" style="width:36px;height:36px;border:none;background:#2a2a45;border-radius:50%;color:#e0e0f0;font-size:27px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">‹</button>
          <h2 style="font-size:18px;font-weight:700;color:#f0f0f8;">생성 내역</h2>
        </div>
        <!-- 사용자 메뉴 (다른 페이지와 동일한 아바타+드롭다운) -->
        <div style="display:flex;align-items:center;gap:8px;position:relative;flex-shrink:0;">
          <button id="navLoginBtn" onclick="openModal('loginModal')" style="display:none;font-size:18px;padding:6px 12px;background:var(--primary-bg);border:1px solid var(--primary);border-radius:20px;color:var(--primary);cursor:pointer;font-weight:600;">로그인</button>
          <div id="navUserArea" style="display:none;align-items:center;gap:0;position:relative;">
            <span id="navUserCredits" style="display:none;"></span>
            <span id="navUserName" style="display:none;"></span>
            <div id="navUserAvatar" onclick="toggleUserMenu()" style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(108,71,255,0.4);">?</div>
            <div id="userDropdownMenu" style="display:none;position:absolute;top:40px;right:0;background:#1e1e35;border:1px solid #3a3a60;border-radius:16px;padding:6px;min-width:210px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:600;">
              <a href="/dashboard" onclick="document.getElementById('userDropdownMenu').style.display='none';document.getElementById('historyPanel').style.display='none';history.replaceState(null,'','/dashboard');" style="display:block;padding:12px 14px 10px;border-bottom:1px solid #3a3a60;margin-bottom:4px;text-decoration:none;cursor:pointer;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">
                <div id="ddUserName" style="font-size:13px;font-weight:700;color:#f0f0f8;margin-bottom:2px;"></div>
                <div id="ddUserEmail" style="font-size:11px;color:#8b8ba0;margin-bottom:6px;"></div>
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <div id="ddUserCredits" style="font-size:12px;font-weight:600;color:#6c47ff;"></div>
                  <button onclick="event.preventDefault();event.stopPropagation();openChargePanel();toggleUserMenu();" style="font-size:16.5px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;" data-i18n="nav-charge">충전</button>
                </div>
              </a>
              <a href="/generator" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">모델컷 만들기</a>
              <a href="/ghostcut" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">누끼컷 만들기</a>
              <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="gaEvent('kakao_channel_add_click', Object.assign({source:'user_menu'}, getStoredUtm())); document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
              <a href="https://www.aifashion.co.kr/" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">서비스소개</a>
              <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
              <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:9px 12px;font-size:19.5px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''" data-i18n="nav-logout">로그아웃</button>
            </div>
          </div>
        </div>
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
    <button onclick="closeHistModal()" style="position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;background:rgba(255,255,255,0.1);border-radius:50%;color:#fff;font-size:30px;cursor:pointer;">×</button>
    <img id="histModalImg" src="" alt="생성 이미지" draggable="false"
      style="max-width:min(420px,90vw);max-height:calc(100dvh - 140px);object-fit:contain;border-radius:14px;display:block;" />
    <video id="histModalVideo" src="" autoplay loop muted playsinline controls controlsList="nodownload" disablePictureInPicture
      style="max-width:min(420px,90vw);max-height:calc(100dvh - 140px);object-fit:contain;border-radius:14px;display:none;"></video>
    <div id="histModalExpiry" style="font-size:11px;color:#f87171;margin-top:8px;text-align:center;"></div>
    <button id="histModalDownloadBtn" class="result-nav-btn primary" onclick="histModalDownloadClick(this)" style="display:none;width:100%;max-width:220px;margin:14px auto 0;">
      <i class="fas fa-download"></i> 다운로드
    </button>
    <button id="histModalVideoBtn" class="result-nav-btn primary" onclick="startHistVideoGeneration()" style="display:none;width:100%;max-width:220px;margin:10px auto 0;">
      <span class="rnb-badge">50%↓</span>
      <span class="rnb-main"><i class="fas fa-film"></i> 2K 영상 생성</span>
      <span class="rnb-sub">7초 · <s class="rnb-strike">1200</s> <i class="fas fa-coins"></i> 600</span>
    </button>
  </div>

  <!-- 영상 생성 중 오버레이 (generator 페이지의 영상 생성 로딩 화면과 동일 — 대시보드에서는
       position:fixed로 뷰포트 전체를 덮도록 조정) -->
  <div class="generating-view" id="videoGeneratingView" style="position:fixed;z-index:10500;">
    <div class="gen-news-tag" id="videoGenViewNewsHeading" style="display:none;">📰 오늘의 패션 뉴스</div>
    <div class="gen-news" id="videoGenViewNews" style="display:none;"></div>
    <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;color:#fff;">AI가 영상을 생성 중입니다...</h2>
    <div class="gen-progress-bar"><div class="gen-progress-fill" id="videoGenProgressFill" style="width:0%"></div></div>
    <div class="gen-status-text" id="videoGenStatusText">시작 중...</div>
    <div class="gen-status-msgs">
      <div class="gen-msg current" id="vmsg1"><div class="dot"></div> 영상 생성 요청 중...</div>
      <div class="gen-msg" id="vmsg2"><div class="dot"></div> 자연스러운 포즈 동작 생성 중...</div>
      <div class="gen-msg" id="vmsg3"><div class="dot"></div> 배경음악 합성 중...</div>
      <div class="gen-msg" id="vmsg4"><div class="dot"></div> 영상 렌더링 중...</div>
      <div class="gen-msg" id="vmsg5"><div class="dot"></div> 최종 인코딩 중...</div>
    </div>
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
  let _histModalVideoGenCtx = null; // { imageUrl, modelName, bgName } — "다시보기"에서 영상 생성 시 사용
  let _histModalDownloadCtx = null; // { isVideo, jobId, url, imgIdx, thumbUrl } — "다시보기"에서 다운로드 시 사용

  function openHistModal(imgUrl, expiresAt, isVideo, originalUrl, modelName, bgName, jobId, imgIdx, dlLabel, thumbUrl) {
    _histModalUrl = imgUrl;
    const modal = document.getElementById('histImgModal');
    const imgEl = document.getElementById('histModalImg');
    const vidEl = document.getElementById('histModalVideo');
    const videoBtn = document.getElementById('histModalVideoBtn');
    const dlBtn = document.getElementById('histModalDownloadBtn');
    if (isVideo) {
      imgEl.style.display = 'none';
      vidEl.style.display = 'block';
      vidEl.src = imgUrl;
      _histModalVideoGenCtx = null;
      if (videoBtn) videoBtn.style.display = 'none';
    } else {
      vidEl.pause();
      vidEl.removeAttribute('src');
      vidEl.load();
      vidEl.style.display = 'none';
      imgEl.style.display = 'block';
      imgEl.src = imgUrl;
      // 이미지 다시보기일 때만 하단에 "영상 생성" 버튼 노출 (이미 영상인 항목은 대상 아님)
      if (originalUrl && videoBtn) {
        _histModalVideoGenCtx = { imageUrl: originalUrl, modelName: modelName || '패션 모델', bgName: bgName || '스튜디오' };
        videoBtn.style.display = '';
        videoBtn.disabled = false;
        const main = videoBtn.querySelector('.rnb-main');
        if (main) main.innerHTML = '<i class="fas fa-film"></i> 2K 영상 생성';
      } else {
        _histModalVideoGenCtx = null;
        if (videoBtn) videoBtn.style.display = 'none';
      }
    }
    // 다운로드(재다운로드) 버튼 — jobId가 있을 때만 노출. 다운로드를 누르면
    // 기존 목록의 다운로드 버튼과 동일하게(histRowDownload/downloadHistVideo) 처리되며,
    // 완료 시 공유(링크복사/카카오톡) 버튼이 자동으로 함께 노출된다.
    if (jobId && dlBtn) {
      _histModalDownloadCtx = { isVideo: !!isVideo, jobId, url: (isVideo ? imgUrl : (originalUrl || imgUrl)), imgIdx: imgIdx || 0, thumbUrl: thumbUrl || originalUrl || imgUrl };
      dlBtn.style.display = '';
      dlBtn.disabled = false;
      dlBtn.innerHTML = '<i class="fas fa-download"></i> ' + (dlLabel || '다운로드');
    } else {
      _histModalDownloadCtx = null;
      if (dlBtn) dlBtn.style.display = 'none';
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
    _histModalVideoGenCtx = null;
    _histModalDownloadCtx = null;
  }

  // "다시보기" 모달의 다운로드 버튼 — 이미지/영상 여부에 따라 기존 목록의
  // histRowDownload/downloadHistVideo를 그대로 재사용한다(크레딧 차감, 공유 버튼 노출 등 동일 동작).
  function histModalDownloadClick(btn) {
    const ctx = _histModalDownloadCtx;
    if (!ctx) return;
    if (ctx.isVideo) {
      downloadHistVideo(ctx.url, ctx.jobId, btn, ctx.thumbUrl);
    } else {
      histRowDownload(ctx.jobId, ctx.url, ctx.imgIdx, btn);
    }
  }

  // "다시보기" 모달에서 영상 생성 — /api/video/start를 직접 호출 (generator 페이지의
  // 영상 생성 로딩화면 없이, 대시보드 공용 진행 모달(actionProgressModal)을 재사용)
  async function startHistVideoGeneration() {
    const ctx = _histModalVideoGenCtx;
    if (!ctx) return;
    const token = localStorage.getItem('lookbook_token') || '';
    if (!token) { showToast('로그인이 필요합니다.', 'error'); return; }

    const btn = document.getElementById('histModalVideoBtn');
    if (btn) btn.disabled = true;
    _showVideoGeneratingView();

    try {
      const startRes = await fetch('/api/video/start', {
        method: 'POST',
        headers: { 'X-Session-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: ctx.imageUrl, modelName: ctx.modelName, bgName: ctx.bgName }),
      });
      if (startRes.status === 401) {
        _hideVideoGeneratingView();
        showToast('로그인이 필요합니다.', 'error');
        if (btn) btn.disabled = false;
        return;
      }
      if (startRes.status === 402) {
        _hideVideoGeneratingView();
        const errData = await startRes.json();
        showToast(\`크레딧이 부족합니다. (보유: \${errData.available ?? 0}크레딧 / 필요: \${errData.required ?? 600}크레딧)\`, 'error');
        if (btn) btn.disabled = false;
        return;
      }
      if (!startRes.ok) {
        _hideVideoGeneratingView();
        const errData = await startRes.json().catch(() => ({}));
        showToast(errData.message || '영상 생성 요청에 실패했습니다.', 'error');
        if (btn) btn.disabled = false;
        return;
      }
      const startData = await startRes.json();
      if (startData.creditsRemaining !== undefined) {
        const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
        if (cachedUser) { cachedUser.credits = startData.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
        if (AppState.user) AppState.user.credits = startData.creditsRemaining;
        const dbCredEl = document.getElementById('dbCredits');
        if (dbCredEl) dbCredEl.textContent = (startData.creditsRemaining ?? 0).toLocaleString();
      }
      _startVideoFakeProgress();
      await _pollHistVideoStatus(startData.jobId, btn);
    } catch (err) {
      // 네트워크 오류로 요청/응답이 유실된 경우, 서버에는 이미 요청이 접수되어 정상
      // 진행 중일 수 있다 — "실패"로 단정하지 않고 생성내역에서 확인하도록 안내한다.
      console.error('영상 생성 오류:', err);
      _hideVideoGeneratingView();
      showToast('영상 생성 요청 중 네트워크 오류가 발생했습니다. 잠시 후 생성내역에서 확인해주세요.', 'error');
      if (btn) btn.disabled = false;
    }
  }

  async function _pollHistVideoStatus(jobId, btn) {
    try {
      const res = await fetch(\`/api/video/\${jobId}/status\`);
      const data = await res.json();
      if (data.status === 'completed' && data.videoUrl) {
        _hideVideoGeneratingView();
        showToast('영상 생성이 완료되었습니다!', 'success');
        closeHistModal();
        loadHistory();
        return;
      }
      if (data.status === 'failed') {
        _hideVideoGeneratingView();
        if (data.creditsRemaining !== undefined) {
          const cachedUser = JSON.parse(localStorage.getItem('lookbook_user') || 'null');
          if (cachedUser) { cachedUser.credits = data.creditsRemaining; localStorage.setItem('lookbook_user', JSON.stringify(cachedUser)); }
          if (AppState.user) AppState.user.credits = data.creditsRemaining;
          const dbCredEl = document.getElementById('dbCredits');
          if (dbCredEl) dbCredEl.textContent = (data.creditsRemaining ?? 0).toLocaleString();
        }
        showToast(data.error || '영상 생성에 실패했습니다.', 'error');
        if (btn) btn.disabled = false;
        loadHistory();
        return;
      }
      setTimeout(() => _pollHistVideoStatus(jobId, btn), 4000);
    } catch (err) {
      console.error('영상 생성 폴링 오류:', err);
      setTimeout(() => _pollHistVideoStatus(jobId, btn), 5000);
    }
  }
  // "영상을 생성하는 중입니다..." 상태로 방치된 항목을 대시보드에 머무는 동안 주기적으로
  // 재확인한다. 원래 요청을 보낸 브라우저 탭이 네트워크 오류 등으로 폴링을 놓쳐도
  // (예: /api/video/start 응답이 유실되어 클라이언트는 실패로 보이지만 서버·Atlas
  // 쪽에서는 실제로는 정상 진행/완료된 경우), 생성내역 화면에 머무는 동안 자동으로
  // 상태가 바로잡히도록 하기 위함. 처리 중인 영상이 하나도 없으면 재확인을 멈춘다.
  let _historyPollTimer = null;
  // ⚠️ _selfHealStuckVideo는 절대 loadHistory()를 다시 호출하지 않는다.
  // 예전 버전은 상태가 바뀌면 곧바로 loadHistory()를 재호출했는데, 그 loadHistory()가
  // 다시 각 처리중 항목마다 _selfHealStuckVideo를 호출하는 구조라 — 만약 서버 쪽
  // 완료 처리(video_url 저장)가 바로 다음 히스토리 조회에 아직 반영되기 전이면
  // (레이스 컨디션 등 어떤 이유로든) 이 둘이 서로를 지연 없이 무한히 재호출하는
  // 폭주 루프가 될 수 있었다 — 실제로 재현됨(초당 수십 회 요청). 이게 "계속
  // 깜빡인다"는 리포트의 진짜 원인으로 추정된다.
  // 이제 이 함수는 서버 쪽 상태(및 필요시 크레딧 환불)만 갱신해두고, 화면 반영은
  // 오직 20초 주기 스케줄러(loadHistory 하단)에만 맡긴다 — 재귀 호출 경로 자체를 제거.
  const _selfHealInFlight = new Set();
  async function _selfHealStuckVideo(jobId) {
    if (!jobId || _selfHealInFlight.has(jobId)) return;
    _selfHealInFlight.add(jobId);
    try {
      const res = await fetch(\`/api/video/\${jobId}/status\`);
      const data = await res.json();
      if ((data.status === 'completed' || data.status === 'failed') && data.creditsRemaining !== undefined) {
        const dbCredEl = document.getElementById('dbCredits');
        if (dbCredEl) dbCredEl.textContent = (data.creditsRemaining ?? 0).toLocaleString();
      }
    } catch (e) { /* 조용히 무시 — 다음 재확인 때 재시도 */ }
    finally { _selfHealInFlight.delete(jobId); }
  }

  // silent=true: 20초 자동 재확인용 — 로딩 placeholder를 띄우지 않고, 실제 데이터가
  // 바뀌었을 때만 DOM을 교체해 화면이 깜빡이지 않도록 한다.
  // (렌더링된 HTML 문자열을 element.innerHTML과 직접 비교하는 방식은 브라우저가
  //  마크업을 재직렬화하며 자체 정규화하기 때문에(예: <img ... /> 의 self-close
  //  슬래시가 사라짐) 항상 다르다고 오판할 수 있어 신뢰할 수 없다 — 대신 로그
  //  데이터 자체의 signature를 비교한다.)
  let _historySignature = null;
  let _loadHistoryInFlight = false;
  async function loadHistory(silent) {
    // 여러 stuck 영상 항목이 시차를 두고 각자 self-heal되면 loadHistory가 겹쳐 호출될 수 있다.
    // 겹치면 _historyPollTimer/_historySignature를 서로 덮어써 재확인 주기가 꼬일 수 있으므로,
    // 이미 진행 중이면 비-silent 호출만 재시도하고(사용자가 방금 직접 연 경우 놓치지 않도록)
    // silent 호출은 그냥 건너뛴다(다음 20초 주기에 다시 시도됨).
    if (_loadHistoryInFlight) { if (!silent) setTimeout(() => loadHistory(false), 300); return; }
    _loadHistoryInFlight = true;
    if (_historyPollTimer) { clearTimeout(_historyPollTimer); _historyPollTimer = null; }
    const list = document.getElementById('historyList');
    if (!silent) list.innerHTML = '<div style="text-align:center;padding:40px;color:#5a5a7a;">불러오는 중...</div>';
    try {
      const token = localStorage.getItem('lookbook_token') || '';
      const res = await fetch('/api/generation/history', { headers: { 'X-Session-Token': token } });
      if (!res.ok) throw new Error('서버 오류');
      const data = await res.json();
      const logs = data.logs || [];

      const signature = JSON.stringify(logs.map(l => [l.id, l.status, l.video_url, l.image_urls, l.downloaded_indices, l.expires_at]));
      const changed = signature !== _historySignature;
      _historySignature = signature;

      if (!logs.length) {
        if (!silent || changed) {
          list.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#5a5a7a;font-size:14px;"><div style="font-size:40px;margin-bottom:12px;">🎨</div>아직 생성 내역이 없어요.<br/>이미지를 생성해보세요!</div>';
        }
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
            if (log.status === 'failed') {
              rows.push(\`<div class="hist-row">
                <div class="hist-thumb hist-thumb--empty"><i class="fas fa-triangle-exclamation"></i></div>
                <div class="hist-body">
                  <div class="hist-meta">#\${seqLabel} · \${dateStr} · 영상</div>
                  <div class="hist-meta-sub">생성 오류로 크레딧이 차감되지 않았습니다</div>
                  <div class="hist-actions">
                    <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
                  </div>
                </div>
              </div>\`);
              return;
            }
            // 처리 중으로 방치된 작업은 대시보드 방문 시 상태를 재확인해 자동으로 실패/환불 처리되도록 함
            _selfHealStuckVideo(log.job_id);
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
          const vHistModalArgs = \`'\${vUrlEsc}','\${expEsc}',true,null,null,null,'\${vJobIdEsc}',0,'다운로드','\${vThumbEsc}'\`;
          rows.push(\`<div class="hist-row">
            <div class="hist-thumb hist-thumb--video" onclick="openHistModal(\${vHistModalArgs})">
              <video src="\${vProxyUrl}" muted preload="metadata" onerror="this.parentNode.innerHTML='<i class=&quot;fas fa-film&quot;></i>'"></video>
              <i class="fas fa-play hist-thumb-play"></i>
            </div>
            <div class="hist-body">
              <div class="hist-meta">#\${seqLabel} · \${dateStr} · \${expLabel || ''} · 영상</div>
              <div class="hist-actions">
                <button class="hist-action-btn" onclick="openHistModal(\${vHistModalArgs})"><i class="fas fa-eye"></i> 다시보기</button>
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
            <div class="hist-thumb hist-thumb--empty"><i class="fas fa-triangle-exclamation"></i></div>
            <div class="hist-body">
              <div class="hist-meta">#\${seqLabel} · \${dateStr}</div>
              <div class="hist-meta-sub">생성 오류로 크레딧이 차감되지 않았습니다</div>
              <div class="hist-actions">
                <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
              </div>
            </div>
          </div>\`);
          return;
        }

        // 누끼컷/디테일컷 내역은 model_name이 내부적으로 여전히 "고스트컷"으로 시작한다
        // (표시명은 누끼컷으로 변경됐지만, DB에 이미 저장된 값과의 하위 호환을 위해 내부
        // 접두어는 그대로 유지). 이 항목은 모델을 입힌 영상 생성 대상이 아니므로
        // "다시보기"에서 2K 영상 생성 버튼을 노출하지 않는다.
        const isGhostCutRow = /^고스트컷/.test(log.model_name || '');

        urls.forEach((u, ui) => {
          const rowSeq = urls.length > 1 ? \`\${seqLabel}-\${ui+1}\` : seqLabel;
          const proxyUrl = u.startsWith('/api/proxy') ? u : \`/api/proxy/gen-image?url=\${encodeURIComponent(u)}\`;
          const urlEsc = proxyUrl.replace(/'/g,"\\\\'");
          const origEsc = u.replace(/'/g,"\\\\'");
          const jobIdEsc = (log.job_id || '').replace(/'/g,"\\\\'");
          const modelEsc = (log.model_name || '패션 모델').replace(/'/g,"\\\\'");
          const bgEsc = (log.bg_name || '스튜디오').replace(/'/g,"\\\\'");

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
          const histModalArgs = isGhostCutRow
            ? \`'\${urlEsc}','\${expEsc}',false,null,null,null,'\${jobIdEsc}',\${ui},'\${dlLabel}','\${origEsc}'\`
            : \`'\${urlEsc}','\${expEsc}',false,'\${origEsc}','\${modelEsc}','\${bgEsc}','\${jobIdEsc}',\${ui},'\${dlLabel}','\${origEsc}'\`;

          rows.push(\`<div class="hist-row">
            <div class="hist-thumb" onclick="openHistModal(\${histModalArgs})">
              <img src="\${proxyUrl}" alt="생성 이미지" onerror="this.parentNode.innerHTML='<i class=&quot;fas fa-image&quot;></i>'" />
            </div>
            <div class="hist-body">
              <div class="hist-meta">#\${rowSeq} · \${dateStr} · \${expLabel || ''}</div>
              <div class="hist-actions">
                <button class="hist-action-btn" onclick="openHistModal(\${histModalArgs})"><i class="fas fa-eye"></i> 다시보기</button>
                <button class="hist-action-btn primary" id="histDlBtn-\${log.id}-\${ui}" onclick="histRowDownload('\${jobIdEsc}','\${origEsc}',\${ui},this)"><i class="fas fa-download"></i> \${dlLabel}</button>
                <button class="hist-action-btn danger" onclick="deleteHistItem(\${log.id})"><i class="fas fa-trash"></i> 삭제</button>
              </div>
            </div>
          </div>\`);
        });
      });

      if (!silent || changed) list.innerHTML = rows.join('');

      // 처리 중인 영상이 남아있으면 20초 후 조용히(silent) 다시 확인 — 데이터가 바뀌지 않는 한
      // 화면을 다시 그리지 않으므로 깜빡이지 않는다. 모두 해소되면 자동으로 재확인을 멈춘다.
      const stillPending = logs.some(l => l.kind === 'video' && !l.video_url && l.status !== 'failed');
      if (stillPending) {
        _historyPollTimer = setTimeout(() => loadHistory(true), 20000);
      }
    } catch (e) {
      if (!silent) list.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;font-size:13px;">불러오기 실패</div>';
    } finally {
      _loadHistoryInFlight = false;
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
  `,``,zn,e.env.GA4_MEASUREMENT_ID))),V.get(`/credits`,e=>e.html(Bn(`크레딧 상세`,`
  <div class="toast-container" id="toastContainer"></div>

  <style>
    body { background: #0d0d1a; }
    .cr-wrap {
      min-height: 100vh;
      padding: 48px 16px 80px;
      background: #0d0d1a;
    }
    .cr-inner { max-width: 480px; margin: 0 auto; }
    .cr-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
      text-decoration: none;
    }
    .cr-logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg,#6c47ff,#a855f7);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .cr-logo-text { font-size: 18px; font-weight: 800; color: #f0f0f8; }
    .cr-back {
      width: 36px; height: 36px; border: none; background: #2a2a45; border-radius: 50%;
      color: #e0e0f0; font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      text-decoration: none;
    }
  </style>

  <div class="cr-wrap">
    <div class="cr-inner">
      <a href="/generator" class="cr-logo">
        <div class="cr-logo-icon">✨</div>
        <span class="cr-logo-text">EZlook</span>
      </a>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <a href="/dashboard" class="cr-back">‹</a>
        <h1 style="font-size:18px;font-weight:700;color:#f0f0f8;margin:0;">크레딧 상세</h1>
      </div>

      <!-- 잔여 크레딧 -->
      <div style="background:linear-gradient(135deg,#1e1e35,#252545);border:1px solid rgba(108,71,255,0.3);border-radius:16px;padding:16px 20px;margin:16px 0;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:12px;color:#8b8ba0;margin-bottom:4px;">잔여 크레딧</div>
          <div id="creditsPanelBalance" style="font-size:28px;font-weight:800;color:#a78bfa;">-</div>
        </div>
        <button class="db-charge-btn" onclick="openChargePanel()" style="padding:9px 20px;background:#6c47ff;color:white;border:none;border-radius:24px;font-size:19.5px;font-weight:700;cursor:pointer;">충전</button>
      </div>

      <!-- 유효기간/환불 안내 -->
      <div style="background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.25);border-radius:10px;padding:10px 14px;margin-bottom:20px;">
        <span style="font-size:12px;color:#c4b5fd;line-height:1.5;">충전한 크레딧의 사용 기한은 결제일로부터 1년이며, 기한 내 미사용한 크레딧은 소멸됩니다. 환불은 결제에 사용된 결제수단(카드)으로만 처리됩니다. 자세한 내용은 <a href="/terms#refund" target="_blank" style="color:#a78bfa;">환불정책</a>을 확인해주세요.</span>
      </div>

      <div id="creditsList" style="display:flex;flex-direction:column;gap:10px;">
        <div style="text-align:center;padding:60px 20px;color:#5a5a7a;font-size:14px;">
          <div style="font-size:40px;margin-bottom:12px;">💎</div>
          크레딧 내역을 불러오는 중...
        </div>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      await verifySession();
      if (!AppState.user) {
        window.location.href = '/';
        return;
      }
      loadCreditHistory();
    });
  <\/script>
  `,``,`내 크레딧 충전/사용 내역과 잔여 크레딧을 확인하세요.`,e.env.GA4_MEASUREMENT_ID)));var Un=(e,t=`model`)=>{let n=t===`ghostcut`?`상품(옷) 이미지 한 장만 업로드하면 AI가 카테고리를 자동 인식해 고스트 마네킹(투명 마네킹) 스타일의 상품컷으로 변환해드립니다.`:`옷 사진을 업로드하고 AI 모델과 배경을 선택하면 평균 30초 만에 온모델 피팅컷이 완성됩니다. 신용카드 없이 무료로 체험해보세요.`,r=t===`ghostcut`?`무료 AI 누끼컷 생성기`:`무료 AI 룩북 생성기`,i=`<script>window.__EZLOOK_MODE__=${JSON.stringify(t)};<\/script>`;return e.html(Bn(r,`
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
      <a href="/generator" class="gapp-logo"><span class="gapp-logo-ez">EZ</span><span class="gapp-logo-look">look</span></a>
      <!-- 로그인 상태 표시 -->
      <div style="display:flex;align-items:center;gap:8px;position:relative;">
        <button id="navLoginBtn" onclick="openModal('loginModal')" style="font-size:18px;padding:6px 12px;background:var(--primary-bg);border:1px solid var(--primary);border-radius:20px;color:var(--primary);cursor:pointer;font-weight:600;">로그인</button>
        <div id="navUserArea" style="display:none;align-items:center;gap:0;position:relative;">
          <span id="navUserCredits" style="display:none;"></span>
          <span id="navUserName" style="display:none;"></span>
          <div id="navUserAvatar" onclick="toggleUserMenu()" style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:700;cursor:pointer;user-select:none;box-shadow:0 2px 8px rgba(108,71,255,0.4);">?</div>
          <div id="userDropdownMenu" style="display:none;position:absolute;top:38px;right:0;background:#1e1e35;border:1px solid #3a3a60;border-radius:16px;padding:6px;min-width:210px;box-shadow:0 12px 32px rgba(0,0,0,0.6);z-index:10001;">
            <a href="/dashboard" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:12px 14px 10px;border-bottom:1px solid #3a3a60;margin-bottom:4px;text-decoration:none;cursor:pointer;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">
              <div id="ddUserName" style="font-size:13px;font-weight:700;color:#f0f0f8;margin-bottom:2px;"></div>
              <div id="ddUserEmail" style="font-size:11px;color:#8b8ba0;margin-bottom:6px;"></div>
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div id="ddUserCredits" style="font-size:12px;font-weight:600;color:#6c47ff;"></div>
                <button onclick="event.preventDefault();event.stopPropagation();openChargePanel();toggleUserMenu();" style="font-size:16.5px;padding:3px 10px;background:#6c47ff;color:white;border:none;border-radius:20px;cursor:pointer;font-weight:600;" data-i18n="nav-charge">충전</button>
              </div>
            </a>
            <a href="/generator" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">모델컷 만들기</a>
            <a href="/ghostcut" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">누끼컷 만들기</a>
            <a href="/dashboard#history" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''" data-i18n="nav-history">생성 내역</a>
            <a href="http://pf.kakao.com/_wFyCX/chat" target="_blank" onclick="gaEvent('kakao_channel_add_click', Object.assign({source:'user_menu'}, getStoredUtm())); document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">카톡 문의</a>
            <a href="https://www.aifashion.co.kr/" onclick="document.getElementById('userDropdownMenu').style.display='none';" style="display:block;padding:9px 12px;font-size:13px;color:#e0e0f0;text-decoration:none;border-radius:10px;" onmouseover="this.style.background='#2a2a4a'" onmouseout="this.style.background=''">서비스소개</a>
            <div style="height:1px;background:#3a3a60;margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:block;width:100%;text-align:left;padding:9px 12px;font-size:19.5px;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:10px;" onmouseover="this.style.background='#ef444411'" onmouseout="this.style.background=''" data-i18n="nav-logout">로그아웃</button>
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
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;color:#fff;">AI가 이미지를 생성 중입니다...</h2>
          <div class="gen-progress-bar"><div class="gen-progress-fill" id="genProgressFill" style="width:0%"></div></div>
          <div class="gen-status-text" id="genStatusText" data-i18n="gen-status-init" style="display:none;">시작 중...</div>
          <div class="gen-status-msgs">
            <div class="gen-msg current" id="msg1"><div class="dot"></div> 의류 이미지 분석 중...</div>
            <div class="gen-msg" id="msg2"><div class="dot"></div> AI 모델 피팅 적용 중...</div>
            <div class="gen-msg" id="msg3"><div class="dot"></div> 배경 합성 중...</div>
            <div class="gen-msg" id="msg4"><div class="dot"></div> 이미지 품질 향상 중...</div>
            <div class="gen-msg" id="msg5"><div class="dot"></div> 최종 렌더링 중...</div>
          </div>
          <div class="gen-video-promo-box">
            <p class="gen-video-promo-text" id="genVideoPromoText"><i class="fas fa-film"></i> 이미지가 생성되면 클릭한번으로 2K 고화질 영상 생성이 가능합니다.</p>
            <div class="gen-video-promo-player" id="genLoadingVideoPlayer" style="display:none;"></div>
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
        <!-- 영상 생성 중 오버레이 (이미지 생성 로딩 화면과 동일한 구조, step-4 내부) -->
        <div class="generating-view" id="videoGeneratingView">
          <div class="gen-news-tag" id="videoGenViewNewsHeading" style="display:none;">📰 오늘의 패션 뉴스</div>
          <div class="gen-news" id="videoGenViewNews" style="display:none;"></div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;color:#fff;">AI가 영상을 생성 중입니다...</h2>
          <div class="gen-progress-bar"><div class="gen-progress-fill" id="videoGenProgressFill" style="width:0%"></div></div>
          <div class="gen-status-text" id="videoGenStatusText">시작 중...</div>
          <div class="gen-status-msgs">
            <div class="gen-msg current" id="vmsg1"><div class="dot"></div> 영상 생성 요청 중...</div>
            <div class="gen-msg" id="vmsg2"><div class="dot"></div> 자연스러운 포즈 동작 생성 중...</div>
            <div class="gen-msg" id="vmsg3"><div class="dot"></div> 배경음악 합성 중...</div>
            <div class="gen-msg" id="vmsg4"><div class="dot"></div> 영상 렌더링 중...</div>
            <div class="gen-msg" id="vmsg5"><div class="dot"></div> 최종 인코딩 중...</div>
          </div>
        </div>
        <!-- 디테일컷 생성 중 오버레이 (누끼컷 전용, 영상 생성 오버레이와 동일한 구조) -->
        <div class="generating-view" id="detailCutGeneratingView">
          <div class="gen-news-tag" id="detailCutGenViewNewsHeading" style="display:none;">📰 오늘의 패션 뉴스</div>
          <div class="gen-news" id="detailCutGenViewNews" style="display:none;"></div>
          <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;color:#fff;">AI가 디테일컷을 생성 중입니다...</h2>
          <div class="gen-progress-bar"><div class="gen-progress-fill" id="detailCutGenProgressFill" style="width:0%"></div></div>
          <div class="gen-status-text" id="detailCutGenStatusText">시작 중...</div>
          <div class="gen-status-msgs">
            <div class="gen-msg current" id="dmsg1"><div class="dot"></div> 디테일컷 생성 요청 중...</div>
            <div class="gen-msg" id="dmsg2"><div class="dot"></div> 디자인 디테일 부위 분석 중...</div>
            <div class="gen-msg" id="dmsg3"><div class="dot"></div> 클로즈업 이미지 렌더링 중...</div>
            <div class="gen-msg" id="dmsg4"><div class="dot"></div> 최종 마무리 중...</div>
          </div>
        </div>
        <div class="gslide-scroll" style="padding-top:12px;">
          <!-- 디테일컷 결과 — 누끼컷 전용, 생성 완료 후에만 표시. 누끼컷 원본 이미지보다 위에 배치 -->
          <div id="detailCutResultsSection" style="display:none;padding:0 16px 16px;">
            <p style="font-size:12px;font-weight:700;color:#8b8ba0;margin:0 0 10px;">디테일컷</p>
            <div id="detailCutResultsGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
          </div>
          <div class="results-grid" id="resultsGrid" style="padding:0 16px;"></div>
          <!-- 이미지 하단 ~ 버튼 상단 사이 안내 메시지 — 디테일컷 생성 완료 후에는 숨김(재생성은 원본 이미지 기준 안내라 혼동 방지) -->
          <div id="resultInfoMsg" style="padding:18px 16px 4px;text-align:center;">
            <p style="font-size:13px;color:#8b8ba0;line-height:1.6;margin:0;">
              <span style="color:#9b7cff;font-weight:600;">이미지 생성은 크레딧이 차감되지 않습니다.</span><br/>
              오류가 있거나 마음에 들지 않으면 아래 <strong style="color:#e0e0f0;">🔄 재생성</strong> 버튼을 눌러보세요.
            </p>
          </div>
        </div>
        <div class="gslide-nav" id="step4Nav">
          <div class="result-nav-grid">
            <button class="result-nav-btn primary" onclick="downloadWithCreditCheck(0)">
              <span class="rnb-badge">50%↓</span>
              <span class="rnb-main"><i class="fas fa-download"></i> 이미지 다운</span>
              <span class="rnb-sub" id="downloadActionSub"><s class="rnb-strike">180</s> <i class="fas fa-coins"></i> 90</span>
            </button>
            <button class="result-nav-btn primary" id="videoActionBtn" onclick="startVideoGeneration()">
              <span class="rnb-badge">50%↓</span>
              <span class="rnb-main"><i class="fas fa-film"></i> 2K 영상 생성</span>
              <span class="rnb-sub" id="videoActionSub">7초 · <s class="rnb-strike">1200</s> <i class="fas fa-coins"></i> 600</span>
            </button>
            <button class="result-nav-btn" id="newProjectBtnCard" onclick="window.location.href='/generator'">
              <span class="rnb-main"><i class="fas fa-plus"></i> 새 프로젝트</span>
            </button>
            <button class="result-nav-btn" id="regenBtnCard" onclick="regenFromCard(0)">
              <span class="rnb-main"><i class="fas fa-rotate-right"></i> 재생성</span>
            </button>
            <!-- 누끼컷 전용 — initGhostCutUI()에서 노출. "재생성" 버튼이 누끼컷에선 숨겨지므로
                 (아래 initGhostCutUI 참고) 그리드 auto-flow로 자연스럽게 "새 프로젝트" 우측에 배치됨 -->
            <button class="result-nav-btn primary" id="detailCutBtn" onclick="openDetailCutMenu()" style="display:none;">
              <span class="rnb-badge">50%↓</span>
              <span class="rnb-main"><i class="fas fa-magnifying-glass"></i> 디테일컷 추가</span>
            </button>
            <!-- 누끼컷 전용 재생성 — 같은 업로드 이미지로 다시 생성(페이지 새로고침 없음).
                 "디테일컷 추가" 바로 다음 DOM 순서라 grid auto-flow로 그 우측에 배치됨 -->
            <button class="result-nav-btn" id="gcRegenBtn" onclick="startGhostCutGeneration()" style="display:none;">
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
          <button id="regenBtn" onclick="regenImage()" style="display:flex;align-items:center;gap:6px;padding:10px 16px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:21px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.85)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">
            <i class="fas fa-redo-alt"></i>
            <span id="regenBtnText">재생성</span>
            <span id="regenCounter" style="font-size:12px;opacity:0.8;"></span>
          </button>
          <!-- 다운로드 버튼 -->
          <button id="downloadBtn" onclick="downloadImage()" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(99,102,241,0.85);backdrop-filter:blur(8px);color:white;border:1px solid rgba(255,255,255,0.25);border-radius:8px;font-size:21px;font-weight:600;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,1)'" onmouseout="this.style.background='rgba(99,102,241,0.85)'">
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
      <!-- 누끼컷 원본 이미지 다운로드 완료 시에만 노출 — 카카오톡 공유 버튼 아래 -->
      <button id="actionProgressDetailCutBtn" class="action-progress-share-btn" style="display:none;width:100%;margin-top:8px;" onclick="goToDetailCutFromShare()">
        <i class="fas fa-magnifying-glass"></i> 디테일컷 생성하기
      </button>
      <div class="gen-news" id="actionProgressNews" style="display:none;"></div>
      <button id="actionProgressCloseBtn" class="action-progress-close" onclick="closeActionProgress()" style="display:none;">닫기</button>
    </div>
  </div>

  <!-- 디테일컷 장수 선택 모달 (누끼컷 전용) -->
  <div class="modal-overlay" id="detailCutModal" style="z-index:10500;">
    <div class="modal-box" style="max-width:420px;padding:48px 24px;">
      <button class="modal-close" onclick="closeModal('detailCutModal')">×</button>
      <!-- 다운로드 전 상태에서 1~4장 버튼을 눌러 서버가 403(DOWNLOAD_REQUIRED)을 반환했을 때만 노출.
           모달을 닫지 않고 바로 아래 다운로드 CTA로 이어서 클릭할 수 있게 안내한다. -->
      <div id="detailCutModalError" class="detail-cut-modal-error" style="display:none;"></div>
      <!-- 누끼컷 원본 이미지를 아직 다운로드하지 않았을 때만 노출 — openDetailCutMenu()에서 토글 -->
      <div id="detailCutDownloadFirstCta" style="display:none;margin-bottom:16px;">
        <button class="result-nav-btn primary" style="width:100%;min-height:78px;" onclick="downloadThenPromptDetailCut()">
          <span class="rnb-main"><i class="fas fa-download"></i> 이미지 다운로드</span>
        </button>
      </div>
      <h3 style="margin:0 0 6px;font-size:17px;font-weight:800;color:var(--text-primary);">디테일컷 추가</h3>
      <p style="margin:0 0 18px;font-size:13px;color:#5c5c70;line-height:1.5;">생성된 이미지에서 디자인·디테일이 돋보이는 부위를 클로즈업한 이미지를 자동으로 만들어드려요. 생성은 무료 입니다.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button class="result-nav-btn primary" onclick="startDetailCutGeneration(1)" style="min-height:72px;">
          <span class="rnb-main">1장 생성</span>
        </button>
        <button class="result-nav-btn primary" onclick="startDetailCutGeneration(2)" style="min-height:72px;">
          <span class="rnb-main">2장 생성</span>
        </button>
        <button class="result-nav-btn primary" onclick="startDetailCutGeneration(3)" style="min-height:72px;">
          <span class="rnb-main">3장 생성</span>
        </button>
        <button class="result-nav-btn primary" onclick="startDetailCutGeneration(4)" style="min-height:72px;">
          <span class="rnb-main">4장 생성</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Auth Modal (Generator 내부) -->
  <div class="modal-overlay" id="loginModal" style="z-index:10000;">
    <div class="modal-box" style="max-width:630px;">
      <button class="modal-close" onclick="closeModal('loginModal')">×</button>
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:28px;margin-bottom:8px;">✨</div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px;">AI 생성을 시작하려면<br/>로그인이 필요해요</h2>
        <p style="font-size:13px;color:var(--text-muted);">가입 즉시 무료 크레딧을 드려요!</p>
      </div>
      <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border);">
        <button id="tabLogin"  onclick="switchAuthTab('login')"  style="flex:1;padding:10px;background:none;border:none;font-size:22.5px;font-weight:700;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px;cursor:pointer;" data-i18n="nav-login">로그인</button>
        <button id="tabSignup" onclick="switchAuthTab('signup')" style="flex:1;padding:10px;background:none;border:none;font-size:22.5px;font-weight:600;color:var(--text-muted);cursor:pointer;" data-i18n="nav-signup2">회원가입</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <button onclick="oauthLogin('kakao', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#FEE500;border:none;border-radius:10px;font-size:22.5px;font-weight:700;color:#3C1E1E;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.628 5.073 4.09 6.51L4.993 21l4.457-2.387A11.3 11.3 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/></svg>
          카카오로 시작하기
        </button>
        <button onclick="oauthLogin('google', this)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;background:#fff;border:1px solid #dadce0;border-radius:10px;font-size:22.5px;font-weight:600;color:#3c4043;cursor:pointer;">
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
          <div class="form-group">
            <select class="form-input" id="signupReferrer">
              <option value="">추천인 선택 (선택 사항)</option>
              <option value="BFM회원">BFM회원</option>
              <option value="코오롱 FnC">코오롱 FnC</option>
              <option value="한섬">한섬</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="signupBtn" style="margin-top:4px;" data-i18n="signupBtn">가입하고 무료 시작 🎁</button>
        </form>
      </div>
      <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:14px;">가입 시 이용약관 및 개인정보처리방침에 동의합니다.</p>
    </div>
  </div>
  `,i,n,e.env.GA4_MEASUREMENT_ID))};V.get(`/generator`,e=>Un(e,`model`)),V.get(`/ghostcut`,e=>Un(e,`ghostcut`)),V.get(`/admin02`,e=>e.html(`<!DOCTYPE html>
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
    .tab-btn{padding:14px 20px;font-size: 21px;font-weight:500;cursor:pointer;border:none;background:none;color:#8b8ba0;border-bottom:2px solid transparent;transition:all .2s;}
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
    .preset-btn{font-size: 18px;padding:4px 11px;border:1px solid #3a3a60;border-radius:20px;background:none;color:#a0a0c0;cursor:pointer;transition:all .2s;white-space:nowrap;}
    .preset-btn:hover{border-color:#6c47ff;color:#9b7cff;background:#6c47ff11;}
    /* 저장바 */
    .save-bar{position:sticky;bottom:0;background:#0f0f1a;border-top:1px solid #2e2e50;padding:14px 0;display:flex;align-items:center;gap:14px;margin-top:6px;}
    .btn-save{padding:11px 28px;background:#6c47ff;color:white;border:none;border-radius:10px;font-size: 21px;font-weight:600;cursor:pointer;transition:all .2s;}
    .btn-save:hover{background:#7c5bff;}
    .btn-save:disabled{background:#3a3a60;color:#8b8ba0;cursor:not-allowed;}
    .btn-cancel{padding:11px 20px;background:transparent;color:#8b8ba0;border:1.5px solid #3a3a60;border-radius:10px;font-size: 21px;font-weight:600;cursor:pointer;transition:all .2s;}
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
    .media-card .del-btn{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:#ef44449e;border:none;color:white;cursor:pointer;font-size: 18px;display:flex;align-items:center;justify-content:center;transition:background .2s;}
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
    /* 모달 */
    .modal-overlay{display:none;position:fixed;inset:0;background:rgba(10,10,20,.7);align-items:center;justify-content:center;padding:20px;z-index:2000;}
    .modal-overlay.open{display:flex;}
    .modal-box{background:#1a1a2e;border:1px solid #2e2e50;border-radius:16px;padding:24px;width:100%;max-width:480px;}
    /* ── 리드(영업) 파이프라인 탭에서 쓰던 공용 스타일 (사업자 리드 탭이 재사용) ── */
    .leads-tabroot{max-width:1200px;margin:0 auto;padding:28px 24px;}
    .leads-card{background:#1a1a2e;border:1px solid #2e2e50;border-radius:14px;padding:18px 20px;margin-bottom:16px;}
    .leads-card h3{font-size:14px;font-weight:600;margin-bottom:10px;}
    .leads-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;}
    .leads-tabroot input,.leads-tabroot select,.leads-tabroot textarea{background:#0f0f1a;border:1px solid #3a3a60;border-radius:8px;color:#e0e0f0;font-size:13px;padding:9px 12px;outline:none;font-family:inherit;}
    .leads-tabroot textarea{width:100%;min-height:90px;resize:vertical;line-height:1.6;}
    .leads-btn{background:#6c47ff;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size: 19.5px;font-weight:600;cursor:pointer;}
    .leads-btn:hover{background:#5a38e0;}
    .leads-btn.secondary{background:#252540;border:1px solid #3a3a60;color:#e0e0f0;}
    .leads-btn.small{padding:5px 10px;font-size: 18px;}
    .leads-tabroot table{width:100%;border-collapse:collapse;font-size:12.5px;}
    .leads-tabroot th{text-align:left;color:#8b8ba0;font-weight:600;padding:8px;border-bottom:1px solid #2e2e50;}
    .leads-tabroot td{padding:8px;border-bottom:1px solid #22223a;vertical-align:top;}
    .leads-tabroot tr:hover td{background:#1f1f38;}
    .leads-hint{font-size:11.5px;color:#8b8ba0;margin-top:4px;}
    /* ── 사업자 리드(구 Genspark) 탭 ── */
    .biz-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;}
    .biz-stat-box{background:#0f0f1a;border:1px solid #2e2e50;border-radius:12px;padding:14px 16px;}
    .biz-stat-box .num{font-size:20px;font-weight:700;color:#9b7cff;}
    .biz-stat-box .label{font-size:11px;color:#8b8ba0;margin-top:2px;}
    .biz-stat-box-highlight{border-color:#3a2e6e;background:#161129;}
    .biz-stat-box-highlight .num{color:#4ade80;}
    .leads-notice-err{background:#3a1414;border:1px solid #6c1a1a;color:#fca5a5;border-radius:10px;padding:12px 16px;font-size:12.5px;line-height:1.6;margin-bottom:16px;white-space:pre-wrap;}
    .biz-filter-btn{cursor:pointer;border:1px solid #3a3a60;border-radius:9px;padding:7px 13px;font-size: 18px;color:#8b8ba0;background:#15152a;transition:.15s;}
    .biz-filter-btn.on{background:#6c47ff;color:#fff;border-color:#6c47ff;}
    .biz-pill{display:inline-block;border-radius:10px;padding:2px 9px;font-size:11px;font-weight:600;white-space:nowrap;}
    .biz-pill-green{background:#1a4a3a;color:#4ade80;}
    .biz-pill-red{background:#4a1a1a;color:#f87171;}
    .biz-pill-yellow{background:#4a3a1a;color:#facc15;}
    .biz-pill-gray{background:#2e2e50;color:#c0c0e0;}
    .biz-masked{color:#f87171;font-size:11px;font-style:italic;}
    .biz-copy-btn{cursor:pointer;opacity:.5;font-size: 16.5px;border:none;background:none;color:#9b7cff;padding:0 0 0 5px;}
    .biz-copy-btn:hover{opacity:1;}
    .biz-tablewrap{overflow:auto;max-height:calc(100vh - 420px);}
    .biz-tablewrap th{position:sticky;top:0;background:#1a1a2e;z-index:2;}
    .biz-tablewrap tr{cursor:pointer;}
    .biz-pagebtn{min-width:30px;height:28px;border-radius:7px;border:1px solid #3a3a60;background:#15152a;color:#8b8ba0;font-size: 17.2px;cursor:pointer;padding:0 6px;}
    .biz-pagebtn.on{background:#6c47ff;color:#fff;border-color:#6c47ff;}
    .biz-pagebtn:disabled{opacity:.35;cursor:default;}
    .biz-modal-overlay{display:none;position:fixed;inset:0;background:rgba(10,10,20,.75);align-items:center;justify-content:center;padding:20px;z-index:2100;}
    .biz-modal-overlay.open{display:flex;}
    .biz-modal-box{background:#1a1a2e;border:1px solid #2e2e50;border-radius:16px;width:100%;max-width:640px;max-height:88vh;overflow-y:auto;padding:0;}
    .biz-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #2e2e50;}
    .biz-modal-close{background:#252540;border:1px solid #3a3a60;color:#8b8ba0;border-radius:8px;width:28px;height:28px;cursor:pointer;}
    .biz-modal-body{padding:16px 20px;}
    .biz-mfield{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #22223a;font-size:12.5px;}
    .biz-mfield:last-child{border-bottom:none;}
    .biz-mlabel{width:100px;flex-shrink:0;color:#8b8ba0;font-weight:600;}
    .biz-mvalue{color:#e0e0f0;word-break:break-all;}
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
    <button class="tab-btn" onclick="switchTab('bizleads')"><i class="fas fa-building"></i> 사업자 리드</button>
    <button class="tab-btn" onclick="switchTab('ghostcut')"><i class="fas fa-tshirt"></i> 누끼컷 샘플</button>
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

      <!-- 이용방법 섹션 4:3 소개 영상 -->
      <div class="upload-form">
        <h3><i class="fas fa-film" style="color:#ff6b6b;"></i> 이용방법 소개 영상 <span style="font-size:13px;font-weight:400;color:#888;">(4:3 가로 영상 1개, 20MB 이하, 미등록 시 빈 박스 유지)</span></h3>
        <div id="howtoVideoGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:12px;"></div>
      </div>

      <!-- 이미지 생성 로딩화면 하단 영상 슬롯 -->
      <div class="upload-form">
        <h3><i class="fas fa-clapperboard" style="color:#9b7cff;"></i> 생성 로딩화면 영상 (모델컷) <span style="font-size:13px;font-weight:400;color:#888;">(최대 5개, 등록된 순서대로 반복 재생, 20MB 이하, 미등록 시 노출 안 함)</span></h3>
        <div id="genLoadingVideoGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:12px;"></div>
      </div>

      <!-- 누끼컷 로딩화면 하단 이미지 슬롯 (모델컷과 완전히 별도) -->
      <div class="upload-form">
        <h3><i class="fas fa-image" style="color:#00d4aa;"></i> 생성 로딩화면 이미지 (누끼컷) <span style="font-size:13px;font-weight:400;color:#888;">(최대 5개, 등록된 순서대로 슬라이드 전환, 8MB 이하, 미등록 시 노출 안 함 — 모델컷 영상과 별도)</span></h3>
        <div id="gcLoadingImageGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:12px;"></div>
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
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">추천인</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">크레딧</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">상태</th>
              <th style="text-align:left;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">가입일</th>
              <th style="text-align:center;padding:12px 16px;font-size:12px;color:#8b8ba0;font-weight:600;">관리</th>
            </tr>
          </thead>
          <tbody id="userTableBody">
            <tr><td colspan="7" style="text-align:center;padding:40px;color:#8b8ba0;font-size:13px;">로딩 중...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <div id="userPagination" style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:16px;"></div>
    </div>
  </div>

  <!-- 회원 상세 모달 (결제내역 / 사용내역) -->
  <div class="modal-overlay" id="userDetailModal" style="z-index:5000;">
    <div class="modal-box" style="max-width:640px;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:17px;" id="userDetailName">회원 상세</h3>
        <button onclick="closeModal('userDetailModal')" style="background:none;border:none;color:#8b8ba0;font-size:30px;cursor:pointer;">×</button>
      </div>
      <div id="userDetailSummary" style="font-size:13px;color:#c8c8dc;margin-bottom:20px;line-height:1.8;"></div>

      <div style="font-size:13px;font-weight:700;color:#e0e0f0;margin-bottom:8px;">💳 결제내역</div>
      <div id="userDetailPayments" style="margin-bottom:24px;">불러오는 중...</div>

      <div style="font-size:13px;font-weight:700;color:#e0e0f0;margin-bottom:8px;">🖼️ 사용내역(생성)</div>
      <div id="userDetailGenerations">불러오는 중...</div>
    </div>
  </div>

  <div class="tab-panel" id="tabBizLeads">
    <div class="leads-tabroot">
      <div class="page-title">🏢 의류·패션·잡화 통신판매업 사업자 리드</div>
      <div class="page-sub">공정거래위원회 공공데이터(통신판매업 신고) 기반 사업자 조회 도구입니다. 조회·CSV 내보내기 전용이며, 발송 기능은 포함되어 있지 않습니다.</div>

      <div id="bizErrorBanner" class="leads-notice-err" style="display:none"></div>
      <div id="bizStatGrid" class="biz-stat-grid"></div>

      <div class="leads-card">
        <div class="leads-row">
          <input id="bizQ" placeholder="상호명, 도메인, 이메일, 주소, 대표자, 사업자번호..." style="flex:1;min-width:220px" oninput="bizDebounce()"/>
          <select id="bizRegion" onchange="bizSearch(1)"><option value="">전체 지역</option></select>
          <select id="bizStatus" onchange="bizSearch(1)">
            <option value="">전체 상태</option>
            <option value="정상영업">정상영업</option>
            <option value="휴업처리">휴업처리</option>
            <option value="영업재개">영업재개</option>
          </select>
          <select id="bizLimit" onchange="bizSearch(1)">
            <option value="50">50건</option>
            <option value="100" selected>100건</option>
            <option value="200">200건</option>
          </select>
          <button class="leads-btn small" onclick="bizSearch(1)">검색</button>
          <button class="leads-btn secondary small" onclick="bizReset()">초기화</button>
        </div>
        <div class="leads-row">
          <span class="leads-hint">빠른 필터:</span>
          <button id="biz-btn-valid" class="biz-filter-btn" onclick="bizToggleFilter('valid')">유효 도메인만</button>
          <button id="biz-btn-email" class="biz-filter-btn" onclick="bizToggleFilter('email')">이메일 공개만</button>
          <button id="biz-btn-tel" class="biz-filter-btn" onclick="bizToggleFilter('tel')">전화번호 공개만</button>
          <a class="leads-btn secondary small" style="text-decoration:none;display:inline-block;" onclick="bizDownload()">CSV 내보내기</a>
          <a class="leads-btn secondary small" style="text-decoration:none;display:inline-block;" onclick="bizDownloadKakao()">카카오채널 CSV</a>
          <a class="leads-btn secondary small" style="text-decoration:none;display:inline-block;" onclick="bizDownloadInsta()">인스타그램 CSV</a>
        </div>
      </div>

      <div class="leads-card">
        <div class="leads-row" style="justify-content:space-between;flex-wrap:wrap;">
          <div class="leads-hint">
            📧 DirectSend 메일 발송용 — 남은 대상 <b id="bizMailRemaining" style="color:#e0e0f0">-</b>건,
            누적 발송 처리 <b id="bizMailSentTotal" style="color:#e0e0f0">-</b>건
            <span id="bizMailLastInfo" style="color:#8b8ba0;"></span>
          </div>
          <button class="leads-btn small" onclick="bizMailBatchNext()">다음 200개 엑셀 발급 (발송대상 체크)</button>
        </div>
        <div class="leads-hint" style="margin-top:6px;font-size:12px;">
          클릭 시 우선순위(유효 도메인 + 실이메일 우선) 상위 200건을 .xlsx로 내려받고, 즉시 "발송 처리"로 표시되어 다음 요청부터 제외됩니다.
        </div>
      </div>

      <div class="leads-card">
        <div class="leads-row" style="justify-content:space-between;margin-bottom:6px;">
          <div class="leads-hint">결과: <b id="bizRCount" style="color:#e0e0f0">-</b>건 <span id="bizPInfo"></span></div>
        </div>
        <div class="biz-tablewrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>상호명 / 대표자</th><th>상태</th><th>지역</th><th>도메인</th>
                <th>이메일</th><th>전화번호</th><th>사업자번호</th><th>주소</th><th>신고일자</th>
              </tr>
            </thead>
            <tbody id="bizTbody"></tbody>
          </table>
        </div>
        <div class="leads-row" style="justify-content:center;margin-top:10px;">
          <button class="biz-pagebtn" id="bizPrevBtn" onclick="bizGoPage(bizCurPage-1)">‹</button>
          <div id="bizPageBtns" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
          <button class="biz-pagebtn" id="bizNextBtn" onclick="bizGoPage(bizCurPage+1)">›</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ▼ 탭: 누끼컷 샘플 -->
  <div class="tab-panel" id="tabGhostCut">
    <div class="admin-body">
      <div class="page-title">👻 누끼컷 샘플 관리</div>
      <div class="page-sub">카테고리별로 고스트 마네킹(투명 마네킹) 스타일링 샘플 이미지를 1장씩 등록하세요. 사용자가 상품 이미지를 업로드하면 AI가 카테고리를 자동 판별하고, 여기 등록된 샘플의 실루엣·구도·조명 스타일로 합성합니다. (샘플 자체의 옷 색상/무늬는 결과물에 반영되지 않습니다 — 스타일링 참조 전용)</div>
      <div id="ghostCutGroups"></div>
    </div>
  </div>

  <div class="biz-modal-overlay" id="bizModal" onclick="bizCloseModal(event)">
    <div class="biz-modal-box" onclick="event.stopPropagation()">
      <div class="biz-modal-head">
        <div style="font-weight:700;color:#fff;" id="bizModalTitle"></div>
        <button class="biz-modal-close" onclick="document.getElementById('bizModal').classList.remove('open')">✕</button>
      </div>
      <div class="biz-modal-body" id="bizModalFields"></div>
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
    const names = ['prompt','models','bgs','home','users','bizleads','ghostcut']
    b.classList.toggle('active', names[i] === name)
  })
  document.getElementById('tabPrompt').classList.toggle('active', name === 'prompt')
  document.getElementById('tabModels').classList.toggle('active', name === 'models')
  document.getElementById('tabBgs').classList.toggle('active', name === 'bgs')
  document.getElementById('tabHome').classList.toggle('active', name === 'home')
  document.getElementById('tabUsers').classList.toggle('active', name === 'users')
  document.getElementById('tabBizLeads').classList.toggle('active', name === 'bizleads')
  document.getElementById('tabGhostCut').classList.toggle('active', name === 'ghostcut')
  if (name === 'models') loadCustomModels()
  if (name === 'bgs')    loadCustomBgs()
  if (name === 'home')   { loadShowcaseImages(); loadFeatureBgs(); loadHowtoVideos(); loadGenLoadingVideos(); loadGcLoadingImages() }
  if (name === 'users')  loadUsers()
  if (name === 'bizleads') bizInit()
  if (name === 'ghostcut') ghostCutInit()
}

// ══════════════════════════════════════════════
// 사업자 리드(구 Genspark "fashion-biz" 프로젝트 이관)
// ══════════════════════════════════════════════
let bizCurPage = 1, bizTotalPages = 1, bizDebT = null, bizInited = false
let bizFilters = { valid: false, email: false, tel: false }

async function bizApi(path, opts) {
  opts = opts || {}
  opts.headers = Object.assign({'X-Admin-Password': adminPassword}, opts.headers||{})
  let res
  try {
    res = await fetch('/api/admin/bizleads' + path, opts)
  } catch (e) {
    return { success: false, message: '네트워크 오류: ' + e.message }
  }
  let data
  try {
    data = await res.json()
  } catch (e) {
    return { success: false, message: 'HTTP ' + res.status + ' — 서버가 JSON이 아닌 응답을 반환했습니다 (DB 마이그레이션 미적용일 가능성이 높습니다).' }
  }
  if (!res.ok && data.success === undefined) data.success = false
  return data
}

function bizFmtTel(raw) {
  if (!raw) return ''
  const d = raw.replace(/[^0-9]/g,'')
  if (d.length < 7) return raw
  if (d.startsWith('02')) {
    if (d.length===9)  return d.replace(/(d{2})(d{3})(d{4})/,'$1-$2-$3')
    if (d.length===10) return d.replace(/(d{2})(d{4})(d{4})/,'$1-$2-$3')
  }
  if (d.startsWith('0')) {
    if (d.length===9)  return d.replace(/(d{3})(d{2})(d{4})/,'$1-$2-$3')
    if (d.length===10) return d.replace(/(d{3})(d{3})(d{4})/,'$1-$2-$3')
    if (d.length===11) return d.replace(/(d{3})(d{4})(d{4})/,'$1-$2-$3')
  }
  if (!d.startsWith('0') && d.length>=7) {
    const p='0'+d
    if (p.startsWith('02')) {
      if (p.length===9)  return p.replace(/(d{2})(d{3})(d{4})/,'$1-$2-$3')
      if (p.length===10) return p.replace(/(d{2})(d{4})(d{4})/,'$1-$2-$3')
    }
    if (p.length===10) return p.replace(/(d{3})(d{3})(d{4})/,'$1-$2-$3')
    if (p.length===11) return p.replace(/(d{3})(d{4})(d{4})/,'$1-$2-$3')
  }
  return raw
}
function bizFmtBrno(raw) {
  if (!raw) return ''
  const d = raw.replace(/[^0-9]/g,'')
  if (d.length===10) return d.slice(0,3)+'-'+d.slice(3,5)+'-'+d.slice(5)
  return raw
}
function bizAttrEsc(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function bizCopyFromBtn(btn) { bizCopyText(btn.getAttribute('data-copy') || '') }
function bizCopyText(txt) {
  navigator.clipboard.writeText(txt).then(() => {
    const t = document.createElement('div')
    t.textContent = '복사됨!'
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#6c47ff;color:#fff;font-size:13px;padding:8px 16px;border-radius:10px;z-index:9999;'
    document.body.appendChild(t)
    setTimeout(() => t.remove(), 1500)
  })
}

async function bizInit() {
  const [st, li] = await Promise.all([
    bizApi('/stats'),
    bizApi('/list?limit=100&page=1'),
  ])
  bizMailBatchStatus()
  const banner = document.getElementById('bizErrorBanner')
  if (!st.success || !li.success) {
    banner.style.display = 'block'
    banner.textContent = '데이터를 불러오지 못했습니다: ' + (st.message || li.message || '알 수 없는 오류')
  } else {
    banner.style.display = 'none'
  }
  if (st.success) {
    const vs = st.validStats || {}, cs = st.contactStats || {}, crs = st.crawlStats || {}
    const cards = [
      ['전체', st.total || 0, false],
      ['유효 리드 (도메인 유효)', vs.valid || 0, true],
      ['이메일 확보 (원본+크롤링)', cs.email_any || 0, true],
      ['전화 확보 (원본+크롤링)', cs.tel_any || 0, true],
      ['카카오채널 확보', crs.crawl_kakao || 0, true],
      ['인스타그램 확보', crs.crawl_insta || 0, true],
      ['도메인 불가 (2차 검증 대상)', vs.invalid || 0, false],
    ]
    document.getElementById('bizStatGrid').innerHTML = cards.map(c =>
      '<div class="biz-stat-box' + (c[2] ? ' biz-stat-box-highlight' : '') + '"><div class="num">' + c[1].toLocaleString() + '</div><div class="label">' + c[0] + '</div></div>'
    ).join('')
    if (!bizInited) {
      const sel = document.getElementById('bizRegion')
      ;(st.regions || []).forEach(r => {
        if (!r.region || r.region === 'N/A') return
        const o = document.createElement('option')
        o.value = r.region; o.textContent = r.region + ' (' + r.n.toLocaleString() + ')'
        sel.appendChild(o)
      })
      bizInited = true
    }
  }
  bizRenderList(li)
}

async function bizSearch(page) {
  bizCurPage = page || 1
  const q = document.getElementById('bizQ').value.trim()
  const region = document.getElementById('bizRegion').value
  const status = document.getElementById('bizStatus').value
  const limit = document.getElementById('bizLimit').value
  const sp = new URLSearchParams({
    q, region, status, limit, page: bizCurPage,
    validOnly: bizFilters.valid ? '1' : '',
    emailOnly: bizFilters.email ? '1' : '',
    telOnly: bizFilters.tel ? '1' : '',
  })
  const data = await bizApi('/list?' + sp.toString())
  bizRenderList(data)
}
function bizDebounce() { clearTimeout(bizDebT); bizDebT = setTimeout(() => bizSearch(1), 380) }

function bizToggleFilter(key) {
  bizFilters[key] = !bizFilters[key]
  document.getElementById('biz-btn-' + key).classList.toggle('on', bizFilters[key])
  bizSearch(1)
}
function bizReset() {
  bizFilters = { valid: false, email: false, tel: false }
  ;['valid','email','tel'].forEach(k => document.getElementById('biz-btn-'+k).classList.remove('on'))
  document.getElementById('bizQ').value = ''
  document.getElementById('bizRegion').value = ''
  document.getElementById('bizStatus').value = ''
  bizSearch(1)
}

function bizRenderList(data) {
  const lim = parseInt(document.getElementById('bizLimit').value || '100')
  const total = data.total || 0
  bizTotalPages = Math.max(1, Math.ceil(total / lim))
  const rows = data.rows || [], offset = (bizCurPage - 1) * lim
  document.getElementById('bizRCount').textContent = total.toLocaleString()
  document.getElementById('bizPInfo').textContent = bizTotalPages > 1 ? '(' + bizCurPage + '/' + bizTotalPages + ' 페이지)' : ''
  const na = v => (v && v !== 'N/A' && v !== 'NULL' && v !== '') ? v : null

  document.getElementById('bizTbody').innerHTML = rows.map((r, i) => {
    const stCls = r.status === '정상영업' ? 'biz-pill-green' : r.status === '휴업처리' ? 'biz-pill-yellow' : 'biz-pill-gray'
    const dom = na(r.domain_clean) || na(r.domain)
    const domHtml = dom
      ? '<a href="https://' + dom + '" target="_blank" rel="noopener" style="color:#9b7cff;font-size:12px;" onclick="event.stopPropagation()">' + dom + '</a>'
      : '<span style="color:#54546e;font-size:12px;">-</span>'
    const vb = r.is_valid === 1 ? '<span class="biz-pill biz-pill-green">유효</span>'
      : r.is_valid === 0 ? '<span class="biz-pill biz-pill-red">불가</span>'
      : '<span class="biz-pill biz-pill-gray">미검증</span>'
    const emailRaw = na(r.email) || ''
    const emailMasked = emailRaw.includes('**') || !emailRaw.includes('@')
    const emailHtml = emailMasked
      ? '<span class="biz-masked">' + (emailRaw || '마스킹됨') + '</span>'
      : emailRaw
        ? '<span style="color:#9b7cff;">' + emailRaw + '</span><button class="biz-copy-btn" data-copy="' + bizAttrEsc(emailRaw) + '" onclick="event.stopPropagation();bizCopyFromBtn(this)">복사</button>'
        : '<span style="color:#54546e;font-size:12px;">-</span>'
    const telRaw = na(r.tel) || ''
    const telMasked = telRaw.includes('개인정보')
    const telHtml = telMasked
      ? '<span class="biz-masked">' + telRaw + '</span>'
      : telRaw
        ? '<span style="color:#38bdf8;">' + bizFmtTel(telRaw) + '</span><button class="biz-copy-btn" data-copy="' + bizAttrEsc(bizFmtTel(telRaw)) + '" onclick="event.stopPropagation();bizCopyFromBtn(this)">복사</button>'
        : '<span style="color:#54546e;font-size:12px;">-</span>'
    const addrRaw = na(r.addr) || ''
    const addrShort = addrRaw.length > 26 ? addrRaw.slice(0, 26) + '…' : addrRaw

    return '<tr onclick="bizOpenModal(' + r.id + ')" title="클릭하여 전체 정보 보기">' +
      '<td>' + (offset + i + 1) + '</td>' +
      '<td><div style="font-weight:600;color:#fff;">' + (na(r.bzmnNm) || '-') + '</div><div style="font-size:11px;color:#8b8ba0;">' + (na(r.ceo) || '대표 미상') + '</div></td>' +
      '<td><span class="biz-pill ' + stCls + '">' + (na(r.status) || '-') + '</span><br/>' + vb + '</td>' +
      '<td>' + (na(r.region) || na(r.inst) || '-') + '</td>' +
      '<td>' + domHtml + '</td>' +
      '<td>' + emailHtml + '</td>' +
      '<td>' + telHtml + '</td>' +
      '<td>' + bizFmtBrno(na(r.brno) || '') + '</td>' +
      '<td title="' + (r.addr || '') + '">' + (addrShort || '-') + '</td>' +
      '<td>' + (na(r.declDate) || '-') + '</td>' +
    '</tr>'
  }).join('')
  bizRenderPagination()
}

function bizRenderPagination() {
  const MAX = 9
  let ps = []
  if (bizTotalPages <= MAX) { for (let i=1;i<=bizTotalPages;i++) ps.push(i) }
  else {
    const s = Math.max(1, bizCurPage-4), e = Math.min(bizTotalPages, s+MAX-1)
    for (let i=s;i<=e;i++) ps.push(i)
    if (ps[0] > 1) ps = ['f', ...ps]
    if (ps[ps.length-1] < bizTotalPages) ps = [...ps, 'l']
  }
  document.getElementById('bizPageBtns').innerHTML = ps.map(p => {
    if (p==='f') return '<button class="biz-pagebtn" onclick="bizGoPage(1)">1…</button>'
    if (p==='l') return '<button class="biz-pagebtn" onclick="bizGoPage(' + bizTotalPages + ')">…' + bizTotalPages + '</button>'
    return '<button class="biz-pagebtn' + (p===bizCurPage?' on':'') + '" onclick="bizGoPage(' + p + ')">' + p + '</button>'
  }).join('')
  document.getElementById('bizPrevBtn').disabled = bizCurPage <= 1
  document.getElementById('bizNextBtn').disabled = bizCurPage >= bizTotalPages
}
function bizGoPage(p) {
  if (p < 1 || p > bizTotalPages) return
  bizSearch(p)
}

async function bizOpenModal(id) {
  const r = await bizApi('/detail/' + id)
  if (!r.success) return
  document.getElementById('bizModalTitle').textContent = r.bzmnNm || '-'
  document.getElementById('bizModal').classList.add('open')
  const validLabel = r.is_valid === 1 ? '<span class="biz-pill biz-pill-green">유효</span>'
    : r.is_valid === 0 ? '<span class="biz-pill biz-pill-red">불가</span>'
    : '<span class="biz-pill biz-pill-gray">미검증</span>'
  const fields = [
    ['상호명', r.bzmnNm], ['대표자', r.ceo], ['사업자번호', bizFmtBrno(r.brno||'')],
    ['신고기관', r.inst], ['지역', r.region], ['영업상태', r.status], ['신고일자', r.declDate],
    ['판매방식', r.method], ['취급품목', r.codeRaw || r.codeName],
    ['도메인(원본)', r.domain], ['도메인(정규화)', r.domain_clean], ['도메인 유효', validLabel, true],
    ['이메일(원본)', r.email || '정보없음'], ['전화번호(원본)', r.tel || '정보없음'],
    ['크롤링 이메일', r.crawled_email || '-'], ['크롤링 전화', r.crawled_tel || '-'],
    ['카카오채널', r.crawled_kakao || '-'], ['인스타그램', r.crawled_insta || '-'],
    ['사업장 주소', r.addr], ['서버 소재지', r.server],
  ]
  document.getElementById('bizModalFields').innerHTML = fields.map(f => {
    const [label, val, isHtml] = f
    const valHtml = isHtml ? val : (val ? val : '<span style="color:#54546e;">-</span>')
    return '<div class="biz-mfield"><span class="biz-mlabel">' + label + '</span><span class="biz-mvalue">' + valHtml + '</span></div>'
  }).join('')
}
function bizCloseModal(e) {
  if (e.target === document.getElementById('bizModal')) document.getElementById('bizModal').classList.remove('open')
}

function bizDownload() {
  const q = document.getElementById('bizQ').value.trim()
  const region = document.getElementById('bizRegion').value
  const status = document.getElementById('bizStatus').value
  const sp = new URLSearchParams({
    q, region, status,
    validOnly: bizFilters.valid ? '1' : '',
    emailOnly: bizFilters.email ? '1' : '',
    telOnly: bizFilters.tel ? '1' : '',
  })
  const url = '/api/admin/bizleads/download.csv?' + sp.toString()
  bizDownloadFile(url, 'fashion_biz_leads.csv')
}
function bizDownloadKakao() { bizDownloadFile('/api/admin/bizleads/export/kakao.csv', 'fashion_biz_kakao.csv') }
function bizDownloadInsta() { bizDownloadFile('/api/admin/bizleads/export/insta.csv', 'fashion_biz_instagram.csv') }

async function bizMailBatchStatus() {
  const s = await bizApi('/mail-batch/status')
  if (!s.success) return
  document.getElementById('bizMailRemaining').textContent = (s.remaining || 0).toLocaleString()
  document.getElementById('bizMailSentTotal').textContent = (s.totalSent || 0).toLocaleString()
  const info = document.getElementById('bizMailLastInfo')
  if (s.lastBatch) {
    info.textContent = ' (마지막 배치 #' + s.lastBatch.mail_batch + ', ' + s.lastBatch.n + '건, ' + (s.lastBatch.sent_at || '').slice(0, 16).replace('T', ' ') + ')'
  } else {
    info.textContent = ''
  }
}

async function bizMailBatchNext() {
  if (!confirm('다음 200개(우선순위 상위)를 발송 처리하고 엑셀을 내려받습니다. 한 번 발급하면 같은 리드는 다시 뽑히지 않습니다. 계속할까요?')) return
  let res
  try {
    res = await fetch('/api/admin/bizleads/mail-batch/next?size=200', {
      method: 'POST',
      headers: { 'X-Admin-Password': adminPassword },
    })
  } catch (e) {
    alert('네트워크 오류: ' + e.message)
    return
  }
  if (!res.ok) {
    let msg = 'HTTP ' + res.status
    try { const j = await res.json(); msg = j.message || msg } catch (e) {}
    alert(msg)
    return
  }
  const batchId = res.headers.get('X-Batch-Id')
  const count = res.headers.get('X-Batch-Count')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'bizleads_mail_batch_' + batchId + '.xlsx'
  a.click()
  URL.revokeObjectURL(a.href)
  alert('배치 #' + batchId + ' — ' + count + '건 발급 완료. 발송 처리되어 다음 요청부터 제외됩니다.')
  bizMailBatchStatus()
}
function bizDownloadFile(url, filename) {
  fetch(url, { headers: { 'X-Admin-Password': adminPassword } })
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    })
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
      '<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;font-size:13px;">⚠️ 로딩 실패</td></tr>'
  }
}

function filterUsers() {
  usersPage = 1
  loadUsers()
}

function renderUserTable(users) {
  const tbody = document.getElementById('userTableBody')
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#8b8ba0;font-size:13px;">조건에 맞는 회원이 없습니다</td></tr>'
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
      statusBtn = '<button data-uid="' + uid + '" data-action="suspend" class="btn-sm btn-danger-sm" style="font-size:16.5px;padding:4px 10px;">정지</button>'
    } else if (u.status === 'suspended') {
      statusBtn = '<button data-uid="' + uid + '" data-action="activate" class="btn-sm btn-primary-sm" style="font-size:16.5px;padding:4px 10px;">활성화</button>'
    }
    var deleteBtn = !isAdmin ? '<button data-uid="' + uid + '" data-name="' + escHtml(u.name||'') + '" data-email="' + escHtml(u.email||'') + '" data-action="delete" class="btn-sm btn-danger-sm" style="font-size:16.5px;padding:4px 10px;">삭제</button>' : ''
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
      + '<td style="padding:12px 16px;text-align:center;font-size:12px;color:' + (u.referrer ? '#9b7cff;font-weight:600;' : '#8b8ba0;') + '">' + (u.referrer ? escHtml(u.referrer) : '-') + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">'
      +   '<span style="font-size:14px;font-weight:700;color:#9b7cff;">' + credits + '</span>'
      +   '<span style="font-size:10px;color:#8b8ba0;"> 크레딧</span>'
      +   '<div style="margin-top:4px;display:flex;gap:4px;justify-content:center;">'
      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="grant" style="font-size:15px;padding:2px 8px;background:#6c47ff33;border:1px solid #6c47ff66;border-radius:6px;color:#9b7cff;cursor:pointer;font-weight:600;">지급</button>'
      +     '<button data-uid="' + uid + '" data-credits="' + credits + '" data-action="credits" style="font-size:15px;padding:2px 8px;background:none;border:1px solid #3a3a60;border-radius:6px;color:#8b8ba0;cursor:pointer;">설정</button>'
      +   '</div>'
      + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">' + (statusBadge[u.status] || u.status) + '</td>'
      + '<td style="padding:12px 16px;font-size:12px;color:#8b8ba0;">' + joined + '</td>'
      + '<td style="padding:12px 16px;text-align:center;">'
      +   '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">'
      +     '<button data-uid="' + uid + '" data-name="' + escHtml(u.name||u.email||'') + '" data-action="detail" class="btn-sm" style="font-size:16.5px;padding:4px 10px;">상세보기</button>'
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

function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open') }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open') }

async function openUserDetail(id, name) {
  document.getElementById('userDetailName').textContent = '👤 ' + (name || '회원 상세')
  const u = allUsers.find(function(x) { return String(x.id) === String(id) })
  const summaryEl = document.getElementById('userDetailSummary')
  if (u) {
    var providerLabel = {kakao:'카카오 간편가입', google:'구글 간편가입', email:'이메일 가입'}[u.provider] || (u.provider || '-')
    var avatarHtml = u.avatar_url
      ? '<img src="' + escHtml(u.avatar_url) + '" style="width:52px;height:52px;border-radius:50%;object-fit:cover;margin-bottom:10px;display:block;" />'
      : ''
    summaryEl.innerHTML = avatarHtml
      + '가입경로: ' + providerLabel + '<br>'
      + '회원번호(provider ID): ' + (u.provider_id ? escHtml(u.provider_id) : '-') + '<br>'
      + '닉네임: ' + escHtml(u.name || '-') + '<br>'
      + '이메일: ' + escHtml(u.email || '-') + '<br>'
      + '전화번호: ' + (u.phone_number ? escHtml(u.phone_number) : '-') + '<br>'
      + '추천인: ' + (u.referrer ? escHtml(u.referrer) : '-') + '<br>'
      + '보유 크레딧: ' + (u.credits != null ? u.credits : 0) + '<br>'
      + '가입일: ' + (u.created_at ? u.created_at.slice(0,10) : '-')
  } else {
    summaryEl.innerHTML = ''
  }
  document.getElementById('userDetailPayments').innerHTML = '불러오는 중...'
  document.getElementById('userDetailGenerations').innerHTML = '불러오는 중...'
  openModal('userDetailModal')

  try {
    const res = await fetch('/api/admin/users/' + id + '/payments', { headers: {'X-Admin-Password':adminPassword} })
    const data = await res.json()
    const list = (data.success && data.payments) ? data.payments : []
    document.getElementById('userDetailPayments').innerHTML = list.length
      ? '<div style="display:flex;flex-direction:column;gap:6px;">' + list.map(function(p) {
          var statusColor = p.status === 'paid' ? '#22c55e' : (p.status === 'refunded' ? '#ef4444' : '#8b8ba0')
          return '<div style="display:flex;justify-content:space-between;font-size:12px;background:#0f0f1a;border:1px solid #2e2e50;border-radius:8px;padding:8px 12px;">'
            + '<span>' + (p.created_at ? p.created_at.slice(0,16).replace('T',' ') : '-') + ' · ' + (p.pg_provider || '-') + '</span>'
            + '<span>' + (p.amount != null ? p.amount.toLocaleString() : '-') + ' ' + (p.currency || '') + ' → +' + (p.credits || 0) + '크레딧</span>'
            + '<span style="color:' + statusColor + ';font-weight:600;">' + (p.status || '-') + '</span>'
            + '</div>'
        }).join('') + '</div>'
      : '<div style="font-size:12px;color:#8b8ba0;">결제 내역이 없습니다.</div>'
  } catch(e) {
    document.getElementById('userDetailPayments').innerHTML = '<div style="font-size:12px;color:#ef4444;">불러오기 실패</div>'
  }

  try {
    const res = await fetch('/api/admin/users/' + id + '/generations', { headers: {'X-Admin-Password':adminPassword} })
    const data = await res.json()
    const list = (data.success && data.generations) ? data.generations : []
    document.getElementById('userDetailGenerations').innerHTML = list.length
      ? '<div style="display:flex;flex-direction:column;gap:6px;">' + list.map(function(g) {
          return '<div style="display:flex;justify-content:space-between;font-size:12px;background:#0f0f1a;border:1px solid #2e2e50;border-radius:8px;padding:8px 12px;">'
            + '<span>' + (g.created_at ? g.created_at.slice(0,16).replace('T',' ') : '-') + ' · ' + (g.kind === 'video' ? '🎬 영상' : '🖼️ 이미지') + '</span>'
            + '<span>' + (g.model_name || '-') + ' / ' + (g.bg_name || '-') + (g.image_count ? (' · ' + g.image_count + '장') : '') + '</span>'
            + '</div>'
        }).join('') + '</div>'
      : '<div style="font-size:12px;color:#8b8ba0;">사용 내역이 없습니다.</div>'
  } catch(e) {
    document.getElementById('userDetailGenerations').innerHTML = '<div style="font-size:12px;color:#ef4444;">불러오기 실패</div>'
  }
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
//  누끼컷 샘플 관리 — 카테고리 고정 6종
// ══════════════════════════════════════════════
let ghostCutCategories = []

async function ghostCutInit() {
  const r = await fetch('/api/admin/ghostcut-samples', { headers: { 'X-Admin-Password': adminPassword } })
  const d = await r.json()
  if (!d.success) return
  ghostCutCategories = d.categories

  // 6종 카테고리는 각각 group === label(1:1)이라 더 이상 그룹 헤더로 묶을 필요가 없어
  // 단순 플랫 그리드로 표시(API 응답이 이미 GHOSTCUT_CATEGORIES 정의 순서 그대로임)
  const readyCount = ghostCutCategories.filter(c => c.hasSample).length

  document.getElementById('ghostCutGroups').innerHTML =
    '<div class="leads-hint" style="margin-bottom:16px;">등록 현황: <b style="color:#e0e0f0">' + readyCount + '</b> / ' + ghostCutCategories.length + '개 카테고리</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">' +
      ghostCutCategories.map(ghostCutCardHtml).join('') +
    '</div>'

  ghostCutCategories.filter(c => c.hasSample).forEach(c => ghostCutLoadThumb(c.code))
}

function ghostCutCardHtml(c) {
  return '<div style="background:#1e1e35;border:1px solid #3a3a60;border-radius:12px;padding:10px;text-align:center;">' +
    '<div id="gcThumb_' + c.code + '" style="width:100%;aspect-ratio:1;border-radius:8px;background:#141428;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:8px;color:#54546e;font-size:12px;">' +
      (c.hasSample ? '로딩중...' : '미등록') +
    '</div>' +
    '<div style="font-size:13px;color:#e0e0f0;font-weight:600;margin-bottom:8px;">' + c.label + '</div>' +
    '<input type="file" accept="image/*" style="display:none" id="gcFile_' + c.code + '" onchange="ghostCutUpload(\\'' + c.code + '\\', this.files[0])" />' +
    '<div style="display:flex;gap:6px;justify-content:center;">' +
      '<button class="leads-btn small" style="padding:5px 10px;font-size:16.5px;" onclick="document.getElementById(\\'gcFile_' + c.code + '\\').click()">업로드</button>' +
      (c.hasSample ? '<button class="leads-btn secondary small" style="padding:5px 10px;font-size:16.5px;" onclick="ghostCutDelete(\\'' + c.code + '\\')">삭제</button>' : '') +
    '</div>' +
  '</div>'
}

async function ghostCutLoadThumb(code) {
  const r = await fetch('/api/admin/ghostcut-samples/' + code + '/image', { headers: { 'X-Admin-Password': adminPassword } })
  const d = await r.json()
  const el = document.getElementById('gcThumb_' + code)
  if (el && d.success && d.imageBase64) el.innerHTML = '<img src="' + d.imageBase64 + '" style="width:100%;height:100%;object-fit:cover;" />'
}

async function ghostCutUpload(code, file) {
  if (!file) return
  const base64 = await readFileAsBase64(file)
  const r = await fetch('/api/admin/ghostcut-samples/' + code, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
    body: JSON.stringify({ imageBase64: base64 }),
  })
  const d = await r.json()
  if (!d.success) { alert(d.message || '업로드 실패'); return }
  ghostCutInit()
}

async function ghostCutDelete(code) {
  if (!confirm('이 카테고리의 샘플 이미지를 삭제할까요?')) return
  const r = await fetch('/api/admin/ghostcut-samples/' + code, {
    method: 'DELETE',
    headers: { 'X-Admin-Password': adminPassword },
  })
  const d = await r.json()
  if (!d.success) { alert('삭제 실패'); return }
  ghostCutInit()
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
    '<button onclick="removeModelStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:18px;line-height:22px;text-align:center;padding:0;">✕</button>' +
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
            '<button onclick="event.stopPropagation();setModelGender(\\'' + m.id + '\\',\\'여성\\')" style="flex:1;padding:5px;border-radius:6px;border:1px solid ' + (g==='여성'?'#6366f1':'#444') + ';background:' + (g==='여성'?'#6366f1':'transparent') + ';color:#fff;font-size:18px;cursor:pointer;">여성</button>' +
            '<button onclick="event.stopPropagation();setModelGender(\\'' + m.id + '\\',\\'남성\\')" style="flex:1;padding:5px;border-radius:6px;border:1px solid ' + (g==='남성'?'#6366f1':'#444') + ';background:' + (g==='남성'?'#6366f1':'transparent') + ';color:#fff;font-size:18px;cursor:pointer;">남성</button>' +
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
    '<button onclick="removeBgStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:18px;line-height:22px;text-align:center;padding:0;">✕</button>' +
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
async function toggleBgDefault(id) {
  const res = await fetch('/api/admin/backgrounds/' + id + '/default', {method:'PUT', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('설정 실패: ' + (data.message || '알 수 없는 오류') + ' (마이그레이션 0018_bg_default_slot.sql 실행 여부를 확인하세요)'); return }
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
        (b.isDefault ? '<span class="custom-badge" style="left:auto;right:8px;background:#111;color:#fff;"><i class="fas fa-thumbtack"></i> 1번 슬롯 고정 중</span>' : '') +
        '<button class="del-btn" onclick="event.stopPropagation();deleteBg(' + "'" + b.id + "'" + ')"><i class="fas fa-times"></i></button>' +
        '<div class="meta"><div class="name">' + b.name + '</div><div class="desc">' + b.category + ' · ' + (b.bgDesc || '-') + '</div>' +
        '<div style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
        (b.hasGenImage
          ? '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#dcfce7;color:#15803d;font-weight:600;">생성용 이미지 등록됨</span>'
          : '<span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#fef3c7;color:#92400e;font-weight:600;">생성용 미등록 (원본 사용)</span>') +
        '<button onclick="event.stopPropagation();pickBgGenImage(' + "'" + b.id + "'" + ')" style="font-size:15px;padding:2px 8px;border-radius:20px;border:1px solid #ccc;background:#fff;cursor:pointer;">' +
        (b.hasGenImage ? '생성용 이미지 교체' : '생성용 이미지 등록') + '</button>' +
        '<button onclick="event.stopPropagation();toggleBgDefault(' + "'" + b.id + "'" + ')" style="font-size:15px;padding:2px 8px;border-radius:20px;cursor:pointer;' + (b.isDefault ? 'border:1px solid #111;background:#111;color:#fff;' : 'border:1px dashed #999;background:transparent;color:#666;') + '">' +
        '<i class="fas fa-thumbtack" style="margin-right:3px;' + (b.isDefault ? '' : 'opacity:.5;') + '"></i>' +
        (b.isDefault ? '1번 슬롯 고정됨 (클릭해서 해제)' : '클릭해서 1번 슬롯에 고정') + '</button>' +
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
    '<button onclick="removeShowcaseStaging(' + i + ')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:18px;line-height:22px;text-align:center;padding:0;">✕</button>' +
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
        '<button onclick="pickFeatureBg(' + slot + ')" style="flex:1;font-size:16.5px;padding:5px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;">' + (img ? '교체' : '업로드') + '</button>' +
        (img ? '<button onclick="deleteFeatureBg(' + slot + ')" style="font-size:16.5px;padding:5px 8px;border-radius:6px;border:1px solid #f3c;color:#e11d48;background:#fff;cursor:pointer;">삭제</button>' : '') +
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
//  홈페이지 관리 — 이용방법 섹션 4:3 소개 영상 (고정 1슬롯)
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
        '<button onclick="pickHowtoVideo(' + slot + ')" style="flex:1;font-size:16.5px;padding:5px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;">' + (src ? '교체' : '업로드') + '</button>' +
        (src ? '<button onclick="deleteHowtoVideo(' + slot + ')" style="font-size:16.5px;padding:5px 8px;border-radius:6px;border:1px solid #f3c;color:#e11d48;background:#fff;cursor:pointer;">삭제</button>' : '') +
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

// ══════════════════════════════════════════════
//  이미지 생성 로딩화면 영상 (최대 5슬롯, 등록된 순서대로 반복재생)
// ══════════════════════════════════════════════
const GEN_LOADING_VIDEO_LABELS = { 1: '영상 1', 2: '영상 2', 3: '영상 3', 4: '영상 4', 5: '영상 5' }

async function loadGenLoadingVideos() {
  const grid = document.getElementById('genLoadingVideoGrid')
  try {
    const res = await fetch('/api/gen-loading-videos')
    const data = await res.json()
    const videos = data.videos || {}
    grid.innerHTML = Object.keys(GEN_LOADING_VIDEO_LABELS).map(slot => {
      const src = videos[slot]
      return '<div style="border:1.5px solid #e0e0e0;border-radius:10px;overflow:hidden;">' +
        '<div style="position:relative;width:100%;aspect-ratio:9/16;background:#f2f2f5;display:flex;align-items:center;justify-content:center;">' +
        (src ? '<video src="' + src + '" muted loop playsinline autoplay style="width:100%;height:100%;object-fit:cover;"></video>' : '<i class="fas fa-video" style="color:#ccc;font-size:24px;"></i>') +
        '</div>' +
        '<div style="padding:8px;">' +
        '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">' + GEN_LOADING_VIDEO_LABELS[slot] + '</div>' +
        '<div style="display:flex;gap:6px;">' +
        '<button onclick="pickGenLoadingVideo(' + slot + ')" style="flex:1;font-size:16.5px;padding:5px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;">' + (src ? '교체' : '업로드') + '</button>' +
        (src ? '<button onclick="deleteGenLoadingVideo(' + slot + ')" style="font-size:16.5px;padding:5px 8px;border-radius:6px;border:1px solid #f3c;color:#e11d48;background:#fff;cursor:pointer;">삭제</button>' : '') +
        '</div></div></div>'
    }).join('')
  } catch(e) { console.error('loadGenLoadingVideos error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

let _pendingGenLoadingVideoSlot = null
function pickGenLoadingVideo(slot) {
  _pendingGenLoadingVideoSlot = slot
  let input = document.getElementById('genLoadingVideoInput')
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.id = 'genLoadingVideoInput'
    input.style.display = 'none'
    input.addEventListener('change', onGenLoadingVideoSelect)
    document.body.appendChild(input)
  }
  input.value = ''
  input.click()
}

async function onGenLoadingVideoSelect(e) {
  const file = e.target.files?.[0]
  if (!file || !_pendingGenLoadingVideoSlot) return
  if (file.size > 20 * 1024 * 1024) { alert('영상 용량이 너무 큽니다. 20MB 이하 파일을 사용해주세요.'); return }
  try {
    const res = await fetch('/api/admin/gen-loading-video/' + _pendingGenLoadingVideoSlot, {
      method: 'PUT',
      headers: {'Content-Type': file.type || 'video/mp4', 'X-Admin-Password':adminPassword},
      body: file,
    })
    const data = await res.json()
    if (!data.success) { alert('업로드 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadGenLoadingVideos()
  } catch(err) { alert('오류: ' + err.message) }
}

async function deleteGenLoadingVideo(slot) {
  if (!confirm('이 슬롯의 영상을 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/gen-loading-video/' + slot, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadGenLoadingVideos()
}

// ══════════════════════════════════════════════
//  누끼컷 로딩화면 이미지 (최대 5슬롯, 모델컷 영상과 완전히 별도 관리)
//  ⚠️ 2026-08-23: 기존 영상 업로드에서 이미지 업로드로 전환됨
// ══════════════════════════════════════════════
const GC_LOADING_IMAGE_LABELS = { 1: '이미지 1', 2: '이미지 2', 3: '이미지 3', 4: '이미지 4', 5: '이미지 5' }

async function loadGcLoadingImages() {
  const grid = document.getElementById('gcLoadingImageGrid')
  try {
    const res = await fetch('/api/gc-loading-images')
    const data = await res.json()
    const images = data.images || {}
    grid.innerHTML = Object.keys(GC_LOADING_IMAGE_LABELS).map(slot => {
      const src = images[slot]
      return '<div style="border:1.5px solid #e0e0e0;border-radius:10px;overflow:hidden;">' +
        '<div style="position:relative;width:100%;aspect-ratio:9/16;background:#f2f2f5;display:flex;align-items:center;justify-content:center;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;" />' : '<i class="fas fa-image" style="color:#ccc;font-size:24px;"></i>') +
        '</div>' +
        '<div style="padding:8px;">' +
        '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">' + GC_LOADING_IMAGE_LABELS[slot] + '</div>' +
        '<div style="display:flex;gap:6px;">' +
        '<button onclick="pickGcLoadingImage(' + slot + ')" style="flex:1;font-size:16.5px;padding:5px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;">' + (src ? '교체' : '업로드') + '</button>' +
        (src ? '<button onclick="deleteGcLoadingImage(' + slot + ')" style="font-size:16.5px;padding:5px 8px;border-radius:6px;border:1px solid #f3c;color:#e11d48;background:#fff;cursor:pointer;">삭제</button>' : '') +
        '</div></div></div>'
    }).join('')
  } catch(e) { console.error('loadGcLoadingImages error:', e); grid.innerHTML = '<div class="empty-state"><p>불러오기 실패: ' + e.message + '</p></div>' }
}

let _pendingGcLoadingImageSlot = null
function pickGcLoadingImage(slot) {
  _pendingGcLoadingImageSlot = slot
  let input = document.getElementById('gcLoadingImageInput')
  if (!input) {
    input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.id = 'gcLoadingImageInput'
    input.style.display = 'none'
    input.addEventListener('change', onGcLoadingImageSelect)
    document.body.appendChild(input)
  }
  input.value = ''
  input.click()
}

async function onGcLoadingImageSelect(e) {
  const file = e.target.files?.[0]
  if (!file || !_pendingGcLoadingImageSlot) return
  if (file.size > 8 * 1024 * 1024) { alert('이미지 용량이 너무 큽니다. 8MB 이하 파일을 사용해주세요.'); return }
  try {
    const res = await fetch('/api/admin/gc-loading-image/' + _pendingGcLoadingImageSlot, {
      method: 'PUT',
      headers: {'Content-Type': file.type || 'image/jpeg', 'X-Admin-Password':adminPassword},
      body: file,
    })
    const data = await res.json()
    if (!data.success) { alert('업로드 실패: ' + (data.message || '알 수 없는 오류')); return }
    await loadGcLoadingImages()
  } catch(err) { alert('오류: ' + err.message) }
}

async function deleteGcLoadingImage(slot) {
  if (!confirm('이 슬롯의 이미지를 삭제하시겠습니까?')) return
  const res = await fetch('/api/admin/gc-loading-image/' + slot, {method:'DELETE', headers:{'X-Admin-Password':adminPassword}})
  const data = await res.json()
  if (!data.success) { alert('삭제 실패: ' + (data.message || '알 수 없는 오류')); return }
  await loadGcLoadingImages()
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
    else if (action === 'detail')  { openUserDetail(uid, btn.dataset.name || '') }
  })

  document.getElementById('userDetailModal').addEventListener('click', function(e) {
    if (e.target.id === 'userDetailModal') closeModal('userDetailModal')
  })
})
<\/script>
</body>
</html>`)),V.get(`/admin/leads`,e=>e.redirect(`/admin02`,302)),V.get(`/admin`,e=>e.redirect(`/admin02`,302)),V.get(`/studio-b`,e=>e.redirect(`/`)),V.get(`/studio-b/*`,e=>{let t=e.req.path.replace(`/studio-b`,``)||`/`;return e.redirect(t)}),V.get(`/payment/success`,e=>e.html(`<!DOCTYPE html>
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
  ${_t(e.env.GA4_MEASUREMENT_ID)}
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

    async function loadPaymentStatus(attempt) {
      attempt = attempt || 1
      try {
        const res = await fetch('/api/payments/status?orderId=' + encodeURIComponent(orderId), {
          headers: { 'X-Session-Token': sessionToken },
        })
        const data = await res.json()
        if (data.success) {
          document.getElementById('loadingState').classList.add('hidden')
          document.getElementById('successMsg').textContent = '크레딧이 충전되었습니다.'
          document.getElementById('creditsGranted').textContent = '+' + data.credits.toLocaleString() + ' 크레딧'
          document.getElementById('creditsTotal').textContent = data.creditsTotal.toLocaleString() + ' 크레딧'
          document.getElementById('successState').classList.remove('hidden')
          // 세션스토리지에 갱신 신호
          sessionStorage.setItem('creditsRefresh', '1')
          try {
            if (typeof gtag === 'function') {
              gtag('event', 'purchase', {
                transaction_id: orderId,
                items: [{ item_name: 'credits', quantity: data.credits }],
              })
            }
          } catch (e) {}
          return
        }
        // Stripe는 웹훅이 비동기로 도착하므로, 아직 pending이면 잠깐 재시도 (최대 5회, 1.5초 간격)
        if (data.status === 'pending' && attempt < 5) {
          setTimeout(() => loadPaymentStatus(attempt + 1), 1500)
          return
        }
        document.getElementById('loadingState').classList.add('hidden')
        document.getElementById('errorMsg').textContent = data.error || '알 수 없는 오류가 발생했습니다.'
        document.getElementById('errorState').classList.remove('hidden')
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
</html>`)),V.get(`/payment/fail`,e=>e.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 실패 — Studio B</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>body { background: #0f0f0f; font-family: 'Pretendard', -apple-system, sans-serif; }</style>
  ${_t(e.env.GA4_MEASUREMENT_ID)}
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
</html>`));var Wn=new Oe,Gn=Object.assign({"/src/index.tsx":V}),Kn=!1;for(let[,e]of Object.entries(Gn))e&&(Wn.all(`*`,t=>{let n;try{n=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,n)}),Wn.notFound(t=>{let n;try{n=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,n)}),Kn=!0);if(!Kn)throw Error(`Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']`);export{Wn as default};