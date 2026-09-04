### Rules for Coding

#### Prime Directive

**There is nothing so useless as doing efficiently that which should not be done at all.**

Before optimizing execution, confirm that the proposed work is necessary, appropriate, and aligned with the actual objective.

#### 1. Read Before You Write

Inspect the relevant files, code, configuration, documentation, and surrounding context before making changes.

Do not modify code you have not first understood in context.

#### 2. Understand Before You Modify

Determine what the existing system does, why it behaves that way, and what constraints it operates under before proposing a change.

Do not treat symptoms without understanding the underlying behavior.

#### 3. State Assumptions Explicitly

When information is uncertain or incomplete, state the assumption being made before acting on it.

Do not silently convert uncertainty into fact.

#### 4. Do Not Invent Architecture

Work with the architecture that actually exists.

Do not fabricate abstractions, services, interfaces, dependencies, conventions, or future requirements that are not supported by the repository or the task.

#### 5. Prefer the Smallest Correct Change

Make the simplest change that fully solves the problem.

Minimize affected files, dependencies, abstractions, and behavioral surface area. Complexity requires justification.

#### 6. Do Not Refactor for Display

Do not rewrite, restructure, generalize, or modernize unrelated code merely to demonstrate sophistication.

Refactoring is justified only when it materially improves the requested change, correctness, maintainability, or safety.

#### 7. Every Change Must Be Explainable

Each meaningful action should have a clear reason tied to evidence, requirements, or an identified problem.

If a change cannot be explained simply, reconsider whether it should be made.

#### 8. Verify the Result, Not Just the Edit

After making changes, inspect the resulting behavior and output.

Do not assume that syntactically valid code or a successful edit means the task is complete.

#### 9. Test Before Delivery

Run the relevant tests, checks, builds, linters, type checks, or validation commands before declaring the work complete.

If verification cannot be performed, state exactly what was not verified and why.

#### 10. Learn From Repeated Failures

When the same class of error occurs more than once, record the lesson and adjust the approach so it is not repeated.

Repeated mistakes should produce durable improvements in reasoning, process, tests, or documentation.

#### 11. Preserve What Does Not Need to Change

Treat existing working behavior as a constraint.

Avoid unrelated edits and preserve established interfaces, conventions, and behavior unless changing them is necessary to accomplish the task.

#### 12. Completion Requires Evidence

A task is complete only when:

* the relevant context was inspected;
* the requested change was implemented;
* assumptions and limitations are explicit;
* unnecessary scope was avoided;
* the resulting behavior was verified; and
* relevant tests or checks were run successfully, or any inability to run them was clearly disclosed.

**Default operating principle: understand first, change minimally, verify rigorously.**
