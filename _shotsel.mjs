import puppeteer from 'puppeteer-core'
const out=process.argv[2], url=process.argv[3], sel=process.argv[4]
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']})
const p=await b.newPage(); await p.setViewport({width:1500,height:1000})
await p.goto(url,{waitUntil:'networkidle2',timeout:45000}); await new Promise(r=>setTimeout(r,3500))
if(sel==='trust'){ await p.evaluate(()=>window.scrollTo(0, window.innerHeight-40)) }
else if(sel && sel!=='top'){ await p.evaluate(s=>{const e=document.querySelector(s); if(e)e.scrollIntoView({block:'start'})},sel) }
await new Promise(r=>setTimeout(r,1200)); await p.screenshot({path:out}); console.log('saved',out); await b.close()
