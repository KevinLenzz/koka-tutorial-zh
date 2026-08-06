// Build custom highlight.js with Koka support:
//   npm install highlight.js
//   npx esbuild entry.mjs --bundle --minify --format=iife --outfile=../theme/highlight.js
import hljs from "highlight.js/lib/core";

import apache from "highlight.js/lib/languages/apache";
import armasm from "highlight.js/lib/languages/armasm";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import coffeescript from "highlight.js/lib/languages/coffeescript";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import d from "highlight.js/lib/languages/d";
import diff from "highlight.js/lib/languages/diff";
import go from "highlight.js/lib/languages/go";
import handlebars from "highlight.js/lib/languages/handlebars";
import haskell from "highlight.js/lib/languages/haskell";
import http from "highlight.js/lib/languages/http";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import julia from "highlight.js/lib/languages/julia";
import kotlin from "highlight.js/lib/languages/kotlin";
import less from "highlight.js/lib/languages/less";
import lua from "highlight.js/lib/languages/lua";
import makefile from "highlight.js/lib/languages/makefile";
import markdown from "highlight.js/lib/languages/markdown";
import nginx from "highlight.js/lib/languages/nginx";
import nim from "highlight.js/lib/languages/nim";
import nix from "highlight.js/lib/languages/nix";
import objectivec from "highlight.js/lib/languages/objectivec";
import perl from "highlight.js/lib/languages/perl";
import php from "highlight.js/lib/languages/php";
import plaintext from "highlight.js/lib/languages/plaintext";
import properties from "highlight.js/lib/languages/properties";
import python from "highlight.js/lib/languages/python";
import r from "highlight.js/lib/languages/r";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scala from "highlight.js/lib/languages/scala";
import scss from "highlight.js/lib/languages/scss";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import x86asm from "highlight.js/lib/languages/x86asm";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

import koka from "./koka.mjs";

for (const [name, lang] of Object.entries({
  apache, armasm, bash, c, coffeescript, cpp, csharp, css, d, diff, go,
  handlebars, haskell, http, ini, java, javascript, json, julia, kotlin,
  less, lua, makefile, markdown, nginx, nim, nix, objectivec, perl, php,
  plaintext, properties, python, r, ruby, rust, scala, scss, shell, sql,
  swift, typescript, x86asm, xml, yaml, koka,
})) {
  hljs.registerLanguage(name, lang);
}

window.hljs = hljs;
