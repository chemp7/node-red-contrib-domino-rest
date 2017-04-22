# node-red-contrib-domino-rest

## Overview

This collection of Node-RED nodes is for Domino Data Services in Domino Access Services.

## Description

IBM Domino Access Services are Web REST services that provide a standard way of accessing Domino resources over HTTP.
With REST service, It is possible to read of the data on database, create, update, and delete.

This package is created by modifying the http request Node.
This packeage added support to Domino Data Service in Domino Access Services.
It is possible to access easy to Domino Access Services by use by the node that is included in this package.


## Node

**Domino data service**

* Database collection node
  - This node is possible to access to **the database collection resouce**.

* Document node
  - This node is possible to access to **the document resouce**.

* Document collection node
  - This node is possible to access to **the document collection resouce**.

* View/folder collection node
  - This node is possible to access to **the view/folder collection resouce**.

* View/folder design node
  - This node is possible to access to **the view/folder design resouce**.

* View/folder entries node
  - This node is possible to access to **the view/folder entries resouce**.

* View/folder entry node
  - This node is possible to access to **the view/folder entry resouce**.

**Domino core service**

* Services node
  - This node is possible to access to **the list of services installed**.

* Core resources node
  - This node is possible to access to **the list of resources**.

* Nonce node
  - This node is possible to access to **a token to be used in subsequent requests for CSRF protection**.

* Password statistics node
  - This node is possible to access to **the password statistics**.


**Note**

* msg.method can not overrid.


## Chart
![Chart](https://github.com/chemp7/node-red-contrib-domino-rest/blob/master/image/node-red-contrib-domino-rest.png)


## Install

Run the following command in the root directory of your Node-RED install.

        npm install node-red-contrib-domino-rest


## Licence

MIT

This package is created by modifying the httprequest Node.
The httprequest Node has been included in the Node-RED.
The httprequest Node is released under the Apache License Version 2.0.


## Author

[Takeshi Yoshida](https://github.com/chemp7)


## Releace

2017/04/22 v0.0.8 Added node for Domino core service

2016/08/28 v0.0.7 Typographical error fix

2016/05/10 v0.0.6 README fix

2016/05/10 v0.0.5 bug fix

2016/05/09 v0.0.4 bug fix

2016/05/08 v0.0.3 bug fix

