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

[&#9654;](https://github.com/happner/happner/blob/master/docs/quickstart.md) Quick Start<br/>

## documentation

[&#9654;](https://github.com/happner/happner/blob/master/docs/configuration.md) Configuation<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/datalayer.md) DataLayer<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/modules.md) Modules and Components<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/autoload.md) Autoloading and Defaulting<br/>

[&#9654;](https://github.com/happner/happner/blob/master/docs/event.md) Event Api<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/exchange.md) Exchange Api<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/data.md) Data Api<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/webroutes.md) Web Routes<br/>

[&#9654;](https://github.com/happner/happner/blob/master/docs/starting.md) Starting a Mesh Node<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/system.md) System Components<br/>
[&#9654;](https://github.com/happner/happner/blob/master/docs/client.md) Using the Client<br/>
