A tool to manage large Git projects
===================================

WARNING: This project is still in progress.

It's often helpful to divide a large project into subprojects,
with each subproject has its own Git repository.

The benefit this approach are:

* Help cutting clear lines between subprojects. Subprojects can be compiled and tested individually.
  This will foster stable public APIs and better modularization. 
* Each subproject can have different collaborators and permissions.
  This is very important in corporations in which source code permission is enforced.

Prerequisites
-------------

For it to work, the main project must contain a 'nigit.json' file.
This project itself contains such a file.

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

Each project can have an optional name field, in case you want to have a folder name which is different from the project itself.
For example, `ncgeo` in the above example.

Initialization
--------------

The `clone` command will clone/donwload the main project and then all subprojects.

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
   downloading https://www.zlib.net/zlib1211.zip
   extract zip file.

Verify:

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

Update
------

The `pull` command will make sure all subprojects are properly cloned/download and update-to-date.

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
   warning: Access denied.
   === subproject_C ===
   Updating 7456c90..9597110
   Fast-forward
   .travis.yml                              |  16 +
   CMakeLists.txt                           |  15 +
   README.rst                               |   3 +-
   nc-geo.vcxproj                           |   2 -
   nc-geo.vcxproj.filters                   |   6 -
   src/basic_types.h                        |   3 +-
   src/cq_hashmap.h                         | 662 -------------------------------
   src/cq_vector.h                          |   6 +-
   src/mutable_polygon.h                    |   4 +-
   src/polygon_merger.h                     |  12 +-
   src/polygon_tile_splitter.cpp            |  26 +-
   src/polyline_tile_splitter.cpp           |  33 +-
   src/polyline_tile_splitter.h             |  16 +-
   src/small_object_allocator.h             |   9 +-
   src/static_polygon.cpp                   |   8 +-
   test/cq_hashmap_unittest.cpp             |  53 ---
   test/polygon_merger_unittest.cpp         |  34 +-
   test/polyline_tile_splitter_unittest.cpp |   2 +-
   18 files changed, 113 insertions(+), 797 deletions(-)
   create mode 100644 .travis.yml
   create mode 100644 CMakeLists.txt
   delete mode 100644 src/cq_hashmap.h
   delete mode 100644 test/cq_hashmap_unittest.cpp

Branch or Tag
-------------

Create a feature branch
^^^^^^^^^^^^^^^^^^^^^^^

To implement a feature, sometimes several subprojects will be changed.
They should have the same git branch name.

.. warning:: Not implemented yet

.. code-block:: bash

   $ nigit branch feature_XXX subproject_A subproject_B

Show current branch
^^^^^^^^^^^^^^^^^^^

.. code-block:: bash

   $ nigit branch
   === main_project ===
   master
   === subproject_A ===
   master
   === subproject_B ===
   warning: Access denied.
   === subproject_C ===
   master

Switch to a feature branch
^^^^^^^^^^^^^^^^^^^^^^^^^^

Checkout to a branch. If no such branch exist for a subproject, fallback 
to a branch which is consistent with the master project.

.. code-block:: bash

   $ nigit checkout feature_xxx
   === main_project ===
   warning: Branch feature_xxx does not exist, stay on master.
   === subproject_A ===
   Checking out to branch feature_xxx.
   === subproject_B ===
   Checking out to branch feature_xxx.
   === subproject_C ===
   warning: Branch feature_xxx does not exist, fallback to master.

.. code-block:: bash

   $ nigit branch
   === main_project ===
   master
   === subproject_A ===
   feature_xxx
   === subproject_B ===
   feature_xxx
   === subproject_C ===
   master

Create a release branch
^^^^^^^^^^^^^^^^^^^^^^^

Only the ones who have access to all the subprojects can create a release branch.

.. code-block:: bash

   $ nigit branch branches/1.0.x
   === main_project ===
   create branches/1.0.x
   === subproject_A ===
   create branches/1.0.x
   === subproject_B ===
   create branches/1.0.x
   === subproject_C ===
   create branches/1.0.x
