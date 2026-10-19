# FoodLens AI - Deterministic Food Intelligence Platform


## Repository Structure

```

FoodLens-AI/
├── docker-compose.yml
├── .env.example
├── README.md
├── database/
│   └── migrations/
│       ├── V1__Initial_Schema.sql
│       ├── V2__Seed_Canonical_Ingredients.sql
│       └── V3__Seed_Knowledge_Graph.sql
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── resources/
│           │   ├── application.yml
│           │   └── db/migration/
│           │       ├── V1__Initial_Schema.sql (symlink/copy)
│           │       ├── V2__Seed_Canonical_Ingredients.sql
│           │       └── V3__Seed_Knowledge_Graph.sql
│           └── java/com/foodlens/
│               ├── FoodLensApplication.java
│               ├── config/
│               │   ├── CorsConfig.java
│               │   └── GlobalExceptionHandler.java
│               ├── model/
│               │   └── IngredientEntity.java
│               ├── dto/
│               │   ├── MatchRequest.java
│               │   ├── MatchedIngredientDTO.java
│               │   ├── HealthDimensionScore.java
│               │   ├── MultiProfileAnalysisResult.java
│               │   ├── EvaluateProfileRequest.java
│               │   ├── GraphNodeDTO.java
│               │   ├── GraphEdgeDTO.java
│               │   └── KnowledgeGraphResponseDTO.java
│               ├── repository/
│               │   ├── IngredientFuzzyRepository.java
│               │   └── KnowledgeGraphRepository.java
│               ├── service/
│               │   ├── IngredientParserService.java
│               │   ├── DeterministicHealthEngine.java
│               │   ├── KnowledgeGraphService.java
│               │   └── ContextBoundGeminiExplainer.java
│               └── controller/
│                   ├── IngredientMatchController.java
│                   ├── HealthEngineController.java
│                   └── KnowledgeGraphController.java
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── index.css
        ├── main.tsx
        ├── App.tsx
        ├── store/
        │   └── useScanStore.ts
        ├── utils/
        │   └── imageProcessor.ts
        ├── components/
        │   ├── scanner/
        │   │   └── ImageDropzone.tsx
        │   ├── dashboard/
        │   │   └── HealthRadarChart.tsx
        │   └── KnowledgeGraphViewer.tsx
        └── pages/
            └── Dashboard.tsx

```



## What I have learned building this ( Might be useful for anyone who reads it. I hope nobody reads it...)

```
First of all, let me start on why I created this project-

I am from a tier 3 college and they asked my class to register for MSME.

I registered it out of FOMO (I regret it) but I was really not qualified to do so.

I chose this topic and started building it. I had built many static web games and bit off more than I could chew.

I started using AI for this. It felt great and fulfilling that I was building something myself (AI not me) and I felt proud about it.

I started flexing it to my friends and some faculty with this project.

Now, the project was built and the database was connected. I had used 4-5 dependencies for this.

Then, the nightmare started. There were errors. Some were small, but instead of fixing them, I got into a spiral where correcting codes generated more errors than there were initially.

I have spent an unnecessarily excruciating amount of time in debugging it. I had gemini pro plan because of 'JIO' recharge and I have used it somewhat productively I guess.

Like, I would take screenshots of errors and stuff I did not know and upload them to Gemini to fix them.

It all ended up quite bad.

I am writing this because I am dropping this project. I am scared to even touch it right now.

What this thought me was to focus on fundamentals right now. I am in the third semester of my BE.cse journey and I have my exams in the next 3 days.

"Quality will always beat quantity in the long run."

Having fundamentals clear gives a very lethal edge that vibe-coding can never provide.

I got a lesson and I will remember it.

```
