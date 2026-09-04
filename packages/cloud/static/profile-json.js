(function exposeProfileJson(root) {
  function normalizeJsonInput(value) {
    let source = String(value == null ? "" : value).replace(/^\uFEFF/, "").replace(/^\u00a0+|\u00a0+$/g, "").trim();
    const fence = source.match(/^```(?:json)?[\t ]*\r?\n([\s\S]*?)\r?\n```$/i);
    if (fence) source = fence[1].trim();
    let output = ""; let quote = null; let escaped = false; let smartQuotes = false;
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (!quote && (character === "“" || character === "”")) { quote = "smart"; smartQuotes = true; output += '"'; continue; }
      if (!quote && character === '"') { quote = "ascii"; output += character; continue; }
      if (quote === "smart" && character === "”" && !escaped) { quote = null; output += '"'; continue; }
      if (quote === "smart" && character === '"' && !escaped) { output += '\\"'; continue; }
      if (quote === "ascii" && character === '"' && !escaped) { quote = null; output += character; continue; }
      output += character;
      escaped = Boolean(quote && character === "\\" && !escaped);
      if (character !== "\\") escaped = false;
    }
    return { source: output, smartQuotes };
  }

  function duplicateJsonKey(source) {
    const scopes = []; let quote = false; let escaped = false; let start = -1;
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (character === '"' && !escaped) {
          quote = false; let next = index + 1;
          while (/\s/.test(source[next] || "")) next += 1;
          const scope = scopes[scopes.length - 1];
          if (source[next] === ":" && scope instanceof Set) {
            let key;
            try { key = JSON.parse(source.slice(start, index + 1)); } catch { key = source.slice(start + 1, index); }
            if (scope.has(key)) return key;
            scope.add(key);
          }
        }
        escaped = character === "\\" ? !escaped : false;
        continue;
      }
      if (character === '"') { quote = true; escaped = false; start = index; }
      else if (character === "{") scopes.push(new Set());
      else if (character === "[") scopes.push(null);
      else if (character === "}" || character === "]") scopes.pop();
    }
    return null;
  }
  root.ProfileJson = Object.freeze({ normalizeJsonInput, duplicateJsonKey });
})(typeof window === "undefined" ? globalThis : window);
