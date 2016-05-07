/**
 * Copyright 2013, 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
/**
	Copyright (c) 2016 Takeshi Yoshida
	Released under the MIT license
	https://opensource.org/licenses/mit-license.php

	This program has been created on the basis of the "http request node".
	Added support for "Domino Access Services".
**/

module.exports = function(RED) {
    "use strict";
    var http = require("follow-redirects").http;
    var https = require("follow-redirects").https;
    var urllib = require("url");
    var mustache = require("mustache");
    var querystring = require("querystring");
    var DEBUG = true;

    function HTTPRequest(n) {
        RED.nodes.createNode(this,n);
//        var nodeUrl = n.url;
		var nodeUrl = "";
        var nodeHost = n.host;
        var nodeDatabase = n.database;
        var nodeViewtype = n.viewtype || "use";
        var nodeViewname = n.viewname;
        var nodeViewunid = n.viewunid;
        
        // Query Parameters: get
        var nodeSearch = n.search;
        var nodeSearchmaxdocs = n.searchmaxdocs;
        var nodeStart = n.start;
        var nodeCount = n.count;
        var nodeSi = n.si;
        var nodePs = n.ps;
        var nodePage = n.page;
        var nodeSortcolumn = n.sortcolumn;
        var nodeSortorder = n.sortorder || "use";
        var nodeStartkeys = n.startkeys;
        var nodeKeys = n.keys;
        var nodeKeysexactmatch = n.keysexactmatch || "use";
        var nodeExpandlevel = n.expandlevel;
        var nodeCategory = n.category;
        var nodeSystemcolumns = n.systemcolumns;
        var nodeCompact = n.compact;
        var nodeEntrycount = n.entrycount;
        
        // Query Parameters: post
        var nodeComputewithform = n.computewithform || "use";
        var nodeForm = n.form;
        var nodeParentid = n.parentid;	// parentid is included in parameters of "GET" and "POST".
//        var isTemplatedUrl = (nodeUrl||"").indexOf("{{") != -1;
        var nodeMethod = n.method || "GET";
//        var nodeMethod = "GET";
//        this.ret = n.ret || "txt";
        this.ret = "txt";
        if (RED.settings.httpRequestTimeout) { this.reqTimeout = parseInt(RED.settings.httpRequestTimeout) || 120000; }
        else { this.reqTimeout = 120000; }
        var node = this;

		log("host(node)", nodeHost);
		log("database", nodeDatabase);
		log("viewtype", nodeViewtype);
		log("-> name", nodeViewname);
		log("-> unid", nodeViewunid);
		log("--> search", nodeSearch);
		log("--> searchmaxdocs", nodeSearchmaxdocs);
		log("--> start", nodeStart);
		log("--> count", nodeCount);
		log("--> si", nodeSi);
		log("--> ps", nodePs);
		log("--> page", nodePage);
		log("--> sortcolumn", nodeSortcolumn);
		log("--> sortorder", nodeSortorder);
		log("--> startkeys", nodeStartkeys);
		log("--> keys", nodeKeys);
		log("--> keysexactmatch", nodeKeysexactmatch);
		log("--> expandlevel", nodeExpandlevel);
		log("--> category", nodeCategory);
		log("--> systemcolumns", nodeSystemcolumns);
		log("--> compact", nodeCompact);
		log("--> entrycount", nodeEntrycount);
		log("--> computewithform", nodeComputewithform);
		log("--> form", nodeForm);
		log("--> parentid", nodeParentid);

        var prox, noprox;
        if (process.env.http_proxy != null) { prox = process.env.http_proxy; }
        if (process.env.HTTP_PROXY != null) { prox = process.env.HTTP_PROXY; }
        if (process.env.no_proxy != null) { noprox = process.env.no_proxy.split(","); }
        if (process.env.NO_PROXY != null) { noprox = process.env.NO_PROXY.split(","); }

        this.on("input",function(msg) {
            var preRequestTimestamp = process.hrtime();
            node.status({fill:"blue",shape:"dot",text:"httpin.status.requesting"});
            var method = nodeMethod.toUpperCase() || "GET";
           
            var host = nodeHost || ((typeof msg.host === "undefined") ? "" : msg.host);
            var database = nodeDatabase || ((typeof msg.database === "undefined") ? "" : msg.database);
            if (nodeViewtype === "use"){
	            var viewtype = (typeof msg.viewtype === "undefined") ? "" : msg.viewtype;
            } else {
            	var viewtype = nodeViewtype;
        	}
            var viewname = nodeViewname || ((typeof msg.viewname === "undefined") ? "" : msg.viewname);
            var viewunid = nodeViewunid || ((typeof msg.viewunid === "undefined") ? "" : msg.viewunid);
            var search = nodeSearch || ((typeof msg.search === "undefined") ? "" : msg.search);
            var searchmaxdocs = nodeSearchmaxdocs || ((typeof msg.searchmaxdocs === "undefined") ? "" : msg.searchmaxdocs);
            var start = nodeStart || ((typeof msg.start === "undefined") ? "" : msg.start);
            var count = nodeCount || ((typeof msg.count === "undefined") ? "" : msg.count);
            var si = nodeSi || ((typeof msg.si === "undefined") ? "" : msg.si);
            var ps = nodePs || ((typeof msg.ps === "undefined") ? "" : msg.ps);
            var page = nodePage || ((typeof msg.page === "undefined") ? "" : msg.page);
            var sortcolumn = nodeSortcolumn || ((typeof msg.sortcolumn === "undefined") ? "" : msg.sortcolumn);
            if (nodeSortorder === "use"){
	            var sortorder = (typeof msg.sortorder === "undefined") ? "" : msg.sortorder;
            } else {
            	var sortorder = nodeSortorder;
        	}
            var startkeys = nodeStartkeys || ((typeof msg.startkeys === "undefined") ? "" : msg.startkeys);
            var keys = nodeKeys || ((typeof msg.keys === "undefined") ? "" : msg.keys);
            if (nodeKeysexactmatch === "use"){
	            var keysexactmatch = (typeof msg.keysexactmatch === "undefined") ? "" : msg.keysexactmatch;
            } else {
            	var keysexactmatch = nodeKeysexactmatch;
        	}
            var expandlevel = nodeExpandlevel || ((typeof msg.expandlevel === "undefined") ? "" : msg.expandlevel);
            var category = nodeCategory || ((typeof msg.category === "undefined") ? "" : msg.category);
            var systemcolumns = nodeSystemcolumns || ((typeof msg.systemcolumns === "undefined") ? "" : msg.systemcolumns);
            
            if (nodeCompact === "use"){
	            var compact = (typeof msg.compact === "undefined") ? "" : msg.compact;
            } else {
            	var compact = nodeCompact;
        	}
            if (nodeEntrycount === "use"){
	            var entrycount = (typeof msg.entrycount === "undefined") ? "" : msg.entrycount;
            } else {
            	var entrycount = nodeEntrycount;
        	}
            if (nodeComputewithform === "use"){
	            var computewithform = (typeof msg.computewithform === "undefined") ? "" : msg.computewithform;
            } else {
            	var computewithform = nodeComputewithform;
        	}
            var form = nodeForm || ((typeof msg.form === "undefined") ? "" : msg.form);
            var parentid = nodeParentid || ((typeof msg.parentid === "undefined") ? "" : msg.parentid);
           
         	log("host", nodeHost);
			log("database", database);
			log("viewtype", viewtype);
			log("-> name", viewname);
			log("-> unid", viewunid);
			log("--> search", search);
			log("--> search max docs", searchmaxdocs);
			log("--> start", start);
			log("--> count", count);
			log("--> si", si);
			log("--> ps", ps);
			log("--> page", page);
			log("--> sortcolumn", sortcolumn);
			log("--> sortorder", sortorder);
			log("--> startkeys", startkeys);
			log("--> keys", keys);
			log("--> keysexactmatch", keysexactmatch);
			log("--> expandlevel", expandlevel);
			log("--> category", category);
			log("--> systemcolumns", systemcolumns);
			log("--> compact", compact);
			log("--> entrycount", entrycount);
			log("--> computewithform", computewithform);
			log("--> form", form);
			log("--> parentid", parentid);

            if (viewtype === "unid") {
           	    var opUri = "unid/" + viewunid;
            } else {
           	    var opUri = "name/" + viewname;
            }
            
      		var params = "";
			if (method === "GET"){
				params = setParameter( params, "search", search );
				params = setParameter( params, "searchmaxdocs", searchmaxdocs );
				params = setParameter( params, "start", start );
				params = setParameter( params, "count", count );
				params = setParameter( params, "si", si );
				params = setParameter( params, "ps", ps );
				params = setParameter( params, "page", page );
				params = setParameter( params, "sortcolumn", sortcolumn );
				params = setParameter( params, "sortorder", sortorder );
				params = setParameter( params, "startkeys", startkeys );
				params = setParameter( params, "keys", keys );
				params = setParameter( params, "keysexactmatch", keysexactmatch );
				params = setParameter( params, "expandlevel", expandlevel );
				params = setParameter( params, "category", category );
				params = setParameter( params, "parentid", parentid );
				params = setParameter( params, "systemcolumns", systemcolumns );
				params = setParameter( params, "compact", compact );
				params = setParameter( params, "entrycount", entrycount );
				node.ret = "obj";
			} else if (method === "POST" ) {
				params = setParameter( params, "computewithform", computewithform.toString() );
				params = setParameter( params, "form", form );
				params = setParameter( params, "parentid", parentid );
				node.ret = "txt";
			} else if (method === "PUT" ) {
				node.ret = "txt";
			}
			log("params", params);
			log("node.ret", node.ret);
			log("this.ret", node.ret);

            // Domino Access Services (REST API)
			//{database}/api/data/collections/unid/{unid}
			//{database}/api/data/collections/name/{name}
			var baseUri= "api/data/collections"
            var url = encodeURI(setSlash( host ) + database + "/" + baseUri + "/" + opUri + params);
			log("url", url);

            if (msg.url && nodeUrl && (nodeUrl !== msg.url)) {  // revert change below when warning is finally removed
                node.warn(RED._("common.errors.nooverride"));
            }
            /*
            if (isTemplatedUrl) {
                url = mustache.render(nodeUrl,msg);
            }
            */
            if (!url) {
                node.error(RED._("httpin.errors.no-url"),msg);
                return;
            }
            // url must start http:// or https:// so assume http:// if not set
            if (!((url.indexOf("http://") === 0) || (url.indexOf("https://") === 0))) {
                url = "http://"+url;
            }

//            var method = nodeMethod.toUpperCase() || "GET";  //move up
            if (msg.method && n.method && (n.method !== "use")) {     // warn if override option not set
                node.warn(RED._("common.errors.nooverride"));
            }
            if (msg.method && n.method && (n.method === "use")) {
                method = msg.method.toUpperCase();          // use the msg parameter
            }
            var opts = urllib.parse(url);
            opts.method = method;
            opts.headers = {};
            if (msg.headers) {
                for (var v in msg.headers) {
                    if (msg.headers.hasOwnProperty(v)) {
                        var name = v.toLowerCase();
                        if (name !== "content-type" && name !== "content-length") {
                            // only normalise the known headers used later in this
                            // function. Otherwise leave them alone.
                            name = v;
                        }
                        opts.headers[name] = msg.headers[v];
                    }
                }
            }
            if (this.credentials && this.credentials.user) {
                opts.auth = this.credentials.user+":"+(this.credentials.password||"");
            }
            var payload = null;

            if (msg.payload && (method == "POST" || method == "PUT" || method == "PATCH" ) ) {
                if (typeof msg.payload === "string" || Buffer.isBuffer(msg.payload)) {
                    payload = msg.payload;
                } else if (typeof msg.payload == "number") {
                    payload = msg.payload+"";
                } else {
                    if (opts.headers['content-type'] == 'application/x-www-form-urlencoded') {
                        payload = querystring.stringify(msg.payload);
                    } else {
                        payload = JSON.stringify(msg.payload);
                        if (opts.headers['content-type'] == null) {
                            opts.headers['content-type'] = "application/json";
                        }
                    }
                }
                if (opts.headers['content-length'] == null) {
                    if (Buffer.isBuffer(payload)) {
                        opts.headers['content-length'] = payload.length;
                    } else {
                        opts.headers['content-length'] = Buffer.byteLength(payload);
                    }
                }
            }
            var urltotest = url;
            var noproxy;
            if (noprox) {
                for (var i in noprox) {
                    if (url.indexOf(noprox[i]) !== -1) { noproxy=true; }
                }
            }
            if (prox && !noproxy) {
                var match = prox.match(/^(http:\/\/)?(.+)?:([0-9]+)?/i);
                if (match) {
                    //opts.protocol = "http:";
                    //opts.host = opts.hostname = match[2];
                    //opts.port = (match[3] != null ? match[3] : 80);
                    opts.headers['Host'] = opts.host;
                    var heads = opts.headers;
                    var path = opts.pathname = opts.href;
                    opts = urllib.parse(prox);
                    opts.path = opts.pathname = path;
                    opts.headers = heads;
                    opts.method = method;
                    //console.log(opts);
                    urltotest = match[0];
                }
                else { node.warn("Bad proxy url: "+process.env.http_proxy); }
            }
            var req = ((/^https/.test(urltotest))?https:http).request(opts,function(res) {
                (node.ret === "bin") ? res.setEncoding('binary') : res.setEncoding('utf8');
                msg.statusCode = res.statusCode;
                msg.headers = res.headers;
                msg.payload = "";
                // msg.url = url;   // revert when warning above finally removed
                res.on('data',function(chunk) {
                    msg.payload += chunk;
                });
                res.on('end',function() {
                    if (node.metric()) {
                        // Calculate request time
                        var diff = process.hrtime(preRequestTimestamp);
                        var ms = diff[0] * 1e3 + diff[1] * 1e-6;
                        var metricRequestDurationMillis = ms.toFixed(3);
                        node.metric("duration.millis", msg, metricRequestDurationMillis);
                        if (res.client && res.client.bytesRead) {
                            node.metric("size.bytes", msg, res.client.bytesRead);
                        }
                    }
                    if (node.ret === "bin") {
                        msg.payload = new Buffer(msg.payload,"binary");
                    }
                    else if (node.ret === "obj") {
                        try { msg.payload = JSON.parse(msg.payload); }
                        catch(e) { node.warn(RED._("httpin.errors.json-error")); }
                    }
                    node.send(msg);
                    node.status({});
                });
            });
            req.setTimeout(node.reqTimeout, function() {
                node.error(RED._("common.notification.errors.no-response"),msg);
                setTimeout(function() {
                    node.status({fill:"red",shape:"ring",text:"common.notification.errors.no-response"});
                },10);
                req.abort();
            });
            req.on('error',function(err) {
                msg.payload = err.toString() + " : " + url;
                msg.statusCode = err.code;
                node.send(msg);
                node.status({fill:"red",shape:"ring",text:err.code});
            });
            if (payload) {
                req.write(payload);
            }
            req.end();
        });
    }
    
    RED.nodes.registerType("view entries",HTTPRequest,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

	function setParameter( params, n, v ){	//n:parameter name, v:parameter value
        if (v !== "") {
        	params = params + "&" + n + "=" + v;
        }
        if (params.slice(0,1) === "&") {
        	params = "?" + params.slice(1);
    	}
        return params;
	}

    function setSlash ( str ){
    	if (str.length > 0) {
    		if ( str.slice(-1) === "/" ){
    			return str;
    		} else {
    			return str + "/";
    		}
    	}
	}

    function log ( label, str ){
    	if (DEBUG === true){
			console.log( label + ": " + str);
	    }
	};
}
