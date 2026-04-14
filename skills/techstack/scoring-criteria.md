# Tech Stack Scoring Criteria

## Weighted Criteria

| Criteria | Weight | What It Measures |
|----------|--------|-----------------|
| **Scalability** | 25% | Can this technology handle the project's growth? Consider horizontal scaling, caching, async processing. |
| **Learning Curve** | 15% | How quickly can the team become productive? Consider existing team skills, documentation quality, community tutorials. |
| **Community/Support** | 15% | Is there an active community? Regular releases? Stack Overflow presence? Commercial support options? |
| **Cost** | 20% | Total cost of ownership: licensing, hosting, tooling, developer time. Open source scores higher. |
| **Fit with Requirements** | 25% | How well does it match the project's specific functional and non-functional requirements? |

## Scoring Scale

| Score | Meaning |
|-------|---------|
| 9-10 | Excellent — clearly the best choice for this criterion |
| 7-8 | Good — solid choice with minor limitations |
| 5-6 | Adequate — works but has notable trade-offs |
| 3-4 | Weak — significant limitations for this use case |
| 1-2 | Poor — not recommended for this criterion |

## Calculating Weighted Total

```
Total = (Scalability × 0.25) + (Learning × 0.15) + (Community × 0.15) + (Cost × 0.20) + (Fit × 0.25)
```

## Technology Layers

Evaluate each of these layers independently:

1. **Frontend** — UI framework, state management, styling
2. **Backend** — Language, framework, API style (REST/GraphQL)
3. **Database** — Primary datastore, caching layer
4. **Infrastructure** — Hosting, CI/CD, containerization
5. **Testing** — Unit, integration, E2E frameworks
6. **CI/CD** — Build pipeline, deployment automation

## Validation Mode Rules

When evaluating an existing stack (user already has choices):
- Score each existing choice using the same criteria
- If a choice scores below 5.0 weighted total, flag it as a concern with alternatives
- If a choice scores above 7.0, confirm it as a solid choice
- Between 5.0-7.0, present the trade-offs and let the user decide
