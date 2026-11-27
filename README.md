# 7X — Megz vs 3mora 🎮

لعبة تصويت جماعية للتيم بتاع **8X CRM**: كل سؤال تختار فيه **Megz** أو **3mora**، وبعد التايمر النتيجة تظهر كـ poll كرتوني.

## تجربتها على جهازك

```bash
npm install
npm start
```

- شاشة الهوست (البروجكتور): `http://localhost:3000/host?key=7x`
- اللاعبين بيعملوا scan للـ QR اللي على شاشة الهوست.
- لو عايزة تجربي من موبايلك على نفس الـ Wi-Fi، افتحي شاشة الهوست باللينك اللي فيه الـ IP (بيتطبع في الـ terminal) عشان الـ QR يشاور على اللينك الصح.

## يوم اللعبة: لينك أونلاين من لابتوبك (مجاني، من غير deploy) ⭐

مرة واحدة بس: افتحي PowerShell كـ **Administrator** وسطّبي cloudflared:

```
winget install --id Cloudflare.cloudflared -e
```

(أو نزّلي `cloudflared-windows-amd64.exe` من https://github.com/cloudflare/cloudflared/releases/latest وسمّيه `cloudflared.exe` وحطيه في فولدر `bin/` جوه المشروع.)

وبعد كده كل مرة:

```
npm run play
```

هيشغّل اللعبة ويعمل لينك `https://xxxx.trycloudflare.com` ويفتح شاشة الهوست لوحده. سيبي اللابتوب والـ terminal مفتوحين طول اللعبة.

## (اختياري) الـ Deploy على Render

1. ارفعي الفولدر ده على GitHub repo.
2. ادخلي [render.com](https://render.com) ← **New** ← **Blueprint** ← اختاري الـ repo (هيقرا `render.yaml` لوحده).
   - أو **New** ← **Web Service**: Build `npm install`، Start `npm start`، Plan `Free`.
3. بعد ما يخلص هيديكي لينك زي `https://7x-game.onrender.com`.
4. افتحي `https://7x-game.onrender.com/host?key=7x` على البروجكتور. خلاص.

> ⚠️ الخطة المجانية بتنام بعد 15 دقيقة من غير استخدام. افتحي صفحة الهوست قبل اللعبة بدقيقتين عشان تصحى.
> 🔑 غيري `HOST_KEY` من Environment في Render لو مش عايزة حد من التيم يفتح شاشة الهوست.

## أثناء اللعب

| الزرار | بيعمل إيه |
|---|---|
| **يلا نبدأ** | يبدأ أول سؤال |
| **اكشف النتيجة** | يقفل التصويت بدري (وبيتقفل لوحده لو الكل صوّت أو التايمر خلص) |
| **السؤال الجاي** | ينقل للسؤال اللي بعده |
| **العب تاني** | يرجع للبداية واللاعبين زي ما هما |
| **مسح اللاعبين** | يخرج الكل (للجلسة الجديدة) |

Space أو → أو زرار الـ presenter clicker = التالي.

## التعديل

- **الأسئلة والتعليقات الهزار**: `questions.js`
- **وقت السؤال**: `time` جوه السؤال، أو `QUESTION_TIME` (default 20 ثانية)
- **الشخصيات (SVG)**: `public/common.js` — لو عملتي صور بالـ AI بعدين، بدّلي `MEGZ_SVG` و `AMORA_SVG` بـ `<img src="/megz.png">` وحطي الصور في `public/`.
- **الألوان**: أول `public/style.css` (`--megz`, `--amora`, `--brand`)

## الملفات

```
server.js         السيرفر + منطق اللعبة (Socket.io)
questions.js      الأسئلة والتعليقات
public/index.html صفحة اللاعب (موبايل)
public/host.html  شاشة الهوست (بروجكتور)
public/common.js  الشخصيات + النتيجة + التايمر + confetti
public/style.css  الستايل
```

اللعبة بتحفظ كل حاجة في الميموري (من غير database)، فلو السيرفر عمل restart اللعبة بتبدأ من الأول.
