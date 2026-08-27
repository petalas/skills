# Evaluation

Use to test how a skill, prompt, or structure changes agent behavior before adopting it.

1. Define the variant and a private rubric with three to six observable criteria.
2. Create isolated project-shaped environments. Remove evaluation words, model names, and comparison labels from anything a candidate sees.
3. Write one natural user request. Give every candidate the same request and comparable environment.
4. Run candidates in parallel on different available model families or reasoning profiles when possible.
5. Give sanitized outputs and the private rubric to one independent judge. The judge must compare all outputs in one pass.
6. Inspect candidate artifacts and available local run records yourself. Grade behavior from what happened, not from self-report.
7. Compare your reading with the judge. Treat disagreement as evidence that the rubric or judgment needs another pass.

Return the variant, rubric, candidate notes, blinded verdict, your synthesis, and an adoption recommendation.
