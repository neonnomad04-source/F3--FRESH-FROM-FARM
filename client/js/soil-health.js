document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: Replace this with your actual Groq API Key (starts with gsk_)
    const API_KEY = "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";

    const form = document.getElementById('soil-form');
    const results = document.getElementById('results-container');
    
    // NPK Elements
    const nVal = document.getElementById('n-val'), nStatus = document.getElementById('n-status'), nRec = document.getElementById('n-rec');
    const pVal = document.getElementById('p-val'), pStatus = document.getElementById('p-status'), pRec = document.getElementById('p-rec');
    const kVal = document.getElementById('k-val'), kStatus = document.getElementById('k-status'), kRec = document.getElementById('k-rec');
    
    const cropList = document.getElementById('crop-list');
    const scoreCircle = document.getElementById('score-circle');
    const scoreValue = document.getElementById('score-value');
    const scoreSummary = document.getElementById('score-summary');
    
    const stepFert = document.getElementById('step-fert');
    const stepSoil = document.getElementById('step-soil');
    const stepIrr = document.getElementById('step-irr');
    const stepMon = document.getElementById('step-mon');
    const ecoTip = document.getElementById('eco-tip');

    const demoBtn = document.getElementById('load-demo-btn');
    if(demoBtn) {
        demoBtn.addEventListener('click', () => {
            document.getElementById('nitrogen').value = 75;
            document.getElementById('phosphorus').value = 35;
            document.getElementById('potassium').value = 45;
            document.getElementById('ph').value = 6.2;
            document.getElementById('temp').value = 28;
            document.getElementById('humidity').value = 65;
            document.getElementById('rainfall').value = 850;
            document.getElementById('visual').value = "A bit sandy but mostly dark and retains decent moisture.";
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const n = parseFloat(document.getElementById('nitrogen').value);
        const p = parseFloat(document.getElementById('phosphorus').value);
        const k = parseFloat(document.getElementById('potassium').value);
        const ph = parseFloat(document.getElementById('ph').value);
        const temp = parseFloat(document.getElementById('temp').value);
        const humidity = parseFloat(document.getElementById('humidity').value);
        const rainfall = parseFloat(document.getElementById('rainfall').value);
        const visual = document.getElementById('visual').value;

        results.classList.remove('hidden');
        setTimeout(() => {
            results.classList.remove('opacity-0', 'translate-y-10');
            results.classList.add('opacity-100', 'translate-y-0');
        }, 50);

        // Instant Deterministic NPK Status Check
        nVal.textContent = n;
        if(n < 80) { nStatus.textContent = 'Low'; nStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-200 text-red-800 mb-0.5'; nRec.textContent = `Apply ${Math.round((120-n)*0.5)} kg/acre of Urea.`; }
        else if(n <= 140) { nStatus.textContent = 'Optimal'; nStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-200 text-green-800 mb-0.5'; nRec.textContent = 'Maintain. Use mild natural compost.'; }
        else { nStatus.textContent = 'High'; nStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-200 text-yellow-800 mb-0.5'; nRec.textContent = 'Stop N-fertilizers to prevent burn.'; }

        pVal.textContent = p;
        if(p < 30) { pStatus.textContent = 'Low'; pStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-200 text-red-800 mb-0.5'; pRec.textContent = `Use DAP to supplement ${Math.round(50-p)} mg/kg.`; }
        else if(p <= 70) { pStatus.textContent = 'Optimal'; pStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-200 text-green-800 mb-0.5'; pRec.textContent = 'P levels are sufficient. No action needed.'; }
        else { pStatus.textContent = 'High'; pStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-200 text-yellow-800 mb-0.5'; pRec.textContent = 'High P detected. Avoid DAP this season.'; }

        kVal.textContent = k;
        if(k < 30) { kStatus.textContent = 'Low'; kStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-200 text-red-800 mb-0.5'; kRec.textContent = `Apply MOP fertilizer for K boost.`; }
        else if(k <= 80) { kStatus.textContent = 'Optimal'; kStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-200 text-green-800 mb-0.5'; kRec.textContent = 'K is balanced. High drought resilience.'; }
        else { kStatus.textContent = 'High'; kStatus.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-200 text-yellow-800 mb-0.5'; kRec.textContent = 'High potassium. Monitor salt levels.'; }

        // Score logic
        let score = 100;
        score -= Math.abs(100 - n) * 0.2;
        score -= Math.abs(50 - p) * 0.4;
        score -= Math.abs(50 - k) * 0.4;
        if(ph < 6 || ph > 7.5) score -= 10;
        score = Math.max(10, Math.min(100, Math.round(score)));

        scoreValue.textContent = score;
        scoreCircle.style.strokeDasharray = `${score}, 100`;
        scoreSummary.innerHTML = `<span class="italic animate-pulse">Contacting Groq Llama 3 for qualitative summary...</span>`;

        const btn = form.querySelector('button[type="submit"]');
        const oldText = btn.innerHTML;
        btn.innerHTML = `<span class="animate-pulse">Generating with Groq...</span>`;
        btn.disabled = true;

        try {
            const prompt = `You are an expert precision agriculture AI evaluating this soil profile:
Nitrogen: ${n} mg/kg
Phosphorus: ${p} mg/kg
Potassium: ${k} mg/kg
pH: ${ph}
Temperature: ${temp} C
Humidity: ${humidity}%
Rainfall: ${rainfall}mm
Visual Desc: ${visual || 'N/A'}

Respond specifically in valid JSON format. Provide these EXACT keys:
{
  "summary": "1-2 sentence qualitative summary of soil health and yield potential.",
  "crops": [
    { "name": "Crop Name", "match": 98, "desc": "Brief reason it fits the NPK/weather.", "yield": "e.g. 15-20 quintals/acre" }
  ],
  "actionPlan": {
    "fertilizer": "Specific detailed advice based on NPK deficits.",
    "soil": "Specific advice for pH correction and conditioning.",
    "irrigation": "Specific watering protocol considering ${rainfall}mm rain.",
    "monitoring": "Follow-up testing schedule."
  },
  "ecoTip": "One advanced sustainable regenerative farming tip."
}
Make sure the 'crops' array always contains exactly 3 crop suggestions best suited for this environment. 'match' must be a number.`;

            // Using official Groq OpenAI-compatible endpoint
            const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: "You output JSON strictly." },
                        { role: "user", content: prompt }
                    ]
                })
            });

            const rawData = await response.json();
            if(!rawData.choices) throw new Error("Invalid API response format");

            const data = JSON.parse(rawData.choices[0].message.content);

            // Populate Groq AI Data
            scoreSummary.textContent = data.summary;

            cropList.innerHTML = data.crops.map((c, i) => `
                <div class="p-3 sm:p-4 bg-slate-50 rounded-2xl flex gap-3 sm:gap-4 items-center border border-slate-100 transition-all hover:bg-slate-100">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center font-black text-lg shadow-sm border border-slate-200 flex-shrink-0">
                        ${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center mb-1">
                            <h5 class="font-bold text-dark text-sm truncate pr-2">${c.name}</h5>
                            <span class="text-[10px] font-black tracking-widest px-2 py-0.5 bg-green-100 text-green-700 rounded-md whitespace-nowrap">${c.match}% MATCH</span>
                        </div>
                        <p class="text-[11px] sm:text-xs text-slate-500 font-medium mb-1 truncate">${c.desc}</p>
                        <p class="text-[10px] font-black uppercase text-slate-400">Est. Yield: <span class="text-secondary tracking-widest">${c.yield}/acre</span></p>
                    </div>
                </div>
            `).join('');

            stepFert.textContent = data.actionPlan.fertilizer;
            stepSoil.textContent = data.actionPlan.soil;
            stepIrr.textContent = data.actionPlan.irrigation;
            stepMon.textContent = data.actionPlan.monitoring;

            ecoTip.textContent = data.ecoTip;

            setTimeout(() => {
                const y = results.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }, 100);

        } catch (error) {
            console.error("Groq API Error:", error);
            alert("Error generating authentic AI response via Groq. Did you add the API Key?");
        } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    });
});
