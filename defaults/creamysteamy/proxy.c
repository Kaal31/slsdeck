/* ========================================================================= */
/* Platform detection & portability headers                                  */
/* ========================================================================= */
#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#define _CRT_SECURE_NO_WARNINGS
#include <Windows.h>
typedef HMODULE lib_handle_t;
#define LIB_NULL NULL
#define REAL_LIB_NAME "steam_api_o.dll"
#define PATH_SEP '\\'
#define strncasecmp _strnicmp
#define LIB_EXPORT __declspec(dllexport)
#else
#define _GNU_SOURCE
#include <dlfcn.h>
#include <unistd.h>
typedef void *lib_handle_t;
#define LIB_NULL NULL
#define REAL_LIB_NAME "steam_api_o.so"
#define PATH_SEP '/'
#define LIB_EXPORT
#endif

#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ========================================================================= */
/* Include automatically generated stuff                                     */
/* ========================================================================= */

__attribute__((used)) static int32_t API_ID;

#ifdef AUTOMATICALLY_GENERATED_STUFF
#include AUTOMATICALLY_GENERATED_STUFF
#else
#warning "use deploy.py, instead of compiling by hand"

#define _FWD_IDX_COUNT 0
static const char *_fwd_name[_FWD_IDX_COUNT] = {};
static void *_fwd_ptr[_FWD_IDX_COUNT] = {};
#endif

/* ========================================================================= */
/* Platform-abstracted dynamic linking                                       */
/* ========================================================================= */

/** Return the absolute path of the currently-executing module (.so / .dll). */
static bool get_self_path(char *out, size_t outsize) {
#ifdef _WIN32
  HMODULE hmod = NULL;
  /* GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS gives us our own DLL handle */
  GetModuleHandleExA(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                         GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
                     (LPCSTR)&get_self_path, &hmod);
  return GetModuleFileNameA(hmod, out, (DWORD)outsize) != 0;
#else
  /* /proc/self/exe is the host EXE; use dladdr to get the .so path */
  Dl_info info;
  if (dladdr((void *)&get_self_path, &info) && info.dli_fname) {
    strncpy(out, info.dli_fname, outsize - 1);
    out[outsize - 1] = '\0';
    return true;
  }
  /* Fallback: resolve the executable path */
  ssize_t len = readlink("/proc/self/exe", out, outsize - 1);
  if (len > 0) {
    out[len] = '\0';
    return true;
  }
  return false;
#endif
}

/** Open a shared library. Returns NULL on failure. */
static lib_handle_t lib_open(const char *path) {
#ifdef _WIN32
  return LoadLibraryA(path);
#else
  return dlopen(path, RTLD_NOW | RTLD_LOCAL);
#endif
}

/** Resolve a symbol from an open library handle. */
static void *lib_sym(lib_handle_t handle, const char *name) {
#ifdef _WIN32
  return (void *)GetProcAddress(handle, name);
#else
  return dlsym(handle, name);
#endif
}

static void lib_close(lib_handle_t handle) {
#ifdef _WIN32
  FreeLibrary(handle);
#else
  dlclose(handle);
#endif
}

/** Human-readable last error string (static buffer – not thread-safe). */
static const char *lib_error(void) {
#ifdef _WIN32
  static char buf[256];
  DWORD err = GetLastError();
  FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
                 NULL, err, 0, buf, sizeof(buf), NULL);
  return buf;
#else
  return dlerror();
#endif
}

/* ========================================================================= */
/* Portable path helpers                                                     */
/* ========================================================================= */

/** In-place: strip the filename, keep the trailing separator + NUL. */
static void path_dirname(char *path) {
  char *slash = strrchr(path, PATH_SEP);
#ifdef _WIN32
  /* Windows can have both separators */
  char *fslash = strrchr(path, '/');
  if (fslash > slash)
    slash = fslash;
#endif
  if (slash)
    slash[1] = '\0';
  else
    path[0] = '\0';
}

/** Append `filename` to `dir` (which must have room). */
static void path_join(char *dir, size_t dirsize, const char *filename) {
  size_t len = strlen(dir);
  /* Ensure trailing separator */
  if (len > 0 && dir[len - 1] != PATH_SEP && dir[len - 1] != '/') {
    if (len + 1 < dirsize) {
      dir[len] = PATH_SEP;
      dir[len + 1] = '\0';
    }
  }
  strncat(dir, filename, dirsize - strlen(dir) - 1);
}

/** Check whether a file is readable. */
static bool file_readable(const char *path) {
#ifdef _WIN32
  DWORD attr = GetFileAttributesA(path);
  return (attr != INVALID_FILE_ATTRIBUTES) &&
         !(attr & FILE_ATTRIBUTE_DIRECTORY);
#else
  return access(path, R_OK) == 0;
#endif
}

/* ========================================================================= */
/* Logging                                                                   */
/* ========================================================================= */
static FILE *g_logfile = NULL;
static int g_log_enabled = -1;

static void log_init(void) {
  if (g_log_enabled != -1)
    return;
  g_log_enabled = 1;

  const char *logpath = getenv("CREAMY_LOG_PATH");
  static char buf[4096];

  if (!logpath) {
    if (get_self_path(buf, sizeof(buf))) {
      path_dirname(buf);
      path_join(buf, sizeof(buf), "creamy_log.txt");
      logpath = buf;
    } else {
#ifdef _WIN32
      logpath = "C:\\Temp\\creamy_log.txt";
#else
      logpath = "/tmp/creamy_log.txt";
#endif
    }
  }

  g_logfile = fopen(logpath, "w");
  if (!g_logfile) {
    g_log_enabled = 0;
    return;
  }
  fprintf(g_logfile, "[CreamySteamy] Log started, PID=%d\n",
          (int)
#ifdef _WIN32
              GetCurrentProcessId()
#else
              getpid()
#endif
  );
  fflush(g_logfile);
}

#define LOG(...)                                                               \
  do {                                                                         \
    log_init();                                                                \
    if (g_log_enabled && g_logfile) {                                          \
      fprintf(g_logfile, "[CreamySteamy] ");                                   \
      fprintf(g_logfile, __VA_ARGS__);                                         \
      fprintf(g_logfile, "\n");                                                \
      fflush(g_logfile);                                                       \
    }                                                                          \
  } while (0)

/* ========================================================================= */
/* DLC Configuration                                                         */
/* ========================================================================= */
#define MAX_DLCS 512

typedef struct {
  uint32_t app_id;
  char name[256];
} DlcEntry;

static DlcEntry g_dlcs[MAX_DLCS];
static int g_dlc_count = 0;
static bool g_config_loaded = false;

static char *trim(char *s) {
  while (*s == ' ' || *s == '\t')
    s++;
  char *end = s + strlen(s) - 1;
  while (end > s &&
         (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r'))
    *end-- = '\0';
  return s;
}

/**
 * Search for cream_api.ini in order:
 *   1. CREAM_CONFIG_PATH env var
 *   2. Same directory as this .dll / .so
 *   3. Two directories up (game root)
 *   4. Current working directory
 */
static void find_config_path(char *out, size_t outsize) {
  const char *env = getenv("CREAM_CONFIG_PATH");
  if (env) {
    strncpy(out, env, outsize - 1);
    out[outsize - 1] = '\0';
    return;
  }

  char buf[4096];

  /* 1 – Same dir as library */
  if (get_self_path(buf, sizeof(buf))) {
    path_dirname(buf);
    path_join(buf, sizeof(buf), "cream_api.ini");
    if (file_readable(buf)) {
      strncpy(out, buf, outsize - 1);
      out[outsize - 1] = '\0';
      return;
    }

    /* 2 – Two dirs up */
    get_self_path(buf, sizeof(buf));
    path_dirname(buf); /* strip filename    */
    if (strlen(buf) > 1) {
      buf[strlen(buf) - 1] = '\0'; /* strip trailing sep */
      path_dirname(buf);           /* up one              */
    }
    if (strlen(buf) > 1) {
      buf[strlen(buf) - 1] = '\0';
      path_dirname(buf); /* up two              */
    }
    path_join(buf, sizeof(buf), "cream_api.ini");
    if (file_readable(buf)) {
      strncpy(out, buf, outsize - 1);
      out[outsize - 1] = '\0';
      return;
    }
  }

  /* 3 – CWD */
  if (file_readable("cream_api.ini")) {
    strncpy(out, "cream_api.ini", outsize - 1);
    out[outsize - 1] = '\0';
    return;
  }

  out[0] = '\0';
}

static void load_config(void) {
  if (g_config_loaded)
    return;
  g_config_loaded = true;

  char path[4096] = {0};
  find_config_path(path, sizeof(path));

  if (!path[0]) {
    LOG("ERROR: Cannot find cream_api.ini");
    return;
  }

  FILE *f = fopen(path, "r");
  if (!f) {
    LOG("ERROR: Cannot open config file: %s", path);
    return;
  }

  LOG("Loading config from: %s", path);

  char line[1024];
  int in_dlc_section = 0;

  while (fgets(line, sizeof(line), f)) {
    char *s = trim(line);
    if (!s[0] || s[0] == '#' || s[0] == ';')
      continue;
    if (s[0] == '[') {
      in_dlc_section = (strncasecmp(s, "[dlc]", 5) == 0);
      continue;
    }
    if (in_dlc_section && g_dlc_count < MAX_DLCS) {
      char *eq = strchr(s, '=');
      if (!eq)
        continue;
      *eq = '\0';
      char *id_str = trim(s);
      char *name = trim(eq + 1);
      uint32_t id = (uint32_t)strtoul(id_str, NULL, 10);
      if (id > 0) {
        g_dlcs[g_dlc_count].app_id = id;
        strncpy(g_dlcs[g_dlc_count].name, name, sizeof(g_dlcs[0].name) - 1);
        g_dlcs[g_dlc_count].name[sizeof(g_dlcs[0].name) - 1] = '\0';
        LOG("Added DLC: %u = %s", id, name);
        g_dlc_count++;
      }
    }
  }
  fclose(f);
  LOG("Loaded %d DLCs", g_dlc_count);
}

static bool is_dlc_owned(uint32_t app_id) {
  for (int i = 0; i < g_dlc_count; i++)
    if (g_dlcs[i].app_id == app_id)
      return true;
  return false;
}

/* ========================================================================= */
/* Real library handle                                                       */
/* ========================================================================= */
static lib_handle_t g_real_lib = LIB_NULL;

static void ensure_real_lib(void) {
  if (g_real_lib)
    return;

  char real_path[4096] = {0};

  if (get_self_path(real_path, sizeof(real_path))) {
    path_dirname(real_path);
    path_join(real_path, sizeof(real_path), REAL_LIB_NAME);
    g_real_lib = lib_open(real_path);
  }

  if (!g_real_lib) {
    /* Fallback: relative path */
    g_real_lib = lib_open("."
#ifdef _WIN32
                          "\\"
#else
                          "/"
#endif
                          REAL_LIB_NAME);
  }

  if (!g_real_lib)
    LOG("FATAL: Cannot load real %s: %s", REAL_LIB_NAME, lib_error());
  else
    LOG("Loaded real library from: %s", real_path);
}

static void *get_real_fn(const char *name) {
  ensure_real_lib();
  if (!g_real_lib)
    return NULL;
  return lib_sym(g_real_lib, name);
}
/* ========================================================================= */
/* DLC Override Functions                                                      */
/* ========================================================================= */

typedef uint32_t AppId_t;
typedef uint64_t CSteamID_flat;

LIB_EXPORT bool SteamAPI_ISteamApps_BIsDlcInstalled(void *self, AppId_t appID) {
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("BIsDlcInstalled(%u) -> true (UNLOCKED)", appID);
        return true;
    }
    typedef bool (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)get_real_fn("SteamAPI_ISteamApps_BIsDlcInstalled");
    bool r = real ? real(self, appID) : false;
    LOG("BIsDlcInstalled(%u) -> %s (real)", appID, r ? "true" : "false");
    return r;
}

LIB_EXPORT bool SteamAPI_ISteamApps_BIsSubscribedApp(void *self, AppId_t appID) {
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("BIsSubscribedApp(%u) -> true (UNLOCKED)", appID);
        return true;
    }
    typedef bool (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)get_real_fn("SteamAPI_ISteamApps_BIsSubscribedApp");
    bool r = real ? real(self, appID) : false;
    LOG("BIsSubscribedApp(%u) -> %s (real)", appID, r ? "true" : "false");
    return r;
}

LIB_EXPORT bool SteamAPI_ISteamApps_BIsSubscribed(void *self) {
    LOG("BIsSubscribed -> true");
    return true;
}

LIB_EXPORT int SteamAPI_ISteamApps_GetDLCCount(void *self) {
    load_config();
    LOG("GetDLCCount -> %d", g_dlc_count);
    return g_dlc_count;
}

LIB_EXPORT bool SteamAPI_ISteamApps_BGetDLCDataByIndex(void *self, int iDLC, AppId_t *pAppID, bool *pbAvailable, char *pchName, int cchNameBufferSize) {
    load_config();
    if (iDLC >= 0 && iDLC < g_dlc_count) {
        *pAppID = g_dlcs[iDLC].app_id;
        *pbAvailable = true;
        if (cchNameBufferSize > 0) {
            strncpy(pchName, g_dlcs[iDLC].name, (size_t)(cchNameBufferSize - 1));
            pchName[cchNameBufferSize - 1] = '\0';
        }
        LOG("BGetDLCDataByIndex(%d) -> %u '%s'", iDLC, g_dlcs[iDLC].app_id, g_dlcs[iDLC].name);
        return true;
    }
    typedef bool (*fn_t)(void*, int, AppId_t*, bool*, char*, int);
    fn_t real = (fn_t)get_real_fn("SteamAPI_ISteamApps_BGetDLCDataByIndex");
    return real ? real(self, iDLC, pAppID, pbAvailable, pchName, cchNameBufferSize) : false;
}

LIB_EXPORT bool SteamAPI_ISteamApps_BIsAppInstalled(void *self, AppId_t appID) {
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("BIsAppInstalled(%u) -> true (UNLOCKED)", appID);
        return true;
    }
    typedef bool (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)get_real_fn("SteamAPI_ISteamApps_BIsAppInstalled");
    return real ? real(self, appID) : false;
}

LIB_EXPORT uint32_t SteamAPI_ISteamApps_GetEarliestPurchaseUnixTime(void *self, AppId_t appID) {
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("GetEarliestPurchaseUnixTime(%u) -> 1577836800 (UNLOCKED)", appID);
        return 1577836800; /* 2020-01-01 */
    }
    typedef uint32_t (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)get_real_fn("SteamAPI_ISteamApps_GetEarliestPurchaseUnixTime");
    return real ? real(self, appID) : 0;
}

LIB_EXPORT int SteamAPI_ISteamUser_UserHasLicenseForApp(void *self, CSteamID_flat steamID, AppId_t appID) {
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("UserHasLicenseForApp(%u) -> HasLicense (UNLOCKED)", appID);
        return 0; /* k_EUserHasLicenseResultHasLicense */
    }
    typedef int (*fn_t)(void*, CSteamID_flat, AppId_t);
    fn_t real = (fn_t)get_real_fn("SteamAPI_ISteamUser_UserHasLicenseForApp");
    return real ? real(self, steamID, appID) : 2;
}

/* ========================================================================= */
/* ISteamApps vtable hooking                                                  */
/* Games using SteamInternal_FindOrCreateUserInterface get an ISteamApps*     */
/* with a C++ vtable. We patch the vtable to intercept DLC methods.           */
/* ========================================================================= */

#define VTABLE_SLOTS 64
#define VTIDX_BIsSubscribed              0
#define VTIDX_BIsSubscribedApp           6
#define VTIDX_BIsDlcInstalled            7
#define VTIDX_GetEarliestPurchaseUnixTime 8
#define VTIDX_GetDLCCount                10
#define VTIDX_BGetDLCDataByIndex         11
#define VTIDX_BIsAppInstalled            19

static void *g_patched_vtable[VTABLE_SLOTS];
static bool g_vtable_patched = false;
static void *g_real_vt[VTABLE_SLOTS];

static bool vt_BIsSubscribed(void *self) {
    LOG("[vtable] BIsSubscribed -> true");
    return true;
}

static bool vt_BIsSubscribedApp(void *self, AppId_t appID) {
    LOG("api: %s", __PRETTY_FUNCTION__);
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("[vtable] BIsSubscribedApp(%u) -> true (UNLOCKED)", appID);
        return true;
    }
    typedef bool (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)g_real_vt[VTIDX_BIsSubscribedApp];
    bool r = real ? real(self, appID) : false;
    LOG("[vtable] BIsSubscribedApp(%u) -> %s (real)", appID, r ? "true" : "false");
    return r;
}

static bool vt_BIsDlcInstalled(void *self, AppId_t appID) {
    LOG("api: %s, %p, %d", __PRETTY_FUNCTION__, self, appID);
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("[vtable] BIsDlcInstalled(%u) -> true (UNLOCKED)", appID);
        return true;
    }
    typedef bool (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)g_real_vt[VTIDX_BIsDlcInstalled];
    bool r = real ? real(self, appID) : false;
    LOG("[vtable] BIsDlcInstalled(%u) -> %s (real)", appID, r ? "true" : "false");
    return r;
}

static uint32_t vt_GetEarliestPurchaseUnixTime(void *self, AppId_t appID) {
    LOG("api: %s", __PRETTY_FUNCTION__);
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("[vtable] GetEarliestPurchaseUnixTime(%u) -> 1577836800 (UNLOCKED)", appID);
        return 1577836800;
    }
    typedef uint32_t (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)g_real_vt[VTIDX_GetEarliestPurchaseUnixTime];
    return real ? real(self, appID) : 0;
}

static int vt_GetDLCCount(void *self) {
    LOG("api: %s", __PRETTY_FUNCTION__);
    load_config();
    LOG("[vtable] GetDLCCount -> %d", g_dlc_count);
    return g_dlc_count;
}

static bool vt_BGetDLCDataByIndex(void *self, int iDLC, AppId_t *pAppID, bool *pbAvailable, char *pchName, int cchNameBufferSize) {
    LOG("api: %s", __PRETTY_FUNCTION__);
    load_config();
    if (iDLC >= 0 && iDLC < g_dlc_count) {
        *pAppID = g_dlcs[iDLC].app_id;
        *pbAvailable = true;
        if (cchNameBufferSize > 0) {
            strncpy(pchName, g_dlcs[iDLC].name, (size_t)(cchNameBufferSize - 1));
            pchName[cchNameBufferSize - 1] = '\0';
        }
        LOG("[vtable] BGetDLCDataByIndex(%d) -> %u '%s'", iDLC, g_dlcs[iDLC].app_id, g_dlcs[iDLC].name);
        return true;
    }
    typedef bool (*fn_t)(void*, int, AppId_t*, bool*, char*, int);
    fn_t real = (fn_t)g_real_vt[VTIDX_BGetDLCDataByIndex];
    return real ? real(self, iDLC, pAppID, pbAvailable, pchName, cchNameBufferSize) : false;
}

static bool vt_BIsAppInstalled(void *self, AppId_t appID) {
    LOG("api: %s", __PRETTY_FUNCTION__);
    load_config();
    if (is_dlc_owned(appID)) {
        LOG("[vtable] BIsAppInstalled(%u) -> true (UNLOCKED)", appID);
        return true;
    }
    typedef bool (*fn_t)(void*, AppId_t);
    fn_t real = (fn_t)g_real_vt[VTIDX_BIsAppInstalled];
    return real ? real(self, appID) : false;
}

LIB_EXPORT void *SteamInternal_FindOrCreateUserInterface(int hSteamUser, const char *pszVersion) {
    LOG("api: %s", __PRETTY_FUNCTION__);
    ensure_real_lib();
    typedef void* (*fn_t)(int, const char*);
    fn_t real_fn = (fn_t)lib_sym(g_real_lib, "SteamInternal_FindOrCreateUserInterface");
    if (!real_fn) {
        LOG("ERROR: Cannot find real SteamInternal_FindOrCreateUserInterface");
        return NULL;
    }
    void *iface = real_fn(hSteamUser, pszVersion);
    if (!iface) return NULL;

    if (pszVersion && strstr(pszVersion, "STEAMAPPS_INTERFACE_VERSION")) {
        load_config();
        LOG("[vtable] Intercepted ISteamApps interface (%s), patching vtable...", pszVersion);
        void** real_vt = *(void***)iface;
        memcpy(g_real_vt, real_vt, sizeof(g_real_vt));
        memcpy(g_patched_vtable, real_vt, sizeof(g_patched_vtable));
        g_patched_vtable[VTIDX_BIsSubscribed] = (void*)vt_BIsSubscribed;
        g_patched_vtable[VTIDX_BIsSubscribedApp] = (void*)vt_BIsSubscribedApp;
        g_patched_vtable[VTIDX_BIsDlcInstalled] = (void*)vt_BIsDlcInstalled;
        g_patched_vtable[VTIDX_GetEarliestPurchaseUnixTime] = (void*)vt_GetEarliestPurchaseUnixTime;
        g_patched_vtable[VTIDX_GetDLCCount] = (void*)vt_GetDLCCount;
        g_patched_vtable[VTIDX_BGetDLCDataByIndex] = (void*)vt_BGetDLCDataByIndex;
        g_patched_vtable[VTIDX_BIsAppInstalled] = (void*)vt_BIsAppInstalled;
        *(void***)iface = g_patched_vtable;
        g_vtable_patched = true;
        LOG("[vtable] ISteamApps vtable patched with %d DLC overrides", g_dlc_count);
    } else {
        LOG("[vtable] Forwarding interface request: %s", pszVersion ? pszVersion : "(null)");
    }
    return iface;
}

/* ========================================================================= */
/* Module init / fini                                                        */
/* ========================================================================= */

#ifdef _WIN32
#include <windows.h>
void dump_env(void) {
  LPCH env = GetEnvironmentStrings();
  for (LPCH p = env; *p != '\0'; p += strlen(p) + 1)
    LOG("env: %s", p);
  FreeEnvironmentStrings(env);
}

#else
extern char **environ;

void dump_env(void) {
  for (char **e = environ; *e != NULL; e++)
    LOG("env: %s", *e);
}
#endif

void __attribute__((preserve_all, used)) api_hook(void) {
#ifdef _FWD_IDX_SteamInternal_ContextInit
  if (API_ID == _FWD_IDX_SteamInternal_ContextInit)
    return;
#endif
#ifdef _FWD_IDX_SteamAPI_RunCallbacks
  if (API_ID == _FWD_IDX_SteamAPI_RunCallbacks)
    return;
#endif
  LOG("api: %s", _fwd_name[API_ID]);
}

static void creamy_init(void) {
  LOG("start %s", __PRETTY_FUNCTION__);
  // asm volatile("int3");
  // dump_env();
  log_init();
  ensure_real_lib();
  load_config();

  if (!g_real_lib) {
    LOG("FATAL: No real library loaded, forwarding will fail!");
    return;
  }

  LOG("Resolving forwarded symbols...");
  for (int i = 0; i < _FWD_IDX_COUNT; i++)
    _fwd_ptr[i] = lib_sym(g_real_lib, _fwd_name[i]);
  LOG("All symbols resolved. CreamySteamy proxy active with %d DLCs.",
      g_dlc_count);
  LOG("end %s", __PRETTY_FUNCTION__);
}

static void cream_fini(void) {
  LOG("start %s", __PRETTY_FUNCTION__);
  if (g_real_lib) {
    lib_close(g_real_lib);
    g_real_lib = NULL;
  }
  if (g_logfile) {
    fclose(g_logfile);
    g_logfile = NULL;
  }
  LOG("end %s", __PRETTY_FUNCTION__);
}

#ifdef _WIN32
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
  (void)hinstDLL;
  (void)lpvReserved;
  if (fdwReason == DLL_PROCESS_ATTACH)
    creamy_init();
  if (fdwReason == DLL_PROCESS_DETACH)
    cream_fini();
  return TRUE;
}
#else
__attribute__((constructor)) static void proxy_init(void) { creamy_init(); }

__attribute__((destructor)) static void proxy_fini(void) { cream_fini(); }
#endif
