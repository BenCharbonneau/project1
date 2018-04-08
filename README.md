# Project1 - Monster Shooter 2

This is a monster shooting game. 1 to 2 players navigate around the map fighting waves of monsters. It can be accessed here: https://bencharbonneau.github.io/

## User Story

There will be one to two players.

They will work together to defeat waves.

They must navigate through the map (see wireframe) without getting touched by a monster.
The first player uses the arrow keys to move, shift to shoot and ? to change weapons.
The second player uses WASD to move, q to shoot, and e to change weapons.

They can shoot the monsters to defeat them.

Monsters will have an increasing amount of hit points each round and there will be more monsters each round.

The users must defeat all monsters to win a wave.

Players start with a pistol that does 1 damage but there are other weapons around the map that do different amounts of damage and some can shoot explosive bullets.

Players will win if they make it through round 10.

## Enhancement List

Add a background color/image
Add a round counter so players know what round they're on
Allow players to set the control keys
Add mines and explosive barrels
Add friendly fire
Add new maps
Update the graphics

## The Challenge

The most challenging feature of this game to implement was the monster movement. Monsters will continually chase the nearest player and will find the shortest distance around obstacles that come between them and the player.

## The Tech

This game runs using an HTML5 Canvas and JavaScript for the logic. The page layout and styling was done with HTML and CSS.