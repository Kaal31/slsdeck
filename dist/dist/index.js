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
}

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
callable("unpin_game");
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
const installSlssteam = callable("install_slssteam");
const getSlssteamInstallStatus = callable("get_slssteam_install_status");
const reloadSteamBackend = callable("reload_steam");
const activateInjection = callable("activate_injection");
const deactivateInjection = callable("deactivate_injection");
const getDiagnostics = callable("get_diagnostics");
const runClientFix = callable("run_client_fix");
callable("injection_health");
const getAutoDownload = callable("get_auto_download");
const setAutoDownload = callable("set_auto_download");
const triggerSteamInstall = callable("trigger_steam_install");
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
    // 4) Trigger Steam to update/download the game to the pinned build.
    h.onPhase("updating", { source });
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

function FixPicker({ appid, onReload }) {
    const [check, setCheck] = SP_REACT.useState(null);
    const [applied, setApplied] = SP_REACT.useState([]);
    const [installPath, setInstallPath] = SP_REACT.useState("");
    const [pinned, setPinned] = SP_REACT.useState(false);
    const [added, setAdded] = SP_REACT.useState(false);
    const [smoke, setSmoke] = SP_REACT.useState(null);
    const [dlcU, setDlcU] = SP_REACT.useState({});
    const [hasRyuuKey, setHasRyuuKey] = SP_REACT.useState(true);
    const [busy, setBusy] = SP_REACT.useState("");
    const [ns, setNs] = SP_REACT.useState(null);
    const [msg, setMsg] = SP_REACT.useState("");
    const [autoApply, setAutoApplyState] = SP_REACT.useState(false);
    // Guided build-accurate apply: after pin+update we wait for the user to press
    // "Apply now". `awaiting` holds the deferred apply and its label.
    const [awaiting, setAwaiting] = SP_REACT.useState(null);
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
        }
        catch {
            setPinned(false);
        }
        try {
            const r = await getInstalledApps();
            setAdded(!!r.success && (r.apps || []).some((a) => a.appid === appid));
        }
        catch {
            setAdded(false);
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
        setDlComplete(false);
        refresh();
    }, [appid]);
    const watch = (getState, okMsg, failMsg, onDone) => {
        stop();
        poll.current = setInterval(async () => {
            try {
                const st = (await getState()).state || {};
                setMsg(st.status || "");
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
        stopFlag.current = false;
        setBusy(key);
        resetFixRuntime(appid);
        const doApply = async () => {
            setAwaiting(null);
            stopDl();
            setBusy(`${key}:apply`);
            setMsg(`Applying ${label}…`);
            const res = await startExtract();
            if (!res || !res.success) {
                setBusy("");
                setMsg(res?.error || "Fix failed");
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
                setAwaiting({ label, run: doApply });
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
                    setMsg(`${r.label || UNLOCKER_LABEL[kind]} installed (${r.tag || ""}) — restart Steam`);
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
    return (SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }, children: [pinned && (SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: "\uD83D\uDD12 Version pinned \u2014 this game won't update past the version the fix targets." })), awaiting && (SP_JSX.jsxs("div", { style: {
                    border: "1px solid rgba(120,180,255,0.4)",
                    borderRadius: 8,
                    padding: 8,
                    background: "rgba(80,130,220,0.08)",
                }, children: [SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 4 }, children: "Pinned \u2014 waiting for Steam to update the game" }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, marginBottom: 6 }, children: dlComplete
                            ? "Download complete. Press Apply now to install the fix onto this build."
                            : "Let the game finish downloading in Steam, then press Apply now." }), SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", gap: 6 }, "flow-children": "row", children: [SP_JSX.jsx(DFL.DialogButton, { style: bs, onClick: () => awaiting.run().catch(() => { }), children: dlComplete ? `Apply ${awaiting.label} now` : "Apply now (download not done)" }), SP_JSX.jsx(DFL.DialogButton, { style: bs, onClick: () => {
                                    stopFlag.current = true;
                                    stopDl();
                                    setAwaiting(null);
                                    setMsg("Cancelled — the pin is kept; you can apply later.");
                                }, children: "Cancel" })] })] })), SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || pinned || !!awaiting, onClick: doPinVersion, children: pinned
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
                return (SP_JSX.jsxs("div", { style: {
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        padding: 8,
                        opacity: avail || done ? 1 : 0.55,
                    }, children: [SP_JSX.jsxs("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: [row.label, done ? " · ✓ Applied" : avail ? " · Available" : " · Not available"] }), row.info?.file && (SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6, marginBottom: 4 }, children: [row.info.file, row.info?.badge ? ` · ${row.info.badge}` : ""] })), (row.info?.url || "").includes("generator.ryuu.lol") && !hasRyuuKey && (SP_JSX.jsx("div", { style: { fontSize: 11, color: "#ffcc66", marginBottom: 4 }, children: "\uD83D\uDD11 Needs a Ryuu API key \u2014 add it in Settings to download this fix." })), SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", gap: 6 }, "flow-children": "row", children: SP_JSX.jsx(DFL.DialogButton, { style: bs, disabled: working || !!awaiting || !avail, onClick: () => doFix(row), children: busy.startsWith(`${row.key}:fix`) ? "Working…" : avail ? "Apply this fix" : "No fix" }) })] }, row.key));
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
                            // Title: prefer the badges; else a real name; else fall back.
                            const title = tags.length
                                ? tags.join(" · ")
                                : fix.name && fix.name !== String(fix.appid)
                                    ? fix.name
                                    : `Fix${fix.id ? ` ${fix.id}` : ` ${i + 1}`}`;
                            const buildId = fix.build || fix.manifest_id || "";
                            const whenShort = when ? String(when).slice(0, 10) : "";
                            const meta = [
                                whenShort ? `Released ${whenShort}` : "",
                                buildId ? `build ${buildId}` : "",
                            ]
                                .filter(Boolean)
                                .join(" · ");
                            return (SP_JSX.jsxs("div", { style: { border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 }, children: title }), meta && (SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, marginBottom: 4 }, children: meta })), SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", gap: 6 }, "flow-children": "row", children: SP_JSX.jsx(DFL.DialogButton, { style: bs, disabled: working || !!awaiting, onClick: () => doLtFix(fix), children: busy.startsWith(`lt:${fix.id}`) ? "Working…" : "Apply & pin to build" }) })] }, `lt-${fix.id || i}`));
                        })] }));
            })(), smoke?.supported && (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: () => doSmoke(!smoke.installed), children: busy === "smoke"
                    ? "Working…"
                    : smoke.installed
                        ? "Remove DLC unlock (SmokeAPI)"
                        : "Unlock DLC (SmokeAPI)" })), ["cream", "uplayr1", "uplayr2"].map((kind) => dlcU[kind]?.supported ? (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: () => doUnlocker(kind, !dlcU[kind]?.installed), children: busy === `unlock-${kind}`
                    ? "Working…"
                    : dlcU[kind]?.installed
                        ? `Remove ${UNLOCKER_LABEL[kind]}`
                        : `Unlock ${UNLOCKER_LABEL[kind]}` }, kind)) : null), applied.length > 0 && (SP_JSX.jsx(DFL.DialogButton, { style: { fontSize: 12, padding: "5px 8px" }, disabled: working || !!awaiting, onClick: doUnfix, children: busy === "unfix" ? "Reverting & unpinning…" : "Un-fix and unpin" })), msg && SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, padding: "0 2px" }, children: msg })] }));
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
    onlinefix: "linear-gradient(135deg, #1f5f9e 0%, #3d8fd8 100%)",
    fixed: "linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%)",
    // Non-Steam: solid black with white text, as requested.
    nonsteam: "#000000",
    // App-name badge: a neutral dark slate so it reads as secondary info.
    nonsteamname: "linear-gradient(135deg, #3a3f4b 0%, #555b68 100%)",
};
/* ── state ─────────────────────────────────────────────────────────────── */
let observer = null;
let scanTimer = null;
let retryTimer = null;
let rafHandle = null;
let cachedWindow = null;
let slsIds = new Set();
// LEGIT is only trustworthy once we know which games are ours. If the backend
// lookup ever fails, an SLSsteam game would otherwise fall through and be
// mislabelled as owned — so suppress LEGIT entirely until this is true.
let slsLoaded = false;
let everAddedIds = new Set();
let denuvoIds = new Set();
let onlineIds = new Set();
let fixedIds = new Set();
let opts = {
    sls: true, legit: true, denuvo: true, onlineFix: true, fixed: true,
    nonSteam: true, nonSteamName: true, library: true,
};
// appid -> derived app name (from the shortcut's target exe folder).
let nonSteamNames = new Map();
const pendingDenuvo = new Set();
let denuvoFlushTimer = null;
let refreshTimer = null;
/* ── the Big Picture / gamepad window that actually holds the grid ─────── */
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
/* ── styles ────────────────────────────────────────────────────────────── */
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
.${BADGE_CLASS}[data-kind="sls"] {
  background: linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%);
}
.${BADGE_CLASS}[data-kind="legit"] {
  background: linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%);
}
.${BADGE_CLASS}[data-kind="denuvo"] {
  background: linear-gradient(135deg, #a12a2a 0%, #e05252 100%);
}
.${BADGE_CLASS}[data-kind="onlinefix"] {
  background: linear-gradient(135deg, #1f5f9e 0%, #3d8fd8 100%);
}
.${BADGE_CLASS}[data-kind="fixed"] {
  background: linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%);
}

`;
        win.document.head.appendChild(el);
    }
    catch {
        /* ignore */
    }
}
/* ── appid extraction (mirrors the reference plugin's fallbacks) ───────── */
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
            const m = href.match(/\/app\/(\d+)/i) ||
                href.match(/\/details\/(\d+)/i) ||
                href.match(/run\/(\d+)/i);
            if (m)
                return m[1];
        }
    }
    catch {
        /* ignore */
    }
    try {
        for (const el of [capsule, ...Array.from(capsule.children)]) {
            const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
            if (!key)
                continue;
            let fiber = el[key];
            let depth = 0;
            while (fiber && depth < 5) {
                const p = fiber.memoizedProps || fiber.return?.memoizedProps;
                const id = p?.appid ?? p?.appId ?? p?.nAppID ?? p?.unAppID ?? p?.overview?.appid ??
                    p?.appOverview?.appid ?? p?.app?.appid ?? p?.item?.appid;
                if (id)
                    return String(id);
                fiber = fiber.return;
                depth++;
            }
        }
    }
    catch {
        /* ignore */
    }
    return null;
}
/** Non-Steam shortcuts: a NON-STEAM badge and/or an app-name badge, each
 *  independently toggleable. The name comes from the shortcut's exe folder. */
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
/** Primary badge: what the game IS in our terms. */
function classifyPrimary(appid) {
    if (slsIds.has(appid))
        return opts.sls ? "sls" : null;
    if (isNonSteamShortcut(appid))
        return null; // shortcuts are neither
    // "Legit" means owned — it must never apply to store/search results for games
    // that merely appear in a list, so the library check is required here.
    if (!isInLibrary(appid))
        return null;
    if (!slsLoaded)
        return null; // can't distinguish ours from owned yet
    // A game we ever added via SLSsteam isn't "owned" even if its manifest was
    // removed while it stays installed — so it must never badge as Legit.
    if (everAddedIds.has(appid))
        return null;
    // A game we've applied a fix to is ours, not owned — never Legit.
    if (onlineIds.has(appid) || fixedIds.has(appid))
        return null;
    return opts.legit ? "legit" : null;
}
/** Status badges: fixes we have actually installed for this game. */
function classifyApplied(appid) {
    const out = [];
    if (opts.onlineFix && onlineIds.has(appid))
        out.push("onlinefix");
    if (opts.fixed && fixedIds.has(appid))
        out.push("fixed");
    return out;
}
/** Secondary badge (right): Denuvo, which can apply to SLS and owned alike. */
function classifyDenuvo(appid) {
    if (!opts.denuvo)
        return false;
    if (isNonSteamShortcut(appid))
        return false;
    if (denuvoIds.has(appid))
        return true;
    // Not resolved yet — queue a throttled backend lookup for later passes.
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
        catch {
            /* ignore */
        }
    }, 1200);
}
/* ── badge injection ───────────────────────────────────────────────────── */
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
    // Already correct — nothing to do.
    const current = existing
        .filter((b) => b.getAttribute("data-appid") === String(appid))
        .map((b) => b.getAttribute("data-kind"));
    if (current.length === wanted.length &&
        wanted.every((k) => current.includes(k))) {
        return;
    }
    box?.remove();
    existing.forEach((b) => b.remove());
    const img = capsule.querySelector("img");
    const role = capsule.getAttribute("role");
    let target = null;
    if (role === "gridcell") {
        target = img ? capsule.querySelector("div") : capsule;
    }
    else if (role === "listitem") {
        target = img
            ? (img.closest("div") ?? capsule)
            : capsule;
    }
    if (!target)
        target = capsule;
    if (!target.hasAttribute(POSITIONED_ATTR)) {
        try {
            if (win.getComputedStyle(target).position === "static") {
                target.style.position = "relative";
            }
        }
        catch {
            /* ignore */
        }
        target.setAttribute(POSITIONED_ATTR, "true");
    }
    const container = win.document.createElement("div");
    container.className = `${BADGE_CLASS}-box`;
    // Inline styles so Steam's own capsule CSS can't override them (it strips the
    // text on some capsules when we rely on the injected stylesheet).
    container.style.cssText =
        "position:absolute;top:4px;left:4px;right:4px;z-index:9999;pointer-events:none;" +
            "display:flex;flex-wrap:wrap;gap:3px;";
    for (const kind of wanted) {
        const badge = win.document.createElement("div");
        badge.className = BADGE_CLASS;
        badge.setAttribute("data-appid", String(appid));
        badge.setAttribute("data-kind", kind);
        badge.textContent =
            kind === "nonsteamname" ? (nonSteamNames.get(appid) || "APP") : BADGE_LABELS[kind];
        badge.style.cssText =
            "flex:0 0 auto;white-space:nowrap;display:inline-block;overflow:visible;" +
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
            // Real game capsules nest role="link" below a panel layer; collection
            // tiles put it as the direct first child — skip those.
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
/* ── data refresh ──────────────────────────────────────────────────────── */
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
    catch {
        /* keep previous */
    }
    try {
        // Only pull the (backend-parsed) shortcut names when a name badge is on.
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
    catch {
        /* keep previous names */
    }
    try {
        const r = await getInstalledApps();
        if (r.success) {
            slsIds = new Set((r.apps || []).map((a) => Number(a.appid)));
            slsLoaded = true;
        }
    }
    catch {
        /* keep previous set */
    }
    try {
        const r = await getEverAdded();
        if (r.success)
            everAddedIds = new Set((r.appids || []).map((a) => Number(a)));
    }
    catch {
        /* keep previous set; slsLoaded stays as-is so LEGIT is suppressed on a
           cold-start failure but survives a transient refresh error */
    }
    try {
        const r = await denuvoKnown();
        if (r.success)
            denuvoIds = new Set(r.denuvo || []);
    }
    catch {
        /* keep previous */
    }
    try {
        const r = await getInstalledFixes();
        if (r.success) {
            // One applied-fix badge per game: online fix → ONLINE FIX, else FIXED.
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
    catch {
        /* keep previous */
    }
}
/* ── public API ────────────────────────────────────────────────────────── */
function removeAllBadges() {
    const win = getLibraryWindow();
    if (!win)
        return;
    try {
        win.document.querySelectorAll(`.${BADGE_CLASS}`).forEach((b) => b.remove());
    }
    catch {
        /* ignore */
    }
}
async function startBadges() {
    stopBadges();
    await refreshData();
    // The library grid is its own surface — off means no capsule badges at all.
    if (!opts.library) {
        removeAllBadges();
        return;
    }
    if (!opts.sls && !opts.legit && !opts.denuvo && !opts.onlineFix && !opts.fixed)
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
/** Re-read settings and repaint (call after toggling a badge option). */
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
function buildBar(appid, installed, fixAvailable) {
    const primaryLabel = installed ? "\uD83D\uDDD1 Remove" : "\uFF0B Add";
    const primaryAction = installed ? "remove" : "add";
    const primaryBg = installed ? "#c0392b" : "#5ba32b";
    const fixDisable = fixAvailable
        ? ""
        : "fixBtn.disabled=true;fixBtn.style.opacity='0.5';fixBtn.style.cursor='default';";
    return `(function(){
    var old=document.getElementById('lt-store-bar'); if(old) old.remove();
    var bar=document.createElement('div'); bar.id='lt-store-bar';
    bar.style.cssText='position:fixed;top:64px;right:16px;z-index:2147483000;display:flex;flex-direction:column;gap:6px;align-items:stretch;font-family:Arial,Helvetica,sans-serif;';
    var row=document.createElement('div'); row.style.cssText='display:flex;gap:6px;';
    function mk(label,action,bg){
      var b=document.createElement('button'); b.textContent=label;
      b.style.cssText='background:'+bg+';color:#fff;border:none;border-radius:4px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.5);white-space:nowrap;';
      b.onclick=function(){ try{ window.ltInvoke(JSON.stringify({action:action,appid:${appid}})); }catch(e){} };
      return b;
    }
    row.appendChild(mk(${JSON.stringify(primaryLabel)},${JSON.stringify(primaryAction)},${JSON.stringify(primaryBg)}));
    var fixBtn=mk('Fix','fix','#2a6bb0'); ${fixDisable} row.appendChild(fixBtn);
    row.appendChild(mk('\\u27F3 Reload','reload','#556'));
    var st=document.createElement('div'); st.id='lt-store-status';
    st.style.cssText='font-size:11px;color:#c6d4df;background:rgba(20,24,32,0.88);border-radius:4px;padding:3px 8px;text-align:center;';
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
 * Sidebar controls that act on whichever game page is currently open (library
 * app page or Steam store page). This is the reliable, default way to drive the
 * plugin. Restart Steam lives here — the single restart button.
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
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Game controls", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.75, padding: "2px 0" }, children: [noGame
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
                    setNote(`DLC unlock (${r.label || UNLOCKER_LABEL[kind]} ${r.tag || ""}) installed. Restart Steam.`);
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
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "This game", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85, padding: "2px 0" }, children: ["Proton: ", SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: protonLabel })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: pickProton, children: busy === "proton" ? "Working…" : "Change Proton version" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("backup", () => backupGameSaves(appid, ""), (r) => r.success
                        ? `Backed up ${r.fileCount} save file(s) to ${r.zipPath}`
                        : r.error || "Backup failed"), children: busy === "backup" ? "Backing up…" : "Back up this game's saves" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: restoreSaves, children: busy === "listsaves" || busy === "restore" ? "Working…" : "Restore saves from a backup" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("repair", () => repairGame(appid), (r) => r.success
                        ? `Repaired: ${(r.steps || []).join(", ") || "nothing needed"}`
                        : r.error || "Repair failed"), children: busy === "repair" ? "Repairing…" : "Repair this game" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: fixLaunchTarget, children: busy === "repoint" ? "Working…" : "Fix launch target (use game's real exe)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: ["If a fix doesn't take effect, point Steam at the game's real Binaries/Win64 executable. Preserves your other launch options.", repointed ? " · Currently repointed." : ""] }) }), repointed && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: resetLaunchTarget, children: "Reset launch target" }) })), smoke?.supported && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => doSmoke(!smoke.installed), children: busy === "smoke"
                                ? "Working…"
                                : smoke.installed
                                    ? "Remove DLC unlock (SmokeAPI)"
                                    : "Unlock DLC (SmokeAPI)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Emulates DLC ownership in-process for an owned game. Won't work on Ubisoft/EA/Rockstar/Denuvo-SecureDLC/anti-cheat titles. Reverted by Un-fix." }) })] })), ["cream", "uplayr1", "uplayr2"].map((kind) => dlcU[kind]?.supported ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => doUnlocker(kind, !dlcU[kind]?.installed), children: busy === `unlock-${kind}`
                        ? "Working…"
                        : dlcU[kind]?.installed
                            ? `Remove ${UNLOCKER_LABEL[kind]}`
                            : `Unlock ${UNLOCKER_LABEL[kind]}` }) }, kind)) : null), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("mp", () => checkMultiplayer(appid), (r) => {
                        setMp(r);
                        return r.success ? `${r.headline}\n\n${r.detail}` : r.error || "Could not check";
                    }), children: busy === "mp" ? "Checking…" : "Will multiplayer work?" }) }), mp?.verdict === "peer" && mp?.fix === "onlinefix" && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("onlinefix", () => patchGameOnlinefix(appid), (r) => {
                        if (!r.success)
                            return r.error || "Could not check this game";
                        const found = r.detectedFixes || [];
                        if (!found.length)
                            return r.message || "No online-fix DLLs found in this game.";
                        return `Found ${found.join(", ")} — set launch options to: ${r.launchOption}`;
                    }), children: busy === "onlinefix" ? "Working…" : "Set up online-fix multiplayer" }) })), note ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                        fontSize: 11,
                        opacity: 0.8,
                        lineHeight: 1.4,
                        padding: "2px 0",
                        wordBreak: "break-word",
                    }, children: note }) })) : null] }));
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
                    }), children: busy === "repair" ? "Repairing…" : `Repair what the check found (${repairable.length})` }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !!busy, onClick: () => run("backup", () => createBackup("", false, true), (r) => r.success ? `Backup saved to ${r.path}` : r.error || "Backup failed"), children: busy === "backup" ? "Backing up…" : "Back up my added games" }) }), note ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
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
 * Compact SLSsteam block for the quick-access panel: status chips + the single
 * install button. Everything else (injection, diagnostics, other dependencies)
 * lives on the Advanced page.
 */
function SlsSteamCompact() {
    const [status, setStatus] = SP_REACT.useState(null);
    const [inst, setInst] = SP_REACT.useState(null);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [showReinstall, setShowReinstall] = SP_REACT.useState(true);
    const poll = SP_REACT.useRef(null);
    const refresh = async () => {
        try {
            setStatus(await getSlssteamStatus());
        }
        catch { /* */ }
    };
    SP_REACT.useEffect(() => {
        refresh();
        getShowReinstallQam().then((r) => setShowReinstall(!!r.enabled)).catch(() => { });
        return () => { if (poll.current)
            clearInterval(poll.current); };
    }, []);
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
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "SLSsteam", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "2px 0" }, children: [SP_JSX.jsx(Chip$1, { ok: !!status?.installed, label: "Installed" }), SP_JSX.jsx(Chip$1, { ok: !!status?.injected, label: "Injected" })] }) }), working && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85, padding: "2px 0" }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 14, height: 14, marginRight: 8 } }), inst?.status === "queued" ? "Starting…" : "Installing…", typeof inst?.percent === "number" && inst.percent > 0 ? ` ${inst.percent}%` : ""] }) })), inst?.status === "failed" && inst?.error && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, color: "#f5a623", whiteSpace: "pre-wrap", wordBreak: "break-word" }, children: inst.error }) })), !working && (!status?.installed || showReinstall) && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: install, children: status?.installed ? "Reinstall SLSsteam" : "Install SLSsteam" }) }))] }));
}

function AddGameSection({ onChanged }) {
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
                    toaster.toast({ title: "SLSDeck", body: `Added ${name} — restart Steam to see it` });
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
    const busy = !!state && IN_PROGRESS.has(state.status || "");
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
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Add a game", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Search by name or AppID", value: query, onChange: (e) => runSearch(e.target.value) }) }), searching && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), " Searching\u2026"] }) })), !busy &&
                results.slice(0, 15).map((r) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => beginAdd(r.appid, r.name), children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: r.name }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: ["AppID ", r.appid] })] }) }) }, r.appid))), state && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { padding: "6px 0", fontSize: 13 }, children: [SP_JSX.jsx("div", { style: { fontWeight: 600 }, children: activeName || activeAppId }), SP_JSX.jsx("div", { style: { opacity: 0.8 }, children: statusLabel() }), state.contentCheckResult && state.status === "done" && (SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, marginTop: 4 }, children: ["Workshop: ", state.contentCheckResult.workshop, state.contentCheckResult.dlc &&
                                    ` · DLC included: ${state.contentCheckResult.dlc.included.length}, missing: ${state.contentCheckResult.dlc.missing.length}`] }))] }) })), busy && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onCancel, children: "Cancel" }) }))] }));
}

function Dot({ health }) {
    const color = health === "ok" ? "#58c578" : health === "warn" ? "#f5a623" : health === "off" ? "#c85c5c" : "#8b929a";
    return (SP_JSX.jsx("span", { style: {
            display: "inline-block", width: 9, height: 9, borderRadius: 9,
            marginRight: 8, flex: "0 0 auto", background: color,
        } }));
}
function DepRow({ label, hint, health, statusText, busy, actionLabel, onAction, }) {
    return (SP_JSX.jsxs("div", { style: { padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center" }, children: [SP_JSX.jsx(Dot, { health: busy ? "unknown" : health }), SP_JSX.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600 }, children: label }), SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7 }, children: busy ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 11, height: 11, marginRight: 6 } }), "working\u2026"] })) : statusText })] })] }), hint && SP_JSX.jsx("div", { style: { fontSize: 10.5, opacity: 0.55, margin: "2px 0 4px 17px" }, children: hint }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onAction, disabled: busy, children: actionLabel }) })] }));
}
/**
 * Setup & Dependencies. First run installs SLSsteam; afterwards each component
 * shows its own health and can be reinstalled individually.
 */
function DependenciesSection() {
    const [sls, setSls] = SP_REACT.useState(null);
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
            const r = await runClientFix();
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
        setN("cr", "installing… (first run is slow)");
        try {
            const r = await crEnsureInstalled();
            setN("cr", r.installed ? "installed" : "failed — " + (r.log || "check network"));
            toaster.toast({ title: "SLSDeck", body: r.installed ? "CloudRedirect ready" : "CloudRedirect install failed" });
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
    const runDiag = async () => {
        try {
            const d = await getDiagnostics();
            setDiag([
                `installed:      ${d.hasSLSsteamSo}`,
                `wrapped:        ${d.steamShWrapped}`,
                `AdditionalApps: ${(d.additionalApps || []).join(", ") || "(none)"}`,
                `SLSsteam.log:   ${d.slssteamLogExists ? `yes (${d.slssteamLogAgeSec}s ago)` : "MISSING - not loaded"}`,
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
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Setup", children: [!setupDone && !slsBusy && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: installSls, children: "Install SLSsteam" }) })), slsBusy && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.85 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 13, height: 13, marginRight: 8 } }), note.sls || "installing…"] }) })), SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DepRow, { label: "SLSsteam", hint: "Core steamclient hook that adds games to your library.", health: slsHealth, statusText: sls?.installed ? (sls.injected ? "installed · injected" : "installed · not injected") : "not installed", busy: slsBusy, actionLabel: sls?.installed ? "Reinstall SLSsteam" : "Install SLSsteam", onAction: installSls }), SP_JSX.jsx(DepRow, { label: "Steam client fix", hint: "Pins the Steam client to a version SLSsteam supports (h3adcr-b).", health: busy.fix ? "unknown" : sls?.clientFixRan ? "ok" : "warn", statusText: note.fix || (sls?.clientFixRan ? "applied" : "not run yet — run if games don't appear"), busy: !!busy.fix, actionLabel: "Run client fix", onAction: runFix }), SP_JSX.jsx(DepRow, { label: "CloudRedirect", hint: "Cloud saves for added games \u2014 installs automatically after setup. Configure in Advanced \u25B8 Cloud saves.", health: busy.cr ? "unknown" : note.cr === "installed" ? "ok" : "unknown", statusText: note.cr || "installs automatically after SLSsteam setup", busy: !!busy.cr, actionLabel: "Reinstall CloudRedirect", onAction: installCloud }), SP_JSX.jsxs("div", { style: { padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [SP_JSX.jsx("div", { style: { fontSize: 13, fontWeight: 600, margin: "2px 0 4px" }, children: "Injection & diagnostics" }), sls?.installed && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.7, margin: "0 0 4px 2px" }, children: ["Injection is ", sls.injectionActive ? "active" : "inactive", "."] }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: sls.injectionActive ? doDeactivate : doActivate, children: sls.injectionActive ? "Deactivate injection" : "Activate injection" }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: runDiag, children: "Run diagnostics" }) }), diag && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("pre", { style: { fontSize: 10, whiteSpace: "pre-wrap", opacity: 0.85, margin: 0 }, children: diag }) }))] })] })] }));
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
                            }, children: "Cancel (keep pin)" }) })] })), applyState && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.8, padding: "4px 0" }, children: ["Fix status: ", applyState.status, applyState.error ? ` — ${applyState.error}` : ""] }) })), installed.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontWeight: 600, marginTop: 6 }, children: "Applied fixes" }) }), installed.map((fix, i) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => confirmUnfix(fix), children: SP_JSX.jsxs(DFL.Focusable, { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: fix.gameName }), SP_JSX.jsxs("span", { style: { fontSize: 11, opacity: 0.6 }, children: [fix.fixType, " \u00B7 ", fix.date, " \u00B7 tap to undo"] })] }) }) }, `${fix.appid}-${fix.date}-${i}`)))] }))] }));
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
    }
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
    const load = async () => {
        try {
            const r = await crGetEnabled();
            setEnabled(!!r.enabled);
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
        setMsg("Checking / installing CloudRedirect… (first run can take a few minutes)");
        try {
            const ins = await crEnsureInstalled();
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
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Cloud saves (CloudRedirect)", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Cloud saves for added games", description: "Redirects Steam Cloud for added games to your provider. Switching fully on/off needs a client-fix re-run.", checked: enabled, onChange: onToggle, disabled: busy }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onOpen, disabled: busy, children: "Open CloudRedirect app (sign in)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, color: "#f5a623", padding: "2px 2px" }, children: "\u26A0 Experimental \u2014 it can affect save files. Back up saves you care about. Open the app once to sign into Google Drive / OneDrive / a local folder." }) }), msg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.75, padding: "0 2px" }, children: msg }) }))] }));
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
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Sources & keys", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, padding: "2px 0" }, children: "lua.tools account" }) }), lt?.authed ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, color: "#8fd694" }, children: ["\u2713 Signed in as ", lt.user?.name || "you", lt.supporter ? ` · ${lt.supporter}` : ""] }) }), lt?.debug && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 10, opacity: 0.5, wordBreak: "break-all" }, children: ["auth: ", JSON.stringify(lt.debug)] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doSignout, disabled: ltBusy, children: "Sign out" }) })] })) : (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doOauth, disabled: ltBusy, children: ltBusy ? "Waiting for Discord…" : "Sign in with Discord" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.7, padding: "0 2px 6px" }, children: "Opens Discord in Steam's browser \u2014 sign in and authorize, then return here. Signing in lets the plugin add games and pin fixes to the right build from lua.tools." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.55, padding: "0 2px 2px" }, children: "Fallback: paste a bot code from the lua.tools Discord bot instead." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bot code (optional)", value: ltCode, onChange: (e) => setLtCode(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doRedeem, disabled: ltBusy || !ltCode.trim(), children: ltBusy ? "Redeeming…" : "Redeem code" }) })] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.55, padding: "0 2px 6px" }, children: "Pin source order: lua.tools (signed in) \u2192 Hubcap key \u2192 ~/Downloads/<appid>.lua \u2192 none." }) }), fields.map((f) => (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: `${f.label} (optional)${f.hasKey ? " ✓" : ""}`, value: drafts[f.placeholder] ?? "", onChange: (e) => setDrafts((d) => ({ ...d, [f.placeholder]: e.target.value })) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(DFL.ButtonItem, { layout: "below", onClick: () => saveKey(f.placeholder), disabled: (drafts[f.placeholder] ?? "") === (f.value ?? ""), children: ["Save ", f.label] }) }), f.placeholder === "<moapikey>" && f.hasKey && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.85, padding: "2px 2px 6px" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: "Hubcap quota" }), SP_JSX.jsx("span", { style: { textDecoration: "underline", cursor: "pointer", opacity: 0.7 }, onClick: loadHub, children: hubBusy ? "refreshing…" : "refresh" })] }), hub ? (SP_JSX.jsxs("div", { style: { opacity: 0.85, marginTop: 2 }, children: [["single", "bundle", "workshop"].map((k) => hub[k] ? (SP_JSX.jsxs("div", { children: [k, ": ", hub[k].remaining, "/", hub[k].limit, " left", SP_JSX.jsxs("span", { style: { opacity: 0.6 }, children: [" (", hub[k].usage, " used)"] })] }, k)) : null), SP_JSX.jsxs("div", { style: { opacity: 0.6, marginTop: 2 }, children: ["Steam service: ", hub.steam_service_ready ? "ready ✓" : "not ready"] })] })) : (SP_JSX.jsx("div", { style: { opacity: 0.6, marginTop: 2 }, children: hubBusy ? "Loading…" : "Quota unavailable (check the key)." }))] }) }))] }, f.placeholder))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: `Ryuu API key (for denuvo/gated fixes)${ryuuKey ? " ✓" : ""}`, value: ryuuDraft, onChange: (e) => setRyuuDraft(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "From generator.ryuu.lol/api \u2014 needed to download Denuvo/gated fixes. Free manifests don't need a key." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: saveRyuuKey, disabled: ryuuDraft.trim() === (ryuuKey ?? ""), children: "Save Ryuu API key" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: `Steam Web API key (for Workshop mod search)${steamKey ? " ✓" : ""}`, value: steamDraft, onChange: (e) => setSteamDraft(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Optional. Get a free key at steamcommunity.com/dev/apikey for richer Workshop search (thumbnails, ranking). Without it, search still works via the public browse page." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: saveSteamKey, disabled: steamDraft.trim() === (steamKey ?? ""), children: "Save Steam Web API key" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 12, opacity: 0.7, padding: "2px 0" }, children: ["Sources: ", apis.length ? apis.map((a) => a.name).join(", ") : "none"] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onRefreshApis, children: "Refresh sources" }) })] }));
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
                                    : "Working…"] }) })), !working && !built && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [!st?.headers_ready && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("deps", hvInstallDeps, "Kernel headers installed"), children: "1. Install kernel headers" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("build", hvBuild, "Module built"), children: st?.headers_ready ? "Build module (native)" : "2. Build module (native)" }) }), podman && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("container", hvBuildContainer, "Module built (container)"), children: "Build module in container (podman)" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, opacity: 0.6 }, children: ["Compiles cpuid_fault_emulation.ko for your current kernel (", st?.kernel_release || "?", ") using", " ", st?.compiler_name || "the kernel compiler", ". Rebuild after a SteamOS kernel update."] }) })] })), !working && built && !loaded && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("load", hvLoadAuto, "Hypervisor enabled"), children: "Enable hypervisor" }) })), !working && built && loaded && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("unload", hvUnloadAuto, "Hypervisor disabled"), children: "Disable hypervisor" }) })), !working && built && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doTest, disabled: working, children: "Test cpuid faulting (self-test)" }) })), !working && built && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("build", hvBuild, "Module rebuilt"), children: "Rebuild for this kernel" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, marginTop: 6 }, children: "UMIP compatibility" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("umipstart", hvUmipStart, "UMIP compatibility started"), disabled: working, children: "Start UMIP daemon (no reboot)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("umipstop", hvUmipStop, "UMIP daemon stopped"), disabled: working, children: "Stop UMIP daemon" }) }), !st?.umip_disabled && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6 }, children: "The daemon (umipcompatd) provides UMIP compatibility without a reboot. If you prefer the permanent GRUB route, use \u201CDisable UMIP & reboot\u201D." }) })), !st?.umip_disabled && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("umip", hvDisableUmip, "UMIP disabled"), disabled: working, children: "Disable UMIP & reboot (permanent)" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-manage per game", description: "Watch Steam's game log and load the module while a flagged Denuvo game runs, then unload it. Off = manual only.", checked: (st?.game_watcher_mode || "manual") === "steam_log", onChange: onWatcher }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Start watcher at boot", description: "Start the per-game HV watcher when the plugin loads.", checked: autoload, onChange: onAutoload }) }), proton && !proton.installed && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: doInstallProton, disabled: working || !!protonDl, children: protonDl ? "Working…" : proton.tarballPresent ? "Install Denuvo Proton" : "Download & install Denuvo Proton (~505 MB)" }) }), protonDl && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 }, children: [SP_JSX.jsx(DFL.Spinner, { style: { width: 16, height: 16 } }), SP_JSX.jsx("span", { children: protonDl.status === "downloading" ? `Downloading… ${protonDl.percent}%`
                                        : protonDl.status === "extracting" ? "Extracting…" : protonDl.status })] }) }))] })), games.length > 0 && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 12, fontWeight: 600, marginTop: 4 }, children: "Marked games" }) }), games.map((aid) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => unmark(aid), children: SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", textAlign: "left" }, children: [SP_JSX.jsx("span", { style: { fontWeight: 600 }, children: appDisplayName(Number(aid)) || `AppID ${aid}` }), SP_JSX.jsx("span", { style: { fontSize: 11, opacity: 0.6 }, children: "tap to unmark" })] }) }) }, aid)))] })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => run("reboot", hvReboot, "Rebooting…"), disabled: working, children: "Reboot Deck now" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: loadLog, children: showLog ? "Hide build log ▾" : "Show build log ▸" }) }), showLog && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 10, opacity: 0.75, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 240, overflowY: "auto" }, children: log }) })), st?.kernel_release && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 10, opacity: 0.5 }, children: ["kernel ", st.kernel_release, st?.compiler_name ? ` · ${st.compiler_name}` : ""] }) }))] }));
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

/* ── Injection recovery (auto-heal after a Steam client update) ─────────── */
function AddDownloadToggle() {
    const [on, setOn] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => { getAutoDownload().then((r) => setOn(!!r.enabled)).catch(() => { }); }, []);
    return (SP_JSX.jsx(DFL.PanelSection, { title: "Adding games", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-download after adding", description: "When a game is added and injection is live, tell SLSsteam to start the download immediately (no Steam restart). A soft UI reload shows the tile + download queue.", checked: on, onChange: async (v) => { setOn(v); await setAutoDownload(v); } }) }) }));
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
function OptionsPane() {
    const [dlc, setDlc] = SP_REACT.useState(false);
    const [storeOn, setStoreOn] = SP_REACT.useState(true);
    const [pin, setPin] = SP_REACT.useState(true);
    const [hideOwned, setHideOwned] = SP_REACT.useState(true);
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
    const [autoFix, setAutoFixState] = SP_REACT.useState(false);
    const [libButtons, setLibButtons] = SP_REACT.useState(true);
    const [autoApply, setAutoApplyState] = SP_REACT.useState(false);
    const [autoRepoint, setAutoRepointState] = SP_REACT.useState(true);
    const [hideToolsQam, setHideToolsQamState] = SP_REACT.useState(true);
    const [achievements, setAchievementsState] = SP_REACT.useState(true);
    const [achMoon, setAchMoon] = SP_REACT.useState(true);
    SP_REACT.useEffect(() => {
        getDlcOption().then((r) => setDlc(!!r.enabled)).catch(() => { });
        getStoreDisabled().then((r) => setStoreOn(!r.disabled)).catch(() => { });
        getPinOnFix().then((r) => setPin(!!r.enabled)).catch(() => { });
        getAutoApply().then((r) => setAutoApplyState(!!r.enabled)).catch(() => { });
        getAutoRepoint().then((r) => setAutoRepointState(!!r.enabled)).catch(() => { });
        getAchievements().then((r) => { setAchievementsState(!!r.enabled); setAchMoon(r.moon !== false); }).catch(() => { });
        getHideToolsQam().then((r) => setHideToolsQamState(!!r.enabled)).catch(() => { });
        getHideOnOwned().then((r) => setHideOwned(!!r.enabled)).catch(() => { });
        getGamesInQam().then((r) => setGamesQam(!!r.enabled)).catch(() => { });
        getShowReinstallQam().then((r) => setReinstallQam(!!r.enabled)).catch(() => { });
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
    return (SP_JSX.jsxs(Body, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Options", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Store buttons", description: "Floating Add / Fix bar on store game pages.", checked: storeOn, onChange: async (v) => {
                                setStoreOn(v);
                                await setStoreDisabled(!v);
                                toaster.toast({ title: "SLSDeck", body: v ? "Store buttons on" : "Store buttons off" });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Unlock DLC when adding a game", description: "Marks the game's DLC as owned so it unlocks. Only needed for games with 60+ DLC \u2014 SLSsteam already unlocks the rest automatically. In-game (entitlement) DLC unlocks right away; DLC that downloads as separate files still needs those files.", checked: dlc, onChange: async (v) => { setDlc(v); await setDlcOption(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Pin game version on fix", description: "Locks a game to its current version when a fix is applied so an update can't break it. Cleared on un-fix.", checked: pin, onChange: async (v) => { setPin(v); await setPinOnFix(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-apply fix after update", description: "When a fix targets a specific build, pin it and update the game, then apply automatically once the download finishes. Off = guided: you press Apply after the download completes.", checked: autoApply, onChange: async (v) => { setAutoApplyState(v); await setAutoApply(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-fix launch target", description: "When a fix ships its own replacement exe, repoint Steam's launch to the game's real Binaries/Win64 exe so the fix actually runs (bypasses a broken launcher). Additive \u2014 your other launch options are kept. Per-game override lives under Quick Access \u2192 This game.", checked: autoRepoint, onChange: async (v) => { setAutoRepointState(v); await setAutoRepoint(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Achievements (slsteam-moon)", description: achMoon
                                ? "Let added games unlock achievements — moon fetches the real schema live from Steam by impersonating an owner. Restart Steam after changing."
                                : "Needs the slsteam-moon engine. Stock SLSsteam ignores this setting (use SLScheevo to pre-generate achievements instead).", checked: achievements, onChange: async (v) => { setAchievementsState(v); await setAchievements(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Hide tools & diagnostics in Quick Access", description: "Hide the Tools and Diagnostics sections from the Quick Access panel for a cleaner menu. They remain here in Advanced.", checked: hideToolsQam, onChange: async (v) => { setHideToolsQamState(v); await setHideToolsQam(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Show added games in Quick Access", description: "Move the added-games list into the Quick Access panel, under Game controls (removes the Installed tab here). Applies when the panel is reopened.", checked: gamesQam, onChange: async (v) => { setGamesQam(v); await setGamesInQam(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Show Reinstall SLSsteam in Quick Access", description: "When SLSsteam is installed, show its Reinstall button in the Quick Access panel. Install still shows when it isn't installed yet.", checked: reinstallQam, onChange: async (v) => { setReinstallQam(v); await setShowReinstallQam(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: libButtons ? "Hide actions on owned games" : "Hide actions on owned games (Quick Access)", description: "On game pages, hide Add with SLSsteam and Fixes for titles you already own (anything in your library that wasn't added by SLSsteam).", checked: hideOwned, onChange: async (v) => { setHideOwned(v); await setHideOnOwned(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-apply fixes after adding", description: "When an add finishes, download and apply the online fix and/or Denuvo fix if available. A Denuvo fix also marks the game and installs the custom Proton.", checked: autoFix, onChange: async (v) => { setAutoFixState(v); await setAutoFix(v); } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Library buttons on game pages", description: "The Add / Fixes bar injected into the game's library page. Turn off to use only the Quick Access panel.", checked: libButtons, onChange: async (v) => { setLibButtons(v); await setLibraryButtons(v); } }) })] }), SP_JSX.jsx(AddDownloadToggle, {}), SP_JSX.jsx(InjectionRecovery, {}), SP_JSX.jsxs(DFL.PanelSection, { title: "Library badges", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "SLS badge", description: "Marks games added through SLSsteam.", checked: badgeSls, onChange: async (v) => {
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
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }, children: "Non-Steam shortcuts are never badged \u2014 they're neither SLSsteam additions nor licensed Steam titles." }) })] }), SP_JSX.jsx(BackupSection, {})] }));
}
/* ── About pane ────────────────────────────────────────────────────────── */
function AboutPane() {
    return (SP_JSX.jsx(Body, { children: SP_JSX.jsx(DFL.PanelSection, { title: "About SLSDeck", children: SP_JSX.jsxs("div", { style: { fontSize: 13, lineHeight: 1.5, opacity: 0.9 }, children: [SP_JSX.jsxs("p", { children: ["SLSDeck adds games to your Steam library on SteamOS. It replaces the Windows-only SteamTools loader with ", SP_JSX.jsx("b", { children: "SLSsteam" }), ", an LD_AUDIT hook into the Steam client, and layers on game fixes and manifest sources."] }), SP_JSX.jsxs("p", { children: [SP_JSX.jsx("b", { children: "First time here?" }), " Open the ", SP_JSX.jsx("b", { children: "Dependencies" }), " tab and run \u201CInstall SLSsteam\u201D. Afterwards each component can be reinstalled on its own from the same tab."] }), SP_JSX.jsx("p", { style: { color: "#f5a623" }, children: "CloudRedirect is experimental. Back up saves you care about. This build has no hypervisor \u2014 Denuvo-protected games are not supported." }), SP_JSX.jsx("p", { style: { opacity: 0.6, fontSize: 12 }, children: "Author: unknown" })] }) }) }));
}
/* ── the page ──────────────────────────────────────────────────────────── */
function AdvancedPage() {
    const [tok, setTok] = SP_REACT.useState(0);
    const bump = () => setTok((t) => t + 1);
    const [gamesInQam, setGamesInQam2] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        getGamesInQam().then((r) => setGamesInQam2(!!r.enabled)).catch(() => { });
    }, []);
    return (SP_JSX.jsx(DFL.SidebarNavigation, { title: "SLSDeck", showTitle: true, pages: [
            {
                title: "Options",
                icon: SP_JSX.jsx(FaSlidersH, {}),
                content: SP_JSX.jsx(OptionsPane, {}),
            },
            {
                title: "Sources & keys",
                icon: SP_JSX.jsx(FaKey, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(SettingsSection, {}) }),
            },
            {
                title: "Dependencies",
                icon: SP_JSX.jsx(FaBoxOpen, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(DependenciesSection, {}) }),
            },
            {
                title: "Add a game",
                icon: SP_JSX.jsx(FaDownload, {}),
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(AddGameSection, { onChanged: bump }) }),
            },
            {
                title: "Installed",
                icon: SP_JSX.jsx(FaGamepad, {}),
                visible: !gamesInQam,
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(InstalledSection, { refreshToken: tok, onChanged: bump }) }),
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
                content: SP_JSX.jsx(Body, { children: SP_JSX.jsx(HypervisorSection, {}) }),
            },
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
    return (SP_JSX.jsxs(DFL.ModalRoot, { closeModal: closeModal, children: [SP_JSX.jsx("div", { style: { fontSize: 20, fontWeight: 600, marginBottom: 10 }, children: "Fixes" }), SP_JSX.jsx(FixPicker, { appid: appid })] }));
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
            setHiddenForOwned(shouldHideForOwned(appid, ours, pref));
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
/**
 * The same SLS / LEGIT / DENUVO badges as the library capsules, shown on the
 * game details page. Independent of the library-button and hide-on-owned
 * toggles — this is purely informational.
 */
function GameDetailsBadge() {
    const params = DFL.useParams();
    const appid = params?.appid && /^\d+$/.test(params.appid) ? parseInt(params.appid, 10) : null;
    const [kinds, setKinds] = SP_REACT.useState([]);
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
                // Unknown, not "not ours" — otherwise an SLS game gets badged LEGIT.
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
            // Fixes we've actually installed for this game.
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
            // A fixed game is ours, not owned — never show Legit alongside a fix badge.
            // No "bypassed" here: Kind has no such member, so that comparison was
            // always false. Bypass/crack fixes are already classified as "fixed".
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
    return (SP_JSX.jsx("div", { style: { display: "flex", gap: 8, margin: "12px 24px 0" }, children: kinds.map((k) => (SP_JSX.jsx("div", { style: {
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: "#fff",
                background: STYLES[k].background,
                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
            }, children: STYLES[k].label }, k))) }));
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
/** Floating button + status line, injected into the workshop page's JS world. */
function buildButton(modid) {
    return `(function(){
    try{
      var OLD=document.getElementById('lt-ws-wrap'); if(OLD) OLD.remove();
      var wrap=document.createElement('div'); wrap.id='lt-ws-wrap';
      wrap.style.cssText='position:fixed;right:16px;bottom:16px;z-index:2147483647;font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:6px;';
      var status=document.createElement('div'); status.id='lt-ws-status';
      status.style.cssText='background:rgba(20,24,32,0.92);color:#c7d5e0;padding:4px 10px;border-radius:6px;font-size:12px;max-width:280px;display:none;';
      var btn=document.createElement('button'); btn.id='lt-ws-btn'; btn.textContent='⬇ Download with SLSDeck';
      btn.style.cssText='background:#5ba32b;color:#fff;border:none;padding:10px 16px;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
      btn.onclick=function(){
        try{ btn.disabled=true; btn.style.opacity='0.6'; status.style.display='block'; status.textContent='Resolving…';
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
// Remembers where the panel was scrolled so reopening the QAM returns there.
let savedScroll = 0;
function Content() {
    const [refreshToken, setRefreshToken] = SP_REACT.useState(0);
    const bump = () => setRefreshToken((t) => t + 1);
    const [gamesInQam, setGamesInQam] = SP_REACT.useState(true);
    const [hideToolsQam, setHideToolsQam] = SP_REACT.useState(true);
    SP_REACT.useEffect(() => {
        getGamesInQam().then((r) => setGamesInQam(!!r.enabled)).catch(() => { });
        getHideToolsQam().then((r) => setHideToolsQam(!!r.enabled)).catch(() => { });
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
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("div", { ref: anchor, style: { height: 0 } }), SP_JSX.jsx(GameControlsSection, { onChanged: bump }), gamesInQam && SP_JSX.jsx(InstalledSection, { refreshToken: refreshToken, onChanged: bump }), SP_JSX.jsx(SlsSteamCompact, {}), SP_JSX.jsx(GameToolsSection, {}), !hideToolsQam && SP_JSX.jsx(ToolsSection, {})] }));
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
                toaster.toast({
                    title: "SLSDeck",
                    body: e.status === "done" && e.success
                        ? (dl ? `Added ${e.name} — downloading in Steam…` : `Added ${e.name} — restart Steam to see it`)
                        : `Add failed: ${e.name}${e.error ? " — " + e.error : ""}`,
                });
                if (e.status === "done" && e.success) {
                    // Auto-download fired via the SLSsteam API in the live session; a soft
                    // UI reload makes the library tile + download queue show immediately.
                    if (dl) {
                        reloadSteam().catch(() => { });
                    }
                    getAutoFix()
                        .then((r) => (r.enabled ? addAutoFixPending(e.appid) : undefined))
                        .catch(() => { });
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
