"""Patch a checked-out Moon source tree with timestamped diagnostics.
Fails closed if upstream logger layout changes, rather than silently shipping an uninstrumented engine.
"""
from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "moon-source")
header = root / "src/log.hpp"
source = root / "src/log.cpp"
h = header.read_text()
c = source.read_text()
needle = 'ofstream << "[" << logLvlToStr(lvl) << "] " << formatted.c_str();'
assert h.count(needle) == 1, "Moon logger format changed; review timestamp patch"
h = h.replace('#include <cstddef>', '#include <chrono>\n#include <ctime>\n#include <unistd.h>\n#include <cstddef>', 1)
h = h.replace(needle, '''const auto now = std::chrono::system_clock::now();
        const auto seconds = std::chrono::system_clock::to_time_t(now);
        const auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()).count() % 1000;
        std::tm utc{};
        gmtime_r(&seconds, &utc);
        char stamp[64];
        std::snprintf(stamp, sizeof(stamp),
                      "%04d-%02d-%02dT%02d:%02d:%02d.%03lldZ",
                      utc.tm_year + 1900, utc.tm_mon + 1, utc.tm_mday,
                      utc.tm_hour, utc.tm_min, utc.tm_sec,
                      static_cast<long long>(millis));
        ofstream << "[" << stamp << " pid=" << getpid() << "] "
                 << "[" << logLvlToStr(lvl) << "] " << formatted.c_str();''', 1)
constructor = 'if (!ofstream.is_open())'
assert c.count(constructor) == 1, "Moon logger constructor changed"
c = c.replace('#include <chrono>', '#include <chrono>\n#include <unistd.h>', 1)
# New session marker, without deleting or rewriting historical entries.
marker = '\t// Resolve the popup language ONCE'
assert c.count(marker) == 1
c = c.replace(marker, '''\t// Session marker correlates native Moon output with the SteamOS boot ID.
    std::ifstream bootFile("/proc/sys/kernel/random/boot_id");
    std::string bootId;
    std::getline(bootFile, bootId);
    ofstream << "[MoonSession boot=" << (bootId.empty() ? "unknown" : bootId)
             << " pid=" << getpid() << "]\\n";
    ofstream.flush();

'''+marker,1)
header.write_text(h)
source.write_text(c)
print("Moon log timestamps + session boot/PID marker applied")
