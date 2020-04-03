A tool to manage large Git projects
===================================

WARNING: This project is still in progress.

It's often helpful to divide a large project into components,
with each component has its own Git repository.

The benefit this approach are:

* Help cutting clear lines between components. Components can be compiled and tested individually.
  This will foster stable public APIs and better modularization.
* Each component can have different collaborators and permissions.
  This is very important in corporates in which source code permission is enforced.

Initialization
--------------

.. code-block:: bash

   # download the main module
   $ git clone https://xxxxxx/main_project.git
   $ nigit init main_project

   # download/update dependent modules
   $ nigit pull
   === main_project ===
   pulling ...
   === module_A ===
   cloning ...
   === module_B ===
   cloning ...
   === module_C ===
   cloning ...

Branch or Tag
-------------

.. code-block:: bash

   # create branch/tag
   $ nigit branch branches/1.0.x
   === main_project ===
   branch created branches/1.0.x
   === module_A ===
   branch created branches/1.0.x
   === module_B ===
   branch created branches/1.0.x
   === module_C ===
   branch created branches/1.0.x

   # checkout to a branch/tag
   $ nigit checkout branches/1.0.x
   === main_project ===
   branch created branches/1.0.x
   === module_A ===
   branch created branches/1.0.x
   === module_B ===
   branch created branches/1.0.x
   === module_C ===
   branch created branches/1.0.x

