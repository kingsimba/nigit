# A Tool for Managing a Group of Git Projects

## What is it?

It's often helpful to divide a large project into subprojects,
with each subproject has its own Git repository.

With **nigit**, you can manage the correlated projects as a whole,
by pulling them together, switching branch together, etc.

The benefits of this approach are:

- Help cutting clear lines between subprojects. Subprojects can be compiled and tested individually.
  This will foster stable public APIs and better modularization.
- Each subproject can have different collaborators and permissions.
  This is very important in corporations in which different people have different access permissions.

If you are familiar with 'git', you will find it easy to learn.

## Prerequisites

For it to work, the main project must contain a 'nigit.json' file.
It lists its subprojects.

```js
{
   "projects": [
      {
         "url": "git@github.com:NavInfoNC/json-script.git"
      },
      {
         "url": "git@github.com:kingsimba/express-typescript-mocha-vscode.git"
      },
      {
         "name": "ncgeo",
         "url": "git@github.com:NavInfoNC/nc-geo.git"
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
cloning git@github.com:NavInfoNC/json-script.git
=== express-typescript-mocha-vscode ===
cloning git@github.com:kingsimba/express-typescript-mocha-vscode.git
=== ncgeo ===
cloning git@github.com:NavInfoNC/nc-geo.git
```

After cloning, all the projects will be ready, side-by-side.

```bash
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
json-script => git@github.com:NavInfoNC/json-script.git
express-typescript-mocha-vscode => git@github.com:kingsimba/express-typescript-mocha-vscode.git
ncgeo => git@github.com:NavInfoNC/nc-geo.git
```

## Pull

The `pull` command will make sure all subprojects are properly cloned/download and up-to-date.

- If a project is missing, it will clone/download it.
- If a project is a git repository it will run `git pull --ff-only`.
- If a project is a zip file, it will check if it's update-to-date and download it if not.

```bash
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

## Status

The command `status` will show the current state of all projects. Similar with 'git status'.

```
$ nigit status
=== nigit ===
- some_new_file
* some_deleted_file
  M some_modified_file
  ? some_untracked_file
  === ncgeo ===
* other_deleted_file
  ? other_untracked_file
```

## Branch or Tag

### Show Branches

```
$ nigit branch
┌──────────────────────────────┬──────────────────────────────┐
│ Project                      │ Current Branch               │
│ nigit                        │ master                       │
│ json-script                  │ test_branch                  │
│ express-typescript-mocha-vs… │ master                       │
│ ncgeo                        │ master                       │
│ zlib                         │ (not git repo)               │
└──────────────────────────────┴──────────────────────────────┘
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
=== main_project ===
- master (Cannot find 'data-driver')
=== subproject_A ===
- data-driver
=== subproject_B ===
- data-driver
=== subproject_C ===
- master (Cannot find 'data-driver')
```

- 'main_project' has no such branch, so it will remain on **master**.
- 'subproject_A' and 'subproject_B' has **data-driver** branch, so they will switched.
- 'subproject_C' has no such branch, so it will follow 'main_project'.

--force
: Discard all local changes. Checkout to specified branch forcefully.

### Create Feature Branch

To implement a feature, sometimes several subprojects will be modified.
They should have the same branch name.

.. warning:: not implemented yet.

```
$ nigit branch feature_XXX subproject_A subproject_B
```

### Create Release Branch

> :warning: Not implemented yet. You can temporarily use:
>
> ```
> nigit forall 'git branch branches/1.0.x'
> ```

Only the ones who have access to all the subprojects can create a release branch.

```
$ nigit branch branches/1.0.x
=== main_project ===
- branches/1.0.x
=== subproject_A ===
- branches/1.0.x
=== subproject_B ===
- branches/1.0.x
=== subproject_C ===
- branches/1.0.x
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

1. Setup a CI system to continuously build all projects.

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

1. Modify the nigit.json to include the ZIP file

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

1. Modify project settings.

   - Use **awesome-libs/inlcude/** before **module-a/include** and **module-b/include**.
   - Link to **awesome-libs/lib/** before **module-a/lib/** and **module-b/lib/**.
