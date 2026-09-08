---
title: "Testing the Connection Pooling in Multigres: What does 100% pass rate mean?"
description: "How we test connection pooling in Multigres, and what a 100% pass rate actually tells you about correctness."
date: "2026-09-08"
author: "manan"
tags: [postgres, multigres, connection-pooling, testing]
---

When we started working on Multigres, specifically the query serving side of things, we had a goal in mind. We wanted Multigres to feel like Postgres. It is real Postgres underneath; the pooling and scaling should be something you never have to think about when you write a query.

We started pondering how do we substantiate this claim, what should our north star be that lets us assess where we stand on our road to achieve this goal. The answer became quickly apparent to us, when we saw postgres's own testing suite and that of its extensions. We decided to run the same tests, `pg_regress`, `pg_isolation`, `contrib`, and `external` extensions as-is against Multigres and see how it fares.

We are pleased to inform you that we've hit 100% passes on these tests, but there is a caveat. 100% pass rate doesn't mean everything works against Multigres identically to Postgres, it means that we have accepted certain divergences in behaviour that fall out of our necessity for connection pooling, safety and currently unsupported features, and have documented those divergences as patches.

The rest of the blog post is going to deep dive into all of these tests that we run, what changes we made to the test setup, and what features differ in Multigres vs Postgres and why.

## Why a proxy can't be byte-identical

There are 3 major reasons why Multigres can't be byte-identical to Postgres, and they follow from the shape of the problem Multigres is built to solve:

1. Connection Pooling - Multigres does connection pooling, and that entails keeping the client session to Multigateway separate from Postgres backends. So the Postgres connection state that we hold for better reuse sometimes leaks into the client queries. For example, when you run a prepared statement in Multigres, we create it on the underlying Postgres connection but don't clean it up immediately in case it gets reused again. So, if you then create a new connection to Multigres and read the `pg_prepared_statements` table, you expect seeing no rows, but you will see the prepared statement residual that was left by another client connection.
2. Query Rewriting - Multigateway parses all the queries it receives and normalizes them so that the same plan for queries that differ just in their constants, or casing of keywords can still be reused. So if you run `SELECT 1` and `Select 3`, they both get normalized to `select $1` in Multigateway and consequently share the same plan. This also means that when the actual query runs on Postgres it runs as `select 1` and `select 3` respectively. This rewrite normalizes whitespaces as well, and can then therefore lead to different position of errors. Instead of getting `syntax error at position 5` you might get `syntax error at position 4`. We try to match the postgres error messages and the sql states as much as possible, but the location is not always possible to match.
3. Unsafe Statements - There are certain statements that are unsafe to run through the connection pooler, and there are others that Multigres just doesn't support at this point in time. It includes database provisioning, filesystem access, and session state hidden inside procedural bodies it cannot infer and that risk connection pool pollution.

## Testing Suites

Here are the list of tests that we run against Multigres -

1. `pg_regress` - Regression tests from Postgres core, documenting expected behaviour of all features.
2. `pg_isolation` - Isolation tests from Postgres.
3. `Contrib` - Regression suites that core Postgres extensions ship in their own `contrib/<module>/{sql,expected}/` directories
4. `External` - `pg_regress` or `pgTAP` suites of extensions that live **outside** the PostgreSQL source tree.

We run all of these test scripts against Multigres, occasionally making changes to the test harness itself during installation phase.

| Suite          | Score   |
| -------------- | ------- |
| **Regression** | 222/222 |
| **Isolation**  | 117/117 |
| **Contrib**    | 103/103 |
| **External**   | 539/539 |

## What "Pass" really means

The way these tests are structured, they have a sql file that the harness runs, and the output of the statements run are recorded into an `.out` file.

These tests then fall into 3 categories, "Pass", "Pass with patch" and "Fail". A test that works identically in Multigres and Postgres, producing identical `.out` files falls in the first category. The tests that differ, but whose difference in output is structural to connection pooling in Multigres and which we as developers accept as a divergence, are documented as Patch files to the expected output of postgres. For these tests, we keep a `.patch` file that we apply to postgres's produced `.out` file and then compare it to Multigres. Looking at the `.patch` file you can tell exactly what Multigres does differently to Postgres.

As an example, if you look at [`brin.patch`](https://github.com/multigres/multigres/blob/main/go/test/endtoend/pgregresstest/testdata/pg17/patches/brin.patch), you'll see that Multigres produces an extra warning that Postgres doesn't when a user creates an unlogged table. The comment on top of the patch file also documents the patch we carry -

```
# Known divergence (by design): CREATE UNLOGGED TABLE emits an extra WARNING +
# HINT because unlogged data is not replicated and is lost on failover. Planner
# differences in this test are intentionally left unpatched.
--- a
+++ b
@@ -569,6 +569,8 @@
 RESET enable_seqscan;
 -- test an unlogged table, mostly to get coverage of brinbuildempty
 CREATE UNLOGGED TABLE brintest_unlogged (n numrange);
+WARNING: unlogged table data is not replicated and is lost on failover
+HINT: On failover the table is dropped, or left empty if other objects depend on it; rebuild it from scratch. See docs/query_serving/unlogged_tables.md.
 CREATE INDEX brinidx_unlogged ON brintest_unlogged USING brin (n);
 INSERT INTO brintest_unlogged VALUES (numrange(0, 2^1000::numeric));
 DROP TABLE brintest_unlogged;
```

A patch file is deliberately limited in what it's allowed to contain. It can record differences in errors, added warnings, and statements we reject, and a difference in `pg_prepared_statements` query results that reflect the pooled backend. What it can never do is make a genuinely wrong answer look right: a query that should return the same rows returning completely different ones. That won't be a divergence that we accept, but a bug we fix.

A patch file therefore serves as honest accounting of what Multigres supports and doesn't. It encompasses cosmetic changes like reworded errors and unlogged table warnings, errors produced by features that Multigres doesn't support like `CREATE DATABASE` calls, and divergences that are attributed to pooling like different `pg_prepared_statements` query outputs.

## Where does Multigres differ from Postgres

Now that you understand our testing strategy, let's go ahead and look at the differences between Multigres and Postgres. The differences in Multigres and Postgres fall into 3 categories -

### Cosmetic Differences

The divergences that occur because of query rewriting, etc, but don't change the semantics of the queries or the returned result set.

#### Known divergence 1: Error source/cursor locations differ after Multigateway query rewriting.

We normalize queries at the Multigateway to ensure that query plans are reused across queries with the same structure, even if they have differences in casing. Because of this normalization, the query that we run on Postgres sometimes differs slightly from the original query sent to us. This causes the error messages to be slightly different from Postgres.

```
@@ -1914,7 +1914,7 @@
 select aggfns(distinct a,a,c order by a,b)
 from (values (1,1,'foo')) v(a,b,c), generate_series(1,2) i;
 ERROR: in an aggregate with DISTINCT, ORDER BY expressions must appear in argument list
-LINE 1: select aggfns(distinct a,a,c order by a,b)
+LINE 2: from (values (1,1,'foo')) v(a,b,c), generate_series(1,2) i...
```

#### Known divergence 2: CREATE UNLOGGED TABLE emits an extra WARNING + HINT

Since Multigres is an HA solution, if the primary instance crashes we failover to a replica after promoting it to accept writes. This has an unintended consequence of dropping unlogged tables that were created on the previous primary. This behaviour is something the users should be aware of when they decide to use unlogged tables, so we send an extra warning and hint to inform them.

```
 CREATE UNLOGGED TABLE brintest_unlogged (n numrange);
+WARNING: unlogged table data is not replicated and is lost on failover
+HINT: On failover the table is dropped, or left empty if other objects depend on it; rebuild it from scratch. See docs/query_serving/unlogged_tables.md.
```

### Blocked by design

Divergences that occur due to a conscious decision in Multigres to not support some of the following features -

#### Known divergence 3: Foreign-data wrapper/server/table operations are blocked through the connection pooler

A foreign data wrapper or foreign server exists to open a connection out of the database, to either another postgres instance or an external service. This is not something Multigres supports at this point.

```
 CREATE FOREIGN DATA WRAPPER alt_fdw1;
+ERROR: CREATE FOREIGN DATA WRAPPER is not supported through the connection pooler
```

#### Known divergence 4: Creating Languages is blocked by the connection pooler

Multigres does not support creating new languages at this point.

```
 CREATE LANGUAGE alt_lang1 HANDLER plpgsql_call_handler;
+ERROR: CREATE LANGUAGE is not supported: installing procedural languages is not permitted through the connection pooler
```

#### Known divergence 5: Multigateway rejects LOAD that is loading a shared library.

`LOAD` pulls a shared library into the backend process. This is not something Multigres supports at this point.

```
 LOAD :'regresslib';
+ERROR: LOAD is not supported: loading shared libraries is not permitted through the connection pooler
```

#### Known divergence 6: Multigres rejects CREATE DATABASE through the connection pooler because database lifecycle is an administrative operation.

In the Multigres model, each postgres instance belongs to a single tablegroup of a database, and consequently only stores information in the `postgres` database. We plan to handle `CREATE DATABASE` as a separate administrative operation that would entail provisioning more instances, instead of creating a database on an existing postgres instance. Hence, we reject it today.

```
 CREATE DATABASE regress_nosuch_db;
-ERROR: permission denied to create database
+ERROR: CREATE DATABASE is not supported through the connection pooler
```

#### Known divergence 7: Creation or execution of PL/pgSQL statements that contain a dynamically created EXECUTE call that can't be verified for safety through the connection pooler that might cause connection pool pollution

When a PL/pgSQL body builds a statement and runs part of it via `EXECUTE`, Multigateway can't always verify if running the prepared statement is going to be safe at creation time, if some of its arguments are supplied at runtime. This opens us to SQL injection issues that could pollute the underlying connection pool. We also don't support statements running `SET` statements or `set_config` functions, because they too bypass the Multigateway session tracking and end up causing connection pool pollution.

This creates a problem in several regression tests though, since they define their own helper functions that use the patterns that we reject. An example is an `EXPLAIN` wrapper that essentially pipes the statement through to an `EXPLAIN` command. Of course it has a connection pollution risk, but the test only uses it in a safe way. So for these benign helpers, we decided to get the harness to pre-create them through the gateway on an unsafe-connection (`SET multigres.unsafe_connection = on`, this bypasses all Multigateway safety checks), before the test runs. The test's own `CREATE FUNCTION` still fails, but the rest of the test still works.

```
 RETURN v_relfilenode <> (SELECT relfilenode FROM pg_class WHERE oid = p_tablename);
 END;
 $$;
+ERROR: EXECUTE of a runtime-built statement inside a PL/pgSQL body is not supported: the statement text is not a constant, so it cannot be checked for unsafe session-state changes
```

### Divergences due to connection pooling and Multigres architecture

#### Known divergence 8: database name mismatch in result set

In the Multigres world, each postgres instance always contains a single postgres database and runs all user queries in this database. There are tests in `pg_regress` that assert that the database name is `regression` instead of the default `postgres`.

```
 ORDER BY domain_name;
 domain_catalog | domain_schema | domain_name | table_catalog | table_schema | table_name | column_name
 ----------------+---------------+-------------+---------------+--------------+------------+-------------
-regression | public | con | regression | public | domcontest | col1
-regression | public | dom | regression | public | domview | col1
-regression | public | things | regression | public | thethings | stuff
+postgres | public | con | postgres | public | domcontest | col1
+postgres | public | dom | postgres | public | domview | col1
+postgres | public | things | postgres | public | thethings | stuff
 (3 rows)
```

#### Known divergence 9: login event triggers don't fire on user connections to Multigres

PostgreSQL login event triggers fire when a new connection is created. Under connection pooling that is controlled separately from user client connections. So when users connect to Multigateway, the login event triggers don't necessarily fire.

```
 ALTER EVENT TRIGGER on_login_trigger ENABLE ALWAYS;
 \c
-NOTICE: You are welcome!
 SELECT COUNT(*) FROM user_logins;
 count
 -------
-1
+0
 (1 row)
```

#### Known divergence 10: vPID vs PID difference

Because the clients connect to the Multigateway and not directly to postgres, the PID they receive on connection is the virtual PID that the gateway assigns. It doesn't match the underlying postgres connection on which their query runs. Since the connections are pooled, the same connection from the client might be running on different underlying postgres connections for its different queries. The virtual PID assigned to them, however, is unique and stays stable across the duration of their connection. This also allows us to implement features like query cancellation since they use the virtual PID.

There is, however, one place where the physical PID from the postgres connections leaks through. That is in the `NOTIFY` message. That value comes straight from whichever postgres connection ran the `NOTIFY` statement. So when a connection with vPID of 10021 runs a `NOTIFY` statement, it might run on an underlying postgres connection with pid of 32, and that is what the `NOTIFY` message that other connections receive would contain.

```
 step notify1: NOTIFY c1;
-notifier: NOTIFY "c1" with payload "" from notifier
+notifier: NOTIFY "c1" with payload "" from PostgreSQL backend PID
```

#### Known divergence 11: Querying `pg_prepared_statements` leaks the pooled backend information

Whenever a user creates a prepared statement, it passes through the prepared statement consolidator in Multigres, and it gets renamed before it is created and used on the underlying postgres connection. Even after its use, the prepared statement is not immediately cleaned up.

So as a user when you create a prepared statement let's say `q3`, it gets renamed internally to `ppstmt1`, and `q3` is stored only on the client connection metadata on the gateway to map `q3` to `ppstmt1`.

There are 2 consequences of this pooling and rewriting when you query the underlying `pg_prepared_statements`. One, which statements are visible is dependent on which connection to Postgres your query runs on, and what statements have been prepared on it already. Even then, the names visible are the internal prepared statement names and not the ones assigned by the user.

The harness normalizes these specific internal values before comparing so that our checks and patches are deterministic.

```
-ERROR: wrong number of parameters for prepared statement "q3"
+ERROR: wrong number of parameters for prepared statement "ppstmt<ID>"
```

## Summary

In this post we looked at how Multigres reached 100% test pass rate against `pg_regress`, `pg_isolation`, `contrib` and `extension` test suites, and what that 100% means. It doesn't mean Multigres is byte-identical to Postgres, and it doesn't mean all the features of Postgres work through Multigres. There are some that we block by design. What it does mean is that we have documented exactly where Multigres differs from Postgres and we check explicitly that only those divergences exist. And that we have also ensured that there are no cases where the behaviour is undefined. Each case is either supported or gracefully rejected. If you want to know more about how we support the features we do support, please read the blog series starting at [Two jobs, two processes](/blog/two-jobs-two-processes)

If you want the more exhaustive version of known divergences and harness accommodations we've allowed, please read the full write up at [testing_strategy.md](https://github.com/multigres/multigres/blob/main/docs/query_serving/testing_strategy.md) and see the patch files we carry in the repo. In case you find any bugs or undefined behaviour, please report them on [GitHub](https://github.com/multigres/multigres).
