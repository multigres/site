---
slug: ai-parser-engineering
title: 'The Engineering Discipline That Made AI Actually Useful'
authors: [manan]
date: 2026-02-05
tags: [postgres, multigres, ai, parser, engineering]
image: /img/blog/ai-parser-engineering.png
description: "Same engineer. Same complexity. A year last time, eight weeks this time. This isn't a story about AI writing code. It's a story about the system, expertise, and discipline that made AI actually useful."
---

# The Engineering Discipline That Made AI Actually Useful

Building a production-grade parser is an exercise in discipline. You need to translate thousands of grammar rules exactly. You need to catch subtle bugs that only surface on edge cases you've never seen. You need to verify every decision against a reference implementation. There are no shortcuts.

I know this because I've done it before. I led the effort to build the MySQL parser for Vitess. That took over a year with help from talented contributors. So when we needed a Postgres parser for [Multigres](https://www.multigres.com), I expected a similar timeline.

It took eight weeks. 287,786 lines of code. 304 files. 130 commits. 71.2% test coverage. 2.5x faster than the cgo (Go's C interop) alternative.

<!--truncate-->

The difference wasn't AI writing code for me. It was three things: a **system** for coordinating work across sessions, the **expertise** to recognize when the output was wrong, and the **discipline** to verify everything. Claude amplified what I brought to the table, but without all three, it wouldn't have worked.

Claude typed. I engineered.

AI multiplies your expertise, but only if you already know what right looks like.

Here's what I learned.

## Why build a parser at all?

[Multigres](https://www.multigres.com) is Vitess for Postgres, a horizontally scalable layer that sits in front of your database. It distributes data across multiple database servers called shards. Each shard holds a subset of your data. When a query comes in, Multigres figures out which shard (or shards) should handle it and routes accordingly.

To route queries intelligently, we need to understand them. To understand them, we need a parser.

What does "understand" mean?

Say a user sends `select * from orders where customer_id = 12345`. Multigres needs to know: Which table is it hitting? What's the filter? Is it a read or a write? (Yes, a `select` can write! Call a non-read-only function and you've got a write operation.) The answers determine which database server handles the query.

You can't answer those questions by looking at a string of text. You need to parse it into a structure you can actually inspect, an abstract syntax tree (AST) in computer jargon.

Once we have that structure, we can do more with it. We can extract the value `12345` and use it to route the query to the correct shard, the one that holds that customer's data. We can also normalize the query, replacing `12345` with a placeholder to get `select * from orders where customer_id = ?`. That normalized form becomes a cache key: the next time we see the same query shape with a different customer ID, we can reuse the query plan instead of computing it from scratch.

This also means we need the reverse operation: taking an AST and turning it back into SQL. When Multigres rewrites a query, say, adding a shard filter or changing a table name, we need to serialize that modified tree back into a string we can send to Postgres. That's deparsing, and we'd need to build that too.

There's already a Go library for parsing Postgres: [pg_query_go](https://github.com/pganalyze/pg_query_go), which extracts the parser directly from Postgres source code. It works. We contemplated using it initially. But that would have required us to rely on cgo. That means cross-compilation headaches, platform-specific builds, and a runtime dependency on C libraries. And there's a real performance penalty, cgo calls have overhead that adds up fast when parsing is on the hot path, and for point queries, every microsecond matters.

All of these considerations pushed us towards choosing a pure Go parser. One that matched Postgres's grammar exactly, so we wouldn't be chasing compatibility bugs forever. One that was maintainable, well-tested, and fast.

This meant we were committing to porting the real Postgres grammar. The actual grammar rules, translated into Go's yacc equivalent. All AST node types. All the edge cases that make SQL parsing surprisingly hard.

This is the kind of project that sits on a roadmap for quarters. The kind you staff a small team for. But like I mentioned before, this wasn't my first rodeo. So we knew it was possible, but the timeline was still in question. I'd been using Claude for other work and had a hunch it could change the math on this project.

## My system: the directory that ran the project

Here's the thing about working with Claude: it has very little memory. Every conversation starts fresh. There's a memory feature, but it wasn't reliable enough. Crucial context would vanish at compaction. If you're doing something that spans multiple sessions, which any real project does, you need your own system.

My system was a directory.

I broke the project into multiple phases. Inside the directory, for each phase, I kept a master checklist of every task. AST structs to port, grammar rules to implement, tests to add. Each task had a status. Each phase had sub-phases (1A, 1B, 1C…) with clear scope.

For example, I generated a list of every AST struct in Postgres and used it as a checklist while porting. Each node got a checkbox, a name, and a reference to its location in the Postgres source:

```markdown
### JSON Nodes
- [ ] **JsonOutput** - JSON output specification (`src/include/nodes/parsenodes.h:1751`)
- [ ] **JsonArgument** - JSON function argument (`src/include/nodes/parsenodes.h:1762`)
- [ ] **JsonFuncExpr** - JSON function expression (`src/include/nodes/parsenodes.h:1785`)
- [ ] **JsonTable** - JSON_TABLE (`src/include/nodes/parsenodes.h:1821`)
```

Nothing fancy, just a markdown file claude could check off as we went. You can see [an example in the commit history](https://github.com/multigres/multigres/pull/109/changes/077e2eb527a75e674b30f33735559317648b6f5b#diff-e4100bd6b814bb938f932492b295b09d998dbc8cc2882c7c834b760bd2cd06f5).

I also kept session documents. At the end of each working session, I'd get Claude to write a summary: what we accomplished, what we tried that didn't work, what the next session should pick up. When I started a new session, Claude would read these files and have full context.

You can actually check out the internals by looking at [the commit history](https://github.com/multigres/multigres/pull/109/changes/22f043315158a6ddd9dcd9857e8b7339f455c59c). I didn't always commit all the internal files, but sometimes they'd slip in with `git add .`.

This sounds simple. It was also the entire job.

The actual coding, translating a grammar rule from C to Go, writing a test case, implementing an AST node, Claude could do that. Often faster than I could, and without getting tired. Of course it doesn't get it all right, but I am better off getting it to write 3000 lines of code and fixing 500 of those, instead of writing the 3000 from scratch myself.

Deciding what to work on next, recognizing when we'd gone down a wrong path, understanding why the grammar was ambiguous and how to resolve it, that was me. I wasn't pair programming. I was directing: scoping well-defined tasks, reviewing every output, and fixing what needed fixing.

## Using Claude and the expertise of knowing what right looks like

While porting the Postgres grammar to Go, Claude made mistakes. Constantly.

Sometimes it would implement a grammar rule that was subtly wrong, accepting inputs that Postgres would reject, or vice versa. Sometimes it would take an architectural shortcut that would cause problems three steps later. Sometimes it would confidently explain why its incorrect code was correct.

### **Example 1 (the type system subtlety):**

Here's a concrete example. In Go, I had a `Node` interface that all AST nodes implement, and a `NodeList` type for holding sequences of nodes. `NodeList` itself also implements `Node`—that's important because sometimes you need to nest lists within the tree.

Claude kept using `[]Node` (a slice of nodes) instead of `*NodeList` (a pointer to a NodeList). Both hold multiple nodes. Both seem interchangeable at first glance. But `[]Node` doesn't implement `Node`, so it can't be placed where the grammar expects a node.

### **Example 2 (fixing symptoms instead of causes):**

Another pattern: Claude would use the wrong type in a grammar rule, then "fix" the resulting type errors by adding conversion functions. The grammar says this rule produces an `X`, the code returns a `Y`, so Claude writes a `convertYToX()`function and moves on.

This technically compiles. It's also a mess.

The right fix is to change the grammar rule to produce the correct type in the first place, no conversion needed. But that requires understanding the grammar's structure and thinking a few steps ahead. Claude would take the local fix, the one that made the immediate error go away, without seeing that it was papering over a design mistake.

### **Example 3 (no reference to copy from):**

The parser itself was relatively straightforward, we had Postgres's grammar as a reference, so the job was translation. Deparsing was harder. Deparsing means taking the AST and turning it back into a SQL string.

Postgres doesn't have a standalone deparsing module we could copy from. Claude had to generate this logic from scratch. The error rate went up noticeably. Without a reference implementation to validate against, Claude would produce output that looked plausible but was subtly wrong, missing parentheses, incorrect operator precedence, edge cases that produced invalid SQL. This was where I spent a disproportionate amount of debugging time, and it reinforced the pattern: **Claude is much better at translating existing logic than inventing new logic correctly**.

None of this was surprising.

The surprising thing was how much it didn't matter.

It didn't matter because I knew what right looked like.

I've been working on parsers for years. I know how yacc grammars behave. I know what grammar conflicts mean and how to debug them. When Claude's output was wrong, I could see it, usually quickly. At that point, if it's a small fix, I would just go ahead and fix it myself. If it was bigger, I'd start a new session and get Claude to fix it, telling it that *I* made that mistake 😝 (This works better than you'd think.)

If I didn't already know how to build a parser, Claude wouldn't have helped. I would have accepted wrong output, made bad structural decisions, and ended up with a mess that didn't work.

AI doesn't replace expertise. It multiplies it.

## Trust, but verify: the discipline of working with AI

Fast output means nothing if the output is wrong. A parser that mostly works is a parser that fails in production at 3am on queries you've never seen.

So I verified, and then re-verified.

There were parts with small enough scope that I could let Claude take over with less oversight. The lexer, for example, is mostly a massive switch statement on characters and states. But the grammar was different.

First: As we kept implementing the grammar, I would read every grammar rule. Not skim, read. I compared each one against the Postgres source to confirm it matched. This took time, and it was boring, but it was necessary. Grammar rules are precise. A missing optional clause or a wrong precedence and you're silently accepting invalid SQL.

Second: I ported Postgres's own regression tests. The Postgres source tree includes extensive SQL test files in `src/test/regress/sql/`. I wrote a script to extract the queries and run them through our parser. Thousands of queries, covering edge cases the Postgres team has accumulated over decades.

When tests failed, I investigated each one. Some failures were bugs in our parser, we fixed those. Some were tests that were supposed to fail, checking that invalid syntax was rejected. I confirmed each of those too.

The result: 71.2% code coverage, validation against the real Postgres test suite, and confidence that when we say "Postgres-compatible grammar," we mean it. Will we find bugs? Probably. I'm 71.2% sure we won't 😝. But I wouldn't have fared any better writing it by hand. The test coverage would look the same.

And the performance? We benchmarked against pg_query_go, the cgo-based alternative. On individual queries, our pure Go parser is 2-3x faster:

| Query Type | Multigres | pg_query_go | Speedup |
| --- | --- | --- | --- |
| Simple SELECT | 1.6µs | 3.1µs | 2x |
| Complex SELECT | 3.2µs | 11.0µs | 3.5x |
| CREATE TABLE | 7.7µs | 26.4µs | 3.5x |

Across the full regression test suite, thousands of queries, Multigres parses in 145ms versus pg_query_go's 366ms. That's 2.5x faster, with no cgo overhead and no cross-compilation headaches.

The memory numbers are harder to compare directly since Go's runtime doesn't track allocations on the C side of cgo. But for a hot-path component like a parser, the speed difference alone justifies the pure Go approach.

## The new normal

I think this is what the future looks like for a lot of software work. Not AI replacing engineers, but engineers operating at a different level of abstraction. **Less time typing, more time thinking**. Less time on the mechanical translation of ideas to code, more time on the ideas themselves.

The MySQL parser took a year because the bottleneck was implementation. The Postgres parser took two months because the bottleneck moved. Now it's about how fast you can make good decisions, verify correctness, and course-correct when things go wrong.

The leverage is real. But it requires systems (my coordination directory), genuine expertise (knowing when Claude is wrong), and discipline (reading every grammar rule). This isn't a shortcut. It's a different way of working. One that demands more from you as an engineer, not less. That's how a year became eight weeks.