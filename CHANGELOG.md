# Changelog

## Unreleased

- 2026-08-16 nigit: Add tab completion via the 'completion' command

## 1.8.5

- 2026-08-16 nigit: Support pushing a tag with 'nigit push <tag>'
- 2026-08-16 nigit: Fix 'checkout-info' parsing of commit messages containing brackets
- 2026-08-16 nigit: Switch package manager to pnpm

## 1.8.3

- 2022-06-29 Add `-t --tags, -f --force` to `nigit fetch`. For example, use `nigit fetch -t -f` to update all local tags.

## 1.8.2

- 2022-06-17 Allow any tag name. Remove format validation.

## 1.8.1

- 2022-05-09 Remove branch name in `dump-info` command.

## 1.8.0

- 2022-02-23 Add 'nigit push' command.
- 2022-02-23 Fix 'nigit start'. It should not use '-t' in 'git checkout -b XXX -t'. Upstream should be set with 'git push -u', later when 'nigit push'.
- 2022-02-23 Fix output of 'nigit start'. It should print 'Switched to a new branch xxx'

## 1.7.2

- 2021-09-14 Fix 'nigit checkout origin/xxxx'.
- 2021-09-14 Fix 'nigit fetch --prune' when the current branch is origin/xxx.

## 1.7.0

- 2021-09-13 Add 'nigit dump-info'.
- 2021-09-13 Improve output of 'nigit checkout-info'.

## 1.6.0

- 2021-09-02 Add 'nigit fetch --prune'.

## 1.5.11

- 2021-02-04 Fixed nigit pull. It should not skip the main project.

## 1.5.10

- 2021-01-06 Support --skip-main for 'pull' command.

## 1.5.8

- 2020-12-28 Use at most 5 concurrent tasks for 'nigit pull'. Because some servers may reject SSH connections with "error: kex_exchange_identification: Connection closed by remote host"

## 1.5.2

- 2020-07-21 Bug fix: Make it work under Linux.

## 1.5.0

- 2020-07-21 Add 'clean' command.

## 1.4.0

- 2020-07-17 Add 'tag' command.

## 1.3.2

- 2020-07-14 Fixed bug #2: Field "name" doesn't work properly for .zip project

## 1.3.0

- 2020-07-01 Support "nigit start" to create branches.

## 1.1.0

- 2020-06-18 Make the output of 'branch' and 'checkout' command more readable.

## 1.0.1

- 2020-04-23 Support '--force' in 'nigit checkout'. It will discard local changes.
