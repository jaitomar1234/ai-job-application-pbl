
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const applicationsFile = path.join(
    __dirname,
    "data",
    "applications.json"
);

// SKILLS DATABASE

const skillsDatabase = [
    "html", "css", "javascript", "react",
    "node.js", "node", "express", "typescript",
    "python", "java", "c++", "sql",
    "mongodb", "mysql", "aws", "azure",
    "git", "github", "docker", "figma",
    "machine learning", "data structures",
    "algorithms", "rest api", "api"
];

// EXTRACT SKILLS

function extractSkills(text) {

    const lowerText = text.toLowerCase();

    return skillsDatabase.filter(skill =>
        lowerText.includes(skill.toLowerCase())
    );
}

// READ APPLICATIONS

function getApplications() {
    try {
        return JSON.parse(
            fs.readFileSync(applicationsFile, "utf8")
        );
    } catch {
        return [];
    }
}

// WRITE APPLICATIONS

function saveApplications(applications) {

    fs.mkdirSync(path.dirname(applicationsFile), {
        recursive: true
    });

    fs.writeFileSync(
        applicationsFile,
        JSON.stringify(applications, null, 2)
    );
}

// HOME ROUTE

app.get("/api/health", (req, res) => {

    res.json({
        message: "AI Job Application Copilot Backend Running!"
    });

});

// ANALYZE RESUME

app.post("/api/analyze", (req, res) => {

    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
        return res.status(400).json({
            message: "Resume and job description are required."
        });
    }

    const resumeSkills = extractSkills(resume);
    const jobSkills = extractSkills(jobDescription);

    const strongSkills = jobSkills.filter(skill =>
        resumeSkills.includes(skill)
    );

    const missingSkills = jobSkills.filter(skill =>
        !resumeSkills.includes(skill)
    );

    let matchPercentage = 0;

    if (jobSkills.length > 0) {
        matchPercentage = Math.round(
            (strongSkills.length / jobSkills.length) * 100
        );
    }

    // RESUME IMPROVEMENTS

    const improvements = [];

    if (missingSkills.length > 0) {
        improvements.push(
            "Improve these skills: " +
            missingSkills.join(", ")
        );
    }

    if (!resume.toLowerCase().includes("project")) {
        improvements.push(
            "Add 2-3 relevant projects."
        );
    }

    if (!resume.toLowerCase().includes("github")) {
        improvements.push(
            "Add your GitHub profile."
        );
    }

    improvements.push(
        "Use relevant keywords from the job description."
    );

    res.json({
        matchPercentage,
        strongSkills,
        missingSkills,
        improvements,
        resumeSkills,
        jobSkills
    });

});

// GENERATE TAILORED RESUME

app.post("/api/tailor-resume", (req, res) => {

    const { resume, jobDescription } = req.body;

    if (!resume || !jobDescription) {
        return res.status(400).json({
            message: "Resume and job description are required."
        });
    }

    const resumeSkills = extractSkills(resume);
    const jobSkills = extractSkills(jobDescription);

    const strongSkills = jobSkills.filter(skill =>
        resumeSkills.includes(skill)
    );

    const missingSkills = jobSkills.filter(skill =>
        !resumeSkills.includes(skill)
    );

    const tailoredResume = `
TAILORED RESUME

PROFESSIONAL SUMMARY

Software developer with knowledge of:
${strongSkills.join(", ")}

KEY SKILLS

${strongSkills.map(s => "✓ " + s).join("\n")}

SKILLS TO DEVELOP

${missingSkills.map(s => "• " + s).join("\n")}

ORIGINAL RESUME

${resume}

JOB DESCRIPTION

${jobDescription}
`;

    res.json({
        tailoredResume
    });

});

// ADD APPLICATION

app.post("/api/applications", (req, res) => {

    const {
        company,
        position,
        matchPercentage,
        status
    } = req.body;

    if (!company || !position) {
        return res.status(400).json({
            message: "Company and position required."
        });
    }

    const applications = getApplications();

    const newApplication = {
        id: Date.now(),
        company,
        position,
        matchPercentage: matchPercentage || 0,
        status: status || "Applied",
        date: new Date().toLocaleDateString()
    };

    applications.push(newApplication);

    saveApplications(applications);

    res.json({
        message: "Application saved successfully!",
        application: newApplication
    });

});

// GET APPLICATIONS

app.get("/api/applications", (req, res) => {

    res.json(getApplications());

});

// UPDATE APPLICATION STATUS

app.patch("/api/applications/:id", (req, res) => {

    const applications = getApplications();

    const application = applications.find(
        a => a.id === Number(req.params.id)
    );

    if (!application) {
        return res.status(404).json({
            message: "Application not found."
        });
    }

    application.status = req.body.status;

    saveApplications(applications);

    res.json(application);

});

// DELETE APPLICATION

app.delete("/api/applications/:id", (req, res) => {

    let applications = getApplications();

    applications = applications.filter(
        a => a.id !== Number(req.params.id)
    );

    saveApplications(applications);

    res.json({
        message: "Application deleted."
    });

});

// START SERVER

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});
