# The Library of Léon
> Open it [here](https://noel-friedrich.de/lol/)

## Table of contents
* [About](#about)
* [How to use](#how-to-use)
* [Code Structure](#code-structure)
* [Status](#status)

## About
Welcome to The Library of Leon. Its a three dimensional representation of endless rooms full of books. Each book is made up of seemingly random letters and has a specific length. Importantly, all the books are ordered. Each floor contains all possible books of a specific length. You will find all books that are one hundred letters long on floor one hundred. Thus, all books are in this library. Every book you ever read, every book you will ever read in the future. Every answer to every question anyone could ever have. Somewhere in there, there is the theory of the entire universe, the everything formula. Maybe, just maybe, you can find it.

## How to use
1. [Go to the website](https://noel-friedrich.de/lol/)
2. Roam around
3. Search Books
4. Enjoy the Endlessness and recognise that life itself is meaningless

## Code Structure

The code is a bit a of a mess. It's many JavaScript files that are merged into one `combined.js` file
which is then "minified" (using a bit of a dodgy script) into a `combined.min.js` file. It's all
then loaded as a module to be able to access THREE.js, with which the 3d aspect is built.

## Status
The project is currently in development.
