const manifest = {"name":"SLSDeckUniversal"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const routerHook = api.routerHook;
const toaster = api.toaster;
const openFilePicker = api.openFilePicker;
const fetchNoCors = api.fetchNoCors;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaWrench (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M507.73 109.1c-2.24-9.03-13.54-12.09-20.12-5.51l-74.36 74.36-67.88-11.31-11.31-67.88 74.36-74.36c6.62-6.62 3.43-17.9-5.66-20.16-47.38-11.74-99.55.91-136.58 37.93-39.64 39.64-50.55 97.1-34.05 147.2L18.74 402.76c-24.99 24.99-24.99 65.51 0 90.5 24.99 24.99 65.51 24.99 90.5 0l213.21-213.21c50.12 16.71 107.47 5.68 147.37-34.22 37.07-37.07 49.7-89.32 37.91-136.73zM64 472c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24z"},"child":[]}]})(props);
}function FaSlidersH (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M496 384H160v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h80v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h336c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160h-80v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h336v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h80c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160H288V48c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16C7.2 64 0 71.2 0 80v32c0 8.8 7.2 16 16 16h208v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h208c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16z"},"child":[]}]})(props);
}function FaShieldAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"},"child":[]}]})(props);
}function FaQuestionCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z"},"child":[]}]})(props);
}function FaPuzzlePiece (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M519.442 288.651c-41.519 0-59.5 31.593-82.058 31.593C377.409 320.244 432 144 432 144s-196.288 80-196.288-3.297c0-35.827 36.288-46.25 36.288-85.985C272 19.216 243.885 0 210.539 0c-34.654 0-66.366 18.891-66.366 56.346 0 41.364 31.711 59.277 31.711 81.75C175.885 207.719 0 166.758 0 166.758v333.237s178.635 41.047 178.635-28.662c0-22.473-40-40.107-40-81.471 0-37.456 29.25-56.346 63.577-56.346 33.673 0 61.788 19.216 61.788 54.717 0 39.735-36.288 50.158-36.288 85.985 0 60.803 129.675 25.73 181.23 25.73 0 0-34.725-120.101 25.827-120.101 35.962 0 46.423 36.152 86.308 36.152C556.712 416 576 387.99 576 354.443c0-34.199-18.962-65.792-56.558-65.792z"},"child":[]}]})(props);
}function FaLock (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"},"child":[]}]})(props);
}function FaKey (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M512 176.001C512 273.203 433.202 352 336 352c-11.22 0-22.19-1.062-32.827-3.069l-24.012 27.014A23.999 23.999 0 0 1 261.223 384H224v40c0 13.255-10.745 24-24 24h-40v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24v-78.059c0-6.365 2.529-12.47 7.029-16.971l161.802-161.802C163.108 213.814 160 195.271 160 176 160 78.798 238.797.001 335.999 0 433.488-.001 512 78.511 512 176.001zM336 128c0 26.51 21.49 48 48 48s48-21.49 48-48-21.49-48-48-48-48 21.49-48 48z"},"child":[]}]})(props);
}function FaInfoCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"},"child":[]}]})(props);
}function FaGamepad (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M480.07 96H160a160 160 0 1 0 114.24 272h91.52A160 160 0 1 0 480.07 96zM248 268a12 12 0 0 1-12 12h-52v52a12 12 0 0 1-12 12h-24a12 12 0 0 1-12-12v-52H84a12 12 0 0 1-12-12v-24a12 12 0 0 1 12-12h52v-52a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v52h52a12 12 0 0 1 12 12zm216 76a40 40 0 1 1 40-40 40 40 0 0 1-40 40zm64-96a40 40 0 1 1 40-40 40 40 0 0 1-40 40z"},"child":[]}]})(props);
}function FaDownload (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"},"child":[]}]})(props);
}function FaDice (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M592 192H473.26c12.69 29.59 7.12 65.2-17 89.32L320 417.58V464c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48V240c0-26.51-21.49-48-48-48zM480 376c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm-46.37-186.7L258.7 14.37c-19.16-19.16-50.23-19.16-69.39 0L14.37 189.3c-19.16 19.16-19.16 50.23 0 69.39L189.3 433.63c19.16 19.16 50.23 19.16 69.39 0L433.63 258.7c19.16-19.17 19.16-50.24 0-69.4zM96 248c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm128 128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm0-128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm0-128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm128 128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24z"},"child":[]}]})(props);
}function FaCog (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"},"child":[]}]})(props);
}function FaCloud (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4z"},"child":[]}]})(props);
}function FaBoxOpen (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M425.7 256c-16.9 0-32.8-9-41.4-23.4L320 126l-64.2 106.6c-8.7 14.5-24.6 23.5-41.5 23.5-4.5 0-9-.6-13.3-1.9L64 215v178c0 14.7 10 27.5 24.2 31l216.2 54.1c10.2 2.5 20.9 2.5 31 0L551.8 424c14.2-3.6 24.2-16.4 24.2-31V215l-137 39.1c-4.3 1.3-8.8 1.9-13.3 1.9zm212.6-112.2L586.8 41c-3.1-6.2-9.8-9.8-16.7-8.9L320 64l91.7 152.1c3.8 6.3 11.4 9.3 18.5 7.3l197.9-56.5c9.9-2.9 14.7-13.9 10.2-23.1zM53.2 41L1.7 143.8c-4.6 9.2.3 20.2 10.1 23l197.9 56.5c7.1 2 14.7-1 18.5-7.3L320 64 69.8 32.1c-6.9-.8-13.5 2.7-16.6 8.9z"},"child":[]}]})(props);
}function FaArrowUp (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"},"child":[]}]})(props);
}function FaArrowLeft (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"},"child":[]}]})(props);
}function FaArchive (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M32 448c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32V160H32v288zm160-212c0-6.6 5.4-12 12-12h104c6.6 0 12 5.4 12 12v8c0 6.6-5.4 12-12 12H204c-6.6 0-12-5.4-12-12v-8zM480 32H32C14.3 32 0 46.3 0 64v48c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16V64c0-17.7-14.3-32-32-32z"},"child":[]}]})(props);
}

const tokeerRuntimeStatus = callable("tokeer_runtime_status");
const tokeerPreflight = callable("tokeer_preflight");
const tokeerEnsureRuntime = callable("tokeer_ensure_runtime");
const tokeerProtonStatus = callable("tokeer_proton_status");
const tokeerEnsureProton = callable("tokeer_ensure_proton");
callable("tokeer_prepare");
callable("tokeer_prepare_verify");
const tokeerVerify = callable("tokeer_verify");
const tokeerRedeem = callable("tokeer_redeem");
const tokeerUbisoftHostedGames = callable("tokeer_ubisoft_hosted_games");
const tokeerUbisoftPackagesStatus = callable("tokeer_ubisoft_packages_status");
const tokeerEnsureUbisoftPackages = callable("tokeer_ensure_ubisoft_packages");
const tokeerApplyUbisoftPackage = callable("tokeer_apply_ubisoft_package");
const tokeerFindUbisoftToken = callable("tokeer_find_ubisoft_token");
const tokeerInstallUbisoftDbdata = callable("tokeer_install_ubisoft_dbdata");
const tokeerUbisoftDbdataStatus = callable("tokeer_ubisoft_dbdata_status");
const tokeerAppliedStatus = callable("tokeer_applied_status");
const tokeerMarkApplied = callable("tokeer_mark_applied");
// â”€â”€ Callables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
callable("get_steam_status");
const hasLua = callable("has_lua");
const startAdd = callable("start_add");
const getAddStatus = callable("get_add_status");
const cancelAdd = callable("cancel_add");
const popAddEvents = callable("pop_add_events");
const deleteLua = callable("delete_lua");
const purgeAllAdded = callable("purge_all_added");
callable("get_installed_lua");
const getEverAdded = callable("get_ever_added");
const getInstalledApps = callable("get_installed_apps");
const searchGames = callable("search_games");
const getApiList = callable("get_api_list");
const fetchFreeApis = callable("fetch_free_apis");
callable("get_api_key");
callable("set_api_key");
// multiple keys (one per source)
const getApiKeyFields = callable("get_api_key_fields");
callable("get_api_keys");
const setApiKeyFor = callable("set_api_key_for");
// ryuu API key (X-Auth-Key for gated denuvo/fix downloads)
const getRyuuKey = callable("get_ryuu_key");
const setRyuuKey = callable("set_ryuu_key");
// online-fix username (blank = auto: the Steam display name)
const getOnlineUsername = callable("get_online_username");
const setOnlineUsername = callable("set_online_username");
// CloudRedirect (cloud saves for added games)
const crGetEnabled = callable("cr_get_enabled");
const crSetEnabled = callable("cr_set_enabled");
callable("cr_open_app");
const crEnsureInstalledAuto = callable("cr_ensure_installed_auto");
const crEnsureInstalled = callable("cr_ensure_installed");
callable("cr_icon_path");
callable("cr_artwork");
const crGetShortcut = callable("cr_get_shortcut");
const crSetShortcut = callable("cr_set_shortcut");
const crSetProvider = callable("cr_set_provider");
const crSetSyncFolder = callable("cr_set_sync_folder");
const crSetProviderToggle = callable("cr_set_provider_toggle");
const crSignOut = callable("cr_sign_out");
const crAuthStart = callable("cr_auth_start");
const crAuthPoll = callable("cr_auth_poll");
const crAuthCallback = callable("cr_auth_callback");
const crListLocalApps = callable("cr_list_local_apps");
const crGameArtwork = callable("cr_game_artwork");
const crImportSave = callable("cr_import_save");
const minigameRoll = callable("minigame_roll");
const pluginUpdateStatus = callable("plugin_update_status");
const pluginUpdateReleases = callable("plugin_update_releases");
const pluginPrepareReplacement = callable("plugin_prepare_replacement");
const updatesCheck = callable("updates_check");
const updatesUpdateAll = callable("updates_update_all");
callable("updates_update_one");
const getAutoUpdate = callable("get_auto_update");
const setAutoUpdate = callable("set_auto_update");
// optional DLC (SLSsteam DlcData)
// hide Add/Fixes on games that are genuinely owned (not added by SLSsteam)
const getGamesInQam = callable("get_games_in_qam");
const setGamesInQam = callable("set_games_in_qam");
const getHideToolsQam = callable("get_hide_tools_qam");
const setHideToolsQam = callable("set_hide_tools_qam");
const getShowReinstallQam = callable("get_show_reinstall_qam");
const setShowReinstallQam = callable("set_show_reinstall_qam");
const getHideOnOwned = callable("get_hide_on_owned");
const setHideOnOwned = callable("set_hide_on_owned");
const getDlcOwnedOnly = callable("get_dlc_owned_only");
const setDlcOwnedOnly = callable("set_dlc_owned_only");
const getGroupCollection = callable("get_group_collection");
const setGroupCollection = callable("set_group_collection");
// library capsule badges + the injected library button bar
const getBadgeOptions = callable("get_badge_options");
const setBadgeOption = callable("set_badge_option");
// Non-Steam shortcut app names, derived from the target exe folder in shortcuts.vdf.
const getNonSteamApps = callable("get_nonsteam_apps");
const getLibraryButtons = callable("get_library_buttons");
const setLibraryButtons = callable("set_library_buttons");
// Denuvo detection (Steam store drm_notice, cached; seeded from ryuu bypass fixes).
// This build can't bypass Denuvo â€” the badge is a warning that a game won't work.
const denuvoKnown = callable("denuvo_known");
const denuvoResolve = callable("denuvo_resolve");
// auto-apply fixes after an add completes
const getAutoFixPending = callable("auto_fix_pending_get");
const addAutoFixPending = callable("auto_fix_pending_add");
const removeAutoFixPending = callable("auto_fix_pending_remove");
const getAutoFix = callable("get_auto_fix");
const setAutoFix = callable("set_auto_fix");
const netsockStatus = callable("netsock_status");
const netsockSet = callable("netsock_set");
const multiplayerProxyStatus = callable("multiplayer_proxy_status");
const multiplayerProxyInstall = callable("multiplayer_proxy_install");
const slsonlineStatus = callable("slsonline_status");
const setSlsonline = callable("set_slsonline");
callable("netsock_compatible");
const getDlcOption = callable("get_dlc_option");
const getPinStatus = callable("get_pin_status");
const pinGame = callable("pin_game");
const unpinGame = callable("unpin_game");
const getPinOnFix = callable("get_pin_on_fix");
const setPinOnFix = callable("set_pin_on_fix");
const getAutoApply = callable("get_auto_apply");
const setAutoApply = callable("set_auto_apply");
// Launch-target repoint: point Steam at the game's real (often nested) exe.
const getMainExe = callable("get_main_exe");
// SmokeAPI DLC unlocker (steam_api proxy).
const smokeapiStatus = callable("smokeapi_status");
const smokeapiInstall = callable("smokeapi_install");
const smokeapiRemove = callable("smokeapi_remove");
const dlcUnlockersStatus = callable("dlc_unlockers_status");
const dlcUnlockerInstall = callable("dlc_unlocker_install");
const dlcDepotPlan = callable("dlc_depot_plan");
const dlcDepotStart = callable("dlc_depot_start");
// A keepable library of builds: gids + manifest binaries + depot keys, stored
// so a build stays rebuildable after Hubcap/mirrors stop serving it. Rides along
// in the survival archive, so it survives plugin removal.
const buildArchiveAdd = callable("build_archive_add");
callable("build_archive_list");
const buildArchiveRemove = callable("build_archive_remove");
const archiveIsBuild = callable("archive_is_build");
const archiveActivate = callable("archive_activate");
const archiveDeactivate = callable("archive_deactivate");
const archiveReconcile = callable("archive_reconcile");
const archiveRemoveGame = callable("archive_remove_game");
const archiveActivateGame = callable("archive_activate_game");
const archiveReconcileAll = callable("archive_reconcile_all");
const archiveEntries = callable("archive_entries");
const archiveSnapshotGame = callable("archive_snapshot_game");
callable("archive_set_fix_wanted");
callable("archive_forget_fix");
callable("archive_pending_reapply");
const dlcDepotRemove = callable("dlc_depot_remove");
const dlcUnlockerRemove = callable("dlc_unlocker_remove");
// HVAuto (hypervisor crack) â€” compatible BuildID hint; pinning stays separate.
const hvAutoStatus = callable("hv_auto_status");
const hvAutoApply = callable("hv_auto_apply");
// CrakFiles (general DRM crack) â€” build-matched.
const crakStatus = callable("crak_status");
const crakApply = callable("crak_apply");
// Apply a crack the user downloaded by hand (host blocked auto-download).
const crakApplyLocal = callable("crak_apply_local");
const hvApplyLocal = callable("hv_apply_local");
const customClassify = callable("custom_classify");
const customImport = callable("custom_import");
const customListFixes = callable("custom_list_fixes");
callable("custom_list_manifests");
callable("custom_list_all_fixes");
const customListAllManifests = callable("custom_list_all_manifests");
const customApplyFix = callable("custom_apply_fix");
const customDeleteFixes = callable("custom_delete_fixes");
const customDeleteManifests = callable("custom_delete_manifests");
const getBackupCustom = callable("get_backup_custom");
const setBackupCustom = callable("set_backup_custom");
// CreamySteamy â€” compile a version-matched libsteam_api.so proxy for native-Linux games.
const creamyStatus = callable("creamy_status");
callable("creamy_have_toolchain");
const creamyEnsureToolchain = callable("creamy_ensure_toolchain");
const creamyDeploy = callable("creamy_deploy");
// SteamStub DRM removal (Steamless AIO).
const steamlessStatus = callable("steamless_status");
const steamlessUnstub = callable("steamless_unstub");
const buildHistoryList = callable("build_history_list");
const buildHistoryRollback = callable("build_history_rollback");
callable("build_history_clear");
// Manifest age (Hubcap usage dashboard already exists in Settings).
const manifestAge = callable("manifest_age");
const getAutoRepoint = callable("get_auto_repoint");
const setAutoRepoint = callable("set_auto_repoint");
// slsteam-moon live achievements (config.yaml Achievements). `moon` = engine supports it.
const getAchievements = callable("get_achievements");
const setAchievements = callable("set_achievements");
const getAutoUpdateApps = callable("get_auto_update_apps");
const setAutoUpdateApps = callable("set_auto_update_apps");
const getManifestDonation = callable("get_manifest_donation");
const setManifestDonation = callable("set_manifest_donation");
callable("pin_for_fix");
// Pin to a SPECIFIC lua.tools fix's build (its own manifest) â€” accurate per-fix.
const pinForLuatoolsFix = callable("pin_for_luatools_fix");
const luatoolsStatus = callable("luatools_status");
const luatoolsRedeem = callable("luatools_redeem");
const luatoolsOauthStart = callable("luatools_oauth_start");
const luatoolsOauthStatus = callable("luatools_oauth_status");
const luatoolsOauthCancel = callable("luatools_oauth_cancel");
const luatoolsSignout = callable("luatools_signout");
callable("luatools_list_fixes");
callable("luatools_list_all_fixes");
const applyLuatoolsFix = callable("apply_luatools_fix");
callable("pin_source");
const hubcapUsage = callable("hubcap_usage");
const hubcapWorkshopManifest = callable("hubcap_workshop_manifest");
const hubcapUpdatesStatus = callable("hubcap_updates_status");
const setHubcapUpdates = callable("set_hubcap_updates");
callable("get_wrapper_option");
callable("set_wrapper_option");
const setDlcOption = callable("set_dlc_option");
callable("get_gamebar_style");
callable("set_gamebar_style");
// floating buttons on game/store pages (off by default; sidebar is primary)
callable("get_floating_option");
callable("set_floating_option");
const getStoreDisabled = callable("get_store_disabled");
const setStoreDisabled = callable("set_store_disabled");
// SLSsteam management
const getSlssteamStatus = callable("get_slssteam_status");
const systemStatus = callable("system_status");
const disableForeignEngines = callable("disable_foreign_engines");
const installSlssteam = callable("install_slssteam");
const getSlssteamInstallStatus = callable("get_slssteam_install_status");
const reloadSteamBackend = callable("reload_steam");
const activateInjection = callable("activate_injection");
const deactivateInjection = callable("deactivate_injection");
const getDiagnostics = callable("get_diagnostics");
const runClientFix = callable("run_client_fix");
const clientFixNeeded = callable("client_fix_needed");
// SLSsteam config.yaml validator/healer. `analyze` writes nothing; `heal`
// repairs in place after backing the file up.
const slsConfigHealth = callable("sls_config_health");
const healSlsConfig = callable("heal_sls_config");
const crProviderStatus = callable("cr_provider_status");
const crInstallStatus = callable("cr_install_status");
const fixStuckUpdate = callable("fix_stuck_update");
const injectionHealth = callable("injection_health");
const refreshPatterns = callable("refresh_patterns");
const getAutoDownload = callable("get_auto_download");
const setAutoDownload = callable("set_auto_download");
const getReloadOnPurge = callable("get_reload_on_purge");
const setReloadOnPurge = callable("set_reload_on_purge");
// â”€â”€ DLC + cloud toggles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getAutoAddDlc = callable("get_auto_add_dlc");
const setAutoAddDlc = callable("set_auto_add_dlc");
const getDisableCloud = callable("get_disable_cloud");
const setDisableCloud = callable("set_disable_cloud");
const getDisableDlcUnlockOwned = callable("get_disable_dlc_unlock_owned");
const setDisableDlcUnlockOwned = callable("set_disable_dlc_unlock_owned");
callable("resolve_dlc");
const getCheckEngineUpdates = callable("get_check_engine_updates");
const setCheckEngineUpdates = callable("set_check_engine_updates");
const getCheckHeadcrabUpdates = callable("get_check_headcrab_updates");
const setCheckHeadcrabUpdates = callable("set_check_headcrab_updates");
const bpListBuilds = callable("bp_list_builds");
const bpListDepotManifests = callable("bp_list_depot_manifests");
callable("bp_list_depot_manifests_merged");
const bpApplyBuild = callable("bp_apply_build");
callable("bp_apply_manifests");
// â”€â”€ v2 DepotDownloader (older-build / content-DLC download) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const depotdlStatus = callable("depotdl_status");
callable("depotdl_download_build");
const depotdlDownloadBuildGids = callable("depotdl_download_build_gids");
const depotdlDownloadDlc = callable("depotdl_download_dlc");
const depotdlQueue = callable("depotdl_queue");
callable("ensure_all_dlc_keys");
const triggerSteamInstall = callable("trigger_steam_install");
const validateSteamApp = callable("validate_steam_app");
const popInjectionEvents = callable("pop_injection_events");
const getAutoReinject = callable("get_auto_reinject");
const setAutoReinject = callable("set_auto_reinject");
const getAutoClientRepin = callable("get_auto_client_repin");
const setAutoClientRepin = callable("set_auto_client_repin");
const getCheckDependenciesOnBoot = callable("get_check_dependencies_on_boot");
const setCheckDependenciesOnBoot = callable("set_check_dependencies_on_boot");
const checkFixes = callable("check_fixes");
callable("set_only_update_on_launch");
const getGameInstallPath = callable("get_game_install_path");
const appDownloadComplete = callable("app_download_complete");
const applyFix = callable("apply_fix");
const getFixStatus = callable("get_fix_status");
callable("cancel_fix");
const getInstalledFixes = callable("get_installed_fixes");
const unfix = callable("unfix");
const getUnfixStatus = callable("get_unfix_status");
// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatBytes(bytes) {
    if (!bytes || bytes <= 0)
        return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
const IN_PROGRESS = new Set([
    "queued",
    "checking",
    "downloading",
    "processing",
    "installing",
    "extracting",
    "removing",
]);
/**
 * Restart the Steam client. Prefers the in-process SteamClient API (reliable in
 * gamemode); falls back to the backend best-effort restart.
 */
async function reloadSteam() {
    try {
        const sc = window.SteamClient;
        if (sc?.User?.StartRestart) {
            sc.User.StartRestart(false);
            return;
        }
    }
    catch {
        /* fall through to backend */
    }
    try {
        await reloadSteamBackend();
    }
    catch {
        /* ignore */
    }
}
/** Detect the AppID of the game page currently shown in the library, if any. */
function currentLibraryAppId() {
    try {
        const href = window?.location?.href || "";
        const m = String(href).match(/\/library\/app\/(\d+)/);
        if (m)
            return parseInt(m[1], 10);
    }
    catch {
        /* ignore */
    }
    return null;
}
const hvStatus = callable("hv_status");
callable("hv_setup");
const hvBuild = callable("hv_build");
const hvBuildContainer = callable("hv_build_container");
const hvInstallDeps = callable("hv_install_deps");
const hvDownload = callable("hv_download");
callable("hv_load");
callable("hv_unload");
const hvLoadAuto = callable("hv_load_auto");
const hvUnloadAuto = callable("hv_unload_auto");
const hvTest = callable("hv_test");
const hvNativeNotice = callable("hv_native_notice");
const hvDismissNative = callable("hv_dismiss_native");
const hvUmipStart = callable("hv_umip_start");
const hvUmipStop = callable("hv_umip_stop");
const hvDisableUmip = callable("hv_disable_umip");
const hvRestoreUmip = callable("hv_restore_umip");
const hvReboot = callable("hv_reboot");
const hvLog = callable("hv_log");
const hvSetGame = callable("hv_set_game");
const hvSetWatcherMode = callable("hv_set_watcher_mode");
callable("hv_set_game_source");
callable("hv_set_source_dir");
callable("hv_set_source_zip");
const hvGetAutoload = callable("hv_get_autoload");
const hvSetAutoload = callable("hv_set_autoload");
const hvProtonStatus = callable("hv_proton_status");
const hvProtonInstallStatus = callable("hv_proton_install_status");
callable("hv_proton_get_url");
callable("hv_proton_set_url");
callable("hv_proton_locate");
const hvInstallProton = callable("hv_install_proton");
callable("hv_install_proton_auto");
const wsResolve = callable("ws_resolve");
const wsDownload = callable("ws_download");
const wsSearch = callable("ws_search");
const wsGetSteamKey = callable("ws_get_steam_key");
const wsSetSteamKey = callable("ws_set_steam_key");
const wsDownloadState = callable("ws_download_state");
const wsListMods = callable("ws_list_mods");
const wsListGames = callable("ws_list_games");
const wsSetEnabled = callable("ws_set_enabled");
const wsRemove = callable("ws_remove");
callable("ws_ensure_steamcmd");
// â”€â”€ Backup & restore (config, manifests, depot keys, luas, settings) â”€â”€â”€â”€â”€â”€â”€â”€â”€
const createBackup = callable("create_backup");
const restoreBackup = callable("restore_backup");
const listBackups = callable("list_backups");
const getFullPurgeOnUninstall = callable("get_full_purge_on_uninstall");
const setFullPurgeOnUninstall = callable("set_full_purge_on_uninstall");
// â”€â”€ Tools & per-game utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// These backends all existed and worked but had no frontend reference, so
// nothing could reach them. Declared here so the Tools/GameTools sections can.
const engineIsMoon = callable("engine_is_moon");
const ensureMoonEngine = callable("ensure_moon_engine");
const provisionDepots = callable("provision_depots");
callable("provision_and_restart");
const downloadPreflight = callable("download_preflight");
const downloadDiagnosis = callable("download_diagnosis");
const clearPhantomInstall = callable("clear_phantom_install");
const getStorageInfo = callable("get_storage_info");
const cleanTempDownloads = callable("clean_temp_downloads");
const syncAllAddedArt = callable("sync_all_added_art");
const runSystemAudit = callable("run_system_audit");
callable("run_full_system_maintenance");
const getUiSettings = callable("get_ui_settings");
const setUiSetting = callable("set_ui_setting");
const getNotifyGameAdd = callable("get_notify_game_add");
const setNotifyGameAdd = callable("set_notify_game_add");
// Per-game
const listInstalledProtonTools = callable("list_installed_proton_tools");
const getProtonMapping = callable("get_proton_mapping");
const setProtonMapping = callable("set_proton_mapping");
const removeProtonMapping = callable("remove_proton_mapping");
const backupGameSaves = callable("backup_game_saves");
const restoreGameSaves = callable("restore_game_saves");
const listGameSaveBackups = callable("list_game_save_backups");
const repairGame = callable("repair_game");
const patchGameOnlinefix = callable("patch_game_onlinefix");
const autoRepairSystem = callable("auto_repair_system");
const repairConflicts = callable("repair_conflicts");
const getNoInternetFix = callable("get_no_internet_fix");
const setNoInternetFix = callable("set_no_internet_fix");
const noInternetFixBegin = callable("no_internet_fix_begin");
const installLatestGeProton = callable("install_latest_ge_proton");
const checkMultiplayer = callable("check_multiplayer");

/**
 * Ownership detection for game pages.
 *
 * A game added through SLSsteam looks "owned" to Steam by design â€” that's the
 * whole point of the hook â€” so Steam's own ownership fields (owner_account_id,
 * licenses) can't tell the two apart. The only reliable discriminator is our own
 * record: if the backend has no lua / AdditionalApps entry for the AppID but
 * Steam has it in the library, the user genuinely owns it.
 */
/** True when Steam lists this AppID in the user's library collection. */
function isInLibrary(appid) {
    try {
        const cs = window.collectionStore;
        const apps = cs?.allAppsCollection?.apps;
        if (apps?.has)
            return !!apps.has(appid);
        if (apps?.get)
            return !!apps.get(appid);
    }
    catch {
        /* fall through */
    }
    try {
        const ov = window.appStore?.GetAppOverviewByAppID?.(appid);
        // Library entries carry install state / an owner; store-only pages usually don't.
        if (ov && (ov.installed === true || ov.owner_account_id))
            return true;
    }
    catch {
        /* ignore */
    }
    return false;
}
/** All appids in the user's library collection (owned + SLS-added). Used by the
 *  "disable DLC unlock on owned" toggle to hand the backend candidate appids. */
function listLibraryAppIds() {
    try {
        const cs = window.collectionStore;
        const apps = cs?.allAppsCollection?.apps;
        let ids = [];
        if (apps?.keys)
            ids = Array.from(apps.keys());
        else if (Array.isArray(apps))
            ids = apps.map((a) => a?.appid ?? a);
        return ids.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
    }
    catch {
        return [];
    }
}
/**
 * True when the plugin's controls should be hidden for this AppID:
 * the game is in the library but wasn't added by us.
 *
 * @param addedByUs result of hasLua(appid).exists
 * @param prefEnabled the user's "hide on owned games" setting
 */
function shouldHideForOwned(appid, addedByUs, prefEnabled) {
    if (!prefEnabled)
        return false;
    if (addedByUs)
        return false;
    return isInLibrary(appid);
}
/**
 * Non-Steam shortcuts get CRC32-derived ids far above the real AppID range.
 * They live in the library but can never be added through SLSsteam, and they
 * are not "legit" Steam titles either â€” they're their own category.
 */
function isNonSteamShortcut(appid) {
    const id = Number(appid);
    return !isNaN(id) && (id > 10000000 || id < -1e6);
}

const EMOJI_BADGE_STORAGE_KEY = "slsdeck.emojiBadges";
const EMOJI_BADGE_LABELS = {
    sls: "ðŸ´â€â˜ ï¸",
    legit: "ðŸ’µ",
    fixed: "ðŸ”§",
    tokeer: "ðŸ”‘",
    tokeercheck: "âš ï¸",
    onlinefix: "ðŸŒ",
    denuvo: "ðŸ‘º",
    nonsteam: "â“",
};
function getEmojiBadgesEnabled() {
    try {
        return window.localStorage.getItem(EMOJI_BADGE_STORAGE_KEY) === "1";
    }
    catch {
        return false;
    }
}
function setEmojiBadgesEnabled(enabled) {
    try {
        window.localStorage.setItem(EMOJI_BADGE_STORAGE_KEY, enabled ? "1" : "0");
        window.dispatchEvent(new CustomEvent("slsdeck-emoji-badges", { detail: enabled }));
    }
    catch {
        /* ignore */
    }
}
function badgeDisplayLabel(kind, fallback) {
    return getEmojiBadgesEnabled() ? (EMOJI_BADGE_LABELS[kind] || fallback) : fallback;
}

/**
 * Library capsule badges.
 *
 * Two independent badges, each toggleable in Advanced â–¸ Options:
 *   â€¢ SLS   â€” games registered through SLSsteam / lua (ours)
 *   â€¢ LEGIT â€” real Steam library titles that are neither ours nor non-Steam
 *             shortcuts (i.e. genuinely licensed)
 *
 * Steam renders the library grid in a separate gamepad-navigation window, so
 * badges are injected into that window's DOM (the same approach the
 * decky-nonsteam-badges plugin uses) rather than through a React patch.
 */
const BADGE_CLASS = "slsdeck-badge";
const STYLE_ID = "slsdeck-badge-style";
const POSITIONED_ATTR = "data-slsdeck-positioned";
const BADGE_STATE_EVENT = "slsdeck-badge-state-changed";
/** fixType strings vary by call site ("Online Fix", "online"â€¦). */
const ONLINE_RE = /online/i;
const BADGE_LABELS = {
    sls: "SLS",
    legit: "LEGIT",
    denuvo: "DENUVO",
    onlinefix: "ONLINE FIX",
    fixed: "FIXED",
    tokeer: "TOKEER KEY",
    tokeercheck: "TOKEER CHECK",
    nonsteam: "NON-STEAM",
    nonsteamname: "", // dynamic â€” filled per-app from the shortcut's exe folder
};
const BADGE_COLORS = {
    sls: "linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%)",
    legit: "linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%)",
    denuvo: "linear-gradient(135deg, #a12a2a 0%, #e05252 100%)",
    onlinefix: "linear-gradient(135deg, #7b5fd0 0%, #caa8ff 100%)",
    fixed: "linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%)",
    tokeer: "linear-gradient(135deg, #9b6b16 0%, #d7a52b 100%)",
    tokeercheck: "linear-gradient(135deg, #8b4d16 0%, #d97706 100%)",
    nonsteam: "#000000",
    nonsteamname: "linear-gradient(135deg, #3a3f4b 0%, #555b68 100%)",
};
let observer = null;
let scanTimer = null;
let retryTimer = null;
let rafHandle = null;
let cachedWindow = null;
let slsIds = new Set();
let slsLoaded = false;
let everAddedIds = new Set();
let denuvoIds = new Set();
let onlineIds = new Set();
let fixedIds = new Set();
let tokeerIds = new Set();
let tokeerCheckIds = new Set();
const pendingSlsIds = new Set();
const pendingSlsTimers = new Map();
let opts = {
    sls: true, legit: true, denuvo: true, onlineFix: true, fixed: true, tokeer: true,
    nonSteam: true, nonSteamName: true, library: true,
};
let nonSteamNames = new Map();
const pendingDenuvo = new Set();
let denuvoFlushTimer = null;
let refreshTimer = null;
function getLibraryWindow() {
    if (cachedWindow && !cachedWindow.closed)
        return cachedWindow;
    try {
        const DFL = window.DFL;
        if (!DFL?.getGamepadNavigationTrees)
            return null;
        for (const tree of DFL.getGamepadNavigationTrees()) {
            try {
                const doc = tree?.m_window?.document;
                if (!doc)
                    continue;
                const n = doc.querySelectorAll('div[role="gridcell"]').length +
                    doc.querySelectorAll('div[role="listitem"]').length;
                if (n > 0) {
                    cachedWindow = tree.m_window;
                    return cachedWindow;
                }
            }
            catch {
                continue;
            }
        }
    }
    catch {
        /* ignore */
    }
    return null;
}
function injectStyle(win) {
    try {
        if (win.document.getElementById(STYLE_ID))
            return;
        const el = win.document.createElement("style");
        el.id = STYLE_ID;
        el.textContent = `
.${BADGE_CLASS}-box {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.${BADGE_CLASS} {
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
.${BADGE_CLASS}[data-kind="sls"] { background: linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%); }
.${BADGE_CLASS}[data-kind="legit"] { background: linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%); }
.${BADGE_CLASS}[data-kind="denuvo"] { background: linear-gradient(135deg, #a12a2a 0%, #e05252 100%); }
.${BADGE_CLASS}[data-kind="onlinefix"] { background: linear-gradient(135deg, #7b5fd0 0%, #caa8ff 100%); }
.${BADGE_CLASS}[data-kind="fixed"] { background: linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%); }
.${BADGE_CLASS}[data-kind="tokeer"] { background: linear-gradient(135deg, #9b6b16 0%, #d7a52b 100%); }
`;
        win.document.head.appendChild(el);
    }
    catch {
        /* ignore */
    }
}
function appIdFromImage(img) {
    if (!img?.src)
        return null;
    let m = img.src.match(/\/assets\/(\d+)\//);
    if (m)
        return m[1];
    m = img.src.match(/\/customimages\/(\d+)p?\.(jpg|jpeg|png|webp)/i);
    if (m)
        return m[1];
    m = img.src.match(/rungameid\/(\d+)/i);
    if (m)
        return m[1];
    m = img.src.match(/\/(\d{6,})([p._-]?[a-z]*\.(jpg|png|webp))?/i);
    if (m)
        return m[1];
    return null;
}
function getAppId(capsule) {
    const dataId = capsule.getAttribute("data-id");
    if (dataId && !dataId.startsWith("placeholder"))
        return dataId;
    const fromImg = appIdFromImage(capsule.querySelector("img"));
    if (fromImg)
        return fromImg;
    try {
        const anchor = capsule.tagName.toLowerCase() === "a" ? capsule : capsule.querySelector("a");
        const href = anchor?.getAttribute("href");
        if (href) {
            const m = href.match(/\/app\/(\d+)/i) || href.match(/\/details\/(\d+)/i) || href.match(/run\/(\d+)/i);
            if (m)
                return m[1];
        }
    }
    catch { /* ignore */ }
    try {
        for (const el of [capsule, ...Array.from(capsule.children)]) {
            const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
            if (!key)
                continue;
            let fiber = el[key];
            let depth = 0;
            while (fiber && depth < 5) {
                const p = fiber.memoizedProps || fiber.return?.memoizedProps;
                const id = p?.appid ?? p?.appId ?? p?.nAppID ?? p?.unAppID ?? p?.overview?.appid ?? p?.appOverview?.appid ?? p?.app?.appid ?? p?.item?.appid;
                if (id)
                    return String(id);
                fiber = fiber.return;
                depth++;
            }
        }
    }
    catch { /* ignore */ }
    return null;
}
function classifyNonSteam(appid) {
    if (!isNonSteamShortcut(appid))
        return [];
    const out = [];
    if (opts.nonSteam)
        out.push("nonsteam");
    if (opts.nonSteamName && (nonSteamNames.get(appid) || "").trim())
        out.push("nonsteamname");
    return out;
}
function classifyPrimary(appid) {
    if (pendingSlsIds.has(appid) && !slsIds.has(appid))
        return null;
    if (slsIds.has(appid))
        return opts.sls ? "sls" : null;
    if (isNonSteamShortcut(appid))
        return null;
    if (!isInLibrary(appid))
        return null;
    if (!slsLoaded)
        return null;
    if (everAddedIds.has(appid))
        return null;
    if (onlineIds.has(appid) || fixedIds.has(appid))
        return null;
    return opts.legit ? "legit" : null;
}
/** Suppress primary classification while an SLS add is unresolved. Steam may
 * create the library capsule before our managed-games cache confirms whether
 * it is SLS-managed; showing no badge is safer than briefly claiming LEGIT. */
function markSlsAddPending(appid, pending = true) {
    const id = Number(appid);
    if (!Number.isFinite(id) || id <= 0)
        return;
    const old = pendingSlsTimers.get(id);
    if (old)
        clearTimeout(old);
    pendingSlsTimers.delete(id);
    if (pending) {
        pendingSlsIds.add(id);
        pendingSlsTimers.set(id, setTimeout(() => {
            pendingSlsIds.delete(id);
            pendingSlsTimers.delete(id);
            debouncedScan();
        }, 30 * 60 * 1000));
    }
    else {
        pendingSlsIds.delete(id);
    }
    debouncedScan();
    try {
        window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT));
    }
    catch { /* ignore */ }
}
/** Immediately retire purged registrations from the live badge cache while
 * retaining their SLS provenance. Steam can keep old capsules around until its
 * next restart; those must show no badge, never flicker SLS and settle on LEGIT. */
function markSlsPurged(appids) {
    for (const raw of appids || []) {
        const id = Number(raw);
        if (!Number.isFinite(id) || id <= 0)
            continue;
        slsIds.delete(id);
        everAddedIds.add(id);
        pendingSlsIds.delete(id);
        const timer = pendingSlsTimers.get(id);
        if (timer)
            clearTimeout(timer);
        pendingSlsTimers.delete(id);
    }
    removeAllBadges();
    debouncedScan();
    try {
        window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT));
    }
    catch { /* ignore */ }
}
function classifyApplied(appid) {
    const out = [];
    if (opts.onlineFix && onlineIds.has(appid))
        out.push("onlinefix");
    if (opts.fixed && fixedIds.has(appid))
        out.push("fixed");
    if (opts.tokeer && tokeerIds.has(appid))
        out.push("tokeer");
    if (opts.tokeer && tokeerCheckIds.has(appid))
        out.push("tokeercheck");
    return out;
}
function classifyDenuvo(appid) {
    if (!opts.denuvo)
        return false;
    if (isNonSteamShortcut(appid))
        return false;
    if (denuvoIds.has(appid))
        return true;
    if (!pendingDenuvo.has(appid)) {
        pendingDenuvo.add(appid);
        scheduleDenuvoFlush();
    }
    return false;
}
function scheduleDenuvoFlush() {
    if (denuvoFlushTimer)
        return;
    denuvoFlushTimer = setTimeout(async () => {
        denuvoFlushTimer = null;
        const batch = Array.from(pendingDenuvo).slice(0, 40);
        if (!batch.length)
            return;
        batch.forEach((a) => pendingDenuvo.delete(a));
        try {
            const r = await denuvoResolve(batch);
            if (r.success)
                denuvoIds = new Set(r.denuvo || []);
        }
        catch { /* ignore */ }
    }, 1200);
}
function badgeCapsule(capsule, win) {
    const raw = getAppId(capsule);
    const box = capsule.querySelector(`.${BADGE_CLASS}-box`);
    const existing = Array.from(capsule.querySelectorAll(`.${BADGE_CLASS}`));
    if (!raw) {
        box?.remove();
        existing.forEach((b) => b.remove());
        return;
    }
    const appid = Number(raw);
    const primary = classifyPrimary(appid);
    const denuvo = classifyDenuvo(appid);
    const wanted = [];
    if (primary)
        wanted.push(primary);
    if (denuvo)
        wanted.push("denuvo");
    wanted.push(...classifyApplied(appid));
    wanted.push(...classifyNonSteam(appid));
    if (!wanted.length) {
        box?.remove();
        existing.forEach((b) => b.remove());
        return;
    }
    const emojiMode = getEmojiBadgesEnabled();
    const mode = emojiMode ? "emoji" : "text";
    const current = existing
        .filter((b) => b.getAttribute("data-appid") === String(appid))
        .map((b) => b.getAttribute("data-kind"));
    const currentMode = existing.every((b) => b.getAttribute("data-mode") === mode);
    if (current.length === wanted.length && wanted.every((k) => current.includes(k)) && currentMode)
        return;
    box?.remove();
    existing.forEach((b) => b.remove());
    const img = capsule.querySelector("img");
    const role = capsule.getAttribute("role");
    let target = null;
    if (role === "gridcell") {
        // Keep badges out of Steam's overflow-clipped image layer. This is the
        // working anchor for the normal Library grid.
        target = img ? capsule.querySelector("div") : capsule;
    }
    else if (role === "listitem") {
        // Steam Home uses a dedicated artwork wrapper. decky-nonsteam-badges uses
        // this same partial class match because the generic nearest div can be
        // Steam's native status/action overlay, while the whole listitem can clip
        // overlays outside the artwork box.
        target = img
            ? (img.closest('div[class*="_1pwP4"]') ?? capsule)
            : capsule;
    }
    if (!target)
        target = capsule;
    if (!target.hasAttribute(POSITIONED_ATTR)) {
        try {
            if (win.getComputedStyle(target).position === "static")
                target.style.position = "relative";
        }
        catch { /* ignore */ }
        target.setAttribute(POSITIONED_ATTR, "true");
    }
    const container = win.document.createElement("div");
    container.className = `${BADGE_CLASS}-box`;
    container.style.cssText =
        (emojiMode
            ? "position:absolute;top:6px;left:6px;z-index:9999;pointer-events:none;width:max-content;max-width:calc(100% - 12px);background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;"
            : "position:absolute;top:4px;left:4px;right:4px;z-index:9999;pointer-events:none;") +
            `display:flex;flex-wrap:wrap;gap:${emojiMode ? 7 : 3}px;align-items:center;`;
    for (const kind of wanted) {
        const badge = win.document.createElement("div");
        badge.className = BADGE_CLASS;
        badge.setAttribute("data-appid", String(appid));
        badge.setAttribute("data-kind", kind);
        badge.setAttribute("data-mode", mode);
        const normal = kind === "nonsteamname" ? (nonSteamNames.get(appid) || "APP") : BADGE_LABELS[kind];
        badge.textContent = kind === "nonsteamname" ? normal : badgeDisplayLabel(kind, normal);
        const standaloneEmoji = emojiMode && kind !== "nonsteamname";
        badge.style.cssText = standaloneEmoji
            ? "flex:0 0 auto;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;" +
                "box-sizing:border-box;width:auto;height:auto;max-width:none;min-width:0;" +
                "padding:0;margin:0;border:0;border-radius:0;font-size:24px;line-height:27px;" +
                "font-family:'Noto Color Emoji','Segoe UI Emoji','Apple Color Emoji',sans-serif;font-weight:400;letter-spacing:0;" +
                "color:inherit;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;" +
                "text-shadow:0 1px 3px rgba(0,0,0,0.75);overflow:visible;"
            : "flex:0 0 auto;white-space:nowrap;display:inline-block;overflow:visible;" +
                "box-sizing:border-box;width:auto;height:auto;max-width:none;min-width:0;" +
                "padding:2px 7px;border-radius:4px;font-size:11px;line-height:16px;" +
                "font-family:'Motiva Sans',Arial,sans-serif;font-weight:700;letter-spacing:0.4px;" +
                "color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.6);box-shadow:0 1px 4px rgba(0,0,0,0.4);" +
                "background:" + (BADGE_COLORS[kind] || "#555") + ";";
        container.appendChild(badge);
    }
    target.appendChild(container);
}
function scan() {
    const win = getLibraryWindow();
    if (!win)
        return;
    injectStyle(win);
    const selectors = [
        'div[role="tabpanel"] div[role="gridcell"]',
        '.ReactVirtualized__Grid__innerScrollContainer div[role="listitem"]',
    ];
    for (const sel of selectors) {
        win.document.querySelectorAll(sel).forEach((capsule) => {
            if (!capsule.querySelector('div[role="link"]'))
                return;
            if (capsule.firstElementChild?.getAttribute("role") === "link")
                return;
            badgeCapsule(capsule, win);
        });
    }
}
function debouncedScan() {
    if (rafHandle != null)
        return;
    rafHandle = requestAnimationFrame(() => {
        rafHandle = null;
        scan();
    });
}
async function refreshData() {
    const previousOnline = Array.from(onlineIds).sort((a, b) => a - b).join(",");
    const previousFixed = Array.from(fixedIds).sort((a, b) => a - b).join(",");
    const previousTokeer = Array.from(tokeerIds).sort((a, b) => a - b).join(",");
    const previousTokeerCheck = Array.from(tokeerCheckIds).sort((a, b) => a - b).join(",");
    try {
        const r = await getBadgeOptions();
        if (r.success) {
            opts = {
                sls: !!r.sls,
                legit: !!r.legit,
                denuvo: !!r.denuvo,
                onlineFix: !!r.onlineFix,
                fixed: !!r.fixed,
                tokeer: !!r.tokeer,
                nonSteam: !!r.nonSteam,
                nonSteamName: !!r.nonSteamName,
                library: !!r.library,
            };
        }
    }
    catch { /* keep previous */ }
    try {
        if (opts.nonSteamName) {
            const r = await getNonSteamApps();
            if (r.success) {
                const m = new Map();
                for (const [id, name] of Object.entries(r.apps || {})) {
                    const n = Number(id);
                    if (!Number.isNaN(n) && name)
                        m.set(n, String(name));
                }
                nonSteamNames = m;
            }
        }
    }
    catch { /* keep previous names */ }
    try {
        const r = await getInstalledApps();
        if (r.success) {
            slsIds = new Set((r.apps || []).map((a) => Number(a.appid)));
            // An SLSsteam/Lua registration is the authoritative end of the badge hold. This
            // makes the capsule go directly from no badge to SLS, never via LEGIT.
            for (const id of slsIds) {
                if (!pendingSlsIds.delete(id))
                    continue;
                const timer = pendingSlsTimers.get(id);
                if (timer)
                    clearTimeout(timer);
                pendingSlsTimers.delete(id);
            }
            slsLoaded = true;
        }
    }
    catch { /* keep previous set */ }
    try {
        const r = await getEverAdded();
        if (r.success)
            everAddedIds = new Set((r.appids || []).map((a) => Number(a)));
    }
    catch { /* keep previous */ }
    try {
        const r = await denuvoKnown();
        if (r.success)
            denuvoIds = new Set(r.denuvo || []);
    }
    catch { /* keep previous */ }
    try {
        const r = await getInstalledFixes();
        if (r.success) {
            const perApp = new Map();
            for (const f of r.fixes || []) {
                const id = Number(f.appid);
                (perApp.get(id) ?? perApp.set(id, []).get(id)).push(String(f.fixType || ""));
            }
            const on = new Set();
            const fx = new Set();
            for (const [id, types] of perApp) {
                if (types.some((t) => ONLINE_RE.test(t)))
                    on.add(id);
                else
                    fx.add(id);
            }
            onlineIds = on;
            fixedIds = fx;
            const nextOnline = Array.from(onlineIds).sort((a, b) => a - b).join(",");
            const nextFixed = Array.from(fixedIds).sort((a, b) => a - b).join(",");
            if (nextOnline !== previousOnline || nextFixed !== previousFixed) {
                try {
                    window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT));
                }
                catch { /* ignore */ }
            }
        }
    }
    catch { /* keep previous */ }
    try {
        const r = await tokeerAppliedStatus();
        if (r.success) {
            tokeerIds = new Set((r.records || [])
                .filter((record) => record.health === "valid" && record.pinned && record.pinMatchesActivation)
                .map((record) => Number(record.appid)));
            tokeerCheckIds = new Set((r.records || [])
                .filter((record) => record.health === "check" && record.pinned && record.pinMatchesActivation)
                .map((record) => Number(record.appid)));
            const nextTokeer = Array.from(tokeerIds).sort((a, b) => a - b).join(",");
            const nextTokeerCheck = Array.from(tokeerCheckIds).sort((a, b) => a - b).join(",");
            if (nextTokeer !== previousTokeer || nextTokeerCheck !== previousTokeerCheck) {
                try {
                    window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT));
                }
                catch { /* ignore */ }
            }
        }
    }
    catch { /* keep previous */ }
}
function removeAllBadges() {
    const win = getLibraryWindow();
    if (!win)
        return;
    try {
        win.document.querySelectorAll(`.${BADGE_CLASS}`).forEach((b) => b.remove());
        win.document.querySelectorAll(`.${BADGE_CLASS}-box`).forEach((b) => b.remove());
    }
    catch { /* ignore */ }
}
async function startBadges() {
    stopBadges();
    await refreshData();
    if (!opts.library) {
        removeAllBadges();
        return;
    }
    if (!opts.sls && !opts.legit && !opts.denuvo && !opts.onlineFix && !opts.fixed && !opts.tokeer && !opts.nonSteam)
        return;
    const win = getLibraryWindow();
    if (!win) {
        retryTimer = setTimeout(() => {
            retryTimer = null;
            startBadges();
        }, 1500);
        return;
    }
    scan();
    observer = new MutationObserver((muts) => {
        if (muts.some((m) => m.addedNodes.length > 0))
            debouncedScan();
    });
    win.document
        .querySelectorAll('div[role="tabpanel"], div[class*="Panel"]')
        .forEach((c) => observer?.observe(c, { childList: true, subtree: true }));
    scanTimer = setInterval(scan, 2000);
    refreshTimer = setInterval(refreshData, 20000);
}
function stopBadges() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = null;
    }
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
    if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
    }
    if (rafHandle != null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
    }
}
async function refreshBadges() {
    removeAllBadges();
    await startBadges();
    try {
        window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT));
    }
    catch { /* ignore */ }
}

// After a fix is applied, set a WINEDLLOVERRIDES launch option so Proton loads
// the fix's native DLLs â€” but ONLY if the game already has a Proton compat tool
// enabled. On native Linux (no compat layer) the fix's Windows DLLs do nothing,
// so an override is pointless and we skip it. We never force a compat tool.
const configured = new Set();
// Launch-target repoint: some fixes ship a replacement executable (e.g. a
// cracked *-Shipping.exe) but Steam still launches the game's original launcher
// exe, which can error (vcredist) or never load the crack. We rewrite the exe
// inside %command% to the fix's exe with a bash wrapper, keeping the app's own
// Proton prefix + env. Marked so we can find/remove it later.
const REPOINT_MARK = "SLSDECKREPOINT";
const REPOINT_RE = /\s*bash -c '[^']*SLSDECKREPOINT[^']*' _ %command%/;
function repointWrapper(exePath) {
    // Double-quoted JS string so ${...} stays literal bash. Replaces any *.exe
    // argument in the expanded %command% with the fix's exe, then execs.
    return ("bash -c 'a=(\"$@\"); for i in \"${!a[@]}\"; do " +
        "[ \"${a[$i]: -4}\" = \".exe\" ] && a[$i]=\"" + exePath + "\"; done; " +
        REPOINT_MARK + "= exec \"${a[@]}\"' _ %command%");
}
/** Repoint (exePath) or clear (null) the game's Steam launch target, preserving
 *  any env prefixes already present (WINEDLLOVERRIDES, LD_AUDIT, â€¦). */
function setLaunchRepoint(appid, exePath) {
    const SC = window.SteamClient;
    if (!SC?.Apps?.SetAppLaunchOptions)
        return false;
    try {
        let stripped = (currentLaunchOptions(appid) || "")
            .replace(REPOINT_RE, " %command%")
            .replace(/\s+/g, " ")
            .trim();
        if (!exePath) {
            if (stripped === "%command%")
                stripped = "";
            SC.Apps.SetAppLaunchOptions(appid, stripped);
            return true;
        }
        if (!stripped.includes("%command%")) {
            stripped = stripped ? `${stripped} %command%` : "%command%";
        }
        const next = stripped.replace("%command%", repointWrapper(exePath)).replace(/\s+/g, " ").trim();
        SC.Apps.SetAppLaunchOptions(appid, next);
        return true;
    }
    catch {
        return false;
    }
}
/** True if this game's launch options currently carry our repoint wrapper. */
function hasLaunchRepoint(appid) {
    return (currentLaunchOptions(appid) || "").includes(REPOINT_MARK);
}
/** Ensure the game runs under Proton so a repointed Windows exe can launch.
 *  Prefers Proton Experimental, else the newest GE-Proton, else any Proton. Does
 *  NOT override a Proton the game is already set to (won't stomp a GE choice).
 *  Returns the tool name it selected, or "" if left as-is / none available. */
async function ensureProtonSelected(appid) {
    const SC = window.SteamClient;
    if (!SC?.Apps?.SpecifyCompatTool)
        return "";
    const cur = String(appDetails(appid)?.strCompatToolName || "").toLowerCase();
    if (cur && cur.includes("proton") && !cur.includes("steamlinuxruntime"))
        return cur;
    let tools = [];
    try {
        const res = SC.Apps.GetAvailableCompatTools?.(appid);
        tools = res && typeof res.then === "function" ? await res : res || [];
    }
    catch {
        tools = [];
    }
    const list = (tools || [])
        .map((t) => ({
        name: String(t.strToolName || t.strToolIdentifier || t.strDisplayName || ""),
        disp: String(t.strDisplayName || t.strToolName || ""),
    }))
        .filter((x) => x.name);
    const isProton = (x) => /proton/i.test(x.name) || /proton/i.test(x.disp);
    const bySemver = (a, b) => b.name.localeCompare(a.name, undefined, { numeric: true });
    const pick = list.find((x) => x.name.toLowerCase() === "proton_experimental" || /experimental/i.test(x.disp)) ||
        list.filter((x) => /ge-?proton/i.test(x.name) || /ge-?proton/i.test(x.disp)).sort(bySemver)[0] ||
        list.filter(isProton).sort(bySemver)[0];
    const chosen = pick?.name || (list.length === 0 ? "proton_experimental" : "");
    if (chosen) {
        try {
            SC.Apps.SpecifyCompatTool(appid, chosen);
            return chosen;
        }
        catch {
            /* ignore */
        }
    }
    return "";
}
/** Auto-repoint after a fix â€” ONLY when the fix itself shipped a replacement exe
 *  (backend sets state.repointExe). Gated behind the auto-repoint setting.
 *  Runs after a short settle so it reads the launch string AFTER any
 *  WINEDLLOVERRIDES write, then preserves it (additive). */
async function autoRepointFromState(appid, st) {
    try {
        const exe = st && typeof st.repointExe === "string" ? st.repointExe : "";
        if (!exe)
            return; // fix shipped no exe -> nothing to repoint
        if (!(await getAutoRepoint()).enabled)
            return;
        await ensureProtonSelected(appid);
        await new Promise((r) => setTimeout(r, 250));
        setLaunchRepoint(appid, exe);
    }
    catch {
        /* ignore */
    }
}
function mergeLaunchOptions(current, overrides) {
    const existing = [];
    let rest = (current || "").replace(/WINEDLLOVERRIDES=(?:"([^"]*)"|'([^']*)'|([^\s]+))\s*/gi, (_all, dq, sq, bare) => {
        String(dq ?? sq ?? bare ?? "").split(";").map((x) => x.trim()).filter(Boolean).forEach((x) => existing.push(x));
        return "";
    }).replace(/\s+/g, " ").trim();
    const incoming = [];
    let extra = (overrides || "").replace(/WINEDLLOVERRIDES=(?:"([^"]*)"|'([^']*)'|([^\s]+))\s*/gi, (_all, dq, sq, bare) => {
        String(dq ?? sq ?? bare ?? "").split(";").map((x) => x.trim()).filter(Boolean).forEach((x) => incoming.push(x));
        return "";
    }).replace(/\s+/g, " ").trim();
    if (!overrides)
        return current || "";
    if (!incoming.length) {
        // Older backend responses sometimes already contain a complete env prefix.
        if (rest === "")
            return `${overrides} %command%`;
        return rest.includes("%command%")
            ? rest.replace("%command%", `${overrides} %command%`).replace(/\s+/g, " ").trim()
            : `${overrides} ${rest} %command%`;
    }
    const all = [...existing, ...incoming];
    if (/\/\.tokeer\/ost-run\.sh/.test(current || "")) {
        for (let i = all.length - 1; i >= 0; i--) {
            if (/^dinput8\s*=/i.test(all[i]))
                all.splice(i, 1);
        }
        all.push("dinput8=n,b");
    }
    const merged = all.filter((entry, i, values) => {
        const key = entry.split("=")[0].trim().toLowerCase();
        return values.map((x) => x.split("=")[0].trim().toLowerCase()).lastIndexOf(key) === i;
    });
    const prefix = `WINEDLLOVERRIDES="${merged.join(";")}"`;
    if (extra)
        rest = `${extra} ${rest}`.trim();
    if (rest === "")
        return `${prefix} %command%`;
    return rest.includes("%command%")
        ? rest.replace("%command%", `${prefix} %command%`).replace(/\s+/g, " ").trim()
        : `${prefix} ${rest} %command%`;
}
function appDetails(appid) {
    try {
        return window.appDetailsStore?.GetAppDetails?.(appid) || null;
    }
    catch {
        return null;
    }
}
function currentLaunchOptions(appid) {
    const d = appDetails(appid);
    return d && typeof d.strLaunchOptions === "string" ? d.strLaunchOptions : "";
}
/** Read Steam's current live value, falling back to the app-details cache on
 * client builds that do not expose GetLaunchOptionsForApp. */
function getCurrentLaunchOptions(appid) {
    try {
        const live = window.SteamClient?.Apps?.GetLaunchOptionsForApp?.(appid);
        if (typeof live === "string")
            return live;
    }
    catch { /* use the app-details cache below */ }
    return currentLaunchOptions(appid);
}
/** True only when the game has a Proton compatibility tool enabled (not a
 *  native Linux runtime shim, not empty). */
function hasProtonLayer(appid) {
    const d = appDetails(appid);
    const name = String((d && (d.strCompatToolName || d.strCompatToolDisplayName)) || "").toLowerCase();
    if (!name)
        return false;
    if (name.includes("steamlinuxruntime"))
        return false;
    return name.includes("proton");
}
/**
 * Set the fix's WINEDLLOVERRIDES launch option â€” only if a Proton layer is
 * enabled for this game and the fix actually shipped overridable DLLs. Runs at
 * most once per apply (reset via resetFixRuntime on a new apply). No compat tool
 * is ever forced.
 */
async function applyFixRuntime(appid, overrides) {
    if (!appid || configured.has(appid))
        return;
    if (!overrides)
        return; // no DLLs to override
    if (!hasProtonLayer(appid))
        return; // native / no compat layer -> nothing to do
    configured.add(appid);
    const SC = window.SteamClient;
    try {
        const merged = mergeLaunchOptions(currentLaunchOptions(appid), overrides);
        if (SC?.Apps?.SetAppLaunchOptions) {
            SC.Apps.SetAppLaunchOptions(appid, merged);
        }
    }
    catch {
        /* ignore */
    }
}
async function configureTokeerLaunch(appid, tokeerHome, requiredProton = "GE-Proton10-34") {
    const SC = window.SteamClient;
    if (!SC?.Apps?.SetAppLaunchOptions || !SC?.Apps?.SpecifyCompatTool) {
        return { success: false, error: "Steam's live app-configuration API is unavailable." };
    }
    try {
        let rest = currentLaunchOptions(appid) || "%command%";
        const overrides = [];
        rest = rest.replace(/WINEDLLOVERRIDES=(?:"([^"]*)"|'([^']*)'|([^\s]+))\s*/gi, (_all, dq, sq, bare) => {
            const value = String(dq ?? sq ?? bare ?? "");
            value.split(";").map((x) => x.trim()).filter(Boolean).forEach((x) => overrides.push(x));
            return "";
        });
        // Remove only an existing Tokeer wrapper. Other wrappers (SLSDECKREPOINT,
        // LD_AUDIT/netsock, user commands) remain in the command.
        const wrapper = `${tokeerHome.replace(/\/$/, "")}/ost-run.sh`;
        const escaped = wrapper.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        rest = rest
            .replace(new RegExp(`(?:'${escaped}'|"${escaped}"|${escaped})\\s*`, "g"), "")
            .replace(/\s+/g, " ")
            .trim();
        if (!rest)
            rest = "%command%";
        if (!rest.includes("%command%"))
            rest = `${rest} %command%`;
        const merged = overrides
            .filter((entry) => !/^dinput8\s*=/i.test(entry))
            .concat("dinput8=n,b");
        const deduped = merged.filter((entry, i, all) => {
            const key = entry.split("=")[0].trim().toLowerCase();
            return all.findIndex((x) => x.split("=")[0].trim().toLowerCase() === key) === i;
        });
        const quotedWrapper = `'${wrapper.replace(/'/g, "'\\''")}'`;
        const next = `WINEDLLOVERRIDES="${deduped.join(";")}" ${quotedWrapper} ${rest}`
            .replace(/\s+/g, " ")
            .trim();
        // A compatibility tool installed while Steam is running is present on disk
        // before it appears in Steam's live tool registry.  Passing its undiscovered
        // name to SpecifyCompatTool is silently ignored on affected client builds.
        // Prefer Tokeer's exact GE build when Steam exposes it; otherwise select the
        // built-in Proton Experimental so activation never proceeds with no layer.
        let tools = [];
        try {
            const available = SC.Apps.GetAvailableCompatTools?.(appid);
            tools = (available && typeof available.then === "function"
                ? await available
                : available) || [];
        }
        catch {
            tools = [];
        }
        const names = tools.map((tool) => ({
            id: String(tool.strToolName || tool.strToolIdentifier || ""),
            display: String(tool.strDisplayName || ""),
        }));
        const required = requiredProton.toLowerCase();
        const discovered = names.find((tool) => tool.id.toLowerCase() === required || tool.display.toLowerCase() === required);
        const selectedProton = discovered?.id || "proton_experimental";
        const usedFallback = !discovered;
        SC.Apps.SpecifyCompatTool(appid, selectedProton);
        SC.Apps.SetAppLaunchOptions(appid, next);
        return { success: true, options: next, proton: selectedProton, usedFallback };
    }
    catch (e) {
        return { success: false, error: String(e) };
    }
}
/** Allow re-running when the user applies a fix to the same game again. */
function resetFixRuntime(appid) {
    configured.delete(appid);
}
/** Un-fix cleanup: strip the fix's launch-option additions â€” the repoint wrapper
 *  AND the WINEDLLOVERRIDES the fix added â€” in a single write, preserving
 *  everything else (netsock LD_AUDIT, user flags, %command%). */
function clearFixLaunchOptions(appid) {
    const SC = window.SteamClient;
    if (!SC?.Apps?.SetAppLaunchOptions)
        return;
    try {
        const before = currentLaunchOptions(appid) || "";
        const keepTokeer = /\/\.tokeer\/ost-run\.sh/.test(before);
        let opts = before
            .replace(REPOINT_RE, " %command%")
            .replace(/WINEDLLOVERRIDES=".*?"\s*/g, "")
            .replace(/WINEDLLOVERRIDES=[^\s]+\s*/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (keepTokeer)
            opts = `WINEDLLOVERRIDES="dinput8=n,b" ${opts || "%command%"}`;
        else if (opts === "%command%")
            opts = "";
        SC.Apps.SetAppLaunchOptions(appid, opts);
    }
    catch {
        /* ignore */
    }
    configured.delete(appid);
}
/** The exact Steam display name for an app, used for the perondepot name match. */
function appDisplayName(appid) {
    try {
        const store = window.appStore;
        return (store?.GetAppOverviewByGameID?.(appid)?.display_name ||
            store?.GetAppOverviewByAppID?.(appid)?.display_name ||
            "");
    }
    catch {
        return "";
    }
}
/**
 * Add or remove the netsock LD_AUDIT prefix in a game's launch options,
 * preserving whatever else is already there (WINEDLLOVERRIDES, %command%, â€¦).
 */
function setNetsockLaunchOption(appid, enabled, ldAudit) {
    const SC = window.SteamClient;
    if (!SC?.Apps?.SetAppLaunchOptions)
        return false;
    try {
        let rest = (currentLaunchOptions(appid) || "")
            .replace(/LD_AUDIT=(".*?"|[^\s]+)\s*/g, "")
            .replace(/\s+/g, " ")
            .trim();
        let next;
        if (enabled) {
            if (rest === "")
                next = `${ldAudit} %command%`;
            else if (rest.includes("%command%"))
                next = `${ldAudit} ${rest}`.replace(/\s+/g, " ").trim();
            else
                next = `${ldAudit} ${rest} %command%`;
        }
        else {
            next = rest;
            if (next === "%command%")
                next = "";
        }
        SC.Apps.SetAppLaunchOptions(appid, next);
        return true;
    }
    catch {
        return false;
    }
}

// Online fixes come only from the perondepot mirror (resolved by the backend,
// matched by game name). The rate-limited luatools catalog index has been
// removed, so this is just a thin wrapper that passes the Steam display name to
// the backend for the perondepot name match.
async function checkFixesFull(appid) {
    return checkFixes(appid, appDisplayName(appid));
}

// Build-accurate apply orchestration.
//
// For a fix whose exact build is known (a manifest resolvable via lua.tools /
// Hubcap / ~/Downloads), the correct order is: pin the manifest to that build â†’
// let Steam update the game to it â†’ apply the fix onto the matching build.
//
// Pin the fix's build, let Steam reconcile the installed depots with Moon's
// pinned target, and apply the fix only after the on-disk depot GIDs match.
async function installed(appid) {
    try {
        const p = await getGameInstallPath(appid);
        return !!(p.success && p.installPath);
    }
    catch {
        return false;
    }
}
async function isDownloadComplete(appid) {
    try {
        return !!(await appDownloadComplete(appid)).complete;
    }
    catch {
        return false;
    }
}
/** A pin is ready only when every pinned depot is installed at its exact GID. */
function installedDepotsMatchPin(pinned, installed) {
    const entries = Object.entries(pinned);
    if (!entries.length)
        return false;
    return entries.every(([depot, gid]) => depot in installed && String(installed[depot]) === String(gid));
}
async function isPinnedBuildReady(appid) {
    try {
        const [pin, download] = await Promise.all([getPinStatus(appid), appDownloadComplete(appid)]);
        return !!(pin.success && pin.pinned && download.success && download.complete &&
            (pin.pinMatched === true ||
                installedDepotsMatchPin(pin.depots || {}, pin.installedDepots || {})));
    }
    catch {
        return false;
    }
}
async function runBuildAccurateApply(h) {
    // No paired manifest means this is a universal/local fix. Apply it to the
    // installed build; the backend may lock that current build after extraction.
    // Never run the generic game-manifest resolver from a fix apply path.
    if (!h.pinFn) {
        h.onPhase("applying");
        await h.doApply();
        return "applied";
    }
    // 1) Pin to the fix's build (lua.tools -> hubcap -> ~/Downloads). No-op if none.
    h.onPhase("pinning");
    let source = "none";
    let pinned = false;
    // Default true: if we can't tell, assume the build changed so we force an
    // update rather than silently applying onto a stale build.
    try {
        const pin = await h.pinFn();
        source = pin.source || "none";
        pinned = !!pin.pinned;
    }
    catch {
        /* pin is best-effort */
    }
    const isInstalled = await installed(h.appid);
    // A source advertised a paired manifest, so failure to pin it must stop the
    // operation. Applying anyway would put the fix on latest/the wrong build.
    if (source === "none" || !pinned) {
        h.onPhase("pin_failed", { source });
        throw new Error("The selected fix's paired manifest could not be pinned.");
    }
    // A pin file is not evidence that Steam has downloaded that build. Read
    // InstalledDepots from Steam's appmanifest, even when the pin did not change.
    if (isInstalled && await isPinnedBuildReady(h.appid)) {
        h.onPhase("applying");
        await h.doApply();
        return "applied";
    }
    // Trigger Steam to update/download the game to the pinned build. First apply
    //    the "no internet" fix (strip the steam.cfg update-block, restored once the
    //    download starts) so Steam doesn't fail the update with "no internet".
    h.onPhase("updating", { source });
    try {
        await noInternetFixBegin(h.appid);
    }
    catch {
        /* best-effort */
    }
    // Moon reloads config.yaml through its file watcher. Give that watcher one
    // turn before asking Steam to construct the install plan from the new pin.
    await new Promise((resolve) => setTimeout(resolve, 750));
    try {
        await triggerSteamInstall(h.appid);
    }
    catch {
        /* the user can still start the download manually */
    }
    if (isInstalled) {
        // Install IPC can be a no-op for an app Steam considers fully installed.
        // Steam's Verify action makes it reconcile Moon's newly pinned TARGET
        // against the actual ACTIVE depots; do not launch the stale game.
        try {
            await validateSteamApp(h.appid);
        }
        catch { /* user can retry */ }
    }
    if (!h.autoApply) {
        // Guided: stop here; the component shows an "Apply now" button and polls
        // completion to hint when it's ready.
        h.onPhase("awaiting_download");
        return "awaiting";
    }
    // 5) Auto: poll until the download completes, then apply.
    const started = Date.now();
    const TIMEOUT_MS = 30 * 60 * 1000; // 30 min
    while (Date.now() - started < TIMEOUT_MS) {
        if (h.shouldStop?.())
            return "awaiting";
        await new Promise((r) => setTimeout(r, 3000));
        if (h.shouldStop?.())
            return "awaiting";
        if (await isPinnedBuildReady(h.appid)) {
            h.onPhase("applying");
            await h.doApply();
            return "applied";
        }
    }
    // Timed out -> fall back to guided so the user can apply manually.
    h.onPhase("awaiting_download");
    return "awaiting";
}

const TOKEER_DISCORD_URL = "https://discord.com/channels/1464130182364270696/1534460498446127175";
const DEDEVISION_INVITE_URL = "https://discord.gg/denuvo";
const GUILD_ID = "1464130182364270696";
// Tokeer's Linux game picker lives in this channel, but tickets are created as
// private threads beneath the separate, general #activation-point channel.
const TOKEER_PANEL_CHANNEL_ID = "1534460498446127175";
const TOKEER_TICKET_PARENT_CHANNEL_ID = "1465275824075833477";
const TOKEER_CHANNEL = `/channels/${GUILD_ID}/${TOKEER_PANEL_CHANNEL_ID}`;
const LEGACY_TARGET_MESSAGE = "1535685399265935422";
const LEGACY_TOKEER_DISCORD_URL = `${TOKEER_DISCORD_URL}/${LEGACY_TARGET_MESSAGE}`;
const CDP_PORTS = [8080, 8081];
const TOKEER_VIEW_NAME = "slsdeck_tokeer";
function settleWithin(work, timeoutMs, fallback) {
    return Promise.race([
        work,
        new Promise((resolve) => setTimeout(() => resolve(fallback), Math.max(1, timeoutMs))),
    ]);
}
async function listCdpTabs$1() {
    const merged = [];
    const seen = new Set();
    for (const port of CDP_PORTS) {
        try {
            const r = await settleWithin(fetchNoCors(`http://localhost:${port}/json`), 1800, null);
            if (!r)
                continue;
            const tabs = await settleWithin(r.json(), 1200, []);
            if (!Array.isArray(tabs))
                continue;
            for (const tab of tabs) {
                const key = String(tab.webSocketDebuggerUrl || `${tab.type || ""}|${tab.title || ""}|${tab.url || ""}`);
                if (seen.has(key))
                    continue;
                seen.add(key);
                merged.push({ ...tab, cdpPort: port });
            }
        }
        catch {
            /* this debugger port is not active */
        }
    }
    return merged;
}
function cdpCommand$1(wsUrl, method, params = {}, timeoutMs = 5000) {
    return new Promise((resolve) => {
        let done = false;
        let sock;
        let timer;
        const finish = (v) => {
            if (done)
                return;
            done = true;
            if (timer !== undefined)
                clearTimeout(timer);
            try {
                sock.close();
            }
            catch { }
            resolve(v);
        };
        try {
            sock = new WebSocket(wsUrl);
        }
        catch {
            resolve(null);
            return;
        }
        const id = 1;
        sock.onopen = () => sock.send(JSON.stringify({ id, method, params }));
        sock.onmessage = (ev) => {
            try {
                const m = JSON.parse(String(ev.data));
                if (m?.id === id)
                    finish(m?.result ?? null);
            }
            catch { }
        };
        sock.onerror = () => finish(null);
        sock.onclose = () => finish(null);
        timer = setTimeout(() => finish(null), timeoutMs);
    });
}
/** CDP DOM node ids belong to the debugger session that created them. Keep
 * discovery and assignment on one socket so Discord's hidden file input does
 * not become invalid between DOM.requestNode and DOM.setFileInputFiles. */
function cdpSetDiscordFileInput(wsUrl, filePath, timeoutMs = 7000) {
    return new Promise((resolve) => {
        let done = false;
        let sock;
        let nextId = 0;
        const pending = new Map();
        let timer;
        const finish = (value) => {
            if (done)
                return;
            done = true;
            if (timer !== undefined)
                clearTimeout(timer);
            pending.clear();
            try {
                sock.close();
            }
            catch { }
            resolve(value);
        };
        const send = (method, params = {}) => new Promise((resolveCommand) => {
            if (done || sock.readyState !== WebSocket.OPEN) {
                resolveCommand(null);
                return;
            }
            const id = ++nextId;
            pending.set(id, resolveCommand);
            try {
                sock.send(JSON.stringify({ id, method, params }));
            }
            catch {
                pending.delete(id);
                resolveCommand(null);
            }
        });
        try {
            sock = new WebSocket(wsUrl);
        }
        catch {
            resolve({ found: false, accepted: false });
            return;
        }
        sock.onmessage = (ev) => {
            try {
                const message = JSON.parse(String(ev.data));
                const resolveCommand = pending.get(Number(message?.id));
                if (!resolveCommand)
                    return;
                pending.delete(Number(message.id));
                resolveCommand(message?.error ? null : (message?.result ?? null));
            }
            catch { }
        };
        sock.onopen = async () => {
            await send("DOM.enable");
            await send("DOM.getDocument", { depth: 1, pierce: true });
            const evaluated = await send("Runtime.evaluate", {
                expression: `(function(){try{
          var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
          var composer=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],[contenteditable]')).filter(visible).sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;})[0];
          var form=composer&&composer.closest('form');
          return (form&&form.querySelector('input[type="file"]'))||document.querySelector('input[type="file"]')||null;
        }catch(e){return null;}})()`,
                returnByValue: false,
            });
            const objectId = String(evaluated?.result?.objectId || "");
            if (!objectId || evaluated?.result?.subtype === "null") {
                finish({ found: false, accepted: false });
                return;
            }
            const requested = await send("DOM.requestNode", { objectId });
            const nodeId = Number(requested?.nodeId || 0);
            if (!nodeId) {
                finish({ found: true, accepted: false });
                return;
            }
            const assigned = await send("DOM.setFileInputFiles", { nodeId, files: [filePath] });
            finish({ found: true, accepted: assigned !== null });
        };
        sock.onerror = () => finish({ found: false, accepted: false });
        sock.onclose = () => finish({ found: false, accepted: false });
        timer = setTimeout(() => finish({ found: false, accepted: false }), timeoutMs);
    });
}
async function evalJson(wsUrl, expression, timeoutMs = 5000) {
    const result = await cdpCommand$1(wsUrl, "Runtime.evaluate", {
        expression, returnByValue: true, awaitPromise: true,
    }, timeoutMs);
    return result?.result?.value ?? null;
}
async function evalDetailed(wsUrl, expression, timeoutMs = 5000) {
    const result = await cdpCommand$1(wsUrl, "Runtime.evaluate", { expression, returnByValue: true }, timeoutMs);
    const error = result?.exceptionDetails?.exception?.description || result?.exceptionDetails?.text;
    if (error)
        return { error: String(error) };
    return { value: result?.result?.value };
}
function looksLikeDiscordUrl(url) {
    return /(^|\.)discord\.com(?:\/|$)/i.test(String(url || "").replace(/^https?:\/\//i, ""));
}
function discordRouteIdentity(url) {
    const match = String(url || "").match(/\/channels\/(\d+)\/(\d+)(?:\/(\d+))?/i);
    return match ? { guildId: match[1], channelId: match[2], messageId: match[3] } : {};
}
/** Message links append a message snowflake while Discord's live SPA often
 * reports only /guild/channel. The child channel snowflake is the ticket. */
function canonicalDiscordChannelUrl(url) {
    const identity = discordRouteIdentity(url);
    if (!identity.guildId || !identity.channelId)
        return String(url || "").split(/[?#]/)[0];
    return `https://discord.com/channels/${identity.guildId}/${identity.channelId}`;
}
function ticketIdentity(url, lastMessageId) {
    const identity = discordRouteIdentity(url);
    if (!identity.guildId || !identity.channelId)
        return {};
    if (identity.channelId === TOKEER_PANEL_CHANNEL_ID || identity.channelId === TOKEER_TICKET_PARENT_CHANNEL_ID) {
        return { guildId: identity.guildId, parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID };
    }
    return {
        guildId: identity.guildId,
        parentChannelId: identity.channelId === TOKEER_TICKET_PARENT_CHANNEL_ID ? undefined : TOKEER_TICKET_PARENT_CHANNEL_ID,
        ticketChannelId: identity.channelId,
        lastMessageId: lastMessageId || identity.messageId,
        url: canonicalDiscordChannelUrl(url),
    };
}
const SIDEBAR_CHANNELS_EXPR = `(function(){try{
  var seen={},rows=[];
  [].slice.call(document.querySelectorAll('[data-list-item-id^="channels___"]')).forEach(function(e){
    var raw=String(e.getAttribute('data-list-item-id')||'');
    var m=raw.match(/^channels___(\\d+)$/);if(!m||seen[m[1]])return;
    seen[m[1]]=true;
    rows.push({id:m[1],label:String(e.getAttribute('aria-label')||e.innerText||e.textContent||'').trim(),role:String(e.getAttribute('role')||''),thread:!!e.closest('[class*="typeThread"]')});
  });
  return JSON.stringify(rows);
}catch(e){return '[]';}})()`;
async function readSidebarChannels(tab) {
    if (!tab.webSocketDebuggerUrl)
        return [];
    try {
        const raw = await evalJson(tab.webSocketDebuggerUrl, SIDEBAR_CHANNELS_EXPR, 2500);
        const parsed = JSON.parse(String(raw || "[]"));
        return Array.isArray(parsed) ? parsed.filter((item) => /^\d+$/.test(String(item?.id || ""))) : [];
    }
    catch {
        return [];
    }
}
/** Steam external-web surfaces sometimes report a wrapper URL in /json. Ask the
 * actual JS execution context what it is rendering instead of trusting metadata. */
async function resolveTabUrl(t, timeoutMs = 1800) {
    if (!t.webSocketDebuggerUrl)
        return String(t.url || "");
    const expr = `(function(){try{
    var here=String(location.href||document.URL||'');
    var frames=[].slice.call(document.querySelectorAll('iframe')).map(function(f){return String(f.src||'');});
    return JSON.stringify({here:here,frames:frames});
  }catch(e){return JSON.stringify({here:'',frames:[]});}})()`;
    const raw = await evalJson(t.webSocketDebuggerUrl, expr, timeoutMs);
    try {
        const parsed = JSON.parse(String(raw || ""));
        const urls = [parsed?.here, ...(Array.isArray(parsed?.frames) ? parsed.frames : [])].filter(Boolean);
        return urls.find((u) => looksLikeDiscordUrl(u)) || String(parsed?.here || t.url || "");
    }
    catch {
        return String(t.url || "");
    }
}
async function findDiscordTabUncached() {
    const tabs = (await listCdpTabs$1()).filter((t) => !!t.webSocketDebuggerUrl);
    let fallback = null;
    for (const tab of tabs) {
        const resolvedUrl = await resolveTabUrl(tab);
        if (!looksLikeDiscordUrl(resolvedUrl))
            continue;
        const resolved = { ...tab, resolvedUrl, url: resolvedUrl };
        if (resolvedUrl.includes(TOKEER_CHANNEL))
            return resolved;
        if (!fallback)
            fallback = resolved;
    }
    return fallback;
}
// Resolving the Discord target is the single most expensive thing in this file:
// it opens a CDP socket to EVERY Steam target and runs a Runtime.evaluate on each
// (resolveTabUrl, ~1.8s worst case apiece) because Steam's /json metadata lies
// about wrapper URLs. Every exported helper below used to pay that in full, and
// the availability refresh calls them in a loop â€” which is how "checking" could
// run for minutes. The target does not move between those calls, so memoize it
// briefly and coalesce concurrent lookups onto one resolution.
const TAB_CACHE_MS = 5000;
let tabCache = null;
let tabInFlight = null;
/** Drop the memoized target. Call after anything that can move or replace it
 * (navigation, BrowserView create/park) so we never act on a dead socket. */
function invalidateDiscordTabCache() {
    tabCache = null;
}
/** Drop both target and DOM-derived state after navigation or target creation. */
function invalidateDiscordCaptureCaches() {
    tabCache = null;
    snapshotCache = null;
    lastSignedIn = null;
}
async function findDiscordTab() {
    if (tabCache && Date.now() - tabCache.at < TAB_CACHE_MS)
        return tabCache.tab;
    if (tabInFlight)
        return tabInFlight;
    tabInFlight = (async () => {
        try {
            const tab = await findDiscordTabUncached();
            tabCache = { at: Date.now(), tab };
            return tab;
        }
        finally {
            tabInFlight = null;
        }
    })();
    return tabInFlight;
}
/** Whether Steam CEF currently holds an authenticated Discord web session.
 *
 * Coalesced like the snapshot: the sign-in button polls this, and without
 * de-duplication each poll paid a full target resolution. Transitions are
 * broadcast so UI showing a "sign in" affordance can drop it the moment the
 * session actually becomes authenticated, rather than waiting for whatever
 * long-running check happens to finish next. */
let signInInFlight = null;
let lastSignedIn = null;
async function getDiscordSignInState() {
    if (signInInFlight)
        return signInInFlight;
    signInInFlight = (async () => {
        try {
            const tab = await findDiscordTab();
            if (!tab?.webSocketDebuggerUrl)
                return { signedIn: false, signedOut: false, found: false };
            const expression = `(async function(){try{
        var u=String(location.href||document.URL||'');
        if(/\\/(?:login|register)(?:[/?#]|$)/i.test(u))return 'signed-out';
        if(document.querySelector('input[name="email"],input[name="password"],form[class*="authBox"]'))return 'signed-out';
        var response=await fetch('/api/v9/users/@me',{credentials:'include',cache:'no-store'});
        if(response.status===200)return 'signed-in';
        var shell=/\\/channels\\//i.test(u)&&!!document.querySelector('[data-list-item-id^="channels___"],nav,[class*="sidebar"]');
        return shell?'signed-in':'unknown';
      }catch(e){
        var u=String(location.href||document.URL||'');
        var shell=/\\/channels\\//i.test(u)&&!!document.querySelector('[data-list-item-id^="channels___"],nav,[class*="sidebar"]');
        return shell?'signed-in':'unknown';
      }})()`;
            const result = String(await evalJson(tab.webSocketDebuggerUrl, expression, 2500) || "unknown");
            const signedIn = result === "signed-in";
            const signedOut = result === "signed-out";
            if (signedIn !== lastSignedIn) {
                lastSignedIn = signedIn;
                try {
                    window.dispatchEvent(new CustomEvent("slsdeck-tokeer-signin", { detail: signedIn }));
                }
                catch { /* ignore */ }
            }
            return { signedIn, signedOut, found: true };
        }
        finally {
            signInInFlight = null;
        }
    })();
    return signInInFlight;
}
/** Poll sign-in state until it flips to signed-in (or the budget runs out).
 * Used right after opening the Discord login so the button reacts immediately
 * instead of on the next unrelated refresh. */
async function waitForDiscordSignIn(budgetMs = 120000) {
    const deadline = Date.now() + budgetMs;
    while (Date.now() < deadline) {
        const { signedIn } = await getDiscordSignInState();
        if (signedIn)
            return true;
        await new Promise((r) => setTimeout(r, 1500));
    }
    return false;
}
async function findSharedJsContext$1() {
    const tabs = (await listCdpTabs$1()).filter((t) => !!t.webSocketDebuggerUrl);
    return tabs.find((t) => String(t.title || "") === "SharedJSContext")
        || tabs.find((t) => /SharedJSContext/i.test(String(t.title || "")))
        || null;
}
// The offscreen view still plays Discord audio. Keep it only while a panel or
// Discord operation needs it, then release Chromium's view after a short grace
// period so a quick switch between Fixes and Tokeer does not reload Discord.
const VIEW_IDLE_MS = 15000;
let viewUsers = 0;
let viewCloseTimer = null;
let viewClosing = null;
let viewDisposed = false;
async function closeIdleTokeerView() {
    if (viewClosing)
        return viewClosing;
    viewClosing = (async () => {
        const shared = await findSharedJsContext$1();
        if (viewUsers && !viewDisposed)
            return;
        if (!shared?.webSocketDebuggerUrl)
            return;
        const closed = await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
      var v=window.SLSDECK_TOKEER_VIEW;
      if(!v)return true;
      try{v.m_browserView.SetVisible(false);}catch(e){}
      v.Destroy();
      window.SLSDECK_TOKEER_VIEW=undefined;
      return true;
    }catch(e){return false;}})()`, 3000);
        if (closed)
            invalidateDiscordCaptureCaches();
    })().finally(() => { viewClosing = null; });
    return viewClosing;
}
function scheduleTokeerViewClose() {
    if (viewCloseTimer)
        clearTimeout(viewCloseTimer);
    viewCloseTimer = null;
    if (viewUsers || viewDisposed)
        return;
    viewCloseTimer = setTimeout(() => {
        viewCloseTimer = null;
        if (!viewUsers)
            void closeIdleTokeerView();
    }, VIEW_IDLE_MS);
}
function retainTokeerDiscordView() {
    if (viewCloseTimer)
        clearTimeout(viewCloseTimer);
    viewCloseTimer = null;
    viewUsers++;
    let released = false;
    return () => {
        if (released)
            return;
        released = true;
        viewUsers = Math.max(0, viewUsers - 1);
        scheduleTokeerViewClose();
    };
}
function disposeTokeerDiscordView() {
    viewDisposed = true;
    viewUsers = 0;
    if (viewCloseTimer)
        clearTimeout(viewCloseTimer);
    viewCloseTimer = null;
    void closeIdleTokeerView();
}
async function hasTokeerBrowserView() {
    const shared = await findSharedJsContext$1();
    if (!shared?.webSocketDebuggerUrl)
        return false;
    return !!(await evalJson(shared.webSocketDebuggerUrl, `(function(){try{return !!(window.SLSDECK_TOKEER_VIEW&&window.SLSDECK_TOKEER_VIEW.m_browserView);}catch(e){return false;}})()`, 2000));
}
async function findManagedTokeerTab() {
    const tabs = (await listCdpTabs$1()).filter((t) => !!t.webSocketDebuggerUrl);
    for (const tab of tabs) {
        const managed = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{return window.__SLSDECK_TOKEER_MANAGED===true;}catch(e){return false;}})()`, 1200);
        if (!managed)
            continue;
        const resolvedUrl = await resolveTabUrl(tab);
        return { ...tab, resolvedUrl, url: resolvedUrl };
    }
    return null;
}
/** Full Discord navigations replace the document and its page globals. Re-tag
 * the same target after its requested channel is live so cleanup can always
 * find SLSDeck's parked BrowserView and return it to the Linux panel. */
async function retainManagedTokeerTab(tab, wantedUrl, timeoutMs = 10000) {
    if (!tab.webSocketDebuggerUrl)
        return false;
    const wanted = canonicalDiscordChannelUrl(wantedUrl);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const liveUrl = await resolveTabUrl(tab);
        if (canonicalDiscordChannelUrl(liveUrl) === wanted) {
            const tagged = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{if(document.readyState==='loading')return false;window.__SLSDECK_TOKEER_MANAGED=true;return true;}catch(e){return false;}})()`, 2000);
            if (tagged)
                return true;
        }
        await new Promise((r) => setTimeout(r, 250));
    }
    return false;
}
async function hideTokeerBrowserView() {
    const shared = await findSharedJsContext$1();
    if (!shared?.webSocketDebuggerUrl)
        return;
    await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
    var v=window.SLSDECK_TOKEER_VIEW;
    if(!v||!v.m_browserView)return false;
    v.m_browserView.SetVisible(false);return true;
  }catch(e){return false;}})()`, 2000);
}
async function parkTokeerBrowserView() {
    const shared = await findSharedJsContext$1();
    if (!shared?.webSocketDebuggerUrl)
        return;
    await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
    var v=window.SLSDECK_TOKEER_VIEW;
    if(!v||!v.m_browserView)return false;
    // A truly hidden Chromium view is suspended. Keep a normal-sized surface
    // rendered far outside the Steam viewport so Discord stays live without
    // being visible or receiving gamepad input.
    v.m_browserView.SetBounds(-10000,-10000,1280,720);
    v.m_browserView.SetVisible(true);return true;
  }catch(e){return false;}})()`, 2000);
}
async function waitForExactUrl$1(url, timeoutMs = 6500) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const tabs = await listCdpTabs$1();
        const tab = tabs.find((t) => !!t.webSocketDebuggerUrl && String(t.url || "") === url);
        if (tab)
            return tab;
        await new Promise((r) => setTimeout(r, 200));
    }
    return null;
}
/**
 * Steamcord-style creation path: create a BrowserView from Steam's debuggable
 * SharedJSContext, tag it with a unique data: URL, discover that exact CDP target,
 * then navigate the target to Discord. This avoids NavigateToExternalWeb, whose
 * BrowserView is not exposed in CDP on some Steam Deck builds.
 */
async function createTokeerDiscordBrowserView() {
    const shared = await findSharedJsContext$1();
    if (!shared?.webSocketDebuggerUrl)
        return null;
    const placeholder = `data:text/plain,slsdeck_tokeer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const expr = `(function(){try{
    if(window.SLSDECK_TOKEER_VIEW!==undefined){
      try{window.SLSDECK_TOKEER_VIEW.m_browserView.SetVisible(false);}catch(e){}
      try{window.SLSDECK_TOKEER_VIEW.Destroy();}catch(e){}
      window.SLSDECK_TOKEER_VIEW=undefined;
    }
    var main=window.DFL&&window.DFL.Router&&window.DFL.Router.WindowStore&&window.DFL.Router.WindowStore.GamepadUIMainWindowInstance;
    if(!main||typeof main.CreateBrowserView!=='function') return JSON.stringify({ok:false,error:'CreateBrowserView unavailable'});
    var view=main.CreateBrowserView(${JSON.stringify(TOKEER_VIEW_NAME)});
    window.SLSDECK_TOKEER_VIEW=view;
    try{view.WIDTH=1280;view.HEIGHT=720;view.m_browserView.SetBounds(-10000,-10000,1280,720);}catch(e){}
    // Visible to Chromium (so it renders), parked outside Steam's viewport.
    try{view.m_browserView.SetVisible(true);}catch(e){}
    view.m_browserView.LoadURL(${JSON.stringify(placeholder)});
    return JSON.stringify({ok:true});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;
    const raw = await evalJson(shared.webSocketDebuggerUrl, expr, 4000);
    try {
        const created = JSON.parse(String(raw || ""));
        if (!created?.ok)
            return null;
    }
    catch {
        return null;
    }
    const target = await waitForExactUrl$1(placeholder);
    if (!target?.webSocketDebuggerUrl)
        return null;
    // Keep Discord's SPA active while the Deck/QAM focus changes.
    await cdpCommand$1(target.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
    await cdpCommand$1(target.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
    const nav = await cdpCommand$1(target.webSocketDebuggerUrl, "Page.navigate", {
        url: TOKEER_DISCORD_URL,
        transitionType: "address_bar",
    }, 4000);
    if (!nav)
        return null;
    invalidateDiscordCaptureCaches();
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
        // The websocket belongs to the exact BrowserView we created. Do not call
        // findDiscordTab() here: a separately opened manual Discord tab may win
        // that search and leave the managed embedded surface on its placeholder.
        const liveUrl = await resolveTabUrl(target);
        if (looksLikeDiscordUrl(liveUrl)) {
            await evalJson(target.webSocketDebuggerUrl, `(function(){try{window.__SLSDECK_TOKEER_MANAGED=true;return true;}catch(e){return false;}})()`, 2000);
            return { ...target, resolvedUrl: liveUrl, url: liveUrl };
        }
        await new Promise((r) => setTimeout(r, 300));
    }
    return null;
}
async function cdpDiagnostic() {
    const tabs = await listCdpTabs$1();
    if (!tabs.length)
        return "CDP 8080/8081 returned no targets.";
    const ports = Array.from(new Set(tabs.map((t) => t.cdpPort).filter(Boolean))).join("/");
    const shared = tabs.some((t) => /SharedJSContext/i.test(String(t.title || "")));
    return `Steam CDP is active on ${ports || "an unknown port"} (${tabs.length} targets; SharedJSContext ${shared ? "found" : "missing"}).`;
}
async function navigateDiscordTabToTokeer(tab, readyTimeoutMs = 10000) {
    if (!tab.webSocketDebuggerUrl)
        return false;
    const liveUrl = await resolveTabUrl(tab);
    if (liveUrl.includes(TOKEER_CHANNEL))
        return retainManagedTokeerTab(tab, TOKEER_DISCORD_URL, 2500);
    const nav = await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.navigate", {
        url: TOKEER_DISCORD_URL,
        transitionType: "address_bar",
    }, 4000);
    if (!nav)
        return false;
    invalidateDiscordCaptureCaches();
    return retainManagedTokeerTab(tab, TOKEER_DISCORD_URL, readyTimeoutMs);
}
const SNAPSHOT_EXPR = `(function(){try{
  var arts=[].slice.call(document.querySelectorAll('[role="article"]'));
  var controls=function(a){return [].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"],button,[role="button"]')).filter(function(e){var t=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();var select=e.getAttribute('aria-haspopup')==='listbox'||e.getAttribute('role')==='combobox';return select||(!/remaining/i.test(t)&&/(?:steam|ubi(?:soft)?|ea)(?:\\s+games?)?\\s*(?:\\(|-|$)/i.test(t));});};
  var norm=function(v){return String(v||'').replace(/\u00a0/g,' ').replace(/\\s+/g,' ').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');};
  var classify=function(v){v=String(v||'');return /ubi(?:soft)?/i.test(v)?'ubisoft':/(?:^|\\b)ea(?:\\b|\\s*games?)/i.test(v)?'ea':/steam|linux|proton/i.test(v)?'steam':'other';};
  var panels=arts.filter(function(a){var t=a.innerText||'';return controls(a).length>0&&/steam|ubi(?:soft)?|ea(?:\\s*games?)?|linux|proton|games?/i.test(t);});
  var seen={},selects=[];
  panels.forEach(function(a){
    var context=(a.innerText||a.textContent||'').replace(/\u00a0/g,' ').replace(/\\s+/g,' ').trim();
    var identity=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),messageId=identity&&identity[2]||'';
    controls(a).forEach(function(e){
      var label=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\u00a0/g,' ').replace(/\\s+/g,' ').trim();
      var kind=classify(label+' '+context),semantic=norm(label)||kind,base=kind+':'+semantic,count=(seen[base]||0)+1;seen[base]=count;
      var controlType=e.getAttribute('aria-haspopup')==='listbox'||e.getAttribute('role')==='combobox'?'select':'button';
      selects.push({index:selects.length,key:base+(count>1?':'+count:''),label:label||context.split(/\\n/)[0]||('Game menu '+(selects.length+1)),kind:kind,controlType:controlType,messageId:messageId,disabled:e.getAttribute('aria-disabled')==='true'||e.disabled===true});
    });
  });
  // Compatibility fallback for the original single-message panel. Keep this
  // isolated behind semantic discovery so new layouts never inherit its fixed
  // message/index assumptions.
  if(!selects.length){
    var legacyId=${JSON.stringify(LEGACY_TARGET_MESSAGE)};
    var legacy=document.querySelector('[data-list-item-id$="-'+legacyId+'"]')||(document.querySelector('#message-accessories-'+legacyId)&&document.querySelector('#message-accessories-'+legacyId).closest('[role="article"]'));
    var legacyControls=legacy?[].slice.call(legacy.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"]')).filter(function(e){return e.getAttribute('aria-haspopup')==='listbox'||e.getAttribute('role')==='combobox';}):[];
    legacyControls.forEach(function(e,i){var label=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim(),kind=classify(label+' '+(legacy.innerText||''));selects.push({index:i,key:'legacy:'+i,label:label||('Game menu '+(i+1)),kind:kind,controlType:'select',messageId:legacyId,disabled:e.getAttribute('aria-disabled')==='true'||e.disabled===true});});
    if(legacy)panels=[legacy];
  }
  if(!selects.length) return {found:false,selectors:[],error:'Discord is open, but neither the semantic panel nor the legacy Tokeer game selector is currently rendered. Sign in if needed, open the Linux activation channel, and press Refresh.'};
  var text=panels.map(function(a){return a.innerText||'';}).join('\\n').replace(/\u00a0/g,' ');
  var n=function(re){var m=text.match(re);return m?Number(m[1]):undefined};
  var sv=function(re){var m=text.match(re);return m?m[1].trim():undefined};
  return {found:true,steamStatus:sv(/Steam\\s*:\\s*([^\\n]+)/i),gamesListed:n(/Games listed:\\s*(\\d+)/i),steamGames:n(/Games listed:[\\s\\S]*?Steam[^\\d]*(\\d+)/i),keysRemaining:n(/Keys remaining:\\s*(\\d+)/i),highDemand:n(/High demand:\\s*(\\d+)/i),selectors:selects,rawText:text.slice(0,12000)};
}catch(e){return {found:false,selectors:[],error:String(e)};}})()`;
// Several surfaces (the Tokeer page, the availability cache, Fixes) can each
// independently ask for the same expensive scrape, and they stack. Coalesce
// concurrent reads onto one in-flight scrape and let a just-finished result be
// reused for a moment, so N callers cost one Discord round trip instead of N.
const SNAPSHOT_TTL_MS = 2500;
let snapshotCache = null;
let snapshotInFlight = null;
/** Coalesced/short-cached snapshot. `force` bypasses the reuse window but still
 * shares any scrape already running. */
async function readTokeerDiscord(force = false, allowLegacyFallback = true) {
    if (!force && snapshotCache && Date.now() - snapshotCache.at < SNAPSHOT_TTL_MS) {
        return snapshotCache.state;
    }
    // Fast restoration reads deliberately skip the expensive legacy-anchor jump.
    // Do not make them wait behind (or replace) a normal full compatibility read.
    if (!allowLegacyFallback) {
        const state = await readTokeerDiscordUncached(false);
        if (state.found)
            snapshotCache = { at: Date.now(), state };
        return state;
    }
    if (snapshotInFlight)
        return snapshotInFlight;
    snapshotInFlight = (async () => {
        try {
            const state = await readTokeerDiscordUncached(true);
            // Only cache a decisive answer; caching "not found" would make a genuine
            // retry loop spin on a stale negative.
            if (state.found)
                snapshotCache = { at: Date.now(), state };
            else
                snapshotCache = null;
            return state;
        }
        finally {
            snapshotInFlight = null;
        }
    })();
    return snapshotInFlight;
}
async function readTokeerDiscordUncached(allowLegacyFallback = true) {
    // Availability refresh deliberately navigates the managed hidden view. A
    // separately-open manual ticket may also be a Discord CDP target; choosing
    // that target here returns ticket text instead of the live vault panel.
    const tab = (await findManagedTokeerTab()) || (await findDiscordTab());
    if (!tab?.webSocketDebuggerUrl) {
        const diag = await cdpDiagnostic();
        return { found: false, selectors: [], error: `No Discord page found in Steam CDP. ${diag}` };
    }
    if (!tab.url?.includes(TOKEER_CHANNEL)) {
        return { found: false, selectors: [], tabUrl: tab.url, error: "Discord is visible in Steam CEF, but it is on a different page. Press â€˜Open Tokeer Discordâ€™ to return to the activation panel." };
    }
    let snap = await evalDetailed(tab.webSocketDebuggerUrl, SNAPSHOT_EXPR);
    // Last-resort compatibility path: older panels can be far enough back in
    // Discord's virtualized history that the exact article is not mounted when
    // the channel opens at its newest edge. Jump to the former anchor only after
    // the position-independent scan fails, then run the original indexed scrape.
    if (allowLegacyFallback && !snap.error && (!snap.value || !snap.value.found)) {
        await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.navigate", { url: LEGACY_TOKEER_DISCORD_URL, transitionType: "address_bar" }, 4000);
        const legacyReady = await retainManagedTokeerTab(tab, LEGACY_TOKEER_DISCORD_URL, 5000);
        if (legacyReady) {
            const legacySnap = await evalDetailed(tab.webSocketDebuggerUrl, SNAPSHOT_EXPR);
            if (!legacySnap.error && legacySnap.value?.found)
                snap = legacySnap;
        }
    }
    if (snap.error) {
        // The memoized target may be a socket that died under us (Steam replaced the
        // view, or the page navigated). Drop it so the next attempt re-resolves
        // instead of failing forever against a dead handle.
        invalidateDiscordTabCache();
        return { found: false, selectors: [], tabUrl: tab.url, error: `Discord DOM evaluation failed: ${snap.error}` };
    }
    if (!snap.value || typeof snap.value !== "object") {
        invalidateDiscordTabCache();
        return { found: false, selectors: [], tabUrl: tab.url, error: "Discord DOM snapshot returned no object â€” the page was not ready or the target went away." };
    }
    return { ...snap.value, selectors: Array.isArray(snap.value.selectors) ? snap.value.selectors : [], tabUrl: tab.url };
}
function resolveSelectorRef(ref, state) {
    const selectors = state.selectors || [];
    if (typeof ref === "number")
        return selectors.find((s) => s.index === ref) || null;
    if (typeof ref === "string")
        return selectors.find((s) => s.key === ref) || selectors.find((s) => s.label === ref) || null;
    const key = String(ref?.key || "");
    const label = String(ref?.label || "");
    return (key && selectors.find((s) => s.key === key))
        || (label && selectors.find((s) => s.label === label && (!ref.kind || s.kind === ref.kind)))
        || selectors.find((s) => s.index === Number(ref?.index))
        || null;
}
/** Open a selector by semantic identity. Numeric indexes remain accepted only
 * for sessions saved by older builds; current callers always pass `key`. */
async function openSelectorAndReadOptions(ref, timeoutMs = 5000) {
    const tab = (await findManagedTokeerTab()) || (await findDiscordTab());
    if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL))
        return [];
    // Current callers use semantic keys. Do not jump through the old fixed
    // message anchor just to open one menu; that compatibility navigation can
    // consume 10+ seconds and belongs to the explicit/full panel refresh.
    const legacyRef = typeof ref === "number"
        || (typeof ref === "string" && ref.startsWith("legacy:"))
        || (typeof ref === "object" && String(ref?.key || "").startsWith("legacy:"));
    const state = await readTokeerDiscord(true, legacyRef);
    const target = resolveSelectorRef(ref, state);
    if (!target)
        return [];
    const clickExpr = `(function(){try{
    var wantKey=${JSON.stringify(target.key)},wantLabel=${JSON.stringify(target.label)},wantKind=${JSON.stringify(target.kind)};
    var controls=function(a){return [].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"],button,[role="button"]')).filter(function(e){var t=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();var select=e.getAttribute('aria-haspopup')==='listbox'||e.getAttribute('role')==='combobox';return select||(!/remaining/i.test(t)&&/(?:steam|ubi(?:soft)?|ea)(?:\\s+games?)?\\s*(?:\\(|-|$)/i.test(t));});};
    var norm=function(v){return String(v||'').replace(/\\u00a0/g,' ').replace(/\\s+/g,' ').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');};
    var classify=function(v){v=String(v||'');return /ubi(?:soft)?/i.test(v)?'ubisoft':/(?:^|\\b)ea(?:\\b|\\s*games?)/i.test(v)?'ea':/steam|linux|proton/i.test(v)?'steam':'other';};
    var seen={},found=null,panels=[].slice.call(document.querySelectorAll('[role="article"]')).filter(function(a){return controls(a).length>0&&/steam|ubi(?:soft)?|ea(?:\\s*games?)?|linux|proton|games?/i.test(a.innerText||'');});
    panels.some(function(a){var context=(a.innerText||a.textContent||'').replace(/\\s+/g,' ').trim();return controls(a).some(function(e){var label=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim(),kind=classify(label+' '+context),base=kind+':'+(norm(label)||kind),count=(seen[base]||0)+1;seen[base]=count;var key=base+(count>1?':'+count:'');if(key===wantKey||(label===wantLabel&&kind===wantKind)){found=e;return true;}return false;});});
    // Old method fallback for a cached/index-only selector session.
    if(!found){var legacyId=${JSON.stringify(LEGACY_TARGET_MESSAGE)},legacy=document.querySelector('[data-list-item-id$="-'+legacyId+'"]')||(document.querySelector('#message-accessories-'+legacyId)&&document.querySelector('#message-accessories-'+legacyId).closest('[role="article"]'));var legacyControls=legacy?[].slice.call(legacy.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"]')).filter(function(x){return x.getAttribute('aria-haspopup')==='listbox'||x.getAttribute('role')==='combobox';}):[];found=legacyControls[${Number(target.index)}]||null;}
    var e=found;if(!e)return false;
    var visible=function(x){var r=x.getBoundingClientRect();return r.width>0&&r.height>0;};
    var open=e.getAttribute('aria-expanded')==='true';
    var visibleOptions=[].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"]')).filter(visible);
    // Closing SLSDeck's copied menu does not close Discord's hidden popup.
    // Reuse that matching open popup; clicking the combobox again would toggle
    // it shut and make every second SLSDeck opening appear empty.
    if(open&&visibleOptions.length)return true;
    var r=e.getBoundingClientRect(),o={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;e.dispatchEvent(new C(n,o));});return true;
  }catch(e){return false;}})()`;
    const ok = await evalJson(tab.webSocketDebuggerUrl, clickExpr, Math.min(timeoutMs, 3000));
    if (!ok)
        return [];
    await new Promise((r) => setTimeout(r, 450));
    const optionsExpr = `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
    var boxes=[].slice.call(document.querySelectorAll('[role="listbox"]')).filter(visible);
    var root=boxes.length?boxes[boxes.length-1]:document;
    var rows=[].slice.call(root.querySelectorAll('[role="option"]')).filter(visible);
    if(!rows.length)rows=[].slice.call(document.querySelectorAll('[role="option"]')).filter(visible);
    if(!rows.length)rows=[].slice.call(document.querySelectorAll('[role="dialog"] button,[role="dialog"] [role="button"],[class*="popover"] button,[role="article"] button,[role="article"] [role="button"]')).filter(visible).filter(function(e){return /\\b\\d+\\s+of\\s+\\d+\\s+remaining/i.test(e.innerText||e.textContent||e.getAttribute('aria-label')||'');});
    var labels=rows.map(function(e){return (e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();}).filter(Boolean);
    // Tokeer's game rows carry availability text. If those are present, keep
    // only them and discard Discord navigation/notification menu entries.
    var games=labels.filter(function(t){return /\\b\\d+\\s+of\\s+\\d+\\s+remaining\\s*\\(\\d+%\\)/i.test(t);});
    return JSON.stringify(games.length?games:labels);
  }catch(e){return '[]';}})()`;
    const deadline = Date.now() + Math.max(500, timeoutMs);
    do {
        const raw = await evalJson(tab.webSocketDebuggerUrl, optionsExpr, Math.min(Math.max(250, deadline - Date.now()), 3000));
        try {
            const labels = JSON.parse(String(raw || "[]"));
            if (Array.isArray(labels) && labels.length)
                return labels;
        }
        catch { /* keep waiting for Discord's dynamic response */ }
        if (Date.now() < deadline)
            await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() < deadline);
    return [];
}
async function chooseSelectorOption(ref, label) {
    const tab = (await findManagedTokeerTab()) || (await findDiscordTab());
    if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL))
        return false;
    const visibleExpr = `(function(){try{var want=${JSON.stringify(label)};return [].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"],[role="dialog"] button,[role="dialog"] [role="button"],[class*="popover"] button,[role="article"] button,[role="article"] [role="button"]')).some(function(e){var r=e.getBoundingClientRect(),t=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();return r.width>0&&r.height>0&&t===want;});}catch(e){return false;}})()`;
    const alreadyOpen = !!(await evalJson(tab.webSocketDebuggerUrl, visibleExpr));
    if (!alreadyOpen)
        await openSelectorAndReadOptions(ref);
    const expr = `(function(){try{var want=${JSON.stringify(label)};var o=[].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"],[role="dialog"] button,[role="dialog"] [role="button"],[class*="popover"] button,[role="article"] button,[role="article"] [role="button"]')).find(function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim()===want;});if(!o)return false;var r=o.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;o.dispatchEvent(new C(n,p));});return true;}catch(e){return false;}})()`;
    return !!(await evalJson(tab.webSocketDebuggerUrl, expr));
}
// Discord may render the interaction component in a sibling row rather than
// inside the message article, and some builds expose it as role=button instead
// of a literal <button>. Match the distinctive acknowledgement/tutorial label
// globally in the exact activation channel; do not match generic Confirm or
// Continue controls elsewhere in Discord.
const TICKET_GATE_EXPR = `(function(){try{
  var text=function(e){return String(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();};
  var rendered=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
  var all=[].slice.call(document.querySelectorAll('button,[role="button"]'));
  var seen=[],matches=[];
  for(var i=0;i<all.length;i++){
    var b=all[i];if(seen.indexOf(b)>=0||!rendered(b))continue;seen.push(b);
    var label=text(b);
    if(/(?:tutorial|instruction(?:s)?|video)/i.test(label)&&/(?:read|agree|acknowledge|understand|watch(?:ed)?)/i.test(label))matches.push({button:b,label:label});
  }
  if(!matches.length)return JSON.stringify({found:false,error:'Waiting for the agreement and tutorial confirmation buttonâ€¦'});
  matches.sort(function(a,b){return a.button.getBoundingClientRect().top-b.button.getBoundingClientRect().top;});
  var item=matches[matches.length-1],button=item.button;
  try{button.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}
  var r=button.getBoundingClientRect(),article=button.closest('[role="article"]'),context=article||(button.parentElement&&button.parentElement.parentElement)||button.parentElement;
  return JSON.stringify({found:true,label:item.label,disabled:!!button.disabled||button.getAttribute('aria-disabled')==='true',x:r.left+r.width/2,y:r.top+r.height/2,messageText:String(context&&context.innerText||'').slice(0,5000)});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
async function readLatestTicketGate() {
    const tab = await findDiscordTab();
    if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL))
        return { found: false, error: "Tokeer activation channel is not open." };
    const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_GATE_EXPR);
    try {
        return JSON.parse(String(raw || ""));
    }
    catch {
        return { found: false, error: "Could not read the ticket confirmation button." };
    }
}
async function readTokeerTicketRejection(tab, afterMessageId = "") {
    if (!tab.webSocketDebuggerUrl)
        return { found: false };
    const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var after=${JSON.stringify(afterMessageId)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-20).reverse();
    for(var i=0;i<arts.length;i++){
      var identity=String(arts[i].id||arts[i].getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=identity&&identity[2]||'';
      if(after&&id&&BigInt(id)<=BigInt(after))continue;
      var text=String(arts[i].innerText||arts[i].textContent||'').replace(/\\u00a0/g,' ').replace(/\\s+/g,' ').trim();
      if(/activation\\s+system\\s+is\\s+currently\\s+under\\s+maintenance/i.test(text)||/currently\\s+under\\s+maintenance[\\s\\S]{0,120}?no\\s+token\\s+has\\s+been\\s+used/i.test(text)){
        return JSON.stringify({found:true,maintenance:true});
      }
      var match=text.match(/(?:cooldown\\s+active|quota\\s+(?:was\\s+)?depleted)[\\s\\S]{0,160}?(?:try\\s+again\\s+(?:in|after))\\s+((?:\\d+\\s*[dhms]\\s*)+)/i);
      if(!match)continue;
      var token=String(match[1]||'').trim(),seconds=0,re=/(\\d+)\\s*([dhms])/ig,m;
      while((m=re.exec(token))){var n=Number(m[1]);seconds+=n*(m[2].toLowerCase()==='d'?86400:m[2].toLowerCase()==='h'?3600:m[2].toLowerCase()==='m'?60:1);}
      return JSON.stringify({found:true,waitText:token,waitSeconds:seconds});
    }
    return JSON.stringify({found:false});
  }catch(e){return JSON.stringify({found:false});}})()`, 3000);
    try {
        return JSON.parse(String(raw || ""));
    }
    catch {
        return { found: false };
    }
}
async function clickLatestTicketGate() {
    const tab = await findDiscordTab();
    if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL))
        return { success: false, error: "Tokeer activation channel is not open." };
    // Snapshot the sidebar before Discord inserts the private ticket thread.
    const existingChannelIds = (await readSidebarChannels(tab)).map((item) => item.id);
    const beforeMessageId = String(await evalJson(tab.webSocketDebuggerUrl, `(function(){try{var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();for(var i=0;i<arts.length;i++){var m=String(arts[i].id||arts[i].getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);if(m)return m[2];}return '';}catch(e){return '';}})()`, 2500) || "");
    const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_GATE_EXPR);
    let gate = null;
    try {
        gate = JSON.parse(String(raw || ""));
    }
    catch { }
    if (!gate?.found)
        return { success: false, error: gate?.error || "The agreement and tutorial confirmation button is not ready yet." };
    if (gate.disabled) {
        const rejection = await readTokeerTicketRejection(tab);
        if (rejection.maintenance)
            return { success: false, maintenance: true };
        if (rejection.found)
            return { success: false, quota: true, quotaWaitText: rejection.waitText, quotaWaitSeconds: rejection.waitSeconds };
        return { success: false, error: "Discord currently rejects the ticket action, but did not expose a cooldown time." };
    }
    const x = Number(gate.x), y = Number(gate.y);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return { success: false, error: "The agreement and tutorial confirmation button could not be positioned." };
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, 2000);
    const down = await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 }, 2000);
    const up = await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 }, 2000);
    const ok = down !== null && up !== null;
    if (ok)
        invalidateDiscordCaptureCaches();
    if (!ok)
        return { success: false, error: "Discord did not accept the agreement and tutorial confirmation click." };
    // Quota responses are ephemeral and appear in the activation channel instead
    // of creating a thread. Give the bot a short window to render that response
    // before the caller begins waiting for a new private channel.
    for (let attempt = 0; attempt < 12; attempt++) {
        const rejection = await readTokeerTicketRejection(tab, beforeMessageId);
        if (rejection.maintenance)
            return { success: false, maintenance: true };
        if (rejection.found)
            return { success: false, quota: true, quotaWaitText: rejection.waitText, quotaWaitSeconds: rejection.waitSeconds };
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return { success: true, fromUrl: tab.url, existingChannelIds };
}
const TICKET_CONTEXT_EXPR = `(function(){try{
  var articles=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-40);
  var opening=articles.slice(0,6).map(function(a){return String(a.innerText||a.textContent||'');}).join('\\n').replace(/\\u00a0/g,' ');
  var recent=articles.map(function(a){return String(a.innerText||a.textContent||'');}).join('\\n');
  var code=articles.reduce(function(all,a){return all.concat([].slice.call(a.querySelectorAll('pre,code,[class*="codeBlock"]')).map(function(e){return e.innerText||e.textContent||'';}));},[]).join('\\n');
  var body=(document.body.innerText||'').replace(/\\u00a0/g,' ');
  var route=String(location.href||'').match(/\\/channels\\/(\\d+)\\/(\\d+)(?:\\/(\\d+))?/i)||[];
  var messageIds=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]')).map(function(e){
    var value=String(e.id||e.getAttribute('data-list-item-id')||'');
    var match=value.match(/chat-messages-(\\d+)-(\\d+)/);return match?{channelId:match[1],messageId:match[2]}:null;
  }).filter(Boolean);
  var newest=messageIds.length?messageIds[messageIds.length-1]:null;
  // Discord is a long-lived SPA. Prefer code blocks and newest messages, and
  // use the end of the page as fallback because new ticket content is last.
  var text=(recent||body.slice(-50000)).replace(/\\u00a0/g,' ');
  var hay=(code+'\\n'+text).slice(-70000);
  var ubisoft=/(?:tokeer\\s+verify-ubi\\b|(?:^|\\s)--ubi\\b|\\bUbiTokeer\\b)/i.test(hay);
  var gameMatch=opening.match(/(?:Ubi|Steam|EA)?Tokeer\\s*[-â€“â€”:]\\s*([^\\n\\r]+)/i)||opening.match(/(?:Game|Title)\\s*:\\s*([^\\n\\r]+)/i);
  var gameName=gameMatch?String(gameMatch[1]||'').replace(/\\s+(?:Ticket|User|Payment|Status)\\s*:.*$/i,'').trim():'';
  var incompatiblePlatform=/(?:\\bPowerShell\\b|LuaTools\\s+Validator)/i.test(body);
  var patterns=[
    /tokeer\\s+verify(?:-[a-z][a-z0-9_-]*)?(?:\\s+--?appid(?:=|\\s+)|\\s+)(\\d{3,10})/i,
    /install_linux\\.sh[^\\n\\r|]*\\|\\s*(?:bash|sh)\\s+-s\\s+--\\s*(\\d{3,10})(?:\\s+[a-z][a-z0-9_-]*)?/i,
    /bash\\s+-s\\s+--\\s*(\\d{3,10})(?:\\s+(?:ubisoft|steam|linux))?/i,
    /(?:--?appid|app[_ -]?id)(?:=|:|\\s+|["']+)(\\d{3,10})/i,
    /(?:store\\.steampowered\\.com\\/app|steam:\\/\\/(?:run|install)|steamdb\\.info\\/app)\\/(\\d{3,10})/i,
    /\\/app\\/(\\d{3,10})(?:\\/|\\b)/i
  ];
  var ids=[];
  for(var i=0;i<patterns.length;i++){
    var m=hay.match(patterns[i]);
    if(m&&ids.indexOf(Number(m[1]))<0)ids.push(Number(m[1]));
  }
  var opened=/ticket|activation|tokeer|tlx1|setup command/i.test(text)||/\\/channels\\//i.test(location.href);
  var identity={guildId:route[1]||'',ticketChannelId:(newest&&newest.channelId)||route[2]||'',lastMessageId:(newest&&newest.messageId)||route[3]||''};
  var common={opened:true,gameName:gameName,ubisoft:ubisoft,incompatiblePlatform:incompatiblePlatform,rawText:hay.slice(-20000)};
  if(incompatiblePlatform)return JSON.stringify(Object.assign({found:false,error:'This is a Windows activation ticket (PowerShell/LuaTools Validator instructions); Linux automation ignored it.'},common,identity));
  return JSON.stringify(ids.length?Object.assign({found:true,appid:ids[0],appids:ids},common,identity):Object.assign({found:false,error:'Ticket opened, waiting for the setup commandsâ€¦'},common,identity));
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
const TICKET_LINK_EXPR = `(function(){try{
  var panel=${JSON.stringify(TOKEER_CHANNEL)};
  var parent=${JSON.stringify(`/channels/${GUILD_ID}/${TOKEER_TICKET_PARENT_CHANNEL_ID}`)};
  var guild=${JSON.stringify(`/channels/${GUILD_ID}/`)};
  var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
  for(var i=0;i<Math.min(arts.length,30);i++){
    var a=arts[i], text=(a.innerText||'').replace(/\u00a0/g,' ');
    if(!/(?:ticket|activation|private|continue|created|opened)/i.test(text))continue;
    var links=[].slice.call(a.querySelectorAll('a[href*="/channels/"]'));
    for(var j=0;j<links.length;j++){
      var href=String(links[j].href||links[j].getAttribute('href')||'');
      if(href.indexOf(guild)>=0 && href.indexOf(panel)<0 && href.indexOf(parent)<0)return JSON.stringify({found:true,url:href,text:text.slice(0,3000)});
    }
  }
  return JSON.stringify({found:false});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
async function waitForTicketContext(fromUrl = "", timeoutMs = 20000, expectedAppid = 0, existingChannelIds = [], onTicketDiscovered, expectedGameName = "") {
    const deadline = Date.now() + timeoutMs;
    let lastError = "Waiting for Tokeer ticketâ€¦";
    const startingIdentity = discordRouteIdentity(fromUrl);
    const excludedChannels = new Set([TOKEER_PANEL_CHANNEL_ID, TOKEER_TICKET_PARENT_CHANNEL_ID]);
    const sidebarBefore = new Set(existingChannelIds);
    const normalizeGame = (value) => String(value || "").normalize("NFKD").replace(/[Â®â„¢Â©'â€™â€˜`Â´]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
    const wantedGame = normalizeGame(expectedGameName);
    let lastTicketUrl = looksLikeDiscordUrl(fromUrl) && startingIdentity.guildId === GUILD_ID && !!startingIdentity.channelId && !excludedChannels.has(startingIdentity.channelId)
        ? canonicalDiscordChannelUrl(fromUrl) : "";
    if (lastTicketUrl) {
        try {
            const managed = await findManagedTokeerTab();
            if (managed?.webSocketDebuggerUrl && canonicalDiscordChannelUrl(String(managed.url || "")) !== lastTicketUrl) {
                await cdpCommand$1(managed.webSocketDebuggerUrl, "Page.navigate", {
                    url: lastTicketUrl, transitionType: "address_bar",
                }, 4000);
                invalidateDiscordCaptureCaches();
                await retainManagedTokeerTab(managed, lastTicketUrl);
            }
        }
        catch { }
    }
    while (Date.now() < deadline) {
        const tabs = await listCdpTabs$1();
        const candidates = [];
        for (const rawTab of tabs.filter((t) => !!t.webSocketDebuggerUrl)) {
            const resolvedUrl = await resolveTabUrl(rawTab);
            if (!looksLikeDiscordUrl(resolvedUrl))
                continue;
            const tab = { ...rawTab, resolvedUrl, url: resolvedUrl };
            const u = String(tab.url || "");
            // Discord can open a private thread in the same target, a modal without
            // changing the URL, or a new target. Inspect all guild tabs, including
            // the activation target that initiated the interaction.
            if (u.includes(`/channels/${GUILD_ID}/`))
                candidates.push(tab);
        }
        const wantedChannel = discordRouteIdentity(lastTicketUrl).channelId;
        candidates.sort((a, b) => {
            const score = (url) => {
                const channel = discordRouteIdentity(url).channelId;
                return Number(!!wantedChannel && channel === wantedChannel) * 4 + Number(!!channel && !excludedChannels.has(String(channel))) * 2;
            };
            return score(String(b.url || "")) - score(String(a.url || ""));
        });
        for (const tab of candidates) {
            if (!tab.webSocketDebuggerUrl)
                continue;
            const isManagedTarget = !!(await evalJson(tab.webSocketDebuggerUrl, `(function(){try{return window.__SLSDECK_TOKEER_MANAGED===true;}catch(e){return false;}})()`, 1200));
            const sidebarNow = await readSidebarChannels(tab).catch(() => []);
            const knownThreads = new Set(sidebarNow.filter((item) => item.thread).map((item) => item.id));
            const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_CONTEXT_EXPR);
            try {
                const parsed = JSON.parse(String(raw || ""));
                const currentIdentity = ticketIdentity(String(tab.url || ""), parsed?.lastMessageId);
                const currentChannel = parsed?.ticketChannelId || currentIdentity.ticketChannelId;
                const isPrivateTicket = !!currentChannel && !excludedChannels.has(currentChannel) && (currentChannel === wantedChannel || knownThreads.has(currentChannel));
                const foundGame = normalizeGame(String(parsed?.gameName || ""));
                const gameMatches = !wantedGame || !foundGame || wantedGame === foundGame;
                if (parsed?.found && parsed?.appid) {
                    const candidates = (Array.isArray(parsed.appids) ? parsed.appids : [parsed.appid])
                        .map(Number).filter((value) => Number.isFinite(value) && value > 0);
                    if ((!expectedAppid || candidates.includes(expectedAppid)) && gameMatches && isPrivateTicket) {
                        return { ...parsed, ...currentIdentity, parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID, ticketChannelId: currentChannel, appid: expectedAppid || parsed.appid, opened: true };
                    }
                    lastError = !gameMatches
                        ? `Ignored ticket for ${parsed.gameName}; the selected Linux game is ${expectedGameName}. Waiting for the correct ticketâ€¦`
                        : `Ticket commands contained AppID ${candidates.join(", ")}, but the selected installed game is AppID ${expectedAppid}. Waiting for the correct setup commandâ€¦`;
                }
                // Discord changes its message wrappers frequently. If the structured
                // parser cannot see code blocks, recover only the already locally
                // verified AppID from the rendered ticket text. Requiring both the
                // exact numeric token and Tokeer command vocabulary prevents an old
                // unrelated channel message from starting automation.
                if (expectedAppid && !parsed?.found) {
                    const expectedExpr = `(function(){try{
            var want=${JSON.stringify(String(expectedAppid))};
            var roots=[document.body].concat([].slice.call(document.querySelectorAll('[role="article"],[data-list-item-id*="chat-messages"],pre,code')));
            var text=roots.map(function(e){return String(e&&(e.innerText||e.textContent)||'');}).join('\\n').replace(/\\u00a0/g,' ');
            var exact=new RegExp('(?:^|\\\\D)'+want+'(?:$|\\\\D)').test(text);
            var command=/(?:tokeer\\s+verify(?:-[a-z0-9_-]+)?|install_linux\\.sh|bash\\s+-s\\s+--|setup\\s+code)/i.test(text);
            return JSON.stringify({match:exact&&command,hasId:exact,hasCommand:command});
          }catch(e){return JSON.stringify({match:false,error:String(e)});}})()`;
                    const expectedRaw = await evalJson(tab.webSocketDebuggerUrl, expectedExpr, 3500);
                    try {
                        const recovered = JSON.parse(String(expectedRaw || ""));
                        if (recovered?.match && gameMatches && !parsed?.incompatiblePlatform) {
                            if (!isPrivateTicket)
                                continue;
                            return { found: true, opened: true, appid: expectedAppid, appids: [expectedAppid], ubisoft: !!parsed?.ubisoft, rawText: parsed?.rawText || "", ...currentIdentity, parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID, ticketChannelId: currentChannel };
                        }
                    }
                    catch { }
                }
                if (parsed?.opened && isPrivateTicket)
                    lastTicketUrl = canonicalDiscordChannelUrl(String(tab.url || ""));
                if (parsed?.error)
                    lastError = parsed.error;
            }
            catch { }
            // #linux-activation-point stays open while Discord adds the ticket as a
            // sidebar thread beneath #activation-point. Detect the new snowflake ID
            // without depending on navigation or localized "thread" labels.
            if (!lastTicketUrl && sidebarBefore.size) {
                try {
                    const created = sidebarNow
                        .filter((item) => item.thread && !sidebarBefore.has(item.id) && !excludedChannels.has(item.id))
                        .sort((a, b) => b.id.localeCompare(a.id))[0];
                    if (created) {
                        lastTicketUrl = `https://discord.com/channels/${GUILD_ID}/${created.id}`;
                        const discovered = { found: false, opened: true, ...ticketIdentity(lastTicketUrl), parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID, ticketChannelId: created.id, error: "Ticket thread found; waiting for its setup commandsâ€¦" };
                        try {
                            onTicketDiscovered?.(discovered);
                        }
                        catch { }
                        await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.navigate", {
                            url: lastTicketUrl, transitionType: "link",
                        }, 4000);
                        invalidateDiscordCaptureCaches();
                        if (isManagedTarget)
                            await retainManagedTokeerTab(tab, lastTicketUrl);
                        lastError = "Ticket thread found; waiting for its setup commandsâ€¦";
                    }
                }
                catch { }
            }
            // Ticket bots often post a private-channel link instead of changing the
            // current SPA route. Discover that link from recent messages and move the
            // same hidden target into it.
            try {
                const linkRaw = await evalJson(tab.webSocketDebuggerUrl, TICKET_LINK_EXPR);
                const link = JSON.parse(String(linkRaw || ""));
                if (link?.found && looksLikeDiscordUrl(link.url || "")) {
                    lastTicketUrl = canonicalDiscordChannelUrl(String(link.url));
                    if (canonicalDiscordChannelUrl(String(tab.url || "")) !== lastTicketUrl) {
                        await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.navigate", {
                            url: lastTicketUrl, transitionType: "link",
                        }, 4000);
                        invalidateDiscordCaptureCaches();
                        if (isManagedTarget)
                            await retainManagedTokeerTab(tab, lastTicketUrl);
                    }
                    lastError = "Ticket found; waiting for its setup commandsâ€¦";
                }
            }
            catch { }
        }
        await new Promise((r) => setTimeout(r, 600));
    }
    return { found: false, opened: !!lastTicketUrl, ...(lastTicketUrl ? ticketIdentity(lastTicketUrl) : {}), error: lastError || "Timed out waiting for the Tokeer ticket/thread." };
}
async function navigateTicketTab(ticketUrl) {
    const wanted = canonicalDiscordChannelUrl(ticketUrl);
    // Steam suspends its external-web Discord page when the user returns from
    // Manual view. That target can retain the ticket messages while unmounting
    // the composer, so it is safe for reading but not for keyboard automation.
    // Always prefer SLSDeck's rendered, parked BrowserView for ticket actions.
    let tab = await findManagedTokeerTab();
    const managedTarget = !!tab;
    // Older sessions may not have a managed view yet. Only then reuse an exact
    // Discord target, preserving compatibility without stealing a manual tab
    // whenever the managed automation surface is available.
    if (!tab?.webSocketDebuggerUrl) {
        for (const raw of (await listCdpTabs$1()).filter((item) => !!item.webSocketDebuggerUrl)) {
            const resolved = await resolveTabUrl(raw);
            if (canonicalDiscordChannelUrl(resolved) === wanted) {
                tab = { ...raw, url: resolved, resolvedUrl: resolved };
                break;
            }
        }
    }
    if (!tab?.webSocketDebuggerUrl)
        tab = await findDiscordTab();
    if (!tab?.webSocketDebuggerUrl)
        return null;
    if (ticketUrl && looksLikeDiscordUrl(ticketUrl) && canonicalDiscordChannelUrl(String(tab.url || "")) !== wanted) {
        await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.navigate", { url: wanted, transitionType: "address_bar" }, 4000);
        invalidateDiscordCaptureCaches();
        if (managedTarget)
            await retainManagedTokeerTab(tab, wanted);
        else
            await new Promise((r) => setTimeout(r, 1000));
    }
    return tab;
}
async function ticketTab(ticketUrl) {
    const wanted = canonicalDiscordChannelUrl(ticketUrl);
    const wantedId = discordRouteIdentity(wanted).channelId;
    if (!wantedId || wantedId === TOKEER_PANEL_CHANNEL_ID || wantedId === TOKEER_TICKET_PARENT_CHANNEL_ID)
        return null;
    const tab = await navigateTicketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl)
        return null;
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        const resolved = await resolveTabUrl(tab);
        if (canonicalDiscordChannelUrl(resolved) === wanted) {
            const rendered = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
        var want=${JSON.stringify(wantedId)};
        var nodes=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]'));
        return nodes.some(function(e){return new RegExp('chat-messages-'+want+'-\\\\d+').test(String(e.id||e.getAttribute('data-list-item-id')||''));});
      }catch(e){return false;}})()`, 2500);
            if (rendered)
                return { ...tab, url: resolved, resolvedUrl: resolved };
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return null;
}
async function forceTicketToNewest(tab) {
    if (!tab?.webSocketDebuggerUrl)
        return;
    // Discord virtualizes old and new messages. A parked BrowserView can remain
    // at the verification article forever, so a bot response exists on Discord
    // but is not mounted in the DOM. Prefer Discord's own jump-to-present control,
    // then force the article scroller to its newest edge as a structural fallback.
    await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var jump=[].slice.call(document.querySelectorAll('[class*="jumpToPresent"],button,[role="button"]')).filter(visible).filter(function(e){var t=String(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();return /jump\\s+to\\s+present|new\\s+messages?/i.test(t)||String(e.className||'').indexOf('jumpToPresent')>=0;})[0];
    if(jump){try{jump.click();}catch(e){}}
    var arts=[].slice.call(document.querySelectorAll('[role="article"]')),last=arts[arts.length-1];
    if(last){var s=last.parentElement;while(s&&!(s.scrollHeight>s.clientHeight+20))s=s.parentElement;if(s)s.scrollTop=s.scrollHeight;try{last.scrollIntoView({block:'end',inline:'nearest'});}catch(e){}}
    return true;
  }catch(e){return false;}})()`, 3000);
    await new Promise((r) => setTimeout(r, 450));
}
function cdpClickAndCaptureDbdata(wsUrl, x, y, timeoutMs = 8000) {
    return new Promise((resolve) => {
        let done = false, sock, nextId = 0;
        const pending = new Map();
        const trusted = (url, filename = "") => {
            try {
                const value = String(url || "");
                return /^https:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\//i.test(value)
                    && (/db(?:ata|data)\.json/i.test(decodeURIComponent(value)) || /db(?:ata|data)\.json/i.test(String(filename || "")));
            }
            catch {
                return false;
            }
        };
        const finish = (value = "") => {
            if (done)
                return;
            done = true;
            clearTimeout(timer);
            pending.clear();
            try {
                sock.close();
            }
            catch { }
            resolve(value);
        };
        const send = (method, params = {}) => new Promise((resolveCommand) => {
            if (done || sock.readyState !== WebSocket.OPEN) {
                resolveCommand(null);
                return;
            }
            const id = ++nextId;
            pending.set(id, resolveCommand);
            try {
                sock.send(JSON.stringify({ id, method, params }));
            }
            catch {
                pending.delete(id);
                resolveCommand(null);
            }
        });
        const timer = setTimeout(() => finish(""), timeoutMs);
        try {
            sock = new WebSocket(wsUrl);
        }
        catch {
            finish("");
            return;
        }
        sock.onmessage = (event) => {
            try {
                const msg = JSON.parse(String(event.data));
                if (msg?.id && pending.has(msg.id)) {
                    const cb = pending.get(msg.id);
                    pending.delete(msg.id);
                    cb(msg.result ?? null);
                    return;
                }
                const p = msg?.params || {};
                const url = p?.response?.url || p?.request?.url || p?.url || "";
                const filename = p?.suggestedFilename || "";
                if (trusted(url, filename))
                    finish(String(url));
            }
            catch { }
        };
        sock.onerror = () => finish("");
        sock.onclose = () => finish("");
        sock.onopen = async () => {
            await send("Network.enable");
            await send("Page.enable");
            await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
            await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
        };
    });
}
async function findPostedTokeerTicketFile(ticketUrl, expectedFilename) {
    const filename = String(expectedFilename || "").trim();
    if (!/^token_req_\d+\.txt$/i.test(filename))
        return { success: false, found: false, error: "Invalid Ubisoft token request name." };
    const tab = await ticketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl)
        return { success: false, found: false, error: "The exact saved Discord ticket could not be opened." };
    await forceTicketToNewest(tab);
    const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var expected=${JSON.stringify(filename)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-80).reverse();
    for(var i=0;i<arts.length;i++){var a=arts[i],scope=a.closest('li')||a.parentElement||a,links=[].slice.call(scope.querySelectorAll('a[href]')),attached=false;for(var j=0;j<links.length;j++){var href=String(links[j].href||links[j].getAttribute('href')||''),label=String(links[j].innerText||links[j].textContent||'');try{href=decodeURIComponent(href);}catch(e){}if(/(?:cdn\\.discordapp\\.com|media\\.discordapp\\.net)\\/attachments\\//i.test(href)&&(href.indexOf(expected)>=0||label.indexOf(expected)>=0)){attached=true;break;}}if(!attached)continue;var m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);return JSON.stringify({found:true,id:m&&m[2]||''});}
    return JSON.stringify({found:false});
  }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`, 3500);
    try {
        const value = JSON.parse(String(raw || ""));
        if (value?.found)
            return { success: true, found: true, lastMessageId: String(value.id || "") || undefined };
        return { success: !value?.error, found: false, error: value?.error ? String(value.error) : undefined };
    }
    catch {
        return { success: false, found: false, error: "Could not inspect the saved Discord ticket." };
    }
}
/** Return the managed Discord view to a saved private ticket after a temporary
 * background vault scrape. */
async function restoreTokeerTicketView(ticketUrl) {
    const tab = await ticketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl)
        return false;
    const live = await resolveTabUrl(tab);
    return canonicalDiscordChannelUrl(String(live || "")) === canonicalDiscordChannelUrl(ticketUrl);
}
/** Inspect an already-visible private ticket without navigating Discord.
 * Returning closed=false/open=false means the user merely navigated elsewhere;
 * only explicit Discord/Tokeer closure evidence aborts the saved chain. */
async function checkTokeerTicketState(ticketUrl) {
    if (!looksLikeDiscordUrl(ticketUrl))
        return { open: false, closed: false };
    const wanted = canonicalDiscordChannelUrl(ticketUrl);
    const wantedId = discordRouteIdentity(wanted).channelId;
    const tabs = await listCdpTabs$1();
    for (const raw of tabs.filter((item) => !!item.webSocketDebuggerUrl)) {
        const resolved = await resolveTabUrl(raw);
        if (canonicalDiscordChannelUrl(String(resolved || "")) !== wanted || !raw.webSocketDebuggerUrl)
            continue;
        const expr = `(function(){try{
      var want=${JSON.stringify(wantedId)};
      var body=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
      var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\n');
      var explicit=/(?:ticket\s+(?:has\s+been|was|is(?:\s+now)?)?\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\s+(?:this\s+)?ticket)/i.test(recent);
      var unavailable=/(?:unknown\s+channel|channel\s+(?:is\s+)?unavailable|you\s+(?:do\s+not|don't)\s+have\s+access|no\s+access\s+to\s+this\s+channel)/i.test(body);
      var composer=!!document.querySelector('[role="textbox"][contenteditable]:not([contenteditable="false"]),[data-slate-editor="true"],textarea');
      var exact=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]')).some(function(e){return new RegExp('chat-messages-'+want+'-\\\\d+').test(String(e.id||e.getAttribute('data-list-item-id')||''));});
      return JSON.stringify({open:exact&&composer&&!explicit&&!unavailable,closed:exact&&(explicit||unavailable),reason:explicit?'Tokeer reports that the ticket was cancelled or closed.':unavailable?'The Discord ticket channel no longer exists or is inaccessible.':''});
    }catch(e){return JSON.stringify({open:false,closed:false,reason:String(e)});}})()`;
        const result = await evalJson(raw.webSocketDebuggerUrl, expr, 3500);
        try {
            return JSON.parse(String(result || ""));
        }
        catch {
            return { open: false, closed: false };
        }
    }
    return { open: false, closed: false };
}
/** Actively reopen a saved ticket once and distinguish a deleted channel from
 * a temporarily absent CDP target. This is intentionally not used by the
 * frequent passive poller because navigation would disrupt Manual view. */
async function probeTokeerTicketState(ticketUrl) {
    if (!looksLikeDiscordUrl(ticketUrl))
        return { open: false, closed: false };
    const wanted = canonicalDiscordChannelUrl(ticketUrl);
    const wantedId = discordRouteIdentity(wanted).channelId;
    const tab = await navigateTicketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl)
        return { open: false, closed: false, reason: "Discord is not connected." };
    let stableMissing = 0;
    for (let attempt = 0; attempt < 12; attempt++) {
        const expr = `(function(){try{
      var route=String(location.href||'').match(/\\/channels\\/(\\d+)\\/(\\d+)/i)||[];
      var href=route[1]&&route[2]?'https://discord.com/channels/'+route[1]+'/'+route[2]:String(location.href||'').split(/[?#]/)[0];
      var body=String(document.body&&document.body.innerText||'').replace(/\\u00a0/g,' ');
      var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\\n');
      var explicit=/(?:ticket\\s+(?:has\\s+been|was|is(?:\\s+now)?)?\\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\\s+(?:this\\s+)?ticket)/i.test(recent);
      var unavailable=/(?:unknown\\s+channel|channel\\s+(?:is\\s+)?unavailable|you\\s+(?:do\\s+not|don't)\\s+have\\s+access|no\\s+access\\s+to\\s+this\\s+channel)/i.test(body);
      var active=/(?:tokeer\\s+verify(?:-[a-z0-9_-]+)?|install_linux\\.sh|close\\s+ticket|paste\\s+that\\s+whole\\s+TLX1|TLX1\\.[A-Za-z0-9_-]+|activation\\s+(?:code|token|window)|private\\s+ticket\\s+saved)/i.test(body);
      var composer=!!document.querySelector('[role="textbox"][contenteditable]:not([contenteditable="false"]),[data-slate-editor="true"],textarea');
      var loaded=document.readyState==='complete'&&!!document.querySelector('[role="main"],[data-list-id="chat-messages"],ol[class*="scrollerInner"]');
      var exact=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]')).some(function(e){return new RegExp('chat-messages-${wantedId}-\\\\d+').test(String(e.id||e.getAttribute('data-list-item-id')||''));});
      var sidebarReady=!!document.querySelector('[data-list-item-id="channels___${TOKEER_TICKET_PARENT_CHANNEL_ID}"],[data-list-item-id^="channels___"]');
      var sidebarHasTicket=!!document.querySelector('[data-list-item-id="channels___${wantedId}"]');
      return JSON.stringify({href:href,explicit:explicit,unavailable:unavailable,active:active,composer:composer,exact:exact,loaded:loaded,sidebarReady:sidebarReady,sidebarHasTicket:sidebarHasTicket});
    }catch(e){return JSON.stringify({error:String(e)});}})()`;
        const raw = await evalJson(tab.webSocketDebuggerUrl, expr, 3500);
        try {
            const state = JSON.parse(String(raw || ""));
            // Discord renders the previous route and a partially virtualized message
            // list while navigating. Never erase a saved chain from content observed
            // on another channel; closure evidence is authoritative only on the
            // exact child-channel identity we persisted.
            if (String(state?.href || "") === wanted && state?.exact && (state?.explicit || state?.unavailable)) {
                return { open: false, closed: true, reason: state.explicit ? "Tokeer reports that the ticket was closed." : "The Discord ticket channel no longer exists or is inaccessible." };
            }
            if (String(state?.href || "") === wanted && state?.exact && (state?.active || state?.composer))
                return { open: true, closed: false };
            const parent = `https://discord.com/channels/${GUILD_ID}/${TOKEER_TICKET_PARENT_CHANNEL_ID}`;
            const panel = `https://discord.com/channels/${GUILD_ID}/${TOKEER_PANEL_CHANNEL_ID}`;
            const settledRoute = [wanted, parent, panel].includes(String(state?.href || ""));
            if (settledRoute && state?.loaded && state?.sidebarReady && !state?.sidebarHasTicket && !state?.exact)
                stableMissing += 1;
            else
                stableMissing = 0;
            if (stableMissing >= 6)
                return { open: false, closed: true, reason: "The exact saved ticket thread is no longer present in Discord." };
        }
        catch { }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return { open: false, closed: false, reason: "Discord did not provide authoritative evidence that the saved ticket was closed; its session was preserved." };
}
async function sendTokeerTicketMessage(ticketUrl, message) {
    const text = String(message || "").trim();
    if (!/^TLX1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text)) {
        return { success: false, error: "The generated verification value is not a valid TLX1 code; nothing was sent to Discord." };
    }
    const focusExpr = `(function(){try{
    var page=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
    var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\n');
    if(/(?:ticket\s+(?:has\s+been|was|is(?:\s+now)?)?\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\s+(?:this\s+)?ticket)/i.test(recent)||/(?:unknown\s+channel|channel\s+(?:is\s+)?unavailable|you\s+(?:do\s+not|don't)\s+have\s+access|no\s+access\s+to\s+this\s+channel)/i.test(page))return JSON.stringify({ok:false,cancelled:true,error:'The Discord ticket was cancelled, closed, or deleted.'});
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){return visible(e)&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
    // Discord also has a search textbox in the header. The ticket composer is
    // the lowest visible editable control in the channel viewport.
    boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
    var box=boxes[0];
    if(!box)return JSON.stringify({ok:false,error:'Discord message box was not found in the ticket.'});
    try{box.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}
    try{box.click();}catch(e){}
    box.focus();
    var r=box.getBoundingClientRect(),active=document.activeElement===box;
    return JSON.stringify({ok:active,found:true,x:r.left+r.width/2,y:r.top+r.height/2,error:active?'':'Discord rendered the message box but did not focus it yet.'});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;
    // Page.navigate returns before Discord's SPA has mounted the child thread's
    // Slate editor. Re-resolve the CDP target and retry instead of treating that
    // normal transition window as a permanent inability to type.
    const focusDeadline = Date.now() + 15000;
    let tab = null;
    let focused = null;
    let axTextboxCount = 0;
    while (Date.now() < focusDeadline && !focused?.ok) {
        tab = await ticketTab(ticketUrl);
        if (tab?.webSocketDebuggerUrl) {
            const focusedRaw = await evalJson(tab.webSocketDebuggerUrl, focusExpr, 4000);
            try {
                focused = JSON.parse(String(focusedRaw || ""));
            }
            catch {
                focused = null;
            }
            if (focused?.cancelled)
                break;
            if (focused?.found && Number.isFinite(Number(focused.x)) && Number.isFinite(Number(focused.y))) {
                // A synthetic HTMLElement.focus()/click() does not grant keyboard focus
                // inside Steam's parked BrowserView. Send trusted browser-level input at
                // the exact Slate editor coordinates, with focus emulation enabled.
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.bringToFront", {}, 2000);
                const point = { x: Number(focused.x), y: Number(focused.y) };
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseMoved", ...point }, 2000);
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 }, 2000);
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 }, 2000);
                const trustedRaw = await evalJson(tab.webSocketDebuggerUrl, focusExpr, 2500);
                try {
                    focused = JSON.parse(String(trustedRaw || ""));
                }
                catch { /* retry */ }
            }
        }
        if (!focused?.ok) {
            // Steam CEF can expose Discord's Slate composer to accessibility and
            // controller input without exposing a matching contenteditable element
            // to Runtime.evaluate. Focus the lowest/current textbox by its backing
            // DOM node in that case. This also works with localized names such as
            // Russian "ÐÐ°Ð¿Ð¸ÑÐ°Ñ‚ÑŒâ€¦".
            if (tab?.webSocketDebuggerUrl) {
                const ax = await cdpCommand$1(tab.webSocketDebuggerUrl, "Accessibility.getFullAXTree", {}, 3500);
                const boxes = (Array.isArray(ax?.nodes) ? ax.nodes : []).filter((node) => !node?.ignored && String(node?.role?.value || "").toLowerCase() === "textbox" && Number(node?.backendDOMNodeId) > 0);
                axTextboxCount = boxes.length;
                const named = boxes.filter((node) => /(?:message|write|send|Ð½Ð°Ð¿(?:Ð¸ÑÐ°Ñ‚ÑŒ|Ð¸ÑˆÐ¸Ñ‚Ðµ)|nachricht|mensaje|Ã©crire|scrivi|escrever|wiadomo)/i.test(String(node?.name?.value || "")));
                const composer = named[named.length - 1] || boxes[boxes.length - 1];
                if (composer?.backendDOMNodeId) {
                    const didFocus = await cdpCommand$1(tab.webSocketDebuggerUrl, "DOM.focus", { backendNodeId: composer.backendDOMNodeId }, 2500);
                    if (didFocus !== null)
                        focused = { ok: true, found: true, accessibility: true };
                }
            }
        }
        if (!focused?.ok) {
            invalidateDiscordTabCache();
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
    if (!focused?.ok && !focused?.found)
        return { success: false, cancelled: !!focused?.cancelled, error: focused?.error || `Discord ticket loaded, but exposed no editable composer (accessibility textboxes: ${axTextboxCount}).` };
    if (!tab?.webSocketDebuggerUrl)
        return { success: false, error: "The Discord ticket view disconnected before TLX1 could be entered." };
    // Steam's parked BrowserView can keep document.activeElement on the page
    // shell even though Chromium routes Input.insertText to Discord's visible
    // Slate editor. Treat the actual draft contents as authoritative instead of
    // rejecting a usable composer solely because activeElement is stale.
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.insertText", { text }, 3000);
    const draftExpr = `(function(){try{
    var expected=${JSON.stringify(text)};
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){return visible(e)&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
    boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
    var box=boxes[0];
    return !!box&&String(box.value||box.innerText||box.textContent||'').indexOf(expected)>=0;
  }catch(e){return false;}})()`;
    let draftEntered = !!(await evalJson(tab.webSocketDebuggerUrl, draftExpr, 2500));
    if (!draftEntered) {
        const ax = await cdpCommand$1(tab.webSocketDebuggerUrl, "Accessibility.getFullAXTree", {}, 3000);
        draftEntered = (Array.isArray(ax?.nodes) ? ax.nodes : []).some((node) => String(node?.role?.value || "").toLowerCase() === "textbox" && String(node?.value?.value || "").indexOf(text) >= 0);
    }
    if (!draftEntered) {
        // execCommand fires the beforeinput/input path used by Discord's Slate
        // editor and is a safe fallback when the parked view ignores insertText.
        await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
      boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
      var box=boxes[0];if(!box)return false;box.focus();
      if('value' in box){var set=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(box),'value');if(set&&set.set)set.set.call(box,${JSON.stringify(text)});else box.value=${JSON.stringify(text)};box.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:${JSON.stringify(text)}}));return true;}
      return document.execCommand('insertText',false,${JSON.stringify(text)});
    }catch(e){return false;}})()`, 2500);
        draftEntered = !!(await evalJson(tab.webSocketDebuggerUrl, draftExpr, 2500));
    }
    if (!draftEntered)
        return { success: false, error: "Discord displayed the ticket message box, but did not accept the TLX1 text. It remains available for manual copy." };
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
    const verifyExpr = `(function(){try{
    var expected=${JSON.stringify(text)};
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-30);
    for(var i=arts.length-1;i>=0;i--){var a=arts[i];if(String(a.innerText||'').indexOf(expected)<0)continue;var m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);return JSON.stringify({found:true,id:m&&m[2]||''});}
    var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){return visible(e)&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
    boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
    var box=boxes[0],rect=box&&box.getBoundingClientRect(),composer=!!box&&!!rect&&(rect.top>innerHeight*.45||!!box.closest('form,[class*="channelTextArea"],[class*="textArea"]'));
    var draft=String(composer&&(box.value||box.innerText||box.textContent)||'');
    return JSON.stringify({found:false,composer:composer,draftContains:draft.indexOf(expected)>=0});
  }catch(e){return JSON.stringify({found:false});}})()`;
    // Discord clears the Slate composer as soon as it accepts a message, but its
    // virtualized article list can mount that message several seconds later. A
    // single immediate DOM read therefore produced intermittent false failures.
    // Poll the exact saved ticket and never press Enter again: either the TLX1
    // article appears, or a persistently cleared composer proves that Discord
    // accepted the already-entered draft and the response waiter may take over.
    const verifyDeadline = Date.now() + 15000;
    let composerClearedAt = 0;
    while (Date.now() < verifyDeadline) {
        const verifyTab = await ticketTab(ticketUrl);
        if (verifyTab?.webSocketDebuggerUrl) {
            const appearedRaw = await evalJson(verifyTab.webSocketDebuggerUrl, verifyExpr, 3000);
            try {
                const appeared = JSON.parse(String(appearedRaw || ""));
                if (appeared?.found)
                    return { success: true, lastMessageId: String(appeared.id || "") || undefined };
                if (appeared?.composer && !appeared?.draftContains) {
                    if (!composerClearedAt)
                        composerClearedAt = Date.now();
                    if (Date.now() - composerClearedAt >= 1500)
                        return { success: true };
                }
                else
                    composerClearedAt = 0;
            }
            catch { }
        }
        await new Promise((r) => setTimeout(r, 400));
    }
    return { success: false, error: "Discord did not confirm that the TLX1 message was posted. It remains available for manual copy." };
}
async function waitForUbisoftVerificationConfirmation(ticketUrl, afterMessageId = "", timeoutMs = 2 * 60 * 1000, shouldAbort) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (shouldAbort?.())
            return { success: false, cancelled: true, error: "Waiting for Ubisoft verification was cancelled locally." };
        const tab = await ticketTab(ticketUrl);
        if (!tab?.webSocketDebuggerUrl) {
            const state = await probeTokeerTicketState(ticketUrl);
            if (state.closed)
                return { success: false, cancelled: true, error: state.reason || "The Discord ticket was closed." };
            await new Promise((r) => setTimeout(r, 1000));
            continue;
        }
        await forceTicketToNewest(tab);
        const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var after=${JSON.stringify(afterMessageId)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
      for(var i=0;i<arts.length;i++){
        var a=arts[i],m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=m&&m[2]||'';
        // A retry can post after the bot has already accepted this ticket.
        // Search newest-first and recover success before applying the send boundary.
        var text=String(a.innerText||'').replace(/\\s+/g,' ').trim();
        if(/verification\\s+passed|game\\s+files\\s+checked\\s+out|follow\\s+the\\s+next\\s+steps/i.test(text))return JSON.stringify({state:'passed',id:id});
        if(after&&id&&BigInt(id)<BigInt(after))continue;
        if(/verification\\s+failed|didn['â€™]?t\\s+pass\\s+validation|steam\\s+setup\\s+code|run\\s+tokeer\\s+verify-ubi/i.test(text))return JSON.stringify({state:'failed',id:id,error:text.slice(0,500)});
      }
      return JSON.stringify({state:'waiting'});
    }catch(e){return JSON.stringify({state:'error',error:String(e)});}})()`, 4000);
        try {
            const value = JSON.parse(String(raw || ""));
            if (value?.state === "passed")
                return { success: true, confirmed: true, lastMessageId: String(value.id || "") || undefined };
            if (value?.state === "failed")
                return { success: false, confirmed: false, lastMessageId: String(value.id || "") || undefined, error: String(value.error || "Ubisoft verification failed.") };
            if (value?.state === "error")
                return { success: false, error: String(value.error || "Could not read Ubisoft verification response.") };
        }
        catch { }
        await new Promise((r) => setTimeout(r, 1000));
    }
    return { success: false, error: "Timed out waiting for Ubisoft verification confirmation; no game files were changed." };
}
async function uploadTokeerTicketFile(ticketUrl, filePath, expectedFilename) {
    const filename = String(expectedFilename || "").trim();
    if (!/^token_req_\d+\.txt$/i.test(filename) || !String(filePath || "").endsWith(`/${filename}`)) {
        return { success: false, error: "The selected file is not a recognized Ubisoft token request." };
    }
    const deadline = Date.now() + 20000;
    let tab = null;
    let fileInputFound = false;
    let fileAccepted = false;
    while (Date.now() < deadline && !fileAccepted) {
        tab = await ticketTab(ticketUrl);
        if (!tab?.webSocketDebuggerUrl) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
        }
        const closed = await checkTokeerTicketState(ticketUrl);
        if (closed.closed)
            return { success: false, cancelled: true, error: closed.reason || "The Discord ticket was closed." };
        const assigned = await cdpSetDiscordFileInput(tab.webSocketDebuggerUrl, filePath);
        fileInputFound = fileInputFound || assigned.found;
        fileAccepted = assigned.accepted;
        if (!fileAccepted) {
            // Discord may mount its hidden file input only after the attachment
            // control is opened. Prefer structural classes so localized aria-labels
            // and composer placeholders do not affect attachment discovery.
            await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
        var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
        var composer=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],[contenteditable]')).filter(visible).sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;})[0];
        if(!composer)return false;var cr=composer.getBoundingClientRect();
        var structural=[].slice.call(document.querySelectorAll('[class*="attachButton"][role="button"],[class*="attachWrapper"] [role="button"]')).filter(visible);
        var buttons=structural.length?structural:[].slice.call(document.querySelectorAll('button,[role="button"]')).filter(visible).filter(function(b){var r=b.getBoundingClientRect();return r.bottom>=cr.top-24&&r.top<=cr.bottom+24&&r.right<=cr.left+24;});
        var b=buttons[buttons.length-1];if(!b)return false;b.click();return true;
      }catch(e){return false;}})()`, 2500);
            await new Promise((r) => setTimeout(r, 400));
        }
    }
    if (!tab?.webSocketDebuggerUrl || !fileInputFound)
        return { success: false, error: "Discord did not expose its attachment input in the saved ticket." };
    if (!fileAccepted)
        return { success: false, error: "Chromium did not accept the Ubisoft token request attachment." };
    const attachedDeadline = Date.now() + 10000;
    let attached = false;
    while (Date.now() < attachedDeadline && !attached) {
        attached = !!(await evalJson(tab.webSocketDebuggerUrl, `(function(){try{return String(document.body&&document.body.innerText||'').indexOf(${JSON.stringify(filename)})>=0;}catch(e){return false;}})()`, 2500));
        if (!attached)
            await new Promise((r) => setTimeout(r, 350));
    }
    if (!attached)
        return { success: false, error: "Discord did not show the token request in its attachment draft." };
    const composerPointRaw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var box=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],[contenteditable]')).filter(visible).sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;})[0];
    if(!box)return '';var r=box.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});
  }catch(e){return '';}})()`, 2500);
    try {
        const point = JSON.parse(String(composerPointRaw || ""));
        if (Number.isFinite(point?.x) && Number.isFinite(point?.y)) {
            await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", buttons: 1, clickCount: 1 }, 2000);
            await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", buttons: 0, clickCount: 1 }, 2000);
        }
    }
    catch { }
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
    await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
    const sentDeadline = Date.now() + 12000;
    while (Date.now() < sentDeadline) {
        const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var expected=${JSON.stringify(filename)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-15).reverse();
      for(var i=0;i<arts.length;i++){var a=arts[i],scope=a.closest('li')||a.parentElement||a,links=[].slice.call(scope.querySelectorAll('a[href]')),attached=false;for(var j=0;j<links.length;j++){var href=String(links[j].href||links[j].getAttribute('href')||''),label=String(links[j].innerText||links[j].textContent||'');try{href=decodeURIComponent(href);}catch(e){}if(/(?:cdn\\.discordapp\\.com|media\\.discordapp\\.net)\\/attachments\\//i.test(href)&&(href.indexOf(expected)>=0||label.indexOf(expected)>=0)){attached=true;break;}}if(!attached)continue;var m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);return JSON.stringify({found:true,id:m&&m[2]||''});}
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false});}})()`, 3000);
        try {
            const value = JSON.parse(String(raw || ""));
            if (value?.found)
                return { success: true, lastMessageId: String(value.id || "") || undefined };
        }
        catch { }
        await new Promise((r) => setTimeout(r, 500));
    }
    return { success: false, error: "Discord did not confirm that the Ubisoft token request was posted." };
}
async function waitForUbisoftDbdataLink(ticketUrl, afterMessageId = "", timeoutMs = 15 * 60 * 1000, shouldAbort) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (shouldAbort?.())
            return { success: false, cancelled: true, error: "Waiting for dbdata.json was cancelled locally." };
        const tab = await ticketTab(ticketUrl);
        if (!tab?.webSocketDebuggerUrl) {
            const state = await probeTokeerTicketState(ticketUrl);
            if (state.closed)
                return { success: false, cancelled: true, error: state.reason || "The Discord ticket was closed." };
            await new Promise((r) => setTimeout(r, 1500));
            continue;
        }
        await forceTicketToNewest(tab);
        const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var after=${JSON.stringify(afterMessageId)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-40).reverse();
      var trusted=function(value){try{var url=String(value||'');return /^https:\\/\\/(?:cdn\\.discordapp\\.com|media\\.discordapp\\.net)\\/attachments\\//i.test(url)&&/db(?:ata|data)\\.json/i.test(decodeURIComponent(url));}catch(e){return false;}};
      var reactUrl=function(node){
        try{
          var queue=[],seen=[],checked=0,put=function(value,depth){if(value==null||depth>7)return;if(typeof value==='string'){if(trusted(value))queue.unshift({url:value,depth:99});return;}if((typeof value!=='object'&&typeof value!=='function')||seen.indexOf(value)>=0)return;seen.push(value);queue.push({value:value,depth:depth});};
          for(var el=node,up=0;el&&up<6;el=el.parentElement,up++)Object.getOwnPropertyNames(el).filter(function(key){return /^__react(?:Props|Fiber)\\$/i.test(key);}).forEach(function(key){put(el[key],0);});
          while(queue.length&&checked++<900){var item=queue.shift();if(item.url)return item.url;var value=item.value,depth=item.depth,keys=[];try{keys=Object.keys(value);}catch(e){}for(var k=0;k<keys.length;k++){var key=keys[k],child;try{child=value[key];}catch(e){continue;}if(typeof child==='string'&&trusted(child))return child;if(depth<7&&/(?:url|href|link|component|data|item|props|memoizedProps|pendingProps|return|child|sibling)/i.test(key))put(child,depth+1);}}
        }catch(e){}
        return '';
      };
      for(var i=0;i<arts.length;i++){
        var a=arts[i],m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=m&&m[2]||'';
        // This is the exact saved private ticket. Search its mounted messages
        // idempotently instead of trusting one race-prone upload boundary: a
        // retry must recover dbdata that arrived before SLSDeck confirmed send.
        // Discord renders link-style message components beside the article in
        // the same list item, not as ordinary anchors inside the article.
        var scope=a.closest('li')||a.parentElement||a;
        var nodes=[].slice.call(scope.querySelectorAll('a[href],button,[role="button"],[role="link"]'));
        for(var j=0;j<nodes.length;j++){
          var n=nodes[j],label=String(n.innerText||n.textContent||n.getAttribute('aria-label')||n.getAttribute('title')||'').replace(/\\s+/g,' ').trim();
          if(!/(?:download\\s+)?db(?:ata|data)\\.json/i.test(label))continue;
          var link=n.closest('a[href]')||n.querySelector&&n.querySelector('a[href]')||null,href=String(link&&link.href||n.getAttribute&&n.getAttribute('href')||'');
          if(!trusted(href))href=reactUrl(n);
          if(trusted(href))return JSON.stringify({found:true,url:href,id:id});
          if(n.getBoundingClientRect){var rr=n.getBoundingClientRect();if(rr.width>0&&rr.height>0)return JSON.stringify({found:false,click:{x:rr.left+rr.width/2,y:rr.top+rr.height/2},id:id});}
        }
        var links=[].slice.call(scope.querySelectorAll('a[href]'));
        for(var l=0;l<links.length;l++){var direct=String(links[l].href||'');if(trusted(direct))return JSON.stringify({found:true,url:direct,id:id});}
      }
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`, 4000);
        try {
            const value = JSON.parse(String(raw || ""));
            if (value?.found && value.url)
                return { success: true, url: String(value.url), lastMessageId: String(value.id || "") || undefined };
            if (value?.click && Number.isFinite(value.click.x) && Number.isFinite(value.click.y)) {
                const captured = await cdpClickAndCaptureDbdata(tab.webSocketDebuggerUrl, Number(value.click.x), Number(value.click.y));
                if (captured)
                    return { success: true, url: captured, lastMessageId: String(value.id || "") || undefined };
            }
            if (value?.error)
                return { success: false, error: String(value.error) };
        }
        catch { }
        await new Promise((r) => setTimeout(r, 1500));
    }
    return { success: false, error: "Timed out waiting for Discord's dbdata.json download." };
}
async function clickTokeerGameWorked(ticketUrl, afterMessageId = "") {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        const tab = await ticketTab(ticketUrl);
        if (!tab?.webSocketDebuggerUrl) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
        }
        const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var after=${JSON.stringify(afterMessageId)},visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
      var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-40).reverse();
      for(var i=0;i<arts.length;i++){
        var a=arts[i],m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=m&&m[2]||'';
        if(after&&id&&BigInt(id)<BigInt(after))continue;
        var scope=a.closest('li')||a.parentElement||a,buttons=[].slice.call(scope.querySelectorAll('button,[role="button"]')).filter(visible);
        for(var j=buttons.length-1;j>=0;j--){var b=buttons[j],label=String(b.innerText||b.textContent||b.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();if(!/^game\\s+worked!?$/i.test(label))continue;if(b.disabled||b.getAttribute('aria-disabled')==='true')return JSON.stringify({found:true,disabled:true});try{b.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}var r=b.getBoundingClientRect();return JSON.stringify({found:true,x:r.left+r.width/2,y:r.top+r.height/2});}
      }
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`, 3500);
        try {
            const target = JSON.parse(String(raw || ""));
            if (target?.disabled)
                return { success: true };
            if (target?.found && Number.isFinite(Number(target.x)) && Number.isFinite(Number(target.y))) {
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Page.bringToFront", {}, 2000);
                const point = { x: Number(target.x), y: Number(target.y) };
                await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseMoved", ...point }, 2000);
                const down = await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 }, 2000);
                const up = await cdpCommand$1(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 }, 2000);
                if (down !== null && up !== null)
                    return { success: true };
            }
            if (target?.error)
                return { success: false, error: String(target.error) };
        }
        catch { }
        await new Promise((r) => setTimeout(r, 500));
    }
    return { success: false, error: "The latest Game worked! button was not found in the saved Discord ticket." };
}
async function waitForTokeerActivationCode(ticketUrl, timeoutMs = 15 * 60 * 1000, afterMessageId = "", shouldAbort) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (shouldAbort?.())
            return { success: false, cancelled: true, error: "Activation-code waiting was cancelled locally." };
        const tab = await ticketTab(ticketUrl);
        if (shouldAbort?.())
            return { success: false, cancelled: true, error: "Activation-code waiting was cancelled locally." };
        if (!tab?.webSocketDebuggerUrl) {
            const state = await probeTokeerTicketState(ticketUrl);
            if (state.closed)
                return { success: false, cancelled: true, error: state.reason || "The Discord ticket was closed." };
            await new Promise((r) => setTimeout(r, 1500));
            continue;
        }
        // A parked Steam BrowserView often remains virtualized at the submitted
        // TLX1 article. The bot response then exists in Discord but is not mounted
        // for querySelector until we jump/scroll to the newest edge.
        await forceTicketToNewest(tab);
        const expr = `(function(){try{
      var after=${JSON.stringify(afterMessageId)};
      var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-30).reverse();
      var page=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
      var recent=arts.slice(0,12).map(function(a){return String(a.innerText||'');}).join('\\n');
      if(/(?:ticket\\s+(?:has\\s+been|was|is(?:\\s+now)?)?\\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\\s+(?:this\\s+)?ticket)/i.test(recent))return JSON.stringify({found:false,cancelled:true,error:'The Discord ticket was cancelled or closed.'});
      if(/(?:unknown\\s+channel|channel\\s+(?:is\\s+)?unavailable|you\\s+(?:do\\s+not|don't)\\s+have\\s+access|no\\s+access\\s+to\\s+this\\s+channel)/i.test(page))return JSON.stringify({found:false,cancelled:true,error:'The Discord ticket channel no longer exists or is inaccessible.'});
      var common=/^(?:verify|setup|ticket|cancel|close|valid|code|redeem|tokeer|linux|steam|proton)$/i;
      for(var i=0;i<arts.length;i++){
        var a=arts[i], identity=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/), messageId=identity&&identity[2]||'';
        var text=String(a.innerText||'').replace(/\u00a0/g,' ').trim();
        var strongContext=/(?:here['â€™]?s\\s+your\\s+activation|your\\s+code)/i.test(text);
        // Normal responses must be newer than the submitted TLX1. On resume,
        // allow the unmistakable activation embed even if stale bookkeeping
        // accidentally saved its own ID as the boundary.
        if(after&&messageId&&BigInt(messageId)<=BigInt(after)&&!strongContext)continue;
        if(/TLX1\\./i.test(text))continue;
        var nodes=[].slice.call(a.querySelectorAll('code,pre')).map(function(n){return String(n.textContent||'').trim();});
        var contextual=strongContext||/(?:activation|redeem|single[- ]use|expires|30\\s*minutes?|verification\\s+(?:succeeded|complete))/i.test(text);
        // Discord renders the redemption instruction as one code block, for
        // example "~/.tokeer/tokeer 6JN745". Extract that explicit argument
        // before considering standalone six-character text from the embed.
        var commandCode=function(v){
          var m=String(v||'').match(/(?:^|\\s)(?:~\\/\\.tokeer\\/tokeer|\\/home\\/[^\\/\\s]+\\/\\.tokeer\\/tokeer|\\.\\/\\.tokeer\\/tokeer|tokeer)\\s+([A-Za-z0-9_-]{6})(?=$|\\s)/i);
          return m?m[1]:'';
        };
        var matches=nodes.map(commandCode).filter(Boolean);
        if(!matches.length){var fromCommand=commandCode(text);if(fromCommand)matches=[fromCommand];}
        if(!matches.length)matches=nodes.filter(function(v){return /^[A-Za-z0-9_-]{6}$/.test(v)&&!common.test(v);});
        if(!matches.length&&contextual){
          matches=(text.match(/(?:^|\\s|[:#])([A-Za-z0-9_-]{6})(?=$|\\s|[.,!])/g)||[]).map(function(v){var m=v.match(/([A-Za-z0-9_-]{6})/);return m?m[1]:'';}).filter(function(v){return v&&!common.test(v)&&/[A-Za-z]/.test(v)&&/\\d/.test(v);});
        }
        if(matches.length&&contextual)return JSON.stringify({found:true,code:matches[0],lastMessageId:messageId});
      }
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
        const raw = await evalJson(tab.webSocketDebuggerUrl, expr, 4000);
        try {
            const found = JSON.parse(String(raw || ""));
            if (found?.found && /^[A-Za-z0-9_-]{6}$/.test(String(found.code || "")))
                return { success: true, code: String(found.code), lastMessageId: String(found.lastMessageId || "") || undefined };
            if (found?.cancelled)
                return { success: false, cancelled: true, error: found.error || "The Discord ticket was cancelled." };
            if (found?.error)
                return { success: false, error: found.error };
        }
        catch { }
        if (shouldAbort?.())
            return { success: false, cancelled: true, error: "Activation-code waiting was cancelled locally." };
        await new Promise((r) => setTimeout(r, 1500));
    }
    return { success: false, error: "Timed out waiting for the six-character activation code. The ticket is still saved and can be resumed." };
}
async function cancelTokeerTicket(ticketUrl = "") {
    const clickCancel = `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var label=function(e){return String(e.innerText||e.textContent||e.getAttribute('aria-label')||e.getAttribute('title')||'').replace(/\\s+/g,' ').trim();};
    var danger=function(e){
      var meta=String(e.className||'')+' '+String(e.getAttribute('data-look')||'')+' '+String(e.getAttribute('data-variant')||'')+' '+String(e.getAttribute('aria-label')||'');
      if(/danger|red|negative|critical|destructive/i.test(meta))return true;
      var s=getComputedStyle(e), colors=[s.color,s.backgroundColor,s.borderColor].join(' '), nums=colors.match(/\\d+/g)||[];
      for(var i=0;i+2<nums.length;i+=3){var r=+nums[i],g=+nums[i+1],b=+nums[i+2];if(r>140&&r>g*1.35&&r>b*1.25)return true;}
      return false;
    };
    var click=function(e){var r=e.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;e.dispatchEvent(new C(n,p));});};
    var match=function(b){var t=label(b);return /(?:^|\\b)(?:(?:cancel|close|delete|abort)\\s+(?:this\\s+)?ticket|ticket\\s+(?:cancel|close|delete|abort))(?:\\b|$)/i.test(t);};
    var articles=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
    var target=null;
    for(var i=0;i<articles.length&&!target;i++){
      var inMessage=[].slice.call(articles[i].querySelectorAll('button,[role="button"]')).filter(visible);
      var strong=inMessage.filter(match), short=inMessage.filter(function(b){
      var t=label(b);if(!/^(?:cancel|close|delete|abort)$/i.test(t)||!danger(b))return false;
      var context=String(articles[i].innerText||'');
      return /ticket|activation|tokeer/i.test(context);
      });
      target=strong.filter(danger).slice(-1)[0]||strong.slice(-1)[0]||short.slice(-1)[0]||null;
    }
    if(!target)return JSON.stringify({ok:false,error:'The red Cancel Ticket button was not found in the open ticket.'});
    click(target);
    return JSON.stringify({ok:true,label:label(target)});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;
    const tab = await ticketTab(ticketUrl);
    let first = null;
    if (!tab?.webSocketDebuggerUrl)
        return { success: false, unavailable: true, error: "The exact saved Discord ticket thread could not be opened; no other channel was touched." };
    let raw = await evalJson(tab.webSocketDebuggerUrl, clickCancel, 4000);
    try {
        first = JSON.parse(String(raw || ""));
    }
    catch {
        first = null;
    }
    // Discord virtualizes older thread messages. Start at the newest rendered
    // messages, then walk upward until the newest available Cancel Ticket control
    // is found or the full thread has been checked.
    for (let attempt = 0; !first?.ok && attempt < 18; attempt++) {
        const moved = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var a=document.querySelector('[role="article"]'),s=a;
      while(s&&!(s.scrollHeight>s.clientHeight+20))s=s.parentElement;
      if(!s)return false;var before=s.scrollTop;
      s.scrollTop=Math.max(0,before-Math.max(280,Math.floor(s.clientHeight*.8)));
      return s.scrollTop!==before;
    }catch(e){return false;}})()`, 2000);
        if (!moved)
            break;
        await new Promise((r) => setTimeout(r, 350));
        raw = await evalJson(tab.webSocketDebuggerUrl, clickCancel, 4000);
        try {
            first = JSON.parse(String(raw || ""));
        }
        catch {
            first = null;
        }
    }
    if (!first?.ok || !tab?.webSocketDebuggerUrl)
        return { success: false, error: first?.error || "Could not press Cancel Ticket." };
    // Some ticket bots ask for a second confirmation in a modal.
    await new Promise((r) => setTimeout(r, 650));
    const confirmExpr = `(function(){try{
    var d=[].slice.call(document.querySelectorAll('[role="dialog"]')).find(function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;});
    if(!d)return false;
    var bs=[].slice.call(d.querySelectorAll('button,[role="button"]'));
    var danger=function(e){var m=String(e.className||'')+' '+String(e.getAttribute('data-look')||'')+' '+String(e.getAttribute('data-variant')||'');return /danger|red|negative|critical|destructive/i.test(m);};
    var b=bs.find(function(e){var t=String(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();return /^(?:confirm|yes)$/i.test(t)||/(?:^|\\b)(?:(?:cancel|close|delete|abort)\\s+(?:this\\s+)?ticket|ticket\\s+(?:cancel|close|delete|abort))(?:\\b|$)/i.test(t)||(danger(e)&&/^(?:close|delete|abort)$/i.test(t));});
    if(!b)return false;
    var r=b.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;b.dispatchEvent(new C(n,p));});
    return true;
  }catch(e){return false;}})()`;
    await evalJson(tab.webSocketDebuggerUrl, confirmExpr, 3000);
    return { success: true };
}
/** Connect the automation surface without putting Discord on screen. The
 * BrowserView shares Steam CEF's Discord session, so a prior visible login is
 * reused. */
async function connectTokeerDiscordHidden(fastRestore = false) {
    const releaseView = retainTokeerDiscordView();
    try {
        // Finish a pending destroy before deciding whether to reuse the old view.
        if (viewClosing)
            await viewClosing;
        // Reuse only our managed BrowserView. A normal Steam external-web tab may be
        // readable through CDP but cannot be repositioned inside the plugin page.
        if (await hasTokeerBrowserView()) {
            try {
                // Reuse only the CDP target tagged by createTokeerDiscordBrowserView.
                // A user's manual/login Discord tab is readable too, but it is not the
                // BrowserView that positionTokeerDiscordEmbedded() can move.
                const existing = await findManagedTokeerTab();
                if (existing?.webSocketDebuggerUrl && await navigateDiscordTabToTokeer(existing, fastRestore ? 3500 : 10000)) {
                    try {
                        await parkTokeerBrowserView();
                    }
                    catch { }
                    try {
                        await cdpCommand$1(existing.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
                    }
                    catch { }
                    return true;
                }
            }
            catch { }
        }
        // A restore follows an already-created ticket surface. If that managed view
        // disappeared, unlock the UI promptly and let the next normal refresh rebuild
        // it instead of spending another 12 seconds creating a BrowserView here.
        if (fastRestore)
            return false;
        try {
            const created = await createTokeerDiscordBrowserView();
            try {
                await parkTokeerBrowserView();
            }
            catch { }
            return !!created?.webSocketDebuggerUrl;
        }
        catch {
            return false;
        }
    }
    finally {
        releaseView();
    }
}
async function openTokeerDiscord() {
    // Hide a raw fallback view left by an older SLSDeck build. A visible raw
    // BrowserView has no Steam navigation chrome and traps the B button.
    try {
        await hideTokeerBrowserView();
    }
    catch { }
    // Visible login/manual path: Steam owns this page and supplies its normal
    // Back action. Silent automation uses connectTokeerDiscordHidden instead.
    try {
        const nav = DFL.Navigation;
        if (typeof nav?.NavigateToExternalWeb === "function") {
            nav.NavigateToExternalWeb(TOKEER_DISCORD_URL);
            return true;
        }
    }
    catch { }
    try {
        const SC = window.SteamClient;
        if (SC?.System?.OpenInSystemBrowser) {
            SC.System.OpenInSystemBrowser(TOKEER_DISCORD_URL);
            return true;
        }
    }
    catch { }
    return false;
}
/** Open DeDevision's invite. Discord itself asks for login when the shared
 * Steam-CEF Discord session is unauthenticated, then continues to the server. */
async function openDedevisionDiscordLogin() {
    try {
        await hideTokeerBrowserView();
    }
    catch { }
    try {
        const nav = DFL.Navigation;
        if (typeof nav?.NavigateToExternalWeb === "function") {
            nav.NavigateToExternalWeb(DEDEVISION_INVITE_URL);
            return true;
        }
    }
    catch { }
    try {
        const SC = window.SteamClient;
        if (SC?.System?.OpenInSystemBrowser) {
            SC.System.OpenInSystemBrowser(DEDEVISION_INVITE_URL);
            return true;
        }
    }
    catch { }
    return false;
}

const CACHE_KEY = "slsdeck.tokeerAvailability.v1";
const SESSION_KEY = "slsdeck.tokeerSession.v1";
const TOKEER_CACHE_TTL_MS = 60 * 60 * 1000;
const TOKEER_FIX_FRESH_MS = 2 * 60 * 1000;
function hasFreshTokeerFixCache(cache = readTokeerAvailabilityCache()) {
    return !!cache && Date.now() - cache.updatedAt < TOKEER_FIX_FRESH_MS;
}
function finite(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}
function normalizeTokeerGameName(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[Â®â„¢Â©]/g, "")
        // Discord and Steam disagree on straight/curly apostrophes surprisingly
        // often ("Assassinâ€™s", "Assassin's", "Assassins"). Apostrophes are part of
        // a word here, so removing them is more accurate than turning them into a
        // separator and producing the unmatchable "assassin s".
        .replace(/['â€™â€˜`Â´]/g, "")
        .replace(/[^a-z0-9]+/gi, " ")
        .trim()
        .toLowerCase();
}
function parseTokeerGameLabel(label) {
    const text = String(label || "").replace(/\s+/g, " ").trim();
    const availability = text.match(/^(.*?)\s+(\d+)\s+of\s+(\d+)\s+remaining(?:\s*\((\d+)%\))?/i);
    if (!availability)
        return null;
    const rawName = availability[1].trim();
    const appidMatch = text.match(/(?:app\s*id|appid)\s*[:#-]?\s*(\d{3,10})/i);
    const name = rawName
        .replace(/\s*[-â€“â€”(]*\s*(?:app\s*id|appid)\s*[:#-]?\s*\d{3,10}\)?\s*$/i, "")
        // Availability labels append the access tier before the bullet/count
        // (for example "Assassin's Creed Shadows Free â€¢ 6 of 10 remaining").
        // It is not part of the Discord ticket's game title.
        .replace(/\s+(?:Free|Donator|Premium|Elite)\s*[â€¢Â·|/-]*\s*$/i, "")
        .replace(/[â€¢Â·|]\s*$/g, "")
        .trim();
    return {
        label: text,
        name,
        remaining: finite(availability[2]),
        total: finite(availability[3]),
        percent: finite(availability[4]),
        appid: appidMatch ? finite(appidMatch[1]) : undefined,
    };
}
function readTokeerAvailabilityCache() {
    try {
        const value = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
        if (!value || value.version !== 1 || !Array.isArray(value.games))
            return null;
        if (!Number.isFinite(Number(value.updatedAt)) || Date.now() - Number(value.updatedAt) >= TOKEER_CACHE_TTL_MS) {
            try {
                window.localStorage.removeItem(CACHE_KEY);
            }
            catch { }
            return null;
        }
        return value;
    }
    catch {
        return null;
    }
}
function writeCache(state, games) {
    const deduped = new Map();
    for (const game of games) {
        const key = game.appid ? `appid:${game.appid}` : `name:${normalizeTokeerGameName(game.name)}`;
        if (!key.endsWith(":") && !deduped.has(key))
            deduped.set(key, game);
    }
    const cache = {
        version: 1,
        updatedAt: Date.now(),
        vault: {
            steamStatus: state.steamStatus,
            gamesListed: state.gamesListed,
            steamGames: state.steamGames,
            eaGames: state.eaGames,
            ubisoftGames: state.ubisoftGames,
            keysRemaining: state.keysRemaining,
            highDemand: state.highDemand,
        },
        games: Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
    try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        window.dispatchEvent(new CustomEvent("slsdeck-tokeer-cache", { detail: cache }));
    }
    catch { }
    return cache;
}
let refreshPromise = null;
let refreshGeneration = 0;
// Upper bound on one availability refresh. Generous enough for a slow Discord
// render, short enough that a stuck panel degrades to cached/unknown quickly
// instead of pinning the UI.
const REFRESH_BUDGET_MS = 25000;
function remaining(deadline, cap = 5000) {
    return Math.max(1, Math.min(cap, deadline - Date.now()));
}
async function beforeDeadline(work, deadline, fallback) {
    return Promise.race([
        work,
        new Promise((resolve) => setTimeout(() => resolve(fallback), remaining(deadline, REFRESH_BUDGET_MS))),
    ]);
}
function cancelTokeerAvailabilityRefresh() {
    refreshGeneration += 1;
    refreshPromise = null;
}
function activeTicketUrl() {
    try {
        const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
        if (!session || (session.expiresAt && Number(session.expiresAt) <= Date.now()))
            return "";
        return String(session.ticket?.url || "");
    }
    catch {
        return "";
    }
}
async function refreshTokeerAvailabilityCache(force = false) {
    const current = readTokeerAvailabilityCache();
    // Avoid hammering Discord within the short freshness window. After that,
    // callers still receive the cache immediately, but one background refresh is
    // started even though the six-hour cache remains usable as a fallback.
    if (!force && current && Date.now() - current.updatedAt < TOKEER_FIX_FRESH_MS)
        return current;
    const savedTicketUrl = activeTicketUrl();
    // No vault scrape, including a forced caller refresh, may navigate Discord
    // away from an active private ticket.
    if (savedTicketUrl)
        return current;
    if (refreshPromise)
        return refreshPromise;
    const generation = ++refreshGeneration;
    const run = (async () => {
        const releaseView = retainTokeerDiscordView();
        // Hard wall-clock budget for the WHOLE refresh. The old loop bounded only the
        // number of retries (20 x 500ms), but each readTokeerDiscord can itself take
        // seconds (target resolution + a 5s Runtime.evaluate), so a Discord page that
        // never renders the panel could hold this for minutes â€” which is what left
        // Fixes stuck on "checking" and starved every later call behind it.
        const deadline = Date.now() + REFRESH_BUDGET_MS;
        const outOfTime = () => Date.now() > deadline;
        const cancelled = () => generation !== refreshGeneration;
        try {
            if (!(await beforeDeadline(connectTokeerDiscordHidden(), deadline, false)))
                return force ? null : current;
            if (cancelled())
                return current;
            let state = await beforeDeadline(readTokeerDiscord(true), deadline, { found: false, selectors: [], error: "Discord snapshot timed out." });
            while (!state.found && !outOfTime() && !cancelled()) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                state = await beforeDeadline(readTokeerDiscord(true), deadline, { found: false, selectors: [], error: "Discord snapshot timed out." });
            }
            if (!state.found || cancelled())
                return force ? null : current;
            const parsed = [];
            for (const selector of state.selectors || []) {
                if (outOfTime() || cancelled())
                    break;
                const labels = await beforeDeadline(openSelectorAndReadOptions(selector.key || selector.index, remaining(deadline)), deadline, []);
                for (const label of labels) {
                    const game = parseTokeerGameLabel(label);
                    if (game && (game.remaining === undefined || game.remaining > 0))
                        parsed.push(game);
                }
            }
            // Do not replace a populated game cache with an empty scrape caused by a
            // temporarily unrendered Discord menu. Vault-only snapshots may still seed
            // a new cache on first use.
            if (cancelled())
                return current;
            if (!parsed.length && current?.games.length)
                return force ? null : current;
            return writeCache(state, parsed);
        }
        catch {
            return force ? null : current;
        }
        finally {
            if (savedTicketUrl) {
                try {
                    await restoreTokeerTicketView(savedTicketUrl);
                }
                catch { }
            }
            if (generation === refreshGeneration)
                refreshPromise = null;
            releaseView();
        }
    })();
    refreshPromise = run;
    if (!force && current) {
        void run.catch(() => null);
        return current;
    }
    return run;
}
const ROMAN_TO_ARABIC = {
    I: "1", II: "2", III: "3", IV: "4", V: "5", VI: "6", VII: "7",
    VIII: "8", IX: "9", X: "10", XI: "11", XII: "12", XIII: "13",
    XIV: "14", XV: "15", XVI: "16", XVII: "17", XVIII: "18", XIX: "19", XX: "20",
};
function decodeHtmlTitle(value) {
    return String(value || "")
        .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
        .replace(/&colon;/gi, ":").replace(/\s+on Steam$/i, "").trim();
}
function nameVariants(value) {
    const raw = String(value || "").replace(/_/g, " ").trim();
    if (!raw)
        return [];
    const roman = raw.split(/\s+/).map((word) => ROMAN_TO_ARABIC[word.toUpperCase()] || word).join(" ");
    const base = [
        normalizeTokeerGameName(raw),
        normalizeTokeerGameName(raw.replace(/[Â®â„¢Â©]/g, "")),
        normalizeTokeerGameName(roman),
    ].filter(Boolean);
    const aliases = [];
    for (const name of base) {
        // Tokeer's Discord menus commonly abbreviate the series while Steam uses
        // its full store title. Keep both forms in the shared matcher.
        if (/^assassins? creed\s+/.test(name))
            aliases.push(name.replace(/^assassins? creed\s+/, "ac "));
        if (/^ac\s+/.test(name))
            aliases.push(name.replace(/^ac\s+/, "assassins creed "));
        // The vault currently appends availability/marketing qualifiers that are
        // not part of Steam's library title (for example "Assassin's Creed Shadows
        // Free" and "Avatar: Frontiers of Pandora Free"). Match only when such a
        // qualifier is trailing, so meaningful words inside a title stay intact.
        aliases.push(name.replace(/\s+(?:(?:standard|deluxe|ultimate|complete) edition|free(?: trial)?|trial)$/i, ""));
    }
    return Array.from(new Set([...base, ...aliases].filter(Boolean)));
}
async function steamNameCandidates(appid, hint) {
    const values = new Set();
    if (hint)
        values.add(hint);
    try {
        const store = window.appStore;
        const overview = store?.GetAppOverviewByGameID?.(appid) ||
            store?.GetAppOverviewByAppID?.(appid);
        if (overview?.display_name)
            values.add(String(overview.display_name));
    }
    catch { }
    try {
        const response = await fetchNoCors(`https://store.steampowered.com/app/${encodeURIComponent(appid)}`, { method: "GET" });
        const html = await response.text();
        const title = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)/i)?.[1];
        if (title)
            values.add(decodeHtmlTitle(title));
        const slug = response.url?.match(/\/app\/\d+\/([^/?#]+)/i)?.[1] ||
            html.match(/<meta\s+property=["']og:url["']\s+content=["'][^"']*\/app\/\d+\/([^/"']+)/i)?.[1];
        if (slug)
            values.add(decodeURIComponent(slug).replace(/_/g, " "));
    }
    catch { }
    return Array.from(values);
}
async function resolveTokeerAvailabilityForGame(appid, gameName) {
    const cache = readTokeerAvailabilityCache();
    if (!cache)
        return null;
    const byAppid = cache.games.find((game) => game.appid === appid);
    if (byAppid)
        return byAppid;
    const candidates = new Set();
    for (const name of await steamNameCandidates(appid, gameName)) {
        for (const variant of nameVariants(name))
            candidates.add(variant);
    }
    return cache.games.find((game) => nameVariants(game.name).some((variant) => candidates.has(variant))) || null;
}
function getTokeerAvailabilityForGame(appid, gameName) {
    const cache = readTokeerAvailabilityCache();
    if (!cache)
        return null;
    const byAppid = cache.games.find((game) => game.appid === appid);
    if (byAppid)
        return byAppid;
    const wanted = new Set(nameVariants(gameName || ""));
    return wanted.size
        ? cache.games.find((game) => nameVariants(game.name).some((variant) => wanted.has(variant))) || null
        : null;
}

// Force Steam to download/update a game to its pinned build by launching it.
//
// Pinning a build only changes the *target* manifest; Steam won't fetch the new
// files until something makes it re-check. API "install|appid" reaches
// SLSsteam-added games through Moon's private per-user runtime socket. For an
// owned game it can still be a no-op, so "pinned, waiting for download" can sit
// forever. Launching makes Steam run its normal update-before-play check; when
// the installed manifest differs from the pinned target, the target build
// downloads first. Works for owned and added games alike.
//
// For a Steam app the RunGame gameId is just the appid (non-Steam shortcuts use a
// 64-bit gameID; we only pin real Steam apps here).
function launchGame(appid) {
    try {
        const SC = window.SteamClient;
        if (!SC?.Apps?.RunGame)
            return false;
        SC.Apps.RunGame(String(appid), "", -1, 100);
        return true;
    }
    catch {
        return false;
    }
}

const sleep$2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function describeTokeerFailure(result) {
    const checks = result.checks;
    // Dependency/preflight failures sometimes carry an all-false placeholder
    // check object because no verifier ran. Keep their actionable error (for
    // example a missing appmanifest) instead of misreporting four check failures.
    if (result.error && !/^Tokeer setup checks failed:/i.test(result.error)) {
        return result.error;
    }
    if (checks) {
        const failed = [];
        if (!checks.installed)
            failed.push("game installation");
        if (!checks.prefix)
            failed.push("Proton prefix");
        if (!checks.hook)
            failed.push("native hook");
        if (!checks.launchOpt)
            failed.push("launch option");
        if (failed.length) {
            const detected = checks.proton ? ` Detected compatibility layer: ${checks.proton}.` : "";
            return `Tokeer validation failed: ${failed.join(", ")}.${detected}`;
        }
        if (!result.code)
            return "Tokeer setup checks passed, but no TLX1 verification code was generated.";
    }
    if (result.error)
        return result.error;
    const output = (result.output || "").trim();
    if (output) {
        const exit = typeof result.returnCode === "number" ? ` (exit ${result.returnCode})` : "";
        return `Tokeer verifier failed${exit}.\n\nVerifier output:\n${output.slice(-12e3)}`;
    }
    return "Tokeer validation failed without a structured report or diagnostic output.";
}
/**
 * Restart-free Tokeer setup:
 *  1. update shared runtime only when its GitHub release changed;
 *  2. install upstream's exact GE-Proton requirement without editing VDF;
 *  3. select Proton and merge launch options through SteamClient live;
 *  4. launch only when the per-game prefix is still missing;
 *  5. run the official local verifier.
 */
async function setupAndVerifyTokeer(appid, onStatus, ubisoft = false) {
    onStatus?.("Confirming that the game is installedâ€¦");
    const preflight = await tokeerPreflight(appid, "");
    if (!preflight.success || !preflight.installed) {
        return {
            success: false,
            checks: { installed: false, prefix: false, hook: false, launchOpt: false, proton: null },
            error: preflight.error || "Game is not installed. Install it completely before using Tokeer.",
        };
    }
    onStatus?.("Checking Tokeer runtime versionâ€¦");
    const runtime = await tokeerEnsureRuntime();
    if (!runtime.success || !runtime.home) {
        return { success: false, error: runtime.error || "Could not install the Tokeer runtime." };
    }
    onStatus?.(runtime.updated
        ? `Tokeer ${runtime.version || "latest"} installed. Checking required Protonâ€¦`
        : `Tokeer ${runtime.version || "runtime"} is current; skipping download. Checking required Protonâ€¦`);
    const proton = await tokeerEnsureProton();
    if (!proton.success) {
        return {
            success: false,
            runtimeUpdated: !!runtime.updated,
            runtimeVersion: runtime.version,
            error: proton.error || `Could not install ${runtime.requiredProton || "GE-Proton10-34"}.`,
        };
    }
    const requiredProton = proton.name || runtime.requiredProton || "GE-Proton10-34";
    onStatus?.(proton.skipped
        ? `${requiredProton} is already installed and healthy; skipping download. Merging Steam launch options liveâ€¦`
        : `${requiredProton} installed/repaired. Selecting it and merging Steam launch options liveâ€¦`);
    const configured = await configureTokeerLaunch(appid, runtime.home, requiredProton);
    if (!configured.success) {
        return {
            success: false,
            runtimeUpdated: !!runtime.updated,
            runtimeVersion: runtime.version,
            proton: requiredProton,
            error: configured.error || "Could not configure Tokeer launch options.",
        };
    }
    onStatus?.("Checking the game setupâ€¦");
    // Steam's app-details/read-back cache can lag immediately after
    // SetAppLaunchOptions even though the write was accepted (and is already
    // visible in Settings). For this first verification, use the exact value we
    // just submitted. Subsequent/manual verification still reads Steam live.
    const justWrittenLaunchOptions = configured.options || getCurrentLaunchOptions(appid);
    let verified = await tokeerVerify(appid, ubisoft, justWrittenLaunchOptions);
    if (!verified.success && !verified.checks?.prefix) {
        onStatus?.("Creating the Proton prefix with one game launchâ€”Steam will stay openâ€¦");
        launchGame(appid);
        for (let attempt = 0; attempt < 30; attempt++) {
            await sleep$2(2000);
            const liveLaunchOptions = getCurrentLaunchOptions(appid);
            verified = await tokeerVerify(appid, ubisoft, liveLaunchOptions || justWrittenLaunchOptions);
            if (verified.success || verified.checks?.prefix)
                break;
        }
    }
    const result = {
        ...verified,
        runtimeUpdated: !!runtime.updated,
        runtimeVersion: runtime.version,
        proton: configured.proton || requiredProton,
        protonSkipped: !!proton.skipped,
        launchOptions: configured.options,
    };
    if (!result.success && !result.error)
        result.error = describeTokeerFailure(result);
    return result;
}

const inputStyle = { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,.25)", background: "rgba(0,0,0,.22)", color: "inherit" };
const checks = (v) => v?.checks || { installed: false, prefix: false, hook: false, launchOpt: false, proton: null };
const sleep$1 = (ms) => new Promise((r) => setTimeout(r, ms));
const TOKEER_SESSION_KEY = "slsdeck.tokeerSession.v1";
const TOKEER_AUTO_CONNECT_KEY = "slsdeck.tokeerAutoConnect.v1";
const TOKEER_SELECTOR_CACHE_KEY = "slsdeck.tokeerSelectorLayout.v1";
const TOKEER_VAULT_REFRESH_MS = 10 * 60 * 1000;
const TOKEER_SESSION_MS = 30 * 60 * 1000;
const TOKEER_PENDING_SELECTION_MS = 2 * 60 * 1000;
const TOKEER_GATE_WAIT_MS = 10 * 1000;
async function confirmTokeerLaunchedGameStarted(appid, shouldAbort) {
    const sessions = window.SteamClient?.GameSessions;
    const register = sessions?.RegisterForAppLifetimeNotifications;
    if (typeof register !== "function")
        return { confirmed: false, available: false, launched: false, error: "Steam does not expose game-lifetime confirmation on this client." };
    let resolveStarted = () => { };
    const started = new Promise((resolve) => { resolveStarted = resolve; });
    let subscription = null;
    try {
        subscription = register.call(sessions, (event) => {
            const eventAppid = Number(event?.unAppID ?? event?.appid ?? 0);
            if (eventAppid === Number(appid) && !!event?.bRunning)
                resolveStarted(true);
        });
    }
    catch (e) {
        return { confirmed: false, available: false, launched: false, error: `Steam game-lifetime confirmation could not be registered: ${String(e)}` };
    }
    try {
        const deadline = Date.now() + 45000;
        const fallbackAt = Date.now() + 5000;
        let fallbackRequested = false;
        while (Date.now() < deadline) {
            if (shouldAbort?.())
                return { confirmed: false, available: true, launched: fallbackRequested, error: "Game launch confirmation was paused." };
            try {
                const details = window.appDetailsStore?.GetAppDetails?.(Number(appid));
                if (details?.bIsRunning || details?.bRunning || details?.bIsLaunching)
                    return { confirmed: true, available: true, launched: true };
            }
            catch { }
            const confirmed = await Promise.race([started, sleep$1(500).then(() => false)]);
            if (confirmed)
                return { confirmed: true, available: true, launched: true };
            // The official Tokeer command normally opens steam://rungameid itself.
            // Decky's backend may not inherit a usable graphical/session launch path
            // on every SteamOS derivative, though. Give it a short grace period, then
            // ask the already-running Steam client to launch the same AppID directly.
            if (!fallbackRequested && Date.now() >= fallbackAt)
                fallbackRequested = launchGame(appid);
        }
        return {
            confirmed: false,
            available: true,
            launched: fallbackRequested,
            error: fallbackRequested
                ? "Steam accepted SLSDeck's fallback launch request, but never reported the game as started. The activation therefore cannot be confirmed."
                : "Neither Tokeer nor Steam started the game. The activation therefore cannot be confirmed.",
        };
    }
    finally {
        try {
            subscription?.unregister?.();
        }
        catch { }
    }
}
function readSavedSession() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(TOKEER_SESSION_KEY) || "null");
        // Older builds could clear the selected game while a late ticket scan
        // persisted the old ticket again. That orphan has no trustworthy game
        // identity and must not resurrect Prepare/Verify after an update.
        const orphanedTicket = !!parsed?.ticket && (parsed.ticket.found || parsed.ticket.opened || parsed.ticket.url) && !String(parsed.selectedGame || "").trim();
        const pendingSelectionExpired = !!parsed?.selectedGame && !parsed?.ticket?.url && ((parsed.selectionExpiresAt && Number(parsed.selectionExpiresAt) <= Date.now()) ||
            (!parsed.selectionExpiresAt && parsed.startedAt && Number(parsed.startedAt) + TOKEER_PENDING_SELECTION_MS <= Date.now()));
        // Preserve an expired real ticket for one render so the lifecycle cleanup
        // can close it in Discord before removing the local session.
        const completedSession = parsed?.automationStage === "done";
        if (!parsed || orphanedTicket || pendingSelectionExpired || completedSession) {
            window.localStorage.removeItem(TOKEER_SESSION_KEY);
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
function readAutoConnect() {
    try {
        // Existing vault data could only have been obtained through a successful
        // Discord connection. Older builds did not always persist the separate
        // auto-connect flag, so migrate that established state after an update.
        return window.localStorage.getItem(TOKEER_AUTO_CONNECT_KEY) === "1" || !!readTokeerAvailabilityCache();
    }
    catch {
        return false;
    }
}
function readSelectorLayout() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(TOKEER_SELECTOR_CACHE_KEY) || "null");
        if (!parsed?.found || !Array.isArray(parsed.selectors) || !parsed.selectors.length)
            return null;
        parsed.selectors = parsed.selectors.map((selector, index) => {
            const label = String(selector?.label || `Game menu ${index + 1}`);
            const kind = /ubi(?:soft)?/i.test(label) ? "ubisoft" : /(?:^|\b)ea(?:\b|\s*games?)/i.test(label) ? "ea" : /steam|linux|proton/i.test(label) ? "steam" : "other";
            return { ...selector, index: Number.isFinite(Number(selector?.index)) ? Number(selector.index) : index, key: String(selector?.key || `legacy:${kind}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`), kind: selector?.kind || kind };
        });
        return parsed;
    }
    catch {
        return null;
    }
}
function TokeerSection({ headless = false, activationRequest } = {}) {
    SP_REACT.useEffect(() => {
        const releaseView = retainTokeerDiscordView();
        return () => { cancelTokeerAvailabilityRefresh(); releaseView(); };
    }, []);
    const savedRef = SP_REACT.useRef(readSavedSession());
    const selectorLayoutRef = SP_REACT.useRef(readSelectorLayout());
    const sessionStartedRef = SP_REACT.useRef(savedRef.current?.startedAt || Date.now());
    const codeReceivedAtRef = SP_REACT.useRef(savedRef.current?.codeReceivedAt);
    const [discord, setDiscord] = SP_REACT.useState(selectorLayoutRef.current);
    const [availability, setAvailability] = SP_REACT.useState(readTokeerAvailabilityCache());
    const [runtime, setRuntime] = SP_REACT.useState(null);
    const [verify, setVerify] = SP_REACT.useState(savedRef.current?.verify || null);
    const [activation, setActivation] = SP_REACT.useState(savedRef.current?.activation || "");
    const [codeExpiresAt, setCodeExpiresAt] = SP_REACT.useState(savedRef.current?.expiresAt);
    const [clockNow, setClockNow] = SP_REACT.useState(Date.now());
    const [busy, setBusy] = SP_REACT.useState("");
    const [message, setMessage] = SP_REACT.useState(savedRef.current?.message || "");
    const [options, setOptions] = SP_REACT.useState({});
    const [selectedMenus, setSelectedMenus] = SP_REACT.useState(savedRef.current?.selectedMenus || {});
    const [selectedGame, setSelectedGame] = SP_REACT.useState(savedRef.current?.selectedGame || "");
    const [selectedUbisoft, setSelectedUbisoft] = SP_REACT.useState(!!savedRef.current?.selectedUbisoft);
    const [gate, setGate] = SP_REACT.useState(savedRef.current?.gate || null);
    const [ticket, setTicket] = SP_REACT.useState(savedRef.current?.ticket || null);
    const [discordSignedIn, setDiscordSignedIn] = SP_REACT.useState(false);
    const [discordAuthChecked, setDiscordAuthChecked] = SP_REACT.useState(false);
    const [autoConnect, setAutoConnect] = SP_REACT.useState(readAutoConnect);
    const [automationStage, setAutomationStage] = SP_REACT.useState(savedRef.current?.automationStage || "idle");
    const [tlxSubmitted, setTlxSubmitted] = SP_REACT.useState(!!savedRef.current?.tlxSubmitted);
    const [submittedTlx, setSubmittedTlx] = SP_REACT.useState(savedRef.current?.submittedTlx || "");
    const [automationError, setAutomationError] = SP_REACT.useState(savedRef.current?.automationError || "");
    const [hostedGames, setHostedGames] = SP_REACT.useState([]);
    const [ubisoftAppliedAt, setUbisoftAppliedAt] = SP_REACT.useState(Number(savedRef.current?.ubisoftAppliedAt || 0));
    const [ubisoftTokenPath, setUbisoftTokenPath] = SP_REACT.useState(savedRef.current?.ubisoftTokenPath || "");
    const [ubisoftTokenMessageId, setUbisoftTokenMessageId] = SP_REACT.useState(savedRef.current?.ubisoftTokenMessageId || "");
    const [quotaUntil, setQuotaUntil] = SP_REACT.useState(Number(savedRef.current?.quotaUntil || 0));
    const [maintenance, setMaintenance] = SP_REACT.useState(!!savedRef.current?.maintenance);
    const [selectionExpiresAt, setSelectionExpiresAt] = SP_REACT.useState(savedRef.current?.selectionExpiresAt);
    const [restoringSelectors, setRestoringSelectors] = SP_REACT.useState(!!selectorLayoutRef.current);
    const menuReadsRef = SP_REACT.useRef(new Set());
    const [ubisoftContinuationRunning, setUbisoftContinuationRunning] = SP_REACT.useState(false);
    const [ticketCompletionPaused, setTicketCompletionPaused] = SP_REACT.useState(false);
    const automationRunningRef = SP_REACT.useRef(false);
    const ticketCompletionPausedRef = SP_REACT.useRef(false);
    const ubisoftAutoContinueKeyRef = SP_REACT.useRef("");
    const ticketAbortedRef = SP_REACT.useRef(false);
    const ticketGenerationRef = SP_REACT.useRef(0);
    const selectedUbisoftRef = SP_REACT.useRef(!!savedRef.current?.selectedUbisoft);
    const loginPendingRef = SP_REACT.useRef(false);
    const expiryCleanupRef = SP_REACT.useRef(false);
    const vaultCarouselRef = SP_REACT.useRef(null);
    const [headlessArmed, setHeadlessArmed] = SP_REACT.useState(false);
    const headlessSelectingRef = SP_REACT.useRef(false);
    const checkpoint = (patch) => {
        try {
            const current = readSavedSession() || { startedAt: sessionStartedRef.current };
            const merged = { ...current, ...patch };
            savedRef.current = merged;
            window.localStorage.setItem(TOKEER_SESSION_KEY, JSON.stringify(merged));
        }
        catch { }
    };
    SP_REACT.useEffect(() => {
        if (!selectedGame && !ticket && !gate)
            return;
        const startedAt = sessionStartedRef.current;
        // Tokeer's 30-minute validity begins only after Discord returns the final
        // activation code. Selecting a game, opening a ticket and generating TLX1
        // must not consume that window.
        const codeReceivedAt = codeReceivedAtRef.current;
        const data = {
            startedAt, codeReceivedAt,
            expiresAt: codeExpiresAt,
            selectedGame, selectedUbisoft, selectedMenus, ticket, gate, activation, verify, message,
            automationStage, tlxSubmitted, submittedTlx, automationError,
            ubisoftAppliedAt, ubisoftTokenPath, ubisoftTokenMessageId, quotaUntil, maintenance, selectionExpiresAt,
        };
        try {
            savedRef.current = data;
            window.localStorage.setItem(TOKEER_SESSION_KEY, JSON.stringify(data));
        }
        catch { }
    }, [selectedGame, selectedUbisoft, selectedMenus, ticket, gate, activation, verify, message, codeExpiresAt, automationStage, tlxSubmitted, submittedTlx, automationError, ubisoftAppliedAt, ubisoftTokenPath, ubisoftTokenMessageId, quotaUntil, maintenance, selectionExpiresAt]);
    SP_REACT.useEffect(() => {
        tokeerUbisoftHostedGames().then((result) => setHostedGames(result.success ? result.games || [] : [])).catch(() => setHostedGames([]));
    }, []);
    SP_REACT.useEffect(() => {
        if (!codeExpiresAt && !quotaUntil && !selectionExpiresAt)
            return;
        const tick = () => setClockNow(Date.now());
        tick();
        const timer = setInterval(tick, 250);
        return () => clearInterval(timer);
    }, [codeExpiresAt, quotaUntil, selectionExpiresAt]);
    SP_REACT.useEffect(() => {
        const viewport = vaultCarouselRef.current;
        if (!viewport || (availability?.games.length || 0) < 2)
            return;
        let frame = 0;
        let last = performance.now();
        let position = viewport.scrollTop;
        let paused = false;
        const pause = () => { paused = true; position = viewport.scrollTop; };
        const resume = () => { paused = false; position = viewport.scrollTop; last = performance.now(); };
        const rotate = (now) => {
            const elapsed = Math.min(64, now - last);
            last = now;
            if (!paused && viewport.scrollHeight > viewport.clientHeight) {
                position += elapsed * 0.012;
                const loopHeight = viewport.scrollHeight / 2;
                if (position >= loopHeight)
                    position -= loopHeight;
                viewport.scrollTop = position;
            }
            frame = requestAnimationFrame(rotate);
        };
        viewport.addEventListener("pointerenter", pause);
        viewport.addEventListener("pointerleave", resume);
        viewport.addEventListener("focusin", pause);
        viewport.addEventListener("focusout", resume);
        frame = requestAnimationFrame(rotate);
        return () => {
            cancelAnimationFrame(frame);
            viewport.removeEventListener("pointerenter", pause);
            viewport.removeEventListener("pointerleave", resume);
            viewport.removeEventListener("focusin", pause);
            viewport.removeEventListener("focusout", resume);
        };
    }, [availability?.updatedAt, availability?.games.length]);
    const rememberDiscord = (state, markRestoringOnMiss = false) => {
        if (state.found && (state.selectors || []).length) {
            selectorLayoutRef.current = state;
            try {
                window.localStorage.setItem(TOKEER_SELECTOR_CACHE_KEY, JSON.stringify(state));
            }
            catch { }
            setDiscord(state);
            setRestoringSelectors(false);
            return;
        }
        // A ticket route or temporarily unmounted Discord message must not erase
        // the last confirmed selector layout. Explicit restoration callers may
        // keep it disabled; passive health checks leave working buttons enabled.
        if (selectorLayoutRef.current) {
            setDiscord(selectorLayoutRef.current);
            // Passive 15-second health checks frequently miss Discord's virtualized
            // message for one frame. Such a miss must not disable working buttons.
            if (markRestoringOnMiss)
                setRestoringSelectors(true);
        }
        else
            setDiscord(state);
    };
    const refreshDiscord = async () => {
        try {
            const [state, auth] = await Promise.all([readTokeerDiscord(), getDiscordSignInState()]);
            // A successfully parsed activation panel is stronger evidence than the
            // users/@me probe: Steam's Discord webview can block that API request even
            // while its authenticated channel DOM is fully available.
            // A network-blocked users/@me probe is "unknown", not "logged out".
            // Preserve a previously enabled silent connection unless Discord renders
            // an actual login route/form or returns an authentication rejection.
            const signedIn = auth.signedIn || state.found || (!auth.signedOut && readAutoConnect());
            if (auth.signedOut) {
                selectorLayoutRef.current = null;
                try {
                    window.localStorage.removeItem(TOKEER_SELECTOR_CACHE_KEY);
                }
                catch { }
                setDiscord(state);
                setRestoringSelectors(false);
            }
            else
                rememberDiscord(state);
            setDiscordSignedIn(signedIn);
            return { state, signedIn, authFound: auth.found };
        }
        catch {
            return null;
        }
    };
    const ticketChainActive = () => !!(ticket?.opened || ticket?.url || gate?.found);
    const ticketUsesUbisoftVerifier = (ctx) => selectedUbisoftRef.current || selectedUbisoft || !!ctx?.ubisoft || /(?:tokeer\s+verify-ubi\b|(?:^|\s)--ubi\b|\bUbiTokeer\b)/i.test(String(ctx?.rawText || ""));
    // Tokeer appends the access tier to some Ubisoft dropdown options (for
    // example "Assassin's Creed Shadows Free â€¢ 6 of 10 remaining"). Keep the
    // original value as the Discord click target, but do not present the tier as
    // though it were part of the game's name.
    const displayGameLabel = (label) => String(label || "")
        .replace(/\s+Free(?=\s*[â€¢Â·|/\-]*\s*\d+\s+of\s+\d+\s+remaining)/i, "")
        .trim();
    const refreshAvailability = async (force = false, announce = force) => {
        if (announce)
            setMessage(ticketChainActive() ? "Refreshing the live vault, then restoring your private ticketâ€¦" : "Refreshing live vault and game availabilityâ€¦");
        const value = await refreshTokeerAvailabilityCache(force);
        if (value) {
            setAvailability(value);
            // A selected dropdown label contains the availability count. Replace
            // that copied label from the same newly-written cache so the ticket card,
            // vault panel and Fixes surfaces no longer disagree.
            if (selectedGame) {
                const selectedName = parseTokeerGameLabel(selectedGame)?.name || selectedGame;
                const fresh = value.games.find((game) => normalizeTokeerGameName(game.name) === normalizeTokeerGameName(selectedName));
                if (fresh) {
                    const oldLabel = selectedGame;
                    setSelectedGame(fresh.label);
                    setSelectedMenus((menus) => Object.fromEntries(Object.entries(menus).map(([key, label]) => [
                        key, label === oldLabel || normalizeTokeerGameName(parseTokeerGameLabel(label)?.name || label) === normalizeTokeerGameName(selectedName) ? fresh.label : label,
                    ])));
                }
            }
            if (announce)
                setMessage(`Vault refreshed from Discord at ${new Date(value.updatedAt).toLocaleTimeString()}.`);
        }
        else if (announce)
            setMessage("Live Discord refresh failed; the previous cached values were left unchanged.");
        return value;
    };
    // Any sign-in transition detected anywhere (this panel, a background poll)
    // updates the button state, so it can never be left stale.
    SP_REACT.useEffect(() => {
        // Positive transitions can be trusted immediately. A negative users/@me
        // probe is reconciled by refreshDiscord with the live panel DOM before the
        // button is shown again.
        const onSignIn = (e) => { if (e?.detail) {
            setDiscordSignedIn(true);
            setDiscordAuthChecked(true);
        } };
        window.addEventListener("slsdeck-tokeer-signin", onSignIn);
        return () => window.removeEventListener("slsdeck-tokeer-signin", onSignIn);
    }, []);
    SP_REACT.useEffect(() => {
        if (readAutoConnect()) {
            try {
                window.localStorage.setItem(TOKEER_AUTO_CONNECT_KEY, "1");
            }
            catch { }
        }
        tokeerRuntimeStatus().then(setRuntime).catch(() => { });
        const openInBackground = async () => {
            // Preserve the managed target when resuming an unfinished ticket.
            if (savedRef.current?.ticket?.opened || savedRef.current?.ticket?.url || savedRef.current?.gate) {
                let observed = await refreshDiscord();
                // Decky/plugin updates can destroy the managed BrowserView without
                // clearing Discord's shared login cookies. "No CDP target" is not a
                // signed-out result: recreate the hidden view, then return it to the
                // exact saved ticket before the ticket probe runs.
                if (!observed?.authFound) {
                    const ok = await connectTokeerDiscordHidden();
                    if (ok && savedRef.current?.ticket?.url) {
                        try {
                            await restoreTokeerTicketView(savedRef.current.ticket.url);
                        }
                        catch { }
                    }
                    observed = await refreshDiscord();
                }
                return;
            }
            if (readAutoConnect()) {
                const ok = await connectTokeerDiscordHidden();
                let observed = await refreshDiscord();
                const deadline = Date.now() + 20000;
                while (ok && (!observed?.state.found || !(observed.state.selectors || []).length) && Date.now() < deadline) {
                    await sleep$1(500);
                    observed = await refreshDiscord();
                }
                if (ok) {
                    if (observed?.signedIn) {
                        const cached = await refreshTokeerAvailabilityCache(true);
                        if (cached) {
                            setAvailability(cached);
                            setDiscordSignedIn(true);
                        }
                        else
                            setMessage("Background Discord refresh failed. The previous vault cache was preserved; game Fixes will hide Tokeer until their own live check succeeds.");
                    }
                }
            }
            else {
                const observed = await refreshDiscord();
                if (observed?.signedIn)
                    await refreshAvailability(true, false);
            }
        };
        openInBackground().catch(() => { }).finally(() => setDiscordAuthChecked(true));
        const onCache = (event) => setAvailability(event?.detail || readTokeerAvailabilityCache());
        window.addEventListener("slsdeck-tokeer-cache", onCache);
        const t = setInterval(refreshDiscord, 15000);
        return () => { clearInterval(t); window.removeEventListener("slsdeck-tokeer-cache", onCache); };
    }, []);
    SP_REACT.useEffect(() => {
        // The mount path above performs the first live refresh. Continue only while
        // this Tokeer page is mounted, Discord is confirmed authenticated, and no
        // private ticket can be disrupted by a vault navigation.
        if (!discordAuthChecked || !discordSignedIn || ticketChainActive())
            return;
        let stopped = false, running = false;
        const refresh = async () => {
            if (stopped || running || ticketChainActive())
                return;
            running = true;
            try {
                const cached = await refreshTokeerAvailabilityCache(true);
                if (!stopped && cached)
                    setAvailability(cached);
            }
            finally {
                running = false;
            }
        };
        const timer = setInterval(() => { void refresh(); }, TOKEER_VAULT_REFRESH_MS);
        return () => { stopped = true; clearInterval(timer); };
    }, [discordAuthChecked, discordSignedIn, ticket?.opened, ticket?.url, gate?.found]);
    const remainingMs = codeExpiresAt ? Math.max(0, codeExpiresAt - clockNow) : 0;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;
    const countdownPct = codeExpiresAt ? Math.max(0, Math.min(100, remainingMs / TOKEER_SESSION_MS * 100)) : 0;
    const quotaRemainingSeconds = Math.max(0, Math.ceil((quotaUntil - clockNow) / 1000));
    const quotaDays = Math.floor(quotaRemainingSeconds / 86400);
    const quotaHours = Math.floor((quotaRemainingSeconds % 86400) / 3600);
    const quotaMinutes = Math.floor((quotaRemainingSeconds % 3600) / 60);
    const quotaSecs = quotaRemainingSeconds % 60;
    const quotaCountdown = [quotaDays ? `${quotaDays}d` : "", (quotaDays || quotaHours) ? `${quotaHours}h` : "", `${quotaMinutes}m`, `${quotaSecs}s`].filter(Boolean).join(" ");
    const updateActivation = (value) => {
        const next = value.trim();
        if (next && !codeReceivedAtRef.current) {
            const issued = Date.now();
            codeReceivedAtRef.current = issued;
            setCodeExpiresAt(issued + TOKEER_SESSION_MS);
            setClockNow(issued);
        }
        setActivation(next);
    };
    const openMenu = async (selectorKey, showMenu) => {
        if (menuReadsRef.current.has(selectorKey))
            return;
        menuReadsRef.current.add(selectorKey);
        try {
            // Discord populates component menus lazily. Retry only the requested
            // selector, keeping the rest of the Tokeer UI interactive.
            let items = [];
            const deadline = Date.now() + 6000;
            do {
                items = await openSelectorAndReadOptions(selectorKey, 2200);
                if (items.length)
                    break;
                if (Date.now() < deadline)
                    await sleep$1(250);
            } while (Date.now() < deadline);
            const selector = (discord?.selectors || []).find((entry) => entry.key === selectorKey);
            if (/ubi(?:soft)?/i.test(String(selector?.label || ""))) {
                let catalog = hostedGames;
                if (!catalog.length) {
                    const result = await tokeerUbisoftHostedGames().catch(() => null);
                    catalog = result?.success ? result.games || [] : [];
                    if (catalog.length)
                        setHostedGames(catalog);
                }
                const allowed = new Set(catalog.flatMap((game) => [game.name, ...(game.aliases || [])]).map(normalizeTokeerGameName));
                items = items.filter((label) => allowed.has(normalizeTokeerGameName(parseTokeerGameLabel(label)?.name || label)));
                if (!items.length)
                    setMessage(catalog.length ? "No currently hosted Ubisoft games were present in Discord's live selector." : "The hosted Ubisoft package catalog could not be loaded.");
            }
            setOptions((old) => ({ ...old, [selectorKey]: items }));
            if (items.length) {
                setMessage("");
                setTimeout(() => showMenu?.(), 0);
            }
            else {
                // Calling showMenu with no rgOptions produces Steam's misleading
                // Cancel-only dialog. Keep the panel open and report the real state.
                setMessage("Discord found the live selector, but its game entries are still loading. No empty menu was opened; try this selector again in a moment.");
            }
        }
        finally {
            menuReadsRef.current.delete(selectorKey);
        }
    };
    const connectHidden = async () => {
        if (ticketChainActive()) {
            setMessage("The private ticket is still open. Background vault connection is paused to preserve its command chain.");
            return;
        }
        setBusy("Connecting hidden Tokeer panelâ€¦");
        setMessage("Connecting to Discord in the background. Discord will stay hidden.");
        try {
            const ok = await connectTokeerDiscordHidden();
            if (!ok) {
                setMessage("Hidden Discord connection failed. Open Discord login once, sign in, press B, then retry.");
                return;
            }
            // Bound by wall clock, not iteration count: each scrape can itself take
            // seconds, so "30 tries" was really "up to several minutes of blocking",
            // and the panel had no way out of it.
            const deadline = Date.now() + 25000;
            let state = await readTokeerDiscord(true);
            while ((!state.found || !(state.selectors || []).length) && Date.now() < deadline) {
                await sleep$1(500);
                state = await readTokeerDiscord(true);
            }
            rememberDiscord(state, true);
            if (state.found) {
                const auth = await getDiscordSignInState();
                const signedIn = auth.signedIn || state.found;
                setDiscordSignedIn(signedIn);
                if (!signedIn) {
                    setMessage("Discord is not signed in yet. Use the DeDevision sign-in button, return here, then connect again.");
                    return;
                }
                try {
                    window.localStorage.setItem(TOKEER_AUTO_CONNECT_KEY, "1");
                }
                catch { }
                setAutoConnect(true);
                setMessage("Hidden Tokeer panel connected. Refreshing vault and availability cacheâ€¦");
                const cached = await refreshTokeerAvailabilityCache(true);
                if (cached)
                    setAvailability(cached);
                setMessage(cached ? `Vault cache updated: ${cached.games.length} available games.` : "Panel connected, but the game menus were not ready; the previous cache was preserved.");
            }
            else {
                setMessage(state.error || "Discord connected, but the activation panel is still loading.");
            }
        }
        catch (e) {
            setMessage(String(e));
        }
        finally {
            setBusy("");
        }
    };
    const clearPendingSelection = (reason) => {
        ticketGenerationRef.current += 1;
        ticketAbortedRef.current = true;
        automationRunningRef.current = false;
        try {
            window.localStorage.removeItem(TOKEER_SESSION_KEY);
        }
        catch { }
        selectedUbisoftRef.current = false;
        setSelectedGame("");
        setSelectedUbisoft(false);
        setSelectedMenus({});
        setOptions({});
        setGate(null);
        setTicket(null);
        setVerify(null);
        setActivation("");
        setSelectionExpiresAt(undefined);
        setCodeExpiresAt(undefined);
        setTlxSubmitted(false);
        setSubmittedTlx("");
        setAutomationStage("idle");
        setAutomationError("");
        setMessage(reason);
        setBusy("");
        codeReceivedAtRef.current = undefined;
        sessionStartedRef.current = Date.now();
        void restoreActivationPanel(ticketGenerationRef.current);
    };
    SP_REACT.useEffect(() => {
        if (!selectionExpiresAt || ticket?.url)
            return;
        const expire = () => clearPendingSelection("The pending Tokeer game selection expired before a ticket opened. The selection and local cache were cleared; select the game again.");
        const remaining = selectionExpiresAt - Date.now();
        if (remaining <= 0) {
            expire();
            return;
        }
        const timer = setTimeout(expire, remaining);
        return () => clearTimeout(timer);
    }, [selectionExpiresAt, ticket?.url]);
    const waitForGate = async () => {
        setGate(null);
        const deadline = Date.now() + TOKEER_GATE_WAIT_MS;
        let lastError = "";
        while (Date.now() < deadline) {
            const g = await readLatestTicketGate();
            if (g.found) {
                setGate(g);
                setMessage(g.disabled
                    ? "The ticket action is present. Press Create a ticket so SLSDeck can read Discord's exact quota response."
                    : "Tokeer is ready to open your private activation ticket.");
                return;
            }
            lastError = g.error || lastError;
            await sleep$1(500);
        }
        clearPendingSelection(lastError || "The agreement and tutorial confirmation did not appear, so the stale game selection and local Tokeer cache were cleared. Select the game again.");
    };
    const choose = async (selectorKey, label) => {
        setQuotaUntil(0);
        setBusy(`Checking whether ${label} is installedâ€¦`);
        const installed = await tokeerPreflight(0, label).catch(() => null);
        if (!installed?.success || !installed.installed) {
            const failure = installed?.error || "Could not verify that this game is installed.";
            setMessage(failure);
            toaster.toast({ title: "SLSDeck Â· Tokeer", body: failure.slice(0, 220) });
            setBusy("");
            return;
        }
        const installedAppid = Number(installed.appid || 0);
        if (installedAppid && hasLaunchRepoint(installedAppid)) {
            const removed = setLaunchRepoint(installedAppid, null);
            const warning = removed
                ? "SLSDeck removed the redirect-target fix from this game's launch options. Select the game again to continue; your other launch arguments were preserved."
                : "This game's launch options still contain the SLSDeck redirect-target fix. Remove it before selecting this game for Tokeer; other launch arguments may remain.";
            setMessage(warning);
            toaster.toast({ title: "SLSDeck Â· Tokeer", body: warning });
            setBusy("");
            return;
        }
        setBusy(`Selecting ${label} in Discordâ€¦`);
        const selector = discord?.selectors.find((entry) => entry.key === selectorKey);
        const fromUbisoftList = selector?.kind === "ubisoft" || /\bubi(?:soft)?\b/i.test(selector?.label || "");
        if (fromUbisoftList) {
            const normalized = normalizeTokeerGameName(parseTokeerGameLabel(label)?.name || label);
            const hosted = hostedGames.some((game) => [game.name, ...(game.aliases || [])].some((name) => normalizeTokeerGameName(name) === normalized));
            if (!hosted) {
                setMessage("This Ubisoft title is not in the hosted package catalog, so SLSDeck did not select it or open a ticket.");
                setBusy("");
                return;
            }
        }
        selectedUbisoftRef.current = fromUbisoftList;
        setSelectedUbisoft(fromUbisoftList);
        const pendingUntil = Date.now() + TOKEER_PENDING_SELECTION_MS;
        sessionStartedRef.current = Date.now();
        setSelectionExpiresAt(pendingUntil);
        setSelectedGame(label);
        setGate(null);
        setTicket(null);
        setVerify(null);
        setAutomationStage("idle");
        setTlxSubmitted(false);
        setSubmittedTlx("");
        setAutomationError("");
        setUbisoftAppliedAt(0);
        setUbisoftTokenPath("");
        setUbisoftTokenMessageId("");
        // Store the semantic selector identity. Moving the Discord component to a
        // different message or position no longer changes this key.
        setSelectedMenus((old) => ({ ...old, [selectorKey]: label }));
        const ok = await chooseSelectorOption(selectorKey, label);
        if (!ok) {
            clearPendingSelection("Discord selection failed, so SLSDeck cleared the stale game selection. Keep the Tokeer message open and select the game again.");
            return;
        }
        setBusy("Waiting for Tokeer confirmationâ€¦");
        setMessage(`Selected ${label}. Waiting for the newest bot messageâ€¦`);
        await waitForGate();
        setBusy("");
    };
    const restoreActivationPanel = async (generation = ticketGenerationRef.current) => {
        setRestoringSelectors(true);
        // Discord may spend several seconds redirecting away from a deleted private
        // thread before the Linux panel and its component menus are mounted.
        const finishBy = Date.now() + 20000;
        const within = (work, fallback) => Promise.race([
            work,
            sleep$1(Math.max(1, finishBy - Date.now())).then(() => fallback),
        ]);
        let restored = false;
        try {
            // Recreate the managed view if Steam discarded it while the ticket was
            // open. Fast restore used to return immediately in that case.
            if (!(await within(connectTokeerDiscordHidden(), false)))
                return;
            let state = await within(readTokeerDiscord(true, false), { found: false, selectors: [] });
            while ((!state.found || !(state.selectors || []).length) && Date.now() < finishBy) {
                await sleep$1(500);
                state = await within(readTokeerDiscord(true, false), { found: false, selectors: [] });
            }
            if (generation !== ticketGenerationRef.current)
                return;
            if (state.found && (state.selectors || []).length) {
                restored = true;
                rememberDiscord(state);
                setDiscordSignedIn(true);
                setDiscordAuthChecked(true);
            }
        }
        catch { }
        finally {
            if (generation === ticketGenerationRef.current) {
                setRestoringSelectors(false);
                if (!restored) {
                    // Do not expose cached selectors that point at controls from the old
                    // Discord document: opening one produces an empty modal with Cancel.
                    setDiscord((current) => current ? { ...current, found: false, selectors: [] } : current);
                    setMessage("The ticket was cleared, but Discord did not restore the Linux activation panel yet. Press Refresh to reconnect the live game list.");
                }
            }
        }
    };
    const abortTicketChain = (reason, restorePanel = true) => {
        ticketGenerationRef.current += 1;
        ticketAbortedRef.current = true;
        automationRunningRef.current = false;
        ticketCompletionPausedRef.current = true;
        setUbisoftContinuationRunning(false);
        try {
            window.localStorage.removeItem(TOKEER_SESSION_KEY);
        }
        catch { }
        selectedUbisoftRef.current = false;
        setSelectedGame("");
        setSelectedUbisoft(false);
        setSelectedMenus({});
        setOptions({});
        setTicket(null);
        setGate(null);
        setVerify(null);
        setActivation("");
        setSelectionExpiresAt(undefined);
        setCodeExpiresAt(undefined);
        setTlxSubmitted(false);
        setSubmittedTlx("");
        setUbisoftAppliedAt(0);
        setUbisoftTokenPath("");
        setUbisoftTokenMessageId("");
        // The chain is gone, so do not leave the old game/gate or an "aborted"
        // workflow card on screen. Keep only a concise Status explanation.
        setAutomationStage("idle");
        setAutomationError("");
        setMessage(reason);
        codeReceivedAtRef.current = undefined;
        sessionStartedRef.current = Date.now();
        setBusy("");
        toaster.toast({ title: "SLSDeck Â· Tokeer", body: reason.slice(0, 220) });
        // A deleted ticket leaves Discord parked on a dead child route. Reopen the
        // real Linux activation panel so its live selector buttons return without
        // requiring the user to leave and reopen SLSDeck.
        if (restorePanel)
            void restoreActivationPanel(ticketGenerationRef.current);
    };
    SP_REACT.useEffect(() => {
        if (!ticket?.url || automationStage === "done" || automationStage === "aborted")
            return;
        let stopped = false, checking = false;
        const inspect = async () => {
            if (stopped || checking)
                return;
            checking = true;
            try {
                const state = await checkTokeerTicketState(ticket.url);
                if (!stopped && state.closed)
                    abortTicketChain(`${state.reason || "The Discord ticket was closed."} Tokeer automation was aborted and its saved ticket state was cleared.`);
            }
            catch { }
            finally {
                checking = false;
            }
        };
        void inspect();
        const timer = setInterval(inspect, 3000);
        return () => { stopped = true; clearInterval(timer); };
    }, [ticket?.url, automationStage]);
    // On opening/restoring this tab, actively validate the saved private channel
    // once. Passive polling cannot classify a deleted ticket after Discord has
    // redirected its tab elsewhere.
    SP_REACT.useEffect(() => {
        if (!ticket?.url || automationStage === "done" || automationStage === "aborted")
            return;
        let stopped = false;
        const timer = setTimeout(async () => {
            try {
                const state = await probeTokeerTicketState(ticket.url);
                if (!stopped && state.closed)
                    abortTicketChain(`${state.reason || "The saved Discord ticket no longer exists."} Its stale Tokeer session was cleared.`);
            }
            catch { }
        }, 600);
        return () => { stopped = true; clearTimeout(timer); };
    }, [ticket?.url]);
    const markSteamTokeerApplied = async (appid) => {
        // Like Ubisoft completion, lock the installed depot manifests once the
        // activation succeeds. The key remains applied if Moon cannot write a pin.
        const applied = await tokeerMarkApplied(appid, parseTokeerGameLabel(selectedGame)?.name || selectedGame || `AppID ${appid}`, "steam", true);
        window.dispatchEvent(new CustomEvent("slsdeck-tokeer-applied", { detail: { appid } }));
        if (!applied.pin?.success) {
            toaster.toast({ title: "SLSDeck Â· Tokeer pin", body: `Activation applied, but version pinning failed: ${applied.pin?.error || "check the installed game and Moon in Fixes."}` });
        }
        return applied;
    };
    const runAutomation = async (ctx, resume, generation = ticketGenerationRef.current) => {
        if (automationRunningRef.current || !ctx.appid || !ctx.url)
            return;
        if (ticketAbortedRef.current || generation !== ticketGenerationRef.current)
            return;
        automationRunningRef.current = true;
        const releaseView = retainTokeerDiscordView();
        const stale = () => ticketAbortedRef.current || ticketCompletionPausedRef.current || generation !== ticketGenerationRef.current;
        const fail = (body) => {
            if (stale())
                return;
            setAutomationStage("failed");
            setAutomationError(body);
            setMessage(body);
            checkpoint({ automationStage: "failed", automationError: body, ticket: ctx });
            toaster.toast({ title: "SLSDeck Â· Tokeer automation", body: body.slice(0, 220) });
        };
        try {
            // Defence in depth for restored sessions: never run a Discord-derived
            // AppID when it disagrees with the installed game the user selected.
            if (selectedGame) {
                const expected = await tokeerPreflight(0, selectedGame);
                if (stale())
                    return;
                if (expected.success && expected.installed && expected.appid && Number(expected.appid) !== Number(ctx.appid)) {
                    fail(`Ignored mismatched ticket AppID ${ctx.appid}; ${selectedGame} is installed as Steam AppID ${expected.appid}. Re-scan the ticket commands.`);
                    return;
                }
            }
            let stage = resume?.automationStage || "preparing";
            let tlx = resume?.submittedTlx || "";
            let wasSubmitted = !!resume?.tlxSubmitted;
            const ubisoftTicket = !!ctx.ubisoft || ticketUsesUbisoftVerifier(ctx);
            // Steam/non-Ubisoft tickets have their own linear protocol. Keep it
            // independent from Ubisoft's hosted-package/token-request continuation:
            // TLX1 -> Discord redemption code -> local Tokeer redemption -> vouch.
            if (!ubisoftTicket) {
                let trackedTicket = { ...ctx };
                const ticketAppid = ctx.appid;
                const ticketUrl = ctx.url;
                // Both a fresh redemption and a restored session converge here. The
                // caller enters only after the single-use code has been redeemed, so a
                // resume at checking-game/confirming-worked can never redeem it twice.
                const completeNonUbisoftActivation = async (completionStage, tracked) => {
                    if (completionStage === "checking-game") {
                        setAutomationStage("checking-game");
                        setBusy("Launching the game and waiting for Steam confirmationâ€¦");
                        const checked = await confirmTokeerLaunchedGameStarted(ticketAppid, stale);
                        if (stale())
                            return;
                        if (!checked.confirmed) {
                            const body = `Tokeer accepted the redemption code, but SLSDeck could not prove that activation worked, so Game worked! was not pressed. ${checked.error || "Confirm it manually after testing the game."}`;
                            setAutomationError(body);
                            setMessage(body);
                            checkpoint({ automationStage: "checking-game", automationError: body, ticket: tracked });
                            return;
                        }
                        completionStage = "confirming-worked";
                        checkpoint({ automationStage: "confirming-worked", automationError: "", ticket: tracked });
                    }
                    if (completionStage !== "confirming-worked") {
                        fail(`Cannot complete a non-Ubisoft activation from stage ${completionStage}.`);
                        return;
                    }
                    setAutomationStage("confirming-worked");
                    setBusy("Confirming that the game worked in Discordâ€¦");
                    const vouched = await clickTokeerGameWorked(ticketUrl, tracked.lastMessageId || "");
                    if (stale())
                        return;
                    if (!vouched.success) {
                        const body = `The game launch was confirmed after Tokeer accepted the code, but Discord could not press Game worked! automatically: ${vouched.error || "button not found"}`;
                        setAutomationError(body);
                        setMessage(body);
                        checkpoint({ automationStage: "confirming-worked", automationError: body, ticket: tracked });
                        return;
                    }
                    setAutomationStage("done");
                    setAutomationError("");
                    setMessage("Tokeer activation was redeemed and Game worked! was confirmed in Discord. Launch the game from Steam.");
                    toaster.toast({ title: "SLSDeck Â· Tokeer", body: "Activation redeemed and Game worked! confirmed." });
                    try {
                        window.localStorage.removeItem(TOKEER_SESSION_KEY);
                    }
                    catch { }
                    selectedUbisoftRef.current = false;
                    setSelectedGame("");
                    setSelectedUbisoft(false);
                    setSelectedMenus({});
                    setGate(null);
                    setTicket(null);
                    setVerify(null);
                    setActivation("");
                    setCodeExpiresAt(undefined);
                    codeReceivedAtRef.current = undefined;
                    sessionStartedRef.current = Date.now();
                };
                // Redemption codes are single-use. Once local redemption succeeds we
                // persist this boundary and resume only through the shared completion.
                if (stage === "checking-game" || stage === "confirming-worked") {
                    await completeNonUbisoftActivation(stage, trackedTicket);
                    return;
                }
                if (stage === "redeeming" && resume?.activation) {
                    updateActivation(resume.activation);
                    setBusy("Redeeming saved Tokeer activationâ€¦");
                    const redeemed = await tokeerRedeem(resume.activation);
                    if (stale())
                        return;
                    if (!redeemed.success) {
                        fail(redeemed.error || redeemed.output || "Activation redemption failed.");
                        return;
                    }
                    await markSteamTokeerApplied(ctx.appid);
                    void refreshBadges();
                    stage = "checking-game";
                    checkpoint({ automationStage: "checking-game", automationError: "", ticket: trackedTicket });
                    await completeNonUbisoftActivation(stage, trackedTicket);
                    return;
                }
                if (stage !== "waiting-code" || !wasSubmitted) {
                    setAutomationStage("preparing");
                    setAutomationError("");
                    setBusy("Preparing and verifying Tokeer locallyâ€¦");
                    checkpoint({ automationStage: "preparing", automationError: "", ticket: ctx });
                    const preflight = await tokeerPreflight(ctx.appid, "");
                    if (stale())
                        return;
                    if (!preflight.success || !preflight.installed) {
                        fail(preflight.error || "Game is not installed; Discord was not sent a verification result.");
                        return;
                    }
                    const prepared = await setupAndVerifyTokeer(ctx.appid, setMessage, false);
                    if (stale())
                        return;
                    if (!prepared.success || !prepared.code) {
                        fail(describeTokeerFailure(prepared));
                        return;
                    }
                    tlx = prepared.code;
                    setVerify(prepared);
                    setSubmittedTlx(tlx);
                    checkpoint({ automationStage: "submitting", verify: prepared, submittedTlx: tlx, ticket: ctx });
                    setAutomationStage("submitting");
                    setBusy("Submitting verified TLX1 to the Discord ticketâ€¦");
                    const sent = await sendTokeerTicketMessage(ctx.url, tlx);
                    if (stale())
                        return;
                    if (sent.cancelled) {
                        abortTicketChain(`${sent.error || "The Discord ticket was cancelled."} Tokeer automation was aborted.`);
                        return;
                    }
                    if (!sent.success) {
                        fail(sent.error || "Could not submit TLX1 to Discord.");
                        return;
                    }
                    wasSubmitted = true;
                    setTlxSubmitted(true);
                    trackedTicket = { ...ctx, lastMessageId: sent.lastMessageId || ctx.lastMessageId };
                    setTicket((old) => ({ ...old, ...trackedTicket }));
                    setAutomationStage("waiting-code");
                    checkpoint({ automationStage: "waiting-code", tlxSubmitted: true, submittedTlx: tlx, verify: prepared, ticket: trackedTicket });
                }
                setAutomationStage("waiting-code");
                setBusy("Waiting for Discord activation codeâ€¦");
                setMessage("Local verification passed and TLX1 was submitted. Waiting for Tokeer's six-character redemption codeâ€¦");
                const received = await waitForTokeerActivationCode(ctx.url, 15 * 60 * 1000, trackedTicket.lastMessageId || ctx.lastMessageId || "", stale);
                if (stale())
                    return;
                if (received.cancelled) {
                    abortTicketChain(`${received.error || "The Discord ticket was cancelled."} Tokeer automation was aborted.`);
                    return;
                }
                if (!received.success || !received.code) {
                    fail(received.error || "No redemption code was detected.");
                    return;
                }
                trackedTicket = { ...trackedTicket, lastMessageId: received.lastMessageId || trackedTicket.lastMessageId };
                setTicket((old) => ({ ...old, ...trackedTicket }));
                updateActivation(received.code);
                setAutomationStage("redeeming");
                setBusy("Redeeming Tokeer activation locallyâ€¦");
                checkpoint({ automationStage: "redeeming", activation: received.code, codeReceivedAt: Date.now(), expiresAt: Date.now() + TOKEER_SESSION_MS, ticket: trackedTicket, tlxSubmitted: true, submittedTlx: tlx });
                const redeemed = await tokeerRedeem(received.code);
                if (stale())
                    return;
                if (!redeemed.success) {
                    fail(redeemed.error || redeemed.output || "Activation redemption failed. The received code is preserved for manual retry.");
                    return;
                }
                await markSteamTokeerApplied(ctx.appid);
                void refreshBadges();
                checkpoint({ automationStage: "checking-game", automationError: "", ticket: trackedTicket });
                await completeNonUbisoftActivation("checking-game", trackedTicket);
                return;
            }
            if (stage === "redeeming" && resume?.activation) {
                updateActivation(resume.activation);
                setBusy("Redeeming saved Tokeer activationâ€¦");
                const redeemed = await tokeerRedeem(resume.activation);
                if (stale())
                    return;
                if (!redeemed.success) {
                    fail(redeemed.error || redeemed.output || "Activation redemption failed.");
                    return;
                }
                await markSteamTokeerApplied(ctx.appid);
                void refreshBadges();
                setAutomationStage("done");
                setMessage("Tokeer activation was redeemed successfully. Launch the game from Steam.");
                try {
                    window.localStorage.removeItem(TOKEER_SESSION_KEY);
                }
                catch { }
                return;
            }
            const savedTicketId = String(resume?.ticket?.url || "").match(/\/channels\/\d+\/(\d+)/)?.[1] || "";
            const currentTicketId = String(ctx.url || "").match(/\/channels\/\d+\/(\d+)/)?.[1] || "";
            const resumeSubmittedUbisoft = ubisoftTicket && wasSubmitted && !!tlx && !!savedTicketId && savedTicketId === currentTicketId;
            let prepared = resume?.verify || verify;
            let sent = {
                success: true, lastMessageId: resumeSubmittedUbisoft ? (resume?.ticket?.lastMessageId || ctx.lastMessageId) : ctx.lastMessageId,
            };
            // Reuse a submission only for the same saved private Ubisoft ticket.
            // Every newly opened ticket must generate and post its own TLX1.
            if (!resumeSubmittedUbisoft) {
                setAutomationStage("preparing");
                setAutomationError("");
                setBusy("Preparing and verifying Tokeer locallyâ€¦");
                checkpoint({ automationStage: "preparing", automationError: "", ticket: ctx });
                const preflight = await tokeerPreflight(ctx.appid, "");
                if (stale())
                    return;
                if (!preflight.success || !preflight.installed) {
                    fail(preflight.error || "Game is not installed; Discord was not sent a verification result.");
                    return;
                }
                prepared = await setupAndVerifyTokeer(ctx.appid, setMessage, true);
                if (stale())
                    return;
                if (!prepared.success || !prepared.code) {
                    fail(describeTokeerFailure(prepared));
                    return;
                }
                tlx = prepared.code;
                setVerify(prepared);
                setSubmittedTlx(tlx);
                checkpoint({ automationStage: "submitting", verify: prepared, submittedTlx: tlx, ticket: ctx });
                setAutomationStage("submitting");
                setBusy("Submitting verified TLX1 to the Discord ticketâ€¦");
                sent = await sendTokeerTicketMessage(ctx.url, tlx);
                if (stale())
                    return;
                if (sent.cancelled) {
                    abortTicketChain(`${sent.error || "The Discord ticket was cancelled."} Tokeer automation was aborted.`);
                    return;
                }
                if (!sent.success) {
                    fail(sent.error || "Could not submit TLX1 to Discord.");
                    return;
                }
                wasSubmitted = true;
                setTlxSubmitted(true);
                checkpoint({ tlxSubmitted: true, ticket: { ...ctx, lastMessageId: sent.lastMessageId || ctx.lastMessageId } });
            }
            if (ubisoftTicket) {
                let catalog = hostedGames;
                let hosted = catalog.find((game) => Number(game.steamAppId) === Number(ctx.appid));
                if (!hosted) {
                    const result = await tokeerUbisoftHostedGames().catch(() => null);
                    catalog = result?.success ? result.games || [] : [];
                    if (catalog.length)
                        setHostedGames(catalog);
                    hosted = catalog.find((game) => Number(game.steamAppId) === Number(ctx.appid));
                }
                if (!hosted) {
                    fail(`Steam AppID ${ctx.appid} is not in the hosted Ubisoft package catalog; no game files were changed.`);
                    return;
                }
                setBusy("Waiting for Ubisoft verification confirmationâ€¦");
                setMessage("TLX1 was submitted. Waiting for Tokeer to confirm that Ubisoft verification passed before changing game filesâ€¦");
                const confirmation = await waitForUbisoftVerificationConfirmation(ctx.url, sent.lastMessageId || ctx.lastMessageId || "", 2 * 60 * 1000, stale);
                if (stale())
                    return;
                if (confirmation.cancelled) {
                    abortTicketChain(confirmation.error || "The Discord ticket was closed.");
                    return;
                }
                if (!confirmation.success || !confirmation.confirmed) {
                    fail(confirmation.error || "Ubisoft verification was not accepted; no game files were changed.");
                    return;
                }
                const confirmedTicket = { ...ctx, lastMessageId: confirmation.lastMessageId || sent.lastMessageId || ctx.lastMessageId };
                setTicket((old) => ({ ...old, ...confirmedTicket }));
                setAutomationStage("patching-ubisoft");
                setBusy("Applying the hosted Ubisoft packageâ€¦");
                checkpoint({ automationStage: "patching-ubisoft", tlxSubmitted: true, submittedTlx: tlx, verify: prepared, ticket: confirmedTicket });
                const applied = await tokeerApplyUbisoftPackage(ctx.appid);
                if (stale())
                    return;
                if (!applied.success || !applied.appliedAt) {
                    fail(applied.error || "The hosted Ubisoft package could not be applied.");
                    return;
                }
                const appliedAt = Number(applied.appliedAt);
                setUbisoftAppliedAt(appliedAt);
                setAutomationStage("waiting-token");
                checkpoint({ automationStage: "waiting-token", tlxSubmitted: true, submittedTlx: tlx, verify: prepared, ticket: confirmedTicket, ubisoftAppliedAt: appliedAt, ubisoftTokenPath: "", ubisoftTokenMessageId: "" });
                const continuationKey = `${confirmedTicket.url}:${appliedAt}`;
                ubisoftAutoContinueKeyRef.current = continuationKey;
                // Start monitoring before RunGame can dismiss this panel. The
                // continuation owns subsequent status text so a fast token upload is
                // not overwritten by the older launch-stage message.
                void continueUbisoftTicket({ ticket: confirmedTicket, appliedAt });
                const launched = launchGame(ctx.appid);
                if (!launched)
                    setMessage(`Verification was accepted locally and the hosted package was applied. Launch ${hosted.name}; SLSDeck is already monitoring for its token request.`);
                return;
            }
        }
        catch (e) {
            if (!stale())
                fail(String(e));
        }
        finally {
            releaseView();
            if (generation === ticketGenerationRef.current) {
                automationRunningRef.current = false;
                setBusy("");
            }
        }
    };
    const continueUbisoftTicket = async (resume) => {
        const activeTicket = resume?.ticket || ticket;
        const activeAppliedAt = Number(resume?.appliedAt || ubisoftAppliedAt);
        if (!activeTicket?.url || !activeTicket.appid || !activeAppliedAt)
            return setMessage("The saved Ubisoft activation state is incomplete; reopen the ticket flow.");
        const generation = ticketGenerationRef.current;
        ticketCompletionPausedRef.current = false;
        setTicketCompletionPaused(false);
        setUbisoftContinuationRunning(true);
        const stale = () => ticketAbortedRef.current || ticketCompletionPausedRef.current || generation !== ticketGenerationRef.current;
        automationRunningRef.current = true;
        try {
            let tokenPath = ubisoftTokenPath, tokenMessageId = ubisoftTokenMessageId, tracked = { ...activeTicket };
            if (tokenMessageId && tokenPath) {
                const savedFilename = String(tokenPath).split("/").pop() || "";
                const posted = savedFilename ? await findPostedTokeerTicketFile(activeTicket.url, savedFilename) : null;
                if (stale())
                    return;
                if (!posted?.success || !posted.found) {
                    tokenMessageId = "";
                    setUbisoftTokenMessageId("");
                    checkpoint({ automationStage: "waiting-token", ubisoftAppliedAt: activeAppliedAt, ubisoftTokenPath: tokenPath, ubisoftTokenMessageId: "", ticket: activeTicket });
                }
                else if (posted.lastMessageId) {
                    tokenMessageId = posted.lastMessageId;
                }
            }
            if (!tokenMessageId) {
                setAutomationStage("waiting-token");
                setBusy("Waiting for the Ubisoft token requestâ€¦");
                setMessage("The game is running. SLSDeck is monitoring for a fresh Ubisoft token request and will upload it automatically.");
                const tokenDeadline = Date.now() + 15 * 60 * 1000;
                let token = null;
                while (Date.now() < tokenDeadline && !stale()) {
                    const candidate = await tokeerFindUbisoftToken(activeTicket.appid, activeAppliedAt);
                    if (stale())
                        return;
                    if (candidate.success && candidate.found && candidate.path && candidate.filename) {
                        token = candidate;
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }
                if (stale())
                    return;
                if (!token) {
                    setAutomationStage("waiting-token");
                    setMessage("Automatic token monitoring stopped after 15 minutes. If the request file now exists, press Continue Ubisoft ticket to resume.");
                    return;
                }
                setAutomationStage("uploading-token");
                setBusy("Uploading the Ubisoft token requestâ€¦");
                tokenPath = token.path;
                setUbisoftTokenPath(tokenPath);
                checkpoint({ automationStage: "uploading-token", ubisoftAppliedAt: activeAppliedAt, ubisoftTokenPath: tokenPath, ubisoftTokenMessageId: "", ticket: activeTicket });
                setBusy("Checking the saved ticket for the Ubisoft token requestâ€¦");
                const alreadyPosted = await findPostedTokeerTicketFile(activeTicket.url, token.filename);
                if (stale())
                    return;
                if (alreadyPosted.success && alreadyPosted.found) {
                    tokenMessageId = alreadyPosted.lastMessageId || activeTicket.lastMessageId || "";
                }
                else {
                    setBusy("Uploading the Ubisoft token request to Discordâ€¦");
                    const uploaded = await uploadTokeerTicketFile(activeTicket.url, tokenPath, token.filename);
                    if (stale())
                        return;
                    if (uploaded.cancelled) {
                        abortTicketChain(uploaded.error || "The Discord ticket was closed.");
                        return;
                    }
                    if (!uploaded.success) {
                        setAutomationStage("waiting-token");
                        setMessage(uploaded.error || "The Ubisoft token request could not be uploaded.");
                        return;
                    }
                    tokenMessageId = uploaded.lastMessageId || activeTicket.lastMessageId || "";
                }
                setUbisoftTokenMessageId(tokenMessageId);
                tracked = { ...activeTicket, lastMessageId: tokenMessageId || activeTicket.lastMessageId };
                setTicket(tracked);
            }
            setBusy("Checking for already-installed Ubisoft activation dataâ€¦");
            let installed = await tokeerUbisoftDbdataStatus(activeTicket.appid, tokenPath);
            if (stale())
                return;
            let received = {};
            if (!installed.success || !installed.installed) {
                setAutomationStage("waiting-dbdata");
                setBusy("Waiting for Discord dbdata.jsonâ€¦");
                setMessage("The Ubisoft token request was uploaded. Waiting for Discord's Download dbdata.json responseâ€¦");
                checkpoint({ automationStage: "waiting-dbdata", ubisoftAppliedAt: activeAppliedAt, ubisoftTokenPath: tokenPath, ubisoftTokenMessageId: tokenMessageId, ticket: tracked });
                const response = await waitForUbisoftDbdataLink(activeTicket.url, tokenMessageId, 15 * 60 * 1000, stale);
                if (stale())
                    return;
                if (response.cancelled) {
                    abortTicketChain(response.error || "The Discord ticket was closed.");
                    return;
                }
                if (!response.success || !response.url) {
                    setAutomationStage("failed");
                    setAutomationError(response.error || "Discord did not return dbdata.json.");
                    setMessage(response.error || "Discord did not return dbdata.json.");
                    return;
                }
                received = response;
                setAutomationStage("installing-dbdata");
                setBusy("Installing dbdata.json beside the token requestâ€¦");
                installed = await tokeerInstallUbisoftDbdata(activeTicket.appid, tokenPath, response.url);
                if (stale())
                    return;
                if (!installed.success) {
                    setAutomationStage("failed");
                    setAutomationError(installed.error || "dbdata.json installation failed.");
                    setMessage(installed.error || "dbdata.json installation failed.");
                    return;
                }
            }
            const applied = await tokeerMarkApplied(activeTicket.appid, parseTokeerGameLabel(selectedGame)?.name || selectedGame || `AppID ${activeTicket.appid}`, "ubisoft", true, installed.path || "");
            void refreshBadges();
            const pinNote = applied.pin?.success
                ? " The installed build was pinned."
                : ` The key is applied, but version pinning failed${applied.pin?.error ? `: ${applied.pin.error}` : "."}`;
            setBusy("Confirming that the game worked in Discordâ€¦");
            const vouched = await clickTokeerGameWorked(activeTicket.url, received.lastMessageId || tracked.lastMessageId || "");
            if (stale())
                return;
            if (!vouched.success) {
                const completionMessage = `Ubisoft activation data was installed in ${installed.directory || "the token-request folder"}.${pinNote} Discord could not press Game worked! automatically: ${vouched.error || "button not found"}. Continue the Ubisoft ticket to retry, or confirm it manually in Discord.`;
                setAutomationStage("confirming-worked");
                setAutomationError("");
                setMessage(completionMessage);
                checkpoint({ automationStage: "confirming-worked", automationError: "", message: completionMessage, ubisoftAppliedAt: activeAppliedAt, ubisoftTokenPath: tokenPath, ubisoftTokenMessageId: tokenMessageId, ticket: { ...tracked, lastMessageId: received.lastMessageId || tracked.lastMessageId } });
                toaster.toast({ title: "SLSDeck Â· Tokeer", body: "Ubisoft activation data was installed; Discord confirmation still needs completion." });
                return;
            }
            const completionMessage = `Ubisoft activation completed. dbdata.json was installed in ${installed.directory || "the token-request folder"}.${pinNote} Game worked! was confirmed in Discord.`;
            setAutomationStage("done");
            setAutomationError("");
            setMessage(completionMessage);
            toaster.toast({ title: "SLSDeck Â· Tokeer", body: "Ubisoft dbdata.json installed and Game worked! confirmed." });
            try {
                window.localStorage.removeItem(TOKEER_SESSION_KEY);
            }
            catch { }
            selectedUbisoftRef.current = false;
            setSelectedGame("");
            setSelectedUbisoft(false);
            setSelectedMenus({});
            setGate(null);
            setTicket(null);
            setVerify(null);
            setActivation("");
            setCodeExpiresAt(undefined);
            setUbisoftAppliedAt(0);
            setUbisoftTokenPath("");
            setUbisoftTokenMessageId("");
            codeReceivedAtRef.current = undefined;
            sessionStartedRef.current = Date.now();
        }
        catch (e) {
            if (!stale()) {
                setAutomationStage("failed");
                setAutomationError(String(e));
                setMessage(String(e));
            }
        }
        finally {
            if (generation === ticketGenerationRef.current) {
                automationRunningRef.current = false;
                setUbisoftContinuationRunning(false);
                setBusy("");
            }
        }
    };
    SP_REACT.useEffect(() => {
        if (automationStage !== "waiting-token" || !ticket?.url || !ticket.appid || !ubisoftAppliedAt || ticketCompletionPausedRef.current)
            return;
        const isUbisoft = selectedUbisoftRef.current || selectedUbisoft || ticketUsesUbisoftVerifier(ticket);
        if (!isUbisoft)
            return;
        const key = `${ticket.url}:${ubisoftAppliedAt}`;
        if (ubisoftAutoContinueKeyRef.current === key)
            return;
        ubisoftAutoContinueKeyRef.current = key;
        void continueUbisoftTicket();
    }, [automationStage, ticket?.url, ticket?.appid, ubisoftAppliedAt, selectedUbisoft]);
    const pauseTicketCompletion = () => {
        ticketCompletionPausedRef.current = true;
        setTicketCompletionPaused(true);
        automationRunningRef.current = false;
        setUbisoftContinuationRunning(false);
        setBusy("");
        const resumeStage = selectedUbisoft
            ? (ubisoftTokenMessageId ? "waiting-dbdata" : "waiting-token")
            : automationStage;
        setAutomationStage(resumeStage);
        setAutomationError("");
        const pausedMessage = selectedUbisoft
            ? (ubisoftTokenMessageId
                ? "Ubisoft ticket completion paused. Press Continue Ubisoft ticket to resume searching for dbdata.json."
                : "Ubisoft ticket completion paused. Press Continue Ubisoft ticket to resume finding and uploading the token request.")
            : "Ticket completion paused. The saved stage will continue without resubmitting TLX1 or reusing a redeemed code.";
        setMessage(pausedMessage);
        checkpoint({ automationStage: resumeStage, automationError: "", ubisoftTokenPath, ubisoftTokenMessageId, ticket });
    };
    const openTicket = async () => {
        const generation = ++ticketGenerationRef.current;
        ticketAbortedRef.current = false;
        ticketCompletionPausedRef.current = false;
        setTicketCompletionPaused(false);
        cancelTokeerAvailabilityRefresh();
        setBusy("Opening Tokeer ticketâ€¦");
        setMessage("Pressing Discord's agreement and tutorial confirmation and waiting for the ticket/threadâ€¦");
        try {
            const installed = selectedGame ? await tokeerPreflight(0, selectedGame) : null;
            if (selectedGame && (!installed?.success || !installed.installed || !installed.appid)) {
                setMessage(installed?.error || "Could not resolve the selected installed game's Steam AppID.");
                return;
            }
            const expectedAppid = Number(installed?.appid || 0);
            const r = await clickLatestTicketGate();
            if (!r.success) {
                if (r.maintenance) {
                    setMaintenance(true);
                    setQuotaUntil(0);
                    setTicket(null);
                    setAutomationStage("idle");
                    setAutomationError("");
                    setMessage("Discord did not open a ticket because Tokeer's activation system is under maintenance.");
                    checkpoint({ maintenance: true, quotaUntil: 0, automationStage: "idle", automationError: "", ticket: null });
                    return;
                }
                if (r.quota) {
                    const waitSeconds = Math.max(1, Number(r.quotaWaitSeconds || 0));
                    const until = Date.now() + waitSeconds * 1000;
                    setQuotaUntil(until);
                    setTicket(null);
                    setAutomationStage("idle");
                    setAutomationError("");
                    setMaintenance(false);
                    setMessage("Discord did not open a ticket because this account's activation quota is still on cooldown.");
                    checkpoint({ maintenance: false, quotaUntil: until, automationStage: "idle", automationError: "", ticket: null });
                    return;
                }
                clearPendingSelection(`${r.error || "Could not press the Tokeer confirmation button."} The stale game selection and local cache were cleared; select the game again.`);
                return;
            }
            setMaintenance(false);
            setQuotaUntil(0);
            setSelectionExpiresAt(undefined);
            checkpoint({ maintenance: false, quotaUntil: 0, selectionExpiresAt: undefined });
            const expectedName = parseTokeerGameLabel(selectedGame)?.name || selectedGame;
            const ctx = await waitForTicketContext(r.fromUrl || "", 25000, expectedAppid, r.existingChannelIds || [], (discovered) => {
                // Cancellation should become available as soon as the thread exists;
                // Tokeer's AppID/setup commands can arrive a little later.
                if (generation === ticketGenerationRef.current && !ticketAbortedRef.current) {
                    const classified = { ...discovered, ubisoft: selectedUbisoftRef.current || discovered.ubisoft };
                    setTicket(classified);
                    checkpoint({ ticket: classified, selectedUbisoft: selectedUbisoftRef.current });
                }
            }, expectedName);
            if (generation !== ticketGenerationRef.current || ticketAbortedRef.current)
                return;
            const classifiedCtx = { ...ctx, ubisoft: selectedUbisoftRef.current || ctx.ubisoft };
            setTicket(classifiedCtx);
            if (classifiedCtx.found && classifiedCtx.appid) {
                setMessage(`Ticket opened for ${selectedGame || "selected game"}. Starting local preparation and automatic verification.`);
                await runAutomation(classifiedCtx, undefined, generation);
            }
            else {
                setMessage(classifiedCtx.error || "Ticket opened, but the AppID commands were not found yet.");
            }
        }
        catch (e) {
            if (generation === ticketGenerationRef.current && !ticketAbortedRef.current)
                setMessage(String(e));
        }
        finally {
            if (generation === ticketGenerationRef.current)
                setBusy("");
        }
    };
    const resumeTicket = async () => {
        if (!ticket?.url)
            return setMessage("The saved ticket URL is missing; show embedded Discord and reopen the ticket.");
        const generation = ++ticketGenerationRef.current;
        ticketAbortedRef.current = false;
        ticketCompletionPausedRef.current = false;
        setTicketCompletionPaused(false);
        setBusy("Resuming Tokeer ticketâ€¦");
        setMessage("Reopening the existing private ticket and scanning its generated commandsâ€¦");
        try {
            const state = await probeTokeerTicketState(ticket.url);
            if (generation !== ticketGenerationRef.current || ticketAbortedRef.current)
                return;
            if (state.closed) {
                abortTicketChain(`${state.reason || "The saved Discord ticket no longer exists."} Its stale Tokeer session was cleared.`);
                return;
            }
            const installed = selectedGame ? await tokeerPreflight(0, selectedGame) : null;
            const expectedAppid = Number(installed?.success && installed.installed ? installed.appid || 0 : 0);
            const expectedName = parseTokeerGameLabel(selectedGame)?.name || selectedGame;
            const ctx = await waitForTicketContext(ticket.url, 35000, expectedAppid, [], undefined, expectedName);
            if (generation !== ticketGenerationRef.current || ticketAbortedRef.current)
                return;
            const classifiedCtx = { ...ctx, ubisoft: selectedUbisoftRef.current || ctx.ubisoft };
            setTicket((old) => ({ ...old, ...classifiedCtx, url: classifiedCtx.url || old?.url, opened: true }));
            if (classifiedCtx.found && classifiedCtx.appid) {
                setMessage(`Commands detected. Resuming Tokeer automation for Steam AppID ${classifiedCtx.appid}.`);
                await runAutomation({ ...ticket, ...classifiedCtx, url: classifiedCtx.url || ticket.url, opened: true }, savedRef.current || undefined, generation);
            }
            else
                setMessage(classifiedCtx.error || "Ticket is open, but its AppID still was not found.");
        }
        catch (e) {
            if (generation === ticketGenerationRef.current && !ticketAbortedRef.current)
                setMessage(String(e));
        }
        finally {
            if (generation === ticketGenerationRef.current)
                setBusy("");
        }
    };
    // The Fixes menu uses this component without its full panel UI. It still
    // drives the exact same selector/ticket/automation state machine and the
    // same localStorage checkpoint as Advanced -> Tokeer helper. This prevents a
    // second, subtly different activation implementation from developing.
    SP_REACT.useEffect(() => {
        if (!headless || !headlessArmed || !activationRequest || selectedGame || gate || ticket || headlessSelectingRef.current)
            return;
        if (!discord?.found || (discord.selectors || []).length === 0)
            return;
        let stopped = false;
        const selectRequestedGame = async () => {
            headlessSelectingRef.current = true;
            setBusy(`Finding ${activationRequest.gameName} in Tokeerâ€¦`);
            setMessage("Reading the live Tokeer game selectorsâ€¦");
            try {
                const wantedName = normalizeTokeerGameName(activationRequest.gameName);
                for (const selector of discord.selectors || []) {
                    if (stopped)
                        return;
                    let items = [];
                    const deadline = Date.now() + 6000;
                    do {
                        items = await openSelectorAndReadOptions(selector.key || selector.index, 2200);
                        if (items.length || Date.now() >= deadline)
                            break;
                        await sleep$1(250);
                    } while (!stopped);
                    const match = items.find((label) => {
                        const parsed = parseTokeerGameLabel(label);
                        // Discord has used several separators between the game name, access
                        // tier and key count. Recover the name even when the strict
                        // availability parser does not recognize the newest formatting.
                        const fallbackName = String(label || "")
                            .replace(/\s+(?:(?:Free|Donator|Premium|Elite)\s*)?[â€¢Â·|/\\-]*\s*\d+\s+of\s+\d+\s+remaining(?:\s*\(\d+%\))?.*$/i, "")
                            .trim();
                        const candidateName = normalizeTokeerGameName(parsed?.name || fallbackName);
                        return Number(parsed?.appid || 0) === Number(activationRequest.appid)
                            || candidateName === wantedName;
                    });
                    if (match) {
                        setOptions((old) => ({ ...old, [selector.key]: items }));
                        await choose(selector.key, match);
                        return;
                    }
                }
                if (!stopped)
                    setMessage(`Tokeer is live, but ${activationRequest.gameName} was not found in its current game selectors. Refresh availability and try again.`);
            }
            catch (e) {
                if (!stopped)
                    setMessage(`Could not start Tokeer activation: ${String(e)}`);
            }
            finally {
                headlessSelectingRef.current = false;
                if (!stopped)
                    setBusy("");
            }
        };
        void selectRequestedGame();
        return () => { stopped = true; };
    }, [headless, headlessArmed, activationRequest?.appid, activationRequest?.gameName, discord?.found, discord?.selectors?.length, selectedGame, gate?.found, ticket?.url]);
    SP_REACT.useEffect(() => {
        // Fixes keeps its historical one-button flow, but only after the user
        // explicitly presses Activate with Tokeer in this mounted card.
        // headlessArmed is intentionally not persisted, so opening/restoring a page
        // can never create a ticket on its own.
        if (!headless || !headlessArmed || !gate?.found || ticket?.url || !selectedGame || busy)
            return;
        const timer = setTimeout(() => { void openTicket(); }, 100);
        return () => clearTimeout(timer);
    }, [headless, headlessArmed, gate?.found, ticket?.url, selectedGame, busy]);
    SP_REACT.useEffect(() => {
        const saved = savedRef.current;
        if (!saved?.ticket?.found || !saved.ticket.appid || !saved.ticket.url)
            return;
        if (!["preparing", "submitting", "waiting-code", "redeeming", "checking-game", "confirming-worked"].includes(saved.automationStage || ""))
            return;
        const generation = ++ticketGenerationRef.current;
        ticketAbortedRef.current = false;
        const timer = setTimeout(() => runAutomation(saved.ticket, saved, generation), 500);
        return () => clearTimeout(timer);
    }, []);
    const cancelTicket = async () => {
        if (!ticket?.url)
            return setMessage("No saved private ticket URL is available.");
        // Stop the long-running activation-code poll before it can navigate the
        // managed Discord view back to this ticket during cleanup.
        ticketAbortedRef.current = true;
        automationRunningRef.current = false;
        setBusy("Cancelling Tokeer ticketâ€¦");
        try {
            const r = await cancelTokeerTicket(ticket.url);
            if (!r.success) {
                const state = await probeTokeerTicketState(ticket.url);
                if (state.closed) {
                    abortTicketChain(`${state.reason || "The Discord ticket was already closed."} Its stale Tokeer session was cleared.`);
                    return;
                }
                if (r.unavailable) {
                    abortTicketChain("The exact saved Discord ticket no longer opens. The stale local Tokeer chain was cleared; no other Discord channel was touched. If the ticket still exists in Discord, close it there manually.");
                    return;
                }
                abortTicketChain(state.open
                    ? "The Discord ticket is still open, but no cancellation button was found after scanning the thread. Close it manually in Discord. The local Tokeer chain and cache were cleared."
                    : "SLSDeck could not find a cancellation button or confirm that the Discord ticket closed. Check Discord and close it manually if it remains. The local Tokeer chain and cache were cleared.");
                return;
            }
            abortTicketChain("Ticket cancelled in Discord. The saved Tokeer session was cleared.");
        }
        catch (e) {
            abortTicketChain(`Discord cancellation failed unexpectedly (${String(e)}). Check the ticket and close it manually if it remains. The local Tokeer chain and cache were cleared.`);
        }
        finally {
            setBusy("");
        }
    };
    SP_REACT.useEffect(() => {
        if (!codeExpiresAt || codeExpiresAt > clockNow) {
            if (!codeExpiresAt)
                expiryCleanupRef.current = false;
            return;
        }
        if (expiryCleanupRef.current)
            return;
        expiryCleanupRef.current = true;
        ticketAbortedRef.current = true;
        automationRunningRef.current = false;
        const expiredTicketUrl = ticket?.url || "";
        // The code is already unusable, so clear the local chain immediately. Do
        // not make the UI wait while Discord searches for a button in a thread the
        // user may already have closed manually.
        abortTicketChain("The Tokeer activation code expired. The selected game and local cache were cleared.", false);
        void (async () => {
            let closed = false;
            if (expiredTicketUrl) {
                try {
                    const visible = await checkTokeerTicketState(expiredTicketUrl);
                    // Only run the expensive Cancel-button search when the exact child
                    // thread is still rendered and demonstrably open.
                    if (visible.open)
                        closed = !!(await cancelTokeerTicket(expiredTicketUrl)).success;
                    else
                        closed = visible.closed;
                }
                catch { }
            }
            if (closed)
                setMessage("The Tokeer activation code expired. Its Discord ticket was closed and the selected game and local cache were cleared.");
            await restoreActivationPanel(ticketGenerationRef.current);
        })();
    }, [codeExpiresAt, clockNow, ticket?.url]);
    const resolveTicketAppid = async () => {
        const generation = ticketGenerationRef.current;
        const current = Number(ticket?.appid || 0);
        let expected = 0;
        if (selectedGame) {
            const installed = await tokeerPreflight(0, selectedGame).catch(() => null);
            if (!installed?.success || !installed.installed || !installed.appid) {
                setMessage(installed?.error || "Could not resolve the selected installed game's Steam AppID.");
                return 0;
            }
            expected = Number(installed.appid);
        }
        if (current && (!expected || current === expected))
            return current;
        // Repair sessions saved by the old broad parser (for example a year such
        // as 2026 mistaken for an AppID) before either manual action can touch it.
        if (ticket?.url && expected) {
            setMessage(`Saved ticket AppID ${current || "is missing"}; re-scanning its setup commands for AppID ${expected}â€¦`);
            const expectedName = parseTokeerGameLabel(selectedGame)?.name || selectedGame;
            const rescanned = await waitForTicketContext(ticket.url, 20000, expected, [], undefined, expectedName);
            if (generation !== ticketGenerationRef.current || ticketAbortedRef.current)
                return 0;
            if (rescanned.found && Number(rescanned.appid) === expected) {
                setTicket(old => ({ ...old, ...rescanned, appid: expected, url: rescanned.url || old?.url, opened: true }));
                return expected;
            }
            setMessage(rescanned.error || `The ticket does not contain setup commands for ${selectedGame} (Steam AppID ${expected}). Cancel it and open a new ticket.`);
            return 0;
        }
        setMessage("Open or resume the Tokeer ticket so SLSDeck can read and validate its Steam AppID.");
        return 0;
    };
    const prepare = async () => {
        const resolvedAppid = await resolveTicketAppid();
        if (!resolvedAppid)
            return;
        setBusy("Preparing Tokeerâ€¦");
        setMessage(`Preparing ${selectedGame || `AppID ${resolvedAppid}`} using the validated AppID supplied by the Tokeer ticket. Steam will stay open.`);
        try {
            const r = await setupAndVerifyTokeer(resolvedAppid, setMessage, ticketUsesUbisoftVerifier(ticket));
            if (r.success) {
                setVerify(r);
                setMessage(`Tokeer prepared without restarting Steam. ${r.runtimeUpdated ? "Runtime updated; " : "Runtime already current; "}${r.proton || "Proton Experimental"} selected, launch options merged, and TLX1 generated.`);
            }
            else {
                const failure = describeTokeerFailure(r);
                setVerify(null);
                setMessage(failure);
                toaster.toast({ title: "SLSDeck Â· Tokeer", body: failure.slice(0, 220) });
            }
            setRuntime(await tokeerRuntimeStatus());
        }
        catch (e) {
            setMessage(String(e));
        }
        finally {
            setBusy("");
        }
    };
    const runVerify = async () => {
        const resolvedAppid = await resolveTicketAppid();
        if (!resolvedAppid)
            return;
        setBusy("Verifying setupâ€¦");
        try {
            const preflight = await tokeerPreflight(resolvedAppid, "");
            if (!preflight.success || !preflight.installed) {
                const failure = preflight.error || "Game is not installed.";
                setVerify(null);
                setMessage(failure);
                toaster.toast({ title: "SLSDeck Â· Tokeer", body: failure.slice(0, 220) });
                return;
            }
            const r = await tokeerVerify(resolvedAppid, ticketUsesUbisoftVerifier(ticket), getCurrentLaunchOptions(resolvedAppid));
            if (r.success) {
                setVerify(r);
                setMessage("Setup verified. Copy the TLX1 and paste it into the open Discord ticket.");
            }
            else {
                const failure = describeTokeerFailure(r);
                setVerify(null);
                setMessage(failure);
                toaster.toast({ title: "SLSDeck Â· Tokeer", body: failure.slice(0, 220) });
            }
        }
        catch (e) {
            setMessage(String(e));
        }
        finally {
            setBusy("");
        }
    };
    const copyTlx = async () => {
        if (!verify?.code)
            return;
        try {
            await navigator.clipboard.writeText(verify.code);
            setMessage("TLX1 copied. Paste it into the open Tokeer ticket.");
        }
        catch {
            setMessage("Could not copy automatically; use the TLX1 shown below.");
        }
    };
    const redeem = async () => {
        if (!activation.trim())
            return setMessage("Paste the activation code from Discord first.");
        const resolvedAppid = await resolveTicketAppid();
        if (!resolvedAppid)
            return;
        setBusy("Writing activation ticketâ€¦");
        try {
            const r = await tokeerRedeem(activation.trim());
            setMessage(r.success ? "Activation written successfully. Launch the game from Steam." : (r.error || r.output || "Activation failed."));
            if (r.success) {
                await markSteamTokeerApplied(resolvedAppid);
                void refreshBadges();
                if (ticket?.url) {
                    const tracked = { ...ticket };
                    setAutomationStage("checking-game");
                    checkpoint({ automationStage: "checking-game", automationError: "", ticket: tracked });
                    const checked = await confirmTokeerLaunchedGameStarted(resolvedAppid, () => ticketCompletionPausedRef.current || ticketAbortedRef.current);
                    if (!checked.confirmed) {
                        const body = `Activation written successfully, but SLSDeck could not prove that the game started, so Game worked! was not pressed. ${checked.error || "Confirm it manually after testing the game."}`;
                        setAutomationError(body);
                        setMessage(body);
                        checkpoint({ automationStage: "checking-game", automationError: body, ticket: tracked });
                        return;
                    }
                    setAutomationStage("confirming-worked");
                    checkpoint({ automationStage: "confirming-worked", automationError: "", ticket: tracked });
                    const vouched = await clickTokeerGameWorked(tracked.url, tracked.lastMessageId || "");
                    if (!vouched.success) {
                        const body = `Activation written successfully, but Discord could not press Game worked! automatically: ${vouched.error || "button not found"}`;
                        setAutomationError(body);
                        setMessage(body);
                        checkpoint({ automationStage: "confirming-worked", automationError: body, ticket: tracked });
                        return;
                    }
                    setMessage("Activation written successfully and Game worked! confirmed in Discord. Launch the game from Steam.");
                }
                try {
                    window.localStorage.removeItem(TOKEER_SESSION_KEY);
                }
                catch { }
                selectedUbisoftRef.current = false;
                setSelectedGame("");
                setSelectedUbisoft(false);
                setSelectedMenus({});
                setGate(null);
                setTicket(null);
                setVerify(null);
                setActivation("");
                setCodeExpiresAt(undefined);
                sessionStartedRef.current = Date.now();
                codeReceivedAtRef.current = undefined;
            }
        }
        catch (e) {
            setMessage(String(e));
        }
        finally {
            setBusy("");
        }
    };
    const c = checks(verify || undefined);
    const activeUbisoftTicket = selectedUbisoft || ticketUsesUbisoftVerifier(ticket);
    const ubisoftContinuationStage = ["waiting-token", "uploading-token", "waiting-dbdata", "installing-dbdata", "confirming-worked", "failed"].includes(automationStage);
    if (headless) {
        const savedGame = displayGameLabel(selectedGame || activationRequest?.availabilityLabel || activationRequest?.gameName || "");
        const resumable = !!ticket?.url || !!gate?.found || !!selectedGame;
        const isUbisoftTicket = !!ticket?.url && (selectedUbisoft || ticketUsesUbisoftVerifier(ticket));
        const continueUbisoftFromFixes = isUbisoftTicket && ubisoftAppliedAt > 0
            && ["waiting-token", "uploading-token", "waiting-dbdata", "installing-dbdata", "confirming-worked", "failed"].includes(automationStage);
        const ticketProcessRunning = !!ticket?.url && !ticketCompletionPaused
            && (automationRunningRef.current || ubisoftContinuationRunning || !!busy);
        const cancelling = ticketAbortedRef.current && !!busy;
        const resumeFromFixes = () => {
            setHeadlessArmed(true);
            if (continueUbisoftFromFixes) {
                void continueUbisoftTicket();
                return;
            }
            if (ticket?.url) {
                void resumeTicket();
                return;
            }
            if (gate?.found) {
                void openTicket();
                return;
            }
            if (selectedGame) {
                void waitForGate();
            }
        };
        return SP_JSX.jsxs("div", { style: { border: "1px solid rgba(202,168,255,.28)", borderRadius: 8, padding: 8, background: "rgba(202,168,255,.06)" }, children: [SP_JSX.jsxs("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: ["Tokeer activation", activationRequest?.remaining !== undefined ? ` Â· ${activationRequest.remaining}${activationRequest.total !== undefined ? ` / ${activationRequest.total}` : ""} keys available` : ""] }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: .72, lineHeight: 1.45, marginBottom: 7 }, children: resumable ? `Saved activation for ${savedGame || "this game"}. The same ticket and progress are available in Advanced â†’ Tokeer helper.` : `Runs the complete ${selectedUbisoft ? "Ubisoft" : "Tokeer"} activation chain and shares its ticket state with Advanced â†’ Tokeer helper.` }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: cancelling || ((!!busy || automationRunningRef.current) && !ticketProcessRunning), onClick: ticketProcessRunning ? cancelTicket : (resumable ? resumeFromFixes : () => setHeadlessArmed(true)), children: cancelling ? (busy || "Cancelling ticketâ€¦") : ticketProcessRunning ? "Cancel ticket" : busy || automationRunningRef.current ? (busy || `Activation: ${automationStage.replace("-", " ")}`) : ticket?.url ? (isUbisoftTicket ? "Continue Ubisoft ticket" : "Continue ticket") : "Activate with Tokeer" }), !!ticket?.url && !ticketProcessRunning && !cancelling && SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: cancelTicket, children: "Cancel ticket" }), automationStage !== "idle" && SP_JSX.jsxs("div", { style: { fontSize: 10, marginTop: 6, opacity: .78 }, children: ["Stage: ", SP_JSX.jsx("b", { children: automationStage.replace("-", " ") }), tlxSubmitted ? " Â· TLX1 submitted" : ""] }), message && SP_JSX.jsx("div", { style: { fontSize: 10, marginTop: 6, lineHeight: 1.4, color: automationError ? "#ff7b72" : "inherit" }, children: message })] });
    }
    return SP_JSX.jsxs("div", { style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }, children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Choose game in Tokeer", children: [!discordAuthChecked && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: .7 }, children: "Checking Discord connection\u2026" }) }), discordAuthChecked && !discordSignedIn && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: async () => {
                                if (loginPendingRef.current)
                                    return;
                                loginPendingRef.current = true;
                                setBusy("Waiting for Discord sign-inâ€¦");
                                setMessage("Opening DeDevision Discord. Sign in and accept the server invite, then press B to return.");
                                try {
                                    await openDedevisionDiscordLogin();
                                    if (await waitForDiscordSignIn()) {
                                        setDiscordSignedIn(true);
                                        setDiscordAuthChecked(true);
                                        setMessage("Discord signed in. You can connect Tokeer silently now.");
                                    }
                                    else
                                        setMessage("Discord sign-in was not detected. You can retry without opening duplicate login pages.");
                                }
                                finally {
                                    loginPendingRef.current = false;
                                    setBusy("");
                                }
                            }, children: "Sign in to DeDevision Discord" }) }), discordAuthChecked && discordSignedIn && !autoConnect && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: connectHidden, children: "Connect Tokeer silently" }) }), availability && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: 10, borderRadius: 9, background: "linear-gradient(145deg,rgba(28,43,66,.96),rgba(38,25,58,.92))", border: "1px solid rgba(157,198,255,.28)", boxShadow: "0 5px 18px rgba(0,0,0,.22)", fontSize: 11, lineHeight: 1.55, color: "#f7f9ff" }, children: [SP_JSX.jsx("div", { style: { fontSize: 14, fontWeight: 800, letterSpacing: .4, marginBottom: 8, color: "#fff" }, children: "Tokeer Vault" }), SP_JSX.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7 }, children: [
                                        ["Games listed", availability.vault.gamesListed ?? "?", "#72c7ff"],
                                        ["Keys remaining", availability.vault.keysRemaining ?? "?", "#74e6a2"],
                                        ["High demand", availability.vault.highDemand ?? "?", "#ff9b8f"],
                                        ["Available now", availability.games.length, "#d2a6ff"],
                                    ].map(([label, value, color]) => SP_JSX.jsxs("div", { style: { padding: "8px 9px", borderRadius: 7, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.09)" }, children: [SP_JSX.jsx("div", { style: { fontSize: 9, textTransform: "uppercase", letterSpacing: .7, opacity: .72 }, children: label }), SP_JSX.jsx("div", { style: { fontSize: 19, fontWeight: 900, lineHeight: 1.2, color: String(color), textShadow: `0 0 12px ${String(color)}55`, fontVariantNumeric: "tabular-nums" }, children: value })] }, String(label))) }), SP_JSX.jsxs("div", { style: { marginTop: 8, fontSize: 10, opacity: .7 }, children: ["Updated ", new Date(availability.updatedAt).toLocaleString()] }), SP_JSX.jsx("div", { ref: vaultCarouselRef, style: { marginTop: 7, height: 150, overflowY: "auto", padding: "6px 7px", borderRadius: 6, background: "rgba(0,0,0,.18)", maskImage: "linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%)" }, children: [0, 1].map(copy => SP_JSX.jsx("div", { "aria-hidden": copy === 1, children: availability.games.map((game, index) => SP_JSX.jsxs("div", { style: { padding: "2px 0", color: "#f2f5ff" }, children: [game.name, game.remaining !== undefined ? SP_JSX.jsx("span", { style: { color: "#74e6a2", fontWeight: 700 }, children: ` â€” ${game.remaining}/${game.total ?? "?"} keys` }) : ""] }, `${copy}:${game.appid || game.name}:${index}`)) }, copy)) })] }) }), availability && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", margin: "8px auto 0", padding: "10px 11px", borderRadius: 7, border: "1px solid rgba(255,70,70,.55)", background: "rgba(145,20,20,.2)", color: "#ff6666", fontSize: 11, fontWeight: 750, lineHeight: 1.5 }, children: [SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 850, marginBottom: 3 }, children: "Account safety" }), "Warning: attempts to abuse activation limits or share access may be detected through HWID and IP information and can result in account restrictions. Use only your own account and device."] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", marginTop: 8, marginBottom: 8, padding: "11px 12px", borderRadius: 8, background: "linear-gradient(135deg,rgba(255,183,77,.13),rgba(96,125,139,.12))", border: "1px solid rgba(255,193,94,.32)", boxShadow: "0 4px 14px rgba(0,0,0,.16)", fontSize: 11, lineHeight: 1.55, color: "#f4f6fa" }, children: [SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 850, marginBottom: 5, color: "#ffd180", letterSpacing: .15 }, children: "Before activation" }), SP_JSX.jsx("div", { children: "Finish preparing the game before redeeming it. Install any mods, texture packs, fixes, or other changes that modify the game files first." }), SP_JSX.jsx("div", { style: { marginTop: 5, opacity: .82 }, children: "Changing game files after activation is not advised, because it may invalidate the activated setup and require you to verify or recover the files again." }), SP_JSX.jsx("div", { style: { marginTop: 7, paddingTop: 7, borderTop: "1px solid rgba(255,255,255,.1)", fontSize: 10, opacity: .68 }, children: "SLSDeck mirrors the real Linux activation panel in your logged-in Discord Steam-CEF tab. Discord remains the source of truth for availability, remaining keys, and the Steam AppID." })] }) }), discord?.found && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", margin: "0 auto", padding: "9px 11px", borderRadius: 8, background: "linear-gradient(135deg,rgba(71,184,255,.18),rgba(88,220,143,.09))", border: "1px solid rgba(104,205,255,.35)", fontSize: 12, lineHeight: 1.6, color: "#f4fbff" }, children: [SP_JSX.jsxs("span", { style: { color: restoringSelectors ? "#ffd166" : "#65e69b", fontWeight: 800 }, children: ["\u25CF ", restoringSelectors ? "RESTORING GAME LISTâ€¦" : "LIVE"] }), " \u00B7 Steam: ", SP_JSX.jsx("b", { style: { color: "#fff" }, children: discord.steamStatus || "Unknown" })] }) }), (discord?.selectors || []).map(s => SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", margin: 0 }, children: SP_JSX.jsx(DFL.DropdownItem, { label: s.label || `Game menu ${s.index + 1}`, description: restoringSelectors ? "Restoring the live game list; this cached selector is temporarily disabled." : "Live game list from the Tokeer Discord panel", disabled: restoringSelectors || s.disabled || !!busy || ticketChainActive(), rgOptions: (options[s.key] || []).map(x => ({ data: x, label: displayGameLabel(x) })), selectedOption: selectedMenus[s.key] || selectedMenus[String(s.index)] || null, strDefaultLabel: s.label || "Choose a game", onMenuWillOpen: (showMenu) => openMenu(s.key, showMenu), onChange: (o) => choose(s.key, String(o.data)) }) }) }, s.key)), !discord?.found && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: .7 }, children: discord?.error || "Open the Linux activation message once and leave the Discord tab alive." }) })] }), (selectedGame || gate) && SP_JSX.jsxs(DFL.PanelSection, { title: "Open activation ticket", children: [selectedGame && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12 }, children: ["Selected: ", SP_JSX.jsx("b", { children: displayGameLabel(selectedGame) }), " \u00B7 Verifier: ", SP_JSX.jsx("b", { children: selectedUbisoft ? "Ubisoft" : "Steam" })] }) }), ticket?.opened
                        ? (!ticket.appid
                            ? SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy || !ticket.url, onClick: resumeTicket, children: "Resume existing ticket / detect commands" }) })
                            : null)
                        : gate?.found
                            ? SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: openTicket, children: "Create a ticket" }) })
                            : SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: waitForGate, children: "Refresh confirmation" }) }), quotaUntil > clockNow && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, fontWeight: 700, color: "#ffd166", lineHeight: 1.45 }, children: ["Your quota was depleted. Try again after ", quotaCountdown, "."] }) }), maintenance && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, fontWeight: 700, color: "#ffd166", lineHeight: 1.45 }, children: "Tokeer's activation system is currently under maintenance. Please try again later." }) }), ticket?.opened && ticket.url && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 10, opacity: .7 }, children: ["Private ticket saved. ", codeExpiresAt ? "Activation-code countdown is running." : "The 30-minute code timer has not started yet."] }) }), ticket?.opened && ticket.url && ((activeUbisoftTicket && ubisoftAppliedAt > 0 && (ubisoftContinuationRunning || ticketCompletionPaused || ubisoftContinuationStage)) ||
                        (!activeUbisoftTicket && ticket.appid && (ticketCompletionPaused || ["waiting-code", "checking-game", "confirming-worked"].includes(automationStage)))) && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: activeUbisoftTicket
                                ? (ubisoftContinuationRunning && !ticketCompletionPaused ? pauseTicketCompletion : continueUbisoftTicket)
                                : (ticketCompletionPaused ? resumeTicket : pauseTicketCompletion), children: activeUbisoftTicket
                                ? (ubisoftContinuationRunning && !ticketCompletionPaused ? "Pause ticket completion" : "Continue Ubisoft ticket")
                                : (ticketCompletionPaused ? "Continue ticket" : "Pause ticket completion") }) }), ticket?.opened && ticket.url && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy && !["Waiting for Discord activation codeâ€¦", "Waiting for Ubisoft verification confirmationâ€¦", "Waiting for Discord dbdata.jsonâ€¦"].includes(busy), onClick: cancelTicket, children: "Cancel ticket in Discord" }) }), ticket?.found && ticket.appid && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11 }, children: ["Ticket detected \u00B7 Steam AppID ", SP_JSX.jsx("b", { children: ticket.appid }), " (read automatically from Tokeer's commands)"] }) }), automationStage !== "idle" && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, lineHeight: 1.45 }, children: ["Automation: ", SP_JSX.jsx("b", { children: automationStage.replace("-", " ") }), tlxSubmitted ? " Â· TLX1 submitted" : "", automationError ? SP_JSX.jsx("div", { style: { color: "#ff7b72", marginTop: 3 }, children: automationError }) : null] }) })] }), selectedGame && ticket?.found && ticket.appid && !selectedUbisoft && SP_JSX.jsxs(DFL.PanelSection, { title: "Prepare & verify", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11 }, children: ["Runtime: ", SP_JSX.jsx("b", { children: runtime?.installed ? "Installed" : "Not prepared" }), " \u00B7 Default/free cooldown: ", SP_JSX.jsx("b", { children: "48 hours" })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: prepare, disabled: !!busy, children: "Prepare game" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: runVerify, disabled: !!busy, children: "Verify setup / generate TLX1" }) })] }), busy && SP_JSX.jsx(DFL.PanelSection, { title: "Working", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 14, height: 14, marginRight: 8 } }), busy] }) }) }), message && SP_JSX.jsx(DFL.PanelSection, { title: "Status", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, lineHeight: 1.45 }, children: message }) }) }), verify && SP_JSX.jsxs(DFL.PanelSection, { title: "Verify result", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, lineHeight: 1.7, width: "100%" }, children: [SP_JSX.jsxs("div", { children: [c.installed ? "âœ“" : "âœ—", " Game installed"] }), SP_JSX.jsxs("div", { children: [c.prefix ? "âœ“" : "âœ—", " Proton prefix"] }), SP_JSX.jsxs("div", { children: [c.hook ? "âœ“" : "âœ—", " Native hook"] }), SP_JSX.jsxs("div", { children: [c.launchOpt ? "âœ“" : "âœ—", " Launch option"] }), SP_JSX.jsxs("div", { children: ["Proton: ", SP_JSX.jsx("b", { children: c.proton || "unknown" })] })] }) }), verify.code && SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: copyTlx, children: "Copy TLX1 verification code" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 9, wordBreak: "break-all", maxHeight: 90, overflowY: "auto", opacity: .7 }, children: verify.code }) })] })] }), SP_JSX.jsx(DFL.PanelSection, { title: "Discord", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => openTokeerDiscord(), children: "Manual view" }) }) }), (ticket?.opened || !!activation || !!verify || automationStage !== "idle") && SP_JSX.jsxs(DFL.PanelSection, { title: "Redeem activation", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("input", { style: inputStyle, placeholder: "Activation code from Discord", value: activation, onChange: (e) => updateActivation(e.target.value) }) }), codeExpiresAt && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", padding: "4px 2px 8px" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: remainingMs > 0 ? "#fff" : "#ff5b5b" }, children: [SP_JSX.jsx("span", { children: remainingMs > 0 ? "Activation window" : "Activation code expired" }), SP_JSX.jsx("span", { style: { fontVariantNumeric: "tabular-nums" }, children: countdown })] }), SP_JSX.jsx("div", { style: { height: 7, marginTop: 6, borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,.14)" }, children: SP_JSX.jsx("div", { style: { height: "100%", width: `${countdownPct}%`, borderRadius: 6, background: countdownPct > 25 ? "#59bf40" : countdownPct > 10 ? "#e5a629" : "#e34b4b", transition: "width .25s linear, background .3s ease" } }) })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy || !activation, onClick: redeem, children: "Activate / write ticket" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 10, opacity: .7, lineHeight: 1.45 }, children: "Codes are single-use and expire in about 30 minutes. Cooldowns are shared with UbiTokeer: Free 48h \u00B7 Donator 24h \u00B7 Lua Basic 12h \u00B7 Lua Pro 6h \u00B7 Elite/no-cooldown role: no standard cooldown." }) })] })] });
}

function FullStatusModal({ text, closeModal }) {
    return (SP_JSX.jsxs(DFL.ModalRoot, { closeModal: closeModal, children: [SP_JSX.jsx("div", { style: { fontSize: 20, fontWeight: 650, marginBottom: 10 }, children: "Full error details" }), SP_JSX.jsx("div", { style: {
                    maxHeight: "58vh",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    userSelect: "text",
                    fontSize: 13,
                    lineHeight: 1.45,
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: "rgba(0,0,0,.28)",
                }, children: text }), SP_JSX.jsx(DFL.DialogButton, { style: { marginTop: 10 }, onClick: () => closeModal?.(), children: "Close" })] }));
}
// Colour a source badge (Ryuu / luatools ship Online / Bypass / Crack / Tested /
// Generic / Hypervisor). Shown as a small pill next to the fix name so the exact
// tag the source gave is visible instead of the collapsed row label.
// Colour a source tag. Uses substring matching so lua.tools' free-form tags
// ("voices38 (crack)", "SteamTools Achievements Fix", "Ubisoft", â€¦) get a
// sensible colour, not just the exact Ryuu badges.
function badgeStyle(badge) {
    const b = (badge || "").toLowerCase();
    // Colours mirror the Steam library capsule badges (see lib/badges.ts):
    //   online fix â†’ lavender, denuvo & crack/bypass â†’ red, legit â†’ green.
    if (b.includes("online"))
        return { bg: "rgba(202,168,255,0.18)", fg: "#caa8ff" }; // lavender (matches onlinefix capsule)
    if (b.includes("denuvo") || b.includes("hypervisor"))
        return { bg: "rgba(224,82,82,0.18)", fg: "#f08a8a" }; // red
    if (b.includes("crack") || b.includes("bypass"))
        return { bg: "rgba(224,82,82,0.18)", fg: "#f08a8a" }; // red, like denuvo
    if (b.includes("legit"))
        return { bg: "rgba(47,168,92,0.18)", fg: "#5fd08a" }; // green
    if (b.includes("achiev"))
        return { bg: "rgba(240,168,208,0.16)", fg: "#f0a8d0" }; // rose (kept distinct from lavender)
    if (b.includes("test"))
        return { bg: "rgba(94,230,196,0.16)", fg: "#5ee6c4" }; // teal
    return { bg: "rgba(255,255,255,0.10)", fg: "#c8d2e0" }; // generic / unknown
}
function BadgeChip({ badge, inline }) {
    if (!badge)
        return null;
    const s = badgeStyle(badge);
    const label = badge.charAt(0).toUpperCase() + badge.slice(1);
    return (SP_JSX.jsx("span", { style: {
            display: "inline-block", marginLeft: inline ? 6 : 0, marginRight: inline ? 0 : 5, marginTop: inline ? 0 : 3,
            padding: "1px 7px", borderRadius: 999,
            fontSize: 10, fontWeight: 700, letterSpacing: 0.3, verticalAlign: "middle",
            background: s.bg, color: s.fg,
        }, children: label }));
}
function FixPicker({ appid, onReload, onClose }) {
    SP_REACT.useEffect(() => {
        const releaseView = retainTokeerDiscordView();
        return () => { cancelTokeerAvailabilityRefresh(); releaseView(); };
    }, [appid]);
    const [check, setCheck] = SP_REACT.useState(null);
    const [tokeerGame, setTokeerGame] = SP_REACT.useState(null);
    const [tokeerDownload, setTokeerDownload] = SP_REACT.useState({ appid, complete: false });
    const [tokeerRefreshing, setTokeerRefreshing] = SP_REACT.useState(false);
    const [tokeerLookup, setTokeerLookup] = SP_REACT.useState({ name: "", cachedGames: 0 });
    const [tokeerApplied, setTokeerApplied] = SP_REACT.useState(null);
    const [dlcDownload, setDlcDownload] = SP_REACT.useState(null);
    const [applied, setApplied] = SP_REACT.useState([]);
    const [installPath, setInstallPath] = SP_REACT.useState("");
    const [pinned, setPinned] = SP_REACT.useState(false);
    const [pinInfo, setPinInfo] = SP_REACT.useState({});
    const [added, setAdded] = SP_REACT.useState(false);
    // DLC unlockers (SmokeAPI / CreamAPI / Ubisoft) only make sense on games you
    // own. When this pref is on (default), hide them on SLS-added games.
    const [dlcOwnedOnly, setDlcOwnedOnly] = SP_REACT.useState(true);
    const [smoke, setSmoke] = SP_REACT.useState(null);
    // Whether the build this game is currently pinned to is in the Archive.
    const [archived, setArchived] = SP_REACT.useState(false);
    const [dlcU, setDlcU] = SP_REACT.useState({});
    // Set when a crack/HV host blocks auto-download and we hand off to the browser.
    // Surfaces an "Apply from Downloads" button so the user finishes with the file
    // they just downloaded.
    const [manualDl, setManualDl] = SP_REACT.useState(null);
    const [customFixes, setCustomFixes] = SP_REACT.useState([]);
    const [hv, setHv] = SP_REACT.useState(null);
    const [crak, setCrak] = SP_REACT.useState(null);
    const [hasRyuuKey, setHasRyuuKey] = SP_REACT.useState(true);
    // For fix-derived pins, keep the installed side live while Steam verifies or
    // downloads. This lets the banner move from "Update pending" to "Pin matched"
    // without requiring the user to close and reopen Fixes.
    SP_REACT.useEffect(() => {
        if (!pinned || pinInfo.source !== "lua.tools-fix")
            return;
        let mounted = true;
        let reading = false;
        const readInstalledPin = async () => {
            if (reading)
                return;
            reading = true;
            try {
                const status = await getPinStatus(appid);
                if (mounted && status.success && status.pinned) {
                    setPinInfo((current) => ({
                        ...current,
                        buildid: status.buildid || current.buildid,
                        source: status.pinSource || current.source,
                        depots: status.depots || current.depots,
                        installedBuildid: status.installedBuildid,
                        installedDepots: status.installedDepots || {},
                        pinMatched: status.pinMatched,
                    }));
                }
            }
            catch {
                /* keep the last confirmed comparison */
            }
            finally {
                reading = false;
            }
        };
        void readInstalledPin();
        const timer = setInterval(readInstalledPin, 3000);
        return () => { mounted = false; clearInterval(timer); };
    }, [appid, pinned, pinInfo.source]);
    const [busy, setBusy] = SP_REACT.useState("");
    const [ns, setNs] = SP_REACT.useState(null);
    const [proxies, setProxies] = SP_REACT.useState(null);
    const eosProxyLabel = appid === 1904480 ? "EOS Proxy (Absolum)" : "EOS Proxy";
    const [slsOnline, setSlsOnline] = SP_REACT.useState(null);
    const [msg, setMsg] = SP_REACT.useState("");
    const [autoApply, setAutoApplyState] = SP_REACT.useState(false);
    // Guided build-accurate apply: after pin+update we wait for the user to press
    // "Apply now". `awaiting` holds the deferred apply and the originating fix row.
    const [awaiting, setAwaiting] = SP_REACT.useState(null);
    const [activeFixKey, setActiveFixKey] = SP_REACT.useState("");
    const [fixState, setFixState] = SP_REACT.useState({});
    const [dlComplete, setDlComplete] = SP_REACT.useState(false);
    const poll = SP_REACT.useRef(null);
    const dlPoll = SP_REACT.useRef(null);
    const stopFlag = SP_REACT.useRef(false);
    const tokeerRefreshApp = SP_REACT.useRef(0);
    const tokeerDownloadReady = tokeerDownload.appid === appid && tokeerDownload.complete;
    SP_REACT.useEffect(() => {
        let mounted = true;
        let checking = false;
        setTokeerDownload({ appid, complete: false });
        const checkDownload = async () => {
            if (checking)
                return;
            checking = true;
            try {
                const complete = await isDownloadComplete(appid);
                if (mounted)
                    setTokeerDownload({ appid, complete });
            }
            finally {
                checking = false;
            }
        };
        void checkDownload();
        const timer = setInterval(checkDownload, 5000);
        return () => { mounted = false; clearInterval(timer); };
    }, [appid]);
    const stop = () => {
        if (poll.current) {
            clearInterval(poll.current);
            poll.current = null;
        }
    };
    const stopDl = () => {
        if (dlPoll.current) {
            clearInterval(dlPoll.current);
            dlPoll.current = null;
        }
    };
    SP_REACT.useEffect(() => () => {
        stop();
        stopDl();
        stopFlag.current = true;
    }, []);
    // Both the filtered DLC action here and the blind action in Game Tools run
    // through the same persistent DepotDownloader queue. Poll it while this
    // picker is open so closing/reopening the menu never loses progress.
    SP_REACT.useEffect(() => {
        let mounted = true;
        const read = async () => {
            try {
                const q = await depotdlQueue();
                const job = (q.items || []).find((item) => item.appid === appid && item.op === "dlc") || null;
                if (mounted)
                    setDlcDownload(job);
            }
            catch { /* keep the last visible state */ }
        };
        void read();
        const timer = setInterval(read, 1000);
        return () => { mounted = false; clearInterval(timer); };
    }, [appid]);
    const refresh = async () => {
        try {
            const fullCheck = await checkFixesFull(appid);
            setCheck(fullCheck);
            // Render the last successful cache immediately. A transient Discord/CDP
            // failure must not turn a known game into a false unavailable result.
            const lookupName = appDisplayName(appid) || fullCheck?.gameName || "";
            const cached = readTokeerAvailabilityCache();
            setTokeerLookup({ name: lookupName, cachedGames: cached?.games.length || 0, updatedAt: cached?.updatedAt });
            const recent = hasFreshTokeerFixCache(cached);
            setTokeerGame(getTokeerAvailabilityForGame(appid, lookupName));
            if (tokeerRefreshApp.current !== appid) {
                tokeerRefreshApp.current = appid;
                const requestedAppid = appid;
                setTokeerRefreshing(!recent);
                (recent ? Promise.resolve(cached) : refreshTokeerAvailabilityCache(true))
                    .then((live) => {
                    if (tokeerRefreshApp.current === requestedAppid) {
                        if (!live) {
                            // Keep the last confirmed match. Opening Fixes is a passive
                            // check, so a short Discord outage should not raise a toast.
                            resolveTokeerAvailabilityForGame(requestedAppid, lookupName)
                                .then((game) => {
                                if (tokeerRefreshApp.current === requestedAppid)
                                    setTokeerGame(game);
                            })
                                .catch(() => {
                                if (tokeerRefreshApp.current === requestedAppid) {
                                    setTokeerGame(getTokeerAvailabilityForGame(requestedAppid, lookupName));
                                }
                            });
                            return;
                        }
                        const fresh = readTokeerAvailabilityCache();
                        setTokeerLookup({ name: lookupName, cachedGames: fresh?.games.length || 0, updatedAt: fresh?.updatedAt });
                        resolveTokeerAvailabilityForGame(requestedAppid, lookupName)
                            .then((game) => { if (tokeerRefreshApp.current === requestedAppid)
                            setTokeerGame(game); })
                            .catch(() => setTokeerGame(getTokeerAvailabilityForGame(requestedAppid, lookupName)));
                    }
                })
                    .catch(() => {
                    if (tokeerRefreshApp.current === requestedAppid) {
                        setTokeerGame(getTokeerAvailabilityForGame(requestedAppid, lookupName));
                    }
                })
                    .finally(() => {
                    if (tokeerRefreshApp.current === requestedAppid)
                        setTokeerRefreshing(false);
                });
            }
        }
        catch {
            setCheck(null);
            setTokeerGame(null);
            setTokeerRefreshing(false);
        }
        try {
            const r = await getInstalledFixes();
            setApplied((r.fixes || []).filter((f) => f.appid === appid));
        }
        catch {
            /* ignore */
        }
        try {
            const status = await tokeerAppliedStatus(appid);
            setTokeerApplied(status.success && status.applied ? status.record || null : null);
        }
        catch {
            setTokeerApplied(null);
        }
        try {
            const p = await getGameInstallPath(appid);
            setInstallPath(p.success ? p.installPath || "" : "");
        }
        catch {
            setInstallPath("");
        }
        try {
            const p = await getPinStatus(appid);
            setPinned(!!p.pinned);
            // An exact depot-GID pin may not have a Steam BuildID. Do not label it as
            // the installed/latest BuildID; that made a correct historical pin appear
            // to have silently changed to latest.
            const snapshotBuild = p.pinned ? p.buildid : p.installedBuildid;
            const snapshotDepots = p.pinned
                ? (p.depots || {})
                : (Object.keys(p.depots || {}).length ? p.depots : p.installedDepots);
            setPinInfo({
                buildid: snapshotBuild,
                source: p.pinSource,
                depots: snapshotDepots,
                installedBuildid: p.installedBuildid,
                installedDepots: p.installedDepots,
                pinMatched: p.pinMatched,
            });
            // Ask about THIS build specifically: the same game can have several
            // builds archived, so "is this game archived" is the wrong question.
            if (snapshotBuild) {
                const a = await archiveIsBuild(appid, snapshotBuild).catch(() => null);
                setArchived(!!a?.archived);
            }
            else {
                setArchived(false);
            }
        }
        catch {
            setPinned(false);
            setPinInfo({});
            setArchived(false);
        }
        try {
            const r = await getInstalledApps();
            setAdded(!!r.success && (r.apps || []).some((a) => a.appid === appid));
        }
        catch {
            setAdded(false);
        }
        try {
            setDlcOwnedOnly(!!(await getDlcOwnedOnly()).enabled);
        }
        catch {
            setDlcOwnedOnly(true);
        }
        try {
            const r = await customListFixes(appid);
            setCustomFixes(r.success ? (r.items || []) : []);
        }
        catch {
            setCustomFixes([]);
        }
        try {
            const r = await getRyuuKey();
            setHasRyuuKey(r.success ? !!(r.key || "").trim() : false);
        }
        catch {
            setHasRyuuKey(false);
        }
        try {
            setNs(await netsockStatus(appid));
        }
        catch {
            setNs(null);
        }
        try {
            setProxies(await multiplayerProxyStatus(appid));
        }
        catch {
            setProxies(null);
        }
        try {
            setSlsOnline(await slsonlineStatus(appid));
        }
        catch {
            setSlsOnline(null);
        }
        try {
            setAutoApplyState((await getAutoApply()).enabled);
        }
        catch {
            setAutoApplyState(false);
        }
        try {
            const r = await smokeapiStatus(appid);
            setSmoke(r.success ? { installed: !!r.installed, supported: !!r.supported } : null);
        }
        catch {
            setSmoke(null);
        }
        try {
            const r = await dlcUnlockersStatus(appid);
            const next = {};
            if (r.success) {
                ["cream", "uplayr1", "uplayr2"].forEach((k) => {
                    const s = r[k];
                    if (s && s.supported)
                        next[k] = { installed: !!s.installed, supported: true };
                });
            }
            setDlcU(next);
        }
        catch {
            setDlcU({});
        }
        try {
            const r = await hvAutoStatus(appid);
            setHv(r.success && r.found
                ? { found: true, buildid: r.buildid, status: r.resolve?.status, href: r.hrefs?.[0], gids: r.resolve?.gids || {} }
                : { found: false });
        }
        catch {
            setHv({ found: false });
        }
        try {
            const r = await crakStatus(appid);
            setCrak(r.success && r.found
                ? { found: true, buildid: r.buildid, status: r.resolve?.status, href: r.hrefs?.[0], badges: r.badges, gids: r.resolve?.gids || {} }
                : { found: false });
        }
        catch {
            setCrak({ found: false });
        }
    };
    SP_REACT.useEffect(() => {
        stop();
        stopDl();
        stopFlag.current = false;
        tokeerRefreshApp.current = 0;
        setBusy("");
        setMsg("");
        setCheck(null);
        setTokeerGame(null);
        setTokeerApplied(null);
        setTokeerRefreshing(false);
        setTokeerLookup({ name: appDisplayName(appid), cachedGames: 0 });
        setApplied([]);
        setAwaiting(null);
        setActiveFixKey("");
        setFixState({});
        setDlComplete(false);
        refresh();
    }, [appid]);
    SP_REACT.useEffect(() => {
        const onTokeerApplied = (event) => {
            if (event.detail?.appid === appid)
                void refresh();
        };
        window.addEventListener("slsdeck-tokeer-applied", onTokeerApplied);
        return () => window.removeEventListener("slsdeck-tokeer-applied", onTokeerApplied);
    }, [appid]);
    const watch = (getState, okMsg, failMsg, onDone) => {
        stop();
        poll.current = setInterval(async () => {
            try {
                const st = (await getState()).state || {};
                setMsg(st.status || "");
                setFixState(st);
                if (["done", "failed", "cancelled"].includes(st.status || "")) {
                    stop();
                    setBusy("");
                    setMsg(st.status === "done" ? okMsg : st.error || failMsg);
                    if (st.status === "done") {
                        onDone?.(st);
                        onReload?.();
                        refresh();
                        void refreshBadges();
                    }
                    else {
                        markSlsAddPending(appid, false);
                    }
                }
            }
            catch {
                /* keep polling */
            }
        }, 800);
    };
    // Pin this version. If the game's manifest isn't added yet, add it first
    // (that registers the game with SLSsteam) and then pin; if the manifest is
    // already added, this only pins the current version.
    const doPinVersion = async () => {
        if (pinned)
            return;
        // Manifest already present â†’ just pin.
        if (added) {
            setBusy("game:pin");
            setMsg("Pinning current versionâ€¦");
            try {
                const r = await pinGame(appid);
                if (r.success) {
                    setPinned(true);
                    setMsg("Version pinned");
                }
                else {
                    setMsg(r.error || "Pin failed");
                }
            }
            catch {
                setMsg("Pin failed");
            }
            finally {
                setBusy("");
            }
            return;
        }
        // No manifest yet â†’ add it, then pin on completion.
        setBusy("game:manifest");
        setMsg("Adding gameâ€¦");
        markSlsAddPending(appid);
        try {
            const started = await startAdd(appid);
            if (!started.success) {
                markSlsAddPending(appid, false);
                setBusy("");
                setMsg(started.error || "Could not start");
                return;
            }
        }
        catch {
            markSlsAddPending(appid, false);
            setBusy("");
            setMsg("Could not start");
            return;
        }
        watch(() => getAddStatus(appid), "Added & pinned â€” restart Steam", "Add failed", async () => {
            setAdded(true);
            try {
                const r = await pinGame(appid);
                if (r.success)
                    setPinned(true);
            }
            catch {
                /* pin is best-effort; the add already succeeded */
            }
        });
    };
    // The guided fix can apply only when Steam has installed the pinned depots.
    const startDlPoll = () => {
        stopDl();
        setDlComplete(false);
        dlPoll.current = setInterval(async () => {
            const done = await isPinnedBuildReady(appid);
            setDlComplete(done);
        }, 3000);
        void isPinnedBuildReady(appid).then(setDlComplete);
    };
    // Shared build-accurate apply runner. `startExtract` kicks off the actual
    // extraction (applyFix / applyLuatoolsFix). The orchestration pins the fix's
    // build, triggers the Steam update, then applies â€” automatically (auto mode)
    // or after the user presses "Apply now" (guided). If the game is already
    // installed & downloaded, it skips straight to applying.
    const runApply = async (key, label, startExtract, pinFn) => {
        setAwaiting(null);
        setActiveFixKey(key);
        setFixState({});
        stopFlag.current = false;
        setBusy(key);
        resetFixRuntime(appid);
        const doApply = async () => {
            if (pinFn && !(await isPinnedBuildReady(appid))) {
                setMsg("Steam has not installed the pinned build yet. Wait for the update or retry verification.");
                throw new Error("pinned-build-not-ready");
            }
            setAwaiting(null);
            stopDl();
            setBusy(`${key}:apply`);
            setMsg(`Applying ${label}â€¦`);
            setFixState({ status: "starting" });
            const res = await startExtract();
            if (!res || !res.success) {
                setBusy("");
                setMsg(res?.error || "Fix failed");
                setFixState({ status: "failed", error: res?.error || "Fix failed" });
                throw new Error("apply-start-failed");
            }
            watch(() => getFixStatus(appid), `${label} applied â€” restart Steam`, "Fix failed", (st) => {
                applyFixRuntime(appid, st.overrides);
                autoRepointFromState(appid, st);
            });
        };
        try {
            const result = await runBuildAccurateApply({
                appid,
                autoApply,
                doApply,
                pinFn,
                shouldStop: () => stopFlag.current,
                onPhase: (phase, info) => {
                    if (phase === "pinning")
                        setMsg("Finding & pinning the fix's buildâ€¦");
                    else if (phase === "pin_failed")
                        setMsg("This fix's paired manifest could not be loaded. Nothing was applied or pinned.");
                    else if (phase === "updating")
                        setMsg(`Pinned via ${info?.source || "source"} â€” updating the game in Steam to that buildâ€¦`);
                    else if (phase === "awaiting_download")
                        setMsg("Steam is updating the game. Apply the fix once the installed depot manifests match the pin.");
                    else if (phase === "applying")
                        setMsg(`Applying ${label}â€¦`);
                },
            });
            if (result === "awaiting") {
                setBusy("");
                setAwaiting({ key, label, run: doApply });
                startDlPoll();
            }
        }
        catch (e) {
            if (!String(e).includes("apply-start-failed") && !String(e).includes("pinned-build-not-ready")) {
                setBusy("");
                setFixState({ status: "failed", error: `${e}`.replace(/^Error:\s*/, "") });
            }
        }
    };
    const doFix = async (row) => {
        if (!row.info?.url) {
            setMsg("No fix available");
            return;
        }
        // Ryuu gates denuvo/fix downloads behind an account. Without the API key the
        // download would 401 â€” prompt for the key instead of attempting.
        if (row.info.url.includes("generator.ryuu.lol") && !hasRyuuKey) {
            setMsg("This fix needs a Ryuu API key. Add it in Decky Pirate â†’ Settings (Sources & keys), then try again.");
            return;
        }
        if (!installPath) {
            setMsg("Game not installed â€” press â€œPin this versionâ€ to add it, then download the game in Steam to install the fix.");
            return;
        }
        if (row.manualDownload) {
            DFL.Navigation.NavigateToExternalWeb(row.info.url);
            setManualDl({ url: row.info.url, kind: "crak" });
            setMsg("NERAI download opened. Save the archive to Downloads, then press â€œApply from Downloadsâ€.");
            return;
        }
        await runApply(`${row.key}:fix`, row.label, () => applyFix(appid, row.info.url, installPath, row.fixType, check?.gameName || ""));
    };
    // Apply a fix chosen from the account-gated lua.tools catalog. The payload is
    // fetched with the Discord bearer token backend-side, then extracted + pinned
    // to the exact build the fix targets.
    const doLtFix = async (fix) => {
        if (!installPath) {
            setMsg("Game not installed â€” press â€œPin this versionâ€ to add it, then download the game in Steam to install the fix.");
            return;
        }
        await runApply(`lt:${fix.id}`, fix.name || "lua.tools fix", () => applyLuatoolsFix(appid, fix.id, installPath, fix.manifest_id || "", fix.depot_id || "", "lua.tools fix", check?.gameName || ""), fix.has_manifest ? async () => {
            const result = await pinForLuatoolsFix(appid, fix.id, fix.build || "");
            if (result.pinned) {
                const p = await getPinStatus(appid);
                setPinned(!!p.pinned);
                setPinInfo({
                    buildid: p.buildid,
                    source: p.pinSource,
                    depots: p.depots || {},
                    installedBuildid: p.installedBuildid,
                    installedDepots: p.installedDepots || {},
                    pinMatched: p.pinMatched,
                });
            }
            return result;
        } : undefined);
    };
    // Archive the build this game is actually on right now. `pinInfo` already
    // holds the pinned build + its depot gids, which is exactly what the archive
    // needs â€” so no SteamDB scrape is required here, unlike the Archive-a-build
    // picker in QAM which archives an arbitrary OLD build.
    const currentBuildId = pinInfo?.buildid || "";
    const doArchiveToggle = async () => {
        if (!currentBuildId) {
            setMsg("No pinned build to archive â€” pin or install a build first.");
            return;
        }
        setBusy("archive");
        try {
            if (archived) {
                const r = await buildArchiveRemove(appid, currentBuildId);
                setMsg(r.success
                    ? `Unarchived the game snapshot (${r.removedManifests ?? 0} manifest(s) freed).`
                    : (r.error || "Could not unarchive"));
                if (r.success)
                    setArchived(false);
            }
            else {
                const gids = pinInfo?.depots || {};
                const r = await buildArchiveAdd(appid, currentBuildId, JSON.stringify(gids), "", check?.gameName || "");
                if (r.success) {
                    setArchived(true);
                    // Record the fixes/launch args/Proton alongside the build, so the
                    // entry is a complete template rather than just depot material.
                    let opts = null;
                    try {
                        const SC = window.SteamClient;
                        const v = SC?.Apps?.GetLaunchOptionsForApp?.(appid);
                        if (typeof v === "string")
                            opts = v;
                    }
                    catch { /* Steam may not expose it */ }
                    await archiveSnapshotGame(appid, opts, "", check?.gameName || "", currentBuildId).catch(() => null);
                    setMsg(r.complete
                        ? `Archived game snapshot on build ${currentBuildId} â€” ${r.depots} depot(s), ${r.manifests} manifest(s), ${r.keys} key(s).`
                        : `Archived build ${currentBuildId}, but ${r.missingManifests?.length || 0} manifest(s) are unavailable (a Hubcap key usually fixes this).`);
                }
                else {
                    setMsg(r.error || "Could not archive that build");
                }
            }
        }
        catch (e) {
            setMsg(`Failed: ${e}`);
        }
        finally {
            setBusy("");
        }
    };
    // Apply whichever unlocker plan() detected for THIS install, rather than
    // assuming SmokeAPI. Returns a short sentence for the status line.
    const applyUnlockFor = async (unlocker) => {
        try {
            if (unlocker === "creamysteamy") {
                const r = await creamyDeploy(appid);
                return r?.success ? "DLC unlock applied (CreamySteamy)." : `Unlock failed: ${r?.error || "CreamySteamy"}`;
            }
            if (unlocker === "uplay_r1" || unlocker === "uplay_r2") {
                const kind = unlocker === "uplay_r1" ? "uplayr1" : "uplayr2";
                const r = await dlcUnlockerInstall(appid, kind);
                return r?.success ? `DLC unlock applied (${kind}).` : `Unlock failed: ${r?.error || kind}`;
            }
            if (unlocker === "smokeapi") {
                const r = await smokeapiInstall(appid);
                if (r?.success) {
                    if (r.overrides)
                        applyFixRuntime(appid, r.overrides);
                    setSmoke({ installed: true, supported: true });
                    return `DLC unlock applied (SmokeAPI ${r.tag || ""}).`;
                }
                return r?.skippedLauncher
                    ? "Unlock skipped â€” publisher-launcher game (SmokeAPI won't help)."
                    : `Unlock failed: ${r?.error || "SmokeAPI"}`;
            }
            return "No DLC unlocker matched this install â€” apply one manually.";
        }
        catch (e) {
            return `Unlock failed: ${e}`;
        }
    };
    const doDlcRemove = async () => {
        setBusy("dlcdepot");
        setMsg("Removing downloaded DLC files and the DLC unlockâ€¦");
        try {
            const r = await dlcDepotRemove(appid, true);
            if (!r?.success) {
                setMsg(r?.noLog
                    ? "No record of DLC files for this game â€” nothing was downloaded by SLSDeck."
                    : r?.error || "Could not remove the DLC files");
                return;
            }
            setSmoke((s) => (s ? { ...s, installed: false } : s));
            setMsg(`Removed ${r.removed ?? 0} DLC file(s) and the DLC unlock` +
                (r.failed?.length ? ` â€” ${r.failed.length} could not be deleted.` : "."));
        }
        catch (e) {
            setMsg(`Remove failed: ${e}`);
        }
        finally {
            setBusy("");
        }
    };
    // Two-step on purpose: plan (reads only), show what it found, then download.
    // The plan reports its exclusions, so the common "this DLC is entitlement-only,
    // there is nothing to download" outcome reads as an answer rather than as a
    // button that did nothing.
    const doDlcContent = async () => {
        setBusy("dlcdepot");
        setMsg("Checking which DLC have downloadable filesâ€¦");
        try {
            const p = await dlcDepotPlan(appid);
            if (!p?.success) {
                setMsg(p?.error || "Could not check DLC content");
                return;
            }
            const t = p.target || {};
            const where = `${t.platform || "unknown platform"}${t.unlocker ? ` Â· ${t.unlocker}` : ""}`;
            const fetchCount = (p.fetch || []).length;
            if (!fetchCount) {
                const ent = (p.entitlement || []).length;
                const skipped = p.skipped || [];
                // Four distinct "nothing to download" outcomes, each said plainly â€”
                // an empty result should read as an answer, not as a dead button.
                const detail = p.outcome === "no-dlc"
                    ? "This game has no DLC."
                    : p.outcome === "up-to-date"
                        ? `All DLC content is already installed and up to date (${skipped.length} depot${skipped.length === 1 ? "" : "s"}).`
                        : p.outcome === "entitlement-only"
                            ? `All ${ent} DLC are entitlement-only â€” there are no files to fetch, the DLC unlock alone covers them.`
                            : `${skipped.length} depot(s) can't be fetched: ${skipped[0]?.reason}.`;
                // Still apply the unlock unless the game genuinely has no DLC â€” for the
                // entitlement-only case (the common one) the unlocker IS the whole fix,
                // and for up-to-date/blocked the entitlement half is still wanted.
                const unlock = p.outcome === "no-dlc" ? "" : await applyUnlockFor(p.target?.unlocker);
                setMsg(`${detail} (${where}) ${unlock} ${(p.warnings || [])[0] || ""}`.trim());
                return;
            }
            const mb = Math.round((p.bytes || 0) / 1048576);
            setMsg(`Downloading ${fetchCount} DLC (~${mb} MB, ${where})â€¦`);
            const r = await dlcDepotStart(appid, (p.fetch || []).map((f) => f.appid));
            if (!r?.success) {
                setMsg(r?.error || "Could not start the DLC download");
                return;
            }
            const unlock = await applyUnlockFor(p.target?.unlocker);
            setMsg(`DLC download started â€” ${fetchCount} DLC (~${mb} MB). ${unlock}`);
        }
        catch (e) {
            setMsg(`DLC content check failed: ${e}`);
        }
        finally {
            setBusy("");
        }
    };
    const doSmoke = async (enable) => {
        setBusy("smoke");
        setMsg(enable ? "Installing SmokeAPI DLC unlockâ€¦" : "Removing SmokeAPIâ€¦");
        try {
            if (enable) {
                const r = await smokeapiInstall(appid);
                if (r.success) {
                    if (r.overrides)
                        applyFixRuntime(appid, r.overrides); // additive
                    setSmoke({ installed: true, supported: true });
                    setMsg(`DLC unlock installed (SmokeAPI ${r.tag || ""}) â€” restart Steam`);
                }
                else {
                    setMsg(r.skippedLauncher
                        ? "Skipped â€” Ubisoft/EA/Rockstar game (SmokeAPI won't help)."
                        : r.error || "SmokeAPI install failed");
                }
            }
            else {
                const r = await smokeapiRemove(appid);
                setSmoke((s) => (s ? { ...s, installed: false } : s));
                setMsg(r.success ? "SmokeAPI removed" : r.error || "Remove failed");
            }
        }
        catch {
            setMsg("SmokeAPI failed");
        }
        finally {
            setBusy("");
        }
    };
    const UNLOCKER_LABEL = {
        cream: "CreamAPI",
        uplayr1: "Uplay DLC (R1)",
        uplayr2: "Uplay DLC (R2)",
    };
    const doUnlocker = async (kind, enable) => {
        setBusy(`unlock-${kind}`);
        setMsg(enable ? `Installing ${UNLOCKER_LABEL[kind]}â€¦` : `Removing ${UNLOCKER_LABEL[kind]}â€¦`);
        try {
            if (enable) {
                const r = await dlcUnlockerInstall(appid, kind);
                if (r.success) {
                    if (r.overrides)
                        applyFixRuntime(appid, r.overrides); // additive
                    setDlcU((s) => ({ ...s, [kind]: { installed: true, supported: true } }));
                    const detail = kind === "cream"
                        ? r.unlockAll ? " (unlock-all)" : r.dlcCount ? ` (${r.dlcCount} DLC)` : ""
                        : "";
                    setMsg(`${r.label || UNLOCKER_LABEL[kind]} installed (${r.tag || ""})${detail} â€” restart Steam`);
                }
                else {
                    setMsg(r.notSupported
                        ? `No ${UNLOCKER_LABEL[kind]} target DLL in this game`
                        : r.error || `${UNLOCKER_LABEL[kind]} install failed`);
                }
            }
            else {
                const r = await dlcUnlockerRemove(appid, kind);
                setDlcU((s) => ({ ...s, [kind]: { installed: false, supported: true } }));
                setMsg(r.success ? `${UNLOCKER_LABEL[kind]} removed` : r.error || "Remove failed");
            }
        }
        catch {
            setMsg(`${UNLOCKER_LABEL[kind]} failed`);
        }
        finally {
            setBusy("");
        }
    };
    const applyCatalogPayload = async (kind, key) => {
        setAwaiting(null);
        stopDl();
        setBusy(key);
        setActiveFixKey(key);
        setFixState({ status: "fix_installing" });
        setMsg(kind === "hv" ? "Downloading / extracting HV crackâ€¦" : "Downloading / extracting CrakFiles crackâ€¦");
        try {
            const r = kind === "hv"
                ? await hvAutoApply(appid, hv?.href || "")
                : await crakApply(appid, crak?.href || "");
            if (r.success) {
                setManualDl(null);
                setFixState({ status: "done" });
                if (kind === "hv") {
                    const protonTool = r.protonTool;
                    setMsg(`HV crack installed (build ${r.buildid || "?"}${r.pinned ? ", pinned" : ""}). ` +
                        (protonTool ? `Set Proton to ${protonTool} for this game, then restart Steam. ` : "") +
                        (r.note || ""));
                }
                else {
                    setMsg(`Crack installed (build ${r.buildid || "?"}${r.pinned ? ", pinned" : ""}) â€” ${r.installed || 0} file(s). ` +
                        (r.note || "") + " Restart Steam.");
                }
                onReload?.();
                refresh();
                return;
            }
            if (r.needsManual && r.url) {
                setFixState({ status: "failed", error: "Manual download required" });
                setManualDl({ url: r.url, kind });
                openManual(r.url);
                return;
            }
            const error = r.notFound
                ? kind === "hv" ? "No HV crack for this title." : "No CrakFiles crack for this title."
                : r.error || (kind === "hv" ? "HV apply failed" : "Crack apply failed");
            setFixState({ status: "failed", error });
            setMsg(error);
        }
        catch (e) {
            const error = `${kind === "hv" ? "HV" : "CrakFiles"} apply failed: ${e}`;
            setFixState({ status: "failed", error });
            setMsg(error);
        }
        finally {
            setBusy("");
        }
    };
    const runCatalogFix = async (kind) => {
        const target = kind === "hv" ? hv : crak;
        const key = `catalog:${kind}`;
        const label = kind === "hv" ? "HV crack" : "CrakFiles crack";
        if (!target?.found) {
            setMsg(kind === "hv" ? "No HV crack for this title." : "No CrakFiles crack for this title.");
            return;
        }
        if (!installPath) {
            setMsg("Game is not installed yet â€” install the target build before applying this fix.");
            return;
        }
        setAwaiting(null);
        setActiveFixKey(key);
        // HV/CrakFiles publish a compatible BuildID, not authoritative depot GIDs.
        // Applying the payload must not replace a pin chosen in Specific build.
        if (target.status === "older") {
            setMsg(`${label} targets build ${target.buildid || "?"}. Applying it without changing your selected buildâ€¦`);
        }
        await applyCatalogPayload(kind, key);
    };
    const doCrak = async () => {
        await runCatalogFix("crak");
    };
    const doHv = async () => {
        await runCatalogFix("hv");
    };
    const doCustomFix = async (item) => {
        setBusy(`custom-${item.id}`);
        setMsg(`Applying custom fix "${item.label}"â€¦`);
        try {
            const r = await customApplyFix(appid, item.id);
            if (r.success) {
                setMsg(`Custom fix installed â€” ${r.installed || 0} file(s). ${r.note || "Restart Steam."}`);
                onReload?.();
            }
            else {
                setMsg(r.error || "Custom fix failed.");
            }
        }
        catch {
            setMsg("Custom fix failed.");
        }
        finally {
            setBusy("");
        }
    };
    // Host blocked auto-download: open the page in the gaming-mode browser and get
    // this menu out of the way so the browser is visible. After downloading, the
    // user reopens Fixes and presses Apply again â€” the backend now checks
    // ~/Downloads first, so it picks the file up with no extra step.
    const openManual = (url) => {
        setMsg("This host needs a manual download. Opening it in the browser â€” download the " +
            "file (it saves to Downloads), then reopen this menu and press Apply again; " +
            "it'll pick the file up automatically. The file may also have expired â€” if the " +
            "page is empty, there's nothing to download.");
        try {
            DFL.Navigation.NavigateToExternalWeb(url);
        }
        catch { /* */ }
        try {
            DFL.Navigation.CloseSideMenus();
        }
        catch { /* */ }
        try {
            onClose?.();
        }
        catch { /* */ }
    };
    // Finish a manual-download crack: let the user pick the archive they just
    // downloaded (defaults to ~/Downloads) and extract it into the game.
    const applyFromDownloads = async () => {
        if (!manualDl)
            return;
        let path = "";
        try {
            const res = await openFilePicker(0 /* FileSelectionType.FILE */, "/home/deck/Downloads", true, true);
            path = res?.realpath || res?.path || "";
        }
        catch {
            return; // user cancelled the picker
        }
        if (!path)
            return;
        setBusy("manualdl");
        setMsg("Installing from your downloadâ€¦");
        try {
            const r = manualDl.kind === "hv"
                ? await hvApplyLocal(appid, path)
                : await crakApplyLocal(appid, path);
            if (r.success) {
                setManualDl(null);
                setMsg(`Installed from your download â€” ${r.installed || 0} file(s). ` +
                    (r.protonTool ? `Set Proton to ${r.protonTool}. ` : "") +
                    (r.note || "Restart Steam."));
                onReload?.();
            }
            else {
                setMsg(r.error || "Could not install from that file â€” is it the right archive?");
            }
        }
        catch {
            setMsg("Install from download failed.");
        }
        finally {
            setBusy("");
        }
    };
    const doUnfix = async () => {
        setBusy("unfix");
        setMsg("Reverting fix & unpinningâ€¦");
        try {
            await unfix(appid, installPath, "");
        }
        catch {
            setBusy("");
            setMsg("Un-fix failed");
            return;
        }
        watch(() => getUnfixStatus(appid), "Fix reverted & unpinned â€” restart Steam", "Un-fix failed", () => {
            setPinned(false);
            clearFixLaunchOptions(appid); // strip repoint + WINEDLLOVERRIDES
            void refreshBadges();
        });
    };
    // Unpin only â€” for when the game is pinned but no fix was actually applied
    // (e.g. the download never finished, so the fix step never ran). Without this
    // the sole unpin control was bundled into "Un-fix and unpin", which only shows
    // once a fix is detected â€” leaving a bare pin with no way to revert.
    const doUnpinOnly = async () => {
        setBusy("unpin");
        setMsg("Unpinningâ€¦");
        try {
            const r = await unpinGame(appid);
            if (r.success) {
                setPinned(false);
                setPinInfo({});
                setMsg("Unpinned â€” back to the latest build. Restart Steam.");
            }
            else {
                setMsg("Unpin failed");
            }
        }
        catch {
            setMsg("Unpin failed");
        }
        finally {
            setBusy("");
        }
    };
    if (!check) {
        return SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.6, padding: "4px 0" }, children: "Checking fixes\u2026" });
    }
    // Show EVERY ryuu fix/variant/version for this game (not one best pick), so a
    // version-specific fix can be matched to the installed build.
    const ryuuList = (check.ryuuFixes || []);
    const rows = ryuuList.map((e, i) => {
        const online = (e.badge || "").toLowerCase() === "online";
        return {
            key: `ryuu${i}`,
            label: online ? "Online Fix" : "Crack / Bypass Fix",
            fixType: online
                ? "Online Fix"
                : (e.badge || "").toLowerCase() === "hypervisor"
                    ? "Denuvo/HV Fix"
                    : "Generic Fix",
            info: { status: 200, available: true, url: e.url, file: e.file, badge: e.badge },
            description: e.description,
        };
    });
    const peroUrl = check.onlineFix.perondepot;
    if (peroUrl) {
        rows.push({
            key: "pero",
            label: "Online Fix (perondepot)",
            fixType: "Online Fix",
            info: { status: 200, available: true, url: peroUrl },
        });
    }
    // luatools.work fallback fixes (probed directly, index-free). Shown with their
    // source + classification so it's clear where the fix comes from and its type.
    const luatoolsList = (check.luatoolsFixes || []);
    luatoolsList.forEach((e, i) => {
        const online = (e.type || "").toLowerCase() === "online";
        rows.push({
            key: `luatools${i}`,
            label: `${online ? "Online Fix" : "Cra×¾¹ÓFòµë(š+myÒ6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢6WD'W7’‚""“°¢Ó°¢6öç7B–6µ&÷FöâÒ7–æ2‚’Óâ°¢6WD'W7’‚'&÷Föâ"“°¢6WDæ÷FR‚""“°¢ÆWBFööÇ2ÒµÓ°¢G'’°¢FööÇ2Ò†v—BÆ—7D–ç7FÆÆVE&÷FöåFööÇ2‚’“òçFööÇ2ÇÂµÓ°¢Ð¢6F6‚†R’°¢6WDæ÷FR†6÷VÆBæ÷BÆ—7B&÷FöâfW'6–öç3¢G¶WÖ“°¢6WD'W7’‚""“°¢&WGW&ã°¢Ð¢6WD'W7’‚""“°¢–b‚FööÇ2æÆVæwF‚’°¢6WDæ÷FR‚$æò&÷FöâfW'6–öç2f÷VæBâ"“°¢&WGW&ã°¢Ð¢òòöffW"FòfWF6‚tRÕ&÷Föâg&öÒ†W&S¢v—F†÷WB—BF†RÆ—7B—2§W7BfÇfRw0¢òò'V–ÇBÖ–ç2ÂæBtRÕ&÷Föâ—2W†7FÇ’v†BÖ÷7Bf—†VBöFFVBvÖW2æVVBâF†P¢òò&6¶VæB6ÆÂW†—7FVBv—F‚æò6ÆÆW"Â6òF†W&Rv2æòv’FòvWBöæRà¢6öç7B—FV×2Ò°¢²¶W“¢%õöFVfVÇEõò"ÂÆ&VÃ¢%7FVÒFVfVÇB"Â7V&Æ&VÃ¢$6ÆV"F†R÷fW'&–FRf÷"F†—2vÖR"ÒÀ¢ââçFööÇ2æÖ‚‡B’Óâ‡²¶W“¢BÂÆ&VÃ¢BÂ7V&Æ&VÃ¢BÓÓÒ&÷Föâò&7W'&VçB"¢VæFVf–æVBÒ’’À¢²¶W“¢%õövUõò"ÂÆ&VÃ¢$–ç7FÆÂÆFW7BtRÕ&÷Föî(
b"Â7V&Æ&VÃ¢$F÷væÆöG2g&öÒv—D‡V"ÂF†Vâ–6²—B†W&R"ÒÀ¢Ó°¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚…–6¶W$ÖöFÂÂ²F—FÆS¢%&÷FöâfW'6–öâ"Â7V'F—FÆS¢f÷"”BG¶–GÒâF¶W2VffV7BæW‡BÆVæ6‚æÂ—FV×3¢—FV×2Âöå–6³¢†—B’Óâ°¢–b†—Bæ¶W’ÓÓÒ%õövUõò"’°¢'Vâ‚'&÷Föâ"Â‚’Óâ–ç7FÆÄÆFW7DvU&÷Föâ‚’Â‡"’Óâ"ç7V66W70¢òG·"çFrÇÂ$tRÕ&÷Föâ'Ò–ç7FÆÆVBG·"æÖW76vRò(	BG·"æÖW76vWÖ¢"'Òâ÷VâF†—2Æ—7Bv–âFò6VÆV7B—Bæ ¢¢"æW'&÷"ÇÂ$6÷VÆBæ÷B–ç7FÆÂtRÕ&÷Föâ"“°¢Ð¢VÇ6R–b†—Bæ¶W’ÓÓÒ%õöFVfVÇEõò"’°¢'Vâ‚'&÷Föâ"Â‚’Óâ&VÖ÷fU&÷FöäÖ–ær†–B’Â‡"’Óâ°¢&Vg&W6…&÷Föâ‚“°¢&WGW&â"ç7V66W72ò%W6–ær7FVÒw2FVfVÇB&÷Föâv–ââ"¢"æW'&÷"ÇÂ$6÷VÆBæ÷B6ÆV"—B#°¢Ò“°¢Ð¢VÇ6R°¢'Vâ‚'&÷Föâ"Â‚’Óâ6WE&÷FöäÖ–ær†–BÂ—Bæ¶W’Â##S"’Â‡"’Óâ°¢&Vg&W6…&÷Föâ‚“°¢&WGW&â"ç7V66W70¢ò&÷Föâ6WBFòG¶—Bæ¶W—Òâ&VÆVæ6‚F†RvÖRf÷"—BFòÇ’æ ¢¢"æW'&÷"ÇÂ$6÷VÆBæ÷B6WB—B#°¢Ò“°¢Ð¢ÒÒ’“°¢Ó°¢6öç7B&W7F÷&U6fW2Ò7–æ2‚’Óâ°¢6WD'W7’‚&Æ—7G6fW2"“°¢6WDæ÷FR‚""“°¢ÆWB&6·W2ÒµÓ°¢G'’°¢&6·W2Ò†v—BÆ—7DvÖU6fT&6·W2†–BÂ""’“òæ&6·W2ÇÂµÓ°¢Ð¢6F6‚†R’°¢6WDæ÷FR†6÷VÆBæ÷B&VB&6·W3¢G¶WÖ“°¢6WD'W7’‚""“°¢&WGW&ã°¢Ð¢6WD'W7’‚""“°¢–b‚&6·W2æÆVæwF‚’°¢6WDæ÷FR‚$æò6fR&6·W2f÷"F†—2vÖR–WB(	BÖ¶RöæRf—'7Bâ"“°¢&WGW&ã°¢Ð¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚…–6¶W$ÖöFÂÂ²F—FÆS¢%&W7F÷&R6fW2"Â7V'F—FÆS¢%–6²v†–6‚&6·WFò&W7F÷&Râ"Â—FV×3¢&6·W2æÖ‚†"’Óâ‡²¶W“¢"çF‚ÂÆ&VÃ¢"çv†VâÂ7V&Æ&VÃ¢G¶"ç6—¦TÔ'ÒÔ&Ò’’Âöå–6³¢†—B’Óâ°¢òò&W7F÷&–ærw&—FW2÷fW"v†FWfW"—2–âF†R&Vf—‚æ÷rÂ6ò—B—0¢òò6öæf—&ÖVB&F†W"F†âFöæRöâ6–ævÆRFà¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢$÷fW'w&—FR7W'&VçB6fW3ò"Â7G$FW67&—F–öã¢F†—26÷–W2F†R&6·Wg&öÒG¶—BæÆ&VÇÒ&6²–çFòF†RvÖRw2&÷Föâ&Vf—‚Â&WÆ6–ærf–ÆW2F†B&RF†W&Ræ÷râF†—26ææ÷B&RVæFöæRæÂ7G$ô´'WGFöåFW‡C¢%&W7F÷&R"Âöäô³¢‚’Óâ'Vâ‚'&W7F÷&R"Â‚’Óâ&W7F÷&TvÖU6fW2†–BÂ—Bæ¶W’’Â‡"’Óâ"ç7V66W70¢ò&W7F÷&VBG²‡"ç&W7F÷&VDf–ÆW2ÇÂµÒ’æÆVæwF‡Òf–ÆR‡2’æ ¢¢"æW'&÷"ÇÂ%&W7F÷&Rf–ÆVB"’Ò’“°¢ÒÒ’“°¢Ó°¢6öç7B&÷FöäÆ&VÂÒ&÷FöâÓÒçVÆÂò&6†V6¶–æ~(
b"¢&÷FöâÇÂ%7FVÒFVfVÇB#°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$7F–öç2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãƒRÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢²%&÷Föã¢"Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢&÷FöäÆ&VÂÒ•ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢–6µ&÷FöâÂ6†–ÆG&Vã¢'W7’ÓÓÒ'&÷Föâ"ò%v÷&¶–æ~(
b"¢$6†ævR&÷FöâfW'6–öâ"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&&6·W"Â‚’Óâ&6·WvÖU6fW2†–BÂ""’Â‡"’Óâ"ç7V66W70¢ò&6¶VBWG·"æf–ÆT6÷VçGÒ6fRf–ÆR‡2’FòG·"ç¦—F‡Ö ¢¢"æW'&÷"ÇÂ$&6·Wf–ÆVB"’Â6†–ÆG&Vã¢'W7’ÓÓÒ&&6·W"ò$&6¶–ærW(
b"¢$&6²WF†—2vÖRw26fW2"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢&W7F÷&U6fW2Â6†–ÆG&Vã¢'W7’ÓÓÒ&Æ—7G6fW2"ÇÂ'W7’ÓÓÒ'&W7F÷&R"ò%v÷&¶–æ~(
b"¢%&W7F÷&R6fW2g&öÒ&6·W"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚'&W—""Â‚’Óâ&W—$vÖR†–B’Â‡"’Óâ"ç7V66W70¢ò&W—&VC¢G²‡"ç7FW2ÇÂµÒ’æ¦ö–â‚"Â"’ÇÂ&æ÷F†–æræVVFVB'Ö ¢¢"æW'&÷"ÇÂ%&W—"f–ÆVB"’Â6†–ÆG&Vã¢'W7’ÓÓÒ'&W—""ò%&W—&–æ~(
b"¢%&W—"F†—2vÖR"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚'7GV6²"Â‚’Óâf—…7GV6µWFFR†–B’Â‡"’Óâ"ç7V66W72ò‡"ææ÷FRÇÂ$FW÷F66†R&Vg&W6†VB(	B&WG'’F†RWFFR–â7FVÒâ"’¢‡"æW'&÷"ÇÂ$6÷VÆFâwBf—‚F†RWFFRâ"’’Â6†–ÆG&Vã¢'W7’ÓÓÒ'7GV6²"ò%v÷&¶–æ~(
b"¢$f—‚7GV6²WFFR"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢$–bâWFFRvöâwBf–æ—6‚†æWrFW÷BæVVG2¶W’—BFöW6âwB†fR’ÂF†—2&RÖFWÆ÷—2F†RvÖRw2Öæ–fW7G2ö¶W—26ò7FVÒ6â&WG'’â"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢f—„ÆVæ6…F&vWBÂ6†–ÆG&Vã¢'W7’ÓÓÒ'&Wö–çB"ò%v÷&¶–æ~(
b"¢$f—‚ÆVæ6‚F&vWB‡W6RvÖRw2&VÂW†R’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢²$–bf—‚FöW6âwBF¶RVffV7BÂö–çB7FVÒBF†RvÖRw2&VÂ&–æ&–W2õv–ãcBW†V7WF&ÆRâ&W6W'fW2–÷W"÷F†W"ÆVæ6‚÷F–öç2â"Â&Wö–çFVBò"+r7W'&VçFÇ’&Wö–çFVBâ"¢"%ÒÒ’Ò’Â&Wö–çFVBbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢&W6WDÆVæ6…F&vWBÂ6†–ÆG&Vã¢%&W6WBÆVæ6‚F&vWB"Ò’Ò’’Â†vU6V2ÒçVÆÂÇÂ–ææVBÒçVÆÂÇÂ†—7D6÷VçBâ’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂFF–æs¢#'‚'‚"ÒÂ6†–ÆG&Vã¢¶vU6V2ÒçVÆÂòÖæ–fW7BvS¢G¶vU6V2Â3còÖF‚ç&÷VæB†vU6V2òc’²&Ò"¢vU6V2ÂƒcCòÖF‚ç&÷VæB†vU6V2ò3c’²&‚"¢ÖF‚ç&÷VæB†vU6V2òƒcC’²&B'Ö¢""Â–ææVBÒçVÆÂòG¶vU6V2ÒçVÆÂò"+r"¢"'ÒG·–ææVBò–ææVB'V–ÆC¢G·–ææVD'V–ÆBÇÂ&7W'&VçB'ÒG·–ææVDFW÷D6÷VçBò+rG·–ææVDFW÷D6÷VçGÒFW÷BG·–ææVDFW÷D6÷VçBÓÓÒò""¢'2'Ö¢"'Ö¢&WFò×WFFW2'Ö¢"%ÒÒ’Ò’’Â–ææVBÒçVÆÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢FövvÆTg&VW¦RÂ6†–ÆG&Vã¢'W7’ÓÓÒ&g&VW¦R"ò%v÷&¶–æ~(
b"¢–ææVBò%Væg&VW¦RfW'6–öâ†ÆÆ÷rWFFW2’"¢$g&VW¦RfW'6–öâ†&Æö6²WFFW2’"Ò’Ò’’Â†—7D6÷VçBâbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢÷Vå&öÆÆ&6²Â6†–ÆG&Vã¢'W7’ÓÓÒ'&öÆÆ&6²"ò%v÷&¶–æ~(
b"¢%&W6WBf–ÆW>(
b"Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’ÇÂ'V–ÆDF÷væÆöD7F—fRÂöä6Æ–6³¢÷Vä'V–ÆE–6¶W"Â6†–ÆG&Vã¢'W7’ÓÓÒ&' ¢ò%&W&–ær'V–ÆBF÷væÆöN(
b ¢¢'V–ÆDF÷væÆöD7F—fP¢òF÷væÆöF–ær'V–ÆBG¶FFÃòæ'V–ÆF–BÇÂ"'Ò(	BG¶FFÅW&6VçGÒV ¢¢$–ç7FÆÂ7V6–f–2'V–ÆN(
b"Ò’Ò’ÂFW÷FFÂbbFFÃòæ÷ÓÓÒ&'V–ÆB"bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²v–GFƒ¢#R"ÂFF–æs¢#'‚g‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂÖ&v–ä&÷GFöÓ¢BÂF—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚'7â"Â²6†–ÆG&Vã¢²$'V–ÆB"ÂFFÂæ'V–ÆF–BÇÂ#ò"Â"ÇS#r"ÂFFÂç7FGW2ÂFFÂæ7W'&VçDFW÷Bò+rFW÷BG¶FFÂæ7W'&VçDFW÷GÖ¢"%ÒÒ’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢FFÂç7FGW2ÓÓÒ&f–ÆVB"ò""¢G¶FFÅW&6VçGÒVÒ•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²†V–v‡C¢bÂ&6¶w&÷VæC¢'&v&ƒ#SRÃ#SRÃ#SRÃãR’"Â&÷&FW%&F—W3¢2Â÷fW&fÆ÷s¢&†–FFVâ"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢†V–v‡C¢#R"À¢v–GFƒ¢G¶FFÅW&6VçGÒVÀ¢&6¶w&÷VæC¢FFÂç7FGW2ÓÓÒ&f–ÆVB"ò"6C“S3Fb"¢FFÂç7FGW2ÓÓÒ&FöæR"ò"3V6#ƒV2"¢"3F“C’"À¢G&ç6—F–öã¢'v–GF‚ã72"À¢ÒÒ’Ò’ÂFFÂæFW÷EF÷FÂò…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢²$FW÷G2"ÂFFÂæFW÷DFöæRÇÂÂ"ò"ÂFFÂæFW÷EF÷FÅÒÒ’’¢çVÆÂÂFFÂæW'&÷"ò…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢FFÂç7FGW2ÓÓÒ&f–ÆVB"ò"6cCFR"¢"3†f&c†b"ÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢FFÂæW'&÷"Ò’’¢çVÆÅÒÒ’Ò’’ÂFW÷FFÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’ÇÂFFÄ7F—fRÂöä6Æ–6³¢7–æ2‚’Óâ°¢v—B'Vâ‚&FFÂ"Â7–æ2‚’Óâ°¢6WDæ÷FR‚"ääUBòFW÷DF÷væÆöFW"&W&–æ~(
bf—'7B'VâÖ’F÷væÆöBF†RÆö6ÂääUB'VçF–ÖRâ"“°¢&WGW&âFW÷FFÄF÷væÆöDFÆ2†–B“°¢ÒÂ‡"’Óâ"ç7V66W72ò%7F'FVB(	BF÷væÆöF–ær6öçFVçBDÄ2–âF†R&6¶w&÷VæBâ"¢‡"æW'&÷"ÇÂ$6÷VÆBæ÷B7F'B"’“°¢v—BöÆÄFFÄöæ6R‚“°¢7F'DFFÂ‚“°¢ÒÂ6†–ÆG&Vã¢FFÄ7F—fRbbFFÃòæ÷ÓÓÒ&FÆ2"ò$F÷væÆöF–ærDÄ>(
b"¢$&Æ–æBF÷væÆöB6öçFVçBDÄ2„FW÷DF÷væÆöFW"’"Ò’Ò’’ÂFW÷FFÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãcRÂFF–æs¢#'‚G‚"ÂÆ–æT†V–v‡C¢ãBÒÂ6†–ÆG&Vã¢$F÷væÆöG2WfW'’¶W–VBFW÷Bv—F‚æò6†V6·2ÇS#B—BFöW2æ÷BfW&–g’F†BFW÷B—2DÄ2†ÆæwVvR6·2æB&6RFW÷G26â&R–æ6ÇVFVB’ÂFöW2æ÷BÖF6‚–÷W"ÆFf÷&ÒÂæBFöW2æ÷B6¶—f–ÆW2–÷RÇ&VG’†fRâf÷"F†Rf–ÇFW&VBfW'6–öâW6RÇS#4vWBDÄ2f–ÆW2²VæÆö6µÇS#B–âf—†W2â"Ò’Ò’’ÂFW÷FFÂbbFFÂbbFFÂæ÷ÓÒ&'V–ÆB"bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²v–GFƒ¢#R"ÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂÖ&v–ä&÷GFöÓ¢BÂF—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚'7â"Â²6†–ÆG&Vã¢¶FFÂæ÷ÓÓÒ&FÆ2"ò$DÄ2Ö6æF–FFRFW÷G2"¢$'V–ÆBFW÷G2"Â"ÇS#r"ÂFFÂç7FGW5ÒÒ’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢FFÂç7FGW2ÓÓÒ&F÷væÆöF–ær"ÇÂFFÂç7FGW2ÓÓÒ'&W6öÇf–ær"òG´ÖF‚æÖ‚ƒÂÖF‚æÖ–âƒ“’ÂÖF‚ç&÷VæB†FFÂçW&6VçBÇÂ’’—ÒV¢FFÂç7FGW2ÓÓÒ&FöæR"ò#R"¢""Ò•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²†V–v‡C¢bÂ&6¶w&÷VæC¢'&v&ƒ#SRÃ#SRÃ#SRÃãR’"Â&÷&FW%&F—W3¢2Â÷fW&fÆ÷s¢&†–FFVâ"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢†V–v‡C¢#R"À¢v–GFƒ¢G¶FFÂç7FGW2ÓÓÒ&FöæR"ò¢ÖF‚æÖ‚ƒÂÖF‚æÖ–âƒ“’ÂÖF‚ç&÷VæB†FFÂçW&6VçBÇÂ’’—ÒVÀ¢&6¶w&÷VæC¢FFÂç7FGW2ÓÓÒ&f–ÆVB"ò"6C“S3Fb"¢FFÂç7FGW2ÓÓÒ&FöæR"ò"3V6#ƒV2"¢"3F“C’"À¢G&ç6—F–öã¢'v–GF‚ã72"À¢ÒÒ’Ò’ÂFFÂæW'&÷"bb…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢FFÂç7FGW2ÓÓÒ&f–ÆVB"ò"6cCFR"¢"3†f&c†b"ÂÖ&v–åF÷¢BÂÆ–æT†V–v‡C¢ãBÒÂ6†–ÆG&Vã¢FFÂæW'&÷"Ò’’ÂFFÂçÆææVDFW÷G3òæÆVæwF‚bb5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢rÂFF–æs¢rÂ&÷&FW%&F—W3¢bÂ&6¶w&÷VæC¢'&v&ƒÃÃÂã‚’"ÂföçE6—¦S¢ÂÆ–æT†V–v‡C¢ãRÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢sÂÖ&v–ä&÷GFöÓ¢2ÒÂ6†–ÆG&Vã¢²$FW÷G2"ÂFFÂæFW÷DFöæRÇÂÂ"ò"ÂFFÂæFW÷EF÷FÂÇÂFFÂçÆææVDFW÷G2æÆVæwF…ÒÒ’ÂFFÂçÆææVDFW÷G2æÖ‚†B’Óâ°¢6öç7BÒÒFFÂæFW÷DÖWFFFòå¶BæFW÷EÓ°¢6öç7BÆ&VÂÒÓòæ¶–æBÓÓÒ&FÆ2"òDÄ2G¶ÒæFÆ4–BÇÂ"'Ö¢Óòæ¶–æBÓÓÒ'6†&VB"ò6†&VBg&öÒG¶Òæg&öÔ–BÇÂ&'Ö¢Óòæ¶–æBÓÓÒ&&6RÖ÷"×6†&VB"ò&&6R÷6†&VB"¢Bæ¶–æBÓÓÒ&FÆ2Ö6æF–FFR"ò$DÄ26æF–FFR"¢&'V–ÆB#°¢&WGW&â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"Âv¢‚Â6öÆ÷#¢FFÂæf–ÆVDFW÷G3òæ–æ6ÇVFW2†BæFW÷B’ò"6cCFR"¢FFÂæ6ö×ÆWFVDFW÷G3òæ–æ6ÇVFW2†BæFW÷B’ò"3†fCC–"¢FFÂæ7W'&VçDFW÷BÓÓÒBæFW÷Bò"3s&3vfb"¢'&v&ƒ#SRÃ#SRÃ#SRÂãs"’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚'7â"Â²6†–ÆG&Vã¢¶FFÂæ7W'&VçDFW÷BÓÓÒBæFW÷Bò.)kb"¢FFÂæ6ö×ÆWFVDFW÷G3òæ–æ6ÇVFW2†BæFW÷B’ò.)É2"¢FFÂæf–ÆVDFW÷G3òæ–æ6ÇVFW2†BæFW÷B’ò""¢""Â$FW÷B"ÂBæFW÷BÂÓòææÖRò+rG¶ÒææÖWÖ¢"%ÒÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²÷6—G“¢ãcRÒÂ6†–ÆG&Vã¢¶Æ&VÂÂÓòæ÷2ò+rG¶Òæ÷7Ö¢""ÂÓòæÆæwVvRò+rG¶ÒæÆæwVvWÖ¢""Â"ÇS#rt”B"ÂBæÖæ–fW7EÒÒ•ÒÒÂBæFW÷B“°¢Ò’ÂFFÂæVç&–6†ÖVçE7FGW2ÓÓÒ''Vææ–ær"bb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢RÂ÷6—G“¢ãcRÒÂ6†–ÆG&Vã¢$Vç&–6†–ærFW÷B&VÆF–öç6†—2–âF†R&6¶w&÷VæEÇS##b"Ò’ÂFFÂæ÷ÓÓÒ&FÆ2"bb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢RÂ6öÆ÷#¢"6Cv#vfb"Â÷6—G“¢ãƒRÒÂ6†–ÆG&Vã¢$6æF–FFRÖVç2F†RFW÷B6ÖRg&öÒF†RgVÆÂvÖR'VæFÆS²7FVÒÖ–æfò—27F–ÆÂ&WV—&VBFò&÷fRF†B—B&VÆöæw2FòDÄ2â"Ò•ÒÒ’ÂFFÂç7FGW2ÓÓÒ&FöæR"bbFFÂæW'&÷"bb…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"3†f&c†b"ÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢$FöæRÇS#Bf–ÆW2Æ6VB–âF†RvÖRföÆFW"â&W7F'B7FVÒ–bæVVFVBâ"Ò’•ÒÒ’Ò’’ÂFW÷FFÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢7–æ2‚’Óâ°¢6WD'W7’‚&'"“°¢ÆWB'V–ÆG2ÒµÓ°¢G'’°¢6öç7B"Òv—B'Æ—7D'V–ÆG2†–B“°¢–b‡"ç7V66W72¢'V–ÆG2Ò"æ'V–ÆG2æf–ÇFW"‚†"’Óâ"æ—47W'&VçB“°¢Ð¢6F6‚²ò¢¢òÐ¢6WD'W7’‚""“°¢–b‚'V–ÆG2æÆVæwF‚’°¢6WDæ÷FR‚$æòöÆFW"'V–ÆG2öâ7FVÔD"f÷"F†—2vÖRâ"“°¢&WGW&ã°¢Ð¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚…–6¶W$ÖöFÂÂ²F—FÆS¢$&6†—fRvÖR6æ6†÷B"Â7V'F—FÆS¢$6†ö÷6RF†R&WV—&VB'V–ÆBâ—G2v–G2ÂÖæ–fW7G2æB¶W—2&R7F÷&VBv—F‚WfW'’÷F–öæÂvÖR6WGF–ær4Å4FV6²6â6GW&Râ"Â—FV×3¢'V–ÆG2æÖ‚†"’Óâ‡²¶W“¢"æ'V–ÆF–BÂÆ&VÃ¢'V–ÆBG¶"æ'V–ÆF–GÖÂ7V&Æ&VÃ¢"æFFRÒ’’Âöå–6³¢7–æ2†—B’Óâ°¢6öç7BGBÒ'V–ÆG2æf–æB‚†"’Óâ"æ'V–ÆF–BÓÓÒ—Bæ¶W’“òæFFRÇÂ"#°¢v—B'Vâ‚&&6†—fR"Â7–æ2‚’Óâ°¢òò&W6öÇfRF†RW†7BW"ÖFW÷Bv–G2F†R6ÖRv’F†P¢òò'V–ÆB–6¶W"FöW2(	B7FVÔD"w26–væVBÖ–â†—7F÷'’À¢òòFFRÖÖF6†VB(	B&V6W6RF†B—2F†RöæÇ’6÷W&6Rv—F‚¢òòFW÷Bw2gVÆÂ†—7F÷'’âv—F†÷WBv–G2F†W&R—2æ÷F†–æp¢òòv÷'F‚&6†—f–ærà¢6WDæ÷FR†&W6öÇf–ærFW÷BÖæ–fW7G2f÷"'V–ÆBG¶—Bæ¶W—Þ(
f“°¢6öç7BÖÒv—B&W6öÇfTv–G5f–7FVÖF"†GBÂ‡2’Óâ6WDæ÷FR‡2’“°¢–b‚ö&¦V7Bæ¶W—2†Ö’æÆVæwF‚’°¢&WGW&â²7V66W73¢fÇ6RÂW'&÷#¢$6÷VÆBæ÷B&W6öÇfRF†—2'V–ÆBw2FW÷BÖæ–fW7G2…7FVÔD"6–vâÖ–âæVVFVB’â"Ó°¢Ð¢6WDæ÷FR†&6†—f–ær'V–ÆBG¶—Bæ¶W—Ò‚G´ö&¦V7Bæ¶W—2†Ö’æÆVæwF‡ÒFW÷G2ž(
f“°¢6öç7B&6†—fVBÒv—B'V–ÆD&6†—fTFB†–BÂ—Bæ¶W’Â¥4ôâç7G&–æv–g’†Ö’ÂGBÂ""“°¢–b‚&6†—fVBç7V66W72¢&WGW&â&6†—fVC°¢ÆWB÷G2ÒçVÆÃ°¢G'’°¢6öç7BbÒv–æF÷rå7FVÔ6Æ–VçCòä3òävWDÆVæ6„÷F–öç4f÷$òâ†–B“°¢–b‡G—VöbbÓÓÒ'7G&–ær"¢÷G2Òc°¢Ð¢6F6‚²ò¢÷F–öæÂf–VÆB7F—2Vç6WB¢òÐ¢òòF†R6ö×ÆWFR'V–ÆB—2F†R6æ6†÷Bw2öæÇ’ÖæFF÷'¢òò6ö×öæVçBâ6GW&Rf—†W2ÂÆVæ6‚&w2Â&÷FöâæBDÄ0¢òò÷÷'GVæ—7F–6ÆÇ“²âVæf–Æ&ÆR÷F–öæÂ6÷W&6R×W7@¢òòæ÷BGW&âfÆ–B&6†—fR–çFò&W÷'FVBf–ÇW&Rà¢v—B&6†—fU6æ6†÷DvÖR†–BÂ÷G2Â""Â""Â—Bæ¶W’’æ6F6‚‚‚’ÓâçVÆÂ“°¢&WGW&â&6†—fVC°¢ÒÂ‡"’Óâ°¢–b‚"ç7V66W72¢&WGW&â"æW'&÷"ÇÂ$6÷VÆBæ÷B&6†—fRF†B'V–ÆB#°¢6öç7BÖ—72Ò"æÖ—76–ætÖæ–fW7G3òæÆVæwF‚ÇÂ°¢&WGW&â"æ6ö×ÆWFP¢ò&6†—fVBvÖR6æ6†÷Böâ'V–ÆBG¶—Bæ¶W—Ò(	BG·"æFW÷G7ÒFW÷B‡2’ÂG·"æÖæ–fW7G7ÒÖæ–fW7B‡2’ÂG·"æ¶W—7Ò¶W’‡2’æ ¢¢&6†—fVB'V–ÆBG¶—Bæ¶W—Ò–æ6ö×ÆWFR(	BG¶Ö—77ÒÖæ–fW7B‡2’Væf–Æ&ÆRG·"æ¶W—2ÓÒ"æFW÷G2òæBG²‡"æFW÷G2ÇÂ’Ò‡"æ¶W—2ÇÂ—ÒFW÷B¶W’‡2’Ö—76–æv¢"'Òâ‡V&6¶W’W7VÆÇ’f—†W2F†—2æ°¢Ò“°¢ÒÒ’“°¢ÒÂ6†–ÆG&Vã¢'W7’ÓÓÒ&&6†—fR"ò$&6†—f–æ~(
b"¢$&6†—fRvÖR6æ6†÷N(
b"Ò’Ò’’Â7FVÖÆW73òç7W÷'FVBbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢Fõ7FVÖÆW72Â6†–ÆG&Vã¢'W7’ÓÓÒ'7FVÖÆW72 ¢ò%v÷&¶–æ~(
b ¢¢7FVÖÆW72æ–ç7FÆÆVBbb7FVÖÆW72æ†57GV ¢ò%7FVÕ7GV"Ç&VG’&VÖ÷fVB ¢¢%&VÖ÷fR7FVÕ7GV"E$Ò…7FVÖÆW72’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢%7G&—27FVÒw2E$Òw&W"g&öÒF†RvÖRW†R†f—†W26öÖR7FVÕ7GV"ÆVæ6‚f–ÇW&W2ò6†–WfVÖVçBFööÇ2’âv–æF÷w2õ&÷FöâW†W2öæÇ’â&WfW'FVB'’VâÖf—‚â"Ò’Ò•ÒÒ’’ÂÆÆ÷uVæÆö6¶W'2bb6Öö¶Sòç7W÷'FVBbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’ÓâFõ6Öö¶R‚6Öö¶Ræ–ç7FÆÆVB’Â6†–ÆG&Vã¢'W7’ÓÓÒ'6Öö¶R ¢ò%v÷&¶–æ~(
b ¢¢6Öö¶Ræ–ç7FÆÆV@¢ò%&VÖ÷fRDÄ2VæÆö6²…6Öö¶T’’ ¢¢%VæÆö6²DÄ2…6Öö¶T’’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢$V×VÆFW2DÄ2÷væW'6†—–â×&ö6W72f÷"â÷væVBvÖRâvöâwBv÷&²öâV&—6ögBôTõ&ö6·7F"ôFVçWfòÕ6V7W&TDÄ2öçF’Ö6†VBF—FÆW2â&WfW'FVB'’VâÖf—‚â"Ò’Ò•ÒÒ’’ÂÆÆ÷uVæÆö6¶W'2bb²&7&VÒ"Â'WÆ—#"Â'WÆ—#"%ÒæÖ‚†¶–æB’ÓâFÆ5U¶¶–æEÓòç7W÷'FVBò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’ÓâFõVæÆö6¶W"†¶–æBÂFÆ5U¶¶–æEÓòæ–ç7FÆÆVB’Â6†–ÆG&Vã¢'W7’ÓÓÒVæÆö6²ÒG¶¶–æGÖ ¢ò%v÷&¶–æ~(
b ¢¢FÆ5U¶¶–æEÓòæ–ç7FÆÆV@¢ò&VÖ÷fRGµTäÄô4´U%ôÄ$TÅ¶¶–æE×Ö ¢¢VæÆö6²GµTäÄô4´U%ôÄ$TÅ¶¶–æE×ÖÒ’ÒÂ¶–æB’’¢çVÆÂ’ÂÆÆ÷uVæÆö6¶W'2bb7&V×“òç7W÷'FVBbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢Fô7&V×’Â6†–ÆG&Vã¢'W7’ÓÓÒ&7&V×’ ¢ò%v÷&¶–æ~(
b ¢¢7&V×’æ–ç7FÆÆV@¢ò%&V'V–ÆBæF—fRDÄ2VæÆö6²„7&V×•7FV×’’ ¢¢$6ö×–ÆRæF—fRDÄ2VæÆö6²„7&V×•7FV×’’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢²$f÷"æF—fRÔÆ–çW‚vÖW2†Æ–'7FVÕö’ç6ò’â6ö×–ÆW2fW'6–öâÖÖF6†VBDÄ2×VæÆö6²&÷‡’öâÖFWf–6R"Â7&V×’æ†fUFööÆ6†–âò""¢"(	Bf—'7B'VâF÷væÆöG2ãCTÔ"6ö×–ÆW""Â"â&WfW'FVB'’VâÖf—‚âW‡W&–ÖVçFÂâ%ÒÒ’Ò•ÒÒ’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&×"Â‚’Óâ6†V6´×VÇF—Æ–W"†–B’Â‡"’Óâ°¢6WD×‡"“°¢&WGW&â"ç7V66W72òG·"æ†VFÆ–æWÕÆåÆâG·"æFWF–ÇÖ¢"æW'&÷"ÇÂ$6÷VÆBæ÷B6†V6²#°¢Ò’Â6†–ÆG&Vã¢'W7’ÓÓÒ&×"ò$6†V6¶–æ~(
b"¢%v–ÆÂ×VÇF—Æ–W"v÷&³ò"Ò’Ò’Â×òçfW&F–7BÓÓÒ'VW""bb×òæf—‚ÓÓÒ&öæÆ–æVf—‚"bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&öæÆ–æVf—‚"Â‚’ÓâF6„vÖTöæÆ–æVf—‚†–B’Â‡"’Óâ°¢–b‚"ç7V66W72¢&WGW&â"æW'&÷"ÇÂ$6÷VÆBæ÷B6†V6²F†—2vÖR#°¢6öç7Bf÷VæBÒ"æFWFV7FVDf—†W2ÇÂµÓ°¢–b‚f÷VæBæÆVæwF‚¢&WGW&â"æÖW76vRÇÂ$æòöæÆ–æRÖf—‚DÄÇ2f÷VæB–âF†—2vÖRâ#°¢&WGW&âf÷VæBG¶f÷VæBæ¦ö–â‚"Â"—Ò(	B6WBÆVæ6‚÷F–öç2Fó¢G·"æÆVæ6„÷F–öçÖ°¢Ò’Â6†–ÆG&Vã¢'W7’ÓÓÒ&öæÆ–æVf—‚"ò%v÷&¶–æ~(
b"¢%6WBWöæÆ–æRÖf—‚×VÇF—Æ–W""Ò’Ò’’Âæ÷FRò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚…67&öÆÆ&ÆU&W7VÇBÂ²FW‡C¢æ÷FRÂ6÷“¢æ÷FRæÆVæwF‚â#Ò’Ò’’¢çVÆÅÒÒ’“°§Ð ¢ò¢ ¢¢F–væ÷7F–72æBv†öÆRÖÆ–'&'’Ö–çFVææ6Rà¢ ¢¢Væv–æR–FVçF—G’—26†÷vâf—'7BæBFVÆ–&W&FVÇ“¢öâ7Fö6²4Å77FVÒâFFV@¢¢vÖR6âæWfW"FV7'—B—G2FW÷G2ÂæBF†RöæÇ’7–×FöÒ—26–ÆVçBf–ÇW&P¢¢FòF÷væÆöBâWfW'—F†–ærVÇ6R†W&R—2öæR×F7F–öâF†B&W÷'G2v†B—@¢¢7GVÆÇ’F–B&F†W"F†â§W7BFö7F–ær&FöæR"à¢¢ð¦gVæ7F–öâFööÇ56V7F–öâ‚’°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶Væv–æRÂ6WDVæv–æUÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶æ÷FRÂ6WDæ÷FUÒÒ5õ$T5BçW6U7FFR‚""“°¢òòF†R†VÇF‚6†V6²W6VBFò&W÷'B&f—†&ÆS¢Â"Â2"æBF†VâöffW"æòv’Fð¢òòf—‚ç’öb—BâWFõ÷&W—%÷7—7FVÒW†—7FVBF†Rv†öÆRF–ÖRv—F‚æò6ÆÆW"à¢6öç7B·&W—&&ÆRÂ6WE&W—&&ÆUÒÒ5õ$T5BçW6U7FFR…µÒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢Væv–æT—4Öööâ‚’çF†Vâ‚‡"’Óâ6WDVæv–æR‡"ÇÂçVÆÂ’’æ6F6‚‚‚’Óâ²Ò“°¢ÒÂµÒ“°¢6öç7B'VâÒ7–æ2†–BÂfâÂFW67&–&R’Óâ°¢6WD'W7’†–B“°¢6WDæ÷FR‚""“°¢G'’°¢6WDæ÷FR†FW67&–&R‚†v—Bfâ‚’’ÇÂ·Ò’“°¢Ð¢6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢6WD'W7’‚""“°¢Ó°¢6öç7B–BÒ7W'&VçDÆ–'&'”–B‚“°¢6öç7BVæv–æTö²ÒVæv–æRbbVæv–æRæÖööã°¢6öç7BVæv–æUFW‡BÒVæv–æRÓÒçVÆÀ¢ò&6†V6¶–æ~(
b ¢¢Væv–æRæ–ç7FÆÆV@¢òVæv–æTö°¢ò'6Ç7FVÒÖÖööâ†6÷'&V7B’ ¢¢'7Fö6²4Å77FVÒ(	BFFVBvÖW26ææ÷BF÷væÆöB ¢¢&æ÷B–ç7FÆÆVB#°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%FööÇ2bF–væ÷7F–72"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãƒRÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢²$Væv–æS¢"Â""Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢°¢6öÆ÷#¢Væv–æRÓÒçVÆÂò&–æ†W&—B"¢Væv–æTö²ò"3Cv3ƒv2"¢"6SSS362"À¢föçEvV–v‡C¢cÀ¢ÒÂ6†–ÆG&Vã¢Væv–æUFW‡BÒ•ÒÒ’Ò’ÂVæv–æTö²bbVæv–æRÒçVÆÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&Væv–æR"Â‚’ÓâVç7W&TÖööäVæv–æR‚’Â‡"’Óâ"æ6†ævVBò%&V–ç7FÆÆVB6Ç7FVÒÖÖööâ(	B&W7F'B7FVÒâ"¢"æW'&÷"ÇÂ$æò6†ævR"’Â6†–ÆG&Vã¢'W7’ÓÓÒ&Væv–æR"ò$–ç7FÆÆ–ærVæv–æ^(
b"¢$–ç7FÆÂF†R6÷'&V7BVæv–æR"Ò’Ò’’Â–BÒçVÆÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&6†V6²"Â7–æ2‚’Óâ°¢6öç7BÒv—BF÷væÆöE&VfÆ–v‡B†–B“°¢–b‡bbç&VG’ÓÓÒfÇ6R¢&WGW&â²¶–æC¢'&R"ÂÓ°¢&WGW&â²¶–æC¢&F–r"ÂC¢v—BF÷væÆöDF–væ÷6—2†–B’Ó°¢ÒÂ‡"’Óâ"æ¶–æBÓÓÒ'&R ¢òæ÷B&VG“¢G²‡"çæf–ÆVBÇÂµÒ’æ¦ö–â‚"Â"—Ö ¢¢‡"æBbb"æBç7VÖÖ'’’ÇÂ$æò–ç7FÆÂGFV×B&V6÷&FVB–WB"’Â6†–ÆG&Vã¢'W7’ÓÓÒ&6†V6²"ò$6†V6¶–æ~(
b"¢%v‡’vöâwBF†—2vÖRF÷væÆöCò"Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚'&÷b"Â‚’Óâ&÷f—6–öäFW÷G2‚’Â‡"’Óâ&RÖÆ–VBG²‡"æ¶W—2ÇÂ·Ò’çw&—GFVâÇÂÒFW÷B¶W’‡2’ÂG·"æÖæ–fW7G46÷–VBÇÂÒÖæ–fW7B‡2–’Â6†–ÆG&Vã¢'W7’ÓÓÒ'&÷b"ò%&RÖÇ––æ~(
b"¢%&RÖÇ’FW÷B¶W—2"Ò’Ò’Â–BÒçVÆÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚'†çFöÒ"Â‚’Óâ6ÆV%†çFöÔ–ç7FÆÂ†–B’Â‡"’Óâ"æ6ÆV&VBò$6ÆV&VB(	B7FVÒv–ÆÂöffW"Fò–ç7FÆÂv–ââ"¢$æ÷F†–ærFò6ÆV"â"’Â6†–ÆG&Vã¢'W7’ÓÓÒ'†çFöÒ"ò$6ÆV&–æ~(
b"¢tf—‚&–ç7FÆÆVB"'WBV×G’rÒ’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚'7F÷&vR"Â‚’ÓâvWE7F÷&vT–æfò‚’Â‡"’Óâ°¢6öç7BÂÒ"æÆ–'&&–W2ÇÂ"æG&—fW2ÇÂµÓ°¢&WGW&âÂæÆVæwF€¢òÂæÖ‚†B’ÓâG¶BæÆ&VÂÇÂBçF‡Ó¢G¶Bæg&VTt"óò#ò'Òt"g&VV’æ¦ö–â‚"+r"¢¢$æòÆ–'&&–W2f÷VæB#°¢Ò’Â6†–ÆG&Vã¢'W7’ÓÓÒ'7F÷&vR"ò%&VF–æ~(
b"¢%6†÷rG&—fR76R"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&6ÆVâ"Â‚’Óâ6ÆVåFV×F÷væÆöG2‚’Â‡"’Óâg&VVBG·"æ6ÆVæVDÔ"óòÒÔ"g&öÒG·"æ6ÆVæVDf–ÆW2óòÒFV×f–ÆR‡2–’Â6†–ÆG&Vã¢'W7’ÓÓÒ&6ÆVâ"ò$6ÆVæ–æ~(
b"¢$6ÆVâFV×÷&'’F÷væÆöBf–ÆW2"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&'B"Â‚’Óâ7–æ4ÆÄFFVD'B†fÇ6R’Â‡"’Óâ'Gv÷&²7–æ6VBf÷"G·"ç7–æ6VBóò"æ6÷VçBóòÒvÖR‡2–’Â6†–ÆG&Vã¢'W7’ÓÓÒ&'B"ò$fWF6†–ær'Gv÷&¾(
b"¢$fWF6‚Ö—76–ærÆ–'&'’'Gv÷&²"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&VF—B"Â‚’Óâ'Vå7—7FVÔVF—B‚’Â‡"’Óâ°¢6öç7B6öFW2Ò"ç&W—&&ÆT6öFW2ÇÂµÓ°¢6WE&W—&&ÆR†6öFW2“°¢&WGW&â†VÇF‚G·"æ†VÇF…66÷&Róò#ò'ÒRG¶6öFW2æÆVæwF‚ò"(	Bf—†&ÆS¢"²6öFW2æ¦ö–â‚"Â"’¢"(	Bæ÷F†–ærFò&W—"'Ö°¢Ò’Â6†–ÆG&Vã¢'W7’ÓÓÒ&VF—B"ò$6†V6¶–æ~(
b"¢%'Vâ†VÇF‚6†V6²"Ò’Ò’Â&W—&&ÆRæÆVæwF‚âbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚'&W—""Â‚’ÓâWFõ&W—%7—7FVÒ‚’Â‡"’Óâ°¢6öç7BFöæRÒ"ç&W—'4FöæRÇÂ"ç&W—'2ÇÂµÓ°¢6öç7BW''2Ò"æW'&÷'2ÇÂµÓ°¢–b†FöæRæÆVæwF‚¢6WE&W—&&ÆR…µÒ“°¢&WGW&âFöæRæÆVæwF€¢ò&W—&VBG¶FöæRæÆVæwF‡Ò—FVÒ‡2“¢G¶FöæRæ¦ö–â‚#²"—ÒG¶W''2æÆVæwF‚ò(	BG¶W''2æÆVæwF‡Ò7F–ÆÂf–Æ–æv¢"'Ö ¢¢W''2æÆVæwF€¢ò6÷VÆBæ÷B&W—#¢G¶W''2æ¦ö–â‚#²"—Ö ¢¢$æ÷F†–æræVVFVB&W—&–ærâ#°¢Ò’Â6†–ÆG&Vã¢'W7’ÓÓÒ'&W—""ò%&W—&–æ~(
b"¢&W—"v†BF†R6†V6²f÷VæB‚G·&W—&&ÆRæÆVæwF‡Ò–Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&6öæfÆ–7G2"Â‚’Óâ&W—$6öæfÆ–7G2‚’Â‡"’Óâ°¢6öç7B&ÒÒ"ç&VÖ÷fVBÇÂµÓ°¢6öç7Bæ÷FW2Ò"ææ÷FW2ÇÂµÓ°¢–b‚&ÒæÆVæwF‚bbæ÷FW2æÆVæwF‚¢&WGW&â$æò6öæfÆ–7G2f÷VæB„Ö–ÆÆVææ—VÒò7—7FVÒ6Ç77FVÒ’â#°¢&WGW&â·&ÒæÆVæwF‚ò&VÖ÷fVC¢G·&Òæ¦ö–â‚"Â"—Ö¢""Âââææ÷FW5Ð¢æf–ÇFW"„&ööÆVâ¢æ¦ö–â‚"+r"“°¢Ò’Â6†–ÆG&Vã¢'W7’ÓÓÒ&6öæfÆ–7G2"ò%&W—&–æ~(
b"¢%&W—"Væv–æR6öæfÆ–7G2„Ö–ÆÆVææ—VÒò7—7FVÒ6Ç77FVÒ’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’Óâ'Vâ‚&&6·W"Â‚’Óâ7&VFT&6·W‚""ÂfÇ6RÂG'VR’Â‡"’Óâ"ç7V66W72ò&6·W6fVBFòG·"çF‡Ö¢"æW'&÷"ÇÂ$&6·Wf–ÆVB"’Â6†–ÆG&Vã¢'W7’ÓÓÒ&&6·W"ò$&6¶–ærW(
b"¢$&6²W×’FFVBvÖW2"Ò’Ò’Âæ÷FRò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢föçE6—¦S¢À¢÷6—G“¢ã‚À¢Æ–æT†V–v‡C¢ãBÀ¢FF–æs¢#'‚"À¢v÷&D'&V³¢&'&V²×v÷&B"À¢ÒÂ6†–ÆG&Vã¢æ÷FRÒ’Ò’’¢çVÆÅÒÒ’“°§Ð ¦gVæ7F–öâ6†—C‡²ö²ÂÆ&VÂÒ’°¢&WGW&â…5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢°¢F—7Æ“¢&–æÆ–æRÖ&Æö6²"À¢FF–æs¢#‚‡‚"À¢Ö&v–å&–v‡C¢bÀ¢&÷&FW%&F—W3¢À¢föçE6—¦S¢À¢&6¶w&÷VæC¢ö²ò'&v&ƒƒ‚Ã“rÃ#Ãã‚’"¢'&v&ƒ#CRÃcbÃ3RÃã‚’"À¢6öÆ÷#¢ö²ò"3S†3Ss‚"¢"6cVc#2"À¢ÒÂ6†–ÆG&Vã¢¶ö²ò.)É2"¢.(
""ÂÆ&VÅÒÒ’“°§Ð¢ò¢ ¢¢6ö×7B4Å77FVÒ&Æö6²f÷"F†RV–6²Ö66W72æVÃ¢7FGW26†—2²6WGWà¢¢f—'7B×F–ÖR6WGW&VÖ–ç2f–Æ&ÆRv†–ÆRF†RVæv–æR—2Ö—76–ærâöæ6RF†P¢¢Væv–æR—2–ç7FÆÆVBÂF†Rv†öÆR&Æö6²—2†–FFVâöâÆ–'&'’vÖRvW26òF†P¢¢4Å77FVÒF—FÆRò–ç7FÆÆVBò–æ¦V7FVB6†—2ò&V–ç7FÆÂ6öçG&öÂFòæ÷B6—@¢¢&÷fRF†RW"ÖvÖR7F–öç2â÷WG6–FRvÖRvRF†RÖ–çFVææ6R&Æö6²&VÖ–ç2à¢¢ð¦gVæ7F–öâ6Ç57FVÔ6ö×7B‡²7FGW2Â7FGW46†V6¶VBÂöå&Vg&W6…7FGW2ÂÒ’°¢6öç7B¶–ç7BÂ6WD–ç7EÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·6†÷u&V–ç7FÆÂÂ6WE6†÷u&V–ç7FÆÅÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·7—2Â6WE7—5ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·×6rÂ6WE×6uÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7BöÆÂÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B&Vg&W6‚Ò7–æ2‚’Óâ°¢v—Böå&Vg&W6…7FGW2‚“°¢G'’°¢6öç7B2Òv—B7—7FVÕ7FGW2‚“°¢–b‡2ç7V66W72¢6WE7—2‡2“°¢Ð¢6F6‚²ò¢¢òÐ¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢&Vg&W6‚‚“°¢vWE6†÷u&V–ç7FÆÅÒ‚’çF†Vâ‚‡"’Óâ6WE6†÷u&V–ç7FÆÂ‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢&WGW&â‚’Óâ²–b‡öÆÂæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÂæ7W'&VçB“²Ó°¢ÒÂµÒ“°¢òòv—Bf÷"'Vææ–ær4Å77FVÒ–ç7FÆÂFòf–æ—6‚‡öÆÂ—G27FGW2’à¢6öç7Bv—D–ç7FÆÂÒ‚’ÓâæWr&öÖ—6R‚‡&W6öÇfR’Óâ°¢6öç7B—bÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B7BÒv—BvWE6Ç77FVÔ–ç7FÆÅ7FGW2‚“°¢6WD–ç7B‡7Bç7FFRÇÂçVÆÂ“°¢6öç7B2Ò7Bç7FFSòç7FGW3°¢–b‡2ÓÓÒ&FöæR"ÇÂ2ÓÓÒ&f–ÆVB"’°¢6ÆV$–çFW'fÂ†—b“°¢&W6öÇfR‡2ÓÓÒ&FöæR"“°¢Ð¢Ð¢6F6‚²ò¢¶VWöÆÆ–ær¢òÐ¢ÒÂS“°¢Ò“°¢òòöæR×Föæ&ö&F–æs¢–ç7FÆÂ÷fW&–g’F†RVæv–æRÂ'VâF†R6Æ–VçBf—‚ÂF†Và¢òò–ç7FÆÂ6Æ÷VE&VF—&V7BâF†—2'WGFöâW†—7G2öæÇ’v†–ÆRF†RVæv–æR—2Ö—76–ærà¢6öç7BV–6´–ç7FÆÂÒ7–æ2‚’Óâ°¢6WD'W7’‡G'VR“°¢6WD–ç7B†çVÆÂ“°¢G'’°¢6öç7B2Òv—B7—7FVÕ7FGW2‚“°¢–b‡2ç7V66W72bb‡2æf÷&V–väVæv–æRÇÂ‡2æVæv–æT–ç7FÆÆVBbb2æVæv–æRÓÒ'6Ç7FVÒÖÖööâ"’’’°¢6WE×6r†6ÆV&–ær6öæfÆ–7F–ærVæv–æR‚G·2æf÷&V–väæÖRÇÂ2æVæv–æWÒž(
f“°¢G'’°¢6öç7BBÒv—BF—6&ÆTf÷&V–väVæv–æW2‚“°¢–b†Bç7V66W72bb†BæF—6&ÆVBÇÂµÒ’æÆVæwF‚¢6WE×6r†F—6&ÆVBG¶Bæf÷&V–väæÖRÇÂ&Væv–æR'Òâ–ç7FÆÆ–ær6Ç7FVÒÖÖööî(
f“°¢Ð¢6F6‚²ò¢&W7BÖVff÷'B¢òÐ¢Ð¢–b‚2æVæv–æT–ç7FÆÆVBÇÂ‡2æVæv–æT–ç7FÆÆVBbb2æVæv–æRÓÒ'6Ç7FVÒÖÖööâ"’’°¢6WE×6r‚$–ç7FÆÆ–ær6Ç7FVÒÖÖööî(
b"“°¢6öç7B"Òv—B–ç7FÆÅ6Ç77FVÒ‚“°¢–b‚"ç7V66W72’°¢6öç7BÒÒ"æÖ—76–ætFW3òæÆVæwF‚ò6ææ÷BVç6³¢G·"æÖ—76–ætFW2æ¦ö–â‚"Â"—Ö¢‡"æW'&÷"ÇÂ%4Å77FVÒ–ç7FÆÂf–ÆVB"“°¢6WD–ç7B‡²7FGW3¢&f–ÆVB"ÂW'&÷#¢ÒÒ“°¢6WD'W7’†fÇ6R“°¢&WGW&ã°¢Ð¢6öç7Bö²Òv—Bv—D–ç7FÆÂ‚“°¢–b‚ö²’°¢6WD'W7’†fÇ6R“°¢&WGW&ã°¢Ð¢6WE×6r‚$Ç––ær6Æ–VçBf—Ž(
b"“°¢G'’°¢v—B'Vä6Æ–VçDf—‚‚“°¢Ð¢6F6‚²ò¢&W7BÖVff÷'B¢òÐ¢Ð¢VÇ6R°¢6WE×6r‚'6Ç7FVÒÖÖööâÇ&VG’–ç7FÆÆVBâ"“°¢Ð¢6WE×6r‚$–ç7FÆÆ–ær6Æ÷VE&VF—&V7B–âF†R&6¶w&÷VæB†6Æ÷VB6fW2ž(
b"“°¢7$Vç7W&T–ç7FÆÆVB‚’æ6F6‚‚‚’Óâ²Ò“°¢6WE×6r‚%4Å4FV6²—26WBWâ&VÆöB7FVÒFòf–æ—6‚â„6Æ÷VE&VF—&V7Bf–æ—6†W2–âF†R&6¶w&÷VæBâ’"“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%4Å4FV6²6WBW"Ò“°¢&Vg&W6‚‚“°¢6WEF–ÖV÷WB‚‚’Óâ&VÆöE7FVÒ‚’æ6F6‚‚‚’Óâ²Ò’Â3“°¢Ð¢6F6‚†R’°¢6WE×6r†6WGWW'&÷#¢G¶WÖ“°¢Ð¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7BvF6‚Ò‚’Óâ°¢–b‡öÆÂæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÂæ7W'&VçB“°¢öÆÂæ7W'&VçBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B7BÒv—BvWE6Ç77FVÔ–ç7FÆÅ7FGW2‚“°¢6WD–ç7B‡7Bç7FFRÇÂçVÆÂ“°¢6öç7B2Ò7Bç7FFSòç7FGW3°¢–b‡2ÓÓÒ&FöæR"ÇÂ2ÓÓÒ&f–ÆVB"’°¢–b‡öÆÂæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÂæ7W'&VçB“°¢6WD'W7’†fÇ6R“°¢&Vg&W6‚‚“°¢–b‡2ÓÓÒ&FöæR"’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%4Å77FVÒ–ç7FÆÆVB"Ò“°¢–b‡7Bç7FFSòæ–ç7FÆÆVB¢6WEF–ÖV÷WB‚‚’Óâ&VÆöE7FVÒ‚’Â3“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢7Bç7FFSòæW'&÷"ÇÂ$f–ÆVB"Ò“°¢Ð¢Ð¢Ð¢6F6‚²ò¢¶VWöÆÆ–ær¢òÐ¢ÒÂS“°¢Ó°¢6öç7B–ç7FÆÂÒ7–æ2‚’Óâ°¢6WD'W7’‡G'VR“°¢6WD–ç7B‡²7FGW3¢'VWVVB"Ò“°¢G'’°¢6öç7B"Òv—B–ç7FÆÅ6Ç77FVÒ‚“°¢–b‚"ç7V66W72’°¢6öç7B×6rÒ"æÖ—76–ætFW3òæÆVæwF€¢ò6ææ÷BVç6³¢G·"æÖ—76–ætFW2æ¦ö–â‚"Â"—Ö ¢¢"æW'&÷"ÇÂ$6÷VÆBæ÷B7F'B–ç7FÆÂ#°¢6WD'W7’†fÇ6R“°¢6WD–ç7B‡²7FGW3¢&f–ÆVB"ÂW'&÷#¢×6rÒ“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢×6rÒ“°¢&WGW&ã°¢Ð¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$–ç7FÆÆ–æ~(
b†fWrÖ–â’"Ò“°¢vF6‚‚“°¢Ð¢6F6‚†R’°¢6öç7B×6rÒ7G&–ær†SòæÖW76vRóòR“°¢6WD'W7’†fÇ6R“°¢6WD–ç7B‡²7FGW3¢&f–ÆVB"ÂW'&÷#¢–ç7FÆÂW'&÷#¢G¶×6wÖÒ“°¢Ð¢Ó°¢6öç7Bv÷&¶–ærÒ'W7’ÇÂ–ç7Còç7FGW2ÓÓÒ''Vææ–ær"ÇÂ–ç7Còç7FGW2ÓÓÒ'VWVVB#°¢òòF†RV–6²66W72æVÂ6â&R÷VæVBg&öÒV—F†W"Æ–'&'’FWF–Ç2vR÷ ¢òòâ–âÖ6Æ–VçB7F÷&RvÖRvRâF†RÆGFW"W6VBFòÆöö²Æ–¶RæöâÖvÖP¢òòvR†W&RÂv†–6‚ÖFR&V–ç7FÆÂV"WfVâv†Vâ—G2ÒFövvÆRv2öfbà¢6öç7BöäÆ–'&'”vÖUvRÒ7W'&VçDÆ–'&'”–B‚’ÒçVÆÃ°¢6öç7Böå7F÷&TvÖUvRÒvWE7F÷&T–B‚’ÒçVÆÃ°¢6öç7BöävÖUvRÒöäÆ–'&'”vÖUvRÇÂöå7F÷&TvÖUvS°¢6öç7B6†÷u&V–ç7FÆÄ'WGFöâÒ7FGW3òæ–ç7FÆÆVBbb‚öävÖUvRÇÂ6†÷u&V–ç7FÆÂ“°¢òòöâÆ–'&'’vÖRvRF†R–ç7FÆÆVBVæv–æR—2vÆö&ÂÇVÖ&–ærÂæ÷B¢òòW"ÖvÖR7F–öââöâ7F÷&RvÖRvRF†R6ÖR6ö×ÆWFR&Æö6²‡F—FÆRÀ¢òò7FGW26†—2æB&V–ç7FÆÂ7F–öâ’—26öçG&öÆÆVB'’F†RÒ&V–ç7FÆÀ¢òò&VfW&Væ6RâÖ—76–ærÖVæv–æRöæ&ö&F–ær&VÖ–ç2f—6–&ÆRöâV—F†W"7W&f6Rà¢–b‡7FGW3òæ–ç7FÆÆVBbbv÷&¶–ærbb†öäÆ–'&'”vÖUvRÇÂ†öå7F÷&TvÖUvRbb6†÷u&V–ç7FÆÂ’’¢&WGW&âçVÆÃ°¢òòæWfW"–çFW'&WBâ'6VçB÷"7FÆR7FGW226öæf—&ÖVBÖ—76–ær–ç7FÆÂà¢òò&W6W'fRF†R6V7F–öâv†–ÆRF†Rf—'7BÆ—fR6†V6²'Vç26òF†R&W7BöbÐ¢òòFöW2æ÷B§V×æBæòFW7G'V7F—fR÷6WGW7F–öâ—2'&–VfÇ’W‡÷6VBà¢–b‚7FGW46†V6¶VBbb7FGW3òæ–ç7FÆÆVBbbv÷&¶–ær’°¢&WGW&â…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%4Å77FVÒ"Â6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö–ä†V–v‡C¢3BÂF—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""ÂföçE6—¦S¢"Â÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢BÂ†V–v‡C¢BÂÖ&v–å&–v‡C¢‚ÒÒ’Â$6†V6¶–ær4Å4FV6µÇS##b%ÒÒ’Ò’Ò’“°¢Ð¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%4Å77FVÒ"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„6†—CÂ²ö³¢7FGW3òæ–ç7FÆÆVBÂÆ&VÃ¢$–ç7FÆÆVB"Ò’Â5ô¥5‚æ§7‚„6†—CÂ²ö³¢7FGW3òæ–æ¦V7FVBÂÆ&VÃ¢$–æ¦V7FVB"Ò•ÒÒ’Ò’Âv÷&¶–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãƒRÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢BÂ†V–v‡C¢BÂÖ&v–å&–v‡C¢‚ÒÒ’Â–ç7Còç7FGW2ÓÓÒ'VWVVB"ò%7F'F–æ~(
b"¢$–ç7FÆÆ–æ~(
b"ÂG—Vöb–ç7CòçW&6VçBÓÓÒ&çVÖ&W""bb–ç7BçW&6VçBâòG¶–ç7BçW&6VçGÒV¢"%ÒÒ’Ò’’Â–ç7Còç7FGW2ÓÓÒ&f–ÆVB"bb–ç7CòæW'&÷"bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"6cVc#2"Âv†—FU76S¢'&R×w&"Âv÷&D'&V³¢&'&V²×v÷&B"ÒÂ6†–ÆG&Vã¢–ç7BæW'&÷"Ò’Ò’’Â7—3òæf÷&V–väVæv–æRbb7FGW3òæ–ç7FÆÆVBbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"6cVc#2"ÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢²$FWFV7FVB"Â7—2æf÷&V–väæÖRÇÂ&æ÷F†W"Væv–æR"Â"ÇS#B–ç7FÆÂv–ÆÂF—6&ÆR—B‡&WfW'6–&Ç’’æB6WBW6Ç7FVÒÖÖööââ%ÒÒ’Ò’’Âv÷&¶–ærbb7FGW46†V6¶VBbb7FGW3òæ–ç7FÆÆVBÓÓÒfÇ6Rbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢V–6´–ç7FÆÂÂ6†–ÆG&Vã¢$–ç7FÆÂ4Å4FV6²†öæR×F6WGW’"Ò’Ò’’Âv÷&¶–ærbb7FGW46†V6¶VBbb7FGW3òæ–ç7FÆÆVBÓÓÒfÇ6Rbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢²$–ç7FÆÇ26Ç7FVÒÖÖööâ"Â7—3òæf÷&V–väVæv–æRò"†F—6&Æ–ærç’÷F†W"Væv–æRf—'7B’"¢""Â"²6Æ÷VE&VF—&V7BæBÆ–W2F†R6Æ–VçBf—‚Â–â÷&FW"â%ÒÒ’Ò’’Âv÷&¶–ærbb6†÷u&V–ç7FÆÄ'WGFöâbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢–ç7FÆÂÂ6†–ÆG&Vã¢%&V–ç7FÆÂ4Å77FVÒ"Ò’Ò’’Â×6rò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ã‚ÂFF–æs¢#'‚"Âv†—FU76S¢'&R×w&"ÒÂ6†–ÆG&Vã¢×6rÒ’Ò’’¢çVÆÅÒÒ’“°§Ð ¢òò–6²öæRöbF†RW6W"w2FFVBvÖW2â&W6öÇfW2F†R6†÷6Vâ¶–BÆæÖWÒ÷"çVÆÀ¢òò–bF†RÖöFÂ—2F—6Ö—76VBv—F†÷WB–6²à¦gVæ7F–öâvÖU–6¶W$ÖöFÂ‡²6Æ÷6TÖöFÂÂöå&W7VÇBÂÒ’°¢6öç7B¶2Â6WD5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·–6¶VBÂ6WE–6¶VEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢vWD–ç7FÆÆVD2‚¢çF†Vâ‚‡"’Óâ"ç7V66W72bb6WD2‚‡"æ2ÇÂµÒ’æÖ‚†’Óâ‡²–C¢çVÖ&W"†æ–B’ÂæÖS¢ææÖRÇÂ7G&–ær†æ–B’Ò’’’¢æ6F6‚‚‚’Óâ²Ò“°¢ÒÂµÒ“°¢6öç7B6Æ÷6RÒ‚’Óâ²–b‚–6¶VB¢öå&W7VÇB†çVÆÂ“²6Æ÷6TÖöFÃòâ‚“²Ó°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂäÖöFÅ&ö÷BÂ²6Æ÷6TÖöFÃ¢6Æ÷6RÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢‚ÂföçEvV–v‡C¢cÂÖ&v–ä&÷GFöÓ¢‚ÒÂ6†–ÆG&Vã¢%v†–6‚vÖR—2F†—2f÷#ò"Ò’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÂÖ&v–ä&÷GFöÓ¢ÒÂ6†–ÆG&Vã¢%–6²F†RvÖRF†—2f–ÆR6†÷VÆB&R&÷VæBFòâ"Ò’Â5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"Âv¢bÂÖ„†V–v‡C¢#Sgf‚"Â÷fW&fÆ÷u“¢'67&öÆÂ"ÒÂ6†–ÆG&Vã¢¶2æÆVæwF‚ÓÓÒbb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—G“¢ãbÂföçE6—¦S¢"ÒÂ6†–ÆG&Vã¢$æòFFVBvÖW2f÷VæBâ"Ò’Â2æÖ‚†’Óâ…5ô¥5‚æ§7‡2„DdÂäF–Æöt'WGFöâÂ²7G–ÆS¢²FW‡DÆ–vã¢&ÆVgB"ÂFF–æs¢#‡‚‚"ÒÂöä6Æ–6³¢‚’Óâ²6WE–6¶VB‡G'VR“²öå&W7VÇB†“²6Æ÷6TÖöFÃòâ‚“²ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢BÒÂ6†–ÆG&Vã¢ææÖRÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢²$”B"Âæ–EÒÒ•ÒÒÂæ–B’’•ÒÒ•ÒÒ’“°§Ð¦gVæ7F–öâ–6´vÖR‚’°¢&WGW&âæWr&öÖ—6R‚‡&W6öÇfR’Óâ°¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„vÖU–6¶W$ÖöFÂÂ²öå&W7VÇC¢&W6öÇfRÒ’“°¢Ò“°§Ð¦gVæ7F–öâ6öæf—&Õ&÷WFR†7GVÄ¶–æB’°¢6öç7B5v†BÒ7GVÄ¶–æBÓÓÒ&Öæ–fW7B"ò&7W7FöÒÖæ–fW7BòÇV"¢&7W7FöÒf—‚#°¢&WGW&âæWr&öÖ—6R‚‡&W6öÇfR’Óâ°¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢$F–ffW&VçBf–ÆRG—RFWFV7FVB"Â7G$FW67&—F–öã¢F†—2Æöö·2Æ–¶RG¶7GVÄ¶–æBÓÓÒ&Öæ–fW7B"ò&Öæ–fW7BòÇVf–ÆR"¢&vÖRf—‚†W†RöFÆÂ’'Òâ–×÷'B—B2G¶5v†GÒ–ç7FVCöÂ7G$ô´'WGFöåFW‡C¢$–×÷'B6÷'&V7FÇ’"Â7G$6æ6VÄ'WGFöåFW‡C¢$6æ6VÂ"Âöäô³¢‚’Óâ&W6öÇfR‡G'VR’Âöä6æ6VÃ¢‚’Óâ&W6öÇfR†fÇ6R’Ò’“°¢Ò“°§Ð¢ò¢ ¢¢gVÆÂ–×÷'BfÆ÷s¢–6²f–ÆRÂWFòÖFWFV7Bf—‚g2Öæ–fW7B†6öæf—&Ò–b—@¢¢F–ffW'2g&öÒF†RF"—Bv2ÆVæ6†VBg&öÒ’Â–6²F†RF&vWBvÖRÂ–×÷'Bà¢¢&WGW&ç2‡VÖâ×&VF&ÆR&W7VÇB7G&–ær‚""–bF†RW6W"6æ6VÆÆVB’à¢¢ð¦7–æ2gVæ7F–öâ–×÷'D7W7FöÔfÆ÷r†W‡V7FVB’°¢ÆWBF‚Ò"#°¢G'’°¢6öç7B&W2Òv—B÷Väf–ÆU–6¶W"ƒò¢f–ÆU6VÆV7F–öåG—Räd”ÄR¢òÂ"ö†öÖRöFV6²ôF÷væÆöG2"ÂG'VRÂG'VR“°¢F‚Ò&W3òç&VÇF‚ÇÂ&W3òçF‚ÇÂ"#°¢Ð¢6F6‚°¢&WGW&â"#°¢Ð¢–b‚F‚¢&WGW&â"#°¢ÆWB¶–æBÒW‡V7FVC°¢G'’°¢6öç7B2Òv—B7W7FöÔ6Æ76–g’‡F‚“°¢–b†2ç7V66W72bb2æ¶–æB¢¶–æBÒ2æ¶–æC°¢Ð¢6F6‚°¢ò¢¶VWW‡V7FVB¢ð¢Ð¢–b†¶–æBÓÒW‡V7FVB’°¢6öç7Bö²Òv—B6öæf—&Õ&÷WFR†¶–æB“°¢–b‚ö²¢&WGW&â"#°¢Ð¢6öç7BÒv—B–6´vÖR‚“°¢–b‚¢&WGW&â"#°¢G'’°¢6öç7B"Òv—B7W7FöÔ–×÷'B†æ–BÂF‚Â¶–æB“°¢–b‚"ç7V66W72¢&WGW&â"æW'&÷"ÇÂ$–×÷'Bf–ÆVBâ#°¢–b†¶–æBÓÓÒ&Öæ–fW7B"’°¢&WGW&â–×÷'FVBÖæ–fW7Bf÷"G¶ææÖWÒG·"æ7F—fFVBò"†7F—fFVB’"¢"'Òâ—BvÆÂ6†÷r–âF†RF÷væÆöBF"Æ—7Bæ°¢Ð¢&WGW&â–×÷'FVB7W7FöÒf—‚f÷"G¶ææÖWÒâ—BvÆÂ6†÷r2$7W7FöÒf—‚"'WGFöâ–âF†BvÖRw2f—†W2ÖVçRæ°¢Ð¢6F6‚†R’°¢&WGW&â–×÷'Bf–ÆVC¢G¶WÖ°¢Ð§Ð ¢òò–×÷'FVB7W7FöÒÖæ–fW7G2òÇVf–ÆW2Âw&÷WVB'’vÖR(	BÖ—'&÷'2F†P¢òò$Æ–VBf—†W2"Æ—7B7G–ÆR–âF†Rf—†W2F"à¦gVæ7F–öâ7W7FöÔÖæ–fW7G5æVÂ‚’°¢6öç7B¶vÖW2Â6WDvÖW5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7BÆöBÒ‚’Óâ7W7FöÔÆ—7DÆÄÖæ–fW7G2‚’çF†Vâ‚‡"’Óâ6WDvÖW2‡"ç7V66W72ò‡"ævÖW2ÇÂµÒ’¢µÒ’’æ6F6‚‚‚’Óâ²Ò“°¢5õ$T5BçW6TVffV7B‚‚’Óâ²ÆöB‚“²ÒÂµÒ“°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$7W7FöÒÖæ–fW7G2òÇV"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢7–æ2‚’Óâ°¢6öç7B×6rÒv—B–×÷'D7W7FöÔfÆ÷r‚&Öæ–fW7B"“°¢–b†×6r¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢×6rÒ“°¢ÆöB‚“°¢ÒÂ6†–ÆG&Vã¢$–×÷'BÖæ–fW7BòÇVÇS##b"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢%–6²æÇV÷"æÖæ–fW7BæBF†RvÖR—Bw2f÷"âæÇV—26÷–VB–çFò4Å77FVÒw27GÇVrÖ–â6òF†RVæv–æRÆöG2—Bâ–bF†Rf–ÆR—27GVÆÇ’f—‚Â–÷RvÆÂ&RöffW&VBFò–×÷'B—B27W7FöÒf—‚–ç7FVBâ"Ò’Ò’ÂvÖW2æÖ‚†r’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÂFF–æs¢#'‚'‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢rææÖRÇÂ”BG¶ræ–GÖÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢¶ræ6÷VçBÂ"f–ÆR"Âræ6÷VçBÓÓÒò""¢'2"Â"ÇS#r"Âræ—FV×2æÖ‚†’’Óâ’æÆ&VÂ’æ¦ö–â‚"Â"•ÒÒ•ÒÒ’ÒÂræ–B’’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’ÓâDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢$FVÆWFRÆÂ7W7FöÒÖæ–fW7G3ò"Â7G$FW67&—F–öã¢%&VÖ÷fW2WfW'’–×÷'FVBæÇVòæÖæ–fW7Bg&öÒâòæÆö6Â÷6†&Rõ4Å4FV6²ö7W7FöÕöÖæ–fW7G2âÇV2Ç&VG’6÷–VB–çFò7GÇVrÖ–â7F’7F—fRVçF–Â–÷R&VÖ÷fRF†RvÖRâ"Â7G$ô´'WGFöåFW‡C¢$FVÆWFR"Âöäô³¢7–æ2‚’Óâ°¢6öç7B"Òv—B7W7FöÔFVÆWFTÖæ–fW7G2ƒ“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò$7W7FöÒÖæ–fW7G26ÆV&VB"¢"æW'&÷"ÇÂ$f–ÆVB"Ò“°¢ÆöB‚“°¢ÒÒ’’Â6†–ÆG&Vã¢$FVÆWFR7W7FöÒÖæ–fW7G2"Ò’Ò•ÒÒ’“°§Ð¦gVæ7F–öâFDvÖU6V7F–öâ‡²öä6†ævVBÂ&Vg&W6…Fö¶VâÒÂ6†÷t–ç7FÆÆVBÒG'VRÒ’°¢6öç7B·VW'’Â6WEVW'•ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·&W7VÇG2Â6WE&W7VÇG5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·6V&6†–ærÂ6WE6V&6†–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶7F—fT–BÂ6WD7F—fT–EÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶7F—fTæÖRÂ6WD7F—fTæÖUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·7FFRÂ6WE7FFUÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7BöÆÅ&VbÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B6V&6…F–ÖW"Ò5õ$T5BçW6U&Vb†çVÆÂ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢&WGW&â‚’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢–b‡6V&6…F–ÖW"æ7W'&VçB¢6ÆV%F–ÖV÷WB‡6V&6…F–ÖW"æ7W'&VçB“°¢Ó°¢ÒÂµÒ“°¢6öç7B'Vå6V&6‚Ò‡fÇVR’Óâ°¢6WEVW'’‡fÇVR“°¢–b‡6V&6…F–ÖW"æ7W'&VçB¢6ÆV%F–ÖV÷WB‡6V&6…F–ÖW"æ7W'&VçB“°¢6öç7BG&–ÖÖVBÒfÇVRçG&–Ò‚“°¢–b‚G&–ÖÖVB’°¢6WE&W7VÇG2…µÒ“°¢&WGW&ã°¢Ð¢òòW&RçVÖW&–2–çWB—2G&VFVB2F—&V7B”Bà¢–b‚õåÆB²BòçFW7B‡G&–ÖÖVB’’°¢6WE&W7VÇG2…·²–C¢'6T–çB‡G&–ÖÖVBÂ’ÂæÖS¢”BG·G&–ÖÖVGÖÕÒ“°¢&WGW&ã°¢Ð¢6V&6…F–ÖW"æ7W'&VçBÒ6WEF–ÖV÷WB†7–æ2‚’Óâ°¢6WE6V&6†–ær‡G'VR“°¢G'’°¢6öç7B&W2Òv—B6V&6„vÖW2‡G&–ÖÖVBÂR“°¢6WE&W7VÇG2‡&W2ç7V66W72ò&W2ç&W7VÇG2¢µÒ“°¢Ð¢6F6‚°¢6WE&W7VÇG2…µÒ“°¢Ð¢f–æÆÇ’°¢6WE6V&6†–ær†fÇ6R“°¢Ð¢ÒÂC“°¢Ó°¢6öç7B7F÷öÆÆ–ærÒ‚’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB’°¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢öÆÅ&Vbæ7W'&VçBÒçVÆÃ°¢Ð¢Ó°¢6öç7B&Vv–äFBÒ7–æ2†–BÂæÖR’Óâ°¢6WD7F—fT–B†–B“°¢6WD7F—fTæÖR†æÖR“°¢6WE7FFR‡²7FGW3¢'VWVVB"Ò“°¢Ö&µ6Ç4FEVæF–ær†–B“°¢G'’°¢6öç7B&W2Òv—B7F'DFB†–B“°¢–b‚&W2ç7V66W72’°¢Ö&µ6Ç4FEVæF–ær†–BÂfÇ6R“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢&W2æW'&÷"ÇÂ$f–ÆVBFò7F'B"Ò“°¢6WE7FFR‡²7FGW3¢&f–ÆVB"ÂW'&÷#¢&W2æW'&÷"Ò“°¢&WGW&ã°¢Ð¢Ð¢6F6‚†R’°¢Ö&µ6Ç4FEVæF–ær†–BÂfÇ6R“°¢6WE7FFR‡²7FGW3¢&f–ÆVB"ÂW'&÷#¢7G&–ær†R’Ò“°¢&WGW&ã°¢Ð¢7F÷öÆÆ–ær‚“°¢öÆÅ&Vbæ7W'&VçBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B&W2Òv—BvWDFE7FGW2†–B“°¢–b‚&W2ç7V66W72¢&WGW&ã°¢6WE7FFR‡&W2ç7FFR“°¢6öç7B7FGW2Ò&W2ç7FFRç7FGW3°¢–b‡7FGW2ÓÓÒ&FöæR"’°¢7F÷öÆÆ–ær‚“°¢fö–B&Vg&W6„&FvW2‚“°¢6öç7BÆ—fRÒ&W2ç7FFRæÆ—fU&VG“°¢ÆWBæ÷F–g’ÒG'VS°¢G'’°¢æ÷F–g’Ò†v—BvWDæ÷F–g”vÖTFB‚’’æVæ&ÆVBÓÒfÇ6S°¢Ð¢6F6‚²ò¢FVfVÇBöâ¢òÐ¢–b†æ÷F–g’¢Fö7FW"çFö7B‡°¢F—FÆS¢%4Å4FV6²"À¢&öG“¢Æ—fP¢òFFVBG¶æÖWÒ(	Bf–Æ&ÆR–â7FVÒv—F†÷WB&W7F'F ¢¢FFVBG¶æÖWÒ(	B&W7F'B7FVÒFòf–æ—6‚&÷f—6–öæ–ævÀ¢Ò“°¢öä6†ævVB‚“°¢Ð¢VÇ6R–b‡7FGW2ÓÓÒ&f–ÆVB"’°¢Ö&µ6Ç4FEVæF–ær†–BÂfÇ6R“°¢7F÷öÆÆ–ær‚“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢&W2ç7FFRæW'&÷"ÇÂ$f–ÆVB"Ò“°¢Ð¢VÇ6R–b‡7FGW2ÓÓÒ&6æ6VÆÆVB"’°¢Ö&µ6Ç4FEVæF–ær†–BÂfÇ6R“°¢7F÷öÆÆ–ær‚“°¢Ð¢Ð¢6F6‚°¢ò¢¶VWöÆÆ–ær¢ð¢Ð¢ÒÂƒ“°¢Ó°¢6öç7Böä6æ6VÂÒ7–æ2‚’Óâ°¢–b†7F—fT–BÒçVÆÂ¢v—B6æ6VÄFB†7F—fT–B“°¢7F÷öÆÆ–ær‚“°¢6WE7FFR‚‡2’Óâ‡²âââ‡2ÇÂ·Ò’Â7FGW3¢&6æ6VÆÆVB"Ò’“°¢Ó°¢6öç7B'W7’Ò7FFRbb„”åõ$ôu$U52æ†2‡7FFRç7FGW2ÇÂ""’ÇÂ7FFRç7FGW2ÓÓÒ'&V6öæ6–Æ–ær"“°¢6öç7B7FGW4Æ&VÂÒ‚’Óâ°¢–b‚7FFR¢&WGW&â"#°¢7v—F6‚‡7FFRç7FGW2’°¢66R'VWVVB# ¢&WGW&â%VWVVN(
b#°¢66R&6†V6¶–ær# ¢&WGW&â6†V6¶–ær6÷W&6RG·7FFRæ7W'&VçD’ò‚G·7FFRæ7W'&VçD—Ò–¢"'Þ(
f°¢66R&F÷væÆöF–ær# ¢&WGW&âF÷væÆöF–ærG¶f÷&ÖD'—FW2‡7FFRæ'—FW5&VB—ÒG·7FFRçF÷FÄ'—FW2òòG¶f÷&ÖD'—FW2‡7FFRçF÷FÄ'—FW2—Ö¢"'Ö°¢66R'&ö6W76–ær# ¢&WGW&â%&ö6W76–ær&6†—f^(
b#°¢66R&–ç7FÆÆ–ær# ¢&WGW&â$–ç7FÆÆ–ærÇV67&—N(
b#°¢66R'&V6öæ6–Æ–ær# ¢&WGW&â%&Vg&W6†–ær7FVÒ÷væW'6†—æB–æfþ(
b#°¢66R&FöæR# ¢&WGW&â7FFRæ¢ò–ç7FÆÆVB)É2+r6÷W&6S¢G·7FFRæ—ÒG·7FFRæÖæ–fW7BÓÓÒfÇ6Rò"†æòÖæ–fW7Bf÷VæB’"¢"'Ö ¢¢$–ç7FÆÆVB)É2#°¢66R&f–ÆVB# ¢&WGW&âf–ÆVC¢G·7FFRæW'&÷"ÇÂ'Væ¶æ÷vâ'Ö°¢66R&6æ6VÆÆVB# ¢&WGW&â$6æ6VÆÆVB#°¢FVfVÇC ¢&WGW&â7FFRç7FGW2ÇÂ"#°¢Ð¢Ó°¢&WGW&â…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$FBvÖR"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢%6V&6‚'’æÖR÷"”B"ÂfÇVS¢VW'’Âöä6†ævS¢†R’Óâ'Vå6V&6‚†RçF&vWBçfÇVR’Ò’Ò’Â6V&6†–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÂFF–æs¢#G‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢bÂ†V–v‡C¢bÒÒ’Â"6V&6†–æuÇS##b%ÒÒ’Ò’’Â'W7’bb6V&6†–ærbb&W7VÇG2æÆVæwF‚âbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäfö7W6&ÆRÂ²7G–ÆS¢°¢F—7Æ“¢&fÆW‚"À¢fÆW„F—&V7F–öã¢&6öÇVÖâ"À¢Ö„†V–v‡C¢#Cgf‚"À¢÷fW&fÆ÷u“¢&WFò"À¢&÷&FW#¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃãB’"À¢&÷&FW%&F—W3¢bÀ¢&6¶w&÷VæC¢'&v&ƒÃÃÃã#"’"À¢Ö&v–åF÷¢"À¢ÒÂ6†–ÆG&Vã¢&W7VÇG2ç6Æ–6RƒÂ#’æÖ‚‡"Â’’Óâ…5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Â&÷GFöÕ6W&F÷#¢’ÓÓÒÖF‚æÖ–â‡&W7VÇG2æÆVæwF‚Â#’Òò&æöæR"¢'7FæF&B"Âöä6Æ–6³¢‚’Óâ&Vv–äFB‡"æ–BÂ"ææÖR’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"ÂÆ–vä—FV×3¢&6VçFW""ÂFW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÂ÷fW&fÆ÷s¢&†–FFVâ"ÂFW‡D÷fW&fÆ÷s¢&VÆÆ—6—2"Âv†—FU76S¢&æ÷w&"ÒÂ6†–ÆG&Vã¢"ææÖRÒ’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãSRÂÖ&v–äÆVgC¢‚ÂfÆWƒ¢#WFò"ÒÂ6†–ÆG&Vã¢"æ–BÒ•ÒÒ’ÒÂ"æ–B’’’Ò’Ò’’Â7FFRbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FF–æs¢#g‚"ÂföçE6—¦S¢2ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢7F—fTæÖRÇÂ7F—fT–BÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢7FGW4Æ&VÂ‚’Ò’Â7FFRç7FGW2ÓÓÒ&FöæR"bb7FFRæÆ—fU&VG’bb…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢²%7FVÒÆ—fR&Vg&W6‚6öæf—&ÖVB"Â7FFRæÆ—fTvVæW&F–öâò+rvVæW&F–öâG·7FFRæÆ—fTvVæW&F–öçÖ¢"%ÒÒ’’Â7FFRç7FGW2ÓÓÒ&FöæR"bb7FFRæÆ—fU&VG’bb7FFRæÆ—fU&V6öâbb…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢²%&W7F'BfÆÆ&6³¢"Â7FFRæÆ—fU&V6öåÒÒ’’Â7FFRæ6öçFVçD6†V6µ&W7VÇBbb7FFRç7FGW2ÓÓÒ&FöæR"bb…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢²%v÷&·6†÷¢"Â7FFRæ6öçFVçD6†V6µ&W7VÇBçv÷&·6†÷Â7FFRæ6öçFVçD6†V6µ&W7VÇBæFÆ2b`¢+rDÄ2–æ6ÇVFVC¢G·7FFRæ6öçFVçD6†V6µ&W7VÇBæFÆ2æ–æ6ÇVFVBæÆVæwF‡ÒÂÖ—76–æs¢G·7FFRæ6öçFVçD6†V6µ&W7VÇBæFÆ2æÖ—76–æræÆVæwF‡ÖÒÒ’•ÒÒ’Ò’’Â'W7’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢öä6æ6VÂÂ6†–ÆG&Vã¢$6æ6VÂ"Ò’Ò’•ÒÒ’Â6†÷t–ç7FÆÆVBbb5ô¥5‚æ§7‚„–ç7FÆÆVE6V7F–öâÂ²&Vg&W6…Fö¶Vã¢&Vg&W6…Fö¶VâÂöä6†ævVC¢öä6†ævVBÒ’Â5ô¥5‚æ§7‚„7W7FöÔÖæ–fW7G5æVÂÂ·Ò•ÒÒ’“°§Ð ¦gVæ7F–öâF÷B‡²†VÇF‚Ò’°¢6öç7B6öÆ÷"Ò†VÇF‚ÓÓÒ&ö²"ò"3S†3Ss‚"¢†VÇF‚ÓÓÒ'v&â"ò"6cVc#2"¢†VÇF‚ÓÓÒ&öfb"ò"63ƒV3V2"¢"3†#“#–#°¢&WGW&â…5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢°¢F—7Æ“¢&–æÆ–æRÖ&Æö6²"Âv–GFƒ¢’Â†V–v‡C¢’Â&÷&FW%&F—W3¢’À¢Ö&v–å&–v‡C¢‚ÂfÆWƒ¢#WFò"Â&6¶w&÷VæC¢6öÆ÷"À¢ÒÒ’“°§Ð¦gVæ7F–öâFW&÷r‡²Æ&VÂÂ†–çBÂ†VÇF‚Â7FGW5FW‡BÂ'W7’ÒfÇ6RÂ7F–öäÆ&VÂÂöä7F–öâÂÒ’°¢&WGW&â…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FF–æs¢#g‚"Â&÷&FW%F÷¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃãb’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„F÷BÂ²†VÇFƒ¢'W7’ò'Væ¶æ÷vâ"¢†VÇF‚Ò’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²fÆWƒ¢ÂÖ–åv–GFƒ¢ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢2ÂföçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢Æ&VÂÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢'W7’ò…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢Â†V–v‡C¢ÂÖ&v–å&–v‡C¢bÒÒ’Â'v÷&¶–æuÇS##b%ÒÒ’’¢7FGW5FW‡BÒ•ÒÒ•ÒÒ’Â†–çBbb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢ãRÂ÷6—G“¢ãSRÂÖ&v–ã¢#'‚G‚w‚"ÒÂ6†–ÆG&Vã¢†–çBÒ’Â7F–öäÆ&VÂbböä7F–öâbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢öä7F–öâÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢7F–öäÆ&VÂÒ’Ò’•ÒÒ’“°§Ð¢ò¢ ¢¢6WGWbFWVæFVæ6–W2âf—'7B'Vâ–ç7FÆÇ24Å77FVÓ²gFW'v&G2V6‚6ö×öæVç@¢¢6†÷w2—G2÷vâ†VÇF‚æB6â&R&V–ç7FÆÆVB–æF—f–GVÆÇ’à¢¢ð¦gVæ7F–öâFWVæFVæ6–W56V7F–öâ‚’°¢6öç7B·6Ç2Â6WE6Ç5ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·7—57BÂ6WE7—57EÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·Fö¶VW$–ç7FÆÆVBÂ6WEFö¶VW$–ç7FÆÆVEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&÷Föå7FGW2Â6WE&÷Föå7FGW5ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·V&—6ögE6¶vW2Â6WEV&—6ögE6¶vW5ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶6Æ÷VE7FGW2Â6WD6Æ÷VE7FGW5ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶F–rÂ6WDF–uÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR‡·Ò“°¢6öç7B¶æ÷FRÂ6WDæ÷FUÒÒ5õ$T5BçW6U7FFR‡·Ò“°¢6öç7BöÆÅ&VbÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B&U&W7F'D–ç7FÆÂÒ5õ$T5BçW6U&Vb†fÇ6R“°¢6öç7B6WD"Ò†–BÂb’Óâ6WD'W7’‚†"’Óâ‡²ââæ"Â¶–EÓ¢bÒ’“°¢6öç7B6WDâÒ†–BÂb’Óâ6WDæ÷FR‚†â’Óâ‡²ââæâÂ¶–EÓ¢bÒ’“°¢6öç7B&Vg&W6‚Ò7–æ2‚’Óâ°¢G'’°¢6WE6Ç2†v—BvWE6Ç77FVÕ7FGW2‚’“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6öç7B'VçF–ÖRÒv—BFö¶VW%'VçF–ÖU7FGW2‚“°¢6WEFö¶VW$–ç7FÆÆVB‚'VçF–ÖRæ–ç7FÆÆVB“°¢–b‡'VçF–ÖRæ–ç7FÆÆVB¢6WDâ‚'Fö¶VW""Â''VçF–ÖR–ç7FÆÆVB"“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6öç7B&÷FöâÒv—BFö¶VW%&÷Föå7FGW2‚“°¢6WE&÷Föå7FGW2‡&÷Föâ“°¢–b‡&÷Föâæ–ç7FÆÆVB¢6WDâ‚'Fö¶VW%&÷Föâ"Â$tRÕ&÷FöãÓ3B–ç7FÆÆVB"“°¢VÇ6R–b‡&÷Föâç'F–Â¢6WDâ‚'Fö¶VW%&÷Föâ"Â''F–Â–ç7FÆÆF–öâFWFV7FVB(	B&W—"&WV—&VB"“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6öç7B6¶vW2Òv—BFö¶VW%V&—6ögE6¶vW57FGW2‚“°¢6WEV&—6ögE6¶vW2‡6¶vW2“°¢–b‡6¶vW2æ–ç7FÆÆVB¢6WDâ‚'V&—6ögE6¶vW2"Â&†÷7FVB6¶vW2–ç7FÆÆVB"“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6öç7B6Æ÷VBÒv—B7$–ç7FÆÅ7FGW2‚“°¢6WD6Æ÷VE7FGW2†6Æ÷VB“°¢–b†6Æ÷VBæ–ç7FÆÆVB¢6WDâ‚&7""Â&–ç7FÆÆVB+rÖööâ†öö²fW&–f–VB"“°¢VÇ6R–b†6Æ÷VBç'F–Â¢6WDâ‚&7""Â''F–Â–ç7FÆÆF–öâFWFV7FVB(	B&W—"&WV—&VB"“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6öç7B2Òv—B7—7FVÕ7FGW2‚“°¢–b‡2ç7V66W72¢6WE7—57B‡2“°¢Ð¢6F6‚²ò¢¢òÐ¢Ó°¢6öç7BF—6&ÆTf÷&V–vâÒ7–æ2‚’Óâ°¢6WD"‚&f÷&V–vâ"ÂG'VR“°¢6WDâ‚&f÷&V–vâ"Â$F—6&Æ–ær÷F†W"Væv–æ^(
b"“°¢G'’°¢6öç7BBÒv—BF—6&ÆTf÷&V–väVæv–æW2‚“°¢6WDâ‚&f÷&V–vâ"ÂBç7V66W72òF—6&ÆVBG²†BæF—6&ÆVBÇÂµÒ’æ¦ö–â‚"Â"’ÇÂ&Væv–æR'Òâ&VÆöB7FVÒæ¢$æ÷F†–ærFòF—6&ÆRâ"“°¢–b†Bç7V66W72bb†BæF—6&ÆVBÇÂµÒ’æÆVæwF‚’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$÷F†W"Væv–æRF—6&ÆVB"Ò“°¢6WEF–ÖV÷WB‚‚’Óâ&VÆöE7FVÒ‚’æ6F6‚‚‚’Óâ²Ò’ÂS“°¢Ð¢Ð¢6F6‚†R’°¢6WDâ‚&f÷&V–vâ"ÂW'&÷#¢G¶WÖ“°¢Ð¢6WD"‚&f÷&V–vâ"ÂfÇ6R“°¢&Vg&W6‚‚“°¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢&Vg&W6‚‚“°¢6öç7Böä6†ævVBÒ‚’Óâ&Vg&W6‚‚“°¢v–æF÷ræFDWfVçDÆ—7FVæW"‚'6Ç6FV6²ÖFWVæFVæ6–W2Ö6†ævVB"Âöä6†ævVB“°¢òò–ç7FÆÆW'2'Vâ÷WG6–FRF†—2vRgFW"ÇVv–âWFFW2âöÆÂÆ–v‡GvV–v‡@¢òò&VBÖöæÇ’†VÇF‚6ò6öÆ÷'26†ævRv—F†÷WB&V÷Væ–ærFWVæFVæ6–W2à¢6öç7B†VÇF…öÆÂÒ6WD–çFW'fÂ‡&Vg&W6‚ÂS“°¢&WGW&â‚’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢6ÆV$–çFW'fÂ††VÇF…öÆÂ“°¢v–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"‚'6Ç6FV6²ÖFWVæFVæ6–W2Ö6†ævVB"Âöä6†ævVB“°¢Ó°¢ÒÂµÒ“°¢òòF†R÷7B×&W7F'BtRÕ&÷Föâ²6Æ÷VE&VF—&V7B¦ö'2&R7F'FVB'’F†P¢òòÇVv–â&ö÷BÂ6òF†W’'VâWfVâv†VâF†—2FWVæFVæ6–W2vR—2æWfW"÷VæVBà¢6öç7BvF6‚Ò†–BÂFöæT×6rÂ&W7F'B’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢öÆÅ&Vbæ7W'&VçBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B7BÒv—BvWE6Ç77FVÔ–ç7FÆÅ7FGW2‚“°¢6öç7B7FFRÒ7Bç7FFRÇÂ·Ó°¢6öç7B2Ò7FFRç7FGW3°¢6WDâ†–BÂ2ÓÓÒ''Vææ–ær ¢ò–ç7FÆÆ–ærG·7FFRç7FvRò¢G·7FFRç7FvRç&WÆ6R‚òÒörÂ""—Ö¢"'Þ(
bG·7FFRçW&6VçBò7FFRçW&6VçB²"R"¢"'Ö ¢¢‡2ÇÂ""’“°¢–b‡2ÓÓÒ&FöæR"ÇÂ2ÓÓÒ&f–ÆVB"’°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢–b‡2ÓÓÒ&FöæR"’°¢6WDâ†–BÂ&FöæR"“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢FöæT×6rÒ“°¢–b‡&W7F'Bbb7FFRæ–ç7FÆÆVB’°¢&U&W7F'D–ç7FÆÂæ7W'&VçBÒG'VS°¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ‚'6Ç6FV6²æ†Vg”FW4gFW%&W7F'B"Â7G&–ær„FFRææ÷r‚’’“°¢Ð¢6F6‚²ò¢¢òÐ¢6WD"‚'Fö¶VW""ÂG'VR“°¢òòFö¶VW"w26†&VB'VçF–ÖR—26ÖÆÂæB&VÆöæw2–âF†Ræ÷&ÖÀ¢òòFWVæFVæ7’÷&FW"&Vf÷&RF†R4Å77FVÒ&W7F'BâtRÕ&÷Föâæ@¢òò6Æ÷VE&VF—&V7B&R–çFVçF–öæÆÇ’FVfW'&VBVçF–Â7FVÒ&WGW&ç2à¢6WDâ‚'Fö¶VW""Â&–ç7FÆÆ–ær÷WFF–ærFö¶VW"'VçF–ÖR&Vf÷&R&W7F'N(
b"“°¢G'’°¢6öç7B'VçF–ÖRÒv—BFö¶VW$Vç7W&U'VçF–ÖR‚“°¢6WEFö¶VW$–ç7FÆÆVB‚'VçF–ÖRç7V66W72“°¢6WDâ‚'Fö¶VW""Â'VçF–ÖRç7V66W72ò'VçF–ÖR&VG’‚G·'VçF–ÖRçfW'6–öâÇÂ&ÆFW7B'Ò–¢'VçF–ÖRf–ÆVC¢G·'VçF–ÖRæW'&÷"ÇÂ'Væ¶æ÷vâW'&÷"'Ö“°¢Ð¢6F6‚†R’°¢6WDâ‚'Fö¶VW""Â'VçF–ÖRf–ÆVC¢G¶WÖ“°¢Ð¢6WD"‚'Fö¶VW""ÂfÇ6R“°¢6WEF–ÖV÷WB‚‚’Óâ&VÆöE7FVÒ‚’Â#“°¢Ð¢Ð¢VÇ6R°¢6WDâ†–BÂ7FFRæW'&÷"ÇÂ&f–ÆVB"“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢7FFRæW'&÷"ÇÂ$f–ÆVB"Ò“°¢Ð¢6WD"†–BÂfÇ6R“°¢&Vg&W6‚‚“°¢Ð¢Ð¢6F6‚²ò¢¶VWöÆÆ–ær¢òÐ¢ÒÂS“°¢Ó°¢6öç7B–ç7FÆÅ6Ç2Ò7–æ2‚’Óâ°¢6WD"‚'6Ç2"ÂG'VR“°¢6WDâ‚'6Ç2"Â'7F'F–æ~(
b"“°¢G'’°¢6öç7B"Òv—B–ç7FÆÅ6Ç77FVÒ‚“°¢–b‚"ç7V66W72’°¢6öç7B×6rÒ"æÖ—76–ætFW3òæÆVæwF‚òÖ—76–æs¢G·"æÖ—76–ætFW2æ¦ö–â‚"Â"—Ö¢"æW'&÷"ÇÂ$6÷VÆBæ÷B7F'B#°¢6WDâ‚'6Ç2"Â×6r“°¢6WD"‚'6Ç2"ÂfÇ6R“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢×6rÒ“°¢&WGW&ã°¢Ð¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$–ç7FÆÆ–æ~(
b†fWrÖ–çWFW2’"Ò“°¢vF6‚‚'6Ç2"Â%4Å77FVÒ–ç7FÆÆVB(	B&W7F'F–ær7FVÞ(
b"ÂG'VR“°¢Ð¢6F6‚†R’°¢6WDâ‚'6Ç2"ÂW'&÷#¢G¶WÖ“°¢6WD"‚'6Ç2"ÂfÇ6R“°¢Ð¢Ó°¢6öç7B'Väf—‚Ò7–æ2‚’Óâ°¢6WD"‚&f—‚"ÂG'VR“°¢6WDâ‚&f—‚"Â'7F'F–æ~(
b"“°¢G'’°¢òòÖçVÂ'WGFöâÒÇv—2dõ$4RF†RgVÆÂ†VF7&"F÷væw&FRÂ'—76–ærF†P¢òò&Ç&VG’f–æSò"6¶—vFR‡v†–6‚6âw&öævÇ’6¶—æBÖ¶RF†R'WGFöà¢òòÆöö²Æ–¶R—BFöW2æ÷F†–ær’âF†R6†VWFò×6¶—7F—2öâF†R&ö÷BF‚à¢6öç7B"Òv—B'Vä6Æ–VçDf—‚‡G'VR“°¢–b‚"ç7V66W72’°¢6WDâ‚&f—‚"Â"æW'&÷"ÇÂ&f–ÆVB"“°¢6WD"‚&f—‚"ÂfÇ6R“°¢&WGW&ã°¢Ð¢vF6‚‚&f—‚"Â$6Æ–VçBf—‚FöæR(	B&V&ö÷BF†RFV6²"ÂfÇ6R“°¢Ð¢6F6‚†R’°¢6WDâ‚&f—‚"ÂW'&÷#¢G¶WÖ“°¢6WD"‚&f—‚"ÂfÇ6R“°¢Ð¢Ó°¢6öç7B–ç7FÆÅFö¶VW%'VçF–ÖRÒ7–æ2‚’Óâ°¢6WD"‚'Fö¶VW""ÂG'VR“°¢6WDâ‚'Fö¶VW""ÂFö¶VW$–ç7FÆÆVBò&6†V6¶–ær÷WFF–ærFö¶VW"'VçF–Ö^(
b"¢&–ç7FÆÆ–ærFö¶VW"'VçF–Ö^(
b"“°¢G'’°¢6öç7B"Òv—BFö¶VW$Vç7W&U'VçF–ÖR‚“°¢6WEFö¶VW$–ç7FÆÆVB‚"ç7V66W72“°¢6WDâ‚'Fö¶VW""Â"ç7V66W72ò'VçF–ÖR&VG’‚G·"çfW'6–öâÇÂ&ÆFW7B'Ò–¢f–ÆVC¢G·"æW'&÷"ÇÂ'Væ¶æ÷vâW'&÷"'Ö“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò%Fö¶VW"'VçF–ÖR&VG’"¢%Fö¶VW"'VçF–ÖR–ç7FÆÆF–öâf–ÆVB"Ò“°¢Ð¢6F6‚†R’°¢6WDâ‚'Fö¶VW""ÂW'&÷#¢G¶WÖ“°¢Ð¢6WD"‚'Fö¶VW""ÂfÇ6R“°¢&Vg&W6‚‚“°¢Ó°¢6öç7B–ç7FÆÅ&÷FöâÒ7–æ2‚’Óâ°¢6WD"‚'Fö¶VW%&÷Föâ"ÂG'VR“°¢6WDâ‚'Fö¶VW%&÷Föâ"Â&÷Föå7FGW3òæ–ç7FÆÆVBò'&V–ç7FÆÆ–ærtRÕ&÷FöãÓ3N(
b"¢&–ç7FÆÆ–ærtRÕ&÷FöãÓ3N(
b"“°¢G'’°¢6öç7B"Òv—BFö¶VW$Vç7W&U&÷Föâ‡G'VR“°¢6WDâ‚'Fö¶VW%&÷Föâ"Â"ç7V66W72ò$tRÕ&÷FöãÓ3B–ç7FÆÆVB"¢f–ÆVC¢G·"æW'&÷"ÇÂ'Væ¶æ÷vâW'&÷"'Ö“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò$tRÕ&÷FöãÓ3B&VG’"¢$tRÕ&÷Föâ–ç7FÆÆF–öâf–ÆVB"Ò“°¢Ð¢6F6‚†R’°¢6WDâ‚'Fö¶VW%&÷Föâ"ÂW'&÷#¢G¶WÖ“°¢Ð¢6WD"‚'Fö¶VW%&÷Föâ"ÂfÇ6R“°¢&Vg&W6‚‚“°¢Ó°¢6öç7B–ç7FÆÅV&—6ögE6¶vW2Ò7–æ2‚’Óâ°¢6WD"‚'V&—6ögE6¶vW2"ÂG'VR“°¢6WDâ‚'V&—6ögE6¶vW2"ÂV&—6ögE6¶vW3òæ–ç7FÆÆVBò'WFF–ær†÷7FVB6¶vW>(
b"¢&–ç7FÆÆ–ær†÷7FVB6¶vW>(
b"“°¢G'’°¢6öç7B"Òv—BFö¶VW$Vç7W&UV&—6ögE6¶vW2‡G'VR“°¢6WDâ‚'V&—6ögE6¶vW2"Â"ç7V66W72ò&†÷7FVB6¶vW2–ç7FÆÆVB"¢f–ÆVC¢G·"æW'&÷"ÇÂ'Væ¶æ÷vâW'&÷"'Ö“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò%V&—6ögB6¶vW2&VG’"¢%V&—6ögB6¶vR–ç7FÆÆF–öâf–ÆVB"Ò“°¢Ð¢6F6‚†R’°¢6WDâ‚'V&—6ögE6¶vW2"ÂW'&÷#¢G¶WÖ“°¢Ð¢6WD"‚'V&—6ögE6¶vW2"ÂfÇ6R“°¢&Vg&W6‚‚“°¢Ó°¢6öç7B–ç7FÆÄ6Æ÷VBÒ7–æ2‚’Óâ°¢6WD"‚&7""ÂG'VR“°¢6WDâ‚&7""Â'&WÆ6–ær6Æ÷VE&VF—&V7N(
b"“°¢G'’°¢6öç7B"Òv—B7$Vç7W&T–ç7FÆÆVB‚“°¢–b‡"æ–ç7FÆÆVB’°¢6WDâ‚&7""Â&–ç7FÆÆVB+rÖööâ†öö²fW&–f–VB"“°¢Ð¢VÇ6R°¢6WDâ‚&7""Â&f–ÆVB(	B"²‡"æÆörÇÂ&6†V6²æWGv÷&²"’“°¢Ð¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"æ–ç7FÆÆVBò$6Æ÷VE&VF—&V7B&WÆ6VB"¢$6Æ÷VE&VF—&V7B–ç7FÆÂf–ÆVB"Ò“°¢Ð¢6F6‚†R’°¢6WDâ‚&7""ÂW'&÷#¢G¶WÖ“°¢Ð¢6WD"‚&7""ÂfÇ6R“°¢Ó°¢6öç7BFô7F—fFRÒ7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—B7F—fFT–æ¦V7F–öâ‚“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò$–æ¦V7F–öâöâ(	B&VÆöB7FVÒ"¢"æW'&÷"ÇÂ$f–ÆVB"Ò“°¢&Vg&W6‚‚“°¢–b‡"ç7V66W72¢6WEF–ÖV÷WB‚‚’Óâ&VÆöE7FVÒ‚’ÂS“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢Ó°¢6öç7BFôFV7F—fFRÒ7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—BFV7F—fFT–æ¦V7F–öâ‚“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò$–æ¦V7F–öâöfb(	B&VÆöB7FVÒ"¢"æW'&÷"ÇÂ$f–ÆVB"Ò“°¢&Vg&W6‚‚“°¢–b‡"ç7V66W72¢6WEF–ÖV÷WB‚‚’Óâ&VÆöE7FVÒ‚’ÂS“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢Ó°¢6öç7B'Vå&Vg&W6…GFW&ç2Ò7–æ2‚’Óâ°¢6WDF–r‚%&Vg&W6†–ærVæv–æRGFW&ç2v–ç7BF†R7W'&VçB7FVÒ6Æ–VçN(
b"“°¢G'’°¢6öç7B"Òv—B&Vg&W6…GFW&ç2‚“°¢6öç7BÆ–æW2Ò°¢GFW&â×&Vg&W6ƒ¢G·"ç&W6VçBò&–ç7FÆÆVB"¢$äõB”å5DÄÄTB'ÖÀ¢"ç&W6VçBò†VÇW#¢G·"æ†VÇW%F‡Ö¢""À¢6Æ–VçB'V–ÆC¢G·"æ6Æ–VçEfW'6–öçÖÀ¢7W÷'FVB'V–ÆC¢G·"ç7W÷'FVD6Æ–VçGÒG·"æ6Æ–VçDÖF6†W2ÓÓÒfÇ6Rò"(iÔ•4ÔD4‚†F÷væw&FRF–FâwB†öÆB’"¢"æ6Æ–VçDÖF6†W2ÓÓÒG'VRò"†ÖF6‚’"¢"'ÖÀ¢"ç&WGW&æ6öFRÓÒVæFVf–æVBòW†—B6öFS¢G·"ç&WGW&æ6öFWÖ¢""À¢À¢"æÖW76vRÇÂ""À¢âââ‡"æ÷WGWBbb"æ÷WGWBæÆVæwF‚ò²""Â.(	BGFW&â×&Vg&W6‚÷WGWB(	B"Âââç"æ÷WGWEÒ¢µÒ’À¢Òæf–ÇFW"‚‡‚’Óâ‚ÓÒ""“°¢6WDF–r†Æ–æW2æ¦ö–â‚%Æâ"’“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò%GFW&ç2&Vg&W6†VB(	B&W7F'B7FVÒ"¢‡"ç&W6VçBò%&Vg&W6‚&âv—F‚—77VW2(	B6VRFWF–Ç2"¢'GFW&â×&Vg&W6‚æ÷B–ç7FÆÆVB"’Ò“°¢Ð¢6F6‚†R’°¢6WDF–r†W'&÷#¢G¶WÖ“°¢Ð¢Ó°¢6öç7B'VäF–rÒ7–æ2‚’Óâ°¢G'’°¢6öç7BBÒv—BvWDF–væ÷7F–72‚“°¢6öç7BÆ—fRÒBæ–æ¦V7F–öäÆ—fRÓÓÒG'VRò'–W2†Æ—fRF†—26W76–öâ’ ¢¢Bæ–æ¦V7F–öäÆ—fRÓÓÒfÇ6Rò&æò†æ÷BÆöFVBF†—2&ö÷B’"¢'Væ¶æ÷vâ#°¢6öç7B÷4æÖRÒBæ÷5&VÆV6Sòå$UEE•ôäÔRÇÂBç7FVÔõ46†ææVÂÇÂ'Væ¶æ÷vâ#°¢6WDF–r…°¢Væv–æS¢G¶BæVæv–æRÇÂ#ò'ÒG¶BæVæv–æTÖööâò""¢"†æòfW'6–öâ×–âòFW÷BÖ¶W’7W÷'B’'ÖÀ¢–æ¦V7F–öâÆ—fS¢G¶Æ—fWÖÀ¢–ææ–æs¢G¶Bç–å7W÷'FVBò'7W÷'FVB†Öööâ’"¢'Vç7W÷'FVB‡7Fö6²4Å77FVÒ’'ÖÀ¢6†–WfVÖVçG3¢6VR÷F–öç2(	BÆ—fRöæÇ’öâÖööæÀ¢À¢4Å77FVÒç6ó¢G¶Bæ†54Å77FVÕ6òò&–ç7FÆÆVB"¢$Ô•54”är'ÖÀ¢7FVÒç6‚w&¢G¶Bç7FVÕ6…w&VBò'–W2"¢&æò'ÖÀ¢vÖW66÷R†öö³¢G¶BævÖW66÷T†öö´7F—fRò&7F—fR"¢&–æ7F—fR'ÖÀ¢fÆG²7FVÓ¢G¶BæfÆG²ò'–W2"¢&æò'ÖÀ¢7FVÒ&ö÷C¢G¶Bç7FVÕ&ö÷BÇÂ#ò'ÖÀ¢õ3¢G¶÷4æÖWÖÀ¢W6W"ò&ö÷C¢G¶BçW6W"ÇÂ#ò'ÒG¶Bç'Vææ–æt5&ö÷Bò"‡'Vææ–ær2&ö÷B’"¢"'ÖÀ¢FF—F–öæÄ3¢G²†BæFF—F–öæÄ2ÇÂµÒ’æÆVæwF‡ÒFFVBG²†BæFF—F–öæÄ2ÇÂµÒ’æÆVæwF‚ò(	BG²†BæFF—F–öæÄ2ÇÂµÒ’æ¦ö–â‚"Â"—Ö¢"'ÖÀ¢4Å77FVÒæÆös¢G¶Bç6Ç77FVÔÆötW†—7G2ò–W2‚G¶Bç6Ç77FVÔÆötvU6V7×2vòÂG¶Bç6Ç77FVÔÆötÖöF–f–VBÇÂ#ò'Ò–¢$Ô•54”är(	Bæ÷BÆöFVB'ÖÀ¢ƒ6F7"Ö"Æös¢G¶Bæ†VF7&%'VäÆötW†—7G2ò'&W6VçB"¢&æöæR'ÖÀ¢À¢(	B&V6VçB4Å77FVÒæÆör(	FÀ¢âââ‚†Bç6Ç77FVÔÆöuF–ÂÇÂµÒ’æÖ‚†Â’ÓâÂG¶ÇÖ’’À¢Òæ¦ö–â‚%Æâ"’“°¢Ð¢6F6‚†R’°¢6WDF–r†W'&÷#¢G¶WÖ“°¢Ð¢Ó°¢6öç7B6WGWFöæRÒ6Ç3òæ–ç7FÆÆVBbb6Ç3òæ–æ¦V7FVC°¢6öç7B6Ç4†VÇF‚Ò6Ç3òæ–ç7FÆÆVBò‡6Ç2æ–æ¦V7FVBò&ö²"¢'v&â"’¢&öfb#°¢6öç7B6Ç4'W7’Ò'W7’ç6Ç3°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%6WGW"Â6†–ÆG&Vã¢·7—57Còæf÷&V–väVæv–æRbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–ã¢#'‚g‚"ÂFF–æs¢#‡‚‚"Â&÷&FW%&F—W3¢bÂ&6¶w&÷VæC¢'&v&ƒ#CRÃcbÃ3RÃã"’"Â&÷&FW#¢#‚6öÆ–B&v&ƒ#CRÃcbÃ3RÃãB’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂföçEvV–v‡C¢cÂ6öÆ÷#¢"6cVc#2"ÒÂ6†–ÆG&Vã¢$æ÷F†W"Væv–æRFWFV7FVB"Ò’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ã‚ÂÖ&v–ã¢#'‚g‚"ÒÂ6†–ÆG&Vã¢·7—57Bæf÷&V–väæÖRÇÂ$F–ffW&VçBVæv–æR"Â"—2&W6VçBÆöæw6–FR6Ç7FVÒÖÖööâæB6âf–v‡B÷fW"–æ¦V7F–öââF—6&ÆR—B‡&WfW'6–&Ç’’6ò4Å4FV6²w2Væv–æR'Vç26ÆVæÇ’â%ÒÒ’Â5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’æf÷&V–vâÂöä6Æ–6³¢F—6&ÆTf÷&V–vâÂ6†–ÆG&Vã¢'W7’æf÷&V–vâò$F—6&Æ–æ~(
b"¢F—6&ÆRG·7—57Bæf÷&V–väæÖRÇÂ&÷F†W"Væv–æR'ÖÒ’Âæ÷FRæf÷&V–vâò5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãsRÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢æ÷FRæf÷&V–vâÒ’¢çVÆÅÒÒ’Ò’’Â6WGWFöæRbb6Ç4'W7’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢–ç7FÆÅ6Ç2Â6†–ÆG&Vã¢$–ç7FÆÂ4Å77FVÒ"Ò’Ò’’Â6Ç4'W7’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãƒRÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢2Â†V–v‡C¢2ÂÖ&v–å&–v‡C¢‚ÒÒ’Âæ÷FRç6Ç2ÇÂ&–ç7FÆÆ–æ~(
b%ÒÒ’Ò’’Â5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„FW&÷rÂ²Æ&VÃ¢%4Å77FVÒ"Â†–çC¢$6÷&R7FVÖ6Æ–VçB†öö²F†BFG2vÖW2Fò–÷W"Æ–'&'’â"Â†VÇFƒ¢6Ç4†VÇF‚Â7FGW5FW‡C¢6Ç3òæ–ç7FÆÆVBò‡6Ç2æ–æ¦V7FVBò&–ç7FÆÆVB+r–æ¦V7FVB"¢&–ç7FÆÆVB+ræ÷B–æ¦V7FVB"’¢&æ÷B–ç7FÆÆVB"Â'W7“¢6Ç4'W7’Â7F–öäÆ&VÃ¢6Ç3òæ–ç7FÆÆVBò%&V–ç7FÆÂ4Å77FVÒ"¢$–ç7FÆÂ4Å77FVÒ"Âöä7F–öã¢–ç7FÆÅ6Ç2Ò’Â5ô¥5‚æ§7‚„FW&÷rÂ²Æ&VÃ¢%7FVÒ6Æ–VçBf—‚"Â†–çC¢%–ç2F†R7FVÒ6Æ–VçBFòfW'6–öâ4Å77FVÒ7W÷'G2†ƒ6F7"Ö"’â"Â†VÇFƒ¢'W7’æf—‚ò'Væ¶æ÷vâ"¢6Ç3òæ6Æ–VçDf—…&âò&ö²"¢'v&â"Â7FGW5FW‡C¢æ÷FRæf—‚ÇÂ‡6Ç3òæ6Æ–VçDf—…&âò&Æ–VB"¢&æ÷B'Vâ–WB(	B'Vâ–bvÖW2FöâwBV""’Â'W7“¢'W7’æf—‚Â7F–öäÆ&VÃ¢%'Vâ6Æ–VçBf—‚"Âöä7F–öã¢'Väf—‚Ò’Â5ô¥5‚æ§7‚„FW&÷rÂ²Æ&VÃ¢%Fö¶VW"'VçF–ÖR"Â†–çC¢%6ÖÆÂ6†&VBfW&–f–W"ö†öö²'VçF–ÖS²WFFVB&Vf÷&RF†Ræ÷&ÖÂ4Å77FVÒ&W7F'Bâ"Â†VÇFƒ¢Fö¶VW$–ç7FÆÆVBò&ö²"¢&öfb"Â7FGW5FW‡C¢æ÷FRçFö¶VW"ÇÂ‡Fö¶VW$–ç7FÆÆVBò''VçF–ÖR–ç7FÆÆVB"¢&æ÷B–ç7FÆÆVB–WB"’Â'W7“¢'W7’çFö¶VW"Â7F–öäÆ&VÃ¢Fö¶VW$–ç7FÆÆVBò$6†V6²ò&V–ç7FÆÂFö¶VW"'VçF–ÖR"¢$–ç7FÆÂFö¶VW"'VçF–ÖR"Âöä7F–öã¢–ç7FÆÅFö¶VW%'VçF–ÖRÒ’Â5ô¥5‚æ§7‚„FW&÷rÂ²Æ&VÃ¢$tRÕ&÷FöãÓ3B"Â†–çC¢$W†7B6ö×F–&–Æ—G’Æ–W"&WV—&VB'’Fö¶VW#²–ç7FÆÆVBgFW"&W7F'B–âF†R&6¶w&÷VæBâ"Â†VÇFƒ¢&÷Föå7FGW3òæ–ç7FÆÆVBò&ö²"¢&÷Föå7FGW3òç'F–Âò'v&â"¢&öfb"Â7FGW5FW‡C¢æ÷FRçFö¶VW%&÷FöâÇÂ‡&÷Föå7FGW3òæ–ç7FÆÆVBò&–ç7FÆÆVB+rfW&–f–VB"¢&÷Föå7FGW3òç'F–Âò''F–Â–ç7FÆÆF–öâ+r&W—"&WV—&VB"¢&æ÷B–ç7FÆÆVB"’Â'W7“¢'W7’çFö¶VW%&÷FöâÂ7F–öäÆ&VÃ¢&÷Föå7FGW3òæ–ç7FÆÆVBò%&V–ç7FÆÂtRÕ&÷FöãÓ3B"¢&÷Föå7FGW3òç'F–Âò%&W—"tRÕ&÷FöãÓ3B"¢$–ç7FÆÂtRÕ&÷FöãÓ3B"Âöä7F–öã¢–ç7FÆÅ&÷FöâÒ’Â5ô¥5‚æ§7‚„FW&÷rÂ²Æ&VÃ¢%V&—6ögB6¶vW2"Â†–çC¢$”BÖ¶W–VB6&R6¶vW2f÷"F†R†÷7FVBV&—6ögB7F—fF–öâÆ—7Bâ"Â†VÇFƒ¢V&—6ögE6¶vW3òæ–ç7FÆÆVBbbV&—6ögE6¶vW2æ†VÇF‡’ÓÒfÇ6Rò&ö²"¢&öfb"Â7FGW5FW‡C¢æ÷FRçV&—6ögE6¶vW2ÇÂ‡V&—6ögE6¶vW3òæ–ç7FÆÆVBò&†÷7FVB6¶vW2–ç7FÆÆVB"¢&æ÷B–ç7FÆÆVB"’Â'W7“¢'W7’çV&—6ögE6¶vW2Â7F–öäÆ&VÃ¢V&—6ögE6¶vW3òæ–ç7FÆÆVBò$6†V6²ò&V–ç7FÆÂV&—6ögB6¶vW2"¢$–ç7FÆÂV&—6ögB6¶vW2"Âöä7F–öã¢–ç7FÆÅV&—6ögE6¶vW2Ò’Â5ô¥5‚æ§7‚„FW&÷rÂ²Æ&VÃ¢$6Æ÷VE&VF—&V7B"Â†–çC¢$6Æ÷VB6fW2f÷"FFVBvÖW2ÇS#B–ç7FÆÇ2WFöÖF–6ÆÇ’gFW"6WGWâöfb'’FVfVÇC²Væ&ÆR–âGfæ6VBÇS#T#‚6Æ÷VB6fW2â"Â†VÇFƒ¢'W7’æ7"ò'Væ¶æ÷vâ"¢6Æ÷VE7FGW3òæ–ç7FÆÆVBò&ö²"¢6Æ÷VE7FGW3òç'F–Âò'v&â"¢&öfb"Â7FGW5FW‡C¢æ÷FRæ7"ÇÂ†6Æ÷VE7FGW3òæ–ç7FÆÆVBò&–ç7FÆÆVB+rÖööâ†öö²fW&–f–VB"¢6Æ÷VE7FGW3òç'F–Âò''F–Â–ç7FÆÆF–öâ+r&W—"&WV—&VB"¢&æ÷B–ç7FÆÆVB"’Â'W7“¢'W7’æ7"Â7F–öäÆ&VÃ¢6Æ÷VE7FGW3òæ–ç7FÆÆVBò%&V–ç7FÆÂ6Æ÷VE&VF—&V7B"¢6Æ÷VE7FGW3òç'F–Âò%&W—"6Æ÷VE&VF—&V7B"¢$–ç7FÆÂ6Æ÷VE&VF—&V7B"Âöä7F–öã¢–ç7FÆÄ6Æ÷VBÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FF–æs¢#g‚"Â&÷&FW%F÷¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃãb’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢2ÂföçEvV–v‡C¢cÂÖ&v–ã¢#'‚G‚"ÒÂ6†–ÆG&Vã¢$–æ¦V7F–öâbF–væ÷7F–72"Ò’Â6Ç3òæ–ç7FÆÆVBbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÖ&v–ã¢#G‚'‚"ÒÂ6†–ÆG&Vã¢²$–æ¦V7F–öâ—2"Â6Ç2æ–æ¦V7F–öä7F—fRò&7F—fR"¢&–æ7F—fR"Â"â%ÒÒ’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢6Ç2æ–æ¦V7F–öä7F—fRòFôFV7F—fFR¢Fô7F—fFRÂ6†–ÆG&Vã¢6Ç2æ–æ¦V7F–öä7F—fRò$FV7F—fFR–æ¦V7F–öâ"¢$7F—fFR–æ¦V7F–öâ"Ò’Ò•ÒÒ’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢'VäF–rÂ6†–ÆG&Vã¢%'VâF–væ÷7F–72"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢'Vå&Vg&W6…GFW&ç2Â6†–ÆG&Vã¢%&Vg&W6‚Væv–æRGFW&ç2†f—‚ÇS#66åÇS#—BÖF6‚GFW&ç5ÇS#B’"Ò’Ò’ÂF–rbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚…67&öÆÆ&ÆU&W7VÇBÂ²FW‡C¢F–rÂÖ„†V–v‡C¢3ÂÖöæó¢G'VRÂföçE6—¦S¢Ò’Ò’•ÒÒ•ÒÒ•ÒÒ’“°§Ð ¦6öç7BDõ”52Ò°¢°¢¶W“¢&FWVæFVæ6–W2"ÂF—FÆS¢$FWVæFVæ6–W2"Â–6öã¢5ô¥5‚æ§7‚„f&÷„÷VâÂ·Ò’À¢&ÇW&#¢%F†RVæv–æRæB—G2†VÇW'2(	B–ç7FÆÂ÷"&W—"F†VÒ†W&Râ"À¢—FV×3¢°¢²æÖS¢%4Å77FVÒò6Ç7FVÒÖÖööâ"ÂFW63¢$6÷&R7FVÖ6Æ–VçB†öö²F†BÖ¶W2FFVBvÖW2V"÷væVBâf—'7B–ç7FÆÂ—2Çv—2öffW&VBv†VâÖ—76–æs²&V–ç7FÆÂ—26W&FR&W—"7F–öâöæ6R–ç7FÆÆVBâ"ÒÀ¢²æÖS¢%7FVÒ6Æ–VçBf—‚"ÂFW63¢%–ç2öF÷væw&FW2F†R7FVÒ6Æ–VçBv—F‚ƒ6F7"Ö"v†Vâ7FVÒWFFR'&V·2F†RVæv–æRw27W÷'FVBGFW&ç2â"ÒÀ¢²æÖS¢$6Æ÷VE&VF—&V7B'VçF–ÖR"ÂFW63¢%F†R&WV—&VB6Æ÷VG&VF—&V7BÖÖööâ6Æ÷VE÷&VF—&V7Bç6ò†öö²â&V–ç7FÆÂ&Vg&W6†W2F†RÖööâ'VçF–ÖRv—F†÷WBG&VF–ærF†R÷F–öæÂ6WGWT’2F†R'VçF–ÖR—G6VÆbâ"ÒÀ¢²æÖS¢$6Æ÷VE&VF—&V7B&÷f–FW"6WGW"ÂFW63¢$æF—fR4Å4FV6²6öçG&öÇ2w&—FRF†RÖööâf÷&²w2&÷f–FW"6öæf–wW&F–öâæB†æFÆRvöövÆRG&—fR÷"öæTG&—fR6–vâÖ–ââæòfÆG²6ö×æ–öâ—2&WV—&VBâ"ÒÀ¢²æÖS¢$FW÷DF÷væÆöFW"òääUB"ÂFW63¢$F—&V7BF÷væÆöFW"W6VBf÷"7V6–f–2'V–ÆG2æB6öçFVçBDÄ2âf—'7BW6R6â&W&RÆö6ÂääUB'VçF–ÖS²7FGW2÷&öw&W72—26†÷vâ–âF†R7W'&VçBvÖRw2ÒFööÇ2â"ÒÀ¢²æÖS¢$7F—fFRòFV7F—fFR–æ¦V7F–öâ"ÂFW63¢%GW&ç2F†R4Å77FVÒÆVæ6‚†öö²öâ÷"öfbâFV7F—fFR&WGW&ç2F†RæW‡B7FVÒÆVæ6‚Fòfæ–ÆÆ7FVÒâ"ÒÀ¢²æÖS¢%'VâF–væ÷7F–72"ÂFW63¢%6†÷w2Væv–æRG—RÂ–æ¦V7F–öâ7FFRæB6öæf–r†VÇF‚v†VâFG27F÷v÷&¶–ær÷"7FVÒWFFR6†ævW26öÖWF†–ærâ"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢&÷F–öç2"ÂF—FÆS¢$÷F–öç2"Â–6öã¢5ô¥5‚æ§7‚„f6Æ–FW'4‚Â·Ò’À¢&ÇW&#¢$ÆÂ7W'&VçB&V†f–÷W"FövvÆW3¢'WGFöç2Âf—†W2ÂDÄ2ö6Æ÷VBÂÒÂ&V6÷fW'’ÂÆ–'&'’æB&FvW2â"À¢—FV×3¢°¢²æÖS¢%7F÷&R'WGFöç2"ÂFW63¢%6†÷r÷"†–FRF†RfÆöF–ærFBòf—‚6öçG&öÇ2öâ7FVÒ7F÷&RvÖRvW2â"ÒÀ¢²æÖS¢$Æ–'&'’'WGFöç2öâvÖRvW2"ÂFW63¢%6†÷r÷"†–FRF†RFBòf—†W2&"–æ¦V7FVB–çFòÆ–'&'’vÖRvW2â"ÒÀ¢²æÖS¢$†–FR7F–öç2öâ÷væVBvÖW2"ÂFW63¢$†–FR4Å2FBôf—†W27F–öç2öâF—FÆW2Ç&VG’÷væVBÆVv—F–ÖFVÇ’â"ÒÀ¢²æÖS¢$æò–çFW&æWBf—‚"ÂFW63¢%W6W24Å4FV6²w2–ææVBÖ'V–ÆBÖæ–fW7Bö¶W’&V6÷fW'’F‚v†Vâ7FVÒ&W÷'G2æò–çFW&æWBv†–ÆRF÷væÆöF–ærâöÆFW"'V–ÆBâ"ÒÀ¢²æÖS¢%–âvÖRfW'6–öâöâf—‚"ÂFW63¢%fW'6–öâÖÆö6²vÖRv†Vâf—‚—2Æ–VB6òÆFW"7FVÒWFFR6ææ÷B–ÖÖVF–FVÇ’'&V²F†Bf—‚âVâÖf—‚&VÖ÷fW2F†R–ââ"ÒÀ¢²æÖS¢$WFòÖÇ’f—‚gFW"WFFR"ÂFW63¢$f÷"'V–ÆB×7V6–f–2f—†W2Âv—Bf÷"F†R&WV—&VB'V–ÆBFòf–æ—6‚F÷væÆöF–æræBF†VâÇ’F†Rf—‚WFöÖF–6ÆÇ’–ç7FVBöb6¶–ærv–ââ"ÒÀ¢²æÖS¢$WFòÖf—‚ÆVæ6‚F&vWB"ÂFW63¢%v†Vâ&÷&–FRÂ&Wö–çB7FVÒFòF†R&VÂ÷&WÆ6VÖVçBvÖRW†V7WF&ÆRv†–ÆR&W6W'f–ærF†R&W7BöbF†RÆVæ6‚÷F–öç2â"ÒÀ¢²æÖS¢$WFòÖÇ’f—†W2gFW"FF–ær"ÂFW63¢$gFW"7V66W76gVÂFBvÖRÂWFöÖF–6ÆÇ’Ç’âf–Æ&ÆRöæÆ–æRôFVçWfòf—‚66÷&F–ærFòF†Ræ÷&ÖÂf—‚'VÆW2â"ÒÀ¢²æÖS¢%VæÆö6²DÄ2v†VâFF–ærvÖR"ÂFW63¢%&Vv—7FW'2DÄ2VçF—FÆVÖVçBFFæB6â–ç7FÆÂF†R&÷&–FR–â×&ö6W72DÄ2VæÆö6¶W"âf–ÆRÖ&6¶VBDÄ27F–ÆÂæVVG2F†R7GVÂFW÷Bf–ÆW2â"ÒÀ¢²æÖS¢$DÄ2VæÆö6¶W'2öâ÷væVBvÖW2öæÇ’"ÂFW63¢$öæÇ’W‡÷6R7&VÔ’õ6Öö¶T’õWÆ’VæÆö6¶W"6öçG&öÇ2f÷"ÆVv—F–ÖFVÇ’÷væVBvÖW2Âv†W&RF†÷6RFööÇ2&RW6VgVÂâ"ÒÀ¢²æÖS¢$FBDÄ2WFöÖF–6ÆÇ’"ÂFW63¢$GW&–ærFBvÖRÂÇ6ò&Vv—7FW"GfW'F—6VBö6öçFVçBDÄ2FF6ò7W÷'FVBDÄ2—2–æ6ÇVFVBWFöÖF–6ÆÇ’â&W7B&W7VÇG2W6R‡V&6¶W’â"ÒÀ¢²æÖS¢$F—6&ÆRDÄ2VæÆö6²öâ÷væVBvÖW2"ÂFW63¢%&WfVçBÖööâg&öÒ&Ææ¶WB×VæÆö6¶–ærVæ÷væVBDÄ2öâvÖW2–÷RvVçV–æVÇ’÷vââ"ÒÀ¢²æÖS¢$F—6&ÆR7FVÒ6Æ÷VBöâ4Å2vÖW2"ÂFW63¢$F—6&ÆRfÇfR7FVÒ6Æ÷VBöæÇ’f÷"4Å2ÖFFVBvÖW2â×WGVÆÇ’W†6ÇW6—fRv—F‚W6–ær6Æ÷VE&VF—&V7Bf÷"F†÷6R6fW2â"ÒÀ¢²æÖS¢$†–FRFööÇ2bF–væ÷7F–72–âV–6²66W72"ÂFW63¢$¶VWF†RÒ6ö×7B'’†–F–ærvVæW&ÂFööÇ2ôF–væ÷7F–72F†W&S²F†÷6R6öçG&öÇ2&VÖ–â–âGfæ6VBâ"ÒÀ¢²æÖS¢%6†÷r7F–öç2bf—†W2–âV–6²66W72"ÂFW63¢%6†÷rF†RW"ÖvÖR7F–öç2bf—†W2&Æö6²–âÒâ"ÒÀ¢²æÖS¢%6†÷rFFVBvÖW2–âV–6²66W72"ÂFW63¢$Ö÷fRF†RFFVBÖvÖW2Æ—7B–çFòÒ–ç7FVBöb6†÷v–ær—BöæÇ’öâF†RFBvÖRvRâ"ÒÀ¢²æÖS¢%6†÷r&V–ç7FÆÂ4Å77FVÒ–âV–6²66W72"ÂFW63¢$6öçG&öÇ2F†R6ö×ÆWFR4Å77FVÒ7FGW2æB&V–ç7FÆÂ6V7F–öâöâ7F÷&RvW2öæ6R4Å77FVÒÇ&VG’W†—7G2âf—'7B×F–ÖR–ç7FÆÂ7F–ÆÂV'2v†Vâ4Å77FVÒ—2Ö—76–ær&Vv&FÆW72öbF†—2FövvÆS²F†R6V7F–öâ7F—2†–FFVâöâÆ–'&'’vÖRvW2â"ÒÀ¢²æÖS¢$6†–WfVÖVçG2‡6Ç7FVÒÖÖööâ’"ÂFW63¢$ÆÆ÷rÖööâFòö'F–â÷W6R6†–WfVÖVçB66†VÖ7W÷'Bf÷"FFVBvÖW2â"ÒÀ¢²æÖS¢$w&÷W4Å2vÖW2–çFò6öÆÆV7F–öâ"ÂFW63¢$¶VW7FVÒ6öÆÆV7F–öâ6ÆÆVB4Å4FV6²7–æ6‡&öæ—¦VBv—F‚F†RvÖW2FFVBF‡&÷Vv‚4Å77FVÒâ"ÒÀ¢²æÖS¢$&6·W7W7FöÒÖæ–fW7G2æBf—†W2"ÂFW63¢$–æ6ÇVFR–×÷'FVBö7W7FöÒ4Å4FV6²Öæ–fW7G2æBf—†W2–âF†RW6W"Ö7&VFVB&6·W&6†—fRâ"ÒÀ¢²æÖS¢$WFò&W7F'BgFW"FF–ær"ÂFW63¢$ÆVv7’öfÆÆ&6²&V†f–÷W"f÷"FBF‡2F†B7F–ÆÂ&WV—&R7FVÒ&W7F'BâfW&–f–VBÖööâÆ—fRÖFG2fö–BF†R&W7F'Bv†Vâ'VçF–ÖR&Vg&W6‚7V66VVG2â"ÒÀ¢²æÖS¢$WFò&RÖ7F—fFR–æ¦V7F–öâöâ&ö÷B"ÂFW63¢$–b7FVÒWFFRF—6&ÆW2F†RÆVæ6‚†öö²Â&RÖÇ’—BWFöÖF–6ÆÇ’â&WG'’Æ–Ö—F–ær&WfVçG2Æö÷2â"ÒÀ¢²æÖS¢$WFò&R×–â7FVÒ6Æ–VçBöâ&ö÷B"ÂFW63¢$WFöÖF–6ÆÇ’'VâF†R†Vf–W"6Æ–VçB–âöF÷væw&FR&V6÷fW'’v†VâF†R–ç7FÆÆVB7FVÒ6Æ–VçB—2æòÆöævW"7W÷'FVBâ"ÒÀ¢²æÖS¢$VÖö¦’&FvW2"ÂFW63¢%&WÆ6RVæ&ÆVBFW‡B&FvW2v—F‚VÖö¦’WV—fÆVçG2Â–æ6ÇVF–ær4Å2	øûN(Þ)ŠûˆòÂÆVv—B	ù+RÂf—‚	ùJrÂöæÆ–æRf—‚	øÉÂFVçWfò	ù¢æBæöâÕ7FVÒ)Ù2â"ÒÀ¢²æÖS¢$–æF—f–GVÂ&FvRFövvÆW2"ÂFW63¢$Væ&ÆR÷"F—6&ÆR4Å2ÂÆVv—BÂFVçWfòÂöæÆ–æRÖf—‚Âf—†VBÂæöâÕ7FVÒæBæöâÕ7FVÒÖæÖR&FvW2–æFWVæFVçFÇ’â"ÒÀ¢²æÖS¢$&FvRÆ6VÖVçBFövvÆW2"ÂFW63¢$6†ö÷6Rv†WF†W"&FvW2V"–âF†RÆ–'&'’w&–Bö†öÖR6&÷W6VÂÂvÖRFWF–Ç2vW2æB7F÷&RvW2â"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢'6÷W&6W2"ÂF—FÆS¢%6÷W&6W2b¶W—2"Â–6öã¢5ô¥5‚æ§7‚„f¶W’Â·Ò’À¢&ÇW&#¢$Öæ–fW7Böf—‚6÷W&6W2ÂWF†VçF–6F–öâæB’öFW÷B¶W—2â"À¢—FV×3¢°¢²æÖS¢&ÇVçFööÇ2„F—66÷&B6–vâÖ–â’"ÂFW63¢$WF†VçF–6FRFòÇVçFööÇ2f÷"66÷VçBÖvFVBÖæ–fW7G2æBf—†W2â"ÒÀ¢²æÖS¢$‡V&6¶W’ò6GW&R"ÂFW63¢$‡V&66â&÷f–FR&–6†W"Öæ–fW7G2–æ6ÇVF–ærFW÷B–æf÷&ÖF–öâW6VB'’7V6–f–2Ö'V–ÆBæBF—&V7BÖF÷væÆöBfÆ÷w2â"ÒÀ¢²æÖS¢%'—WRæB÷F†W"¶W—2"ÂFW63¢$÷F–öæÂ7&VFVçF–Ç2f÷"f—‚öÖæ–fW7B6÷W&6W2F†B&WV—&Râ66÷VçB÷"’¶W’â"ÒÀ¢²æÖS¢%&Vg&W6‚6÷W&6W2"ÂFW63¢%&VÆöBF†R6öæf–wW&VBÖæ–fW7B×6÷W&6RÆ—7Bâ"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢&FFvÖR"ÂF—FÆS¢$FBvÖR"Â–6öã¢5ô¥5‚æ§7‚„fF÷væÆöBÂ·Ò’À¢&ÇW&#¢$f–æBvÖRÂ&Vv—7FW"—Bv—F‚ÖööâæBÖævR–÷W"FFVBÆ–'&'’â"À¢—FV×3¢°¢²æÖS¢%6V&6‚ò”B"ÂFW63¢%6V&6‚'’F—FÆR÷"VçFW"â”BÂF†VâFBF‡&÷Vv‚F†R6öæf–wW&VBÖæ–fW7B6÷W&6W2æB4Å77FVÒâ"ÒÀ¢²æÖS¢$Æ—fRFB"ÂFW63¢$öâ6Ç7FVÒÖÖööâÂ4Å4FV6²fW&–f–W2F†R'VçF–ÖR6¶vRö–æfò&Vg&W6‚æBfö–G2&W7F'F–ær7FVÒv†VâF†RFB&V6ÖRÆ—fR7V66W76gVÆÇ’â"ÒÀ¢²æÖS¢%–÷W"FFVBvÖW2"ÂFW63¢$Æ—7G24Å2&Vv—7G&F–öç2æBÆWG2–÷R&VÖ÷fR&Vv—7G&F–öâv—F†÷WBFVÆWF–ærF†R–ç7FÆÆVBvÖRf–ÆW2â"ÒÀ¢²æÖS¢%7W'f—fÂ&W7F÷&R"ÂFW63¢%ÇVv–â&VÖ÷fÂ¶VW2âW‡FW&æÂ&V6÷fW'’&6†—fRâ&V–ç7FÆÂ6â&W7F÷&RÖ—76–ær”B&Vv—7G&F–öç2ÂÇV&Vv—7G&F–öç2ÂW†7BÖæ–fW7Bt”G2öf–ÆW2Â–ææVB'V–ÆG2æBf—‚†—7F÷'’WFöÖF–6ÆÇ’â"ÒÀ¢²æÖS¢$7W7FöÒÖæ–fW7G2òÇV"ÂFW63¢$–×÷'B–÷W"÷vâÖæ–fW7BôÇVÖFW&–ÂæB&–æB—BFòâ”Bâ"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢&f—†W2"ÂF—FÆS¢$vÖRf—†W2"Â–6öã¢5ô¥5‚æ§7‚„fw&Væ6‚Â·Ò’À¢&ÇW&#¢$Ç’ÂG&6²æBVæFòW"ÖvÖRf—†W2â"À¢—FV×3¢°¢²æÖS¢$Ç’f—‚"ÂFW63¢$Ç’F†R6VÆV7FVBöæÆ–æRf—‚Â7&6²ö'—72÷"÷F†W"7W÷'FVB–ÆöBFòF†RvÖRföÆFW"â"ÒÀ¢²æÖS¢$'V–ÆBÖv&Rf—†W2"ÂFW63¢%v†Vâf—‚F&vWG27V6–f–2Öæ–fW7Bö'V–ÆBÂ4Å4FV6²6â–âöF÷væÆöBF†B'V–ÆBf—'7BæBF†VâÇ’F†R–ÆöBâ"ÒÀ¢²æÖS¢$f—‚†—7F÷'’òVâÖf—‚"ÂFW63¢%4Å4FV6²&V6÷&G2W†7FÇ’v†Bf—‚w&÷FR÷&WÆ6VB–âÇVFööÇ2Öf—‚ÖÆörÓÆ–CâæÆör6òVâÖf—‚6â&W7F÷&R÷&–v–æÇ2âF†÷6RÆöw2&RÇ6ò&W6W'fVB'’F†RW‡FW&æÂ7W'f—fÂ&6†—fRâ"ÒÀ¢²æÖS¢$…b7&6²ò7&´f–ÆW2"ÂFW63¢$ÇFW&æF—fR7&6²6÷W&6W26â&WV—&R'F–7VÆ"'V–ÆC²Ö—6ÖF6‚–æF–6F÷'2FVÆÂ–÷Rv†VâF†R–ç7FÆÆVB'V–ÆBæVVG2Fò6†ævRf—'7Bâ"ÒÀ¢²æÖS¢$öæÆ–æRÖf—‚W6W&æÖR"ÂFW63¢%Æ–W"æÖRw&—GFVâ–çFò7W÷'FVBöæÆ–æRÖf—‚V×VÆF÷"6öæf–w2â"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢&6Æ÷VB"ÂF—FÆS¢$6Æ÷VB6fW2"Â–6öã¢5ô¥5‚æ§7‚„f6Æ÷VBÂ·Ò’À¢&ÇW&#¢%W6R6Æ÷VG&VF—&V7BÖÖööâf÷"4Å2vÖR6fR&VF—&V7F–öââ"À¢—FV×3¢°¢²æÖS¢&6Æ÷VG&VF—&V7BÖÖööâ'VçF–ÖR"ÂFW63¢%F†R7GVÂ&VF—&V7BVæv–æR—26Æ÷VE÷&VF—&V7Bç6òÆöFVB–çFò7FVÒâ—BFöW2æ÷B&WV—&RF†R6WGWfÆG²Fò&VÖ–â'Vææ–ærâ"ÒÀ¢²æÖS¢%&÷f–FW"6WGW"ÂFW63¢$6†ö÷6RÆö6ÂföÆFW"ÂvöövÆRG&—fRÂ÷"öæTG&—fRF—&V7FÇ’–â4Å4FV6²âW†—7F–ærfÆG²Fö¶Vç2&RÖ–w&FVBæöâÖFW7G'V7F—fVÇ’â"ÒÀ¢²æÖS¢%&V–ç7FÆÂ6Æ÷VE&VF—&V7B"ÂFW63¢%&Vg&W6†W2æBfW&–f–W2F†RÖööâ'VçF–ÖR†öö²v†–ÆR&W6W'f–æræF—fR&÷f–FW"6öæf–wW&F–öâæBFö¶Vç2â"ÒÀ¢²æÖS¢$ÆVv7’fÆG²"ÂFW63¢$—B—2æòÆöævW"&WV—&VB÷"ÆVæ6†VBâ4Å4FV6²6â–×÷'B—G2W†—7F–ær&÷f–FW"Fö¶Vç2æB6fR7F÷&vRv—F†÷WBFVÆWF–ærF†R÷&–v–æÇ2â"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢&FVçWfò"ÂF—FÆS¢$…bÖöGVÆR"Â–6öã¢5ô¥5‚æ§7‚„f6†–VÆDÇBÂ·Ò’À¢&ÇW&#¢$‡—W'f—6÷"ö7W7FöÒÕ&÷FöâFööÆ–ærf÷"7W÷'FVBFVçWfòf—†W2â"À¢—FV×3¢°¢²æÖS¢$…bÖöGVÆR"ÂFW63¢$–ç7FÆÂöÖævRF†RçF’ÔFVçWfò‡—W'f—6÷"7W÷'BW6VB'’6ö×F–&ÆRf—†W2âF†—2—2†Vg’÷F–öæÂFWVæFVæ7’æBöæÇ’Æ–W2Fò7W÷'FVBF—FÆW2â"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢&ÖöG2"ÂF—FÆS¢$ÖöG2"Â–6öã¢5ô¥5‚æ§7‚„fW§¦ÆU–V6RÂ·Ò’À¢&ÇW&#¢$–ç7FÆÂ7W÷'FVBÖöG2–çFòâW†—7F–ærvÖR–ç7FÆÆF–öââ"À¢—FV×3¢°¢²æÖS¢$–ç7FÆÂÖöB"ÂFW63¢$–ç7FÆÂ6VÆV7FVBÖöB–çFòF†RvÖRw2föÆFW"âF†R&6RvÖRf–ÆW2×W7BÇ&VG’W†—7Bâ"ÒÀ¢ÒÀ¢ÒÀ¢°¢¶W“¢&vÖWFööÇ2"ÂF—FÆS¢$vÖRFööÇ2…Ò’"Â–6öã¢5ô¥5‚æ§7‚„fvÖWBÂ·Ò’À¢&ÇW&#¢%W"ÖvÖR6öçG&öÇ26†÷vâv†–ÆR7FVÒÆ–'&'’vÖRvR—2÷Vââ"À¢—FV×3¢°¢²æÖS¢%&÷Föâò6fW2ò&W—""ÂFW63¢$6†ævR&÷FöâÂ&6²W÷"&W7F÷&R6fW2ÂæB'VâW"ÖvÖR&W—"÷W&F–öç2â"ÒÀ¢²æÖS¢%7FVÖÆW72òDÄ2VæÆö6¶W'2"ÂFW63¢$6öçFW‡B×6Vç6—F—fRE$ÒôDÄ2FööÇ2V"öæÇ’v†W&RF†RvÖRöf–ÆW27W÷'BF†VÒâ"ÒÀ¢²æÖS¢$g&VW¦RòVæg&VW¦RfW'6–öâ"ÂFW63¢%–âF†R7W'&VçBfW'6–öâFò&WfVçBWFFW2Â÷"Vç–â—BFòG&6²ÆFW7Bv–ââ"ÒÀ¢²æÖS¢$–ç7FÆÂ7V6–f–2'V–ÆB"ÂFW63¢%–6²7FVÔD"'V–ÆBæB&W6öÇfR—G2FW÷BÖæ–fW7Bt”G2â7FVÒ6âF÷væÆöBF‡&÷Vv‚ÖööâÂ÷"FW÷DF÷væÆöFW"6âÆ6RF†RW†7B'V–ÆBf–ÆW2F—&V7FÇ’v†Vâf–Æ&ÆRâ"ÒÀ¢²æÖS¢%7V6–f–2Ö'V–ÆBF÷væÆöB7FGW2"ÂFW63¢$FW÷DF÷væÆöFW"¦ö'2&RöÆÆVB–âF†R7W'&VçBvÖRw2ÒæB6†÷r&W&F–öâöF÷væÆöF–ær7FFRÂW&6VçB&öw&W72Â6ö×ÆWF–öâæBW'&÷'2âF†RöÆB6W&FRvÆö&Â7FGW26ö×öæVçBv2–çFVçF–öæÆÇ’föÆFVB–çFòF†—2vÖR×7V6–f–2æVÂâ"ÒÀ¢²æÖS¢$F÷væÆöB6öçFVçBDÄ2"ÂFW63¢$F—&V7FÇ’F÷væÆöBf–ÆRÖ&6¶VB6öçFVçBDÄ2F‡&÷Vv‚FW÷DF÷væÆöFW"v—F†÷WBÖ&¶–ærâ÷F†W'v—6RÆVv—F–ÖFR&6RÖvÖRF—&V7F÷'’2ÖævVBgVÆÂÖvÖR–ç7FÆÂâ"ÒÀ¢²æÖS¢%7FVÒVæ–ç7FÆÂ6ÆVçW"ÂFW63¢$f÷"gVÆÂvÖW2–ç7FÆÆVBö÷fW'w&—GFVâF‡&÷Vv‚F†RÖævVBFW÷DF÷væÆöFW"'V–ÆBF‚Â4Å4FV6²G&6·2F†RW†7B–ç7FÆÂF—&V7F÷'’æB6ÆVç2ÆVgF÷fW"f–ÆW2gFW"&VÂ7FVÒT’Væ–ç7FÆÂG&ç6—F–öââ"ÒÀ¢ÒÀ¢ÒÀ¥Ó°¦gVæ7F–öâ†VÇ‡V"‚’°¢6öç7B·F÷–2Â6WEF÷–5ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7BF÷&VbÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B67&öÆÅFòÒ‡"’Óâ"æ7W'&VçCòç67&öÆÄ–çFõf–Wr‡²&V†f–÷#¢'6Öö÷F‚"Â&Æö6³¢'7F'B"Ò“°¢–b‡F÷–2’°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢F÷–2çF—FÆRÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²&Vc¢F÷&VbÒ’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6WEF÷–2†çVÆÂ’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„f'&÷tÆVgBÂ·Ò’Â"&6²Fò†VÇ%ÒÒ’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãsRÂFF–æs¢#'‚'‚‡‚"ÒÂ6†–ÆG&Vã¢F÷–2æ&ÇW&"Ò’Ò’ÂF÷–2æ—FV×2æÖ‚†—B’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FF–æs¢#G‚'‚‡‚"Â&÷&FW%F÷¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃãb’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢2ÂföçEvV–v‡C¢cÂÖ&v–ä&÷GFöÓ¢"ÒÂ6†–ÆG&Vã¢—BææÖRÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ã‚ÂÆ–æT†V–v‡C¢ãRÒÂ6†–ÆG&Vã¢—BæFW62Ò•ÒÒ’ÒÂ—BææÖR’’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ67&öÆÅFò‡F÷&Vb’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„f'&÷uWÂ·Ò’Â"&6²FòF÷%ÒÒ’Ò’Ò•ÒÒ’“°¢Ð¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$†VÇb&÷WB"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²&Vc¢F÷&VbÒ’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãsRÂFF–æs¢#'‚'‚‡‚"ÂF—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„fVW7F–öä6—&6ÆRÂ·Ò’Â"–6²6V7F–öâFò6VRv†B—G27W'&VçB6öçG&öÇ2æBFövvÆW2Fòâ%ÒÒ’Ò’ÂDõ”52æÖ‚‡B’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6WEF÷–2‡B’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢ÂFW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²÷6—G“¢ãƒRÒÂ6†–ÆG&Vã¢Bæ–6öâÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçE6—¦S¢BÂföçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢BçF—FÆRÒ’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢Bæ&ÇW&"Ò•ÒÒ•ÒÒ’Ò’ÒÂBæ¶W’’’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢2ÂÆ–æT†V–v‡C¢ãRÂ÷6—G“¢ã’ÂFF–æs¢#‡‚'‚'‚"Â&÷&FW%F÷¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃã‚’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢BÂföçEvV–v‡C¢cÂÖ&v–ä&÷GFöÓ¢bÒÂ6†–ÆG&Vã¢$&÷WB4Å4FV6²"Ò’Â5ô¥5‚æ§7‡2‚'"Â²6†–ÆG&Vã¢²%4Å4FV6²–çFVw&FW2"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢'6Ç7FVÒÖÖööâ"Ò’Â"v—F‚7FVÔõ2ôFV6·’æBFG2Öæ–fW7Bö'V–ÆBÖævVÖVçBÂF—&V7BFW÷DF÷væÆöFW"F÷væÆöG2ÂvÖRf—†W2Â6Æ÷VB×6fR&VF—&V7F–öâÂ&V6÷fW'’FööÇ2Â&FvW2æBW"ÖvÖRWF–Æ—F–W2â%ÒÒ’Â5ô¥5‚æ§7‡2‚'"Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢$f—'7B–ç7FÆÃ¢"Ò’Â"÷Vâ"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢$FWVæFVæ6–W2"Ò’Â"æB–ç7FÆÂ4Å77FVÒâöæ6R–ç7FÆÆVBÂ&V–ç7FÆÂ÷&W—"6öçG&öÇ2&R–çFVçF–öæÆÇ’6W&FS²F†RV–6²66W72&V–ç7FÆÂ'WGFöâ6â&R†–FFVâv—F†÷WB†–F–ærf—'7B×F–ÖR6WGWâ%ÒÒ’Â5ô¥5‚æ§7‚‚'"Â²6†–ÆG&Vã¢%ÇVv–â&VÖ÷fÂ¶VW2&V6÷fW'’&6†—fR÷WG6–FRF†RÇVv–âF—&V7F÷'’âöâ&V–ç7FÆÂ4Å4FV6²6â&W7F÷&RÖ—76–ærvÖR&Vv—7G&F–öç2ÂW†7B'V–ÆBt”G2öÖæ–fW7G2Â–ææVBÖ'V–ÆB7FFRæBf—‚†—7F÷'’WFöÖF–6ÆÇ’â"Ò’Â5ô¥5‚æ§7‚‚'"Â²7G–ÆS¢²6öÆ÷#¢"6cVc#2"ÒÂ6†–ÆG&Vã¢$'V–ÆB&öÆÆ&6²Â7&6·2Â‡—W'f—6÷"FööÆ–æræB6Æ÷VB&VF—&V7F–öâ&RGfæ6VB÷W&F–öç2â¶VW–×÷'FçB6fW2&6¶VBW&Vf÷&RÖöF–g––ærvÖR–ç7FÆÆF–öââ"Ò•ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ67&öÆÅFò‡F÷&Vb’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„f'&÷uWÂ·Ò’Â"&6²FòF÷%ÒÒ’Ò’Ò•ÒÒ’“°§Ð ¦gVæ7F–öâf—†W56V7F–öâ‚’°¢6öç7B¶–EFW‡BÂ6WD–EFW‡EÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·&W7VÇG2Â6WE&W7VÇG5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·6V&6†–ærÂ6WE6V&6†–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B6V&6…F–ÖW"Ò5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B¶6†V6²Â6WD6†V6µÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶6†V6¶–ærÂ6WD6†V6¶–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶Ç•7FFRÂ6WDÇ•7FFUÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶–ç7FÆÆVBÂ6WD–ç7FÆÆVEÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·Fö¶VW$Æ–VBÂ6WEFö¶VW$Æ–VEÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶÷VäFW62Â6WD÷VäFW65ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶v—F–ærÂ6WDv—F–æuÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶FÄ6ö×ÆWFRÂ6WDFÄ6ö×ÆWFUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7BöÆÅ&VbÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7BFÅ&VbÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B7F÷fÆrÒ5õ$T5BçW6U&Vb†fÇ6R“°¢6öç7BÆöD–ç7FÆÆVBÒ7–æ2‚’Óâ°¢G'’°¢6öç7B·&W2ÂFö¶VW%ÒÒv—B&öÖ—6RæÆÂ…¶vWD–ç7FÆÆVDf—†W2‚’ÂFö¶VW$Æ–VE7FGW2‚•Ò“°¢6WD–ç7FÆÆVB‡&W2ç7V66W72ò&W2æf—†W2¢µÒ“°¢6WEFö¶VW$Æ–VB‡Fö¶VW"ç7V66W72òFö¶VW"ç&V6÷&G2ÇÂµÒ¢µÒ“°¢Ð¢6F6‚°¢6WD–ç7FÆÆVB…µÒ“°¢6WEFö¶VW$Æ–VB…µÒ“°¢Ð¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢ÆöD–ç7FÆÆVB‚“°¢&WGW&â‚’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢–b†FÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ†FÅ&Vbæ7W'&VçB“°¢–b‡6V&6…F–ÖW"æ7W'&VçB¢6ÆV%F–ÖV÷WB‡6V&6…F–ÖW"æ7W'&VçB“°¢7F÷fÆræ7W'&VçBÒG'VS°¢Ó°¢ÒÂµÒ“°¢6öç7B7F'DFÅöÆÂÒ†–B’Óâ°¢–b†FÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ†FÅ&Vbæ7W'&VçB“°¢6WDFÄ6ö×ÆWFR†fÇ6R“°¢FÅ&Vbæ7W'&VçBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢6WDFÄ6ö×ÆWFR†v—B—5–ææVD'V–ÆE&VG’†–B’“°¢ÒÂ3“°¢fö–B—5–ææVD'V–ÆE&VG’†–B’çF†Vâ‡6WDFÄ6ö×ÆWFR“°¢Ó°¢òò'V–ÆBÖ67W&FRÇ“¢–âF†Rf—‚w2'V–ÆBÂWFFRF†RvÖRÂF†VâÇ¢òò†WFò’÷"v—Bf÷"F†RW6W"Fò&W72Ç’†wV–FVB’à¢6öç7B'VäÇ’Ò7–æ2†–BÂÆ&VÂÂ7F'DW‡G&7BÂ–äfâ’Óâ°¢6WDv—F–ær†çVÆÂ“°¢7F÷fÆræ7W'&VçBÒfÇ6S°¢ÆWBWFôÇ’ÒfÇ6S°¢G'’°¢WFôÇ’Ò†v—BvWDWFôÇ’‚’’æVæ&ÆVC°¢Ð¢6F6‚°¢ò¢FVfVÇBwV–FVB¢ð¢Ð¢6öç7BFôÇ’Ò7–æ2‚’Óâ°¢–b‡–äfâbb†v—B—5–ææVD'V–ÆE&VG’†–B’’’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%7FVÒ†2æ÷B–ç7FÆÆVBF†R–ææVB'V–ÆB–WBâ&WG'’fW&–f–6F–öâ–bF†RWFFR7F—2–FÆRâ"Ò“°¢F‡&÷ræWrW'&÷"‚'–ææVBÖ'V–ÆBÖæ÷B×&VG’"“°¢Ð¢6WDv—F–ær†çVÆÂ“°¢–b†FÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ†FÅ&Vbæ7W'&VçB“°¢6WDÇ•7FFR‡²7FGW3¢'VWVVB"Ò“°¢6öç7B&W2Òv—B7F'DW‡G&7B‚“°¢–b‚&W2ÇÂ&W2ç7V66W72’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢&W3òæW'&÷"ÇÂ$6÷VÆBæ÷B7F'Bf—‚"Ò“°¢6WDÇ•7FFR†çVÆÂ“°¢F‡&÷ræWrW'&÷"‚&Ç’×7F'BÖf–ÆVB"“°¢Ð¢&W6WDf—…'VçF–ÖR†–B“°¢öÆÄÇ’†–BÂÆ&VÂ“°¢Ó°¢G'’°¢6öç7B&W7VÇBÒv—B'Vä'V–ÆD67W&FTÇ’‡°¢–BÀ¢WFôÇ’À¢FôÇ’À¢–äfâÀ¢6†÷VÆE7F÷¢‚’Óâ7F÷fÆræ7W'&VçBÀ¢öå†6S¢‡†6R’Óâ°¢–b‡†6RÓÓÒ'–ææ–ær"¢6WDÇ•7FFR‡²7FGW3¢'–ææ–ær"Ò“°¢VÇ6R–b‡†6RÓÓÒ'–åöf–ÆVB"’°¢6WDÇ•7FFR†çVÆÂ“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%F†—2f—‚w2—&VBÖæ–fW7B6÷VÆBæ÷B&RÆöFVBâæ÷F†–ærv2Æ–VB÷"–ææVBâ"Ò“°¢Ð¢VÇ6R–b‡†6RÓÓÒ'WFF–ær"¢6WDÇ•7FFR‡²7FGW3¢'WFF–ær"Ò“°¢VÇ6R–b‡†6RÓÓÒ&v—F–æuöF÷væÆöB"¢6WDÇ•7FFR‡²7FGW3¢&v—F–ærF÷væÆöB"Ò“°¢VÇ6R–b‡†6RÓÓÒ&Ç––ær"¢6WDÇ•7FFR‡²7FGW3¢'VWVVB"Ò“°¢ÒÀ¢Ò“°¢–b‡&W7VÇBÓÓÒ&v—F–ær"’°¢6WDv—F–ær‡²–BÂÆ&VÂÂ'Vã¢FôÇ’Ò“°¢7F'DFÅöÆÂ†–B“°¢Ð¢Ð¢6F6‚°¢ò¢7W&f6VBÇ&VG’¢ð¢Ð¢Ó°¢òò6V&6‚'’vÖRäÔR÷"”BâW&RF–v—G2ÒF—&V7B”C²÷F†W'v—6P¢òòFV&÷Væ6RæÖR6V&6‚‡6ÖR7F÷&R6V&6‚F†RFBÖvÖRF"W6W2’à¢6öç7B'Vå6V&6‚Ò‡fÇVR’Óâ°¢6WD–EFW‡B‡fÇVR“°¢–b‡6V&6…F–ÖW"æ7W'&VçB¢6ÆV%F–ÖV÷WB‡6V&6…F–ÖW"æ7W'&VçB“°¢6öç7BG&–ÖÖVBÒfÇVRçG&–Ò‚“°¢–b‚G&–ÖÖVB’°¢6WE&W7VÇG2…µÒ“°¢&WGW&ã°¢Ð¢–b‚õåÆB²BòçFW7B‡G&–ÖÖVB’’°¢6WE&W7VÇG2…·²–C¢'6T–çB‡G&–ÖÖVBÂ’ÂæÖS¢”BG·G&–ÖÖVGÖÕÒ“°¢&WGW&ã°¢Ð¢6V&6…F–ÖW"æ7W'&VçBÒ6WEF–ÖV÷WB†7–æ2‚’Óâ°¢6WE6V&6†–ær‡G'VR“°¢G'’°¢6öç7B&W2Òv—B6V&6„vÖW2‡G&–ÖÖVBÂR“°¢6WE&W7VÇG2‡&W2ç7V66W72ò&W2ç&W7VÇG2¢µÒ“°¢Ð¢6F6‚°¢6WE&W7VÇG2…µÒ“°¢Ð¢f–æÆÇ’°¢6WE6V&6†–ær†fÇ6R“°¢Ð¢ÒÂC“°¢Ó°¢6öç7B6†V6´–BÒ7–æ2†–B’Óâ°¢–b‚–B¢&WGW&ã°¢6WD6†V6¶–ær‡G'VR“°¢6WD6†V6²†çVÆÂ“°¢6WDÇ•7FFR†çVÆÂ“°¢6WE&W7VÇG2…µÒ“°¢G'’°¢6öç7B&W2Òv—B6†V6´f—†W4gVÆÂ†–B“°¢6WD6†V6²‡&W2“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢f–æÆÇ’°¢6WD6†V6¶–ær†fÇ6R“°¢Ð¢Ó°¢6öç7BöÆÄÇ’Ò†–BÂæÖR’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢öÆÅ&Vbæ7W'&VçBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B&W2Òv—BvWDf—…7FGW2†–B“°¢–b‚&W2ç7V66W72¢&WGW&ã°¢6WDÇ•7FFR‡&W2ç7FFR“°¢–b‡&W2ç7FFRç7FGW2ÓÓÒ&FöæR"’°¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢Ç”f—…'VçF–ÖR†–BÂ&W2ç7FFRæ÷fW'&–FW2“°¢WFõ&Wö–çDg&öÕ7FFR†–BÂ&W2ç7FFR“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢f—‚Æ–VBFòG¶æÖWÖÒ“°¢ÆöD–ç7FÆÆVB‚“°¢fö–B&Vg&W6„&FvW2‚“°¢Ð¢VÇ6R–b…²&f–ÆVB"Â&6æ6VÆÆVB%Òæ–æ6ÇVFW2‡&W2ç7FFRç7FGW2ÇÂ""’’°¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢–b‡&W2ç7FFRç7FGW2ÓÓÒ&f–ÆVB"¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢&W2ç7FFRæW'&÷"ÇÂ$f—‚f–ÆVB"Ò“°¢Ð¢Ð¢6F6‚°¢ò¢¶VWöÆÆ–ær¢ð¢Ð¢ÒÂƒ“°¢Ó°¢6öç7BöäÇ’Ò7–æ2†–BÂW&ÂÂf—…G—RÂvÖTæÖR’Óâ°¢6öç7BF…&W2Òv—BvWDvÖT–ç7FÆÅF‚†–B“°¢–b‚F…&W2ç7V66W72ÇÂF…&W2æ–ç7FÆÅF‚’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$vÖR×W7B&R–ç7FÆÆVBFòÇ’f—‚â"Ò“°¢&WGW&ã°¢Ð¢v—B'VäÇ’†–BÂvÖTæÖRÂ‚’ÓâÇ”f—‚†–BÂW&ÂÂF…&W2æ–ç7FÆÅF‚Âf—…G—RÂvÖTæÖR’“°¢Ó°¢6öç7BöäÇ”ÇVFööÇ2Ò7–æ2†f—‚ÂvÖTæÖR’Óâ°¢6öç7BF…&W2Òv—BvWDvÖT–ç7FÆÅF‚†f—‚æ–B“°¢–b‚F…&W2ç7V66W72ÇÂF…&W2æ–ç7FÆÅF‚’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$vÖR×W7B&R–ç7FÆÆVBFòÇ’f—‚â"Ò“°¢&WGW&ã°¢Ð¢v—B'VäÇ’†f—‚æ–BÂvÖTæÖRÂ‚’ÓâÇ”ÇVFööÇ4f—‚†f—‚æ–BÂf—‚æ–BÂF…&W2æ–ç7FÆÅF‚Âf—‚æÖæ–fW7Eö–BÇÂ""Âf—‚æFW÷Eö–BÇÂ""Â&ÇVçFööÇ2f—‚"ÂvÖTæÖR’Âf—‚æ†5öÖæ–fW7Bò‚’Óâ–äf÷$ÇVFööÇ4f—‚†f—‚æ–BÂf—‚æ–BÂf—‚æ'V–ÆBÇÂ""’¢VæFVf–æVB“°¢Ó°¢6öç7B6öæf—&ÕVæf—‚Ò†f—‚’Óâ°¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢VâÖf—‚æBVç–âG¶f—‚ævÖTæÖWÓöÂ7G$FW67&—F–öã¢FVÆWFW2G¶f—‚æf–ÆW46÷VçGÒf–ÆR‡2’FFVB'’"G¶f—‚æf—…G—WÒ"öâG¶f—‚æFFWÒÂæB&VÖ÷fW2F†RvÖRw2fW'6–öâ–â6ò7FVÒ6âWFFR—Bv–âæÂ7G$ô´'WGFöåFW‡C¢%VâÖf—‚æBVç–â"Âöäô³¢7–æ2‚’Óâ°¢6öç7B&W2Òv—BVæf—‚†f—‚æ–BÂf—‚æ–ç7FÆÅF‚Âf—‚æFFR“°¢–b‚&W2ç7V66W72’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢&W2æW'&÷"ÇÂ$f–ÆVB"Ò“°¢&WGW&ã°¢Ð¢6öç7BF–ÖW"Ò6WD–çFW'fÂ†7–æ2‚’Óâ°¢6öç7B7BÒv—BvWEVæf—…7FGW2†f—‚æ–B“°¢–b‡7Bç7V66W72bb²&FöæR"Â&f–ÆVB%Òæ–æ6ÇVFW2‡7Bç7FFRç7FGW2ÇÂ""’’°¢6ÆV$–çFW'fÂ‡F–ÖW"“°¢–b‡7Bç7FFRç7FGW2ÓÓÒ&FöæR"’°¢6ÆV$f—„ÆVæ6„÷F–öç2†f—‚æ–B“°¢fö–B&Vg&W6„&FvW2‚“°¢Ð¢Fö7FW"çFö7B‡°¢F—FÆS¢%4Å4FV6²"À¢&öG“¢7Bç7FFRç7FGW2ÓÓÒ&FöæR"ò$f—‚&VÖ÷fVB"¢7Bç7FFRæW'&÷"ÇÂ$f–ÆVB"À¢Ò“°¢ÆöD–ç7FÆÆVB‚“°¢Ð¢ÒÂs“°¢ÒÒ’“°¢Ó°¢6öç7BÇ”'W7’ÒÇ•7FFRbb”åõ$ôu$U52æ†2†Ç•7FFRç7FGW2ÇÂ""“°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$vÖRf—†W2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢%6V&6‚'’æÖR÷"”B"ÂfÇVS¢–EFW‡BÂöä6†ævS¢†R’Óâ'Vå6V&6‚†RçF&vWBçfÇVR’Ò’Ò’Â6V&6†–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÂFF–æs¢#G‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢bÂ†V–v‡C¢bÒÒ’Â"6V&6†–æuÇS##b%ÒÒ’Ò’’Â6†V6¶–ærbb6†V6²bb&W7VÇG2ç6Æ–6RƒÂR’æÖ‚‡"’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6†V6´–B‡"æ–B’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÂFW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢"ææÖRÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢²$”B"Â"æ–EÒÒ•ÒÒ’Ò’ÒÂ"æ–B’’’Â6†V6¶–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢$6†V6¶–ærf—†W5ÇS##b"Ò’Ò’’Â6†V6²bb6†V6²ç7V66W72bb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ²6WD6†V6²†çVÆÂ“²6WE&W7VÇG2…µÒ“²ÒÂ6†–ÆG&Vã¢%ÇS#“æWr6V&6‚"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢cÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢6†V6²ævÖTæÖRÒ’Ò’Â6†V6²ævVæW&–4f—‚æf–Æ&ÆRbb6†V6²ævVæW&–4f—‚çW&Âbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢Ç”'W7’ÇÂv—F–ærÂöä6Æ–6³¢‚’ÓâöäÇ’†6†V6²æ–BÂ6†V6²ævVæW&–4f—‚çW&ÂÂ$vVæW&–2f—‚"Â6†V6²ævÖTæÖR’Â6†–ÆG&Vã¢$Ç’vVæW&–2f—‚"Ò’Ò’’Â6†V6²æöæÆ–æTf—‚æf–Æ&ÆRbb6†V6²æöæÆ–æTf—‚çW&Âbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢Ç”'W7’ÇÂv—F–ærÂöä6Æ–6³¢‚’ÓâöäÇ’†6†V6²æ–BÂ6†V6²æöæÆ–æTf—‚çW&ÂÂ$öæÆ–æRf—‚…Vç7FVÒ’"Â6†V6²ævÖTæÖR’Â6†–ÆG&Vã¢$Ç’öæÆ–æRf—‚…Vç7FVÒ’"Ò’Ò’’Â†6†V6²ææW&”f—†W2ÇÂµÒ’æÖ‚†f—‚Â’’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’ÓâDdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"†f—‚çW&Â’Â6†–ÆG&Vã¢f—‚æ6FVv÷'’ÓÓÒ&öæÆ–æR"ò$÷VâöæÆ–æRf—‚„äU$’’" ¢f—‚æ6FVv÷'’ÓÓÒ&vÖR"ò$÷VâvÖRf—‚„äU$’’"¢$÷Vâ'—72„äU$’’"Ò’ÒÂæW&’ÒG¶f—‚æ6FVv÷'—ÒÒG¶f—‚æ–BÇÂ—Ö’’’Â6†V6²ævVæW&–4f—‚æf–Æ&ÆRbb6†V6²æöæÆ–æTf—‚æf–Æ&ÆRbb†6†V6²ææW&”f—†W2ÇÂµÒ’æÆVæwF‚bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢²$æòf—†W2f–Æ&ÆRf÷"F†—2vÖRâ"Â‡W&öæFW÷C¢G¶6†V6²æöæÆ–æTf—‚æÖ—'&÷$VçG&–W2óòÒVçG&–W2G²†6†V6²æöæÆ–æTf—‚ææV$ÖF6†W2ÇÂµÒ’æÆVæwF‚ò²æV#¢G²†6†V6²æöæÆ–æTf—‚ææV$ÖF6†W2ÇÂµÒ’æ¦ö–â‚"Â"—Ö¢"'Ò–ÒÒ’Ò’’Â‚‚’Óâ°¢6öç7B6BÒ†6†V6²æÇVFööÇ46FÆörÇÂµÒ“°¢6öç7BWF†VBÒ6†V6²æÇVFööÇ4WF†VC°¢6öç7B6DW'"Ò6†V6²æÇVFööÇ46FÆötW'&÷#°¢–b†WF†VBÓÓÒfÇ6R’°¢&WGW&â…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢%ÇTCƒ4EÇTDC26–vâ–âv—F‚F—66÷&B†ÇVçFööÇ266÷VçBÂ&÷fR’FòÆ—7BÇVçFööÇ2f—†W2â"Ò’Ò’“°¢Ð¢–b‚6BæÆVæwF‚’°¢&WGW&â6DW'"ò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"6ff63cb"ÒÂ6†–ÆG&Vã¢²&ÇVçFööÇ3¢"Â6DW'%ÒÒ’Ò’’¢çVÆÃ°¢Ð¢&WGW&â…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢cÂÖ&v–åF÷¢bÒÂ6†–ÆG&Vã¢²&ÇVçFööÇ2f—†W2‚"Â6BæÆVæwF‚Â"’%ÒÒ’Ò’Â6BæÖ‚†f—‚Â’’Óâ°¢6öç7BFw2Ò†f—‚çFw2ÇÂµÒ¢æÖ‚‡B’ÓâG—VöbBÓÓÒ'7G&–ær"òB¢‡Bbb‡BææÖRÇÂBæÆ&VÂÇÂBçFW‡B’’ÇÂ""¢æf–ÇFW"„&ööÆVâ“°¢6öç7BF—FÆRÒFw2æÆVæwF‚òFw2æ¦ö–â‚"+r"’¢f—‚ææÖRÇÂf—‚G¶f—‚æ–BÇÂ’²Ö°¢6öç7B'V–ÆD–BÒf—‚æ'V–ÆBÇÂf—‚æÖæ–fW7Eö–BÇÂ"#°¢6öç7Bv†VâÒ†f—‚ç&VÆV6UöFFRÇÂ""’ç6Æ–6RƒÂ“°¢6öç7BÖWFÒ·v†Vâò&VÆV6VBG·v†VçÖ¢""Â'V–ÆD–Bò'V–ÆBG¶'V–ÆD–GÖ¢"%Ð¢æf–ÇFW"„&ööÆVâ¢æ¦ö–â‚"+r"“°¢6öç7B¶W’Òf—‚æ–BÇÂ7G&–ær†’“°¢6öç7BFW62Òf—‚æFW67&—F–öã°¢&WGW&â…5ô¥5‚æ§7‡2‚&F—b"Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FF–æs¢#G‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢2ÂföçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢F—FÆRÒ’ÂÖWFbb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢ÖWFÒ•ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢Ç”'W7’ÇÂv—F–ærÂöä6Æ–6³¢‚’ÓâöäÇ”ÇVFööÇ2†f—‚Â6†V6²ævÖTæÖR’Â6†–ÆG&Vã¢$Ç’b–âFò'V–ÆB"Ò’Ò’ÂFW62bb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6WD÷VäFW62†÷VäFW62ÓÓÒ¶W’òçVÆÂ¢¶W’’Â6†–ÆG&Vã¢÷VäFW62ÓÓÒ¶W’ò$†–FRFWF–Ç2)kâ"¢%6†÷rFWF–Ç2)k‚"Ò’Ò’Â÷VäFW62ÓÓÒ¶W’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢föçE6—¦S¢À¢÷6—G“¢ã‚À¢v†—FU76S¢'&R×w&"À¢v÷&D'&V³¢&'&V²×v÷&B"À¢FF–æs¢#'‚G‚g‚"À¢Ö„†V–v‡C¢#cÀ¢÷fW&fÆ÷u“¢&WFò"À¢ÒÂ6†–ÆG&Vã¢FW62Ò’Ò’•ÒÒ’•ÒÒÂÇBÒG¶¶W—Ö’“°¢Ò•ÒÒ’“°¢Ò’‚•ÒÒ’’Âv—F–ærbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãƒRÂFF–æs¢#G‚"ÒÂ6†–ÆG&Vã¢²%–ææVBÇS#Bv—F–ærf÷"7FVÒFò–ç7FÆÂF†RÖF6†–ær'V–ÆBâ"ÂFÄ6ö×ÆWFRò$–ç7FÆÆVBFW÷BÖæ–fW7G2ÖF6‚(	BÇ’F†Rf—‚æ÷râ"¢%v—Bf÷"7FVÒFòfW&–g’÷"WFFRF†RvÖRâ%ÒÒ’Ò’ÂFÄ6ö×ÆWFRbb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢7–æ2‚’Óâ°¢v—Bæô–çFW&æWDf—„&Vv–â†v—F–æræ–B’æ6F6‚‚‚’Óâ‡·Ò’“°¢v—BG&–vvW%7FVÔ–ç7FÆÂ†v—F–æræ–B’æ6F6‚‚‚’Óâ‡·Ò’“°¢6öç7B&W7VÇBÒv—BfÆ–FFU7FVÔ†v—F–æræ–B’æ6F6‚‚‚’Óâ‡²7V66W73¢fÇ6RÒ’“°¢–b‚&W7VÇBç7V66W72¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$÷VâF†RvÖRw2&÷W'F–W2(i"–ç7FÆÆVBf–ÆW2(i"fW&–g’–çFVw&—G’–â7FVÒâ"Ò“°¢ÒÂ6†–ÆG&Vã¢%&WG'’7FVÒfW&–f–6F–öâ"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢FÄ6ö×ÆWFRÂöä6Æ–6³¢‚’Óâv—F–ærç'Vâ‚’æ6F6‚‚‚’Óâ²Ò’Â6†–ÆG&Vã¢²$Ç’"Âv—F–æræÆ&VÂÂ"æ÷r%ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ°¢7F÷fÆræ7W'&VçBÒG'VS°¢–b†FÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ†FÅ&Vbæ7W'&VçB“°¢6WDv—F–ær†çVÆÂ“°¢6WDÇ•7FFR†çVÆÂ“°¢ÒÂ6†–ÆG&Vã¢$6æ6VÂ†¶VW–â’"Ò’Ò•ÒÒ’’ÂÇ•7FFRbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ã‚ÂFF–æs¢#G‚"ÒÂ6†–ÆG&Vã¢²$f—‚7FGW3¢"ÂÇ•7FFRç7FGW2ÂÇ•7FFRæW'&÷"ò(	BG¶Ç•7FFRæW'&÷'Ö¢"%ÒÒ’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢cÂÖ&v–åF÷¢bÒÂ6†–ÆG&Vã¢$7W7FöÒf—†W2"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢7–æ2‚’Óâ°¢6öç7B×6rÒv—B–×÷'D7W7FöÔfÆ÷r‚&f—‚"“°¢–b†×6r¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢×6rÒ“°¢ÒÂ6†–ÆG&Vã¢$Ç’W‡FW&æÂf—…ÇS##b"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢%–6²f—‚f–ÆR‚ç¦—òç&"òãw¢÷"Æö÷6RæFÆÂòæW†R’æBF†RvÖR—Bw2f÷"â—B6†÷w22Â$7W7FöÒf—…Â"'WGFöâ–âF†BvÖRw2f—†W2ÖVçRæBÂöæ6RÆ–VBÂ–âÆ–VBf—†W2&VÆ÷r‡&VÖ÷f&ÆR'’F–æròVâÖf—‚’â"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’ÓâDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢$FVÆWFRÆÂ7W7FöÒf—†W3ò"Â7G$FW67&—F–öã¢%&VÖ÷fW2WfW'’–×÷'FVB7W7FöÒÖf—‚f–ÆRg&öÒâòæÆö6Â÷6†&Rõ4Å4FV6²ö7W7FöÕöf—†W2âÇ&VG’ÖÆ–VBf—†W27F’öâF†V—"vÖW2VçF–Â–÷RVâÖf—‚F†VÒâ"Â7G$ô´'WGFöåFW‡C¢$FVÆWFR"Âöäô³¢7–æ2‚’Óâ°¢6öç7B"Òv—B7W7FöÔFVÆWFTf—†W2ƒ“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢"ç7V66W72ò$7W7FöÒf—†W26ÆV&VB"¢"æW'&÷"ÇÂ$f–ÆVB"Ò“°¢ÒÒ’’Â6†–ÆG&Vã¢$FVÆWFR7W7FöÒf—†W2"Ò’Ò’Â–ç7FÆÆVBæÆVæwF‚âbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢cÂÖ&v–åF÷¢bÒÂ6†–ÆG&Vã¢$Æ–VBf—†W2"Ò’Ò’Â–ç7FÆÆVBæÖ‚†f—‚Â’’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6öæf—&ÕVæf—‚†f—‚’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÂFW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢f—‚ævÖTæÖRÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢¶f—‚æf—…G—RÂ"ÇS#r"Âf—‚æFFRÂ"ÇS#rFFòVæFò%ÒÒ•ÒÒ’Ò’ÒÂG¶f—‚æ–GÒÒG¶f—‚æFFWÒÒG¶—Ö’’•ÒÒ’’ÂFö¶VW$Æ–VBæÆVæwF‚âbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢cÂÖ&v–åF÷¢bÒÂ6†–ÆG&Vã¢%Fö¶VW"7FGW2"Ò’Ò’ÂFö¶VW$Æ–VBæÖ‚‡&V6÷&B’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÂFW‡DÆ–vã¢&ÆVgB"ÂFF–æs¢#w‚‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢·&V6÷&Bæ†VÇF‚ÓÓÒ'fÆ–B"ò/	ùI"¢.)ªûˆò"Â""Â&V6÷&BævÖTæÖRÇÂ”BG·&V6÷&Bæ–GÖÒÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãc‚ÒÂ6†–ÆG&Vã¢·&V6÷&Bæ†VÇF‚ÓÓÒ'fÆ–B"ò$¶W’Æ–VB"¢‡&V6÷&Bæ†VÇF…&V6öâÇÂ%fW&–f–6F–öâæVVFVB"’Â"ÇS#r"Â&V6÷&Bç–ææVBò/	ùI"fW'6–öâ–ææVB"¢%fW'6–öâæ÷B–ææVB%ÒÒ•ÒÒ’ÒÂFö¶VW"ÒG·&V6÷&Bæ–GÖ’’•ÒÒ’•ÒÒ’“°§Ð ¦6öç7B$õd”DU%2Ò°¢²FF¢&Æö6Â"ÂÆ&VÃ¢$'V–ÇBÖ–âÆö6Â7F÷&vR"ÒÀ¢²FF¢&föÆFW""ÂÆ&VÃ¢$7W7FöÒföÆFW""ÒÀ¢²FF¢&vG&—fR"ÂÆ&VÃ¢$vöövÆRG&—fR"ÒÀ¢²FF¢&öæVG&—fR"ÂÆ&VÃ¢$öæTG&—fR"ÒÀ¥Ó°¦6öç7B6ÆVWÒ†×2’ÓâæWr&öÖ—6R‚‡&W6öÇfR’Óâ6WEF–ÖV÷WB‡&W6öÇfRÂ×2’“°¦gVæ7F–öâ6fTvÖU–6¶W$ÖöFÂ‡²vÖW2Â6Æ÷6TÖöFÂÂöå&W7VÇBÂÒ’°¢6öç7B6WGFÆVBÒ5õ$T5BçW6U&Vb†fÇ6R“°¢6öç7B6Æ÷6RÒ‚’Óâ°¢–b‚6WGFÆVBæ7W'&VçB¢öå&W7VÇB†çVÆÂ“°¢6Æ÷6TÖöFÃòâ‚“°¢Ó°¢&WGW&â5ô¥5‚æ§7‡2„DdÂäÖöFÅ&ö÷BÂ²6Æ÷6TÖöFÃ¢6Æ÷6RÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢‚ÂföçEvV–v‡C¢cÂÖ&v–ä&÷GFöÓ¢‚ÒÂ6†–ÆG&Vã¢%v†–6‚vÖR÷vç2F†—26fSò"Ò’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÂÖ&v–ä&÷GFöÓ¢ÒÂ6†–ÆG&Vã¢%F†R–×÷'FVBf–ÆW2v–ÆÂ&RÆ6VB–âF†—2vÖRw26Æ÷VE&VF—&V7BföÆFW"â"Ò’Â5ô¥5‚æ§7‚„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"Âv¢bÂÖ„†V–v‡C¢#Sgf‚"Â÷fW&fÆ÷u“¢'67&öÆÂ"ÒÂ6†–ÆG&Vã¢vÖW2æÖ‚†vÖR’Óâ5ô¥5‚æ§7‡2„DdÂäF–Æöt'WGFöâÂ²7G–ÆS¢²FW‡DÆ–vã¢&ÆVgB"ÂFF–æs¢#‡‚‚"ÒÂöä6Æ–6³¢‚’Óâ²6WGFÆVBæ7W'&VçBÒG'VS²öå&W7VÇB†vÖR“²6Æ÷6TÖöFÃòâ‚“²ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢BÒÂ6†–ÆG&Vã¢vÖRææÖRÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢²$”B"ÂvÖRæ–EÒÒ•ÒÒÂvÖRæ–B’’Ò•ÒÒ“°§Ð¦gVæ7F–öâ–6µ6fTvÖR†vÖW2’°¢&WGW&âæWr&öÖ—6R‚‡&W6öÇfR’ÓâDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚…6fTvÖU–6¶W$ÖöFÂÂ²vÖW3¢vÖW2Âöå&W7VÇC¢&W6öÇfRÒ’’“°§Ð¦gVæ7F–öâÖ–w&F–öäÖW76vR‡&W7VÇBÂfÆÆ&6²’°¢6öç7BÖ–w&F–öç2Ò&W7VÇBæÖ–w&F–öç2ÇÂ‡&W7VÇBç&W—$Ö–w&F–öâò·&W7VÇBç&W—$Ö–w&F–öåÒ¢µÒ“°¢–b‚Ö–w&F–öç2æÆVæwF‚¢&WGW&âfÆÆ&6³°¢6öç7B6÷–VBÒÖ–w&F–öç2ç&VGV6R‚†âÂ—FVÒ’Óââ²†—FVÒæ6÷–VBÇÂ’²†—FVÒçWFFVBÇÂ’Â“°¢6öç7B6öæfÆ–7G2ÒÖ–w&F–öç2ç&VGV6R‚†âÂ—FVÒ’Óââ²†—FVÒæ6öæfÆ–7G2ÇÂ’Â“°¢6öç7Bf–ÆVBÒÖ–w&F–öç2ç&VGV6R‚†âÂ—FVÒ’Óââ²†—FVÒæf–ÆVBÇÂ’Â“°¢&WGW&âG¶fÆÆ&6·ÒÖ–w&F–öâfW&–f–VC¢G¶6÷–VGÒ6÷–VB÷WFFVBG¶6öæfÆ–7G2òÂG¶6öæfÆ–7G7Ò6öæfÆ–7G2&W6W'fVF¢"'ÒG¶f–ÆVBòÂG¶f–ÆVGÒf–ÆVF¢"'Òæ°§Ð¦gVæ7F–öâf÷&ÖE6—¦R†'—FW2ÂÆö6ÂÒG'VR’°¢–b‚Æö6Â¢&WGW&â$6Æ÷VBöæÇ’#°¢–b‚'—FW2¢&WGW&â$æòÆö6Â6fRf–ÆW2–WB#°¢6öç7BVæ—G2Ò²$""Â$´""Â$Ô""Â$t"%Ó°¢6öç7B–æFW‚ÒÖF‚æÖ–â„ÖF‚æfÆö÷"„ÖF‚æÆör†'—FW2’òÖF‚æÆörƒ#B’’ÂVæ—G2æÆVæwF‚Ò“°¢6öç7BfÇVRÒ'—FW2òÖF‚ç÷rƒ#BÂ–æFW‚“°¢&WGW&âG·fÇVRãÒÇÂ–æFW‚ÓÓÒòfÇVRçFôf—†VBƒ’¢fÇVRçFôf—†VBƒ—ÒG·Væ—G5¶–æFW…×Ö°§Ð¦gVæ7F–öâf÷&ÖE&VÖ÷FU6fR‡F–ÖW7F×Â&÷f–FW"Â&VÖ÷FRÒfÇ6R’°¢6öç7B&÷f–FW$æÖRÒ&÷f–FW"ÓÓÒ&vG&—fR"ò$vöövÆRG&—fR"¢&÷f–FW"ÓÓÒ&öæVG&—fR"ò$öæTG&—fR" ¢&÷f–FW"ÓÓÒ&föÆFW""ò&7W7FöÒföÆFW""¢&Æö6Â7F÷&vR#°¢–b‚F–ÖW7F×¢&WGW&â&÷f–FW"ÓÓÒ&Æö6Â"ò$æò7F÷&VB6fRÖWFFF–WB" ¢&VÖ÷FRò7F÷&VB–âG·&÷f–FW$æÖWÖ¢æ÷B7–æ6VBFòG·&÷f–FW$æÖWÒ–WF°¢G'’°¢6öç7BFFRÒæWrFFR‡F–ÖW7F×¢’çFôÆö6ÆU7G&–ær…µÒÂ°¢ÖöçFƒ¢'6†÷'B"ÂF“¢&çVÖW&–2"Â†÷W#¢#"ÖF–v—B"ÂÖ–çWFS¢#"ÖF–v—B"À¢Ò“°¢&WGW&â&÷f–FW"ÓÓÒ&Æö6Â"òÆFW7BÆö6Â6fRG¶FFWÖ¢Æ7BG·&÷f–FW$æÖWÒ7–æ2G¶FFWÖ°¢Ð¢6F6‚°¢&WGW&âG·&÷f–FW$æÖWÒ6fRF–ÖRVæf–Æ&ÆV°¢Ð§Ð¦gVæ7F–öâ7FVÔvÖR†–BÂ&W6öÇfVDæÖRÒ""’°¢ÆWBF—FÆRÒ&W6öÇfVDæÖRÇÂ7FVÒG¶–GÖ°¢G'’°¢6öç7B÷fW'f–WrÒv–æF÷ræ7F÷&SòävWD÷fW'f–Wt'””Còâ†–B¢ÇÂv–æF÷ræ7F÷&SòävWD÷fW'f–Wt'”vÖT”Còâ†–B“°¢F—FÆRÒ÷fW'f–WsòæF—7Æ•öæÖRÇÂ÷fW'f–Wsòç6÷'Eö2ÇÂF—FÆS°¢Ð¢6F6‚²ò¢W6RF†R”BfÆÆ&6²¢òÐ¢&WGW&â°¢F—FÆRÀ¢†VFW#¢‡GG3¢òö6Fâæ6Æ÷VFfÆ&Rç7FV×7FF–2æ6öÒ÷7FVÒö2òG¶–GÒö†VFW"æ§vÀ¢v–FT67VÆS¢‡GG3¢ò÷6†&VBæf7FÇ’ç7FV×7FF–2æ6öÒ÷7F÷&Uö—FVÕö76WG2÷7FVÒö2òG¶–GÒö67VÆUócgƒ3S2æ§vÀ¢Ó°§Ð¦gVæ7F–öâ6Æ÷VE6fT6&B‡²Â&÷f–FW"Ò’°¢6öç7BvÖRÒ7FVÔvÖR†æ–BÂææÖR“°¢6öç7B¶'D–æFW‚Â6WD'D–æFW…ÒÒ5õ$T5BçW6U7FFRƒ“°¢6öç7B¶Æö6Ä'Gv÷&²Â6WDÆö6Ä'Gv÷&µÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶Æö6Ä'Gv÷&´6†V6¶VBÂ6WDÆö6Ä'Gv÷&´6†V6¶VEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B'Gv÷&²ÒÆö6Ä'Gv÷&²ÇÂ¶vÖRæ†VFW"ÂvÖRçv–FT67VÆUÕ¶'D–æFW…Ó°¢6öç7BGfæ6T'Gv÷&²Ò7–æ2‚’Óâ°¢–b†Æö6Ä'Gv÷&²’°¢6WDÆö6Ä'Gv÷&²‚""“°¢6WDÆö6Ä'Gv÷&´6†V6¶VB‡G'VR“°¢&WGW&ã°¢Ð¢–b†'D–æFW‚ÓÓÒ’°¢6WD'D–æFW‚ƒ“°¢&WGW&ã°¢Ð¢–b‚Æö6Ä'Gv÷&´6†V6¶VB’°¢6WDÆö6Ä'Gv÷&´6†V6¶VB‡G'VR“°¢G'’°¢6öç7B&W7VÇBÒv—B7$vÖT'Gv÷&²†æ–B“°¢–b‡&W7VÇBç7V66W72bb&W7VÇBæ–ÖvR¢6WDÆö6Ä'Gv÷&²‡&W7VÇBæ–ÖvR“°¢Ð¢6F6‚²ò¢ÆVfRF†R6&Bw2w&F–VçBfÆÆ&6²¢òÐ¢&WGW&ã°¢Ð¢6WD'D–æFW‚ƒ"“°¢Ó°¢6öç7B÷VävÖRÒ‚’Óâ°¢G'’°¢DdÂäæf–vF–öâäæf–vFR†öÆ–'&'’öòG¶æ–GÖ“°¢DdÂäæf–vF–öâä6Æ÷6U6–FTÖVçW3òâ‚“°¢Ð¢6F6‚²ò¢7FVÒÖ’æ÷B†fRf–æ—6†VBÆöF–ærF†—2÷fW'f–Wr–WB¢òÐ¢Ó°¢&WGW&â5ô¥5‚æ§7‡2„DdÂäF–Æöt'WGFöâÂ²öä6Æ–6³¢÷VävÖRÂ7G–ÆS¢°¢÷6—F–öã¢'&VÆF—fR"Â÷fW&fÆ÷s¢&†–FFVâ"ÂÖ–ä†V–v‡C¢"Â&÷&FW%&F—W3¢’À¢&÷&FW#¢#‚6öÆ–B&v&ƒ2Â“2Â#CRÂã#b’"ÂÖ&v–ä&÷GFöÓ¢’À¢&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ&v&ƒ#bÂCRÂc"Âã“‚’Â&v&ƒ2Â#BÂ3RÂã“‚’’"À¢&÷…6†F÷s¢#w‚‡‚&v&ƒÂÂÂã#"’"ÂFF–æs¢ÂFW‡DÆ–vã¢&ÆVgB"À¢ÒÂ6†–ÆG&Vã¢¶'Gv÷&²bb5ô¥5‚æ§7‚‚&–Ör"Â²7&3¢'Gv÷&²ÂÇC¢""ÂöäW'&÷#¢Gfæ6T'Gv÷&²Â7G–ÆS¢°¢÷6—F–öã¢&'6öÇWFR"Â–ç6WC¢Âv–GFƒ¢#R"Â†V–v‡C¢#R"Âö&¦V7Df—C¢&6÷fW""À¢÷6—G“¢ãC‚À¢ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢÷6—F–öã¢&'6öÇWFR"Â–ç6WC¢À¢&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ“FVrÂ&v&ƒ‚ÂbÂ#RÂã“b’RÂ&v&ƒ‚ÂbÂ#RÂãsb’SBRÂ&v&ƒ‚ÂbÂ#RÂã#‚’R’"À¢ÒÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢'&VÆF—fR"ÂFF–æs¢#7‚G‚"ÂFW‡E6†F÷s¢#‚7‚3"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢bÂföçEvV–v‡C¢sÂÆ–æT†V–v‡C¢ã‚ÒÂ6†–ÆG&Vã¢vÖRçF—FÆRÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW…w&¢'w&"Âv¢#W‚'‚"ÂÖ&v–åF÷¢2ÂföçE6—¦S¢ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²6öÆ÷#¢"3cv3cR"ÂföçEvV–v‡C¢cSÒÂ6†–ÆG&Vã¢f÷&ÖE6—¦R†ç6—¦RÂæÆö6ÂÓÒfÇ6R’Ò’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²÷6—G“¢ãƒ"ÒÂ6†–ÆG&Vã¢æÆö6ÂÓÓÒfÇ6Rò$f–ÆW2f–Æ&ÆR&VÖ÷FVÇ’"¢G¶æf–ÆW7ÒG¶æf–ÆW2ÓÓÒò&f–ÆR"¢&f–ÆW2'ÖÒ’Âç&VÖ÷FRbbæÆö6ÂÓÒfÇ6Rbb5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²6öÆ÷#¢"3VVSf3B"ÂföçEvV–v‡C¢cSÒÂ6†–ÆG&Vã¢$Æö6Â²6Æ÷VB"Ò’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²÷6—G“¢ãƒ"ÒÂ6†–ÆG&Vã¢f÷&ÖE&VÖ÷FU6fR†ç&VÖ÷FUF–ÖRÂ&÷f–FW"Âç&VÖ÷FR’Ò•ÒÒ•ÒÒ•ÒÒ“°§Ð¢ò¢¢æF—fR6öçG&öÂ7W&f6Rf÷"6Æ÷VG&VF—&V7BÖÖööâw26öæf–ræBôWF‚6öçG&7Bâ¢ð¦gVæ7F–öâ6Æ÷VE&VF—&V7E6V7F–öâ‚’°¢6öç7B¶Væ&ÆVBÂ6WDVæ&ÆVEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶×6rÂ6WD×6uÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·7FFRÂ6WE7FFUÒÒ5õ$T5BçW6U7FFR‡²7V66W73¢fÇ6RÒ“°¢6öç7B·6fW2Â6WE6fW5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶6ÆÆ&6µW&ÂÂ6WD6ÆÆ&6µW&ÅÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶WF…v—F–ærÂ6WDWF…v—F–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶föÆFW%F‚Â6WDföÆFW%F…ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶–×÷'DvÖW2Â6WD–×÷'DvÖW5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7BÆ—fRÒ5õ$T5BçW6U&Vb‡G'VR“°¢6öç7BWF…vF6‚Ò5õ$T5BçW6U&Vbƒ“°¢6öç7BÆöBÒ7–æ2‚’Óâ°¢G'’°¢6WDVæ&ÆVB‚†v—B7$vWDVæ&ÆVB‚’’æVæ&ÆVB“°¢Ð¢6F6‚²ò¢&W7BVff÷'B¢òÐ¢G'’°¢6öç7B&÷f–FW"Òv—B7%&÷f–FW%7FGW2‚“°¢6WE7FFR‡&÷f–FW"“°¢6WDföÆFW%F‚‡&÷f–FW"ç7–æ4föÆFW%F‚ÇÂ""“°¢–b‡&÷f–FW"ç&W—$Ö–w&F–öãòç7V66W72’°¢6WD×6r†Ö–w&F–öäÖW76vR‡&÷f–FW"Â%&W—&VBF†RW†—7F–ær7W7FöÒföÆFW"6öæf–wW&F–öââ&W7F'B7FVÒFòf–æ—6‚â"’“°¢Ð¢6öç7BWF‚Òv—B7$WF…öÆÂ‚“°¢–b†WF‚ç7FGW2ÓÓÒ&FöæR"bb&÷f–FW"æWF†VçF–6FVB’°¢6WD×6r‚$6Æ÷VB&÷f–FW"6öææV7FVBâ"“°¢6WDWF…v—F–ær†fÇ6R“°¢6WD6ÆÆ&6µW&Â‚""“°¢Ð¢VÇ6R–b†WF‚ç7FGW2bbWF‚ç7FGW2ÓÒ&–FÆR"bbWF‚ç7FGW2ÓÒ'v—F–ær"’°¢6WD×6r†6Æ÷VB&÷f–FW"6–vâÖ–âf–ÆVBG¶WF‚æW'&÷"ò¢G¶WF‚æW'&÷'Ö¢"â'Ö“°¢Ð¢Ð¢6F6‚²ò¢&W7BVff÷'B¢òÐ¢G'’°¢6öç7B6FÆörÒv—B7$Æ—7DÆö6Ä2‚“°¢6WE6fW2†6FÆöræ2ÇÂµÒ“°¢–b†6FÆörç&VÖ÷FTW'&÷"¢6WD×6r†Æö6Â6fW26†÷vã²6Æ÷VBF—66÷fW'’Væf–Æ&ÆS¢G¶6FÆörç&VÖ÷FTW'&÷'Ö“°¢Ð¢6F6‚²ò¢&W7BVff÷'B¢òÐ¢G'’°¢6öç7B–ç7FÆÆVBÒv—BvWD–ç7FÆÆVD2‚“°¢6öç7BvÖW2Ò†–ç7FÆÆVBæ2ÇÂµÒ¢æÖ‚†’Óâ‡²–C¢çVÖ&W"†æ–B’ÂæÖS¢ævÖTæÖRÇÂ”BG¶æ–GÖÒ’¢æf–ÇFW"‚†’Óâæ–Bâ¢ç6÷'B‚†Â"’ÓâææÖRæÆö6ÆT6ö×&R†"ææÖR’“°¢6WD–×÷'DvÖW2†vÖW2“°¢Ð¢6F6‚²ò¢&W7BVff÷'B¢òÐ¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢Æ—fRæ7W'&VçBÒG'VS°¢ÆöB‚“°¢&WGW&â‚’Óâ²Æ—fRæ7W'&VçBÒfÇ6S²WF…vF6‚æ7W'&VçB³Ò²Ó°¢ÒÂµÒ“°¢6öç7BvF6„WFöÖF–46ÆÆ&6²Ò7–æ2‡vF6„–B’Óâ°¢f÷"†ÆWB’Ò²Æ—fRæ7W'&VçBbbWF…vF6‚æ7W'&VçBÓÓÒvF6„–Bbb’Â3²’²²’°¢v—B6ÆVWƒ“°¢G'’°¢6öç7BöÆÂÒv—B7$WF…öÆÂ‚“°¢–b‡öÆÂç7FGW2ÓÓÒ'v—F–ær"¢6öçF–çVS°¢–b‡öÆÂç7FGW2ÓÓÒ&FöæR"’°¢6WD×6r‚$6Æ÷VB&÷f–FW"6öææV7FVBâ"“°¢6WDWF…v—F–ær†fÇ6R“°¢6WD6ÆÆ&6µW&Â‚""“°¢v—BÆöB‚“°¢Ð¢VÇ6R–b‡öÆÂç7FGW2ÓÒ&–FÆR"’°¢6WD×6r†WFöÖF–26ÆÆ&6²Væf–Æ&ÆRâ7FRF†R6ö×ÆWFRÆö6Æ†÷7BU$Â&VÆ÷rG·öÆÂæW'&÷"ò¢G·öÆÂæW'&÷'Ö¢"â'Ö“°¢Ð¢'&V³°¢Ð¢6F6‚°¢òòÖçVÂ6ö×ÆWF–öâ&VÖ–ç2f–Æ&ÆS²öÆÆ–ærf–ÇW&R×W7Bæ÷BÆö6²T’à¢Ð¢Ð¢Ó°¢6öç7B6†ævTVæ&ÆVBÒ7–æ2‡fÇVR’Óâ°¢6WD'W7’‡G'VR“°¢6WDVæ&ÆVB‡fÇVR“°¢G'’°¢6öç7B&W7VÇBÒv—B7%6WDVæ&ÆVB‡fÇVR“°¢–b‚&W7VÇBç7V66W72’°¢6WDVæ&ÆVB‚fÇVR“°¢6WD×6r‡&W7VÇBæW'&÷"ÇÂ$6÷VÆBæ÷BWFFR6Æ÷VE&VF—&V7B"“°¢Ð¢VÇ6P¢6WD×6r‡fÇVRò$6Æ÷VB6fW2Væ&ÆVBf÷"4Å2ÖFFVBvÖW2â"¢$6Æ÷VB6fW2F—6&ÆVBâ"“°¢Ð¢6F6‚†W'&÷"’°¢6WDVæ&ÆVB‚fÇVR“°¢6WD×6r†W'&÷#¢G¶W'&÷'Ö“°¢Ð¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7B6VÆV7E&÷f–FW"Ò7–æ2‡fÇVR’Óâ°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B&W7VÇBÒv—B7%6WE&÷f–FW"‡fÇVR“°¢–b‚&W7VÇBç7V66W72’°¢–b‡fÇVRÓÓÒ&föÆFW""bb‡&W7VÇBæW'&÷"ÇÂ""’æ–æ6ÇVFW2‚$6†ö÷6R7W7FöÒföÆFW""’’°¢6WE7FFR‚†öÆB’Óâ‡²ââæöÆBÂ&÷f–FW#¢&föÆFW""Â6öæf–wW&VC¢fÇ6RÒ’“°¢6WD×6r‚$VçFW"æB6fR7W7FöÒföÆFW"F‚&VÆ÷râ"“°¢6WD'W7’†fÇ6R“°¢&WGW&ã°¢Ð¢F‡&÷ræWrW'&÷"‡&W7VÇBæW'&÷"ÇÂ%&÷f–FW"G&ç6—F–öâf–ÆVB"“°¢Ð¢6WE7FFR‡&W7VÇB“°¢6öç7B&6RÒfÇVRÓÓÒ&Æö6Â"ò%W6–ær6Æ÷VE&VF—&V7Bw2'V–ÇBÖ–âÆö6Â7F÷&vRâ&W7F'B7FVÒFòf–æ—6‚â"¢fÇVRÓÓÒ&föÆFW""ð¢‡&W7VÇBæ6öæf–wW&VBò%W6–ærF†R6VÆV7FVB7W7FöÒföÆFW"â&W7F'B7FVÒFòf–æ—6‚â"¢$VçFW"æB6fR7W7FöÒföÆFW"F‚&VÆ÷râ"’ ¢&W7VÇBæWF†VçF–6FVBò$W†—7F–ær6–vâÖ–â&W7F÷&VBâ&W7F'B7FVÒFòf–æ—6‚â"¢%&÷f–FW"6VÆV7FVBâ6öææV7B—B&VÆ÷râ#°¢6WD×6r†Ö–w&F–öäÖW76vR‡&W7VÇBÂ&6R’“°¢Ð¢6F6‚†W'&÷"’°¢6WD×6r†W'&÷#¢G¶W'&÷'Ö“°¢Ð¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7B6fTföÆFW"Ò7–æ2‚’Óâ°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B&W7VÇBÒv—B7%6WE7–æ4föÆFW"†föÆFW%F‚çG&–Ò‚’“°¢6WE7FFR‡&W7VÇB“°¢–b‚&W7VÇBç7V66W72¢F‡&÷ræWrW'&÷"‡&W7VÇBæW'&÷"ÇÂ$6÷VÆBæ÷BW6RF†BföÆFW""“°¢6WDföÆFW%F‚‡&W7VÇBç7–æ4föÆFW%F‚ÇÂföÆFW%F‚çG&–Ò‚’“°¢6WD×6r†Ö–w&F–öäÖW76vR‡&W7VÇBÂ$7W7FöÒföÆFW"7F—fFVBâ&W7F'B7FVÒ&Vf÷&RW6–ær—Bâ"’“°¢v—BÆöB‚“°¢Ð¢6F6‚†W'&÷"’°¢6WD×6r†föÆFW"6WGWf–ÆVC¢G¶W'&÷'Ö“°¢Ð¢–b†Æ—fRæ7W'&VçB¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7B6öææV7BÒ7–æ2‚’Óâ°¢6öç7B&÷f–FW"Ò7FFRç&÷f–FW#°¢–b‚&÷f–FW"ÇÂ&÷f–FW"ÓÓÒ&Æö6Â"¢&WGW&ã°¢6WD'W7’‡G'VR“°¢6WD×6r‚%&W&–ærÖööâ6Æ÷VE&VF—&V7B6–vâÖ–î(
b"“°¢G'’°¢6öç7B–ç7FÆÆVBÒv—B7$Vç7W&T–ç7FÆÆVDWFò‚“°¢–b‚–ç7FÆÆVBæ–ç7FÆÆVB¢F‡&÷ræWrW'&÷"†–ç7FÆÆVBæÆörÇÂ$Öööâ†öö²–ç7FÆÆF–öâf–ÆVB"“°¢6öç7B7F'BÒv—B7$WF…7F'B‡&÷f–FW"“°¢–b‚7F'Bç7V66W72ÇÂ7F'BæWF…W&Â¢F‡&÷ræWrW'&÷"‡7F'BæW'&÷"ÇÂ$6÷VÆBæ÷B7F'B6–vâÖ–â"“°¢DdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"‡7F'BæWF…W&Â“°¢6WDWF…v—F–ær‡G'VR“°¢6WD×6r‚$f–æ—6‚6–vâÖ–â–âF†R'&÷w6W#²4Å4FV6²—26GW&–ærF†RÆö6Æ†÷7B6ÆÆ&6²WFöÖF–6ÆÇ’â"“°¢6öç7BvF6„–BÒ²¶WF…vF6‚æ7W'&VçC°¢fö–BvF6„WFöÖF–46ÆÆ&6²‡vF6„–B“°¢Ð¢6F6‚†W'&÷"’°¢6WD×6r†6–vâÖ–âf–ÆVC¢G¶W'&÷'Ö“°¢Ð¢–b†Æ—fRæ7W'&VçB¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7Bf–æ—6„6ÆÆ&6²Ò7–æ2‚’Óâ°¢–b‚6ÆÆ&6µW&ÂçG&–Ò‚’¢&WGW&ã°¢6WD'W7’‡G'VR“°¢6WD×6r‚$6ö×ÆWF–ær6Æ÷VE&VF—&V7B6–vâÖ–î(
b"“°¢G'’°¢6öç7B&W7VÇBÒv—B7$WF„6ÆÆ&6²†6ÆÆ&6µW&ÂçG&–Ò‚’“°¢–b‚&W7VÇBç7V66W72ÇÂ&W7VÇBç7FGW2ÓÒ&FöæR"¢F‡&÷ræWrW'&÷"‡&W7VÇBæW'&÷"ÇÂ%6–vâÖ–âF–Bæ÷B6ö×ÆWFR"“°¢WF…vF6‚æ7W'&VçB³Ò°¢6WDWF…v—F–ær†fÇ6R“°¢6WD6ÆÆ&6µW&Â‚""“°¢6WD×6r‚$6Æ÷VB&÷f–FW"6öææV7FVBâ"“°¢v—BÆöB‚“°¢Ð¢6F6‚†W'&÷"’°¢6WD×6r†6–vâÖ–âf–ÆVC¢G¶W'&÷'Ö“°¢Ð¢–b†Æ—fRæ7W'&VçB¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7BFövvÆT÷F–öâÒ7–æ2†¶W’ÂfÇVR’Óâ°¢6öç7Bf–VÆBÒ¶W’ÓÓÒ'7–æ5ö6†–WfVÖVçG2"ò'7–æ46†–WfVÖVçG2"¢'7–æ5Æ—F–ÖR#°¢6WE7FFR‚†öÆB’Óâ‡²ââæöÆBÂ¶f–VÆEÓ¢fÇVRÒ’“°¢G'’°¢6WE7FFR†v—B7%6WE&÷f–FW%FövvÆR†¶W’ÂfÇVR’“°¢Ð¢6F6‚†W'&÷"’°¢6WD×6r†W'&÷#¢G¶W'&÷'Ö“°¢v—BÆöB‚“°¢Ð¢Ó°¢6öç7BF—66öææV7BÒ7–æ2‚’Óâ°¢6WD'W7’‡G'VR“°¢G'’°¢6WE7FFR†v—B7%6–vä÷WB‡7FFRç&÷f–FW"’“°¢6WD×6r‚%&÷f–FW"7&VFVçF–Ç2&VÖ÷fVBg&öÒF†—2FWf–6Râ"“°¢Ð¢6F6‚†W'&÷"’°¢6WD×6r†W'&÷#¢G¶W'&÷'Ö“°¢Ð¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7B–×÷'E6fRÒ7–æ2‚’Óâ°¢6öç7BvÖRÒv—B–6µ6fTvÖR†–×÷'DvÖW2“°¢–b‚vÖR¢&WGW&ã°¢ÆWBF‚Ò"#°¢G'’°¢6öç7B–6¶VBÒv—B÷Väf–ÆU–6¶W"ƒò¢f–ÆU6VÆV7F–öåG—Räd”ÄR¢òÂ"ö†öÖRöFV6²ôF÷væÆöG2"ÂG'VRÂG'VR“°¢F‚Ò–6¶VCòç&VÇF‚ÇÂ–6¶VCòçF‚ÇÂ"#°¢Ð¢6F6‚°¢&WGW&ã°¢Ð¢–b‚F‚¢&WGW&ã°¢6WD'W7’‡G'VR“°¢6WD×6r‚$–×÷'F–ær6f^(
b"“°¢G'’°¢6öç7B&W7VÇBÒv—B7$–×÷'E6fR†vÖRæ–BÂF‚“°¢–b‚&W7VÇBç7V66W72¢F‡&÷ræWrW'&÷"‡&W7VÇBæW'&÷"ÇÂ%6fR–×÷'Bf–ÆVB"“°¢6öç7Bw&W"Ò&W7VÇBçw&W%&VÖ÷fVBò"F†R&6†—fRw2÷WFW"föÆFW"v2&VÖ÷fVBâ"¢"#°¢6öç7B&6·WÒ&W7VÇBæ&6·Wò"W†—7F–ær6fW2vW&R&6¶VBWf—'7Bâ"¢"#°¢6WD×6r†–×÷'FVBG·&W7VÇBæf–ÆW2ÇÂÒ6fRf–ÆRG·&W7VÇBæf–ÆW2ÓÓÒò""¢'2'ÒâG·w&W'ÒG¶&6·WÖ“°¢v—BÆöB‚“°¢Ð¢6F6‚†W'&÷"’°¢6WD×6r†6fR–×÷'Bf–ÆVC¢G¶W'&÷'Ö“°¢Ð¢–b†Æ—fRæ7W'&VçB¢6WD'W7’†fÇ6R“°¢Ó°¢6öç7B6VÆV7FVBÒ$õd”DU%2æf–æB‚†—FVÒ’Óâ—FVÒæFFÓÓÒ‡7FFRç&÷f–FW"ÇÂ&Æö6Â"’“°¢6öç7B6fT6÷VçBÒ6fW2æÆVæwFƒ°¢6öç7B&VÖ÷FTöæÇ”6÷VçBÒ6fW2æf–ÇFW"‚†’Óâç&VÖ÷FRbbæÆö6ÂÓÓÒfÇ6R’æÆVæwFƒ°¢6öç7B6÷'FVE6fW2Ò²ââç6fW5Òç6÷'B‚†Â"’Óâ°¢6öç7B†56fW2Òæf–ÆW2âÇÂç6—¦RâÇÂç&VÖ÷FS°¢6öç7B$†56fW2Ò"æf–ÆW2âÇÂ"ç6—¦RâÇÂ"ç&VÖ÷FS°¢–b††56fW2ÓÒ$†56fW2¢&WGW&â†56fW2òÓ¢°¢–b‚†"ç&VÖ÷FUF–ÖRÇÂ’ÓÒ†ç&VÖ÷FUF–ÖRÇÂ’¢&WGW&â†"ç&VÖ÷FUF–ÖRÇÂ’Ò†ç&VÖ÷FUF–ÖRÇÂ“°¢&WGW&â7FVÔvÖR†æ–BÂææÖR’çF—FÆRæÆö6ÆT6ö×&R‡7FVÔvÖR†"æ–BÂ"ææÖR’çF—FÆR“°¢Ò“°¢&WGW&â5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$6Æ÷VB6fW2„6Æ÷VE&VF—&V7B’"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$6Æ÷VB6fW2f÷"FFVBvÖW2"ÂFW67&—F–öã¢%W6W2F†RæF—fR6Æ÷VG&VF—&V7BÖÖööâ†öö²âæòfÆG²6ö×æ–öâ—2&WV—&VBâ"Â6†V6¶VC¢Væ&ÆVBÂöä6†ævS¢6†ævTVæ&ÆVBÂF—6&ÆVC¢'W7’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%7F÷&vR&÷f–FW""ÂFW67&—F–öã¢$6öæf–wW&F–öâ—2&VBF—&V7FÇ’'’6Æ÷VG&VF—&V7BÖÖööââ"Â&t÷F–öç3¢$õd”DU%2Â6VÆV7FVD÷F–öã¢6VÆV7FVCòæFFÇÂ&Æö6Â"Â7G$FVfVÇDÆ&VÃ¢6VÆV7FVCòæÆ&VÂÇÂ$'V–ÇBÖ–âÆö6Â7F÷&vR"Âöä6†ævS¢†÷F–öâ’Óâ6VÆV7E&÷f–FW"†÷F–öâæFF’ÂF—6&ÆVC¢'W7’Ò’Ò’Â7FFRç&÷f–FW"ÓÓÒ&föÆFW""bb5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢$7W7FöÒ7–æ2föÆFW""ÂFW67&—F–öã¢$'6öÇWFRF‚öâ–çFW&æÂ7F÷&vRÂ4B6&BÂW‡FW&æÂG&—fRÂæWGv÷&²Ö÷VçBÂ÷"7–æ7F†–ærôG&÷&÷‚föÆFW"â"ÂfÇVS¢föÆFW%F‚Âöä6†ævS¢†WfVçB’Óâ6WDföÆFW%F‚†WfVçCòçF&vWCòçfÇVRóò7G&–ær†WfVçBÇÂ""’’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢6fTföÆFW"ÂF—6&ÆVC¢'W7’ÇÂföÆFW%F‚çG&–Ò‚’Â6†–ÆG&Vã¢%W6RF†—2föÆFW""Ò’Ò•ÒÒ’Â7FFRç&÷f–FW"ÓÒ&Æö6Â"bb7FFRç&÷f–FW"ÓÒ&föÆFW""bb7FFRæWF†VçF–6FVBb`¢5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢6öææV7BÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢$6öææV7B&÷f–FW""Ò’Ò’Â7FFRç&÷f–FW"ÓÒ&Æö6Â"bb7FFRç&÷f–FW"ÓÒ&föÆFW""bb7FFRæWF†VçF–6FVBbbWF…v—F–ærbb5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢ÂÆ–æT†V–v‡C¢ãCRÂ÷6—G“¢ãs‚ÒÂ6†–ÆG&Vã¢$WFöÖF–26GW&R—27F—fRâ–bF†R'&÷w6W"7F–ÆÂVæG2öââVç&V6†&ÆRÆö6Æ†÷7BvRÂ6÷’—G26ö×ÆWFRFG&W72Ö&"U$ÂæB7FR—B&VÆ÷râ"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢$6ÆÆ&6²U$Â"ÂFW67&—F–öã¢$–æ6ÇVFW2&÷F‚ö6öFSÒæBg7FFSÒâ"ÂfÇVS¢6ÆÆ&6µW&ÂÂöä6†ævS¢†WfVçB’Óâ6WD6ÆÆ&6µW&Â†WfVçCòçF&vWCòçfÇVRóò7G&–ær†WfVçBÇÂ""’’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢f–æ—6„6ÆÆ&6²ÂF—6&ÆVC¢'W7’ÇÂ6ÆÆ&6µW&ÂçG&–Ò‚’Â6†–ÆG&Vã¢$f–æ—6‚6–vâÖ–â"Ò’Ò•ÒÒ’Â7FFRç&÷f–FW"ÓÒ&Æö6Â"bb7FFRç&÷f–FW"ÓÒ&föÆFW""bb7FFRæWF†VçF–6FVBb`¢5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢F—66öææV7BÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢%6–vâ÷WB"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%7–æ26†–WfVÖVçG2"Â6†V6¶VC¢7FFRç7–æ46†–WfVÖVçG2Âöä6†ævS¢‡b’ÓâFövvÆT÷F–öâ‚'7–æ5ö6†–WfVÖVçG2"Âb’ÂF—6&ÆVC¢'W7’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%7–æ2Æ—F–ÖR"Â6†V6¶VC¢7FFRç7–æ5Æ—F–ÖRÂöä6†ævS¢‡b’ÓâFövvÆT÷F–öâ‚'7–æ5÷Æ—F–ÖR"Âb’ÂF—6&ÆVC¢'W7’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢–×÷'E6fRÂF—6&ÆVC¢'W7’ÇÂ–×÷'DvÖW2æÆVæwF‚ÂFW67&—F–öã¢$6†ö÷6Râ4Å2vÖRÂF†Vâ6VÆV7BÆö÷6R6fRf–ÆR÷"¤•õD"&6†—fRg&öÒF÷væÆöG2â"Â6†–ÆG&Vã¢$FB6fRf–ÆR÷"&6†—fR"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢7FFRæWF†VçF–6FVBÇÂ7FFRç&÷f–FW"ÓÓÒ&Æö6Â"ÇÂ7FFRæ6öæf–wW&VBò"3VVSf3B"¢"6cVc#2"ÒÂ6†–ÆG&Vã¢7FFRç&÷f–FW"ÓÓÒ&Æö6Â"òÆö6Â&÷f–FW"&VG’+rG·6fT6÷VçGÒvÖR6fRG·6fT6÷VçBÓÓÒò&föÆFW""¢&föÆFW'2'Ö ¢7FFRç&÷f–FW"ÓÓÒ&föÆFW""ò‡7FFRæ6öæf–wW&VBò)É27W7FöÒföÆFW"&VG’+rG·7FFRç7–æ4föÆFW%F‡Ö¢$7W7FöÒföÆFW"æVVG2w&—F&ÆRF‚â"’ ¢7FFRæWF†VçF–6FVBò)É2G·6VÆV7FVCòæÆ&VÇÒ6öææV7FVB+rG·6fT6÷VçGÒÖævVBG·6fT6÷VçBÓÓÒò&vÖR"¢&vÖW2'ÒG·&VÖ÷FTöæÇ”6÷VçBò+rG·&VÖ÷FTöæÇ”6÷VçGÒ6Æ÷VBöæÇ–¢"'Ö ¢G·6VÆV7FVCòæÆ&VÂÇÂ$6Æ÷VB&÷f–FW"'ÒæVVG26–vâÖ–âæÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²v–GFƒ¢#R"ÂÖ&v–åF÷¢RÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&&6VÆ–æR"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"ÂÖ&v–ã¢#'‚—‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçE6—¦S¢BÂföçEvV–v‡C¢sÒÂ6†–ÆG&Vã¢$6Æ÷VBÖÖævVBvÖW2"Ò’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãc"ÒÂ6†–ÆG&Vã¢·6fT6÷VçBÂ""Â6fT6÷VçBÓÓÒò&vÖR"¢&vÖW2%ÒÒ•ÒÒ’Â6÷'FVE6fW2æÆVæwF‚ò6÷'FVE6fW2æÖ‚†’Óâ5ô¥5‚æ§7‚„6Æ÷VE6fT6&BÂ²¢Â&÷f–FW#¢7FFRç&÷f–FW"ÒÂG¶æ66÷VçGÓ¢G¶æ–GÖ’’ ¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²FF–æs¢#G‚'‚"Â&÷&FW%&F—W3¢‚Â&6¶w&÷VæC¢'&v&ƒ#Â32ÂCbÂãs"’"ÂföçE6—¦S¢Â÷6—G“¢ãs"ÒÂ6†–ÆG&Vã¢$æò6Æ÷VE&VF—&V7BvÖRföÆFW'2†fR&VVâ7&VFVB–WBâ"Ò•ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"6cVc#2"ÒÂ6†–ÆG&Vã¢%ÇS#dW‡W&–ÖVçFÂÇS#B&6²W–×÷'FçB6fW2âW†—7F–ærfÆG²7&VFVçF–Ç2&RÖ–w&FVBv—F†÷WBFVÆWF–ærF†R÷&–v–æÇ2â"Ò’Ò’Â×6rbb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãs‚ÒÂ6†–ÆG&Vã¢×6rÒ’Ò•ÒÒ“°§Ð §f"ÇVv–ä–ç7FÆÅG—S°¢†gVæ7F–öâ…ÇVv–ä–ç7FÆÅG—R’°¢ÇVv–ä–ç7FÆÅG—UµÇVv–ä–ç7FÆÅG—U²%$T”å5DÄÂ%ÒÒÒÒ%$T”å5DÄÂ#°¢ÇVv–ä–ç7FÆÅG—UµÇVv–ä–ç7FÆÅG—U²%UDDR%ÒÒ%ÒÒ%UDDR#°¢ÇVv–ä–ç7FÆÅG—UµÇVv–ä–ç7FÆÅG—U²$Dõtäu$DR%ÒÒ5ÒÒ$Dõtäu$DR#°§Ò’…ÇVv–ä–ç7FÆÅG—RÇÂ…ÇVv–ä–ç7FÆÅG—RÒ·Ò’“°¦gVæ7F–öâFV6·”&6¶VæB‚’°¢&WGW&âv–æF÷räFV6·”&6¶VæBóòv–æF÷ræ÷VæW#òäFV6·”&6¶VæBóòçVÆÃ°§Ð¢ò¢ ¢¢FööÂWFFW2(	B¶VW2WfW'’v—D‡V"×6÷W&6VBFööÂôDÄÂ…6Öö¶T’Â7&VÔ’ÂWÆ¢¢VæÆö6¶W'2’öâF†RÆFW7B&VÆV6RÂ6†V6¶VBöâ&ö÷Bâ&÷FöâæBF†R…`¢¢ÖöGVÆR&RÆ&vRò7—7FVÒ×7V6–f–2Â6òF†W’&RöæÇ’fÆvvVB†W&Rà¢¢ð¦gVæ7F–öâWFFW56V7F–öâ‚’°¢6öç7B·W2Â6WEW5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·ÇVv–âÂ6WEÇVv–åÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·&VÆV6W2Â6WE&VÆV6W5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·6VÆV7FVD6†ææVÂÂ6WE6VÆV7FVD6†ææVÅÒÒ5õ$T5BçW6U7FFR‚'WFFR×7—7FVÒ"“°¢6öç7B·6VÆV7FVEFrÂ6WE6VÆV7FVEFuÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·ÇVv–ä'W7’Â6WEÇVv–ä'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·ÇVv–å&öw&W72Â6WEÇVv–å&öw&W75ÒÒ5õ$T5BçW6U7FFRƒ“°¢6öç7B·ÇVv–ä×6rÂ6WEÇVv–ä×6uÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7BÇVv–äF÷væÆöE7F'FVBÒ5õ$T5BçW6U&Vb†fÇ6R“°¢6öç7B¶WFõWÂ6WDWFõWÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶Væv–æUWÂ6WDVæv–æUWÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶†VF7&%WÂ6WD†VF7&%WÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶×6rÂ6WD×6uÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7BÆöBÒ7–æ2‚’Óâ°¢G'’°¢6WEW2‚†v—BWFFW46†V6²‚’’æ—FV×2ÇÂµÒ“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6öç7B7FGW2Òv—BÇVv–åWFFU7FGW2‚“°¢6WEÇVv–â‡7FGW2“°¢6öç7BÆ—7BÒ7FGW2ç&VÆV6W2ÇÂ†v—BÇVv–åWFFU&VÆV6W2‚’’ç&VÆV6W2ÇÂµÓ°¢6WE&VÆV6W2†Æ—7B“°¢6öç7Bf–Æ&ÆT6†ææVÇ2Ò'&’æg&öÒ†æWr6WB†Æ—7BæÖ‚†—FVÒ’Óâ—FVÒæ6†ææVÂ’’“°¢6öç7BFVfVÇD6†ææVÂÒf–Æ&ÆT6†ææVÇ2æ–æ6ÇVFW2‡7FGW2æ7W'&VçD6†ææVÂ¢ò7FGW2æ7W'&VçD6†ææVÂ¢f–Æ&ÆT6†ææVÇ2æ–æ6ÇVFW2‚'WFFR×7—7FVÒ"’ò'WFFR×7—7FVÒ"¢†f–Æ&ÆT6†ææVÇ5³ÒÇÂ""“°¢6WE6VÆV7FVD6†ææVÂ‚‡&Wf–÷W2’Óâf–Æ&ÆT6†ææVÇ2æ–æ6ÇVFW2‡&Wf–÷W2’ò&Wf–÷W2¢FVfVÇD6†ææVÂ“°¢Ð¢6F6‚†W'&÷"’°¢6WEÇVv–ä×6r†ÇVv–âWFFR6†V6²f–ÆVC¢G¶W'&÷'Ö“°¢Ð¢G'’°¢6WDWFõW‚†v—BvWDWFõWFFR‚’’æVæ&ÆVB“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6WDVæv–æUW‚†v—BvWD6†V6´Væv–æUWFFW2‚’’æVæ&ÆVB“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6WD†VF7&%W‚†v—BvWD6†V6´†VF7&%WFFW2‚’’æVæ&ÆVB“°¢Ð¢6F6‚²ò¢¢òÐ¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ²ÆöB‚“²ÒÂµÒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢6öç7B&6¶VæBÒFV6·”&6¶VæB‚“°¢–b‚&6¶VæCòæFDWfVçDÆ—7FVæW"¢&WGW&ã°¢6öç7B7F'BÒ†æÖR’Óâ°¢–b†æÖRÓÒ%4Å4FV6µVæ—fW'6Â"¢&WGW&ã°¢ÇVv–äF÷væÆöE7F'FVBæ7W'&VçBÒG'VS°¢6WEÇVv–ä'W7’‡G'VR“°¢6WEÇVv–å&öw&W72ƒ“°¢6WEÇVv–ä×6r‚$F÷væÆöF–ærÇVv–î(
b"“°¢Ó°¢6öç7B&öw&W72Ò‡W&6VçB’Óâ°¢6WEÇVv–å&öw&W72„çVÖ&W"‡W&6VçB’ÇÂ“°¢Ó°¢6öç7Bf–æ—6‚Ò†æÖR’Óâ°¢–b†æÖRÓÒ%4Å4FV6µVæ—fW'6Â"¢&WGW&ã°¢ÇVv–äF÷væÆöE7F'FVBæ7W'&VçBÒfÇ6S°¢6WEÇVv–å&öw&W72ƒ“°¢6WEÇVv–ä×6r‚%ÇVv–â–ç7FÆÆVBâ&VÆöF–æ~(
b"“°¢6WEÇVv–ä'W7’†fÇ6R“°¢&6¶VæBæ6ÆÂ‚&ÆöFW"÷&VÆöE÷ÇVv–â"ÂæÖR’æ6F6‚‚‚’Óâ²Ò“°¢Ó°¢&6¶VæBæFDWfVçDÆ—7FVæW"‚&ÆöFW"÷ÇVv–åöF÷væÆöE÷7F'B"Â7F'B“°¢&6¶VæBæFDWfVçDÆ—7FVæW"‚&ÆöFW"÷ÇVv–åöF÷væÆöEö–æfò"Â&öw&W72“°¢&6¶VæBæFDWfVçDÆ—7FVæW"‚&ÆöFW"÷ÇVv–åöF÷væÆöEöf–æ—6‚"Âf–æ—6‚“°¢&WGW&â‚’Óâ°¢&6¶VæBç&VÖ÷fTWfVçDÆ—7FVæW#òâ‚&ÆöFW"÷ÇVv–åöF÷væÆöE÷7F'B"Â7F'B“°¢&6¶VæBç&VÖ÷fTWfVçDÆ—7FVæW#òâ‚&ÆöFW"÷ÇVv–åöF÷væÆöEö–æfò"Â&öw&W72“°¢&6¶VæBç&VÖ÷fTWfVçDÆ—7FVæW#òâ‚&ÆöFW"÷ÇVv–åöF÷væÆöEöf–æ—6‚"Âf–æ—6‚“°¢Ó°¢ÒÂµÒ“°¢6öç7BWFF&ÆRÒW2æf–ÇFW"‚‡R’ÓâRçWFFTf–Æ&ÆR“°¢6öç7B6†ææVÇ2Ò'&’æg&öÒ†æWr6WB‡&VÆV6W2æÖ‚†—FVÒ’Óâ—FVÒæ6†ææVÂ’’“°¢6öç7B6†ææVÅ&VÆV6W2Ò&VÆV6W2æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ6†ææVÂÓÓÒ6VÆV7FVD6†ææVÂ“°¢6öç7B6VÆV7FVE&VÆV6RÒ6†ææVÅ&VÆV6W2æf–æB‚†—FVÒ’Óâ—FVÒçFrÓÓÒ6VÆV7FVEFr’ÇÂ6†ææVÅ&VÆV6W5³ÒÇÂçVÆÃ°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢–b‚6†ææVÅ&VÆV6W2ç6öÖR‚†—FVÒ’Óâ—FVÒçFrÓÓÒ6VÆV7FVEFr’’°¢6WE6VÆV7FVEFr†6†ææVÅ&VÆV6W5³ÓòçFrÇÂ""“°¢Ð¢ÒÂ·6VÆV7FVD6†ææVÂÂ&VÆV6W5Ò“°¢6öç7B–ç7FÆÅ6VÆV7FVBÒ7–æ2‚’Óâ°¢–b‚ÇVv–âÇÂ6VÆV7FVE&VÆV6R¢&WGW&ã°¢6öç7B&6¶VæBÒFV6·”&6¶VæB‚“°¢–b‚&6¶VæCòæ6ÆÂ’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²WFFR"Â&öG“¢$FV6·’–ç7FÆÆW"—2Væf–Æ&ÆR–âF†—2v–æF÷râ"Ò“°¢&WGW&ã°¢Ð¢6öç7B6ÖT6†ææVÂÒ6VÆV7FVE&VÆV6Ræ6†ææVÂÓÓÒÇVv–âæ7W'&VçD6†ææVÃ°¢6öç7B–ç7FÆÅG—RÒ6ÖT6†ææVÂÇÂ6VÆV7FVE&VÆV6Rç&öÆÆ–æp¢òÇVv–ä–ç7FÆÅG—Rå$T”å5DÄÀ¢¢6VÆV7FVE&VÆV6Rç'VäçVÖ&W"âÇVv–âæ7W'&VçD'V–Æ@¢òÇVv–ä–ç7FÆÅG—RåUDDP¢¢6VÆV7FVE&VÆV6Rç'VäçVÖ&W"ÂÇVv–âæ7W'&VçD'V–Æ@¢òÇVv–ä–ç7FÆÅG—RäDõtäu$DR¢ÇVv–ä–ç7FÆÅG—Rå$T”å5DÄÃ°¢6WEÇVv–ä'W7’‡G'VR“°¢6WEÇVv–ä×6r‚%&W&–ærFV6·’–ç7FÆÆW.(
b"“°¢G'’°¢6öç7B&ÖVBÒv—BÇVv–å&W&U&WÆ6VÖVçB‡6VÆV7FVE&VÆV6RçfW'6–öâÂ6VÆV7FVE&VÆV6Ræ76WEW&Â“°¢–b‚&ÖVBç7V66W72¢F‡&÷ræWrW'&÷"†&ÖVBæW'&÷"ÇÂ$6÷VÆBæ÷B&Ò6fR&WÆ6VÖVçB"“°¢v—B&6¶VæBæ6ÆÂ‚'WF–Æ—F–W2ö–ç7FÆÅ÷ÇVv–â"Â6VÆV7FVE&VÆV6Ræ76WEW&ÂÂ%4Å4FV6µVæ—fW'6Â"Â6VÆV7FVE&VÆV6RçfW'6–öâÂ""Â–ç7FÆÅG—R“°¢6WEÇVv–ä×6r‚$6öæf—&ÒF†R–ç7FÆÆF–öâ–âFV6·’ÆöFW"â"“°¢òòFV6·’w26ÆÂ&Vv—7FW'2F†R&WVW7BæB&WGW&ç2&Vf÷&RF†RW6W"6öæf—&×2à¢òò¶VWF†R'WGFöâW6&ÆR–b6öæf—&ÖF–öâ—26æ6VÆÆVC²F†R&6¶VæBÖ&¶W ¢òòÇ6òW‡—&W2WFöÖF–6ÆÇ’æB—26ÆV&VB'’F†RæW‡B7V66W76gVÂ'V–ÆBà¢v–æF÷rç6WEF–ÖV÷WB‚‚’Óâ°¢–b‚ÇVv–äF÷væÆöE7F'FVBæ7W'&VçB¢6WEÇVv–ä'W7’†fÇ6R“°¢ÒÂS“°¢Ð¢6F6‚†W'&÷"’°¢6WEÇVv–ä'W7’†fÇ6R“°¢6WEÇVv–ä×6r†–ç7FÆÂf–ÆVC¢G¶W'&÷'Ö“°¢Ð¢Ó°¢6öç7BWFFTÆÂÒ7–æ2‚’Óâ°¢6WD'W7’‡G'VR“°¢6WD×6r‚%WFF–ærFööÇ>(
b"“°¢G'’°¢òò–æ6ÇVFT†Vg“×G'VR6òF†R÷FVBÖ–â4Å77FVÒVæv–æR7GVÆÇ’&V–ç7FÆÇ2Fð¢òòF†RÆFW7B…&÷Föâô…b&RfÆrÖöæÇ’æB§W7BæòÖ÷†W&R’âgVÆÇ’&W7F'@¢òò7FVÒgFW'v&G2FòÆöBæWrVæv–æRà¢6öç7B"Òv—BWFFW5WFFTÆÂ‡G'VR“°¢6öç7BFöæRÒ‡"çWFFVBÇÂµÒ’æ¦ö–â‚"Â"“°¢6öç7Bf–ÆVBÒ‡"æf–ÆVBÇÂµÒ’æ¦ö–â‚"Â"“°¢6öç7B6¶—VBÒ‡"ç6¶—VBÇÂµÒ’æ¦ö–â‚"Â"“°¢6WD×6r…¶FöæRbbWFFVC¢G¶FöæWÖÂ6¶—VBbbÖçVÃ¢G·6¶—VGÖÂf–ÆVBbbf–ÆVC¢G¶f–ÆVGÖÐ¢æf–ÇFW"„&ööÆVâ’æ¦ö–â‚"+r"’ÇÂ%WFòFFRâ"“°¢Ð¢6F6‚†R’°¢6WD×6r†W'&÷#¢G¶WÖ“°¢Ð¢v—BÆöB‚“°¢6WD'W7’†fÇ6R“°¢Ó°¢&WGW&â…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%4Å4FV6²ÇVv–âWFFW2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂÆ–æT†V–v‡C¢ãRÂv–GFƒ¢#R"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²6†–ÆG&Vã¢²$–ç7FÆÆVC¢"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢ÇVv–ãòæ7W'&VçEfW'6–öâÇÂ&6†V6¶–æ~(
b"Ò•ÒÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²6†–ÆG&Vã¢²$6†ææVÃ¢"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢ÇVv–ãòæ7W'&VçD6†ææVÂÇÂ'Væ¶æ÷vâ"Ò•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—G“¢ãs"ÒÂ6†–ÆG&Vã¢ÇVv–ãòçWFFTf–Æ&ÆP¢òWFFRf–Æ&ÆS¢G·ÇVv–âæÆFW7CòçfW'6–öçÖ ¢¢ÇVv–ãòç7V66W72ò%F†—2WFFR6†ææVÂ—27W'&VçBâ"¢‡ÇVv–ãòæW'&÷"ÇÂ$6†V6¶–ærv—D‡V"&VÆV6W>(
b"’Ò•ÒÒ’Ò’Â6†ææVÇ2æÆVæwF‚âbb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%&VÆV6R6†ææVÂ"ÂFW67&—F–öã¢%7v—F6‚Fò&V'V–ÇB&öÆÆ–ær&VÆV6Rg&öÒæ÷F†W"'&æ6‚â'&æ6†W2v—F†÷WBF†—2WFFW"Ö’&WV—&RÖçVÆÇ’&V–ç7FÆÆ–ærWFFR×7—7FVÒFò&WGW&ââ"Â&t÷F–öç3¢6†ææVÇ2æÖ‚†6†ææVÂ’Óâ‡²FF¢6†ææVÂÂÆ&VÃ¢6†ææVÂÒ’’Â6VÆV7FVD÷F–öã¢6VÆV7FVD6†ææVÂÂ7G$FVfVÇDÆ&VÃ¢6VÆV7FVD6†ææVÂÇÂ$6†ö÷6R6†ææVÂ"Âöä6†ævS¢†÷F–öâ’Óâ6WE6VÆV7FVD6†ææVÂ…7G&–ær†÷F–öâæFFÇÂ""’’ÂF—6&ÆVC¢ÇVv–ä'W7’Ò’Ò’Â&VÆV6W2æÆVæwF‚âbb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢$–ç7FÆÂfW'6–öâ"ÂFW67&—F–öã¢6VÆV7FVD6†ææVÂÓÓÒ'WFFR×7—7FVÒ ¢ò$6†ö÷6R&öÆÆ–ærÆFW7B÷"â–Ö×WF&ÆR†—7F÷&–6Â'V–ÆBâÖævVBFWVæFVæ6–W2æBW6W"FF&R&W6W'fVBâ ¢¢%F†—26†ææVÂ7W'&VçFÇ’V&Æ—6†W2öæÇ’—G2&V'V–ÇB&öÆÆ–ærÆFW7B&VÆV6Râ"Â&t÷F–öç3¢6†ææVÅ&VÆV6W2æÖ‚†—FVÒ’Óâ‡²FF¢—FVÒçFrÂÆ&VÃ¢—FVÒçfW'6–öâÒ’’Â6VÆV7FVD÷F–öã¢6VÆV7FVE&VÆV6SòçFrÇÂ""Â7G$FVfVÇDÆ&VÃ¢6VÆV7FVE&VÆV6SòçfW'6–öâÇÂ$6†ö÷6R'V–ÆB"Âöä6†ævS¢†÷F–öâ’Óâ6WE6VÆV7FVEFr…7G&–ær†÷F–öâæFFÇÂ""’’ÂF—6&ÆVC¢ÇVv–ä'W7’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢–ç7FÆÅ6VÆV7FVBÂF—6&ÆVC¢ÇVv–ä'W7’ÇÂ6VÆV7FVE&VÆV6RÂ6†–ÆG&Vã¢6VÆV7FVE&VÆV6P¢ò6VÆV7FVE&VÆV6Ræ6†ææVÂÓÒÇVv–ãòæ7W'&VçD6†ææVÂò7v—F6‚FòG·6VÆV7FVE&VÆV6RçfW'6–öçÖ ¢¢6VÆV7FVE&VÆV6Rç&öÆÆ–ærò–ç7FÆÂG·6VÆV7FVE&VÆV6RçfW'6–öçÖ ¢¢6VÆV7FVE&VÆV6Rç'VäçVÖ&W"Â‡ÇVv–ãòæ7W'&VçD'V–ÆBÇÂ’òF÷væw&FRFòG·6VÆV7FVE&VÆV6RçfW'6–öçÖ ¢¢6VÆV7FVE&VÆV6Rç'VäçVÖ&W"ÓÓÒ‡ÇVv–ãòæ7W'&VçD'V–ÆBÇÂ’ò&V–ç7FÆÂG·6VÆV7FVE&VÆV6RçfW'6–öçÖ ¢¢WFFRFòG·6VÆV7FVE&VÆV6RçfW'6–öçÖ ¢¢$æò–ç7FÆÆ&ÆR'V–ÆG2f÷VæB"Ò’Ò’ÂÇVv–ä'W7’bb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂå&öw&W74&%v—F„–æfòÂ²Æ–÷WC¢&–æÆ–æR"Â&÷GFöÕ6W&F÷#¢&æöæR"Âå&öw&W73¢ÇVv–å&öw&W72Â4÷W&F–öåFW‡C¢ÇVv–ä×6rÇÂ%v÷&¶–æ~(
b"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢ÆöBÂF—6&ÆVC¢ÇVv–ä'W7’ÇÂ'W7’Â6†–ÆG&Vã¢$6†V6²ÇVv–âæBFWVæFVæ6–W2"Ò’Ò’ÂÇVv–ä×6rbbÇVv–ä'W7’bb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚…67&öÆÆ&ÆU&W7VÇBÂ²FW‡C¢ÇVv–ä×6rÒ’Ò•ÒÒ’Â5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$FWVæFVæ7’WFFW2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFò×WFFRFööÇ2öâ&ö÷B"ÂFW67&—F–öã¢$¶VW26Öö¶T’Â7&VÔ’æBF†RWÆ’VæÆö6¶W'2öâF†RÆFW7B&VÆV6Râ&÷FöâbF†R…bÖöGVÆR&RöæÇ’fÆvvVBâ"Â6†V6¶VC¢WFõWÂöä6†ævS¢‡b’Óâ²6WDWFõW‡b“²6WDWFõWFFR‡b’æ6F6‚‚‚’Óâ²Ò“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$6†V6²Væv–æR‡6Ç7FVÒÖÖööâ’WFFW2"ÂFW67&—F–öã¢$FG2F†RVæv–æRFòF†—2Æ—7B6ò—Bw2fW'6–öâÖ6†V6¶VB‡7wv—2÷6Ç7FVÒÖÖööâ’âWFFR'’&V–ç7FÆÆ–ærg&öÒFWVæFVæ6–W2âöfb'’FVfVÇBÇS#BVæv–æRWFFW2&R&—6·’â"Â6†V6¶VC¢Væv–æUWÂöä6†ævS¢‡b’Óâ²6WDVæv–æUW‡b“²6WD6†V6´Væv–æUWFFW2‡b’çF†Vâ†ÆöB’æ6F6‚‚‚’Óâ²Ò“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$6†V6²†VF7&"†6Æ–VçBf—‚’WFFW2"ÂFW67&—F–öã¢$FG2†VF7&"FòF†—2Æ—7Bâ—Bw2&öÆÆ–ær67&—B†æòfW'6–öç2’Â6òwWFFRrÒ&R×'VâF†R7FVÒ6Æ–VçBf—‚–âFWVæFVæ6–W2âöfb'’FVfVÇBâ"Â6†V6¶VC¢†VF7&%WÂöä6†ævS¢‡b’Óâ²6WD†VF7&%W‡b“²6WD6†V6´†VF7&%WFFW2‡b’çF†Vâ†ÆöB’æ6F6‚‚‚’Óâ²Ò“²ÒÒ’Ò’ÂWFF&ÆRæÆVæwF‚âbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢WFFTÆÂÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢²%WFFR"ÂWFF&ÆRæÆVæwF‚Â"FööÂ‡2’æ÷r%ÒÒ’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢ÆöBÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢$6†V6²FWVæFVæ6–W2"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂFF–æs¢#'‚'‚"ÂÆ–æT†V–v‡C¢ãRÒÂ6†–ÆG&Vã¢W2æÆVæwF‚ÓÓÒ ¢ò$6†V6¶–æ~(
b ¢¢W2æÖ‚‡R’ÓâG·RææÖWÓ¢G·RçWFFTf–Æ&ÆRòWFFR(i"G·RæÆFW7GÖ¢‡Ræ7W'&VçBÇÂ&ö²"—Ö’æ¦ö–â‚"+r"’Ò’Ò’Â×6rbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚…67&öÆÆ&ÆU&W7VÇBÂ²FW‡C¢×6rÂ6÷“¢×6ræÆVæwF‚â#Ò’Ò’•ÒÒ•ÒÒ’“°§Ð ¦6öç7B´U•õ$RÒ÷6ÖÕõ³Ó–Öe×³“gÒó°¢òòW‡&W76–öâWfÇVFVB–âF†R‡V&6F"V6‚öÆÂâÖ—'&÷'2F†R'—WRfÆ÷r6òF†P¢òò¶W’&§W7BV'2"gFW"F—66÷&BWF‚–ç7FVBöbæVVF–ærÖçVÂ6Æ–6·3 ¢òòâ–b¶W’—2Ç&VG’&VæFW&VBÂ&WGW&â—C°¢òò"â–bæ÷B6–væVB–âÂ6Æ–6²F†RF—66÷&BÆöv–âöæ6R‡7F'G2ôWF‚“°¢òò2âöæ6R6–væVB–âv—F‚æò¶W’f—6–&ÆRÂ6Æ–6²F†R&VvVæW&FRôæWrÖ¶W’6öçG&öÀ¢òòöæ6R(	BF†R¶W’&VæFW'2ÖöÖVçBÆFW"æBF†RæW‡BöÆÂ67&W2—Bà¢òòWfW'’6Æ–6²—2wV&FVB'’v–æF÷rfÆr6ò—Bf—&W2BÖ÷7Böæ6RâF†RÖçVÀ¢òòF‚7F–ÆÂv÷&·3¢–bF†RWFòÖ6Æ–6²Ö—76W2F†R'WGFöâÂF†RW6W"6â6Æ–6²—@¢òòæBF†R67&R7F–ÆÂ6F6†W2F†R&W7VÇBâÖF6†–ær—2FVÆ–&W&FVÇ’æ'&÷p¢òò‚'&VvVæW&FR"ò.(
f¶W’"’6ò—B6âwB†—BâVç&VÆFVB$vVæW&FRÖæ–fW7B"'WGFöâà¦6öç7B45$UôU…"Ò†gVæ7F–öâ‚—·G'—°¢f"ÓÒ†Fö7VÖVçBæ&öG’æ–ææW%FW‡BæÖF6‚‚÷6ÖÕõ³Ó–Öe×³“gÒò—ÇÅ²"%Ò•³Ó°¢–b†Ò’&WGW&âÓ°¢f"ÖgVæ7F–öâ‡2—·&WGW&âµÒç6Æ–6Ræ6ÆÂ†Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‡2’“·Ó°¢f"G‡CÖgVæ7F–öâ†R—·&WGW&â†Ræ–ææW%FW‡GÇÆRçFW‡D6öçFVçGÇÂ""’çG&–Ò‚“·Ó°¢f"‡&VcÖgVæ7F–öâ†R—·&WGW&â†RævWDGG&–'WFRbfRævWDGG&–'WFR‚&‡&Vb"’—ÇÂ"#·Ó°¢f"ÆövvVD–ã×‚&Æ'WGFöâ"’ç6öÖR†gVæ7F–öâ†R—·&WGW&âöÆörö÷WGÇ6–vâö÷WBö’çFW7B‡G‡B†R’—ÇÂöÆöv÷WBö’çFW7B†‡&Vb†R’“·Ò“°¢–b‚ÆövvVD–â—°¢f"Æöv–ã×‚&Æ'WGFöâ"’æf–ÇFW"†gVæ7F–öâ†R—·&WGW&âöÆörö–çÇ6–vâö–çÆF—66÷&Bö’çFW7B‡G‡B†R’—ÇÂöÆöv–çÆF—66÷&Bö’çFW7B†‡&Vb†R’“·Ò•³Ó°¢–b†Æöv–âbbv–æF÷råõ÷6Ç4‡V$Æöv–â—·v–æF÷råõ÷6Ç4‡V$Æöv–ãÓ¶Æöv–âæ6Æ–6²‚“·Ð¢&WGW&â"#°¢Ð¢f"vVã×‚&'WGFöâÆ"’æf–ÇFW"†gVæ7F–öâ†R—·&WGW&â÷&VvVæW&FWÇ&W6WBâ¦¶W—ÆæWrâ¦¶W—Æ7&VFRâ¦¶W’ö’çFW7B‡G‡B†R’“·Ò•³Ó°¢–b†vVâbbv–æF÷råõ÷6Ç4‡V$vVâ—·v–æF÷råõ÷6Ç4‡V$vVãÓ¶vVâæ6Æ–6²‚“·Ð¢&WGW&â"#°§Ö6F6‚†R—·&WGW&â"#·×Ò’‚–°¢ò¢¢f–æBÆ—fR4TbF"ö–çFVBB‡V&6Öæ–fW7Bæ6öÒÂ–bç’â¢ð¦7–æ2gVæ7F–öâf–æD‡V&6F"‚’°¢G'’°¢6öç7B&W2Òv—BfWF6„æô6÷'2‚&‡GG¢òöÆö6Æ†÷7C£ƒƒö§6öâ"“°¢6öç7BF'2Òv—B&W2æ§6öâ‚“°¢&WGW&â‡F'2æf–æB‚‡B’ÓâBçW&ÂbbBçW&Âæ–æ6ÇVFW2‚&‡V&6Öæ–fW7Bæ6öÒ"’bbBçvV%6ö6¶WDFV'VvvW%W&Â’ÇÂçVÆÂ“°¢Ð¢6F6‚°¢&WGW&âçVÆÃ°¢Ð§Ð¢ò¢¢öæR×6†÷B'VçF–ÖRæWfÇVFR÷fW"F"w24EvV%6ö6¶WC²&W6öÇfW2F†R7G&–æp¢¢&W7VÇBÂ÷"""öâW'&÷"÷F–ÖV÷WBâ¢ð¦gVæ7F–öâWfÄöåF"C‡w5W&ÂÂW‡"ÂF–ÖV÷WD×2ÒC’°¢&WGW&âæWr&öÖ—6R‚‡&W6öÇfR’Óâ°¢ÆWBFöæRÒfÇ6S°¢ÆWB6ö6³°¢6öç7Bf–æ—6‚Ò‡b’Óâ°¢–b†FöæR¢&WGW&ã°¢FöæRÒG'VS°¢G'’°¢6ö6²æ6Æ÷6R‚“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢&W6öÇfR‡b“°¢Ó°¢G'’°¢6ö6²ÒæWrvV%6ö6¶WB‡w5W&Â“°¢Ð¢6F6‚°¢&W6öÇfR‚""“°¢&WGW&ã°¢Ð¢6öç7B–BÒ°¢6ö6²æöæ÷VâÒ‚’Óâ°¢G'’°¢6ö6²ç6VæB„¥4ôâç7G&–æv–g’‡°¢–BÀ¢ÖWF†öC¢%'VçF–ÖRæWfÇVFR"À¢&×3¢²W‡&W76–öã¢W‡"Â&WGW&ä'•fÇVS¢G'VRÒÀ¢Ò’“°¢Ð¢6F6‚°¢f–æ—6‚‚""“°¢Ð¢Ó°¢6ö6²æöæÖW76vRÒ†Wb’Óâ°¢G'’°¢6öç7BÒÒ¥4ôâç'6R‡G—VöbWbæFFÓÓÒ'7G&–ær"òWbæFF¢""“°¢–b†ÒbbÒæ–BÓÓÒ–B’°¢6öç7BfÂÒÓòç&W7VÇCòç&W7VÇCòçfÇVS°¢f–æ—6‚‡G—VöbfÂÓÓÒ'7G&–ær"òfÂ¢""“°¢Ð¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ó°¢6ö6²æöæW'&÷"Ò‚’Óâf–æ—6‚‚""“°¢6WEF–ÖV÷WB‚‚’Óâf–æ—6‚‚""’ÂF–ÖV÷WD×2“°¢Ò“°§Ð¢ò¢ ¢¢öÆÂF†R‡V&6'&÷w6W"F"w2DôÒVçF–ÂvVæW&FVB¶W’V'2†÷"F–ÖV÷WB’à¢¢&W6öÇfW2F†R6ÖÕþ(
f¶W’Â÷"""–bæ÷Bf÷VæB–âF–ÖRà¢¢ð¦7–æ2gVæ7F–öâ6GW&T‡V&6¶W’†Ö„×2ÒƒÂöå7FGW2’°¢6öç7BFVFÆ–æRÒFFRææ÷r‚’²Ö„×3°¢v†–ÆR„FFRææ÷r‚’ÂFVFÆ–æR’°¢6öç7BF"Òv—Bf–æD‡V&6F"‚“°¢–b‡F"bbF"çvV%6ö6¶WDFV'VvvW%W&Â’°¢6öç7B¶W’Òv—BWfÄöåF"C‡F"çvV%6ö6¶WDFV'VvvW%W&ÂÂ45$UôU…"“°¢–b„´U•õ$RçFW7B†¶W’’¢&WGW&â¶W“°¢Ð¢v—BæWr&öÖ—6R‚‡"’Óâ6WEF–ÖV÷WB‡"Â#’“°¢Ð¢&WGW&â"#°§Ð ¦7–æ2gVæ7F–öâf–æEF"†FöÖ–â’°¢G'’°¢6öç7B&W2Òv—BfWF6„æô6÷'2‚&‡GG¢òöÆö6Æ†÷7C£ƒƒö§6öâ"“°¢6öç7BF'2Òv—B&W2æ§6öâ‚“°¢&WGW&âF'2æf–æB‚‡B’ÓâBçW&ÂbbBçW&Âæ–æ6ÇVFW2†FöÖ–â’bbBçvV%6ö6¶WDFV'VvvW%W&Â’ÇÂçVÆÃ°¢Ð¢6F6‚°¢&WGW&âçVÆÃ°¢Ð§Ð¢ò¢¢öæR×6†÷B'VçF–ÖRæWfÇVFR÷fW"F"w24EvV%6ö6¶WC²&W6öÇfW2F†R7G&–æp¢¢&W7VÇBÂ÷"""öâW'&÷"÷F–ÖV÷WBâ¢ð¦gVæ7F–öâWfÄöåF"‡w5W&ÂÂW‡"ÂF–ÖV÷WD×2ÒS’°¢&WGW&âæWr&öÖ—6R‚‡&W6öÇfR’Óâ°¢ÆWBFöæRÒfÇ6S°¢ÆWB6ö6³°¢6öç7Bf–æ—6‚Ò‡b’Óâ°¢–b†FöæR¢&WGW&ã°¢FöæRÒG'VS°¢G'’°¢6ö6²æ6Æ÷6R‚“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢&W6öÇfR‡b“°¢Ó°¢G'’°¢6ö6²ÒæWrvV%6ö6¶WB‡w5W&Â“°¢Ð¢6F6‚°¢&W6öÇfR‚""“°¢&WGW&ã°¢Ð¢6öç7B–BÒ°¢6ö6²æöæ÷VâÒ‚’Óâ°¢G'’°¢6ö6²ç6VæB„¥4ôâç7G&–æv–g’‡°¢–BÂÖWF†öC¢%'VçF–ÖRæWfÇVFR"À¢&×3¢²W‡&W76–öã¢W‡"Â&WGW&ä'•fÇVS¢G'VRÂv—E&öÖ—6S¢G'VRÒÀ¢Ò’“°¢Ð¢6F6‚°¢f–æ—6‚‚""“°¢Ð¢Ó°¢6ö6²æöæÖW76vRÒ†Wb’Óâ°¢G'’°¢6öç7BÒÒ¥4ôâç'6R‡G—VöbWbæFFÓÓÒ'7G&–ær"òWbæFF¢""“°¢–b†ÒbbÒæ–BÓÓÒ–B’°¢6öç7BfÂÒÓòç&W7VÇCòç&W7VÇCòçfÇVS°¢f–æ—6‚‡G—VöbfÂÓÓÒ'7G&–ær"òfÂ¢""“°¢Ð¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢Ó°¢6ö6²æöæW'&÷"Ò‚’Óâf–æ—6‚‚""“°¢6WEF–ÖV÷WB‚‚’Óâf–æ—6‚‚""’ÂF–ÖV÷WD×2“°¢Ò“°§Ð¦7–æ2gVæ7F–öâöÆÅF"†FöÖ–âÂW‡"ÂfÆ–BÂÖ„×2Âöå7FGW2’°¢6öç7BFVFÆ–æRÒFFRææ÷r‚’²Ö„×3°¢v†–ÆR„FFRææ÷r‚’ÂFVFÆ–æR’°¢6öç7BF"Òv—Bf–æEF"†FöÖ–â“°¢–b‡F"bbF"çvV%6ö6¶WDFV'VvvW%W&Â’°¢6öç7B¶W’Òv—BWfÄöåF"‡F"çvV%6ö6¶WDFV'VvvW%W&ÂÂW‡"“°¢–b‡fÆ–B†¶W’’¢&WGW&â¶W“°¢öå7FGW3òâ‚%v÷&¶–æröâF†RvR(	B6–vâ–â–b6¶VN(
b"“°¢Ð¢VÇ6R°¢öå7FGW3òâ†v—F–ærf÷"F†RG¶FöÖ–çÒv^(
f“°¢Ð¢v—BæWr&öÖ—6R‚‡"’Óâ6WEF–ÖV÷WB‡"Â#’“°¢Ð¢&WGW&â"#°§Ð¢òò)H)H'—WR)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H ¢òò–FV×÷FVçBW"×öÆÂW‡&W76–öââ–ç7FÆÇ2fWF6‚õ„…"–çFW&6WF÷"F†Bw&'2à¢òòWF…ö¶W’×6†VBf–VÆB÷WBöbå’&W7öç6R&öG’‡6òvRFöâwBFWVæBöâF†RW†7@¢òò¥4ôâ6†R’â–b¶W’v2Ç&VG’&öGV6VB'’F†Rf—'7BÖÆöv–âWFòÖvVæW&F–öâÀ¢òò&WGW&ç2—B–ÖÖVF–FVÇ’â÷F†W'v—6RG&–vvW'2'—WRw2ôWF‚Æöv–â–bæVVFVBÂF†Và¢òò6Æ–6·2%&W6WB"öæ6RFò&VvVæW&FR(	BF†R–çFW&6WF÷"6F6†W2F†B&W7öç6RÂæ@¢òòDôÒ&VBöbF†RF—7Æ–VB¶W’&6·2—BWà¦6öç7B%•UUô´U•õ$RÒõå´Õ¦×£Ó•×³"ÃCÒBó°¢òòfW&–f–VBÆ—fS¢õ5Bö’÷&Vg&W6…ö×•öWF…ö¶W’‡6W76–öâÖ6öö¶–RWF‚’&WGW&ç0¢òò²&WF…ö¶W’#¢#ÃbÆçVÓâ"Â'7V66W72#§G'VWÒâ6ò&F†W"F†â6Æ–6²F†RvRw2&W6W@¢òò'WGFöâæBG'’Fò–çFW&6WB—G2&RÖ&÷VæBfWF6‚‡v†–6‚÷7BÖÆöB÷fW'&–FP¢òò6âwB6VR’ÂvRÖ¶RF†RWF†VçF–6FVB&WVW7B÷W'6VÇfW2g&öÒF†RvR6öçFW‡@¢òòæB&VBF†R¶W’7G&–v‡B÷WBöbF†R¥4ôâ&W7öç6R(	BFWFW&Ö–æ—7F–2æWGv÷&°¢òò6GW&RâöæÇ’f—&W2v†Vâ6W76–öâW†—7G2†$Æör÷WB"6öçG&öÂ—2&W6VçB“°¢òò÷F†W'v—6R—B6Æ–6·2Æör–âFò7F'B'—WRw2F—66÷&BôWF‚âV6‚7V66W72&÷FFW0¢òòF†R¶W’'’FW6–vâÂv†–6‚—2F†R–çFVæFVB'&W6WBFò&VvVæW&FR"&V†f–÷W"à¦6öç7B%•UUôU…"Ò†7–æ2gVæ7F–öâ‚—·G'—°¢f"ÖgVæ7F–öâ‡2—·&WGW&âµÒç6Æ–6Ræ6ÆÂ†Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‡2’“·Ó°¢f"G‡CÖgVæ7F–öâ†R—·&WGW&â†Ræ–ææW%FW‡GÇÆRçFW‡D6öçFVçGÇÂ""’çG&–Ò‚“·Ó°¢f"‡&VcÖgVæ7F–öâ†R—·&WGW&â†RævWDGG&–'WFRbfRævWDGG&–'WFR‚&‡&Vb"’—ÇÂ"#·Ó°¢f"ÆövvVD–ã×‚&Æ'WGFöâ"’ç6öÖR†gVæ7F–öâ†R—·&WGW&âöÆörö÷WGÇ6–vâö÷WBö’çFW7B‡G‡B†R’—ÇÂõÅÂöÆöv÷WBö’çFW7B†‡&Vb†R’“·Ò“°¢–b‚ÆövvVD–â—°¢f"Æöv–ã×‚&Æ'WGFöâ"’æf–ÇFW"†gVæ7F–öâ†R—·&WGW&âöÆörö–çÇ6–vâö–âö’çFW7B‡G‡B†R’—ÇÂõÅÂöÆöv–âö’çFW7B†‡&Vb†R’“·Ò•³Ó°¢–b†Æöv–âbbv–æF÷råõ÷6Ç5'—WTÆöv–â—·v–æF÷råõ÷6Ç5'—WTÆöv–ãÓ¶Æöv–âæ6Æ–6²‚“·Ð¢&WGW&â"#°¢Ð¢f"#Öv—BfWF6‚‚"ö’÷&Vg&W6…ö×•öWF…ö¶W’"Ç¶ÖWF†öC¢%õ5B"Æ†VFW'3§²$66WB#¢&Æ–6F–öâö§6öâ'ÒÆ7&VFVçF–Ç3¢&–æ6ÇVFR'Ò“°¢–b‡"ç7FGW3ÓÓÓ#—·f"£Öv—B"æ§6öâ‚’æ6F6‚†gVæ7F–öâ‚—·&WGW&âçVÆÃ·Ò“¶–b†¢bf¢æWF…ö¶W’—&WGW&â7G&–ær†¢æWF…ö¶W’“·Ð¢&WGW&â"#°§Ö6F6‚†R—·&WGW&â"#·×Ò’‚–°¦7–æ2gVæ7F–öâ6GW&U'—WT¶W’†Ö„×2ÒƒÂöå7FGW2’°¢&WGW&âöÆÅF"‚&vVæW&F÷"ç'—WRæÆöÂ"Â%•UUôU…"Â†²’Óâ%•UUô´U•õ$RçFW7B†²’ÂÖ„×2Âöå7FGW2“°§Ð¢òò)H)H7FVÒvV"’¶W’)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H ¢òò7FVÖ6öÖ×Væ—G’æ6öÒöFWbö–¶W’&VæFW'2F†R¶W’–âgVÆÂƒ3"†W‚’öæ6R&Vv—7FW&VBà¦6öç7B5DTÕô´U•õ$RÒõå³Ó”ÔfÖe×³3'ÒBó°¦6öç7B5DTÕôU…"Ò†gVæ7F–öâ‚—·G'—°¢f"CÖFö7VÖVçBæ&öG’æ–ææW%FW‡GÇÂ"#°¢f"Ó×BæÖF6‚‚ô¶W“¥ÅÅÅÇ2¢…³Ó”ÔfÖe×³3'Ò’ò—ÇÇBæÖF6‚‚õÅÅÅÆ"…³Ó”ÔfÖe×³3'Ò•ÅÅÅÆ"ò“°¢&WGW&âÓöÕ³Ó¢"#°§Ö6F6‚†R—·&WGW&â"#·×Ò’‚–°¦7–æ2gVæ7F–öâ6GW&U7FVÔ¶W’†Ö„×2ÒƒÂöå7FGW2’°¢&WGW&âöÆÅF"‚'7FVÖ6öÖ×Væ—G’æ6öÒöFWbö–¶W’"Â5DTÕôU…"Â†²’Óâ5DTÕô´U•õ$RçFW7B†²’ÂÖ„×2Âöå7FGW2“°§Ð ¦gVæ7F–öâ6WGF–æw56V7F–öâ‚’°¢6öç7B¶f–VÆG2Â6WDf–VÆG5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶G&gG2Â6WDG&gG5ÒÒ5õ$T5BçW6U7FFR‡·Ò“°¢6öç7B¶—2Â6WD—5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·'—WT¶W’Â6WE'—WT¶W•7FFUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·'—WTG&gBÂ6WE'—WTG&gEÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·7FVÔ¶W’Â6WE7FVÔ¶W•7FFUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·7FVÔG&gBÂ6WE7FVÔG&gEÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶ÇBÂ6WDÇEÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶ÇD6öFRÂ6WDÇD6öFUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶ÇD'W7’Â6WDÇD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶‡V"Â6WD‡V%ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶‡V$'W7’Â6WD‡V$'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶‡V$6GW&–ærÂ6WD‡V$6GW&–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶‡V%WFFW2Â6WD‡V%WFFW57FFUÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·'—WT6GW&–ærÂ6WE'—WT6GW&–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·7FVÔ6GW&–ærÂ6WE7FVÔ6GW&–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7BÆöD‡V"Ò7–æ2‚’Óâ°¢6WD‡V$'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—B‡V&6W6vR‚“°¢6WD‡V"‡"ç7V66W72bb"çW6vRò"çW6vR¢çVÆÂ“°¢Ð¢6F6‚°¢6WD‡V"†çVÆÂ“°¢Ð¢f–æÆÇ’°¢6WD‡V$'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7BÆöD‡V%WFFW2Ò7–æ2‚’Óâ°¢G'’°¢6WD‡V%WFFW57FFR†v—B‡V&6WFFW57FGW2‚’“°¢Ð¢6F6‚°¢6WD‡V%WFFW57FFR†çVÆÂ“°¢Ð¢Ó°¢6öç7BÆöBÒ7–æ2‚’Óâ°¢G'’°¢6öç7B&W2Òv—BvWD”¶W”f–VÆG2‚“°¢6öç7BbÒ&W2ç7V66W72ò&W2æf–VÆG2¢µÓ°¢6WDf–VÆG2†b“°¢6öç7BBÒ·Ó°¢bæf÷$V6‚‚‡‚’Óâ†E·‚çÆ6V†öÆFW%ÒÒ‚çfÇVRÇÂ""’“°¢6WDG&gG2†B“°¢Ð¢6F6‚°¢6WDf–VÆG2…µÒ“°¢Ð¢v—BÆöD‡V%WFFW2‚“°¢G'’°¢6öç7B&W2Òv—BvWE'—WT¶W’‚“°¢6öç7B²Ò&W2ç7V66W72ò&W2æ¶W’ÇÂ""¢"#°¢6WE'—WT¶W•7FFR†²“°¢6WE'—WTG&gB†²“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢G'’°¢6öç7B&W2Òv—Bw4vWE7FVÔ¶W’‚“°¢6öç7B²Ò&W2ç7V66W72ò&W2æ¶W’ÇÂ""¢"#°¢6WE7FVÔ¶W•7FFR†²“°¢6WE7FVÔG&gB†²“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢G'’°¢6WDÇB†v—BÇVFööÇ57FGW2‚’“°¢Ð¢6F6‚°¢6WDÇB†çVÆÂ“°¢Ð¢G'’°¢6öç7B&W2Òv—BvWD”Æ—7B‚“°¢6WD—2‡&W2ç7V66W72ò&W2æ—2¢µÒ“°¢Ð¢6F6‚°¢6WD—2…µÒ“°¢Ð¢òòÆ—fR‡V&6V÷FÂöæÇ’v†Vâ‡V&6ôÖ÷'&VçW2¶W’—26öæf–wW&VBà¢G'’°¢6öç7BbÒ†v—BvWD”¶W”f–VÆG2‚’“°¢6öç7B†2Òbç7V66W72bb†bæf–VÆG2ÇÂµÒ’ç6öÖR‚‡‚’Óâ‚çÆ6V†öÆFW"ÓÓÒ#ÆÖö–¶W“â"bb‚æ†4¶W’“°¢–b††2¢ÆöD‡V"‚“°¢VÇ6P¢6WD‡V"†çVÆÂ“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ó°¢6öç7BFõ&VFVVÒÒ7–æ2‚’Óâ°¢6öç7B6öFRÒÇD6öFRçG&–Ò‚“°¢–b‚6öFR¢&WGW&ã°¢6WDÇD'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—BÇVFööÇ5&VFVVÒ†6öFR“°¢–b‡"ç7V66W72’°¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢6–væVB–â2G·"çW6W#òææÖRÇÂ'–÷R'ÖÒ“°¢6WDÇD6öFR‚""“°¢6WDÇB†v—BÇVFööÇ57FGW2‚’“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢"æW'&÷"ÇÂ%&VFVVÒf–ÆVB"Ò“°¢Ð¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢7G&–ær†R’Ò“°¢Ð¢f–æÆÇ’°¢6WDÇD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7BFôöWF‚Ò7–æ2‚’Óâ°¢6WDÇD'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—BÇVFööÇ4öWF…7F'B‚“°¢–b‚"ç7V66W72ÇÂ"çW&Â’°¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢"æW'&÷"ÇÂ$6÷VÆBæ÷B7F'B6–vâÖ–â"Ò“°¢6WDÇD'W7’†fÇ6R“°¢&WGW&ã°¢Ð¢òò÷VâF—66÷&BôWF‚–â7FVÒw2–âÖ'&÷w6W"‡v÷&·2–âvÖRÖöFR’âF†P¢òò6öç6VçBfÆ÷r&VF—&V7G2&6²FòF†RÇVv–âw2Æö6Æ†÷7B6ÆÆ&6²à¢G'’°¢DdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"‡"çW&Â“°¢Ð¢6F6‚°¢DdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"‡"çW&Â“°¢Ð¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢%6–vâ–âv—F‚F—66÷&B–âF†R'&÷w6W"ÂF†Vâ&WGW&â†W&Râ"Ò“°¢òòöÆÂf÷"6ö×ÆWF–öâ‡WFòã2Ö–â’à¢ÆWBG&–W2Ò°¢6öç7BBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G&–W2³Ò°¢G'’°¢6öç7B2Òv—BÇVFööÇ4öWF…7FGW2‚“°¢–b‡2æFöæRÇÂG&–W2â#’°¢6ÆV$–çFW'fÂ‡B“°¢–b‚2æFöæR’°¢v—BÇVFööÇ4öWF„6æ6VÂ‚“°¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢%6–vâÖ–âF–ÖVB÷WB"Ò“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡°¢F—FÆS¢&ÇVçFööÇ2"À¢&öG“¢2æWF†VBò%6–væVB–â)É2"¢‡2æW'&÷"ÇÂ%6–vâÖ–âf–ÆVB"’À¢Ò“°¢Ð¢6WDÇB†v—BÇVFööÇ57FGW2‚’“°¢6WDÇD'W7’†fÇ6R“°¢Ð¢Ð¢6F6‚°¢ò¢¶VWöÆÆ–ær¢ð¢Ð¢ÒÂS“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢7G&–ær†R’Ò“°¢6WDÇD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7BFõ6–væ÷WBÒ7–æ2‚’Óâ°¢6WDÇD'W7’‡G'VR“°¢G'’°¢v—BÇVFööÇ56–væ÷WB‚“°¢6WDÇB†v—BÇVFööÇ57FGW2‚’“°¢Fö7FW"çFö7B‡²F—FÆS¢&ÇVçFööÇ2"Â&öG“¢%6–væVB÷WB"Ò“°¢Ð¢f–æÆÇ’°¢6WDÇD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7B6fU7FVÔ¶W’Ò7–æ2‚’Óâ°¢v—Bw56WE7FVÔ¶W’‡7FVÔG&gBçG&–Ò‚’“°¢6WE7FVÔ¶W•7FFR‡7FVÔG&gBçG&–Ò‚’“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%7FVÒvV"’¶W’6fVB"Ò“°¢Ó°¢6öç7B6fU'—WT¶W’Ò7–æ2‚’Óâ°¢v—B6WE'—WT¶W’‡'—WTG&gBçG&–Ò‚’“°¢6WE'—WT¶W•7FFR‡'—WTG&gBçG&–Ò‚’“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%'—WR’¶W’6fVB"Ò“°¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢ÆöB‚“°¢ÒÂµÒ“°¢6öç7B6fT¶W’Ò7–æ2‡Æ6V†öÆFW"’Óâ°¢v—B6WD”¶W”f÷"‡Æ6V†öÆFW"ÂG&gG5·Æ6V†öÆFW%Òóò""“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$’¶W’6fVB"Ò“°¢ÆöB‚“°¢Ó°¢6öç7Böå&Vg&W6„—2Ò7–æ2‚’Óâ°¢6öç7B&W2Òv—BfWF6„g&VT—2‚“°¢–b‡&W2ç7V66W72’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢ÆöFVBG·&W2æ6÷VçBóòÒÖæ–fW7B6÷W&6W6Ò“°¢ÆöB‚“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢&W2æW'&÷"ÇÂ$f–ÆVB"Ò“°¢Ð¢Ó°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%6÷W&6W2b¶W—2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂföçEvV–v‡C¢cÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢&ÇVçFööÇ266÷VçB"Ò’Ò’ÂÇCòæWF†VBò…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â6öÆ÷#¢"3†fCc“B"ÒÂ6†–ÆG&Vã¢²%ÇS#s26–væVB–â2"ÂÇBçW6W#òææÖRÇÂ'–÷R"ÂÇBç7W÷'FW"ò+rG¶ÇBç7W÷'FW'Ö¢"%ÒÒ’Ò’ÂÇCòæFV'Vrbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãRÂv÷&D'&V³¢&'&V²ÖÆÂ"ÒÂ6†–ÆG&Vã¢²&WFƒ¢"Â¥4ôâç7G&–æv–g’†ÇBæFV'Vr•ÒÒ’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢Fõ6–væ÷WBÂF—6&ÆVC¢ÇD'W7’Â6†–ÆG&Vã¢%6–vâ÷WB"Ò’Ò•ÒÒ’’¢…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢FôöWF‚ÂF—6&ÆVC¢ÇD'W7’Â6†–ÆG&Vã¢ÇD'W7’ò%v—F–ærf÷"F—66÷&N(
b"¢%6–vâ–âv—F‚F—66÷&B"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂFF–æs¢#'‚g‚"ÒÂ6†–ÆG&Vã¢$÷Vç2F—66÷&B–â7FVÒw2'&÷w6W"ÇS#B6–vâ–âæBWF†÷&—¦RÂF†Vâ&WGW&â†W&Râ6–væ–ær–âÆWG2F†RÇVv–âFBvÖW2æB–âf—†W2FòF†R&–v‡B'V–ÆBg&öÒÇVçFööÇ2â"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãSRÂFF–æs¢#'‚'‚"ÒÂ6†–ÆG&Vã¢$fÆÆ&6³¢7FR&÷B6öFRg&öÒF†RÇVçFööÇ2F—66÷&B&÷B–ç7FVBâ"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢$&÷B6öFR†÷F–öæÂ’"ÂfÇVS¢ÇD6öFRÂöä6†ævS¢†R’Óâ6WDÇD6öFR†RçF&vWBçfÇVR’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢Fõ&VFVVÒÂF—6&ÆVC¢ÇD'W7’ÇÂÇD6öFRçG&–Ò‚’Â6†–ÆG&Vã¢ÇD'W7’ò%&VFVVÖ–æ~(
b"¢%&VFVVÒ6öFR"Ò’Ò•ÒÒ’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãSRÂFF–æs¢#'‚g‚"ÒÂ6†–ÆG&Vã¢%–â6÷W&6R÷&FW#¢ÇVçFööÇ2‡6–væVB–â’ÇS#“"‡V&6¶W’ÇS#“"âôF÷væÆöG2óÆ–CâæÇVÇS#“"æöæRâ"Ò’Ò’Âf–VÆG2æÖ‚†b’Óâ…5ô¥5‚æ§7‡2‚&F—b"Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢G¶bæÆ&VÇÒ†÷F–öæÂ’G¶bæ†4¶W’ò")É2"¢"'ÖÂfÇVS¢G&gG5¶bçÆ6V†öÆFW%Òóò""Âöä6†ævS¢†R’Óâ6WDG&gG2‚†B’Óâ‡²ââæBÂ¶bçÆ6V†öÆFW%Ó¢RçF&vWBçfÇVRÒ’’Ò’Ò’ÂbçÆ6V†öÆFW"ÓÓÒ#ÆÖö–¶W“â"bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢‡V$6GW&–ærÂöä6Æ–6³¢7–æ2‚’Óâ°¢G'’°¢DdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"‚&‡GG3¢òö‡V&6Öæ–fW7Bæ6öÒö’Ö¶W—2÷7FG2"“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢6WD‡V$6GW&–ær‡G'VR“°¢Fö7FW"çFö7B‡²F—FÆS¢$‡V&6"Â&öG“¢%6–vâ–âv—F‚F—66÷&B(	B’vÆÂvVæW&FRæBw&"–÷W"¶W’WFöÖF–6ÆÇ’â"Ò“°¢G'’°¢6öç7B¶W’Òv—B6GW&T‡V&6¶W’ƒƒ“°¢–b†¶W’’°¢v—B6WD”¶W”f÷"‚#ÆÖö–¶W“â"Â¶W’“°¢Fö7FW"çFö7B‡²F—FÆS¢$‡V&6"Â&öG“¢$¶W’6GW&VBæB6fVB)É2"Ò“°¢ÆöB‚“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢$‡V&6"Â&öG“¢$F–FâwB6VR¶W’–âF–ÖRâvVæW&FR—BÂF†VâFv–â(	B÷"7FR—B&÷fRâ"Ò“°¢Ð¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢$‡V&6"Â&öG“¢6GW&RW'&÷#¢G¶WÖÒ“°¢Ð¢6WD‡V$6GW&–ær†fÇ6R“°¢ÒÂ6†–ÆG&Vã¢‡V$6GW&–ærò%v—F–ærf÷"¶Wž(
b‡6–vâ–âv—F‚F—66÷&B’"¢%6–vâ–âFò‡V&6b6GW&R¶W’"Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6fT¶W’†bçÆ6V†öÆFW"’ÂF—6&ÆVC¢†G&gG5¶bçÆ6V†öÆFW%Òóò""’ÓÓÒ†bçfÇVRóò""’Â6†–ÆG&Vã¢²%6fR"ÂbæÆ&VÅÒÒ’Ò’ÂbçÆ6V†öÆFW"ÓÓÒ#ÆÖö–¶W“â"bb…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$‡V&6WFFW2"ÂFW67&—F–öã¢‡V%WFFW3òæ¶W”f–Æ&ÆP¢ò$WFöÖF–6ÆÇ’6†V6·2–ç7FÆÆVB4Å2vÖW2gFW"&ö÷BæBWfW'’Gvò†÷W'2ÂF†VâV&Æ—6†W2æWvW"‡V&6Öæ–fW7G2F‡&÷Vv‚Öööââ–ææVBvÖW2&R6¶—VBâ ¢¢$FBæB6fR‡V&6¶W’FòVæ&ÆRWFöÖF–2Öæ–fW7BWFFW2â"Â6†V6¶VC¢‡V%WFFW3òæVæ&ÆVBÂF—6&ÆVC¢‡V%WFFW3òæ¶W”f–Æ&ÆRÂöä6†ævS¢7–æ2‡fÇVR’Óâ°¢6öç7B&Wf–÷W2Ò‡V%WFFW3òæVæ&ÆVC°¢6WD‡V%WFFW57FFR‚‡2’Óâ2ò²ââç2ÂVæ&ÆVC¢fÇVRÒ¢2“°¢G'’°¢6öç7B&W7VÇBÒv—B6WD‡V&6WFFW2‡fÇVR“°¢6WD‡V%WFFW57FFR‡&W7VÇB“°¢–b‚&W7VÇBç7V66W72’°¢Fö7FW"çFö7B‡²F—FÆS¢$‡V&6WFFW2"Â&öG“¢&W7VÇBæW'&÷"ÇÂ$6÷VÆBæ÷B6†ævR6WGF–ær"Ò“°¢6WD‡V%WFFW57FFR‚‡2’Óâ2ò²ââç2ÂVæ&ÆVC¢&Wf–÷W2Ò¢2“°¢Ð¢Ð¢6F6‚†R’°¢6WD‡V%WFFW57FFR‚‡2’Óâ2ò²ââç2ÂVæ&ÆVC¢&Wf–÷W2Ò¢2“°¢Fö7FW"çFö7B‡²F—FÆS¢$‡V&6WFFW2"Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢ÒÒ’Â‡V%WFFW3òæÆ7D6†V6²bb…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚'‚W‚"ÒÂ6†–ÆG&Vã¢²$Æ7B6†V6³¢"ÂæWrFFR†‡V%WFFW2æÆ7D6†V6²¢’çFôÆö6ÆU7G&–ær‚’Â"ÇS#r6†V6¶VB"Â‡V%WFFW2æ6†V6¶VBÇÂÂ"ÇS#rWFFVB"Â‡V%WFFW2çWFFVBÇÂÂ‡V%WFFW2æf–ÆVBò+rf–ÆVBG¶‡V%WFFW2æf–ÆVGÖ¢"%ÒÒ’•ÒÒ’’ÂbçÆ6V†öÆFW"ÓÓÒ#ÆÖö–¶W“â"bbbæ†4¶W’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²v–GFƒ¢#R"ÂföçE6—¦S¢Â÷6—G“¢ã’ÂFF–æs¢#'‚'‚g‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"Âv¢‚ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢$‡V&6V÷F"Ò’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²FW‡DFV6÷&F–öã¢'VæFW&Æ–æR"Â7W'6÷#¢'ö–çFW""Â÷6—G“¢ãrÒÂöä6Æ–6³¢ÆöD‡V"Â6†–ÆG&Vã¢‡V$'W7’ò'&Vg&W6†–æ~(
b"¢'&Vg&W6‚"Ò•ÒÒ’Â‡V"ò…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢BÒÂ6†–ÆG&Vã¢µ²'6–ævÆR"Â&'VæFÆR"Â'v÷&·6†÷%ÒæÖ‚†²’Óâ°¢6öç7BÒ‡V%¶µÓ°¢–b‚¢&WGW&âçVÆÃ°¢6öç7BW6VE7BÒæÆ–Ö—BâòÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂÖF‚ç&÷VæB‚‡çW6vRòæÆ–Ö—B’¢’’’¢°¢6öç7BÆ÷rÒæÆ–Ö—Bâbbç&VÖ–æ–ærÃÒÖF‚æÖ‚ƒÂÖF‚æ6V–Â‡æÆ–Ö—B¢ã’“°¢&WGW&â…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–ä&÷GFöÓ¢rÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"ÂÖ&v–ä&÷GFöÓ¢"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²FW‡EG&ç6f÷&Ó¢&6—FÆ—¦R"ÒÂ6†–ÆG&Vã¢²Ò’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢·ç&VÖ–æ–ærÂ"ò"ÂæÆ–Ö—BÂ"ÆVgBÇS#r"ÂW6VE7BÂ"RW6VB%ÒÒ•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²†V–v‡C¢RÂ&6¶w&÷VæC¢'&v&ƒ#SRÃ#SRÃ#SRÃãR’"Â&÷&FW%&F—W3¢2Â÷fW&fÆ÷s¢&†–FFVâ"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²†V–v‡C¢#R"Âv–GFƒ¢G·W6VE7GÒVÂ&6¶w&÷VæC¢Æ÷rò"6C““3R"¢"3F“C’"ÂG&ç6—F–öã¢'v–GF‚ã#W2"ÒÒ’Ò’ÂÆ÷rò5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢"Â÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢²$Æ÷rV÷FÇS#B"Âç&VÖ–æ–ærÂ"&WVW7B"Âç&VÖ–æ–ærÓÓÒò""¢'2"Â"&VÖ–æ–ærâ%ÒÒ’¢çVÆÅÒÒÂ²’“°¢Ò’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²÷6—G“¢ãcRÂÖ&v–åF÷¢"ÒÂ6†–ÆG&Vã¢²%7FVÒ6W'f–6S¢"Â‡V"ç7FVÕ÷6W'f–6U÷&VG’ò'&VG’)É2"¢&æ÷B&VG’%ÒÒ•ÒÒ’’¢…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—G“¢ãbÂÖ&v–åF÷¢"ÒÂ6†–ÆG&Vã¢‡V$'W7’ò$ÆöF–æ~(
b"¢%V÷FVæf–Æ&ÆR†6†V6²F†R¶W’’â"Ò’•ÒÒ’Ò’•ÒÒÂbçÆ6V†öÆFW"’’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢'—WR’¶W’†Öæ–fW7G2²vFVBf—†W2’G·'—WT¶W’ò")É2"¢"'ÖÂfÇVS¢'—WTG&gBÂöä6†ævS¢†R’Óâ6WE'—WTG&gB†RçF&vWBçfÇVR’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²v–GFƒ¢#R"ÂföçE6—¦S¢Â÷6—G“¢ãsRÂFF–æs¢#'‚'‚g‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"Âv¢‚ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢%'—WRV÷F"Ò’Â5ô¥5‚æ§7‚‚'7â"Â²6†–ÆG&Vã¢'—WT¶W’ò$’¶W’&VG’)É2"¢$’¶W’æ÷B6WB"Ò•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢2ÒÂ6†–ÆG&Vã¢$g&VR66÷VçG3¢SÖæ–fW7BF÷væÆöG2W"#B†÷W'2â"Ò’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢"Â÷6—G“¢ãcRÒÂ6†–ÆG&Vã¢%'—WRw2Fö7VÖVçFVB’FöW2æ÷BW‡÷6RÆ—fR&VÖ–æ–ærÖ6÷VçBVæGö–çBÂ6ò4Å4FV6²6†÷w2F†RV&Æ—6†VBÆ–Ö—B&F†W"F†âwVW76–ær–÷W"&Ææ6Râ"Ò•ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢$g&öÒvVæW&F÷"ç'—WRæÆöÂö’âF†R6ÖR‚ÔWF‚Ô¶W’—2W6VBf÷"'—WRÖæ–fW7BF÷væÆöG2æBvFVBf—†W2â"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢6fU'—WT¶W’ÂF—6&ÆVC¢'—WTG&gBçG&–Ò‚’ÓÓÒ‡'—WT¶W’óò""’Â6†–ÆG&Vã¢%6fR'—WR’¶W’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'—WT6GW&–ærÂöä6Æ–6³¢7–æ2‚’Óâ°¢G'’°¢DdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"‚&‡GG3¢òövVæW&F÷"ç'—WRæÆöÂö’"“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢6WE'—WT6GW&–ær‡G'VR“°¢Fö7FW"çFö7B‡²F—FÆS¢%'—WR"Â&öG“¢%6–vâ–âv—F‚F—66÷&B(	B’vÆÂw&"–÷W"’¶W’WFöÖF–6ÆÇ’â"Ò“°¢G'’°¢6öç7B¶W’Òv—B6GW&U'—WT¶W’ƒƒÂ‚’Óâ²Ò“°¢–b†¶W’’°¢v—B6WE'—WT¶W’†¶W’“°¢6WE'—WT¶W•7FFR†¶W’“°¢6WE'—WTG&gB†¶W’“°¢Fö7FW"çFö7B‡²F—FÆS¢%'—WR"Â&öG“¢$¶W’6GW&VBæB6fVB)É2"Ò“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%'—WR"Â&öG“¢$F–FâwB6VR¶W’–âF–ÖRâÆör–âöâF†RvRÂF†VâFv–â(	B÷"7FR—B&÷fRâ"Ò“°¢Ð¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%'—WR"Â&öG“¢6GW&RW'&÷#¢G¶WÖÒ“°¢Ð¢6WE'—WT6GW&–ær†fÇ6R“°¢ÒÂ6†–ÆG&Vã¢'—WT6GW&–ærò%v—F–ærf÷"¶Wž(
b‡6–vâ–âöâF†RvR’"¢$Æör–âFò'—WRb6GW&R¶W’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢7FVÒvV"’¶W’†f÷"v÷&·6†÷ÖöB6V&6‚’G·7FVÔ¶W’ò")É2"¢"'ÖÂfÇVS¢7FVÔG&gBÂöä6†ævS¢†R’Óâ6WE7FVÔG&gB†RçF&vWBçfÇVR’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢$÷F–öæÂâvWBg&VR¶W’B7FVÖ6öÖ×Væ—G’æ6öÒöFWbö–¶W’f÷"&–6†W"v÷&·6†÷6V&6‚‡F‡VÖ&æ–Ç2Â&æ¶–ær’âv—F†÷WB—BÂ6V&6‚7F–ÆÂv÷&·2f–F†RV&Æ–2'&÷w6RvRâ"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢6fU7FVÔ¶W’ÂF—6&ÆVC¢7FVÔG&gBçG&–Ò‚’ÓÓÒ‡7FVÔ¶W’óò""’Â6†–ÆG&Vã¢%6fR7FVÒvV"’¶W’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢7FVÔ6GW&–ærÂöä6Æ–6³¢7–æ2‚’Óâ°¢G'’°¢DdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"‚&‡GG3¢ò÷7FVÖ6öÖ×Væ—G’æ6öÒöFWbö–¶W’"“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢6WE7FVÔ6GW&–ær‡G'VR“°¢Fö7FW"çFö7B‡²F—FÆS¢%7FVÒ"Â&öG“¢$w&&&–ær–÷W"vV"’¶W’(	B&Vv—7FW"öæRöâF†RvR–b&ö×FVBâ"Ò“°¢G'’°¢6öç7B¶W’Òv—B6GW&U7FVÔ¶W’ƒ#Â‚’Óâ²Ò“°¢–b†¶W’’°¢v—Bw56WE7FVÔ¶W’†¶W’“°¢6WE7FVÔ¶W•7FFR†¶W’“°¢6WE7FVÔG&gB†¶W’“°¢Fö7FW"çFö7B‡²F—FÆS¢%7FVÒ"Â&öG“¢%vV"’¶W’6GW&VBæB6fVB)É2"Ò“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%7FVÒ"Â&öG“¢$æò¶W’f÷VæBâ&Vv—7FW"¶W’öâF†RvR†ç’FöÖ–â’ÂF†VâFv–ââ"Ò“°¢Ð¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%7FVÒ"Â&öG“¢6GW&RW'&÷#¢G¶WÖÒ“°¢Ð¢6WE7FVÔ6GW&–ær†fÇ6R“°¢ÒÂ6†–ÆG&Vã¢7FVÔ6GW&–ærò%v—F–ærf÷"¶Wž(
b"¢$÷Vâ7FVÒ¶W’vRb6GW&R"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢²%6÷W&6W3¢"Â—2æÆVæwF‚ò—2æÖ‚†’ÓâææÖR’æ¦ö–â‚"Â"’¢&æöæR%ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢öå&Vg&W6„—2Â6†–ÆG&Vã¢%&Vg&W6‚6÷W&6W2"Ò’Ò•ÒÒ’“°§Ð ¦gVæ7F–öâ6†—‡²ö²ÂÆ&VÂÒ’°¢&WGW&â…5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢°¢F—7Æ“¢&–æÆ–æRÖ&Æö6²"À¢FF–æs¢#‚‡‚"À¢Ö&v–å&–v‡C¢bÀ¢Ö&v–ä&÷GFöÓ¢BÀ¢&÷&FW%&F—W3¢À¢föçE6—¦S¢À¢&6¶w&÷VæC¢ö²ò'&v&ƒƒ‚Ã“rÃ#Ãã‚’"¢'&v&ƒ#CRÃcbÃ3RÃã‚’"À¢6öÆ÷#¢ö²ò"3S†3Ss‚"¢"6cVc#2"À¢ÒÂ6†–ÆG&Vã¢¶ö²ò.)É2"¢.(
""ÂÆ&VÅÒÒ’“°§Ð¦gVæ7F–öâÖ&¶VDvÖW2‡7B’°¢6öç7BrÒ7CòævÖW3°¢–b‚r¢&WGW&âµÓ°¢–b„'&’æ—4'&’†r’¢&WGW&âræf–ÇFW"‚‡‚’ÓâƒòæVæ&ÆVB’æÖ‚‡‚’Óâ7G&–ær‡‚æ–B’“°¢&WGW&âö&¦V7Bæ¶W—2†r’æf–ÇFW"‚†²’Óâu¶µÒ“°§Ð¢ò¢ ¢¢çF’ÔFVçWfò‡—W'f—6÷"„…bÔFV6·’÷'B“¢'V–ÆG2F†R7V–EöfVÇEöV×VÆF–öà¢¢¶W&æVÂÖöGVÆRv–ç7BF†R%Tää”är¶W&æVÂ†æF—fR6Öâ†VFW'2Â÷"öFÖà¢¢6öçF–æW"’ÂfW&–f–W2—Bv—F‚W6W'76R7V–B6VÆb×FW7BÂæB'Vç2¢¢VÖ—6ö×FBFVÖöâ6òTÔ•æVVBæ÷B&RF—6&ÆVB7—7FVÒ×v–FRâæVVG2&ö÷Bà¢¢ð¦gVæ7F–öâ‡—W'f—6÷%6V7F–öâ‚’°¢6öç7B·7BÂ6WE7EÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶WFöÆöBÂ6WDWFöÆöEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&÷FöâÂ6WE&÷FöåÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·&÷FöäFÂÂ6WE&÷FöäFÅÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶æF—fTæ÷FRÂ6WDæF—fTæ÷FUÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·6†÷tÆörÂ6WE6†÷tÆöuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶ÆörÂ6WDÆöuÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B&Vg&W6‚Ò7–æ2‚’Óâ°¢G'’°¢6WE7B†v—B‡e7FGW2‚’“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢G'’°¢6WDWFöÆöB‚†v—B‡dvWDWFöÆöB‚’’æVæ&ÆVB“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢G'’°¢6öç7BÒv—B‡e&÷Föå7FGW2‚“°¢6WE&÷Föâ‡²–ç7FÆÆVC¢æ–ç7FÆÆVBÂF&&ÆÅ&W6VçC¢çF&&ÆÅ&W6VçBÒ“°¢Ð¢6F6‚°¢6WE&÷Föâ†çVÆÂ“°¢Ð¢G'’°¢6öç7BâÒv—B‡dæF—fTæ÷F–6R‚“°¢6WDæF—fTæ÷FR†âç7V66W72ò²6†÷s¢†âç6†÷róòâææF—fR’ÂÖW76vS¢âæÖW76vRÇÂ""Ò¢çVÆÂ“°¢Ð¢6F6‚°¢6WDæF—fTæ÷FR†çVÆÂ“°¢Ð¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢&Vg&W6‚‚“°¢ÒÂµÒ“°¢òò'Vç2Æöær&6¶VæB7F–öâÂ6†÷w27–ææW"ÂF†Vâ&Vg&W6†W2²7W&f6W2F†P¢òò÷W&F–öâÆörF–Âà¢6öç7B'VâÒ7–æ2†¶W’ÂfâÂö´×6r’Óâ°¢6WD'W7’†¶W’“°¢G'’°¢6öç7B"Òv—Bfâ‚“°¢Fö7FW"çFö7B‡²F—FÆS¢$‡—W'f—6÷""Â&öG“¢"ç7V66W72ò‡"æÖW76vRÇÂö´×6r’¢‡"æW'&÷"ÇÂ$f–ÆVB"’Ò“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢$‡—W'f—6÷""Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢&Vg&W6‚‚“°¢Ð¢Ó°¢6öç7BFõFW7BÒ7–æ2‚’Óâ°¢6WD'W7’‚'FW7B"“°¢G'’°¢6öç7B"Òv—B‡eFW7B‚“°¢Fö7FW"çFö7B‡°¢F—FÆS¢$‡—W'f—6÷"6VÆb×FW7B"À¢&öG“¢"ç7V66W72ò‡"æÖW76vRÇÂ&7V–BfVÇF–ærv÷&·2)É2"’¢‡"æW'&÷"ÇÂ"æÖW76vRÇÂ%6VÆb×FW7Bf–ÆVB"’À¢Ò“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢$‡—W'f—6÷""Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢Ð¢Ó°¢6öç7BÆöDÆörÒ7–æ2‚’Óâ°¢6WE6†÷tÆör‚‡b’Óâb“°¢G'’°¢6öç7B"Òv—B‡dÆör‚“°¢6WDÆör‡"æÆörÇÂ"†V×G’’"“°¢Ð¢6F6‚°¢6WDÆör‚"†6÷VÆBæ÷B&VBÆör’"“°¢Ð¢Ó°¢6öç7BFô–ç7FÆÅ&÷FöâÒ7–æ2‚’Óâ°¢6WD'W7’‚'&÷Föâ"“°¢6WE&÷FöäFÂ‡²7FGW3¢'7F'F–ær"ÂW&6VçC¢Ò“°¢G'’°¢6öç7B"Òv—B‡d–ç7FÆÅ&÷Föâ‚“°¢–b‚"ç7V66W72bb"æW'&÷"’°¢Fö7FW"çFö7B‡²F—FÆS¢$‡—W'f—6÷""Â&öG“¢"æW'&÷"Ò“°¢6WE&÷FöäFÂ†çVÆÂ“°¢&WGW&ã°¢Ð¢v—BæWr&öÖ—6R‚‡&W6öÇfR’Óâ°¢6öç7BBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B2Ò†v—B‡e&÷Föä–ç7FÆÅ7FGW2‚’’ç7FFS°¢6WE&÷FöäFÂ‡²7FGW3¢2ç7FGW2ÂW&6VçC¢2çW&6VçBÇÂÒ“°¢–b…²&FöæR"Â&f–ÆVB"Â&æVVG56÷W&6R%Òæ–æ6ÇVFW2‡2ç7FGW2’’°¢6ÆV$–çFW'fÂ‡B“°¢Fö7FW"çFö7B‡°¢F—FÆS¢$‡—W'f—6÷""À¢&öG“¢2ç7FGW2ÓÓÒ&FöæR"ò$FVçWfò&÷Föâ–ç7FÆÆVB"¢‡2æW'&÷"ÇÂ$–ç7FÆÂf–ÆVB"’À¢Ò“°¢6WE&÷FöäFÂ†çVÆÂ“°¢&W6öÇfR‚“°¢Ð¢Ð¢6F6‚°¢ò¢¶VWöÆÆ–ær¢ð¢Ð¢ÒÂ“°¢Ò“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢$‡—W'f—6÷""Â&öG“¢W'&÷#¢G¶WÖÒ“°¢6WE&÷FöäFÂ†çVÆÂ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢&Vg&W6‚‚“°¢Ð¢Ó°¢6öç7BöäWFöÆöBÒ7–æ2‡b’Óâ°¢6WDWFöÆöB‡b“°¢G'’°¢v—B‡e6WDWFöÆöB‡b“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ó°¢6öç7BöåvF6†W"Ò7–æ2‡b’Óâ°¢G'’°¢v—B‡e6WEvF6†W$ÖöFR‡bò'7FVÕöÆör"¢&ÖçVÂ"“°¢&Vg&W6‚‚“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ó°¢6öç7BVæÖ&²Ò7–æ2†–B’Óâ°¢G'’°¢v—B‡e6WDvÖR„çVÖ&W"†–B’ÂfÇ6R“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢&Vg&W6‚‚“°¢Ó°¢6öç7BÖöGVÆW2Ò7CòæÖöGVÆW2ÇÂµÓ°¢6öç7BÆöFVBÒÖöGVÆW2ç6öÖR‚†Ò’ÓâÒæÆöFVB“°¢6öç7B'V–ÇBÒÖöGVÆW2ç6öÖR‚†Ò’ÓâÒæ¶W&æVÅö6ö×F–&ÆR“°¢6öç7BöFÖâÒ7CòçöFÖå÷Fƒ°¢6öç7Bv÷&¶–ærÒ'W7’ÓÒ"#°¢6öç7BvÖW2ÒÖ&¶VDvÖW2‡7B“°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$…bÖöGVÆR"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„6†—Â²ö³¢ÆöFVBÂÆ&VÃ¢ÆöFVBò$7F—fR"¢$–æ7F—fR"Ò’Â5ô¥5‚æ§7‚„6†—Â²ö³¢'V–ÇBÂÆ&VÃ¢$ÖöGVÆR'V–ÇB"Ò’Â5ô¥5‚æ§7‚„6†—Â²ö³¢7Còæ†VFW'5÷&VG’ÂÆ&VÃ¢$†VFW'2"Ò’Â5ô¥5‚æ§7‚„6†—Â²ö³¢7Còç&ö÷BÂÆ&VÃ¢%&ö÷B"Ò’Â5ô¥5‚æ§7‚„6†—Â²ö³¢7CòçVÖ—öF—6&ÆVBÂÆ&VÃ¢%TÔ•öfb"Ò’Â5ô¥5‚æ§7‚„6†—Â²ö³¢&÷Föãòæ–ç7FÆÆVBÂÆ&VÃ¢%&÷Föâ"Ò•ÒÒ’Ò’Â7Bbb7Bæ—5÷7FVÖ÷2ÓÓÒfÇ6Rbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"6cVc#2"ÂFF–æs¢#'‚'‚"ÒÂ6†–ÆG&Vã¢%ÇS#dæöâÕ7FVÔõ2FWFV7FVBâF†R¶W&æVÂÖÖöGVÆR'V–ÆBF&vWG27FVÔõ2††öÆò&WòòÆ–çW‚ÖæWGVæR†VFW'2“²öâæ÷F†W"F—7G&òF†R'V–ÆBÖ’f–Â÷"æVVB—G2÷vâ¶W&æVÂ†VFW'2â&ö6VVBB–÷W"÷vâ&—6²â"Ò’Ò’’ÂæF—fTæ÷FSòç6†÷rbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"3S†3Ss‚"ÂFF–æs¢#'‚'‚"ÒÂ6†–ÆG&Vã¢²%ÇS#s2"ÂæF—fTæ÷FRæÖW76vRÇÂ%F†—2¶W&æVÂ7W÷'G27V–BfVÇF–æræF—fVÇ’(	BF†RÖöGVÆRÖ’æ÷B&RæVVFVBâ"Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²Ö&v–äÆVgC¢‚ÂFW‡DFV6÷&F–öã¢'VæFW&Æ–æR"Â7W'6÷#¢'ö–çFW""Â÷6—G“¢ã‚ÒÂöä6Æ–6³¢7–æ2‚’Óâ²v—B‡dF—6Ö—74æF—fR‚“²6WDæF—fTæ÷FR†çVÆÂ“²ÒÂ6†–ÆG&Vã¢&F—6Ö—72"Ò•ÒÒ’Ò’’Â7Còç&ö÷Bbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢$&6¶VæB—2æ÷B'Vææ–ær2&ö÷BÇS#B&V–ç7FÆÂF†RÇVv–â6òF†R&ö÷BfÆrF¶W2VffV7Bâ"Ò’Ò’’Âv÷&¶–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãƒRÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢BÂ†V–v‡C¢BÂÖ&v–å&–v‡C¢‚ÒÒ’Â'W7’ÓÓÒ&FW2"ò$–ç7FÆÆ–ær¶W&æVÂ†VFW'>(
b ¢¢'W7’ÓÓÒ&'V–ÆB"ò$'V–ÆF–ærÖöGVÆR‡F†—26âF¶RfWrÖ–çWFW2ž(
b ¢¢'W7’ÓÓÒ&6öçF–æW""ò$'V–ÆF–ærÖöGVÆR–â6öçF–æW.(
b ¢¢%v÷&¶–æ~(
b%ÒÒ’Ò’’Âv÷&¶–ærbb'V–ÇBbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚&F÷væÆöB"Â‡dF÷væÆöBÂ%&V'V–ÇBÖöGVÆRF÷væÆöFVB"’Â6†–ÆG&Vã¢$F÷væÆöB&V'V–ÇBÖöGVÆR‡&V6öÖÖVæFVB’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢²$fWF6†W2F†R&V'V–ÇB7V–EöfVÇEöV×VÆF–öâæ¶òf÷"–÷W"¶W&æVÂ‚"Â7Còæ¶W&æVÅ÷&VÆV6RÇÂ#ò"Â"’ÇS#Bæò6ö×–ÆW"Â†VFW'2÷"6÷W&6RæVVFVBâW6RF†—2f—'7C²öæÇ’'V–ÆB&VÆ÷r–bæò&V'V–ÇBÖF6†W2–÷W"¶W&æVÂâ%ÒÒ’Ò’Â7Còæ†VFW'5÷&VG’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚&FW2"Â‡d–ç7FÆÄFW2Â$¶W&æVÂ†VFW'2–ç7FÆÆVB"’Â6†–ÆG&Vã¢$–ç7FÆÂ¶W&æVÂ†VFW'2†f÷"'V–ÆF–ær’"Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚&'V–ÆB"Â‡d'V–ÆBÂ$ÖöGVÆR'V–ÇB"’Â6†–ÆG&Vã¢$'V–ÆBÖöGVÆR†æF—fR’"Ò’Ò’ÂöFÖâbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚&6öçF–æW""Â‡d'V–ÆD6öçF–æW"Â$ÖöGVÆR'V–ÇB†6öçF–æW"’"’Â6†–ÆG&Vã¢$'V–ÆBÖöGVÆR–â6öçF–æW"‡öFÖâ’"Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢²$'V–ÆF–ær6ö×–ÆW2F†RÖöGVÆRf÷"–÷W"¶W&æVÂ‚"Â7Còæ¶W&æVÅ÷&VÆV6RÇÂ#ò"Â"’W6–ær"Â""Â7Còæ6ö×–ÆW%öæÖRÇÂ'F†R¶W&æVÂ6ö×–ÆW""Â"ÇS#BæVVG2†VFW'2²6÷W&6Râ&V'V–ÆBgFW"7FVÔõ2¶W&æVÂWFFRâ%ÒÒ’Ò•ÒÒ’’Âv÷&¶–ærbb'V–ÇBbbÆöFVBbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚&ÆöB"Â‡dÆöDWFòÂ$‡—W'f—6÷"Væ&ÆVB"’Â6†–ÆG&Vã¢$Væ&ÆR‡—W'f—6÷""Ò’Ò’’Âv÷&¶–ærbb'V–ÇBbbÆöFVBbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚'VæÆöB"Â‡eVæÆöDWFòÂ$‡—W'f—6÷"F—6&ÆVB"’Â6†–ÆG&Vã¢$F—6&ÆR‡—W'f—6÷""Ò’Ò’’Âv÷&¶–ærbb'V–ÇBbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢FõFW7BÂF—6&ÆVC¢v÷&¶–ærÂ6†–ÆG&Vã¢%FW7B7V–BfVÇF–ær‡6VÆb×FW7B’"Ò’Ò’’Âv÷&¶–ærbb'V–ÇBbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚&'V–ÆB"Â‡d'V–ÆBÂ$ÖöGVÆR&V'V–ÇB"’Â6†–ÆG&Vã¢%&V'V–ÆBf÷"F†—2¶W&æVÂ"Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂföçEvV–v‡C¢cÂÖ&v–åF÷¢bÒÂ6†–ÆG&Vã¢%TÔ•6ö×F–&–Æ—G’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢7CòçVÖ—öF—6&ÆV@¢ò%TÔ•—2F—6&ÆVBBF†R¶W&æVÂÆWfVÂ(	BF†RFVÖöâ—6âwBæVVFVB†W&Râ ¢¢7CòçVÖ—6ö×E÷'Vææ–æp¢ò$†æFÆVBWFöÖF–6ÆÇ’)É2(	BF†RVÖ—6ö×FBFVÖöâ'Vç2v†–ÆRF†R‡—W'f—6÷"—2Væ&ÆVB†æò&V&ö÷B’â ¢¢7CòçVÖ—6ö×Eöf–ÆV@¢ò.)ªF†RWFöÖF–2TÔ•FVÖöâf–ÆVBFò7F'B(	BW6RF†R¶W&æVÂfÆÆ&6²&VÆ÷râ ¢¢$†æFÆVBWFöÖF–6ÆÇ’'’F†RVÖ—6ö×FBFVÖöâv†VâF†R‡—W'f—6÷"—2Væ&ÆVB†æò&V&ö÷B’â"Ò’Ò’Â7CòçVÖ—öF—6&ÆVBbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚'VÖ—&W7F÷&R"Â‡e&W7F÷&UVÖ—Â%TÔ•&W7F÷&R7FvVB(	B&V&ö÷BFòÇ’"’ÂF—6&ÆVC¢v÷&¶–ærÂ6†–ÆG&Vã¢%&W7F÷&RTÔ•‡&V&ö÷B’ÇS#B7v—F6‚FòF†RWFöÖF–2FVÖöâ"Ò’Ò’’Â7CòçVÖ—öF—6&ÆVBbb7CòçVÖ—6ö×E÷'Vææ–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚'VÖ—7F'B"Â‡eVÖ—7F'BÂ%TÔ•FVÖöâ7F'FVB"’ÂF—6&ÆVC¢v÷&¶–ærÂ6†–ÆG&Vã¢%7F'BTÔ•FVÖöâÖçVÆÇ’"Ò’Ò’’Â7CòçVÖ—öF—6&ÆVBbb7CòçVÖ—6ö×E÷'Vææ–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚'VÖ—7F÷"Â‡eVÖ—7F÷Â%TÔ•FVÖöâ7F÷VB"’ÂF—6&ÆVC¢v÷&¶–ærÂ6†–ÆG&Vã¢%7F÷TÔ•FVÖöâ"Ò’Ò’’Â7CòçVÖ—öF—6&ÆVBbb7CòçVÖ—6ö×Eöf–ÆVBbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢$fÆÆ&6³¢–bF†RFVÖöâvöâwB'VâÂF—6&ÆRTÔ•BF†R¶W&æVÂÆWfVÂ‡W&ÖæVçBÂæVVG2&V&ö÷B’â"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚'VÖ—"Â‡dF—6&ÆUVÖ—Â%TÔ•F—6&ÆVB"’ÂF—6&ÆVC¢v÷&¶–ærÂ6†–ÆG&Vã¢$F—6&ÆRTÔ•b&V&ö÷B‡W&ÖæVçB’"Ò’Ò•ÒÒ’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFòÖÖævRW"vÖR"ÂFW67&—F–öã¢%vF6‚7FVÒw2vÖRÆöræBÆöBF†RÖöGVÆRv†–ÆRfÆvvVBFVçWfòvÖR'Vç2ÂF†VâVæÆöB—BâöfbÒÖçVÂöæÇ’â"Â6†V6¶VC¢‡7CòævÖU÷vF6†W%öÖöFRÇÂ&ÖçVÂ"’ÓÓÒ'7FVÕöÆör"Âöä6†ævS¢öåvF6†W"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%7F'BvF6†W"B&ö÷B"ÂFW67&—F–öã¢%7F'BF†RW"ÖvÖR…bvF6†W"v†VâF†RÇVv–âÆöG2â"Â6†V6¶VC¢WFöÆöBÂöä6†ævS¢öäWFöÆöBÒ’Ò’Â&÷Föâbb&÷Föâæ–ç7FÆÆVBbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢Fô–ç7FÆÅ&÷FöâÂF—6&ÆVC¢v÷&¶–ærÇÂ&÷FöäFÂÂ6†–ÆG&Vã¢&÷FöäFÂò%v÷&¶–æ~(
b"¢&÷FöâçF&&ÆÅ&W6VçBò$–ç7FÆÂFVçWfò&÷Föâ"¢$F÷væÆöBb–ç7FÆÂFVçWfò&÷Föâ‡ãSRÔ"’"Ò’Ò’Â&÷FöäFÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÂföçE6—¦S¢"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢bÂ†V–v‡C¢bÒÒ’Â5ô¥5‚æ§7‚‚'7â"Â²6†–ÆG&Vã¢&÷FöäFÂç7FGW2ÓÓÒ&F÷væÆöF–ær"òF÷væÆöF–æ~(
bG·&÷FöäFÂçW&6VçGÒV ¢¢&÷FöäFÂç7FGW2ÓÓÒ&W‡G&7F–ær"ò$W‡G&7F–æ~(
b"¢&÷FöäFÂç7FGW2Ò•ÒÒ’Ò’•ÒÒ’’ÂvÖW2æÆVæwF‚âbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂföçEvV–v‡C¢cÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢$Ö&¶VBvÖW2"Ò’Ò’ÂvÖW2æÖ‚†–B’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’ÓâVæÖ&²†–B’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÂFW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢F—7Æ”æÖR„çVÖ&W"†–B’’ÇÂ”BG¶–GÖÒ’Â5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢'FFòVæÖ&²"Ò•ÒÒ’Ò’ÒÂ–B’’•ÒÒ’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'Vâ‚'&V&ö÷B"Â‡e&V&ö÷BÂ%&V&ö÷F–æ~(
b"’ÂF—6&ÆVC¢v÷&¶–ærÂ6†–ÆG&Vã¢%&V&ö÷BFV6²æ÷r"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢ÆöDÆörÂ6†–ÆG&Vã¢6†÷tÆörò$†–FR'V–ÆBÆör)kâ"¢%6†÷r'V–ÆBÆör)k‚"Ò’Ò’Â6†÷tÆörbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚…67&öÆÆ&ÆU&W7VÇBÂ²FW‡C¢ÆörÂÖ„†V–v‡C¢#CÂÖöæó¢G'VRÂföçE6—¦S¢Ò’Ò’’Â7Còæ¶W&æVÅ÷&VÆV6Rbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãRÒÂ6†–ÆG&Vã¢²&¶W&æVÂ"Â7Bæ¶W&æVÅ÷&VÆV6RÂ7Còæ6ö×–ÆW%öæÖRò+rG·7Bæ6ö×–ÆW%öæÖWÖ¢"%ÒÒ’Ò’•ÒÒ’“°§Ð ¦gVæ7F–öâf×E6—¦RC†'—FW2’°¢–b‚'—FW2¢&WGW&â#"#°¢6öç7BRÒ²$""Â$´""Â$Ô""Â$t"%Ó°¢ÆWBâÒ'—FW3°¢ÆWB’Ò°¢v†–ÆR†âãÒ#Bbb’ÂRæÆVæwF‚Ò’°¢âóÒ#C°¢’²³°¢Ð¢&WGW&âG¶âçFôf—†VB†âãÒÇÂ’ÓÓÒò¢—ÒG·U¶•×Ö°§Ð¦gVæ7F–öâvÖTÆ&VÂ†–B’°¢6öç7BæÖRÒF—7Æ”æÖR†–B“°¢&WGW&âæÖRòG¶æÖWÒ‚G¶–GÒ–¢G¶–GÖ°§Ð¢ò¢ ¢¢7FVÒv÷&·6†÷ÖöG3¢7FRÖöB÷"6öÆÆV7F–öâ”BõU$ÂÂ&W6öÇfRF†R÷væ–æp¢¢vÖRÂæB†–bF†BvÖR—2–ç7FÆÆVB’F÷væÆöBf–7FVÔ4ÔB7G&–v‡B–çFòF†P¢¢vÖRw2÷vâv÷&·6†÷6öçFVçBF—"â&VÆ÷rÂÖævRv†Bw2Ç&VG’–ç7FÆÆV@¢¢W"ÖvÖS¢Væ&ÆRöF—6&ÆR‚æF—6&ÆVB&VæÖR’÷"&VÖ÷fRà¢¢ð¦gVæ7F–öâÖöG56V7F–öâ‚’°¢6öç7B¶–çWBÂ6WD–çWEÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·&W6öÇfVBÂ6WE&W6öÇfVEÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B·&W6öÇf–ærÂ6WE&W6öÇf–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&öw&W72Â6WE&öw&W75ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7BöÆÅ&VbÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B·&W7VÇG2Â6WE&W7VÇG5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·6V&6†–ærÂ6WE6V&6†–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·6V&6„æ÷FRÂ6WE6V&6„æ÷FUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7BFV%&VbÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B¶vÖW2Â6WDvÖW5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶÷VävÖRÂ6WD÷VävÖUÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶ÖöG2Â6WDÖöG5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7BÆöDvÖW2Ò7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—Bw4Æ—7DvÖW2‚“°¢–b‡"ç7V66W72¢6WDvÖW2‡"ævÖW2ÇÂµÒ“°¢Ð¢6F6‚²Ð¢Ó°¢6öç7B¶‡V$'W7’Â6WD‡V$'W7•ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7BvWEw4Öæ–fW7BÒ7–æ2†–B’Óâ°¢6WD‡V$'W7’†–B“°¢G'’°¢6öç7B"Òv—B‡V&6v÷&·6†÷Öæ–fW7B†–B“°¢Fö7FW"çFö7B‡°¢F—FÆS¢%v÷&·6†÷Öæ–fW7B"À¢&öG“¢"ç7V66W70¢òfWF6†VBbV&Æ—6†VB‚G´ÖF‚ç&÷VæB‚‡"æ'—FW2ÇÂ’ò#B—Ò´"’â&W7F'B7FVÒFòW6R—Bæ ¢¢"æW'&÷"ÇÂ$f–ÆVB†æVVG2‡V&6¶W’v—F‚v÷&·6†÷V÷F’â"À¢Ò“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%v÷&·6†÷Öæ–fW7B"Â&öG“¢7G&–ær†R’Ò“°¢Ð¢f–æÆÇ’°¢6WD‡V$'W7’†çVÆÂ“°¢Ð¢Ó°¢6öç7BÆöö·4Æ–¶T–BÒ‡B’Óâòƒó¥³òeÖ–CÕÆB²—ÅåÇ2¥ÆG³bÇÕÇ2¢BòçFW7B‡BçG&–Ò‚’“°¢6öç7B'Vå6V&6‚Ò7–æ2‡’Óâ°¢6WE6V&6†–ær‡G'VR“°¢6WE&W6öÇfVB†çVÆÂ“°¢G'’°¢6öç7B"Òv—Bw56V&6‚‡ÂC“°¢–b‡"ç7V66W72’°¢6WE&W7VÇG2‡"ç&W7VÇG2ÇÂµÒ“°¢6WE6V&6„æ÷FR‡"ææ÷FRÓÓÒ&æõö–ç7FÆÆVEövÖW2 ¢ò$æò4Å2ÖFFVBvÖW2&R–ç7FÆÆVB–WB(	BFBæB–ç7FÆÂvÖRf—'7Bâ ¢¢‡"ç&W7VÇG2ÇÂµÒ’æÆVæwF‚ÓÓÒ ¢ò$æòÖF6†–ærv÷&·6†÷—FV×2–â–÷W"–ç7FÆÆVBvÖW2â ¢¢""“°¢Ð¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢f–æÆÇ’°¢6WE6V&6†–ær†fÇ6R“°¢Ð¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢ÆöDvÖW2‚“°¢'Vå6V&6‚‚""“²òò–æ—F–Â'&÷w6S¢÷VÆ"ÖöG27&÷72–÷W"–ç7FÆÆVB4Å2vÖW0¢&WGW&â‚’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢–b†FV%&Vbæ7W'&VçB¢6ÆV%F–ÖV÷WB†FV%&Vbæ7W'&VçB“°¢Ó°¢ÒÂµÒ“°¢6öç7Böä–çWBÒ‡b’Óâ°¢6WD–çWB‡b“°¢–b†FV%&Vbæ7W'&VçB¢6ÆV%F–ÖV÷WB†FV%&Vbæ7W'&VçB“°¢6öç7BÒbçG&–Ò‚“°¢–b†Æöö·4Æ–¶T–B‡’’°¢6WE&W7VÇG2…µÒ“°¢FV%&Vbæ7W'&VçBÒ6WEF–ÖV÷WB‚‚’ÓâFõ&W6öÇfR‡’ÂC“°¢Ð¢VÇ6R°¢FV%&Vbæ7W'&VçBÒ6WEF–ÖV÷WB‚‚’Óâ'Vå6V&6‚‡’ÂS“°¢Ð¢Ó°¢6öç7BFõ&W6öÇfRÒ7–æ2‡FW‡B’Óâ°¢6öç7BÒ‡FW‡Bóò–çWB’çG&–Ò‚“°¢–b‚¢&WGW&ã°¢6WE&W6öÇf–ær‡G'VR“°¢6WE&W6öÇfVB†çVÆÂ“°¢G'’°¢6öç7B"Òv—Bw5&W6öÇfR‡“°¢6WE&W6öÇfVB‡"“°¢–b‚"ç7V66W72¢Fö7FW"çFö7B‡²F—FÆS¢%v÷&·6†÷"Â&öG“¢"æW'&÷"ÇÂ$6÷VÆBæ÷B&W6öÇfR"Ò“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%v÷&·6†÷"Â&öG“¢7G&–ær†R’Ò“°¢Ð¢f–æÆÇ’°¢6WE&W6öÇf–ær†fÇ6R“°¢Ð¢Ó°¢6öç7BöÆÅ&öw&W72Ò†¦ö$–B’Óâ°¢–b‡öÆÅ&Vbæ7W'&VçB¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢öÆÅ&Vbæ7W'&VçBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—Bw4F÷væÆöE7FFR†¦ö$–B“°¢6öç7B2Ò"ç7FFRÇÂ·Ó°¢6WE&öw&W72‡°¢FöæS¢2æFöæRÇÂÀ¢F÷FÃ¢2çF÷FÂÇÂÀ¢7FGW3¢2ç7FGW2ÇÂ""À¢7W'&VçC¢2æ7W'&VçBÀ¢Ò“°¢–b‡2ç7FGW2ÓÓÒ&FöæR"ÇÂ2ç7FGW2ÓÓÒ&f–ÆVB"’°¢6ÆV$–çFW'fÂ‡öÆÅ&Vbæ7W'&VçB“°¢öÆÅ&Vbæ7W'&VçBÒçVÆÃ°¢6öç7Bf–ÆVBÒ‡2æf–ÆVBÇÂµÒ’æÆVæwFƒ°¢Fö7FW"çFö7B‡°¢F—FÆS¢%v÷&·6†÷"À¢&öG“¢2ç7FGW2ÓÓÒ&FöæR ¢ò–ç7FÆÆVBG·2æFöæWÒòG·2çF÷FÇÒ—FVÒ‡2– ¢¢f–æ—6†VBv—F‚G¶f–ÆVGÒf–ÇW&R‡2–À¢Ò“°¢ÆöDvÖW2‚“°¢Ð¢Ð¢6F6‚²Ð¢ÒÂS“°¢Ó°¢6öç7BFôF÷væÆöBÒ‚’Óâ'VäF÷væÆöB†–çWBçG&–Ò‚’“°¢6öç7B'VäF÷væÆöBÒ7–æ2‡’Óâ°¢–b‚¢&WGW&ã°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—Bw4F÷væÆöB‡“°¢–b‚"ç7V66W72’°¢–b‡"æW'&÷"ÓÓÒ&÷væVEövÖR"’°¢Fö7FW"çFö7B‡°¢F—FÆS¢%v÷&·6†÷"À¢&öG“¢G·"çF—FÆRÇÂvÖTÆ&VÂ‡"æ–BÇÂ—Ò—2vÖR–÷R÷vâ(	BÖöG2öæÇ’–ç7FÆÂf÷"4Å4FV6²ÖFFVB÷"æöâÕ7FVÒvÖW2æÀ¢Ò“°¢Ð¢VÇ6R–b‡"æW'&÷"ÓÓÒ&æ÷Eö–ç7FÆÆVB"’°¢Fö7FW"çFö7B‡°¢F—FÆS¢%v÷&·6†÷"À¢&öG“¢–ç7FÆÂG·"çF—FÆRÇÂvÖTÆ&VÂ‡"æ–BÇÂ—Òf—'7B(	BÖöG2–ç7FÆÂ–çFòF†RvÖRw2föÆFW"æÀ¢Ò“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%v÷&·6†÷"Â&öG“¢"æW'&÷"ÇÂ$F÷væÆöBf–ÆVB"Ò“°¢Ð¢&WGW&ã°¢Ð¢6WE&öw&W72‡²FöæS¢ÂF÷FÃ¢"æ6÷VçBÇÂÂ7FGW3¢'VWVVB"Ò“°¢–b‡"æ¦ö"¢öÆÅ&öw&W72‡"æ¦ö"“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%v÷&·6†÷"Â&öG“¢7G&–ær†R’Ò“°¢Ð¢f–æÆÇ’°¢6WD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7B÷VäÖævRÒ7–æ2†–B’Óâ°¢–b†÷VävÖRÓÓÒ–B’°¢6WD÷VävÖR†çVÆÂ“°¢6WDÖöG2…µÒ“°¢&WGW&ã°¢Ð¢6WD÷VävÖR†–B“°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—Bw4Æ—7DÖöG2†–B“°¢–b‡"ç7V66W72¢6WDÖöG2‡"æÖöG2ÇÂµÒ“°¢Ð¢f–æÆÇ’°¢6WD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7BFövvÆTÖöBÒ7–æ2†–BÂÖöB’Óâ°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—Bw56WDVæ&ÆVB†–BÂÖöBæÖöF–BÂÖöBæVæ&ÆVB“°¢–b‡"ç7V66W72’°¢6WDÖöG2‚‡&Wb’Óâ&WbæÖ‚†Ò’Óâ†ÒæÖöF–BÓÓÒÖöBæÖöF–Bò²ââæÒÂVæ&ÆVC¢ÖöBæVæ&ÆVBÒ¢Ò’’“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%v÷&·6†÷"Â&öG“¢"æW'&÷"ÇÂ$f–ÆVB"Ò“°¢Ð¢Ð¢f–æÆÇ’°¢6WD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7BFVÆWFTÖöBÒ7–æ2†–BÂÖöB’Óâ°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—Bw5&VÖ÷fR†–BÂÖöBæÖöF–B“°¢–b‡"ç7V66W72’°¢6WDÖöG2‚‡&Wb’Óâ&Wbæf–ÇFW"‚†Ò’ÓâÒæÖöF–BÓÒÖöBæÖöF–B’“°¢ÆöDvÖW2‚“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%v÷&·6†÷"Â&öG“¢"æW'&÷"ÇÂ$f–ÆVB"Ò“°¢Ð¢Ð¢f–æÆÇ’°¢6WD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7BFÂÒ&öw&W73°¢&WGW&â…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$f–æBv÷&·6†÷ÖöB"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢%6V&6‚–÷W"vÖW2rv÷&·6†÷Â÷"7FRÖöBö6öÆÆV7F–öâ”BõU$Â"ÂfÇVS¢–çWBÂöä6†ævS¢†R’Óâöä–çWB†RçF&vWBçfÇVR’ÂF—6&ÆVC¢'W7’Ò’Ò’Ò’Â6V&6†–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÂFF–æs¢#G‚"ÂföçE6—¦S¢"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢bÂ†V–v‡C¢bÒÒ’Â"6V&6†–ærv÷&·6†÷ÇS##b%ÒÒ’Ò’’Â6V&6„æ÷FRbb6V&6†–ærbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢6V&6„æ÷FRÒ’Ò’’Â6V&6†–ærb`¢&W7VÇG2æÖ‚†—B’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ'VäF÷væÆöB†—BæÖöF–B’ÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÂFW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢—BçF—FÆRÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢¶—BævÖTæÖRÇÂG¶—Bæ–GÖÂ—Bç7V'2ò+rG¶—Bç7V'2çFôÆö6ÆU7G&–ær‚—Ò7V'6¢"%ÒÒ•ÒÒ’Ò’ÒÂ—BæÖöF–B’’’ÂÆöö·4Æ–¶T–B†–çWB’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’ÓâFõ&W6öÇfR‚’ÂF—6&ÆVC¢&W6öÇf–ærÇÂ'W7’ÇÂ–çWBçG&–Ò‚’Â6†–ÆG&Vã¢&W6öÇf–ærò%&W6öÇf–æ~(
b"¢$Æöö²W7FVB”B"Ò’Ò’’Â&W6öÇfVCòç7V66W72bb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢2ÂFF–æs¢#'‚"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçEvV–v‡C¢cÒÂ6†–ÆG&Vã¢·&W6öÇfVBçF—FÆRÂ&W6öÇfVBæ—46öÆÆV7F–öâò+r6öÆÆV7F–öâ‚G·&W6öÇfVBæ6†–ÆG&VãòæÆVæwF‚ÇÂÒ—FV×2–¢"%ÒÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢²$vÖS¢"ÂvÖTÆ&VÂ‡&W6öÇfVBæ–BÇÂ•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²6öÆ÷#¢&W6öÇfVBæÆÆ÷vVBò"3S†3Ss‚"¢"6cVc#2"ÒÂ6†–ÆG&Vã¢&W6öÇfVBæÆÆ÷vV@¢ò.)É24Å4FV6²ÖFFVBòæöâÕ7FVÒvÖR ¢¢.(
"÷væVB7FVÒvÖR(	Bæ÷BVÆ–v–&ÆR…4Å4FV6²ÖFFVB÷"æöâÕ7FVÒöæÇ’’"Ò’Â&W6öÇfVBæÆÆ÷vVBbb…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²6öÆ÷#¢&W6öÇfVBæ–ç7FÆÆVBò"3S†3Ss‚"¢"6cVc#2"ÒÂ6†–ÆG&Vã¢&W6öÇfVBæ–ç7FÆÆVBò.)É2vÖR—2–ç7FÆÆVB"¢.(
"vÖRæ÷B–ç7FÆÆVB(	B–ç7FÆÂ—Bf—'7B"Ò’•ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢FôF÷væÆöBÂF—6&ÆVC¢'W7’ÇÂ&W6öÇfVBæÆÆ÷vVBÇÂ&W6öÇfVBæ–ç7FÆÆVBÇÂ‚FÂbbFÂç7FGW2ÓÒ&FöæR"bbFÂç7FGW2ÓÒ&f–ÆVB"’Â6†–ÆG&Vã¢&W6öÇfVBæ—46öÆÆV7F–öâò$F÷væÆöB6öÆÆV7F–öâ"¢$F÷væÆöBÖöB"Ò’Ò•ÒÒ’’ÂFÂbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÂföçE6—¦S¢"ÒÂ6†–ÆG&Vã¢¶FÂç7FGW2ÓÒ&FöæR"bbFÂç7FGW2ÓÒ&f–ÆVB"bb5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢bÂ†V–v‡C¢bÒÒ’Â5ô¥5‚æ§7‚‚'7â"Â²6†–ÆG&Vã¢FÂç7FGW2ÓÓÒ&FöæR ¢òFöæR(	BG¶FÂæFöæWÒòG¶FÂçF÷FÇÖ ¢¢FÂç7FGW2ÓÓÒ&f–ÆVB ¢òf–ÆVB(	BG¶FÂæFöæWÒòG¶FÂçF÷FÇÒö¶ ¢¢G¶FÂç7FGW7ÒG¶FÂæFöæWÒòG¶FÂçF÷FÇÒG¶FÂæ7W'&VçBò†—FVÒG¶FÂæ7W'&VçGÒ–¢"'ÖÒ•ÒÒ’Ò’•ÒÒ’Â5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$–ç7FÆÆVBÖöG2"Â6†–ÆG&Vã¢¶vÖW2æÆVæwF‚ÓÓÒbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢$æòv÷&·6†÷ÖöG2–ç7FÆÆVB–WBâ"Ò’Ò’’ÂvÖW2æÖ‚†r’Óâ…5ô¥5‚æ§7‡2‚&F—b"Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ÷VäÖævR†ræ–B’Â6†–ÆG&Vã¢¶vÖTÆ&VÂ†ræ–B’Â"ÇS#B"ÂræÖöD6÷VçBÂ"ÖöB"ÂræÖöD6÷VçBÓÓÒò""¢'2"Â÷VävÖRÓÓÒræ–Bò")k""¢")kÂ%ÒÒ’Ò’Â÷VävÖRÓÓÒræ–Bbb…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢¶'W7’bbÖöG2æÆVæwF‚ÓÓÒbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢#Â†V–v‡C¢#ÒÒ’Ò’’ÂÖöG2æÖ‚†Ò’Óâ…5ô¥5‚æ§7‡2‚&F—b"Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢ÒçF—FÆRòÒçF—FÆR¢ÖöBG¶ÒæÖöF–GÖÂFW67&—F–öã¢G¶ÒæÖöF–GÒ+rG¶f×E6—¦RC†Òç6—¦T'—FW2—ÖÂ6†V6¶VC¢ÒæVæ&ÆVBÂF—6&ÆVC¢'W7’Âöä6†ævS¢‚’ÓâFövvÆTÖöB†ræ–BÂÒ’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’ÓâFVÆWFTÖöB†ræ–BÂÒ’ÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢²%&VÖ÷fRÖöB"ÂÒæÖöF–EÒÒ’Ò•ÒÒÂÒæÖöF–B’’’Â'W7’bbÖöG2æÆVæwF‚ÓÓÒbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢$æòÖöG2f÷VæBâ"Ò’Ò’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢‡V$'W7’ÓÓÒræ–BÂöä6Æ–6³¢‚’ÓâvWEw4Öæ–fW7B†ræ–B’Â6†–ÆG&Vã¢‡V$'W7’ÓÓÒræ–Bò$fWF6†–æ~(
b"¢$fWF6‚v÷&·6†÷Öæ–fW7B„‡V&6’"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢$f÷"66÷VçBÖvFVBv÷&·6†÷6öçFVçC¢VÆÇ2F†—2vÖRw2v÷&·6†÷Öæ–fW7Bg&öÒ‡V&6†æVVG2‡V&6¶W’²v÷&·6†÷V÷F’æBV&Æ—6†W2—B6òF†RVæv–æR6â6W'fRF†Rv÷&·6†÷FW÷Bâ"Ò’Ò•ÒÒ’•ÒÒÂræ–B’’•ÒÒ•ÒÒ’“°§Ð ¦gVæ7F–öâf×E6—¦R†'—FW2’°¢–b‚'—FW2¢&WGW&â#"#°¢6öç7BRÒ²$""Â$´""Â$Ô""Â$t"%Ó°¢ÆWBâÒ'—FW3°¢ÆWB’Ò°¢v†–ÆR†âãÒ#Bbb’ÂRæÆVæwF‚Ò’°¢âóÒ#C°¢’²³°¢Ð¢&WGW&âG¶âçFôf—†VB†âãÒÇÂ’ÓÓÒò¢—ÒG·U¶•×Ö°§Ð¦gVæ7F–öâf×DFFR†×F–ÖR’°¢G'’°¢&WGW&âæWrFFR†×F–ÖR¢’çFôÆö6ÆU7G&–ær‚“°¢Ð¢6F6‚°¢&WGW&â"#°¢Ð§Ð¢ò¢ ¢¢W‡÷'Bò–×÷'Bâ4Å4FV6²6WGW(	BF†R4Å77FVÒ6öæf–r†FFVBvÖW2’ÂF†P¢¢Öæ–fW7E7F÷&RÂFW÷B¶W—2Â7GÇVrÖ–âÇV2ÂæBÇVv–â6WGF–æw2(	B26–ævÆP¢¢çF"æw¢–ââôF÷væÆöG2â&W7F÷&RÆæG2F†VÒ&6²–âÆ6R'WBFöW2äõ@¢¢&RÖ7F—fFR–æ¦V7F–öâ†FòF†BÖçVÆÇ’gFW"Â–â66RF†R6Æ–VçBG&–gFVB’à¢¢ð¦gVæ7F–öâ&6·W6V7F–öâ‚’°¢6öç7B¶–æ6ÇVFT¶W—2Â6WD–æ6ÇVFT¶W—5ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶–æ6ÇVFU6fW2Â6WD–æ6ÇVFU6fW5ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶gVÆÅW&vRÂ6WDgVÆÅW&vUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶&6·W2Â6WD&6·W5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶6öæf—&ÕF‚Â6WD6öæf—&ÕF…ÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B&Vg&W6‚Ò7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—BÆ—7D&6·W2‚“°¢–b‡"ç7V66W72¢6WD&6·W2‡"æ&6·W2ÇÂµÒ“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢&Vg&W6‚‚“°¢vWDgVÆÅW&vTöåVæ–ç7FÆÂ‚¢çF†Vâ‚‡"’Óâ6WDgVÆÅW&vR‚"æVæ&ÆVB’¢æ6F6‚‚‚’Óâ6WDgVÆÅW&vR†fÇ6R’“°¢ÒÂµÒ“°¢6öç7BFôW‡÷'BÒ7–æ2‚’Óâ°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B"Òv—B7&VFT&6·W‚""Â–æ6ÇVFT¶W—2Â–æ6ÇVFU6fW2“°¢–b‡"ç7V66W72’°¢Fö7FW"çFö7B‡°¢F—FÆS¢%4Å4FV6²&6·W"À¢&öG“¢6fVBG·"æf–ÆT6÷VçBóòÒf–ÆW2G·"ç6fT6÷VçBò†–æ6ÂâG·"ç6fT6÷VçGÒ6fRf–ÆW2–¢"'Ò‚G¶f×E6—¦R‡"ç6—¦T'—FW2óò—Ò’FòF÷væÆöG2G¶–æ6ÇVFT¶W—2ò""¢"(	B¶W—2W†6ÇVFVB'ÖÀ¢Ò“°¢&Vg&W6‚‚“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²&6·W"Â&öG“¢"æW'&÷"ÇÂ$W‡÷'Bf–ÆVB"Ò“°¢Ð¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²&6·W"Â&öG“¢7G&–ær†R’Ò“°¢Ð¢f–æÆÇ’°¢6WD'W7’†fÇ6R“°¢Ð¢Ó°¢6öç7BFõ&W7F÷&RÒ7–æ2‡F‚’Óâ°¢6WD'W7’‡G'VR“°¢6WD6öæf—&ÕF‚†çVÆÂ“°¢G'’°¢6öç7B"Òv—B&W7F÷&T&6·W‡F‚“°¢–b‡"ç7V66W72’°¢Fö7FW"çFö7B‡°¢F—FÆS¢%4Å4FV6²&W7F÷&R"À¢&öG“¢&W7F÷&VBG·"ç&W7F÷&VD6÷VçBóòÒf–ÆW2â&RÖ7F—fFR–æ¦V7F–öâ²&W7F'B7FVÒFòÇ’æÀ¢Ò“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²&W7F÷&R"Â&öG“¢"æW'&÷"ÇÂ%&W7F÷&Rf–ÆVB"Ò“°¢Ð¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²&W7F÷&R"Â&öG“¢7G&–ær†R’Ò“°¢Ð¢f–æÆÇ’°¢6WD'W7’†fÇ6R“°¢Ð¢Ó°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$&6·Wb&W7F÷&R"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$–æ6ÇVFR’¶W—2"ÂFW67&—F–öã¢$öfb†FVfVÇB“¢–÷W"6fVB’¶W—2&R7G&—VBg&öÒF†RW‡÷'Bâöã¢¶W—2&R–æ6ÇVFVBÇS#B¶VWF†Rf–ÆR&—fFRâ"Â6†V6¶VC¢–æ6ÇVFT¶W—2ÂF—6&ÆVC¢'W7’Âöä6†ævS¢6WD–æ6ÇVFT¶W—2Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$&6·WÆö6ÂvÖR6fW2"ÂFW67&—F–öã¢$öâ†FVfVÇB“¢Ç6ò&6²WV6‚–ç7FÆÆVB4Å4FV6²vÖRw2&÷Föâ×&Vf—‚6fW2„FFÂ6fVBvÖW2ÂFö7VÖVçG2’â6âÖ¶RF†R&6†—fRÆ&vRâ"Â6†V6¶VC¢–æ6ÇVFU6fW2ÂF—6&ÆVC¢'W7’Âöä6†ævS¢6WD–æ6ÇVFU6fW2Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$gVÆÂW&vRöâVæ–ç7FÆÂ"ÂFW67&—F–öã¢$öfb†FVfVÇB“¢&W6W'fR6Æ÷VE&VF—&V7B6fW2Â&÷f–FW"FFÂ4Å77FVÒ6öæf–wW&F–öâæBFFVBÖvÖR&V6÷&G2âöã¢Væ–ç7FÆÆ–ær4Å4FV6²F‡&÷Vv‚FV6·’W&ÖæVçFÇ’&VÖ÷fW2ÆÂÖævVBFWVæFVæ6–W2æBFFâ"Â6†V6¶VC¢gVÆÅW&vRÂF—6&ÆVC¢'W7’Âöä6†ævS¢†Væ&ÆVB’Óâ°¢6WDgVÆÅW&vR†Væ&ÆVB“°¢6WDgVÆÅW&vTöåVæ–ç7FÆÂ†Væ&ÆVB’æ6F6‚‚‚’Óâ6WDgVÆÅW&vR‚Væ&ÆVB’“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢FôW‡÷'BÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢'W7’ò%v÷&¶–æ~(
b"¢$W‡÷'B&6·WFòF÷væÆöG2"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢$&6·2WFFVBvÖW2ÂÖæ–fW7G2ÂFW÷B¶W—2ÂÇV2ÂæB6WGF–æw2FòâôF÷væÆöG2÷6Ç6FV6µö&6·WóÇF–ÖSâçF"æw¢â"Ò’Ò’Â'W7’bb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Âv¢‚ÂföçE6—¦S¢"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂå7–ææW"Â²7G–ÆS¢²v–GFƒ¢bÂ†V–v‡C¢bÒÒ’Â"v÷&¶–æuÇS##b%ÒÒ’Ò’’Â&6·W2æÆVæwF‚ÓÓÒò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢$æò&6·W2f÷VæB–âF÷væÆöG2â"Ò’Ò’’¢†&6·W2æÖ‚†"’Óâ…5ô¥5‚æ§7‚‚&F—b"Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ†6öæf—&ÕF‚ÓÓÒ"çF‚òFõ&W7F÷&R†"çF‚’¢6WD6öæf—&ÕF‚†"çF‚’’ÂF—6&ÆVC¢'W7’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂfÆW„F—&V7F–öã¢&6öÇVÖâ"ÂFW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²föçEvV–v‡C¢cÂ6öÆ÷#¢6öæf—&ÕF‚ÓÓÒ"çF‚ò"6cVc#2"¢VæFVf–æVBÒÂ6†–ÆG&Vã¢6öæf—&ÕF‚ÓÓÒ"çF‚ò%Fv–âFò6öæf—&Ò&W7F÷&R"¢&W7F÷&RG¶"ææÖWÖÒ’Â5ô¥5‚æ§7‡2‚'7â"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢¶f×E6—¦R†"ç6—¦T'—FW2’Â"ÇS#r"Âf×DFFR†"æ×F–ÖR•ÒÒ•ÒÒ’Ò’Ò’ÒÂ"çF‚’’’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â6öÆ÷#¢"6cVc#2"ÂFF–æs¢#'‚'‚"ÒÂ6†–ÆG&Vã¢%ÇS#d&W7F÷&R÷fW'w&—FW27W'&VçB6öæf–rÂÖæ–fW7G2ÂæB6WGF–æw2ÂF†Vâ†æG2F†VÒ&6²Fò–÷RÇS#B'WBFöW2äõB&RÖ7F—fFR–æ¦V7F–öââgFW"&W7F÷&–ærÂ'VâF†R6Æ–VçBf—‚–bæVVFVBÂF†Vâ7F—fFR–æ¦V7F–öâæB&W7F'B7FVÒâ"Ò’Ò•ÒÒ’“°§Ð ¢ò¢ ¢¢F†R&6†—fS¢öæRVçG'’W"vÖR†öÆF–ærWfW'—F†–ær4Å4FV6²¶æ÷w2—B6†÷VÆ@¢¢&R(	BöæRÖæFF÷'’¶WB'V–ÆBÇW2F†Rf—†W2ÂÆVæ6‚&wVÖVçG2Â&÷FöâFööÀ¢¢æBDÄ27FFRF†BvW&R&W6VçBv†VâF†RvÖR&V6÷&Bv26GW&VBà¢ ¢¢ÖöFVÆÆVBöâÇVÖFV6²w2Æ—7B(i"FWF–ÂÆ–÷WB„vÖTÆ—7B(i"vÖTFWF–Â’&F†W ¢¢F†âfÆBF&ÆS²—B&V¦V7FVBF'2öæÇ’&V6W6RF†RÒ—27&×VBÂæBF†—0¢¢Æ—fW2–âF†R÷F–öç26–FV&"v†W&RF†W&R—2&ööÒà¢ ¢¢6ö×öæVçG2&Ræ÷B–æFWVæFVçFÇ’&6†—fVB÷"&VÖ÷fVBâ&W7F÷&RæBVæ&6†—fP¢¢Çv—2÷W&FRöâF†R6ö×ÆWFRvÖR&V6÷&Bà¢¢ð¦gVæ7F–öâ–ÆÂ‡²FW‡BÂFöæRÒ&F–Ò"Ò’°¢6öç7B2ÒFöæRÓÓÒ&öâ"ò²&s¢'&v&ƒCrÃc‚Ã“"Ãã‚’"Âfs¢"3VfC†"Ð¢¢FöæRÓÓÒ'v&â"ò²&s¢'&v&ƒ#CRÃcbÃ3RÃã‚’"Âfs¢"6cVc#2"Ð¢¢²&s¢'&v&ƒ#SRÃ#SRÃ#SRÃã’"Âfs¢"63†C&S"Ó°¢&WGW&â…5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢°¢F—7Æ“¢&–æÆ–æRÖ&Æö6²"ÂÖ&v–å&–v‡C¢RÂFF–æs¢#‚w‚"Â&÷&FW%&F—W3¢““’À¢föçE6—¦S¢ÂföçEvV–v‡C¢sÂ&6¶w&÷VæC¢2æ&rÂ6öÆ÷#¢2æfrÀ¢ÒÂ6†–ÆG&Vã¢FW‡BÒ’“°§Ð¦gVæ7F–öâvÖTFWF–Â‡²VçG'’Âöä&6²Âöä6†ævVBÒ’°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶æ÷FRÂ6WDæ÷FUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B'V–ÆD—46ö×ÆWFRÒ†"’Óâ†"æÖ—76–ætÖæ–fW7G3òæÆVæwF‚ÇÂ’ÓÓÒ ¢bbö&¦V7Bæ¶W—2†"æv–G2ÇÂ·Ò’æÆVæwF‚â ¢bbö&¦V7Bæ¶W—2†"æ¶W—2ÇÂ·Ò’æÆVæwF‚ÓÓÒö&¦V7Bæ¶W—2†"æv–G2ÇÂ·Ò’æÆVæwFƒ°¢6öç7B†47F—fF&ÆT'V–ÆBÒVçG'’æ'V–ÆG2ç6öÖR†'V–ÆD—46ö×ÆWFR“°¢òò7FVÒ÷vç2ÆVæ6‚&wVÖVçG2Â6ò&VBF†VÒ†W&RæB†æBF†VÒFòF†R&6¶Væ@¢òò2F†R&&Vf÷&R"7FFRâFV7F—fFRF†Vâ$U5Dõ$U2F†—2–ç7FVBöb&Ææ¶–ær(	@¢òòv†–6‚—2v†B¶VW2&÷FöâæBæF—fRÔÆ–çW‚vÖW27–ÖÖWG&–3¢V6‚—2W@¢òò&6²W†7FÇ’2—Bv2Â&F†W"F†â–çFò7FFRF†RFV×ÆFR–çfVçFVBà¢6öç7B&VDÆVæ6„&w2Ò‚’Óâ°¢G'’°¢6öç7B42Òv–æF÷rå7FVÔ6Æ–VçC°¢6öç7BbÒ43òä3òävWDÆVæ6„÷F–öç4f÷$òâ†VçG'’æ–B“°¢&WGW&âG—VöbbÓÓÒ'7G&–ær"òb¢çVÆÃ°¢Ð¢6F6‚°¢&WGW&âçVÆÃ°¢Ð¢Ó°¢òò6†&VB7FVÒ×6–FR6ÆVçW¢F†R&6¶VæBFV7F—fFW2æB&W÷'G2v†B—@¢òò6÷VÆBæ÷BFò—G6VÆb†ÆVæ6‚&w2²f–ÆR&W6WB&R7FVÔ6Æ–VçBÖöæÇ’’à¢6öç7B'Vå7FVÕ6–FT6ÆVçWÒ†B’Óâ°¢–b†Còæ6ÆV$ÆVæ6„÷F–öç2’°¢G'’°¢6öç7B42Òv–æF÷rå7FVÔ6Æ–VçC°¢òò""ÆVv—F–ÖFVÇ’ÖVç2&—B†BæöæR&Vf÷&R"Â6òÇv—2w&—FRF†P¢òò&W÷'FVBfÇVR&F†W"F†âG&VF–ærV×G’2'6¶—"à¢43òä3òå6WDÆVæ6„÷F–öç3òâ†VçG'’æ–BÂBç&W7F÷&TÆVæ6„÷F–öç2óò""“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢Ð¢–b†Còç&W6WDf–ÆW2’°¢G&–vvW%7FVÔ–ç7FÆÂ†VçG'’æ–B’æ6F6‚‚‚’Óâ²Ò“°¢fÆ–FFU7FVÔ†VçG'’æ–B’æ6F6‚‚‚’Óâ²Ò“°¢Ð¢Ó°¢ò¢¢7F—fFRôäR6æ6†÷BÂ÷"FV7F—fFR—B–b—B—2F†R7F—fRöæRâöæÇ’öæP¢¢6æ6†÷BW"vÖRÖ’&R7F—fRÂ6ò7F—fF–æræ÷F†W"F—7Æ6W2—Bâ¢ð¢6öç7BFövvÆU6æ6†÷BÒ†'V–ÆF–B’Óâ°¢–b†VçG'’æ7F—fT'V–ÆBÓÓÒ'V–ÆF–B’°¢FV7F—fFU6æ6†÷B‚“°¢&WGW&ã°¢Ð¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢7F—fFR6æ6†÷BG¶'V–ÆF–GÓöÂ7G$FW67&—F–öã¢†VçG'’æ7F—fT'V–Æ@¢òF†—2&WÆ6W2F†R7W'&VçFÇ’7F—fR6æ6†÷BG¶VçG'’æ7F—fT'V–ÆGÒâ ¢¢""’°¢%F†RvÖR—2–ææVBFòF†—2'V–ÆBæBF÷væÆöFVBÂæBF†—26æ6†÷Bw2÷vâ6GW&VBf—†W2ÂÆVæ6‚&wVÖVçG2æB&÷FöâFööÂ&R&W7F÷&VBâ&RÖ6†V6¶VBöâWfW'’&ö÷Bâ"Â7G$ô´'WGFöåFW‡C¢$7F—fFR"Âöäô³¢7–æ2‚’Óâ°¢6WD'W7’†6æÒG¶'V–ÆF–GÖ“°¢G'’°¢6öç7BÒv—B&6†—fT7F—fFR†VçG'’æ–BÂ'V–ÆF–BÂ&VDÆVæ6„&w2‚’“°¢–b‚ç7V66W72’°¢6WDæ÷FR†æW'&÷"ÇÂ$6÷VÆBæ÷B7F—fFR"“°¢&WGW&ã°¢Ð¢6öç7B"Òv—B&6†—fU&V6öæ6–ÆR†VçG'’æ–BÂG'VR“°¢–b‡"ç7V66W72bb‡"æ†4ÆVæ6„÷F–öç2ÇÂç&W7F÷&TÆVæ6„÷F–öç4¶æ÷vâ’’°¢G'’°¢6öç7B42Òv–æF÷rå7FVÔ6Æ–VçC°¢43òä3òå6WDÆVæ6„÷F–öç3òâ†VçG'’æ–BÂ"æ†4ÆVæ6„÷F–öç2ò‡"çvçDÆVæ6„÷F–öç2ÇÂ""’¢†ç&W7F÷&TÆVæ6„÷F–öç2ÇÂ""’“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢Ð¢–b‡"ç7V66W72bb"æ–ç7FÆÆVB’°¢G&–vvW%7FVÔ–ç7FÆÂ†VçG'’æ–B’æ6F6‚‚‚’Óâ²Ò“°¢fÆ–FFU7FVÔ†VçG'’æ–B’æ6F6‚‚‚’Óâ²Ò“°¢Ð¢6öç7BF–BÒ‡"æ7F–öç2ÇÂµÒ’æ¦ö–â‚"Â"“°¢6WDæ÷FR‚"ç7V66W72ò‡"æW'&÷"ÇÂ$7F—fFVBÂ'WB&V6öæ6–ÆRf–ÆVB"¢¢"æ–ç7FÆÆVBò7F—fFVB6æ6†÷BG¶'V–ÆF–GÒâG·"çv—F–ærÇÂ"'Ö ¢¢F–Bò7F—fFVB6æ6†÷BG¶'V–ÆF–GÒ(	BG¶F–GÒæ¢7F—fFVB6æ6†÷BG¶'V–ÆF–GÒ(	BÇ&VG’ÖF6†–æræ“°¢öä6†ævVB‚“°¢Ð¢6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢Ð¢ÒÒ’“°¢Ó°¢ò¢¢Væ&6†—fRôäR6æ6†÷BâF†R&6¶VæBFV7F—fFW2—Bf—'7Bv†Vâ—B—2F†P¢¢7F—fRöæRÂ6òF†—2Çv—2ÆVfW2F†RvÖR6ÆVã²÷F†W"6æ6†÷G2öbF†P¢¢6ÖRvÖR&RVçF÷V6†VBâ¢ð¢6öç7BVæ&6†—fU6æ6†÷BÒ†'V–ÆF–B’ÓâDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢Væ&6†—fR6æ6†÷BG¶'V–ÆF–GÓöÂ7G$FW67&—F–öã¢†VçG'’æ7F—fT'V–ÆBÓÓÒ'V–ÆF–@¢ò%F†—26æ6†÷B—25D•dRâ—B—2FV7F—fFVBf—'7B(	BVç–ææVBÂ&÷FöâFööÂæBÆVæ6‚&wVÖVçG2&W7F÷&VBÂf–ÆW2&W6WB(	BæBF†Vâ&VÖ÷fVBâ ¢¢""’°¢$FVÆWFW2F†—26æ6†÷Bw2'V–ÆBÖFW&–ÂæB—G26GW&VBf—†W2ÂÆVæ6‚&wVÖVçG2æB&÷FöâFööÂâ÷F†W"6æ6†÷G2öbF†—2vÖR&R¶WBâ"Â7G$ô´'WGFöåFW‡C¢%Væ&6†—fR"Âöäô³¢7–æ2‚’Óâ°¢6WD'W7’†&ÒÒG¶'V–ÆF–GÖ“°¢G'’°¢6öç7B"Òv—B'V–ÆD&6†—fU&VÖ÷fR†VçG'’æ–BÂ'V–ÆF–B“°¢–b‚"ç7V66W72’°¢6WDæ÷FR‡"æW'&÷"ÇÂ$f–ÆVB"“°¢&WGW&ã°¢Ð¢'Vå7FVÕ6–FT6ÆVçW‡"æFV7F—fFVB“°¢6WDæ÷FR†Væ&6†—fVB6æ6†÷BG¶'V–ÆF–GÒ(	BG·"ç&VÖ÷fVDÖæ–fW7G2óòÒÖæ–fW7B‡2’g&VVBæ“°¢öä6†ævVB‚“°¢–b‚"ç&VÖ–æ–ær¢öä&6²‚“°¢Ð¢6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢Ð¢ÒÒ’“°¢ò¢¢6†&VB'’F†RvÖRÖÆWfVÂ'WGFöâæBF†RW"×6æ6†÷BöæS¢öæÇ’öæP¢¢6æ6†÷B—2WfW"7F—fRÂ6òF†W&R—2öæÇ’öæRF†–ærFòFV7F—fFRâ¢ð¢6öç7BFV7F—fFU6æ6†÷BÒ‚’ÓâDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢$FV7F—fFRF†—26æ6†÷Cò"Â7G$FW67&—F–öã¢%7F÷2&W7F÷&–ærF†R&6†—fVB6öæf–wW&F–öâÂVç–ç2—G2'V–ÆBÂ&W7F÷&W2F†R&RÖ7F—fF–öâ&÷FöâFööÂæBÆVæ6‚&wVÖVçG2æB6·27FVÒFò&W6WBF†RvÖRf–ÆW2âF†R&6†—fVB6æ6†÷B—2¶WBâ"Â7G$ô´'WGFöåFW‡C¢$FV7F—fFR"Âöäô³¢7–æ2‚’Óâ°¢6WD'W7’†VçG'’æ7F—fT'V–ÆBò6æÒG¶VçG'’æ7F—fT'V–ÆGÖ¢&vÖRÖ7F—fR"“°¢G'’°¢6öç7B"Òv—B&6†—fTFV7F—fFR†VçG'’æ–BÂG'VR“°¢–b‚"ç7V66W72’°¢6WDæ÷FR‡"æW'&÷"ÇÂ$6÷VÆBæ÷BFV7F—fFR"“°¢&WGW&ã°¢Ð¢'Vå7FVÕ6–FT6ÆVçW‡"“°¢6WDæ÷FR†6æ6†÷BFV7F—fFVBG·"çVç–ææVBò"æBVç–ææVB"¢"'Òæ“°¢öä6†ævVB‚“°¢Ð¢6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢Ð¢ÒÒ’“°¢6öç7BFövvÆTvÖT7F—fRÒ‚’Óâ°¢–b†VçG'’æ7F—fT'V–ÆB’°¢FV7F—fFU6æ6†÷B‚“°¢&WGW&ã°¢Ð¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢$7F—fFRF†—2vÖR6æ6†÷Cò"Â7G$FW67&—F–öã¢%&W7F÷&W2F†R&6†—fVB'V–ÆBæBWfW'’÷F–öæÂ6ö×öæVçB6GW&VBv—F‚—C¢f—†W2ÂÆVæ6‚&wVÖVçG2Â&÷Föâ6VÆV7F–öâæBDÄ27FFRv†Vâ&W6VçBâF†R6öæf–wW&F–öâ—2&RÖ6†V6¶VBöâWfW'’&ö÷Bâ"Â7G$ô´'WGFöåFW‡C¢$7F—fFR"Âöäô³¢7–æ2‚’Óâ°¢6WD'W7’‚&vÖRÖ7F—fR"“°¢G'’°¢6öç7BÒv—B&6†—fT7F—fFTvÖR†VçG'’æ–BÂ&VDÆVæ6„&w2‚’“°¢–b‚ç7V66W72’°¢6WDæ÷FR†æW'&÷"ÇÂ$6÷VÆBæ÷B7F—fFR"“°¢&WGW&ã°¢Ð¢6öç7B"Òv—B&6†—fU&V6öæ6–ÆR†VçG'’æ–BÂG'VR“°¢–b‡"ç7V66W72bb"æ†4ÆVæ6„÷F–öç2’°¢G'’°¢6öç7B42Òv–æF÷rå7FVÔ6Æ–VçC°¢43òä3òå6WDÆVæ6„÷F–öç3òâ†VçG'’æ–BÂ"çvçDÆVæ6„÷F–öç2“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢Ð¢–b‡"ç7V66W72bb"æ–ç7FÆÆVB’°¢G&–vvW%7FVÔ–ç7FÆÂ†VçG'’æ–B’æ6F6‚‚‚’Óâ²Ò“°¢fÆ–FFU7FVÔ†VçG'’æ–B’æ6F6‚‚‚’Óâ²Ò“°¢Ð¢6öç7BF–BÒ‡"æ7F–öç2ÇÂµÒ’æ¦ö–â‚"Â"“°¢6WDæ÷FR‚"æ–ç7FÆÆV@¢ò6æ6†÷B7F—fFVBâG·"çv—F–ærÇÂ$—BÆ–W2öæ6RF†RvÖR—2–ç7FÆÆVBâ'Ö ¢¢F–Bò6æ6†÷B&W7F÷&VB(	BG¶F–GÒæ¢%6æ6†÷B&W7F÷&VB(	BF†RvÖRÇ&VG’ÖF6†W2â"“°¢öä6†ævVB‚“°¢Ð¢6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢Ð¢ÒÒ’“°¢Ó°¢6öç7BVæ&6†—fTvÖRÒ‚’ÓâDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„DdÂä6öæf—&ÔÖöFÂÂ²7G%F—FÆS¢%Væ&6†—fRF†—2vÖSò"Â7G$FW67&—F–öã¢†VçG'’æ7F—fT'V–Æ@¢ò%F†—2vÖR—25D•dRâ—Bv–ÆÂ&RFV7F—fFVBf—'7B(	BVç–ææVBÂÆVæ6‚&wVÖVçG26ÆV&VBæB—G2f–ÆW2&W6WB(	BæBF†Vâ&VÖ÷fVBâ ¢¢""’°¢FVÆWFW2ÄÂG¶VçG'’æ'V–ÆD6÷VçGÒ6æ6†÷B‡2’öbF†—2vÖRæBWfW'—F†–ær6GW&VBv—F‚F†VÒâF†R–ç7FÆÆVBvÖRw2f–ÆW2&R÷F†W'v—6RVçF÷V6†VBæÂ7G$ô´'WGFöåFW‡C¢%Væ&6†—fR"Âöäô³¢7–æ2‚’Óâ°¢6WD'W7’‚&vÖR×&VÖ÷fR"“°¢G'’°¢6öç7B"Òv—B&6†—fU&VÖ÷fTvÖR†VçG'’æ–B“°¢–b‚"ç7V66W72’°¢6WDæ÷FR‡"æW'&÷"ÇÂ$f–ÆVB"“°¢&WGW&ã°¢Ð¢'Vå7FVÕ6–FT6ÆVçW‡"æFV7F—fFVB“°¢6WDæ÷FR†Væ&6†—fVB(	BG·"æ'V–ÆG2óòÒ'V–ÆB‡2’G&÷VBÂG·"ç&VÖ÷fVDÖæ–fW7G2óòÒÖæ–fW7B‡2’g&VVBæ“°¢öä6†ævVB‚“°¢öä&6²‚“°¢Ð¢6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢Ð¢ÒÒ’“°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢VçG'’ææÖRÇÂG¶VçG'’æ–GÖÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢öä&6²Â6†–ÆG&Vã¢%ÇS#“&6²Fò&6†—fR"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’ÇÂ‚VçG'’æ7F—fT'V–ÆBbb†47F—fF&ÆT'V–ÆB’Âöä6Æ–6³¢FövvÆTvÖT7F—fRÂ6†–ÆG&Vã¢'W7’ÓÓÒ&vÖRÖ7F—fR ¢ò%v÷&¶–æ~(
b ¢¢VçG'’æ7F—fT'V–Æ@¢ò$FV7F—fFR6æ6†÷B ¢¢$7F—fFR6æ6†÷B"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢Væ&6†—fTvÖRÂ6†–ÆG&Vã¢'W7’ÓÓÒ&vÖR×&VÖ÷fR"ò%v÷&¶–æ~(
b"¢%Væ&6†—fRF†—2vÖR"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãsRÒÂ6†–ÆG&Vã¢²$”B"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢VçG'’æ–BÒ•ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂföçEvV–v‡C¢cÂFF–æuF÷¢BÒÂ6†–ÆG&Vã¢²$&6†—fVB6æ6†÷G2‚"ÂVçG'’æ'V–ÆD6÷VçBÂ"’%ÒÒ’Ò’ÂVçG'’æ'V–ÆG2æÆVæwF‚ÓÓÒbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÒÂ6†–ÆG&Vã¢$æöæR¶WBf÷"F†—2vÖRâ"Ò’Ò’’ÂVçG'’æ'V–ÆG2æÖ‚†"’Óâ°¢6öç7B–æ6ö×ÆWFRÒ'V–ÆD—46ö×ÆWFR†"“°¢6öç7BÖ—76–ætÖFW&–ÂÒ†"æÖ—76–ætÖæ–fW7G3òæÆVæwF‚ÇÂ¢²ÖF‚æÖ‚ƒÂö&¦V7Bæ¶W—2†"æv–G2ÇÂ·Ò’æÆVæwF‚Òö&¦V7Bæ¶W—2†"æ¶W—2ÇÂ·Ò’æÆVæwF‚“°¢6öç7B—47F—fRÒVçG'’æ7F—fT'V–ÆBÓÓÒ"æ'V–ÆF–C°¢6öç7Bf—†W2Ò"æf—†W2ÇÂµÓ°¢&WGW&â…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢°¢v–GFƒ¢#R"ÂFF–æs¢#g‚‡‚"ÂÖ&v–ä&÷GFöÓ¢bÂ&÷&FW%&F—W3¢bÀ¢&6¶w&÷VæC¢—47F—fRò'&v&ƒCrÃc‚Ã“"Ãã’"¢'&v&ƒ#SRÃ#SRÃ#SRÃãB’"À¢&÷&FW#¢—47F—fRò#‚6öÆ–B&v&ƒCrÃc‚Ã“"Ãã3R’"¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃã‚’"À¢ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÒÂ6†–ÆG&Vã¢²$'V–ÆB"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢"æ'V–ÆF–BÒ’Â""Â"æFFRò+rG¶"æFFWÖ¢""Â—47F—fRò5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²""Â5ô¥5‚æ§7‚…–ÆÂÂ²FW‡C¢&7F—fR"ÂFöæS¢&öâ"Ò•ÒÒ’¢çVÆÅÒÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÖ&v–åF÷¢"ÒÂ6†–ÆG&Vã¢¶–æ6ö×ÆWFP¢ò5ô¥5‚æ§7‚…–ÆÂÂ²FW‡C¢G¶Ö—76–ætÖFW&–ÇÒ&WV—&VB—FVÒ‡2’Ö—76–ævÂFöæS¢'v&â"Ò¢¢5ô¥5‚æ§7‚…–ÆÂÂ²FW‡C¢&6ö×ÆWFR"ÂFöæS¢&öâ"Ò’Âö&¦V7Bæ¶W—2†"æv–G2ÇÂ·Ò’æÆVæwF‚Â"FW÷B‡2’"Â"æ&6†—fVDöâò+r&6†—fVBG¶"æ&6†—fVDöçÖ¢"%ÒÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãsRÂÖ&v–åF÷¢BÂÆ–æT†V–v‡C¢ãRÒÂ6†–ÆG&Vã¢¶"æ†46ö×EFööÀ¢ò"æ6ö×EFööÂò5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²%&÷Föâ"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢"æ6ö×EFööÂÒ•ÒÒ’¢5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²%&÷Föâ"Â5ô¥5‚æ§7‚‚&’"Â²6†–ÆG&Vã¢&FVfVÇB"Ò•ÒÒ¢¢5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²%&÷Föâ"Â5ô¥5‚æ§7‚‚&’"Â²6†–ÆG&Vã¢&æ÷B6GW&VB"Ò•ÒÒ’Â"+r"Â"æ†4FÆ57FFRò5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢"æFÆ4f–ÆW2Ò’Â"DÄ2f–ÆR‡2’%ÒÒ’¢5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²$DÄ2"Â5ô¥5‚æ§7‚‚&’"Â²6†–ÆG&Vã¢&æ÷B6GW&VB"Ò•ÒÒ’Â"+r"Â"æ†4f—…7FFRò5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢"æf—„6÷VçBÒ’Â"f—‚†W2’%ÒÒ’¢5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²&f—†W2"Â5ô¥5‚æ§7‚‚&’"Â²6†–ÆG&Vã¢&æ÷B6GW&VB"Ò•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢"Âv÷&D'&V³¢&'&V²ÖÆÂ"ÒÂ6†–ÆG&Vã¢"æ†4ÆVæ6„÷F–öç0¢ò5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²$ÆVæ6‚&w3¢"Â"æÆVæ6„÷F–öç2ò5ô¥5‚æ§7‚‚&6öFR"Â²6†–ÆG&Vã¢"æÆVæ6„÷F–öç2Ò’¢5ô¥5‚æ§7‚‚&’"Â²6†–ÆG&Vã¢&æöæR"Ò•ÒÒ¢¢5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²$ÆVæ6‚&w3¢"Â5ô¥5‚æ§7‚‚&’"Â²6†–ÆG&Vã¢&æ÷B6GW&VB"Ò•ÒÒ’Ò’Âf—†W2æÖ‚†b’Óâ…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢"ÒÂ6†–ÆG&Vã¢²%ÇS#r"Â5ô¥5‚æ§7‚‚&""Â²6†–ÆG&Vã¢bæf—…G—RÇÂ&f—‚"Ò’Âbæf–ÆW2ò‚G¶bæf–ÆW7Òf–ÆR‡2’–¢""ÂbæÖ—76–ærò5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²""Â5ô¥5‚æ§7‚…–ÆÂÂ²FW‡C¢&æ÷BÆ–VBæ÷r"ÂFöæS¢'v&â"Ò•ÒÒ’¢çVÆÅÒÒÂbæ¶W’’’•ÒÒ’Â5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"Âv¢bÂÖ&v–åF÷¢bÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²7G–ÆS¢²fÆWƒ¢ÂföçE6—¦S¢ÂFF–æs¢#G‚g‚"ÒÂF—6&ÆVC¢'W7’ÇÂ†–æ6ö×ÆWFRbb—47F—fR’Âöä6Æ–6³¢‚’ÓâFövvÆU6æ6†÷B†"æ'V–ÆF–B’Â6†–ÆG&Vã¢'W7’ÓÓÒ6æÒG¶"æ'V–ÆF–GÖò.(
b"¢—47F—fRò$FV7F—fFR"¢$7F—fFR"Ò’Â5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²7G–ÆS¢²fÆWƒ¢ÂföçE6—¦S¢ÂFF–æs¢#G‚g‚"ÒÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢‚’ÓâVæ&6†—fU6æ6†÷B†"æ'V–ÆF–B’Â6†–ÆG&Vã¢'W7’ÓÓÒ&ÒÒG¶"æ'V–ÆF–GÖò.(
b"¢%Væ&6†—fR"Ò•ÒÒ•ÒÒ’ÒÂ"æ'V–ÆF–B’“°¢Ò’Âæ÷FRò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢æ÷FRÒ’Ò’’¢çVÆÅÒÒ’“°§Ð¦gVæ7F–öâ&6†—fU6V7F–öâ‚’°¢6öç7B¶VçG&–W2Â6WDVçG&–W5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B·6VÂÂ6WE6VÅÒÒ5õ$T5BçW6U7FFR†çVÆÂ“°¢6öç7B¶ÆöF–ærÂ6WDÆöF–æuÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶æ÷FRÂ6WDæ÷FUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7BÆöBÒ7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—B&6†—fTVçG&–W2‚“°¢6WDVçG&–W2‡"ç7V66W72ò‡"æVçG&–W2ÇÂµÒ’¢µÒ“°¢–b‚"ç7V66W72¢6WDæ÷FR‡"æW'&÷"ÇÂ$6÷VÆBæ÷B&VBF†R&6†—fR"“°¢Ð¢6F6‚†R’°¢6WDæ÷FR†f–ÆVC¢G¶WÖ“°¢Ð¢f–æÆÇ’°¢6WDÆöF–ær†fÇ6R“°¢Ð¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ²ÆöB‚“²ÒÂµÒ“°¢–b†ÆöF–ær’°¢&WGW&â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$&6†—fR"Â6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢%&VF–ærF†R&6†—fUÇS##b"Ò’Ò’Ò“°¢Ð¢6öç7B7W'&VçBÒVçG&–W2æf–æB‚†R’ÓâRæ–BÓÓÒ6VÂ’ÇÂçVÆÃ°¢–b†7W'&VçB’°¢&WGW&â5ô¥5‚æ§7‚„vÖTFWF–ÂÂ²VçG'“¢7W'&VçBÂöä&6³¢‚’Óâ6WE6VÂ†çVÆÂ’Âöä6†ævVC¢ÆöBÒ“°¢Ð¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$&6†—fR"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÆ–æT†V–v‡C¢ãRÒÂ6†–ÆG&Vã¢$V6‚vÖR6öçF–ç2–æFWVæFVçB6æ6†÷G2âWfW'’6æ6†÷B†2&WV—&VB6ö×ÆWFR'V–ÆB†v–G2ÂÖæ–fW7G2æBFW÷B¶W—2’ÇW2f—†W2ÂÆVæ6‚&wVÖVçG2Â&÷FöâFööÂæBDÄ27FFRv†Vâf–Æ&ÆRâÆÂöb—B&–FW2Æöær–âF†RVæ–ç7FÆÂ&6†—fRÂ6ò—B7W'f—fW2&VÖ÷f–ærF†RÇVv–ââ"Ò’Ò’ÂVçG&–W2æÆVæwF‚ÓÓÒbb…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãcRÒÂ6†–ÆG&Vã¢$æ÷F†–ær&6†—fVB–WBâW6RÇS#4&6†—fRvÖR6æ6†÷EÇS##eÇS#BöâvÖRw2vRFò6GW&RöæRâ"Ò’Ò’’ÂVçG&–W2æÖ‚†R’Óâ…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6WE6VÂ†Ræ–B’Â6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²FW‡DÆ–vã¢&ÆVgB"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢2ÒÂ6†–ÆG&Vã¢RææÖRÇÂG¶Ræ–GÖÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãcRÂÖ&v–åF÷¢"ÒÂ6†–ÆG&Vã¢¶Ræ'V–ÆD6÷Vç@¢ò5ô¥5‚æ§7‚…–ÆÂÂ²FW‡C¢G¶Ræ'V–ÆD6÷VçGÒ6æ6†÷BG¶Ræ'V–ÆD6÷VçBÓÓÒò""¢'2'ÖÒ¢¢çVÆÂÂRæ7F—fT'V–ÆBò5ô¥5‚æ§7‚…–ÆÂÂ²FW‡C¢7F—fS¢G¶Ræ7F—fT'V–ÆGÖÂFöæS¢&öâ"Ò’¢çVÆÅÒÒ•ÒÒ’Ò’ÒÂRæ–B’’’Âæ÷FRò…5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ã‚ÒÂ6†–ÆG&Vã¢æ÷FRÒ’Ò’’¢çVÆÅÒÒ’“°§Ð ¦6öç7B$õTÄUEDUõÕô´U’Ò'6Ç6FV6²ç7F÷&U&÷VÆWGFRçV–6´66W72#°¦6öç7B$õTÄUEDUõD%ôD•4$ÄTEô´U’Ò'6Ç6FV6²ç7F÷&U&÷VÆWGFRçF$F—6&ÆVB#°¦6öç7B$õTÄUEDUõ$”4Uô´U’Ò'6Ç6FV6²ç7F÷&U&÷VÆWGFRæÖ–å&–6R#°¦6öç7B$õTÄUEDUôd”ÅDU%5ô´U’Ò'6Ç6FV6²ç7F÷&U&÷VÆWGFRæf–ÇFW'2#°¦6öç7B$õTÄUEDUõ$Te5ôUdTåBÒ'6Ç6FV6²×7F÷&R×&÷VÆWGFR×&Vg2#°¦6öç7BDTdTÅEõ$õTÄUEDUôd”ÅDU%2Ò°¢&–6TVæ&ÆVC¢fÇ6RÀ¢&–6TF—&V7F–öã¢&Ö–â"À¢&–6T6VçG3¢cÀ¢VÆ—G”ÖöFS¢fÇ6RÀ¢W'6öæÆ—¦VC¢fÇ6RÀ¢vVç&S¢""À¢Æ–W'3¢""À¢FV6³¢""À¢Ö–å&F–æs¢À¢Ö–å&Wf–Ww3¢À¢&VÆV6Tg&öÓ¢À¢&VÆV6UFó¢À§Ó°¦gVæ7F–öâ&VE&÷VÆWGFT&ööÂ†¶W’’°¢G'’°¢&WGW&âv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ†¶W’’ÓÓÒ##°¢Ð¢6F6‚°¢&WGW&âfÇ6S°¢Ð§Ð¦gVæ7F–öâw&—FU&÷VÆWGFT&ööÂ†¶W’ÂfÇVR’°¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ†¶W’ÂfÇVRò#"¢#"“°¢v–æF÷ræF—7F6„WfVçB†æWr7W7FöÔWfVçB…$õTÄUEDUõ$Te5ôUdTåBÂ²FWF–Ã¢²¶W’ÂfÇVRÒÒ’“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ§Ð¦gVæ7F–öâ&VE&÷VÆWGFU&–6R‚’°¢G'’°¢6öç7BfÇVRÒçVÖ&W"‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ…$õTÄUEDUõ$”4Uô´U’’ÇÂ“°¢&WGW&â³ÂcÂÂÒæ–æ6ÇVFW2‡fÇVR’òfÇVR¢°¢Ð¢6F6‚°¢&WGW&â°¢Ð§Ð¦gVæ7F–öâ&VE&÷VÆWGFTf–ÇFW'2‚’°¢G'’°¢6öç7B'6VBÒ¥4ôâç'6R‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ…$õTÄUEDUôd”ÅDU%5ô´U’’ÇÂ'·Ò"“°¢6öç7BÆVv7•&–6RÒ&VE&÷VÆWGFU&–6R‚“°¢6öç7B†56Æ–FW%&–6RÒG—Vöb'6VBç&–6TVæ&ÆVBÓÓÒ&&ööÆVâ#°¢&WGW&â°¢&–6TVæ&ÆVC¢†56Æ–FW%&–6Rò'6VBç&–6TVæ&ÆVB¢ÆVv7•&–6RâÀ¢&–6TF—&V7F–öã¢'6VBç&–6TF—&V7F–öâÓÓÒ&Ö‚"ò&Ö‚"¢&Ö–â"À¢&–6T6VçG3¢ÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂçVÖ&W"††56Æ–FW%&–6Rò'6VBç&–6T6VçG2¢ÆVv7•&–6R’ÇÂDTdTÅEõ$õTÄUEDUôd”ÅDU%2ç&–6T6VçG2’’À¢VÆ—G”ÖöFS¢'6VBçVÆ—G”ÖöFRÓÓÒG'VRÀ¢W'6öæÆ—¦VC¢'6VBçW'6öæÆ—¦VBÓÓÒG'VRÀ¢vVç&S¢G—Vöb'6VBævVç&RÓÓÒ'7G&–ær"ò'6VBævVç&R¢""À¢Æ–W'3¢G—Vöb'6VBçÆ–W'2ÓÓÒ'7G&–ær"ò'6VBçÆ–W'2¢""À¢FV6³¢G—Vöb'6VBæFV6²ÓÓÒ'7G&–ær"ò'6VBæFV6²¢""À¢Ö–å&F–æs¢ÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂçVÖ&W"‡'6VBæÖ–å&F–ær’ÇÂ’’À¢Ö–å&Wf–Ww3¢ÖF‚æÖ‚ƒÂçVÖ&W"‡'6VBæÖ–å&Wf–Ww2’ÇÂ’À¢&VÆV6Tg&öÓ¢ÖF‚æÖ‚ƒÂçVÖ&W"‡'6VBç&VÆV6Tg&öÒ’ÇÂ’À¢&VÆV6UFó¢ÖF‚æÖ‚ƒÂçVÖ&W"‡'6VBç&VÆV6UFò’ÇÂ’À¢Ó°¢Ð¢6F6‚°¢&WGW&â²ââäDTdTÅEõ$õTÄUEDUôd”ÅDU%2Ó°¢Ð§Ð¦gVæ7F–öâw&—FU&÷VÆWGFTf–ÇFW'2‡fÇVR’°¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ…$õTÄUEDUôd”ÅDU%5ô´U’Â¥4ôâç7G&–æv–g’‡fÇVR’“°¢òò¶VWF†RöÆBÖ–æ–×VÒ×&–6R&VfW&Væ6R6ö†W&VçBf÷"öÆFW"'V–ÆG2â¢òò6V–Æ–ær6ææ÷B&R&W&W6VçFVBF†W&RÂ6òÆVv7’6Æ–VçG26VR&æFöÒà¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ…$õTÄUEDUõ$”4Uô´U’Â7G&–ær‡fÇVRç&–6TVæ&ÆVBbbfÇVRç&–6TF—&V7F–öâÓÓÒ&Ö–â"òfÇVRç&–6T6VçG2¢’“°¢v–æF÷ræF—7F6„WfVçB†æWr7W7FöÔWfVçB…$õTÄUEDUõ$Te5ôUdTåBÂ²FWF–Ã¢²¶W“¢$õTÄUEDUôd”ÅDU%5ô´U’ÂfÇVRÒÒ’“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ§Ð ¦6öç7B4$Eõt”ED‚Ò3°¦6öç7B4$EôtÒ°¦6öç7BEU$D”ôâÒSs°¦6öç7B44Uõ4õTäEõU$ÂÒ&‡GG3¢ò÷&ræv—F‡V'W6W&6öçFVçBæ6öÒö'W¦7&—7F–âô66RÕ6–×VÆF÷"öÖ–âôVF–òô54tòS#66RS#÷Væ–ærS#6÷VæBS#VffV7Bæ×2#°¦6öç7B$”4UôD•$T5D”ôåôõD”ôå2Ò°¢²FF¢&Ö–â"ÂÆ&VÃ¢$BÆV7B"ÒÀ¢²FF¢&Ö‚"ÂÆ&VÃ¢$BÖ÷7B"ÒÀ¥Ó°¦6öç7BtTå$UôõD”ôå2Ò°¢²FF¢""ÂÆ&VÃ¢$ç’vVç&R"ÒÂ²FF¢&7F–öâ"ÂÆ&VÃ¢$7F–öâ"ÒÀ¢²FF¢''r"ÂÆ&VÃ¢%%r"ÒÂ²FF¢'7G&FVw’"ÂÆ&VÃ¢%7G&FVw’"ÒÀ¢²FF¢'6–×VÆF–öâ"ÂÆ&VÃ¢%6–×VÆF–öâ"ÒÂ²FF¢&GfVçGW&R"ÂÆ&VÃ¢$GfVçGW&R"ÒÀ¢²FF¢&†÷'&÷""ÂÆ&VÃ¢$†÷'&÷""ÒÂ²FF¢'&6–ær"ÂÆ&VÃ¢%&6–ær"ÒÀ¢²FF¢'7÷'G2"ÂÆ&VÃ¢%7÷'G2"ÒÀ¥Ó°¦6öç7BÄ”U%ôõD”ôå2Ò°¢²FF¢""ÂÆ&VÃ¢$ç’Æ–W"ÖöFR"ÒÂ²FF¢'6–ævÆWÆ–W""ÂÆ&VÃ¢%6–ævÆR×Æ–W""ÒÀ¢²FF¢&×VÇF—Æ–W""ÂÆ&VÃ¢$×VÇF—Æ–W""ÒÂ²FF¢&6ö÷"ÂÆ&VÃ¢$6òÖ÷"ÒÀ¥Ó°¦6öç7BDT4µôõD”ôå2Ò°¢²FF¢""ÂÆ&VÃ¢$ç’FV6²7FGW2"ÒÂ²FF¢'Æ–&ÆR"ÂÆ&VÃ¢%Æ–&ÆR÷"fW&–f–VB"ÒÀ¢²FF¢'fW&–f–VB"ÂÆ&VÃ¢%fW&–f–VBöæÇ’"ÒÀ¥Ó°¦6öç7B$D”äuôõD”ôå2Ò³ÂcÂsÂƒÂ“ÒæÖ‚†FF’Óâ‡²FFÂÆ&VÃ¢FFòG¶FFÒR²÷6—F—fV¢$ç’&F–ær"Ò’“°¦6öç7B$Ud”UuôõD”ôå2Ò³ÂÂSÂÂSÒæÖ‚†FF’Óâ‡²FFÂÆ&VÃ¢FFòG¶FFçFôÆö6ÆU7G&–ær‚—Ò²&Wf–Ww6¢$ç’&Wf–Wr6÷VçB"Ò’“°¦6öç7B”T%ôõD”ôå2Ò·²FF¢ÂÆ&VÃ¢$ç’–V""ÒÂââä'&’æg&öÒ‡²ÆVæwFƒ¢CrÒÂ…òÂ–æFW‚’Óâ°¢6öç7BFFÒæWrFFR‚’ævWDgVÆÅ–V"‚’Ò–æFWƒ°¢&WGW&â²FFÂÆ&VÃ¢7G&–ær†FF’Ó°¢Ò•Ó°¦6öç7BÄ4T„ôÄDU%ô4$E2Ò²#ò"Â%4Å2"Â#ò"Â%5Dõ$R"Â#ò%Ó°¦6öç7B$TdUD4…ôDUD‚Ò#°¦gVæ7F–öâ—5W6&ÆU&öÆÂ‡&W7VÇB’°¢&WGW&â&ööÆVâ‡&W7VÇBbb&W7VÇBç7V66W72bb&W7VÇBæ—FV×3òæÆVæwF‚bb&W7VÇBçv–ææW$–æFW‚ÓÒVæFVf–æVBbb&W7VÇBçv–ææW"“°§Ð¦gVæ7F–öâvÖT'Gv÷&²‡²—FVÒÒ’°¢6öç7B6÷W&6W2Ò°¢—FVÒæ–ÖvRÀ¢‡GG3¢òö6Fâæ6Æ÷VFfÆ&Rç7FV×7FF–2æ6öÒ÷7FVÒö2òG¶—FVÒæ–GÒö†VFW"æ§vÀ¢‡GG3¢òö6Fâæ6Æ÷VFfÆ&Rç7FV×7FF–2æ6öÒ÷7FVÒö2òG¶—FVÒæ–GÒö67VÆUócgƒ3S2æ§vÀ¢Òæf–ÇFW"‚‡6÷W&6RÂ–æFW‚ÂÆÂ’Óâ&ööÆVâ‡6÷W&6R’bbÆÂæ–æFW„öb‡6÷W&6R’ÓÓÒ–æFW‚“°¢6öç7B·6÷W&6T–æFW‚Â6WE6÷W&6T–æFW…ÒÒ5õ$T5BçW6U7FFRƒ“°¢–b‡6÷W&6T–æFW‚ãÒ6÷W&6W2æÆVæwF‚¢&WGW&â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢v–GFƒ¢#R"Â†V–v‡C¢#R"ÂF—7Æ“¢&w&–B"ÂÆ6T—FV×3¢&6VçFW""ÂFF–æs¢BÂ&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"À¢&6¶w&÷VæC¢'&F–ÂÖw&F–VçB†6—&6ÆRBSR3RRÇ&v&ƒ“2Ãƒ2Ã#3"Âã"’ÇG&ç7&VçBS‚R’ÆÆ–æV"Öw&F–VçBƒCVFVrÂ3#33SFÂ33#’’"À¢6öÆ÷#¢'&v&ƒ#SRÃ#SRÃ#SRÂãc‚’"ÂföçEvV–v‡C¢ƒÂföçE6—¦S¢RÂFW‡DÆ–vã¢&6VçFW""À¢ÒÂ6†–ÆG&Vã¢—FVÒææÖRÇÂ%7FVÒvÖR"Ò“°¢&WGW&â5ô¥5‚æ§7‚‚&–Ör"Â²7&3¢6÷W&6W5·6÷W&6T–æFW…ÒÂÇC¢""ÂöäW'&÷#¢‚’Óâ6WE6÷W&6T–æFW‚‚†–æFW‚’Óâ–æFW‚²’Â7G–ÆS¢²F—7Æ“¢&&Æö6²"Âv–GFƒ¢#R"Â†V–v‡C¢#R"Âö&¦V7Df—C¢&6öçF–â"ÒÒ“°§Ð¦gVæ7F–öâv–ææW%&WfVÄÖöFÂ‡²—FVÒÂöå&WGW&âÂ6Æ÷6TÖöFÂÒ’°¢6öç7BvÖWDg&ÖRÒ5õ$T5BçW6U&Vbƒ“°¢6öç7B¶F—6Ö—76–ærÂ6WDF—6Ö—76–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7BF—6Ö—72Ò‚’Óâ°¢–b†F—6Ö—76–ær¢&WGW&ã°¢6WDF—6Ö—76–ær‡G'VR“°¢v–æF÷rç6WEF–ÖV÷WB‚‚’Óâ°¢6Æ÷6TÖöFÃòâ‚“°¢v–æF÷rç6WEF–ÖV÷WB‚‚’Óâöå&WGW&ãòâ‚’Â“°¢ÒÂ3#“°¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢ÆWB&ÖVBÒfÇ6S°¢6öç7B&ÕF–ÖW"Òv–æF÷rç6WEF–ÖV÷WB‚‚’Óâ²&ÖVBÒG'VS²ÒÂ3S“°¢6öç7BF—6Ö—75v†Vä&ÖVBÒ‚’Óâ²–b†&ÖVB¢F—6Ö—72‚“²Ó°¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"ÂF—6Ö—75v†Vä&ÖVBÂG'VR“°¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚'ö–çFW&F÷vâ"ÂF—6Ö—75v†Vä&ÖVBÂG'VR“°¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚'F÷V6‡7F'B"ÂF—6Ö—75v†Vä&ÖVBÂG'VR“°¢ÆWB&Wf–÷W2Ò'&’æg&öÒ†æf–vF÷"ævWDvÖWG3òâ‚’ÇÂµÒ’æÖ‚‡B’ÓâCòæ'WGFöç2æÖ‚†'WGFöâ’Óâ'WGFöâç&W76VB’ÇÂµÒ“°¢6öç7BvF6‚Ò‚’Óâ°¢6öç7BG2Ò'&’æg&öÒ†æf–vF÷"ævWDvÖWG3òâ‚’ÇÂµÒ“°¢–b†&ÖVBbbG2ç6öÖR‚‡BÂ’’ÓâCòæ'WGFöç2ç6öÖR‚†'WGFöâÂ&’’Óâ'WGFöâç&W76VBbb&Wf–÷W5·•Óòå¶&•Ò’’¢F—6Ö—72‚“°¢VÇ6R°¢&Wf–÷W2ÒG2æÖ‚‡B’ÓâCòæ'WGFöç2æÖ‚†'WGFöâ’Óâ'WGFöâç&W76VB’ÇÂµÒ“°¢vÖWDg&ÖRæ7W'&VçBÒ&WVW7Dæ–ÖF–öäg&ÖR‡vF6‚“°¢Ð¢Ó°¢vÖWDg&ÖRæ7W'&VçBÒ&WVW7Dæ–ÖF–öäg&ÖR‡vF6‚“°¢&WGW&â‚’Óâ°¢6ÆV%F–ÖV÷WB†&ÕF–ÖW"“°¢Fö7VÖVçBç&VÖ÷fTWfVçDÆ—7FVæW"‚&¶W–F÷vâ"ÂF—6Ö—75v†Vä&ÖVBÂG'VR“°¢Fö7VÖVçBç&VÖ÷fTWfVçDÆ—7FVæW"‚'ö–çFW&F÷vâ"ÂF—6Ö—75v†Vä&ÖVBÂG'VR“°¢Fö7VÖVçBç&VÖ÷fTWfVçDÆ—7FVæW"‚'F÷V6‡7F'B"ÂF—6Ö—75v†Vä&ÖVBÂG'VR“°¢6æ6VÄæ–ÖF–öäg&ÖR†vÖWDg&ÖRæ7W'&VçB“°¢Ó°¢ÒÂ¶6Æ÷6TÖöFÂÂF—6Ö—76–æuÒ“°¢&WGW&â5ô¥5‚æ§7‡2„DdÂäÖöFÅ&ö÷BÂ²6Æ÷6TÖöFÃ¢F—6Ö—72Âöä6æ6VÃ¢F—6Ö—72Â$†–FT6Æ÷6T–6öã¢G'VRÂ6Æ74æÖS¢'6Ç2×v–ææW"Ö6öçFVçB"ÂÖöFÄ6Æ74æÖS¢'6Ç2×v–ææW"×6†VÆÂ"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7G–ÆR"Â²6†–ÆG&Vã¢ ¢ç6Ç2×v–ææW"×6†VÆÂ°¢÷6—F–öã¢f—†VB–×÷'FçC²–ç6WC¢–×÷'FçC°¢v–GFƒ¢gr–×÷'FçC²†V–v‡C¢f‚–×÷'FçC²Ö‚×v–GFƒ¢æöæR–×÷'FçC°¢Ö&v–ã¢–×÷'FçC²FF–æs¢–×÷'FçC²G&ç6f÷&Ó¢æöæR–×÷'FçC°¢&6¶w&÷VæC¢G&ç7&VçB–×÷'FçC²&÷‚×6†F÷s¢æöæR–×÷'FçC°¢&÷&FW#¢–×÷'FçC²÷fW&fÆ÷s¢f—6–&ÆR–×÷'FçC°¢Ð¢ç6Ç2×v–ææW"Ö6öçFVçB°¢v–GFƒ¢R–×÷'FçC²†V–v‡C¢R–×÷'FçC²Ö‚×v–GFƒ¢æöæR–×÷'FçC°¢Ö&v–ã¢–×÷'FçC²FF–æs¢–×÷'FçC°¢F—7Æ“¢w&–B–×÷'FçC²Æ6RÖ—FV×3¢6VçFW"–×÷'FçC°¢&6¶w&÷VæC¢G&ç7&VçB–×÷'FçC²&÷‚×6†F÷s¢æöæR–×÷'FçC°¢&÷&FW#¢–×÷'FçC²÷fW&fÆ÷s¢f—6–&ÆR–×÷'FçC°¢Ð¢¶W–g&ÖW26Ç2×v–ææW"ÖVçFW"²R²÷6—G“£²G&ç6f÷&Ó§66ÆR‚ãs"’G&ç6ÆFU’ƒ#G‚“²ÒcRR²÷6—G“£²G&ç6f÷&Ó§66ÆRƒãb’G&ç6ÆFU’‚Ów‚“²ÒR²G&ç6f÷&Ó§66ÆRƒ’G&ç6ÆFU’ƒ“²ÒÐ¢¶W–g&ÖW26Ç2×v–ææW"Ö–FÆR²RÃR²G&ç6f÷&Ó§G&ç6ÆFU’ƒ’&÷FFR‚Òã#VFVr“²ÒSR²G&ç6f÷&Ó§G&ç6ÆFU’‚Ó—‚’&÷FFR‚ã#VFVr“²ÒÐ¢¶W–g&ÖW26Ç2×v–ææW"×6†–æR²R²G&ç6f÷&Ó§G&ç6ÆFU‚‚ÓƒR’6¶Wu‚‚Ó#&FVr“²ÒSRRÃR²G&ç6f÷&Ó§G&ç6ÆFU‚ƒ#ƒR’6¶Wu‚‚Ó#&FVr“²ÒÐ¢¶W–g&ÖW26Ç2×v–ææW"ÖW†—B²g&öÒ²÷6—G“£²G&ç6f÷&Ó§66ÆRƒ“²ÒFò²÷6—G“£²G&ç6f÷&Ó§66ÆR‚ãƒ‚’G&ç6ÆFU’ƒ‡‚“²ÒÐ¢Ò’Â5ô¥5‚æ§7‚‚&F—b"Â²öåö–çFW$F÷vã¢F—6Ö—72Â7G–ÆS¢²÷6—F–öã¢'&VÆF—fR"Â¤–æFWƒ¢"Âv–GFƒ¢&Ö–â†6Æ2ƒgrÒcG‚’ÃC3‚’"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢v–GFƒ¢#R"ÂFW‡DÆ–vã¢&6VçFW""À¢æ–ÖF–öã¢F—6Ö—76–ærò'6Ç2×v–ææW"ÖW†—B3×2V6RÖ–â&÷F‚"¢'6Ç2×v–ææW"ÖVçFW"ƒS×27V&–2Ö&W¦–W"‚ã‚Âãƒ"Âã"Ã’&÷F‚"À¢ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²æ–ÖF–öã¢'6Ç2×v–ææW"Ö–FÆR72V6RÖ–âÖ÷WB2–æf–æ—FR"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢'&VÆF—fR"Âv–GFƒ¢#R"Â7V7E&F–ó¢#bò’"Â÷fW&fÆ÷s¢&†–FFVâ"Â&÷&FW%&F—W3¢"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒCVFVrÂ3#33SFÂ33#’’"Â&÷…6†F÷s¢##G‚S‡‚&v&ƒÃÃÂãƒ"’ÃCG‚&v&ƒ#SRÃ“ÃsRÂãC‚’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„vÖT'Gv÷&²Â²—FVÓ¢—FVÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"Â–ç6WC¢#WFò"Âv–GFƒ¢#3bR"Âæ–ÖF–öã¢'6Ç2×v–ææW"×6†–æRã‡2V6RÖ–âÖ÷WBc×2&÷F‚"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ“FVrÇG&ç7&VçBÇ&v&ƒ#SRÃ#SRÃ#SRÂãc"’ÇG&ç7&VçB’"Âf–ÇFW#¢&&ÇW"ƒ'‚’"ÒÒ•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢bÂ6öÆ÷#¢"6ff3“V2"ÂföçE6—¦S¢2ÂföçEvV–v‡C¢“ÂÆWGFW%76–æs¢ãbÒÂ6†–ÆG&Vã¢%t”ÄÂ$RDDTBDò”õU"Ä”%$%’"Ò’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢RÂföçE6—¦S¢#2ÂföçEvV–v‡C¢“ÂFW‡E6†F÷s¢#7‚'‚3"ÒÂ6†–ÆG&Vã¢—FVÒææÖRÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–åF÷¢‚Â6öÆ÷#¢"6vSv&""ÂföçE6—¦S¢rÂföçEvV–v‡C¢“ÂFW‡E6†F÷s¢#'‚—‚3"ÒÂ6†–ÆG&Vã¢²%4dTB"ÂF—7Æ•&–6R†—FVÒ•ÒÒ•ÒÒ’Ò’Ò•ÒÒ“°§Ð¦gVæ7F–öâF—7Æ•&–6R†—FVÒ’°¢–b‚—FVÒç&–6T6VçG2¢&WGW&â%7F÷&R&–6RVæf–Æ&ÆR#°¢G'’°¢&WGW&âæWr–çFÂäçVÖ&W$f÷&ÖB‚&VâÕU2"Â°¢7G–ÆS¢&7W'&Væ7’"Â7W'&Væ7“¢—FVÒæ7W'&Væ7’ÇÂ%U4B"À¢Ò’æf÷&ÖB†—FVÒç&–6T6VçG2ò“°¢Ð¢6F6‚°¢&WGW&âBG²†—FVÒç&–6T6VçG2ò’çFôf—†VBƒ"—Ö°¢Ð§Ð¦7–æ2gVæ7F–öâFEv–ææW%Fõ6Ç57FVÒ†—FVÒ’°¢6öç7B7F'FVBÒv—B7F'DFB†—FVÒæ–B“°¢–b‚7F'FVBç7V66W72¢F‡&÷ræWrW'&÷"‡7F'FVBæW'&÷"ÇÂ%4Å27FVÒ6÷VÆBæ÷B7F'BFF–ærF†Rv–ææW""“°¢f÷"†ÆWBGFV×BÒ²GFV×BÂ#C²GFV×B²²’°¢v—BæWr&öÖ—6R‚‡&W6öÇfR’Óâv–æF÷rç6WEF–ÖV÷WB‡&W6öÇfRÂsS’“°¢6öç7B&W7VÇBÒv—BvWDFE7FGW2†—FVÒæ–B“°¢–b‚&W7VÇBç7V66W72¢6öçF–çVS°¢6öç7B7FGW2Ò&W7VÇBç7FFSòç7FGW2ÇÂ"#°¢–b‡7FGW2ÓÓÒ&FöæR"¢&WGW&ã°¢–b‡7FGW2ÓÓÒ&f–ÆVB"ÇÂ7FGW2ÓÓÒ&6æ6VÆÆVB"’°¢F‡&÷ræWrW'&÷"‡&W7VÇBç7FFSòæW'&÷"ÇÂ4Å27FVÒFBG·7FGW7Ö“°¢Ð¢Ð¢F‡&÷ræWrW'&÷"‚%F–ÖVB÷WBv—F–ærf÷"4Å27FVÒFòFBF†Rv–ææ–ærvÖR"“°§Ð¦gVæ7F–öâÖ–æ–vÖU6V7F–öâ‡²ÖöFÄ6Æ÷6RÂöä'W7”6†ævRÂV–6´66W72ÒfÇ6RÒÒ·Ò’°¢6öç7Bf–Ww÷'BÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7Bæ–ÖF–öâÒ5õ$T5BçW6U&Vbƒ“°¢6öç7BvÖWEvF6‚Ò5õ$T5BçW6U&Vbƒ“°¢6öç7BF$F—6Ö—75F–ÖW"Ò5õ$T5BçW6U&Vbƒ“°¢6öç7BF$F—6Ö—76–æu&VbÒ5õ$T5BçW6U&Vb†fÇ6R“°¢6öç7B66U6÷VæG2Ò5õ$T5BçW6U&Vb…µÒ“°¢6öç7B&VfWF6…VWVRÒ5õ$T5BçW6U&Vb…µÒ“°¢6öç7B&VfWF6„vVæW&F–öâÒ5õ$T5BçW6U&Vbƒ“°¢6öç7B&VfWF6…'Vææ–ætvVæW&F–öâÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B&öÆÆVD–G2Ò5õ$T5BçW6U&Vb†æWr6WB‚’“°¢6öç7B¶—FV×2Â6WD—FV×5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶öfg6WBÂ6WDöfg6WEÒÒ5õ$T5BçW6U7FFRƒ“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·v–ææW"Â6WEv–ææW%ÒÒ5õ$T5BçW6U7FFR‚“°¢6öç7B·v–ææW$FFVBÂ6WEv–ææW$FFVEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶W'&÷"Â6WDW'&÷%ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶f–ÇFW'2Â6WDf–ÇFW'5ÒÒ5õ$T5BçW6U7FFR‡&VE&÷VÆWGFTf–ÇFW'2“°¢6öç7B¶f–ÇFW'4W‡æFVBÂ6WDf–ÇFW'4W‡æFVEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&WfVÅf—6–&ÆRÂ6WE&WfVÅf—6–&ÆUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·F%&WfVÄF—6Ö—76–ærÂ6WEF%&WfVÄF—6Ö—76–æuÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&WGW&æ–ætg&öÕv–ææW"Â6WE&WGW&æ–ætg&öÕv–ææW%ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7BÖ–å&–6RÒf–ÇFW'2ç&–6TVæ&ÆVBbbf–ÇFW'2ç&–6TF—&V7F–öâÓÓÒ&Ö–â"òf–ÇFW'2ç&–6T6VçG2¢°¢6öç7B7F—fTf–ÇFW$6÷VçBÒ†f–ÇFW'2ç&–6TVæ&ÆVBò¢’²°¢f–ÇFW'2çVÆ—G”ÖöFRÂf–ÇFW'2çW'6öæÆ—¦VBÂf–ÇFW'2ævVç&RÂf–ÇFW'2çÆ–W'2Âf–ÇFW'2æFV6²À¢âââ‚f–ÇFW'2çVÆ—G”ÖöFRò¶f–ÇFW'2æÖ–å&F–ærÂf–ÇFW'2æÖ–å&Wf–Ww5Ò¢µÒ’À¢f–ÇFW'2ç&VÆV6Tg&öÒÂf–ÇFW'2ç&VÆV6UFòÀ¢Òæf–ÇFW"„&ööÆVâ’æÆVæwFƒ°¢6öç7Bf–ÇFW$¶W’Ò¥4ôâç7G&–æv–g’†f–ÇFW'2“°¢6öç7BW†6ÇVFVDf÷$fWF6‚Ò‚’Óâ'&’æg&öÒ†æWr6WB…°¢ââæÆ—7DÆ–'&'”–G2‚’À¢ââä'&’æg&öÒ‡&öÆÆVD–G2æ7W'&VçB’À¢ââç&VfWF6…VWVRæ7W'&VçBæfÆDÖ‚‡&W7VÇB’Óâ&W7VÇBçv–ææW"ò·&W7VÇBçv–ææW"æ–EÒ¢µÒ’À¢Ò’“°¢6öç7Bf–ÆÅ&VfWF6…VWVRÒ7–æ2†vVæW&F–öâÒ&VfWF6„vVæW&F–öâæ7W'&VçB’Óâ°¢–b‡&VfWF6…'Vææ–ætvVæW&F–öâæ7W'&VçBÓÓÒvVæW&F–öâÇÂvVæW&F–öâÓÒ&VfWF6„vVæW&F–öâæ7W'&VçB¢&WGW&ã°¢&VfWF6…'Vææ–ætvVæW&F–öâæ7W'&VçBÒvVæW&F–öã°¢G'’°¢v†–ÆR†vVæW&F–öâÓÓÒ&VfWF6„vVæW&F–öâæ7W'&VçBbb&VfWF6…VWVRæ7W'&VçBæÆVæwF‚Â$TdUD4…ôDUD‚’°¢ÆWB&W7VÇC°¢G'’°¢&W7VÇBÒv—BÖ–æ–vÖU&öÆÂ†W†6ÇVFVDf÷$fWF6‚‚’ÂÖ–å&–6RÂf–ÇFW'2“°¢Ð¢6F6‚°¢òò&VfWF6‚—2FVÆ–&W&FVÇ’6–ÆVçBâÆFW"&Vf–ÆÂ÷"F—&V7B&öÆÀ¢òò&VÖ–ç2f–Æ&ÆRv†Vâ7FVÒ†2G&ç6–VçBf–ÇW&Rà¢'&V³°¢Ð¢–b†vVæW&F–öâÓÒ&VfWF6„vVæW&F–öâæ7W'&VçB¢'&V³°¢–b‚—5W6&ÆU&öÆÂ‡&W7VÇB’¢'&V³°¢–b‡&öÆÆVD–G2æ7W'&VçBæ†2‡&W7VÇBçv–ææW"æ–B¢ÇÂ&VfWF6…VWVRæ7W'&VçBç6öÖR‚‡VWVVB’ÓâVWVVBçv–ææW#òæ–BÓÓÒ&W7VÇBçv–ææW"æ–B’¢6öçF–çVS°¢&VfWF6…VWVRæ7W'&VçBçW6‚‡&W7VÇB“°¢Ð¢Ð¢f–æÆÇ’°¢–b‡&VfWF6…'Vææ–ætvVæW&F–öâæ7W'&VçBÓÓÒvVæW&F–öâ¢&VfWF6…'Vææ–ætvVæW&F–öâæ7W'&VçBÒçVÆÃ°¢Ð¢Ó°¢6öç7B6†ævTf–ÇFW"Ò†¶W’ÂfÇVR’Óâ°¢6öç7BæW‡BÒ²ââæf–ÇFW'2Â¶¶W•Ó¢fÇVRÓ°¢–b†æW‡Bç&VÆV6Tg&öÒbbæW‡Bç&VÆV6UFòbbæW‡Bç&VÆV6Tg&öÒâæW‡Bç&VÆV6UFò’°¢–b†¶W’ÓÓÒ'&VÆV6Tg&öÒ"¢æW‡Bç&VÆV6UFòÒæW‡Bç&VÆV6Tg&öÓ°¢VÇ6P¢æW‡Bç&VÆV6Tg&öÒÒæW‡Bç&VÆV6UFó°¢Ð¢6WDf–ÇFW'2†æW‡B“°¢w&—FU&÷VÆWGFTf–ÇFW'2†æW‡B“°¢6WDW'&÷"‚""“°¢Ó°¢6öç7BF—6Ö—75F%&WfVÂÒ‚’Óâ°¢–b‡F$F—6Ö—76–æu&Vbæ7W'&VçB¢&WGW&ã°¢F$F—6Ö—76–æu&Vbæ7W'&VçBÒG'VS°¢6WEF%&WfVÄF—6Ö—76–ær‡G'VR“°¢F$F—6Ö—75F–ÖW"æ7W'&VçBÒv–æF÷rç6WEF–ÖV÷WB‚‚’Óâ°¢6WE&WfVÅf—6–&ÆR†fÇ6R“°¢6WEF%&WfVÄF—6Ö—76–ær†fÇ6R“°¢F$F—6Ö—76–æu&Vbæ7W'&VçBÒfÇ6S°¢ÖöFÄ6Æ÷6Sòâ‚“°¢ÒÂ3#“°¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢66U6÷VæG2æ7W'&VçBÒ¶æWrVF–ò„44Uõ4õTäEõU$Â’ÂæWrVF–ò„44Uõ4õTäEõU$Â•Ó°¢66U6÷VæG2æ7W'&VçBæf÷$V6‚‚‡6÷VæB’Óâ°¢6÷VæBç&VÆöBÒ&WFò#°¢6÷VæBçföÇVÖRÒ°¢Ò“°¢&WGW&â‚’Óâ°¢6æ6VÄæ–ÖF–öäg&ÖR†æ–ÖF–öâæ7W'&VçB“°¢6æ6VÄæ–ÖF–öäg&ÖR†vÖWEvF6‚æ7W'&VçB“°¢6ÆV%F–ÖV÷WB‡F$F—6Ö—75F–ÖW"æ7W'&VçB“°¢66U6÷VæG2æ7W'&VçBæf÷$V6‚‚‡6÷VæB’Óâ6÷VæBçW6R‚’“°¢66U6÷VæG2æ7W'&VçBÒµÓ°¢Ó°¢ÒÂµÒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢6öç7BvVæW&F–öâÒ²·&VfWF6„vVæW&F–öâæ7W'&VçC°¢&VfWF6…VWVRæ7W'&VçBÒµÓ°¢òò6Æ–FW$f–VÆBVÖ—G26öçF–çV÷W6Ç’v†–ÆR—BÖ÷fW2âFV&÷Væ6R–çf—6–&ÆP¢òò&W&F–öâ6òG&vv–ær—BFöW2æ÷BÆVæ6‚&WVW7Bf÷"WfW'’FöÆÆ"à¢6öç7BF–ÖW"Òv–æF÷rç6WEF–ÖV÷WB‚‚’Óâfö–Bf–ÆÅ&VfWF6…VWVR†vVæW&F–öâ’Â3S“°¢&WGW&â‚’Óâ°¢6ÆV%F–ÖV÷WB‡F–ÖW"“°¢–b‡&VfWF6„vVæW&F–öâæ7W'&VçBÓÓÒvVæW&F–öâ¢²·&VfWF6„vVæW&F–öâæ7W'&VçC°¢Ó°¢ÒÂ¶f–ÇFW$¶W•Ò“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢–b‚&WfVÅf—6–&ÆR¢&WGW&ã°¢6öç7BF—6Ö—72Ò‚’ÓâF—6Ö—75F%&WfVÂ‚“°¢6öç7BvF6†VDWfVçG2Ò²&¶W–F÷vâ"Â'ö–çFW&F÷vâ"Â&Ö÷W6VF÷vâ"Â&6Æ–6²"Â'F÷V6‡7F'B"Â'F÷V6†VæB%Ó°¢vF6†VDWfVçG2æf÷$V6‚‚†æÖR’ÓâFö7VÖVçBæFDWfVçDÆ—7FVæW"†æÖRÂF—6Ö—72ÂG'VR’“°¢ÆWB&Wf–÷W4'WGFöç2Ò'&’æg&öÒ†æf–vF÷"ævWDvÖWG3òâ‚’ÇÂµÒ’æÖ‚‡B’ÓâBòBæ'WGFöç2æÖ‚†'WGFöâ’Óâ'WGFöâç&W76VB’¢µÒ“°¢6öç7BvF6„vÖWBÒ‚’Óâ°¢6öç7BG2Ò'&’æg&öÒ†æf–vF÷"ævWDvÖWG3òâ‚’ÇÂµÒ“°¢6öç7BæWvÇ•&W76VBÒG2ç6öÖR‚‡BÂD–æFW‚’ÓâCòæ'WGFöç2ç6öÖR‚†'WGFöâÂ'WGFöä–æFW‚’Óâ'WGFöâç&W76VBbb&Wf–÷W4'WGFöç5·D–æFW…Óòå¶'WGFöä–æFW…Ò’“°¢–b†æWvÇ•&W76VB¢F—6Ö—72‚“°¢VÇ6R°¢&Wf–÷W4'WGFöç2ÒG2æÖ‚‡B’ÓâBòBæ'WGFöç2æÖ‚†'WGFöâ’Óâ'WGFöâç&W76VB’¢µÒ“°¢vÖWEvF6‚æ7W'&VçBÒ&WVW7Dæ–ÖF–öäg&ÖR‡vF6„vÖWB“°¢Ð¢Ó°¢vÖWEvF6‚æ7W'&VçBÒ&WVW7Dæ–ÖF–öäg&ÖR‡vF6„vÖWB“°¢&WGW&â‚’Óâ°¢vF6†VDWfVçG2æf÷$V6‚‚†æÖR’ÓâFö7VÖVçBç&VÖ÷fTWfVçDÆ—7FVæW"†æÖRÂF—6Ö—72ÂG'VR’“°¢6æ6VÄæ–ÖF–öäg&ÖR†vÖWEvF6‚æ7W'&VçB“°¢Ó°¢ÒÂ·&WfVÅf—6–&ÆRÂF%&WfVÄF—6Ö—76–ærÂÖöFÄ6Æ÷6UÒ“°¢6öç7B÷Våv–ææW"Ò‚’Óâ°¢–b‚v–ææW"¢&WGW&ã°¢G'’°¢–b‡v–ææW$FFVB¢DdÂäæf–vF–öâäæf–vFR†öÆ–'&'’öòG·v–ææW"æ–GÖ“°¢VÇ6P¢DdÂäæf–vF–öâäæf–vFUFôW‡FW&æÅvV"†‡GG3¢ò÷7F÷&Rç7FV×÷vW&VBæ6öÒöòG·v–ææW"æ–GÖ“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢Ó°¢6öç7B&öÆÂÒ7–æ2‚’Óâ°¢–b†'W7’¢&WGW&ã°¢6æ6VÄæ–ÖF–öäg&ÖR†æ–ÖF–öâæ7W'&VçB“°¢6WE&WfVÅf—6–&ÆR†fÇ6R“°¢6WD'W7’‡G'VR“°¢6WEv–ææW"‡VæFVf–æVB“°¢6WEv–ææW$FFVB†fÇ6R“°¢6WDW'&÷"‚""“°¢6WD—FV×2…µÒ“°¢6WDöfg6WBƒ“°¢öä'W7”6†ævSòâ‡G'VR“°¢G'’°¢òò&VfW"â–çf—6–&ÆR&W&VB&öÆÂâ–bF†RW6W"÷Vç2F†RT’æB&öÆÇ0¢òò&Vf÷&RöæR—2&VG’Â&W6W'fRF†R÷&–v–æÂöâÖFVÖæBfWF6‚&V†f–÷"à¢ÆWB&W7VÇBÒ&VfWF6…VWVRæ7W'&VçBç6†–gB‚“°¢–b‚&W7VÇB¢&W7VÇBÒv—BÖ–æ–vÖU&öÆÂ†W†6ÇVFVDf÷$fWF6‚‚’ÂÖ–å&–6RÂf–ÇFW'2“°¢–b‚—5W6&ÆU&öÆÂ‡&W7VÇB’’°¢F‡&÷ræWrW'&÷"‡&W7VÇBæW'&÷"ÇÂ%F†R7FVÒ7F÷&RF–Bæ÷B&WGW&âvÖR"“°¢Ð¢&öÆÆVD–G2æ7W'&VçBæFB‡&W7VÇBçv–ææW"æ–B“°¢&VfWF6…VWVRæ7W'&VçBÒ&VfWF6…VWVRæ7W'&VçBæf–ÇFW"‚‡VWVVB’ÓâVWVVBçv–ææW#òæ–BÓÒ&W7VÇBçv–ææW"æ–B“°¢fö–Bf–ÆÅ&VfWF6…VWVR‚“°¢6öç7BFE&W7VÇBÒFEv–ææW%Fõ6Ç57FVÒ‡&W7VÇBçv–ææW"’çF†Vâ‚‚’Óâ‡²7V66W73¢G'VRÒ’Â†6W6R’Óâ‡²7V66W73¢fÇ6RÂW'&÷#¢7G&–ær†6W6SòæÖW76vRÇÂ6W6R’Ò’“°¢6WD—FV×2‡&W7VÇBæ—FV×2“°¢v—BæWr&öÖ—6R‚‡&W6öÇfR’Óâ&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ&WVW7Dæ–ÖF–öäg&ÖR‡&W6öÇfR’’“°¢G'’°¢66U6÷VæG2æ7W'&VçBæf÷$V6‚‚‡6÷VæB’Óâ°¢6÷VæBæ7W'&VçEF–ÖRÒ°¢fö–B6÷VæBçÆ’‚“°¢Ò“°¢Ð¢6F6‚²ò¢f—7VÂ÷Væ–ær7F–ÆÂv÷&·2–b&VÖ÷FRVF–ò—2Væf–Æ&ÆR¢òÐ¢6öç7Bv–GF‚Òf–Ww÷'Bæ7W'&VçCòæ6Æ–VçEv–GF‚ÇÂsc°¢6öç7BF&vWBÒÖF‚æÖ‚ƒÂ&W7VÇBçv–ææW$–æFW‚¢„4$Eõt”ED‚²4$Eôt’²4$Eõt”ED‚ò"Òv–GF‚ò"“°¢6öç7B7F'FVBÒW&f÷&Öæ6Rææ÷r‚“°¢6öç7Bg&ÖRÒ†æ÷r’Óâ°¢6öç7B&öw&W72ÒÖF‚æÖ–âƒÂ†æ÷rÒ7F'FVB’òEU$D”ôâ“°¢6öç7BV6VBÒÒÖF‚ç÷rƒÒ&öw&W72ÂB“°¢6öç7B÷6—F–öâÒF&vWB¢V6VC°¢6WDöfg6WB‡÷6—F–öâ“°¢–b‡&öw&W72Â¢æ–ÖF–öâæ7W'&VçBÒ&WVW7Dæ–ÖF–öäg&ÖR†g&ÖR“°¢VÇ6R°¢6WEv–ææW"‡&W7VÇBçv–ææW"“°¢6WD'W7’†fÇ6R“°¢öä'W7”6†ævSòâ†fÇ6R“°¢–b‡V–6´66W72’°¢6WE&WfVÅf—6–&ÆR†fÇ6R“°¢DdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚…v–ææW%&WfVÄÖöFÂÂ²—FVÓ¢&W7VÇBçv–ææW"Âöå&WGW&ã¢‚’Óâ°¢6WE&WGW&æ–ætg&öÕv–ææW"‡G'VR“°¢v–æF÷rç6WEF–ÖV÷WB‚‚’Óâ6WE&WGW&æ–ætg&öÕv–ææW"†fÇ6R’ÂS#“°¢ÒÒ’“°¢Ð¢VÇ6R°¢F$F—6Ö—76–æu&Vbæ7W'&VçBÒfÇ6S°¢6WEF%&WfVÄF—6Ö—76–ær†fÇ6R“°¢6WE&WfVÅf—6–&ÆR‡G'VR“°¢Ð¢fö–BFE&W7VÇBçF†Vâ‚†FFVB’Óâ°¢–b‚FFVBç7V66W72’°¢6WEv–ææW$FFVB†fÇ6R“°¢6WDW'&÷"†v–ææW"6VÆV7FVBÂ'WB—Bv2æ÷BFFVC¢G¶FFVBæW'&÷'Ö“°¢&WGW&ã°¢Ð¢6WEv–ææW$FFVB‡G'VR“°¢Ò“°¢Ð¢Ó°¢æ–ÖF–öâæ7W'&VçBÒ&WVW7Dæ–ÖF–öäg&ÖR†g&ÖR“°¢Ð¢6F6‚†6W6R’°¢6WDW'&÷"…7G&–ær†6W6SòæÖW76vRÇÂ6W6R’“°¢6WD'W7’†fÇ6R“°¢öä'W7”6†ævSòâ†fÇ6R“°¢Ð¢Ó°¢6öç7B&÷VÆWGFUv–æF÷rÒ5ô¥5‚æ§7‡2‚&F—b"Â²&Vc¢f–Ww÷'BÂ7G–ÆS¢°¢÷6—F–öã¢'&VÆF—fR"Âv–GFƒ¢#R"Â†V–v‡C¢V–6´66W72ò#¢cÂ÷fW&fÆ÷s¢&†–FFVâ"Â&÷&FW%&F—W3¢À¢&÷&FW#¢#‚6öÆ–B&v&ƒRÂ“Â#SRÂã3B’"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒƒFVrÂ3#C#Â3C&"’"À¢&÷…6†F÷s¢&–ç6WB3g‚&v&ƒÃÃÂãcR’Â‡‚#G‚&v&ƒÃÃÂã#b’"À¢æ–ÖF–öã¢&WGW&æ–ætg&öÕv–ææW"ò'6Ç2×&÷VÆWGFR×&WGW&âCƒ×2V6RÖ÷WB&÷F‚"¢VæFVf–æVBÀ¢ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7G–ÆR"Â²6†–ÆG&Vã¢¶W–g&ÖW26Ç2×&÷VÆWGFR×&WGW&â²g&öÒ²÷6—G“¢ãSƒ²f–ÇFW#¦&ÇW"ƒW‚’'&–v‡FæW72‚ãc‚“²ÒFò²÷6—G“£²f–ÇFW#¦&ÇW"ƒ’'&–v‡FæW72ƒ“²ÒÖÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"Â¤–æFWƒ¢BÂÆVgC¢#SR"ÂF÷¢Â&÷GFöÓ¢Âv–GFƒ¢"ÂG&ç6f÷&Ó¢'G&ç6ÆFU‚‚Ó‚’"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçB‚6ffCƒfÂ6fc–33"Â6ffCƒf’"Â&÷…6†F÷s¢#7‚6ff##6b"ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"Â¤–æFWƒ¢RÂÆVgC¢#SR"ÂF÷¢ÂG&ç6f÷&Ó¢'G&ç6ÆFU‚‚ÓSR’"Âv–GFƒ¢Â†V–v‡C¢Â&÷&FW$ÆVgC¢#‡‚6öÆ–BG&ç7&VçB"Â&÷&FW%&–v‡C¢#‡‚6öÆ–BG&ç7&VçB"Â&÷&FW%F÷¢#‚6öÆ–B6ffCƒf"ÒÒ’Â—FV×2æÆVæwF‚bb'W7’bb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"Â¤–æFWƒ¢2Â–ç6WC¢ÂF—7Æ“¢&w&–B"ÂÆ6T—FV×3¢&6VçFW""ÂFW‡DÆ–vã¢&6VçFW""Â&6¶w&÷VæC¢V–6´66W72ò'&v&ƒRÃÃrÂãS‚’"¢'G&ç7&VçB"ÂÆWGFW%76–æs¢ãRÒÂ6†–ÆG&Vã¢$ÄôD”ärD„R5DTÒ5Dõ$UÇS##b"Ò’ÂV–6´66W72bb—FV×2æÆVæwF‚bb'W7’bb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²†V–v‡C¢#R"ÂF—7Æ“¢&w&–B"ÂÆ6T—FV×3¢&6VçFW""ÂFW‡DÆ–vã¢&6VçFW""Â÷6—G“¢ãc"ÂÆWGFW%76–æs¢ãRÒÂ6†–ÆG&Vã¢$$äDôÒtÔRt•E2"Ò’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"Âv¢4$EôtÂ†V–v‡C¢#R"ÂFF–æs¢#‚"ÂG&ç6f÷&Ó¢G&ç6ÆFS6B‚G²Ööfg6WG×‚ÃÃ–Âv–ÆÄ6†ævS¢'G&ç6f÷&Ò"ÒÂ6†–ÆG&Vã¢·V–6´66W72bb—FV×2æÆVæwF‚bbÄ4T„ôÄDU%ô4$E2æÖ‚†Æ&VÂÂ–æFW‚’Óâ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢÷6—F–öã¢'&VÆF—fR"ÂfÆWƒ¢G´4$Eõt”ED‡×†Â†V–v‡C¢V–6´66W72ò“¢CÂ÷fW&fÆ÷s¢&†–FFVâ"Â&÷&FW%&F—W3¢‚À¢&÷&FW#¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÂãB’"Â&÷&FW$&÷GFöÓ¢G‚6öÆ–BG¶–æFW‚ÓÓÒ"ò"6ff3“V2"¢"3VF#vS‚'ÖÀ¢&6¶w&÷VæC¢–æFW‚ÓÓÒ"ò'&F–ÂÖw&F–VçB†6—&6ÆRBSRCRRÇ&v&ƒ#SRÃ“bÃsbÂã#"’ÇG&ç7&VçBc"R’ÆÆ–æV"Öw&F–VçBƒCVFVrÂ3#c3“FBÂ3#r’"¢&Æ–æV"Öw&F–VçBƒCVFVrÂ3#33SFÂ33#’’"À¢&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"ÂF—7Æ“¢&w&–B"ÂÆ6T—FV×3¢&6VçFW""Â6öÆ÷#¢–æFW‚ÓÓÒ"ò"6ffCƒs‚"¢'&v&ƒ#SRÃ#SRÃ#SRÂã2’"À¢föçE6—¦S¢Æ&VÂæÆVæwF‚âò#B¢SBÂföçEvV–v‡C¢“ÂÆWGFW%76–æs¢Æ&VÂæÆVæwF‚âò2¢À¢ÒÂ6†–ÆG&Vã¢Æ&VÂÒÂÆ6V†öÆFW"ÒG¶–æFW‡Ö’’Â—FV×2æÖ‚†—FVÒÂ–æFW‚’Óâ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢÷6—F–öã¢'&VÆF—fR"ÂfÆWƒ¢G´4$Eõt”ED‡×†Â†V–v‡C¢V–6´66W72ò“¢CÂ÷fW&fÆ÷s¢&†–FFVâ"Â&÷&FW%&F—W3¢‚À¢&÷&FW#¢#‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÂãB’"Â&÷&FW$&÷GFöÓ¢G‚6öÆ–BG¶–æFW‚RÓÓÒò"6C“f6fb"¢–æFW‚RRÓÓÒò"3†Cv&fb"¢"3VF#vS‚'ÖÀ¢&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒCVFVrÂ3#33SFÂ33#’’"Â&÷…6—¦–æs¢&&÷&FW"Ö&÷‚"À¢ÒÂ6†–ÆG&Vã¢V–6´66W72ò5ô¥5‚æ§7‚„vÖT'Gv÷&²Â²—FVÓ¢—FVÒÒ’¢5ô¥5‚æ§7‚‚&–Ör"Â²7&3¢—FVÒæ–ÖvRÂÇC¢""ÂöäW'&÷#¢†WfVçB’Óâ²WfVçBæ7W'&VçEF&vWBç7G–ÆRæF—7Æ’Ò&æöæR#²ÒÂ7G–ÆS¢²v–GFƒ¢#R"Â†V–v‡C¢#R"Âö&¦V7Df—C¢&6öçF–â"Â÷6—G“¢ã“"ÒÒ’ÒÂG¶—FVÒæ–GÒÒG¶–æFW‡Ö’•ÒÒ•ÒÒ“°¢&WGW&â5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢²V–6´66W72bbv–ææW"bb&WfVÅf—6–&ÆRbb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢°¢÷6—F–öã¢&f—†VB"Â¤–æFWƒ¢“““““’Â–ç6WC¢ÂF—7Æ“¢&w&–B"ÂÆ6T—FV×3¢&6VçFW""À¢ö–çFW$WfVçG3¢&WFò"Â&6¶w&÷VæC¢'&F–ÂÖw&F–VçB†6—&6ÆRÇ&v&ƒ#Ã32ÃC‚Âãc‚’Ç&v&ƒÃÃÂãr’S‚RÇ&v&ƒÃÃÂãs‚’’"À¢&6¶G&÷f–ÇFW#¢&&ÇW"ƒ'‚’"Â—6öÆF–öã¢&—6öÆFR"À¢æ–ÖF–öã¢F%&WfVÄF—6Ö—76–ærò'6Ç2×F"Ö&6¶G&÷ÖW†—B3×2V6RÖ–â&÷F‚"¢VæFVf–æVBÀ¢ÒÂöåö–çFW$F÷vã¢F—6Ö—75F%&WfVÂÂöåF÷V6…7F'C¢F—6Ö—75F%&WfVÂÂöä6Æ–6³¢F—6Ö—75F%&WfVÂÂ6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²v–GFƒ¢&Ö–âƒs'grÂC3‚’"ÂFW‡DÆ–vã¢&6VçFW""Â÷6—F–öã¢'&VÆF—fR"Âæ–ÖF–öã¢F%&WfVÄF—6Ö—76–ærò'6Ç2×F"Ö6&BÖW†—B3×2V6RÖ–â&÷F‚"¢VæFVf–æVBÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7G–ÆR"Â²6†–ÆG&Vã¢ ¢¶W–g&ÖW26Ç2ÖvÖR×VæÆö6¶VB²R²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFU’ƒ#‡‚’66ÆR‚ãs‚“²f–ÇFW#¢&ÇW"ƒw‚“²ÒS‚R²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFU’‚Ó—‚’66ÆRƒãcR“²f–ÇFW#¢&ÇW"ƒ“²Òs‚R²G&ç6f÷&Ó¢G&ç6ÆFU’ƒ7‚’66ÆR‚ã“ƒR“²ÒR²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFU’ƒ’66ÆRƒ“²ÒÐ¢¶W–g&ÖW26Ç2×VæÆö6²Ö'W'7B²R²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFR‚ÓSRÂÓSR’66ÆR‚ã#R’&÷FFRƒ“²Ò3‚R²÷6—G“¢ãƒS²ÒR²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFR‚ÓSRÂÓSR’66ÆRƒãR’&÷FFRƒ#VFVr“²ÒÐ¢¶W–g&ÖW26Ç2×VæÆö6²ÖfÆ6‚²RÃR²÷6—G“¢²Ò‚R²÷6—G“¢ã“²ÒCRR²÷6—G“¢²ÒÐ¢¶W–g&ÖW26Ç2×VæÆö6²×'F–6ÆR²R²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFU’ƒ’66ÆR‚ã2“²Ò‚R²÷6—G“¢²ÒR²÷6—G“¢²G&ç6f÷&Ó¢G&ç6ÆFU’‚Ó#W‚’66ÆRƒ“²ÒÐ¢¶W–g&ÖW26Ç2Ö6÷fW"ÖfÆöB²RÃR²G&ç6f÷&Ó¢G&ç6ÆFU’ƒ“²ÒSR²G&ç6f÷&Ó¢G&ç6ÆFU’‚Ów‚“²ÒÐ¢¶W–g&ÖW26Ç2Ö6÷fW"×6†–æR²R²G&ç6f÷&Ó¢G&ç6ÆFU‚‚ÓsR’6¶Wu‚‚Ó#&FVr“²ÒC‚RÃR²G&ç6f÷&Ó¢G&ç6ÆFU‚ƒ#cR’6¶Wu‚‚Ó#&FVr“²ÒÐ¢¶W–g&ÖW26Ç2×VæÆö6²×F—FÆR²R²÷6—G“¢²G&ç6f÷&Ó¢66ÆR‚ãsR“²FW‡B×6†F÷s¢G&ç7&VçC²ÒSRR²÷6—G“¢²G&ç6f÷&Ó¢66ÆRƒã2“²FW‡B×6†F÷s¢‡‚6ff3“V3²ÒR²G&ç6f÷&Ó¢66ÆRƒ“²FW‡B×6†F÷s¢w‚&v&ƒ#SRÃ#Ã“"ÂãCR“²ÒÐ¢¶W–g&ÖW26Ç2×F"Ö&6¶G&÷ÖW†—B²g&öÒ²÷6—G“£²ÒFò²÷6—G“£²ÒÐ¢¶W–g&ÖW26Ç2×F"Ö6&BÖW†—B²g&öÒ²G&ç6f÷&Ó§66ÆRƒ’G&ç6ÆFU’ƒ“²ÒFò²G&ç6f÷&Ó§66ÆR‚ã’’G&ç6ÆFU’ƒ‡‚“²ÒÐ¢Ò’Â5ô¥5‚æ§7‡2‚&F—b"Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢'&VÆF—fR"Âv–GFƒ¢#R"ÂÖ–ä†V–v‡C¢#CÂF—7Æ“¢&w&–B"ÂÆ6T—FV×3¢&6VçFW""ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"ÂÆVgC¢#SR"ÂF÷¢#SR"Âv–GFƒ¢3Â†V–v‡C¢3Â&÷&FW%&F—W3¢#SR"Âæ–ÖF–öã¢'6Ç2×VæÆö6²Ö'W'7BãW2V6RÖ÷WB&÷F‚"Â&6¶w&÷VæC¢'&WVF–ærÖ6öæ–2Öw&F–VçB†g&öÒFVrÂ&v&ƒ#SRÃ#"ÃƒrÂãsR’FVrVFVrÂG&ç7&VçBVFVrvFVr’"Âf–ÇFW#¢&&ÇW"ƒ‚’"ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"Â–ç6WC¢Â&÷&FW%&F—W3¢#SR"Âæ–ÖF–öã¢'6Ç2×VæÆö6²ÖfÆ6‚“×2V6RÖ÷WB&÷F‚"Â&6¶w&÷VæC¢'&F–ÂÖw&F–VçB†6—&6ÆRÇ&v&ƒ#SRÃ#CbÃ#"ÂãƒR’Ç&v&ƒ#SRÃ“2Ãs2Âã#B’3RRÇG&ç7&VçBc‚R’"ÒÒ’Â'&’æg&öÒ‡²ÆVæwFƒ¢"ÒÂ…òÂ–æFW‚’Óâ5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"ÂÆVgC¢#SR"ÂF÷¢#SR"Âv–GFƒ¢BÂ†V–v‡C¢BÂG&ç6f÷&Ó¢&÷FFR‚G¶–æFW‚¢3ÖFVr–ÂG&ç6f÷&Ô÷&–v–ã¢#"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‚‚'7â"Â²7G–ÆS¢²F—7Æ“¢&&Æö6²"Âv–GFƒ¢–æFW‚R2ÓÓÒòr¢BÂ†V–v‡C¢–æFW‚R2ÓÓÒòr¢BÂ&÷&FW%&F—W3¢–æFW‚R"ò#SR"¢Â&6¶w&÷VæC¢–æFW‚R"ò"6ffcB"¢"6ffC6B"Â&÷…6†F÷s¢#‡‚6ff3CVB"Âæ–ÖF–öã¢6Ç2×VæÆö6²×'F–6ÆRG³sc²†–æFW‚RB’¢“Ö×2V6RÖ÷WBG¶–æFW‚¢#GÖ×2&÷F†ÒÒ’ÒÂ–æFW‚’’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢'&VÆF—fR"Â¤–æFWƒ¢"ÂF—7Æ“¢&–æÆ–æRÖ&Æö6²"ÂÖ…v–GFƒ¢#sbR"Â&÷&FW%&F—W3¢Â÷fW&fÆ÷s¢&†–FFVâ"Âæ–ÖF–öã¢'6Ç2ÖvÖR×VæÆö6¶VBƒ#×27V&–2Ö&W¦–W"‚ã‚Âãƒ"Âã"Ã’&÷F‚"Â&÷…6†F÷s¢##'‚C‡‚&v&ƒÃÃÂãs"’ÂC‚&v&ƒ#SRÃ“ÃsRÂã3‚’"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢'&VÆF—fR"Âæ–ÖF–öã¢'6Ç2Ö6÷fW"ÖfÆöB72V6RÖ–âÖ÷WBãW2–æf–æ—FR"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&–Ör"Â²7&3¢‡GG3¢òö6Fâæ6Æ÷VFfÆ&Rç7FV×7FF–2æ6öÒ÷7FVÒö2òG·v–ææW"æ–GÒöÆ–'&'•ócƒ“ó'‚æ§vÂÇC¢""ÂöäW'&÷#¢†WfVçB’Óâ²–b†WfVçBæ7W'&VçEF&vWBæFF6WBæfÆÆ&6²¢&WGW&ã²WfVçBæ7W'&VçEF&vWBæFF6WBæfÆÆ&6²Ò##²WfVçBæ7W'&VçEF&vWBç7&2Òv–ææW"æ–ÖvS²ÒÂ7G–ÆS¢²F—7Æ“¢&&Æö6²"Âv–GFƒ¢#R"ÂÖ„†V–v‡C¢33Âö&¦V7Df—C¢&6öçF–â"ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²÷6—F–öã¢&'6öÇWFR"Â¤–æFWƒ¢2ÂF÷¢Â&÷GFöÓ¢ÂÆVgC¢Âv–GFƒ¢#3‚R"Âæ–ÖF–öã¢'6Ç2Ö6÷fW"×6†–æRã‡2V6RÖ–âÖ÷WBs×2&÷F‚"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ“FVrÇG&ç7&VçBÇ&v&ƒ#SRÃ#SRÃ#SRÂãcR’ÇG&ç7&VçB’"Âf–ÇFW#¢&&ÇW"ƒ'‚’"ÒÒ•ÒÒ’Ò•ÒÒ’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"Â6öÆ÷#¢"6ff3“V2"ÂföçEvV–v‡C¢“ÂÆWGFW%76–æs¢ãRÂæ–ÖF–öã¢'6Ç2×VæÆö6²×F—FÆRƒS×2V6RÖ÷WB#S×2&÷F‚"ÒÂ6†–ÆG&Vã¢$tÔRTäÄô4´TB"Ò’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢#2ÂföçEvV–v‡C¢“ÂÖ&v–åF÷¢RÂFW‡E6†F÷s¢#7‚'‚3"ÒÂ6†–ÆG&Vã¢v–ææW"ææÖRÒ’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢rÂ6öÆ÷#¢"6vSv&""ÂföçEvV–v‡C¢“ÂÖ&v–åF÷¢‚ÂFW‡E6†F÷s¢#'‚—‚3"ÒÂ6†–ÆG&Vã¢²%4dTB"ÂF—7Æ•&–6R‡v–ææW"•ÒÒ•ÒÒ•ÒÒ’Ò’ÂV–6´66W72ò5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢°¢÷6—F–öã¢&f—†VB"Â¤–æFWƒ¢ÂÆVgC¢#SR"ÂF÷¢#SR"ÂG&ç6f÷&Ó¢'G&ç6ÆFR‚ÓSRÂÓSR’"À¢v–GFƒ¢&Ö–âƒsggrÂƒ#‚’"ÂÖ&v–ã¢À¢ÒÂ6†–ÆG&Vã¢·&÷VÆWGFUv–æF÷rÂW'&÷"bb5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²6öÆ÷#¢"6fc†#ƒ2"ÂföçE6—¦S¢ÂÖ&v–åF÷¢‚ÒÂ6†–ÆG&Vã¢W'&÷"Ò’Â5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²F—6&ÆVC¢'W7’Âöä6Æ–6³¢&öÆÂÂ7G–ÆS¢²v–GFƒ¢#R"ÂÖ&v–åF÷¢ÒÂ6†–ÆG&Vã¢'W7’ò%&öÆÆ–æ~(
b"¢%&öÆÂvÖR"Ò•ÒÒ’¢5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%7F÷&R&÷VÆWGFR"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ6WDf–ÇFW'4W‡æFVB‚†W‡æFVB’ÓâW‡æFVB’Â6†–ÆG&Vã¢²%&÷VÆWGFRf–ÇFW'2ÇS#r"Â7F—fTf–ÇFW$6÷VçBòG¶7F—fTf–ÇFW$6÷VçGÒ7F—fV¢%&æFöÒ"Â""Âf–ÇFW'4W‡æFVBò.)k""¢.)kÂ%ÒÒ’Ò’Âf–ÇFW'4W‡æFVBbb5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%&–6Rf–ÇFW""ÂFW67&—F–öã¢f–ÇFW'2ç&–6TVæ&ÆV@¢òG¶f–ÇFW'2ç&–6TF—&V7F–öâÓÓÒ&Ö–â"ò$BÆV7B"¢$BÖ÷7B'ÒBG¶f–ÇFW'2ç&–6T6VçG2òÒG¶f–ÇFW'2ç&–6TF—&V7F–öâÓÓÒ&Ö–â"bbf–ÇFW'2ç&–6T6VçG2ÓÓÒò"²"¢"'Ö ¢¢$öfb¶VW2&–6R&æFöÒ"Â6†V6¶VC¢f–ÇFW'2ç&–6TVæ&ÆVBÂöä6†ævS¢‡fÇVR’Óâ6†ævTf–ÇFW"‚'&–6TVæ&ÆVB"ÂfÇVR’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%&–6R'VÆR"Â&t÷F–öç3¢$”4UôD•$T5D”ôåôõD”ôå2ÂF—6&ÆVC¢f–ÇFW'2ç&–6TVæ&ÆVBÂ6VÆV7FVD÷F–öã¢f–ÇFW'2ç&–6TF—&V7F–öâÂ7G$FVfVÇDÆ&VÃ¢f–ÇFW'2ç&–6TF—&V7F–öâÓÓÒ&Ö‚"ò$BÖ÷7B"¢$BÆV7B"Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚'&–6TF—&V7F–öâ"Â÷F–öâæFFÓÓÒ&Ö‚"ò&Ö‚"¢&Ö–â"’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂå6Æ–FW$f–VÆBÂ²Æ&VÃ¢%&–6RF‡&W6†öÆB"ÂFW67&—F–öã¢f–ÇFW'2ç&–6T6VçG2ÓÓÒ ¢ò†f–ÇFW'2ç&–6TF—&V7F–öâÓÓÒ&Ö–â"ò"C²VæGö–çB"¢"CÖ†–×VÒ"¢¢G¶f–ÇFW'2ç&–6TF—&V7F–öâÓÓÒ&Ö–â"ò$vÖW26÷7F–ærBÆV7B"¢$vÖW26÷7F–ærBÖ÷7B'ÒBG¶f–ÇFW'2ç&–6T6VçG2òÖÂfÇVS¢ÖF‚ç&÷VæB†f–ÇFW'2ç&–6T6VçG2ò’ÂÖ–ã¢ÂÖƒ¢Â7FW¢Âæ÷F6„6÷VçC¢RÂæ÷F6…F–6·5f—6–&ÆS¢G'VRÂ6†÷ufÇVS¢G'VRÂVF—F&ÆUfÇVS¢G'VRÂfÇVU7Vff—ƒ¢"U4B"ÂÖ–æ–×VÔGDw&çVÆ&—G“¢ÂF—6&ÆVC¢f–ÇFW'2ç&–6TVæ&ÆVBÂöä6†ævS¢‡fÇVR’Óâ6†ævTf–ÇFW"‚'&–6T6VçG2"ÂÖF‚æÖ‚ƒÂÖF‚æÖ–âƒÂÖF‚ç&÷VæB‡fÇVR’’’¢’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%VÆ—G’ÖöFR"ÂFW67&—F–öã¢%&WV—&W2BÆV7B3&Wf–Ww2æBcR÷6—F—fR&F–æw2âF†—2÷fW'&–FW2F†RGvòÖçVÂ&Wf–Wrf–ÇFW'2v†–ÆRVæ&ÆVBâ"Â6†V6¶VC¢f–ÇFW'2çVÆ—G”ÖöFRÂöä6†ævS¢‡fÇVR’Óâ6†ævTf–ÇFW"‚'VÆ—G”ÖöFR"ÂfÇVR’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%W6R7FVÒW'6öæÆ—¦F–öâ†W‡W&–ÖVçFÂ’"ÂFW67&—F–öã¢$6·27FVÒ7F÷&R6V&6‚Fò&W7V7B&V6övæ—¦VB66÷VçB&VfW&Væ6W2âFG2FòWfW'’6VÆV7FVBf–ÇFW#²&W7VÇG2Ö’&VÖ–âæWWG&Âv†Vâ7FVÒFöW2æ÷BW‡÷6R—G26–væVBÖ–â6W76–öâFòF†RÇVv–â&6¶VæBâ"Â6†V6¶VC¢f–ÇFW'2çW'6öæÆ—¦VBÂöä6†ævS¢‡fÇVR’Óâ6†ævTf–ÇFW"‚'W'6öæÆ—¦VB"ÂfÇVR’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢$vVç&R"Â&t÷F–öç3¢tTå$UôõD”ôå2Â6VÆV7FVD÷F–öã¢f–ÇFW'2ævVç&RÂ7G$FVfVÇDÆ&VÃ¢tTå$UôõD”ôå2æf–æB‚†÷F–öâ’Óâ÷F–öâæFFÓÓÒf–ÇFW'2ævVç&R“òæÆ&VÂÇÂ$ç’vVç&R"Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚&vVç&R"Â7G&–ær†÷F–öâæFFÇÂ""’’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%Æ–W'2"Â&t÷F–öç3¢Ä”U%ôõD”ôå2Â6VÆV7FVD÷F–öã¢f–ÇFW'2çÆ–W'2Â7G$FVfVÇDÆ&VÃ¢Ä”U%ôõD”ôå2æf–æB‚†÷F–öâ’Óâ÷F–öâæFFÓÓÒf–ÇFW'2çÆ–W'2“òæÆ&VÂÇÂ$ç’Æ–W"ÖöFR"Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚'Æ–W'2"Â7G&–ær†÷F–öâæFFÇÂ""’’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%7FVÒFV6²"Â&t÷F–öç3¢DT4µôõD”ôå2Â6VÆV7FVD÷F–öã¢f–ÇFW'2æFV6²Â7G$FVfVÇDÆ&VÃ¢DT4µôõD”ôå2æf–æB‚†÷F–öâ’Óâ÷F–öâæFFÓÓÒf–ÇFW'2æFV6²“òæÆ&VÂÇÂ$ç’FV6²7FGW2"Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚&FV6²"Â7G&–ær†÷F–öâæFFÇÂ""’’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%W6W"&F–ær"Â&t÷F–öç3¢$D”äuôõD”ôå2ÂF—6&ÆVC¢f–ÇFW'2çVÆ—G”ÖöFRÂFW67&—F–öã¢f–ÇFW'2çVÆ—G”ÖöFRò$6öçG&öÆÆVB'’VÆ—G’ÖöFS¢cR²÷6—F—fR"¢$÷F–öæÂÖ–æ–×VÒ÷6—F—fR&F–ær"Â6VÆV7FVD÷F–öã¢f–ÇFW'2æÖ–å&F–ærÂ7G$FVfVÇDÆ&VÃ¢$D”äuôõD”ôå2æf–æB‚†÷F–öâ’Óâ÷F–öâæFFÓÓÒf–ÇFW'2æÖ–å&F–ær“òæÆ&VÂÇÂ$ç’&F–ær"Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚&Ö–å&F–ær"ÂçVÖ&W"†÷F–öâæFF’ÇÂ’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%&Wf–Wr6÷VçB"Â&t÷F–öç3¢$Ud”UuôõD”ôå2ÂF—6&ÆVC¢f–ÇFW'2çVÆ—G”ÖöFRÂFW67&—F–öã¢f–ÇFW'2çVÆ—G”ÖöFRò$6öçG&öÆÆVB'’VÆ—G’ÖöFS¢3²&Wf–Ww2"¢$÷F–öæÂÖ–æ–×VÒçVÖ&W"öb&Wf–Ww2"Â6VÆV7FVD÷F–öã¢f–ÇFW'2æÖ–å&Wf–Ww2Â7G$FVfVÇDÆ&VÃ¢$Ud”UuôõD”ôå2æf–æB‚†÷F–öâ’Óâ÷F–öâæFFÓÓÒf–ÇFW'2æÖ–å&Wf–Ww2“òæÆ&VÂÇÂ$ç’&Wf–Wr6÷VçB"Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚&Ö–å&Wf–Ww2"ÂçVÖ&W"†÷F–öâæFF’ÇÂ’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%&VÆV6VBg&öÒ"Â&t÷F–öç3¢”T%ôõD”ôå2Â6VÆV7FVD÷F–öã¢f–ÇFW'2ç&VÆV6Tg&öÒÂ7G$FVfVÇDÆ&VÃ¢f–ÇFW'2ç&VÆV6Tg&öÒò7G&–ær†f–ÇFW'2ç&VÆV6Tg&öÒ’¢$ç’–V""Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚'&VÆV6Tg&öÒ"ÂçVÖ&W"†÷F–öâæFF’ÇÂ’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂäG&÷F÷vä—FVÒÂ²Æ&VÃ¢%&VÆV6VBF‡&÷Vv‚"Â&t÷F–öç3¢”T%ôõD”ôå2Â6VÆV7FVD÷F–öã¢f–ÇFW'2ç&VÆV6UFòÂ7G$FVfVÇDÆ&VÃ¢f–ÇFW'2ç&VÆV6UFòò7G&–ær†f–ÇFW'2ç&VÆV6UFò’¢$ç’–V""Âöä6†ævS¢†÷F–öâ’Óâ6†ævTf–ÇFW"‚'&VÆV6UFò"ÂçVÖ&W"†÷F–öâæFF’ÇÂ’Ò’Ò’Â7F—fTf–ÇFW$6÷VçBâbb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢‚’Óâ°¢6öç7B6ÆV&VBÒ²ââäDTdTÅEõ$õTÄUEDUôd”ÅDU%2Ó°¢6WDf–ÇFW'2†6ÆV&VB“°¢w&—FU&÷VÆWGFTf–ÇFW'2†6ÆV&VB“°¢6WDW'&÷"‚""“°¢ÒÂ6†–ÆG&Vã¢$6ÆV"&÷VÆWGFRf–ÇFW'2"Ò’Ò•ÒÒ’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãs"ÂÆ–æT†V–v‡C¢ãCRÒÂ6†–ÆG&Vã¢$7&6²÷VâF†RVçF—&R7FVÒ7F÷&RâvÖW2Ç&VG’–â–÷W"Æ–'&'’&RW†6ÇVFVBÂæBF†Rv–ææW"—2WFöÖF–6ÆÇ’FFVBv—F‚4Å27FVÒâ"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢&÷VÆWGFUv–æF÷rÒ’ÂW'&÷"bb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²6öÆ÷#¢"6fc†#ƒ2"ÂföçE6—¦S¢ÒÂ6†–ÆG&Vã¢W'&÷"Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢&öÆÂÂ6†–ÆG&Vã¢'W7’ò%&öÆÆ–æ~(
b"¢%&öÆÂvÖR"Ò’Ò’Âv–ææW"bb5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢÷Våv–ææW"Â6†–ÆG&Vã¢²%f–Wr"Âv–ææW"ææÖRÂ"–â"Âv–ææW$FFVBò$Æ–'&'’"¢%7F÷&R%ÒÒ’Ò•ÒÒ•ÒÒ“°§Ð¦gVæ7F–öâ7F÷&U&÷VÆWGFTÖöFÂ‡²6Æ÷6TÖöFÂÒ’°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B6Æ÷6RÒ‚’Óâ²–b‚'W7’¢6Æ÷6TÖöFÃòâ‚“²Ó°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂäÖöFÅ&ö÷BÂ²6Æ÷6TÖöFÃ¢6Æ÷6RÂöä6æ6VÃ¢6Æ÷6RÂöäW64¶W—&W73¢6Æ÷6RÂ$F—6&ÆT&6¶w&÷VæDF—6Ö—73¢'W7’Â$†–FT6Æ÷6T–6öã¢G'VRÂ$ÆÆ÷tgVÆÅ6—¦S¢G'VRÂ6Æ74æÖS¢'6Ç2×&÷VÆWGFRÖÖöFÂ"ÂÖöFÄ6Æ74æÖS¢'6Ç2×&÷VÆWGFRÖÖöFÂ"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7G–ÆR"Â²6†–ÆG&Vã¢ ¢ç6Ç2×&÷VÆWGFRÖÖöFÂ²&6¶w&÷VæC¢G&ç7&VçB–×÷'FçC²&÷‚×6†F÷s¢æöæR–×÷'FçC²&÷&FW#¢–×÷'FçC²Ð¢Ò’Â5ô¥5‚æ§7‚„Ö–æ–vÖU6V7F–öâÂ²ÖöFÄ6Æ÷6S¢6Æ÷6TÖöFÂÂöä'W7”6†ævS¢6WD'W7’ÂV–6´66W73¢G'VRÒ•ÒÒ’“°§Ð ¢òòWFòÖÖ–çF–æVB7FVÒ6öÆÆV7F–öâf÷"4Å2ÖFFVBvÖW2à¢òð¢òò7FVÒ†2æòæF—fRf–ÇFW"f÷"&FFVB'’4Å4FV6²"(	BFò7FVÒF†W6RvÖW2Æöö°¢òòÆ–¶Ræ÷&ÖÂ÷væVBF—FÆW2‡F†Bw2F†Rv†öÆRö–çBöbF†R4Å77FVÒ†öö²’Â6ò¢òòG'VÇ’G–æÖ–2†f–ÇFW"Ö&6VB’6öÆÆV7F–öâ6âwBF&vWBF†VÒâ–ç7FVBvR¶VW¢òò§7FF–2¢6öÆÆV7F–öâ‚%4Å4FV6²"’&V6öæ6–ÆVBFòF†R4Å2–B6WC¢7&VFR—B–`¢òòÖ—76–ærÂFB–G2F†B&R÷W'2æB'6VçBÂG&÷öæW2F†B&RæòÆöævW ¢òò÷W'2â&V6öæ6–ÆVBöâ&ö÷BÂgFW"âFBÂæBöâ6Æ÷rF–ÖW"(	B6òFòF†RW6W ¢òò—B&V†fW2Æ–¶RâWFò×WFF–ær6öÆÆV7F–öâà¢òð¢òòWfW'—F†–ær†W&RF÷V6†W2VæFö7VÖVçFVB7FVÕT’–çFW&æÇ2†6öÆÆV7F–öå7F÷&Rð¢òò7F÷&R’Âv†÷6RÖWF†öBæÖW2G&–gB&WGvVVâ6Æ–VçBfW'6–öç2â6òWfW'’6ÆÂ—0¢òòfVGW&RÖFWFV7FVBæBw&VC¢öâç—F†–ærVæW‡V7FVBvRÆöröæ6RæBæòÖ÷(	@¢òòF†—2×W7BæWfW"F‡&÷r–çFòF†RÆ–'&'’T’à¦6öç7B4ôÄÄT5D”ôåôäÔRÒ%4Å4FV6²#°¦ÆWBv&æVBÒfÇ6S°¦ÆWB7–æ6–ærÒfÇ6S°¦gVæ7F–öâv&äöæ6R†×6rÂW'"’°¢–b‡v&æVB¢&WGW&ã°¢v&æVBÒG'VS°¢G'’°¢6öç6öÆRçv&â†4Å4FV6²6öÆÆV7F–öã¢G¶×6wÖÂW'"óò""“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð§Ð¦gVæ7F–öâ57F÷&R‚’°¢&WGW&âv–æF÷ræ6öÆÆV7F–öå7F÷&S°§Ð¦gVæ7F–öâ7F÷&R‚’°¢&WGW&âv–æF÷ræ7F÷&S°§Ð¢ò¢¢&W7BÖVff÷'C¢÷fW'f–Wrö&¦V7G27FVÒw2FBõ&VÖ÷fT2W‡V7Bf÷"F†W6R–G2â¢ð¦gVæ7F–öâ÷fW'f–Ww2†–G2’°¢6öç7BÒ7F÷&R‚“°¢6öç7B÷WBÒµÓ°¢f÷"†6öç7B–Böb–G2’°¢G'’°¢6öç7B÷bÒòävWD÷fW'f–Wt'””Còâ†–B“°¢–b†÷b¢÷WBçW6‚†÷b“°¢Ð¢6F6‚°¢ò¢6¶—¢ð¢Ð¢Ð¢&WGW&â÷WC°§Ð¢ò¢¢—2F†R6öÆÆV7F–öâ7F÷&R–æ—F–Æ—¦VBVæ÷Vv‚FòF÷V6‚6fVÇ“ò&VF–æp¢¢W6W$6öÆÆV7F–öç6&Vf÷&RF†R7F÷&RÆöG2F‡&÷w2(	BæB&V6W6R—Bw2Öö%€¢¢6ö×WFVBÂF†BF‡&÷vâW†6WF–öâvWG244„TBÂv†–6‚F†Vâ7&6†W27FVÒw2÷và¢¢6öÆÆV7F–öâ&VæFW"†æBFV6·’&ÆÖW2W2’â6òvRvFRWfW'’66W72öâ¢¢&VF–æW72&ö&RF†BFVÆ–&W&FVÇ’FöW2äõBWfÇVFRW6W$6öÆÆV7F–öç6â¢ð¦gVæ7F–öâ7F÷&U&VG’†72’°¢G'’°¢–b‚72¢&WGW&âfÇ6S°¢–b‡G—Vöb72ä$—4–æ—F–Æ—¦VBÓÓÒ&gVæ7F–öâ"bb72ä$—4–æ—F–Æ—¦VB‚’¢&WGW&âfÇ6S°¢òòÆÄ46öÆÆV7F–öâ—2Æ–âÂ7F&ÆRö&¦V7B&W6VçBöæ6RF†RÆ–'&'’7F÷&P¢òò†2ÆöFVB(	BF÷V6†–ær—BFöW6âwBWfÇVFRF†Rg&v–ÆRW6W$6öÆÆV7F–öç0¢òò6ö×WFVBà¢–b‚72æÆÄ46öÆÆV7F–öâ¢&WGW&âfÇ6S°¢&WGW&âG—Vöb72ävWEW6W$6öÆÆV7F–öç4'”æÖRÓÓÒ&gVæ7F–öâ#°¢Ð¢6F6‚°¢&WGW&âfÇ6S°¢Ð§Ð¢ò¢¢f–æBF†RW†—7F–ærW6W"6öÆÆV7F–öâv—F‚÷W"æÖRÂ÷"çVÆÂâ&VfW'2F†R7F÷&P¢¢ÔUD„ôB‡v†–6‚FöW6âwBWfÇVFRF†RF‡&÷v–ærW6W$6öÆÆV7F–öç26ö×WFVB“²öæÇ¢¢fÆÇ2&6²Fò—FW&F–ærW6W$6öÆÆV7F–öç2–bF†RÖWF†öB—2Ö—76–ærâ¢ð¦gVæ7F–öâf–æD6öÆÆV7F–öâ†72’°¢G'’°¢6öç7B'”æÖRÒ73òävWEW6W$6öÆÆV7F–öç4'”æÖSòâ„4ôÄÄT5D”ôåôäÔR“°¢–b†'”æÖRbb'”æÖRæÆVæwF‚¢&WGW&â'”æÖU³Ó°¢–b†'”æÖR¢&WGW&âçVÆÃ²òòÖWF†öBW†—7G2æB&WGW&æVBV×G’(i"æò6öÆÆV7F–öà¢Ð¢6F6‚°¢ò¢fÆÂF‡&÷Vv‚FòF†R†wV&FVB’6ö×WFVB¢ð¢Ð¢G'’°¢6öç7BÆ—7BÒ73òçW6W$6öÆÆV7F–öç2ÇÂµÓ°¢f÷"†6öç7B2öbÆ—7B¢–b†2bb2æF—7Æ”æÖRÓÓÒ4ôÄÄT5D”ôåôäÔR¢&WGW&â3°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢&WGW&âçVÆÃ°§Ð¢ò¢¢7W'&VçBÖVÖ&W"–G2öb6öÆÆV7F–öâÂ26WCÆçVÖ&W#ââ¢ð¦gVæ7F–öâÖVÖ&W'4öb†6öÂ’°¢6öç7B÷WBÒæWr6WB‚“°¢G'’°¢6öç7B2Ò6öÃòæ3°¢6öç7B¶W—2Ò3òæ¶W—2ò'&’æg&öÒ†2æ¶W—2‚’’¢µÓ°¢f÷"†6öç7B²öb¶W—2’°¢6öç7BâÒçVÖ&W"†²“°¢–b‚çVÖ&W"æ—4æâ†â’¢÷WBæFB†â“°¢Ð¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢&WGW&â÷WC°§Ð¢ò¢¢F†R6WBöb4Å2ÖFFVB–G2†–ç7FÆÆVB(Š¢WfW"ÖFFVB’â¢ð¦7–æ2gVæ7F–öâ6Ç4–G2‚’°¢6öç7B–G2ÒæWr6WB‚“°¢G'’°¢6öç7B"Òv—BvWD–ç7FÆÆVD2‚“°¢–b‡"ç7V66W72¢‡"æ2ÇÂµÒ’æf÷$V6‚‚†’Óâ–G2æFB„çVÖ&W"†æ–B’’“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢G'’°¢6öç7B"Òv—BvWDWfW$FFVB‚“°¢–b‡"ç7V66W72¢‡"æ–G2ÇÂµÒ’æf÷$V6‚‚†’Óâ–G2æFB„çVÖ&W"†’’“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢–G2æFVÆWFR„æâ“°¢&WGW&â–G3°§Ð¦gVæ7F–öâ6WG4WVÂ†Â"’°¢–b†ç6—¦RÓÒ"ç6—¦R¢&WGW&âfÇ6S°¢f÷"†6öç7B‚öb¢–b‚"æ†2‡‚’¢&WGW&âfÇ6S°¢&WGW&âG'VS°§Ð¢ò¢ ¢¢&V6öæ6–ÆRF†R4Å4FV6²6öÆÆV7F–öâFòF†R7W'&VçB4Å26WBâæòÖ÷2v†VâF†R&V`¢¢—2öfbÂv†VâF†R7F÷&R’—2Ö—76–ærÂ÷"v†VâF†R6öÆÆV7F–öâÇ&VG’ÖF6†W0¢¢‡6ò—Bw26†VFò6ÆÂögFVâ’âæWfW"F‡&÷w2à¢¢ð¦7–æ2gVæ7F–öâ7–æ56Ç46öÆÆV7F–öâ‚’°¢–b‡7–æ6–ær¢&WGW&ã°¢7–æ6–ærÒG'VS°¢G'’°¢ÆWBöâÒfÇ6S°¢G'’°¢öâÒ†v—BvWDw&÷W6öÆÆV7F–öâ‚’’æVæ&ÆVC°¢Ð¢6F6‚°¢öâÒfÇ6S°¢Ð¢–b‚öâ¢&WGW&ã°¢6öç7B72Ò57F÷&R‚“°¢–b‚72’°¢v&äöæ6R‚&6öÆÆV7F–öå7F÷&RVæf–Æ&ÆR"“°¢&WGW&ã°¢Ð¢òò&–Â†æB&WG'’öâF†RæW‡B–çFW'fÂF–6²’VçF–ÂF†R7F÷&R—2–æ—F–Æ—¦VBà¢òòF÷V6†–ærW6W$6öÆÆV7F–öç2V&Ç’F‡&÷w2æBÖö%‚66†W2F†RW†6WF–öâÂv†–6€¢òòF†Vâ7&6†W27FVÒw2÷vâ6öÆÆV7F–öâT’(	BF†R'WFFVBg&öÒâöÆFW"ÇVv–à¢òòæB—Bw27&6†–ær"&W÷'BâF†—2vFR—2F†Rf—‚à¢–b‚7F÷&U&VG’†72’’°¢&WGW&ã°¢Ð¢6öç7BFW6—&VBÒv—B6Ç4–G2‚“°¢ÆWB6öÂÒf–æD6öÆÆV7F–öâ†72“°¢òòæ÷F†–ærFòw&÷WæBæò6öÆÆV7F–öâ–WB(i"FöâwB7&VFRâV×G’öæRà¢–b‚6öÂbbFW6—&VBç6—¦RÓÓÒ¢&WGW&ã°¢òòÇ&VG’–â7–æ2(i"6¶—F†Rw&—FRVçF—&VÇ’à¢–b†6öÂbb6WG4WVÂ†ÖVÖ&W'4öb†6öÂ’ÂFW6—&VB’¢&WGW&ã°¢6öç7BFW6—&VD–G2Ò'&’æg&öÒ†FW6—&VB“°¢–b‚6öÂ’°¢òò7&VFRæWr6öÆÆV7F–öâ6VVFVBv—F‚F†RFW6—&VB2à¢G'’°¢6öç7B7&VFVBÒ72äæWuVç6fVD6öÆÆV7F–öãòâ„4ôÄÄT5D”ôåôäÔRÂVæFVf–æVBÂFW6—&VD–G2’óð¢72äæWuVç6fVD6öÆÆV7F–öãòâ„4ôÄÄT5D”ôåôäÔR“°¢–b‚7&VFVB’°¢v&äöæ6R‚$æWuVç6fVD6öÆÆV7F–öâÖ—76–ær"“°¢&WGW&ã°¢Ð¢òò–bF†R6VVB&rv2–væ÷&VBÂFBW‡Æ–6—FÇ’&Vf÷&R6f–ærà¢–b†ÖVÖ&W'4öb†7&VFVB’ç6—¦RÓÓÒbbFW6—&VD–G2æÆVæwF‚’°¢7&VFVBäFD3òâ†÷fW'f–Ww2†FW6—&VD–G2’“°¢Ð¢v—B†7&VFVBå6fSòâ‚’óò&öÖ—6Rç&W6öÇfR‚’“°¢Ð¢6F6‚†R’°¢v&äöæ6R‚&7&VFRf–ÆVB"ÂR“°¢Ð¢&WGW&ã°¢Ð¢òòVF—BÖVÖ&W'6†—öâF†RW†—7F–ær6öÆÆV7F–öâà¢G'’°¢6öç7BVF—F&ÆRÒ6öÂä4G&tG&÷6öÆÆV7F–öãòâ‚’óò6öÃ°¢6öç7B7W'&VçBÒÖVÖ&W'4öb†6öÂ“°¢6öç7BFôFBÒFW6—&VD–G2æf–ÇFW"‚†–B’Óâ7W'&VçBæ†2†–B’“°¢6öç7BFõ&VÖ÷fRÒ'&’æg&öÒ†7W'&VçB’æf–ÇFW"‚†–B’ÓâFW6—&VBæ†2†–B’“°¢–b‡FôFBæÆVæwF‚¢VF—F&ÆRäFD3òâ†÷fW'f–Ww2‡FôFB’“°¢–b‡Fõ&VÖ÷fRæÆVæwF‚¢VF—F&ÆRå&VÖ÷fT3òâ†÷fW'f–Ww2‡Fõ&VÖ÷fR’“°¢v—B†VF—F&ÆRå6fSòâ‚’óò6öÂå6fSòâ‚’óò&öÖ—6Rç&W6öÇfR‚’“°¢Ð¢6F6‚†R’°¢v&äöæ6R‚&VF—Bf–ÆVB"ÂR“°¢Ð¢Ð¢6F6‚†R’°¢v&äöæ6R‚'7–æ2f–ÆVB"ÂR“°¢Ð¢f–æÆÇ’°¢7–æ6–ærÒfÇ6S°¢Ð§Ð ¦6öç7B5D”ôå5ôd•„U5õÕô´U’CÒ'6Ç6FV6²æ7F–öç4f—†W5Ò#°¦6öç7B5D”ôå5ôd•„U5õÕôUdTåBCÒ'6Ç6FV6²Ö7F–öç2Öf—†W2×Ò#°¦6öç7BDT4µ•ô…eõd•4”$ÄUô´U’Ò'6Ç6FV6²ç6†÷tFV6·”‡b#°¦gVæ7F–öâ&VDFV6·”‡ef—6–&ÆR‚’°¢G'’°¢&WGW&âv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ„DT4µ•ô…eõd•4”$ÄUô´U’’ÓÓÒ##°¢Ð¢6F6‚°¢&WGW&âfÇ6S°¢Ð§Ð¢ò¢)H)H–æ¦V7F–öâ&V6÷fW'’†WFòÖ†VÂgFW"7FVÒ6Æ–VçBWFFR’)H)H)H)H)H)H)H)H)H)H)H¢ð¦gVæ7F–öâFDF÷væÆöEFövvÆR‚’°¢6öç7B¶öâÂ6WDöåÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&VÆöDöåW&vRÂ6WE&VÆöDöåW&vU7FFUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢vWDWFôF÷væÆöB‚’çF†Vâ‚‡"’Óâ6WDöâ‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWE&VÆöDöåW&vR‚’çF†Vâ‚‡"’Óâ6WE&VÆöDöåW&vU7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢ÒÂµÒ“°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$FF–ærvÖW2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFò&W7F'BgFW"FF–ær"ÂFW67&—F–öã¢$WFò&W7F'B7FVÒgFW"FF–ærvÖRâ"Â6†V6¶VC¢öâÂöä6†ævS¢7–æ2‡b’Óâ²6WDöâ‡b“²v—B6WDWFôF÷væÆöB‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%&VÆöBv†VâW&v–ærÆÂ"ÂFW67&—F–öã¢$6ö×F–&–Æ—G’fÆÆ&6²F†B&W7F'G27FVÒgFW"W&vRÆÂâöfbW6W2Öööâw2–â×6W76–öâ†÷B&VÖ÷fÂâ"Â6†V6¶VC¢&VÆöDöåW&vRÂöä6†ævS¢7–æ2‡b’Óâ²6WE&VÆöDöåW&vU7FFR‡b“²v—B6WE&VÆöDöåW&vR‡b“²ÒÒ’Ò•ÒÒ’“°§Ð¦gVæ7F–öâFÆ46Æ÷VEFövvÆW2‚’°¢6öç7B¶FÆ2Â6WDFÆ5ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶FÆ4÷væVDöæÇ’Â6WDFÆ4÷væVDöæÇ•7FFUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶WFôFÆ2Â6WDWFôFÆ5ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶æô6Æ÷VBÂ6WDæô6Æ÷VEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶æô÷væVDFÆ2Â6WDæô÷væVDFÆ5ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢vWDFÆ4÷F–öâ‚’çF†Vâ‚‡"’Óâ6WDFÆ2‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDFÆ4÷væVDöæÇ’‚’çF†Vâ‚‡"’Óâ6WDFÆ4÷væVDöæÇ•7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDWFôFDFÆ2‚’çF†Vâ‚‡"’Óâ6WDWFôFÆ2‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDF—6&ÆT6Æ÷VB‚’çF†Vâ‚‡"’Óâ6WDæô6Æ÷VB‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDF—6&ÆTFÆ5VæÆö6´÷væVB‚’çF†Vâ‚‡"’Óâ6WDæô÷væVDFÆ2‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢ÒÂµÒ“°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$DÄ2b6Æ÷VB"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%VæÆö6²DÄ2v†VâFF–ærvÖR"ÂFW67&—F–öã¢$Ö&·2F†RvÖRw2DÄ22÷væVBæBWFòÖ–ç7FÆÇ2F†RÖF6†–ær–â×&ö6W72DÄ2VæÆö6¶W"v†VâF†RvÖR—2öâF—6²ÇS#B6Öö¶T’f÷"7FVÒF—FÆW2ÂWÆ’#õ#"f÷"V&—6ögB6öææV7BF—FÆW2†V6‚öæÇ’Æ–W2FòvÖW2F†BW6R—B’â4Å77FVÒÇ&VG’VæÆö6·2Ö÷7B7FVÒDÄ2öâ—G2÷vââ–âÖvÖR†VçF—FÆVÖVçB’DÄ2VæÆö6·2&–v‡Bv“²DÄ2F†BF÷væÆöG226W&FRf–ÆW27F–ÆÂæVVG2F†÷6Rf–ÆW2âöâ'’FVfVÇBâ"Â6†V6¶VC¢FÆ2Âöä6†ævS¢7–æ2‡b’Óâ²6WDFÆ2‡b“²v—B6WDFÆ4÷F–öâ‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$DÄ2VæÆö6¶W'2öâ÷væVBvÖW2öæÇ’"ÂFW67&—F–öã¢$öæÇ’6†÷rF†R7&VÔ’Â6Öö¶T’æBV&—6ögB…WÆ’#õ#"’DÄ2×VæÆö6²'WGFöç2öâvÖW2–÷R7GVÆÇ’÷vâÇS#B†–FRF†VÒöâ4Å2ÖFFVBvÖW2Âv†W&RF†W’Fòæ÷F†–ærâöâ'’FVfVÇBâ"Â6†V6¶VC¢FÆ4÷væVDöæÇ’Âöä6†ævS¢7–æ2‡b’Óâ°¢6WDFÆ4÷væVDöæÇ•7FFR‡b“°¢v—B6WDFÆ4÷væVDöæÇ’‡b“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢bò$DÄ2VæÆö6¶W'3¢÷væVBvÖW2öæÇ’"¢$DÄ2VæÆö6¶W'3¢ÆÂvÖW2"Ò“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$FBDÄ2WFöÖF–6ÆÇ’"ÂFW67&—F–öã¢%v†VâFF–ærvÖRÂÇ6ò&Vv—7FW"ÆÂ—G2DÄ2FW÷B¶W—2†g&öÒF†RgVÆÂÖæ–fW7B’6òF†R&6R–ç7FÆÂF÷væÆöG26öçFVçBDÄ2Föòâ&–6†W"v—F‚‡V&6¶W’6WBâöâ'’FVfVÇBâ"Â6†V6¶VC¢WFôFÆ2Âöä6†ævS¢7–æ2‡b’Óâ°¢6WDWFôFÆ2‡b“°¢òòF†RVæv–æR†ÆböbF†—2FövvÆR6âf–Â†æò6öæf–ròVçw&—F&ÆR’à¢òò&WfW'BæB6’6ò&F†W"F†â6†÷v–ærôâ÷fW"6öæf–rF†Bv0¢òòæWfW"w&—GFVâà¢G'’°¢6öç7B"Òv—B6WDWFôFDFÆ2‡b“°¢–b‚#òç7V66W72’°¢6WDWFôFÆ2‚b“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢#òæW'&÷"ÇÂ$6÷VÆBæ÷Bw&—FRF†R4Å77FVÒ6öæf–r"Ò“°¢Ð¢Ð¢6F6‚†R’°¢6WDWFôFÆ2‚b“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$F—6&ÆRDÄ2VæÆö6²öâ÷væVBvÖW2"ÂFW67&—F–öã¢%7F÷Öööâg&öÒWFò×VæÆö6¶–ær‡Væ÷væVB’DÄ2öâvÖW2–÷RÆVv—B÷vââ66ç2–÷W"Æ–'&'’w2÷væVBvÖW2Â&W6öÇfW2F†V—"DÄ2ÂæB&Æ6¶Æ—7G2F†VÒ–âF†RVæv–æRâ6â&R6Æ÷röâ&–rÆ–'&'’âöfb'’FVfVÇBâ"Â6†V6¶VC¢æô÷væVDFÆ2Âöä6†ævS¢7–æ2‡b’Óâ°¢6WDæô÷væVDFÆ2‡b“°¢6WD'W7’‡G'VR“°¢G'’°¢6öç7B÷væVBÒbòÆ—7DÆ–'&'”–G2‚’¢µÓ°¢6öç7B"Òv—B6WDF—6&ÆTFÆ5VæÆö6´÷væVB‡bÂ÷væVB“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢bò&Æ6¶Æ—7FVBG·"æ&Æ6¶Æ—7FVBóòÒDÄ2(	B&VÆöB7FVÖ¢$DÄ2VæÆö6²&W7F÷&VB(	B&VÆöB7FVÒ"Ò“°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢W'&÷#¢G¶WÖÒ“°¢Ð¢6WD'W7’†fÇ6R“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$F—6&ÆR7FVÒ6Æ÷VBöâ4Å2vÖW2"ÂFW67&—F–öã¢%GW&âöfb7FVÒ6Æ÷VB6fW2f÷"vÖW2FFVBf–4Å77FVÒ†fö–G2fÇfRw2&V¦V7FVB×7–æ2W'&÷'2’âöæÇ’ffV7G2FFVBvÖW2Âæ÷B–÷W"ÆVv—BöæW2â×WGVÆÇ’W†6ÇW6—fRv—F‚6Æ÷VE&VF—&V7Bâöfb'’FVfVÇBâ"Â6†V6¶VC¢æô6Æ÷VBÂöä6†ævS¢7–æ2‡b’Óâ²6WDæô6Æ÷VB‡b“²v—B6WDF—6&ÆT6Æ÷VB‡b“²Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$6Æ÷VB6WGF–ærw&—GFVâ(	B&VÆöB7FVÒ"Ò“²ÒÒ’Ò’Â'W7’ò5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÒÂ6†–ÆG&Vã¢%66ææ–ærÆ–'&'•ÇS##b"Ò’Ò’¢çVÆÅÒÒ’“°§Ð¦gVæ7F–öâ–æ¦V7F–öå&V6÷fW'’‚’°¢6öç7B·&V–æ¦V7BÂ6WE&V–æ¦V7EÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B·&W–âÂ6WE&W–åÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶FW2Â6WDFW5ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢vWDWFõ&V–æ¦V7B‚’çF†Vâ‚‡"’Óâ6WE&V–æ¦V7B‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDWFô6Æ–VçE&W–â‚’çF†Vâ‚‡"’Óâ6WE&W–â‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWD6†V6´FWVæFVæ6–W4öä&ö÷B‚’çF†Vâ‚‡"’Óâ6WDFW2‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢ÒÂµÒ“°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$–æ¦V7F–öâ&V6÷fW'’"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$6†V6²FWVæFVæ7’7FGW2öâ&ö÷B"ÂFW67&—F–öã¢$gFW"7FVÒ4Tb—27F&ÆRÂfW&–g’4Å77FVÒÂF†R6Æ–VçBf—‚ÂFö¶VW"ÂtRÕ&÷FöãÓ3BæB6Æ÷VE&VF—&V7C²–ç7FÆÂ÷"&W—"ç—F†–ærÖ—76–ærâ†Vg’v÷&²—26W&–Æ—¦VBæBFVÆ–VBFò&÷FV7BFV6·’â"Â6†V6¶VC¢FW2Âöä6†ævS¢7–æ2‡b’Óâ²6WDFW2‡b“²v—B6WD6†V6´FWVæFVæ6–W4öä&ö÷B‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFò&RÖ7F—fFR–æ¦V7F–öâöâ&ö÷B"ÂFW67&—F–öã¢$–b7FVÒWFFRÆVfW2–æ¦V7F–öâöfbÂ&R×F6‚7FVÒç6‚öâ7F'GWæBgVÆÇ’&W7F'B7FVÒ‡7FVÒ×6‡WFF÷vâ²&VÆVæ6‚F‡&÷Vv‚7FVÒç6‚’FòÇ’—Bâ6VB6ò—B6âwBÆö÷â"Â6†V6¶VC¢&V–æ¦V7BÂöä6†ævS¢7–æ2‡b’Óâ²6WE&V–æ¦V7B‡b“²v—B6WDWFõ&V–æ¦V7B‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFò&R×–â7FVÒ6Æ–VçBöâ&ö÷B"ÂFW67&—F–öã¢$–b–æ¦V7F–öâ'&ö¶RgFW"6Æ–VçBWFFRÂWFöÖF–6ÆÇ’'VâF†R6Æ–VçBf—‚†ƒ6F7"Ö"’ÇS#BF†—2–ç2öF÷væw&FW2F†R6Æ–VçBæB$T$ôõE2â†Vg’Âf–ÇW&RÖ6VBÂæBöâ'’FVfVÇBâ"Â6†V6¶VC¢&W–âÂöä6†ævS¢7–æ2‡b’Óâ²6WE&W–â‡b“²v—B6WDWFô6Æ–VçE&W–â‡b“²ÒÒ’Ò•ÒÒ’“°§Ð¢ò¢¢67&öÆÆ&ÆRvR&öG’(	B6–FV&$æf–vF–öâæW2FöâwB67&öÆÂöâF†V—"÷vââ¢ð¦gVæ7F–öâ&öG’‡²6†–ÆG&VâÒ’°¢&WGW&â…5ô¥5‚æ§7‚‚&F—b"Â²6Æ74æÖS¢'6Ç6FV6²×F†VÖVB×vR"Â7G–ÆS¢²†V–v‡C¢#R"Â÷fW&fÆ÷u“¢&WFò"ÂFF–æs¢#'‚G‚CG‚"ÒÂ6†–ÆG&Vã¢6†–ÆG&VâÒ’“°§Ð¦6öç7BEdä4TEõtUõD„TÔRÒ ¢ç6Ç6FV6²×F†VÖVB×vR°¢&÷‚×6—¦–æs¢&÷&FW"Ö&÷ƒ°¢&6¶w&÷VæC ¢&F–ÂÖw&F–VçB†6—&6ÆRB“"R"RÂ&v&ƒ2Âƒ"ÂƒÂã‚’ÂG&ç7&VçB3R’À¢&F–ÂÖw&F–VçB†6—&6ÆRB"R‚RÂ&v&ƒSRÂSÂ#rÂã"’ÂG&ç7&VçB#‚R’À¢Æ–æV"Öw&F–VçBƒƒFVrÂ&v&ƒRÂ#"Â32Âã3R’Â&v&ƒ"ÂbÂ#RÂã"’“°¢Ð¢ç6Ç6FV6²×F†VÖVB×vRâG´DdÂç7FF–46Æ76W2åæVÅ6V7F–öçÒ°¢&÷‚×6—¦–æs¢&÷&FW"Ö&÷ƒ°¢Ö&v–ã¢Gƒ°¢FF–æs¢‚'‚7ƒ°¢&÷&FW#¢‚6öÆ–B&v&ƒSrÂ“‚Â#SRÂã#“°¢&÷&FW"×&F—W3¢'ƒ°¢&6¶w&÷VæC¢Æ–æV"Öw&F–VçBƒCVFVrÂ&v&ƒ#‚ÂC2ÂcbÂã“’Â&v&ƒ3‚Â#RÂS‚Âãƒb’“°¢&÷‚×6†F÷s¢w‚#'‚&v&ƒÂÂÂã#B’Â–ç6WB‚&v&ƒ#SRÂ#SRÂ#SRÂã#R“°¢÷fW&fÆ÷s¢†–FFVã°¢Ð¢ç6Ç6FV6²×F†VÖVB×vRâG´DdÂç7FF–46Æ76W2åæVÅ6V7F–öåF—FÆWÒ°¢Ö&v–ã¢‡ƒ°¢6öÆ÷#¢6cvc–fc°¢föçB×6—¦S¢Wƒ°¢föçB×vV–v‡C¢ƒ°¢ÆWGFW"×76–æs¢ã3Wƒ°¢FW‡B×6†F÷s¢G‚&v&ƒBÂ“’Â#SRÂã‚“°¢Ð¢ç6Ç6FV6²×F†VÖVB×vRâG´DdÂç7FF–46Æ76W2åæVÅ6V7F–öå&÷wÒ°¢Ö&v–â×F÷¢wƒ°¢Ð¢ç6Ç6FV6²×F†VÖVB×vRâG´DdÂç7FF–46Æ76W2åæVÅ6V7F–öå&÷wÓ¦f—'7BÖ6†–ÆB°¢Ö&v–â×F÷¢°¢Ð¢ç6Ç6FV6²×F†VÖVB×vR'WGFöå¶6Æ72£Ò$F–Æöt'WGFöâ%ÒÀ¢ç6Ç6FV6²×F†VÖVB×vR·&öÆSÒ&'WGFöâ%Õ¶6Æ72£Ò$F–Æöt'WGFöâ%Ò°¢Ö–âÖ†V–v‡C¢C'ƒ°¢&÷&FW#¢‚6öÆ–B&v&ƒC‚Â#BÂ#SRÂã3"“°¢&÷&FW"×&F—W3¢—ƒ°¢6öÆ÷#¢6cvc–fc°¢&6¶w&÷VæC¢Æ–æV"Öw&F–VçBƒ3VFVrÂ&v&ƒS‚Â"ÂcÂã“"’Â&v&ƒ“Âc"Â3’Âã“"’“°¢&÷‚×6†F÷s¢W‚W‚&v&ƒRÂÂ#"Âã#B’Â–ç6WB‚&v&ƒ#SRÂ#SRÂ#SRÂãb“°¢föçB×vV–v‡C¢s°¢ÆWGFW"×76–æs¢ãƒ°¢G&ç6—F–öã¢&÷&FW"Ö6öÆ÷"ãg2V6RÂf–ÇFW"ãg2V6RÂG&ç6f÷&Òãg2V6RÂ&÷‚×6†F÷rãg2V6S°¢Ð¢ç6Ç6FV6²×F†VÖVB×vR'WGFöå¶6Æ72£Ò$F–Æöt'WGFöâ%Ó¦†÷fW"À¢ç6Ç6FV6²×F†VÖVB×vR'WGFöå¶6Æ72£Ò$F–Æöt'WGFöâ%Ó¦fö7W2À¢ç6Ç6FV6²×F†VÖVB×vR·&öÆSÒ&'WGFöâ%Õ¶6Æ72£Ò$F–Æöt'WGFöâ%Ó¦†÷fW"À¢ç6Ç6FV6²×F†VÖVB×vR·&öÆSÒ&'WGFöâ%Õ¶6Æ72£Ò$F–Æöt'WGFöâ%Ó¦fö7W2°¢&÷&FW"Ö6öÆ÷#¢&v&ƒsBÂ##BÂ#SRÂãs"“°¢f–ÇFW#¢'&–v‡FæW72ƒã2“°¢G&ç6f÷&Ó¢G&ç6ÆFU’‚Ó‚“°¢&÷‚×6†F÷s¢w‚#‚&v&ƒRÂÂ#"Âã3B’Â'‚&v&ƒBÂ“’Â#SRÂãB“°¢Ð¢ç6Ç6FV6²×F†VÖVB×vR'WGFöå¶6Æ72£Ò$F–Æöt'WGFöâ%Ó¦F—6&ÆVBÀ¢ç6Ç6FV6²×F†VÖVB×vR·&öÆSÒ&'WGFöâ%Õ¶6Æ72£Ò$F–Æöt'WGFöâ%Õ¶&–ÖF—6&ÆVCÒ'G'VR%Ò°¢÷6—G“¢ãCƒ°¢f–ÇFW#¢6GW&FR‚ãSR“°¢G&ç6f÷&Ó¢æöæS°¢Ð¢ç6Ç6FV6²×F†VÖVB×vS£¢×vV&¶—B×67&öÆÆ&"×F‡VÖ"°¢&÷&FW"×&F—W3¢‡ƒ°¢&6¶w&÷VæC¢Æ–æV"Öw&F–VçB‚3s&3vfbÂ6ƒƒVS‚“°¢Ð¦°¢ò¢)H)HöæÆ–æRÖf—‚W6W&æÖR†Æ—fW2öâF†RvÖRf—†W2F"’)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H¢ð¦gVæ7F–öâöæÆ–æTf—…W6W&æÖR‚’°¢6öç7B·6fVBÂ6WE6fVEÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶G&gBÂ6WDG&gEÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B¶WFòÂ6WDWFõÒÒ5õ$T5BçW6U7FFR‚""“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢vWDöæÆ–æUW6W&æÖR‚¢çF†Vâ‚‡"’Óâ°¢6öç7BRÒ"ç7V66W72ò"çW6W&æÖRÇÂ""¢"#°¢6WE6fVB‡R“°¢6WDG&gB‡R“°¢6WDWFò‡"ç7V66W72ò"æWFòÇÂ""¢""“°¢Ò¢æ6F6‚‚‚’Óâ²Ò“°¢ÒÂµÒ“°¢6öç7B6fRÒ7–æ2‚’Óâ°¢v—B6WDöæÆ–æUW6W&æÖR†G&gBçG&–Ò‚’“°¢6WE6fVB†G&gBçG&–Ò‚’“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$öæÆ–æRÖf—‚W6W&æÖR6fVB"Ò“°¢Ó°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$öæÆ–æRÖf—‚W6W&æÖR"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFW‡Df–VÆBÂ²Æ&VÃ¢%W6W&æÖR"ÂfÇVS¢G&gBÂöä6†ævS¢†R’Óâ6WDG&gB†RçF&vWBçfÇVR’Ò’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢²$æÖRW6VB'’öæÆ–æRÖf—‚V×VÆF÷'2â&Ææ²Ò–÷W"7FVÒæÖR"ÂWFòò‚"G¶WF÷Ò"–¢""Â"âÆ–VBv†Vâf—‚—2–ç7FÆÆVBâ%ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"Âöä6Æ–6³¢6fRÂF—6&ÆVC¢G&gBçG&–Ò‚’ÓÓÒ‡6fVBóò""’Â6†–ÆG&Vã¢%6fRW6W&æÖR"Ò’Ò•ÒÒ’“°§Ð¢ò¢)H)H÷F–öç2æR‡F†RöÆBGfæ6VBFövvÆW2’)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H¢ð¦gVæ7F–öâ÷F–öç5æR‡²6†÷tFV6·”‡bÂöå6†÷tFV6·”‡d6†ævRÂÒ’°¢6öç7B¶w&÷W6öÆÆV7F–öâÂ6WDw&÷W6öÆÆV7F–öå7FFUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶&6·W7W7FöÒÂ6WD&6·W7W7FöÕ7FFUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·7F÷&TöâÂ6WE7F÷&TöåÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B·–âÂ6WE–åÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶æôæWBÂ6WDæôæWEÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶†–FT÷væVBÂ6WD†–FT÷væVEÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶7F–öç4f—†W5ÒÂ6WD7F–öç4f—†W5ÕÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶vÖW5ÒÂ6WDvÖW5ÕÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&V–ç7FÆÅÒÂ6WE&V–ç7FÆÅÕÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvU6Ç2Â6WD&FvU6Ç5ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTÆVv—BÂ6WD&FvTÆVv—EÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTFVçWfòÂ6WD&FvTFVçWfõÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTvÖUvRÂ6WD&FvTvÖUvUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvU7F÷&UvRÂ6WD&FvU7F÷&UvUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTöæÆ–æTf—‚Â6WD&FvTöæÆ–æTf—…ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTf—†VBÂ6WD&FvTf—†VEÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvUFö¶VW"Â6WD&FvUFö¶VW%ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTæöå7FVÒÂ6WD&FvTæöå7FVÕÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTæöå7FVÔæÖRÂ6WD&FvTæöå7FVÔæÖUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTÆ–'&'’Â6WD&FvTÆ–'&'•ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶&FvTVÖö¦’Â6WD&FvTVÖö¦•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶WFôf—‚Â6WDWFôf—…7FFUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶Æ–$'WGFöç2Â6WDÆ–$'WGFöç5ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶WFôÇ’Â6WDWFôÇ•7FFUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶WFõ&Wö–çBÂ6WDWFõ&Wö–çE7FFUÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶†–FUFööÇ5ÒÂ6WD†–FUFööÇ5Õ7FFUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶6†–WfVÖVçG2Â6WD6†–WfVÖVçG57FFUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶6„ÖööâÂ6WD6„ÖööåÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶WFõWFFT2Â6WDWFõWFFT57FFUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶Öæ–fW7DFöæF–öâÂ6WDÖæ–fW7DFöæF–öå7FFUÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶æ÷F–g”vÖTFG2Â6WDæ÷F–g”vÖTFG5ÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B·7W&f6Tf–ÆVE6÷W&6W2Â6WE7W&f6Tf–ÆVE6÷W&6W5ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&÷VÆWGFUÒÂ6WE&÷VÆWGFUÕÒÒ5õ$T5BçW6U7FFR‚‚’Óâ&VE&÷VÆWGFT&ööÂ…$õTÄUEDUõÕô´U’’“°¢6öç7B·&÷VÆWGFUF$F—6&ÆVBÂ6WE&÷VÆWGFUF$F—6&ÆVEÒÒ5õ$T5BçW6U7FFR‚‚’Óâ&VE&÷VÆWGFT&ööÂ…$õTÄUEDUõD%ôD•4$ÄTEô´U’’“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢vWDw&÷W6öÆÆV7F–öâ‚’çF†Vâ‚‡"’Óâ6WDw&÷W6öÆÆV7F–öå7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWD&6·W7W7FöÒ‚’çF†Vâ‚‡"’Óâ6WD&6·W7W7FöÕ7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWE7F÷&TF—6&ÆVB‚’çF†Vâ‚‡"’Óâ6WE7F÷&Töâ‚"æF—6&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWE–äöäf—‚‚’çF†Vâ‚‡"’Óâ6WE–â‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDæô–çFW&æWDf—‚‚’çF†Vâ‚‡"’Óâ6WDæôæWB‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDWFôÇ’‚’çF†Vâ‚‡"’Óâ6WDWFôÇ•7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDWFõ&Wö–çB‚’çF†Vâ‚‡"’Óâ6WDWFõ&Wö–çE7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWD6†–WfVÖVçG2‚’çF†Vâ‚‡"’Óâ²6WD6†–WfVÖVçG57FFR‚"æVæ&ÆVB“²6WD6„Öööâ‡"æÖööâÓÒfÇ6R“²Ò’æ6F6‚‚‚’Óâ²Ò“°¢vWDWFõWFFT2‚’çF†Vâ‚‡"’Óâ6WDWFõWFFT57FFR‡"æVæ&ÆVBÓÒfÇ6R’’æ6F6‚‚‚’Óâ²Ò“°¢vWDÖæ–fW7DFöæF–öâ‚’çF†Vâ‚‡"’Óâ6WDÖæ–fW7DFöæF–öå7FFR‡"æVæ&ÆVBÓÒfÇ6R’’æ6F6‚‚‚’Óâ²Ò“°¢vWD†–FUFööÇ5Ò‚’çF†Vâ‚‡"’Óâ6WD†–FUFööÇ5Õ7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWD†–FTöä÷væVB‚’çF†Vâ‚‡"’Óâ6WD†–FT÷væVB‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDvÖW4–åÒ‚’çF†Vâ‚‡"’Óâ6WDvÖW5Ò‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWE6†÷u&V–ç7FÆÅÒ‚’çF†Vâ‚‡"’Óâ6WE&V–ç7FÆÅÒ‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDæ÷F–g”vÖTFB‚’çF†Vâ‚‡"’Óâ6WDæ÷F–g”vÖTFG2‡"æVæ&ÆVBÓÒfÇ6R’’æ6F6‚‚‚’Óâ²Ò“°¢vWEV•6WGF–æw2‚’çF†Vâ‚‡"’Óâ6WE7W&f6Tf–ÆVE6÷W&6W2‡"ç6WGF–æw3òçFö7Döå6÷W&6Tf–ÇW&RÓÓÒG'VR’’æ6F6‚‚‚’Óâ²Ò“°¢G'’°¢6öç7B&rÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ„5D”ôå5ôd•„U5õÕô´U’C“°¢6WD7F–öç4f—†W5Ò‡&rÓÒçVÆÂòG'VR¢&rÓÓÒ#"“°¢Ð¢6F6‚°¢6WD7F–öç4f—†W5Ò‡G'VR“°¢Ð¢6WD&FvTVÖö¦’†vWDVÖö¦”&FvW4Væ&ÆVB‚’“°¢vWD&FvT÷F–öç2‚¢çF†Vâ‚‡"’Óâ°¢–b‚"ç7V66W72¢&WGW&ã°¢6WD&FvU6Ç2‚"ç6Ç2“°¢6WD&FvTÆVv—B‚"æÆVv—B“°¢6WD&FvTFVçWfò‚"æFVçWfò“°¢6WD&FvTvÖUvR‚"ævÖUvR“°¢6WD&FvU7F÷&UvR‚"ç7F÷&UvR“°¢6WD&FvTöæÆ–æTf—‚‚"æöæÆ–æTf—‚“°¢6WD&FvTf—†VB‚"æf—†VB“°¢6WD&FvUFö¶VW"‚"çFö¶VW"“°¢6WD&FvTæöå7FVÒ‚"ææöå7FVÒ“°¢6WD&FvTæöå7FVÔæÖR‚"ææöå7FVÔæÖR“°¢6WD&FvTÆ–'&'’‚"æÆ–'&'’“°¢Ò¢æ6F6‚‚‚’Óâ²Ò“°¢vWDÆ–'&'”'WGFöç2‚’çF†Vâ‚‡"’Óâ6WDÆ–$'WGFöç2‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWDWFôf—‚‚’çF†Vâ‚‡"’Óâ6WDWFôf—…7FFR‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢ÒÂµÒ“°¢&WGW&â…5ô¥5‚æ§7‡2„&öG’Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$öâ×67&VVâ'WGFöç2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%7F÷&R'WGFöç2"ÂFW67&—F–öã¢$fÆöF–ærFBòf—‚&"öâ7F÷&RvÖRvW2â"Â6†V6¶VC¢7F÷&TöâÂöä6†ævS¢7–æ2‡b’Óâ°¢6WE7F÷&Töâ‡b“°¢v—B6WE7F÷&TF—6&ÆVB‚b“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢bò%7F÷&R'WGFöç2öâ"¢%7F÷&R'WGFöç2öfb"Ò“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$Æ–'&'’'WGFöç2öâvÖRvW2"ÂFW67&—F–öã¢%F†RFBòf—†W2&"–æ¦V7FVB–çFòF†RvÖRw2Æ–'&'’vRâGW&âöfbFòW6RöæÇ’F†RV–6²66W72æVÂâ"Â6†V6¶VC¢Æ–$'WGFöç2Âöä6†ævS¢7–æ2‡b’Óâ²6WDÆ–$'WGFöç2‡b“²v—B6WDÆ–'&'”'WGFöç2‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$†–FRFBõ&VÖ÷fRöâ÷væVBvÖW2"ÂFW67&—F–öã¢$†–FRF†R–æ¦V7FVBÆ–'&'’×vRFBõ&VÖ÷fRæBf—†W2&"f÷"ÆVv—F–ÖFVÇ’÷væVBvÖW2âf—†W2&VÖ–ç2f–Æ&ÆRF‡&÷Vv‚4Å4FV6²w2V–6²66W72ÖVçRâ"Â6†V6¶VC¢†–FT÷væVBÂöä6†ævS¢7–æ2‡b’Óâ²6WD†–FT÷væVB‡b“²v—B6WD†–FTöä÷væVB‡b“²ÒÒ’Ò•ÒÒ’Â5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$f—†W2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$æò–çFW&æWBf—‚"ÂFW67&—F–öã¢%v†VâF÷væÆöF–ær–ææVB'V–ÆBÂ7FVÒ6âf–Âv—F‚væò–çFW&æWB6öææV7F–öâr&V6W6RF†R6Æ–VçBf—‚w27FVÒæ6fr&Æö6·2—G2WFFW"âF†—2FV×÷&&–Ç’&VÖ÷fW2F†B&Æö6²6òF†RvÖRF÷væÆöG2ÂF†Vâ&W7F÷&W2—Böæ6RF†RF÷væÆöB7F'G2‡6òF†R7FVÒ6Æ–VçB6âwB6VÆb×WFFR7BF†R6ö×F–&ÆR'V–ÆB’âöâ'’FVfVÇBâ"Â6†V6¶VC¢æôæWBÂöä6†ævS¢7–æ2‡b’Óâ²6WDæôæWB‡b“²v—B6WDæô–çFW&æWDf—‚‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%–âvÖRfW'6–öâöâf—‚"ÂFW67&—F–öã¢$Æö6·2vÖRFò—G27W'&VçBfW'6–öâv†Vâf—‚—2Æ–VB6òâWFFR6âwB'&V²—Bâ6ÆV&VBöâVâÖf—‚â"Â6†V6¶VC¢–âÂöä6†ævS¢7–æ2‡b’Óâ²6WE–â‡b“²v—B6WE–äöäf—‚‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFòÖÇ’f—‚gFW"WFFR"ÂFW67&—F–öã¢%v†Vâf—‚F&vWG27V6–f–2'V–ÆBÂ–â—BæBWFFRF†RvÖRÂF†VâÇ’WFöÖF–6ÆÇ’öæ6RF†RF÷væÆöBf–æ—6†W2âöfbÒwV–FVC¢–÷R&W72Ç’gFW"F†RF÷væÆöB6ö×ÆWFW2â"Â6†V6¶VC¢WFôÇ’Âöä6†ævS¢7–æ2‡b’Óâ²6WDWFôÇ•7FFR‡b“²v—B6WDWFôÇ’‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFòÖf—‚ÆVæ6‚F&vWB"ÂFW67&—F–öã¢%v†Vâf—‚6†—2—G2÷vâ&WÆ6VÖVçBW†RÂ&Wö–çB7FVÒw2ÆVæ6‚FòF†RvÖRw2&VÂ&–æ&–W2õv–ãcBW†R6òF†Rf—‚7GVÆÇ’'Vç2†'—76W2'&ö¶VâÆVæ6†W"’âFF—F—fRÇS#B–÷W"÷F†W"ÆVæ6‚÷F–öç2&R¶WBâW"ÖvÖR÷fW'&–FRÆ—fW2VæFW"V–6²66W72ÇS#“"F†—2vÖRâ"Â6†V6¶VC¢WFõ&Wö–çBÂöä6†ævS¢7–æ2‡b’Óâ²6WDWFõ&Wö–çE7FFR‡b“²v—B6WDWFõ&Wö–çB‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFòÖÇ’f—†W2gFW"FF–ær"ÂFW67&—F–öã¢%v†VââFBf–æ—6†W2ÂF÷væÆöBæBÇ’F†RöæÆ–æRf—‚æBö÷"FVçWfòf—‚–bf–Æ&ÆRâFVçWfòf—‚Ç6òÖ&·2F†RvÖRæB–ç7FÆÇ2F†R7W7FöÒ&÷Föââ"Â6†V6¶VC¢WFôf—‚Âöä6†ævS¢7–æ2‡b’Óâ²6WDWFôf—…7FFR‡b“²v—B6WDWFôf—‚‡b“²ÒÒ’Ò•ÒÒ’Â5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%V–6²66W72ÖVçR"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$Væ&ÆRvÖ&Æ–ær–âV–6²66W72"ÂFW67&—F–öã¢%6†÷rF–6R'WGFöâ&W6–FR6WGF–æw2F†B÷Vç27F÷&R&÷VÆWGFR26VçFW&VB÷fW&Æ’âöfb'’FVfVÇBâ"Â6†V6¶VC¢&÷VÆWGFUÒÂöä6†ævS¢‡b’Óâ²6WE&÷VÆWGFUÒ‡b“²w&—FU&÷VÆWGFT&ööÂ…$õTÄUEDUõÕô´U’Âb“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$†–FRFööÇ2bF–væ÷7F–72–âV–6²66W72"ÂFW67&—F–öã¢$†–FRF†RFööÇ2æBF–væ÷7F–726V7F–öç2g&öÒF†RV–6²66W72æVÂf÷"6ÆVæW"ÖVçRâF†W’&VÖ–â†W&R–âGfæ6VBâ"Â6†V6¶VC¢†–FUFööÇ5ÒÂöä6†ævS¢7–æ2‡b’Óâ²6WD†–FUFööÇ5Õ7FFR‡b“²v—B6WD†–FUFööÇ5Ò‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%6†÷rF†—2vÖR–âV–6²66W72"ÂFW67&—F–öã¢%6†÷rF†RW"ÖvÖRFBõ&VÖ÷fRæBÇv—2Öf–Æ&ÆRf—†W26V7F–öâ–âV–6²66W72Â&÷fR7F–öç2âÆ–W2–ÖÖVF–FVÇ’æBv†VâF†RæVÂ—2&V÷VæVBâ"Â6†V6¶VC¢7F–öç4f—†W5ÒÂöä6†ævS¢‡b’Óâ°¢6WD7F–öç4f—†W5Ò‡b“°¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ„5D”ôå5ôd•„U5õÕô´U’CÂbò#"¢#"“°¢v–æF÷ræF—7F6„WfVçB†æWr7W7FöÔWfVçB„5D”ôå5ôd•„U5õÕôUdTåBCÂ²FWF–Ã¢bÒ’“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%6†÷rFFVBvÖW2–âV–6²66W72"ÂFW67&—F–öã¢$Ö÷fRF†RFFVBÖvÖW2Æ—7B–çFòF†RV–6²66W72æVÂÂVæFW"7F–öç2bf—†W2‡&VÖ÷fW2F†R–ç7FÆÆVBF"†W&R’âÆ–W2v†VâF†RæVÂ—2&V÷VæVBâ"Â6†V6¶VC¢vÖW5ÒÂöä6†ævS¢7–æ2‡b’Óâ²6WDvÖW5Ò‡b“²v—B6WDvÖW4–åÒ‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%6†÷r&V–ç7FÆÂ4Å77FVÒ–âV–6²66W72"ÂFW67&—F–öã¢%v†Vâ4Å77FVÒ—2–ç7FÆÆVBÂ6†÷r—G27FGW2æB&V–ç7FÆÂ6V7F–öâ–âV–6²66W72öâ7F÷&RvW2â–ç7FÆÂ7F–ÆÂ6†÷w2v†Vâ—B—6âwB–ç7FÆÆVB–WBâ"Â6†V6¶VC¢&V–ç7FÆÅÒÂöä6†ævS¢7–æ2‡b’Óâ²6WE&V–ç7FÆÅÒ‡b“²v—B6WE6†÷u&V–ç7FÆÅÒ‡b“²ÒÒ’Ò•ÒÒ’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢%7F÷&R&÷VÆWGFR"Â6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$F—6&ÆRvÖ&Æ–ærF""ÂFW67&—F–öã¢$†–FR7F÷&R&÷VÆWGFRg&öÒF†RGfæ6VB6–FV&"âF†RV–6²66W72F–6R&VÖ–ç26öçG&öÆÆVB6W&FVÇ’&÷fRâöfb'’FVfVÇBâ"Â6†V6¶VC¢&÷VÆWGFUF$F—6&ÆVBÂöä6†ævS¢‡b’Óâ²6WE&÷VÆWGFUF$F—6&ÆVB‡b“²w&—FU&÷VÆWGFT&ööÂ…$õTÄUEDUõD%ôD•4$ÄTEô´U’Âb“²ÒÒ’Ò’Ò’Â5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$vÖW2bÆ–'&'’"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$æ÷F–g’v†VâvÖW2&RFFVB"ÂFW67&—F–öã¢%6†÷ræ÷F–f–6F–öâgFW"â4Å77FVÒvÖR—27V66W76gVÆÇ’FFVBâFBf–ÇW&W2æBfW&–f–6F–öâv&æ–æw2&VÖ–âf—6–&ÆRâ"Â6†V6¶VC¢æ÷F–g”vÖTFG2Âöä6†ævS¢7–æ2‡fÇVR’Óâ²6WDæ÷F–g”vÖTFG2‡fÇVR“²v—B6WDæ÷F–g”vÖTFB‡fÇVR“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%7W&f6Rf–ÆVB6÷W&6W2"ÂFW67&—F–öã¢%6†÷röæRæ÷F–f–6F–öâÆ—7F–ærWfW'’Öæ–fW7B&÷f–FW"F†Bf–ÆVBæBv26¶—VBGW&–ærâFBGFV×Bâöfb'’FVfVÇBâ"Â6†V6¶VC¢7W&f6Tf–ÆVE6÷W&6W2Âöä6†ævS¢7–æ2‡fÇVR’Óâ²6WE7W&f6Tf–ÆVE6÷W&6W2‡fÇVR“²v—B6WEV•6WGF–ær‚'Fö7Döå6÷W&6Tf–ÇW&R"ÂfÇVR“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$6†–WfVÖVçG2‡6Ç7FVÒÖÖööâ’"ÂFW67&—F–öã¢6„Öööà¢ò$ÆWBFFVBvÖW2VæÆö6²6†–WfVÖVçG2(	BÖööâfWF6†W2F†R&VÂ66†VÖÆ—fRg&öÒ7FVÒ'’–×W'6öæF–ærâ÷væW"â&W7F'B7FVÒgFW"6†æv–ærâ ¢¢$æVVG2F†R6Ç7FVÒÖÖööâVæv–æRâ7Fö6²4Å77FVÒ–væ÷&W2F†—26WGF–ær‡W6R4Å66†VWfòFò&RÖvVæW&FR6†–WfVÖVçG2–ç7FVB’â"Â6†V6¶VC¢6†–WfVÖVçG2Âöä6†ævS¢7–æ2‡b’Óâ²6WD6†–WfVÖVçG57FFR‡b“²v—B6WD6†–WfVÖVçG2‡b“²ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$WFöÖF–6ÆÇ’WFFRÖævVBvÖW2"ÂFW67&—F–öã¢$¶VWVç–ææVB4Å2vÖW2öâF†V—"ÆFW7Bf–Æ&ÆR'V–ÆBâW"ÖvÖRÖæ–fW7B–ç27F–ÆÂF¶R&V6VFVæ6Râ&W7F'B7FVÒgFW"6†æv–ærâ"Â6†V6¶VC¢WFõWFFT2Âöä6†ævS¢7–æ2‡b’Óâ°¢6WDWFõWFFT57FFR‡b“°¢6öç7B"Òv—B6WDWFõWFFT2‡b“°¢–b‚#òç7V66W72’°¢6WDWFõWFFT57FFR‚b“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢#òæW'&÷"ÇÂ$6÷VÆBæ÷Bw&—FRF†RÖööâ6öæf–r"Ò“°¢Ð¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%6†&R÷væVBÖæ–fW7B&WVW7B6öFW2"ÂFW67&—F–öã¢$ÆÆ÷rÖööâFò6öçG&–'WFR6†÷'BÖÆ—fVBÖæ–fW7B&WVW7B6öFW2öæÇ’f÷"FW÷G2F†—27FVÒ66÷VçB÷vç2âöfbF—6&ÆW2&÷F‚7F—fR&WVW7G2æB76—fR6GW&Râ"Â6†V6¶VC¢Öæ–fW7DFöæF–öâÂöä6†ævS¢7–æ2‡b’Óâ°¢6WDÖæ–fW7DFöæF–öå7FFR‡b“°¢6öç7B"Òv—B6WDÖæ–fW7DFöæF–öâ‡b“°¢–b‚#òç7V66W72’°¢6WDÖæ–fW7DFöæF–öå7FFR‚b“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢#òæW'&÷"ÇÂ$6÷VÆBæ÷Bw&—FRF†RÖööâ6öæf–r"Ò“°¢Ð¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$w&÷W4Å2vÖW2–çFò6öÆÆV7F–öâ"ÂFW67&—F–öã¢$¶VW7FVÒ6öÆÆV7F–öâæÖVBu4Å4FV6²rWFò×7–æ6VBv—F‚WfW'’vÖR–÷RFFVBF‡&÷Vv‚4Å77FVÒÂ6òF†W’w&RV7’Fòf–æBÖöær–÷W"÷væVBF—FÆW2âWFFW2öâ&ö÷BæB2–÷RFB÷&VÖ÷fRvÖW2âöfb'’FVfVÇC²GW&æ–ær—BöfbÆVfW2F†R6öÆÆV7F–öâ2Ö—2â"Â6†V6¶VC¢w&÷W6öÆÆV7F–öâÂöä6†ævS¢7–æ2‡b’Óâ°¢6WDw&÷W6öÆÆV7F–öå7FFR‡b“°¢v—B6WDw&÷W6öÆÆV7F–öâ‡b“°¢–b‡b’°¢7–æ56Ç46öÆÆV7F–öâ‚’æ6F6‚‚‚’Óâ²Ò“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$'V–ÆF–ærF†R4Å4FV6²6öÆÆV7F–öî(
b"Ò“°¢Ð¢VÇ6R°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$6öÆÆV7F–öâ7–æ2öfb†W†—7F–ær6öÆÆV7F–öâ¶WB’"Ò“°¢Ð¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$&6·W7W7FöÒÖæ–fW7G2æBf—†W2"ÂFW67&—F–öã¢$–æ6ÇVFR–×÷'FVB7W7FöÒf—†W2æBÖæ–fW7G2‡âòæÆö6Â÷6†&Rõ4Å4FV6²’–âF†R&6·W&6†—fRâv†Vâ&W7F÷&VBÂF†W’&VV"–âF†Rf—†W2æBF÷væÆöBF'2âöfb'’FVfVÇBâ"Â6†V6¶VC¢&6·W7W7FöÒÂöä6†ævS¢7–æ2‡b’Óâ²6WD&6·W7W7FöÕ7FFR‡b“²v—B6WD&6·W7W7FöÒ‡b“²ÒÒ’Ò•ÒÒ’Â5ô¥5‚æ§7‚„FDF÷væÆöEFövvÆRÂ·Ò’Â5ô¥5‚æ§7‚„FÆ46Æ÷VEFövvÆW2Â·Ò’Â5ô¥5‚æ§7‚„–æ¦V7F–öå&V6÷fW'’Â·Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$Gfæ6VBFööÇ2"Â6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%6†÷r…bÖöGVÆRF""ÂFW67&—F–öã¢%6†÷rF†R…bÖöGVÆR6öçG&öÇ2–âGfæ6VBâ†–FFVâ'’FVfVÇC²Fö¶VW"7F—fF–öâW6W2F†R6W&FRFö¶VW"†VÇW"vRâ"Â6†V6¶VC¢6†÷tFV6·”‡bÂöä6†ævS¢‡b’Óâöå6†÷tFV6·”‡d6†ævR‡b’Ò’Ò’Ò’Â5ô¥5‚æ§7‡2„DdÂåæVÅ6V7F–öâÂ²F—FÆS¢$Æ–'&'’&FvW2"Â6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$VÖö¦’&FvW2"ÂFW67&—F–öã¢%&WÆ6RV6‚Væ&ÆVB&FvRv—F‚—G2VÖö¦’æÆöwVS¢4Å2ÇTCƒ45ÇTDdcEÇS#EÇS#c#ÇTdSbÂÆVv—BÇTCƒ4EÇTD4#RÂf—‚ÇTCƒ4EÇTDC#rÂFö¶VW"¶W’ÇTCƒ4EÇTDCÂöæÆ–æRf—‚ÇTCƒ45ÇTDcÂFVçWfòÇTCƒ4EÇTD3tÂæöâÕ7FVÒÇS#sS2âF—6&ÆVB&FvW27F’†–FFVââ"Â6†V6¶VC¢&FvTVÖö¦’Âöä6†ævS¢‡b’Óâ°¢6WD&FvTVÖö¦’‡b“°¢6WDVÖö¦”&FvW4Væ&ÆVB‡b“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%4Å2&FvR"ÂFW67&—F–öã¢$Ö&·2vÖW2FFVBF‡&÷Vv‚4Å77FVÒâ"Â6†V6¶VC¢&FvU6Ç2Âöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvU6Ç2‡b“°¢v—B6WD&FvT÷F–öâ‚'6Ç2"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$ÆVv—B&FvR"ÂFW67&—F–öã¢$Ö&·2vÖW2–÷R7GVÆÇ’÷vâÇS#B7FVÒÆ–'&'’F—FÆW2F†B&VâwB4Å77FVÒFF—F–öç2÷"æöâÕ7FVÒ6†÷'F7WG2â"Â6†V6¶VC¢&FvTÆVv—BÂöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTÆVv—B‡b“°¢v—B6WD&FvT÷F–öâ‚&ÆVv—B"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$FVçWfò&FvR"ÂFW67&—F–öã¢$Ö&·2FVçWfò×&÷FV7FVBvÖW2Âg&öÒ7FVÒw2÷vâE$Òæ÷F–6R‡6VVFVBv—F‚'—WRw2'—72Æ—7B’â6†÷vâöâF†R&–v‡BÂ6ò—B6â6—BÆöæw6–FRF†R4Å2÷"ÆVv—B&FvRâ"Â6†V6¶VC¢&FvTFVçWfòÂöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTFVçWfò‡b“°¢v—B6WD&FvT÷F–öâ‚&FVçWfò"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$öæÆ–æRÖf—‚&FvR"ÂFW67&—F–öã¢$Ö&·2vÖW2F†B†fRâöæÆ–æRf—‚–ç7FÆÆVBâ"Â6†V6¶VC¢&FvTöæÆ–æTf—‚Âöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTöæÆ–æTf—‚‡b“°¢v—B6WD&FvT÷F–öâ‚&öæÆ–æTf—‚"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$f—‚ÖÆ–VB&FvR„d•„TB’"ÂFW67&—F–öã¢$Ö&·2vÖW2v—F‚æöâÖöæÆ–æRf—‚–ç7FÆÆVB‡'—WRò7&6²òvVæW&–2’âöæÆ–æRf—†W2vWBF†RöæÆ–æRÖf—‚&FvR–ç7FVBâ"Â6†V6¶VC¢&FvTf—†VBÂöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTf—†VB‡b“°¢v—B6WD&FvT÷F–öâ‚&f—†VB"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢%Fö¶VW"¶W’&FvR"ÂFW67&—F–öã¢$Ö&·2vÖW2v†÷6RFö¶VW"¶W’v27V66W76gVÆÇ’&VFVVÖVBÂ÷"v†÷6RV&—6ögBF&FFæ§6öâv27V66W76gVÆÇ’–ç7FÆÆVBâVÖö¦’ÖöFRW6W2ÇTCƒ4EÇTDCâ"Â6†V6¶VC¢&FvUFö¶VW"Âöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvUFö¶VW"‡b“°¢v—B6WD&FvT÷F–öâ‚'Fö¶VW""Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$æöâÕ7FVÒ&FvR"ÂFW67&—F–öã¢$&Æ6²äôâÕ5DTÒ&FvRöâæöâÕ7FVÒ6†÷'F7WG2â"Â6†V6¶VC¢&FvTæöå7FVÒÂöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTæöå7FVÒ‡b“°¢v—B6WD&FvT÷F–öâ‚&æöå7FVÒ"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$æöâÕ7FVÒÖæÖR&FvR"ÂFW67&—F–öã¢$W‡G&&FvRöâæöâÕ7FVÒ6†÷'F7WG26†÷v–ærF†RæÖRÂF¶Vâg&öÒF†RF&vWBW†V7WF&ÆRw2föÆFW"â"Â6†V6¶VC¢&FvTæöå7FVÔæÖRÂöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTæöå7FVÔæÖR‡b“°¢v—B6WD&FvT÷F–öâ‚&æöå7FVÔæÖR"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$&FvW2–âÆ–'&'’w&–B"ÂFW67&—F–öã¢%6†÷r&FvW2öâÆ–'&'’67VÆW2æBF†R†öÖR6&÷W6VÂâ"Â6†V6¶VC¢&FvTÆ–'&'’Âöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTÆ–'&'’‡b“°¢v—B6WD&FvT÷F–öâ‚&Æ–'&'’"Âb“°¢&Vg&W6„&FvW2‚“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$&FvW2öâvÖRvW2"ÂFW67&—F–öã¢$Ç6ò6†÷rF†W6R&FvW2öâvÖRw2FWF–Ç2vRÂæ÷B§W7BöâÆ–'&'’67VÆW2â"Â6†V6¶VC¢&FvTvÖUvRÂöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvTvÖUvR‡b“°¢v—B6WD&FvT÷F–öâ‚&vÖUvR"Âb“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂåFövvÆTf–VÆBÂ²Æ&VÃ¢$&FvW2öâ7F÷&RvW2"ÂFW67&—F–öã¢%6†÷r4Å2òFVçWfòòf—‚&FvW2öâF†R–âÕ7FVÒ7F÷&RvR‡F÷ÖÆVgB’âæòÆVv—BF†W&RÇS#B7F÷&RvR—6âwB&ööböb÷væW'6†—â"Â6†V6¶VC¢&FvU7F÷&UvRÂöä6†ævS¢7–æ2‡b’Óâ°¢6WD&FvU7F÷&UvR‡b“°¢v—B6WD&FvT÷F–öâ‚'7F÷&UvR"Âb“°¢ÒÒ’Ò’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãbÂFF–æs¢#'‚G‚"ÒÂ6†–ÆG&Vã¢$æöâÕ7FVÒ6†÷'F7WG2&RæWfW"&FvVBÇS#BF†W’w&RæV—F†W"4Å77FVÒFF—F–öç2æ÷"Æ–6Vç6VB7FVÒF—FÆW2â"Ò’Ò•ÒÒ’Â5ô¥5‚æ§7‚…WFFW56V7F–öâÂ·Ò’Â5ô¥5‚æ§7‚„&6·W6V7F–öâÂ·Ò•ÒÒ’“°§Ð¢ò¢)H)H&÷WBæR)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H¢ð¦gVæ7F–öâ&÷WEæR‚’°¢&WGW&â…5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„†VÇ‡V"Â·Ò’Ò’“°§Ð¢ò¢)H)HF†RvR)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H¢ð¦gVæ7F–öâGfæ6VEvR‚’°¢6öç7B·Fö²Â6WEFöµÒÒ5õ$T5BçW6U7FFRƒ“°¢6öç7B'V×Ò‚’Óâ6WEFö²‚‡B’ÓâB²“°¢6öç7B¶vÖW4–åÒÂ6WDvÖW4–åÓ%ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·6†÷tFV6·”‡bÂ6WE6†÷tFV6·”‡eÒÒ5õ$T5BçW6U7FFR‡&VDFV6·”‡ef—6–&ÆR“°¢6öç7B·&÷VÆWGFUF$F—6&ÆVBÂ6WE&÷VÆWGFUF$F—6&ÆVEÒÒ5õ$T5BçW6U7FFR‚‚’Óâ&VE&÷VÆWGFT&ööÂ…$õTÄUEDUõD%ôD•4$ÄTEô´U’’“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢vWDvÖW4–åÒ‚’çF†Vâ‚‡"’Óâ6WDvÖW4–åÓ"‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢6öç7B&Vg&W6…&÷VÆWGFRÒ‚’Óâ6WE&÷VÆWGFUF$F—6&ÆVB‡&VE&÷VÆWGFT&ööÂ…$õTÄUEDUõD%ôD•4$ÄTEô´U’’“°¢v–æF÷ræFDWfVçDÆ—7FVæW"…$õTÄUEDUõ$Te5ôUdTåBÂ&Vg&W6…&÷VÆWGFR“°¢&WGW&â‚’Óâv–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"…$õTÄUEDUõ$Te5ôUdTåBÂ&Vg&W6…&÷VÆWGFR“°¢ÒÂµÒ“°¢6öç7B6WDFV6·”‡ef—6–&ÆRÒ†Væ&ÆVB’Óâ°¢6WE6†÷tFV6·”‡b†Væ&ÆVB“°¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ„DT4µ•ô…eõd•4”$ÄUô´U’ÂVæ&ÆVBò#"¢#"“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ó°¢&WGW&â…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚'7G–ÆR"Â²6†–ÆG&Vã¢Edä4TEõtUõD„TÔRÒ’Â5ô¥5‚æ§7‚„DdÂå6–FV&$æf–vF–öâÂ²F—FÆS¢%4Å4FV6²"Â6†÷uF—FÆS¢G'VRÂvW3¢°¢°¢F—FÆS¢$&6†—fR"À¢–6öã¢5ô¥5‚æ§7‚„f&6†—fRÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„&6†—fU6V7F–öâÂ·Ò’Ò’À¢ÒÀ¢°¢F—FÆS¢$FWVæFVæ6–W2"À¢–6öã¢5ô¥5‚æ§7‚„f&÷„÷VâÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„FWVæFVæ6–W56V7F–öâÂ·Ò’Ò’À¢ÒÀ¢°¢F—FÆS¢$÷F–öç2"À¢–6öã¢5ô¥5‚æ§7‚„f6Æ–FW'4‚Â·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„÷F–öç5æRÂ²6†÷tFV6·”‡c¢6†÷tFV6·”‡bÂöå6†÷tFV6·”‡d6†ævS¢6WDFV6·”‡ef—6–&ÆRÒ’À¢ÒÀ¢°¢F—FÆS¢%6÷W&6W2b¶W—2"À¢–6öã¢5ô¥5‚æ§7‚„f¶W’Â·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚…6WGF–æw56V7F–öâÂ·Ò’Ò’À¢ÒÀ¢°¢F—FÆS¢$FBvÖR"À¢–6öã¢5ô¥5‚æ§7‚„fF÷væÆöBÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„FDvÖU6V7F–öâÂ²öä6†ævVC¢'V×Â&Vg&W6…Fö¶Vã¢Fö²Â6†÷t–ç7FÆÆVC¢vÖW4–åÒÒ’Ò’À¢ÒÀ¢°¢F—FÆS¢$vÖRf—†W2"À¢–6öã¢5ô¥5‚æ§7‚„fw&Væ6‚Â·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‡2„&öG’Â²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚„f—†W56V7F–öâÂ·Ò’Â5ô¥5‚æ§7‚„öæÆ–æTf—…W6W&æÖRÂ·Ò•ÒÒ’À¢ÒÀ¢°¢F—FÆS¢$6Æ÷VB6fW2"À¢–6öã¢5ô¥5‚æ§7‚„f6Æ÷VBÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„6Æ÷VE&VF—&V7E6V7F–öâÂ·Ò’Ò’À¢ÒÀ¢°¢F—FÆS¢%Fö¶VW"†VÇW""À¢–6öã¢5ô¥5‚æ§7‚„fÆö6²Â·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚…Fö¶VW%6V7F–öâÂ·Ò’Ò’À¢ÒÀ¢âââ‡6†÷tFV6·”‡bò·°¢F—FÆS¢$…bÖöGVÆR"À¢–6öã¢5ô¥5‚æ§7‚„f6†–VÆDÇBÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„‡—W'f—6÷%6V7F–öâÂ·Ò’Ò’À¢ÕÒ¢µÒ’À¢°¢F—FÆS¢$ÖöG2"À¢–6öã¢5ô¥5‚æ§7‚„fW§¦ÆU–V6RÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„ÖöG56V7F–öâÂ·Ò’Ò’À¢ÒÀ¢âââ‚&÷VÆWGFUF$F—6&ÆVBò·°¢F—FÆS¢%7F÷&R&÷VÆWGFR"À¢–6öã¢5ô¥5‚æ§7‚„fF–6RÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&öG’Â²6†–ÆG&Vã¢5ô¥5‚æ§7‚„Ö–æ–vÖU6V7F–öâÂ·Ò’Ò’À¢ÕÒ¢µÒ’À¢°¢F—FÆS¢$&÷WB"À¢–6öã¢5ô¥5‚æ§7‚„f–æfô6—&6ÆRÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„&÷WEæRÂ·Ò’À¢ÒÀ¢ÒÒ•ÒÒ’“°§Ð ¦gVæ7F–öâf—„ÖöFÂ‡²–BÂ6Æ÷6TÖöFÂÒ’°¢&WGW&â…5ô¥5‚æ§7‡2„DdÂäÖöFÅ&ö÷BÂ²6Æ÷6TÖöFÃ¢6Æ÷6TÖöFÂÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢#ÂföçEvV–v‡C¢cÂÖ&v–ä&÷GFöÓ¢ÒÂ6†–ÆG&Vã¢$f—†W2"Ò’Â5ô¥5‚æ§7‚„f—…–6¶W"Â²–C¢–BÂöä6Æ÷6S¢6Æ÷6TÖöFÂÒ•ÒÒ’“°§Ð¢ò¢ ¢¢4Å4FV6²6öçG&öÇ2f÷"F†RÖFWF–Ç2vR(	B76VB&"„FBò&VÖ÷fR°¢¢f—†W2’7Æ–6VB–çFòF†RvRw2÷vâ&V7BG&VRâ&W7F'B7FVÒÆ—fW2öæÇ’–âF†P¢¢V–6²66W72æVÂ†æW‡BFò$FBv—F‚4Å77FVÒ"’Â6ò—Bw2æ÷B&WVFVB†W&Rà¢¢ð¦gVæ7F–öâvÖT7F–öä'WGFöç2‚’°¢6öç7B&×2ÒDdÂçW6U&×2‚“°¢6öç7B–BÒ&×3òæ–BbbõåÆB²BòçFW7B‡&×2æ–B’ò'6T–çB‡&×2æ–BÂ’¢çVÆÃ°¢6öç7B¶–ç7FÆÆVBÂ6WD–ç7FÆÆVEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶†–FFVäf÷$÷væVBÂ6WD†–FFVäf÷$÷væVEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶&$Væ&ÆVBÂ6WD&$Væ&ÆVEÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7B·&öw&W72Â6WE&öw&W75ÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7BöÆÂÒ5õ$T5BçW6U&Vb†çVÆÂ“°¢6öç7B7F÷Ò‚’Óâ°¢–b‡öÆÂæ7W'&VçB’°¢6ÆV$–çFW'fÂ‡öÆÂæ7W'&VçB“°¢öÆÂæ7W'&VçBÒçVÆÃ°¢Ð¢Ó°¢5õ$T5BçW6TVffV7B‚‚’Óâ‚’Óâ7F÷‚’ÂµÒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢–b†–BÓÒçVÆÂ¢&WGW&ã°¢6WD'W7’‚""“°¢6WE&öw&W72‚""“°¢ÆWB6æ6VÆÆVBÒfÇ6S°¢†7–æ2‚’Óâ°¢ÆWB÷W'2ÒfÇ6S°¢G'’°¢÷W'2Ò†v—B†4ÇV†–B’’æW†—7G3°¢Ð¢6F6‚°¢÷W'2ÒfÇ6S°¢Ð¢–b†6æ6VÆÆVB¢&WGW&ã°¢6WD–ç7FÆÆVB†÷W'2“°¢ÆWB&VbÒG'VS°¢G'’°¢&VbÒ†v—BvWD†–FTöä÷væVB‚’’æVæ&ÆVC°¢Ð¢6F6‚°¢&VbÒG'VS°¢Ð¢–b†6æ6VÆÆVB¢&WGW&ã°¢6WD†–FFVäf÷$÷væVB‡6†÷VÆD†–FTf÷$÷væVB†–BÂ÷W'2Â&Vb’ÇÀ¢‡&Vbbb÷W'2bb—4æöå7FVÕ6†÷'F7WB†–B’’“°¢G'’°¢6öç7B"Òv—BvWDÆ–'&'”'WGFöç2‚“°¢–b‚6æ6VÆÆVB¢6WD&$Væ&ÆVB‚"æVæ&ÆVB“°¢Ð¢6F6‚°¢ò¢FVfVÇBöâ¢ð¢Ð¢Ò’‚“°¢&WGW&â‚’Óâ°¢6æ6VÆÆVBÒG'VS°¢Ó°¢ÒÂ¶–EÒ“°¢6öç7BFôFBÒ7–æ2‚’Óâ°¢–b†–BÓÒçVÆÂ¢&WGW&ã°¢6WD'W7’‚&FF–ær"“°¢6WE&öw&W72‚%7F'F–æ~(
b"“°¢Ö&µ6Ç4FEVæF–ær†–B“°¢G'’°¢6öç7B&W2Òv—B7F'DFB†–B“°¢–b‚&W2ç7V66W72’°¢Ö&µ6Ç4FEVæF–ær†–BÂfÇ6R“°¢6WD'W7’‚""“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢&W2æW'&÷"ÇÂ$6÷VÆBæ÷BFB"Ò“°¢&WGW&ã°¢Ð¢Ð¢6F6‚°¢Ö&µ6Ç4FEVæF–ær†–BÂfÇ6R“°¢6WD'W7’‚""“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢$6÷VÆBæ÷B7F'B"Ò“°¢&WGW&ã°¢Ð¢7F÷‚“°¢öÆÂæ7W'&VçBÒ6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B7BÒ†v—BvWDFE7FGW2†–B’’ç7FFRÇÂ·Ó°¢6WE&öw&W72‡7Bç7FGW2ÇÂ""“°¢–b…²&FöæR"Â&f–ÆVB"Â&6æ6VÆÆVB%Òæ–æ6ÇVFW2‡7Bç7FGW2ÇÂ""’’°¢7F÷‚“°¢6WD'W7’‚""“°¢–b‡7Bç7FGW2ÓÓÒ&FöæR"’°¢6WD–ç7FÆÆVB‡G'VR“°¢fö–B&Vg&W6„&FvW2‚“°¢Ð¢VÇ6R°¢Ö&µ6Ç4FEVæF–ær†–BÂfÇ6R“°¢–b‡7Bç7FGW2ÓÓÒ&f–ÆVB"’°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢7BæW'&÷"ÇÂ$f–ÆVB"Ò“°¢Ð¢Ð¢Ð¢Ð¢6F6‚°¢ò¢¶VWöÆÆ–ær¢ð¢Ð¢ÒÂs“°¢Ó°¢6öç7BFõ&VÖ÷fRÒ7–æ2‚’Óâ°¢–b†–BÓÒçVÆÂ¢&WGW&ã°¢6WD'W7’‚'&VÖ÷f–ær"“°¢G'’°¢v—BFVÆWFTÇV†–B“°¢6WD–ç7FÆÆVB†fÇ6R“°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%&VÖ÷fVB(	B&W7F'B7FVÒ"Ò“°¢Ð¢6F6‚°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢%&VÖ÷fRf–ÆVB"Ò“°¢Ð¢f–æÆÇ’°¢6WD'W7’‚""“°¢Ð¢Ó°¢òòF†R–æ¦V7FVBÆ–'&'’×vR&"ö&W—2$†–FRFBõ&VÖ÷fRöâ÷væVBvÖW2"0¢òòöæR7W&f6RÂ–æ6ÇVF–ær—G2f—†W2'WGFöââf—†W2&VÖ–âf–Æ&ÆR6W&FVÇ¢òòg&öÒ4Å4FV6²w2V–6²66W72vÖT6öçG&öÇ56V7F–öâà¢–b†–BÓÒçVÆÂÇÂ†–FFVäf÷$÷væVBÇÂ&$Væ&ÆVB¢&WGW&âçVÆÃ°¢6öç7Bv÷&¶–ærÒ'W7’ÓÒ"#°¢6öç7B&–rÒ²fÆWƒ¢ÂÖ–åv–GFƒ¢ÂFF–æs¢#‚g‚"ÂföçE6—¦S¢RÓ°¢&WGW&â…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²Ö&v–ã¢##‚#G‚‡‚"ÒÂ6†–ÆG&Vã¢5ô¥5‚æ§7‡2„DdÂäfö7W6&ÆRÂ²7G–ÆS¢²F—7Æ“¢&fÆW‚"Âv¢"ÒÂ&fÆ÷rÖ6†–ÆG&Vâ#¢'&÷r"Â6†–ÆG&Vã¢¶–ç7FÆÆVBò…5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²7G–ÆS¢&–rÂF—6&ÆVC¢v÷&¶–ærÂöä6Æ–6³¢Fõ&VÖ÷fRÂ6†–ÆG&Vã¢'W7’ÓÓÒ'&VÖ÷f–ær"ò%&VÖ÷f–æ~(
b"¢/	ùy&VÖ÷fR"Ò’’¢…5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²7G–ÆS¢&–rÂF—6&ÆVC¢v÷&¶–ærÂöä6Æ–6³¢FôFBÂ6†–ÆG&Vã¢'W7’ÓÓÒ&FF–ær"ò&öw&W72ÇÂ$FF–æ~(
b"¢.ûÈ²FBv—F‚4Å77FVÒ"Ò’’Â5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²7G–ÆS¢&–rÂF—6&ÆVC¢v÷&¶–ærÂöä6Æ–6³¢‚’Óâ–BÒçVÆÂbbDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚„f—„ÖöFÂÂ²–C¢–BÒ’’Â6†–ÆG&Vã¢$f—†W2"Ò•ÒÒ’Ò’“°§Ð ¦6öç7B5E”ÄU2Ò°¢6Ç3¢²Æ&VÃ¢%4Å2"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ3v#FFC‚RÂ6ƒSVcrR’"ÒÀ¢ÆVv—C¢²Æ&VÃ¢$ÄTt•B"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ3cv6bRÂ3&fƒV2R’"ÒÀ¢FVçWfó¢²Æ&VÃ¢$DTåUdò"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ6&&RÂ6SS#S"R’"ÒÀ¢öæÆ–æVf—ƒ¢²Æ&VÃ¢$ôäÄ”äRd•‚"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ3cVc–RRÂ36C†fC‚R’"ÒÀ¢f—†VC¢²Æ&VÃ¢$d•„TB"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ3CvCvBRÂ3v#6#2R’"ÒÀ¢Fö¶VW#¢²Æ&VÃ¢%Dô´TU"´U’"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ3–#f#bRÂ6CvS&"R’"ÒÀ¢Fö¶VW&6†V6³¢²Æ&VÃ¢%Dô´TU"4„T4²"Â&6¶w&÷VæC¢&Æ–æV"Öw&F–VçBƒ3VFVrÂ3†#FCbRÂ6C“ssbR’"ÒÀ§Ó°¦gVæ7F–öâvÖTFWF–Ç4&FvR‚’°¢6öç7B&×2ÒDdÂçW6U&×2‚“°¢6öç7B–BÒ&×3òæ–BbbõåÆB²BòçFW7B‡&×2æ–B’ò'6T–çB‡&×2æ–BÂ’¢çVÆÃ°¢6öç7B¶¶–æG2Â6WD¶–æG5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶&FvUfW'6–öâÂ6WD&FvUfW'6–öåÒÒ5õ$T5BçW6U7FFRƒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢6öç7Böä&FvT6†ævRÒ‚’Óâ6WD&FvUfW'6–öâ‚‡b’Óâb²“°¢v–æF÷ræFDWfVçDÆ—7FVæW"‚'6Ç6FV6²ÖVÖö¦’Ö&FvW2"Âöä&FvT6†ævR“°¢v–æF÷ræFDWfVçDÆ—7FVæW"„$DtUõ5DDUôUdTåBÂöä&FvT6†ævR“°¢&WGW&â‚’Óâ°¢v–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"‚'6Ç6FV6²ÖVÖö¦’Ö&FvW2"Âöä&FvT6†ævR“°¢v–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"„$DtUõ5DDUôUdTåBÂöä&FvT6†ævR“°¢Ó°¢ÒÂµÒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢–b†–BÓÒçVÆÂ’°¢6WD¶–æG2…µÒ“°¢&WGW&ã°¢Ð¢ÆWB6æ6VÆÆVBÒfÇ6S°¢†7–æ2‚’Óâ°¢ÆWB÷G2Ò°¢6Ç3¢G'VRÂÆVv—C¢G'VRÂFVçWfó¢G'VRÂvÖUvS¢G'VRÂöæÆ–æTf—ƒ¢G'VRÂf—†VC¢G'VRÂFö¶VW#¢G'VRÀ¢Ó°¢G'’°¢6öç7B"Òv—BvWD&FvT÷F–öç2‚“°¢–b‡"ç7V66W72’°¢÷G2Ò°¢6Ç3¢"ç6Ç2À¢ÆVv—C¢"æÆVv—BÀ¢FVçWfó¢"æFVçWfòÀ¢vÖUvS¢"ævÖUvRÀ¢öæÆ–æTf—ƒ¢"æöæÆ–æTf—‚À¢f—†VC¢"æf—†VBÀ¢Fö¶VW#¢"çFö¶VW"À¢Ó°¢Ð¢Ð¢6F6‚°¢ò¢FVfVÇG2¢ð¢Ð¢–b†6æ6VÆÆVBÇÂ÷G2ævÖUvR’°¢–b‚6æ6VÆÆVB¢6WD¶–æG2…µÒ“°¢&WGW&ã°¢Ð¢ÆWB÷W'2ÒfÇ6S°¢ÆWB÷væW'6†—¶æ÷vâÒG'VS°¢ÆWBWfW$FFVBÒfÇ6S°¢G'’°¢6öç7BVÒv—BvWDWfW$FFVB‚“°¢WfW$FFVBÒ†Væ–G2ÇÂµÒ’æÖ„çVÖ&W"’æ–æ6ÇVFW2†–B“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢G'’°¢÷W'2Ò†v—B†4ÇV†–B’’æW†—7G3°¢Ð¢6F6‚°¢÷W'2ÒfÇ6S°¢÷væW'6†—¶æ÷vâÒfÇ6S°¢Ð¢–b†6æ6VÆÆVB¢&WGW&ã°¢6öç7B6†÷'F7WBÒ—4æöå7FVÕ6†÷'F7WB†–B“°¢6öç7B÷WBÒµÓ°¢–b†÷W'2bb÷G2ç6Ç2¢÷WBçW6‚‚'6Ç2"“°¢VÇ6R–b‚÷W'2bb÷væW'6†—¶æ÷vâbbWfW$FFVBbb6†÷'F7WBbb÷G2æÆVv—Bbb—4–äÆ–'&'’†–B’’°¢÷WBçW6‚‚&ÆVv—B"“°¢Ð¢–b†÷G2æFVçWfòbb6†÷'F7WB’°¢ÆWB—4FVçWfòÒfÇ6S°¢G'’°¢6öç7B¶æ÷vâÒv—BFVçWfô¶æ÷vâ‚“°¢—4FVçWfòÒ†¶æ÷vâæFVçWfòÇÂµÒ’æ–æ6ÇVFW2†–B“°¢–b‚—4FVçWfò’°¢6öç7B"Òv—BFVçWfõ&W6öÇfR…¶–EÒ“°¢—4FVçWfòÒ‡"æFVçWfòÇÂµÒ’æ–æ6ÇVFW2†–B“°¢Ð¢Ð¢6F6‚°¢ò¢Væ¶æ÷vâ¢ð¢Ð¢–b‚6æ6VÆÆVBbb—4FVçWfò¢÷WBçW6‚‚&FVçWfò"“°¢Ð¢–b†÷G2æöæÆ–æTf—‚ÇÂ÷G2æf—†VB’°¢G'’°¢6öç7B"Òv—BvWD–ç7FÆÆVDf—†W2‚“°¢6öç7BG—W2Ò‡"æf—†W2ÇÂµÒ¢æf–ÇFW"‚†g‚’ÓâçVÖ&W"†g‚æ–B’ÓÓÒ–B¢æÖ‚†g‚’Óâ7G&–ær†g‚æf—…G—RÇÂ""’“°¢–b‡G—W2æÆVæwF‚’°¢–b‡G—W2ç6öÖR‚‡B’ÓâôäÄ”äUõ$RçFW7B‡B’’’°¢–b†÷G2æöæÆ–æTf—‚¢÷WBçW6‚‚&öæÆ–æVf—‚"“°¢Ð¢VÇ6R–b†÷G2æf—†VB’°¢÷WBçW6‚‚&f—†VB"“°¢Ð¢Ð¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ð¢–b†÷G2çFö¶VW"’°¢G'’°¢6öç7B7FGW2Òv—BFö¶VW$Æ–VE7FGW2†–B“°¢6öç7B&V6÷&BÒ7FGW2ç&V6÷&C°¢–b‡7FGW2ç7V66W72bb7FGW2æÆ–VBbb&V6÷&Còç–ææVBbb&V6÷&Bç–äÖF6†W47F—fF–öâbb&V6÷&Bæ†VÇF‚ÓÒ&6†ævVB"’°¢÷WBçW6‚‡7FGW2ç&V6÷&Còæ†VÇF‚ÓÓÒ'fÆ–B"ò'Fö¶VW""¢'Fö¶VW&6†V6²"“°¢Ð¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢Ð¢6öç7B†4f—‚Ò÷WBç6öÖR‚†²’Óâ²ÓÓÒ&öæÆ–æVf—‚"ÇÂ²ÓÓÒ&f—†VB"“°¢6öç7Bf–æÄ¶–æG2Ò†4f—‚ò÷WBæf–ÇFW"‚†²’Óâ²ÓÒ&ÆVv—B"’¢÷WC°¢–b‚6æ6VÆÆVB¢6WD¶–æG2†f–æÄ¶–æG2“°¢Ò’‚“°¢&WGW&â‚’Óâ°¢6æ6VÆÆVBÒG'VS°¢Ó°¢ÒÂ¶–BÂ&FvUfW'6–öåÒ“°¢–b†–BÓÒçVÆÂÇÂ¶–æG2æÆVæwF‚¢&WGW&âçVÆÃ°¢6öç7BVÖö¦”ÖöFRÒvWDVÖö¦”&FvW4Væ&ÆVB‚“°¢&WGW&â…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"Âv¢VÖö¦”ÖöFRò¢‚ÂÖ&v–ã¢#'‚#G‚"ÂÆ–vä—FV×3¢&6VçFW""ÒÂ6†–ÆG&Vã¢¶–æG2æÖ‚†²’Óâ…5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢VÖö¦”ÖöFRò°¢FF–æs¢À¢Ö&v–ã¢À¢&÷&FW#¢À¢&÷&FW%&F—W3¢À¢föçE6—¦S¢#‚À¢Æ–æT†V–v‡C¢#3‚"À¢föçEvV–v‡C¢CÀ¢ÆWGFW%76–æs¢À¢6öÆ÷#¢&–æ†W&—B"À¢&6¶w&÷VæC¢'G&ç7&VçB"À¢&÷…6†F÷s¢&æöæR"À¢FW‡E6†F÷s¢#‚7‚&v&ƒÃÃÃãsR’"À¢föçDfÖ–Ç“¢"tæ÷Fò6öÆ÷"VÖö¦’rÂu6VvöRT’VÖö¦’rÂtÆR6öÆ÷"VÖö¦’rÇ6ç2×6W&–b"À¢Ò¢°¢FF–æs¢#7‚‚"À¢&÷&FW%&F—W3¢BÀ¢föçE6—¦S¢"À¢föçEvV–v‡C¢sÀ¢ÆWGFW%76–æs¢ãRÀ¢6öÆ÷#¢"6ffb"À¢&6¶w&÷VæC¢5E”ÄU5¶µÒæ&6¶w&÷VæBÀ¢&÷…6†F÷s¢#‚G‚&v&ƒÃÃÃã3R’"À¢ÒÂ6†–ÆG&Vã¢&FvTF—7Æ”Æ&VÂ†²Â5E”ÄU5¶µÒæÆ&VÂ’ÒÂ²’’’Ò’“°§Ð ¢ò¢ ¢¢–æ¦V7BF†R4Å4FV6²&"–çFòF†RÆ–'&'’ÖFWF–Ç2vR'’F6†–ærF†P¢¢&÷WFRw2&VæFW"G&VR‡F†RfW'6–öâ×&ööb&ö6‚F†RV’ÖW†×ÆW2W6R(	B&VÀ¢¢&V7BVÆVÖVçB7Æ–6VB–çFòF†RvRw2÷vâG&VRÂæ÷BDôÒ×67&–ærF†R7F÷&R’à¢¢vR7Æ–6R–çFòF†RÖFWF–Ç2–ææW$6öçF–æW"6ò—B6—G2&VÆ÷rF†R†W&òð¢¢7F–öâ'WGFöç2v—F‚6öÖf÷'F&ÆR76–ærà¢¢ð¦gVæ7F–öâF6„Æ–'&'”‚’°¢&WGW&â&÷WFW$†öö²æFEF6‚‚"öÆ–'&'’öó¦–B"Â‡G&VR’Óâ°¢6öç7B&÷WFU&÷2ÒDdÂæf–æD–å&V7EG&VR‡G&VRÂ‡‚’Óâƒòç&VæFW$gVæ2“°¢–b‡&÷WFU&÷2’°¢6öç7BF6†W"ÒDdÂæ7&VFU&V7EG&VUF6†W"…°¢‡B’ÓâDdÂæf–æD–å&V7EG&VR‡BÂ‡‚’Óâƒòç&÷3òæ6†–ÆG&Vãòç&÷3òæ÷fW'f–Wr“òç&÷0¢òæ6†–ÆG&VâÀ¢ÒÂ…òÂ&WB’Óâ°¢6öç7B6öçF–æW"ÒDdÂæf–æD–å&V7EG&VR‡&WBÂ‡‚’Óâ'&’æ—4'&’‡ƒòç&÷3òæ6†–ÆG&Vâ’b`¢ƒòç&÷3òæ6Æ74æÖSòæ–æ6ÇVFW2„DdÂæFWF–Ç46Æ76W2ä–ææW$6öçF–æW"’“°¢–b‡G—Vöb6öçF–æW"ÓÓÒ&ö&¦V7B"’°¢6öçF–æW"ç&÷2æ6†–ÆG&Vâç7Æ–6RƒÂÂ5ô¥5‚æ§7‚„vÖTFWF–Ç4&FvRÂ·Ò’Â5ô¥5‚æ§7‚„vÖT7F–öä'WGFöç2Â·Ò’“°¢Ð¢&WGW&â&WC°¢Ò“°¢DdÂægFW%F6‚‡&÷WFU&÷2Â'&VæFW$gVæ2"ÂF6†W"“°¢Ð¢&WGW&âG&VS°¢Ò“°§Ð ¦6öç7B†—7F÷'”ÖöGVÆRÒDdÂæf–æDÖöGVÆTW‡÷'B‚†R’ÓâSòæÕö†—7F÷'’ÓÒVæFVf–æVB“°¦6öç7B†—7F÷'’Ò†—7F÷'”ÖöGVÆSòæÕö†—7F÷'“°¦ÆWBÖ÷VçFVBÒfÇ6S°¦ÆWBw2ÒçVÆÃ°¦ÆWB×6t–BÒ°¦ÆWB7W'&VçDÖöD–BÒ"#°¦ÆWBw5&VG’ÒfÇ6S°¦ÆWB—46öææV7F–ærÒfÇ6S°¦ÆWB&V6öææV7EF–ÖW"ÒçVÆÃ°¦ÆWB&uF–ÖW"ÒçVÆÃ°¦ÆWB†—7EVæÆ—7FVâÒçVÆÃ°¦6öç7Btõ$µ4„õõ$RÒòƒó§6†&VFf–ÆW7Çv÷&·6†÷•Âöf–ÆVFWF–Ç5Âòâ£õ³òeÖ–CÒ…ÆB²’ó°¦gVæ7F–öâ—5v÷&·6†÷W&Â‡W&Â’°¢&WGW&âW&Âbbtõ$µ4„õõ$RçFW7B‡W&Â“°§Ð¦gVæ7F–öâW‡G&7DÖöD–B‡W&Â’°¢6öç7BÒÒ‡W&ÂÇÂ""’æÖF6‚…tõ$µ4„õõ$R“°¢&WGW&âÒòÕ³Ò¢"#°§Ð¦gVæ7F–öâ6G†ÖWF†öBÂ&×2’°¢–b‚w2ÇÂw2ç&VG•7FFRÓÒvV%6ö6¶WBäõTâ¢&WGW&ã°¢G'’°¢w2ç6VæB„¥4ôâç7G&–æv–g’‡²–C¢×6t–B²²ÂÖWF†öBÂ&×3¢&×2ÇÂ·ÒÒ’“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð§Ð¦gVæ7F–öâWfÇVFR†W‡"’°¢6G‚%'VçF–ÖRæWfÇVFR"Â²W‡&W76–öã¢W‡"Ò“°§Ð¢òò7FVÒÖæF—fR7G–Æ–ærf÷"F†R–æ¦V7FVBv÷&·6†÷'WGFöâ†ÖF6†W27F÷&UF6‚’à¦6öç7B5DTÕõu5ô552Ò ¢6ÇB×w2×w&¶föçBÖfÖ–Ç“¢$Ö÷F—f6ç2"Ä&–ÂÇ6ç2×6W&–c·Ð¢6ÇB×w2Ö'Fç¶V&æ6S¦æöæS²×vV&¶—BÖV&æ6S¦æöæS¶&÷&FW#¦æöæS¶7W'6÷#§ö–çFW#¶6öÆ÷#¢6ffc¶föçBÖfÖ–Ç“¢$Ö÷F—f6ç2"Ä&–ÂÇ6ç2×6W&–c¶föçB×6—¦S£Gƒ¶föçB×vV–v‡C£c¶ÆWGFW"×76–æs¢ã7ƒ·FF–æs£‚‡ƒ¶&÷&FW"×&F—W3£'ƒ¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçB‡Fò&÷GFöÒÂ3†&3S6bÂ3V†cR“¶&÷‚×6†F÷s£'‚‡‚&v&ƒÃÃÂãB“·G&ç6—F–öã¦f–ÇFW"ã'2V6RÖ÷WBÆ&÷‚×6†F÷rã'2V6RÖ÷WBÇG&ç6f÷&Òãg2V6RÖ÷WC·Ð¢6ÇB×w2Ö'Fã¦†÷fW'¶f–ÇFW#¦'&–v‡FæW72ƒã2“·Ð¢6ÇB×w2Ö'Fã¦7F—fW¶f–ÇFW#¦'&–v‡FæW72‚ã’“·G&ç6f÷&Ó§G&ç6ÆFU’ƒ‚“·Ð¢6ÇB×w2Ö'Fã¦fö7W7¶÷WFÆ–æS¦æöæS¶&÷‚×6†F÷s£'‚&v&ƒ#SRÃ#SRÃ#SRÂã’’Ã'‚'‚&v&ƒ2Ã“2Ã#CRÂãsR“·Ð¢6ÇB×w2Ö'Fã¦F—6&ÆVG¶÷6—G“¢ãSS¶7W'6÷#¦FVfVÇC¶f–ÇFW#¦æöæS·Ð¢6ÇB×w2×7FGW7¶föçBÖfÖ–Ç“¢$Ö÷F—f6ç2"Ä&–ÂÇ6ç2×6W&–c¶&6¶w&÷VæC¦Æ–æV"Öw&F–VçB‡Fò&÷GFöÒÇ&v&ƒC"ÃsÃ“BÂã“B’Ç&v&ƒ#2Ã32ÃC2Âã“R’“¶6öÆ÷#¢63vCVS·FF–æs£g‚'ƒ¶&÷&FW"×&F—W3£'ƒ¶föçB×6—¦S£'ƒ¶Ö‚×v–GFƒ£#ƒƒ¶&÷‚×6†F÷s¦–ç6WB‚&v&ƒ2Ã“2Ã#CRÂãR“·Ð¦°¢ò¢¢fÆöF–ær'WGFöâ²7FGW2Æ–æRÂ–æ¦V7FVB–çFòF†Rv÷&·6†÷vRw2¥2v÷&ÆBâ¢ð¦gVæ7F–öâ'V–ÆD'WGFöâ†ÖöF–B’°¢&WGW&â†gVæ7F–öâ‚—°¢G'—°¢f"ôÄCÖFö7VÖVçBævWDVÆVÖVçD'”–B‚vÇB×w2×w&r“²–b„ôÄB’ôÄBç&VÖ÷fR‚“°¢–b‚Fö7VÖVçBævWDVÆVÖVçD'”–B‚vÇB×w2×7G–ÆRr’—·f"7FÃÖFö7VÖVçBæ7&VFTVÆVÖVçB‚w7G–ÆRr“·7FÂæ–CÒvÇB×w2×7G–ÆRs·7FÂçFW‡D6öçFVçCÒG´¥4ôâç7G&–æv–g’…5DTÕõu5ô552—Ó¶Fö7VÖVçBæ†VBæVæD6†–ÆB‡7FÂ“·Ð¢f"w&ÖFö7VÖVçBæ7&VFTVÆVÖVçB‚vF—br“²w&æ–CÒvÇB×w2×w&s°¢w&ç7G–ÆRæ775FW‡CÒw÷6—F–öã¦f—†VC·&–v‡C£gƒ¶&÷GFöÓ£gƒ·¢Ö–æFWƒ£#CsCƒ3cCs¶F—7Æ“¦fÆWƒ¶fÆW‚ÖF—&V7F–öã¦6öÇVÖã¶Æ–vâÖ—FV×3¦fÆW‚ÖVæC¶v£‡ƒ²s°¢f"7FGW3ÖFö7VÖVçBæ7&VFTVÆVÖVçB‚vF—br“²7FGW2æ–CÒvÇB×w2×7FGW2s°¢7FGW2ç7G–ÆRæ775FW‡CÒvF—7Æ“¦æöæS²s°¢f"'FãÖFö7VÖVçBæ7&VFTVÆVÖVçB‚v'WGFöâr“²'Fâæ–CÒvÇB×w2Ö'Fâs²'FâçFW‡D6öçFVçCÒ~*ÈrF÷væÆöBv—F‚4Å4FV6²s°¢'Fâæöæ6Æ–6³ÖgVæ7F–öâ‚—°¢G'—²'FâæF—6&ÆVC×G'VS²7FGW2ç7G–ÆRæF—7Æ“Òv&Æö6²s²7FGW2çFW‡D6öçFVçCÒu&W6öÇf–æ~(
bs°¢v–æF÷ræÇEw4–çfö¶R„¥4ôâç7G&–æv–g’‡¶7F–öã¢vF÷væÆöBrÆÖöF–C¢G´¥4ôâç7G&–æv–g’†ÖöF–B—×Ò’“°¢Ö6F6‚†R—·Ð¢Ó°¢w&æVæD6†–ÆB‡7FGW2“²w&æVæD6†–ÆB†'Fâ“²Fö7VÖVçBæ&öG’æVæD6†–ÆB‡w&“°¢Ö6F6‚†R—·Ð¢Ò’‚“¶°§Ð¦gVæ7F–öâ6WE7FGW2‡FW‡BÂFöæRÂf–ÆVB’°¢6öç7B6öÆ÷"Òf–ÆVBò"6cVc#2"¢FöæRò"3S†3Ss‚"¢"63vCVS#°¢&WGW&â†gVæ7F–öâ‚—·G'—°¢f"3ÖFö7VÖVçBævWDVÆVÖVçD'”–B‚vÇB×w2×7FGW2r“²f"#ÖFö7VÖVçBævWDVÆVÖVçD'”–B‚vÇB×w2Ö'Fâr“°¢–b‡2—·2ç7G–ÆRæF—7Æ“Òv&Æö6²s·2ç7G–ÆRæ6öÆ÷#ÒG´¥4ôâç7G&–æv–g’†6öÆ÷"—Ó·2çFW‡D6öçFVçCÒG´¥4ôâç7G&–æv–g’‡FW‡B—Ó·Ð¢–b†"bbG¶FöæRÇÂf–ÆVBò'G'VR"¢&fÇ6R'Ò—¶"æF—6&ÆVCÖfÇ6S¶"ç7G–ÆRæ÷6—G“Òss·Ð¢Ö6F6‚†R—·×Ò’‚“¶°§Ð¦gVæ7F–öâ&VÖ÷fT'WGFöâ‚’°¢WfÇVFR††gVæ7F–öâ‚—·G'—·f"sÖFö7VÖVçBævWDVÆVÖVçD'”–B‚vÇB×w2×w&r“¶–b‡r—rç&VÖ÷fR‚“·Ö6F6‚†R—·×Ò’‚“¶“°§Ð¦gVæ7F–öâ–æ¦V7Df÷"†ÖöF–B’°¢–b‚ÖöF–B’°¢&VÖ÷fT'WGFöâ‚“°¢&WGW&ã°¢Ð¢WfÇVFR†'V–ÆD'WGFöâ†ÖöF–B’“°§Ð¢ò¢¢†æFÆR'WGFöâ6Æ–6²'&–FvVB&6²g&öÒF†RvRw2¥2v÷&ÆBâ¢ð¦7–æ2gVæ7F–öâöä7F–öâ‡–ÆöE7G"’°¢ÆWB×6s°¢G'’°¢×6rÒ¥4ôâç'6R‡–ÆöE7G"“°¢Ð¢6F6‚°¢&WGW&ã°¢Ð¢–b†×6sòæ7F–öâÓÒ&F÷væÆöB"¢&WGW&ã°¢6öç7BÖöF–BÒ7G&–ær†×6sòæÖöF–BÇÂ""“°¢–b‚ÖöF–B¢&WGW&ã°¢G'’°¢6öç7B–æfòÒv—Bw5&W6öÇfR†ÖöF–B“°¢–b‚–æfòç7V66W72’°¢WfÇVFR‡6WE7FGW2†–æfòæW'&÷"ÇÂ$6÷VÆBæ÷B&W6öÇfRF†—2—FVÒ"ÂfÇ6RÂG'VR’“°¢&WGW&ã°¢Ð¢–b‚–æfòæÆÆ÷vVB’°¢WfÇVFR‡6WE7FGW2†G¶–æfòçF—FÆRÇÂ%F†—2vÖR'Ò—2vÖR–÷R÷vâ(	B4Å4FV6²öæÇ’ÖöG24Å4FV6²ÖFFVB÷"æöâÕ7FVÒvÖW2æÂfÇ6RÂG'VR’“°¢&WGW&ã°¢Ð¢–b‚–æfòæ–ç7FÆÆVB’°¢WfÇVFR‡6WE7FGW2†–ç7FÆÂG¶–æfòçF—FÆRÇÂ'F†RvÖR'Òf—'7BÂF†Vâ&WG'’æÂfÇ6RÂG'VR’“°¢&WGW&ã°¢Ð¢6öç7BÆ&VÂÒ–æfòæ—46öÆÆV7F–öâò6öÆÆV7F–öâ‚G¶–æfòæ6†–ÆG&VãòæÆVæwF‚ÇÂÒ—FV×2–¢&ÖöB#°¢WfÇVFR‡6WE7FGW2†F÷væÆöF–ærG¶Æ&VÇÞ(
f’“°¢6öç7BFÂÒv—Bw4F÷væÆöB†ÖöF–B“°¢–b‚FÂç7V66W72’°¢6öç7Bv‡’ÒFÂæW'&÷"ÓÓÒ&÷væVEövÖR ¢ò%F†BvÖR—2÷væVB(	Bæ÷BVÆ–v–&ÆRâ ¢¢FÂæW'&÷"ÓÓÒ&æ÷Eö–ç7FÆÆVB ¢ò$–ç7FÆÂF†RvÖRf—'7Bâ ¢¢FÂæW'&÷"ÇÂ$F÷væÆöBf–ÆVBâ#°¢WfÇVFR‡6WE7FGW2‡v‡’ÂfÇ6RÂG'VR’“°¢&WGW&ã°¢Ð¢6öç7B¦ö"ÒFÂæ¦ö"ÇÂÖöF–C°¢öÆÄ¦ö"†¦ö"“°¢Ð¢6F6‚†R’°¢WfÇVFR‡6WE7FGW2‚$W'&÷#¢"²7G&–ær†R’ÂfÇ6RÂG'VR’“°¢Ð§Ð¦ÆWB¦ö%F–ÖW"ÒçVÆÃ°¦gVæ7F–öâöÆÄ¦ö"†¦ö"’°¢–b†¦ö%F–ÖW"¢6ÆV$–çFW'fÂ†¦ö%F–ÖW"“°¢¦ö%F–ÖW"Ò6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—Bw4F÷væÆöE7FFR†¦ö"“°¢6öç7B2Ò"ç7FFRÇÂ·Ó°¢–b‡2ç7FGW2ÓÓÒ&FöæR"’°¢6ÆV$–çFW'fÂ†¦ö%F–ÖW"“°¢¦ö%F–ÖW"ÒçVÆÃ°¢WfÇVFR‡6WE7FGW2†–ç7FÆÆVBG·2æFöæWÒòG·2çF÷FÇÒ—FVÒ‡2’)É6ÂG'VR’“°¢Ð¢VÇ6R–b‡2ç7FGW2ÓÓÒ&f–ÆVB"’°¢6ÆV$–çFW'fÂ†¦ö%F–ÖW"“°¢¦ö%F–ÖW"ÒçVÆÃ°¢6öç7Bf–ÆVBÒ‡2æf–ÆVBÇÂµÒ’æÆVæwFƒ°¢WfÇVFR‡6WE7FGW2†FöæR(	BG·2æFöæWÒòG·2çF÷FÇÒö²ÂG¶f–ÆVGÒf–ÆVFÂfÇ6RÂG'VR’“°¢Ð¢VÇ6R°¢6öç7B7W"Ò2æ7W'&VçBò†—FVÒG·2æ7W'&VçGÒ–¢"#°¢WfÇVFR‡6WE7FGW2†G·2ç7FGW2ÇÂ'v÷&¶–ær'ÒG·2æFöæRÇÂÒòG·2çF÷FÂÇÂÒG¶7W'Ö’“°¢Ð¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢ÒÂS“°§Ð¢òò)H)H4E6öææV7F–öâFòF†Rv÷&·6†÷F")H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H)H ¦gVæ7F–öâ66†VGVÆU&V6öææV7B†×2Ò’°¢–b‚Ö÷VçFVBÇÂ&V6öææV7EF–ÖW"¢&WGW&ã°¢&V6öææV7EF–ÖW"Ò6WEF–ÖV÷WB‚‚’Óâ°¢&V6öææV7EF–ÖW"ÒçVÆÃ°¢–b†Ö÷VçFVBbb‚w2ÇÂw2ç&VG•7FFRÓÓÒvV%6ö6¶WBä4Äõ4TB’¢6öææV7B‚“°¢ÒÂ×2“°§Ð¦gVæ7F–öâWFFTg&öÕW&Â‡W&Â’°¢6öç7B–BÒW‡G&7DÖöD–B‡W&Â“°¢–b‚–B’°¢–b†7W'&VçDÖöD–B’°¢7W'&VçDÖöD–BÒ"#°¢&VÖ÷fT'WGFöâ‚“°¢Ð¢&WGW&ã°¢Ð¢7W'&VçDÖöD–BÒ–C°¢–b‡w5&VG’¢–æ¦V7Df÷"†–B“°§Ð¦7–æ2gVæ7F–öâ6öææV7B‚’°¢–b‚Ö÷VçFVBÇÂ—46öææV7F–ær¢&WGW&ã°¢—46öææV7F–ærÒG'VS°¢6WEF–ÖV÷WB‚‚’Óâ°¢—46öææV7F–ærÒfÇ6S°¢ÒÂS“°¢–b‡w2bb‡w2ç&VG•7FFRÓÓÒvV%6ö6¶WBäõTâÇÂw2ç&VG•7FFRÓÓÒvV%6ö6¶WBä4ôääT5D”är’’°¢—46öææV7F–ærÒfÇ6S°¢&WGW&ã°¢Ð¢G'’°¢6öç7B&W2Òv—BfWF6„æô6÷'2‚&‡GG¢òöÆö6Æ†÷7C£ƒƒö§6öâ"“°¢6öç7BF'2Òv—B&W2æ§6öâ‚“°¢6öç7BF"ÒF'2æf–æB‚‡B’ÓâBçW&Âbb—5v÷&·6†÷W&Â‡BçW&Â’“°¢–b‚F"ÇÂF"çvV%6ö6¶WDFV'VvvW%W&Â’°¢—46öææV7F–ærÒfÇ6S°¢66†VGVÆU&V6öææV7Bƒ“°¢&WGW&ã°¢Ð¢7W'&VçDÖöD–BÒW‡G&7DÖöD–B‡F"çW&Â“°¢6öç7B6ö6²ÒæWrvV%6ö6¶WB‡F"çvV%6ö6¶WDFV'VvvW%W&Â“°¢w2Ò6ö6³°¢ÆWBVæF–æuW&Ä–BÒçVÆÃ°¢6ö6²æöæ÷VâÒ‚’Óâ°¢—46öææV7F–ærÒfÇ6S°¢–b‡w2ÓÒ6ö6²’°¢6ö6²æ6Æ÷6R‚“°¢&WGW&ã°¢Ð¢6G‚%vRæVæ&ÆR"“°¢6G‚%'VçF–ÖRæVæ&ÆR"“°¢6G‚%'VçF–ÖRæFD&–æF–ær"Â²æÖS¢&ÇEw4–çfö¶R"Ò“°¢6öç7BV–BÒ×6t–B²³°¢VæF–æuW&Ä–BÒV–C°¢G'’°¢6ö6²ç6VæB„¥4ôâç7G&–æv–g’‡²–C¢V–BÂÖWF†öC¢%'VçF–ÖRæWfÇVFR"Â&×3¢²W‡&W76–öã¢'v–æF÷ræÆö6F–öâæ‡&Vb"ÒÒ’“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢6WEF–ÖV÷WB‚‚’Óâ°¢–b‡w2ÓÒ6ö6²¢&WGW&ã°¢w5&VG’ÒG'VS°¢–b†7W'&VçDÖöD–B¢–æ¦V7Df÷"†7W'&VçDÖöD–B“°¢ÒÂ3“°¢Ó°¢6ö6²æöæÖW76vRÒ†Wb’Óâ°¢–b‡w2ÓÒ6ö6²¢&WGW&ã°¢ÆWBC°¢G'’°¢BÒ¥4ôâç'6R†WbæFF“°¢Ð¢6F6‚°¢&WGW&ã°¢Ð¢–b‡VæF–æuW&Ä–BÓÒçVÆÂbbBæ–BÓÓÒVæF–æuW&Ä–B’°¢VæF–æuW&Ä–BÒçVÆÃ°¢6öç7BRÒBç&W7VÇCòç&W7VÇCòçfÇVS°¢–b‡G—VöbRÓÓÒ'7G&–ær"¢WFFTg&öÕW&Â‡R“°¢&WGW&ã°¢Ð¢–b†BæÖWF†öBÓÓÒ%'VçF–ÖRæ&–æF–æt6ÆÆVB"bbBç&×3òææÖRÓÓÒ&ÇEw4–çfö¶R"’°¢öä7F–öâ…7G&–ær†Bç&×2ç–ÆöBÇÂ""’“°¢Ð¢VÇ6R–b†BæÖWF†öBÓÓÒ%vRæg&ÖTæf–vFVB"bbBç&×3òæg&ÖSòçW&Â’°¢6WEF–ÖV÷WB‚‚’ÓâWFFTg&öÕW&Â†Bç&×2æg&ÖRçW&Â’ÂS“°¢Ð¢VÇ6R–b†BæÖWF†öBÓÓÒ%vRææf–vFVEv—F†–äFö7VÖVçB"bbBç&×3òæg&ÖSòçW&Â’°¢6WEF–ÖV÷WB‚‚’ÓâWFFTg&öÕW&Â†Bç&×2æg&ÖRçW&Â’ÂS“°¢Ð¢VÇ6R–b†BæÖWF†öBÓÓÒ%vRæÆöDWfVçDf—&VB"’°¢–b†7W'&VçDÖöD–Bbbw5&VG’¢6WEF–ÖV÷WB‚‚’Óâ–æ¦V7Df÷"†7W'&VçDÖöD–B’Â3“°¢Ð¢Ó°¢6ö6²æöæW'&÷"Ò‚’Óâ°¢—46öææV7F–ærÒfÇ6S°¢66†VGVÆU&V6öææV7Bƒ“°¢Ó°¢6ö6²æöæ6Æ÷6RÒ‚’Óâ°¢–b‡w2ÓÓÒ6ö6²’°¢w2ÒçVÆÃ°¢w5&VG’ÒfÇ6S°¢Ð¢66†VGVÆU&V6öææV7Bƒ“°¢Ó°¢Ð¢6F6‚°¢—46öææV7F–ærÒfÇ6S°¢66†VGVÆU&V6öææV7Bƒ“°¢Ð§Ð¦gVæ7F–öâ–æ—Ev÷&·6†÷F6‚‚’°¢Ö÷VçFVBÒG'VS°¢–b„†—7F÷'’’°¢G'’°¢†—7EVæÆ—7FVâÒ†—7F÷'’æÆ—7FVâ‚‚’Óâ6öææV7B‚’“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ð¢6öææV7B‚“°¢&uF–ÖW"Ò6WD–çFW'fÂ‚‚’Óâ°¢–b‚w2ÇÂw2ç&VG•7FFRÓÓÒvV%6ö6¶WBä4Äõ4TB¢6öææV7B‚“°¢ÒÂS“°¢&WGW&â‚’Óâ°¢Ö÷VçFVBÒfÇ6S°¢–b†&uF–ÖW"’°¢6ÆV$–çFW'fÂ†&uF–ÖW"“°¢&uF–ÖW"ÒçVÆÃ°¢Ð¢–b‡&V6öææV7EF–ÖW"’°¢6ÆV%F–ÖV÷WB‡&V6öææV7EF–ÖW"“°¢&V6öææV7EF–ÖW"ÒçVÆÃ°¢Ð¢–b†¦ö%F–ÖW"’°¢6ÆV$–çFW'fÂ†¦ö%F–ÖW"“°¢¦ö%F–ÖW"ÒçVÆÃ°¢Ð¢–b††—7EVæÆ—7FVâ’°¢†—7EVæÆ—7FVâ‚“°¢†—7EVæÆ—7FVâÒçVÆÃ°¢Ð¢–b‡w2’°¢G'’°¢w2æ6Æ÷6R‚“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢w2ÒçVÆÃ°¢w5&VG’ÒfÇ6S°¢Ð¢Ó°§Ð ¢ò¢ ¢¢WFòÖÇ’f—†W2(	B&6¶w&÷VæB7vVWÖöFVÂ†æöâÖ‡—W'f—6÷"'V–ÆB’à¢ ¢¢WFòÖf—‚ôäÅ’Æ–W2&VÂW"ÖvÖRf—†W2g&öÒæÖVB6÷W&6W2‡'—WRvVæW&–2ð¢¢7&6²ÂæBF†RW&öæFW÷Bò'—WRöæÆ–æRf—‚’âF†RVæ—fW'6Â%Vç7FVÒ"”òf—€¢¢—2äUdU"WFòÖÆ–VB(	B—Bw2÷BÖ–âg&öÒF†RT’öæÇ’â–bæòW"ÖvÖRf—€¢¢W†—7G2ÂF†R7vVWFöW2æ÷F†–æræB6†÷w2æòæ÷F–f–6F–öâà¢ ¢¢—BÇ6òv—G2f÷"F†RvÖRFòd”ä•4‚F÷væÆöF–ær‡&VÂ'—FW2öâF—6²Âæ÷B§W7@¢¢7&VFVBföÆFW"’&Vf÷&RÇ––ærÂ6òf—‚æWfW"ÆæG2öâ'F–Â–ç7FÆÂà¢ ¢¢FVçWfòvÖW2&R6¶—VBVçF—&VÇ’†æò‡—W'f—6÷"†W&R(i"æòv÷&¶–ærf—‚’à¢¢ð¦6öç7BD•DÄRÒ%4Å4FV6²#°¦6öç7B'Vææ–ærÒæWr6WB‚“°¦ÆWB7vVW–ærÒfÇ6S°¦ÆWB6VVFVDW†—7F–ærÒfÇ6S°¦7–æ2gVæ7F–öâv—Df÷$f—‚†–BÂF–ÖV÷WD×2Ò#¢c¢’°¢6öç7B7F'FVBÒFFRææ÷r‚“°¢f÷"ƒ³²’°¢v—BæWr&öÖ—6R‚‡"’Óâ6WEF–ÖV÷WB‡"ÂS’“°¢–b„FFRææ÷r‚’Ò7F'FVBâF–ÖV÷WD×2¢&WGW&âfÇ6S°¢G'’°¢6öç7B2Ò‚†v—BvWDf—…7FGW2†–B’’ç7FFRÇÂ·Ò’ç7FGW2ÇÂ"#°¢–b‡2ÓÓÒ&FöæR"¢&WGW&âG'VS°¢–b‡2ÓÓÒ&f–ÆVB"ÇÂ2ÓÓÒ&6æ6VÆÆVB"¢&WGW&âfÇ6S°¢–b‚2ÇÂ”åõ$ôu$U52æ†2‡2’¢6öçF–çVS°¢Ð¢6F6‚°¢ò¢¶VWöÆÆ–ær¢ð¢Ð¢Ð§Ð¦7–æ2gVæ7F–öâÇ&VG”f—†VB†–B’°¢G'’°¢6öç7B"Òv—BvWD–ç7FÆÆVDf—†W2‚“°¢&WGW&â‡"æf—†W2ÇÂµÒ’ç6öÖR‚†b’ÓâçVÖ&W"†bæ–B’ÓÓÒ–B“°¢Ð¢6F6‚°¢&WGW&âfÇ6S°¢Ð§Ð¦7–æ2gVæ7F–öâ—4FVçWfò†–B’°¢G'’°¢6öç7B¶æ÷vâÒv—BFVçWfô¶æ÷vâ‚“°¢–b‚†¶æ÷vâæFVçWfòÇÂµÒ’æ–æ6ÇVFW2†–B’¢&WGW&âG'VS°¢6öç7B"Òv—BFVçWfõ&W6öÇfR…¶–EÒ“°¢&WGW&â‡"æFVçWfòÇÂµÒ’æ–æ6ÇVFW2†–B“°¢Ð¢6F6‚°¢&WGW&âfÇ6S°¢Ð§Ð¦7–æ2gVæ7F–öâÇ’†–BÂW&ÂÂF‚ÂG—RÂæÖRÂÆ&VÂ’°¢Fö7FW"çFö7B‡²F—FÆS¢D•DÄRÂ&öG“¢G¶æÖWÓ¢Ç––ærG¶Æ&VÇÞ(
fÒ“°¢G'’°¢v—BÇ”f—‚†–BÂW&ÂÂF‚ÂG—RÂæÖR“°¢6öç7Bö²Òv—Bv—Df÷$f—‚†–B“°¢Fö7FW"çFö7B‡²F—FÆS¢D•DÄRÂ&öG“¢ö²òG¶æÖWÓ¢G¶Æ&VÇÒÆ–VF¢G¶æÖWÓ¢G¶Æ&VÇÒf–ÆVFÒ“°¢&WGW&âö³°¢Ð¢6F6‚†R’°¢Fö7FW"çFö7B‡²F—FÆS¢D•DÄRÂ&öG“¢G¶æÖWÓ¢G¶Æ&VÇÒW'&÷"(	BG¶WÖÒ“°¢&WGW&âfÇ6S°¢Ð§Ð¦7–æ2gVæ7F–öâ&ö6W74öæR†–B’°¢–b‡'Vææ–æræ†2†–B’¢&WGW&âfÇ6S°¢'Vææ–æræFB†–B“°¢G'’°¢–b†v—BÇ&VG”f—†VB†–B’¢&WGW&âG'VS°¢–b†v—B—4FVçWfò†–B’¢&WGW&âG'VS²òòæòv÷&¶–ærf—‚v—F†÷WB‡—W'f—6÷ ¢6öç7BF‚Òv—BvWDvÖT–ç7FÆÅF‚†–B“°¢–b‚Fƒòç7V66W72ÇÂF‚æ–ç7FÆÅF‚¢&WGW&âfÇ6S²òòæ÷B–ç7FÆÆVB–W@¢òòv—Bf÷"F†RF÷væÆöBFò7GVÆÇ’f–æ—6‚‡&VÂ'—FW2öâF—6²’(	BæWfW ¢òòÇ’f—‚Fò'F–ÂöV×G’–ç7FÆÂâ&WGW&ç2fÇ6R6òF†RvÖR7F—0¢òòVWVVBæBF†RæW‡B7vVW&WG&–W2öæ6R—Bw2FöæRà¢G'’°¢6öç7BFÂÒv—BF÷væÆöD6ö×ÆWFR†–B“°¢–b‚FÃòæ6ö×ÆWFR¢&WGW&âfÇ6S°¢Ð¢6F6‚°¢&WGW&âfÇ6S°¢Ð¢6öç7B6†V6²Òv—B6†V6´f—†W2†–BÂ""“°¢6öç7BæÖRÒ6†V6³òævÖTæÖRÇÂ”BG¶–GÖ°¢6öç7BöæÆ–æRÒ6†V6³òæöæÆ–æTf—ƒòæf–Æ&ÆRò6†V6²æöæÆ–æTf—‚¢çVÆÃ°¢6öç7BvVæW&–2Ò6†V6³òævVæW&–4f—ƒòæf–Æ&ÆRò6†V6²ævVæW&–4f—‚¢çVÆÃ°¢òòöæÇ’&VÂW"ÖvÖRf—†W2Â–â&–÷&—G’÷&FW#¢'—WRf—‚†vVæW&–2ö7&6²’(i ¢òòöæÆ–æR‡W&öæFW÷Bò'—WRöæÆ–æR’âF†RVæ—fW'6ÂVç7FVÒ”ò—2äUdU ¢òòWFòÖÆ–VBâæòf—‚f÷VæB(i"Fòæ÷F†–ærÂæòæ÷F–f–6F–öâà¢–b†vVæW&–3òçW&Â’°¢òò'—WR—2†–v†W7B&–÷&—G’â–b—BÆ–W2ÂFöæRâ–b—Bd”Å2†RærâF†P¢òò'—WR¶W’—2Ö—76–ær÷"–÷W"66÷VçBÆ6·266W72FòF†—27V6–f–2f—‚’À¢òòfÆÂ&6²FòF†RöæÆ–æRf—‚–ç7FVBöbvWGF–ær7GV6²öâ—Bà¢–b†v—BÇ’†–BÂvVæW&–2çW&ÂÂF‚æ–ç7FÆÅF‚Â&vVæW&–2"ÂæÖRÂ''—WRf—‚"’¢&WGW&âG'VS°¢Ð¢–b†öæÆ–æSòçW&Â¢&WGW&âÇ’†–BÂöæÆ–æRçW&ÂÂF‚æ–ç7FÆÅF‚Â&öæÆ–æR"ÂæÖRÂ&öæÆ–æRf—‚"“°¢òòF÷væÆöB—26ö×ÆWFRæBæòW"ÖvÖRf—‚Æ–VB(	Bæ÷F†–ærÖ÷&RFòFòÂ6ð¢òò&WGW&âG'VRFò6ÆV"—Bg&öÒF†RVæF–ærVWVR†FöâwB&RÖ6†V6²f÷&WfW"’à¢&WGW&âG'VS°¢Ð¢f–æÆÇ’°¢'Vææ–æræFVÆWFR†–B“°¢Ð§Ð¦7–æ2gVæ7F–öâ'VäWFôf—…7vVW‚’°¢–b‡7vVW–ær¢&WGW&ã°¢7vVW–ærÒG'VS°¢G'’°¢–b‚†v—BvWDWFôf—‚‚’’æVæ&ÆVB¢&WGW&ã°¢6öç7BVæF–ærÒ†v—BvWDWFôf—…VæF–ær‚’’æ–G2ÇÂµÓ°¢f÷"†6öç7B–BöbVæF–ær’°¢G'’°¢òòöæÇ’6ÆV"g&öÒF†RVWVRöæ6Rf—‚7GVÆÇ’Æ–VBâ–bF†RvÖR—0¢òò7F–ÆÂF÷væÆöF–ær÷"†2æòW"ÖvÖRf—‚Â—B7F—2VWVVBf÷"&WG'’à¢–b†v—B&ö6W74öæR†–B’¢v—B&VÖ÷fTWFôf—…VæF–ær†–B“°¢Ð¢6F6‚°¢ò¢¶VWvö–ær¢ð¢Ð¢Ð¢–b‚6VVFVDW†—7F–ær’°¢6VVFVDW†—7F–ærÒG'VS°¢G'’°¢6öç7B2Ò†v—BvWD–ç7FÆÆVD2‚’’æ2ÇÂµÓ°¢6öç7B6WBÒæWr6WB‡VæF–ær“°¢f÷"†6öç7Böb2’°¢6öç7B–BÒçVÖ&W"†æ–B“°¢–b‡6WBæ†2†–B’¢6öçF–çVS°¢G'’°¢v—B&ö6W74öæR†–B“°¢Ð¢6F6‚²ò¢¶VWvö–ær¢òÐ¢Ð¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢Ð¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢f–æÆÇ’°¢7vVW–ærÒfÇ6S°¢Ð§Ð ¢ò¢¢&VÖ÷fRöæÇ’F†RÆVv7’6†÷'F7WBv†÷6R”Bv2&V6÷&FVBv†Vâ4Å4FV6°¢¢7&VFVB—BâF†R&6¶VæB&VÖ÷fW2F†RfÆG²öæÇ’gFW"Ö–w&F–ær—G2FF°¢¢–ç7FÆÆVCÖfÇ6R—2F†W&Vf÷&RF†R†æBÖöfb6–væÂf÷"4Tb6ÆVçWâ¢ð¦7–æ2gVæ7F–öâ6ÆVçWÆVv7”6Æ÷VE&VF—&V7E6†÷'F7WB‚’°¢G'’°¢6öç7B·²–BÒÂ7FGW5ÒÒv—B&öÖ—6RæÆÂ…¶7$vWE6†÷'F7WB‚’Â7$–ç7FÆÅ7FGW2‚•Ò“°¢6öç7B–BÒçVÖ&W"†–BÇÂ“°¢–b‚–BÇÂ7FGW3òæÆVv7”fÆG´–ç7FÆÆVBÇÂ7FGW3òæ–ç7FÆÆVB¢&WGW&ã°¢6öç7B42Òv–æF÷rå7FVÔ6Æ–VçC°¢–b‚43òä3òå&VÖ÷fU6†÷'F7WB¢&WGW&ã°¢òòF†R7F÷&VB”B—2WF†÷&—FF—fS¢4Å4FV6²&V6÷&G2—B–ÖÖVF–FVÇ’gFW"—G0¢òò÷vâFE6†÷'F7WB6ÆÂæBæWfW"&V6÷&G2&&—G&'’Æ–'&'’Æ–6F–öç2à¢v—B42ä2å&VÖ÷fU6†÷'F7WB†–B“°¢v—B7%6WE6†÷'F7WBƒ“°¢6öç6öÆRæ–æfò‚%4Å4FV6³¢&VÖ÷fVBÆVv7’6Æ÷VE&VF—&V7B7FVÒ6†÷'F7WB"“°¢Ð¢6F6‚†R’°¢6öç6öÆRçv&â‚%4Å4FV6³¢ÆVv7’6Æ÷VE&VF—&V7B6†÷'F7WB6ÆVçWFVfW'&VB"ÂR“°¢Ð§Ð ¦6öç7BÄ”%$%•õ$õUDRÒ"öÆ–'&'’öó¦–B#°¦6öç7BEdä4TEõ$õUDRÒ"÷6Ç6FV6²#°¦6öç7B5D”ôå5ôd•„U5õÕô´U’Ò'6Ç6FV6²æ7F–öç4f—†W5Ò#°¦6öç7B5D”ôå5ôd•„U5õÕôUdTåBÒ'6Ç6FV6²Ö7F–öç2Öf—†W2×Ò#°¦6öç7B4Å5õ5DEU5ô44„Uô´U’Ò'6Ç6FV6²ç6Ç57FGW466†R#°¦gVæ7F–öâ&VD66†VE6Ç57FGW2‚’°¢G'’°¢6öç7BfÇVRÒ¥4ôâç'6R‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ…4Å5õ5DEU5ô44„Uô´U’’ÇÂ&çVÆÂ"“°¢&WGW&âfÇVRbbG—VöbfÇVRæ–ç7FÆÆVBÓÓÒ&&ööÆVâ"òfÇVR¢çVÆÃ°¢Ð¢6F6‚°¢&WGW&âçVÆÃ°¢Ð§Ð¦gVæ7F–öâw&—FT66†VE6Ç57FGW2‡7FGW2’°¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ…4Å5õ5DEU5ô44„Uô´U’Â¥4ôâç7G&–æv–g’‡7FGW2’“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ§Ð¢òò&VÖVÖ&W'2v†W&RF†RæVÂv267&öÆÆVB6ò&V÷Væ–ærF†RÒ&WGW&ç2F†W&Rà¦ÆWB6fVE67&öÆÂÒ°¦6öç7BÅTt”åõ4U54”ôåõ5D%DTBÒFFRææ÷r‚“°¢òòFV6·’6÷VçG2F‡&VR&–B7FVÒvV&†VÇW"F—66öææV7G227&6‚Æö÷à¦6öç7BDUTäDTä5•ô”ä•D”ÅôDTÄ•ôÕ2Ò"¢c¢°¦6öç7BDUTäDTä5•õ5D$ÄUõt”äDõuôÕ2ÒCR¢°¦6öç7BDUTäDTä5•õ5DUôtôÕ2Ò#¢°¦6öç7BDUTäDTä5•õ$UE%•ôÕ2Ò3¢c¢°¦6öç7BDUTäDTä5•ôÄô4µô´U’Ò%õ÷6Ç6FV6´FWVæFVæ7•&W—%&öÖ—6R#°¦6öç7BTäD”äuôDEõdU$”e•ô´U’Ò'6Ç6FV6²çVæF–ætFEfW&–f–6F–öâçc#°¦gVæ7F–öâÕF—FÆR‚’°¢6öç7B·&÷VÆWGFTVæ&ÆVBÂ6WE&÷VÆWGFTVæ&ÆVEÒÒ5õ$T5BçW6U7FFR‚‚’Óâ&VE&÷VÆWGFT&ööÂ…$õTÄUEDUõÕô´U’’“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢6öç7B&Vg&W6‚Ò‚’Óâ6WE&÷VÆWGFTVæ&ÆVB‡&VE&÷VÆWGFT&ööÂ…$õTÄUEDUõÕô´U’’“°¢v–æF÷ræFDWfVçDÆ—7FVæW"…$õTÄUEDUõ$Te5ôUdTåBÂ&Vg&W6‚“°¢&WGW&â‚’Óâv–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"…$õTÄUEDUõ$Te5ôUdTåBÂ&Vg&W6‚“°¢ÒÂµÒ“°¢6öç7B'WGFöå7G–ÆRÒ°¢†V–v‡C¢##‡‚"Âv–GFƒ¢##‡‚"ÂÖ–åv–GFƒ¢##‡‚"ÂFF–æs¢#"À¢F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Â§W7F–g”6öçFVçC¢&6VçFW""Â&÷&FW%&F—W3¢#G‚"À¢Ó°¢&WGW&â…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"ÂÆ–vä—FV×3¢&6VçFW""Â§W7F–g”6öçFVçC¢'76RÖ&WGvVVâ"Âv–GFƒ¢#R"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²6Æ74æÖS¢DdÂç7FF–46Æ76W2åF—FÆRÂ6†–ÆG&Vã¢%4Å4FV6²"Ò’Â5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²F—7Æ“¢&fÆW‚"Âv¢RÒÂ6†–ÆG&Vã¢·&÷VÆWGFTVæ&ÆVBbb5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²öä6Æ–6³¢‚’ÓâDdÂç6†÷tÖöFÂ…5ô¥5‚æ§7‚…7F÷&U&÷VÆWGFTÖöFÂÂ·Ò’’Â7G–ÆS¢'WGFöå7G–ÆRÂ&&–ÖÆ&VÂ#¢$÷Vâ7F÷&R&÷VÆWGFR"Â6†–ÆG&Vã¢5ô¥5‚æ§7‚„fF–6RÂ·Ò’Ò’Â5ô¥5‚æ§7‚„DdÂäF–Æöt'WGFöâÂ²öä6Æ–6³¢‚’Óâ°¢G'’°¢DdÂäæf–vF–öâä6Æ÷6U6–FTÖVçW2‚“°¢DdÂäæf–vF–öâäæf–vFR„Edä4TEõ$õUDR“°¢Ð¢6F6‚†R’°¢6öç6öÆRæW'&÷"‚%4Å4FV6³¢6÷VÆBæ÷B÷VâGfæ6VBvR"ÂR“°¢Ð¢ÒÂ7G–ÆS¢'WGFöå7G–ÆRÂ&&–ÖÆ&VÂ#¢$Gfæ6VB6WGF–æw2"Â6†–ÆG&Vã¢5ô¥5‚æ§7‚„f6örÂ·Ò’Ò•ÒÒ•ÒÒ’“°§Ð¦6öç7BU$tUôDDTEôtÔU5ôUdTåBÒ'6Ç6FV6²×W&vRÖFFVBÖvÖW2#°¦6öç7BW&vVDD'”–BÒæWrÖ‚“°¦gVæ7F–öâ&VEVæF–ætFEfW&–f–6F–öç2‚’°¢G'’°¢6öç7BfÇVRÒ¥4ôâç'6R‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ…TäD”äuôDEõdU$”e•ô´U’’ÇÂ%µÒ"“°¢&WGW&â'&’æ—4'&’‡fÇVR’òfÇVRæf–ÇFW"‚†—FVÒ’ÓâçVÖ&W"†—FVÓòæ–B’â’¢µÓ°¢Ð¢6F6‚°¢&WGW&âµÓ°¢Ð§Ð¦gVæ7F–öâw&—FUVæF–ætFEfW&–f–6F–öç2†—FV×2’°¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç6WD—FVÒ…TäD”äuôDEõdU$”e•ô´U’Â¥4ôâç7G&–æv–g’†—FV×2ç6Æ–6R‚ÓS’’“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ§Ð¦gVæ7F–öâVWVTFEfW&–f–6F–öâ†–BÂæÖRÂÆ—fU&VG’’°¢6öç7B—FV×2Ò&VEVæF–ætFEfW&–f–6F–öç2‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒçVÖ&W"†–B’“°¢6öç7B—FVÒÒ²–C¢çVÖ&W"†–B’ÂæÖS¢æÖRÇÂ”BG¶–GÖÂ6W76–öä÷&–v–ã¢W&f÷&Öæ6RçF–ÖT÷&–v–âÂ7&VFVDC¢FFRææ÷r‚’ÂÆ—fU&VG’Ó°¢—FV×2çW6‚†—FVÒ“°¢w&—FUVæF–ætFEfW&–f–6F–öç2†—FV×2“°¢&WGW&â—FVÓ°§Ð¢ò¢¢7FVÒw2Æ–'&'’7F÷&W2&Ræ÷BÇv—2W‡÷6VBFòFV6·’–âFW6·F÷ô&–p¢¢–7GW&R6öçFW‡G2âçVÆÆÖVç2F†Rg&öçFVæB6ææ÷Bç7vW"WF†÷&—FF—fVÇ“°¢¢—B×W7Bæ÷B&RG&VFVB2&ööbF†Bâ÷F†W'v—6R7V66W76gVÂFBf–ÆVBâ¢ð¦gVæ7F–öâ7FVÔÆ–'&'”†4†–B’°¢ÆWBÆ–'&'”6öÆÆV7F–öäf–Æ&ÆRÒfÇ6S°¢G'’°¢6öç7B2Òv–æF÷ræ6öÆÆV7F–öå7F÷&SòæÆÄ46öÆÆV7F–öãòæ3°¢–b†2’°¢Æ–'&'”6öÆÆV7F–öäf–Æ&ÆRÒG'VS°¢–b†3òæ†3òâ†–B’ÇÂ3òæ†3òâ…7G&–ær†–B’’ÇÂ3òævWCòâ†–B’ÇÂ3òævWCòâ…7G&–ær†–B’’¢&WGW&âG'VS°¢Ð¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢–b‡v–æF÷ræ7F÷&SòävWD÷fW'f–Wt'””Còâ†–B’ÇÀ¢v–æF÷ræ7F÷&SòävWD÷fW'f–Wt'”vÖT”Còâ†–B’¢&WGW&âG'VS°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢&WGW&âÆ–'&'”6öÆÆV7F–öäf–Æ&ÆRòfÇ6R¢çVÆÃ°§Ð¦7–æ2gVæ7F–öâfW&–g”FFVDvÖU&V6†VE7FVÒ†–BÂæÖRÂ7&VFVDBÒFFRææ÷r‚’’°¢6öç7Bv5W&vVBÒ‚’Óâ‡W&vVDD'”–BævWB„çVÖ&W"†–B’’ÇÂ’ãÒ7&VFVDC°¢–b‡v5W&vVB‚’¢&WGW&ã°¢ÆWBWF†÷&—FF—fRÒfÇ6S°¢f÷"†ÆWBGFV×BÒ²GFV×BÂS²GFV×B²²’°¢–b‡v5W&vVB‚’¢&WGW&ã°¢6öç7B&W6VçBÒ7FVÔÆ–'&'”†4†–B“°¢–b‡&W6VçBÓÓÒG'VR’°¢w&—FUVæF–ætFEfW&–f–6F–öç2‡&VEVæF–ætFEfW&–f–6F–öç2‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒ–B’“°¢&WGW&ã°¢Ð¢–b‡&W6VçBÓÓÒfÇ6R¢WF†÷&—FF—fRÒG'VS°¢v—BæWr&öÖ—6R‚‡&W6öÇfR’Óâv–æF÷rç6WEF–ÖV÷WB‡&W6öÇfRÂ#’“°¢Ð¢òòFW6·F÷ÖöFR6â'VâF†RÇVv–âv—F†÷WB6öÆÆV7F–öå7F÷&Rö7F÷&Râ¶VWF†P¢òòVæF–ær&V6÷&B6òÆFW"vÖ–ærÖöFR6W76–öâ6âfW&–g’—BÂ'WBæWfW"VÖ—@¢òòfÇ6Rf–ÇW&Ræ÷F–f–6F–öâg&öÒâVæf–Æ&ÆRg&öçFVæBFF6÷W&6Rà¢–b‚WF†÷&—FF—fR¢&WGW&ã°¢–b‡v5W&vVB‚’¢&WGW&ã°¢òò&Vv—7G&F–öâ–â6öæf–rç–ÖÂ—2æ÷BVæ÷Vvƒ¢F†—2—2F†Rf–æÂg&öçFVæ@¢òò&ööbF†B7FVÒ7GVÆÇ’66WFVBF†R–æ¦V7FVB6¶vRö–æfòVçG'’à¢Fö7FW"çFö7B‡°¢F—FÆS¢%4Å4FV6²+rvÖRv2æ÷BFFVB"À¢&öG“¢G¶æÖWÒæWfW"V&VB–â7FVÒgFW"F†RFB6ö×ÆWFVBâ&Vg&W6‚F†RÖæ–fW7B÷6÷W&6R7&VFVçF–Ç2†f÷"W†×ÆRâW‡—&VB‡V&6¶W’’æB&WG'’âFW÷B¶W—2ffV7BF÷væÆöF–ærÂ'WBæ÷&ÖÆÇ’Fòæ÷B6öçG&öÂv†WF†W"F†RÆ–'&'’VçG'’V'2æÀ¢GW&F–öã¢SÀ¢Ò“°¢w&—FUVæF–ætFEfW&–f–6F–öç2‡&VEVæF–ætFEfW&–f–6F–öç2‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒ–B’“°§Ð¦7–æ2gVæ7F–öâfW&–g”FG5VæF–ætg&öÕ&Wf–÷W57FVÕ6W76–öâ‚’°¢ÆWB&Wf–÷W2Ò&VEVæF–ætFEfW&–f–6F–öç2‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒç6W76–öä÷&–v–âÓÒW&f÷&Öæ6RçF–ÖT÷&–v–â“°¢G'’°¢òòW&vR–çFVçF–öæÆÇ’FW&Vv—7FW'2vÖW2âöÆBfW&–f–6F–öâ&V6÷&G27W'f—fP¢òò7FVÒôFW6·F÷&W7F'B–âÆö6Å7F÷&vRÂ6òöæÇ’fW&–g’2F†R&6¶Væ@¢òò7F–ÆÂ6öç6–FW'2&Vv—7FW&VBà¢6öç7B–ç7FÆÆVBÒv—BvWD–ç7FÆÆVD2‚“°¢–b†–ç7FÆÆVBç7V66W72’°¢6öç7B&Vv—7FW&VBÒæWr6WB‚†–ç7FÆÆVBæ2ÇÂµÒ’æÖ‚†’ÓâçVÖ&W"†æ–B’’“°¢&Wf–÷W2Ò&Wf–÷W2æf–ÇFW"‚†—FVÒ’Óâ&Vv—7FW&VBæ†2„çVÖ&W"†—FVÒæ–B’’“°¢6öç7B7W'&VçE6W76–öâÒ&VEVæF–ætFEfW&–f–6F–öç2‚’æf–ÇFW"‚†—FVÒ’Óâ—FVÒç6W76–öä÷&–v–âÓÓÒW&f÷&Öæ6RçF–ÖT÷&–v–â“°¢w&—FUVæF–ætFEfW&–f–6F–öç2…²ââç&Wf–÷W2Âââæ7W'&VçE6W76–öåÒ“°¢Ð¢Ð¢6F6‚²ò¢&WF–â&V6÷&G2–b&6¶VæB7FGW2—2FV×÷&&–Ç’Væf–Æ&ÆR¢òÐ¢&Wf–÷W2æf÷$V6‚‚†—FVÒ’Óâ²fö–BfW&–g”FFVDvÖU&V6†VE7FVÒ†—FVÒæ–BÂ—FVÒææÖRÂ—FVÒæ7&VFVDB“²Ò“°§Ð¦gVæ7F–öâÆ–fV7–6ÆUW6R†×2ÂFö¶Vâ’°¢&WGW&âæWr&öÖ—6R‚‡&W6öÇfR’Óâ°¢–b‚Fö¶Vâæ7F—fR¢&WGW&â&W6öÇfR‚“°¢v–æF÷rç6WEF–ÖV÷WB‡&W6öÇfRÂ×2“°¢Ò“°§Ð¦gVæ7F–öâ6VdÆöö·57F&ÆR‡Fö¶Vâ’°¢–b‚Fö¶Vâæ7F—fR¢&WGW&âfÇ6S°¢–b†Fö7VÖVçBçf—6–&–Æ—G•7FFRÓÒ'f—6–&ÆR"¢&WGW&âfÇ6S°¢–b‚v–æF÷rå7FVÔ6Æ–VçB¢&WGW&âfÇ6S°¢&WGW&âFFRææ÷r‚’ÒFö¶Vâç7F&ÆU6–æ6RãÒDUTäDTä5•õ5D$ÄUõt”äDõuôÕ3°§Ð¢ò¢ ¢¢&RÖ76W'B7F—fFVB'V–ÆBFV×ÆFW2öâ&ö÷Bà¢ ¢¢F†R&6¶VæBÇ&VG’&V6öæ6–ÆW2F†R'G2—B÷vç2‡–âÂf—†W2ÂDÄ2’GW&–ær—G0¢¢÷vâv&×WâF†—272W†—7G2f÷"F†RöæR–V6R—B4ääõBF÷V6ƒ¢ÆVæ6€¢¢&wVÖVçG2Æ—fR–â7FVÒ…6WDÆVæ6„÷F–öç2’æB&RöæÇ’&V6†&ÆRg&öÐ¢¢†W&Râ&W÷'F–ærÖöæÇ’öâF†R&6¶VæB6–FRÂ6ò—BFöW2æòv÷&²Gv–6Rà¢¢ð¦7–æ2gVæ7F–öâÇ”&6†—fUFV×ÆFW4öä&ö÷B‚’°¢G'’°¢6öç7B"Òv—B&6†—fU&V6öæ6–ÆTÆÂ†fÇ6R“°¢f÷"†6öç7BBöb"ç&W7VÇG2ÇÂµÒ’°¢–b‚Bç7V66W72ÇÂBæ–ç7FÆÆVBÇÂBæ†4ÆVæ6„÷F–öç2¢6öçF–çVS°¢G'’°¢6öç7B42Òv–æF÷rå7FVÔ6Æ–VçC°¢6öç7B7W'&VçBÒ43òä3òävWDÆVæ6„÷F–öç4f÷$òâ‡Bæ–B“°¢6öç7BvçFVBÒBçvçDÆVæ6„÷F–öç2óò"#°¢–b‡G—Vöb7W'&VçBÓÓÒ'7G&–ær"bb7W'&VçBÓÓÒvçFVB¢6öçF–çVS°¢43òä3òå6WDÆVæ6„÷F–öç3òâ‡Bæ–BÂvçFVB“°¢6öç6öÆRæ–æfò†4Å4FV6³¢&W7F÷&VBÆVæ6‚&w2f÷"G·Bæ–GÒg&öÒ—G27F—fR'V–ÆBFV×ÆFV“°¢Ð¢6F6‚²ò¢7FVÒÖ’æ÷BW‡÷6R—BöâF†—2'V–ÆB¢òÐ¢Ð¢Ð¢6F6‚†R’°¢6öç6öÆRçv&â‚%4Å4FV6³¢&6†—fRFV×ÆFR&ö÷B72f–ÆVB"ÂR“°¢Ð§Ð¦7–æ2gVæ7F–öâ&W—$Ö—76–ætFWVæFVæ6–W4g&öÕÇVv–äÆ–fV7–6ÆR‡Fö¶Vâ’°¢–b‚6VdÆöö·57F&ÆR‡Fö¶Vâ’’°¢6öç6öÆRæ–æfò‚%4Å4FV6³¢FWVæFVæ7’&W—"FVfW'&VBVçF–Â7FVÒ4Tb—27F&ÆR"“°¢&WGW&ã°¢Ð¢6öç7B6†&VBÒv–æF÷s°¢–b‡6†&VE´DUTäDTä5•ôÄô4µô´U•Ò’°¢6öç6öÆRæ–æfò‚%4Å4FV6³¢FWVæFVæ7’&W—"Ç&VG’'Vææ–æs²6öÆW66–ær&WVW7B"“°¢v—B6†&VE´DUTäDTä5•ôÄô4µô´U•Òæ6F6‚‚‚’Óâ²Ò“°¢&WGW&ã°¢Ð¢6öç7B'VâÒ†7–æ2‚’Óâ°¢6öç7BVæ&ÆVBÒv—BvWD6†V6´FWVæFVæ6–W4öä&ö÷B‚’æ6F6‚‚‚’Óâ‡²Væ&ÆVC¢G'VRÒ’“°¢–b‚Væ&ÆVBæVæ&ÆVBÇÂFö¶Vâæ7F—fRÇÂ6VdÆöö·57F&ÆR‡Fö¶Vâ’¢&WGW&ã°¢6öç7B6Ç2Òv—BvWE6Ç77FVÕ7FGW2‚’æ6F6‚‚‚’ÓâçVÆÂ“°¢–b‚Fö¶Vâæ7F—fRÇÂ6VdÆöö·57F&ÆR‡Fö¶Vâ’¢&WGW&ã°¢–b‚6Ç3òæ–ç7FÆÆVB’°¢v—B–ç7FÆÅ6Ç77FVÒ‚’æ6F6‚‚†R’Óâ°¢6öç6öÆRçv&â‚%4Å4FV6³¢Æ–fV7–6ÆR4Å77FVÒ–ç7FÆÂf–ÆVB"ÂR“°¢Ò“°¢òò–ç7FÆÆF–öâ—27–æ6‡&öæ÷W2æBÖ’ÆVB–çFòF†Ræ÷&ÖÂ7FVÒö6Æ–Vç@¢òò&V6÷fW'’fÆ÷râ&RÖ6†V6²F†R&VÖ–æ–ær6†–âöâF†RæW‡BÆ–fV7–6ÆR72à¢&WGW&ã°¢Ð¢G'’°¢6öç7Bf—‚Òv—B6Æ–VçDf—„æVVFVB‚“°¢–b‡Fö¶Vâæ7F—fRbbf—‚ç7V66W72bbf—‚ææVVFVB’°¢v—B'Vä6Æ–VçDf—‚†fÇ6R“°¢òòF†R6Æ–VçBf—‚6â&W7F'B7FVÒâFòæ÷B&Vv–âæ÷F†W"†Vg’–ç7FÆÀ¢òò–âF†R6ÖR4Tb6W76–öã²F†RæW‡B&ö÷B&W7VÖW2F†R6†–âà¢&WGW&ã°¢Ð¢Ð¢6F6‚†R’°¢6öç6öÆRçv&â‚%4Å4FV6³¢Æ–fV7–6ÆR6Æ–VçBÖf—‚6†V6²f–ÆVB"ÂR“°¢Ð¢G'’°¢òòÇv—26²F†RfW'6–öâÖv&R–ç7FÆÆW"Fò&V6öæ6–ÆRF†R'VçF–ÖRâ—@¢òò6¶—2âÇ&VG’Ö7W'&VçB'VæFÆRÂWFFW2âöÆFW"öæRæB&W—'2à¢òò–æ6ö×ÆWFRöæRÂ6òâW†—7F–ærFWVæFVæ7’—2æ÷BÖ—7F¶Vâf÷"7W'&VçBà¢–b‡Fö¶Vâæ7F—fR’°¢v—BFö¶VW$Vç7W&U'VçF–ÖR‚“°¢v—BÆ–fV7–6ÆUW6R„DUTäDTä5•õ5DUôtôÕ2ÂFö¶Vâ“°¢Ð¢Ð¢6F6‚†R’°¢6öç6öÆRçv&â‚%4Å4FV6³¢Æ–fV7–6ÆRFö¶VW"'VçF–ÖR&W—"f–ÆVB"ÂR“°¢Ð¢–b‚Fö¶Vâæ7F—fRÇÂ6VdÆöö·57F&ÆR‡Fö¶Vâ’¢&WGW&ã°¢G'’°¢–b‡Fö¶Vâæ7F—fR’°¢v—BFö¶VW$Vç7W&UV&—6ögE6¶vW2‚“°¢v—BÆ–fV7–6ÆUW6R„DUTäDTä5•õ5DUôtôÕ2ÂFö¶Vâ“°¢Ð¢Ð¢6F6‚†R’°¢6öç6öÆRçv&â‚%4Å4FV6³¢Æ–fV7–6ÆRV&—6ögB6¶vRFWVæFVæ7’&W—"f–ÆVB"ÂR“°¢Ð¢–b‚Fö¶Vâæ7F—fRÇÂ6VdÆöö·57F&ÆR‡Fö¶Vâ’¢&WGW&ã°¢ÆWBFVfW'&VDBÒ°¢G'’°¢FVfW'&VDBÒçVÖ&W"‡v–æF÷ræÆö6Å7F÷&vRævWD—FVÒ‚'6Ç6FV6²æ†Vg”FW4gFW%&W7F'B"’ÇÂ#"“°¢Ð¢6F6‚²ò¢¢òÐ¢–b†FVfW'&VDBãÒÅTt”åõ4U54”ôåõ5D%DTB’°¢v–æF÷ræF—7F6„WfVçB†æWrWfVçB‚'6Ç6FV6²ÖFWVæFVæ6–W2Ö6†ævVB"’“°¢&WGW&ã°¢Ð¢G'’°¢v–æF÷ræÆö6Å7F÷&vRç&VÖ÷fT—FVÒ‚'6Ç6FV6²æ†Vg”FW4gFW%&W7F'B"“°¢Ð¢6F6‚²ò¢¢òÐ¢G'’°¢6öç7B7FGW2Òv—BFö¶VW%&÷Föå7FGW2‚“°¢6öç7B†VÇF‡’Ò7FGW2æ–ç7FÆÆVBbb7FGW2æ†VÇF‡’ÓÒfÇ6Rbb7FGW2ç'F–Ã°¢–b‡Fö¶Vâæ7F—fRbb†VÇF‡’’°¢v—BFö¶VW$Vç7W&U&÷Föâ‚“°¢v—BÆ–fV7–6ÆUW6R„DUTäDTä5•õ5DUôtôÕ2ÂFö¶Vâ“°¢Ð¢Ð¢6F6‚†R’°¢6öç6öÆRçv&â‚%4Å4FV6³¢Æ–fV7–6ÆRtRÕ&÷Föâ&W—"f–ÆVB"ÂR“°¢Ð¢–b‚Fö¶Vâæ7F—fRÇÂ6VdÆöö·57F&ÆR‡Fö¶Vâ’¢&WGW&ã°¢G'’°¢6öç7B7FGW2Òv—B7$–ç7FÆÅ7FGW2‚“°¢òòæWfW"&V–ç7FÆÂ†VÇF‡’6Æ÷VE&VF—&V7Bâ66WB&÷F‚F†Rvw&VvFRfÆp¢òòæBF†RFWF–ÆVBÖööâõT’fÆw2&WGW&æVB'’æWvW"&6¶VæG2à¢6öç7B†VÇF‡’Ò7FGW2æ–ç7FÆÆVBÇÀ¢‚7FGW2çV”–ç7FÆÆVBbb‡7FGW2ææF—fTÖööâÇÂ7FGW2æ†4Æ–"’“°¢–b‡Fö¶Vâæ7F—fRbb†VÇF‡’¢v—B7$Vç7W&T–ç7FÆÆVB‚“°¢Ð¢6F6‚†R’°¢6öç6öÆRçv&â‚%4Å4FV6³¢Æ–fV7–6ÆR6Æ÷VE&VF—&V7B&W—"f–ÆVB"ÂR“°¢Ð¢–b‡Fö¶Vâæ7F—fR¢v–æF÷ræF—7F6„WfVçB†æWrWfVçB‚'6Ç6FV6²ÖFWVæFVæ6–W2Ö6†ævVB"’“°¢Ò’‚“°¢6†&VE´DUTäDTä5•ôÄô4µô´U•ÒÒ'Vã°¢G'’°¢v—B'Vã°¢Ð¢f–æÆÇ’°¢–b‡6†&VE´DUTäDTä5•ôÄô4µô´U•ÒÓÓÒ'Vâ¢FVÆWFR6†&VE´DUTäDTä5•ôÄô4µô´U•Ó°¢Ð§Ð¢òò4Å77FVÒvöW2–æ7F—fRgFW"7FVÒ6Æ–VçBWFFRv†÷6R7FVÖ6Æ–VçBç6ò†6€¢òò—6âwB–â4Å77FVÒw2Æ—7B…6fTÖöFR&÷'G2F†RÆöB’âvRFWFV7BF†BæBöffW"¢òòöæR×F6Æ–VçBÖf—‚„†VF7&"&R×–â’Â–ç7FVBöbÆVf–ærF†RW6W"v—F‚¢òò6–ÆVçFÇ’ÖFVB–æ¦V7F–öâà¦gVæ7F–öâ&W—$&ææW"‚’°¢6öç7B¶æVVFVBÂ6WDæVVFVEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B·&V6öâÂ6WE&V6öåÒÒ5õ$T5BçW6U7FFR‚""“°¢òò'&ö¶Vâ6öæf–rç–ÖÂ—2F†RõD„U"v’F†RVæv–æRvöW26–ÆVçFÇ’FVC ¢òò–æ¦V7F–öâ6â&RW&fV7FÇ’†VÇF‡’v†–ÆRÖÆf÷&ÖVBöÖ—76–ær¶W’Ö¶W0¢òò4Å77FVÒfÆÂ&6²FòFVfVÇG2F†BFòæ÷BÖF6‚F†RÖævVB6WGWâ&÷F€¢òòfVÇG27W&f6RF‡&÷Vv‚F†—2öæR&ææW"à¢6öç7B¶6ft—77VW2Â6WD6ft—77VW5ÒÒ5õ$T5BçW6U7FFR…µÒ“°¢6öç7B¶'W7’Â6WD'W7•ÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B¶FöæRÂ6WDFöæUÒÒ5õ$T5BçW6U7FFR‚""“°¢6öç7BVF—D†VÇF‚Ò5õ$T5BçW6T6ÆÆ&6²†7–æ2‚’Óâ°¢G'’°¢òòöæÇ’&VÆWfçBöæ6R4Å77FVÒ—27GVÆÇ’–ç7FÆÆVB(	Bg&W6‚6WGW—6âw@¢òò&–æ7F—fR"Â—Bw2§W7Bæ÷B6WBW–WB‡F†Röæ&ö&F–ær'WGFöâ†æFÆW2F†B’à¢6öç7B7BÒv—BvWE6Ç77FVÕ7FGW2‚“°¢–b‚7Còæ–ç7FÆÆVB’°¢6WDæVVFVB†fÇ6R“°¢6WE&V6öâ‚""“°¢6WD6ft—77VW2…µÒ“°¢&WGW&âG'VS°¢Ð¢6öç7B¶f—‚Â6fuÒÒv—B&öÖ—6RæÆÂ…°¢6Æ–VçDf—„æVVFVB‚’æ6F6‚‚‚’Óâ‡²7V66W73¢fÇ6RÒ’’À¢6Ç46öæf–t†VÇF‚‚’æ6F6‚‚‚’Óâ‡²7V66W73¢fÇ6RÒ’’À¢Ò“°¢6öç7B6Æ–VçD&BÒ†f—ƒòç7V66W72bbf—‚ææVVFVB“°¢6öç7B—77VW2Ò†6fsòç7V66W72bb6fræ6†ævVBò6fræ—77VW2¢µÒ’ÇÂµÓ°¢6WE&V6öâ†6Æ–VçD&Bòf—‚ç&V6öâÇÂ""¢""“°¢6WD6ft—77VW2†—77VW2“°¢6WDæVVFVB†6Æ–VçD&BÇÂ—77VW2æÆVæwF‚â“°¢&WGW&â6Æ–VçD&Bbb—77VW2æÆVæwF‚ÓÓÒ°¢Ð¢6F6‚°¢òòâVæf–Æ&ÆRVF—B×W7BæWfW"FV6Æ&RF†R7—7FVÒ&W—&VBà¢&WGW&âfÇ6S°¢Ð¢ÒÂµÒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ²fö–BVF—D†VÇF‚‚“²ÒÂ¶VF—D†VÇF…Ò“°¢–b‚æVVFVB¢&WGW&âçVÆÃ°¢6öç7B6öæf–töæÇ’Ò6ft—77VW2æÆVæwF‚âbb&V6öã°¢&WGW&â…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²Ö&v–ã¢#g‚‡‚"ÂFF–æs¢#‡‚‚"Â&÷&FW%&F—W3¢bÂ&6¶w&÷VæC¢'&v&ƒ#CRÃcbÃ3RÃã"’"Â&÷&FW#¢#‚6öÆ–B&v&ƒ#CRÃcbÃ3RÃãB’"ÒÂ6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢"ÂföçEvV–v‡C¢cÂ6öÆ÷#¢"6cVc#2"ÒÂ6†–ÆG&Vã¢6öæf–töæÇ’ò%4Å77FVÒ6öæf–ræVVG2&W—""¢%4Å77FVÒÆöö·2–æ7F—fR"Ò’Â5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ã‚ÂÖ&v–ã¢#'‚g‚"ÒÂ6†–ÆG&Vã¢6öæf–töæÇ¢òG¶6ft—77VW2æÆVæwF‡Ò&ö&ÆVÒG¶6ft—77VW2æÆVæwF‚ÓÓÒò""¢'2'Ò–â6öæf–rç–ÖÂ(	B4Å77FVÒfÆÇ2&6²Fò—G2÷vâFVfVÇG2f÷"ç—F†–ærÖÆf÷&ÖVBÂv†–6‚7F÷2FFVBvÖW2F÷væÆöF–æræ ¢¢‡&V6öâÇÂ$7FVÒ6Æ–VçBWFFRÖ’†fRâVç&V6övæ—6VB7FVÖ6Æ–VçBç6ò(	BFFVBvÖW2vöâwBÆöBVçF–Â—Bw2&W—&VBâ"’Ò’Â6ft—77VW2æÆVæwF‚âbb…5ô¥5‚æ§7‡2‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãrÂÖ&v–ã¢#g‚"Âv†—FU76S¢'&R×w&"ÒÂ6†–ÆG&Vã¢¶6ft—77VW2ç6Æ–6RƒÂB’æÖ‚‡2’Óâ(
"G·7Ö’æ¦ö–â‚%Æâ"’Â6ft—77VW2æÆVæwF‚âBòÆî(
"(
fæBG¶6ft—77VW2æÆVæwF‚ÒGÒÖ÷&V¢"%ÒÒ’’Â5ô¥5‚æ§7‚„DdÂåæVÅ6V7F–öå&÷rÂ²6†–ÆG&Vã¢5ô¥5‚æ§7‚„DdÂä'WGFöä—FVÒÂ²Æ–÷WC¢&&VÆ÷r"ÂF—6&ÆVC¢'W7’Âöä6Æ–6³¢7–æ2‚’Óâ°¢6WD'W7’‡G'VR“°¢G'’°¢òò†VÂF†R6öæf–rd•%5C¢—Bw26V6öæG2öbv÷&²ÂæB6Æ–VçBf—€¢òò'Vâv–ç7B'&ö¶Vâ6öæf–rv÷VÆB&RÖF÷væÆöBãsÔ"öb7FVÐ¢òò6Æ–VçBæB7F–ÆÂÆVfRF†RVæv–æR&VF–ær&BFVfVÇG2à¢ÆWB†VÆVBÒ°¢–b†6ft—77VW2æÆVæwF‚’°¢6WDFöæR‚%&W—&–ær6öæf–rç–ÖÎ(
b"“°¢6öç7B‚Òv—B†VÅ6Ç46öæf–r‚“°¢–b‚‚ç7V66W72’°¢6WDFöæR†‚æW'&÷"ÇÂ$6öæf–r&W—"f–ÆVBâ"“°¢6WD'W7’†fÇ6R“°¢&WGW&ã°¢Ð¢†VÆVBÒ‚æ6÷VçBÇÂ°¢6WD6ft—77VW2…µÒ“°¢Ð¢–b‡&V6öâ’°¢6WDFöæR‚%&W—&–ær6Æ–VçN(
bF†—26âF¶R6÷WÆRöbÖ–çWFW2æBÖ’&W7F'B7FVÒâ"“°¢6öç7B"Òv—B'Vä6Æ–VçDf—‚‡G'VR“°¢6WDFöæR‡"ç7V66W70¢ò&W—"7F'FVBG¶†VÆVBò†f—†VBG¶†VÆVGÒ6öæf–r—77VRG¶†VÆVBÓÓÒò""¢'2'Ò–¢"'Ò(	B7FVÒv–ÆÂ&V6öæf–wW&RæB&VÆöBæ ¢¢‡"æW'&÷"ÇÂ%&W—"f–ÆVBâ"’“°¢–b‡"ç7V66W72¢6WEF–ÖV÷WB‚‚’Óâ²fö–BVF—D†VÇF‚‚“²ÒÂC“°¢Ð¢VÇ6R°¢6öç7B†VÇF‡’Òv—BVF—D†VÇF‚‚“°¢6WDFöæR††VÇF‡¢òf—†VBG¶†VÆVGÒ6öæf–r—77VRG¶†VÆVBÓÓÒò""¢'2'Ò(	BgVÆÇ’&W7F'B7FVÒFòÇ’æ ¢¢%&W—"6ö×ÆWFVBÂ'WBF†Rg&W6‚†VÇF‚6†V6²7F–ÆÂFWFV7G2&ö&ÆVÒâ"“°¢Ð¢Ð¢6F6‚†R’°¢6WDFöæR†f–ÆVC¢G¶WÖ“°¢Ð¢6WD'W7’†fÇ6R“°¢ÒÂ6†–ÆG&Vã¢'W7’ò%&W—&–æ~(
b"¢6öæf–töæÇ’ò%&W—"6öæf–r"¢%&W—"4Å77FVÒ"Ò’Ò’ÂFöæRò5ô¥5‚æ§7‚‚&F—b"Â²7G–ÆS¢²föçE6—¦S¢Â÷6—G“¢ãsRÂÖ&v–åF÷¢BÒÂ6†–ÆG&Vã¢FöæRÒ’¢çVÆÅÒÒ’“°§Ð¦gVæ7F–öâ6öçFVçB‚’°¢6öç7B·&Vg&W6…Fö¶VâÂ6WE&Vg&W6…Fö¶VåÒÒ5õ$T5BçW6U7FFRƒ“°¢6öç7B'V×Ò‚’Óâ6WE&Vg&W6…Fö¶Vâ‚‡B’ÓâB²“°¢6öç7B¶7F–öç4f—†W5ÒÂ6WD7F–öç4f—†W5ÕÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶vÖW4–åÒÂ6WDvÖW4–åÕÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢6öç7B¶†–FUFööÇ5ÒÂ6WD†–FUFööÇ5ÕÒÒ5õ$T5BçW6U7FFR‡G'VR“°¢òòVçF–Â4Å77FVÒ—2–ç7FÆÆVBÂF†RÒ6†÷w2öæÇ’F†R6WGW&Æö6²(	BæòvÖP¢òò7F–öç2ÂvÖRÆ—7B÷"FööÇ2‡F†W&Rw2æ÷F†–ærf÷"F†VÒFò7Böâ–WB’à¢6öç7B·6Ç57FGW2Â6WE6Ç57FGW5ÒÒ5õ$T5BçW6U7FFR‚‚’Óâ&VD66†VE6Ç57FGW2‚’“°¢6öç7B·6Ç57FGW46†V6¶VBÂ6WE6Ç57FGW46†V6¶VEÒÒ5õ$T5BçW6U7FFR†fÇ6R“°¢6öç7B–ç7FÆÆVBÒ6Ç57FGW3òæ–ç7FÆÆVBÓÓÒG'VS°¢6öç7B&Vg&W6…6Ç57FGW2Ò5õ$T5BçW6T6ÆÆ&6²†7–æ2‚’Óâ°¢G'’°¢6öç7B7FGW2Òv—BvWE6Ç77FVÕ7FGW2‚“°¢6WE6Ç57FGW2‡7FGW2“°¢6WE6Ç57FGW46†V6¶VB‡G'VR“°¢w&—FT66†VE6Ç57FGW2‡7FGW2“°¢&WGW&â7FGW3°¢Ð¢6F6‚°¢òòf–ÆVB&Vg&W6‚×W7Bæ÷BGW&ââVæ¶æ÷vâ7FFR–çFò&æ÷B–ç7FÆÆVB"à¢&WGW&âçVÆÃ°¢Ð¢ÒÂµÒ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢6öç7B&VD7F–öç4f—†W2Ò‚’Óâ°¢G'’°¢6öç7B&rÒv–æF÷ræÆö6Å7F÷&vRævWD—FVÒ„5D”ôå5ôd•„U5õÕô´U’“°¢6WD7F–öç4f—†W5Ò‡&rÓÒçVÆÂòG'VR¢&rÓÓÒ#"“°¢Ð¢6F6‚°¢6WD7F–öç4f—†W5Ò‡G'VR“°¢Ð¢Ó°¢&VD7F–öç4f—†W2‚“°¢6öç7Böä7F–öç4f—†W2Ò‚’Óâ&VD7F–öç4f—†W2‚“°¢v–æF÷ræFDWfVçDÆ—7FVæW"„5D”ôå5ôd•„U5õÕôUdTåBÂöä7F–öç4f—†W2“°¢vWDvÖW4–åÒ‚’çF†Vâ‚‡"’Óâ6WDvÖW4–åÒ‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢vWD†–FUFööÇ5Ò‚’çF†Vâ‚‡"’Óâ6WD†–FUFööÇ5Ò‚"æVæ&ÆVB’’æ6F6‚‚‚’Óâ²Ò“°¢&Vg&W6…6Ç57FGW2‚“°¢òò&RÖ6†V6²6òF†R6V7F–öç2V"&–v‡BgFW"f—'7B×F–ÖR–ç7FÆÂ6ö×ÆWFW2à¢6öç7B—bÒ6WD–çFW'fÂ‡&Vg&W6…6Ç57FGW2ÂC“°¢&WGW&â‚’Óâ°¢6ÆV$–çFW'fÂ†—b“°¢v–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"„5D”ôå5ôd•„U5õÕôUdTåBÂöä7F–öç4f—†W2“°¢Ó°¢ÒÂ·&Vg&W6…6Ç57FGW5Ò“°¢6öç7Bæ6†÷"Ò5õ$T5BçW6U&Vb†çVÆÂ“°¢5õ$T5BçW6TVffV7B‚‚’Óâ°¢6öç7BVÂÒæ6†÷"æ7W'&VçC°¢–b‚VÂ¢&WGW&ã°¢ÆWBæöFRÒVÂç&VçDVÆVÖVçC°¢ÆWB67&öÆÆW"ÒçVÆÃ°¢v†–ÆR†æöFR’°¢6öç7B÷’ÒvWD6ö×WFVE7G–ÆR†æöFR’æ÷fW&fÆ÷u“°¢–b‚†÷’ÓÓÒ&WFò"ÇÂ÷’ÓÓÒ'67&öÆÂ"’bbæöFRç67&öÆÄ†V–v‡BâæöFRæ6Æ–VçD†V–v‡B’°¢67&öÆÆW"ÒæöFS°¢'&V³°¢Ð¢æöFRÒæöFRç&VçDVÆVÖVçC°¢Ð¢–b‚67&öÆÆW"¢&WGW&ã°¢–b‡6fVE67&öÆÂâ’°¢&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ°¢G'’°¢67&öÆÆW"ç67&öÆÅF÷Ò6fVE67&öÆÃ°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢Ò“°¢Ð¢6öç7Böå67&öÆÂÒ‚’Óâ²6fVE67&öÆÂÒ67&öÆÆW"ç67&öÆÅF÷²Ó°¢67&öÆÆW"æFDWfVçDÆ—7FVæW"‚'67&öÆÂ"Âöå67&öÆÂÂ²76—fS¢G'VRÒ“°¢&WGW&â‚’Óâ67&öÆÆW"ç&VÖ÷fTWfVçDÆ—7FVæW"‚'67&öÆÂ"Âöå67&öÆÂ“°¢ÒÂµÒ“°¢&WGW&â…5ô¥5‚æ§7‡2…5ô¥5‚äg&vÖVçBÂ²6†–ÆG&Vã¢µ5ô¥5‚æ§7‚‚&F—b"Â²&Vc¢æ6†÷"Â7G–ÆS¢²†V–v‡C¢ÒÒ’Â5ô¥5‚æ§7‚…&W—$&ææW"Â·Ò’Â5ô¥5‚æ§7‚…6Ç57FVÔ6ö×7BÂ²7FGW3¢6Ç57FGW2Â7FGW46†V6¶VC¢6Ç57FGW46†V6¶VBÂöå&Vg&W6…7FGW3¢&Vg&W6…6Ç57FGW2Ò’Â–ç7FÆÆVBbb7F–öç4f—†W5Òbb5ô¥5‚æ§7‚„vÖT6öçG&öÇ56V7F–öâÂ²öä6†ævVC¢'V×Ò’Â–ç7FÆÆVBbb5ô¥5‚æ§7‚„vÖUFööÇ56V7F–öâÂ·Ò’Â–ç7FÆÆVBbbvÖW4–åÒbb5ô¥5‚æ§7‚„–ç7FÆÆVE6V7F–öâÂ²&Vg&W6…Fö¶Vã¢&Vg&W6…Fö¶VâÂöä6†ævVC¢'V×Ò’Â–ç7FÆÆVBbb†–FUFööÇ5Òbb5ô¥5‚æ§7‚…FööÇ56V7F–öâÂ·Ò•ÒÒ’“°§Ð§f"–æFW‚ÒFVf–æUÇVv–â‚‚’Óâ°¢6öç6öÆRæÆör‚%4Å4FV6²„FV6·’’–æ—F–Æ—¦–ær"“°¢fö–B6ÆVçWÆVv7”6Æ÷VE&VF—&V7E6†÷'F7WB‚“°¢òòGvò'WGFöâ7W&f6W3¢ƒ’F†RÆ–'&'’ÖFWF–Ç2&"Â–æ¦V7FVBf–&V7@¢òòG&VRF6‚†Çv—2öâv†–ÆRF†RÇVv–â'Vç2“²æBƒ"’F†R7F÷&R×vR'WGFöâÀ¢òò–æ¦V7FVB–çFòF†R4Tb7F÷&RF"÷fW"4EæB6öæf–wW&&ÆR–â6WGF–æw2à¢ÆWBÆ–'&'•F6‚ÒçVÆÃ°¢ÆWB7F÷7F÷&UF6‚ÒçVÆÃ°¢ÆWB7F÷v÷&·6†÷F6‚ÒçVÆÃ°¢G'’°¢Æ–'&'•F6‚ÒF6„Æ–'&'”‚“°¢Ð¢6F6‚†R’°¢6öç6öÆRæW'&÷"‚%4Å4FV6³¢f–ÆVBFòF6‚Æ–'&'’vR"ÂR“°¢Ð¢G'’°¢7F÷7F÷&UF6‚Ò–æ—E7F÷&UF6‚‚“°¢Ð¢6F6‚†R’°¢6öç6öÆRæW'&÷"‚%4Å4FV6³¢f–ÆVBFò–æ—B7F÷&RF6‚"ÂR“°¢Ð¢G'’°¢7F÷v÷&·6†÷F6‚Ò–æ—Ev÷&·6†÷F6‚‚“°¢Ð¢6F6‚†R’°¢6öç6öÆRæW'&÷"‚%4Å4FV6³¢f–ÆVBFò–æ—Bv÷&·6†÷F6‚"ÂR“°¢Ð¢òòÆ–'&'’67VÆR&FvW2…4Å2òÄTt•B’(	B–æ¦V7FVB–çFòF†RvÖWBv–æF÷rà¢ÆWBÆ–'&'”&FvUF6‚ÒçVÆÃ°¢G'’°¢7F'D&FvW2‚“°¢Æ–'&'”&FvUF6‚Ò&÷WFW$†öö²æFEF6‚‚"öÆ–'&'’"Â‡G&VR’Óâ°¢7F'D&FvW2‚“°¢&WGW&âG&VS°¢Ò“°¢Ð¢6F6‚†R’°¢6öç6öÆRæW'&÷"‚%4Å4FV6³¢f–ÆVBFò7F'BÆ–'&'’&FvW2"ÂR“°¢Ð¢òògVÆÂ×vR$Gfæ6VB"7W&f6R†§Væ·7F÷&R×7G–ÆR6–FV&"vR’à¢G'’°¢&÷WFW$†öö²æFE&÷WFR„Edä4TEõ$õUDRÂ‚’Óâ5ô¥5‚æ§7‚„Gfæ6VEvRÂ·Ò’Â²W†7C¢G'VRÒ“°¢Ð¢6F6‚†R’°¢6öç6öÆRæW'&÷"‚%4Å4FV6³¢f–ÆVBFò&Vv—7FW"Gfæ6VB&÷WFR"ÂR“°¢Ð¢òòFWVæFVæ7’&W—"&VÆöæw2FòÇVv–â–æ—F–Æ—¦F–öâÂæ÷BvR6ö×öæVçBà¢òòFòæ÷B7F'B—Bv†–ÆR7FVÒô4Tb—27F–ÆÂ&V6÷fW&–ærg&öÒÇVv–â–ç7FÆÂ÷ ¢òò6Æ–VçB&W7F'C¢&WVFVBvV&†VÇW"F—66öææV7G2Ö¶RFV6·’7F÷—G6VÆbgFW ¢òòF†RF†—&B7&6‚â6†&VBÆö6²6W&–Æ—¦W2†÷B×&VÆöBöGWÆ–6FR–çfö6F–öç2à¢6öç7BFWVæFVæ7”Æ–fV7–6ÆUFö¶VâÒ°¢7F—fS¢G'VRÀ¢7F&ÆU6–æ6S¢FFRææ÷r‚’À¢Ó°¢6öç7Bæ÷FT6VeG&ç6—F–öâÒ‚’Óâ°¢FWVæFVæ7”Æ–fV7–6ÆUFö¶Vâç7F&ÆU6–æ6RÒFFRææ÷r‚“°¢Ó°¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚'f—6–&–Æ—G–6†ævR"Âæ÷FT6VeG&ç6—F–öâ“°¢v–æF÷ræFDWfVçDÆ—7FVæW"‚'vW6†÷r"Âæ÷FT6VeG&ç6—F–öâ“°¢6öç7B–çfÆ–FFUW&vVEfW&–f–6F–öç2Ò‡&tWfVçB’Óâ°¢6öç7BWfVçBÒ&tWfVçC°¢6öç7B–G2ÒæWr6WB‚†WfVçBæFWF–Ãòæ–G2ÇÂµÒ’æÖ„çVÖ&W"’æf–ÇFW"‚†–B’Óâ–Bâ’“°¢6öç7BW&vVDBÒçVÖ&W"†WfVçBæFWF–ÃòçW&vVDB’ÇÂFFRææ÷r‚“°¢–G2æf÷$V6‚‚†–B’ÓâW&vVDD'”–Bç6WB†–BÂW&vVDB’“°¢w&—FUVæF–ætFEfW&–f–6F–öç2‡&VEVæF–ætFEfW&–f–6F–öç2‚’æf–ÇFW"‚†—FVÒ’Óâ–G2æ†2„çVÖ&W"†—FVÒæ–B’’’“°¢Ó°¢v–æF÷ræFDWfVçDÆ—7FVæW"…U$tUôDDTEôtÔU5ôUdTåBÂ–çfÆ–FFUW&vVEfW&–f–6F–öç2“°¢6öç7BFWVæFVæ7•&W—$f—'7BÒ6WEF–ÖV÷WB‚‚’Óâ°¢&W—$Ö—76–ætFWVæFVæ6–W4g&öÕÇVv–äÆ–fV7–6ÆR†FWVæFVæ7”Æ–fV7–6ÆUFö¶Vâ’æ6F6‚‚‚’Óâ²Ò“°¢ÒÂDUTäDTä5•ô”ä•D”ÅôDTÄ•ôÕ2“°¢6öç7BFWVæFVæ7•&W—%&WG'’Ò6WD–çFW'fÂ‚‚’Óâ°¢&W—$Ö—76–ætFWVæFVæ6–W4g&öÕÇVv–äÆ–fV7–6ÆR†FWVæFVæ7”Æ–fV7–6ÆUFö¶Vâ’æ6F6‚‚‚’Óâ²Ò“°¢ÒÂDUTäDTä5•õ$UE%•ôÕ2“°¢òòW'6—7FVçB&6¶w&÷VæBæ÷F–f–W#¢FG2'Vâ–âF†R&6¶VæBWfVâ–bF†RT’F†@¢òò7F'FVBF†VÒ—26Æ÷6VBÂ6òF†—2Çv—2×'Vææ–æröÆÆW"f—&W2F†RFö7Bà¢6öç7BFDæ÷F–f–W"Ò6WD–çFW'fÂ†7–æ2‚’Óâ°¢G'’°¢6öç7B"Òv—B÷FDWfVçG2‚“°¢6öç7BWfVçG2Ò"æWfVçG2ÇÂµÓ°¢ÆWBæ÷F–g•7V66W76gVÄFG2ÒG'VS°¢–b†WfVçG2ç6öÖR‚†WfVçB’ÓâWfVçBç7FGW2ÓÓÒ&FöæR"bbWfVçBç7V66W72bbWfVçBæ76VÆÆ’’°¢G'’°¢æ÷F–g•7V66W76gVÄFG2Ò†v—BvWDæ÷F–g”vÖTFB‚’’æVæ&ÆVBÓÒfÇ6S°¢Ð¢6F6‚²ò¢FVfVÇBöâ¢òÐ¢Ð¢ÆWB7W&f6Tf–ÆVE6÷W&6W2ÒfÇ6S°¢–b†WfVçG2ç6öÖR‚†WfVçB’Óâ†WfVçBç6÷W&6Tf–ÇW&W2ÇÂµÒ’æÆVæwF‚â’’°¢G'’°¢7W&f6Tf–ÆVE6÷W&6W2Ò†v—BvWEV•6WGF–æw2‚’’ç6WGF–æw3òçFö7Döå6÷W&6Tf–ÇW&RÓÓÒG'VS°¢Ð¢6F6‚²ò¢FVfVÇBöfb¢òÐ¢Ð¢WfVçG2æf÷$V6‚‚†R’Óâ°¢6öç7BFÂÒRæWFôF÷væÆöC°¢6öç7B—476VÆÆÒRæ76VÆÆ°¢6öç7BÆ—fU&VG’ÒRæÆ—fU&VG“°¢6öç7B—4FÆ5vRÒRæ—4FÆ5vS°¢6öç7BV&Ç”æ÷F–f–VBÒv–æF÷råõ÷6Ç6FV6´V&Ç”FDæ÷F–f–VC°¢6öç7B†DV&Ç”æ÷F–f–6F–öâÒV&Ç”æ÷F–f–VCòæFVÆWFR„çVÖ&W"†Ræ–B’“°¢6öç7B6¶—GWÆ–6FRÒRç7FGW2ÓÓÒ&FöæR"bbRç7V66W72bb†DV&Ç”æ÷F–f–6F–öã°¢6öç7B7W&W757V66W76gVÅ6Ç4FBÒRç7FGW2ÓÓÒ&FöæR"bbRç7V66W72bb—476VÆÆbbæ÷F–g•7V66W76gVÄFG3°¢–b‡7W&f6Tf–ÆVE6÷W&6W2bb†Rç6÷W&6Tf–ÇW&W2ÇÂµÒ’æÆVæwF‚â’°¢6öç7Bf–ÇW&W2Ò†Rç6÷W&6Tf–ÇW&W2ÇÂµÒ’æÖ‚†f–ÇW&R’Óâ°¢6öç7B&V6öâÒf–ÇW&RæFWF–ÂÇÂ†f–ÇW&Ræ6öFRò…EEG¶f–ÇW&Ræ6öFWÖ¢f–ÇW&RçG—RÇÂ&f–ÆVB"“°¢&WGW&âG¶f–ÇW&Rç6÷W&6WÓ¢G·&V6öçÖ°¢Ò“°¢Fö7FW"çFö7B‡°¢F—FÆS¢%4Å4FV6²+rÖæ–fW7B6÷W&6W26¶—VB"À¢&öG“¢G¶RææÖWÓ¢G¶f–ÇW&W2æ¦ö–â‚"+r"—ÖÀ¢GW&F–öã¢#À¢Ò“°¢Ð¢–b‚6¶—GWÆ–6FRbb7W&W757V66W76gVÅ6Ç4FB¢Fö7FW"çFö7B‡°¢F—FÆS¢%4Å4FV6²"À¢&öG“¢Rç7FGW2ÓÓÒ&FöæR"bbRç7V66W70¢ò†—476VÆÆ¢ò–ç7FÆÆVBG¶RææÖWÒG¶FÂò"(	B&VÆöF–ær7FVÞ(
b"¢"(	B&W7F'B7FVÒFò6VR—B'Ö ¢¢Æ—fU&VG¢ò†FÂòFFVBG¶RææÖWÒ(	BF÷væÆöF–ær–â7FVÞ(
f¢FFVBG¶RææÖWÒ(	Bf–Æ&ÆR–â7FVÖ¢¢FFVBG¶RææÖWÒ(	B&W7F'B7FVÒFòf–æ—6‚&÷f—6–öæ–æv¢¢G¶—476VÆÆò$–ç7FÆÂ"¢$FB'Òf–ÆVC¢G¶RææÖWÒG¶RæW'&÷"ò"(	B"²RæW'&÷"¢"'ÖÀ¢Ò“°¢–b†Rç7FGW2ÓÓÒ&FöæR"bbRç7V66W72’°¢fö–B&Vg&W6„&FvW2‚“°¢–b‚—476VÆÆbb—4FÆ5vR’°¢6öç7BfW&–f–6F–öâÒVWVTFEfW&–f–6F–öâ†Ræ–BÂRææÖRÂÆ—fU&VG’“°¢òòfW&–f–VB†÷E&VÆöB6†÷VÆBÖFW&–Æ—¦R–âF†—27FVÒ6W76–öâà¢òò&W7F'BÖfÆÆ&6²FG27F’VWVVBæB&R6†V6¶VBöâF†RæW‡@¢òò7FVÒ÷vV&†VÇW"6W76–öâ–ç7FVBöb&—6–ær&VÖGW&Rv&æ–ærà¢–b†Æ—fU&VG’’°¢v–æF÷rç6WEF–ÖV÷WB‚‚’Óâ°¢fö–BfW&–g”FFVDvÖU&V6†VE7FVÒ†Ræ–BÂRææÖRÂfW&–f–6F–öâæ7&VFVDB“°¢ÒÂS“°¢Ð¢Ð¢òò6Ç7FVÒÖÖööâw2fW&–f–VB†÷E&VÆöBF‚WFFW26¶vRöÆ–6Vç6Rö–æfð¢òò–âF†R7W'&VçB7FVÒ6W76–öâÂ6òæ÷&ÖÂ4Å2FG2×W7BäõB&W7F'Bà¢òò¶VW56VÆÆw2W†—7F–ær&VÆöB&V†f–÷"6W&FRg&öÒF†—2Æ—fRF‚à¢–b†—476VÆÆbbFÂ’°¢&VÆöE7FVÒ‚’æ6F6‚‚‚’Óâ²Ò“°¢Ð¢–b‚—4FÆ5vR’°¢vWDWFôf—‚‚¢çF†Vâ‚‡"’Óâ‡"æVæ&ÆVBòFDWFôf—…VæF–ær†Ræ–B’¢VæFVf–æVB’¢æ6F6‚‚‚’Óâ²Ò“°¢Ð¢òò¶VWF†R÷F–öæÂ%4Å4FV6²"6öÆÆV7F–öâ–â7–æ22vÖW2&RFFVBà¢7–æ56Ç46öÆÆV7F–öâ‚’æ6F6‚‚‚’Óâ²Ò“°¢Ð¢VÇ6R–b‚—476VÆÆ’°¢Ö&µ6Ç4FEVæF–ær†Ræ–BÂfÇ6R“°¢Ð¢Ò“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢òò–æ¦V7F–öâvF6†Föræ÷F–f–6F–öç2…7FVÒ6Æ–VçBWFFR'&ö¶RF†R†öö²’à¢G'’°¢6öç7B—"Òv—B÷–æ¦V7F–öäWfVçG2‚“°¢†—"æWfVçG2ÇÂµÒ’æf÷$V6‚‚†R’Óâ°¢Fö7FW"çFö7B‡²F—FÆS¢%4Å4FV6²"Â&öG“¢RæÖW76vRÒ“°¢Ò“°¢Ð¢6F6‚°¢ò¢–væ÷&R¢ð¢Ð¢ÒÂ#S“°¢òò&6¶w&÷VæBWFòÖf—‚7vVW¢Æ–W2VWVVBf—†W2öæ6RvÖW2f–æ—6‚–ç7FÆÆ–ærà¢6öç7BWFôf—…7vVWÒ6WD–çFW'fÂ‚‚’Óâ²'VäWFôf—…7vVW‚’æ6F6‚‚‚’Óâ²Ò“²ÒÂ#“°¢6WEF–ÖV÷WB‚‚’Óâ²'VäWFôf—…7vVW‚’æ6F6‚‚‚’Óâ²Ò“²ÒÂC“°¢òò¶VWF†R÷F–öæÂ%4Å4FV6²"6öÆÆV7F–öâ&V6öæ6–ÆVB‡6VÆbÖæòÖ÷2v†VâF†R&V`¢òò—2öfb÷"æ÷F†–ær6†ævVB’â&ö÷Böæ6RÂF†Vâ6Æ÷vÇ’Fò6F6‚&VÖ÷fÇ2÷W&vW0¢òòF†BFöâwBvòF‡&÷Vv‚F†RFBÖæ÷F–f–W"&÷fRà¢6WEF–ÖV÷WB‚‚’Óâ²7–æ56Ç46öÆÆV7F–öâ‚’æ6F6‚‚‚’Óâ²Ò“²ÒÂc“°¢òò&RÖ76W'B7F—fFVB'V–ÆBFV×ÆFW2öæ6R7FVÒ†26WGFÆVBâFVÆ–&W&FVÇ¢òòÆFS¢6WDÆVæ6„÷F–öç2æVVG2Æ—fR7FVÔ6Æ–VçBÂæBF†R&6¶VæB†0¢òòÇ&VG’FöæR—G2†ÆbGW&–ærv&×Wà¢6WEF–ÖV÷WB‚‚’Óâ²Ç”&6†—fUFV×ÆFW4öä&ö÷B‚’æ6F6‚‚‚’Óâ²Ò“²ÒÂ#“°¢6WEF–ÖV÷WB‚‚’Óâ²fW&–g”FG5VæF–ætg&öÕ&Wf–÷W57FVÕ6W76–öâ‚“²ÒÂS“°¢6öç7B6öÆÆV7F–öå7–æ2Ò6WD–çFW'fÂ‚‚’Óâ²7–æ56Ç46öÆÆV7F–öâ‚’æ6F6‚‚‚’Óâ²Ò“²ÒÂc“°¢&WGW&â°¢æÖS¢%4Å4FV6²"À¢F—FÆUf–Ws¢5ô¥5‚æ§7‚…ÕF—FÆRÂ·Ò’À¢6öçFVçC¢5ô¥5‚æ§7‚„6öçFVçBÂ·Ò’À¢–6öã¢5ô¥5‚æ§7‚„fW§¦ÆU–V6RÂ·Ò’À¢öäF—6Ö÷VçB‚’°¢6öç6öÆRæÆör‚%4Å4FV6²VæÆöF–ær"“°¢F—7÷6UFö¶VW$F—66÷&Ef–Wr‚“°¢FWVæFVæ7”Æ–fV7–6ÆUFö¶Vâæ7F—fRÒfÇ6S°¢G'’°¢6ÆV%F–ÖV÷WB†FWVæFVæ7•&W—$f—'7B“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢6ÆV$–çFW'fÂ†FWVæFVæ7•&W—%&WG'’“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢Fö7VÖVçBç&VÖ÷fTWfVçDÆ—7FVæW"‚'f—6–&–Æ—G–6†ævR"Âæ÷FT6VeG&ç6—F–öâ“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢v–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"‚'vW6†÷r"Âæ÷FT6VeG&ç6—F–öâ“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢v–æF÷rç&VÖ÷fTWfVçDÆ—7FVæW"…U$tUôDDTEôtÔU5ôUdTåBÂ–çfÆ–FFUW&vVEfW&–f–6F–öç2“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢6ÆV$–çFW'fÂ†FDæ÷F–f–W"“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢6ÆV$–çFW'fÂ†WFôf—…7vVW“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢6ÆV$–çFW'fÂ†6öÆÆV7F–öå7–æ2“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢–b†Æ–'&'•F6‚¢&÷WFW$†öö²ç&VÖ÷fUF6‚„Ä”%$%•õ$õUDRÂÆ–'&'•F6‚“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢&÷WFW$†öö²ç&VÖ÷fU&÷WFR„Edä4TEõ$õUDR“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢7F÷&FvW2‚“°¢&VÖ÷fTÆÄ&FvW2‚“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢–b†Æ–'&'”&FvUF6‚¢&÷WFW$†öö²ç&VÖ÷fUF6‚‚"öÆ–'&'’"ÂÆ–'&'”&FvUF6‚“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢–b‡7F÷7F÷&UF6‚¢7F÷7F÷&UF6‚‚“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢G'’°¢–b‡7F÷v÷&·6†÷F6‚¢7F÷v÷&·6†÷F6‚‚“°¢Ð¢6F6‚²ò¢–væ÷&R¢òÐ¢ÒÀ¢Ó°§Ò“° ¦W‡÷'B²–æFW‚2FVfVÇBÓ°¢òò26÷W&6TÖ–æuU$ÃÖ–æFW‚æ§2æÖ  