# Introduction
Interactive and dynamic painting simulation in WebGL.

Live version [here](https://piellardj.github.io/paint-webgl).

This is a WebGL port of the visualization part of my OpenGL project [flow-gpu](https://github.com/piellardj/flow-gpu).

[![Donate](https://raw.githubusercontent.com/piellardj/piellardj.github.io/master/images/readme/donate-paypal.svg)](https://www.paypal.com/donate/?hosted_button_id=AF7H7GEJTL95E)

# Description

The painting is actually the superposition of several layers.
Each layer is made of a set of particles, a flow map, and a background image.

## Background
The background image is fixed and has 2 purposes:
* to give a color to particles;
* to generate the particles' initial position: the alpha channel of the background image serves as a density map that is used to randomly generate the positions

## Flow map
The flowmap is a 2D vector field. It can be altered with the mouse, and has 2 purposes:
* make the particles move;
* give them an orientation

## Particles
The particles are "paint strokes" and are drawn as oriented, colored rectangles.
A particle has:
* a fixed initial position;
* a position, that changes following the underlying flow map;
* a solid color that is sampled from the background at the particles' initial position;
* a lifetime, after which the particle is returned to its initial position

A particles' state is stored in data textures, each pixel corresponding to a particle.
The states are stored in 4 RGBA textures:
* initial position texture: RG=x, BA=y. Each position component is stored as a 16bits integer.
* position texture: RG=x, BA=y
* birthdate texture: RG=t. Used to know when a particle has reached its lifetime and needs to be returned to its starting point.
* "looks" texture: RGB=color, A=orientation

The WebGL extension `ANGLE_instance_arrays` is used to draw the particles.
The position, birthdate and looks textures are updated in 3 separate passes, since by default WebGL doesn't support multiple render targets (MRT).
There is an extension that allows MRT (`WEBGL_draw_buffers`), however this extension isn't widely supported yet (especially in mobile devices) so I chose not to use it.
