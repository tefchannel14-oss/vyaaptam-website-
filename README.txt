Vyaaptam Website - Frontend Download
====================================
Site: https://dynamic-responsive-website-7d84e2.netlify.app
Date: 2026-11-23

Is ZIP me kya hai?
------------------
/site/ folder me aapki LIVE website ka complete frontend (built HTML/CSS/JS + images) hai:
- index.html (Home)
- about.html, contact.html, services.html, blog.html, admin.html
- /services/*.html (15 service pages)
- /blog/*.html (3 blog posts)
- /assets/*.js, *.css (TanStack Start build files)
- /img/vyaaptam-logo.png, favicon.png, img-hero.webp etc.

Ise kaise use karein?
---------------------
1. ZIP ko unzip karo
2. site/index.html ko browser me kholo - poori site offline chalegi (forms live site par hi kaam karenge)
3. Kisi bhi hosting (Netlify Drop, Vercel, Hostinger) par /site/ folder ko upload karke host kar sakte ho.

IMPORTANT: Ye BUILD output hai, original source code nahi hai.
Original source (TanStack Start + React components) Netlify ke andar hai.
Uske liye neeche wala section padho.

Original Source Code kaise download karein? (TanStack Start React)
-----------------------------------------------------------------
Netlify AI builder me direct "Download ZIP" button nahi hota. 2 tareeke hain:

Option 1 - Netlify CLI se (Recommended, 5 min):
1. Apne computer par Node.js install karo
2. Terminal me:
   npm install -g netlify-cli
   netlify login
   netlify link --id e65a5be2-b9a0-4e5a-ac04-b22a2903a700
   netlify dev  (site locally chalegi)
   // Files dekhne ke liye:
   netlify api listSiteFiles --data '{"site_id":"e65a5be2-b9a0-4e5a-ac04-b22a2903a700"}'
   // Ya agent se connect karo:
   fetch https://netlify.ai  (Claude / Codex / Cursor me ye message paste karo aur login link kholo)

Option 2 - "Connect a local agent" (aapke Netlify page par hai):
- Netlify > Version page > "Connect my agent" > "Any agent" > message copy karke
  Claude Code / Cursor / VS Code agent me paste karo, login karo.
  Phir bolo: "Download full source code as ZIP" - agent repo clone karke de dega.

Option 3 - GitHub me push karke:
- Agar Netlify project me GitHub connection ON hai to repo se clone karo.
- Nahi hai to agent se bolo: "Connect this project to GitHub and push all code"

App ID: e65a5be2-b9a0-4e5a-ac04-b22a2903a700
Stack: TanStack Start, built in 10s

Help chahiye to batao - main CLI commands me guide kar dunga.
