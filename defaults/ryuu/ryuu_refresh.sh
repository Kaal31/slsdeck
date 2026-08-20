#!/bin/bash
# ryuu_refresh.sh — scrape generator.ryuu.lol/fixes into an appid->fix JSON map.
# Adapted from luatools-moon's ryuu_index.sh, but KEEPS hypervisor-badged fixes
# (tags badge="hypervisor") because this plugin supports the hypervisor + custom
# Proton and routes those into the Denuvo toggle.
#   { "generated","source","count","fixes": { "<appid>":[{"file","badge"}] } }
set -u
OUT="${1:-}"; SRC="${2:-https://generator.ryuu.lol/fixes}"
[ -z "$OUT" ] && { echo "usage: ryuu_refresh.sh <out.json> [src]" >&2; exit 2; }
# Steam's runtime libs break curl; strip them (same trick as elsewhere).
unset LD_LIBRARY_PATH LD_PRELOAD LD_AUDIT STEAM_RUNTIME_LIBRARY_PATH STEAM_ZENITY
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
CT="${CONNECT_TIMEOUT:-15}"; MT="${MAX_TIME:-60}"
TH="$(mktemp 2>/dev/null || echo /tmp/ryuu_h.$$)"; TJ="$(mktemp 2>/dev/null || echo /tmp/ryuu_j.$$)"
trap 'rm -f "$TH" "$TJ"' EXIT
if [ -f "$SRC" ]; then cp "$SRC" "$TH" || exit 1
else curl -fsSL -A "$UA" --connect-timeout "$CT" --max-time "$MT" "$SRC" -o "$TH" || { echo "download failed" >&2; exit 1; }; fi
grep -q 'data-filename="' "$TH" || { echo "no entries" >&2; exit 1; }
GEN="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sed 's/>/>\n/g' "$TH" | awk -v gen="$GEN" -v src="$SRC" '
  function attr(line,key,  re,p,s,q){re=key"=\"";p=index(line,re);if(p==0)return "";s=substr(line,p+length(re));q=index(s,"\"");if(q==0)return "";return substr(s,1,q-1)}
  function unent(s){gsub(/&#39;/,"\x27",s);gsub(/&amp;/,"\\&",s);gsub(/&quot;/,"\"",s);gsub(/&lt;/,"<",s);gsub(/&gt;/,">",s);return s}
  function jesc(s){gsub(/\\/,"\\\\",s);gsub(/"/,"\\\"",s);return s}
  function lc(s){return tolower(s)}
  /data-badge-key="/{bk=attr($0,"data-badge-key");if(bk!="")badges[++nb]=bk;next}
  /data-filename="/{
    fn=attr($0,"data-filename");ap=attr($0,"data-appid");
    if(fn==""||ap!~/^[0-9]+$/){nb=0;delete badges;next}
    fn=unent(fn);
    hyper=(lc(fn)~/hypervisor/)?1:0; badge="";
    for(i=1;i<=nb;i++){if(lc(badges[i])=="hypervisor")hyper=1; badge=badges[i]}
    nb=0;delete badges;
    if(hyper)badge="hypervisor";              # keep, do not drop
    entry="{\"file\":\"" jesc(fn) "\",\"badge\":\"" jesc(badge) "\"}";
    if(ap in data){data[ap]=data[ap]"," entry}else{data[ap]=entry;order[++no]=ap}
    count++
  }
  END{
    printf "{\"generated\":\"%s\",\"source\":\"%s\",\"count\":%d,\"fixes\":{",gen,src,count;
    for(i=1;i<=no;i++){ap=order[i];printf "%s\"%s\":[%s]",(i>1?",":""),ap,data[ap]}
    printf "}}\n"
  }' > "$TJ"
grep -q '"fixes":{' "$TJ" && [ "$(wc -c < "$TJ")" -ge 64 ] || { echo "invalid json" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")" 2>/dev/null
mv -f "$TJ" "$OUT" || exit 1
echo "ryuu_refresh: wrote $OUT"
