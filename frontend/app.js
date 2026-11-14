
let currentMatch = 0;

// ANALYZE RESUME

async function analyzeResume() {

    const resume = document.getElementById("resume").value;

    const jobDescription =
        document.getElementById("jobDescription").value;

    try {

        const response = await fetch("/api/analyze", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                resume,
                jobDescription
            })

        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        currentMatch = data.matchPercentage;

        document.getElementById("results").innerHTML = `
            <h3>Match: ${data.matchPercentage}%</h3>

            <h4>Strong Skills</h4>
            <p>${data.strongSkills.join(", ")}</p>

            <h4>Missing Skills</h4>
            <p>${data.missingSkills.join(", ")}</p>

            <h4>Resume Improvements</h4>
            <ul>
                ${data.improvements.map(
                    item => `<li>${item}</li>`
                ).join("")}
            </ul>
        `;

    } catch (error) {
        alert("Unable to connect to backend.");
    }

}

// GENERATE TAILORED RESUME

async function generateResume() {

    const resume = document.getElementById("resume").value;

    const jobDescription =
        document.getElementById("jobDescription").value;

    try {

        const response = await fetch("/api/tailor-resume", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                resume,
                jobDescription
            })

        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        document.getElementById("tailoredResume").textContent =
            data.tailoredResume;

    } catch (error) {
        alert("Unable to generate resume.");
    }

}

// ADD APPLICATION

async function addApplication() {

    const company =
        document.getElementById("company").value;

    const position =
        document.getElementById("position").value;

    const status =
        document.getElementById("status").value;

    if (!company || !position) {
        alert("Enter company and position.");
        return;
    }

    const response = await fetch("/api/applications", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

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

    alert("Application saved!");

    loadApplications();

}

// LOAD APPLICATIONS

async function loadApplications() {

    const response = await fetch("/api/applications");

    const applications = await response.json();

    document.getElementById("applications").innerHTML =
        applications.map(app => `

            <div class="application">

                <h3>${app.company}</h3>

                <p>Position: ${app.position}</p>

                <p>Match: ${app.matchPercentage}%</p>

                <p>Status: ${app.status}</p>

                <button onclick="deleteApplication(${app.id})">
                    Delete
                </button>

            </div>

        `).join("");

}

// DELETE APPLICATION

async function deleteApplication(id) {

    await fetch(`/api/applications/${id}`, {
        method: "DELETE"
    });

    loadApplications();

}

// LOAD ON PAGE START

loadApplications();
