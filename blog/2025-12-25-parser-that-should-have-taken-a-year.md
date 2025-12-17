---
slug: parser-in-go
authors: [manan]
date: 2025-12-25
tags: [postgres, parser, vibe-coding, multigres]
---

# The Parser That Should Have Taken a Year

In September 2025, I merged PR [#109](https://github.com/multigres/multigres/pull/109) into Multigres: a complete PostgreSQL parser written in pure Go. 287,786 lines of code. 304 files. 130 commits. Two months of work.

I know how long this could have taken because I've done it before. In the past, I led the effort to build the MySQL parser for Vitess. That took over a year, and I wasn't alone. I had help from some amazing interns. (Thank you LFX, and all the interns) This time around it was just me, sometimes working evenings and weekends, and it was done in less than eight weeks. But I wasn't working without help this time either.

This time I had Claude.

I know what you might be thinking. "AI-generated code", the mass-produced, context-free slop that's flooding pull requests everywhere. Code that technically compiles but misses the point. Code that is good for small projects, but not for "serious" work. Code that creates more work than it saves.

That's not my story.

## Why reinvent the wheel?

Multigres is Vitess for Postgres, a horizontally scalable layer that sits in front of your database. To route queries intelligently, we need to understand them. To understand them, we need a parser.

There's already a Go library for parsing Postgres: [pg_query_go](https://github.com/pganalyze/pg_query_go), which extracts the parser directly from Postgres source code. It works. We contemplated using it initially. But that would have required us to rely on CGO. That means cross-compilation headaches, platform-specific builds, and a runtime dependency on C libraries. For a project that wants to feel native to the Go ecosystem—easy to build, easy to deploy, easy to contribute to, CGO is a tax you pay on every decision downstream. Not to mention the performance penalty. Parsing is almost always on the hot-path of query execution (there are some workarounds like prepared statements), and having a slow parser can make a world of difference for point queries where you want to eke out every single micro-second.

All of these considerations pushed us towards choosing a pure Go parser. One that matched Postgres's grammar exactly, so we wouldn't be chasing compatibility bugs forever. One that was maintainable, well-tested, and fast.

This meant we were committing to porting the real Postgres grammar. The actual grammar rules, translated into Go's yacc equivalent. All AST node types. All the edge cases that make SQL parsing surprisingly hard.

This is the kind of project that sits on a roadmap for quarters. The kind you staff a small team for. But like I mentioned before, this wasn't my first rodeo. So we knew it was possible, but the timeline was still in question. I'd been using Claude for other work and had a hunch it could change the math on this project.

## The Directory That Ran the Project

Here's the thing about working with Claude: it has very little memory. Every conversation starts fresh. There's a memory feature, but it wasn't reliable enough. Crucial context would vanish at compaction. If you're doing something that spans multiple sessions, which any real project does, you need your own system.

My system was a directory.

I broke the project into multiple phases. Inside the directory, for each phase, I kept a master checklist of every task.  AST structs to port, grammar rules to implement, tests to add. Each task had a status. Each phase had sub-phases (1A, 1B, 1C...) with clear scope. I also kept session documents. At the end of each working session, I'd get Claude to write a summary: what we accomplished, what we tried that didn't work, what the next session should pick up. When I started a new session, Claude would read these files and have full context. You can actually check out the internals by looking at [the commit history](https://github.com/multigres/multigres/pull/109/changes/22f043315158a6ddd9dcd9857e8b7339f455c59c). I didn't always push all the internal files, but sometimes when using `git add .`, I would end up pushing it.

This sounds simple. It was also the entire job.

The actual typing, translating a grammar rule from C to Go, writing a test case, implementing an AST node, Claude could do that. Often faster than I could, and without getting tired. Of course it doesn't get it all right, but I am better off getting it to write 3000 lines of code and fixing 500 of those, instead of writing the 3000 from scratch myself.

Deciding what to work on next, recognizing when we'd gone down a wrong path, understanding why a shift-reduce conflict was happening and how to fix it, that was me. I wasn't pair programming. I was directing.

Think of it like managing a very fast, very eager junior engineer who forgets everything between meetings. You can give them well-scoped tasks and they'll execute. But you can't hand them a vague goal and expect coherent output. The clarity has to come from you. And you will need to look at the code and fix things at every step of the way.

## Knowing What Right Looks Like

Claude made mistakes. Constantly.

Sometimes it would implement a grammar rule that was subtly wrong, accepting inputs that Postgres would reject, or vice versa. Sometimes it would take an architectural shortcut that would cause problems three steps later. Sometimes it would confidently explain why its incorrect code was correct.

None of this was surprising. The surprising thing was how much it didn't matter. It didn't matter because I knew what right looked like. I've been working on parsers for years. I know how yacc grammars behave. I know what shift-reduce conflicts mean and how to debug them. When Claude's output was wrong, I could see it, usually quickly. At that point, if it's a small fix, I would just go ahead and fix it myself. If it was bigger, I'd start a new session and get Claude to fix it, telling it that _I_ made that mistake :stuck-out-tongue: (This works better than you'd think.)

If I didn't already know how to build a parser, Claude wouldn't have helped. I would have accepted wrong output, made bad structural decisions, and ended up with a mess that didn't work. AI doesn't replace expertise. It multiplies it.

## Trust, but Verify

Fast output means nothing if the output is wrong. A parser that mostly works is a parser that fails in production at 3am on queries you've never seen.

So I verified, and then re-verified.

There were parts with small enough scope that I could let Claude take over with less oversight. The lexer, for example, is mostly a massive switch statement on characters and states. But the grammar was different.

First: As we kept implementing the grammar, I would read every grammar rule. Not skim, read. I compared each one against the Postgres source to confirm it matched. This took time, and it was boring, but it was necessary. Grammar rules are precise. A missing optional clause or a wrong precedence and you're silently accepting invalid SQL.

Second: I ported Postgres's own regression tests. The Postgres source tree includes extensive SQL test files in `src/test/regress/sql/`. I wrote a script to extract the queries and run them through our parser. Thousands of queries, covering edge cases the Postgres team has accumulated over decades.

When tests failed, I investigated each one. Some failures were bugs in our parser, we fixed those. Some were tests that were supposed to fail, checking that invalid syntax was rejected. I confirmed each of those too.

The result: 71.2% code coverage, validation against the real Postgres test suite, and confidence that when we say "Postgres-compatible grammar," we mean it. Will we find bugs? Probably. But I wouldn't have fared any better writing it by hand. The test coverage would look the same.

## The new normal

Claude typed. I engineered.

I think this is what the future looks like for a lot of software work. Not AI replacing engineers, but engineers operating at a different level of abstraction. Less time typing, more time thinking. Less time on the mechanical translation of ideas to code, more time on the ideas themselves.

The MySQL parser took a year because the bottleneck was implementation. The Postgres parser took two months because the bottleneck moved. Now it's about how fast you can make good decisions, verify correctness, and course-correct when things go wrong.

For engineers: the leverage is real. But it requires systems (my coordination directory), discipline (reading every grammar rule), and genuine expertise (knowing when Claude is wrong). This isn't a shortcut. It's a different way of working.

For everyone else wondering if AI-assisted code is "real" work: it took a year last time. It took two months this time. The code looks the same. You tell me.
