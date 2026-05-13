document.addEventListener('DOMContentLoaded', () => {
    // Groq API Key (Validated)
    const API_KEY = "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";

    const form = document.getElementById('disease-form');
    const imageInput = document.getElementById('crop-image');
    const imagePreview = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const results = document.getElementById('results-container');
    const inputPanel = document.getElementById('input-panel');

    // UI elements to update
    const resClass = document.getElementById('res-class');
    const resSeverity = document.getElementById('res-severity');
    const resSpread = document.getElementById('res-spread');
    const resName = document.getElementById('res-name');
    const resScience = document.getElementById('res-science');
    const resSymptoms = document.getElementById('res-symptoms');
    const resConf = document.getElementById('res-conf');
    const resLoss = document.getElementById('res-loss');

    const actImm = document.getElementById('act-immediate');
    const actChem = document.getElementById('act-chem');
    const actOrg = document.getElementById('act-org');
    const actWater = document.getElementById('act-water');
    const actPrev = document.getElementById('act-prev');
    const actFollow = document.getElementById('act-follow');
    const actWeather = document.getElementById('act-weather');

    const demoBtn = document.getElementById('demo-disease-btn');
    const resetToolBtn = document.getElementById('reset-tool-btn');

    // ========================================
    // Demo & Reset Logic
    // ========================================
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            document.getElementById('param-crop').value = 'CORN';
            document.getElementById('param-stage').value = 'Fruiting';
            document.getElementById('param-part').value = 'Leaves / Kernels';
            document.getElementById('param-onset').value = 'Less than a week';
            document.getElementById('param-spread').value = 'Localized';
            document.getElementById('param-weather').value = 'Hot and humid';
            document.getElementById('param-irrigation').value = 'Drip';
            document.getElementById('param-soil').value = 'Loamy';
            document.getElementById('param-fert').value = 'NONE';
            document.getElementById('param-pest').value = 'NONE';
        });
    }

    if (resetToolBtn) {
        resetToolBtn.addEventListener('click', () => {
            form.reset();
            resetImage();
            results.classList.add('opacity-0', 'translate-y-10');
            setTimeout(() => {
                results.classList.add('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 600);
        });
    }

    // ========================================
    // Image Handling (Simulated Scan)
    // ========================================
    imageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.style.backgroundImage = `url(${e.target.result})`;
                imagePreview.classList.remove('hidden', 'shimmer');
                imagePreview.classList.add('animate-pulse');
                uploadPlaceholder.classList.add('hidden');
                removeImageBtn.classList.remove('hidden');
                setTimeout(() => imagePreview.classList.remove('animate-pulse'), 2000);
            }
            reader.readAsDataURL(file);
        }
    });

    const resetImage = () => {
        imageInput.value = '';
        imagePreview.style.backgroundImage = `none`;
        imagePreview.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        removeImageBtn.classList.add('hidden');
    };

    if (removeImageBtn) removeImageBtn.addEventListener('click', resetImage);

    // ========================================
    // Diagnostic Submission
    // ========================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!imageInput.files || imageInput.files.length === 0) {
            alert("Please upload a crop image to enable the AI vision-logic layer.");
            return;
        }

        const params = {
            crop: document.getElementById('param-crop').value,
            stage: document.getElementById('param-stage').value,
            part: document.getElementById('param-part').value,
            onset: document.getElementById('param-onset').value,
            spread: document.getElementById('param-spread').value,
            weather: document.getElementById('param-weather').value,
            irrigation: document.getElementById('param-irrigation').value,
            soil: document.getElementById('param-soil').value,
            fert: document.getElementById('param-fert').value,
            pest: document.getElementById('param-pest').value
        };
        
        const btn = form.querySelector('button[type="submit"]');
        const oldText = btn.innerHTML;
        btn.innerHTML = `<div class="flex items-center gap-3"><div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Determining Pathology...</div>`;
        btn.disabled = true;

        try {
            const prompt = `You are an elite plant pathologist AI. Perform a multi-stage diagnostic analysis based on these parameters:
            - Crop: ${params.crop}
            - Growth Stage: ${params.stage}
            - Primary Symptom Area: ${params.part}
            - Onset: ${params.onset}
            - Pattern: ${params.spread}
            - Environment: ${params.weather}
            - Context: ${params.soil} soil, ${params.irrigation} irrigation.
            - Recent inputs: ${params.fert} (fert), ${params.pest} (pest).

            Provide a high-precision diagnostic report in JSON format with these keys:
            {
              "diseaseName": "Common Name",
              "scientificName": "Latin Name",
              "classification": "Fungal/Bacterial/Viral/Nutrient",
              "severity": "Mild/Moderate/Severe",
              "spread": "Spread analysis",
              "confidence": "e.g. 98%",
              "lossRisk": "e.g. 30%",
              "symptoms": ["Observed trait 1", "Observed trait 2"],
              "immediateAction": "Urgent step",
              "chemicalTreatment": "Specific dosage and product type",
              "organicAlternative": "Bio-solution",
              "soilWater": "Hydration/pH correction",
              "prevention": "Sanitation/Rotation plan",
              "followUp": "Scouting frequency",
              "weatherAdvice": "Weather mitigation"
            }`;

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
                        { role: "system", content: "You are a specialized Agronomy API. Output strict JSON only." },
                        { role: "user", content: prompt }
                    ]
                })
            });

            const rawData = await response.json();
            const data = JSON.parse(rawData.choices[0].message.content);

            // Populate Results with "Scanning" feel
            resName.textContent = data.diseaseName;
            resScience.textContent = data.scientificName;
            resClass.textContent = data.classification;
            resSeverity.textContent = data.severity;
            resSpread.textContent = data.spread;
            resConf.textContent = data.confidence;
            resLoss.textContent = data.lossRisk;

            resSymptoms.innerHTML = data.symptoms.map(s => `
                <li class="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <div class="w-1.5 h-1.5 rounded-full bg-agri-gold"></div>
                    ${s}
                </li>
            `).join('');

            actImm.textContent = data.immediateAction;
            actChem.textContent = data.chemicalTreatment;
            actOrg.textContent = data.organicAlternative;
            actWater.textContent = data.soilWater;
            actPrev.textContent = data.prevention;
            actFollow.textContent = data.followUp;
            actWeather.textContent = data.weatherAdvice;

            // Apply Premium Status Styling
            resSeverity.className = `px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                data.severity.toLowerCase().includes('severe') ? 'bg-red-50 text-red-600' : 'bg-agri-gold/10 text-agri-gold'
            }`;

            // Reveal Results
            results.classList.remove('hidden');
            setTimeout(() => {
                results.classList.remove('opacity-0', 'translate-y-10');
                results.classList.add('opacity-100', 'translate-y-0');
                inputPanel.classList.add('opacity-50', 'pointer-events-none');
                window.scrollTo({ top: results.offsetTop - 100, behavior: 'smooth' });
            }, 100);

        } catch (error) {
            console.error("Diagnostic Error:", error);
            alert("The AI Intelligence Engine is currently overwhelmed or missing credentials. Please verify your Groq API Key.");
        } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    });
});
