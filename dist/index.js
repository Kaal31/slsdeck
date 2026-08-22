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
}function FaKey (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M512 176.001C512 273.203 433.202 352 336 352c-11.22 0-22.19-1.062-32.827-3.069l-24.012 27.014A23.999 23.999 0 0 1 261.223 384H224v40c0 13.255-10.745 24-24 24h-40v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24v-78.059c0-6.365 2.529-12.47 7.029-16.971l161.802-161.802C163.108 213.814 160 195.271 160 176 160 78.798 238.797.001 335.999 0 433.488-.001 512 78.511 512 176.001zM336 128c0 26.51 21.49 48 48 48s48-21.49 48-48-21.49-48-48-48-48 21.49-48 48z"},"child":[]}]})(props);
}function FaInfoCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"},"child":[]}]})(props);
}function FaGamepad (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M480.07 96H160a160 160 0 1 0 114.24 272h91.52A160 160 0 1 0 480.07 96zM248 268a12 12 0 0 1-12 12h-52v52a12 12 0 0 1-12 12h-24a12 12 0 0 1-12-12v-52H84a12 12 0 0 1-12-12v-24a12 12 0 0 1 12-12h52v-52a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v52h52a12 12 0 0 1 12 12zm216 76a40 40 0 1 1 40-40 40 40 0 0 1-40 40zm64-96a40 40 0 1 1 40-40 40 40 0 0 1-40 40z"},"child":[]}]})(props);
}function FaDownload (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"},"child":[]}]})(props);
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
}

const tokeerRuntimeStatus = callable("tokeer_runtime_status");
const tokeerPrepare = callable("tokeer_prepare");
const tokeerVerify = callable("tokeer_verify");
const tokeerRedeem = callable("tokeer_redeem");
// ── Callables ──────────────────────────────────────────────────────────────
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
const crOpenApp = callable("cr_open_app");
const crEnsureInstalledAuto = callable("cr_ensure_installed_auto");
const crEnsureInstalled = callable("cr_ensure_installed");
const crIconPath = callable("cr_icon_path");
const crArtwork = callable("cr_artwork");
const crGetShortcut = callable("cr_get_shortcut");
const crSetShortcut = callable("cr_set_shortcut");
callable("os_status");
callable("os_ensure_cli");
callable("os_ensure_daemon");
callable("os_scan");
callable("os_sync_all");
callable("os_sync_game");
callable("os_status_game");
callable("os_ensure_tracked");
callable("os_snapshots");
callable("os_rollback");
callable("os_conflicts");
callable("os_resolve");
callable("os_export_all");
callable("os_cloud_auth_start");
callable("os_cloud_auth_callback");
callable("os_cloud_disconnect");
callable("os_cloud_webdav");
callable("os_cloud_enabled");
callable("os_cloud_push_all");
callable("os_relay_join");
callable("os_relay_status");
callable("os_relay_leave");
callable("os_diagnostics");
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
// This build can't bypass Denuvo — the badge is a warning that a game won't work.
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
const dlcUnlockerRemove = callable("dlc_unlocker_remove");
// HVAuto (hypervisor crack) — build-first pipeline.
const hvAutoStatus = callable("hv_auto_status");
const hvAutoApply = callable("hv_auto_apply");
// CrakFiles (general DRM crack) — build-matched.
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
// CreamySteamy — compile a version-matched libsteam_api.so proxy for native-Linux games.
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
const pinForFix = callable("pin_for_fix");
// Pin to a SPECIFIC lua.tools fix's build (its own manifest) — accurate per-fix.
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
const crProviderStatus = callable("cr_provider_status");
const fixStuckUpdate = callable("fix_stuck_update");
const injectionHealth = callable("injection_health");
const refreshPatterns = callable("refresh_patterns");
const getAutoDownload = callable("get_auto_download");
const setAutoDownload = callable("set_auto_download");
// ── DLC + cloud toggles ─────────────────────────────────────────────────────
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
// ── v2 DepotDownloader (older-build / content-DLC download) ──────────────────
const depotdlStatus = callable("depotdl_status");
const depotdlDownloadBuild = callable("depotdl_download_build");
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
// ── Helpers ────────────────────────────────────────────────────────────────
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
// ── Backup & restore (config, manifests, depot keys, luas, settings) ─────────
const createBackup = callable("create_backup");
const restoreBackup = callable("restore_backup");
const listBackups = callable("list_backups");
// ── Tools & per-game utilities ─────────────────────────────────────────────
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
callable("get_ui_settings");
callable("set_ui_setting");
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
 * A game added through SLSsteam looks "owned" to Steam by design — that's the
 * whole point of the hook — so Steam's own ownership fields (owner_account_id,
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
 * are not "legit" Steam titles either — they're their own category.
 */
function isNonSteamShortcut(appid) {
    const id = Number(appid);
    return !isNaN(id) && (id > 10000000 || id < -1e6);
}

// After a fix is applied, set a WINEDLLOVERRIDES launch option so Proton loads
// the fix's native DLLs — but ONLY if the game already has a Proton compat tool
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
 *  any env prefixes already present (WINEDLLOVERRIDES, LD_AUDIT, …). */
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
/** Auto-repoint after a fix — ONLY when the fix itself shipped a replacement exe
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
    let rest = (current || "")
        .replace(/WINEDLLOVERRIDES=".*?"\s*/g, "")
        .replace(/WINEDLLOVERRIDES=[^\s]+\s*/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!overrides)
        return current || "";
    if (rest === "")
        return `${overrides} %command%`;
    if (rest.includes("%command%")) {
        return rest.replace("%command%", `${overrides} %command%`).replace(/\s+/g, " ").trim();
    }
    return `${overrides} ${rest} %command%`;
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
 * Set the fix's WINEDLLOVERRIDES launch option — only if a Proton layer is
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
/** Allow re-running when the user applies a fix to the same game again. */
function resetFixRuntime(appid) {
    configured.delete(appid);
}
/** Un-fix cleanup: strip the fix's launch-option additions — the repoint wrapper
 *  AND the WINEDLLOVERRIDES the fix added — in a single write, preserving
 *  everything else (netsock LD_AUDIT, user flags, %command%). */
function clearFixLaunchOptions(appid) {
    const SC = window.SteamClient;
    if (!SC?.Apps?.SetAppLaunchOptions)
        return;
    try {
        let opts = (currentLaunchOptions(appid) || "")
            .replace(REPOINT_RE, " %command%")
            .replace(/WINEDLLOVERRIDES=".*?"\s*/g, "")
            .replace(/WINEDLLOVERRIDES=[^\s]+\s*/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (opts === "%command%")
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
        return window.appStore?.GetAppOverviewByAppID?.(appid)?.display_name || "";
    }
    catch {
        return "";
    }
}
/**
 * Add or remove the netsock LD_AUDIT prefix in a game's launch options,
 * preserving whatever else is already there (WINEDLLOVERRIDES, %command%, …).
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
// Hubcap / ~/Downloads), the correct order is: pin the manifest to that build →
// let Steam update the game to it → apply the fix onto the matching build.
//
// Flow:
//   1. Pin the fix's build (pinForFix). Harmless no-op if no build source.
//   2. If the game is already installed AND its download is complete, skip the
//      update entirely and go straight to applying (covers "installed with the
//      pinned manifest but no fix applied yet").
//   3. If no build could be pinned, just apply now (legacy behaviour).
//   4. Otherwise trigger the Steam update to the pinned build, then:
//        - guided (default): stop and let the user press Apply once the download
//          bar completes;
//        - auto: poll for completion and apply automatically.
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
async function runBuildAccurateApply(h) {
    // 1) Pin to the fix's build (lua.tools -> hubcap -> ~/Downloads). No-op if none.
    h.onPhase("pinning");
    let source = "none";
    let pinned = false;
    // Default true: if we can't tell, assume the build changed so we force an
    // update rather than silently applying onto a stale build.
    let pinChanged = true;
    try {
        const pin = h.pinFn ? await h.pinFn() : await pinForFix(h.appid);
        source = pin.source || "none";
        pinned = !!pin.pinned;
        pinChanged = pin.changed !== false;
    }
    catch {
        /* pin is best-effort */
    }
    const isInstalled = await installed(h.appid);
    const downloadComplete = isInstalled ? await isDownloadComplete(h.appid) : false;
    // 2) No build could be pinned -> nothing to update toward; apply what we have
    //    (legacy behaviour: apply now, pin-after happens inside the apply).
    if (source === "none" || !pinned) {
        h.onPhase("applying");
        await h.doApply();
        return "applied";
    }
    // 3) Skip the update ONLY when the game is already pinned to *this exact build*
    //    (the pin didn't change) and is installed & fully downloaded. That's the
    //    "installed with the pinned manifest, fix not yet applied" case. If the pin
    //    changed (a different/newer build), we must NOT skip — otherwise the
    //    manifest upgrade would never download and the fix would land on the old
    //    build.
    if (!pinChanged && isInstalled && downloadComplete) {
        h.onPhase("applying");
        await h.doApply();
        return "applied";
    }
    // 4) Trigger Steam to update/download the game to the pinned build. First apply
    //    the "no internet" fix (strip the steam.cfg update-block, restored once the
    //    download starts) so Steam doesn't fail the update with "no internet".
    h.onPhase("updating", { source });
    try {
        await noInternetFixBegin(h.appid);
    }
    catch {
        /* best-effort */
    }
    try {
        await triggerSteamInstall(h.appid);
    }
    catch {
        /* the user can still start the download manually */
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
        if (await isDownloadComplete(h.appid)) {
            h.onPhase("applying");
            await h.doApply();
            return "applied";
        }
    }
    // Timed out -> fall back to guided so the user can apply manually.
    h.onPhase("awaiting_download");
    return "awaiting";
}

const _cache = new Map();
let _cancelToken = 0;
function cancelSteamdbBuildFetch() {
    _cancelToken++;
}
async function findSteamdbTab() {
    try {
        const res = await fetchNoCors("http://localhost:8080/json");
        const tabs = await res.json();
        return tabs.find((t) => t.url && t.url.includes("steamdb.info") && t.webSocketDebuggerUrl) || null;
    }
    catch {
        return null;
    }
}
function fetchRssInTab(wsUrl, appid, timeoutMs = 5000) {
    const expr = `fetch('/api/PatchnotesRSS/?appid=${appid}',{credentials:'include'}).then(function(r){return r.status===200?r.text():'';}).catch(function(){return '';})`;
    return new Promise((resolve) => {
        let done = false;
        let sock;
        const finish = (v) => { if (done)
            return; done = true; try {
            sock.close();
        }
        catch { /* */ } resolve(v); };
        try {
            sock = new WebSocket(wsUrl);
        }
        catch {
            resolve("");
            return;
        }
        sock.onopen = () => {
            try {
                sock.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } }));
            }
            catch {
                finish("");
            }
        };
        sock.onmessage = (ev) => {
            try {
                const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
                if (m && m.id === 1) {
                    const v = m?.result?.result?.value;
                    finish(typeof v === "string" ? v : "");
                }
            }
            catch { /* */ }
        };
        sock.onerror = () => finish("");
        setTimeout(() => finish(""), timeoutMs);
    });
}
function parseRss(xml) {
    const out = [];
    const items = xml.split(/<item>/i).slice(1);
    for (const it of items) {
        const link = (it.match(/<link>([^<]*)<\/link>/i) || [])[1] || "";
        const title = (it.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
        const pub = (it.match(/<pubDate>([^<]*)<\/pubDate>/i) || [])[1] || "";
        let bid = (link.match(/\/patchnotes\/(\d+)/) || [])[1] || "";
        if (!bid)
            bid = (title.match(/Build\s+(\d+)/i) || [])[1] || "";
        if (!bid)
            continue;
        let date = "";
        try {
            const d = new Date(pub);
            if (!isNaN(d.getTime()))
                date = d.toISOString().slice(0, 10);
        }
        catch { /* */ }
        out.push({ buildid: bid, date });
    }
    return out;
}
async function fetchSteamdbBuilds(appid, onStatus) {
    if (_cache.has(appid))
        return _cache.get(appid);
    const token = _cancelToken;
    let tab = await findSteamdbTab();
    if (!tab) {
        onStatus?.("Opening SteamDB once for build history…");
        try {
            DFL.Navigation.NavigateToExternalWeb(`https://steamdb.info/app/${appid}/patchnotes/`);
        }
        catch { /* */ }
    }
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline && token === _cancelToken) {
        tab = await findSteamdbTab();
        if (tab?.webSocketDebuggerUrl) {
            onStatus?.("Reading SteamDB build history…");
            const xml = await fetchRssInTab(tab.webSocketDebuggerUrl, appid);
            if (token !== _cancelToken)
                return [];
            if (xml && xml.includes("<item>")) {
                const rows = parseRss(xml);
                if (rows.length) {
                    _cache.set(appid, rows);
                    return rows;
                }
            }
            onStatus?.("SteamDB opened, but build history is not available yet. Sign in there for full history.");
        }
        else {
            onStatus?.("Waiting briefly for the SteamDB page…");
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    return [];
}

/** Close a CEF tab by its target id (so we don't leave a SteamDB page open per
 *  depot). Best-effort over the same debugger endpoint we list tabs from. */
async function closeTab(id) {
    if (!id)
        return;
    try {
        await fetchNoCors("http://localhost:8080/json/close/" + id);
    }
    catch { /* */ }
}
// Table has headers Seen Date / Relative Date / ManifestID. Pull gid (19-ish
// digits) + normalise the date to YYYY-MM-DD so the backend can build-label it.
const SCRAPE_EXPR$1 = `(function(){try{
  var tables=[].slice.call(document.querySelectorAll('table'));
  var mt=null;
  for(var i=0;i<tables.length;i++){
    var hs=[].slice.call(tables[i].querySelectorAll('th')).map(function(x){return (x.textContent||'').trim().toLowerCase();});
    if(hs.indexOf('manifestid')>=0 || hs.some(function(h){return /manifest\\s*id/.test(h);})){ mt=tables[i]; break; }
  }
  if(!mt) return '';
  var out=[];
  [].slice.call(mt.querySelectorAll('tbody tr')).forEach(function(tr){
    var tds=[].slice.call(tr.querySelectorAll('td')).map(function(td){return (td.textContent||'').trim();});
    var gid=''; var date='';
    tds.forEach(function(c){
      if(/^\\d{15,}$/.test(c)) gid=c;
      else if(!date && /\\d{4}/.test(c) && /UTC|[A-Za-z]{3,}/.test(c)){
        try{ var dd=new Date(c.replace(/[\\u2013\\u2014-].*$/,'').trim()); if(!isNaN(dd.getTime())) date=dd.toISOString().slice(0,10); }catch(e){}
      }
    });
    if(gid) out.push({gid:gid,date:date});
  });
  return JSON.stringify(out);
}catch(e){return '';}})()`;
async function findTab$1(urlPart) {
    try {
        const res = await fetchNoCors("http://localhost:8080/json");
        const tabs = await res.json();
        return tabs.find((t) => t.url && t.url.includes(urlPart) && t.webSocketDebuggerUrl) || null;
    }
    catch {
        return null;
    }
}
function evalOnTab$2(wsUrl, expr, timeoutMs = 6000) {
    return new Promise((resolve) => {
        let done = false;
        let sock;
        const finish = (v) => { if (done)
            return; done = true; try {
            sock.close();
        }
        catch { /* */ } resolve(v); };
        try {
            sock = new WebSocket(wsUrl);
        }
        catch {
            resolve("");
            return;
        }
        sock.onopen = () => {
            try {
                sock.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }));
            }
            catch {
                finish("");
            }
        };
        sock.onmessage = (ev) => {
            try {
                const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
                if (m && m.id === 1) {
                    const v = m?.result?.result?.value;
                    finish(typeof v === "string" ? v : "");
                }
            }
            catch { /* */ }
        };
        sock.onerror = () => finish("");
        setTimeout(() => finish(""), timeoutMs);
    });
}
/** Open a depot's SteamDB manifests page and scrape its gid history. Returns []
 *  if the page never yields a table in time (e.g. not signed in / blocked).
 *  `isCancelled` lets the caller stop the work immediately when its UI closes. */
async function scrapeDepotManifests(depot, maxMs = 25000, onStatus, isCancelled) {
    if (isCancelled?.())
        return [];
    const urlPart = `steamdb.info/depot/${depot}`;
    try {
        DFL.Navigation.NavigateToExternalWeb(`https://${urlPart}/manifests/`);
    }
    catch { /* */ }
    const deadline = Date.now() + maxMs;
    let lastId;
    try {
        while (Date.now() < deadline) {
            if (isCancelled?.())
                return [];
            const tab = await findTab$1(urlPart);
            if (isCancelled?.())
                return [];
            if (tab?.webSocketDebuggerUrl) {
                lastId = tab.id;
                const raw = await evalOnTab$2(tab.webSocketDebuggerUrl, SCRAPE_EXPR$1);
                if (isCancelled?.())
                    return [];
                if (raw) {
                    try {
                        const arr = JSON.parse(raw);
                        if (Array.isArray(arr) && arr.length)
                            return arr;
                    }
                    catch { /* */ }
                }
                onStatus?.("Reading SteamDB — sign in there for full history…");
            }
            else {
                onStatus?.(`Opening SteamDB depot ${depot}…`);
            }
            for (let waited = 0; waited < 1500; waited += 100) {
                if (isCancelled?.())
                    return [];
                await new Promise((r) => setTimeout(r, 100));
            }
        }
        return [];
    }
    finally {
        // Always close the depot page we opened — success, timeout, or cancellation —
        // so a multi-depot game doesn't leave a stack of SteamDB tabs behind.
        await closeTab(lastId);
    }
}

const sleep$1 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function cleanGids(gids) {
    const out = {};
    for (const [depot, gid] of Object.entries(gids || {})) {
        if (/^\d+$/.test(String(depot)) && /^\d+$/.test(String(gid)))
            out[String(depot)] = String(gid);
    }
    return out;
}
function samePinnedGids(pinned, current, target) {
    if (!pinned)
        return false;
    const keys = Object.keys(target);
    if (!keys.length)
        return false;
    const cur = current || {};
    return keys.every((depot) => String(cur[depot] || "") === String(target[depot]));
}
async function resolveGidsViaSteamdb(appid, buildid, onProgress) {
    onProgress({ phase: "resolving", message: `Loading SteamDB history for build ${buildid}…` });
    let builds = [];
    try {
        builds = await fetchSteamdbBuilds(appid, (s) => onProgress({ phase: "resolving", message: s || `Loading SteamDB history for build ${buildid}…` }));
    }
    catch {
        return {};
    }
    const target = builds.find((b) => String(b.buildid) === String(buildid));
    const buildDate = String(target?.date || "").slice(0, 10);
    if (!buildDate)
        return {};
    let depots = [];
    try {
        const r = await bpListDepotManifests(appid);
        if (r.success)
            depots = (r.depots || []).map((d) => String(d.depot));
    }
    catch {
        return {};
    }
    if (!depots.length)
        return {};
    const targetTime = new Date(buildDate).getTime();
    const out = {};
    for (let i = 0; i < depots.length; i += 1) {
        const depot = depots[i];
        onProgress({
            phase: "resolving",
            message: `SteamDB: resolving depot ${depot} (${i + 1}/${depots.length}) for build ${buildid}…`,
        });
        let rows = [];
        try {
            rows = await scrapeDepotManifests(depot, 25000, (s) => onProgress({ phase: "resolving", message: s || `SteamDB: resolving depot ${depot}…` }));
        }
        catch {
            continue;
        }
        let best = "";
        let bestDelta = Number.POSITIVE_INFINITY;
        for (const row of rows) {
            if (String(row.date || "").slice(0, 10) === buildDate) {
                best = String(row.gid || "");
                break;
            }
            const t = row.date ? new Date(row.date).getTime() : NaN;
            if (!Number.isFinite(t) || !Number.isFinite(targetTime))
                continue;
            const delta = Math.abs(t - targetTime);
            if (delta < bestDelta) {
                bestDelta = delta;
                best = String(row.gid || "");
            }
        }
        if (/^\d+$/.test(best))
            out[depot] = best;
    }
    return out;
}
/**
 * Prepare the exact Steam build required by an HVAuto / CrakFiles entry.
 *
 * Prefer the same direct DepotDownloader path used by the SteamDB build picker.
 * If the game is already pinned to this exact build and fully downloaded, skip
 * all build work. If HVAuto's backend resolver does not have GIDs for an older
 * build, resolve them through the same signed-in SteamDB depot-history scraper
 * used by "Install a specific build". When DepotDownloader is unavailable, pin
 * the exact GIDs through bpApplyBuild and trigger Steam so the caller can show
 * its normal "Start download / Apply now" guided prompt.
 */
async function prepareCatalogFixBuild(appid, buildid, gidsInput, onProgress) {
    if (!buildid)
        throw new Error("This fix does not specify a Steam build.");
    onProgress({ phase: "resolving", message: `Checking build ${buildid}…` });
    const pin = await getPinStatus(appid).catch(() => ({ success: false, pinned: false }));
    const completePinned = !!pin.pinned ? await isDownloadComplete(appid) : false;
    if (completePinned &&
        pin.buildid &&
        String(pin.buildid) === String(buildid)) {
        onProgress({
            phase: "already_ready",
            percent: 100,
            message: `Correct build ${buildid} is already installed and pinned — skipping build download.`,
        });
        return { status: "ready", alreadyReady: true };
    }
    let gids = cleanGids(gidsInput);
    if (samePinnedGids(!!pin.pinned, pin.depots, gids) && completePinned) {
        onProgress({
            phase: "already_ready",
            percent: 100,
            message: `Correct build ${buildid} is already installed and pinned — skipping build download.`,
        });
        return { status: "ready", alreadyReady: true };
    }
    // Older-build catalog entries sometimes cannot be reconstructed by the
    // backend's keyless archive/date join. In that case use the exact same signed-
    // in SteamDB browser pipeline as the manual specific-build picker.
    if (!Object.keys(gids).length) {
        const steamdb = cleanGids(await resolveGidsViaSteamdb(appid, buildid, onProgress));
        if (Object.keys(steamdb).length)
            gids = steamdb;
    }
    if (!Object.keys(gids).length) {
        throw new Error(`Build ${buildid} is known, but its depot manifests could not be resolved. ` +
            "Open SteamDB once/sign in if prompted, then retry this fix.");
    }
    // The SteamDB fallback may have discovered the exact same GIDs that are
    // already pinned. Re-check before starting an unnecessary build download.
    if (samePinnedGids(!!pin.pinned, pin.depots, gids) && completePinned) {
        onProgress({
            phase: "already_ready",
            percent: 100,
            message: `Correct build ${buildid} is already installed and pinned — skipping build download.`,
        });
        return { status: "ready", alreadyReady: true };
    }
    const ddl = await depotdlStatus().catch(() => ({ success: false, available: false }));
    if (ddl.available) {
        onProgress({ phase: "build_downloading", percent: 0, message: `Preparing build ${buildid}…` });
        const started = await depotdlDownloadBuildGids(appid, buildid, JSON.stringify(gids));
        if (!started.success)
            throw new Error(started.error || "Could not start the build download.");
        const deadline = Date.now() + 30 * 60 * 1000;
        while (Date.now() < deadline) {
            const q = await depotdlQueue();
            const job = (q.items || []).find((x) => x.appid === appid);
            if (job) {
                const pct = Number.isFinite(Number(job.percent)) ? Math.max(0, Math.min(100, Number(job.percent))) : 0;
                onProgress({
                    phase: "build_downloading",
                    percent: pct,
                    message: job.status === "resolving" ? `Resolving build ${buildid}…` : `Downloading build ${buildid}…`,
                });
                if (job.status === "done") {
                    onProgress({ phase: "build_ready", percent: 100, message: `Build ${buildid} installed and pinned.` });
                    return { status: "ready", alreadyReady: false };
                }
                if (job.status === "failed")
                    throw new Error(job.error || "Build download failed.");
            }
            await sleep$1(1000);
        }
        throw new Error("Build download timed out after 30 minutes.");
    }
    // Same exact-GID fallback as the SteamDB picker when direct DepotDownloader is
    // not available: pin first, then ask the live Steam client to install/update.
    const pinned = await bpApplyBuild(appid, buildid, "", JSON.stringify(gids));
    if (!pinned.success)
        throw new Error(pinned.error || `Could not pin build ${buildid}.`);
    await noInternetFixBegin(appid).catch(() => ({}));
    await triggerSteamInstall(appid).catch(() => ({}));
    onProgress({
        phase: "steam_downloading",
        message: `Build ${buildid} pinned — Steam is downloading it.`,
    });
    return { status: "awaiting_steam" };
}

// Force Steam to download/update a game to its pinned build by launching it.
//
// Pinning a build only changes the *target* manifest; Steam won't fetch the new
// files until something makes it re-check. Our IPC trigger (/tmp/SLSsteam.API
// "install|appid") only reaches SLSsteam-added games — for a game the account
// actually owns it's a no-op, which is why "pinned, waiting for download" can sit
// forever. Launching the game makes Steam run its normal update-before-play
// check, so a build whose installed manifest differs from the pinned target
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

// Colour a source badge (Ryuu / luatools ship Online / Bypass / Crack / Tested /
// Generic / Hypervisor). Shown as a small pill next to the fix name so the exact
// tag the source gave is visible instead of the collapsed row label.
// Colour a source tag. Uses substring matching so lua.tools' free-form tags
// ("voices38 (crack)", "SteamTools Achievements Fix", "Ubisoft", …) get a
// sensible colour, not just the exact Ryuu badges.
function badgeStyle(badge) {
    const b = (badge || "").toLowerCase();
    // Colours mirror the Steam library capsule badges (see lib/badges.ts):
    //   online fix → lavender, denuvo & crack/bypass → red, legit → green.
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
    const [check, setCheck] = SP_REACT.useState(null);
    const [applied, setApplied] = SP_REACT.useState([]);
    const [installPath, setInstallPath] = SP_REACT.useState("");
    const [pinned, setPinned] = SP_REACT.useState(false);
    const [pinInfo, setPinInfo] = SP_REACT.useState({});
    const [added, setAdded] = SP_REACT.useState(false);
    // DLC unlockers (SmokeAPI / CreamAPI / Ubisoft) only make sense on games you
    // own. When this pref is on (default), hide them on SLS-added games.
    const [dlcOwnedOnly, setDlcOwnedOnly] = SP_REACT.useState(true);
    const [smoke, setSmoke] = SP_REACT.useState(null);
    const [dlcU, setDlcU] = SP_REACT.useState({});
    // Set when a crack/HV host blocks auto-download and we hand off to the browser.
    // Surfaces an "Apply from Downloads" button so the user finishes with the file
    // they just downloaded.
    const [manualDl, setManualDl] = SP_REACT.useState(null);
    const [customFixes, setCustomFixes] = SP_REACT.useState([]);
    const [hv, setHv] = SP_REACT.useState(null);
    const [crak, setCrak] = SP_REACT.useState(null);
    const [hasRyuuKey, setHasRyuuKey] = SP_REACT.useState(true);
    const [busy, setBusy] = SP_REACT.useState("");
    const [ns, setNs] = SP_REACT.useState(null);
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
    const refresh = async () => {
        try {
            setCheck(await checkFixesFull(appid));
        }
        catch {
            setCheck(null);
        }
        try {
            const r = await getInstalledFixes();
            setApplied((r.fixes || []).filter((f) => f.appid === appid));
        }
        catch {
            /* ignore */
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
            setPinInfo({ buildid: p.buildid, depots: p.depots });
        }
        catch {
            setPinned(false);
            setPinInfo({});
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
        setBusy("");
        setMsg("");
        setCheck(null);
        setApplied([]);
        setAwaiting(null);
        setActiveFixKey("");
        setFixState({});
        setDlComplete(false);
        refresh();
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
        // Manifest already present → just pin.
        if (added) {
            setBusy("game:pin");
            setMsg("Pinning current version…");
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
        // No manifest yet → add it, then pin on completion.
        setBusy("game:manifest");
        setMsg("Adding game…");
        try {
            await startAdd(appid);
        }
        catch {
            setBusy("");
            setMsg("Could not start");
            return;
        }
        watch(() => getAddStatus(appid), "Added & pinned — restart Steam", "Add failed", async () => {
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
    // Poll the game's download completion while we're waiting (guided mode) so the
    // "Apply now" card can hint when it's ready.
    const startDlPoll = () => {
        stopDl();
        setDlComplete(false);
        dlPoll.current = setInterval(async () => {
            const done = await isDownloadComplete(appid);
            setDlComplete(done);
        }, 3000);
    };
    // Shared build-accurate apply runner. `startExtract` kicks off the actual
    // extraction (applyFix / applyLuatoolsFix). The orchestration pins the fix's
    // build, triggers the Steam update, then applies — automatically (auto mode)
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
            setAwaiting(null);
            stopDl();
            setBusy(`${key}:apply`);
            setMsg(`Applying ${label}…`);
            setFixState({ status: "starting" });
            const res = await startExtract();
            if (!res || !res.success) {
                setBusy("");
                setMsg(res?.error || "Fix failed");
                setFixState({ status: "failed", error: res?.error || "Fix failed" });
                throw new Error("apply-start-failed");
            }
            watch(() => getFixStatus(appid), `${label} applied — restart Steam`, "Fix failed", (st) => {
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
                        setMsg("Finding & pinning the fix's build…");
                    else if (phase === "updating")
                        setMsg(`Pinned via ${info?.source || "source"} — updating the game in Steam to that build…`);
                    else if (phase === "awaiting_download")
                        setMsg("Steam is updating the game. When the download finishes, press “Apply now”.");
                    else if (phase === "applying")
                        setMsg(`Applying ${label}…`);
                },
            });
            if (result === "awaiting") {
                setBusy("");
                setAwaiting({ key, label, run: doApply });
                startDlPoll();
            }
        }
        catch {
            /* doApply already surfaced the failure */
        }
    };
    const doFix = async (row) => {
        if (!row.info?.url) {
            setMsg("No fix available");
            return;
        }
        // Ryuu gates denuvo/fix downloads behind an account. Without the API key the
        // download would 401 — prompt for the key instead of attempting.
        if (row.info.url.includes("generator.ryuu.lol") && !hasRyuuKey) {
            setMsg("This fix needs a Ryuu API key. Add it in Decky Pirate → Settings (Sources & keys), then try again.");
            return;
        }
        if (!installPath) {
            setMsg("Game not installed — press “Pin this version” to add it, then download the game in Steam to install the fix.");
            return;
        }
        await runApply(`${row.key}:fix`, row.label, () => applyFix(appid, row.info.url, installPath, row.fixType, check?.gameName || ""));
    };
    // Apply a fix chosen from the account-gated lua.tools catalog. The payload is
    // fetched with the Discord bearer token backend-side, then extracted + pinned
    // to the exact build the fix targets.
    const doLtFix = async (fix) => {
        if (!installPath) {
            setMsg("Game not installed — press “Pin this version” to add it, then download the game in Steam to install the fix.");
            return;
        }
        await runApply(`lt:${fix.id}`, fix.name || "lua.tools fix", () => applyLuatoolsFix(appid, fix.id, installPath, fix.manifest_id || "", fix.depot_id || "", "lua.tools fix", check?.gameName || ""), () => pinForLuatoolsFix(appid, fix.id));
    };
    const doSmoke = async (enable) => {
        setBusy("smoke");
        setMsg(enable ? "Installing SmokeAPI DLC unlock…" : "Removing SmokeAPI…");
        try {
            if (enable) {
                const r = await smokeapiInstall(appid);
                if (r.success) {
                    if (r.overrides)
                        applyFixRuntime(appid, r.overrides); // additive
                    setSmoke({ installed: true, supported: true });
                    setMsg(`DLC unlock installed (SmokeAPI ${r.tag || ""}) — restart Steam`);
                }
                else {
                    setMsg(r.skippedLauncher
                        ? "Skipped — Ubisoft/EA/Rockstar game (SmokeAPI won't help)."
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
        setMsg(enable ? `Installing ${UNLOCKER_LABEL[kind]}…` : `Removing ${UNLOCKER_LABEL[kind]}…`);
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
                    setMsg(`${r.label || UNLOCKER_LABEL[kind]} installed (${r.tag || ""})${detail} — restart Steam`);
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
        setMsg(kind === "hv" ? "Downloading / extracting HV crack…" : "Downloading / extracting CrakFiles crack…");
        try {
            const r = kind === "hv"
                ? await hvAutoApply(appid, hv?.href || "")
                : await crakApply(appid, crak?.href || "");
            if (r.success) {
                setManualDl(null);
                setFixState({ status: "done" });
                if (kind === "hv") {
                    setMsg(`HV crack installed (build ${r.buildid || "?"}${r.pinned ? ", pinned" : ""}). ` +
                        (r.protonTool ? `Set Proton to ${r.protonTool} for this game, then restart Steam. ` : "") +
                        (r.note || ""));
                }
                else {
                    setMsg(`Crack installed (build ${r.buildid || "?"}${r.pinned ? ", pinned" : ""}) — ${r.installed || 0} file(s). ` +
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
            setMsg("Game is not installed yet — install the target build before applying this fix.");
            return;
        }
        setAwaiting(null);
        setActiveFixKey(key);
        setFixState({ status: "resolving" });
        setBusy(key);
        setMsg(`Resolving required build ${target.buildid || "?"}…`);
        stopFlag.current = false;
        try {
            const prepared = await prepareCatalogFixBuild(appid, target.buildid || "", target.gids || {}, (p) => {
                setMsg(p.message || "");
                setFixState({
                    status: p.phase,
                    ...((p.percent != null) ? { percent: p.percent } : {}),
                });
            });
            if (prepared.status === "ready") {
                await applyCatalogPayload(kind, key);
                return;
            }
            setBusy("");
            setAwaiting({ key, label, run: () => applyCatalogPayload(kind, key) });
            startDlPoll();
        }
        catch (e) {
            const error = `${e}`.replace(/^Error:\s*/, "");
            setBusy("");
            setFixState({ status: "failed", error });
            setMsg(error);
        }
    };
    const doCrak = async () => {
        await runCatalogFix("crak");
    };
    const doHv = async () => {
        await runCatalogFix("hv");
    };
    const doCustomFix = async (item) => {
        setBusy(`custom-${item.id}`);
        setMsg(`Applying custom fix "${item.label}"…`);
        try {
            const r = await customApplyFix(appid, item.id);
            if (r.success) {
                setMsg(`Custom fix installed — ${r.installed || 0} file(s). ${r.note || "Restart Steam."}`);
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
    // user reopens Fixes and presses Apply again — the backend now checks
    // ~/Downloads first, so it picks the file up with no extra step.
    const openManual = (url) => {
        setMsg("This host needs a manual download. Opening it in the browser — download the " +
            "file (it saves to Downloads), then reopen this menu and press Apply again; " +
            "it'll pick the file up automatically. The file may also have expired — if the " +
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
        setMsg("Installing from your download…");
        try {
            const r = manualDl.kind === "hv"
                ? await hvApplyLocal(appid, path)
                : await crakApplyLocal(appid, path);
            if (r.success) {
                setManualDl(null);
                setMsg(`Installed from your download — ${r.installed || 0} file(s). ` +
                    (r.protonTool ? `Set Proton to ${r.protonTool}. ` : "") +
                    (r.note || "Restart Steam."));
                onReload?.();
            }
            else {
                setMsg(r.error || "Could not install from that file — is it the right archive?");
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
        setMsg("Reverting fix & unpinning…");
        try {
            await unfix(appid, installPath, "");
        }
        catch {
            setBusy("");
            setMsg("Un-fix failed");
            return;
        }
        watch(() => getUnfixStatus(appid), "Fix reverted & unpinned — restart Steam", "Un-fix failed", () => {
            setPinned(false);
            clearFixLaunchOptions(appid); // strip repoint + WINEDLLOVERRIDES
        });
    };
    // Unpin only — for when the game is pinned but no fix was actually applied
    // (e.g. the download never finished, so the fix step never ran). Without this
    // the sole unpin control was bundled into "Un-fix and unpin", which only shows
    // once a fix is detected — leaving a bare pin with no way to revert.
    const doUnpinOnly = async () => {
        setBusy("unpin");
        setMsg("Unpinning…");
        try {
            const r = await unpinGame(appid);
            if (r.success) {
                setPinned(false);
                setPinInfo({});
                setMsg("Unpinned — back to the latest build. Restart Steam.");
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
            label: `${online ? "Online Fix" : "Crack / Bypass Fix"} (luatools)`,
            fixType: online ? "Online Fix" : "Generic Fix",
            info: { status: 200, available: true, url: e.url, file: e.file, badge: e.badge },
        });
    });
    rows.push({
        key: "unsteam",
        label: "Online Fix (Unsteam) · Universal",
        fixType: "Online Fix (Unsteam)",
        info: check.unsteamFix,
    });
    /**
     * Netsock is a launch-option patch, not a downloadable fix: the .so ships with
     * the SLSsteam install, so enabling it writes the LD_AUDIT prefix into this
     * game's launch options (and removes it again when off).
     */
    const toggleNetsock = async (v) => {
        if (!ns)
            return;
        setBusy("netsock");
        try {
            const r = await netsockSet(appid, v);
            setNs(r);
            const ok = setNetsockLaunchOption(appid, v, r.launchOption);
            setMsg(ok
                ? v
                    ? "Multiplayer patch on — launch option set."
                    : "Multiplayer patch off — launch option removed."
                : `Saved, but the launch option couldn't be written. Set it manually: ${r.launchOption} %command%`);
        }
        catch (e) {
            setMsg(`Error: ${e}`);
        }
        setBusy("");
    };
    const isApplied = (fixType) => applied.some((f) => (f.fixType || "").toLowerCase() === fixType.toLowerCase());
    const working = busy !== "";
    const bs = { minWidth: 0, flex: 1, padding: "5px 8px", fontSize: 12 };
    const renderFixFlow = (key) => {
        const showProgress = activeFixKey === key && !!fixState.status;
        const total = Number(fixState.totalBytes || 0);
        const read = Number(fixState.bytesRead || 0);
        const phasePercent = Number(fixState.percent);
        const percent = Number.isFinite(phasePercent)
            ? Math.max(0, Math.min(100, Math.round(phasePercent)))
            : total > 0
                ? Math.max(0, Math.min(100, Math.round((read / total) * 100)))
                : fixState.status === "done"
                    ? 100
                    : undefined;
        return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [showProgress && (SP_JSX.jsxs("div", { style: { marginTop: 7, padding: 7, borderRadius: 6, background: "rgba(255,255,255,0.05)" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, marginBottom: 4 }, children: [SP_JSX.jsx("span", { children: fixState.status === "resolving"
                                        ? "Resolving required build…"
                                        : fixState.status === "already_ready"
                                            ? "Correct build already installed"
                                            : fixState.status === "build_downloading"
                                                ? "Downloading required build…"
                                                : fixState.status === "build_ready"
                                                    ? "Required build ready"
                                                    : fixState.status === "steam_downloading"
                                                        ? "Waiting for Steam build download…"
                                                        : fixState.status === "fix_installing"
                                                            ? "Downloading / extracting fix…"
                                                            : fixState.status === "downloading"
                                                                ? "Downloading fix…"
                                                                : fixState.status === "extracting"
                                                                    ? "Extracting fix…"
                                                                    : fixState.status === "done"
                                                                        ? "Fix applied"
                                                                        : fixState.status === "failed"
                                                                            ? "Fix failed"
                                                                            : "Applying fix…" }), SP_JSX.jsx("span", { style: { opacity: 0.7 }, children: percent != null
                                        ? `${percent}%`
                                        : read > 0
                                            ? `${(read / 1024 / 1024).toFixed(1)} MB`
                                            : "" })] }), SP_JSX.jsx("progress", { max: 100, ...(percent != null ? { value: percent } : {}), style: { width: "100%", height: 8 } })] })), awaiting?.key === key && (SP_JSX.jsxs("div", { style: {
                        border: "1px solid rgba(120,180,255,0.4)",
                        borderRadius: 8,
                        padding: 8,
                        marginTop: 7,
                        background: "rgba(80,130,220,0.08)",
                    }, children: [SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Pinned \u2014 waiting for Steam to update the game" }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, marginBottom: 6 }, children: dlComplete
                                ? "Download complete. Press Apply now to install the fix onto this build."
                                : "Press Start download now to retry Steam's pinned-build update. The game is launched too, which helps Steam begin the download if it is still idle." }), !dlComplete && (SP_JSX.jsx(DFL.DialogButton, { style: { ...bs, marginBottom: 6 }, onClick: async () => {
                                await noInternetFixBegin(appid).catch(() => ({}));
                                await triggerSteamInstall(appid).catch(() => ({}));
                                launchGame(appid);
                            }, children: "\u25B6 Start download now" })), SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", gap: 6 }, "flow-children": "row", children: [SP_JSX.jsx(DFL.DialogButton, { style: bs, onClick: () => awaiting.run().catch(() => { }), children: dlComplete ? `Apply ${awaiting.label} now` : "Apply now (download not done)" }), SP_JSX.jsx(DFL.DialogButton, { style: bs, onClick: () => {
                                        stopFlag.current = true;
                                        stopDl();
                                        setAwaiting(null);
                                        setMsg("Cancelled — the pin is kept; you can apply later.");
                                    }, children: "Cancel" })] })] }))] }));
    };
    return (SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }, children: [pinned && (SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, lineHeight: 1.5 }, children: SP_JSX.jsxs("div", { children: ["\uD83D\uDD12 Version pinned", pinInfo.buildid
                            ? ` — Build ${pinInfo.buildid}`
                            : (pinInfo.depots && Object.keys(pinInfo.depots).length
                                ? ` — ${Object.keys(pinInfo.depots).length} depot(s)`
                                : ""), " \u2014 the game won't update past the pinned version."] }) })), SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || pinned || !!awaiting, onClick: doPinVersion, children: pinned
                    ? "🔒 Already pinned"
                    : busy === "game:manifest"
                        ? msg || "Adding…"
                        : busy === "game:pin"
                            ? "Pinning…"
                            : "Pin this version" }), rows.length === 0 && (SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.6 }, children: "No ryuu fixes indexed for this game." })), ns && (SP_JSX.jsxs("div", { style: {
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    padding: 8,
                    opacity: ns.installed ? 1 : 0.55,
                }, children: [SP_JSX.jsxs("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: ["Multiplayer patch (netsock) \u00B7 Manual only", ns.enabled ? " · ✓ On" : ns.installed ? " · Available" : " · Not installed"] }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, marginBottom: 4 }, children: "Fixes multiplayer in games using SteamNetworkingSockets while FakeAppIds is active. Sets a launch option \u2014 nothing is downloaded." }), ns.known && (SP_JSX.jsxs("div", { style: { fontSize: 11, color: "#8fd694", marginBottom: 4 }, children: ["\u2713 Confirmed working: ", ns.knownName] })), SP_JSX.jsx("div", { style: { fontSize: 11, color: "#ffcc66", marginBottom: 6 }, children: "\u26A0 Never use on games with anti-cheat \u2014 it scans and rewrites game memory." }), !ns.installed ? (SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: "netsock.so missing \u2014 reinstall SLSsteam (Dependencies) to fetch it." })) : (SP_JSX.jsx(DFL.DialogButton, { style: bs, disabled: working, onClick: () => toggleNetsock(!ns.enabled), children: busy === "netsock"
                            ? "Working…"
                            : ns.enabled
                                ? "Turn multiplayer patch off"
                                : "Turn multiplayer patch on" }))] })), rows.map((row) => {
                const avail = !!row.info?.available;
                const done = isApplied(row.fixType);
                const flowKey = `${row.key}:fix`;
                return (SP_JSX.jsxs("div", { style: {
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        padding: 8,
                        opacity: avail || done ? 1 : 0.55,
                    }, children: [SP_JSX.jsxs("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: [row.label, SP_JSX.jsx(BadgeChip, { badge: row.info?.badge, inline: true }), done ? " · ✓ Applied" : avail ? " · Available" : " · Not available"] }), row.info?.file && (SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, marginBottom: 4 }, children: row.info.file })), (row.info?.url || "").includes("generator.ryuu.lol") && !hasRyuuKey && (SP_JSX.jsx("div", { style: { fontSize: 11, color: "#ffcc66", marginBottom: 4 }, children: "\uD83D\uDD11 Needs a Ryuu API key \u2014 add it in Settings to download this fix." })), SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", gap: 6 }, "flow-children": "row", children: SP_JSX.jsx(DFL.DialogButton, { style: bs, disabled: working || !!awaiting || !avail, onClick: () => doFix(row), children: busy.startsWith(flowKey) ? "Working…" : avail ? "Apply this fix" : "No fix" }) }), renderFixFlow(flowKey)] }, row.key));
            }), (() => {
                const cat = (check.luatoolsCatalog || []);
                const authed = check.luatoolsAuthed;
                const catErr = check.luatoolsCatalogError;
                const dbgAll = check.luatoolsDebug;
                if (authed === false) {
                    return (SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }, children: ["\uD83D\uDD13 Sign in with Discord (Settings \u2192 lua.tools account) to see the full lua.tools fix list for this game.", dbgAll && (SP_JSX.jsxs("div", { style: { fontSize: 10, opacity: 0.55, marginTop: 4, wordBreak: "break-all" }, children: ["debug: ", JSON.stringify(dbgAll)] }))] }));
                }
                if (!cat.length) {
                    const dbg = check.luatoolsDebug;
                    const dbgLine = dbg ? (SP_JSX.jsxs("div", { style: { fontSize: 10, opacity: 0.55, marginTop: 4, wordBreak: "break-all" }, children: ["debug: ", JSON.stringify(dbg)] })) : null;
                    if (catErr) {
                        return (SP_JSX.jsxs("div", { style: { fontSize: 11, color: "#ffcc66", border: "1px solid rgba(255,204,102,0.35)", borderRadius: 8, padding: 8 }, children: ["lua.tools fixes couldn't load: ", catErr, dbgLine] }));
                    }
                    return authed ? (SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6 }, children: ["No lua.tools fixes listed for this game.", dbgLine] })) : null;
                }
                return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs("div", { style: { fontSize: 12, fontWeight: 600, opacity: 0.85, marginTop: 2 }, children: ["lua.tools fixes (", cat.length, ")"] }), cat.map((fix, i) => {
                            const when = fix.release_date || fix.release_year || "";
                            // Tags are the site's badges (voices38, (crack)Ubisoft, …). They
                            // may arrive as objects, so coerce each to text defensively.
                            const tags = (fix.tags || [])
                                .map((t) => typeof t === "string"
                                ? t
                                : (t && (t.name || t.label || t.text || t.title || t.tag)) || "")
                                .filter(Boolean);
                            const buildId = fix.build || fix.manifest_id || "";
                            // Title: a real name, else the build, else a fallback. Tags render
                            // as coloured badge chips below (voices38, Achievements Fix, …).
                            const title = fix.name && fix.name !== String(fix.appid)
                                ? fix.name
                                : buildId
                                    ? `Build ${buildId}`
                                    : `Fix${fix.id ? ` ${fix.id}` : ` ${i + 1}`}`;
                            const whenShort = when ? String(when).slice(0, 10) : "";
                            const meta = [
                                whenShort ? `Released ${whenShort}` : "",
                                buildId ? `build ${buildId}` : "",
                            ]
                                .filter(Boolean)
                                .join(" · ");
                            const flowKey = `lt:${fix.id}`;
                            return (SP_JSX.jsxs("div", { style: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: title }), tags.length > 0 && (SP_JSX.jsx("div", { style: { marginBottom: 4 }, children: tags.map((t, ti) => SP_JSX.jsx(BadgeChip, { badge: t }, ti)) })), meta && (SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, marginBottom: 4 }, children: meta })), SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", gap: 6 }, "flow-children": "row", children: SP_JSX.jsx(DFL.DialogButton, { style: bs, disabled: working || !!awaiting, onClick: () => doLtFix(fix), children: busy.startsWith(flowKey) ? "Working…" : "Apply & pin to build" }) }), renderFixFlow(flowKey)] }, `lt-${fix.id || i}`));
                        })] }));
            })(), (!dlcOwnedOnly || (!added && isInLibrary(appid))) && smoke?.supported && (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: () => doSmoke(!smoke.installed), children: busy === "smoke"
                    ? "Working…"
                    : smoke.installed
                        ? "Remove DLC unlock (SmokeAPI)"
                        : "Unlock DLC (SmokeAPI)" })), (!dlcOwnedOnly || (!added && isInLibrary(appid))) && ["cream", "uplayr1", "uplayr2"].map((kind) => dlcU[kind]?.supported ? (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: () => doUnlocker(kind, !dlcU[kind]?.installed), children: busy === `unlock-${kind}`
                    ? "Working…"
                    : dlcU[kind]?.installed
                        ? `Remove ${UNLOCKER_LABEL[kind]}`
                        : `Unlock ${UNLOCKER_LABEL[kind]}` }, kind)) : null), hv?.found && (SP_JSX.jsxs("div", { style: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }, children: [SP_JSX.jsxs("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: ["HVAuto crack \u00B7 build ", hv.buildid || "?"] }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.65, marginBottom: 6 }, children: "Build-matched: installs the required Steam build first, then applies the HV fix." }), SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: doHv, children: busy === "catalog:hv"
                            ? "Preparing / applying HV crack…"
                            : `Apply HV crack${hv.status === "older" ? " · older target build" : ""}` }), renderFixFlow("catalog:hv")] })), crak?.found && (SP_JSX.jsxs("div", { style: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }, children: [SP_JSX.jsxs("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: ["CrakFiles \u00B7 build ", crak.buildid || "?"] }), !!crak.badges?.length && (SP_JSX.jsx("div", { style: { marginBottom: 4 }, children: crak.badges.map((b, i) => SP_JSX.jsx(BadgeChip, { badge: b }, i)) })), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.65, marginBottom: 6 }, children: "Build-matched: installs the required Steam build first, then applies the crack." }), SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: doCrak, children: busy === "catalog:crak"
                            ? "Preparing / applying crack…"
                            : `Apply CrakFiles crack${crak.status === "older" ? " · older target build" : ""}` }), renderFixFlow("catalog:crak")] })), customFixes.map((item) => (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: () => doCustomFix(item), children: busy === `custom-${item.id}` ? "Applying…" : `Custom fix — ${item.label}` }, item.id))), applied.length > 0 ? (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: doUnfix, children: busy === "unfix" ? "Reverting & unpinning…" : "Un-fix and unpin" })) : pinned ? (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: doUnpinOnly, children: busy === "unpin" ? "Unpinning…" : "Unpin (back to latest)" })) : null, manualDl && (SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: applyFromDownloads, children: busy === "manualdl" ? "Installing…" : "Apply from Downloads…" }), SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: () => { try {
                            DFL.Navigation.NavigateToExternalWeb(manualDl.url);
                        }
                        catch { /* */ } }, children: "Re-open download page" })] })), msg && SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, padding: "0 2px" }, children: msg })] }));
}

const EMOJI_BADGE_STORAGE_KEY = "slsdeck.emojiBadges";
const EMOJI_BADGE_LABELS = {
    sls: "🏴‍☠️",
    legit: "💵",
    fixed: "🔧",
    onlinefix: "🌐",
    denuvo: "👺",
    nonsteam: "❓",
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
 * Two independent badges, each toggleable in Advanced ▸ Options:
 *   • SLS   — games registered through SLSsteam / lua (ours)
 *   • LEGIT — real Steam library titles that are neither ours nor non-Steam
 *             shortcuts (i.e. genuinely licensed)
 *
 * Steam renders the library grid in a separate gamepad-navigation window, so
 * badges are injected into that window's DOM (the same approach the
 * decky-nonsteam-badges plugin uses) rather than through a React patch.
 */
const BADGE_CLASS = "slsdeck-badge";
const STYLE_ID = "slsdeck-badge-style";
const POSITIONED_ATTR = "data-slsdeck-positioned";
/** fixType strings vary by call site ("Online Fix", "online"…). */
const ONLINE_RE = /online/i;
const BADGE_LABELS = {
    sls: "SLS",
    legit: "LEGIT",
    denuvo: "DENUVO",
    onlinefix: "ONLINE FIX",
    fixed: "FIXED",
    nonsteam: "NON-STEAM",
    nonsteamname: "", // dynamic — filled per-app from the shortcut's exe folder
};
const BADGE_COLORS = {
    sls: "linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%)",
    legit: "linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%)",
    denuvo: "linear-gradient(135deg, #a12a2a 0%, #e05252 100%)",
    onlinefix: "linear-gradient(135deg, #7b5fd0 0%, #caa8ff 100%)",
    fixed: "linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%)",
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
let opts = {
    sls: true, legit: true, denuvo: true, onlineFix: true, fixed: true,
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
function classifyApplied(appid) {
    const out = [];
    if (opts.onlineFix && onlineIds.has(appid))
        out.push("onlinefix");
    if (opts.fixed && fixedIds.has(appid))
        out.push("fixed");
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
    try {
        const r = await getBadgeOptions();
        if (r.success) {
            opts = {
                sls: !!r.sls,
                legit: !!r.legit,
                denuvo: !!r.denuvo,
                onlineFix: !!r.onlineFix,
                fixed: !!r.fixed,
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
    if (!opts.sls && !opts.legit && !opts.denuvo && !opts.onlineFix && !opts.fixed && !opts.nonSteam)
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
}

const HistoryModule$1 = DFL.findModuleExport((e) => e?.m_history !== undefined);
const History$1 = HistoryModule$1?.m_history;
let mounted$1 = false;
let ws$1 = null;
let msgId$1 = 1;
let currentAppId = "";
let wsReady$1 = false;
let isConnecting$1 = false;
let storeDisabled = false;
/** The appid of the store app page currently open, if any (for the sidebar). */
function getStoreAppId() {
    const n = Number(currentAppId);
    return n > 0 ? n : null;
}
let poll = null;
let reconnectTimer$1 = null;
let bgTimer$1 = null;
let histUnlisten$1 = null;
// ── CDP helpers ─────────────────────────────────────────────────────────────
function cdp$1(method, params) {
    if (!ws$1 || ws$1.readyState !== WebSocket.OPEN)
        return;
    try {
        ws$1.send(JSON.stringify({ id: msgId$1++, method, params: params || {} }));
    }
    catch {
        /* ignore */
    }
}
function evaluate$1(expr) {
    cdp$1("Runtime.evaluate", { expression: expr });
}
function setStatus$1(text) {
    evaluate$1(`window.__ltStatus&&window.__ltStatus(${JSON.stringify(text)})`);
}
function removeBar() {
    evaluate$1("(function(){" +
        "try{if(window.__ltObs){window.__ltObs.disconnect();window.__ltObs=null;}}catch(e){}" +
        "var b=document.getElementById('lt-store-bar');if(b)b.remove();" +
        "var m=document.getElementById('lt-fix-modal');if(m)m.remove();" +
        "var n=document.querySelectorAll('.lt-sls-btn');for(var i=0;i<n.length;i++)n[i].remove();" +
        "var tb=document.querySelectorAll('[data-lt-btn]');for(var k=0;k<tb.length;k++){var el=tb[k];var s=el.querySelector('span')||el;var o=el.getAttribute('data-lt-orig');if(o!=null)s.textContent=o;var hh=el.getAttribute('data-lt-href');if(hh)el.setAttribute('href',hh);el.removeAttribute('data-lt-btn');}" +
        // un-hide Steam's own Add-to-Cart buttons we replaced
        "var h=document.querySelectorAll('[data-lt-hidden]');for(var j=0;j<h.length;j++){h[j].style.display='';h[j].removeAttribute('data-lt-hidden');}" +
        "})();");
}
function clearPoll() {
    if (poll) {
        clearInterval(poll);
        poll = null;
    }
}
function extractAppId(url) {
    const m = (url || "").match(/\/app\/(\d+)/);
    return m ? m[1] : "";
}
// Steam-native styling for the injected floating bar. Matches the Steam client
// look: Motiva Sans, the #67c1f5 store accent, green/blue action gradients, a
// controller focus glow, and translucent "ghost" secondary buttons.
const STEAM_BAR_CSS = `
#lt-store-bar{font-family:"Motiva Sans",Arial,Helvetica,sans-serif;}
#lt-store-bar .lt-btn{appearance:none;-webkit-appearance:none;border:none;cursor:pointer;white-space:nowrap;color:#fff;font-family:"Motiva Sans",Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:.3px;padding:9px 14px;border-radius:2px;transition:filter .12s ease-out,box-shadow .12s ease-out,transform .06s ease-out;box-shadow:0 1px 3px rgba(0,0,0,.45);}
#lt-store-bar .lt-btn:hover{filter:brightness(1.13);}
#lt-store-bar .lt-btn:active{filter:brightness(.9);transform:translateY(1px);}
#lt-store-bar .lt-btn:focus{outline:none;box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 12px 2px rgba(103,193,245,.75);}
#lt-store-bar .lt-btn--add{background:linear-gradient(to bottom,#8bc53f,#5a8f1e);}
#lt-store-bar .lt-btn--remove{background:linear-gradient(to bottom,#e0604f,#a12a1b);}
#lt-store-bar .lt-btn--fix{background:linear-gradient(to bottom,#47a7e5,#1a5fb4);}
#lt-store-bar .lt-btn--ghost{background:rgba(103,193,245,.12);color:#67c1f5;box-shadow:inset 0 0 0 1px rgba(103,193,245,.4);}
#lt-store-bar .lt-btn--ghost:hover{background:rgba(103,193,245,.22);color:#bfe3ff;filter:none;}
#lt-store-bar .lt-btn:disabled{opacity:.45;cursor:default;filter:none;box-shadow:none;}
#lt-store-status{font-family:"Motiva Sans",Arial,sans-serif;font-size:11px;color:#c6d4df;background:linear-gradient(to bottom,rgba(42,71,94,.92),rgba(23,33,43,.94));border-radius:2px;padding:4px 8px;text-align:center;box-shadow:inset 0 0 0 1px rgba(103,193,245,.15);}
`;
function buildBar(appid, installed, fixAvailable) {
    const primaryLabel = installed ? "\uD83D\uDDD1 Remove" : "\uFF0B Add";
    const primaryAction = installed ? "remove" : "add";
    const primaryVariant = installed ? "remove" : "add";
    const fixDisable = fixAvailable ? "" : "fixBtn.disabled=true;";
    return `(function(){
    var old=document.getElementById('lt-store-bar'); if(old) old.remove();
    if(!document.getElementById('lt-store-style')){var stl=document.createElement('style');stl.id='lt-store-style';stl.textContent=${JSON.stringify(STEAM_BAR_CSS)};document.head.appendChild(stl);}
    var bar=document.createElement('div'); bar.id='lt-store-bar';
    bar.style.cssText='position:fixed;top:64px;right:16px;z-index:2147483000;display:flex;flex-direction:column;gap:8px;align-items:stretch;';
    var row=document.createElement('div'); row.style.cssText='display:flex;gap:8px;';
    function mk(label,action,variant){
      var b=document.createElement('button'); b.textContent=label;
      b.className='lt-btn lt-btn--'+variant;
      b.onclick=function(){ try{ window.ltInvoke(JSON.stringify({action:action,appid:${appid}})); }catch(e){} };
      return b;
    }
    row.appendChild(mk(${JSON.stringify(primaryLabel)},${JSON.stringify(primaryAction)},${JSON.stringify(primaryVariant)}));
    var fixBtn=mk('Fix','fix','fix'); ${fixDisable} row.appendChild(fixBtn);
    row.appendChild(mk('\\u27F3 Reload','reload','ghost'));
    var st=document.createElement('div'); st.id='lt-store-status';
    st.textContent='SLSDeck';
    window.__ltStatus=function(t){ var e=document.getElementById('lt-store-status'); if(e) e.textContent=t; };
    bar.appendChild(row); bar.appendChild(st); document.body.appendChild(bar);
  })();`;
}
// ── fix picker modal (store page context) ───────────────────────────────────
// Mirrors the desktop SLSDeck "Fixes" modal: one row per fix (Online /
// Generic) with a Manifest button (add the game) and a Fix button (apply that
// fix), plus Un-Fix and Close.
function buildFixModal(appid, name, onlineAvail, genericAvail, unsteamAvail, ryuuJson) {
    return `(function(){
    var APPID=${appid};
    var old=document.getElementById('lt-fix-modal'); if(old) old.remove();
    var ov=document.createElement('div'); ov.id='lt-fix-modal';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);font-family:Arial,Helvetica,sans-serif;';
    var card=document.createElement('div');
    card.style.cssText='background:#1b2838;color:#e6edf3;border:1px solid #2a3f5a;border-radius:12px;padding:18px 18px 14px;min-width:340px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.6);';
    var h=document.createElement('div'); h.textContent='Fixes — '+${JSON.stringify(name || `AppID ${appid}`)};
    h.style.cssText='font-size:18px;font-weight:600;margin-bottom:12px;text-align:center;';
    card.appendChild(h);
    function inv(o){ try{ window.ltInvoke(JSON.stringify(o)); }catch(e){} }
    function row(label,avail,fixKey){
      var box=document.createElement('div');
      box.style.cssText='border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;margin-bottom:8px;opacity:'+(avail?'1':'0.6')+';';
      var t=document.createElement('div'); t.textContent=label+(avail?' · Available':' · Not available');
      t.style.cssText='font-size:14px;font-weight:600;margin-bottom:6px;'; box.appendChild(t);
      var r=document.createElement('div'); r.style.cssText='display:flex;gap:8px;';
      function mk(txt,bg,dis,fn){ var b=document.createElement('button'); b.textContent=txt;
        b.style.cssText='flex:1;background:'+bg+';color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:'+(dis?'default':'pointer')+';opacity:'+(dis?'0.5':'1')+';';
        if(!dis) b.onclick=fn; return b; }
      r.appendChild(mk('Manifest','#2a6bb0',false,function(){ inv({action:'manifest',appid:APPID}); }));
      r.appendChild(mk('Fix','#5ba32b',!avail,function(){ inv({action:'fixApply',appid:APPID,fix:fixKey}); }));
      box.appendChild(r); return box;
    }
    var RYUU=${ryuuJson};
    RYUU.forEach(function(e){
      var online=(e.badge||'').toLowerCase()==='online';
      var lbl=online?'Online Fix':'Crack / Bypass Fix';
      var box=document.createElement('div');
      box.style.cssText='border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;margin-bottom:8px;';
      var t=document.createElement('div'); t.textContent=lbl; t.style.cssText='font-size:14px;font-weight:600;'; box.appendChild(t);
      var sub=document.createElement('div'); sub.textContent=e.file+(e.badge?(' · '+e.badge):''); sub.style.cssText='font-size:11px;opacity:0.6;margin:2px 0 6px;'; box.appendChild(sub);
      var b=document.createElement('button'); b.textContent='Apply this fix';
      b.style.cssText='width:100%;background:#5ba32b;color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;';
      b.onclick=function(){ inv({action:'fixApplyUrl',appid:APPID,url:e.url,fixType:(online?'Online Fix':'Generic Fix'),file:e.file}); };
      box.appendChild(b); card.appendChild(box);
    });
    if(${onlineAvail ? "true" : "false"}) card.appendChild(row('Online Fix (perondepot)', true, 'online'));
    // The generic/crack fix had no row at all: genericAvail was accepted as a
    // parameter and then never used, so a fix the backend was perfectly able to
    // apply (fixApply already handles fix:'generic') was unreachable from the
    // store page, while its Online and Unsteam siblings both had buttons.
    if(${genericAvail ? "true" : "false"}) card.appendChild(row('Crack / Bypass Fix (generic)', true, 'generic'));
    card.appendChild(row('Online Fix (Unsteam) · Universal', ${unsteamAvail ? "true" : "false"}, 'unsteam'));
    var st=document.createElement('div'); st.id='lt-store-status';
    st.style.cssText='font-size:12px;color:#c6d4df;text-align:center;min-height:15px;margin:4px 0 10px;';
    window.__ltStatus=function(t){ var e=document.getElementById('lt-store-status'); if(e) e.textContent=t; };
    card.appendChild(st);
    var foot=document.createElement('div'); foot.style.cssText='display:flex;gap:8px;';
    function fbtn(txt,bg,fn){ var b=document.createElement('button'); b.textContent=txt;
      b.style.cssText='flex:1;background:'+bg+';color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;'; b.onclick=fn; return b; }
    foot.appendChild(fbtn('Un-Fix (verify game)','#8a5a1a',function(){ inv({action:'unfix',appid:APPID}); }));
    foot.appendChild(fbtn('Close','#556',function(){ ov.remove(); }));
    card.appendChild(foot);
    ov.appendChild(card);
    ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
    document.body.appendChild(ov);
  })();`;
}
// Store-page badges — same pill style as the library badges, bottom-left.
// No LEGIT (a store page is not proof of ownership) and no BYPASSED (non-HV).
function buildBadges(badges) {
    return `(function(){
    var old=document.getElementById('lt-store-badges'); if(old) old.remove();
    var b=${JSON.stringify(badges)};
    if(!b.length) return;
    var box=document.createElement('div'); box.id='lt-store-badges';
    box.style.cssText='position:fixed;left:16px;top:64px;z-index:2147483000;display:flex;flex-wrap:wrap;gap:4px;font-family:Arial,Helvetica,sans-serif;pointer-events:none;';
    b.forEach(function(x){
      var p=document.createElement('div'); p.textContent=x.label;
      p.style.cssText='white-space:nowrap;padding:2px 7px;border-radius:4px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.4px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.6);box-shadow:0 1px 4px rgba(0,0,0,0.4);background:'+x.bg+';';
      box.appendChild(p);
    });
    document.body.appendChild(box);
  })();`;
}
function removeBadges() {
    evaluate$1("var b=document.getElementById('lt-store-badges');if(b)b.remove();");
}
async function storeBadges(appid, installed) {
    const kinds = [];
    try {
        const o = await getBadgeOptions();
        if (!o.success || !o.storePage)
            return [];
        if (installed && o.sls)
            kinds.push("sls");
        if (o.denuvo) {
            try {
                const known = await denuvoKnown();
                let d = (known.denuvo || []).includes(appid);
                if (!d) {
                    const r = await denuvoResolve([appid]);
                    d = (r.denuvo || []).includes(appid);
                }
                if (d)
                    kinds.push("denuvo");
            }
            catch { /* */ }
        }
        if (o.onlineFix || o.fixed) {
            try {
                const r = await getInstalledFixes();
                const types = (r.fixes || [])
                    .filter((fx) => Number(fx.appid) === appid)
                    .map((fx) => String(fx.fixType || ""));
                if (types.length) {
                    if (types.some((t) => ONLINE_RE.test(t))) {
                        if (o.onlineFix)
                            kinds.push("onlinefix");
                    }
                    else if (o.fixed)
                        kinds.push("fixed");
                }
            }
            catch { /* */ }
        }
    }
    catch { /* */ }
    return kinds.map((k) => ({ label: BADGE_LABELS[k] || k, bg: BADGE_COLORS[k] || "#555" }));
}
// Overlap guard so rapid navigation can't stack async reinjects.
let reinjectBusy = false;
let reinjectPending = null;
async function reinject(appid) {
    if (reinjectBusy) {
        reinjectPending = appid;
        return;
    }
    reinjectBusy = true;
    try {
        await reinjectNow(appid);
    }
    finally {
        reinjectBusy = false;
        const next = reinjectPending;
        reinjectPending = null;
        if (next != null && next !== appid)
            void reinject(next);
    }
}
async function reinjectNow(appid) {
    let installed = false;
    try {
        installed = !!(await hasLua(appid)).exists;
    }
    catch {
        /* ignore */
    }
    if (storeDisabled) {
        removeBar();
    }
    else {
        let fixAvail = false;
        try {
            const f = await checkFixesFull(appid);
            fixAvail = !!(f?.genericFix?.available || f?.onlineFix?.available);
        }
        catch {
            /* ignore */
        }
        evaluate$1(buildBar(appid, installed, fixAvail));
    }
    try {
        evaluate$1(buildBadges(await storeBadges(appid, installed)));
    }
    catch {
        /* ignore */
    }
}
// ── action bridge (Runtime.bindingCalled → backend) ─────────────────────────
async function onAction$1(payloadStr) {
    let msg;
    try {
        msg = JSON.parse(payloadStr);
    }
    catch {
        return;
    }
    const appid = Number(msg?.appid);
    const action = msg?.action;
    if (!appid)
        return;
    if (action === "reload") {
        setStatus$1("Reloading Steam…");
        try {
            await reloadSteam();
        }
        catch {
            /* ignore */
        }
        return;
    }
    if (action === "remove") {
        setStatus$1("Removing…");
        try {
            await deleteLua(appid);
        }
        catch {
            /* ignore */
        }
        await reinject(appid);
        setStatus$1("Removed — reload Steam");
        return;
    }
    if (action === "add" || action === "manifest") {
        setStatus$1("Adding…");
        try {
            const res = await startAdd(appid);
            if (!res.success) {
                setStatus$1(res.error || "Could not add");
                return;
            }
        }
        catch {
            setStatus$1("Could not start");
            return;
        }
        clearPoll();
        poll = setInterval(async () => {
            try {
                const r = await getAddStatus(appid);
                const st = r.state || {};
                setStatus$1("Add: " + (st.status || ""));
                if (["done", "failed", "cancelled"].includes(st.status || "")) {
                    clearPoll();
                    if (st.status === "done") {
                        if (action === "add")
                            await reinject(appid);
                        setStatus$1("Added — restart Steam");
                    }
                    else {
                        setStatus$1(st.error || "Failed");
                    }
                }
            }
            catch {
                /* keep polling */
            }
        }, 800);
        return;
    }
    // The Fix button opens the picker modal (Manifest + Fix per fix type).
    if (action === "fix") {
        setStatus$1("Checking fixes…");
        try {
            const f = await checkFixesFull(appid);
            evaluate$1(buildFixModal(appid, f?.gameName || "", !!f?.onlineFix?.available, !!f?.genericFix?.available, f?.unsteamFix?.available !== false, JSON.stringify(f?.ryuuFixes || [])));
            setStatus$1("");
        }
        catch {
            setStatus$1("Could not check fixes");
        }
        return;
    }
    if (action === "fixApplyUrl") {
        setStatus$1("Locating game…");
        try {
            const p = await getGameInstallPath(appid);
            if (!p.success || !p.installPath) {
                setStatus$1("Game not installed — add it first, then install");
                return;
            }
            const url = String(msg?.url || "");
            const fixType = String(msg?.fixType || "Generic Fix");
            if (!url) {
                setStatus$1("No fix url");
                return;
            }
            await applyFix(appid, url, p.installPath, fixType, "");
            clearPoll();
            poll = setInterval(async () => {
                try {
                    const r = await getFixStatus(appid);
                    const st = r.state || {};
                    setStatus$1("Fix: " + (st.status || ""));
                    if (["done", "failed", "cancelled"].includes(st.status || "")) {
                        clearPoll();
                        if (st.status === "done")
                            applyFixRuntime(appid, st.overrides);
                        setStatus$1(st.status === "done" ? "Fix applied — restart Steam" : st.error || "Fix failed");
                    }
                }
                catch { /* keep polling */ }
            }, 800);
        }
        catch {
            setStatus$1("Fix failed");
        }
        return;
    }
    if (action === "fixApply") {
        const which = msg?.fix === "generic" ? "generic" : msg?.fix === "unsteam" ? "unsteam" : "online";
        setStatus$1("Locating game…");
        try {
            const p = await getGameInstallPath(appid);
            if (!p.success || !p.installPath) {
                setStatus$1("Game not installed — add it first, then install");
                return;
            }
            const f = await checkFixesFull(appid);
            const pick = which === "generic" ? f?.genericFix : which === "unsteam" ? f?.unsteamFix : f?.onlineFix;
            if (!pick?.available || !pick?.url) {
                setStatus$1("That fix is not available");
                return;
            }
            // Three-way, not a two-branch ternary. `which` has three values, and the
            // old form labelled BOTH "unsteam" and "online" as "Online Fix (Unsteam)".
            // fixType is not cosmetic: it is recorded in the fix log, and fixes.py
            // keys off exactly "online fix (unsteam)" to patch the <appid> placeholder
            // in unsteam.ini -- so the perondepot online fix was being sent down the
            // wrong post-extract path and shown under the wrong name in Un-fix.
            const fixType = which === "generic"
                ? "Generic Fix"
                : which === "unsteam"
                    ? "Online Fix (Unsteam)"
                    : "Online Fix";
            await applyFix(appid, pick.url, p.installPath, fixType, f.gameName || "");
            clearPoll();
            poll = setInterval(async () => {
                try {
                    const r = await getFixStatus(appid);
                    const st = r.state || {};
                    setStatus$1("Fix: " + (st.status || ""));
                    if (["done", "failed", "cancelled"].includes(st.status || "")) {
                        clearPoll();
                        if (st.status === "done")
                            applyFixRuntime(appid, st.overrides);
                        setStatus$1(st.status === "done" ? "Fix applied — restart Steam" : st.error || "Fix failed");
                    }
                }
                catch {
                    /* keep polling */
                }
            }, 800);
        }
        catch {
            setStatus$1("Fix failed");
        }
        return;
    }
    if (action === "unfix") {
        setStatus$1("Locating game…");
        try {
            const p = await getGameInstallPath(appid);
            const path = p.success ? p.installPath || "" : "";
            await unfix(appid, path, "");
            clearPoll();
            poll = setInterval(async () => {
                try {
                    const r = await getUnfixStatus(appid);
                    const st = r.state || {};
                    setStatus$1("Un-fix: " + (st.status || ""));
                    if (["done", "failed", "cancelled"].includes(st.status || "")) {
                        clearPoll();
                        setStatus$1(st.status === "done" ? "Fix reverted — restart Steam" : st.error || "Un-fix failed");
                    }
                }
                catch {
                    /* keep polling */
                }
            }, 800);
        }
        catch {
            setStatus$1("Un-fix failed");
        }
    }
}
// ── WebSocket connection to the store tab's CDP endpoint ────────────────────
// Mirrors the approach isitcracked uses (proven on-device): an aggressive 500ms
// background poll that connects whenever a store tab exists — regardless of the
// active route — plus CDP navigation events (frameNavigated,
// navigatedWithinDocument, loadEventFired) and an on-open location.href query so
// SPA store navigation reliably re-injects.
function scheduleReconnect$1(ms = 1000) {
    if (!mounted$1 || reconnectTimer$1)
        return;
    reconnectTimer$1 = setTimeout(() => {
        reconnectTimer$1 = null;
        if (mounted$1 && (!ws$1 || ws$1.readyState === WebSocket.CLOSED))
            connect$1();
    }, ms);
}
function updateAppIdFromUrl(url) {
    const a = extractAppId(url);
    console.log("===LT=== url→appid:", (url || "").substring(0, 70), "=>", a);
    if (!a) {
        if (currentAppId) {
            currentAppId = "";
            clearPoll();
            removeBar();
            removeBadges();
        }
        return;
    }
    currentAppId = a;
    if (wsReady$1)
        reinject(Number(a));
}
async function connect$1() {
    if (!mounted$1 || isConnecting$1)
        return;
    isConnecting$1 = true;
    setTimeout(() => {
        isConnecting$1 = false;
    }, 5000);
    if (ws$1 && (ws$1.readyState === WebSocket.OPEN || ws$1.readyState === WebSocket.CONNECTING)) {
        isConnecting$1 = false;
        return;
    }
    try {
        const res = await fetchNoCors("http://localhost:8080/json");
        const tabs = await res.json();
        const tab = tabs.find((t) => t.url && t.url.includes("store.steampowered.com"));
        console.log("===LT=== connect: store tab", tab ? tab.url.substring(0, 70) : "NOT FOUND", "of", tabs.length, "tabs");
        if (!tab || !tab.webSocketDebuggerUrl) {
            isConnecting$1 = false;
            scheduleReconnect$1(1000);
            return;
        }
        currentAppId = extractAppId(tab.url);
        const sock = new WebSocket(tab.webSocketDebuggerUrl);
        ws$1 = sock;
        let pendingUrlId = null;
        sock.onopen = () => {
            isConnecting$1 = false;
            if (ws$1 !== sock) {
                sock.close();
                return;
            }
            console.log("===LT=== ws open; currentAppId=", currentAppId);
            cdp$1("Page.enable");
            cdp$1("Runtime.enable");
            cdp$1("Runtime.addBinding", { name: "ltInvoke" });
            const uid = msgId$1++;
            pendingUrlId = uid;
            try {
                sock.send(JSON.stringify({
                    id: uid,
                    method: "Runtime.evaluate",
                    params: { expression: "window.location.href" },
                }));
            }
            catch {
                /* ignore */
            }
            setTimeout(() => {
                if (ws$1 !== sock)
                    return;
                wsReady$1 = true;
                if (currentAppId)
                    reinject(Number(currentAppId));
            }, 300);
        };
        sock.onmessage = (ev) => {
            if (ws$1 !== sock)
                return;
            let d;
            try {
                d = JSON.parse(ev.data);
            }
            catch {
                return;
            }
            if (pendingUrlId !== null && d.id === pendingUrlId) {
                pendingUrlId = null;
                const u = d.result?.result?.value;
                if (typeof u === "string")
                    updateAppIdFromUrl(u);
                return;
            }
            if (d.method === "Runtime.bindingCalled" && d.params?.name === "ltInvoke") {
                onAction$1(String(d.params.payload || ""));
            }
            else if (d.method === "Page.frameNavigated" && d.params?.frame?.url) {
                clearPoll();
                setTimeout(() => updateAppIdFromUrl(d.params.frame.url), 500);
            }
            else if (d.method === "Page.navigatedWithinDocument" && d.params?.frame?.url) {
                clearPoll();
                setTimeout(() => updateAppIdFromUrl(d.params.frame.url), 500);
            }
            else if (d.method === "Page.loadEventFired") {
                if (currentAppId && wsReady$1)
                    setTimeout(() => reinject(Number(currentAppId)), 300);
            }
        };
        sock.onerror = () => {
            isConnecting$1 = false;
            scheduleReconnect$1(1000);
        };
        sock.onclose = () => {
            if (ws$1 === sock) {
                ws$1 = null;
                wsReady$1 = false;
            }
            scheduleReconnect$1(1000);
        };
    }
    catch (e) {
        console.log("===LT=== connect error:", e);
        isConnecting$1 = false;
        scheduleReconnect$1(1000);
    }
}
function handleLocation(pathname) {
    if (pathname === "/steamweb")
        connect$1();
}
function initStorePatch() {
    mounted$1 = true;
    console.log("===LT=== initStorePatch: store injection starting");
    getStoreDisabled()
        .then((r) => {
        storeDisabled = !!r.disabled;
    })
        .catch(() => { });
    if (History$1) {
        try {
            handleLocation(History$1.location?.pathname || "");
            histUnlisten$1 = History$1.listen((info) => handleLocation(info?.pathname || ""));
        }
        catch {
            /* ignore */
        }
    }
    connect$1();
    // Aggressive background poll (isitcracked style): connect whenever a store tab
    // exists, regardless of route, and pick up live floating-toggle changes.
    bgTimer$1 = setInterval(async () => {
        try {
            const dr = await getStoreDisabled();
            const dis = !!dr.disabled;
            if (dis !== storeDisabled) {
                storeDisabled = dis;
                if (currentAppId && wsReady$1)
                    reinject(Number(currentAppId));
                else if (dis)
                    removeBar();
            }
        }
        catch {
            /* ignore */
        }
        if (!ws$1 || ws$1.readyState === WebSocket.CLOSED)
            connect$1();
    }, 500);
    return () => {
        mounted$1 = false;
        if (bgTimer$1) {
            clearInterval(bgTimer$1);
            bgTimer$1 = null;
        }
        if (reconnectTimer$1) {
            clearTimeout(reconnectTimer$1);
            reconnectTimer$1 = null;
        }
        clearPoll();
        if (histUnlisten$1) {
            histUnlisten$1();
            histUnlisten$1 = null;
        }
        if (ws$1) {
            try {
                ws$1.close();
            }
            catch {
                /* ignore */
            }
            ws$1 = null;
            wsReady$1 = false;
        }
    };
}

/**
 * Actions & fixes for whichever game page is currently open (library app page
 * or Steam store page). This is the reliable, default way to drive the plugin.
 * Restart Steam lives here — the single restart button.
 */
function GameControlsSection({ onChanged }) {
    const [appid, setAppid] = SP_REACT.useState(null);
    const [name, setName] = SP_REACT.useState("");
    const [installed, setInstalled] = SP_REACT.useState(false);
    const [ownedElsewhere, setOwnedElsewhere] = SP_REACT.useState(false);
    const [showFixes, setShowFixes] = SP_REACT.useState(false);
    const [busy, setBusy] = SP_REACT.useState("");
    const [status, setStatus] = SP_REACT.useState("");
    const poll = SP_REACT.useRef(null);
    const stop = () => {
        if (poll.current) {
            clearInterval(poll.current);
            poll.current = null;
        }
    };
    SP_REACT.useEffect(() => {
        const detect = () => currentLibraryAppId() ?? getStoreAppId();
        setAppid(detect());
        const t = setInterval(() => {
            const id = detect();
            setAppid((prev) => (prev === id ? prev : id));
        }, 1000);
        return () => {
            clearInterval(t);
            stop();
        };
    }, []);
    SP_REACT.useEffect(() => {
        setBusy("");
        setStatus("");
        setShowFixes(false);
        setOwnedElsewhere(false);
        if (appid == null) {
            setInstalled(false);
            setName("");
            return;
        }
        (async () => {
            let ours = false;
            try {
                ours = !!(await hasLua(appid)).exists;
            }
            catch {
                ours = false;
            }
            setInstalled(ours);
            let pref = true;
            try {
                pref = !!(await getHideOnOwned()).enabled;
            }
            catch {
                pref = true;
            }
            setOwnedElsewhere(shouldHideForOwned(appid, ours, pref));
        })();
        checkFixes(appid, appDisplayName(appid))
            .then((r) => setName(r?.gameName || ""))
            .catch(() => setName(""));
    }, [appid]);
    const doAdd = async () => {
        if (appid == null)
            return;
        setBusy("adding");
        setStatus("Starting…");
        try {
            const res = await startAdd(appid);
            if (!res.success) {
                setBusy("");
                setStatus(res.error || "Could not add");
                toaster.toast({ title: "SLSDeck", body: res.error || "Could not add" });
                return;
            }
        }
        catch {
            setBusy("");
            setStatus("Could not start");
            return;
        }
        stop();
        poll.current = setInterval(async () => {
            try {
                const r = await getAddStatus(appid);
                const st = r.state || {};
                setStatus(st.status || "");
                if (["done", "failed", "cancelled"].includes(st.status || "")) {
                    stop();
                    setBusy("");
                    if (st.status === "done") {
                        setInstalled(true);
                        setStatus("Added — reload Steam");
                        onChanged?.();
                    }
                    else if (st.status === "failed") {
                        setStatus(st.error || "Failed");
                    }
                }
            }
            catch {
                /* keep polling */
            }
        }, 800);
    };
    const doRemove = async () => {
        if (appid == null)
            return;
        setBusy("removing");
        setStatus("Removing…");
        try {
            await deleteLua(appid);
            setInstalled(false);
            setStatus("Removed — reload Steam");
            toaster.toast({ title: "SLSDeck", body: "Removed — reload Steam" });
            onChanged?.();
        }
        catch {
            setStatus("Remove failed");
        }
        finally {
            setBusy("");
        }
    };
    const noGame = appid == null;
    const working = busy !== "";
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "This game", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.75, padding: "2px 0" }, children: [noGame
                            ? "Open a game's library or store page to enable these."
                            : `${name || `AppID ${appid}`} (AppID ${appid})`, status ? ` · ${status}` : ""] }) }), ownedElsewhere && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.65, padding: "0 2px 4px" }, children: appid != null && isNonSteamShortcut(appid)
                        ? "Non-Steam shortcut — SLSsteam can't add this. Fixes can still be applied manually from Advanced ▸ Game fixes."
                        : "You already own this game — plugin actions are hidden. Turn this off in Advanced ▸ Options, or apply a fix manually from Advanced ▸ Game fixes." }) })), !ownedElsewhere && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: noGame || working, onClick: installed ? doRemove : doAdd, children: installed
                        ? busy === "removing"
                            ? "Removing…"
                            : "Remove from SLSsteam"
                        : busy === "adding"
                            ? status || "Adding…"
                            : "Add with SLSsteam" }) })), !ownedElsewhere && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: noGame || working, onClick: () => setShowFixes((v) => !v), children: showFixes ? "Hide fixes" : "Fixes…" }) })), showFixes && appid != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(FixPicker, { appid: appid, onReload: onChanged }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: working, onClick: () => reloadSteam(), children: "Reload Steam" }) })] }));
}

function sourceLabel(s) {
    if (s === "slssteam")
        return "SLSsteam";
    if (s === "both")
        return "SLSsteam + Lua";
    return "Lua";
}
function InstalledSection({ refreshToken, onChanged }) {
    const [apps, setApps] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(true);
    const load = async () => {
        setLoading(true);
        try {
            const res = await getInstalledApps();
            setApps(res.success ? res.apps : []);
        }
        catch {
            setApps([]);
        }
        finally {
            setLoading(false);
        }
    };
    SP_REACT.useEffect(() => {
        load();
    }, [refreshToken]);
    const confirmPurge = () => {
        DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: "Purge all added games?", strDescription: `This removes ALL ${apps.length} added game(s) from SLSsteam — every AdditionalApps registration and its lua manifest — and clears the added-games history. It does NOT delete installed game files. Restart Steam afterwards. This cannot be undone (restore a backup if you need them back).`, strOKButtonText: "Purge all", onOK: async () => {
                try {
                    const res = await purgeAllAdded();
                    if (res.success) {
                        toaster.toast({ title: "SLSDeck", body: `Purged ${res.removed} game(s)` });
                        await load();
                        onChanged();
                    }
                }
                catch (e) {
                    toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
                }
            } }));
    };
    const confirmDelete = (a) => {
        DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: `Remove ${a.gameName}?`, strDescription: `This removes AppID ${a.appid} from SLSsteam and deletes any Lua script. Restart Steam afterwards for it to disappear.`, strOKButtonText: "Remove", onOK: async () => {
                try {
                    const res = await deleteLua(a.appid);
                    if (res.success) {
                        toaster.toast({ title: "SLSDeck", body: `Removed ${a.gameName}` });
                        await load();
                        onChanged();
                    }
                }
                catch (e) {
                    toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
                }
            } }));
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: `Installed games${apps.length ? ` (${apps.length})` : ""}`, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: load, children: loading ? "Refreshing…" : "Refresh list" }) }), apps.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: confirmPurge, disabled: loading, children: "Purge list (remove all added games)" }) })), !loading && apps.length === 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.6, padding: "4px 0" }, children: "No games added yet." }) })), apps.map((a) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => confirmDelete(a), children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsxs("span", { style: { fontWeight: 600 }, children: [a.gameName, a.isDisabled ? " (disabled)" : ""] }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: ["AppID ", a.appid, " \u00B7 ", sourceLabel(a.source), " \u00B7 tap to remove"] })] }) }) }, `${a.appid}-${a.source}`))), apps.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "2px 0" }, children: "Use \"Reload Steam\" in Game controls (top) to apply changes." }) }))] }));
}

// Post-pin verification: prove the pin landed AND that a download will actually
// happen — the two things that silently fail when "Install build" seems to do
// nothing.
//
// The classic failure is a "phantom install": Steam is told to install/pin an
// app whose depots it can't resolve (injection off, or the build's manifests
// never resolved), so it writes the appmanifest as FullyInstalled with 0 bytes
// and then never downloads. Play does nothing. We detect that from the ACF
// StateFlags + SizeOnDisk (via appDownloadComplete) and point the user at the
// existing "Fix installed-but-empty" repair instead of leaving them stuck.
// Steam AppState StateFlags bits we care about.
const ST_UPDATE_REQUIRED = 2;
const ST_FULLY_INSTALLED = 4;
const ST_UPDATE_RUNNING = 0x100; // 256
const ST_UPDATE_STARTED = 0x200; // 512
const ST_DOWNLOADING = 0x100000; // 1048576
const ST_STAGING = 0x200000; // 2097152
async function verifyBuildApply(appid, wantBuild) {
    // 1) Did the pin actually get written? If not, resolution failed — almost
    //    always "SteamDB history not available" (sign in) or no manifest source.
    let pinned = false;
    let pinBuild = "";
    try {
        const p = await getPinStatus(appid);
        pinned = !!p.pinned;
        pinBuild = p.buildid || "";
    }
    catch { /* treat as not pinned */ }
    if (!pinned) {
        return {
            ok: false, phantom: false,
            text: "Pin didn't take — couldn't resolve that build's manifests. Sign into SteamDB (top-right → through Steam) so the full depot history loads, then retry.",
        };
    }
    // 2) Injection must be active or Steam can't resolve the pinned depots.
    let injected = true;
    try {
        const h = await injectionHealth();
        injected = !!h.active;
    }
    catch { /* assume on */ }
    // 3) Read Steam's own appmanifest state.
    let flags = 0;
    let size = 0;
    try {
        const d = await appDownloadComplete(appid);
        flags = d.stateFlags || 0;
        size = d.sizeOnDisk || 0;
    }
    catch { /* no manifest yet */ }
    const installedFlag = !!(flags & ST_FULLY_INSTALLED);
    const updating = !!(flags & (ST_UPDATE_REQUIRED | ST_UPDATE_RUNNING | ST_UPDATE_STARTED | ST_DOWNLOADING | ST_STAGING));
    const phantom = installedFlag && size === 0;
    const build = pinBuild || wantBuild;
    if (phantom) {
        return {
            ok: false, phantom: true,
            text: injected
                ? `Pinned build ${build}, but Steam marked it installed with 0 bytes — a phantom install, which is why nothing downloads. Run Tools → "Fix installed-but-empty", then launch the game to download.`
                : `Pinned build ${build}, but injection is OFF, so Steam can't resolve the depots (phantom install). Turn injection on in Dependencies, then retry.`,
        };
    }
    if (updating) {
        return { ok: true, phantom: false, text: `Pinned build ${build} ✓ — Steam has the update queued/downloading.` };
    }
    // Installed with real bytes and no update flag: either already on this build,
    // or Steam hasn't noticed the manifest change yet — a launch makes it check.
    return {
        ok: true, phantom: false,
        text: `Pinned build ${build} ✓ — if the download doesn't start, launch the game to make Steam update to it.`,
    };
}

// Controller-scrollable text region.
//
// On a Steam Deck (or any controller-only device) the gamepad focus ring can
// only enter a container that has a *focusable* child — a plain <div> of log
// text can never take focus, so the panel won't scroll down to it and the
// content below the fold is unreachable. Wrapping the text in a <Focusable>
// scroll region fixes that: the D-pad/stick can move focus into it and Steam
// auto-scrolls. A Copy button (also focusable) both guarantees focus can reach
// the region and lets the user pull long logs off the device.
function ScrollableResult({ text, maxHeight = 180, mono = false, copy = true, fontSize = 11, }) {
    const [copied, setCopied] = SP_REACT.useState(false);
    if (!text)
        return null;
    const doCopy = () => {
        try {
            navigator?.clipboard?.writeText?.(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
        catch {
            /* clipboard may be unavailable; ignore */
        }
    };
    return (SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [SP_JSX.jsx(DFL.Focusable
            // Focusable scroll container: gamepad focus enters here and the stick
            // scrolls it. `overflowY: scroll` keeps the track present so long output
            // is always reachable.
            , { 
                // Focusable scroll container: gamepad focus enters here and the stick
                // scrolls it. `overflowY: scroll` keeps the track present so long output
                // is always reachable.
                style: {
                    maxHeight,
                    overflowY: "scroll",
                    padding: "6px 8px",
                    borderRadius: 4,
                    background: "rgba(0,0,0,0.22)",
                }, children: SP_JSX.jsx("div", { style: {
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize,
                        lineHeight: 1.4,
                        opacity: 0.9,
                        fontFamily: mono ? "monospace" : undefined,
                    }, children: text }) }), copy && (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "4px 8px", alignSelf: "flex-start" }, onClick: doCopy, children: copied ? "Copied" : "Copy" }))] }));
}

/**
 * A scrollable pick-one list. Decky's UI kit has no dropdown that works well
 * with a controller in the QAM, so selection is a modal with a focusable column.
 */
function PickerModal({ closeModal, title, subtitle, items, onPick, }) {
    return (SP_JSX.jsxs(DFL.ModalRoot, { closeModal: closeModal, children: [SP_JSX.jsx("div", { style: { fontSize: 20, fontWeight: 600, marginBottom: 2 }, children: title }), subtitle ? (SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.7, marginBottom: 10 }, children: subtitle })) : null, SP_JSX.jsx(DFL.Focusable, { style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: "56vh",
                    overflowY: "auto",
                }, children: items.map((it) => (SP_JSX.jsxs(DFL.DialogButton, { style: { textAlign: "left", padding: "10px 12px" }, onClick: () => {
                        onPick(it);
                        closeModal?.();
                    }, children: [SP_JSX.jsx("div", { style: { fontSize: 14 }, children: it.label }), it.sublabel ? (SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.65 }, children: it.sublabel })) : null] }, it.key))) })] }));
}
/**
 * Per-game tools, scoped to whichever game's library page is open. The whole
 * section hides itself when there is no such game, so it never shows controls
 * that would act on nothing.
 */
function GameToolsSection() {
    const appid = currentLibraryAppId();
    const [busy, setBusy] = SP_REACT.useState("");
    const [note, setNote] = SP_REACT.useState("");
    const [proton, setProton] = SP_REACT.useState(null);
    const [mp, setMp] = SP_REACT.useState(null);
    const [repointed, setRepointed] = SP_REACT.useState(false);
    const [smoke, setSmoke] = SP_REACT.useState(null);
    const [dlcU, setDlcU] = SP_REACT.useState({});
    // DLC unlockers (SmokeAPI / CreamAPI / Ubisoft) are meant for games you own —
    // they emulate DLC entitlements on a legitimately-owned base game. On an
    // SLS-added game they're pointless, so by default they only surface for owned
    // titles. `allowUnlockers` gates all three groups.
    const [allowUnlockers, setAllowUnlockers] = SP_REACT.useState(true);
    // CreamySteamy: compile a version-matched proxy for native-Linux games.
    const [creamy, setCreamy] = SP_REACT.useState(null);
    // ASSella-inspired: SteamStub removal, version freeze, build rollback, manifest age.
    const [steamless, setSteamless] = SP_REACT.useState(null);
    const [pinned, setPinned] = SP_REACT.useState(null);
    const [ageSec, setAgeSec] = SP_REACT.useState(null);
    const [histCount, setHistCount] = SP_REACT.useState(0);
    // v2 (slsdeckdlc) only: DepotDownloader present → show download buttons.
    const [depotdl, setDepotdl] = SP_REACT.useState(false);
    const steamdbCancelled = SP_REACT.useRef(false);
    SP_REACT.useEffect(() => {
        steamdbCancelled.current = false;
        return () => {
            steamdbCancelled.current = true;
            cancelSteamdbBuildFetch();
        };
    }, [appid]);
    SP_REACT.useEffect(() => { depotdlStatus().then((r) => setDepotdl(!!r.available)).catch(() => { }); }, []);
    const [ddl, setDdl] = SP_REACT.useState(null);
    const ddlTimer = SP_REACT.useRef(null);
    const stopDdl = () => { if (ddlTimer.current) {
        clearInterval(ddlTimer.current);
        ddlTimer.current = null;
    } };
    const pollDdlOnce = SP_REACT.useCallback(async () => {
        try {
            const q = await depotdlQueue();
            const it = (q.items || []).find((x) => x.appid === appid) || null;
            setDdl(it);
            return it ? it.status : "";
        }
        catch {
            return "";
        }
    }, [appid]);
    const startDdl = SP_REACT.useCallback(() => {
        if (ddlTimer.current)
            return;
        ddlTimer.current = setInterval(async () => {
            const s = await pollDdlOnce();
            if (s === "done" || s === "failed")
                stopDdl();
        }, 2000);
    }, [pollDdlOnce]);
    SP_REACT.useEffect(() => {
        let active = true;
        if (depotdl)
            pollDdlOnce().then((s) => { if (active && (s === "downloading" || s === "resolving"))
                startDdl(); });
        return () => { active = false; stopDdl(); };
    }, [depotdl, appid, pollDdlOnce, startDdl]);
    const ddlActive = ddl?.status === "downloading" || ddl?.status === "resolving";
    const refreshProton = SP_REACT.useCallback(() => {
        if (appid == null)
            return;
        getProtonMapping(appid)
            .then((r) => setProton(r && r.success ? r.toolName || "" : ""))
            .catch(() => setProton(""));
    }, [appid]);
    SP_REACT.useEffect(() => {
        refreshProton();
        if (appid != null) {
            try {
                setRepointed(hasLaunchRepoint(appid));
            }
            catch {
                setRepointed(false);
            }
            // Owned = in the Steam library but not added through SLSsteam. When the
            // "owned games only" pref is on, hide the DLC unlockers on SLS-added games.
            (async () => {
                let pref = true;
                try {
                    pref = !!(await getDlcOwnedOnly()).enabled;
                }
                catch {
                    pref = true;
                }
                let addedByUs = false;
                try {
                    addedByUs = !!(await hasLua(appid)).exists;
                }
                catch {
                    addedByUs = false;
                }
                const owned = !addedByUs && isInLibrary(appid);
                setAllowUnlockers(!pref || owned);
            })();
            smokeapiStatus(appid)
                .then((r) => setSmoke(r.success ? { installed: !!r.installed, supported: !!r.supported } : null))
                .catch(() => setSmoke(null));
            dlcUnlockersStatus(appid)
                .then((r) => {
                if (!r.success)
                    return;
                const next = {};
                ["cream", "uplayr1", "uplayr2"].forEach((k) => {
                    const s = r[k];
                    if (s && s.supported)
                        next[k] = { installed: !!s.installed, supported: true };
                });
                setDlcU(next);
            })
                .catch(() => setDlcU({}));
            creamyStatus(appid)
                .then((r) => setCreamy(r.success && r.supported
                ? { supported: true, installed: !!r.installed, haveToolchain: !!r.haveToolchain }
                : null))
                .catch(() => setCreamy(null));
            steamlessStatus(appid)
                .then((r) => setSteamless(r.success && r.supported
                ? { supported: true, hasStub: !!r.hasStub, installed: !!r.installed }
                : null))
                .catch(() => setSteamless(null));
            getPinStatus(appid).then((r) => setPinned(!!r.pinned)).catch(() => setPinned(null));
            manifestAge(appid).then((r) => setAgeSec(r.success && r.installed ? (r.ageSec ?? null) : null)).catch(() => setAgeSec(null));
            buildHistoryList(appid).then((r) => setHistCount(r.success ? (r.items || []).length : 0)).catch(() => setHistCount(0));
        }
    }, [refreshProton, appid]);
    if (appid == null)
        return null;
    const fixLaunchTarget = async () => {
        setBusy("repoint");
        setNote("");
        try {
            const r = await getMainExe(appid);
            if (!r.success || !r.exe) {
                setNote(r.error || "Couldn't find the game's real executable.");
            }
            else if ((await ensureProtonSelected(appid), setLaunchRepoint(appid, r.exe))) {
                setRepointed(true);
                const base = r.exe.split("/").pop() || r.exe;
                setNote(`Launch target set to ${base} (Proton ensured). Launch options were preserved.`);
            }
            else {
                setNote("Could not set launch options.");
            }
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const doSmoke = async (enable) => {
        setBusy("smoke");
        setNote("");
        try {
            if (enable) {
                const r = await smokeapiInstall(appid);
                if (r.success) {
                    if (r.overrides)
                        applyFixRuntime(appid, r.overrides); // additive launch option
                    setSmoke({ installed: true, supported: true });
                    setNote(`DLC unlock (SmokeAPI ${r.tag || ""}) installed. Restart Steam.`);
                }
                else {
                    setNote(r.skippedLauncher
                        ? "Skipped — Ubisoft/EA/Rockstar game (3rd-party DRM; SmokeAPI won't help)."
                        : r.error || "Could not install SmokeAPI.");
                }
            }
            else {
                const r = await smokeapiRemove(appid);
                setSmoke((s) => (s ? { ...s, installed: false } : s));
                setNote(r.success ? "SmokeAPI removed (original steam_api restored)." : r.error || "Remove failed.");
            }
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const UNLOCKER_LABEL = {
        cream: "CreamAPI",
        uplayr1: "Uplay DLC (R1)",
        uplayr2: "Uplay DLC (R2)",
    };
    const doUnlocker = async (kind, enable) => {
        setBusy(`unlock-${kind}`);
        setNote("");
        try {
            if (enable) {
                const r = await dlcUnlockerInstall(appid, kind);
                if (r.success) {
                    if (r.overrides)
                        applyFixRuntime(appid, r.overrides); // additive launch option
                    setDlcU((s) => ({ ...s, [kind]: { installed: true, supported: true } }));
                    const detail = kind === "cream"
                        ? r.unlockAll ? " (unlock-all)" : r.dlcCount ? ` (${r.dlcCount} DLC)` : ""
                        : "";
                    setNote(`DLC unlock (${r.label || UNLOCKER_LABEL[kind]} ${r.tag || ""})${detail} installed. Restart Steam.`);
                }
                else {
                    setNote(r.notSupported
                        ? `This game has no ${UNLOCKER_LABEL[kind]} target DLL.`
                        : r.error || `Could not install ${UNLOCKER_LABEL[kind]}.`);
                }
            }
            else {
                const r = await dlcUnlockerRemove(appid, kind);
                setDlcU((s) => ({ ...s, [kind]: { installed: false, supported: true } }));
                setNote(r.success ? `${UNLOCKER_LABEL[kind]} removed (original DLL restored).` : r.error || "Remove failed.");
            }
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const doCreamy = async () => {
        setBusy("creamy");
        try {
            if (creamy && !creamy.haveToolchain) {
                setNote("First run: downloading the compiler (~45MB, one time)…");
                const t = await creamyEnsureToolchain();
                if (!t.success) {
                    setNote(t.error || "Could not set up the compiler.");
                    setBusy("");
                    return;
                }
            }
            setNote("Compiling a version-matched proxy for this game…");
            const r = await creamyDeploy(appid);
            if (r.success) {
                setCreamy((c) => (c ? { ...c, installed: true, haveToolchain: true } : c));
                setNote(r.note || `CreamySteamy proxy installed (${r.installed || 0} symbols).`);
            }
            else {
                setNote(r.notSupported ? "This game has no native libsteam_api.so." : r.error || "CreamySteamy failed.");
            }
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const doSteamless = async () => {
        setBusy("steamless");
        setNote("Removing SteamStub DRM… (first run fetches Steamless + a small toolchain)");
        try {
            const r = await steamlessUnstub(appid);
            if (r.success) {
                setSteamless((s) => (s ? { ...s, installed: true, hasStub: false } : s));
                setNote(r.note || "SteamStub removed.");
            }
            else {
                setNote(r.notStub ? "This exe has no SteamStub — nothing to remove." : (r.error || "Steamless failed."));
            }
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const toggleFreeze = async () => {
        setBusy("freeze");
        try {
            if (pinned) {
                await unpinGame(appid);
                setPinned(false);
                setNote("Version unfrozen — Steam can update this game again.");
            }
            else {
                const r = await pinGame(appid);
                if (r.success) {
                    setPinned(true);
                    setNote("Version frozen at the current build — Steam won't update it.");
                }
                else
                    setNote(r.error || "Couldn't freeze (needs the slsteam-moon engine).");
            }
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const openRollback = async () => {
        setBusy("rollback");
        let items = [];
        try {
            items = (await buildHistoryList(appid)).items || [];
        }
        catch { /* */ }
        setBusy("");
        if (!items.length) {
            setNote("No saved build history for this game yet.");
            return;
        }
        const fmt = (e) => {
            const when = e.savedAt ? new Date(e.savedAt * 1000).toLocaleDateString() : "";
            const bits = [e.buildid ? `build ${e.buildid}` : `${Object.keys(e.gids).length} depot(s)`, when, e.source].filter(Boolean);
            return bits.join(" · ");
        };
        const pitems = items.map((e) => ({
            key: e.id,
            label: e.current ? "Current build" : "Roll back",
            sublabel: fmt(e) + (e.current ? " · installed now" : ""),
        }));
        DFL.showModal(SP_JSX.jsx(PickerModal, { title: "Roll back build", subtitle: "Pick a build to pin. Steam will re-download the changed files.", items: pitems, onPick: (it) => {
                const e = items.find((x) => x.id === it.key);
                if (!e || e.current) {
                    setNote("Already on that build.");
                    return;
                }
                DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: "Roll back this game?", strDescription: `Pin ${e.buildid ? `build ${e.buildid}` : "this build"} and let Steam re-download the changed files. Reversible — pin the latest again anytime.`, strOKButtonText: "Roll back", onOK: () => run("rollback", () => buildHistoryRollback(appid, e.id), (r) => {
                        if (!r.success)
                            return r.unsupported ? "Rollback needs the slsteam-moon engine." : (r.error || "Rollback failed");
                        triggerSteamInstall(appid).catch(() => { });
                        validateSteamApp(appid).catch(() => { });
                        return `Pinned${r.buildid ? ` build ${r.buildid}` : ""} — Steam validation started; changed files will be downloaded automatically.`;
                    }) }));
            } }));
    };
    // PRIMARY gid resolution: scrape SteamDB's signed-in (full) depot history and
    // date-match each depot's gid to the build's date. Returns {depot: gid}; the
    // backend fills any depot this missed from the GitHub archive (fallback).
    const resolveGidsViaSteamdb = async (buildDate, onStatus) => {
        const out = {};
        if (!buildDate)
            return out;
        let depots = [];
        try {
            const r = await bpListDepotManifests(appid);
            if (r.success)
                depots = r.depots.map((d) => String(d.depot));
        }
        catch { /* */ }
        const target = new Date(buildDate).getTime();
        for (const depot of depots) {
            if (steamdbCancelled.current)
                break;
            let rows = [];
            try {
                rows = await scrapeDepotManifests(depot, 25000, onStatus, () => steamdbCancelled.current);
            }
            catch { /* */ }
            let best = "";
            let bestDelta = Infinity;
            for (const r of rows) {
                if (r.date === buildDate) {
                    best = r.gid;
                    bestDelta = 0;
                    break;
                }
                const t = r.date ? new Date(r.date).getTime() : NaN;
                if (isNaN(t))
                    continue;
                const delta = Math.abs(t - target);
                if (delta < bestDelta) {
                    bestDelta = delta;
                    best = r.gid;
                }
            }
            if (best)
                out[depot] = best;
        }
        return out;
    };
    const openBuildPicker = async () => {
        setBusy("bp");
        setNote("Loading build history…");
        let builds = [];
        try {
            const r = await bpListBuilds(appid);
            if (r.success)
                builds = r.builds;
        }
        catch { /* */ }
        // The backend can't reach SteamDB's RSS past Cloudflare, so it usually returns
        // only the "latest" pseudo-entry. Fetch the full history through the Steam
        // browser instead (cached per game; needs SteamDB open once to clear Cloudflare).
        const realBuilds = builds.filter((b) => !b.isCurrent && b.buildid && b.buildid !== "latest");
        if (!realBuilds.length) {
            try {
                const rows = await fetchSteamdbBuilds(appid, (s) => setNote(s));
                if (rows.length) {
                    const latest = builds.find((b) => b.isCurrent) || { buildid: "latest", date: "current", isCurrent: true };
                    builds = [latest, ...rows.map((r) => ({ buildid: r.buildid, date: r.date }))];
                }
            }
            catch { /* */ }
        }
        // Which builds a crack actually targets — exact buildids from the HV / CrakFiles
        // catalogs, so we can highlight the builds that are known-good with a fix.
        const compat = new Map(); // buildid -> label (HV / Crack)
        try {
            const [hv, crak] = await Promise.all([
                hvAutoStatus(appid).catch(() => null),
                crakStatus(appid).catch(() => null),
            ]);
            if (hv?.found && hv.buildid)
                compat.set(String(hv.buildid), "HV");
            if (crak?.found && crak.buildid)
                compat.set(String(crak.buildid), compat.has(String(crak.buildid)) ? "HV+Crack" : "Crack");
        }
        catch { /* */ }
        setBusy("");
        setNote("");
        if (!builds.some((b) => b.buildid)) {
            setNote("Couldn't load build history — open SteamDB once (and sign in for full history), then retry.");
            return;
        }
        const dateOf = {};
        builds.forEach((b) => { if (b.buildid)
            dateOf[b.buildid] = b.date; });
        // Surface crack-compatible builds first (after Latest), then the rest.
        const latestRows = builds.filter((b) => b.isCurrent || b.buildid === "latest");
        const rest = builds.filter((b) => !(b.isCurrent || b.buildid === "latest"));
        rest.sort((a, b) => (compat.has(b.buildid) ? 1 : 0) - (compat.has(a.buildid) ? 1 : 0));
        const ordered = [...latestRows, ...rest];
        const items = ordered.map((b) => {
            const tag = compat.get(b.buildid);
            const isLatest = b.isCurrent || b.buildid === "latest";
            return {
                key: b.buildid,
                label: isLatest ? "Latest (unpin)" : `${tag ? "✅ " : ""}Build ${b.buildid}`,
                sublabel: `${b.date && b.date !== "current" ? b.date : (isLatest ? "current" : "")}${tag ? ` · ${tag} fix targets this build` : ""}`,
            };
        });
        DFL.showModal(SP_JSX.jsx(PickerModal, { title: "Install a specific build", subtitle: "Full build history from SteamDB. \u2705 = a crack (HV/CrakFiles) targets this exact build. Pins via the engine; Steam re-downloads the changed files.", items: items, onPick: (it) => {
                const dt = dateOf[it.key] || "";
                DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: it.key === "latest" ? "Back to latest?" : "Install this build?", strDescription: it.key === "latest"
                        ? "Unpin so the game tracks the current public build again."
                        : `Pin build ${it.key}${dt && dt !== "current" ? ` (${dt})` : ""} and let Steam re-download the changed files. Reversible — pick latest anytime.`, strOKButtonText: it.key === "latest" ? "Unpin" : "Install build", onOK: () => run("bp", async () => {
                        if (it.key === "latest") {
                            const r = await bpApplyBuild(appid, "latest", "", "{}");
                            return { msg: r.success ? "Unpinned — tracking latest." : (r.error || "Unpin failed") };
                        }
                        // Resolve the exact {depot: gid} map from SteamDB's signed-in history.
                        let primary = "{}";
                        try {
                            const map = await resolveGidsViaSteamdb(dt, (s) => setNote(s));
                            if (Object.keys(map).length)
                                primary = JSON.stringify(map);
                        }
                        catch { /* */ }
                        // slsdeckdlc + resolved gids → download the build's files DIRECTLY
                        // via DepotDownloader (Hubcap). This bypasses moon's on-demand
                        // manifest fetch — the path that fails with "no internet connection"
                        // — and DepotDownloader's own resolver (which wrongly says "no older
                        // builds"). The worker pins the build in moon afterwards too.
                        if (depotdl && primary !== "{}") {
                            setNote(".NET / DepotDownloader preparing… first run may download the local .NET runtime.");
                            const dr = await depotdlDownloadBuildGids(appid, it.key, primary);
                            if (dr.success) {
                                await pollDdlOnce();
                                startDdl();
                            }
                            return { msg: dr.success
                                    ? `Downloading build ${it.key} directly via DepotDownloader — progress shows below (needs a Hubcap key).`
                                    : `DepotDownloader: ${dr.error || "failed"}` };
                        }
                        // Otherwise (simple build, or gids couldn't be resolved): pin via
                        // moon and let Steam download.
                        const r = await bpApplyBuild(appid, it.key, dt, primary);
                        if (!r.success)
                            return { msg: r.error || "Could not apply that build" };
                        const v = await verifyBuildApply(appid, it.key);
                        if (v.phantom || !v.ok)
                            return { msg: v.text };
                        await noInternetFixBegin(appid).catch(() => ({}));
                        triggerSteamInstall(appid).catch(() => { });
                        const validated = await validateSteamApp(appid).catch(() => ({ success: false }));
                        if (!validated.success) {
                            // Compatibility fallback for unusual Steam setups where the
                            // protocol handler cannot be invoked from the backend.
                            const launched = launchGame(appid);
                            if (launched) {
                                try {
                                    DFL.Navigation.CloseSideMenus?.();
                                }
                                catch { /* */ }
                            }
                        }
                        return { msg: launched ? `Pinned build ${it.key} — launching to download it…` : v.text };
                    }, (res) => {
                        // Toast the result too — the panel note isn't visible while you're
                        // on the SteamDB browser page, which is why this felt like "nothing
                        // happened". The toast shows the real outcome (pinned / phantom /
                        // "sign into SteamDB") wherever you are.
                        try {
                            toaster.toast({ title: "SLSDeck — build", body: res.msg });
                        }
                        catch { /* */ }
                        return res.msg;
                    }) }));
            } }));
    };
    const resetLaunchTarget = () => {
        try {
            setLaunchRepoint(appid, null);
            setRepointed(false);
            setNote("Launch target reset (repoint removed; other options kept).");
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
    };
    const run = async (id, fn, describe) => {
        setBusy(id);
        setNote("");
        try {
            setNote(describe((await fn()) || {}));
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const pickProton = async () => {
        setBusy("proton");
        setNote("");
        let tools = [];
        try {
            tools = (await listInstalledProtonTools())?.tools || [];
        }
        catch (e) {
            setNote(`Could not list Proton versions: ${e}`);
            setBusy("");
            return;
        }
        setBusy("");
        if (!tools.length) {
            setNote("No Proton versions found.");
            return;
        }
        // Offer to fetch GE-Proton from here: without it the list is just Valve's
        // built-ins, and GE-Proton is exactly what most fixed/added games need. The
        // backend call existed with no caller, so there was no way to get one.
        const items = [
            { key: "__default__", label: "Steam default", sublabel: "Clear the override for this game" },
            ...tools.map((t) => ({ key: t, label: t, sublabel: t === proton ? "current" : undefined })),
            { key: "__ge__", label: "Install latest GE-Proton…", sublabel: "Downloads from GitHub, then pick it here" },
        ];
        DFL.showModal(SP_JSX.jsx(PickerModal, { title: "Proton version", subtitle: `For AppID ${appid}. Takes effect next launch.`, items: items, onPick: (it) => {
                if (it.key === "__ge__") {
                    run("proton", () => installLatestGeProton(), (r) => r.success
                        ? `${r.tag || "GE-Proton"} installed${r.message ? ` — ${r.message}` : ""}. Open this list again to select it.`
                        : r.error || "Could not install GE-Proton");
                }
                else if (it.key === "__default__") {
                    run("proton", () => removeProtonMapping(appid), (r) => {
                        refreshProton();
                        return r.success ? "Using Steam's default Proton again." : r.error || "Could not clear it";
                    });
                }
                else {
                    run("proton", () => setProtonMapping(appid, it.key, "250"), (r) => {
                        refreshProton();
                        return r.success
                            ? `Proton set to ${it.key}. Relaunch the game for it to apply.`
                            : r.error || "Could not set it";
                    });
                }
            } }));
    };
    const restoreSaves = async () => {
        setBusy("listsaves");
        setNote("");
        let backups = [];
        try {
            backups = (await listGameSaveBackups(appid, ""))?.backups || [];
        }
        catch (e) {
            setNote(`Could not read backups: ${e}`);
            setBusy("");
            return;
        }
        setBusy("");
        if (!backups.length) {
            setNote("No save backups for this game yet — make one first.");
            return;
        }
        DFL.showModal(SP_JSX.jsx(PickerModal, { title: "Restore saves", subtitle: "Pick which backup to restore.", items: backups.map((b) => ({ key: b.path, label: b.when, sublabel: `${b.sizeMB} MB` })), onPick: (it) => {
                // Restoring writes over whatever is in the prefix now, so it is
                // confirmed rather than done on a single tap.
                DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: "Overwrite current saves?", strDescription: `This copies the backup from ${it.label} back into the game's Proton prefix, replacing files that are there now. This cannot be undone.`, strOKButtonText: "Restore", onOK: () => run("restore", () => restoreGameSaves(appid, it.key), (r) => r.success
                        ? `Restored ${(r.restoredFiles || []).length} file(s).`
                        : r.error || "Restore failed") }));
            } }));
    };
    const protonLabel = proton == null ? "checking…" : proton || "Steam default";
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Actions & fixes", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85, padding: "2px 0" }, children: ["Proton: ", SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: protonLabel })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: pickProton, children: busy === "proton" ? "Working…" : "Change Proton version" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("backup", () => backupGameSaves(appid, ""), (r) => r.success
                        ? `Backed up ${r.fileCount} save file(s) to ${r.zipPath}`
                        : r.error || "Backup failed"), children: busy === "backup" ? "Backing up…" : "Back up this game's saves" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: restoreSaves, children: busy === "listsaves" || busy === "restore" ? "Working…" : "Restore saves from a backup" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("repair", () => repairGame(appid), (r) => r.success
                        ? `Repaired: ${(r.steps || []).join(", ") || "nothing needed"}`
                        : r.error || "Repair failed"), children: busy === "repair" ? "Repairing…" : "Repair this game" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("stuck", () => fixStuckUpdate(appid), (r) => r.success ? (r.note || "Depotcache refreshed — retry the update in Steam.") : (r.error || "Couldn't fix the update.")), children: busy === "stuck" ? "Working…" : "Fix stuck update" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "If an update won't finish (a new depot needs a key it doesn't have), this re-deploys the game's manifests/keys so Steam can retry." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: fixLaunchTarget, children: busy === "repoint" ? "Working…" : "Fix launch target (use game's real exe)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: ["If a fix doesn't take effect, point Steam at the game's real Binaries/Win64 executable. Preserves your other launch options.", repointed ? " · Currently repointed." : ""] }) }), repointed && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: resetLaunchTarget, children: "Reset launch target" }) })), (ageSec != null || pinned != null || histCount > 0) && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, padding: "2px 2px" }, children: [ageSec != null ? `Manifest age: ${ageSec < 3600 ? Math.round(ageSec / 60) + "m" : ageSec < 86400 ? Math.round(ageSec / 3600) + "h" : Math.round(ageSec / 86400) + "d"}` : "", pinned != null ? `${ageSec != null ? " · " : ""}${pinned ? "version frozen" : "auto-updates"}` : ""] }) })), pinned != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: toggleFreeze, children: busy === "freeze" ? "Working…" : pinned ? "Unfreeze version (allow updates)" : "Freeze version (block updates)" }) })), histCount > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: openRollback, children: busy === "rollback" ? "Working…" : "Roll back build…" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: openBuildPicker, children: busy === "bp" ? "Working…" : "Install a specific build…" }) }), depotdl && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy || ddlActive, onClick: async () => {
                        await run("ddl", async () => {
                            setNote(".NET / DepotDownloader preparing… first run may download the local .NET runtime.");
                            return depotdlDownloadDlc(appid);
                        }, (r) => r.success ? "Started — downloading content DLC in the background." : (r.error || "Could not start"));
                        await pollDdlOnce();
                        startDdl();
                    }, children: ddlActive && ddl?.op === "dlc" ? "Downloading DLC…" : "Download content DLC (DepotDownloader)" }) })), depotdl && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: async () => {
                        setBusy("bp");
                        let builds = [];
                        try {
                            const r = await bpListBuilds(appid);
                            if (r.success)
                                builds = r.builds.filter((b) => !b.isCurrent);
                        }
                        catch { /* */ }
                        setBusy("");
                        if (!builds.length) {
                            setNote("No older builds on SteamDB for this game.");
                            return;
                        }
                        DFL.showModal(SP_JSX.jsx(PickerModal, { title: "Download a build (files)", subtitle: "Fetches the build's depots via DepotDownloader into the game folder.", items: builds.map((b) => ({ key: b.buildid, label: `Build ${b.buildid}`, sublabel: b.date })), onPick: async (it) => {
                                await run("ddl", async () => {
                                    setNote(".NET / DepotDownloader preparing… first run may download the local .NET runtime.");
                                    return depotdlDownloadBuild(appid, it.key);
                                }, (r) => r.success ? `Started — downloading build ${it.key} in the background.` : (r.error || "Could not start"));
                                await pollDdlOnce();
                                startDdl();
                            } }));
                    }, children: ddlActive && ddl?.op === "build" ? "Downloading build…" : "Download a build's files…" }) })), depotdl && ddl && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", padding: "2px 0" }, children: [SP_JSX.jsxs("div", { style: { fontSize: 12, marginBottom: 4, display: "flex", justifyContent: "space-between" }, children: [SP_JSX.jsxs("span", { children: [ddl.op === "dlc" ? "Content DLC" : "Build", " \u00B7 ", ddl.status] }), SP_JSX.jsx("span", { style: { opacity: 0.8 }, children: ddl.status === "downloading" ? `${ddl.percent || 0}%` : ddl.status === "done" ? "100%" : "" })] }), SP_JSX.jsx("div", { style: { height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }, children: SP_JSX.jsx("div", { style: {
                                    height: "100%",
                                    width: `${ddl.status === "done" ? 100 : ddl.status === "failed" ? 100 : (ddl.percent || 0)}%`,
                                    background: ddl.status === "failed" ? "#d9534f" : ddl.status === "done" ? "#5cb85c" : "#4a90d9",
                                    transition: "width 0.3s",
                                } }) }), ddl.error && (SP_JSX.jsx("div", { style: { fontSize: 11, color: ddl.status === "failed" ? "#f0ad4e" : "#8fbf8f", marginTop: 4, lineHeight: 1.4 }, children: ddl.error })), ddl.status === "done" && !ddl.error && (SP_JSX.jsx("div", { style: { fontSize: 11, color: "#8fbf8f", marginTop: 4 }, children: "Done \u2014 files placed in the game folder. Restart Steam if needed." }))] }) })), steamless?.supported && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: doSteamless, children: busy === "steamless"
                                ? "Working…"
                                : steamless.installed && !steamless.hasStub
                                    ? "SteamStub already removed"
                                    : "Remove SteamStub DRM (Steamless)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Strips Steam's DRM wrapper from the game exe (fixes some SteamStub launch failures / achievement tools). Windows/Proton exes only. Reverted by Un-fix." }) })] })), allowUnlockers && smoke?.supported && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => doSmoke(!smoke.installed), children: busy === "smoke"
                                ? "Working…"
                                : smoke.installed
                                    ? "Remove DLC unlock (SmokeAPI)"
                                    : "Unlock DLC (SmokeAPI)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Emulates DLC ownership in-process for an owned game. Won't work on Ubisoft/EA/Rockstar/Denuvo-SecureDLC/anti-cheat titles. Reverted by Un-fix." }) })] })), allowUnlockers && ["cream", "uplayr1", "uplayr2"].map((kind) => dlcU[kind]?.supported ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => doUnlocker(kind, !dlcU[kind]?.installed), children: busy === `unlock-${kind}`
                        ? "Working…"
                        : dlcU[kind]?.installed
                            ? `Remove ${UNLOCKER_LABEL[kind]}`
                            : `Unlock ${UNLOCKER_LABEL[kind]}` }) }, kind)) : null), allowUnlockers && creamy?.supported && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: doCreamy, children: busy === "creamy"
                                ? "Working…"
                                : creamy.installed
                                    ? "Rebuild native DLC unlock (CreamySteamy)"
                                    : "Compile native DLC unlock (CreamySteamy)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: ["For native-Linux games (libsteam_api.so). Compiles a version-matched DLC-unlock proxy on-device", creamy.haveToolchain ? "" : " — first run downloads a ~45MB compiler", ". Reverted by Un-fix. Experimental."] }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("mp", () => checkMultiplayer(appid), (r) => {
                        setMp(r);
                        return r.success ? `${r.headline}\n\n${r.detail}` : r.error || "Could not check";
                    }), children: busy === "mp" ? "Checking…" : "Will multiplayer work?" }) }), mp?.verdict === "peer" && mp?.fix === "onlinefix" && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("onlinefix", () => patchGameOnlinefix(appid), (r) => {
                        if (!r.success)
                            return r.error || "Could not check this game";
                        const found = r.detectedFixes || [];
                        if (!found.length)
                            return r.message || "No online-fix DLLs found in this game.";
                        return `Found ${found.join(", ")} — set launch options to: ${r.launchOption}`;
                    }), children: busy === "onlinefix" ? "Working…" : "Set up online-fix multiplayer" }) })), note ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ScrollableResult, { text: note, copy: note.length > 120 }) })) : null] }));
}

/**
 * Diagnostics and whole-library maintenance.
 *
 * Engine identity is shown first and deliberately: on stock SLSsteam an added
 * game can never decrypt its depots, and the only symptom is a silent failure
 * to download. Everything else here is a one-tap action that reports what it
 * actually did rather than just toasting "done".
 */
function ToolsSection() {
    const [busy, setBusy] = SP_REACT.useState("");
    const [engine, setEngine] = SP_REACT.useState(null);
    const [note, setNote] = SP_REACT.useState("");
    // The health check used to report "fixable: a, b, c" and then offer no way to
    // fix any of it. auto_repair_system existed the whole time with no caller.
    const [repairable, setRepairable] = SP_REACT.useState([]);
    SP_REACT.useEffect(() => {
        engineIsMoon().then((r) => setEngine(r || null)).catch(() => { });
    }, []);
    const run = async (id, fn, describe) => {
        setBusy(id);
        setNote("");
        try {
            setNote(describe((await fn()) || {}));
        }
        catch (e) {
            setNote(`Failed: ${e}`);
        }
        setBusy("");
    };
    const appid = currentLibraryAppId();
    const engineOk = engine && engine.moon;
    const engineText = engine == null
        ? "checking…"
        : engine.installed
            ? engineOk
                ? "slsteam-moon (correct)"
                : "stock SLSsteam — added games cannot download"
            : "not installed";
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Tools & Diagnostics", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85, padding: "2px 0" }, children: ["Engine:", " ", SP_JSX.jsx("span", { style: {
                                color: engine == null ? "inherit" : engineOk ? "#47c87c" : "#e5533c",
                                fontWeight: 600,
                            }, children: engineText })] }) }), !engineOk && engine != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("engine", () => ensureMoonEngine(), (r) => r.changed ? "Reinstalled slsteam-moon — restart Steam." : r.error || "No change"), children: busy === "engine" ? "Installing engine…" : "Install the correct engine" }) })), appid != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("check", async () => {
                        const p = await downloadPreflight(appid);
                        if (p && p.ready === false)
                            return { kind: "pre", p };
                        return { kind: "diag", d: await downloadDiagnosis(appid) };
                    }, (r) => r.kind === "pre"
                        ? `Not ready: ${(r.p.failed || []).join(", ")}`
                        : (r.d && r.d.summary) || "No install attempt recorded yet"), children: busy === "check" ? "Checking…" : "Why won't this game download?" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("prov", () => provisionDepots(), (r) => `Re-applied ${(r.keys || {}).written || 0} depot key(s), ${r.manifestsCopied || 0} manifest(s)`), children: busy === "prov" ? "Re-applying…" : "Re-apply depot keys" }) }), appid != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("phantom", () => clearPhantomInstall(appid), (r) => r.cleared ? "Cleared — Steam will offer to install again." : "Nothing to clear."), children: busy === "phantom" ? "Clearing…" : 'Fix "installed" but empty' }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("storage", () => getStorageInfo(), (r) => {
                        const l = r.libraries || r.drives || [];
                        return l.length
                            ? l.map((d) => `${d.label || d.path}: ${d.freeGB ?? "?"} GB free`).join(" · ")
                            : "No libraries found";
                    }), children: busy === "storage" ? "Reading…" : "Show drive space" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("clean", () => cleanTempDownloads(), (r) => `Freed ${r.cleanedMB ?? 0} MB from ${r.cleanedFiles ?? 0} temp file(s)`), children: busy === "clean" ? "Cleaning…" : "Clean temporary download files" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("art", () => syncAllAddedArt(false), (r) => `Artwork synced for ${r.synced ?? r.count ?? 0} game(s)`), children: busy === "art" ? "Fetching artwork…" : "Fetch missing library artwork" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("audit", () => runSystemAudit(), (r) => {
                        const codes = r.repairableCodes || [];
                        setRepairable(codes);
                        return `Health ${r.healthScore ?? "?"}%${codes.length ? " — fixable: " + codes.join(", ") : " — nothing to repair"}`;
                    }), children: busy === "audit" ? "Checking…" : "Run health check" }) }), repairable.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("repair", () => autoRepairSystem(), (r) => {
                        const done = r.repairsDone || r.repairs || [];
                        const errs = r.errors || [];
                        if (done.length)
                            setRepairable([]);
                        return done.length
                            ? `Repaired ${done.length} item(s): ${done.join("; ")}${errs.length ? ` — ${errs.length} still failing` : ""}`
                            : errs.length
                                ? `Could not repair: ${errs.join("; ")}`
                                : "Nothing needed repairing.";
                    }), children: busy === "repair" ? "Repairing…" : `Repair what the check found (${repairable.length})` }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("conflicts", () => repairConflicts(), (r) => {
                        const rm = r.removed || [];
                        const notes = r.notes || [];
                        if (!rm.length && !notes.length)
                            return "No conflicts found (Millennium / system slssteam).";
                        return [rm.length ? `Removed: ${rm.join(", ")}` : "", ...notes]
                            .filter(Boolean)
                            .join(" · ");
                    }), children: busy === "conflicts" ? "Repairing…" : "Repair engine conflicts (Millennium / system slssteam)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("backup", () => createBackup("", false, true), (r) => r.success ? `Backup saved to ${r.path}` : r.error || "Backup failed"), children: busy === "backup" ? "Backing up…" : "Back up my added games" }) }), note ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                        fontSize: 11,
                        opacity: 0.8,
                        lineHeight: 1.4,
                        padding: "2px 0",
                        wordBreak: "break-word",
                    }, children: note }) })) : null] }));
}

function Chip$1({ ok, label }) {
    return (SP_JSX.jsxs("span", { style: {
            display: "inline-block",
            padding: "1px 8px",
            marginRight: 6,
            borderRadius: 10,
            fontSize: 11,
            background: ok ? "rgba(88,197,120,0.18)" : "rgba(245,166,35,0.18)",
            color: ok ? "#58c578" : "#f5a623",
        }, children: [ok ? "✓ " : "• ", label] }));
}
/**
 * Compact SLSsteam block for the quick-access panel: status chips + setup.
 * First-time setup remains available while the engine is missing. Once the
 * engine is installed, the whole block is hidden on library game pages so the
 * SLSsteam title / Installed / Injected chips / Reinstall control do not sit
 * above the per-game actions. Outside a game page the maintenance block remains.
 */
function SlsSteamCompact() {
    const [status, setStatus] = SP_REACT.useState(null);
    const [inst, setInst] = SP_REACT.useState(null);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [showReinstall, setShowReinstall] = SP_REACT.useState(false);
    const [sys, setSys] = SP_REACT.useState(null);
    const [qmsg, setQmsg] = SP_REACT.useState("");
    const poll = SP_REACT.useRef(null);
    const refresh = async () => {
        try {
            setStatus(await getSlssteamStatus());
        }
        catch { /* */ }
        try {
            const s = await systemStatus();
            if (s.success)
                setSys(s);
        }
        catch { /* */ }
    };
    SP_REACT.useEffect(() => {
        refresh();
        getShowReinstallQam().then((r) => setShowReinstall(!!r.enabled)).catch(() => { });
        return () => { if (poll.current)
            clearInterval(poll.current); };
    }, []);
    // Wait for a running SLSsteam install to finish (poll its status).
    const waitInstall = () => new Promise((resolve) => {
        const iv = setInterval(async () => {
            try {
                const st = await getSlssteamInstallStatus();
                setInst(st.state || null);
                const s = st.state?.status;
                if (s === "done" || s === "failed") {
                    clearInterval(iv);
                    resolve(s === "done");
                }
            }
            catch { /* keep polling */ }
        }, 1500);
    });
    // One-tap onboarding: install/verify the engine, run the client fix, then
    // install CloudRedirect. This button exists only while the engine is missing.
    const quickInstall = async () => {
        setBusy(true);
        setInst(null);
        try {
            const s = await systemStatus();
            if (s.success && (s.foreignEngine || (s.engineInstalled && s.engine !== "slsteam-moon"))) {
                setQmsg(`Clearing conflicting engine (${s.foreignName || s.engine})…`);
                try {
                    const d = await disableForeignEngines();
                    if (d.success && (d.disabled || []).length)
                        setQmsg(`Disabled ${d.foreignName || "engine"}. Installing slsteam-moon…`);
                }
                catch { /* best-effort */ }
            }
            if (!s.engineInstalled || (s.engineInstalled && s.engine !== "slsteam-moon")) {
                setQmsg("Installing slsteam-moon…");
                const r = await installSlssteam();
                if (!r.success) {
                    const m = r.missingDeps?.length ? `Cannot unpack: ${r.missingDeps.join(", ")}` : (r.error || "SLSsteam install failed");
                    setInst({ status: "failed", error: m });
                    setBusy(false);
                    return;
                }
                const ok = await waitInstall();
                if (!ok) {
                    setBusy(false);
                    return;
                }
                setQmsg("Applying client fix…");
                try {
                    await runClientFix();
                }
                catch { /* best-effort */ }
            }
            else {
                setQmsg("slsteam-moon already installed.");
            }
            setQmsg("Installing CloudRedirect in the background (cloud saves)…");
            crEnsureInstalled().catch(() => { });
            setQmsg("SLSDeck is set up. Reload Steam to finish. (CloudRedirect finishes in the background.)");
            toaster.toast({ title: "SLSDeck", body: "SLSDeck set up" });
            refresh();
            setTimeout(() => reloadSteam().catch(() => { }), 3000);
        }
        catch (e) {
            setQmsg(`Setup error: ${e}`);
        }
        setBusy(false);
    };
    const watch = () => {
        if (poll.current)
            clearInterval(poll.current);
        poll.current = setInterval(async () => {
            try {
                const st = await getSlssteamInstallStatus();
                setInst(st.state || null);
                const s = st.state?.status;
                if (s === "done" || s === "failed") {
                    if (poll.current)
                        clearInterval(poll.current);
                    setBusy(false);
                    refresh();
                    if (s === "done") {
                        toaster.toast({ title: "SLSDeck", body: "SLSsteam installed" });
                        if (st.state?.installed)
                            setTimeout(() => reloadSteam(), 3000);
                    }
                    else {
                        toaster.toast({ title: "SLSDeck", body: st.state?.error || "Failed" });
                    }
                }
            }
            catch { /* keep polling */ }
        }, 1500);
    };
    const install = async () => {
        setBusy(true);
        setInst({ status: "queued" });
        try {
            const r = await installSlssteam();
            if (!r.success) {
                const msg = r.missingDeps?.length
                    ? `Cannot unpack: ${r.missingDeps.join(", ")}`
                    : r.error || "Could not start install";
                setBusy(false);
                setInst({ status: "failed", error: msg });
                toaster.toast({ title: "SLSDeck", body: msg });
                return;
            }
            toaster.toast({ title: "SLSDeck", body: "Installing… (a few min)" });
            watch();
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            setBusy(false);
            setInst({ status: "failed", error: `Install error: ${msg}` });
        }
    };
    const working = busy || inst?.status === "running" || inst?.status === "queued";
    const onGamePage = currentLibraryAppId() != null;
    const showReinstallButton = !!status?.installed && (!onGamePage || showReinstall);
    // On an actual game page the installed engine is global plumbing, not a
    // per-game action. Hide the entire maintenance/status section there; repair
    // warnings still come from RepairBanner and missing-engine onboarding still
    // appears so a fresh install remains possible.
    if (onGamePage && status?.installed && !working)
        return null;
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "SLSsteam", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "2px 0" }, children: [SP_JSX.jsx(Chip$1, { ok: !!status?.installed, label: "Installed" }), SP_JSX.jsx(Chip$1, { ok: !!status?.injected, label: "Injected" })] }) }), working && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85, padding: "2px 0" }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 14, height: 14, marginRight: 8 } }), inst?.status === "queued" ? "Starting…" : "Installing…", typeof inst?.percent === "number" && inst.percent > 0 ? ` ${inst.percent}%` : ""] }) })), inst?.status === "failed" && inst?.error && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, color: "#f5a623", whiteSpace: "pre-wrap", wordBreak: "break-word" }, children: inst.error }) })), sys?.foreignEngine && !status?.installed && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, color: "#f5a623", padding: "0 2px" }, children: ["Detected ", sys.foreignName || "another engine", " \u2014 Install will disable it (reversibly) and set up slsteam-moon."] }) })), !working && !status?.installed && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: quickInstall, children: "Install SLSDeck (one-tap setup)" }) })), !working && !status?.installed && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: ["Installs slsteam-moon", sys?.foreignEngine ? " (disabling any other engine first)" : "", " + CloudRedirect and applies the client fix, in order."] }) })), !working && showReinstallButton && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: install, children: "Reinstall SLSsteam" }) })), qmsg ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.8, padding: "0 2px", whiteSpace: "pre-wrap" }, children: qmsg }) })) : null] }));
}

// Pick one of the user's added games. Resolves the chosen {appid,name} or null
// if the modal is dismissed without a pick.
function GamePickerModal({ closeModal, onResult, }) {
    const [apps, setApps] = SP_REACT.useState([]);
    const [picked, setPicked] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        getInstalledApps()
            .then((r) => r.success && setApps((r.apps || []).map((a) => ({ appid: Number(a.appid), name: a.name || String(a.appid) }))))
            .catch(() => { });
    }, []);
    const close = () => { if (!picked)
        onResult(null); closeModal?.(); };
    return (SP_JSX.jsxs(DFL.ModalRoot, { closeModal: close, children: [SP_JSX.jsx("div", { style: { fontSize: 18, fontWeight: 600, marginBottom: 8 }, children: "Which game is this for?" }), SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.7, marginBottom: 10 }, children: "Pick the game this file should be bound to." }), SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: 6, maxHeight: "56vh", overflowY: "scroll" }, children: [apps.length === 0 && SP_JSX.jsx("div", { style: { opacity: 0.6, fontSize: 12 }, children: "No added games found." }), apps.map((a) => (SP_JSX.jsxs(DFL.DialogButton, { style: { textAlign: "left", padding: "8px 10px" }, onClick: () => { setPicked(true); onResult(a); closeModal?.(); }, children: [SP_JSX.jsx("div", { style: { fontSize: 14 }, children: a.name }), SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6 }, children: ["AppID ", a.appid] })] }, a.appid)))] })] }));
}
function pickGame() {
    return new Promise((resolve) => {
        DFL.showModal(SP_JSX.jsx(GamePickerModal, { onResult: resolve }));
    });
}
function confirmRoute(actualKind) {
    const asWhat = actualKind === "manifest" ? "custom manifest / lua" : "custom fix";
    return new Promise((resolve) => {
        DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: "Different file type detected", strDescription: `This looks like a ${actualKind === "manifest" ? "manifest / lua file" : "game fix (exe/dll)"}. Import it as a ${asWhat} instead?`, strOKButtonText: "Import correctly", strCancelButtonText: "Cancel", onOK: () => resolve(true), onCancel: () => resolve(false) }));
    });
}
/**
 * Full import flow: pick a file, auto-detect fix vs manifest (confirm if it
 * differs from the tab it was launched from), pick the target game, import.
 * Returns a human-readable result string ("" if the user cancelled).
 */
async function importCustomFlow(expected) {
    let path = "";
    try {
        const res = await openFilePicker(0 /* FileSelectionType.FILE */, "/home/deck/Downloads", true, true);
        path = res?.realpath || res?.path || "";
    }
    catch {
        return "";
    }
    if (!path)
        return "";
    let kind = expected;
    try {
        const c = await customClassify(path);
        if (c.success && c.kind)
            kind = c.kind;
    }
    catch {
        /* keep expected */
    }
    if (kind !== expected) {
        const ok = await confirmRoute(kind);
        if (!ok)
            return "";
    }
    const app = await pickGame();
    if (!app)
        return "";
    try {
        const r = await customImport(app.appid, path, kind);
        if (!r.success)
            return r.error || "Import failed.";
        if (kind === "manifest") {
            return `Imported manifest for ${app.name}${r.activated ? " (activated)" : ""}. It'll show in the Download tab list.`;
        }
        return `Imported custom fix for ${app.name}. It'll show as a "Custom fix" button in that game's Fixes menu.`;
    }
    catch (e) {
        return `Import failed: ${e}`;
    }
}

// Imported custom manifests / lua files, grouped by game — mirrors the
// "Applied fixes" list style in the Fixes tab.
function CustomManifestsPanel() {
    const [games, setGames] = SP_REACT.useState([]);
    const load = () => customListAllManifests().then((r) => setGames(r.success ? (r.games || []) : [])).catch(() => { });
    SP_REACT.useEffect(() => { load(); }, []);
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Custom manifests / lua", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => {
                        const msg = await importCustomFlow("manifest");
                        if (msg)
                            toaster.toast({ title: "SLSDeck", body: msg });
                        load();
                    }, children: "Import manifest / lua\u2026" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Pick a .lua or .manifest and the game it's for. A .lua is copied into SLSsteam's stplug-in so the engine loads it. If the file is actually a fix, you'll be offered to import it as a custom fix instead." }) }), games.map((g) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", padding: "2px 2px" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: g.name || `AppID ${g.appid}` }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: [g.count, " file", g.count === 1 ? "" : "s", " \u00B7 ", g.items.map((i) => i.label).join(", ")] })] }) }, g.appid))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: "Delete all custom manifests?", strDescription: "Removes every imported .lua/.manifest from ~/.local/share/SLSDeck/custom_manifests. Luas already copied into stplug-in stay active until you remove the game.", strOKButtonText: "Delete", onOK: async () => {
                            const r = await customDeleteManifests(0);
                            toaster.toast({ title: "SLSDeck", body: r.success ? "Custom manifests cleared" : r.error || "Failed" });
                            load();
                        } })), children: "Delete custom manifests" }) })] }));
}
function AddGameSection({ onChanged, refreshToken = 0, showInstalled = true }) {
    const [query, setQuery] = SP_REACT.useState("");
    const [results, setResults] = SP_REACT.useState([]);
    const [searching, setSearching] = SP_REACT.useState(false);
    const [activeAppId, setActiveAppId] = SP_REACT.useState(null);
    const [activeName, setActiveName] = SP_REACT.useState("");
    const [state, setState] = SP_REACT.useState(null);
    const pollRef = SP_REACT.useRef(null);
    const searchTimer = SP_REACT.useRef(null);
    SP_REACT.useEffect(() => {
        return () => {
            if (pollRef.current)
                clearInterval(pollRef.current);
            if (searchTimer.current)
                clearTimeout(searchTimer.current);
        };
    }, []);
    const runSearch = (value) => {
        setQuery(value);
        if (searchTimer.current)
            clearTimeout(searchTimer.current);
        const trimmed = value.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        // Pure numeric input is treated as a direct AppID.
        if (/^\d+$/.test(trimmed)) {
            setResults([{ appid: parseInt(trimmed, 10), name: `AppID ${trimmed}` }]);
            return;
        }
        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await searchGames(trimmed, 15);
                setResults(res.success ? res.results : []);
            }
            catch {
                setResults([]);
            }
            finally {
                setSearching(false);
            }
        }, 400);
    };
    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };
    const beginAdd = async (appid, name) => {
        setActiveAppId(appid);
        setActiveName(name);
        setState({ status: "queued" });
        try {
            const res = await startAdd(appid);
            if (!res.success) {
                toaster.toast({ title: "SLSDeck", body: res.error || "Failed to start" });
                setState({ status: "failed", error: res.error });
                return;
            }
        }
        catch (e) {
            setState({ status: "failed", error: String(e) });
            return;
        }
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const res = await getAddStatus(appid);
                if (!res.success)
                    return;
                setState(res.state);
                const status = res.state.status;
                if (status === "done") {
                    stopPolling();
                    const live = !!res.state.liveReady;
                    toaster.toast({
                        title: "SLSDeck",
                        body: live
                            ? `Added ${name} — available in Steam without restart`
                            : `Added ${name} — restart Steam to finish provisioning`,
                    });
                    onChanged();
                }
                else if (status === "failed") {
                    stopPolling();
                    toaster.toast({ title: "SLSDeck", body: res.state.error || "Failed" });
                }
                else if (status === "cancelled") {
                    stopPolling();
                }
            }
            catch {
                /* keep polling */
            }
        }, 800);
    };
    const onCancel = async () => {
        if (activeAppId != null)
            await cancelAdd(activeAppId);
        stopPolling();
        setState((s) => ({ ...(s || {}), status: "cancelled" }));
    };
    const busy = !!state && (IN_PROGRESS.has(state.status || "") || state.status === "reconciling");
    const statusLabel = () => {
        if (!state)
            return "";
        switch (state.status) {
            case "queued":
                return "Queued…";
            case "checking":
                return `Checking source${state.currentApi ? ` (${state.currentApi})` : ""}…`;
            case "downloading":
                return `Downloading ${formatBytes(state.bytesRead)}${state.totalBytes ? ` / ${formatBytes(state.totalBytes)}` : ""}`;
            case "processing":
                return "Processing archive…";
            case "installing":
                return "Installing Lua script…";
            case "reconciling":
                return "Refreshing Steam ownership and app info…";
            case "done":
                return state.api
                    ? `Installed ✓ · source: ${state.api}${state.manifest === false ? " (no manifest found)" : ""}`
                    : "Installed ✓";
            case "failed":
                return `Failed: ${state.error || "unknown"}`;
            case "cancelled":
                return "Cancelled";
            default:
                return state.status || "";
        }
    };
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Add a game", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Search by name or AppID", value: query, onChange: (e) => runSearch(e.target.value) }) }), searching && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), " Searching\u2026"] }) })), !busy && !searching && results.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Focusable, { style: {
                                display: "flex",
                                flexDirection: "column",
                                maxHeight: "46vh",
                                overflowY: "auto",
                                border: "1px solid rgba(255,255,255,0.14)",
                                borderRadius: 6,
                                background: "rgba(0,0,0,0.22)",
                                marginTop: 2,
                            }, children: results.slice(0, 20).map((r, i) => (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", bottomSeparator: i === Math.min(results.length, 20) - 1 ? "none" : "standard", onClick: () => beginAdd(r.appid, r.name), children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: r.name }), SP_JSX.jsx("span", { style: { fontSize: 11, opacity: 0.55, marginLeft: 8, flex: "0 0 auto" }, children: r.appid })] }) }, r.appid))) }) })), state && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "6px 0", fontSize: 13 }, children: [SP_JSX.jsx("div", { style: { fontWeight: 600 }, children: activeName || activeAppId }), SP_JSX.jsx("div", { style: { opacity: 0.8 }, children: statusLabel() }), state.status === "done" && state.liveReady && (SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, marginTop: 4 }, children: ["Steam live refresh confirmed", state.liveGeneration ? ` · generation ${state.liveGeneration}` : ""] })), state.status === "done" && !state.liveReady && state.liveReason && (SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, marginTop: 4 }, children: ["Restart fallback: ", state.liveReason] })), state.contentCheckResult && state.status === "done" && (SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, marginTop: 4 }, children: ["Workshop: ", state.contentCheckResult.workshop, state.contentCheckResult.dlc &&
                                            ` · DLC included: ${state.contentCheckResult.dlc.included.length}, missing: ${state.contentCheckResult.dlc.missing.length}`] }))] }) })), busy && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onCancel, children: "Cancel" }) }))] }), showInstalled && SP_JSX.jsx(InstalledSection, { refreshToken: refreshToken, onChanged: onChanged }), SP_JSX.jsx(CustomManifestsPanel, {})] }));
}

const CR_FLATPAK$1 = "org.cloudredirect.CloudRedirect";
async function applyArtwork(appId) {
    const SC = window.SteamClient;
    if (!SC?.Apps)
        return;
    try {
        const a = await crArtwork();
        if (a?.success && SC.Apps.SetCustomArtworkForApp) {
            const jobs = [
                [a.cover, 0],
                [a.hero, 1],
                [a.capsule, 3],
                [a.logo, 2],
            ];
            for (const [b64, kind] of jobs) {
                if (!b64)
                    continue;
                try {
                    await SC.Apps.SetCustomArtworkForApp(appId, b64, "png", kind);
                }
                catch { /* best effort */ }
            }
        }
    }
    catch { /* best effort */ }
    try {
        const ic = await crIconPath();
        if (ic?.success && ic.path && SC.Apps.SetShortcutIcon) {
            await SC.Apps.SetShortcutIcon(appId, ic.path);
        }
    }
    catch { /* best effort */ }
}
/** Ensure the provider-login UI has a Steam shortcut and native-looking art.
 * Creates it when missing; otherwise rebinds the existing shortcut in place.
 */
async function ensureCloudRedirectShortcut(launch = false) {
    const SC = window.SteamClient;
    if (!SC?.Apps)
        throw new Error("SteamClient unavailable");
    let appId = 0;
    try {
        const g = await crGetShortcut();
        appId = Number(g?.appId || 0);
    }
    catch { /* create below */ }
    if (appId) {
        try {
            const ov = window.appStore?.GetAppOverviewByAppID?.(appId);
            if (!ov)
                appId = 0;
        }
        catch {
            appId = 0;
        }
    }
    if (!appId) {
        if (!SC.Apps.AddShortcut)
            throw new Error("Steam shortcut API unavailable");
        const created = await SC.Apps.AddShortcut("CloudRedirect", "/usr/bin/flatpak", "", "");
        appId = Number(created);
        if (!appId || Number.isNaN(appId))
            throw new Error("AddShortcut returned no appId");
    }
    try {
        await SC.Apps.SetShortcutLaunchOptions(appId, `run --user ${CR_FLATPAK$1}`);
    }
    catch { /* best effort */ }
    try {
        await SC.Apps.SetShortcutName(appId, "CloudRedirect");
    }
    catch { /* best effort */ }
    try {
        await crSetShortcut(appId);
    }
    catch { /* best effort */ }
    await applyArtwork(appId);
    if (launch) {
        if (!SC.Apps.RunGame)
            throw new Error("Steam launch API unavailable");
        const gameId = ((BigInt(appId) << 32n) | 0x02000000n).toString();
        SC.Apps.RunGame(gameId, "", -1, 100);
    }
    return appId;
}
/** Historical name kept for callers. It now creates the login shortcut when it
 * does not exist, then rebinds artwork/launch metadata when it does.
 */
async function rebindExistingCloudRedirectShortcut() {
    try {
        await ensureCloudRedirectShortcut(false);
        return true;
    }
    catch {
        return false;
    }
}

function Dot({ health }) {
    const color = health === "ok" ? "#58c578" : health === "warn" ? "#f5a623" : health === "off" ? "#c85c5c" : "#8b929a";
    return (SP_JSX.jsx("span", { style: {
            display: "inline-block", width: 9, height: 9, borderRadius: 9,
            marginRight: 8, flex: "0 0 auto", background: color,
        } }));
}
function DepRow({ label, hint, health, statusText, busy = false, actionLabel, onAction, }) {
    return (SP_JSX.jsxs("div", { style: { padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center" }, children: [SP_JSX.jsx(Dot, { health: busy ? "unknown" : health }), SP_JSX.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600 }, children: label }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: busy ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 11, height: 11, marginRight: 6 } }), "working\u2026"] })) : statusText })] })] }), hint && SP_JSX.jsx("div", { style: { fontSize: 10.5, opacity: 0.55, margin: "2px 0 4px 17px" }, children: hint }), actionLabel && onAction && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onAction, disabled: busy, children: actionLabel }) }))] }));
}
/**
 * Setup & Dependencies. First run installs SLSsteam; afterwards each component
 * shows its own health and can be reinstalled individually.
 */
function DependenciesSection() {
    const [sls, setSls] = SP_REACT.useState(null);
    const [sysSt, setSysSt] = SP_REACT.useState(null);
    const [diag, setDiag] = SP_REACT.useState("");
    const [busy, setBusy] = SP_REACT.useState({});
    const [note, setNote] = SP_REACT.useState({});
    const pollRef = SP_REACT.useRef(null);
    const crAuto = SP_REACT.useRef(false);
    const setB = (id, v) => setBusy((b) => ({ ...b, [id]: v }));
    const setN = (id, v) => setNote((n) => ({ ...n, [id]: v }));
    const refresh = async () => {
        try {
            setSls(await getSlssteamStatus());
        }
        catch { /* */ }
        try {
            const s = await systemStatus();
            if (s.success)
                setSysSt(s);
        }
        catch { /* */ }
    };
    const disableForeign = async () => {
        setB("foreign", true);
        setN("foreign", "Disabling other engine…");
        try {
            const d = await disableForeignEngines();
            setN("foreign", d.success ? `Disabled ${(d.disabled || []).join(", ") || "engine"}. Reload Steam.` : "Nothing to disable.");
            if (d.success && (d.disabled || []).length) {
                toaster.toast({ title: "SLSDeck", body: "Other engine disabled" });
                setTimeout(() => reloadSteam().catch(() => { }), 1500);
            }
        }
        catch (e) {
            setN("foreign", `Error: ${e}`);
        }
        setB("foreign", false);
        refresh();
    };
    SP_REACT.useEffect(() => {
        refresh();
        return () => { if (pollRef.current)
            clearInterval(pollRef.current); };
    }, []);
    // CloudRedirect installs itself automatically once SLSsteam is set up. Runs
    // at most once (the flatpak + KDE runtime are heavy).
    SP_REACT.useEffect(() => {
        if (!sls?.installed || crAuto.current)
            return;
        crAuto.current = true;
        (async () => {
            setB("cr", true);
            setN("cr", "installing in background… (first run is slow)");
            try {
                const r = await crEnsureInstalledAuto();
                setN("cr", r.installed
                    ? "installed"
                    : r.capped
                        ? (r.log || "auto-install off — use Reinstall")
                        : "will retry — " + (r.log || "check network"));
            }
            catch (e) {
                setN("cr", `install failed: ${e}`);
            }
            setB("cr", false);
        })();
    }, [sls?.installed]);
    const watch = (id, doneMsg, restart) => {
        if (pollRef.current)
            clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const st = await getSlssteamInstallStatus();
                const state = st.state || {};
                const s = state.status;
                setN(id, s === "running" ? `installing… ${state.percent ? state.percent + "%" : ""}` : (s || ""));
                if (s === "done" || s === "failed") {
                    if (pollRef.current)
                        clearInterval(pollRef.current);
                    if (s === "done") {
                        setN(id, "done");
                        toaster.toast({ title: "SLSDeck", body: doneMsg });
                        if (restart && state.installed)
                            setTimeout(() => reloadSteam(), 3000);
                    }
                    else {
                        setN(id, state.error || "failed");
                        toaster.toast({ title: "SLSDeck", body: state.error || "Failed" });
                    }
                    setB(id, false);
                    refresh();
                }
            }
            catch { /* keep polling */ }
        }, 1500);
    };
    const installSls = async () => {
        setB("sls", true);
        setN("sls", "starting…");
        try {
            const r = await installSlssteam();
            if (!r.success) {
                const msg = r.missingDeps?.length ? `Missing: ${r.missingDeps.join(", ")}` : r.error || "Could not start";
                setN("sls", msg);
                setB("sls", false);
                toaster.toast({ title: "SLSDeck", body: msg });
                return;
            }
            toaster.toast({ title: "SLSDeck", body: "Installing… (a few minutes)" });
            watch("sls", "SLSsteam installed — restarting Steam…", true);
        }
        catch (e) {
            setN("sls", `error: ${e}`);
            setB("sls", false);
        }
    };
    const runFix = async () => {
        setB("fix", true);
        setN("fix", "starting…");
        try {
            // Manual button = always FORCE the full headcrab downgrade, bypassing the
            // "already fine?" skip gate (which can wrongly skip and make the button
            // look like it does nothing). The cheap auto-skip stays on the boot path.
            const r = await runClientFix(true);
            if (!r.success) {
                setN("fix", r.error || "failed");
                setB("fix", false);
                return;
            }
            watch("fix", "Client fix done — reboot the Deck", false);
        }
        catch (e) {
            setN("fix", `error: ${e}`);
            setB("fix", false);
        }
    };
    const installCloud = async () => {
        setB("cr", true);
        setN("cr", "replacing CloudRedirect…");
        try {
            const r = await crEnsureInstalled();
            if (r.installed) {
                const rebound = await rebindExistingCloudRedirectShortcut();
                setN("cr", rebound ? "installed · shortcut rebound" : "installed");
            }
            else {
                setN("cr", "failed — " + (r.log || "check network"));
            }
            toaster.toast({ title: "SLSDeck", body: r.installed ? "CloudRedirect replaced" : "CloudRedirect install failed" });
        }
        catch (e) {
            setN("cr", `error: ${e}`);
        }
        setB("cr", false);
    };
    const doActivate = async () => {
        try {
            const r = await activateInjection();
            toaster.toast({ title: "SLSDeck", body: r.success ? "Injection on — reload Steam" : r.error || "Failed" });
            refresh();
            if (r.success)
                setTimeout(() => reloadSteam(), 1500);
        }
        catch (e) {
            toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
        }
    };
    const doDeactivate = async () => {
        try {
            const r = await deactivateInjection();
            toaster.toast({ title: "SLSDeck", body: r.success ? "Injection off — reload Steam" : r.error || "Failed" });
            refresh();
            if (r.success)
                setTimeout(() => reloadSteam(), 1500);
        }
        catch (e) {
            toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
        }
    };
    const runRefreshPatterns = async () => {
        setDiag("Refreshing engine patterns against the current Steam client…");
        try {
            const r = await refreshPatterns();
            const lines = [
                `pattern-refresh: ${r.present ? "installed" : "NOT INSTALLED"}`,
                r.present ? `helper:          ${r.helperPath}` : "",
                `client build:    ${r.clientVersion}`,
                `supported build: ${r.supportedClient}${r.clientMatches === false ? "  ← MISMATCH (downgrade didn't hold)" : r.clientMatches === true ? "  (match)" : ""}`,
                r.returncode !== undefined ? `exit code:       ${r.returncode}` : "",
                ``,
                r.message || "",
                ...(r.output && r.output.length ? ["", "— pattern-refresh output —", ...r.output] : []),
            ].filter((x) => x !== "");
            setDiag(lines.join("\n"));
            toaster.toast({ title: "SLSDeck", body: r.success ? "Patterns refreshed — restart Steam" : (r.present ? "Refresh ran with issues — see details" : "pattern-refresh not installed") });
        }
        catch (e) {
            setDiag(`Error: ${e}`);
        }
    };
    const runDiag = async () => {
        try {
            const d = await getDiagnostics();
            const live = d.injectionLive === true ? "yes (live this session)"
                : d.injectionLive === false ? "no (not loaded this boot)" : "unknown";
            const osName = d.osRelease?.PRETTY_NAME || d.steamOSChannel || "unknown";
            setDiag([
                `Engine:         ${d.engine || "?"}${d.engineMoon ? "" : "  (no version-pin / depot-key support)"}`,
                `Injection live: ${live}`,
                `Pinning:        ${d.pinSupported ? "supported (moon)" : "unsupported (stock SLSsteam)"}`,
                `Achievements:   see Options — live only on moon`,
                ``,
                `SLSsteam.so:    ${d.hasSLSsteamSo ? "installed" : "MISSING"}`,
                `steam.sh wrap:  ${d.steamShWrapped ? "yes" : "no"}`,
                `gamescope hook: ${d.gamescopeHookActive ? "active" : "inactive"}`,
                `flatpak Steam:  ${d.flatpak ? "yes" : "no"}`,
                `Steam root:     ${d.steamRoot || "?"}`,
                `OS:             ${osName}`,
                `user / root:    ${d.user || "?"}${d.runningAsRoot ? " (running as root)" : ""}`,
                `AdditionalApps: ${(d.additionalApps || []).length} added${(d.additionalApps || []).length ? ` — ${(d.additionalApps || []).join(", ")}` : ""}`,
                `SLSsteam.log:   ${d.slssteamLogExists ? `yes (${d.slssteamLogAgeSec}s ago, ${d.slssteamLogModified || "?"})` : "MISSING — not loaded"}`,
                `h3adcr-b log:   ${d.headcrabRunLogExists ? "present" : "none"}`,
                ``,
                `— recent SLSsteam.log —`,
                ...((d.slssteamLogTail || []).map((l) => `  | ${l}`)),
            ].join("\n"));
        }
        catch (e) {
            setDiag(`error: ${e}`);
        }
    };
    const setupDone = !!sls?.installed && !!sls?.injected;
    const slsHealth = sls?.installed ? (sls.injected ? "ok" : "warn") : "off";
    const slsBusy = !!busy.sls;
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Setup", children: [sysSt?.foreignEngine && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { margin: "2px 0 6px", padding: "8px 10px", borderRadius: 6, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.4)" }, children: [SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#f5a623" }, children: "Another engine detected" }), SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.8, margin: "2px 0 6px" }, children: [sysSt.foreignName || "A different engine", " is present alongside slsteam-moon and can fight over injection. Disable it (reversibly) so SLSDeck's engine runs cleanly."] }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy.foreign, onClick: disableForeign, children: busy.foreign ? "Disabling…" : `Disable ${sysSt.foreignName || "other engine"}` }), note.foreign ? SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, marginTop: 4 }, children: note.foreign }) : null] }) })), !setupDone && !slsBusy && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: installSls, children: "Install SLSsteam" }) })), slsBusy && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 13, height: 13, marginRight: 8 } }), note.sls || "installing…"] }) })), SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DepRow, { label: "SLSsteam", hint: "Core steamclient hook that adds games to your library.", health: slsHealth, statusText: sls?.installed ? (sls.injected ? "installed · injected" : "installed · not injected") : "not installed", busy: slsBusy, actionLabel: sls?.installed ? "Reinstall SLSsteam" : "Install SLSsteam", onAction: installSls }), SP_JSX.jsx(DepRow, { label: "Steam client fix", hint: "Pins the Steam client to a version SLSsteam supports (h3adcr-b).", health: busy.fix ? "unknown" : sls?.clientFixRan ? "ok" : "warn", statusText: note.fix || (sls?.clientFixRan ? "applied" : "not run yet — run if games don't appear"), busy: !!busy.fix, actionLabel: "Run client fix", onAction: runFix }), SP_JSX.jsx(DepRow, { label: "CloudRedirect", hint: "Cloud saves for added games \u2014 installs automatically after setup. Off by default; enable in Advanced \u25B8 Cloud saves.", health: busy.cr ? "unknown" : note.cr === "installed" || note.cr === "installed · shortcut rebound" ? "ok" : "unknown", statusText: note.cr || "installs automatically after SLSsteam setup", busy: !!busy.cr, actionLabel: "Reinstall CloudRedirect", onAction: installCloud }), SP_JSX.jsxs("div", { style: { padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600, margin: "2px 0 4px" }, children: "Injection & diagnostics" }), sls?.installed && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, margin: "0 0 4px 2px" }, children: ["Injection is ", sls.injectionActive ? "active" : "inactive", "."] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: sls.injectionActive ? doDeactivate : doActivate, children: sls.injectionActive ? "Deactivate injection" : "Activate injection" }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: runDiag, children: "Run diagnostics" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: runRefreshPatterns, children: "Refresh engine patterns (fix \u201Ccan\u2019t match patterns\u201D)" }) }), diag && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ScrollableResult, { text: diag, maxHeight: 300, mono: true, fontSize: 10 }) }))] })] })] }));
}

const TOPICS = [
    {
        key: "dependencies", title: "Dependencies", icon: SP_JSX.jsx(FaBoxOpen, {}),
        blurb: "The engine and its helpers — install or repair them here.",
        items: [
            { name: "SLSsteam / slsteam-moon", desc: "Core steamclient hook that makes added games appear owned. First install is always offered when missing; Reinstall is a separate repair action once installed." },
            { name: "Steam client fix", desc: "Pins/downgrades the Steam client with h3adcr-b when a Steam update breaks the engine's supported patterns." },
            { name: "CloudRedirect runtime", desc: "The required cloudredirect-moon cloud_redirect.so hook. Reinstall refreshes the moon runtime without treating the optional setup UI as the runtime itself." },
            { name: "CloudRedirect setup UI", desc: "Optional Flatpak companion used when a provider still needs to be configured. Its Steam shortcut is created/rebound when needed and gets cover, hero, wide capsule, logo and icon artwork." },
            { name: "DepotDownloader / .NET", desc: "Direct downloader used for specific builds and content DLC. First use can prepare a local .NET runtime; status/progress is shown in the current game's QAM tools." },
            { name: "Activate / Deactivate injection", desc: "Turns the SLSsteam launch hook on or off. Deactivate returns the next Steam launch to vanilla Steam." },
            { name: "Run diagnostics", desc: "Shows engine type, injection state and config health when adds stop working or a Steam update changes something." },
        ],
    },
    {
        key: "options", title: "Options", icon: SP_JSX.jsx(FaSlidersH, {}),
        blurb: "All current behaviour toggles: buttons, fixes, DLC/cloud, QAM, recovery, library and badges.",
        items: [
            { name: "Store buttons", desc: "Show or hide the floating Add / Fix controls on Steam store game pages." },
            { name: "Library buttons on game pages", desc: "Show or hide the Add / Fixes bar injected into library game pages." },
            { name: "Hide actions on owned games", desc: "Hide SLS Add/Fixes actions on titles already owned legitimately." },
            { name: "No internet fix", desc: "Uses SLSDeck's pinned-build manifest/key recovery path when Steam reports no internet while downloading an older build." },
            { name: "Pin game version on fix", desc: "Version-lock a game when a fix is applied so a later Steam update cannot immediately break that fix. Un-fix removes the pin." },
            { name: "Auto-apply fix after update", desc: "For build-specific fixes, wait for the required build to finish downloading and then apply the fix automatically instead of asking again." },
            { name: "Auto-fix launch target", desc: "When appropriate, repoint Steam to the real/replacement game executable while preserving the rest of the launch options." },
            { name: "Auto-apply fixes after adding", desc: "After a successful Add Game, automatically apply an available online/Denuvo fix according to the normal fix rules." },
            { name: "Unlock DLC when adding a game", desc: "Registers DLC entitlement data and can install the appropriate in-process DLC unlocker. File-backed DLC still needs the actual depot files." },
            { name: "DLC unlockers on owned games only", desc: "Only expose CreamAPI/SmokeAPI/Uplay unlocker controls for legitimately owned games, where those tools are useful." },
            { name: "Add DLC automatically", desc: "During Add Game, also register advertised/content DLC data so supported DLC is included automatically. Best results use a Hubcap key." },
            { name: "Disable DLC unlock on owned games", desc: "Prevent moon from blanket-unlocking unowned DLC on games you genuinely own." },
            { name: "Disable Steam cloud on SLS games", desc: "Disable Valve Steam Cloud only for SLS-added games. Mutually exclusive with using CloudRedirect for those saves." },
            { name: "Hide tools & diagnostics in Quick Access", desc: "Keep the QAM compact by hiding general Tools/Diagnostics there; those controls remain in Advanced." },
            { name: "Show Actions & fixes in Quick Access", desc: "Show the per-game Actions & fixes block in QAM." },
            { name: "Show added games in Quick Access", desc: "Move the added-games list into QAM instead of showing it only on the Add a game page." },
            { name: "Show Reinstall SLSsteam in Quick Access", desc: "Controls the optional Reinstall button once SLSsteam already exists. First-time Install still appears when SLSsteam is missing regardless of this toggle; reinstall is hidden on game pages by default." },
            { name: "Achievements (slsteam-moon)", desc: "Allow moon to obtain/use achievement schema support for added games." },
            { name: "Group SLS games into a collection", desc: "Keep a Steam collection called SLSDeck synchronized with the games added through SLSsteam." },
            { name: "Backup custom manifests and fixes", desc: "Include imported/custom SLSDeck manifests and fixes in the user-created backup archive." },
            { name: "Auto restart after adding", desc: "Legacy/fallback behaviour for add paths that still require a Steam restart. Verified moon live-adds avoid the restart when runtime refresh succeeds." },
            { name: "Auto re-activate injection on boot", desc: "If a Steam update disables the launch hook, re-apply it automatically. Retry limiting prevents loops." },
            { name: "Auto re-pin Steam client on boot", desc: "Automatically run the heavier client pin/downgrade recovery when the installed Steam client is no longer supported." },
            { name: "Emoji Badges", desc: "Replace enabled text badges with emoji equivalents, including SLS 🏴‍☠️, Legit 💵, Fix 🔧, Online Fix 🌐, Denuvo 👺 and Non-Steam ❓." },
            { name: "Individual badge toggles", desc: "Enable or disable SLS, Legit, Denuvo, Online-fix, Fixed, Non-Steam and Non-Steam-name badges independently." },
            { name: "Badge placement toggles", desc: "Choose whether badges appear in the library grid/home carousel, game details pages and store pages." },
        ],
    },
    {
        key: "sources", title: "Sources & keys", icon: SP_JSX.jsx(FaKey, {}),
        blurb: "Manifest/fix sources, authentication and API/depot keys.",
        items: [
            { name: "lua.tools (Discord sign-in)", desc: "Authenticate to lua.tools for account-gated manifests and fixes." },
            { name: "Hubcap key / capture", desc: "Hubcap can provide richer manifests including depot information used by specific-build and direct-download flows." },
            { name: "Ryuu and other keys", desc: "Optional credentials for fix/manifest sources that require an account or API key." },
            { name: "Refresh sources", desc: "Reload the configured manifest-source list." },
        ],
    },
    {
        key: "addgame", title: "Add a game", icon: SP_JSX.jsx(FaDownload, {}),
        blurb: "Find a game, register it with moon and manage your added library.",
        items: [
            { name: "Search / AppID", desc: "Search by title or enter an AppID, then add through the configured manifest sources and SLSsteam." },
            { name: "Live add", desc: "On slsteam-moon, SLSDeck verifies the runtime package/appinfo refresh and avoids restarting Steam when the add became live successfully." },
            { name: "Your added games", desc: "Lists SLS registrations and lets you remove a registration without deleting the installed game files." },
            { name: "Survival restore", desc: "Plugin removal keeps an external recovery archive. Reinstall can restore missing AppID registrations, Lua registrations, exact manifest GIDs/files, pinned builds and fix history automatically." },
            { name: "Custom manifests / Lua", desc: "Import your own manifest/Lua material and bind it to an AppID." },
        ],
    },
    {
        key: "fixes", title: "Game fixes", icon: SP_JSX.jsx(FaWrench, {}),
        blurb: "Apply, track and undo per-game fixes.",
        items: [
            { name: "Apply fix", desc: "Apply the selected online fix, crack/bypass or other supported payload to the game folder." },
            { name: "Build-aware fixes", desc: "When a fix targets a specific manifest/build, SLSDeck can pin/download that build first and then apply the payload." },
            { name: "Fix history / Un-fix", desc: "SLSDeck records exactly what a fix wrote/replaced in luatools-fix-log-<appid>.log so Un-fix can restore originals. Those logs are also preserved by the external survival archive." },
            { name: "HV crack / CrakFiles", desc: "Alternative crack sources can require a particular build; mismatch indicators tell you when the installed build needs to change first." },
            { name: "Online-fix username", desc: "Player name written into supported online-fix emulator configs." },
        ],
    },
    {
        key: "cloud", title: "Cloud saves", icon: SP_JSX.jsx(FaCloud, {}),
        blurb: "Use cloudredirect-moon for SLS game save redirection.",
        items: [
            { name: "cloudredirect-moon runtime", desc: "The actual redirect engine is cloud_redirect.so loaded into Steam. It does not require the setup Flatpak to remain running." },
            { name: "Provider setup UI", desc: "If no provider is configured yet, the optional CloudRedirect UI/Flatpak is used to sign in and write provider configuration." },
            { name: "Reinstall CloudRedirect", desc: "Refreshes the moon runtime hook while preserving provider configuration. It does not blindly replace a working setup UI." },
            { name: "Steam shortcut", desc: "When the setup UI is needed, SLSDeck creates or repairs its Steam shortcut and reapplies cover, hero, wide capsule, logo and icon artwork." },
        ],
    },
    {
        key: "denuvo", title: "Anti-Denuvo", icon: SP_JSX.jsx(FaShieldAlt, {}),
        blurb: "Hypervisor/custom-Proton tooling for supported Denuvo fixes.",
        items: [
            { name: "Hypervisor", desc: "Install/manage the anti-Denuvo hypervisor support used by compatible fixes. This is a heavy optional dependency and only applies to supported titles." },
        ],
    },
    {
        key: "mods", title: "Mods", icon: SP_JSX.jsx(FaPuzzlePiece, {}),
        blurb: "Install supported mods into an existing game installation.",
        items: [
            { name: "Install mod", desc: "Install a selected mod into the game's folder. The base game files must already exist." },
        ],
    },
    {
        key: "gametools", title: "Game tools (QAM)", icon: SP_JSX.jsx(FaGamepad, {}),
        blurb: "Per-game controls shown while a Steam library game page is open.",
        items: [
            { name: "Proton / saves / repair", desc: "Change Proton, back up or restore saves, and run per-game repair operations." },
            { name: "Steamless / DLC unlockers", desc: "Context-sensitive DRM/DLC tools appear only where the game/files support them." },
            { name: "Freeze / Unfreeze version", desc: "Pin the current version to prevent updates, or unpin it to track latest again." },
            { name: "Install a specific build", desc: "Pick a SteamDB build and resolve its depot manifest GIDs. Steam can download through moon, or DepotDownloader can place the exact build files directly when available." },
            { name: "Specific-build download status", desc: "DepotDownloader jobs are polled in the current game's QAM and show preparation/downloading state, percent progress, completion and errors. The old separate global status component was intentionally folded into this game-specific panel." },
            { name: "Download content DLC", desc: "Directly download file-backed content DLC through DepotDownloader without marking an otherwise legitimate base-game directory as a managed full-game install." },
            { name: "Steam uninstall cleanup", desc: "For full games installed/overwritten through the managed DepotDownloader build path, SLSDeck tracks the exact install directory and cleans leftover files after a real Steam UI uninstall transition." },
        ],
    },
];
function HelpHub() {
    const [topic, setTopic] = SP_REACT.useState(null);
    const topRef = SP_REACT.useRef(null);
    const scrollTo = (r) => r.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (topic) {
        return (SP_JSX.jsxs(DFL.PanelSection, { title: topic.title, children: [SP_JSX.jsx("div", { ref: topRef }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setTopic(null), children: SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx(FaArrowLeft, {}), " Back to help"] }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.75, padding: "2px 2px 8px" }, children: topic.blurb }) }), topic.items.map((it) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "4px 2px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 2 }, children: it.name }), SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.8, lineHeight: 1.5 }, children: it.desc })] }) }, it.name))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => scrollTo(topRef), children: SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx(FaArrowUp, {}), " Back to top"] }) }) })] }));
    }
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Help & About", children: [SP_JSX.jsx("div", { ref: topRef }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.75, padding: "2px 2px 8px", display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx(FaQuestionCircle, {}), " Pick a section to see what its current controls and toggles do."] }) }), TOPICS.map((t) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setTopic(t), children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", alignItems: "center", gap: 10, textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { opacity: 0.85 }, children: t.icon }), SP_JSX.jsxs("span", { style: { display: "flex", flexDirection: "column" }, children: [SP_JSX.jsx("span", { style: { fontSize: 14, fontWeight: 600 }, children: t.title }), SP_JSX.jsx("span", { style: { fontSize: 11, opacity: 0.6 }, children: t.blurb })] })] }) }) }, t.key))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 13, lineHeight: 1.5, opacity: 0.9, padding: "8px 2px 2px", borderTop: "1px solid rgba(255,255,255,0.08)" }, children: [SP_JSX.jsx("div", { style: { fontSize: 14, fontWeight: 600, marginBottom: 6 }, children: "About SLSDeck" }), SP_JSX.jsxs("p", { children: ["SLSDeck integrates ", SP_JSX.jsx("b", { children: "slsteam-moon" }), " with SteamOS/Decky and adds manifest/build management, direct DepotDownloader downloads, game fixes, cloud-save redirection, recovery tools, badges and per-game utilities."] }), SP_JSX.jsxs("p", { children: [SP_JSX.jsx("b", { children: "First install:" }), " open ", SP_JSX.jsx("b", { children: "Dependencies" }), " and install SLSsteam. Once installed, reinstall/repair controls are intentionally separate; the Quick Access reinstall button can be hidden without hiding first-time setup."] }), SP_JSX.jsx("p", { children: "Plugin removal keeps a recovery archive outside the plugin directory. On reinstall SLSDeck can restore missing game registrations, exact build GIDs/manifests, pinned-build state and fix history automatically." }), SP_JSX.jsx("p", { style: { color: "#f5a623" }, children: "Build rollback, cracks, hypervisor tooling and cloud redirection are advanced operations. Keep important saves backed up before modifying a game installation." })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => scrollTo(topRef), children: SP_JSX.jsxs("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx(FaArrowUp, {}), " Back to top"] }) }) })] }));
}

function FixesSection() {
    const [appidText, setAppidText] = SP_REACT.useState("");
    const [results, setResults] = SP_REACT.useState([]);
    const [searching, setSearching] = SP_REACT.useState(false);
    const searchTimer = SP_REACT.useRef(null);
    const [check, setCheck] = SP_REACT.useState(null);
    const [checking, setChecking] = SP_REACT.useState(false);
    const [applyState, setApplyState] = SP_REACT.useState(null);
    const [installed, setInstalled] = SP_REACT.useState([]);
    const [openDesc, setOpenDesc] = SP_REACT.useState(null);
    const [awaiting, setAwaiting] = SP_REACT.useState(null);
    const [dlComplete, setDlComplete] = SP_REACT.useState(false);
    const pollRef = SP_REACT.useRef(null);
    const dlRef = SP_REACT.useRef(null);
    const stopFlag = SP_REACT.useRef(false);
    const loadInstalled = async () => {
        try {
            const res = await getInstalledFixes();
            setInstalled(res.success ? res.fixes : []);
        }
        catch {
            setInstalled([]);
        }
    };
    SP_REACT.useEffect(() => {
        loadInstalled();
        return () => {
            if (pollRef.current)
                clearInterval(pollRef.current);
            if (dlRef.current)
                clearInterval(dlRef.current);
            if (searchTimer.current)
                clearTimeout(searchTimer.current);
            stopFlag.current = true;
        };
    }, []);
    const startDlPoll = (appid) => {
        if (dlRef.current)
            clearInterval(dlRef.current);
        setDlComplete(false);
        dlRef.current = setInterval(async () => {
            setDlComplete(await isDownloadComplete(appid));
        }, 3000);
    };
    // Build-accurate apply: pin the fix's build, update the game, then apply
    // (auto) or wait for the user to press Apply (guided). Skips the update if the
    // game is already installed & downloaded.
    const runApply = async (appid, label, startExtract, pinFn) => {
        setAwaiting(null);
        stopFlag.current = false;
        let autoApply = false;
        try {
            autoApply = (await getAutoApply()).enabled;
        }
        catch {
            /* default guided */
        }
        const doApply = async () => {
            setAwaiting(null);
            if (dlRef.current)
                clearInterval(dlRef.current);
            setApplyState({ status: "queued" });
            const res = await startExtract();
            if (!res || !res.success) {
                toaster.toast({ title: "SLSDeck", body: res?.error || "Could not start fix" });
                setApplyState(null);
                throw new Error("apply-start-failed");
            }
            resetFixRuntime(appid);
            pollApply(appid, label);
        };
        try {
            const result = await runBuildAccurateApply({
                appid,
                autoApply,
                doApply,
                pinFn,
                shouldStop: () => stopFlag.current,
                onPhase: (phase) => {
                    if (phase === "pinning")
                        setApplyState({ status: "pinning" });
                    else if (phase === "updating")
                        setApplyState({ status: "updating" });
                    else if (phase === "awaiting_download")
                        setApplyState({ status: "awaiting download" });
                    else if (phase === "applying")
                        setApplyState({ status: "queued" });
                },
            });
            if (result === "awaiting") {
                setAwaiting({ label, run: doApply });
                startDlPoll(appid);
            }
        }
        catch {
            /* surfaced already */
        }
    };
    // Search by game NAME or AppID. Pure digits = a direct AppID; otherwise
    // debounce a name search (same store search the Add-game tab uses).
    const runSearch = (value) => {
        setAppidText(value);
        if (searchTimer.current)
            clearTimeout(searchTimer.current);
        const trimmed = value.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        if (/^\d+$/.test(trimmed)) {
            setResults([{ appid: parseInt(trimmed, 10), name: `AppID ${trimmed}` }]);
            return;
        }
        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await searchGames(trimmed, 15);
                setResults(res.success ? res.results : []);
            }
            catch {
                setResults([]);
            }
            finally {
                setSearching(false);
            }
        }, 400);
    };
    const checkAppid = async (appid) => {
        if (!appid)
            return;
        setChecking(true);
        setCheck(null);
        setApplyState(null);
        setResults([]);
        try {
            const res = await checkFixesFull(appid);
            setCheck(res);
        }
        catch (e) {
            toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
        }
        finally {
            setChecking(false);
        }
    };
    const pollApply = (appid, name) => {
        if (pollRef.current)
            clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const res = await getFixStatus(appid);
                if (!res.success)
                    return;
                setApplyState(res.state);
                if (res.state.status === "done") {
                    clearInterval(pollRef.current);
                    applyFixRuntime(appid, res.state.overrides);
                    autoRepointFromState(appid, res.state);
                    toaster.toast({ title: "SLSDeck", body: `Fix applied to ${name}` });
                    loadInstalled();
                }
                else if (["failed", "cancelled"].includes(res.state.status || "")) {
                    clearInterval(pollRef.current);
                    if (res.state.status === "failed")
                        toaster.toast({ title: "SLSDeck", body: res.state.error || "Fix failed" });
                }
            }
            catch {
                /* keep polling */
            }
        }, 800);
    };
    const onApply = async (appid, url, fixType, gameName) => {
        const pathRes = await getGameInstallPath(appid);
        if (!pathRes.success || !pathRes.installPath) {
            toaster.toast({ title: "SLSDeck", body: "Game must be installed to apply a fix." });
            return;
        }
        await runApply(appid, gameName, () => applyFix(appid, url, pathRes.installPath, fixType, gameName));
    };
    const onApplyLuatools = async (fix, gameName) => {
        const pathRes = await getGameInstallPath(fix.appid);
        if (!pathRes.success || !pathRes.installPath) {
            toaster.toast({ title: "SLSDeck", body: "Game must be installed to apply a fix." });
            return;
        }
        await runApply(fix.appid, gameName, () => applyLuatoolsFix(fix.appid, fix.id, pathRes.installPath, fix.manifest_id || "", fix.depot_id || "", "lua.tools fix", gameName), () => pinForLuatoolsFix(fix.appid, fix.id));
    };
    const confirmUnfix = (fix) => {
        DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: `Un-fix and unpin ${fix.gameName}?`, strDescription: `Deletes ${fix.filesCount} file(s) added by "${fix.fixType}" on ${fix.date}, and removes the game's version pin so Steam can update it again.`, strOKButtonText: "Un-fix and unpin", onOK: async () => {
                const res = await unfix(fix.appid, fix.installPath, fix.date);
                if (!res.success) {
                    toaster.toast({ title: "SLSDeck", body: res.error || "Failed" });
                    return;
                }
                const timer = setInterval(async () => {
                    const st = await getUnfixStatus(fix.appid);
                    if (st.success && ["done", "failed"].includes(st.state.status || "")) {
                        clearInterval(timer);
                        if (st.state.status === "done")
                            clearFixLaunchOptions(fix.appid);
                        toaster.toast({
                            title: "SLSDeck",
                            body: st.state.status === "done" ? "Fix removed" : st.state.error || "Failed",
                        });
                        loadInstalled();
                    }
                }, 700);
            } }));
    };
    const applyBusy = !!applyState && IN_PROGRESS.has(applyState.status || "");
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Game fixes", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Search by name or AppID", value: appidText, onChange: (e) => runSearch(e.target.value) }) }), searching && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), " Searching\u2026"] }) })), !checking && !check && results.slice(0, 15).map((r) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => checkAppid(r.appid), children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: r.name }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: ["AppID ", r.appid] })] }) }) }, r.appid))), checking && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.7 }, children: "Checking fixes\u2026" }) })), check && check.success && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => { setCheck(null); setResults([]); }, children: "\u2190 New search" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontWeight: 600, padding: "2px 0" }, children: check.gameName }) }), check.genericFix.available && check.genericFix.url && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: applyBusy || !!awaiting, onClick: () => onApply(check.appid, check.genericFix.url, "Generic Fix", check.gameName), children: "Apply generic fix" }) })), check.onlineFix.available && check.onlineFix.url && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: applyBusy || !!awaiting, onClick: () => onApply(check.appid, check.onlineFix.url, "Online Fix (Unsteam)", check.gameName), children: "Apply online fix (Unsteam)" }) })), !check.genericFix.available && !check.onlineFix.available && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.6 }, children: ["No fixes available for this game.", ` (perondepot: ${check.onlineFix.mirrorEntries ?? 0} entries${(check.onlineFix.nearMatches || []).length ? `; near: ${(check.onlineFix.nearMatches || []).join(", ")}` : ""})`] }) })), (() => {
                        const cat = (check.luatoolsCatalog || []);
                        const authed = check.luatoolsAuthed;
                        const catErr = check.luatoolsCatalogError;
                        if (authed === false) {
                            return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: "\uD83D\uDD13 Sign in with Discord (lua.tools account, above) to list lua.tools fixes." }) }));
                        }
                        if (!cat.length) {
                            return catErr ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, color: "#ffcc66" }, children: ["lua.tools: ", catErr] }) })) : null;
                        }
                        return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontWeight: 600, marginTop: 6 }, children: ["lua.tools fixes (", cat.length, ")"] }) }), cat.map((fix, i) => {
                                    const tags = (fix.tags || [])
                                        .map((t) => typeof t === "string" ? t : (t && (t.name || t.label || t.text)) || "")
                                        .filter(Boolean);
                                    const title = tags.length ? tags.join(" · ") : fix.name || `Fix ${fix.id || i + 1}`;
                                    const buildId = fix.build || fix.manifest_id || "";
                                    const when = (fix.release_date || "").slice(0, 10);
                                    const meta = [when ? `Released ${when}` : "", buildId ? `build ${buildId}` : ""]
                                        .filter(Boolean)
                                        .join(" · ");
                                    const key = fix.id || String(i);
                                    const desc = fix.description;
                                    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "4px 0" }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600 }, children: title }), meta && SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6 }, children: meta })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: applyBusy || !!awaiting, onClick: () => onApplyLuatools(fix, check.gameName), children: "Apply & pin to build" }) }), desc && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setOpenDesc(openDesc === key ? null : key), children: openDesc === key ? "Hide details ▾" : "Show details ▸" }) }), openDesc === key && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                                                fontSize: 11,
                                                                opacity: 0.8,
                                                                whiteSpace: "pre-wrap",
                                                                wordBreak: "break-word",
                                                                padding: "2px 4px 6px",
                                                                maxHeight: 260,
                                                                overflowY: "auto",
                                                            }, children: desc }) }))] }))] }, `lt-${key}`));
                                })] }));
                    })()] })), awaiting && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85, padding: "4px 0" }, children: ["Pinned \u2014 waiting for Steam to update the game.", " ", dlComplete ? "Download complete — press Apply now." : "Let the download finish, then Apply."] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => awaiting.run().catch(() => { }), children: dlComplete ? `Apply ${awaiting.label} now` : "Apply now (download not done)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => {
                                stopFlag.current = true;
                                if (dlRef.current)
                                    clearInterval(dlRef.current);
                                setAwaiting(null);
                                setApplyState(null);
                            }, children: "Cancel (keep pin)" }) })] })), applyState && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.8, padding: "4px 0" }, children: ["Fix status: ", applyState.status, applyState.error ? ` — ${applyState.error}` : ""] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontWeight: 600, marginTop: 6 }, children: "Custom fixes" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => {
                        const msg = await importCustomFlow("fix");
                        if (msg)
                            toaster.toast({ title: "SLSDeck", body: msg });
                    }, children: "Apply external fix\u2026" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Pick a fix file (.zip/.rar/.7z or a loose .dll/.exe) and the game it's for. It shows as a \"Custom fix\" button in that game's Fixes menu and, once applied, in Applied fixes below (removable by tapping / Un-fix)." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: "Delete all custom fixes?", strDescription: "Removes every imported custom-fix file from ~/.local/share/SLSDeck/custom_fixes. Already-applied fixes stay on their games until you Un-fix them.", strOKButtonText: "Delete", onOK: async () => {
                            const r = await customDeleteFixes(0);
                            toaster.toast({ title: "SLSDeck", body: r.success ? "Custom fixes cleared" : r.error || "Failed" });
                        } })), children: "Delete custom fixes" }) }), installed.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontWeight: 600, marginTop: 6 }, children: "Applied fixes" }) }), installed.map((fix, i) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => confirmUnfix(fix), children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: fix.gameName }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: [fix.fixType, " \u00B7 ", fix.date, " \u00B7 tap to undo"] })] }) }) }, `${fix.appid}-${fix.date}-${i}`)))] }))] }));
}

const CR_FLATPAK = "org.cloudredirect.CloudRedirect";
// Launch CloudRedirect inside Game Mode by registering it as a non-Steam
// shortcut and running it through Steam (gamescope has no desktop compositor,
// so `flatpak run` alone can't draw a window). Returns the shortcut appId.
// Apply the bundled CloudRedirect library art to the non-Steam shortcut so it
// looks native in the library. assetType: 0 grid/cover, 1 hero, 3 wide capsule.
async function applyCrArtwork(appId) {
    const SC = window.SteamClient;
    if (!SC?.Apps?.SetCustomArtworkForApp)
        return;
    try {
        const a = await crArtwork();
        if (!a?.success)
            return;
        const jobs = [
            [a.cover, 0],
            [a.hero, 1],
            [a.capsule, 3],
            [a.logo, 2],
        ];
        for (const [b64, kind] of jobs) {
            if (b64) {
                try {
                    await SC.Apps.SetCustomArtworkForApp(appId, b64, "png", kind);
                }
                catch { /* */ }
            }
        }
        // Shortcut icon is stored by file path, not artwork asset.
        try {
            const ic = await crIconPath();
            if (ic?.success && ic.path && SC?.Apps?.SetShortcutIcon) {
                await SC.Apps.SetShortcutIcon(appId, ic.path);
            }
        }
        catch { /* */ }
    }
    catch {
        /* best-effort */
    }
}
async function launchInGameMode() {
    const SC = window.SteamClient;
    if (!SC?.Apps?.RunGame)
        throw new Error("SteamClient unavailable");
    let appId = 0;
    try {
        const g = await crGetShortcut();
        appId = g?.appId || 0;
    }
    catch {
        /* ignore */
    }
    // Drop a stale id if the shortcut no longer exists.
    if (appId) {
        const ov = window.appStore?.GetAppOverviewByAppID?.(appId);
        if (!ov)
            appId = 0;
    }
    if (!appId) {
        // AddShortcut signatures vary across Steam builds; pass name+exe, then set
        // the flatpak launch options separately.
        const created = await SC.Apps.AddShortcut("CloudRedirect", "/usr/bin/flatpak", "", "");
        appId = Number(created);
        if (!appId || Number.isNaN(appId))
            throw new Error("AddShortcut returned no appId");
    }
    // Rebind EVERY launch, including an already-existing shortcut. A Flatpak
    // reinstall can leave Steam holding stale shortcut metadata; reasserting the
    // executable/options/name makes the existing tile point at the fresh install.
    try {
        await SC.Apps.SetShortcutLaunchOptions(appId, `run --user ${CR_FLATPAK}`);
    }
    catch { /* */ }
    try {
        await SC.Apps.SetShortcutName(appId, "CloudRedirect");
    }
    catch { /* */ }
    try {
        await crSetShortcut(appId);
    }
    catch { /* */ }
    try {
        await applyCrArtwork(appId);
    }
    catch { /* */ }
    // Non-Steam shortcuts launch by their 64-bit gameID, not the 32-bit appid.
    const gameId = ((BigInt(appId) << 32n) | 0x02000000n).toString();
    SC.Apps.RunGame(gameId, "", -1, 100);
    return String(appId);
}
/**
 * CloudRedirect — real Steam Cloud for added ("lua") games, redirected to a
 * cloud provider or local folder. Installed by the client fix; this surface
 * exposes the DisableCloud toggle and a launcher for the sign-in app.
 */
function CloudRedirectSection() {
    const [enabled, setEnabled] = SP_REACT.useState(false);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [msg, setMsg] = SP_REACT.useState("");
    const [provider, setProvider] = SP_REACT.useState(null);
    const load = async () => {
        try {
            const r = await crGetEnabled();
            setEnabled(!!r.enabled);
        }
        catch {
            /* ignore */
        }
        try {
            const p = await crProviderStatus();
            setProvider(p.success ? { configured: !!p.configured, providers: p.providers || [] } : null);
        }
        catch {
            /* ignore */
        }
    };
    SP_REACT.useEffect(() => {
        load();
    }, []);
    const onToggle = async (v) => {
        setEnabled(v);
        setBusy(true);
        try {
            const r = await crSetEnabled(v);
            if (!r.success) {
                setEnabled(!v);
                setMsg(r.error || "Failed to update config");
            }
            else {
                setMsg(v
                    ? "Cloud saves on. Re-run the client fix to fully apply the CR client."
                    : "Cloud saves off.");
            }
        }
        catch (e) {
            setEnabled(!v);
            setMsg(`Error: ${e}`);
        }
        setBusy(false);
    };
    const onOpen = async () => {
        setBusy(true);
        setMsg("Checking CloudRedirect…");
        try {
            // Opening the app is not a reinstall action. Auto-ensure returns immediately
            // when the Flatpak is present; the Dependencies "Reinstall" button uses the
            // manual endpoint, which now removes and reinstalls it first.
            const ins = await crEnsureInstalledAuto();
            if (!ins.installed) {
                setMsg("Install failed:\n" + (ins.log || "check network + flatpak"));
                setBusy(false);
                return;
            }
            setMsg("Launching CloudRedirect in Game Mode…");
            try {
                const appId = await launchInGameMode();
                setMsg(`Launched (as a Steam shortcut, id ${appId}). If it didn't appear, open "CloudRedirect" from your Library. ` +
                    `Pick a provider — the Local-folder option needs no login and works fully in Game Mode.`);
            }
            catch (e) {
                // Fall back to a direct flatpak launch (works in Desktop Mode).
                const o = await crOpenApp();
                setMsg(o.success
                    ? "Opened (Desktop Mode). Game-Mode launch unavailable: " + String(e)
                    : "Could not launch: " + String(e));
            }
        }
        catch (e) {
            setMsg(`Error: ${e}`);
        }
        setBusy(false);
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Cloud saves (CloudRedirect)", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Cloud saves for added games", description: "Redirects Steam Cloud for added games to your provider. Switching fully on/off needs a client-fix re-run.", checked: enabled, onChange: onToggle, disabled: busy }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onOpen, disabled: busy, children: "Open CloudRedirect app (sign in)" }) }), provider && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, padding: "0 2px", color: provider.configured ? "#5ee6c4" : "#f5a623" }, children: provider.configured
                        ? `✓ Provider configured: ${provider.providers.join(", ")}`
                        : "No provider signed in yet — open the app and sign in." }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, color: "#f5a623", padding: "2px 2px" }, children: "\u26A0 Experimental \u2014 it can affect save files. Back up saves you care about. Open the app once to sign into Google Drive / OneDrive / a local folder." }) }), msg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, padding: "0 2px" }, children: msg }) }))] }));
}

/**
 * Tool updates — keeps every GitHub-sourced tool/DLL (SmokeAPI, CreamAPI, Uplay
 * unlockers, OpenSave) on the latest release, checked on boot. Proton and the HV
 * module are large / system-specific, so they are only flagged here.
 */
function UpdatesSection() {
    const [ups, setUps] = SP_REACT.useState([]);
    const [autoUp, setAutoUp] = SP_REACT.useState(true);
    const [engineUp, setEngineUp] = SP_REACT.useState(false);
    const [headcrabUp, setHeadcrabUp] = SP_REACT.useState(false);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [msg, setMsg] = SP_REACT.useState("");
    const load = async () => {
        try {
            setUps((await updatesCheck()).items || []);
        }
        catch { /* */ }
        try {
            setAutoUp(!!(await getAutoUpdate()).enabled);
        }
        catch { /* */ }
        try {
            setEngineUp(!!(await getCheckEngineUpdates()).enabled);
        }
        catch { /* */ }
        try {
            setHeadcrabUp(!!(await getCheckHeadcrabUpdates()).enabled);
        }
        catch { /* */ }
    };
    SP_REACT.useEffect(() => { load(); }, []);
    const updatable = ups.filter((u) => u.updateAvailable);
    const updateAll = async () => {
        setBusy(true);
        setMsg("Updating tools…");
        try {
            // includeHeavy=true so the opted-in SLSsteam engine actually reinstalls to
            // the latest (Proton/HV are flag-only and just no-op here). Fully restart
            // Steam afterwards to load a new engine.
            const r = await updatesUpdateAll(true);
            const done = (r.updated || []).join(", ");
            const failed = (r.failed || []).join(", ");
            const skipped = (r.skipped || []).join(", ");
            setMsg([done && `Updated: ${done}`, skipped && `Manual: ${skipped}`, failed && `Failed: ${failed}`]
                .filter(Boolean).join(" · ") || "Up to date.");
        }
        catch (e) {
            setMsg(`Error: ${e}`);
        }
        await load();
        setBusy(false);
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Tool updates", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-update tools on boot", description: "Keeps SmokeAPI, CreamAPI and the Uplay unlockers on the latest release. Proton & the HV module are only flagged.", checked: autoUp, onChange: (v) => { setAutoUp(v); setAutoUpdate(v).catch(() => { }); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Check engine (slsteam-moon) updates", description: "Adds the engine to this list so it's version-checked (swwayps/slsteam-moon). Update by reinstalling from Dependencies. Off by default \u2014 engine updates are risky.", checked: engineUp, onChange: (v) => { setEngineUp(v); setCheckEngineUpdates(v).then(load).catch(() => { }); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Check headcrab (client fix) updates", description: "Adds headcrab to this list. It's a rolling script (no versions), so 'update' = re-run the Steam client fix in Dependencies. Off by default.", checked: headcrabUp, onChange: (v) => { setHeadcrabUp(v); setCheckHeadcrabUpdates(v).then(load).catch(() => { }); } }) }), updatable.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", onClick: updateAll, disabled: busy, children: ["Update ", updatable.length, " tool(s) now"] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: load, disabled: busy, children: "Check for updates" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7, padding: "2px 2px", lineHeight: 1.5 }, children: ups.length === 0
                        ? "Checking…"
                        : ups.map((u) => `${u.name}: ${u.updateAvailable ? `update → ${u.latest}` : (u.current || "ok")}`).join("  ·  ") }) }), msg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ScrollableResult, { text: msg, copy: msg.length > 120 }) }))] }));
}

const KEY_RE = /smm_[0-9a-f]{96}/;
// Expression evaluated in the Hubcap tab each poll. Mirrors the Ryuu flow so the
// key "just appears" after Discord auth instead of needing manual clicks:
//   1. if a key is already rendered, return it;
//   2. if not signed in, click the Discord login once (starts OAuth);
//   3. once signed in with no key visible, click the Regenerate/New-key control
//      once — the key renders a moment later and the next poll scrapes it.
// Every click is guarded by a window flag so it fires at most once. The manual
// path still works: if the auto-click misses the button, the user can click it
// and the scrape still catches the result. Matching is deliberately narrow
// ("regenerate"/"…key") so it can't hit an unrelated "Generate manifest" button.
const SCRAPE_EXPR = `(function(){try{
  var m=(document.body.innerText.match(/smm_[0-9a-f]{96}/)||[""])[0];
  if(m) return m;
  var q=function(s){return [].slice.call(document.querySelectorAll(s));};
  var txt=function(e){return (e.innerText||e.textContent||"").trim();};
  var href=function(e){return (e.getAttribute&&e.getAttribute("href"))||"";};
  var loggedIn=q("a,button").some(function(e){return /log ?out|sign ?out/i.test(txt(e))||/logout/i.test(href(e));});
  if(!loggedIn){
    var login=q("a,button").filter(function(e){return /log ?in|sign ?in|discord/i.test(txt(e))||/login|discord/i.test(href(e));})[0];
    if(login&&!window.__slsHubLogin){window.__slsHubLogin=1;login.click();}
    return "";
  }
  var gen=q("button,a").filter(function(e){return /regenerate|reset.*key|new.*key|create.*key/i.test(txt(e));})[0];
  if(gen&&!window.__slsHubGen){window.__slsHubGen=1;gen.click();}
  return "";
}catch(e){return "";}})()`;
/** Find a live CEF tab pointed at hubcapmanifest.com, if any. */
async function findHubcapTab() {
    try {
        const res = await fetchNoCors("http://localhost:8080/json");
        const tabs = await res.json();
        return (tabs.find((t) => t.url && t.url.includes("hubcapmanifest.com") && t.webSocketDebuggerUrl) || null);
    }
    catch {
        return null;
    }
}
/** One-shot Runtime.evaluate over a tab's CDP WebSocket; resolves the string
 *  result, or "" on error/timeout. */
function evalOnTab$1(wsUrl, expr, timeoutMs = 4000) {
    return new Promise((resolve) => {
        let done = false;
        let sock;
        const finish = (v) => {
            if (done)
                return;
            done = true;
            try {
                sock.close();
            }
            catch { /* ignore */ }
            resolve(v);
        };
        try {
            sock = new WebSocket(wsUrl);
        }
        catch {
            resolve("");
            return;
        }
        const id = 1;
        sock.onopen = () => {
            try {
                sock.send(JSON.stringify({
                    id,
                    method: "Runtime.evaluate",
                    params: { expression: expr, returnByValue: true },
                }));
            }
            catch {
                finish("");
            }
        };
        sock.onmessage = (ev) => {
            try {
                const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
                if (m && m.id === id) {
                    const val = m?.result?.result?.value;
                    finish(typeof val === "string" ? val : "");
                }
            }
            catch {
                /* ignore */
            }
        };
        sock.onerror = () => finish("");
        setTimeout(() => finish(""), timeoutMs);
    });
}
/**
 * Poll the Hubcap browser tab's DOM until a generated key appears (or timeout).
 * Resolves the `smm_…` key, or "" if not found in time.
 */
async function captureHubcapKey(maxMs = 180000, onStatus) {
    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline) {
        const tab = await findHubcapTab();
        if (tab && tab.webSocketDebuggerUrl) {
            const key = await evalOnTab$1(tab.webSocketDebuggerUrl, SCRAPE_EXPR);
            if (KEY_RE.test(key))
                return key;
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    return "";
}

async function findTab(domain) {
    try {
        const res = await fetchNoCors("http://localhost:8080/json");
        const tabs = await res.json();
        return tabs.find((t) => t.url && t.url.includes(domain) && t.webSocketDebuggerUrl) || null;
    }
    catch {
        return null;
    }
}
/** One-shot Runtime.evaluate over a tab's CDP WebSocket; resolves the string
 *  result, or "" on error/timeout. */
function evalOnTab(wsUrl, expr, timeoutMs = 5000) {
    return new Promise((resolve) => {
        let done = false;
        let sock;
        const finish = (v) => {
            if (done)
                return;
            done = true;
            try {
                sock.close();
            }
            catch { /* ignore */ }
            resolve(v);
        };
        try {
            sock = new WebSocket(wsUrl);
        }
        catch {
            resolve("");
            return;
        }
        const id = 1;
        sock.onopen = () => {
            try {
                sock.send(JSON.stringify({
                    id, method: "Runtime.evaluate",
                    params: { expression: expr, returnByValue: true, awaitPromise: true },
                }));
            }
            catch {
                finish("");
            }
        };
        sock.onmessage = (ev) => {
            try {
                const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
                if (m && m.id === id) {
                    const val = m?.result?.result?.value;
                    finish(typeof val === "string" ? val : "");
                }
            }
            catch { /* ignore */ }
        };
        sock.onerror = () => finish("");
        setTimeout(() => finish(""), timeoutMs);
    });
}
async function pollTab(domain, expr, valid, maxMs, onStatus) {
    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline) {
        const tab = await findTab(domain);
        if (tab && tab.webSocketDebuggerUrl) {
            const key = await evalOnTab(tab.webSocketDebuggerUrl, expr);
            if (valid(key))
                return key;
            onStatus?.("Working on the page — sign in if asked…");
        }
        else {
            onStatus?.(`Waiting for the ${domain} page…`);
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    return "";
}
// ── Ryuu ──────────────────────────────────────────────────────────────────────
// Idempotent per-poll expression. Installs a fetch/XHR interceptor that grabs an
// auth_key-shaped field out of ANY response body (so we don't depend on the exact
// JSON shape). If a key was already produced by the first-login auto-generation,
// returns it immediately. Otherwise triggers Ryuu's OAuth login if needed, then
// clicks "Reset" once to regenerate — the interceptor catches that response, and
// a DOM read of the displayed key backs it up.
const RYUU_KEY_RE = /^[A-Za-z0-9]{12,40}$/;
// Verified live: POST /api/refresh_my_auth_key (session-cookie auth) returns
// {"auth_key":"<16 alnum>","success":true}. So rather than click the page's Reset
// button and try to intercept its pre-bound fetch (which a post-load override
// can't see), we make the authenticated request ourselves from the page context
// and read the key straight out of the JSON response — deterministic network
// capture. Only fires when a session exists (a "Log out" control is present);
// otherwise it clicks Log in to start Ryuu's Discord OAuth. Each success rotates
// the key by design, which is the intended "reset to regenerate" behaviour.
const RYUU_EXPR = `(async function(){try{
  var q=function(s){return [].slice.call(document.querySelectorAll(s));};
  var txt=function(e){return (e.innerText||e.textContent||"").trim();};
  var href=function(e){return (e.getAttribute&&e.getAttribute("href"))||"";};
  var loggedIn=q("a,button").some(function(e){return /log ?out|sign ?out/i.test(txt(e))||/\\/logout/i.test(href(e));});
  if(!loggedIn){
    var login=q("a,button").filter(function(e){return /log ?in|sign ?in/i.test(txt(e))||/\\/login/i.test(href(e));})[0];
    if(login&&!window.__slsRyuuLogin){window.__slsRyuuLogin=1;login.click();}
    return "";
  }
  var r=await fetch("/api/refresh_my_auth_key",{method:"POST",headers:{"Accept":"application/json"},credentials:"include"});
  if(r.status===200){var j=await r.json().catch(function(){return null;});if(j&&j.auth_key)return String(j.auth_key);}
  return "";
}catch(e){return "";}})()`;
async function captureRyuuKey(maxMs = 180000, onStatus) {
    return pollTab("generator.ryuu.lol", RYUU_EXPR, (k) => RYUU_KEY_RE.test(k), maxMs, onStatus);
}
// ── Steam Web API key ─────────────────────────────────────────────────────────
// steamcommunity.com/dev/apikey renders the key in full (32 hex) once registered.
const STEAM_KEY_RE = /^[0-9A-Fa-f]{32}$/;
const STEAM_EXPR = `(function(){try{
  var t=document.body.innerText||"";
  var m=t.match(/Key:\\\\s*([0-9A-Fa-f]{32})/)||t.match(/\\\\b([0-9A-Fa-f]{32})\\\\b/);
  return m?m[1]:"";
}catch(e){return "";}})()`;
async function captureSteamKey(maxMs = 180000, onStatus) {
    return pollTab("steamcommunity.com/dev/apikey", STEAM_EXPR, (k) => STEAM_KEY_RE.test(k), maxMs, onStatus);
}

function SettingsSection() {
    const [fields, setFields] = SP_REACT.useState([]);
    const [drafts, setDrafts] = SP_REACT.useState({});
    const [apis, setApis] = SP_REACT.useState([]);
    const [ryuuKey, setRyuuKeyState] = SP_REACT.useState("");
    const [ryuuDraft, setRyuuDraft] = SP_REACT.useState("");
    const [steamKey, setSteamKeyState] = SP_REACT.useState("");
    const [steamDraft, setSteamDraft] = SP_REACT.useState("");
    const [lt, setLt] = SP_REACT.useState(null);
    const [ltCode, setLtCode] = SP_REACT.useState("");
    const [ltBusy, setLtBusy] = SP_REACT.useState(false);
    const [hub, setHub] = SP_REACT.useState(null);
    const [hubBusy, setHubBusy] = SP_REACT.useState(false);
    const [hubCapturing, setHubCapturing] = SP_REACT.useState(false);
    const [ryuuCapturing, setRyuuCapturing] = SP_REACT.useState(false);
    const [steamCapturing, setSteamCapturing] = SP_REACT.useState(false);
    const loadHub = async () => {
        setHubBusy(true);
        try {
            const r = await hubcapUsage();
            setHub(r.success && r.usage ? r.usage : null);
        }
        catch {
            setHub(null);
        }
        finally {
            setHubBusy(false);
        }
    };
    const load = async () => {
        try {
            const res = await getApiKeyFields();
            const f = res.success ? res.fields : [];
            setFields(f);
            const d = {};
            f.forEach((x) => (d[x.placeholder] = x.value || ""));
            setDrafts(d);
        }
        catch {
            setFields([]);
        }
        try {
            const res = await getRyuuKey();
            const k = res.success ? res.key || "" : "";
            setRyuuKeyState(k);
            setRyuuDraft(k);
        }
        catch {
            /* ignore */
        }
        try {
            const res = await wsGetSteamKey();
            const k = res.success ? res.key || "" : "";
            setSteamKeyState(k);
            setSteamDraft(k);
        }
        catch {
            /* ignore */
        }
        try {
            setLt(await luatoolsStatus());
        }
        catch {
            setLt(null);
        }
        try {
            const res = await getApiList();
            setApis(res.success ? res.apis : []);
        }
        catch {
            setApis([]);
        }
        // Live Hubcap quota, only when a Hubcap/Morrenus key is configured.
        try {
            const f = (await getApiKeyFields());
            const has = f.success && (f.fields || []).some((x) => x.placeholder === "<moapikey>" && x.hasKey);
            if (has)
                loadHub();
            else
                setHub(null);
        }
        catch {
            /* ignore */
        }
    };
    const doRedeem = async () => {
        const code = ltCode.trim();
        if (!code)
            return;
        setLtBusy(true);
        try {
            const r = await luatoolsRedeem(code);
            if (r.success) {
                toaster.toast({ title: "lua.tools", body: `Signed in as ${r.user?.name || "you"}` });
                setLtCode("");
                setLt(await luatoolsStatus());
            }
            else {
                toaster.toast({ title: "lua.tools", body: r.error || "Redeem failed" });
            }
        }
        catch (e) {
            toaster.toast({ title: "lua.tools", body: String(e) });
        }
        finally {
            setLtBusy(false);
        }
    };
    const doOauth = async () => {
        setLtBusy(true);
        try {
            const r = await luatoolsOauthStart();
            if (!r.success || !r.url) {
                toaster.toast({ title: "lua.tools", body: r.error || "Could not start sign-in" });
                setLtBusy(false);
                return;
            }
            // Open Discord OAuth in Steam's in-app browser (works in Game mode). The
            // consent flow redirects back to the plugin's localhost callback.
            try {
                DFL.Navigation.NavigateToExternalWeb(r.url);
            }
            catch {
                DFL.Navigation.NavigateToExternalWeb(r.url);
            }
            toaster.toast({ title: "lua.tools", body: "Sign in with Discord in the browser, then return here." });
            // Poll for completion (up to ~3 min).
            let tries = 0;
            const t = setInterval(async () => {
                tries += 1;
                try {
                    const s = await luatoolsOauthStatus();
                    if (s.done || tries > 120) {
                        clearInterval(t);
                        if (!s.done) {
                            await luatoolsOauthCancel();
                            toaster.toast({ title: "lua.tools", body: "Sign-in timed out" });
                        }
                        else {
                            toaster.toast({
                                title: "lua.tools",
                                body: s.authed ? "Signed in ✓" : (s.error || "Sign-in failed"),
                            });
                        }
                        setLt(await luatoolsStatus());
                        setLtBusy(false);
                    }
                }
                catch {
                    /* keep polling */
                }
            }, 1500);
        }
        catch (e) {
            toaster.toast({ title: "lua.tools", body: String(e) });
            setLtBusy(false);
        }
    };
    const doSignout = async () => {
        setLtBusy(true);
        try {
            await luatoolsSignout();
            setLt(await luatoolsStatus());
            toaster.toast({ title: "lua.tools", body: "Signed out" });
        }
        finally {
            setLtBusy(false);
        }
    };
    const saveSteamKey = async () => {
        await wsSetSteamKey(steamDraft.trim());
        setSteamKeyState(steamDraft.trim());
        toaster.toast({ title: "SLSDeck", body: "Steam Web API key saved" });
    };
    const saveRyuuKey = async () => {
        await setRyuuKey(ryuuDraft.trim());
        setRyuuKeyState(ryuuDraft.trim());
        toaster.toast({ title: "SLSDeck", body: "Ryuu API key saved" });
    };
    SP_REACT.useEffect(() => {
        load();
    }, []);
    const saveKey = async (placeholder) => {
        await setApiKeyFor(placeholder, drafts[placeholder] ?? "");
        toaster.toast({ title: "SLSDeck", body: "API key saved" });
        load();
    };
    const onRefreshApis = async () => {
        const res = await fetchFreeApis();
        if (res.success) {
            toaster.toast({ title: "SLSDeck", body: `Loaded ${res.count ?? 0} manifest sources` });
            load();
        }
        else {
            toaster.toast({ title: "SLSDeck", body: res.error || "Failed" });
        }
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Sources & keys", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, padding: "2px 0" }, children: "lua.tools account" }) }), lt?.authed ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, color: "#8fd694" }, children: ["\u2713 Signed in as ", lt.user?.name || "you", lt.supporter ? ` · ${lt.supporter}` : ""] }) }), lt?.debug && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 10, opacity: 0.5, wordBreak: "break-all" }, children: ["auth: ", JSON.stringify(lt.debug)] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doSignout, disabled: ltBusy, children: "Sign out" }) })] })) : (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doOauth, disabled: ltBusy, children: ltBusy ? "Waiting for Discord…" : "Sign in with Discord" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7, padding: "0 2px 6px" }, children: "Opens Discord in Steam's browser \u2014 sign in and authorize, then return here. Signing in lets the plugin add games and pin fixes to the right build from lua.tools." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.55, padding: "0 2px 2px" }, children: "Fallback: paste a bot code from the lua.tools Discord bot instead." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bot code (optional)", value: ltCode, onChange: (e) => setLtCode(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doRedeem, disabled: ltBusy || !ltCode.trim(), children: ltBusy ? "Redeeming…" : "Redeem code" }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.55, padding: "0 2px 6px" }, children: "Pin source order: lua.tools (signed in) \u2192 Hubcap key \u2192 ~/Downloads/<appid>.lua \u2192 none." }) }), fields.map((f) => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: `${f.label} (optional)${f.hasKey ? " ✓" : ""}`, value: drafts[f.placeholder] ?? "", onChange: (e) => setDrafts((d) => ({ ...d, [f.placeholder]: e.target.value })) }) }), f.placeholder === "<moapikey>" && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: hubCapturing, onClick: async () => {
                                try {
                                    DFL.Navigation.NavigateToExternalWeb("https://hubcapmanifest.com/api-keys/stats");
                                }
                                catch { /* ignore */ }
                                setHubCapturing(true);
                                toaster.toast({ title: "Hubcap", body: "Sign in with Discord — I'll generate and grab your key automatically." });
                                try {
                                    const key = await captureHubcapKey(180000);
                                    if (key) {
                                        await setApiKeyFor("<moapikey>", key);
                                        toaster.toast({ title: "Hubcap", body: "Key captured and saved ✓" });
                                        load();
                                    }
                                    else {
                                        toaster.toast({ title: "Hubcap", body: "Didn't see a key in time. Generate it, then tap again — or paste it above." });
                                    }
                                }
                                catch (e) {
                                    toaster.toast({ title: "Hubcap", body: `Capture error: ${e}` });
                                }
                                setHubCapturing(false);
                            }, children: hubCapturing ? "Waiting for key… (sign in with Discord)" : "Sign in to Hubcap & capture key" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", onClick: () => saveKey(f.placeholder), disabled: (drafts[f.placeholder] ?? "") === (f.value ?? ""), children: ["Save ", f.label] }) }), f.placeholder === "<moapikey>" && f.hasKey && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", fontSize: 11, opacity: 0.9, padding: "2px 2px 6px" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: "Hubcap quota" }), SP_JSX.jsx("span", { style: { textDecoration: "underline", cursor: "pointer", opacity: 0.7 }, onClick: loadHub, children: hubBusy ? "refreshing…" : "refresh" })] }), hub ? (SP_JSX.jsxs("div", { style: { marginTop: 4 }, children: [["single", "bundle", "workshop"].map((k) => {
                                            const q = hub[k];
                                            if (!q)
                                                return null;
                                            const usedPct = q.limit > 0 ? Math.max(0, Math.min(100, Math.round((q.usage / q.limit) * 100))) : 0;
                                            const low = q.limit > 0 && q.remaining <= Math.max(1, Math.ceil(q.limit * 0.1));
                                            return (SP_JSX.jsxs("div", { style: { marginBottom: 7 }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 2 }, children: [SP_JSX.jsx("span", { style: { textTransform: "capitalize" }, children: k }), SP_JSX.jsxs("span", { style: { fontWeight: 600 }, children: [q.remaining, "/", q.limit, " left \u00B7 ", usedPct, "% used"] })] }), SP_JSX.jsx("div", { style: { height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }, children: SP_JSX.jsx("div", { style: { height: "100%", width: `${usedPct}%`, background: low ? "#d99035" : "#4a90d9", transition: "width 0.25s" } }) }), low ? SP_JSX.jsxs("div", { style: { marginTop: 2, opacity: 0.8 }, children: ["Low quota \u2014 ", q.remaining, " request", q.remaining === 1 ? "" : "s", " remaining."] }) : null] }, k));
                                        }), SP_JSX.jsxs("div", { style: { opacity: 0.65, marginTop: 2 }, children: ["Steam service: ", hub.steam_service_ready ? "ready ✓" : "not ready"] })] })) : (SP_JSX.jsx("div", { style: { opacity: 0.6, marginTop: 2 }, children: hubBusy ? "Loading…" : "Quota unavailable (check the key)." }))] }) }))] }, f.placeholder))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: `Ryuu API key (manifests + gated fixes)${ryuuKey ? " ✓" : ""}`, value: ryuuDraft, onChange: (e) => setRyuuDraft(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", fontSize: 11, opacity: 0.75, padding: "2px 2px 6px" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 8 }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: "Ryuu quota" }), SP_JSX.jsx("span", { children: ryuuKey ? "API key ready ✓" : "API key not set" })] }), SP_JSX.jsx("div", { style: { marginTop: 3 }, children: "Free accounts: 50 manifest downloads per 24 hours." }), SP_JSX.jsx("div", { style: { marginTop: 2, opacity: 0.65 }, children: "Ryuu's documented API does not expose a live remaining-count endpoint, so SLSDeck shows the published limit rather than guessing your balance." })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "From generator.ryuu.lol/api. The same X-Auth-Key is used for Ryuu manifest downloads and gated fixes." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: saveRyuuKey, disabled: ryuuDraft.trim() === (ryuuKey ?? ""), children: "Save Ryuu API key" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: ryuuCapturing, onClick: async () => {
                        try {
                            DFL.Navigation.NavigateToExternalWeb("https://generator.ryuu.lol/api");
                        }
                        catch { /* ignore */ }
                        setRyuuCapturing(true);
                        toaster.toast({ title: "Ryuu", body: "Sign in with Discord — I'll grab your API key automatically." });
                        try {
                            const key = await captureRyuuKey(180000, () => { });
                            if (key) {
                                await setRyuuKey(key);
                                setRyuuKeyState(key);
                                setRyuuDraft(key);
                                toaster.toast({ title: "Ryuu", body: "Key captured and saved ✓" });
                            }
                            else {
                                toaster.toast({ title: "Ryuu", body: "Didn't see a key in time. Log in on the page, then tap again — or paste it above." });
                            }
                        }
                        catch (e) {
                            toaster.toast({ title: "Ryuu", body: `Capture error: ${e}` });
                        }
                        setRyuuCapturing(false);
                    }, children: ryuuCapturing ? "Waiting for key… (sign in on the page)" : "Log in to Ryuu & capture key" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: `Steam Web API key (for Workshop mod search)${steamKey ? " ✓" : ""}`, value: steamDraft, onChange: (e) => setSteamDraft(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Optional. Get a free key at steamcommunity.com/dev/apikey for richer Workshop search (thumbnails, ranking). Without it, search still works via the public browse page." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: saveSteamKey, disabled: steamDraft.trim() === (steamKey ?? ""), children: "Save Steam Web API key" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: steamCapturing, onClick: async () => {
                        try {
                            DFL.Navigation.NavigateToExternalWeb("https://steamcommunity.com/dev/apikey");
                        }
                        catch { /* ignore */ }
                        setSteamCapturing(true);
                        toaster.toast({ title: "Steam", body: "Grabbing your Web API key — register one on the page if prompted." });
                        try {
                            const key = await captureSteamKey(120000, () => { });
                            if (key) {
                                await wsSetSteamKey(key);
                                setSteamKeyState(key);
                                setSteamDraft(key);
                                toaster.toast({ title: "Steam", body: "Web API key captured and saved ✓" });
                            }
                            else {
                                toaster.toast({ title: "Steam", body: "No key found. Register a key on the page (any domain), then tap again." });
                            }
                        }
                        catch (e) {
                            toaster.toast({ title: "Steam", body: `Capture error: ${e}` });
                        }
                        setSteamCapturing(false);
                    }, children: steamCapturing ? "Waiting for key…" : "Open Steam key page & capture" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.7, padding: "2px 0" }, children: ["Sources: ", apis.length ? apis.map((a) => a.name).join(", ") : "none"] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onRefreshApis, children: "Refresh sources" }) })] }));
}

function Chip({ ok, label }) {
    return (SP_JSX.jsxs("span", { style: {
            display: "inline-block",
            padding: "1px 8px",
            marginRight: 6,
            marginBottom: 4,
            borderRadius: 10,
            fontSize: 11,
            background: ok ? "rgba(88,197,120,0.18)" : "rgba(245,166,35,0.18)",
            color: ok ? "#58c578" : "#f5a623",
        }, children: [ok ? "✓ " : "• ", label] }));
}
function markedGames(st) {
    const g = st?.games;
    if (!g)
        return [];
    if (Array.isArray(g))
        return g.filter((x) => x?.enabled).map((x) => String(x.appid));
    return Object.keys(g).filter((k) => g[k]);
}
/**
 * Anti-Denuvo hypervisor (HV-Decky port): builds the cpuid_fault_emulation
 * kernel module against the RUNNING kernel (native pacman headers, or a podman
 * container), verifies it with a userspace cpuid self-test, and runs a
 * umipcompatd daemon so UMIP need not be disabled system-wide. Needs root.
 */
function HypervisorSection() {
    const [st, setSt] = SP_REACT.useState(null);
    const [busy, setBusy] = SP_REACT.useState("");
    const [autoload, setAutoload] = SP_REACT.useState(false);
    const [proton, setProton] = SP_REACT.useState(null);
    const [protonDl, setProtonDl] = SP_REACT.useState(null);
    const [nativeNote, setNativeNote] = SP_REACT.useState(null);
    const [showLog, setShowLog] = SP_REACT.useState(false);
    const [log, setLog] = SP_REACT.useState("");
    const refresh = async () => {
        try {
            setSt(await hvStatus());
        }
        catch {
            /* ignore */
        }
        try {
            setAutoload(!!(await hvGetAutoload()).enabled);
        }
        catch {
            /* ignore */
        }
        try {
            const p = await hvProtonStatus();
            setProton({ installed: !!p.installed, tarballPresent: !!p.tarballPresent });
        }
        catch {
            setProton(null);
        }
        try {
            const n = await hvNativeNotice();
            setNativeNote(n.success ? { show: !!(n.show ?? n.native), message: n.message || "" } : null);
        }
        catch {
            setNativeNote(null);
        }
    };
    SP_REACT.useEffect(() => {
        refresh();
    }, []);
    // Runs a long backend action, shows a spinner, then refreshes + surfaces the
    // operation log tail.
    const run = async (key, fn, okMsg) => {
        setBusy(key);
        try {
            const r = await fn();
            toaster.toast({ title: "Hypervisor", body: r.success ? (r.message || okMsg) : (r.error || "Failed") });
        }
        catch (e) {
            toaster.toast({ title: "Hypervisor", body: `Error: ${e}` });
        }
        finally {
            setBusy("");
            refresh();
        }
    };
    const doTest = async () => {
        setBusy("test");
        try {
            const r = await hvTest();
            toaster.toast({
                title: "Hypervisor self-test",
                body: r.success ? (r.message || "cpuid faulting works ✓") : (r.error || r.message || "Self-test failed"),
            });
        }
        catch (e) {
            toaster.toast({ title: "Hypervisor", body: `Error: ${e}` });
        }
        finally {
            setBusy("");
        }
    };
    const loadLog = async () => {
        setShowLog((v) => !v);
        try {
            const r = await hvLog();
            setLog(r.log || "(empty)");
        }
        catch {
            setLog("(could not read log)");
        }
    };
    const doInstallProton = async () => {
        setBusy("proton");
        setProtonDl({ status: "starting", percent: 0 });
        try {
            const r = await hvInstallProton();
            if (!r.success && r.error) {
                toaster.toast({ title: "Hypervisor", body: r.error });
                setProtonDl(null);
                return;
            }
            await new Promise((resolve) => {
                const t = setInterval(async () => {
                    try {
                        const s = (await hvProtonInstallStatus()).state;
                        setProtonDl({ status: s.status, percent: s.percent || 0 });
                        if (["done", "failed", "needsSource"].includes(s.status)) {
                            clearInterval(t);
                            toaster.toast({
                                title: "Hypervisor",
                                body: s.status === "done" ? "Denuvo Proton installed" : (s.error || "Install failed"),
                            });
                            setProtonDl(null);
                            resolve();
                        }
                    }
                    catch {
                        /* keep polling */
                    }
                }, 1000);
            });
        }
        catch (e) {
            toaster.toast({ title: "Hypervisor", body: `Error: ${e}` });
            setProtonDl(null);
        }
        finally {
            setBusy("");
            refresh();
        }
    };
    const onAutoload = async (v) => {
        setAutoload(v);
        try {
            await hvSetAutoload(v);
        }
        catch {
            /* ignore */
        }
    };
    const onWatcher = async (v) => {
        try {
            await hvSetWatcherMode(v ? "steam_log" : "manual");
            refresh();
        }
        catch {
            /* ignore */
        }
    };
    const unmark = async (appid) => {
        try {
            await hvSetGame(Number(appid), false);
        }
        catch {
            /* ignore */
        }
        refresh();
    };
    const modules = st?.modules || [];
    const loaded = modules.some((m) => m.loaded);
    const built = modules.some((m) => m.kernel_compatible);
    const podman = !!st?.podman_path;
    const working = busy !== "";
    const games = markedGames(st);
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Anti-Denuvo (hypervisor)", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "2px 0" }, children: [SP_JSX.jsx(Chip, { ok: loaded, label: loaded ? "Active" : "Inactive" }), SP_JSX.jsx(Chip, { ok: built, label: "Module built" }), SP_JSX.jsx(Chip, { ok: !!st?.headers_ready, label: "Headers" }), SP_JSX.jsx(Chip, { ok: !!st?.root, label: "Root" }), SP_JSX.jsx(Chip, { ok: !!st?.umip_disabled, label: "UMIP off" }), SP_JSX.jsx(Chip, { ok: !!proton?.installed, label: "Proton" })] }) }), st && st.is_steamos === false && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, color: "#f5a623", padding: "2px 2px" }, children: "\u26A0 Non-SteamOS detected. The kernel-module build targets SteamOS (holo repo / linux-neptune headers); on another distro the build may fail or need its own kernel headers. Proceed at your own risk." }) })), nativeNote?.show && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, color: "#58c578", padding: "2px 2px" }, children: ["\u2713 ", nativeNote.message || "This kernel supports cpuid faulting natively — the module may not be needed.", SP_JSX.jsx("span", { style: { marginLeft: 8, textDecoration: "underline", cursor: "pointer", opacity: 0.8 }, onClick: async () => { await hvDismissNative(); setNativeNote(null); }, children: "dismiss" })] }) })), !st?.root && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: "Backend is not running as root \u2014 reinstall the plugin so the root flag takes effect." }) })), working && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 14, height: 14, marginRight: 8 } }), busy === "deps" ? "Installing kernel headers…"
                            : busy === "build" ? "Building module (this can take a few minutes)…"
                                : busy === "container" ? "Building module in container…"
                                    : "Working…"] }) })), !working && !built && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("download", hvDownload, "Prebuilt module downloaded"), children: "Download prebuilt module (recommended)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6 }, children: ["Fetches the prebuilt cpuid_fault_emulation.ko for your kernel (", st?.kernel_release || "?", ") \u2014 no compiler, headers or source needed. Use this first; only build below if no prebuilt matches your kernel."] }) }), !st?.headers_ready && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("deps", hvInstallDeps, "Kernel headers installed"), children: "Install kernel headers (for building)" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("build", hvBuild, "Module built"), children: "Build module (native)" }) }), podman && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("container", hvBuildContainer, "Module built (container)"), children: "Build module in container (podman)" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6 }, children: ["Building compiles the module for your kernel (", st?.kernel_release || "?", ") using", " ", st?.compiler_name || "the kernel compiler", " \u2014 needs headers + source. Rebuild after a SteamOS kernel update."] }) })] })), !working && built && !loaded && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("load", hvLoadAuto, "Hypervisor enabled"), children: "Enable hypervisor" }) })), !working && built && loaded && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("unload", hvUnloadAuto, "Hypervisor disabled"), children: "Disable hypervisor" }) })), !working && built && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doTest, disabled: working, children: "Test cpuid faulting (self-test)" }) })), !working && built && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("build", hvBuild, "Module rebuilt"), children: "Rebuild for this kernel" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, marginTop: 6 }, children: "UMIP compatibility" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: st?.umip_disabled
                        ? "UMIP is disabled at the kernel level — the daemon isn't needed here."
                        : st?.umipcompat_running
                            ? "Handled automatically ✓ — the umipcompatd daemon runs while the hypervisor is enabled (no reboot)."
                            : st?.umipcompat_failed
                                ? "⚠ The automatic UMIP daemon failed to start — use the kernel fallback below."
                                : "Handled automatically by the umipcompatd daemon when the hypervisor is enabled (no reboot)." }) }), st?.umip_disabled && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("umiprestore", hvRestoreUmip, "UMIP restore staged — reboot to apply"), disabled: working, children: "Restore UMIP (reboot) \u2014 switch to the automatic daemon" }) })), !st?.umip_disabled && !st?.umipcompat_running && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("umipstart", hvUmipStart, "UMIP daemon started"), disabled: working, children: "Start UMIP daemon manually" }) })), !st?.umip_disabled && st?.umipcompat_running && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("umipstop", hvUmipStop, "UMIP daemon stopped"), disabled: working, children: "Stop UMIP daemon" }) })), !st?.umip_disabled && st?.umipcompat_failed && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6 }, children: "Fallback: if the daemon won't run, disable UMIP at the kernel level (permanent, needs a reboot)." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("umip", hvDisableUmip, "UMIP disabled"), disabled: working, children: "Disable UMIP & reboot (permanent)" }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-manage per game", description: "Watch Steam's game log and load the module while a flagged Denuvo game runs, then unload it. Off = manual only.", checked: (st?.game_watcher_mode || "manual") === "steam_log", onChange: onWatcher }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Start watcher at boot", description: "Start the per-game HV watcher when the plugin loads.", checked: autoload, onChange: onAutoload }) }), proton && !proton.installed && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doInstallProton, disabled: working || !!protonDl, children: protonDl ? "Working…" : proton.tarballPresent ? "Install Denuvo Proton" : "Download & install Denuvo Proton (~505 MB)" }) }), protonDl && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), SP_JSX.jsx("span", { children: protonDl.status === "downloading" ? `Downloading… ${protonDl.percent}%`
                                        : protonDl.status === "extracting" ? "Extracting…" : protonDl.status })] }) }))] })), games.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, marginTop: 4 }, children: "Marked games" }) }), games.map((aid) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => unmark(aid), children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: appDisplayName(Number(aid)) || `AppID ${aid}` }), SP_JSX.jsx("span", { style: { fontSize: 11, opacity: 0.6 }, children: "tap to unmark" })] }) }) }, aid)))] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("reboot", hvReboot, "Rebooting…"), disabled: working, children: "Reboot Deck now" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: loadLog, children: showLog ? "Hide build log ▾" : "Show build log ▸" }) }), showLog && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ScrollableResult, { text: log, maxHeight: 240, mono: true, fontSize: 10 }) })), st?.kernel_release && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 10, opacity: 0.5 }, children: ["kernel ", st.kernel_release, st?.compiler_name ? ` · ${st.compiler_name}` : ""] }) }))] }));
}

const TOKEER_DISCORD_URL = "https://discord.com/channels/1464130182364270696/1534460498446127175/1535685399265935422";
const GUILD_ID = "1464130182364270696";
const TOKEER_CHANNEL = `/channels/${GUILD_ID}/1534460498446127175`;
const TARGET_MESSAGE = "1535685399265935422";
const CDP_PORTS = [8080, 8081];
const TOKEER_VIEW_NAME = "slsdeck_tokeer";
async function listCdpTabs() {
    const merged = [];
    const seen = new Set();
    for (const port of CDP_PORTS) {
        try {
            const r = await fetchNoCors(`http://localhost:${port}/json`);
            const tabs = await r.json();
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
function cdpCommand(wsUrl, method, params = {}, timeoutMs = 5000) {
    return new Promise((resolve) => {
        let done = false;
        let sock;
        const finish = (v) => {
            if (done)
                return;
            done = true;
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
        setTimeout(() => finish(null), timeoutMs);
    });
}
async function evalJson(wsUrl, expression, timeoutMs = 5000) {
    const result = await cdpCommand(wsUrl, "Runtime.evaluate", { expression, returnByValue: true }, timeoutMs);
    return result?.result?.value ?? null;
}
async function evalDetailed(wsUrl, expression, timeoutMs = 5000) {
    const result = await cdpCommand(wsUrl, "Runtime.evaluate", { expression, returnByValue: true }, timeoutMs);
    const error = result?.exceptionDetails?.exception?.description || result?.exceptionDetails?.text;
    if (error)
        return { error: String(error) };
    return { value: result?.result?.value };
}
function looksLikeDiscordUrl(url) {
    return /(^|\.)discord\.com(?:\/|$)/i.test(String(url || "").replace(/^https?:\/\//i, ""));
}
/** Steam external-web surfaces sometimes report a wrapper URL in /json. Ask the
 * actual JS execution context what it is rendering instead of trusting metadata. */
async function resolveTabUrl(t) {
    if (!t.webSocketDebuggerUrl)
        return String(t.url || "");
    const expr = `(function(){try{
    var here=String(location.href||document.URL||'');
    var frames=[].slice.call(document.querySelectorAll('iframe')).map(function(f){return String(f.src||'');});
    return JSON.stringify({here:here,frames:frames});
  }catch(e){return JSON.stringify({here:'',frames:[]});}})()`;
    const raw = await evalJson(t.webSocketDebuggerUrl, expr, 1800);
    try {
        const parsed = JSON.parse(String(raw || ""));
        const urls = [parsed?.here, ...(Array.isArray(parsed?.frames) ? parsed.frames : [])].filter(Boolean);
        return urls.find((u) => looksLikeDiscordUrl(u)) || String(parsed?.here || t.url || "");
    }
    catch {
        return String(t.url || "");
    }
}
async function findDiscordTab() {
    const tabs = (await listCdpTabs()).filter((t) => !!t.webSocketDebuggerUrl);
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
async function findSharedJsContext() {
    const tabs = (await listCdpTabs()).filter((t) => !!t.webSocketDebuggerUrl);
    return tabs.find((t) => String(t.title || "") === "SharedJSContext")
        || tabs.find((t) => /SharedJSContext/i.test(String(t.title || "")))
        || null;
}
async function hasTokeerBrowserView() {
    const shared = await findSharedJsContext();
    if (!shared?.webSocketDebuggerUrl)
        return false;
    return !!(await evalJson(shared.webSocketDebuggerUrl, `(function(){try{return !!(window.SLSDECK_TOKEER_VIEW&&window.SLSDECK_TOKEER_VIEW.m_browserView);}catch(e){return false;}})()`, 2000));
}
async function findManagedTokeerTab() {
    const tabs = (await listCdpTabs()).filter((t) => !!t.webSocketDebuggerUrl);
    for (const tab of tabs) {
        const managed = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{return window.__SLSDECK_TOKEER_MANAGED===true;}catch(e){return false;}})()`, 1200);
        if (!managed)
            continue;
        const resolvedUrl = await resolveTabUrl(tab);
        return { ...tab, resolvedUrl, url: resolvedUrl };
    }
    return null;
}
async function hideTokeerBrowserView() {
    const shared = await findSharedJsContext();
    if (!shared?.webSocketDebuggerUrl)
        return;
    await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
    var v=window.SLSDECK_TOKEER_VIEW;
    if(!v||!v.m_browserView)return false;
    v.m_browserView.SetVisible(false);return true;
  }catch(e){return false;}})()`, 2000);
}
async function parkTokeerBrowserView() {
    const shared = await findSharedJsContext();
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
async function positionTokeerDiscordEmbedded(bounds) {
    const shared = await findSharedJsContext();
    if (!shared?.webSocketDebuggerUrl)
        return false;
    const b = {
        x: Math.max(0, Math.round(bounds.x)), y: Math.max(0, Math.round(bounds.y)),
        width: Math.max(1, Math.round(bounds.width)), height: Math.max(1, Math.round(bounds.height)),
    };
    return !!(await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
    var v=window.SLSDECK_TOKEER_VIEW;if(!v||!v.m_browserView)return false;
    v.m_browserView.SetBounds(${b.x},${b.y},${b.width},${b.height});
    v.m_browserView.SetVisible(true);return true;
  }catch(e){return false;}})()`, 2000));
}
async function hideTokeerDiscordEmbedded() {
    await parkTokeerBrowserView();
}
async function showTokeerDiscordEmbedded(bounds) {
    if (!(await connectTokeerDiscordHidden()))
        return false;
    return positionTokeerDiscordEmbedded(bounds);
}
async function waitForExactUrl(url, timeoutMs = 6500) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const tabs = await listCdpTabs();
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
    const shared = await findSharedJsContext();
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
    const target = await waitForExactUrl(placeholder);
    if (!target?.webSocketDebuggerUrl)
        return null;
    // Keep Discord's SPA active while the Deck/QAM focus changes.
    await cdpCommand(target.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
    await cdpCommand(target.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
    const nav = await cdpCommand(target.webSocketDebuggerUrl, "Page.navigate", {
        url: TOKEER_DISCORD_URL,
        transitionType: "address_bar",
    }, 4000);
    if (!nav)
        return null;
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
    const tabs = await listCdpTabs();
    if (!tabs.length)
        return "CDP 8080/8081 returned no targets.";
    const ports = Array.from(new Set(tabs.map((t) => t.cdpPort).filter(Boolean))).join("/");
    const shared = tabs.some((t) => /SharedJSContext/i.test(String(t.title || "")));
    return `Steam CDP is active on ${ports || "an unknown port"} (${tabs.length} targets; SharedJSContext ${shared ? "found" : "missing"}).`;
}
async function navigateDiscordTabToTokeer(tab) {
    if (!tab.webSocketDebuggerUrl)
        return false;
    const liveUrl = await resolveTabUrl(tab);
    if (liveUrl.includes(TOKEER_CHANNEL))
        return true;
    const nav = await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
        url: TOKEER_DISCORD_URL,
        transitionType: "address_bar",
    }, 4000);
    return !!nav;
}
const SNAPSHOT_EXPR = `(function(){try{
  var id=${JSON.stringify(TARGET_MESSAGE)};
  var exact=document.querySelector('[data-list-item-id$="-'+id+'"]') || (document.querySelector('#message-accessories-'+id) && document.querySelector('#message-accessories-'+id).closest('[role="article"]')) || (document.querySelector('#message-reactions-'+id) && document.querySelector('#message-reactions-'+id).closest('[role="article"]'));
  var arts=[].slice.call(document.querySelectorAll('[role="article"]'));
  var controls=function(a){return [].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"],button[aria-expanded]'));};
  var article=exact || arts.reverse().find(function(a){var t=(a.innerText||'');return controls(a).length>0 && /steam|games? listed|keys? remaining|high demand|tokeer/i.test(t);});
  if(!article) return {found:false,selectors:[],error:'Discord is open, but the Tokeer activation panel is not rendered. Sign in if needed, open the Linux activation channel, and press Refresh.'};
  var text=(article.innerText||'').replace(/\u00a0/g,' ');
  var n=function(re){var m=text.match(re);return m?Number(m[1]):undefined};
  var sv=function(re){var m=text.match(re);return m?m[1].trim():undefined};
  var selects=controls(article).filter(function(e){return e.getAttribute('aria-haspopup')==='listbox'||e.getAttribute('role')==='combobox';}).map(function(e,i){
    var label=(e.innerText||e.textContent||'').trim();
    return {index:i,label:label,disabled:e.getAttribute('aria-disabled')==='true'};
  });
  return {found:true,steamStatus:sv(/Steam\\s*:\\s*([^\\n]+)/i),gamesListed:n(/Games listed:\\s*(\\d+)/i),steamGames:n(/Games listed:[\\s\\S]*?Steam[^\\d]*(\\d+)/i),keysRemaining:n(/Keys remaining:\\s*(\\d+)/i),highDemand:n(/High demand:\\s*(\\d+)/i),selectors:selects,rawText:text.slice(0,12000)};
}catch(e){return {found:false,selectors:[],error:String(e)};}})()`;
async function readTokeerDiscord() {
    const tab = await findDiscordTab();
    if (!tab?.webSocketDebuggerUrl) {
        const diag = await cdpDiagnostic();
        return { found: false, selectors: [], error: `No Discord page found in Steam CDP. ${diag}` };
    }
    if (!tab.url?.includes(TOKEER_CHANNEL)) {
        return { found: false, selectors: [], tabUrl: tab.url, error: "Discord is visible in Steam CEF, but it is on a different page. Press ‘Open Tokeer Discord’ to return to the activation panel." };
    }
    const snap = await evalDetailed(tab.webSocketDebuggerUrl, SNAPSHOT_EXPR);
    if (snap.error)
        return { found: false, selectors: [], tabUrl: tab.url, error: `Discord DOM evaluation failed: ${snap.error}` };
    if (!snap.value || typeof snap.value !== "object")
        return { found: false, selectors: [], tabUrl: tab.url, error: "Discord DOM snapshot returned no object." };
    return { ...snap.value, selectors: Array.isArray(snap.value.selectors) ? snap.value.selectors : [], tabUrl: tab.url };
}
async function openSelectorAndReadOptions(index) {
    const tab = await findDiscordTab();
    if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL))
        return [];
    const clickExpr = `(function(){try{var id=${JSON.stringify(TARGET_MESSAGE)};var arts=[].slice.call(document.querySelectorAll('[role="article"]'));var a=document.querySelector('[data-list-item-id$="-'+id+'"]')||document.querySelector('#message-accessories-'+id)?.closest('[role="article"]')||arts.reverse().find(function(x){return x.querySelector('[aria-haspopup="listbox"],[role="combobox"]')&&/steam|games?|keys?|tokeer/i.test(x.innerText||'');});var xs=a?[].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"]')).filter(function(x){return x.getAttribute('aria-haspopup')==='listbox'||x.getAttribute('role')==='combobox';}):[];var e=xs[${Number(index)}];if(!e)return false;var r=e.getBoundingClientRect(),o={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;e.dispatchEvent(new C(n,o));});return true;}catch(e){return false;}})()`;
    const ok = await evalJson(tab.webSocketDebuggerUrl, clickExpr);
    if (!ok)
        return [];
    await new Promise((r) => setTimeout(r, 450));
    const optionsExpr = `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
    var boxes=[].slice.call(document.querySelectorAll('[role="listbox"]')).filter(visible);
    var root=boxes.length?boxes[boxes.length-1]:document;
    var rows=[].slice.call(root.querySelectorAll('[role="option"]')).filter(visible);
    if(!rows.length)rows=[].slice.call(document.querySelectorAll('[role="option"]')).filter(visible);
    var labels=rows.map(function(e){return (e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();}).filter(Boolean);
    // Tokeer's game rows carry availability text. If those are present, keep
    // only them and discard Discord navigation/notification menu entries.
    var games=labels.filter(function(t){return /\\b\\d+\\s+of\\s+\\d+\\s+remaining\\s*\\(\\d+%\\)/i.test(t);});
    return JSON.stringify(games.length?games:labels);
  }catch(e){return '[]';}})()`;
    const raw = await evalJson(tab.webSocketDebuggerUrl, optionsExpr);
    try {
        return JSON.parse(String(raw || "[]"));
    }
    catch {
        return [];
    }
}
async function chooseSelectorOption(index, label) {
    const tab = await findDiscordTab();
    if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL))
        return false;
    const visibleExpr = `(function(){try{var want=${JSON.stringify(label)};return [].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"]')).some(function(e){var r=e.getBoundingClientRect(),t=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();return r.width>0&&r.height>0&&t===want;});}catch(e){return false;}})()`;
    const alreadyOpen = !!(await evalJson(tab.webSocketDebuggerUrl, visibleExpr));
    if (!alreadyOpen)
        await openSelectorAndReadOptions(index);
    const expr = `(function(){try{var want=${JSON.stringify(label)};var o=[].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"]')).find(function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim()===want;});if(!o)return false;var r=o.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;o.dispatchEvent(new C(n,p));});return true;}catch(e){return false;}})()`;
    return !!(await evalJson(tab.webSocketDebuggerUrl, expr));
}
const TICKET_GATE_EXPR = `(function(){try{
  var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
  for(var i=0;i<arts.length;i++){
    var a=arts[i], bs=[].slice.call(a.querySelectorAll('button'));
    for(var j=0;j<bs.length;j++){
      var b=bs[j], label=(b.innerText||b.textContent||b.getAttribute('aria-label')||'').trim();
      if(/(?:read|agree|watched|tutorial|continue|confirm)/i.test(label) && /(?:tokeer|activation|ticket|tutorial)/i.test((a.innerText||'')+' '+label)){
        return JSON.stringify({found:true,label:label,disabled:b.disabled||b.getAttribute('aria-disabled')==='true',messageText:(a.innerText||'').slice(0,5000)});
      }
    }
  }
  return JSON.stringify({found:false,error:'Waiting for the newest Tokeer confirmation message…'});
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
async function clickLatestTicketGate() {
    const tab = await findDiscordTab();
    if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL))
        return { success: false, error: "Tokeer activation channel is not open." };
    const expr = `(function(){try{
    var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
    for(var i=0;i<arts.length;i++){
      var bs=[].slice.call(arts[i].querySelectorAll('button'));
      for(var j=0;j<bs.length;j++){
        var b=bs[j], label=(b.innerText||b.textContent||b.getAttribute('aria-label')||'').trim();
        if(/(?:read|agree|watched|tutorial|continue|confirm)/i.test(label) && /(?:tokeer|activation|ticket|tutorial)/i.test((arts[i].innerText||'')+' '+label) && !b.disabled && b.getAttribute('aria-disabled')!=='true'){var r=b.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;b.dispatchEvent(new C(n,p));});return true;}
      }
    }
    return false;
  }catch(e){return false;}})()`;
    const ok = !!(await evalJson(tab.webSocketDebuggerUrl, expr));
    return ok ? { success: true, fromUrl: tab.url } : { success: false, error: "The green ticket confirmation button is not ready yet." };
}
const TICKET_CONTEXT_EXPR = `(function(){try{
  var text=(document.body.innerText||'').replace(/\u00a0/g,' ');
  var m=text.match(/tokeer\\s+verify\\s+(\\d{3,})/i)||text.match(/bash\\s+-s\\s+--\\s+(\\d{3,})/i)||text.match(/(?:steam\\s*)?app\\s*id\\D{0,12}(\\d{3,})/i)||location.href.match(/[?&]appid=(\\d{3,})/i);
  return JSON.stringify(m?{found:true,appid:Number(m[1]),rawText:text.slice(0,16000)}:{found:false,error:'Ticket opened, waiting for the setup commands…'});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
const TICKET_LINK_EXPR = `(function(){try{
  var channel=${JSON.stringify(TOKEER_CHANNEL)};
  var guild=${JSON.stringify(`/channels/${GUILD_ID}/`)};
  var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
  for(var i=0;i<Math.min(arts.length,30);i++){
    var a=arts[i], text=(a.innerText||'').replace(/\u00a0/g,' ');
    if(!/(?:ticket|activation|private|continue|created|opened)/i.test(text))continue;
    var links=[].slice.call(a.querySelectorAll('a[href*="/channels/"]'));
    for(var j=0;j<links.length;j++){
      var href=String(links[j].href||links[j].getAttribute('href')||'');
      if(href.indexOf(guild)>=0 && href.indexOf(channel)<0)return JSON.stringify({found:true,url:href,text:text.slice(0,3000)});
    }
  }
  return JSON.stringify({found:false});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
async function waitForTicketContext(fromUrl = "", timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    let lastError = "Waiting for Tokeer ticket…";
    while (Date.now() < deadline) {
        const tabs = await listCdpTabs();
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
        for (const tab of candidates) {
            if (!tab.webSocketDebuggerUrl)
                continue;
            const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_CONTEXT_EXPR);
            try {
                const parsed = JSON.parse(String(raw || ""));
                if (parsed?.found && parsed?.appid)
                    return { ...parsed, url: tab.url };
                if (parsed?.error)
                    lastError = parsed.error;
            }
            catch { }
            // Ticket bots often post a private-channel link instead of changing the
            // current SPA route. Discover that link from recent messages and move the
            // same hidden target into it.
            try {
                const linkRaw = await evalJson(tab.webSocketDebuggerUrl, TICKET_LINK_EXPR);
                const link = JSON.parse(String(linkRaw || ""));
                if (link?.found && looksLikeDiscordUrl(link.url || "")) {
                    await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
                        url: String(link.url), transitionType: "link",
                    }, 4000);
                    lastError = "Ticket found; waiting for its setup commands…";
                }
            }
            catch { }
        }
        await new Promise((r) => setTimeout(r, 600));
    }
    return { found: false, error: lastError || "Timed out waiting for the Tokeer ticket/thread." };
}
/** Connect the automation surface without putting Discord on screen. The
 * BrowserView shares Steam CEF's Discord session, so a prior visible login is
 * reused. */
async function connectTokeerDiscordHidden() {
    // Reuse only our managed BrowserView. A normal Steam external-web tab may be
    // readable through CDP but cannot be repositioned inside the plugin page.
    if (await hasTokeerBrowserView()) {
        try {
            // Reuse only the CDP target tagged by createTokeerDiscordBrowserView.
            // A user's manual/login Discord tab is readable too, but it is not the
            // BrowserView that positionTokeerDiscordEmbedded() can move.
            const existing = await findManagedTokeerTab();
            if (existing?.webSocketDebuggerUrl && await navigateDiscordTabToTokeer(existing)) {
                try {
                    await parkTokeerBrowserView();
                }
                catch { }
                try {
                    await cdpCommand(existing.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
                }
                catch { }
                return true;
            }
        }
        catch { }
    }
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

const inputStyle = { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,.25)", background: "rgba(0,0,0,.22)", color: "inherit" };
const checks = (v) => v?.checks || { installed: false, prefix: false, hook: false, launchOpt: false, proton: null };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function TokeerSection() {
    const [discord, setDiscord] = SP_REACT.useState(null);
    const [runtime, setRuntime] = SP_REACT.useState(null);
    const [verify, setVerify] = SP_REACT.useState(null);
    const [activation, setActivation] = SP_REACT.useState("");
    const [busy, setBusy] = SP_REACT.useState("");
    const [message, setMessage] = SP_REACT.useState("");
    const [options, setOptions] = SP_REACT.useState({});
    const [selectedMenus, setSelectedMenus] = SP_REACT.useState({});
    const [selectedGame, setSelectedGame] = SP_REACT.useState("");
    const [gate, setGate] = SP_REACT.useState(null);
    const [ticket, setTicket] = SP_REACT.useState(null);
    const [embedded, setEmbedded] = SP_REACT.useState(false);
    const embeddedRef = SP_REACT.useRef(null);
    const refreshDiscord = async () => { try {
        setDiscord(await readTokeerDiscord());
    }
    catch { } };
    SP_REACT.useEffect(() => { tokeerRuntimeStatus().then(setRuntime).catch(() => { }); refreshDiscord(); const t = setInterval(refreshDiscord, 15000); return () => clearInterval(t); }, []);
    SP_REACT.useEffect(() => {
        if (!embedded) {
            hideTokeerDiscordEmbedded().catch(() => { });
            return;
        }
        let stopped = false;
        const bounds = () => {
            const el = embeddedRef.current;
            if (!el)
                return null;
            const r = el.getBoundingClientRect();
            const top = Math.max(0, r.top), bottom = Math.min(window.innerHeight, r.bottom);
            if (bottom - top < 24 || r.right <= 0 || r.left >= window.innerWidth)
                return null;
            return { x: Math.max(0, r.left), y: top, width: Math.min(window.innerWidth, r.right) - Math.max(0, r.left), height: bottom - top };
        };
        const place = async (first = false) => {
            const b = bounds();
            if (!b) {
                await hideTokeerDiscordEmbedded();
                return;
            }
            const ok = first ? await showTokeerDiscordEmbedded(b) : await positionTokeerDiscordEmbedded(b);
            if (first && !ok && !stopped)
                setMessage("Could not embed Discord. Use the visible login once, press B, then reconnect silently.");
        };
        let timer = null;
        const loop = async () => { if (stopped)
            return; await place(false); if (!stopped)
            timer = setTimeout(loop, 700); };
        const start = setTimeout(async () => { await place(true); await loop(); }, 60);
        return () => { stopped = true; clearTimeout(start); if (timer)
            clearTimeout(timer); hideTokeerDiscordEmbedded().catch(() => { }); };
    }, [embedded]);
    const appid = Number(ticket?.appid || 0);
    const openMenu = async (i, showMenu) => {
        setBusy("Reading live game list…");
        try {
            const items = await openSelectorAndReadOptions(i);
            setOptions((old) => ({ ...old, [i]: items }));
            setTimeout(() => showMenu?.(), 0);
        }
        finally {
            setBusy("");
        }
    };
    const connectHidden = async () => {
        setBusy("Connecting hidden Tokeer panel…");
        setMessage("Connecting to Discord in the background. Discord will stay hidden.");
        try {
            const ok = await connectTokeerDiscordHidden();
            if (!ok) {
                setMessage("Hidden Discord connection failed. Open Discord login once, sign in, press B, then retry.");
                return;
            }
            let state = await readTokeerDiscord();
            for (let i = 0; i < 30 && !state.found; i++) {
                await sleep(500);
                state = await readTokeerDiscord();
            }
            setDiscord(state);
            setMessage(state.found ? "Hidden Tokeer panel connected." : (state.error || "Discord connected, but the activation panel is still loading."));
        }
        catch (e) {
            setMessage(String(e));
        }
        finally {
            setBusy("");
        }
    };
    const waitForGate = async () => {
        setGate(null);
        for (let i = 0; i < 20; i++) {
            const g = await readLatestTicketGate();
            if (g.found) {
                setGate(g);
                setMessage("Tokeer is ready to open your private activation ticket.");
                return;
            }
            await sleep(500);
        }
        setMessage("The game was selected, but the green Tokeer confirmation button did not appear yet. Keep the activation channel open and retry refresh.");
    };
    const choose = async (index, label) => {
        setBusy(`Selecting ${label} in Discord…`);
        setSelectedGame(label);
        setGate(null);
        setTicket(null);
        setVerify(null);
        setSelectedMenus((old) => ({ ...old, [index]: label }));
        const ok = await chooseSelectorOption(index, label);
        if (!ok) {
            setMessage("Discord selection failed. Keep the Tokeer message open and retry.");
            setBusy("");
            return;
        }
        setBusy("Waiting for Tokeer confirmation…");
        setMessage(`Selected ${label}. Waiting for the newest bot message…`);
        await waitForGate();
        setBusy("");
    };
    const openTicket = async () => {
        setBusy("Opening Tokeer ticket…");
        setMessage("Pressing the real green Discord confirmation and waiting for the ticket/thread…");
        try {
            const r = await clickLatestTicketGate();
            if (!r.success) {
                setMessage(r.error || "Could not press the Tokeer confirmation button.");
                return;
            }
            const ctx = await waitForTicketContext(r.fromUrl || "", 25000);
            setTicket(ctx);
            if (ctx.found && ctx.appid) {
                setMessage(`Ticket opened for ${selectedGame || "selected game"}. Tokeer reported Steam AppID ${ctx.appid}. No manual AppID entry is needed.`);
            }
            else {
                setMessage(ctx.error || "Ticket opened, but the AppID commands were not found yet.");
            }
        }
        catch (e) {
            setMessage(String(e));
        }
        finally {
            setBusy("");
        }
    };
    const prepare = async () => {
        if (!appid)
            return setMessage("Open the Tokeer ticket first so SLSDeck can read its AppID.");
        setBusy("Preparing Tokeer…");
        setMessage(`Preparing ${selectedGame || `AppID ${appid}`} using the AppID supplied by the Tokeer ticket. Steam may restart.`);
        try {
            const r = await tokeerPrepare(appid);
            setMessage(r.success ? "Prepare complete. If Steam restarted, reopen SLSDeck/Discord and press Verify." : (r.error || r.output || "Prepare failed."));
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
        if (!appid)
            return setMessage("Open the Tokeer ticket first so SLSDeck can read its AppID.");
        setBusy("Verifying setup…");
        try {
            const r = await tokeerVerify(appid);
            setVerify(r);
            setMessage(r.success ? "Setup verified. Copy the TLX1 and paste it into the open Discord ticket." : (r.error || "Verification failed."));
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
        setBusy("Writing activation ticket…");
        try {
            const r = await tokeerRedeem(activation.trim());
            setMessage(r.success ? "Activation written successfully. Launch the game from Steam." : (r.error || r.output || "Activation failed."));
        }
        catch (e) {
            setMessage(String(e));
        }
        finally {
            setBusy("");
        }
    };
    const c = checks(verify || undefined);
    return SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "1. Choose game in Tokeer", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: .75, lineHeight: 1.45 }, children: "SLSDeck mirrors the real Linux activation panel in your logged-in Discord Steam-CEF tab. Pick a game here; Discord remains the source of truth for availability, remaining keys and the Steam AppID." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: connectHidden, children: "Connect Tokeer silently" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => openTokeerDiscord(), children: "Open Discord login / manual view" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => setEmbedded(v => !v), children: embedded ? "Hide embedded Discord" : "Show embedded Discord" }) }), embedded && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { ref: embeddedRef, style: { width: "100%", height: 420, border: "1px solid rgba(255,255,255,.22)", borderRadius: 6, background: "rgba(0,0,0,.35)", boxSizing: "border-box" } }) }), discord?.found && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, lineHeight: 1.6 }, children: ["Steam: ", SP_JSX.jsx("b", { children: discord.steamStatus || "Unknown" }), " \u00B7 Games: ", SP_JSX.jsx("b", { children: discord.gamesListed ?? "?" }), " \u00B7 Keys: ", SP_JSX.jsx("b", { children: discord.keysRemaining ?? "?" }), " \u00B7 High demand: ", SP_JSX.jsx("b", { children: discord.highDemand ?? "?" })] }) }), (discord?.selectors || []).map(s => SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: s.label || `Game menu ${s.index + 1}`, description: "Live game list from the Tokeer Discord panel", disabled: s.disabled || !!busy, rgOptions: (options[s.index] || []).map(x => ({ data: x, label: x })), selectedOption: selectedMenus[s.index] || null, strDefaultLabel: s.label || "Choose a game", onMenuWillOpen: (showMenu) => openMenu(s.index, showMenu), onChange: (o) => choose(s.index, String(o.data)) }) }, s.index)), !discord?.found && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: .7 }, children: discord?.error || "Open the Linux activation message once and leave the Discord tab alive." }) })] }), (selectedGame || gate) && SP_JSX.jsxs(DFL.PanelSection, { title: "2. Open activation ticket", children: [selectedGame && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12 }, children: ["Selected: ", SP_JSX.jsx("b", { children: selectedGame })] }) }), gate?.found ? SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy || gate.disabled, onClick: openTicket, children: gate.label || "✅ I've read this & watched the tutorial" }) }) : SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: waitForGate, children: "Refresh confirmation" }) }), ticket?.found && ticket.appid && SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11 }, children: ["Ticket detected \u00B7 Steam AppID ", SP_JSX.jsx("b", { children: ticket.appid }), " (read automatically from Tokeer's commands)"] }) })] }), ticket?.found && ticket.appid && SP_JSX.jsxs(DFL.PanelSection, { title: "3. Prepare & verify", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11 }, children: ["Runtime: ", SP_JSX.jsx("b", { children: runtime?.installed ? "Installed" : "Not prepared" }), " \u00B7 Default/free cooldown: ", SP_JSX.jsx("b", { children: "48 hours" })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: prepare, disabled: !!busy, children: "Prepare game" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: runVerify, disabled: !!busy, children: "Verify setup / generate TLX1" }) })] }), busy && SP_JSX.jsx(DFL.PanelSection, { title: "Working", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 14, height: 14, marginRight: 8 } }), busy] }) }) }), message && SP_JSX.jsx(DFL.PanelSection, { title: "Status", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, lineHeight: 1.45 }, children: message }) }) }), verify && SP_JSX.jsxs(DFL.PanelSection, { title: "Verify result", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, lineHeight: 1.7, width: "100%" }, children: [SP_JSX.jsxs("div", { children: [c.installed ? "✓" : "✗", " Game installed"] }), SP_JSX.jsxs("div", { children: [c.prefix ? "✓" : "✗", " Proton prefix"] }), SP_JSX.jsxs("div", { children: [c.hook ? "✓" : "✗", " Native hook"] }), SP_JSX.jsxs("div", { children: [c.launchOpt ? "✓" : "✗", " Launch option"] }), SP_JSX.jsxs("div", { children: ["Proton: ", SP_JSX.jsx("b", { children: c.proton || "unknown" })] })] }) }), verify.code && SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: copyTlx, children: "Copy TLX1 verification code" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 9, wordBreak: "break-all", maxHeight: 90, overflowY: "auto", opacity: .7 }, children: verify.code }) })] })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "4. Redeem activation", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("input", { style: inputStyle, placeholder: "Activation code from Discord", value: activation, onChange: (e) => setActivation(e.target.value.trim()) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy || !activation, onClick: redeem, children: "Activate / write ticket" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 10, opacity: .7, lineHeight: 1.45 }, children: "Codes are single-use and expire in about 30 minutes. Cooldowns are shared with UbiTokeer: Free 48h \u00B7 Donator 24h \u00B7 Lua Basic 12h \u00B7 Lua Pro 6h \u00B7 Elite/no-cooldown role: no standard cooldown." }) })] })] });
}

function fmtSize$1(bytes) {
    if (!bytes)
        return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < u.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}
function gameLabel(appid) {
    const name = appDisplayName(appid);
    return name ? `${name} (${appid})` : `App ${appid}`;
}
/**
 * Steam Workshop mods: paste a mod or collection ID/URL, resolve the owning
 * game, and (if that game is installed) download via SteamCMD straight into the
 * game's own workshop content dir. Below, manage what's already installed
 * per-game: enable/disable (.disabled rename) or remove.
 */
function ModsSection() {
    const [input, setInput] = SP_REACT.useState("");
    const [resolved, setResolved] = SP_REACT.useState(null);
    const [resolving, setResolving] = SP_REACT.useState(false);
    const [progress, setProgress] = SP_REACT.useState(null);
    const pollRef = SP_REACT.useRef(null);
    const [results, setResults] = SP_REACT.useState([]);
    const [searching, setSearching] = SP_REACT.useState(false);
    const [searchNote, setSearchNote] = SP_REACT.useState("");
    const debRef = SP_REACT.useRef(null);
    const [games, setGames] = SP_REACT.useState([]);
    const [openGame, setOpenGame] = SP_REACT.useState(null);
    const [mods, setMods] = SP_REACT.useState([]);
    const [busy, setBusy] = SP_REACT.useState(false);
    const loadGames = async () => {
        try {
            const r = await wsListGames();
            if (r.success)
                setGames(r.games || []);
        }
        catch { }
    };
    const [hubBusy, setHubBusy] = SP_REACT.useState(null);
    const getWsManifest = async (appid) => {
        setHubBusy(appid);
        try {
            const r = await hubcapWorkshopManifest(appid);
            toaster.toast({
                title: "Workshop manifest",
                body: r.success
                    ? `Fetched & published (${Math.round((r.bytes || 0) / 1024)} KB). Restart Steam to use it.`
                    : r.error || "Failed (needs a Hubcap key with workshop quota).",
            });
        }
        catch (e) {
            toaster.toast({ title: "Workshop manifest", body: String(e) });
        }
        finally {
            setHubBusy(null);
        }
    };
    const looksLikeId = (t) => /(?:[?&]id=\d+)|^\s*\d{6,}\s*$/.test(t.trim());
    const runSearch = async (q) => {
        setSearching(true);
        setResolved(null);
        try {
            const r = await wsSearch(q, 40);
            if (r.success) {
                setResults(r.results || []);
                setSearchNote(r.note === "no_installed_games"
                    ? "No SLS-added games are installed yet — add and install a game first."
                    : (r.results || []).length === 0
                        ? "No matching Workshop items in your installed games."
                        : "");
            }
        }
        catch {
            /* ignore */
        }
        finally {
            setSearching(false);
        }
    };
    SP_REACT.useEffect(() => {
        loadGames();
        runSearch(""); // initial browse: popular mods across your installed SLS games
        return () => {
            if (pollRef.current)
                clearInterval(pollRef.current);
            if (debRef.current)
                clearTimeout(debRef.current);
        };
    }, []);
    const onInput = (v) => {
        setInput(v);
        if (debRef.current)
            clearTimeout(debRef.current);
        const q = v.trim();
        if (looksLikeId(q)) {
            setResults([]);
            debRef.current = setTimeout(() => doResolve(q), 400);
        }
        else {
            debRef.current = setTimeout(() => runSearch(q), 500);
        }
    };
    const doResolve = async (text) => {
        const q = (text ?? input).trim();
        if (!q)
            return;
        setResolving(true);
        setResolved(null);
        try {
            const r = await wsResolve(q);
            setResolved(r);
            if (!r.success)
                toaster.toast({ title: "Workshop", body: r.error || "Could not resolve" });
        }
        catch (e) {
            toaster.toast({ title: "Workshop", body: String(e) });
        }
        finally {
            setResolving(false);
        }
    };
    const pollProgress = (jobId) => {
        if (pollRef.current)
            clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const r = await wsDownloadState(jobId);
                const s = r.state || {};
                setProgress({
                    done: s.done || 0,
                    total: s.total || 0,
                    status: s.status || "",
                    current: s.current,
                });
                if (s.status === "done" || s.status === "failed") {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                    const failed = (s.failed || []).length;
                    toaster.toast({
                        title: "Workshop",
                        body: s.status === "done"
                            ? `Installed ${s.done}/${s.total} item(s)`
                            : `Finished with ${failed} failure(s)`,
                    });
                    loadGames();
                }
            }
            catch { }
        }, 1500);
    };
    const doDownload = () => runDownload(input.trim());
    const runDownload = async (q) => {
        if (!q)
            return;
        setBusy(true);
        try {
            const r = await wsDownload(q);
            if (!r.success) {
                if (r.error === "owned_game") {
                    toaster.toast({
                        title: "Workshop",
                        body: `${r.title || gameLabel(r.appid || 0)} is a game you own — mods only install for SLSDeck-added or non-Steam games.`,
                    });
                }
                else if (r.error === "not_installed") {
                    toaster.toast({
                        title: "Workshop",
                        body: `Install ${r.title || gameLabel(r.appid || 0)} first — mods install into the game's folder.`,
                    });
                }
                else {
                    toaster.toast({ title: "Workshop", body: r.error || "Download failed" });
                }
                return;
            }
            setProgress({ done: 0, total: r.count || 1, status: "queued" });
            if (r.job)
                pollProgress(r.job);
        }
        catch (e) {
            toaster.toast({ title: "Workshop", body: String(e) });
        }
        finally {
            setBusy(false);
        }
    };
    const openManage = async (appid) => {
        if (openGame === appid) {
            setOpenGame(null);
            setMods([]);
            return;
        }
        setOpenGame(appid);
        setBusy(true);
        try {
            const r = await wsListMods(appid);
            if (r.success)
                setMods(r.mods || []);
        }
        finally {
            setBusy(false);
        }
    };
    const toggleMod = async (appid, mod) => {
        setBusy(true);
        try {
            const r = await wsSetEnabled(appid, mod.modid, !mod.enabled);
            if (r.success) {
                setMods((prev) => prev.map((m) => (m.modid === mod.modid ? { ...m, enabled: !mod.enabled } : m)));
            }
            else {
                toaster.toast({ title: "Workshop", body: r.error || "Failed" });
            }
        }
        finally {
            setBusy(false);
        }
    };
    const deleteMod = async (appid, mod) => {
        setBusy(true);
        try {
            const r = await wsRemove(appid, mod.modid);
            if (r.success) {
                setMods((prev) => prev.filter((m) => m.modid !== mod.modid));
                loadGames();
            }
            else {
                toaster.toast({ title: "Workshop", body: r.error || "Failed" });
            }
        }
        finally {
            setBusy(false);
        }
    };
    const dl = progress;
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Find a Workshop mod", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", flexDirection: "column" }, children: SP_JSX.jsx(DFL.TextField, { label: "Search your games' Workshop, or paste a mod/collection ID/URL", value: input, onChange: (e) => onInput(e.target.value), disabled: busy }) }) }), searching && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), " Searching Workshop\u2026"] }) })), !!searchNote && !searching && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.7, padding: "2px 0" }, children: searchNote }) })), !searching &&
                        results.map((it) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => runDownload(it.modid), disabled: busy, children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: it.title }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: [it.gameName || `App ${it.appid}`, it.subs ? ` · ${it.subs.toLocaleString()} subs` : ""] })] }) }) }, it.modid))), looksLikeId(input) && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => doResolve(), disabled: resolving || busy || !input.trim(), children: resolving ? "Resolving…" : "Look up pasted ID" }) })), resolved?.success && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 13, padding: "2px 0" }, children: [SP_JSX.jsxs("div", { style: { fontWeight: 600 }, children: [resolved.title, resolved.isCollection ? ` · collection (${resolved.children?.length || 0} items)` : ""] }), SP_JSX.jsxs("div", { style: { opacity: 0.8 }, children: ["Game: ", gameLabel(resolved.appid || 0)] }), SP_JSX.jsx("div", { style: { color: resolved.allowed ? "#58c578" : "#f5a623" }, children: resolved.allowed
                                                ? "✓ SLSDeck-added / non-Steam game"
                                                : "• Owned Steam game — not eligible (SLSDeck-added or non-Steam only)" }), resolved.allowed && (SP_JSX.jsx("div", { style: { color: resolved.installed ? "#58c578" : "#f5a623" }, children: resolved.installed ? "✓ Game is installed" : "• Game not installed — install it first" }))] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doDownload, disabled: busy || !resolved.allowed || !resolved.installed || (!!dl && dl.status !== "done" && dl.status !== "failed"), children: resolved.isCollection ? "Download collection" : "Download mod" }) })] })), dl && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 }, children: [dl.status !== "done" && dl.status !== "failed" && SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), SP_JSX.jsx("span", { children: dl.status === "done"
                                        ? `Done — ${dl.done}/${dl.total}`
                                        : dl.status === "failed"
                                            ? `Failed — ${dl.done}/${dl.total} ok`
                                            : `${dl.status} ${dl.done}/${dl.total}${dl.current ? ` (item ${dl.current})` : ""}` })] }) }))] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Installed mods", children: [games.length === 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.7 }, children: "No workshop mods installed yet." }) })), games.map((g) => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", onClick: () => openManage(g.appid), children: [gameLabel(g.appid), " \u2014 ", g.modCount, " mod", g.modCount === 1 ? "" : "s", openGame === g.appid ? " ▲" : " ▼"] }) }), openGame === g.appid && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [busy && mods.length === 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Spinner, { style: { width: 20, height: 20 } }) })), mods.map((m) => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: m.title ? m.title : `Mod ${m.modid}`, description: `${m.modid} · ${fmtSize$1(m.sizeBytes)}`, checked: m.enabled, disabled: busy, onChange: () => toggleMod(g.appid, m) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", onClick: () => deleteMod(g.appid, m), disabled: busy, children: ["Remove mod ", m.modid] }) })] }, m.modid))), !busy && mods.length === 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.7 }, children: "No mods found." }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: hubBusy === g.appid, onClick: () => getWsManifest(g.appid), children: hubBusy === g.appid ? "Fetching…" : "Fetch Workshop manifest (Hubcap)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6 }, children: "For account-gated workshop content: pulls this game's Workshop manifest from Hubcap (needs a Hubcap key + workshop quota) and publishes it so the engine can serve the workshop depot." }) })] }))] }, g.appid)))] })] }));
}

function fmtSize(bytes) {
    if (!bytes)
        return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < u.length - 1) {
        n /= 1024;
        i++;
    }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}
function fmtDate(mtime) {
    try {
        return new Date(mtime * 1000).toLocaleString();
    }
    catch {
        return "";
    }
}
/**
 * Export / import an SLSDeck setup — the SLSsteam config (added games), the
 * ManifestStore, depot keys, stplug-in luas, and plugin settings — as a single
 * .tar.gz in ~/Downloads. Restore lands them back in place but does NOT
 * re-activate injection (do that manually after, in case the client drifted).
 */
function BackupSection() {
    const [includeKeys, setIncludeKeys] = SP_REACT.useState(false);
    const [includeSaves, setIncludeSaves] = SP_REACT.useState(true);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [backups, setBackups] = SP_REACT.useState([]);
    const [confirmPath, setConfirmPath] = SP_REACT.useState(null);
    const refresh = async () => {
        try {
            const r = await listBackups();
            if (r.success)
                setBackups(r.backups || []);
        }
        catch {
            /* ignore */
        }
    };
    SP_REACT.useEffect(() => {
        refresh();
    }, []);
    const doExport = async () => {
        setBusy(true);
        try {
            const r = await createBackup("", includeKeys, includeSaves);
            if (r.success) {
                toaster.toast({
                    title: "SLSDeck backup",
                    body: `Saved ${r.fileCount ?? 0} files${r.saveCount ? ` (incl. ${r.saveCount} save files)` : ""} (${fmtSize(r.sizeBytes ?? 0)}) to Downloads${includeKeys ? "" : " — keys excluded"}`,
                });
                refresh();
            }
            else {
                toaster.toast({ title: "SLSDeck backup", body: r.error || "Export failed" });
            }
        }
        catch (e) {
            toaster.toast({ title: "SLSDeck backup", body: String(e) });
        }
        finally {
            setBusy(false);
        }
    };
    const doRestore = async (path) => {
        setBusy(true);
        setConfirmPath(null);
        try {
            const r = await restoreBackup(path);
            if (r.success) {
                toaster.toast({
                    title: "SLSDeck restore",
                    body: `Restored ${r.restoredCount ?? 0} files. Re-activate injection + restart Steam to apply.`,
                });
            }
            else {
                toaster.toast({ title: "SLSDeck restore", body: r.error || "Restore failed" });
            }
        }
        catch (e) {
            toaster.toast({ title: "SLSDeck restore", body: String(e) });
        }
        finally {
            setBusy(false);
        }
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Backup & restore", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Include API keys", description: "Off (default): your saved API keys are stripped from the export. On: keys are included \u2014 keep the file private.", checked: includeKeys, disabled: busy, onChange: setIncludeKeys }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Include game saves", description: "On (default): also back up each installed SLSDeck game's Proton-prefix saves (AppData, Saved Games, Documents). Can make the archive large.", checked: includeSaves, disabled: busy, onChange: setIncludeSaves }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doExport, disabled: busy, children: busy ? "Working…" : "Export backup to Downloads" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Backs up added games, manifests, depot keys, luas, and settings to ~/Downloads/slsdeck_backup_<time>.tar.gz." }) }), busy && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), " Working\u2026"] }) })), backups.length === 0 ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, opacity: 0.7 }, children: "No backups found in Downloads." }) })) : (backups.map((b) => (SP_JSX.jsx("div", { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => (confirmPath === b.path ? doRestore(b.path) : setConfirmPath(b.path)), disabled: busy, children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600, color: confirmPath === b.path ? "#f5a623" : undefined }, children: confirmPath === b.path ? "Tap again to confirm restore" : `Restore ${b.name}` }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: [fmtSize(b.sizeBytes), " \u00B7 ", fmtDate(b.mtime)] })] }) }) }) }, b.path)))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, color: "#f5a623", padding: "2px 2px" }, children: "\u26A0 Restore overwrites current config, manifests, and settings, then hands them back to you \u2014 but does NOT re-activate injection. After restoring, run the client fix if needed, then Activate injection and restart Steam." }) })] }));
}

// Auto-maintained Steam collection for SLS-added games.
//
// Steam has no native filter for "added by SLSDeck" — to Steam these games look
// like normal owned titles (that's the whole point of the SLSsteam hook), so a
// truly dynamic (filter-based) collection can't target them. Instead we keep a
// *static* collection ("SLSDeck") reconciled to the SLS appid set: create it if
// missing, add appids that are ours and absent, drop ones that are no longer
// ours. Reconciled on boot, after an add, and on a slow timer — so to the user
// it behaves like an auto-updating collection.
//
// Everything here touches undocumented SteamUI internals (collectionStore /
// appStore), whose method names drift between client versions. So every call is
// feature-detected and wrapped: on anything unexpected we log once and no-op —
// this must never throw into the library UI.
const COLLECTION_NAME = "SLSDeck";
let warned = false;
let syncing = false;
function warnOnce(msg, err) {
    if (warned)
        return;
    warned = true;
    try {
        console.warn(`SLSDeck collection: ${msg}`, err ?? "");
    }
    catch {
        /* ignore */
    }
}
function cStore() {
    return window.collectionStore;
}
function aStore() {
    return window.appStore;
}
/** Best-effort: overview objects Steam's Add/RemoveApps expect for these ids. */
function overviews(ids) {
    const app = aStore();
    const out = [];
    for (const id of ids) {
        try {
            const ov = app?.GetAppOverviewByAppID?.(id);
            if (ov)
                out.push(ov);
        }
        catch {
            /* skip */
        }
    }
    return out;
}
/** Is the collection store initialized enough to touch safely? Reading
 *  `userCollections` before the store loads throws — and because it's a MobX
 *  computed, that thrown exception gets CACHED, which then crashes Steam's own
 *  collection render (and Decky blames us). So we gate every access on a
 *  readiness probe that deliberately does NOT evaluate `userCollections`. */
function storeReady(cs) {
    try {
        if (!cs)
            return false;
        if (typeof cs.BIsInitialized === "function" && !cs.BIsInitialized())
            return false;
        // allAppsCollection is a plain, stable object present once the library store
        // has loaded — touching it doesn't evaluate the fragile userCollections
        // computed.
        if (!cs.allAppsCollection)
            return false;
        return typeof cs.GetUserCollectionsByName === "function";
    }
    catch {
        return false;
    }
}
/** Find the existing user collection with our name, or null. Prefers the store
 *  METHOD (which doesn't evaluate the throwing userCollections computed); only
 *  falls back to iterating userCollections if the method is missing. */
function findCollection(cs) {
    try {
        const byName = cs?.GetUserCollectionsByName?.(COLLECTION_NAME);
        if (byName && byName.length)
            return byName[0];
        if (byName)
            return null; // method exists and returned empty → no collection
    }
    catch {
        /* fall through to the (guarded) computed */
    }
    try {
        const list = cs?.userCollections || [];
        for (const c of list)
            if (c && c.displayName === COLLECTION_NAME)
                return c;
    }
    catch {
        /* ignore */
    }
    return null;
}
/** Current member appids of a collection, as a Set<number>. */
function membersOf(col) {
    const out = new Set();
    try {
        const apps = col?.apps;
        const keys = apps?.keys ? Array.from(apps.keys()) : [];
        for (const k of keys) {
            const n = Number(k);
            if (!Number.isNaN(n))
                out.add(n);
        }
    }
    catch {
        /* ignore */
    }
    return out;
}
/** The set of SLS-added appids (installed ∪ ever-added). */
async function slsAppIds() {
    const ids = new Set();
    try {
        const r = await getInstalledApps();
        if (r.success)
            (r.apps || []).forEach((a) => ids.add(Number(a.appid)));
    }
    catch {
        /* ignore */
    }
    try {
        const r = await getEverAdded();
        if (r.success)
            (r.appids || []).forEach((a) => ids.add(Number(a)));
    }
    catch {
        /* ignore */
    }
    ids.delete(NaN);
    return ids;
}
function setsEqual(a, b) {
    if (a.size !== b.size)
        return false;
    for (const x of a)
        if (!b.has(x))
            return false;
    return true;
}
/**
 * Reconcile the SLSDeck collection to the current SLS set. No-ops when the pref
 * is off, when the store API is missing, or when the collection already matches
 * (so it's cheap to call often). Never throws.
 */
async function syncSlsCollection() {
    if (syncing)
        return;
    syncing = true;
    try {
        let on = false;
        try {
            on = !!(await getGroupCollection()).enabled;
        }
        catch {
            on = false;
        }
        if (!on)
            return;
        const cs = cStore();
        if (!cs) {
            warnOnce("collectionStore unavailable");
            return;
        }
        // Bail (and retry on the next interval tick) until the store is initialized.
        // Touching userCollections early throws and MobX caches the exception, which
        // then crashes Steam's own collection UI — the "updated from an older plugin
        // and it's crashing" report. This gate is the fix.
        if (!storeReady(cs)) {
            return;
        }
        const desired = await slsAppIds();
        let col = findCollection(cs);
        // Nothing to group and no collection yet → don't create an empty one.
        if (!col && desired.size === 0)
            return;
        // Already in sync → skip the write entirely.
        if (col && setsEqual(membersOf(col), desired))
            return;
        const desiredIds = Array.from(desired);
        if (!col) {
            // Create a new collection seeded with the desired apps.
            try {
                const created = cs.NewUnsavedCollection?.(COLLECTION_NAME, undefined, desiredIds) ??
                    cs.NewUnsavedCollection?.(COLLECTION_NAME);
                if (!created) {
                    warnOnce("NewUnsavedCollection missing");
                    return;
                }
                // If the seed arg was ignored, add explicitly before saving.
                if (membersOf(created).size === 0 && desiredIds.length) {
                    created.AddApps?.(overviews(desiredIds));
                }
                await (created.Save?.() ?? Promise.resolve());
            }
            catch (e) {
                warnOnce("create failed", e);
            }
            return;
        }
        // Edit membership on the existing collection.
        try {
            const editable = col.AsDragDropCollection?.() ?? col;
            const current = membersOf(col);
            const toAdd = desiredIds.filter((id) => !current.has(id));
            const toRemove = Array.from(current).filter((id) => !desired.has(id));
            if (toAdd.length)
                editable.AddApps?.(overviews(toAdd));
            if (toRemove.length)
                editable.RemoveApps?.(overviews(toRemove));
            await (editable.Save?.() ?? col.Save?.() ?? Promise.resolve());
        }
        catch (e) {
            warnOnce("edit failed", e);
        }
    }
    catch (e) {
        warnOnce("sync failed", e);
    }
    finally {
        syncing = false;
    }
}

const ACTIONS_FIXES_QAM_KEY$1 = "slsdeck.actionsFixesQam";
const ACTIONS_FIXES_QAM_EVENT$1 = "slsdeck-actions-fixes-qam";
const DECKY_HV_VISIBLE_KEY = "slsdeck.showDeckyHv";
function readDeckyHvVisible() {
    try {
        return window.localStorage.getItem(DECKY_HV_VISIBLE_KEY) === "1";
    }
    catch {
        return false;
    }
}
/* ── Injection recovery (auto-heal after a Steam client update) ─────────── */
function AddDownloadToggle() {
    const [on, setOn] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        getAutoDownload().then((r) => setOn(!!r.enabled)).catch(() => { });
    }, []);
    return (SP_JSX.jsx(DFL.PanelSection, { title: "Adding games", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto restart after adding", description: "Auto restart Steam after adding a game.", checked: on, onChange: async (v) => { setOn(v); await setAutoDownload(v); } }) }) }));
}
function DlcCloudToggles() {
    const [autoDlc, setAutoDlc] = SP_REACT.useState(false);
    const [noCloud, setNoCloud] = SP_REACT.useState(false);
    const [noOwnedDlc, setNoOwnedDlc] = SP_REACT.useState(false);
    const [busy, setBusy] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        getAutoAddDlc().then((r) => setAutoDlc(!!r.enabled)).catch(() => { });
        getDisableCloud().then((r) => setNoCloud(!!r.enabled)).catch(() => { });
        getDisableDlcUnlockOwned().then((r) => setNoOwnedDlc(!!r.enabled)).catch(() => { });
    }, []);
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "DLC & cloud", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Add DLC automatically", description: "When adding a game, also register all its DLC depot keys (from the full manifest) so the base install downloads content DLC too. Richer with a Hubcap key set. Off by default.", checked: autoDlc, onChange: async (v) => { setAutoDlc(v); await setAutoAddDlc(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Disable DLC unlock on owned games", description: "Stop moon from auto-unlocking (unowned) DLC on games you legit own. Scans your library's owned games, resolves their DLC, and blacklists them in the engine. Can be slow on a big library. Off by default.", checked: noOwnedDlc, onChange: async (v) => {
                        setNoOwnedDlc(v);
                        setBusy(true);
                        try {
                            const owned = v ? listLibraryAppIds() : [];
                            const r = await setDisableDlcUnlockOwned(v, owned);
                            toaster.toast({ title: "SLSDeck", body: v ? `Blacklisted ${r.blacklisted ?? 0} DLC — reload Steam` : "DLC unlock restored — reload Steam" });
                        }
                        catch (e) {
                            toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
                        }
                        setBusy(false);
                    } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Disable Steam cloud on SLS games", description: "Turn off Steam cloud saves for games added via SLSsteam (avoids Valve's rejected-sync errors). Only affects added games, not your legit ones. Mutually exclusive with CloudRedirect. Off by default.", checked: noCloud, onChange: async (v) => { setNoCloud(v); await setDisableCloud(v); toaster.toast({ title: "SLSDeck", body: "Cloud setting written — reload Steam" }); } }) }), busy ? SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: "Scanning library\u2026" }) }) : null] }));
}
function InjectionRecovery() {
    const [reinject, setReinject] = SP_REACT.useState(false);
    const [repin, setRepin] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        getAutoReinject().then((r) => setReinject(!!r.enabled)).catch(() => { });
        getAutoClientRepin().then((r) => setRepin(!!r.enabled)).catch(() => { });
    }, []);
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Injection recovery", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto re-activate injection on boot", description: "If a Steam update leaves injection off, re-patch steam.sh on startup and fully restart Steam (steam -shutdown + relaunch through steam.sh) to apply it. Capped so it can't loop.", checked: reinject, onChange: async (v) => { setReinject(v); await setAutoReinject(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto re-pin Steam client on boot", description: "If injection broke after a client update, automatically run the client fix (h3adcr-b) \u2014 this pins/downgrades the client and REBOOTS. Heavy; capped. Leave off unless you want it fully hands-off.", checked: repin, onChange: async (v) => { setRepin(v); await setAutoClientRepin(v); } }) })] }));
}
/** Scrollable page body — SidebarNavigation panes don't scroll on their own. */
function Body({ children }) {
    return (SP_JSX.jsx("div", { style: { height: "100%", overflowY: "auto", padding: "6px 12px 40px 12px" }, children: children }));
}
/* ── Online-fix username (lives on the Game fixes tab) ─────────────────── */
function OnlineFixUsername() {
    const [saved, setSaved] = SP_REACT.useState("");
    const [draft, setDraft] = SP_REACT.useState("");
    const [auto, setAuto] = SP_REACT.useState("");
    SP_REACT.useEffect(() => {
        getOnlineUsername()
            .then((r) => {
            const u = r.success ? r.username || "" : "";
            setSaved(u);
            setDraft(u);
            setAuto(r.success ? r.auto || "" : "");
        })
            .catch(() => { });
    }, []);
    const save = async () => {
        await setOnlineUsername(draft.trim());
        setSaved(draft.trim());
        toaster.toast({ title: "SLSDeck", body: "Online-fix username saved" });
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Online-fix username", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Username", value: draft, onChange: (e) => setDraft(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: ["Name used by online-fix emulators. Blank = your Steam name", auto ? ` ("${auto}")` : "", ". Applied when a fix is installed."] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: save, disabled: draft.trim() === (saved ?? ""), children: "Save username" }) })] }));
}
/* ── Options pane (the old Advanced toggles) ───────────────────────────── */
function OptionsPane({ showDeckyHv, onShowDeckyHvChange, }) {
    const [dlc, setDlc] = SP_REACT.useState(false);
    const [dlcOwnedOnly, setDlcOwnedOnlyState] = SP_REACT.useState(true);
    const [groupCollection, setGroupCollectionState] = SP_REACT.useState(false);
    const [backupCustom, setBackupCustomState] = SP_REACT.useState(false);
    const [storeOn, setStoreOn] = SP_REACT.useState(true);
    const [pin, setPin] = SP_REACT.useState(true);
    const [noNet, setNoNet] = SP_REACT.useState(true);
    const [hideOwned, setHideOwned] = SP_REACT.useState(true);
    const [actionsFixesQam, setActionsFixesQam] = SP_REACT.useState(true);
    const [gamesQam, setGamesQam] = SP_REACT.useState(false);
    const [reinstallQam, setReinstallQam] = SP_REACT.useState(true);
    const [badgeSls, setBadgeSls] = SP_REACT.useState(true);
    const [badgeLegit, setBadgeLegit] = SP_REACT.useState(true);
    const [badgeDenuvo, setBadgeDenuvo] = SP_REACT.useState(true);
    const [badgeGamePage, setBadgeGamePage] = SP_REACT.useState(true);
    const [badgeStorePage, setBadgeStorePage] = SP_REACT.useState(true);
    const [badgeOnlineFix, setBadgeOnlineFix] = SP_REACT.useState(true);
    const [badgeFixed, setBadgeFixed] = SP_REACT.useState(true);
    const [badgeNonSteam, setBadgeNonSteam] = SP_REACT.useState(true);
    const [badgeNonSteamName, setBadgeNonSteamName] = SP_REACT.useState(true);
    const [badgeLibrary, setBadgeLibrary] = SP_REACT.useState(true);
    const [badgeEmoji, setBadgeEmoji] = SP_REACT.useState(false);
    const [autoFix, setAutoFixState] = SP_REACT.useState(false);
    const [libButtons, setLibButtons] = SP_REACT.useState(true);
    const [autoApply, setAutoApplyState] = SP_REACT.useState(false);
    const [autoRepoint, setAutoRepointState] = SP_REACT.useState(true);
    const [hideToolsQam, setHideToolsQamState] = SP_REACT.useState(true);
    const [achievements, setAchievementsState] = SP_REACT.useState(true);
    const [achMoon, setAchMoon] = SP_REACT.useState(true);
    SP_REACT.useEffect(() => {
        getDlcOption().then((r) => setDlc(!!r.enabled)).catch(() => { });
        getDlcOwnedOnly().then((r) => setDlcOwnedOnlyState(!!r.enabled)).catch(() => { });
        getGroupCollection().then((r) => setGroupCollectionState(!!r.enabled)).catch(() => { });
        getBackupCustom().then((r) => setBackupCustomState(!!r.enabled)).catch(() => { });
        getStoreDisabled().then((r) => setStoreOn(!r.disabled)).catch(() => { });
        getPinOnFix().then((r) => setPin(!!r.enabled)).catch(() => { });
        getNoInternetFix().then((r) => setNoNet(!!r.enabled)).catch(() => { });
        getAutoApply().then((r) => setAutoApplyState(!!r.enabled)).catch(() => { });
        getAutoRepoint().then((r) => setAutoRepointState(!!r.enabled)).catch(() => { });
        getAchievements().then((r) => { setAchievementsState(!!r.enabled); setAchMoon(r.moon !== false); }).catch(() => { });
        getHideToolsQam().then((r) => setHideToolsQamState(!!r.enabled)).catch(() => { });
        getHideOnOwned().then((r) => setHideOwned(!!r.enabled)).catch(() => { });
        getGamesInQam().then((r) => setGamesQam(!!r.enabled)).catch(() => { });
        getShowReinstallQam().then((r) => setReinstallQam(!!r.enabled)).catch(() => { });
        try {
            const raw = window.localStorage.getItem(ACTIONS_FIXES_QAM_KEY$1);
            setActionsFixesQam(raw == null ? true : raw === "1");
        }
        catch {
            setActionsFixesQam(true);
        }
        setBadgeEmoji(getEmojiBadgesEnabled());
        getBadgeOptions()
            .then((r) => {
            if (!r.success)
                return;
            setBadgeSls(!!r.sls);
            setBadgeLegit(!!r.legit);
            setBadgeDenuvo(!!r.denuvo);
            setBadgeGamePage(!!r.gamePage);
            setBadgeStorePage(!!r.storePage);
            setBadgeOnlineFix(!!r.onlineFix);
            setBadgeFixed(!!r.fixed);
            setBadgeNonSteam(!!r.nonSteam);
            setBadgeNonSteamName(!!r.nonSteamName);
            setBadgeLibrary(!!r.library);
        })
            .catch(() => { });
        getLibraryButtons().then((r) => setLibButtons(!!r.enabled)).catch(() => { });
        getAutoFix().then((r) => setAutoFixState(!!r.enabled)).catch(() => { });
    }, []);
    return (SP_JSX.jsxs(Body, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "On-screen buttons", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Store buttons", description: "Floating Add / Fix bar on store game pages.", checked: storeOn, onChange: async (v) => {
                                setStoreOn(v);
                                await setStoreDisabled(!v);
                                toaster.toast({ title: "SLSDeck", body: v ? "Store buttons on" : "Store buttons off" });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Library buttons on game pages", description: "The Add / Fixes bar injected into the game's library page. Turn off to use only the Quick Access panel.", checked: libButtons, onChange: async (v) => { setLibButtons(v); await setLibraryButtons(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: libButtons ? "Hide actions on owned games" : "Hide actions on owned games (Quick Access)", description: "On game pages, hide Add with SLSsteam and Fixes for titles you already own (anything in your library that wasn't added by SLSsteam).", checked: hideOwned, onChange: async (v) => { setHideOwned(v); await setHideOnOwned(v); } }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Fixes", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "No internet fix", description: "When downloading a pinned build, Steam can fail with 'no internet connection' because the client fix's steam.cfg blocks its updater. This temporarily removes that block so the game downloads, then restores it once the download starts (so the Steam client can't self-update past the compatible build). On by default.", checked: noNet, onChange: async (v) => { setNoNet(v); await setNoInternetFix(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Pin game version on fix", description: "Locks a game to its current version when a fix is applied so an update can't break it. Cleared on un-fix.", checked: pin, onChange: async (v) => { setPin(v); await setPinOnFix(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-apply fix after update", description: "When a fix targets a specific build, pin it and update the game, then apply automatically once the download finishes. Off = guided: you press Apply after the download completes.", checked: autoApply, onChange: async (v) => { setAutoApplyState(v); await setAutoApply(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-fix launch target", description: "When a fix ships its own replacement exe, repoint Steam's launch to the game's real Binaries/Win64 exe so the fix actually runs (bypasses a broken launcher). Additive \u2014 your other launch options are kept. Per-game override lives under Quick Access \u2192 This game.", checked: autoRepoint, onChange: async (v) => { setAutoRepointState(v); await setAutoRepoint(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-apply fixes after adding", description: "When an add finishes, download and apply the online fix and/or Denuvo fix if available. A Denuvo fix also marks the game and installs the custom Proton.", checked: autoFix, onChange: async (v) => { setAutoFixState(v); await setAutoFix(v); } }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "DLC unlocking", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Unlock DLC when adding a game", description: "Marks the game's DLC as owned and auto-installs the matching in-process DLC unlocker when the game is on disk \u2014 SmokeAPI for Steam titles, Uplay R1/R2 for Ubisoft Connect titles (each only applies to games that use it). SLSsteam already unlocks most Steam DLC on its own. In-game (entitlement) DLC unlocks right away; DLC that downloads as separate files still needs those files.", checked: dlc, onChange: async (v) => { setDlc(v); await setDlcOption(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "DLC unlockers on owned games only", description: "Only show the CreamAPI, SmokeAPI and Ubisoft (Uplay R1/R2) DLC-unlock buttons on games you actually own \u2014 hide them on SLS-added games, where they do nothing. On by default.", checked: dlcOwnedOnly, onChange: async (v) => {
                                setDlcOwnedOnlyState(v);
                                await setDlcOwnedOnly(v);
                                toaster.toast({ title: "SLSDeck", body: v ? "DLC unlockers: owned games only" : "DLC unlockers: all games" });
                            } }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Quick Access menu", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Hide tools & diagnostics in Quick Access", description: "Hide the Tools and Diagnostics sections from the Quick Access panel for a cleaner menu. They remain here in Advanced.", checked: hideToolsQam, onChange: async (v) => { setHideToolsQamState(v); await setHideToolsQam(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Show Actions & fixes in Quick Access", description: "Show the per-game Actions & fixes section in Quick Access, above the installed-games list. Applies immediately and when the panel is reopened.", checked: actionsFixesQam, onChange: (v) => {
                                setActionsFixesQam(v);
                                try {
                                    window.localStorage.setItem(ACTIONS_FIXES_QAM_KEY$1, v ? "1" : "0");
                                    window.dispatchEvent(new CustomEvent(ACTIONS_FIXES_QAM_EVENT$1, { detail: v }));
                                }
                                catch { /* ignore */ }
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Show added games in Quick Access", description: "Move the added-games list into the Quick Access panel, under Actions & fixes (removes the Installed tab here). Applies when the panel is reopened.", checked: gamesQam, onChange: async (v) => { setGamesQam(v); await setGamesInQam(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Show Reinstall SLSsteam in Quick Access", description: "When SLSsteam is installed, show its Reinstall button in the Quick Access panel. Install still shows when it isn't installed yet.", checked: reinstallQam, onChange: async (v) => { setReinstallQam(v); await setShowReinstallQam(v); } }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Games & library", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Achievements (slsteam-moon)", description: achMoon
                                ? "Let added games unlock achievements — moon fetches the real schema live from Steam by impersonating an owner. Restart Steam after changing."
                                : "Needs the slsteam-moon engine. Stock SLSsteam ignores this setting (use SLScheevo to pre-generate achievements instead).", checked: achievements, onChange: async (v) => { setAchievementsState(v); await setAchievements(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Group SLS games into a collection", description: "Keep a Steam collection named 'SLSDeck' auto-synced with every game you added through SLSsteam, so they're easy to find among your owned titles. Updates on boot and as you add/remove games. Off by default; turning it off leaves the collection as-is.", checked: groupCollection, onChange: async (v) => {
                                setGroupCollectionState(v);
                                await setGroupCollection(v);
                                if (v) {
                                    syncSlsCollection().catch(() => { });
                                    toaster.toast({ title: "SLSDeck", body: "Building the SLSDeck collection…" });
                                }
                                else {
                                    toaster.toast({ title: "SLSDeck", body: "Collection sync off (existing collection kept)" });
                                }
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Backup custom manifests and fixes", description: "Include imported custom fixes and manifests (~/.local/share/SLSDeck) in the backup archive. When restored, they reappear in the Fixes and Download tabs. Off by default.", checked: backupCustom, onChange: async (v) => { setBackupCustomState(v); await setBackupCustom(v); } }) })] }), SP_JSX.jsx(AddDownloadToggle, {}), SP_JSX.jsx(DlcCloudToggles, {}), SP_JSX.jsx(InjectionRecovery, {}), SP_JSX.jsx(DFL.PanelSection, { title: "Advanced tools", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Show Hypervisor Bypass Module tab", description: "Show the Hypervisor Bypass Module controls in Advanced. Hidden by default; Anti-Denuvo uses the Tokeer page.", checked: showDeckyHv, onChange: (v) => onShowDeckyHvChange(v) }) }) }), SP_JSX.jsxs(DFL.PanelSection, { title: "Library badges", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Emoji Badges", description: "Replace each enabled badge with its emoji analogue: SLS \uD83C\uDFF4\u200D\u2620\uFE0F, Legit \uD83D\uDCB5, Fix \uD83D\uDD27, Online Fix \uD83C\uDF10, Denuvo \uD83D\uDC7A, Non-Steam \u2753. Disabled badges stay hidden.", checked: badgeEmoji, onChange: (v) => {
                                setBadgeEmoji(v);
                                setEmojiBadgesEnabled(v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "SLS badge", description: "Marks games added through SLSsteam.", checked: badgeSls, onChange: async (v) => {
                                setBadgeSls(v);
                                await setBadgeOption("sls", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Legit badge", description: "Marks games you actually own \u2014 Steam library titles that aren't SLSsteam additions or non-Steam shortcuts.", checked: badgeLegit, onChange: async (v) => {
                                setBadgeLegit(v);
                                await setBadgeOption("legit", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Denuvo badge", description: "Marks Denuvo-protected games, from Steam's own DRM notice (seeded with ryuu's bypass list). Shown on the right, so it can sit alongside the SLS or Legit badge.", checked: badgeDenuvo, onChange: async (v) => {
                                setBadgeDenuvo(v);
                                await setBadgeOption("denuvo", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Online-fix badge", description: "Marks games that have an online fix installed.", checked: badgeOnlineFix, onChange: async (v) => {
                                setBadgeOnlineFix(v);
                                await setBadgeOption("onlineFix", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Fix-applied badge (FIXED)", description: "Marks games with a non-online fix installed (ryuu / crack / generic). Online fixes get the Online-fix badge instead.", checked: badgeFixed, onChange: async (v) => {
                                setBadgeFixed(v);
                                await setBadgeOption("fixed", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Non-Steam badge", description: "Black NON-STEAM badge on non-Steam shortcuts.", checked: badgeNonSteam, onChange: async (v) => {
                                setBadgeNonSteam(v);
                                await setBadgeOption("nonSteam", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Non-Steam app-name badge", description: "Extra badge on non-Steam shortcuts showing the app name, taken from the target executable's folder.", checked: badgeNonSteamName, onChange: async (v) => {
                                setBadgeNonSteamName(v);
                                await setBadgeOption("nonSteamName", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Badges in library grid", description: "Show badges on library capsules and the home carousel.", checked: badgeLibrary, onChange: async (v) => {
                                setBadgeLibrary(v);
                                await setBadgeOption("library", v);
                                refreshBadges();
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Badges on game pages", description: "Also show these badges on a game's details page, not just on library capsules.", checked: badgeGamePage, onChange: async (v) => {
                                setBadgeGamePage(v);
                                await setBadgeOption("gamePage", v);
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Badges on store pages", description: "Show SLS / Denuvo / fix badges on the in-Steam store page (top-left). No Legit there \u2014 a store page isn't proof of ownership.", checked: badgeStorePage, onChange: async (v) => {
                                setBadgeStorePage(v);
                                await setBadgeOption("storePage", v);
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Non-Steam shortcuts are never badged \u2014 they're neither SLSsteam additions nor licensed Steam titles." }) })] }), SP_JSX.jsx(UpdatesSection, {}), SP_JSX.jsx(BackupSection, {})] }));
}
/* ── About pane ────────────────────────────────────────────────────────── */
function AboutPane() {
    return (SP_JSX.jsx(Body, { children: SP_JSX.jsx(HelpHub, {}) }));
}
/* ── the page ──────────────────────────────────────────────────────────── */
function AdvancedPage() {
    const [tok, setTok] = SP_REACT.useState(0);
    const bump = () => setTok((t) => t + 1);
    const [gamesInQam, setGamesInQam2] = SP_REACT.useState(false);
    const [showDeckyHv, setShowDeckyHv] = SP_REACT.useState(readDeckyHvVisible);
    SP_REACT.useEffect(() => {
        getGamesInQam().then((r) => setGamesInQam2(!!r.enabled)).catch(() => { });
    }, []);
    const setDeckyHvVisible = (enabled) => {
        setShowDeckyHv(enabled);
        try {
            window.localStorage.setItem(DECKY_HV_VISIBLE_KEY, enabled ? "1" : "0");
        }
        catch {
            /* ignore */
        }
    };
    return (SP_JSX.jsx(DFL.SidebarNavigation, { title: "SLSDeck", showTitle: true, pages: [
            {
                title: "Dependencies",
                icon: SP_JSX.jsx(FaBoxOpen, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(DependenciesSection, {}) }),
            },
            {
                title: "Options",
                icon: SP_JSX.jsx(FaSlidersH, {}),
                content: SP_JSX.jsx(OptionsPane, { showDeckyHv: showDeckyHv, onShowDeckyHvChange: setDeckyHvVisible }),
            },
            {
                title: "Sources & keys",
                icon: SP_JSX.jsx(FaKey, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(SettingsSection, {}) }),
            },
            {
                title: "Add a game",
                icon: SP_JSX.jsx(FaDownload, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(AddGameSection, { onChanged: bump, refreshToken: tok, showInstalled: !gamesInQam }) }),
            },
            {
                title: "Game fixes",
                icon: SP_JSX.jsx(FaWrench, {}),
                content: SP_JSX.jsxs(Body, { children: [SP_JSX.jsx(FixesSection, {}), SP_JSX.jsx(OnlineFixUsername, {})] }),
            },
            {
                title: "Cloud saves",
                icon: SP_JSX.jsx(FaCloud, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(CloudRedirectSection, {}) }),
            },
            {
                title: "Anti-Denuvo",
                icon: SP_JSX.jsx(FaShieldAlt, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(TokeerSection, {}) }),
            },
            ...(showDeckyHv ? [{
                    title: "Hypervisor Bypass Module",
                    icon: SP_JSX.jsx(FaShieldAlt, {}),
                    content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(HypervisorSection, {}) }),
                }] : []),
            {
                title: "Mods",
                icon: SP_JSX.jsx(FaPuzzlePiece, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(ModsSection, {}) }),
            },
            {
                title: "About",
                icon: SP_JSX.jsx(FaInfoCircle, {}),
                content: SP_JSX.jsx(AboutPane, {}),
            },
        ] }));
}

function FixModal({ appid, closeModal }) {
    return (SP_JSX.jsxs(DFL.ModalRoot, { closeModal: closeModal, children: [SP_JSX.jsx("div", { style: { fontSize: 20, fontWeight: 600, marginBottom: 10 }, children: "Fixes" }), SP_JSX.jsx(FixPicker, { appid: appid, onClose: closeModal })] }));
}
/**
 * SLSDeck controls for the app-details page — a spaced bar (Add / Remove +
 * Fixes) spliced into the page's own React tree. Restart Steam lives only in the
 * Quick Access panel (next to "Add with SLSsteam"), so it's not repeated here.
 */
function GameActionButtons() {
    const params = DFL.useParams();
    const appid = params?.appid && /^\d+$/.test(params.appid) ? parseInt(params.appid, 10) : null;
    const [installed, setInstalled] = SP_REACT.useState(false);
    const [hiddenForOwned, setHiddenForOwned] = SP_REACT.useState(false);
    const [barEnabled, setBarEnabled] = SP_REACT.useState(true);
    const [busy, setBusy] = SP_REACT.useState("");
    const [progress, setProgress] = SP_REACT.useState("");
    const poll = SP_REACT.useRef(null);
    const stop = () => {
        if (poll.current) {
            clearInterval(poll.current);
            poll.current = null;
        }
    };
    SP_REACT.useEffect(() => () => stop(), []);
    SP_REACT.useEffect(() => {
        if (appid == null)
            return;
        setBusy("");
        setProgress("");
        let cancelled = false;
        (async () => {
            let ours = false;
            try {
                ours = !!(await hasLua(appid)).exists;
            }
            catch {
                ours = false;
            }
            if (cancelled)
                return;
            setInstalled(ours);
            let pref = true;
            try {
                pref = !!(await getHideOnOwned()).enabled;
            }
            catch {
                pref = true;
            }
            if (cancelled)
                return;
            setHiddenForOwned(shouldHideForOwned(appid, ours, pref) ||
                (pref && !ours && isNonSteamShortcut(appid)));
            try {
                const b = await getLibraryButtons();
                if (!cancelled)
                    setBarEnabled(!!b.enabled);
            }
            catch {
                /* default on */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [appid]);
    const doAdd = async () => {
        if (appid == null)
            return;
        setBusy("adding");
        setProgress("Starting…");
        try {
            const res = await startAdd(appid);
            if (!res.success) {
                setBusy("");
                toaster.toast({ title: "SLSDeck", body: res.error || "Could not add" });
                return;
            }
        }
        catch {
            setBusy("");
            toaster.toast({ title: "SLSDeck", body: "Could not start" });
            return;
        }
        stop();
        poll.current = setInterval(async () => {
            try {
                const st = (await getAddStatus(appid)).state || {};
                setProgress(st.status || "");
                if (["done", "failed", "cancelled"].includes(st.status || "")) {
                    stop();
                    setBusy("");
                    if (st.status === "done")
                        setInstalled(true);
                    else if (st.status === "failed")
                        toaster.toast({ title: "SLSDeck", body: st.error || "Failed" });
                }
            }
            catch {
                /* keep polling */
            }
        }, 700);
    };
    const doRemove = async () => {
        if (appid == null)
            return;
        setBusy("removing");
        try {
            await deleteLua(appid);
            setInstalled(false);
            toaster.toast({ title: "SLSDeck", body: "Removed — restart Steam" });
        }
        catch {
            toaster.toast({ title: "SLSDeck", body: "Remove failed" });
        }
        finally {
            setBusy("");
        }
    };
    // Genuinely-owned games (in library, not added by us) get no plugin controls.
    if (appid == null || hiddenForOwned || !barEnabled)
        return null;
    const working = busy !== "";
    const big = { flex: 1, minWidth: 0, padding: "10px 16px", fontSize: 15 };
    return (SP_JSX.jsx("div", { style: { margin: "20px 24px 8px" }, children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", gap: 12 }, "flow-children": "row", children: [installed ? (SP_JSX.jsx(DFL.DialogButton, { style: big, disabled: working, onClick: doRemove, children: busy === "removing" ? "Removing…" : "🗑 Remove" })) : (SP_JSX.jsx(DFL.DialogButton, { style: big, disabled: working, onClick: doAdd, children: busy === "adding" ? progress || "Adding…" : "＋ Add with SLSsteam" })), SP_JSX.jsx(DFL.DialogButton, { style: big, disabled: working, onClick: () => appid != null && DFL.showModal(SP_JSX.jsx(FixModal, { appid: appid })), children: "Fixes" })] }) }));
}

const STYLES = {
    sls: { label: "SLS", background: "linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%)" },
    legit: { label: "LEGIT", background: "linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%)" },
    denuvo: { label: "DENUVO", background: "linear-gradient(135deg, #a12a2a 0%, #e05252 100%)" },
    onlinefix: { label: "ONLINE FIX", background: "linear-gradient(135deg, #1f5f9e 0%, #3d8fd8 100%)" },
    fixed: { label: "FIXED", background: "linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%)" },
};
function GameDetailsBadge() {
    const params = DFL.useParams();
    const appid = params?.appid && /^\d+$/.test(params.appid) ? parseInt(params.appid, 10) : null;
    const [kinds, setKinds] = SP_REACT.useState([]);
    const [emojiVersion, setEmojiVersion] = SP_REACT.useState(0);
    SP_REACT.useEffect(() => {
        const onEmoji = () => setEmojiVersion((v) => v + 1);
        window.addEventListener("slsdeck-emoji-badges", onEmoji);
        return () => window.removeEventListener("slsdeck-emoji-badges", onEmoji);
    }, []);
    SP_REACT.useEffect(() => {
        if (appid == null) {
            setKinds([]);
            return;
        }
        let cancelled = false;
        (async () => {
            let opts = {
                sls: true, legit: true, denuvo: true, gamePage: true, onlineFix: true, fixed: true,
            };
            try {
                const r = await getBadgeOptions();
                if (r.success) {
                    opts = {
                        sls: !!r.sls,
                        legit: !!r.legit,
                        denuvo: !!r.denuvo,
                        gamePage: !!r.gamePage,
                        onlineFix: !!r.onlineFix,
                        fixed: !!r.fixed,
                    };
                }
            }
            catch {
                /* defaults */
            }
            if (cancelled || !opts.gamePage) {
                if (!cancelled)
                    setKinds([]);
                return;
            }
            let ours = false;
            let ownershipKnown = true;
            let everAdded = false;
            try {
                const ea = await getEverAdded();
                everAdded = !!(ea.appids || []).map(Number).includes(appid);
            }
            catch {
                /* ignore */
            }
            try {
                ours = !!(await hasLua(appid)).exists;
            }
            catch {
                ours = false;
                ownershipKnown = false;
            }
            if (cancelled)
                return;
            const shortcut = isNonSteamShortcut(appid);
            const out = [];
            if (ours && opts.sls)
                out.push("sls");
            else if (!ours && ownershipKnown && !everAdded && !shortcut && opts.legit && isInLibrary(appid)) {
                out.push("legit");
            }
            if (opts.denuvo && !shortcut) {
                let isDenuvo = false;
                try {
                    const known = await denuvoKnown();
                    isDenuvo = (known.denuvo || []).includes(appid);
                    if (!isDenuvo) {
                        const r = await denuvoResolve([appid]);
                        isDenuvo = (r.denuvo || []).includes(appid);
                    }
                }
                catch {
                    /* unknown */
                }
                if (!cancelled && isDenuvo)
                    out.push("denuvo");
            }
            if (opts.onlineFix || opts.fixed) {
                try {
                    const r = await getInstalledFixes();
                    const types = (r.fixes || [])
                        .filter((fx) => Number(fx.appid) === appid)
                        .map((fx) => String(fx.fixType || ""));
                    if (types.length) {
                        if (types.some((t) => ONLINE_RE.test(t))) {
                            if (opts.onlineFix)
                                out.push("onlinefix");
                        }
                        else if (opts.fixed) {
                            out.push("fixed");
                        }
                    }
                }
                catch {
                    /* ignore */
                }
            }
            const hasFix = out.some((k) => k === "onlinefix" || k === "fixed");
            const finalKinds = hasFix ? out.filter((k) => k !== "legit") : out;
            if (!cancelled)
                setKinds(finalKinds);
        })();
        return () => {
            cancelled = true;
        };
    }, [appid]);
    if (appid == null || !kinds.length)
        return null;
    const emojiMode = getEmojiBadgesEnabled();
    return (SP_JSX.jsx("div", { style: { display: "flex", gap: emojiMode ? 10 : 8, margin: "12px 24px 0", alignItems: "center" }, children: kinds.map((k) => (SP_JSX.jsx("div", { style: emojiMode ? {
                padding: 0,
                margin: 0,
                border: 0,
                borderRadius: 0,
                fontSize: 28,
                lineHeight: "31px",
                fontWeight: 400,
                letterSpacing: 0,
                color: "inherit",
                background: "transparent",
                boxShadow: "none",
                textShadow: "0 1px 3px rgba(0,0,0,0.75)",
                fontFamily: "'Noto Color Emoji','Segoe UI Emoji','Apple Color Emoji',sans-serif",
            } : {
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: "#fff",
                background: STYLES[k].background,
                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
            }, children: badgeDisplayLabel(k, STYLES[k].label) }, k))) }));
}

/**
 * Inject the SLSDeck bar into the library app-details page by patching the
 * route's render tree (the version-proof approach the ui-examples use — a real
 * React element spliced into the page's own tree, not DOM-scraping the store).
 * We splice into the app-details InnerContainer so it sits below the hero /
 * action buttons with comfortable spacing.
 */
function patchLibraryApp() {
    return routerHook.addPatch("/library/app/:appid", (tree) => {
        const routeProps = DFL.findInReactTree(tree, (x) => x?.renderFunc);
        if (routeProps) {
            const patcher = DFL.createReactTreePatcher([
                (t) => DFL.findInReactTree(t, (x) => x?.props?.children?.props?.overview)?.props
                    ?.children,
            ], (_, ret) => {
                const container = DFL.findInReactTree(ret, (x) => Array.isArray(x?.props?.children) &&
                    x?.props?.className?.includes(DFL.appDetailsClasses.InnerContainer));
                if (typeof container === "object") {
                    container.props.children.splice(1, 0, SP_JSX.jsx(GameDetailsBadge, {}), SP_JSX.jsx(GameActionButtons, {}));
                }
                return ret;
            });
            DFL.afterPatch(routeProps, "renderFunc", patcher);
        }
        return tree;
    });
}

const HistoryModule = DFL.findModuleExport((e) => e?.m_history !== undefined);
const History = HistoryModule?.m_history;
let mounted = false;
let ws = null;
let msgId = 1;
let currentModId = "";
let wsReady = false;
let isConnecting = false;
let reconnectTimer = null;
let bgTimer = null;
let histUnlisten = null;
const WORKSHOP_RE = /(?:sharedfiles|workshop)\/filedetails\/.*?[?&]id=(\d+)/;
function isWorkshopUrl(url) {
    return !!url && WORKSHOP_RE.test(url);
}
function extractModId(url) {
    const m = (url || "").match(WORKSHOP_RE);
    return m ? m[1] : "";
}
function cdp(method, params) {
    if (!ws || ws.readyState !== WebSocket.OPEN)
        return;
    try {
        ws.send(JSON.stringify({ id: msgId++, method, params: params || {} }));
    }
    catch {
        /* ignore */
    }
}
function evaluate(expr) {
    cdp("Runtime.evaluate", { expression: expr });
}
// Steam-native styling for the injected workshop button (matches StorePatch).
const STEAM_WS_CSS = `
#lt-ws-wrap{font-family:"Motiva Sans",Arial,sans-serif;}
#lt-ws-btn{appearance:none;-webkit-appearance:none;border:none;cursor:pointer;color:#fff;font-family:"Motiva Sans",Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:.3px;padding:11px 18px;border-radius:2px;background:linear-gradient(to bottom,#8bc53f,#5a8f1e);box-shadow:0 2px 8px rgba(0,0,0,.4);transition:filter .12s ease-out,box-shadow .12s ease-out,transform .06s ease-out;}
#lt-ws-btn:hover{filter:brightness(1.13);}
#lt-ws-btn:active{filter:brightness(.9);transform:translateY(1px);}
#lt-ws-btn:focus{outline:none;box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 12px 2px rgba(103,193,245,.75);}
#lt-ws-btn:disabled{opacity:.55;cursor:default;filter:none;}
#lt-ws-status{font-family:"Motiva Sans",Arial,sans-serif;background:linear-gradient(to bottom,rgba(42,71,94,.94),rgba(23,33,43,.95));color:#c7d5e0;padding:6px 12px;border-radius:2px;font-size:12px;max-width:280px;box-shadow:inset 0 0 0 1px rgba(103,193,245,.15);}
`;
/** Floating button + status line, injected into the workshop page's JS world. */
function buildButton(modid) {
    return `(function(){
    try{
      var OLD=document.getElementById('lt-ws-wrap'); if(OLD) OLD.remove();
      if(!document.getElementById('lt-ws-style')){var stl=document.createElement('style');stl.id='lt-ws-style';stl.textContent=${JSON.stringify(STEAM_WS_CSS)};document.head.appendChild(stl);}
      var wrap=document.createElement('div'); wrap.id='lt-ws-wrap';
      wrap.style.cssText='position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;gap:8px;';
      var status=document.createElement('div'); status.id='lt-ws-status';
      status.style.cssText='display:none;';
      var btn=document.createElement('button'); btn.id='lt-ws-btn'; btn.textContent='⬇ Download with SLSDeck';
      btn.onclick=function(){
        try{ btn.disabled=true; status.style.display='block'; status.textContent='Resolving…';
          window.ltWsInvoke(JSON.stringify({action:'download',modid:${JSON.stringify(modid)}}));
        }catch(e){}
      };
      wrap.appendChild(status); wrap.appendChild(btn); document.body.appendChild(wrap);
    }catch(e){}
  })();`;
}
function setStatus(text, done, failed) {
    const color = failed ? "#f5a623" : done ? "#58c578" : "#c7d5e0";
    return `(function(){try{
    var s=document.getElementById('lt-ws-status'); var b=document.getElementById('lt-ws-btn');
    if(s){s.style.display='block';s.style.color=${JSON.stringify(color)};s.textContent=${JSON.stringify(text)};}
    if(b && ${done || failed ? "true" : "false"}){b.disabled=false;b.style.opacity='1';}
  }catch(e){}})();`;
}
function removeButton() {
    evaluate(`(function(){try{var w=document.getElementById('lt-ws-wrap');if(w)w.remove();}catch(e){}})();`);
}
function injectFor(modid) {
    if (!modid) {
        removeButton();
        return;
    }
    evaluate(buildButton(modid));
}
/** Handle a button click bridged back from the page's JS world. */
async function onAction(payloadStr) {
    let msg;
    try {
        msg = JSON.parse(payloadStr);
    }
    catch {
        return;
    }
    if (msg?.action !== "download")
        return;
    const modid = String(msg?.modid || "");
    if (!modid)
        return;
    try {
        const info = await wsResolve(modid);
        if (!info.success) {
            evaluate(setStatus(info.error || "Could not resolve this item", false, true));
            return;
        }
        if (!info.allowed) {
            evaluate(setStatus(`${info.title || "This game"} is a game you own — SLSDeck only mods SLSDeck-added or non-Steam games.`, false, true));
            return;
        }
        if (!info.installed) {
            evaluate(setStatus(`Install ${info.title || "the game"} first, then retry.`, false, true));
            return;
        }
        const label = info.isCollection ? `collection (${info.children?.length || 0} items)` : "mod";
        evaluate(setStatus(`Downloading ${label}…`));
        const dl = await wsDownload(modid);
        if (!dl.success) {
            const why = dl.error === "owned_game"
                ? "That game is owned — not eligible."
                : dl.error === "not_installed"
                    ? "Install the game first."
                    : dl.error || "Download failed.";
            evaluate(setStatus(why, false, true));
            return;
        }
        const job = dl.job || modid;
        pollJob(job);
    }
    catch (e) {
        evaluate(setStatus("Error: " + String(e), false, true));
    }
}
let jobTimer = null;
function pollJob(job) {
    if (jobTimer)
        clearInterval(jobTimer);
    jobTimer = setInterval(async () => {
        try {
            const r = await wsDownloadState(job);
            const s = r.state || {};
            if (s.status === "done") {
                clearInterval(jobTimer);
                jobTimer = null;
                evaluate(setStatus(`Installed ${s.done}/${s.total} item(s) ✓`, true));
            }
            else if (s.status === "failed") {
                clearInterval(jobTimer);
                jobTimer = null;
                const failed = (s.failed || []).length;
                evaluate(setStatus(`Done — ${s.done}/${s.total} ok, ${failed} failed`, false, true));
            }
            else {
                const cur = s.current ? ` (item ${s.current})` : "";
                evaluate(setStatus(`${s.status || "working"} ${s.done || 0}/${s.total || 0}${cur}`));
            }
        }
        catch {
            /* ignore */
        }
    }, 1500);
}
// ── CDP connection to the workshop tab ──────────────────────────────────────
function scheduleReconnect(ms = 1000) {
    if (!mounted || reconnectTimer)
        return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (mounted && (!ws || ws.readyState === WebSocket.CLOSED))
            connect();
    }, ms);
}
function updateFromUrl(url) {
    const id = extractModId(url);
    if (!id) {
        if (currentModId) {
            currentModId = "";
            removeButton();
        }
        return;
    }
    currentModId = id;
    if (wsReady)
        injectFor(id);
}
async function connect() {
    if (!mounted || isConnecting)
        return;
    isConnecting = true;
    setTimeout(() => {
        isConnecting = false;
    }, 5000);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        isConnecting = false;
        return;
    }
    try {
        const res = await fetchNoCors("http://localhost:8080/json");
        const tabs = await res.json();
        const tab = tabs.find((t) => t.url && isWorkshopUrl(t.url));
        if (!tab || !tab.webSocketDebuggerUrl) {
            isConnecting = false;
            scheduleReconnect(1000);
            return;
        }
        currentModId = extractModId(tab.url);
        const sock = new WebSocket(tab.webSocketDebuggerUrl);
        ws = sock;
        let pendingUrlId = null;
        sock.onopen = () => {
            isConnecting = false;
            if (ws !== sock) {
                sock.close();
                return;
            }
            cdp("Page.enable");
            cdp("Runtime.enable");
            cdp("Runtime.addBinding", { name: "ltWsInvoke" });
            const uid = msgId++;
            pendingUrlId = uid;
            try {
                sock.send(JSON.stringify({ id: uid, method: "Runtime.evaluate", params: { expression: "window.location.href" } }));
            }
            catch {
                /* ignore */
            }
            setTimeout(() => {
                if (ws !== sock)
                    return;
                wsReady = true;
                if (currentModId)
                    injectFor(currentModId);
            }, 300);
        };
        sock.onmessage = (ev) => {
            if (ws !== sock)
                return;
            let d;
            try {
                d = JSON.parse(ev.data);
            }
            catch {
                return;
            }
            if (pendingUrlId !== null && d.id === pendingUrlId) {
                pendingUrlId = null;
                const u = d.result?.result?.value;
                if (typeof u === "string")
                    updateFromUrl(u);
                return;
            }
            if (d.method === "Runtime.bindingCalled" && d.params?.name === "ltWsInvoke") {
                onAction(String(d.params.payload || ""));
            }
            else if (d.method === "Page.frameNavigated" && d.params?.frame?.url) {
                setTimeout(() => updateFromUrl(d.params.frame.url), 500);
            }
            else if (d.method === "Page.navigatedWithinDocument" && d.params?.frame?.url) {
                setTimeout(() => updateFromUrl(d.params.frame.url), 500);
            }
            else if (d.method === "Page.loadEventFired") {
                if (currentModId && wsReady)
                    setTimeout(() => injectFor(currentModId), 300);
            }
        };
        sock.onerror = () => {
            isConnecting = false;
            scheduleReconnect(1000);
        };
        sock.onclose = () => {
            if (ws === sock) {
                ws = null;
                wsReady = false;
            }
            scheduleReconnect(1000);
        };
    }
    catch {
        isConnecting = false;
        scheduleReconnect(1000);
    }
}
function initWorkshopPatch() {
    mounted = true;
    if (History) {
        try {
            histUnlisten = History.listen(() => connect());
        }
        catch {
            /* ignore */
        }
    }
    connect();
    bgTimer = setInterval(() => {
        if (!ws || ws.readyState === WebSocket.CLOSED)
            connect();
    }, 500);
    return () => {
        mounted = false;
        if (bgTimer) {
            clearInterval(bgTimer);
            bgTimer = null;
        }
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (jobTimer) {
            clearInterval(jobTimer);
            jobTimer = null;
        }
        if (histUnlisten) {
            histUnlisten();
            histUnlisten = null;
        }
        if (ws) {
            try {
                ws.close();
            }
            catch {
                /* ignore */
            }
            ws = null;
            wsReady = false;
        }
    };
}

/**
 * Auto-apply fixes — background sweep model (non-hypervisor build).
 *
 * Auto-fix ONLY applies real per-game fixes from named sources (ryuu generic /
 * crack, and the perondepot / ryuu online fix). The universal "Unsteam" AIO fix
 * is NEVER auto-applied — it's opt-in from the UI only. If no per-game fix
 * exists, the sweep does nothing and shows no notification.
 *
 * It also waits for the game to FINISH downloading (real bytes on disk, not just
 * a created folder) before applying, so a fix never lands on a partial install.
 *
 * Denuvo games are skipped entirely (no hypervisor here → no working fix).
 */
const TITLE = "SLSDeck";
const running = new Set();
let sweeping = false;
let seededExisting = false;
async function waitForFix(appid, timeoutMs = 20 * 60 * 1000) {
    const started = Date.now();
    for (;;) {
        await new Promise((r) => setTimeout(r, 1500));
        if (Date.now() - started > timeoutMs)
            return false;
        try {
            const s = ((await getFixStatus(appid)).state || {}).status || "";
            if (s === "done")
                return true;
            if (s === "failed" || s === "cancelled")
                return false;
            if (!s || IN_PROGRESS.has(s))
                continue;
        }
        catch {
            /* keep polling */
        }
    }
}
async function alreadyFixed(appid) {
    try {
        const r = await getInstalledFixes();
        return (r.fixes || []).some((f) => Number(f.appid) === appid);
    }
    catch {
        return false;
    }
}
async function isDenuvo(appid) {
    try {
        const known = await denuvoKnown();
        if ((known.denuvo || []).includes(appid))
            return true;
        const r = await denuvoResolve([appid]);
        return (r.denuvo || []).includes(appid);
    }
    catch {
        return false;
    }
}
async function apply(appid, url, path, type, name, label) {
    toaster.toast({ title: TITLE, body: `${name}: applying ${label}…` });
    try {
        await applyFix(appid, url, path, type, name);
        const ok = await waitForFix(appid);
        toaster.toast({ title: TITLE, body: ok ? `${name}: ${label} applied` : `${name}: ${label} failed` });
        return ok;
    }
    catch (e) {
        toaster.toast({ title: TITLE, body: `${name}: ${label} error — ${e}` });
        return false;
    }
}
async function processOne(appid) {
    if (running.has(appid))
        return false;
    running.add(appid);
    try {
        if (await alreadyFixed(appid))
            return true;
        if (await isDenuvo(appid))
            return true; // no working fix without a hypervisor
        const path = await getGameInstallPath(appid);
        if (!path?.success || !path.installPath)
            return false; // not installed yet
        // Wait for the download to actually finish (real bytes on disk) — never
        // apply a fix to a partial/empty install. Returns false so the game stays
        // queued and the next sweep retries once it's done.
        try {
            const dl = await appDownloadComplete(appid);
            if (!dl?.complete)
                return false;
        }
        catch {
            return false;
        }
        const check = await checkFixes(appid, "");
        const name = check?.gameName || `AppID ${appid}`;
        const online = check?.onlineFix?.available ? check.onlineFix : null;
        const generic = check?.genericFix?.available ? check.genericFix : null;
        // Only real per-game fixes, in priority order: ryuu fix (generic/crack) →
        // online (perondepot / ryuu online). The universal Unsteam AIO is NEVER
        // auto-applied. No fix found → do nothing, no notification.
        if (generic?.url) {
            // ryuu is highest priority. If it applies, done. If it FAILS (e.g. the
            // ryuu key is missing or your account lacks access to this specific fix),
            // fall back to the online fix instead of getting stuck on it.
            if (await apply(appid, generic.url, path.installPath, "generic", name, "ryuu fix"))
                return true;
        }
        if (online?.url)
            return apply(appid, online.url, path.installPath, "online", name, "online fix");
        // Download is complete and no per-game fix applied — nothing more to do, so
        // return true to clear it from the pending queue (don't re-check forever).
        return true;
    }
    finally {
        running.delete(appid);
    }
}
async function runAutoFixSweep() {
    if (sweeping)
        return;
    sweeping = true;
    try {
        if (!(await getAutoFix()).enabled)
            return;
        const pending = (await getAutoFixPending()).appids || [];
        for (const appid of pending) {
            try {
                // Only clear from the queue once a fix actually applied. If the game is
                // still downloading or has no per-game fix, it stays queued for retry.
                if (await processOne(appid))
                    await removeAutoFixPending(appid);
            }
            catch {
                /* keep going */
            }
        }
        if (!seededExisting) {
            seededExisting = true;
            try {
                const apps = (await getInstalledApps()).apps || [];
                const pset = new Set(pending);
                for (const a of apps) {
                    const id = Number(a.appid);
                    if (pset.has(id))
                        continue;
                    try {
                        await processOne(id);
                    }
                    catch { /* keep going */ }
                }
            }
            catch {
                /* ignore */
            }
        }
    }
    catch {
        /* ignore */
    }
    finally {
        sweeping = false;
    }
}

const LIBRARY_ROUTE = "/library/app/:appid";
const ADVANCED_ROUTE = "/slsdeck";
const ACTIONS_FIXES_QAM_KEY = "slsdeck.actionsFixesQam";
const ACTIONS_FIXES_QAM_EVENT = "slsdeck-actions-fixes-qam";
// Remembers where the panel was scrolled so reopening the QAM returns there.
let savedScroll = 0;
// SLSsteam goes inactive after a Steam client update whose steamclient.so hash
// isn't in SLSsteam's list (SafeMode aborts the load). We detect that and offer a
// one-tap client-fix (Headcrab re-pin), instead of leaving the user with a
// silently-dead injection.
function RepairBanner() {
    const [needed, setNeeded] = SP_REACT.useState(false);
    const [reason, setReason] = SP_REACT.useState("");
    const [busy, setBusy] = SP_REACT.useState(false);
    const [done, setDone] = SP_REACT.useState("");
    SP_REACT.useEffect(() => {
        (async () => {
            try {
                // Only relevant once SLSsteam is actually installed — a fresh setup isn't
                // "inactive", it's just not set up yet (the onboarding button handles that).
                const st = await getSlssteamStatus();
                if (!st?.installed)
                    return;
                const r = await clientFixNeeded();
                if (r.success && r.needed) {
                    setNeeded(true);
                    setReason(r.reason || "");
                }
            }
            catch { /* ignore */ }
        })();
    }, []);
    if (!needed)
        return null;
    return (SP_JSX.jsxs("div", { style: { margin: "6px 8px", padding: "8px 10px", borderRadius: 6, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.4)" }, children: [SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#f5a623" }, children: "SLSsteam looks inactive" }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.8, margin: "2px 0 6px" }, children: reason || "A Steam client update may have an unrecognised steamclient.so — added games won't load until it's repaired." }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy, onClick: async () => {
                        setBusy(true);
                        setDone("Repairing… this can take a couple of minutes and may restart Steam.");
                        try {
                            const r = await runClientFix();
                            setDone(r.success ? "Repair started — Steam will reconfigure and reload." : (r.error || "Repair failed."));
                            if (r.success) {
                                setTimeout(() => setNeeded(false), 4000);
                            }
                        }
                        catch (e) {
                            setDone(`Failed: ${e}`);
                        }
                        setBusy(false);
                    }, children: busy ? "Repairing…" : "Repair SLSsteam" }) }), done ? SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, marginTop: 4 }, children: done }) : null] }));
}
function Content() {
    const [refreshToken, setRefreshToken] = SP_REACT.useState(0);
    const bump = () => setRefreshToken((t) => t + 1);
    const [actionsFixesQam, setActionsFixesQam] = SP_REACT.useState(true);
    const [gamesInQam, setGamesInQam] = SP_REACT.useState(true);
    const [hideToolsQam, setHideToolsQam] = SP_REACT.useState(true);
    // Until SLSsteam is installed, the QAM shows only the setup block — no game
    // actions, game list or tools (there's nothing for them to act on yet).
    const [installed, setInstalled] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        const readActionsFixes = () => {
            try {
                const raw = window.localStorage.getItem(ACTIONS_FIXES_QAM_KEY);
                setActionsFixesQam(raw == null ? true : raw === "1");
            }
            catch {
                setActionsFixesQam(true);
            }
        };
        readActionsFixes();
        const onActionsFixes = () => readActionsFixes();
        window.addEventListener(ACTIONS_FIXES_QAM_EVENT, onActionsFixes);
        getGamesInQam().then((r) => setGamesInQam(!!r.enabled)).catch(() => { });
        getHideToolsQam().then((r) => setHideToolsQam(!!r.enabled)).catch(() => { });
        const checkInstalled = () => getSlssteamStatus().then((s) => setInstalled(!!s?.installed)).catch(() => { });
        checkInstalled();
        // Re-check so the sections appear right after a first-time install completes.
        const iv = setInterval(checkInstalled, 4000);
        return () => {
            clearInterval(iv);
            window.removeEventListener(ACTIONS_FIXES_QAM_EVENT, onActionsFixes);
        };
    }, []);
    const anchor = SP_REACT.useRef(null);
    SP_REACT.useEffect(() => {
        const el = anchor.current;
        if (!el)
            return;
        let node = el.parentElement;
        let scroller = null;
        while (node) {
            const oy = getComputedStyle(node).overflowY;
            if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
                scroller = node;
                break;
            }
            node = node.parentElement;
        }
        if (!scroller)
            return;
        if (savedScroll > 0) {
            requestAnimationFrame(() => {
                try {
                    scroller.scrollTop = savedScroll;
                }
                catch { /* ignore */ }
            });
        }
        const onScroll = () => { savedScroll = scroller.scrollTop; };
        scroller.addEventListener("scroll", onScroll, { passive: true });
        return () => scroller.removeEventListener("scroll", onScroll);
    }, []);
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("div", { ref: anchor, style: { height: 0 } }), SP_JSX.jsx(RepairBanner, {}), SP_JSX.jsx(SlsSteamCompact, {}), installed && actionsFixesQam && SP_JSX.jsx(GameControlsSection, { onChanged: bump }), installed && gamesInQam && SP_JSX.jsx(InstalledSection, { refreshToken: refreshToken, onChanged: bump }), installed && SP_JSX.jsx(GameToolsSection, {}), installed && !hideToolsQam && SP_JSX.jsx(ToolsSection, {})] }));
}
var index = definePlugin(() => {
    console.log("SLSDeck (Decky) initializing");
    // Two button surfaces: (1) the library app-details bar, injected via a React
    // tree patch (always on while the plugin runs); and (2) the store-page button,
    // injected into the CEF store tab over CDP and configurable in Settings.
    let libraryPatch = null;
    let stopStorePatch = null;
    let stopWorkshopPatch = null;
    try {
        libraryPatch = patchLibraryApp();
    }
    catch (e) {
        console.error("SLSDeck: failed to patch library app page", e);
    }
    try {
        stopStorePatch = initStorePatch();
    }
    catch (e) {
        console.error("SLSDeck: failed to init store patch", e);
    }
    try {
        stopWorkshopPatch = initWorkshopPatch();
    }
    catch (e) {
        console.error("SLSDeck: failed to init workshop patch", e);
    }
    // Library capsule badges (SLS / LEGIT) — injected into the gamepad window.
    let libraryBadgePatch = null;
    try {
        startBadges();
        libraryBadgePatch = routerHook.addPatch("/library", (tree) => {
            startBadges();
            return tree;
        });
    }
    catch (e) {
        console.error("SLSDeck: failed to start library badges", e);
    }
    // Full-page "Advanced" surface (junkstore-style sidebar page).
    try {
        routerHook.addRoute(ADVANCED_ROUTE, () => SP_JSX.jsx(AdvancedPage, {}), { exact: true });
    }
    catch (e) {
        console.error("SLSDeck: failed to register Advanced route", e);
    }
    // Persistent background notifier: adds run in the backend even if the UI that
    // started them is closed, so this always-running poller fires the toast.
    const addNotifier = setInterval(async () => {
        try {
            const r = await popAddEvents();
            (r.events || []).forEach((e) => {
                const dl = e.autoDownload;
                const isAssella = e.assella;
                const liveReady = !!e.liveReady;
                toaster.toast({
                    title: "SLSDeck",
                    body: e.status === "done" && e.success
                        ? (isAssella
                            ? `Installed ${e.name}${dl ? " — reloading Steam…" : " — restart Steam to see it"}`
                            : liveReady
                                ? (dl ? `Added ${e.name} — downloading in Steam…` : `Added ${e.name} — available in Steam`)
                                : `Added ${e.name} — restart Steam to finish provisioning`)
                        : `${isAssella ? "Install" : "Add"} failed: ${e.name}${e.error ? " — " + e.error : ""}`,
                });
                if (e.status === "done" && e.success) {
                    // slsteam-moon's verified HotReload path updates package/license/appinfo
                    // in the current Steam session, so normal SLS adds must NOT restart.
                    // Keep ASSella's existing reload behavior separate from this live path.
                    if (isAssella && dl) {
                        reloadSteam().catch(() => { });
                    }
                    getAutoFix()
                        .then((r) => (r.enabled ? addAutoFixPending(e.appid) : undefined))
                        .catch(() => { });
                    // Keep the optional "SLSDeck" collection in sync as games are added.
                    syncSlsCollection().catch(() => { });
                }
            });
        }
        catch {
            /* ignore */
        }
        // Injection watchdog notifications (Steam client update broke the hook).
        try {
            const ir = await popInjectionEvents();
            (ir.events || []).forEach((e) => {
                toaster.toast({ title: "SLSDeck", body: e.message });
            });
        }
        catch {
            /* ignore */
        }
    }, 2500);
    // Background auto-fix sweep: applies queued fixes once games finish installing.
    const autoFixSweep = setInterval(() => { runAutoFixSweep().catch(() => { }); }, 20000);
    setTimeout(() => { runAutoFixSweep().catch(() => { }); }, 4000);
    // Keep the optional "SLSDeck" collection reconciled (self-no-ops when the pref
    // is off or nothing changed). Boot once, then slowly to catch removals/purges
    // that don't go through the add-notifier above.
    setTimeout(() => { syncSlsCollection().catch(() => { }); }, 6000);
    const collectionSync = setInterval(() => { syncSlsCollection().catch(() => { }); }, 60000);
    return {
        name: "SLSDeck",
        titleView: (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }, children: [SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "SLSDeck" }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => {
                        try {
                            DFL.Navigation.CloseSideMenus();
                            DFL.Navigation.Navigate(ADVANCED_ROUTE);
                        }
                        catch (e) {
                            console.error("SLSDeck: could not open Advanced page", e);
                        }
                    }, style: {
                        height: "28px",
                        width: "28px",
                        minWidth: "28px",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                    }, "aria-label": "Advanced settings", children: SP_JSX.jsx(FaCog, {}) })] })),
        content: SP_JSX.jsx(Content, {}),
        icon: SP_JSX.jsx(FaPuzzlePiece, {}),
        onDismount() {
            console.log("SLSDeck unloading");
            try {
                clearInterval(addNotifier);
            }
            catch { /* ignore */ }
            try {
                clearInterval(autoFixSweep);
            }
            catch { /* ignore */ }
            try {
                clearInterval(collectionSync);
            }
            catch { /* ignore */ }
            try {
                if (libraryPatch)
                    routerHook.removePatch(LIBRARY_ROUTE, libraryPatch);
            }
            catch { /* ignore */ }
            try {
                routerHook.removeRoute(ADVANCED_ROUTE);
            }
            catch { /* ignore */ }
            try {
                stopBadges();
                removeAllBadges();
            }
            catch { /* ignore */ }
            try {
                if (libraryBadgePatch)
                    routerHook.removePatch("/library", libraryBadgePatch);
            }
            catch { /* ignore */ }
            try {
                if (stopStorePatch)
                    stopStorePatch();
            }
            catch { /* ignore */ }
            try {
                if (stopWorkshopPatch)
                    stopWorkshopPatch();
            }
            catch { /* ignore */ }
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
