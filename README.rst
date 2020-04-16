A Tool for Managing a Group of Git Projects
===========================================

That is it?
-----------

It's often helpful to divide a large project into subprojects,
with each subproject has its own Git repository.

With **nigit**, you can manage the correlated projects as a whole, 
by pulling them together, switching branch together, etc.

The benefits of this approach are:

* Help cutting clear lines between subprojects. Subprojects can be compiled and tested individually.
  This will foster stable public APIs and better modularization. 
* Each subproject can have different collaborators and permissions.
  This is very important in corporations in which different people have different access permissions.

If you are familiar with 'git', you will find it easy to learn.

Prerequisites
-------------

For it to work, the main project must contain a 'nigit.json' file.
It lists its subprojects.

.. code-block:: js

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
         },
         {
               "name": "zlib",
               "url": "https://www.zlib.net/zlib1211.zip"
         }
      ]
   }

`name` is Optional. If not given, the name will be deduced frm the URL.

Initialization
--------------

The `clone` command will clone/download the main project and then all subprojects.

.. code-block:: bash

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
   === zlib ===
   Downloading https://www.zlib.net/zlib1211.zip
   Extracted zlib1211.zip

After cloning, all the projects will be ready, side-by-side.

.. code-block:: bash

   $ ls
   nigit/
   json-script/
   express-typescript-mocha-vscode/
   ncgeo/
   zlib/

List
----

The `list` command show the URLs of all projects.
The first project is the main project.

.. code-block:: bash

   $ nigit list
   nigit => git@github.com:kingsimba/nigit.git
   json-script => git@github.com:NavInfoNC/json-script.git
   express-typescript-mocha-vscode => git@github.com:kingsimba/express-typescript-mocha-vscode.git
   ncgeo => git@github.com:NavInfoNC/nc-geo.git
   zlib => https://www.zlib.net/zlib1211.zip

Pull
----

The `pull` command will make sure all subprojects are properly cloned/download and up-to-date.

*  If a project is missing, it will clone/download it.
*  If a project is a git repository it will run `git pull --ff-only`.
*  If a project is a zip file, it will check if it's update-to-date and download it if not.

.. code-block:: bash

   $nigit pull
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
    src/roadnet_layer/property_item_generators.cpp |  4 +-
    src/routing/vehicle_info_float_view.cpp        | 25 +++++------
    src/the_app.cpp                                | 62 ++++++++++++++++----------
    3 files changed, 53 insertions(+), 38 deletions(-)

As shown above, if you have no access to a project, it will be skipped.

Status
------

The command `status` will show the current state of all projects. Similar with 'git status'.

.. code-block:: bash

   $ nigit status
   === nigit ===
   + some_new_file
   - some_deleted_file
   M some_modified_file
   ? some_untracked_file
   === ncgeo ===
   - other_deleted_file
   ? other_untracked_file

Branch or Tag
-------------

Show Branches
^^^^^^^^^^^^^

.. code-block:: bash

   $ nigit branch
   === main_project ===
   * master
   === subproject_A ===
   * master
   === subproject_B ===
   * warning: Access denied.
   === subproject_C ===
   * master

You can also show all branches or feature branches with --all and --features

Create Feature Branch
^^^^^^^^^^^^^^^^^^^^^

To implement a feature, sometimes several subprojects will be modified.
They should have the same branch name.

.. warning:: not implemented yet.

.. code-block:: bash

   $ nigit branch feature_XXX subproject_A subproject_B

Switch Branch
^^^^^^^^^^^^^

Try to checkout all projects to the same branch.

If no such branch exist for a subproject, fallback 
to a branch which is the same as the main project.

.. code-block:: bash

   $ nigit checkout data-driver
   === main_project ===
   * master (Cannot find 'data-driver')
   === subproject_A ===
   * data-driver
   === subproject_B ===
   * data-driver
   === subproject_C ===
   * master (Cannot find 'data-driver')

* 'main_project' has no such branch, so it will remain on **master**.
* 'subproject_A' and 'subproject_B' has **data-driver** branch, so they will switched.
* 'subproject_C' has no such branch, so it will follow 'main_project'.

Create a Release Branch
^^^^^^^^^^^^^^^^^^^^^^^

Only the ones who have access to all the subprojects can create a release branch.

.. warning:: not implemented yet.

.. code-block:: bash

   $ nigit branch branches/1.0.x
   === main_project ===
   + branches/1.0.x
   === subproject_A ===
   + branches/1.0.x
   === subproject_B ===
   + branches/1.0.x
   === subproject_C ===
   + branches/1.0.x
