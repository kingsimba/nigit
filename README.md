[![Actions Status](https://github.com/kingsimba/nigit/workflows/CI/badge.svg)](https://github.com/kingsimba/nigit/actions)

# A Tool for Managing a Group of Git Projects <!-- omit in toc -->

- [What is it?](#what-is-it)
- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Initialization](#initialization)
- [List](#list)
- [Pull](#pull)
- [Push](#push)
- [Status](#status)
- [Clean](#clean)
- [Branch or Tag](#branch-or-tag)
  - [Show Branches](#show-branches)
  - [Switch Branch](#switch-branch)
  - [Create Feature Branch](#create-feature-branch)
  - [Create Release Branch](#create-release-branch)
  - [Create / List Tags](#create--list-tags)
  - [Take Snapshot and Restore](#take-snapshot-and-restore)
- [Using Precompiled Binaries](#using-precompiled-binaries)
- [Contribute](#contribute)
  - [Compile](#compile)
  - [Code & Debug](#code--debug)
- [Changelog](#changelog)

## What is it?

It's often helpful to divide a large project into subprojects,
with each subproject has its own Git repository.

With **nigit**, you can manage the correlated projects as a whole,
by syncing them together, switching branch together, etc.

The benefits of this approach are:

-   Help cutting clear lines between subprojects. Subprojects can be compiled and tested individually.
    This will foster stable public APIs and better modularization.
-   Each subproject can have different collaborators and permissions.
    This is very important in corporations in which different people have different access permissions.

If you are familiar with 'git', you will find it easy to learn.

There is a similar tool https://gerrit.googlesource.com/git-repo made by Google for Android system development.

## Installation

Please use npm package manager to install it:

```bash
npm install nigit -g
```

## Prerequisites

For it to work, the main project must contain a 'nigit.json' file.
It lists its subprojects.

```js
{
   "projects": [
      {
         "url": "git@github.com:kingsimba/json-script.git"
      },
      {
         "url": "git@github.com:kingsimba/express-typescript-mocha-vscode.git"
      },
      {
         "name": "ncgeo",
         "url": "git@github.com:kingsimba/nc-geo.git"
      }
   ]
}
```

`name` is Optional. If not given, the name will be deduced frm the URL.

## Initialization

The `clone` command will clone/download the main project and then all subprojects.

```bash
$ nigit clone git@github.com:kingsimba/nigit.git
=== nigit ===
Cloning into 'nigit'...
remote: Enumerating objects: 99, done.
remote: Counting objects: 100% (99/99), done.
remote: Compressing objects: 100% (64/64), done.
remote: Total 99 (delta 51), reused 76 (delta 31), pack-reused 0
Receiving objects: 100% (99/99), 28.98 KiB | 39.00 KiB/s, done.
Resolving deltas: 100% (51/51), done.
=== json-script ===
cloning git@github.com:kingsimba/json-script.git
=== express-typescript-mocha-vscode ===
cloning git@github.com:kingsimba/express-typescript-mocha-vscode.git
=== ncgeo ===
cloning git@github.com:kingsimba/nc-geo.git
```

After cloning, all the projects will be ready, side-by-side.

```
$ ls
nigit/
json-script/
express-typescript-mocha-vscode/
ncgeo/
```

## List

The `list` command show the URLs of all projects.
The first project is the main project.

```bash
$ nigit list
nigit => git@github.com:kingsimba/nigit.git
json-script => git@github.com:kingsimba/json-script.git
express-typescript-mocha-vscode => git@github.com:kingsimba/express-typescript-mocha-vscode.git
ncgeo => git@github.com:kingsimba/nc-geo.git
```

## Pull

The `pull` command will make sure all subprojects are properly cloned/download and up-to-date.

-   If a project is missing, it will clone/download it.
-   If a project is a git repository it will run `git pull --ff-only`.
-   If a project is a zip file, it will check if it's update-to-date and download it if not.

```
$ nigit pull
=== main_project ===
Already up to date.
=== subproject_A ===
Already up to date.
=== subproject_B ===
error: Failed to clone git@xxxx:xxx/subproject_B.git.
Please make sure you have the correct access rights.
and the repository exists.
=== subproject_C ===
Updating 1fe91ee..5a7820f
Fast-forward
src/roadnet_layer/property_item_generators.cpp | 4 +-
src/routing/vehicle_info_float_view.cpp | 25 +++++------
src/the_app.cpp | 62 ++++++++++++++++----------
3 files changed, 53 insertions(+), 38 deletions(-)
```

As shown above, if you have no access to a project, it will be skipped.

## Push

The `push` command will push current branch to remote, and set up upstream.

```
$ nigit push
=== main_project ===
Branch 'master' set up to track remote branch 'master' from 'origin'.
=== subproject_A ===
Branch 'master' set up to track remote branch 'master' from 'origin'.
=== subproject_B ===
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

## Status

The command `status` will show the current state of all projects. Similar with 'git status'.

```
$ nigit status
Project                          Changes
----------------------------------------
nigit                            + nigit-1.0.5.tgz
                                 M README.md
                                 M src/nigitlib/git_checkout.ts
                                 M src/nigitlib/git_status.ts
                                 ? nigit-1.1.0.tgz
express-typescript-mocha-vscode  M package-lock.json
                                 M package.json
                                 M src/users.spec.ts
```

## Clean

Remove untracked files.

This is very dangerous. Please use '--dry' to preview the results first.
And use '--force' to actually remove them.

```
$ nigit clean --dry
Project                          Message
----------------------------------------
nigit                            Would remove a.cpp
```

## Branch or Tag

### Show Branches

```
$ nigit branch
Project                          Current Branch
-----------------------------------------------
nigit                            master
json-script                      test_branch
express-typescript-mocha-vscode  master
ncgeo                            master
zlib                             (not git repo)
```

--all
: Show all branches.

--features
: Show all feature branches(not 'master' or 'branches/xxx').

### Switch Branch

Try to checkout all projects to the same branch.

If no such branch exist for a subproject, fallback
to a branch which is the same as the main project.

```
$ nigit checkout data-driver
Project        Branch
---------------------
main_project   master (Cannot find 'data-driver')
subproject_A   data-driver
subproject_B   data-driver
subproject_C   master (Cannot find 'data-driver')
```

-   'main_project' has no such branch, so it will remain on **master**.
-   'subproject_A' and 'subproject_B' has **data-driver** branch, so they will switched.
-   'subproject_C' has no such branch, so it will follow 'main_project'.

--force
: Discard all local changes. Checkout to specified branch forcefully.

### Create Feature Branch

To implement a feature, sometimes several subprojects will be modified.
They should have the same branch name.

```
$ nigit start another_branch nigit ncgeo
=== nigit ===
Switched to a new branch 'another_branch'
=== ncgeo ===
Switched to a new branch 'another_branch'
```

### Create Release Branch

Only the ones who have access to all the subprojects can create a release branch.

```
$ nigit start branches/1.0.x
=== nigit ===
Switched to a new branch 'branches/1.0.x'
=== json-script ===
Switched to a new branch 'branches/1.0.x'
=== express-typescript-mocha-vscode ===
Switched to a new branch 'branches/1.0.x'
=== ncgeo ===
Switched to a new branch 'branches/1.0.x'
=== zlib ===
Not a git repository. skipped.
```

### Create / List Tags

Create a tag for all projects

```
$ nigit tag -c v1.0.8
Project                          Message
----------------------------------------
nigit                            'v1.0.8' created
json-script                      'v1.0.8' created
express-typescript-mocha-vscode  'v1.0.8' created
ncgeo                            'v1.0.8' created
zlib                             (Not a git repository)
```

List all tags of the main project. The pattern is optional.

```
$nigit tag -l "v1.0*"
v1.0.1
v1.0.2
v1.0.3
```

### Take Snapshot and Restore

Save hash code of all projects into a `.gitinfo` file.

```
$ nigit dump-info
nigit [(HEAD detached at a62d25c)|a62d25c] must be clean befor dump-info or checkout-info
json-script [(HEAD detached at 59046b9)|59046b9] Update syntax-highlight-in-sphinx.rst
express-typescript-mocha-vscode [(HEAD detached at 279163b)|279163b] Merge pull request #8 from kingsimba/dependabot/npm_and_yarn/lodash-4.17.21
ncgeo [(HEAD detached at 9597110)|9597110] Merge pull request #4 from ZhujinLi/issue#3

$ nigit dump-info snapshot.gitinfo
```

Restore projects with a `.gitinfo` file.

```
$ nigit checkout-info snapshot.gitinfo
checking out project with info file: a.gitinfo
Project                         Hash
------------------------------------
nigit                           a62d25c must be clean befor dump-info or checkout-info
json-script                     59046b9 Update syntax-highlight-in-sphinx.rst
express-typescript-mocha-vscode 279163b Merge pull request #8 from kingsimba/dependabot/npm_and_yarn/lodash-4.17.21
ncgeo                           9597110 Merge pull request #4 from ZhujinLi/issue#3
```

## Using Precompiled Binaries

If someone has no permission to some subprojects.
They won't be able to build the project as a whole.

But they can use the pre-compiled binaries. Here is how to set it up.

1. Let's assume we have a project with the following structure:

```

      ├── awesome-project
      │   └── nigit.json
      ├── module-a
      │   ├── include
      │   │   └── module-a
      │   │       └── module-a.h
      │   └── src
      │       └── some-src.cpp
      └── module-b
          ├── include
          │   └── module-b
          │       └── module-b.h
          └── src
              └── some-src.cpp

```

2. Setup a CI system to continuously build all projects.

The compiled binaries/libraries must be put in a ZIP file.
The zip file must contain a single folder which has the same name as the the file itself.
For example, **awesome-libs.zip** should have a single root folder 'awesome-libs/'.

The content of `awesome-libs.zip` is:

```

      └── awesome-libs
          ├── include
          │   ├── module-a
          │   │   └── module-a.h     // collected header files
          │   └── module-b
          │       └── module-b.h      // collected header files
          └── lib
              ├── module-a.lib         // pre-compiled libraries
              └── module-b.lib         // pre-compiled libraries

```

3. Modify the nigit.json to include the ZIP file

```js
{
   "projects": [
      {
         "url": "git@github.com:someone/module-a.git"
      },
      {
         "url": "git@github.com:someone/module-b.git"
      },
      {
         "url": "https://my-ci-system.com/awesome-libs.zip"
      }
   ]
}
```

If someone don't have access to `module-b`, after running 'nigit pull', he will have a working tree like:

```
   ├── awesome-project
   │   └── nigit.json
   ├── module-a
   │   ├── include
   │   │   └── module-a
   │   │       └── module-a.h
   │   └── src
   │       └── some-src.cpp
   └── awesome-libs
       ├── include
       │   ├── module-a
       │   │   └── module-a.h
       │   └── module-b
       │       └── module-b.h
       └── lib
           ├── module-a.lib
           └── module-b.lib
```

4. Modify project settings.

    - Use **awesome-libs/include/** before **module-a/include** and **module-b/include**.
    - Link to **awesome-libs/lib/** before **module-a/lib/** and **module-b/lib/**.

## Contribute

### Compile

Make sure gulp is installed:

```
npm install --global gulp-cli
```

Build & Try:

```
gulp     # Build
npm link # Apply build result. It should overwrite other versions.
nigit --help # Try out newly built version.
```

### Code & Debug

1. Open with VSCode
2. Install "Mocha Test Explorer plugin"
3. Use test explorer to run all tests. Must call "nigit pull" to download sample projects to pass all tests.
4. Edit code. Press F7 to compile TS to JS. Run tests again.

## Changelog

-   1.8.1 @2022-06-17

    -   Allow any tag name. Remove format validation.

-   1.8.0 @2022-02-23

    -   Add 'nigit push' command.
    -   Fix 'nigit start'. It should not use '-t' in 'git checkout -b XXX -t'.
        Upstream should be set with 'git push -u', later when 'nigit push'.
    -   Fix output of 'nigit start'. It should print 'Switched to a new branch xxx'

-   1.7.2 @2021-09-14

    -   Fix 'nigit checkout origin/xxxx'.
    -   Fix 'nigit fetch --prune' when the current branch is origin/xxx.

-   1.7.0 @2021-09-13

    -   Add 'nigit dump-info'.
    -   Improve output of 'nigit checkout-info'.

-   1.6.0 @2021-09-02

    -   Add 'nigit fetch --prune'.

-   1.5.11 @2021-02-04

    Fixed nigit pull. It should not skip the main project.

-   1.5.10 @2021-01-06

    Support --skip-main for 'pull' command.

-   1.5.8 @2020-12-28

    -   Use at most 5 concurrent tasks for 'nigit pull'. Because some servers may
        reject SSH connections with "error: kex_exchange_identification: Connection closed by remote host"

-   1.5.2 @2020-07-21

    -   Bug fix: Make it work under Linux.

-   1.5.0 @2020-07-21

    -   Add 'clean' command.

-   1.4.0 @2020-07-17

    -   Add 'tag' command.

-   1.3.2 @2020-07-14

    -   Fixed bug #2: Field "name" doesn't work properly for .zip project

-   1.3.0 @2020-07-01

    -   Support "nigit start" to create branches.

-   1.1.0 @2020-06-18

    -   Make the output of 'branch' and 'checkout' command more readable.

-   1.0.1 @2020-04-23

    -   Support '--force' in 'nigit checkout'. It will discard local changes.
