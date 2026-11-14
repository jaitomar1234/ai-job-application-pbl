const API_URL = "https://ai-job-application-pbl.onrender.com";

let currentMatch = 0;

const STATUS_COLORS = {
    applied: "#3bb5b0",
    interview: "#4f5bd5",
    offer: "#2fb86f",
    rejected: "#e0357a"
};

// ---------- HELPERS ----------

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function normalizeStatus(status) {
    const key = String(status || "").toLowerCase();
    return STATUS_COLORS[key] ? key : "applied";
}

function setGreeting() {
    const hour = new Date().getHours();
    let text = "Good Evening";
    if (hour < 12) text = "Good Morning";
    else if (hour < 17) text = "Good Afternoon";
    document.getElementById("greeting").textContent = `${text} 👋`;
}

function setLoading(button, loading, label) {
    if (!button) return;
    button.disabled = loading;
    if (label) button.textContent = loading ? "Please wait..." : label;
}

// ---------- ANALYZE RESUME ----------

async function analyzeResume() {

    const resume = document.getElementById("resume").value;
    const jobDescription = document.getElementById("jobDescription").value;
    const button = document.querySelector(".btn.primary");

    setLoading(button, true, "Analyze Resume");

    try {

        const response = await fetch(`${API_URL}/api/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume, jobDescription })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        currentMatch = data.matchPercentage;

        const strong = data.strongSkills || [];
        const missing = data.missingSkills || [];
        const improvements = data.improvements || [];

        const chips = (list, type) =>
            list.length
                ? list.map(s => `<span class="chip ${type}">${escapeHtml(s)}</span>`).join("")
                : `<span class="chip ${type}">None</span>`;

        document.getElementById("results").innerHTML = `
            <div class="tiles">
                <div class="tile main-score">
                    <span>Overall Match</span>
                    <strong>${escapeHtml(data.matchPercentage)}%</strong>
                </div>
                <div class="tile good">
                    <span>Strong Skills</span>
                    <strong>${strong.length}</strong>
                </div>
                <div class="tile warn">
                    <span>Missing Skills</span>
                    <strong>${missing.length}</strong>
                </div>
                <div class="tile">
                    <span>Improvements</span>
                    <strong>${improvements.length}</strong>
                </div>
            </div>

            <div class="bar"><div style="width:${Number(data.matchPercentage) || 0}%"></div></div>

            <div class="result-title">Strong Skills</div>
            <div class="chips">${chips(strong, "good")}</div>

            <div class="result-title">Missing Skills</div>
            <div class="chips">${chips(missing, "warn")}</div>

            <div class="result-title">Resume Improvements</div>
            <ul class="tips">
                ${improvements.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
        `;

    } catch (error) {
        alert("Unable to connect to backend.");
    } finally {
        setLoading(button, false, "Analyze Resume");
    }

}

// ---------- GENERATE TAILORED RESUME ----------

async function generateResume() {

    const resume = document.getElementById("resume").value;
    const jobDescription = document.getElementById("jobDescription").value;
    const button = document.querySelector(".btn.ghost");

    setLoading(button, true, "Generate Tailored Resume");

    try {

        const response = await fetch(`${API_URL}/api/tailor-resume`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume, jobDescription })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        document.getElementById("tailoredResume").textContent = data.tailoredResume;

        document.getElementById("tailor").scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        alert("Unable to generate resume.");
    } finally {
        setLoading(button, false, "Generate Tailored Resume");
    }

}

// ---------- ADD APPLICATION ----------

async function addApplication() {

    const company = document.getElementById("company").value;
    const position = document.getElementById("position").value;
    const status = document.getElementById("status").value;

    if (!company || !position) {
        alert("Enter company and position.");
        return;
    }

    try {

        const response = await fetch(`${API_URL}/api/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                company,
                position,
                matchPercentage: currentMatch,
                status
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        document.getElementById("company").value = "";
        document.getElementById("position").value = "";

        alert("Application saved!");

        loadApplications();

    } catch (error) {
        alert("Unable to save application.");
    }

}

// ---------- TRACKER (DONUT + LEGEND) ----------

function updateTracker(applications) {

    const counts = { applied: 0, interview: 0, offer: 0, rejected: 0 };

    applications.forEach(app => {
        counts[normalizeStatus(app.status)]++;
    });

    const total = applications.length;

    document.getElementById("donutTotal").textContent = total;

    const donut = document.getElementById("donut");

    if (total === 0) {
        donut.style.background = "conic-gradient(#e6e8f0 0 100%)";
    } else {
        let start = 0;
        const parts = [];

        Object.keys(counts).forEach(key => {
            if (counts[key] === 0) return;
            const end = start + (counts[key] / total) * 100;
            parts.push(`${STATUS_COLORS[key]} ${start}% ${end}%`);
            start = end;
        });

        donut.style.background = `conic-gradient(${parts.join(", ")})`;
    }

    document.getElementById("legend").innerHTML = Object.keys(counts).map(key => `
        <li>
            <span class="dot" style="background:${STATUS_COLORS[key]}"></span>
            ${key.charAt(0).toUpperCase() + key.slice(1)}
            <span class="count">${counts[key]}</span>
        </li>
    `).join("");

}

// ---------- LOAD APPLICATIONS ----------

async function loadApplications() {

    try {

        const response = await fetch(`${API_URL}/api/applications`);

        const applications = await response.json();

        updateTracker(applications);

        const container = document.getElementById("applications");

        if (!applications.length) {
            container.innerHTML = `<p class="no-apps">No applications yet. Add your first one above.</p>`;
            return;
        }

        container.innerHTML = applications.map(app => `

            <div class="application">

                <h3>${escapeHtml(app.company)}</h3>

                <p>Position: ${escapeHtml(app.position)}</p>

                <p>Match: ${escapeHtml(app.matchPercentage)}%</p>

                <div class="meta">
                    <span class="status ${normalizeStatus(app.status)}">
                        ${escapeHtml(app.status)}
                    </span>
                </div>

                <button onclick="deleteApplication(${Number(app.id)})">
                    Delete
                </button>

            </div>

        `).join("");

    } catch (error) {
        console.error("Unable to load applications:", error);
    }

}

// ---------- DELETE APPLICATION ----------

async function deleteApplication(id) {

    try {

        await fetch(`${API_URL}/api/applications/${id}`, {
            method: "DELETE"
        });

        loadApplications();

    } catch (error) {
        alert("Unable to delete application.");
    }

}

// ---------- NAV HIGHLIGHT ----------

document.querySelectorAll(".nav a").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav a").forEach(a => a.classList.remove("active"));
        link.classList.add("active");
    });
});

// ---------- START ----------

setGreeting();
loadApplications();