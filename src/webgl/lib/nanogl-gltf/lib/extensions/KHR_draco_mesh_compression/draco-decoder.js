/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-unexpected-multiline */
/* eslint-disable no-undef */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["DracoDecoder"] = factory();
	else
		root["DracoDecoder"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	const installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		const ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(const key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		const getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/draco/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/draco/DecoderPool.ts":
/*!**********************************!*\
  !*** ./src/draco/DecoderPool.ts ***!
  \**********************************/
/*! exports provided: DecoderPool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DecoderPool", function() { return DecoderPool; });
/* harmony import */ const _DecoderWorker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DecoderWorker */ "./src/draco/DecoderWorker.ts");
//@ts-ignore

let BasisTranscoderBinary = null;
let BasisTranscoderModule = null;
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
function createWorker(dracoModule) {
    let blob;
    const wScript = dracoModule + '\n' + _DecoderWorker__WEBPACK_IMPORTED_MODULE_0__["default"];
    try {
        blob = new Blob([wScript], { type: 'application/javascript' });
    }
    catch (e) {
        //@ts-ignore
        const BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        const blobBuilder = new BlobBuilder();
        blobBuilder.append(wScript);
        blob = blobBuilder.getBlob();
    }
    const datauri = URL.createObjectURL(blob);
    const worker = new Worker(datauri);
    URL.revokeObjectURL(datauri);
    return worker;
}
async function fetchDracoWasm(path) {
    if (BasisTranscoderBinary === null) {
        const response = await fetch(path);
        BasisTranscoderBinary = await response.arrayBuffer();
    }
    return BasisTranscoderBinary;
}
async function fetchDracoModule(path) {
    if (BasisTranscoderModule === null) {
        const response = await fetch(path);
        BasisTranscoderModule = await response.text();
    }
    return BasisTranscoderModule;
}
async function fetchDracoCode(paths) {
    const wp = fetchDracoWasm(paths.wasmUrl);
    const cp = fetchDracoModule(paths.moduleUrl);
    return Promise.all([wp, cp]);
}
class WorkerRequest {
    constructor() {
        this.id = '' + WorkerRequest.UID++;
        this._defered = new Deferred();
    }
    async response() {
        return this._defered.promise;
    }
}
WorkerRequest.UID = 0;
class DracoDecoderWorker {
    constructor() {
        this._initDeferred = null;
        this._status = 0 /* UNINITIALIZED */;
        this._onMessage = (event) => {
            const msg = event.data;
            switch (msg.type) {
                case 1 /* INIT_RESPONSE */:
                    this._initDeferred.resolve();
                    break;
                case 3 /* DECODING_RESPONSE */:
                    this._handleTranscodeResponse(msg);
                    break;
                default:
                    throw `unknown message ${msg.type}`;
            }
        };
        this._requests = new Map();
        this._initDeferred = new Deferred();
    }
    async init(codes) {
        const [wasm, moduleStr] = codes;
        this.worker = createWorker(moduleStr);
        this.worker.addEventListener("message", this._onMessage);
        this._postMessage({ type: 0 /* INIT_REQUEST */, payload: wasm, uid: '' }, []);
        return this._initDeferred.promise;
    }
    async decode(request) {
        const req = new WorkerRequest();
        this._requests.set(req.id, req);
        const message = { type: 2 /* DECODING_REQUEST */, payload: request, uid: req.id };
        this._postMessage(message, [request.buffer]);
        return req.response();
    }
    _postMessage(m, transferables) {
        this.worker.postMessage(m, transferables);
    }
    _handleTranscodeResponse(msg) {
        const deferred = this._requests.get(msg.uid)._defered;
        if (msg.payload.error) {
            deferred.reject(msg.payload.error);
        }
        else {
            deferred.resolve(msg.payload);
        }
        this._requests.delete(msg.uid);
    }
}
class DecoderPool {
    constructor(options) {
        this.maxWorkers = 4;
        this._transcoders = [];
        this._available = [];
        this._pendingRequests = [];
        this._options = options;
    }
    /*
    * Provide available transcoder
    * return unused transcoder if exist
    * create new one if maxWorker not yet reached
    * otherwise enqueue request
    */
    async getTranscoder() {
        if (this._available.length > 0) {
            return this._available.pop();
        }
        if (this._transcoders.length < this.maxWorkers) {
            const t = new DracoDecoderWorker();
            this._transcoders.push(t);
            const codes = await fetchDracoCode(this._options);
            await t.init(codes);
            return t;
        }
        const request = new Deferred();
        this._pendingRequests.push(request);
        return request.promise;
    }
    releaseTranscoder(transcoder) {
        this._makeAvailable(transcoder);
    }
    /*
    * call whenever a trancoder became available
    * if pending request exist, transfert it directly
    * else push transcoder back to _available stack
    */
    _makeAvailable(transcoder) {
        if (this._pendingRequests.length > 0) {
            this._pendingRequests.shift().resolve(transcoder);
        }
        else {
            this._available.push(transcoder);
        }
    }
}


/***/ }),

/***/ "./src/draco/DecoderWorker.ts":
/*!************************************!*\
  !*** ./src/draco/DecoderWorker.ts ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function worker() {
    //@ts-ignore
    // var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    //   function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    //   return new (P || (P = Promise))(function (resolve, reject) {
    //       function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    //       function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    //       function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    //       step((generator = generator.apply(thisArg, _arguments || [])).next());
    //   });
    // };
    class Deferred {
        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
    }
    const ctx = self;
    const DracoInitialisationDeferred = new Deferred();
    let dracoModule = null;
    const GL_BYTE = 0x1400;
    const GL_UNSIGNED_BYTE = 0x1401;
    const GL_SHORT = 0x1402;
    const GL_UNSIGNED_SHORT = 0x1403;
    const GL_INT = 0x1404;
    const GL_UNSIGNED_INT = 0x1405;
    const GL_FLOAT = 0x1406;
    function getArraysForDataType(module, decoder, geometry, attribute) {
        const numPoints = geometry.num_points();
        const numComponents = attribute.num_components();
        const type = attribute.data_type();
        const numValues = numPoints * numComponents;
        let dracoArray;
        let array;
        switch (type) {
            case module.DT_INT8:
                dracoArray = new module.DracoInt8Array();
                decoder.GetAttributeInt8ForAllPoints(geometry, attribute, dracoArray);
                array = new Int8Array(numValues);
                break;
            case module.DT_UINT8:
                dracoArray = new module.DracoUInt8Array();
                decoder.GetAttributeUInt8ForAllPoints(geometry, attribute, dracoArray);
                array = new Uint8Array(numValues);
                break;
            case module.DT_INT16:
                dracoArray = new module.DracoInt16Array();
                decoder.GetAttributeInt16ForAllPoints(geometry, attribute, dracoArray);
                array = new Int16Array(numValues);
                break;
            case module.DT_UINT16:
                dracoArray = new module.DracoUInt16Array();
                decoder.GetAttributeUInt16ForAllPoints(geometry, attribute, dracoArray);
                array = new Uint16Array(numValues);
                break;
            case module.DT_INT32:
                dracoArray = new module.DracoInt32Array();
                decoder.GetAttributeInt32ForAllPoints(geometry, attribute, dracoArray);
                array = new Int32Array(numValues);
                break;
            case module.DT_UINT32:
                dracoArray = new module.DracoUInt32Array();
                decoder.GetAttributeUInt32ForAllPoints(geometry, attribute, dracoArray);
                array = new Uint32Array(numValues);
                break;
            case module.DT_FLOAT32:
                dracoArray = new module.DracoFloat32Array();
                decoder.GetAttributeFloatForAllPoints(geometry, attribute, dracoArray);
                array = new Float32Array(numValues);
                break;
            case module.DT_INT64:
            case module.DT_UINT64:
            case module.DT_FLOAT64:
            case module.DT_BOOL:
                throw new Error('Unsuported data type ' + type);
            default:
                throw new Error('Unknown data type ' + type);
        }
        for (let i = 0; i < numValues; i++) {
            array[i] = dracoArray.GetValue(i);
        }
        module.destroy(dracoArray);
        return array;
    }
    function getGlTypeFromDataType(module, type) {
        switch (type) {
            case module.DT_INT8: return GL_BYTE;
            case module.DT_UINT8: return GL_UNSIGNED_BYTE;
            case module.DT_INT16: return GL_SHORT;
            case module.DT_UINT16: return GL_UNSIGNED_SHORT;
            case module.DT_INT32: return GL_INT;
            case module.DT_UINT32: return GL_UNSIGNED_INT;
            case module.DT_FLOAT32: return GL_FLOAT;
            case module.DT_INT64:
            case module.DT_UINT64:
            case module.DT_FLOAT64:
            case module.DT_BOOL:
                throw new Error('Unsuported data type ' + type);
            default:
                throw new Error('Unknown data type ' + type);
        }
    }
    async function initializeDracoModule(data) {
        const DracoInitOptions = {
            wasmBinary: data.payload,
        };
        DracoDecoderModule(DracoInitOptions).then((module) => {
            dracoModule = module;
            DracoInitialisationDeferred.resolve(true);
            const message = {
                uid: '',
                type: 1 /* INIT_RESPONSE */,
                payload: true
            };
            ctx.postMessage(message);
        });
    }
    async function startDecoding(request) {
        try {
            const geometry = await decodeMesh(request.payload);
            sendDecodingResponse(request, {
                geometry
            });
        }
        catch (err) {
            sendDecodingResponse(request, {
                error: err,
                geometry: null
            });
        }
    }
    function decodeIndices(decoderModule, decoder, mesh) {
        const faceIndices = new decoderModule.DracoInt32Array();
        let indices;
        let gltype;
        try {
            const numFaces = mesh.num_faces();
            const numPoints = mesh.num_points();
            if (numPoints < 0xFE) {
                gltype = GL_UNSIGNED_BYTE;
                indices = new Uint8Array(numFaces * 3);
            }
            else if (numPoints < 0xFFFE) {
                gltype = GL_UNSIGNED_SHORT;
                indices = new Uint16Array(numFaces * 3);
            }
            else {
                gltype = GL_UNSIGNED_INT;
                indices = new Uint32Array(numFaces * 3);
            }
            for (let i = 0; i < numFaces; i++) {
                const offset = i * 3;
                decoder.GetFaceFromMesh(mesh, i, faceIndices);
                indices[offset + 0] = faceIndices.GetValue(0);
                indices[offset + 1] = faceIndices.GetValue(1);
                indices[offset + 2] = faceIndices.GetValue(2);
            }
            return {
                buffer: indices.buffer,
                gltype: gltype
            };
        }
        finally {
            decoderModule.destroy(faceIndices);
        }
    }
    function decodeAttribute(decoderModule, decoder, geometry, attribute, semantic) {
        const numComponents = attribute.num_components();
        const array = getArraysForDataType(decoderModule, decoder, geometry, attribute);
        const glType = getGlTypeFromDataType(decoderModule, attribute.data_type());
        return {
            semantic: semantic,
            buffer: array.buffer,
            byteOffset: 0,
            normalized: false,
            numComps: numComponents,
            componentType: glType,
            _stride: 0
        };
    }
    async function decodeMesh(request) {
        await DracoInitialisationDeferred.promise;
        const decoderModule = dracoModule;
        const buffer = new decoderModule.DecoderBuffer();
        buffer.Init(new Uint8Array(request.buffer), request.buffer.byteLength);
        const decoder = new decoderModule.Decoder();
        let geometry;
        let status;
        let numIndices = 0;
        try {
            const type = decoder.GetEncodedGeometryType(buffer);
            switch (type) {
                case decoderModule.TRIANGULAR_MESH:
                    geometry = new decoderModule.Mesh();
                    numIndices = geometry.num_faces() * 3;
                    status = decoder.DecodeBufferToMesh(buffer, geometry);
                    break;
                case decoderModule.POINT_CLOUD:
                    geometry = new decoderModule.PointCloud();
                    status = decoder.DecodeBufferToPointCloud(buffer, geometry);
                    break;
                default:
                    throw new Error(`Invalid geometry type ${type}`);
            }
            const numVertices = geometry.num_points();
            if (!status.ok()) {
                throw new Error(status.error_msg());
            }
            let indices;
            if (type === decoderModule.TRIANGULAR_MESH) {
                indices = decodeIndices(decoderModule, decoder, geometry);
            }
            const attrRequest = request.attributes || {
                POSITION: decoder.GetAttributeId(geometry, decoderModule.POSITION),
                NORMAL: decoder.GetAttributeId(geometry, decoderModule.NORMAL),
                TEXCOORD_0: decoder.GetAttributeId(geometry, decoderModule.TEX_COORD),
                COLOR_0: decoder.GetAttributeId(geometry, decoderModule.COLOR),
            };
            const attributes = [];
            for (const semantic in attrRequest) {
                const id = attrRequest[semantic];
                const attribute = decoder.GetAttributeByUniqueId(geometry, id);
                const attrib = decodeAttribute(decoderModule, decoder, geometry, attribute, semantic);
                attributes.push(attrib);
            }
            return {
                indices,
                attributes,
                numIndices,
                numVertices
            };
        }
        finally {
            if (geometry) {
                decoderModule.destroy(geometry);
            }
            decoderModule.destroy(decoder);
            decoderModule.destroy(buffer);
        }
    }
    function getResponseTransferables(response) {
        const transferables = [];
        for (const attrib of response.geometry.attributes) {
            transferables.push(attrib.buffer);
        }
        if (response.geometry.indices)
            transferables.push(response.geometry.indices.buffer);
        return transferables;
    }
    function sendDecodingResponse(request, response) {
        const result = {
            uid: request.uid,
            type: 3 /* DECODING_RESPONSE */,
            payload: response
        };
        const transferables = getResponseTransferables(response);
        ctx.postMessage(result, transferables);
    }
    // Respond to message from parent thread
    ctx.addEventListener("message", (event) => {
        const data = event.data;
        switch (data.type) {
            case 0 /* INIT_REQUEST */:
                initializeDracoModule(data);
                break;
            case 2 /* DECODING_REQUEST */:
                startDecoding(data);
                break;
            default:
                break;
        }
    });
}
const WorkerScript = `(${worker})()`;
/* harmony default export */ __webpack_exports__["default"] = (WorkerScript);


/***/ }),

/***/ "./src/draco/index.ts":
/*!****************************!*\
  !*** ./src/draco/index.ts ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return DracoDecoder; });
/* harmony import */ const _DecoderPool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DecoderPool */ "./src/draco/DecoderPool.ts");

class DracoDecoder {
    constructor(options) {
        this._transcoderPool = new _DecoderPool__WEBPACK_IMPORTED_MODULE_0__["DecoderPool"](options);
    }
    async transcode(request) {
        const worker = await this._transcoderPool.getTranscoder();
        try {
            const result = await worker.decode(request);
            return result;
        }
        finally {
            this._transcoderPool.releaseTranscoder(worker);
        }
    }
}


/***/ })

/******/ })["default"];
});