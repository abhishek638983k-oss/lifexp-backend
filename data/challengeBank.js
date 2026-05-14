const CATEGORIES = [
    { key: "coding", label: "Coding" },
    { key: "fitness", label: "Fitness" },
    { key: "study", label: "Study" },
    { key: "health", label: "Health" },
    { key: "career", label: "Career" },
    { key: "creativity", label: "Creativity" },
    { key: "mindfulness", label: "Mindfulness" },
    { key: "finance", label: "Finance" },
    { key: "communication", label: "Communication" },
    { key: "household", label: "Household" }
];

const DIFFICULTY_XP = {
    easy: 25,
    medium: 50,
    hard: 90
};

const STATIC_TASKS = {
    coding: [
        "Solve one array problem", "Build a small form validation", "Refactor one function", "Read docs for one API",
        "Write five unit test cases", "Fix one warning in a project", "Practice recursion for 20 minutes",
        "Create a tiny CLI script", "Review one old code file", "Implement a sorting function", "Debug one failing case",
        "Make one responsive component", "Write notes on one design pattern", "Push one clean commit", "Explain one concept aloud"
    ],
    fitness: [
        "Walk for 20 minutes", "Do three sets of squats", "Stretch your full body", "Run for 10 minutes",
        "Do a core workout", "Practice push-ups", "Take 6000 steps", "Try a mobility routine",
        "Hold a plank set", "Cycle for 15 minutes", "Do a light warm-up and cooldown", "Practice breathing during exercise",
        "Climb stairs for 10 minutes", "Do a no-equipment workout", "Track today's movement"
    ],
    study: [
        "Revise one chapter", "Make ten flashcards", "Summarize a topic in one page", "Solve five practice questions",
        "Teach a topic to yourself", "Read for 25 focused minutes", "Create a study checklist", "Review yesterday's notes",
        "Take a timed mini quiz", "Clean your study desk", "Plan tomorrow's study block", "Highlight weak areas",
        "Watch one educational lesson", "Make a formula sheet", "Practice active recall"
    ],
    health: [
        "Drink two glasses of water", "Plan one balanced meal", "Sleep 30 minutes earlier", "Take a screen break",
        "Prepare a healthy snack", "Track your water intake", "Do a posture reset", "Step outside for sunlight",
        "Avoid sugary drinks today", "Prepare tomorrow's breakfast", "Do a 10 minute walk after eating",
        "Update a simple health log", "Practice eye rest breaks", "Reduce late-night scrolling", "Eat one fruit"
    ],
    career: [
        "Update one resume bullet", "Apply to one opportunity", "Improve your LinkedIn headline", "Practice one interview answer",
        "Write a short project summary", "Reach out to one professional contact", "Research one company",
        "Polish one portfolio section", "List three strengths", "Prepare one STAR story", "Read one job description carefully",
        "Learn one workplace tool tip", "Draft a short intro message", "Review your weekly career goal", "Save one useful resource"
    ],
    creativity: [
        "Sketch for 15 minutes", "Write 200 words", "Make a tiny moodboard", "Create one color palette",
        "Record a melody idea", "Edit one photo", "Draft a logo variation", "Try a new brush or tool",
        "Write three title ideas", "Remix an old idea", "Create a thumbnail concept", "Study one inspiring work",
        "Make a quick prototype", "Design one icon", "Share a small creative output"
    ],
    mindfulness: [
        "Meditate for five minutes", "Write three things you noticed", "Do a breathing exercise", "Journal one feeling",
        "Take a silent walk", "Practice gratitude", "Do a two minute reset", "Notice tension and relax it",
        "Write one worry and one action", "Listen without multitasking", "Clean one calm space", "Pause before reacting",
        "Name five things around you", "Reflect on one win", "Set one intention"
    ],
    finance: [
        "Track today's spending", "Review one subscription", "Save a small amount", "Make a simple budget note",
        "Compare one purchase before buying", "Read about one finance concept", "Check your account balance",
        "Set one money goal", "Categorize three expenses", "Plan tomorrow's spending", "Avoid impulse buying today",
        "Review a bill due date", "Update a savings tracker", "Learn about emergency funds", "Clean one financial document"
    ],
    communication: [
        "Send one thoughtful message", "Practice a short introduction", "Ask one clear question", "Listen actively in one conversation",
        "Rewrite one message to be clearer", "Give one genuine compliment", "Summarize a conversation after it ends",
        "Practice speaking for two minutes", "Prepare one meeting point", "Clarify one confusing topic", "Avoid interrupting once",
        "Write a polite follow-up", "Share one useful update", "Practice saying no respectfully", "Ask for feedback"
    ],
    household: [
        "Clean your desk", "Organize one drawer", "Wash dishes for 10 minutes", "Do a laundry task",
        "Take out trash", "Make your bed", "Plan one grocery item", "Declutter five items",
        "Wipe one surface", "Prepare clothes for tomorrow", "Arrange your workspace", "Water plants",
        "Sweep one area", "Fix one small mess", "Create a mini cleaning timer"
    ]
};

const RAPID_VERBS = [
    "Complete", "Practice", "Review", "Build", "Plan", "Clean", "Write", "Solve", "Track", "Improve"
];

function difficultyForIndex(index) {
    if (index % 5 === 0) return "hard";
    if (index % 2 === 0) return "medium";
    return "easy";
}

function buildSeedChallenges() {
    const challenges = [];

    Object.entries(STATIC_TASKS).forEach(([category, tasks]) => {
        tasks.forEach((task, index) => {
            const difficulty = difficultyForIndex(index + 1);
            challenges.push({
                title: task,
                description: `${task} and mark it complete when you genuinely finish it.`,
                category,
                difficulty,
                xp: DIFFICULTY_XP[difficulty],
                estimatedMinutes: difficulty === "easy" ? 10 : difficulty === "medium" ? 25 : 45,
                source: "static",
                tags: [category, difficulty],
                seedKey: `${category}-${index + 1}`
            });
        });
    });

    return challenges;
}

function buildRapidChallenge(category = "coding", difficulty = "easy") {
    const categoryTasks = STATIC_TASKS[category] || STATIC_TASKS.coding;
    const baseTask = categoryTasks[Math.floor(Math.random() * categoryTasks.length)];
    const verb = RAPID_VERBS[Math.floor(Math.random() * RAPID_VERBS.length)];
    const normalizedDifficulty = DIFFICULTY_XP[difficulty] ? difficulty : "easy";
    const minutes = normalizedDifficulty === "easy" ? 7 : normalizedDifficulty === "medium" ? 18 : 35;

    return {
        title: `${verb}: ${baseTask}`,
        description: `Rapid mode challenge. Set a ${minutes} minute timer and finish one focused attempt.`,
        category,
        difficulty: normalizedDifficulty,
        xp: DIFFICULTY_XP[normalizedDifficulty],
        estimatedMinutes: minutes,
        source: "rapid",
        tags: [category, normalizedDifficulty, "rapid"],
        seedKey: `rapid-${category}-${Date.now()}-${Math.floor(Math.random() * 100000)}`
    };
}

module.exports = {
    CATEGORIES,
    DIFFICULTY_XP,
    buildSeedChallenges,
    buildRapidChallenge
};
