# Scoring Matrix Reference

## MoSCoW Priority Framework

| Priority | Meaning | Guideline |
|----------|---------|-----------|
| **Must** | Non-negotiable for this release. The system is unusable without it. | ~60% of total effort |
| **Should** | Important but not critical. The system works without it, but with significant limitations. | ~20% of total effort |
| **Could** | Desirable. Nice to have if time permits. No significant impact if omitted. | ~15% of total effort |
| **Won't** | Explicitly excluded from this release. Acknowledged but deferred. | Documented for future |

## Story Points (Fibonacci Scale)

| Points | Complexity | Example |
|--------|-----------|---------|
| **1** | Trivial — simple config change, text update | Change a button label |
| **2** | Simple — well-understood, minimal logic | Add a static page |
| **3** | Moderate — some logic, clear approach | CRUD for a single entity |
| **5** | Complex — multiple components, some unknowns | User authentication flow |
| **8** | Very complex — significant unknowns, multiple integrations | Real-time notification system |
| **13** | Epic-level — should probably be split | Full reporting dashboard |

If a story is estimated at 13, consider splitting it into smaller stories.

## Acceptance Criteria Format (Given/When/Then)

```
Given [precondition / initial context]
When [action / trigger]
Then [expected outcome / observable result]
```

**Rules:**
- Each criterion tests ONE behavior
- Use concrete values, not vague descriptions ("Given a user with email 'test@example.com'" not "Given a user")
- Include both happy path and error scenarios
- At minimum: 1 happy path + 1 error path per story

## Definition of Done Checklist

Standard items to include for each story:
- [ ] Code written and follows project conventions
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] Code reviewed and approved
- [ ] Documentation updated (if applicable)
- [ ] Acceptance criteria verified
- [ ] No regressions in existing functionality
