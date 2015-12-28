[![Build Status](https://travis-ci.org/happner/happner.svg?branch=master)](https://travis-ci.org/happner/happner)

<img src="https://raw.githubusercontent.com/happner/happner-website/master/images/HAPPNER%20Logo.png" width="300"></img>

Happner is a cloud application framework ideal for integrating multiple micro services into a unified offering. It enables the creation of an interconnected mesh of components capable of interacting both locally and remotely. The mesh components can easily call upon each other's methods or listen to each other's events in a manner uncomplicated by remoteness.

Happner also provides a set of built in components to facilitate building a user interface. This includes the an api client enabling browsers to connect natively to the mesh.

## installation

__To use in your project:__

`npm install happner --save`

__To hack at the console of your 'home' mesh node:__

```
sudo npm install happner --global
happner
[ INFO] - 0ms   home (Mesh) happner v0.0.29
[ INFO] - 4ms   home (Mesh) config v0.0.1
[ INFO] - 2ms   home (Mesh) localnode 'home' at pid 16623
[ INFO] - 3ms   home (DataLayer) persisting /Users/.../.happn/data/home.nedb
...
[ INFO] - 1ms   home (Mesh) started!

► play...

```

## demonstration

* [Quick Start](https://github.com/happner/happner/blob/master/docs/quickstart.md)

## documentation

* [Configuation](https://github.com/happner/happner/blob/master/docs/configuration.md)
* [DataLayer](https://github.com/happner/happner/blob/master/docs/datalayer.md)
* [Modules and Components](https://github.com/happner/happner/blob/master/docs/modules.md)
* [Autoloading and Defaulting](https://github.com/happner/happner/blob/master/docs/autoload.md)

* [Event Api](https://github.com/happner/happner/blob/master/docs/event.md)
* [Exchange Api](https://github.com/happner/happner/blob/master/docs/exchange.md)
* [Data Api](https://github.com/happner/happner/blob/master/docs/data.md)
* [Web Routes](https://github.com/happner/happner/blob/master/docs/webroutes.md)

* [Starting a Mesh Node](https://github.com/happner/happner/blob/master/docs/starting.md)
* [System Components](https://github.com/happner/happner/blob/master/docs/system.md)
* [Using the Client](https://github.com/happner/happner/blob/master/docs/client.md)
