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
	Columns in a view or folder.
**/

module.exports = function(RED) {
    "use strict";
    var http = require("follow-redirects").http;
    var https = require("follow-redirects").https;
    var urllib = require("url");
    var mustache = require("mustache");
    var querystring = require("querystring");
    var DEBUG = false;

    function HTTPRequest(n) {
        RED.nodes.createNode(this,n);
//        var nodeUrl = n.url;
		var nodeUrl = "";
        var nodeHost = n.host;
        var nodeDatabase = n.database;
        var nodeViewtype = n.viewtype || "use";
        var nodeViewname = n.viewname;
        var nodeViewunid = n.viewunid;
        var nodeCompact = n.compact || "use"
//        var isTemplatedUrl = (nodeUrl||"").indexOf("{{") != -1;
        var nodeMethod = n.method || "GET";
//        this.ret = n.ret || "txt";
        this.ret = "obj";
        if (RED.settings.httpRequestTimeout) { this.reqTimeout = parseInt(RED.settings.httpRequestTimeout) || 120000; }
        else { this.reqTimeout = 120000; }
        var node = this;

		log("method", nodeMethod);
		log("host", nodeHost);
		log("database", nodeDatabase);
		log("viewtype", nodeViewtype);
		log("-> name", nodeViewname);
		log("-> unid", nodeViewunid);
		log("--> compact", nodeCompact);

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
            if (nodeCompact === "use"){
	            var compact = (typeof msg.compact === "undefined") ? "" : msg.compact;
            } else {
            	var compact = nodeCompact;
        	}

			log("method", method);
			log("host", host);
			log("database", database);
			log("viewtype", viewtype);
			log("-> name", viewname);
			log("-> unid", viewunid);
			log("--> compact", compact);

            if (viewtype === "unid") {
           	    var opUri = "unid/" + viewunid;
            } else if (viewtype === "name") {
           	    var opUri = "name/" + viewname;
            }
       		var params = "";
			if (method === "GET"){
				params = setParameter( params, "compact", compact );
			}

            // Domino Access Services (REST API)
			//{database}/api/data/collections/unid/{unid}/design
			//{database}/api/data/collections/name/{name}/design
			var baseUri= "api/data/collections"
            var url = encodeURI(setSlash( host ) + database + "/" + baseUri + "/" + opUri + "/design");
			log("url", url);

			if (host === "" || database === "" || viewtype === "" || (viewtype === "unid" && viewunid === "") || (viewtype === "name" && viewname === "") || (viewunid === "" && viewname === "")) {
				var errorparam = "";
				errorparam = (host === "") ? errorparam + " host," : errorparam;
				errorparam = (database === "") ? errorparam + " database," : errorparam;
				errorparam = (viewtype === "") ? errorparam + " viewtype," : errorparam;
        		errorparam = (viewtype === "unid" && viewunid === "") ? errorparam + " viewunid," : errorparam;
        		errorparam = (viewtype === "name" && viewname === "") ? errorparam + " viewname," : errorparam;
				node.error("Parameter is missing:" + errorparam.substr(0, errorparam.length-1 ));
				node.status({fill:"red",shape:"ring",text:"pamareter error"});
				return;
			}
			
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

					// Check statusCode
					if (msg.statusCode >= 200 && msg.statusCode < 300) {
						
					} else {
						node.warn("Response Status Code is " + msg.statusCode + ".");
						node.status({fill:"yellow",shape:"ring",text:"statusCode warning"});
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
    
    RED.nodes.registerType("view design",HTTPRequest,{
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
    	return str;
	}

    function log ( label, str ){
    	if (DEBUG === true){
			console.log( label + ": " + str);
	    }
	};
}
