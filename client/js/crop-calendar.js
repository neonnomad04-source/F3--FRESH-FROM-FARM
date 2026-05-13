document.addEventListener('DOMContentLoaded', () => {
    const GROQ_KEY = "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";
    const WEATHER_KEY = ""; // Optional: OpenWeatherMap free key

    const form = document.getElementById('calendar-form');
    const results = document.getElementById('results-container');
    const inputPanel = document.getElementById('input-panel');
    const demoBtn = document.getElementById('demo-cal-btn');
    const resetBtn = document.getElementById('reset-cal-btn');
    const generateBtn = document.getElementById('generate-btn');

    const weatherLoc = document.getElementById('weather-location');
    const weatherTemp = document.getElementById('weather-temp');
    const weatherHumidity = document.getElementById('weather-humidity');
    const weatherRain = document.getElementById('weather-rain');

    const alertsContainer = document.getElementById('alerts-container');
    const timelineContainer = document.getElementById('timeline-container');
    const postHarvest = document.getElementById('post-harvest');

    // Risk bars
    const riskFlood = document.getElementById('risk-flood');
    const riskHeat = document.getElementById('risk-heat');
    const riskPest = document.getElementById('risk-pest');
    const riskDrought = document.getElementById('risk-drought');
    const riskFloodL = document.getElementById('risk-flood-label');
    const riskHeatL = document.getElementById('risk-heat-label');
    const riskPestL = document.getElementById('risk-pest-label');
    const riskDroughtL = document.getElementById('risk-drought-label');

    // Demo Data
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            document.getElementById('cal-location').value = 'Lucknow, UP';
            document.getElementById('cal-crop').value = 'Rice';
            document.getElementById('cal-soil').value = 'Clay';
            // Set date to 2 weeks from now
            const d = new Date(); d.setDate(d.getDate() + 14);
            document.getElementById('cal-date').value = d.toISOString().split('T')[0];
            document.querySelector('input[name="irrigation"][value="Yes"]').checked = true;
            document.getElementById('cal-scale').value = 'Medium (2-10 acres)';
        });
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            results.classList.add('opacity-0', 'translate-y-10');
            setTimeout(() => {
                results.classList.add('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 600);
        });
    }

    // Stage icons
    const stageIcons = {
        'Pre-Sowing': '🌱',
        'Sowing Window': '🌾',
        'Germination': '🌿',
        'Vegetative Growth': '🌳',
        'Irrigation Schedule': '💧',
        'Fertilizer Top-up': '🧪',
        'Pest Watch': '🐛',
        'Flowering': '🌸',
        'Fruiting': '🍎',
        'Pruning / Thinning': '✂️',
        'Harvest Window': '🌾',
        'Post-Harvest': '☀️'
    };

    const stageColors = {
        'Pre-Sowing': 'bg-amber-50 border-amber-200 text-amber-800',
        'Sowing Window': 'bg-green-50 border-green-200 text-green-800',
        'Germination': 'bg-lime-50 border-lime-200 text-lime-800',
        'Vegetative Growth': 'bg-emerald-50 border-emerald-200 text-emerald-800',
        'Irrigation Schedule': 'bg-blue-50 border-blue-200 text-blue-800',
        'Fertilizer Top-up': 'bg-purple-50 border-purple-200 text-purple-800',
        'Pest Watch': 'bg-red-50 border-red-200 text-red-800',
        'Flowering': 'bg-pink-50 border-pink-200 text-pink-800',
        'Fruiting': 'bg-orange-50 border-orange-200 text-orange-800',
        'Pruning / Thinning': 'bg-cyan-50 border-cyan-200 text-cyan-800',
        'Harvest Window': 'bg-yellow-50 border-yellow-200 text-yellow-800',
        'Post-Harvest': 'bg-teal-50 border-teal-200 text-teal-800'
    };

    function getRiskLabel(val) {
        if (val >= 75) return 'Critical';
        if (val >= 50) return 'High';
        if (val >= 25) return 'Moderate';
        return 'Low';
    }

    function renderAlerts(alerts) {
        alertsContainer.innerHTML = alerts.map(a => {
            let cls = 'alert-upcoming';
            let icon = '🟡';
            if (a.type === 'urgent') { cls = 'alert-urgent'; icon = '🔴'; }
            else if (a.type === 'done' || a.type === 'positive') { cls = 'alert-done'; icon = '🟢'; }
            return `<div class="${cls} rounded-xl px-4 py-3 flex items-start gap-3">
                <span class="text-lg flex-shrink-0 pt-0.5">${icon}</span>
                <p class="text-xs font-bold text-slate-800 leading-relaxed">${a.message}</p>
            </div>`;
        }).join('');
    }

    function renderTimeline(weeks) {
        timelineContainer.innerHTML = weeks.map((w, i) => {
            const stage = w.stage || 'General';
            const icon = stageIcons[stage] || '📋';
            const color = stageColors[stage] || 'bg-slate-50 border-slate-200 text-slate-800';

            return `<div class="week-card bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 relative overflow-hidden">
                <div class="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div class="flex items-center gap-3 flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs flex-shrink-0">W${w.week || (i+1)}</div>
                        <div class="sm:hidden">
                            <p class="text-xs font-black text-slate-800">${w.dateRange || ''}</p>
                            <span class="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${color} border mt-1">${icon} ${stage}</span>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="hidden sm:flex items-center gap-2 mb-2">
                            <p class="text-xs font-black text-slate-800">${w.dateRange || ''}</p>
                            <span class="inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${color} border">${icon} ${stage}</span>
                        </div>
                        <ul class="space-y-1.5">
                            ${(w.tasks || []).map(t => `<li class="text-xs font-medium text-slate-600 flex items-start gap-2"><span class="text-slate-300 mt-0.5 flex-shrink-0">▸</span>${t}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const location = document.getElementById('cal-location').value;
        const crop = document.getElementById('cal-crop').value;
        const soil = document.getElementById('cal-soil').value;
        const sowDate = document.getElementById('cal-date').value;
        const irrigation = document.querySelector('input[name="irrigation"]:checked').value;
        const scale = document.getElementById('cal-scale').value;

        // Show results skeleton
        results.classList.remove('hidden');
        setTimeout(() => {
            results.classList.remove('opacity-0', 'translate-y-10');
            results.classList.add('opacity-100', 'translate-y-0');
        }, 50);

        weatherLoc.textContent = location;
        weatherTemp.textContent = '...';
        weatherHumidity.textContent = '...';
        weatherRain.textContent = '...';
        alertsContainer.innerHTML = '<div class="bg-blue-50 rounded-xl px-4 py-3 animate-pulse"><p class="text-xs font-bold text-blue-600">⏳ Generating your personalized calendar with Groq AI...</p></div>';
        timelineContainer.innerHTML = '<div class="bg-slate-50 rounded-2xl p-8 text-center animate-pulse"><p class="text-sm font-bold text-slate-400">Building week-by-week timeline...</p></div>';

        const oldText = generateBtn.innerHTML;
        generateBtn.innerHTML = `<span class="animate-pulse">Generating with Groq AI...</span>`;
        generateBtn.disabled = true;

        try {
            const prompt = `You are an expert Indian agronomist AI generating a comprehensive, personalized crop calendar.

Input Parameters:
- Location: ${location}
- Crop: ${crop}
- Soil Type: ${soil}
- Preferred Sowing Date: ${sowDate}
- Irrigation Available: ${irrigation}
- Farming Scale: ${scale}
- Current Date: ${new Date().toISOString().split('T')[0]}

Generate a detailed week-by-week farming calendar from pre-sowing to post-harvest.

Return ONLY valid JSON (no markdown, no backticks) with exactly these keys:
{
  "weather": {
    "temp": "e.g. 32°C",
    "humidity": "e.g. 72%",
    "rainfall": "e.g. 120mm"
  },
  "risks": {
    "flood": 25,
    "heat": 40,
    "pest": 60,
    "drought": 15
  },
  "alerts": [
    { "type": "urgent", "message": "Alert text here" },
    { "type": "upcoming", "message": "Alert text" },
    { "type": "positive", "message": "Positive update" }
  ],
  "weeks": [
    {
      "week": 1,
      "dateRange": "e.g. May 1 - May 7",
      "stage": "Pre-Sowing",
      "tasks": ["Task 1 with specific detail", "Task 2"]
    }
  ],
  "postHarvest": "Detailed post-harvest guidance including drying, storage, and next crop rotation."
}

IMPORTANT RULES:
- Generate 10-16 weeks covering the FULL crop lifecycle
- 'stage' MUST be one of: Pre-Sowing, Sowing Window, Germination, Vegetative Growth, Irrigation Schedule, Fertilizer Top-up, Pest Watch, Flowering, Fruiting, Pruning / Thinning, Harvest Window, Post-Harvest
- Each week should have 2-4 specific actionable tasks
- 'risks' values must be numbers 0-100
- Generate 3-5 alerts mixing urgent, upcoming, and positive types
- Use the actual sowing date "${sowDate}" to calculate real date ranges for each week
- Factor in the ${soil} soil type and ${irrigation} irrigation availability
- Make each task hyper-specific with quantities (kg/acre, mm/day, etc.)`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: "You are a precision agriculture calendar AI. You output valid JSON only." },
                        { role: "user", content: prompt }
                    ]
                })
            });

            const rawData = await response.json();
            if (!rawData.choices) throw new Error("Invalid API response");

            const data = JSON.parse(rawData.choices[0].message.content);

            // Populate Weather
            weatherTemp.textContent = data.weather?.temp || '--';
            weatherHumidity.textContent = data.weather?.humidity || '--';
            weatherRain.textContent = data.weather?.rainfall || '--';

            // Populate Risks
            const flood = data.risks?.flood || 0;
            const heat = data.risks?.heat || 0;
            const pest = data.risks?.pest || 0;
            const drought = data.risks?.drought || 0;

            riskFlood.style.width = `${flood}%`;
            riskHeat.style.width = `${heat}%`;
            riskPest.style.width = `${pest}%`;
            riskDrought.style.width = `${drought}%`;

            riskFloodL.textContent = getRiskLabel(flood);
            riskHeatL.textContent = getRiskLabel(heat);
            riskPestL.textContent = getRiskLabel(pest);
            riskDroughtL.textContent = getRiskLabel(drought);

            // Render Alerts
            renderAlerts(data.alerts || []);

            // Render Timeline
            renderTimeline(data.weeks || []);

            // Post Harvest
            postHarvest.textContent = data.postHarvest || 'No specific post-harvest guidance generated.';

            // Scroll
            setTimeout(() => {
                const y = results.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }, 200);

        } catch (error) {
            console.error("Groq Calendar Error:", error);
            alertsContainer.innerHTML = `<div class="alert-urgent rounded-xl px-4 py-3"><p class="text-xs font-bold text-red-800">🔴 Error generating calendar. Check your Groq API key or network connection. Details: ${error.message}</p></div>`;
            timelineContainer.innerHTML = '';
        } finally {
            generateBtn.innerHTML = oldText;
            generateBtn.disabled = false;
        }
    });
});
